/* lessons/src/PHY_H2_Ch4_Newton.js — 高二物理 第4章 牛頓運動定律（長榮版課本 p.114～165，tm_99）.
   例題數字取自課本範例與練習題，說明為改寫；g 取 10 m/s²、sin37° = 0.6（同課本）；答案已驗算。
   「老師說」用生活比喻＋①②③短句，每張圖只講一個重點（2026-11-02 使用者要求的簡單寫法）。 */
"use strict";
module.exports = {
  lessonId: "PHY_H2_Ch4_Newton",
  title: "高二物理第4章 牛頓運動定律・圖解教材",
  eyebrow: "物理 ・ 第4章 牛頓運動定律 ・ 高二上",
  h1: "牛頓運動定律",
  h1small: "先畫受力圖，再用 F = ma",
  subject: "PHY",
  unit: "PHY-H2-Ch4",
  sections: [
    {
      id: "4-1", short: "4-1", title: "4-1 力的測量與性質",
      plan: { goal: "會合成與分解力、會判斷正向力與張力、會用虎克定律。", prereq: "第3章向量。", time: "約 2 節課。課本 p.116～125。" },
      cards: [
        {
          id: "F1", title: "力的合成與分解：把斜的力拆成橫的和直的", page: "p.116～119", tags: ["src"],
          say: "力是向量，也可以「拆開」和「合起來」。<br>① <b>合成</b>：兩個力接著畫（三角形法），起點到終點就是合力。<br>② <b>分解</b>：斜的力 F 拆成 <b>F cosθ（橫）</b> 和 <b>F sinθ（直）</b>。<br>③ 放在斜面上的物體：重力拆成 <b>mg sinθ（沿斜面往下滑）</b> 和 <b>mg cosθ（壓向斜面）</b>。<br>④ 6 N 與 8 N 互相垂直 → 合力 10 N。",
          formula: "合力 |F₁ + F₂|² = F₁² + F₂² + 2F₁F₂cosθ　｜　分解：Fₓ = F cosθ、F_y = F sinθ　｜　斜面：mg sinθ、mg cosθ",
          widget: { id: "w-res", aria: "6 N 與 8 N 兩力的夾角可調，紅色為合力", rw: 0.6, rn: 1.0,
            controls: [{ k: "ang", label: "兩力夾角", min: 0, max: 180, step: 15 }] },
          space: "藍＝6 N、橘＝8 N（接在藍的尖端），紅＝合力。夾角 0° 最大 14 N、90° 是 10 N、180° 最小 2 N。",
          trap: "斜面上把 sin、cos 弄反：沿斜面是 mg sinθ（θ = 0 時應該是 0，用來檢查）。",
          quiz: { q: "6 N 與 8 N 兩力夾 90°，合力量值為？", answer: "b", options: [
            { c: "a", text: "14 N", why: "那是同方向（夾 0°）時。" },
            { c: "b", text: "10 N" },
            { c: "c", text: "2 N", why: "那是反方向（夾 180°）時。" },
            { c: "d", text: "48 N", why: "力要用向量相加，不是相乘。" }] },
          sol: { id: "s-F1", aria: "逐步圖解：接著畫再用畢氏定理" }
        },
        {
          id: "F2", title: "正向力不一定等於 mg；輕繩張力處處相同", page: "p.117～119", tags: ["src"],
          say: "① <b>正向力</b>：接觸面「頂住」物體的力，方向<b>垂直接觸面</b>。<br>② 它是被「壓」出來的：壓多少，就頂回多少。<br>③ 往下斜推：壓得更緊，N = mg + F sinθ；往上斜拉：N = mg − F sinθ。<br>④ <b>張力</b>：繩子拉物體的力，沿著繩子；輕繩上每一點的張力都一樣大，而且繩子<b>只能拉、不能推</b>。",
          formula: "斜推 N = mg + F sinθ　｜　斜拉 N = mg − F sinθ　｜　斜面上 N = mg cosθ　｜　輕繩各點張力相同",
          widget: { id: "w-normal", aria: "以力 F 斜向推或拉地面上的木塊，正向力隨之改變", rw: 0.6, rn: 1.0,
            controls: [{ k: "f", label: "F 的大小（N）", min: 0, max: 200, step: 20 }, { k: "m", label: "推或拉", min: 0, max: 1, step: 1 }] },
          space: "木塊 40 kg（重 400 N），F 與水平夾 37°。選「斜推」，正向力（綠）變大；選「斜拉」，正向力變小。",
          trap: "看到地面就寫 N = mg；要先把 F 的鉛直分量算進去。",
          quiz: { q: "以 200 N、仰角 37° 的力拉光滑地面上 40 kg 的木塊（g = 10 m/s²），地面的正向力為？", answer: "c", options: [
            { c: "a", text: "400 N", why: "F 有向上的分量 200 × 0.6 = 120 N，會減輕對地面的壓力。" },
            { c: "b", text: "520 N", why: "往上拉要「減」，往下推才是加。" },
            { c: "c", text: "280 N" },
            { c: "d", text: "240 N", why: "鉛直分量是 F sin37° = 120 N，不是 F cos37°。" }] },
          sol: { id: "s-F2", aria: "逐步圖解：鉛直方向力平衡" }
        },
        {
          id: "F3", title: "虎克定律：彈簧被拉多少，回彈就多少", page: "p.122～125", tags: ["src"],
          say: "① 彈簧伸長（或壓縮）越多，回彈的力越大：<b>F = kx</b>。<br>② k 是彈性常數：k 越大，彈簧越「硬」。<br>③ 只在<b>比例限度</b>內成立，拉過頭就不成正比了。<br>④ 彈簧的伸長量只看<b>彈簧受的拉力</b>：一端固定拉 F，跟兩端各拉 F，伸長量一樣（張力都是 F，不是 2F）。",
          formula: "F = kx（x 是伸長或縮短的長度）　｜　k = F ÷ x　｜　1 kgw = 9.8 N",
          widget: { id: "w-hooke", aria: "彈簧下掛重物，伸長量與重量成正比", rw: 0.6, rn: 1.0,
            controls: [{ k: "w", label: "掛的重量（gw）", min: 0, max: 40, step: 4 }] },
          space: "這條彈簧原長 20 cm、k = 4 gw/cm。每多掛 4 gw，就多伸長 1 cm；右邊的 F－x 圖是一條過原點的直線。",
          trap: "把總長當成伸長量；兩端各拉 F 時誤以為張力是 2F。",
          quiz: { q: "彈簧原長 20 cm，掛 20 gw 時長 25 cm。改掛 28 gw 時，彈簧總長為？", answer: "a", options: [
            { c: "a", text: "27 cm" },
            { c: "b", text: "7 cm", why: "7 cm 是伸長量，還要加原長。" },
            { c: "c", text: "35 cm", why: "k = 20 ÷ 5 = 4 gw/cm，伸長 28 ÷ 4 = 7 cm。" },
            { c: "d", text: "28 cm", why: "伸長量和重量成正比，不是相等。" }] },
          sol: { id: "s-F3", aria: "逐步圖解：先求 k 再求伸長量" }
        }
      ]
    },
    {
      id: "4-2", short: "4-2", title: "4-2 慣性與牛頓第一運動定律",
      plan: { goal: "知道慣性與質量的關係、第一定律的內容與慣性坐標系。", prereq: "無。", time: "約 1 節課。課本 p.126～131。" },
      cards: [
        {
          id: "F4", title: "慣性：東西都「懶得改變」", page: "p.126～131", tags: ["src"],
          say: "① 每個東西都想<b>維持原來的樣子</b>：靜止的想繼續靜止、在動的想繼續等速直線走，這叫<b>慣性</b>。<br>② <b>質量越大，慣性越大</b>（越難改變）。<br>③ 第一定律：<b>合力為零</b> → 靜者恆靜、動者等速直線運動。<br>④ 公車急煞：腳被地板拉住停下，上半身因慣性繼續往前 → 往前傾。<br>⑤ 靜止或等速的觀察者，才看得到這條定律成立（慣性坐標系）。",
          formula: "合力 = 0 ⇔ 速度不變（靜止或等速直線）　｜　慣性大小由質量決定",
          widget: { id: "w-inertia", aria: "車子急煞時，車上的乘客因慣性向前傾", rw: 0.5, rn: 0.9,
            controls: [{ k: "t", label: "時間", min: 0, max: 2, step: 0.05 }], play: { k: "t", dur: 3000 } },
          space: "按播放：前 1 秒車子等速，乘客站得直直的；第 1 秒開始煞車，車變慢，乘客上身往前傾。",
          trap: "以為「動就要有力」。等速直線運動不需要力；要「改變」速度才需要力。",
          quiz: { q: "物體所受合力為零時，下列哪一種運動「不可能」？", answer: "d", options: [
            { c: "a", text: "靜止", why: "靜者恆靜，可能。" },
            { c: "b", text: "等速直線運動", why: "動者恆作等速直線運動，可能。" },
            { c: "c", text: "沿斜面等速滑下", why: "等速度，合力為零，可能。" },
            { c: "d", text: "自由落體" }] },
          sol: { id: "s-F4", aria: "逐步圖解：合力零代表速度不變" }
        }
      ]
    },
    {
      id: "4-3", short: "4-3", title: "4-3 牛頓第二運動定律",
      plan: { goal: "會用 F = ma 解單一物體、連結體與電梯問題；知道實驗2怎麼驗證。", prereq: "4-1 的力的分解。", time: "約 4 節課。課本 p.130～155。" },
      cards: [
        {
          id: "F5", title: "F = ma：合力越大越快，質量越大越慢", page: "p.130～135、152～155", tags: ["src"],
          say: "① 推購物車：用力越大，加速越快（<b>a ∝ F</b>）。<br>② 車子越重，越難加速（<b>a ∝ 1/m</b>）。<br>③ 合起來：<b>F = ma</b>，F 是<b>所有力加起來的合力</b>，a 的方向就是合力的方向。<br>④ 解題三步：畫受力圖 → 選加速度方向為正 → 合力 = ma。<br>⑤ 實驗2：總質量固定畫 a－F 圖、拉力固定畫 a－1/m 圖，都是過原點的直線。",
          formula: "F合 = ma　｜　1 N = 1 kg × 1 m/s²　｜　向上拉著加速：F − mg = ma",
          widget: { id: "w-fma", aria: "合力與質量可調，顯示加速度大小", rw: 0.55, rn: 0.9,
            controls: [{ k: "f", label: "合力 F（N）", min: 0, max: 20, step: 2 }, { k: "m", label: "質量 m（kg）", min: 1, max: 5, step: 1 }] },
          space: "力（紅箭頭）越長，加速度越大；箱子越大（質量越大），同樣的力加速度越小。",
          trap: "只寫 F = ma 卻忘了重力：向上拉 2 kg 的球、a = 2 m/s² 向上，F = 2 × (10 + 2) = 24 N，不是 4 N。",
          quiz: { q: "用向上的拉力 F 拉 2 kg 的鐵球，使它以 2 m/s² 向上加速（g = 10 m/s²），F = ？", answer: "b", options: [
            { c: "a", text: "4 N", why: "忘了重力 20 N 也要被拉住。" },
            { c: "b", text: "24 N" },
            { c: "c", text: "16 N", why: "向上加速，拉力要大於重力，是加不是減。" },
            { c: "d", text: "20 N", why: "20 N 只能讓它靜止或等速。" }] },
          sol: { id: "s-F5", aria: "逐步圖解：受力圖與合力" }
        },
        {
          id: "F6", title: "連結體：先看整串，再拆一個", page: "p.135～141", tags: ["src"],
          say: "幾個東西用繩子綁在一起時：<br>① <b>先把整串看成一個大物體</b>：a = 推動的力 ÷ 全部的質量。<br>② <b>再拆出其中一個</b>，求繩子的張力。<br>③ 阿特午機（滑輪兩邊掛重物）：推動的力 = 兩邊重量差，所以 a = (m₁ − m₂)g ÷ (m₁ + m₂)。<br>④ 繩子內部的張力，看整體時會互相抵消，不用寫。",
          formula: "整體：a = 外力合力 ÷ 總質量　｜　阿特午機 a = (m₁ − m₂)g / (m₁ + m₂)、T = m₂(g + a)",
          widget: { id: "w-atwood", aria: "阿特午機兩邊質量可調，顯示加速度與繩張力", rw: 0.6, rn: 1.0,
            controls: [{ k: "m1", label: "左邊 m₁（kg）", min: 1, max: 10, step: 1 }, { k: "m2", label: "右邊 m₂（kg）", min: 1, max: 10, step: 1 }] },
          space: "重的那邊往下、輕的往上。兩邊差越多，加速度越大；兩邊一樣重時 a = 0，張力 = 每邊的重量。",
          trap: "以為張力等於重的那一邊的重量。重的那邊在加速往下，張力一定比它的重量小。",
          quiz: { q: "阿特午機兩邊掛 6 kg 與 4 kg（g = 10 m/s²），繩的張力為？", answer: "c", options: [
            { c: "a", text: "60 N", why: "6 kg 在加速往下，張力比 60 N 小。" },
            { c: "b", text: "40 N", why: "4 kg 在加速往上，張力比 40 N 大。" },
            { c: "c", text: "48 N" },
            { c: "d", text: "20 N", why: "20 N 是兩邊重量差（推動整串的力）。" }] },
          sol: { id: "s-F6", aria: "逐步圖解：先整體再拆一個" }
        },
        {
          id: "F7", title: "電梯裡的體重計：看加速度方向", page: "p.142～147", tags: ["src"],
          say: "體重計顯示的是它<b>頂住你的力</b>（正向力），叫<b>視重</b>。<br>① 電梯加速度<b>向上</b>（加速上升、減速下降）→ 視重<b>變重</b>：N = m(g + a)。<br>② 加速度<b>向下</b>（加速下降、減速上升）→ 視重<b>變輕</b>：N = m(g − a)。<br>③ 靜止或等速 → 視重 = 實重。<br>④ 自由落下（a = g）→ 視重 0，叫<b>失重</b>。",
          formula: "加速度向上：N = m(g + a) > mg　｜　加速度向下：N = m(g − a) < mg　｜　a = g 時 N = 0",
          widget: { id: "w-lift", aria: "電梯加速度可調，體重計讀數隨之改變", rw: 0.55, rn: 0.9,
            controls: [{ k: "a", label: "電梯加速度（向上為正）", min: -10, max: 4, step: 1 }] },
          space: "60 kg 的人。把加速度拉到正的，讀數變大；拉到負的，讀數變小；拉到 −10（自由落下），讀數變 0。",
          trap: "只看「往上走或往下走」。要看的是加速度方向：減速上升時加速度向下，視重變輕。",
          quiz: { q: "60 kg 的人在電梯中，電梯以 1 m/s² 加速上升（g = 10 m/s²），體重計讀數為？", answer: "a", options: [
            { c: "a", text: "660 N" },
            { c: "b", text: "600 N", why: "那是靜止或等速時。" },
            { c: "c", text: "540 N", why: "加速度向上，讀數變大不是變小。" },
            { c: "d", text: "60 N", why: "60 N 只是 ma，還要加上 mg。" }] },
          sol: { id: "s-F7", aria: "逐步圖解：N − mg = ma" }
        }
      ]
    },
    {
      id: "4-4", short: "4-4", title: "4-4 牛頓第三運動定律",
      plan: { goal: "分清作用力與反作用力、平衡力。", prereq: "4-3。", time: "約 1 節課。課本 p.156～165。" },
      cards: [
        {
          id: "F8", title: "你推牆，牆也推你：作用力與反作用力", page: "p.156～163", tags: ["src"],
          say: "① 你推別人，別人<b>同時</b>推你，兩個力<b>一樣大、方向相反</b>。<br>② 它們作用在<b>兩個不同的東西</b>上，所以<b>不能互相抵消</b>。<br>③ 誰動得比較多？看質量：a = F/m，<b>質量小的加速度大</b>（摩托車撞卡車）。<br>④ 書放在桌上：「重力」和「桌子頂書的力」都作用在<b>書上</b>，是<b>平衡力</b>，不是作用力與反作用力。",
          formula: "F_AB = −F_BA（同時發生、量值相等、方向相反、作用在不同物體、性質相同）",
          widget: { id: "w-push", aria: "冰面上兩人互推，受力相同但加速度與質量成反比", rw: 0.5, rn: 0.9,
            controls: [{ k: "mb", label: "乙的質量（kg）", min: 20, max: 100, step: 10 }] },
          space: "甲 60 kg 推乙 120 N。兩個紅箭頭永遠一樣長（力相同）；乙越輕，滑出去的加速度（綠）越大。",
          trap: "以為大的推小的，大的力比較大；或把平衡力當成作用力與反作用力。",
          quiz: { q: "冰面上 60 kg 的甲以 120 N 推 40 kg 的乙。施力期間甲的加速度為？", answer: "d", options: [
            { c: "a", text: "0，因為是甲在推人", why: "乙同時也推甲 120 N。" },
            { c: "b", text: "3 m/s²", why: "那是乙的加速度 120 ÷ 40。" },
            { c: "c", text: "2 m/s²，與推力同方向", why: "甲受到的是乙的反作用力，方向相反。" },
            { c: "d", text: "2 m/s²，與推力反方向" }] },
          sol: { id: "s-F8", aria: "逐步圖解：兩人受力相同" }
        }
      ]
    }
  ],
  footer: [
    "課本：長榮版高二物理 第4章 牛頓運動定律（p.114～165），範例數字取自課本，說明為改寫。",
    "g 取 10 m/s²、sin37° = 0.6、cos37° = 0.8（同課本）；圖為示意，所有數值都另外用程式驗算過。"
  ],
  script: String.raw`
var ORANGE='#e08a2c', GREEN='#3f8f4a', PURPLE='#7d5ba6';
function arrow(g,x1,y1,x2,y2,c,w,dash){ var a=Math.atan2(y2-y1,x2-x1), h=6+(w||2)*2; if(Math.hypot(x2-x1,y2-y1)<2) return; L(g,x1,y1,x2-Math.cos(a)*h*0.6,y2-Math.sin(a)*h*0.6,c,w||2,dash); g.save(); g.fillStyle=c; g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-h*Math.cos(a-0.4),y2-h*Math.sin(a-0.4)); g.lineTo(x2-h*Math.cos(a+0.4),y2-h*Math.sin(a+0.4)); g.closePath(); g.fill(); g.restore(); }
function V(g,G,x1,y1,x2,y2,c,w,dash){ arrow(g,G.X(x1),G.Y(y1),G.X(x2),G.Y(y2),c,w,dash); }
function fr(v){ var s=String(+(+v).toFixed(2)); return s.replace('-','−'); }
function blockAt(g,G,x,y,w,h,C,lab,fs){ box(g,G.X(x-w/2),G.Y(y+h),w*G.sx,h*G.sx,alpha(C.blue,0.18),C.blue,2); if(lab) T(g,lab,G.X(x),G.Y(y+h/2),C.ink,fs,'center','700'); }

/* F1 合力 */
function resDraw(g,c,C,ang,step){ var G=frame(full(c),-3,15,-9,9,22,true), fs=c.narrow?11:13, r=ang*PI/180, A=[6,0], B=[8*Math.cos(r),8*Math.sin(r)];
  V(g,G,0,0,A[0],A[1],C.blue,3); T(g,'6 N',G.X(3),G.Y(0)+14,C.blue,fs,'center','700');
  V(g,G,A[0],A[1],A[0]+B[0],A[1]+B[1],ORANGE,3); T(g,'8 N',G.X(A[0]+B[0]/2)+8,G.Y(A[1]+B[1]/2)-8,ORANGE,fs,'left','700');
  if(step===0) return;
  V(g,G,0,0,A[0]+B[0],A[1]+B[1],C.red,3.5); T(g,'合力 '+fr(Math.hypot(A[0]+B[0],A[1]+B[1]))+' N',G.X(-2.6),G.Y(8),C.red,fs+1,'left','700'); }
widget('w-res',{state:{ang:90},rw:0.6,rn:1.0,fmt:{ang:function(v){ return v+'°'; }},
  draw:function(g,c,s){ resDraw(g,c,c.C,s.ang,1); },
  out:function(s){ var r=s.ang*PI/180; return '合力 = √(36 + 64 + 2×6×8×cos'+s.ang+'°) = <b>'+fr(Math.sqrt(100+96*Math.cos(r)))+' N</b>'; }
});
widget('s-F1',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ resDraw(g,c,c.C,90,s.step); },
  out:steps(['第 1 步：6 N 畫完，8 N 接在它的尖端（三角形法）。兩力垂直，圍出直角三角形。','第 2 步：合力是斜邊：√(6² + 8²) = <b>10 N</b>。'])
});

/* F2 正向力：40 kg，F 與水平夾 37° */
function normDraw(g,c,C,F,mode){ var G=frame(full(c),-7,7,-5.5,6,20,true), fs=c.narrow?11:13, sgn=mode?1:-1, N=400+sgn*(-F*0.6), k=1/100;
  L(g,G.X(-7),G.Y(0),G.X(7),G.Y(0),C.ink,2); blockAt(g,G,0,0,3,2,C,'40 kg',fs);
  V(g,G,0,1,0,1-400*k,alpha(C.ink,0.6),3); T(g,'重力 400 N',G.X(0.3),G.Y(1-400*k)-2,C.muted,fs,'left','700');
  V(g,G,0.6,0,0.6,N*k,GREEN,3.5); T(g,'正向力 '+fr(N)+' N',G.X(0.9),G.Y(N*k),GREEN,fs,'left','700');
  if(F>0){ var L_=F*k*1.6; if(mode){ V(g,G,1.5,1.4,1.5+L_*0.8,1.4+L_*0.6,C.red,3); T(g,'拉 '+F+' N',G.X(1.5+L_*0.8)+4,G.Y(1.4+L_*0.6),C.red,fs,'left','700'); }
    else { V(g,G,-1.5-L_*0.8,2+L_*0.6,-1.5,2,C.red,3); T(g,'推 '+F+' N',G.X(-1.5-L_*0.8)-4,G.Y(2+L_*0.6),C.red,fs,'right','700'); } } }
widget('w-normal',{state:{f:200,m:1},rw:0.6,rn:1.0,fmt:{f:function(v){ return v+' N'; },m:function(v){ return v?'斜向上拉':'斜向下推'; }},
  draw:function(g,c,s){ normDraw(g,c,c.C,s.f,s.m); },
  out:function(s){ var N=s.m?400-0.6*s.f:400+0.6*s.f; return 'F 的鉛直分量 = '+s.f+' × 0.6 = '+fr(0.6*s.f)+' N；正向力 N = 400 '+(s.m?'−':'+')+' '+fr(0.6*s.f)+' = <b>'+fr(N)+' N</b>'; }
});
widget('s-F2',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ normDraw(g,c,c.C,s.step?200:0,1); },
  out:steps(['第 1 步：沒拉的時候，地面頂住整個重量：N = 400 N。','第 2 步：斜向上拉 200 N，有 200 × sin37° = 120 N 往上，地面少頂 120 N：N = 400 − 120 = <b>280 N</b>。'])
});

/* F3 虎克定律：原長 20 cm、k = 4 gw/cm */
function hookDraw(g,c,C,w){ var P=panels(c,0.45), fs=c.narrow?11:13, G=frame(P[0],-6,6,-34,2,16,true), x=w/4, len=20+x;
  L(g,G.X(-5),G.Y(0),G.X(5),G.Y(0),C.ink,3);
  g.save(); g.strokeStyle=C.blue; g.lineWidth=2; g.beginPath(); g.moveTo(G.X(0),G.Y(0)); var n=14; for(var i=1;i<=n;i++){ g.lineTo(G.X(i%2?1.2:-1.2),G.Y(-len*i/n)); } g.lineTo(G.X(0),G.Y(-len)); g.stroke(); g.restore();
  if(w>0) blockAt(g,G,0,-len-3,3,3,C,w+' gw',fs);
  L(g,G.X(3.5),G.Y(-20),G.X(5.5),G.Y(-20),alpha(C.ink,0.4),1,[3,3]); T(g,'原長',G.X(3.4),G.Y(-20),C.muted,fs-1,'right','700');
  var H=frame(P[1],-3,44,-1,13,22,false); axes(g,H,[0,42,0,12],C,{xstep:8,ystep:2,xlabel:'F (gw)',ylabel:'x (cm)'});
  plot(g,H,function(f){ return f/4; },0,40,alpha(C.blue,0.5),2); dot(g,H.X(w),H.Y(x),6,C.red); }
widget('w-hooke',{state:{w:20},rw:0.6,rn:1.0,fmt:{w:function(v){ return v+' gw'; }},
  draw:function(g,c,s){ hookDraw(g,c,c.C,s.w); },
  out:function(s){ return '伸長量 x = F ÷ k = '+s.w+' ÷ 4 = <b>'+fr(s.w/4)+' cm</b>，總長 = 20 + '+fr(s.w/4)+' = <b>'+fr(20+s.w/4)+' cm</b>'; }
});
widget('s-F3',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ hookDraw(g,c,c.C,s.step?28:20); },
  out:steps(['第 1 步：20 gw 伸長 25 − 20 = 5 cm → k = 20 ÷ 5 = 4 gw/cm。','第 2 步：28 gw 伸長 28 ÷ 4 = 7 cm，總長 20 + 7 = <b>27 cm</b>。'])
});

/* F4 慣性：車 0～1 s 等速 10 m/s，1～2 s 煞車 */
function inDraw(g,c,C,t){ var G=frame(full(c),-1,22,-1,8,20,true), fs=c.narrow?11:13, x=t<=1?10*t:10+10*(t-1)-5*(t-1)*(t-1), brake=t>1;
  L(g,G.X(-1),G.Y(0),G.X(22),G.Y(0),C.ink,2);
  var cx=Math.min(x,19)-3; box(g,G.X(cx-3),G.Y(4),6*G.sx,3.2*G.sx,alpha(C.blue,0.15),C.blue,2); dot(g,G.X(cx-1.8),G.Y(0.4),G.sx*0.6,C.ink); dot(g,G.X(cx+1.8),G.Y(0.4),G.sx*0.6,C.ink);
  var lean=brake?0.9:0; L(g,G.X(cx),G.Y(1),G.X(cx),G.Y(2.2),C.red,3); L(g,G.X(cx),G.Y(2.2),G.X(cx+lean),G.Y(3.4),C.red,3); dot(g,G.X(cx+lean),G.Y(3.7),6,C.red);
  T(g,brake?'煞車：車變慢，人往前傾':'等速：人站得直直的',G.X(0),G.Y(7.2),brake?C.red:C.muted,fs+1,'left','700'); }
widget('w-inertia',{state:{t:0.5},rw:0.5,rn:0.9,fmt:{t:function(v){ return v.toFixed(2)+' s'; }},
  draw:function(g,c,s){ inDraw(g,c,c.C,s.t); },
  out:function(s){ return s.t<=1?'車和人一起等速 10 m/s：合力 0，不需要力也能一直走。':'地板用摩擦力讓腳減速；上半身沒有被往後拉，因為<b>慣性</b>還想維持原速度 → 往前傾。'; }
});
widget('s-F4',{state:{},steps:2,rw:0.5,rn:0.9,
  draw:function(g,c,s){ inDraw(g,c,c.C,s.step?1.5:0.5); },
  out:steps(['第 1 步：合力 0 → 速度不會變 → 只能「靜止」或「等速直線」。','第 2 步：自由落體有重力、一直加速，合力不是 0 → <b>不可能</b>。'])
});

/* F5 F = ma */
function fmaDraw(g,c,C,F,m){ var G=frame(full(c),-1,22,-1,8,20,true), fs=c.narrow?11:13, s=1.2+m*0.5, a=F/m;
  L(g,G.X(-1),G.Y(0),G.X(22),G.Y(0),C.ink,2); blockAt(g,G,6,0,s,s,C,m+' kg',fs);
  if(F>0) V(g,G,6+s/2,s/2,6+s/2+F*0.35,s/2,C.red,3.5); T(g,'F = '+F+' N',G.X(6+s/2+F*0.35)+6,G.Y(s/2),C.red,fs,'left','700');
  V(g,G,6-s/2,s+0.8,6-s/2+a*0.6,s+0.8,GREEN,3); T(g,'a = '+fr(a)+' m/s²',G.X(6-s/2),G.Y(s+1.7),GREEN,fs+1,'left','700'); }
widget('w-fma',{state:{f:10,m:2},rw:0.55,rn:0.9,fmt:{f:function(v){ return v+' N'; },m:function(v){ return v+' kg'; }},
  draw:function(g,c,s){ fmaDraw(g,c,c.C,s.f,s.m); },
  out:function(s){ return 'a = F ÷ m = '+s.f+' ÷ '+s.m+' = <b>'+fr(s.f/s.m)+' m/s²</b>'; }
});
function ballDraw(g,c,C,step){ var G=frame(full(c),-6,6,-4.5,5,20,true), fs=c.narrow?11:13;
  dot(g,G.X(0),G.Y(0),G.sx*0.9,alpha(C.blue,0.6)); T(g,'2 kg',G.X(0),G.Y(0),C.sheet,fs,'center','700');
  V(g,G,0,-0.9,0,-3.3,alpha(C.ink,0.6),3); T(g,'重力 20 N',G.X(0.4),G.Y(-3),C.muted,fs,'left','700');
  V(g,G,0,0.9,0,4.2,C.red,3); T(g,'F = ?',G.X(0.4),G.Y(3.8),C.red,fs,'left','700');
  if(step) { V(g,G,-3,-1,-3,1.5,GREEN,3); T(g,'a = 2 向上',G.X(-3.3),G.Y(0.3),GREEN,fs,'right','700'); } }
widget('s-F5',{state:{},steps:2,rw:0.55,rn:0.9,
  draw:function(g,c,s){ ballDraw(g,c,c.C,s.step); },
  out:steps(['第 1 步：受力圖：向上拉力 F、向下重力 20 N。加速度向上，取向上為正。','第 2 步：合力 = ma：F − 20 = 2 × 2 → <b>F = 24 N</b>。'])
});

/* F6 阿特午機 */
function atDraw(g,c,C,m1,m2){ var G=frame(full(c),-6,6,-9,2,20,true), fs=c.narrow?11:13, a=(m1-m2)*10/(m1+m2), T_=m2*(10+a), off=Math.max(-2.5,Math.min(2.5,a*0.35));
  g.save(); g.strokeStyle=C.ink; g.lineWidth=2; g.beginPath(); g.arc(G.X(0),G.Y(0),2*G.sx,0,TAU); g.stroke(); g.restore(); dot(g,G.X(0),G.Y(0),3,C.ink);
  var y1=-4-off, y2=-4+off; L(g,G.X(-2),G.Y(0),G.X(-2),G.Y(y1),C.ink,1.5); L(g,G.X(2),G.Y(0),G.X(2),G.Y(y2),C.ink,1.5);
  var s1=0.8+m1*0.12, s2=0.8+m2*0.12; blockAt(g,G,-2,y1-s1,s1,s1,C,m1+' kg',fs); blockAt(g,G,2,y2-s2,s2,s2,C,m2+' kg',fs);
  if(Math.abs(a)>1e-9){ var d=a>0?-1:1; V(g,G,-4,y1-0.5,-4,y1-0.5+d*1.8,GREEN,3); V(g,G,4,y2-0.5,4,y2-0.5-d*1.8,GREEN,3); }
  T(g,'a = '+fr(Math.abs(a))+' m/s²',G.X(-5.8),G.Y(1.5),GREEN,fs+1,'left','700'); T(g,'張力 T = '+fr(T_)+' N',G.X(5.8),G.Y(1.5),C.red,fs+1,'right','700'); }
widget('w-atwood',{state:{m1:6,m2:4},rw:0.6,rn:1.0,fmt:{m1:function(v){ return v+' kg'; },m2:function(v){ return v+' kg'; }},
  draw:function(g,c,s){ atDraw(g,c,c.C,s.m1,s.m2); },
  out:function(s){ var a=(s.m1-s.m2)*10/(s.m1+s.m2); return 'a = ('+s.m1+' − '+s.m2+') × 10 ÷ ('+s.m1+' + '+s.m2+') = <b>'+fr(Math.abs(a))+' m/s²</b>；T = '+s.m2+' × (10 '+(a>=0?'+':'−')+' '+fr(Math.abs(a))+') = <b>'+fr(s.m2*(10+a))+' N</b>'; }
});
widget('s-F6',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ atDraw(g,c,c.C,6,4); },
  out:steps(['第 1 步 看整串：推動的力 = 60 − 40 = 20 N，總質量 10 kg → a = 2 m/s²。','第 2 步 拆出 4 kg：它加速往上，T − 40 = 4 × 2 → <b>T = 48 N</b>（介於 40 和 60 之間）。'])
});

/* F7 電梯：60 kg */
function liftDraw(g,c,C,a){ var G=frame(full(c),-6,8,-1,10,20,true), fs=c.narrow?11:13, N=60*(10+a);
  box(g,G.X(-4),G.Y(9),8*G.sx,9*G.sx,alpha(C.blue,0.06),C.blue,2);
  box(g,G.X(-1.6),G.Y(0.7),3.2*G.sx,0.7*G.sx,alpha(C.ink,0.15),C.ink,1.5); T(g,fr(N)+' N',G.X(0),G.Y(0.35),C.red,fs+1,'center','700');
  L(g,G.X(-0.6),G.Y(0.7),G.X(0),G.Y(2.8),C.ink,3); L(g,G.X(0.6),G.Y(0.7),G.X(0),G.Y(2.8),C.ink,3); L(g,G.X(0),G.Y(2.8),G.X(0),G.Y(5.2),C.ink,3); L(g,G.X(0),G.Y(4.8),G.X(-0.9),G.Y(3.7),C.ink,3); L(g,G.X(0),G.Y(4.8),G.X(0.9),G.Y(3.7),C.ink,3); dot(g,G.X(0),G.Y(5.8),G.sx*0.55,C.ink);
  if(a!==0) V(g,G,5.5,5,5.5,5+(a>0?1:-1)*Math.min(3.5,Math.abs(a)*0.5+0.8),GREEN,3);
  T(g,a>0?'加速度向上':a<0?'加速度向下':'等速或靜止',G.X(5.5),G.Y(a>=0?3.8:9.2),GREEN,fs,'center','700');
  T(g,N>600?'變重':N<600?(N===0?'失重！':'變輕'):'= 實重',G.X(0),G.Y(8),N>600?C.red:N<600?C.blue:C.muted,fs+2,'center','700'); }
widget('w-lift',{state:{a:1},rw:0.55,rn:0.9,fmt:{a:function(v){ return (v>0?'+':'')+fr(v)+' m/s²'; }},
  draw:function(g,c,s){ liftDraw(g,c,c.C,s.a); },
  out:function(s){ return 'N = m(g + a) = 60 × (10 '+(s.a>=0?'+':'−')+' '+fr(Math.abs(s.a))+') = <b>'+fr(60*(10+s.a))+' N</b>（實重 600 N）'; }
});
widget('s-F7',{state:{},steps:2,rw:0.55,rn:0.9,
  draw:function(g,c,s){ liftDraw(g,c,c.C,s.step?1:0); },
  out:steps(['第 1 步：人受兩個力：體重計向上頂 N、重力 600 N 向下。加速度向上，取向上為正。','第 2 步：N − 600 = 60 × 1 → <b>N = 660 N</b>，比實重重。'])
});

/* F8 冰上互推：甲 60 kg 推乙 120 N */
function pushDraw(g,c,C,mb){ var G=frame(full(c),-10,10,-1,8,20,true), fs=c.narrow?11:13, aA=120/60, aB=120/mb;
  L(g,G.X(-10),G.Y(0),G.X(10),G.Y(0),alpha(C.blue,0.4),3); T(g,'冰面（無摩擦）',G.X(9.5),G.Y(-0.5),C.muted,fs-1,'right','700');
  blockAt(g,G,-1.6,0,2.2,3.2,C,'甲 60',fs); var sb=1.2+mb/60; blockAt(g,G,0.5+sb/2,0,sb,2.6,C,'乙 '+mb,fs);
  V(g,G,0.5,1.6,0.5+3.5,1.6,C.red,3); T(g,'甲推乙 120 N',G.X(2.5),G.Y(1.6)-12,C.red,fs,'center','700');
  V(g,G,-0.5,4.2,-0.5-3.5,4.2,C.red,3); T(g,'乙推甲 120 N',G.X(-2.3),G.Y(4.2)-12,C.red,fs,'center','700');
  V(g,G,-3,6.6,-3-aA*1.2,6.6,GREEN,3); T(g,'甲 a = '+fr(aA),G.X(-3-aA*1.2)-4,G.Y(6.6),GREEN,fs,'right','700');
  V(g,G,3,6.6,3+aB*1.2,6.6,GREEN,3); T(g,'乙 a = '+fr(aB),G.X(3+aB*1.2)+4,G.Y(6.6),GREEN,fs,'left','700'); }
widget('w-push',{state:{mb:40},rw:0.5,rn:0.9,fmt:{mb:function(v){ return v+' kg'; }},
  draw:function(g,c,s){ pushDraw(g,c,c.C,s.mb); },
  out:function(s){ return '兩人受力都是 120 N（方向相反）。甲 a = 120 ÷ 60 = <b>2 m/s²</b>（向左），乙 a = 120 ÷ '+s.mb+' = <b>'+fr(120/s.mb)+' m/s²</b>（向右）'; }
});
widget('s-F8',{state:{},steps:2,rw:0.5,rn:0.9,
  draw:function(g,c,s){ pushDraw(g,c,c.C,40); },
  out:steps(['第 1 步：甲推乙 120 N 向右的同時，乙推甲 120 N 向左（反作用力）。','第 2 步：甲的加速度 = 120 ÷ 60 = <b>2 m/s²，方向向左</b>（和推力反方向）；乙是 3 m/s² 向右。'])
});
`
};
