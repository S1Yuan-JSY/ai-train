import tempfile
import unittest
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app import create_app

class TargetTests(unittest.TestCase):
    def test_targets_roundtrip_and_invalid_value(self):
        with tempfile.TemporaryDirectory() as folder:
            with TestClient(create_app(access_token='test-token',database_path=Path(folder)/'data.sqlite3')) as client:
                headers={'Authorization':'Bearer test-token'}
                state={'version':1,'profile':None,'weights':[],'bodyfats':[],'current':None,'previous':{},'foods':[],'diet':{'date':'2026-11-04','rows':[]},'processed':[], 'nutritionTargets':{'protein':120,'carbs':200,'fat':60},'nutritionRatios':{'protein':2,'carbs':3,'fat':0.8}}
                result=client.put('/memory',headers=headers,json={'revision':0,'state':state})
                self.assertEqual(result.status_code,200,result.text)
                self.assertEqual(client.get('/memory',headers=headers).json()['state']['nutritionTargets'],state['nutritionTargets'])
                self.assertEqual(client.get('/memory',headers=headers).json()['state']['nutritionRatios'],state['nutritionRatios'])
                state['nutritionRatios']['protein']=0
                self.assertEqual(client.put('/memory',headers=headers,json={'revision':1,'state':state}).status_code,422)
