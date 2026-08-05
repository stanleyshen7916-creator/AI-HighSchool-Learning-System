/* js/runtime/WrongBookRuntime.js — Sprint 4 · Quiz Runtime Foundation.
   WrongBookRuntime is the Quiz-Runtime-driven 錯題 store, following the
   same pattern already locked by AHS.MaterialRuntime: a store under
   window.AHS, starting EMPTY (no seed). It grows only via
   sync(gradedResult) — called after AutoGrader.grade() — never by
   reading AHS.Mock.wrongBook. AHS.Mock.wrongBook is left untouched as
   Developer Seed Data / static UI reference for the existing
   WrongBook.js page and is not read by this Runtime.

   Sprint AI-109 AI-601 (Runtime Integration, root cause fix): this store
   was plain in-memory only, with no AHS.PersistenceAdapter hydrate/
   persist calls anywhere in this file — every other page-navigation in
   this multi-page app re-evaluates this IIFE from scratch, so a real
   wrong answer recorded via sync() on quiz.html was silently lost the
   moment the user navigated to wrongbook.html (a genuine "Runtime
   island" at the page-navigation boundary, not just a same-page
   nice-to-have). Fixed with the exact same hydrate()/persist() pattern
   AHS.MaterialRuntime/AHS.SummaryRuntime already use — same Public API
   (list/isEmpty/getById/sync/toggleBookmark/reset), same field shape,
   nothing renamed or removed; only real state now survives navigation
   within the same browser session, exactly like every other Runtime
   this app already trusts sessionStorage for. */
window.AHS = window.AHS || {};
AHS.WrongBookRuntime = (function () {
  "use strict";

  var STORAGE_KEY = "wrongBookRuntime";

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && Array.isArray(loaded.items)) { return loaded; }
    }
    return null;
  }

  function persist() {
    if (!AHS.PersistenceAdapter || typeof AHS.PersistenceAdapter.save !== "function") { return; }
    AHS.PersistenceAdapter.save(STORAGE_KEY, store);
  }

  var store = hydrate() || { items: [], seq: 0 };

  /* weaknessState(item) — Sprint AI-121 (Learning Knowledge Engine)
     AI-121-08: 錯題本 page renamed 知識弱點 (Knowledge Weakness) with a
     real state — NEW -> LEARNING -> MASTERED -> ARCHIVED, "不得真的刪除，
     History 永久保留". Purely derived from this record's own already-real
     fields (errorCount/correctStreak/archived) — no second store, no
     drift: archived is the only NEW persisted bit this Sprint adds
     (below); the other three states are exactly the same real
     correctStreak-based rule js/components/WrongBook.js's own
     getMasteryStatus() and every existing Statistics function already
     use (never a second, conflicting mastery definition). */
  function weaknessState(item) {
    if (item.archived) { return "ARCHIVED"; }
    if ((item.correctStreak || 0) >= 3) { return "MASTERED"; }
    if ((item.correctStreak || 0) > 0) { return "LEARNING"; }
    return "NEW";
  }

  function withWeaknessState(item) {
    var copy = clone(item);
    copy.weaknessState = weaknessState(item);
    return copy;
  }

  function list() {
    return store.items.map(withWeaknessState);
  }

  function isEmpty() {
    return store.items.length === 0;
  }

  function getById(id) {
    for (var i = 0; i < store.items.length; i++) {
      if (store.items[i].id === id) { return withWeaknessState(store.items[i]); }
    }
    return null;
  }

  function findExisting(questionId) {
    for (var i = 0; i < store.items.length; i++) {
      if (store.items[i].questionId === questionId) { return store.items[i]; }
    }
    return null;
  }

  /* sync(gradedResult) — gradedResult is an AutoGrader result. Every
     wrong answer becomes (or updates) a wrong-book entry: a repeated
     miss on the same question bumps errorCount instead of duplicating.
     Returns the list of entries touched by this sync (clone). */
  function sync(gradedResult) {
    if (!gradedResult || !gradedResult.wrong) { return []; }
    var touched = [];
    gradedResult.wrong.forEach(function (w) {
      var existing = findExisting(w.questionId);
      var now = new Date();
      if (existing) {
        existing.errorCount += 1;
        existing.lastError = formatDate(now);
        existing.yourAnswer = w.yourAnswer;
        /* AI-610 (Sprint AI-111): missing it again for real resets real
           progress toward 已精熟 — same rule recordRetry() applies below,
           kept consistent here so sync() and recordRetry() never disagree
           on what "wrong again" means. */
        existing.correctStreak = 0;
        /* AI-121-12/19: a real wrong answer un-resolves a previously
           已精熟 item — its old masteredAt date would otherwise keep
           counting toward a stale, no-longer-true "resolved" day. */
        existing.masteredAt = null;
        /* AI-121-08 judgment call: a genuinely new real wrong answer on
           an already-archived item is real evidence the weakness is
           active again — auto-unarchiving keeps `archived` an honest
           reflection of "currently a resolved/dismissed weakness", never
           a stale label that hides a recurring real mistake. The
           record itself was never deleted either way — History (every
           past errorCount/lastError) is untouched. */
        existing.archived = false;
        touched.push(existing);
      } else {
        store.seq += 1;
        var record = {
          id: "wb_" + store.seq,
          questionId: w.questionId,
          subject: gradedResult.subject,
          title: gradedResult.title,
          chapter: gradedResult.chapter,
          /* AI-601: real material-source link — w.materialId comes
             straight from the question record's own, already-real
             materialId field (see AutoGrader.js's own additive change),
             never fabricated; "" when the source question genuinely has
             none (e.g. a Mock/QuestionBank-generated Exam Mode question
             with no material behind it). */
          materialId: w.materialId || "",
          knowledgePoint: w.knowledgePoint,
          question: w.text,
          options: w.options,
          yourAnswer: w.yourAnswer,
          correctAnswer: w.correctAnswer,
          explanation: w.explanation,
          errorCount: 1,
          lastError: formatDate(now),
          /* AI-121-12/19: real, immutable creation date — never updated
             by later mistakes (lastError already covers "most recent"),
             the honest source for Home's real "今日新增弱點" KPI. */
          firstError: formatDate(now),
          /* AI-121-12/19: real, set once by recordRetry() below the
             moment correctStreak first reaches 3 — the honest source for
             Home's real "今日解除弱點" KPI. null until then. */
          masteredAt: null,
          bookmarked: false,
          /* AI-121-08: real, persisted, explicit-action-only flag —
             never set true except via archive() below. */
          archived: false,
          /* AI-610: real, persisted retry progress — see recordRetry()
             below. 0 = never retried correctly since the last miss. */
          correctStreak: 0
        };
        store.items.push(record);
        touched.push(record);
      }
    });
    persist();
    return clone(touched);
  }

  /* recordRetry(id, wasCorrect) — Sprint AI-111 AI-610: real, persisted
     retry lifecycle. WrongBook.js's 立即重做 (re-answer) flow previously
     only advanced a session-scoped, in-memory-only `masteryTracker` local
     to that one file — invisible to any other page/Runtime and lost on
     reload, so "答對 → 更新 WrongBookRuntime → 同步 Review/Statistics"
     never actually happened. A correct retry now advances the record's
     own real correctStreak (persisted); a wrong retry (sync() already
     bumped errorCount/lastError above) resets it to 0 here too, so both
     entry points agree. AHS.StatisticsRuntime derives 已完成複習/今日待
     複習 straight from this real field — no second, parallel "mastery"
     store anywhere. Additive function; sync/toggleBookmark/reset/etc. are
     unchanged. */
  function recordRetry(id, wasCorrect) {
    for (var i = 0; i < store.items.length; i++) {
      if (store.items[i].id === id) {
        var wasMasteredBefore = (store.items[i].correctStreak || 0) >= 3;
        store.items[i].correctStreak = wasCorrect ? (store.items[i].correctStreak || 0) + 1 : 0;
        /* AI-121-12/19: real, set exactly once — the calendar day this
           item FIRST reached 已精熟 (3 consecutive correct). A retry that
           keeps an already-mastered item mastered doesn't touch it again
           (never overwritten to "today" on every later correct retry). */
        if (!wasMasteredBefore && store.items[i].correctStreak >= 3) {
          store.items[i].masteredAt = formatDate(new Date());
        } else if (!wasCorrect) {
          store.items[i].masteredAt = null;
        }
        persist();
        return clone(store.items[i]);
      }
    }
    return null;
  }

  /* archive(id) / unarchive(id) — AI-121-08: the ONLY way `archived`
     ever changes by explicit student action (sync() above may also
     auto-unarchive on a real recurring mistake). Never removes the
     record from store.items — "不得真的刪除" holds structurally: list()/
     getById() still return it (with weaknessState "ARCHIVED"), only a
     caller's own UI filter decides whether to hide it by default. */
  function archive(id) {
    for (var i = 0; i < store.items.length; i++) {
      if (store.items[i].id === id) {
        store.items[i].archived = true;
        persist();
        return withWeaknessState(store.items[i]);
      }
    }
    return null;
  }

  function unarchive(id) {
    for (var i = 0; i < store.items.length; i++) {
      if (store.items[i].id === id) {
        store.items[i].archived = false;
        persist();
        return withWeaknessState(store.items[i]);
      }
    }
    return null;
  }

  function toggleBookmark(id) {
    for (var i = 0; i < store.items.length; i++) {
      if (store.items[i].id === id) {
        store.items[i].bookmarked = !store.items[i].bookmarked;
        persist();
        return store.items[i].bookmarked;
      }
    }
    return false;
  }

  function formatDate(d) {
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* reset() — test helper; clears back to first-open state. */
  function reset() {
    store = { items: [], seq: 0 };
    persist();
  }

  /* importRecords(records) — Sprint AI-113 AI-804 (Settings: Export/
     Import 學習紀錄). Real, additive merge: appends each valid record
     (must have a questionId — same minimal shape sync() already
     produces) with a freshly assigned id so imported records never
     collide with existing ones. Never replaces/clears existing data —
     Restore (full-session replace) is a separate, explicit action in
     Settings; this is always a merge. Returns the count actually
     imported. */
  function importRecords(records) {
    if (!Array.isArray(records)) { return 0; }
    var count = 0;
    records.forEach(function (r) {
      if (!r || !r.questionId) { return; }
      store.seq += 1;
      var copy = {};
      for (var k in r) { if (Object.prototype.hasOwnProperty.call(r, k)) { copy[k] = r[k]; } }
      copy.id = "wb_" + store.seq;
      store.items.push(copy);
      count += 1;
    });
    if (count) { persist(); }
    return count;
  }

  return {
    list: list,
    isEmpty: isEmpty,
    getById: getById,
    sync: sync,
    recordRetry: recordRetry,
    toggleBookmark: toggleBookmark,
    archive: archive,
    unarchive: unarchive,
    weaknessState: weaknessState,
    reset: reset,
    importRecords: importRecords
  };
})();
