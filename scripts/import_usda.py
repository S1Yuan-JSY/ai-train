"""Build a reproducible, attributed nutrition corpus from the official SR Legacy ZIP.
Run: python scripts/import_usda.py --archive /path/to/official.zip
No API key is needed. Numeric values are never supplied by an LLM.
"""
import argparse
import csv
import hashlib
import io
import json
import zipfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'knowledge' / 'nutrition'
SOURCE = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip'
CORE_FIELDS = {'1008': ('kcal', 'KCAL'), '1003': ('protein', 'G'), '1004': ('fat', 'G'), '1005': ('carbs', 'G')}

FIELDS = {**CORE_FIELDS, '1079': ('fiber', 'G'), '1087': ('calcium', 'MG'), '1089': ('iron', 'MG'), '1090': ('magnesium', 'MG'), '1092': ('potassium', 'MG'), '1093': ('sodium', 'MG'), '1095': ('zinc', 'MG'), '1162': ('vitaminC', 'MG')}

def build(archive):
    selection = json.loads((DEST / 'selection.json').read_text(encoding='utf-8'))
    selected = {str(s['fdc_id']) for s in selection}
    with zipfile.ZipFile(archive) as z:
        def rows(filename):
            name = next(n for n in z.namelist() if n.endswith('/' + filename))
            return csv.DictReader(io.TextIOWrapper(z.open(name), encoding='utf-8-sig'))
        foods = {r['fdc_id']: r for r in rows('food.csv') if r['fdc_id'] in selected}
        units = {r['id']: r['unit_name'] for r in rows('nutrient.csv')}
        nutrients, evidence = {}, []
        for r in rows('food_nutrient.csv'):
            if r['fdc_id'] in selected and r['nutrient_id'] in FIELDS:
                key, unit = FIELDS[r['nutrient_id']]
                assert units[r['nutrient_id']].upper() == unit
                assert r['amount'] != '', 'Missing data must never be converted to zero'
                nutrients.setdefault(r['fdc_id'], {})[key] = float(r['amount'])
                evidence.append(r)
    result = []
    for spec in selection:
        ident = str(spec['fdc_id'])
        values = nutrients[ident]
        assert {'kcal', 'protein', 'fat', 'carbs'} <= set(values)
        assert all(v >= 0 for v in values.values())
        row = {**spec, 'id': 'FDC' + ident, 'description': foods[ident]['description'],
               'publication_date': foods[ident]['publication_date'], 'per100g': {k: values[k] for k, _ in CORE_FIELDS.values()},
               'nutrientsPer100g': {k: values.get(k) for k, _ in FIELDS.values() if k not in {v[0] for v in CORE_FIELDS.values()}},
               'source_url': f'https://fdc.nal.usda.gov/food-details/{ident}/nutrients',
               'data_type': 'SR Legacy', 'release': '2018-04'}
        result.append(row)
    metadata = {'publisher': 'USDA Agricultural Research Service / FoodData Central',
                'release': '2018-04', 'retrieved_at': date.today().isoformat(),
                'source_archive': SOURCE, 'archive_sha256': hashlib.sha256(Path(archive).read_bytes()).hexdigest(),
                'basis': 'per 100 g edible portion', 'nutrient_ids': FIELDS,
                'note': 'Chinese names, aliases and matching rules are project annotations, not USDA translations.'}
    (DEST / 'foods.json').write_text(json.dumps({'metadata': metadata, 'foods': result}, ensure_ascii=False, indent=2), encoding='utf-8')
    (DEST / 'source_rows.json').write_text(json.dumps({'foods': list(foods.values()), 'nutrients': evidence}, ensure_ascii=False, indent=2), encoding='utf-8')
    lines = ['# USDA 食物热量与营养参考表', '',
             '本表为项目整理的中文摘录，不是 USDA 发布的中文文件。所有数值由官方 CSV 自动提取；中文名称、别名和匹配规则由项目添加。', '',
             '来源：USDA FoodData Central，SR Legacy 最终版（2018-04）。这是历史权威参考集，并非2026年新测定数据；适用于对应食物形态，不能代表所有地区品种、品牌和菜谱。', '',
             f'原始下载：{SOURCE}', '官方说明：https://www.ars.usda.gov/ARSUserFiles/80400525/Data/SR-Legacy/SR-Legacy_Doc.pdf',
             '数据类型：https://fdc.nal.usda.gov/data-documentation/',
             '使用说明：官方数据为公共领域资料，注明 USDA FoodData Central 来源。本项目不代表 USDA 背书。', '',
             f"提取日期：{metadata['retrieved_at']}；原始ZIP的SHA-256：`{metadata['archive_sha256']}`", '',
             '## 计量与适用边界', '',
             '- 全部数值以每100g可食部分为基准。带骨购买重量不能直接作为可食重量；毫升不能无条件当作克。',
             '- kcal直接使用官方Energy（nutrient_id=1008），不强制改成4/4/9。蛋白质1003、脂肪1004、碳水1005，单位g。',
             '- 生、熟、含水量、皮、烹调方式不同会改变对应条目。未命中不冒充权威值；模型估算单独标识。',
             '- 条目可靠不代表实际餐食被精确测量：一碗、一个等份量仍需估计。一般名称的默认参照会在结果中明确显示。',
             '- 未收录的营养成分是未知而非0。本表仅选取四项完整的条目。', '',
             f'共收录 {len(result)} 条，以中餐常见食材、清煮形态为主。湿热、炖、蒸与水煮分别标注；熟但未注明做法的条目不改称水煮。', '', '## 每100g营养表', '', '| 中文参考名称 | FDC ID | kcal | 蛋白g | 碳水g | 脂肪g |', '|---|---:|---:|---:|---:|---:|']
    for r in result:
        v = r['per100g']
        lines.append(f"| {r['name']} | [{r['fdc_id']}]({r['source_url']}) | {v['kcal']:g} | {v['protein']:g} | {v['carbs']:g} | {v['fat']:g} |")
    lines += ['', '## 膳食纤维与矿物质（每100g）', '', '| 食物 | 纤维g | 钙mg | 铁mg | 镁mg | 钾mg | 钠mg | 锌mg | 维生素C mg |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|']
    for r in result:
        cells = ['—' if v is None else f'{v:g}' for v in r['nutrientsPer100g'].values()]
        lines.append('| ' + r['name'] + ' | ' + ' | '.join(cells) + ' |')
    lines += ['', '— 表示来源未提供，不能视为零。水煮沥干数值不包含汤汁、额外油和调味料；生熟重量不能直接互换。中国常见食材名称为项目匹配，USDA 样品不等同中国食物成分表或本地菜谱。', '', '## 对照原始英文条目', '']
    for r in result:
        lines += [f"- **{r['fdc_id']}**：{r['description']}；FDC publication_date：{r['publication_date']}。"]
    lines += ['', '## 重建与扩充', '',
              '`python scripts/import_usda.py --archive 官方ZIP路径`', '',
              '扩充时先核验官方条目编号、完整名称、形态和单位，在selection.json中添加人工匹配标注，再从官方数据重建。不要手填模型生成数值到foods.json。原始选中CSV行保存在source_rows.json，可逐条核对。']
    (DEST / 'FOOD_NUTRITION_REFERENCE.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'Imported {len(result)} official foods; values and provenance saved.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--archive', required=True)
    build(parser.parse_args().archive)
