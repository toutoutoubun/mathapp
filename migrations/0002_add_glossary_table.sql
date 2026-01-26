-- ========================================
-- 用語集テーブル追加
-- ========================================

-- 用語集テーブル
CREATE TABLE IF NOT EXISTS glossary_terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term TEXT NOT NULL,
  reading TEXT, -- 読み仮名
  definition TEXT NOT NULL,
  example TEXT,
  category TEXT, -- カテゴリ（例：数学、図形、単位）
  related_terms TEXT, -- 関連用語のIDをJSON配列で保存
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_glossary_terms_category ON glossary_terms(category);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_term ON glossary_terms(term);
