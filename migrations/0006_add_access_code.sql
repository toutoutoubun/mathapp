-- セクションにアクセスコードを追加
ALTER TABLE sections ADD COLUMN access_code TEXT;
CREATE INDEX IF NOT EXISTS idx_sections_access_code ON sections(access_code);
