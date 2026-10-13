> 私教RAG更新：默认已支持SQLite持久化，旧文中的PostgreSQL必选说明已被替代。请以 [COACH-RAG.md](COACH-RAG.md) 为准。

# 账号与 Agent 长期记忆

项目仅保留适配手机的网页版。

## 实现位置

- `backend/accounts.py`：账号、scrypt 密码哈希、30天会话、注销撤销。会话 Cookie 为 HttpOnly / SameSite=Strict，不写 localStorage。
- `backend/app.py`：注册、登录、自动恢复、按身份隔离业务数据、旧档案显式导入、Agent 对话和记忆管理接口。
- `backend/agent_memory.py`：真正的 `create_agent(..., store=..., checkpointer=..., context_schema=...)`。服务生命周期使用 AsyncPostgresStore 和 AsyncPostgresSaver，进程退出后 PostgreSQL 保留数据。
- `backend/setup_memory.py`：官方 Store / Saver 表迁移。
- `frontend/public/app.js` / `frontend/public/index.html`：账号、会话选择、长期记忆查看/修改/删除和助手对话。

## 三层存储与准确性

1. 业务记录存于 SQLite `user_memory`，按服务端登录身份取得 user_id，使用 revision 防止覆盖。体重、训练和饮食是权威数据；既有 `memory(id=1)` 共享档案保留。
2. 跨会话偏好和经历存于 PostgresStore，namespace 为 `('fitness', user_id, 'memories')`，key 为稳定主题。存用户原话、来源、更新时间和用户陈述类型。相同 key 覆盖旧偏好，支持删除。
3. 聊天上下文存于 PostgresSaver，按服务端创建并校验归属的 thread_id 隔离。新会话仍读取该用户 Store，同一会话可以恢复消息历史。

每轮显式加载档案（包括选填限制），由代码计算基础代谢、测量变化率及饮食合计。Agent 不通过模糊检索获取权威数值。`read_fitness_records` 读业务记录；`recall_memories` 检索偏好；`remember_preference` 只接受本轮有记忆意图/明确偏好、且来源确为本轮原文的写入。模型不能传入另一个 user_id。

模型可能误解用户偏好，因此记忆列表支持检查和纠正。工具写入即时提交，之后模型调用失败时也可能已经保存；错误提示会提醒检查列表。删除 Store 记忆不会删除旧会话原文，想避免旧上下文影响请开启新会话。此项目不提供医疗判断。

## 启用 PostgreSQL

项目目录下操作，需要 Python 3.11+ 和可用的 PostgreSQL（本机、远程或 Docker）。

1. 创建 `backend/.env`（已有文件请直接编辑，不能覆盖现有配置），填写新的 DeepSeek Key、随机 APP_ACCESS_TOKEN、POSTGRES_PASSWORD 和 POSTGRES_URI。示例：

```dotenv
POSTGRES_PASSWORD=replace_with_random_database_password
POSTGRES_URI=postgresql://fitness:replace_with_random_database_password@localhost:5432/fitness?connect_timeout=10
COOKIE_SECURE=false
```

URI 中密码如果含特殊字符，需要 URL 编码。Docker 环境的 POSTGRES_PASSWORD 是原始密码。已有 PostgreSQL 可直接用自己的连接 URI，无需 Docker。配置 `COOKIE_SECURE=true` 时网页必须通过 HTTPS 访问，局域网 HTTP 调试设 false。

2. Docker 方式创建带持久卷的数据库（已有远程数据库可跳过）：

```powershell
docker compose --env-file backend/.env up -d
```

3. 安装并初始化：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.lock.txt
python -m backend.setup_memory
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8787 --env-file backend/.env --no-access-log
```

也可使用 scripts/start-web.ps1 安装的 `.python-deps-web-v3`：设置 `$env:PYTHONPATH = "$PWD\.python-deps-web-v3"` 后执行 `python -m backend.setup_memory`，再重启服务。

初始化命令幂等。更换数据库后要重新初始化。服务使用异步 Store/Saver 与工具，适配 FastAPI；不会每次请求重复迁移。

POSTGRES_URI 为空时业务记录和账号仍可运行，助手显示未启用并返回503，不会偷偷改用易丢失的 InMemoryStore。PostgreSQL连接失败会阻止启用服务，应修复配置后重启。

## 可选语义检索

PostgresStore 的持久记忆无需 Embedding；不配置时按 namespace/key 加载。语义相似度搜索需要兼容 OpenAI Embeddings 接口的独立服务，并启用 pgvector。不能直接将 DeepSeek 聊天模型当成 Embedding 模型。

```dotenv
MEMORY_EMBEDDING_MODEL=your_embedding_model
MEMORY_EMBEDDING_API_KEY=your_embedding_key
MEMORY_EMBEDDING_BASE_URL=https://your-embedding-provider.example/v1
MEMORY_EMBEDDING_DIMS=1536
```

维度必须匹配实际模型。配置后重新运行 setup_memory，再重启。已有未索引的记忆需要重新保存才能生成向量；更换模型/维度需要另建索引数据库或迁移，不能盲目复用原索引。没有向量检索时每轮仍加载当前用户最多100条偏好，当前是个人使用规模。

## 用户操作与验收

1. 设置页填写用户名、至少10字符密码、注册邀请码（APP_ACCESS_TOKEN），注册会自动登录。
2. 档案页完善必填项，记录页保存测量与训练。刷新网页应自动恢复。
3. 助手输入“记住：我通常晚上训练，每次只有40分钟”。记忆列表可看到原话、主题和更新时间。
4. 选择“新会话”，询问“我通常什么时候训练，有多久？”。Agent 从 Store 读取偏好。
5. 编辑同主题为“现在改成早上训练”，再开启新会话确认；删除后查看记忆列表应为空。
6. 退出登录，另一账号应看不到你的记录、记忆和会话。
7. 服务和数据库重启后，用同一账号登录，业务记录、长期记忆和会话仍存在。必须保留 SQLite 文件及 PostgreSQL 数据卷。

旧共享档案不会自动归属第一个注册用户。空账号登录后，点击“导入旧版共享档案”，输入旧 APP_ACCESS_TOKEN 进行复制，禁止覆盖已有档案。

Agent 在线调用会发送当前档案、测量/训练/饮食记录、记忆及会话上下文至 DeepSeek；可选 Embedding 会将记忆文本发送至对应供应商。业务导出 JSON 不包含 Store 或会话，完整备份需要备份 SQLite 和 PostgreSQL。账号尚无密码重置、邮箱验证和跨服务器身份同步。

## 测试

```powershell
python -m unittest discover -s tests/backend -p 'test_*.py' -v
```

本地测试使用 InMemoryStore / InMemorySaver 和模拟模型，只用于测试；运行实际 create_agent、工具、runtime 和 checkpoint 流程。真实数据库测试单独运行，必须设置独立测试库（不要用正式用户库）：

```powershell
$env:TEST_POSTGRES_URI='postgresql://fitness:password@localhost:5432/fitness_test'
python -m unittest discover -s tests/backend -p test_agent_memory.py -v
```

该测试执行表初始化、写入 Store、保存 Agent 会话、关闭连接后重新连接恢复，最后删除测试记忆和会话。未设置时明确跳过，不视为真实 PostgreSQL 已验收。

参考：[LangChain 长期记忆](https://docs.langchain.com/oss/python/langchain/long-term-memory)、[LangGraph PostgreSQL 记忆](https://docs.langchain.com/oss/python/langgraph/add-memory)。
