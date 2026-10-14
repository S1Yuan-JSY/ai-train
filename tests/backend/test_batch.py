import json
import tempfile
import unittest
from pathlib import Path
from fastapi.testclient import TestClient
from langchain_core.language_models.fake_chat_models import FakeListChatModel
from backend.app import create_app
from backend.chain import build_chain


class BatchTests(unittest.TestCase):
    def test_batch_parse_validates_every_item_without_saving(self):
        valid = {'type': 'batch', 'actions': [
            {'type': 'set', 'exercise': '卧推', 'weight': 60, 'reps': 8},
            {'type': 'set', 'exercise': '飞鸟', 'weight': 10, 'reps': 12}]}
        invalid = {'type': 'batch', 'actions': [valid['actions'][0],
            {'type': 'set', 'exercise': '飞鸟', 'weight': 10, 'reps': -1}]}
        for payload, status in [(valid, 200), (invalid, 502), ({'type': 'batch', 'actions': []}, 502)]:
            with self.subTest(status=status), tempfile.TemporaryDirectory() as temp:
                chain = build_chain(FakeListChatModel(responses=[json.dumps(payload)]))
                with TestClient(create_app(chain=chain, access_token='test-token', database_path=Path(temp)/'memory.sqlite3')) as client:
                    headers = {'Authorization': 'Bearer test-token'}
                    response = client.post('/parse', headers=headers, json={'text': '多个动作', 'context': {'day': '胸日', 'lastExercise': None, 'foods': []}})
                    self.assertEqual(response.status_code, status)
                    if status == 200:
                        self.assertEqual(response.json()['action'], valid)
                    self.assertIsNone(client.get('/memory', headers=headers).json()['state'])
