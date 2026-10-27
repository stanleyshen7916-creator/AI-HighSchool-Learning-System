/* js/data/ExamArchiveMath.js — 月考資料：長榮中學 115-1 高二第一次段考 數學A。
   題目文字依考卷逐字轉錄（數學式以 Unicode 表示），原卷錯漏照錄並加註「原卷如此」。
   answerBasis：確認＝原卷紅筆或可直接驗證；推論＝無官方解答，由解題推得。
   不含任何學生作答或得分。 */
AHS.ExamArchiveData.subjects.push({
  examId: "115-1-m1",
  id: "math",
  name: "數學A",
  title: "台南市私立長榮中學 115 學年度第一學期高中部二年級第一次段考數學 A 試題",
  scope: "範圍：第三冊 1-1~2-3",
  credits: "命題：曾婷薇 師　審題：莊淑貞 師",
  notes: [],
  sections: [
    {
      title: "一、單選題：每題 4 分，共 16 分",
      questions: [
        {
          no: "1", type: "single",
          stem: "試計算 2log₄(6/7) − log₄(3/14) + log₄(7/15) − log₄(2/5)？",
          options: ["(1) −2", "(2) −1", "(3) 0", "(4) 1", "(5) 2"],
          answer: "(4)", basis: "推論",
          explanation: "合併為 log₄[(6/7)²·(14/3)·(7/15)·(5/2)] = log₄[(36/49)·(14/3)·(7/15)·(5/2)] = log₄4 = 1。",
          topic: "對數運算性質", lessonRef: "gap:math-log"
        },
        {
          no: "2", type: "single",
          stem: "半徑為 20 的扇形區域，其面積為 10π，則此扇形的弧長為何？",
          options: ["(1) π/2", "(2) π", "(3) π/20", "(4) 2π", "(5) 3π/2"],
          answer: "(2)", basis: "推論",
          explanation: "扇形面積 = ½·r·ℓ ⇒ 10π = ½·20·ℓ ⇒ ℓ = π。",
          topic: "扇形面積與弧長", lessonRef: "MAT_H2_Ch1_Trigonometry#F2"
        },
        {
          no: "3", type: "single",
          stem: "音叉振動時，只會發出單一頻率，因此可做為調音工具，如略圖記錄 1/25 秒中，音叉發出的聲音在儀器上的圖形，其中 y 為振動的位移(公分)，t 則為時間(秒)，假設其波形為正弦函數的圖形 y = sin(at)，則 a = ？",
          figure: "assets/exam-archive/115-1-m1/math/3.png",
          options: ["(1) 50π", "(2) 100π", "(3) 200π", "(4) 250π", "(5) 400π"],
          answer: "(3)", basis: "推論",
          explanation: "略圖在 1/25 秒內共有 4 個完整週期，週期 T = (1/25)÷4 = 1/100 秒；a = 2π/T = 200π。（依附圖數波形）",
          topic: "正弦函數的週期", lessonRef: "MAT_H2_Ch1_Trigonometry#F7"
        },
        {
          no: "4", type: "single",
          stem: "a = (2^(−5/4))^(−6)、b = 2³ × 4^(−2.5)、c = 0.8⁰、d = (1/2)^√3、e = 8^(2/3)，則 a, b, c, d, e 的大小關係為？",
          options: ["(1) b < d < c < e < a", "(2) e < d < c < b < a", "(3) c < d < a < b < e", "(4) e < d < c < a < b", "(5) a < d < c < e < b"],
          answer: "(1)", basis: "推論",
          explanation: "全部化為以 2 為底：a = 2^7.5、b = 2³·2⁻⁵ = 2⁻²、c = 1 = 2⁰、d = 2^(−√3) ≈ 2^(−1.73)、e = 2²。底數 2 > 1，指數愈大值愈大：−2 < −√3 < 0 < 2 < 7.5 ⇒ b < d < c < e < a。",
          topic: "指數大小比較", lessonRef: "gap:math-exp"
        }
      ]
    },
    {
      title: "二、多選題：每題 8 分，依 8-5-2-0 計分，共 24 分",
      questions: [
        {
          no: "5", type: "multi",
          stem: "設函數 f(x) = 2sin2x + 4cos(2x + π/6) + d，其中 d 為實數，已知 f(x) 的最小值為 −5，則下列哪些選項正確？",
          options: ["(1) d = −3", "(2) f(x) 的最大值為 5", "(3) f(x) 的週期為 4π", "(4) y = f(x) 的圖形與 y = −2 的圖形在區間 [0, π] 有 2 個交點", "(5) 已知 (a, b) 在 f(x) 的圖形上，則 (π/3 − a, b) 也在 f(x) 的圖形上"],
          answer: "(4)", basis: "推論",
          explanation: "4cos(2x + π/6) = 2√3cos2x − 2sin2x，故 f(x) = 2√3cos2x + d。最小值 d − 2√3 = −5 ⇒ d = 2√3 − 5（(1)錯）；最大值 4√3 − 5 ≈ 1.93（(2)錯）；週期 π（(3)錯）；f(x) = −2 ⇒ cos2x = (3 − 2√3)/(2√3) ≈ −0.134，2x ∈ [0, 2π] 有 2 解（(4)對）；f 的對稱軸為 x = kπ/2，x = π/6 不是對稱軸，(5)錯。",
          topic: "三角函數疊合與圖形性質", lessonRef: "MAT_H2_Ch1_Trigonometry#F14"
        },
        {
          no: "6", type: "multi",
          stem: "已知 3π/2 < α < 2π，sinα + cosα = 1/5，則下列哪些選項正確？",
          options: ["(1) sinα − cosα = −7/5", "(2) cosα = 3/5", "(3) tan(α/2) = −1/3", "(4) cos2α = 7/25", "(5) sin(α/2) − cos(α/2) = −2√10/5"],
          answer: "(1)(3)(4)", basis: "推論",
          explanation: "α 在第四象限，sinα < 0 < cosα。由 sinα + cosα = 1/5 與 sin²α + cos²α = 1 得 sinα = −3/5、cosα = 4/5。(1) −3/5 − 4/5 = −7/5 對；(2) 錯；(3) tan(α/2) = sinα/(1 + cosα) = (−3/5)/(9/5) = −1/3 對；(4) cos2α = 16/25 − 9/25 = 7/25 對；(5) 3π/4 < α/2 < π，sin(α/2) > 0 > cos(α/2)，差為正值，錯。",
          topic: "半角與倍角公式", lessonRef: "MAT_H2_Ch1_Trigonometry#F13"
        },
        {
          no: "7", type: "multi",
          stem: "試問下列關於 3⁶⁰ 的敘述哪些正確？",
          options: ["(1) 3⁶⁰ 為 28 位數", "(2) 3⁶⁰ 的個位數字為 1", "(3) 3⁶⁰ 的最高位數字為 4", "(4) 5 × 3⁶⁰ 為 29 位數", "(5) 3⁻⁶⁰ 以小數點表示，小數點後第 29 位開始不為 0"],
          answer: "(2)(3)(5)", basis: "推論",
          explanation: "log3⁶⁰ = 60 × 0.4771 ≈ 28.63，首數 28 ⇒ 29 位數（(1)錯）；3 的次方個位數以 3、9、7、1 循環，60 為 4 的倍數 ⇒ 個位 1（(2)對）；尾數 0.63 介於 log4 ≈ 0.602 與 log5 ≈ 0.699 之間 ⇒ 最高位 4（(3)對）；log(5 × 3⁶⁰) ≈ 29.33 ⇒ 30 位數（(4)錯）；log3⁻⁶⁰ ≈ −28.63 = −29 + 0.37 ⇒ 小數點後第 29 位開始不為 0（(5)對）。",
          topic: "常用對數的應用（位數、首位數）", lessonRef: "gap:math-log"
        }
      ]
    },
    {
      title: "三、選填題：每格 6 分，共 60 分（全對才給分）",
      questions: [
        {
          no: "A", type: "fill",
          stem: "方程式 4ˣ − 5 × 2ˣ − 24 = 0 的解 x = ______。",
          answer: "3", basis: "推論",
          explanation: "令 t = 2ˣ > 0：t² − 5t − 24 = 0 ⇒ (t − 8)(t + 3) = 0 ⇒ t = 8（t = −3 不合）⇒ x = 3。",
          topic: "指數方程式", lessonRef: "gap:math-exp"
        },
        {
          no: "B", type: "fill",
          stem: "已知對數 log₍ₓ₋₂₎(−x² + 8x − 7) 有意義，則 x 的範圍為 ______。",
          answer: "2 < x < 7 且 x ≠ 3", basis: "推論",
          explanation: "底數：x − 2 > 0 且 x − 2 ≠ 1 ⇒ x > 2 且 x ≠ 3；真數：−x² + 8x − 7 > 0 ⇒ (x − 1)(x − 7) < 0 ⇒ 1 < x < 7。取交集得 2 < x < 7 且 x ≠ 3。",
          topic: "對數有意義的條件", lessonRef: "gap:math-log"
        },
        {
          no: "C", type: "fill",
          stem: "已知 0 < x < π/2，試求 √3sinx + cosx = 2 的解為 x = ______。",
          answer: "π/3", basis: "推論",
          explanation: "√3sinx + cosx = 2sin(x + π/6) = 2 ⇒ sin(x + π/6) = 1 ⇒ x + π/6 = π/2 ⇒ x = π/3。",
          topic: "正餘弦疊合解方程式", lessonRef: "MAT_H2_Ch1_Trigonometry#F14"
        },
        {
          no: "D", type: "fill",
          stem: "已知 x > 0，不等式 log₃(log_{1/3} x) ≤ 1 的解為 ______。",
          answer: "1/27 ≤ x < 1", basis: "推論",
          explanation: "外層：0 < log_{1/3} x ≤ 3。底數 1/3 < 1，函數遞減：log_{1/3} x > 0 ⇒ x < 1；log_{1/3} x ≤ 3 ⇒ x ≥ (1/3)³ = 1/27。故 1/27 ≤ x < 1。",
          topic: "對數不等式", lessonRef: "gap:math-log"
        },
        {
          no: "E", type: "fill",
          stem: "已知圓 O 的直徑 AB = 6，且 P 是圓 O 上一點，求 3PA + 4PB 的最大值為 ______。",
          answer: "30", basis: "推論",
          explanation: "直徑所對圓周角為直角，PA² + PB² = 36。令 PA = 6cosθ、PB = 6sinθ，3PA + 4PB = 18cosθ + 24sinθ = 30sin(θ + φ) ≤ 30（亦可用柯西不等式）。",
          topic: "疊合求最大值（幾何應用）", lessonRef: "MAT_H2_Ch1_Trigonometry#F15"
        },
        {
          no: "F", type: "fill",
          stem: "不等式 (0.3)^(x²−x) ≤ (0.09)^(2x+3) 的解為 ______。",
          answer: "x ≤ −1 或 x ≥ 6", basis: "推論",
          explanation: "(0.09)^(2x+3) = (0.3)^(4x+6)。底數 0.3 < 1，函數遞減，不等號反向：x² − x ≥ 4x + 6 ⇒ x² − 5x − 6 ≥ 0 ⇒ (x − 6)(x + 1) ≥ 0 ⇒ x ≤ −1 或 x ≥ 6。",
          topic: "指數不等式（底數小於 1）", lessonRef: "gap:math-exp"
        },
        {
          no: "G", type: "fill",
          stem: "計算 log₃(log₃125) + 3log₂₇(log₅27) = ______。",
          answer: "2", basis: "推論",
          explanation: "log₃(log₃125) = log₃(3log₃5) = 1 + log₃(log₃5)；3log₂₇(log₅27) = log₃(log₅27) = log₃(3log₅3) = 1 + log₃(log₅3)。相加 = 2 + log₃(log₃5 · log₅3) = 2 + log₃1 = 2。",
          topic: "對數換底公式", lessonRef: "gap:math-log"
        },
        {
          no: "H", type: "fill",
          stem: "函數 y = a cos(bx) + c 的部分圖形如圖，若 a、b、c > 0，則 (a, b, c) = ______。",
          figure: "assets/exam-archive/115-1-m1/math/H.svg", figureNote: "附圖依原卷重繪（原卷附圖上有作答筆跡，不上傳原圖）。",
          answer: "(5, 2, 3)", basis: "推論",
          explanation: "由圖：最大值 8（x = 0）、最小值 −2（x = 3π/2），且 x = π 為最高點。a = (8 − (−2))/2 = 5，c = (8 + (−2))/2 = 3；相鄰最高點 0 與 π 相距一個週期 ⇒ 週期 π ⇒ b = 2。檢查：x = 3π/2 時 cos3π = −1，y = −2 符合。",
          topic: "由圖形求三角函數", lessonRef: "MAT_H2_Ch1_Trigonometry#F7"
        },
        {
          no: "I", type: "fill",
          stem: "如右圖，∠ACD = ∠ADB = 90°，且 ∠ABD = 2θ，∠ABC = θ，又 AB = 10，AC = √10，則 AD 的長為 ______。",
          stemNote: "原卷如此：題幹寫「∠ACD」，附圖直角記號標在 C 點（∠ACB）。",
          figure: "assets/exam-archive/115-1-m1/math/I.svg", figureNote: "附圖依原卷重繪（原卷附圖上有作答筆跡，不上傳原圖）。",
          answer: "6", basis: "推論",
          explanation: "依附圖，△ACB 在 C 為直角：sinθ = AC/AB = √10/10，cosθ = 3√10/10。△ADB 在 D 為直角：AD = AB·sin2θ = 10 × 2 × (√10/10)(3√10/10) = 10 × 0.6 = 6。",
          topic: "二倍角公式（幾何應用）", lessonRef: "MAT_H2_Ch1_Trigonometry#F12"
        },
        {
          no: "J", type: "fill",
          stem: "設計師為天文館設計以不銹鋼片製成的月亮形狀，其中有一款設計圖如圖所示：圖中，圓弧 QRT 是一個以 O 點為圓心、QT 為直徑的半圓，QT = 4√2，圓弧 QST 的圓心在 P 點，PQ = PT = 4。圓弧 QRT 與圓弧 QST 所圍出的灰色區域 QRTSQ 即為某一天所見的月亮形狀，則此灰色區域的面積為 ______ 平方單位。",
          figure: "assets/exam-archive/115-1-m1/math/J.svg", figureNote: "附圖依原卷重繪（原卷附圖上有作答筆跡，不上傳原圖）。",
          answer: "8", basis: "推論",
          explanation: "PQ² + PT² = 16 + 16 = 32 = QT² ⇒ ∠QPT = 90°。灰色面積 = 半圓 QRT − 弓形 QST = ½π(2√2)² − (¼π·4² − ½·4·4) = 4π − (4π − 8) = 8。",
          topic: "扇形與弓形面積", lessonRef: "MAT_H2_Ch1_Trigonometry#F2"
        }
      ]
    }
  ]
});
