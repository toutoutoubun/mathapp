-- テスト用フェーズデータ
INSERT INTO phases (name, description, order_index) VALUES
('基礎概念の理解', '学習の土台となる基礎的な概念を学びます', 0),
('応用トピック', '基礎を活用した応用的な内容を学びます', 1);

-- テスト用モジュールデータ
INSERT INTO modules (phase_id, name, description, icon, color, order_index) VALUES
(1, 'グラフの読解', 'グラフの見方を一つずつ学びます', '📊', 'blue', 0),
(1, '基数性の再構築', '数字が表す「量」を理解します', '🔢', 'green', 1),
(1, '単位と量', '単位を揃えて比べる方法を学びます', '📏', 'yellow', 2);

-- テスト用ステップデータ
INSERT INTO steps (module_id, title, description, order_index) VALUES
(1, 'グラフの種類を知ろう', '棒グラフ、折れ線グラフ、円グラフの違いを理解します', 0),
(1, '表題と軸を読み取ろう', 'グラフの表題、横軸、縦軸、単位を確認する方法を学びます', 1),
(1, 'データを読み取ろう', 'グラフから具体的な数値を読み取る練習をします', 2);

