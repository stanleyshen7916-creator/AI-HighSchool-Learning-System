/* docs/TeachingMaterials/explanations/build/PhysicsTm11.js — 2026-10-01 詳解補強：
   tm_11 高二物理 第2章 直線運動（23 題）。只補強說明與示意圖，不更動題目、答案。
   所有 x-t、v-t、a-t 圖與數線都依題目數據實際計算繪製；面積標示即為題目所求的位移或速度變化。 */
"use strict";
const F = require("./SvgFigures");
const C = F.COLORS;
const tk = (vals, fmt) => vals.map((v) => ({ v: v, label: fmt ? fmt(v) : String(v) }));

/* v-t straight line v = v0 + a t, with optional shaded areas */
function vt(o) {
  return F.plot({
    label: o.label, x: [0, o.tMax], y: o.y, w: 420, h: 240,
    axes: { x: "t (s)", y: "v (m/s)" },
    curves: [{ f: o.f, label: o.curveLabel, labelAt: o.labelAt, labelDy: o.labelDy }],
    xTicks: tk(o.xt), yTicks: tk(o.yt),
    areas: o.areas || [], points: o.points || [], vlines: o.vlines || []
  });
}

const throwUp = (t) => 30 - 10 * t;

module.exports = [
  {
    questionId: "tm_11_q1",
    concept: "位移只看「起點到終點」（有方向），路徑長是「實際走過的長度」（沒有方向，一律相加）。",
    steps: [
      "取東為正。向東 8 m 是 +8，向西 3 m 是 −3。",
      "位移 = 終點位置 − 起點位置 = (+8) + (−3) = +5 m，也就是向東 5 m。",
      "路徑長 = 8 + 3 = 11 m（往回走的 3 m 也要算進去）。"
    ],
    pitfalls: ["把路徑長也寫成 8 − 3 = 5 m。", "位移只寫 5 m 卻沒寫方向。"],
    figures: [{
      svg: F.numberLine({
        label: "位移與路徑長", min: -1, max: 10, ticks: [0, 3, 5, 8], unit: "m",
        arrows: [
          { from: 0, to: 8, row: 2, label: "向東 8 m", color: C.blue },
          { from: 8, to: 5, row: 1, label: "向西 3 m", color: C.orange },
          { from: 0, to: 5, row: 0, label: "位移 +5 m", color: C.green }
        ],
        points: [{ v: 0, label: "起點" }, { v: 5, label: "終點", color: C.green }]
      }),
      caption: "藍＋橘是實際走過的路（共 11 m）；綠色箭頭從起點直接指向終點，才是位移（向東 5 m）。"
    }]
  },
  {
    questionId: "tm_11_q2",
    concept: "平均速度 = 位移 ÷ 時間（有方向）；平均速率 = 路徑長 ÷ 時間（沒有方向）。兩者分子不同。",
    steps: [
      "由上題：位移 = +5 m（向東），路徑長 = 11 m。",
      "平均速度 = 5 ÷ 5 = 1 m/s，方向向東。",
      "平均速率 = 11 ÷ 5 = 2.2 m/s。",
      "有折返時，平均速率一定大於平均速度的大小；只有一路不回頭時兩者才相等。"
    ],
    pitfalls: ["把兩個分子對調（用路徑長算平均速度）。"],
    figures: []
  },
  {
    questionId: "tm_11_q3",
    concept: "x-t 圖：割線斜率 = 平均速度，切線斜率 = 瞬時速度。",
    steps: [
      "斜率 = Δx ÷ Δt，單位 m/s，正是速度的定義。",
      "取兩點連成割線，斜率是這段時間的平均速度。",
      "讓兩點無限靠近，割線變成切線，斜率就是該時刻的瞬時速度。"
    ],
    pitfalls: ["以為 x-t 圖的斜率是加速度（那是 v-t 圖的斜率）。"],
    figures: [{
      svg: F.plot({
        label: "x-t 圖與切線", x: [0, 4], y: [-2, 16], w: 420, h: 240,
        axes: { x: "t (s)", y: "x (m)" },
        curves: [
          { f: (t) => t * t, label: "x = t²", labelAt: 3.6 },
          { f: (t) => 4 * t - 4, color: C.red, dash: "6 4", width: 1.8, label: "切線斜率 = 4 m/s", labelAt: 3.0, labelDy: 40, from: 1, to: 3.5 }
        ],
        xTicks: tk([1, 2, 3, 4]), yTicks: tk([4, 8, 12, 16]),
        points: [{ x: 2, y: 4, label: "t = 2 s", dx: -26, dy: -6 }]
      }),
      caption: "以 x = t² 為例：t = 2 s 時切線（紅色虛線）的斜率是 4，就是那一瞬間的速度 4 m/s。"
    }]
  },
  {
    questionId: "tm_11_q4",
    concept: "v-t 圖下的面積 = 位移。時間軸上方的面積算正、下方算負；路徑長則要把兩邊都當正的加起來。",
    steps: [
      "面積的單位是 (m/s) × s = m，所以代表「位移」。",
      "以 v = 6 − 2t（0～5 s）為例：0～3 s 在時間軸上方，面積 = ½ × 3 × 6 = +9 m。",
      "3～5 s 在下方，面積 = ½ × 2 × 4 = 4 m，算成 −4 m。",
      "位移 = 9 − 4 = +5 m；路徑長 = 9 + 4 = 13 m。只有速度不變號時兩者才相等。"
    ],
    pitfalls: ["忘了時間軸下方的面積要取負號。", "把位移和路徑長畫上等號。"],
    figures: [{
      svg: vt({
        label: "v-t 圖面積", tMax: 5.4, y: [-5, 7], xt: [1, 2, 3, 4, 5], yt: [-4, 2, 6],
        f: (t) => 6 - 2 * t, curveLabel: "v = 6 − 2t", labelAt: 4.4, labelDy: 34,
        areas: [
          { f: (t) => 6 - 2 * t, from: 0, to: 3, label: "+9 m", lx: 1.1, ly: 1.6 },
          { f: (t) => 6 - 2 * t, from: 3, to: 5, color: "rgba(239,68,68,0.16)", label: "−4 m", textColor: C.red, lx: 4.2, ly: -1.3 }
        ]
      }),
      caption: "紫色（時間軸上方）是 +9 m，紅色（下方）是 −4 m：位移 = +5 m，路徑長 = 13 m。"
    }]
  },
  {
    questionId: "tm_11_q5",
    concept: "a-t 圖下的面積 = 速度的變化量 Δv（不是速度本身）。",
    steps: [
      "面積的單位是 (m/s²) × s = m/s，是速度的單位。",
      "因為 a = Δv ÷ Δt，所以 Δv = a × Δt，正是 a-t 圖下長條的面積。",
      "要求末速，還得加上初速：v = v₀ + Δv。"
    ],
    pitfalls: ["把 a-t 圖面積當成位移（那是 v-t 圖）。", "直接把面積當成末速度，忘了加初速。"],
    figures: [{
      svg: F.plot({
        label: "a-t 圖面積", x: [0, 5], y: [-0.5, 3], w: 420, h: 200,
        axes: { x: "t (s)", y: "a (m/s²)" },
        curves: [{ f: () => 2, label: "a = 2 m/s²", labelAt: 4.4, from: 0, to: 4 }],
        xTicks: tk([1, 2, 3, 4]), yTicks: tk([1, 2]),
        areas: [{ f: () => 2, from: 0, to: 4, label: "Δv = 2 × 4 = 8 m/s", ly: 1 }]
      }),
      caption: "例：a = 2 m/s² 持續 4 s，面積 8 m/s 就是這段時間速度增加了 8 m/s。"
    }]
  },
  {
    questionId: "tm_11_q6",
    concept: "等加速運動的位移 x = v₀t + ½at²，也等於 v-t 圖下梯形的面積。",
    steps: [
      "v₀ = 10 m/s，a = 2 m/s²，t = 5 s。",
      "x = 10 × 5 + ½ × 2 × 5² = 50 + 25 = 75 m。",
      "用圖驗算：末速 v = 10 + 2 × 5 = 20 m/s，梯形面積 = (10 + 20) ÷ 2 × 5 = 75 m，一致。"
    ],
    pitfalls: ["½at² 忘了乘 ½，算成 100 m。", "只算 v₀t = 50 m。"],
    figures: [{
      svg: vt({
        label: "等加速的 v-t 圖", tMax: 5.5, y: [0, 24], xt: [1, 2, 3, 4, 5], yt: [10, 20],
        f: (t) => 10 + 2 * t, curveLabel: "v = 10 + 2t", labelAt: 1.4, labelDy: -8,
        areas: [{ f: (t) => 10 + 2 * t, from: 0, to: 5, label: "面積 = 75 m", ly: 7 }],
        points: [{ x: 5, y: 20, label: "20 m/s", dx: -10, dy: -10 }]
      }),
      caption: "梯形面積 =（上底 10 + 下底 20）÷ 2 × 高 5 = 75 m，就是位移。"
    }]
  },
  {
    questionId: "tm_11_q7",
    concept: "等加速的末速 v = v₀ + at：每秒增加 a。",
    steps: ["v = 10 + 2 × 5 = 20 m/s。", "也就是上一題 v-t 圖在 t = 5 s 的高度。"],
    pitfalls: ["把 at 算成 ½at²。"],
    figures: []
  },
  {
    questionId: "tm_11_q8",
    concept: "題目沒有給時間、也不問時間時，用不含 t 的公式 v² = v₀² + 2aΔx。",
    steps: [
      "v₀ = 0，a = 4 m/s²，Δx = 32 m。",
      "v² = 0 + 2 × 4 × 32 = 256，v = 16 m/s。",
      "驗算：需時 t = v ÷ a = 4 s，位移 = ½ × 4 × 4² = 32 m，與題目相符。"
    ],
    pitfalls: ["忘了開根號，選 256 或 128。"],
    figures: [{
      svg: vt({
        label: "v-t 圖驗算", tMax: 4.6, y: [0, 18], xt: [1, 2, 3, 4], yt: [8, 16],
        f: (t) => 4 * t, curveLabel: "v = 4t", labelAt: 1.4, labelDy: -14,
        areas: [{ f: (t) => 4 * t, from: 0, to: 4, label: "面積 = 32 m", lx: 2.9, ly: 4 }],
        points: [{ x: 4, y: 16, label: "16 m/s", dx: -12 }]
      }),
      caption: "三角形面積 ½ × 4 s × 16 m/s = 32 m，正好是題目的位移。"
    }]
  },
  {
    questionId: "tm_11_q9",
    concept: "自由落體 = 初速 0、加速度 g 的等加速運動：v = gt，h = ½gt²。",
    steps: ["v = 10 × 3 = 30 m/s。", "h = ½ × 10 × 3² = 45 m。", "v-t 圖下三角形面積 ½ × 3 × 30 = 45 m，一致。"],
    pitfalls: ["½gt² 忘了平方，算成 15 m；或忘了乘 ½，算成 90 m。"],
    figures: [{
      svg: vt({
        label: "自由落體 v-t 圖", tMax: 3.4, y: [0, 34], xt: [1, 2, 3], yt: [10, 20, 30],
        f: (t) => 10 * t, curveLabel: "v = 10t", labelAt: 1.2, labelDy: -14,
        areas: [{ f: (t) => 10 * t, from: 0, to: 3, label: "45 m", lx: 2.2, ly: 8 }],
        points: [{ x: 3, y: 30, label: "30 m/s", dx: -14 }]
      }),
      caption: "取向下為正：斜率是 g = 10 m/s²，3 秒內的面積 45 m 就是下落距離。"
    }]
  },
  {
    questionId: "tm_11_q10",
    concept: "鉛直上拋：取向上為正，a = −g；到最高點時速度為 0。",
    steps: ["v = v₀ − gt，最高點 v = 0。", "0 = 30 − 10t，t = 3 s。", "在 v-t 圖上，就是直線與時間軸的交點。"],
    pitfalls: ["以為最高點時加速度也是 0。"],
    figures: [{
      svg: vt({
        label: "鉛直上拋 v-t 圖", tMax: 6.4, y: [-32, 32], xt: [1, 2, 3, 4, 5, 6], yt: [-30, 30],
        f: throwUp, curveLabel: "v = 30 − 10t", labelAt: 4.2, labelDy: 46,
        points: [{ x: 3, y: 0, label: "最高點 t = 3 s", dx: 52, dy: -8 }]
      }),
      caption: "速度從 +30 m/s 每秒減少 10 m/s，第 3 秒降到 0，此時到達最高點。"
    }]
  },
  {
    questionId: "tm_11_q11",
    concept: "最高點高度 h = v₀² ÷ 2g（由 v² = v₀² − 2gh、v = 0 得到），也是 v-t 圖上升段的面積。",
    steps: ["h = 30² ÷ (2 × 10) = 900 ÷ 20 = 45 m。", "驗算：上升段三角形面積 ½ × 3 s × 30 m/s = 45 m。"],
    pitfalls: ["寫成 v₀² ÷ g = 90 m，少了 2。"],
    figures: [{
      svg: vt({
        label: "上升段面積", tMax: 6.4, y: [-32, 32], xt: [1, 2, 3, 4, 5, 6], yt: [-30, 30],
        f: throwUp, curveLabel: "v = 30 − 10t", labelAt: 4.2, labelDy: 46,
        areas: [{ f: throwUp, from: 0, to: 3, label: "上升 45 m", lx: 1.1, ly: 8 }]
      }),
      caption: "0～3 s 的三角形面積 45 m，就是上升的高度。"
    }]
  },
  {
    questionId: "tm_11_q12",
    concept: "鉛直上拋上下對稱：上升時間 = 下降時間，同一高度上下經過時速率相同。",
    steps: [
      "上升：從 v₀ 減速到 0，需時 v₀ ÷ g。",
      "下降：從最高點開始，是初速 0 的自由落體，落回同樣高度 h = v₀² ÷ 2g 也需時 v₀ ÷ g。",
      "在 v-t 圖上，時間軸上下兩個三角形全等：面積相等（升高 = 下降），底也相等（時間相等）。"
    ],
    pitfalls: ["以為下降時「被重力加速」所以比較快：上升時重力同樣在減速，兩段的加速度大小都是 g。"],
    figures: [{
      svg: vt({
        label: "上升與下降對稱", tMax: 6.4, y: [-32, 32], xt: [1, 2, 3, 4, 5, 6], yt: [-30, 30],
        f: throwUp, curveLabel: "", labelAt: 1,
        areas: [
          { f: throwUp, from: 0, to: 3, label: "上升 +45 m", lx: 0.9, ly: 5 },
          { f: throwUp, from: 3, to: 6, color: "rgba(239,68,68,0.16)", label: "下降 −45 m", textColor: C.red, lx: 5.1, ly: -5 }
        ]
      }),
      caption: "兩個三角形全等：上升與下降都是 3 s、45 m（以 v₀ = 30 m/s 為例）。"
    }]
  },
  {
    questionId: "tm_11_q13",
    concept: "打點計時器：每兩個相鄰點之間的時間固定（50 點/秒 → 0.02 s）。時間間隔看「間隔數」，不是點數。",
    steps: [
      "第 4 點到第 8 點之間有 8 − 4 = 4 個間隔。",
      "Δt = 4 × 0.02 = 0.08 s。",
      "平均速度 = 6.0 cm ÷ 0.08 s = 75 cm/s。"
    ],
    pitfalls: ["數成 5 個點就以為是 5 個間隔，Δt 算成 0.10 s。"],
    figures: [{
      svg: F.numberLine({
        label: "紙帶上的點痕", min: 0, max: 9, ticks: [],
        arrows: [{ from: 4, to: 8, row: 0, label: "4 個間隔 = 0.08 s，Δx = 6.0 cm", color: C.brand }],
        points: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ v: n, label: String(n), color: n === 4 || n === 8 ? C.brand : C.muted }))
      }),
      caption: "第 4 點到第 8 點：中間共有 4 個間隔，每個間隔 0.02 s。"
    }]
  },
  {
    questionId: "tm_11_q14",
    concept: "相對速度：甲對乙的速度 = v甲 − v乙（站在乙上看甲）。先定好正方向。",
    steps: ["取東為正：v甲 = +80，v乙 = +60（km/h）。", "v甲對乙 = 80 − 60 = +20 km/h，向東。", "坐在乙車上，看到甲車以 20 km/h 往前（向東）超過自己。"],
    pitfalls: ["同向還把速度相加，得 140 km/h。"],
    figures: [{
      svg: F.numberLine({
        label: "同向的相對速度", min: -10, max: 100, ticks: [0, 60, 80], unit: "km/h",
        arrows: [
          { from: 0, to: 60, row: 0, label: "乙 +60", color: C.green },
          { from: 0, to: 80, row: 1, label: "甲 +80", color: C.blue },
          { from: 60, to: 80, row: 2, label: "甲對乙 +20", color: C.brand }
        ]
      }),
      caption: "速度畫成箭頭：甲的箭頭減去乙的箭頭，剩下向東 20 km/h。"
    }]
  },
  {
    questionId: "tm_11_q15",
    concept: "對向行駛時，兩者速度正負相反，相減後大小反而相加。",
    steps: ["取東為正：v甲 = +100，v乙 = −80。", "v甲對乙 = 100 − (−80) = +180 km/h。", "所以兩車相會時，彼此看對方都以 180 km/h 飛快掠過。"],
    pitfalls: ["忘了乙向西要取負號，算成 100 − 80 = 20。"],
    figures: [{
      svg: F.numberLine({
        label: "對向的相對速度", min: -100, max: 120, ticks: [-80, 0, 100], unit: "km/h",
        arrows: [
          { from: 0, to: -80, row: 0, label: "乙 −80", color: C.green },
          { from: 0, to: 100, row: 1, label: "甲 +100", color: C.blue },
          { from: -80, to: 100, row: 2, label: "甲對乙 +180", color: C.brand }
        ]
      }),
      caption: "從乙的箭頭尖端（−80）到甲的箭頭尖端（+100）共 180：這就是相對速度。"
    }]
  },
  {
    questionId: "tm_11_q16",
    concept: "把 x(t) 對照 x = v₀t + ½at² 讀出 v₀ 與 a；速度為 0 的時刻是折返點，路徑長要分段算。",
    steps: [
      "x = 8t − 2t² 對照 v₀t + ½at²：v₀ = 8 m/s，½a = −2，所以 a = −4 m/s²，(A) 錯。",
      "v(t) = 8 − 4t，t = 2 s 時 v = 0，是折返點；x(2) = 16 − 8 = 8 m，為離原點最遠處，(B) 對。",
      "x(3) = 24 − 18 = 6 m，所以 3 秒內位移是 6 m，(C) 錯。",
      "路徑長：先往前 8 m（0→8），再往回 2 m（8→6），共 10 m，(D) 錯。"
    ],
    pitfalls: ["把 −2t² 的係數直接當成加速度 −2（少乘 2）。", "路徑長直接用 x(3) = 6 m。"],
    figures: [{
      svg: F.plot({
        label: "x(t) = 8t − 2t²", x: [0, 3.4], y: [0, 9.5], w: 420, h: 240,
        axes: { x: "t (s)", y: "x (m)" },
        curves: [{ f: (t) => 8 * t - 2 * t * t, label: "x = 8t − 2t²", labelAt: 0.9 }],
        xTicks: tk([1, 2, 3]), yTicks: tk([2, 4, 6, 8]),
        vlines: [{ v: 2, color: C.red }],
        points: [{ x: 2, y: 8, label: "折返點 (2, 8)：v = 0", dy: -10 }, { x: 3, y: 6, label: "(3, 6)", color: C.blue, dx: 18 }]
      }),
      caption: "曲線最高處 t = 2 s 時切線水平（v = 0），之後往回走：位移 6 m，路徑長 8 + 2 = 10 m。"
    }]
  },
  {
    questionId: "tm_11_q17",
    concept: "減速運動：取原運動方向為正，加速度為負（方向與運動相反）。位移可用「平均速度 × 時間」。",
    steps: [
      "取東為正：a = (8 − 24) ÷ 4 = −4 m/s²，大小 4 m/s²，方向向西。",
      "等加速時平均速度 = (24 + 8) ÷ 2 = 16 m/s。",
      "位移 = 16 × 4 = 64 m（v-t 圖梯形面積）。"
    ],
    pitfalls: ["看到車往東，就以為加速度也向東。"],
    figures: [{
      svg: vt({
        label: "煞車的 v-t 圖", tMax: 4.6, y: [0, 27], xt: [1, 2, 3, 4], yt: [8, 16, 24],
        f: (t) => 24 - 4 * t, curveLabel: "斜率 −4 m/s²", labelAt: 3.3, labelDy: -14,
        areas: [{ f: (t) => 24 - 4 * t, from: 0, to: 4, label: "面積 = 64 m", lx: 1.6, ly: 6 }]
      }),
      caption: "直線往下斜，斜率 −4 m/s²（向西）；梯形面積 (24 + 8) ÷ 2 × 4 = 64 m。"
    }]
  },
  {
    questionId: "tm_11_q18",
    concept: "「最後一秒落下的距離」= 全程距離 − 前 (T − 1) 秒的距離。設總時間 T 列式。",
    steps: [
      "H = ½gT² = 5T²；前 (T − 1) 秒落下 5(T − 1)²。",
      "最後一秒：5T² − 5(T − 1)² = 5(2T − 1) = 25，得 T = 3 s。",
      "H = 5 × 3² = 45 m。",
      "v-t 圖驗算：2～3 s 的梯形面積 (20 + 30) ÷ 2 × 1 = 25 m，與題目相符。"
    ],
    pitfalls: ["以為最後一秒落下 25 m 就代表總共只落 1 秒多。", "直接用 25 = ½g × 1² 去算。"],
    figures: [{
      svg: vt({
        label: "最後一秒的距離", tMax: 3.4, y: [0, 34], xt: [1, 2, 3], yt: [10, 20, 30],
        f: (t) => 10 * t, curveLabel: "v = 10t", labelAt: 1.2, labelDy: -14,
        areas: [
          { f: (t) => 10 * t, from: 0, to: 2, label: "前 2 s：20 m", lx: 1.45, ly: 5 },
          { f: (t) => 10 * t, from: 2, to: 3, color: "rgba(239,68,68,0.18)", label: "最後 1 s：25 m", textColor: C.red, lx: 2.5, ly: 12 }
        ]
      }),
      caption: "總面積 45 m；紅色部分（2～3 s）就是最後一秒落下的 25 m。"
    }]
  },
  {
    questionId: "tm_11_q19",
    concept: "上拋後落到比拋出點更低的地方：取拋出點為原點、向上為正，落地點位移 = −25 m，「一式到底」解二次方程式。",
    steps: [
      "−25 = 20t − ½ × 10 × t² → 5t² − 20t − 25 = 0 → t² − 4t − 5 = 0。",
      "(t − 5)(t + 1) = 0，t = 5 s（負根不合）。",
      "分段驗算：上升 2 s 到最高點（升高 20 m，距地 45 m），再自由落下 45 m 需 3 s，共 5 s。",
      "v-t 圖：上方面積 +20 m，下方面積 −45 m，合計 −25 m，正是落到樓下 25 m 處。"
    ],
    pitfalls: ["位移寫成 +25（落點在拋出點下方，要取負）。", "只算到回到拋出點的 4 秒。"],
    figures: [{
      svg: vt({
        label: "從樓頂上拋到落地", tMax: 5.4, y: [-32, 24], xt: [1, 2, 3, 4, 5], yt: [-30, 20],
        f: (t) => 20 - 10 * t, curveLabel: "v = 20 − 10t", labelAt: 3.1, labelDy: 46,
        areas: [
          { f: (t) => 20 - 10 * t, from: 0, to: 2, label: "+20 m", lx: 0.8, ly: 5 },
          { f: (t) => 20 - 10 * t, from: 2, to: 5, color: "rgba(239,68,68,0.16)", label: "−45 m", textColor: C.red, lx: 4, ly: -10 }
        ]
      }),
      caption: "面積合計 20 − 45 = −25 m：t = 5 s 時正好在拋出點下方 25 m，也就是地面。"
    }]
  },
  {
    questionId: "tm_11_q20",
    concept: "「誰看誰」決定減法順序：甲車乘客看乙車 = v乙 − v甲；地面觀察者看到的就是乙車本身的速度。",
    steps: ["取東為正：v甲 = +30，v乙 = +20。", "乙對甲 = 20 − 30 = −10 m/s，大小 10 m/s，向西。", "甲車乘客會看到後面的乙車愈來愈遠（相對向西退後）；地面上看乙車仍是 20 m/s 向東。"],
    pitfalls: ["把順序寫成 v甲 − v乙，方向弄反。"],
    figures: [{
      svg: F.numberLine({
        label: "甲車上看乙車", min: -5, max: 36, ticks: [0, 20, 30], unit: "m/s",
        arrows: [
          { from: 0, to: 30, row: 1, label: "甲 +30", color: C.blue },
          { from: 0, to: 20, row: 0, label: "乙 +20", color: C.green },
          { from: 30, to: 20, row: 2, label: "乙對甲 −10", color: C.brand }
        ]
      }),
      caption: "從甲的箭頭尖端指向乙的箭頭尖端：向西 10 m/s。"
    }]
  },
  {
    questionId: "tm_11_q21",
    concept: "速度為 0 不代表加速度為 0。加速度由受力決定，上拋全程只受重力，加速度一直是 g 向下。",
    steps: [
      "最高點時速度由正（向上）變成負（向下），這一瞬間 v = 0。",
      "物體仍然只受重力 mg，由牛頓第二定律 a = g，方向向下。",
      "在 v-t 圖上，最高點落在時間軸上，但直線斜率仍是 −10 m/s²，並沒有變成水平。"
    ],
    pitfalls: ["把「靜止一瞬間」誤認為「不受力、加速度為 0」。"],
    figures: [{
      svg: vt({
        label: "最高點的速度與加速度", tMax: 6.4, y: [-32, 32], xt: [1, 2, 3, 4, 5, 6], yt: [-30, 30],
        f: throwUp, curveLabel: "斜率處處 = −10 m/s²", labelAt: 4.7, labelDy: 34,
        points: [{ x: 3, y: 0, label: "最高點：v = 0，a = −g", dx: -64, dy: 22 }]
      }),
      caption: "v 在 t = 3 s 穿過 0，但斜率（加速度）始終是 −10 m/s²。"
    }]
  },
  {
    questionId: "tm_11_q22",
    concept: "a-t 圖面積給的是 Δv，末速 = 初速 + Δv，要連同正負號一起算。",
    steps: ["Δv = +40 m/s。", "v(8) = v(0) + Δv = −15 + 40 = +25 m/s。", "物體一開始向負方向運動，後來被加速到正方向 25 m/s。"],
    pitfalls: ["直接把面積 40 當成末速。", "把初速的負號丟掉，算成 15 + 40 = 55。"],
    figures: [{
      svg: F.numberLine({
        label: "速度的變化", min: -20, max: 30, ticks: [-15, 0, 25], unit: "m/s",
        arrows: [{ from: -15, to: 25, row: 0, label: "Δv = +40 m/s", color: C.brand }],
        points: [{ v: -15, label: "v(0)", color: C.orange }, { v: 25, label: "v(8)", color: C.green }]
      }),
      caption: "從 −15 m/s 出發，往正方向加上 40 m/s，到達 +25 m/s。"
    }]
  },
  {
    questionId: "tm_11_q23",
    concept: "加速度 = 速度的變化 ÷ 時間，至少要有兩個速度；每個平均速度需要兩個點痕，相鄰兩段共用中間那一點，所以最少 3 個點痕。",
    steps: [
      "點 1、2 → 第一段平均速度 v₁ = Δx₁ ÷ Δt。",
      "點 2、3 → 第二段平均速度 v₂ = Δx₂ ÷ Δt。",
      "a = (v₂ − v₁) ÷ Δt，所以至少需要 3 個點痕。"
    ],
    pitfalls: ["以為兩個速度需要 4 個點（沒想到相鄰兩段可以共用中間點）。"],
    figures: [{
      svg: F.numberLine({
        label: "三個點痕求加速度", min: 0, max: 6, ticks: [],
        arrows: [
          { from: 0.5, to: 2, row: 0, label: "Δx₁ → v₁", color: C.blue },
          { from: 2, to: 5, row: 1, label: "Δx₂ → v₂", color: C.green }
        ],
        points: [{ v: 0.5, label: "點 1" }, { v: 2, label: "點 2" }, { v: 5, label: "點 3" }]
      }),
      caption: "加速時點痕間距愈來愈大；兩段共用點 2，三個點就能得到 v₁、v₂ 與加速度。"
    }]
  }
];
