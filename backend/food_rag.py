"""Structured food RAG: curated aliases retrieve immutable official nutrient rows.

Chinese matching annotations are NOT official USDA translations. Automatic meal
matching is intentionally stricter than browsing/search; unknown recipes fall back.
"""
import json
import re
from functools import lru_cache
from pathlib import Path
from langchain_core.tools import tool

CATALOG = Path(__file__).resolve().parents[1] / 'knowledge/nutrition/foods.json'


@lru_cache(maxsize=1)
def catalog():
    return json.loads(CATALOG.read_text(encoding='utf-8'))


def search_foods(query, limit=6, category='', method='', offset=0):
    query = query.strip().lower()
    scored = []
    for row in catalog()['foods']:
        if category and row['category'] != category:
            continue
        if method and row['method'] != method:
            continue
        aliases = row['aliases'] + [row['name'], row['description'].lower(), row['id'].lower()]
        score = max((len(a) for a in aliases if a.lower() in query or query in a.lower()), default=0) if query else 1
        if score:
            scored.append((score, row))
    ranked = sorted(scored, key=lambda pair: (-pair[0], pair[1]['method'] != 'boiled'))
    return [dict(row) for _, row in ranked[offset:offset + limit]]


def match_meal(raw_text):
    """Only a supported single-food phrase may select official values automatically."""
    hits = [(len(a), row, a) for row in catalog()['foods'] for a in row['aliases'] if a in raw_text]
    if not hits:
        return None
    _, row, alias = max(hits, key=lambda h: h[0])
    # Reject unsupported preparations, mixtures, branded variants and additions.
    if re.search(r'炒|炸|酱|汁|糖|蜜|奶油|沙拉|辣|油|饭团|盖饭|焗|腌|卤|红烧|低脂|脱脂|去皮鸡|无皮鸡|罐头|粥|粉|脆片', raw_text):
        return None
    if '蒸' in raw_text and row['method'] not in ('steamed', 'boiled_or_steamed'):
        return None
    if '煮' in raw_text and row['method'] not in ('boiled', 'simmered', 'boiled_or_steamed'):
        return None
    if '烤' in raw_text and row['method'] not in ('roasted', 'baked'):
        return None
    if '炖' in raw_text and row['method'] != 'stewed':
        return None
    # Strip the actual matched alias, quantities and supported preparation words.
    remaining = raw_text.replace(alias, '')
    if ('熟' in remaining and row['state'] == 'raw') or ('带皮' in remaining and '去皮' in row['name']) or ('去皮' in remaining and '带皮' in row['name']):
        return None
    remaining = re.sub(r'\d+(?:\.\d+)?|公斤|千克|克|kg|g|两|斤|一|二|三|四|五|六|七|八|九|十|半|个|只|根|片|碗|份|小|大|中|约|水煮|煮|蒸|烤|炖|熟|的|无盐|不加盐|带皮|去骨|可食部分|[\s，,。()（）]', '', remaining, flags=re.I)
    if remaining:
        return None
    return dict(row)


def source_text(row):
    return f"USDA FoodData Central · SR Legacy 2018-04 · {row['id']} · {row['name']} · 每100g可食部分 · {row['source_url']}"


def portion_action(row, grams):
    return {'type': 'meal_estimate', 'items': [{
        'food': {'name': row['name'], **row['per100g'], 'source': source_text(row)},
        'grams': grams,
        'estimate': {'assumptions': ['按所选条目和输入的可食重量换算；实际品牌、含水量及烹调差异仍存在。'],
                     'confidence': '中', 'gramsEstimated': False, 'portionMin': grams, 'portionMax': grams,
                     'nutritionBasis': 'database', 'sourceId': row['id'], 'sourceUrl': row['source_url'],
                     'matchedName': row['name'], 'sourceRelease': row['release']}
    }]}


def reference_documents(query):
    return [{'id': r['id'], 'source': 'USDA SR Legacy · ' + r['name'],
             'text': f"{r['description']}；每100g可食部分：{json.dumps(r['per100g'], ensure_ascii=False)}；补充营养：{json.dumps(r.get('nutrientsPer100g', {}), ensure_ascii=False)}；热量kcal，三大营养素及fiber为g，其余补充营养为mg，null为未提供。版本2018-04。{r['source_url']}"}
            for r in search_foods(query, limit=3)]


@tool
async def search_food_nutrition(query: str) -> list[dict]:
    """查询USDA食物每100g热量、三大营养素及纤维矿物质，用[FDC编号]引用。对照生熟形态，不把参考值当实际餐食精确测量。"""
    return reference_documents(query)


@tool
async def retrieve_food_nutrients(text: str) -> dict:
    """从USDA官方食物摘录检索营养。返回每100g可食部分数据与出处；匹配不代表实际份量已测量。"""
    selected = match_meal(text)
    return {'selected': selected, 'candidates': search_foods(text),
            'note': '未选中表示该描述无法可靠对应已收录形态，不能把候选条目冒充该餐的权威数据。'}
