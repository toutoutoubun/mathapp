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
