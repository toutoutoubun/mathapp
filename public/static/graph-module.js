// グラフ読解モジュール - 8ステップの学習コンテンツ

const graphSteps = [
  {
    id: 'step1',
    title: 'ステップ1: グラフの種類を知ろう',
    description: 'グラフにはいくつかの種類があります。それぞれの特徴を見てみましょう。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">棒グラフ</h4>
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
          <p class="text-gray-700">棒の<strong class="text-blue-600">高さ</strong>で量を比べます。どれが多いか、どれが少ないかが<strong>一目で</strong>分かります。</p>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">折れ線グラフ</h4>
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
          <p class="text-gray-700">点を線でつないだグラフ。時間とともに<strong class="text-green-600">増えたり減ったり</strong>する変化が分かります。</p>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-yellow-800 mb-4">円グラフ</h4>
          <div class="bg-white p-4 rounded-lg mb-4">
            <svg width="400" height="200" class="mx-auto">
              <circle cx="200" cy="100" r="70" fill="none" stroke="#eab308" stroke-width="2" />
              <path d="M 200 100 L 200 30 A 70 70 0 0 1 260 150 Z" fill="#fef08a" stroke="#eab308" stroke-width="2" />
              <path d="M 200 100 L 260 150 A 70 70 0 0 1 140 150 Z" fill="#fde047" stroke="#eab308" stroke-width="2" />
              <path d="M 200 100 L 140 150 A 70 70 0 0 1 200 30 Z" fill="#facc15" stroke="#eab308" stroke-width="2" />
            </svg>
          </div>
          <p class="text-gray-700">全体を100%として、<strong class="text-yellow-600">それぞれの部分の割合</strong>を見せます。</p>
        </div>
      </div>
    `,
    quiz: {
      question: 'ケニアの月ごとの気温の変化を見るには、どのグラフが良いでしょうか？',
      options: [
        { id: 'a', text: '棒グラフ', explanation: '棒グラフは比較には良いですが、変化を見るには折れ線グラフの方が分かりやすいです。' },
        { id: 'b', text: '折れ線グラフ', explanation: '正解です！時間とともに変わる気温は、折れ線グラフで見ると変化が分かりやすいです。', correct: true },
        { id: 'c', text: '円グラフ', explanation: '円グラフは割合を見るためのものです。時間の変化を見るには向いていません。' }
      ]
    }
  },
  {
    id: 'step2',
    title: 'ステップ2: 表題を読もう',
    description: '表題は「このグラフが何について教えてくれるのか」を示しています。',
    content: `
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-lg border-2 border-gray-200">
          <div id="graph-title" class="text-center text-2xl font-bold text-gray-800 mb-6 p-4">
            ナイロビの月別平均気温
          </div>
          <svg width="600" height="300" class="mx-auto">
            <line x1="50" y1="250" x2="550" y2="250" stroke="black" stroke-width="2" />
            <line x1="50" y1="50" x2="50" y2="250" stroke="black" stroke-width="2" />
            <polyline points="100,150 150,140 200,145 250,150 300,155 350,165 400,170 450,160 500,150" 
                      fill="none" stroke="#ef4444" stroke-width="3" />
          </svg>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-yellow-800 mb-3">
            <i class="fas fa-lightbulb mr-2"></i>
            表題からわかること
          </h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <span class="text-yellow-600 mr-2">•</span>
              <span><strong>場所:</strong> ナイロビ（ケニアの首都）</span>
            </li>
            <li class="flex items-start">
              <span class="text-yellow-600 mr-2">•</span>
              <span><strong>何を:</strong> 気温</span>
            </li>
            <li class="flex items-start">
              <span class="text-yellow-600 mr-2">•</span>
              <span><strong>いつ:</strong> 月ごと</span>
            </li>
            <li class="flex items-start">
              <span class="text-yellow-600 mr-2">•</span>
              <span><strong>どんな値:</strong> 平均</span>
            </li>
          </ul>
        </div>

        <div class="bg-blue-50 p-6 rounded-lg">
          <p class="text-gray-700">
            <i class="fas fa-check-circle text-blue-600 mr-2"></i>
            表題を読まないと、「このグラフは何を教えてくれるのか」が分かりません。<br>
            <strong>グラフを見るときは、まず表題を確認しましょう。</strong>
          </p>
        </div>
      </div>
    `,
    quiz: {
      question: '「ラゴスの人口の推移（1950年〜2020年）」という表題から、何が分かりますか？',
      options: [
        { id: 'a', text: 'ラゴスの今の人口', explanation: '今の人口だけでなく、1950年から2020年までの変化が分かります。' },
        { id: 'b', text: 'ラゴスの人口が時間とともにどう変わったか', explanation: '正解です！「推移」という言葉は「時間とともに変わること」を意味します。', correct: true },
        { id: 'c', text: 'ラゴスの面積', explanation: '表題には「人口」と書かれています。面積ではありません。' }
      ]
    }
  },
  {
    id: 'step3',
    title: 'ステップ3: 原点を見つけよう',
    description: '原点は、グラフの「スタート地点」です。',
    content: `
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-lg border-2 border-gray-200">
          <h4 class="text-xl font-bold text-gray-800 mb-6 text-center">ケニアの年別人口</h4>
          <div class="relative">
            <svg width="600" height="300" class="mx-auto">
              <line x1="100" y1="250" x2="550" y2="250" stroke="black" stroke-width="2" />
              <line x1="100" y1="50" x2="100" y2="250" stroke="black" stroke-width="2" />
              <circle id="origin-point" cx="100" cy="250" r="12" fill="#ef4444" stroke="white" stroke-width="3" class="marker-red-circle" />
              <rect x="150" y="200" width="60" height="50" fill="#3b82f6" opacity="0.3" />
              <rect x="230" y="180" width="60" height="70" fill="#3b82f6" opacity="0.3" />
              <rect x="310" y="150" width="60" height="100" fill="#3b82f6" opacity="0.3" />
              <rect x="390" y="120" width="60" height="130" fill="#3b82f6" opacity="0.3" />
            </svg>
          </div>
        </div>

        <div class="bg-red-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-red-800 mb-3">
            <i class="fas fa-map-marker-alt mr-2"></i>
            原点とは
          </h4>
          <p class="text-gray-700 mb-4">
            原点は、縦の線（縦軸）と横の線（横軸）が<strong>交わる点</strong>です。<br>
            ここが<strong class="text-red-600">「0（ゼロ）」のスタート地点</strong>になります。
          </p>
          <div class="bg-white p-4 rounded-lg">
            <p class="text-sm text-gray-600">
              <i class="fas fa-info-circle text-blue-500 mr-2"></i>
              上のグラフでは、赤い丸が原点です。ここから上に行くと数が増え、右に行くと時間が進みます。
            </p>
          </div>
        </div>

        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-blue-800 mb-3">なぜ原点が大切？</h4>
          <p class="text-gray-700">
            原点が分からないと、「どこから数え始めているのか」が分かりません。<br>
            グラフを見るときは、<strong>原点を確認してから</strong>他の部分を見ましょう。
          </p>
        </div>
      </div>
    `,
    quiz: {
      question: '原点はグラフのどこにありますか？',
      options: [
        { id: 'a', text: 'グラフの一番上', explanation: '一番上ではありません。原点はスタート地点なので、一番下にあります。' },
        { id: 'b', text: '縦軸と横軸が交わる点（左下の角）', explanation: '正解です！原点は、2本の線が交わる「スタート地点」です。', correct: true },
        { id: 'c', text: 'グラフの中心', explanation: '中心ではありません。原点は縦軸と横軸が交わる点です。' }
      ]
    }
  }
];

{
    id: 'step4',
    title: 'ステップ4: 横軸を読もう',
    description: '横軸は「何を比べるか」を教えてくれます。',
    content: `
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-lg border-2 border-gray-200">
          <h4 class="text-xl font-bold text-gray-800 mb-6 text-center">エチオピアの都市別人口</h4>
          <svg width="600" height="300" class="mx-auto">
            <line x1="80" y1="250" x2="550" y2="250" stroke="black" stroke-width="3" />
            <line x1="80" y1="50" x2="80" y2="250" stroke="black" stroke-width="2" />
            <rect x="120" y="150" width="80" height="100" fill="#3b82f6" opacity="0.3" />
            <rect x="230" y="180" width="80" height="70" fill="#3b82f6" opacity="0.3" />
            <rect x="340" y="200" width="80" height="50" fill="#3b82f6" opacity="0.3" />
            <rect x="450" y="220" width="80" height="30" fill="#3b82f6" opacity="0.3" />
            <g id="x-axis-labels">
              <text x="160" y="275" text-anchor="middle" class="text-sm">アディスアベバ</text>
              <text x="270" y="275" text-anchor="middle" class="text-sm">ゴンダール</text>
              <text x="380" y="275" text-anchor="middle" class="text-sm">メケレ</text>
              <text x="490" y="275" text-anchor="middle" class="text-sm">バハルダール</text>
            </g>
          </svg>
        </div>

        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-blue-800 mb-3">
            <i class="fas fa-arrows-alt-h mr-2"></i>
            横軸の役割
          </h4>
          <p class="text-gray-700 mb-4">
            横軸（よこじく）は、グラフの<strong>下に横に伸びている線</strong>です。<br>
            ここには<strong class="text-blue-600">「何と何を比べているのか」</strong>が書かれています。
          </p>
          <div class="bg-white p-4 rounded-lg">
            <p class="text-sm text-gray-600">
              上のグラフでは、<strong>4つの都市の名前</strong>が横軸に書かれています。<br>
              これは「都市ごとに人口を比べる」という意味です。
            </p>
          </div>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-green-800 mb-3">横軸によく書かれているもの</h4>
          <ul class="space-y-2 text-gray-700">
            <li><span class="text-green-600 mr-2">📅</span> 時間（年、月、日など）</li>
            <li><span class="text-green-600 mr-2">🌍</span> 場所（国、都市など）</li>
            <li><span class="text-green-600 mr-2">📦</span> 種類（商品、動物など）</li>
          </ul>
        </div>
      </div>
    `,
    quiz: {
      question: 'グラフの横軸に「1月、2月、3月...」と書かれています。このグラフは何を比べていますか？',
      options: [
        { id: 'a', text: '場所による違い', explanation: '月の名前が書かれているので、場所ではなく時間を比べています。' },
        { id: 'b', text: '月ごとの変化', explanation: '正解です！横軸に月が書かれていれば、月ごとの変化を見ています。', correct: true },
        { id: 'c', text: '種類の違い', explanation: '月の名前は種類ではなく、時間を表しています。' }
      ]
    }
  },
  {
    id: 'step5',
    title: 'ステップ5: 縦軸を読もう',
    description: '縦軸は「どのくらいの量か」を教えてくれます。',
    content: `
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-lg border-2 border-gray-200">
          <h4 class="text-xl font-bold text-gray-800 mb-6 text-center">カイロの月別雨量</h4>
          <svg width="600" height="300" class="mx-auto">
            <line x1="80" y1="250" x2="550" y2="250" stroke="black" stroke-width="2" />
            <line x1="80" y1="50" x2="80" y2="250" stroke="black" stroke-width="3" />
            <g id="y-axis-labels">
              <text x="70" y="255" text-anchor="end" class="text-sm font-semibold">0</text>
              <text x="70" y="205" text-anchor="end" class="text-sm font-semibold">20</text>
              <text x="70" y="155" text-anchor="end" class="text-sm font-semibold">40</text>
              <text x="70" y="105" text-anchor="end" class="text-sm font-semibold">60</text>
              <text x="70" y="55" text-anchor="end" class="text-sm font-semibold">80</text>
              <line x1="75" y1="250" x2="80" y2="250" stroke="black" stroke-width="2" />
              <line x1="75" y1="200" x2="80" y2="200" stroke="black" stroke-width="2" />
              <line x1="75" y1="150" x2="80" y2="150" stroke="black" stroke-width="2" />
              <line x1="75" y1="100" x2="80" y2="100" stroke="black" stroke-width="2" />
              <line x1="75" y1="50" x2="80" y2="50" stroke="black" stroke-width="2" />
            </g>
            <rect x="120" y="240" width="50" height="10" fill="#3b82f6" opacity="0.3" />
            <rect x="200" y="235" width="50" height="15" fill="#3b82f6" opacity="0.3" />
            <rect x="280" y="230" width="50" height="20" fill="#3b82f6" opacity="0.3" />
            <rect x="360" y="245" width="50" height="5" fill="#3b82f6" opacity="0.3" />
            <rect x="440" y="248" width="50" height="2" fill="#3b82f6" opacity="0.3" />
          </svg>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-green-800 mb-3">
            <i class="fas fa-arrows-alt-v mr-2"></i>
            縦軸の役割
          </h4>
          <p class="text-gray-700 mb-4">
            縦軸（たてじく）は、グラフの<strong>左側に縦に伸びている線</strong>です。<br>
            ここには<strong class="text-green-600">数字</strong>が書かれていて、<strong>「どのくらいの量なのか」</strong>を表します。
          </p>
          <div class="bg-white p-4 rounded-lg">
            <p class="text-sm text-gray-600">
              上のグラフでは、0, 20, 40, 60, 80という数字が書かれています。<br>
              棒が高いほど、雨量が多いことを表しています。
            </p>
          </div>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-yellow-800 mb-3">縦軸の読み方</h4>
          <p class="text-gray-700 mb-3">
            <strong>下から上に</strong>向かって、数字が<strong>増えていきます</strong>。
          </p>
          <ul class="space-y-2 text-gray-700">
            <li><span class="text-yellow-600 mr-2">⬇️</span> 下 = 少ない</li>
            <li><span class="text-yellow-600 mr-2">⬆️</span> 上 = 多い</li>
          </ul>
        </div>
      </div>
    `,
    quiz: {
      question: 'グラフの縦軸を見ると、一番下が0、一番上が100です。棒が縦軸の真ん中あたりまで来ています。だいたいどのくらいの値でしょうか？',
      options: [
        { id: 'a', text: '約25', explanation: '真ん中なので、もう少し大きい値です。' },
        { id: 'b', text: '約50', explanation: '正解です！0と100の真ん中は50です。', correct: true },
        { id: 'c', text: '約75', explanation: '真ん中よりも高い位置になります。' }
      ]
    }
  },
  {
    id: 'step6',
    title: 'ステップ6: 単位を確認しよう',
    description: '単位は「何を数えているか」を教えてくれます。',
    content: `
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-lg border-2 border-gray-200">
          <h4 class="text-xl font-bold text-gray-800 mb-6 text-center">ナイロビの月別気温</h4>
          <svg width="600" height="300" class="mx-auto">
            <line x1="80" y1="250" x2="550" y2="250" stroke="black" stroke-width="2" />
            <line x1="80" y1="50" x2="80" y2="250" stroke="black" stroke-width="2" />
            <text x="70" y="255" text-anchor="end" class="text-sm">0</text>
            <text x="70" y="205" text-anchor="end" class="text-sm">10</text>
            <text x="70" y="155" text-anchor="end" class="text-sm">20</text>
            <text x="70" y="105" text-anchor="end" class="text-sm">30</text>
            <g id="unit-label">
              <text x="30" y="150" text-anchor="middle" class="text-base font-bold" transform="rotate(-90 30 150)">(℃)</text>
            </g>
            <polyline points="120,150 180,145 240,140 300,145 360,155 420,165 480,155" 
                      fill="none" stroke="#ef4444" stroke-width="3" />
          </svg>
        </div>

        <div class="bg-orange-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-orange-800 mb-3">
            <i class="fas fa-ruler mr-2"></i>
            単位とは
          </h4>
          <p class="text-gray-700 mb-4">
            単位は、<strong class="text-orange-600">「何を数えているのか」</strong>を示す記号や文字です。<br>
            縦軸の近くに<strong>カッコ ( ) に入れて</strong>書かれることが多いです。
          </p>
          <div class="bg-white p-4 rounded-lg">
            <h5 class="font-bold text-gray-800 mb-2">よく使う単位</h5>
            <ul class="space-y-1 text-sm text-gray-700">
              <li><span class="text-orange-600 mr-2">🌡️</span> (℃) = 温度（摂氏）</li>
              <li><span class="text-orange-600 mr-2">👤</span> (人) = 人数</li>
              <li><span class="text-orange-600 mr-2">💧</span> (mm) = 雨の量（ミリメートル）</li>
              <li><span class="text-orange-600 mr-2">📏</span> (km) = 距離（キロメートル）</li>
              <li><span class="text-orange-600 mr-2">💰</span> (円) = お金</li>
            </ul>
          </div>
        </div>

        <div class="bg-red-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-red-800 mb-3">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            単位が違うと比べられない！
          </h4>
          <p class="text-gray-700">
            例えば、「100℃」と「100人」は比べられません。<br>
            グラフを見るときは、<strong>必ず単位を確認</strong>しましょう。
          </p>
        </div>
      </div>
    `,
    quiz: {
      question: 'グラフの縦軸に「(mm)」と書かれています。このグラフは何を表していますか？',
      options: [
        { id: 'a', text: '気温', explanation: '気温の単位は(℃)です。(mm)は違います。' },
        { id: 'b', text: '雨の量', explanation: '正解です！(mm)は雨量の単位です。ミリメートルで雨の量を測ります。', correct: true },
        { id: 'c', text: '人口', explanation: '人口の単位は(人)です。(mm)は雨量の単位です。' }
      ]
    }
  },
  {
    id: 'step7',
    title: 'ステップ7: 目盛りを読もう',
    description: '目盛りは「いくつずつ増えているか」を教えてくれます。',
    content: `
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-lg border-2 border-gray-200">
          <h4 class="text-xl font-bold text-gray-800 mb-6 text-center">ルワンダの都市別人口</h4>
          <svg width="600" height="350" class="mx-auto">
            <line x1="80" y1="300" x2="550" y2="300" stroke="black" stroke-width="2" />
            <line x1="80" y1="50" x2="80" y2="300" stroke="black" stroke-width="3" />
            <g id="scale-marks">
              <line x1="75" y1="300" x2="85" y2="300" stroke="black" stroke-width="2" />
              <text x="70" y="305" text-anchor="end" class="text-sm font-bold">0</text>
              
              <line x1="75" y1="250" x2="85" y2="250" stroke="black" stroke-width="2" />
              <text x="70" y="255" text-anchor="end" class="text-sm font-bold">50</text>
              
              <line x1="75" y1="200" x2="85" y2="200" stroke="black" stroke-width="2" />
              <text x="70" y="205" text-anchor="end" class="text-sm font-bold">100</text>
              
              <line x1="75" y1="150" x2="85" y2="150" stroke="black" stroke-width="2" />
              <text x="70" y="155" text-anchor="end" class="text-sm font-bold">150</text>
              
              <line x1="75" y1="100" x2="85" y2="100" stroke="black" stroke-width="2" />
              <text x="70" y="105" text-anchor="end" class="text-sm font-bold">200</text>
              
              <!-- 補助線 -->
              <line x1="80" y1="275" x2="85" y2="275" stroke="gray" stroke-width="1" />
              <line x1="80" y1="225" x2="85" y2="225" stroke="gray" stroke-width="1" />
              <line x1="80" y1="175" x2="85" y2="175" stroke="gray" stroke-width="1" />
              <line x1="80" y1="125" x2="85" y2="125" stroke="gray" stroke-width="1" />
            </g>
            <text x="30" y="175" text-anchor="middle" class="text-sm" transform="rotate(-90 30 175)">(万人)</text>
            <rect x="150" y="150" width="80" height="150" fill="#3b82f6" />
            <rect x="260" y="250" width="80" height="50" fill="#22c55e" />
            <rect x="370" y="275" width="80" height="25" fill="#eab308" />
          </svg>
        </div>

        <div class="bg-purple-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-purple-800 mb-3">
            <i class="fas fa-ruler-combined mr-2"></i>
            目盛りとは
          </h4>
          <p class="text-gray-700 mb-4">
            目盛り（めもり）は、縦軸に<strong>等間隔</strong>で付けられた印です。<br>
            これを見ると、<strong class="text-purple-600">「一つ上がるといくつ増えるのか」</strong>が分かります。
          </p>
          <div class="bg-white p-4 rounded-lg">
            <p class="text-sm text-gray-600 mb-3">
              上のグラフでは、0 → 50 → 100 → 150 → 200 と書かれています。
            </p>
            <p class="text-sm font-bold text-purple-700">
              目盛り1つ分 = 50万人
            </p>
          </div>
        </div>

        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-blue-800 mb-3">目盛りの読み方のコツ</h4>
          <ol class="space-y-2 text-gray-700">
            <li><strong>1.</strong> 書いてある数字を2つ見つける（例: 0と50）</li>
            <li><strong>2.</strong> その差を計算する（50 - 0 = 50）</li>
            <li><strong>3.</strong> 間にいくつ線があるか数える</li>
            <li><strong>4.</strong> 目盛り1つ分の値が分かる！</li>
          </ol>
        </div>
      </div>
    `,
    quiz: {
      question: 'グラフの目盛りが 0, 100, 200, 300... と書かれています。目盛り1つ分はいくつですか？',
      options: [
        { id: 'a', text: '50', explanation: '0から100の差は100です。' },
        { id: 'b', text: '100', explanation: '正解です！0→100→200と、100ずつ増えています。', correct: true },
        { id: 'c', text: '200', explanation: '100ずつ増えています。200は2つ分の値です。' }
      ]
    }
  },
  {
    id: 'step8',
    title: 'ステップ8: 特徴のある値を見つけよう',
    description: '一番多い、一番少ない、変化が大きいなど、グラフの特徴を見つけましょう。',
    content: `
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-lg border-2 border-gray-200">
          <h4 class="text-xl font-bold text-gray-800 mb-6 text-center">東アフリカ4カ国の人口（2020年）</h4>
          <svg width="600" height="300" class="mx-auto">
            <line x1="80" y1="250" x2="550" y2="250" stroke="black" stroke-width="2" />
            <line x1="80" y1="50" x2="80" y2="250" stroke="black" stroke-width="2" />
            <text x="70" y="255" text-anchor="end" class="text-xs">0</text>
            <text x="70" y="155" text-anchor="end" class="text-xs">5000</text>
            <text x="70" y="55" text-anchor="end" class="text-xs">10000</text>
            <text x="30" y="150" text-anchor="middle" class="text-xs" transform="rotate(-90 30 150)">(万人)</text>
            
            <rect id="bar-kenya" x="130" y="90" width="70" height="160" fill="#3b82f6" />
            <rect id="bar-tanzania" x="230" y="70" width="70" height="180" fill="#3b82f6" />
            <rect id="bar-uganda" x="330" y="120" width="70" height="130" fill="#3b82f6" />
            <rect id="bar-rwanda" x="430" y="200" width="70" height="50" fill="#3b82f6" />
            
            <text x="165" y="270" text-anchor="middle" class="text-xs">ケニア</text>
            <text x="265" y="270" text-anchor="middle" class="text-xs">タンザニア</text>
            <text x="365" y="270" text-anchor="middle" class="text-xs">ウガンダ</text>
            <text x="465" y="270" text-anchor="middle" class="text-xs">ルワンダ</text>
          </svg>
        </div>

        <div class="bg-pink-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-pink-800 mb-3">
            <i class="fas fa-search mr-2"></i>
            特徴を見つけるポイント
          </h4>
          <div class="space-y-3">
            <div class="bg-white p-4 rounded-lg">
              <h5 class="font-bold text-gray-800 mb-2">
                <span class="text-2xl mr-2">📈</span>一番多いのは？
              </h5>
              <p class="text-sm text-gray-700">
                上のグラフでは、<strong class="text-pink-600">タンザニア</strong>の棒が一番高いです。<br>
                タンザニアの人口が4カ国の中で最も多いことが分かります。
              </p>
            </div>

            <div class="bg-white p-4 rounded-lg">
              <h5 class="font-bold text-gray-800 mb-2">
                <span class="text-2xl mr-2">📉</span>一番少ないのは？
              </h5>
              <p class="text-sm text-gray-700">
                <strong class="text-pink-600">ルワンダ</strong>の棒が一番低いです。<br>
                ルワンダの人口が4カ国の中で最も少ないことが分かります。
              </p>
            </div>

            <div class="bg-white p-4 rounded-lg">
              <h5 class="font-bold text-gray-800 mb-2">
                <span class="text-2xl mr-2">⚖️</span>似ている値はある？
              </h5>
              <p class="text-sm text-gray-700">
                ケニアとウガンダの棒の高さが<strong class="text-pink-600">比較的近い</strong>です。<br>
                2つの国の人口が似ていることが分かります。
              </p>
            </div>
          </div>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-lg font-bold text-green-800 mb-3">
            <i class="fas fa-lightbulb mr-2"></i>
            グラフを読むときの最終チェック
          </h4>
          <ol class="space-y-2 text-gray-700">
            <li><strong>✓</strong> 表題を読みましたか？</li>
            <li><strong>✓</strong> 横軸は何を表していますか？</li>
            <li><strong>✓</strong> 縦軸は何を表していますか？</li>
            <li><strong>✓</strong> 単位は何ですか？</li>
            <li><strong>✓</strong> 一番大きい値・小さい値はどれですか？</li>
            <li><strong>✓</strong> このグラフから何が言えますか？</li>
          </ol>
        </div>
      </div>
    `,
    quiz: {
      question: '「ナイロビの月別気温」のグラフを見ました。7月の棒が一番低かったです。このグラフから何が言えますか？',
      options: [
        { id: 'a', text: '7月のナイロビは雨が少ない', explanation: 'グラフの縦軸は「気温」です。雨の量ではありません。' },
        { id: 'b', text: '7月のナイロビは気温が一番低い', explanation: '正解です！棒が一番低いということは、気温が一番低いということです。', correct: true },
        { id: 'c', text: '7月のナイロビは人口が少ない', explanation: 'このグラフは「気温」を表しています。人口ではありません。' }
      ]
    }
  }
];

// グラフモジュールをエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { graphSteps };
}

// ブラウザ用にwindowオブジェクトに登録
if (typeof window !== 'undefined') {
  window.graphSteps = graphSteps;
  console.log('graphSteps registered:', graphSteps.length, 'steps');
}
