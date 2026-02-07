-- Update Settings App to Chinese
-- 将 Settings App 的名称和描述改为中文

-- Update the app name and description
UPDATE apps
SET 
  app_name = '设置',
  app_description = '管理你的个人资料和项目',
  updated_at = NOW()
WHERE app_name = 'Settings' OR app_name = '设置';

-- Verify the update
SELECT 
  app_id,
  app_name,
  app_description,
  emoji,
  url,
  is_global,
  updated_at
FROM apps
WHERE app_name = '设置';

-- If you want to see all apps
SELECT 
  app_name,
  app_description,
  emoji,
  is_global,
  url
FROM apps
ORDER BY created_at DESC;
