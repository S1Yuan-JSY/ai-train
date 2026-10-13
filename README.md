# 爱练 · AI-TRAIN

适配手机浏览器的健身记录与私教对话项目。前端使用 TypeScript 与原生网页，后端使用 FastAPI、LangChain、LangGraph 和 DeepSeek。目前提供网页版，无需安装 Android APP。

## 本次更新：食物RAG与服务器部署

注册已取消邀请码，共用站点 API；[aitrain.fit 上线操作清单](deploy/AITRAIN-FIT.md)。

- 饮食页增加一餐描述、营养卡片、USDA参考搜索与按克记录，食物来源和份量估计分别标注。
- [官方食物热量参考表](knowledge/nutrition/FOOD_NUTRITION_REFERENCE.md)：124个条目，直接提取自USDA SR Legacy 2018最终版；原始编号、数值、英文形态与下载校验摘要完整保留。
- [USDA原版说明PDF](knowledge/nutrition/USDA-SR-Legacy-Official-Guide.pdf) 与 [食物RAG实现说明](docs/FOOD-RAG.md)。未匹配的食物仍明确标为模型估算。
- [租服务器后部署教程](deploy/README.md)：填写 `deploy/.env.example` 中的空项，保存为 `deploy/.env`。Dockerfile、deploy/compose.yaml 和 deploy/Caddyfile 已准备好。
- 域名、DeepSeek密钥与模型名需要你填写（注册不需要邀请码）；IP填域名DNS，不填前端代码。完成部署后手机用HTTPS域名访问，不再依赖本机在线。

## 1. 在电脑上启动

### 环境准备

- Windows 电脑，安装 Python 3.11 或以上版本，确保 PowerShell 中 `python --version` 能显示版本。
- 首次启动需要联网下载依赖。
- 直接运行已构建的网页不需要 Node.js；修改 TypeScript 源码时才需要。

将源码包解压，在包含 README.md 的 `ai-train` 文件夹中打开 PowerShell，执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1
```

当前工作目录必须是项目根目录，不能是压缩包内部或 backend 子目录。首次运行会安装后端依赖到 `.python-deps-web-v3`，创建 `backend/.env` 并生成旧数据兼容令牌；已有配置不会被覆盖。

看到 `Uvicorn running on http://0.0.0.0:8787` 后，在电脑浏览器打开：

<http://localhost:8787/>

保持启动窗口运行；关闭窗口或按 Ctrl+C 会停止服务。`0.0.0.0` 表示监听网络接口，不是需要在浏览器输入的地址。

## 2. 在手机上打开（同一 Wi-Fi）

手机不需要安装 Python，也不需要复制项目。程序运行在电脑上，手机浏览器访问电脑提供的网页。

### 第一步：连接同一网络

让手机与电脑连接同一个 Wi-Fi。电脑通过网线连接同一路由器也可以。优先使用普通家庭网络；访客 Wi-Fi 或开启设备隔离的网络可能阻止访问。

### 第二步：启动电脑服务

按上一节启动项目，确认电脑可以打开 <http://localhost:8787/>，并保持启动窗口运行。

### 第三步：查看电脑的局域网 IP

在电脑另开一个 PowerShell 窗口，执行：

```powershell
ipconfig
```

在正在使用的“无线局域网适配器 WLAN”或“以太网适配器”下找到 **IPv4 地址**。不要选择 VPN、虚拟机或未连接的网卡。

例如电脑的 IPv4 地址是 `192.168.1.23`，手机浏览器就输入：

```text
http://192.168.1.23:8787/
```

请将示例 IP 替换成你电脑的实际地址。手机上不能输入 `localhost` 或 `127.0.0.1`，它们指向手机自己。

### 第四步：登录或注册

页面首先显示登录页，登录后显示首页、记录、档案、饮食及助手。

- 用户名：3–40 位字母、数字、下划线或短横线。
- 密码：至少 10 个字符。
- 注册只需用户名和密码，不需要邀请码或个人 API Key。
- 所有用户共用服务端 DeepSeek API，费用由站点所有者承担，Key 不发送到浏览器。

电脑和手机使用同一个账号，可读取同一份服务端数据。登录后先补全个人档案。可通过手机浏览器的“添加到主屏幕”创建快捷入口（菜单名称因浏览器而异）；它仍然是网页，使用时需要电脑服务在线。

### 手机打不开时

| 现象 | 排查方法 |
| --- | --- |
| 电脑也打不开 | 检查启动窗口是否报错，服务是否仍在运行，端口是否正确。 |
| 电脑能打开，手机超时 | 检查是否同一网络、IP 是否选对，以及防火墙是否允许 Python 在私人网络中接收连接。无需关闭整个防火墙。 |
| 同一 Wi-Fi 仍无法连接 | 检查路由器的访客网络/AP 隔离；临时停用影响局域网路由的 VPN 后重试。 |
| 昨天可以，今天不行 | 重启或重新连接网络后电脑 IP 可能变化，重新执行 ipconfig。 |
| 更改端口后打不开 | 手机网址中的端口也要同步修改。 |
| HTTP 下登录不能保持 | 本地调试时确认 backend/.env 中 COOKIE_SECURE=false；修改后重启。 |

端口被占用时，可使用其他端口：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1 -Port 8788
```

对应电脑地址为 `http://localhost:8788/`，手机地址为 `http://电脑IPv4地址:8788/`。

此方式仅用于同一局域网。手机切换到移动网络后通常无法访问；需要随时随地使用时，应将服务部署到持续在线的服务器，配置 HTTPS、域名及 COOKIE_SECURE=true，手机再访问部署后的网址。当前本地启动脚本不会自动部署；公网部署使用 [deploy/README.md](deploy/README.md) 中的 Docker Compose 模板。

## 3. 配置 DeepSeek

编辑项目的 `backend/.env`，将示例中的密钥替换成自己的有效密钥：

```dotenv
DEEPSEEK_API_KEY=你的DeepSeek密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=你的账户可用的模型名称
```

模型名称以自己的 DeepSeek 账户可用配置为准。保存后，在启动窗口按 Ctrl+C，再重新运行启动脚本。密钥仅配置在电脑服务端，不填手机网页，不上传到公开仓库。

没有有效密钥时，明确格式的训练与身体数据记录仍可使用；私教回复、自然语言解析和饮食估算需要有效模型配置。

`APP_ACCESS_TOKEN` 与 DeepSeek 密钥是两种不同配置：前者仅用于兼容旧共享档案访问与导入，注册不再需要，后者用于模型 API 调用。

## 4. 日常使用

### 档案与基础代谢

身高、体重、性别、年龄、训练目标、训练方式及训练计划必填。伤病、关节问题、过敏、慢性病及禁忌动作选填；留空表示未提供。

按指定公式计算基础代谢，单位 kcal/天：

```text
BMR = 13.88 × 体重kg + 4.16 × 身高cm − 3.43 × 年龄 − 112.40 × 性别 + 54.34
男性 = 0，女性 = 1
```

前端公式在 `frontend/src/core.ts` 的 metabolism()，后端在 `backend/metabolism.py` 的 calculate_bmr()。175cm、60kg、30岁：男性1512.24，女性1399.84 kcal/天。结果为估算；当前档案支持18–100岁成人。

### 训练与日历

首页选择日历日期，设置训练部位、开始时间、时长及具体计划。可修改或删除当天安排；“按计划开始训练”会开启本次训练。

记录页输入示例：

```text
今天体重60kg
练胸日
刚刚做了一组卧推8次60kg
第二组60kg做了8次
我上次练胸都做了什么
```

记录成功后，训练组显示在记录页顶部。未开始训练日时，先选择训练日再保存；训练结束后保存为该训练日的上次训练。

### 饮食

输入例如：

```text
我今天吃了200g米饭，一个琵琶腿，一小碗西兰花
```

服务先通过 tool 提取食物和份量，检索已收录的USDA官方条目，再调用 DeepSeek 估计模糊份量；命中时程序直接使用官方营养值，未匹配时标为模型估算，整理当天营养表及假设。模糊份量属于估算，可修改；食物库可按包装标签录入每100g数据。

### 私教对话与 RAG

助手页直接对话，例如：

```text
结合我的档案，帮我安排今天的训练。
我上次练胸做了什么？下次如何调整？
记住：我通常晚上训练，每次只有40分钟。
```

私教结合当前档案、训练记录和长期偏好，检索提供项目中的24篇训练文档。回答可展开查看引用片段。训练知识采用中文 BM25 检索；食物知识采用结构化条目检索，两者均无需额外嵌入 API。训练文档未经逐条医学核验；食物数值来自官方数据但与实际餐食可能不同，不能保证模型回答完全正确。

明确表达的长期偏好在记忆工具成功后保存原话，可在“私教记住了什么”中查看、修改或删除。新对话会读取长期偏好；历史对话可通过下拉框继续。并非每条聊天都会自动转成长期事实。体重、饮食、训练等数值记录仍在记录页保存。

完整聊天保留在数据库中；模型每次只读取最近40条消息（按用户消息边界截取），并读取当前档案、业务记录与最多100条长期偏好。当前没有跨所有历史聊天的语义搜索或自动摘要。

## 5. 数据保存位置与备份

默认相对于项目目录：

| 数据 | 默认位置 |
| --- | --- |
| 账号、登录会话、个人档案、测量历史、训练、日历计划和饮食记录；回答引用 | backend/data/memory.sqlite3 |
| 私教长期偏好与完整对话 | backend/data/agent.sqlite3 |
| 服务端配置 | backend/.env |
| RAG 文档 | knowledge/fitness/ |

SQLite 数据保存在运行服务的电脑上，不是手机内存。关闭手机网页或退出登录不会删除这些数据；重新登录同一账号即可读取。电脑服务停止时数据仍在磁盘，但手机暂时无法访问。

MEMORY_DB 可修改业务库路径，AGENT_MEMORY_DB 可修改本地助手库路径。完整备份建议先停止服务，再复制两个数据库及必要配置；设置页的 JSON 导出只包含业务数据，不包含完整聊天、账号与全部助手记忆。

默认不需要 PostgreSQL。若设置 POSTGRES_URI，助手改用官方 AsyncPostgresStore / AsyncPostgresSaver，需先初始化数据库；SQLite 与 PostgreSQL 不会自动迁移。业务数据仍用 SQLite，完整备份需同时保留业务库和 PostgreSQL 数据。详见 [私教与RAG说明](docs/COACH-RAG.md)。

助手调用会向 DeepSeek 发送当前档案、相关业务记录、偏好及聊天上下文。启用可选 Embedding 配置时，记忆文本还会发送至相应服务。当前没有密码重置、自动备份或通用 JSON 恢复导入。

## 6. 项目目录与代码入口

```text
ai-train/
├── frontend/
│   ├── src/core.ts          # 校验、记录与程序计算
│   └── public/              # 网页界面与已构建资源
├── backend/
│   ├── .env.example         # 配置模板
│   ├── app.py               # FastAPI接口
│   ├── chain.py             # LangChain记录解析
│   ├── agent_memory.py      # 私教Agent、工具和会话记忆
│   ├── local_store.py       # 持久化SQLite BaseStore适配器
│   ├── rag.py               # 文档切片与BM25检索
│   ├── metabolism.py        # 基础代谢公式
│   └── requirements.lock.txt
├── knowledge/fitness/       # 24篇参考文档及原MIT许可证
├── tests/                   # 前后端测试
├── scripts/start-web.ps1    # Windows启动入口
├── docs/                    # 详细说明
├── compose.yaml             # 可选PostgreSQL容器
├── package.json
└── README.md
```

文档来自提供的 fitness-agent-main 项目，保留原 MIT 许可证及版权说明。修改或新增知识文档后重启服务，重新生成检索缓存。

## 7. 开发与测试

修改 TypeScript 源码后，安装 Node.js，在项目根目录执行：

```powershell
npm ci
npm run build
npm test
npm run typecheck
$env:PYTHONPATH = "$PWD\.python-deps-web-v3"
$env:LANGSMITH_TRACING = 'false'
python -m unittest discover -s tests/backend -p 'test_*.py' -v
```

也可使用独立 Python 虚拟环境运行后端：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.lock.txt
# 仅没有配置文件时复制模板，再编辑服务端 API 密钥
Copy-Item backend/.env.example backend/.env
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8787 --env-file backend/.env --no-access-log
```

已有 backend/.env 时不要用模板覆盖。真实 PostgreSQL 集成测试需要独立测试库 TEST_POSTGRES_URI；本地测试不会证明真实 DeepSeek 账户的密钥、余额和模型可用。

## 标签拍照与每日归档

饮食页“拍标签·按克记录”支持手机拍照和图片选择，本地中英文OCR，核对后按标签基准与摄入克数换算。支持kJ/kcal、每100g、每份克数及有密度的毫升标签；保存原始标签数值与可选微量营养。详见 docs/LABEL-ARCHIVE.md。

往日饮食与训练按本地日期保存、默认折叠，今天展开。同日多次训练均保留，仍支持查询最近同类训练。
