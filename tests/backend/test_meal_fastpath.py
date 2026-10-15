import asyncio
import unittest
import httpx
from openai import APIStatusError
from langchain_core.runnables import RunnableLambda
from langchain_core.language_models.fake_chat_models import FakeListChatModel
from backend.meals import explicit_single_food, MealPipeline
from backend.model_errors import meal_error

class FastPathTests(unittest.TestCase):
    def test_simple_and_rejected_inputs(self):
        self.assertEqual(explicit_single_food('吃了30g蛋白粉')['items'][0]['explicit_grams'],30)
        self.assertEqual(explicit_single_food('我今天吃了0.03kg蛋白粉')['items'][0]['explicit_grams'],30)
        for text in ['没吃30g蛋白粉','明天吃了30g蛋白粉','吃了30g蛋白粉吗','吃了30g蛋白粉和鸡蛋','昨天吃了30g蛋白粉']:
            self.assertIsNone(explicit_single_food(text))

    def test_skips_extraction_preserves_grams_and_estimate(self):
        p=MealPipeline(FakeListChatModel(responses=['unused']),food_retriever=RunnableLambda(lambda _: {'selected':None,'candidates':[]}))
        async def forbidden(_):
            raise AssertionError('must not call extraction')
        p.extract_meal_items=RunnableLambda(forbidden)
        p.analysis_chain=RunnableLambda(lambda _: {'items':[{'item_index':0,'grams':100,'portion_min':100,'portion_max':100,'protein_per100g':70,'carbs_per100g':10,'fat_per100g':5,'assumptions':['仅为常见蛋白粉估算，应核对包装标签']}]})
        row=asyncio.run(p.ainvoke('吃了30g蛋白粉'))['items'][0]
        self.assertEqual(row['grams'],30)
        self.assertEqual(row['estimate']['nutritionBasis'],'model')
        self.assertFalse(row['estimate']['gramsEstimated'])

    def test_busy_message_does_not_expose_provider_details(self):
        response=httpx.Response(503,request=httpx.Request('POST','https://example.test'))
        status,message=meal_error(APIStatusError('sensitive upstream text',response=response,body=None))
        self.assertIn('繁忙',message)
        self.assertIn('未保存',message)
        self.assertNotIn('sensitive',message)
