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

// ==================== API Routes ====================

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

// メインページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>中学数学基礎概念支援アプリ</title>
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
                    <div class="flex gap-4">
                        <a href="/" class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
                            <i class="fas fa-home mr-2"></i>ホーム
                        </a>
                        <a href="/glossary" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                            <i class="fas fa-book mr-2"></i>用語集
                        </a>
                        <a href="/cards" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                            <i class="fas fa-image mr-2"></i>カードコレクション
                        </a>
                        <a href="/achievements" class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
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
                            8つのステップ →
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
                            準備中
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
                            準備中
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
                            準備中
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
                            準備中
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
        <script src="/static/app.js?v=2"></script>
        <script src="/static/graph-module.js?v=2"></script>
        <script src="/static/graph-learn.js?v=2"></script>
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

// 達成記録ページ
app.get('/achievements', async (c) => {
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

export default app
