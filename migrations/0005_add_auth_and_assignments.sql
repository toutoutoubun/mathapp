-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- 本番運用時はハッシュ化推奨
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 教師と生徒の関係（教師が管理する生徒）
CREATE TABLE IF NOT EXISTS teacher_students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(teacher_id, student_id)
);

-- コンテンツの割り当て（どの生徒がどのセクションを見れるか）
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  section_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  UNIQUE(student_id, section_id)
);

-- セクションテーブルに所有者（教師）カラムを追加
-- SQLiteではALTER TABLEで外部キー制約付きのカラム追加は制限があるため、まずはカラムのみ追加
ALTER TABLE sections ADD COLUMN teacher_id INTEGER DEFAULT 1; -- 既存データはID:1(admin)のものとする
