/* js/data/WeakChapterConfig.js — 2026-11-27 AHS-FEAT 弱點單元分析與加強練習：門檻設定。
   每個單元（來源教材 tm_N）只看最近 recentWindow 題；作答不足 minAttempts 題顯示「資料不足」；
   正確率低於 weakBelow（%）標「需加強」。加強練習預設出 practiceCount 題。 */
window.AHS = window.AHS || {};
AHS.WeakChapterConfig = {
  minAttempts: 5,
  recentWindow: 20,
  weakBelow: 60,
  practiceCount: 10
};
