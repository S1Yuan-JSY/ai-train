# 爱练私教：RAG 与长期记忆

助手入口以对话为主，支持新对话、历史会话、长期偏好管理，以及回答来源展开查看。

## 知识库

`knowledge/fitness/` 收录提供的 fitness-agent-main 项目的24篇 Markdown，保留原 MIT LICENSE（Copyright 2026 Zyh）。文档未经逐条科学/医学核验，仅供参考。未沿用原 FAISS 文件，因为其嵌入模型说明与配置不一致。

`backend/rag.py` 将文档分为640字符片段、重叠100字符，采用中文双字词及 BM25 词项检索；这是检索增强生成，不是向量语义检索，不需要额外嵌入 API。默认每轮检索4个片段，另提供 LangChain search_fitness_knowledge 工具，供私教进一步检索。回答 [K编号] 只展示实际检索到的来源。引用片段按会话消息保存，可随历史回答恢复。新增 Markdown 后重启服务即可重新构建检索缓存。

## 记忆

业务数据仍存 `backend/data/memory.sqlite3`（MEMORY_DB 可改）。未配置 POSTGRES_URI 时，偏好由自定义 SQLiteStore 实现 LangGraph BaseStore 接口，完整对话使用官方 AsyncSqliteSaver，均存 `backend/data/agent.sqlite3`（AGENT_MEMORY_DB 可改）。这不是内存 Store；操作在 SQLite 事务内加载并写回，服务重启后保留，适用于个人及小规模使用。

配置 POSTGRES_URI 后仍使用官方 AsyncPostgresStore / AsyncPostgresSaver；启动前运行原 setup_memory 初始化。两种后端不会自动迁移，切换前请备份。个人记忆按用户 namespace 隔离，会话由服务端校验归属。

完整历史持续保存，每次模型调用只发送最近40条消息（按用户消息边界截取），同时加载当前准确档案、业务记录及最多100条长期偏好。跨会话长期偏好只有在明确表达记忆意图且保存工具成功时才保存用户原话；并非所有聊天都自动转成长期事实。历史会话可以选择恢复；尚未提供跨全部聊天的语义搜索或自动摘要。

基础代谢、营养汇总与测量变化仍由程序计算。模型不能通过私教聊天修改数值记录。模型输出仍需判断，RAG 不能保证回答绝对正确。

## 运行

在项目目录运行 `powershell -ExecutionPolicy Bypass -File scripts/start-web.ps1`，打开 http://localhost:8787/ 。在 backend/.env 配置 DeepSeek 密钥，重启后私教可生成回答。浏览器中不填写 DeepSeek 密钥。
