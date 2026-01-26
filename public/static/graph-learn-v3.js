// グラフ読解モジュールの学習ロジック - 完全動作版

// グローバル変数
window.graphLearning = {
  currentStepIndex: 0,
  quizAnswered: false,
  MODULE_ID: 'graph_basics'
};

// ページ読み込み完了後に実行
function initGraphLearning() {
  console.log('=== グラフ学習ページ初期化開始 ===');
  console.log('graphSteps:', typeof window.graphSteps !== 'undefined' ? 'OK' : 'NG');
  console.log('graphSteps配列:', window.graphSteps);
  console.log('graphSteps長さ:', window.graphSteps ? window.graphSteps.length : 'undefined');
  
  if (typeof window.graphSteps === 'undefined' || !window.graphSteps || window.graphSteps.length === 0) {
    console.error('❌ graphStepsが定義されていないか空です');
    alert('エラー: 学習データが読み込まれていません。ページを再読み込みしてください。');
    return;
  }
  
  console.log('利用可能なステップ数:', window.graphSteps.length);
  console.log('最初のステップ:', window.graphSteps[0]);
  
  renderStepNavigation();
  renderStep(window.graphLearning.currentStepIndex);
  updateNavigationButtons();
  
  console.log('=== 初期化完了 ===');
}

// ステップナビゲーション描画
function renderStepNavigation() {
  const navContainer = document.getElementById('step-nav');
  if (!navContainer) {
    console.error('❌ step-navが見つかりません');
    return;
  }

  let html = '';
  window.graphSteps.forEach((step, index) => {
    const status = index < window.graphLearning.currentStepIndex ? 'completed' : 
                   (index === window.graphLearning.currentStepIndex ? 'active' : '');
    html += `<div class="step-dot ${status}" data-step="${index}" title="${step.title}"></div>`;
  });
  navContainer.innerHTML = html;

  // クリックイベント
  navContainer.querySelectorAll('.step-dot').forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if (index <= window.graphLearning.currentStepIndex) {
        goToStep(index);
      }
    });
  });
  
  console.log('✓ ステップナビゲーション描画完了');
}

// ステップ描画
function renderStep(index) {
  console.log('--- ステップ描画開始:', index, '---');
  console.log('window.graphSteps:', window.graphSteps);
  console.log('window.graphSteps[' + index + ']:', window.graphSteps ? window.graphSteps[index] : 'graphSteps is undefined');
  
  const contentArea = document.getElementById('content-area');
  console.log('content-area要素:', contentArea ? 'OK' : 'NG');
  
  if (!contentArea) {
    console.error('❌ content-areaが見つかりません');
    return;
  }
  
  if (!window.graphSteps || !window.graphSteps[index]) {
    console.error('❌ ステップが見つかりません - index:', index, 'graphSteps:', window.graphSteps);
    return;
  }

  const step = window.graphSteps[index];
  console.log('ステップデータ取得成功:', step.title);
  window.graphLearning.quizAnswered = false;

  contentArea.innerHTML = `
    <div class="fade-in">
      <div class="mb-6">
        <div class="text-blue-600 font-semibold mb-2">ステップ ${index + 1} / ${window.graphSteps.length}</div>
        <h3 class="text-2xl font-bold text-gray-800 mb-3">${step.title}</h3>
        <p class="text-gray-600">${step.description}</p>
      </div>

      <div class="mb-8">
        ${step.content}
      </div>

      <!-- 理解確認チェックボックス -->
      <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
        <label class="flex items-start cursor-pointer">
          <input type="checkbox" id="understanding-check" class="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500">
          <span class="ml-3 text-lg text-gray-800">
            <i class="fas fa-check-circle text-blue-600 mr-2"></i>
            <strong>上の説明を読んで、理解しました</strong>
            <span class="block text-sm text-gray-600 mt-1">チェックを入れると練習問題が表示されます</span>
          </span>
        </label>
      </div>

      <div id="quiz-section" class="hidden bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
        <h4 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-question-circle mr-2 text-purple-600"></i>
          練習問題
        </h4>
        <p class="text-lg text-gray-700 mb-6">${step.quiz.question}</p>

        <div id="quiz-options" class="space-y-3">
          ${step.quiz.options.map(option => `
            <div class="quiz-option cursor-pointer" data-option-id="${option.id}" data-is-correct="${option.correct ? 'true' : 'false'}">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 font-bold text-blue-600">
                  ${option.id.toUpperCase()}
                </div>
                <div class="flex-1 text-gray-800">${option.text}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div id="quiz-feedback" class="hidden mt-6"></div>
      </div>
    </div>
  `;

  // クイズオプションにイベント
  setTimeout(() => {
    // 理解確認チェックボックスのイベント
    const understandingCheck = contentArea.querySelector('#understanding-check');
    const quizSection = contentArea.querySelector('#quiz-section');
    
    console.log('チェックボックス要素:', understandingCheck ? 'OK' : 'NG');
    console.log('クイズセクション要素:', quizSection ? 'OK' : 'NG');
    
    if (understandingCheck && quizSection) {
      understandingCheck.addEventListener('change', function() {
        if (this.checked) {
          console.log('✓ 理解確認チェック - クイズ表示');
          quizSection.classList.remove('hidden');
          quizSection.classList.add('fade-in');
          // クイズセクションまでスクロール
          quizSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          console.log('✗ 理解確認チェック解除 - クイズ非表示');
          quizSection.classList.add('hidden');
          window.graphLearning.quizAnswered = false;
          updateNavigationButtons();
        }
      });
      console.log('✓ チェックボックスイベントリスナー設定完了');
    } else {
      console.error('❌ チェックボックスまたはクイズセクションが見つかりません');
    }
    
    contentArea.querySelectorAll('.quiz-option').forEach(optionEl => {
      optionEl.addEventListener('click', function() {
        handleQuizAnswer(this, step.quiz);
      });
    });
    console.log('✓ クイズオプションのイベントリスナー設定完了');
  }, 100);

  // 進捗更新
  if (typeof window.updateProgress === 'function') {
    window.updateProgress(window.graphLearning.MODULE_ID, step.id, 'in_progress');
  }
  
  console.log('--- ステップ描画完了 ---');
}

// クイズ解答処理
async function handleQuizAnswer(optionEl, quiz) {
  console.log('>>> クイズ解答処理開始 <<<');
  
  if (window.graphLearning.quizAnswered) {
    console.log('既に解答済み');
    return;
  }

  const optionId = optionEl.dataset.optionId;
  const isCorrect = optionEl.dataset.isCorrect === 'true';
  
  console.log('選択:', optionId, '正解:', isCorrect);
  
  const selectedOption = quiz.options.find(opt => opt.id === optionId);
  if (!selectedOption) return;

  window.graphLearning.quizAnswered = true;
  optionEl.classList.add('selected');

  // すべてのオプション無効化
  document.querySelectorAll('.quiz-option').forEach(el => {
    el.style.pointerEvents = 'none';
  });

  const feedbackArea = document.getElementById('quiz-feedback');

  if (isCorrect) {
    console.log('✓ 正解！');
    optionEl.classList.add('correct');
    feedbackArea.className = 'mt-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg fade-in';
    feedbackArea.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-3xl">✅</div>
        <div>
          <h5 class="text-lg font-bold text-green-800 mb-2">正解です！</h5>
          <p class="text-gray-700">${selectedOption.explanation}</p>
        </div>
      </div>
    `;

    // 達成記録
    if (typeof window.addAchievement === 'function') {
      await window.addAchievement(
        'step_complete',
        `${window.graphLearning.MODULE_ID}_${window.graphSteps[window.graphLearning.currentStepIndex].id}`,
        10,
        `${window.graphSteps[window.graphLearning.currentStepIndex].title}を完了`,
        '正解しました！'
      );
    }

    // 進捗更新
    if (typeof window.updateProgress === 'function') {
      await window.updateProgress(
        window.graphLearning.MODULE_ID, 
        window.graphSteps[window.graphLearning.currentStepIndex].id, 
        'completed'
      );
    }

  } else {
    console.log('✗ 不正解');
    optionEl.classList.add('incorrect');
    feedbackArea.className = 'mt-6 p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg fade-in';
    feedbackArea.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-3xl">💡</div>
        <div>
          <h5 class="text-lg font-bold text-yellow-800 mb-2">もう一度考えてみましょう</h5>
          <p class="text-gray-700">${selectedOption.explanation}</p>
          <button id="retry-btn" class="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
            もう一度答える
          </button>
        </div>
      </div>
    `;

    // リトライボタン
    setTimeout(() => {
      const retryBtn = document.getElementById('retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          console.log('リトライボタンクリック');
          window.graphLearning.quizAnswered = false;
          document.querySelectorAll('.quiz-option').forEach(el => {
            el.classList.remove('selected', 'incorrect');
            el.style.pointerEvents = 'auto';
          });
          feedbackArea.classList.add('hidden');
          updateNavigationButtons();
        });
      }
    }, 100);
  }

  feedbackArea.classList.remove('hidden');
  
  console.log('ボタン更新を待機...');
  setTimeout(() => {
    updateNavigationButtons();
    console.log('>>> クイズ解答処理完了 <<<');
  }, 200);
}

// ステップ移動
function goToStep(index) {
  console.log('ステップ移動:', index);
  if (index < 0 || index >= window.graphSteps.length) return;
  window.graphLearning.currentStepIndex = index;
  renderStepNavigation();
  renderStep(index);
  updateNavigationButtons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ナビゲーションボタン更新
function updateNavigationButtons() {
  console.log('▶ ナビゲーションボタン更新', {
    quizAnswered: window.graphLearning.quizAnswered,
    currentStep: window.graphLearning.currentStepIndex
  });
  
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const completionMsg = document.getElementById('completion-message');

  // 前へボタン
  if (prevBtn) {
    prevBtn.disabled = window.graphLearning.currentStepIndex === 0;
    prevBtn.onclick = () => {
      console.log('前へボタンクリック');
      goToStep(window.graphLearning.currentStepIndex - 1);
    };
  }

  // 次へボタン
  if (nextBtn) {
    // 一旦リセット
    nextBtn.className = 'px-6 py-3 text-white rounded-lg transition';
    
    if (window.graphLearning.currentStepIndex === window.graphSteps.length - 1) {
      // 最後のステップ
      if (window.graphLearning.quizAnswered) {
        console.log('最終ステップ - 完了ボタン有効');
        nextBtn.innerHTML = '<i class="fas fa-check mr-2"></i>完了';
        nextBtn.className += ' bg-green-500 hover:bg-green-600';
        nextBtn.disabled = false;
        nextBtn.onclick = async () => {
          console.log('完了ボタンクリック');
          if (typeof window.addAchievement === 'function') {
            await window.addAchievement(
              'module_complete',
              window.graphLearning.MODULE_ID,
              50,
              'グラフの読解モジュール完了',
              '8つのステップをすべて完了しました！'
            );
          }
          if (completionMsg) {
            completionMsg.classList.remove('hidden');
            nextBtn.classList.add('hidden');
          }
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        };
      } else {
        console.log('最終ステップ - 問題未解答');
        nextBtn.innerHTML = '問題に答えてください';
        nextBtn.className += ' bg-gray-400 cursor-not-allowed';
        nextBtn.disabled = true;
      }
    } else {
      // 途中のステップ
      nextBtn.innerHTML = '次へ<i class="fas fa-arrow-right ml-2"></i>';
      
      if (window.graphLearning.quizAnswered) {
        console.log('✓ 次へボタン有効化');
        nextBtn.className += ' bg-blue-500 hover:bg-blue-600';
        nextBtn.disabled = false;
        nextBtn.onclick = () => {
          console.log('【次へボタンクリック】');
          goToStep(window.graphLearning.currentStepIndex + 1);
        };
      } else {
        console.log('✗ 次へボタン無効（問題未解答）');
        nextBtn.className += ' bg-gray-400 cursor-not-allowed opacity-50';
        nextBtn.disabled = true;
        nextBtn.onclick = null;
      }
    }
    
    console.log('次へボタン状態:', {
      disabled: nextBtn.disabled,
      className: nextBtn.className,
      hasOnclick: nextBtn.onclick !== null
    });
  }
}

// DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGraphLearning);
} else {
  initGraphLearning();
}

// グローバル関数として公開
window.graphSteps = window.graphSteps || [];
window.initGraphLearning = initGraphLearning;
window.goToStep = goToStep;
window.updateNavigationButtons = updateNavigationButtons;

console.log('graph-learn.js 読み込み完了');
