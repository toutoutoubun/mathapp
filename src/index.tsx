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

// フェーズごとの進捗取得
app.get('/api/student/phase-progress', async (c) => {
  const { DB } = c.env
  const userId = 'default_user' // TODO: 認証実装後に動的にする

  // 1. フェーズごとの総ステップ数を取得
  // sections -> phases -> modules -> steps の階層を結合
  const phasesResult = await DB.prepare(`
    SELECT 
      p.id as phase_id, 
      p.name as phase_name, 
      p.section_id,
      s.name as section_name,
      COUNT(st.id) as total_steps
    FROM phases p
    JOIN sections s ON p.section_id = s.id
    LEFT JOIN modules m ON p.id = m.phase_id
    LEFT JOIN steps st ON m.id = st.module_id
    GROUP BY p.id
  `).all();

  // 2. フェーズごとの完了ステップ数を取得
  // user_progress -> steps -> modules の階層から集計
  const progressResult = await DB.prepare(`
    SELECT 
      m.phase_id, 
      COUNT(up.step_id) as completed_steps
    FROM user_progress up
    JOIN steps st ON up.step_id = st.id
    JOIN modules m ON st.module_id = m.id
    WHERE up.user_id = ? AND up.status = 'completed'
    GROUP BY m.phase_id
  `).bind(userId).all();

  // 3. データをマージして進捗率を計算
  const progressMap = new Map();
  progressResult.results.forEach((r: any) => {
    progressMap.set(r.phase_id, r.completed_steps);
  });

  const phaseProgress = phasesResult.results.map((p: any) => {
    const completed = progressMap.get(p.phase_id) || 0;
    const total = p.total_steps || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      phase_id: p.phase_id,
      phase_name: p.phase_name,
      section_id: p.section_id,
      section_name: p.section_name,
      total_steps: total,
      completed_steps: completed,
      percentage: percentage
    };
  });

  return c.json({ progress: phaseProgress })
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
                    作成されたコンテンツがここに表示されます。
                </p>
                
                <div id="modules-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Dynamic Content Will Be Loaded Here -->
                    <div class="text-center col-span-full py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
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
        <script>
            document.addEventListener('DOMContentLoaded', async () => {
                const container = document.getElementById('modules-grid');
                const progressContainer = document.getElementById('progress-container');
                const sectionSelect = document.getElementById('section-select');
                
                // データ保持用
                let allPhaseProgress = [];

                try {
                    // 1. セクション一覧取得 & プルダウン設定
                    const sectionsRes = await axios.get('/api/teacher/sections');
                    const sections = sectionsRes.data.sections;
                    
                    if (sectionSelect) {
                        sectionSelect.innerHTML = '<option value="">すべての学年</option>' + 
                            sections.map(s => \`<option value="\${s.id}">\${s.name}</option>\`).join('');
                        
                        // フィルタリングイベント
                        sectionSelect.addEventListener('change', (e) => {
                            const selectedId = e.target.value;
                            
                            // コンテンツカードのフィルタリング
                            const cards = document.querySelectorAll('.module-card');
                            let hasVisible = false;
                            cards.forEach(card => {
                                if (!selectedId || card.dataset.sectionId === selectedId) {
                                    card.style.display = 'block';
                                    hasVisible = true;
                                } else {
                                    card.style.display = 'none';
                                }
                            });
                            
                            // メッセージ表示切替
                            const emptyMsg = document.getElementById('empty-message');
                            if (emptyMsg) emptyMsg.style.display = hasVisible ? 'none' : 'block';

                            // 進捗バーのフィルタリング
                            renderProgress(selectedId);
                        });
                    }
                    
                    // 2. コンテンツ一覧表示
                    let hasContent = false;
                    const cardsHtml = [];

                    for (const section of sections) {
                        const phasesRes = await axios.get('/api/teacher/phases?section_id=' + section.id);
                        const phases = phasesRes.data.phases;

                        for (const phase of phases) {
                            const modulesRes = await axios.get('/api/teacher/modules?phase_id=' + phase.id);
                            const modules = modulesRes.data.modules;

                            modules.forEach(module => {
                                hasContent = true;
                                const colorClass = module.color ? \`from-\${module.color}-100 to-\${module.color}-200\` : 'from-indigo-100 to-purple-200';
                                
                                cardsHtml.push(\`
                                    <a href="/student/modules/\${module.id}" 
                                       class="module-card block p-6 bg-gradient-to-br \${colorClass} rounded-lg hover:shadow-xl transition transform hover:-translate-y-1"
                                       data-section-id="\${section.id}">
                                        <div class="text-4xl mb-4">\${module.icon || '📝'}</div>
                                        <h4 class="text-xl font-bold text-gray-800 mb-2">\${module.name}</h4>
                                        <p class="text-gray-600 text-xs font-bold uppercase tracking-wide opacity-70 mb-2">
                                            \${section.name} &gt; \${phase.name}
                                        </p>
                                        <p class="text-gray-600 text-sm line-clamp-2">
                                            \${module.description || '説明なし'}
                                        </p>
                                        <div class="mt-4 text-sm font-semibold opacity-80">
                                            学習を始める →
                                        </div>
                                    </a>
                                \`);
                            });
                        }
                    }
                    
                    if (!hasContent) {
                        container.innerHTML = \`
                            <div class="col-span-full text-center py-12 bg-gray-50 rounded-xl">
                                <p class="text-gray-500">まだコンテンツが公開されていません。</p>
                                <a href="/student/demo" class="text-indigo-500 hover:underline mt-2 inline-block">デモコンテンツを見る</a>
                            </div>
                        \`;
                    } else {
                        container.innerHTML = cardsHtml.join('') + \`
                            <div id="empty-message" class="col-span-full text-center py-12 bg-gray-50 rounded-xl" style="display: none;">
                                <p class="text-gray-500">この学年にはコンテンツがありません。</p>
                            </div>
                        \`;
                    }

                    // 3. 進捗状況の取得と表示
                    const progressRes = await axios.get('/api/student/phase-progress');
                    allPhaseProgress = progressRes.data.progress;
                    renderProgress();

                } catch (e) {
                    console.error(e);
                    container.innerHTML = '<p class="text-red-500 col-span-full text-center">コンテンツの読み込みに失敗しました。</p>';
                }

                // 進捗バー描画関数
                function renderProgress(filterSectionId = '') {
                    if (!progressContainer) return;
                    
                    // フィルタリング
                    const displayProgress = filterSectionId 
                        ? allPhaseProgress.filter(p => p.section_id == filterSectionId)
                        : allPhaseProgress;

                    if (displayProgress.length === 0) {
                        progressContainer.innerHTML = '<p class="text-gray-500">表示する進捗データがありません。</p>';
                        return;
                    }

                    // 進捗があるフェーズのみ表示、または全フェーズ表示？
                    // ここでは全フェーズ表示し、進捗0%でも表示する
                    progressContainer.innerHTML = displayProgress.map(p => \`
                        <div class="mb-4">
                            <div class="flex justify-between mb-1">
                                <span class="text-sm font-medium text-gray-700">
                                    <span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded mr-2">\${p.section_name}</span>
                                    \${p.phase_name}
                                </span>
                                <span class="text-sm font-medium text-blue-700">\${p.percentage}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5">
                                <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style="width: \${p.percentage}%"></div>
                            </div>
                            <div class="text-right text-xs text-gray-400 mt-1">
                                \${p.completed_steps} / \${p.total_steps} ステップ完了
                            </div>
                        </div>
                    \`).join('');
                }
            });
        </script>
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

// 生徒用汎用モジュールビューアー
app.get('/student/modules/:id', async (c) => {
  const moduleId = c.req.param('id');
  const { DB } = c.env;
  
  const module = await DB.prepare('SELECT * FROM modules WHERE id = ?').bind(moduleId).first();
  
  if (!module) {
    return c.text('Module not found', 404);
  }

  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${module.name} - 学習アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://unpkg.com/function-plot/dist/function-plot.js"></script>
        <script>
          window.MathJax = {
            tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']] }
          };
        </script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <style>
            .content-block { margin-bottom: 2rem; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-indigo-600">
                        <i class="fas fa-graduation-cap mr-2"></i>
                        ${module.name}
                    </h1>
                    <a href="/student" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                        <i class="fas fa-home mr-2"></i>ホームに戻る
                    </a>
                </div>
            </div>
        </nav>

        <div class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow p-4 mb-6 overflow-x-auto">
                <div class="flex space-x-2" id="step-nav"></div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-8 mb-8 min-h-[400px]" id="content-area">
                <div class="text-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p class="mt-4 text-gray-500">読み込み中...</p>
                </div>
            </div>

            <div class="flex justify-between">
                <button id="prev-btn" class="px-6 py-3 bg-gray-300 text-gray-600 rounded-lg disabled:opacity-50" disabled>
                    <i class="fas fa-arrow-left mr-2"></i>前へ
                </button>
                <button id="next-btn" class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    次へ<i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            const MODULE_ID = ${moduleId};
            let steps = [];
            let currentStepIndex = 0;

            document.addEventListener('DOMContentLoaded', async () => {
                await loadSteps();
            });

            async function loadSteps() {
                try {
                    const res = await axios.get('/api/teacher/steps?module_id=' + MODULE_ID);
                    steps = res.data.steps;
                    
                    if (steps.length === 0) {
                        document.getElementById('content-area').innerHTML = '<p class="text-center text-gray-500">このモジュールにはまだステップがありません。</p>';
                        return;
                    }

                    renderStepNav();
                    loadStepContent(0);
                } catch (e) {
                    console.error(e);
                    alert('データの読み込みに失敗しました');
                }
            }

            function renderStepNav() {
                const nav = document.getElementById('step-nav');
                nav.innerHTML = steps.map((step, index) => \`
                    <button onclick="loadStepContent(\${index})" 
                            class="step-btn px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition \${index === currentStepIndex ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
                            data-index="\${index}">
                        \${index + 1}. \${step.title}
                    </button>
                \`).join('');
            }

            async function loadStepContent(index) {
                currentStepIndex = index;
                const step = steps[index];
                
                document.querySelectorAll('.step-btn').forEach(btn => {
                    if (parseInt(btn.dataset.index) === index) {
                        btn.className = 'step-btn px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition bg-indigo-600 text-white';
                    } else {
                        btn.className = 'step-btn px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition bg-gray-100 text-gray-600 hover:bg-gray-200';
                    }
                });

                document.getElementById('prev-btn').disabled = index === 0;
                document.getElementById('next-btn').innerHTML = index === steps.length - 1 ? '完了 <i class="fas fa-check ml-2"></i>' : '次へ <i class="fas fa-arrow-right ml-2"></i>';
                
                document.getElementById('prev-btn').onclick = () => loadStepContent(index - 1);
                document.getElementById('next-btn').onclick = () => {
                    if (index < steps.length - 1) loadStepContent(index + 1);
                    else alert('モジュール完了！'); 
                };

                const contentArea = document.getElementById('content-area');
                contentArea.innerHTML = '<div class="text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div></div>';

                try {
                    const [blocksRes, questionsRes] = await Promise.all([
                        axios.get('/api/teacher/content-blocks?step_id=' + step.id),
                        axios.get('/api/teacher/questions?step_id=' + step.id)
                    ]);

                    renderContent(step, blocksRes.data.blocks, questionsRes.data.questions);
                } catch (e) {
                    contentArea.innerHTML = '<p class="text-red-500">コンテンツの読み込みに失敗しました。</p>';
                }
            }

            function renderContent(step, blocks, questions) {
                const container = document.getElementById('content-area');
                let html = \`
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">\${step.title}</h2>
                    <p class="text-gray-600 mb-8">\${step.description || ''}</p>
                    <div class="space-y-8">
                \`;

                blocks.forEach((b, idx) => {
                    const blockId = 'graph-' + b.id;
                    const chartId = 'chart-' + b.id;
                    if(b.block_type === 'text') {
                        html += \`<div class="prose max-w-none">\${marked.parse(b.content.text || '')}</div>\`;
                    } else if(b.block_type === 'image') {
                        html += \`<img src="\${b.content.url}" class="rounded-xl shadow-lg mx-auto max-h-96">\`;
                    } else if(b.block_type === 'youtube') {
                        html += \`<div class="aspect-video rounded-xl overflow-hidden shadow-lg"><iframe class="w-full h-full" src="https://www.youtube.com/embed/\${b.content.videoId}" frameborder="0" allowfullscreen></iframe></div>\`;
                    } else if(b.block_type === 'shape') {
                        html += \`<div class="flex justify-center">\${renderShape(b.content)}</div>\`;
                    } else if(b.block_type === 'graph') {
                        html += \`<div id="\${blockId}" class="flex justify-center bg-white rounded-xl border p-4"></div>\`;
                    } else if(b.block_type === 'chart') {
                        html += \`<div class="flex justify-center bg-white rounded-xl border p-4 h-64"><canvas id="\${chartId}"></canvas></div>\`;
                    }
                });

                questions.forEach(q => {
                    html += \`
                        <div class="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                            <div class="flex items-center gap-2 mb-4">
                                <span class="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">問題</span>
                                <h3 class="font-bold text-indigo-900">\${q.question_text}</h3>
                            </div>
                    \`;

                    if (q.question_type === 'multiple_choice') {
                        html += '<div class="space-y-2">';
                        q.options.forEach(opt => {
                            html += \`
                                <button onclick="checkAnswer(this, \${opt.is_correct})" class="w-full p-4 text-left bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition shadow-sm">
                                    \${opt.option_text}
                                </button>
                            \`;
                        });
                        html += '</div>';
                    } else if (q.question_type === 'short_answer') {
                        const correct = q.options.find(o => o.is_correct)?.option_text || '';
                        html += \`
                            <div class="flex gap-2">
                                <input type="text" id="input-\${q.id}" class="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="回答を入力">
                                <button onclick="checkShortAnswer('input-\${q.id}', '\${correct}')" class="bg-indigo-600 text-white px-6 rounded-lg font-bold hover:bg-indigo-700">回答</button>
                            </div>
                        \`;
                    }

                    html += '</div>';
                });

                html += '</div>';
                container.innerHTML = html;

                setTimeout(() => {
                    blocks.forEach(b => {
                        if(b.block_type === 'graph') {
                            const data = [{ fn: b.content.fn, color: '#4f46e5' }];
                            if (b.content.points) {
                                b.content.points.forEach(p => {
                                    data.push({
                                        points: [[parseFloat(p.x), parseFloat(p.y)]],
                                        fnType: 'points',
                                        graphType: 'scatter',
                                        color: p.color || 'red',
                                        attr: { r: 4 }
                                    });
                                });
                            }
                            if (b.content.segments) {
                                b.content.segments.forEach(s => {
                                    data.push({
                                        points: [
                                            [parseFloat(s.x1), parseFloat(s.y1)],
                                            [parseFloat(s.x2), parseFloat(s.y2)]
                                        ],
                                        fnType: 'points',
                                        graphType: 'polyline',
                                        color: s.color || 'green'
                                    });
                                });
                            }

                            try {
                                functionPlot({
                                    target: '#graph-' + b.id,
                                    width: 600,
                                    height: 400,
                                    grid: b.content.grid,
                                    xAxis: { domain: [parseFloat(b.content.xMin), parseFloat(b.content.xMax)] },
                                    yAxis: { domain: [parseFloat(b.content.yMin), parseFloat(b.content.yMax)] },
                                    data: data
                                });
                            } catch(e) { console.error(e); }
                        }
                        if(b.block_type === 'chart') {
                            try {
                                const ctx = document.getElementById('chart-' + b.id);
                                if (ctx) {
                                    new Chart(ctx, {
                                        type: b.content.chartType,
                                        data: {
                                            labels: (b.content.labels || '').split(','),
                                            datasets: [{
                                                label: b.content.title || 'データ',
                                                data: (b.content.data || '').split(',').map(Number),
                                                backgroundColor: b.content.color || '#3b82f6',
                                                borderColor: b.content.color || '#3b82f6'
                                            }]
                                        },
                                        options: { responsive: true, maintainAspectRatio: false }
                                    });
                                }
                            } catch(e) { console.error(e); }
                        }
                    });
                }, 300);

                if(window.MathJax) MathJax.typesetPromise([container]);
            }

            function renderShape(content) {
                let shapes = content.shapes || [];
                // 互換性: 古い形式の場合
                if (!content.shapes && content.shapeType) {
                    shapes = [{
                        type: content.shapeType,
                        color: content.color,
                        size: content.size,
                        x: 100, y: 100
                    }];
                }

                let svgContent = '';
                shapes.forEach(shape => {
                    const type = shape.type || 'rect';
                    const color = shape.color || '#3b82f6';
                    const size = parseInt(shape.size || 50);
                    const x = parseInt(shape.x || 100);
                    const y = parseInt(shape.y || 100);
                    const r = size / 2;
                    
                    if (type === 'rect') {
                        svgContent += \`<rect x="\${x-r}" y="\${y-r}" width="\${size}" height="\${size}" fill="\${color}" fill-opacity="0.9" />\`;
                    } else if (type === 'circle') {
                        svgContent += \`<circle cx="\${x}" cy="\${y}" r="\${r}" fill="\${color}" fill-opacity="0.9" />\`;
                    } else if (type === 'triangle') {
                        const h = size * Math.sqrt(3) / 2;
                        svgContent += \`<polygon points="\${x},\${y-h/2} \${x-r},\${y+h/2} \${x+r},\${y+h/2}" fill="\${color}" fill-opacity="0.9" />\`;
                    } else if (type === 'star') {
                        const points = [];
                        for (let i = 0; i < 10; i++) {
                            const angle = i * 36 * Math.PI / 180;
                            const radius = i % 2 === 0 ? r : r / 2;
                            points.push(\`\${x + radius * Math.sin(angle)},\${y - radius * Math.cos(angle)}\`);
                        }
                        svgContent += \`<polygon points="\${points.join(' ')}" fill="\${color}" fill-opacity="0.9" />\`;
                    } else if (type === 'pentagon') {
                        const points = [];
                        for (let i = 0; i < 5; i++) {
                            const angle = (i * 72 - 90) * Math.PI / 180;
                            points.push(\`\${x + r * Math.cos(angle)},\${y + r * Math.sin(angle)}\`);
                        }
                        svgContent += \`<polygon points="\${points.join(' ')}" fill="\${color}" fill-opacity="0.9" />\`;
                    } else if (type === 'arrow_right') {
                        const w = size;
                        const h = size / 2;
                        svgContent += \`<polygon points="\${x-w/2},\${y-h/4} \${x},\${y-h/4} \${x},\${y-h/2} \${x+w/2},\${y} \${x},\${y+h/2} \${x},\${y+h/4} \${x-w/2},\${y+h/4}" fill="\${color}" fill-opacity="0.9" />\`;
                    }
                });
                
                return \`<svg width="200" height="200" viewBox="0 0 200 200">\${svgContent}</svg>\`;
            }

            window.checkAnswer = function(btn, isCorrect) {
                if (isCorrect) {
                    btn.classList.remove('bg-white', 'hover:bg-indigo-50');
                    btn.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
                    btn.innerHTML += '<i class="fas fa-check float-right text-green-600"></i>';
                } else {
                    btn.classList.remove('bg-white', 'hover:bg-indigo-50');
                    btn.classList.add('bg-red-100', 'border-red-500', 'text-red-800');
                    btn.innerHTML += '<i class="fas fa-times float-right text-red-600"></i>';
                }
            };

            window.checkShortAnswer = function(inputId, correct) {
                const input = document.getElementById(inputId);
                const val = input.value.trim();
                if (val === correct) {
                    input.classList.add('border-green-500', 'bg-green-50');
                    alert('正解！');
                } else {
                    input.classList.add('border-red-500', 'bg-red-50');
                    alert('不正解...');
                }
            };
        </script>
    </body>
    </html>
  `);
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

// ステップ更新
app.put('/api/teacher/steps/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const { title, description, order_index } = await c.req.json()
  
  await DB.prepare(
    'UPDATE steps SET title = ?, description = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(title, description || null, order_index || 0, id).run()
  
  return c.json({ success: true })
})

// ステップ削除
app.delete('/api/teacher/steps/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare('DELETE FROM steps WHERE id = ?').bind(id).run()
  
  return c.json({ success: true })
})

// ステップ詳細取得（階層情報付き）
app.get('/api/teacher/steps/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const step = await DB.prepare(`
    SELECT s.*, m.id as module_id, m.phase_id, p.section_id
    FROM steps s
    JOIN modules m ON s.module_id = m.id
    JOIN phases p ON m.phase_id = p.id
    WHERE s.id = ?
  `).bind(id).first()
  
  if (!step) return c.json({ error: 'Step not found' }, 404)
  
  return c.json({ step })
})

// コンテンツブロック作成
app.post('/api/teacher/content-blocks', async (c) => {
  const { DB } = c.env
  const { step_id, block_type, content, order_index } = await c.req.json()
  
  if (!step_id || !block_type) {
    return c.json({ error: 'step_id and block_type are required' }, 400)
  }

  const result = await DB.prepare(
    'INSERT INTO content_blocks (step_id, block_type, content, order_index) VALUES (?, ?, ?, ?)'
  ).bind(step_id, block_type, JSON.stringify(content || {}), order_index || 0).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// 問題作成
app.post('/api/teacher/questions', async (c) => {
  const { DB } = c.env
  const { step_id, question_type, question_text, config, order_index } = await c.req.json()
  
  if (!step_id || !question_type || !question_text) {
    return c.json({ error: 'Required fields missing' }, 400)
  }

  const result = await DB.prepare(
    'INSERT INTO questions (step_id, question_type, question_text, config, order_index) VALUES (?, ?, ?, ?, ?)'
  ).bind(step_id, question_type, question_text, JSON.stringify(config || {}), order_index || 0).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// コンテンツブロック一覧取得
app.get('/api/teacher/content-blocks', async (c) => {
  const { DB } = c.env
  const step_id = c.req.query('step_id')
  
  if (!step_id) {
    return c.json({ error: 'step_id is required' }, 400)
  }
  
  const result = await DB.prepare(
    'SELECT * FROM content_blocks WHERE step_id = ? ORDER BY order_index'
  ).bind(step_id).all()
  
  // JSONパース
  const blocks = result.results.map((b: any) => {
    try {
      return { ...b, content: JSON.parse(b.content) }
    } catch (e) {
      return { ...b, content: {} }
    }
  })
  
  return c.json({ blocks })
})

// コンテンツブロック削除
app.delete('/api/teacher/content-blocks/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare('DELETE FROM content_blocks WHERE id = ?').bind(id).run()
  
  return c.json({ success: true })
})

// コンテンツブロック更新
app.put('/api/teacher/content-blocks/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const { content } = await c.req.json()
  
  await DB.prepare(
    'UPDATE content_blocks SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(JSON.stringify(content), id).run()
  
  return c.json({ success: true })
})

// 問題一覧取得
app.get('/api/teacher/questions', async (c) => {
  const { DB } = c.env
  const step_id = c.req.query('step_id')
  
  if (!step_id) {
    return c.json({ error: 'step_id is required' }, 400)
  }
  
  const result = await DB.prepare(
    'SELECT * FROM questions WHERE step_id = ? ORDER BY order_index'
  ).bind(step_id).all()
  
  // JSONパースと選択肢の取得
  const questions = await Promise.all(result.results.map(async (q: any) => {
    let config = {}
    try {
      config = JSON.parse(q.config)
    } catch (e) {
      config = {}
    }

    const optionsResult = await DB.prepare(
      'SELECT * FROM question_options WHERE question_id = ? ORDER BY order_index'
    ).bind(q.id).all()

    return {
      ...q,
      config,
      options: optionsResult.results
    }
  }))
  
  return c.json({ questions })
})

// 問題更新
app.put('/api/teacher/questions/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const { question_text, config } = await c.req.json()
  
  await DB.prepare(
    'UPDATE questions SET question_text = ?, config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(question_text, JSON.stringify(config || {}), id).run()
  
  return c.json({ success: true })
})

// 問題削除
app.delete('/api/teacher/questions/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare('DELETE FROM questions WHERE id = ?').bind(id).run()
  
  return c.json({ success: true })
})

// 選択肢作成
app.post('/api/teacher/question-options', async (c) => {
  const { DB } = c.env
  const { question_id, option_text, is_correct, explanation, order_index } = await c.req.json()
  
  const result = await DB.prepare(
    'INSERT INTO question_options (question_id, option_text, is_correct, explanation, order_index) VALUES (?, ?, ?, ?, ?)'
  ).bind(question_id, option_text, is_correct ? 1 : 0, explanation || null, order_index || 0).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// 選択肢更新
app.put('/api/teacher/question-options/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const { option_text, is_correct, explanation } = await c.req.json()
  
  await DB.prepare(
    'UPDATE question_options SET option_text = ?, is_correct = ?, explanation = ? WHERE id = ?'
  ).bind(option_text, is_correct ? 1 : 0, explanation || null, id).run()
  
  return c.json({ success: true })
})

// 選択肢削除
app.delete('/api/teacher/question-options/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare('DELETE FROM question_options WHERE id = ?').bind(id).run()
  
  return c.json({ success: true })
})

// ==================== Teacher Admin UI Routes ====================

// セクション管理画面
app.get('/teacher/sections', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>セクション管理 - 学習アプリ開発プラットフォーム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <nav class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-book-open mr-2"></i>
                        セクション管理（学年単位）
                    </h1>
                    <div class="flex gap-4">
                        <a href="/" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                            <i class="fas fa-arrow-left mr-2"></i>トップへ戻る
                        </a>
                        <a href="/student" class="px-4 py-2 bg-green-500 rounded-lg hover:bg-green-400 transition">
                            <i class="fas fa-user-graduate mr-2"></i>生徒画面
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- 新規作成フォーム -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-plus-circle mr-2 text-green-500"></i>
                    新しいセクションを作成
                </h2>
                <form id="create-section-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">セクション名 *</label>
                            <input type="text" name="name" required 
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="例：中学1年生の数学">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">学年レベル</label>
                            <input type="text" name="grade_level" 
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="例：中1、高2">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">教科</label>
                            <input type="text" name="subject" 
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="例：数学、英語、理科">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">説明</label>
                        <textarea name="description" rows="2" 
                                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder="このセクションで学ぶ内容"></textarea>
                    </div>
                    <button type="submit" class="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                        <i class="fas fa-plus mr-2"></i>セクションを作成
                    </button>
                </form>
            </div>

            <!-- セクション一覧 -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-list mr-2 text-blue-500"></i>
                    登録されているセクション
                </h2>
                <div id="sections-list" class="space-y-4">
                    <p class="text-gray-500 text-center py-8">読み込み中...</p>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // セクション一覧を読み込み
          async function loadSections() {
            try {
              const response = await axios.get('/api/teacher/sections');
              const sections = response.data.sections;
              
              const listEl = document.getElementById('sections-list');
              
              if (sections.length === 0) {
                listEl.innerHTML = '<p class="text-gray-500 text-center py-8">まだセクションが登録されていません</p>';
                return;
              }
              
              listEl.innerHTML = sections.map(section => \`
                <div class="border-2 border-gray-200 rounded-lg p-6 hover:border-indigo-400 transition">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h3 class="text-xl font-bold text-gray-800 mb-2">\${section.name}</h3>
                      <div class="flex gap-4 mb-3">
                        <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                          <i class="fas fa-graduation-cap mr-1"></i>\${section.grade_level || '学年未設定'}
                        </span>
                        <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          <i class="fas fa-book mr-1"></i>\${section.subject || '教科未設定'}
                        </span>
                      </div>
                      <p class="text-gray-600 mb-3">\${section.description || '説明なし'}</p>
                      <p class="text-sm text-gray-400">ID: \${section.id} | 作成: \${new Date(section.created_at).toLocaleDateString('ja-JP')}</p>
                    </div>
                    <div class="flex gap-2 ml-4">
                      <a href="/teacher/phases?section_id=\${section.id}" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm">
                        <i class="fas fa-layer-group mr-1"></i>フェーズ管理
                      </a>
                      <button onclick="deleteSection(\${section.id})" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                        <i class="fas fa-trash mr-1"></i>削除
                      </button>
                    </div>
                  </div>
                </div>
              \`).join('');
            } catch (error) {
              console.error('セクション読み込みエラー:', error);
              document.getElementById('sections-list').innerHTML = '<p class="text-red-500 text-center py-8">エラーが発生しました</p>';
            }
          }
          
          // セクション作成
          document.getElementById('create-section-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
              name: formData.get('name'),
              grade_level: formData.get('grade_level'),
              subject: formData.get('subject'),
              description: formData.get('description')
            };
            
            try {
              await axios.post('/api/teacher/sections', data);
              alert('セクションを作成しました！');
              e.target.reset();
              loadSections();
            } catch (error) {
              console.error('セクション作成エラー:', error);
              alert('エラーが発生しました');
            }
          });
          
          // セクション削除
          async function deleteSection(id) {
            if (!confirm('本当にこのセクションを削除しますか？関連するフェーズ・モジュール・ステップも削除されます。')) {
              return;
            }
            alert('削除機能は今後実装予定です（ID: ' + id + '）');
          }
          
          // ページ読み込み時にセクション一覧を取得
          loadSections();
        </script>
    </body>
    </html>
  `)
})


// フェーズ管理画面
app.get('/teacher/phases', (c) => {
  const sectionId = c.req.query('section_id') || '';
  
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
        <nav class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-layer-group mr-2"></i>
                        フェーズ管理（大単元）
                    </h1>
                    <div class="flex gap-4">
                        <a href="/teacher/sections" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                            <i class="fas fa-arrow-left mr-2"></i>セクション管理へ
                        </a>
                        <a href="/" class="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-400 transition">
                            <i class="fas fa-home mr-2"></i>トップ
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- セクション選択 -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-book-open mr-2 text-indigo-500"></i>
                    セクションを選択
                </h2>
                <select id="section-select" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">セクションを選択...</option>
                </select>
            </div>

            <!-- 新規作成フォーム -->
            <div id="create-phase-section" class="hidden">
                <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-plus-circle mr-2 text-green-500"></i>
                        新しいフェーズを作成
                    </h2>
                    <form id="create-phase-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">フェーズ名 *</label>
                            <input type="text" name="name" required 
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="例：正の数・負の数">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">説明</label>
                            <textarea name="description" rows="3" 
                                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                      placeholder="このフェーズで学ぶ内容"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">表示順序</label>
                            <input type="number" name="order_index" value="0" min="0"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <button type="submit" class="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            <i class="fas fa-plus mr-2"></i>フェーズを作成
                        </button>
                    </form>
                </div>
            </div>

            <!-- フェーズ一覧 -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-list mr-2 text-blue-500"></i>
                    登録されているフェーズ
                </h2>
                <div id="phases-list" class="space-y-4">
                    <p class="text-gray-500 text-center py-8">まずセクションを選択してください</p>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          const urlParams = new URLSearchParams(window.location.search);
          const initialSectionId = urlParams.get('section_id') || '';
          
          // セクション一覧を読み込み
          async function loadSections() {
            try {
              const response = await axios.get('/api/teacher/sections');
              const sections = response.data.sections;
              
              const selectEl = document.getElementById('section-select');
              selectEl.innerHTML = '<option value="">セクションを選択...</option>' +
                sections.map(section => \`<option value="\${section.id}">\${section.name} (\${section.grade_level})</option>\`).join('');
              
              selectEl.addEventListener('change', (e) => {
                const sectionId = e.target.value;
                if (sectionId) {
                  loadPhases(sectionId);
                  document.getElementById('create-phase-section').classList.remove('hidden');
                } else {
                  document.getElementById('phases-list').innerHTML = '<p class="text-gray-500 text-center py-8">まずセクションを選択してください</p>';
                  document.getElementById('create-phase-section').classList.add('hidden');
                }
              });
              
              // 初期セクションIDが指定されている場合
              if (initialSectionId && sections.find(s => s.id == initialSectionId)) {
                selectEl.value = initialSectionId;
                loadPhases(initialSectionId);
                document.getElementById('create-phase-section').classList.remove('hidden');
              }
            } catch (error) {
              console.error('セクション読み込みエラー:', error);
            }
          }
          
          // フェーズ一覧を読み込み
          async function loadPhases(sectionId) {
            try {
              const response = await axios.get('/api/teacher/phases?section_id=' + sectionId);
              const phases = response.data.phases;
              
              const listEl = document.getElementById('phases-list');
              
              if (phases.length === 0) {
                listEl.innerHTML = '<p class="text-gray-500 text-center py-8">このセクションにはまだフェーズが登録されていません</p>';
                return;
              }
              
              listEl.innerHTML = phases.map(phase => \`
                <div class="border-2 border-gray-200 rounded-lg p-6 hover:border-purple-400 transition">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h3 class="text-xl font-bold text-gray-800 mb-2">\${phase.name}</h3>
                      <p class="text-gray-600 mb-3">\${phase.description || '説明なし'}</p>
                      <p class="text-sm text-gray-400">表示順序: \${phase.order_index} | ID: \${phase.id}</p>
                    </div>
                    <div class="flex gap-2 ml-4">
                      <a href="/teacher/modules?phase_id=\${phase.id}" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                        <i class="fas fa-book mr-1"></i>モジュール管理
                      </a>
                      <button onclick="deletePhase(\${phase.id})" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                        <i class="fas fa-trash mr-1"></i>削除
                      </button>
                    </div>
                  </div>
                </div>
              \`).join('');
            } catch (error) {
              console.error('フェーズ読み込みエラー:', error);
              document.getElementById('phases-list').innerHTML = '<p class="text-red-500 text-center py-8">エラーが発生しました</p>';
            }
          }
          
          // フェーズ作成
          document.getElementById('create-phase-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const sectionId = document.getElementById('section-select').value;
            if (!sectionId) {
              alert('まずセクションを選択してください');
              return;
            }
            
            const formData = new FormData(e.target);
            const data = {
              section_id: parseInt(sectionId),
              name: formData.get('name'),
              description: formData.get('description'),
              order_index: parseInt(formData.get('order_index'))
            };
            
            try {
              await axios.post('/api/teacher/phases', data);
              alert('フェーズを作成しました！');
              e.target.reset();
              loadPhases(sectionId);
            } catch (error) {
              console.error('フェーズ作成エラー:', error);
              alert('エラーが発生しました');
            }
          });
          
          // フェーズ削除
          function deletePhase(id) {
            if (!confirm('本当にこのフェーズを削除しますか？')) {
              return;
            }
            alert('削除機能は今後実装予定です（ID: ' + id + '）');
          }
          
          // ページ読み込み時にセクション一覧を取得
          loadSections();
        </script>
    </body>
    </html>
  `)
})


// モジュール管理画面
app.get('/teacher/modules', (c) => {
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
                        モジュール管理（中単元）
                    </h1>
                    <div class="flex gap-4">
                        <a href="/teacher/phases" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                            <i class="fas fa-arrow-left mr-2"></i>フェーズ管理へ
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
                        <label class="block text-sm font-medium text-gray-700 mb-2">セクション</label>
                        <select id="section-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">セクションを選択...</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">フェーズ</label>
                        <select id="phase-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">まずセクションを選択...</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- 新規作成フォーム -->
            <div id="create-module-section" class="hidden">
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
                                       placeholder="例：正の数の計算">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">アイコン（絵文字）</label>
                                <input type="text" name="icon" 
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                       placeholder="例：➕">
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
          const urlParams = new URLSearchParams(window.location.search);
          const initialPhaseId = urlParams.get('phase_id') || '';
          
          // セクション一覧を読み込み
          async function loadSections() {
            try {
              const response = await axios.get('/api/teacher/sections');
              const sections = response.data.sections;
              
              const selectEl = document.getElementById('section-select');
              selectEl.innerHTML = '<option value="">セクションを選択...</option>' +
                sections.map(section => \`<option value="\${section.id}">\${section.name}</option>\`).join('');
              
              // セクション変更時の処理
              selectEl.addEventListener('change', (e) => {
                const sectionId = e.target.value;
                if (sectionId) {
                  loadPhases(sectionId);
                } else {
                  document.getElementById('phase-select').innerHTML = '<option value="">まずセクションを選択...</option>';
                  resetModules();
                }
              });
              
              // 初期化時にフェーズIDがある場合、そのフェーズが属するセクションを特定するのは難しい（APIが必要）
              // 簡易的に全セクションのフェーズを検索するか、ユーザーに選択させる
              // ここではフェーズIDがある場合、親セクションIDを取得するAPIがないため、ユーザー選択に委ねるか、
              // もしくはフェーズIDだけで動作するようにUIを調整する必要がある
              if (initialPhaseId) {
                 // 暫定対応: フェーズ詳細を取得してセクションを特定するAPIがないため、
                 // セクション選択をスキップして直接モジュールを表示するロジックがあれば良いが、
                 // 現在の構造ではセクション->フェーズの順で選択させるのが基本
                 // ただし、リンクから飛んできた場合はフェーズIDがわかっている
                 loadModules(initialPhaseId);
                 document.getElementById('create-module-section').classList.remove('hidden');
                 
                 // フェーズIDから情報を逆引きできないので、セクション選択UIの状態は不整合になる可能性がある
                 // 本格的な実装では /api/teacher/phases/{id} を実装すべき
              }
            } catch (error) {
              console.error('セクション読み込みエラー:', error);
            }
          }
          
          // フェーズ一覧を読み込み
          async function loadPhases(sectionId) {
            try {
              const response = await axios.get('/api/teacher/phases?section_id=' + sectionId);
              const phases = response.data.phases;
              
              const selectEl = document.getElementById('phase-select');
              selectEl.innerHTML = '<option value="">フェーズを選択...</option>' +
                phases.map(phase => \`<option value="\${phase.id}">\${phase.name}</option>\`).join('');
              
              selectEl.addEventListener('change', (e) => {
                const phaseId = e.target.value;
                if (phaseId) {
                  loadModules(phaseId);
                  document.getElementById('create-module-section').classList.remove('hidden');
                } else {
                  resetModules();
                }
              });
            } catch (error) {
              console.error('フェーズ読み込みエラー:', error);
            }
          }
          
          function resetModules() {
            document.getElementById('modules-list').innerHTML = '<p class="text-gray-500 text-center py-8">まずフェーズを選択してください</p>';
            document.getElementById('create-module-section').classList.add('hidden');
          }
          
          // モジュール一覧を読み込み
          async function loadModules(phaseId) {
            try {
              const response = await axios.get('/api/teacher/modules?phase_id=' + phaseId);
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
                      <a href="/teacher/steps?module_id=\${module.id}" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                        <i class="fas fa-tasks mr-1"></i>ステップ管理
                      </a>
                      <button onclick="deleteModule(\${module.id})" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                        <i class="fas fa-trash mr-1"></i>削除
                      </button>
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
            
            // phase_idはURLパラメータから取得するか、セレクトボックスから取得する
            let phaseId = urlParams.get('phase_id');
            if (!phaseId) {
               phaseId = document.getElementById('phase-select').value;
            }

            if (!phaseId) {
              alert('フェーズが特定できません');
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
              await axios.post('/api/teacher/modules', data);
              alert('モジュールを作成しました！');
              e.target.reset();
              loadModules(phaseId);
            } catch (error) {
              console.error('モジュール作成エラー:', error);
              alert('エラーが発生しました');
            }
          });
          
          // モジュール削除
          async function deleteModule(id) {
            if (!confirm('本当にこのモジュールを削除しますか？')) {
              return;
            }
            alert('削除機能は今後実装予定です（ID: ' + id + '）');
          }
          
          // 初期化
          loadSections();
        </script>
    </body>
    </html>
  `)
})

// ステップ管理画面
app.get('/teacher/steps', (c) => {
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
                        <a href="/teacher/modules" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                            <i class="fas fa-arrow-left mr-2"></i>モジュール管理へ
                        </a>
                        <a href="/" class="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-400 transition">
                            <i class="fas fa-home mr-2"></i>トップ
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
                        <label class="block text-sm font-medium text-gray-700 mb-2">セクション</label>
                        <select id="section-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">セクションを選択...</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">フェーズ</label>
                        <select id="phase-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">まずセクションを選択...</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">モジュール</label>
                        <select id="module-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">まずフェーズを選択...</option>
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
          
          // セクション一覧を読み込み
          async function loadSections() {
            try {
              const response = await axios.get('/api/teacher/sections');
              const sections = response.data.sections;
              
              const selectEl = document.getElementById('section-select');
              selectEl.innerHTML = '<option value="">セクションを選択...</option>' +
                sections.map(section => \`<option value="\${section.id}">\${section.name}</option>\`).join('');
              
              selectEl.addEventListener('change', (e) => {
                const sectionId = e.target.value;
                if (sectionId) {
                  loadPhases(sectionId);
                } else {
                  document.getElementById('phase-select').innerHTML = '<option value="">まずセクションを選択...</option>';
                  resetSteps();
                }
              });
              
              if (initialModuleId) {
                 // 暫定対応: モジュールIDがある場合はモジュールからステップを読み込む
                 // 親のセクション、フェーズの特定はAPI不足のため省略
                 // 本来は /api/teacher/modules/{id} で親フェーズIDなどを取得すべき
                 loadSteps(initialModuleId);
                 document.getElementById('create-step-section').classList.remove('hidden');
              }
            } catch (error) {
              console.error('セクション読み込みエラー:', error);
            }
          }
          
          // フェーズ一覧を読み込み
          async function loadPhases(sectionId) {
            try {
              const response = await axios.get('/api/teacher/phases?section_id=' + sectionId);
              const phases = response.data.phases;
              
              const selectEl = document.getElementById('phase-select');
              selectEl.innerHTML = '<option value="">フェーズを選択...</option>' +
                phases.map(phase => \`<option value="\${phase.id}">\${phase.name}</option>\`).join('');
              
              selectEl.addEventListener('change', (e) => {
                const phaseId = e.target.value;
                if (phaseId) {
                  loadModules(phaseId);
                } else {
                  document.getElementById('module-select').innerHTML = '<option value="">まずフェーズを選択...</option>';
                  resetSteps();
                }
              });
            } catch (error) {
              console.error('フェーズ読み込みエラー:', error);
            }
          }
          
          function resetSteps() {
             document.getElementById('steps-list').innerHTML = '<p class="text-gray-500 text-center py-8">まずモジュールを選択してください</p>';
             document.getElementById('create-step-section').classList.add('hidden');
          }
          
          // モジュール一覧を読み込み
          async function loadModules(phaseId) {
            try {
              const response = await axios.get('/api/teacher/modules?phase_id=' + phaseId);
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
                  resetSteps();
                }
              });
            } catch (error) {
              console.error('モジュールの読み込みエラー:', error);
            }
          }
          
          // ステップ一覧を読み込み
          async function loadSteps(moduleId) {
            try {
              const response = await axios.get('/api/teacher/steps?module_id=' + moduleId);
              const steps = response.data.steps;
              
              const listEl = document.getElementById('steps-list');
              
              if (steps.length === 0) {
                listEl.innerHTML = '<p class="text-gray-500 text-center py-8">このモジュールにはまだステップが登録されていません</p>';
                return;
              }
              
              listEl.innerHTML = steps.map((step, index) => \`
                <div class="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-400 transition bg-white shadow-sm">
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
                    <div class="flex gap-2 ml-4 flex-col">
                      <a href="/teacher/content?step_id=\${step.id}" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm text-center shadow-sm">
                        <i class="fas fa-edit mr-1"></i>コンテンツ作成
                      </a>
                      <div class="flex gap-2">
                        <button onclick="editStep(\${step.id})" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm shadow-sm">
                          <i class="fas fa-pen mr-1"></i>編集
                        </button>
                        <button onclick="deleteStep(\${step.id})" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm shadow-sm">
                          <i class="fas fa-trash mr-1"></i>削除
                        </button>
                      </div>
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
            
            // module_idはURLパラメータから取得するか、セレクトボックスから取得する
            let moduleId = urlParams.get('module_id');
            if (!moduleId) {
               moduleId = document.getElementById('module-select').value;
            }

            if (!moduleId) {
              alert('モジュールが特定できません');
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
              await axios.post('/api/teacher/steps', data);
              alert('ステップを作成しました！');
              e.target.reset();
              loadSteps(moduleId);
            } catch (error) {
              console.error('ステップ作成エラー:', error);
              alert('エラーが発生しました');
            }
          });
          
          // ステップ編集
          async function editStep(id) {
            try {
                const res = await axios.get('/api/teacher/steps/' + id);
                const step = res.data.step;
                
                const newTitle = prompt('ステップのタイトルを編集:', step.title);
                if (newTitle === null) return;
                
                const newDesc = prompt('説明文を編集:', step.description || '');
                if (newDesc === null) return;

                const newOrder = prompt('表示順序:', step.order_index);
                if (newOrder === null) return;

                await axios.put('/api/teacher/steps/' + id, {
                    title: newTitle,
                    description: newDesc,
                    order_index: parseInt(newOrder)
                });
                
                alert('更新しました');
                loadSteps(step.module_id);
            } catch(e) {
                console.error(e);
                alert('更新に失敗しました');
            }
          }
          
          // ステップ削除
          async function deleteStep(id) {
            if (!confirm('本当にこのステップを削除しますか？\\n関連するコンテンツも全て削除されます。')) {
              return;
            }
            try {
                await axios.delete('/api/teacher/steps/' + id);
                alert('削除しました');
                const moduleId = document.getElementById('module-select').value;
                if(moduleId) loadSteps(moduleId);
            } catch(e) {
                console.error(e);
                alert('削除に失敗しました');
            }
          }
          
          // 初期化
          loadSections();
        </script>
    </body>
    </html>
  `)
})

// コンテンツ作成画面
app.get('/teacher/content', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>コンテンツ作成 - 学習アプリ開発プラットフォーム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <!-- Markdown Parser -->
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <!-- Chart.js -->
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <!-- Function Plot -->
        <script src="https://unpkg.com/function-plot/dist/function-plot.js"></script>
        <!-- MathJax -->
        <script>
          window.MathJax = {
            tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']] }
          };
        </script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <style>
            .content-block { transition: all 0.3s ease; }
            .content-block:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
            .drag-handle { cursor: move; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <nav class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-edit mr-2"></i>
                        コンテンツ作成
                    </h1>
                    <div class="flex gap-4">
                        <a href="/teacher/steps" class="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-400 transition">
                            <i class="fas fa-arrow-left mr-2"></i>ステップ管理へ
                        </a>
                        <a href="/" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                            <i class="fas fa-home mr-2"></i>トップ
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- 階層選択 -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-sitemap mr-2 text-indigo-500"></i>
                    編集するステップを選択
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">1. セクション</label>
                        <select id="section-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">選択してください</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">2. フェーズ</label>
                        <select id="phase-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" disabled>
                            <option value="">セクションを選択...</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">3. モジュール</label>
                        <select id="module-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" disabled>
                            <option value="">フェーズを選択...</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">4. ステップ</label>
                        <select id="step-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" disabled>
                            <option value="">モジュールを選択...</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- エディタエリア -->
            <div id="editor-area" class="hidden">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-800" id="current-step-title">ステップタイトル</h2>
                    <div class="flex gap-3">
                        <button onclick="previewContent()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow">
                            <i class="fas fa-eye mr-2"></i>プレビュー
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- 左カラム: コンテンツブロックリスト -->
                    <div class="lg:col-span-2 space-y-6" id="content-blocks-container">
                        <!-- ブロックがここに動的に追加されます -->
                        <div class="text-center py-12 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                            <p class="text-gray-500">まだコンテンツがありません。<br>右側のメニューからブロックを追加してください。</p>
                        </div>
                    </div>

                    <!-- 右カラム: ツールボックス -->
                    <div class="space-y-6">
                        <div class="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                            <h3 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                                <i class="fas fa-plus mr-2 text-blue-500"></i>
                                ブロック追加
                            </h3>
                            <div class="grid grid-cols-1 gap-3">
                                <button onclick="addBlock('text')" class="flex items-center p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition group">
                                    <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 group-hover:bg-blue-600 group-hover:text-white transition">
                                        <i class="fas fa-font"></i>
                                    </div>
                                    <div class="text-left">
                                        <div class="font-bold text-gray-800">テキスト</div>
                                        <div class="text-xs text-gray-500">説明文や数式を追加</div>
                                    </div>
                                </button>
                                
                                <button onclick="addBlock('image')" class="flex items-center p-3 bg-gray-50 hover:bg-green-50 border border-gray-200 rounded-lg transition group">
                                    <div class="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 group-hover:bg-green-600 group-hover:text-white transition">
                                        <i class="fas fa-image"></i>
                                    </div>
                                    <div class="text-left">
                                        <div class="font-bold text-gray-800">画像</div>
                                        <div class="text-xs text-gray-500">画像のURLを指定</div>
                                    </div>
                                </button>

                                <button onclick="addBlock('youtube')" class="flex items-center p-3 bg-gray-50 hover:bg-red-50 border border-gray-200 rounded-lg transition group">
                                    <div class="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-3 group-hover:bg-red-600 group-hover:text-white transition">
                                        <i class="fab fa-youtube"></i>
                                    </div>
                                    <div class="text-left">
                                        <div class="font-bold text-gray-800">YouTube</div>
                                        <div class="text-xs text-gray-500">動画を埋め込み</div>
                                    </div>
                                </button>

                                <button onclick="addBlock('shape')" class="flex items-center p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 rounded-lg transition group">
                                    <div class="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-3 group-hover:bg-purple-600 group-hover:text-white transition">
                                        <i class="fas fa-shapes"></i>
                                    </div>
                                    <div class="text-left">
                                        <div class="font-bold text-gray-800">基本図形</div>
                                        <div class="text-xs text-gray-500">四角形、円、三角形など</div>
                                    </div>
                                </button>

                                <button onclick="addBlock('graph')" class="flex items-center p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded-lg transition group">
                                    <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-3 group-hover:bg-indigo-600 group-hover:text-white transition">
                                        <i class="fas fa-chart-line"></i>
                                    </div>
                                    <div class="text-left">
                                        <div class="font-bold text-gray-800">関数グラフ</div>
                                        <div class="text-xs text-gray-500">数式からグラフを描画</div>
                                    </div>
                                </button>

                                <button onclick="addBlock('chart')" class="flex items-center p-3 bg-gray-50 hover:bg-green-50 border border-gray-200 rounded-lg transition group">
                                    <div class="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 group-hover:bg-green-600 group-hover:text-white transition">
                                        <i class="fas fa-chart-bar"></i>
                                    </div>
                                    <div class="text-left">
                                        <div class="font-bold text-gray-800">統計グラフ</div>
                                        <div class="text-xs text-gray-500">棒グラフ・円グラフなど</div>
                                    </div>
                                </button>

                                <button onclick="addQuestion('multiple_choice')" class="flex items-center p-3 bg-gray-50 hover:bg-yellow-50 border border-gray-200 rounded-lg transition group">
                                    <div class="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mr-3 group-hover:bg-yellow-600 group-hover:text-white transition">
                                        <i class="fas fa-list-ul"></i>
                                    </div>
                                    <div class="text-left">
                                        <div class="font-bold text-gray-800">選択式問題</div>
                                        <div class="text-xs text-gray-500">選択肢から正解を選ぶ</div>
                                    </div>
                                </button>

                                <button onclick="addQuestion('short_answer')" class="flex items-center p-3 bg-gray-50 hover:bg-orange-50 border border-gray-200 rounded-lg transition group">
                                    <div class="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mr-3 group-hover:bg-orange-600 group-hover:text-white transition">
                                        <i class="fas fa-keyboard"></i>
                                    </div>
                                    <div class="text-left">
                                        <div class="font-bold text-gray-800">数値入力問題</div>
                                        <div class="text-xs text-gray-500">数値や数式を入力</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- プレビューモーダル -->
        <div id="preview-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
            <div class="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col m-4">
                <div class="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 class="text-xl font-bold text-gray-800"><i class="fas fa-mobile-alt mr-2"></i>プレビュー</h3>
                    <button onclick="closePreview()" class="text-gray-500 hover:text-gray-800">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-8" id="preview-content">
                    <!-- プレビュー内容 -->
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let currentStepId = null;
            let allItems = [];

            // 初期化
            document.addEventListener('DOMContentLoaded', () => {
                loadSections();
                
                // URLパラメータからstep_idを取得
                const urlParams = new URLSearchParams(window.location.search);
                const stepId = urlParams.get('step_id');
                
                if (stepId) {
                    axios.get('/api/teacher/steps/' + stepId).then(res => {
                        const step = res.data.step;
                        loadContent(stepId, step.title);
                        // セクションなどの選択状態復元は複雑なため省略し、エディタのみ表示
                    }).catch(e => console.error(e));
                }
            });

            // 階層データの読み込み
            async function loadSections() {
                const res = await axios.get('/api/teacher/sections');
                const sections = res.data.sections;
                const select = document.getElementById('section-select');
                select.innerHTML = '<option value="">選択してください</option>' + 
                    sections.map(s => \`<option value="\${s.id}">\${s.name}</option>\`).join('');
                
                select.addEventListener('change', e => {
                    if(e.target.value) loadPhases(e.target.value);
                    else disableSelects(['phase', 'module', 'step']);
                });
            }

            async function loadPhases(sectionId) {
                const res = await axios.get(\`/api/teacher/phases?section_id=\${sectionId}\`);
                const select = document.getElementById('phase-select');
                select.disabled = false;
                select.innerHTML = '<option value="">選択してください</option>' + 
                    res.data.phases.map(p => \`<option value="\${p.id}">\${p.name}</option>\`).join('');
                
                disableSelects(['module', 'step']);
                select.addEventListener('change', e => {
                    if(e.target.value) loadModules(e.target.value);
                    else disableSelects(['module', 'step']);
                });
            }

            async function loadModules(phaseId) {
                const res = await axios.get(\`/api/teacher/modules?phase_id=\${phaseId}\`);
                const select = document.getElementById('module-select');
                select.disabled = false;
                select.innerHTML = '<option value="">選択してください</option>' + 
                    res.data.modules.map(m => \`<option value="\${m.id}">\${m.name}</option>\`).join('');
                
                disableSelects(['step']);
                select.addEventListener('change', e => {
                    if(e.target.value) loadSteps(e.target.value);
                    else disableSelects(['step']);
                });
            }

            async function loadSteps(moduleId) {
                const res = await axios.get(\`/api/teacher/steps?module_id=\${moduleId}\`);
                const select = document.getElementById('step-select');
                select.disabled = false;
                select.innerHTML = '<option value="">選択してください</option>' + 
                    res.data.steps.map(s => \`<option value="\${s.id}">\${s.title}</option>\`).join('');
                
                select.addEventListener('change', e => {
                    if(e.target.value) loadContent(e.target.value, e.target.options[e.target.selectedIndex].text);
                    else document.getElementById('editor-area').classList.add('hidden');
                });
            }

            function disableSelects(names) {
                names.forEach(name => {
                    const el = document.getElementById(name + '-select');
                    el.disabled = true;
                    el.innerHTML = '<option value="">親要素を選択...</option>';
                });
                if(names.includes('step')) {
                    document.getElementById('editor-area').classList.add('hidden');
                }
            }

            // コンテンツ読み込み
            async function loadContent(stepId, stepTitle) {
                currentStepId = stepId;
                document.getElementById('current-step-title').textContent = stepTitle;
                document.getElementById('editor-area').classList.remove('hidden');
                
                try {
                    const [blocksRes, questionsRes] = await Promise.all([
                        axios.get(\`/api/teacher/content-blocks?step_id=\${stepId}\`),
                        axios.get(\`/api/teacher/questions?step_id=\${stepId}\`)
                    ]);

                    const blocks = blocksRes.data.blocks.map(b => ({ ...b, type: 'block' }));
                    const questions = questionsRes.data.questions.map(q => ({ ...q, type: 'question' }));
                    
                    allItems = [...blocks, ...questions].sort((a, b) => a.order_index - b.order_index);
                    
                    renderEditor();
                } catch(e) {
                    console.error(e);
                    alert('コンテンツの読み込みに失敗しました');
                }
            }

            // エディタ描画
            function renderEditor() {
                const container = document.getElementById('content-blocks-container');
                container.innerHTML = '';

                if (allItems.length === 0) {
                    container.innerHTML = \`
                        <div id="empty-msg" class="text-center py-12 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                            <p class="text-gray-500">コンテンツがありません。<br>右側のメニューからブロックを追加してください。</p>
                        </div>
                    \`;
                    return;
                }

                allItems.forEach(item => {
                    const el = createItemElement(item);
                    container.appendChild(el);
                    
                    if (item.type === 'block' && item.block_type === 'graph') {
                        setTimeout(() => {
                            try {
                                functionPlot({
                                    target: '#graph-editor-preview-' + item.id,
                                    width: 400,
                                    height: 240,
                                    grid: item.content.grid,
                                    xAxis: { domain: [parseFloat(item.content.xMin), parseFloat(item.content.xMax)] },
                                    yAxis: { domain: [parseFloat(item.content.yMin), parseFloat(item.content.yMax)] },
                                    data: getFunctionPlotData(item.content)
                                });
                            } catch(e) {}
                        }, 300);
                    }
                    if (item.type === 'block' && item.block_type === 'chart') {
                        setTimeout(() => {
                            try {
                                const ctx = document.getElementById('chart-editor-preview-' + item.id);
                                if (ctx) {
                                    new Chart(ctx, {
                                        type: item.content.chartType,
                                        data: {
                                            labels: (item.content.labels || '').split(','),
                                            datasets: [{
                                                label: item.content.title || 'データ',
                                                data: (item.content.data || '').split(',').map(Number),
                                                backgroundColor: item.content.color || '#3b82f6',
                                                borderColor: item.content.color || '#3b82f6'
                                            }]
                                        },
                                        options: { responsive: true, maintainAspectRatio: false }
                                    });
                                }
                            } catch(e) {}
                        }, 300);
                    }
                });
            }

            // アイテム要素作成
            function createItemElement(item) {
                const div = document.createElement('div');
                
                if (item.type === 'block') {
                    // コンテンツブロック
                    div.className = 'content-block bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative group mb-4';
                    const block = item;
                    
                    let contentHtml = '';
                    if (block.block_type === 'text') {
                        contentHtml = \`
                            <div class="mb-2 font-bold text-gray-500 text-xs uppercase flex items-center">
                                <i class="fas fa-font mr-2"></i>テキスト
                            </div>
                            <textarea onchange="updateBlock(\${block.id}, 'text', this.value)" class="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500 font-mono text-sm">\${block.content.text || ''}</textarea>
                            <div class="text-xs text-gray-400 mt-1">Markdown記法と数式 ($...$) が使えます</div>
                        \`;
                    } else if (block.block_type === 'image') {
                        contentHtml = \`
                            <div class="mb-2 font-bold text-gray-500 text-xs uppercase flex items-center">
                                <i class="fas fa-image mr-2"></i>画像
                            </div>
                            <input type="text" value="\${block.content.url || ''}" onchange="updateBlock(\${block.id}, 'url', this.value)" placeholder="画像URL (https://...)" class="w-full p-2 border rounded-lg mb-2">
                            \${block.content.url ? \`<img src="\${block.content.url}" class="max-h-40 rounded border shadow-sm">\` : ''}
                        \`;
                    } else if (block.block_type === 'youtube') {
                        contentHtml = \`
                            <div class="mb-2 font-bold text-gray-500 text-xs uppercase flex items-center">
                                <i class="fab fa-youtube mr-2"></i>YouTube
                            </div>
                            <input type="text" value="\${block.content.videoId || ''}" onchange="updateBlock(\${block.id}, 'videoId', this.value)" placeholder="YouTube Video ID (例: dQw4w9WgXcQ)" class="w-full p-2 border rounded-lg">
                        \`;
                    } else if (block.block_type === 'shape') {
                        // データ正規化
                        if (!block.content.shapes) {
                            block.content.shapes = [{
                                id: Date.now(),
                                type: block.content.shapeType || 'rect',
                                color: block.content.color || '#3b82f6',
                                size: block.content.size || 100,
                                x: 100, y: 100
                            }];
                        }

                        const shapesListHtml = block.content.shapes.map((s, idx) => \`
                            <div class="border p-2 rounded bg-gray-50 text-sm mb-2">
                                <div class="flex justify-between mb-2">
                                    <span class="font-bold">図形 \${idx + 1}</span>
                                    <button onclick="removeShapeFromBlock(\${block.id}, \${idx})" class="text-red-500 hover:text-red-700">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <select onchange="updateShapeInBlock(\${block.id}, \${idx}, 'type', this.value)" class="border rounded p-1">
                                        <option value="rect" \${s.type === 'rect' ? 'selected' : ''}>四角</option>
                                        <option value="circle" \${s.type === 'circle' ? 'selected' : ''}>円</option>
                                        <option value="triangle" \${s.type === 'triangle' ? 'selected' : ''}>三角</option>
                                        <option value="star" \${s.type === 'star' ? 'selected' : ''}>星</option>
                                    </select>
                                    <input type="color" value="\${s.color}" onchange="updateShapeInBlock(\${block.id}, \${idx}, 'color', this.value)" class="h-8 w-full rounded">
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">X</span>
                                        <input type="number" value="\${s.x}" onchange="updateShapeInBlock(\${block.id}, \${idx}, 'x', parseInt(this.value))" class="w-full border rounded p-1">
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">Y</span>
                                        <input type="number" value="\${s.y}" onchange="updateShapeInBlock(\${block.id}, \${idx}, 'y', parseInt(this.value))" class="w-full border rounded p-1">
                                    </div>
                                    <div class="flex items-center gap-1 col-span-2">
                                        <span class="text-xs">サイズ</span>
                                        <input type="number" value="\${s.size}" onchange="updateShapeInBlock(\${block.id}, \${idx}, 'size', parseInt(this.value))" class="w-full border rounded p-1">
                                    </div>
                                </div>
                            </div>
                        \`).join('');

                        contentHtml = \`
                            <div class="mb-2 font-bold text-purple-600 text-xs uppercase flex items-center">
                                <i class="fas fa-shapes mr-2"></i>複合図形エディタ
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div class="mb-2 space-x-2">
                                        <button onclick="addShapeToBlock(\${block.id}, 'rect')" class="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">+ 四角</button>
                                        <button onclick="addShapeToBlock(\${block.id}, 'circle')" class="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">+ 円</button>
                                        <button onclick="addShapeToBlock(\${block.id}, 'triangle')" class="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">+ 三角</button>
                                        <button onclick="addShapeToBlock(\${block.id}, 'star')" class="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">+ 星</button>
                                    </div>
                                    <div class="max-h-60 overflow-y-auto pr-1">
                                        \${shapesListHtml}
                                    </div>
                                </div>
                                <div class="flex justify-center items-center bg-gray-100 rounded border h-64" id="shape-preview-\${block.id}">
                                    \${renderShapePreview(block.content)}
                                </div>
                            </div>
                        \`;
                    } else if (block.block_type === 'graph') {
                        // データ正規化
                        if (!block.content.points) block.content.points = [];
                        if (!block.content.segments) block.content.segments = [];

                        const pointsListHtml = (block.content.points || []).map((p, idx) => \`
                            <div class="border p-2 rounded bg-gray-50 text-sm mb-2">
                                <div class="flex justify-between mb-1">
                                    <span class="font-bold">点 \${idx + 1}</span>
                                    <button onclick="removeGraphElement(\${block.id}, 'point', \${idx})" class="text-red-500 hover:text-red-700">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div class="grid grid-cols-3 gap-2">
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">X</span>
                                        <input type="number" value="\${p.x}" onchange="updateGraphElement(\${block.id}, 'point', \${idx}, 'x', this.value)" class="w-full border rounded p-1">
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">Y</span>
                                        <input type="number" value="\${p.y}" onchange="updateGraphElement(\${block.id}, 'point', \${idx}, 'y', this.value)" class="w-full border rounded p-1">
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">色</span>
                                        <input type="color" value="\${p.color || '#ff0000'}" onchange="updateGraphElement(\${block.id}, 'point', \${idx}, 'color', this.value)" class="h-6 w-full rounded">
                                    </div>
                                </div>
                            </div>
                        \`).join('');

                        const segmentsListHtml = (block.content.segments || []).map((s, idx) => \`
                            <div class="border p-2 rounded bg-gray-50 text-sm mb-2">
                                <div class="flex justify-between mb-1">
                                    <span class="font-bold">線分 \${idx + 1}</span>
                                    <button onclick="removeGraphElement(\${block.id}, 'segment', \${idx})" class="text-red-500 hover:text-red-700">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div class="grid grid-cols-2 gap-2 mb-1">
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">X1</span>
                                        <input type="number" value="\${s.x1}" onchange="updateGraphElement(\${block.id}, 'segment', \${idx}, 'x1', this.value)" class="w-full border rounded p-1">
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">Y1</span>
                                        <input type="number" value="\${s.y1}" onchange="updateGraphElement(\${block.id}, 'segment', \${idx}, 'y1', this.value)" class="w-full border rounded p-1">
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">X2</span>
                                        <input type="number" value="\${s.x2}" onchange="updateGraphElement(\${block.id}, 'segment', \${idx}, 'x2', this.value)" class="w-full border rounded p-1">
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">Y2</span>
                                        <input type="number" value="\${s.y2}" onchange="updateGraphElement(\${block.id}, 'segment', \${idx}, 'y2', this.value)" class="w-full border rounded p-1">
                                    </div>
                                </div>
                                <div class="mt-1">
                                    <input type="color" value="\${s.color || '#008000'}" onchange="updateGraphElement(\${block.id}, 'segment', \${idx}, 'color', this.value)" class="h-6 w-full rounded">
                                </div>
                            </div>
                        \`).join('');

                        contentHtml = \`
                            <div class="mb-2 font-bold text-indigo-600 text-xs uppercase flex items-center">
                                <i class="fas fa-chart-line mr-2"></i>関数グラフ
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div class="mb-2">
                                        <label class="block text-xs text-gray-500 mb-1">関数 ($f(x) = $)</label>
                                        <input type="text" value="\${block.content.fn || 'x^2'}" onchange="updateBlock(\${block.id}, 'fn', this.value)" class="w-full p-2 border rounded text-sm font-mono" placeholder="例: x^2, sin(x)">
                                    </div>
                                    <div class="grid grid-cols-2 gap-2 mb-2">
                                        <div>
                                            <label class="block text-xs text-gray-500 mb-1">X軸 (min, max)</label>
                                            <div class="flex gap-1">
                                                <input type="number" value="\${block.content.xMin || -10}" onchange="updateBlock(\${block.id}, 'xMin', this.value)" class="w-full p-1 border rounded text-sm">
                                                <input type="number" value="\${block.content.xMax || 10}" onchange="updateBlock(\${block.id}, 'xMax', this.value)" class="w-full p-1 border rounded text-sm">
                                            </div>
                                        </div>
                                        <div>
                                            <label class="block text-xs text-gray-500 mb-1">Y軸 (min, max)</label>
                                            <div class="flex gap-1">
                                                <input type="number" value="\${block.content.yMin || -10}" onchange="updateBlock(\${block.id}, 'yMin', this.value)" class="w-full p-1 border rounded text-sm">
                                                <input type="number" value="\${block.content.yMax || 10}" onchange="updateBlock(\${block.id}, 'yMax', this.value)" class="w-full p-1 border rounded text-sm">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mb-4">
                                        <label class="block text-xs text-gray-500 mb-1">グリッド表示</label>
                                        <input type="checkbox" \${block.content.grid ? 'checked' : ''} onchange="updateBlock(\${block.id}, 'grid', this.checked)">
                                    </div>
                                    
                                    <div class="border-t pt-2 mt-2">
                                        <div class="flex justify-between items-center mb-2">
                                            <span class="text-xs font-bold text-gray-500">点と線分</span>
                                            <div class="space-x-1">
                                                <button onclick="addGraphElement(\${block.id}, 'point')" class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200">+ 点</button>
                                                <button onclick="addGraphElement(\${block.id}, 'segment')" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">+ 線分</button>
                                            </div>
                                        </div>
                                        <div class="max-h-40 overflow-y-auto pr-1">
                                            \${pointsListHtml}
                                            \${segmentsListHtml}
                                        </div>
                                    </div>
                                </div>
                                <div class="flex justify-center items-center bg-gray-50 rounded border h-64" id="graph-editor-preview-\${block.id}"></div>
                            </div>
                        \`;
                    } else if (block.block_type === 'chart') {
                        contentHtml = \`
                            <div class="mb-2 font-bold text-green-600 text-xs uppercase flex items-center">
                                <i class="fas fa-chart-bar mr-2"></i>統計グラフ
                            </div>
                            <div class="grid grid-cols-2 gap-4 mb-2">
                                <div>
                                    <label class="block text-xs text-gray-500 mb-1">種類</label>
                                    <select onchange="updateBlock(\${block.id}, 'chartType', this.value)" class="w-full p-2 border rounded text-sm">
                                        <option value="bar" \${block.content.chartType === 'bar' ? 'selected' : ''}>棒グラフ</option>
                                        <option value="pie" \${block.content.chartType === 'pie' ? 'selected' : ''}>円グラフ</option>
                                        <option value="line" \${block.content.chartType === 'line' ? 'selected' : ''}>折れ線グラフ</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-500 mb-1">色（メイン）</label>
                                    <div class="flex items-center gap-2">
                                        <input type="color" value="\${block.content.color || '#3b82f6'}" onchange="updateBlock(\${block.id}, 'color', this.value)" class="h-8 w-8 rounded cursor-pointer">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-2">
                                <label class="block text-xs text-gray-500 mb-1">タイトル</label>
                                <input type="text" value="\${block.content.title || ''}" onchange="updateBlock(\${block.id}, 'title', this.value)" class="w-full p-2 border rounded text-sm">
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs text-gray-500 mb-1">項目名 (カンマ区切り)</label>
                                    <textarea onchange="updateBlock(\${block.id}, 'labels', this.value)" class="w-full p-2 border rounded text-sm h-20" placeholder="例: A,B,C">\${block.content.labels || ''}</textarea>
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-500 mb-1">データ (カンマ区切り)</label>
                                    <textarea onchange="updateBlock(\${block.id}, 'data', this.value)" class="w-full p-2 border rounded text-sm h-20" placeholder="例: 10,20,30">\${block.content.data || ''}</textarea>
                                </div>
                            </div>
                            <div class="mt-4 p-4 bg-white rounded border shadow-inner flex justify-center items-center h-64" style="position: relative;">
                                <canvas id="chart-editor-preview-\${block.id}"></canvas>
                            </div>
                        \`;
                    }

                    div.innerHTML = \`
                        <div class="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition flex gap-2">
                            <button onclick="deleteBlock(\${block.id}, this)" class="text-red-500 hover:bg-red-50 p-2 rounded"><i class="fas fa-trash"></i></button>
                        </div>
                        \${contentHtml}
                    \`;
                } else {
                    // 問題ブロック
                    const q = item;
                    const isMultipleChoice = q.question_type === 'multiple_choice';
                    const typeLabel = isMultipleChoice ? '選択式問題' : '数値入力問題';
                    const bgColor = isMultipleChoice ? 'bg-yellow-50 border-yellow-200' : 'bg-orange-50 border-orange-200';
                    const textColor = isMultipleChoice ? 'text-yellow-700' : 'text-orange-700';
                    const icon = isMultipleChoice ? 'fa-list-ul' : 'fa-keyboard';

                    div.className = \`content-block \${bgColor} border rounded-xl p-4 shadow-sm relative group mb-4\`;
                    
                    let editorHtml = \`
                        <div class="mb-4">
                            <label class="text-xs font-bold text-gray-500 mb-1 block">問題文</label>
                            <textarea onchange="updateQuestionText(\${q.id}, this.value)" class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm" rows="2">\${q.question_text}</textarea>
                        </div>
                    \`;

                    if (isMultipleChoice) {
                        editorHtml += \`
                            <div class="space-y-2 mb-4" id="options-container-\${q.id}">
                                <label class="text-xs font-bold text-gray-500 mb-1 block">選択肢</label>
                                \${(q.options || []).map(opt => renderOptionHtml(q.id, opt)).join('')}
                                <button onclick="addOption(\${q.id})" class="text-sm text-blue-600 hover:underline flex items-center mt-2">
                                    <i class="fas fa-plus mr-1"></i>選択肢を追加
                                </button>
                            </div>
                        \`;
                    } else {
                        const correctOption = (q.options || []).find(o => o.is_correct) || { option_text: '' };
                        const correctId = correctOption.id || null;
                        
                        editorHtml += \`
                            <div class="mb-4">
                                <label class="text-xs font-bold text-gray-500 mb-1 block">正解の数値（または数式）</label>
                                <div class="flex items-center gap-2">
                                    <input type="text" value="\${correctOption.option_text}" 
                                           onchange="\${correctId ? \`updateOption(\${correctId}, {option_text: this.value})\` : \`addCorrectAnswer(\${q.id}, this.value)\`}"
                                           class="w-full p-2 border rounded text-sm font-mono" placeholder="例: 10, -5, 3.14">
                                </div>
                                <p class="text-xs text-gray-400 mt-1">※自動判定の基準となります</p>
                            </div>
                        \`;
                    }

                    div.innerHTML = \`
                        <div class="mb-2 font-bold \${textColor} text-xs uppercase flex items-center">
                            <i class="fas \${icon} mr-2"></i>\${typeLabel}
                        </div>
                        <div class="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition flex gap-2">
                            <button onclick="deleteQuestion(\${q.id}, this)" class="text-red-500 hover:bg-red-50 p-2 rounded"><i class="fas fa-trash"></i></button>
                        </div>
                        \${editorHtml}
                    \`;
                }
                
                return div;
            }

            function renderOptionHtml(qId, opt) {
                return \`
                    <div class="flex items-center gap-2" id="option-\${opt.id}">
                        <input type="radio" name="correct_\${qId}" \${opt.is_correct ? 'checked' : ''} 
                               onchange="updateOption(\${opt.id}, {is_correct: 1})"
                               class="text-blue-600 focus:ring-blue-500 cursor-pointer" title="正解を選択">
                        <input type="text" value="\${opt.option_text}" 
                               onchange="updateOption(\${opt.id}, {option_text: this.value})"
                               class="flex-1 p-2 border rounded text-sm" placeholder="選択肢を入力">
                        <button onclick="deleteOption(\${opt.id})" class="text-red-400 hover:text-red-600 p-1">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                \`;
            }

            function renderShapePreview(content) {
                let shapes = content.shapes || [];
                // 互換性: 古い形式の場合
                if (!content.shapes && content.shapeType) {
                    shapes = [{
                        type: content.shapeType,
                        color: content.color,
                        size: content.size,
                        x: 100, y: 100
                    }];
                }

                let svgContent = '';
                shapes.forEach(shape => {
                    const type = shape.type || 'rect';
                    const color = shape.color || '#3b82f6';
                    const size = parseInt(shape.size || 50);
                    const x = parseInt(shape.x || 100);
                    const y = parseInt(shape.y || 100);
                    const r = size / 2;
                    
                    if (type === 'rect') {
                        svgContent += \`<rect x="\${x-r}" y="\${y-r}" width="\${size}" height="\${size}" fill="\${color}" fill-opacity="0.9" stroke="black" stroke-width="1" />\`;
                    } else if (type === 'circle') {
                        svgContent += \`<circle cx="\${x}" cy="\${y}" r="\${r}" fill="\${color}" fill-opacity="0.9" stroke="black" stroke-width="1" />\`;
                    } else if (type === 'triangle') {
                        const h = size * Math.sqrt(3) / 2;
                        svgContent += \`<polygon points="\${x},\${y-h/2} \${x-r},\${y+h/2} \${x+r},\${y+h/2}" fill="\${color}" fill-opacity="0.9" stroke="black" stroke-width="1" />\`;
                    } else if (type === 'star') {
                        const points = [];
                        for (let i = 0; i < 10; i++) {
                            const angle = i * 36 * Math.PI / 180;
                            const radius = i % 2 === 0 ? r : r / 2;
                            points.push(\`\${x + radius * Math.sin(angle)},\${y - radius * Math.cos(angle)}\`);
                        }
                        svgContent += \`<polygon points="\${points.join(' ')}" fill="\${color}" fill-opacity="0.9" stroke="black" stroke-width="1" />\`;
                    } else if (type === 'pentagon') {
                        const points = [];
                        for (let i = 0; i < 5; i++) {
                            const angle = (i * 72 - 90) * Math.PI / 180;
                            points.push(\`\${x + r * Math.cos(angle)},\${y + r * Math.sin(angle)}\`);
                        }
                        svgContent += \`<polygon points="\${points.join(' ')}" fill="\${color}" fill-opacity="0.9" stroke="black" stroke-width="1" />\`;
                    } else if (type === 'arrow_right') {
                        const w = size;
                        const h = size / 2;
                        svgContent += \`<polygon points="\${x-w/2},\${y-h/4} \${x},\${y-h/4} \${x},\${y-h/2} \${x+w/2},\${y} \${x},\${y+h/2} \${x},\${y+h/4} \${x-w/2},\${y+h/4}" fill="\${color}" fill-opacity="0.9" stroke="black" stroke-width="1" />\`;
                    }
                });
                
                return \`<svg width="100%" height="100%" viewBox="0 0 200 200" style="background:white; border:1px solid #ddd;">
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" stroke-width="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    \${svgContent}
                </svg>\`;
            }

            // グラフデータ生成ヘルパー
            function getFunctionPlotData(content) {
                const data = [{ fn: content.fn || 'x^2', color: '#4f46e5' }];
                
                // 点
                if (content.points) {
                    content.points.forEach(p => {
                        data.push({
                            points: [[parseFloat(p.x), parseFloat(p.y)]],
                            fnType: 'points',
                            graphType: 'scatter',
                            color: p.color || 'red',
                            attr: { r: 4 }
                        });
                    });
                }
                
                // 線分
                if (content.segments) {
                    content.segments.forEach(s => {
                        data.push({
                            points: [
                                [parseFloat(s.x1), parseFloat(s.y1)],
                                [parseFloat(s.x2), parseFloat(s.y2)]
                            ],
                            fnType: 'points',
                            graphType: 'polyline',
                            color: s.color || 'green'
                        });
                    });
                }
                return data;
            }

            // グラフ要素操作ヘルパー
            async function addGraphElement(blockId, type) {
                const item = allItems.find(i => i.id === blockId && i.type === 'block');
                if (!item) return;
                
                if (type === 'point') {
                    if (!item.content.points) item.content.points = [];
                    item.content.points.push({ x: 0, y: 0, color: 'red' });
                    await updateBlock(blockId, 'points', item.content.points);
                } else if (type === 'segment') {
                    if (!item.content.segments) item.content.segments = [];
                    item.content.segments.push({ x1: 0, y1: 0, x2: 1, y2: 1, color: 'green' });
                    await updateBlock(blockId, 'segments', item.content.segments);
                }
                renderEditor();
            }

            async function removeGraphElement(blockId, type, index) {
                const item = allItems.find(i => i.id === blockId && i.type === 'block');
                if (!item) return;
                
                if (type === 'point' && item.content.points) {
                    item.content.points.splice(index, 1);
                    await updateBlock(blockId, 'points', item.content.points);
                } else if (type === 'segment' && item.content.segments) {
                    item.content.segments.splice(index, 1);
                    await updateBlock(blockId, 'segments', item.content.segments);
                }
                renderEditor();
            }

            async function updateGraphElement(blockId, type, index, key, value) {
                const item = allItems.find(i => i.id === blockId && i.type === 'block');
                if (!item) return;
                
                if (type === 'point' && item.content.points) {
                    item.content.points[index][key] = value;
                    await updateBlock(blockId, 'points', item.content.points);
                } else if (type === 'segment' && item.content.segments) {
                    item.content.segments[index][key] = value;
                    await updateBlock(blockId, 'segments', item.content.segments);
                }
            }

            // 図形リスト操作用ヘルパー
            async function addShapeToBlock(blockId, type) {
                const item = allItems.find(i => i.id === blockId && i.type === 'block');
                if (!item) return;
                
                if (!item.content.shapes) item.content.shapes = [];
                item.content.shapes.push({
                    type: type,
                    color: '#3b82f6',
                    size: 100,
                    x: 100, y: 100
                });
                
                await updateBlock(blockId, 'shapes', item.content.shapes);
                renderEditor();
            }

            async function removeShapeFromBlock(blockId, index) {
                const item = allItems.find(i => i.id === blockId && i.type === 'block');
                if (!item || !item.content.shapes) return;
                
                item.content.shapes.splice(index, 1);
                await updateBlock(blockId, 'shapes', item.content.shapes);
                renderEditor();
            }

            async function updateShapeInBlock(blockId, index, key, value) {
                const item = allItems.find(i => i.id === blockId && i.type === 'block');
                if (!item || !item.content.shapes) return;
                
                item.content.shapes[index][key] = value;
                await updateBlock(blockId, 'shapes', item.content.shapes);
                
                // プレビューのみ更新
                const previewEl = document.getElementById(\`shape-preview-\${blockId}\`);
                if (previewEl) {
                    previewEl.innerHTML = renderShapePreview(item.content);
                }
            }

            // 図形リスト操作用ヘルパー
            async function addShapeToBlock(blockId, type) {
                const item = allItems.find(i => i.id === blockId && i.type === 'block');
                if (!item) return;
                
                if (!item.content.shapes) {
                    // 既存データがあれば移行
                    if (item.content.shapeType) {
                        item.content.shapes = [{
                            type: item.content.shapeType,
                            color: item.content.color,
                            size: item.content.size,
                            x: 100, y: 100
                        }];
                    } else {
                        item.content.shapes = [];
                    }
                }
                
                item.content.shapes.push({
                    type: type,
                    color: '#3b82f6',
                    size: 100,
                    x: 100, y: 100
                });
                
                await updateBlock(blockId, 'shapes', item.content.shapes);
                renderEditor();
            }

            async function removeShapeFromBlock(blockId, index) {
                const item = allItems.find(i => i.id === blockId && i.type === 'block');
                if (!item || !item.content.shapes) return;
                
                item.content.shapes.splice(index, 1);
                await updateBlock(blockId, 'shapes', item.content.shapes);
                renderEditor();
            }

            async function updateShapeInBlock(blockId, index, key, value) {
                const item = allItems.find(i => i.id === blockId && i.type === 'block');
                if (!item || !item.content.shapes) return;
                
                item.content.shapes[index][key] = value;
                await updateBlock(blockId, 'shapes', item.content.shapes);
                
                // プレビューのみ更新
                const previewEl = document.getElementById(\`shape-preview-\${blockId}\`);
                if (previewEl) {
                    previewEl.innerHTML = renderShapePreview(item.content);
                }
            }


            // ブロック追加 (UI即時反映)
            async function addBlock(type) {
                const container = document.getElementById('content-blocks-container');
                const emptyMsg = document.getElementById('empty-msg');
                if(emptyMsg) emptyMsg.remove();

                let content = {};
                if (type === 'text') content = { text: '' };
                else if (type === 'image') content = { url: '' };
                else if (type === 'youtube') content = { videoId: '' };
                else if (type === 'shape') content = { shapeType: 'rect', color: '#3b82f6', size: 100 };
                else if (type === 'graph') content = { fn: 'x^2', xMin: -10, xMax: 10, yMin: -10, yMax: 10, grid: true };
                else if (type === 'chart') content = { chartType: 'bar', title: 'グラフタイトル', labels: '項目A,項目B,項目C', data: '10,20,15', color: '#3b82f6' };

                try {
                    const res = await axios.post('/api/teacher/content-blocks', {
                        step_id: currentStepId,
                        block_type: type,
                        content: content,
                        order_index: allItems.length
                    });
                    
                    const newItem = {
                        id: res.data.id,
                        block_type: type,
                        content: content,
                        order_index: allItems.length,
                        type: 'block'
                    };
                    
                    allItems.push(newItem);
                    container.appendChild(createItemElement(newItem));
                    
                    if (type === 'graph') {
                        setTimeout(() => {
                            try {
                                functionPlot({
                                    target: '#graph-editor-preview-' + newItem.id,
                                    width: 400,
                                    height: 240,
                                    grid: newItem.content.grid,
                                    xAxis: { domain: [parseFloat(newItem.content.xMin), parseFloat(newItem.content.xMax)] },
                                    yAxis: { domain: [parseFloat(newItem.content.yMin), parseFloat(newItem.content.yMax)] },
                                    data: getFunctionPlotData(newItem.content)
                                });
                            } catch(e) { console.error(e); }
                        }, 300);
                    }
                    if (type === 'chart') {
                        setTimeout(() => {
                            try {
                                const ctx = document.getElementById('chart-editor-preview-' + newItem.id);
                                if (ctx) {
                                    new Chart(ctx, {
                                        type: newItem.content.chartType,
                                        data: {
                                            labels: (newItem.content.labels || '').split(','),
                                            datasets: [{
                                                label: newItem.content.title || 'データ',
                                                data: (newItem.content.data || '').split(',').map(Number),
                                                backgroundColor: newItem.content.color || '#3b82f6',
                                                borderColor: newItem.content.color || '#3b82f6'
                                            }]
                                        },
                                        options: { responsive: true, maintainAspectRatio: false }
                                    });
                                }
                            } catch(e) { console.error(e); }
                        }, 300);
                    }
                    
                    // スクロール
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                } catch(e) {
                    console.error(e);
                    alert('追加に失敗しました');
                }
            }

            // ブロック更新
            async function updateBlock(id, key, value) {
                const item = allItems.find(i => i.id === id && i.type === 'block');
                if (!item) return;
                
                item.content[key] = value;
                
                try {
                    await axios.put(\`/api/teacher/content-blocks/\${id}\`, {
                        content: item.content
                    });
                    
                    // 図形のプレビュー即時更新
                    if (item.block_type === 'shape') {
                        const previewEl = document.getElementById(\`shape-preview-\${id}\`);
                        if (previewEl) {
                            previewEl.innerHTML = renderShapePreview(item.content);
                        }
                    }
                    
                    // グラフのプレビュー即時更新
                    if (item.block_type === 'graph') {
                        setTimeout(() => {
                            try {
                                functionPlot({
                                    target: '#graph-editor-preview-' + id,
                                    width: 400,
                                    height: 240,
                                    grid: item.content.grid,
                                    xAxis: { domain: [parseFloat(item.content.xMin), parseFloat(item.content.xMax)] },
                                    yAxis: { domain: [parseFloat(item.content.yMin), parseFloat(item.content.yMax)] },
                                    data: getFunctionPlotData(item.content)
                                });
                            } catch(e) {}
                        }, 50);
                    }
                    
                    // チャートのプレビュー即時更新
                    if (item.block_type === 'chart') {
                        setTimeout(() => {
                            try {
                                const canvasId = 'chart-editor-preview-' + id;
                                const oldCanvas = document.getElementById(canvasId);
                                if (oldCanvas) {
                                    const parent = oldCanvas.parentElement;
                                    const newCanvas = document.createElement('canvas');
                                    newCanvas.id = canvasId;
                                    parent.innerHTML = '';
                                    parent.appendChild(newCanvas);
                                    
                                    new Chart(newCanvas, {
                                        type: item.content.chartType,
                                        data: {
                                            labels: (item.content.labels || '').split(','),
                                            datasets: [{
                                                label: item.content.title || 'データ',
                                                data: (item.content.data || '').split(',').map(Number),
                                                backgroundColor: item.content.color || '#3b82f6',
                                                borderColor: item.content.color || '#3b82f6'
                                            }]
                                        },
                                        options: { responsive: true, maintainAspectRatio: false }
                                    });
                                }
                            } catch(e) { console.error(e); }
                        }, 50);
                    }
                } catch(e) {
                    console.error(e);
                    alert('保存に失敗しました');
                }
            }

            // ブロック削除 (UI即時反映)
            async function deleteBlock(id, btnElement) {
                if(!confirm('削除しますか？')) return;
                
                try {
                    await axios.delete(\`/api/teacher/content-blocks/\${id}\`);
                    // 配列から削除
                    allItems = allItems.filter(i => !(i.id === id && i.type === 'block'));
                    // DOMから削除
                    const el = btnElement.closest('.content-block');
                    if(el) el.remove();
                } catch(e) {
                    alert('削除に失敗しました');
                }
            }

            // 問題削除 (UI即時反映)
            async function deleteQuestion(id, btnElement) {
                if(!confirm('削除しますか？')) return;
                
                try {
                    await axios.delete(\`/api/teacher/questions/\${id}\`);
                    allItems = allItems.filter(i => !(i.id === id && i.type === 'question'));
                    const el = btnElement.closest('.content-block');
                    if(el) el.remove();
                } catch(e) {
                    alert('削除に失敗しました');
                }
            }

            // 問題追加 (UI即時反映)
            async function addQuestion(type) {
                const text = prompt('問題文を入力してください');
                if(!text) return;
                
                const container = document.getElementById('content-blocks-container');
                const emptyMsg = document.getElementById('empty-msg');
                if(emptyMsg) emptyMsg.remove();

                try {
                    const res = await axios.post('/api/teacher/questions', {
                        step_id: currentStepId,
                        question_type: type,
                        question_text: text,
                        config: {},
                        order_index: allItems.length
                    });

                    const newItem = {
                        id: res.data.id,
                        question_type: type,
                        question_text: text,
                        config: {},
                        order_index: allItems.length,
                        type: 'question',
                        options: []
                    };

                    if (type === 'multiple_choice') {
                        await axios.post('/api/teacher/question-options', { question_id: newItem.id, option_text: '選択肢1', is_correct: 1, order_index: 0 });
                        await axios.post('/api/teacher/question-options', { question_id: newItem.id, option_text: '選択肢2', is_correct: 0, order_index: 1 });
                        
                        loadContent(currentStepId, document.getElementById('current-step-title').textContent);
                        return; 
                    }
                    
                    allItems.push(newItem);
                    container.appendChild(createItemElement(newItem));
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

                } catch(e) {
                    console.error(e);
                    alert('追加に失敗しました');
                }
            }

            // 問題文更新
            async function updateQuestionText(id, text) {
                try {
                    await axios.put(\`/api/teacher/questions/\${id}\`, { question_text: text });
                } catch(e) {
                    alert('保存に失敗しました');
                }
            }

            // 選択肢追加
            async function addOption(questionId) {
                try {
                    const res = await axios.post('/api/teacher/question-options', {
                        question_id: questionId,
                        option_text: '新しい選択肢',
                        is_correct: 0,
                        order_index: 99
                    });
                    
                    // UIに追記
                    const newOpt = {
                        id: res.data.id,
                        question_id: questionId,
                        option_text: '新しい選択肢',
                        is_correct: 0
                    };
                    
                    const container = document.getElementById(\`options-container-\${questionId}\`);
                    const btn = container.querySelector('button');
                    const div = document.createElement('div');
                    div.innerHTML = renderOptionHtml(questionId, newOpt);
                    container.insertBefore(div.firstElementChild, btn);
                    
                } catch(e) {
                    alert('追加に失敗しました');
                }
            }

            // 正解追加（数値入力用）
            async function addCorrectAnswer(questionId, value) {
                try {
                    await axios.post('/api/teacher/question-options', {
                        question_id: questionId,
                        option_text: value,
                        is_correct: 1,
                        order_index: 0
                    });
                    loadContent(currentStepId, document.getElementById('current-step-title').textContent);
                } catch(e) {
                    alert('保存に失敗しました');
                }
            }

            // 選択肢更新
            async function updateOption(id, data) {
                // 現在のオプション情報を取得（リストから探す）
                let currentOption = null;
                let currentQuestion = null;
                
                // allItems から探す
                for(const item of allItems) {
                    if (item.type === 'question' && item.options) {
                        const opt = item.options.find(o => o.id === id);
                        if(opt) {
                            currentOption = opt;
                            currentQuestion = item;
                            break;
                        }
                    }
                }
                
                if(!currentOption) return;

                const newData = { ...currentOption, ...data };
                
                try {
                    // 正解フラグが立った場合、他の選択肢を不正解にする処理
                    if (data.is_correct === 1 && currentQuestion.question_type === 'multiple_choice') {
                        for (const opt of currentQuestion.options) {
                            if (opt.id !== id && opt.is_correct) {
                                await axios.put(\`/api/teacher/question-options/\${opt.id}\`, { ...opt, is_correct: 0 });
                            }
                        }
                    }

                    await axios.put(\`/api/teacher/question-options/\${id}\`, newData);
                    
                    // UIリロード（正解マークの移動などを反映するため）
                    if(data.is_correct !== undefined) {
                        // 簡易的にリロードせずDOM書き換えができればベストだが、ここではリロード
                        // loadContent は重いので、データだけ更新して再描画したいが、
                        // ここでは簡単のため loadContent
                        loadContent(currentStepId, document.getElementById('current-step-title').textContent);
                    }
                } catch(e) {
                    alert('保存に失敗しました');
                }
            }



            // 選択肢削除
            async function deleteOption(id) {
                try {
                    await axios.delete(\`/api/teacher/question-options/\${id}\`);
                    loadContent(currentStepId, document.getElementById('current-step-title').textContent);
                } catch(e) {
                    alert('削除に失敗しました');
                }
            }

            // プレビュー機能
            function previewContent() {
                const modal = document.getElementById('preview-modal');
                const content = document.getElementById('preview-content');
                modal.classList.remove('hidden');
                
                let html = '<div class="max-w-2xl mx-auto space-y-8">';
                
                // ブロック
                allItems.forEach((item, idx) => {
                    const blockId = 'preview-block-' + idx;
                    if (item.type === 'block') {
                        const b = item;
                        if(b.block_type === 'text') {
                            html += \`<div class="prose prose-lg">\${marked.parse(b.content.text || '')}</div>\`;
                        } else if(b.block_type === 'image') {
                            html += \`<img src="\${b.content.url}" class="rounded-xl shadow-lg w-full">\`;
                        } else if(b.block_type === 'youtube') {
                            html += \`<div class="aspect-video rounded-xl overflow-hidden shadow-lg"><iframe class="w-full h-full" src="https://www.youtube.com/embed/\${b.content.videoId}" frameborder="0" allowfullscreen></iframe></div>\`;
                        } else if(b.block_type === 'shape') {
                            html += \`<div class="flex justify-center">\${renderShapePreview(b.content)}</div>\`;
                        } else if(b.block_type === 'graph') {
                            html += \`<div id="\${blockId}" class="flex justify-center bg-white rounded-xl shadow-lg p-4"></div>\`;
                        } else if(b.block_type === 'chart') {
                            html += \`<div class="flex justify-center bg-white rounded-xl shadow-lg p-4 h-64"><canvas id="\${blockId}"></canvas></div>\`;
                        }
                    } else {
                        const q = item;
                        if (q.question_type === 'multiple_choice') {
                            html += \`
                                <div class="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
                                    <h4 class="font-bold text-lg mb-4 text-yellow-900">問題</h4>
                                    <p class="mb-4">\${q.question_text}</p>
                                    <div class="space-y-2">
                                        \${(q.options || []).map(opt => \`
                                            <button class="w-full p-3 text-left border rounded hover:bg-yellow-50 transition">\${opt.option_text}</button>
                                        \`).join('')}
                                    </div>
                                </div>
                            \`;
                        } else if (q.question_type === 'short_answer') {
                            html += \`
                                <div class="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
                                    <h4 class="font-bold text-lg mb-4 text-orange-900">問題</h4>
                                    <p class="mb-4">\${q.question_text}</p>
                                    <div class="flex gap-2">
                                        <input type="text" class="flex-1 p-3 border rounded" placeholder="回答を入力">
                                        <button class="bg-orange-500 text-white px-6 rounded font-bold">回答</button>
                                    </div>
                                </div>
                            \`;
                        }
                    }
                });
                
                html += '</div>';
                content.innerHTML = html;
                
                // MathJax適用
                if(window.MathJax) {
                    MathJax.typesetPromise([content]);
                }

                // グラフ描画 (DOM描画後に実行)
                setTimeout(() => {
                    allItems.forEach((item, idx) => {
                        if(item.type === 'block' && item.block_type === 'graph') {
                            try {
                                functionPlot({
                                    target: '#preview-block-' + idx,
                                    width: 580,
                                    height: 400,
                                    grid: item.content.grid,
                                    xAxis: { domain: [parseFloat(item.content.xMin), parseFloat(item.content.xMax)] },
                                    yAxis: { domain: [parseFloat(item.content.yMin), parseFloat(item.content.yMax)] },
                                    data: getFunctionPlotData(item.content)
                                });
                            } catch(e) {
                                console.error('Graph render error:', e);
                            }
                        }
                        if(item.type === 'block' && item.block_type === 'chart') {
                            try {
                                const ctx = document.getElementById('preview-block-' + idx);
                                if (ctx) {
                                    new Chart(ctx, {
                                        type: item.content.chartType,
                                        data: {
                                            labels: (item.content.labels || '').split(','),
                                            datasets: [{
                                                label: item.content.title || 'データ',
                                                data: (item.content.data || '').split(',').map(Number),
                                                backgroundColor: item.content.color || '#3b82f6',
                                                borderColor: item.content.color || '#3b82f6'
                                            }]
                                        },
                                        options: { responsive: true, maintainAspectRatio: false }
                                    });
                                }
                            } catch(e) { console.error('Chart render error:', e); }
                        }
                    });
                }, 300); // 描画タイミングを少し遅らせる
            }

            function closePreview() {
                document.getElementById('preview-modal').classList.add('hidden');
            }
        </script>
    </body>
    </html>
  `)
})

export default app
