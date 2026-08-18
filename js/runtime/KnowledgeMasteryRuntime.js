/* js/runtime/KnowledgeMasteryRuntime.js — Sprint AI-121 (Learning
   Knowledge Engine) foundation Runtime: "平台唯一分析單位為 Knowledge
   Point（非 Question）". This is the first Runtime in this repository
   that tracks BOTH correct and wrong real answers per knowledge point
   (every earlier "Knowledge Analytics" — AHS.StatisticsRuntime.
   knowledgeAnalytics(), Sprint AI-117 AI-117-04 — could only see WRONG
   answers, via AHS.WrongBookRuntime; that honest limitation is disclosed
   in that function's own comment). A real Mastery %, Accuracy %, Trend
   and day-over-day Growth all require knowing every real attempt, not
   only the missed ones — this Runtime is that real, persisted attempt
   log, keyed by each question's own real knowledgePoint string (the
   same field AHS.AutoGrader.grade()'s `results` already carries on
   every question, correct or wrong).

   Same store pattern as every other Runtime here: plain object under
   window.AHS, hydrate()/persist() through AHS.PersistenceAdapter
   (Workspace-namespaced sessionStorage — "not localStorage"), starts
   empty, grows only via real recordAttempt()/recordGraded() calls at
   the exact moment a real exam is graded — never seeded, never
   backfilled with fabricated history. */
window.AHS = window.AHS || {};
AHS.KnowledgeMasteryRuntime = (function () {
  "use strict";

  var STORAGE_KEY = "knowledgeMasteryRuntime";
  /* Bound each knowledge point's own attempt log so a very long real
     session can't grow this without limit — oldest real attempts drop
     first (same "cap, never fabricate" discipline as
     AHS.QuestionBankRuntime's MAX_BANK_SIZE), Mastery/Accuracy/Trend
     still reflect real, recent behavior. */
  var MAX_ATTEMPTS_PER_POINT = 300;

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && loaded.points && typeof loaded.points === "object") { return loaded; }
    }
    return null;
  }

  function persist() {
    if (!AHS.PersistenceAdapter || typeof AHS.PersistenceAdapter.save !== "function") { return; }
    AHS.PersistenceAdapter.save(STORAGE_KEY, store);
  }

  var store = hydrate() || { points: {} };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function dayKey(d) {
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  /* recordAttempt(knowledgePoint, wasCorrect, subject) — the one real,
     atomic write this Runtime ever makes. A falsy knowledgePoint is
     silently skipped (never bucketed under a fabricated "" key — a
     question with no real knowledge point tagged contributes nothing
     here, honestly, same discipline AHS.StatisticsRuntime.
     knowledgeAnalytics() already used for WrongBookRuntime's own kp
     field). */
  function recordAttempt(knowledgePoint, wasCorrect, subject, materialId) {
    if (!knowledgePoint) { return; }
    var kp = store.points[knowledgePoint];
    if (!kp) {
      kp = { subject: subject || "", materialId: "", attempts: [] };
      store.points[knowledgePoint] = kp;
    }
    if (subject) { kp.subject = subject; }
    /* AI-121-16: real, honest materialId hint — the most recent real
       material a question tagged with this knowledge point actually came
       from (AutoGrader's own already-real per-question materialId, never
       fabricated). Lets the AI Tutor point "重新閱讀《X》摘要" at a real
       summary.html?materialId= link instead of a dead end. Only
       overwritten by another real, non-empty materialId — never cleared
       by a later attempt that genuinely has none (e.g. a Mock question). */
    if (materialId) { kp.materialId = materialId; }
    var now = new Date();
    kp.attempts.push({ correct: !!wasCorrect, day: dayKey(now), ts: now.toISOString() });
    if (kp.attempts.length > MAX_ATTEMPTS_PER_POINT) {
      kp.attempts.splice(0, kp.attempts.length - MAX_ATTEMPTS_PER_POINT);
    }
    persist();
    pushMastery(knowledgePoint);
  }

  /* pushMastery(knowledgePoint) — Sprint AI-126B Part 2, Task 5.
     Fire-and-forget aggregate sync: public.knowledge_mastery stores
     correct_count/wrong_count/last_attempt_at per (student_profile_id,
     knowledge_point) — an aggregate, not this Runtime's own full
     per-attempt log — so this pushes the current real aggregate
     (kp.attempts, already real, never fabricated), never a second,
     divergent count. Read-then-upsert by the table's own real unique
     constraint (student_profile_id, knowledge_point) rather than caching
     a remote id locally, since this table has no per-row fields this
     Runtime would otherwise need to remember. Never blocks/changes
     recordAttempt()'s own (undefined/void) return value. */
  function pushMastery(knowledgePoint) {
    if (!AHS.SyncBridge || !AHS.SyncBridge.isConfigured()) { return; }
    var identity = AHS.SyncBridge.identity();
    if (!identity) { return; }
    var kp = store.points[knowledgePoint];
    if (!kp) { return; }
    var correctCount = kp.attempts.filter(function (a) { return a.correct; }).length;
    var wrongCount = kp.attempts.length - correctCount;
    var lastAttempt = kp.attempts[kp.attempts.length - 1];
    AHS.SyncBridge.subjectIdFor(kp.subject).then(function (subjectId) {
      var repo = AHS.RepositoryFactory.create();
      var row = {
        user_id: identity.userId,
        student_profile_id: identity.studentProfileId,
        subject_id: subjectId || null,
        knowledge_point: knowledgePoint,
        correct_count: correctCount,
        wrong_count: wrongCount,
        last_attempt_at: lastAttempt ? lastAttempt.ts : new Date().toISOString()
      };
      /* Sprint AI-150（同 WrongBookRuntime.pushRecord() 的根因修正）:
         knowledge_mastery 舊有 unique(student_profile_id, knowledge_point)
         把同一個知識點在「所有學期」的作答通通疊在同一列——這就是切換學
         年後，知識弱點還是看得到別的學年資料的真正源頭。只在目前
         Workspace 是單一、明確的學期時才加上 school_code/semester_code
         （見同一段判斷邏輯），並讓下面的查重比對也一起帶上，這樣同一個
         知識點在不同學期才會落在不同列，不會互相覆寫或疊加。複選/沒有
         Workspace 時維持既有行為（不誤植假資料）。 */
      var currentWs = (AHS.WorkspaceRuntime && typeof AHS.WorkspaceRuntime.getCurrent === "function")
        ? AHS.WorkspaceRuntime.getCurrent() : null;
      var scoped = !!(currentWs && currentWs.schoolId && currentWs.semesterIds && currentWs.semesterIds.length === 1);
      var lookupQuery = "student_profile_id=eq." + identity.studentProfileId + "&knowledge_point=eq." + encodeURIComponent(knowledgePoint);
      if (scoped) {
        row.school_code = currentWs.schoolId;
        row.semester_code = currentWs.semesterIds[0];
        lookupQuery += "&school_code=eq." + encodeURIComponent(currentWs.schoolId) +
          "&semester_code=eq." + encodeURIComponent(currentWs.semesterIds[0]);
      }
      AHS.SyncBridge.pushFireAndForget(function () {
        return repo.read("knowledge_mastery", lookupQuery).then(function (readResult) {
          if (readResult.error) { return readResult; }
          if (readResult.data && readResult.data.length) {
            return repo.update("knowledge_mastery", "id=eq." + readResult.data[0].id, row);
          }
          return repo.insert("knowledge_mastery", row);
        });
      });
    });
  }

  /* pullFromRepository() — additive, new async method; merges each real
     remote aggregate into the local per-attempt-derived store as a
     single synthetic "attempt" carrying the remote's own real
     correct_count/wrong_count split (never expands it back into a fake
     attempt-by-attempt history it doesn't have) — masteryOf()/get()
     read attempts.length and the correct/wrong split, both honestly
     preserved this way. Only backfills a point this device has never
     seen locally; never overwrites richer local attempt history that
     already exists (the local per-attempt log is always at least as
     detailed as the remote aggregate, since every local write already
     pushes here). */
  function pullFromRepository() {
    if (!AHS.SyncBridge || !AHS.SyncBridge.isConfigured()) { return Promise.resolve({ pulled: 0 }); }
    var identity = AHS.SyncBridge.identity();
    if (!identity) { return Promise.resolve({ pulled: 0 }); }
    var repo = AHS.RepositoryFactory.create();
    /* Sprint AI-150（同 WrongBookRuntime.pullFromRepository() 的根因修
       正）: 只在單一、明確學期的 Workspace 才加上 school_code/
       semester_code 篩選，把「不屬於目前這個學期」的真實雲端資料真的擋
       在下載這一步。 */
    var currentWs = (AHS.WorkspaceRuntime && typeof AHS.WorkspaceRuntime.getCurrent === "function")
      ? AHS.WorkspaceRuntime.getCurrent() : null;
    var query = "student_profile_id=eq." + identity.studentProfileId;
    if (currentWs && currentWs.schoolId && currentWs.semesterIds && currentWs.semesterIds.length === 1) {
      query += "&school_code=eq." + encodeURIComponent(currentWs.schoolId) +
        "&semester_code=eq." + encodeURIComponent(currentWs.semesterIds[0]);
    }
    return repo.read("knowledge_mastery", query).then(function (result) {
      if (result.error || !Array.isArray(result.data)) { return { pulled: 0, error: result.error }; }
      var pulled = 0;
      var subjectLookups = [];
      result.data.forEach(function (row) {
        if (store.points[row.knowledge_point]) { return; }
        var attempts = [];
        for (var i = 0; i < row.correct_count; i++) { attempts.push({ correct: true, day: dayKey(new Date(row.last_attempt_at)), ts: row.last_attempt_at }); }
        for (var j = 0; j < row.wrong_count; j++) { attempts.push({ correct: false, day: dayKey(new Date(row.last_attempt_at)), ts: row.last_attempt_at }); }
        var point = { subject: "", materialId: "", attempts: attempts };
        store.points[row.knowledge_point] = point;
        /* Sprint AI-149（同 WrongBookRuntime.pullFromRepository() 的根因
           修正）: row.subject_id 是真實的 Supabase FK，之前從未解回本地
           的 subject code，這個新建的 point 因此永遠停在空字串。查得到
           才覆寫，查不到就照舊保持誠實的空字串，不覆寫成假資料。 */
        if (row.subject_id && AHS.SyncBridge && typeof AHS.SyncBridge.subjectCodeFor === "function") {
          subjectLookups.push(AHS.SyncBridge.subjectCodeFor(row.subject_id).then(function (code) {
            if (code) { point.subject = code; }
          }));
        }
        pulled += 1;
      });
      return Promise.all(subjectLookups).then(function () {
        if (pulled) { persist(); }
        return { pulled: pulled };
      });
    }).catch(function (err) {
      return { pulled: 0, error: { message: String(err && err.message || err) } };
    });
  }

  /* recordGraded(gradedResult) — convenience wrapper over
     AHS.AutoGrader.grade()'s own real return shape: `results` carries
     EVERY question of the attempt (correct and wrong alike), each with
     its own real knowledgePoint/isCorrect/materialId — the single real
     place this Runtime should be fed from, at the exact moment grading
     happens. */
  function recordGraded(gradedResult) {
    if (!gradedResult || !Array.isArray(gradedResult.results)) { return; }
    gradedResult.results.forEach(function (r) {
      recordAttempt(r.knowledgePoint, r.isCorrect, gradedResult.subject, r.materialId);
    });
  }

  function masteryOf(attempts) {
    if (!attempts.length) { return null; }
    var correct = attempts.filter(function (a) { return a.correct; }).length;
    return Math.round((correct / attempts.length) * 100);
  }

  /* masteryByDay(knowledgePoint) — real per-calendar-day accuracy,
     oldest first; only days with at least one real attempt appear
     (never an interpolated/fabricated day). This is the real source
     for both Trend display and growth()'s day-over-day delta below. */
  function masteryByDay(knowledgePoint) {
    var kp = store.points[knowledgePoint];
    if (!kp) { return []; }
    var byDay = {};
    var order = [];
    kp.attempts.forEach(function (a) {
      if (!byDay[a.day]) { byDay[a.day] = []; order.push(a.day); }
      byDay[a.day].push(a);
    });
    return order.map(function (day) {
      var dayAttempts = byDay[day];
      return {
        day: day,
        total: dayAttempts.length,
        correct: dayAttempts.filter(function (a) { return a.correct; }).length,
        percent: masteryOf(dayAttempts)
      };
    });
  }

  /* growth(knowledgePoint) — real day-over-day Mastery delta: today's
     real accuracy minus the most recent PRIOR real-attempt day's
     accuracy. delta is null (never 0-as-a-guess) whenever either side
     has no real attempts yet — "Knowledge Evolution 可上升也可下降" is
     read literally: delta can be negative (mastery genuinely fell). */
  function growth(knowledgePoint) {
    var days = masteryByDay(knowledgePoint);
    if (!days.length) { return { today: null, previous: null, delta: null }; }
    var todayKey = dayKey(new Date());
    var todayEntry = days.filter(function (d) { return d.day === todayKey; })[0] || null;
    var priorDays = days.filter(function (d) { return d.day !== todayKey; });
    var previousEntry = priorDays.length ? priorDays[priorDays.length - 1] : null;
    if (!todayEntry || !previousEntry) {
      return { today: todayEntry ? todayEntry.percent : null, previous: previousEntry ? previousEntry.percent : null, delta: null };
    }
    return { today: todayEntry.percent, previous: previousEntry.percent, delta: todayEntry.percent - previousEntry.percent };
  }

  /* trend(knowledgePoint) — "rising"/"falling"/"stable", derived from
     comparing the average of the most recent real half of this point's
     attempt history against the earlier half (real data only; "not
     enough data" returns null rather than a guessed "stable"). This is
     the same real attempt log masteryByDay() reads, just windowed by
     attempt count instead of calendar day so a point revisited many
     times in one real day still shows a real trend. */
  function trend(knowledgePoint) {
    var kp = store.points[knowledgePoint];
    if (!kp || kp.attempts.length < 4) { return null; }
    var mid = Math.floor(kp.attempts.length / 2);
    var earlier = masteryOf(kp.attempts.slice(0, mid));
    var recent = masteryOf(kp.attempts.slice(mid));
    if (earlier === null || recent === null) { return null; }
    if (recent - earlier >= 10) { return "rising"; }
    if (earlier - recent >= 10) { return "falling"; }
    return "stable";
  }

  /* get(knowledgePoint) — one real, complete record for this point, or
     null when it has never been attempted. */
  function get(knowledgePoint) {
    var kp = store.points[knowledgePoint];
    if (!kp || !kp.attempts.length) { return null; }
    var last = kp.attempts[kp.attempts.length - 1];
    return {
      knowledgePoint: knowledgePoint,
      subject: kp.subject,
      materialId: kp.materialId || "",
      attemptCount: kp.attempts.length,
      correctCount: kp.attempts.filter(function (a) { return a.correct; }).length,
      mastery: masteryOf(kp.attempts),
      lastSeen: last.day,
      trend: trend(knowledgePoint),
      growth: growth(knowledgePoint)
    };
  }

  /* list() — every real knowledge point ever attempted, richest-first
     by attemptCount (most-practiced first; ties broken alphabetically
     for deterministic test output). */
  function list() {
    return Object.keys(store.points).map(get).filter(Boolean).sort(function (a, b) {
      return (b.attemptCount - a.attemptCount) || a.knowledgePoint.localeCompare(b.knowledgePoint);
    });
  }

  /* weakPoints(threshold) — real points at/under threshold Mastery
     (default 60), lowest-mastery-first — this Runtime's own honest
     input for "below-threshold" AI Tutor summary reuse (AI-121-16). */
  function weakPoints(threshold) {
    var limit = typeof threshold === "number" ? threshold : 60;
    return list().filter(function (p) { return p.mastery <= limit; })
      .sort(function (a, b) { return a.mastery - b.mastery; });
  }

  /* topGrowthToday(limit) — real knowledge point(s) with the largest
     positive real delta today, for the Tutor's "今日最大進步" highlight
     (AI-121-12). Points with no real delta today (null) are excluded —
     never a fabricated "biggest growth" when nothing genuinely grew. */
  function topGrowthToday(limit) {
    var withGrowth = list().filter(function (p) { return p.growth && typeof p.growth.delta === "number" && p.growth.delta > 0; })
      .sort(function (a, b) { return b.growth.delta - a.growth.delta; });
    return typeof limit === "number" ? withGrowth.slice(0, limit) : withGrowth;
  }

  /* reset() — test helper; mirrors every other Runtime's own reset(). */
  function reset() {
    store = { points: {} };
    persist();
  }

  return {
    recordAttempt: recordAttempt,
    recordGraded: recordGraded,
    get: get,
    list: list,
    masteryByDay: masteryByDay,
    growth: growth,
    trend: trend,
    weakPoints: weakPoints,
    topGrowthToday: topGrowthToday,
    reset: reset,
    pullFromRepository: pullFromRepository
  };
})();
