-- テスト用の進捗データを挿入
-- 生徒ID=2 (テスト生徒) の進捗データ

-- ステップ1を完了
INSERT INTO user_progress (user_id, module_id, step_id, status, updated_at) 
VALUES (2, 1, 1, 'completed', CURRENT_TIMESTAMP)
ON CONFLICT(user_id, module_id, step_id) DO UPDATE SET status = 'completed', updated_at = CURRENT_TIMESTAMP;

