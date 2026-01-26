-- エディタ/プロジェクトテーブル（学年単位の最上位概念）
CREATE TABLE IF NOT EXISTS editors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,  -- 例：中学1年生の数学、高校2年生の物理
  description TEXT,
  grade_level TEXT,    -- 例：中1、高2
  subject TEXT,        -- 例：数学、理科、英語
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- phasesテーブルにeditor_idを追加
ALTER TABLE phases ADD COLUMN editor_id INTEGER REFERENCES editors(id) ON DELETE CASCADE;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_phases_editor_id ON phases(editor_id);

