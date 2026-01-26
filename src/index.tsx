import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定
app.use('/api/*', cors())

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './' }))

// ==================== Teacher API Routes ====================

// セクション一覧取得
app.get('/api/teacher/sections', async (c) => {
  const { DB } = c.env
  const result = await DB.prepare('SELECT * FROM sections ORDER BY created_at DESC').all()
  return c.json({ sections: result.results })
})

// セクション作成
app.post('/api/teacher/sections', async (c) => {
  const { DB } = c.env
  const { name, description, grade_level, subject } = await c.req.json()
  
  const result = await DB.prepare(
    'INSERT INTO sections (name, description, grade_level, subject) VALUES (?, ?, ?, ?)'
  ).bind(name, description || null, grade_level || null, subject || null).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// ==================== Student API Routes ====================

// セクション一覧取得（生徒用）
app.get('/api/student/sections', async (c) => {
  const { DB } = c.env
  const result = await DB.prepare('SELECT * FROM sections ORDER BY grade_level, subject').all()
  return c.json({ sections: result.results })
})

// ==================== Student API Routes ====================

// 進捗状況取得
app.get('/api/progress', async (c) => {
  const { DB } = c.env
  const userId = 'default_user'
  
  const result = await DB.prepare(
    'SELECT * FROM user_progress WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(userId).all()
  
  return c.json({ progress: result.results })
})

// 進捗状況更新
app.post('/api/progress', async (c) => {
  const { DB } = c.env
  const { module_id, step_id, status } = await c.req.json()
  const userId = 'default_user'
  
  await DB.prepare(`
    INSERT INTO user_progress (user_id, module_id, step_id, status, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, module_id, step_id) 
    DO UPDATE SET status = ?, updated_at = CURRENT_TIMESTAMP
  `).bind(userId, module_id, step_id, status, status).run()
  
  return c.json({ success: true })
})

// 解答履歴保存
app.post('/api/answer', async (c) => {
  const { DB } = c.env
  const { module_id, step_id, question_id, answer, is_correct, explanation } = await c.req.json()
  const userId = 'default_user'
  
  await DB.prepare(`
    INSERT INTO answer_history (user_id, module_id, step_id, question_id, answer, is_correct, explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(userId, module_id, step_id, question_id, answer, is_correct ? 1 : 0, explanation).run()
  
  return c.json({ success: true })
})

// 達成ログ追加
app.post('/api/achievement', async (c) => {
  const { DB } = c.env
  const { achievement_type, achievement_id, points, title, description } = await c.req.json()
  const userId = 'default_user'
  
  await DB.prepare(`
    INSERT INTO achievement_log (user_id, achievement_type, achievement_id, points, title, description)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, achievement_id) DO NOTHING
  `).bind(userId, achievement_type, achievement_id, points, title, description).run()
  
  return c.json({ success: true })
})

// 達成ログ取得
app.get('/api/achievements', async (c) => {
  const { DB } = c.env
  const userId = 'default_user'
  
  const result = await DB.prepare(
    'SELECT * FROM achievement_log WHERE user_id = ? ORDER BY achieved_at DESC'
  ).bind(userId).all()
  
  return c.json({ achievements: result.results })
})

// アフリカ都市カード取得
app.get('/api/cards', async (c) => {
  const { DB } = c.env
  const userId = 'default_user'
  
  const result = await DB.prepare(
    'SELECT * FROM africa_cards WHERE user_id = ? OR user_id = ? ORDER BY unlocked_at DESC'
  ).bind(userId, 'system').all()
  
  return c.json({ cards: result.results })
})

// カードアンロック
app.post('/api/cards/unlock', async (c) => {
  const { DB } = c.env
  const { card_id } = await c.req.json()
  const userId = 'default_user'
  
  // システムカードから情報を取得
  const systemCard = await DB.prepare(
    'SELECT * FROM africa_cards WHERE user_id = ? AND card_id = ?'
  ).bind('system', card_id).first()
  
  if (!systemCard) {
    return c.json({ success: false, error: 'Card not found' }, 404)
  }
  
  // ユーザーのコレクションに追加
  await DB.prepare(`
    INSERT INTO africa_cards (user_id, card_id, city_name, country, population, description, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, card_id) DO NOTHING
  `).bind(
    userId,
    systemCard.card_id,
    systemCard.city_name,
    systemCard.country,
    systemCard.population,
    systemCard.description,
    systemCard.image_url
  ).run()
  
  return c.json({ success: true, card: systemCard })
})

// 用語集取得
app.get('/api/glossary', async (c) => {
  const { DB } = c.env
  const search = c.req.query('search') || ''
  
  let query = 'SELECT * FROM glossary'
  let params: string[] = []
  
  if (search) {
    query += ' WHERE term LIKE ? OR definition LIKE ?'
    params = [`%${search}%`, `%${search}%`]
  }
  
  query += ' ORDER BY term ASC'
  
  const result = await DB.prepare(query).bind(...params).all()
  
  return c.json({ glossary: result.results })
})

// ==================== HTML Routes ====================

// メインページ - 教師用プラットフォーム
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>学習アプリ開発プラットフォーム（教師用）</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen">
        <!-- ナビゲーションバー -->
        <nav class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-chalkboard-teacher mr-2"></i>
                        学習アプリ開発プラットフォーム（教師用）
                    </h1>
                    <div class="flex gap-4">
                        <a href="/student" class="px-4 py-2 bg-green-500 rounded-lg hover:bg-green-400 transition">
                            <i class="fas fa-user-graduate mr-2"></i>生徒画面を見る
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- メインコンテンツ -->
        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- ウェルカムセクション -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div class="text-center">
                    <div class="text-6xl mb-4">🎓</div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">教師用管理画面</h2>
                    <p class="text-lg text-gray-600 mb-6">
                        学年単位で学習コンテンツを作成できるプラットフォームです。<br>
                        <strong>エディタ（学年）→ フェーズ（大単元）→ モジュール（中単元）→ ステップ（学習内容）</strong>
                    </p>
                </div>
            </div>

            <!-- 階層構造の説明 -->
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 mb-8">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-sitemap mr-2 text-indigo-600"></i>
                    コンテンツの階層構造
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white p-4 rounded-lg shadow">
                        <div class="text-3xl mb-2">1️⃣</div>
                        <h4 class="font-bold text-gray-800 mb-1">エディタ</h4>
                        <p class="text-xs text-gray-600">学年単位（例：中1数学）</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow">
                        <div class="text-3xl mb-2">2️⃣</div>
                        <h4 class="font-bold text-gray-800 mb-1">フェーズ</h4>
                        <p class="text-xs text-gray-600">大単元（例：正負の数）</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow">
                        <div class="text-3xl mb-2">3️⃣</div>
                        <h4 class="font-bold text-gray-800 mb-1">モジュール</h4>
                        <p class="text-xs text-gray-600">中単元（例：加法）</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow">
                        <div class="text-3xl mb-2">4️⃣</div>
                        <h4 class="font-bold text-gray-800 mb-1">ステップ</h4>
                        <p class="text-xs text-gray-600">学習内容（1概念）</p>
                    </div>
                </div>
            </div>

            <!-- 管理機能カード -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <!-- セクション管理 -->
                <a href="/teacher/sections" class="block p-6 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">📚</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">セクション管理</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        学年単位のプロジェクトを作成・管理
                    </p>
                    <div class="flex items-center text-indigo-600 font-semibold">
                        管理画面へ
                        <i class="fas fa-arrow-right ml-2"></i>
                    </div>
                </a>

                <!-- フェーズ管理 -->
                <a href="/teacher/phases" class="block p-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">📖</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">フェーズ管理</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        大単元を作成・管理
                    </p>
                    <div class="flex items-center text-purple-600 font-semibold">
                        管理画面へ
                        <i class="fas fa-arrow-right ml-2"></i>
                    </div>
                </a>

                <!-- モジュール管理 -->
                <a href="/teacher/modules" class="block p-6 bg-gradient-to-br from-green-100 to-green-200 rounded-xl hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">📝</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">モジュール管理</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        中単元を作成・管理
                    </p>
                    <div class="flex items-center text-green-600 font-semibold">
                        管理画面へ
                        <i class="fas fa-arrow-right ml-2"></i>
                    </div>
                </a>

                <!-- ステップ管理 -->
                <a href="/teacher/steps" class="block p-6 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">✏️</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">ステップ管理</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        学習ステップと説明文を作成
                    </p>
                    <div class="flex items-center text-yellow-600 font-semibold">
                        管理画面へ
                        <i class="fas fa-arrow-right ml-2"></i>
                    </div>
                </a>

                <!-- コンテンツ作成 -->
                <a href="/teacher/content" class="block p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">🎨</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">コンテンツ作成</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        テキスト、図形、問題を作成
                    </p>
                    <div class="flex items-center text-blue-600 font-semibold">
                        作成画面へ
                        <i class="fas fa-arrow-right ml-2"></i>
                    </div>
                </a>

                <!-- 生徒画面プレビュー -->
                <a href="/student" class="block p-6 bg-gradient-to-br from-green-100 to-green-200 rounded-xl hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">👀</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">生徒画面</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        作成したコンテンツを確認
                    </p>
                    <div class="flex items-center text-green-600 font-semibold">
                        生徒画面を見る
                        <i class="fas fa-arrow-right ml-2"></i>
                    </div>
                </a>
            </div>
        </div>
    </body>
    </html>
  `)
})

// 生徒用ホームページ
app.get('/student', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>学習アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <!-- ナビゲーションバー -->
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-purple-600">
                        <i class="fas fa-graduation-cap mr-2"></i>
                        学習アプリ
                    </h1>
                    <div class="flex gap-4 items-center">
                        <!-- セクション選択プルダウン -->
                        <select id="section-select" class="px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                            <option value="">学年を選択...</option>
                        </select>
                        <a href="/student" class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
                            <i class="fas fa-home mr-2"></i>ホーム
                        </a>
                        <a href="/student/achievements" class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
                            <i class="fas fa-trophy mr-2"></i>達成記録
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- メインコンテンツ -->
        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h2 class="text-3xl font-bold text-gray-800 mb-4">ようこそ!</h2>
                <p class="text-lg text-gray-600 mb-6">
                    自分のペースで学習を進めていきましょう。
                </p>
            </div>

            <!-- 利用可能なコンテンツ -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="fas fa-book-open mr-2 text-blue-600"></i>
                    利用可能な学習コンテンツ
                </h3>
                <p class="text-gray-600 mb-6">
                    現在、デモコンテンツが利用可能です。
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- デモ: 中学数学 -->
                    <a href="/student/demo" class="block p-6 bg-gradient-to-br from-blue-100 to-purple-200 rounded-lg hover:shadow-xl transition transform hover:-translate-y-1">
                        <div class="text-4xl mb-4">📐</div>
                        <h4 class="text-xl font-bold text-gray-800 mb-2">中学数学（デモ）</h4>
                        <p class="text-gray-600 text-sm">
                            算数の基礎から中学1年生の内容まで
                        </p>
                        <div class="mt-4 text-sm text-blue-600 font-semibold">
                            学習を始める →
                        </div>
                    </a>
                </div>
            </div>

            <!-- 進捗状況 -->
            <div class="bg-white rounded-xl shadow-lg p-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="fas fa-chart-line mr-2"></i>
                    あなたの進捗
                </h3>
                <div id="progress-container" class="space-y-4">
                    <p class="text-gray-500">学習を始めると、ここに進捗が表示されます。</p>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

// デモページ - 数学学習アプリ（生徒用）
app.get('/student/demo', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>数学学習アプリ（デモ）</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <!-- ナビゲーションバー -->
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-purple-600">
                        <i class="fas fa-graduation-cap mr-2"></i>
                        数学の冒険（デモ）
                    </h1>
                    <div class="flex gap-4">
                        <a href="/student" class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
                            <i class="fas fa-arrow-left mr-2"></i>戻る
                        </a>
                        <a href="/student/demo" class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition">
                            <i class="fas fa-home mr-2"></i>ホーム
                        </a>
                        <a href="/student/achievements" class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
                            <i class="fas fa-trophy mr-2"></i>達成記録
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- メインコンテンツ -->
        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h2 class="text-3xl font-bold text-gray-800 mb-4">ようこそ!</h2>
                <p class="text-lg text-gray-600 mb-6">
                    このアプリでは、中学数学の基礎をゆっくり、確実に学んでいきます。<br>
                    一つずつ、自分のペースで進めていきましょう。
                </p>
            </div>

            <!-- フェーズ0: 算数再翻訳 -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h3 class="text-2xl font-bold text-purple-600 mb-6">
                    <i class="fas fa-star mr-2"></i>
                    フェーズ0: 算数再翻訳
                </h3>
                <p class="text-gray-600 mb-6">
                    中学数学を始める前に、大切な基礎をしっかり理解しましょう。
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- モジュール1: グラフの読解 -->
                    <a href="/module/graph_basics" class="block p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg hover:shadow-xl transition transform hover:-translate-y-1">
                        <div class="text-4xl mb-4">📊</div>
                        <h4 class="text-xl font-bold text-gray-800 mb-2">グラフの読解</h4>
                        <p class="text-gray-600 text-sm">
                            グラフの見方を一つずつ学びます
                        </p>
                        <div class="mt-4 text-sm text-blue-600 font-semibold">
                            15つのステップ →
                        </div>
                    </a>

                    <!-- モジュール2: 基数性の再構築 -->
                    <a href="/module/cardinality" class="block p-6 bg-gradient-to-br from-green-100 to-green-200 rounded-lg hover:shadow-xl transition transform hover:-translate-y-1">
                        <div class="text-4xl mb-4">🔢</div>
                        <h4 class="text-xl font-bold text-gray-800 mb-2">基数性の再構築</h4>
                        <p class="text-gray-600 text-sm">
                            数字が表す「量」を理解します
                        </p>
                        <div class="mt-4 text-sm text-green-600 font-semibold">
                            12つのステップ →
                        </div>
                    </a>

                    <!-- モジュール3: 単位と量 -->
                    <a href="/module/units" class="block p-6 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg hover:shadow-xl transition transform hover:-translate-y-1">
                        <div class="text-4xl mb-4">📏</div>
                        <h4 class="text-xl font-bold text-gray-800 mb-2">単位と量</h4>
                        <p class="text-gray-600 text-sm">
                            単位を揃えて比べる方法を学びます
                        </p>
                        <div class="mt-4 text-sm text-yellow-600 font-semibold">
                            10つのステップ →
                        </div>
                    </a>

                    <!-- モジュール4: 割合の直感 -->
                    <a href="/module/proportions" class="block p-6 bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg hover:shadow-xl transition transform hover:-translate-y-1">
                        <div class="text-4xl mb-4">🍰</div>
                        <h4 class="text-xl font-bold text-gray-800 mb-2">割合の直感</h4>
                        <p class="text-gray-600 text-sm">
                            「1あたり」で考える方法を学びます
                        </p>
                        <div class="mt-4 text-sm text-pink-600 font-semibold">
                            10つのステップ →
                        </div>
                    </a>

                    <!-- モジュール5: 概数 -->
                    <a href="/module/approximation" class="block p-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg hover:shadow-xl transition transform hover:-translate-y-1">
                        <div class="text-4xl mb-4">🎯</div>
                        <h4 class="text-xl font-bold text-gray-800 mb-2">概数・おおよその判断</h4>
                        <p class="text-gray-600 text-sm">
                            だいたいの数で考える方法を学びます
                        </p>
                        <div class="mt-4 text-sm text-purple-600 font-semibold">
                            8つのステップ →
                        </div>
                    </a>

                    <!-- モジュール6: 公式集 -->
                    <a href="/module/formulas" class="block p-6 bg-gradient-to-br from-yellow-100 to-orange-200 rounded-lg hover:shadow-xl transition transform hover:-translate-y-1">
                        <div class="text-4xl mb-4">📐</div>
                        <h4 class="text-xl font-bold text-gray-800 mb-2">公式集</h4>
                        <p class="text-gray-600 text-sm">
                            全モジュールで学んだ公式をまとめて復習
                        </p>
                        <div class="mt-4 text-sm text-orange-600 font-semibold">
                            5つのステップ →
                        </div>
                    </a>
                </div>
            </div>

            <!-- 中学1年生の内容 -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="fas fa-graduation-cap mr-2 text-indigo-600"></i>
                    中学1年生の内容
                </h3>
                <p class="text-gray-600 mb-6">
                    基礎が身についたら、中学1年生の内容に進みましょう。
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- モジュール7: 正の数・負の数 -->
                    <a href="/module/integers" class="block p-6 bg-gradient-to-br from-indigo-100 to-blue-200 rounded-lg hover:shadow-xl transition transform hover:-translate-y-1">
                        <div class="text-4xl mb-4">➕➖</div>
                        <h4 class="text-xl font-bold text-gray-800 mb-2">正の数・負の数</h4>
                        <p class="text-gray-600 text-sm">
                            マイナスの数を学びます
                        </p>
                        <div class="mt-4 text-sm text-indigo-600 font-semibold">
                            5つのステップ →
                        </div>
                    </a>
                </div>
            </div>

            <!-- 進捗状況 -->
            <div class="bg-white rounded-xl shadow-lg p-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="fas fa-chart-line mr-2"></i>
                    あなたの進捗
                </h3>
                <div id="progress-container" class="space-y-4">
                    <!-- 進捗はJavaScriptで動的に表示 -->
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

// グラフ読解モジュールページ
app.get('/module/graph_basics', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>グラフの読解 - 中学数学基礎概念支援アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <!-- ナビゲーションバー -->
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-purple-600">
                        <i class="fas fa-graduation-cap mr-2"></i>
                        数学の冒険
                    </h1>
                    <a href="/" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                        <i class="fas fa-home mr-2"></i>ホームに戻る
                    </a>
                </div>
            </div>
        </nav>

        <!-- メインコンテンツ -->
        <div class="max-w-5xl mx-auto px-4 py-8">
            <!-- モジュールタイトル -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div class="flex items-center gap-4 mb-4">
                    <div class="text-6xl">📊</div>
                    <div>
                        <h2 class="text-3xl font-bold text-gray-800">グラフの読解</h2>
                        <p class="text-gray-600 mt-2">グラフの見方を一つずつ、ゆっくり学びましょう</p>
                    </div>
                </div>

                <!-- ステップナビゲーション -->
                <div class="step-nav mt-8" id="step-nav">
                    <!-- JavaScriptで動的に生成 -->
                </div>
            </div>

            <!-- 学習コンテンツ -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8" id="content-area">
                <!-- JavaScriptで動的に表示 -->
            </div>

            <!-- ナビゲーションボタン -->
            <div class="flex justify-between items-center">
                <button id="prev-btn" class="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-arrow-left mr-2"></i>前へ
                </button>
                <div id="completion-message" class="hidden text-center">
                    <div class="text-4xl mb-2">🎉</div>
                    <p class="text-xl font-bold text-green-600">おめでとうございます！</p>
                    <p class="text-gray-600 mt-2">グラフの読解モジュールを完了しました！</p>
                </div>
                <button id="next-btn" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                    次へ<i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js?v=5"></script>
        <script src="/static/graph-module.js?v=5"></script>
        <script src="/static/graph-learn-v3.js?v=5"></script>
    </body>
    </html>
  `)
})

// モジュール2: 基数性の再構築
app.get('/module/cardinality', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>基数性の再構築 - 中学数学基礎概念支援アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-purple-600">
                        <i class="fas fa-graduation-cap mr-2"></i>数学の冒険
                    </h1>
                    <a href="/" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                        <i class="fas fa-home mr-2"></i>ホームに戻る
                    </a>
                </div>
            </div>
        </nav>
        <div class="max-w-5xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div class="flex items-center gap-4 mb-4">
                    <div class="text-6xl">🔢</div>
                    <div>
                        <h2 class="text-3xl font-bold text-gray-800">基数性の再構築</h2>
                        <p class="text-gray-600 mt-2">数字が表す「量」を理解しましょう</p>
                    </div>
                </div>
                <div class="step-nav mt-8" id="step-nav"></div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8" id="content-area"></div>
            <div class="flex justify-between items-center">
                <button id="prev-btn" onclick="window.goToPreviousStep()" class="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-arrow-left mr-2"></i>前へ
                </button>
                <div id="completion-message" class="hidden text-center">
                    <div class="text-4xl mb-2">🎉</div>
                    <p class="text-xl font-bold text-green-600">おめでとうございます！</p>
                    <p class="text-gray-600 mt-2">基数性の再構築モジュールを完了しました！</p>
                </div>
                <button id="next-btn" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                    次へ<i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/module-cardinality.js"></script>
        <script src="/static/learn-engine.js"></script>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            if (window.cardinalitySteps && window.LearningEngine) {
              window.LearningEngine.init('cardinality', window.cardinalitySteps);
              window.LearningEngine.renderStepNavigation();
              window.LearningEngine.renderStep(0);
              window.LearningEngine.updateNavigationButtons();
            }
          });
          function goToPreviousStep() {
            if (window.LearningEngine && window.LearningEngine.currentStepIndex > 0) {
              window.LearningEngine.goToStep(window.LearningEngine.currentStepIndex - 1);
            }
          }
          function goToNextStep() {
            if (window.LearningEngine) {
              const idx = window.LearningEngine.currentStepIndex;
              const total = window.LearningEngine.moduleSteps.length;
              if (idx === total - 1) window.LearningEngine.completeModule();
              else window.LearningEngine.goToStep(idx + 1);
            }
          }
          window.goToPreviousStep = goToPreviousStep;
          window.goToNextStep = goToNextStep;
        </script>
    </body>
    </html>
  `)
})

// モジュール3: 単位と量
app.get('/module/units', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>単位と量 - 中学数学基礎概念支援アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-purple-600">
                        <i class="fas fa-graduation-cap mr-2"></i>数学の冒険
                    </h1>
                    <a href="/" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                        <i class="fas fa-home mr-2"></i>ホームに戻る
                    </a>
                </div>
            </div>
        </nav>
        <div class="max-w-5xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div class="flex items-center gap-4 mb-4">
                    <div class="text-6xl">📏</div>
                    <div>
                        <h2 class="text-3xl font-bold text-gray-800">単位と量</h2>
                        <p class="text-gray-600 mt-2">単位を揃えて比べる方法を学びましょう</p>
                    </div>
                </div>
                <div class="step-nav mt-8" id="step-nav"></div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8" id="content-area"></div>
            <div class="flex justify-between items-center">
                <button id="prev-btn" onclick="window.goToPreviousStep()" class="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-arrow-left mr-2"></i>前へ
                </button>
                <div id="completion-message" class="hidden text-center">
                    <div class="text-4xl mb-2">🎉</div>
                    <p class="text-xl font-bold text-green-600">おめでとうございます！</p>
                    <p class="text-gray-600 mt-2">単位と量モジュールを完了しました！</p>
                </div>
                <button id="next-btn" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                    次へ<i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/module-units.js"></script>
        <script src="/static/learn-engine.js"></script>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            if (window.unitsSteps && window.LearningEngine) {
              window.LearningEngine.init('units', window.unitsSteps);
              window.LearningEngine.renderStepNavigation();
              window.LearningEngine.renderStep(0);
              window.LearningEngine.updateNavigationButtons();
            }
          });
          function goToPreviousStep() {
            if (window.LearningEngine && window.LearningEngine.currentStepIndex > 0) {
              window.LearningEngine.goToStep(window.LearningEngine.currentStepIndex - 1);
            }
          }
          function goToNextStep() {
            if (window.LearningEngine) {
              const idx = window.LearningEngine.currentStepIndex;
              const total = window.LearningEngine.moduleSteps.length;
              if (idx === total - 1) window.LearningEngine.completeModule();
              else window.LearningEngine.goToStep(idx + 1);
            }
          }
          window.goToPreviousStep = goToPreviousStep;
          window.goToNextStep = goToNextStep;
        </script>
    </body>
    </html>
  `)
})

// モジュール4: 割合の直感
app.get('/module/proportions', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>割合の直感 - 中学数学基礎概念支援アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-purple-600">
                        <i class="fas fa-graduation-cap mr-2"></i>数学の冒険
                    </h1>
                    <a href="/" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                        <i class="fas fa-home mr-2"></i>ホームに戻る
                    </a>
                </div>
            </div>
        </nav>
        <div class="max-w-5xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div class="flex items-center gap-4 mb-4">
                    <div class="text-6xl">🍰</div>
                    <div>
                        <h2 class="text-3xl font-bold text-gray-800">割合の直感</h2>
                        <p class="text-gray-600 mt-2">「1あたり」で考える方法を学びましょう</p>
                    </div>
                </div>
                <div class="step-nav mt-8" id="step-nav"></div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8" id="content-area"></div>
            <div class="flex justify-between items-center">
                <button id="prev-btn" onclick="window.goToPreviousStep()" class="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-arrow-left mr-2"></i>前へ
                </button>
                <div id="completion-message" class="hidden text-center">
                    <div class="text-4xl mb-2">🎉</div>
                    <p class="text-xl font-bold text-green-600">おめでとうございます！</p>
                    <p class="text-gray-600 mt-2">割合の直感モジュールを完了しました！</p>
                </div>
                <button id="next-btn" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                    次へ<i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/module-proportions.js"></script>
        <script src="/static/learn-engine.js"></script>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            if (window.proportionsSteps && window.LearningEngine) {
              window.LearningEngine.init('proportions', window.proportionsSteps);
              window.LearningEngine.renderStepNavigation();
              window.LearningEngine.renderStep(0);
              window.LearningEngine.updateNavigationButtons();
            }
          });
          function goToPreviousStep() {
            if (window.LearningEngine && window.LearningEngine.currentStepIndex > 0) {
              window.LearningEngine.goToStep(window.LearningEngine.currentStepIndex - 1);
            }
          }
          function goToNextStep() {
            if (window.LearningEngine) {
              const idx = window.LearningEngine.currentStepIndex;
              const total = window.LearningEngine.moduleSteps.length;
              if (idx === total - 1) window.LearningEngine.completeModule();
              else window.LearningEngine.goToStep(idx + 1);
            }
          }
          window.goToPreviousStep = goToPreviousStep;
          window.goToNextStep = goToNextStep;
        </script>
    </body>
    </html>
  `)
})

// モジュール5: 概数・おおよその判断
app.get('/module/approximation', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>概数・おおよその判断 - 中学数学基礎概念支援アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-purple-600">
                        <i class="fas fa-graduation-cap mr-2"></i>数学の冒険
                    </h1>
                    <a href="/" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                        <i class="fas fa-home mr-2"></i>ホームに戻る
                    </a>
                </div>
            </div>
        </nav>
        <div class="max-w-5xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div class="flex items-center gap-4 mb-4">
                    <div class="text-6xl">⚖️</div>
                    <div>
                        <h2 class="text-3xl font-bold text-gray-800">概数・おおよその判断</h2>
                        <p class="text-gray-600 mt-2">だいたいの数で考える方法を学びましょう</p>
                    </div>
                </div>
                <div class="step-nav mt-8" id="step-nav"></div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8" id="content-area"></div>
            <div class="flex justify-between items-center">
                <button id="prev-btn" onclick="window.goToPreviousStep()" class="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-arrow-left mr-2"></i>前へ
                </button>
                <div id="completion-message" class="hidden text-center">
                    <div class="text-4xl mb-2">🎉</div>
                    <p class="text-xl font-bold text-green-600">おめでとうございます！</p>
                    <p class="text-gray-600 mt-2">概数・おおよその判断モジュールを完了しました！</p>
                </div>
                <button id="next-btn" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                    次へ<i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/module-approximation.js"></script>
        <script src="/static/learn-engine.js"></script>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            if (window.approximationSteps && window.LearningEngine) {
              window.LearningEngine.init('approximation', window.approximationSteps);
              window.LearningEngine.renderStepNavigation();
              window.LearningEngine.renderStep(0);
              window.LearningEngine.updateNavigationButtons();
            }
          });
          function goToPreviousStep() {
            if (window.LearningEngine && window.LearningEngine.currentStepIndex > 0) {
              window.LearningEngine.goToStep(window.LearningEngine.currentStepIndex - 1);
            }
          }
          function goToNextStep() {
            if (window.LearningEngine) {
              const idx = window.LearningEngine.currentStepIndex;
              const total = window.LearningEngine.moduleSteps.length;
              if (idx === total - 1) window.LearningEngine.completeModule();
              else window.LearningEngine.goToStep(idx + 1);
            }
          }
          window.goToPreviousStep = goToPreviousStep;
          window.goToNextStep = goToNextStep;
        </script>
    </body>
    </html>
  `)
})

// 用語集ページ
app.get('/glossary', async (c) => {
  const { DB } = c.env
  const result = await DB.prepare('SELECT * FROM glossary ORDER BY term ASC').all()
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>用語集 - 中学数学基礎概念支援アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-purple-600">
                        <i class="fas fa-book mr-2"></i>
                        用語集
                    </h1>
                    <a href="/" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                        <i class="fas fa-home mr-2"></i>ホームに戻る
                    </a>
                </div>
            </div>
        </nav>

        <div class="max-w-5xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">学習した用語を確認しましょう</h2>
                
                <div class="mb-6">
                    <input type="text" id="search-input" 
                           placeholder="用語を検索..." 
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                </div>

                <div id="glossary-list" class="space-y-4">
                    ${result.results.map((term: any) => `
                      <div class="glossary-item border-2 border-gray-200 rounded-lg p-6 hover:border-blue-400 transition">
                        <h3 class="text-xl font-bold text-blue-600 mb-2">${term.term}</h3>
                        <p class="text-gray-700 mb-3">${term.definition}</p>
                        ${term.example ? `
                          <div class="bg-blue-50 p-3 rounded-lg">
                            <span class="font-semibold text-blue-800">例:</span>
                            <span class="text-gray-700">${term.example}</span>
                          </div>
                        ` : ''}
                      </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <script>
          // 検索機能
          document.getElementById('search-input').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.glossary-item');
            
            items.forEach(item => {
              const text = item.textContent.toLowerCase();
              if (text.includes(searchTerm)) {
                item.style.display = 'block';
              } else {
                item.style.display = 'none';
              }
            });
          });
        </script>
    </body>
    </html>
  `)
})

// 達成記録ページ（生徒用）
app.get('/student/achievements', async (c) => {
  const { DB } = c.env
  const userId = 'default_user'
  const result = await DB.prepare(
    'SELECT * FROM achievement_log WHERE user_id = ? ORDER BY achieved_at DESC'
  ).bind(userId).all()
  
  const totalPoints = result.results.reduce((sum: number, a: any) => sum + (a.points || 0), 0)
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>達成記録 - 中学数学基礎概念支援アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-yellow-50 to-orange-50 min-h-screen">
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-yellow-600">
                        <i class="fas fa-trophy mr-2"></i>
                        達成記録
                    </h1>
                    <a href="/" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                        <i class="fas fa-home mr-2"></i>ホームに戻る
                    </a>
                </div>
            </div>
        </nav>

        <div class="max-w-5xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div class="text-center mb-8">
                    <div class="text-6xl mb-4">🏆</div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">合計ポイント</h2>
                    <div class="text-5xl font-bold text-yellow-500">${totalPoints}</div>
                </div>

                ${result.results.length === 0 ? `
                  <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-rocket text-6xl mb-4"></i>
                    <p class="text-xl">まだ達成記録がありません</p>
                    <p class="mt-2">学習を始めて達成を積み重ねましょう！</p>
                  </div>
                ` : `
                  <div class="space-y-4">
                    ${result.results.map((achievement: any) => `
                      <div class="border-2 border-yellow-200 rounded-lg p-6 bg-gradient-to-r from-yellow-50 to-white hover:shadow-lg transition">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <h3 class="text-xl font-bold text-gray-800 mb-2">
                              <i class="fas fa-star text-yellow-500 mr-2"></i>
                              ${achievement.title}
                            </h3>
                            ${achievement.description ? `
                              <p class="text-gray-600 mb-3">${achievement.description}</p>
                            ` : ''}
                            <div class="text-sm text-gray-500">
                              ${new Date(achievement.achieved_at).toLocaleString('ja-JP')}
                            </div>
                          </div>
                          <div class="ml-4">
                            <div class="achievement-badge">
                              +${achievement.points}
                            </div>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `}
            </div>
        </div>
    </body>
    </html>
  `)
})

// アフリカ都市カードコレクションページ
app.get('/cards', async (c) => {
  const { DB } = c.env
  const userId = 'default_user'
  
  // ユーザーがアンロックしたカード
  const userCards = await DB.prepare(
    'SELECT * FROM africa_cards WHERE user_id = ? ORDER BY unlocked_at DESC'
  ).bind(userId).all()
  
  // システムカード（全カード）
  const allCards = await DB.prepare(
    'SELECT * FROM africa_cards WHERE user_id = ? ORDER BY card_id'
  ).bind('system').all()
  
  const unlockedIds = new Set(userCards.results.map((c: any) => c.card_id))
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>カードコレクション - 中学数学基礎概念支援アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-green-600">
                        <i class="fas fa-image mr-2"></i>
                        アフリカ都市カードコレクション
                    </h1>
                    <a href="/" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                        <i class="fas fa-home mr-2"></i>ホームに戻る
                    </a>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div class="text-center mb-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">
                        コレクション進捗: ${unlockedIds.size} / ${allCards.results.length}
                    </h2>
                    <div class="progress-bar max-w-md mx-auto">
                        <div class="progress-fill" style="width: ${(unlockedIds.size / allCards.results.length) * 100}%"></div>
                    </div>
                    <p class="text-gray-600 mt-4">学習を進めて、新しいカードをゲットしましょう！</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${allCards.results.map((card: any) => {
                      const isUnlocked = unlockedIds.has(card.card_id)
                      return `
                        <div class="africa-card ${!isUnlocked ? 'africa-card-locked' : ''} bg-white rounded-xl shadow-lg overflow-hidden">
                          <div class="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            ${isUnlocked ? `
                              <div class="text-6xl">🌍</div>
                            ` : `
                              <div class="text-6xl">🔒</div>
                            `}
                          </div>
                          <div class="p-6">
                            <h3 class="text-2xl font-bold text-gray-800 mb-2">
                              ${isUnlocked ? card.city_name : '???'}
                            </h3>
                            <p class="text-gray-600 mb-2">
                              <i class="fas fa-flag mr-2"></i>
                              ${isUnlocked ? card.country : '???'}
                            </p>
                            ${isUnlocked ? `
                              <p class="text-sm text-gray-600 mb-3">
                                <i class="fas fa-users mr-2"></i>
                                ${card.population}
                              </p>
                              <p class="text-gray-700">${card.description}</p>
                            ` : `
                              <p class="text-gray-500 text-sm mt-4">
                                学習を進めてアンロックしよう！
                              </p>
                            `}
                          </div>
                        </div>
                      `
                    }).join('')}
                </div>
            </div>
        </div>
    </body>
    </html>
  `)
})

// モジュール6: 公式集
app.get('/module/formulas', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>公式集 - 中学数学基礎概念支援アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-orange-600">
                        <i class="fas fa-graduation-cap mr-2"></i>数学の冒険
                    </h1>
                    <a href="/" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                        <i class="fas fa-home mr-2"></i>ホームに戻る
                    </a>
                </div>
            </div>
        </nav>
        <div class="max-w-5xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div class="flex items-center gap-4 mb-4">
                    <div class="text-6xl">📐</div>
                    <div>
                        <h2 class="text-3xl font-bold text-gray-800">公式集</h2>
                        <p class="text-gray-600 mt-2">全モジュールで学んだ公式をまとめて復習しましょう</p>
                    </div>
                </div>
                <div class="step-nav mt-8" id="step-nav"></div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8" id="content-area"></div>
            <div class="flex justify-between items-center">
                <button id="prev-btn" onclick="window.goToPreviousStep()" class="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-arrow-left mr-2"></i>前へ
                </button>
                <button id="next-btn" onclick="window.goToNextStep()" class="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    次へ<i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
            <div id="completion-banner" class="hidden fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-400 to-blue-500 text-white px-8 py-4 rounded-full shadow-2xl animate-bounce">
                <i class="fas fa-trophy mr-2"></i>
                公式集モジュールを完了しました！
            </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/module-formulas.js"></script>
        <script src="/static/learn-engine.js"></script>
        <script>
          // 公式集モジュールを初期化
          document.addEventListener('DOMContentLoaded', function() {
            console.log('=== 公式集ページ初期化 ===');
            
            if (!window.formulasSteps || window.formulasSteps.length === 0) {
              console.error('❌ 公式集ステップデータが見つかりません');
              return;
            }
            
            console.log('✅ 公式集ステップデータ取得:', window.formulasSteps.length, 'ステップ');
            
            // 学習エンジンを初期化
            if (window.LearningEngine) {
              const success = window.LearningEngine.init('formulas', window.formulasSteps);
              if (success) {
                window.LearningEngine.renderStepNavigation();
                window.LearningEngine.renderStep(0);
                window.LearningEngine.updateNavigationButtons();
                console.log('✅ 公式集モジュール初期化完了');
              }
            }
          });
          
          // グローバル関数を定義
          function goToPreviousStep() {
            if (window.LearningEngine && window.LearningEngine.currentStepIndex > 0) {
              window.LearningEngine.goToStep(window.LearningEngine.currentStepIndex - 1);
            }
          }
          
          function goToNextStep() {
            if (window.LearningEngine) {
              const currentIndex = window.LearningEngine.currentStepIndex;
              const totalSteps = window.LearningEngine.moduleSteps.length;
              if (currentIndex === totalSteps - 1) {
                window.LearningEngine.completeModule();
              } else {
                window.LearningEngine.goToStep(currentIndex + 1);
              }
            }
          }
          
          window.goToPreviousStep = goToPreviousStep;
          window.goToNextStep = goToNextStep;
        </script>
    </body>
    </html>
  `)
})

// モジュール7: 正の数・負の数
app.get('/module/integers', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>正の数・負の数 - 中学数学基礎概念支援アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-indigo-600">
                        <i class="fas fa-graduation-cap mr-2"></i>数学の冒険
                    </h1>
                    <a href="/" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                        <i class="fas fa-home mr-2"></i>ホームに戻る
                    </a>
                </div>
            </div>
        </nav>
        <div class="max-w-5xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div class="flex items-center gap-4 mb-4">
                    <div class="text-6xl">➕➖</div>
                    <div>
                        <h2 class="text-3xl font-bold text-gray-800">正の数・負の数</h2>
                        <p class="text-gray-600 mt-2">0より大きい数と小さい数を理解しましょう</p>
                    </div>
                </div>
                <div class="step-nav mt-8" id="step-nav"></div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8" id="content-area"></div>
            <div class="flex justify-between items-center">
                <button id="prev-btn" onclick="window.goToPreviousStep()" class="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-arrow-left mr-2"></i>前へ
                </button>
                <button id="next-btn" onclick="window.goToNextStep()" class="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    次へ<i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
            <div id="completion-banner" class="hidden fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-400 to-blue-500 text-white px-8 py-4 rounded-full shadow-2xl animate-bounce">
                <i class="fas fa-trophy mr-2"></i>
                正の数・負の数モジュールを完了しました！
            </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/module-integers.js"></script>
        <script src="/static/learn-engine.js"></script>
        <script>
          // 正の数・負の数モジュールを初期化
          document.addEventListener('DOMContentLoaded', function() {
            console.log('=== 正の数・負の数ページ初期化 ===');
            
            if (!window.integersSteps || window.integersSteps.length === 0) {
              console.error('❌ 正の数・負の数ステップデータが見つかりません');
              return;
            }
            
            console.log('✅ 正の数・負の数ステップデータ取得:', window.integersSteps.length, 'ステップ');
            
            // 学習エンジンを初期化
            if (window.LearningEngine) {
              const success = window.LearningEngine.init('integers', window.integersSteps);
              if (success) {
                window.LearningEngine.renderStepNavigation();
                window.LearningEngine.renderStep(0);
                window.LearningEngine.updateNavigationButtons();
                console.log('✅ 正の数・負の数モジュール初期化完了');
              }
            }
          });
          
          // グローバル関数を定義
          function goToPreviousStep() {
            if (window.LearningEngine && window.LearningEngine.currentStepIndex > 0) {
              window.LearningEngine.goToStep(window.LearningEngine.currentStepIndex - 1);
            }
          }
          
          function goToNextStep() {
            if (window.LearningEngine) {
              const currentIndex = window.LearningEngine.currentStepIndex;
              const totalSteps = window.LearningEngine.moduleSteps.length;
              if (currentIndex === totalSteps - 1) {
                window.LearningEngine.completeModule();
              } else {
                window.LearningEngine.goToStep(currentIndex + 1);
              }
            }
          }
          
          window.goToPreviousStep = goToPreviousStep;
          window.goToNextStep = goToNextStep;
        </script>
    </body>
    </html>
  `)
})

// ==================== Teacher Admin API Routes ====================

// フェーズ一覧取得
app.get('/api/teacher/phases', async (c) => {
  const { DB } = c.env
  const section_id = c.req.query('section_id')
  
  let query = 'SELECT * FROM phases'
  let params: any[] = []
  
  if (section_id) {
    query += ' WHERE section_id = ?'
    params.push(section_id)
  }
  
  query += ' ORDER BY order_index'
  const result = await DB.prepare(query).bind(...params).all()
  return c.json({ phases: result.results })
})

// フェーズ作成
app.post('/api/teacher/phases', async (c) => {
  const { DB } = c.env
  const { section_id, name, description, order_index } = await c.req.json()
  
  const result = await DB.prepare(
    'INSERT INTO phases (section_id, name, description, order_index) VALUES (?, ?, ?, ?)'
  ).bind(section_id || null, name, description || null, order_index || 0).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// モジュール一覧取得
app.get('/api/teacher/modules', async (c) => {
  const { DB } = c.env
  const phase_id = c.req.query('phase_id')
  
  let query = 'SELECT * FROM modules'
  if (phase_id) {
    query += ' WHERE phase_id = ?'
    const result = await DB.prepare(query + ' ORDER BY order_index').bind(phase_id).all()
    return c.json({ modules: result.results })
  }
  
  const result = await DB.prepare(query + ' ORDER BY order_index').all()
  return c.json({ modules: result.results })
})

// モジュール作成
app.post('/api/teacher/modules', async (c) => {
  const { DB } = c.env
  const { phase_id, name, description, icon, color, order_index } = await c.req.json()
  
  const result = await DB.prepare(
    'INSERT INTO modules (phase_id, name, description, icon, color, order_index) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(phase_id, name, description || null, icon || null, color || null, order_index || 0).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// ステップ一覧取得
app.get('/api/teacher/steps', async (c) => {
  const { DB } = c.env
  const module_id = c.req.query('module_id')
  
  if (!module_id) {
    return c.json({ error: 'module_id is required' }, 400)
  }
  
  const result = await DB.prepare(
    'SELECT * FROM steps WHERE module_id = ? ORDER BY order_index'
  ).bind(module_id).all()
  
  return c.json({ steps: result.results })
})

// ステップ作成
app.post('/api/teacher/steps', async (c) => {
  const { DB } = c.env
  const { module_id, title, description, order_index } = await c.req.json()
  
  const result = await DB.prepare(
    'INSERT INTO steps (module_id, title, description, order_index) VALUES (?, ?, ?, ?)'
  ).bind(module_id, title, description || null, order_index || 0).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// コンテンツブロック作成
app.post('/api/teacher/content-blocks', async (c) => {
  const { DB } = c.env
  const { step_id, block_type, content, order_index } = await c.req.json()
  
  const result = await DB.prepare(
    'INSERT INTO content_blocks (step_id, block_type, content, order_index) VALUES (?, ?, ?, ?)'
  ).bind(step_id, block_type, JSON.stringify(content), order_index || 0).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// 問題作成
app.post('/api/teacher/questions', async (c) => {
  const { DB } = c.env
  const { step_id, question_type, question_text, config, order_index } = await c.req.json()
  
  const result = await DB.prepare(
    'INSERT INTO questions (step_id, question_type, question_text, config, order_index) VALUES (?, ?, ?, ?, ?)'
  ).bind(step_id, question_type, question_text, JSON.stringify(config || {}), order_index || 0).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// ==================== 管理画面 UI Routes ====================

// 管理画面トップページ（/adminへのリダイレクト用）
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理画面 - 学習アプリ開発プラットフォーム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <nav class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-cogs mr-2"></i>
                        管理画面
                    </h1>
                    <div class="flex gap-4">
                        <a href="/" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                            <i class="fas fa-home mr-2"></i>ホームへ戻る
                        </a>
                        <a href="/demo" class="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-400 transition">
                            <i class="fas fa-graduation-cap mr-2"></i>デモアプリ
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-tools mr-2 text-indigo-600"></i>
                    管理ツール
                </h2>
                <p class="text-gray-600">
                    学習コンテンツを作成・管理するためのツールです。
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- ノーコードエディタ -->
                <a href="/static/nocode-editor.html" class="block p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">
                        <i class="fas fa-magic text-blue-600"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">ノーコードエディタ</h3>
                    <p class="text-gray-600 text-sm">ビジュアルエディタで簡単にコンテンツを作成</p>
                </a>

                <!-- フェーズ管理 -->
                <a href="/admin/phases" class="block p-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">
                        <i class="fas fa-layer-group text-purple-600"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">フェーズ管理</h3>
                    <p class="text-gray-600 text-sm">学習の大きな区分を作成・編集</p>
                </a>

                <!-- モジュール管理 -->
                <a href="/admin/modules" class="block p-6 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">
                        <i class="fas fa-book text-green-600"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">モジュール管理</h3>
                    <p class="text-gray-600 text-sm">学習単元を作成・編集</p>
                </a>

                <!-- ステップ管理 -->
                <a href="/admin/steps" class="block p-6 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">
                        <i class="fas fa-tasks text-yellow-600"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">ステップ管理</h3>
                    <p class="text-gray-600 text-sm">学習ステップと説明文を作成・編集</p>
                </a>

                <!-- インタラクティブ要素 -->
                <a href="/admin/interactive" class="block p-6 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">
                        <i class="fas fa-chart-line text-orange-600"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">インタラクティブ要素</h3>
                    <p class="text-gray-600 text-sm">図形、グラフ、表などの作成・編集</p>
                </a>

                <!-- 問題管理 -->
                <a href="/admin/questions" class="block p-6 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">
                        <i class="fas fa-question-circle text-red-600"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">問題管理</h3>
                    <p class="text-gray-600 text-sm">問題と解答を作成・編集</p>
                </a>
            </div>
        </div>
    </body>
    </html>
  `)
})

// フェーズ管理画面
app.get('/admin/phases', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>フェーズ管理 - 学習アプリ開発プラットフォーム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <nav class="bg-indigo-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-layer-group mr-2"></i>
                        フェーズ管理
                    </h1>
                    <a href="/admin" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                        <i class="fas fa-arrow-left mr-2"></i>管理画面へ戻る
                    </a>
                </div>
            </div>
        </nav>

        <div class="max-w-5xl mx-auto px-4 py-8">
            <!-- 新規作成フォーム -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-plus-circle mr-2 text-blue-500"></i>
                    新しいフェーズを作成
                </h2>
                <form id="create-phase-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">フェーズ名</label>
                        <input type="text" name="name" required 
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               placeholder="例：基礎概念の理解">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">説明</label>
                        <textarea name="description" rows="3" 
                                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="このフェーズの目的や内容を説明"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">表示順序</label>
                        <input type="number" name="order_index" value="0" min="0"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <button type="submit" class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-plus mr-2"></i>フェーズを作成
                    </button>
                </form>
            </div>

            <!-- フェーズ一覧 -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-list mr-2 text-green-500"></i>
                    登録されているフェーズ
                </h2>
                <div id="phases-list" class="space-y-4">
                    <p class="text-gray-500 text-center py-8">読み込み中...</p>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // フェーズ一覧を読み込み
          async function loadPhases() {
            try {
              const response = await axios.get('/api/admin/phases');
              const phases = response.data.phases;
              
              const listEl = document.getElementById('phases-list');
              
              if (phases.length === 0) {
                listEl.innerHTML = '<p class="text-gray-500 text-center py-8">まだフェーズが登録されていません</p>';
                return;
              }
              
              listEl.innerHTML = phases.map(phase => \`
                <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h3 class="text-lg font-bold text-gray-800">\${phase.name}</h3>
                      <p class="text-gray-600 mt-1">\${phase.description || '説明なし'}</p>
                      <p class="text-sm text-gray-400 mt-2">表示順序: \${phase.order_index}</p>
                    </div>
                    <div class="flex gap-2">
                      <a href="/admin/modules?phase_id=\${phase.id}" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                        <i class="fas fa-book mr-1"></i>モジュール管理
                      </a>
                    </div>
                  </div>
                </div>
              \`).join('');
            } catch (error) {
              console.error('フェーズの読み込みエラー:', error);
              document.getElementById('phases-list').innerHTML = '<p class="text-red-500 text-center py-8">エラーが発生しました</p>';
            }
          }
          
          // フェーズ作成
          document.getElementById('create-phase-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
              name: formData.get('name'),
              description: formData.get('description'),
              order_index: parseInt(formData.get('order_index'))
            };
            
            try {
              await axios.post('/api/admin/phases', data);
              alert('フェーズを作成しました！');
              e.target.reset();
              loadPhases();
            } catch (error) {
              console.error('フェーズ作成エラー:', error);
              alert('エラーが発生しました');
            }
          });
          
          // ページ読み込み時にフェーズ一覧を取得
          loadPhases();
        </script>
    </body>
    </html>
  `)
})

// モジュール管理画面
app.get('/admin/modules', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>モジュール管理 - 学習アプリ開発プラットフォーム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <nav class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-book mr-2"></i>
                        モジュール管理
                    </h1>
                    <div class="flex gap-4">
                        <a href="/admin" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                            <i class="fas fa-arrow-left mr-2"></i>管理画面へ戻る
                        </a>
                        <a href="/" class="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-400 transition">
                            <i class="fas fa-home mr-2"></i>ホーム
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- フェーズ選択 -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-layer-group mr-2 text-purple-500"></i>
                    フェーズを選択
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">フェーズ</label>
                        <select id="phase-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">フェーズを選択...</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- 新規作成フォーム -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-plus-circle mr-2 text-green-500"></i>
                    新しいモジュールを作成
                </h2>
                <form id="create-module-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">モジュール名 *</label>
                            <input type="text" name="name" required 
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="例：グラフの読解">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">アイコン（絵文字）</label>
                            <input type="text" name="icon" 
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="例：📊">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">説明</label>
                        <textarea name="description" rows="2" 
                                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder="このモジュールで学ぶ内容"></textarea>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">カラー</label>
                            <select name="color" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <option value="blue">青</option>
                                <option value="green">緑</option>
                                <option value="yellow">黄</option>
                                <option value="purple">紫</option>
                                <option value="pink">ピンク</option>
                                <option value="orange">オレンジ</option>
                                <option value="red">赤</option>
                                <option value="indigo">インディゴ</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">表示順序</label>
                            <input type="number" name="order_index" value="0" min="0"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    <button type="submit" class="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                        <i class="fas fa-plus mr-2"></i>モジュールを作成
                    </button>
                </form>
            </div>

            <!-- モジュール一覧 -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-list mr-2 text-blue-500"></i>
                    登録されているモジュール
                </h2>
                <div id="modules-list" class="space-y-4">
                    <p class="text-gray-500 text-center py-8">まずフェーズを選択してください</p>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // フェーズ一覧を読み込み
          async function loadPhases() {
            try {
              const response = await axios.get('/api/admin/phases');
              const phases = response.data.phases;
              
              const selectEl = document.getElementById('phase-select');
              selectEl.innerHTML = '<option value="">フェーズを選択...</option>' +
                phases.map(phase => \`<option value="\${phase.id}">\${phase.name}</option>\`).join('');
              
              // フェーズが選択されたらモジュール一覧を表示
              selectEl.addEventListener('change', (e) => {
                const phaseId = e.target.value;
                if (phaseId) {
                  loadModules(phaseId);
                } else {
                  document.getElementById('modules-list').innerHTML = '<p class="text-gray-500 text-center py-8">まずフェーズを選択してください</p>';
                }
              });
            } catch (error) {
              console.error('フェーズの読み込みエラー:', error);
              alert('フェーズの読み込みに失敗しました');
            }
          }
          
          // モジュール一覧を読み込み
          async function loadModules(phaseId) {
            try {
              const response = await axios.get('/api/admin/modules?phase_id=' + phaseId);
              const modules = response.data.modules;
              
              const listEl = document.getElementById('modules-list');
              
              if (modules.length === 0) {
                listEl.innerHTML = '<p class="text-gray-500 text-center py-8">このフェーズにはまだモジュールが登録されていません</p>';
                return;
              }
              
              listEl.innerHTML = modules.map(module => \`
                <div class="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-400 transition">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <span class="text-3xl">\${module.icon || '📚'}</span>
                        <h3 class="text-xl font-bold text-gray-800">\${module.name}</h3>
                        <span class="px-3 py-1 bg-\${module.color || 'blue'}-100 text-\${module.color || 'blue'}-700 rounded-full text-sm">
                          \${module.color || 'blue'}
                        </span>
                      </div>
                      <p class="text-gray-600 mb-3">\${module.description || '説明なし'}</p>
                      <p class="text-sm text-gray-400">表示順序: \${module.order_index} | ID: \${module.id}</p>
                    </div>
                    <div class="flex gap-2 ml-4">
                      <button onclick="editModule(\${module.id})" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                        <i class="fas fa-edit mr-1"></i>編集
                      </button>
                      <button onclick="deleteModule(\${module.id})" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                        <i class="fas fa-trash mr-1"></i>削除
                      </button>
                      <a href="/admin/steps?module_id=\${module.id}" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                        <i class="fas fa-tasks mr-1"></i>ステップ管理
                      </a>
                    </div>
                  </div>
                </div>
              \`).join('');
            } catch (error) {
              console.error('モジュールの読み込みエラー:', error);
              document.getElementById('modules-list').innerHTML = '<p class="text-red-500 text-center py-8">エラーが発生しました</p>';
            }
          }
          
          // モジュール作成
          document.getElementById('create-module-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const phaseId = document.getElementById('phase-select').value;
            if (!phaseId) {
              alert('まずフェーズを選択してください');
              return;
            }
            
            const formData = new FormData(e.target);
            const data = {
              phase_id: parseInt(phaseId),
              name: formData.get('name'),
              description: formData.get('description'),
              icon: formData.get('icon'),
              color: formData.get('color'),
              order_index: parseInt(formData.get('order_index'))
            };
            
            try {
              await axios.post('/api/admin/modules', data);
              alert('モジュールを作成しました！');
              e.target.reset();
              loadModules(phaseId);
            } catch (error) {
              console.error('モジュール作成エラー:', error);
              alert('エラーが発生しました');
            }
          });
          
          // モジュール編集（簡易版）
          function editModule(id) {
            alert('編集機能は今後実装予定です（ID: ' + id + '）');
          }
          
          // モジュール削除
          async function deleteModule(id) {
            if (!confirm('本当にこのモジュールを削除しますか？')) {
              return;
            }
            // TODO: 削除APIを実装
            alert('削除機能は今後実装予定です（ID: ' + id + '）');
          }
          
          // ページ読み込み時にフェーズ一覧を取得
          loadPhases();
        </script>
    </body>
    </html>
  `)
})

// ステップ管理画面
app.get('/admin/steps', (c) => {
  const moduleId = c.req.query('module_id') || '';
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ステップ管理 - 学習アプリ開発プラットフォーム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <nav class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-tasks mr-2"></i>
                        ステップ管理
                    </h1>
                    <div class="flex gap-4">
                        <a href="/admin/modules" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                            <i class="fas fa-arrow-left mr-2"></i>モジュール管理へ
                        </a>
                        <a href="/admin" class="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-400 transition">
                            <i class="fas fa-home mr-2"></i>管理画面
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- モジュール選択 -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-book mr-2 text-purple-500"></i>
                    モジュールを選択
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">フェーズ</label>
                        <select id="phase-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">フェーズを選択...</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">モジュール</label>
                        <select id="module-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">モジュールを選択...</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- 新規作成フォーム -->
            <div id="create-step-section" class="hidden">
                <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-plus-circle mr-2 text-green-500"></i>
                        新しいステップを作成
                    </h2>
                    <form id="create-step-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">ステップタイトル *</label>
                            <input type="text" name="title" required 
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="例：グラフの種類を知ろう">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">説明文</label>
                            <textarea name="description" rows="4" 
                                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                      placeholder="このステップで学ぶ内容を説明してください"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">表示順序</label>
                            <input type="number" name="order_index" value="0" min="0"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <button type="submit" class="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            <i class="fas fa-plus mr-2"></i>ステップを作成
                        </button>
                    </form>
                </div>
            </div>

            <!-- ステップ一覧 -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-list mr-2 text-blue-500"></i>
                    登録されているステップ
                </h2>
                <div id="steps-list" class="space-y-4">
                    <p class="text-gray-500 text-center py-8">まずモジュールを選択してください</p>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          const urlParams = new URLSearchParams(window.location.search);
          const initialModuleId = urlParams.get('module_id');
          
          // フェーズ一覧を読み込み
          async function loadPhases() {
            try {
              const response = await axios.get('/api/admin/phases');
              const phases = response.data.phases;
              
              const selectEl = document.getElementById('phase-select');
              selectEl.innerHTML = '<option value="">フェーズを選択...</option>' +
                phases.map(phase => \`<option value="\${phase.id}">\${phase.name}</option>\`).join('');
              
              selectEl.addEventListener('change', (e) => {
                const phaseId = e.target.value;
                if (phaseId) {
                  loadModules(phaseId);
                } else {
                  document.getElementById('module-select').innerHTML = '<option value="">モジュールを選択...</option>';
                  document.getElementById('steps-list').innerHTML = '<p class="text-gray-500 text-center py-8">まずモジュールを選択してください</p>';
                  document.getElementById('create-step-section').classList.add('hidden');
                }
              });
              
              // 初期モジュールIDが指定されている場合
              if (initialModuleId) {
                // TODO: フェーズを自動選択してモジュール一覧を読み込む
              }
            } catch (error) {
              console.error('フェーズの読み込みエラー:', error);
            }
          }
          
          // モジュール一覧を読み込み
          async function loadModules(phaseId) {
            try {
              const response = await axios.get('/api/admin/modules?phase_id=' + phaseId);
              const modules = response.data.modules;
              
              const selectEl = document.getElementById('module-select');
              selectEl.innerHTML = '<option value="">モジュールを選択...</option>' +
                modules.map(module => \`<option value="\${module.id}">\${module.name}</option>\`).join('');
              
              selectEl.addEventListener('change', (e) => {
                const moduleId = e.target.value;
                if (moduleId) {
                  loadSteps(moduleId);
                  document.getElementById('create-step-section').classList.remove('hidden');
                } else {
                  document.getElementById('steps-list').innerHTML = '<p class="text-gray-500 text-center py-8">まずモジュールを選択してください</p>';
                  document.getElementById('create-step-section').classList.add('hidden');
                }
              });
              
              // 初期モジュールIDが指定されている場合
              if (initialModuleId && modules.find(m => m.id == initialModuleId)) {
                selectEl.value = initialModuleId;
                loadSteps(initialModuleId);
                document.getElementById('create-step-section').classList.remove('hidden');
              }
            } catch (error) {
              console.error('モジュールの読み込みエラー:', error);
            }
          }
          
          // ステップ一覧を読み込み
          async function loadSteps(moduleId) {
            try {
              const response = await axios.get('/api/admin/steps?module_id=' + moduleId);
              const steps = response.data.steps;
              
              const listEl = document.getElementById('steps-list');
              
              if (steps.length === 0) {
                listEl.innerHTML = '<p class="text-gray-500 text-center py-8">このモジュールにはまだステップが登録されていません</p>';
                return;
              }
              
              listEl.innerHTML = steps.map((step, index) => \`
                <div class="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-400 transition">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <span class="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full font-bold">
                          \${index + 1}
                        </span>
                        <h3 class="text-xl font-bold text-gray-800">\${step.title}</h3>
                      </div>
                      <p class="text-gray-600 mb-3">\${step.description || '説明なし'}</p>
                      <p class="text-sm text-gray-400">表示順序: \${step.order_index} | ID: \${step.id}</p>
                    </div>
                    <div class="flex gap-2 ml-4">
                      <button onclick="editStep(\${step.id})" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                        <i class="fas fa-edit mr-1"></i>編集
                      </button>
                      <button onclick="deleteStep(\${step.id})" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                        <i class="fas fa-trash mr-1"></i>削除
                      </button>
                    </div>
                  </div>
                </div>
              \`).join('');
            } catch (error) {
              console.error('ステップの読み込みエラー:', error);
              document.getElementById('steps-list').innerHTML = '<p class="text-red-500 text-center py-8">エラーが発生しました</p>';
            }
          }
          
          // ステップ作成
          document.getElementById('create-step-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const moduleId = document.getElementById('module-select').value;
            if (!moduleId) {
              alert('まずモジュールを選択してください');
              return;
            }
            
            const formData = new FormData(e.target);
            const data = {
              module_id: parseInt(moduleId),
              title: formData.get('title'),
              description: formData.get('description'),
              order_index: parseInt(formData.get('order_index'))
            };
            
            try {
              await axios.post('/api/admin/steps', data);
              alert('ステップを作成しました！');
              e.target.reset();
              loadSteps(moduleId);
            } catch (error) {
              console.error('ステップ作成エラー:', error);
              alert('エラーが発生しました');
            }
          });
          
          // ステップ編集
          function editStep(id) {
            alert('編集機能は今後実装予定です（ID: ' + id + '）');
          }
          
          // ステップ削除
          function deleteStep(id) {
            if (!confirm('本当にこのステップを削除しますか？')) {
              return;
            }
            alert('削除機能は今後実装予定です（ID: ' + id + '）');
          }
          
          // ページ読み込み時にフェーズ一覧を取得
          loadPhases();
        </script>
    </body>
    </html>
  `)
})

export default app
