# 内网部署与常见问题排查（DEPLOYMENT）

> 本文记录在 ML 平台实例上，把 `frontend_V2.1`（Next.js 16）发布到内网 `http://115.190.90.101:5090` 供他人访问时遇到的三个问题及其根因与解决方案。
> 配合根目录 `README.md`（项目介绍/运行）、`PUBLIC_URL.md`（公网隧道）一起看。

---

## 0. 快速开始（TL;DR）

```bash
# 1) 用 Node 22（默认的 node 太旧，Next 16 要求 >= 20.9）
NODE=/nix/store/h2barca1k5pmvcyl9fwrzwrb4cn1b248-nodejs-22.22.2/bin/node
# 若上面路径不存在，用这个找一个 v20+ 的：ls -d /nix/store/*nodejs*/bin && <该node> -v

# 2) 开发模式，绑定所有网卡的 5090（后台运行，日志写到 /tmp）
"$NODE" node_modules/next/dist/bin/next dev -H 0.0.0.0 -p 5090 > /tmp/frontend_5090.log 2>&1 &

# 3) 浏览器访问（需平台安全组放行入站 TCP 5090）
#    http://115.190.90.101:5090
```

正式发布建议用**生产模式 + `nohup` 常驻**（更快、无按需编译、无 dev 跨域限制，且不随会话回收）：

```bash
"$NODE" node_modules/next/dist/bin/next build
nohup "$NODE" node_modules/next/dist/bin/next start -H 0.0.0.0 -p 5090 > /tmp/frontend_5090.log 2>&1 < /dev/null &
```

> 为什么别用 `next dev` 裸后台、进程被回收如何排查、代码升级后如何平滑替换，见 **§6**。

### 问题速查表

| 现象 | 根因 | 解决 |
|---|---|---|
| 内网 IP 打不开页面 | 进程只监听 `localhost:3000` | 绑定 `-H 0.0.0.0 -p 5090` + 安全组放行（见 §1） |
| 页面能显示，但**按钮点了没反应**（localhost 正常） | Next **dev 跨域保护**拦截了非 localhost 主机对 `/_next/*` 的请求 | `next.config.ts` 加 `allowedDevOrigins`，或用生产模式（见 §2） |
| **3D 场景一直"加载中"**、无法渲染 | 模型**中文文件名**被同步管线 mangle 成 `#U<hex>`，数据仍按中文引用 → **404** | 资源改 **ASCII 名** + 同步更新引用（见 §3） |
| 内网 IP 打不开、**本机 `curl` 也 connection refused** | 后台 `next dev` 进程被会话回收（不是多人阻塞） | 改用**生产模式 + `nohup` 常驻**；升级用标准替换流程（见 §6） |

---

## 1. 端口绑定：内网访问不到

### 现象
在 localhost 能跑，但内网其他机器用 `http://115.190.90.101:5090` 打不开。

### 根因
- `next dev` / `next start` **默认监听 `localhost:3000`**，只绑回环地址，外部访问不到。
- 本机网卡是 `9.133.5.81 / 192.168.28.228`，`115.190.90.101` 是平台映射的公网/浮动 IP；要让外部经该 IP 访问，进程必须监听 **`0.0.0.0`**（所有网卡）。

### 附带的两个环境坑
1. **Node 版本**：默认 `node` 是 v18，Next 16 要求 **≥ 20.9**。用 nix 里的 Node 22：
   `/nix/store/h2barca1k5pmvcyl9fwrzwrb4cn1b248-nodejs-22.22.2/bin/node`
   （路径可能随镜像变化，用 `ls -d /nix/store/*nodejs*/bin` 找 v20+ 的那个）
2. **可执行位缺失**：`node_modules/.bin/next` 是 `-rw-r--r--`，直接执行报 `Permission denied`（exit 126）。**要用 `node` 直接跑入口 JS**：
   `node node_modules/next/dist/bin/next ...`

### 解决
```bash
NODE=/nix/store/h2barca1k5pmvcyl9fwrzwrb4cn1b248-nodejs-22.22.2/bin/node
"$NODE" node_modules/next/dist/bin/next dev -H 0.0.0.0 -p 5090 > /tmp/frontend_5090.log 2>&1 &
```
- `-H 0.0.0.0`：监听所有网卡（关键）
- `-p 5090`：端口
- 确认监听：`ss -tlnp | grep :5090` 应显示 `0.0.0.0:5090`
- **还需在平台控制台给实例安全组放行入站 TCP 5090**，否则绑好了也连不上。

---

## 2. 按钮点不开：dev 跨域保护

### 现象
用内网 IP 打开后，页面能正常显示，但**很多按钮点击无反应**；同一份代码在 `http://localhost:5090` 完全正常。

### 根因
Next.js **开发模式**对 `/_next/*` 这类 dev 专用资源（HMR、按需加载的 JS chunk 等）有**跨域来源保护**：默认只信任 `localhost` / `127.0.0.1`。当从 `115.190.90.101` 访问时，该来源不在白名单里，请求被拦截，导致客户端脚本/交互无法正常工作——**页面 SSR 出来能看，但点击类交互失效**。

dev 日志中的原始报错：
```
⚠ Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr from "115.190.90.101".
Cross-origin access to Next.js dev resources is blocked by default for safety.
```
这正是"localhost 正常、换 IP 就点不动"的原因：localhost 在默认白名单，IP 不在。

### 解决
**方案 A（保留 dev 模式）**：在 `next.config.ts` 里把访问用的主机加入 `allowedDevOrigins`，然后重启 dev server。
```ts
const nextConfig: NextConfig = {
  reactStrictMode: false,
  // 允许通过内网 IP 访问 dev 专用资源（HMR、按需 chunk）
  allowedDevOrigins: ["115.190.90.101", "9.133.5.81", "192.168.28.228"],
  turbopack: { root: process.cwd() },
};
```
> ⚠️ 以后**换新的访问 IP，必须把该 IP 也加进这个数组并重启**，否则会重现同样问题。

**方案 B（推荐用于发布）**：用**生产模式**（`next build && next start`）。`allowedDevOrigins` / 跨域 dev 保护是 **dev 专属**，生产模式没有这个限制，也更快。

### 修改后如何生效
- 改了 `next.config.ts` 后 dev server 会**自动重启**；若手动重启见 §附录。
- 浏览器请**强制刷新**（`Ctrl/Cmd + Shift + R`）清掉之前未挂载成功的缓存状态。

---

## 3. 3D 场景无法渲染：中文文件名被 mangle → 404

### 现象
进入体验页后，「原始 PLY 三维场景」和「轻量点云」都**一直卡在"加载中"**，进度条不动。

### 根因
`public/assets/models/` 下的 3D 模型原本是**中文文件名**（如 `中国第一枚原子弹发射.ply`、`嫦娥五号.spz`）。从对象存储（TOS，`/tos-mlp-zgci`）同步到本实例时，**中文字符被转义成 ASCII 串** `#U<unicode码点hex>`，磁盘上真实文件名变成了：
```
#U4e2d#U56fd#U7b2c#U4e00#U679a#U539f#U5b50#U5f39#U53d1#U5c04.ply   (= 中国第一枚原子弹发射.ply)
#U5ae6#U5a25#U4e94#U53f7.spz                                       (= 嫦娥五号.spz)
```
而数据文件 `data/stories.v2.json`、`data/scenes.json` 仍按**真中文路径**请求（如 `/assets/models/中国第一枚原子弹发射.ply`）→ 文件名对不上 → **每个模型请求 404** → 前端永远停在"加载中"。

> 为什么 localhost 曾经正常：那是在文件名完好的**原始开发机**上测的；问题只在同步过来的这台实例上出现。

### 解决
把模型文件改成**纯 ASCII 名**，并同步更新所有引用（重新同步/部署也不会再被 mangle）。已完成的重命名映射：

| 用途 | 原始（中文） | 磁盘实际（被 mangle） | 现用 ASCII 名 | 大小 |
|---|---|---|---|---|
| 钱学森·原始PLY | 中国第一枚原子弹发射.ply | `#U4e2d…5c04.ply` | `qianxuesen.ply` | 35 MB |
| 钱学森·压缩 | 中国第一枚原子弹发射.ply.spz | `#U4e2d…5c04.ply.spz` | `qianxuesen.spz` | 10.7 MB |
| 嫦娥五号·原始PLY | 嫦娥五号.spz.ply | `#U5ae6…53f7.spz.ply` | `change5.ply` | 27.5 MB |
| 嫦娥五号·压缩 | 嫦娥五号.spz | `#U5ae6…53f7.spz` | `change5.spz` | 8.3 MB |

同步更新的引用（共 6 处）：
- `data/stories.v2.json`：两个 story 的 `modelHigh` / `modelCompressed`
- `data/scenes.json`：两个场景的 `model_path`

> **保留末尾扩展名**（`.ply`→Ply，`.spz`→Spz），因为 `NativePlySplatViewer` 的 `getSceneFormat()` 靠后缀判断格式。

### 通用规则
**本项目所有静态资源一律用 ASCII 文件名。** 部署/同步管线无法保留非 ASCII（中文）文件名。新增模型时，文件名和引用都用 ASCII。

### 说明：两种视图目前加载同一个大文件
`ImmersiveScene` 里 `pointsPath = plyPath = story.scene.modelHigh`，即「原始PLY」和「轻量点云」**都加载 `modelHigh`（27–35MB 的 `.ply`）**，那个 8–10MB 的 `.spz`（`modelCompressed`）当前未被使用。首次加载会真实下载几十 MB，叠加项目在网络盘上（dev 日志报过 `Slow filesystem detected`），**首次会较慢但会完成**（不再无限转圈）。想更快见 §5。

---

## 4. 常用运维命令

```bash
# 查看端口监听
ss -tlnp | grep :5090

# 看日志
tail -f /tmp/frontend_5090.log

# 停止（用 PID，不要用 pkill -f "next dev.*5090"！——该模式会匹配到运行它的 shell 自身而误杀）
kill $(ss -tlnp 2>/dev/null | awk -F'pid=' '/:5090 /{split($2,a,",");print a[1]}')

# 重启
NODE=/nix/store/h2barca1k5pmvcyl9fwrzwrb4cn1b248-nodejs-22.22.2/bin/node
"$NODE" node_modules/next/dist/bin/next dev -H 0.0.0.0 -p 5090 > /tmp/frontend_5090.log 2>&1 &

# 自检：模型能否正常服务（应返回 206/200，而非 404）
curl -s -o /dev/null -w "%{http_code}\n" -H "Range: bytes=0-1023" \
  http://127.0.0.1:5090/assets/models/qianxuesen.ply
```

---

## 5. 可选优化（发布场景）

1. **生产模式**：`next build && next start -H 0.0.0.0 -p 5090`——静态资源更快、无按需编译、无 dev 跨域限制。同时解决 §2、加速 §3。
2. **让"轻量点云"名副其实**：当前两种模式都加载大 `.ply`。可将 `ImmersiveScene` 的原始模式接到 `modelCompressed`(`.spz`, 8–10MB) 以显著加快加载（`.spz` 由真 Splat 库 `NativePlySplatViewer` 支持；自研点云解析器 `lib/ply-parser.ts` 仅支持 `.ply`，故 points 模式仍需 `.ply`）。
3. **常驻运行**：当前为后台进程，会话结束可能被回收。长期发布可用 `nohup` 或接入 supervisord。

---

## 6. 进程被回收：从「dev 后台」升级到「生产模式 + nohup 常驻」

> 2026-07-28 记录。内网 `http://115.190.90.101:5090` 某天起打不开；排查确认是**后台 `next dev` 进程被会话回收**，据此把部署方式从「dev 后台」升级为「生产模式 + `nohup` 常驻」。本节记录**之前怎么做、暴露了什么问题、现在方案对比如何、新增注意事项**，并给出标准**升级替换流程**。

### 6.1 之前是怎么做的（dev 后台）

按早期 §0 做法，用**开发模式**丢后台：

```bash
"$NODE" node_modules/next/dist/bin/next dev -H 0.0.0.0 -p 5090 > /tmp/frontend_5090.log 2>&1 &
```

- `next dev`：开发模式，带按需编译 / HMR。
- 结尾裸 `&`：丢到后台，但**仍挂在当前 shell / 会话下**，没有脱离控制终端。

### 6.2 暴露了什么问题

现象：内网 IP 突然打不开，页面完全连不上。有人怀疑是"多人同时访问造成阻塞"。

排查（命令见 §4）结论——**不是阻塞，是进程根本没了**：

| 检查 | 结果 | 含义 |
|---|---|---|
| `ss -tlnp \| grep :5090` | 无输出 | 5090 端口无人监听 |
| `ps -ef \| grep next` | 无 `next` 进程 | dev server 已不存在 |
| `curl 127.0.0.1:5090` | connection refused（exit 7 / http 000） | 本机环回都被拒 |
| `/tmp/frontend_5090.log` 末尾 | 停在一条正常 `GET / 200`，无崩溃栈 | 不是自己崩的，是被外部终止 |

**怎么区分「阻塞」和「进程没了」：**

- **阻塞**：进程还在、端口仍 `LISTEN`，表现是**响应慢 / 超时 / 5xx**。
- **进程没了**：**秒级 connection refused**（curl exit 7）。本次是这种。

根因：裸 `&` 后台进程**没脱离会话**，会话结束 / 实例回收时被 `SIGHUP` 连带杀掉——正是 §5 早就预警的"会话结束可能被回收"。且 `next dev` 是单进程模型，多人访问顶多变慢、不会让进程消失，故排除阻塞。

### 6.3 现在的方案（生产模式 + nohup）

```bash
NODE=/nix/store/h2barca1k5pmvcyl9fwrzwrb4cn1b248-nodejs-22.22.2/bin/node
"$NODE" node_modules/next/dist/bin/next build
nohup "$NODE" node_modules/next/dist/bin/next start -H 0.0.0.0 -p 5090 > /tmp/frontend_5090.log 2>&1 < /dev/null &
```

两处关键改变：

- `next dev` → `next build && next start`：切**生产模式**。
- 裸 `&` → `nohup … < /dev/null &`：`nohup` 让进程忽略 `SIGHUP`，`< /dev/null` 关掉 stdin，**彻底脱离控制终端**。

### 6.4 对比：解决了什么

| 维度 | 之前（dev 后台） | 现在（prod + nohup） |
|---|---|---|
| 抗会话回收 | ❌ 会话结束被 `SIGHUP` 杀 | ✅ 忽略 `SIGHUP`，终端 / 会话关闭不受影响 |
| 首屏 / 响应 | 每次按需编译，首访慢 | 预构建、静态直出（实测首页 ~6ms） |
| dev 跨域坑（§2） | 有：换 IP 后按钮点不动 | ✅ 无：生产模式没有 dev 跨域保护 |
| 运行稳定性 | HMR、开发告警多 | 无按需编译，行为稳定 |

实测（本次启动后）：端口 `0.0.0.0:5090` `LISTEN`、首页 `200`、模型 `qianxuesen.ply` `206`、日志 `✓ Ready in 16.5s`。

### 6.5 新的注意事项

1. **nohup 防不住「实例级」回收**。它只挡 `SIGHUP`（终端挂断）。若平台把整个实例停机 / 重启，进程照样没。要真正长期常驻，接 **supervisord**（本实例 pid=1 就是它）。
2. **生产模式改代码不热更新**。dev 有 HMR；prod 必须**重新 `build` + 重启**才生效。
3. **停进程别用 `pkill -f "next.*5090"`**——该模式会匹配到运行它的 shell 自身而误杀。用端口找 PID（见 6.6 / §4）。
4. **一个端口一次只能一个进程**。升级时新进程启动前必须先停旧的，否则报 `EADDRINUSE`。

### 6.6 标准升级替换流程

代码升级后，用"**先构建、再停旧、后启新**"替换，把停机压到最小（build 阶段旧服务照常跑，空窗只在最后 ~15s）：

```bash
NODE=/nix/store/h2barca1k5pmvcyl9fwrzwrb4cn1b248-nodejs-22.22.2/bin/node
cd /tos-mlp-zgci/ZJC/ZJC/interactive_wall_experience/frontend_V2.1

# 1) 构建（旧服务此时仍在 5090 上跑，访问不受影响）
"$NODE" node_modules/next/dist/bin/next build

# 2) 构建成功后，按端口精准停旧进程
kill $(ss -tlnp 2>/dev/null | grep ':5090 ' | grep -oP 'pid=\K[0-9]+')

# 3) 启动新进程，绑定同一个 5090
nohup "$NODE" node_modules/next/dist/bin/next start -H 0.0.0.0 -p 5090 > /tmp/frontend_5090.log 2>&1 < /dev/null &

# 4) 约 16s 后验证（应回 200）
sleep 18
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5090/
```

> **单端口无法零停机**：第 2→3 步之间有约 15s 空窗（新进程 `Ready in ~16.5s`）。要真正零停机需"双端口 + 反向代理（蓝绿切换）"——先在另一个端口把新版起好、`Ready` 后再切流量；当前是裸端口直连，不具备该条件，展示类站点接受短暂空窗即可。

---

## 附：本次修改涉及的文件
- `next.config.ts`：新增 `allowedDevOrigins`
- `data/stories.v2.json`、`data/scenes.json`：模型路径改为 ASCII
- `public/assets/models/`：4 个模型文件重命名为 ASCII
