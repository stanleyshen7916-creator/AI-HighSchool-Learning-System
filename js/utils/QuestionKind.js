/* js/utils/QuestionKind.js — 2026-10-08 題型支援：是非、多選、計算／填充.

   Until now every exam path only knew single-choice questions; the
   loader skipped everything else, so a material's true/false, multi-
   select and calculation/fill-in questions never reached a quiz.
   This helper names the three answer modes so every screen can share
   one rule, while the answer itself stays ONE string key — AutoGrader,
   WrongBookRuntime, ReviewRuntime and Statistics compare
   `yourAnswer === correctAnswer` unchanged:

     choice  單選與是非題  correctAnswer "B"（是非題選項為「正確／錯誤」）
     multi   多選題        correctAnswer "BCD"（原 key 排序後相連）
     self    計算／填充題  correctAnswer "SELF_CORRECT"；學生看過答案後
                           自評「答對」(SELF_CORRECT) 或「答錯」(SELF_WRONG)

   kindOf() reads the question's own answerMode (set by
   TeachingMaterialLoader.js) and falls back to the Package question in
   js/data/TeachingMaterialData.js by id, so a Wrong Book record synced
   or pulled before this change still resolves. */
window.AHS = window.AHS || {};

AHS.QuestionKind = (function () {
  "use strict";

  var SELF_CORRECT = "SELF_CORRECT";
  var SELF_WRONG = "SELF_WRONG";
  var SELF_TYPES = { calculation: true, fill_blank: true, essay: true };
  var TYPE_LABEL = {
    single_choice: "單選題", multiple_choice: "多選題", true_false: "是非題",
    calculation: "計算題", fill_blank: "填充題", essay: "問答題"
  };
  var MULTI_ANSWER = /^(\([A-G]\)){2,}$/;
  var sourceIndex = null;

  function source(id) {
    if (!id) { return null; }
    if (!sourceIndex) {
      sourceIndex = {};
      (Array.isArray(AHS.TeachingMaterialData) ? AHS.TeachingMaterialData : []).forEach(function (e) {
        (e && e.questions || []).forEach(function (q) { if (q && q.id) { sourceIndex[q.id] = q; } });
      });
    }
    return sourceIndex[id] || null;
  }

  function idOf(q) { return String((q && (q.questionId || q.id)) || ""); }

  /* Package question (TeachingMaterialData shape) -> mode. */
  function modeOfPackage(q) {
    if (!q) { return "choice"; }
    if (SELF_TYPES[q.type]) { return "self"; }
    if (q.type === "single_choice" && MULTI_ANSWER.test(String(q.answer || "")) &&
        Array.isArray(q.options) && q.options.indexOf(q.answer) === -1) { return "multi"; }
    return "choice";
  }

  function kindOf(q) {
    if (!q) { return "choice"; }
    if (q.answerMode === "multi" || q.answerMode === "self") { return q.answerMode; }
    if (q.correctAnswer === SELF_CORRECT) { return "self"; }
    var src = source(idOf(q));
    return src ? modeOfPackage(src) : "choice";
  }

  function isChoice(q) { return kindOf(q) === "choice"; }

  function typeLabel(q) {
    var mode = kindOf(q);
    if (mode === "multi") { return "多選題"; }
    var src = source(idOf(q));
    var type = (q && q.type) || (src && src.type) || "";
    return TYPE_LABEL[type] || (mode === "self" ? "計算題" : "單選題");
  }

  /* "BCD" -> ["B","C","D"]; already-sorted keys are the stored form. */
  function multiKeys(answer) {
    return String(answer || "").split("").filter(function (c) { return /[A-Z]/.test(c); });
  }
  function joinKeys(keys) { return keys.slice().sort().join(""); }

  /* The worked answer text of a self-graded question. */
  function answerText(q) {
    if (q && q.answerText) { return String(q.answerText); }
    var src = source(idOf(q));
    return src ? String(src.answer || "") : "";
  }

  /* Human-readable form of a stored answer key for multi/self questions;
     null for an ordinary choice (OptionOrder.describe handles those). */
  function describe(q, key, labelFor) {
    var mode = kindOf(q);
    if (mode === "self") {
      if (key === SELF_CORRECT) { return "自評答對"; }
      if (key === SELF_WRONG) { return "自評答錯"; }
      return key == null || key === "" ? "未作答" : String(key);
    }
    if (mode === "multi") {
      var keys = multiKeys(key);
      if (!keys.length) { return "未作答"; }
      return keys.map(function (k) { return labelFor ? labelFor(k) : k; }).sort().map(function (l) { return "(" + l + ")"; }).join("");
    }
    return null;
  }

  function reset() { sourceIndex = null; }

  return {
    SELF_CORRECT: SELF_CORRECT, SELF_WRONG: SELF_WRONG,
    kindOf: kindOf, isChoice: isChoice, modeOfPackage: modeOfPackage, typeLabel: typeLabel,
    multiKeys: multiKeys, joinKeys: joinKeys, answerText: answerText, describe: describe, reset: reset
  };
})();
