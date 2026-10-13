import asyncio
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langgraph.store.memory import InMemoryStore
from langgraph.checkpoint.memory import InMemorySaver
from backend.agent_memory import AgentMemory, namespace, business_context, postgres_memory
from backend.app import create_app
from backend.metabolism import calculate_bmr


class ToolModel(BaseChatModel):
    """Runs real create_agent/tool/runtime/checkpoint code, without external API calls."""
    replies: list
    cursor: int = 0

    @property
    def _llm_type(self):
        return 'test-tool-model'

    def bind_tools(self, tools, **kwargs):
        return self

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        reply = self.replies[self.cursor]
        self.cursor += 1
        return ChatResult(generations=[ChatGeneration(message=reply)])


def tool_call(name, args):
    return AIMessage(content='', tool_calls=[{'name': name, 'args': args, 'id': 'fixture_call', 'type': 'tool_call'}])


STATE = {'version': 1, 'profile': None, 'weights': [{'value': 60, 'at': '2026-10-08T00:00:00Z'}], 'bodyfats': [], 'current': None, 'previous': {}, 'foods': [], 'diet': {'date': '2026-10-08', 'rows': []}, 'processed': []}


class AccountMemoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / 'memory.sqlite3'
        self.store, self.saver = InMemoryStore(), InMemorySaver()
        self.model = ToolModel(replies=[
            tool_call('remember_preference', {'key': 'training_time', 'source': '我通常晚上训练，每次只有40分钟'}), AIMessage(content='已保存。'),
            tool_call('recall_memories', {'query': '训练时间'}), AIMessage(content='晚上，40分钟。'),
            tool_call('remember_preference', {'key': 'invented', 'source': '用户喜欢早上训练'}), AIMessage(content='未保存猜测。'),
        ])
        self.service = AgentMemory(self.store, self.saver, self.model)
        self.app = create_app(access_token='invite-test', database_path=self.path, agent_memory=self.service)
        self.client = TestClient(self.app)
        self.client.__enter__()
        self.uid = self.register(self.client, 'alice')['user']['id']

    def register(self, client, username):
        result = client.post('/auth/register', json={'username': username, 'password': 'long-test-password'})
        self.assertEqual(result.status_code, 200, result.text)
        self.assertIn('HttpOnly', result.headers['set-cookie'])
        return result.json()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.temp.cleanup()

    def test_account_data_isolation_and_session_restart(self):
        self.assertEqual(self.client.put('/memory', json={'revision': 0, 'state': STATE}).status_code, 200)
        with TestClient(self.app) as bob:
            self.register(bob, 'bob')
            self.assertIsNone(bob.get('/memory').json()['state'])
            self.assertEqual(bob.put('/memory', json={'revision': 0, 'state': {**STATE, 'weights': []}}).status_code, 200)
        self.assertEqual(self.client.get('/memory').json()['state']['weights'][0]['value'], 60)
        cookies = dict(self.client.cookies)
        with TestClient(create_app(access_token='invite-test', database_path=self.path, agent_memory=self.service)) as restarted:
            restarted.cookies.update(cookies)
            self.assertEqual(restarted.get('/auth/me').json()['user']['id'], self.uid)
            self.assertEqual(restarted.get('/memory').json()['state'], STATE)
            self.assertEqual(restarted.post('/auth/logout').status_code, 200)
            self.assertEqual(restarted.get('/memory').status_code, 401)
        # Logged out cookie is revoked server-side, even if a stale copy is replayed.
        self.assertEqual(self.client.get('/auth/me').status_code, 401)
        self.assertEqual(self.client.post('/auth/login', json={'username': 'alice', 'password': 'long-test-password'}).status_code, 200)
        self.assertEqual(self.client.get('/memory').json()['state'], STATE)

    def test_real_agent_tools_cross_thread_recall_and_correction(self):
        first = self.client.post('/agent/chat', json={'text': '记住：我通常晚上训练，每次只有40分钟'}).json()
        self.assertIn('answer', first, first)
        memory = self.client.get('/agent/memories').json()['memories'][0]
        self.assertEqual(memory['text'], '我通常晚上训练，每次只有40分钟')
        second = self.client.post('/agent/chat', json={'text': '我什么时候训练？'}).json()
        self.assertNotEqual(first['thread_id'], second['thread_id'])
        checkpoint = asyncio.run(self.saver.aget_tuple({'configurable': {'thread_id': second['thread_id']}}))
        tool_message = next(m for m in checkpoint.checkpoint['channel_values']['messages'] if m.type == 'tool')
        self.assertIn('40分钟', tool_message.content)
        history = self.client.get(f"/agent/threads/{first['thread_id']}/messages").json()['messages']
        self.assertEqual(history[0]['role'], 'human')
        self.assertEqual(self.client.put('/agent/memories/training_time', json={'text': '现在我只在早上训练'}).status_code, 200)
        self.assertEqual(len(self.client.get('/agent/memories').json()['memories']), 1)
        self.assertEqual(self.client.delete('/agent/memories/training_time').status_code, 200)
        self.assertEqual(self.client.get('/agent/memories').json()['memories'], [])
        # Fabricated source cannot be persisted by an LLM tool call.
        self.client.post('/agent/chat', json={'text': '记住：我喜欢健身'})
        self.assertEqual(self.client.get('/agent/memories').json()['memories'], [])

    def test_memory_namespace_and_thread_ownership(self):
        self.client.put('/agent/memories/training_time', json={'text': '晚上训练'})
        first = self.client.post('/agent/chat', json={'text': '记住：我通常晚上训练，每次只有40分钟'}).json()
        with TestClient(self.app) as bob:
            other_uid = self.register(bob, 'bob')['user']['id']
            self.assertEqual(bob.get('/agent/memories').json()['memories'], [])
            self.assertEqual(bob.post('/agent/chat', json={'text': '读取其他人', 'thread_id': first['thread_id']}).status_code, 404)
            self.assertEqual(bob.get(f"/agent/threads/{first['thread_id']}/messages").status_code, 404)
            self.assertEqual(bob.put('/agent/memories/training_time', json={'text': '早上训练'}).status_code, 200)
            self.assertNotEqual(namespace(self.uid), namespace(other_uid))
        self.assertIn('晚上', self.client.get('/agent/memories').json()['memories'][0]['text'])
        self.assertEqual(self.client.post('/agent/chat', json={'text': '伪造身份', 'user_id': other_uid}).status_code, 422)

    def test_auth_guardrails_and_explicit_legacy_import(self):
        self.assertEqual(self.client.post('/auth/login', json={'username': 'alice', 'password': 'wrong-password'}).status_code, 401)
        self.assertEqual(self.client.post('/memory/import-legacy', json={'invite_token': 'wrong'}).status_code, 403)
        self.assertEqual(self.client.post('/auth/logout', headers={'Origin': 'https://foreign.example'}).status_code, 403)
        legacy = {'Authorization': 'Bearer invite-test'}
        self.client.put('/memory', headers=legacy, json={'revision': 0, 'state': STATE})
        self.assertIsNone(self.client.get('/memory').json()['state'])
        self.assertEqual(self.client.post('/memory/import-legacy', json={'invite_token': 'invite-test'}).status_code, 200)
        self.assertEqual(self.client.post('/memory/import-legacy', json={'invite_token': 'invite-test'}).status_code, 409)
        self.assertEqual(self.client.get('/agent/memories', headers=legacy).status_code, 403)

    def test_without_postgres_uses_persistent_sqlite(self):
        with patch.dict(os.environ, {'POSTGRES_URI': ''}):
            with TestClient(create_app(access_token='invite-test', database_path=self.path)) as client:
                client.cookies.update(dict(self.client.cookies))
                self.assertTrue(client.get('/auth/me').json()['agent_memory'])
                self.assertEqual(client.put('/agent/memories/local',json={'text':'每次40分钟'}).status_code,200)
            with TestClient(create_app(access_token='invite-test', database_path=self.path)) as restored:
                restored.cookies.update(dict(self.client.cookies))
                self.assertEqual(restored.get('/agent/memories').json()['memories'][0]['text'],'每次40分钟')

    def test_numeric_context_calculated_from_authoritative_records(self):
        profile = {'height': 175, 'weight': 60, 'age': 30, 'sex': '男'}
        state = {**STATE, 'profile': profile, 'weights': [*STATE['weights'], {'value': 59, 'at': '2026-10-10T00:00:00Z'}]}
        result = business_context(state)['calculated']
        self.assertAlmostEqual(result['bmr_kcal_per_day'], 1512.24)
        self.assertAlmostEqual(calculate_bmr(60, 175, 30, '女'), 1399.84)
        self.assertEqual(result['weights_change']['per_day'], -0.5)


@unittest.skipUnless(os.getenv('TEST_POSTGRES_URI'), '需要独立测试数据库 TEST_POSTGRES_URI；未验证真实 PostgreSQL')
class PostgresIntegrationTests(unittest.IsolatedAsyncioTestCase):
    async def test_store_and_checkpoint_survive_reconnection(self):
        import secrets
        uid, thread = secrets.token_hex(16), secrets.token_hex(16)
        with patch.dict(os.environ, {'POSTGRES_URI': os.environ['TEST_POSTGRES_URI'], 'MEMORY_EMBEDDING_MODEL': ''}):
            async with postgres_memory() as service:
                await service.store.setup()
                await service.checkpointer.setup()
                service.model = ToolModel(replies=[AIMessage(content='测试会话')])
                await service.put(uid, 'training_time', '晚上训练')
                await service.chat(uid, thread, '你好', STATE)
            async with postgres_memory() as restored:
                self.assertEqual((await restored.list(uid))[0]['text'], '晚上训练')
                checkpoint = await restored.checkpointer.aget_tuple({'configurable': {'thread_id': thread}})
                self.assertEqual(checkpoint.checkpoint['channel_values']['messages'][-1].content, '测试会话')
                await restored.delete(uid, 'training_time')
                await restored.checkpointer.adelete_thread(thread)
