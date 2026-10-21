/* lessons/src/CHE_H2_Ch3_Solutions.js — 高二化學 第3章 液態與溶液（tm_39）.
   內容依教材包 tm_39 summary.json；常數：水 Kb = 0.52 °C/m、Kf = 1.86 °C/m、R = 0.082；答案已驗算。
   蒸氣壓曲線為依常用數據繪製的示意。 */
"use strict";
module.exports = {
  lessonId: "CHE_H2_Ch3_Solutions",
  title: "液態與溶液圖解教材",
  eyebrow: "化學 ・ 第 3 章 ・ 高二上",
  h1: "液態與溶液",
  h1small: "蒸氣壓是整章的主角",
  subject: "CHE",
  unit: "CHE-H2-CH3",
  sections: [
    {
      id: "3-1", short: "液態與蒸氣壓", title: "物質的三態與蒸氣壓",
      plan: { goal: "知道相變化的能量、蒸發與沸騰的差別，會用飽和蒸氣壓判斷沸點、計算相對溼度。", prereq: "第2章 分壓與飽和蒸氣壓。", time: "約 2 至 3 節課。" },
      cards: [
        {
          id: "F1", title: "相變化與熔化熱、汽化熱", tags: ["src"],
          say: "冰變水只要讓粒子「鬆開一點」，水變水蒸氣卻要讓粒子「完全分開」，所以<b>汽化熱比熔化熱大很多</b>。看加熱曲線，沸騰那一段平台比熔化那一段長得多。",
          formula: "莫耳熔化熱：1 mol 固 → 液吸收的熱　　莫耳汽化熱：1 mol 液 → 氣吸收的熱　　同一物質：汽化熱 &gt; 熔化熱<br><span style=\"font-size:.8em\">水：熔化熱 6.0 kJ/mol，汽化熱 40.7 kJ/mol</span>",
          widget: { id: "w-phase", aria: "水的加熱曲線，平台長度代表熔化熱與汽化熱", rw: 0.42, rn: 0.8,
            controls: [{ k: "q", label: "加入熱量 (kJ)", min: 0, max: 56, step: 0.5 }], play: { k: "q", dur: 6000 } },
          space: "橫軸換成「加了多少熱」之後，平台長度就是熔化熱和汽化熱：沸騰那段大約是熔化那段的 7 倍長。",
          trap: "平台那段也用 Q = msΔT 算。平台時 ΔT = 0，熱量要用莫耳數 × 熔化熱（或汽化熱）。",
          quiz: { q: "下列有關物質狀態變化的敘述，何者正確？", answer: "c", options: [
            { c: "a", text: "相變化時溫度一定會改變", why: "定壓下兩相共存時溫度不變，熱用在改變狀態。" },
            { c: "b", text: "蒸發只會在沸點以上發生", why: "蒸發在任何溫度都會發生，只在液面。" },
            { c: "c", text: "同一物質的莫耳汽化熱大於莫耳熔化熱" },
            { c: "d", text: "凝固是吸熱過程", why: "凝固放熱，是熔化的反向。" }] },
          sol: { id: "s-F1", aria: "逐步圖解：比較兩段平台長度" }
        },
        {
          id: "F2", title: "飽和蒸氣壓與沸點", tags: ["src"],
          say: "液體一直有粒子從表面跑出去，也有粒子跑回來，兩者一樣快時的蒸氣壓力叫<b>飽和蒸氣壓</b>，只跟溫度和物質種類有關。<b>蒸氣壓 = 外界壓力</b>時，液體內部也能冒泡，就是沸騰。外界壓力越低（高山上），沸點越低。",
          formula: "沸騰條件：<i>P</i><sub>蒸氣</sub> = <i>P</i><sub>外界</sub>　　正常沸點：外壓 1 atm 時的沸點　　同溫下蒸氣壓越大 → 越容易揮發 → 沸點越低",
          widget: { id: "w-bp", aria: "兩種液體的蒸氣壓曲線與外界壓力水平線的交點即沸點", rw: 0.45, rn: 0.85,
            controls: [{ k: "p", label: "外界壓力 (mmHg)", min: 200, max: 1000, step: 10 }] },
          space: "把外界壓力往下拉（爬山）：水平線往下移，和曲線的交點往左，沸點變低。在玉山頂上水大約 88 °C 就沸騰了。",
          trap: "以為沸點永遠是 100 °C。100 °C 只是 1 atm 下水的「正常沸點」。",
          quiz: { q: "25 °C 時，甲液體的飽和蒸氣壓是 59 mmHg，乙液體是 114 mmHg。下列何者正確？", answer: "a", options: [
            { c: "a", text: "甲的沸點較高" },
            { c: "b", text: "乙的沸點較高", why: "乙的蒸氣壓大，比較容易達到外壓，沸點反而較低。" },
            { c: "c", text: "甲比較容易揮發", why: "蒸氣壓大的乙比較容易揮發。" },
            { c: "d", text: "容器越大，兩者的蒸氣壓越大", why: "飽和蒸氣壓只和溫度、物質種類有關，和容器大小無關。" }] },
          sol: { id: "s-F2", aria: "逐步圖解：哪條曲線先碰到 760" }
        },
        {
          id: "F3", title: "相對溼度", tags: ["src"],
          say: "空氣中的水蒸氣分壓，跟「這個溫度最多能有多少」比一比，就是<b>相對溼度</b>。同樣多的水氣，天氣一冷，最多能裝的變少，相對溼度就升高，到 100% 就開始凝結（起霧、結露）。",
          formula: "相對溼度 = <span class=\"fr\"><span><i>P</i><sub>水蒸氣</sub></span><span>該溫度水的飽和蒸氣壓 <i>P</i>°</span></span> × 100%",
          widget: { id: "w-rh", aria: "水蒸氣分壓與飽和蒸氣壓的比例", rw: 0.36, rn: 0.7,
            controls: [{ k: "t", label: "氣溫 (°C)", min: 10, max: 35, step: 1 }, { k: "pw", label: "水蒸氣分壓", min: 5, max: 40, step: 0.5 }] },
          space: "固定水蒸氣分壓，把氣溫往下調：藍色長條（最多能裝的量）變短，比例變大。超過 100% 的部分就會凝結成水。",
          trap: "分子分母放反，或把百分比忘了乘 100。",
          quiz: { q: "25 °C 時水的飽和蒸氣壓是 23.8 mmHg，空氣中水蒸氣分壓是 17.85 mmHg。相對溼度是？", answer: "b", options: [
            { c: "a", text: "133%", why: "放反了：23.8 ÷ 17.85。相對溼度不會超過 100%。" },
            { c: "b", text: "75%" },
            { c: "c", text: "5.95%", why: "這是兩者相減的差值。" },
            { c: "d", text: "0.75%", why: "17.85 ÷ 23.8 = 0.75，要乘 100%。" }] },
          sol: { id: "s-F3", aria: "逐步圖解：實際 ÷ 最多" }
        }
      ]
    },
    {
      id: "3-2", short: "溶液", title: "溶液的性質與依數性質",
      plan: { goal: "會用拉午耳定律、亨利定律，算沸點上升、凝固點下降、滲透壓，並考慮電解質的凡特何夫因子 i。", prereq: "莫耳分率；重量莫耳濃度 m 與體積莫耳濃度 M。", time: "約 4 節課。" },
      cards: [
        {
          id: "F4", title: "拉午耳定律 P = X·P°", tags: ["src"],
          say: "溶液表面一部分位置被別的粒子佔走，溶劑粒子能跑出去的機會就變少。<b>每個成分的蒸氣壓 = 它的莫耳分率 × 純物質的蒸氣壓</b>。兩種都會揮發時，蒸氣裡比較會跑的那個（P° 大的）比例會更高。",
          formula: "<i>P</i><sub>A</sub> = <i>X</i><sub>A</sub> · <i>P</i>°<sub>A</sub>　　<i>P</i><sub>總</sub> = <i>P</i><sub>A</sub> + <i>P</i><sub>B</sub>　　氣相莫耳分率 <i>y</i><sub>A</sub> = <span class=\"fr\"><span><i>P</i><sub>A</sub></span><span><i>P</i><sub>總</sub></span></span>",
          widget: { id: "w-raoult", aria: "苯與甲苯理想溶液的分壓直線與總壓", rw: 0.45, rn: 0.85,
            controls: [{ k: "x", label: "液相苯 X", min: 0, max: 1, step: 0.05 }] },
          space: "兩條分壓都是直線（理想溶液），總壓是兩條相加。液相苯只佔 60%，可是蒸氣裡苯卻佔 84%，因為苯比較會揮發。",
          trap: "把液相的莫耳分率當成氣相的莫耳分率。",
          quiz: { q: "純苯蒸氣壓 70 mmHg、純甲苯 20 mmHg，形成理想溶液。液相中苯的莫耳分率 0.60 時，氣相中苯的莫耳分率是？", answer: "c", options: [
            { c: "a", text: "0.60", why: "那是液相。氣相要用分壓比：42 ÷ 50。" },
            { c: "b", text: "0.78", why: "70 ÷ 90 沒有用到莫耳分率。" },
            { c: "c", text: "0.84" },
            { c: "d", text: "0.42", why: "42 是苯的分壓（mmHg），還要除以總壓 50。" }] },
          sol: { id: "s-F4", aria: "逐步圖解：分壓、總壓、再相除" }
        },
        {
          id: "F5", title: "依數性質：蒸氣壓下降與沸點上升", tags: ["src", "add"],
          say: "加入不會揮發的溶質（糖、鹽），溶液的蒸氣壓整條往下掉。要碰到外壓 760 mmHg，就得<b>再熱一點</b>，所以沸點上升；同理凝固點下降。這些變化只看<b>溶質粒子有多少</b>，不看是什麼粒子，叫依數性質。",
          formula: "Δ<i>T</i><sub>b</sub> = <i>K</i><sub>b</sub> · <i>C</i><sub>m</sub> · <i>i</i>　　Δ<i>T</i><sub>f</sub> = <i>K</i><sub>f</sub> · <i>C</i><sub>m</sub> · <i>i</i>　　水：<i>K</i><sub>b</sub> = 0.52、<i>K</i><sub>f</sub> = 1.86 °C/m<br><span style=\"font-size:.8em\"><i>C</i><sub>m</sub>：重量莫耳濃度（mol 溶質 / kg 溶劑）</span>",
          widget: { id: "w-colig", aria: "純水與溶液的蒸氣壓曲線，溶液要較高溫才達 760 mmHg", rw: 0.45, rn: 0.85,
            controls: [{ k: "m", label: "濃度 Cm (m)", min: 0, max: 4, step: 0.1 }] },
          space: "藍線（純水）和紅線（溶液）中間的水平距離，就是沸點上升 ΔTb。濃度越大，紅線掉越多，兩線距離越遠。（圖中差距放大顯示。）",
          trap: "用體積莫耳濃度 M 代 Kb 公式；或凝固點寫成 0 + ΔTf（要減）。",
          quiz: { q: "1 atm 下，0.50 m 蔗糖水溶液的沸點是？（水 Kb = 0.52 °C/m）", answer: "a", options: [
            { c: "a", text: "100.26 °C" },
            { c: "b", text: "99.74 °C", why: "加溶質是沸點「上升」，要加上去。" },
            { c: "c", text: "100.52 °C", why: "要乘濃度 0.50 m：0.52 × 0.50 = 0.26。" },
            { c: "d", text: "100.93 °C", why: "1.86 是 Kf（凝固點下降用），沸點要用 Kb。" }] },
          sol: { id: "s-F5", aria: "逐步圖解：ΔTb = Kb × Cm" }
        },
        {
          id: "F6", title: "電解質與凡特何夫因子 i", tags: ["src"],
          say: "同樣 0.10 m，糖溶在水裡還是一個一個的分子；NaCl 會拆成 Na⁺ 和 Cl⁻ <b>兩個</b>粒子；CaCl₂ 拆成<b>三個</b>。依數性質只看粒子數，所以要乘上 i。",
          formula: "有效粒子濃度 = <i>i</i> × <i>C</i>　　非電解質 <i>i</i> = 1　　NaCl <i>i</i> ≈ 2　　CaCl<sub>2</sub> <i>i</i> ≈ 3",
          widget: { id: "w-vant", aria: "不同溶質溶解後的粒子數與凝固點下降", rw: 0.4, rn: 0.8,
            controls: [{ k: "i", label: "溶質", min: 0, max: 3, step: 1 }] },
          space: "左邊看粒子：一個 CaCl₂ 變三個粒子。右邊長條：凝固點下降的量剛好是糖的 3 倍。",
          trap: "只看化學式的莫耳數，忘了電解質會解離。",
          quiz: { q: "下列各 0.10 m 水溶液，哪一個的凝固點最低？", answer: "d", options: [
            { c: "a", text: "葡萄糖", why: "非電解質不解離，i = 1，粒子最少。" },
            { c: "b", text: "尿素", why: "非電解質，i = 1。" },
            { c: "c", text: "NaCl", why: "i = 2，但 CaCl₂ 的 i = 3 更多。" },
            { c: "d", text: "CaCl₂" }] },
          sol: { id: "s-F6", aria: "逐步圖解：數粒子" }
        },
        {
          id: "F7", title: "亨利定律：氣體的溶解度", tags: ["src"],
          say: "汽水打開會冒泡，因為瓶內的 CO₂ 壓力突然變小，水裡能溶的 CO₂ 也跟著變少。<b>難溶氣體的溶解度和它在液面上的分壓成正比</b>。另外，氣體溶解度隨溫度升高而<b>降低</b>，跟大多數固體相反。",
          formula: "<i>C</i> = <i>k</i> · <i>P</i>　　（<i>k</i>：亨利常數，與氣體種類、溫度有關）",
          widget: { id: "w-henry", aria: "液面上的氣體分壓與溶在水中的氣體粒子數成正比", rw: 0.42, rn: 0.85,
            controls: [{ k: "p", label: "氣體分壓 (atm)", min: 0.1, max: 2, step: 0.05 }] },
          space: "分壓變兩倍，水裡的氣體粒子也變兩倍。潛水員上升太快，壓力驟降，血液裡的氮氣冒出來，就是潛水夫病。",
          trap: "把壓力關係想反，或以為溫度越高氣體越好溶。",
          quiz: { q: "O₂ 在水中的亨利常數是 1.3×10⁻³ M/atm，空氣中 O₂ 分壓 0.20 atm。O₂ 在水中的溶解度是？", answer: "b", options: [
            { c: "a", text: "1.3×10⁻³ M", why: "那是分壓 1 atm 時的溶解度，還要乘 0.20。" },
            { c: "b", text: "2.6×10⁻⁴ M" },
            { c: "c", text: "6.5×10⁻³ M", why: "要相乘，不是相除。" },
            { c: "d", text: "2.6×10⁻³ M", why: "1.3 × 0.20 = 0.26，指數要變成 10⁻⁴。" }] },
          sol: { id: "s-F7", aria: "逐步圖解：k × P" }
        },
        {
          id: "F8", title: "滲透壓與細胞", tags: ["src", "add"],
          say: "半透膜只讓水通過。水會從<b>粒子少的一邊流向粒子多的一邊</b>，想把兩邊沖淡成一樣。要阻止這股水流需要的壓力就是滲透壓。紅血球放進濃的溶液（高張）會失水<b>皺縮</b>，放進稀的（低張）會吸水<b>脹破</b>。",
          formula: "π = <i>i</i> · <i>C</i><sub>M</sub> · <i>R</i> · <i>T</i>　　高張：外面有效粒子濃度較大 → 細胞失水皺縮　　低張 → 細胞吸水膨脹",
          widget: { id: "w-osmo", aria: "紅血球在不同濃度溶液中，水的移動方向與細胞大小", rw: 0.4, rn: 0.8,
            controls: [{ k: "c", label: "外液有效濃度 (M)", min: 0, max: 0.6, step: 0.01 }] },
          space: "把外液濃度調到 0.30 M（和血液一樣），箭頭消失、細胞大小不變，這就是「等張」，生理食鹽水就是這樣配的。",
          trap: "只看化學式的濃度（0.20 M NaCl），忘了乘 i = 2，其實是 0.40 M 的粒子。",
          quiz: { q: "血液的有效粒子濃度約 0.30 M。把紅血球放進 0.20 M 的 NaCl 溶液中，會？", answer: "a", options: [
            { c: "a", text: "皺縮" },
            { c: "b", text: "膨脹破裂", why: "0.20 M NaCl 解離成 0.40 M 粒子，比血液 0.30 M 濃，是高張。" },
            { c: "c", text: "不變", why: "要乘 i = 2，外液粒子濃度 0.40 M，不等張。" },
            { c: "d", text: "要看溫度", why: "高張或低張只看兩邊有效粒子濃度。" }] },
          sol: { id: "s-F8", aria: "逐步圖解：先乘 i 再比較" }
        }
      ]
    }
  ],
  footer: [
    "課本：高二化學 第3章 液態與溶液（教材包 tm_39）。",
    "常數：水的熔化熱 6.0 kJ/mol、汽化熱 40.7 kJ/mol、Kb = 0.52 °C/m、Kf = 1.86 °C/m。蒸氣壓曲線依常用數據繪製，依數性質圖的差距放大顯示。"
  ],
  script: String.raw`
var VPW=[[0,4.6],[10,9.2],[20,17.5],[25,23.8],[30,31.8],[40,55.3],[50,92.5],[60,149.4],[70,233.7],[80,355.1],[90,525.8],[100,760],[110,1075],[120,1489]];
function vpw(t){ for(var i=1;i<VPW.length;i++){ if(t<=VPW[i][0]){ var a=VPW[i-1], b=VPW[i], u=(t-a[0])/(b[0]-a[0]); return a[1]*Math.pow(b[1]/a[1],u); } } return 1489; }
function inv(f,p,lo,hi){ for(var k=0;k<60;k++){ var m=(lo+hi)/2; if(f(m)<p) lo=m; else hi=m; } return (lo+hi)/2; }

/* F1 加熱曲線（橫軸為熱量，1 mol 水） */
function heatQ(q){ if(q<0.76) return -20+q/0.0376; if(q<6.76) return 0; if(q<14.29) return (q-6.76)/0.0753; if(q<54.99) return 100; return 100+(q-54.99)/0.0337; }
function phaseDraw(g,c,C,q,mark){ var G=frame(full(c),-3,60,-35,130,26,false); axes(g,G,[0,58,-30,125],C,{xstep:10,ystep:20,xlabel:'熱量 (kJ)',ylabel:'°C',y0:-30});
  clipTo(g,G,0,58,-30,125); plot(g,G,heatQ,0,57,C.muted,1.5,[4,4]); plot(g,G,heatQ,0,q,C.blue,3.5); g.restore(); dot(g,G.X(q),G.Y(heatQ(q)),6,C.red);
  if(mark){ L(g,G.X(0.76),G.Y(-8),G.X(6.76),G.Y(-8),C.teal,4); T(g,'熔化 6.0',G.X(3.8),G.Y(-8)+14,C.teal,12,'center','700'); L(g,G.X(14.29),G.Y(88),G.X(54.99),G.Y(88),C.red,4); T(g,'汽化 40.7 kJ',G.X(34.6),G.Y(88)-12,C.red,12,'center','700'); } }
widget('w-phase',{state:{q:10},rw:0.42,rn:0.8,
  fmt:{q:function(v){return v.toFixed(1)+' kJ';}},
  draw:function(g,c,s){ phaseDraw(g,c,c.C,s.q,true); },
  out:function(s){ var t=heatQ(s.q), st=s.q<0.76?'冰在升溫':s.q<6.76?'冰熔化中（0 °C 不變）':s.q<14.29?'水在升溫':s.q<54.99?'水沸騰中（100 °C 不變）':'水蒸氣在升溫'; return '1 mol 水，已加入 '+s.q.toFixed(1)+' kJ：<b>'+st+'</b>，'+t.toFixed(1)+' °C'; }
});
widget('s-F1',{state:{},steps:2,rw:0.42,rn:0.8,
  draw:function(g,c,s){ phaseDraw(g,c,c.C,s.step?57:7,true); },
  out:steps(['熔化的平台（青綠）只需 6.0 kJ：粒子只是鬆開。','沸騰的平台（紅）要 40.7 kJ：粒子要完全分開，所以<b>汽化熱 > 熔化熱</b>。'])
});

/* F2 蒸氣壓曲線與沸點 */
function vpA(t){ return 59*Math.exp(0.034*(t-25)); } function vpB(t){ return 114*Math.exp(0.036*(t-25)); }
function bpDraw(g,c,C,p,mark){ var G=frame(full(c),-6,125,-60,1080,26,false); axes(g,G,[0,120,0,1050],C,{xstep:20,ystep:200,xlabel:'t (°C)',ylabel:'mmHg'});
  clipTo(g,G,0,120,0,1050); plot(g,G,vpw,0,115,C.muted,1.5,[4,4]);
  plot(g,G,vpA,0,120,C.teal,3); plot(g,G,vpB,0,120,C.gold,3); g.restore(); T(g,'水',G.X(103),G.Y(vpw(103))-8,C.muted,11,'left'); T(g,'甲',G.X(95),G.Y(vpA(95))-10,C.teal,13,'center','700'); T(g,'乙',G.X(75),G.Y(vpB(75))-10,C.gold,13,'center','700');
  L(g,G.X(0),G.Y(p),G.X(120),G.Y(p),C.red,2,[6,4]); T(g,'外界壓力 '+p,G.X(119),G.Y(p)-10,C.red,11,'right','700');
  var ta=inv(vpA,p,0,200), tb=inv(vpB,p,0,200); [ [ta,C.teal],[tb,C.gold] ].forEach(function(o){ if(o[0]<120){ dot(g,G.X(o[0]),G.Y(p),6,o[1]); L(g,G.X(o[0]),G.Y(p),G.X(o[0]),G.Y(0),o[1],1.2,[3,3]); } });
  if(mark){ dot(g,G.X(25),G.Y(59),5,C.teal); dot(g,G.X(25),G.Y(114),5,C.gold); L(g,G.X(25),G.Y(0),G.X(25),G.Y(160),C.ink,1,[3,3]); T(g,'25 °C',G.X(25),G.Y(0)+24,C.ink,11,'center','700'); } return [ta,tb]; }
widget('w-bp',{state:{p:760},rw:0.45,rn:0.85,
  fmt:{p:function(v){return v+' mmHg';}},
  draw:function(g,c,s){ bpDraw(g,c,c.C,s.p,false); },
  out:function(s){ var ta=inv(vpA,s.p,0,200), tb=inv(vpB,s.p,0,200), tw=inv(vpw,s.p,0,120); return '外界 '+s.p+' mmHg：甲沸點 <b>'+ta.toFixed(0)+' °C</b>、乙沸點 <b>'+tb.toFixed(0)+' °C</b>、水 '+tw.toFixed(0)+' °C　｜　蒸氣壓大的乙先碰到水平線，沸點較低'; }
});
widget('s-F2',{state:{},steps:2,rw:0.45,rn:0.85,
  draw:function(g,c,s){ bpDraw(g,c,c.C,760,true); },
  out:steps(['25 °C 時甲 59 mmHg、乙 114 mmHg：乙比較會揮發，曲線整條比較高。','外壓 760 mmHg 時，乙的曲線先碰到紅線（溫度較低）。所以<b>甲的沸點較高</b>。'])
});

/* F3 相對溼度 */
function rhDraw(g,c,C,t,pw){ var ps=vpw(t), G=frame(full(c),-2,10,-4,48,24,false); axes(g,G,[0,9.5,0,46],C,{xstep:100,ystep:10,ylabel:'mmHg'});
  box(g,G.X(1.5),G.Y(ps),2.2*G.sx,ps*G.sy,alpha(C.blue,0.18),C.blue,2); T(g,'最多 '+ps.toFixed(1),G.X(2.6),G.Y(ps)-10,C.blue,12,'center','700');
  var shown=Math.min(pw,ps); box(g,G.X(5),G.Y(shown),2.2*G.sx,shown*G.sy,alpha(C.teal,0.45),C.teal,2); T(g,'實際 '+pw.toFixed(1),G.X(6.1),G.Y(pw)-10,C.teal,12,'center','700');
  if(pw>ps){ box(g,G.X(5),G.Y(pw),2.2*G.sx,(pw-ps)*G.sy,alpha(C.red,0.35),C.red,2,[3,3]); T(g,'凝結',G.X(7.4),G.Y((pw+ps)/2),C.red,12,'left','700'); } }
widget('w-rh',{state:{t:25,pw:17.85},rw:0.36,rn:0.7,
  fmt:{t:function(v){return v+' °C';},pw:function(v){return v.toFixed(1)+' mmHg';}},
  draw:function(g,c,s){ rhDraw(g,c,c.C,s.t,s.pw); },
  out:function(s){ var r=s.pw/vpw(s.t)*100; return '相對溼度 = '+s.pw.toFixed(1)+' ÷ '+vpw(s.t).toFixed(1)+' = <b>'+Math.min(r,100).toFixed(0)+'%</b>'+(r>100?'（超過飽和，多出來的會凝結）':''); }
});
widget('s-F3',{state:{},steps:2,rw:0.36,rn:0.7,
  draw:function(g,c,s){ rhDraw(g,c,c.C,25,17.85); },
  out:steps(['25 °C 時最多能有 23.8 mmHg（藍），實際只有 17.85 mmHg（青綠）。','相對溼度 = 17.85 ÷ 23.8 × 100% = <b>75%</b>。'])
});

/* F4 拉午耳 */
function raoultDraw(g,c,C,x,mark){ var G=frame(full(c),-0.08,1.12,-6,80,26,false); axes(g,G,[0,1,0,75],C,{xstep:0.2,ystep:10,xlabel:'液相苯 X',ylabel:'mmHg'});
  L(g,G.X(0),G.Y(0),G.X(1),G.Y(70),C.red,2); L(g,G.X(0),G.Y(20),G.X(1),G.Y(0),C.blue,2); L(g,G.X(0),G.Y(20),G.X(1),G.Y(70),C.ink,3);
  T(g,'苯分壓',G.X(1)+4,G.Y(70)+14,C.red,11,'left','700'); T(g,'甲苯分壓',G.X(0)+4,G.Y(20)+12,C.blue,11,'left','700'); T(g,'總壓',G.X(0.5),G.Y(45)-10,C.ink,12,'center','700');
  var pb=70*x, pt=20*(1-x), P=pb+pt; L(g,G.X(x),G.Y(0),G.X(x),G.Y(P),C.muted,1,[3,3]);
  dot(g,G.X(x),G.Y(pb),5,C.red); dot(g,G.X(x),G.Y(pt),5,C.blue); dot(g,G.X(x),G.Y(P),6,C.ink);
  if(mark){ T(g,'42',G.X(x)+8,G.Y(pb),C.red,12,'left','700'); T(g,'8',G.X(x)+8,G.Y(pt),C.blue,12,'left','700'); T(g,'50',G.X(x)+8,G.Y(P),C.ink,12,'left','700'); } }
widget('w-raoult',{state:{x:0.6},rw:0.45,rn:0.85,
  fmt:{x:function(v){return v.toFixed(2);}},
  draw:function(g,c,s){ raoultDraw(g,c,c.C,s.x,false); },
  out:function(s){ var pb=70*s.x, pt=20*(1-s.x), P=pb+pt; return 'P苯 = '+s.x.toFixed(2)+' × 70 = '+pb.toFixed(1)+'　P甲苯 = '+(1-s.x).toFixed(2)+' × 20 = '+pt.toFixed(1)+'　總壓 '+P.toFixed(1)+'　→　氣相苯 y = <b>'+(P?pb/P:0).toFixed(2)+'</b>（液相只有 '+s.x.toFixed(2)+'）'; }
});
widget('s-F4',{state:{},steps:3,rw:0.45,rn:0.85,
  draw:function(g,c,s){ raoultDraw(g,c,c.C,0.6,true); },
  out:steps(['苯分壓 = 0.60 × 70 = <b>42 mmHg</b>；甲苯分壓 = 0.40 × 20 = <b>8 mmHg</b>。','總壓 = 42 + 8 = <b>50 mmHg</b>。','氣相苯的莫耳分率 = 42 ÷ 50 = <b>0.84</b>，比液相 0.60 高：會揮發的跑得多。'])
});

/* F5 依數性質 */
function coligDraw(g,c,C,m,mark){ var G=frame(full(c),88,112,560,960,26,false), sh=m*0.52, amp=4;
  axes(g,G,[90,110,600,950],C,{xstep:5,ystep:100,xlabel:'t (°C)',ylabel:'mmHg'});
  clipTo(g,G,90,110,600,950); plot(g,G,vpw,90,110,C.blue,3); plot(g,G,function(t){return vpw(t-sh*amp);},90,110,C.red,3); g.restore();
  L(g,G.X(90),G.Y(760),G.X(110),G.Y(760),C.ink,1.5,[6,4]); T(g,'760 mmHg',G.X(90.2),G.Y(760)-10,C.ink,11,'left','700');
  dot(g,G.X(100),G.Y(760),6,C.blue); dot(g,G.X(100+sh*amp),G.Y(760),6,C.red);
  if(sh>0.01){ L(g,G.X(100),G.Y(720),G.X(100+sh*amp),G.Y(720),C.gold,4); T(g,'ΔTb',G.X(100+sh*amp/2),G.Y(720)+14,C.gold,12,'center','700'); }
  T(g,'藍：純水　紅：溶液（差距放大 4 倍）',G.X(110),G.Y(950),C.muted,11,'right'); }
widget('w-colig',{state:{m:1},rw:0.45,rn:0.85,
  fmt:{m:function(v){return v.toFixed(1)+' m';}},
  draw:function(g,c,s){ coligDraw(g,c,c.C,s.m,false); },
  out:function(s){ var b=0.52*s.m, f=1.86*s.m; return 'ΔTb = 0.52 × '+s.m.toFixed(1)+' = '+b.toFixed(2)+' → 沸點 <b>'+(100+b).toFixed(2)+' °C</b>　｜　ΔTf = 1.86 × '+s.m.toFixed(1)+' = '+f.toFixed(2)+' → 凝固點 <b>'+(-f).toFixed(2)+' °C</b>'; }
});
widget('s-F5',{state:{},steps:2,rw:0.45,rn:0.85,
  draw:function(g,c,s){ coligDraw(g,c,c.C,s.step?0.5:0,true); },
  out:steps(['純水在 100 °C 時蒸氣壓剛好 760 mmHg。蔗糖不解離，i = 1。','ΔTb = 0.52 × 0.50 = 0.26 °C，沸點 = 100 + 0.26 = <b>100.26 °C</b>。'])
});

/* F6 凡特何夫因子 */
var SOL=[['葡萄糖',1,'C₆H₁₂O₆'],['尿素',1,'CO(NH₂)₂'],['NaCl',2,'Na⁺ + Cl⁻'],['CaCl₂',3,'Ca²⁺ + 2Cl⁻']];
function vantDraw(g,c,C,idx,all){ var P=panels(c,0.45), G=frame(P[0],0,10,0,10,14,false), it=SOL[idx], rnd=seeded(13+idx);
  box(g,G.X(0.5),G.Y(9.5),9*G.sx,8.5*G.sy,alpha(C.blue,0.06),C.ink,1.5);
  for(var k=0;k<4;k++){ var cx=1.8+(k%2)*4.4, cy=7-Math.floor(k/2)*3.6; if(it[1]===1){ dot(g,G.X(cx),G.Y(cy),9,C.teal); } else { dot(g,G.X(cx-0.7),G.Y(cy),8,idx===3?C.gold:C.blue); dot(g,G.X(cx+0.7),G.Y(cy),6,C.red); if(it[1]===3) dot(g,G.X(cx),G.Y(cy-1.1),6,C.red); } }
  T(g,it[0]+' → '+it[2]+'（i = '+it[1]+'）',G.X(5),G.Y(0.4),C.ink,13,'center','700');
  var H=frame(P[1],-0.5,4.5,-0.08,0.65,24,false); axes(g,H,[0,4.2,0,0.6],C,{xstep:10,ystep:0.1,ylabel:'ΔTf (°C)'});
  SOL.forEach(function(sv,i){ var d=1.86*0.10*sv[1], on=all||i===idx; box(g,H.X(i+0.2),H.Y(d),0.65*H.sx,d*H.sy,alpha(on?C.red:C.muted,on?0.45:0.15),on?C.red:C.grid,on?2:1); T(g,sv[0],H.X(i+0.52),H.Y(0)+14,C.ink,11,'center',on?'700':'500'); if(on) T(g,d.toFixed(3),H.X(i+0.52),H.Y(d)-10,C.red,11,'center','700'); }); }
widget('w-vant',{state:{i:2},rw:0.4,rn:0.8,
  fmt:{i:function(v){return SOL[v][0];}},
  draw:function(g,c,s){ vantDraw(g,c,c.C,s.i,false); },
  out:function(s){ var it=SOL[s.i], d=1.86*0.10*it[1]; return '0.10 m '+it[0]+'：i = '+it[1]+'，有效粒子 '+(0.10*it[1]).toFixed(2)+' m　→　ΔTf = 1.86 × 0.10 × '+it[1]+' = '+d.toFixed(3)+'，凝固點 <b>'+(-d).toFixed(3)+' °C</b>'; }
});
widget('s-F6',{state:{},steps:2,rw:0.4,rn:0.8,
  draw:function(g,c,s){ vantDraw(g,c,c.C,s.step?3:2,s.step>=1); },
  out:steps(['濃度一樣是 0.10 m，比的是解離後的粒子數：葡萄糖、尿素 i = 1，NaCl i = 2，CaCl₂ i = 3。','粒子最多的 <b>CaCl₂</b> 凝固點下降最多，凝固點最低（約 −0.56 °C）。'])
});

/* F7 亨利定律 */
function henryDraw(g,c,C,p){ var G=frame(full(c),0,10,0,10,14,false), rnd=seeded(4), up=Math.round(p*14), dn=Math.round(p*10);
  box(g,G.X(1),G.Y(9.5),8*G.sx,9*G.sy,null,C.ink,2); box(g,G.X(1),G.Y(5),8*G.sx,4.5*G.sy,alpha(C.blue,0.18),null);
  for(var i=0;i<up;i++) dot(g,G.X(1.3+rnd()*7.4),G.Y(5.4+rnd()*3.8),4,C.red); for(var j=0;j<dn;j++) dot(g,G.X(1.3+rnd()*7.4),G.Y(0.8+rnd()*3.9),4,C.red);
  T(g,'氣體分壓 '+p.toFixed(2)+' atm',G.X(9.2),G.Y(9.2),C.red,12,'right','700'); T(g,'溶在水中',G.X(9.2),G.Y(1),C.blue,12,'right','700'); }
widget('w-henry',{state:{p:0.2},rw:0.42,rn:0.85,
  fmt:{p:function(v){return v.toFixed(2)+' atm';}},
  draw:function(g,c,s){ henryDraw(g,c,c.C,s.p); },
  out:function(s){ var C1=1.3e-3*s.p; return 'O₂ 溶解度 = 1.3×10⁻³ × '+s.p.toFixed(2)+' = <b>'+C1.toExponential(2).replace('e-','×10^−')+' M</b>（分壓幾倍，溶解度就幾倍）'; }
});
widget('s-F7',{state:{},steps:2,rw:0.42,rn:0.85,
  draw:function(g,c,s){ henryDraw(g,c,c.C,s.step?0.2:1); },
  out:steps(['分壓 1 atm 時，溶解度就是亨利常數 1.3×10⁻³ M。','分壓 0.20 atm：C = 1.3×10⁻³ × 0.20 = <b>2.6×10⁻⁴ M</b>。'])
});

/* F8 滲透壓與細胞 */
function osmoDraw(g,c,C,cout){ var G=frame(full(c),-5,5,-3.2,3.2,14,true), cin=0.30, r=1.6*Math.pow(cin/Math.max(cout,0.05),0.22); r=Math.max(0.9,Math.min(2.3,r));
  box(g,G.X(-4.8),G.Y(3),9.6*G.sx,6*G.sy,alpha(C.blue,0.04+0.4*Math.min(cout,0.6)),null);
  g.save(); g.fillStyle=alpha(C.red,0.55); g.strokeStyle=C.red; g.lineWidth=2.5; g.beginPath(); g.ellipse(G.X(0),G.Y(0),r*G.sx,r*0.8*G.sx,0,0,TAU); g.fill(); g.stroke(); g.restore();
  T(g,'細胞內 0.30 M',G.X(0),G.Y(0),C.sheet,12,'center','700'); T(g,'外液 '+cout.toFixed(2)+' M',G.X(-4.6),G.Y(2.7),C.ink,12,'left','700');
  var d=cout-cin; if(Math.abs(d)>0.015){ var out=d>0; [0,1,2,3].forEach(function(k){ var a=k*PI/2+PI/4, r1=r+0.2, r2=r+1.0; var x1=(out?r1:r2)*Math.cos(a), y1=(out?r1:r2)*Math.sin(a)*0.8, x2=(out?r2:r1)*Math.cos(a), y2=(out?r2:r1)*Math.sin(a)*0.8; L(g,G.X(x1),G.Y(y1),G.X(x2),G.Y(y2),C.blue,3); dot(g,G.X(x2),G.Y(y2),4,C.blue); }); T(g,out?'水往外跑：皺縮':'水往內跑：膨脹',G.X(0),G.Y(-2.8),out?C.red:C.blue,13,'center','700'); }
  else T(g,'等張：大小不變',G.X(0),G.Y(-2.8),C.teal,13,'center','700'); }
widget('w-osmo',{state:{c:0.4},rw:0.4,rn:0.8,
  fmt:{c:function(v){return v.toFixed(2)+' M';}},
  draw:function(g,c,s){ osmoDraw(g,c,c.C,s.c); },
  out:function(s){ var d=s.c-0.30; return '外液有效粒子 '+s.c.toFixed(2)+' M、細胞內 0.30 M　→　<b>'+(Math.abs(d)<0.015?'等張，細胞不變':d>0?'高張，細胞失水皺縮':'低張，細胞吸水膨脹')+'</b>　｜　π = CRT = '+s.c.toFixed(2)+' × 0.082 × 310 = '+(s.c*0.082*310).toFixed(2)+' atm'; }
});
widget('s-F8',{state:{},steps:2,rw:0.4,rn:0.8,
  draw:function(g,c,s){ osmoDraw(g,c,c.C,s.step?0.4:0.2); },
  out:steps(['只看化學式：0.20 M 比 0.30 M 稀，好像是低張？<b>不對！</b>','NaCl 解離 i = 2：有效粒子 0.20 × 2 = <b>0.40 M</b> > 0.30 M，是高張，紅血球<b>失水皺縮</b>。'])
});
`
};
