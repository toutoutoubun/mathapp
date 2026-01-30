-- Step 2にテストデータを追加
-- テキストブロック1
INSERT INTO content_blocks (step_id, block_type, content, order_index) 
VALUES (2, 'text', '{"text": "# 最初のテキストブロック\n\nこれは最初のテキストです。"}', 0);

-- 問題1
INSERT INTO questions (step_id, question_type, question_text, config, order_index) 
VALUES (2, 'multiple_choice', '中間に挿入された問題です', '{}', 1);

INSERT INTO question_options (question_id, option_text, is_correct, order_index)
VALUES (
  (SELECT id FROM questions WHERE step_id = 2 AND order_index = 1 LIMIT 1),
  '選択肢A',
  1,
  0
);

INSERT INTO question_options (question_id, option_text, is_correct, order_index)
VALUES (
  (SELECT id FROM questions WHERE step_id = 2 AND order_index = 1 LIMIT 1),
  '選択肢B',
  0,
  1
);

-- テキストブロック2
INSERT INTO content_blocks (step_id, block_type, content, order_index) 
VALUES (2, 'text', '{"text": "# 2番目のテキストブロック\n\n問題の後に表示されるテキストです。"}', 2);

-- 画像ブロック
INSERT INTO content_blocks (step_id, block_type, content, order_index) 
VALUES (2, 'image', '{"url": "https://via.placeholder.com/600x400?text=Test+Image"}', 3);

-- 問題2
INSERT INTO questions (step_id, question_type, question_text, config, order_index) 
VALUES (2, 'multiple_choice', '最後の問題です', '{}', 4);

INSERT INTO question_options (question_id, option_text, is_correct, order_index)
VALUES (
  (SELECT id FROM questions WHERE step_id = 2 AND order_index = 4 LIMIT 1),
  '正解',
  1,
  0
);

INSERT INTO question_options (question_id, option_text, is_correct, order_index)
VALUES (
  (SELECT id FROM questions WHERE step_id = 2 AND order_index = 4 LIMIT 1),
  '不正解',
  0,
  1
);
