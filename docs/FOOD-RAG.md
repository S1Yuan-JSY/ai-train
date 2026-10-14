# 食物营养RAG与数据来源

## 权威性与范围

数值来源为USDA Agricultural Research Service的FoodData Central官方SR Legacy下载包，最终版本2018-04。项目从原始CSV自动提取124条常见食物，每条保留FDC ID、英文名称、每100g数值及条目URL；不是模型生成的营养表，也不声称是2026年更新数据。中文名称、别名、默认形态与筛选规则是项目注释。

- 人读食物热量文档：`knowledge/nutrition/FOOD_NUTRITION_REFERENCE.md`
- USDA原版说明PDF：`knowledge/nutrition/USDA-SR-Legacy-Official-Guide.pdf`
- RAG结构化数据：`knowledge/nutrition/foods.json`
- 原始选中CSV行：`knowledge/nutrition/source_rows.json`
- 人工核对的中文匹配表：`knowledge/nutrition/selection.json`
- 可复现导入器：`scripts/import_usda.py`

该数据适用于对应形态的食物；国外品种、品牌、油和酱料与实际餐食可能不同。官方数据不代表每餐被精确测量。若后续需要中国食物成分表，应从合法来源取得可用数据及许可，不把来源不明转载表标成官方。

## 执行路径

`餐食描述 → LangChain提取tool → retrieve_food_nutrients检索官方条目 → 引用随输入交给模型估计份量 → 程序用原始官方数值覆盖营养字段 → 返回来源与假设 → 保存`

这是结构化检索增强，不使用向量Embeddings。匹配用人工中文别名、形态限制及保守单食物检查；不是无限覆盖的语义营养库。

数据库命中时，热量来自原始nutrient_id=1008，蛋白1003、脂肪1004、碳水1005。程序不会让模型修改这些数字，也不会将官方热量强制改成4/4/9；后者只用于明确标注的模型估算分支。

如“米饭”默认参照熟、未强化、无盐白米饭；“琵琶腿”参照烤制带皮鸡小腿；“西兰花”参照无盐水煮沥干条目，结果展示对应名称和假设。用户实际是油炸、炒制、加酱或不同形态时，应选择正确条目或更完整描述。不支持的混合菜、品牌变体、生熟冲突会回退模型估算并明确标识。

## 前端使用

饮食页可直接输入一餐，也可搜索“查食物·按克记录”，选择与实际食物一致的条目并填写可食克数。后者不调用DeepSeek。每条记录分别标识营养来源和份量来源，提供USDA原条目链接。原手工食物库继续支持包装标签数据。

私教也新增search_food_nutrition工具，以[FDC编号]展示食物引用。训练知识仍沿用原24篇文档，两类来源不混同。

## 服务接口与代码

| 位置 | 作用 |
|---|---|
| backend/food_rag.py | 食物检索、保守形态匹配、官方份量换算及LangChain工具 |
| backend/meals.py | 提取→检索→分析，数值强制取来源与估算回退 |
| GET /nutrition/search?q=米饭 | 登录后搜索，返回数值与出处 |
| POST /nutrition/portion | 提交food_id与grams，生成动作；需继续PUT /memory持久化 |
| backend/agent_memory.py | 私教食物检索和[FDC编号]引用 |
| frontend/public/app.js | 描述录入、食物搜索、按克记录和来源展示 |
| frontend/src/core.ts | 来源元数据校验与业务状态保存 |

## 增加条目

下载官方SR Legacy CSV ZIP，在selection.json添加已核验的FDC编号、中文名称和别名，再执行：

```bash
python scripts/import_usda.py --archive /path/to/FoodData_Central_sr_legacy_food_csv_2018-04.zip
```

重建后核对差异、补充生熟及混合菜误匹配测试，再重启服务以清除检索缓存。不需要USDA API Key；运行时不请求外部食物API。

官方来源：[下载页](https://fdc.nal.usda.gov/download-datasets/)、[数据类型与版本](https://fdc.nal.usda.gov/data-documentation/)、[使用与来源声明](https://fdc.nal.usda.gov/api-guide/)。

## 2026-10-11 扩充

由33条扩至124条，优先覆盖中餐常见蔬菜、菌藻、杂豆与清淡熟食。水煮筛选63条；另分列炖、小火煮、蒸、湿热和做法未细分的熟食，不能互相替代。来源仍为USDA历史样品，不冒充中国本土成分表。

新增 nutrientsPer100g：fiber（g）；calcium、iron、magnesium、potassium、sodium、zinc、vitaminC（mg）。缺失值保留 null，页面显示“未提供”；原始CSV行覆盖所有这些字段。附加营养供查阅，今日合计仍汇总能量及三大营养素。

搜索接口支持 category、method、offset、limit（默认12，最大50），返回 total 匹配数和 count 全库数。页面支持分类、形态筛选及上下页，默认水煮优先。数据更新后须重启已有后端进程，再刷新网页。

### 混合饮食估算

饮食分析采用参考数据与模型结合：可靠匹配的单一食物使用原始 USDA 营养值；炒菜、卤味、含糖菜品和餐馆混合菜未可靠匹配时，由模型参考相近食材与常见做法估算。候选食材不会被当作整道菜的官方匹配；无候选时仍可估算。

模型估算会考虑常见油、糖、酱料、皮骨和汤汁处理，并展示假设。已明确的克数保持不变，按个或份描述的重量显示估计范围。餐馆名称不代表掌握其配方，结果不是该店官方营养数据，可在记录后按实际份量调整。

### 保存前核对

饮食页与快速记录中的模型饮食分析均先生成草稿，不直接保存。每项可修改成品可食份量，以及该份食物中的额外油和糖克数，实时预览营养后点击“核对完成，保存这一餐”。取消草稿不写入记录。

模型返回的油糖已包含在总脂肪和碳水中；修改时按差额替换，不再次叠加。油糖用量指吃下这份中的量，不是整锅用量；未修改的食材比例仍为估算。对数据库条目修改油糖后标为用户调整估算，不再宣称是原始数据库营养值。旧响应未提供油糖拆分时不猜测为零，只允许调整份量，重新分析后再核对油糖。
