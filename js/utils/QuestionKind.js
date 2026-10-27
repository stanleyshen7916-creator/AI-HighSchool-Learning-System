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
      if (key === SELF_CORRECT) { return "答對"; }
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

  /* ---- 2026-10-27 輸入作答自動批改（同月考選填）------------------------
     平時練習不再「看答案自評」：計算／填充題改成每一格輸入答案，
     QuestionCard 依標準答案自動判定，答對存 SELF_CORRECT、答錯存輸入的文字
     （各格以「；」相連），AutoGrader 以下的比對方式不變。
     比對規則：有選項代號的比代號；有數字的只比數字（可用分數、√、π，
     小數依標準答案的位數四捨五入判定）；沒有數字的比文字（忽略標點、
     「、」分隔的項目不計順序）。 */
  var PART_SPLIT = /[(（]\s*\d+\s*[)）]|[①②③④⑤⑥⑦⑧⑨⑩]/;
  var NUM_TOKEN = /[-+]?(?:\d+(?:\.\d+)?(?:e[-+]?\d+)?)?(?:√\(?\d+(?:\.\d+)?\)?)?π?(?:\/\d+(?:\.\d+)?(?:√\d+(?:\.\d+)?)?π?)?/g;

  function norm(s) {
    /* 單位的上下標（m/s²、H₂）不是要比對的數字：先拿掉，NFKC 才不會把它變成 2 */
    var SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
    /* 科學記號 5.07×10⁴、5.07*10^4 -> 5.07e4 */
    var t = String(s == null ? "" : s).replace(/\s*[×xX*]\s*10\s*(?:\^\s*([-−]?\d+)|([⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+))/g, function (m, a, b) {
      return "e" + (a ? a.replace("−", "-") : b.split("").map(function (c) { return SUP[c]; }).join(""));
    }).replace(/([A-Za-zμΩ°)\]])[⁰¹²³⁴⁵⁶⁷⁸⁹⁻₀₁₂₃₄₅₆₇₈₉]+/g, "$1");
    if (t.normalize) { t = t.normalize("NFKC"); }
    return t.replace(/[−–－]/g, "-").replace(/[×✕]/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
  }

  /* "(1) 1.5 m/s²；(2) 19 s" -> ["1.5 m/s²", "19 s"]；沒有小題 -> [整個答案] */
  function parts(answer) {
    var a = String(answer == null ? "" : answer).trim();
    if (!PART_SPLIT.test(a) || a.search(PART_SPLIT) !== 0) { return [a]; }
    return a.split(PART_SPLIT).map(function (p) { return p.replace(/^[\s；;，,、]+|[\s；;，,、。]+$/g, ""); })
      .filter(function (p) { return p !== ""; });
  }

  function termValue(t) {
    var m = /^([-+]?)(\d+(?:\.\d+)?(?:e[-+]?\d+)?)?(?:√\(?(\d+(?:\.\d+)?)\)?)?(π)?$/.exec(t);
    if (!m || (!m[2] && !m[3] && !m[4])) { return null; }
    var v = (m[2] ? parseFloat(m[2]) : 1) * (m[3] ? Math.sqrt(parseFloat(m[3])) : 1) * (m[4] ? Math.PI : 1);
    return m[1] === "-" ? -v : v;
  }

  /* 數字記號 -> [{ v: 數值, dp: 小數位數 }] */
  function numbers(s) {
    var out = [];
    (norm(s).match(NUM_TOKEN) || []).forEach(function (tok) {
      if (!/[\dπ]/.test(tok)) { return; }
      var bits = tok.split("/");
      var a = termValue(bits[0]), b = bits.length > 1 ? termValue(bits[1]) : 1;
      if (a == null || b == null || b === 0) { return; }
      var dec = /\.(\d+)/.exec(tok);
      out.push({ v: a / b, dp: bits.length === 1 && dec ? dec[1].length : -1 });
    });
    return out;
  }

  var LETTER = /^[(（]?([A-G])[)）]?(?![A-Za-z])/;
  function plain(s) { return norm(s).replace(/[、，,。．.；;：:「」『』（）()]/g, "").toLowerCase(); }

  function partMatches(expected, typed) {
    var t = norm(typed);
    if (!t) { return false; }
    var letter = LETTER.exec(norm(expected));
    if (letter) { var tl = LETTER.exec(t.toUpperCase()); return !!tl && tl[1] === letter[1]; }
    var want = numbers(expected);
    if (want.length) {
      var got = numbers(typed);
      return got.length === want.length && want.every(function (w, i) {
        var tol = w.dp >= 0 ? 0.5 * Math.pow(10, -w.dp) + 1e-9 : 1e-6 * Math.max(1, Math.abs(w.v));
        /* 標準答案是分數、根號時，輸入兩位以上的小數也算對（1/3 ≈ 0.33） */
        if (w.dp < 0 && got[i].dp >= 2) { tol = Math.max(tol, 0.5 * Math.pow(10, -got[i].dp) + 1e-9); }
        return Math.abs(got[i].v - w.v) <= tol;
      });
    }
    var list = function (s) { return norm(s).split(/[、，,和與及]/).map(plain).filter(Boolean).sort().join("|"); };
    return list(expected) === list(typed);
  }

  /* 能不能自動批改：問答題不行；每一格要有選項代號、或不超過 2 個數字、
     或是 12 字以內的短答。 */
  function gradable(q) {
    if (!q || q.type === "essay") { return false; }
    var ps = parts(q.answer);
    return ps.length > 0 && ps.length <= 6 && ps.every(function (p) {
      if (LETTER.test(norm(p))) { return true; }
      var n = numbers(p).length;
      return n ? n <= 2 : plain(p).length > 0 && plain(p).length <= 12;
    });
  }

  /* 依輸入的各格答案求作答 key：全部答對 SELF_CORRECT，否則為輸入文字。 */
  function keyForInput(q, typedParts) {
    var want = parts(answerText(q));
    var typed = (typedParts || []).map(function (s) { return String(s || "").trim(); });
    if (!typed.length || typed.some(function (s) { return !s; })) { return null; }
    var ok = typed.length === want.length && want.every(function (w, i) { return partMatches(w, typed[i]); });
    return ok ? SELF_CORRECT : typed.join("；");
  }

  function reset() { sourceIndex = null; }

  return {
    SELF_CORRECT: SELF_CORRECT, SELF_WRONG: SELF_WRONG,
    kindOf: kindOf, isChoice: isChoice, modeOfPackage: modeOfPackage, typeLabel: typeLabel,
    multiKeys: multiKeys, joinKeys: joinKeys, answerText: answerText, describe: describe,
    parts: parts, partMatches: partMatches, gradable: gradable, keyForInput: keyForInput, reset: reset
  };
})();
