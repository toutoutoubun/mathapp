-- 用語集の初期データ
INSERT OR IGNORE INTO glossary (term, definition, example, module_id) VALUES
  ('グラフ', 'データを視覚的に表現したもの。数字だけでは分かりにくいことを、形や高さで表します。', '棒グラフ、折れ線グラフ、円グラフなど', 'graph_basics'),
  ('表題', 'グラフの一番上に書いてある、「このグラフは何について教えてくれるのか」を示す文章', 'ケニアの月別雨量', 'graph_basics'),
  ('原点', 'グラフの左下の角。数える時のスタート地点（0の場所）', '縦軸と横軸が交わる点', 'graph_basics'),
  ('横軸', 'グラフの下に横に伸びている線。「何を比べるか」を示します', '月、年、国名など', 'graph_basics'),
  ('縦軸', 'グラフの左側に縦に伸びている線。「どのくらいの量か」を示します', '人数、降水量、気温など', 'graph_basics'),
  ('単位', '何を数えているかを示す記号や文字', '(人)、(mm)、(℃)など', 'graph_basics'),
  ('目盛り', 'グラフの線に沿って等間隔に付けられた印。1つ上がるといくつ増えるかが分かります', '10ずつ、100ずつなど', 'graph_basics'),
  ('棒グラフ', '棒の高さで量を比べるグラフ。どれが多いか少ないかが一目で分かります', '都市別人口の比較', 'graph_basics'),
  ('折れ線グラフ', '点を線でつないだグラフ。時間とともに増えたり減ったりする変化が分かります', '月ごとの気温の変化', 'graph_basics'),
  ('概数', 'だいたいの数。細かい数字ではなく、おおよその大きさを表す', '53,005,614人 → 約5300万人', 'approximation'),
  ('基数', '「3個」「5人」のように、数字が表す具体的な個数や量', '3は「1が3つ分」という意味', 'cardinality');

-- アフリカ都市カードの初期データ
INSERT OR IGNORE INTO africa_cards (user_id, card_id, city_name, country, population, description, image_url) VALUES
  ('system', 'nairobi', 'ナイロビ', 'ケニア', '約450万人', 'ケニアの首都。東アフリカの経済・文化の中心地です。', '/static/cards/nairobi.jpg'),
  ('system', 'lagos', 'ラゴス', 'ナイジェリア', '約1500万人', 'アフリカ最大級の都市。活気あふれる港町です。', '/static/cards/lagos.jpg'),
  ('system', 'cairo', 'カイロ', 'エジプト', '約2000万人', 'エジプトの首都。古代からの歴史ある都市です。', '/static/cards/cairo.jpg'),
  ('system', 'kigali', 'キガリ', 'ルワンダ', '約130万人', 'ルワンダの首都。「アフリカで最もきれいな都市」と呼ばれています。', '/static/cards/kigali.jpg'),
  ('system', 'addis_ababa', 'アディスアベバ', 'エチオピア', '約350万人', 'エチオピアの首都。アフリカ連合の本部があります。', '/static/cards/addis_ababa.jpg'),
  ('system', 'cape_town', 'ケープタウン', '南アフリカ', '約430万人', '美しい海岸と山に囲まれた観光都市です。', '/static/cards/cape_town.jpg');

-- テストユーザー
INSERT OR IGNORE INTO users (id, username, password, role) VALUES 
  (1, 'teacher1', 'password', 'teacher'),
  (2, 'student1', 'password', 'student');

-- テストセクション
INSERT OR IGNORE INTO sections (id, name, description, grade_level, subject, teacher_id, access_code) VALUES 
  (1, '中学1年 数学', '数学の基礎を学びます', '中学1年', '数学', 1, 'MATH01'),
  (2, '高校2年 物理', '力学と波動について', '高校2年', '理科', 1, 'PHYS02');

-- テストフェーズ
INSERT OR IGNORE INTO phases (id, section_id, name, description, order_index) VALUES
  (1, 1, '正の数・負の数', 'プラスとマイナスの数について学びます', 1),
  (2, 1, '文字と式', '文字を使った式の計算', 2),
  (3, 2, '力学', '物体の運動と力', 1);

-- テストモジュール
INSERT OR IGNORE INTO modules (id, phase_id, name, description, icon, color, order_index) VALUES
  (1, 1, '正負の数の意味', '0より小さい数について', '1️⃣', 'blue', 1),
  (2, 1, '加法と減法', '足し算と引き算', '➕', 'green', 2),
  (3, 3, '速度と加速度', '速さの変化について', '🚗', 'red', 1);

-- アサインメント（生徒1をセクション1と2に割り当て）
INSERT OR IGNORE INTO assignments (teacher_id, student_id, section_id) VALUES 
  (1, 2, 1),
  (1, 2, 2);
