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

  /* dueForReview() — real WrongBookRuntime entries not yet 已精熟 (AI-610's
     own real correctStreak field, persisted). This is the same, single,
     deterministic "three consecutive correct reviews" rule WrongBook.js's
     own getMasteryStatus() already uses — not a second definition, not an
     AI-inferred schedule ("不得自動排程" is respected: no date/time
     reasoning here, just "has this real wrong item been mastered yet"). */
  function dueForReview() {
    return wrongItems().filter(function (w) { return (w.correctStreak || 0) < 3; });
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

  /* readingProgress() — real average AHS.MaterialRuntime progress across
     every material in this session; 0 when there are none yet (never a
     fabricated baseline). This is 閱讀進度 (Reading Progress) per
     Architecture_Platform_Terminology_v1.0.md — distinct from Exam Mode
     accuracy/mastery below. */
  function readingProgress() {
    var mats = materials();
    if (!mats.length) { return 0; }
    var sum = mats.reduce(function (s, m) { return s + (typeof m.progress === "number" ? m.progress : 0); }, 0);
    return Math.round(sum / mats.length);
  }

  /* completionRate() — real % of materials whose reading progress has
     reached 100. */
  function completionRate() {
    var mats = materials();
    if (!mats.length) { return 0; }
    var done = mats.filter(function (m) { return (m.progress || 0) >= 100; }).length;
    return Math.round((done / mats.length) * 100);
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

  /* knowledgeAnalytics() — AI-117-04. Real per-knowledge-point rollup
     from AHS.WrongBookRuntime's own `knowledgePoint` field (already
     real, already used by js/components/WrongBook.js's own grouping —
     not a new field). Honest data-availability judgment call, flagged
     not hidden: this repository tracks WRONG answers (WrongBookRuntime)
     but never a per-knowledge-point count of every CORRECT first
     attempt, so a true first-attempt "正確率/錯誤率" per knowledge point
     isn't derivable from any real source. `masteryRate` (real: mastered
     ÷ total real wrong items at that point) is used for both
     `masteryRate` and `correctRate` — the most honest real proxy this
     data supports ("of everything ever missed here, how much has since
     been correctly re-answered to mastery") — never a fabricated
     separate number. */
  function knowledgeAnalytics() {
    var bucket = {};
    wrongItems().forEach(function (w) {
      var kp = w.knowledgePoint || "";
      if (!kp) { return; }
      bucket[kp] = bucket[kp] || [];
      bucket[kp].push(w);
    });
    return Object.keys(bucket).sort().map(function (kp) {
      var items = bucket[kp];
      var mastered = items.filter(function (w) { return (w.correctStreak || 0) >= 3; });
      var due = items.filter(function (w) { return (w.correctStreak || 0) < 3; });
      var masteryRate = items.length ? Math.round(mastered.length / items.length * 100) : 0;
      var errorCount = items.reduce(function (s, w) { return s + (w.errorCount || 0); }, 0);
      var lastSeen = items.reduce(function (latest, w) {
        return (!latest || (w.lastError || "") > latest) ? (w.lastError || latest) : latest;
      }, null);
      return {
        knowledgePoint: kp,
        errorCount: errorCount,
        dueCount: due.length,
        masteryRate: masteryRate,
        correctRate: masteryRate,
        errorRate: 100 - masteryRate,
        lastSeen: lastSeen
      };
    });
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
    readingProgress: readingProgress,
    completionRate: completionRate,
    examStats: examStats,
    doneToday: doneToday,
    doneThisWeek: doneThisWeek,
    materialCompletion: materialCompletion,
    subjectAnalytics: subjectAnalytics,
    materialAnalytics: materialAnalytics,
    materialAnalyticsAll: materialAnalyticsAll,
    knowledgeAnalytics: knowledgeAnalytics,
    learningTrend: learningTrend,
    wrongBookAnalytics: wrongBookAnalytics,
    materialContext: materialContext
  };
})();
