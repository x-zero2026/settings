-- Settings App - Database Migration
-- Add bio and profession_tags fields to users table
-- Date: 2026-02-05

-- Step 1: Add bio column
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(500);

-- Step 2: Add profession_tags column
ALTER TABLE users ADD COLUMN IF NOT EXISTS profession_tags TEXT[] DEFAULT '{}';

-- Step 3: Create GIN index for profession_tags (for efficient array queries)
CREATE INDEX IF NOT EXISTS idx_users_profession_tags ON users USING GIN(profession_tags);

-- Step 4: Add comments
COMMENT ON COLUMN users.bio IS '用户个人简介，最多500字符';
COMMENT ON COLUMN users.profession_tags IS '职业标签数组，最多5个标签';

-- Step 5: Verify the changes
DO $$
DECLARE
    bio_exists BOOLEAN;
    tags_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'bio'
    ) INTO bio_exists;
    
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'profession_tags'
    ) INTO tags_exists;
    
    IF bio_exists AND tags_exists THEN
        RAISE NOTICE 'Migration successful! bio and profession_tags columns added.';
    ELSE
        RAISE EXCEPTION 'Migration failed! Columns not found.';
    END IF;
END $$;

-- Migration complete
SELECT 'Migration 001 completed successfully. Users table now has bio and profession_tags columns.' AS status;
