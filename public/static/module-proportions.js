// モジュール4: 割合の直感
// 「1あたり」で考える方法を学ぶ

const proportionSteps = [
  {
    id: 'prop_1',
    title: 'ステップ1: 割合とは「全体に対する部分」',
    description: '割合は、全体の中でどれくらいの部分かを表します。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">割合の基本</h4>
          <div class="bg-white p-6 rounded-lg mb-4">
            <p class="text-gray-800 mb-4">10個のりんごのうち、3個が赤いりんごです。</p>
            <div class="flex justify-center items-center space-x-2 text-4xl mb-4">
              🍎🍏🍏🍏🍎🍏🍏🍏🍎🍏
            </div>
            <div class="bg-blue-100 p-4 rounded-lg">
              <p class="text-xl text-center">
                赤いりんごの割合 = <strong class="text-blue-600">3/10</strong> または <strong class="text-blue-600">0.3</strong> または <strong class="text-blue-600">30%</strong>
              </p>
            </div>
          </div>
          <p class="text-gray-700">
            <strong class="text-blue-600">全体が10個</strong>で、<strong class="text-blue-600">赤いのが3個</strong>なので、
            赤いりんごの割合は<strong>3÷10 = 0.3 = 30%</strong>です。
          </p>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">アフリカの例: モロッコの市場</h4>
          <p class="text-gray-700 mb-4">
            モロッコの市場で、20個のオレンジのうち、5個がジュース用です。
          </p>
          <div class="bg-white p-4 rounded-lg">
            <p class="text-lg mb-2">ジュース用オレンジの割合 = 5 ÷ 20 = <strong class="text-green-600">0.25 = 25%</strong></p>
            <p class="text-gray-600">→ 全体の<strong>4分の1</strong>がジュース用です</p>
          </div>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-300">
          <h4 class="text-xl font-bold text-yellow-800 mb-3">
            <i class="fas fa-key mr-2"></i>割合の表し方
          </h4>
          <div class="space-y-2 text-gray-700">
            <p>• <strong>分数</strong>: 3/10 （10分の3）</p>
            <p>• <strong>小数</strong>: 0.3</p>
            <p>• <strong>パーセント</strong>: 30% （百分率）</p>
            <p class="mt-3 text-sm">※ すべて<strong>同じ意味</strong>です</p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'ガーナのカカオ農園で、50個のカカオのうち、10個が熟しています。熟したカカオの割合は？',
      options: [
        { id: 'A', text: '10%', correct: false, explanation: '10÷50を計算しましょう。' },
        { id: 'B', text: '20%', correct: true, explanation: '正解！10÷50 = 0.2 = <strong>20%</strong>です。' },
        { id: 'C', text: '50%', correct: false, explanation: '50個全体のうち10個なので、半分ではありません。' }
      ]
    }
  },

  {
    id: 'prop_2',
    title: 'ステップ2: 「1あたり」で考える',
    description: '「1あたりの量」を基準にすると、比較がしやすくなります。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">1あたりの考え方</h4>
          <div class="bg-white p-6 rounded-lg mb-4">
            <p class="text-gray-800 mb-3">問題: どちらが安い？</p>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="bg-green-50 p-4 rounded-lg text-center">
                <p class="font-bold text-green-800">店A</p>
                <p class="text-2xl">りんご<strong>3個</strong>で<strong>600円</strong></p>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg text-center">
                <p class="font-bold text-blue-800">店B</p>
                <p class="text-2xl">りんご<strong>5個</strong>で<strong>900円</strong></p>
              </div>
            </div>
            <div class="bg-yellow-100 p-4 rounded-lg">
              <p class="font-bold text-yellow-800 mb-2">「1個あたり」の値段で比べる</p>
              <div class="space-y-2">
                <p>店A: 600円 ÷ 3個 = <strong class="text-green-600">200円/個</strong></p>
                <p>店B: 900円 ÷ 5個 = <strong class="text-blue-600">180円/個</strong></p>
                <p class="mt-3 text-xl font-bold text-center">→ 店Bの方が安い！</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">アフリカの例: ケニアの布</h4>
          <p class="text-gray-700 mb-4">
            ケニアのカンガ（布）を買います。どちらがお得？
          </p>
          <div class="bg-white p-6 rounded-lg">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="text-center p-4 bg-red-50 rounded-lg">
                <p class="font-bold">2メートル</p>
                <p class="text-2xl">1000円</p>
              </div>
              <div class="text-center p-4 bg-blue-50 rounded-lg">
                <p class="font-bold">3メートル</p>
                <p class="text-2xl">1350円</p>
              </div>
            </div>
            <div class="bg-green-100 p-4 rounded-lg">
              <p class="font-bold mb-2">1メートルあたりの値段</p>
              <p>2mで1000円: 1000 ÷ 2 = <strong>500円/m</strong></p>
              <p>3mで1350円: 1350 ÷ 3 = <strong>450円/m</strong></p>
              <p class="mt-2 font-bold text-green-800">→ 3メートルの方がお得！</p>
            </div>
          </div>
        </div>

        <div class="bg-purple-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-purple-800 mb-3">1あたりの計算方法</h4>
          <ol class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <span class="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">1</span>
              <span><strong>全体の量</strong>と<strong>全体の値段（または数）</strong>を確認</span>
            </li>
            <li class="flex items-start">
              <span class="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">2</span>
              <span><strong>全体の値段 ÷ 全体の量</strong> = 1あたりの値段</span>
            </li>
            <li class="flex items-start">
              <span class="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">3</span>
              <span>1あたりの値段で<strong>比較</strong>する</span>
            </li>
          </ol>
        </div>
      </div>
    `,
    quiz: {
      question: 'エチオピアのコーヒー豆。A店: 200gで800円、B店: 300gで1050円。1gあたりが安いのは？',
      options: [
        { id: 'A', text: 'A店（4円/g）', correct: false, explanation: 'A店は800÷200=4円/gです。B店も計算してみましょう。' },
        { id: 'B', text: 'B店（3.5円/g）', correct: true, explanation: '正解！B店は1050÷300=<strong>3.5円/g</strong>なので、B店の方が安いです。' },
        { id: 'C', text: '同じ', correct: false, explanation: '計算すると異なります。' }
      ]
    }
  },

  // ========================================
  // ステップ3: 百分率（パーセント）の意味
  // ========================================
  {
    id: 'prop_3',
    title: 'ステップ3: 百分率（パーセント）',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-percent mr-2 text-blue-500"></i>
          パーセント（%）って何？
        </h3>
        
        <div class="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            <strong>パーセント（%）</strong>は、「全体を100としたときの割合」を表します。<br>
            100個のうち何個かを表す便利な方法です。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">パーセントの例</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-green-50 rounded">
                <div class="text-3xl mb-2 text-center">
                  ${'🟩'.repeat(10)}
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">50%</div>
                  <div class="text-sm text-gray-600">100個中50個</div>
                  <div class="text-sm text-gray-600">= 半分</div>
                </div>
              </div>
              
              <div class="p-4 bg-blue-50 rounded">
                <div class="text-3xl mb-2 text-center">
                  ${'🟦'.repeat(10)}
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">100%</div>
                  <div class="text-sm text-gray-600">100個中100個</div>
                  <div class="text-sm text-gray-600">= 全部</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-globe-africa text-green-600 mr-2"></i>
              <strong>例:</strong> ケニアの学校で100人中75人が出席したら、<strong>75%</strong>の出席率です。
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '100個のマンゴーのうち、25個を食べました。何パーセント食べましたか？',
      options: [
        { id: 'A', text: '10%', correct: false, explanation: '10%は100個中10個です。' },
        { id: 'B', text: '25%', correct: true, explanation: '正解！100個中25個は<strong>25%</strong>です。' },
        { id: 'C', text: '50%', correct: false, explanation: '50%は100個中50個（半分）です。' }
      ]
    }
  },

  // ========================================
  // ステップ4: 小数と割合
  // ========================================
  {
    id: 'prop_4',
    title: 'ステップ4: 小数と割合',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-divide mr-2 text-purple-500"></i>
          小数で割合を表す
        </h3>
        
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            割合は<strong>小数</strong>でも表せます。<br>
            全体を1としたときの、部分の大きさです。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">小数と割合の関係</h4>
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 bg-purple-50 rounded">
                <span class="text-lg">全部</span>
                <span class="text-xl font-bold text-purple-600">1.0 = 100%</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-pink-50 rounded">
                <span class="text-lg">半分</span>
                <span class="text-xl font-bold text-pink-600">0.5 = 50%</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-blue-50 rounded">
                <span class="text-lg">4分の1</span>
                <span class="text-xl font-bold text-blue-600">0.25 = 25%</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-green-50 rounded">
                <span class="text-lg">10分の1</span>
                <span class="text-xl font-bold text-green-600">0.1 = 10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '0.75は何パーセントですか？',
      options: [
        { id: 'A', text: '7.5%', correct: false, explanation: '小数を100倍するとパーセントになります。' },
        { id: 'B', text: '75%', correct: true, explanation: '正解！0.75 × 100 = <strong>75%</strong>です。' },
        { id: 'C', text: '750%', correct: false, explanation: '0.75は1より小さいので、100%より小さくなります。' }
      ]
    }
  },

  // ========================================
  // ステップ5: 割合の計算（基本）
  // ========================================
  {
    id: 'prop_5',
    title: 'ステップ5: 割合の計算',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-calculator mr-2 text-green-500"></i>
          割合を計算してみよう
        </h3>
        
        <div class="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            割合 = 部分 ÷ 全体<br>
            この式を使って、割合を計算できます。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">計算の例</h4>
            <div class="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded">
              <div class="text-lg mb-3">
                <strong>問題:</strong> タンザニアの市場で、40個のマンゴーのうち8個が熟しています。<br>
                熟したマンゴーの割合は？
              </div>
              <div class="text-xl mb-2 text-gray-700">
                <i class="fas fa-arrow-right text-green-500 mr-2"></i>
                割合 = 熟したマンゴー ÷ 全部のマンゴー
              </div>
              <div class="text-2xl font-bold text-green-600">
                = 8 ÷ 40 = 0.2 = <span class="text-3xl">20%</span>
              </div>
            </div>
          </div>
          
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
              <strong>ポイント:</strong> 割合は「部分を全体で割る」だけです！
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'ウガンダの学校で、50人中10人が欠席しました。欠席した人の割合は？',
      options: [
        { id: 'A', text: '10%', correct: false, explanation: '10 ÷ 50 を計算してください。' },
        { id: 'B', text: '20%', correct: true, explanation: '正解！10 ÷ 50 = 0.2 = <strong>20%</strong>です。' },
        { id: 'C', text: '50%', correct: false, explanation: '50%は半分です。10は50の半分ではありません。' }
      ]
    }
  },

  // ========================================
  // ステップ6: ○割という表現
  // ========================================
  {
    id: 'prop_6',
    title: 'ステップ6: ○割という表現',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-chart-pie mr-2 text-orange-500"></i>
          「割」で割合を表す
        </h3>
        
        <div class="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            日本では、割合を<strong>「○割」</strong>という言い方でも表します。<br>
            1割 = 10%、2割 = 20%、...、10割 = 100%
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">割とパーセントの対応</h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-orange-50 rounded text-center">
                <div class="text-xl font-bold text-orange-600">1割</div>
                <div class="text-sm text-gray-600">= 10%</div>
              </div>
              <div class="p-3 bg-yellow-50 rounded text-center">
                <div class="text-xl font-bold text-yellow-600">3割</div>
                <div class="text-sm text-gray-600">= 30%</div>
              </div>
              <div class="p-3 bg-green-50 rounded text-center">
                <div class="text-xl font-bold text-green-600">5割</div>
                <div class="text-sm text-gray-600">= 50% (半分)</div>
              </div>
              <div class="p-3 bg-blue-50 rounded text-center">
                <div class="text-xl font-bold text-blue-600">10割</div>
                <div class="text-sm text-gray-600">= 100% (全部)</div>
              </div>
            </div>
          </div>
          
          <div class="bg-green-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-store text-green-600 mr-2"></i>
              <strong>身近な例:</strong> お店の「3割引き」= 30%引き
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'セールで「2割引き」と書いてあります。何パーセント引きですか？',
      options: [
        { id: 'A', text: '2%', correct: false, explanation: '1割 = 10% です。' },
        { id: 'B', text: '20%', correct: true, explanation: '正解！2割 = <strong>20%</strong>引きです。' },
        { id: 'C', text: '50%', correct: false, explanation: '50%は5割です。' }
      ]
    }
  },

  // ========================================
  // ステップ7: 割合を使った計算（○の何%）
  // ========================================
  {
    id: 'prop_7',
    title: 'ステップ7: ○の何%を求める',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-percentage mr-2 text-indigo-500"></i>
          「○の△%」を計算する
        </h3>
        
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            「○の△%」は、○ × (△ ÷ 100) で計算できます。<br>
            つまり、○ × △% です。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">計算例</h4>
            
            <div class="space-y-4">
              <div class="p-4 bg-indigo-50 rounded">
                <div class="text-lg mb-2">
                  <strong>例1:</strong> 200円の30%は？
                </div>
                <div class="text-gray-700 mb-2">
                  200 × 0.3 = 60
                </div>
                <div class="text-xl font-bold text-indigo-600">
                  答え: <span class="text-2xl">60円</span>
                </div>
              </div>
              
              <div class="p-4 bg-purple-50 rounded">
                <div class="text-lg mb-2">
                  <strong>例2:</strong> 80人の25%は？
                </div>
                <div class="text-gray-700 mb-2">
                  80 × 0.25 = 20
                </div>
                <div class="text-xl font-bold text-purple-600">
                  答え: <span class="text-2xl">20人</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'エチオピアのコーヒー豆が60kg あります。その20%は何kgですか？',
      options: [
        { id: 'A', text: '6 kg', correct: false, explanation: '60 × 0.2 を計算してください。' },
        { id: 'B', text: '12 kg', correct: true, explanation: '正解！60 × 0.2 = <strong>12 kg</strong>です。' },
        { id: 'C', text: '20 kg', correct: false, explanation: '20は60の約33%です。' }
      ]
    }
  },

  // ========================================
  // ステップ8: 増加と減少（値上げ・値下げ）
  // ========================================
  {
    id: 'prop_8',
    title: 'ステップ8: 増加と減少',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-arrows-alt-v mr-2 text-red-500"></i>
          割合で増やす・減らす
        </h3>
        
        <div class="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            割合を使って、値段や数を<strong>増やしたり減らしたり</strong>できます。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <div class="grid grid-cols-2 gap-4">
              <!-- 増加 -->
              <div class="p-4 bg-green-50 rounded">
                <h5 class="font-bold text-green-600 mb-3">
                  <i class="fas fa-arrow-up mr-2"></i>
                  増加（値上げ）
                </h5>
                <div class="text-sm mb-2">
                  <strong>例:</strong> 100円の10%増し
                </div>
                <div class="text-gray-700 mb-1">
                  増加分: 100 × 0.1 = 10円
                </div>
                <div class="text-lg font-bold text-green-600">
                  新価格: 100 + 10 = 110円
                </div>
              </div>
              
              <!-- 減少 -->
              <div class="p-4 bg-blue-50 rounded">
                <h5 class="font-bold text-blue-600 mb-3">
                  <i class="fas fa-arrow-down mr-2"></i>
                  減少（値下げ）
                </h5>
                <div class="text-sm mb-2">
                  <strong>例:</strong> 100円の20%引き
                </div>
                <div class="text-gray-700 mb-1">
                  割引分: 100 × 0.2 = 20円
                </div>
                <div class="text-lg font-bold text-blue-600">
                  新価格: 100 - 20 = 80円
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-info-circle text-blue-500 mr-2"></i>
              増加も減少も、まず「変化分」を計算してから足したり引いたりします。
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'ナイジェリアの市場で、500円のバナナが30%引きです。いくらになりますか？',
      options: [
        { id: 'A', text: '300円', correct: false, explanation: '500の30%は150円です。500 - 150 を計算してください。' },
        { id: 'B', text: '350円', correct: true, explanation: '正解！500 × 0.3 = 150、500 - 150 = <strong>350円</strong>です。' },
        { id: 'C', text: '470円', correct: false, explanation: '30円引きではなく、30%引きです。' }
      ]
    }
  },

  // ========================================
  // ステップ9: 比較（どちらが得？）
  // ========================================
  {
    id: 'prop_9',
    title: 'ステップ9: 割合で比較する',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-balance-scale-right mr-2 text-teal-500"></i>
          割合を使って比べる
        </h3>
        
        <div class="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            割合を使うと、<strong>大きさが違うものも公平に比べられます</strong>。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">比較の例</h4>
            <div class="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded">
              <div class="text-lg mb-3">
                <strong>問題:</strong> どちらのテストの方がよくできた？
              </div>
              <div class="grid grid-cols-2 gap-4 mb-3">
                <div class="p-3 bg-white rounded shadow-sm">
                  <div class="font-bold text-teal-600 mb-1">数学テスト</div>
                  <div>50点満点中40点</div>
                  <div class="text-sm text-gray-600">40 ÷ 50 = 0.8 = <strong>80%</strong></div>
                </div>
                <div class="p-3 bg-white rounded shadow-sm">
                  <div class="font-bold text-blue-600 mb-1">英語テスト</div>
                  <div>80点満点中60点</div>
                  <div class="text-sm text-gray-600">60 ÷ 80 = 0.75 = <strong>75%</strong></div>
                </div>
              </div>
              <div class="text-xl font-bold text-teal-600">
                答え: 数学テストの方がよくできた（80% > 75%）
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'AさんとBさん、どちらの出席率が高い？ A: 20日中18日出席、B: 25日中20日出席',
      options: [
        { id: 'A', text: 'Aさん', correct: true, explanation: '正解！A: 18÷20=90%、B: 20÷25=80%。<strong>Aさん</strong>の方が高いです。' },
        { id: 'B', text: 'Bさん', correct: false, explanation: 'それぞれの割合を計算してみましょう。' },
        { id: 'C', text: '同じ', correct: false, explanation: 'A: 90%、B: 80%で違います。' }
      ]
    }
  },

  // ========================================
  // ステップ10: 割合の総合練習
  // ========================================
  {
    id: 'prop_10',
    title: 'ステップ10: 総合練習',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-medal mr-2 text-yellow-500"></i>
          割合をマスターしよう
        </h3>
        
        <div class="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            これまで学んだ<strong>割合</strong>の知識を総動員して、問題を解きましょう。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-3">復習：割合の重要ポイント</h4>
            <div class="space-y-2 text-gray-700">
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                割合 = 部分 ÷ 全体
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                パーセント（%）= 100分の○
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                「○の△%」= ○ × (△ ÷ 100)
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                割合で<strong>公平に比較</strong>できる
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                1あたりで考えると<strong>わかりやすい</strong>
              </p>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="bg-blue-50 p-3 rounded text-center">
              <div class="text-2xl font-bold text-blue-600">25%</div>
              <div class="text-sm">= 0.25 = 1/4</div>
            </div>
            <div class="bg-green-50 p-3 rounded text-center">
              <div class="text-2xl font-bold text-green-600">50%</div>
              <div class="text-sm">= 0.5 = 1/2</div>
            </div>
            <div class="bg-purple-50 p-3 rounded text-center">
              <div class="text-2xl font-bold text-purple-600">75%</div>
              <div class="text-sm">= 0.75 = 3/4</div>
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-trophy text-yellow-500 mr-2"></i>
              割合が使えると、日常生活でとても役に立ちます！
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'ルワンダの農園で、収穫したコーヒー豆200kgのうち、輸出用が150kgです。輸出用の割合は？',
      options: [
        { id: 'A', text: '50%', correct: false, explanation: '150 ÷ 200 を計算してください。' },
        { id: 'B', text: '75%', correct: true, explanation: '正解！150 ÷ 200 = 0.75 = <strong>75%</strong>です。' },
        { id: 'C', text: '150%', correct: false, explanation: '150%は全体の1.5倍で、150は200より小さいです。' }
      ]
    }
  }
];

// グローバルに登録
window.proportionsSteps = proportionsSteps;

console.log('✅ 割合の直感モジュールを10ステップに拡張しました');
