// モジュール3: 単位と量
// 同じ単位に揃えて比べる方法を学ぶ

const unitsSteps = [
  {
    id: 'units_1',
    title: 'ステップ1: 単位とは何か',
    description: '量を測るときには「単位」が必要です。単位がないと、どれくらいの大きさか分かりません。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">単位がないと困る例</h4>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-white p-4 rounded-lg border-2 border-red-300">
              <p class="text-gray-800 mb-2">❌ 「りんごを<strong>3</strong>ください」</p>
              <p class="text-sm text-red-600">→ 3個？ 3キロ？ 3箱？</p>
            </div>
            <div class="bg-white p-4 rounded-lg border-2 border-green-300">
              <p class="text-gray-800 mb-2">✅ 「りんごを<strong>3個</strong>ください」</p>
              <p class="text-sm text-green-600">→ はっきり分かる！</p>
            </div>
          </div>
          <p class="text-gray-700 mt-4">
            <strong class="text-blue-600">「個」「キロ」「箱」</strong>のような言葉が<strong>単位</strong>です。
            単位があることで、<strong class="text-blue-600">どれくらいの量</strong>かが分かります。
          </p>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">いろいろな単位</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white p-4 rounded-lg">
              <h5 class="font-bold text-green-800 mb-2">長さの単位</h5>
              <ul class="text-gray-700 space-y-1">
                <li>📏 <strong>cm</strong>（センチメートル）</li>
                <li>📏 <strong>m</strong>（メートル）</li>
                <li>📏 <strong>km</strong>（キロメートル）</li>
              </ul>
            </div>
            <div class="bg-white p-4 rounded-lg">
              <h5 class="font-bold text-green-800 mb-2">重さの単位</h5>
              <ul class="text-gray-700 space-y-1">
                <li>⚖️ <strong>g</strong>（グラム）</li>
                <li>⚖️ <strong>kg</strong>（キログラム）</li>
                <li>⚖️ <strong>t</strong>（トン）</li>
              </ul>
            </div>
            <div class="bg-white p-4 rounded-lg">
              <h5 class="font-bold text-green-800 mb-2">かさ（体積）の単位</h5>
              <ul class="text-gray-700 space-y-1">
                <li>🥤 <strong>mL</strong>（ミリリットル）</li>
                <li>🥤 <strong>L</strong>（リットル）</li>
                <li>🥤 <strong>dL</strong>（デシリットル）</li>
              </ul>
            </div>
            <div class="bg-white p-4 rounded-lg">
              <h5 class="font-bold text-green-800 mb-2">時間の単位</h5>
              <ul class="text-gray-700 space-y-1">
                <li>⏰ <strong>秒</strong></li>
                <li>⏰ <strong>分</strong></li>
                <li>⏰ <strong>時間</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-300">
          <h4 class="text-xl font-bold text-yellow-800 mb-3">
            <i class="fas fa-key mr-2"></i>重要なポイント
          </h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <i class="fas fa-check text-yellow-600 mr-3 mt-1"></i>
              <span>量を表すときは、<strong>数と単位</strong>をセットで使う</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check text-yellow-600 mr-3 mt-1"></i>
              <span>単位がないと、どれくらいの大きさか<strong>分からない</strong></span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check text-yellow-600 mr-3 mt-1"></i>
              <span>測るもの（長さ、重さ、かさ）によって、<strong>使う単位が違う</strong></span>
            </li>
          </ul>
        </div>
      </div>
    `,
    quiz: {
      question: 'エチオピアの市場で水を買います。「2」と言っただけでは通じません。何が足りませんか？',
      options: [
        { id: 'A', text: 'お金', correct: false, explanation: 'お金も必要ですが、ここでは量の話をしています。' },
        { id: 'B', text: '単位（2リットル、2本など）', correct: true, explanation: '正解！<strong>単位</strong>がないと、どれくらいの量か分かりません。' },
        { id: 'C', text: '水の種類', correct: false, explanation: 'ここでは量を表す方法について考えています。' }
      ]
    }
  },

  {
    id: 'units_2',
    title: 'ステップ2: 単位の換算（同じ量を違う単位で表す）',
    description: '同じ量でも、違う単位で表すことができます。1m = 100cm のように、単位を変えることを「換算」と言います。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">長さの換算</h4>
          <div class="bg-white p-6 rounded-lg mb-4">
            <div class="text-center mb-4">
              <p class="text-2xl font-bold text-gray-800 mb-2">1メートル（1m）</p>
              <div class="bg-blue-100 p-4 rounded-lg mb-2">
                <p class="text-6xl">📏</p>
              </div>
              <p class="text-3xl font-bold text-blue-600">||</p>
              <p class="text-lg text-gray-600 mb-2">同じ長さ</p>
              <p class="text-2xl font-bold text-gray-800">100センチメートル（100cm）</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <p class="text-center text-xl font-bold text-green-800">1m = 100cm</p>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg">
            <h5 class="font-bold text-blue-800 mb-3">他の例</h5>
            <div class="space-y-2 text-lg">
              <div class="flex justify-between items-center bg-blue-50 p-3 rounded">
                <span>1km</span>
                <span>=</span>
                <span class="font-bold text-blue-600">1000m</span>
              </div>
              <div class="flex justify-between items-center bg-blue-50 p-3 rounded">
                <span>2m</span>
                <span>=</span>
                <span class="font-bold text-blue-600">200cm</span>
              </div>
              <div class="flex justify-between items-center bg-blue-50 p-3 rounded">
                <span>3km</span>
                <span>=</span>
                <span class="font-bold text-blue-600">3000m</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">重さの換算</h4>
          <div class="bg-white p-6 rounded-lg">
            <div class="text-center mb-4">
              <p class="text-2xl font-bold text-gray-800 mb-2">1キログラム（1kg）</p>
              <p class="text-3xl font-bold text-green-600">||</p>
              <p class="text-2xl font-bold text-gray-800">1000グラム（1000g）</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <p class="text-center text-xl font-bold text-green-800">1kg = 1000g</p>
            </div>
          </div>
        </div>

        <div class="bg-purple-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-purple-800 mb-4">アフリカの例: ケニアのマラソン</h4>
          <p class="text-gray-700 mb-4">
            ケニアは長距離走が強い国です。マラソンは<strong>42.195km</strong>の距離を走ります。
          </p>
          <div class="bg-white p-4 rounded-lg">
            <p class="text-xl font-bold text-center mb-3">42.195km を m（メートル）で表すと？</p>
            <div class="bg-purple-100 p-4 rounded-lg">
              <p class="text-lg mb-2">1km = 1000m なので、</p>
              <p class="text-2xl font-bold text-purple-600 text-center">
                42.195km = 42,195m
              </p>
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-300">
          <h4 class="text-xl font-bold text-yellow-800 mb-3">
            <i class="fas fa-lightbulb mr-2"></i>換算のコツ
          </h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <i class="fas fa-arrow-right text-yellow-600 mr-3 mt-1"></i>
              <span><strong>大きい単位→小さい単位</strong>: 数が<strong>増える</strong>（×100, ×1000）</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-arrow-right text-yellow-600 mr-3 mt-1"></i>
              <span><strong>小さい単位→大きい単位</strong>: 数が<strong>減る</strong>（÷100, ÷1000）</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-arrow-right text-yellow-600 mr-3 mt-1"></i>
              <span>1m = 100cm, 1km = 1000m, 1kg = 1000g を<strong>覚える</strong></span>
            </li>
          </ul>
        </div>
      </div>
    `,
    quiz: {
      question: 'タンザニアのキリマンジャロ山の高さは5895mです。これを km で表すと？',
      options: [
        { id: 'A', text: '58.95km', correct: false, explanation: '1000で割りましたが、小数点の位置が違います。' },
        { id: 'B', text: '5.895km', correct: true, explanation: '正解！5895m ÷ 1000 = <strong>5.895km</strong> です。' },
        { id: 'C', text: '589.5km', correct: false, explanation: '計算が違います。mからkmに変えるときは1000で割ります。' }
      ]
    }
  },

  {
    id: 'units_3',
    title: 'ステップ3: 単位を揃えて比べる',
    description: '違う単位のままでは、大きさを比べることができません。同じ単位に揃えることが大切です。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">単位を揃えないと比べられない</h4>
          <div class="bg-white p-6 rounded-lg mb-4">
            <p class="text-gray-800 mb-4 text-lg">問題: どちらが長い？</p>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="bg-red-50 p-4 rounded-lg text-center border-2 border-red-300">
                <p class="text-3xl font-bold text-red-600">3m</p>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg text-center border-2 border-blue-300">
                <p class="text-3xl font-bold text-blue-600">250cm</p>
              </div>
            </div>
            <p class="text-gray-600 mb-3">❌ このままでは比べにくい...</p>
            
            <div class="bg-green-100 p-4 rounded-lg">
              <p class="font-bold text-green-800 mb-3">✅ 同じ単位に揃える！</p>
              <div class="space-y-2">
                <p class="text-lg">方法1: 両方を <strong>cm</strong> に揃える</p>
                <div class="bg-white p-3 rounded flex justify-between items-center">
                  <span>3m = 300cm</span>
                  <span class="font-bold text-green-600">300cm > 250cm</span>
                </div>
                
                <p class="text-lg mt-3">方法2: 両方を <strong>m</strong> に揃える</p>
                <div class="bg-white p-3 rounded flex justify-between items-center">
                  <span>250cm = 2.5m</span>
                  <span class="font-bold text-green-600">3m > 2.5m</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">アフリカの例: ナイル川とコンゴ川</h4>
          <p class="text-gray-700 mb-4">
            アフリカには長い川があります。どちらが長いでしょうか？
          </p>
          <div class="bg-white p-6 rounded-lg">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="text-center p-4 bg-blue-50 rounded-lg">
                <p class="text-xl font-bold text-blue-800 mb-2">ナイル川</p>
                <p class="text-3xl font-bold text-blue-600">6650km</p>
              </div>
              <div class="text-center p-4 bg-green-50 rounded-lg">
                <p class="text-xl font-bold text-green-800 mb-2">コンゴ川</p>
                <p class="text-3xl font-bold text-green-600">4700000m</p>
              </div>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <p class="font-bold text-gray-800 mb-2">単位を揃えて比較しよう</p>
              <p class="text-lg mb-2">コンゴ川を km に換算: 4,700,000m ÷ 1000 = 4700km</p>
              <div class="bg-white p-3 rounded-lg mt-3">
                <p class="text-2xl font-bold text-center text-blue-600">
                  6650km > 4700km
                </p>
                <p class="text-center text-gray-700 mt-2">→ ナイル川の方が長い</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-purple-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-purple-800 mb-4">比較の手順</h4>
          <ol class="space-y-3 text-gray-700">
            <li class="flex items-start">
              <span class="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">1</span>
              <span><strong>単位を確認</strong>する（cm？ m？ km？）</span>
            </li>
            <li class="flex items-start">
              <span class="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">2</span>
              <span>違う単位なら、<strong>同じ単位に揃える</strong></span>
            </li>
            <li class="flex items-start">
              <span class="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">3</span>
              <span>数の大きさを<strong>比べる</strong></span>
            </li>
          </ol>
        </div>
      </div>
    `,
    quiz: {
      question: 'エチオピアの農家が収穫しました。トウモロコシ3kg とジャガイモ2500g、どちらが重いですか？',
      options: [
        { id: 'A', text: 'トウモロコシ（3kg）', correct: true, explanation: '正解！3kg = 3000g なので、<strong>3000g > 2500g</strong> です。' },
        { id: 'B', text: 'ジャガイモ（2500g）', correct: false, explanation: '2500gは2.5kgなので、3kgより軽いです。' },
        { id: 'C', text: '同じ', correct: false, explanation: '単位を揃えると、3000gと2500gで異なります。' }
      ]
    }
  },

  {
    id: 'units_4',
    title: 'ステップ4: 単位の計算（足し算・引き算）',
    description: '単位が同じなら、そのまま計算できます。違う単位のときは、揃えてから計算します。',
    content: `
      <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-blue-800 mb-4">同じ単位の計算</h4>
          <div class="bg-white p-6 rounded-lg mb-4">
            <p class="text-gray-800 mb-3">単位が同じなら、そのまま足したり引いたりできます。</p>
            <div class="space-y-3">
              <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-xl font-bold text-blue-800 mb-2">例1: 長さの足し算</p>
                <p class="text-2xl text-center">3m + 5m = <span class="font-bold text-blue-600">8m</span></p>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <p class="text-xl font-bold text-green-800 mb-2">例2: 重さの引き算</p>
                <p class="text-2xl text-center">10kg - 3kg = <span class="font-bold text-green-600">7kg</span></p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-green-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-green-800 mb-4">違う単位の計算</h4>
          <div class="bg-white p-6 rounded-lg">
            <p class="text-gray-800 mb-3">単位が違うときは、<strong class="text-green-600">まず揃えてから</strong>計算します。</p>
            
            <div class="bg-yellow-50 p-4 rounded-lg mb-4">
              <p class="text-xl font-bold text-yellow-800 mb-2">例: 2m + 50cm = ?</p>
              <div class="space-y-2 mt-3">
                <div class="bg-white p-3 rounded">
                  <p class="text-gray-700">ステップ1: 単位を揃える</p>
                  <p class="text-lg">2m = 200cm</p>
                </div>
                <div class="bg-white p-3 rounded">
                  <p class="text-gray-700">ステップ2: 計算する</p>
                  <p class="text-lg">200cm + 50cm = <strong class="text-green-600">250cm</strong></p>
                </div>
                <div class="bg-white p-3 rounded">
                  <p class="text-gray-700">ステップ3: 必要なら元の単位に戻す</p>
                  <p class="text-lg">250cm = <strong class="text-green-600">2.5m</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-purple-50 p-6 rounded-lg">
          <h4 class="text-xl font-bold text-purple-800 mb-4">アフリカの例: ウガンダの水汲み</h4>
          <p class="text-gray-700 mb-4">
            ウガンダの村で、朝に3L、夕方に2500mLの水を汲みました。合計で何リットルですか？
          </p>
          <div class="bg-white p-6 rounded-lg">
            <div class="space-y-3">
              <div class="bg-purple-100 p-4 rounded-lg">
                <p class="font-bold text-purple-800 mb-2">ステップ1: 単位を揃える</p>
                <p class="text-lg">2500mL = 2.5L</p>
                <p class="text-sm text-gray-600">（1L = 1000mL なので、2500 ÷ 1000 = 2.5）</p>
              </div>
              <div class="bg-purple-100 p-4 rounded-lg">
                <p class="font-bold text-purple-800 mb-2">ステップ2: 足し算</p>
                <p class="text-2xl font-bold text-center text-purple-600">
                  3L + 2.5L = 5.5L
                </p>
              </div>
              <div class="bg-green-100 p-4 rounded-lg">
                <p class="font-bold text-green-800 text-center">答え: 合計 5.5L の水を汲みました</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-300">
          <h4 class="text-xl font-bold text-yellow-800 mb-3">
            <i class="fas fa-exclamation-triangle mr-2"></i>注意点
          </h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <i class="fas fa-times text-red-600 mr-3 mt-1"></i>
              <span>違う単位のまま計算しない（3m + 50cm = 53 は<strong>間違い</strong>！）</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check text-green-600 mr-3 mt-1"></i>
              <span>必ず<strong>単位を揃えてから</strong>計算する</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check text-green-600 mr-3 mt-1"></i>
              <span>答えにも<strong>単位を忘れずに</strong>書く</span>
            </li>
          </ul>
        </div>
      </div>
    `,
    quiz: {
      question: 'ケニアの道路を歩いています。まず1.5km歩き、次に800m歩きました。合計で何km歩きましたか？',
      options: [
        { id: 'A', text: '2.3km', correct: true, explanation: '正解！800m = 0.8km なので、<strong>1.5km + 0.8km = 2.3km</strong> です。' },
        { id: 'B', text: '1.58km', correct: false, explanation: '単位を揃えずに計算してしまいました。800mは0.8kmです。' },
        { id: 'C', text: '9.5km', correct: false, explanation: '計算が違います。800m = 0.8kmに換算してから足します。' }
      ]
    }
  },

  // ========================================
  // ステップ5: いろいろな単位（長さ・重さ・時間）
  // ========================================
  {
    id: 'units_5',
    title: 'ステップ5: いろいろな単位',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-ruler-combined mr-2 text-purple-500"></i>
          測るものによって単位が変わる
        </h3>
        
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            測るものによって、使う<strong>単位</strong>が違います。<br>
            代表的な単位を見てみましょう。
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <!-- 長さ -->
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <h4 class="font-bold text-blue-600 mb-3">
                <i class="fas fa-ruler mr-2"></i>
                長さ
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>1 km</span>
                  <span class="text-gray-600">= 1000 m</span>
                </div>
                <div class="flex justify-between">
                  <span>1 m</span>
                  <span class="text-gray-600">= 100 cm</span>
                </div>
                <div class="flex justify-between">
                  <span>1 cm</span>
                  <span class="text-gray-600">= 10 mm</span>
                </div>
              </div>
            </div>
            
            <!-- 重さ -->
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <h4 class="font-bold text-green-600 mb-3">
                <i class="fas fa-weight mr-2"></i>
                重さ
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>1 t</span>
                  <span class="text-gray-600">= 1000 kg</span>
                </div>
                <div class="flex justify-between">
                  <span>1 kg</span>
                  <span class="text-gray-600">= 1000 g</span>
                </div>
                <div class="flex justify-between">
                  <span>1 g</span>
                  <span class="text-gray-600">= 1000 mg</span>
                </div>
              </div>
            </div>
            
            <!-- 時間 -->
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <h4 class="font-bold text-orange-600 mb-3">
                <i class="fas fa-clock mr-2"></i>
                時間
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>1時間</span>
                  <span class="text-gray-600">= 60分</span>
                </div>
                <div class="flex justify-between">
                  <span>1分</span>
                  <span class="text-gray-600">= 60秒</span>
                </div>
                <div class="flex justify-between">
                  <span>1日</span>
                  <span class="text-gray-600">= 24時間</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '1メートルは何センチメートルですか？',
      options: [
        { id: 'A', text: '10 cm', correct: false, explanation: '10 cmは1メートルより小さいです。' },
        { id: 'B', text: '100 cm', correct: true, explanation: '正解！1 m = <strong>100 cm</strong>です。' },
        { id: 'C', text: '1000 cm', correct: false, explanation: '1000 cmは10メートルです。' }
      ]
    }
  },

  // ========================================
  // ステップ6: 単位の接頭語（キロ、ミリなど）
  // ========================================
  {
    id: 'units_6',
    title: 'ステップ6: 単位の接頭語',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-text-height mr-2 text-indigo-500"></i>
          キロ、ミリって何？
        </h3>
        
        <div class="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            「キロ」や「ミリ」は、単位の前につけて<strong>大きさを変える</strong>言葉です。<br>
            これを<strong>接頭語</strong>と言います。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">よく使う接頭語</h4>
            <div class="space-y-3">
              <div class="flex items-center gap-4 p-3 bg-red-50 rounded">
                <div class="text-3xl">📏</div>
                <div>
                  <div class="font-bold text-red-600">キロ (k)</div>
                  <div class="text-sm text-gray-600">1000倍の大きさ</div>
                  <div class="text-sm">例: 1 km = 1000 m</div>
                </div>
              </div>
              
              <div class="flex items-center gap-4 p-3 bg-yellow-50 rounded">
                <div class="text-3xl">📐</div>
                <div>
                  <div class="font-bold text-yellow-600">センチ (c)</div>
                  <div class="text-sm text-gray-600">100分の1の大きさ</div>
                  <div class="text-sm">例: 1 cm = 0.01 m</div>
                </div>
              </div>
              
              <div class="flex items-center gap-4 p-3 bg-green-50 rounded">
                <div class="text-3xl">🔬</div>
                <div>
                  <div class="font-bold text-green-600">ミリ (m)</div>
                  <div class="text-sm text-gray-600">1000分の1の大きさ</div>
                  <div class="text-sm">例: 1 mm = 0.001 m</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
              接頭語を覚えると、いろいろな単位がわかりやすくなります！
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: '「キロ」は何倍を表しますか？',
      options: [
        { id: 'A', text: '10倍', correct: false, explanation: '10倍は「デカ」です。' },
        { id: 'B', text: '100倍', correct: false, explanation: '100倍は「ヘクト」です。' },
        { id: 'C', text: '1000倍', correct: true, explanation: '正解！「キロ」は<strong>1000倍</strong>を表します。' }
      ]
    }
  },

  // ========================================
  // ステップ7: 単位換算の練習（長さ）
  // ========================================
  {
    id: 'units_7',
    title: 'ステップ7: 長さの単位換算',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-exchange-alt mr-2 text-teal-500"></i>
          長さの単位を変えてみよう
        </h3>
        
        <div class="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            長さの単位を<strong>変換</strong>する練習をしましょう。<br>
            大きい単位から小さい単位に変えるときは<strong>かけ算</strong>します。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">換算の例</h4>
            
            <div class="space-y-4">
              <!-- 例1 -->
              <div class="p-4 bg-teal-50 rounded">
                <div class="text-lg mb-2">
                  <strong>例1:</strong> 3 m を cm に変換
                </div>
                <div class="text-gray-700 mb-2">
                  1 m = 100 cm なので...
                </div>
                <div class="text-xl font-bold text-teal-600">
                  3 m = 3 × 100 = <span class="text-2xl">300 cm</span>
                </div>
              </div>
              
              <!-- 例2 -->
              <div class="p-4 bg-blue-50 rounded">
                <div class="text-lg mb-2">
                  <strong>例2:</strong> 2.5 km を m に変換
                </div>
                <div class="text-gray-700 mb-2">
                  1 km = 1000 m なので...
                </div>
                <div class="text-xl font-bold text-blue-600">
                  2.5 km = 2.5 × 1000 = <span class="text-2xl">2500 m</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-star text-yellow-500 mr-2"></i>
              <strong>コツ:</strong> 大きい単位→小さい単位は<strong>数が大きく</strong>なります
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'ナイルケニアでナイル川の長さを測りました。6 km は何 m ですか？',
      options: [
        { id: 'A', text: '60 m', correct: false, explanation: '1 km = 1000 m です。もう一度計算してみましょう。' },
        { id: 'B', text: '600 m', correct: false, explanation: '6 × 1000 を計算してください。' },
        { id: 'C', text: '6000 m', correct: true, explanation: '正解！6 km = 6 × 1000 = <strong>6000 m</strong>です。' }
      ]
    }
  },

  // ========================================
  // ステップ8: 単位換算の練習（重さ）
  // ========================================
  {
    id: 'units_8',
    title: 'ステップ8: 重さの単位換算',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-balance-scale mr-2 text-pink-500"></i>
          重さの単位を変えてみよう
        </h3>
        
        <div class="bg-gradient-to-r from-pink-50 to-red-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            重さの単位も、長さと同じように<strong>変換</strong>できます。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">重さの換算</h4>
            
            <div class="space-y-4">
              <!-- kg → g -->
              <div class="p-4 bg-pink-50 rounded">
                <div class="text-lg mb-2">
                  <strong>kg を g に</strong>
                </div>
                <div class="text-gray-700 mb-2">
                  1 kg = 1000 g
                </div>
                <div class="text-xl font-bold text-pink-600">
                  4 kg = 4 × 1000 = <span class="text-2xl">4000 g</span>
                </div>
              </div>
              
              <!-- t → kg -->
              <div class="p-4 bg-orange-50 rounded">
                <div class="text-lg mb-2">
                  <strong>t を kg に</strong>
                </div>
                <div class="text-gray-700 mb-2">
                  1 t (トン) = 1000 kg
                </div>
                <div class="text-xl font-bold text-orange-600">
                  2 t = 2 × 1000 = <span class="text-2xl">2000 kg</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-green-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-globe-africa text-green-600 mr-2"></i>
              <strong>例:</strong> ガーナのカカオ豆1袋が2.5 kgなら、2500 gです。
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'エジプトの市場でスイカを買いました。3 kg は何 g ですか？',
      options: [
        { id: 'A', text: '30 g', correct: false, explanation: '1 kg = 1000 g です。' },
        { id: 'B', text: '300 g', correct: false, explanation: '3 × 1000 を計算してください。' },
        { id: 'C', text: '3000 g', correct: true, explanation: '正解！3 kg = 3 × 1000 = <strong>3000 g</strong>です。' }
      ]
    }
  },

  // ========================================
  // ステップ9: 逆変換（小→大）
  // ========================================
  {
    id: 'units_9',
    title: 'ステップ9: 小さい単位から大きい単位へ',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-compress-arrows-alt mr-2 text-purple-500"></i>
          小さい単位を大きい単位にする
        </h3>
        
        <div class="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            今度は<strong>逆</strong>に変換してみましょう。<br>
            小さい単位から大きい単位に変えるときは<strong>わり算</strong>します。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">逆変換の例</h4>
            
            <div class="space-y-4">
              <!-- cm → m -->
              <div class="p-4 bg-purple-50 rounded">
                <div class="text-lg mb-2">
                  <strong>例1:</strong> 500 cm を m に変換
                </div>
                <div class="text-gray-700 mb-2">
                  100 cm = 1 m なので、100でわる
                </div>
                <div class="text-xl font-bold text-purple-600">
                  500 cm ÷ 100 = <span class="text-2xl">5 m</span>
                </div>
              </div>
              
              <!-- g → kg -->
              <div class="p-4 bg-indigo-50 rounded">
                <div class="text-lg mb-2">
                  <strong>例2:</strong> 4000 g を kg に変換
                </div>
                <div class="text-gray-700 mb-2">
                  1000 g = 1 kg なので、1000でわる
                </div>
                <div class="text-xl font-bold text-indigo-600">
                  4000 g ÷ 1000 = <span class="text-2xl">4 kg</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-info-circle text-blue-500 mr-2"></i>
              小さい単位→大きい単位は<strong>数が小さく</strong>なります
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'マダガスカルで測った距離が2000 mでした。何 km ですか？',
      options: [
        { id: 'A', text: '20 km', correct: false, explanation: '2000 ÷ 1000 を計算してください。' },
        { id: 'B', text: '2 km', correct: true, explanation: '正解！2000 m ÷ 1000 = <strong>2 km</strong>です。' },
        { id: 'C', text: '0.2 km', correct: false, explanation: '2000 ÷ 1000 = 2 です。' }
      ]
    }
  },

  // ========================================
  // ステップ10: 単位と量の総合練習
  // ========================================
  {
    id: 'units_10',
    title: 'ステップ10: 総合練習',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-award mr-2 text-yellow-500"></i>
          単位換算をマスターしよう
        </h3>
        
        <div class="bg-gradient-to-r from-yellow-50 to-green-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            これまで学んだ<strong>単位換算</strong>を使って、総合問題に挑戦しましょう。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-3">復習：単位換算のポイント</h4>
            <div class="space-y-2 text-gray-700">
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                単位が違うと<strong>比べられない</strong>
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                大→小は<strong>かけ算</strong>（数が大きくなる）
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                小→大は<strong>わり算</strong>（数が小さくなる）
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                接頭語を覚えると<strong>便利</strong>
              </p>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h5 class="font-bold text-blue-600 mb-2">大→小</h5>
              <div class="text-sm space-y-1">
                <div>5 km = 5000 m</div>
                <div>3 kg = 3000 g</div>
              </div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <h5 class="font-bold text-green-600 mb-2">小→大</h5>
              <div class="text-sm space-y-1">
                <div>800 cm = 8 m</div>
                <div>6000 g = 6 kg</div>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-trophy text-yellow-500 mr-2"></i>
              単位をそろえれば、どんな問題も解けます！
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'セネガルの学校まで1.2 km、市場まで800 m。どちらが遠いですか？',
      options: [
        { id: 'A', text: '市場', correct: false, explanation: '1.2 km = 1200 m なので、学校の方が遠いです。' },
        { id: 'B', text: '学校', correct: true, explanation: '正解！1.2 km = 1200 m なので、<strong>学校</strong>の方が遠いです（1200 m > 800 m）。' },
        { id: 'C', text: '同じ', correct: false, explanation: '単位をそろえて比べてみましょう。' }
      ]
    }
  }
];

// グローバルに登録
window.unitsSteps = unitsSteps;

console.log('✅ 単位と量モジュールを10ステップに拡張しました');
