/* js/runtime/StatisticsRuntime.js — Sprint 4 · Quiz Runtime Foundation.
   StatisticsRuntime is purely computed: it never stores raw rows of its
   own, it only reads AHS.HistoryRuntime.list() and derives numbers from
   it each time it's asked. getSubject() and refresh() always recompute
   independently from the current history — there is no cached
   aggregate to go stale. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.StatisticsRuntime = (function () {
  "use strict";

  /* overview() — total exams taken / average accuracy / total score /
     total questions answered correctly, computed fresh from history. */
  function overview() {
    var items = AHS.HistoryRuntime.list();
    var totalCount = items.length;
    var totalAccuracy = 0;
    var totalScore = 0;
    var totalCorrect = 0;
    items.forEach(function (h) {
      totalAccuracy += h.accuracy || 0;
      totalScore += h.score || 0;
      totalCorrect += h.correctCount || 0;
    });
    return {
      totalCount: totalCount,
      avgAccuracy: totalCount ? Math.round(totalAccuracy / totalCount) : 0,
      totalScore: totalScore,
      totalCorrect: totalCorrect
    };
  }

  /* accuracyBySubject() — average accuracy per subject, computed fresh
     from history each call (BUG-free by construction: no stored state
     to drift from the source list). */
  function accuracyBySubject() {
    var items = AHS.HistoryRuntime.list();
    var bucket = {};
    items.forEach(function (h) {
      bucket[h.subject] = bucket[h.subject] || { sum: 0, n: 0 };
      bucket[h.subject].sum += h.accuracy || 0;
      bucket[h.subject].n += 1;
    });
    return Object.keys(bucket).map(function (subject) {
      var b = bucket[subject];
      return { subject: subject, percent: Math.round(b.sum / b.n) };
    });
  }

  function getSubject(subject) {
    var all = accuracyBySubject();
    for (var i = 0; i < all.length; i++) {
      if (all[i].subject === subject) { return all[i]; }
    }
    return null;
  }

  /* refresh() — shapes overview() + accuracyBySubject() into the exact
     stat-card / donut shape AHS.QuizCenter already renders
     (AHS.Mock.quiz.stats / accuracyByStudy), so the UI can swap from
     static Mock numbers to live Runtime numbers without any markup
     change. */
  function refresh() {
    var ov = overview();
    return {
      stats: [
        { icon: "clock", label: "總測驗次數", value: String(ov.totalCount), unit: "次", delta: "本次 Session" },
        { icon: "target", label: "平均正確率", value: String(ov.avgAccuracy), unit: "%", delta: "本次 Session" },
        { icon: "award", label: "總得分", value: String(ov.totalScore), unit: "分", delta: "本次 Session" },
        { icon: "check", label: "答對題數", value: String(ov.totalCorrect), unit: "題", delta: "本次 Session" }
      ],
      accuracyByStudy: accuracyBySubject()
    };
  }

  /* ---- Sprint AI-111 additions (AI-609/611/612) --------------------------
     Still purely computed — every function below reads only
     AHS.WrongBookRuntime.list() / AHS.HistoryRuntime.list() fresh on each
     call, stores nothing of its own, and is additive to this file's
     existing Public API (overview/accuracyBySubject/getSubject/refresh
     are all unchanged). This is the single, real source both 複習中心
     (AppReview.js), 首頁 (AppHome.js) and AI Tutor (AiTutor.js /
     AiTutorHomeCard) read from — "不得建立第二份統計". */

  function wrongItems() {
    return (AHS.WrongBookRuntime && typeof AHS.WrongBookRuntime.list === "function")
      ? AHS.WrongBookRuntime.list() : [];
  }

  /* reviewPriority(item) — Sprint AI-121 AI-121-13: real, deterministic
     priority score for the Daily/Weekly Review queue — "priority-sorted，
     非隨機". Every term is a real, already-tracked field (no new store,
     no AI-inferred schedule — "不得自動排程" still respected: this only
     orders what's already due, it invents no new due date):
       urgency tier   — correctStreak 0/1/2 (further from 已精熟 first)
       real errorCount — missed more times, more urgent
       Knowledge Mastery — real AHS.KnowledgeMasteryRuntime %, lower first
                           (unknown/never-graded-via-exam points get a
                           real neutral 50, never assumed either way)
       Knowledge Trend  — "falling" real mastery bumps priority further */
  function reviewPriority(item) {
    var tier = (3 - Math.min(3, item.correctStreak || 0)) * 100;
    var errorWeight = (item.errorCount || 0) * 10;
    var kmr = AHS.KnowledgeMasteryRuntime;
    var kp = (kmr && item.knowledgePoint && typeof kmr.get === "function") ? kmr.get(item.knowledgePoint) : null;
    var masteryWeight = kp && typeof kp.mastery === "number" ? (100 - kp.mastery) : 50;
    var trendWeight = kp && kp.trend === "falling" ? 20 : 0;
    return tier + errorWeight + masteryWeight + trendWeight;
  }

  /* dueForReview() — real WrongBookRuntime entries not yet 已精熟 (AI-610's
     own real correctStreak field, persisted), excluding AI-121-08's real
     archived state (a dismissed weakness is never "due"). This is the
     same, single, deterministic "three consecutive correct reviews" rule
     WrongBook.js's own getMasteryStatus() already uses — not a second
     definition. Sprint AI-121 AI-121-13: now real-priority-sorted (see
     reviewPriority() above, highest first) instead of insertion order —
     "不得隨機排序，需依優先序" — still zero AI/date-inference, purely a
     deterministic function of already-real fields. */
  function dueForReview() {
    return wrongItems()
      .filter(function (w) { return (w.correctStreak || 0) < 3 && !w.archived; })
      .sort(function (a, b) { return reviewPriority(b) - reviewPriority(a); });
  }

  function masteredReviewItems() {
    return wrongItems().filter(function (w) { return (w.correctStreak || 0) >= 3; });
  }

  /* recentWrongItems(limit) — most recently missed real entries. */
  function recentWrongItems(limit) {
    var items = wrongItems().slice().sort(function (a, b) {
      return (b.lastError || "").localeCompare(a.lastError || "");
    });
    return typeof limit === "number" ? items.slice(0, limit) : items;
  }

  /* weakestSubject() — the real subject with the lowest average accuracy
     among exams actually taken; null when there's no history yet (never
     a fabricated "weakness"). */
  function weakestSubject() {
    var all = accuracyBySubject();
    if (!all.length) { return null; }
    return all.slice().sort(function (a, b) { return a.percent - b.percent; })[0];
  }

  /* recommendedRetest() — the real, already-taken exam with the lowest
     accuracy, worth retaking; null with no history. Deterministic
     (lowest-accuracy-first), not an AI/opaque ranking. */
  function recommendedRetest() {
    var items = AHS.HistoryRuntime.list();
    if (!items.length) { return null; }
    return items.slice().sort(function (a, b) { return (a.accuracy || 0) - (b.accuracy || 0); })[0];
  }

  /* recommendedChapters(limit) — real chapters with the most outstanding
     (not-yet-mastered) wrong items, most first. */
  function recommendedChapters(limit) {
    var bucket = {};
    dueForReview().forEach(function (w) {
      var key = w.chapter || "";
      if (!key) { return; }
      bucket[key] = (bucket[key] || 0) + 1;
    });
    var chapters = Object.keys(bucket).map(function (chapter) {
      return { chapter: chapter, count: bucket[chapter] };
    }).sort(function (a, b) { return b.count - a.count; });
    return typeof limit === "number" ? chapters.slice(0, limit) : chapters;
  }

  /* completionSignals() — Sprint AI-114 AI-906: real material-completion
     state for the AI Tutor's priority chain ("教材完成 -> 推薦下一教材",
     "全部完成 -> 推薦挑戰測驗"). Reads AHS.LearningStateRuntime's own
     real per-material `completed` flag (Sprint AI-113 AI-803 — reading
     AND mastery, never reading alone) — not a second definition of
     "completed". Honest when there's no real data: completedMaterial/
     nextMaterial are null, allComplete is false, whenever there are no
     materials at all (never vacuously "all complete" on an empty
     session). */
  function completionSignals() {
    var mats = (AHS.MaterialRuntime && typeof AHS.MaterialRuntime.list === "function")
      ? AHS.MaterialRuntime.list() : [];
    var lsr = AHS.LearningStateRuntime;
    if (!mats.length || !lsr || typeof lsr.materialState !== "function") {
      return { completedMaterial: null, nextMaterial: null, allComplete: false };
    }
    var states = mats.map(function (m) { return { material: m, state: lsr.materialState(m.id) }; });
    var completed = states.filter(function (s) { return s.state.completed; });
    var notStarted = mats.filter(function (m) { return !(m.progress > 0); });
    return {
      completedMaterial: completed.length ? completed[completed.length - 1].material : null,
      nextMaterial: notStarted.length ? notStarted[0] : null,
      allComplete: completed.length === mats.length
    };
  }

  /* learningContext() — the single real view-model both 首頁 (AiTutorHomeCard)
     and AI Tutor (tutor.html) build their message text from. Every field
     is real, derived fresh; a genuinely-empty repository/session yields
     empty arrays/nulls (callers must show an honest empty state, never
     invent text — see AiTutorHomeCard.js's own existing Empty State). */
  function learningContext() {
    var completion = completionSignals();
    return {
      /* Sprint AI-121 AI-121-15/16: the single real, lowest-Mastery
         knowledge point (AHS.KnowledgeMasteryRuntime, via
         knowledgeWeakPoints() below) — the Tutor's own highest-priority,
         Knowledge-only signal, "不得推薦模糊建議" traceable straight to a
         real % and (when a real source material is known) a real
         summary.html link. null when nothing has been graded yet. */
      weakestKnowledgePoint: knowledgeWeakPoints(60)[0] || null,
      weakestSubject: weakestSubject(),
      dueForReview: dueForReview(),
      masteredCount: masteredReviewItems().length,
      recentWrongItems: recentWrongItems(3),
      recommendedRetest: recommendedRetest(),
      recommendedChapters: recommendedChapters(3),
      completedMaterial: completion.completedMaterial,
      nextMaterial: completion.nextMaterial,
      allComplete: completion.allComplete
    };
  }

  /* ---- Sprint AI-114 additions (AI-905 Single Source) ---------------------
     AI-905 names 閱讀進度/正確率/完成率/最高分/今日完成/今日待複習/錯題/
     精熟/歷史 as values that must come from this Runtime, not be
     recalculated per page. accuracy/dueForReview/wrong/mastered/history
     already existed above; the functions below close the remaining real
     gaps that were previously computed locally by individual pages
     (js/components/QuizCenter.js's own realStatsFor(), js/pages/
     AppReview.js's own doneToday/doneWeek date-math) — moved here
     verbatim (same logic, same real HistoryRuntime/MaterialRuntime
     source), those call sites now call these instead of keeping their
     own copy. */

  function materials() {
    return (AHS.MaterialRuntime && typeof AHS.MaterialRuntime.list === "function")
      ? AHS.MaterialRuntime.list() : [];
  }

  /* examStats(examId) — moved verbatim from js/components/QuizCenter.js's
     own realStatsFor() (Sprint HOTFIX-005 AI-501): a material never
     attempted keeps progress/accuracy/best at a real, honest 0/false,
     exactly like a Mock item that's never been taken. QuizCenter.js now
     calls this instead of keeping its own copy — same real
     AHS.HistoryRuntime source, one definition. */
  function examStats(examId) {
    var attempts = AHS.HistoryRuntime.list().filter(function (h) { return h.examId === examId; });
    if (!attempts.length) { return { progress: 0, accuracy: 0, best: 0, done: false, attempts: 0 }; }
    var best = attempts.reduce(function (max, h) { return Math.max(max, h.score || 0); }, 0);
    return { progress: 100, accuracy: attempts[0].accuracy || 0, best: best, done: true, attempts: attempts.length };
  }

  function parseWhen(when) {
    if (!when) { return null; }
    var m = /^(\d{4})\/(\d{2})\/(\d{2})(?:\s+(\d{2}):(\d{2}))?/.exec(when);
    if (!m) { return null; }
    return new Date(
      parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10),
      m[4] ? parseInt(m[4], 10) : 0, m[5] ? parseInt(m[5], 10) : 0
    );
  }

  function isSameCalendarDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  /* Monday-start week boundary — moved verbatim from js/pages/AppReview.js
     (no existing week-range convention is defined elsewhere in the
     repository for this to follow, same disclosure that file's own
     comment already made). */
  function startOfWeek(d) {
    var start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var offset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - offset);
    return start;
  }

  /* doneToday() / doneThisWeek() — real counts of finished exams (real
     AHS.HistoryRuntime records) whose `when` falls today / within the
     current calendar week. Moved verbatim from js/pages/AppReview.js's
     own deriveStats() — that file now calls these instead of keeping a
     second copy of the same date math. */
  function doneToday() {
    var now = new Date();
    return AHS.HistoryRuntime.list().filter(function (h) {
      var when = parseWhen(h.when);
      return !!when && isSameCalendarDay(when, now);
    }).length;
  }

  function doneThisWeek() {
    var now = new Date();
    var weekStart = startOfWeek(now);
    return AHS.HistoryRuntime.list().filter(function (h) {
      var when = parseWhen(h.when);
      return !!when && when >= weekStart;
    }).length;
  }

  /* ---- Sprint AI-117 additions — Learning Analytics Engine ---------------
     "Analytics 為 Platform Tutor 唯一資料來源。不得新增第二套 Statistics。"
     Every function below is purely computed (no store of its own),
     reading only the 8 Runtimes named in the Sprint's own Scope
     (MaterialRuntime/SummaryRuntime/QuestionRuntime/WrongBookRuntime/
     ReviewRuntime/HistoryRuntime/StatisticsRuntime itself/
     LearningStateRuntime) — this file remains the single Aggregation
     Layer; nothing here starts a second statistics source. */

  /* materialCompletion(materialId) — AI-117-01. Replaces "閱讀進度" as
     THE completion signal (取消目前「閱讀進度」概念): reading progress
     is still a real, unmodified AHS.MaterialRuntime field (removing the
     field itself would be a Runtime API change, forbidden by this same
     Sprint's own Scope — "不得修改既有 Runtime API"), it is simply no
     longer treated as, or displayed as, completion on its own. Three
     sequential real stages, each gated on the previous (matches the
     Sprint's own worked example: 0% -> 20% (① reading) -> 60% (② quiz)
     -> 100% (③ review) — a deliberate, uneven 20/40/40 weighting, not a
     flat 33/33/33 split, taken literally from the spec's own numbers):
       ① reading — AHS.LearningStateRuntime.materialState().readingDone
          (real progress >= 100), the same single definition
          js/pages/AppMaterials.js's own consumers already trust —
          reused, not re-derived.
       ② quiz — real evidence a quiz was actually taken for this
          material: either LearningStateRuntime's own quizAttempted
          (real WrongBookRuntime activity) OR a real
          AHS.HistoryRuntime record for this material's own Teaching-
          Material examId convention ("teaching_material_" + materialId,
          the same convention js/runtime/TeachingMaterialLoader.js
          already establishes) — the second check is what
          LearningStateRuntime alone cannot see: a quiz taken with a
          perfect score produces zero WrongBookRuntime entries, so
          "quizAttempted" alone would wrongly stay false for a student
          who got everything right.
       ③ review — every real wrong item for this material is 已精熟
          (dueCount === 0), only meaningful once ② is real (a material
          never quizzed has nothing to review, so review can never be
          "done" before quiz is).

     percent within the reading stage interpolates from the real, raw
     progress value (0-20, proportional to state.reading, real
     AHS.MaterialRuntime data — not a fabricated smoothing) rather than
     jumping straight from 0 to 20 the instant reading crosses 100%; a
     material genuinely 90% read should not honestly look identical to
     one never opened. Once every stage is gated open, percent snaps to
     the Sprint's own literal checkpoint values (20/60/100) exactly. */
  function materialCompletion(materialId) {
    var lsr = AHS.LearningStateRuntime;
    var state = (lsr && typeof lsr.materialState === "function") ? lsr.materialState(materialId) : null;
    var readingDone = !!(state && state.readingDone);
    var examId = "teaching_material_" + materialId;
    var hasHistoryAttempt = AHS.HistoryRuntime.list().some(function (h) { return h.examId === examId; });
    var quizDone = readingDone && (!!(state && state.quizAttempted) || hasHistoryAttempt);
    var reviewDone = quizDone && !!state && state.dueCount === 0;

    var stage = 0;
    if (readingDone) { stage = 1; }
    if (readingDone && quizDone) { stage = 2; }
    if (readingDone && quizDone && reviewDone) { stage = 3; }
    var percent = stage === 0
      ? Math.round((state ? state.reading : 0) / 100 * 20)
      : [0, 20, 60, 100][stage];
    var label = ["尚未開始", "教材閱讀完成", "測驗完成", "複習完成"][stage];

    return {
      materialId: materialId,
      readingDone: readingDone,
      quizDone: quizDone,
      reviewDone: reviewDone,
      stage: stage,
      percent: percent,
      label: label
    };
  }

  /* overallMaterialCompletion() — Sprint AI-134（真實 PO 需求：首頁飼養
     寵物小遊戲，「每日飼養的邏輯為依照教材完成度百分比的完成比例來作為
     成長的因子」）。單一、平台整體的完成度百分比：對目前 Workspace 下
     每一筆真實教材呼叫既有的 materialCompletion(m.id)，取其 percent 的
     平均值，四捨五入到整數 — 直接重用 materialCompletion() 本身（不是
     另外發明第二套完成度定義，遵循本專案既有的 Single Source 原則，與
     subjectAnalytics() 用的是同一份底層數字）。沒有任何真實教材時誠實
     回傳 0（不是假造一個進度），呼叫端自行決定要顯示什麼空狀態文案。 */
  function overallMaterialCompletion() {
    var mats = materials();
    if (!mats.length) { return 0; }
    var total = mats.reduce(function (sum, m) { return sum + materialCompletion(m.id).percent; }, 0);
    return Math.round(total / mats.length);
  }

  /* subjectAnalytics() — AI-117-02. One entry per real subject present
     in AHS.MaterialRuntime.list(). accuracyBySubject()/wrongItems() are
     reused (not re-derived) for avgAccuracy/wrongCount/masteryRate/
     dueForReviewCount. */
  function subjectAnalytics() {
    var bySubject = {};
    materials().forEach(function (m) {
      bySubject[m.subject] = bySubject[m.subject] || [];
      bySubject[m.subject].push(m);
    });
    return Object.keys(bySubject).sort().map(function (subject) {
      var mats = bySubject[subject];
      var completions = mats.map(function (m) { return materialCompletion(m.id); });
      var materialCompletionRate = mats.length
        ? Math.round(completions.filter(function (c) { return c.stage === 3; }).length / mats.length * 100) : 0;
      var quizCompletionRate = mats.length
        ? Math.round(completions.filter(function (c) { return c.quizDone; }).length / mats.length * 100) : 0;
      var acc = getSubject(subject);
      var subjectWrong = wrongItems().filter(function (w) { return w.subject === subject; });
      var subjectDue = subjectWrong.filter(function (w) { return (w.correctStreak || 0) < 3; });
      var subjectMastered = subjectWrong.filter(function (w) { return (w.correctStreak || 0) >= 3; });
      return {
        subject: subject,
        materialCompletionRate: materialCompletionRate,
        quizCompletionRate: quizCompletionRate,
        avgAccuracy: acc ? acc.percent : 0,
        wrongCount: subjectWrong.length,
        masteryRate: subjectWrong.length ? Math.round(subjectMastered.length / subjectWrong.length * 100) : 0,
        dueForReviewCount: subjectDue.length
      };
    });
  }

  /* materialAnalytics(materialId) — AI-117-03. One real record, no
     second copy anywhere: "不得新增第二份資料" is honored by this being
     the only place attemptCount/bestScore/avgScore/wrongCount/
     masteryRate/lastStudiedAt for a material are computed — every
     consumer (Material Card, AI Tutor, future Dashboard work) calls
     this instead of re-deriving from HistoryRuntime/WrongBookRuntime
     itself. */
  function materialAnalytics(materialId) {
    var mat = null;
    materials().forEach(function (m) { if (m.id === materialId) { mat = m; } });
    var examId = "teaching_material_" + materialId;
    var attempts = AHS.HistoryRuntime.list().filter(function (h) { return h.examId === examId; });
    var bestScore = attempts.reduce(function (max, h) { return Math.max(max, h.score || 0); }, 0);
    var avgScore = attempts.length
      ? Math.round(attempts.reduce(function (s, h) { return s + (h.score || 0); }, 0) / attempts.length) : 0;
    var related = wrongItems().filter(function (w) { return w.materialId === materialId; });
    var mastered = related.filter(function (w) { return (w.correctStreak || 0) >= 3; });

    return {
      materialId: materialId,
      title: mat ? mat.title : "",
      completion: materialCompletion(materialId),
      attemptCount: attempts.length,
      bestScore: bestScore,
      avgScore: avgScore,
      wrongCount: related.length,
      masteryRate: related.length ? Math.round(mastered.length / related.length * 100) : 0,
      lastStudiedAt: mat ? (mat.lastLearningAt || mat.lastOpenedAt || null) : null
    };
  }

  function materialAnalyticsAll() {
    return materials().map(function (m) { return materialAnalytics(m.id); });
  }

  /* knowledgeAnalytics() — AI-117-04, redefined by Sprint AI-121
     (Learning Knowledge Engine) AI-121-10/17: real per-knowledge-point
     rollup, still keyed by the same real `knowledgePoint` field every
     question already carries, still grouped over AHS.WrongBookRuntime's
     own real records for errorCount/dueCount/lastSeen (unchanged shape,
     no existing consumer breaks). masteryRate/correctRate now prefer a
     genuinely richer real source where one exists:
     AHS.KnowledgeMasteryRuntime tracks every real graded attempt
     (correct AND wrong, fed at the moment js/components/QuizCenter.js's
     finishExam() grades an exam — see that Runtime's own header) instead
     of only "wrong items later resolved to 已精熟", closing the honest
     gap this function's AI-117-04 comment originally disclosed. A
     knowledge point with real KnowledgeMasteryRuntime attempts uses that
     real accuracy; one with only WrongBookRuntime activity (e.g. a
     session seeded directly, or Sprint-AI-117-era data) falls back to
     the original "mastered ÷ total wrong items" proxy — never a silently
     different number for the exact same real inputs that already passed
     regression before this Sprint. trend/growth/attemptCount are new,
     additive fields — null/0 when no real KnowledgeMasteryRuntime data
     exists yet for that point (never fabricated). */
  function knowledgeAnalytics() {
    var bucket = {};
    wrongItems().forEach(function (w) {
      var kp = w.knowledgePoint || "";
      if (!kp) { return; }
      bucket[kp] = bucket[kp] || [];
      bucket[kp].push(w);
    });
    var kmr = AHS.KnowledgeMasteryRuntime;
    var realPoints = {};
    if (kmr && typeof kmr.list === "function") {
      kmr.list().forEach(function (p) { realPoints[p.knowledgePoint] = p; bucket[p.knowledgePoint] = bucket[p.knowledgePoint] || []; });
    }
    return Object.keys(bucket).sort().map(function (kp) {
      var items = bucket[kp];
      var mastered = items.filter(function (w) { return (w.correctStreak || 0) >= 3; });
      var due = items.filter(function (w) { return (w.correctStreak || 0) < 3; });
      var proxyRate = items.length ? Math.round(mastered.length / items.length * 100) : 0;
      var errorCount = items.reduce(function (s, w) { return s + (w.errorCount || 0); }, 0);
      var lastSeen = items.reduce(function (latest, w) {
        return (!latest || (w.lastError || "") > latest) ? (w.lastError || latest) : latest;
      }, null);
      var real = realPoints[kp] || null;
      var masteryRate = real ? real.mastery : proxyRate;
      return {
        knowledgePoint: kp,
        errorCount: errorCount,
        dueCount: due.length,
        masteryRate: masteryRate,
        correctRate: masteryRate,
        errorRate: 100 - masteryRate,
        lastSeen: real ? real.lastSeen : lastSeen,
        attemptCount: real ? real.attemptCount : 0,
        trend: real ? real.trend : null,
        growth: real ? real.growth : null
      };
    });
  }

  /* knowledgeMastery() — AI-121-10/17: the single, real, Analytics-layer
     view of every knowledge point ever attempted — "Tutor 只能讀取
     Learning Analytics。不得直接存取各 Runtime" (AI-117-07's own rule,
     still honored: this is the one function that reads
     AHS.KnowledgeMasteryRuntime directly, everything else — Tutor
     included — reads through this Runtime). Empty array, honestly, when
     nothing has been attempted yet. */
  function knowledgeMastery() {
    return (AHS.KnowledgeMasteryRuntime && typeof AHS.KnowledgeMasteryRuntime.list === "function")
      ? AHS.KnowledgeMasteryRuntime.list() : [];
  }

  /* knowledgeWeakPoints(threshold) — AI-121-16: real knowledge points at
     or under `threshold` (default 60) Mastery, lowest first — the Tutor's
     honest input for "below-threshold summary reuse" (re-surfacing the
     material's existing real knowledge.json/summary content, never
     regenerating). */
  function knowledgeWeakPoints(threshold) {
    return (AHS.KnowledgeMasteryRuntime && typeof AHS.KnowledgeMasteryRuntime.weakPoints === "function")
      ? AHS.KnowledgeMasteryRuntime.weakPoints(threshold) : [];
  }

  /* knowledgeGrowthToday(limit) — AI-121-12: real knowledge point(s)
     with the day's biggest genuine positive Mastery delta, for the
     Tutor's "今日最大進步" highlight and the Home KPI of the same name. */
  function knowledgeGrowthToday(limit) {
    return (AHS.KnowledgeMasteryRuntime && typeof AHS.KnowledgeMasteryRuntime.topGrowthToday === "function")
      ? AHS.KnowledgeMasteryRuntime.topGrowthToday(limit) : [];
  }

  /* trendWindow(days) / learningTrend() — AI-117-05. days=0 means "today"
     (real calendar-day match, same isSameCalendarDay() rule doneToday()
     already uses); days=7/30 mean "within the last N days" (real date
     math, same parseWhen() already used above — not a second date
     parser). quizzesCompleted/avgAccuracy are exact (AHS.HistoryRuntime
     carries a real timestamp per exam). materialsCompleted is a real,
     disclosed proxy: this repository has no event log of exactly WHEN a
     material's stage last changed, only MaterialRuntime's own
     lastLearningAt/lastOpenedAt (when it was last touched) — a material
     currently at materialCompletion() stage 3 whose last real activity
     falls in the window counts; this is "completed AND recently active
     in this window", the closest honest approximation to "completed
     within this window" this data supports. */
  function trendWindow(days) {
    var now = new Date();
    function inWindow(d) {
      if (!d) { return false; }
      if (days === 0) { return isSameCalendarDay(d, now); }
      var cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      return d >= cutoff;
    }
    var hist = AHS.HistoryRuntime.list().filter(function (h) { return inWindow(parseWhen(h.when)); });
    var avgAccuracy = hist.length
      ? Math.round(hist.reduce(function (s, h) { return s + (h.accuracy || 0); }, 0) / hist.length) : 0;
    var touchedMats = materials().filter(function (m) {
      return inWindow(parseWhen(m.lastLearningAt)) || inWindow(parseWhen(m.lastOpenedAt));
    });
    var materialsCompleted = touchedMats.filter(function (m) {
      return materialCompletion(m.id).stage === 3;
    }).length;
    return { quizzesCompleted: hist.length, avgAccuracy: avgAccuracy, materialsCompleted: materialsCompleted };
  }

  function learningTrend() {
    return { today: trendWindow(0), sevenDay: trendWindow(7), thirtyDay: trendWindow(30) };
  }

  /* wrongBookAnalytics() — AI-117-06. Real aggregates over
     AHS.WrongBookRuntime.list() only — dueForReview()/masteredReviewItems()
     reused verbatim (already defined above), not re-derived.
     "長期未複習" (long-unreviewed): a real, deterministic date-threshold
     filter (not an AI-inferred schedule — "不得自動排程" from this
     project's own earlier LOCKs is still respected: this only reads a
     real field against a fixed constant, it schedules nothing) — 7 real
     days since `lastError` with no successful retry since
     (correctStreak still < 3). */
  var LONG_UNREVIEWED_DAYS = 7;

  function wrongBookAnalytics() {
    var items = wrongItems();
    var kpBucket = {};
    var matBucket = {};
    items.forEach(function (w) {
      if (w.knowledgePoint) { kpBucket[w.knowledgePoint] = (kpBucket[w.knowledgePoint] || 0) + (w.errorCount || 1); }
      if (w.materialId) { matBucket[w.materialId] = (matBucket[w.materialId] || 0) + (w.errorCount || 1); }
    });
    var topWrongKnowledgePoints = Object.keys(kpBucket)
      .map(function (kp) { return { knowledgePoint: kp, count: kpBucket[kp] }; })
      .sort(function (a, b) { return b.count - a.count; });
    var topWrongMaterials = Object.keys(matBucket).map(function (materialId) {
      var mat = null;
      materials().forEach(function (m) { if (m.id === materialId) { mat = m; } });
      return { materialId: materialId, title: mat ? mat.title : materialId, count: matBucket[materialId] };
    }).sort(function (a, b) { return b.count - a.count; });

    var now = new Date();
    var longUnreviewed = items.filter(function (w) {
      if ((w.correctStreak || 0) >= 3) { return false; }
      var last = parseWhen(w.lastError);
      if (!last) { return false; }
      return (now - last) / (24 * 60 * 60 * 1000) > LONG_UNREVIEWED_DAYS;
    });

    return {
      topWrongKnowledgePoints: topWrongKnowledgePoints,
      topWrongMaterials: topWrongMaterials,
      longUnreviewed: longUnreviewed,
      mastered: masteredReviewItems(),
      dueForReview: dueForReview()
    };
  }

  /* materialContext(materialId) — AI-117-07 Platform Tutor Engine's own
     real, single data-access point for "目前教材" context. Wraps
     materialCompletion() + real title/chapter/dueCount so
     js/utils/TutorMessage.js (the Rule-Based Tutor Engine) never has to
     read AHS.MaterialRuntime/AHS.LearningStateRuntime directly itself —
     "Tutor 只能讀取 Learning Analytics。不得直接存取各 Runtime." Returns
     null when the material doesn't exist (never a fabricated context). */
  function materialContext(materialId) {
    var mat = null;
    materials().forEach(function (m) { if (m.id === materialId) { mat = m; } });
    if (!mat) { return null; }
    var lsr = AHS.LearningStateRuntime;
    var state = (lsr && typeof lsr.materialState === "function") ? lsr.materialState(materialId) : null;
    return {
      materialId: materialId,
      title: mat.title,
      chapter: mat.chapter,
      completion: materialCompletion(materialId),
      dueCount: state ? state.dueCount : 0
    };
  }

  /* ---- Sprint AI-121 additions — Home KPI redefinition (AI-121-01/19) ----
     "平台從 Learning Progress 轉為 Learning Outcome". Every function below
     is purely computed, real-or-null (never a fabricated 0/placeholder
     when there's genuinely no data yet), reading only Runtimes this file
     already reads elsewhere (HistoryRuntime/WrongBookRuntime/
     KnowledgeMasteryRuntime/LearningStateRuntime) — no new store. */

  function accuracyOnOrAfter(cutoffCheck) {
    var items = AHS.HistoryRuntime.list().filter(function (h) {
      var when = parseWhen(h.when);
      return !!when && cutoffCheck(when);
    });
    if (!items.length) { return null; }
    return Math.round(items.reduce(function (s, h) { return s + (h.accuracy || 0); }, 0) / items.length);
  }

  /* accuracyToday() / accuracyThisWeek() — real average accuracy over
     today's / this calendar week's real HistoryRuntime attempts; null
     (not 0) when nothing was attempted yet. */
  function accuracyToday() {
    var now = new Date();
    return accuracyOnOrAfter(function (when) { return isSameCalendarDay(when, now); });
  }

  function accuracyThisWeek() {
    var weekStart = startOfWeek(new Date());
    return accuracyOnOrAfter(function (when) { return when >= weekStart; });
  }

  /* newWeaknessesToday() / resolvedWeaknessesToday() — AI-121-12/19: real
     counts from AHS.WrongBookRuntime's own real firstError/masteredAt
     fields (this Sprint's additions to that Runtime — see its own
     header). "今日新增弱點" / "今日解除弱點". */
  function newWeaknessesToday() {
    var today = formatTodayLikeWrongBook();
    return wrongItems().filter(function (w) { return w.firstError === today; }).length;
  }

  function resolvedWeaknessesToday() {
    var today = formatTodayLikeWrongBook();
    return wrongItems().filter(function (w) { return w.masteredAt === today; }).length;
  }

  /* formatTodayLikeWrongBook() — same "YYYY/MM/DD" convention
     AHS.WrongBookRuntime's own formatDate()/firstError/masteredAt use —
     duplicated here only as date-string formatting (not a second
     Runtime/store), matching every other file in this repo's own
     established "no shared date-format util exists" precedent. */
  function formatTodayLikeWrongBook() {
    var d = new Date();
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  /* knowledgeMasteryAvg() — real average Mastery % across every real
     knowledge point ever attempted (AHS.KnowledgeMasteryRuntime); null
     when nothing has been attempted yet. */
  function knowledgeMasteryAvg() {
    var points = knowledgeMastery();
    if (!points.length) { return null; }
    return Math.round(points.reduce(function (s, p) { return s + p.mastery; }, 0) / points.length);
  }

  /* knowledgeGrowthAvgToday() — AI-121-12: real average day-over-day
     Mastery delta across every real knowledge point with both a real
     today AND a real prior-day attempt; null when none qualify yet
     (never averaged against a fabricated 0 for points with no signal). */
  function knowledgeGrowthAvgToday() {
    var withDelta = knowledgeMastery().filter(function (p) {
      return p.growth && typeof p.growth.delta === "number";
    });
    if (!withDelta.length) { return null; }
    return Math.round(withDelta.reduce(function (s, p) { return s + p.growth.delta; }, 0) / withDelta.length);
  }

  /* outstandingTaskCount() — real count of AHS.LearningStateRuntime's own
     dailyTasks() (AI-114 AI-903) still outstanding right now — "未完成
     追蹤事項", reusing the existing Daily Task Engine's real priority
     list rather than inventing a second "what's left to do" definition. */
  function outstandingTaskCount() {
    var lsr = AHS.LearningStateRuntime;
    return (lsr && typeof lsr.dailyTasks === "function") ? lsr.dailyTasks().length : 0;
  }

  /* homeKpis() — AI-121-19: the single real view-model Home's KPI board
     renders from. Every field above, assembled once so the UI component
     never has to call more than one function. */
  function homeKpis() {
    return {
      outstandingTasks: outstandingTaskCount(),
      accuracyToday: accuracyToday(),
      accuracyThisWeek: accuracyThisWeek(),
      knowledgeMasteryAvg: knowledgeMasteryAvg(),
      knowledgeGrowthToday: knowledgeGrowthAvgToday(),
      topGrowthPoint: knowledgeGrowthToday(1)[0] || null,
      newWeaknessesToday: newWeaknessesToday(),
      resolvedWeaknessesToday: resolvedWeaknessesToday()
    };
  }

  /* pushDailySnapshot() — Sprint AI-126B Part 2, Task 6. This Runtime
     stays "Purely computed... no storage of its own" (own header above,
     unchanged) — this function only CAPTURES today's already-real,
     already-computed homeKpis() numbers into the durable public.
     statistics table (supabase/migrations/20260807000004's own comment:
     "the real gap a live-only read cannot [cover]: historical
     today-relative counters after today has passed"). Never invents a
     number homeKpis() didn't already produce; never called by homeKpis()
     itself or any existing read path — purely an additive, explicit,
     new function a caller (e.g. a page bootstrap, once per real session)
     may invoke. null-valued KPI fields (e.g. accuracyToday before any
     real attempt today) are honestly skipped, never written as 0. */
  function pushDailySnapshot() {
    if (!AHS.SyncBridge || !AHS.SyncBridge.isConfigured()) { return Promise.resolve({ pushed: 0 }); }
    var identity = AHS.SyncBridge.identity();
    if (!identity) { return Promise.resolve({ pushed: 0 }); }
    var kpis = homeKpis();
    var metrics = {
      outstandingTasks: kpis.outstandingTasks,
      accuracyToday: kpis.accuracyToday,
      accuracyThisWeek: kpis.accuracyThisWeek,
      knowledgeMasteryAvg: kpis.knowledgeMasteryAvg,
      knowledgeGrowthToday: kpis.knowledgeGrowthToday,
      newWeaknessesToday: kpis.newWeaknessesToday,
      resolvedWeaknessesToday: kpis.resolvedWeaknessesToday
    };
    var repo = AHS.RepositoryFactory.create();
    var todayIso = new Date().toISOString().slice(0, 10);
    var keys = Object.keys(metrics).filter(function (k) { return typeof metrics[k] === "number"; });
    if (!keys.length) { return Promise.resolve({ pushed: 0 }); }
    return repo.read("statistics", "student_profile_id=eq." + identity.studentProfileId + "&stat_date=eq." + todayIso).then(function (readResult) {
      var existingByKey = {};
      (readResult.data || []).forEach(function (row) { existingByKey[row.metric_key] = row; });
      var writes = keys.map(function (key) {
        var row = {
          user_id: identity.userId,
          student_profile_id: identity.studentProfileId,
          subject_id: null,
          stat_date: todayIso,
          metric_key: key,
          metric_value: metrics[key]
        };
        if (existingByKey[key]) { return repo.update("statistics", "id=eq." + existingByKey[key].id, row); }
        return repo.insert("statistics", row);
      });
      return Promise.all(writes).then(function () { return { pushed: keys.length }; });
    }).catch(function (err) {
      return { pushed: 0, error: { message: String(err && err.message || err) } };
    });
  }

  return {
    overview: overview,
    accuracyBySubject: accuracyBySubject,
    getSubject: getSubject,
    refresh: refresh,
    dueForReview: dueForReview,
    masteredReviewItems: masteredReviewItems,
    recentWrongItems: recentWrongItems,
    weakestSubject: weakestSubject,
    recommendedRetest: recommendedRetest,
    recommendedChapters: recommendedChapters,
    learningContext: learningContext,
    examStats: examStats,
    doneToday: doneToday,
    doneThisWeek: doneThisWeek,
    materialCompletion: materialCompletion,
    overallMaterialCompletion: overallMaterialCompletion,
    subjectAnalytics: subjectAnalytics,
    materialAnalytics: materialAnalytics,
    materialAnalyticsAll: materialAnalyticsAll,
    knowledgeAnalytics: knowledgeAnalytics,
    knowledgeMastery: knowledgeMastery,
    knowledgeWeakPoints: knowledgeWeakPoints,
    knowledgeGrowthToday: knowledgeGrowthToday,
    homeKpis: homeKpis,
    learningTrend: learningTrend,
    wrongBookAnalytics: wrongBookAnalytics,
    materialContext: materialContext,
    pushDailySnapshot: pushDailySnapshot
  };
})();
