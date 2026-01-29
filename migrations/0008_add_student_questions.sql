-- 生徒からの質問テーブル
CREATE TABLE IF NOT EXISTS student_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  module_id INTEGER,
  step_id INTEGER,
  question_text TEXT NOT NULL,
  reply_text TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'replied'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reply_at DATETIME,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (module_id) REFERENCES modules(id),
  FOREIGN KEY (step_id) REFERENCES steps(id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_student_questions_teacher_status ON student_questions(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_student_questions_student ON student_questions(student_id);
