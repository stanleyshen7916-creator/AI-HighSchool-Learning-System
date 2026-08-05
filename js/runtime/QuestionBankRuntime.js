/* js/runtime/QuestionBankRuntime.js — Sprint AI-121 (Learning Knowledge
   Engine) AI-121-03: the persisted, per-material QuestionBank the rest of
   this Sprint's Learning Engine is built on.

   "固定建立題庫（例如 50 題）...QuestionBank 建立一次永久保存，不因重新
   進入教材而重新產生" is read literally, but honestly: this repository's
   real shipped Repository materials (tm_1~4 etc.) do not have 50 real
   questions each — some have 6, some have fewer. Padding a bank to a
   fixed 50 with fabricated content would violate this project's absolute
   "never fabricate to hit a number" rule. So MAX_BANK_SIZE below is a
   CEILING (never generate/store more than this many), never a floor —
   a bank built from N real questions (N < 50) stays N questions forever,
   honestly small.

   Source of "real questions" is whatever the caller already assembled
   through 100% existing, unmodified real pipelines — this Runtime never
   calls QuestionBank.generate()/QuestionGenerationRuntime itself and
   never invents a single question; it only decides ONCE, per examId,
   which of the caller's already-real questions become the permanent bank,
   and remembers that decision so a later call with a different (or empty)
   `questions` array can never regenerate/shrink/grow it.

   Persisted via AHS.PersistenceAdapter (same Workspace-namespaced,
   sessionStorage-backed pattern every other Runtime in this repo already
   uses — not a new persistence mechanism, "not localStorage"). Public API
   is additive only; no existing Runtime's API is touched by this file. */
window.AHS = window.AHS || {};
AHS.QuestionBankRuntime = (function () {
  "use strict";

  var STORAGE_KEY = "questionBankRuntime";
  var MAX_BANK_SIZE = 50;

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && loaded.banks && typeof loaded.banks === "object") { return loaded; }
    }
    return null;
  }

  function persist() {
    if (!AHS.PersistenceAdapter || typeof AHS.PersistenceAdapter.save !== "function") { return; }
    AHS.PersistenceAdapter.save(STORAGE_KEY, store);
  }

  var store = hydrate() || { banks: {} };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function hasBank(examId) {
    return !!(examId && store.banks[examId] && store.banks[examId].length);
  }

  /* ensureBank(examId, questions) — build-once. First real call for this
     examId permanently captures whatever real questions exist right now
     (capped at MAX_BANK_SIZE, never padded to reach it — an honestly
     small real set of e.g. 6 questions stays a 6-question bank forever).
     Every subsequent call for the same examId is a no-op read: it returns
     the already-built bank unchanged, even if `questions` this time
     differs — "不因重新進入教材而重新產生". */
  function ensureBank(examId, questions) {
    if (!examId) { return []; }
    if (hasBank(examId)) { return clone(store.banks[examId]); }
    var real = Array.isArray(questions) ? questions : [];
    if (!real.length) { return []; }
    store.banks[examId] = clone(real).slice(0, MAX_BANK_SIZE);
    persist();
    return clone(store.banks[examId]);
  }

  function getBank(examId) {
    return hasBank(examId) ? clone(store.banks[examId]) : [];
  }

  function bankSize(examId) {
    return hasBank(examId) ? store.banks[examId].length : 0;
  }

  /* drawRandom(examId, n) — a real random redraw of up to n questions
     from the already-built, permanent bank (Fisher-Yates on a clone; the
     stored bank's own order is never mutated). This is the "每日 AI 練習
     從 QuestionBank 隨機抽 10 題" / "再次測試隨機抽 10 題" mechanism
     (AI-121-05/AI-121-07) — never more questions than the bank honestly
     has (a 6-question bank asked for 10 returns all 6, not padded). */
  function drawRandom(examId, n) {
    var bank = getBank(examId);
    for (var i = bank.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = bank[i]; bank[i] = bank[j]; bank[j] = tmp;
    }
    return typeof n === "number" ? bank.slice(0, n) : bank;
  }

  /* reset() — test helper; clears every built bank back to first-open
     state, same convention every other Runtime's reset() already uses. */
  function reset() {
    store = { banks: {} };
    persist();
  }

  return {
    ensureBank: ensureBank,
    hasBank: hasBank,
    getBank: getBank,
    bankSize: bankSize,
    drawRandom: drawRandom,
    reset: reset,
    MAX_BANK_SIZE: MAX_BANK_SIZE
  };
})();
