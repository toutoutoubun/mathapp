-- テスト用セクションデータ
INSERT INTO sections (name, description, grade_level, subject) VALUES
('中学1年生の数学', '中学1年生で学ぶ数学の内容', '中1', '数学'),
('中学2年生の数学', '中学2年生で学ぶ数学の内容', '中2', '数学');

-- 既存のフェーズをセクションに関連付け
UPDATE phases SET section_id = 1 WHERE id IN (1, 2);

