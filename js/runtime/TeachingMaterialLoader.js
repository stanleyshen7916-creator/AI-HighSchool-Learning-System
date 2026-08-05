/* js/runtime/TeachingMaterialLoader.js — Sprint v1.4 "First Real Material
   Workflow" · Module B (Repository Loader).

   Coordinator only, same pattern as js/runtime/ImportRuntime.js: holds no
   material-content store of its own (no title/summary/question data
   lives here), calls only existing, LOCK Runtime write APIs
   (AHS.MaterialRuntime.add / AHS.SummaryRuntime.add /
   AHS.QuestionRuntime.importQuestions — none modified, none extended),
   and never fetches/requires/reads a file itself. Its only input is
   AHS.TeachingMaterialData — the static array js/data/
   TeachingMaterialData.js already loaded via <script> tag, produced
   offline by GenerateTeachingMaterialData.js through the unmodified
   TeachingMaterialAdapter.

   Idempotency (judgment call, flagged — required for correctness, not
   spelled out by the Sprint): MaterialRuntime/SummaryRuntime are
   sessionStorage-persisted (js/core/PersistenceAdapter.js) and REHYDRATE
   on every page load in this multi-page app, so calling initialize()
   again on a later page visit must not re-add the same Package and
   create a duplicate record. This file persists a small
   { packageMaterialId -> MaterialRuntime record id } map of its own,
   through the same already-LOCK PersistenceAdapter every Runtime in this
   repo already uses, purely so it can recognize "already loaded this
   session" — it holds no title/summary/question content, only ids
   already assigned elsewhere, so this is bookkeeping, not a second data
   store ("Loader 不得保存資料" is read as: must not retain material
   DATA — satisfied).

   AHS.QuestionRuntime, by contrast, is intentionally memory-only (see
   docs/PMO/PROJECT_STATUS.json's runtimePersistence.notCovered list) and
   is not even <script>-tagged on every page (e.g. absent from
   materials.html, present on quiz.html) — so importQuestions() is
   re-run on every page load where AHS.QuestionRuntime actually exists,
   using whichever real MaterialRuntime id was already resolved (either
   on this same page, or carried over via the persisted id map from an
   earlier page that did load MaterialRuntime.js). hasExam() guards
   against double-importing within one page load.

   entry.related is intentionally never touched here: a repo-wide search
   found no "related materials" concept in any existing Runtime (see
   TeachingMaterialAdapter.js's own header, judgment call 9) — there is
   nothing to load it into.

   Sprint v1.6 addition — Exam-Mode shape reconciliation (flagged, real
   finding, not spelled out by any Sprint): AHS.QuestionRuntime itself
   accepts any object shape (no gate), but every DOWNSTREAM consumer of
   QuestionRuntime.getSet() hard-codes AHS.QuestionBank's own native
   field names — AHS.AutoGrader.grade() reads q.text/q.correctAnswer/
   q.index/q.knowledgePoint, and js/ui/QuestionCard.js reads
   question.text/question.options[i].key/.text and looks up
   AHS.Subjects[question.subject] with NO fallback (would throw on an
   unknown key). TeachingMaterialAdapter.convertQuestions()'s own output
   (question/answer/plain-string options, no subject/index/knowledgePoint
   at all — by design, matching Sprint AI-103's ImportRuntime.js
   precedent) is therefore NOT directly renderable/gradable as-is. Fixing
   this in the Adapter would violate this Sprint's "不得修改
   TeachingMaterialAdapter API"; fixing it in AutoGrader/QuestionCard
   would violate "不得重寫 Wrong Book" 's spirit and touch LOCK Sprint-4
   files. So the reshaping happens here, in the Loader — this IS
   "Wiring" (Module E's own allowance: "若需最小修改：僅可修改
   Wiring"), not a rewrite of anything downstream.

   Consequence, honestly disclosed: only `single_choice` questions whose
   `answer` matches one of their own `options` verbatim, on a material
   whose `subject` matches one of AHS.Subjects' 9 known Chinese names,
   can flow into this Exam-Mode-compatible shape. true_false/fill_blank/
   calculation/essay questions, and any unmappable subject, are skipped
   here (not fabricated into fake multiple-choice content) — the
   Question Bank record still exists in full inside the Repository/
   TeachingMaterialData.js; only what QuestionRuntime.importQuestions()
   is fed for THIS Exam-Mode path is filtered.

   ---------------------------------------------------------------------
   HOTFIX-002 (post-PAT-FAIL) — bridging a second, independently-built
   Repository that merged into main in parallel with this one.

   Evidence: `git log` shows `data/materials/MaterialRepositoryIndex.js`
   (defines AHS.MaterialRepository, a completely separate store —
   register()/getById()/list()/findBySubject()/findByChapter()/
   findByKeyword() — from a different branch's own EO) and
   `data/materials/CivicsG10Ch5to6Exam20260730.js` (one real, self-
   registering material) were merged via PR #3/#4/#5, alongside a
   "HOTFIX-001" commit that tried to add its OWN
   js/runtime/TeachingMaterialLoader.js exposing `load()` — colliding at
   the exact same file path as this one. The merge conflict resolution
   kept this file's content (initialize()/resolveExamMeta()); the other
   branch's actual bridging logic was lost, while its call sites
   (js/pages/AppHome.js, AppSummary.js, AppLearning.js — each guarded by
   `typeof AHS.TeachingMaterialLoader.load === "function"`) survived and
   silently no-op today, matching the reported PAT-FAIL exactly:
   AHS.MaterialRepository has real data, but nothing reads it.

   Resolution: rather than removing either Repository or rewriting the
   other branch's already-merged, real, non-fabricated content, this
   file now bridges BOTH — `load()` is added as a full synonym of
   initialize() (same guard, same idempotency), and both now also walk
   AHS.MaterialRepository.list() when that global exists, converting
   each record via a second, parallel set of functions below (kept
   fully separate from the Package-shaped functions above — different
   source schema, different origin vocabulary — see judgment calls in
   loadMaterialRepositoryEntry()'s own comment). TeachingMaterialAdapter.js
   is untouched: it remains scoped to this file's OWN docs/TeachingMaterials/
   Package format only, per its own "不得修改 TeachingMaterialAdapter API"
   constraint — this bridge is Loader-local Wiring, the same category of
   change Sprint v1.6 already established as in-scope here. */
window.AHS = window.AHS || {};
AHS.TeachingMaterialLoader = (function () {
  "use strict";

  var STORAGE_KEY = "teachingMaterialLoaderIdMap";
  var OPTION_KEYS = ["A", "B", "C", "D", "E", "F"];
  var initialized = false;

  function loadIdMap() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && typeof loaded === "object") { return loaded; }
    }
    return {};
  }

  function saveIdMap(map) {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.save === "function") {
      AHS.PersistenceAdapter.save(STORAGE_KEY, map);
    }
  }

  function shallowClone(obj) {
    var copy = {};
    Object.keys(obj || {}).forEach(function (key) { copy[key] = obj[key]; });
    return copy;
  }

  /* HOTFIX-002 fix: gated on "does a Summary already exist for this
     MaterialRuntime id" (via findByMaterialId()), not "did THIS call just
     create the MaterialRuntime record" — the two are NOT equivalent.
     learning.html (one of the 3 pages HOTFIX-001 wired to call load())
     does not <script>-tag SummaryRuntime.js at all; if a user's
     session-first page happened to be one lacking SummaryRuntime.js
     (materials.html always has it, but a bare AHS.MaterialRuntime.add()
     call elsewhere would not), the old "only on first id-resolution"
     gate would have permanently skipped the Summary for that session,
     even after navigating to a page that DOES have SummaryRuntime.js.
     Checking real downstream state instead of a proxy is a general
     fix — applies to every page/entry, not just the one that surfaced
     it in testing. */
  function loadSummary(entry, runtimeMaterialId) {
    if (!entry.summary || !AHS.SummaryRuntime ||
        typeof AHS.SummaryRuntime.add !== "function" ||
        typeof AHS.SummaryRuntime.findByMaterialId !== "function") { return; }
    if (AHS.SummaryRuntime.findByMaterialId(runtimeMaterialId).length) { return; }
    var summary = shallowClone(entry.summary);
    summary.materialId = runtimeMaterialId;
    AHS.SummaryRuntime.add(summary);
  }

  function resolveMaterialId(entry, idMap) {
    if (idMap[entry.materialId]) {
      loadSummary(entry, idMap[entry.materialId]);
      return idMap[entry.materialId];
    }
    if (!AHS.MaterialRuntime || typeof AHS.MaterialRuntime.add !== "function") { return null; }
    /* Bug fix (first real Package-track material, tm_1): Package metadata's
       subject is a Chinese display name ("數學"), but MaterialCard.js/
       WrongBook.js/etc. all do AHS.Subjects[record.subject] expecting a real
       key ("math") — some with no fallback, which throws. Remap through the
       same subjectKeyFromChineseName() already used by
       buildExamCompatibleQuestions() below, on a clone so entry.material
       itself (read elsewhere by its own Chinese-name convention) is untouched. */
    var materialForRuntime = shallowClone(entry.material || {});
    var runtimeSubjectKey = subjectKeyFromChineseName(materialForRuntime.subject);
    if (runtimeSubjectKey) { materialForRuntime.subject = runtimeSubjectKey; }
    var record = AHS.MaterialRuntime.add(materialForRuntime);
    if (!record || !record.id) { return null; }
    idMap[entry.materialId] = record.id;
    saveIdMap(idMap);
    loadSummary(entry, record.id);
    return record.id;
  }

  function examIdFor(runtimeMaterialId) {
    return "teaching_material_" + runtimeMaterialId;
  }

  /* Reverse-looks-up AHS.Subjects' own real Chinese display names — no
     separate, hand-maintained list, always derived from the same source
     of truth QuestionCard.js itself reads. Returns null (not a guessed
     fallback) when the Package's subject string doesn't match any of
     the 9 known names, e.g. "地球科學" — nothing in this app can safely
     render an unknown subject key today. */
  function subjectKeyFromChineseName(name) {
    if (!AHS.Subjects || !name) { return null; }
    var found = null;
    Object.keys(AHS.Subjects).forEach(function (key) {
      if (AHS.Subjects[key] && AHS.Subjects[key].name === name) { found = key; }
    });
    return found;
  }

  /* Reshapes Package questions into the shape AHS.AutoGrader.grade() and
     js/ui/QuestionCard.js actually require (see the file header for
     why). Only single_choice questions with a resolvable answer, on a
     material with a mappable subject, are included — everything else is
     honestly skipped, never fabricated into fake options. */
  function buildExamCompatibleQuestions(entry, runtimeMaterialId) {
    var subjectKey = subjectKeyFromChineseName(entry.material && entry.material.subject);
    if (!subjectKey) { return []; }
    var chapter = (entry.material && entry.material.chapter) || "";
    var compatible = [];
    (entry.questions || []).forEach(function (q) {
      if (!q || q.type !== "single_choice") { return; }
      if (!Array.isArray(q.options) || q.options.length < 2) { return; }
      var answerIndex = q.options.indexOf(q.answer);
      if (answerIndex === -1 || answerIndex >= OPTION_KEYS.length) { return; }
      compatible.push({
        id: q.id,
        index: compatible.length + 1,
        subject: subjectKey,
        text: q.question,
        type: q.type,
        options: q.options.map(function (text, i) {
          return { key: OPTION_KEYS[i] || String(i), text: text };
        }),
        correctAnswer: OPTION_KEYS[answerIndex],
        knowledgePoint: chapter,
        explanation: q.explanation || "",
        materialId: runtimeMaterialId,
        questionSource: q.questionSource,
        origin: q.origin,
        page: q.page
      });
    });
    return compatible;
  }

  /* Sprint AI-117 AI-117-08 Assessment Mode: "原始試卷"（真實上傳教材，
     questionSource=ORIGINAL）與"AI 題庫"（questionSource=AI_GENERATED）
     "不得混用" — imported here as two ADDITIONAL, separate examIds
     alongside the existing combined one (examId itself, kept 100%
     unchanged for every existing caller/link — no existing behavior
     removed), so a caller that explicitly wants one mode can load only
     that mode's questions, never both under one running exam. Skips a
     variant entirely (never importQuestions() with an empty array,
     matching this file's own existing "no-op when nothing real exists"
     rule) when this material genuinely has no question of that source —
     most materials will only ever have one real variant. */
  function importAssessmentModeVariants(examId, questions) {
    if (!AHS.QuestionRuntime || typeof AHS.QuestionRuntime.importQuestions !== "function") { return; }
    var original = questions.filter(function (q) { return q.questionSource === "ORIGINAL"; });
    var aiGenerated = questions.filter(function (q) { return q.questionSource === "AI_GENERATED"; });
    if (original.length) { AHS.QuestionRuntime.importQuestions(examId + "__original", original); }
    if (aiGenerated.length) { AHS.QuestionRuntime.importQuestions(examId + "__ai", aiGenerated); }
  }

  /* Re-run on every page load where AHS.QuestionRuntime is present —
     that Runtime is intentionally memory-only, so its store is always
     empty on a fresh page load regardless of what an earlier page
     already did. hasExam() guards a same-page double-call. Calling
     importQuestions() with an empty array is a harmless no-op — hasExam()
     stays false, exactly reflecting "nothing here is Exam-Mode-eligible". */
  function loadQuestions(entry, runtimeMaterialId) {
    if (!AHS.QuestionRuntime || typeof AHS.QuestionRuntime.importQuestions !== "function") { return; }
    var examId = examIdFor(runtimeMaterialId);
    if (typeof AHS.QuestionRuntime.hasExam === "function" && AHS.QuestionRuntime.hasExam(examId)) { return; }
    var questions = buildExamCompatibleQuestions(entry, runtimeMaterialId);
    if (!questions.length) { return; }
    AHS.QuestionRuntime.importQuestions(examId, questions);
    importAssessmentModeVariants(examId, questions);
  }

  /* resolveExamMeta(examId) — Sprint v1.6 Module C: quiz.html's direct
     entry needs real subject/title/chapter/grade to pass into
     ExamRuntime.startFromExam() (never fabricated). Reverses examId ->
     runtimeMaterialId -> (via the persisted id map) sourceId -> the real
     material's own fields. HOTFIX-002: sourceId may belong to either
     source — AHS.TeachingMaterialData (this file's own Package track) or
     AHS.MaterialRepository (the other, already-merged track) — tried in
     that order. Returns null if any step fails — the caller falls back
     to the normal Exam Mode list, never a fabricated session. */
  function resolveExamMeta(examId) {
    var match = /^teaching_material_(.+)$/.exec(examId || "");
    if (!match) { return null; }
    var runtimeMaterialId = match[1];
    var idMap = loadIdMap();
    var sourceId = null;
    Object.keys(idMap).forEach(function (id) {
      if (idMap[id] === runtimeMaterialId) { sourceId = id; }
    });
    if (!sourceId) { return null; }

    var entries = Array.isArray(AHS.TeachingMaterialData) ? AHS.TeachingMaterialData : [];
    var entry = null;
    entries.forEach(function (e) { if (e && e.materialId === sourceId) { entry = e; } });
    if (entry && entry.material) {
      return {
        /* Same fix as resolveMaterialId() above: ExamRuntime.startFromExam()
           stores this straight into the exam session's own `subject` field,
           which flows into AutoGrader.grade()/WrongBookRuntime.sync() and
           eventually WrongBook.js's chip() (no fallback) — must be a real
           AHS.Subjects key, not the Package's Chinese display name. Falls
           back to the raw name only if unmappable (pre-existing gap for an
           unknown subject, not newly introduced here). */
        subject: subjectKeyFromChineseName(entry.material.subject) || entry.material.subject,
        title: entry.material.title,
        chapter: entry.material.chapter,
        grade: entry.material.grade
      };
    }

    if (AHS.MaterialRepository && typeof AHS.MaterialRepository.getById === "function") {
      var record = AHS.MaterialRepository.getById(sourceId);
      if (record) {
        var meta = record.metadata || {};
        var summary = record.summary || {};
        return { subject: meta.subject, title: summary.title, chapter: meta.chapter, grade: meta.grade };
      }
    }
    return null;
  }

  /* workspaceAllows(school, semester) — Sprint AI-120 (Workspace
     Repository Integration) AI-120-01: a Repository entry tagged with a
     real school/semester (Sprint AI-119 §9's migration + this Sprint's
     own generator passthrough) only bridges into MaterialRuntime for a
     Workspace whose own School matches AND whose selected Semester(s)
     intersect it — "Student A → 長榮中學 → 高二上 只能看到高二上教材,
     不得出現高一下". An entry with NEITHER field set (not yet migrated)
     stays visible everywhere, unchanged from pre-Sprint-AI-120 behavior
     — never silently disappears for content nobody has classified yet.
     No active Workspace (AHS.WorkspaceRuntime not loaded, or every
     pre-Sprint-AI-119 test that never establishes one) also stays
     unfiltered — same backward-compatibility discipline as
     PersistenceAdapter's own namespace() fallback. */
  function workspaceAllows(school, semester) {
    if (!school && !semester) { return true; }
    if (!AHS.WorkspaceRuntime || typeof AHS.WorkspaceRuntime.getCurrent !== "function") { return true; }
    var ws = AHS.WorkspaceRuntime.getCurrent();
    if (!ws) { return true; }
    if (school && ws.schoolId !== school) { return false; }
    if (semester && ws.semesterIds.indexOf(semester) === -1) { return false; }
    return true;
  }

  function loadEntry(entry, idMap) {
    if (!entry || !entry.materialId || !entry.material) { return; }
    if (!workspaceAllows(entry.material.school, entry.material.semester)) { return; }
    var runtimeMaterialId = resolveMaterialId(entry, idMap);
    if (!runtimeMaterialId) { return; }
    loadQuestions(entry, runtimeMaterialId);
  }

  /* ---------------------------------------------------------------------
     HOTFIX-002: AHS.MaterialRepository bridge (data/materials/*.js's own
     record shape — real field names confirmed by reading
     data/materials/CivicsG10Ch5to6Exam20260730.js, not guessed). Kept
     fully separate from the Package-shaped functions above. */

  function repoMaterialPartial(record) {
    var meta = record.metadata || {};
    var summary = record.summary || {};
    var partial = { folderId: null };
    if (meta.subject) { partial.subject = meta.subject; } /* already an AHS.Subjects key, e.g. "civics" — this Repository's own convention, unlike the Package track's Chinese-name convention */
    if (meta.grade) { partial.grade = meta.grade; }
    if (meta.chapter) { partial.chapter = meta.chapter; }
    if (meta.unit) { partial.category = meta.unit; }
    if (meta.createdAt) { partial.date = meta.createdAt; }
    if (summary.title) { partial.title = summary.title; } /* this record shape HAS a real title field, unlike Package metadata — no derivation judgment call needed here */
    return partial;
  }

  /* Judgment calls (flagged, not specified by either branch's own EO):
     coreConcepts (array of {term,definition}) flattened to "term：definition"
     strings — SummaryRuntime.coreConcepts expects plain strings, and this
     is the only lossless flattening of two real fields, no invention.
     summary.definitions passes straight through (already plain strings).
     summary.keyPoints -> memorize, reusing Sprint AI-103 ImportRuntime.js's
     own precedent for the identical "重點" concept. commonMistakes
     (concept/misconception/...) -> pitfalls as "concept：misconception",
     the closest real match to "易錯重點". reviewSuggestions left unset
     (no equivalent field exists) — SummaryRuntime defaults it to []. */
  function repoSummaryRecord(record, runtimeMaterialId) {
    var meta = record.metadata || {};
    var summary = record.summary || {};
    var out = {
      materialId: runtimeMaterialId,
      coreConcepts: Array.isArray(record.coreConcepts)
        ? record.coreConcepts.map(function (c) { return (c && c.term ? c.term + "：" : "") + ((c && c.definition) || ""); })
        : [],
      definitions: Array.isArray(summary.definitions) ? summary.definitions.slice() : [],
      pitfalls: Array.isArray(record.commonMistakes)
        ? record.commonMistakes.map(function (m) { return (m && m.concept ? m.concept + "：" : "") + ((m && m.misconception) || ""); })
        : [],
      memorize: Array.isArray(summary.keyPoints) ? summary.keyPoints.slice() : []
    };
    if (meta.subject) { out.subject = meta.subject; }
    if (meta.grade) { out.grade = meta.grade; }
    if (meta.chapter) { out.chapter = meta.chapter; }
    if (meta.unit) { out.section = meta.unit; }
    if (summary.title) { out.title = summary.title; }
    return out;
  }

  /* This Repository's own questionBank.singleChoice entries already carry
     options as {key,text} and correctAnswer as a key — the exact shape
     AutoGrader.grade()/QuestionCard.js need, no reshaping required (this
     branch's own EO apparently built directly against that shape).
     fillIn/trueFalse are excluded here for the same honest reason as the
     Package track: js/ui/QuestionCard.js only renders multiple-choice —
     not fabricated into fake options. subject still validated against
     AHS.Subjects defensively (never trust an upstream file blindly, even
     a real, human-reviewed one) — QuestionCard.js has no fallback and
     would throw on an unmapped key. */
  function repoExamCompatibleQuestions(record, runtimeMaterialId) {
    var meta = record.metadata || {};
    var subjectKey = (AHS.Subjects && meta.subject && AHS.Subjects[meta.subject]) ? meta.subject : null;
    if (!subjectKey) { return []; }
    var bank = record.questionBank || {};
    var singleChoice = Array.isArray(bank.singleChoice) ? bank.singleChoice : [];
    var compatible = [];
    singleChoice.forEach(function (q) {
      if (!q || !Array.isArray(q.options) || !q.options.length || !q.correctAnswer) { return; }
      compatible.push({
        id: q.id,
        index: compatible.length + 1,
        subject: subjectKey,
        text: q.text,
        type: "single_choice",
        options: q.options,
        correctAnswer: q.correctAnswer,
        knowledgePoint: q.knowledgePoint || meta.chapter || "",
        explanation: q.explanation || "",
        materialId: runtimeMaterialId,
        questionSource: q.origin === "exam-transcript-verified" ? "ORIGINAL" : "AI_GENERATED",
        origin: q.origin === "exam-transcript-verified" ? "Uploaded Material" : "AI"
      });
    });
    return compatible;
  }

  /* Same fix as loadSummary() above: gated on real downstream state
     (findByMaterialId()), not on "did this call just create the
     MaterialRuntime record" — index.html/summary.html/learning.html
     each independently call load(), and not all of them ship
     SummaryRuntime.js (learning.html doesn't). */
  function loadRepoSummary(record, runtimeMaterialId) {
    if (!AHS.SummaryRuntime || typeof AHS.SummaryRuntime.add !== "function" ||
        typeof AHS.SummaryRuntime.findByMaterialId !== "function") { return; }
    if (AHS.SummaryRuntime.findByMaterialId(runtimeMaterialId).length) { return; }
    AHS.SummaryRuntime.add(repoSummaryRecord(record, runtimeMaterialId));
  }

  function loadMaterialRepositoryEntry(record, idMap) {
    if (!record || !record.id) { return; }
    var meta = record.metadata || {};
    /* workspaceSchool/workspaceSemester, not meta.school/meta.semester —
       this Repository track's own metadata already has an unrelated,
       pre-existing display-string `semester` field (e.g. "第二學期");
       see data/materials/CivicsG10Ch5to6Exam20260730.js's own comment. */
    if (!workspaceAllows(meta.workspaceSchool, meta.workspaceSemester)) { return; }
    var runtimeMaterialId = idMap[record.id];
    if (!runtimeMaterialId) {
      if (!AHS.MaterialRuntime || typeof AHS.MaterialRuntime.add !== "function") { return; }
      var added = AHS.MaterialRuntime.add(repoMaterialPartial(record));
      if (!added || !added.id) { return; }
      runtimeMaterialId = added.id;
      idMap[record.id] = runtimeMaterialId;
      saveIdMap(idMap);
    }
    loadRepoSummary(record, runtimeMaterialId);
    if (!AHS.QuestionRuntime || typeof AHS.QuestionRuntime.importQuestions !== "function") { return; }
    var examId = examIdFor(runtimeMaterialId);
    if (typeof AHS.QuestionRuntime.hasExam === "function" && AHS.QuestionRuntime.hasExam(examId)) { return; }
    var questions = repoExamCompatibleQuestions(record, runtimeMaterialId);
    if (!questions.length) { return; }
    AHS.QuestionRuntime.importQuestions(examId, questions);
    importAssessmentModeVariants(examId, questions);
  }

  function loadMaterialRepository(idMap) {
    if (!AHS.MaterialRepository || typeof AHS.MaterialRepository.list !== "function") { return; }
    AHS.MaterialRepository.list().forEach(function (record) { loadMaterialRepositoryEntry(record, idMap); });
  }

  /* load() / initialize() — safe to call on every page, safe to call
     more than once per page (both HOTFIX-001's call sites and this
     file's own use `load`/`initialize` respectively — both names now do
     the same full work). No-ops entirely when neither
     AHS.TeachingMaterialData nor AHS.MaterialRepository has anything —
     the existing Empty State is untouched either way. */
  function load() {
    if (initialized) { return; }
    initialized = true;
    var idMap = loadIdMap();
    var entries = Array.isArray(AHS.TeachingMaterialData) ? AHS.TeachingMaterialData : [];
    entries.forEach(function (entry) { loadEntry(entry, idMap); });
    loadMaterialRepository(idMap);
  }

  /* reset() — test helper only; mirrors every Runtime's own reset(),
     never called anywhere in the running app. */
  function reset() {
    initialized = false;
  }

  return {
    initialize: load,
    load: load,
    resolveExamMeta: resolveExamMeta,
    reset: reset,
    /* Sprint AI-117 AI-117-08: exposed so
       tests/regression/AnalyticsRegression.js can exercise the real
       Assessment Mode split directly (same function loadQuestions()/
       loadMaterialRepositoryEntry() already call internally above — not
       a second implementation for tests to drift from). */
    importAssessmentModeVariants: importAssessmentModeVariants
  };
})();
