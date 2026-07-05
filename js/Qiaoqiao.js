/* js/Qiaoqiao.js — AI 巧巧老師 shared visual asset library.
   Single source of truth for the character's appearance.

   Per GPT (PMO) direction, the character now uses the APPROVED official
   illustration assets (cropped from Qiaoqiao_Expressions / Qiaoqiao_Poses),
   served as <img> from assets/qiaoqiao/. This guarantees 100% visual
   consistency with the approved reference art across every page.

   Assets are plain PNG referenced by relative path, so everything still
   works over file:// and GitHub Pages with no build step and no API.

   Two exports (API unchanged, so all pages keep working):
     AHS.Qiaoqiao.bust(expressionKey) -> <img> string (portrait), for
       avatars in cards, chat bubbles, nav badges, banners.
     AHS.Qiaoqiao.full(poseKey)       -> <img> string (full pose), for
       hero banners / empty-states / celebratory moments.
   Plus: expressionKeys, poseKeys, expressionLabel(k), poseLabel(k). */
window.AHS = window.AHS || {};
AHS.Qiaoqiao = (function () {
  "use strict";

  var BASE = "assets/qiaoqiao/";

  /* expression key -> Chinese label (10 approved expressions) */
  var EXPRESSIONS = {
    gentle: "微笑",
    greeting: "打招呼",
    thinking: "思考",
    cheer: "加油",
    shy: "害羞",
    determined: "認真",
    confused: "疑惑",
    celebrate: "慶祝",
    tired: "疲累",
    love: "感謝"
  };

  /* pose key -> Chinese label (6 approved poses) */
  var POSES = {
    standing: "站立",
    wave: "揮手",
    blackboard: "板書講解",
    reading: "閱讀",
    pointing: "講解",
    thumbsUp: "歡呼"
  };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  function img(src, label, kind) {
    return (
      '<img class="qiaoqiao-img qiaoqiao-img--' + kind + '" ' +
      'src="' + esc(src) + '" alt="AI 巧巧老師：' + esc(label) + '" ' +
      'loading="lazy" draggable="false">'
    );
  }

  /* ---- Bust (portrait) ------------------------------------------------- */
  function bust(expressionKey) {
    var key = EXPRESSIONS[expressionKey] ? expressionKey : "gentle";
    return img(BASE + "expr_" + key + ".png", EXPRESSIONS[key], "bust");
  }

  /* ---- Full body / pose ------------------------------------------------ */
  function full(poseKey) {
    var key = POSES[poseKey] ? poseKey : "standing";
    return img(BASE + "pose_" + key + ".png", POSES[key], "full");
  }

  function expressionLabel(key) { return EXPRESSIONS[key] || ""; }
  function poseLabel(key) { return POSES[key] || ""; }

  return {
    bust: bust,
    full: full,
    expressionKeys: Object.keys(EXPRESSIONS),
    poseKeys: Object.keys(POSES),
    expressionLabel: expressionLabel,
    poseLabel: poseLabel
  };
})();
