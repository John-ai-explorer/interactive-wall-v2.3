# 公网访问指南

本文档说明如何将本地开发服务器暴露到公网，让外部用户访问。

---

## 前置条件

确保开发服务器已在本地启动：

```bash
cd /home/john/dangjian_web/V1.0/frontend_V1.3
npm run dev
# → http://localhost:3000
```

---

## 方法一：Serveo（推荐，无需安装）

通过 SSH 反向隧道，无需注册账号或安装额外软件。

### 启动隧道

```bash
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:3000 serveo.net
```

启动后会输出公网 URL：

```
Forwarding HTTP traffic from https://xxxxxxxxxxxxxxxx-125-35-71-202.serveousercontent.com
```

### 后台持久运行

```bash
nohup ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:3000 serveo.net > /tmp/serveo.log 2>&1 &
```

### 自定义子域名（需注册）

在 [serveo.net](https://serveo.net) 注册后可使用固定子域名：

```bash
ssh -R your-name:80:localhost:3000 serveo.net
# → https://your-name.serveo.net
```

### 查看状态

```bash
# 检查进程是否存活
ps aux | grep "serveo.net" | grep -v grep

# 查看当前公网 URL
cat /tmp/serveo.log
```

---

## 方法二：Ngrok（功能更丰富）

> ⚠️ 中国大陆网络可能无法访问 ngrok 服务器，推荐使用方法一。

### 安装

```bash
# snap 方式（已安装）
sudo snap install ngrok

# 或 npm 方式
npm install -g ngrok
```

### 认证

在 [ngrok.com](https://ngrok.com) 注册并获取 authtoken：

```bash
ngrok config add-authtoken <your-token>
```

配置文件位置：`~/.config/ngrok/ngrok.yml`

### 启动

```bash
ngrok http 3000
```

### 查看公网 URL

```bash
curl -s http://127.0.0.1:4040/api/tunnels | python3 -m json.tool
```

### 停止隧道

```bash
# 停止 ngrok 进程
pkill -f "ngrok http"
```

---

## 方法三：Localtunnel

```bash
npx localtunnel --port 3000
# → https://xxxx.loca.lt
```

> ⚠️ 同样可能受网络限制。

### 停止隧道

```bash
pkill -f "localtunnel"
```

---

## 方法四：Cloudflare Tunnel

需要 Cloudflare 账号和域名。

```bash
cloudflared tunnel --url http://localhost:3000
```

---

---

## 停止所有隧道（一键）

```bash
# 停止所有常见隧道进程
pkill -f "serveo.net"
pkill -f "ngrok http"
pkill -f "localtunnel"

# 确认已全部停止
ps aux | grep -E "serveo|ngrok|localtunnel" | grep -v grep
```

---

## 公网访问注意事项

| 事项 | 说明 |
|---|---|
| **仅限 Demo** | 开发服务器 (`next dev`) 不适合生产环境，仅供演示 |
| **安全** | 公网 URL 对所有人可见，不要在本地暴露敏感数据 |
| **有效期** | Serveo/Ngrok 免费版 URL 在进程结束后失效，重启会更换地址 |
| **带宽** | 3D 模型文件较大（27-34MB），首次加载可能较慢 |
| **并发** | 免费隧道服务有并发限制，多人同时访问可能不稳定 |
| **防火墙** | 如果 SSH 被阻断，Serveo 不可用；可尝试 Ngrok 或其他方法 |

---

## 当前隧道状态

| 项目 | 值 |
|---|---|
| 状态 | 已停止 (2026-07-07) |
| 日志文件 | `/tmp/serveo.log` |
| 进程查找 | `ps aux \| grep serveo` |
| 启动命令 | `nohup ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:3000 serveo.net > /tmp/serveo.log 2>&1 &` |
| 停止命令 | `pkill -f "serveo.net"` |

---

## 生产部署建议

Demo 验证完成后，正式部署建议：

- **Next.js 生产构建**：`npm run build && npm run start`
- **反向代理**：Nginx/Caddy 提供 HTTPS 和静态资源缓存
- **CDN**：3D 模型 (`.ply`/`.spz`) 走 CDN 加速
- **域名**：绑定正式域名，配置 SSL 证书
