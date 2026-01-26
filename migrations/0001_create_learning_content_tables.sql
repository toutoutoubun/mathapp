-- ========================================
-- 学習アプリ開発プラットフォーム データベーススキーマ
-- ========================================

-- フェーズテーブル（学習の大きな区分）
CREATE TABLE IF NOT EXISTS phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- モジュールテーブル（フェーズ内の学習単元）
CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE
);

-- ステップテーブル（モジュール内の学習ステップ）
CREATE TABLE IF NOT EXISTS steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- コンテンツブロックテーブル（ステップ内のコンテンツ要素）
CREATE TABLE IF NOT EXISTS content_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  step_id INTEGER NOT NULL,
  block_type TEXT NOT NULL, -- 'text', 'image', 'html', 'interactive'
  content TEXT NOT NULL, -- JSON形式でコンテンツを保存
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE
);

-- 問題テーブル（ステップに関連する問題）
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  step_id INTEGER NOT NULL,
  question_type TEXT NOT NULL, -- 'multiple_choice', 'short_answer', 'interactive_graph', 'interactive_shape', 'drag_drop'
  question_text TEXT NOT NULL,
  config TEXT, -- JSON形式で問題固有の設定を保存
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE
);

-- 選択肢テーブル（選択式問題の選択肢）
CREATE TABLE IF NOT EXISTS question_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  option_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0, -- 0: 不正解, 1: 正解
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- インタラクティブ要素テーブル（図形、グラフ、表などのインタラクティブ要素）
CREATE TABLE IF NOT EXISTS interactive_elements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  element_type TEXT NOT NULL, -- 'graph', 'shape', 'table', 'chart', 'number_line', 'fraction_bar'
  config TEXT NOT NULL, -- JSON形式で要素の設定を保存（初期状態、操作可能範囲など）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 問題とインタラクティブ要素の関連テーブル
CREATE TABLE IF NOT EXISTS question_interactive_elements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  interactive_element_id INTEGER NOT NULL,
  role TEXT NOT NULL, -- 'problem', 'answer', 'hint'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (interactive_element_id) REFERENCES interactive_elements(id) ON DELETE CASCADE
);

-- インデックス作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_modules_phase_id ON modules(phase_id);
CREATE INDEX IF NOT EXISTS idx_steps_module_id ON steps(module_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_step_id ON content_blocks(step_id);
CREATE INDEX IF NOT EXISTS idx_questions_step_id ON questions(step_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_question_interactive_elements_question_id ON question_interactive_elements(question_id);
