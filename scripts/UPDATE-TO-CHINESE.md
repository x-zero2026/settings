# 更新 Settings App 为中文

## 目的
将 Dashboard 中显示的 "Settings" 改为 "设置"，描述从 "Manage your profile and projects" 改为 "管理你的个人资料和项目"。

## 方法一：使用 Shell 脚本（推荐）

### 步骤

1. 获取 JWT Token：
   - 登录 DID Login UI (https://main.d2fozf421c6ftf.amplifyapp.com)
   - 打开浏览器开发者工具 (F12)
   - 进入 Application → Local Storage
   - 复制 'token' 的值

2. 运行更新脚本：
```bash
cd settings/scripts
JWT_TOKEN="your-token-here" ./update-app-chinese.sh
```

### 预期结果
```
========================================
Update Settings App to Chinese
========================================

Finding Settings app...
✓ Using project: xxx
✓ Found Settings app: xxx

Updating app to Chinese...

✅ Success! App updated to Chinese.

Updated information:
  Name: 设置
  Description: 管理你的个人资料和项目
  Emoji: ⚙️

Next steps:
1. Refresh the DID Login Dashboard
2. You should see '设置 ⚙️' instead of 'Settings ⚙️'
```

## 方法二：使用 SQL 脚本

### 步骤

1. 连接到 Supabase 数据库

2. 运行 SQL 脚本：
```bash
psql "postgresql://postgres.rbpsksuuvtzmathnmyxn:iPass4xz2026!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres" -f update-app-chinese.sql
```

或者在 Supabase SQL Editor 中直接运行：
```sql
UPDATE apps
SET 
  app_name = '设置',
  app_description = '管理你的个人资料和项目',
  updated_at = NOW()
WHERE app_name = 'Settings' OR app_name = '设置';
```

## 验证

### 1. 检查数据库
```sql
SELECT app_name, app_description, emoji
FROM apps
WHERE app_name = '设置';
```

应该返回：
```
app_name | app_description          | emoji
---------|--------------------------|------
设置      | 管理你的个人资料和项目    | ⚙️
```

### 2. 检查 Dashboard

1. 刷新 DID Login Dashboard
2. 应该看到 "设置 ⚙️" 而不是 "Settings ⚙️"
3. 鼠标悬停应该显示 "管理你的个人资料和项目"

## 更新的内容

| 字段 | 修改前 | 修改后 |
|------|--------|--------|
| app_name | Settings | 设置 |
| app_description | Manage your profile and projects | 管理你的个人资料和项目 |
| emoji | ⚙️ | ⚙️ (不变) |

## 注意事项

1. **不影响功能**：只是改变显示名称和描述，不影响任何功能
2. **URL 不变**：应用的 URL 保持不变
3. **全局可见**：is_global 保持为 true，所有用户都能看到
4. **立即生效**：更新后刷新页面即可看到变化

## 回滚

如果需要改回英文：

### 使用 SQL
```sql
UPDATE apps
SET 
  app_name = 'Settings',
  app_description = 'Manage your profile and projects',
  updated_at = NOW()
WHERE app_name = '设置';
```

### 使用 API
```bash
JWT_TOKEN="your-token" \
curl -X PUT "https://i149gvmuh8.execute-api.us-east-1.amazonaws.com/prod/api/apps/$APP_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "Settings",
    "app_description": "Manage your profile and projects",
    "emoji": "⚙️"
  }'
```

## 相关文件

- `update-app-chinese.sh` - Shell 脚本（推荐）
- `update-app-chinese.sql` - SQL 脚本
- `register-app.sh` - 已更新为默认使用中文
- `register-app.sql` - 已更新为默认使用中文

## 日期
2026年2月8日
