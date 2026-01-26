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
  }
];

window.proportionSteps = proportionSteps;
console.log('✅ 割合の直感モジュール読み込み完了:', proportionSteps.length, 'ステップ');
