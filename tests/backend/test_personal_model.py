import asyncio, json, sqlite3, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
from langchain_core.language_models.fake_chat_models import FakeListChatModel
from backend.accounts import Accounts
from backend.app import create_app
from backend.model_accounts import ModelAccounts
from backend.model_errors import ModelConfigurationError

class PersonalModelTests(unittest.TestCase):
    def test_migration_preserves_old_user_and_memory_and_no_regrant(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'memory.sqlite3';a=Accounts(path);uid=a.register('olduser','old-user-password')
            session=a.session(uid)
            with a.connect() as db:
                db.execute('INSERT INTO user_memory VALUES(?,?,?)',(uid,7,'{"untouched":true}'))
                before=[db.execute('SELECT * FROM '+table).fetchall() for table in ['users','user_memory','sessions']]
            service=ModelAccounts(a)
            self.assertIsNone(service.resolve(uid));self.assertIsNotNone(a.identify(session))
            with a.connect() as db:
                after=[db.execute('SELECT * FROM '+table).fetchall() for table in ['users','user_memory','sessions']]
                db.execute('DELETE FROM model_accounts WHERE user_id=?',(uid,))
            self.assertEqual(before,after)
            with self.assertRaises(ModelConfigurationError):ModelAccounts(a).resolve(uid)

    def test_registration_key_encrypted_rotation_and_no_leak(self):
        with tempfile.TemporaryDirectory() as tmp, TestClient(create_app(database_path=Path(tmp)/'memory.sqlite3')) as c:
            creds={'username':'personal','password':'test-password-123'}
            self.assertEqual(c.post('/auth/register',json=creds).status_code,422)
            bad=c.post('/auth/register',json={**creds,'model_name':'m','api_key':'x y secret value'})
            self.assertEqual(bad.status_code,422);self.assertNotIn('x y secret value',bad.text)
            key='new-personal-api-secret'
            result=c.post('/auth/register',json={**creds,'model_name':'my-model','api_key':key})
            self.assertEqual(result.status_code,200,result.text);uid=result.json()['user']['id']
            service=ModelAccounts(Accounts(Path(tmp)/'memory.sqlite3'))
            self.assertEqual(service.resolve(uid)['api_key'],key)
            with service.accounts.connect() as db:
                self.assertNotIn(key,repr(db.execute('select * from model_accounts').fetchall()))
            self.assertNotIn(key,c.get('/auth/me').text)
            self.assertEqual(c.put('/account/model',json={'model_name':'changed','api_key':'changed-secret-key'}).status_code,200)
            self.assertEqual(service.resolve(uid)['model'],'changed')
            c.post('/auth/logout')
            self.assertEqual(c.post('/auth/login',json=creds).status_code,200)
            self.assertEqual(c.post('/auth/register',json={**creds,'model_name':'a','api_key':key}).status_code,409)

    def test_parse_and_meal_route_personal_keys_without_site_fallback(self):
        with tempfile.TemporaryDirectory() as tmp, TestClient(create_app(database_path=Path(tmp)/'memory.sqlite3')) as c:
            keys=[]
            def model(config):
                keys.append(config['api_key'])
                return FakeListChatModel(responses=[json.dumps({'type':'ask','message':'请补充'}),json.dumps({'items':[{'item_index':0,'grams':30,'portion_min':30,'portion_max':30,'protein_per100g':70,'fat_per100g':5,'carbs_per100g':10,'assumptions':['测试估算']}]})])
            with patch('backend.app.personal_model',side_effect=model),patch('backend.app.get_chain',side_effect=AssertionError('site fallback')),patch('backend.app.get_meal_pipeline',side_effect=AssertionError('site fallback')):
                for name in ['alice','bob']:
                    key=name+'-personal-key'
                    c.post('/auth/register',json={'username':name,'password':'test-password-123','model_name':'my-model','api_key':key})
                    payload={'text':'测试','context':{'day':None,'lastExercise':None,'foods':[]}}
                    self.assertEqual(c.post('/parse',json=payload).status_code,200)
                    # Separate model response for the meal route.
                    with patch('backend.app.personal_model',side_effect=lambda config:(keys.append(config['api_key']) or FakeListChatModel(responses=[json.dumps({'items':[{'item_index':0,'grams':30,'portion_min':30,'portion_max':30,'protein_per100g':70,'fat_per100g':5,'carbs_per100g':10,'assumptions':['测试估算']}]})]))):
                        self.assertEqual(c.post('/meal/analyze',json={**payload,'text':'吃了30g蛋白粉'}).status_code,200)
                self.assertEqual(keys,['alice-personal-key']*2+['bob-personal-key']*2)
                with patch('backend.app.personal_model',side_effect=RuntimeError('provider failure')):
                    self.assertEqual(c.post('/parse',json=payload).status_code,502)

    def test_chat_routes_by_user(self):
        class Service:
            semantic=False
            seen=[]
            async def chat(self,uid,thread,text,state,model_config=None):
                self.seen.append((uid,model_config['api_key']))
                return {'answer':'ok','sources':[],'message_id':'test'}
        with tempfile.TemporaryDirectory() as tmp:
            service=Service()
            with TestClient(create_app(database_path=Path(tmp)/'memory.sqlite3',agent_memory=service)) as c:
                result=c.post('/auth/register',json={'username':'alice','password':'test-password-123','model_name':'m','api_key':'alice-secret-key'})
                uid=result.json()['user']['id']
                self.assertEqual(c.post('/agent/chat',json={'text':'你好'}).status_code,200)
                self.assertEqual(service.seen,[(uid,'alice-secret-key')])

    def test_cipher_missing_or_corrupt_never_falls_back(self):
        with tempfile.TemporaryDirectory() as tmp:
            a=Accounts(Path(tmp)/'memory.sqlite3');service=ModelAccounts(a)
            uid=a.register('alice','test-password',('m',service.encrypt,'test-personal-key'))
            with a.connect() as db:db.execute('UPDATE model_accounts SET cipher=? WHERE user_id=?',('broken',uid))
            with self.assertRaises(ModelConfigurationError):service.resolve(uid)
            service.key_path.unlink()
            with self.assertRaises(RuntimeError):ModelAccounts(a)
