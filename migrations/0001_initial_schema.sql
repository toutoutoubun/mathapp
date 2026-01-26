-- ユーザー進捗テーブル
CREATE TABLE IF NOT EXISTS user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  module_id TEXT NOT NULL,
  step_id TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, module_id, step_id)
);

-- 問題解答履歴テーブル
CREATE TABLE IF NOT EXISTS answer_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  module_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer TEXT,
  is_correct BOOLEAN,
  explanation TEXT,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 達成ログテーブル
CREATE TABLE IF NOT EXISTS achievement_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  achievement_type TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- アフリカ都市カードコレクションテーブル
CREATE TABLE IF NOT EXISTS africa_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  card_id TEXT NOT NULL,
  city_name TEXT NOT NULL,
  country TEXT NOT NULL,
  population TEXT,
  description TEXT,
  image_url TEXT,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, card_id)
);

-- 用語集テーブル
CREATE TABLE IF NOT EXISTS glossary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  example TEXT,
  module_id TEXT,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module ON user_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_answer_history_user ON answer_history(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_log_user ON achievement_log(user_id);
CREATE INDEX IF NOT EXISTS idx_africa_cards_user ON africa_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_glossary_term ON glossary(term);
