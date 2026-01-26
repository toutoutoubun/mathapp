// グラフ読解モジュール - 概念説明と解法パターンを完全分離したスモールステップ

const graphSteps = [
  // ========== パート1: 基本概念の理解 ==========
  {
    id: 'concept_1',
    type: 'concept',
    title: '【概念】グラフとは何か',
    description: 'グラフは「数字を絵にしたもの」です。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">グラフって何？</h4>
          <p class="text-gray-700 text-lg mb-4">
            グラフは、<strong class="text-blue-600">数字だけでは分かりにくいこと</strong>を、
            <strong class="text-blue-600">形や高さで見せてくれるもの</strong>です。
          </p>
          <div class="bg-white p-4 rounded-lg">
            <p class="text-gray-600 mb-2">例えば...</p>
            <p class="text-gray-700">
              「ケニアの人口は5300万人、タンザニアは6000万人」と言われても、ピンと来ませんよね。<br>
              でも、グラフで見ると<strong>「タンザニアの方が多い」</strong>ことが一目で分かります！
            </p>
          </div>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">グラフの良いところ</h4>
          <ul class="space-y-2 text-gray-700">
            <li><span class="text-green-600 text-2xl mr-2">👀</span> <strong>見てすぐ分かる</strong></li>
            <li><span class="text-green-600 text-2xl mr-2">📊</span> <strong>比べやすい</strong>（どれが多い？少ない？）</li>
            <li><span class="text-green-600 text-2xl mr-2">📈</span> <strong>変化が分かる</strong>（増えた？減った？）</li>
          </ul>
        </div>
      </div>
    `,
    quiz: {
      question: 'グラフの一番の良いところは何ですか？',
      options: [
        { id: 'a', text: '正確な数字が分かる', explanation: '正確な数字は表の方が分かりやすいです。グラフの良さは別にあります。' },
        { id: 'b', text: '見てすぐに大小が分かる', explanation: '正解です！グラフは数字を「形」にするので、一目で分かりやすいのです。', correct: true },
        { id: 'c', text: '計算が簡単になる', explanation: 'グラフは計算のためではなく、「見て分かる」ためのものです。' }
      ]
    }
  },
  {
    id: 'concept_2',
    type: 'concept',
    title: '【概念】グラフの種類',
    description: 'グラフには主に3つの種類があります。それぞれ使い道が違います。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">① 棒グラフ</h4>
          <div class="bg-white p-4 rounded-lg mb-4">
            <svg width="400" height="200" class="mx-auto">
              <rect x="50" y="150" width="60" height="50" fill="#3b82f6" />
              <rect x="130" y="100" width="60" height="100" fill="#3b82f6" />
              <rect x="210" y="80" width="60" height="120" fill="#3b82f6" />
              <rect x="290" y="120" width="60" height="80" fill="#3b82f6" />
              <line x1="40" y1="200" x2="360" y2="200" stroke="black" stroke-width="2" />
              <line x1="40" y1="50" x2="40" y2="200" stroke="black" stroke-width="2" />
            </svg>
          </div>
          <p class="text-gray-700"><strong class="text-blue-600">使い道:</strong> どれが多い？少ない？を比べる</p>
          <p class="text-gray-600 text-sm">例: 都市ごとの人口を比べる</p>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">② 折れ線グラフ</h4>
          <div class="bg-white p-4 rounded-lg mb-4">
            <svg width="400" height="200" class="mx-auto">
              <polyline points="50,150 130,100 210,120 290,80" fill="none" stroke="#22c55e" stroke-width="3" />
              <circle cx="50" cy="150" r="5" fill="#22c55e" />
              <circle cx="130" cy="100" r="5" fill="#22c55e" />
              <circle cx="210" cy="120" r="5" fill="#22c55e" />
              <circle cx="290" cy="80" r="5" fill="#22c55e" />
              <line x1="40" y1="200" x2="360" y2="200" stroke="black" stroke-width="2" />
              <line x1="40" y1="50" x2="40" y2="200" stroke="black" stroke-width="2" />
            </svg>
          </div>
          <p class="text-gray-700"><strong class="text-green-600">使い道:</strong> 時間とともに増えた？減った？を見る</p>
          <p class="text-gray-600 text-sm">例: 月ごとの気温の変化</p>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-yellow-800 mb-4">③ 円グラフ</h4>
          <div class="bg-white p-4 rounded-lg mb-4">
            <svg width="400" height="200" class="mx-auto">
              <circle cx="200" cy="100" r="70" fill="none" stroke="#eab308" stroke-width="2" />
              <path d="M 200 100 L 200 30 A 70 70 0 0 1 260 150 Z" fill="#fef08a" stroke="#eab308" stroke-width="2" />
              <path d="M 200 100 L 260 150 A 70 70 0 0 1 140 150 Z" fill="#fde047" stroke="#eab308" stroke-width="2" />
              <path d="M 200 100 L 140 150 A 70 70 0 0 1 200 30 Z" fill="#facc15" stroke="#eab308" stroke-width="2" />
            </svg>
          </div>
          <p class="text-gray-700"><strong class="text-yellow-600">使い道:</strong> 全体の中で、どのくらいの割合か見る</p>
          <p class="text-gray-600 text-sm">例: 大陸ごとの人口の割合</p>
        </div>
      </div>
    `,
    quiz: {
      question: '「ナイロビの気温が1年でどう変わるか」を見るには、どのグラフが良いですか？',
      options: [
        { id: 'a', text: '棒グラフ', explanation: '棒グラフは「比べる」のに向いていますが、「変化」を見るには折れ線グラフの方が分かりやすいです。' },
        { id: 'b', text: '折れ線グラフ', explanation: '正解です！時間とともに変わる様子は、線でつなぐと変化が見やすくなります。', correct: true },
        { id: 'c', text: '円グラフ', explanation: '円グラフは「割合」を見るものです。時間の変化には向いていません。' }
      ]
    }
  },
  
  // ========== パート2: グラフの部品を知る ==========
  {
    id: 'concept_3',
    type: 'concept',
    title: '【概念】表題 - グラフのタイトル',
    description: '表題は「このグラフが何について教えてくれるのか」を示しています。',
    content: `
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-lg border-2 border-gray-200">
          <div class="text-center text-2xl font-bold text-gray-800 mb-6 p-4 bg-yellow-50 rounded-lg">
            ナイロビの月別平均気温
          </div>
          <svg width="600" height="300" class="mx-auto opacity-30">
            <line x1="50" y1="250" x2="550" y2="250" stroke="black" stroke-width="2" />
            <line x1="50" y1="50" x2="50" y2="250" stroke="black" stroke-width="2" />
            <polyline points="100,150 150,140 200,145 250,150 300,155 350,165 400,170 450,160 500,150" 
                      fill="none" stroke="#ef4444" stroke-width="3" />
          </svg>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-yellow-800 mb-3">
            <i class="fas fa-lightbulb mr-2"></i>
            表題から分かること
          </h4>
          <div class="space-y-3">
            <div class="bg-white p-4 rounded-lg">
              <p class="text-lg font-bold text-blue-600 mb-2">「ナイロビの月別平均気温」</p>
              <ul class="space-y-2 text-gray-700">
                <li><strong>場所:</strong> ナイロビ（ケニアの首都）</li>
                <li><strong>何を:</strong> 気温</li>
                <li><strong>いつ:</strong> 月ごと</li>
                <li><strong>どんな値:</strong> 平均</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="bg-red-50 p-6 rounded-lg border-2 border-red-300">
          <p class="text-lg text-gray-800">
            <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>
            <strong>表題を読まないと、何のグラフか分かりません！</strong><br>
            グラフを見るときは、<strong class="text-red-600">まず表題を確認</strong>しましょう。
          </p>
        </div>
      </div>
    `,
    quiz: {
      question: '「ラゴスの人口の推移（1950年〜2020年）」という表題があります。「推移」とはどういう意味ですか？',
      options: [
        { id: 'a', text: '今の人口だけ', explanation: '「推移」は今だけではなく、時間の流れを表す言葉です。' },
        { id: 'b', text: '時間とともにどう変わったか', explanation: '正解です！「推移」は「時間とともに変わること」という意味です。', correct: true },
        { id: 'c', text: '一番多い時の人口', explanation: '「推移」は最大値ではなく、全体の変化を意味します。' }
      ]
    }
  },

  // 続きは次のメッセージで...
];

// グラフモジュールをエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { graphSteps };
}
