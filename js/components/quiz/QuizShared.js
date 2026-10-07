/* js/components/quiz/QuizShared.js — 測驗中心 (quiz.html), shared helpers: subject / difficulty labels, the Repository exam catalog,
   real-question lookups and the richer-explanation wrapper.

   Split out of js/components/QuizCenter.js on 2026-10-01 (that file had
   grown past 2,600 lines). Pure move: the functions below are unchanged;
   they now share helpers through AHS.QuizParts instead of one closure.
   Load order (quiz.html): QuizShared → QuizListView → QuizExamView →
   QuizPracticeView → QuizCenter. */
window.AHS = window.AHS || {};
AHS.QuizParts = AHS.QuizParts || {};

(function (P) {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */


  /* richExplanation(q, original, cls) — 2026-10-01 數學詳解補強: the richer
     worked solution (steps + figures) from AHS.ExplanationSupplement wrapped
     in a div of class cls, or null when this question has none. */
  function richExplanation(q, original, cls) {
    var sup = (window.AHS && AHS.ExplanationSupplement) ? AHS.ExplanationSupplement.render(q, original) : null;
    return sup ? el("div", { class: cls }, [sup]) : null;
  }

  var DIFF_TONE = { "易": "#22b573", "易~中等": "#22b573", "中等": "#f59e0b", "難": "#ef4444" };

  /* difficultyBadge(label) — Sprint AI-137: a small colored pill (reuses
     the existing `.chip` visual treatment, same DIFF_TONE palette
     quizRow() above already uses for Exam Mode) shown on each practice
     question row so 易/中等/難 is identifiable at a glance without
     opening the question. null (renders nothing) when the record
     genuinely carries no difficulty text — never fabricates one. */
  function difficultyBadge(label) {
    if (!label) { return null; }
    var tone = DIFF_TONE[label] || "#6b7280";
    return el("span", {
      class: "chip quiz-practice__row-diff", style: "color:" + tone + ";background-color:" + tone + "1a"
    }, [el("span", { text: label })]);
  }

  /* 平時練習（原正式測驗）每次固定抽題數 — 與 AHS.QuestionBankRuntime.
     drawCycle() 搭配，一份題庫題數不足 10 題時誠實只給實際題數，不湊數。 */
  var FORMAL_EXAM_QUESTION_COUNT = 10;

  function chip(subjectKey) {
    var subj = AHS.Subjects[subjectKey];
    return el("span", {
      class: "chip",
      style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
    }, [el("span", { text: subj.name })]);
  }

  /* ---- HOTFIX-005 AI-501: Repository → Quiz Center auto-sync ------------
     Repository-sourced materials (data/materials/ track, bridged into
     AHS.QuestionRuntime by js/runtime/TeachingMaterialLoader.js since
     HOTFIX-002) previously only became reachable in Quiz Center via a
     direct link carrying materialId/examId (Material Card's「開始練習」,
     Summary Detail's「開始 AI 練習」). This surfaces the SAME already-
     imported, already-real QuestionRuntime data directly in Quiz
     Center's own default list (正式測驗) and practice list (練習模式) —
     no new Runtime, no Mock Data, no modification to MaterialRuntime/
     SummaryRuntime/QuestionRuntime's own APIs or Repository Schema.
     Read-only: mirrors the established resolver pattern
     (js/ui/MaterialDetailRepositorySource.js, HOTFIX-003/004) — reads the
     same persisted teachingMaterialLoaderIdMap TeachingMaterialLoader.js
     already writes, never writes to it itself. */
  function subjectKeyFromChineseName(name) {
    if (!AHS.Subjects || !name) { return null; }
    var found = null;
    Object.keys(AHS.Subjects).forEach(function (key) {
      if (AHS.Subjects[key] && AHS.Subjects[key].name === name) { found = key; }
    });
    return found;
  }

  /* Real, computed aggregate (most frequent value among this material's
     own questions) — never a fabricated/default difficulty label; "" when
     the source questions carry none (e.g. the Package track's own
     questions.json schema, which HOTFIX-004 already found has no
     difficulty field at all). */
  function modeDifficulty(questions) {
    var counts = {}, best = "", bestCount = 0;
    (questions || []).forEach(function (q) {
      if (!q || !q.difficulty) { return; }
      counts[q.difficulty] = (counts[q.difficulty] || 0) + 1;
      if (counts[q.difficulty] > bestCount) { best = q.difficulty; bestCount = counts[q.difficulty]; }
    });
    return best;
  }

  /* ---- Difficulty gating — Sprint AI-124 AI-124-09 -----------------------
     Prior to this Sprint, 巧巧老師出題引導's Easy/Medium/Hard picker
     (js/components/QuestionGuide.js) was a pure UI gate: it required a
     choice before enabling 開始練習, but the chosen value was never
     passed on to actually filter which questions showed up in the
     Practice list — "Difficulty 僅 UI" is read literally here. This
     section is the real fix: a single, shared difficulty rank + filter,
     applied to BOTH content sources Practice Mode already reads
     (legacy AHS.LearningQuestionRuntime records via their own real
     `difficulty` field, and real AHS.QuestionRuntime questions via the
     same read-only AHS.MaterialDetailRepositorySource resolution
     already used for display, extracted here instead of duplicated). */
  var DIFFICULTY_RANK = { easy: 0, medium: 1, hard: 2 };

  /* difficultyRank(label) — real Chinese labels ("易"/"中等"/"難", and
     combined labels like "易~中等" some Mock/Package records carry, per
     HOTFIX-004's own finding) mapped to a 0/1/2 rank via substring match
     (same "contains" discipline itemMatchesFilters() above already uses
     for this exact reason). -1 (never guessed as a rank) when the
     record genuinely carries no difficulty text at all. */
  function difficultyRank(label) {
    if (!label) { return -1; }
    if (label.indexOf("難") !== -1) { return 2; }
    if (label.indexOf("中等") !== -1) { return 1; }
    if (label.indexOf("易") !== -1) { return 0; }
    return -1;
  }

  /* resolveRealQuestionDifficulty(q) — the same read-only
     AHS.MaterialDetailRepositorySource lookup buildRealPracticeQuestionView's
     own 難度 meta line already used inline; extracted here so the
     Practice list's difficulty FILTER and the Practice View's difficulty
     DISPLAY can never drift into two different answers for the same
     question. Never modifies AHS.QuestionRuntime's own stored shape —
     purely an additional, read-only cross-reference. */
  function resolveRealQuestionDifficulty(q) {
    if (q.difficulty) { return q.difficulty; }
    if (!q.materialId || !AHS.MaterialDetailRepositorySource ||
        typeof AHS.MaterialDetailRepositorySource.resolve !== "function") { return ""; }
    var repo = AHS.MaterialDetailRepositorySource.resolve(q.materialId);
    var match = (repo && repo.quiz && Array.isArray(repo.quiz.questions))
      ? repo.quiz.questions.filter(function (rq) { return rq.id === q.id; })[0] : null;
    return match ? (match.difficulty || "") : "";
  }

  /* filterByDifficulty(list, chosenDifficulty, rankOf) — chosenDifficulty:
     "easy"|"medium"|"hard"|falsy (falsy = no filter, returns list
     unchanged — the pre-Sprint AI-124 behavior, still exactly what
     happens when Practice Mode is entered without going through
     巧巧老師出題引導's picker at all). When real matches at the chosen
     rank exist, returns exactly those (never padded with anything
     else). When the chosen rank has genuinely NO real matches ("資料
     不足"), "不得偽造" is honored by falling back to the highest rank
     that DOES have real data — never inventing a fabricated hard
     question to fill an Easy request that has none, and never silently
     showing everything as if difficulty were ignored. Returns the
     original list unfiltered only when NOT ONE item in it carries any
     real difficulty data at all (an honest "nothing to filter by",
     distinct from "the chosen tier is genuinely empty"). */
  function filterByDifficulty(list, chosenDifficulty, rankOf) {
    if (!chosenDifficulty || !list.length) { return list; }
    var targetRank = DIFFICULTY_RANK[chosenDifficulty];
    if (targetRank === undefined) { return list; }
    var atTarget = list.filter(function (it) { return rankOf(it) === targetRank; });
    if (atTarget.length) { return atTarget; }
    var maxRank = -1;
    list.forEach(function (it) { var r = rankOf(it); if (r > maxRank) { maxRank = r; } });
    if (maxRank === -1) { return list; }
    return list.filter(function (it) { return rankOf(it) === maxRank; });
  }

  function repositoryExamCatalog() {
    var idMap = (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function")
      ? (AHS.PersistenceAdapter.load("teachingMaterialLoaderIdMap") || {}) : {};
    var entries = [];

    /* Sprint AI-109 AI-602 (real per-material stats), moved into
       AHS.StatisticsRuntime.examStats() by Sprint AI-114 AI-905 (Single
       Source — no page may keep its own copy of this calculation). */
    function realStatsFor(examId) {
      return (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.examStats === "function")
        ? AHS.StatisticsRuntime.examStats(examId)
        : { progress: 0, accuracy: 0, best: 0, done: false, attempts: 0 };
    }

    function addEntry(sourceId, meta, questionsForDifficulty) {
      var runtimeId = idMap[sourceId];
      if (!runtimeId) { return; }
      var examId = "teaching_material_" + runtimeId;
      if (!AHS.QuestionRuntime || typeof AHS.QuestionRuntime.hasExam !== "function" ||
          !AHS.QuestionRuntime.hasExam(examId)) { return; }
      var set = (typeof AHS.QuestionRuntime.getSet === "function") ? AHS.QuestionRuntime.getSet(examId) : [];
      var stats = realStatsFor(examId);
      entries.push({
        _repoExamId: examId,
        subject: meta.subjectKey || "",
        title: meta.title || "教材",
        grade: meta.grade || "",
        chapter: meta.chapter || "",
        difficulty: modeDifficulty(questionsForDifficulty),
        type: "單選題",
        /* 平時練習每次固定隨機抽 FORMAL_EXAM_QUESTION_COUNT 題（題庫題數
           不足時誠實顯示實際題數，不湊數）— 卡片上的「共 N 題」對應的是
           這次實際會考的題數，不是題庫總題數。 */
        count: Math.min(FORMAL_EXAM_QUESTION_COUNT, set.length),
        progress: stats.progress,
        accuracy: stats.accuracy,
        best: stats.best,
        done: stats.done
      });
    }

    (Array.isArray(AHS.TeachingMaterialData) ? AHS.TeachingMaterialData : []).forEach(function (entry) {
      if (!entry || !entry.materialId || !entry.material) { return; }
      addEntry(entry.materialId, {
        subjectKey: subjectKeyFromChineseName(entry.material.subject) || entry.material.subject,
        title: entry.material.title, chapter: entry.material.chapter, grade: entry.material.grade
      }, null);
    });

    if (AHS.MaterialRepository && typeof AHS.MaterialRepository.list === "function") {
      AHS.MaterialRepository.list().forEach(function (record) {
        var meta = record.metadata || {};
        var summary = record.summary || {};
        var bank = record.questionBank || {};
        addEntry(record.id, {
          subjectKey: meta.subject, title: summary.title, chapter: meta.chapter, grade: meta.grade
        }, bank.singleChoice);
      });
    }

    return entries;
  }

  /* create(model?) — model defaults to AHS.AppConfig.quiz. Owns view
     switching between: 清單 (list) -> 測驗中 (exam) -> 檢討 (review) ->
     back to 清單, driven by the Runtime chain. */
  /* ---- Practice Mode (EO-S6-006 System Runtime Integration) --------------
     Entirely separate from Exam Mode above: reads ONLY
     AHS.LearningQuestionRuntime (never AHS.QuestionRuntime, never Mock
     Data), no ExamRuntime session, no AutoGrader, no WrongBook/History
     sync — "兩者不得混用". Shows the real answer/explanation already
     carried on each Learning Question record (from QuestionGenerator.js,
     untouched). Empty State per EO-S6-006 mandated copy when
     LearningQuestionRuntime has no records. */
  /* Sprint 6.8 EO-S6.8-002 Task 004 (PAT Critical, Practice Mode audit):
     QuestionGenerator.js's Mode B ("ai") candidates currently carry an
     honestly-labeled "[Stub] ..." question/answer (no real AI exists in
     this environment). They pass the 10-item completeness gate — every
     field IS present — so LearningQuestionRuntime stores them, and until
     now Practice Mode rendered them as if they were real questions.
     That is exactly the Placeholder-in-Practice-Mode state this Task
     forbids ("不得 Placeholder／Demo Question"). Fix at the UI layer
     only: Practice Mode (and the Question Guide's statistics) simply do
     not show a record whose question or answer is still a [Stub] —
     showing the mandated Empty State instead. QuestionGenerator.js /
     LearningQuestionRuntime.js themselves are untouched (Runtime
     Architecture is Do-NOT-Modify this EO); once real AI content
     replaces the stubs, these same records surface with zero further
     change here. */
  /* materialIdFromExamId(examId) — Sprint AI-122 AI-122-02/03: reverses
     the "teaching_material_<id>" convention TeachingMaterialLoader.js
     already establishes, so a link that only carries examId= (e.g.
     WorkspaceFolder.js's own 前往考前練習) can still resolve a real
     materialId for Practice Mode's own filterMaterialId scoping —
     without this, mode=practice&examId=... had no materialId to filter
     by at all. Sprint AI-124 AI-124-02: delegates to the one shared
     AHS.PlatformContext.materialIdFromExamId() (falls back to this
     file's own prior inline regex when that script hasn't loaded on some
     page, defensive only — every page this component runs on loads
     PlatformContext.js). Pure string parsing, no Runtime touched. */
  function materialIdFromExamId(examId) {
    if (AHS.PlatformContext && typeof AHS.PlatformContext.materialIdFromExamId === "function") {
      return AHS.PlatformContext.materialIdFromExamId(examId);
    }
    var m = /^teaching_material_(.+)$/.exec(examId || "");
    return m ? m[1] : null;
  }

  /* realExamQuestionsFor(materialId) — Sprint AI-122 AI-122-02/03: the
     real, already-imported Exam-compatible question set for one real
     material (AHS.QuestionRuntime — read-only, this Sprint's own LOCK
     forbids modifying Learning Engine/QuestionBank Runtime, not reading
     their existing public API, same as every other file in this repo
     already does). This is Practice Mode's real content source for a
     Repository-sourced material, closing the gap that used to force
     這類教材 into Formal Exam instead (see startDrawnSession()'s own
     header for the sibling AI-121 precedent of reading, never writing,
     these same Runtimes from Quiz Center). */
  function realExamQuestionsFor(materialId) {
    if (!materialId || !AHS.QuestionRuntime || typeof AHS.QuestionRuntime.hasExam !== "function") { return []; }
    var examId = "teaching_material_" + materialId;
    var set = AHS.QuestionRuntime.hasExam(examId) ? AHS.QuestionRuntime.getSet(examId) : [];
    /* 2026-10-08: Practice Mode answers with a single click, so it keeps
       single-choice and true/false questions only; multi-select and
       self-graded questions are taken in the exam view (QuestionCard.js). */
    return AHS.QuestionKind ? set.filter(function (q) { return AHS.QuestionKind.isChoice(q); }) : set;
  }

  function isRealLearningQuestion(record) {
    var q = String((record && record.question) || "");
    var a = (record && record.answer !== undefined && record.answer !== null)
      ? String(record.answer) : "";
    return q.indexOf("[Stub]") !== 0 && a.indexOf("[Stub]") !== 0;
  }

  /* isMaterialApproved(materialId) — Sprint AI-132（使用者需求 A）：
     考前總複習的「練習題」清單直接讀 AHS.LearningQuestionRuntime，這是
     一個獨立於 MaterialRuntime 的 Store，本身不知道「這份教材是否已
     審核通過」——若不在這裡把關，一份學生剛上傳、尚未經管理者核准的
     教材，其 AI 產生的練習題會立刻出現在這裡，繞過審核佇列，等同
     「上傳的資料...在我尚未同意前」的規則沒有真正生效。只有在真的能
     解析到一筆 MaterialRuntime 記錄、且該記錄明確 approved === false
     時才過濾掉；找不到對應記錄（例如測試環境獨立造的資料，或非學生
     上傳面板的其他來源）一律視為可見，不影響任何既有行為。 */
  function isMaterialApproved(materialId) {
    if (!materialId || !AHS.MaterialRuntime || typeof AHS.MaterialRuntime.getById !== "function") { return true; }
    var m = AHS.MaterialRuntime.getById(materialId);
    return !m || m.approved !== false;
  }

  /* Sprint AI-015E Part B · Identity Mapping (read-only cross-reference,
     no new store, no Runtime API touched, no WrongBookGenerator change).
     AHS.WrongBookGenerator resolves wrong answers exclusively via
     AHS.LearningQuestionSession.getById() (its own fixed, LOCK design —
     see js/parser/WrongBookGenerator.js header). Since Practice Mode now
     reads questions from AHS.LearningQuestionRuntime only (Production
     Cutover, below), this maps a displayed Runtime record back to its
     Session sibling so WrongBookGenerator can still resolve it. Both
     records were written by the same QuestionProviderBridge.bridge()
     call from the same source question (Sprint AI-015C), so materialId +
     traceability.knowledgeId + question text (verbatim passthrough of
     the same source string on both sides) uniquely identify the pair —
     nothing here is inferred or fabricated, only matched against
     already-real, already-stored content. Falls back to record.id when
     no sibling exists, so WrongBookGenerator still honestly rejects it
     exactly as it does today for any unresolvable id — no new failure
     mode is introduced. */
  function wrongBookQuestionId(record) {
    var session = AHS.LearningQuestionSession;
    if (!session || typeof session.findByMaterialId !== "function") { return record.id; }
    var knowledgeId = record.traceability && record.traceability.knowledgeId;
    if (!knowledgeId) { return record.id; }
    var siblings = session.findByMaterialId(record.materialId);
    for (var i = 0; i < siblings.length; i += 1) {
      var s = siblings[i];
      if (s.traceability && s.traceability.knowledgeId === knowledgeId && s.question === record.question) {
        return s.id;
      }
    }
    return record.id;
  }

  /* ---- Practice View (full-screen) — Sprint AI-123 Practice Flow UX
     Refactor. Replaces the old inline "click a row -> answer right where
     you clicked, in the same list view" flow (AI-123-01: "不得停留目前
     Detail Panel"). renderLegacyQuestionBody()/renderRealQuestionBody()
     above are this view's only two question-rendering strategies —
     nothing about grading/Runtime sync changed, only where they're
     mounted (AI-123-13 LOCK: View/Navigation/Component only).

     statusIcon(state) — AI-123-05/06: ✔ already correct, ✘ already
     wrong, ○ not yet attempted. Purely presentational. */
  function statusIcon(state) {
    if (state === "correct") {
      return el("span", { class: "quiz-practice__row-status quiz-practice__row-status--correct", "aria-label": "已答對", text: "✔" });
    }
    if (state === "wrong") {
      return el("span", { class: "quiz-practice__row-status quiz-practice__row-status--wrong", "aria-label": "已答錯", text: "✘" });
    }
    return el("span", { class: "quiz-practice__row-status quiz-practice__row-status--pending", "aria-label": "尚未作答", text: "○" });
  }

  P.richExplanation = richExplanation;
  P.DIFF_TONE = DIFF_TONE;
  P.difficultyBadge = difficultyBadge;
  P.FORMAL_EXAM_QUESTION_COUNT = FORMAL_EXAM_QUESTION_COUNT;
  P.chip = chip;
  P.subjectKeyFromChineseName = subjectKeyFromChineseName;
  P.modeDifficulty = modeDifficulty;
  P.DIFFICULTY_RANK = DIFFICULTY_RANK;
  P.difficultyRank = difficultyRank;
  P.resolveRealQuestionDifficulty = resolveRealQuestionDifficulty;
  P.filterByDifficulty = filterByDifficulty;
  P.repositoryExamCatalog = repositoryExamCatalog;
  P.materialIdFromExamId = materialIdFromExamId;
  P.realExamQuestionsFor = realExamQuestionsFor;
  P.isRealLearningQuestion = isRealLearningQuestion;
  P.isMaterialApproved = isMaterialApproved;
  P.wrongBookQuestionId = wrongBookQuestionId;
  P.statusIcon = statusIcon;
})(AHS.QuizParts);
