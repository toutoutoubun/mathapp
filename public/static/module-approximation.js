// モジュール5: 概数・おおよその判断
// だいたいの数で考える方法を学ぶ

const approximationSteps = [
  {
    id: 'approx_1',
    title: 'ステップ1: 概数とは「だいたいの数」',
    description: '正確な数でなくても、だいたいの数が分かれば便利なことがたくさんあります。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">概数の考え方</h4>
          <div class="bg-white p-6 rounded-lg mb-4">
            <p class="text-gray-800 mb-3">例: スタジアムの観客数</p>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-red-50 p-4 rounded-lg">
                <p class="font-bold text-red-800 mb-2">正確な数</p>
                <p class="text-3xl font-bold text-red-600">23,487人</p>
                <p class="text-sm text-gray-600 mt-2">細かすぎて覚えにくい</p>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <p class="font-bold text-green-800 mb-2">概数（だいたいの数）</p>
                <p class="text-3xl font-bold text-green-600">約23,000人</p>
                <p class="text-sm text-gray-600 mt-2">分かりやすい！</p>
              </div>
            </div>
          </div>
          <p class="text-gray-700 mt-4">
            <strong class="text-blue-600">概数</strong>は、正確ではないけれど、
            <strong class="text-blue-600">だいたいの量</strong>を表すのに便利です。
          </p>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">アフリカの例: エジプトの人口</h4>
          <p class="text-gray-700 mb-4">
            エジプトの人口は約104,258,327人（2023年）です。
          </p>
          <div class="bg-white p-4 rounded-lg">
            <p class="text-lg mb-3">これを概数で表すと...</p>
            <div class="space-y-2">
              <p>• <strong>約1億人</strong>（一番簡単）</p>
              <p>• <strong>約1億400万人</strong>（少し詳しく）</p>
              <p>• <strong>約1億430万人</strong>（もっと詳しく）</p>
            </div>
            <p class="mt-3 text-sm text-gray-600">※ 場面によって、どれくらい詳しく言うか選べます</p>
          </div>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-300">
          <h4 class="text-xl font-bold text-yellow-800 mb-3">
            <i class="fas fa-lightbulb mr-2"></i>概数を使う場面
          </h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <i class="fas fa-check text-yellow-600 mr-3 mt-1"></i>
              <span>ニュースや新聞で大きな数を伝えるとき</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check text-yellow-600 mr-3 mt-1"></i>
              <span>買い物で予算を考えるとき</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check text-yellow-600 mr-3 mt-1"></i>
              <span>大きな数を比べるとき</span>
            </li>
          </ul>
        </div>
      </div>
    `,
    quiz: {
      question: 'ナイジェリアの人口は218,541,212人です。これを概数で表すと、どれが適切ですか？',
      options: [
        { id: 'A', text: '約200,000,000人（約2億人）', correct: true, explanation: '正解！大きな数は<strong>約2億人</strong>と表すと分かりやすいです。' },
        { id: 'B', text: '約100,000,000人（約1億人）', correct: false, explanation: '2億人以上なので、1億人では少なすぎます。' },
        { id: 'C', text: '約300,000,000人（約3億人）', correct: false, explanation: '2億人台なので、3億人では多すぎます。' }
      ]
    }
  },

  {
    id: 'approx_2',
    title: 'ステップ2: 四捨五入で概数を作る',
    description: '四捨五入は、概数を作る一番よく使われる方法です。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">四捨五入のルール</h4>
          <div class="bg-white p-6 rounded-lg mb-4">
            <div class="space-y-4">
              <div class="bg-red-100 p-4 rounded-lg">
                <p class="text-xl font-bold text-red-800 mb-2">0, 1, 2, 3, 4 → 切り捨て</p>
                <p class="text-gray-700">例: 234 → 200（百の位で四捨五入）</p>
              </div>
              <div class="bg-green-100 p-4 rounded-lg">
                <p class="text-xl font-bold text-green-800 mb-2">5, 6, 7, 8, 9 → 切り上げ</p>
                <p class="text-gray-700">例: 278 → 300（百の位で四捨五入）</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">練習: 十の位で四捨五入</h4>
          <div class="bg-white p-6 rounded-lg">
            <div class="space-y-3">
              <div class="bg-blue-50 p-3 rounded">
                <p class="font-bold mb-1">143 → ?</p>
                <p class="text-gray-700">一の位は<strong>3</strong> → 切り捨て → <strong class="text-blue-600">140</strong></p>
              </div>
              <div class="bg-green-50 p-3 rounded">
                <p class="font-bold mb-1">167 → ?</p>
                <p class="text-gray-700">一の位は<strong>7</strong> → 切り上げ → <strong class="text-green-600">170</strong></p>
              </div>
              <div class="bg-purple-50 p-3 rounded">
                <p class="font-bold mb-1">145 → ?</p>
                <p class="text-gray-700">一の位は<strong>5</strong> → 切り上げ → <strong class="text-purple-600">150</strong></p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-purple-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-purple-800 mb-4">アフリカの例: ケニアのサファリ</h4>
          <p class="text-gray-700 mb-4">
            マサイマラ国立保護区にライオンが1,847頭います。千の位で四捨五入すると？
          </p>
          <div class="bg-white p-4 rounded-lg">
            <p class="mb-2">百の位の数字は<strong>8</strong></p>
            <p class="mb-2">→ 8は5以上なので<strong>切り上げ</strong></p>
            <p class="text-2xl font-bold text-purple-600 text-center">約2,000頭</p>
          </div>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-300">
          <h4 class="text-xl font-bold text-yellow-800 mb-3">
            <i class="fas fa-brain mr-2"></i>覚えておこう
          </h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <i class="fas fa-arrow-right text-yellow-600 mr-3 mt-1"></i>
              <span><strong>4以下</strong> → 切り捨て（その位を0にする）</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-arrow-right text-yellow-600 mr-3 mt-1"></i>
              <span><strong>5以上</strong> → 切り上げ（上の位に1増やす）</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-arrow-right text-yellow-600 mr-3 mt-1"></i>
              <span>どの位で四捨五入するかを<strong>確認</strong>する</span>
            </li>
          </ul>
        </div>
      </div>
    `,
    quiz: {
      question: 'タンザニアのセレンゲティ国立公園の面積は14,763平方キロメートルです。千の位で四捨五入すると？',
      options: [
        { id: 'A', text: '約10,000平方km', correct: false, explanation: '百の位の7に注目しましょう。' },
        { id: 'B', text: '約15,000平方km', correct: true, explanation: '正解！百の位が<strong>7</strong>なので切り上げて、<strong>約15,000平方km</strong>です。' },
        { id: 'C', text: '約14,000平方km', correct: false, explanation: '7は5以上なので、切り上げます。' }
      ]
    }
  }
];

window.approximationSteps = approximationSteps;
console.log('✅ 概数モジュール読み込み完了:', approximationSteps.length, 'ステップ');
