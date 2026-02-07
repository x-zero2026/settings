# Settings App - 设置应用

X-Zero DID 登录平台的用户资料和项目管理应用。

## 概述

Settings App 允许用户：
- **编辑个人资料**：更新个人简介和职业标签
- **管理项目**：更新项目名称和管理团队成员（仅管理员）

## 架构

```
┌─────────────────────────────────────────────────┐
│  did-login-ui (主入口)                           │
│  - 用户登录/注册                                  │
│  - 显示所有应用                                   │
│  - 点击 Settings App → 带 token 跳转             │
└─────────────────────────────────────────────────┘
                    ↓ (通过 URL 传递 token)
┌─────────────────────────────────────────────────┐
│  settings/frontend (独立部署)                    │
│  - /profile: 编辑个人资料                        │
│  - /projects: 项目管理                           │
│  - /projects/:id: 项目详情和成员管理              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  did-login-lambda (共享后端)                     │
│  - 用户资料 APIs                                 │
│  - 项目管理 APIs                                 │
│  - 成员管理 APIs                                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Supabase Database (共享数据库)                  │
│  - users (bio, profession_tags)                 │
│  - projects                                     │
│  - user_projects                                │
└─────────────────────────────────────────────────┘
```

## 目录结构

```
settings/
├── frontend/           # React + Vite 前端
│   ├── src/
│   │   ├── api/       # API 客户端
│   │   ├── components/# 可复用组件
│   │   ├── pages/     # 页面组件
│   │   └── utils/     # 工具函数
│   ├── .env           # 环境变量
│   └── amplify.yml    # Amplify 部署配置
├── scripts/           # 数据库迁移和注册脚本
│   ├── 001-add-bio-and-tags.sql    # 数据库迁移
│   ├── register-app.sh              # 应用注册脚本
│   ├── register-app.sql             # SQL 注册脚本
│   ├── update-app-chinese.sh        # 更新应用为中文
│   └── update-app-chinese.sql       # SQL 更新脚本
└── README.md          # 本文件
```

## 功能特性

### 1. 个人资料管理

用户可以更新以下资料：
- **个人简介**：个人介绍（最多 500 字符）
- **职业标签**：从预定义列表中选择或添加自定义标签（最多 5 个，每个标签最多 50 字符）

**预定义职业标签**（共 23 个）：

**技术类** (8 个):
- frontend-developer（前端开发）, backend-developer（后端开发）, fullstack-developer（全栈开发）
- mobile-developer（移动开发）, devops-engineer（运维工程师）, data-engineer（数据工程师）
- ml-engineer（机器学习工程师）, qa-engineer（测试工程师）

**设计类** (4 个):
- ui-designer（UI 设计师）, ux-designer（UX 设计师）, product-designer（产品设计师）, graphic-designer（平面设计师）

**产品/管理类** (3 个):
- product-manager（产品经理）, project-manager（项目经理）, scrum-master（敏捷教练）

**商业类** (3 个):
- business-analyst（商业分析师）, entrepreneur（创业者）, consultant（咨询顾问）

**其他** (3 个):
- researcher（研究员）, writer（作家）, marketer（市场营销）

**自定义标签**：
- 用户可以添加任何自定义职业标签，如：客服专员、运营经理、销售总监等
- 自定义标签与预定义标签共享 5 个标签的限制
- 自定义标签在界面上以不同颜色显示（粉色渐变）

### 2. 项目管理（仅管理员）

项目管理员可以：
- 更新项目名称
- 添加成员（通过用户名或邮箱搜索）
- 移除成员（创建者除外）
- 修改成员角色（admin ↔ member）

**角色限制**：
- 只有管理员可以管理项目
- 项目创建者不能被移除或降级
- 创建者始终是管理员

## 数据库结构

### Users 表（扩展字段）

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profession_tags TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_users_profession_tags ON users USING GIN(profession_tags);
```

字段说明：
- `bio`: VARCHAR(500) - 个人简介
- `profession_tags`: TEXT[] - 职业标签数组（最多 5 个）

## API 接口

所有 API 都在 `did-login-lambda` 中，需要 JWT 认证。

### 用户 APIs

**GET /api/user/profile**
- 获取当前用户资料
- 返回：包含 bio 和 profession_tags 的 User 对象

**PATCH /api/user/profile**
- 更新用户资料
- 请求体：`{ "bio": "string", "profession_tags": ["tag1", "tag2"] }`
- 验证：
  - bio ≤ 500 字符
  - profession_tags ≤ 5 个
  - 每个标签 ≤ 50 字符
  - 标签可以是预定义标签或自定义标签

**GET /api/users/search?q=query**
- 通过用户名或邮箱搜索用户
- 返回：UserSearchResult 数组（最多 10 个）

### 项目 APIs

**GET /api/projects**
- 列出用户的项目
- 返回：ProjectWithRole 数组

**GET /api/projects/:id**
- 获取项目详情和成员
- 返回：包含成员数组的 ProjectDetail
- 要求：用户必须是项目成员

**PATCH /api/projects/:id**
- 更新项目名称
- 请求体：`{ "project_name": "string" }`
- 要求：用户必须是管理员

**POST /api/projects/:id/members**
- 添加项目成员
- 请求体：`{ "user_did": "string", "role": "admin|member" }`
- 要求：用户必须是管理员

**DELETE /api/projects/:id/members/:did**
- 移除项目成员
- 要求：用户必须是管理员，不能移除创建者

**PATCH /api/projects/:id/members/:did**
- 更新成员角色
- 请求体：`{ "role": "admin|member" }`
- 要求：用户必须是管理员，不能修改创建者角色

## 部署指南

### 1. 数据库迁移

运行迁移脚本添加 bio 和 profession_tags 字段：

```bash
cd settings/scripts
psql "postgresql://postgres.rbpsksuuvtzmathnmyxn:iPass4xz2026!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres" -f 001-add-bio-and-tags.sql
```

### 2. 后端部署

后端 API 在 `did-login-lambda` 中。使用 SAM 部署：

```bash
cd did-login-lambda
sam build
sam deploy
```

API 端点：`https://i149gvmuh8.execute-api.us-east-1.amazonaws.com/prod/`

### 3. 前端设置

安装依赖：

```bash
cd settings/frontend
npm install
```

配置 `.env` 环境变量：

```env
VITE_DID_LOGIN_API_URL=https://i149gvmuh8.execute-api.us-east-1.amazonaws.com/prod
```

本地运行：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

### 4. 部署到 Amplify

1. 将代码推送到 Git 仓库
2. 在 AWS Amplify 中连接仓库
3. 配置构建设置（使用 `amplify.yml`）
4. 在 Amplify Console 中设置环境变量：
   - `VITE_DID_LOGIN_API_URL`
5. 部署

### 5. 注册应用

使用脚本注册 Settings App：

```bash
cd settings/scripts

# 方法 1: 使用 Shell 脚本（推荐）
JWT_TOKEN="your-token" ./register-app.sh

# 方法 2: 使用 SQL 脚本
psql "your-database-url" -f register-app.sql
```

或者使用更新脚本将应用名称改为中文：

```bash
cd settings/scripts

# 更新应用为中文名称
JWT_TOKEN="your-token" ./update-app-chinese.sh
```

这会将应用名称从 "Settings" 更新为 "设置"，描述更新为 "管理你的个人资料和项目"。

## 前端组件

### 页面

- **ProfilePage**：编辑个人简介和职业标签
- **ProjectsPage**：列出用户的项目
- **ProjectDetailPage**：管理项目成员（仅管理员）

### 组件

- **StarfieldBackground**：动画星空背景
- **TagSelector**：多选标签组件

### 样式

- 深色主题，面板使用 `rgba(20, 20, 30, 0.85)`
- 玻璃效果：`backdrop-filter: blur(20px)`
- 紫色渐变按钮：`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 紫色边框：`rgba(102, 126, 234, 0.3)`

## 认证机制

应用通过 URL 参数接收 JWT token：

```
https://settings-app.amplifyapp.com?token=xxx
```

Token 存储在 localStorage 中，并通过 Authorization header 包含在所有 API 请求中。

## 本地开发

### 本地开发步骤

1. 启动后端（如需要）
2. 在 `.env` 中更新本地 API URL
3. 运行 `npm run dev`
4. 访问 `http://localhost:5173?token=your-test-token`

### 测试

使用 curl 或 Postman 测试 API：

```bash
# 获取个人资料
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://i149gvmuh8.execute-api.us-east-1.amazonaws.com/prod/api/user/profile

# 更新个人资料
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio":"你好","profession_tags":["frontend-developer"]}' \
  https://i149gvmuh8.execute-api.us-east-1.amazonaws.com/prod/api/user/profile
```

## 故障排查

### Token 问题

- 确保通过 URL 参数传递 token
- 检查 token 是否过期（默认 168 小时）
- 验证前后端的 JWT_SECRET 是否匹配

### API 错误

- 检查 API Gateway 的 CORS 配置
- 验证数据库连接字符串
- 查看 CloudWatch 日志中的 Lambda 错误

### 数据库问题

- 确保迁移脚本成功运行
- 验证 `bio` 和 `profession_tags` 列是否存在
- 检查 Supabase 连接池设置（使用 `default_query_exec_mode=simple_protocol`）

### 管理员权限问题

- 确保后端 `get-project` API 返回 `user_role` 字段
- 检查前端 `isAdmin()` 函数是否正确检查 `project.user_role`
- 验证用户在 `user_projects` 表中的角色

## 技术栈

- **前端**：React 18 + Vite + React Router
- **后端**：Go + AWS Lambda + API Gateway
- **数据库**：Supabase (PostgreSQL)
- **部署**：AWS Amplify (前端) + AWS SAM (后端)
- **认证**：JWT

## 未来增强

- 头像上传
- 自定义职业标签
- 项目删除
- 项目所有权转移
- 活动日志
- 邮件通知

## 许可证

MIT
