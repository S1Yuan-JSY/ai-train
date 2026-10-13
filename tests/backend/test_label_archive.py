import copy
import tempfile
import unittest
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app import create_app


class LabelArchiveTests(unittest.TestCase):
    def state(self):
        label = dict(basisAmount=100, basisUnit='g', density=None, energy=836.8,
                     energyUnit='kJ', protein=10, carbs=25, fat=5,
                     extras=[dict(name='钠', amount=120, unit='mg')],
                     text='测试包装标签', confirmedAt='2026-10-11T00:00:00.000Z')
        food = dict(name='标签验收食物', protein=10, carbs=25, fat=5, kcal=200,
                    source='包装标签用户核对', label=label)
        meal = dict(food=food, grams=35)
        return dict(version=1, profile=None, weights=[], bodyfats=[], current=None,
                    previous={}, foods=[food], diet=dict(date='2026-10-11', rows=[meal]),
                    archives={'2026-10-10': dict(meals=[meal], trainings=[dict(
                        day='胸日', at='2026-10-10T08:00:00Z', date='2026-10-10',
                        autoClosed=True, sets=[dict(exercise='卧推', weight=60, reps=8)])])}, processed=[])

    def test_round_trip_account_isolation_and_validation(self):
        with tempfile.TemporaryDirectory() as tmp, TestClient(create_app(
                access_token='test-label-invite', database_path=Path(tmp)/'memory.sqlite3')) as client:
            for username in ['label_user_a', 'label_user_b']:
                self.assertEqual(client.post('/auth/register', json=dict(username=username,
                    password='test-label-password', invite_token='test-label-invite')).status_code,200)
                if username.endswith('a'):
                    state = self.state()
                    self.assertEqual(client.put('/memory', json=dict(revision=0,state=state)).status_code,200)
                    self.assertEqual(client.get('/memory').json()['state']['archives'],state['archives'])
                    bad = copy.deepcopy(state);bad['diet']['rows'][0]['food']['kcal']=999
                    self.assertEqual(client.put('/memory',json=dict(revision=1,state=bad)).status_code,422)
                    bad = copy.deepcopy(state);bad['foods'][0]['label']['basisUnit']='ml'
                    self.assertEqual(client.put('/memory',json=dict(revision=1,state=bad)).status_code,422)
                    self.assertEqual(client.put('/memory',json=dict(revision=0,state=state)).status_code,409)
                else:
                    self.assertIsNone(client.get('/memory').json()['state'])
                client.post('/auth/logout')
            client.post('/auth/login',json=dict(username='label_user_a',password='test-label-password'))
            self.assertEqual(client.get('/memory').json()['state']['diet']['rows'][0]['food']['label']['extras'][0]['amount'],120)
