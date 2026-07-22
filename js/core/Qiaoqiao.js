/* js/Qiaoqiao.js — AI 巧巧老師 shared visual asset library.
   Single source of truth for the character's appearance.

   Per GPT (PMO) direction, the character now uses the APPROVED official
   illustration assets (cropped from Qiaoqiao_Expressions / Qiaoqiao_Poses),
   served as <img> from assets/expressions/ (bust) and assets/avatars/
   (full pose) — relocated under Repository Refactor v2.0. This guarantees
   100% visual consistency with the approved reference art across every page.

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

  /* EO-S6.8-Repository-002 · Repository Structure v2.1 (LOCK): image
     assets live directly under assets/expressions/ and assets/avatars/
     (v2.1 flattened the v2.0 illustrations/ level) with lowercase
     kebab-case filenames. The two SEPARATE base constants are deliberately kept
     (a single BASE caused a 16-image 404 regression in the past — do
     not merge them). kebab() converts a camelCase key (e.g. thumbsUp)
     to its kebab-case filename segment (thumbs-up) — path construction
     only, zero behavior change. */
  var EXPR_BASE = "assets/expressions/";
  var POSE_BASE = "assets/avatars/";

  function kebab(key) {
    return String(key).replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  }

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
    return img(EXPR_BASE + "expr-" + kebab(key) + ".png", EXPRESSIONS[key], "bust");
  }

  /* ---- Full body / pose ------------------------------------------------ */
  function full(poseKey) {
    var key = POSES[poseKey] ? poseKey : "standing";
    return img(POSE_BASE + "pose-" + kebab(key) + ".png", POSES[key], "full");
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
