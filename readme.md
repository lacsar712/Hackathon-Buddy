# 🚀 Hackathon Buddy

一款全栈 MERN 平台，可智能为黑客松参赛者匹配合适的队友与项目，并聚合展示**多平台实时黑客松活动**。

---

## 📸 界面预览

🏠 仪表盘
<p align="center"> <img src="https://github.com/user-attachments/assets/c776b2fd-cc2d-4b22-afc0-69060e21fdc9" width="90%" /> </p>

🤝 匹配页
<p align="center"> <img src="https://github.com/user-attachments/assets/4d51e710-8a3b-48aa-8465-f4207a618691" width="90%" /> </p>

📦 项目页
<p align="center"> <img src="https://github.com/user-attachments/assets/278764c4-831b-4412-958e-ed5fe9622971" width="90%" /> </p>

🌍 黑客松页
<p align="center"> <img src="https://github.com/user-attachments/assets/f59868c7-f4d9-44ff-a041-853c2a4774c3" width="90%" /> </p>

👤 协作编辑器
<p align="center"> <img src="https://github.com/user-attachments/assets/0d871982-9c1e-481b-b69a-8cf70d7047d8" width="90%" /> </p>

👤 个人资料页
<p align="center"> <img src="https://github.com/user-attachments/assets/d8c69040-7ef1-4e2c-a77e-f8feb3d2bcb0" width="90%" /> </p>

---

## 🌟 核心功能

### 🧠 智能组队匹配

按以下因素匹配用户：

| 因素 | 权重 | 方法 |
| ---- | ---- | ---- |
| 技能 | 50% | Jaccard 相似度 |
| 兴趣 | 30% | Jaccard 相似度 |
| 角色兼容性 | 20% | 兼容性矩阵 |

* 分数范围：**0–100**
* 返回 **Top 5** 最佳匹配

---

### 🧑‍💻 项目协作

* 创建 / 加入 / 退出项目
* 基于角色的组队
* 项目专属聊天室

---

### 💬 实时聊天（持久化）

* 基于 **Socket.io**
* 按项目房间收发消息
* 聊天记录存储于 MongoDB
* 加入房间时加载最近 100 条消息

**Socket 事件：**

* `join_room`
* `send_message`
* `receive_message`
* `room_history`

---

### 🌍 黑客松发现

在同一页面浏览多平台黑客松：

* Devpost
* Devfolio
* HackerEarth
* Unstop

**能力：**

* 实时聚合黑客松动态
* 筛选：

  * 平台
  * 模式（线上 / 混合 / 线下）
  * 状态（进行中 / 即将开始）
* 按标签、主办方搜索
* 按奖金排序

---

## 🏗️ 技术栈

### 后端

* Node.js
* Express.js
* MongoDB + Mongoose
* JWT 鉴权
* Socket.io
* bcryptjs

### 前端

* React 18
* Vite
* Tailwind CSS
* Axios
* React Router DOM
* Socket.io-client
* Nginx（Docker 生产部署）

---

## 🚀 启动指南

1. 确保 Docker Desktop 已启动。
2. 在根目录执行：`docker compose up --build`
3. 等待容器启动完成...

## 🔗 服务地址

* 前端：http://localhost:3031
* 后端 API：http://localhost:8031/api
* 数据库：localhost:5031（MongoDB / db: hackathon-buddy）

## ✅ 验证步骤

1. 打开前端（http://localhost:3031），进入注册页创建一个账号。
2. 登录后进入仪表盘，确认页面可正常加载。
3. 打开匹配页 / 项目页，确认能请求到后端数据。
4. 打开黑客松页，确认列表可加载。
5. 创建或加入项目后进入聊天，确认实时消息可收发。

> 说明：注册登录为本地邮箱 + 密码（JWT），不依赖外部账号服务；项目无预置测试账号，需自行注册后登录。

---

## 📁 项目结构

```
hackathon-buddy/
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── projects.js
│   │   ├── match.js
│   │   ├── github.js
│   │   └── hackathon.js
│   ├── services/
│   ├── middleware/
│   ├── sockets/
│   │   └── editorSocket.js
│   └── server.js
│
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Matching.jsx
│       │   ├── Projects.jsx
│       │   ├── Hackathons.jsx
│       │   ├── Profile.jsx
│       │   └── Chat.jsx
│       ├── context/
│       ├── services/
│       └── utils/
```

---

## ⚙️ 本地开发（可选）

> 推荐优先使用上方 Docker 一键启动。以下为本地 Node 开发方式。

### 前置条件

* Node.js v18+
* MongoDB（本地或 Atlas）

---

### 1️⃣ 后端启动

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

服务运行于：
👉 [http://localhost:5000](http://localhost:5000)

---

### 2️⃣ 前端启动

```bash
cd client
npm install
npm run dev
```

前端运行于：
👉 [http://localhost:5173](http://localhost:5173)

---

## 🔐 环境变量

### `server/.env`（本地开发）

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/hackathon-buddy
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

### Docker 环境变量（已在 `docker-compose.yml` 中配置）

```
PORT=8031
MONGO_URI=mongodb://mongo:27017/hackathon-buddy
JWT_SECRET=hackathon_buddy_docker_secret
CLIENT_URL=http://localhost:3031
```

---

## 🐳 Docker 镜像源配置

### 推荐配置（基于实际项目验证）

#### 1. Docker 镜像源

优先使用 DaoCloud 加速镜像（已在 Dockerfile / compose 中配置）：

* `mongo:7`
* `node:20-slim` / `node:20-alpine`
* `nginx:alpine`

#### 2. npm 依赖源

**使用淘宝镜像**（国内访问快）

在 `Dockerfile` 中已添加：

```dockerfile
RUN npm config set registry https://registry.npmmirror.com
```

#### 3. 前端构建加速规范（使用 npm ci）

1. **本地预处理**：提交代码前确保存在最新的 `package-lock.json`
2. **锁文件提交**：不要把锁文件加入 `.gitignore`
3. **容器内安装**：Dockerfile 使用 `npm ci` 代替 `npm install`

### 常用镜像推荐

| 技术栈 | 推荐镜像 | 说明 |
| :--- | :--- | :--- |
| MongoDB | `mongo:7` | 数据库 |
| Node.js | `node:20-slim` / `node:20-alpine` | 后端运行 / 前端构建 |
| Nginx | `nginx:alpine` | 前端生产环境 |

### 常见问题

**Q: Docker 镜像拉取失败？**  
A: 检查网络连接，确保 Docker Desktop 正常运行

**Q: npm install 很慢？**  
A: 确保已配置淘宝镜像源：`npm config set registry https://registry.npmmirror.com`

**Q: Docker 端口冲突？**  
A: 本项目按 `GSB0731` 错开端口：前端 `3031`，后端 `8031`，MongoDB `5031`

---

## 🔌 API 接口

### 🔐 认证

| 方法 | 接口 |
| ---- | ---- |
| POST | /api/auth/register |
| POST | /api/auth/login |

---

### 👤 用户

| 方法 | 接口 |
| ---- | ---- |
| GET | /api/users/me |
| PUT | /api/users/update |
| GET | /api/users/all |

---

### 📦 项目

| 方法 | 接口 |
| ---- | ---- |
| POST | /api/projects |
| GET | /api/projects |
| GET | /api/projects/my |
| POST | /api/projects/join/:id |
| POST | /api/projects/leave/:id |

---

### 🤝 匹配

| 方法 | 接口 |
| ---- | ---- |
| GET | /api/match/users |
| GET | /api/match/projects |

---

### 🌍 黑客松

| 方法 | 接口 |
| ---- | ---- |
| GET | /api/hackathons |

---

## 🔄 实时聊天流程

1. 用户加入项目
2. 触发 `join_room` 事件
3. 服务端发送 `room_history`
4. 用户发送消息 → `send_message`
5. 服务端写入数据库
6. 通过 `receive_message` 广播

---

## 🚧 已知问题

* 黑客松奖金字段有时会显示原始 HTML（如 `<span>`），需要解析修复
* 聊天无分页（最多 100 条）
* Socket 事件缺少鉴权校验

---

## 🔮 后续改进

* [ ] 基于 AI 的黑客松推荐
* [ ] 聊天分页 + 无限滚动
* [ ] 正在输入提示
* [ ] 通知系统
* [ ] OAuth（GitHub 登录）
* [ ] 邮箱验证
* [ ] 更完善的黑客松数据清洗

---

## 🧪 测试要点

* 多用户聊天正常
* 消息可持久化到 MongoDB
* 黑客松数据可按筛选条件加载
* 匹配算法返回 Top 5 用户

---

## ⚠️ 现状说明（重要）

* 当前是**较强的 MVP**，尚未达到生产级标准
* 主要薄弱点：

  * Socket 层缺少校验
  * 黑客松数据解析较粗糙
  * 无缓存，接口可能变慢
* 若用于面试展示，建议能讲清：

  * 扩展策略
  * 数据规范化
  * 实时架构设计

---

## 🏁 总结

Hackathon Buddy 现已整合：

* **智能组队匹配**
* **项目协作**
* **实时通信**
* **黑客松发现**

它面向黑客松参赛者提供较完整的协作生态，而不只是匹配工具。

---
