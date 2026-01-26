// 汎用モジュールページスクリプト
// すべてのモジュールページで使用

document.addEventListener('DOMContentLoaded', function() {
  console.log('=== モジュールページ初期化 ===');
  
  // URLパラメータからモジュールIDを取得
  const urlParams = new URLSearchParams(window.location.search);
  const moduleId = urlParams.get('module') || getModuleIdFromPath();
  
  console.log('モジュールID:', moduleId);
  
  // モジュールIDに応じてステップデータを取得
  let steps = null;
  let moduleName = '';
  
  switch(moduleId) {
    case 'graph_basics':
      steps = window.graphSteps;
      moduleName = 'グラフの読解';
      break;
    case 'cardinality':
      steps = window.cardinalitySteps;
      moduleName = '基数性の再構築';
      break;
    case 'units':
      steps = window.unitsSteps;
      moduleName = '単位と量';
      break;
    case 'proportions':
      steps = window.proportionSteps;
      moduleName = '割合の直感';
      break;
    case 'approximation':
      steps = window.approximationSteps;
      moduleName = '概数・おおよその判断';
      break;
    default:
      console.error('❌ 不明なモジュールID:', moduleId);
      return;
  }
  
  if (!steps || steps.length === 0) {
    console.error('❌ ステップデータが見つかりません');
    document.getElementById('content-area').innerHTML = `
      <div class="bg-red-50 p-6 rounded-lg border-2 border-red-300">
        <p class="text-red-800 font-bold">エラー: モジュールデータが読み込まれていません</p>
        <p class="text-red-600 mt-2">ページをリロードしてください。</p>
      </div>
    `;
    return;
  }
  
  console.log('✅ ステップデータ取得:', steps.length, 'ステップ');
  
  // 学習エンジンを初期化
  if (window.LearningEngine) {
    const success = window.LearningEngine.init(moduleId, steps);
    if (success) {
      window.LearningEngine.renderStepNavigation();
      window.LearningEngine.renderStep(0);
      window.LearningEngine.updateNavigationButtons();
      console.log('✅ 学習エンジン初期化完了');
    } else {
      console.error('❌ 学習エンジンの初期化に失敗しました');
    }
  } else {
    console.error('❌ 学習エンジンが見つかりません');
  }
});

// URLパスからモジュールIDを推測
function getModuleIdFromPath() {
  const path = window.location.pathname;
  
  if (path.includes('graph')) return 'graph_basics';
  if (path.includes('cardinality')) return 'cardinality';
  if (path.includes('units')) return 'units';
  if (path.includes('proportions')) return 'proportions';
  if (path.includes('approximation')) return 'approximation';
  
  return '';
}

// 前へボタンのイベントハンドラー
function goToPreviousStep() {
  if (window.LearningEngine) {
    const currentIndex = window.LearningEngine.currentStepIndex;
    if (currentIndex > 0) {
      window.LearningEngine.goToStep(currentIndex - 1);
    }
  }
}

// グローバルに関数を公開
window.goToPreviousStep = goToPreviousStep;
