# Simply Forum · 简易论坛

一个基于 **Node.js + Express + MySQL** 的全栈论坛项目，实现了完整的用户系统、角色权限、帖子/评论/点赞/通知等功能。

> 🔗 **在线演示**：https://sj5l906q2s.preview.c35.airoapp.ai/?airoShareToken=Qf_JLlO7GSby
>
> 📌 部署于 GoDaddy Node.js 托管（免费 Preview），需通过分享链接访问

---

## ✨ 功能

### 用户系统
- 👤 **注册 / 登录**：用户名 + 邮箱双唯一校验
- 🔐 **JWT 鉴权**：7 天有效期，`Bearer` 令牌
- 🔒 **密码安全**：`bcryptjs` 哈希存储，不存明文
- 🎭 **角色体系**：`user` / `mod` / `admin` 三种角色
- 🚫 **封禁机制**：`is_banned` 字段，登录时拦截

### 帖子
- 📝 发帖 / 编辑 / 删除
- 🖼 多图上传（`multer`）
- 🔍 关键词搜索
- 📄 分页
- 📊 多种排序：`new`（最新）/ `top`（点赞）/ `hot`（热度）
- 🏷 分类筛选：资源 / 求助 / 闲聊 / 壁纸
- 📌 置顶 / ⭐ 精选

### 互动
- 💬 评论（支持嵌套）
- ❤️ 帖子点赞 / 评论点赞
- 🔔 消息通知（评论、回复、点赞）
- 👁 浏览量统计

### 界面
- 🎨 卡片式布局
- 🖼 动态壁纸轮播
- 🎵 背景音乐播放器
- 📱 响应式设计（原生 HTML + CSS + JS）

### 管理后台
- 👥 用户管理（改角色、封禁）
- 📊 数据统计

---

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| 运行环境 | Node.js 18+ |
| 后端框架 | Express 5 |
| 数据库 | MySQL 8（GoDaddy 托管） |
| 数据库驱动 | mysql2（Promise 版） |
| 鉴权 | jsonwebtoken + bcryptjs |
| 参数校验 | Zod |
| 文件上传 | multer |
| 前端 | 原生 HTML / CSS / JavaScript（ES Module） |
| 开发工具 | nodemon |

---

## 🚀 本地运行

### 环境要求

- Node.js ≥ 18
- npm ≥ 9
- MySQL 8（本地开发可用 Docker 快速启动）

### 1. 克隆项目

```bash
git clone https://github.com/tao537/simply_forum.git
cd simply_forum
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动本地 MySQL（可选，用 Docker）

```bash
docker run -d \
  --name forum-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=forum \
  -p 3306:3306 \
  mysql:8
```

### 4. 配置环境变量

创建 `.env`：

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=请改成一串随机字符串

# 本地 MySQL 配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=forum
```

> 生成随机 JWT_SECRET：
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 5. 启动

```bash
npm run dev
```

浏览器打开 **http://localhost:3000**。

---

## 📁 项目结构

```
simply_forum/
├── public/                   前端静态文件
│   ├── index.html            帖子列表
│   ├── post.html             帖子详情
│   ├── login.html            登录 / 注册
│   ├── user.html             用户主页
│   ├── admin.html            管理后台
│   ├── notifications.html    通知中心
│   ├── common.js             公共脚本（请求封装、token 管理）
│   ├── wallpapers/           壁纸资源
│   └── music/                背景音乐
│
├── src/
│   ├── app.js                Express 装配
│   ├── server.js             启动入口
│   │
│   ├── db/
│   │   ├── index.js          MySQL 连接池
│   │   └── init.js           建表 + 补列 + 建索引
│   │
│   ├── routes/               路由层
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── comments.js
│   │   ├── users.js
│   │   └── notifications.js
│   │
│   ├── controllers/          控制器层
│   │
│   ├── services/             业务逻辑层
│   │   ├── authService.js
│   │   ├── postService.js
│   │   ├── commentService.js
│   │   ├── userService.js
│   │   └── notificationService.js
│   │
│   └── middleware/
│       ├── auth.js           登录校验
│       ├── validate.js       Zod 参数校验
│       └── errorHandler.js   统一错误处理
│
├── .env                      环境变量（.gitignore）
├── .env.example              环境变量模板
├── .gitignore
├── package.json
└── README.md
```

---

## 📡 API 一览

所有接口前缀 `/api`。需要登录的接口通过 `Authorization: Bearer <token>` 传 JWT。

### 认证 `/api/auth`

| 方法 | 路径 | 说明 | 需登录 |
|------|------|------|:---:|
| POST | `/register` | 注册 | ❌ |
| POST | `/login` | 登录，返回 token | ❌ |
| GET | `/me` | 当前用户信息 | ✅ |

### 帖子 `/api/posts`

| 方法 | 路径 | 说明 | 需登录 |
|------|------|------|:---:|
| GET | `/` | 列表（`?page&size&keyword&sort&category`） | ❌ |
| GET | `/featured` | 精选帖子 | ❌ |
| GET | `/:id` | 详情（含评论、浏览量 +1） | ❌ |
| POST | `/` | 发帖（支持多图） | ✅ |
| PATCH | `/:id` | 编辑（仅作者） | ✅ |
| DELETE | `/:id` | 删帖（作者 / mod / admin） | ✅ |
| POST | `/:id/like` | 点赞 / 取消 | ✅ |
| POST | `/:id/comments` | 发表评论 | ✅ |

### 评论 `/api/comments`

| 方法 | 路径 | 说明 | 需登录 |
|------|------|------|:---:|
| DELETE | `/:id` | 删除评论 | ✅ |
| POST | `/:id/like` | 点赞 / 取消 | ✅ |

### 用户 `/api/users`

| 方法 | 路径 | 说明 | 需登录 |
|------|------|------|:---:|
| GET | `/` | 用户列表（管理员） | ✅ |
| GET | `/:id` | 用户主页 | ❌ |
| PATCH | `/:id/role` | 改角色（管理员） | ✅ |
| POST | `/:id/ban` | 封禁 / 解封（管理员） | ✅ |

### 通知 `/api/notifications`

| 方法 | 路径 | 说明 | 需登录 |
|------|------|------|:---:|
| GET | `/` | 通知列表 | ✅ |
| GET | `/unread` | 未读数量 | ✅ |
| POST | `/:id/read` | 标记已读 | ✅ |

### 请求示例

```bash
# 注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@test.com",
    "password": "123456"
  }'

# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "123456"}'

# 发帖（需要 token）
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "第一篇帖子",
    "content": "Hello, Forum!",
    "category": "闲聊"
  }'

# 帖子列表（按热度排序）
curl "http://localhost:3000/api/posts?page=1&size=10&sort=hot"
```

---

## 🗄 数据库设计

```
users                         posts                       comments
─────────────────             ──────────────────          ──────────────────
id            PK              id            PK            id            PK
username      UNIQUE          title                       post_id       FK → posts
email         UNIQUE          content                     user_id       FK → users
password_hash                 author_id     FK → users    content
nickname                      author_name                 author_id     FK → users
avatar                        views                       author_name
role          DEFAULT 'user'  images        JSON          upvotes
is_banned     DEFAULT 0       upvotes                     created_at
created_at                    pinned
                              featured                    comment_likes
post_likes                    category                    ──────────────────
─────────────────             created_at                  comment_id    FK
post_id       FK              updated_at                  user_id       FK
user_id       FK                                          created_at
created_at
                              notifications
                              ──────────────────
                              id            PK
                              user_id       FK → users
                              type          （reply/like/...）
                              from_user_id  FK
                              from_name
                              post_id       FK
                              comment_id    FK
                              content
                              is_read       DEFAULT 0
                              created_at
```

**外键级联**：删帖 → 其下评论 / 点赞 / 通知全部级联删除。

---

## 🚢 部署

### 当前部署方案：GoDaddy Node.js Hosting（免费 Preview）

1. 代码托管在 GitHub：`tao537/simply_forum`
2. GoDaddy 自动从 GitHub 拉取代码并部署
3. MySQL 数据库由 GoDaddy **自动注入环境变量**：`DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`
4. 无需手动配置数据库连接

### 访问限制

- 预览环境需要 **分享链接**：`?airoShareToken=...`
- 免费 Preview 应用 **30 天后自动移除**
- 应用容器 **8 小时无访问会休眠**

### 数据持久化

- ✅ 数据存储在 GoDaddy 托管 MySQL，**不受容器重启影响**
- ⚠️ 建议定期通过 GoDaddy 面板 **「汇出 SQL」** 备份

### 其他部署选项

如果未来迁移，可考虑：

| 平台 | 特点 |
|------|------|
| **Render + Turso** | 免费，需改用 `@libsql/client` |
| **Cloudflare Workers + D1** | 完全免费、公开访问，需适配 Workers 环境 |
| **VPS（阿里云 / 腾讯云）** | 完全掌控，需自己运维 |

---

## ❓ 常见问题

**Q: 本地开发没有 MySQL 怎么办？**

A: 用 Docker 一行命令启动：
```bash
docker run -d --name forum-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=forum \
  -p 3306:3306 mysql:8
```

**Q: 启动报 `ER_ACCESS_DENIED_ERROR`？**

A: 检查 `.env` 里的 `DB_USER` / `DB_PASSWORD` 是否正确；GoDaddy 环境下则无需配置，系统会自动注入。

**Q: 数据库初始化失败，提示 `ER_BLOB_CANT_HAVE_DEFAULT`？**

A: MySQL 的 `TEXT` 类型不支持默认值。所有短字符串字段应使用 `VARCHAR(N)`，例如 `avatar VARCHAR(512) NOT NULL DEFAULT ''`。

**Q: 忘记密码怎么办？**

A: 用 Node 脚本重置：
```bash
node -e "
import('bcryptjs').then(async ({default: b}) => {
  const mysql = (await import('mysql2/promise')).default;
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const hash = b.hashSync('新密码', 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE username = ?', [hash, 'admin']);
  console.log('✅ 密码已重置');
  process.exit(0);
});
"
```

**Q: 为什么用 MySQL 而不是 SQLite？**

A: SQLite 是文件型数据库，部署到 PaaS 平台（如 GoDaddy / Render）时容器重启会丢文件。MySQL 作为独立服务，数据持久化不受应用生命周期影响。

**Q: 项目安全性如何保证？**

A:
- 密码 `bcryptjs` 哈希（cost=10）
- JWT 密钥通过环境变量注入，不入仓库
- `.env` / `data/` / `node_modules/` 均在 `.gitignore`
- 所有 SQL 使用**参数化查询**，防止注入
- Zod 校验所有请求参数

---

## 🎯 开发路线

- [x] **阶段一**：基础 CRUD（帖子 + 评论）
- [x] **阶段二**：用户系统 + JWT 鉴权 + 角色权限
- [x] **阶段三**：通知、点赞、分类、排序
- [x] **阶段四**：管理后台、图片上传、界面美化
- [x] **阶段五**：数据库迁移（SQLite → MySQL）+ 云端部署
- [ ] **阶段六**：迁移到 Cloudflare Workers + D1（公开访问）
- [ ] **阶段七**：接入邮件通知 / 第三方登录

---

## 📄 License

MIT

---

## 👤 作者

**tao537** — [GitHub](https://github.com/tao537)

如果这个项目对你有帮助，欢迎点个 ⭐ Star。

---

## 🙏 致谢

本项目从零开发、从 SQLite 迁移到 MySQL、从本地部署到 GoDaddy Preview，感谢过程中踩过的每一个坑。
