/* docs/TeachingMaterials/lessons/shared/LessonRuntime.js — 圖解教材共用引擎.

   Loaded at the end of every lesson page's <body>, BEFORE the lesson's own
   widget script. Defines (as page globals, the lesson page is isolated in
   its own iframe/tab) the drawing kit and widget():

     frame / full / panels           座標框（等比例或各自縮放）
     L T dot seg poly ra vline       線、文字、點、線段、多邊形、直角記號、鉛直線
     wArc wSector wRing wRay wText arcAt unitAxes gAxes plot plotClip  圓弧、扇形、軸與函數圖
     nf deg radFmt piFrac piHalf alpha steps norm  數字與顏色小工具
     widget(id, {state, draw, out, fmt, steps, rw, rn, constrain})
       滑桿 [data-k]、播放 [data-play]、逐步 [data-step]

   After the page's scripts ran (DOMContentLoaded) it wires the shared
   behaviour: 小試身手作答（.qc / data-answer / data-why / data-multi）,
   「我會了」進度（sessionStorage only）, theme/resize redraw, and the
   platform embed protocol (postMessage height / state / goto).
   No fetch, no localStorage, no import/export. */
'use strict';
var AHS = window.AHS = window.AHS || {};
var VL = AHS.VisualLesson = AHS.VisualLesson || {};
var ROOT_EL = document.getElementById('ahs-vl-root');
VL.meta = {schema:'AHS-VL-1', subject:ROOT_EL&&ROOT_EL.getAttribute('data-ahs-subject'), unit:ROOT_EL&&ROOT_EL.getAttribute('data-ahs-unit')};
VL.widgets = VL.widgets || {};
var renders = [];
var PI = Math.PI, TAU = 2*PI;
var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function tok(n){ return getComputedStyle(document.documentElement).getPropertyValue('--'+n).trim(); }
function pal(){ return {ink:tok('ink'),muted:tok('muted'),grid:tok('grid'),red:tok('red'),teal:tok('teal'),gold:tok('gold'),blue:tok('blue'),sheet:tok('sheet')}; }
function alpha(c,a){ if(!c||c[0]!=='#') return c; var h=c.slice(1); if(h.length===3) h=h.replace(/(.)/g,'$1$1'); var n=parseInt(h,16); return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'; }
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ var t=b; b=a%b; a=t; } return a; }
function piFrac(n,d){ if(n===0) return '0'; var g=gcd(n,d); n/=g; d/=g; var top=(n===1?'':n===-1?'−':n)+'π'; return d===1?top:top+'/'+d; }

function frame(R,x0,x1,y0,y1,pad,eq){
  pad = pad==null?20:pad;
  var sx=(R.w-2*pad)/(x1-x0), sy=(R.h-2*pad)/(y1-y0);
  if(eq){ var s=Math.min(sx,sy); sx=sy=s; }
  var cx=R.x+R.w/2, cy=R.y+R.h/2, mx=(x0+x1)/2, my=(y0+y1)/2;
  return {X:function(x){return cx+(x-mx)*sx;}, Y:function(y){return cy-(y-my)*sy;}, sx:sx, sy:sy};
}
function full(c){ return {x:0,y:0,w:c.w,h:c.h}; }
function panels(c,split){
  if(!c.narrow){ var lw=c.w*split; return [{x:0,y:0,w:lw,h:c.h},{x:lw,y:0,w:c.w-lw,h:c.h}]; }
  var th=c.h*0.46; return [{x:0,y:0,w:c.w,h:th},{x:0,y:th,w:c.w,h:c.h-th}];
}
function L(g,x1,y1,x2,y2,c,w,dash){ g.save(); g.strokeStyle=c; g.lineWidth=w||1.5; g.lineCap='round'; g.setLineDash(dash||[]); g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); g.restore(); }
function T(g,s,x,y,c,size,align,weight){ g.save(); g.fillStyle=c; g.font=(weight||'500')+' '+(size||13)+'px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif'; g.textAlign=align||'left'; g.textBaseline='middle'; g.fillText(s,x,y); g.restore(); }
function dot(g,x,y,r,c){ g.save(); g.fillStyle=c; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); g.restore(); }
function wArc(g,F,cx,cy,r,a0,a1,c,w,dash){ g.save(); g.strokeStyle=c; g.lineWidth=w||2; g.lineCap='round'; g.setLineDash(dash||[]); g.beginPath(); g.arc(F.X(cx),F.Y(cy),r*F.sx,-a0,-a1,a1>a0); g.stroke(); g.restore(); }
function wSector(g,F,cx,cy,r,a0,a1,fill){ g.save(); g.fillStyle=fill; g.beginPath(); g.moveTo(F.X(cx),F.Y(cy)); g.arc(F.X(cx),F.Y(cy),r*F.sx,-a0,-a1,a1>a0); g.closePath(); g.fill(); g.restore(); }
function wRing(g,F,r1,r2,a0,a1,fill){ g.save(); g.fillStyle=fill; g.beginPath(); g.arc(F.X(0),F.Y(0),r2*F.sx,-a0,-a1,true); g.arc(F.X(0),F.Y(0),r1*F.sx,-a1,-a0,false); g.closePath(); g.fill(); g.restore(); }
function wRay(g,F,r,a,c,w,dash,r0){ r0=r0||0; L(g,F.X(r0*Math.cos(a)),F.Y(r0*Math.sin(a)),F.X(r*Math.cos(a)),F.Y(r*Math.sin(a)),c,w,dash); }
function wText(g,F,s,r,a,c,size,w){ T(g,s,F.X(r*Math.cos(a)),F.Y(r*Math.sin(a)),c,size||12,'center',w||'700'); }
function poly(g,F,pts,fill,stroke){ g.save(); g.beginPath(); pts.forEach(function(p,i){ if(i) g.lineTo(F.X(p[0]),F.Y(p[1])); else g.moveTo(F.X(p[0]),F.Y(p[1])); }); g.closePath(); if(fill){g.fillStyle=fill; g.fill();} if(stroke){g.strokeStyle=stroke; g.lineWidth=1; g.stroke();} g.restore(); }
function piHalf(k){ if(k%2===0){ var n=k/2; return n===1?'π':n===-1?'−π':n+'π'; } return k===1?'π/2':k===-1?'−π/2':(k<0?'−'+(-k):k)+'π/2'; }
function gAxes(g,G,x0,x1,y0,y1,C,ystep){
  for(var k=Math.ceil(x0/(PI/2)); k*PI/2<=x1+1e-9; k++){ var X=G.X(k*PI/2); L(g,X,G.Y(y0),X,G.Y(y1),C.grid,1); if(k) T(g,piHalf(k),X,G.Y(0)+13,C.muted,11,'center'); }
  ystep=ystep||1;
  for(var y=Math.ceil(y0/ystep)*ystep; y<=y1+1e-9; y+=ystep){ if(Math.abs(y)<1e-9) continue; var Y=G.Y(y); L(g,G.X(x0),Y,G.X(x1),Y,C.grid,1); T(g,String(+y.toFixed(2)).replace('-','−'),G.X(0)-6,Y,C.muted,11,'right'); }
  L(g,G.X(x0),G.Y(0),G.X(x1),G.Y(0),C.ink,1.2);
  if(x0<0&&x1>0) L(g,G.X(0),G.Y(y0),G.X(0),G.Y(y1),C.ink,1.2);
}
function plot(g,G,f,a,b,c,w,dash){ g.save(); g.strokeStyle=c; g.lineWidth=w; g.lineJoin='round'; g.setLineDash(dash||[]); g.beginPath(); var N=Math.max(2,Math.ceil((b-a)*80)); for(var i=0;i<=N;i++){ var x=a+(b-a)*i/N, y=f(x); if(i) g.lineTo(G.X(x),G.Y(y)); else g.moveTo(G.X(x),G.Y(y)); } g.stroke(); g.restore(); }
function unitAxes(g,F,C,m){ m=m||1.3; L(g,F.X(-m),F.Y(0),F.X(m),F.Y(0),C.grid,1); L(g,F.X(0),F.Y(-m),F.X(0),F.Y(m),C.grid,1); }

/* 通用互動圖：滑桿 data-k、播放 data-play、步驟 data-step */
function widget(id,o){
  var root=document.getElementById(id); if(!root) return;
  var cv=root.querySelector('canvas'), st=o.state, inputs=root.querySelectorAll('[data-k]');
  var nSteps=o.steps||0; if(nSteps) st.step=st.step||0;
  function fmt(k){ var v=st[k]; return o.fmt&&o.fmt[k]?o.fmt[k](v):(+v).toFixed(2); }
  function syncAll(){
    inputs.forEach(function(i){ var k=i.getAttribute('data-k'); i.value=st[k]; var lab=root.querySelector('[data-v="'+k+'"]'); if(lab) lab.textContent=fmt(k); });
    if(nSteps){
      var no=root.querySelector('[data-stepno]'); if(no) no.textContent='第 '+(st.step+1)+' / '+nSteps+' 步';
      root.querySelectorAll('[data-step]').forEach(function(b){ var d=+b.getAttribute('data-step'); b.disabled=(d<0&&st.step===0)||(d>0&&st.step===nSteps-1); });
      root.querySelectorAll('[data-only-step]').forEach(function(el){ el.hidden = st.step !== +el.getAttribute('data-only-step'); });
    }
  }
  function render(){
    var pw=cv.parentElement.clientWidth; if(!pw) return;
    var narrow=pw<560, h=Math.round(pw*(narrow?o.rn:o.rw)), d=window.devicePixelRatio||1;
    cv.width=Math.round(pw*d); cv.height=Math.round(h*d); cv.style.height=h+'px';
    var g=cv.getContext('2d'); g.setTransform(d,0,0,d,0,0); g.clearRect(0,0,pw,h);
    o.draw(g,{w:pw,h:h,narrow:narrow,C:pal()},st);
    var out=root.querySelector('[data-out]'); if(out&&o.out) out.innerHTML=o.out(st);
  }
  inputs.forEach(function(inp){ var k=inp.getAttribute('data-k'); inp.addEventListener('input',function(){ st[k]=parseFloat(inp.value); if(o.constrain) o.constrain(st,k); syncAll(); render(); }); });
  root.querySelectorAll('[data-step]').forEach(function(b){ b.addEventListener('click',function(){ st.step=Math.max(0,Math.min(nSteps-1,st.step+(+b.getAttribute('data-step')))); syncAll(); render(); }); });
  root.querySelectorAll('[data-play]').forEach(function(btn){
    var k=btn.getAttribute('data-play'), inp=root.querySelector('[data-k="'+k+'"]'), raf=0;
    btn.addEventListener('click',function(){
      var mn=parseFloat(inp.min), mx=parseFloat(inp.max);
      if(raf){ cancelAnimationFrame(raf); raf=0; btn.textContent='▶ 播放'; return; }
      if(reduceMotion){ st[k]=mx; syncAll(); render(); return; }
      var dur=parseFloat(btn.getAttribute('data-dur')||'4000'), start=st[k]; if(start>=mx-1e-6) start=mn;
      var t0=null; btn.textContent='❚❚ 暫停';
      function step(ts){ if(t0===null) t0=ts-(start-mn)/(mx-mn)*dur; var u=Math.min(1,(ts-t0)/dur); var v=mn+(mx-mn)*u; var sp=parseFloat(inp.step)||0; st[k]=sp>=1?Math.round(v/sp)*sp:v; syncAll(); render(); if(u<1) raf=requestAnimationFrame(step); else { raf=0; btn.textContent='▶ 播放'; } }
      raf=requestAnimationFrame(step);
    });
  });
  syncAll(); renders.push(render); VL.widgets[id]={state:st,render:render}; render();
}
VL.register = widget;

/* ---- 數字與幾何小工具 ---- */
function nf(v,d){ d=d==null?2:d; var s=Math.abs(v).toFixed(d); return (v<0&&+s!==0?'−':'')+s; }
function deg(v){ return Math.round(v*180/PI)+'°'; }
function radFmt(v){ return v.toFixed(2)+'（'+deg(v)+'）'; }
function ra(g,F,p,u,v,s,c){ var a=[p[0]+u[0]*s,p[1]+u[1]*s], b=[a[0]+v[0]*s,a[1]+v[1]*s], d=[p[0]+v[0]*s,p[1]+v[1]*s]; g.save(); g.strokeStyle=c; g.lineWidth=1.2; g.beginPath(); g.moveTo(F.X(a[0]),F.Y(a[1])); g.lineTo(F.X(b[0]),F.Y(b[1])); g.lineTo(F.X(d[0]),F.Y(d[1])); g.stroke(); g.restore(); }
function seg(g,F,p,q,c,w,dash){ L(g,F.X(p[0]),F.Y(p[1]),F.X(q[0]),F.Y(q[1]),c,w,dash); }
function arcAt(g,F,p,r,a0,a1,c,w){ g.save(); g.strokeStyle=c; g.lineWidth=w||1.8; g.beginPath(); g.arc(F.X(p[0]),F.Y(p[1]),r*F.sx,-a0,-a1,a1>a0); g.stroke(); g.restore(); }
function plotClip(g,G,f,a,b,ymax,c,w,dash){ g.save(); g.strokeStyle=c; g.lineWidth=w; g.setLineDash(dash||[]); g.beginPath(); var N=Math.ceil((b-a)*120), pen=false; for(var i=0;i<=N;i++){ var x=a+(b-a)*i/N, y=f(x); if(!isFinite(y)||Math.abs(y)>ymax){ pen=false; continue; } if(pen) g.lineTo(G.X(x),G.Y(y)); else { g.moveTo(G.X(x),G.Y(y)); pen=true; } } g.stroke(); g.restore(); }
function vline(g,G,x,y0,y1,c,dash,w){ L(g,G.X(x),G.Y(y0),G.X(x),G.Y(y1),c,w||1.5,dash||[5,4]); }
function steps(arr){ return function(s){ return arr[s.step]; }; }
function norm(v){ var l=Math.hypot(v[0],v[1])||1; return [v[0]/l,v[1]/l]; }
/* ---- 通用：可重現的亂數、常態分布、直角座標軸、長條 ---- */
function seeded(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function gauss(r){ var u=Math.max(1e-9,r()), v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v); }
/* axes(g,G,box,C,o): o={xstep,ystep,xfmt,yfmt,xlabel,ylabel,x0,y0} — 一般直角座標（非 π 刻度） */
function axes(g,G,b,C,o){ o=o||{}; var xs=o.xstep||1, ys=o.ystep||1, xf=o.xfmt||function(v){return String(+v.toFixed(3)).replace('-','−');}, yf=o.yfmt||xf;
  for(var x=Math.ceil(b[0]/xs)*xs; x<=b[1]+1e-9; x+=xs){ L(g,G.X(x),G.Y(b[2]),G.X(x),G.Y(b[3]),C.grid,1); T(g,xf(x),G.X(x),G.Y(o.y0!=null?o.y0:b[2])+13,C.muted,11,'center'); }
  for(var y=Math.ceil(b[2]/ys)*ys; y<=b[3]+1e-9; y+=ys){ L(g,G.X(b[0]),G.Y(y),G.X(b[1]),G.Y(y),C.grid,1); T(g,yf(y),G.X(o.x0!=null?o.x0:b[0])-6,G.Y(y),C.muted,11,'right'); }
  var X0=o.x0!=null?o.x0:b[0], Y0=o.y0!=null?o.y0:b[2];
  L(g,G.X(b[0]),G.Y(Y0),G.X(b[1]),G.Y(Y0),C.ink,1.3); L(g,G.X(X0),G.Y(b[2]),G.X(X0),G.Y(b[3]),C.ink,1.3);
  if(o.xlabel) T(g,o.xlabel,G.X(b[1]),G.Y(Y0)-10,C.muted,11,'right'); if(o.ylabel) T(g,o.ylabel,G.X(X0)+6,G.Y(b[3])+6,C.muted,11,'left'); }
function box(g,x,y,w,h,fill,stroke,lw){ g.save(); if(fill){ g.fillStyle=fill; g.fillRect(x,y,w,h); } if(stroke){ g.strokeStyle=stroke; g.lineWidth=lw||1.5; g.strokeRect(x,y,w,h); } g.restore(); }
function fmtSig(v){ return String(v).replace('-','−'); }
/* 不確定度進位：無條件進位到 2 位有效數字；回傳 {u, dec}（dec＝小數位數，可為負） */
function ceilSig2(u){ var dec=1-Math.floor(Math.log10(u)), p=Math.pow(10,dec), v=Math.ceil(u*p-1e-9)/p; if(v>=Math.pow(10,2-dec)-1e-12){ dec-=1; p/=10; v=Math.ceil(u*p-1e-9)/p; } return {u:v, dec:dec}; }
function fixed(v,dec){ return dec>0? v.toFixed(dec) : String(Math.round(v)); }


function lessonStart(){
/* 重繪：視窗大小、主題切換、字型載入、展開圖解 */
var pend=0; function renderAll(){ if(pend) return; pend=requestAnimationFrame(function(){ pend=0; renders.forEach(function(r){ r(); }); }); }
VL.renderAll = renderAll;
window.addEventListener('resize',renderAll);
if(window.matchMedia){ var mq=window.matchMedia('(prefers-color-scheme: dark)'); if(mq.addEventListener) mq.addEventListener('change',renderAll); }
if(window.MutationObserver) new MutationObserver(renderAll).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(renderAll);
document.querySelectorAll('details.sol').forEach(function(d){ d.addEventListener('toggle',renderAll); });

/* 作答判斷 */
document.querySelectorAll('.qc').forEach(function(q){
  var box=q.querySelector('.choices'), fb=q.querySelector('.fb'), sol=q.querySelector('details.sol');
  var ans=box.getAttribute('data-answer').split(','), multi=box.hasAttribute('data-multi');
  function judge(picked){
    var ok = picked.length===ans.length && picked.every(function(p){ return ans.indexOf(p)>=0; }), why='';
    box.querySelectorAll('button[data-c]').forEach(function(b){ var c=b.getAttribute('data-c'); b.classList.toggle('right', ok && ans.indexOf(c)>=0); b.classList.toggle('wrong', picked.indexOf(c)>=0 && ans.indexOf(c)<0); if(picked.indexOf(c)>=0 && ans.indexOf(c)<0 && b.getAttribute('data-why')) why=b.getAttribute('data-why'); });
    if(!ok && !why && multi) why = picked.length<ans.length ? '還少選了，答案不只一個喔。' : '再檢查一下有沒有多選。';
    fb.innerHTML = ok ? '<b class="ok">答對了！</b>打開下面的圖解，看看老師是怎麼想的。' : '<b class="no">再想一下。</b>'+why;
    if(ok && sol && !sol.open) sol.open = true;
    VL.answers = VL.answers || {}; VL.answers[q.getAttribute('data-q')] = {picked:picked, correct:ok};
  }
  box.querySelectorAll('button[data-c]').forEach(function(b){ b.addEventListener('click',function(){
    if(multi){ b.setAttribute('aria-pressed', b.getAttribute('aria-pressed')==='true'?'false':'true'); b.classList.remove('right','wrong'); }
    else judge([b.getAttribute('data-c')]);
  }); });
  var chk=q.querySelector('[data-check]');
  if(chk) chk.addEventListener('click',function(){ var picked=[]; box.querySelectorAll('button[aria-pressed="true"]').forEach(function(b){ picked.push(b.getAttribute('data-c')); }); judge(picked); });
});

/* 學習進度（僅 sessionStorage，符合平台規範） */
var KEY='AHS.VL.'+(VL.meta.unit||'lesson')+'.progress', boxes=document.querySelectorAll('[data-done]');
function loadP(){ try{ return JSON.parse(sessionStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
function saveP(p){ try{ sessionStorage.setItem(KEY,JSON.stringify(p)); }catch(e){} }
function showP(){ var p=loadP(), n=0; boxes.forEach(function(b){ if(p[b.getAttribute('data-done')]) n++; }); var el=document.getElementById('prog'); if(el) el.textContent='已完成 '+n+' / '+boxes.length; }
var p0=loadP(); boxes.forEach(function(b){ var k=b.getAttribute('data-done'); b.checked=!!p0[k]; b.addEventListener('change',function(){ var p=loadP(); p[k]=b.checked; saveP(p); showP(); }); });
showP();
VL.progress = {key:KEY, get:loadP};

/* 嵌入：單一公式模式標記焦點卡片，並把高度回報給平台（postMessage，跨 file:// 亦可用） */
(function(){
  var r=document.documentElement, id=r.getAttribute('data-card');
  if(id){ var c=document.getElementById(id); if(c){ c.classList.add('is-focus'); var s=c.closest('section'); if(s) s.classList.add('has-focus'); } }
  if(!r.classList.contains('is-embed')||window.parent===window) return;
  /* 教材中心閱讀畫面：回報目前位置與完成進度，接收「跳到公式」 */
  if(!id){
    var cards=[].slice.call(document.querySelectorAll('article.card[id^=F]')), act=null, tick=0;
    function state(){ var a=cards[0]&&cards[0].id; cards.forEach(function(c){ if(c.getBoundingClientRect().top<=140) a=c.id; });
      if((window.innerHeight+window.scrollY)>=document.documentElement.scrollHeight-4&&cards.length) a=cards[cards.length-1].id;
      var p=loadP(), done=cards.map(function(c){return c.id;}).filter(function(k){return p[k];});
      try{ window.parent.postMessage({type:'ahs-visual-lesson:state',active:a,done:done},'*'); }catch(e){} act=a; }
    window.addEventListener('scroll',function(){ if(tick) return; tick=requestAnimationFrame(function(){ tick=0; state(); }); },{passive:true});
    boxes.forEach(function(b){ b.addEventListener('change',state); });
    window.addEventListener('message',function(ev){ var d=ev&&ev.data; if(!d||d.type!=='ahs-visual-lesson:goto') return; var c=document.getElementById(d.card); if(c&&/^F\d+$/.test(d.card)) c.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'}); });
    if(location.hash){ var h=document.getElementById(location.hash.slice(1)); if(h) h.scrollIntoView(); }
    window.addEventListener('load',state); setTimeout(state,200);
  }
  var last=0;
  function post(){ var h=Math.ceil(document.body.getBoundingClientRect().height); if(h&&Math.abs(h-last)>1){ last=h; try{ window.parent.postMessage({type:'ahs-visual-lesson:height',card:id||null,height:h},'*'); }catch(e){} } }
  if(window.ResizeObserver){ new ResizeObserver(post).observe(document.body); }
  window.addEventListener('load',post); document.addEventListener('toggle',post,true); setTimeout(post,300);
  renderAll();
})();

}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",lessonStart); else lessonStart();
