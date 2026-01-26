// グラフ読解モジュールの学習ロジック

let currentStepIndex = 0;
let quizAnswered = false;
const MODULE_ID = 'graph_basics';

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('グラフ学習ページ初期化');
  console.log('利用可能なステップ数:', graphSteps ? graphSteps.length : 0);
  
  if (typeof graphSteps === 'undefined') {
    console.error('graphStepsが定義されていません');
    return;
  }
  
  renderStepNavigation();
  renderStep(currentStepIndex);
  updateNavigationButtons();
});

// ステップナビゲーション描画
function renderStepNavigation() {
  const navContainer = document.getElementById('step-nav');
  if (!navContainer) {
    console.error('step-navが見つかりません');
    return;
  }

  let html = '';
  graphSteps.forEach((step, index) => {
    const status = index < currentStepIndex ? 'completed' : (index === currentStepIndex ? 'active' : '');
    html += `<div class="step-dot ${status}" data-step="${index}" title="${step.title}"></div>`;
  });
  navContainer.innerHTML = html;

  // クリックイベント追加
  navContainer.querySelectorAll('.step-dot').forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if (index <= currentStepIndex) {
        goToStep(index);
      }
    });
  });
}

// ステップ描画
function renderStep(index) {
  console.log('ステップ描画:', index);
  const contentArea = document.getElementById('content-area');
  if (!contentArea || !graphSteps[index]) {
    console.error('content-areaまたはステップが見つかりません');
    return;
  }

  const step = graphSteps[index];
  quizAnswered = false;

  contentArea.innerHTML = `
    <div class="fade-in">
      <div class="mb-6">
        <div class="text-blue-600 font-semibold mb-2">ステップ ${index + 1} / ${graphSteps.length}</div>
        <h3 class="text-2xl font-bold text-gray-800 mb-3">${step.title}</h3>
        <p class="text-gray-600">${step.description}</p>
      </div>

      <div class="mb-8">
        ${step.content}
      </div>

      <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
        <h4 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-question-circle mr-2 text-purple-600"></i>
          練習問題
        </h4>
        <p class="text-lg text-gray-700 mb-6">${step.quiz.question}</p>

        <div id="quiz-options" class="space-y-3">
          ${step.quiz.options.map(option => `
            <div class="quiz-option" data-option-id="${option.id}" data-is-correct="${option.correct ? 'true' : 'false'}">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 font-bold text-blue-600">
                  ${option.id.toUpperCase()}
                </div>
                <div class="flex-1 text-gray-800">${option.text}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div id="quiz-feedback" class="hidden mt-6">
          <!-- フィードバックはJavaScriptで表示 -->
        </div>
      </div>
    </div>
  `;

  // クイズオプションにクリックイベント追加
  contentArea.querySelectorAll('.quiz-option').forEach(optionEl => {
    optionEl.addEventListener('click', () => {
      console.log('クイズオプションがクリックされました:', optionEl.dataset.optionId);
      handleQuizAnswer(optionEl, step.quiz);
    });
  });

  // 進捗を「学習中」に更新
  updateProgress(MODULE_ID, step.id, 'in_progress');
}

// クイズ解答処理
async function handleQuizAnswer(optionEl, quiz) {
  console.log('handleQuizAnswer開始');
  
  if (quizAnswered) {
    console.log('既に解答済み');
    return;
  }

  const optionId = optionEl.dataset.optionId;
  const isCorrectStr = optionEl.dataset.isCorrect;
  const isCorrect = isCorrectStr === 'true';
  
  console.log('選択されたオプション:', optionId, '正解:', isCorrect);
  
  const selectedOption = quiz.options.find(opt => opt.id === optionId);
  if (!selectedOption) {
    console.error('オプションが見つかりません');
    return;
  }

  quizAnswered = true;
  optionEl.classList.add('selected');

  // すべてのオプションを無効化
  document.querySelectorAll('.quiz-option').forEach(el => {
    el.style.pointerEvents = 'none';
  });

  const feedbackArea = document.getElementById('quiz-feedback');

  // 解答を保存
  await saveAnswer(
    MODULE_ID,
    graphSteps[currentStepIndex].id,
    `q${currentStepIndex}`,
    optionId,
    isCorrect,
    selectedOption.explanation
  );

  // フィードバック表示
  if (isCorrect) {
    console.log('正解！');
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

    // 達成記録追加
    await addAchievement(
      'step_complete',
      `${MODULE_ID}_${graphSteps[currentStepIndex].id}`,
      10,
      `${graphSteps[currentStepIndex].title}を完了`,
      '正解しました！'
    );

    // 進捗を「完了」に更新
    await updateProgress(MODULE_ID, graphSteps[currentStepIndex].id, 'completed');

  } else {
    console.log('不正解');
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
    document.getElementById('retry-btn')?.addEventListener('click', () => {
      console.log('リトライボタンがクリックされました');
      quizAnswered = false;
      document.querySelectorAll('.quiz-option').forEach(el => {
        el.classList.remove('selected', 'incorrect');
        el.style.pointerEvents = 'auto';
      });
      feedbackArea.classList.add('hidden');
      updateNavigationButtons();
    });
  }

  feedbackArea.classList.remove('hidden');
  console.log('ナビゲーションボタン更新前 - quizAnswered:', quizAnswered);
  updateNavigationButtons();
}

// ステップ移動
function goToStep(index) {
  console.log('ステップ移動:', index);
  if (index < 0 || index >= graphSteps.length) return;
  currentStepIndex = index;
  renderStepNavigation();
  renderStep(index);
  updateNavigationButtons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ナビゲーションボタン更新
function updateNavigationButtons() {
  console.log('ナビゲーションボタン更新 - quizAnswered:', quizAnswered, 'currentStepIndex:', currentStepIndex);
  
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const completionMsg = document.getElementById('completion-message');

  if (prevBtn) {
    prevBtn.disabled = currentStepIndex === 0;
    prevBtn.onclick = () => {
      console.log('前へボタンがクリックされました');
      goToStep(currentStepIndex - 1);
    };
  }

  if (nextBtn) {
    if (currentStepIndex === graphSteps.length - 1) {
      // 最後のステップ
      if (quizAnswered) {
        nextBtn.textContent = '完了';
        nextBtn.innerHTML = '<i class="fas fa-check mr-2"></i>完了';
        nextBtn.disabled = false;
        nextBtn.onclick = async () => {
          console.log('完了ボタンがクリックされました');
          // モジュール完了を記録
          await addAchievement(
            'module_complete',
            MODULE_ID,
            50,
            'グラフの読解モジュール完了',
            '8つのステップをすべて完了しました！'
          );
          
          // 完了メッセージ表示
          if (completionMsg) {
            completionMsg.classList.remove('hidden');
            nextBtn.classList.add('hidden');
          }
          
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        };
      } else {
        nextBtn.disabled = true;
        nextBtn.innerHTML = '問題に答えてください';
      }
    } else {
      // 途中のステップ
      nextBtn.innerHTML = '次へ<i class="fas fa-arrow-right ml-2"></i>';
      nextBtn.disabled = !quizAnswered;
      nextBtn.onclick = () => {
        console.log('次へボタンがクリックされました');
        goToStep(currentStepIndex + 1);
      };
    }
  }
  
  console.log('ボタン状態 - 次へボタン無効:', nextBtn?.disabled);
}
