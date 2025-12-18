ALTER TABLE users ADD COLUMN line_user_id VARCHAR UNIQUE;
CREATE UNIQUE INDEX idx_users_line_user_id ON users(line_user_id);