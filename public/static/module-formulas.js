// ========================================
// 公式集モジュール - 全モジュールで学んだ公式をまとめる
// ========================================

const formulasSteps = [
  {
    id: 'formulas_1',
    title: 'ステップ1: 数と量の公式',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-square-root-alt mr-2 text-blue-500"></i>
          数と量に関する公式
        </h3>
        
        <div class="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg mb-6">
          <div class="bg-white p-6 rounded-lg shadow-lg mb-4">
            <h4 class="font-bold text-blue-600 mb-4 text-xl">基数性（数の性質）</h4>
            <div class="space-y-3">
              <div class="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div class="font-mono text-lg mb-2">数の大小比較</div>
                <div class="text-gray-700">
                  • a > b ⇔ a - b > 0<br>
                  • a < b ⇔ a - b < 0<br>
                  • a = b ⇔ a - b = 0
                </div>
              </div>
              
              <div class="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div class="font-mono text-lg mb-2">位の値</div>
                <div class="text-gray-700">
                  • 千の位 = 1000の位<br>
                  • 百の位 = 100の位<br>
                  • 十の位 = 10の位<br>
                  • 一の位 = 1の位
                </div>
              </div>
              
              <div class="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <div class="font-mono text-lg mb-2">10のまとまり</div>
                <div class="text-gray-700">
                  • 10 × n = n0（10の倍数）<br>
                  • 100 = 10 × 10<br>
                  • 1000 = 10 × 10 × 10
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '234という数で、十の位の値はいくつですか？',
      options: [
        { id: 'A', text: '3', correct: false, explanation: '3は数字ですが、十の位の「値」は30です。' },
        { id: 'B', text: '30', correct: true, explanation: '正解！十の位の3は、<strong>30</strong>という値を表します。' },
        { id: 'C', text: '10', correct: false, explanation: '10は十の位の単位です。' }
      ]
    }
  },

  {
    id: 'formulas_2',
    title: 'ステップ2: 単位換算の公式',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-exchange-alt mr-2 text-green-500"></i>
          単位換算の公式
        </h3>
        
        <div class="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg mb-6">
          <div class="bg-white p-6 rounded-lg shadow-lg mb-4">
            <h4 class="font-bold text-green-600 mb-4 text-xl">長さの単位</h4>
            <div class="space-y-3">
              <div class="p-4 bg-green-50 rounded-lg">
                <div class="font-mono text-xl mb-2 text-green-700">
                  <strong>1 km = 1000 m</strong>
                </div>
                <div class="font-mono text-xl mb-2 text-green-700">
                  <strong>1 m = 100 cm</strong>
                </div>
                <div class="font-mono text-xl text-green-700">
                  <strong>1 cm = 10 mm</strong>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg mb-4">
            <h4 class="font-bold text-orange-600 mb-4 text-xl">重さの単位</h4>
            <div class="space-y-3">
              <div class="p-4 bg-orange-50 rounded-lg">
                <div class="font-mono text-xl mb-2 text-orange-700">
                  <strong>1 t = 1000 kg</strong>
                </div>
                <div class="font-mono text-xl text-orange-700">
                  <strong>1 kg = 1000 g</strong>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg mb-4">
            <h4 class="font-bold text-purple-600 mb-4 text-xl">換算の計算式</h4>
            <div class="space-y-3">
              <div class="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <div class="font-mono text-lg mb-2">大きい単位 → 小さい単位</div>
                <div class="text-gray-700 text-lg">
                  • かけ算を使う<br>
                  • 例: 3 km → 3 × 1000 = 3000 m
                </div>
              </div>
              
              <div class="p-4 bg-pink-50 rounded-lg border-l-4 border-pink-500">
                <div class="font-mono text-lg mb-2">小さい単位 → 大きい単位</div>
                <div class="text-gray-700 text-lg">
                  • わり算を使う<br>
                  • 例: 5000 m → 5000 ÷ 1000 = 5 km
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '2.5 km は何 m ですか？',
      options: [
        { id: 'A', text: '250 m', correct: false, explanation: '1 km = 1000 m です。' },
        { id: 'B', text: '2500 m', correct: true, explanation: '正解！2.5 × 1000 = <strong>2500 m</strong>です。' },
        { id: 'C', text: '25000 m', correct: false, explanation: '2.5 × 1000 を計算してください。' }
      ]
    }
  },

  {
    id: 'formulas_3',
    title: 'ステップ3: 割合とパーセントの公式',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-percent mr-2 text-pink-500"></i>
          割合とパーセントの公式
        </h3>
        
        <div class="bg-gradient-to-r from-pink-50 to-red-50 p-6 rounded-lg mb-6">
          <div class="bg-white p-6 rounded-lg shadow-lg mb-4">
            <h4 class="font-bold text-pink-600 mb-4 text-xl">基本公式</h4>
            <div class="space-y-3">
              <div class="p-4 bg-pink-50 rounded-lg border-l-4 border-pink-500">
                <div class="font-mono text-2xl mb-3 text-pink-700">
                  <strong>割合 = 部分 ÷ 全体</strong>
                </div>
                <div class="text-gray-700 text-lg">
                  例: 50人中10人 → 10 ÷ 50 = 0.2 = 20%
                </div>
              </div>
              
              <div class="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                <div class="font-mono text-2xl mb-3 text-red-700">
                  <strong>部分 = 全体 × 割合</strong>
                </div>
                <div class="text-gray-700 text-lg">
                  例: 200円の30% → 200 × 0.3 = 60円
                </div>
              </div>
              
              <div class="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <div class="font-mono text-2xl mb-3 text-orange-700">
                  <strong>全体 = 部分 ÷ 割合</strong>
                </div>
                <div class="text-gray-700 text-lg">
                  例: 30が20%なら → 30 ÷ 0.2 = 150
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg mb-4">
            <h4 class="font-bold text-purple-600 mb-4 text-xl">換算公式</h4>
            <div class="space-y-3">
              <div class="p-4 bg-purple-50 rounded-lg">
                <div class="font-mono text-xl mb-2">小数 ↔ パーセント</div>
                <div class="text-gray-700 text-lg">
                  • 小数 × 100 = パーセント<br>
                  • パーセント ÷ 100 = 小数<br>
                  • 例: 0.75 = 75%、25% = 0.25
                </div>
              </div>
              
              <div class="p-4 bg-indigo-50 rounded-lg">
                <div class="font-mono text-xl mb-2">割 ↔ パーセント</div>
                <div class="text-gray-700 text-lg">
                  • 1割 = 10%<br>
                  • 3割 = 30%<br>
                  • 5割 = 50%（半分）
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <h4 class="font-bold text-blue-600 mb-4 text-xl">増減の公式</h4>
            <div class="space-y-3">
              <div class="p-4 bg-blue-50 rounded-lg">
                <div class="font-mono text-xl mb-2 text-blue-700">
                  <strong>増加後 = 元の値 × (1 + 増加率)</strong>
                </div>
                <div class="text-gray-700 text-lg">
                  例: 100円の20%増し → 100 × 1.2 = 120円
                </div>
              </div>
              
              <div class="p-4 bg-teal-50 rounded-lg">
                <div class="font-mono text-xl mb-2 text-teal-700">
                  <strong>減少後 = 元の値 × (1 - 減少率)</strong>
                </div>
                <div class="text-gray-700 text-lg">
                  例: 100円の30%引き → 100 × 0.7 = 70円
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '80の25%はいくつですか？',
      options: [
        { id: 'A', text: '15', correct: false, explanation: '80 × 0.25 を計算してください。' },
        { id: 'B', text: '20', correct: true, explanation: '正解！80 × 0.25 = <strong>20</strong>です。' },
        { id: 'C', text: '25', correct: false, explanation: '25は%の数字です。80 × 0.25 を計算します。' }
      ]
    }
  },

  {
    id: 'formulas_4',
    title: 'ステップ4: がい数（概数）の公式',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-approximately-equal mr-2 text-yellow-500"></i>
          がい数（概数）の公式
        </h3>
        
        <div class="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg mb-6">
          <div class="bg-white p-6 rounded-lg shadow-lg mb-4">
            <h4 class="font-bold text-yellow-600 mb-4 text-xl">四捨五入のルール</h4>
            <div class="space-y-3">
              <div class="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <div class="font-mono text-2xl mb-3 text-yellow-700">
                  <strong>5以上 → 切り上げ</strong>
                </div>
                <div class="text-gray-700 text-lg">
                  例: 47 → 50（一の位7を切り上げ）
                </div>
              </div>
              
              <div class="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <div class="font-mono text-2xl mb-3 text-orange-700">
                  <strong>5未満 → 切り捨て</strong>
                </div>
                <div class="text-gray-700 text-lg">
                  例: 43 → 40（一の位3を切り捨て）
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <h4 class="font-bold text-red-600 mb-4 text-xl">がい数の種類</h4>
            <div class="space-y-3">
              <div class="p-4 bg-red-50 rounded-lg">
                <div class="font-mono text-lg mb-2">十の位まで</div>
                <div class="text-gray-700">
                  • 一の位を四捨五入<br>
                  • 例: 68 → 70
                </div>
              </div>
              
              <div class="p-4 bg-pink-50 rounded-lg">
                <div class="font-mono text-lg mb-2">百の位まで</div>
                <div class="text-gray-700">
                  • 十の位を四捨五入<br>
                  • 例: 347 → 300、582 → 600
                </div>
              </div>
              
              <div class="p-4 bg-purple-50 rounded-lg">
                <div class="font-mono text-lg mb-2">上から○桁</div>
                <div class="text-gray-700">
                  • 上から数えて○桁目まで残す<br>
                  • 例: 3456を上から2桁 → 3500
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '582を百の位までのがい数にすると？',
      options: [
        { id: 'A', text: '500', correct: false, explanation: '十の位の8を見てください。' },
        { id: 'B', text: '580', correct: false, explanation: 'これは十の位までのがい数です。' },
        { id: 'C', text: '600', correct: true, explanation: '正解！十の位の8は5以上なので、<strong>600</strong>に切り上げます。' }
      ]
    }
  },

  {
    id: 'formulas_5',
    title: 'ステップ5: 総合公式集',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-book mr-2 text-indigo-500"></i>
          重要公式まとめ
        </h3>
        
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-6">
          <div class="bg-white p-6 rounded-lg shadow-lg mb-4">
            <h4 class="font-bold text-indigo-600 mb-4 text-xl">
              <i class="fas fa-star text-yellow-500 mr-2"></i>
              必ず覚える公式
            </h4>
            
            <div class="space-y-4">
              <div class="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-300">
                <div class="text-lg font-bold text-blue-700 mb-2">1. 割合の三公式</div>
                <div class="font-mono text-lg space-y-1">
                  <div>• 割合 = 部分 ÷ 全体</div>
                  <div>• 部分 = 全体 × 割合</div>
                  <div>• 全体 = 部分 ÷ 割合</div>
                </div>
              </div>
              
              <div class="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border-2 border-green-300">
                <div class="text-lg font-bold text-green-700 mb-2">2. 単位換算</div>
                <div class="font-mono text-lg space-y-1">
                  <div>• 大→小: かけ算（数が大きくなる）</div>
                  <div>• 小→大: わり算（数が小さくなる）</div>
                </div>
              </div>
              
              <div class="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-300">
                <div class="text-lg font-bold text-yellow-700 mb-2">3. 四捨五入</div>
                <div class="font-mono text-lg space-y-1">
                  <div>• 5以上 → 切り上げ</div>
                  <div>• 5未満 → 切り捨て</div>
                </div>
              </div>
              
              <div class="p-4 bg-gradient-to-r from-pink-50 to-red-50 rounded-lg border-2 border-pink-300">
                <div class="text-lg font-bold text-pink-700 mb-2">4. パーセント換算</div>
                <div class="font-mono text-lg space-y-1">
                  <div>• 小数 × 100 = %</div>
                  <div>• % ÷ 100 = 小数</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg shadow-lg">
            <h4 class="font-bold text-green-700 mb-4 text-xl">
              <i class="fas fa-trophy text-yellow-500 mr-2"></i>
              公式を使うコツ
            </h4>
            <div class="space-y-2 text-gray-700 text-lg">
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                何を求めるのかをはっきりさせる
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                単位をそろえてから計算する
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                答えが常識的な範囲か確認する
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                公式は何度も使って覚える
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '「40人のうち8人」の割合は何%ですか？',
      options: [
        { id: 'A', text: '8%', correct: false, explanation: '8 ÷ 40 を計算してください。' },
        { id: 'B', text: '20%', correct: true, explanation: '正解！8 ÷ 40 = 0.2 = <strong>20%</strong>です。割合 = 部分 ÷ 全体 の公式を使いました。' },
        { id: 'C', text: '40%', correct: false, explanation: '40は全体の人数です。' }
      ]
    }
  }
];

// グローバルに登録
window.formulasSteps = formulasSteps;

console.log('✅ 公式集モジュールを作成しました');
