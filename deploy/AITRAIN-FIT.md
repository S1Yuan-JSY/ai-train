# aitrain.fit 上线操作清单

目标：手机访问 https://aitrain.fit/，注册或登录个人账号，数据保存在云服务器。域名只是地址，项目仍需要长期在线的服务器。

## 当前账号与 API 模式

已取消注册邀请码。注册只需用户名、密码；服务器使用站点所有者的 DEEPSEEK_API_KEY。用户之间的训练、饮食、会话按账号隔离，但模型账单统一由站点所有者承担。API Key 只配置在服务器 deploy/.env，不发给用户，不填前端。不支持用户自带 Key；该模式需要另做密钥加密保存、更换/撤销与按用户路由。

APP_ACCESS_TOKEN 不再是注册条件；新部署留空即可，仅为兼容旧共享档案保留。已有账号和密码不改变。手动记录、官方食物库和本机标签 OCR 不调用 DeepSeek；私教对话、在线解析和模型估算会调用模型。

## 购买前准备

1. 在域名注册商确认 aitrain.fit 是否仍可注册，再查看首年价格与续费价格。本项目未购买域名，也未确认域名可用性。域名通常按年注册和续费。
2. 选择一台带公网 IPv4 的 Linux 云服务器，安装 Docker Engine 和 Compose 插件。小规模试用可从 2 核 / 2GB 内存起步，实际并发与性能需上线压测。该项目通过远程 API 调用模型，无需 GPU。
3. 中国大陆服务器需要按接入商流程完成 ICP 备案，并在购买前确认域名后缀、注册商与主体符合备案要求。香港或境外服务器通常无需中国大陆接入备案，但大陆访问体验应实测；站点运营要求仍按实际服务确认。
4. 准备 DeepSeek API Key、可用余额、实际可调用模型名。不要把 Key 发进公开聊天或源码仓库。API 消费独立于服务器和域名费用。

## 域名购买后按顺序操作

1. 购买服务器，记录公网 IPv4；将源码上传、解压到 /opt/ai-train（目录内应能看到 Dockerfile）。
2. 域名 DNS 管理新增：类型 A，主机记录 @，值填服务器公网 IPv4，TTL 使用默认。暂不需要 www；有错误的 AAAA 记录时先修正，否则部分手机可能走错误 IPv6。
3. 云安全组与服务器防火墙允许 TCP 80、443 入站。SSH 只向自己的管理地址开放。不要向公网开放 8787 或数据库端口。
4. 在服务器执行：

```bash
cd /opt/ai-train
cp deploy/.env.example deploy/.env
nano deploy/.env
chmod 600 deploy/.env
```

已有配置时不要再次覆盖。填写：

```dotenv
DOMAIN=aitrain.fit
APP_ACCESS_TOKEN=
DEEPSEEK_API_KEY=你的真实密钥
DEEPSEEK_MODEL=你账户支持的模型名
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

5. 验证配置并启动：

```bash
docker compose --env-file deploy/.env -f deploy/compose.yaml config --quiet
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --build
docker compose --env-file deploy/.env -f deploy/compose.yaml ps
docker compose --env-file deploy/.env -f deploy/compose.yaml logs --tail=100 app caddy
```

DNS 生效且 80/443 可达后，Caddy 自动申请并续期 HTTPS 证书。手机打开 https://aitrain.fit/，无需填端口、无需同一 Wi-Fi、无需电脑开机。手机相机授权只在 HTTPS 下使用；用户需要自行允许浏览器访问摄像头。

6. 用手机移动数据完成验收：注册两个账号，确认记录互不显示；保存饮食和训练，刷新/重新登录仍存在；测试私教和拍照识别；重启容器后记录仍存在。正式上线后再确认性能与 API 消费。

## 数据与费用

新服务器默认是空数据库。本机旧账号不会自动出现在服务器：需要按 deploy/README.md 的迁移步骤复制实际使用的业务库与助手库。不要把开发验收样品数据库当作真实用户数据迁移。迁移后通过域名重新登录。

数据库在 Docker app_data 持久卷，使用 deploy/backup.sh 定期备份并复制到另一位置；不要执行 down -v。域名和服务器需要续费，DeepSeek 需要余额。现在是公开注册且共用站点 API，尚无每用户 AI 日额度或总费用硬上限，公开推广前应配置相应额度控制。登录频率限制不能替代费用控制。

当前仅完成代码与部署模板准备，未购买域名/服务器、未设置真实 DNS、未签发公网证书。容器部署与手机公网验收必须在服务器准备好后执行。

官方资料：
- Caddy HTTPS：https://caddyserver.com/docs/quick-starts/https
- Docker Engine 安装：https://docs.docker.com/engine/install/
- 网站备案与服务器地域：https://help.aliyun.com/en/icp-filing/basic-icp-service/support/for-the-record-domain-faq
