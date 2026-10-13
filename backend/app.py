import asyncio
import hmac
import json
import os
import sqlite3
import secrets
import time
from contextlib import contextmanager, asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException, Header, Depends, Request, Response, Query
from pydantic import BaseModel, Field, ConfigDict
from starlette.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from .chain import get_chain, parse_record
from .schemas import ParseRequest, MemoryRequest
from .meals import get_meal_pipeline
from .model_errors import meal_error, ModelConfigurationError
from .accounts import Accounts, SESSION_SECONDS
from .agent_memory import runtime_memory
from .schemas import Credentials, Registration, ChatRequest, PreferenceRequest, LegacyImport
from .food_rag import catalog, search_foods, portion_action


class FoodPortionRequest(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)
    food_id: str = Field(pattern=r'^FDC\d+$')
    grams: float = Field(gt=0, le=10000)


def create_app(chain=None, access_token=None, database_path=None, meal_pipeline=None, agent_memory=None):
    @asynccontextmanager
    async def lifespan(app):
        if agent_memory is not None:
            app.state.agent_memory = agent_memory
            yield
        else:
            async with runtime_memory(path) as memory:
                if memory is not None:
                    # Fail startup for an unreachable/uninitialized database, rather than
                    # advertising an enabled memory service that cannot persist anything.
                    await memory.store.asearch(('fitness', '_startup_check'), limit=1)
                    await memory.checkpointer.aget_tuple({'configurable': {'thread_id': '_startup_check'}})
                app.state.agent_memory = memory
                yield
    app = FastAPI(title='爱练 · LangChain', docs_url=None, redoc_url=None, lifespan=lifespan)
    app.state.agent_memory = agent_memory
    token = access_token or os.getenv('APP_ACCESS_TOKEN', '')
    path = Path(database_path or os.getenv('MEMORY_DB', str(Path(__file__).parent / 'data' / 'memory.sqlite3')))
    accounts = Accounts(path)
    public_origin = os.getenv('PUBLIC_ORIGIN', '').strip().rstrip('/')
    if os.getenv('APP_ENV') == 'production':
        from urllib.parse import urlsplit
        if not public_origin.startswith('https://') or not urlsplit(public_origin).hostname:
            raise RuntimeError('生产环境请填写 PUBLIC_ORIGIN=https://你的域名')
        if token and (len(token) < 32 or token.startswith('replace_')):
            raise RuntimeError('启用旧数据令牌时 APP_ACCESS_TOKEN 至少32字符，请生成随机值')
        if os.getenv('COOKIE_SECURE', '').lower() != 'true':
            raise RuntimeError('生产环境必须设置 COOKIE_SECURE=true')
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=[urlsplit(public_origin).hostname, 'localhost', '127.0.0.1'])

    @contextmanager
    def connect():
        path.parent.mkdir(parents=True, exist_ok=True)
        db = sqlite3.connect(path, timeout=10)
        try:
            db.execute('PRAGMA journal_mode=WAL')
            db.execute('CREATE TABLE IF NOT EXISTS memory(id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, json TEXT NOT NULL)')
            with db:
                yield db
        finally:
            db.close()

    @app.middleware('http')
    async def same_origin(request: Request, call_next):
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            origin = request.headers.get('origin')
            expected = public_origin or str(request.base_url).rstrip('/')
            if origin and origin != expected:
                return JSONResponse(status_code=403, content={'detail': '不允许跨站写入'})
        return await call_next(request)

    def valid_invite(value):
        return bool(token and not token.startswith('replace_') and hmac.compare_digest(value.encode(), token.encode()))

    def auth(request: Request, authorization: str | None = Header(default=None)):
        if authorization:
            if os.getenv('APP_ENV') == 'production' and os.getenv('ENABLE_LEGACY_TOKEN', 'false').lower() != 'true':
                raise HTTPException(403, '生产环境已关闭旧版共享令牌，请使用个人账号登录')
            if valid_invite(authorization.removeprefix('Bearer ')) and authorization.startswith('Bearer '):
                return {'id': 'legacy', 'username': '旧版共享档案'}
            raise HTTPException(401, '访问令牌不正确')
        user = accounts.identify(request.cookies.get('fit_session', ''))
        if not user:
            raise HTTPException(401, '请登录账号')
        return user

    def account_user(user=Depends(auth)):
        if user['id'] == 'legacy':
            raise HTTPException(403, 'Agent 长期记忆需要登录独立账号')
        return user

    def rate_limit(request):
        bucket = int(time.time() // 600)
        ip = request.client.host if request.client else 'unknown'
        with accounts.connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS auth_attempts(ip TEXT,bucket INTEGER,count INTEGER,PRIMARY KEY(ip,bucket))')
            db.execute('DELETE FROM auth_attempts WHERE bucket<?', (bucket - 1,))
            db.execute('INSERT INTO auth_attempts VALUES(?,?,1) ON CONFLICT(ip,bucket) DO UPDATE SET count=count+1', (ip, bucket))
            count = db.execute('SELECT count FROM auth_attempts WHERE ip=? AND bucket=?', (ip, bucket)).fetchone()[0]
        if count > 30:
            raise HTTPException(429, '登录尝试过多，请10分钟后重试')

    def set_session(response, uid):
        response.set_cookie('fit_session', accounts.session(uid), httponly=True, secure=os.getenv('COOKIE_SECURE', 'false').lower() == 'true', samesite='strict', max_age=SESSION_SECONDS, path='/')

    @app.post('/auth/register')
    def register(body: Registration, request: Request, response: Response):
        rate_limit(request)
        try:
            uid = accounts.register(body.username, body.password)
        except sqlite3.IntegrityError:
            raise HTTPException(409, '用户名已存在')
        set_session(response, uid)
        return {'user': {'id': uid, 'username': body.username}}

    @app.post('/auth/login')
    def login(body: Credentials, request: Request, response: Response):
        rate_limit(request)
        uid = accounts.login(body.username, body.password)
        if not uid:
            raise HTTPException(401, '用户名或密码不正确')
        set_session(response, uid)
        return {'user': {'id': uid, 'username': body.username}}

    @app.get('/auth/me')
    def me(user=Depends(auth)):
        return {'user': user, 'agent_memory': app.state.agent_memory is not None, 'semantic_search': bool(app.state.agent_memory and app.state.agent_memory.semantic)}

    @app.post('/auth/logout')
    def logout(request: Request, response: Response):
        accounts.logout(request.cookies.get('fit_session', ''))
        response.delete_cookie('fit_session', path='/')
        return {'ok': True}

    def load_state(uid):
        if uid == 'legacy':
            with connect() as db:
                row = db.execute('SELECT revision,json FROM memory WHERE id=1').fetchone()
        else:
            with accounts.connect() as db:
                row = db.execute('SELECT revision,json FROM user_memory WHERE user_id=?', (uid,)).fetchone()
        return {'revision': row[0], 'state': json.loads(row[1])} if row else {'revision': 0, 'state': None}

    def memory_service():
        if app.state.agent_memory is None:
            raise HTTPException(503, '未启用 Agent 长期记忆：请配置 POSTGRES_URI 并运行 python -m backend.setup_memory')
        return app.state.agent_memory

    @app.get('/health')
    def health():
        return {'ok': True, 'framework': 'LangChain'}

    @app.post('/parse', dependencies=[Depends(auth)])
    async def parse(request: ParseRequest):
        try:
            action = await asyncio.wait_for(parse_record(chain or get_chain(), request), timeout=28)
            return {'action': action}
        except ModelConfigurationError as exc:
            return JSONResponse(status_code=503, content={'error': str(exc)})
        except Exception:
            return JSONResponse(status_code=502, content={'error': 'LangChain 解析失败、服务超时或未配置模型，未保存记录。可使用离线明确格式。'})

    @app.get('/memory')
    def read_memory(user=Depends(auth)):
        return load_state(user['id'])

    @app.get('/nutrition/search', dependencies=[Depends(auth)])
    def nutrition_search(q: str = Query(default='', max_length=200),
                         category: str = Query(default='', max_length=30),
                         method: str = Query(default='', max_length=30),
                         offset: int = Query(default=0, ge=0),
                         limit: int = Query(default=12, ge=1, le=50)):
        data = catalog()
        matches = search_foods(q, limit=len(data['foods']), category=category, method=method)
        return {'foods': matches[offset:offset + limit], 'total': len(matches),
                'offset': offset, 'limit': limit,
                'categories': sorted({r['category'] for r in data['foods']}),
                'count': len(data['foods']), 'metadata': data['metadata']}

    @app.post('/nutrition/portion', dependencies=[Depends(auth)])
    def nutrition_portion(body: FoodPortionRequest):
        row = next((r for r in catalog()['foods'] if r['id'] == body.food_id), None)
        if row is None:
            raise HTTPException(404, '未找到该官方食物条目')
        return {'action': portion_action(row, body.grams)}

    @app.post('/meal/analyze', dependencies=[Depends(auth)])
    async def analyze_meal(request: ParseRequest):
        try:
            action=await asyncio.wait_for((meal_pipeline or get_meal_pipeline()).ainvoke(request.text), timeout=55)
            return {'action':action}
        except Exception as exc:
            status, message = meal_error(exc)
            return JSONResponse(status_code=status, content={'error': message})

    @app.put('/memory')
    def write_memory(request: MemoryRequest, user=Depends(auth)):
        state = request.state.model_dump(exclude_unset=True)
        body = json.dumps(state, ensure_ascii=False, allow_nan=False)
        if len(body.encode()) > 4 * 1024 * 1024:
            raise HTTPException(413, '数据超过4MB，请导出并整理历史')
        uid = user['id']
        with (connect() if uid == 'legacy' else accounts.connect()) as db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute('SELECT revision FROM memory WHERE id=1').fetchone() if uid == 'legacy' else db.execute('SELECT revision FROM user_memory WHERE user_id=?', (uid,)).fetchone()
            revision = row[0] if row else 0
            if request.revision != revision:
                raise HTTPException(409, '数据已在其他页面更新，请重新载入后再记录')
            if uid == 'legacy':
                db.execute('INSERT INTO memory(id,revision,json) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,json=excluded.json', (revision + 1, body))
            else:
                db.execute('INSERT INTO user_memory VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET revision=excluded.revision,json=excluded.json', (uid, revision + 1, body))
        return {'revision': revision + 1}

    @app.post('/memory/import-legacy')
    def import_legacy(body: LegacyImport, user=Depends(account_user)):
        if not valid_invite(body.invite_token):
            raise HTTPException(403, '旧档案访问令牌不正确')
        old = load_state('legacy')
        if old['state'] is None:
            raise HTTPException(404, '没有旧版档案')
        # Import is explicit and only permitted into an empty account.
        with accounts.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            if db.execute('SELECT 1 FROM user_memory WHERE user_id=?', (user['id'],)).fetchone():
                raise HTTPException(409, '账号已有档案，不能覆盖导入')
            db.execute('INSERT INTO user_memory VALUES(?,1,?)', (user['id'], json.dumps(old['state'], ensure_ascii=False)))
        return {'revision': 1, 'state': old['state']}

    @app.get('/agent/memories')
    async def list_memories(user=Depends(account_user)):
        return {'memories': await memory_service().list(user['id'])}

    @app.put('/agent/memories/{key}')
    async def put_preference(key: str, body: PreferenceRequest, user=Depends(account_user)):
        import re
        if not re.fullmatch(r'[a-zA-Z0-9_\-]{1,80}', key):
            raise HTTPException(422, '主题 key 使用字母、数字、下划线或短横线，最长80字符')
        return await memory_service().put(user['id'], key, body.text)

    @app.delete('/agent/memories/{key}')
    async def delete_preference(key: str, user=Depends(account_user)):
        await memory_service().delete(user['id'], key)
        return {'ok': True}

    @app.get('/agent/threads')
    def list_threads(user=Depends(account_user)):
        with accounts.connect() as db:
            rows = db.execute('SELECT id,created FROM agent_threads WHERE user_id=? ORDER BY created DESC LIMIT 100', (user['id'],)).fetchall()
        return {'threads': [{'id': row[0], 'created': row[1]} for row in rows]}

    @app.post('/agent/chat')
    async def chat(body: ChatRequest, user=Depends(account_user)):
        service = memory_service()
        uid = user['id']
        thread = body.thread_id or secrets.token_hex(16)
        with accounts.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            if body.thread_id:
                if not db.execute('SELECT 1 FROM agent_threads WHERE id=? AND user_id=?', (thread, uid)).fetchone():
                    raise HTTPException(404, '会话不存在')
            else:
                db.execute('INSERT INTO agent_threads VALUES(?,?,?)', (thread, uid, time.time()))
            db.execute('CREATE TABLE IF NOT EXISTS thread_locks(id TEXT PRIMARY KEY,expires REAL)')
            db.execute('DELETE FROM thread_locks WHERE expires<?', (time.time(),))
            try:
                db.execute('INSERT INTO thread_locks VALUES(?,?)', (thread, time.time() + 120))
            except sqlite3.IntegrityError:
                raise HTTPException(409, '该会话正在回答，请稍后再试')
        try:
            result = await asyncio.wait_for(service.chat(uid, thread, body.text, load_state(uid)['state']), timeout=85)
            with accounts.connect() as db:
                db.execute('CREATE TABLE IF NOT EXISTS chat_sources(thread TEXT,message TEXT,sources TEXT,PRIMARY KEY(thread,message))')
                db.execute('INSERT OR REPLACE INTO chat_sources VALUES(?,?,?)', (thread,result.get('message_id',''),json.dumps(result.get('sources',[]),ensure_ascii=False)))
            return result
        except ModelConfigurationError as exc:
            return JSONResponse(status_code=503, content={'error': str(exc), 'thread_id': thread})
        except Exception:
            return JSONResponse(status_code=502, content={'error': 'Agent 调用失败或超时；部分工具可能已保存，请查看记忆列表后重试。', 'thread_id': thread})
        finally:
            with accounts.connect() as db:
                db.execute('DELETE FROM thread_locks WHERE id=?', (thread,))

    @app.get('/agent/threads/{thread}/messages')
    async def thread_messages(thread: str, user=Depends(account_user)):
        service = memory_service()
        with accounts.connect() as db:
            if not db.execute('SELECT 1 FROM agent_threads WHERE id=? AND user_id=?', (thread, user['id'])).fetchone():
                raise HTTPException(404, '会话不存在')
        checkpoint = await service.checkpointer.aget_tuple({'configurable': {'thread_id': thread}})
        messages = checkpoint.checkpoint.get('channel_values', {}).get('messages', []) if checkpoint else []
        with accounts.connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS chat_sources(thread TEXT,message TEXT,sources TEXT,PRIMARY KEY(thread,message))')
            sources = {row[0]: json.loads(row[1]) for row in db.execute('SELECT message,sources FROM chat_sources WHERE thread=?',(thread,))}
        return {'messages': [{'role': msg.type, 'content': msg.content, 'sources': sources.get(msg.id,[])} for msg in messages if msg.type in ('human', 'ai') and msg.content]}

    root = Path(__file__).parent.parent / 'frontend' / 'public'
    @app.get('/')
    def index():
        return FileResponse(root / 'index.html')

    app.mount('/web', StaticFiles(directory=root), name='web')
    return app


app = create_app()
