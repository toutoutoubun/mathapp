// モジュール2: 基数性の再構築
// 数字が表す「量」を直感的に理解する

const cardinalitySteps = [
  {
    id: 'cardinal_1',
    title: 'ステップ1: 数とは「まとまり」のこと',
    description: '数は、物の個数を表します。「3」という数字は、3つの物があることを意味します。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">数字と物の対応</h4>
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="text-center">
              <div class="text-6xl mb-2">🍎</div>
              <p class="text-2xl font-bold text-blue-600">1</p>
              <p class="text-gray-600">りんご1個</p>
            </div>
            <div class="text-center">
              <div class="text-6xl mb-2">🍎🍎</div>
              <p class="text-2xl font-bold text-blue-600">2</p>
              <p class="text-gray-600">りんご2個</p>
            </div>
            <div class="text-center">
              <div class="text-6xl mb-2">🍎🍎🍎</div>
              <p class="text-2xl font-bold text-blue-600">3</p>
              <p class="text-gray-600">りんご3個</p>
            </div>
          </div>
          <p class="text-gray-700 mt-4">
            <strong class="text-blue-600">「3」</strong>という数字を見たとき、頭の中で<strong>3つの物</strong>を思い浮かべることができれば、
            その数が表す<strong class="text-blue-600">「量」</strong>を直感的に理解できます。
          </p>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">アフリカの例: エチオピアのコーヒー豆</h4>
          <p class="text-gray-700 mb-4">
            エチオピアはコーヒーの原産地です。農家の人が収穫したコーヒー豆を数えるとき、
            <strong class="text-green-600">「5」という数字</strong>は、<strong>5粒のコーヒー豆</strong>を意味します。
          </p>
          <div class="flex justify-center items-center space-x-2 text-4xl">
            ☕☕☕☕☕ = <span class="text-green-600 font-bold">5</span>
          </div>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-300">
          <h4 class="text-xl font-bold text-yellow-800 mb-3">
            <i class="fas fa-key mr-2"></i>重要なポイント
          </h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <i class="fas fa-check text-yellow-600 mr-3 mt-1"></i>
              <span>数字は<strong>物の個数</strong>を表す記号です</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check text-yellow-600 mr-3 mt-1"></i>
              <span>数字を見たら、<strong>実際の物</strong>を思い浮かべましょう</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check text-yellow-600 mr-3 mt-1"></i>
              <span>「5」=「物が5つある」という<strong>イメージ</strong>を持ちましょう</span>
            </li>
          </ul>
        </div>
      </div>
    `,
    quiz: {
      question: 'ケニアの市場でマンゴーを買います。「7個ください」と言いました。「7」という数字は何を表していますか？',
      options: [
        { id: 'A', text: '7という文字', correct: false, explanation: '数字は文字ではなく、量を表す記号です。' },
        { id: 'B', text: 'マンゴーが7つあること', correct: true, explanation: '正解！「7」は、マンゴーが7個あるという<strong>量</strong>を表しています。' },
        { id: 'C', text: '7円という値段', correct: false, explanation: 'ここでは値段ではなく、個数を表しています。' }
      ]
    }
  },

  {
    id: 'cardinal_2',
    title: 'ステップ2: 数の大きさを比べる',
    description: '数の大きさは、物の個数の多さを表します。物が多ければ、数も大きくなります。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">物の数を見比べる</h4>
          <div class="grid grid-cols-2 gap-6 mb-4">
            <div class="bg-white p-4 rounded-lg text-center">
              <div class="text-4xl mb-3">🌍🌍🌍</div>
              <p class="text-3xl font-bold text-blue-600">3</p>
              <p class="text-gray-600 mt-2">地球が3つ</p>
            </div>
            <div class="bg-white p-4 rounded-lg text-center">
              <div class="text-4xl mb-3">🌍🌍🌍🌍🌍🌍🌍</div>
              <p class="text-3xl font-bold text-blue-600">7</p>
              <p class="text-gray-600 mt-2">地球が7つ</p>
            </div>
          </div>
          <div class="text-center text-2xl font-bold text-blue-800">
            3 < 7 （3は7より小さい）
          </div>
          <p class="text-gray-700 mt-4">
            物の<strong class="text-blue-600">個数が多い</strong>方が、数も<strong class="text-blue-600">大きく</strong>なります。
          </p>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">アフリカの例: タンザニアのバオバブの木</h4>
          <p class="text-gray-700 mb-4">
            タンザニアには巨大なバオバブの木があります。A村には<strong>12本</strong>、B村には<strong>8本</strong>あります。
          </p>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white p-4 rounded-lg">
              <p class="font-bold text-green-800 mb-2">A村</p>
              <div class="text-2xl mb-2">🌳🌳🌳🌳🌳🌳</div>
              <div class="text-2xl mb-2">🌳🌳🌳🌳🌳🌳</div>
              <p class="text-2xl font-bold text-green-600">12本</p>
            </div>
            <div class="bg-white p-4 rounded-lg">
              <p class="font-bold text-green-800 mb-2">B村</p>
              <div class="text-2xl mb-2">🌳🌳🌳🌳</div>
              <div class="text-2xl mb-2">🌳🌳🌳🌳</div>
              <p class="text-2xl font-bold text-green-600">8本</p>
            </div>
          </div>
          <p class="text-center text-xl font-bold text-green-800 mt-4">
            12 > 8 （A村の方が木が多い）
          </p>
        </div>

        <div class="bg-purple-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-purple-800 mb-3">比較記号の読み方</h4>
          <div class="space-y-3 text-lg">
            <div class="bg-white p-3 rounded">
              <span class="text-2xl font-bold text-purple-600">5 < 9</span>
              <span class="ml-4 text-gray-700">→ 「5は9より<strong>小さい</strong>」</span>
            </div>
            <div class="bg-white p-3 rounded">
              <span class="text-2xl font-bold text-purple-600">15 > 10</span>
              <span class="ml-4 text-gray-700">→ \"15は10より<strong>大きい</strong>」</span>
            </div>
            <div class="bg-white p-3 rounded">
              <span class="text-2xl font-bold text-purple-600">7 = 7</span>
              <span class="ml-4 text-gray-700">→ 「7と7は<strong>等しい</strong>」</span>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'ウガンダのゴリラ保護区。東側には15頭、西側には23頭のゴリラがいます。どちらが多いですか？',
      options: [
        { id: 'A', text: '東側（15頭）', correct: false, explanation: '15は23より小さい数です。' },
        { id: 'B', text: '西側（23頭）', correct: true, explanation: '正解！23は15より大きいので、西側の方が<strong>ゴリラが多い</strong>です。' },
        { id: 'C', text: '同じ', correct: false, explanation: '15と23は異なる数です。' }
      ]
    }
  },

  {
    id: 'cardinal_3',
    title: 'ステップ3: 10のまとまりで考える',
    description: '大きな数は、10のまとまりで考えると分かりやすくなります。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">10のまとまり</h4>
          <p class="text-gray-700 mb-4">
            大きな数を数えるとき、<strong class="text-blue-600">10個ずつのまとまり</strong>で考えると便利です。
          </p>
          <div class="bg-white p-6 rounded-lg mb-4">
            <p class="font-bold text-gray-800 mb-3">25 = ?</p>
            <div class="space-y-3">
              <div class="flex items-center">
                <div class="bg-blue-200 p-3 rounded mr-3 text-center">
                  <p class="text-sm text-blue-800">10のまとまり</p>
                  <div class="text-2xl">⬛⬛⬛⬛⬛</div>
                  <div class="text-2xl">⬛⬛⬛⬛⬛</div>
                </div>
                <div class="bg-blue-200 p-3 rounded mr-3 text-center">
                  <p class="text-sm text-blue-800">10のまとまり</p>
                  <div class="text-2xl">⬛⬛⬛⬛⬛</div>
                  <div class="text-2xl">⬛⬛⬛⬛⬛</div>
                </div>
                <div class="bg-green-200 p-3 rounded text-center">
                  <p class="text-sm text-green-800">ばらの5個</p>
                  <div class="text-2xl">⬛⬛⬛⬛⬛</div>
                </div>
              </div>
              <p class="text-xl font-bold text-gray-800">
                25 = <span class="text-blue-600">10</span> + <span class="text-blue-600">10</span> + <span class="text-green-600">5</span>
              </p>
              <p class="text-lg text-gray-700">
                または: 25 = <span class="text-blue-600">20</span>（10が2つ） + <span class="text-green-600">5</span>
              </p>
            </div>
          </div>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">アフリカの例: セネガルの市場</h4>
          <p class="text-gray-700 mb-4">
            セネガルの市場でオレンジを売っています。オレンジは<strong>10個ずつ袋</strong>に入っています。
          </p>
          <div class="bg-white p-4 rounded-lg">
            <p class="font-bold mb-3">47個のオレンジがあります</p>
            <div class="flex items-center justify-center space-x-3 mb-4">
              <div class="text-center">
                <div class="text-4xl mb-2">🛍️🛍️🛍️🛍️</div>
                <p class="text-sm text-gray-600">10個入り × 4袋</p>
                <p class="font-bold text-blue-600">= 40個</p>
              </div>
              <div class="text-3xl">+</div>
              <div class="text-center">
                <div class="text-4xl mb-2">🍊🍊🍊🍊🍊🍊🍊</div>
                <p class="text-sm text-gray-600">ばら</p>
                <p class="font-bold text-green-600">= 7個</p>
              </div>
            </div>
            <p class="text-xl font-bold text-center text-gray-800">
              47 = <span class="text-blue-600">40</span> + <span class="text-green-600">7</span>
            </p>
          </div>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-300">
          <h4 class="text-xl font-bold text-yellow-800 mb-3">
            <i class="fas fa-lightbulb mr-2"></i>覚えておこう
          </h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <i class="fas fa-arrow-right text-yellow-600 mr-3 mt-1"></i>
              <span><strong>10のまとまり</strong>で考えると、大きな数も分かりやすい</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-arrow-right text-yellow-600 mr-3 mt-1"></i>
              <span><strong>35</strong> = 10が3つ + 5個 = <strong>30 + 5</strong></span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-arrow-right text-yellow-600 mr-3 mt-1"></i>
              <span><strong>82</strong> = 10が8つ + 2個 = <strong>80 + 2</strong></span>
            </li>
          </ul>
        </div>
      </div>
    `,
    quiz: {
      question: 'ナイジェリアの学校に生徒が63人います。「63」を10のまとまりで表すと？',
      options: [
        { id: 'A', text: '10が6つと、3個', correct: true, explanation: '正解！63 = <strong>60</strong>（10×6） + <strong>3</strong> です。10のまとまりが6つあります。' },
        { id: 'B', text: '10が3つと、6個', correct: false, explanation: '順番が逆です。63は60と3なので、10が6つと3個です。' },
        { id: 'C', text: '10が9つ', correct: false, explanation: '10が9つだと90になってしまいます。' }
      ]
    }
  },

  {
    id: 'cardinal_4',
    title: 'ステップ4: 数の線（数直線）で位置を見る',
    description: '数は線の上に並べることができます。右に行くほど数が大きくなります。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">数直線とは</h4>
          <p class="text-gray-700 mb-4">
            数を<strong class="text-blue-600">線の上に順番に並べたもの</strong>を「数直線」と言います。
          </p>
          <div class="bg-white p-6 rounded-lg mb-4">
            <svg width="100%" height="100" viewBox="0 0 600 100" class="mx-auto">
              <!-- 数直線 -->
              <line x1="50" y1="50" x2="550" y2="50" stroke="#3b82f6" stroke-width="3" />
              
              <!-- 目盛りと数字 -->
              <line x1="50" y1="40" x2="50" y2="60" stroke="#3b82f6" stroke-width="2" />
              <text x="50" y="80" text-anchor="middle" font-size="18" fill="#1f2937">0</text>
              
              <line x1="150" y1="40" x2="150" y2="60" stroke="#3b82f6" stroke-width="2" />
              <text x="150" y="80" text-anchor="middle" font-size="18" fill="#1f2937">5</text>
              
              <line x1="250" y1="40" x2="250" y2="60" stroke="#3b82f6" stroke-width="2" />
              <text x="250" y="80" text-anchor="middle" font-size="18" fill="#1f2937">10</text>
              
              <line x1="350" y1="40" x2="350" y2="60" stroke="#3b82f6" stroke-width="2" />
              <text x="350" y="80" text-anchor="middle" font-size="18" fill="#1f2937">15</text>
              
              <line x1="450" y1="40" x2="450" y2="60" stroke="#3b82f6" stroke-width="2" />
              <text x="450" y="80" text-anchor="middle" font-size="18" fill="#1f2937">20</text>
              
              <line x1="550" y1="40" x2="550" y2="60" stroke="#3b82f6" stroke-width="2" />
              <text x="550" y="80" text-anchor="middle" font-size="18" fill="#1f2937">25</text>
              
              <!-- 矢印 -->
              <polygon points="550,50 560,45 560,55" fill="#3b82f6" />
              <text x="570" y="55" font-size="16" fill="#3b82f6">→</text>
            </svg>
            <p class="text-center text-gray-600 mt-3">右に行くほど、数が<strong>大きく</strong>なります</p>
          </div>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">アフリカの例: ケニアから南アフリカまでの距離</h4>
          <p class="text-gray-700 mb-4">
            ケニアのナイロビから南に向かって、いろいろな都市までの距離を数直線で表します。
          </p>
          <div class="bg-white p-6 rounded-lg">
            <svg width="100%" height="120" viewBox="0 0 600 120" class="mx-auto">
              <!-- 数直線 -->
              <line x1="50" y1="60" x2="550" y2="60" stroke="#22c55e" stroke-width="3" />
              
              <!-- 目盛り -->
              <line x1="50" y1="50" x2="50" y2="70" stroke="#22c55e" stroke-width="2" />
              <text x="50" y="90" text-anchor="middle" font-size="14" fill="#1f2937">0km</text>
              <text x="50" y="35" text-anchor="middle" font-size="12" fill="#059669" font-weight="bold">ナイロビ</text>
              
              <circle cx="200" cy="60" r="6" fill="#ef4444" />
              <text x="200" y="90" text-anchor="middle" font-size="14" fill="#1f2937">500km</text>
              <text x="200" y="35" text-anchor="middle" font-size="12" fill="#059669">タンザニア</text>
              
              <circle cx="350" cy="60" r="6" fill="#ef4444" />
              <text x="350" y="90" text-anchor="middle" font-size="14" fill="#1f2937">1500km</text>
              <text x="350" y="35" text-anchor="middle" font-size="12" fill="#059669">ザンビア</text>
              
              <circle cx="500" cy="60" r="6" fill="#ef4444" />
              <text x="500" y="90" text-anchor="middle" font-size="14" fill="#1f2937">3000km</text>
              <text x="500" y="35" text-anchor="middle" font-size="12" fill="#059669">南アフリカ</text>
            </svg>
          </div>
        </div>

        <div class="bg-purple-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-purple-800 mb-3">数直線の特徴</h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <i class="fas fa-check text-purple-600 mr-3 mt-1"></i>
              <span>数は<strong>左から右</strong>へ順番に並んでいる</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check text-purple-600 mr-3 mt-1"></i>
              <span><strong>右に行く</strong>ほど数が<strong>大きく</strong>なる</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check text-purple-600 mr-3 mt-1"></i>
              <span>数の<strong>位置</strong>を見れば、大きさの比較ができる</span>
            </li>
          </ul>
        </div>
      </div>
    `,
    quiz: {
      question: '数直線で、12はどこにありますか？',
      options: [
        { id: 'A', text: '0と5の間', correct: false, explanation: '12は5より大きい数なので、5より右側にあります。' },
        { id: 'B', text: '10と15の間', correct: true, explanation: '正解！12は10より大きく、15より小さいので、<strong>10と15の間</strong>にあります。' },
        { id: 'C', text: '15と20の間', correct: false, explanation: '12は15より小さい数なので、15より左側にあります。' }
      ]
    }
  },

  {
    id: 'cardinal_5',
    title: 'ステップ5: 位の値（一の位、十の位）',
    description: '数字の書く場所によって、表す大きさが変わります。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">位の値とは</h4>
          <p class="text-gray-700 mb-4">
            数字は<strong class="text-blue-600">書く場所によって、表す大きさが変わります</strong>。
          </p>
          <div class="bg-white p-6 rounded-lg mb-4">
            <p class="text-center text-4xl font-bold text-gray-800 mb-4">2 5</p>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-blue-100 p-4 rounded-lg text-center">
                <p class="text-6xl font-bold text-blue-600">2</p>
                <p class="text-lg font-bold text-blue-800 mt-2">十の位</p>
                <p class="text-gray-700">10が<strong>2つ</strong></p>
                <p class="text-2xl font-bold text-blue-600">= 20</p>
              </div>
              <div class="bg-green-100 p-4 rounded-lg text-center">
                <p class="text-6xl font-bold text-green-600">5</p>
                <p class="text-lg font-bold text-green-800 mt-2">一の位</p>
                <p class="text-gray-700">1が<strong>5つ</strong></p>
                <p class="text-2xl font-bold text-green-600">= 5</p>
              </div>
            </div>
            <p class="text-center text-2xl font-bold text-gray-800 mt-4">
              25 = <span class="text-blue-600">20</span> + <span class="text-green-600">5</span>
            </p>
          </div>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">もう一つの例: 73</h4>
          <div class="bg-white p-6 rounded-lg">
            <p class="text-center text-4xl font-bold text-gray-800 mb-4">7 3</p>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="bg-blue-100 p-4 rounded-lg text-center">
                <p class="text-6xl font-bold text-blue-600">7</p>
                <p class="text-lg font-bold text-blue-800 mt-2">十の位</p>
                <p class="text-gray-700">10が<strong>7つ</strong></p>
                <p class="text-2xl font-bold text-blue-600">= 70</p>
              </div>
              <div class="bg-green-100 p-4 rounded-lg text-center">
                <p class="text-6xl font-bold text-green-600">3</p>
                <p class="text-lg font-bold text-green-800 mt-2">一の位</p>
                <p class="text-gray-700">1が<strong>3つ</strong></p>
                <p class="text-2xl font-bold text-green-600">= 3</p>
              </div>
            </div>
            <p class="text-center text-2xl font-bold text-gray-800">
              73 = <span class="text-blue-600">70</span> + <span class="text-green-600">3</span>
            </p>
          </div>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-yellow-800 mb-4">アフリカの例: ガーナのカカオ農園</h4>
          <p class="text-gray-700 mb-4">
            ガーナのカカオ農園で、カカオの実を収穫しました。合計<strong>48個</strong>です。
          </p>
          <div class="bg-white p-6 rounded-lg">
            <p class="text-center text-4xl font-bold text-gray-800 mb-4">4 8</p>
            <div class="flex justify-center space-x-6 mb-4">
              <div class="text-center">
                <p class="text-2xl mb-2">🥜🥜🥜🥜🥜🥜🥜🥜🥜🥜</p>
                <p class="text-2xl mb-2">🥜🥜🥜🥜🥜🥜🥜🥜🥜🥜</p>
                <p class="text-2xl mb-2">🥜🥜🥜🥜🥜🥜🥜🥜🥜🥜</p>
                <p class="text-2xl mb-2">🥜🥜🥜🥜🥜🥜🥜🥜🥜🥜</p>
                <p class="font-bold text-blue-600">4つの10 = 40個</p>
              </div>
              <div class="text-4xl self-center">+</div>
              <div class="text-center">
                <p class="text-2xl mb-2">🥜🥜🥜🥜</p>
                <p class="text-2xl mb-2">🥜🥜🥜🥜</p>
                <p class="font-bold text-green-600 mt-4">8個</p>
              </div>
            </div>
            <p class="text-center text-2xl font-bold text-gray-800">
              48 = <span class="text-blue-600">40</span> + <span class="text-green-600">8</span>
            </p>
          </div>
        </div>

        <div class="bg-purple-50 p-6 rounded-lg border-2 border-purple-300">
          <h4 class="text-xl font-bold text-purple-800 mb-3">
            <i class="fas fa-brain mr-2"></i>覚えておこう
          </h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <i class="fas fa-arrow-right text-purple-600 mr-3 mt-1"></i>
              <span><strong>一の位</strong>: 1が何個あるか（右側の数字）</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-arrow-right text-purple-600 mr-3 mt-1"></i>
              <span><strong>十の位</strong>: 10が何個あるか（左側の数字）</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-arrow-right text-purple-600 mr-3 mt-1"></i>
              <span>同じ「3」でも、十の位なら<strong>30</strong>、一の位なら<strong>3</strong></span>
            </li>
          </ul>
        </div>
      </div>
    `,
    quiz: {
      question: '数字「56」の十の位の「5」は、何を表していますか？',
      options: [
        { id: 'A', text: '5という数', correct: false, explanation: '十の位の5は、ただの5ではありません。' },
        { id: 'B', text: '10が5つ、つまり50', correct: true, explanation: '正解！十の位の5は、<strong>10が5つ</strong>なので<strong>50</strong>を表しています。' },
        { id: 'C', text: '5と6を足した数', correct: false, explanation: 'ここでは足し算ではなく、位の値を考えます。' }
      ]
    }
  }
];

// ステップをグローバルに登録
window.cardinalitySteps = cardinalitySteps;
console.log('✅ 基数性モジュール読み込み完了:', cardinalitySteps.length, 'ステップ');

  // ========================================
  // ステップ6: 0（ゼロ）の意味
  // ========================================
  {
    id: 'cardinal_6',
    title: 'ステップ6: 0（ゼロ）の意味',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-circle-notch mr-2 text-purple-500"></i>
          0（ゼロ）って何だろう？
        </h3>
        
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            「0」は「<strong>何もない</strong>」ことを表す特別な数です。<br>
            ケニアのナイロビでマンゴーを1つも持っていないとき、<strong>0個</strong>と言います。
          </p>
          
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="bg-white p-4 rounded-lg text-center shadow-sm">
              <div class="text-4xl mb-2">🥭🥭🥭</div>
              <div class="text-xl font-bold text-gray-800">3個</div>
              <div class="text-sm text-gray-600">マンゴーがある</div>
            </div>
            <div class="bg-white p-4 rounded-lg text-center shadow-sm">
              <div class="text-4xl mb-2">🥭</div>
              <div class="text-xl font-bold text-gray-800">1個</div>
              <div class="text-sm text-gray-600">マンゴーがある</div>
            </div>
            <div class="bg-white p-4 rounded-lg text-center shadow-sm border-4 border-purple-300">
              <div class="text-4xl mb-2">⭕</div>
              <div class="text-xl font-bold text-purple-600">0個</div>
              <div class="text-sm text-gray-600">何もない</div>
            </div>
          </div>
        </div>
        
        <div class="bg-blue-50 p-4 rounded-lg mb-4">
          <p class="text-gray-700">
            <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
            <strong>0の大切さ:</strong> 何もないことを表す「0」があることで、<br>
            「あるかないか」をはっきり区別できます。
          </p>
        </div>
      </div>
    `,
    quiz: {
      question: 'タンザニアの市場で、バナナを全部売り切りました。残りは何本ですか？',
      options: [
        { id: 'A', text: '1本', correct: false, explanation: '売り切ったので、残りはありません。' },
        { id: 'B', text: '0本', correct: true, explanation: '正解！全部売ったので、残りは<strong>0本</strong>です。何もないことを「0」で表します。' },
        { id: 'C', text: '数えられない', correct: false, explanation: '何もない状態も「0」という数で表せます。' }
      ]
    }
  },

  // ========================================
  // ステップ7: 数の順序（数直線で並べる）
  // ========================================
  {
    id: 'cardinal_7',
    title: 'ステップ7: 数の順序',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-arrow-right mr-2 text-green-500"></i>
          数は順番に並んでいる
        </h3>
        
        <div class="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            数は、小さい方から大きい方へ<strong>順番に並んで</strong>います。<br>
            これを<strong>数直線</strong>で見てみましょう。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <svg viewBox="0 0 600 100" class="w-full">
              <!-- 数直線 -->
              <line x1="50" y1="50" x2="550" y2="50" stroke="#333" stroke-width="3"/>
              <!-- 目盛りと数字 -->
              <g id="ticks">
                ${[0,1,2,3,4,5,6,7,8,9,10].map((n) => `
                  <line x1="${50 + n*50}" y1="45" x2="${50 + n*50}" y2="55" stroke="#333" stroke-width="2"/>
                  <text x="${50 + n*50}" y="75" text-anchor="middle" font-size="18" font-weight="bold">${n}</text>
                `).join('')}
              </g>
              <!-- 矢印 -->
              <polygon points="550,50 540,45 540,55" fill="#333"/>
            </svg>
          </div>
          
          <p class="text-gray-700 mb-2">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            数直線では、右に行くほど数が<strong>大きく</strong>なります。
          </p>
          <p class="text-gray-700">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            数と数の<strong>間隔</strong>は同じです。
          </p>
        </div>
      </div>
    `,
    quiz: {
      question: '数直線で、5の右隣にある数はどれですか？',
      options: [
        { id: 'A', text: '4', correct: false, explanation: '4は5の左側（小さい方）にあります。' },
        { id: 'B', text: '6', correct: true, explanation: '正解！数直線では右に行くほど大きくなるので、5の右隣は<strong>6</strong>です。' },
        { id: 'C', text: '10', correct: false, explanation: '10は5より大きいですが、すぐ隣ではありません。' }
      ]
    }
  },

  // ========================================
  // ステップ8: 1ずつ増える・減る
  // ========================================
  {
    id: 'cardinal_8',
    title: 'ステップ8: 1ずつ増える・減る',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-plus-circle mr-2 text-blue-500"></i>
          数は1ずつ変わる
        </h3>
        
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            数直線で<strong>右に1つ進む</strong>と、数が<strong>1増えます</strong>。<br>
            <strong>左に1つ戻る</strong>と、数が<strong>1減ります</strong>。
          </p>
          
          <div class="grid grid-cols-2 gap-6 mb-4">
            <!-- 増える例 -->
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <h4 class="font-bold text-blue-600 mb-3">
                <i class="fas fa-arrow-right mr-2"></i>
                1増える（右へ）
              </h4>
              <div class="space-y-2 text-lg">
                <div>5 → <strong class="text-blue-600">6</strong></div>
                <div>7 → <strong class="text-blue-600">8</strong></div>
                <div>12 → <strong class="text-blue-600">13</strong></div>
              </div>
            </div>
            
            <!-- 減る例 -->
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <h4 class="font-bold text-red-600 mb-3">
                <i class="fas fa-arrow-left mr-2"></i>
                1減る（左へ）
              </h4>
              <div class="space-y-2 text-lg">
                <div>6 → <strong class="text-red-600">5</strong></div>
                <div>8 → <strong class="text-red-600">7</strong></div>
                <div>13 → <strong class="text-red-600">12</strong></div>
              </div>
            </div>
          </div>
          
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-star text-yellow-500 mr-2"></i>
              エチオピアでコーヒー豆が8粒あります。1粒食べると、残りは<strong>7粒</strong>になります。
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'ナイジェリアの農場でヤギが9頭います。1頭増えると何頭になりますか？',
      options: [
        { id: 'A', text: '8頭', correct: false, explanation: '8頭は1頭減った場合です。' },
        { id: 'B', text: '10頭', correct: true, explanation: '正解！9に1を足すと<strong>10</strong>になります。数直線で右に1つ進みました。' },
        { id: 'C', text: '11頭', correct: false, explanation: '11頭は2頭増えた場合です。' }
      ]
    }
  },

  // ========================================
  // ステップ9: 大きい数のイメージ（100まで）
  // ========================================
  {
    id: 'cardinal_9',
    title: 'ステップ9: 大きい数のイメージ',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-expand-arrows-alt mr-2 text-orange-500"></i>
          100ってどれくらい？
        </h3>
        
        <div class="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            10が10個集まると、<strong>100</strong>になります。<br>
            これはとても大きな数です！
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-3">10のまとまりを10個</h4>
            <div class="grid grid-cols-5 gap-2">
              ${Array(10).fill(0).map((_, i) => `
                <div class="bg-blue-100 p-2 rounded text-center border-2 border-blue-300">
                  <div class="text-sm font-bold text-blue-600">10</div>
                </div>
              `).join('')}
            </div>
            <div class="text-center mt-4 text-2xl font-bold text-orange-600">
              10 × 10 = 100
            </div>
          </div>
          
          <div class="bg-green-50 p-4 rounded-lg mb-4">
            <p class="text-gray-700 mb-2">
              <i class="fas fa-globe-africa text-green-600 mr-2"></i>
              <strong>身近な例:</strong>
            </p>
            <ul class="space-y-1 text-gray-700 ml-6">
              <li>• ガーナのカカオ豆100粒</li>
              <li>• セネガルの市場のピーナッツ100個</li>
              <li>• ウガンダの小学校の生徒100人</li>
            </ul>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '10のまとまりが5個あります。全部で何になりますか？',
      options: [
        { id: 'A', text: '15', correct: false, explanation: '10 + 5 = 15ではなく、10が5個という意味です。' },
        { id: 'B', text: '50', correct: true, explanation: '正解！10 × 5 = <strong>50</strong>です。10のまとまり5個分です。' },
        { id: 'C', text: '100', correct: false, explanation: '100は10のまとまりが10個の場合です。' }
      ]
    }
  },

  // ========================================
  // ステップ10: 数の分解（5を分ける）
  // ========================================
  {
    id: 'cardinal_10',
    title: 'ステップ10: 数を分ける',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-object-ungroup mr-2 text-teal-500"></i>
          数は分けられる
        </h3>
        
        <div class="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            1つの数は、いろいろな方法で<strong>小さい数に分けられます</strong>。<br>
            例えば、5を分けてみましょう。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4 text-center">5の分け方</h4>
            <div class="space-y-3">
              <div class="flex items-center justify-center gap-3 p-3 bg-teal-50 rounded">
                <span class="text-2xl">🥭🥭🥭🥭🥭</span>
                <span class="text-xl font-bold">=</span>
                <span class="text-2xl">🥭🥭</span>
                <span class="text-xl">+</span>
                <span class="text-2xl">🥭🥭🥭</span>
                <span class="text-gray-600 ml-3">(2 + 3)</span>
              </div>
              
              <div class="flex items-center justify-center gap-3 p-3 bg-teal-50 rounded">
                <span class="text-2xl">🥭🥭🥭🥭🥭</span>
                <span class="text-xl font-bold">=</span>
                <span class="text-2xl">🥭</span>
                <span class="text-xl">+</span>
                <span class="text-2xl">🥭🥭🥭🥭</span>
                <span class="text-gray-600 ml-3">(1 + 4)</span>
              </div>
              
              <div class="flex items-center justify-center gap-3 p-3 bg-teal-50 rounded">
                <span class="text-2xl">🥭🥭🥭🥭🥭</span>
                <span class="text-xl font-bold">=</span>
                <span class="text-2xl">🥭🥭🥭</span>
                <span class="text-xl">+</span>
                <span class="text-2xl">🥭🥭</span>
                <span class="text-gray-600 ml-3">(3 + 2)</span>
              </div>
            </div>
          </div>
          
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-info-circle text-blue-500 mr-2"></i>
              どんな分け方をしても、合わせると<strong>元の数</strong>になります。
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'マリでピーナッツが7個あります。3個と何個に分けられますか？',
      options: [
        { id: 'A', text: '3個', correct: false, explanation: '3 + 3 = 6で、7にはなりません。' },
        { id: 'B', text: '4個', correct: true, explanation: '正解！3 + 4 = <strong>7</strong>です。7を3と4に分けられます。' },
        { id: 'C', text: '5個', correct: false, explanation: '3 + 5 = 8で、7より大きくなります。' }
      ]
    }
  },

  // ========================================
  // ステップ11: 数の合成（合わせていくつ）
  // ========================================
  {
    id: 'cardinal_11',
    title: 'ステップ11: 数を合わせる',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-plus-square mr-2 text-indigo-500"></i>
          小さい数を合わせると大きい数になる
        </h3>
        
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            2つの数を<strong>合わせる</strong>と、大きい数になります。<br>
            これを<strong>たし算</strong>と言います。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">南アフリカのリンゴ</h4>
            <div class="flex items-center justify-center gap-4 mb-4">
              <div class="text-center">
                <div class="text-4xl mb-2">🍎🍎🍎</div>
                <div class="text-xl font-bold">3個</div>
              </div>
              <div class="text-4xl font-bold text-indigo-600">+</div>
              <div class="text-center">
                <div class="text-4xl mb-2">🍎🍎</div>
                <div class="text-xl font-bold">2個</div>
              </div>
              <div class="text-4xl font-bold text-gray-600">=</div>
              <div class="text-center">
                <div class="text-4xl mb-2">🍎🍎🍎🍎🍎</div>
                <div class="text-xl font-bold text-indigo-600">5個</div>
              </div>
            </div>
            <p class="text-center text-lg text-gray-700">
              3 + 2 = <strong class="text-indigo-600">5</strong>
            </p>
          </div>
          
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
              合わせると、<strong>もとの数より大きく</strong>なります。
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'モロッコでオレンジが4個、レモンが3個あります。合わせて何個ですか？',
      options: [
        { id: 'A', text: '6個', correct: false, explanation: '4 + 3 = 7です。もう一度数えてみましょう。' },
        { id: 'B', text: '7個', correct: true, explanation: '正解！4 + 3 = <strong>7個</strong>です。オレンジとレモンを合わせました。' },
        { id: 'C', text: '8個', correct: false, explanation: '4 + 3 = 7です。8は4 + 4です。' }
      ]
    }
  },

  // ========================================
  // ステップ12: 基数性の総合練習
  // ========================================
  {
    id: 'cardinal_12',
    title: 'ステップ12: 総合練習',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-trophy mr-2 text-yellow-500"></i>
          学んだことを使ってみよう
        </h3>
        
        <div class="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            これまで学んだ<strong>基数性</strong>の考え方を使って、問題を解いてみましょう。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-3">復習：数の大切なポイント</h4>
            <div class="space-y-2 text-gray-700">
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                数は「<strong>量</strong>」を表す
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                大きさを<strong>比べる</strong>ことができる
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                10のまとまりで考えると<strong>わかりやすい</strong>
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                数直線で<strong>順序と位置</strong>がわかる
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                数は<strong>分けたり合わせたり</strong>できる
              </p>
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-star text-yellow-500 mr-2"></i>
              <strong>数の感覚</strong>が身につくと、計算もわかりやすくなります！
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'ザンビアの学校で、生徒が10人ずつ3つの教室にいます。全部で何人ですか？',
      options: [
        { id: 'A', text: '13人', correct: false, explanation: '10 + 3 = 13ではなく、10が3つという意味です。' },
        { id: 'B', text: '30人', correct: true, explanation: '正解！10 × 3 = <strong>30人</strong>です。10のまとまりが3つで30になります。' },
        { id: 'C', text: '100人', correct: false, explanation: '100は10のまとまりが10個の場合です。' }
      ]
    }
  }
];

// グローバルに登録
window.cardinalitySteps = cardinalitySteps;

console.log('✅ 基数性モジュールを12ステップに拡張しました');
