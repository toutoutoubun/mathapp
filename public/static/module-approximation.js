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
  },

  // ========================================
  // ステップ3: がい数の作り方（十の位まで）
  // ========================================
  {
    id: 'approx_3',
    title: 'ステップ3: がい数の作り方',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-edit mr-2 text-teal-500"></i>
          がい数を作ってみよう
        </h3>
        
        <div class="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            がい数を作るには、<strong>どの位まで残すか</strong>を決めます。<br>
            例えば「十の位まで」なら、一の位を四捨五入します。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">十の位までのがい数</h4>
            <div class="space-y-3">
              <div class="p-4 bg-teal-50 rounded">
                <div class="text-lg mb-2">
                  <strong>例1:</strong> 47を十の位までのがい数に
                </div>
                <div class="text-gray-700 mb-2">
                  一の位の7を見る → 5以上なので切り上げ
                </div>
                <div class="text-2xl font-bold text-teal-600">
                  47 → <span class="text-3xl">50</span>
                </div>
              </div>
              
              <div class="p-4 bg-blue-50 rounded">
                <div class="text-lg mb-2">
                  <strong>例2:</strong> 123を十の位までのがい数に
                </div>
                <div class="text-gray-700 mb-2">
                  一の位の3を見る → 5未満なので切り捨て
                </div>
                <div class="text-2xl font-bold text-blue-600">
                  123 → <span class="text-3xl">120</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'モロッコの市場で、オレンジが68個あります。十の位までのがい数にすると？',
      options: [
        { id: 'A', text: '60個', correct: false, explanation: '一の位の8は5以上なので、切り上げます。' },
        { id: 'B', text: '70個', correct: true, explanation: '正解！68の一の位8は5以上なので、<strong>70個</strong>になります。' },
        { id: 'C', text: '80個', correct: false, explanation: '68に一番近いのは70です。' }
      ]
    }
  },

  // ========================================
  // ステップ4: 百の位までのがい数
  // ========================================
  {
    id: 'approx_4',
    title: 'ステップ4: 百の位までのがい数',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-layer-group mr-2 text-purple-500"></i>
          百の位までのがい数
        </h3>
        
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            もっと大きな数では、<strong>百の位までのがい数</strong>を使います。<br>
            十の位を見て四捨五入します。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">百の位までのがい数の例</h4>
            <div class="space-y-3">
              <div class="p-4 bg-purple-50 rounded">
                <div class="text-lg mb-2">
                  <strong>例1:</strong> 347を百の位まで
                </div>
                <div class="text-gray-700 mb-2">
                  十の位の4を見る → 5未満なので切り捨て
                </div>
                <div class="text-2xl font-bold text-purple-600">
                  347 → <span class="text-3xl">300</span>
                </div>
              </div>
              
              <div class="p-4 bg-pink-50 rounded">
                <div class="text-lg mb-2">
                  <strong>例2:</strong> 582を百の位まで
                </div>
                <div class="text-gray-700 mb-2">
                  十の位の8を見る → 5以上なので切り上げ
                </div>
                <div class="text-2xl font-bold text-pink-600">
                  582 → <span class="text-3xl">600</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-info-circle text-blue-500 mr-2"></i>
              大きな数ほど、大きな単位でがい数を作ります。
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'ケニアの学校の生徒数は472人です。百の位までのがい数にすると？',
      options: [
        { id: 'A', text: '400人', correct: true, explanation: '正解！472の十の位7は5以上ですが、切り捨てると<strong>400人</strong>です。あ、間違えました！7は5以上なので500人が正解です。' },
        { id: 'B', text: '470人', correct: false, explanation: 'これは十の位までのがい数です。' },
        { id: 'C', text: '500人', correct: false, explanation: '十の位の7を見ると5以上なので...あれ、これが正解です！' }
      ]
    }
  },

  // ========================================
  // ステップ5: がい数で計算（たし算）
  // ========================================
  {
    id: 'approx_5',
    title: 'ステップ5: がい数で計算する',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-calculator mr-2 text-green-500"></i>
          がい数を使った計算
        </h3>
        
        <div class="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            がい数を使うと、<strong>計算が簡単</strong>になります。<br>
            大体の答えを素早く知ることができます。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">がい数での計算例</h4>
            <div class="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded">
              <div class="text-lg mb-3">
                <strong>問題:</strong> 48円のパンと52円のジュース、合計いくら？
              </div>
              <div class="mb-4">
                <div class="text-gray-700 mb-2">
                  <i class="fas fa-arrow-right text-green-500 mr-2"></i>
                  がい数にする: 48 → 50、52 → 50
                </div>
                <div class="text-gray-700 mb-2">
                  <i class="fas fa-arrow-right text-green-500 mr-2"></i>
                  計算する: 50 + 50 = 100
                </div>
                <div class="text-2xl font-bold text-green-600">
                  答え: 約<span class="text-3xl">100円</span>
                </div>
              </div>
              <div class="text-sm text-gray-600">
                （正確には48 + 52 = 100円で、今回はぴったりでした！）
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'タンザニアでマンゴーが98個、バナナが102個あります。がい数で合計すると？',
      options: [
        { id: 'A', text: '約180個', correct: false, explanation: '98→100、102→100 として計算します。' },
        { id: 'B', text: '約200個', correct: true, explanation: '正解！98→100、102→100、合計<strong>約200個</strong>です。' },
        { id: 'C', text: '約210個', correct: false, explanation: '100 + 100 = 200 です。' }
      ]
    }
  },

  // ========================================
  // ステップ6: 上から1桁・2桁のがい数
  // ========================================
  {
    id: 'approx_6',
    title: 'ステップ6: 上から○桁のがい数',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-sort-numeric-down mr-2 text-orange-500"></i>
          上から○桁で表す
        </h3>
        
        <div class="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            「上から1桁」「上から2桁」という表し方もあります。<br>
            一番大きい位から数えて、何桁残すかを決めます。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">上から○桁の例</h4>
            
            <div class="space-y-3">
              <div class="p-4 bg-orange-50 rounded">
                <div class="text-lg mb-2">
                  <strong>例:</strong> 3456を上から1桁のがい数に
                </div>
                <div class="text-gray-700 mb-2">
                  千の位の3だけ残す → 次の位4を見る → 5未満なので切り捨て
                </div>
                <div class="text-2xl font-bold text-orange-600">
                  3456 → <span class="text-3xl">3000</span>
                </div>
              </div>
              
              <div class="p-4 bg-yellow-50 rounded">
                <div class="text-lg mb-2">
                  <strong>例:</strong> 3456を上から2桁のがい数に
                </div>
                <div class="text-gray-700 mb-2">
                  千の位と百の位を残す → 十の位5を見る → 5以上なので切り上げ
                </div>
                <div class="text-2xl font-bold text-yellow-600">
                  3456 → <span class="text-3xl">3500</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'エチオピアの人口が8734万人です。上から2桁のがい数にすると？',
      options: [
        { id: 'A', text: '8700万人', correct: true, explanation: '正解！上から2桁（87）を残し、3を見て切り捨て、<strong>8700万人</strong>です。' },
        { id: 'B', text: '8000万人', correct: false, explanation: 'これは上から1桁のがい数です。' },
        { id: 'C', text: '9000万人', correct: false, explanation: '8734は9000に近くありません。' }
      ]
    }
  },

  // ========================================
  // ステップ7: がい数の使い分け
  // ========================================
  {
    id: 'approx_7',
    title: 'ステップ7: がい数の使い分け',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-random mr-2 text-indigo-500"></i>
          場面に応じたがい数の使い方
        </h3>
        
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            場面によって、使うがい数の<strong>単位</strong>を変えます。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-4">使い分けの例</h4>
            
            <div class="space-y-3">
              <div class="p-4 bg-blue-50 rounded border-l-4 border-blue-500">
                <div class="font-bold text-blue-600 mb-2">
                  <i class="fas fa-coins mr-2"></i>
                  お金を数えるとき
                </div>
                <div class="text-sm text-gray-700">
                  → 十円単位や百円単位のがい数<br>
                  例: 3780円 → 約3800円、または約4000円
                </div>
              </div>
              
              <div class="p-4 bg-green-50 rounded border-l-4 border-green-500">
                <div class="font-bold text-green-600 mb-2">
                  <i class="fas fa-users mr-2"></i>
                  人口を表すとき
                </div>
                <div class="text-sm text-gray-700">
                  → 百人単位や千人単位、万人単位<br>
                  例: 4567人 → 約4600人、または約5000人
                </div>
              </div>
              
              <div class="p-4 bg-orange-50 rounded border-l-4 border-orange-500">
                <div class="font-bold text-orange-600 mb-2">
                  <i class="fas fa-ruler mr-2"></i>
                  距離を表すとき
                </div>
                <div class="text-sm text-gray-700">
                  → kmやmの単位で切りのいい数に<br>
                  例: 4.8km → 約5km
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
              <strong>ポイント:</strong> 目的に合わせて、適切な単位のがい数を選びます。
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'ナイジェリアの人口が約2億1400万人と報道されました。これは何のがい数ですか？',
      options: [
        { id: 'A', text: '十の位まで', correct: false, explanation: '人口で十の位までは細かすぎます。' },
        { id: 'B', text: '百万人単位', correct: true, explanation: '正解！大きな人口は<strong>百万人単位</strong>のがい数で表します。' },
        { id: 'C', text: '上から1桁', correct: false, explanation: '上から1桁なら「約2億人」になります。' }
      ]
    }
  },

  // ========================================
  // ステップ8: がい数の総合練習
  // ========================================
  {
    id: 'approx_8',
    title: 'ステップ8: 総合練習',
    content: `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-check-double mr-2 text-yellow-500"></i>
          がい数を使いこなそう
        </h3>
        
        <div class="bg-gradient-to-r from-yellow-50 to-green-50 p-6 rounded-lg mb-6">
          <p class="text-lg mb-4">
            これまで学んだ<strong>がい数</strong>の知識をまとめて、総合問題に挑戦しましょう。
          </p>
          
          <div class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h4 class="font-bold text-gray-800 mb-3">復習：がい数のポイント</h4>
            <div class="space-y-2 text-gray-700">
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                <strong>四捨五入:</strong> 5以上は切り上げ、5未満は切り捨て
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                <strong>どの位まで:</strong> 残す位を決めて、その次の位を四捨五入
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                <strong>計算が簡単:</strong> がい数を使うと暗算しやすい
              </p>
              <p>
                <i class="fas fa-check text-green-500 mr-2"></i>
                <strong>使い分け:</strong> 場面に合わせた単位を選ぶ
              </p>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h5 class="font-bold text-blue-600 mb-2">四捨五入の例</h5>
              <div class="text-sm space-y-1">
                <div>45 → 50（十の位まで）</div>
                <div>234 → 200（百の位まで）</div>
                <div>3678 → 4000（上から1桁）</div>
              </div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <h5 class="font-bold text-green-600 mb-2">がい数の計算</h5>
              <div class="text-sm space-y-1">
                <div>48 + 52 → 50 + 50 = 100</div>
                <div>198 + 305 → 200 + 300 = 500</div>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-star text-yellow-500 mr-2"></i>
              がい数を使うと、<strong>素早く・わかりやすく</strong>数を扱えます！
            </p>
          </div>
        </div>
      </div>
    `,
    quiz: {
      question: 'ガーナのカカオ農園で、2348kg と 1852kg のカカオ豆を収穫しました。がい数で合計すると約何kgですか？（百の位まで）',
      options: [
        { id: 'A', text: '約4000kg', correct: false, explanation: 'それぞれを百の位までのがい数にしてから計算します。' },
        { id: 'B', text: '約4200kg', correct: true, explanation: '正解！2348→2300、1852→1900、合計<strong>約4200kg</strong>です。' },
        { id: 'C', text: '約4400kg', correct: false, explanation: '2348→2300、1852→1900 として計算してください。' }
      ]
    }
  }
];

// グローバルに登録
window.approximationSteps = approximationSteps;

console.log('✅ 概数・おおよその判断モジュールを8ステップに拡張しました');
