# User Management

用户与管理员后端服务，为桌面软件提供用户注册/登录、License Key 认证、简历/录音/会话管理、AI 代理（对话、简历解析、JD 解析、语音转写等），以及 Web 管理后台（用户统计、配额与冻结、用量明细、审计日志）。

## 功能概览

| 类型 | 功能 |
|------|------|
| **软件端** | 邮箱注册/登录、License Key 登录、修改密码、简历上传/解析、录音上传、面试会话、AI 对话/追问/简历/JD/转写/清洗 |
| **管理后台** | 管理员注册/登录、用户统计、用户增删、配额与冻结、用量明细、操作审计日志 |

## 技术栈

- **运行时**: Node.js
- **框架**: Express 5
- **数据库**: PostgreSQL
- **认证**: JWT + bcrypt
- **文件上传**: multer
- **简历解析**: mammoth（DOCX）、pdf-parse（PDF）

## 环境要求

- Node.js >= 18
- PostgreSQL >= 12

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制示例配置并填写实际值：

```bash
cp .env.example .env
```

编辑 `.env`，至少配置：

| 变量 | 说明 | 示例 |
|------|------|------|
| `PORT` | 服务端口 | `8080` |
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | JWT 签名密钥 | 随机长字符串 |
| `ADMIN_EMAILS` | 可注册管理员的邮箱（逗号分隔） | `admin@example.com` |

### 3. 执行数据库迁移

```bash
npm run migrate
```

### 4. 启动服务

```bash
npm run start
```

服务默认监听 `PORT`（如 8080），健康检查：`GET /healthz`。

## 环境变量说明

| 变量 | 必填 | 说明 |
|------|------|------|
| `PORT` | 否 | 服务端口，默认 8787 |
| `DATABASE_URL` | 是 | PostgreSQL 连接串 |
| `JWT_SECRET` | 是 | JWT 签名密钥 |
| `ADMIN_EMAILS` | 管理后台必填 | 可注册为管理员的邮箱，逗号或空格分隔 |
| `UPLOAD_DIR` | 否 | 上传目录，默认 `uploads` |
| `MAX_UPLOAD_MB` | 否 | 单文件上传上限（MB），默认 10 |
| `MODEL_API_BASE` | 否 | 简历解析大模型 API 地址，默认 `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `MODEL_API_KEY` | 否 | 简历解析备用 API Key（用户无 License 时使用） |
| `AI_API_BASE` | 否 | AI 代理上游地址，默认同上 |
| `AI_ASR_API_BASE` | 否 | 语音转写上游地址，默认 `https://dashscope.aliyuncs.com/api/v1` |

**说明**：AI 代理（chat/enrich/resume/jd/clean/asr）由客户端携带 `x-license-key`，服务端解密出上游 API Key，**无需配置 AI_API_KEY**。

## API 接口

### 认证（软件端）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/register` | 邮箱注册（普通用户） |
| POST | `/auth/login` | 邮箱登录（普通用户） |
| POST | `/auth/license` | License Key 登录/注册 |
| GET | `/auth/me` | 获取当前用户（需 Bearer Token） |

### 认证（管理后台）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/admin-register` | 管理员注册（仅 `ADMIN_EMAILS` 内邮箱） |
| POST | `/auth/admin-login` | 管理员登录 |
| POST | `/auth/change-password` | 修改密码（需 Bearer Token） |

### 用户与业务

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/user/resume-context` | 获取最新简历上下文（兼容接口，可返回空） |
| GET | `/api/profile` | 获取用户资料 |
| PUT | `/api/profile` | 更新用户资料 |
| POST | `/api/resume/upload` | 上传简历（PDF/DOCX） |
| POST | `/api/resume/upload-meta` | 上报简历元信息（本地保存时） |
| GET | `/api/resume/list` | 简历列表 |
| GET | `/api/resume/item/:id` | 简历详情 |
| PUT | `/api/resume/item/:id` | 更新简历内容 |
| DELETE | `/api/resume/item/:id` | 删除简历 |
| POST | `/api/voice/upload` | 上传录音（wav/mp3/webm/m4a） |
| GET | `/api/voice/list` | 录音列表 |
| GET | `/api/voice/:id/file` | 录音文件流 |
| DELETE | `/api/voice/:id` | 删除录音 |
| POST | `/api/sessions` | 创建面试会话 |
| GET | `/api/sessions` | 会话列表 |
| GET | `/api/sessions/:id` | 会话详情 |
| PUT | `/api/sessions/:id` | 更新会话 |
| POST | `/api/sessions/:id/responses` | 新增问答回合 |

### AI 代理（需 JWT + x-license-key）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/chat` | 流式对话 |
| POST | `/api/ai/enrich` | 追问补充（流式） |
| POST | `/api/ai/resume` | 简历分析 |
| POST | `/api/ai/jd` | JD 解析 |
| POST | `/api/ai/clean` | 转写清洗 |
| POST | `/api/ai/asr` | 语音转写 |

客户端需同时携带 `Authorization: Bearer <token>` 和 `x-license-key`。上游 API Key 由 License Key 解密得到，**无需在服务端配置 AI_API_KEY**。

### 管理接口（需管理员 Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/stats` | 用户数、Token 用量统计 |
| GET | `/api/admin/users` | 用户列表 |
| POST | `/api/admin/users` | 新增用户 |
| DELETE | `/api/admin/users/:userId` | 删除用户 |
| GET | `/api/admin/usage/summary` | 用量汇总 |
| GET | `/api/admin/usage/detail/:userId` | 用户用量明细 |
| PUT | `/api/admin/usage/quota/:userId` | 设置用户配额 |
| PUT | `/api/admin/usage/freeze/:userId` | 冻结/解冻用户 |
| GET | `/api/admin/audit-logs` | 管理员操作日志 |

## Web 管理后台

服务启动后，访问根路径即可打开管理后台：

- **登录页**: `/` 或 `/index.html`
- **管理页**: `/admin.html`

首次使用需在 `ADMIN_EMAILS` 中的邮箱进行注册，注册成功后即可登录管理后台。

## 脚本

### 重置管理员密码

当忘记管理员密码时，可在服务器上执行：

```bash
node scripts/reset-password.js <邮箱> <新密码>
```

若该邮箱不存在，会自动创建为管理员账号。

## 项目结构

```
.
├── src/
│   ├── index.js          # 入口
│   ├── config.js         # 配置
│   ├── routes/
│   │   ├── auth.js       # 认证
│   │   ├── user.js       # 用户兼容接口
│   │   ├── profile.js    # 用户资料
│   │   ├── resume.js     # 简历管理
│   │   ├── voice.js      # 录音管理
│   │   ├── sessions.js   # 面试会话
│   │   ├── ai-proxy.js   # AI 代理（chat/enrich/resume/jd/clean/asr）
│   │   ├── admin.js      # 管理接口
│   │   └── usage.js      # 用量接口
│   ├── services/
│   │   ├── resumeService.js   # 简历创建/列表
│   │   └── resumeAnalyzer.js  # 简历 AI 解析
│   ├── utils/
│   │   └── decryptLicense.js  # License Key 解密
│   ├── middleware/
│   │   ├── auth.js       # 鉴权
│   │   └── admin.js      # 管理员权限
│   └── db/
│       ├── pool.js       # 数据库连接池
│       └── migrate.js    # 迁移脚本
├── web/
│   ├── index.html        # 管理员登录
│   ├── admin.html        # 管理后台
│   ├── js/api.js         # 前端 API 封装
│   └── css/style.css     # 样式
├── scripts/
│   └── reset-password.js # 密码重置
├── .env.example          # 环境变量示例
└── package.json
```

## 部署

### 启动命令示例

```bash
cd /path/to/project && npm run start
```

### Docker（示例）

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 8080
CMD ["npm", "run", "start"]
```

### 健康检查

```bash
curl http://localhost:8080/healthz
# {"success":true,"service":"user-management","db":"ok"}
```

## License

Private
