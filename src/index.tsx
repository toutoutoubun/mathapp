import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { cors } from 'hono/cors'
import { jwt, sign, verify } from 'hono/jwt'

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  IMAGES?: R2Bucket;
}

const app = new Hono<{ Bindings: Bindings }>()
const JWT_SECRET = 'super-secret-key-change-this-in-prod';

// CORS設定
app.use('/*', cors())

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './' }))

// ==================== Auth API Routes ====================

// ログイン
app.post('/api/auth/login', async (c) => {
  try {
    const { DB } = c.env
    let body;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: '無効なリクエスト形式です' }, 400);
    }
    
    let { username, password } = body;
    
    if (!username || !password) {
        return c.json({ error: 'ユーザー名とパスワードを入力してください' }, 400);
    }
    
    // 入力の正規化（空白除去）
    if (typeof username === 'string') username = username.trim();
    if (typeof password === 'string') password = password.trim();
    
    // ユーザー名は大小文字区別なし、パスワードは区別あり
    const user = await DB.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE AND password = ?').bind(username, password).first()
    
    if (!user) {
      return c.json({ error: 'ユーザー名またはパスワードが間違っています' }, 401)
    }
    
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 1 week
    }
    
    const token = await sign(payload, JWT_SECRET, 'HS256')
    return c.json({ token, user: { id: user.id, username: user.username, role: user.role } })
  } catch (e) {
    console.error('Login Error:', e);
    return c.json({ error: 'ログイン処理中にエラーが発生しました' }, 500);
  }
})

// 登録（教師用）
app.post('/api/auth/register', async (c) => {
  const { DB } = c.env
  const { username, password, role } = await c.req.json()
  
  // 簡易実装：教師のみ登録可能とする（生徒は教師が作成する）
  if (role !== 'teacher') {
      return c.json({ error: '現在は教師アカウントのみ登録可能です' }, 400)
  }

  try {
    const result = await DB.prepare(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
    ).bind(username, password, role).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch(e) {
    return c.json({ error: 'ユーザー名が既に使用されています' }, 400)
  }
})

// 現在のユーザー情報取得
app.get('/api/auth/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json(null, 401);
  
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = await verify(token, JWT_SECRET, 'HS256');
    return c.json({ user: payload });
  } catch(e) {
    return c.json(null, 401);
  }
})

// ==================== Middleware ====================

// APIガード
app.use('/api/teacher/*', async (c, next) => {
    // 開発中はスキップしたい場合はここを調整
    // 今回は全保護
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
    
    try {
        const token = authHeader.replace('Bearer ', '');
        const payload = await verify(token, JWT_SECRET, 'HS256');
        if (payload.role !== 'teacher') return c.json({ error: 'Forbidden' }, 403);
        c.set('user', payload);
        await next();
    } catch(e) {
        console.error('Auth Error:', e);
        return c.json({ error: 'Unauthorized' }, 401);
    }
});

// 生徒用APIガード
app.use('/api/student/*', async (c, next) => {
    // 生徒用APIは、現在は「公開デモ」と「ログイン後」が混在しているため、
    // 厳密なガードを入れるとデモが見れなくなる。
    // ここでは、ヘッダーがあればユーザー情報をセットし、なければゲスト扱いとする。
    const authHeader = c.req.header('Authorization');
    if (authHeader) {
        try {
            const token = authHeader.replace('Bearer ', '');
            const payload = await verify(token, JWT_SECRET, 'HS256');
            c.set('user', payload);
        } catch(e) {
            // 無効なトークンだが、ゲストとして続行
        }
    }
    await next();
});

// ==================== Teacher API Routes ====================

// 生徒作成（教師が生徒アカウントを作る）
app.post('/api/teacher/students', async (c) => {
    const { DB } = c.env;
    const user = c.get('user'); // 教師情報
    let { username, password } = await c.req.json();
    
    // 入力の正規化
    if (username && typeof username === 'string') username = username.trim();
    if (password && typeof password === 'string') password = password.trim();
    
    // 自動生成ロジック
    if (!username) {
        // ランダムな6文字の英数字（大文字）
        username = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    if (!password) {
        // ランダムな6文字の数字（初期パスワード）
        password = Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    try {
        // 1. ユーザー作成
        const userRes = await DB.prepare(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
        ).bind(username, password, 'student').run();
        const studentId = userRes.meta.last_row_id;
        
        // 2. 教師との紐付け
        await DB.prepare(
            'INSERT INTO teacher_students (teacher_id, student_id) VALUES (?, ?)'
        ).bind(user.id, studentId).run();
        
        return c.json({ success: true, id: studentId, username, password });
    } catch(e) {
        return c.json({ error: '作成に失敗しました。ユーザー名が重複している可能性があります。' }, 400);
    }
});

// 既存の生徒を紐付け（他の教師が作成した生徒を追加）
app.post('/api/teacher/students/link', async (c) => {
    const { DB } = c.env;
    const user = c.get('user'); // 教師
    const { username } = await c.req.json(); // 生徒コード

    // 生徒を検索
    const student = await DB.prepare('SELECT * FROM users WHERE username = ? AND role = ?').bind(username, 'student').first();

    if (!student) {
        return c.json({ error: '生徒コードが見つかりません' }, 404);
    }

    // 既に紐付いているか確認
    const exists = await DB.prepare('SELECT * FROM teacher_students WHERE teacher_id = ? AND student_id = ?')
        .bind(user.id, student.id).first();

    if (exists) {
        return c.json({ error: '既にあなたの生徒として登録されています' }, 400);
    }

    // 紐付け作成
    await DB.prepare('INSERT INTO teacher_students (teacher_id, student_id) VALUES (?, ?)').bind(user.id, student.id).run();

    return c.json({ success: true, student });
});

// 教師が生徒になりすますためのトークン発行
app.post('/api/teacher/students/:id/impersonate', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  const studentId = c.req.param('id')

  // 生徒がこの教師に紐付いているか確認
  const student = await DB.prepare(`
    SELECT u.* FROM users u
    JOIN teacher_students ts ON u.id = ts.student_id
    WHERE u.id = ? AND ts.teacher_id = ?
  `).bind(studentId, user.id).first()

  if (!student) {
    return c.json({ error: 'Student not found or not linked to you' }, 404)
  }

  // 生徒用トークン生成
  const payload = {
    id: student.id,
    username: student.username,
    role: 'student',
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1時間有効
    impersonator_id: user.id
  }

  const token = await sign(payload, JWT_SECRET, 'HS256')
  return c.json({ token, user: { id: student.id, username: student.username, role: 'student' } })
})

// 生徒一覧取得
app.get('/api/teacher/students', async (c) => {
    const { DB } = c.env;
    const user = c.get('user');
    
    const result = await DB.prepare(`
        SELECT u.id, u.username, u.created_at, ts.memo
        FROM users u
        JOIN teacher_students ts ON u.id = ts.student_id
        WHERE ts.teacher_id = ?
    `).bind(user.id).all();
    
    return c.json({ students: result.results });
});

// 生徒情報更新（メモなど）
app.put('/api/teacher/students/:id', async (c) => {
    const { DB } = c.env;
    const user = c.get('user');
    const studentId = c.req.param('id');
    const { memo } = await c.req.json();
    
    await DB.prepare(
        'UPDATE teacher_students SET memo = ? WHERE teacher_id = ? AND student_id = ?'
    ).bind(memo, user.id, studentId).run();
    
    return c.json({ success: true });
});

// 生徒削除
app.delete('/api/teacher/students/:id', async (c) => {
    const { DB } = c.env;
    const user = c.get('user');
    const studentId = c.req.param('id');
    
    // 教師が管理している生徒か確認
    const link = await DB.prepare(
        'SELECT * FROM teacher_students WHERE teacher_id = ? AND student_id = ?'
    ).bind(user.id, studentId).first();
    
    if (!link) {
        return c.json({ error: '権限がありません' }, 403);
    }
    
    // 生徒ユーザーを削除（CASCADEで関連データも削除）
    await DB.prepare('DELETE FROM users WHERE id = ?').bind(studentId).run();
    
    return c.json({ success: true });
});

// 割り当て一覧取得
app.get('/api/teacher/assignments', async (c) => {
    const { DB } = c.env;
    const user = c.get('user');
    
    const result = await DB.prepare(`
        SELECT a.id, a.student_id, u.username as student_name, a.section_id, s.name as section_name
        FROM assignments a
        JOIN users u ON a.student_id = u.id
        JOIN sections s ON a.section_id = s.id
        WHERE a.teacher_id = ?
    `).bind(user.id).all();
    
    return c.json({ assignments: result.results });
});

// 割り当て作成（セクションを生徒に公開）
app.post('/api/teacher/assignments', async (c) => {
    const { DB } = c.env;
    const user = c.get('user');
    const { student_id, section_id } = await c.req.json();
    
    try {
        await DB.prepare(
            'INSERT INTO assignments (teacher_id, student_id, section_id) VALUES (?, ?, ?)'
        ).bind(user.id, student_id, section_id).run();
        return c.json({ success: true });
    } catch(e) {
        return c.json({ error: '既に割り当て済みです' }, 400);
    }
});

// 割り当て解除
app.delete('/api/teacher/assignments/:id', async (c) => {
    const { DB } = c.env;
    const user = c.get('user');
    const id = c.req.param('id');
    
    await DB.prepare('DELETE FROM assignments WHERE id = ? AND teacher_id = ?').bind(id, user.id).run();
    return c.json({ success: true });
});



// セクション一覧取得（教師の作成したもののみ）
app.get('/api/teacher/sections', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  const result = await DB.prepare('SELECT * FROM sections WHERE teacher_id = ? ORDER BY created_at DESC').bind(user.id).all()
  return c.json({ sections: result.results })
})

// セクション作成
app.post('/api/teacher/sections', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  const { name, description, grade_level, subject } = await c.req.json()
  
  // アクセスコード生成（ランダム英数字6文字）
  const access_code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const result = await DB.prepare(
    'INSERT INTO sections (name, description, grade_level, subject, teacher_id, access_code) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(name, description || null, grade_level || null, subject || null, user.id, access_code).run()
  
  return c.json({ success: true, id: result.meta.last_row_id, access_code })
})

// セクション更新
app.put('/api/teacher/sections/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const { name, description, grade_level, subject } = await c.req.json()
  
  await DB.prepare(
    'UPDATE sections SET name = ?, description = ?, grade_level = ?, subject = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(name, description || null, grade_level || null, subject || null, id).run()
  
  return c.json({ success: true })
})

// セクション削除
app.delete('/api/teacher/sections/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  // カスケード削除はDB定義で行われている前提だが、念のため関連データも意識する
  await DB.prepare('DELETE FROM sections WHERE id = ?').bind(id).run()
  
  return c.json({ success: true })
})

// ==================== Student API Routes ====================

// 生徒用ダッシュボードデータ一括取得
app.get('/api/student/dashboard', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  try {
      // 1. セクション取得
      const sectionsRes = await DB.prepare(`
        SELECT s.* 
        FROM sections s
        JOIN assignments a ON s.id = a.section_id
        WHERE a.student_id = ?
        ORDER BY s.grade_level, s.subject
      `).bind(user.id).all()
      
      // 2. フェーズ取得
      const phasesRes = await DB.prepare(`
        SELECT p.* 
        FROM phases p
        JOIN sections s ON p.section_id = s.id
        JOIN assignments a ON s.id = a.section_id
        WHERE a.student_id = ?
        ORDER BY p.order_index
      `).bind(user.id).all()
      
      // 3. モジュール取得
      const modulesRes = await DB.prepare(`
        SELECT m.*, p.section_id
        FROM modules m
        JOIN phases p ON m.phase_id = p.id
        JOIN sections s ON p.section_id = s.id
        JOIN assignments a ON s.id = a.section_id
        WHERE a.student_id = ?
        ORDER BY m.order_index
      `).bind(user.id).all()

      return c.json({ 
          sections: sectionsRes.results, 
          phases: phasesRes.results, 
          modules: modulesRes.results 
      })
  } catch(e) {
      console.error('Dashboard Error:', e)
      return c.json({ error: 'Failed to load dashboard data' }, 500)
  }
})

// セクション一覧取得（生徒用：割り当てられたもののみ）
app.get('/api/student/sections', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  
  if (!user) {
      return c.json({ sections: [] })
  }

  const result = await DB.prepare(`
    SELECT s.* 
    FROM sections s
    JOIN assignments a ON s.id = a.section_id
    WHERE a.student_id = ?
    ORDER BY s.grade_level, s.subject
  `).bind(user.id).all()
  
  return c.json({ sections: result.results })
})

// フェーズ一覧取得（生徒用）
app.get('/api/student/phases', async (c) => {
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

// モジュール一覧取得（生徒用）
app.get('/api/student/modules', async (c) => {
  const { DB } = c.env
  const phase_id = c.req.query('phase_id')
  
  let query = 'SELECT * FROM modules'
  if (phase_id) {
    query += ' WHERE phase_id = ?'
    const result = await DB.prepare(`
        SELECT m.*, p.section_id 
        FROM modules m 
        JOIN phases p ON m.phase_id = p.id
        WHERE m.phase_id = ?
        ORDER BY m.order_index
    `).bind(phase_id).all()
    return c.json({ modules: result.results })
  }
  
  const result = await DB.prepare(`
    SELECT m.*, p.section_id 
    FROM modules m 
    JOIN phases p ON m.phase_id = p.id
    ORDER BY m.order_index
  `).all()
  return c.json({ modules: result.results })
})

// アクセスコードでセクションに参加（生徒用）
app.post('/api/student/join', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  const { access_code } = await c.req.json()
  
  if (!user) {
      return c.json({ error: 'ログインが必要です' }, 401)
  }

  // コードからセクションを検索
  const section = await DB.prepare('SELECT * FROM sections WHERE access_code = ?').bind(access_code).first()
  
  if (!section) {
      return c.json({ error: '無効なアクセスコードです' }, 404)
  }

  // 既に割り当てられているか確認
  try {
      await DB.prepare(
          'INSERT INTO assignments (teacher_id, student_id, section_id) VALUES (?, ?, ?)'
      ).bind(section.teacher_id, user.id, section.id).run()
      
      return c.json({ success: true, section })
  } catch(e) {
      // 既に参加済みの場合はエラーを返す
      return c.json({ error: '既に参加済みのクラスです' }, 400)
  }
})

// ==================== Student API Routes ====================

// 生徒用ダッシュボードデータ一括取得
app.get('/api/student/dashboard', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  try {
      // 1. セクション取得
      const sectionsRes = await DB.prepare(`
        SELECT s.* 
        FROM sections s
        JOIN assignments a ON s.id = a.section_id
        WHERE a.student_id = ?
        ORDER BY s.grade_level, s.subject
      `).bind(user.id).all()
      
      // 2. フェーズ取得
      const phasesRes = await DB.prepare(`
        SELECT p.* 
        FROM phases p
        JOIN sections s ON p.section_id = s.id
        JOIN assignments a ON s.id = a.section_id
        WHERE a.student_id = ?
        ORDER BY p.order_index
      `).bind(user.id).all()
      
      // 3. モジュール取得
      const modulesRes = await DB.prepare(`
        SELECT m.*, p.section_id
        FROM modules m
        JOIN phases p ON m.phase_id = p.id
        JOIN sections s ON p.section_id = s.id
        JOIN assignments a ON s.id = a.section_id
        WHERE a.student_id = ?
        ORDER BY m.order_index
      `).bind(user.id).all()

      return c.json({ 
          sections: sectionsRes.results, 
          phases: phasesRes.results, 
          modules: modulesRes.results 
      })
  } catch(e) {
      console.error('Dashboard Error:', e)
      return c.json({ error: 'Failed to load dashboard data' }, 500)
  }
})

// ステップ一覧取得（生徒用）
app.get('/api/student/steps', async (c) => {
  const { DB } = c.env
  const module_id = c.req.query('module_id')
  
  if (!module_id) {
    return c.json({ error: 'module_id is required' }, 400)
  }
  
  // TODO: 生徒がこのモジュールにアクセス権があるかチェックすべき
  
  const result = await DB.prepare(
    'SELECT * FROM steps WHERE module_id = ? ORDER BY order_index'
  ).bind(module_id).all()
  
  return c.json({ steps: result.results })
})

// コンテンツブロック一覧取得（生徒用）
app.get('/api/student/content-blocks', async (c) => {
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

// 問題一覧取得（生徒用）
app.get('/api/student/questions', async (c) => {
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

// 進捗APIのミドルウェア（認証必須）
app.use('/api/progress', async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
    
    try {
        const token = authHeader.replace('Bearer ', '');
        const payload = await verify(token, JWT_SECRET, 'HS256');
        c.set('user', payload);
        await next();
    } catch(e) {
        console.error('Auth Error:', e);
        return c.json({ error: 'Unauthorized' }, 401);
    }
});

// 進捗状況取得
app.get('/api/progress', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  
  if (!user) {
      return c.json({ progress: [] })
  }
  
  const result = await DB.prepare(
    'SELECT * FROM user_progress WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(user.id).all()
  
  return c.json({ progress: result.results })
})

// 進捗状況更新
app.post('/api/progress', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  
  if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
  }

  const { module_id, step_id, status } = await c.req.json()
  
  console.log('[Progress Update]', { user_id: user.id, module_id, step_id, status })
  
  await DB.prepare(`
    INSERT INTO user_progress (user_id, module_id, step_id, status, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, module_id, step_id) 
    DO UPDATE SET status = ?, updated_at = CURRENT_TIMESTAMP
  `).bind(user.id, module_id, step_id, status, status).run()
  
  return c.json({ success: true })
})

// 解答履歴保存
app.post('/api/answer', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const { module_id, step_id, question_id, answer, is_correct, explanation } = await c.req.json()
  
  await DB.prepare(`
    INSERT INTO answer_history (user_id, module_id, step_id, question_id, answer, is_correct, explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(user.id, module_id, step_id, question_id, answer, is_correct ? 1 : 0, explanation).run()
  
  return c.json({ success: true })
})

// モジュールの解答履歴取得（正解した問題IDのリスト）
app.get('/api/answer-history', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const module_id = c.req.query('module_id')
  
  if (!module_id) {
    return c.json({ error: 'module_id is required' }, 400)
  }
  
  // 正解した問題IDを取得（最新の解答のみ）
  const result = await DB.prepare(`
    SELECT DISTINCT question_id
    FROM answer_history
    WHERE user_id = ? AND module_id = ? AND is_correct = 1
    AND id IN (
      SELECT MAX(id)
      FROM answer_history
      WHERE user_id = ? AND module_id = ?
      GROUP BY question_id
    )
  `).bind(user.id, module_id, user.id, module_id).all()
  
  const answeredQuestionIds = result.results.map(r => r.question_id)
  
  return c.json({ answeredQuestionIds })
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
  
  let query = 'SELECT * FROM glossary_terms'
  let params: string[] = []
  
  if (search) {
    query += ' WHERE term LIKE ? OR definition LIKE ? OR reading LIKE ?'
    params = [`%${search}%`, `%${search}%`, `%${search}%`]
  }
  
  query += ' ORDER BY term ASC'
  
  const result = await DB.prepare(query).bind(...params).all()
  
  return c.json({ glossary: result.results })
})

// 用語集作成
app.post('/api/teacher/glossary', async (c) => {
  const { DB } = c.env
  const { term, reading, definition, example, category } = await c.req.json()
  
  const result = await DB.prepare(
    'INSERT INTO glossary_terms (term, reading, definition, example, category) VALUES (?, ?, ?, ?, ?)'
  ).bind(term, reading || null, definition, example || null, category || null).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// 用語集更新
app.put('/api/teacher/glossary/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const { term, reading, definition, example, category } = await c.req.json()
  
  await DB.prepare(
    'UPDATE glossary_terms SET term = ?, reading = ?, definition = ?, example = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(term, reading || null, definition, example || null, category || null, id).run()
  
  return c.json({ success: true })
})

// 用語集削除
app.delete('/api/teacher/glossary/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare('DELETE FROM glossary_terms WHERE id = ?').bind(id).run()
  
  return c.json({ success: true })
})

// ==================== Image Upload API Routes ====================

// 画像アップロード
app.post('/api/teacher/upload-image', async (c) => {
  try {
    const { IMAGES } = c.env
    
    // R2が利用できない場合のフォールバック
    if (!IMAGES) {
      // Base64エンコードされた画像をレスポンスとして返す（開発環境用）
      const formData = await c.req.formData()
      const file = formData.get('image')
      
      if (!file || !(file instanceof File)) {
        return c.json({ error: 'ファイルがありません' }, 400)
      }
      
      // ファイルサイズチェック（5MB制限）
      if (file.size > 5 * 1024 * 1024) {
        return c.json({ error: 'ファイルサイズが大きすぎます（最大5MB）' }, 400)
      }
      
      // ファイルタイプチェック
      if (!file.type.startsWith('image/')) {
        return c.json({ error: '画像ファイルのみアップロード可能です' }, 400)
      }
      
      // ArrayBufferに変換してBase64エンコード
      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      const dataUrl = `data:${file.type};base64,${base64}`
      
      return c.json({ 
        success: true, 
        url: dataUrl,
        filename: file.name,
        note: 'R2バケットが設定されていないため、Base64エンコードされた画像を返しています'
      })
    }
    
    // R2が利用可能な場合
    const formData = await c.req.formData()
    const file = formData.get('image')
    
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'ファイルがありません' }, 400)
    }
    
    // ファイルサイズチェック（5MB制限）
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'ファイルサイズが大きすぎます（最大5MB）' }, 400)
    }
    
    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      return c.json({ error: '画像ファイルのみアップロード可能です' }, 400)
    }
    
    // ユニークなファイル名を生成
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const ext = file.name.split('.').pop() || 'jpg'
    const key = `images/${timestamp}-${randomStr}.${ext}`
    
    // R2にアップロード
    const arrayBuffer = await file.arrayBuffer()
    await IMAGES.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    })
    
    // 公開URLを生成（実際の環境に合わせて調整が必要）
    const publicUrl = `/api/images/${key}`
    
    return c.json({ 
      success: true, 
      url: publicUrl,
      filename: file.name,
      key: key
    })
  } catch (e: any) {
    console.error('Upload Error:', e)
    return c.json({ error: 'アップロードに失敗しました: ' + e.message }, 500)
  }
})

// 画像取得
app.get('/api/images/*', async (c) => {
  try {
    const { IMAGES } = c.env
    
    if (!IMAGES) {
      return c.text('R2 bucket not configured', 404)
    }
    
    const key = c.req.path.replace('/api/images/', '')
    const object = await IMAGES.get(key)
    
    if (!object) {
      return c.text('Image not found', 404)
    }
    
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    headers.set('cache-control', 'public, max-age=31536000')
    
    return new Response(object.body, {
      headers
    })
  } catch (e: any) {
    console.error('Image fetch error:', e)
    return c.text('Error fetching image', 500)
  }
})

// フェーズごとの進捗取得
app.get('/api/student/phase-progress', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  
  if (!user) {
      return c.json({ progress: [] })
  }

  // 1. フェーズごとの総ステップ数を取得
  // sections -> phases -> modules -> steps の階層を結合
  // 生徒に割り当てられたセクションのみを対象にする
  const phasesResult = await DB.prepare(`
    SELECT 
      p.id as phase_id, 
      p.name as phase_name, 
      p.section_id,
      s.name as section_name,
      COUNT(st.id) as total_steps
    FROM phases p
    JOIN sections s ON p.section_id = s.id
    JOIN assignments a ON s.id = a.section_id
    LEFT JOIN modules m ON p.id = m.phase_id
    LEFT JOIN steps st ON m.id = st.module_id
    WHERE a.student_id = ?
    GROUP BY p.id
  `).bind(user.id).all();

  // 2. フェーズごとの完了ステップ数を取得
  // user_progress -> steps -> modules の階層から集計
  const progressResult = await DB.prepare(`
    SELECT 
      m.phase_id, 
      COUNT(up.step_id) as completed_steps
    FROM user_progress up
    JOIN steps st ON CAST(up.step_id AS INTEGER) = st.id
    JOIN modules m ON st.module_id = m.id
    WHERE up.user_id = ? AND up.status = 'completed'
    GROUP BY m.phase_id
  `).bind(user.id).all();

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

// モジュールごとの完了状態取得
app.get('/api/student/module-completion', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  
  if (!user) {
    return c.json({ modules: [] })
  }

  // 各モジュールのステップ総数と完了数を取得
  const result = await DB.prepare(`
    SELECT 
      m.id as module_id,
      m.name as module_name,
      COUNT(DISTINCT s.id) as total_steps,
      COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.step_id END) as completed_steps
    FROM modules m
    LEFT JOIN steps s ON m.id = s.module_id
    LEFT JOIN user_progress up ON s.id = CAST(up.step_id AS INTEGER) AND up.user_id = ?
    WHERE m.phase_id IN (
      SELECT p.id FROM phases p
      JOIN sections sec ON p.section_id = sec.id
      JOIN assignments a ON sec.id = a.section_id
      WHERE a.student_id = ?
    )
    GROUP BY m.id
  `).bind(user.id, user.id).all()

  const modules = result.results.map((m: any) => {
    const isCompleted = m.total_steps > 0 && m.completed_steps === m.total_steps;
    return {
      module_id: m.module_id,
      module_name: m.module_name,
      total_steps: m.total_steps,
      completed_steps: m.completed_steps,
      is_completed: isCompleted
    };
  });

  return c.json({ modules })
})

// ==================== Q&A API Routes ====================

// 生徒の質問履歴取得
app.get('/api/student/my-questions', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  
  if (!user || user.role !== 'student') {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const result = await DB.prepare(`
    SELECT q.*, m.name as module_name, s.title as step_title
    FROM student_questions q
    LEFT JOIN modules m ON q.module_id = m.id
    LEFT JOIN steps s ON q.step_id = s.id
    WHERE q.student_id = ?
    ORDER BY q.created_at DESC
  `).bind(user.id).all()

  return c.json({ questions: result.results })
})

// 生徒からの質問投稿
app.post('/api/student/questions', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  const { module_id, step_id, question_text } = await c.req.json()
  
  if (!user || user.role !== 'student') {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // モジュール作成者のTeacher IDを取得
  const moduleInfo = await DB.prepare(`
    SELECT s.teacher_id 
    FROM modules m
    JOIN phases p ON m.phase_id = p.id
    JOIN sections s ON p.section_id = s.id
    WHERE m.id = ?
  `).bind(module_id).first()

  if (!moduleInfo) {
    return c.json({ error: 'Module not found' }, 404)
  }

  await DB.prepare(`
    INSERT INTO student_questions (student_id, teacher_id, module_id, step_id, question_text)
    VALUES (?, ?, ?, ?, ?)
  `).bind(user.id, moduleInfo.teacher_id, module_id, step_id || null, question_text).run()

  return c.json({ success: true })
})

// 教師用：質問一覧取得
app.get('/api/teacher/questions', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  
  if (!user || user.role !== 'teacher') {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const result = await DB.prepare(`
    SELECT q.*, u.username as student_name, m.name as module_name
    FROM student_questions q
    JOIN users u ON q.student_id = u.id
    LEFT JOIN modules m ON q.module_id = m.id
    WHERE q.teacher_id = ?
    ORDER BY q.created_at DESC
  `).bind(user.id).all()

  return c.json({ questions: result.results })
})

// 教師用：未返信件数取得
app.get('/api/teacher/questions/count', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  
  if (!user || user.role !== 'teacher') {
    return c.json({ count: 0 })
  }

  const result = await DB.prepare(`
    SELECT COUNT(*) as count FROM student_questions 
    WHERE teacher_id = ? AND status = 'open'
  `).bind(user.id).first()

  return c.json({ count: result.count })
})

// 教師用：返信送信
app.post('/api/teacher/questions/:id/reply', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  const questionId = c.req.param('id')
  const { reply_text } = await c.req.json()
  
  if (!user || user.role !== 'teacher') {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await DB.prepare(`
    UPDATE student_questions 
    SET reply_text = ?, status = 'replied', reply_at = CURRENT_TIMESTAMP
    WHERE id = ? AND teacher_id = ?
  `).bind(reply_text, questionId, user.id).run()

  return c.json({ success: true })
})

// ログイン画面（教師用）
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>教師ログイン - 学習アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-indigo-600">
            <h1 class="text-2xl font-bold text-center mb-2 text-indigo-600">教師ログイン</h1>
            <p class="text-center text-gray-500 mb-6 text-sm">先生用アカウントでログインしてください</p>
            <form id="login-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">ユーザー名</label>
                    <input type="text" name="username" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">パスワード</label>
                    <input type="password" name="password" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                </div>
                <button type="submit" class="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">ログイン</button>
            </form>
            <div class="mt-6 text-center space-y-2">
                <div><a href="/register" class="text-indigo-600 hover:underline text-sm">教師アカウント登録はこちら</a></div>
                <div><a href="/student/login" class="text-gray-500 hover:text-gray-700 text-sm">← 生徒ログインへ移動</a></div>
            </div>
        </div>
        <script>
            document.getElementById('login-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const json = await res.json();
                    
                    if (res.ok) {
                        if (json.user.role !== 'teacher') {
                            Swal.fire({
                                icon: 'warning',
                                title: 'アカウント間違い',
                                text: '生徒アカウントでは教師用画面にログインできません。生徒用ログイン画面へ移動してください。'
                            });
                            return;
                        }
                        localStorage.setItem('token', json.token);
                        localStorage.setItem('user', JSON.stringify(json.user));
                        window.location.href = '/teacher/sections';
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'ログイン失敗',
                            text: json.error || 'ログインに失敗しました (' + res.status + ')'
                        });
                    }
                } catch (e) {
                    console.error('Login Error:', e);
                    Swal.fire({
                        icon: 'error',
                        title: 'エラー',
                        text: 'エラーが発生しました: ' + e.message
                    });
                }
            });
        </script>
    </body>
    </html>
  `)
})

// 生徒用ログイン画面
app.get('/student/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>生徒ログイン - 学習アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-blue-50 min-h-screen flex items-center justify-center">
        <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-yellow-400">
            <div class="text-center mb-6">
                <i class="fas fa-graduation-cap text-5xl text-blue-500 mb-2"></i>
                <h1 class="text-3xl font-bold text-gray-800">生徒ログイン</h1>
                <p class="text-gray-500">今日も楽しく学びましょう！</p>
            </div>
            
            <form id="student-login-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">生徒コード</label>
                    <input type="text" name="username" required class="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-blue-50 transition" placeholder="先生から配られたコードを入力">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">パスワード</label>
                    <input type="password" name="password" required class="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-blue-50 transition">
                </div>
                <button type="submit" class="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-[1.02] transition shadow-md">
                    <i class="fas fa-sign-in-alt mr-2"></i>はじめる
                </button>
            </form>
            <div class="mt-8 text-center border-t pt-4">
                <a href="/login" class="text-gray-400 hover:text-gray-600 text-sm transition">
                    <i class="fas fa-chalkboard-teacher mr-1"></i>先生はこちら
                </a>
            </div>
        </div>
        <script>
            document.getElementById('student-login-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    const res = await axios.post('/api/auth/login', {
                        username: data.username,
                        password: data.password
                    });
                    const json = res.data;
                    
                    if (res.status === 200) {
                        if (json.user.role !== 'student') {
                            Swal.fire({
                                icon: 'warning',
                                title: 'アカウント間違い',
                                text: '教師アカウントでは生徒用画面にログインできません。教師用ログイン画面へ移動してください。'
                            });
                            return;
                        }
                        localStorage.setItem('token', json.token);
                        localStorage.setItem('user', JSON.stringify(json.user));
                        window.location.href = '/student';
                    }
                } catch (e) {
                    console.error('Login Error:', e);
                    if (e.response) {
                        Swal.fire({
                            icon: 'error',
                            title: 'ログイン失敗',
                            text: e.response.data.error || 'ログインに失敗しました (' + e.response.status + ')'
                        });
                    } else if (e.request) {
                        Swal.fire({
                            icon: 'error',
                            title: '通信エラー',
                            text: 'サーバーからの応答がありません。ネットワーク接続を確認してください。'
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'エラー',
                            text: '予期せぬエラーが発生しました: ' + e.message
                        });
                    }
                }
            });
        </script>
    </body>
    </html>
  `)
})

// 登録画面
app.get('/register', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>教師登録 - 学習アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
            <h1 class="text-2xl font-bold text-center mb-6 text-green-600">教師登録</h1>
            <form id="register-form" class="space-y-4">
                <input type="hidden" name="role" value="teacher">
                <div>
                    <label class="block text-sm font-medium text-gray-700">ユーザー名</label>
                    <input type="text" name="username" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">パスワード</label>
                    <input type="password" name="password" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500">
                </div>
                <button type="submit" class="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">登録</button>
            </form>
            <div class="mt-4 text-center text-sm">
                <a href="/login" class="text-green-600 hover:underline">ログインはこちら</a>
            </div>
        </div>
        <script>
            document.getElementById('register-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    const res = await axios.post('/api/auth/register', {
                        username: data.username,
                        password: data.password,
                        role: data.role
                    });
                    const json = res.data;
                    
                    if (res.status === 200) {
                        await Swal.fire({
                            icon: 'success',
                            title: '登録完了',
                            text: '登録しました。ログインしてください。'
                        });
                        window.location.href = '/login';
                    }
                } catch (e) {
                    if (e.response) {
                        Swal.fire({
                            icon: 'error',
                            title: '登録失敗',
                            text: e.response.data.error || '登録に失敗しました'
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'エラー',
                            text: 'エラーが発生しました'
                        });
                    }
                }
            });
        </script>
    </body>
    </html>
  `)
})

// ==================== HTML Routes ====================

// ポータル画面（入り口）
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>学習アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-4xl w-full">
            <div class="text-center mb-12">
                <h1 class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                    <span class="text-indigo-600">Learning</span> App
                </h1>
                <p class="text-xl text-gray-600">楽しく学び、教えるためのプラットフォーム</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                <!-- 生徒用入り口 -->
                <a href="/student/login" class="group block bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-1 border-b-8 border-yellow-400">
                    <div class="bg-blue-500 p-6 text-center group-hover:bg-blue-600 transition">
                        <i class="fas fa-user-graduate text-6xl text-white"></i>
                    </div>
                    <div class="p-8 text-center">
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">生徒のみなさん</h2>
                        <p class="text-gray-500 mb-6">ログインして学習を始めましょう！</p>
                        <span class="inline-block px-6 py-3 bg-yellow-400 text-yellow-900 font-bold rounded-full group-hover:bg-yellow-300 transition">
                            生徒ログイン <i class="fas fa-arrow-right ml-2"></i>
                        </span>
                    </div>
                </a>

                <!-- 教師用入り口 -->
                <a href="/login" class="group block bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-1 border-b-8 border-indigo-600">
                    <div class="bg-gray-800 p-6 text-center group-hover:bg-gray-700 transition">
                        <i class="fas fa-chalkboard-teacher text-6xl text-white"></i>
                    </div>
                    <div class="p-8 text-center">
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">先生方</h2>
                        <p class="text-gray-500 mb-6">教材の作成や進捗の管理はこちら</p>
                        <span class="inline-block px-6 py-3 bg-indigo-600 text-white font-bold rounded-full group-hover:bg-indigo-500 transition">
                            教師ログイン <i class="fas fa-arrow-right ml-2"></i>
                        </span>
                    </div>
                </a>
            </div>
            
            <div class="text-center mt-12 text-gray-400 text-sm">
                &copy; 2026 Learning App Platform
            </div>
        </div>
    </body>
    </html>
  `)
})

// メインページ - 教師用プラットフォーム
app.get('/teacher', (c) => {
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
                    <div class="flex gap-4 items-center">
                        <span class="text-sm bg-white/20 px-3 py-1 rounded-full"><i class="fas fa-user mr-1"></i>先生モード</span>
                        <a href="/teacher/students" class="px-4 py-2 bg-indigo-800 rounded-lg hover:bg-indigo-900 transition text-sm">
                            <i class="fas fa-users mr-1"></i>生徒管理
                        </a>
                        <a href="/teacher/questions" class="relative px-4 py-2 bg-indigo-800 rounded-lg hover:bg-indigo-900 transition text-sm">
                            <i class="fas fa-comments mr-1"></i>質問管理
                            <span id="question-badge" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center hidden">0</span>
                        </a>
                        <a href="/" class="px-4 py-2 bg-indigo-800 rounded-lg hover:bg-indigo-900 transition text-sm">
                            <i class="fas fa-sign-out-alt mr-1"></i>ログアウト
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- メインコンテンツ -->
        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- Auth Check Script -->
            <script>
                const token = localStorage.getItem('token');
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                
                if (!token || user.role !== 'teacher') {
                    window.location.href = '/login';
                }

                // 通知バッジ更新 (定期実行)
                function updateBadge() {
                    fetch('/api/teacher/questions/count', {
                        headers: { 'Authorization': 'Bearer ' + token }
                    })
                    .then(res => res.json())
                    .then(data => {
                        const badge = document.getElementById('question-badge');
                        if (data.count > 0) {
                            badge.textContent = data.count;
                            badge.classList.remove('hidden');
                        } else {
                            badge.classList.add('hidden');
                        }
                    })
                    .catch(err => console.error(err));
                }
                
                updateBadge();
                setInterval(updateBadge, 30000); // 30秒ごとに更新
            </script>

            <!-- ウェルカムセクション -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div class="text-center">
                    <div class="text-6xl mb-4">🎓</div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">教師用管理画面</h2>
                    <p class="text-lg text-gray-600 mb-6">
                        学年単位で学習コンテンツを作成できるプラットフォームです。<br>
                        <strong>セクション（学年）→ フェーズ（大単元）→ モジュール（中単元）→ ステップ（学習内容）</strong>
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
                        <h4 class="font-bold text-gray-800 mb-1">セクション</h4>
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

                <!-- 生徒管理 -->
                <a href="/teacher/students" class="block p-6 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">👥</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">生徒管理</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        生徒コードの発行と管理
                    </p>
                    <div class="flex items-center text-teal-600 font-semibold">
                        管理画面へ
                        <i class="fas fa-arrow-right ml-2"></i>
                    </div>
                </a>

                <!-- 用語集管理 -->
                <a href="/teacher/glossary" class="block p-6 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">📖</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">用語集管理</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        学習用語の登録と編集
                    </p>
                    <div class="flex items-center text-orange-600 font-semibold">
                        管理画面へ
                        <i class="fas fa-arrow-right ml-2"></i>
                    </div>
                </a>

                <!-- 質問管理 -->
                <a href="/teacher/questions" class="block p-6 bg-gradient-to-br from-red-100 to-red-200 rounded-xl hover:shadow-xl transition transform hover:-translate-y-1">
                    <div class="text-5xl mb-4">💬</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">質問管理</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        生徒からの質問を確認・返信
                    </p>
                    <div class="flex items-center text-red-600 font-semibold">
                        管理画面へ
                        <i class="fas fa-arrow-right ml-2"></i>
                    </div>
                </a>

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
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ナビゲーションバー -->
        <nav class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 py-3">
                <div class="flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-graduation-cap mr-2 text-gray-600"></i>
                        学習アプリ
                    </h1>
                    <div class="flex gap-3 items-center">
                        <!-- セクション選択プルダウン -->
                        <select id="section-select" class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-400 focus:outline-none text-sm">
                            <option value="">すべての学年</option>
                        </select>
                        <a href="/student" class="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition text-sm">
                            <i class="fas fa-home mr-1"></i>ホーム
                        </a>
                        <a href="/student/glossary" class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition text-sm">
                            <i class="fas fa-book mr-1"></i>用語集
                        </a>
                        <a href="/" class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition text-sm">
                            <i class="fas fa-sign-out-alt mr-1"></i>ログアウト
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- メインコンテンツ -->
        <div class="max-w-7xl mx-auto px-4 py-6">
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6 border">
                <h2 class="text-2xl font-bold text-gray-800 mb-2">ようこそ!</h2>
                <p class="text-sm text-gray-600">
                    自分のペースで学習を進めていきましょう。
                </p>
            </div>

            <!-- クラスコード参加フォーム -->
            <div class="bg-white rounded-lg shadow-sm p-4 mb-6 border">
                <form id="join-form" class="flex gap-2">
                    <input type="text" name="access_code" placeholder="クラスコードを入力" required
                           class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-400 uppercase font-mono text-sm">
                    <button type="submit" class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition text-sm">
                        <i class="fas fa-plus mr-1"></i>参加
                    </button>
                </form>
            </div>

            <!-- コンテンツをモジュール別に表示 -->
            <div id="modules-container">
                <div class="text-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script>
            document.addEventListener('DOMContentLoaded', async () => {
                // プレビュー用トークン処理 & Auth設定
                const urlParams = new URLSearchParams(window.location.search);
                const previewToken = urlParams.get('preview_token');
                
                if (previewToken) {
                    const previewUser = urlParams.get('preview_user');
                    
                    // 既存のトークン（教師用）があれば退避
                    const currentToken = localStorage.getItem('token');
                    const currentUser = localStorage.getItem('user');
                    if (currentToken) {
                        try {
                            const userObj = JSON.parse(currentUser || '{}');
                            if (userObj.role === 'teacher') {
                                localStorage.setItem('original_token', currentToken);
                                localStorage.setItem('original_user', currentUser);
                            }
                        } catch(e) {}
                    }
                    
                    localStorage.setItem('token', previewToken);
                    if (previewUser) {
                        try { localStorage.setItem('user', decodeURIComponent(previewUser)); } catch(e){}
                    }
                    window.history.replaceState({}, document.title, window.location.pathname);
                    axios.defaults.headers.common['Authorization'] = 'Bearer ' + previewToken;
                    
                    // プレビュー用ヘッダーを表示
                    const previewHeader = document.createElement('div');
                    previewHeader.className = 'bg-gray-700 text-white px-4 py-2 flex justify-between items-center border-b relative z-50';
                    previewHeader.innerHTML = \`
                        <div class="font-medium flex items-center text-sm">
                            <i class="fas fa-eye mr-2"></i>教師用プレビューモード
                        </div>
                        <button onclick="exitPreview()" class="bg-white text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-100 transition">
                            <i class="fas fa-times mr-1"></i>プレビュー終了
                        </button>
                    \`;
                    document.body.prepend(previewHeader);
                    
                    window.exitPreview = function() {
                        const originalToken = localStorage.getItem('original_token');
                        const originalUser = localStorage.getItem('original_user');
                        
                        if (originalToken && originalUser) {
                            localStorage.setItem('token', originalToken);
                            localStorage.setItem('user', originalUser);
                            localStorage.removeItem('original_token');
                            localStorage.removeItem('original_user');
                            window.location.href = '/teacher/students';
                        } else {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/login';
                        }
                    };
                } else {
                    const token = localStorage.getItem('token');
                    if (token) {
                        axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
                    } else {
                        window.location.href = '/student/login';
                        return;
                    }
                }

                // ページ表示時（キャッシュ復帰含む）にデータを再読み込み
                loadDashboardData();
                window.addEventListener('pageshow', (event) => {
                    if (event.persisted) {
                        loadDashboardData();
                    }
                });

                // コード参加処理
                const joinForm = document.getElementById('join-form');
                if (joinForm) {
                    joinForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const code = formData.get('access_code');
                        
                        try {
                            const res = await axios.post('/api/student/join', { access_code: code });
                            if (res.data.success) {
                                await Swal.fire({ icon: 'success', title: '参加しました！', text: \`「\${res.data.section.name}」に参加しました！\` });
                                loadDashboardData(); // リロードではなくデータ再読み込み
                            }
                        } catch(e) {
                            if (e.response && e.response.status === 404) {
                                Swal.fire({ icon: 'error', title: 'エラー', text: '無効なコードです' });
                            } else if (e.response && e.response.status === 400) {
                                Swal.fire({ icon: 'info', title: '参加済み', text: e.response.data.error || '既に参加済みのクラスです' });
                            } else if (e.response && e.response.status === 401) {
                                window.location.href = '/login';
                            } else {
                                Swal.fire({ icon: 'error', title: 'エラー', text: 'エラーが発生しました' });
                            }
                        }
                    });
                }

            // データ読み込み関数
            async function loadDashboardData() {
                const container = document.getElementById('modules-container');
                const sectionSelect = document.getElementById('section-select');
                
                try {
                    // 1. ダッシュボードデータ一括取得
                    const res = await axios.get('/api/student/dashboard');
                    const { sections, phases, modules } = res.data;
                    
                    // 2. セクションセレクトボックスの初期化
                    if (sectionSelect && sectionSelect.options.length <= 1) {
                        sectionSelect.innerHTML = '<option value="">すべての学年</option>' + 
                            sections.map(s => \`<option value="\${s.id}">\${s.name}</option>\`).join('');
                    }
                    
                    // 3. データの構造化: Section -> Phase -> Modules
                    const sectionMap = new Map(sections.map(s => [s.id, { ...s, phases: [] }]));
                    const phaseMap = new Map(phases.map(p => [p.id, { ...p, modules: [] }]));
                    
                    // モジュールをフェーズに追加
                    modules.forEach(module => {
                        const phase = phaseMap.get(module.phase_id);
                        if (phase) {
                            phase.modules.push(module);
                        }
                    });
                    
                    // フェーズをセクションに追加
                    phases.forEach(phase => {
                        const section = sectionMap.get(phase.section_id);
                        const phaseData = phaseMap.get(phase.id);
                        if (section && phaseData && phaseData.modules.length > 0) {
                            section.phases.push(phaseData);
                        }
                    });
                    
                    // 4. 進捗データ取得
                    const progressRes = await axios.get('/api/student/phase-progress');
                    const progressMap = new Map(progressRes.data.progress.map(p => [p.phase_id, p]));
                    
                    // 4.5 モジュール完了状態取得
                    const moduleCompletionRes = await axios.get('/api/student/module-completion');
                    const moduleCompletionMap = new Map(moduleCompletionRes.data.modules.map(m => [m.module_id, m]));
                    
                    // 5. モジュール別表示のレンダリング
                    const renderModules = (filterSectionId = '') => {
                        const sectionsToDisplay = filterSectionId 
                            ? [sectionMap.get(parseInt(filterSectionId))].filter(Boolean)
                            : Array.from(sectionMap.values()).filter(s => s.phases.length > 0);
                        
                        if (sectionsToDisplay.length === 0) {
                            container.innerHTML = \`
                                <div class="text-center py-12 bg-white rounded-lg border">
                                    <p class="text-gray-500">まだコンテンツが公開されていません。</p>
                                </div>
                            \`;
                            return;
                        }
                        
                        let html = '';
                        
                        sectionsToDisplay.forEach(section => {
                            html += \`
                                <div class="bg-white rounded-lg shadow-sm border mb-6" data-section-id="\${section.id}">
                                    <div class="p-4 border-b bg-gray-50">
                                        <h3 class="text-lg font-bold text-gray-800">\${section.name}</h3>
                                        <p class="text-sm text-gray-600 mt-1">\${section.description || ''}</p>
                                    </div>
                                    <div class="p-4 space-y-4">
                            \`;
                            
                            section.phases.forEach(phase => {
                                const progress = progressMap.get(phase.id);
                                const percentage = progress ? progress.percentage : 0;
                                const completedSteps = progress ? progress.completed_steps : 0;
                                const totalSteps = progress ? progress.total_steps : 0;
                                const isPhaseCompleted = percentage === 100;
                                
                                html += \`
                                    <div class="border rounded-lg p-4 hover:border-gray-400 transition">
                                        <div class="flex justify-between items-start mb-3">
                                            <div class="flex items-center gap-2">
                                                <h4 class="font-bold text-gray-800">\${phase.name}</h4>
                                                \${isPhaseCompleted ? '<span class="text-green-600"><i class="fas fa-check-circle"></i></span>' : ''}
                                            </div>
                                            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">\${percentage}%</span>
                                        </div>
                                        <p class="text-sm text-gray-600 mb-3">\${phase.description || ''}</p>
                                        
                                        <!-- 進捗バー -->
                                        <div class="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                                            <div class="bg-\${isPhaseCompleted ? 'green' : 'gray'}-600 h-1.5 rounded-full" style="width: \${percentage}%"></div>
                                        </div>
                                        
                                        <!-- モジュール一覧 -->
                                        <div class="space-y-2">
                                \`;
                                
                                phase.modules.forEach(module => {
                                    const moduleCompletion = moduleCompletionMap.get(module.id);
                                    const isModuleCompleted = moduleCompletion ? moduleCompletion.is_completed : false;
                                    
                                    html += \`
                                        <div class="p-3 bg-gray-50 rounded border border-gray-200">
                                            <div class="flex items-center justify-between mb-2">
                                                <a href="/student/modules/\${module.id}" 
                                                   class="flex items-center gap-3 flex-1 hover:text-indigo-600 transition">
                                                    <span class="text-2xl">\${module.icon || '📝'}</span>
                                                    <div>
                                                        <div class="font-medium text-gray-800 flex items-center gap-2">
                                                            \${module.name}
                                                            \${isModuleCompleted ? '<span class="text-green-600 text-sm"><i class="fas fa-check-circle"></i> 完了</span>' : ''}
                                                        </div>
                                                        <div class="text-xs text-gray-500">\${module.description || ''}</div>
                                                    </div>
                                                </a>
                                                <div class="flex items-center gap-2">
                                                    \${isModuleCompleted ? \`
                                                        <a href="/student/modules/\${module.id}?review=true" 
                                                           class="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition whitespace-nowrap">
                                                            <i class="fas fa-redo-alt mr-1"></i>復習
                                                        </a>
                                                    \` : ''}
                                                    <a href="/student/modules/\${module.id}" class="text-gray-400 hover:text-gray-600">
                                                        <i class="fas fa-chevron-right"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    \`;
                                });
                                
                                html += \`
                                        </div>
                                    </div>
                                \`;
                            });
                            
                            html += \`
                                    </div>
                                </div>
                            \`;
                        });
                        
                        container.innerHTML = html;
                    };
                    
                    renderModules(sectionSelect ? sectionSelect.value : '');
                    
                    // 6. セレクトボックスのイベント設定
                    if (sectionSelect) {
                        const newSelect = sectionSelect.cloneNode(true);
                        sectionSelect.parentNode.replaceChild(newSelect, sectionSelect);
                        
                        newSelect.addEventListener('change', (e) => {
                            renderModules(e.target.value);
                        });
                    }

                } catch (e) {
                    console.error(e);
                    container.innerHTML = '<p class="text-red-500 text-center">コンテンツの読み込みに失敗しました。</p>';
                }
            }

            });
        </script>
    </body>
    </html>
  `)
})

// デモページ - 数学学習アプリ（生徒用）

// 生徒用汎用モジュールビューアー
app.get('/student/modules/:id', async (c) => {
  const moduleId = c.req.param('id');
  const isPreview = c.req.query('preview') === 'true';
  const { DB } = c.env;
  
  const module = await DB.prepare('SELECT * FROM modules WHERE id = ?').bind(moduleId).first();
  
  if (!module) {
    return c.text('Module not found', 404);
  }

  const homeLink = '/student';
  const homeText = 'ホームに戻る';

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
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
        <script>
          window.MathJax = {
            tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']] }
          };
        </script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <style>
            .content-block { margin-bottom: 2rem; }
            .highlight-text {
                transition: background-color 0.2s;
            }
            .highlight-text:hover {
                opacity: 0.8;
            }
            .highlight-marker {
                transition: transform 0.2s;
            }
            .highlight-marker:hover {
                transform: scale(1.2);
            }
            #content-area.highlight-mode {
                user-select: text;
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
            }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <nav class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 py-3">
                <div class="flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-book-open mr-2 text-gray-600"></i>
                        ${module.name}
                    </h1>
                    <div class="flex items-center gap-2">
                        <button id="highlight-btn" class="px-3 py-2 border border-yellow-400 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition text-sm" style="display: none;">
                            <i class="fas fa-highlighter mr-1"></i>ハイライト
                        </button>
                        <button id="question-btn" class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition text-sm">
                            <i class="fas fa-question-circle mr-1"></i>先生に質問
                        </button>
                        <button id="history-btn" onclick="showQuestionHistory()" class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition text-sm">
                            <i class="fas fa-history mr-1"></i>質問履歴
                        </button>
                        <a href="${homeLink}" class="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition text-sm">
                            <i class="fas fa-home mr-1"></i>${homeText}
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-4xl mx-auto px-4 py-6">
            <div class="bg-white rounded-lg shadow-sm border p-3 mb-4 overflow-x-auto">
                <div class="flex space-x-2" id="step-nav"></div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border p-6 mb-4 min-h-[400px]" id="content-area">
                <div class="text-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
                    <p class="mt-4 text-gray-500">読み込み中...</p>
                </div>
            </div>

            <div class="flex justify-between">
                <button id="prev-btn" class="px-5 py-2 border border-gray-300 text-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-100 transition" disabled>
                    <i class="fas fa-arrow-left mr-2"></i>前へ
                </button>
                <button id="next-btn" class="px-5 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition">
                    次へ<i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // Auth Token Setup
          const token = localStorage.getItem('token');
          if (token) {
              axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
          } else {
              window.location.href = '/login';
          }
            const MODULE_ID = ${moduleId};
            const IS_PREVIEW = ${isPreview ? 'true' : 'false'};
            let steps = [];
            let currentQuestions = [];
            let currentStepIndex = 0;
            let currentStep = null;
            let cachedUser = null;

            document.addEventListener('DOMContentLoaded', async () => {
                cachedUser = getCurrentUser();
                initializeQuestionButton();
                initializeHighlightTool();
                await loadSteps();
            });

            function getCurrentUser() {
                const raw = localStorage.getItem('user');
                if (!raw) return null;
                try {
                    return JSON.parse(raw);
                } catch (e) {
                    return null;
                }
            }

            function initializeQuestionButton() {
                const btn = document.getElementById('question-btn');
                const historyBtn = document.getElementById('history-btn');
                if (!btn) return;

                btn.removeAttribute('disabled');
                btn.classList.remove('opacity-60', 'cursor-not-allowed');
                btn.title = '';
                
                if (historyBtn) {
                    historyBtn.removeAttribute('disabled');
                    historyBtn.classList.remove('opacity-60', 'cursor-not-allowed');
                }

                if (IS_PREVIEW) {
                    btn.disabled = true;
                    btn.classList.add('opacity-60', 'cursor-not-allowed');
                    btn.title = 'プレビュー中は質問を送信できません';
                    
                    if (historyBtn) {
                        historyBtn.disabled = true;
                        historyBtn.classList.add('opacity-60', 'cursor-not-allowed');
                    }
                    return;
                }

                if (!cachedUser || cachedUser.role !== 'student') {
                    btn.disabled = true;
                    btn.classList.add('opacity-60', 'cursor-not-allowed');
                    btn.title = '生徒アカウントでログインすると質問できます';
                    
                    if (historyBtn) {
                        historyBtn.disabled = true;
                        historyBtn.classList.add('opacity-60', 'cursor-not-allowed');
                    }
                    return;
                }

                if (btn.dataset.bound === 'true') return;
                btn.addEventListener('click', handleQuestionClick);
                btn.dataset.bound = 'true';
            }

            // ハイライトツールの初期化
            let highlightMode = false;
            let highlightColor = '#fef08a'; // yellow-200

            function initializeHighlightTool() {
                const highlightBtn = document.getElementById('highlight-btn');
                if (!highlightBtn) return;

                // プレビューモードでのみ表示
                if (IS_PREVIEW || (cachedUser && cachedUser.role === 'teacher')) {
                    highlightBtn.style.display = 'block';
                }

                highlightBtn.addEventListener('click', toggleHighlightMode);
                
                // カラーピッカーを追加
                const colorPicker = document.createElement('input');
                colorPicker.type = 'color';
                colorPicker.value = highlightColor;
                colorPicker.className = 'ml-2 h-6 w-6 rounded cursor-pointer';
                colorPicker.style.display = 'none';
                colorPicker.id = 'highlight-color-picker';
                colorPicker.addEventListener('change', (e) => {
                    highlightColor = e.target.value;
                });
                highlightBtn.parentNode.insertBefore(colorPicker, highlightBtn.nextSibling);
            }

            function toggleHighlightMode() {
                highlightMode = !highlightMode;
                const highlightBtn = document.getElementById('highlight-btn');
                const colorPicker = document.getElementById('highlight-color-picker');
                
                if (highlightMode) {
                    highlightBtn.classList.remove('bg-yellow-50', 'hover:bg-yellow-100');
                    highlightBtn.classList.add('bg-yellow-200');
                    highlightBtn.innerHTML = '<i class="fas fa-highlighter mr-1"></i>ハイライト中...';
                    if (colorPicker) colorPicker.style.display = 'inline-block';
                    
                    // コンテンツエリアにハイライトモードを適用
                    enableHighlightSelection();
                } else {
                    highlightBtn.classList.remove('bg-yellow-200');
                    highlightBtn.classList.add('bg-yellow-50', 'hover:bg-yellow-100');
                    highlightBtn.innerHTML = '<i class="fas fa-highlighter mr-1"></i>ハイライト';
                    if (colorPicker) colorPicker.style.display = 'none';
                    
                    // ハイライトモードを解除
                    disableHighlightSelection();
                }
            }

            function enableHighlightSelection() {
                const contentArea = document.getElementById('content-area');
                if (!contentArea) return;

                contentArea.style.cursor = 'text';
                
                // テキスト選択時のイベント
                contentArea.addEventListener('mouseup', handleTextSelection);
                
                // SVG要素（図形・グラフ）のクリックイベント
                const svgElements = contentArea.querySelectorAll('svg, canvas');
                svgElements.forEach(el => {
                    el.style.cursor = 'crosshair';
                    el.addEventListener('click', handleSvgClick);
                });
            }

            function disableHighlightSelection() {
                const contentArea = document.getElementById('content-area');
                if (!contentArea) return;

                contentArea.style.cursor = 'default';
                contentArea.removeEventListener('mouseup', handleTextSelection);
                
                const svgElements = contentArea.querySelectorAll('svg, canvas');
                svgElements.forEach(el => {
                    el.style.cursor = 'default';
                    el.removeEventListener('click', handleSvgClick);
                });
            }

            function handleTextSelection(e) {
                if (!highlightMode) return;
                
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;
                
                const range = selection.getRangeAt(0);
                const selectedText = selection.toString().trim();
                
                if (selectedText.length === 0) return;

                // 選択範囲をハイライト
                const span = document.createElement('span');
                span.className = 'highlight-text';
                span.style.backgroundColor = highlightColor;
                span.style.padding = '2px 0';
                span.style.borderRadius = '2px';
                span.style.position = 'relative';
                span.style.cursor = 'pointer';
                
                // 削除ボタンを追加
                span.title = 'クリックで削除';
                span.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (confirm('このハイライトを削除しますか？')) {
                        const parent = this.parentNode;
                        while (this.firstChild) {
                            parent.insertBefore(this.firstChild, this);
                        }
                        parent.removeChild(this);
                    }
                });

                try {
                    range.surroundContents(span);
                    selection.removeAllRanges();
                } catch (e) {
                    console.log('ハイライトできない範囲です');
                }
            }

            function handleSvgClick(e) {
                if (!highlightMode) return;
                
                const svg = e.currentTarget;
                const rect = svg.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // マーカーを追加
                const marker = document.createElement('div');
                marker.className = 'highlight-marker';
                marker.style.position = 'absolute';
                marker.style.left = (rect.left + x - 10) + 'px';
                marker.style.top = (rect.top + y - 10 + window.scrollY) + 'px';
                marker.style.width = '20px';
                marker.style.height = '20px';
                marker.style.borderRadius = '50%';
                marker.style.backgroundColor = highlightColor;
                marker.style.border = '2px solid #000';
                marker.style.opacity = '0.6';
                marker.style.cursor = 'pointer';
                marker.style.zIndex = '1000';
                marker.title = 'クリックで削除';
                
                marker.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (confirm('このマーカーを削除しますか？')) {
                        this.remove();
                    }
                });
                
                document.body.appendChild(marker);
            }

            async function showQuestionHistory() {
                try {
                    Swal.fire({
                        title: '読み込み中...',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading()
                    });
                    
                    const res = await axios.get('/api/student/my-questions');
                    const questions = res.data.questions;
                    
                    Swal.close();
                    
                    if (questions.length === 0) {
                        Swal.fire({
                            icon: 'info',
                            title: '質問履歴',
                            text: 'まだ質問はありません'
                        });
                        return;
                    }
                    
                    const html = questions.map(q => {
                        const isReplied = q.status === 'replied';
                        const dateStr = dayjs(q.created_at).format('MM/DD HH:mm');
                        const statusBadge = isReplied 
                            ? '<span class="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-bold">返信あり</span>'
                            : '<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">未返信</span>';
                            
                        return \`
                            <div class="text-left mb-4 p-4 border rounded-lg bg-gray-50">
                                <div class="flex justify-between items-center mb-2">
                                    \${statusBadge}
                                    <span class="text-xs text-gray-500">\${dateStr}</span>
                                </div>
                                <div class="mb-2">
                                    <p class="text-sm font-bold text-gray-700">Q. \${sanitizeHtml(q.question_text)}</p>
                                </div>
                                \${isReplied ? \`
                                    <div class="mt-3 pt-3 border-t border-gray-200">
                                        <p class="text-sm font-bold text-green-700 mb-1">A. 先生からの返信</p>
                                        <p class="text-sm text-gray-800 whitespace-pre-wrap">\${sanitizeHtml(q.reply_text)}</p>
                                        <p class="text-xs text-gray-400 mt-1 text-right">\${dayjs(q.reply_at).format('MM/DD HH:mm')}</p>
                                    </div>
                                \` : ''}
                            </div>
                        \`;
                    }).join('');
                    
                    Swal.fire({
                        title: '質問履歴',
                        html: \`<div class="max-h-[60vh] overflow-y-auto">\${html}</div>\`,
                        width: '600px',
                        showConfirmButton: false,
                        showCloseButton: true
                    });
                    
                } catch(e) {
                    console.error(e);
                    Swal.fire({
                        icon: 'error',
                        title: 'エラー',
                        text: '履歴の取得に失敗しました'
                    });
                }
            }

            function sanitizeHtml(str) {
                if (!str) return '';
                return str
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            }

            async function handleQuestionClick() {
                cachedUser = getCurrentUser();
                if (!cachedUser || cachedUser.role !== 'student') {
                    Swal.fire({
                        icon: 'info',
                        title: '質問できません',
                        text: '生徒アカウントでログインしてください。'
                    });
                    return;
                }

                if (!currentStep) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'ステップを読み込み中',
                        text: 'ステップの表示が完了してから質問してください。'
                    });
                    return;
                }

                const helperHtml = '<div class="text-left text-sm text-gray-600 mb-2">現在のステップ: ' + sanitizeHtml(currentStep.title || '（不明）') + '</div>';

                const { value: questionText, isConfirmed } = await Swal.fire({
                    title: '先生に質問する',
                    input: 'textarea',
                    inputLabel: '質問内容',
                    inputPlaceholder: '例）この計算の途中式がわかりません。',
                    inputAttributes: {
                        maxlength: 500,
                        'aria-label': '質問内容'
                    },
                    html: helperHtml,
                    showCancelButton: true,
                    confirmButtonText: '送信',
                    cancelButtonText: 'キャンセル',
                    focusConfirm: false,
                    inputValidator: (value) => {
                        if (!value || !value.trim()) {
                            return '質問内容を入力してください';
                        }
                        return null;
                    }
                });

                if (!isConfirmed || !questionText) {
                    return;
                }

                const trimmed = questionText.trim();

                try {
                    Swal.fire({
                        title: '送信中...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    await axios.post('/api/student/questions', {
                        module_id: MODULE_ID,
                        step_id: currentStep ? currentStep.id : null,
                        question_text: trimmed
                    });

                    Swal.fire({
                        icon: 'success',
                        title: '送信しました',
                        text: '先生からの返信を待ちましょう。'
                    });
                } catch (e) {
                    if (e.response && e.response.status === 401) {
                        Swal.fire({
                            icon: 'error',
                            title: '未ログイン',
                            text: '再度ログインしてください。'
                        }).then(() => {
                            window.location.href = '/login';
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: '送信に失敗しました',
                            text: '時間をおいて再度お試しください。'
                        });
                    }
                }
            }

            async function loadSteps() {
                currentStep = null;
                try {
                    const res = await axios.get('/api/student/steps?module_id=' + MODULE_ID);
                    steps = res.data.steps;
                    
                    if (steps.length === 0) {
                        document.getElementById('content-area').innerHTML = '<p class="text-center text-gray-500">このモジュールにはまだステップがありません。</p>';
                        return;
                    }

                    // 解答履歴を読み込み
                    try {
                        const historyRes = await axios.get('/api/answer-history?module_id=' + MODULE_ID);
                        const answeredIds = historyRes.data.answeredQuestionIds || [];
                        answeredQuestions = new Set(answeredIds);
                    } catch (e) {
                        console.error('解答履歴の読み込みに失敗:', e);
                    }

                    // モジュール内の全問題を取得
                    try {
                        const questionsPromises = steps.map(step => 
                            axios.get('/api/student/questions?step_id=' + step.id)
                        );
                        const questionsResults = await Promise.all(questionsPromises);
                        allModuleQuestions = questionsResults.flatMap(res => res.data.questions);
                    } catch (e) {
                        console.error('問題の読み込みに失敗:', e);
                    }

                    renderStepNav();
                    loadStepContent(0);
                } catch (e) {
                    console.error(e);
                    Swal.fire({ icon: 'error', title: 'エラー', text: 'データの読み込みに失敗しました' });
                }
            }

            function renderStepNav() {
                const nav = document.getElementById('step-nav');
                nav.innerHTML = steps.map((step, index) => \`
                    <button onclick="loadStepContent(\${index})" 
                            class="step-btn px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition \${index === currentStepIndex ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
                            data-index="\${index}">
                        \${index + 1}. \${step.title}
                    </button>
                \`).join('');
            }

            let answeredQuestions = new Set();
            let allModuleQuestions = []; // モジュール内の全問題

            async function loadStepContent(index) {
                currentStepIndex = index;
                const step = steps[index];
                currentStep = step || null;
                // answeredQuestions.clear()を削除 - モジュール全体で解答状況を保持
                
                document.querySelectorAll('.step-btn').forEach(btn => {
                    if (parseInt(btn.dataset.index) === index) {
                        btn.className = 'step-btn px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition bg-gray-700 text-white';
                    } else {
                        btn.className = 'step-btn px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition bg-gray-100 text-gray-600 hover:bg-gray-200';
                    }
                });

                document.getElementById('prev-btn').disabled = index === 0;
                document.getElementById('next-btn').innerHTML = index === steps.length - 1 ? '完了 <i class="fas fa-check ml-2"></i>' : '次へ <i class="fas fa-arrow-right ml-2"></i>';
                
                document.getElementById('prev-btn').onclick = () => loadStepContent(index - 1);
                document.getElementById('next-btn').onclick = async () => {
                    // 現在のステップの問題チェック
                    if (currentQuestions && currentQuestions.length > 0) {
                        const unanswered = currentQuestions.filter(q => !answeredQuestions.has(q.id));
                        if (unanswered.length > 0) {
                            Swal.fire({
                                icon: 'warning',
                                title: '未回答の問題があります',
                                text: 'すべての問題に正解してから次に進んでください。'
                            });
                            return;
                        }
                    }

                    // 最後のステップの場合、モジュール全体の問題をチェック
                    if (index === steps.length - 1) {
                        const allQuestionIds = allModuleQuestions.map(q => q.id);
                        const unansweredModuleQuestions = allQuestionIds.filter(id => !answeredQuestions.has(id));
                        
                        if (unansweredModuleQuestions.length > 0) {
                            const unansweredCount = unansweredModuleQuestions.length;
                            Swal.fire({
                                icon: 'warning',
                                title: 'モジュール内に未回答の問題があります',
                                text: unansweredCount + '個の問題が未解答です。すべての問題に正解してから完了してください。',
                                confirmButtonText: '前のステップに戻る'
                            });
                            return;
                        }
                    }

                    try {
                        await axios.post('/api/progress', {
                            module_id: MODULE_ID,
                            step_id: step.id,
                            status: 'completed'
                        });
                        
                        // 進捗バーを即時更新
                        const progressRes = await axios.get('/api/student/phase-progress');
                        allPhaseProgress = progressRes.data.progress;
                        renderProgress();
                        
                    } catch(e) { console.error(e); }

                    if (index < steps.length - 1) loadStepContent(index + 1);
                    else { Swal.fire({ icon: 'success', title: 'モジュール完了！' }); window.location.href = '/student'; }
                };

                const contentArea = document.getElementById('content-area');
                contentArea.innerHTML = '<div class="text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div></div>';

                try {
                    const [blocksRes, questionsRes] = await Promise.all([
                        axios.get('/api/student/content-blocks?step_id=' + step.id),
                        axios.get('/api/student/questions?step_id=' + step.id)
                    ]);

                    renderContent(step, blocksRes.data.blocks, questionsRes.data.questions);
                } catch (e) {
                    contentArea.innerHTML = '<p class="text-red-500">コンテンツの読み込みに失敗しました。</p>';
                }
            }

            function renderContent(step, blocks, questions) {
                currentQuestions = questions;
                const container = document.getElementById('content-area');
                let html = \`
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">\${step.title}</h2>
                    <p class="text-gray-600 mb-8">\${step.description || ''}</p>
                    <div class="space-y-8">
                \`;

                // ブロックと問題を統合してorder_indexでソート
                const blocksWithType = blocks.map(b => ({ ...b, type: 'block' }));
                const questionsWithType = questions.map(q => ({ ...q, type: 'question' }));
                const allItems = [...blocksWithType, ...questionsWithType].sort((a, b) => a.order_index - b.order_index);

                // 統合されたアイテムを順番に表示
                allItems.forEach(item => {
                    if (item.type === 'block') {
                        const b = item;
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
                    } else if (item.type === 'question') {
                        const q = item;
                        html += \`
                            <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <div class="flex items-center gap-2 mb-4">
                                    <span class="bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded">問題</span>
                                    <h3 class="font-bold text-gray-800">\${q.question_text}</h3>
                                </div>
                        \`;

                        if (q.question_type === 'multiple_choice') {
                            html += '<div class="space-y-2">';
                            q.options.forEach(opt => {
                                html += \`
                                    <button onclick="checkAnswer(this, \${opt.is_correct}, \${q.id})" class="w-full p-4 text-left bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                                        \${opt.option_text}
                                    </button>
                                \`;
                            });
                            html += '</div>';
                        } else if (q.question_type === 'short_answer') {
                            const correct = q.options.find(o => o.is_correct)?.option_text || '';
                            html += \`
                                <div class="flex gap-2">
                                    <input type="text" id="input-\${q.id}" class="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400" placeholder="回答を入力">
                                    <button onclick="checkShortAnswer('input-\${q.id}', '\${correct}', \${q.id})" class="bg-gray-700 text-white px-6 rounded-lg font-bold hover:bg-gray-800">回答</button>
                                </div>
                            \`;
                        } else if (q.question_type === 'ordering') {
                            const shuffledOptions = [...(q.options || [])].sort(() => Math.random() - 0.5);
                            html += \`
                                <div id="sortable-q-\${q.id}" class="space-y-2 mb-4">
                                    \${shuffledOptions.map(opt => \`
                                        <div class="p-3 bg-white border border-gray-300 rounded-lg cursor-move flex items-center gap-3 hover:bg-gray-100 transition" data-id="\${opt.id}">
                                            <i class="fas fa-grip-vertical text-gray-400"></i>
                                            <span class="text-gray-800 font-medium">\${opt.option_text}</span>
                                        </div>
                                    \`).join('')}
                                </div>
                                <button onclick="checkOrdering(\${q.id})" class="bg-gray-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition w-full md:w-auto">
                                    <i class="fas fa-check-circle mr-2"></i>回答する
                                </button>
                            \`;
                        }

                        html += '</div>';
                    }
                });

                html += '</div>';
                container.innerHTML = html;

                setTimeout(() => {
                    // 問題のSortable初期化
                    allItems.filter(item => item.type === 'question').forEach(q => {
                        if(q.question_type === 'ordering') {
                            const el = document.getElementById('sortable-q-' + q.id);
                            if(el && typeof Sortable !== 'undefined') {
                                new Sortable(el, { animation: 150 });
                            }
                        }
                    });

                    // ブロックのグラフとチャート初期化
                    allItems.filter(item => item.type === 'block').forEach(b => {
                        if(b.block_type === 'graph') {
                            const data = [{ fn: b.content.fn, color: '#374151' }];
                            if (b.content.points) {
                                b.content.points.forEach(p => {
                                    data.push({
                                        points: [[parseFloat(p.x), parseFloat(p.y)]],
                                        fnType: 'points',
                                        graphType: 'scatter',
                                        color: p.color || '#ef4444',
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
                                        color: s.color || '#10b981'
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
                                                backgroundColor: b.content.color || '#374151',
                                                borderColor: b.content.color || '#374151'
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

            window.checkAnswer = function(btn, isCorrect, questionId) {
                if (isCorrect) {
                    btn.classList.remove('bg-white', 'hover:bg-indigo-50');
                    btn.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
                    if(!btn.innerHTML.includes('fa-check')) {
                        btn.innerHTML += '<i class="fas fa-check float-right text-green-600"></i>';
                    }
                    if(questionId) {
                        answeredQuestions.add(questionId);
                        // 解答履歴を保存
                        axios.post('/api/answer', {
                            module_id: MODULE_ID,
                            step_id: currentStep?.id,
                            question_id: questionId,
                            answer: btn.textContent.trim(),
                            is_correct: true,
                            explanation: ''
                        }).catch(e => console.error('解答保存に失敗:', e));
                    }
                } else {
                    btn.classList.remove('bg-white', 'hover:bg-indigo-50');
                    btn.classList.add('bg-red-100', 'border-red-500', 'text-red-800');
                    if(!btn.innerHTML.includes('fa-times')) {
                        btn.innerHTML += '<i class="fas fa-times float-right text-red-600"></i>';
                    }
                }
            };

            window.checkShortAnswer = function(inputId, correct, questionId) {
                const input = document.getElementById(inputId);
                const val = input.value.trim();
                // 数値の場合は柔軟に比較（全角半角、カンマなど）
                // 簡易実装として文字列比較
                if (val === correct) {
                    input.classList.remove('border-red-500', 'bg-red-50');
                    input.classList.add('border-green-500', 'bg-green-50');
                    Swal.fire({ icon: 'success', text: '正解！', timer: 1500, showConfirmButton: false });
                    if(questionId) {
                        answeredQuestions.add(questionId);
                        // 解答履歴を保存
                        axios.post('/api/answer', {
                            module_id: MODULE_ID,
                            step_id: currentStep?.id,
                            question_id: questionId,
                            answer: val,
                            is_correct: true,
                            explanation: ''
                        }).catch(e => console.error('解答保存に失敗:', e));
                    }
                } else {
                    input.classList.remove('border-green-500', 'bg-green-50');
                    input.classList.add('border-red-500', 'bg-red-50');
                    Swal.fire({ icon: 'error', text: '不正解...' });
                }
            };

            window.checkOrdering = function(questionId) {
                const question = currentQuestions.find(q => q.id === questionId);
                if (!question) return;
                
                // 正解の順序
                const correctOrder = [...question.options].sort((a, b) => a.order_index - b.order_index).map(o => String(o.id));
                
                // ユーザーの回答順序
                const el = document.getElementById('sortable-q-' + questionId);
                const userOrder = Array.from(el.children).map(c => c.dataset.id);
                
                // 比較
                const isCorrect = JSON.stringify(correctOrder) === JSON.stringify(userOrder);
                
                if (isCorrect) {
                    Swal.fire({ icon: 'success', title: '正解！', text: '正しい順序です' });
                    answeredQuestions.add(questionId);
                    // 解答履歴を保存
                    axios.post('/api/answer', {
                        module_id: MODULE_ID,
                        step_id: currentStep?.id,
                        question_id: questionId,
                        answer: JSON.stringify(userOrder),
                        is_correct: true,
                        explanation: ''
                    }).catch(e => console.error('解答保存に失敗:', e));
                } else {
                    Swal.fire({ icon: 'error', title: '不正解...', text: 'もう一度挑戦してみましょう' });
                }
            };
        </script>
    </body>
    </html>
  `);
})

// ==================== Teacher Admin API Routes ====================

// 生徒の質問一覧取得 (教師用)
app.get('/api/teacher/student-questions', async (c) => {
  const { DB } = c.env
  const user = c.get('user')
  
  const result = await DB.prepare(`
    SELECT q.*, u.username as student_name, m.name as module_name, s.title as step_title
    FROM student_questions q
    JOIN users u ON q.student_id = u.id
    LEFT JOIN modules m ON q.module_id = m.id
    LEFT JOIN steps s ON q.step_id = s.id
    WHERE q.teacher_id = ?
    ORDER BY q.created_at DESC
  `).bind(user.id).all()

  return c.json({ questions: result.results })
})

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

// フェーズ更新
app.put('/api/teacher/phases/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const { name, description, order_index } = await c.req.json()
  
  await DB.prepare(
    'UPDATE phases SET name = ?, description = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(name, description || null, order_index || 0, id).run()
  
  return c.json({ success: true })
})

// フェーズ削除
app.delete('/api/teacher/phases/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare('DELETE FROM phases WHERE id = ?').bind(id).run()
  
  return c.json({ success: true })
})

// モジュール一覧取得
app.get('/api/teacher/modules', async (c) => {
  const { DB } = c.env
  const phase_id = c.req.query('phase_id')
  
  let query = 'SELECT * FROM modules'
  if (phase_id) {
    query += ' WHERE phase_id = ?'
    const result = await DB.prepare(`
        SELECT m.*, p.section_id 
        FROM modules m 
        JOIN phases p ON m.phase_id = p.id
        WHERE m.phase_id = ?
        ORDER BY m.order_index
    `).bind(phase_id).all()
    return c.json({ modules: result.results })
  }
  
  const result = await DB.prepare(`
    SELECT m.*, p.section_id 
    FROM modules m 
    JOIN phases p ON m.phase_id = p.id
    ORDER BY m.order_index
  `).all()
  return c.json({ modules: result.results })
})

// モジュール作成
app.post('/api/teacher/modules', async (c) => {
  const { DB } = c.env
  try {
    const { phase_id, name, description, icon, color, order_index } = await c.req.json()
    console.log('Creating module:', { phase_id, name });
    
    const result = await DB.prepare(
      'INSERT INTO modules (phase_id, name, description, icon, color, order_index) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(phase_id, name, description || null, icon || null, color || null, order_index || 0).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch(e) {
    console.error('Module Create Error:', e);
    return c.json({ error: 'Failed to create module' }, 500)
  }
})

// モジュール更新
app.put('/api/teacher/modules/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const { name, description, icon, color, order_index } = await c.req.json()
  
  await DB.prepare(
    'UPDATE modules SET name = ?, description = ?, icon = ?, color = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(name, description || null, icon || null, color || null, order_index || 0, id).run()
  
  return c.json({ success: true })
})

// モジュール削除
app.delete('/api/teacher/modules/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare('DELETE FROM modules WHERE id = ?').bind(id).run()
  
  return c.json({ success: true })
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

// 問題一覧取得（重複を避けるためエンドポイントを変更）
app.get('/api/teacher/step-questions', async (c) => {
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

// 並べ替えAPI
app.post('/api/teacher/reorder/:type', async (c) => {
  const { DB } = c.env
  const type = c.req.param('type')
  const { items } = await c.req.json()

  if (!items || !Array.isArray(items)) {
    return c.json({ error: 'Invalid items' }, 400)
  }

  try {
    if (type === 'content') {
        const stmtBlock = DB.prepare('UPDATE content_blocks SET order_index = ? WHERE id = ?')
        const stmtQuestion = DB.prepare('UPDATE questions SET order_index = ? WHERE id = ?')
        
        const batch = []
        for (const item of items) {
            if (item.type === 'block') {
                batch.push(stmtBlock.bind(item.order_index, item.id))
            } else if (item.type === 'question') {
                batch.push(stmtQuestion.bind(item.order_index, item.id))
            }
        }
        if(batch.length > 0) await DB.batch(batch)
    } else if (type === 'modules') {
        const stmt = DB.prepare('UPDATE modules SET order_index = ? WHERE id = ?')
        const batch = items.map(item => stmt.bind(item.order_index, item.id))
        if(batch.length > 0) await DB.batch(batch)
    } else if (type === 'steps') {
        const stmt = DB.prepare('UPDATE steps SET order_index = ? WHERE id = ?')
        const batch = items.map(item => stmt.bind(item.order_index, item.id))
        if(batch.length > 0) await DB.batch(batch)
    } else if (type === 'phases') {
        const stmt = DB.prepare('UPDATE phases SET order_index = ? WHERE id = ?')
        const batch = items.map(item => stmt.bind(item.order_index, item.id))
        if(batch.length > 0) await DB.batch(batch)
    } else {
        return c.json({ error: 'Invalid type' }, 400)
    }
    
    return c.json({ success: true })
  } catch(e) {
    console.error('Reorder Error:', e)
    return c.json({ error: 'Failed to reorder' }, 500)
  }
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
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ナビゲーションバー -->
        <nav class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-book mr-2"></i>
                        セクション管理（学年単位）
                    </h1>
                    <div class="flex gap-4">
                        <a href="/teacher" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                            <i class="fas fa-arrow-left mr-2"></i>トップへ戻る
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- 新規作成/編集フォーム -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4" id="form-title">
                    <i class="fas fa-plus-circle mr-2 text-green-500"></i>
                    新しいセクションを作成
                </h2>
                <form id="section-form" class="space-y-4">
                    <input type="hidden" name="id" id="edit-id">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">セクション名 *</label>
                            <input type="text" name="name" id="input-name" required 
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="例：中学1年生の数学">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">学年レベル</label>
                            <input type="text" name="grade_level" id="input-grade_level"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="例：中1、高2">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">教科</label>
                            <input type="text" name="subject" id="input-subject"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="例：数学、英語、理科">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">説明</label>
                        <textarea name="description" id="input-description" rows="2" 
                                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder="このセクションで学ぶ内容"></textarea>
                    </div>
                    <div class="flex gap-4">
                        <button type="submit" id="submit-btn" class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            <i class="fas fa-plus mr-2"></i>作成
                        </button>
                        <button type="button" id="cancel-btn" onclick="resetForm()" class="hidden px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                            キャンセル
                        </button>
                    </div>
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
          // Auth Token Setup
          const token = localStorage.getItem('token');
          if (token) {
              axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
          } else {
              window.location.href = '/login';
          }
          let sectionsData = [];

          // セクション一覧を読み込み
          async function loadSections() {
            try {
              const response = await axios.get('/api/teacher/sections');
              sectionsData = response.data.sections;
              
              const listEl = document.getElementById('sections-list');
              
              if (sectionsData.length === 0) {
                listEl.innerHTML = '<p class="text-gray-500 text-center py-8">まだセクションが登録されていません</p>';
                return;
              }
              
              listEl.innerHTML = sectionsData.map(section => \`
                <div class="border-2 border-gray-200 rounded-lg p-6 hover:border-indigo-400 transition bg-white shadow-sm">
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
                        <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-mono cursor-pointer" onclick="navigator.clipboard.writeText('\${section.access_code}').then(() => Swal.fire({ icon: 'success', title: '完了', text: 'コードをコピーしました', timer: 1500, showConfirmButton: false }))">
                          <i class="fas fa-key mr-1"></i>Code: \${section.access_code || '---'} <i class="fas fa-copy ml-1 opacity-50"></i>
                        </span>
                      </div>
                      <p class="text-gray-600 mb-3">\${section.description || '説明なし'}</p>
                      <p class="text-sm text-gray-400">ID: \${section.id}</p>
                    </div>
                    <div class="flex gap-2 ml-4 flex-col">
                      <a href="/teacher/phases?section_id=\${section.id}" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm text-center">
                        <i class="fas fa-layer-group mr-1"></i>フェーズ管理
                      </a>
                      <div class="flex gap-2">
                        <button onclick="editSection(\${section.id})" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                            <i class="fas fa-pen mr-1"></i>編集
                        </button>
                        <button onclick="deleteSection(\${section.id})" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                            <i class="fas fa-trash mr-1"></i>削除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              \`).join('');
            } catch (error) {
              console.error('セクション読み込みエラー:', error);
              if (error.response && error.response.status === 401) {
                  // 認証エラーの場合はログインページへ
                  window.location.href = '/login';
                  return;
              }
              document.getElementById('sections-list').innerHTML = '<p class="text-red-500 text-center py-8">エラーが発生しました</p>';
            }
          }
          
          // セクション作成・更新
          document.getElementById('section-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const id = document.getElementById('edit-id').value;
            
            const data = {
              name: formData.get('name'),
              grade_level: formData.get('grade_level'),
              subject: formData.get('subject'),
              description: formData.get('description')
            };
            
            try {
              if (id) {
                  // 更新
                  await axios.put('/api/teacher/sections/' + id, data);
                  Swal.fire({ icon: 'success', title: '更新完了', text: 'セクションを更新しました！' });
              } else {
                  // 作成
                  await axios.post('/api/teacher/sections', data);
                  Swal.fire({ icon: 'success', title: '作成完了', text: 'セクションを作成しました！' });
              }
              resetForm();
              loadSections();
            } catch (error) {
              console.error('エラー:', error);
              Swal.fire({ icon: 'error', title: 'エラー', text: 'エラーが発生しました' });
            }
          });
          
          // 編集モードへ切り替え
          function editSection(id) {
              const section = sectionsData.find(s => s.id === id);
              if (!section) return;
              
              document.getElementById('edit-id').value = section.id;
              document.getElementById('input-name').value = section.name;
              document.getElementById('input-grade_level').value = section.grade_level || '';
              document.getElementById('input-subject').value = section.subject || '';
              document.getElementById('input-description').value = section.description || '';
              
              document.getElementById('form-title').innerHTML = '<i class="fas fa-pen mr-2 text-blue-500"></i>セクションを編集';
              document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save mr-2"></i>更新';
              document.getElementById('submit-btn').className = 'flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition';
              document.getElementById('cancel-btn').classList.remove('hidden');
              
              window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          
          // フォームリセット
          function resetForm() {
              document.getElementById('section-form').reset();
              document.getElementById('edit-id').value = '';
              
              document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle mr-2 text-green-500"></i>新しいセクションを作成';
              document.getElementById('submit-btn').innerHTML = '<i class="fas fa-plus mr-2"></i>作成';
              document.getElementById('submit-btn').className = 'flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition';
              document.getElementById('cancel-btn').classList.add('hidden');
          }
          
          // セクション削除
          async function deleteSection(id) {
            const { isConfirmed } = await Swal.fire({
        icon: 'warning',
        title: '確認',
        text: '本当にこのセクションを削除しますか？関連するフェーズ・モジュール・ステップも全て削除されます。',
        showCancelButton: true,
        confirmButtonText: 'はい',
        cancelButtonText: 'いいえ'
    });
    if (!isConfirmed) {
              return;
            }
            try {
                await axios.delete('/api/teacher/sections/' + id);
                Swal.fire({ icon: 'success', title: '削除完了', text: '削除しました' });
                loadSections();
            } catch(e) {
                console.error(e);
                Swal.fire({ icon: 'error', title: 'エラー', text: '削除に失敗しました' });
            }
          }
          
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
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ナビゲーションバー -->
        <nav class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-layer-group mr-2"></i>
                        フェーズ管理（大単元）
                    </h1>
                    <div class="flex gap-4 items-center">
                        <a href="/teacher/sections" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                            <i class="fas fa-arrow-left mr-2"></i>セクション管理へ
                        </a>
                        <a href="/teacher" class="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-400 transition">
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

            <!-- 新規作成/編集フォーム -->
            <div id="create-phase-section" class="hidden">
                <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4" id="form-title">
                        <i class="fas fa-plus-circle mr-2 text-green-500"></i>
                        新しいフェーズを作成
                    </h2>
                    <form id="phase-form" class="space-y-4">
                        <input type="hidden" name="id" id="edit-id">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">フェーズ名 *</label>
                            <input type="text" name="name" id="input-name" required 
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="例：正の数・負の数">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">説明</label>
                            <textarea name="description" id="input-description" rows="3" 
                                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                      placeholder="このフェーズで学ぶ内容"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">表示順序</label>
                            <input type="number" name="order_index" id="input-order_index" value="0" min="0"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div class="flex gap-4">
                            <button type="submit" id="submit-btn" class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                                <i class="fas fa-plus mr-2"></i>作成
                            </button>
                            <button type="button" id="cancel-btn" onclick="resetForm()" class="hidden px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                                キャンセル
                            </button>
                        </div>
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
          // Auth Token Setup
          const token = localStorage.getItem('token');
          if (token) {
              axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
          } else {
              window.location.href = '/login';
          }
          const urlParams = new URLSearchParams(window.location.search);
          const initialSectionId = urlParams.get('section_id') || '';
          let phasesData = [];
          
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
              phasesData = response.data.phases;
              
              const listEl = document.getElementById('phases-list');
              
              if (phasesData.length === 0) {
                listEl.innerHTML = '<p class="text-gray-500 text-center py-8">このセクションにはまだフェーズが登録されていません</p>';
                return;
              }
              
              listEl.innerHTML = phasesData.map(phase => \`
                <div class="border-2 border-gray-200 rounded-lg p-6 hover:border-purple-400 transition bg-white shadow-sm">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h3 class="text-xl font-bold text-gray-800 mb-2">\${phase.name}</h3>
                      <p class="text-gray-600 mb-3">\${phase.description || '説明なし'}</p>
                      <p class="text-sm text-gray-400">表示順序: \${phase.order_index} | ID: \${phase.id}</p>
                    </div>
                    <div class="flex gap-2 ml-4 flex-col">
                      <a href="/teacher/modules?phase_id=\${phase.id}" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm text-center">
                        <i class="fas fa-book mr-1"></i>モジュール管理
                      </a>
                      <div class="flex gap-2">
                        <button onclick="editPhase(\${phase.id})" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                            <i class="fas fa-pen mr-1"></i>編集
                        </button>
                        <button onclick="deletePhase(\${phase.id})" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                            <i class="fas fa-trash mr-1"></i>削除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              \`).join('');
            } catch (error) {
              console.error('フェーズ読み込みエラー:', error);
              document.getElementById('phases-list').innerHTML = '<p class="text-red-500 text-center py-8">エラーが発生しました</p>';
            }
          }
          
          // フェーズ作成・更新
          document.getElementById('phase-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const sectionId = document.getElementById('section-select').value;
            const id = document.getElementById('edit-id').value;
            
            if (!sectionId) {
              Swal.fire({ icon: 'info', title: '確認', text: 'まずセクションを選択してください' });
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
              if (id) {
                  // 更新
                  await axios.put('/api/teacher/phases/' + id, data);
                  Swal.fire({ icon: 'success', title: '更新完了', text: 'フェーズを更新しました！' });
              } else {
                  // 作成
                  await axios.post('/api/teacher/phases', data);
                  Swal.fire({ icon: 'success', title: '作成完了', text: 'フェーズを作成しました！' });
              }
              resetForm();
              loadPhases(sectionId);
            } catch (error) {
              console.error('エラー:', error);
              Swal.fire({ icon: 'error', title: 'エラー', text: 'エラーが発生しました' });
            }
          });
          
          // 編集モードへ切り替え
          function editPhase(id) {
              const phase = phasesData.find(p => p.id === id);
              if (!phase) return;
              
              document.getElementById('edit-id').value = phase.id;
              document.getElementById('input-name').value = phase.name;
              document.getElementById('input-description').value = phase.description || '';
              document.getElementById('input-order_index').value = phase.order_index;
              
              document.getElementById('form-title').innerHTML = '<i class="fas fa-pen mr-2 text-blue-500"></i>フェーズを編集';
              document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save mr-2"></i>更新';
              document.getElementById('submit-btn').className = 'flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition';
              document.getElementById('cancel-btn').classList.remove('hidden');
              
              document.getElementById('create-phase-section').scrollIntoView({ behavior: 'smooth' });
          }
          
          // フォームリセット
          function resetForm() {
              document.getElementById('phase-form').reset();
              document.getElementById('edit-id').value = '';
              document.getElementById('input-order_index').value = '0';
              
              document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle mr-2 text-green-500"></i>新しいフェーズを作成';
              document.getElementById('submit-btn').innerHTML = '<i class="fas fa-plus mr-2"></i>作成';
              document.getElementById('submit-btn').className = 'flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition';
              document.getElementById('cancel-btn').classList.add('hidden');
          }
          
          // フェーズ削除
          async function deletePhase(id) {
            const { isConfirmed } = await Swal.fire({
        icon: 'warning',
        title: '確認',
        text: '本当にこのフェーズを削除しますか？関連するモジュール・ステップも全て削除されます。',
        showCancelButton: true,
        confirmButtonText: 'はい',
        cancelButtonText: 'いいえ'
    });
    if (!isConfirmed) {
              return;
            }
            try {
                await axios.delete('/api/teacher/phases/' + id);
                Swal.fire({ icon: 'success', title: '削除完了', text: '削除しました' });
                const sectionId = document.getElementById('section-select').value;
                if(sectionId) loadPhases(sectionId);
            } catch(e) {
                console.error(e);
                Swal.fire({ icon: 'error', title: 'エラー', text: '削除に失敗しました' });
            }
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
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ナビゲーションバー -->
        <nav class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-book mr-2"></i>
                        モジュール管理（中単元）
                    </h1>
                    <div class="flex gap-4 items-center">
                        <a href="/teacher/phases" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                            <i class="fas fa-arrow-left mr-2"></i>フェーズ管理へ
                        </a>
                        <a href="/teacher" class="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-400 transition">
                            <i class="fas fa-home mr-2"></i>トップ
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
          // Auth Token Setup
          const token = localStorage.getItem('token');
          if (token) {
              axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
          } else {
              window.location.href = '/login';
          }
          
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
                <div class="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-400 transition bg-white cursor-move" data-id="\${module.id}">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <i class="fas fa-grip-vertical text-gray-300 mr-2"></i>
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
              // Sortable適用
              if (modules.length > 0) {
                  new Sortable(listEl, {
                      animation: 150,
                      handle: '.cursor-move',
                      onEnd: async function() {
                          const items = Array.from(listEl.children).map((el, index) => ({
                              id: el.dataset.id,
                              order_index: index
                          }));
                          
                          try {
                              await axios.post('/api/teacher/reorder/modules', { items });
                          } catch(e) {
                              console.error(e);
                              Swal.fire({ icon: 'error', title: 'エラー', text: '並べ替えの保存に失敗しました' });
                          }
                      }
                  });
              }
            } catch (error) {
              console.error('モジュールの読み込みエラー:', error);
              document.getElementById('modules-list').innerHTML = '<p class="text-red-500 text-center py-8">エラーが発生しました</p>';
            }
          }
          
          // モジュール作成
          document.getElementById('create-module-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // phase_idはセレクトボックスから取得する（なければURLパラメータ）
            let phaseId = document.getElementById('phase-select').value;
            if (!phaseId) {
               phaseId = urlParams.get('phase_id');
            }

            if (!phaseId) {
              Swal.fire({ icon: 'info', text: 'フェーズが特定できません' });
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
              Swal.fire({ icon: 'success', title: '作成完了', text: 'モジュールを作成しました！' });
              e.target.reset();
              loadModules(phaseId);
            } catch (error) {
              console.error('モジュール作成エラー:', error);
              Swal.fire({ icon: 'error', title: 'エラー', text: 'エラーが発生しました' });
            }
          });
          
          // モジュール削除
          async function deleteModule(id) {
            const { isConfirmed } = await Swal.fire({
        icon: 'warning',
        title: '確認',
        text: '本当にこのモジュールを削除しますか？',
        showCancelButton: true,
        confirmButtonText: 'はい',
        cancelButtonText: 'いいえ'
    });
    if (!isConfirmed) {
              return;
            }
            Swal.fire({ icon: 'info', text: '削除機能は今後実装予定です（ID: ' + id + '）' });
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
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ナビゲーションバー -->
        <nav class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-tasks mr-2"></i>
                        ステップ管理
                    </h1>
                    <div class="flex gap-4 items-center">
                        <a href="/teacher/modules" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                            <i class="fas fa-arrow-left mr-2"></i>モジュール管理へ
                        </a>
                        <a href="/teacher" class="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-400 transition">
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
          // Auth Token Setup
          const token = localStorage.getItem('token');
          if (token) {
              axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
          } else {
              window.location.href = '/login';
          }
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
                <div class="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-400 transition bg-white shadow-sm cursor-move" data-id="\${step.id}">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <i class="fas fa-grip-vertical text-gray-300 mr-2"></i>
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
              // Sortable適用
              if (steps.length > 0) {
                  new Sortable(listEl, {
                      animation: 150,
                      handle: '.cursor-move',
                      onEnd: async function() {
                          const items = Array.from(listEl.children).map((el, index) => ({
                              id: el.dataset.id,
                              order_index: index
                          }));
                          
                          try {
                              await axios.post('/api/teacher/reorder/steps', { items });
                              // 番号を再描画するのは少し面倒なので、リロードせずにそのままにするか、
                              // 簡易的に番号だけ書き換えるか。今回はそのまま。
                          } catch(e) {
                              console.error(e);
                              Swal.fire({ icon: 'error', title: 'エラー', text: '並べ替えの保存に失敗しました' });
                          }
                      }
                  });
              }
            } catch (error) {
              console.error('ステップの読み込みエラー:', error);
              document.getElementById('steps-list').innerHTML = '<p class="text-red-500 text-center py-8">エラーが発生しました</p>';
            }
          }
          
          // ステップ作成
          document.getElementById('create-step-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // module_idはセレクトボックスから取得する（なければURLパラメータ）
            let moduleId = document.getElementById('module-select').value;
            if (!moduleId) {
               moduleId = urlParams.get('module_id');
            }

            if (!moduleId) {
              Swal.fire({ icon: 'info', text: 'モジュールが特定できません' });
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
              Swal.fire({ icon: 'success', title: '作成完了', text: 'ステップを作成しました！' });
              e.target.reset();
              loadSteps(moduleId);
            } catch (error) {
              console.error('ステップ作成エラー:', error);
              Swal.fire({ icon: 'error', title: 'エラー', text: 'エラーが発生しました' });
            }
          });
          
          // ステップ編集
          async function editStep(id) {
            try {
                const res = await axios.get('/api/teacher/steps/' + id);
                const step = res.data.step;
                
                const { value: newTitle } = await Swal.fire({
        title: 'ステップのタイトルを編集:',
        input: 'text',
        inputValue: step.title,
        showCancelButton: true
    });
                if (newTitle === undefined || newTitle === null) return;
                
                const { value: newDesc } = await Swal.fire({
        title: '説明文を編集:',
        input: 'text',
        inputValue: step.description || '',
        showCancelButton: true
    });
                if (newDesc === undefined || newDesc === null) return;

                const { value: newOrder } = await Swal.fire({
        title: '表示順序:',
        input: 'text',
        inputValue: step.order_index,
        showCancelButton: true
    });
                if (newOrder === undefined || newOrder === null) return;

                await axios.put('/api/teacher/steps/' + id, {
                    title: newTitle,
                    description: newDesc,
                    order_index: parseInt(newOrder)
                });
                
                Swal.fire({ icon: 'success', title: '更新完了', text: '更新しました' });
                loadSteps(step.module_id);
            } catch(e) {
                console.error(e);
                Swal.fire({ icon: 'error', title: 'エラー', text: '更新に失敗しました' });
            }
          }
          
          // ステップ削除
          async function deleteStep(id) {
            const { isConfirmed } = await Swal.fire({
        icon: 'warning',
        title: '確認',
        text: '本当にこのステップを削除しますか？\\n関連するコンテンツも全て削除されます。',
        showCancelButton: true,
        confirmButtonText: 'はい',
        cancelButtonText: 'いいえ'
    });
    if (!isConfirmed) {
              return;
            }
            try {
                await axios.delete('/api/teacher/steps/' + id);
                Swal.fire({ icon: 'success', title: '削除完了', text: '削除しました' });
                const moduleId = document.getElementById('module-select').value;
                if(moduleId) loadSteps(moduleId);
            } catch(e) {
                console.error(e);
                Swal.fire({ icon: 'error', title: 'エラー', text: '削除に失敗しました' });
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
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
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
        <!-- ナビゲーションバー -->
        <nav class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-edit mr-2"></i>
                        コンテンツ作成
                    </h1>
                    <div class="flex gap-4 items-center">
                        <a href="/teacher/steps" class="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-400 transition">
                            <i class="fas fa-arrow-left mr-2"></i>ステップ管理へ
                        </a>
                        <a href="/teacher" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
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

                                <button onclick="addQuestion('ordering')" class="flex items-center p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 rounded-lg transition group">
                                    <div class="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-3 group-hover:bg-purple-600 group-hover:text-white transition">
                                        <i class="fas fa-sort"></i>
                                    </div>
                                    <div class="text-left">
                                        <div class="font-bold text-gray-800">並べ替え問題</div>
                                        <div class="text-xs text-gray-500">正しい順序に並べ替え</div>
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
          // Auth Token Setup
          const token = localStorage.getItem('token');
          console.log('Token:', token ? 'exists' : 'missing');
          if (token) {
              axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
              console.log('Authorization header set');
          } else {
              console.log('No token found, redirecting to login');
              window.location.href = '/login';
          }
            let currentStepId = null;
            let allItems = [];

            // 初期化
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM loaded, loading sections...');
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
                try {
                    const res = await axios.get('/api/teacher/sections');
                    const sections = res.data.sections;
                    const select = document.getElementById('section-select');
                    
                    // 選択肢を設定
                    select.innerHTML = '<option value="">選択してください</option>' + 
                        sections.map(s => \`<option value="\${s.id}">\${s.name}</option>\`).join('');
                    
                    // イベントリスナーを設定（oneパラメータを使わずに直接設定）
                    select.onchange = function(e) {
                        console.log('Section changed:', this.value);
                        if(this.value) {
                            loadPhases(this.value);
                        } else {
                            disableSelects(['phase', 'module', 'step']);
                        }
                    };
                } catch(e) {
                    console.error('loadSections error:', e);
                    Swal.fire({ icon: 'error', title: 'エラー', text: 'セクションの読み込みに失敗しました' });
                }
            }

            async function loadPhases(sectionId) {
                try {
                    console.log('Loading phases for section:', sectionId);
                    const res = await axios.get(\`/api/teacher/phases?section_id=\${sectionId}\`);
                    const select = document.getElementById('phase-select');
                    select.disabled = false;
                    select.innerHTML = '<option value="">選択してください</option>' + 
                        res.data.phases.map(p => \`<option value="\${p.id}">\${p.name}</option>\`).join('');
                    
                    disableSelects(['module', 'step']);
                    
                    // イベントリスナーを設定
                    select.onchange = function(e) {
                        console.log('Phase changed:', this.value);
                        if(this.value) {
                            loadModules(this.value);
                        } else {
                            disableSelects(['module', 'step']);
                        }
                    };
                } catch(e) {
                    console.error('loadPhases error:', e);
                    Swal.fire({ icon: 'error', title: 'エラー', text: 'フェーズの読み込みに失敗しました' });
                }
            }

            async function loadModules(phaseId) {
                try {
                    console.log('Loading modules for phase:', phaseId);
                    const res = await axios.get(\`/api/teacher/modules?phase_id=\${phaseId}\`);
                    const select = document.getElementById('module-select');
                    select.disabled = false;
                    select.innerHTML = '<option value="">選択してください</option>' + 
                        res.data.modules.map(m => \`<option value="\${m.id}">\${m.name}</option>\`).join('');
                    
                    disableSelects(['step']);
                    
                    // イベントリスナーを設定
                    select.onchange = function(e) {
                        console.log('Module changed:', this.value);
                        if(this.value) {
                            loadSteps(this.value);
                        } else {
                            disableSelects(['step']);
                        }
                    };
                } catch(e) {
                    console.error('loadModules error:', e);
                    Swal.fire({ icon: 'error', title: 'エラー', text: 'モジュールの読み込みに失敗しました' });
                }
            }

            async function loadSteps(moduleId) {
                try {
                    console.log('Loading steps for module:', moduleId);
                    const res = await axios.get(\`/api/teacher/steps?module_id=\${moduleId}\`);
                    const select = document.getElementById('step-select');
                    select.disabled = false;
                    select.innerHTML = '<option value="">選択してください</option>' + 
                        res.data.steps.map(s => \`<option value="\${s.id}">\${s.title}</option>\`).join('');
                    
                    // イベントリスナーを設定
                    select.onchange = function(e) {
                        console.log('Step changed:', this.value);
                        if(this.value) {
                            loadContent(this.value, this.options[this.selectedIndex].text);
                        } else {
                            document.getElementById('editor-area').classList.add('hidden');
                        }
                    };
                } catch(e) {
                    console.error('loadSteps error:', e);
                    Swal.fire({ icon: 'error', title: 'エラー', text: 'ステップの読み込みに失敗しました' });
                }
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
                        axios.get(\`/api/teacher/step-questions?step_id=\${stepId}\`)
                    ]);

                    const blocks = blocksRes.data.blocks.map(b => ({ ...b, type: 'block' }));
                    const questions = questionsRes.data.questions.map(q => ({ ...q, type: 'question' }));
                    
                    allItems = [...blocks, ...questions].sort((a, b) => a.order_index - b.order_index);
                    
                    renderEditor();
                } catch(e) {
                    console.error(e);
                    Swal.fire({ icon: 'error', title: 'エラー', text: 'コンテンツの読み込みに失敗しました' });
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

                // Sortable適用
                if (allItems.length > 0 && typeof Sortable !== 'undefined') {
                    if(container._sortable) container._sortable.destroy();
                    
                    container._sortable = new Sortable(container, {
                        animation: 150,
                        handle: '.cursor-move',
                        filter: 'input, textarea, button, select, option',
                        preventOnFilter: false,
                        onEnd: async function() {
                            const items = Array.from(container.children).map((el, index) => ({
                                id: el.dataset.id,
                                type: el.dataset.type,
                                order_index: index
                            }));
                            
                            try {
                                await axios.post('/api/teacher/reorder/content', { items });
                            } catch(e) {
                                console.error(e);
                                Swal.fire({ icon: 'error', title: 'エラー', text: '並べ替えの保存に失敗しました' });
                            }
                        }
                    });
                }
            }

            // アイテム要素作成
            function createItemElement(item) {
                const div = document.createElement('div');
                div.dataset.id = item.id;
                div.dataset.type = item.type;
                
                if (item.type === 'block') {
                    // コンテンツブロック
                    div.className = 'content-block bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative group mb-4 cursor-move';
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
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">ファイルをアップロード</label>
                                <input type="file" accept="image/*" onchange="uploadImage(\${block.id}, this)" class="w-full p-2 border rounded-lg text-sm">
                                <div class="text-xs text-gray-400 mt-1">または下にURLを直接入力してください</div>
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
                    const type = q.question_type;
                    let typeLabel = '';
                    let bgColor = '';
                    let textColor = '';
                    let icon = '';

                    if (type === 'multiple_choice') {
                        typeLabel = '選択式問題';
                        bgColor = 'bg-yellow-50 border-yellow-200';
                        textColor = 'text-yellow-700';
                        icon = 'fa-list-ul';
                    } else if (type === 'ordering') {
                        typeLabel = '並べ替え問題';
                        bgColor = 'bg-purple-50 border-purple-200';
                        textColor = 'text-purple-700';
                        icon = 'fa-sort';
                    } else {
                        typeLabel = '数値入力問題';
                        bgColor = 'bg-orange-50 border-orange-200';
                        textColor = 'text-orange-700';
                        icon = 'fa-keyboard';
                    }

                    div.className = \`content-block \${bgColor} border rounded-xl p-4 shadow-sm relative group mb-4 cursor-move\`;
                    
                    let editorHtml = \`
                        <div class="mb-4">
                            <label class="text-xs font-bold text-gray-500 mb-1 block">問題文</label>
                            <textarea onchange="updateQuestionText(\${q.id}, this.value)" class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm" rows="2">\${q.question_text}</textarea>
                        </div>
                    \`;

                    if (type === 'multiple_choice') {
                        editorHtml += \`
                            <div class="space-y-2 mb-4" id="options-container-\${q.id}">
                                <label class="text-xs font-bold text-gray-500 mb-1 block">選択肢</label>
                                \${(q.options || []).map(opt => renderOptionHtml(q.id, opt)).join('')}
                                <button onclick="addOption(\${q.id})" class="text-sm text-blue-600 hover:underline flex items-center mt-2">
                                    <i class="fas fa-plus mr-1"></i>選択肢を追加
                                </button>
                            </div>
                        \`;
                    } else if (type === 'ordering') {
                        editorHtml += \`
                            <div class="space-y-2 mb-4" id="options-container-\${q.id}">
                                <label class="text-xs font-bold text-gray-500 mb-1 block">並べ替えアイテム (正解の順序)</label>
                                <div id="sortable-list-\${q.id}" class="space-y-2">
                                    \${(q.options || []).sort((a,b) => a.order_index - b.order_index).map(opt => \`
                                        <div class="flex items-center gap-2 bg-white p-2 rounded border cursor-move" id="option-\${opt.id}" data-id="\${opt.id}">
                                            <i class="fas fa-grip-vertical text-gray-400 mr-2"></i>
                                            <input type="text" value="\${opt.option_text}" 
                                                   onchange="updateOption(\${opt.id}, {option_text: this.value})"
                                                   class="flex-1 p-2 border rounded text-sm" placeholder="アイテムを入力">
                                            <button onclick="deleteOption(\${opt.id})" class="text-red-400 hover:text-red-600 p-1">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    \`).join('')}
                                </div>
                                <button onclick="addOption(\${q.id})" class="text-sm text-blue-600 hover:underline flex items-center mt-2">
                                    <i class="fas fa-plus mr-1"></i>アイテムを追加
                                </button>
                            </div>
                        \`;
                        
                        setTimeout(() => {
                            const el = document.getElementById('sortable-list-' + q.id);
                            if(el && typeof Sortable !== 'undefined') {
                                new Sortable(el, {
                                    handle: '.fa-grip-vertical',
                                    animation: 150,
                                    onEnd: async function(evt) {
                                        const items = el.querySelectorAll('[data-id]');
                                        for (let i = 0; i < items.length; i++) {
                                            const id = items[i].dataset.id;
                                            await updateOption(id, { order_index: i });
                                        }
                                    }
                                });
                            }
                        }, 100);
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
                        <input type="checkbox" \${opt.is_correct ? 'checked' : ''} 
                               onchange="updateOption(\${opt.id}, {is_correct: this.checked ? 1 : 0})"
                               class="h-5 w-5 text-blue-600 focus:ring-blue-500 cursor-pointer border-gray-300 rounded" title="正解を選択">
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
                    Swal.fire({ icon: 'error', title: 'エラー', text: '追加に失敗しました' });
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
                    Swal.fire({ icon: 'error', title: 'エラー', text: '保存に失敗しました' });
                }
            }

            // ブロック削除 (UI即時反映)
            async function deleteBlock(id, btnElement) {
                const { isConfirmed } = await Swal.fire({
        icon: 'warning',
        title: '確認',
        text: '削除しますか？',
        showCancelButton: true,
        confirmButtonText: 'はい',
        cancelButtonText: 'いいえ'
    });
    if (!isConfirmed) return;
                
                try {
                    await axios.delete(\`/api/teacher/content-blocks/\${id}\`);
                    // 配列から削除
                    allItems = allItems.filter(i => !(i.id === id && i.type === 'block'));
                    // DOMから削除
                    const el = btnElement.closest('.content-block');
                    if(el) el.remove();
                } catch(e) {
                    Swal.fire({ icon: 'error', title: 'エラー', text: '削除に失敗しました' });
                }
            }

            // 問題削除 (UI即時反映)
            async function deleteQuestion(id, btnElement) {
                const { isConfirmed } = await Swal.fire({
        icon: 'warning',
        title: '確認',
        text: '削除しますか？',
        showCancelButton: true,
        confirmButtonText: 'はい',
        cancelButtonText: 'いいえ'
    });
    if (!isConfirmed) return;
                
                try {
                    await axios.delete(\`/api/teacher/questions/\${id}\`);
                    allItems = allItems.filter(i => !(i.id === id && i.type === 'question'));
                    const el = btnElement.closest('.content-block');
                    if(el) el.remove();
                } catch(e) {
                    Swal.fire({ icon: 'error', title: 'エラー', text: '削除に失敗しました' });
                }
            }

            // 問題追加 (UI即時反映)
            async function addQuestion(type) {
                const { value: text } = await Swal.fire({
        title: '問題文を入力してください',
        input: 'text',
        inputValue: '',
        showCancelButton: true
    });
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

                    if (type === 'ordering') {
                        await axios.post('/api/teacher/question-options', { question_id: newItem.id, option_text: '項目1', is_correct: 0, order_index: 0 });
                        await axios.post('/api/teacher/question-options', { question_id: newItem.id, option_text: '項目2', is_correct: 0, order_index: 1 });
                        await axios.post('/api/teacher/question-options', { question_id: newItem.id, option_text: '項目3', is_correct: 0, order_index: 2 });
                        
                        loadContent(currentStepId, document.getElementById('current-step-title').textContent);
                        return; 
                    }
                    
                    allItems.push(newItem);
                    container.appendChild(createItemElement(newItem));
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

                } catch(e) {
                    console.error(e);
                    Swal.fire({ icon: 'error', title: 'エラー', text: '追加に失敗しました' });
                }
            }

            // 問題文更新
            async function updateQuestionText(id, text) {
                try {
                    await axios.put(\`/api/teacher/questions/\${id}\`, { question_text: text });
                } catch(e) {
                    Swal.fire({ icon: 'error', title: 'エラー', text: '保存に失敗しました' });
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
                    
                    // allItemsの更新
                    const qItem = allItems.find(i => i.id === questionId && i.type === 'question');
                    if (qItem) {
                        if (!qItem.options) qItem.options = [];
                        qItem.options.push(newOpt);
                    }
                    
                    const container = document.getElementById(\`options-container-\${questionId}\`);
                    const btn = container.lastElementChild;
                    const div = document.createElement('div');
                    div.innerHTML = renderOptionHtml(questionId, newOpt);
                    container.insertBefore(div.firstElementChild, btn);
                    
                } catch(e) {
                    console.error(e);
                    Swal.fire({ icon: 'error', title: 'エラー', text: '追加に失敗しました' });
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
                    Swal.fire({ icon: 'error', title: 'エラー', text: '保存に失敗しました' });
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
                    await axios.put(\`/api/teacher/question-options/\${id}\`, newData);
                    
                    // UIリロード（正解マークの移動などを反映するため）
                    if(data.is_correct !== undefined) {
                        // 簡易的にリロードせずDOM書き換えができればベストだが、ここではリロード
                        // loadContent は重いので、データだけ更新して再描画したいが、
                        // ここでは簡単のため loadContent
                        loadContent(currentStepId, document.getElementById('current-step-title').textContent);
                    }
                } catch(e) {
                    Swal.fire({ icon: 'error', title: 'エラー', text: '保存に失敗しました' });
                }
            }



            // 選択肢削除
            async function deleteOption(id) {
                try {
                    await axios.delete(\`/api/teacher/question-options/\${id}\`);
                    loadContent(currentStepId, document.getElementById('current-step-title').textContent);
                } catch(e) {
                    Swal.fire({ icon: 'error', title: 'エラー', text: '削除に失敗しました' });
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
                        if (q.question_type === 'ordering') {
                            // シャッフルして表示
                            const shuffledOptions = [...(q.options || [])].sort(() => Math.random() - 0.5);
                            html += \`
                                <div class="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
                                    <h4 class="font-bold text-lg mb-4 text-purple-900">並べ替え問題</h4>
                                    <p class="mb-4">\${q.question_text}</p>
                                    <div id="preview-sortable-\${q.id}" class="space-y-2">
                                        \${shuffledOptions.map(opt => \`
                                            <div class="p-3 bg-gray-50 border rounded cursor-move flex items-center gap-3" data-id="\${opt.id}">
                                                <i class="fas fa-grip-vertical text-gray-400"></i>
                                                <span>\${opt.option_text}</span>
                                            </div>
                                        \`).join('')}
                                    </div>
                                    <button onclick="checkOrdering(\${q.id})" class="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition">
                                        回答する
                                    </button>
                                </div>
                            \`;
                        } else if (q.question_type === 'multiple_choice') {
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
                    // SortableJS適用
                    allItems.forEach(item => {
                        if(item.type === 'question' && item.question_type === 'ordering') {
                            const el = document.getElementById('preview-sortable-' + item.id);
                            if(el && typeof Sortable !== 'undefined') {
                                new Sortable(el, { animation: 150 });
                            }
                        }
                    });

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

            window.checkOrdering = function(questionId) {
                const question = allItems.find(i => i.id === questionId && i.type === 'question');
                if (!question) return;
                
                // 正解の順序 (order_index昇順)
                const correctOrder = [...question.options].sort((a, b) => a.order_index - b.order_index).map(o => String(o.id));
                
                // ユーザーの回答順序
                const el = document.getElementById('preview-sortable-' + questionId);
                const userOrder = Array.from(el.children).map(c => c.dataset.id);
                
                // 比較
                const isCorrect = JSON.stringify(correctOrder) === JSON.stringify(userOrder);
                
                if (isCorrect) {
                    Swal.fire({ icon: 'success', title: '正解！', text: '正しい順序です' });
                } else {
                    Swal.fire({ icon: 'error', title: '不正解...', text: 'もう一度挑戦してみましょう' });
                }
            };

            // ブロックのコンテンツを更新する関数
            async function updateBlockContent(blockId, content) {
                try {
                    await axios.put(\`/api/teacher/content-blocks/\${blockId}\`, {
                        content: content
                    });
                } catch(e) {
                    console.error('Update block error:', e);
                    throw e;
                }
            }

            // 画像アップロード関数
            async function uploadImage(blockId, inputElement) {
                const file = inputElement.files[0];
                if (!file) return;
                
                // ファイルサイズチェック（5MB）
                if (file.size > 5 * 1024 * 1024) {
                    Swal.fire({ icon: 'error', title: 'エラー', text: 'ファイルサイズが大きすぎます（最大5MB）' });
                    inputElement.value = '';
                    return;
                }
                
                // ファイルタイプチェック
                if (!file.type.startsWith('image/')) {
                    Swal.fire({ icon: 'error', title: 'エラー', text: '画像ファイルのみアップロード可能です' });
                    inputElement.value = '';
                    return;
                }
                
                try {
                    // FormDataを作成
                    const formData = new FormData();
                    formData.append('image', file);
                    
                    // ローディング表示
                    Swal.fire({
                        title: 'アップロード中...',
                        text: '画像をアップロードしています',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    
                    // アップロード
                    const response = await axios.post('/api/teacher/upload-image', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    
                    Swal.close();
                    
                    if (response.data.success) {
                        // URLを更新
                        const item = allItems.find(i => i.id === blockId);
                        if (item) {
                            item.content.url = response.data.url;
                            await updateBlockContent(blockId, item.content);
                            renderEditor();
                            
                            Swal.fire({ 
                                icon: 'success', 
                                title: 'アップロード完了', 
                                text: '画像をアップロードしました',
                                timer: 1500
                            });
                        }
                    } else {
                        Swal.fire({ icon: 'error', title: 'エラー', text: response.data.error || 'アップロードに失敗しました' });
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    Swal.close();
                    Swal.fire({ icon: 'error', title: 'エラー', text: 'アップロードに失敗しました: ' + (error.response?.data?.error || error.message) });
                } finally {
                    inputElement.value = '';
                }
            }

            function closePreview() {
                document.getElementById('preview-modal').classList.add('hidden');
            }
        </script>
    </body>
    </html>
  `)
})

// 生徒管理画面
app.get('/teacher/students', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>生徒管理 - 学習アプリ開発プラットフォーム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <nav class="bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-users mr-2"></i>
                        生徒管理
                    </h1>
                    <div class="flex gap-4">
                        <a href="/teacher/sections" class="px-4 py-2 bg-green-500 rounded-lg hover:bg-green-400 transition">
                            <i class="fas fa-book mr-2"></i>セクション管理
                        </a>
                        <a href="/teacher" class="px-4 py-2 bg-teal-500 rounded-lg hover:bg-teal-400 transition">
                            <i class="fas fa-home mr-2"></i>トップ
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- 生徒作成フォーム -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-ticket-alt mr-2 text-green-500"></i>
                    生徒コード発行
                </h2>
                <div class="flex gap-4 items-end">
                    <div class="flex-1">
                        <p class="text-sm text-gray-600 mb-2">
                            生徒がログインに使用する「生徒コード」を自動発行します。<br>
                            初期パスワードも自動生成されます。
                        </p>
                    </div>
                    <button id="generate-code-btn" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md font-bold">
                        <i class="fas fa-plus mr-2"></i>コードを1つ発行
                    </button>
                </div>
            </div>

            <!-- 既存の生徒を追加フォーム -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6 border-t-4 border-blue-500">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-user-plus mr-2 text-blue-500"></i>
                    既存の生徒を追加
                </h2>
                <div class="flex gap-4 items-end">
                    <div class="flex-1">
                        <p class="text-sm text-gray-600 mb-2">
                            他の先生が発行した生徒コードを入力して、自分のクラスに追加します。
                        </p>
                        <input type="text" id="existing-student-code" class="w-full px-4 py-2 border rounded-lg" placeholder="生徒コードを入力">
                    </div>
                    <button id="add-existing-student-btn" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition h-10 font-bold">
                        <i class="fas fa-link mr-2"></i>追加
                    </button>
                </div>
            </div>

            <!-- 生徒一覧 -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-list mr-2 text-blue-500"></i>
                    登録生徒一覧
                </h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">生徒コード</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メモ</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録日</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody id="students-list" class="bg-white divide-y divide-gray-200">
                            <!-- JSで追加 -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- 割り当てモーダル -->
        <div id="assignment-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
            <div class="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
                <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 class="text-lg font-bold text-gray-800">教材割り当て設定</h3>
                    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-800"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6">
                    <p class="text-sm text-gray-600 mb-4" id="assignment-student-name"></p>
                    <div id="sections-checkbox-list" class="space-y-2 max-h-60 overflow-y-auto">
                        <!-- JSで追加 -->
                    </div>
                </div>
                <div class="p-4 bg-gray-50 text-right">
                    <button onclick="closeModal()" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">閉じる</button>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // Auth Token Setup
          const token = localStorage.getItem('token');
          if (token) {
              axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
          } else {
              window.location.href = '/login';
          }

            let students = [];
            let sections = [];
            let assignments = [];
            let currentStudentId = null;

            document.addEventListener('DOMContentLoaded', () => {
                loadData();
                
                document.getElementById('generate-code-btn').addEventListener('click', async () => {
                    try {
                        const res = await axios.post('/api/teacher/students', {});
                        await Swal.fire({ icon: 'info', text: '生徒コードを発行しました！\\n\\n生徒コード: ' + res.data.username + '\\n初期パスワード: ' + res.data.password + '\\n\\nこの情報を控えて生徒に伝えてください。' });
                        loadData();
                    } catch(e) {
                        Swal.fire({ icon: 'error', title: 'エラー', text: '発行に失敗しました' });
                    }
                });

                document.getElementById('add-existing-student-btn').addEventListener('click', async () => {
                    const codeInput = document.getElementById('existing-student-code');
                    const code = codeInput.value.trim();
                    if (!code) {
                        Swal.fire({ icon: 'warning', title: '入力エラー', text: '生徒コードを入力してください' });
                        return;
                    }

                    try {
                        await axios.post('/api/teacher/students/link', { username: code });
                        await Swal.fire({ icon: 'success', title: '追加完了', text: '生徒を追加しました！' });
                        codeInput.value = '';
                        loadData();
                    } catch(e) {
                        const msg = e.response?.data?.error || '追加に失敗しました';
                        Swal.fire({ icon: 'info', title: '通知', text: msg });
                    }
                });
            });

            async function loadData() {
                try {
                    const [studentsRes, sectionsRes, assignmentsRes] = await Promise.all([
                        axios.get('/api/teacher/students'),
                        axios.get('/api/teacher/sections'),
                        axios.get('/api/teacher/assignments')
                    ]);
                    
                    students = studentsRes.data.students;
                    sections = sectionsRes.data.sections;
                    assignments = assignmentsRes.data.assignments;
                    
                    renderStudents();
                } catch(e) {
                    if (e.response && e.response.status === 401) {
                        window.location.href = '/login';
                    }
                    console.error(e);
                }
            }

            function renderStudents() {
                const tbody = document.getElementById('students-list');
                if (students.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">生徒が登録されていません</td></tr>';
                    return;
                }
                
                tbody.innerHTML = students.map(s => \`
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${s.id}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">\${s.username}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <input type="text" value="\${s.memo || ''}" 
                                   onchange="updateStudentMemo(\${s.id}, this.value)"
                                   class="border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none bg-transparent w-full"
                                   placeholder="メモを入力...">
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${new Date(s.created_at).toLocaleDateString()}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onclick="previewAsStudent(\${s.id})" class="text-green-600 hover:text-green-900 mr-4" title="この生徒としてプレビュー">
                                <i class="fas fa-eye mr-1"></i>確認
                            </button>
                            <button onclick="openAssignmentModal(\${s.id}, '\${s.username}')" class="text-indigo-600 hover:text-indigo-900 mr-4">
                                <i class="fas fa-tasks mr-1"></i>割り当て
                            </button>
                            <button onclick="deleteStudent(\${s.id})" class="text-red-600 hover:text-red-900">
                                <i class="fas fa-trash mr-1"></i>削除
                            </button>
                        </td>
                    </tr>
                \`).join('');
            }

            window.updateStudentMemo = async (id, memo) => {
                try {
                    await axios.put('/api/teacher/students/' + id, { memo });
                } catch(e) {
                    console.error(e);
                    Swal.fire({ icon: 'error', title: 'エラー', text: 'メモの保存に失敗しました' });
                }
            };

            window.deleteStudent = async (id) => {
                const { isConfirmed } = await Swal.fire({
        icon: 'warning',
        title: '確認',
        text: '本当に削除しますか？この生徒に関連するデータも全て削除されます。',
        showCancelButton: true,
        confirmButtonText: 'はい',
        cancelButtonText: 'いいえ'
    });
    if (!isConfirmed) return;
                try {
                    await axios.delete('/api/teacher/students/' + id);
                    await Swal.fire({ icon: 'success', title: '削除完了', text: '生徒を削除しました' });
                    loadData();
                } catch(e) {
                    console.error(e);
                    Swal.fire({ icon: 'error', title: 'エラー', text: '削除に失敗しました' });
                }
            };

            function openAssignmentModal(studentId, username) {
                currentStudentId = studentId;
                document.getElementById('assignment-student-name').textContent = \`\${username} さんに表示する教材を選択してください\`;
                document.getElementById('assignment-modal').classList.remove('hidden');
                
                const container = document.getElementById('sections-checkbox-list');
                
                if (sections.length === 0) {
                    container.innerHTML = '<p class="text-gray-500">割り当て可能なセクションがありません</p>';
                    return;
                }

                container.innerHTML = sections.map(section => {
                    const assignment = assignments.find(a => a.student_id === studentId && a.section_id === section.id);
                    const isChecked = !!assignment;
                    
                    return \`
                        <div class="flex items-center p-2 hover:bg-gray-50 rounded border">
                            <input type="checkbox" id="sec-\${section.id}" \${isChecked ? 'checked' : ''} 
                                   onchange="toggleAssignment(\${section.id}, this.checked, \${assignment ? assignment.id : null})"
                                   class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                            <label for="sec-\${section.id}" class="ml-3 block text-sm font-medium text-gray-700 w-full cursor-pointer">
                                \${section.name} <span class="text-gray-400 text-xs ml-2">(\${section.grade_level})</span>
                            </label>
                        </div>
                    \`;
                }).join('');
            }

            async function toggleAssignment(sectionId, isChecked, assignmentId) {
                try {
                    if (isChecked) {
                        await axios.post('/api/teacher/assignments', {
                            student_id: currentStudentId,
                            section_id: sectionId
                        });
                    } else {
                        if (!assignmentId) {
                            const res = await axios.get('/api/teacher/assignments');
                            assignments = res.data.assignments;
                            const target = assignments.find(a => a.student_id === currentStudentId && a.section_id === sectionId);
                            if (target) assignmentId = target.id;
                        }
                        
                        if (assignmentId) {
                            await axios.delete('/api/teacher/assignments/' + assignmentId);
                        }
                    }
                    
                    const res = await axios.get('/api/teacher/assignments');
                    assignments = res.data.assignments;
                    
                } catch(e) {
                    Swal.fire({ icon: 'error', title: 'エラー', text: '設定の保存に失敗しました' });
                }
            }

            window.previewAsStudent = async (id) => {
                try {
                    const res = await axios.post('/api/teacher/students/' + id + '/impersonate');
                    const token = res.data.token;
                    const user = res.data.user;
                    
                    const width = 1024;
                    const height = 768;
                    const left = (window.screen.width - width) / 2;
                    const top = (window.screen.height - height) / 2;
                    
                    const url = '/student?preview_token=' + token + '&preview_user=' + encodeURIComponent(JSON.stringify(user));
                    window.open(url, '_blank', \`width=\${width},height=\${height},top=\${top},left=\${left}\`);
                    
                } catch(e) {
                    console.error(e);
                    Swal.fire({ icon: 'error', title: 'エラー', text: 'プレビューの開始に失敗しました' });
                }
            };

            function closeModal() {
                document.getElementById('assignment-modal').classList.add('hidden');
            }
        </script>
    </body>
    </html>
  `)
})

// 生徒用用語集ページ
app.get('/student/glossary', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>用語集 - 学習アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <nav class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 py-3">
                <div class="flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-book mr-2 text-gray-600"></i>用語集
                    </h1>
                    <a href="/student" class="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition text-sm">
                        <i class="fas fa-home mr-1"></i>ホーム
                    </a>
                </div>
            </div>
        </nav>

        <div class="max-w-5xl mx-auto px-4 py-6">
            <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div class="mb-6">
                    <input type="text" id="search-input" 
                           placeholder="用語を検索..." 
                           class="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none transition">
                </div>

                <div id="glossary-list" class="space-y-4">
                    <div class="text-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // Auth Token Setup
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
            }

            document.addEventListener('DOMContentLoaded', async () => {
                const searchInput = document.getElementById('search-input');
                const listContainer = document.getElementById('glossary-list');
                
                async function loadGlossary(search = '') {
                    try {
                        const res = await axios.get('/api/glossary?search=' + search);
                        const items = res.data.glossary;
                        
                        if (items.length === 0) {
                            listContainer.innerHTML = '<div class="text-center py-12 text-gray-500">用語が見つかりません</div>';
                            return;
                        }
                        
                        listContainer.innerHTML = items.map(item => \`
                            <div class="border-l-4 border-gray-700 bg-white rounded-r-lg border p-4 hover:bg-gray-50 transition">
                                <div class="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 class="text-lg font-bold text-gray-800">\${item.term}</h3>
                                        \${item.reading ? \`<p class="text-xs text-gray-500">\${item.reading}</p>\` : ''}
                                    </div>
                                    \${item.category ? \`<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">\${item.category}</span>\` : ''}
                                </div>
                                <p class="text-gray-700 mb-3 whitespace-pre-wrap">\${item.definition}</p>
                                \${item.example ? \`
                                    <div class="bg-gray-50 p-3 rounded text-sm text-gray-700 border border-gray-200">
                                        <span class="font-bold text-gray-700 mr-2">例:</span> \${item.example}
                                    </div>
                                \` : ''}
                            </div>
                        \`).join('');
                    } catch(e) {
                        listContainer.innerHTML = '<div class="text-center py-12 text-red-500">読み込みに失敗しました</div>';
                    }
                }
                
                searchInput.addEventListener('input', (e) => {
                    loadGlossary(e.target.value);
                });
                
                loadGlossary();
            });
        </script>
    </body>
    </html>
  `)
})

// 教師用用語集管理ページ
app.get('/teacher/glossary', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>用語集管理 - 学習アプリ開発プラットフォーム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <nav class="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-book mr-2"></i>
                        用語集管理
                    </h1>
                    <div class="flex gap-4">
                        <a href="/teacher" class="px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-400 transition">
                            <i class="fas fa-home mr-2"></i>トップ
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- 左カラム: フォーム -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                        <h2 class="text-xl font-bold text-gray-800 mb-4" id="form-title">
                            <i class="fas fa-plus-circle mr-2 text-orange-500"></i>
                            用語の登録
                        </h2>
                        <form id="glossary-form" class="space-y-4">
                            <input type="hidden" name="id" id="edit-id">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">用語 *</label>
                                <input type="text" name="term" id="input-term" required class="w-full px-3 py-2 border rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">読み仮名</label>
                                <input type="text" name="reading" id="input-reading" class="w-full px-3 py-2 border rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                                <input type="text" name="category" id="input-category" class="w-full px-3 py-2 border rounded-lg" placeholder="例: 図形">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">定義 *</label>
                                <textarea name="definition" id="input-definition" required rows="4" class="w-full px-3 py-2 border rounded-lg"></textarea>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">用例</label>
                                <textarea name="example" id="input-example" rows="2" class="w-full px-3 py-2 border rounded-lg"></textarea>
                            </div>
                            <div class="flex gap-2 pt-2">
                                <button type="submit" id="submit-btn" class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-bold">
                                    登録
                                </button>
                                <button type="button" id="cancel-btn" onclick="resetForm()" class="hidden px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                                    キャンセル
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- 右カラム: 一覧 -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-xl font-bold text-gray-800">
                                <i class="fas fa-list mr-2 text-orange-500"></i>
                                登録済み用語
                            </h2>
                            <input type="text" id="search-input" placeholder="検索..." class="px-3 py-1 border rounded-lg text-sm">
                        </div>
                        <div id="glossary-list" class="space-y-4">
                            <!-- JSで描画 -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
            } else {
                window.location.href = '/login';
            }

            let allTerms = [];

            document.addEventListener('DOMContentLoaded', () => {
                loadGlossary();
                
                document.getElementById('glossary-form').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const id = document.getElementById('edit-id').value;
                    const data = Object.fromEntries(formData.entries());
                    
                    try {
                        if (id) {
                            await axios.put('/api/teacher/glossary/' + id, data);
                            Swal.fire({ icon: 'success', title: '更新完了', text: '更新しました' });
                        } else {
                            await axios.post('/api/teacher/glossary', data);
                            Swal.fire({ icon: 'success', title: '登録完了', text: '登録しました' });
                        }
                        resetForm();
                        loadGlossary();
                    } catch(e) {
                        Swal.fire({ icon: 'error', title: 'エラー', text: 'エラーが発生しました' });
                    }
                });
                
                document.getElementById('search-input').addEventListener('input', (e) => {
                    renderList(e.target.value);
                });
            });

            async function loadGlossary() {
                try {
                    const res = await axios.get('/api/glossary');
                    allTerms = res.data.glossary;
                    renderList();
                } catch(e) {
                    console.error(e);
                }
            }

            function renderList(search = '') {
                const container = document.getElementById('glossary-list');
                const filtered = allTerms.filter(t => 
                    (t.term + t.definition + (t.reading||'')).toLowerCase().includes(search.toLowerCase())
                );
                
                if (filtered.length === 0) {
                    container.innerHTML = '<p class="text-gray-500 text-center py-8">用語が見つかりません</p>';
                    return;
                }
                
                container.innerHTML = filtered.map(t => \`
                    <div class="border border-gray-200 rounded-lg p-4 hover:bg-orange-50 transition relative group">
                        <div class="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition flex gap-2">
                            <button onclick="editTerm(\${t.id})" class="text-blue-500 hover:bg-blue-50 p-1 rounded"><i class="fas fa-pen"></i></button>
                            <button onclick="deleteTerm(\${t.id})" class="text-red-500 hover:bg-red-50 p-1 rounded"><i class="fas fa-trash"></i></button>
                        </div>
                        <div class="flex items-baseline gap-2 mb-1">
                            <h3 class="font-bold text-lg text-gray-800">\${t.term}</h3>
                            <span class="text-xs text-gray-500">\${t.reading || ''}</span>
                            \${t.category ? \`<span class="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">\${t.category}</span>\` : ''}
                        </div>
                        <p class="text-gray-700 text-sm mb-2">\${t.definition}</p>
                        \${t.example ? \`<p class="text-xs text-gray-500 bg-gray-50 p-2 rounded"><span class="font-bold">例:</span> \${t.example}</p>\` : ''}
                    </div>
                \`).join('');
            }

            window.editTerm = function(id) {
                const term = allTerms.find(t => t.id === id);
                if (!term) return;
                
                document.getElementById('edit-id').value = term.id;
                document.getElementById('input-term').value = term.term;
                document.getElementById('input-reading').value = term.reading || '';
                document.getElementById('input-category').value = term.category || '';
                document.getElementById('input-definition').value = term.definition;
                document.getElementById('input-example').value = term.example || '';
                
                document.getElementById('form-title').innerHTML = '<i class="fas fa-pen mr-2 text-blue-500"></i>用語を編集';
                document.getElementById('submit-btn').textContent = '更新';
                document.getElementById('submit-btn').className = 'flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold';
                document.getElementById('cancel-btn').classList.remove('hidden');
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };

            window.deleteTerm = async function(id) {
                const { isConfirmed } = await Swal.fire({
        icon: 'warning',
        title: '確認',
        text: '削除しますか？',
        showCancelButton: true,
        confirmButtonText: 'はい',
        cancelButtonText: 'いいえ'
    });
    if (!isConfirmed) return;
                try {
                    await axios.delete('/api/teacher/glossary/' + id);
                    loadGlossary();
                } catch(e) {
                    Swal.fire({ icon: 'error', title: 'エラー', text: '削除に失敗しました' });
                }
            };

            window.resetForm = function() {
                document.getElementById('glossary-form').reset();
                document.getElementById('edit-id').value = '';
                
                document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle mr-2 text-orange-500"></i>用語の登録';
                document.getElementById('submit-btn').textContent = '登録';
                document.getElementById('submit-btn').className = 'flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-bold';
                document.getElementById('cancel-btn').classList.add('hidden');
            };
        </script>
    </body>
    </html>
  `)
})

// 質問管理画面
app.get('/teacher/questions', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>質問管理 - 学習アプリ開発プラットフォーム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ナビゲーションバー -->
        <nav class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-comments mr-2"></i>
                        質問管理
                    </h1>
                    <div class="flex gap-4 items-center">
                        <a href="/teacher" class="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition">
                            <i class="fas fa-home mr-2"></i>トップ
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-6">
                    <i class="fas fa-inbox mr-2 text-blue-500"></i>
                    生徒からの質問一覧
                </h2>
                
                <div id="questions-list" class="space-y-6">
                    <div class="text-center py-12">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Auth Token Setup
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
            } else {
                window.location.href = '/login';
            }

            async function loadQuestions() {
                try {
                    const res = await axios.get('/api/teacher/questions');
                    const questions = res.data.questions;
                    const container = document.getElementById('questions-list');
                    
                    if (questions.length === 0) {
                        container.innerHTML = '<p class="text-center text-gray-500 py-8">まだ質問はありません</p>';
                        return;
                    }
                    
                    container.innerHTML = questions.map(q => {
                        const isReplied = q.status === 'replied';
                        const statusBadge = isReplied 
                            ? '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">返信済み</span>'
                            : '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">未返信</span>';
                            
                        const dateStr = dayjs(q.created_at).format('YYYY/MM/DD HH:mm');
                        
                        return \`
                            <div class="border rounded-lg p-6 \${isReplied ? 'bg-gray-50' : 'bg-white border-red-200 shadow-sm'}">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <div class="flex items-center gap-3 mb-2">
                                            \${statusBadge}
                                            <span class="font-bold text-gray-700"><i class="fas fa-user mr-1"></i>\${q.student_name}</span>
                                            <span class="text-sm text-gray-500"><i class="fas fa-clock mr-1"></i>\${dateStr}</span>
                                        </div>
                                        <div class="text-sm text-gray-500 mb-2">
                                            対象モジュール: \${q.module_name || '不明'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="bg-gray-100 p-4 rounded-lg mb-4">
                                    <p class="text-gray-800 font-bold mb-1">Q. 質問内容</p>
                                    <p class="text-gray-700 whitespace-pre-wrap">\${q.question_text}</p>
                                </div>
                                
                                \${isReplied ? \`
                                    <div class="bg-green-50 p-4 rounded-lg border border-green-100">
                                        <p class="text-green-800 font-bold mb-1">A. あなたの返信</p>
                                        <p class="text-gray-700 whitespace-pre-wrap">\${q.reply_text}</p>
                                        <p class="text-xs text-gray-400 mt-2 text-right">返信日時: \${dayjs(q.reply_at).format('YYYY/MM/DD HH:mm')}</p>
                                    </div>
                                \` : \`
                                    <div>
                                        <textarea id="reply-\${q.id}" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-3" rows="3" placeholder="返信内容を入力してください..."></textarea>
                                        <button onclick="sendReply(\${q.id})" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold">
                                            <i class="fas fa-paper-plane mr-2"></i>返信する
                                        </button>
                                    </div>
                                \`}
                            </div>
                        \`;
                    }).join('');
                    
                } catch (e) {
                    console.error(e);
                    document.getElementById('questions-list').innerHTML = '<p class="text-center text-red-500 py-8">読み込みエラーが発生しました</p>';
                }
            }
            
            async function sendReply(id) {
                const text = document.getElementById('reply-' + id).value;
                if (!text.trim()) return Swal.fire({ icon: 'info', text: '返信内容を入力してください' });
                
                try {
                    await axios.post('/api/teacher/questions/' + id + '/reply', { reply_text: text });
                    Swal.fire('送信完了', '返信を送信しました', 'success');
                    loadQuestions();
                } catch (e) {
                    console.error(e);
                    Swal.fire('エラー', '送信に失敗しました', 'error');
                }
            }
            
            loadQuestions();
        </script>
    </body>
    </html>
  `)
})

export default app
