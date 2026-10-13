import os
import tempfile
import unittest
from unittest.mock import patch
import httpx
from openai import APIStatusError
from pathlib import Path
from fastapi.testclient import TestClient
from langchain_core.language_models.fake_chat_models import FakeListChatModel
from backend.chain import build_chain, get_chain, get_model
from backend.meals import get_meal_pipeline
from backend.model_errors import meal_error
from backend.app import create_app


class BackendTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / 'memory.sqlite3'
        self.chain = build_chain(FakeListChatModel(responses=['{"type":"set","exercise":"卧推","weight":60,"reps":null}']))
        self.app = create_app(chain=self.chain, access_token='test-token', database_path=self.path)
        self.client = TestClient(self.app)
        self.headers = {'Authorization': 'Bearer test-token'}

    def tearDown(self):
        self.client.close()
        self.temp.cleanup()

    def test_authentication(self):
        self.assertEqual(self.client.get('/health').json()['framework'], 'LangChain')
        self.assertEqual(self.client.get('/memory').status_code, 401)
        self.assertEqual(self.client.get('/memory', headers=self.headers).status_code, 200)

    def test_langchain_json_pipeline(self):
        response = self.client.post('/parse', headers=self.headers, json={'text': '卧推1组60kg', 'context': {'day': '胸日', 'lastExercise': None, 'foods': []}})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['action'], {'type': 'set', 'exercise': '卧推', 'weight': 60.0, 'reps': None})
        self.assertIsNone(self.client.get('/memory', headers=self.headers).json()['state'])

    def test_invalid_model_output_never_writes(self):
        app = create_app(chain=build_chain(FakeListChatModel(responses=['{"type":"set","exercise":"卧推","weight":60,"reps":-1}'])), access_token='test-token', database_path=self.path)
        with TestClient(app) as client:
            result = client.post('/parse', headers=self.headers, json={'text': '测试', 'context': {'day': None, 'lastExercise': None, 'foods': []}})
            self.assertEqual(result.status_code, 502)
            self.assertIn('未保存', result.json()['error'])
            self.assertIsNone(client.get('/memory', headers=self.headers).json()['state'])

    def test_persistent_sqlite_and_revision_conflict(self):
        state = {'version': 1, 'profile': None, 'weights': [{'value': 60, 'at': '2026-10-08T00:00:00Z'}], 'bodyfats': [], 'current': None, 'previous': {}, 'foods': [], 'diet': {'date': '2026-10-08', 'rows': []}, 'processed': []}
        self.assertEqual(self.client.put('/memory', headers=self.headers, json={'revision': 0, 'state': state}).json(), {'revision': 1})
        self.assertEqual(self.client.put('/memory', headers=self.headers, json={'revision': 0, 'state': state}).status_code, 409)
        self.assertEqual(self.client.get('/memory', headers=self.headers).json()['revision'], 1)
        with TestClient(create_app(chain=self.chain, access_token='test-token', database_path=self.path)) as client:
            self.assertEqual(client.get('/memory', headers=self.headers).json()['state'], state)

    def test_real_deepseek_adapter_constructs_without_call(self):
        old = os.environ.get('DEEPSEEK_API_KEY')
        os.environ['DEEPSEEK_API_KEY'] = 'test-only-not-real'
        get_chain.cache_clear()
        try:
            self.assertIsNotNone(get_chain())
        finally:
            get_chain.cache_clear()
            if old is None:
                os.environ.pop('DEEPSEEK_API_KEY', None)
            else:
                os.environ['DEEPSEEK_API_KEY'] = old

    def test_mobile_page_served(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('viewport', response.text)
        self.assertEqual(self.client.get('/web/app.js').status_code, 200)

    def test_meal_missing_key_explains_configuration_without_writing(self):
        get_model.cache_clear()
        get_meal_pipeline.cache_clear()
        with patch.dict(os.environ, {'DEEPSEEK_API_KEY': 'replace_with_new_deepseek_key'}):
            result = self.client.post('/meal/analyze', headers=self.headers, json={'text': '今天吃了200g米饭', 'context': {'day': None, 'lastExercise': None, 'foods': []}})
        self.assertEqual(result.status_code, 503)
        self.assertIn('backend/.env', result.json()['error'])
        self.assertIn('DEEPSEEK_API_KEY', result.json()['error'])
        self.assertIn('未保存', result.json()['error'])
        self.assertIsNone(self.client.get('/memory', headers=self.headers).json()['state'])

    def test_calendar_plan_persistence_and_invalid_dates(self):
        state = {'version': 1, 'profile': None, 'weights': [], 'bodyfats': [], 'current': None, 'previous': {}, 'foods': [], 'diet': {'date': '2026-10-08', 'rows': []}, 'processed': [], 'schedules': [{'date': '2026-10-09', 'day': '胸日', 'time': '19:30', 'duration': 45, 'notes': '卧推3组8次'}]}
        result = self.client.put('/memory', headers=self.headers, json={'revision': 0, 'state': state})
        self.assertEqual(result.status_code, 200, result.text)
        with TestClient(create_app(access_token='test-token', database_path=self.path)) as restarted:
            self.assertEqual(restarted.get('/memory', headers=self.headers).json()['state']['schedules'], state['schedules'])
        invalid = {**state, 'schedules': [{**state['schedules'][0], 'date': '2026-02-29'}]}
        self.assertEqual(self.client.put('/memory', headers=self.headers, json={'revision': 1, 'state': invalid}).status_code, 422)
        duplicate = {**state, 'schedules': state['schedules'] * 2}
        self.assertEqual(self.client.put('/memory', headers=self.headers, json={'revision': 1, 'state': duplicate}).status_code, 422)
        self.assertEqual(self.client.get('/memory', headers=self.headers).json()['revision'], 1)

    def test_meal_api_errors_are_specific_and_never_echo_credentials(self):
        for status, expected in [(401, '密钥无效'), (402, '余额不足'), (404, '模型或接口地址'), (429, '请求过于频繁')]:
            response = httpx.Response(status, request=httpx.Request('POST', 'https://api.deepseek.com/chat/completions'))
            error = APIStatusError('sensitive-test-key', response=response, body={'secret': 'sensitive-test-key'})
            code, message = meal_error(error)
            self.assertEqual(code, 502)
            self.assertIn(expected, message)
            self.assertNotIn('sensitive-test-key', message)
        self.assertEqual(meal_error(TimeoutError())[0], 504)


if __name__ == '__main__':
    unittest.main()
