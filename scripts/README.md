# Settings App - Scripts

This directory contains database migration scripts and app registration utilities for the Settings App.

## Scripts Overview

1. **001-add-bio-and-tags.sql** - Database migration script
2. **register-app.sh** - Shell script to register the app via API
3. **register-app.sql** - SQL script to register the app directly in database

## 1. Database Migration

### 001-add-bio-and-tags.sql

Adds `bio` and `profession_tags` fields to the users table.

**What it does:**
- Adds `bio VARCHAR(500)` column for personal introduction
- Adds `profession_tags TEXT[]` column for profession tags (max 5)
- Creates indexes for better query performance

**How to run:**

```bash
psql "postgresql://postgres.rbpsksuuvtzmathnmyxn:iPass4xz2026!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres" -f 001-add-bio-and-tags.sql
```

Or run directly in Supabase SQL Editor:

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `001-add-bio-and-tags.sql`
4. Click "Run"

## 2. App Registration

### Method A: Using Shell Script (Recommended)

**Prerequisites:**
- `curl` installed
- `jq` installed (for JSON parsing)
- Valid JWT token from DID Login

**Usage:**

```bash
# Basic usage (will prompt for token)
./register-app.sh

# With environment variables
JWT_TOKEN="your-token-here" \
APP_URL="https://your-amplify-url.amplifyapp.com" \
./register-app.sh

# For local development
JWT_TOKEN="your-token-here" \
APP_URL="http://localhost:5173" \
./register-app.sh
```

**Environment Variables:**
- `JWT_TOKEN` - Your JWT token (required)
- `API_URL` - API Gateway URL (default: production URL)
- `APP_URL` - Settings app URL (default: http://localhost:5173)
- `APP_EMOJI` - App emoji (default: ⚙️)
- `IS_GLOBAL` - Make app visible to all users (default: true)
- `PROJECT_NAME` - Project to register app in (default: system)

**How to get JWT token:**
1. Login to DID Login UI (https://main.d2fozf421c6ftf.amplifyapp.com)
2. Open browser DevTools (F12)
3. Go to Application → Local Storage
4. Copy the 'token' value

### Method B: Using SQL Script

If the API method doesn't work, you can register the app directly in the database.

**Steps:**

1. Open `register-app.sql` in a text editor
2. Replace `'your-did-here'` with your actual DID
3. Update the URL if deploying to production
4. Run in Supabase SQL Editor or via psql:

```bash
psql "postgresql://postgres.rbpsksuuvtzmathnmyxn:iPass4xz2026!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres" -f register-app.sql
```

**To find your DID:**

```sql
SELECT did, username, email 
FROM users 
WHERE username = 'your-username';
```

## Verification

After registration, verify the app was created:

```sql
SELECT 
  app_id,
  app_name,
  app_description,
  emoji,
  url,
  is_global,
  created_by_did
FROM apps
WHERE app_name = 'Settings';
```

## Database Migration Verification

After running the migration, verify the changes:

```sql
-- Check if columns exist
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('bio', 'profession_tags');

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
AND indexname LIKE '%profession_tags%';
```

## Predefined Profession Tags

**Technology (8 tags):**
- `frontend-developer`, `backend-developer`, `fullstack-developer`
- `mobile-developer`, `devops-engineer`, `data-engineer`
- `ml-engineer`, `qa-engineer`

**Design (4 tags):**
- `ui-designer`, `ux-designer`, `product-designer`, `graphic-designer`

**Product/Management (3 tags):**
- `product-manager`, `project-manager`, `scrum-master`

**Business (3 tags):**
- `business-analyst`, `entrepreneur`, `consultant`

**Other (3 tags):**
- `researcher`, `writer`, `marketer`

## Query Examples

```sql
-- Query users with specific tag
SELECT did, username, profession_tags
FROM users
WHERE 'frontend-developer' = ANY(profession_tags);

-- Query users with any of multiple tags
SELECT did, username, profession_tags
FROM users
WHERE profession_tags && ARRAY['frontend-developer', 'backend-developer'];

-- Query users with all specified tags
SELECT did, username, profession_tags
FROM users
WHERE profession_tags @> ARRAY['frontend-developer', 'ui-designer'];

-- Update user tags
UPDATE users
SET profession_tags = ARRAY['frontend-developer', 'ui-designer']
WHERE did = 'did:key:z...';

-- Update user bio
UPDATE users
SET bio = 'Full-stack developer specializing in React and Node.js'
WHERE did = 'did:key:z...';
```

## Rollback (if needed)

### Rollback Database Migration

```sql
-- Remove columns
ALTER TABLE users DROP COLUMN IF EXISTS bio;
ALTER TABLE users DROP COLUMN IF EXISTS profession_tags;

-- Remove indexes
DROP INDEX IF EXISTS idx_users_profession_tags;
```

### Remove App Registration

```sql
-- Delete the app
DELETE FROM apps WHERE app_name = 'Settings';
```

## Troubleshooting

### Shell Script Issues

**Error: "jq: command not found"**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

**Error: "Project 'system' not found"**
- Check available projects: `curl -H "Authorization: Bearer $JWT_TOKEN" $API_URL/api/projects`
- Use a different project: `PROJECT_NAME="your-project" ./register-app.sh`

**Error: "Invalid or expired token"**
- Get a fresh token from DID Login UI
- Tokens expire after 168 hours (7 days) by default

### SQL Script Issues

**Error: "column already exists"**
- The migration is idempotent, this is safe to ignore
- Or use `IF NOT EXISTS` clause (already included in script)

**Error: "permission denied"**
- Ensure you're using the correct database credentials
- Check if your user has ALTER TABLE permissions

## Notes

- The migration is idempotent (safe to run multiple times)
- Uses `IF NOT EXISTS` to avoid errors if columns already exist
- Both columns are nullable (optional fields)
- `profession_tags` is a PostgreSQL array type (TEXT[])
- The app is registered as global (visible to all users)
- Token is passed to the app via URL parameter: `?token=xxx`

## Complete Setup Order

1. Run database migration: `001-add-bio-and-tags.sql`
2. Deploy backend Lambda functions (in did-login-lambda)
3. Deploy frontend to Amplify
4. Register app using `register-app.sh` or `register-app.sql`
5. Test the app from DID Login Dashboard
