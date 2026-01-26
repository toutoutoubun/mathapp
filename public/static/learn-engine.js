// 共通学習エンジン - すべてのモジュールで使用する汎用システム

/**
 * 学習エンジンの状態管理
 */
window.LearningEngine = {
  currentModule: null,
  currentStepIndex: 0,
  quizAnswered: false,
  understandingConfirmed: false,
  moduleSteps: [],
  
  /**
   * モジュールを初期化
   * @param {string} moduleId - モジュールID（例: 'graph_basics', 'cardinality'）
   * @param {Array} steps - ステップの配列
   */
  init: function(moduleId, steps) {
    console.log('=== 学習エンジン初期化 ===');
    console.log('モジュールID:', moduleId);
    console.log('ステップ数:', steps ? steps.length : 0);
    
    this.currentModule = moduleId;
    this.moduleSteps = steps;
    this.currentStepIndex = 0;
    this.quizAnswered = false;
    this.understandingConfirmed = false;
    
    if (!steps || steps.length === 0) {
      console.error('❌ ステップが定義されていません');
      return false;
    }
    
    console.log('✅ 初期化完了');
    return true;
  },
  
  /**
   * ステップナビゲーションを描画
   */
  renderStepNavigation: function() {
    const navContainer = document.getElementById('step-nav');
    if (!navContainer) {
      console.error('❌ step-nav要素が見つかりません');
      return;
    }
    
    navContainer.innerHTML = '';
    
    this.moduleSteps.forEach((step, index) => {
      const dot = document.createElement('div');
      dot.className = 'step-dot';
      dot.dataset.step = index;
      
      // ステータスに応じてクラスを追加
      if (index < this.currentStepIndex) {
        dot.classList.add('completed');
      } else if (index === this.currentStepIndex) {
        dot.classList.add('active');
      }
      
      // クリックイベント（完了済みステップのみ）
      if (index <= this.currentStepIndex) {
        dot.style.cursor = 'pointer';
        dot.addEventListener('click', () => this.goToStep(index));
      }
      
      navContainer.appendChild(dot);
    });
    
    console.log('✓ ステップナビゲーション描画完了');
  },
  
  /**
   * 指定ステップを描画
   * @param {number} index - ステップインデックス
   */
  renderStep: function(index) {
    console.log('--- ステップ描画開始:', index, '---');
    
    const contentArea = document.getElementById('content-area');
    if (!contentArea) {
      console.error('❌ content-area要素が見つかりません');
      return;
    }
    
    if (!this.moduleSteps || !this.moduleSteps[index]) {
      console.error('❌ ステップデータが存在しません:', index);
      return;
    }
    
    const step = this.moduleSteps[index];
    
    // 状態をリセット
    this.quizAnswered = false;
    this.understandingConfirmed = false;
    
    // HTMLを構築
    contentArea.innerHTML = `
      <div class="fade-in">
        <div class="mb-4 text-sm text-gray-500">
          ステップ ${index + 1} / ${this.moduleSteps.length}
        </div>
        
        <h2 class="text-2xl font-bold mb-4 text-gray-800">${step.title}</h2>
        <p class="text-gray-600 mb-6">${step.description}</p>
        
        <div class="mb-8">
          ${step.content}
        </div>
        
        <!-- 理解確認チェックボックス -->
        <div class="bg-blue-50 p-4 rounded-lg mb-6">
          <label class="flex items-start space-x-3 cursor-pointer">
            <input type="checkbox" id="understanding-check" class="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
            <div>
              <span class="text-gray-800 font-medium">上の説明を読んで、理解しました</span>
              <p class="text-sm text-gray-600 mt-1">チェックを入れると練習問題が表示されます</p>
            </div>
          </label>
        </div>
        
        <!-- クイズセクション（初期は非表示） -->
        <div id="quiz-section" class="hidden">
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200 mb-6">
            <h3 class="text-xl font-bold text-purple-800 mb-4">
              <i class="fas fa-pencil-alt mr-2"></i>練習問題
            </h3>
            <p class="text-gray-800 mb-4 text-lg">${step.quiz.question}</p>
            
            <div class="space-y-3" id="quiz-options">
              ${step.quiz.options.map(option => `
                <div class="quiz-option p-4 border-2 border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all"
                     data-id="${option.id}"
                     data-correct="${option.correct}">
                  <span class="font-medium">${option.id}.</span> ${option.text}
                </div>
              `).join('')}
            </div>
            
            <div id="quiz-feedback" class="mt-4"></div>
          </div>
        </div>
      </div>
    `;
    
    // イベントリスナーを設定（DOM更新後に実行）
    setTimeout(() => {
      this.attachEventListeners(step);
    }, 100);
    
    console.log('✓ ステップ描画完了');
  },
  
  /**
   * イベントリスナーを設定
   * @param {Object} step - 現在のステップデータ
   */
  attachEventListeners: function(step) {
    // 理解確認チェックボックス
    const understandingCheck = document.getElementById('understanding-check');
    const quizSection = document.getElementById('quiz-section');
    
    if (understandingCheck && quizSection) {
      understandingCheck.addEventListener('change', (e) => {
        if (e.target.checked) {
          console.log('✓ 理解確認チェック - クイズ表示');
          this.understandingConfirmed = true;
          quizSection.classList.remove('hidden');
          quizSection.classList.add('fade-in');
          quizSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          console.log('✗ 理解確認チェック解除 - クイズ非表示');
          this.understandingConfirmed = false;
          quizSection.classList.add('hidden');
          this.quizAnswered = false;
        }
        this.updateNavigationButtons();
      });
    }
    
    // クイズオプション
    const quizOptions = document.querySelectorAll('.quiz-option');
    quizOptions.forEach(option => {
      option.addEventListener('click', () => {
        this.handleQuizAnswer(option, step.quiz);
      });
    });
    
    console.log('✓ イベントリスナー設定完了');
  },
  
  /**
   * クイズの回答を処理
   * @param {HTMLElement} selectedOption - 選択された選択肢
   * @param {Object} quiz - クイズデータ
   */
  handleQuizAnswer: function(selectedOption, quiz) {
    console.log('>>> クイズ解答処理開始 <<<');
    
    const isCorrect = selectedOption.dataset.correct === 'true';
    const optionId = selectedOption.dataset.id;
    const feedbackDiv = document.getElementById('quiz-feedback');
    
    // 正解データを取得
    const correctOption = quiz.options.find(opt => opt.correct);
    
    if (isCorrect) {
      // 正解の場合
      selectedOption.classList.add('border-green-500', 'bg-green-50');
      selectedOption.innerHTML += ' <i class="fas fa-check-circle text-green-600 ml-2"></i>';
      
      feedbackDiv.innerHTML = `
        <div class="bg-green-100 border-l-4 border-green-500 p-4 rounded">
          <div class="flex items-center mb-2">
            <i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
            <span class="text-green-800 font-bold text-lg">✓ 正解です！</span>
          </div>
          <p class="text-green-700">${correctOption.explanation}</p>
        </div>
      `;
      
      this.quizAnswered = true;
      console.log('✅ 正解！次へボタンを有効化します');
      
      // 達成記録
      this.recordAchievement('step_complete', this.moduleSteps[this.currentStepIndex].id, 10);
      
    } else {
      // 不正解の場合
      selectedOption.classList.add('border-red-500', 'bg-red-50');
      selectedOption.innerHTML += ' <i class="fas fa-times-circle text-red-600 ml-2"></i>';
      
      feedbackDiv.innerHTML = `
        <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
          <div class="flex items-center mb-2">
            <i class="fas fa-lightbulb text-yellow-600 text-2xl mr-3"></i>
            <span class="text-yellow-800 font-bold text-lg">💡 もう一度考えてみましょう</span>
          </div>
          <p class="text-yellow-700 mb-3">${correctOption.explanation}</p>
          <button onclick="window.LearningEngine.resetQuiz()" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors">
            <i class="fas fa-redo mr-2"></i>もう一度答える
          </button>
        </div>
      `;
      
      console.log('❌ 不正解 - 再挑戦可能');
    }
    
    // すべての選択肢を無効化
    document.querySelectorAll('.quiz-option').forEach(opt => {
      opt.style.pointerEvents = 'none';
      opt.style.opacity = '0.7';
    });
    
    this.updateNavigationButtons();
  },
  
  /**
   * クイズをリセット
   */
  resetQuiz: function() {
    console.log('クイズをリセット');
    this.quizAnswered = false;
    this.renderStep(this.currentStepIndex);
    
    // チェックボックスを再度チェック
    setTimeout(() => {
      const checkbox = document.getElementById('understanding-check');
      if (checkbox) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
      }
    }, 200);
  },
  
  /**
   * ナビゲーションボタンの状態を更新
   */
  updateNavigationButtons: function() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const completionMessage = document.getElementById('completion-message');
    
    if (!prevBtn || !nextBtn) {
      console.warn('⚠ ナビゲーションボタンが見つかりません');
      return;
    }
    
    console.log('🔄 ボタン状態更新:', {
      currentStep: this.currentStepIndex,
      quizAnswered: this.quizAnswered,
      understandingConfirmed: this.understandingConfirmed
    });
    
    // 前へボタン
    if (this.currentStepIndex === 0) {
      prevBtn.disabled = true;
      prevBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      prevBtn.disabled = false;
      prevBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    
    // 次へボタン
    const isLastStep = this.currentStepIndex === this.moduleSteps.length - 1;
    
    if (this.quizAnswered) {
      // クイズに正解した場合、次へボタンを有効化
      nextBtn.disabled = false;
      nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      nextBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
      
      if (isLastStep) {
        // 最後のステップの場合、ボタンテキストを「完了」に変更
        const icon = nextBtn.querySelector('i');
        nextBtn.innerHTML = '完了';
        if (icon) nextBtn.appendChild(icon);
      } else {
        // 通常のステップの場合、ボタンテキストを「次へ」に保持
        const icon = nextBtn.querySelector('i');
        if (!nextBtn.textContent.includes('次へ')) {
          nextBtn.innerHTML = '次へ';
          if (icon) nextBtn.appendChild(icon);
        }
      }
      
      console.log('✅ 次へボタン有効化');
    } else {
      // クイズ未回答の場合、次へボタンを無効化
      nextBtn.disabled = true;
      nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
      nextBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      nextBtn.innerHTML = 'クイズに答えてください';
      
      console.log('🔒 次へボタン無効（クイズ未回答）');
    }
  },
  
  /**
   * 指定ステップへ移動
   * @param {number} index - 移動先のステップインデックス
   */
  goToStep: function(index) {
    console.log('ステップ移動:', this.currentStepIndex, '→', index);
    
    if (index < 0 || index >= this.moduleSteps.length) {
      console.error('❌ 無効なステップインデックス:', index);
      return;
    }
    
    this.currentStepIndex = index;
    this.renderStep(index);
    this.renderStepNavigation();
    this.updateNavigationButtons();
    
    // ページトップへスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  
  /**
   * モジュール完了処理
   */
  completeModule: async function() {
    console.log('🎉 モジュール完了！');
    
    const completionMessage = document.getElementById('completion-message');
    if (completionMessage) {
      completionMessage.classList.remove('hidden');
      completionMessage.scrollIntoView({ behavior: 'smooth' });
    }
    
    // 進捗を記録
    try {
      await axios.post('/api/progress', {
        module_id: this.currentModule,
        step_id: 'completed',
        status: 'completed'
      });
      
      // モジュール完了の達成記録
      await this.recordAchievement('module_complete', this.currentModule, 50);
      
      console.log('✅ 進捗保存完了');
      
      // 3秒後にホームへリダイレクト
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      
    } catch (error) {
      console.error('❌ 進捗保存エラー:', error);
    }
  },
  
  /**
   * 達成記録
   * @param {string} type - 達成タイプ
   * @param {string} details - 詳細
   * @param {number} points - 獲得ポイント
   */
  recordAchievement: async function(type, details, points) {
    try {
      await axios.post('/api/achievement', {
        achievement_type: type,
        details: details,
        points_earned: points
      });
      console.log(`✅ 達成記録: ${type} (+${points}ポイント)`);
    } catch (error) {
      console.error('❌ 達成記録エラー:', error);
    }
  }
};

// ページ読み込み時のグローバル初期化
document.addEventListener('DOMContentLoaded', function() {
  console.log('📚 学習エンジン準備完了');
});
