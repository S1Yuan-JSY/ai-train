# 爱练 · AI-TRAIN

面向手机浏览器的健身记录与 AI 私教应用，将个人档案、训练计划、训练记录、饮食管理和私教对话放在一起。支持电脑与手机使用同一账号访问，自行部署后数据保存在自己的服务器上。

项目采用原生网页与 TypeScript、FastAPI、LangChain / LangGraph 和 DeepSeek。默认使用 SQLite，无需配置 PostgreSQL；仓库已包含前端构建产物和本地 OCR 资源，可以直接启动 Python 服务。

## 功能

| 模块 | 当前支持 |
| --- | --- |
| 账号与档案 | 注册、登录、会话恢复、账号数据隔离；身高、体重、体脂、目标、计划及可选身体限制 |
| 训练计划 | 日历安排训练部位、时间、时长与计划，按计划开始训练 |
| 训练记录 | 记录动作、重量和次数，查询最近同类训练；同日多次训练和往日记录归档 |
| 饮食管理 | 自然语言描述一餐、营养估算、食物库、按克记录、每日营养汇总 |
| 食物参考 | 检索 124 条 USDA SR Legacy 2018 食物条目，区分参考营养值、估计份量与模型估算 |
| 标签识别 | 拍照或上传包装标签，浏览器本地中英文 OCR；核对后按每 100g、每份或带密度的毫升标签换算 |
| AI 私教 | 结合档案、业务记录和训练知识库回答，展示检索引用，支持历史会话和长期偏好管理 |
| 数据导出 | 导出业务数据 JSON；完整备份使用数据库文件或部署备份脚本 |

私教聊天用于建议与偏好记忆，体重、训练和饮食等数值通过对应记录入口保存。基础代谢与营养合计由程序计算。

## 快速开始

### 1. 获取代码

需要 Git、Python 3.11 或以上版本。首次安装 Python 依赖需要联网；只有修改和构建前端时才需要 Node.js 与 npm。

```bash
git clone git@github.com:S1Yuan-JSY/ai-train.git
cd ai-train
```

当前仓库为私有仓库，克隆账号需要访问权限。上面的 SSH 地址需要已配置 GitHub SSH 认证，也可使用 HTTPS：

```bash
git clone https://github.com/S1Yuan-JSY/ai-train.git
```

### 2. 配置模型

在项目根目录打开 PowerShell。首次运行时复制配置模板；已有配置不会被覆盖：

```powershell
if (-not (Test-Path backend/.env)) {
    Copy-Item backend/.env.example backend/.env
}
notepad backend/.env
```

在文件中填写：

```dotenv
DEEPSEEK_API_KEY=你的有效密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=你的账户可用的模型名称
COOKIE_SECURE=false
```

模型名应与实际账户支持的配置一致。密钥仅保存在服务端，用户无需在网页中填写。所有账号共用站点的模型 API，费用由部署者承担。

没有有效模型配置时，明确格式的训练与身体数据记录、食物按克换算和标签 OCR 仍可使用；私教回复、需要模型的自然语言解析和一餐估算不可用。

### 3. 启动服务

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1
```

脚本会安装依赖到 `.python-deps-web-v3/`，并启动服务；未创建 `backend/.env` 时会自动从模板生成。打开：

- 网页：<http://localhost:8787/>
- 健康检查：<http://localhost:8787/health>

保持终端运行，按 `Ctrl+C` 停止。修改 `.env` 后需要重启。端口被占用时可以指定其他端口：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1 -Port 8788
```

### 4. 注册并使用

用户名为 3–40 位字母、数字、下划线或短横线，密码为 10–128 个字符。注册无需邀请码，也不需要个人 API Key。

登录后先完善档案，再安排训练、记录饮食或打开助手。记录页可以输入：

```text
今天体重60kg
练胸日
刚刚做了一组卧推8次60kg
第二组60kg做了8次
```

饮食页可以描述一餐，例如“吃了200g米饭、一个鸡腿和一小碗西兰花”；对模糊份量应核对或修改估算结果。助手中可输入“结合我的档案安排今天的训练”，或“记住：我通常晚上训练，每次只有40分钟”。

## 手机访问

本地使用时，手机与电脑连接同一局域网。在电脑运行 `ipconfig`，找到当前网络的 IPv4 地址，然后在手机打开 `http://电脑IPv4地址:8787/`，例如 `http://192.168.1.23:8787/`。

手机上的 `localhost` 指向手机本身。电脑服务需要保持运行；手机切换到移动网络后不能依靠该局域网地址访问。

直接调用相机需要 HTTPS，或当前设备上的 `localhost` / `127.0.0.1`。手机通过局域网 HTTP 地址访问时，可改用图片选择上传。标签图片在浏览器内识别，不上传或保存到服务端；确认的标签文本、营养值与克数会保存到账号中。

## 服务器部署

项目提供 Linux 服务器使用的 Docker Compose + Caddy 模板，支持域名访问、自动 HTTPS 和 SQLite 数据持久卷。

准备好服务器、Docker Engine、Compose 插件和自己的域名，将域名解析到服务器并开放 TCP 80 / 443。在服务器的项目根目录执行：

```bash
# 仅首次创建；已有配置请直接编辑
[ -f deploy/.env ] || cp deploy/.env.example deploy/.env
nano deploy/.env
chmod 600 deploy/.env

docker compose --env-file deploy/.env -f deploy/compose.yaml config --quiet
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --build
docker compose --env-file deploy/.env -f deploy/compose.yaml ps
```

在 `deploy/.env` 中设置 `DOMAIN`、`DEEPSEEK_API_KEY` 和 `DEEPSEEK_MODEL`，然后通过 `https://你的域名/` 访问。模板中的 `aitrain.fit` 需按实际域名修改；仓库包含部署配置不代表该站点已经上线。

服务器部署读取 `deploy/.env`，本地运行读取 `backend/.env`。生产模板自动设置安全 Cookie、同源地址与数据库路径，仅 Caddy 对外开放端口，适合单实例、小规模使用。

详细操作、数据迁移与恢复见 [服务器部署指南](deploy/README.md)。项目根目录的 `compose.yaml` 仅用于可选 PostgreSQL，网页部署应使用 `deploy/compose.yaml`。

## 配置说明

| 配置项 | 用途 |
| --- | --- |
| `DEEPSEEK_API_KEY` | 服务端模型密钥 |
| `DEEPSEEK_MODEL` | 实际可用的模型名称 |
| `DEEPSEEK_BASE_URL` | 模型服务地址，模板为 `https://api.deepseek.com` |
| `COOKIE_SECURE` | 本地 HTTP 使用 `false`，生产 HTTPS 使用 `true` |
| `MEMORY_DB` | 账号与业务数据的 SQLite 路径 |
| `AGENT_MEMORY_DB` | 本地助手偏好与会话的 SQLite 路径 |
| `POSTGRES_URI` | 可选；设置后助手改用 PostgreSQL Store / Saver，业务数据仍使用 SQLite |
| `APP_ACCESS_TOKEN` | 仅兼容旧共享档案访问与导入，注册无需设置 |
| `LANGSMITH_TRACING` | 启动脚本与部署模板默认关闭追踪 |

默认不需要 Embedding API：训练文档使用中文 BM25 检索，食物库使用结构化检索。可选 PostgreSQL 与 Embedding 配置见代码模板和 [私教 RAG 与长期记忆说明](docs/COACH-RAG.md)。切换助手数据库前需初始化目标库，现有数据不会自动迁移。

## 数据与备份

| 数据 | 默认位置 |
| --- | --- |
| 账号、登录会话、档案、测量、训练、饮食、日历及回答引用 | `backend/data/memory.sqlite3` |
| 私教长期偏好与完整会话 | `backend/data/agent.sqlite3` |
| 本地服务配置 | `backend/.env` |
| 服务器配置 | `deploy/.env` |

本地完整备份应先停止服务，再复制 `backend/data/` 整个目录，并单独保管配置。网页导出的 JSON 是业务数据导出，不包含账号、完整聊天与全部助手记忆，也不提供通用 JSON 恢复导入。

使用服务器模板时，在项目根目录运行：

```bash
sh deploy/backup.sh
```

脚本会短暂停止应用，备份 SQLite 数据后恢复启动，文件保存在 `deploy/backups/`。需自行定期运行并保存异地副本；不要执行 `docker compose down -v` 删除持久卷。使用 PostgreSQL 时还需单独备份 PostgreSQL 数据。

`.gitignore` 已排除真实 `.env`、业务数据库、备份和依赖目录，请保留这些规则。

## 开发与测试

### 独立 Python 环境

也可以不用 Windows 启动脚本，改用虚拟环境。在项目根目录执行：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.lock.txt
# 首次使用时按上文创建并编辑 backend/.env
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8787 --env-file backend/.env --no-access-log
```

Linux / macOS 可用 `python3 -m venv .venv` 创建环境，再执行 `source .venv/bin/activate`，其余安装与启动命令相同。

### 前端构建

```bash
npm ci
npm run build
npm run typecheck
npm test
```

构建会打包 `frontend/src/core.ts`，并复制 OCR 脚本、WASM 与语言包到 `frontend/public/vendor/ocr/`。修改前端源码后，应将更新后的构建产物一并提交；Docker 镜像直接使用仓库内的 `frontend/public/`。

### 后端测试

在已安装后端依赖的虚拟环境中执行：

```bash
python -m unittest discover -s tests/backend -p 'test_*.py' -v
```

如果使用 Windows 启动脚本安装的依赖，可在当前 PowerShell 中先设置：

```powershell
$env:PYTHONPATH = "$PWD\.python-deps-web-v3"
$env:LANGSMITH_TRACING = 'false'
python -m unittest discover -s tests/backend -p 'test_*.py' -v
```

真实 PostgreSQL 集成测试需提供独立测试库 `TEST_POSTGRES_URI`。自动测试不能替代真实模型账户、手机摄像头和服务器 HTTPS 部署验证。

## 项目结构

```text
ai-train/
├── backend/                 # FastAPI、账号、解析、Agent 与存储
│   ├── app.py               # API 与静态资源服务
│   ├── agent_memory.py      # 私教工具、长期偏好与会话
│   ├── chain.py             # 自然语言记录解析
│   ├── food_rag.py          # 食物参考检索
│   ├── meals.py             # 一餐解析与营养估算
│   ├── rag.py               # 训练知识 BM25 检索
│   └── .env.example         # 本地配置模板
├── frontend/
│   ├── src/                 # TypeScript 校验、计算与标签解析
│   └── public/              # 网页、构建产物与本地 OCR 资源
├── knowledge/
│   ├── fitness/             # 24 篇训练参考文档
│   └── nutrition/           # USDA 食物条目、来源与说明
├── deploy/                  # Caddy、生产 Compose 与备份脚本
├── docs/                    # 功能与实现说明
├── scripts/                 # 本地启动、OCR 构建和数据导入
├── tests/                   # 前后端测试
├── Dockerfile               # Python 服务与静态网页镜像
└── compose.yaml             # 可选 PostgreSQL 开发容器
```

## 常见问题

| 问题 | 处理方法 |
| --- | --- |
| 电脑能打开，手机无法访问 | 检查同一局域网、IPv4 地址、防火墙私人网络权限与路由器访客隔离 |
| 重启电脑后手机打不开 | 电脑 IP 可能变化，重新运行 `ipconfig` |
| 本地 HTTP 登录不能保持 | 检查 `COOKIE_SECURE=false`，修改后重启 |
| 助手提示模型配置错误 | 检查服务端密钥、模型名、账户余额和网络，修改后重启 |
| 手机不能打开相机 | 使用 HTTPS；局域网 HTTP 可改为选择图片 |
| 修改训练知识库后没有变化 | 重启服务以重新生成检索缓存 |

## 实现边界与相关文档

- 私教每轮读取当前档案、相关业务记录、最近最多 40 条消息（按用户消息边界截取）及最多 100 条长期偏好。完整聊天持续保存，但尚无跨全部历史聊天的语义搜索或自动摘要。
- 明确的长期偏好需由记忆工具成功保存，可在界面查看、修改和删除；不是每条聊天都会自动成为长期记忆。
- AI 请求会将相应档案、记录、偏好和聊天上下文发送至 DeepSeek；可选 Embedding 服务也会接收待索引的记忆文本。
- 当前没有密码重置、邮箱验证或按用户划分的 AI 消费额度。公开提供服务前应补充适合自己的用量控制。
- 档案目前支持 18–100 岁成人。基础代谢、份量与 AI 建议具有估算性质；训练知识未经逐条医学核验，标签 OCR 结果需人工核对。

进一步阅读：

- [私教 RAG 与长期记忆](docs/COACH-RAG.md)
- [食物 RAG 实现](docs/FOOD-RAG.md)
- [标签识别与每日归档](docs/LABEL-ARCHIVE.md)
- [USDA 食物营养参考表](knowledge/nutrition/FOOD_NUTRITION_REFERENCE.md)
- [服务器部署、迁移与备份](deploy/README.md)

训练知识文档来自 `fitness-agent-main`，保留其 [MIT 许可证与版权说明](knowledge/fitness/LICENSE)。OCR 第三方许可随资源保存在 `frontend/public/vendor/ocr/`；这些许可分别适用于对应材料，不代表整个项目统一采用该许可证。
