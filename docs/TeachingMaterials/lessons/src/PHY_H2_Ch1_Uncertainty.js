/* lessons/src/PHY_H2_Ch1_Uncertainty.js — 高二物理 第1章 測量與不確定度（tm_10／tm_43／tm_52）.
   內容依教材包 tm_10 summary.json（課本第1～25頁）；題目數據為重新設計，答案已用程式驗算。 */
"use strict";
module.exports = {
  lessonId: "PHY_H2_Ch1_Uncertainty",
  title: "測量與不確定度圖解教材",
  eyebrow: "物理 ・ 第 1 章 ・ 高二上",
  h1: "測量與不確定度",
  h1small: "用圖看懂每一次測量",
  subject: "PHY",
  unit: "PHY-H2-CH1",
  sections: [
    {
      id: "1-1", short: "簡介不確定度", title: "簡介不確定度",
      plan: {
        goal: "分清誤差與不確定度，會算 A 類（統計）與 B 類（儀器刻度）不確定度，並用進位規則寫出測量結果。",
        prereq: "平均數、平方根、有效數字。",
        time: "約 3 節課。課本第1節。"
      },
      cards: [
        {
          id: "F1", title: "從誤差到不確定度", page: "課本 第1節", tags: ["src"],
          say: "量一枝筆有多長，量十次會得到十個有點不一樣的數字。那「真正的長度」是多少？老實說，<b>沒有人知道</b>。誤差是「測量值減真值」，可是真值不知道，誤差就算不出來。所以 1993 年國際上改用<b>不確定度</b>：不用管真值，只看我們自己的數據有多分散。",
          formula: "誤差 = 測量值 − 真值（要知道真值）<br>測量結果 = <i>X</i> ± <i>u</i>(<i>X</i>)　　<i>u</i> 恆為正",
          widget: { id: "w-err", aria: "多次測量的點、平均值與不確定度範圍，真值可以顯示或隱藏", rw: 0.42, rn: 0.8,
            controls: [{ k: "n", label: "次數 n", min: 3, max: 30, step: 1 }, { k: "show", label: "偷看真值", min: 0, max: 1, step: 1 }] },
          space: "把「偷看真值」關掉再打開：不確定度的紅色範圍完全沒變，因為它只用到量出來的點。誤差才需要真值。",
          trap: "以為不確定度可以是負的。它描述的是「分散的程度」，跟距離一樣，永遠是正的。",
          quiz: { q: "關於「誤差」與「不確定度」，下列哪一個敘述正確？", answer: "b", options: [
            { c: "a", text: "不確定度可正可負", why: "不確定度描述分散程度，恆為正值。可正可負的是誤差。" },
            { c: "b", text: "估算不確定度不需要知道真值" },
            { c: "c", text: "多量幾次就能直接算出誤差", why: "誤差 = 測量值 − 真值，沒有真值就算不出來，量再多次也一樣。" },
            { c: "d", text: "不確定度越大，代表測量越準", why: "剛好相反，不確定度越大代表數據越分散、越不能確定。" }] },
          sol: { id: "s-F1", aria: "逐步圖解：誤差需要真值，不確定度只需要數據" }
        },
        {
          id: "F2", title: "A 類評估：u = s／√n", page: "課本 第1節", tags: ["src"],
          say: "A 類就是「靠統計」。先算平均，再算樣本標準差 s，看每個點離平均多遠。最後一步很多人會忘：<b>還要除以 √n</b>。量越多次，平均值就越可靠，所以不確定度會變小。下面拉拉看次數 n。",
          formula: "<i>x̄</i> = <span class=\"fr\"><span>Σ<i>x</i><sub>i</sub></span><span><i>n</i></span></span>　　<i>s</i> = √<span class=\"fr\"><span>Σ(<i>x</i><sub>i</sub> − <i>x̄</i>)²</span><span><i>n</i> − 1</span></span>　　<i>u</i>(<i>X</i>) = <span class=\"fr\"><span><i>s</i></span><span>√<i>n</i></span></span>",
          widget: { id: "w-typeA", aria: "量測點、平均值、標準差 s 與 A 類不確定度 s/√n 的範圍", rw: 0.42, rn: 0.8,
            controls: [{ k: "n", label: "次數 n", min: 2, max: 40, step: 1 }, { k: "sig", label: "分散程度", min: 0.02, max: 0.15, step: 0.01 }],
            play: { k: "n", dur: 4000 } },
          space: "金色的 ±s 範圍幾乎不隨 n 改變（它描述的是「每一次」量得多散），紅色的 ±s/√n 卻越縮越窄（它描述的是「平均值」有多可靠）。",
          trap: "① 把 s 直接當成不確定度，忘了 ÷√n。② 算 s 時分母用 n，要用 n − 1。",
          quiz: { q: "用游標尺量硬幣直徑 5 次：2.69、2.70、2.68、2.71、2.70（cm）。A 類不確定度是多少？", answer: "a", options: [
            { c: "a", text: "0.0051 cm" },
            { c: "b", text: "0.012 cm", why: "這是樣本標準差 s（0.0114），還要再除以 √5。" },
            { c: "c", text: "0.0046 cm", why: "算標準差時分母要用 n − 1 = 4，不是 5。" },
            { c: "d", text: "0.005 cm", why: "數值差不多，但不確定度要保留 2 位有效數字，而且是無條件進位：0.0051。" }] },
          sol: { id: "s-F2", aria: "逐步圖解：平均、偏差、標準差、除以根號 n" }
        },
        {
          id: "F3", title: "B 類評估：u = 最小刻度／(2√3)", page: "課本 第1節", tags: ["src", "add"],
          say: "只量一次的時候怎麼辦？就看儀器。指針落在兩條刻度中間的哪裡都有可能，機會一樣大，這叫<b>均勻分布</b>。寬度是一個最小刻度，它的標準差剛好是「半格 ÷ √3」，也就是最小刻度 ÷ (2√3)。",
          formula: "<i>u</i>(<i>X</i>) = <span class=\"fr\"><span>最小刻度</span><span>2√3</span></span> = <span class=\"fr\"><span>最小刻度</span><span>√12</span></span> ≈ 0.2887 × 最小刻度",
          widget: { id: "w-typeB", aria: "尺的刻度、讀數可能落在一格內任何位置的均勻分布", rw: 0.45, rn: 0.85,
            controls: [{ k: "d", label: "最小刻度", min: 0.1, max: 1, step: 0.1 }] },
          space: "下面那塊長方形就是「讀數可能在哪裡」：一整格都一樣可能。紅線標出 ±u，大約佔半格的 58%，不是整個半格。",
          trap: "漏掉 ÷2 或 ÷√3 其中一步。半格（最小刻度 ÷ 2）是「最大可能偏差」，不是不確定度。",
          quiz: { q: "數位電壓表最小位數是 1 mV，讀數 1532 mV。用 B 類評估，測量結果怎麼寫？", answer: "a", options: [
            { c: "a", text: "(1532.00 ± 0.29) mV" },
            { c: "b", text: "(1532.0 ± 0.5) mV", why: "0.5 mV 是半格，是最大可能偏差。要再 ÷√3。" },
            { c: "c", text: "(1532.00 ± 0.58) mV", why: "1 ÷ √3 = 0.58，少除了 2。" },
            { c: "d", text: "(1532.00 ± 0.14) mV", why: "多除了一次 2。公式是最小刻度 ÷ (2√3)。" }] },
          sol: { id: "s-F3", aria: "逐步圖解：一格的均勻分布與標準差" }
        },
        {
          id: "F4", title: "進位規則與結果表示", page: "課本 第1節", tags: ["src"],
          say: "算出來的數字常常有一長串小數，要怎麼寫？口訣兩句：<b>不確定度無條件進位，最多留 2 位有效數字</b>（寧可說保守一點）；<b>最佳估計值四捨五入，對齊不確定度的最後一位</b>。下面拉不確定度，看最佳估計值要留到哪一位。",
          formula: "<i>u</i>：無條件進位，保留至多 2 位有效數字<br><i>X</i>：四捨五入，末位與 <i>u</i> 對齊　→　(<i>X</i> ± <i>u</i>) 單位",
          widget: { id: "w-round", aria: "數字格子顯示保留與捨去的位數", rw: 0.36, rn: 0.7,
            controls: [{ k: "u", label: "u 原始值", min: 0.011, max: 0.999, step: 0.001 }] },
          space: "看青綠色格子：u 留到哪一位，X 就留到同一位。u 從 0.08 變成 0.8，X 就少留一位小數。",
          trap: "不確定度用四捨五入（0.0841 寫成 0.084）。不確定度一律無條件進位：0.0841 → 0.085。",
          quiz: { q: "計算得到 X = 15.23746、u = 0.08412。測量結果應該寫成？", answer: "a", options: [
            { c: "a", text: "(15.237 ± 0.085)" },
            { c: "b", text: "(15.237 ± 0.084)", why: "不確定度要無條件進位，0.08412 → 0.085。" },
            { c: "c", text: "(15.24 ± 0.09)", why: "不確定度可以留 2 位有效數字，這裡留太少了，X 也跟著少一位。" },
            { c: "d", text: "(15.2375 ± 0.085)", why: "X 的末位要和不確定度的末位對齊（小數第三位）。" }] },
          sol: { id: "s-F4", aria: "逐步圖解：先處理不確定度，再對齊最佳估計值" }
        }
      ]
    },
    {
      id: "1-2", short: "不確定度的組合", title: "不確定度的組合",
      plan: {
        goal: "會用「平方和開根號」組合 A、B 類不確定度，以及加減、乘除運算後的不確定度。",
        prereq: "1-1 的 A 類、B 類評估；畢氏定理。",
        time: "約 2 至 3 節課。課本第2節。"
      },
      cards: [
        {
          id: "F5", title: "A、B 類組合不確定度", page: "課本 第2節", tags: ["src", "add"],
          say: "同一個測量，同時有 A 類（數據分散）和 B 類（儀器刻度）的不確定度。它們是兩個互相獨立的來源，不能直接相加。想像兩根互相垂直的棒子，合起來的長度是<b>斜邊</b>，就是畢氏定理。",
          formula: "<i>u</i> = √(<i>u</i><sub>A</sub>² + <i>u</i><sub>B</sub>²)",
          widget: { id: "w-ab", aria: "直角三角形：兩股為 A 類與 B 類不確定度，斜邊為組合不確定度", rw: 0.45, rn: 0.85,
            controls: [{ k: "a", label: "uA", min: 0.01, max: 0.3, step: 0.01 }, { k: "b", label: "uB", min: 0.01, max: 0.3, step: 0.01 }] },
          space: "斜邊一定比任何一股長，所以組合後一定不小於 B 類；但斜邊又一定比兩股相加短，直接相加會高估。",
          trap: "把 uA + uB 當答案，或算完平方和忘了開根號。",
          quiz: { q: "測電阻：A 類不確定度 0.12 Ω，B 類不確定度 0.05 Ω。組合不確定度是？", answer: "b", options: [
            { c: "a", text: "0.17 Ω", why: "直接相加了。獨立的來源要平方和再開根號。" },
            { c: "b", text: "0.13 Ω" },
            { c: "c", text: "0.07 Ω", why: "不確定度不會互相抵消，不能相減。" },
            { c: "d", text: "0.0169 Ω", why: "這是平方和，還要開根號。" }] },
          sol: { id: "s-F5", aria: "逐步圖解：5-12-13 直角三角形" }
        },
        {
          id: "F6", title: "加減法組合", page: "課本 第2節", tags: ["src"],
          say: "空燒杯量一次、裝水後再量一次，相減得到水的質量。兩次測量各有不確定度，相減之後不確定度會不會也「減掉」？<b>不會！</b>兩次的不確定度都還在，一樣用平方和開根號，而且<b>相加和相減的公式完全一樣</b>。",
          formula: "<i>Z</i> = <i>X</i> ± <i>Y</i>　→　<i>u</i>(<i>Z</i>) = √(<i>u</i>(<i>X</i>)² + <i>u</i>(<i>Y</i>)²)",
          widget: { id: "w-addsub", aria: "兩個測量值相加或相減，結果的範圍變寬", rw: 0.45, rn: 0.9,
            controls: [{ k: "ux", label: "u(X)", min: 0.05, max: 0.5, step: 0.05 }, { k: "uy", label: "u(Y)", min: 0.05, max: 0.5, step: 0.05 }, { k: "op", label: "加／減", min: 0, max: 1, step: 1 }] },
          space: "切換加／減：Z 的位置變了，可是 Z 那條範圍的寬度一點都沒變。範圍只跟 u(X)、u(Y) 有關。",
          trap: "相減時把不確定度也相減。兩個獨立的不確定度只會「疊加」，不會抵消。",
          quiz: { q: "空燒杯 (35.20 ± 0.15) g，裝水後 (118.90 ± 0.20) g。水的質量是？", answer: "a", options: [
            { c: "a", text: "(83.70 ± 0.25) g" },
            { c: "b", text: "(83.70 ± 0.05) g", why: "相減時不確定度不會相減，要平方和開根號。" },
            { c: "c", text: "(83.70 ± 0.35) g", why: "直接相加了，要平方和開根號：√(0.15² + 0.20²)。" },
            { c: "d", text: "(83.7 ± 0.0625) g", why: "0.0625 是平方和，還沒開根號。" }] },
          sol: { id: "s-F6", aria: "逐步圖解：3-4-5 的不確定度三角形" }
        },
        {
          id: "F7", title: "乘除法組合：相對不確定度", page: "課本 第2節", tags: ["src", "add"],
          say: "長方形面積 = 長 × 寬。長多了一點、寬多了一點，面積多了一圈。乘除法要先換成<b>相對不確定度</b>（不確定度 ÷ 數值），把百分比平方和開根號，最後再<b>乘回</b>結果。",
          formula: "<i>u</i><sub>r</sub>(<i>X</i>) = <span class=\"fr\"><span><i>u</i>(<i>X</i>)</span><span>|<i>X</i>|</span></span>　　<i>Z</i> = <i>XY</i> 或 <span class=\"fr\"><span><i>X</i></span><span><i>Y</i></span></span>　→　<i>u</i><sub>r</sub>(<i>Z</i>) = √(<i>u</i><sub>r</sub>(<i>X</i>)² + <i>u</i><sub>r</sub>(<i>Y</i>)²)　　<i>u</i>(<i>Z</i>) = <i>u</i><sub>r</sub>(<i>Z</i>) × |<i>Z</i>|",
          widget: { id: "w-muldiv", aria: "長方形面積的不確定度：外框與內框之間的色帶", rw: 0.5, rn: 0.9,
            controls: [{ k: "L", label: "長", min: 10, max: 60, step: 1 }, { k: "uL", label: "u(長)", min: 0.2, max: 3, step: 0.1 },
              { k: "W", label: "寬", min: 5, max: 40, step: 1 }, { k: "uW", label: "u(寬)", min: 0.2, max: 3, step: 0.1 }] },
          space: "色帶就是面積的不確定範圍。把寬的不確定度拉大，色帶變粗的是「長邊」那兩條，因為寬的誤差乘上的是長。",
          trap: "把加減法的公式拿來用（直接用絕對不確定度平方和），或算完相對不確定度忘了乘回結果。",
          quiz: { q: "金屬塊質量 (60.0 ± 0.3) g、體積 (20.0 ± 0.2) cm³。密度是多少？", answer: "a", options: [
            { c: "a", text: "(3.000 ± 0.034) g/cm³" },
            { c: "b", text: "(3.00 ± 0.37) g/cm³", why: "√(0.3² + 0.2²) 是加減法的做法。除法要用相對不確定度。" },
            { c: "c", text: "(3.000 ± 0.045) g/cm³", why: "相對不確定度 0.5% 和 1% 直接相加了，要平方和開根號。" },
            { c: "d", text: "(3.000 ± 0.012) g/cm³", why: "0.0112 是相對不確定度（約 1.1%），還要乘回密度 3.000。" }] },
          sol: { id: "s-F7", aria: "逐步圖解：先算百分比，再組合，再乘回" }
        }
      ]
    },
    {
      id: "1-3", short: "物理量的因次", title: "物理量的因次",
      plan: {
        goal: "會把物理量寫成 M、L、T 的冪次，並用因次分析檢查公式、推導冪次關係。",
        prereq: "指數律；速度、加速度、力、功的定義。",
        time: "約 2 節課。課本第3節。"
      },
      cards: [
        {
          id: "F8", title: "基本因次與常見物理量", page: "課本 第3節", tags: ["src"],
          say: "力學裡只要三塊積木：<b>質量 M、長度 L、時間 T</b>。所有物理量都是這三塊積木的次方組合。例如速度是「長度 ÷ 時間」，就是 L¹T⁻¹。你換換看不同的物理量，看它的積木長什麼樣。",
          formula: "速度 [LT⁻¹]　加速度 [LT⁻²]　力 [MLT⁻²]　動量 [MLT⁻¹]　功、動能 [ML²T⁻²]　彈性常數 <i>k</i> [MT⁻²]",
          widget: { id: "w-dim", aria: "選擇物理量，看它在 M、L、T 三個方向的次方", rw: 0.4, rn: 0.8,
            controls: [{ k: "i", label: "物理量", min: 0, max: 6, step: 1 }] },
          space: "從速度一路換到功，看長條怎麼長出來：每乘一個量，就是把它的長條「加上去」；除就是「減掉」。",
          trap: "以為因次相同就是同一個物理量（功和力矩的因次一樣，意義不同）；或把動量 MLT⁻¹ 和力 MLT⁻² 搞混。",
          quiz: { q: "動量 p = mv 的因次是？", answer: "a", options: [
            { c: "a", text: "[MLT⁻¹]" },
            { c: "b", text: "[MLT⁻²]", why: "這是力 F = ma 的因次。動量是質量乘速度，T 只有 −1 次。" },
            { c: "c", text: "[ML²T⁻²]", why: "這是功、動能的因次。" },
            { c: "d", text: "[MT⁻¹]", why: "少了速度裡的長度 L。" }] },
          sol: { id: "s-F8", aria: "逐步圖解：質量的積木加上速度的積木" }
        },
        {
          id: "F9", title: "因次分析推導公式", page: "課本 第3節", tags: ["src", "add"],
          say: "單擺週期會跟什麼有關？可能是擺錘質量 m、擺長 l、重力加速度 g。設 T = c·mᵃ·lᵇ·gᶜ，左右兩邊的 M、L、T 次方要<b>一模一樣</b>，就能解出 a、b、c。下面調三個滑桿，讓長條對上目標。",
          formula: "<i>T</i> = <i>c</i> · <i>m</i><sup>a</sup> <i>l</i><sup>b</sup> <i>g</i><sup>c</sup>　→　[T] = [M]<sup>a</sup>[L]<sup>b</sup>[LT⁻²]<sup>c</sup>　→　<i>a</i> = 0，<i>b</i> = ½，<i>c</i> = −½　　<i>T</i> = <i>c</i>√(<i>l</i>／<i>g</i>)",
          widget: { id: "w-dimsolve", aria: "調整 m、l、g 的次方，讓 M、L、T 的長條符合週期的因次", rw: 0.4, rn: 0.85,
            controls: [{ k: "a", label: "m 的次方", min: -1, max: 1, step: 0.5 }, { k: "b", label: "l 的次方", min: -1, max: 1, step: 0.5 }, { k: "c", label: "g 的次方", min: -1, max: 1, step: 0.5 }] },
          space: "M 的長條只受 m 影響，所以 m 的次方一定是 0：單擺週期跟擺錘多重無關！這是因次分析直接告訴你的。",
          trap: "以為因次分析能算出比例常數 c（2π 是無因次，因次分析看不出來）；或以為因次對了公式就一定對。",
          quiz: { q: "彈簧振子週期 T 只和質量 m、彈性常數 k [MT⁻²] 有關。用因次分析，T 應該正比於？", answer: "a", options: [
            { c: "a", text: "√(m／k)" },
            { c: "b", text: "√(k／m)", why: "k／m 的因次是 T⁻²，開根號是 T⁻¹，是頻率不是週期。" },
            { c: "c", text: "m／k", why: "m／k 的因次是 T²，要開根號才是 T。" },
            { c: "d", text: "√(mk)", why: "mk 的因次是 M²T⁻²，M 消不掉。" }] },
          sol: { id: "s-F9", aria: "逐步圖解：列出 M、T 兩條方程式" }
        }
      ]
    }
  ],
  footer: [
    "課本：高二物理 第1章 測量與不確定度（課本第1～25頁）。本機原始檔「物理/PHY_H2_第一章_測量與不確定度_PDFp*.pdf」。",
    "內容依平台教材包 tm_10（經 GPT／Gemini／Claude 交叉審查之 Final 版）；小試身手的數據為重新設計，答案已用程式驗算。",
    "不確定度表示法依國際度量衡局 ISO-GUM（Guide to the Expression of Uncertainty in Measurement）。"
  ],
  script: String.raw`
var C0 = null;
function numLine(g,G,a,b,step,C,y,fmt){ L(g,G.X(a),G.Y(y),G.X(b),G.Y(y),C.ink,1.3); for(var v=Math.ceil(a/step-1e-9)*step; v<=b+1e-9; v+=step){ L(g,G.X(v),G.Y(y)-4,G.X(v),G.Y(y)+4,C.ink,1); T(g,fmt?fmt(v):String(+v.toFixed(3)),G.X(v),G.Y(y)+16,C.muted,11,'center'); } }
function band(g,G,lo,hi,y0,y1,fill){ g.save(); g.fillStyle=fill; g.fillRect(G.X(lo),G.Y(y1),(hi-lo)*G.sx,(y1-y0)*G.sy); g.restore(); }
function sample(seed,n,mu,sig){ var r=seeded(seed), out=[]; for(var i=0;i<n;i++) out.push(mu+gauss(r)*sig); return out; }
function stats(xs){ var n=xs.length, m=xs.reduce(function(a,b){return a+b;},0)/n, ss=xs.reduce(function(a,v){return a+(v-m)*(v-m);},0), s=Math.sqrt(ss/(n-1)); return {n:n,m:m,s:s,u:s/Math.sqrt(n),ss:ss}; }
function dots(g,G,xs,y,C,col){ var cnt={}; xs.forEach(function(v){ var k=Math.round(v*200); cnt[k]=(cnt[k]||0)+1; dot(g,G.X(v),G.Y(y)-(cnt[k]-1)*9,4,col||C.ink); }); }

/* F1 誤差 vs 不確定度 */
var TRUE1=10.03;
widget('w-err',{state:{n:8,show:0},rw:0.42,rn:0.8,
  fmt:{n:function(v){return v+' 次';},show:function(v){return v?'打開':'關閉';}},
  draw:function(g,c,s){
    var C=c.C, G=frame(full(c),9.72,10.32,-0.2,1.1,24,false), xs=sample(11,s.n,TRUE1,0.07), st=stats(xs);
    numLine(g,G,9.75,10.3,0.05,C,0.12,function(v){return v.toFixed(2);});
    band(g,G,st.m-st.u,st.m+st.u,0.2,0.95,alpha(C.red,0.15)); L(g,G.X(st.m),G.Y(0.2),G.X(st.m),G.Y(0.98),C.red,2.5);
    T(g,'平均 x̄',G.X(st.m),G.Y(1.04),C.red,12,'center','700');
    dots(g,G,xs,0.28,C);
    if(s.show){ L(g,G.X(TRUE1),G.Y(0.12),G.X(TRUE1),G.Y(0.9),C.teal,2,[5,4]); T(g,'真值',G.X(TRUE1),G.Y(0.04)+18,C.teal,12,'center','700'); L(g,G.X(TRUE1),G.Y(0.85),G.X(st.m),G.Y(0.85),C.gold,3); T(g,'誤差',G.X((TRUE1+st.m)/2),G.Y(0.85)-10,C.gold,12,'center','700'); }
    else T(g,'真值 = ？',G.X(9.75),G.Y(1.04),C.muted,12,'left','700');
    T(g,'紅色範圍：x̄ ± u',G.X(10.3),G.Y(1.04),C.red,11,'right');
  },
  out:function(s){ var st=stats(sample(11,s.n,TRUE1,0.07)); return '平均 x̄ = '+st.m.toFixed(3)+' cm　｜　不確定度 u = s/√n = <b>'+st.u.toFixed(3)+'</b> cm（只用數據）　｜　誤差 = x̄ − 真值 = '+(s.show?'<b>'+nf(st.m-TRUE1,3)+'</b> cm':'<b>？</b>（不知道真值就算不出來）'); }
});
widget('s-F1',{state:{},steps:3,rw:0.42,rn:0.8,
  draw:function(g,c,s){ var C=c.C, G=frame(full(c),9.72,10.32,-0.2,1.1,24,false), xs=sample(11,8,TRUE1,0.07), st=stats(xs);
    numLine(g,G,9.75,10.3,0.05,C,0.12,function(v){return v.toFixed(2);}); dots(g,G,xs,0.28,C);
    T(g,'真值 = ？',G.X(9.75),G.Y(1.04),C.muted,12,'left','700');
    if(s.step>=1){ L(g,G.X(st.m),G.Y(0.2),G.X(st.m),G.Y(0.98),C.red,2.5); T(g,'x̄ − ？ = 誤差算不出來',G.X(st.m),G.Y(1.04),C.gold,12,'center','700'); }
    if(s.step>=2){ band(g,G,st.m-st.u,st.m+st.u,0.2,0.95,alpha(C.red,0.15)); T(g,'±u：只用這 8 個點就算得出來',G.X(st.m)+8,G.Y(0.6),C.red,12,'left','700'); } },
  out:steps(['量了 8 次，點散開來。真值在哪？我們不知道。','誤差 = 測量值 − 真值。真值不知道，<b>誤差算不出來</b>，量再多次也一樣。','不確定度只看數據多分散，<b>不需要真值</b>，而且恆為正。所以答案是「估算不確定度不需要知道真值」。'])
});

/* F2 A 類 */
widget('w-typeA',{state:{n:6,sig:0.06},rw:0.42,rn:0.8,
  fmt:{n:function(v){return v+' 次';},sig:function(v){return v.toFixed(2);}},
  draw:function(g,c,s){ var C=c.C, G=frame(full(c),9.6,10.4,-0.2,1.1,24,false), xs=sample(23,s.n,10,s.sig), st=stats(xs);
    numLine(g,G,9.6,10.4,0.1,C,0.12,function(v){return v.toFixed(1);});
    band(g,G,st.m-st.s,st.m+st.s,0.2,0.98,alpha(C.gold,0.16)); band(g,G,st.m-st.u,st.m+st.u,0.2,0.98,alpha(C.red,0.22));
    L(g,G.X(st.m),G.Y(0.2),G.X(st.m),G.Y(1.0),C.red,2.5); dots(g,G,xs,0.28,C);
    T(g,'金：±s　紅：±s/√n',G.X(9.6),G.Y(1.05),C.muted,12,'left','700'); },
  out:function(s){ var st=stats(sample(23,s.n,10,s.sig)); return 'n = '+s.n+'　x̄ = '+st.m.toFixed(4)+'　s = '+st.s.toFixed(4)+'　→　u = s/√n = '+st.s.toFixed(4)+' ÷ √'+s.n+' = <b>'+st.u.toFixed(4)+'</b>'; }
});
var D5=[2.69,2.70,2.68,2.71,2.70];
widget('s-F2',{state:{},steps:4,rw:0.42,rn:0.85,
  draw:function(g,c,s){ var C=c.C, G=frame(full(c),2.672,2.718,-0.2,1.1,24,false), st=stats(D5);
    numLine(g,G,2.675,2.715,0.005,C,0.12,function(v){return v.toFixed(3);}); dots(g,G,D5,0.3,C);
    if(s.step>=0){ L(g,G.X(st.m),G.Y(0.2),G.X(st.m),G.Y(1.0),C.red,2.5); T(g,'x̄ = 2.696',G.X(st.m),G.Y(1.05),C.red,12,'center','700'); }
    if(s.step>=1){ D5.forEach(function(v,i){ var y=0.45+i*0.1; L(g,G.X(st.m),G.Y(y),G.X(v),G.Y(y),C.gold,3); T(g,nf(v-st.m,3),G.X(v)+(v>st.m?6:-6),G.Y(y),C.gold,11,v>st.m?'left':'right','700'); }); }
    if(s.step>=2) band(g,G,st.m-st.s,st.m+st.s,0.2,0.98,alpha(C.gold,0.12));
    if(s.step>=3) band(g,G,st.m-st.u,st.m+st.u,0.2,0.98,alpha(C.red,0.22)); },
  out:steps(['平均：(2.69 + 2.70 + 2.68 + 2.71 + 2.70) ÷ 5 = <b>2.696</b> cm。','每個點離平均多遠（金色）：−0.006、+0.004、−0.016、+0.014、+0.004。平方加起來 = 0.000520。','樣本標準差：s = √(0.000520 ÷ <b>4</b>) = 0.0114 cm（分母是 n − 1）。','A 類不確定度：u = 0.0114 ÷ √5 = 0.00510 → 無條件進位留 2 位 = <b>0.0051 cm</b>。結果 (2.6960 ± 0.0051) cm。'])
});

/* F3 B 類 */
function ruler(g,G,C,a,b,d,y){ L(g,G.X(a),G.Y(y),G.X(b),G.Y(y),C.ink,1.5); var k=0; for(var v=Math.ceil(a/d-1e-9)*d; v<=b+1e-9; v+=d,k++){ var big=Math.abs(v/(d*5)-Math.round(v/(d*5)))<1e-6; L(g,G.X(v),G.Y(y),G.X(v),G.Y(y)+(big?14:8),C.ink,1); } }
widget('w-typeB',{state:{d:0.5},rw:0.45,rn:0.85,
  fmt:{d:function(v){return v.toFixed(1)+' cm';}},
  draw:function(g,c,s){ var C=c.C, d=s.d, ctr=12, G=frame(full(c),ctr-2.4*d,ctr+2.4*d,-1.6,1.6,24,false), u=d/(2*Math.sqrt(3));
    ruler(g,G,C,ctr-2.4*d,ctr+2.4*d,d,0.9); T(g,'尺的刻度（最小刻度 '+d.toFixed(1)+' cm）',G.X(ctr-2.35*d),G.Y(1.45),C.muted,12,'left');
    var tip=ctr+0.31*d; L(g,G.X(ctr-2.4*d),G.Y(1.15),G.X(tip),G.Y(1.15),C.blue,5); T(g,'物體末端',G.X(tip)+6,G.Y(1.15),C.blue,11,'left','700');
    L(g,G.X(ctr-d/2),G.Y(0.9),G.X(ctr-d/2),G.Y(-1.2),C.grid,1,[3,3]); L(g,G.X(ctr+d/2),G.Y(0.9),G.X(ctr+d/2),G.Y(-1.2),C.grid,1,[3,3]);
    box(g,G.X(ctr-d/2),G.Y(-0.1),d*G.sx,0.9*G.sy,alpha(C.teal,0.25),C.teal,2); T(g,'讀數可能在這一格的任何位置（機會一樣）',G.X(ctr),G.Y(-0.1)+14,C.teal,12,'center','700');
    L(g,G.X(ctr),G.Y(-1.0),G.X(ctr-u),G.Y(-1.0),C.red,4); L(g,G.X(ctr),G.Y(-1.0),G.X(ctr+u),G.Y(-1.0),C.red,4); dot(g,G.X(ctr),G.Y(-1.0),4,C.red);
    T(g,'±u',G.X(ctr+u)+6,G.Y(-1.0),C.red,12,'left','700');
    L(g,G.X(ctr),G.Y(-1.35),G.X(ctr+d/2),G.Y(-1.35),C.gold,2); T(g,'半格',G.X(ctr+d/4),G.Y(-1.35)+12,C.gold,11,'center','700'); },
  out:function(s){ var u=s.d/(2*Math.sqrt(3)), r=ceilSig2(u); return '最小刻度 '+s.d.toFixed(1)+' cm　→　u = '+s.d.toFixed(1)+' ÷ (2√3) = '+u.toFixed(4)+' → 無條件進位 <b>'+fixed(r.u,r.dec)+' cm</b>（約是半格的 58%）'; }
});
widget('s-F3',{state:{},steps:3,rw:0.45,rn:0.85,
  draw:function(g,c,s){ var C=c.C, d=1, ctr=1532, G=frame(full(c),ctr-1.6,ctr+1.6,-1.4,1.3,24,false), u=1/(2*Math.sqrt(3));
    ruler(g,G,C,ctr-1.6,ctr+1.6,1,0.9); [1531,1532,1533].forEach(function(v){ T(g,v+' mV',G.X(v),G.Y(0.9)+24,C.muted,11,'center'); });
    box(g,G.X(ctr-0.5),G.Y(-0.1),G.sx,0.7*G.sy,alpha(C.teal,0.25),C.teal,2);
    if(s.step>=1){ L(g,G.X(ctr),G.Y(-0.75),G.X(ctr+0.5),G.Y(-0.75),C.gold,3); T(g,'半格 0.5 mV',G.X(ctr+0.25),G.Y(-0.75)+13,C.gold,12,'center','700'); }
    if(s.step>=2){ L(g,G.X(ctr-u),G.Y(-1.15),G.X(ctr+u),G.Y(-1.15),C.red,4); T(g,'±0.29 mV',G.X(ctr+u)+8,G.Y(-1.15),C.red,12,'left','700'); } },
  out:steps(['顯示 1532 mV，真正的電壓在 1531.5～1532.5 mV 之間的任何地方都有可能（均勻分布，寬 1 mV）。','半格 = 0.5 mV，這是「最多差多少」，還不是不確定度。','均勻分布的標準差 = 半格 ÷ √3 = 0.5 ÷ 1.732 = 0.2887 → 無條件進位 <b>0.29 mV</b>。<br>讀數對齊到小數第二位：<b>(1532.00 ± 0.29) mV</b>。'])
});

/* F4 進位規則 */
function digitRow(g,x0,y,str,keepUpto,C,label,col){ T(g,label,x0-10,y,C.ink,14,'right','700'); var x=x0; for(var i=0;i<str.length;i++){ var ch=str[i], keep=i<=keepUpto; if(ch!=='.'){ box(g,x,y-15,24,30,keep?alpha(col,0.18):null,keep?col:C.grid,keep?2:1); } T(g,ch,x+(ch==='.'?4:12),y,keep?C.ink:C.muted,17,'center',keep?'700':'500'); x+=ch==='.'?10:28; } return x; }
var X4=15.23746;
widget('w-round',{state:{u:0.08412},rw:0.36,rn:0.7,
  fmt:{u:function(v){return v.toFixed(3);}},
  draw:function(g,c,s){ var C=c.C, r=ceilSig2(s.u), xs=X4.toFixed(5), us=s.u.toFixed(5), x0=Math.min(130,c.w*0.28), sc=c.narrow?0.8:1;
    g.save(); g.scale(sc,sc); var W=c.w/sc;
    var keepX=xs.indexOf('.')+r.dec; var lead=us.search(/[1-9]/), keepU=us.indexOf('.')+r.dec;
    T(g,'原始',x0-10,26,C.muted,12,'right'); T(g,'青綠格 = 要保留的位數',x0,26,C.teal,12,'left','700');
    var e1=digitRow(g,x0,70,us,keepU,C,'u',C.teal); T(g,'→ '+fixed(r.u,r.dec)+'（無條件進位）',e1+10,70,C.red,15,'left','700');
    var e2=digitRow(g,x0,130,xs,keepX,C,'X',C.teal); T(g,'→ '+fixed(Math.round(X4*Math.pow(10,r.dec))/Math.pow(10,r.dec),r.dec)+'（四捨五入）',e2+10,130,C.red,15,'left','700');
    g.restore(); },
  out:function(s){ var r=ceilSig2(s.u), xv=fixed(Math.round(X4*Math.pow(10,r.dec))/Math.pow(10,r.dec),r.dec); return 'u = '+s.u.toFixed(5)+' → <b>'+fixed(r.u,r.dec)+'</b>　X = 15.23746 → <b>'+xv+'</b>　結果 <b>('+xv+' ± '+fixed(r.u,r.dec)+')</b>'; }
});
widget('s-F4',{state:{},steps:3,rw:0.36,rn:0.7,
  draw:function(g,c,s){ var C=c.C, sc=c.narrow?0.8:1, x0=Math.min(130,c.w*0.28); g.save(); g.scale(sc,sc);
    var e1=digitRow(g,x0,50,'0.08412',s.step>=1?4:99,C,'u',C.teal); if(s.step>=1) T(g,'→ 0.085',e1+10,50,C.red,15,'left','700');
    if(s.step>=2){ var e2=digitRow(g,x0,120,'15.23746',5,C,'X',C.teal); T(g,'→ 15.237',e2+10,120,C.red,15,'left','700'); }
    g.restore(); },
  out:steps(['先處理不確定度 u = 0.08412。第一個非零數字是 8，在小數第二位。','保留 2 位有效數字到小數第三位，後面還有東西就<b>無條件進位</b>：0.08412 → <b>0.085</b>。','最佳估計值四捨五入到同一位（小數第三位）：15.23746 → <b>15.237</b>。結果 <b>(15.237 ± 0.085)</b>。'])
});

/* F5 A+B 組合：直角三角形 */
function uTri(g,c,C,a,b,la,lb,lc){ var m=Math.max(a,b)*1.25, G=frame(full(c),-0.15*m,m*1.25,-0.25*m,m*1.05,24,true);
  poly(g,G,[[0,0],[a,0],[a,b]],alpha(C.teal,0.08)); L(g,G.X(0),G.Y(0),G.X(a),G.Y(0),C.blue,5); L(g,G.X(a),G.Y(0),G.X(a),G.Y(b),C.gold,5); L(g,G.X(0),G.Y(0),G.X(a),G.Y(b),C.red,5);
  ra(g,G,[a,0],[-1,0],[0,1],0.06*m,C.ink);
  T(g,la,G.X(a/2),G.Y(0)+16,C.blue,13,'center','700'); T(g,lb,G.X(a)+8,G.Y(b/2),C.gold,13,'left','700'); T(g,lc,G.X(a/2)-10,G.Y(b/2)-10,C.red,13,'right','700'); }
widget('w-ab',{state:{a:0.12,b:0.05},rw:0.45,rn:0.85,
  fmt:{a:function(v){return v.toFixed(2);},b:function(v){return v.toFixed(2);}},
  draw:function(g,c,s){ uTri(g,c,c.C,s.a,s.b,'uA = '+s.a.toFixed(2),'uB = '+s.b.toFixed(2),'u = '+Math.hypot(s.a,s.b).toFixed(3)); },
  out:function(s){ var u=Math.hypot(s.a,s.b); return 'u = √('+s.a.toFixed(2)+'² + '+s.b.toFixed(2)+'²) = <b>'+u.toFixed(4)+'</b>　｜　直接相加 = '+(s.a+s.b).toFixed(2)+'（太大）　｜　u ≥ uB ✓'; }
});
widget('s-F5',{state:{},steps:3,rw:0.45,rn:0.85,
  draw:function(g,c,s){ uTri(g,c,c.C,0.12,s.step>=1?0.05:0.0001,'uA = 0.12（12）',s.step>=1?'uB = 0.05（5）':'',s.step>=2?'u = 0.13（13）':''); },
  out:steps(['A 類 0.12 Ω 當一股。','B 類 0.05 Ω 當另一股，兩者垂直（互相獨立）。','斜邊 = √(0.12² + 0.05²) = √0.0169 = <b>0.13 Ω</b>。就是 5-12-13 直角三角形！'])
});

/* F6 加減法 */
widget('w-addsub',{state:{ux:0.15,uy:0.2,op:1},rw:0.45,rn:0.9,
  fmt:{ux:function(v){return v.toFixed(2)+' g';},uy:function(v){return v.toFixed(2)+' g';},op:function(v){return v?'相減':'相加';}},
  draw:function(g,c,s){ var C=c.C, X=118.9, Y=35.2, Z=s.op?X-Y:X+Y, uz=Math.hypot(s.ux,s.uy), P=panels(c,0.55);
    var G=frame(P[0],0,170,-1,3.4,24,false); numLine(g,G,0,170,20,C,0,function(v){return v;});
    function item(v,u,y,col,lab){ var w=Math.max(u*30,1); box(g,G.X(v-w/2),G.Y(y)-9,w*G.sx,18,alpha(col,0.25),col,2); L(g,G.X(v),G.Y(y)-12,G.X(v),G.Y(y)+12,col,2); T(g,lab,G.X(v),G.Y(y)-20,col,12,'center','700'); }
    item(X,s.ux,2.6,C.blue,'X = 118.90 ± '+s.ux.toFixed(2)); item(Y,s.uy,1.5,C.gold,'Y = 35.20 ± '+s.uy.toFixed(2)); item(Z,uz,0.5,C.red,'Z = '+Z.toFixed(2)+' ± '+uz.toFixed(3));
    T(g,'（範圍寬度放大 30 倍顯示）',G.X(170),G.Y(3.3),C.muted,11,'right');
    var a=s.ux, b=s.uy, m=Math.max(a,b)*1.3, H=frame(P[1],-0.15*m,m*1.3,-0.3*m,m*1.1,20,true);
    poly(g,H,[[0,0],[a,0],[a,b]],alpha(C.teal,0.08)); L(g,H.X(0),H.Y(0),H.X(a),H.Y(0),C.blue,5); L(g,H.X(a),H.Y(0),H.X(a),H.Y(b),C.gold,5); L(g,H.X(0),H.Y(0),H.X(a),H.Y(b),C.red,5);
    T(g,'u(X)',H.X(a/2),H.Y(0)+15,C.blue,12,'center','700'); T(g,'u(Y)',H.X(a)+6,H.Y(b/2),C.gold,12,'left','700'); T(g,'u(Z)',H.X(a/2)-8,H.Y(b/2)-8,C.red,12,'right','700'); },
  out:function(s){ var uz=Math.hypot(s.ux,s.uy), r=ceilSig2(uz); return 'Z = X '+(s.op?'−':'+')+' Y = '+(s.op?83.70:154.10).toFixed(2)+' g　｜　u(Z) = √('+s.ux.toFixed(2)+'² + '+s.uy.toFixed(2)+'²) = '+uz.toFixed(4)+' → <b>'+fixed(r.u,r.dec)+' g</b>（加、減都一樣）'; }
});
widget('s-F6',{state:{},steps:3,rw:0.45,rn:0.85,
  draw:function(g,c,s){ uTri(g,c,c.C,0.20,s.step>=1?0.15:0.0001,'u(裝水後) = 0.20（4）',s.step>=1?'u(空杯) = 0.15（3）':'',s.step>=2?'u(水) = 0.25（5）':''); },
  out:steps(['水的質量 = 118.90 − 35.20 = <b>83.70 g</b>。','兩次測量的不確定度 0.20 g 和 0.15 g 互相獨立，像兩股互相垂直。','u = √(0.20² + 0.15²) = √0.0625 = <b>0.25 g</b>（3-4-5 三角形）。結果 <b>(83.70 ± 0.25) g</b>。'])
});

/* F7 乘除法：長方形 */
widget('w-muldiv',{state:{L:50,uL:1,W:20,uW:1},rw:0.5,rn:0.9,
  fmt:{L:function(v){return v+' cm';},uL:function(v){return v.toFixed(1);},W:function(v){return v+' cm';},uW:function(v){return v.toFixed(1);}},
  draw:function(g,c,s){ var C=c.C, G=frame(full(c),-6,66,-8,46,24,true), Lo=s.L+s.uL, Wo=s.W+s.uW, Li=s.L-s.uL, Wi=s.W-s.uW;
    box(g,G.X(0),G.Y(Wo),Lo*G.sx,Wo*G.sy,alpha(C.red,0.18),null); box(g,G.X(0),G.Y(Wi),Li*G.sx,Wi*G.sy,C.sheet,null);
    box(g,G.X(0),G.Y(s.W),s.L*G.sx,s.W*G.sy,alpha(C.teal,0.12),C.ink,2);
    box(g,G.X(0),G.Y(Wo),Lo*G.sx,Wo*G.sy,null,C.red,1); box(g,G.X(0),G.Y(Wi),Li*G.sx,Wi*G.sy,null,C.red,1);
    T(g,'長 '+s.L+' ± '+s.uL.toFixed(1),G.X(s.L/2),G.Y(0)+16,C.ink,12,'center','700'); T(g,'寬 '+s.W+' ± '+s.uW.toFixed(1),G.X(s.L)+10,G.Y(s.W/2),C.ink,12,'left','700');
    T(g,'紅色色帶 = 面積可能的範圍',G.X(0),G.Y(Wo)-12,C.red,12,'left','700'); },
  out:function(s){ var A=s.L*s.W, rL=s.uL/s.L, rW=s.uW/s.W, rA=Math.hypot(rL,rW), uA=rA*A, r=ceilSig2(uA); return '相對：u(長)/長 = '+(rL*100).toFixed(2)+'%　u(寬)/寬 = '+(rW*100).toFixed(2)+'%　→　u<sub>r</sub>(A) = √(…) = '+(rA*100).toFixed(2)+'%　→　u(A) = '+(rA*100).toFixed(2)+'% × '+A+' = '+uA.toFixed(2)+' → <b>'+fixed(r.u,r.dec)+' cm²</b>'; }
});
function pctBars(g,c,C,list){ var G=frame(full(c),0,1.3,-0.2,list.length+0.3,24,false); list.forEach(function(it,i){ var y=list.length-1-i+0.3; box(g,G.X(0),G.Y(y+0.5),it.v*G.sx,0.5*G.sy,alpha(it.col,0.3),it.col,2); T(g,it.lab,G.X(it.v)+8,G.Y(y+0.25),it.col,13,'left','700'); }); }
widget('s-F7',{state:{},steps:3,rw:0.4,rn:0.75,
  draw:function(g,c,s){ var C=c.C, L1=[{v:0.5,lab:'質量 0.3 ÷ 60.0 = 0.5%',col:C.blue},{v:1.0,lab:'體積 0.2 ÷ 20.0 = 1.0%',col:C.gold}];
    if(s.step>=1) L1.push({v:Math.hypot(0.5,1),lab:'密度 √(0.5² + 1.0²) = 1.12%',col:C.red}); pctBars(g,c,C,L1); },
  out:steps(['ρ = 60.0 ÷ 20.0 = <b>3.000 g/cm³</b>。除法要先換成百分比：質量 0.5%，體積 1.0%。','相對不確定度平方和開根號：√(0.5² + 1.0²) = <b>1.118%</b>（不是 1.5%）。','乘回密度：3.000 × 1.118% = 0.0335 → 無條件進位 <b>0.034</b>。結果 <b>(3.000 ± 0.034) g/cm³</b>。'])
});

/* F8 因次積木 */
var QTY=[{n:'速度 v',d:[0,1,-1],f:'長度 ÷ 時間'},{n:'加速度 a',d:[0,1,-2],f:'速度 ÷ 時間'},{n:'力 F',d:[1,1,-2],f:'質量 × 加速度'},{n:'動量 p',d:[1,1,-1],f:'質量 × 速度'},{n:'功 W／動能 K',d:[1,2,-2],f:'力 × 位移'},{n:'彈性常數 k',d:[1,0,-2],f:'力 ÷ 伸長量'},{n:'壓力 P',d:[1,-1,-2],f:'力 ÷ 面積'}];
function dimBars(g,c,C,d,target,title){ var G=frame(full(c),-0.5,3.5,-3.4,3.4,26,false); var labs=['M','L','T'];
  L(g,G.X(-0.3),G.Y(0),G.X(3.3),G.Y(0),C.ink,1.3); for(var y=-3;y<=3;y++){ if(y) { L(g,G.X(-0.3),G.Y(y),G.X(3.3),G.Y(y),C.grid,1); T(g,String(y).replace('-','−'),G.X(-0.3)-4,G.Y(y),C.muted,11,'right'); } }
  labs.forEach(function(l,i){ var x=0.5+i*1.1, v=d[i]; box(g,G.X(x-0.3),G.Y(Math.max(v,0)),0.6*G.sx,Math.abs(v)*G.sy,alpha([C.blue,C.teal,C.gold][i],0.45),[C.blue,C.teal,C.gold][i],2);
    if(target){ L(g,G.X(x-0.4),G.Y(target[i]),G.X(x+0.4),G.Y(target[i]),C.red,3,[6,3]); }
    T(g,l,G.X(x),G.Y(-3.3),C.ink,15,'center','700'); T(g,(v>0?'+':'')+String(v).replace('-','−'),G.X(x),G.Y(v)+(v>=0?-10:12),C.ink,12,'center','700'); });
  if(title) T(g,title,G.X(-0.4),G.Y(3.3),C.muted,12,'left','700'); }
function dimStr(d){ var s=''; ['M','L','T'].forEach(function(l,i){ if(d[i]===0) return; s+=l+(d[i]===1?'':String(d[i]).replace('-','⁻').replace('1','¹').replace('2','²').replace('0.5','½')); }); return '['+(s||'無因次')+']'; }
widget('w-dim',{state:{i:0},rw:0.4,rn:0.8,
  fmt:{i:function(v){return QTY[v].n;}},
  draw:function(g,c,s){ var q=QTY[s.i]; dimBars(g,c,c.C,q.d,null,q.n+' = '+q.f); },
  out:function(s){ var q=QTY[s.i]; return q.n+'：'+q.f+'　→　因次 <b>'+dimStr(q.d)+'</b>（M 次方 '+q.d[0]+'、L 次方 '+q.d[1]+'、T 次方 '+q.d[2]+'）'; }
});
widget('s-F8',{state:{},steps:3,rw:0.4,rn:0.8,
  draw:function(g,c,s){ var d=[[1,0,0],[0,1,-1],[1,1,-1]][s.step]; dimBars(g,c,c.C,d,null,['質量 m','速度 v','動量 p = m × v'][s.step]); },
  out:steps(['質量 m 的因次是 [M]。','速度 v = 位移 ÷ 時間，因次 [LT⁻¹]。','相乘就是把長條加起來：[M] × [LT⁻¹] = <b>[MLT⁻¹]</b>。注意力是 [MLT⁻²]，差在 T 多一次。'])
});

/* F9 因次分析 */
widget('w-dimsolve',{state:{a:1,b:0,c:0},rw:0.4,rn:0.85,
  fmt:{a:function(v){return nf(v,1);},b:function(v){return nf(v,1);},c:function(v){return nf(v,1);}},
  draw:function(g,c,s){ var d=[s.a, s.b+s.c, -2*s.c]; dimBars(g,c,c.C,d,[0,0,1],'長條 = m^a l^b g^c 的因次；紅虛線 = 週期的因次 [T]'); },
  out:function(s){ var d=[s.a,s.b+s.c,-2*s.c], ok=d[0]===0&&d[1]===0&&d[2]===1; return 'M：a = '+nf(s.a,1)+'　L：b + c = '+nf(d[1],1)+'　T：−2c = '+nf(d[2],1)+(ok?'　→　<b>全部對上！T = c·√(l／g)，跟質量無關</b>':'　→　還沒對上，目標是 (0, 0, 1)'); }
});
widget('s-F9',{state:{},steps:3,rw:0.4,rn:0.85,
  draw:function(g,c,s){ var d=[[1,0,0],[0.5,0,-1],[0,0,1]][s.step]; dimBars(g,c,c.C,s.step===0?[1,0,-2]:d,[0,0,1],['m 是 [M]，k 是 [MT⁻²]','試 a = ½、b = −½：m^½ k^(−½)','解出來：M 消掉、T 剛好 +1'][s.step]); },
  out:steps(['設 T = c·mᵃ·kᵇ。m 的因次 [M]，k 的因次 [MT⁻²]（圖是 k 的長條）。','M 的次方：a + b = 0；T 的次方：−2b = 1。','所以 b = −½、a = ½：T = c·m^½·k^(−½) = <b>c√(m／k)</b>。'])
});
`
};
