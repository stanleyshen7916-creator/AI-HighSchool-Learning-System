/* components/QuizCenter.js — 測驗中心 (Quiz Center) page.
   Banner + filter bar + quiz list + right rail (stat cards / subject
   accuracy donut / history) — list view, unchanged in look & feel.

   Sprint 4 · Quiz Runtime Foundation: "開始測驗" / "重新測驗" now drives
   the real Runtime chain instead of a Mock status line:
     ExamRuntime.start() -> QuestionRuntime/QuestionBank (via start) ->
     QuestionNavigator + QuestionCard (exam-taking view) ->
     AnswerRuntime.saveAnswer() (per pick) -> QuestionNavigator "完成測驗" ->
     ExamRuntime.finish() -> AutoGrader.grade() -> WrongBookRuntime.sync()
     -> ReviewRuntime.build() (review view) -> HistoryRuntime.record() ->
     StatisticsRuntime.refresh() (feeds the right-rail stat cards / donut
     once at least one exam has been completed this session).

   PascalCase component under window.AHS. Donut is pure inline SVG
   (no chart library). */
window.AHS = window.AHS || {};
AHS.QuizCenter = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */
  var P = AHS.QuizParts || {};
  var FORMAL_EXAM_QUESTION_COUNT = P.FORMAL_EXAM_QUESTION_COUNT,
    repositoryExamCatalog = P.repositoryExamCatalog,
    openChapterPicker = P.openChapterPicker,
    buildListView = P.buildListView,
    baseAssessmentExamId = P.baseAssessmentExamId,
    baseFormalExamId = P.baseFormalExamId,
    buildExamView = P.buildExamView,
    buildReviewView = P.buildReviewView,
    materialIdFromExamId = P.materialIdFromExamId,
    realExamQuestionsFor = P.realExamQuestionsFor,
    isRealLearningQuestion = P.isRealLearningQuestion,
    buildPracticeListView = P.buildPracticeListView,
    practiceHeaderMeta = P.practiceHeaderMeta,
    buildPracticeSessionView = P.buildPracticeSessionView;

  /* create(model, initialMode, initialMaterialId, initialExamId)
     Sprint 6.8 EO-S6.8-001 (Task 001/002, AI Learning Flow): initialMode
     ("practice" | undefined) and initialMaterialId are optional and
     additive — every existing caller (js/pages/app-quiz.js with no
     extra args) gets EXACTLY the same behavior as before (Exam Mode
     tab active by default). When a real deep link from Summary Detail
     passes initialMode: "practice", Practice Mode is shown first
     instead, optionally pre-filtered to one material's own questions —
     completing the Material → AI Summary → Practice flow. No change to
     any Exam Mode function below, no change to ExamRuntime/QuestionBank/
     QuestionRuntime.

     Sprint v1.6 Module C: initialExamId is a further optional, additive
     param — a real quiz.html?examId=teaching_material_<id> link (from
     Material Card's new "開始練習" Navigation Action) jumps straight
     into that already-imported QuestionRuntime exam via
     ExamRuntime.startFromExam(), never through startExam()/
     QuestionBank.generate(). Every existing caller (no examId) is
     unaffected — showList() still runs first, exactly as before. */
  function create(model, initialMode, initialMaterialId, initialExamId) {
    var data = model || AHS.AppConfig.quiz;
    var root = el("div", { class: "quiz-root" });

    /* HOTFIX-005 AI-501: the default list additively includes real
       Repository-derived rows alongside data.items (Mock catalog, starts
       empty by design). A Repository row's onStart is routed to the
       already-existing tryDirectExamEntry()/ExamRuntime.startFromExam()
       path (below) — never AHS.ExamRuntime.start()/QuestionBank.generate()
       — since its questions are already real and already imported, not
       something to (re)generate. Falls back to plain `data` (unchanged
       behavior) when no Repository material has been imported yet. */
    /* Sprint AI-109 AI-604: 科目篩選 chips no longer stop at
       AHS.AppConfig.quiz.subjects's own fixed Mock list — any real
       subject a Repository material actually has (e.g. "civics", not in
       that fixed list at all) is appended so filtering/chips genuinely
       reflect what's in the Repository. AHS.AppConfig.quiz.subjects
       itself is never modified — this only extends the LOCAL data object
       passed into buildListView() for this one render. Only real,
       AHS.Subjects-valid keys are added (never an unmapped id, which
       filterBar()'s chip rendering has no fallback for). */
    function mergedListData() {
      var repoItems = repositoryExamCatalog();
      if (!repoItems.length) { return data; }
      var merged = {};
      Object.keys(data).forEach(function (k) { merged[k] = data[k]; });
      merged.items = (data.items || []).concat(repoItems);

      var subjects = (data.subjects || []).slice();
      repoItems.forEach(function (it) {
        if (it.subject && AHS.Subjects[it.subject] && subjects.indexOf(it.subject) === -1) {
          subjects.push(it.subject);
        }
      });
      merged.subjects = subjects;
      return merged;
    }

    function unifiedStart(item) {
      if (item && item._repoExamId) { tryDirectExamEntry(item._repoExamId); return; }
      startExam(item);
    }

    function showList() {
      AHS.UI.mount(root, buildListView(mergedListData(), unifiedStart, openCombinePicker, tryRandomPracticeEntry));
    }

    /* showScopedList(materialId) — Sprint AI-124 AI-124-03/04/12: when a
       real materialId context already exists (the student arrived via a
       材料-scoped link, or already picked one in Practice Mode), Exam
       Mode's own list must NOT fall back to "全部教材" — it stays scoped
       to that same real material, exactly like Practice Mode's own list
       already does. Filters mergedListData() down to just the
       Repository entries whose _repoExamId resolves to this materialId
       (Mock catalog rows carry no real materialId to match against, so
       they're honestly excluded here — never guessed). Falls back to
       the normal, full showList() only when scoping would honestly
       leave nothing to show (e.g. this material has no Formal Exam
       content at all) — never a fabricated empty "scoped" view. */
    function showScopedList(materialId) {
      var merged = mergedListData();
      var scopedItems = (merged.items || []).filter(function (it) {
        return it._repoExamId && materialIdFromExamId(it._repoExamId) === materialId;
      });
      if (!scopedItems.length) { showList(); return; }
      var scoped = {};
      Object.keys(merged).forEach(function (k) { scoped[k] = merged[k]; });
      scoped.items = scopedItems;
      AHS.UI.mount(root, buildListView(scoped, unifiedStart));
    }

    function startExam(item) {
      var session = AHS.ExamRuntime.start({
        subject: item.subject, title: item.title, chapter: item.chapter,
        grade: item.grade, count: item.count, type: item.type, difficulty: item.difficulty
      });
      if (!session) { return; } /* another exam already running — ignore. */
      showExam(session.examId);
    }

    /* switchAssessmentMode(baseExamId, mode) — Sprint AI-117 AI-117-08.
       Abandons (never grades) the currently-running session, then starts
       a fresh one scoped to exactly the chosen mode's question set. */
    function switchAssessmentMode(baseExamId, mode) {
      var current = AHS.ExamRuntime.getCurrent();
      if (current && typeof AHS.ExamRuntime.abandon === "function") { AHS.ExamRuntime.abandon(current.examId); }
      tryDirectExamEntry(baseExamId + (mode === "original" ? "__original" : "__ai"));
    }

    function showExam(examId) {
      var session = AHS.ExamRuntime.getCurrent();
      if (!session || session.examId !== examId) { showList(); return; }
      AHS.UI.mount(root, buildExamView(session, function () { showExam(examId); }, function () {
        finishExam(examId);
      }, switchAssessmentMode, function () {
        finishExamEarly(examId);
      }));
    }

    function finishExam(examId) {
      var finished = AHS.ExamRuntime.finish(examId);
      if (!finished) { showList(); return; }
      var graded = AHS.AutoGrader.grade(finished);
      if (graded) {
        AHS.WrongBookRuntime.sync(graded);
        AHS.HistoryRuntime.record(graded);
        /* Sprint AI-121: real per-knowledge-point correct+wrong signal —
           AutoGrader's own `results` (unlike `wrong`) carries every
           question of this attempt, the one real moment Knowledge
           Mastery/Accuracy/Trend/Growth can be fed honestly. */
        if (AHS.KnowledgeMasteryRuntime && typeof AHS.KnowledgeMasteryRuntime.recordGraded === "function") {
          AHS.KnowledgeMasteryRuntime.recordGraded(graded);
        }
      }
      var review = AHS.ReviewRuntime.build(examId);
      if (!review) { showList(); return; }
      var retryExamId = baseFormalExamId(examId);
      AHS.UI.mount(root, buildReviewView(review, showList,
        retryExamId ? function () { tryDirectExamEntry(retryExamId); } : undefined));
    }

    /* finishExamEarly(examId) — 完成測試 hotfix (user requirement #2):
       lets a student stop a still-in-progress exam (e.g. answered 3 of
       10) and have THAT partial attempt genuinely recorded, instead of
       forcing them to reach the last question before onFinish() even
       renders. Reuses AHS.ExamRuntime.finish() (same session-closing
       call finishExam() already uses — no new Runtime state) and
       AHS.AutoGrader.grade(finished, { answeredOnly: true }) (this
       Sprint's additive opts param) so only the questions the student
       actually answered are graded/recorded — an unanswered question is
       excluded, never counted as wrong (user's own confirmed answer:
       "只計算已作答的題目，未作答的不算入本次成績"). Blocks a
       zero-answered click (nothing real to record) and confirms via
       window.confirm() before finishing, mirroring the existing
       window.confirm() precedent already used elsewhere in this repo
       (js/ui/SettingsPanel.js's restore confirmation). */
    function finishExamEarly(examId) {
      var answers = AHS.AnswerRuntime.getAnswers(examId);
      var answeredCount = Object.keys(answers).length;
      if (!answeredCount) {
        window.alert("尚未作答任何題目，無法提前完成測試。");
        return;
      }
      var confirmed = window.confirm(
        "確定要提前完成測試嗎？\n本次僅會記錄已作答的 " + answeredCount + " 題，未作答的題目不計入成績。"
      );
      if (!confirmed) { return; }

      var finished = AHS.ExamRuntime.finish(examId);
      if (!finished) { showList(); return; }
      var graded = AHS.AutoGrader.grade(finished, { answeredOnly: true });
      if (graded) {
        AHS.WrongBookRuntime.sync(graded);
        AHS.HistoryRuntime.record(graded);
        if (AHS.KnowledgeMasteryRuntime && typeof AHS.KnowledgeMasteryRuntime.recordGraded === "function") {
          AHS.KnowledgeMasteryRuntime.recordGraded(graded);
        }
      }
      var review = AHS.ReviewRuntime.build(examId);
      if (!review) { showList(); return; }
      var retryExamId = baseFormalExamId(examId);
      AHS.UI.mount(root, buildReviewView(review, showList,
        retryExamId ? function () { tryDirectExamEntry(retryExamId); } : undefined));
    }

    /* Sprint v1.6 Module C: a real initialExamId tries direct entry into
       an already-imported exam first; any failure (already running, no
       question set for this id, meta unresolvable) falls back to the
       normal Exam Mode list — never a broken/blank view.

       平時練習 random-10 rework: when `examId` is a real material's own
       base exam id (the one TeachingMaterialLoader.js already built a
       permanent AHS.QuestionBankRuntime bank for via ensureBank() at
       import time — never the "__original"/"__ai" Assessment Mode
       variants switchAssessmentMode() passes here, which have no bank
       of their own and fall through to the unchanged whole-set path
       below), each attempt now draws up to FORMAL_EXAM_QUESTION_COUNT
       real questions via AHS.QuestionBankRuntime.drawCycle() — a
       persisted "shuffled bag" that never repeats a question until
       every question in the bank has been drawn once (可重複，但每一題
       均必須要出到), imported under a fresh derived examId so
       ExamRuntime/AutoGrader/WrongBookRuntime/HistoryRuntime run
       completely unchanged (same additive-variant convention
       startDrawnSession() below already established). */
    function tryDirectExamEntry(examId) {
      /* 2026-10-01: a material can now hold BOTH original exam questions
         and AI questions (a 補充題庫 added to an exam paper, e.g. tm_1).
         The drawn 平時練習 set below would mix them, against Assessment
         Mode's "不得混用" — so such a material opens its 原始試卷 variant,
         and the exam view's own toggle switches to AI 練習. Materials with
         one question source keep the drawn set exactly as before. */
      if (/^teaching_material_/.test(examId) && !/__(original|ai)$/.test(examId) &&
          AHS.QuestionRuntime.hasExam(examId + "__original") && AHS.QuestionRuntime.hasExam(examId + "__ai")) {
        examId = examId + "__original";
      }
      if (AHS.QuestionBankRuntime && typeof AHS.QuestionBankRuntime.drawCycle === "function" &&
          AHS.QuestionBankRuntime.hasBank(examId)) {
        var drawn = AHS.QuestionBankRuntime.drawCycle(examId, FORMAL_EXAM_QUESTION_COUNT);
        if (!drawn.length) { showList(); return null; }
        var derivedExamId = examId + "__formal_" + (Date.now());
        AHS.QuestionRuntime.importQuestions(derivedExamId, drawn);
        var drawnMeta = (AHS.TeachingMaterialLoader && typeof AHS.TeachingMaterialLoader.resolveExamMeta === "function")
          ? AHS.TeachingMaterialLoader.resolveExamMeta(examId) : null;
        /* Sprint AI-145: real, defensive fallback (never fabricated) —
           same precedent as startDrawnSession() below. Every material a
           real bank exists for was, by construction, already loaded via
           TeachingMaterialLoader's own loadQuestions()/ensureBank() pair,
           so resolveExamMeta() should always succeed for it in
           production; this only guards the rare case it can't (e.g. the
           bank's own idMap entry has since been cleared) so the drawn
           questions' own real subject still renders instead of crashing
           on an unrecognized "other" Subject key. */
        if (!drawnMeta && drawn[0] && drawn[0].subject) {
          drawnMeta = { subject: drawn[0].subject, title: "平時練習" };
        }
        var drawnSession = AHS.ExamRuntime.startFromExam(derivedExamId, drawnMeta || {});
        if (!drawnSession) { showList(); return null; }
        showExam(drawnSession.examId);
        return drawnSession.examId;
      }
      var meta = (AHS.TeachingMaterialLoader && typeof AHS.TeachingMaterialLoader.resolveExamMeta === "function")
        ? AHS.TeachingMaterialLoader.resolveExamMeta(examId) : null;
      /* 2026-10-01: the __original/__ai Assessment Mode variants share their
         base material's meta (resolveExamMeta() only knows the base id);
         without it the session had no subject and the exam view crashed. */
      if (!meta && examId !== baseAssessmentExamId(examId) && AHS.TeachingMaterialLoader &&
          typeof AHS.TeachingMaterialLoader.resolveExamMeta === "function") {
        meta = AHS.TeachingMaterialLoader.resolveExamMeta(baseAssessmentExamId(examId));
      }
      var session = AHS.ExamRuntime.startFromExam(examId, meta || {});
      if (!session) { showList(); return null; }
      showExam(session.examId);
      return session.examId;
    }

    /* tryCombinedExamEntry(examIds) — Feature B (使用者需求："在「平時
       測驗」...可以一次選擇三課來進行複習"): the 平時練習 sibling of
       tryDirectExamEntry() above, for a real multi-chapter selection made
       via openChapterPicker(). For each selected chapter, draws the same
       honest FORMAL_EXAM_QUESTION_COUNT-capped set tryDirectExamEntry()
       already draws per chapter (AHS.QuestionBankRuntime.drawCycle() when
       a bank exists, else that chapter's own full real set) and
       concatenates them into ONE combined derived examId — question ids
       are already globally unique per-material (e.g. "tm_1_q1"/
       "tm_2_q1", never bare "q1"), so combining never collides answers/
       grading across chapters. Combined subject/title/chapter/grade are
       read directly from the SAME repositoryExamCatalog() entries the
       picker itself displayed — never re-derived/guessed — so the
       resulting ExamRuntime session honestly reflects exactly which
       chapters were picked. Runs through the exact same
       ExamRuntime/AutoGrader/WrongBook/History/KnowledgeMastery chain as
       every other exam entry point; not a parallel grading path. */
    function tryCombinedExamEntry(examIds) {
      if (!Array.isArray(examIds) || !examIds.length) { return null; }
      var catalog = repositoryExamCatalog();
      var byId = {};
      catalog.forEach(function (it) { byId[it._repoExamId] = it; });
      var combined = [];
      var subjectKey = "";
      var gradeLabel = "";
      var chapterLabels = [];
      examIds.forEach(function (examId) {
        var entry = byId[examId];
        if (!entry) { return; }
        var drawn = (AHS.QuestionBankRuntime && typeof AHS.QuestionBankRuntime.drawCycle === "function" &&
            AHS.QuestionBankRuntime.hasBank(examId))
          ? AHS.QuestionBankRuntime.drawCycle(examId, FORMAL_EXAM_QUESTION_COUNT)
          : (AHS.QuestionRuntime && typeof AHS.QuestionRuntime.getSet === "function"
            ? AHS.QuestionRuntime.getSet(examId) : []);
        if (!drawn.length) { return; }
        combined = combined.concat(tagSource(drawn, sourceMetaFor(examId, entry)));
        if (!subjectKey && entry.subject) { subjectKey = entry.subject; }
        if (!gradeLabel && entry.grade) { gradeLabel = entry.grade; }
        if (entry.chapter) { chapterLabels.push(entry.chapter); }
      });
      if (!combined.length) { showList(); return null; }
      var derivedExamId = "combined_exam_" + Date.now();
      AHS.QuestionRuntime.importQuestions(derivedExamId, combined);
      var combinedMeta = {
        subject: subjectKey,
        title: chapterLabels.length ? chapterLabels.join("、") + "（合併複習）" : "合併複習",
        chapter: chapterLabels.join("、"),
        grade: gradeLabel
      };
      var session = AHS.ExamRuntime.startFromExam(derivedExamId, combinedMeta);
      if (!session) { showList(); return null; }
      showExam(session.examId);
      return session.examId;
    }

    function openCombinePicker() {
      openChapterPicker("exam", function (examIds) { tryCombinedExamEntry(examIds); });
    }

    /* sourceMetaFor()/tagSource() — 2026-10-01: each question in an exam
       that spans several materials carries its own material's title/
       chapter (same resolveExamMeta() a single-material exam uses), so
       知識弱點 files a wrong answer under its real lesson. */
    function sourceMetaFor(examId, entry) {
      var meta = (AHS.TeachingMaterialLoader && typeof AHS.TeachingMaterialLoader.resolveExamMeta === "function")
        ? AHS.TeachingMaterialLoader.resolveExamMeta(examId) : null;
      return { title: (meta && meta.title) || entry.title || "", chapter: (meta && meta.chapter) || entry.chapter || "" };
    }
    function tagSource(questions, src) {
      return questions.map(function (q) {
        var out = {};
        Object.keys(q).forEach(function (k) { out[k] = q[k]; });
        out.sourceTitle = src.title;
        out.sourceChapter = src.chapter;
        return out;
      });
    }

    /* tryRandomPracticeEntry(subjectKey) — 2026-10-01 綜合隨機練習（方案 C）:
       one FORMAL_EXAM_QUESTION_COUNT exam drawn across every material of
       this subject in the current semester (repositoryExamCatalog()),
       chosen by AHS.RandomPracticeRuntime: unmastered 知識弱點 questions
       (at most 40%), then questions not yet drawn in their material's
       cycle, then the rest. The drawn questions leave their materials'
       cycles (markDrawn) so 平時練習 doesn't repeat them right away. Same
       ExamRuntime/AutoGrader/WrongBook/History chain as every exam. */
    function tryRandomPracticeEntry(subjectKey) {
      if (!subjectKey || !AHS.RandomPracticeRuntime) { return null; }
      var entries = repositoryExamCatalog().filter(function (it) { return it.subject === subjectKey; });
      var bank = AHS.QuestionBankRuntime;
      var pools = entries.map(function (entry) {
        var examId = entry._repoExamId;
        var hasBank = bank && typeof bank.hasBank === "function" && bank.hasBank(examId);
        return {
          examId: examId,
          questions: hasBank ? bank.getBank(examId)
            : (AHS.QuestionRuntime && typeof AHS.QuestionRuntime.getSet === "function" ? AHS.QuestionRuntime.getSet(examId) : []),
          undrawnIds: hasBank && typeof bank.undrawnIds === "function" ? bank.undrawnIds(examId) : null,
          source: sourceMetaFor(examId, entry)
        };
      });
      var weakIds = {};
      if (AHS.WrongBookRuntime && typeof AHS.WrongBookRuntime.list === "function") {
        AHS.WrongBookRuntime.list().forEach(function (w) {
          if (w && w.questionId && !w.archived && (w.correctStreak || 0) < 3) { weakIds[w.questionId] = true; }
        });
      }
      var picked = AHS.RandomPracticeRuntime.pick({ pools: pools, weakIds: weakIds, count: FORMAL_EXAM_QUESTION_COUNT });
      if (!picked.length) { return null; }
      var byExam = {};
      picked.forEach(function (q) { (byExam[q._examId] = byExam[q._examId] || []).push(q.id); });
      if (bank && typeof bank.markDrawn === "function") {
        Object.keys(byExam).forEach(function (examId) { bank.markDrawn(examId, byExam[examId]); });
      }
      var questions = picked.map(function (q, i) {
        var out = {};
        Object.keys(q).forEach(function (k) { if (k.charAt(0) !== "_") { out[k] = q[k]; } });
        out.index = i + 1;
        return out;
      });
      var subj = AHS.Subjects[subjectKey] || { name: subjectKey };
      var derivedExamId = "random_practice_" + Date.now();
      AHS.QuestionRuntime.importQuestions(derivedExamId, questions);
      var session = AHS.ExamRuntime.startFromExam(derivedExamId, {
        subject: subjectKey,
        title: subj.name + "綜合隨機練習",
        chapter: "跨 " + Object.keys(byExam).length + " 課",
        grade: (entries[0] && entries[0].grade) || ""
      });
      if (!session) { showList(); return null; }
      showExam(session.examId);
      return session.examId;
    }

    /* openCombinedPractice(examIds) — Feature B, 考前總複習 sibling: real
       already-imported questions (realExamQuestionsFor(), the same
       source onRealPractice's single-chapter drill-down already reads)
       from EVERY selected chapter, concatenated into one Practice
       Session (openPracticeSession("real", ...)) — 考前總複習's own real
       characteristics (可重複作答／不影響正式成績／立即看到詳解) are
       untouched since this reuses that exact same session surface, just
       with a longer, real question list. returnMaterialId is
       deliberately null (no single chapter to return to — closing the
       session correctly lands back on the top-level Repository 教材
       list, not a scoped one). headerMeta is built from the same
       repositoryExamCatalog() entries the picker displayed, honestly
       labelled "N 課合併複習" rather than any one chapter's own name. */
    function openCombinedPractice(examIds) {
      if (!Array.isArray(examIds) || !examIds.length) { return; }
      var catalog = repositoryExamCatalog();
      var byId = {};
      catalog.forEach(function (it) { byId[it._repoExamId] = it; });
      var combined = [];
      var subjectKey = "";
      var chapterCount = 0;
      examIds.forEach(function (examId) {
        var entry = byId[examId];
        if (!entry) { return; }
        var materialId = materialIdFromExamId(examId);
        var qs = realExamQuestionsFor(materialId);
        if (!qs.length) { return; }
        combined = combined.concat(qs);
        chapterCount += 1;
        if (!subjectKey && entry.subject) { subjectKey = entry.subject; }
      });
      if (!combined.length) { return; }
      var subjectName = (subjectKey && AHS.Subjects[subjectKey]) ? AHS.Subjects[subjectKey].name : subjectKey;
      var headerMeta = { subjectName: subjectName || "", chapterLabel: chapterCount + " 課合併複習" };
      openPracticeSession("real", combined, 0, null, headerMeta);
    }

    function openCombinePracticePicker() {
      openChapterPicker("practice", openCombinedPractice);
    }

    /* startDrawnSession(baseExamId, suffix) — Sprint AI-121 (Learning
       Knowledge Engine) AI-121-05/AI-121-07: a real random redraw of 10
       questions from baseExamId's already-built, permanent QuestionBank
       (AHS.QuestionBankRuntime.drawRandom() — never fabricated; an
       honestly small bank returns fewer than 10). Imported under a
       derived examId (same additive-variant convention
       importAssessmentModeVariants() above already established with
       "__original"/"__ai") so the entire existing ExamRuntime/
       QuestionRuntime/AutoGrader/WrongBook/History/KnowledgeMastery chain
       runs completely unmodified — this is real "Wiring", not a new
       grading path. meta is resolved from the REAL baseExamId (not the
       derived one, which resolveExamMeta()'s own regex can't match) so
       subject/title/chapter are never lost. Returns the derived examId on
       success, or null (caller falls back to the normal list). */
    function startDrawnSession(baseExamId, suffix) {
      if (!AHS.QuestionBankRuntime || typeof AHS.QuestionBankRuntime.drawRandom !== "function") { return null; }
      var drawn = AHS.QuestionBankRuntime.drawRandom(baseExamId, 10);
      if (!drawn.length) { return null; }
      var derivedExamId = baseExamId + suffix;
      AHS.QuestionRuntime.importQuestions(derivedExamId, drawn);
      var meta = (AHS.TeachingMaterialLoader && typeof AHS.TeachingMaterialLoader.resolveExamMeta === "function")
        ? AHS.TeachingMaterialLoader.resolveExamMeta(baseExamId) : null;
      /* Real, defensive fallback (never fabricated): if the loader can't
         reverse-resolve baseExamId (e.g. a Repository entry that never
         went through TeachingMaterialLoader's own idMap), fall back to
         the drawn bank's own real per-question subject — still a real
         AHS.Subjects key, unlike meta's own eventual "other" default,
         which downstream chip-rendering has no fallback for. */
      if (!meta && drawn[0] && drawn[0].subject) {
        meta = { subject: drawn[0].subject, title: "再次測試" };
      }
      var session = AHS.ExamRuntime.startFromExam(derivedExamId, meta || {});
      if (!session) { return null; }
      showExam(session.examId);
      return session.examId;
    }

    /* tryRetestEntry(examId) — AI-121-07: 再次測試 (renamed from 重新測試)
       — random 10 from the same permanent QuestionBank, purpose is
       verifying mastery is real (not chasing a higher score), so it
       intentionally reuses the exact same mechanism as Daily Practice
       rather than a third, parallel one. */
    function tryRetestEntry(examId) {
      var started = startDrawnSession(examId, "__retest");
      if (!started) { showList(); }
      return started;
    }

    /* HOTFIX-004 Issue 002: a real initialMaterialId alone (no explicit
       examId — e.g. Summary Detail's pre-existing "開始 AI 練習" link,
       quiz.html?mode=practice&materialId=..., unchanged since Sprint
       6.8) previously always landed on Practice Mode/巧巧老師出題引導,
       which reads only AHS.LearningQuestionRuntime — honestly empty for
       every Repository-sourced material, since that Runtime's
       completeness gate needs a knowledgeId/learningObjective no
       Repository record has (Sprint v1.6's own documented reasoning,
       unchanged — still not fabricated here either). Resolving the same
       "teaching_material_<id>" examId convention here too means BOTH
       entry points land on the same, real, already-working Exam-Mode
       display — pure additive routing, no new data, no re-analysis. */
    function resolveDirectExamId() {
      if (initialExamId) { return initialExamId; }
      if (initialMaterialId && AHS.QuestionRuntime && typeof AHS.QuestionRuntime.hasExam === "function") {
        var candidate = "teaching_material_" + initialMaterialId;
        if (AHS.QuestionRuntime.hasExam(candidate)) { return candidate; }
      }
      return null;
    }

    /* Sprint AI-122 AI-122-02/03: reverse-derived from initialExamId when
       only an examId (not materialId) was passed — e.g. WorkspaceFolder.
       js's own 前往考前練習 link — so Practice Mode still has a real
       material to scope to either way. */
    var practiceMaterialId = initialMaterialId || materialIdFromExamId(initialExamId);

    var directExamId = resolveDirectExamId();
    /* Sprint AI-122 AI-122-02: "所有前往考前練習皆須進入 Practice Mode，
       不得再導向 Formal Exam" — mode=practice now always wins over
       directExamId, reversing HOTFIX-004's own workaround (quoted below)
       from when Practice Mode had no real content for a Repository
       material to show. AI-121's real QuestionBank/QuestionRuntime now
       gives it real content (see buildPracticeListView's own
       realQuestions below), so that workaround is no longer honest to
       keep. mode=retest (AI-121-07) is unaffected — a real, separate,
       already-working entry point. (mode=daily／每日 AI 練習 removed —
       Sprint AI-143: same underlying QuestionBank as 平時練習, just a
       different draw algorithm, and never had a promoted entry point.) */
    /* Sprint AI-146（PO 回報：點「開始測驗」畫面又跳回列表，且之後永久卡
       住，重新整理才會恢復）：根因是 js/pages/AppQuiz.js 既有的
       window.addEventListener("ahs:repository-pulled", guardedInit) —
       Sprint AI-142 補上真實 Supabase 憑證後，js/repository/
       RepositorySync.js 的背景 pull() 第一次真的需要跑一趟真實網路（先前
       Supabase 未設定時，pull() 在第一行就直接 return，這個事件從未真正
       發出過）。pull() resolve 的時間點與使用者點「開始測驗」的時間點
       一旦重疊，guardedInit() 會整頁重新呼叫 AHS.QuizCenter.create()——
       這裡原本的路由邏輯只看 URL 參數，從未檢查「這個分頁其實已經有一個
       AHS.ExamRuntime 正在跑的 Session」，於是直接依 URL 掉回 showList()
       蓋掉剛剛才顯示的作答畫面；而 ExamRuntime 本身「同時間只能有一個
       Session 在跑」的防呆機制（js/runtime/ExamRuntime.js 的
       activeExamId 仍是 RUNNING，記憶體內狀態沒有被清掉，因為只有整頁真
       正重新載入才會重置）從此擋下任何後續 startFromExam()，導致同一頁
       之後永遠卡在 showList()——這正是「永久卡住、F5 才恢復」的機制。
       真正的修正是讓 create() 每次被呼叫時，先誠實檢查是否已經有一個真
       實在跑的 Session，有的話就接續顯示它，而不是無條件依 URL 參數重新
       路由一次——這樣無論 create() 是第一次載入呼叫，還是背景 pull 完成
       後被迫再次呼叫，畫面都不會把使用者正在作答的東西蓋掉。 */
    var resumeSession = AHS.ExamRuntime.getCurrent();
    if (resumeSession) {
      showExam(resumeSession.examId);
    } else if (directExamId && initialMode === "retest") {
      tryRetestEntry(directExamId);
    } else if (directExamId && initialMode !== "practice") {
      tryDirectExamEntry(directExamId);
    } else if (practiceMaterialId) {
      /* Sprint AI-124 AI-124-03/04: mode=practice&materialId=... (or a
         reverse-derived examId=...) means Exam Mode's own list, sitting
         hidden behind Practice Mode, must already be scoped to the SAME
         material — so switching the mode tab later (examTab, below)
         never reveals an unrelated "全部教材" list. */
      showScopedList(practiceMaterialId);
    } else {
      showList();
    }

    /* ---- Practice Mode mount (EO-S6-006) — entirely separate root,
       never touches `root` / any Exam Mode function above.
       Sprint AI-122 AI-122-02: startOnPractice now depends only on
       mode=practice, never on whether a directExamId happened to
       resolve — see the routing comment above for why that coupling
       (HOTFIX-004's own workaround) is removed this Sprint. */
    var practiceRoot = el("div", { class: "quiz-practice-root" });
    var startOnPractice = (initialMode === "practice");
    if (!startOnPractice) { practiceRoot.setAttribute("hidden", "hidden"); }

    /* practiceAnswerState — Sprint AI-123 AI-123-05/06/10: a purely
       in-memory (never persisted, no new Runtime, no sessionStorage key)
       session-scoped tracker of "has this question been answered in
       Practice Mode this page-life, and was it correct" — exactly the
       kind of local, view-layer-only state AI-123-13's LOCK still
       permits (it never replaces or shadows any real Runtime; every
       actual grading/sync call still goes straight to WrongBookRuntime/
       KnowledgeMasteryRuntime via renderLegacyQuestionBody/
       renderRealQuestionBody, unchanged). Keyed by "kind:id" since a
       legacy LearningQuestionRuntime id and a real QuestionRuntime id
       are drawn from two different id spaces and could collide. */
    var practiceAnswerState = {};
    function answerStatusKey(kind, id) { return kind + ":" + id; }
    function answerStatusFor(kind, id) { return practiceAnswerState[answerStatusKey(kind, id)] || null; }
    function setAnswerStatus(kind, id, isCorrect) { practiceAnswerState[answerStatusKey(kind, id)] = isCorrect ? "correct" : "wrong"; }
    function clearAnswerStatus(kind, id) { delete practiceAnswerState[answerStatusKey(kind, id)]; }

    /* practiceDifficulty — Sprint AI-124 AI-124-09: the real, explicit
       choice from 巧巧老師出題引導's picker (js/components/QuestionGuide.js),
       now actually threaded through into buildPracticeListView() (see
       showQuestionGuide()'s own onStart below), instead of being
       discarded the moment 開始練習 was clicked. Session-scoped, in-memory
       only — same "view-layer state, not a new Runtime" discipline as
       practiceAnswerState above. null (no filter) whenever Practice Mode
       is reached WITHOUT going through the Guide's explicit picker at
       all (e.g. the unfiltered Repository catalog drill-down), which is
       exactly this Sprint's own pre-existing, unchanged behavior. */
    var practiceDifficulty = null;

    /* showPracticeList(materialId) — Sprint AI-136: drilling into a
       single material (filterMaterialId truthy, whichever way it got
       set) now always offers a way back out, instead of stranding the
       student once they've clicked in:
         - arrived via the unfiltered Repository catalog (practiceMaterialId
           itself is falsy — no URL-fixed material) -> "back" re-shows
           that catalog (showPracticeList(null)).
         - arrived via a materialId deep link (巧巧老師出題引導 already ran
           and locked in a difficulty) -> "back" re-opens the guide so
           the difficulty pick can be redone, instead of being permanent
           for the rest of the session.
       practiceDifficulty itself is also no longer write-once: the
       toolbar's own difficulty pills call back in here with a new value
       and re-render the SAME scoped material, so changing your mind
       about 易/中等/難 never requires leaving the list at all. */
    function showPracticeList(materialId) {
      var scopedMaterialId = materialId !== undefined ? materialId : practiceMaterialId;
      var onBack;
      if (scopedMaterialId && !practiceMaterialId) {
        onBack = function () { showPracticeList(null); };
      } else if (scopedMaterialId && practiceMaterialId && AHS.QuestionGuide) {
        onBack = function () { showQuestionGuide(); };
      }
      AHS.UI.mount(practiceRoot, buildPracticeListView(
        showPracticeQuestion, scopedMaterialId,
        function (drillMaterialId) { showPracticeList(drillMaterialId); },
        showRealPracticeQuestion,
        answerStatusFor,
        practiceDifficulty,
        openCombinePracticePicker,
        onBack,
        scopedMaterialId ? function (nextDifficulty) {
          practiceDifficulty = nextDifficulty;
          showPracticeList(scopedMaterialId);
        } : undefined
      ));
    }

    /* openPracticeSession(kind, questions, startIndex, returnMaterialId,
       headerMetaOverride) — Sprint AI-123 AI-123-01: the ONLY way into an
       actual answering surface now — appended straight to document.body
       as a fixed, full-viewport overlay (AI-123-02: 全畫面作答),
       deliberately outside practiceRoot/root/AppShell's own DOM so the
       underlying question list is never rebuilt or scrolled while this
       is open — closing it (onExit) is the only moment the list
       re-renders, immediately after which window.scrollTo restores the
       exact position it was at before opening (AI-123-11: "不得重新整理。
       不得失去目前 Scroll Position").
       headerMetaOverride — Feature B, optional/additive: a combined
       multi-chapter session has no single real materialId to derive a
       header from (practiceHeaderMeta(returnMaterialId, ...) would just
       show the FIRST chapter's own subject/chapter, silently hiding that
       this is really N chapters combined); every existing caller omits
       this param and keeps the exact prior practiceHeaderMeta()-derived
       header. */
    function openPracticeSession(kind, questions, startIndex, returnMaterialId, headerMetaOverride) {
      var savedScroll = window.scrollY;
      document.body.classList.add("qpv-lock-scroll");
      var overlay;
      overlay = buildPracticeSessionView({
        kind: kind,
        questions: questions,
        startIndex: startIndex,
        headerMeta: headerMetaOverride || practiceHeaderMeta(returnMaterialId, questions[startIndex]),
        statusFor: answerStatusFor,
        onAnswered: function (id, isCorrect) { setAnswerStatus(kind, id, isCorrect); }
      }, {
        onExit: function () {
          if (overlay.parentNode) { document.body.removeChild(overlay); }
          document.body.classList.remove("qpv-lock-scroll");
          showPracticeList(returnMaterialId);
          window.scrollTo(0, savedScroll);
        },
        onRetest: function () {
          questions.forEach(function (q) { clearAnswerStatus(kind, q.id); });
          if (overlay.parentNode) { document.body.removeChild(overlay); }
          document.body.classList.remove("qpv-lock-scroll");
          openPracticeSession(kind, questions, 0, returnMaterialId, headerMetaOverride);
        }
      });
      document.body.appendChild(overlay);
    }

    /* showPracticeQuestion(record, list, index) — Sprint AI-123 AI-123-01:
       replaces the old inline "answer right where you clicked" Detail
       Panel entirely; list/index are the EXACT array/position
       buildPracticeListView() just rendered this row from (passed
       straight through from the row's own click handler), so Practice
       View's "第 N/M 題" always matches what the student was just
       looking at — no re-querying LearningQuestionRuntime, no risk of a
       clone()'d re-fetch losing reference/order. */
    function showPracticeQuestion(record, list, index) {
      openPracticeSession("legacy", list, index, practiceMaterialId);
    }
    /* showRealPracticeQuestion(q, list, index) — Sprint AI-122 AI-122-02/03
       real-content sibling, updated the same way for AI-123-01. "返回
       題目列表" (via openPracticeSession's onExit) still comes back to the
       SAME real material's own row list — context is never lost. */
    function showRealPracticeQuestion(q, list, index) {
      openPracticeSession("real", list, index, q.materialId || practiceMaterialId);
    }

    /* Sprint 6.8 EO-S6.8-002 Task 001 (AI Question Guide): a real deep
       link from Summary Detail (mode=practice&materialId=...) now lands
       on 巧巧老師出題引導 first — completing the fixed Summary →
       Question Guide → Practice flow. Its 開始練習 button reveals the
       existing Practice list, unchanged. Every other way into Practice
       Mode (mode tab click, no materialId) behaves exactly as before —
       purely additive. The guide receives this material's REAL Learning
       Question records only (same isRealLearningQuestion filter as the
       Practice list itself — Task 004 — so its 題型/難度 statistics can
       never be computed from a [Stub] placeholder). */
    /* Sprint AI-015E Part B · Production Cutover: the guide's question
       set now reads 100% from AHS.LearningQuestionRuntime (Session merge
       removed, matching buildPracticeListView above). "開始練習" no
       longer calls AHS.QuestionGenerationFlow.run() — Quiz must not
       create a Question of its own ("不得建立 Question。Quiz 只能
       Read。"); generation is materials.html's「產生 AI 題目」→
       QuestionProviderBridge responsibility (Sprint AI-015C), not
       Quiz's. QuestionGenerationFlow.js itself is untouched — Quiz
       simply no longer calls it. */
    function showQuestionGuide() {
      var runtime = AHS.LearningQuestionRuntime;
      var records = (runtime && typeof runtime.findByMaterialId === "function")
        ? runtime.findByMaterialId(practiceMaterialId) : [];
      AHS.UI.mount(practiceRoot, AHS.QuestionGuide.create({
        materialId: practiceMaterialId,
        questions: records.filter(isRealLearningQuestion),
        /* Sprint AI-124 AI-124-09: onStart(chosenDifficulty) — the
           student's real, explicit Easy/Medium/Hard pick (previously
           discarded here; showPracticeList() took no argument at all) —
           now actually carried into practiceDifficulty before showing
           the list, so the choice really does filter which questions
           appear, not just gate the 開始練習 button. */
        onStart: function (chosenDifficulty) {
          practiceDifficulty = chosenDifficulty || null;
          showPracticeList();
        }
      }));
    }

    if (startOnPractice && practiceMaterialId && AHS.QuestionGuide) {
      showQuestionGuide();
    } else {
      showPracticeList();
    }

    /* ---- Mode toggle — "Practice ↓ LearningQuestionRuntime" vs
       "Exam ↓ QuestionRuntime", 兩者不得混用: switching modes only
       toggles visibility, it never mounts Exam content into
       practiceRoot or vice versa.
       Sprint AI-118 AI-118-06: 練習模式 relabeled 考前練習 (real
       characteristics: 可重複／立即解析／不計正式成績／AI 提示允許 via
       QuestionGuide — all already true of this exact tab, LearningQuestionRuntime-
       backed, never writes WrongBook/History until a real submit). 正式測驗
       stays 正式測驗 (完成後公布答案／永久保存於 HistoryRuntime／錯題
       自動加入 WrongBook — all already true). "固定題序"/"固定時間" from
       the spec are NOT claimed here — Exam Mode's real order comes from
       AHS.QuestionRuntime.shuffleOrder(), called unconditionally inside
       the LOCKed js/runtime/ExamRuntime.js, and no timer feature exists;
       changing either would mean editing LOCKed Runtime/Question Engine
       code, which this Sprint's own LOCK forbids — flagged in the
       Sprint AI-118 report as a spec/LOCK conflict for Project Owner,
       not silently claimed as done.

       Renamed (later Sprint): 正式測驗 → 平時練習, 考前練習 →
       考前總複習 — both tabs now draw from the exact same real,
       already-imported question set per material (never a separate Mock
       pool): 平時練習 draws FORMAL_EXAM_QUESTION_COUNT via
       AHS.QuestionBankRuntime.drawCycle() (see tryDirectExamEntry()
       above), 考前總複習 still shows that same set's full question count
       (buildPracticeListView() below, unchanged). Every real
       characteristic this comment already documented above is otherwise
       unchanged — only the display names and 平時練習's per-attempt
       question count changed. */
    var examTab = el("button", {
      type: "button", class: "quiz-mode__tab" + (startOnPractice ? "" : " is-active"),
      text: "平時練習", "data-tip": "每次隨機抽 " + FORMAL_EXAM_QUESTION_COUNT + " 題・完成後公布答案・永久保存紀錄・錯題自動加入知識弱點"
    });
    var practiceTab = el("button", {
      type: "button", class: "quiz-mode__tab" + (startOnPractice ? " is-active" : ""),
      text: "考前總複習", "data-tip": "涵蓋題庫全部題目・可重複作答・答完立即看到詳解・不影響正式成績"
    });
    if (startOnPractice) { root.setAttribute("hidden", "hidden"); }
    examTab.addEventListener("click", function () {
      examTab.classList.add("is-active");
      practiceTab.classList.remove("is-active");
      root.removeAttribute("hidden");
      practiceRoot.setAttribute("hidden", "hidden");
    });
    practiceTab.addEventListener("click", function () {
      practiceTab.classList.add("is-active");
      examTab.classList.remove("is-active");
      root.setAttribute("hidden", "hidden");
      practiceRoot.removeAttribute("hidden");
    });
    var modeBar = el("div", { class: "quiz-mode", "aria-label": "測驗模式切換" }, [examTab, practiceTab]);

    return el("div", { class: "quiz-page" }, [modeBar, root, practiceRoot]);
  }

  return { create: create };
})();
