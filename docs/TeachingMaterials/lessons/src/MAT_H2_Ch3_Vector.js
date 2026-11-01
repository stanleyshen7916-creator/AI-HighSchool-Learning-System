/* lessons/src/MAT_H2_Ch3_Vector.js — 高二數學 第3章 平面向量（長榮版課本 p.136～201，tm_92）.
   例題數字取自課本例題，說明為改寫；圖為示意。 */
"use strict";
module.exports = {
  lessonId: "MAT_H2_Ch3_Vector",
  title: "高二數學第3章 平面向量・圖解教材",
  eyebrow: "數學 ・ 第3章 平面向量 ・ 高二上",
  h1: "向量是會走路的箭頭",
  h1small: "加法、內積、面積、方程組，全都畫得出來",
  subject: "MAT",
  unit: "MAT-H2-Ch3",
  sections: [
    {
      id: "1", short: "3-1", title: "3-1 平面向量的運算",
      plan: { goal: "會用坐標表示向量、做加減與係數積，判斷平行，並用線性組合與分點公式求點坐標。", prereq: "坐標平面、相似形、中點公式。", time: "約 6 節課。" },
      cards: [
        {
          id: "F1", title: "向量 ＝ 大小 ＋ 方向：用坐標寫下來", page: "p.136～140", tags: ["src"],
          say: "向量只在乎<b>大小與方向</b>，不在乎位置：把箭頭平移，它還是同一個向量。放到坐標上，從 A 走到 B 的向量就是<b>終點減始點</b>：AB→ = (b₁−a₁, b₂−a₂)，長度用畢氏定理。始點與終點重合是零向量，大小 0、不談方向。",
          formula: "AB→ = (b₁ − a₁, b₂ − a₂)　｜　|(a, b)| = √(a² + b²)　｜　AB→ = OB→ − OA→　｜　a→ = b→ ⇔ 兩分量都相等",
          widget: { id: "w-vec", aria: "坐標平面上 A 到 B 的向量，顯示 x 分量、y 分量與長度", rw: 0.62, rn: 1.0,
            controls: [{ k: "bx", label: "B 的 x", min: -4, max: 5, step: 1 }, { k: "by", label: "B 的 y", min: -4, max: 5, step: 1 }] },
          space: "虛線直角三角形的兩股就是 x 分量、y 分量；斜邊就是向量的長度。移動 B，看分量跟著「終點減始點」變化。",
          trap: "把始點減終點（算成 BA→）；或以為位置不同的箭頭就是不同向量。",
          quiz: { q: "A(−2, 5)、B(1, 1)，|AB→| = ？", answer: "b", options: [
            { c: "a", text: "√37", why: "那是把坐標相加後再算，應該是終點減始點 (3, −4)。" },
            { c: "b", text: "5" },
            { c: "c", text: "7", why: "7 是 |3| + |−4|，長度要用畢氏定理。" },
            { c: "d", text: "1", why: "不是坐標相減後的差。" }] },
          sol: { id: "s-F1", aria: "逐步圖解：先求分量再求長度" }
        },
        {
          id: "F2", title: "加法、減法與係數積：平行四邊形與伸縮", page: "p.140～151", tags: ["src"],
          say: "a→ + b→：把 b→ 接在 a→ 的尾巴（三角形法），或兩向量同起點畫平行四邊形取對角線。a→ − b→ 是由 b→ 的終點指向 a→ 的終點。r a→ 是伸縮：r > 0 同向、r < 0 反向、長度變 |r| 倍。兩非零向量平行 ⇔ 一個是另一個的倍數 ⇔ <b>a₁b₂ = a₂b₁</b>。",
          formula: "a→ ± b→ = (a₁ ± b₁, a₂ ± b₂)　｜　r a→ = (r a₁, r a₂)　｜　a→ // b→ ⇔ b→ = r a→ ⇔ a₁b₂ = a₂b₁",
          widget: { id: "w-add", aria: "兩向量的平行四邊形、和向量、差向量與係數積", rw: 0.62, rn: 1.0,
            controls: [{ k: "m", label: "顯示", min: 0, max: 2, step: 1 }, { k: "r", label: "係數 r", min: -2, max: 2, step: 0.5 }] },
          space: "顯示「和」時紅色對角線是 a→ + b→；「差」時紅色箭頭從 b→ 的尖端指到 a→ 的尖端；「係數積」時拉 r，看箭頭伸長、縮短、翻轉。",
          trap: "a→ − b→ 的方向畫反（應是「b 指向 a」）；r < 0 時長度寫成 r|a→|（應為 −r|a→|，是正數）。",
          quiz: { q: "a→ = (−2, 1)、b→ = (3, −2)、c→ = (4, −3)，(a→ + t b→) // c→，t = ？", answer: "c", options: [
            { c: "a", text: "−2", why: "代入檢查：(−8, 5) 與 (4, −3) 不平行。" },
            { c: "b", text: "1/2", why: "代入檢查不成立。" },
            { c: "c", text: "2" },
            { c: "d", text: "0", why: "(−2, 1) 與 (4, −3) 不平行。" }] },
          sol: { id: "s-F2", aria: "逐步圖解：寫出分量再用平行條件" }
        },
        {
          id: "F3", title: "線性組合與分點公式：用兩支箭頭鋪滿平面", page: "p.151～159", tags: ["src"],
          say: "兩支<b>不平行</b>的非零向量 OA→、OB→ 像兩把尺，平面上任一點 P 都能<b>唯一</b>寫成 OP→ = x OA→ + y OB→。P 在線段 AB 上、AP:PB = m:n 時，係數要<b>交叉</b>：OP→ = n/(m+n) OA→ + m/(m+n) OB→——離 A 近，A 的係數就大。重心是三點平均。",
          formula: "OP→ = x OA→ + y OB→（唯一）　｜　AP:PB = m:n ⇒ OP→ = n/(m+n)·OA→ + m/(m+n)·OB→　｜　重心 G = (A + B + C)/3，AG→ = ⅓AB→ + ⅓AC→",
          widget: { id: "w-lin", aria: "以 OA、OB 為兩把尺的斜坐標格，P 由 x、y 決定", rw: 0.62, rn: 1.0,
            controls: [{ k: "x", label: "x", min: -1, max: 2, step: 0.25 }, { k: "y", label: "y", min: -1, max: 2, step: 0.25 }] },
          space: "斜格子由 OA→（藍）與 OB→（橘）的整數倍組成。x、y 都在 0～1 之間時，P 落在平行四邊形 OACB 裡（課本例 10）；x + y = 1 時，P 剛好在直線 AB 上。",
          trap: "分點係數沒有交叉：AP:PB = 2:1 卻寫成 ⅔OA→ + ⅓OB→（應為 ⅓OA→ + ⅔OB→）。",
          quiz: { q: "A(−4, 1)、B(2, 3)，P 在線段 AB 上且 AP:PB = 2:1，P = ？", answer: "a", options: [
            { c: "a", text: "(0, 7/3)" },
            { c: "b", text: "(−2, 5/3)", why: "係數沒有交叉，算成靠近 A 的點。" },
            { c: "c", text: "(−1, 2)", why: "那是中點。" },
            { c: "d", text: "(8, 5)", why: "那是外分點。" }] },
          sol: { id: "s-F3", aria: "逐步圖解：交叉係數" }
        }
      ]
    },
    {
      id: "2", short: "3-2", title: "3-2 平面向量的內積",
      plan: { goal: "會用兩種方法算內積、由內積求夾角與判斷垂直，並求正射影、投影點與兩直線夾角。", prereq: "餘弦定理、三角函數。", time: "約 5 節課。" },
      cards: [
        {
          id: "F4", title: "內積：一個數，帶著夾角的正負號", page: "p.160～165", tags: ["src"],
          say: "內積 a→·b→ = |a→||b→| cos θ，結果是<b>實數</b>。θ 是兩向量<b>放在同一起點</b>時的夾角（0°～180°）。坐標算法更快：a₁b₁ + a₂b₂。夾角是銳角時內積為正、直角為 0、鈍角為負，所以 <b>a→ ⊥ b→ ⇔ a→·b→ = 0</b>。",
          formula: "a→·b→ = |a→||b→| cos θ = a₁b₁ + a₂b₂　｜　cos θ = a→·b→ / (|a→||b→|)　｜　a→ ⊥ b→ ⇔ a→·b→ = 0",
          widget: { id: "w-dot", aria: "旋轉 b 向量，觀察夾角與內積的正負", rw: 0.6, rn: 1.0,
            controls: [{ k: "t", label: "夾角 θ", min: 0, max: 180, step: 15 }], play: { k: "t", dur: 6000 } },
          space: "右邊的長條是 cos θ：θ 越過 90° 長條就翻到負的那一邊；θ = 90° 時內積剛好是 0。",
          trap: "正三角形 ABC 中 AB→ 與 BC→ 的夾角是 120°，不是 60°——要把兩支箭頭平移到同一起點再量。",
          quiz: { q: "正三角形 ABC 邊長 2，AB→·BC→ = ？", answer: "d", options: [
            { c: "a", text: "2", why: "用了 60°，但兩向量首尾相接，平移後夾角是 120°。" },
            { c: "b", text: "0", why: "兩邊不垂直。" },
            { c: "c", text: "4", why: "忘了乘 cos θ。" },
            { c: "d", text: "−2" }] },
          sol: { id: "s-F4", aria: "逐步圖解：平移到同一起點量夾角" }
        },
        {
          id: "F5", title: "正射影：a→ 在 b→ 上的影子", page: "p.166～173", tags: ["src"],
          say: "從 a→ 的尖端向 b→ 所在直線作垂線，垂足決定的向量就是 a→ 在 b→ 上的<b>正射影</b> = (a→·b→/|b→|²) b→。銳角時影子與 b→ 同向、直角時為零向量、鈍角時反向。內積性質（a→·a→ = |a→|²、分配律）讓 |2a→ + 3b→| 這類題目可以展開計算。直線 ax + by + c = 0 的法向量是 (a, b)，兩直線夾角由法向量的夾角求，一個 θ、另一個 180° − θ。",
          formula: "正射影 = (a→·b→ / |b→|²) b→　｜　|a→ + b→|² = |a→|² + 2a→·b→ + |b→|²　｜　ax + by + c = 0 的法向量 (a, b)",
          widget: { id: "w-proj", aria: "a 向量在 b 向量上的正射影與垂線", rw: 0.6, rn: 1.0,
            controls: [{ k: "t", label: "a→ 的方向", min: 0, max: 180, step: 10 }] },
          space: "紅色是影子：a→ 往左轉超過 90° 後，影子跑到 b→ 的反方向。虛線就是 a→ − 影子，永遠和 b→ 垂直。",
          trap: "分母寫成 |a→|²；要投影到誰，就除以誰的長度平方。",
          quiz: { q: "a→ = (−3, 1)、b→ = (2, −4)，a→ 在 b→ 上的正射影 = ？", answer: "b", options: [
            { c: "a", text: "(3, −1)", why: "那是 b→ 在 a→ 上的正射影。" },
            { c: "b", text: "(−1, 2)" },
            { c: "c", text: "(1, −2)", why: "內積是 −10，係數為負，方向要反過來。" },
            { c: "d", text: "(−2, 4)", why: "分母要用 |b→|² = 20。" }] },
          sol: { id: "s-F5", aria: "逐步圖解：內積、長度平方、係數" }
        }
      ]
    },
    {
      id: "3", short: "3-3", title: "3-3 平面向量的應用",
      plan: { goal: "會用柯西不等式求條件極值、用行列式算面積並判斷平行，並用克拉瑪公式解二元一次方程組。", prereq: "3-1、3-2。", time: "約 6 節課。" },
      cards: [
        {
          id: "F6", title: "柯西與三角不等式：|cos θ| ≤ 1 的威力", page: "p.176～181", tags: ["src"],
          say: "因為 |cos θ| ≤ 1，所以 |a→·b→| ≤ |a→||b→|，寫成坐標就是<b>柯西不等式</b> (a₁² + a₂²)(b₁² + b₂²) ≥ (a₁b₁ + a₂b₂)²，平行時取等號。例：2x + 3y = 13 時 x² + y² ≥ 13，等號在 (2, 3)——幾何上就是原點到直線距離的平方。<b>三角不等式</b> |a→| + |b→| ≥ |a→ + b→|，同向時取等號。",
          formula: "(a₁² + a₂²)(b₁² + b₂²) ≥ (a₁b₁ + a₂b₂)²，等號 a₁/b₁ = a₂/b₂　｜　|a→| + |b→| ≥ |a→ + b→|，等號：同向或有零向量",
          widget: { id: "w-cauchy", aria: "以原點為圓心的圓逐漸放大，第一次碰到直線 2x+3y=13 時半徑平方最小", rw: 0.6, rn: 1.0,
            controls: [{ k: "r", label: "圓半徑 r", min: 1, max: 5, step: 0.05 }], play: { k: "r", dur: 6000 } },
          space: "x² + y² = r² 是圓。圓還沒碰到直線時，直線上沒有點的 x² + y² 這麼小；第一次相切的點 (2, 3) 就是最小值發生處，r² = 13。",
          trap: "只寫出不等式就答最小值，卻沒有檢查等號能否成立（要找到 x/2 = y/3 的點）。",
          quiz: { q: "x² + y² = 10，x − 3y 的最大值？", answer: "c", options: [
            { c: "a", text: "√10", why: "(x² + y²)(1 + 9) = 100，要開根號：|x − 3y| ≤ 10。" },
            { c: "b", text: "100", why: "100 是平方的上界。" },
            { c: "c", text: "10" },
            { c: "d", text: "30", why: "不是 3 × 10。" }] },
          sol: { id: "s-F6", aria: "逐步圖解：配出柯西不等式" }
        },
        {
          id: "F7", title: "面積與二階行列式：|a₁b₂ − a₂b₁|", page: "p.182～188", tags: ["src"],
          say: "a→、b→ 張成的三角形面積 = ½|a→||b→| sin θ = ½√(|a→|²|b→|² − (a→·b→)²)，坐標化後只剩 <b>½|a₁b₂ − a₂b₁|</b>，這個 a₁b₂ − a₂b₁ 就是二階行列式。平行四邊形面積就是 |行列式|；行列式 = 0 代表面積 0，也就是兩向量平行。性質：行列互換不變、對調變號、成比例為 0、某行乘 r 倍值乘 r、一行的倍數加到另一行不變。",
          formula: "|a b; c d| = ad − bc　｜　三角形 = ½|a₁b₂ − a₂b₁|，平行四邊形 = |a₁b₂ − a₂b₁|　｜　a→ // b→ ⇔ 行列式 = 0",
          widget: { id: "w-det", aria: "兩向量張成的平行四邊形，面積等於行列式的絕對值", rw: 0.6, rn: 1.0,
            controls: [{ k: "k", label: "b→ 的 y 分量", min: -3, max: 4, step: 0.5 }] },
          space: "把 b→ 往下拉，平行四邊形變扁；當 b→ 與 a→ 同一條線時面積歸零、行列式 = 0。再往下拉，行列式變負（方向翻過來），但面積仍取絕對值。",
          trap: "行列式可能是負數，面積一定要加絕對值；平行四邊形面積不要再乘 ½。",
          quiz: { q: "A(3, 2)、B(5, 1)、C(4, −3)，△ABC 面積 = ？", answer: "a", options: [
            { c: "a", text: "9/2" },
            { c: "b", text: "9", why: "那是平行四邊形面積，三角形要乘 ½。" },
            { c: "c", text: "−9/2", why: "面積要取絕對值。" },
            { c: "d", text: "11/2", why: "行列式算成 2·(−5) + (−1)·1，交叉相乘要相減。" }] },
          sol: { id: "s-F7", aria: "逐步圖解：兩邊向量、行列式、取絕對值乘 ½" }
        },
        {
          id: "F8", title: "方程組與克拉瑪公式：兩直線的三種關係", page: "p.189～198", tags: ["src"],
          say: "方程組 {a₁x + b₁y = c₁, a₂x + b₂y = c₂} 其實是在問：c→ 能不能寫成 x a→ + y b→？用<b>克拉瑪公式</b>：Δ = |a₁ b₁; a₂ b₂|，Δx 把 x 的係數換成常數、Δy 把 y 的係數換成常數。Δ ≠ 0：唯一解（兩直線交一點）；Δ = Δx = Δy = 0：無限多組（重合）；Δ = 0 但 Δx、Δy 不全為 0：無解（平行）。",
          formula: "Δ ≠ 0 ⇒ x = Δx/Δ、y = Δy/Δ　｜　Δ = Δx = Δy = 0 ⇒ 無限多組　｜　Δ = 0，Δx 或 Δy ≠ 0 ⇒ 無解",
          widget: { id: "w-cramer", aria: "課本例 9 方程組隨 k 變化，兩直線相交、平行或重合", rw: 0.6, rn: 1.0,
            controls: [{ k: "k", label: "k", min: -4, max: 4, step: 0.5 }] },
          space: "這是課本例 9：(k+1)x + 4y = 4 與 x + (k−2)y = 1，Δ = (k+2)(k−3)。拉到 k = −2 兩線平行（無解），k = 3 兩線重合（無限多組），其他 k 都交於一點 (4/(k+2), 1/(k+2))。",
          trap: "看到 Δ = 0 就直接寫「無解」，忘了還要看 Δx、Δy。",
          quiz: { q: "{30x + 29y = 31, 28x + 27y = 29} 的解 (x, y) = ？", answer: "b", options: [
            { c: "a", text: "(−2, 1)", why: "Δ = −2、Δx = −4、Δy = 2，正負號要一起除。" },
            { c: "b", text: "(2, −1)" },
            { c: "c", text: "無解", why: "Δ = −2 ≠ 0，一定恰有一組解。" },
            { c: "d", text: "無限多組", why: "Δ ≠ 0。" }] },
          sol: { id: "s-F8", aria: "逐步圖解：Δ、Δx、Δy" }
        }
      ]
    }
  ],
  footer: [
    "課本：長榮版高二數學 第3章 平面向量（p.136～201），例題數字取自課本，說明為改寫。",
    "圖為示意；所有數值都另外用程式驗算過。"
  ],
  script: String.raw`
function arrow(g,x1,y1,x2,y2,c,w,dash){ var a=Math.atan2(y2-y1,x2-x1), h=6+(w||2)*2; if(Math.hypot(x2-x1,y2-y1)<2) return; L(g,x1,y1,x2-Math.cos(a)*h*0.6,y2-Math.sin(a)*h*0.6,c,w||2,dash); g.save(); g.fillStyle=c; g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-h*Math.cos(a-0.4),y2-h*Math.sin(a-0.4)); g.lineTo(x2-h*Math.cos(a+0.4),y2-h*Math.sin(a+0.4)); g.closePath(); g.fill(); g.restore(); }
function V(g,G,x1,y1,x2,y2,c,w,dash){ arrow(g,G.X(x1),G.Y(y1),G.X(x2),G.Y(y2),c,w,dash); }
function fr(v){ var s=String(+v.toFixed(2)); return s.replace('-','−'); }
var ORANGE='#e08a2c', GREEN='#3f8f4a', PURPLE='#7d5ba6';
function grid(g,G,C,b){ for(var x=Math.ceil(b[0]);x<=b[1];x++) L(g,G.X(x),G.Y(b[2]),G.X(x),G.Y(b[3]),alpha(C.ink,0.07),1); for(var y=Math.ceil(b[2]);y<=b[3];y++) L(g,G.X(b[0]),G.Y(y),G.X(b[1]),G.Y(y),alpha(C.ink,0.07),1);
  arrow(g,G.X(b[0]),G.Y(0),G.X(b[1]),G.Y(0),alpha(C.ink,0.6),1.5); arrow(g,G.X(0),G.Y(b[2]),G.X(0),G.Y(b[3]),alpha(C.ink,0.6),1.5); T(g,'x',G.X(b[1])-6,G.Y(0)+12,C.muted,12,'right','700'); T(g,'y',G.X(0)+8,G.Y(b[3])+8,C.muted,12,'left','700'); T(g,'O',G.X(0)-5,G.Y(0)+10,C.muted,11,'right','700'); }
function plane(g,c,C,b){ var G=frame(full(c),b[0],b[1],b[2],b[3],26,true); grid(g,G,C,b); return G; }

/* F1 坐標向量 */
function vecDraw(g,c,C,bx,by){ var G=plane(g,c,C,[-5,6,-5,6]), fs=c.narrow?11:13, ax=-2, ay=5;
  L(g,G.X(ax),G.Y(ay),G.X(bx),G.Y(ay),C.blue,1.5,[5,4]); L(g,G.X(bx),G.Y(ay),G.X(bx),G.Y(by),ORANGE,1.5,[5,4]);
  V(g,G,ax,ay,bx,by,C.red,3); dot(g,G.X(ax),G.Y(ay),5,C.ink); dot(g,G.X(bx),G.Y(by),5,C.ink);
  T(g,'A(−2, 5)',G.X(ax)-6,G.Y(ay)-14,C.ink,fs,'right','700'); T(g,'B('+fr(bx)+', '+fr(by)+')',G.X(bx)+8,G.Y(by)+14,C.ink,fs,'left','700');
  T(g,'x 分量 '+fr(bx-ax),G.X((ax+bx)/2),G.Y(ay)-14,C.blue,fs,'center','700'); T(g,'y 分量 '+fr(by-ay),G.X(bx)+8,G.Y((ay+by)/2),ORANGE,fs,'left','700'); }
widget('w-vec',{state:{bx:1,by:1},rw:0.62,rn:1.0,
  draw:function(g,c,s){ vecDraw(g,c,c.C,s.bx,s.by); },
  out:function(s){ var dx=s.bx+2, dy=s.by-5; return 'AB→ = (<b>'+fr(dx)+'</b>, <b>'+fr(dy)+'</b>)，|AB→| = √('+(dx*dx)+' + '+(dy*dy)+') = <b>'+fr(Math.sqrt(dx*dx+dy*dy))+'</b>'; }
});
widget('s-F1',{state:{},steps:2,rw:0.62,rn:1.0,
  draw:function(g,c,s){ vecDraw(g,c,c.C,1,1); },
  out:steps(['終點減始點：AB→ = (1 − (−2), 1 − 5) = (3, −4)。','長度 = √(3² + (−4)²) = √25 = <b>5</b> → 答案。'])
});

/* F2 加減法與係數積 */
function addDraw(g,c,C,m,r){ var G=plane(g,c,C,[-6,7,-5,6]), fs=c.narrow?11:13, a=[3,1], b=[1,3];
  if(m===2){ V(g,G,0,0,a[0],a[1],C.blue,2.5,[5,4]); V(g,G,0,0,r*a[0],r*a[1],C.red,3.5); T(g,'a→',G.X(a[0])+6,G.Y(a[1])-10,C.blue,fs,'left','700'); T(g,fr(r)+' a→',G.X(r*a[0])+8,G.Y(r*a[1])+14,C.red,fs,'left','700'); T(g,r>0?'同向，長度 '+fr(r)+' 倍':r<0?'反向，長度 '+fr(-r)+' 倍':'零向量',G.X(-5.6),G.Y(5.4),C.red,fs+1,'left','700'); return; }
  V(g,G,0,0,a[0],a[1],C.blue,3); V(g,G,0,0,b[0],b[1],ORANGE,3); T(g,'a→ = (3, 1)',G.X(a[0])+6,G.Y(a[1])+12,C.blue,fs,'left','700'); T(g,'b→ = (1, 3)',G.X(b[0])-6,G.Y(b[1])-10,ORANGE,fs,'right','700');
  if(m===0){ L(g,G.X(a[0]),G.Y(a[1]),G.X(a[0]+b[0]),G.Y(a[1]+b[1]),ORANGE,1.5,[5,4]); L(g,G.X(b[0]),G.Y(b[1]),G.X(a[0]+b[0]),G.Y(a[1]+b[1]),C.blue,1.5,[5,4]); V(g,G,0,0,a[0]+b[0],a[1]+b[1],C.red,3.5); T(g,'a→ + b→ = (4, 4)',G.X(4)+6,G.Y(4)-10,C.red,fs+1,'left','700'); }
  else { V(g,G,b[0],b[1],a[0],a[1],C.red,3.5); T(g,'a→ − b→ = (2, −2)',G.X(2.2)+10,G.Y(2),C.red,fs+1,'left','700'); T(g,'由 b→ 的尖端指向 a→ 的尖端',G.X(-5.6),G.Y(5.4),C.red,fs,'left','700'); } }
widget('w-add',{state:{m:0,r:1.5},rw:0.62,rn:1.0,fmt:{m:function(v){ return ['和 a→+b→','差 a→−b→','係數積 r a→'][v]; },r:function(v){ return fr(v); }},
  draw:function(g,c,s){ addDraw(g,c,c.C,s.m,s.r); },
  out:function(s){ return ['平行四邊形的對角線：a→ + b→ = (3+1, 1+3) = <b>(4, 4)</b>','a→ − b→ = (3−1, 1−3) = <b>(2, −2)</b>','r a→ = ('+fr(3*s.r)+', '+fr(s.r)+')；與 a→ 平行（a₁b₂ = a₂b₁ 成立）'][s.m]; }
});
widget('s-F2',{state:{},steps:2,rw:0.62,rn:1.0,
  draw:function(g,c,s){ addDraw(g,c,c.C,2,s.step?2:1); },
  out:steps(['a→ + t b→ = (−2 + 3t, 1 − 2t)。','與 c→ = (4, −3) 平行：(−2 + 3t)(−3) = (1 − 2t)·4 ⇒ 6 − 9t = 4 − 8t ⇒ <b>t = 2</b> → 答案。'])
});

/* F3 線性組合 */
function linDraw(g,c,C,x,y,show){ var G=frame(full(c),-3.5,7,-2.5,6.5,22,true), fs=c.narrow?11:13, A=[3,1], B=[1,2];
  for(var i=-3;i<=4;i++){ L(g,G.X(i*A[0]-3*B[0]),G.Y(i*A[1]-3*B[1]),G.X(i*A[0]+4*B[0]),G.Y(i*A[1]+4*B[1]),alpha(C.ink,0.08),1); L(g,G.X(-3*A[0]+i*B[0]),G.Y(-3*A[1]+i*B[1]),G.X(4*A[0]+i*B[0]),G.Y(4*A[1]+i*B[1]),alpha(C.ink,0.08),1); }
  poly(g,G,[[0,0],A,[A[0]+B[0],A[1]+B[1]],B],alpha(C.teal,0.18),C.teal);
  V(g,G,0,0,A[0],A[1],C.blue,3); V(g,G,0,0,B[0],B[1],ORANGE,3);
  T(g,'A',G.X(A[0])+6,G.Y(A[1])+10,C.blue,fs,'left','700'); T(g,'B',G.X(B[0])-8,G.Y(B[1])-8,ORANGE,fs,'right','700'); 
  if(show){ L(g,G.X(-4),G.Y(1+0.25*7),G.X(7),G.Y(1-0.25*4),alpha(C.muted,0.6),1.5,[4,4]); }
  var px=x*A[0]+y*B[0], py=x*A[1]+y*B[1];
  L(g,G.X(0),G.Y(0),G.X(x*A[0]),G.Y(x*A[1]),C.blue,4); L(g,G.X(x*A[0]),G.Y(x*A[1]),G.X(px),G.Y(py),ORANGE,4); dot(g,G.X(px),G.Y(py),7,C.red); T(g,'P',G.X(px)+10,G.Y(py)-10,C.red,fs+1,'left','700'); }
widget('w-lin',{state:{x:0.5,y:0.75},rw:0.62,rn:1.0,
  draw:function(g,c,s){ linDraw(g,c,c.C,s.x,s.y,false); },
  out:function(s){ var px=s.x*3+s.y, py=s.x+2*s.y, inside=s.x>=0&&s.x<=1&&s.y>=0&&s.y<=1; return 'OP→ = '+fr(s.x)+' OA→ + '+fr(s.y)+' OB→ = ('+fr(px)+', '+fr(py)+')'+(inside?'：在平行四邊形 OACB 內（含邊界）':'')+(Math.abs(s.x+s.y-1)<1e-9?'；x + y = 1，P 在直線 AB 上':''); }
});
widget('s-F3',{state:{},steps:2,rw:0.62,rn:1.0,
  draw:function(g,c,s){ linDraw(g,c,c.C,s.step?1/3:0.5,s.step?2/3:0.5,s.step); },
  out:steps(['AP:PB = 2:1，P 離 B 比較近，所以 B 的係數比較大：P = ⅓A + ⅔B（係數交叉）。','P = ⅓(−4, 1) + ⅔(2, 3) = (0, 7/3) → 答案。'])
});

/* F4 內積 */
function dotDraw(g,c,C,t){ var P=panels(c,0.62), fs=c.narrow?11:13, G=frame(P[0],-3.6,3.6,-1,3.8,16,true), r=t*PI/180, a=3, b=2.6;
  V(g,G,0,0,a,0,C.blue,3); V(g,G,0,0,b*Math.cos(r),b*Math.sin(r),ORANGE,3);
  g.save(); g.strokeStyle=C.red; g.lineWidth=2; g.beginPath(); g.arc(G.X(0),G.Y(0),28,-r,0); g.stroke(); g.restore();
  T(g,'θ = '+t+'°',G.X(0)+34,G.Y(0)-18,C.red,fs,'left','700'); T(g,'|a→| = 3',G.X(a),G.Y(0)+16,C.blue,fs,'right','700'); T(g,'|b→| = 2.6',G.X(b*Math.cos(r)),G.Y(b*Math.sin(r))-14,ORANGE,fs,'center','700');
  var H=frame(P[1],-1.2,1.2,-1.2,1.4,14,false), cs=Math.cos(r); L(g,H.X(-1),H.Y(0),H.X(1),H.Y(0),C.ink,1.5);
  box(g,H.X(Math.min(0,cs)),H.Y(0.3),Math.abs(cs)*H.sx,0.3*H.sy,alpha(cs>=0?GREEN:C.red,0.6),null);
  T(g,'cos θ = '+fr(cs),H.X(0),H.Y(0.8),C.ink,fs,'center','700'); T(g,'a→·b→ = '+fr(3*2.6*cs),H.X(0),H.Y(-0.5),cs>1e-9?GREEN:cs<-1e-9?C.red:C.ink,fs+1,'center','700');
  T(g,t<90?'銳角：內積 > 0':t===90?'直角：內積 = 0（垂直）':'鈍角：內積 < 0',H.X(0),H.Y(-0.9),C.muted,fs,'center','700'); }
widget('w-dot',{state:{t:60},rw:0.6,rn:1.0,fmt:{t:function(v){ return v+'°'; }},
  draw:function(g,c,s){ dotDraw(g,c,c.C,s.t); },
  out:function(s){ return 'a→·b→ = |a→||b→| cos θ = 3 × 2.6 × cos '+s.t+'° = <b>'+fr(7.8*Math.cos(s.t*PI/180))+'</b>'; }
});
function triDraw(g,c,C,st){ var G=frame(full(c),-1,4.6,-0.6,2.6,20,true), fs=c.narrow?11:13, A=[0,0], B=[2,0], Cc=[1,Math.sqrt(3)];
  poly(g,G,[A,B,Cc],alpha(C.teal,0.12),C.teal); V(g,G,0,0,2,0,C.blue,3); V(g,G,2,0,1,Math.sqrt(3),ORANGE,3);
  T(g,'A',G.X(0)-8,G.Y(0)+8,C.ink,fs,'right','700'); T(g,'B',G.X(2),G.Y(0)+14,C.ink,fs,'center','700'); T(g,'C',G.X(1),G.Y(Math.sqrt(3))-12,C.ink,fs,'center','700');
  if(st){ V(g,G,2,0,4,0,C.blue,2,[5,4]); g.save(); g.strokeStyle=C.red; g.lineWidth=2; g.beginPath(); g.arc(G.X(2),G.Y(0),26,-2*PI/3,0); g.stroke(); g.restore(); T(g,'120°',G.X(2)+20,G.Y(0)-30,C.red,fs+1,'left','700'); } }
widget('s-F4',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ triDraw(g,c,c.C,s.step); },
  out:steps(['AB→ 與 BC→ 首尾相接，不是同一起點；把 AB→ 平移到 B，延長線與 BC→ 的夾角是 180° − 60° = 120°。','AB→·BC→ = 2 × 2 × cos 120° = <b>−2</b> → 答案。'])
});

/* F5 正射影 */
function projDraw(g,c,C,t){ var G=frame(full(c),-4,4.6,-1.4,3.6,20,true), fs=c.narrow?11:13, r=t*PI/180, a=[3*Math.cos(r),3*Math.sin(r)], b=[3.5,0.8], bb=b[0]*b[0]+b[1]*b[1], k=(a[0]*b[0]+a[1]*b[1])/bb, p=[k*b[0],k*b[1]];
  L(g,G.X(-4*b[0]/3.6),G.Y(-4*b[1]/3.6),G.X(4.5*b[0]/3.6),G.Y(4.5*b[1]/3.6),alpha(C.ink,0.25),1.5);
  V(g,G,0,0,b[0],b[1],ORANGE,3); V(g,G,0,0,a[0],a[1],C.blue,3); L(g,G.X(a[0]),G.Y(a[1]),G.X(p[0]),G.Y(p[1]),C.muted,1.5,[5,4]);
  V(g,G,0,0,p[0],p[1],C.red,5); T(g,'a→',G.X(a[0])+6,G.Y(a[1])-10,C.blue,fs+1,'left','700'); T(g,'b→',G.X(b[0])+6,G.Y(b[1])+12,ORANGE,fs+1,'left','700');
  T(g,'正射影 = ('+fr(k)+') b→',G.X(-3.9),G.Y(3.3),C.red,fs+1,'left','700'); }
widget('w-proj',{state:{t:50},rw:0.6,rn:1.0,fmt:{t:function(v){ return v+'°'; }},
  draw:function(g,c,s){ projDraw(g,c,c.C,s.t); },
  out:function(s){ var r=s.t*PI/180, d=3*Math.cos(r)*3.5+3*Math.sin(r)*0.8; return 'a→·b→ = '+fr(d)+'，'+(d>1e-6?'影子與 b→ 同向':d<-1e-6?'影子與 b→ 反向':'a→ ⊥ b→，影子是零向量'); }
});
widget('s-F5',{state:{},steps:3,rw:0.6,rn:1.0,
  draw:function(g,c,s){ projDraw(g,c,c.C,[60,100,150][s.step]); },
  out:steps(['a→·b→ = (−3)(2) + (1)(−4) = −10。','|b→|² = 2² + (−4)² = 20，係數 = −10/20 = −½（負的：影子與 b→ 反向）。','正射影 = −½(2, −4) = <b>(−1, 2)</b> → 答案。'])
});

/* F6 柯西 */
function cauDraw(g,c,C,r,st){ var G=frame(full(c),-1.5,7.5,-1.5,5.2,20,true), fs=c.narrow?11:13;
  grid(g,G,C,[-1.5,7.5,-1.5,5.2]);
  plot(g,G,function(x){ return (13-2*x)/3; },-1.5,7.5,C.blue,2.5); T(g,'2x + 3y = 13',G.X(5.8),G.Y((13-11.6)/3)+16,C.blue,fs,'center','700');
  var R=Math.sqrt(13), hit=Math.abs(r-R)<0.04||st; g.save(); g.strokeStyle=hit?C.red:ORANGE; g.lineWidth=2.5; g.beginPath(); g.arc(G.X(0),G.Y(0),(st?R:r)*G.sx,0,TAU); g.stroke(); g.restore();
  if(hit){ dot(g,G.X(2),G.Y(3),7,C.red); T(g,'(2, 3)',G.X(2)+10,G.Y(3)-12,C.red,fs+1,'left','700'); L(g,G.X(0),G.Y(0),G.X(2),G.Y(3),C.red,1.5,[5,4]); } }
widget('w-cauchy',{state:{r:2.5},rw:0.6,rn:1.0,fmt:{r:function(v){ return fr(v); }},
  draw:function(g,c,s){ cauDraw(g,c,c.C,s.r,false); },
  out:function(s){ var R=Math.sqrt(13); return 'x² + y² = r² = '+fr(s.r*s.r)+'：'+(s.r<R-0.04?'圓還碰不到直線（直線上沒有這麼小的 x² + y²）':Math.abs(s.r-R)<0.04?'<b>相切於 (2, 3)，最小值 x² + y² = 13</b>':'圓與直線交於兩點'); }
});
widget('s-F6',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ cauDraw(g,c,c.C,Math.sqrt(10),false); },
  out:steps(['把 x − 3y 看成 (x, y)·(1, −3)：(x² + y²)(1² + (−3)²) ≥ (x − 3y)² ⇒ 10 × 10 ≥ (x − 3y)²。','所以 −10 ≤ x − 3y ≤ 10；等號在 (x, y) // (1, −3)，即 (1, −3) → 最大值 <b>10</b>。'])
});

/* F7 行列式面積 */
function detDraw(g,c,C,k){ var G=plane(g,c,C,[-1,7,-4.2,6]), fs=c.narrow?11:13, a=[4,2], b=[1,k], d=a[0]*b[1]-a[1]*b[0];
  poly(g,G,[[0,0],a,[a[0]+b[0],a[1]+b[1]],b],alpha(d>=0?C.teal:C.red,0.2),d>=0?C.teal:C.red);
  V(g,G,0,0,a[0],a[1],C.blue,3); V(g,G,0,0,b[0],b[1],ORANGE,3);
  T(g,'a→ = (4, 2)',G.X(a[0])+6,G.Y(a[1])+12,C.blue,fs,'left','700'); T(g,'b→ = (1, '+fr(k)+')',G.X(b[0])-6,G.Y(b[1])+(k>=0?-12:14),ORANGE,fs,'right','700');
  T(g,'行列式 = 4·'+fr(k)+' − 2·1 = '+fr(d),G.X(-0.8),G.Y(-3.3),C.ink,fs+1,'left','700'); T(g,'面積 = '+fr(Math.abs(d))+(d===0?'（平行！）':''),G.X(-0.8),G.Y(-3.8),d===0?C.red:C.teal,fs+1,'left','700'); }
widget('w-det',{state:{k:3},rw:0.6,rn:1.0,fmt:{k:function(v){ return fr(v); }},
  draw:function(g,c,s){ detDraw(g,c,c.C,s.k); },
  out:function(s){ var d=4*s.k-2; return '|4 2; 1 '+fr(s.k)+'| = '+fr(d)+' ⇒ 平行四邊形面積 <b>'+fr(Math.abs(d))+'</b>、三角形面積 '+fr(Math.abs(d)/2)+(d===0?'；行列式 0 ⇔ a→ // b→':''); }
});
widget('s-F7',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ var G=plane(g,c,c.C,[-1,7,-4,6]), C=c.C; poly(g,G,[[0,0],[2,-1],[1,-5]],alpha(C.teal,0.2),C.teal); V(g,G,0,0,2,-1,C.blue,3); V(g,G,0,0,1,-5,ORANGE,3); T(g,'AB→ = (2, −1)',G.X(2)+6,G.Y(-1),C.blue,13,'left','700'); T(g,'AC→ = (1, −5)',G.X(1)+8,G.Y(-5),ORANGE,13,'left','700'); },
  out:steps(['以 A 為起點：AB→ = (2, −1)、AC→ = (1, −5)。','行列式 = 2·(−5) − (−1)·1 = −9，面積 = ½|−9| = <b>9/2</b> → 答案。'])
});

/* F8 克拉瑪 */
function crDraw(g,c,C,k){ var G=plane(g,c,C,[-5,5,-4,4]), fs=c.narrow?11:13, D=(k+2)*(k-3);
  function line(a,b,cc,col){ if(Math.abs(b)>1e-9) plot(g,G,function(x){ return (cc-a*x)/b; },-5,5,col,2.5); else L(g,G.X(cc/a),G.Y(-4),G.X(cc/a),G.Y(4),col,2.5); }
  line(k+1,4,4,C.blue); line(1,k-2,1,ORANGE);
  var msg; if(Math.abs(D)>1e-9){ var x=4/(k+2), y=1/(k+2); if(Math.abs(x)<5&&Math.abs(y)<4) dot(g,G.X(x),G.Y(y),7,C.red); msg='Δ = '+fr(D)+' ≠ 0：交於一點 ('+fr(x)+', '+fr(y)+')'; }
  else if(k===-2) msg='Δ = 0、Δx = −20 ≠ 0：平行，無解'; else msg='Δ = Δx = Δy = 0：重合，無限多組解';
  T(g,'(k+1)x + 4y = 4',G.X(-4.8),G.Y(3.6),C.blue,fs,'left','700'); T(g,'x + (k−2)y = 1',G.X(-4.8),G.Y(3.0),ORANGE,fs,'left','700'); T(g,msg,G.X(-4.8),G.Y(-3.6),C.red,fs+1,'left','700'); }
widget('w-cramer',{state:{k:1},rw:0.6,rn:1.0,fmt:{k:function(v){ return fr(v); }},
  draw:function(g,c,s){ crDraw(g,c,c.C,s.k); },
  out:function(s){ var k=s.k, D=(k+2)*(k-3); return 'Δ = (k+2)(k−3) = '+fr(D)+'，Δx = 4(k−3) = '+fr(4*(k-3))+'，Δy = k−3 = '+fr(k-3); }
});
widget('s-F8',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ var G=plane(g,c,c.C,[-5,5,-4,4]), C=c.C; plot(g,G,function(x){ return (31-30*x)/29; },-5,5,C.blue,2.5); plot(g,G,function(x){ return (29-28*x)/27; },-5,5,ORANGE,2); if(s.step) { dot(g,G.X(2),G.Y(-1),7,C.red); T(g,'(2, −1)',G.X(2)+10,G.Y(-1)+14,C.red,13,'left','700'); } },
  out:steps(['Δ = 30·27 − 29·28 = 810 − 812 = −2；Δx = 31·27 − 29·29 = −4；Δy = 30·29 − 31·28 = 2。','x = Δx/Δ = 2、y = Δy/Δ = −1 → <b>(2, −1)</b>（兩條幾乎平行的直線，交點在這裡）。'])
});
`
};
