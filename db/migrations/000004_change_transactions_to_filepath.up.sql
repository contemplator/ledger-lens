-- Add file_path column and remove transactions JSONB column
ALTER TABLE user_transactions ADD COLUMN file_path TEXT;
ALTER TABLE user_transactions DROP COLUMN transactions;
