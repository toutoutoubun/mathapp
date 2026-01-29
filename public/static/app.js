// Auth Token Setup
const token = localStorage.getItem('token');
if (token && typeof axios !== 'undefined') {
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
}

// グローバル変数
let currentProgress = [];
let achievements = [];

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
  await loadProgress();
  await loadAchievements();
  displayProgress();
});

// 進捗データ取得
async function loadProgress() {
  try {
    const response = await axios.get('/api/progress');
    currentProgress = response.data.progress || [];
  } catch (error) {
    console.error('進捗データの取得に失敗しました:', error);
  }
}

// 達成データ取得
async function loadAchievements() {
  try {
    const response = await axios.get('/api/achievements');
    achievements = response.data.achievements || [];
  } catch (error) {
    console.error('達成データの取得に失敗しました:', error);
  }
}

// 進捗表示
function displayProgress() {
  const container = document.getElementById('progress-container');
  if (!container) return;

  if (currentProgress.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-rocket text-4xl mb-4"></i>
        <p class="text-lg">まだ学習を始めていません</p>
        <p class="text-sm">上のモジュールから始めてみましょう！</p>
      </div>
    `;
    return;
  }

  const moduleGroups = {};
  currentProgress.forEach(p => {
    if (!moduleGroups[p.module_id]) {
      moduleGroups[p.module_id] = [];
    }
    moduleGroups[p.module_id].push(p);
  });

  let html = '';
  Object.keys(moduleGroups).forEach(moduleId => {
    const steps = moduleGroups[moduleId];
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const totalSteps = steps.length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    html += `
      <div class="bg-gray-50 rounded-lg p-6">
        <div class="flex justify-between items-center mb-3">
          <h4 class="text-lg font-semibold text-gray-800">${getModuleName(moduleId)}</h4>
          <span class="text-sm text-gray-600">${completedSteps} / ${totalSteps} ステップ完了</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// モジュール名取得
function getModuleName(moduleId) {
  const names = {
    'graph_basics': 'グラフの読解',
    'cardinality': '基数性の再構築',
    'units': '単位と量',
    'proportions': '割合の直感',
    'approximation': '概数・おおよその判断'
  };
  return names[moduleId] || moduleId;
}

// 進捗更新
async function updateProgress(moduleId, stepId, status) {
  try {
    await axios.post('/api/progress', {
      module_id: moduleId,
      step_id: stepId,
      status: status
    });
    await loadProgress();
    displayProgress();
  } catch (error) {
    console.error('進捗の更新に失敗しました:', error);
  }
}

// 解答保存
async function saveAnswer(moduleId, stepId, questionId, answer, isCorrect, explanation) {
  try {
    await axios.post('/api/answer', {
      module_id: moduleId,
      step_id: stepId,
      question_id: questionId,
      answer: answer,
      is_correct: isCorrect,
      explanation: explanation
    });
  } catch (error) {
    console.error('解答の保存に失敗しました:', error);
  }
}

// 達成記録追加
async function addAchievement(achievementType, achievementId, points, title, description) {
  try {
    await axios.post('/api/achievement', {
      achievement_type: achievementType,
      achievement_id: achievementId,
      points: points,
      title: title,
      description: description
    });
    
    // 達成通知表示
    showAchievementNotification(title, points);
    
    // カードアンロックチェック
    await checkCardUnlock(points);
    
    await loadAchievements();
  } catch (error) {
    console.error('達成記録の追加に失敗しました:', error);
  }
}

// 達成通知表示
function showAchievementNotification(title, points) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 fade-in';
  notification.innerHTML = `
    <div class="flex items-center gap-3">
      <i class="fas fa-trophy text-2xl"></i>
      <div>
        <div class="font-bold">${title}</div>
        <div class="text-sm">+${points} ポイント獲得!</div>
      </div>
    </div>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// カードアンロックチェック
async function checkCardUnlock(totalPoints) {
  // 累計ポイント計算
  const sumPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0) + totalPoints;
  
  // カードアンロック基準
  const cardThresholds = [
    { points: 10, cardId: 'nairobi' },
    { points: 30, cardId: 'lagos' },
    { points: 60, cardId: 'cairo' },
    { points: 100, cardId: 'kigali' },
    { points: 150, cardId: 'addis_ababa' },
    { points: 200, cardId: 'cape_town' }
  ];
  
  for (const threshold of cardThresholds) {
    if (sumPoints >= threshold.points) {
      await unlockCard(threshold.cardId);
    }
  }
}

// カードアンロック
async function unlockCard(cardId) {
  try {
    const response = await axios.post('/api/cards/unlock', { card_id: cardId });
    if (response.data.success) {
      showCardUnlockNotification(response.data.card);
    }
  } catch (error) {
    // すでにアンロック済みの場合は無視
    console.log('カードアンロック:', error.message);
  }
}

// カードアンロック通知
function showCardUnlockNotification(card) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-gradient-to-br from-green-400 to-blue-500 text-white px-6 py-4 rounded-lg shadow-xl z-50 fade-in';
  notification.innerHTML = `
    <div class="flex items-center gap-3">
      <i class="fas fa-gift text-3xl"></i>
      <div>
        <div class="font-bold text-lg">新しいカードを獲得!</div>
        <div class="text-sm">${card.city_name} (${card.country})</div>
      </div>
    </div>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// ハイライト制御
function highlightElement(elementId, className, dimOthers = false) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // 既存のハイライトをクリア
  document.querySelectorAll('.highlight-active, .highlight-yellow, .highlight-blue, .highlight-green, .highlight-orange, .highlight-pink').forEach(el => {
    el.classList.remove('highlight-active', 'highlight-yellow', 'highlight-blue', 'highlight-green', 'highlight-orange', 'highlight-pink');
  });
  
  // 他の要素を薄くする
  if (dimOthers) {
    document.querySelectorAll('.quiz-card > *').forEach(el => {
      if (el.id !== elementId) {
        el.classList.add('dimmed');
      }
    });
  }
  
  // 新しいハイライトを適用
  element.classList.add(className);
  
  // スムーズスクロール
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// 薄暗表示解除
function clearDimmed() {
  document.querySelectorAll('.dimmed').forEach(el => {
    el.classList.remove('dimmed');
  });
}

// ユーティリティ: 遅延処理
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
