/* docs/TeachingMaterials/explanations/build/MathTm7.js — 2026-10-01 詳解補強：
   tm_7 第1章 三角函數（23 題）。每題答案均已獨立驗算（見 BuildMathExplanations.js
   的 checks），內容只補強說明，不更動原題目與答案。 */
"use strict";
const F = require("./SvgFigures");
const PI = Math.PI;
const deg = (d) => d * PI / 180;

function vectorFig(aNum, aLabel, bNum, bLabel, rLabel, alphaLabel, label) {
  const r = Math.hypot(aNum, bNum), ux = aNum / r, uy = bNum / r, alpha = Math.atan2(bNum, aNum);
  return F.unitCircle({
    label: label, scale: 100, extent: 1.3,
    segments: [
      { x1: 0, y1: 0, x2: ux, y2: 0, color: F.COLORS.blue, dash: "4 4", label: "a = " + aLabel, ldy: uy >= 0 ? 16 : -8 },
      { x1: ux, y1: 0, x2: ux, y2: uy, color: F.COLORS.green, dash: "4 4", label: "b = " + bLabel, ldx: ux >= 0 ? 26 : -26 },
      /* r label beside the middle of the vector, offset perpendicular to it */
      { x1: 0, y1: 0, x2: ux, y2: uy, color: F.COLORS.brand, width: 2.2, label: rLabel, ldx: -uy * 18, ldy: -ux * 18 }
    ],
    arcs: [{ from: alpha < 0 ? alpha : 0, to: alpha < 0 ? 0 : alpha, label: alphaLabel, radius: 0.2, labelOffset: 0.5 }],
    points: [{ x: ux, y: uy, label: "(a, b)", color: F.COLORS.brand, dx: ux >= 0 ? 30 : -30, dy: uy >= 0 ? 0 : 14 }]
  });
}

const piTicks = (list) => list.map(([v, label]) => ({ v: v, label: label }));

module.exports = [
  {
    questionId: "tm_7_q1",
    concept: "弧度與度數的換算關係是「π 弳 = 180°」，所以弧度換成度數時乘上 180°/π。",
    steps: [
      "由 π 弳 = 180° 得到：1 弳 = 180°/π。",
      "5π/6 弳 × 180°/π：分子分母的 π 互相約掉，剩下 5 × 180° ÷ 6。",
      "180° ÷ 6 = 30°，再乘 5 得 150°。",
      "合理性檢查：5π/6 介於 π/2（90°）與 π（180°）之間，150° 也落在 90°～180°，終邊在第二象限，一致。"
    ],
    pitfalls: ["換算方向弄反，誤乘 π/180°。", "把 π 當成 3.14 代入，算出 150° 的近似小數而無法對應選項。"],
    figures: [{
      svg: F.unitCircle({ label: "5π/6 弳的終邊", angles: [{ rad: 5 * PI / 6, label: "150°" }], arcs: [{ from: 0, to: 5 * PI / 6, label: "5π/6", radius: 0.3 }] }),
      caption: "從 x 軸正向逆時針轉 5π/6 弳（150°），終邊落在第二象限。"
    }]
  },
  {
    questionId: "tm_7_q2",
    concept: "度數換成弧度時乘上 π/180°，再把分數約到最簡。",
    steps: [
      "210° × π/180° = 210π/180。",
      "210 和 180 的最大公因數是 30：210π/180 = 7π/6。",
      "另一種想法：210° = 180° + 30°，所以是 π + π/6 = 7π/6。",
      "合理性檢查：7π/6 比 π 多一點，終邊在第三象限，與 210° 一致。"
    ],
    pitfalls: ["只約了一半（例如寫成 21π/18 沒有化簡）而找不到選項。", "與 5π/6（150°）混淆：150° 在第二象限、210° 在第三象限。"],
    figures: [{
      svg: F.unitCircle({ label: "210° 的終邊", angles: [{ rad: 7 * PI / 6, label: "210°" }, { rad: PI, label: "π", color: F.COLORS.muted, length: 1 }], arcs: [{ from: 0, to: 7 * PI / 6, label: "7π/6", radius: 0.3 }] }),
      caption: "210° 比半圈（π）再多轉 30°（π/6），所以是 7π/6，終邊在第三象限。"
    }]
  },
  {
    questionId: "tm_7_q3",
    concept: "扇形弧長公式 s = rθ，其中 θ 一定要用「弳」。",
    steps: [
      "題目給 r = 6 公分、θ = π/3 弳（已經是弧度，可以直接代）。",
      "s = rθ = 6 × π/3 = 2π 公分。",
      "驗算：整個圓周長 2πr = 12π；π/3 佔一整圈 2π 的 1/6，所以弧長 = 12π ÷ 6 = 2π，一致。"
    ],
    pitfalls: ["把 θ 寫成 60（度）代入，得到 360 這種錯誤數值。", "和扇形面積公式 ½r²θ 混用。"],
    figures: [{
      svg: F.sector({ label: "半徑 6、圓心角 π/3 的扇形", thetaDeg: 60, rLabel: "r = 6", angleLabel: "θ = π/3", arcLabel: "s = 2π" }),
      caption: "弧長 s 是圓心角所對的那段圓弧長度：s = rθ。"
    }]
  },
  {
    questionId: "tm_7_q4",
    concept: "扇形面積公式 A = ½ r² θ（θ 用弳）。它是「圓面積 πr² × 圓心角佔整圈的比例 θ/2π」化簡而來。",
    steps: [
      "r = 4、θ = 2π/3，代入 A = ½ × r² × θ。",
      "r² = 16，½ × 16 = 8。",
      "A = 8 × 2π/3 = 16π/3 平方公分。",
      "驗算：整個圓面積 16π，2π/3 佔一整圈的 1/3，16π ÷ 3 = 16π/3，一致。"
    ],
    pitfalls: ["忘了乘 ½，得到 32π/3。", "半徑沒有平方，得到 4π/3。"],
    figures: [{
      svg: F.sector({ label: "半徑 4、圓心角 2π/3 的扇形面積", thetaDeg: 120, rLabel: "r = 4", angleLabel: "2π/3", arcLabel: "", shade: true, areaLabel: "A" }),
      caption: "塗色區域就是扇形面積，佔整個圓的 1/3。"
    }]
  },
  {
    questionId: "tm_7_q5",
    concept: "由弧長公式 s = rθ 反推圓心角：θ = s / r（得到的是弳）。",
    steps: [
      "s = 2π、r = 4。",
      "θ = s / r = 2π / 4 = π/2 弳。",
      "驗算：圓周長 2π × 4 = 8π，弧長 2π 佔 1/4 圈，四分之一圈正是 π/2（90°）。"
    ],
    pitfalls: ["寫成 r / s 而算出 2/π。", "求出 π/2 後又多乘 180/π，把答案寫成 90 而找不到選項（選項是弳）。"],
    figures: [{
      svg: F.sector({ label: "弧長 2π、半徑 4 的扇形", thetaDeg: 90, rLabel: "r = 4", angleLabel: "θ = π/2", arcLabel: "s = 2π" }),
      caption: "弧長是圓周長的 1/4，所以圓心角是 1/4 圈 = π/2。"
    }]
  },
  {
    questionId: "tm_7_q6",
    concept: "一般正弦函數 y = a·sin(b(x − h)) + k：振幅 = |a|，週期 = 2π/|b|，中線 y = k，圖形向右平移 h。",
    steps: [
      "先把括號內的 2 提出：2x − π/3 = 2(x − π/6)，得到 y = 3 sin(2(x − π/6)) + 1。",
      "振幅 = |a| = 3（最高點 1 + 3 = 4，最低點 1 − 3 = −2）。",
      "週期 = 2π / |b| = 2π / 2 = π。",
      "所以答案是「振幅 3，週期 π」。另外可知：中線 y = 1，圖形是 y = 3sin 2x 向右平移 π/6、向上平移 1。"
    ],
    pitfalls: ["把平移量看成 π/3：一定要先提出 b，平移量是 π/3 ÷ 2 = π/6。", "把 +1 當成振幅；+1 只是上下平移。", "週期誤算為 2π（忽略了 b = 2）。"],
    figures: [{
      svg: F.plot({
        label: "y = 3sin(2x − π/3) + 1 的圖形", x: [0, 2 * PI], y: [-2.6, 4.8],
        curves: [{ f: (x) => 3 * Math.sin(2 * x - PI / 3) + 1 }],
        hlines: [{ v: 1, label: "中線 y = 1" }],
        yTicks: [{ v: 4, label: "4" }, { v: 1, label: "1" }, { v: -2, label: "−2" }],
        xTicks: piTicks([[PI / 6, "π/6"], [7 * PI / 6, "7π/6"], [2 * PI, "2π"]]),
        bands: [{ x: 5 * PI / 12, y1: 1, y2: 4, label: "振幅 3" }],
        spans: [{ x1: PI / 6, x2: 7 * PI / 6, y: -2.3, label: "一個週期 = π" }]
      }),
      caption: "曲線在中線 y = 1 上下各擺動 3（振幅 3）；從 π/6 到 7π/6 走完一個完整的波（週期 π）。"
    }]
  },
  {
    questionId: "tm_7_q7",
    concept: "y = tan x = sin x / cos x：cos x = 0 的地方沒有定義（出現鉛直漸近線），週期是 π，值域是全體實數，圖形對稱於原點（奇函數）。",
    steps: [
      "(A) 週期是 π 不是 2π，而且 x = π/2 + nπ 處沒有定義，所以定義域不是全體實數 → 錯。",
      "(B) 週期 π；cos x = 0 的 x = π/2 + nπ 處分母為 0，沒有定義 → 正確。",
      "(C) 週期不是 π/2；tan x 可以取任何實數，值域不是 [−1, 1]（那是 sin、cos 的值域）→ 錯。",
      "(D) tan(−x) = −tan x，圖形對稱於原點，不是 y 軸 → 錯。"
    ],
    pitfalls: ["把 sin、cos 的週期 2π 和值域 [−1, 1] 直接套到 tan。", "把奇函數（對稱原點）和偶函數（對稱 y 軸）弄混；cos 才是對稱於 y 軸。"],
    figures: [{
      svg: F.plot({
        label: "y = tan x 的圖形", x: [-3 * PI / 2, 3 * PI / 2], y: [-4, 4],
        curves: [{ f: (x) => (Math.abs(Math.cos(x)) < 0.02 ? NaN : Math.tan(x)) }],
        vlines: [{ v: -PI / 2, color: "#ef4444", label: "x = −π/2" }, { v: PI / 2, color: "#ef4444", label: "x = π/2" }],
        xTicks: piTicks([[-PI, "−π"], [0, "0"], [PI, "π"]]),
        yTicks: [{ v: 1, label: "1" }, { v: -1, label: "−1" }]
      }),
      caption: "紅色虛線是沒有定義的位置（漸近線），每隔 π 重複一次；曲線上下無限延伸，所以值域是全體實數。"
    }]
  },
  {
    questionId: "tm_7_q8",
    concept: "圖形平移的規則：左右平移改的是 x（向左 c 單位：x 換成 x + c），上下平移改的是整個函數值（向下 d 單位：整體減 d）。",
    steps: [
      "向左平移 π/4：把 x 換成 x + π/4，得到 y = sin(x + π/4)。",
      "再向下平移 2：整個函數減 2，得到 y = sin(x + π/4) − 2。",
      "驗算一個點：原本 (0, 0) 在 y = sin x 上，平移後應到 (−π/4, −2)；代入 sin(−π/4 + π/4) − 2 = −2，正確。"
    ],
    pitfalls: ["「向左」誤寫成 x − π/4（左右方向和直覺相反：向左是加）。", "把 −2 寫進括號裡（那會變成左右平移）。", "選項 (D) y = sin x − π/4 − 2 是把 π/4 放在外面，變成上下平移，錯誤。"],
    figures: [{
      svg: F.plot({
        label: "y = sin x 平移成 y = sin(x + π/4) − 2", x: [-PI, 2 * PI], y: [-3.4, 1.6],
        curves: [
          { f: (x) => Math.sin(x), color: "#9aa1ad", dash: "6 5", label: "y = sin x", labelAt: 1.55 * PI },
          { f: (x) => Math.sin(x + PI / 4) - 2, label: "平移後", labelAt: 1.75 * PI, labelDy: 34 }
        ],
        points: [{ x: 0, y: 0, label: "(0, 0)", color: "#6b7280", dx: 22 }, { x: -PI / 4, y: -2, label: "(−π/4, −2)", dy: 20 }],
        xTicks: piTicks([[-PI, "−π"], [-PI / 4, "−π/4"], [PI, "π"], [2 * PI, "2π"]]),
        yTicks: [{ v: 1, label: "1" }, { v: -2, label: "−2" }]
      }),
      caption: "灰色虛線是原圖，紫色是先左移 π/4、再下移 2 的結果；原點對應到 (−π/4, −2)。"
    }]
  },
  {
    questionId: "tm_7_q9",
    concept: "y = a·cos(bx)：振幅 |a|，週期 2π/|b|。b 小於 1 時圖形被「拉寬」，週期變長。",
    steps: [
      "a = 2，振幅 = 2。",
      "b = 1/2，週期 = 2π ÷ (1/2) = 2π × 2 = 4π。",
      "所以是「振幅 2，週期 4π」。"
    ],
    pitfalls: ["把 2π ÷ (1/2) 算成 2π × ½ = π（除以分數要乘倒數）。", "把 1/2 當成振幅。"],
    figures: [{
      svg: F.plot({
        label: "y = 2cos(x/2) 的圖形", x: [0, 4 * PI], y: [-2.6, 2.8],
        curves: [{ f: (x) => 2 * Math.cos(x / 2) }, { f: (x) => Math.cos(x), color: "#9aa1ad", dash: "6 5" }],
        xTicks: piTicks([[PI, "π"], [2 * PI, "2π"], [3 * PI, "3π"], [4 * PI, "4π"]]),
        yTicks: [{ v: 2, label: "2" }, { v: -2, label: "−2" }],
        bands: [{ x: 0.15, y1: 0, y2: 2, label: "振幅 2" }],
        spans: [{ x1: 0, x2: 4 * PI, y: -2.35, label: "一個週期 = 4π" }]
      }),
      caption: "紫色 y = 2cos(x/2) 要到 4π 才完成一個週期；灰色虛線 y = cos x 只要 2π。"
    }]
  },
  {
    questionId: "tm_7_q10",
    concept: "y = a·sin(bx) + k（a > 0）的最大值是 k + a、最小值是 k − a。所以 a = (最大 − 最小)/2，k = (最大 + 最小)/2。",
    steps: [
      "由題意：k + a = 5、k − a = −1。",
      "兩式相減：2a = 6，a = 3。",
      "兩式相加：2k = 4，k = 2。",
      "驗算：中線 y = 2，上下各擺動 3，最高 5、最低 −1，符合題意。"
    ],
    pitfalls: ["把 k 算成最大值和最小值的差。", "忘記 a 是「一半」的差，算成 a = 6。"],
    figures: [{
      svg: F.plot({
        label: "最大值 5、最小值 −1 的正弦曲線", x: [0, 2 * PI], y: [-1.8, 5.8],
        curves: [{ f: (x) => 3 * Math.sin(x) + 2 }],
        hlines: [{ v: 5, label: "最大值 5", color: "#16a34a" }, { v: 2, label: "中線 k = 2" }, { v: -1, label: "最小值 −1", color: "#ef4444" }],
        yTicks: [{ v: 5, label: "5" }, { v: 2, label: "2" }, { v: -1, label: "−1" }],
        bands: [{ x: PI / 2, y1: 2, y2: 5, label: "a = 3" }]
      }),
      caption: "中線在最高與最低的正中間（k = 2），振幅是中線到最高點的距離（a = 3）。"
    }]
  },
  {
    questionId: "tm_7_q11",
    concept: "105° 不是特殊角，但可以拆成兩個特殊角：105° = 60° + 45°，再用和角公式 sin(A + B) = sinA cosB + cosA sinB。",
    steps: [
      "sin105° = sin(60° + 45°)。",
      "= sin60°·cos45° + cos60°·sin45°。",
      "= (√3/2)(√2/2) + (1/2)(√2/2) = √6/4 + √2/4。",
      "= (√6 + √2)/4。",
      "數值檢查：(2.449 + 1.414)/4 ≈ 0.966，而 sin105° = sin75° ≈ 0.966，一致。"
    ],
    pitfalls: ["誤用 sin(A + B) = sinA + sinB（和角公式不能直接拆開相加）。", "把結果寫成 (√6 − √2)/4，那是 sin15° 的值。"],
    figures: [{
      svg: F.unitCircle({ label: "105° = 60° + 45°", angles: [{ rad: deg(60), color: "#2563eb" }, { rad: deg(105), label: "105°" }], arcs: [{ from: 0, to: deg(60), label: "60°", radius: 0.25, color: "#2563eb" }, { from: deg(60), to: deg(105), label: "45°", radius: 0.42 }] }),
      caption: "先轉 60° 再多轉 45°，就到 105°，因此可以套用和角公式。"
    }]
  },
  {
    questionId: "tm_7_q12",
    concept: "cos(α + β) = cosα cosβ − sinα sinβ。題目只給了 sinα 和 cosβ，要先用直角三角形（或 sin² + cos² = 1）求出另外兩個值，並由象限決定正負。",
    steps: [
      "sinα = 3/5、α 在第一象限：畫出對邊 3、斜邊 5 的直角三角形，鄰邊 = 4，所以 cosα = 4/5（第一象限取正）。",
      "cosβ = 5/13、β 在第一象限：鄰邊 5、斜邊 13，對邊 = 12，所以 sinβ = 12/13。",
      "cos(α + β) = (4/5)(5/13) − (3/5)(12/13) = 20/65 − 36/65 = −16/65。",
      "合理性：α ≈ 36.9°、β ≈ 67.4°，α + β ≈ 104.3° 超過 90°，cos 為負，與 −16/65 一致。"
    ],
    pitfalls: ["和角公式的 cos 中間是減號（cos(α + β) = coscos − sinsin），寫成加號會得到 56/65。", "忘了求 cosα、sinβ，直接拿題目給的值亂代。"],
    figures: [{
      svg: F.shape({
        label: "α 與 β 的直角三角形（示意，未依比例）", width: 380,
        points: { O1: [0, 0], P1: [4, 0], Q1: [4, 3], O2: [6, 0], P2: [7.5, 0], Q2: [7.5, 3.6] },
        hide: ["O1", "P1", "Q1", "O2", "P2", "Q2"],
        polygons: [["O1", "P1", "Q1"], ["O2", "P2", "Q2"]],
        rightAngles: [["O1", "P1", "Q1"], ["O2", "P2", "Q2"]],
        angleMarks: [{ at: "O1", from: "P1", to: "Q1", label: "α" }, { at: "O2", from: "P2", to: "Q2", label: "β" }],
        sideLabels: [
          { a: "O1", b: "P1", label: "4", dy: 16 }, { a: "P1", b: "Q1", label: "3", dx: 12 }, { a: "O1", b: "Q1", label: "5", dx: -8, dy: -8 },
          { a: "O2", b: "P2", label: "5", dy: 16 }, { a: "P2", b: "Q2", label: "12", dx: 14 }, { a: "O2", b: "Q2", label: "13", dx: -12, dy: -4 }
        ]
      }),
      caption: "左：sinα = 3/5 → 鄰邊 4，cosα = 4/5；右：cosβ = 5/13 → 對邊 12，sinβ = 12/13。"
    }]
  },
  {
    questionId: "tm_7_q13",
    concept: "15° = 45° − 30°，用差角公式 tan(A − B) = (tanA − tanB) / (1 + tanA·tanB)，最後把分母有理化。",
    steps: [
      "tan45° = 1、tan30° = 1/√3。",
      "tan15° = (1 − 1/√3) / (1 + 1·1/√3)；分子分母同乘 √3：(√3 − 1)/(√3 + 1)。",
      "分母有理化：分子分母同乘 (√3 − 1)，分子 (√3 − 1)² = 4 − 2√3，分母 (√3)² − 1² = 2。",
      "tan15° = (4 − 2√3)/2 = 2 − √3。",
      "數值檢查：2 − 1.732 = 0.268，tan15° ≈ 0.268，一致。"
    ],
    pitfalls: ["差角公式分母是「1 + tanA tanB」，寫成減號會錯。", "得到 2 + √3（≈ 3.73）那是 tan75°；15° 很小，tan 值一定小於 1。"],
    figures: []
  },
  {
    questionId: "tm_7_q14",
    concept: "二倍角公式：sin2θ = 2 sinθ cosθ；cos2θ = 1 − 2sin²θ（也等於 cos²θ − sin²θ）。先由象限決定 cosθ 的正負。",
    steps: [
      "sinθ = 4/5、θ 在第二象限：可想成終邊上點 (−3, 4)、r = 5，所以 cosθ = −3/5（第二象限 x 為負）。",
      "sin2θ = 2 × (4/5) × (−3/5) = −24/25。",
      "cos2θ = 1 − 2 × (4/5)² = 1 − 32/25 = −7/25。",
      "驗算：cos²θ − sin²θ = 9/25 − 16/25 = −7/25，一致。",
      "合理性：θ ≈ 126.9°，2θ ≈ 253.7° 在第三象限，sin、cos 都是負的，符合。"
    ],
    pitfalls: ["忘了第二象限 cosθ < 0，取成 +3/5，sin2θ 就變成正的。", "cos2θ 用 1 − 2sin²θ 時忘了平方。"],
    figures: [{
      svg: F.unitCircle({
        label: "sinθ = 4/5 的第二象限角", angles: [{ rad: Math.atan2(4, -3), label: "r = 5", labelRadius: 0.55 }],
        arcs: [{ from: 0, to: Math.atan2(4, -3), label: "θ", radius: 0.22 }],
        segments: [{ x1: -0.6, y1: 0, x2: -0.6, y2: 0.8, dash: "4 4", label: "4", ldx: -12 }, { x1: 0, y1: 0, x2: -0.6, y2: 0, dash: "4 4", label: "−3", ldy: 16 }],
        points: [{ x: -0.6, y: 0.8, label: "(−3, 4)", color: "#7c5cff" }]
      }),
      caption: "終邊上的點 (−3, 4)：x 為負，所以 cosθ = −3/5。"
    }]
  },
  {
    questionId: "tm_7_q15",
    concept: "半角公式 sin(θ/2) = ±√((1 − cosθ)/2)，正負號由 θ/2 所在象限決定，不是由 θ 決定。",
    steps: [
      "90° < θ < 180°，兩邊除以 2：45° < θ/2 < 90°，θ/2 在第一象限，所以 sin(θ/2) > 0，取正號。",
      "(1 − cosθ)/2 = (1 − (−3/5))/2 = (8/5)/2 = 4/5。",
      "sin(θ/2) = √(4/5) = 2/√5 = 2√5/5。",
      "數值檢查：cosθ = −3/5 時 θ ≈ 126.9°，θ/2 ≈ 63.4°，sin63.4° ≈ 0.894；2√5/5 ≈ 0.894，一致。"
    ],
    pitfalls: ["用 1 + cosθ（那是 cos(θ/2) 的公式），會得到 √5/5。", "看到 θ 在第二象限就以為 θ/2 也是負的或在第二象限。"],
    figures: [{
      svg: F.unitCircle({
        label: "θ 與 θ/2", angles: [{ rad: Math.atan2(4, -3), label: "θ" }, { rad: Math.atan2(4, -3) / 2, label: "θ/2", color: "#16a34a" }],
        arcs: [{ from: 0, to: Math.atan2(4, -3) / 2, label: "", radius: 0.3, color: "#16a34a" }, { from: Math.atan2(4, -3) / 2, to: Math.atan2(4, -3), label: "", radius: 0.3 }]
      }),
      caption: "θ（約 126.9°）在第二象限，但 θ/2（約 63.4°）在第一象限，所以 sin(θ/2) 取正。"
    }]
  },
  {
    questionId: "tm_7_q16",
    concept: "疊合：a sin x + b cos x = r sin(x + α)，其中 r = √(a² + b²)，cosα = a/r、sinα = b/r。可以把 (a, b) 想成平面上的一個點，r 是它到原點的距離，α 是它的方向角。",
    steps: [
      "a = 1、b = 1，r = √(1² + 1²) = √2。",
      "cosα = 1/√2、sinα = 1/√2，α 在第一象限，α = π/4。",
      "sin x + cos x = √2 sin(x + π/4)。",
      "sin(x + π/4) 的最大值是 1，所以原式最大值 = √2。"
    ],
    pitfalls: ["以為 sin x 和 cos x 的最大值都是 1，就把最大值算成 2；兩者不會同時等於 1。", "r 算成 a + b = 2。"],
    figures: [{
      svg: vectorFig(1, "1", 1, "1", "r = √2", "α = π/4", "疊合 (a, b) = (1, 1)"),
      caption: "(a, b) = (1, 1)：到原點距離 r = √2，方向角 α = π/4。"
    }]
  },
  {
    questionId: "tm_7_q17",
    concept: "疊合時 b 可以是負數：a sin x + b cos x = r sin(x + α)，cosα = a/r、sinα = b/r，b < 0 表示 α 在第四象限（取負角）。",
    steps: [
      "a = √3、b = −1，r = √(3 + 1) = 2。",
      "cosα = √3/2、sinα = −1/2，α 在第四象限，α = −π/6。",
      "√3 sin x − cos x = 2 sin(x − π/6)。",
      "sin 的最小值是 −1，所以原式最小值 = 2 × (−1) = −2。"
    ],
    pitfalls: ["把最小值寫成 −√3（只看 sin x 前面的係數）。", "疊合後的最小值是 −r，不是 −(a + b)。"],
    figures: [{
      svg: vectorFig(Math.sqrt(3), "√3", -1, "−1", "r = 2", "α = −π/6", "疊合 (a, b) = (√3, −1)"),
      caption: "(a, b) = (√3, −1) 在第四象限：r = 2，α = −π/6。最大值 2、最小值 −2。"
    }]
  },
  {
    questionId: "tm_7_q18",
    concept: "先疊合成 r sin(x + α)，最大值是 r；最大值發生在 x + α = π/2 + 2nπ，再解出範圍內的 x。",
    steps: [
      "a = 1、b = √3，r = √(1 + 3) = 2。",
      "cosα = 1/2、sinα = √3/2，α = π/3；原式 = 2 sin(x + π/3)。",
      "最大值 2 發生在 x + π/3 = π/2（再加 2nπ），所以 x = π/6 + 2nπ。",
      "在 0 ≤ x < 2π 內只有 x = π/6。驗算：sin(π/6) + √3 cos(π/6) = 1/2 + 3/2 = 2，正確。"
    ],
    pitfalls: ["誤以為最大值是 1 + √3（兩項不會同時取最大）。", "解出 x + π/3 = π/2 後忘了移項，寫成 x = π/2。"],
    figures: [{
      svg: F.plot({
        label: "y = sin x + √3 cos x = 2sin(x + π/3)", x: [0, 2 * PI], y: [-2.6, 2.8],
        curves: [{ f: (x) => Math.sin(x) + Math.sqrt(3) * Math.cos(x) }],
        points: [{ x: PI / 6, y: 2, label: "最大值 2（x = π/6）", dx: 58 }],
        xTicks: piTicks([[PI / 6, "π/6"], [PI, "π"], [2 * PI, "2π"]]),
        yTicks: [{ v: 2, label: "2" }, { v: -2, label: "−2" }]
      }),
      caption: "在 0 ≤ x < 2π 內，曲線只在 x = π/6 達到最高點 2。"
    }]
  },
  {
    questionId: "tm_7_q19",
    concept: "疊合後的振幅 r = √(a² + b²)，與 b 的正負無關（平方後都是正的）。",
    steps: [
      "a = 4、b = −3。",
      "r = √(4² + (−3)²) = √(16 + 9) = √25 = 5。",
      "所以 4 sin x − 3 cos x 的值介於 −5 和 5 之間。"
    ],
    pitfalls: ["寫成 4 − 3 = 1 或 4 + 3 = 7。", "忘了開根號，答成 25。"],
    figures: [{
      svg: vectorFig(4, "4", -3, "−3", "r = 5", "α", "疊合 (a, b) = (4, −3)"),
      caption: "(4, −3) 到原點的距離是 5（3-4-5 直角三角形），這就是 r。"
    }]
  },
  {
    questionId: "tm_7_q20",
    concept: "疊合只改變振幅與起點（相位），不改變週期：a sin x + b cos x 的週期仍是 2π。",
    steps: [
      "a = 2、b = 2，r = √(4 + 4) = √8 = 2√2。",
      "cosα = sinα = 1/√2，α = π/4；y = 2√2 sin(x + π/4)。",
      "x 前面的係數仍是 1，週期 = 2π/1 = 2π。",
      "答案：振幅 2√2，週期 2π。"
    ],
    pitfalls: ["振幅算成 2 + 2 = 4。", "以為疊合後週期會變（例如變成 π）；只有 x 的係數改變才會改週期。"],
    figures: [{
      svg: F.plot({
        label: "y = 2sin x + 2cos x = 2√2 sin(x + π/4)", x: [0, 2 * PI], y: [-3.4, 3.6],
        curves: [{ f: (x) => 2 * Math.sin(x) + 2 * Math.cos(x) }],
        bands: [{ x: PI / 4, y1: 0, y2: 2 * Math.SQRT2, label: "振幅 2√2" }],
        spans: [{ x1: 0, x2: 2 * PI, y: -3.1, label: "週期 2π" }],
        xTicks: piTicks([[PI / 4, "π/4"], [PI, "π"], [2 * PI, "2π"]]),
        yTicks: [{ v: 2 * Math.SQRT2, label: "2√2" }, { v: -2 * Math.SQRT2, label: "−2√2" }]
      }),
      caption: "最高點 2√2 ≈ 2.83，一個完整的波仍是 2π。"
    }]
  },
  {
    questionId: "tm_7_q21",
    concept: "兩直線斜率 m₁、m₂，夾角 θ 滿足 tanθ = |(m₁ − m₂)/(1 + m₁m₂)|（取絕對值得到銳角）。這是差角公式 tan(A − B) 的應用：斜率就是傾斜角的 tan 值。",
    steps: [
      "m₁ = 2、m₂ = 1/3。",
      "m₁ − m₂ = 2 − 1/3 = 5/3；1 + m₁m₂ = 1 + 2/3 = 5/3。",
      "tanθ = |(5/3)/(5/3)| = 1。",
      "θ 是銳角且 tanθ = 1，所以 θ = 45°。"
    ],
    pitfalls: ["分母寫成 1 − m₁m₂。", "沒加絕對值時可能得到 −1，對應的是鈍角 135°；題目問的是銳夾角。"],
    figures: [{
      svg: F.plot({
        label: "兩直線 y = 2x + 3 與 y = x/3 − 2", x: [-6, 1.5], y: [-6.5, 4.5],
        curves: [
          { f: (x) => 2 * x + 3, color: "#2563eb", label: "y = 2x + 3", labelAt: -1.6 },
          { f: (x) => x / 3 - 2, color: "#16a34a", label: "y = x/3 − 2", labelAt: 0.4, labelDy: 26 }
        ],
        points: [{ x: -3, y: -3, label: "交點 (−3, −3)，夾角 45°", dx: 92, dy: 20 }],
        xTicks: [{ v: -3, label: "−3" }], yTicks: [{ v: -3, label: "−3" }]
      }),
      caption: "兩直線交於 (−3, −3)，銳夾角 45°。"
    }]
  },
  {
    questionId: "tm_7_q22",
    concept: "a sin x + b cos x = r sin(x + α)，α 由 cosα = a/r、sinα = b/r 共同決定。兩者的正負號決定 α 在哪一個象限。",
    steps: [
      "a = −√3、b = 1，r = √(3 + 1) = 2。",
      "cosα = −√3/2 < 0、sinα = 1/2 > 0，α 在第二象限。",
      "參考角是 π/6，第二象限：α = π − π/6 = 5π/6。",
      "驗算：2 sin(x + 5π/6) = 2[sin x·(−√3/2) + cos x·(1/2)] = −√3 sin x + cos x，正確。答案 (2, 5π/6)。"
    ],
    pitfalls: ["只看 sinα = 1/2 就選 π/6（那時 cosα 會是正的，不符合）。", "把 a、b 的角色對調：cosα 對應的是 sin x 的係數 a。"],
    figures: [{
      svg: vectorFig(-Math.sqrt(3), "−√3", 1, "1", "r = 2", "α = 5π/6", "疊合 (a, b) = (−√3, 1)"),
      caption: "(−√3, 1) 在第二象限，方向角 α = 5π/6。"
    }]
  },
  {
    questionId: "tm_7_q23",
    concept: "有限制區間時，不能直接用全域最小值 −r；要看「括號內的角」在區間內實際能走到哪裡，再比較端點與轉折點。",
    steps: [
      "疊合：a = 1、b = −1，r = √2，α = −π/4，f(x) = √2 sin(x − π/4)。",
      "0 ≤ x ≤ π 時，x − π/4 介於 −π/4 到 3π/4。",
      "sin 在 −π/4 到 π/2 遞增、π/2 到 3π/4 遞減，所以最小值出現在端點：比較 sin(−π/4) = −√2/2 與 sin(3π/4) = √2/2。",
      "最小值是 √2 × (−√2/2) = −1，發生在 x = 0；驗算 f(0) = sin0 − cos0 = −1。",
      "全域最小值 −√2 需要 x − π/4 = −π/2，即 x = −π/4，不在題目給的範圍內。"
    ],
    pitfalls: ["直接回答 −√2（忽略 0 ≤ x ≤ π 的限制）。", "只檢查轉折點、沒有檢查區間端點。"],
    figures: [{
      svg: F.plot({
        label: "f(x) = sin x − cos x 在 0 ≤ x ≤ π", x: [-PI / 2, 2 * PI], y: [-2.3, 1.9],
        curves: [
          { f: (x) => Math.sin(x) - Math.cos(x), color: "#9aa1ad", dash: "6 5" },
          { f: (x) => Math.sin(x) - Math.cos(x), from: 0, to: PI }
        ],
        vlines: [{ v: 0, label: "x = 0" }, { v: PI, label: "x = π" }],
        points: [{ x: 0, y: -1, label: "區間最小值 −1", dx: 50, dy: -10 }, { x: -PI / 4, y: -Math.SQRT2, label: "全域最小 −√2（不在範圍內）", color: "#6b7280", dx: 72, dy: 22 }],
        xTicks: piTicks([[-PI / 4, "−π/4"], [3 * PI / 4, "3π/4"], [PI, "π"]]),
        yTicks: [{ v: 1, label: "1" }, { v: -1, label: "−1" }]
      }),
      caption: "紫色實線是題目限定的 0 ≤ x ≤ π：最低點在左端點 x = 0，值為 −1；全域最低點 −√2 在 x = −π/4，超出範圍。"
    }]
  }
];
