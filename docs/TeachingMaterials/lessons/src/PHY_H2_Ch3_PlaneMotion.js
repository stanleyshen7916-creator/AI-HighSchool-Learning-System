/* lessons/src/PHY_H2_Ch3_PlaneMotion.js — 高二物理 第3章 平面運動（長榮版課本 p.82～111，tm_98）.
   例題數字取自課本範例與練習題，說明為改寫；g 取 10 m/s²、sin37° = 0.6（同課本）；答案已驗算。
   「老師說」用生活比喻＋①②③短句，每張圖只講一個重點（2026-11-02 使用者要求的簡單寫法）。 */
"use strict";
module.exports = {
  lessonId: "PHY_H2_Ch3_PlaneMotion",
  title: "高二物理第3章 平面運動・圖解教材",
  eyebrow: "物理 ・ 第3章 平面運動 ・ 高二上",
  h1: "平面運動",
  h1small: "把運動拆成「橫的」和「直的」兩條線，分開算",
  subject: "PHY",
  unit: "PHY-H2-Ch3",
  sections: [
    {
      id: "3-1", short: "3-1", title: "3-1 平面向量",
      plan: { goal: "會把向量拆成 x、y 兩個分量，會用分量做加減。", prereq: "畢氏定理、數學第3章向量。", time: "約 1 節課。課本 p.84～85。" },
      cards: [
        {
          id: "F1", title: "向量相加：x 加 x、y 加 y", page: "p.84～85", tags: ["src"],
          say: "向量就像<b>走路的指令</b>：(3, 4) 是「往右 3、往上 4」。<br>① 兩個向量相加＝<b>接著走</b>：先走 A→，再從它的尖端走 B→。<br>② 用坐標算更快：<b>x 加 x、y 加 y</b>。<br>③ 長度（量值）用畢氏定理：√(x² + y²)。<br>④ 減法＝加上一支「掉頭」的箭頭：A→ − B→ = A→ + (−B→)。",
          formula: "A→ + B→ = (Aₓ + Bₓ, A_y + B_y)　｜　|A→| = √(Aₓ² + A_y²)　｜　A→ − B→ = A→ + (−B→)",
          widget: { id: "w-add", aria: "藍色 A 向量接著橘色 B 向量，紅色為兩者相加", rw: 0.62, rn: 1.0,
            controls: [{ k: "bx", label: "B 的 x", min: -4, max: 6, step: 1 }, { k: "by", label: "B 的 y", min: -4, max: 6, step: 1 }] },
          space: "藍箭頭 A→ = (3, 4) 固定。拉 B→ 的 x、y，紅箭頭就是「先走 A 再走 B」的總結果。",
          trap: "量值直接把分量相加（(8, 10) 的長度不是 18，要用畢氏定理）。",
          quiz: { q: "A→ = (3, 4)、B→ = (5, 6)，|A→ + B→| = ？", answer: "c", options: [
            { c: "a", text: "18", why: "那是 8 + 10，長度要用畢氏定理。" },
            { c: "b", text: "2√2", why: "那是 |A→ − B→|。" },
            { c: "c", text: "2√41" },
            { c: "d", text: "√52", why: "坐標要相加後再算長度。" }] },
          sol: { id: "s-F1", aria: "逐步圖解：先相加再算長度" }
        }
      ]
    },
    {
      id: "3-2", short: "3-2", title: "3-2 平面運動的描述",
      plan: { goal: "分清位移與路徑長、平均速度與平均速率；會用向量相減求平均加速度；分清切向與法向加速度。", prereq: "第2章直線運動。", time: "約 2 節課。課本 p.86～91。" },
      cards: [
        {
          id: "F2", title: "位移走直線，路徑長沿著走", page: "p.86～89", tags: ["src"],
          say: "秒針針尖繞著圓走。<br>① <b>位移</b>：起點到終點拉一條直線（有方向）。<br>② <b>路徑長</b>：真正走過的弧長。<br>③ 平均速度 = 位移 ÷ 時間；平均速率 = 路徑長 ÷ 時間。<br>④ 走曲線時路徑長比較長，所以<b>平均速率 ≥ 平均速度的大小</b>。",
          formula: "平均速度 = Δr→ ÷ Δt　｜　平均速率 = 路徑長 ÷ Δt　｜　瞬時速度沿軌跡的切線方向",
          widget: { id: "w-clock", aria: "時鐘秒針針尖從 15 秒走到 t 秒，紅色直線為位移，金色弧為路徑", rw: 0.62, rn: 1.0,
            controls: [{ k: "t", label: "走到第幾秒", min: 20, max: 60, step: 5 }], play: { k: "t", dur: 5000 } },
          space: "紅色直線＝位移，金色弧線＝路徑長。走到 45 s（半圈）時位移最大，等於直徑 20 cm；路徑長則一直變長。",
          trap: "把弧長當成位移；或以為平均速度的大小等於平均速率。",
          quiz: { q: "秒針長 10 cm，從第 15 s 到第 30 s，針尖位移的量值為？", answer: "a", options: [
            { c: "a", text: "10√2 cm" },
            { c: "b", text: "5π cm", why: "那是走過的弧長（路徑長）。" },
            { c: "c", text: "20 cm", why: "20 cm 是直徑，要走半圈（30 s）才會這麼遠。" },
            { c: "d", text: "10 cm", why: "位移是起點到終點的直線距離。" }] },
          sol: { id: "s-F2", aria: "逐步圖解：從 3 點鐘走到 6 點鐘" }
        },
        {
          id: "F3", title: "平均加速度：速度要用箭頭相減", page: "p.87～89", tags: ["src"],
          say: "車子從「向東 6 m/s」變成「向南 8 m/s」，速度改變了多少？<br>① 速度是向量，要算 <b>Δv→ = 末速度 − 初速度</b>（箭頭相減）。<br>② 畫法：兩支箭頭放在同一起點，<b>從初速度的尖端指到末速度的尖端</b>。<br>③ 平均加速度 = Δv→ ÷ 時間。<br>④ 速率沒變、只轉彎，Δv→ 也不是 0。",
          formula: "平均加速度 a→ = Δv→ ÷ Δt = (v→₂ − v→₁) ÷ Δt　｜　x、y 兩方向可以分開算",
          widget: { id: "w-dv", aria: "初速度向東 6，末速度 8 m/s 方向可調，紅色為速度變化量", rw: 0.62, rn: 1.0,
            controls: [{ k: "ang", label: "末速度的方向", min: -180, max: 90, step: 15 }] },
          space: "藍＝初速度（向東 6），橘＝末速度（8 m/s，可轉方向），紅＝Δv→。轉到向南（−90°）時紅箭頭長 10。",
          trap: "直接用速率相減：8 − 6 = 2，忘了方向也變了。",
          quiz: { q: "跑車 2 s 內由 6 m/s 向東變為 8 m/s 向南，平均加速度量值為？", answer: "d", options: [
            { c: "a", text: "1 m/s²", why: "那是 (8 − 6) ÷ 2，忘了方向改變。" },
            { c: "b", text: "7 m/s²", why: "那是 (6 + 8) ÷ 2。" },
            { c: "c", text: "10 m/s²", why: "10 是 Δv 的量值，還要除以 2 s。" },
            { c: "d", text: "5 m/s²" }] },
          sol: { id: "s-F3", aria: "逐步圖解：箭頭相減再除以時間" }
        },
        {
          id: "F4", title: "切向加速度管快慢，法向加速度管轉彎", page: "p.87、91", tags: ["src"],
          say: "把加速度拆成兩份：<br>① <b>切向</b>（沿著速度方向）：讓物體<b>變快或變慢</b>。<br>② <b>法向</b>（垂直速度方向）：讓物體<b>轉彎</b>。<br>③ 等速圓周運動：快慢不變 → 切向 = 0；一直轉彎 → 法向 ≠ 0。<br>④ 拋體只受重力 g：把 g 分到「沿速度」與「垂直速度」兩個方向就好。",
          formula: "a² = a_切² + a_法²　｜　拋體：a_切 = g sinθ、a_法 = g cosθ（θ 為速度與水平的夾角）",
          widget: { id: "w-tn", aria: "拋體某瞬間速度方向可調，重力 g 拆成切向與法向兩分量", rw: 0.6, rn: 1.0,
            controls: [{ k: "th", label: "速度方向（正＝向上）", min: -60, max: 60, step: 1 }] },
          space: "藍＝速度方向，灰＝g（永遠向下），橘＝切向、紫＝法向。速度水平（最高點）時切向 = 0，g 全部是法向。",
          trap: "把切向、法向弄反：俯角 37° 時，切向 = g sin37° = 6、法向 = g cos37° = 8。",
          quiz: { q: "棒球某瞬間速度方向為俯角 37°（g = 10 m/s²），法向加速度量值為？", answer: "b", options: [
            { c: "a", text: "6 m/s²", why: "那是切向加速度 g sin37°。" },
            { c: "b", text: "8 m/s²" },
            { c: "c", text: "10 m/s²", why: "10 是整個 g，要拆成兩份。" },
            { c: "d", text: "0", why: "只有在速度鉛直時法向才是 0。" }] },
          sol: { id: "s-F4", aria: "逐步圖解：把 g 拆成兩份" }
        }
      ]
    },
    {
      id: "3-3", short: "3-3", title: "3-3 水平拋射",
      plan: { goal: "知道水平拋射＝水平等速＋鉛直自由落體；會求落地時間、射程與落地速度。", prereq: "自由落體公式。", time: "約 2 節課。課本 p.92～99。" },
      cards: [
        {
          id: "F5", title: "水平拋射＝橫著等速＋直著自由落體", page: "p.92～93", tags: ["src"],
          say: "同時放開三顆球：黃球直接掉、紅球水平等速滑、綠球水平丟出去。<br>① 綠球<b>往下</b>和黃球一模一樣（自由落體）。<br>② 綠球<b>往前</b>和紅球一模一樣（等速）。<br>③ 兩個方向<b>互不影響</b>，叫「運動的獨立性」。<br>④ 所以<b>落地時間只看高度</b>：T = √(2h/g)；射程 = 水平速度 × T。",
          formula: "水平：x = v₀t　｜　鉛直：y = ½gt²　｜　落地時間 T = √(2h/g)　｜　射程 R = v₀T",
          widget: { id: "w-ind", aria: "黃球自由落下、紅球水平等速、綠球水平拋射，三球同時出發", rw: 0.62, rn: 1.0,
            controls: [{ k: "t", label: "時間 t（秒）", min: 0, max: 3, step: 0.05 }], play: { k: "t", dur: 4500 } },
          space: "按播放：綠球永遠和黃球一樣高、和紅球一樣遠。45 m 高的地方，三顆都在 t = 3 s 到底。",
          trap: "以為丟得越快，掉到地上越慢。落地時間只看高度。",
          quiz: { q: "轟炸機以 200 m/s 水平飛行，在 1125 m 高投下炸彈（g = 10 m/s²），炸彈飛多久？", answer: "c", options: [
            { c: "a", text: "5.6 s", why: "那是 1125 ÷ 200，水平速度不影響落地時間。" },
            { c: "b", text: "225 s", why: "225 是 t²，還要開根號。" },
            { c: "c", text: "15 s" },
            { c: "d", text: "112.5 s", why: "要用 h = ½gt²。" }] },
          sol: { id: "s-F5", aria: "逐步圖解：先算時間，再算射程" }
        },
        {
          id: "F6", title: "水平拋射的速度方向：橫的不變，直的越來越快", page: "p.93～95", tags: ["src"],
          say: "① 水平速度一直是 v₀（不變）。<br>② 鉛直速度 = gt（越掉越快）。<br>③ 兩個合起來就是速度：速率 = √(v₀² + (gt)²)。<br>④ 速度和水平的夾角：<b>tanθ = gt ÷ v₀</b>。gt = v₀ 時剛好 45°。",
          formula: "vₓ = v₀、v_y = gt　｜　v = √(v₀² + g²t²)　｜　tanθ = gt / v₀",
          widget: { id: "w-vdir", aria: "水平拋射軌跡上某時刻的速度及其水平、鉛直分量", rw: 0.62, rn: 1.0,
            controls: [{ k: "v0", label: "水平初速 v₀", min: 5, max: 20, step: 5 }, { k: "t", label: "時間 t", min: 0, max: 3, step: 0.1 }] },
          space: "藍＝水平分量（長度不變），橘＝鉛直分量（越來越長），紅＝真正的速度。調到 v₀ = 10、t = 1 s，紅箭頭剛好 45°。",
          trap: "把位移方向當成速度方向。x = y（位移 45°）的時間比 vₓ = v_y（速度 45°）晚一倍。",
          quiz: { q: "以 10 m/s 水平拋出小球（g = 10 m/s²），幾秒後速度與水平夾 45°？", answer: "a", options: [
            { c: "a", text: "1 s" },
            { c: "b", text: "2 s", why: "2 s 是水平位移等於下落距離的時候。" },
            { c: "c", text: "√2 s", why: "只要 gt = v₀ 就好。" },
            { c: "d", text: "0.5 s", why: "0.5 s 時 gt = 5，還沒到 10。" }] },
          sol: { id: "s-F6", aria: "逐步圖解：鉛直速度追上水平速度" }
        }
      ]
    },
    {
      id: "3-4", short: "3-4", title: "3-4 斜向拋射",
      plan: { goal: "會用斜拋三公式求時間、最大高度、射程；知道 45° 最遠、互餘仰角射程相等。", prereq: "3-3、鉛直上拋。", time: "約 3 節課。課本 p.100～111。" },
      cards: [
        {
          id: "F7", title: "斜拋三公式：時間、最高、最遠", page: "p.100～105", tags: ["src"],
          say: "斜著丟球，一樣拆成兩條線：<br>① 橫的：v₀cosθ <b>等速</b>。<br>② 直的：v₀sinθ <b>鉛直上拋</b>（上去再下來）。<br>③ 三個公式：飛行時間 <b>T = 2v₀sinθ ÷ g</b>、最大高度 <b>H = (v₀sinθ)² ÷ 2g</b>、射程 <b>R = v₀cosθ × T</b>。<br>④ 最高點：直的速度 = 0，但<b>橫的速度還在</b>。",
          formula: "T = 2v₀sinθ / g　｜　H = v₀²sin²θ / 2g　｜　R = v₀²sin2θ / g　｜　軌跡 y = x tanθ − gx² / (2v₀²cos²θ)",
          widget: { id: "w-proj", aria: "斜向拋射軌跡，可調初速與仰角，顯示最大高度與射程", rw: 0.6, rn: 1.0,
            controls: [{ k: "v", label: "初速 v₀", min: 10, max: 30, step: 5 }, { k: "th", label: "仰角 θ", min: 15, max: 75, step: 1 }] },
          space: "藍點是最高點，那裡的速度只剩水平的 v₀cosθ（紅箭頭）。改變 v₀ 或 θ，看 T、H、R 怎麼變。",
          trap: "以為最高點速度是 0；從高處斜拋（落點比出發點低）時還硬套 T = 2v₀sinθ/g。",
          quiz: { q: "以仰角 37° 從地面發射，6 s 後落回地面（g = 10 m/s²）。初速為？", answer: "b", options: [
            { c: "a", text: "30 m/s", why: "30 m/s 是鉛直分量，還要除以 sin37° = 0.6。" },
            { c: "b", text: "50 m/s" },
            { c: "c", text: "40 m/s", why: "那是水平分量 v₀cos37°。" },
            { c: "d", text: "60 m/s", why: "上升只要 3 s，不是 6 s。" }] },
          sol: { id: "s-F7", aria: "逐步圖解：先求鉛直初速，再求初速" }
        },
        {
          id: "F8", title: "仰角 45° 最遠；互餘的兩個角一樣遠", page: "p.102～103、109", tags: ["src"],
          say: "初速一樣，只改仰角：<br>① 仰角太小 → 飛不久；仰角太大 → 跑不遠。<br>② 剛好 <b>45° 射程最大</b>。<br>③ <b>互餘的兩個角</b>（30° 和 60°、37° 和 53°）射程一樣，但高的那個飛比較久。<br>④ 最大高度一樣 → 飛行時間一定一樣。<br>⑤ 上升和下降左右對稱：同一高度速率相等。",
          formula: "R = v₀²sin2θ / g：θ = 45° 時最大　｜　sin2θ = sin2(90° − θ) → 互餘角射程相等",
          widget: { id: "w-comp", aria: "同初速下仰角 θ 與其餘角 90°−θ 的兩條軌跡，射程相同", rw: 0.6, rn: 1.0,
            controls: [{ k: "th", label: "仰角 θ", min: 10, max: 80, step: 1 }] },
          space: "實線＝仰角 θ，虛線＝仰角 90° − θ，兩條落在同一點。拉到 45°，兩條合成一條，而且最遠。",
          trap: "以為仰角越大丟越遠；或以為射程相同時，飛行時間也相同。",
          quiz: { q: "以相同初速從地面拋出，仰角 30° 和下列哪個仰角的射程相同？", answer: "d", options: [
            { c: "a", text: "45°", why: "45° 是射程最大的角度。" },
            { c: "b", text: "150°", why: "仰角只在 0°～90° 之間，要找互餘角。" },
            { c: "c", text: "15°", why: "射程相同的是「相加 90°」的兩個角。" },
            { c: "d", text: "60°" }] },
          sol: { id: "s-F8", aria: "逐步圖解：30° 與 60° 的軌跡" }
        }
      ]
    }
  ],
  footer: [
    "課本：長榮版高二物理 第3章 平面運動（p.82～111），範例數字取自課本，說明為改寫。",
    "g 取 10 m/s²、sin37° = 0.6、cos37° = 0.8（同課本）；圖為示意，所有數值都另外用程式驗算過。"
  ],
  script: String.raw`
var ORANGE='#e08a2c', GREEN='#3f8f4a', PURPLE='#7d5ba6', YELLOW='#d4a017';
function arrow(g,x1,y1,x2,y2,c,w,dash){ var a=Math.atan2(y2-y1,x2-x1), h=6+(w||2)*2; if(Math.hypot(x2-x1,y2-y1)<2) return; L(g,x1,y1,x2-Math.cos(a)*h*0.6,y2-Math.sin(a)*h*0.6,c,w||2,dash); g.save(); g.fillStyle=c; g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-h*Math.cos(a-0.4),y2-h*Math.sin(a-0.4)); g.lineTo(x2-h*Math.cos(a+0.4),y2-h*Math.sin(a+0.4)); g.closePath(); g.fill(); g.restore(); }
function V(g,G,x1,y1,x2,y2,c,w,dash){ arrow(g,G.X(x1),G.Y(y1),G.X(x2),G.Y(y2),c,w,dash); }
function fr(v){ var s=String(+(+v).toFixed(2)); return s.replace('-','−'); }
function grid(g,G,C,b){ for(var x=Math.ceil(b[0]);x<=b[1];x++) L(g,G.X(x),G.Y(b[2]),G.X(x),G.Y(b[3]),alpha(C.ink,0.07),1); for(var y=Math.ceil(b[2]);y<=b[3];y++) L(g,G.X(b[0]),G.Y(y),G.X(b[1]),G.Y(y),alpha(C.ink,0.07),1);
  arrow(g,G.X(b[0]),G.Y(0),G.X(b[1]),G.Y(0),alpha(C.ink,0.6),1.5); arrow(g,G.X(0),G.Y(b[2]),G.X(0),G.Y(b[3]),alpha(C.ink,0.6),1.5); T(g,'x',G.X(b[1])-6,G.Y(0)+12,C.muted,12,'right','700'); T(g,'y',G.X(0)+8,G.Y(b[3])+8,C.muted,12,'left','700'); }
function plane(g,c,C,b){ var G=frame(full(c),b[0],b[1],b[2],b[3],26,true); grid(g,G,C,b); return G; }
function sinD(d){ return d===37?0.6:d===53?0.8:Math.sin(d*PI/180); }
function cosD(d){ return d===37?0.8:d===53?0.6:Math.cos(d*PI/180); }

/* F1 向量相加 */
function addDraw(g,c,C,bx,by,step){ var G=plane(g,c,C,[-2,10,-2,11]), fs=c.narrow?11:13, A=[3,4];
  V(g,G,0,0,A[0],A[1],C.blue,3); T(g,'A→ = (3, 4)',G.X(A[0])-6,G.Y(A[1])-4,C.blue,fs,'right','700');
  if(step===0) return;
  V(g,G,A[0],A[1],A[0]+bx,A[1]+by,ORANGE,3); T(g,'B→ = ('+fr(bx)+', '+fr(by)+')',G.X(A[0]+bx)+8,G.Y(A[1]+by)-4,ORANGE,fs,'left','700');
  if(step===1) return;
  V(g,G,0,0,A[0]+bx,A[1]+by,C.red,3.5); T(g,'A→ + B→',G.X((A[0]+bx)/2)+10,G.Y((A[1]+by)/2)+10,C.red,fs+1,'left','700'); }
widget('w-add',{state:{bx:4,by:-2},rw:0.62,rn:1.0,fmt:{bx:function(v){ return fr(v); },by:function(v){ return fr(v); }},
  draw:function(g,c,s){ addDraw(g,c,c.C,s.bx,s.by,2); },
  out:function(s){ var x=3+s.bx, y=4+s.by; return 'A→ + B→ = (3 + '+fr(s.bx)+', 4 + '+fr(s.by)+') = <b>('+fr(x)+', '+fr(y)+')</b>，長度 = √('+(x*x)+' + '+(y*y)+') = <b>'+fr(Math.hypot(x,y))+'</b>'; }
});
widget('s-F1',{state:{},steps:2,rw:0.62,rn:1.0,
  draw:function(g,c,s){ addDraw(g,c,c.C,5,6,s.step?2:1); },
  out:steps(['第 1 步：先走 A→ = (3, 4)，再接著走 B→ = (5, 6)。','第 2 步：x 加 x、y 加 y → (8, 10)；長度 = √(64 + 100) = √164 = <b>2√41</b>。'])
});

/* F2 秒針：從 15 s（3 點鐘）走到 t 秒 */
function clockDraw(g,c,C,t){ var G=frame(full(c),-14,14,-13,13,16,true), fs=c.narrow?11:13, R=10, a0=0, a1=-(t-15)*PI/30;
  g.save(); g.strokeStyle=alpha(C.ink,0.25); g.lineWidth=2; g.beginPath(); g.arc(G.X(0),G.Y(0),R*G.sx,0,TAU); g.stroke(); g.restore();
  for(var k=0;k<12;k++){ var ang=PI/2-k*PI/6; dot(g,G.X(R*Math.cos(ang)),G.Y(R*Math.sin(ang)),2.5,alpha(C.ink,0.4)); }
  T(g,'12',G.X(0),G.Y(R+2),C.muted,fs,'center','700'); T(g,'3',G.X(R+1.8),G.Y(0),C.muted,fs,'center','700'); T(g,'6',G.X(0),G.Y(-R-2),C.muted,fs,'center','700'); T(g,'9',G.X(-R-1.8),G.Y(0),C.muted,fs,'center','700');
  g.save(); g.strokeStyle=C.gold; g.lineWidth=5; g.beginPath(); g.arc(G.X(0),G.Y(0),R*G.sx,-a0,-a1,false); g.stroke(); g.restore();
  var px=R*Math.cos(a1), py=R*Math.sin(a1); L(g,G.X(0),G.Y(0),G.X(px),G.Y(py),alpha(C.ink,0.5),2);
  V(g,G,R,0,px,py,C.red,3); dot(g,G.X(R),G.Y(0),5,C.ink); dot(g,G.X(px),G.Y(py),6,C.red);
  T(g,'紅＝位移',G.X(-13.5),G.Y(12),C.red,fs,'left','700'); T(g,'金＝路徑長',G.X(-13.5),G.Y(10.5),C.gold,fs,'left','700'); }
function clockNums(t){ var th=(t-15)*PI/30, R=10; return { d:2*R*Math.sin(th/2), p:R*th, dt:t-15 }; }
widget('w-clock',{state:{t:30},rw:0.62,rn:1.0,fmt:{t:function(v){ return v+' s'; }},
  draw:function(g,c,s){ clockDraw(g,c,c.C,s.t); },
  out:function(s){ var n=clockNums(s.t); return '15 s → '+s.t+' s：位移 <b>'+fr(n.d)+' cm</b>、路徑長 <b>'+fr(n.p)+' cm</b>；平均速度 '+fr(n.d/n.dt)+' cm/s，平均速率 '+fr(n.p/n.dt)+' cm/s'; }
});
widget('s-F2',{state:{},steps:2,rw:0.62,rn:1.0,
  draw:function(g,c,s){ clockDraw(g,c,c.C,30); },
  out:steps(['第 1 步：15 s 時針尖在「3」，30 s 時在「6」，轉了四分之一圈（90°）。','第 2 步：位移是兩點的直線，兩股都是半徑 10 cm：√(10² + 10²) = <b>10√2 cm</b>。（金色弧長 5π cm 是路徑長。）'])
});

/* F3 Δv = v2 − v1 */
function dvDraw(g,c,C,ang,step){ var G=plane(g,c,C,[-9,9,-9,7]), fs=c.narrow?11:13, v1=[6,0], r=ang*PI/180, v2=[8*Math.cos(r),8*Math.sin(r)];
  V(g,G,0,0,v1[0],v1[1],C.blue,3); T(g,'初速 6',G.X(6),G.Y(0)+14,C.blue,fs,'right','700');
  V(g,G,0,0,v2[0],v2[1],ORANGE,3); T(g,'末速 8',G.X(v2[0])+(v2[0]<0?-6:6),G.Y(v2[1])+(v2[1]<0?14:-10),ORANGE,fs,v2[0]<0?'right':'left','700');
  if(step===0) return;
  V(g,G,v1[0],v1[1],v2[0],v2[1],C.red,3.5); T(g,'Δv→',G.X((v1[0]+v2[0])/2)+8,G.Y((v1[1]+v2[1])/2),C.red,fs+1,'left','700'); }
widget('w-dv',{state:{ang:-90},rw:0.62,rn:1.0,fmt:{ang:function(v){ return v===0?'向東':v===-90?'向南':v===90?'向北':v===-180?'向西':(v<0?'東偏南 '+(-v)+'°':'東偏北 '+v+'°'); }},
  draw:function(g,c,s){ dvDraw(g,c,c.C,s.ang,1); },
  out:function(s){ var r=s.ang*PI/180, dx=8*Math.cos(r)-6, dy=8*Math.sin(r); return 'Δv→ = ('+fr(dx)+', '+fr(dy)+')，量值 <b>'+fr(Math.hypot(dx,dy))+' m/s</b>；若花 2 s，平均加速度 = <b>'+fr(Math.hypot(dx,dy)/2)+' m/s²</b>'; }
});
widget('s-F3',{state:{},steps:2,rw:0.62,rn:1.0,
  draw:function(g,c,s){ dvDraw(g,c,c.C,-90,s.step); },
  out:steps(['第 1 步：初速 (6, 0)、末速 (0, −8)，兩支箭頭放在同一起點。','第 2 步：Δv→ = (0 − 6, −8 − 0) = (−6, −8)，量值 10 m/s；平均加速度 = 10 ÷ 2 = <b>5 m/s²</b>。'])
});

/* F4 切向／法向 */
function tnDraw(g,c,C,th){ var G=frame(full(c),-6,6,-6.5,5,20,true), fs=c.narrow?11:13, r=th*PI/180, u=[Math.cos(r),Math.sin(r)], n=[Math.sin(r),-Math.cos(r)], gv=[0,-5];
  plot(g,G,function(x){ return -0.08*(x+2)*(x+2)+1.6; },-6,6,alpha(C.ink,0.18),2);
  V(g,G,0,0,4.5*u[0],4.5*u[1],C.blue,3); T(g,'速度',G.X(4.6*u[0])+6,G.Y(4.6*u[1])-10,C.blue,fs,'left','700');
  V(g,G,0,0,0,-5,alpha(C.ink,0.55),3); T(g,'g = 10',G.X(0)+8,G.Y(-5.3),C.muted,fs,'left','700');
  var a=Math.abs(th), at=-5*Math.sign(th)*sinD(a), an=5*cosD(a);
  if(th===0){ at=0; }
  V(g,G,0,0,at*u[0],at*u[1],ORANGE,3.5); V(g,G,0,0,an*n[0],an*n[1],PURPLE,3.5);
  L(g,G.X(at*u[0]),G.Y(at*u[1]),G.X(0),G.Y(-5),alpha(C.ink,0.3),1,[4,4]); L(g,G.X(an*n[0]),G.Y(an*n[1]),G.X(0),G.Y(-5),alpha(C.ink,0.3),1,[4,4]);
  T(g,'切向 '+fr(Math.abs(at)*2),G.X(-5.8),G.Y(4.4),ORANGE,fs+1,'left','700'); T(g,'法向 '+fr(Math.abs(an)*2),G.X(-5.8),G.Y(3.4),PURPLE,fs+1,'left','700'); }
widget('w-tn',{state:{th:-37},rw:0.6,rn:1.0,fmt:{th:function(v){ return v>0?'仰角 '+v+'°':v<0?'俯角 '+(-v)+'°':'水平'; }},
  draw:function(g,c,s){ tnDraw(g,c,c.C,s.th); },
  out:function(s){ var a=Math.abs(s.th), st=a===37?0.6:a===53?0.8:Math.sin(a*PI/180), ct=a===37?0.8:a===53?0.6:Math.cos(a*PI/180); return '切向 = g sinθ = <b>'+fr(10*st)+'</b> m/s²（'+(s.th<0?'讓球變快':s.th>0?'讓球變慢':'不變快慢')+'）；法向 = g cosθ = <b>'+fr(10*ct)+'</b> m/s²（讓球轉彎）'; }
});
widget('s-F4',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ tnDraw(g,c,c.C,-37); },
  out:steps(['第 1 步：加速度只有 g = 10 向下。速度方向是俯角 37°。','第 2 步：沿速度方向（切向）= 10 × sin37° = 6；垂直速度方向（法向）= 10 × cos37° = <b>8 m/s²</b>。'])
});

/* F5 運動的獨立性：h = 45 m、v0 = 10 m/s → 3 s 落地 */
function indDraw(g,c,C,t,trail){ var G=frame(full(c),-4,36,-4,48,20,false), fs=c.narrow?11:13, H=45;
  L(g,G.X(-4),G.Y(0),G.X(36),G.Y(0),C.ink,2); box(g,G.X(-4),G.Y(H),G.X(0)-G.X(-4),G.Y(0)-G.Y(H),alpha(C.ink,0.08),null);
  T(g,'45 m',G.X(-2),G.Y(H/2),C.muted,fs,'center','700');
  if(trail){ for(var k=0;k<=6;k++){ var tt=k*0.5; if(tt>t+1e-9) break; dot(g,G.X(0),G.Y(H-5*tt*tt),3,alpha(YELLOW,0.5)); dot(g,G.X(10*tt),G.Y(H),3,alpha(C.red,0.5)); dot(g,G.X(10*tt),G.Y(H-5*tt*tt),3,alpha(GREEN,0.5)); L(g,G.X(0),G.Y(H-5*tt*tt),G.X(10*tt),G.Y(H-5*tt*tt),alpha(C.ink,0.12),1,[3,3]); L(g,G.X(10*tt),G.Y(H),G.X(10*tt),G.Y(H-5*tt*tt),alpha(C.ink,0.12),1,[3,3]); } }
  var y=H-5*t*t, x=10*t; dot(g,G.X(0),G.Y(y),7,YELLOW); dot(g,G.X(x),G.Y(H),7,C.red); dot(g,G.X(x),G.Y(y),8,GREEN);
  T(g,'黃：自由落下',G.X(22),G.Y(44),YELLOW,fs,'left','700'); T(g,'紅：水平等速',G.X(22),G.Y(40),C.red,fs,'left','700'); T(g,'綠：水平拋射',G.X(22),G.Y(36),GREEN,fs,'left','700'); }
widget('w-ind',{state:{t:1.5},rw:0.62,rn:1.0,fmt:{t:function(v){ return v.toFixed(2)+' s'; }},
  draw:function(g,c,s){ indDraw(g,c,c.C,s.t,true); },
  out:function(s){ return '綠球：往前 x = 10 × '+s.t.toFixed(2)+' = <b>'+fr(10*s.t)+' m</b>（同紅球），往下 y = ½ × 10 × '+s.t.toFixed(2)+'² = <b>'+fr(5*s.t*s.t)+' m</b>（同黃球）'; }
});
widget('s-F5',{state:{},steps:2,rw:0.62,rn:1.0,
  draw:function(g,c,s){ indDraw(g,c,c.C,3,true); },
  out:steps(['第 1 步：往下是自由落體，只看高度：1125 = ½ × 10 × t² → t² = 225 → <b>t = 15 s</b>。','第 2 步：往前等速：射程 = 200 × 15 = 3000 m。（圖是縮小版：45 m 高、10 m/s，3 s 落地、射程 30 m。）'])
});

/* F6 速度方向 */
function vdDraw(g,c,C,v0,t){ var G=frame(full(c),-2,62,-48,6,20,true), fs=c.narrow?11:13, s=0.9;
  plot(g,G,function(x){ return -5*(x/v0)*(x/v0); },0,Math.min(60,v0*3.1),alpha(C.ink,0.3),2);
  var x=v0*t, y=-5*t*t, vy=10*t; dot(g,G.X(x),G.Y(y),7,GREEN);
  V(g,G,x,y,x+v0*s,y,C.blue,3); V(g,G,x+v0*s,y,x+v0*s,y-vy*s,ORANGE,3); V(g,G,x,y,x+v0*s,y-vy*s,C.red,3.5);
  T(g,'水平 '+fr(v0),G.X(x+v0*s/2),G.Y(y)-10,C.blue,fs,'center','700'); T(g,'鉛直 '+fr(vy),G.X(x+v0*s)+6,G.Y(y-vy*s/2),ORANGE,fs,'left','700'); }
widget('w-vdir',{state:{v0:10,t:1},rw:0.62,rn:1.0,fmt:{v0:function(v){ return v+' m/s'; },t:function(v){ return v.toFixed(1)+' s'; }},
  draw:function(g,c,s){ vdDraw(g,c,c.C,s.v0,s.t); },
  out:function(s){ var vy=10*s.t; return '速率 = √('+s.v0+'² + '+fr(vy)+'²) = <b>'+fr(Math.hypot(s.v0,vy))+' m/s</b>；與水平夾角 '+fr(Math.atan2(vy,s.v0)*180/PI)+'°'+(Math.abs(vy-s.v0)<1e-9?'（鉛直 = 水平，剛好 45°）':''); }
});
widget('s-F6',{state:{},steps:2,rw:0.62,rn:1.0,
  draw:function(g,c,s){ vdDraw(g,c,c.C,10,s.step?1:0.5); },
  out:steps(['第 1 步：水平速度一直是 10 m/s；鉛直速度 = 10t，越來越快。','第 2 步：45° 代表兩個分量一樣大：10t = 10 → <b>t = 1 s</b>。'])
});

/* F7 斜拋三公式 */
function projDraw(g,c,C,v,th,showTop){ var st=sinD(th), ct=cosD(th), T_=2*v*st/10, H=v*v*st*st/20, R=v*ct*T_;
  var G=frame(full(c),-4,95,-6,48,22,false), fs=c.narrow?11:13;
  L(g,G.X(-4),G.Y(0),G.X(95),G.Y(0),C.ink,2);
  plot(g,G,function(x){ return x*st/ct-5*x*x/(v*v*ct*ct); },0,R,C.blue,3);
  V(g,G,0,0,v*ct*0.9,v*st*0.9,ORANGE,3); T(g,'v₀ = '+v,G.X(v*ct*0.9)+6,G.Y(v*st*0.9),ORANGE,fs,'left','700');
  if(showTop!==false){ dot(g,G.X(R/2),G.Y(H),7,C.blue); V(g,G,R/2,H,R/2+v*ct*0.6,H,C.red,3); L(g,G.X(R/2),G.Y(H),G.X(R/2),G.Y(0),alpha(C.ink,0.3),1.5,[4,4]);
    T(g,'H = '+fr(H)+' m',G.X(R/2)+6,G.Y(H/2),C.muted,fs,'left','700'); }
  dot(g,G.X(R),G.Y(0),6,C.red); T(g,'R = '+fr(R)+' m',G.X(R),G.Y(0)+16,C.red,fs,'center','700'); }
widget('w-proj',{state:{v:20,th:45},rw:0.6,rn:1.0,fmt:{v:function(v){ return v+' m/s'; },th:function(v){ return v+'°'; }},
  draw:function(g,c,s){ projDraw(g,c,c.C,s.v,s.th,true); },
  out:function(s){ var st=sinD(s.th), ct=cosD(s.th); return '飛行時間 T = '+fr(2*s.v*st/10)+' s，最大高度 H = '+fr(s.v*s.v*st*st/20)+' m，射程 R = '+fr(s.v*s.v*2*st*ct/10)+' m；最高點速度 = v₀cosθ = '+fr(s.v*ct)+' m/s'; }
});
widget('s-F7',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ projDraw(g,c,c.C,30,37,s.step>0); },
  out:steps(['第 1 步：上升時間是總時間的一半 = 3 s。最高點鉛直速度 0：v₀sin37° = 10 × 3 = 30 m/s。','第 2 步：v₀ = 30 ÷ 0.6 = <b>50 m/s</b>。（圖為縮小比例示意。）'])
});

/* F8 互餘角 */
function compDraw(g,c,C,th){ var v=20, G=frame(full(c),-2,44,-4,22,22,false), fs=c.narrow?11:13;
  L(g,G.X(-2),G.Y(0),G.X(44),G.Y(0),C.ink,2);
  function traj(a,col,dash){ var st=Math.sin(a*PI/180), ct=Math.cos(a*PI/180), R=v*v*2*st*ct/10; plot(g,G,function(x){ return x*st/ct-5*x*x/(v*v*ct*ct); },0,R,col,3,dash); return R; }
  var R1=traj(th,C.blue,null), R2=traj(90-th,ORANGE,[7,5]); traj(45,alpha(C.ink,0.15),[2,4]);
  dot(g,G.X(R1),G.Y(0),7,C.red); T(g,'落點 '+fr(R1)+' m',G.X(R1),G.Y(0)+16,C.red,fs,'center','700');
  T(g,'實線 '+th+'°',G.X(0),G.Y(21),C.blue,fs,'left','700'); T(g,'虛線 '+(90-th)+'°',G.X(0),G.Y(19),ORANGE,fs,'left','700'); }
widget('w-comp',{state:{th:30},rw:0.6,rn:1.0,fmt:{th:function(v){ return v+'°'; }},
  draw:function(g,c,s){ compDraw(g,c,c.C,s.th); },
  out:function(s){ var R=400*Math.sin(2*s.th*PI/180)/10; return '初速 20 m/s：'+s.th+'° 與 '+(90-s.th)+'° 的射程都是 <b>'+fr(R)+' m</b>'+(s.th===45?'——45° 是最遠的':'（最遠是 45° 的 40 m）'); }
});
widget('s-F8',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ compDraw(g,c,c.C,30); },
  out:steps(['第 1 步：射程 R = v₀²sin2θ ÷ g。30° 時 sin60°；60° 時 sin120° = sin60°，一樣大。','第 2 步：所以和 30° 射程相同的是 <b>60°</b>（30° + 60° = 90°）。60° 飛得比較高、比較久。'])
});
`
};
