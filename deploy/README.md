# 服务器部署：爱练 AI-TRAIN 网页版

这份目录是待部署代码，不代表已经租赁或发布服务器。推荐在一台安装 Docker Engine 和 Compose 插件的 Linux 服务器上运行，使用域名和 HTTPS。手机通过域名访问，不再要求电脑在线或同一 Wi-Fi。

## 你需要填写的地方

复制 `deploy/.env.example` 为 `deploy/.env`，然后填写空值：

| 配置 | 填什么 | 在哪里获得 |
|---|---|---|
| DOMAIN | aitrain.fit，不带 https://、端口或路径 | 你持有的域名；在 DNS 添加 A 记录指向服务器公网 IPv4 |
| APP_ACCESS_TOKEN | 选填；仅旧共享档案导入时需要至少32字符随机令牌 | 自己生成，不是平台密钥 |
| DEEPSEEK_API_KEY | 有效的模型 API 密钥 | DeepSeek 账户 |
| DEEPSEEK_MODEL | 账户支持的实际模型名 | DeepSeek 模型配置 |
| DEEPSEEK_BASE_URL | 默认 https://api.deepseek.com；使用官方接口可不改 | 已给默认值 |

服务器公网 IP **不填入前端代码**，填在域名 DNS 中。前端请求都是同源相对路径；PUBLIC_ORIGIN、数据库路径和 Cookie 设置由 Compose 自动注入。无需修改 backend/.env；服务器部署读取 deploy/.env。

只有迁移旧共享档案才需要设置令牌，新部署留空即可。生成旧数据令牌可使用：

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

不填写真实值时 Compose 会拒绝启动并提示缺少哪项。`.env` 不应进入源码包或 Git。

## 文件职责

| 路径 | 内容 |
|---|---|
| Dockerfile | Python 后端与静态网页镜像，非root用户运行 |
| .dockerignore | 排除密钥、本地数据库和依赖目录 |
| deploy/.env.example | 你后续填写的配置模板 |
| deploy/compose.yaml | 后端、Caddy、持久卷及生产环境配置 |
| deploy/Caddyfile | 反向代理、自动HTTPS、响应头与请求体限制 |
| deploy/backup.sh | 暂停写入后同时备份两个SQLite数据库 |
| backend/app.py | 生产环境配置检查、域名限制、同源校验和安全Cookie |

## 首次上线

1. 将源码上传到服务器目录，例如 `/opt/ai-train`。请上传源码包，不上传本机 `.python-deps*`、node_modules 和真实 backend/.env。源码已包含构建后的网页与124条官方食物参考，无需部署时再下载USDA数据。
2. 安装 Docker Engine 与 Compose 插件，使用供应商或 Docker 官方安装说明。检查 `docker version` 和 `docker compose version`。
3. 将域名 A 记录指向公网IP；若配置了AAAA记录，也要保证IPv6能正确到达该服务器。
4. 云安全组与系统防火墙开放 TCP 80、443。SSH端口按你自己的管理方式保留；无需开放8787或数据库端口。
5. 执行以下命令（Linux服务器）：

```bash
cd /opt/ai-train
cp deploy/.env.example deploy/.env
nano deploy/.env
chmod 600 deploy/.env
docker compose --env-file deploy/.env -f deploy/compose.yaml config --quiet
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --build
docker compose --env-file deploy/.env -f deploy/compose.yaml ps
docker compose --env-file deploy/.env -f deploy/compose.yaml logs --tail=100 app caddy
```

将 `/opt/ai-train` 换成实际上传目录。若已存在deploy/.env，不要用模板覆盖。

浏览器打开 `https://aitrain.fit/`，注册账号后使用。Caddy在域名解析、80/443可达时自动申请和续期证书。首次签发需要联网，若失败先检查DNS、安全组与日志。不要用 https://服务器IP 代替域名测试公开证书。

## 数据与更新

- `app_data` 持久卷保存 `/app/backend/data/memory.sqlite3` 和 `/app/backend/data/agent.sqlite3`。前者有账号/业务/引用，后者有私教偏好和会话。
- `caddy_data` 保存证书，`caddy_config` 保存Caddy配置状态。
- 重建镜像和普通 `down` 不会删除命名卷；不要使用 `down -v`，它会删除数据卷。
- 使用单个应用实例、单worker，适合个人/小规模部署。不要直接横向扩容这套SQLite模板。现有PostgreSQL可选配置仍保留在项目根目录compose.yaml，不与本目录的网页部署模板混用。
- 后端通过Compose内部网络接受代理头，仅Caddy公开80/443。Dockerfile的代理信任`*`依赖于不发布后端端口；不要自行将8787映射到公网。
- 修改源码后重新 `up -d --build`；仅修改deploy/.env后执行 `up -d` 更新容器配置。改动TypeScript源码时先在开发电脑运行 `npm ci && npm run build`。

## 从本机迁移现有账号与记忆

1. 停止本机爱练服务，将 `backend/data/` 整个目录备份，确保包含业务库、助手库以及可能存在的SQLite旁文件。
2. 上传该备份到服务器暂存目录，先保留原始备份。
3. 首次运行 `docker compose ... up -d --build` 建立空卷，再停止 app。确认目标服务器尚无需要保留的新数据后，将本机数据复制到卷中；不要直接覆盖已有人使用的服务器数据库。
4. 下面为复制命令模板，`/你的本机数据备份目录` 是上传到服务器后的目录，应替换后运行：

```bash
docker compose --env-file deploy/.env -f deploy/compose.yaml stop app
docker compose --env-file deploy/.env -f deploy/compose.yaml run --rm --no-deps --user root --cap-add CHOWN --cap-add DAC_OVERRIDE \
  -v /你的本机数据备份目录:/restore:ro --entrypoint sh app \
  -c 'cp -a /restore/. /app/backend/data/ && chown -R 10001:10001 /app/backend/data'
docker compose --env-file deploy/.env -f deploy/compose.yaml start app
```

用户重新通过域名登录即可，浏览器原localhost登录Cookie不随数据库迁移到新域名。

## 备份与恢复

```bash
# 在项目根目录运行；服务短暂停写，结束后自动启动
sh deploy/backup.sh
```

备份位于deploy/backups，包含两个SQLite库；应定期复制到另一处安全位置。配置密钥另行安全保管，脚本不将密钥打包。

恢复会覆盖当前数据，先另做备份并停止app。选择确定要恢复的压缩包，将命令中的路径换成实际备份文件：

```bash
docker compose --env-file deploy/.env -f deploy/compose.yaml stop app
docker compose --env-file deploy/.env -f deploy/compose.yaml run --rm --no-deps -T \
  --entrypoint tar app -C /app/backend/data -xzf - < deploy/backups/你选定的备份.tar.gz
docker compose --env-file deploy/.env -f deploy/compose.yaml start app
```

## 验证边界

开发阶段已提供生产配置校验和接口测试。若当前开发机未安装Docker，不能声称已完成Linux容器构建或公网证书签发；租好服务器后需实际完成上面的构建、健康检查、注册登录、饮食记录和重启恢复验证。

官方参考：[Docker Compose变量](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)、[Caddy自动HTTPS](https://caddyserver.com/docs/automatic-https)、[Caddy反向代理](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)。

注册无需邀请码或用户 API Key。所有 AI 请求使用服务器 DEEPSEEK_API_KEY，费用由站点所有者承担；账号隔离记录，不隔离 API 账单。现有登录/注册频率限制不等于 AI 消费上限，公开推广前应设置 AI 用量预算与限额。

拍照依赖 HTTPS；Caddy 仅允许同源相机、同源 OCR Worker 和 WebAssembly。不要恢复旧版 camera=() 或删掉 wasm-unsafe-eval、blob: 图片支持。
