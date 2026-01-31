-- Rollback: restore transactions column and remove file_path
ALTER TABLE user_transactions ADD COLUMN transactions JSONB NOT NULL DEFAULT '[]';
ALTER TABLE user_transactions DROP COLUMN file_path;
