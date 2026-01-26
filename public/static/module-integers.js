// ========================================
// モジュール7: 正の数・負の数
// ========================================

const integersSteps = [
  {
    id: 'integers_1',
    title: 'ステップ1: 正の数と負の数とは',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-plus-minus mr-2 text-blue-500"></i>
          正の数と負の数の世界へようこそ
        </h3>
        
        <div class="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            これまで学んだ数は、すべて<strong>0以上</strong>の数でした。<br>
            でも、世の中には<strong>0より小さい数</strong>もあります。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">身近な例</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-blue-50 rounded-lg">
                <div class="text-3xl mb-2 text-center">🌡️</div>
                <div class="font-bold text-blue-600 mb-2">気温</div>
                <div class="text-sm text-gray-700">
                  • 0℃より暖かい → +5℃（プラス5度）<br>
                  • 0℃より寒い → -5℃（マイナス5度）
                </div>
              </div>
              
              <div class="p-4 bg-green-50 rounded-lg">
                <div class="text-3xl mb-2 text-center">💰</div>
                <div class="font-bold text-green-600 mb-2">お金</div>
                <div class="text-sm text-gray-700">
                  • 持っている → +1000円（プラス1000円）<br>
                  • 借りている → -1000円（マイナス1000円）
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">名前の付け方</h4>
            <div class="space-y-3">
              <div class="p-3 bg-green-50 rounded">
                <div class="font-bold text-green-600">正の数（せいのすう）</div>
                <div class="text-gray-700">0より大きい数 → +1, +2, +3, +100...</div>
              </div>
              <div class="p-3 bg-red-50 rounded">
                <div class="font-bold text-red-600">負の数（ふのすう）</div>
                <div class="text-gray-700">0より小さい数 → -1, -2, -3, -100...</div>
              </div>
              <div class="p-3 bg-gray-50 rounded">
                <div class="font-bold text-gray-600">0（ゼロ）</div>
                <div class="text-gray-700">正の数でも負の数でもない特別な数</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '-3℃は何を表していますか？',
      options: [
        { id: 'A', text: '0℃より3度暖かい', correct: false, explanation: 'マイナス（-）は0より小さいことを表します。' },
        { id: 'B', text: '0℃より3度寒い', correct: true, explanation: '正解！-3℃は0℃より<strong>3度寒い</strong>ことを表します。' },
        { id: 'C', text: '3℃と同じ', correct: false, explanation: '+3℃と-3℃は違います。' }
      ]
    }
  },

  {
    id: 'integers_2',
    title: 'ステップ2: 数直線で理解する',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-arrows-alt-h mr-2 text-purple-500"></i>
          数直線で正の数と負の数を見る
        </h3>
        
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            正の数と負の数は、<strong>数直線</strong>で表すとわかりやすいです。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">数直線</h4>
            <svg viewBox="0 0 600 120" class="w-full">
              <!-- 数直線 -->
              <line x1="50" y1="60" x2="550" y2="60" stroke="#333" stroke-width="3"/>
              <!-- 負の数 -->
              <g fill="#e74c3c" font-weight="bold">
                <line x1="100" y1="55" x2="100" y2="65" stroke="#e74c3c" stroke-width="2"/>
                <text x="100" y="85" text-anchor="middle" font-size="16">-4</text>
                <line x1="150" y1="55" x2="150" y2="65" stroke="#e74c3c" stroke-width="2"/>
                <text x="150" y="85" text-anchor="middle" font-size="16">-3</text>
                <line x1="200" y1="55" x2="200" y2="65" stroke="#e74c3c" stroke-width="2"/>
                <text x="200" y="85" text-anchor="middle" font-size="16">-2</text>
                <line x1="250" y1="55" x2="250" y2="65" stroke="#e74c3c" stroke-width="2"/>
                <text x="250" y="85" text-anchor="middle" font-size="16">-1</text>
              </g>
              <!-- 0 -->
              <g fill="#333" font-weight="bold">
                <line x1="300" y1="50" x2="300" y2="70" stroke="#333" stroke-width="3"/>
                <text x="300" y="85" text-anchor="middle" font-size="18">0</text>
              </g>
              <!-- 正の数 -->
              <g fill="#27ae60" font-weight="bold">
                <line x1="350" y1="55" x2="350" y2="65" stroke="#27ae60" stroke-width="2"/>
                <text x="350" y="85" text-anchor="middle" font-size="16">+1</text>
                <line x1="400" y1="55" x2="400" y2="65" stroke="#27ae60" stroke-width="2"/>
                <text x="400" y="85" text-anchor="middle" font-size="16">+2</text>
                <line x1="450" y1="55" x2="450" y2="65" stroke="#27ae60" stroke-width="2"/>
                <text x="450" y="85" text-anchor="middle" font-size="16">+3</text>
                <line x1="500" y1="55" x2="500" y2="65" stroke="#27ae60" stroke-width="2"/>
                <text x="500" y="85" text-anchor="middle" font-size="16">+4</text>
              </g>
              <!-- 矢印 -->
              <polygon points="550,60 540,55 540,65" fill="#333"/>
              <polygon points="50,60 60,55 60,65" fill="#333"/>
            </svg>
          </div>
          
          <div class="bg-yellow-50 p-4 rounded-lg mb-4">
            <p class="text-gray-700">
              <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
              <strong>ポイント:</strong><br>
              • 数直線で<strong>左</strong>に行くほど数が<strong>小さく</strong>なる<br>
              • 数直線で<strong>右</strong>に行くほど数が<strong>大きく</strong>なる<br>
              • -3 < -1 < 0 < +1 < +3
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '数直線で、-2と+1のどちらが大きいですか？',
      options: [
        { id: 'A', text: '-2', correct: false, explanation: '数直線で右にある数ほど大きくなります。' },
        { id: 'B', text: '+1', correct: true, explanation: '正解！数直線で右にある<strong>+1の方が大きい</strong>です。' },
        { id: 'C', text: '同じ', correct: false, explanation: '-2と+1は違う数です。' }
      ]
    }
  },

  {
    id: 'integers_3',
    title: 'ステップ3: 符号と絶対値',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-ruler mr-2 text-green-500"></i>
          符号と絶対値
        </h3>
        
        <div class="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg mb-6">
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-green-600 mb-4">符号（ふごう）</h4>
            <p class="text-gray-700 mb-3">
              数の前につける+（プラス）や-（マイナス）を<strong>符号</strong>と言います。
            </p>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-green-50 rounded">
                <div class="font-mono text-xl text-green-600">+5</div>
                <div class="text-sm text-gray-600">符号: +（プラス）</div>
              </div>
              <div class="p-3 bg-red-50 rounded">
                <div class="font-mono text-xl text-red-600">-5</div>
                <div class="text-sm text-gray-600">符号: -（マイナス）</div>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-blue-600 mb-4">絶対値（ぜったいち）</h4>
            <p class="text-gray-700 mb-3">
              数直線で、0からその数までの<strong>距離</strong>を絶対値と言います。<br>
              符号を取った数の大きさです。
            </p>
            <div class="space-y-2">
              <div class="p-3 bg-blue-50 rounded">
                <div class="font-mono text-lg">+5の絶対値 = 5</div>
                <div class="text-sm text-gray-600">0から+5までの距離は5</div>
              </div>
              <div class="p-3 bg-blue-50 rounded">
                <div class="font-mono text-lg">-5の絶対値 = 5</div>
                <div class="text-sm text-gray-600">0から-5までの距離は5</div>
              </div>
            </div>
          </div>
          
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-info-circle text-blue-500 mr-2"></i>
              <strong>まとめ:</strong> +5と-5は、符号は違うけど絶対値は同じ（5）
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '-7の絶対値はいくつですか？',
      options: [
        { id: 'A', text: '-7', correct: false, explanation: '絶対値は符号を取った数の大きさです。' },
        { id: 'B', text: '7', correct: true, explanation: '正解！-7の絶対値は<strong>7</strong>です。' },
        { id: 'C', text: '0', correct: false, explanation: '0の絶対値は0ですが、-7の絶対値は違います。' }
      ]
    }
  },

  {
    id: 'integers_4',
    title: 'ステップ4: 正の数・負の数の加法（たし算）',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-plus mr-2 text-orange-500"></i>
          正の数・負の数のたし算
        </h3>
        
        <div class="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            正の数と負の数のたし算は、<strong>数直線で考える</strong>とわかりやすいです。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">ルール</h4>
            <div class="space-y-3">
              <div class="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div class="font-bold text-green-600 mb-2">同符号の加法</div>
                <div class="text-gray-700">
                  符号が<strong>同じ</strong>ときは、絶対値を足して、共通の符号をつける<br>
                  例: (+3) + (+2) = +5<br>
                  例: (-3) + (-2) = -5
                </div>
              </div>
              
              <div class="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div class="font-bold text-blue-600 mb-2">異符号の加法</div>
                <div class="text-gray-700">
                  符号が<strong>違う</strong>ときは、絶対値の大きい方から小さい方を引いて、<br>
                  絶対値が大きい方の符号をつける<br>
                  例: (+5) + (-3) = +2（5 - 3 = 2、符号は+）<br>
                  例: (-5) + (+3) = -2（5 - 3 = 2、符号は-）
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '(+4) + (-6) の計算結果は？',
      options: [
        { id: 'A', text: '+10', correct: false, explanation: '異符号のたし算は、絶対値の差を求めます。' },
        { id: 'B', text: '-2', correct: true, explanation: '正解！6 - 4 = 2、符号は絶対値が大きい-6の符号なので<strong>-2</strong>です。' },
        { id: 'C', text: '+2', correct: false, explanation: '符号に注意してください。絶対値が大きいのは-6です。' }
      ]
    }
  },

  {
    id: 'integers_5',
    title: 'ステップ5: 減法（ひき算）',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-minus mr-2 text-red-500"></i>
          正の数・負の数のひき算
        </h3>
        
        <div class="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            ひき算は<strong>たし算に直す</strong>ことができます。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-red-600 mb-4 text-xl">減法 → 加法</h4>
            <div class="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg mb-4">
              <div class="text-2xl font-mono text-center mb-3 text-red-700">
                a - b = a + (-b)
              </div>
              <div class="text-center text-gray-700">
                ひく数の符号を変えて、たし算にする
              </div>
            </div>
            
            <div class="space-y-3">
              <div class="p-3 bg-blue-50 rounded">
                <div class="font-bold mb-2">例1: (+5) - (+3)</div>
                <div class="text-gray-700">
                  = (+5) + (-3)<br>
                  = +2
                </div>
              </div>
              
              <div class="p-3 bg-green-50 rounded">
                <div class="font-bold mb-2">例2: (+3) - (-2)</div>
                <div class="text-gray-700">
                  = (+3) + (+2)<br>
                  = +5
                </div>
              </div>
              
              <div class="p-3 bg-purple-50 rounded">
                <div class="font-bold mb-2">例3: (-4) - (+3)</div>
                <div class="text-gray-700">
                  = (-4) + (-3)<br>
                  = -7
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '(-3) - (-5) の計算結果は？',
      options: [
        { id: 'A', text: '-8', correct: false, explanation: 'ひき算をたし算に直してください。' },
        { id: 'B', text: '+2', correct: true, explanation: '正解！(-3) - (-5) = (-3) + (+5) = <strong>+2</strong>です。' },
        { id: 'C', text: '-2', correct: false, explanation: '(-5)の符号を変えると+5になります。' }
      ]
    }
  }
];

// グローバルに登録
window.integersSteps = integersSteps;

console.log('✅ 正の数・負の数モジュールを作成しました');
