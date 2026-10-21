/* docs/TeachingMaterials/lessons/shared/LessonBoot.js — 圖解教材共用：載入參數（放在 <head>，畫面出現前就套用模式）。
   embed=1（教材中心閱讀畫面）、card=F10（學習助教單一公式）、theme=light|dark */
(function(){
  var p={}; String(location.search||'').replace(/^\?/,'').split('&').forEach(function(kv){ if(!kv) return; var i=kv.indexOf('='); p[decodeURIComponent(i<0?kv:kv.slice(0,i))]=decodeURIComponent(i<0?'':kv.slice(i+1)); });
  var r=document.documentElement;
  if(p.embed==='1'||p.card) r.classList.add('is-embed');
  if(p.card&&/^F\d+$/.test(p.card)){ r.classList.add('is-card'); r.setAttribute('data-card',p.card); }
  if(p.theme==='light'||p.theme==='dark') r.setAttribute('data-theme',p.theme);
})();
