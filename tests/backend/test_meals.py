import asyncio
import json
import unittest
from langchain_core.language_models.fake_chat_models import FakeListChatModel
from backend.meals import MealPipeline, explicit_grams
from backend.food_rag import match_meal
from langchain_core.runnables import RunnableLambda

EXTRACTION={'items':[{'name':'米饭','raw_text':'200g米饭','quantity':200,'unit':'g'},{'name':'琵琶腿','raw_text':'一个琵琶腿','quantity':1,'unit':'个'},{'name':'西兰花','raw_text':'一小碗西兰花','quantity':1,'unit':'小碗'}]}
ANALYSIS={'items':[{'item_index':0,'grams':250,'portion_min':180,'portion_max':250,'protein_per100g':2.6,'carbs_per100g':28,'fat_per100g':0.3,'assumptions':['按熟米饭估算；未计额外用油']},{'item_index':1,'grams':80,'portion_min':60,'portion_max':110,'protein_per100g':25,'carbs_per100g':0,'fat_per100g':10,'assumptions':['鸡小腿可食部分80g，不含骨头，按带皮估算；做法未知']},{'item_index':2,'grams':100,'portion_min':70,'portion_max':150,'protein_per100g':3,'carbs_per100g':5,'fat_per100g':0.4,'assumptions':['小碗熟西兰花按100g可食部分估算，额外用油未计入']}]}

class MealTests(unittest.TestCase):
    def test_hybrid_candidates_inform_model_without_becoming_official_match(self):
        extraction={'items':[{'name':'含糖西红柿炒蛋','raw_text':'100g含糖西红柿炒蛋','quantity':100,'unit':'g'},
                             {'name':'餐馆羊杂面','raw_text':'一份餐馆羊杂面','quantity':1,'unit':'份'}]}
        analysis={'items':[{'item_index':i,'grams':500,'portion_min':400,'portion_max':600,
                           'protein_per100g':8,'carbs_per100g':15,'fat_per100g':7,'added_oil_per100g':3,'added_sugar_per100g':2,
                           'assumptions':['按常见做法估计油糖，实际配方未知']} for i in range(2)]}
        candidate=match_meal('米饭')
        captured=[]
        async def retrieve(value):
            return {'selected':None,'candidates':[candidate] if '炒蛋' in value['text'] else []}
        async def analyze(value):
            captured.append(json.loads(value['payload']))
            return analysis
        pipeline=MealPipeline(FakeListChatModel(responses=[json.dumps(extraction)]),food_retriever=RunnableLambda(retrieve))
        pipeline.analysis_chain=RunnableLambda(analyze)
        result=asyncio.run(pipeline.ainvoke('100g含糖西红柿炒蛋，一份餐馆羊杂面'))
        self.assertEqual(captured[0]['items'][0]['nutrient_candidates'][0]['id'],candidate['id'])
        self.assertEqual(captured[0]['items'][1]['nutrient_candidates'],[])
        self.assertEqual([r['grams'] for r in result['items']],[100,500])
        for row in result['items']:
            self.assertEqual(row['estimate']['nutritionBasis'],'model')
            self.assertNotIn('sourceId',row['estimate'])
            self.assertEqual(row['food']['kcal'],155)
            self.assertEqual(row['estimate']['addedOilPer100g'],3)
            self.assertEqual(row['estimate']['addedSugarPer100g'],2)
            self.assertIn('非品牌或餐馆官方',row['estimate']['assumptions'][0])

    def test_tool_then_api_estimate_preserves_explicit_grams(self):
        model=FakeListChatModel(responses=[json.dumps(EXTRACTION,ensure_ascii=False),json.dumps(ANALYSIS,ensure_ascii=False)])
        pipeline=MealPipeline(model)
        self.assertEqual(pipeline.extract_meal_items.name,'extract_meal_items')
        action=asyncio.run(pipeline.ainvoke('我今天吃了200g米饭，一个琵琶腿，一小碗西兰花'))
        self.assertEqual(action['type'],'meal_estimate')
        self.assertEqual(len(action['items']),3)
        rice=action['items'][0]
        self.assertEqual(rice['grams'],200)
        self.assertEqual(rice['estimate']['portionMin'],200)
        self.assertFalse(rice['estimate']['gramsEstimated'])
        self.assertTrue(action['items'][1]['estimate']['gramsEstimated'])
        self.assertEqual(action['items'][1]['food']['kcal'],match_meal('琵琶腿')['per100g']['kcal'])
        self.assertEqual(rice['food']['kcal'],130)
        self.assertEqual(rice['estimate']['nutritionBasis'],'database')
        self.assertIn('USDA',rice['food']['source'])

    def test_unknown_original_snippet_rejected(self):
        fake={'items':[{'name':'米饭','raw_text':'500g米饭','quantity':500,'unit':'g'}]}
        pipeline=MealPipeline(FakeListChatModel(responses=[json.dumps(fake)]))
        with self.assertRaises(ValueError):
            asyncio.run(pipeline.ainvoke('今天吃了200g米饭'))

    def test_unit_conversion(self):
        self.assertEqual(explicit_grams('0.2kg米饭'),200)
        self.assertEqual(explicit_grams('200克米饭'),200)
        self.assertIsNone(explicit_grams('一个琵琶腿'))

if __name__=='__main__':
    unittest.main()
