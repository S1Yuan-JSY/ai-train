# USDA 食物热量与营养参考表

本表为项目整理的中文摘录，不是 USDA 发布的中文文件。所有数值由官方 CSV 自动提取；中文名称、别名和匹配规则由项目添加。

来源：USDA FoodData Central，SR Legacy 最终版（2018-04）。这是历史权威参考集，并非2026年新测定数据；适用于对应食物形态，不能代表所有地区品种、品牌和菜谱。

原始下载：https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
官方说明：https://www.ars.usda.gov/ARSUserFiles/80400525/Data/SR-Legacy/SR-Legacy_Doc.pdf
数据类型：https://fdc.nal.usda.gov/data-documentation/
使用说明：官方数据为公共领域资料，注明 USDA FoodData Central 来源。本项目不代表 USDA 背书。

提取日期：2026-10-11；原始ZIP的SHA-256：`b80817294b8850530aaedf2e515c02593b1824f763a0ff356e5c2081643e6fd0`

## 计量与适用边界

- 全部数值以每100g可食部分为基准。带骨购买重量不能直接作为可食重量；毫升不能无条件当作克。
- kcal直接使用官方Energy（nutrient_id=1008），不强制改成4/4/9。蛋白质1003、脂肪1004、碳水1005，单位g。
- 生、熟、含水量、皮、烹调方式不同会改变对应条目。未命中不冒充权威值；模型估算单独标识。
- 条目可靠不代表实际餐食被精确测量：一碗、一个等份量仍需估计。一般名称的默认参照会在结果中明确显示。
- 未收录的营养成分是未知而非0。本表仅选取四项完整的条目。

共收录 124 条，以中餐常见食材、清煮形态为主。湿热、炖、蒸与水煮分别标注；熟但未注明做法的条目不改称水煮。

## 每100g营养表

| 中文参考名称 | FDC ID | kcal | 蛋白g | 碳水g | 脂肪g |
|---|---:|---:|---:|---:|---:|
| 白米饭（熟，未强化，无盐） | [169757](https://fdc.nal.usda.gov/food-details/169757/nutrients) | 130 | 2.69 | 28.17 | 0.28 |
| 白米（生，未强化） | [169756](https://fdc.nal.usda.gov/food-details/169756/nutrients) | 365 | 7.13 | 79.95 | 0.66 |
| 糙米饭（熟） | [169704](https://fdc.nal.usda.gov/food-details/169704/nutrients) | 123 | 2.74 | 25.58 | 0.97 |
| 糙米（生） | [169703](https://fdc.nal.usda.gov/food-details/169703/nutrients) | 367 | 7.54 | 76.25 | 3.2 |
| 燕麦（干） | [169705](https://fdc.nal.usda.gov/food-details/169705/nutrients) | 389 | 16.89 | 66.27 | 6.9 |
| 意大利面（熟，无盐） | [169737](https://fdc.nal.usda.gov/food-details/169737/nutrients) | 158 | 5.8 | 30.86 | 0.93 |
| 全麦面包（商业制作） | [172688](https://fdc.nal.usda.gov/food-details/172688/nutrients) | 252 | 12.45 | 42.71 | 3.5 |
| 土豆（水煮，去皮，无盐） | [170440](https://fdc.nal.usda.gov/food-details/170440/nutrients) | 86 | 1.71 | 20.01 | 0.1 |
| 红薯（水煮，去皮） | [168484](https://fdc.nal.usda.gov/food-details/168484/nutrients) | 76 | 1.37 | 17.72 | 0.14 |
| 鸡小腿（烤，肉及皮） | [173612](https://fdc.nal.usda.gov/food-details/173612/nutrients) | 191 | 23.35 | 0 | 10.15 |
| 鸡小腿（炖，肉及皮） | [173613](https://fdc.nal.usda.gov/food-details/173613/nutrients) | 204 | 25.32 | 0 | 10.64 |
| 鸡小腿（生，肉及皮） | [172373](https://fdc.nal.usda.gov/food-details/172373/nutrients) | 161 | 18.08 | 0.11 | 9.2 |
| 鸡胸肉（烤，去皮肉） | [171477](https://fdc.nal.usda.gov/food-details/171477/nutrients) | 165 | 31.02 | 0 | 3.57 |
| 鸡胸肉（炖，去皮肉） | [171478](https://fdc.nal.usda.gov/food-details/171478/nutrients) | 151 | 28.98 | 0 | 3.03 |
| 鸡蛋（水煮，全蛋） | [173424](https://fdc.nal.usda.gov/food-details/173424/nutrients) | 155 | 12.58 | 1.12 | 10.61 |
| 全脂牛奶（脂肪3.25%，未额外强化维生素） | [172217](https://fdc.nal.usda.gov/food-details/172217/nutrients) | 61 | 3.15 | 4.78 | 3.27 |
| 原味全脂酸奶 | [171284](https://fdc.nal.usda.gov/food-details/171284/nutrients) | 61 | 3.47 | 4.66 | 3.25 |
| 大西洋养殖三文鱼（生） | [175167](https://fdc.nal.usda.gov/food-details/175167/nutrients) | 208 | 20.42 | 0 | 13.42 |
| 大西洋养殖三文鱼（干热烹调） | [175168](https://fdc.nal.usda.gov/food-details/175168/nutrients) | 206 | 22.1 | 0 | 12.35 |
| 西兰花（水煮，沥干，无盐） | [169967](https://fdc.nal.usda.gov/food-details/169967/nutrients) | 35 | 2.38 | 7.18 | 0.41 |
| 番茄（生） | [170457](https://fdc.nal.usda.gov/food-details/170457/nutrients) | 18 | 0.88 | 3.89 | 0.2 |
| 黄瓜（生，带皮） | [168409](https://fdc.nal.usda.gov/food-details/168409/nutrients) | 15 | 0.65 | 3.63 | 0.11 |
| 胡萝卜（生） | [170393](https://fdc.nal.usda.gov/food-details/170393/nutrients) | 41 | 0.93 | 9.58 | 0.24 |
| 菠菜（水煮，沥干，无盐） | [168463](https://fdc.nal.usda.gov/food-details/168463/nutrients) | 23 | 2.97 | 3.75 | 0.26 |
| 香蕉（生） | [173944](https://fdc.nal.usda.gov/food-details/173944/nutrients) | 89 | 1.09 | 22.84 | 0.33 |
| 苹果（生，带皮） | [171688](https://fdc.nal.usda.gov/food-details/171688/nutrients) | 52 | 0.26 | 13.81 | 0.17 |
| 橙子（生） | [169097](https://fdc.nal.usda.gov/food-details/169097/nutrients) | 47 | 0.94 | 11.75 | 0.12 |
| 草莓（生） | [167762](https://fdc.nal.usda.gov/food-details/167762/nutrients) | 32 | 0.67 | 7.68 | 0.3 |
| 硬豆腐（硫酸钙凝固，未经烹调） | [172475](https://fdc.nal.usda.gov/food-details/172475/nutrients) | 144 | 17.27 | 2.78 | 8.72 |
| 普通豆腐（硫酸钙凝固，未经烹调） | [172476](https://fdc.nal.usda.gov/food-details/172476/nutrients) | 76 | 8.08 | 1.87 | 4.78 |
| 扁桃仁（干烤，无盐） | [170158](https://fdc.nal.usda.gov/food-details/170158/nutrients) | 598 | 20.96 | 21.01 | 52.54 |
| 花生（干烤，无盐） | [173806](https://fdc.nal.usda.gov/food-details/173806/nutrients) | 587 | 24.35 | 21.26 | 49.66 |
| 橄榄油 | [171413](https://fdc.nal.usda.gov/food-details/171413/nutrients) | 884 | 0 | 0 | 100 |
| 苦瓜（水煮，沥干，无盐） | [168394](https://fdc.nal.usda.gov/food-details/168394/nutrients) | 19 | 0.84 | 4.32 | 0.18 |
| 丝瓜（水煮，沥干，无盐） | [168415](https://fdc.nal.usda.gov/food-details/168415/nutrients) | 56 | 0.66 | 14.34 | 0.34 |
| 莲藕（水煮，沥干，无盐） | [168430](https://fdc.nal.usda.gov/food-details/168430/nutrients) | 66 | 1.58 | 16.02 | 0.07 |
| 南瓜（水煮，沥干，无盐） | [168449](https://fdc.nal.usda.gov/food-details/168449/nutrients) | 20 | 0.72 | 4.9 | 0.07 |
| 白萝卜（水煮，沥干，无盐） | [168452](https://fdc.nal.usda.gov/food-details/168452/nutrients) | 17 | 0.67 | 3.43 | 0.24 |
| 绿豆芽（水煮，沥干，无盐） | [169137](https://fdc.nal.usda.gov/food-details/169137/nutrients) | 21 | 2.03 | 4.19 | 0.09 |
| 四季豆（水煮，沥干，无盐） | [169141](https://fdc.nal.usda.gov/food-details/169141/nutrients) | 35 | 1.89 | 7.88 | 0.28 |
| 苋菜（水煮，沥干，无盐） | [169202](https://fdc.nal.usda.gov/food-details/169202/nutrients) | 21 | 2.11 | 4.11 | 0.18 |
| 慈姑（水煮，沥干，无盐） | [169204](https://fdc.nal.usda.gov/food-details/169204/nutrients) | 78 | 4.49 | 16.14 | 0.1 |
| 竹笋（水煮，沥干，无盐） | [169211](https://fdc.nal.usda.gov/food-details/169211/nutrients) | 12 | 1.53 | 1.92 | 0.22 |
| 豇豆（水煮，沥干，无盐） | [169223](https://fdc.nal.usda.gov/food-details/169223/nutrients) | 47 | 2.53 | 9.18 | 0.1 |
| 茄子（水煮，沥干，无盐） | [169229](https://fdc.nal.usda.gov/food-details/169229/nutrients) | 35 | 0.83 | 8.73 | 0.23 |
| 瓠瓜（水煮，沥干，无盐） | [169233](https://fdc.nal.usda.gov/food-details/169233/nutrients) | 15 | 0.6 | 3.69 | 0.02 |
| 白蘑菇（水煮，沥干，无盐） | [169252](https://fdc.nal.usda.gov/food-details/169252/nutrients) | 28 | 2.17 | 5.29 | 0.47 |
| 芥菜（水煮，沥干，无盐） | [169257](https://fdc.nal.usda.gov/food-details/169257/nutrients) | 26 | 2.56 | 4.51 | 0.47 |
| 秋葵（水煮，沥干，无盐） | [169261](https://fdc.nal.usda.gov/food-details/169261/nutrients) | 22 | 1.87 | 4.51 | 0.21 |
| 马齿苋（水煮，沥干，无盐） | [169275](https://fdc.nal.usda.gov/food-details/169275/nutrients) | 18 | 1.49 | 3.55 | 0.19 |
| 毛豆仁（水煮，沥干，无盐） | [169283](https://fdc.nal.usda.gov/food-details/169283/nutrients) | 141 | 12.35 | 11.05 | 6.4 |
| 西葫芦（带皮）（水煮，沥干，无盐） | [169292](https://fdc.nal.usda.gov/food-details/169292/nutrients) | 15 | 1.14 | 2.69 | 0.36 |
| 空心菜（水煮，沥干，无盐） | [169302](https://fdc.nal.usda.gov/food-details/169302/nutrients) | 20 | 2.08 | 3.7 | 0.24 |
| 卷心菜（水煮，沥干，无盐） | [169976](https://fdc.nal.usda.gov/food-details/169976/nutrients) | 23 | 1.27 | 5.51 | 0.06 |
| 紫甘蓝（水煮，沥干，无盐） | [169978](https://fdc.nal.usda.gov/food-details/169978/nutrients) | 29 | 1.51 | 6.94 | 0.09 |
| 大白菜（水煮，沥干，无盐） | [169980](https://fdc.nal.usda.gov/food-details/169980/nutrients) | 14 | 1.5 | 2.41 | 0.17 |
| 芹菜（水煮，沥干，无盐） | [169989](https://fdc.nal.usda.gov/food-details/169989/nutrients) | 18 | 0.83 | 4 | 0.16 |
| 甜玉米（黄）（水煮，沥干，无盐） | [169999](https://fdc.nal.usda.gov/food-details/169999/nutrients) | 96 | 3.41 | 20.98 | 1.5 |
| 洋葱（水煮，沥干，无盐） | [170001](https://fdc.nal.usda.gov/food-details/170001/nutrients) | 44 | 1.36 | 10.15 | 0.19 |
| 荷兰豆（水煮，沥干，无盐） | [170011](https://fdc.nal.usda.gov/food-details/170011/nutrients) | 42 | 3.27 | 7.05 | 0.23 |
| 红甜椒（水煮，沥干，无盐） | [170110](https://fdc.nal.usda.gov/food-details/170110/nutrients) | 28 | 0.92 | 6.7 | 0.2 |
| 嫩蚕豆（水煮，沥干，无盐） | [170378](https://fdc.nal.usda.gov/food-details/170378/nutrients) | 62 | 4.8 | 10.1 | 0.5 |
| 牛蒡根（水煮，沥干，无盐） | [170384](https://fdc.nal.usda.gov/food-details/170384/nutrients) | 88 | 2.09 | 21.15 | 0.14 |
| 小白菜（水煮，沥干，无盐） | [170391](https://fdc.nal.usda.gov/food-details/170391/nutrients) | 12 | 1.56 | 1.78 | 0.16 |
| 胡萝卜（水煮，沥干，无盐） | [170394](https://fdc.nal.usda.gov/food-details/170394/nutrients) | 35 | 0.76 | 8.22 | 0.18 |
| 菜花（水煮，沥干，无盐） | [170397](https://fdc.nal.usda.gov/food-details/170397/nutrients) | 23 | 1.84 | 4.11 | 0.45 |
| 佛手瓜（水煮，沥干，无盐） | [170403](https://fdc.nal.usda.gov/food-details/170403/nutrients) | 24 | 0.62 | 5.09 | 0.48 |
| 茼蒿（水煮，沥干，无盐） | [170405](https://fdc.nal.usda.gov/food-details/170405/nutrients) | 20 | 1.64 | 4.31 | 0.09 |
| 青豌豆（水煮，沥干，无盐） | [170420](https://fdc.nal.usda.gov/food-details/170420/nutrients) | 84 | 5.36 | 15.63 | 0.22 |
| 青椒（水煮，沥干，无盐） | [170428](https://fdc.nal.usda.gov/food-details/170428/nutrients) | 28 | 0.92 | 6.7 | 0.2 |
| 冬瓜（水煮，沥干，无盐） | [170475](https://fdc.nal.usda.gov/food-details/170475/nutrients) | 14 | 0.4 | 3.04 | 0.2 |
| 甜玉米（白）（水煮，沥干，无盐） | [168539](https://fdc.nal.usda.gov/food-details/168539/nutrients) | 97 | 3.34 | 21.71 | 1.41 |
| 羽衣甘蓝（水煮，沥干，无盐） | [169238](https://fdc.nal.usda.gov/food-details/169238/nutrients) | 36 | 2.94 | 5.3 | 1.21 |
| 苤蓝（水煮，沥干，无盐） | [168425](https://fdc.nal.usda.gov/food-details/168425/nutrients) | 29 | 1.8 | 6.69 | 0.11 |
| 韭葱（水煮，沥干，无盐） | [168426](https://fdc.nal.usda.gov/food-details/168426/nutrients) | 31 | 0.81 | 7.62 | 0.2 |
| 红小豆（成熟豆粒，水煮，无盐） | [173728](https://fdc.nal.usda.gov/food-details/173728/nutrients) | 128 | 7.52 | 24.77 | 0.1 |
| 绿豆（成熟豆粒，水煮，无盐） | [174257](https://fdc.nal.usda.gov/food-details/174257/nutrients) | 105 | 7.02 | 19.15 | 0.38 |
| 黄豆（成熟豆粒，水煮，无盐） | [174271](https://fdc.nal.usda.gov/food-details/174271/nutrients) | 172 | 18.21 | 8.36 | 8.97 |
| 芸豆（成熟豆粒，水煮，无盐） | [173740](https://fdc.nal.usda.gov/food-details/173740/nutrients) | 127 | 8.67 | 22.8 | 0.5 |
| 干蚕豆（成熟豆粒，水煮，无盐） | [173753](https://fdc.nal.usda.gov/food-details/173753/nutrients) | 110 | 7.6 | 19.65 | 0.4 |
| 鹰嘴豆（成熟豆粒，水煮，无盐） | [173757](https://fdc.nal.usda.gov/food-details/173757/nutrients) | 164 | 8.86 | 27.42 | 2.59 |
| 小扁豆（成熟豆粒，水煮，无盐） | [172421](https://fdc.nal.usda.gov/food-details/172421/nutrients) | 116 | 9.02 | 20.13 | 0.38 |
| 红腰豆（成熟豆粒，水煮，无盐） | [175194](https://fdc.nal.usda.gov/food-details/175194/nutrients) | 127 | 8.67 | 22.8 | 0.5 |
| 黑眼豆（成熟豆粒，水煮，无盐） | [173759](https://fdc.nal.usda.gov/food-details/173759/nutrients) | 116 | 7.73 | 20.76 | 0.53 |
| 小米饭（熟） | [168871](https://fdc.nal.usda.gov/food-details/168871/nutrients) | 119 | 3.51 | 23.67 | 1 |
| 小米（生） | [169702](https://fdc.nal.usda.gov/food-details/169702/nutrients) | 378 | 11.02 | 72.85 | 4.22 |
| 米粉（熟） | [168914](https://fdc.nal.usda.gov/food-details/168914/nutrients) | 108 | 1.79 | 24.01 | 0.2 |
| 米粉（干） | [169742](https://fdc.nal.usda.gov/food-details/169742/nutrients) | 364 | 5.95 | 80.18 | 0.56 |
| 珍珠大麦（熟） | [170285](https://fdc.nal.usda.gov/food-details/170285/nutrients) | 123 | 2.26 | 28.22 | 0.44 |
| 荞麦粒（先烘烤后煮熟） | [170686](https://fdc.nal.usda.gov/food-details/170686/nutrients) | 92 | 3.38 | 19.94 | 0.62 |
| 芋头（熟，无盐；做法未细分） | [168486](https://fdc.nal.usda.gov/food-details/168486/nutrients) | 142 | 0.52 | 34.6 | 0.11 |
| 中国栗子（煮或蒸） | [170166](https://fdc.nal.usda.gov/food-details/170166/nutrients) | 153 | 2.88 | 33.64 | 0.76 |
| 香菇（熟，无盐；做法未细分） | [168437](https://fdc.nal.usda.gov/food-details/168437/nutrients) | 56 | 1.56 | 14.39 | 0.22 |
| 芥蓝（熟；做法未细分） | [169392](https://fdc.nal.usda.gov/food-details/169392/nutrients) | 22 | 1.14 | 3.81 | 0.72 |
| 黄豆芽（蒸熟） | [168460](https://fdc.nal.usda.gov/food-details/168460/nutrients) | 81 | 8.47 | 6.53 | 4.45 |
| 鸡爪（水煮） | [171119](https://fdc.nal.usda.gov/food-details/171119/nutrients) | 215 | 19.4 | 0.2 | 14.6 |
| 牛肉（新西兰加工用牛肉，水煮） | [174730](https://fdc.nal.usda.gov/food-details/174730/nutrients) | 126 | 24.21 | 0 | 3.26 |
| 牛肚（新西兰，水煮） | [173095](https://fdc.nal.usda.gov/food-details/173095/nutrients) | 103 | 19 | 0 | 2.98 |
| 牛舌（新西兰，水煮） | [174737](https://fdc.nal.usda.gov/food-details/174737/nutrients) | 271 | 18.31 | 3.68 | 20.34 |
| 猪蹄（小火煮） | [168290](https://fdc.nal.usda.gov/food-details/168290/nutrients) | 238 | 21.94 | 0 | 16.05 |
| 猪肚（小火煮） | [168323](https://fdc.nal.usda.gov/food-details/168323/nutrients) | 157 | 21.4 | 0.09 | 7.26 |
| 鸡大腿（炖，去皮肉） | [172389](https://fdc.nal.usda.gov/food-details/172389/nutrients) | 195 | 25 | 0 | 9.79 |
| 鸡胸肉（炖，肉及皮） | [171076](https://fdc.nal.usda.gov/food-details/171076/nutrients) | 184 | 27.39 | 0 | 7.42 |
| 虾（熟，湿热；可能含保水添加剂） | [171971](https://fdc.nal.usda.gov/food-details/171971/nutrients) | 119 | 22.78 | 1.52 | 1.7 |
| 蛤蜊（熟，湿热） | [171975](https://fdc.nal.usda.gov/food-details/171975/nutrients) | 148 | 25.55 | 5.13 | 1.95 |
| 墨鱼（熟，湿热） | [172010](https://fdc.nal.usda.gov/food-details/172010/nutrients) | 158 | 32.48 | 1.64 | 1.4 |
| 章鱼（熟，湿热） | [174249](https://fdc.nal.usda.gov/food-details/174249/nutrients) | 164 | 29.82 | 4.4 | 2.08 |
| 太平洋牡蛎（熟，湿热） | [174250](https://fdc.nal.usda.gov/food-details/174250/nutrients) | 163 | 18.9 | 9.9 | 4.6 |
| 蓝贻贝（熟，湿热） | [174217](https://fdc.nal.usda.gov/food-details/174217/nutrients) | 172 | 23.8 | 7.39 | 4.48 |
| 野生小龙虾（熟，湿热） | [174207](https://fdc.nal.usda.gov/food-details/174207/nutrients) | 82 | 16.77 | 0 | 1.2 |
| 软豆腐（硫酸钙及氯化镁凝固，未经烹调） | [172449](https://fdc.nal.usda.gov/food-details/172449/nutrients) | 61 | 7.17 | 1.18 | 3.69 |
| 鲜香菇（生） | [169242](https://fdc.nal.usda.gov/food-details/169242/nutrients) | 34 | 2.24 | 6.79 | 0.49 |
| 香菇（干） | [168436](https://fdc.nal.usda.gov/food-details/168436/nutrients) | 296 | 9.58 | 75.37 | 0.99 |
| 金针菇（生） | [169382](https://fdc.nal.usda.gov/food-details/169382/nutrients) | 37 | 2.66 | 7.81 | 0.29 |
| 平菇（生） | [168580](https://fdc.nal.usda.gov/food-details/168580/nutrients) | 33 | 3.31 | 6.09 | 0.41 |
| 海带（生） | [168457](https://fdc.nal.usda.gov/food-details/168457/nutrients) | 43 | 1.68 | 9.57 | 0.56 |
| 莲藕（生） | [169250](https://fdc.nal.usda.gov/food-details/169250/nutrients) | 74 | 2.6 | 17.23 | 0.1 |
| 大白菜（生） | [169979](https://fdc.nal.usda.gov/food-details/169979/nutrients) | 16 | 1.2 | 3.23 | 0.2 |
| 小白菜（生） | [170390](https://fdc.nal.usda.gov/food-details/170390/nutrients) | 13 | 1.5 | 2.18 | 0.2 |
| 冬瓜（生） | [170069](https://fdc.nal.usda.gov/food-details/170069/nutrients) | 13 | 0.4 | 3 | 0.2 |
| 荸荠（生） | [170066](https://fdc.nal.usda.gov/food-details/170066/nutrients) | 97 | 1.4 | 23.94 | 0.1 |
| 莲子（干） | [170149](https://fdc.nal.usda.gov/food-details/170149/nutrients) | 332 | 15.41 | 64.47 | 1.97 |
| 绿豆（干，未煮） | [174256](https://fdc.nal.usda.gov/food-details/174256/nutrients) | 347 | 23.86 | 62.62 | 1.15 |
| 红小豆（干，未煮） | [173727](https://fdc.nal.usda.gov/food-details/173727/nutrients) | 329 | 19.87 | 62.9 | 0.53 |

## 膳食纤维与矿物质（每100g）

| 食物 | 纤维g | 钙mg | 铁mg | 镁mg | 钾mg | 钠mg | 锌mg | 维生素C mg |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 白米饭（熟，未强化，无盐） | 0.4 | 10 | 0.2 | 12 | 35 | 1 | 0.49 | 0 |
| 白米（生，未强化） | 1.3 | 28 | 0.8 | 25 | 115 | 5 | 1.09 | 0 |
| 糙米饭（熟） | 1.6 | 3 | 0.56 | 39 | 86 | 4 | 0.71 | 0 |
| 糙米（生） | 3.6 | 9 | 1.29 | 116 | 250 | 5 | 2.13 | 0 |
| 燕麦（干） | 10.6 | 54 | 4.72 | 177 | 429 | 2 | 3.97 | 0 |
| 意大利面（熟，无盐） | 1.8 | 7 | 1.28 | 18 | 44 | 1 | 0.51 | 0 |
| 全麦面包（商业制作） | 6 | 161 | 2.47 | 75 | 254 | 455 | 1.77 | 0 |
| 土豆（水煮，去皮，无盐） | 1.8 | 8 | 0.31 | 20 | 328 | 5 | 0.27 | 7.4 |
| 红薯（水煮，去皮） | 2.5 | 27 | 0.72 | 18 | 230 | 27 | 0.2 | 12.8 |
| 鸡小腿（烤，肉及皮） | 0 | 11 | 1.11 | 22 | 247 | 123 | 2.36 | 0 |
| 鸡小腿（炖，肉及皮） | 0 | 11 | 1.33 | 20 | 184 | 76 | 2.65 | 0 |
| 鸡小腿（生，肉及皮） | 0 | 8 | 0.71 | 18 | 211 | 106 | 1.86 | 0 |
| 鸡胸肉（烤，去皮肉） | 0 | 15 | 1.04 | 29 | 256 | 74 | 1 | 0 |
| 鸡胸肉（炖，去皮肉） | 0 | 13 | 0.88 | 24 | 187 | 63 | 0.97 | 0 |
| 鸡蛋（水煮，全蛋） | 0 | 50 | 1.19 | 10 | 126 | 124 | 1.05 | 0 |
| 全脂牛奶（脂肪3.25%，未额外强化维生素） | 0 | 113 | 0.03 | 10 | 132 | 43 | 0.37 | 0 |
| 原味全脂酸奶 | 0 | 121 | 0.05 | 12 | 155 | 46 | 0.59 | 0.5 |
| 大西洋养殖三文鱼（生） | 0 | 9 | 0.34 | 27 | 363 | 59 | 0.36 | 3.9 |
| 大西洋养殖三文鱼（干热烹调） | 0 | 15 | 0.34 | 30 | 384 | 61 | 0.43 | 3.7 |
| 西兰花（水煮，沥干，无盐） | 3.3 | 40 | 0.67 | 21 | 293 | 41 | 0.45 | 64.9 |
| 番茄（生） | 1.2 | 10 | 0.27 | 11 | 237 | 5 | 0.17 | 13.7 |
| 黄瓜（生，带皮） | 0.5 | 16 | 0.28 | 13 | 147 | 2 | 0.2 | 2.8 |
| 胡萝卜（生） | 2.8 | 33 | 0.3 | 12 | 320 | 69 | 0.24 | 5.9 |
| 菠菜（水煮，沥干，无盐） | 2.4 | 136 | 3.57 | 87 | 466 | 70 | 0.76 | 9.8 |
| 香蕉（生） | 2.6 | 5 | 0.26 | 27 | 358 | 1 | 0.15 | 8.7 |
| 苹果（生，带皮） | 2.4 | 6 | 0.12 | 5 | 107 | 1 | 0.04 | 4.6 |
| 橙子（生） | 2.4 | 40 | 0.1 | 10 | 181 | 0 | 0.07 | 53.2 |
| 草莓（生） | 2 | 16 | 0.41 | 13 | 153 | 1 | 0.14 | 58.8 |
| 硬豆腐（硫酸钙凝固，未经烹调） | 2.3 | 683 | 2.66 | 58 | 237 | 14 | 1.57 | 0.2 |
| 普通豆腐（硫酸钙凝固，未经烹调） | 0.3 | 350 | 5.36 | 30 | 121 | 7 | 0.8 | 0.1 |
| 扁桃仁（干烤，无盐） | 10.9 | 268 | 3.73 | 279 | 713 | 3 | 3.31 | 0 |
| 花生（干烤，无盐） | 8.4 | 58 | 1.58 | 178 | 634 | 6 | 2.77 | 0 |
| 橄榄油 | 0 | 1 | 0.56 | 0 | 1 | 2 | 0 | 0 |
| 苦瓜（水煮，沥干，无盐） | 2 | 9 | 0.38 | 16 | 319 | 6 | 0.77 | 33 |
| 丝瓜（水煮，沥干，无盐） | 2.9 | 9 | 0.36 | 20 | 453 | 21 | 0.17 | 5.7 |
| 莲藕（水煮，沥干，无盐） | 3.1 | 26 | 0.9 | 22 | 363 | 45 | 0.33 | 27.4 |
| 南瓜（水煮，沥干，无盐） | 1.1 | 15 | 0.57 | 9 | 230 | 1 | 0.23 | 4.7 |
| 白萝卜（水煮，沥干，无盐） | 1.6 | 17 | 0.15 | 9 | 285 | 13 | 0.13 | 15.1 |
| 绿豆芽（水煮，沥干，无盐） | 0.8 | 12 | 0.65 | 14 | 101 | 10 | 0.47 | 11.4 |
| 四季豆（水煮，沥干，无盐） | 3.2 | 44 | 0.65 | 18 | 146 | 1 | 0.25 | 9.7 |
| 苋菜（水煮，沥干，无盐） | — | 209 | 2.26 | 55 | 641 | 21 | 0.88 | 41.1 |
| 慈姑（水煮，沥干，无盐） | — | 7 | 1.21 | 49 | 881 | 18 | 0.22 | 0.3 |
| 竹笋（水煮，沥干，无盐） | 1 | 12 | 0.24 | 3 | 533 | 4 | 0.47 | 0 |
| 豇豆（水煮，沥干，无盐） | — | 44 | 0.98 | 42 | 290 | 4 | 0.36 | 16.2 |
| 茄子（水煮，沥干，无盐） | 2.5 | 6 | 0.25 | 11 | 123 | 1 | 0.12 | 1.3 |
| 瓠瓜（水煮，沥干，无盐） | 1.2 | 24 | 0.25 | 11 | 170 | 2 | 0.7 | 8.5 |
| 白蘑菇（水煮，沥干，无盐） | 2.2 | 6 | 1.74 | 12 | 356 | 2 | 0.87 | 4 |
| 芥菜（水煮，沥干，无盐） | 2 | 118 | 0.87 | 13 | 162 | 9 | 0.22 | 25.3 |
| 秋葵（水煮，沥干，无盐） | 2.5 | 77 | 0.28 | 36 | 135 | 6 | 0.43 | 16.3 |
| 马齿苋（水煮，沥干，无盐） | — | 78 | 0.77 | 67 | 488 | 44 | 0.17 | 10.5 |
| 毛豆仁（水煮，沥干，无盐） | 4.2 | 145 | 2.5 | 60 | 539 | 14 | 0.91 | 17 |
| 西葫芦（带皮）（水煮，沥干，无盐） | 1 | 18 | 0.37 | 19 | 264 | 3 | 0.33 | 12.9 |
| 空心菜（水煮，沥干，无盐） | 1.9 | 54 | 1.32 | 30 | 284 | 122 | 0.16 | 16 |
| 卷心菜（水煮，沥干，无盐） | 1.9 | 48 | 0.17 | 15 | 196 | 8 | 0.2 | 37.5 |
| 紫甘蓝（水煮，沥干，无盐） | 2.6 | 42 | 0.66 | 17 | 262 | 28 | 0.25 | 34.4 |
| 大白菜（水煮，沥干，无盐） | 1.7 | 32 | 0.3 | 10 | 225 | 9 | 0.18 | 15.8 |
| 芹菜（水煮，沥干，无盐） | 1.6 | 42 | 0.42 | 12 | 284 | 91 | 0.14 | 6.1 |
| 甜玉米（黄）（水煮，沥干，无盐） | 2.4 | 3 | 0.45 | 26 | 218 | 1 | 0.62 | 5.5 |
| 洋葱（水煮，沥干，无盐） | 1.4 | 22 | 0.24 | 11 | 166 | 3 | 0.21 | 5.2 |
| 荷兰豆（水煮，沥干，无盐） | 2.8 | 42 | 1.97 | 26 | 240 | 4 | 0.37 | 47.9 |
| 红甜椒（水煮，沥干，无盐） | 1.2 | 9 | 0.46 | 10 | 166 | 2 | 0.12 | 171 |
| 嫩蚕豆（水煮，沥干，无盐） | 3.6 | 18 | 1.5 | 31 | 193 | 41 | 0.47 | 19.8 |
| 牛蒡根（水煮，沥干，无盐） | 1.8 | 49 | 0.77 | 39 | 360 | 4 | 0.38 | 2.6 |
| 小白菜（水煮，沥干，无盐） | 1 | 93 | 1.04 | 11 | 371 | 34 | 0.17 | 26 |
| 胡萝卜（水煮，沥干，无盐） | 3 | 30 | 0.34 | 10 | 235 | 58 | 0.2 | 3.6 |
| 菜花（水煮，沥干，无盐） | 2.3 | 16 | 0.32 | 9 | 142 | 15 | 0.17 | 44.3 |
| 佛手瓜（水煮，沥干，无盐） | 2.8 | 13 | 0.22 | 12 | 173 | 1 | 0.31 | 8 |
| 茼蒿（水煮，沥干，无盐） | 2.3 | 69 | 3.74 | 18 | 569 | 53 | 0.2 | 23.9 |
| 青豌豆（水煮，沥干，无盐） | 5.5 | 27 | 1.54 | 39 | 271 | 3 | 1.19 | 14.2 |
| 青椒（水煮，沥干，无盐） | 1.2 | 9 | 0.46 | 10 | 166 | 2 | 0.12 | 74.4 |
| 冬瓜（水煮，沥干，无盐） | 1 | 18 | 0.38 | 10 | 5 | 107 | 0.59 | 10.5 |
| 甜玉米（白）（水煮，沥干，无盐） | 2.7 | 2 | 0.55 | 31 | 252 | 3 | 0.54 | 6.2 |
| 羽衣甘蓝（水煮，沥干，无盐） | 4 | 150 | 0.84 | 25 | 144 | 16 | 0.27 | 17.8 |
| 苤蓝（水煮，沥干，无盐） | 1.1 | 25 | 0.4 | 19 | 340 | 21 | 0.31 | 54 |
| 韭葱（水煮，沥干，无盐） | 1 | 30 | 1.1 | 14 | 87 | 10 | 0.06 | 4.2 |
| 红小豆（成熟豆粒，水煮，无盐） | 7.3 | 28 | 2 | 52 | 532 | 8 | 1.77 | 0 |
| 绿豆（成熟豆粒，水煮，无盐） | 7.6 | 27 | 1.4 | 48 | 266 | 2 | 0.84 | 1 |
| 黄豆（成熟豆粒，水煮，无盐） | 6 | 102 | 5.14 | 86 | 515 | 1 | 1.15 | 1.7 |
| 芸豆（成熟豆粒，水煮，无盐） | 6.4 | 35 | 2.22 | 42 | 405 | 1 | 1 | 1.2 |
| 干蚕豆（成熟豆粒，水煮，无盐） | 5.4 | 36 | 1.5 | 43 | 268 | 5 | 1.01 | 0.3 |
| 鹰嘴豆（成熟豆粒，水煮，无盐） | 7.6 | 49 | 2.89 | 48 | 291 | 7 | 1.53 | 1.3 |
| 小扁豆（成熟豆粒，水煮，无盐） | 7.9 | 19 | 3.33 | 36 | 369 | 2 | 1.27 | 1.5 |
| 红腰豆（成熟豆粒，水煮，无盐） | 7.4 | 28 | 2.94 | 45 | 403 | 2 | 1.07 | 1.2 |
| 黑眼豆（成熟豆粒，水煮，无盐） | 6.5 | 24 | 2.51 | 53 | 278 | 4 | 1.29 | 0.4 |
| 小米饭（熟） | 1.3 | 3 | 0.63 | 44 | 62 | 2 | 0.91 | 0 |
| 小米（生） | 8.5 | 8 | 3.01 | 114 | 195 | 5 | 1.68 | 0 |
| 米粉（熟） | 1 | 4 | 0.14 | 3 | 4 | 19 | 0.25 | 0 |
| 米粉（干） | 1.6 | 18 | 0.7 | 12 | 30 | 182 | 0.74 | 0 |
| 珍珠大麦（熟） | 3.8 | 11 | 1.33 | 22 | 93 | 3 | 0.82 | 0 |
| 荞麦粒（先烘烤后煮熟） | 2.7 | 7 | 0.8 | 51 | 88 | 4 | 0.61 | 0 |
| 芋头（熟，无盐；做法未细分） | 5.1 | 18 | 0.72 | 30 | 484 | 15 | 0.27 | 5 |
| 中国栗子（煮或蒸） | — | 12 | 0.97 | 58 | 306 | 2 | 0.6 | 24.7 |
| 香菇（熟，无盐；做法未细分） | 2.1 | 3 | 0.44 | 14 | 117 | 4 | 1.33 | 0.3 |
| 芥蓝（熟；做法未细分） | 2.5 | 100 | 0.56 | 18 | 261 | 7 | 0.39 | 28.2 |
| 黄豆芽（蒸熟） | 0.8 | 59 | 1.31 | 60 | 355 | 10 | 1.04 | 8.3 |
| 鸡爪（水煮） | 0 | 88 | 0.91 | 5 | 31 | 67 | 0.69 | 0 |
| 牛肉（新西兰加工用牛肉，水煮） | 0 | 6 | 1.78 | 16 | 193 | 32 | 5.02 | 0 |
| 牛肚（新西兰，水煮） | 0 | 158 | 3.72 | 24 | 102 | 40 | 2.39 | 0 |
| 牛舌（新西兰，水煮） | 0 | 5 | 2.52 | 17 | 189 | 57 | 4.2 | 0 |
| 猪蹄（小火煮） | 0 | 0 | 0.98 | 5 | 33 | 73 | 1.05 | 0 |
| 猪肚（小火煮） | 0 | 15 | 1.23 | 15 | 85 | 40 | 2.92 | 0 |
| 鸡大腿（炖，去皮肉） | 0 | 11 | 1.42 | 21 | 183 | 75 | 2.58 | 0 |
| 鸡胸肉（炖，肉及皮） | 0 | 13 | 0.92 | 22 | 178 | 62 | 0.97 | 0 |
| 虾（熟，湿热；可能含保水添加剂） | 0 | 91 | 0.32 | 37 | 170 | 947 | 1.63 | 0 |
| 蛤蜊（熟，湿热） | 0 | 92 | 2.81 | 18 | 628 | 1202 | 2.73 | 22.1 |
| 墨鱼（熟，湿热） | 0 | 180 | 10.84 | 60 | 637 | 744 | 3.46 | 8.5 |
| 章鱼（熟，湿热） | 0 | 106 | 9.54 | 60 | 630 | 460 | 3.36 | 8 |
| 太平洋牡蛎（熟，湿热） | 0 | 16 | 9.2 | 44 | 302 | 212 | 33.24 | 12.8 |
| 蓝贻贝（熟，湿热） | 0 | 33 | 6.72 | 37 | 268 | 369 | 2.67 | 13.6 |
| 野生小龙虾（熟，湿热） | 0 | 60 | 0.83 | 33 | 296 | 94 | 1.76 | 0.9 |
| 软豆腐（硫酸钙及氯化镁凝固，未经烹调） | 0.2 | 111 | 1.11 | 27 | 120 | 8 | 0.64 | 0.2 |
| 鲜香菇（生） | 2.5 | 2 | 0.41 | 20 | 304 | 9 | 1.03 | — |
| 香菇（干） | 11.5 | 11 | 1.72 | 132 | 1534 | 13 | 7.66 | 3.5 |
| 金针菇（生） | 2.7 | 0 | 1.15 | 16 | 359 | 3 | 0.65 | 0 |
| 平菇（生） | 2.3 | 3 | 1.33 | 18 | 420 | 18 | 0.77 | 0 |
| 海带（生） | 1.3 | 168 | 2.85 | 121 | 89 | 233 | 1.23 | 3 |
| 莲藕（生） | 4.9 | 45 | 1.16 | 23 | 556 | 40 | 0.39 | 44 |
| 大白菜（生） | 1.2 | 77 | 0.31 | 13 | 238 | 9 | 0.23 | 27 |
| 小白菜（生） | 1 | 105 | 0.8 | 19 | 252 | 65 | 0.19 | 45 |
| 冬瓜（生） | 2.9 | 19 | 0.4 | 10 | 6 | 111 | 0.61 | 13 |
| 荸荠（生） | 3 | 11 | 0.06 | 22 | 584 | 14 | 0.5 | 4 |
| 莲子（干） | — | 163 | 3.53 | 210 | 1368 | 5 | 1.05 | 0 |
| 绿豆（干，未煮） | 16.3 | 132 | 6.74 | 189 | 1246 | 15 | 2.68 | 4.8 |
| 红小豆（干，未煮） | 12.7 | 66 | 4.98 | 127 | 1254 | 5 | 5.04 | 0 |

— 表示来源未提供，不能视为零。水煮沥干数值不包含汤汁、额外油和调味料；生熟重量不能直接互换。中国常见食材名称为项目匹配，USDA 样品不等同中国食物成分表或本地菜谱。

## 对照原始英文条目

- **169757**：Rice, white, long-grain, regular, unenriched, cooked without salt；FDC publication_date：2019-04-01。
- **169756**：Rice, white, long-grain, regular, raw, unenriched；FDC publication_date：2019-04-01。
- **169704**：Rice, brown, long-grain, cooked (Includes foods for USDA's Food Distribution Program)；FDC publication_date：2019-04-01。
- **169703**：Rice, brown, long-grain, raw (Includes foods for USDA's Food Distribution Program)；FDC publication_date：2019-04-01。
- **169705**：Oats (Includes foods for USDA's Food Distribution Program)；FDC publication_date：2019-04-01。
- **169737**：Pasta, cooked, enriched, without added salt；FDC publication_date：2019-04-01。
- **172688**：Bread, whole-wheat, commercially prepared；FDC publication_date：2019-04-01。
- **170440**：Potatoes, boiled, cooked without skin, flesh, without salt；FDC publication_date：2019-04-01。
- **168484**：Sweet potato, cooked, boiled, without skin；FDC publication_date：2019-04-01。
- **173612**：Chicken, broilers or fryers, drumstick, meat and skin, cooked, roasted；FDC publication_date：2019-04-01。
- **173613**：Chicken, broilers or fryers, drumstick, meat and skin, cooked, stewed；FDC publication_date：2019-04-01。
- **172373**：Chicken, broilers or fryers, drumstick, meat and skin, raw；FDC publication_date：2019-04-01。
- **171477**：Chicken, broilers or fryers, breast, meat only, cooked, roasted；FDC publication_date：2019-04-01。
- **171478**：Chicken, broilers or fryers, breast, meat only, cooked, stewed；FDC publication_date：2019-04-01。
- **173424**：Egg, whole, cooked, hard-boiled；FDC publication_date：2019-04-01。
- **172217**：Milk, whole, 3.25% milkfat, without added vitamin A and vitamin D；FDC publication_date：2019-04-01。
- **171284**：Yogurt, plain, whole milk；FDC publication_date：2019-04-01。
- **175167**：Fish, salmon, Atlantic, farmed, raw；FDC publication_date：2019-04-01。
- **175168**：Fish, salmon, Atlantic, farmed, cooked, dry heat；FDC publication_date：2019-04-01。
- **169967**：Broccoli, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170457**：Tomatoes, red, ripe, raw, year round average；FDC publication_date：2019-04-01。
- **168409**：Cucumber, with peel, raw；FDC publication_date：2019-04-01。
- **170393**：Carrots, raw；FDC publication_date：2019-04-01。
- **168463**：Spinach, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **173944**：Bananas, raw；FDC publication_date：2019-04-01。
- **171688**：Apples, raw, with skin (Includes foods for USDA's Food Distribution Program)；FDC publication_date：2019-04-01。
- **169097**：Oranges, raw, all commercial varieties；FDC publication_date：2019-04-01。
- **167762**：Strawberries, raw；FDC publication_date：2019-04-01。
- **172475**：Tofu, raw, firm, prepared with calcium sulfate；FDC publication_date：2019-04-01。
- **172476**：Tofu, raw, regular, prepared with calcium sulfate；FDC publication_date：2019-04-01。
- **170158**：Nuts, almonds, dry roasted, without salt added；FDC publication_date：2019-04-01。
- **173806**：Peanuts, all types, dry-roasted, without salt；FDC publication_date：2019-04-01。
- **171413**：Oil, olive, salad or cooking；FDC publication_date：2019-04-01。
- **168394**：Balsam-pear (bitter gourd), pods, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **168415**：Gourd, dishcloth (towelgourd), cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **168430**：Lotus root, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **168449**：Pumpkin, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **168452**：Radishes, oriental, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169137**：Mung beans, mature seeds, sprouted, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169141**：Beans, snap, green, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169202**：Amaranth leaves, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169204**：Arrowhead, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169211**：Bamboo shoots, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169223**：Yardlong bean, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169229**：Eggplant, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169233**：Gourd, white-flowered (calabash), cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169252**：Mushrooms, white, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169257**：Mustard greens, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169261**：Okra, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169275**：Purslane, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169283**：Soybeans, green, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169292**：Squash, summer, zucchini, includes skin, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169302**：Water convolvulus, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169976**：Cabbage, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169978**：Cabbage, red, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169980**：Cabbage, chinese (pe-tsai), cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169989**：Celery, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169999**：Corn, sweet, yellow, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170001**：Onions, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170011**：Peas, edible-podded, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170110**：Peppers, sweet, red, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170378**：Broadbeans, immature seeds, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170384**：Burdock root, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170391**：Cabbage, chinese (pak-choi), cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170394**：Carrots, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170397**：Cauliflower, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170403**：Chayote, fruit, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170405**：Chrysanthemum, garland, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170420**：Peas, green, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170428**：Peppers, sweet, green, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **170475**：Waxgourd, (chinese preserving melon), cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **168539**：Corn, sweet, white, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **169238**：Kale, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **168425**：Kohlrabi, cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **168426**：Leeks, (bulb and lower leaf-portion), cooked, boiled, drained, without salt；FDC publication_date：2019-04-01。
- **173728**：Beans, adzuki, mature seeds, cooked, boiled, without salt；FDC publication_date：2019-04-01。
- **174257**：Mung beans, mature seeds, cooked, boiled, without salt；FDC publication_date：2019-04-01。
- **174271**：Soybeans, mature cooked, boiled, without salt；FDC publication_date：2019-04-01。
- **173740**：Beans, kidney, all types, mature seeds, cooked, boiled, without salt；FDC publication_date：2019-04-01。
- **173753**：Broadbeans (fava beans), mature seeds, cooked, boiled, without salt；FDC publication_date：2019-04-01。
- **173757**：Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt；FDC publication_date：2019-04-01。
- **172421**：Lentils, mature seeds, cooked, boiled, without salt；FDC publication_date：2019-04-01。
- **175194**：Beans, kidney, red, mature seeds, cooked, boiled, without salt；FDC publication_date：2019-04-01。
- **173759**：Cowpeas, common (blackeyes, crowder, southern), mature seeds, cooked, boiled, without salt；FDC publication_date：2019-04-01。
- **168871**：Millet, cooked；FDC publication_date：2019-04-01。
- **169702**：Millet, raw；FDC publication_date：2019-04-01。
- **168914**：Rice noodles, cooked；FDC publication_date：2019-04-01。
- **169742**：Rice noodles, dry；FDC publication_date：2019-04-01。
- **170285**：Barley, pearled, cooked；FDC publication_date：2019-04-01。
- **170686**：Buckwheat groats, roasted, cooked；FDC publication_date：2019-04-01。
- **168486**：Taro, cooked, without salt；FDC publication_date：2019-04-01。
- **170166**：Nuts, chestnuts, chinese, boiled and steamed；FDC publication_date：2019-04-01。
- **168437**：Mushrooms, shiitake, cooked, without salt；FDC publication_date：2019-04-01。
- **169392**：Broccoli, chinese, cooked；FDC publication_date：2019-04-01。
- **168460**：Soybeans, mature seeds, sprouted, cooked, steamed；FDC publication_date：2019-04-01。
- **171119**：Chicken, feet, boiled；FDC publication_date：2019-04-01。
- **174730**：Beef, New Zealand, imported, manufacturing beef, cooked, boiled；FDC publication_date：2019-04-01。
- **173095**：Beef, New Zealand, imported, variety meats and by-products, tripe cooked, boiled；FDC publication_date：2019-04-01。
- **174737**：Beef, New Zealand, imported, variety meats and by-products, tongue, cooked, boiled；FDC publication_date：2019-04-01。
- **168290**：Pork, fresh, variety meats and by-products, feet, cooked, simmered；FDC publication_date：2019-04-01。
- **168323**：Pork, fresh, variety meats and by-products, stomach, cooked, simmered；FDC publication_date：2019-04-01。
- **172389**：Chicken, broilers or fryers, thigh, meat only, cooked, stewed；FDC publication_date：2019-04-01。
- **171076**：Chicken, broilers or fryers, breast, meat and skin, cooked, stewed；FDC publication_date：2019-04-01。
- **171971**：Crustaceans, shrimp, mixed species, cooked, moist heat (may contain additives to retain moisture)；FDC publication_date：2019-04-01。
- **171975**：Mollusks, clam, mixed species, cooked, moist heat；FDC publication_date：2019-04-01。
- **172010**：Mollusks, cuttlefish, mixed species, cooked, moist heat；FDC publication_date：2019-04-01。
- **174249**：Mollusks, octopus, common, cooked, moist heat；FDC publication_date：2019-04-01。
- **174250**：Mollusks, oyster, Pacific, cooked, moist heat；FDC publication_date：2019-04-01。
- **174217**：Mollusks, mussel, blue, cooked, moist heat；FDC publication_date：2019-04-01。
- **174207**：Crustaceans, crayfish, mixed species, wild, cooked, moist heat；FDC publication_date：2019-04-01。
- **172449**：Tofu, soft, prepared with calcium sulfate and magnesium chloride (nigari)；FDC publication_date：2019-04-01。
- **169242**：Mushrooms, shiitake, raw；FDC publication_date：2019-04-01。
- **168436**：Mushrooms, shiitake, dried；FDC publication_date：2019-04-01。
- **169382**：Mushrooms, enoki, raw；FDC publication_date：2019-04-01。
- **168580**：Mushrooms, oyster, raw；FDC publication_date：2019-04-01。
- **168457**：Seaweed, kelp, raw；FDC publication_date：2019-04-01。
- **169250**：Lotus root, raw；FDC publication_date：2019-04-01。
- **169979**：Cabbage, chinese (pe-tsai), raw；FDC publication_date：2019-04-01。
- **170390**：Cabbage, chinese (pak-choi), raw；FDC publication_date：2019-04-01。
- **170069**：Waxgourd, (chinese preserving melon), raw；FDC publication_date：2019-04-01。
- **170066**：Waterchestnuts, chinese, (matai), raw；FDC publication_date：2019-04-01。
- **170149**：Seeds, lotus seeds, dried；FDC publication_date：2019-04-01。
- **174256**：Mung beans, mature seeds, raw；FDC publication_date：2019-04-01。
- **173727**：Beans, adzuki, mature seeds, raw；FDC publication_date：2019-04-01。

## 重建与扩充

`python scripts/import_usda.py --archive 官方ZIP路径`

扩充时先核验官方条目编号、完整名称、形态和单位，在selection.json中添加人工匹配标注，再从官方数据重建。不要手填模型生成数值到foods.json。原始选中CSV行保存在source_rows.json，可逐条核对。
