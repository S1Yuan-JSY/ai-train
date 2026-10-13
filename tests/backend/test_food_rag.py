import asyncio
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
from langchain_core.language_models.fake_chat_models import FakeListChatModel
from backend.food_rag import catalog, match_meal, search_foods
from backend.meals import MealPipeline
from backend.app import create_app
from backend.chain import get_model, get_chain


class FoodRAGTests(unittest.TestCase):
    def test_official_numbers_trace_back_to_raw_csv_rows(self):
        rows = json.loads((Path(__file__).resolve().parents[2] / 'knowledge/nutrition/source_rows.json').read_text(encoding='utf-8'))
        original = {(r['fdc_id'], r['nutrient_id']): float(r['amount']) for r in rows['nutrients']}
        self.assertGreaterEqual(len(catalog()['foods']),120)
        for food in catalog()['foods']:
            for key, nid in [('kcal','1008'),('protein','1003'),('fat','1004'),('carbs','1005')]:
                self.assertEqual(food['per100g'][key],original[(str(food['fdc_id']),nid)])

    def test_extended_nutrients_trace_back_and_missing_stays_unknown(self):
        root = Path(__file__).resolve().parents[2] / 'knowledge/nutrition'
        rows = json.loads((root / 'source_rows.json').read_text(encoding='utf-8'))
        original = {(r['fdc_id'], r['nutrient_id']): float(r['amount']) for r in rows['nutrients']}
        ids = {'fiber':'1079','calcium':'1087','iron':'1089','magnesium':'1090','potassium':'1092','sodium':'1093','zinc':'1095','vitaminC':'1162'}
        for food in catalog()['foods']:
            for key, nid in ids.items():
                self.assertEqual(food['nutrientsPer100g'][key], original.get((str(food['fdc_id']), nid)))
        for query in ['冬瓜','小白菜','莲藕','茼蒿','毛豆','绿豆']:
            self.assertTrue(search_foods(query, method='boiled'), query)

    def test_browsing_filters_pagination_and_boundaries(self):
        with tempfile.TemporaryDirectory() as temp, TestClient(create_app(access_token='test-token',database_path=Path(temp)/'memory.sqlite3')) as client:
            headers = {'Authorization':'Bearer test-token'}
            first = client.get('/nutrition/search?method=boiled&limit=12',headers=headers).json()
            second = client.get('/nutrition/search?method=boiled&limit=12&offset=12',headers=headers).json()
            self.assertGreater(first['total'], 40)
            self.assertTrue(all(r['method']=='boiled' for r in first['foods']))
            self.assertFalse({r['id'] for r in first['foods']} & {r['id'] for r in second['foods']})
            self.assertEqual(client.get('/nutrition/search?offset=-1',headers=headers).status_code,422)
            self.assertEqual(client.get('/nutrition/search?limit=999',headers=headers).status_code,422)
            self.assertEqual(client.get('/nutrition/search?q=不存在的宇宙食物',headers=headers).json()['total'],0)

    def test_preparations_and_mixtures_are_not_mislabelled(self):
        self.assertEqual(match_meal('200g米饭')['per100g']['kcal'],130)
        self.assertNotEqual(match_meal('200g生米')['id'],match_meal('200g米饭')['id'])
        self.assertIn('炖',match_meal('炖鸡小腿')['name'])
        for text in ['炒米饭','炸琵琶腿','生西兰花','低脂牛奶','牛奶巧克力','带皮鸡胸肉','宫保鸡丁','去皮苹果','鸡蛋炒饭']:
            self.assertIsNone(match_meal(text),text)
        self.assertEqual(search_foods('不存在的宇宙食物'),[])
        self.assertEqual(match_meal('100g熟胡萝卜')['method'], 'boiled')
        for text in ['蒸西兰花','油泼水煮白菜','麻辣水煮牛肉','水煮鲜香菇']:
            self.assertIsNone(match_meal(text), text)

    def test_unmatched_food_keeps_explicit_model_label(self):
        extraction={'items':[{'name':'宫保鸡丁','raw_text':'200g宫保鸡丁','quantity':200,'unit':'g'}]}
        analysis={'items':[{'item_index':0,'grams':999,'portion_min':100,'portion_max':1000,'protein_per100g':15,'carbs_per100g':10,'fat_per100g':8,'assumptions':['菜谱未知，模型估算']} ]}
        pipeline=MealPipeline(FakeListChatModel(responses=[json.dumps(extraction),json.dumps(analysis)]))
        row=asyncio.run(pipeline.ainvoke('吃了200g宫保鸡丁'))['items'][0]
        self.assertEqual(row['grams'],200)
        self.assertEqual(row['estimate']['nutritionBasis'],'model')
        self.assertNotIn('sourceId',row['estimate'])
        self.assertEqual(row['food']['kcal'],172)

    def test_authenticated_reference_portion_and_persistence(self):
        with tempfile.TemporaryDirectory() as temp, TestClient(create_app(access_token='test-token',database_path=Path(temp)/'memory.sqlite3')) as client:
            self.assertEqual(client.get('/nutrition/search?q=米饭').status_code,401)
            headers={'Authorization':'Bearer test-token'}
            results=client.get('/nutrition/search?q=米饭',headers=headers).json()
            self.assertTrue(results['foods'])
            result=client.post('/nutrition/portion',headers=headers,json={'food_id':'FDC169757','grams':200}).json()['action']
            row=result['items'][0]
            self.assertEqual(row['food']['kcal']*row['grams']/100,260)
            self.assertEqual(client.post('/nutrition/portion',headers=headers,json={'food_id':'FDC1','grams':200}).status_code,404)
            self.assertEqual(client.post('/nutrition/portion',headers=headers,json={'food_id':'FDC169757','grams':-1}).status_code,422)
            state={'version':1,'profile':None,'weights':[],'bodyfats':[],'current':None,'previous':{},'foods':[],'diet':{'date':'2026-10-11','rows':[row]},'processed':[]}
            self.assertEqual(client.put('/memory',headers=headers,json={'revision':0,'state':state}).status_code,200)
            self.assertEqual(client.get('/memory',headers=headers).json()['state']['diet']['rows'][0]['estimate']['sourceId'],'FDC169757')

    def test_missing_parse_key_does_not_raise_undefined_thread(self):
        with tempfile.TemporaryDirectory() as temp, patch.dict(os.environ,{'DEEPSEEK_API_KEY':''}):
            get_model.cache_clear(); get_chain.cache_clear()
            try:
                with TestClient(create_app(access_token='test-token',database_path=Path(temp)/'memory.sqlite3')) as client:
                    response=client.post('/parse',headers={'Authorization':'Bearer test-token'},json={'text':'测试','context':{'day':None,'lastExercise':None,'foods':[]}})
                    self.assertEqual(response.status_code,503)
            finally:
                get_model.cache_clear(); get_chain.cache_clear()

    def test_production_origin_cookies_and_closed_legacy(self):
        config={'APP_ENV':'production','PUBLIC_ORIGIN':'https://fitness.example.com','COOKIE_SECURE':'true','ENABLE_LEGACY_TOKEN':'false','POSTGRES_URI':'','APP_ACCESS_TOKEN':''}
        with tempfile.TemporaryDirectory() as temp, patch.dict(os.environ,config):
            with TestClient(create_app(access_token='',database_path=Path(temp)/'memory.sqlite3'),base_url='https://fitness.example.com') as client:
                payload={'username':'deploytest','password':'long-test-password'}
                self.assertEqual(client.post('/auth/register',headers={'Origin':'https://evil.example'},json=payload).status_code,403)
                response=client.post('/auth/register',headers={'Origin':'https://fitness.example.com'},json=payload)
                self.assertEqual(response.status_code,200)
                self.assertIn('Secure',response.headers['set-cookie'])
                self.assertEqual(client.get('/nutrition/search').status_code,200)
                self.assertEqual(client.get('/memory',headers={'Authorization':'Bearer '+'x'*40}).status_code,403)
                self.assertEqual(client.get('/health',headers={'Host':'evil.example'}).status_code,400)
