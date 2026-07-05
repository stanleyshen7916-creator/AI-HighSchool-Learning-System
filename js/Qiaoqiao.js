/* js/Qiaoqiao.js — AI 巧巧老師 shared visual asset library.
   Single source of truth for the character's appearance (per Product
   Baseline: 女性 / 溫柔 / 親切 / 主動引導). All pages MUST reuse this
   module instead of redrawing the character, so the look never drifts.

   Two exports:
     AHS.Qiaoqiao.bust(expressionKey)  -> standalone <svg> string (head +
       shoulders), for avatars in cards, chat bubbles, nav badges.
     AHS.Qiaoqiao.full(poseKey)        -> standalone <svg> string (full
       body), for hero banners / empty-states / celebratory moments.

   Everything is inline SVG (no external files), so it renders identically
   over file:// with zero network requests. */
window.AHS = window.AHS || {};
AHS.Qiaoqiao = (function () {
  "use strict";

  /* ---- Canonical palette (do not diverge per-page) -------------------- */
  var SKIN = "#f7d9bb";
  var SKIN_SHADE = "#f0c8a3";
  var HAIR = "#5b4033";
  var HAIR_DARK = "#4a3327";
  var BLAZER = "#2b2b30";
  var BLOUSE = "#fbf7f0";
  var SKIRT = "#6b4a36";
  var STOCKING = "#3a3a3f";
  var SHOE = "#241f1c";
  var BROW = "#4a3327";
  var EYE = "#3a2a20";
  var MOUTH = "#b5674a";
  var BLUSH = "#f6a98f";
  var GOLD = "#f2b705";
  var PINK = "#f2607d";
  var LILAC = "#8a7cbf";
  var SKY = "#8fc6e8";

  /* ---- Small reusable fragments --------------------------------------- */
  function r2(n) {
    /* Round to 2 decimals for clean, readable markup (avoids long
       floating-point tails like 14.29999999999999). */
    return Math.round(n * 100) / 100;
  }

  function star(cx, cy, r) {
    /* 4-point sparkle, drawn as two crossed diamonds. */
    return (
      '<path d="M' + cx + " " + r2(cy - r) + " L" + r2(cx + r * 0.28) + " " +
      cy + " L" + cx + " " + r2(cy + r) + " L" + r2(cx - r * 0.28) + " " + cy +
      " Z" + " M" + r2(cx - r * 0.55) + " " + r2(cy - r * 0.15) + " L" + cx +
      " " + r2(cy - r * 0.55) + " L" + r2(cx + r * 0.55) + " " +
      r2(cy - r * 0.15) + ' Z" fill="' + GOLD + '"/>'
    );
  }

  function heart(cx, cy, s) {
    return (
      '<path d="M' + cx + " " + r2(cy + s * 0.7) + " C" + r2(cx - s * 1.1) +
      " " + r2(cy - s * 0.2) + " " + r2(cx - s * 0.5) + " " +
      r2(cy - s * 1.1) + " " + cx + " " + r2(cy - s * 0.35) + " C" +
      r2(cx + s * 0.5) + " " + r2(cy - s * 1.1) + " " + r2(cx + s * 1.1) +
      " " + r2(cy - s * 0.2) + " " + cx + " " + r2(cy + s * 0.7) +
      ' Z" fill="' + PINK + '"/>'
    );
  }

  function question(cx, cy) {
    return (
      '<text x="' + cx + '" y="' + cy + '" font-size="16" font-weight="700" ' +
      'fill="' + LILAC + '" text-anchor="middle" font-family="inherit">?</text>'
    );
  }

  function sweatDrop(cx, cy) {
    return (
      '<path d="M' + cx + " " + (cy - 8) + " C" + (cx + 5) + " " + (cy - 1) +
      " " + (cx + 5) + " " + (cy + 5) + " " + cx + " " + (cy + 5) + " C" +
      (cx - 5) + " " + (cy + 5) + " " + (cx - 5) + " " + (cy - 1) + " " + cx +
      " " + (cy - 8) + ' Z" fill="' + SKY + '" fill-opacity="0.85"/>'
    );
  }

  /* accessory registry — small emblem drawn beside the head */
  var ACCESSORY = {
    none: function () { return ""; },
    sparkle: function () { return star(95, 20, 8) + star(78, 8, 5); },
    sparkleTriple: function () {
      return star(97, 18, 8) + star(80, 6, 5) + star(30, 14, 6);
    },
    heart: function () { return heart(93, 22, 7); },
    heartDouble: function () { return heart(95, 20, 7) + heart(80, 6, 4.5); },
    question: function () { return question(95, 22); },
    sweat: function () { return sweatDrop(88, 30); }
  };

  /* eyebrow registry — local coords, face centered at (60,54) */
  var EYEBROW = {
    normal: function () {
      return (
        '<path d="M43 44c3-2 8-2 11 0" fill="none" stroke="' + BROW +
        '" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M66 44c3-2 8-2 11 0" fill="none" stroke="' + BROW +
        '" stroke-width="2.2" stroke-linecap="round"/>'
      );
    },
    raised: function () {
      return (
        '<path d="M43 41c3-3 8-3 11-0.5" fill="none" stroke="' + BROW +
        '" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M66 40c3-3 9-3 12 0" fill="none" stroke="' + BROW +
        '" stroke-width="2.2" stroke-linecap="round"/>'
      );
    },
    raisedAsym: function () {
      return (
        '<path d="M43 40c3-3 8-3 11-0.5" fill="none" stroke="' + BROW +
        '" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M66 45c3-1.5 8-1.5 11 0" fill="none" stroke="' + BROW +
        '" stroke-width="2.2" stroke-linecap="round"/>'
      );
    },
    furrowed: function () {
      return (
        '<path d="M44 43l10 2" fill="none" stroke="' + BROW +
        '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M76 43l-10 2" fill="none" stroke="' + BROW +
        '" stroke-width="2.4" stroke-linecap="round"/>'
      );
    },
    cheerful: function () {
      return (
        '<path d="M42 42c4-4 9-4 12-1" fill="none" stroke="' + BROW +
        '" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M66 41c3-3 9-3 12 1" fill="none" stroke="' + BROW +
        '" stroke-width="2.2" stroke-linecap="round"/>'
      );
    },
    soft: function () {
      return (
        '<path d="M44 46c3-1.5 7-1.5 10 0" fill="none" stroke="' + BROW +
        '" stroke-width="2" stroke-linecap="round" opacity="0.8"/>' +
        '<path d="M66 46c3-1.5 7-1.5 10 0" fill="none" stroke="' + BROW +
        '" stroke-width="2" stroke-linecap="round" opacity="0.8"/>'
      );
    }
  };

  /* eye registry */
  var EYE_SHAPE = {
    open: function () {
      return eyePair(function (cx, cy) {
        return (
          '<ellipse cx="' + cx + '" cy="' + cy + '" rx="5.5" ry="6.5" fill="' +
          EYE + '"/>' +
          '<circle cx="' + (cx - 1.8) + '" cy="' + (cy - 2) +
          '" r="1.6" fill="#ffffff"/>'
        );
      });
    },
    lookUp: function () {
      return eyePair(function (cx, cy) {
        return (
          '<ellipse cx="' + cx + '" cy="' + cy + '" rx="5.5" ry="6.5" fill="' +
          EYE + '"/>' +
          '<circle cx="' + cx + '" cy="' + (cy - 3.5) +
          '" r="1.6" fill="#ffffff"/>'
        );
      });
    },
    droopy: function () {
      return eyePair(function (cx, cy) {
        return (
          '<ellipse cx="' + cx + '" cy="' + (cy + 1) +
          '" rx="5.5" ry="4" fill="' + EYE + '"/>' +
          '<path d="M' + (cx - 5.5) + " " + (cy - 3) + "q5.5-3 11 0" +
          '" fill="none" stroke="' + SKIN_SHADE + '" stroke-width="4"/>'
        );
      });
    },
    closedHappy: function () {
      return eyeArcPair('M{X-6} {Y}q6-6 12 0');
    },
    closedSoft: function () {
      return eyeArcPair('M{X-5} {Y-1}q5 4 10 0');
    },
    sparkleLove: function () {
      return eyePair(function (cx, cy) {
        return (
          '<ellipse cx="' + cx + '" cy="' + cy + '" rx="5.5" ry="6.5" fill="' +
          EYE + '"/>' +
          heart(cx, cy - 1, 2.6).replace('fill="' + PINK + '"', 'fill="#ffffff"')
        );
      });
    }
  };

  function eyePair(fn) {
    return fn(50, 54) + fn(70, 54);
  }

  function eyeArcPair(template) {
    var left = template.replace(/\{X-(\d+(?:\.\d+)?)\}/g, function (m, n) {
      return (50 - Number(n)).toString();
    }).replace(/\{Y-(\d+(?:\.\d+)?)\}/g, function (m, n) {
      return (54 - Number(n)).toString();
    }).replace(/\{Y\}/g, "54");
    var right = template.replace(/\{X-(\d+(?:\.\d+)?)\}/g, function (m, n) {
      return (70 - Number(n)).toString();
    }).replace(/\{Y-(\d+(?:\.\d+)?)\}/g, function (m, n) {
      return (54 - Number(n)).toString();
    }).replace(/\{Y\}/g, "54");
    var attrs = ' fill="none" stroke="' + EYE +
      '" stroke-width="2.4" stroke-linecap="round"/>';
    return "<path d=\"" + left + "\"" + attrs + "<path d=\"" + right + "\"" + attrs;
  }

  /* mouth registry */
  var MOUTH_SHAPE = {
    smileClosed: function () {
      return '<path d="M52 64c3 3 13 3 16 0" fill="none" stroke="' + MOUTH +
        '" stroke-width="2.4" stroke-linecap="round"/>';
    },
    smileOpen: function () {
      return '<path d="M50 63c4 8 16 8 20 0c-3 2-17 2-20 0z" fill="#7a3b34"/>' +
        '<path d="M50 63c4-2 16-2 20 0" fill="none" stroke="' + MOUTH +
        '" stroke-width="2" stroke-linecap="round"/>';
    },
    smileSmall: function () {
      return '<ellipse cx="60" cy="65" rx="3" ry="3.4" fill="#7a3b34"/>';
    },
    flatSerious: function () {
      return '<path d="M54 65h12" fill="none" stroke="' + MOUTH +
        '" stroke-width="2.2" stroke-linecap="round"/>';
    },
    wavyTired: function () {
      return '<path d="M53 65q3.5 3 7 0t7 0" fill="none" stroke="' + MOUTH +
        '" stroke-width="2" stroke-linecap="round"/>';
    }
  };

  /* blush registry */
  var BLUSH_SHAPE = {
    normal: function () {
      return '<circle cx="44" cy="61" r="3" fill="' + BLUSH +
        '" fill-opacity="0.55"/>' +
        '<circle cx="76" cy="61" r="3" fill="' + BLUSH + '" fill-opacity="0.55"/>';
    },
    strong: function () {
      return '<ellipse cx="44" cy="61" rx="4.5" ry="3.6" fill="' + BLUSH +
        '" fill-opacity="0.8"/>' +
        '<ellipse cx="76" cy="61" rx="4.5" ry="3.6" fill="' + BLUSH +
        '" fill-opacity="0.8"/>';
    },
    none: function () { return ""; }
  };

  /* ---- Expression registry -------------------------------------------- */
  var EXPRESSIONS = {
    gentle: { brow: "normal", eye: "open", mouth: "smileClosed",
      blush: "normal", accessory: "none", label: "微笑" },
    greeting: { brow: "normal", eye: "open", mouth: "smileOpen",
      blush: "normal", accessory: "sparkle", label: "打招呼" },
    thinking: { brow: "raisedAsym", eye: "lookUp", mouth: "smileSmall",
      blush: "none", accessory: "question", label: "思考" },
    cheer: { brow: "cheerful", eye: "closedHappy", mouth: "smileOpen",
      blush: "normal", accessory: "sparkle", label: "加油" },
    shy: { brow: "soft", eye: "closedSoft", mouth: "smileSmall",
      blush: "strong", accessory: "heart", label: "害羞" },
    determined: { brow: "furrowed", eye: "open", mouth: "flatSerious",
      blush: "none", accessory: "none", label: "認真" },
    confused: { brow: "raisedAsym", eye: "open", mouth: "smileSmall",
      blush: "none", accessory: "question", label: "疑惑" },
    celebrate: { brow: "cheerful", eye: "closedHappy", mouth: "smileOpen",
      blush: "normal", accessory: "sparkleTriple", label: "慶祝" },
    tired: { brow: "soft", eye: "droopy", mouth: "wavyTired",
      blush: "none", accessory: "sweat", label: "疲累" },
    love: { brow: "normal", eye: "sparkleLove", mouth: "smileSmall",
      blush: "strong", accessory: "heartDouble", label: "感謝" }
  };

  /* headGroup(cfg) — hair + fringe + face + eyebrows/eyes/mouth/blush +
     accessory. Local coordinate space is 120x120 with the face circle
     centered at (60,54), matching the original Prototype v0.1 avatar. */
  function headGroup(cfg) {
    return (
      /* hair back */
      '<path d="M30 58c0-20 13-34 30-34s30 14 30 34c0 8-2 15-5 20l-6-3c2-6 ' +
      '3-12 3-18 0-15-9-25-22-25S38 42 38 58c0 6 1 12 3 18l-6 3c-3-5-5-12-5-21z" ' +
      'fill="' + HAIR + '"/>' +
      /* face */
      '<circle cx="60" cy="54" r="24" fill="' + SKIN + '"/>' +
      /* fringe */
      '<path d="M37 50c2-14 11-22 23-22s21 8 23 22c-6-6-14-9-23-9s-17 3-23 9z" ' +
      'fill="' + HAIR_DARK + '"/>' +
      EYEBROW[cfg.brow]() +
      EYE_SHAPE[cfg.eye]() +
      MOUTH_SHAPE[cfg.mouth]() +
      BLUSH_SHAPE[cfg.blush]() +
      ACCESSORY[cfg.accessory]()
    );
  }

  /* ---- Bust (head + shoulders) ----------------------------------------- */
  function bust(expressionKey) {
    var cfg = EXPRESSIONS[expressionKey] || EXPRESSIONS.gentle;
    return (
      '<svg viewBox="0 0 120 130" role="img" aria-label="AI 巧巧老師：' +
      cfg.label + '" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="60" cy="60" r="60" fill="#f3ede6"/>' +
      /* neck */
      '<rect x="53" y="72" width="14" height="16" rx="6" fill="' + SKIN + '"/>' +
      /* blazer shoulders */
      '<path d="M28 120c0-18 13-30 32-30s32 12 32 30z" fill="' + BLAZER + '"/>' +
      '<path d="M60 92l-10 28h20z" fill="' + BLOUSE + '"/>' +
      headGroup(cfg) +
      "</svg>"
    );
  }

  /* ---- Full body (standing pose) ---------------------------------------
     viewBox 0 0 160 280. Head is embedded as a nested <svg> reusing the
     exact same headGroup() markup, so the face is guaranteed identical
     across bust and full-body renders (no duplicated/diverging artwork). */
  function headOnlySvg(expressionKey, size) {
    var cfg = EXPRESSIONS[expressionKey] || EXPRESSIONS.gentle;
    return (
      '<svg x="' + (80 - size / 2) + '" y="0" width="' + size + '" height="' +
      size + '" viewBox="0 0 120 120" aria-hidden="true">' +
      headGroup(cfg) +
      "</svg>"
    );
  }

  function torsoAndLegs() {
    return (
      /* neck — spans from behind the chin down into the blazer collar so
         no gap of empty canvas shows between the head and the body. */
      '<rect x="73" y="68" width="14" height="54" rx="6" fill="' + SKIN + '"/>' +
      /* blazer body */
      '<path d="M50 116C50 106 64 101 80 101C96 101 110 106 110 116L122 206C122 ' +
      '215 112 220 102 220L58 220C48 220 38 215 38 206Z" fill="' + BLAZER + '"/>' +
      /* blouse V-insert */
      '<path d="M80 104L68 128L80 152L92 128Z" fill="' + BLOUSE + '"/>' +
      /* skirt */
      '<path d="M42 206L118 206L126 240L34 240Z" fill="' + SKIRT + '"/>' +
      /* legs */
      '<rect x="56" y="238" width="14" height="34" rx="6" fill="' + STOCKING +
      '"/>' +
      '<rect x="90" y="238" width="14" height="34" rx="6" fill="' + STOCKING +
      '"/>' +
      /* shoes */
      '<ellipse cx="63" cy="274" rx="10" ry="6" fill="' + SHOE + '"/>' +
      '<ellipse cx="97" cy="274" rx="10" ry="6" fill="' + SHOE + '"/>'
    );
  }

  function restingArm(shoulderX, hipX, mirrored) {
    var midX = mirrored ? shoulderX + 6 : shoulderX - 6;
    return '<path d="M' + shoulderX + ' 118C' + midX + ' 150 ' + midX +
      ' 170 ' + hipX + ' 196" fill="none" stroke="' + BLAZER +
      '" stroke-width="16" stroke-linecap="round"/>' +
      '<circle cx="' + hipX + '" cy="200" r="7" fill="' + SKIN + '"/>';
  }

  /* ---- Pose arm/prop builders ------------------------------------------ */
  var POSE_EXTRAS = {
    standing: function () {
      return restingArm(50, 38, false) + restingArm(110, 122, true);
    },
    wave: function () {
      return restingArm(50, 38, false) +
        '<path d="M108 116C126 100 132 78 128 58" fill="none" stroke="' +
        BLAZER + '" stroke-width="16" stroke-linecap="round"/>' +
        '<circle cx="128" cy="52" r="9" fill="' + SKIN + '"/>' +
        '<path d="M112 40q6-6 12-1M118 34q6-5 12 1M124 30q6-4 11 2" ' +
        'fill="none" stroke="' + LILAC + '" stroke-width="2" ' +
        'stroke-linecap="round" opacity="0.6"/>';
    },
    blackboard: function () {
      return restingArm(50, 40, false) +
        '<path d="M108 116C124 104 132 88 134 66" fill="none" stroke="' +
        BLAZER + '" stroke-width="16" stroke-linecap="round"/>' +
        '<circle cx="134" cy="60" r="7" fill="' + SKIN + '"/>' +
        '<rect x="132" y="26" width="4" height="34" rx="2" fill="#d8b48a"/>' +
        '<rect x="128" y="20" width="12" height="8" rx="2" fill="#e7cba3"/>' +
        /* small blackboard icon floating beside her */
        '<rect x="4" y="46" width="34" height="24" rx="4" fill="' + HAIR_DARK +
        '"/>' +
        '<path d="M10 56h22M10 62h14" fill="none" stroke="#f3ede6" ' +
        'stroke-width="2" stroke-linecap="round"/>';
    },
    reading: function () {
      return (
        '<path d="M54 118C46 140 44 158 48 172" fill="none" stroke="' +
        BLAZER + '" stroke-width="16" stroke-linecap="round"/>' +
        '<path d="M106 118C114 140 116 158 112 172" fill="none" stroke="' +
        BLAZER + '" stroke-width="16" stroke-linecap="round"/>' +
        '<circle cx="48" cy="176" r="7" fill="' + SKIN + '"/>' +
        '<circle cx="112" cy="176" r="7" fill="' + SKIN + '"/>' +
        /* open book */
        '<path d="M44 168C58 160 66 160 80 166C94 160 102 160 116 168L116 188C102 ' +
        '182 94 182 80 188C66 182 58 182 44 188Z" fill="#fbf7f0" ' +
        'stroke="#d8cfc2" stroke-width="1.5"/>' +
        '<path d="M80 166L80 188" fill="none" stroke="#d8cfc2" ' +
        'stroke-width="1.5"/>' +
        '<path d="M50 172h20M50 178h16M90 172h20M90 178h16" fill="none" ' +
        'stroke="#c9bfae" stroke-width="1.6" stroke-linecap="round"/>'
      );
    },
    pointing: function () {
      /* kept within the 160-wide viewBox with margin so the fingertip
         never clips at the canvas edge. */
      return restingArm(50, 40, false) +
        '<path d="M108 122C122 126 132 132 140 138" fill="none" stroke="' +
        BLAZER + '" stroke-width="16" stroke-linecap="round"/>' +
        '<circle cx="140" cy="138" r="7" fill="' + SKIN + '"/>' +
        '<rect x="140" y="134" width="12" height="6" rx="3" fill="' + SKIN +
        '"/>';
    },
    thumbsUp: function () {
      return restingArm(50, 40, false) +
        '<path d="M108 120C122 116 130 104 130 90" fill="none" stroke="' +
        BLAZER + '" stroke-width="16" stroke-linecap="round"/>' +
        '<circle cx="130" cy="84" r="9" fill="' + SKIN + '"/>' +
        '<rect x="126" y="66" width="8" height="16" rx="4" fill="' + SKIN +
        '"/>';
    }
  };

  var POSES = {
    standing: { expression: "gentle", label: "站姿" },
    wave: { expression: "greeting", label: "揮手打招呼" },
    blackboard: { expression: "determined", label: "板書教學" },
    reading: { expression: "thinking", label: "閱讀教材" },
    pointing: { expression: "cheer", label: "重點指引" },
    thumbsUp: { expression: "celebrate", label: "鼓勵讚賞" }
  };

  function full(poseKey) {
    var pose = POSES[poseKey] || POSES.standing;
    var extras = (POSE_EXTRAS[poseKey] || POSE_EXTRAS.standing)();
    return (
      '<svg viewBox="0 0 160 280" role="img" aria-label="AI 巧巧老師：' +
      pose.label + '" xmlns="http://www.w3.org/2000/svg">' +
      torsoAndLegs() +
      extras +
      headOnlySvg(pose.expression, 118) +
      "</svg>"
    );
  }

  function expressionLabel(key) {
    return (EXPRESSIONS[key] || EXPRESSIONS.gentle).label;
  }

  function poseLabel(key) {
    return (POSES[key] || POSES.standing).label;
  }

  return {
    bust: bust,
    full: full,
    expressionKeys: Object.keys(EXPRESSIONS),
    poseKeys: Object.keys(POSES),
    expressionLabel: expressionLabel,
    poseLabel: poseLabel
  };
})();
