/* docs/TeachingMaterials/explanations/build/MathTm1.js — 2026-10-01 詳解補強：
   tm_1 高一下第三次段考（原始考卷題，14 題）。只補強說明與示意圖，不更動題目、答案。
   原詳解中「建議人工覆核」的題目（q2 圖形、q6 答案、qD／qF 考生手寫答案），
   補強內容如實保留這些提醒，不假裝確定。示意圖座標皆由題目數據實際計算。 */
"use strict";
const F = require("./SvgFigures");
const deg = (d) => d * Math.PI / 180;

/* tm_1_q1: A at origin, AB on the x-axis, ∠ABD = 90°, ∠ACD = 90° */
function q1Figure() {
  const a = 4, b = 2, th = deg(60);
  const AD = Math.hypot(a, b), phi = Math.atan2(b, a), AC = AD * Math.cos(th - phi);
  return F.shape({
    label: "四邊形 ABDC", width: 340,
    points: { A: [0, 0], B: [a, 0], D: [a, b], C: [AC * Math.cos(th), AC * Math.sin(th)] },
    labels: { A: [-12, 6], B: [10, 14], D: [12, -4], C: [-8, -10] },
    polygons: [["A", "B", "D", "C"]],
    segments: [{ a: "A", b: "D", color: "#9aa1ad", dash: "5 4" }, { a: "C", b: "D", color: "#7c5cff", width: 3, label: "CD = ?", ldx: 26, ldy: -6 }],
    rightAngles: [["A", "B", "D"], ["A", "C", "D"]],
    angleMarks: [{ at: "A", from: "B", to: "C", label: "θ", radius: 30 }, { at: "A", from: "B", to: "D", label: "φ", radius: 54, color: "#2563eb" }],
    sideLabels: [{ a: "A", b: "B", label: "a", dy: 18 }, { a: "B", b: "D", label: "b", dx: 12 }]
  });
}

/* tm_1_q3: circle radius 2; arcs AB = 90°, BC = 60°, CD = 60°, DA = 150° */
function q3Figure() {
  const R = 2, at = (d) => [R * Math.cos(deg(d)), R * Math.sin(deg(d))];
  return F.shape({
    label: "圓內接四邊形 ABCD", width: 320,
    points: { A: at(200), B: at(290), C: at(350), D: at(50), O: [0, 0] },
    labels: { A: [-12, 6], B: [0, 18], C: [14, 8], D: [8, -8], O: [-10, -6] },
    circles: [{ c: [0, 0], r: R }],
    polygons: [["A", "B", "C", "D"]],
    segments: [
      { a: "A", b: "C", color: "#9aa1ad", dash: "4 4" }, { a: "A", b: "D", color: "#9aa1ad", dash: "4 4" },
      { a: "C", b: "D", color: "#2563eb", width: 3, label: "CD = 2", ldx: 30 }, { a: "A", b: "B", color: "#7c5cff", width: 3, label: "AB = ?", ldx: -22, ldy: 14 }
    ],
    angleMarks: [{ at: "A", from: "C", to: "D", label: "30°", radius: 34, color: "#2563eb" }, { at: "C", from: "B", to: "A", label: "45°", radius: 30 }]
  });
}

/* tm_1_q5: cyclic quadrilateral AB = 8, BC = 5, CD = 3, DA = 5 → A = 60°, BD = 7 */
function q5Figure() {
  const R = 7 / Math.sqrt(3), central = (chord) => 2 * Math.asin(chord / (2 * R));
  let t = deg(150);
  const pos = {};
  [["A", 8], ["B", 5], ["C", 3], ["D", 5]].forEach(([k, chord]) => {
    pos[k] = [R * Math.cos(t), R * Math.sin(t)];
    t -= central(chord);
  });
  return F.shape({
    label: "圓內接四邊形 ABCD（AB=8、BC=5、CD=3、DA=5）", width: 340,
    points: pos,
    labels: { A: [-12, -6], B: [12, -6], C: [12, 14], D: [-12, 14] },
    circles: [{ c: [0, 0], r: R }],
    polygons: [["A", "B", "C", "D"]],
    segments: [{ a: "B", b: "D", color: "#7c5cff", width: 2.4, label: "BD = 7", ldx: -6, ldy: -14 }],
    sideLabels: [{ a: "A", b: "B", label: "8", dy: -8 }, { a: "B", b: "C", label: "5", dx: 12 }, { a: "C", b: "D", label: "3", dy: 18 }, { a: "D", b: "A", label: "5", dx: -12 }],
    angleMarks: [{ at: "A", from: "B", to: "D", label: "60°", radius: 26 }, { at: "C", from: "D", to: "B", label: "120°", radius: 22, color: "#2563eb" }]
  });
}

/* tm_1_q6: unit circle with the tangent lines x = 1 (through B) and y = 1 (through A) */
function q6Figure(thDeg, title) {
  const th = deg(thDeg), c = Math.cos(th), s = Math.sin(th), tan = Math.tan(th);
  const F1 = [1, tan];
  return F.unitCircle({
    label: title, scale: 95, extent: 1.75,
    segments: [
      { x1: 1, y1: -1.7, x2: 1, y2: 1.7, color: "#9aa1ad", width: 1 },
      { x1: -1.7, y1: 1, x2: 1.7, y2: 1, color: "#9aa1ad", width: 1 },
      { x1: c, y1: 0, x2: c, y2: s, color: "#16a34a", dash: "4 4", label: "CD", ldx: c > 0 ? 16 : -16 },
      { x1: 0, y1: 0, x2: c, y2: 0, color: "#2563eb", dash: "4 4", label: "OD", ldy: s > 0 ? 16 : -6 },
      { x1: 1, y1: 0, x2: F1[0], y2: F1[1], color: "#ef4444", width: 3, label: "BF", ldx: 18 },
      { x1: 0, y1: 0, x2: F1[0], y2: F1[1], color: "#9aa1ad", dash: "3 4", width: 1.2 }
    ],
    angles: [{ rad: th, length: 1, label: "", color: "#7c5cff" }],
    arcs: [{ from: 0, to: th, label: "θ", radius: 0.25 }],
    points: [
      { x: c, y: s, label: "C", color: "#7c5cff", dy: s > 0 ? -10 : 18 }, { x: c, y: 0, label: "D", dy: s > 0 ? 16 : -8 },
      { x: 1, y: 0, label: "B", dx: 12, dy: 16 }, { x: 0, y: 1, label: "A", dx: -12, dy: -6 }, { x: F1[0], y: F1[1], label: "F", color: "#ef4444", dx: 14 }
    ]
  });
}

function q6FigureQ1() { return q6Figure(50, "θ 在第一象限"); }
function q6FigureQ2() { return q6Figure(130, "θ 在第二象限"); }

module.exports = [
  {
    questionId: "tm_1_q1",
    concept: "看到兩個直角（∠ABD = ∠ACD = 90°）共用斜邊 AD，就把 AD 當成「橋樑」：先用 a、b 表示 AD 與它的方向角 φ，再用差角公式。",
    steps: [
      "△ABD 中 ∠B = 90°：AD = √(a² + b²)。設 ∠BAD = φ，則 cosφ = a/AD、sinφ = b/AD。",
      "∠BAC = θ，所以 ∠DAC = θ − φ。",
      "△ACD 中 ∠C = 90°、斜邊 AD：CD = AD·sin∠DAC = AD·sin(θ − φ)。",
      "展開：AD·(sinθ cosφ − cosθ sinφ) = sinθ·(AD cosφ) − cosθ·(AD sinφ) = a sinθ − b cosθ。",
      "所以 CD = a sinθ − b cosθ，選 (5)。"
    ],
    pitfalls: ["把 ∠DAC 當成 θ（忘了扣掉 φ）。", "差角公式 sin(θ − φ) 中間是減號，寫成加號會選到 (1)。"],
    figures: [{ svg: q1Figure(), caption: "AD 是兩個直角三角形共用的斜邊；∠DAC = θ − φ，CD 是 △ACD 中 ∠DAC 的對邊。（示意圖取 a = 4、b = 2、θ = 60°）" }]
  },
  {
    questionId: "tm_1_q2",
    concept: "等腰直角三角形可以直接設邊長，把角放進直角三角形，用「對邊 ÷ 鄰邊」求 tan。",
    steps: [
      "直角在 B，AB = BC = 1（斜邊 AC = √2）。",
      "D 是 BC 中點，BD = 1/2。",
      "△ABD 在 B 是直角：∠DAB 的對邊是 BD、鄰邊是 AB。",
      "tan∠DAB = BD / AB = (1/2) / 1 = 1/2，選 (1)。"
    ],
    pitfalls: ["把 tan 寫成 對邊 ÷ 斜邊（那是 sin）。", "以為 D 是 AC 的中點。"],
    note: "原始試卷照片中此小圖的直角位置與邊長標示較不清楚，以上依「√2 標在 AC」推定直角在 B；若與原圖不同，請以原圖為準。",
    figures: [{
      svg: F.shape({
        label: "等腰直角三角形 ABC，D 為 BC 中點", width: 260,
        points: { A: [0, 1], B: [0, 0], C: [1, 0], D: [0.5, 0] },
        labels: { A: [-10, -6], B: [-10, 14], C: [10, 14], D: [0, 18] },
        polygons: [["A", "B", "C"]],
        segments: [{ a: "A", b: "D", color: "#7c5cff", width: 2.4 }],
        rightAngles: [["A", "B", "C"]],
        angleMarks: [{ at: "A", from: "B", to: "D", label: "", radius: 30 }],
        sideLabels: [{ a: "A", b: "B", label: "1", dx: -12 }, { a: "B", b: "D", label: "1/2", dx: -4, dy: -8 }, { a: "A", b: "C", label: "√2", dx: 14, dy: -6 }]
      }),
      caption: "紅色弧是 ∠DAB：對邊 BD = 1/2、鄰邊 AB = 1。"
    }]
  },
  {
    questionId: "tm_1_q3",
    concept: "正弦定理的圓周角形式：圓內任一弦長 = 2R × sin（它所對的圓周角）。同一個圓，先用已知的弦求 R，再求另一條弦。",
    steps: [
      "弦 CD 所對的圓周角是 ∠CAD = 30°：CD = 2R·sin30° → 2 = 2R × 1/2 → R = 2。",
      "弦 AB 所對的圓周角是 ∠ACB = 45°：AB = 2R·sin45° = 4 × √2/2 = 2√2。",
      "選 (2)。"
    ],
    pitfalls: ["找錯「所對」的角：弦 AB 要看頂點在圓上、兩邊分別經過 A 與 B 的角，也就是 ∠ACB。", "把 2R 算成 R。"],
    figures: [{ svg: q3Figure(), caption: "藍色弦 CD 對 30° 的圓周角，紫色弦 AB 對 45° 的圓周角；兩者共用同一個外接圓（R = 2）。" }]
  },
  {
    questionId: "tm_1_q4",
    concept: "終邊上一點 P(x, y)：tanθ = y/x、sinθ = y/r、cosθ = x/r，r = √(x² + y²) 永遠是正的。",
    steps: [
      "tanθ = y/x = −5√2 / x = √2 → x = −5，所以 (1) 錯、(2) 對。",
      "P(−5, −5√2) 在第三象限。r = √(25 + 50) = √75 = 5√3。",
      "sinθ = y/r = −5√2 / 5√3 = −√6/3（有理化：√2/√3 = √6/3），所以 (3) 錯、(4) 對。",
      "cosθ = x/r = −5 / 5√3 = −√3/3，所以 (5) 對。",
      "答案 (2)(4)(5)。"
    ],
    pitfalls: ["tanθ > 0 不代表在第一象限；y 是負的，x 也得是負的，所以在第三象限。", "把 r 取成負數。"],
    figures: [{
      svg: F.unitCircle({
        label: "P(−5, −5√2) 在第三象限", scale: 100, extent: 1.3,
        angles: [{ rad: Math.atan2(-5 * Math.SQRT2, -5), label: "", color: "#7c5cff" }],
        arcs: [{ from: 0, to: Math.atan2(-5 * Math.SQRT2, -5) + 2 * Math.PI, label: "θ", radius: 0.2, labelOffset: 0.12 }],
        segments: [
          { x1: -0.577, y1: 0, x2: -0.577, y2: -0.816, dash: "4 4", label: "y = −5√2", ldx: -38 },
          { x1: 0, y1: 0, x2: -0.577, y2: 0, dash: "4 4", label: "x = −5", ldx: -14, ldy: 18 },
          { x1: 0, y1: 0, x2: -0.577, y2: -0.816, color: "#7c5cff", width: 2.2, label: "r = 5√3", ldx: 30, ldy: 6 }
        ],
        points: [{ x: -0.577, y: -0.816, label: "P", color: "#7c5cff", dx: -10, dy: 18 }]
      }),
      caption: "P 在第三象限：x、y 都是負的，r = 5√3。"
    }]
  },
  {
    questionId: "tm_1_q5",
    concept: "圓內接四邊形的對角互補（∠A + ∠C = 180°，所以 cosC = −cosA）。對角線 BD 同時屬於 △ABD 和 △CBD，用餘弦定理寫兩次、聯立求出 cosA。",
    steps: [
      "△ABD：BD² = 8² + 5² − 2·8·5·cosA = 89 − 80cosA。",
      "△CBD：∠C = 180° − A，cosC = −cosA：BD² = 5² + 3² + 2·5·3·cosA = 34 + 30cosA。",
      "聯立：89 − 80cosA = 34 + 30cosA → 110cosA = 55 → cosA = 1/2，A = 60°。",
      "BD² = 89 − 40 = 49，BD = 7，所以 (1) 錯。∠C = 120°，sin∠C = √3/2，所以 (2) 錯。",
      "△BCD 面積 = ½·5·3·sin120° = 15√3/4，(3) 對。△ABD 面積 = ½·8·5·sin60° = 10√3，四邊形 = 10√3 + 15√3/4 = 55√3/4，(4) 對。",
      "外接圓：BD / sinA = 2R → 7 / (√3/2) = 2R → R = 7/√3 = 7√3/3，(5) 對。答案 (3)(4)(5)。"
    ],
    pitfalls: ["忘了 cos(180° − A) = −cosA，兩個式子用同一個符號就解不出來。", "求外接圓時用錯角：BD 對的是 ∠A（或 ∠C），sin60° = sin120°，兩者結果相同。"],
    figures: [{ svg: q5Figure(), caption: "對角線 BD 把四邊形分成兩個三角形；∠A = 60°、∠C = 120° 互補。（依題目邊長實際繪製）" }]
  },
  {
    questionId: "tm_1_q6",
    concept: "單位圓上 C = (cosθ, sinθ)；終邊（或其延長線）與切線 x = 1 交於 F = (1, tanθ)。「長度」一定是正的，「坐標」可正可負，判斷選項時要分清楚。",
    steps: [
      "若 θ 在第一象限：CD = sinθ、OD = cosθ、BF = tanθ、CD² + OD² = 1、BF = CD/OD（相似三角形 △OBF ∼ △ODC），(1)～(5) 全部成立。",
      "若 θ 在第二象限：sinθ > 0，CD = sinθ 仍成立；但 cosθ < 0，長度 OD = −cosθ，所以 (2) 不成立；F 在 x 軸下方，長度 BF = −tanθ，所以 (3)、(5) 也不成立；(4) CD² + OD² = 1 仍成立。",
      "也就是說：(4) 在任何象限都成立；其他選項是否成立，取決於圖中 θ 實際在哪個象限，以及題目是否把線段當成「有向線段」。"
    ],
    pitfalls: ["把坐標（可能是負的）直接當成長度。", "沒有先確認 θ 所在象限就判斷選項。"],
    note: "本題答案 (3)(4) 取自原始試卷考生的作答標記；上面兩種象限的分析都與 (3)(4) 不完全一致，代表原題圖形或題意（例如是否為有向線段）需要對照原始試卷確認。請老師或家長覆核後再以此為準。",
    figures: [
      { svg: q6FigureQ1(), caption: "θ 在第一象限：CD = sinθ、OD = cosθ、BF = tanθ，都是正的。" },
      { svg: q6FigureQ2(), caption: "θ 在第二象限：延長線交切線 x = 1 於 x 軸下方的 F，長度 BF = −tanθ、OD = −cosθ。" }
    ]
  },
  {
    questionId: "tm_1_qA",
    concept: "正弦定理：BC / sin∠BPC = 2R（外接圓直徑）。P 在圓上任何位置（同一側弧上），∠BPC 都一樣大。",
    steps: [
      "圓的直徑 2R = 3，弦 BC = 1。",
      "BC / sin∠BPC = 2R → 1 / sin∠BPC = 3。",
      "sin∠BPC = 1/3。",
      "另一種看法：取 B 的對徑點 B'，∠BB'C = ∠BPC（同弧所對的圓周角），且 ∠BCB' = 90°（直徑所對的圓周角），所以 sin∠BPC = BC / BB' = 1/3。"
    ],
    pitfalls: ["把直徑 3 當成半徑，算出 1/6。"],
    figures: [{
      svg: (function () {
        const R = 1.5, c = Math.asin(1 / 3);
        const B = [R * Math.cos(deg(200)), R * Math.sin(deg(200))];
        const Cang = deg(200) + 2 * c;
        const Cp = [R * Math.cos(Cang), R * Math.sin(Cang)];
        return F.shape({
          label: "直徑 3 的圓與弦 BC = 1", width: 300,
          points: { B: B, C: Cp, "B'": [-B[0], -B[1]], P: [R * Math.cos(deg(70)), R * Math.sin(deg(70))] },
          labels: { B: [-12, 4], C: [-12, 14], "B'": [14, -4], P: [0, -10] },
          circles: [{ c: [0, 0], r: R }],
          polygons: [["B", "C", "B'"]],
          segments: [{ a: "P", b: "B", color: "#7c5cff", dash: "4 4" }, { a: "P", b: "C", color: "#7c5cff", dash: "4 4" }, { a: "B", b: "C", color: "#ef4444", width: 3, label: "1", ldx: -14, ldy: 10 }],
          rightAngles: [["B", "C", "B'"]],
          angleMarks: [{ at: "B'", from: "B", to: "C", label: "", radius: 40 }, { at: "P", from: "B", to: "C", label: "", radius: 36, color: "#7c5cff" }],
          extraText: [{ x: -0.7, y: 0.95, s: "BB' = 3（直徑）", color: "#6b7280" }]
        });
      })(),
      caption: "∠BPC 與 ∠BB'C 對同一段弧，大小相同；△BCB' 在 C 是直角，所以 sin = 1/3。"
    }]
  },
  {
    questionId: "tm_1_qB",
    concept: "D 在 BC 上，∠ADB 與 ∠ADC 互補（cos 值互為相反數）。先在已知三邊的 △ABD 求 cos∠ADB，再到 △ADC 用餘弦定理求 AC。",
    steps: [
      "△ABD 三邊已知（AB = 7、BD = 4、AD = 5）：cos∠ADB = (5² + 4² − 7²)/(2·5·4) = (25 + 16 − 49)/40 = −1/5。",
      "∠ADC = 180° − ∠ADB，所以 cos∠ADC = 1/5。",
      "△ADC：AC² = 5² + 6² − 2·5·6·(1/5) = 25 + 36 − 12 = 49。",
      "AC = 7。"
    ],
    pitfalls: ["忘了互補角的 cos 要變號，會得到 AC² = 73。", "餘弦定理中 cos 對應的角要夾在兩邊中間：求 cos∠ADB 時分母是 2·AD·BD。"],
    figures: [{
      svg: F.shape({
        label: "△ABC 與 BC 上的點 D", width: 340,
        points: { B: [0, 0], D: [4, 0], C: [10, 0], A: [5, Math.sqrt(24)] },
        labels: { B: [-10, 14], D: [0, 18], C: [10, 14], A: [0, -10] },
        polygons: [["A", "B", "C"]],
        segments: [{ a: "A", b: "D", color: "#7c5cff", width: 2.4, label: "5", ldx: -10 }],
        sideLabels: [{ a: "A", b: "B", label: "7", dx: -12 }, { a: "B", b: "D", label: "4", dy: 18 }, { a: "D", b: "C", label: "6", dy: 18 }, { a: "A", b: "C", label: "AC = ?", dx: 30 }],
        angleMarks: [{ at: "D", from: "B", to: "A", label: "", radius: 20 }, { at: "D", from: "A", to: "C", label: "", radius: 26, color: "#2563eb" }]
      }),
      caption: "D 點兩側的角互補（紅、藍兩弧合起來是 180°），所以 cos∠ADC = −cos∠ADB。"
    }]
  },
  {
    questionId: "tm_1_qC",
    concept: "角平分線長度可用「面積拆分」：△ABC 的面積 = △ABD + △ADC，三個面積都用 ½·兩邊·sin夾角 表示。",
    steps: [
      "∠BAC = 60° + 60° = 120°。",
      "[△ABC] = ½·6·3·sin120° = 9·(√3/2)。",
      "[△ABD] + [△ADC] = ½·6·AD·sin60° + ½·3·AD·sin60° = ½·AD·(√3/2)·9。",
      "兩者相等：½·AD·(√3/2)·9 = 9·(√3/2)，得 AD = 2。"
    ],
    pitfalls: ["誤用 ∠BAC = 60°（題目給的是兩半各 60°）。", "以為 D 是 BC 中點（角平分線不一定平分對邊）。"],
    figures: [{
      svg: F.shape({
        label: "△ABC 與角平分線 AD", width: 320,
        points: { A: [0, 0], B: [3, 3 * Math.sqrt(3)], C: [1.5, -1.5 * Math.sqrt(3)], D: [2, 0] },
        labels: { A: [-12, 4], B: [10, -4], C: [10, 14], D: [12, 16] },
        polygons: [["A", "B", "C"]],
        fills: ["rgba(124,92,255,0.08)"],
        segments: [{ a: "A", b: "D", color: "#7c5cff", width: 2.6 }],
        sideLabels: [{ a: "A", b: "B", label: "6", dx: -12 }, { a: "A", b: "C", label: "3", dx: -12 }],
        angleMarks: [{ at: "A", from: "D", to: "B", label: "60°", radius: 24 }, { at: "A", from: "C", to: "D", label: "60°", radius: 30, color: "#2563eb" }],
        extraText: [{ x: 2.75, y: 0.15, s: "AD = ?", color: "#7c5cff", size: 13 }]
      }),
      caption: "AD 把 △ABC 切成兩塊，面積相加等於整個三角形。（依題目數據實際繪製）"
    }]
  },
  {
    questionId: "tm_1_qD",
    concept: "方位角題先畫圖：以恆春為原點、正南方為基準，兩個位置與正南方的夾角相加，就是兩條距離之間的夾角，再用餘弦定理。",
    steps: [
      "東南方 = 南偏東 45°；南 15° 西 = 南偏西 15°。兩個方向在正南方的兩側，夾角 = 45° + 15° = 60°。",
      "颱風移動距離² = 800² + 500² − 2·800·500·cos60° = 640000 + 250000 − 400000 = 490000。",
      "距離 = 700 公里。",
      "平均速度 = 700 ÷ 100 = 7 公里/小時。"
    ],
    pitfalls: ["把兩個方位角相減（45° − 15° = 30°）；兩者在南方的不同側，要相加。", "忘了除以時間 100 小時。"],
    note: "原始試卷上考生的手寫答案是 3，與此推導結果 7 不同；經重新驗算，7 才是正確答案，建議老師覆核。",
    figures: [{
      svg: F.shape({
        label: "颱風位置方位圖", width: 320,
        points: { "恆春": [0, 0], P1: [800 * Math.sin(deg(45)), -800 * Math.cos(deg(45))], P2: [-500 * Math.sin(deg(15)), -500 * Math.cos(deg(15))], S: [0, -820] },
        hide: ["S"],
        labels: { "恆春": [0, -10], P1: [14, 12], P2: [-14, 12] },
        segments: [
          { a: "恆春", b: "S", color: "#9aa1ad", dash: "5 4" },
          { a: "恆春", b: "P1", color: "#2563eb", label: "800", ldx: 16 },
          { a: "恆春", b: "P2", color: "#16a34a", label: "500", ldx: -26, ldy: 10 },
          { a: "P1", b: "P2", color: "#ef4444", width: 2.6, label: "700", ldy: 18 }
        ],
        angleMarks: [{ at: "恆春", from: "S", to: "P1", label: "45°", radius: 40, color: "#2563eb" }, { at: "恆春", from: "P2", to: "S", label: "15°", radius: 80, color: "#16a34a" }],
        extraText: [{ x: 0, y: -870, s: "正南", color: "#6b7280" }]
      }),
      caption: "P1（東南方 800 公里）與 P2（南偏西 15°、500 公里）在正南方兩側，夾角 60°，移動距離 700 公里。"
    }]
  },
  {
    questionId: "tm_1_qE",
    concept: "已知三邊求面積，用海龍公式：s = (a + b + c)/2，面積 = √(s(s − a)(s − b)(s − c))。",
    steps: [
      "s = (5 + 6 + 7)/2 = 9。",
      "s − a、s − b、s − c 分別是 4、3、2。",
      "面積 = √(9 × 4 × 3 × 2) = √216 = √(36 × 6) = 6√6。",
      "驗算：用餘弦定理求最大角 cos = (25 + 36 − 49)/(2·5·6) = 1/5，sin = √24/5，面積 = ½·5·6·√24/5 = 3√24 = 6√6，一致。"
    ],
    pitfalls: ["s 忘了除以 2。", "√216 化簡錯（216 = 36 × 6）。"],
    figures: []
  },
  {
    questionId: "tm_1_qF",
    concept: "先認出 3-4-5 直角三角形（直角在 C），用「面積一半」得到 AP·AQ 的固定值，再用餘弦定理寫出 PQ²，最後用算幾不等式求最小值。",
    steps: [
      "3² + 4² = 5²，直角在 C。∠A 的鄰邊 AC = 4、對邊 BC = 3、斜邊 AB = 5：cosA = 4/5、sinA = 3/5。",
      "△ABC 面積 = ½·3·4 = 6，一半是 3。設 AP = p、AQ = q：½·p·q·sinA = 3 → ½·p·q·(3/5) = 3 → pq = 10。",
      "PQ² = p² + q² − 2pq·cosA = p² + q² − 2·10·(4/5) = p² + q² − 16。",
      "算幾不等式：p² + q² ≥ 2pq = 20，等號在 p = q = √10 時成立；√10 ≈ 3.16 小於 AC = 4 與 AB = 5，P、Q 都在線段上。",
      "PQ² 的最小值 = 20 − 16 = 4，PQ 最小值 = 2。"
    ],
    pitfalls: ["忘了檢查等號成立時 P、Q 是否還在線段上。", "把 cosA 取成 3/5（那是 sinA）。"],
    note: "原始試卷上考生的手寫答案是 3，與此推導結果 2 不同；經重新驗算，2 才是正確答案，建議老師覆核。",
    figures: [{
      svg: (function () {
        const A = [4, 0], B = [0, 3], Cc = [0, 0], p = Math.sqrt(10);
        const P = [A[0] + (B[0] - A[0]) * p / 5, A[1] + (B[1] - A[1]) * p / 5];
        const Q = [A[0] - p, 0];
        return F.shape({
          label: "PQ 平分 △ABC 的面積", width: 320,
          points: { A: A, B: B, C: Cc, P: P, Q: Q },
          labels: { A: [12, 14], B: [-10, -6], C: [-10, 14], P: [8, -10], Q: [0, 18] },
          polygons: [["A", "B", "C"], ["A", "P", "Q"]],
          fills: [null, "rgba(124,92,255,0.18)"],
          segments: [{ a: "P", b: "Q", color: "#7c5cff", width: 2.8, label: "PQ", ldx: -14 }],
          rightAngles: [["A", "C", "B"]],
          sideLabels: [{ a: "A", b: "B", label: "5", dx: 12, dy: -6 }, { a: "B", b: "C", label: "3", dx: -12 }, { a: "C", b: "A", label: "4", dy: 18 }]
        });
      })(),
      caption: "塗色的 △APQ 面積是全部的一半；PQ 最短時 AP = AQ = √10。"
    }]
  },
  {
    questionId: "tm_1_qG",
    concept: "終邊在直線上 → 先求 tanθ；分子、分母都是 sinθ、cosθ 的一次式時，同除以 cosθ 就能全部換成 tanθ。",
    steps: [
      "直線 2x + y = 0 上的點滿足 y = −2x，所以 tanθ = y/x = −2（終邊在第二或第四象限都一樣）。",
      "分子分母同除以 cosθ：(2cosθ − sinθ)/(3sinθ − cosθ) = (2 − tanθ)/(3tanθ − 1)。",
      "代入 tanθ = −2：(2 + 2)/(−6 − 1) = 4/(−7) = −4/7。"
    ],
    pitfalls: ["把斜率算成 2（忘了 y = −2x 的負號）。", "只除分子沒除分母。"],
    figures: [{
      svg: F.plot({
        label: "直線 2x + y = 0", x: [-2.2, 2.2], y: [-4.4, 4.4], w: 300, h: 300,
        curves: [{ f: (x) => -2 * x, label: "y = −2x", labelAt: -1.6 }],
        points: [{ x: -1, y: 2, label: "(−1, 2)", dx: -30 }, { x: 1, y: -2, label: "(1, −2)", dx: 30 }],
        xTicks: [{ v: -1, label: "−1" }, { v: 1, label: "1" }], yTicks: [{ v: 2, label: "2" }, { v: -2, label: "−2" }]
      }),
      caption: "終邊在第二象限（過 (−1, 2)）或第四象限（過 (1, −2)），tanθ 都是 −2。"
    }]
  },
  {
    questionId: "tm_1_qH",
    concept: "看到 sinθ + cosθ 想求 sinθcosθ：把兩邊平方，利用 sin²θ + cos²θ = 1。",
    steps: [
      "(sinθ + cosθ)² = sin²θ + 2sinθcosθ + cos²θ = 1 + 2sinθcosθ。",
      "(√5/2)² = 5/4，所以 1 + 2sinθcosθ = 5/4。",
      "2sinθcosθ = 1/4，sinθcosθ = 1/8。",
      "合理性：θ 為銳角時 sinθcosθ > 0，1/8 是正的，符合。"
    ],
    pitfalls: ["平方時漏掉中間項 2sinθcosθ。", "求出 2sinθcosθ = 1/4 後忘了再除以 2。"],
    figures: []
  }
];
