/* js/components/quiz/QuizPracticeView.js — 測驗中心 (quiz.html), 考前總複習 (Practice Mode): list, question bodies, score summary and
   the practice session view.

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
  var richExplanation = P.richExplanation,
    difficultyBadge = P.difficultyBadge,
    chip = P.chip,
    difficultyRank = P.difficultyRank,
    resolveRealQuestionDifficulty = P.resolveRealQuestionDifficulty,
    filterByDifficulty = P.filterByDifficulty,
    repositoryExamCatalog = P.repositoryExamCatalog,
    materialIdFromExamId = P.materialIdFromExamId,
    realExamQuestionsFor = P.realExamQuestionsFor,
    isRealLearningQuestion = P.isRealLearningQuestion,
    isMaterialApproved = P.isMaterialApproved,
    wrongBookQuestionId = P.wrongBookQuestionId,
    statusIcon = P.statusIcon;

  function practiceEmptyState(forMaterialId) {
    var hint = forMaterialId
      ? "這份教材目前還沒有練習題，完成建立後會自動顯示於此。"
      : "請先上傳教材，AI 完成建立後練習題會自動顯示於此。";
    /* EO-S6.9-001 (PMO Ruling 5, 納入): mandated Empty State copy.
       Pure text change — the empty-state logic and the Task 004 [Stub]
       filter above are untouched. */
    return el("section", { class: "card quiz-practice__empty", "aria-label": "尚無練習題" }, [
      el("span", { class: "quiz-practice__empty-icon", html: AHS.Icons.quiz() }),
      el("p", { class: "quiz-practice__empty-title", text: "AI 正在建立練習題……" }),
      el("p", { class: "quiz-practice__empty-hint", text: hint })
    ]);
  }

  /* onRepoDrillDown(materialId) — Sprint AI-122 AI-122-02/03/10 (renamed
     from HOTFIX-005 AI-501's own onRepoExam): a Repository row, clicked
     from the unfiltered practice list, now drills into THAT material's
     own real question rows (below, via onRealPractice) — still inside
     Practice Mode — instead of switching to Formal Exam. "所有前往考前
     練習皆須進入 Practice Mode，不得再導向 Formal Exam" is read literally:
     this in-tab click is functionally the same CTA, so it gets the same
     fix, not just the external links.
     onRealPractice(question) — Sprint AI-122 AI-122-02/03: real,
     already-imported Exam-compatible questions (AHS.QuestionRuntime) for
     filterMaterialId, rendered as real practice rows alongside (in
     practice, instead of — LearningQuestionRuntime is honestly empty for
     every real Repository material) the LearningQuestionRuntime list
     below. This is the real content path AI-122 restores: a Repository-
     sourced material now has a genuine, inline, immediate-feedback
     Practice experience instead of being silently rerouted to Formal
     Exam.
     onOpenCombine() — Feature B, optional/additive: renders a "選擇多課
     合併複習" action inside the Repository 教材 section header, only
     when provided and only alongside that section (never shown once a
     single material is already drilled into — filterMaterialId gates
     the whole Repository section already, see repoEntries below). Every
     existing caller that omits this 7th param keeps this view's exact
     prior behavior.
     onBack() / onDifficultyChange(nextDifficulty) — Sprint AI-136:
     once filterMaterialId is set (drilled into a single material, from
     either the Repository catalog above or a materialId deep link),
     the student was previously stuck — no way back to the catalog / no
     way to change the difficulty they picked in 巧巧老師出題引導 without
     losing their place. Both are optional and rendered together as one
     toolbar, ABOVE every section (including the empty state) whenever
     filterMaterialId is set and at least one of them is provided —
     never gated on there being real questions to show, so a genuinely
     empty drill-down is still escapable, not a dead end. Every existing
     caller that omits these two trailing params keeps this view's
     exact prior behavior (no toolbar at all). */
  /* buildPracticeToolbar(onBack, difficulty, onDifficultyChange) —
     Sprint AI-136: the "回到選擇畫面" + "難易度" controls shown once a
     single material is drilled into (see buildPracticeListView's own
     call). Difficulty buttons reuse 巧巧老師出題引導's exact `qguide__diff`
     look (js/components/QuestionGuide.js) so the two pickers read as
     one system; unlike that picker, this one is never locked — clicking
     a different pill re-filters in place via onDifficultyChange, no
     re-navigation needed. "全部難度" (empty string) clears the filter,
     matching filterByDifficulty()'s own falsy-means-unfiltered contract. */
  function buildPracticeToolbar(onBack, difficulty, onDifficultyChange) {
    var children = [];
    if (typeof onBack === "function") {
      var backBtn = el("button", { type: "button", class: "quiz-practice__back", text: "← 返回上一步" });
      backBtn.addEventListener("click", onBack);
      children.push(backBtn);
    }
    if (typeof onDifficultyChange === "function") {
      var options = [
        { value: "", label: "全部難度" },
        { value: "easy", label: "易" },
        { value: "medium", label: "中等" },
        { value: "hard", label: "難" }
      ];
      var buttons = options.map(function (opt) {
        var isActive = (opt.value || null) === (difficulty || null);
        var b = el("button", {
          type: "button", class: "qguide__diff" + (isActive ? " is-active" : ""), text: opt.label
        });
        b.addEventListener("click", function () { onDifficultyChange(opt.value || null); });
        return b;
      });
      children.push(el("div", { class: "qguide__diffs quiz-practice__diffs", "aria-label": "難易度篩選" }, buttons));
    }
    return el("div", { class: "quiz-practice__toolbar" }, children);
  }

  function buildPracticeListView(onPractice, filterMaterialId, onRepoDrillDown, onRealPractice, statusFor, difficulty, onOpenCombine, onBack, onDifficultyChange) {
    var runtime = AHS.LearningQuestionRuntime;
    var allItems = (runtime && typeof runtime.list === "function") ? runtime.list() : [];
    var items = filterMaterialId
      ? (typeof runtime.findByMaterialId === "function"
          ? runtime.findByMaterialId(filterMaterialId)
          : allItems.filter(function (r) { return r.materialId === filterMaterialId; }))
      : allItems;
    /* Task 004: never render a [Stub] placeholder as a practice
       question — real records only, else the honest Empty State. */
    items = items.filter(isRealLearningQuestion);
    /* Sprint AI-132（使用者需求 A）：尚未審核的學生上傳教材，其練習題
       在這裡也必須誠實地不存在，不只是 Material Center 清單看不到。 */
    items = items.filter(function (r) { return isMaterialApproved(r.materialId); });
    /* Sprint AI-124 AI-124-09: real Difficulty gating — applied AFTER
       the [Stub] filter (never gates on a placeholder's own fabricated
       difficulty) and BEFORE the empty-state check below, so "0 real
       matches at this difficulty" and "0 real questions at all" are
       never conflated into the same message. */
    items = filterByDifficulty(items, difficulty, function (r) { return difficultyRank(r.difficulty); });
    /* Sprint AI-015E Part B · Production Cutover: Practice Mode now
       reads 100% from AHS.LearningQuestionRuntime — the Session merge
       (EO-S6.9-002) is removed. Wrong-answer resolution still reaches
       WrongBookGenerator correctly via wrongBookQuestionId()'s identity
       mapping, above.
       Sprint AI-118 AI-118-06 note (flagged, not silently skipped): the
       spec's "題號亂數" bullet is NOT applied to this list — it's a
       browsable, click-any-row list (not a sequential numbered exam
       flow, unlike Exam Mode's own real shuffleOrder()), and several
       existing BehaviorSuite tests assert a specific row index maps to
       LearningQuestionRuntime's own raw first record (`rows[idx]` ==
       `findByMaterialId(...)[idx]`) to drive answer-correctness
       assertions. Shuffling display order here would require rewriting
       every one of those tests the same way Sprint AI-117 had to for
       Exam Mode — a large, Runtime-adjacent ripple for a cosmetic
       requirement on a list, not a numbered sequence, so left as-is. */

    var repoEntries = (!filterMaterialId && typeof onRepoDrillDown === "function") ? repositoryExamCatalog() : [];
    var realQuestions = (filterMaterialId && typeof onRealPractice === "function")
      ? filterByDifficulty(realExamQuestionsFor(filterMaterialId), difficulty,
          function (q) { return difficultyRank(resolveRealQuestionDifficulty(q)); })
      : [];

    var toolbar = (filterMaterialId && (typeof onBack === "function" || typeof onDifficultyChange === "function"))
      ? buildPracticeToolbar(onBack, difficulty, onDifficultyChange)
      : null;

    if (!items.length && !repoEntries.length && !realQuestions.length) {
      var emptyChildren = [practiceEmptyState(filterMaterialId)];
      if (toolbar) { emptyChildren.unshift(toolbar); }
      return el("div", { class: "quiz-practice" }, emptyChildren);
    }

    var sections = [];
    if (toolbar) { sections.push(toolbar); }

    if (repoEntries.length) {
      var repoRows = repoEntries.map(function (entry) {
        var subj = AHS.Subjects[entry.subject] || { name: entry.subject || "未分類", hex: "#6b7280" };
        /* 2026-09-30: the chapter is usually already part of the title —
           repeating it made the meta so long it squeezed the title to a
           couple of characters. Full text stays available as a tooltip. */
        var repoShowChapter = entry.chapter && String(entry.title || "").indexOf(entry.chapter) === -1;
        var repoMeta = (repoShowChapter ? entry.chapter : "") + "（共 " + entry.count + " 題）";
        var row = el("button", { type: "button", class: "quiz-practice__row", title: entry.title + "　" + repoMeta }, [
          el("span", {
            class: "chip", style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
          }, [el("span", { text: subj.name })]),
          el("span", { class: "quiz-practice__row-q", text: entry.title }),
          el("span", { class: "quiz-practice__row-meta", text: repoMeta }),
          el("span", { class: "quiz-practice__row-arrow", html: AHS.Icons.chevronRight() })
        ]);
        row.addEventListener("click", function () { onRepoDrillDown(materialIdFromExamId(entry._repoExamId)); });
        return row;
      });
      var repoHead = [el("h2", { class: "card__title", text: "Repository 教材（" + repoEntries.length + "）" })];
      if (typeof onOpenCombine === "function") {
        var combineBtn = el("button", {
          type: "button", class: "quiz-combine-btn quiz-combine-btn--sm", text: "選擇多課合併複習"
        });
        combineBtn.addEventListener("click", onOpenCombine);
        repoHead.push(combineBtn);
      }
      sections.push(el("section", { class: "card quiz-practice__list", "aria-label": "Repository 教材" }, [
        el("div", { class: "card__head" }, repoHead),
        el("div", { class: "quiz-practice__rows" }, repoRows)
      ]));
    }

    if (realQuestions.length) {
      var realRows = realQuestions.map(function (q, qIndex) {
        var subj = AHS.Subjects[q.subject] || { name: q.subject || "未分類", hex: "#6b7280" };
        var row = el("button", { type: "button", class: "quiz-practice__row" }, [
          statusFor ? statusIcon(statusFor("real", q.id)) : null,
          el("span", {
            class: "chip", style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
          }, [el("span", { text: subj.name })]),
          difficultyBadge(resolveRealQuestionDifficulty(q)),
          el("span", { class: "quiz-practice__row-q", text: q.text }),
          el("span", { class: "quiz-practice__row-meta", text: q.knowledgePoint || "" }),
          el("span", { class: "quiz-practice__row-arrow", html: AHS.Icons.chevronRight() })
        ].filter(function (n) { return n; }));
        row.addEventListener("click", function () { onRealPractice(q, realQuestions, qIndex); });
        return row;
      });
      sections.push(el("section", { class: "card quiz-practice__list", "aria-label": "練習題列表" }, [
        el("div", { class: "card__head" }, [
          el("h2", { class: "card__title", text: "練習題（" + realQuestions.length + "）" })
        ]),
        el("div", { class: "quiz-practice__rows" }, realRows)
      ]));
    }

    if (items.length) {
      var rows = items.map(function (record, rIndex) {
        var subj = AHS.Subjects[record.subject] || { name: record.subject || "未分類", hex: "#6b7280" };
        var row = el("button", { type: "button", class: "quiz-practice__row" }, [
          statusFor ? statusIcon(statusFor("legacy", record.id)) : null,
          el("span", {
            class: "chip", style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
          }, [el("span", { text: subj.name })]),
          difficultyBadge(record.difficulty),
          el("span", { class: "quiz-practice__row-q", text: record.question || "（尚無題目）" }),
          el("span", { class: "quiz-practice__row-meta", text: record.knowledgePoint || record.chapter || "" }),
          el("span", { class: "quiz-practice__row-arrow", html: AHS.Icons.chevronRight() })
        ].filter(function (n) { return n; }));
        row.addEventListener("click", function () { onPractice(record, items, rIndex); });
        return row;
      });
      sections.push(el("section", { class: "card quiz-practice__list", "aria-label": "練習題列表" }, [
        el("div", { class: "card__head" }, [
          el("h2", { class: "card__title", text: "練習題（" + items.length + "）" })
        ]),
        el("div", { class: "quiz-practice__rows" }, rows)
      ]));
    }

    return el("div", { class: "quiz-practice" }, sections);
  }

  /* EO-S7.0-002 · Wrong Book Runtime Integration hook — the ONLY new
     step appended after answer check: wrong answer → WrongBookGenerator
     .add() (Interface, sole write path; its data source is exclusively
     LearningQuestionSession — unchanged, LOCK). Since Sprint AI-015E,
     `rec` is always a LearningQuestionRuntime record (Production
     Cutover); wrongBookQuestionId() maps it to its real Session sibling
     first, above. A record with no Session sibling still honestly
     returns null from add() — no fake wrong-book entry can appear,
     exactly as before. On success: Review Queue upsert with
     runtime-derived values only: priority = wrongCount (real data, not
     inference), nextReviewAt = null (no scheduling EO exists — 不得自動
     排程/AI 推論). Exam Mode's AnswerRuntime / AutoGrader (Score &
     Answer Logic) are untouched. */
  function wrongBookHook(rec, userAnswer) {
    if (!AHS.WrongBookGenerator || typeof AHS.WrongBookGenerator.add !== "function") { return; }
    var wb = AHS.WrongBookGenerator.add({ questionId: wrongBookQuestionId(rec), userAnswer: userAnswer });
    if (wb && AHS.ReviewQueue && typeof AHS.ReviewQueue.enqueue === "function") {
      AHS.ReviewQueue.enqueue({
        questionId: wb.questionId,
        masteryLevel: wb.masteryLevel,
        priority: wb.wrongCount,
        nextReviewAt: null
      });
    }
  }

  /* Deterministic answer check — string/set comparison only, no AI. */
  function answersMatch(expected, given) {
    function key(v) {
      if (Array.isArray(v)) { return v.map(function (x) { return String(x).trim(); }).sort().join("||"); }
      return (v === undefined || v === null) ? "" : String(v).trim();
    }
    return key(expected) === key(given) && key(given) !== "";
  }

  /* renderLegacyQuestionBody(record, onAnswered) — Sprint AI-123
     AI-123-01/08: the answering body extracted from the former
     buildPracticeQuestionView() (which used to be mounted directly as
     the list's own "Detail Panel" / 主要作答區, per AI-123-08's own
     description of the pre-Sprint state). Now body-only — no back
     button, no outer .quiz-practice wrapper — so the full-screen
     Practice View (buildPracticeSessionView, below) is the only surface
     that ever mounts it. onAnswered(id, isCorrect) is the one new hook:
     lets the Practice View update its own session-scoped answered-state
     (for the list's ✔/✘/○ status icons, AI-123-05/06) without this
     function knowing anything about that state itself. The grading /
     WrongBookGenerator sync logic below is byte-for-byte the same as
     before — AI-123-13 forbids touching WrongBook Logic, only its
     surrounding View. */
  function renderLegacyQuestionBody(record, onAnswered) {
    var answerSlot = el("div", { class: "quiz-practice__answer", hidden: "hidden" });
    var resultBanner = el("p", { class: "quiz-practice__result", "aria-live": "polite", hidden: "hidden" });
    var submitted = false;

    function expBlock(title, items) {
      var list = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!list.length) { return null; }
      return el("div", { class: "quiz-practice__exp-block" }, [
        el("strong", { class: "quiz-practice__exp-title", text: title }),
        el("ul", { class: "quiz-practice__exp-list" },
          list.map(function (t) { return el("li", { text: String(t) }); }))
      ]);
    }

    function renderAnswer() {
      answerSlot.innerHTML = "";
      var exp = record.explanation || {};
      answerSlot.appendChild(el("div", { class: "quiz-practice__answer-block" }, [
        el("strong", { text: "標準答案：" }),
        el("span", { text: String(record.answer) })
      ]));
      /* EO-S6.9-002: Schema v1.0 records carry a STRING explanation;
         EO-S6-004 records carry the structured object. Render both —
         display-layer compatibility only, neither schema is altered. */
      if (typeof exp === "string") {
        [expBlock("詳解", exp ? [exp] : [])]
          .filter(Boolean).forEach(function (node) { answerSlot.appendChild(node); });
      } else {
        [
          expBlock("解題步驟", exp.steps),
          expBlock("為什麼答案正確", exp.whyCorrect ? [exp.whyCorrect] : []),
          expBlock("其他選項錯誤原因", exp.whyOthersWrong),
          expBlock("常見錯誤", exp.commonMistakes),
          expBlock("解題技巧", exp.tips)
        ].filter(Boolean).forEach(function (node) { answerSlot.appendChild(node); });
      }
      if (record.knowledgePoint) {
        answerSlot.appendChild(el("p", { class: "quiz-practice__meta", text: "考點：" + record.knowledgePoint }));
      }
      if (record.learningObjective) {
        answerSlot.appendChild(el("p", { class: "quiz-practice__meta", text: "學習目標：" + record.learningObjective }));
      }
      answerSlot.removeAttribute("hidden");
    }

    /* EO-S7.0-002 · Practice Submit → Answer Check → (wrong) Wrong Book.
       Practice Mode previously had a reveal-only flow (answering existed
       solely in Exam Mode); the EO's fixed Runtime Flow requires a
       Submit step here, so a minimal, fully deterministic interaction is
       added per question type. Grading result is shown, then the full
       answer/explanation — and only a WRONG submit triggers the hook. */
    function finishSubmit(isCorrect, userAnswer) {
      if (submitted) { return; }
      submitted = true;
      resultBanner.textContent = isCorrect ? "答對了！" : "答錯了，已加入知識弱點。";
      resultBanner.classList.add(isCorrect ? "is-correct" : "is-wrong");
      resultBanner.removeAttribute("hidden");
      renderAnswer();
      if (!isCorrect) { wrongBookHook(record, userAnswer); }
      onAnswered(record.id, isCorrect);
    }

    var interaction;
    var type = String(record.questionType || "");

    if ((type === "single_choice" || type === "true_false") && record.options && record.options.length) {
      /* Single pick — submitting the pick IS the answer check. */
      var singleBtns = record.options.map(function (opt) {
        var b = el("button", { type: "button", class: "quiz-practice__option quiz-practice__option--btn", text: String(opt) });
        b.addEventListener("click", function () {
          if (submitted) { return; }
          singleBtns.forEach(function (x) { x.classList.remove("is-picked"); });
          b.classList.add("is-picked");
          finishSubmit(answersMatch(record.answer, opt), String(opt));
        });
        return b;
      });
      interaction = el("div", { class: "quiz-practice__options" }, singleBtns);
    } else if (type === "multiple_choice" && record.options && record.options.length) {
      var picked = {};
      var multiBtns = record.options.map(function (opt) {
        var b = el("button", { type: "button", class: "quiz-practice__option quiz-practice__option--btn", text: String(opt) });
        b.addEventListener("click", function () {
          if (submitted) { return; }
          picked[opt] = !picked[opt];
          b.classList.toggle("is-picked", !!picked[opt]);
        });
        return b;
      });
      var multiSubmit = el("button", { type: "button", class: "quiz-practice__submit", text: "提交作答" });
      multiSubmit.addEventListener("click", function () {
        var chosen = Object.keys(picked).filter(function (k) { return picked[k]; });
        if (!chosen.length) { return; }
        finishSubmit(answersMatch(record.answer, chosen), chosen);
      });
      interaction = el("div", { class: "quiz-practice__options" }, multiBtns.concat([multiSubmit]));
    } else if (type === "fill_blank") {
      var input = el("input", { type: "text", class: "quiz-practice__input", placeholder: "填入答案" });
      var fbSubmit = el("button", { type: "button", class: "quiz-practice__submit", text: "提交作答" });
      fbSubmit.addEventListener("click", function () {
        if (!input.value.trim()) { return; }
        finishSubmit(answersMatch(record.answer, input.value), input.value.trim());
      });
      interaction = el("div", { class: "quiz-practice__fill" }, [input, fbSubmit]);
    } else {
      /* short_answer (and any legacy record without options): free
         answers can't be machine-graded deterministically — the student
         writes an answer, reveals the standard answer, and self-assesses.
         The self-assessment is the Answer Check for this type; a typed
         answer is recorded, an empty one is recorded truthfully as
         「（未作答）」— never fabricated. */
      var saInput = el("textarea", { class: "quiz-practice__input quiz-practice__input--area", placeholder: "寫下你的答案（自評用）" });
      var saReveal = el("button", { type: "button", class: "quiz-practice__reveal", text: "顯示解答並自評" });
      var saAssess = el("div", { class: "quiz-practice__assess", hidden: "hidden" }, [
        el("span", { class: "quiz-practice__assess-label", text: "對照標準答案，你答對了嗎？" })
      ]);
      var okBtn = el("button", { type: "button", class: "quiz-practice__submit", text: "我答對了" });
      var noBtn = el("button", { type: "button", class: "quiz-practice__submit quiz-practice__submit--wrong", text: "我答錯了" });
      okBtn.addEventListener("click", function () { finishSubmit(true, saInput.value.trim() || "（未作答）"); });
      noBtn.addEventListener("click", function () { finishSubmit(false, saInput.value.trim() || "（未作答）"); });
      saAssess.appendChild(okBtn); saAssess.appendChild(noBtn);
      saReveal.addEventListener("click", function () {
        renderAnswer();
        saAssess.removeAttribute("hidden");
        saReveal.setAttribute("hidden", "hidden");
      });
      interaction = el("div", { class: "quiz-practice__self" }, [saInput, saReveal, saAssess]);
    }

    return el("section", { class: "card quiz-practice__question", "aria-label": "練習題" },
      [
        el("p", { class: "quiz-practice__q-text", text: record.question }),
        interaction,
        resultBanner,
        answerSlot
      ].filter(Boolean));
  }

  /* renderRealQuestionBody(q, onAnswered) — Sprint AI-122 AI-122-02/03's
     buildRealPracticeQuestionView, reworked by Sprint AI-123 AI-123-01/08
     the same way renderLegacyQuestionBody() above was: body-only (no
     back button, no outer wrapper), mounted exclusively by the
     full-screen Practice View now. Grading / WrongBookRuntime.sync() /
     KnowledgeMasteryRuntime.recordAttempt() calls are byte-for-byte
     unchanged from before — still the same real Knowledge Engine calls,
     still read-only against their own already-existing public API, per
     this Sprint's own LOCK (AI-123-13). onAnswered(id, isCorrect) is the
     one new hook, same purpose as renderLegacyQuestionBody's. */
  function renderRealQuestionBody(q, onAnswered) {
    var resultBanner = el("p", { class: "quiz-practice__result", "aria-live": "polite", hidden: "hidden" });
    var answerSlot = el("div", { class: "quiz-practice__answer", hidden: "hidden" });
    var submitted = false;
    var optionBtns;

    function renderAnswer() {
      answerSlot.innerHTML = "";
      answerSlot.appendChild(el("div", { class: "quiz-practice__answer-block" }, [
        el("strong", { text: "標準答案：" }),
        el("span", { text: AHS.OptionOrder ? AHS.OptionOrder.describe(q, q.correctAnswer) : q.correctAnswer })
      ]));
      var rich = richExplanation(q, q.explanation, "quiz-practice__exp-rich");
      if (q.explanation || rich) {
        answerSlot.appendChild(el("div", { class: "quiz-practice__exp-block" }, [
          el("strong", { class: "quiz-practice__exp-title", text: "詳解" }),
          rich || el("p", { text: q.explanation })
        ]));
      }
      answerSlot.removeAttribute("hidden");
    }

    function syncRealPracticeAnswer(isCorrect, pickedKey) {
      if (!isCorrect && AHS.WrongBookRuntime && typeof AHS.WrongBookRuntime.sync === "function") {
        AHS.WrongBookRuntime.sync({
          subject: q.subject, title: q.text, chapter: q.knowledgePoint || "",
          wrong: [{
            questionId: q.id, knowledgePoint: q.knowledgePoint,
            text: q.text, options: q.options,
            yourAnswer: pickedKey, correctAnswer: q.correctAnswer,
            explanation: q.explanation, materialId: q.materialId
          }]
        });
      }
      if (AHS.KnowledgeMasteryRuntime && typeof AHS.KnowledgeMasteryRuntime.recordAttempt === "function") {
        AHS.KnowledgeMasteryRuntime.recordAttempt(q.knowledgePoint, isCorrect, q.subject, q.materialId);
      }
    }

    function finishSubmit(pickedKey) {
      if (submitted) { return; }
      submitted = true;
      var isCorrect = pickedKey === q.correctAnswer;
      resultBanner.textContent = isCorrect ? "答對了！" : "答錯了，已加入知識弱點。";
      resultBanner.classList.add(isCorrect ? "is-correct" : "is-wrong");
      resultBanner.removeAttribute("hidden");
      optionBtns.forEach(function (b) {
        if (b.dataset.key === q.correctAnswer) { b.classList.add("is-correct"); }
        if (b.dataset.key === pickedKey && pickedKey !== q.correctAnswer) { b.classList.add("is-wrong"); }
      });
      renderAnswer();
      syncRealPracticeAnswer(isCorrect, pickedKey);
      onAnswered(q.id, isCorrect);
    }

    /* 2026-09-30: fixed per-question display order (AHS.OptionOrder);
       data-key keeps the ORIGINAL key. */
    var displayedOptions = AHS.OptionOrder ? AHS.OptionOrder.order(q)
      : (q.options || []).map(function (o) { return { key: o.key, text: o.text, label: o.key }; });
    optionBtns = displayedOptions.map(function (o) {
      var b = el("button", {
        type: "button", class: "quiz-practice__option quiz-practice__option--btn", "data-key": o.key
      }, [el("span", { text: o.label + "、" + o.text })]);
      b.addEventListener("click", function () { finishSubmit(o.key); });
      return b;
    });

    /* Sprint AI-122 AI-122-02: 難度／考點 always visible (not gated behind
       submit), matching Exam Mode's own .qcard__meta convention exactly —
       including its HOTFIX-004 resolveDifficulty() fallback (js/ui/
       QuestionCard.js): 難度 never survived into QuestionRuntime's own
       stored shape (TeachingMaterialLoader.js's Loader is explicitly
       protected, this Sprint's LOCK forbids touching it too), so it's
       resolved the same read-only way — via the real Repository record,
       matched by this question's own real id. */
    var metaBits = [];
    var difficulty = resolveRealQuestionDifficulty(q);
    if (difficulty) { metaBits.push("難度：" + difficulty); }
    if (q.knowledgePoint) { metaBits.push("考點：" + q.knowledgePoint); }

    return el("section", { class: "card quiz-practice__question", "aria-label": "練習題" }, [
      el("p", { class: "quiz-practice__q-text", text: q.text }),
      metaBits.length ? el("p", { class: "quiz-practice__meta", text: metaBits.join("　") }) : null,
      el("div", { class: "quiz-practice__options" }, optionBtns),
      resultBanner,
      answerSlot
    ]);
  }

  /* practiceHeaderMeta(materialId, sampleQuestion) — AI-123-02's real
     科目／章節 source: read-only against repositoryExamCatalog() (already
     existing, already real) when this practice set is scoped to one
     Repository material; falls back to the sample question/record's own
     subject/chapter field otherwise. Never fabricated — an unresolvable
     chapter is simply omitted from the header, not guessed. */
  function practiceHeaderMeta(materialId, sample) {
    var subjectKey = (sample && sample.subject) || "";
    var chapterLabel = (sample && sample.chapter) || "";
    if (materialId) {
      var catalog = repositoryExamCatalog();
      for (var i = 0; i < catalog.length; i += 1) {
        if (materialIdFromExamId(catalog[i]._repoExamId) === materialId) {
          subjectKey = catalog[i].subject || subjectKey;
          chapterLabel = catalog[i].chapter || chapterLabel;
          break;
        }
      }
    }
    var subjectName = (subjectKey && AHS.Subjects[subjectKey]) ? AHS.Subjects[subjectKey].name : subjectKey;
    return { subjectName: subjectName || "", chapterLabel: chapterLabel || "" };
  }

  /* buildScoreSummaryView(results, actions) — AI-123-04: 完成測驗 ->
     成績摘要 -> 返回題目列表, never straight back to Home/Material Center
     (AI-123-09 — no such buttons exist here to begin with). results:
     { correct, total, newWrongToday, masteryPercent }. masteryPercent is
     null (rendered as "尚無資料", never a fabricated number) when none of
     this set's questions carry a real knowledgePoint AHS.
     KnowledgeMasteryRuntime has ever recorded an attempt for. */
  function buildScoreSummaryView(results, actions) {
    var accuracy = results.total ? Math.round((results.correct / results.total) * 100) : 0;
    var wrongCount = Math.max(0, results.total - results.correct);

    var backBtn = el("button", { type: "button", class: "qpv-summary__btn qpv-summary__btn--primary", text: "返回題目列表" });
    backBtn.addEventListener("click", function () { actions.onBackToList(); });
    var retestBtn = el("button", { type: "button", class: "qpv-summary__btn", text: "再次測驗" });
    retestBtn.addEventListener("click", function () { actions.onRetest(); });
    var wrongBookLink = el("a", { class: "qpv-summary__btn qpv-summary__btn--link", href: "wrongbook.html", text: "前往知識弱點" });

    return el("div", { class: "qpv-summary" }, [
      el("h2", { class: "qpv-summary__title", text: "成績摘要" }),
      el("div", { class: "qpv-summary__score-row" }, [
        el("div", { class: "qpv-summary__score" }, [
          el("strong", { text: results.correct + " / " + results.total }),
          el("span", { text: "本次" })
        ]),
        el("div", { class: "qpv-summary__score" }, [
          el("strong", { text: accuracy + "%" }),
          el("span", { text: "答對率" })
        ]),
        el("div", { class: "qpv-summary__score" }, [
          el("strong", { text: String(results.correct) }),
          el("span", { text: "答對題數" })
        ]),
        el("div", { class: "qpv-summary__score" }, [
          el("strong", { text: String(wrongCount) }),
          el("span", { text: "答錯題數" })
        ])
      ]),
      el("div", { class: "qpv-summary__extra" }, [
        el("div", { class: "qpv-summary__extra-item" }, [
          el("span", { class: "qpv-summary__extra-label", text: "今日新增錯題" }),
          el("strong", { text: String(results.newWrongToday) })
        ]),
        el("div", { class: "qpv-summary__extra-item" }, [
          el("span", { class: "qpv-summary__extra-label", text: "Knowledge Mastery" }),
          el("strong", { text: results.masteryPercent === null ? "尚無資料" : results.masteryPercent + "%" })
        ])
      ]),
      el("div", { class: "qpv-summary__actions" }, [backBtn, retestBtn, wrongBookLink])
    ]);
  }

  /* buildPracticeSessionView(session, actions) — the full-screen Practice
     View itself. session: { kind: "real"|"legacy", questions, startIndex,
     headerMeta, statusFor(kind,id), onAnswered(id,isCorrect) }.
     actions: { onExit(), onRetest() }.

     AI-123-03/09: back button top-left, always returns to the original
     question list — never Home/Material Center (no such link exists in
     this view). AI-123-12: leaving with unanswered questions remaining
     shows a real confirm prompt first ("尚有 N 題未完成"); progress itself
     (session.statusFor's own backing store, owned by create()'s closure)
     is never cleared by opening/closing this view, only by an explicit
     再次測驗. AI-123-07: every renderQuestion() call builds a brand new
     renderLegacyQuestionBody()/renderRealQuestionBody() — submitted always
     starts false, so revisiting an already-completed question always
     restarts the answer flow; it never jumps straight to the old
     answer. */
  function buildPracticeSessionView(session, actions) {
    var kind = session.kind;
    var questions = session.questions;
    var total = questions.length;
    var index = session.startIndex || 0;

    /* beforeState — a snapshot of this set's answered state at the
       moment this Practice View opened, so finish() can tell "newly
       wrong this run" (AI-123-04's 今日新增錯題) apart from a wrong
       answer this student already had going in. */
    var beforeState = {};
    questions.forEach(function (q) { beforeState[q.id] = session.statusFor(kind, q.id); });

    var overlay = el("div", { class: "qpv-overlay", role: "dialog", "aria-modal": "true", "aria-label": "考前總複習" });
    var shell = el("div", { class: "qpv" });
    var confirmOverlay = el("div", { class: "qpv-confirm-overlay", hidden: "hidden" });

    function unansweredCount() {
      var n = 0;
      questions.forEach(function (q) { if (!session.statusFor(kind, q.id)) { n += 1; } });
      return n;
    }

    function hideConfirm() { confirmOverlay.setAttribute("hidden", "hidden"); }

    function showConfirm(remaining) {
      var continueBtn = el("button", { type: "button", class: "qpv-confirm__btn qpv-confirm__btn--primary", text: "繼續作答" });
      continueBtn.addEventListener("click", hideConfirm);
      var leaveBtn = el("button", { type: "button", class: "qpv-confirm__btn", text: "返回列表" });
      leaveBtn.addEventListener("click", function () { hideConfirm(); actions.onExit(); });
      AHS.UI.mount(confirmOverlay, el("div", { class: "qpv-confirm", role: "alertdialog", "aria-label": "尚未完成" }, [
        el("p", { class: "qpv-confirm__text", text: "尚有 " + remaining + " 題未完成。是否返回？" }),
        el("div", { class: "qpv-confirm__actions" }, [continueBtn, leaveBtn])
      ]));
      confirmOverlay.removeAttribute("hidden");
    }

    function requestExit() {
      var remaining = unansweredCount();
      if (remaining > 0) { showConfirm(remaining); return; }
      actions.onExit();
    }

    var backBtn = el("button", { type: "button", class: "qpv__back", text: "← 返回題目列表" });
    backBtn.addEventListener("click", requestExit);
    var titleEl = el("div", { class: "qpv__title" });
    var head = el("header", { class: "qpv__head" }, [backBtn, titleEl]);

    var body = el("div", { class: "qpv__body" });
    var prevBtn = el("button", { type: "button", class: "qpv__prev", text: "上一題" });
    var nextBtn = el("button", { type: "button", class: "qpv__next", text: "下一題" });
    var footer = el("div", { class: "qpv__footer" }, [prevBtn, nextBtn]);

    function updateHead() {
      titleEl.textContent = [session.headerMeta.subjectName, session.headerMeta.chapterLabel, "考前總複習",
        "第 " + (index + 1) + " / " + total + " 題"].filter(function (s) { return s; }).join("／");
      prevBtn.disabled = index === 0;
      nextBtn.textContent = index === total - 1 ? "完成測驗" : "下一題";
    }

    function renderQuestion() {
      updateHead();
      var q = questions[index];
      var onAnswered = function (id, isCorrect) { session.onAnswered(id, isCorrect); };
      AHS.UI.mount(body, kind === "real" ? renderRealQuestionBody(q, onAnswered) : renderLegacyQuestionBody(q, onAnswered));
    }

    prevBtn.addEventListener("click", function () {
      if (index === 0) { return; }
      index -= 1;
      renderQuestion();
    });
    nextBtn.addEventListener("click", function () {
      if (index < total - 1) { index += 1; renderQuestion(); return; }
      finish();
    });

    /* finish() — AI-123-04: real, computed-only score summary. Every
       number here is derived from session.statusFor (this Sprint's own
       in-memory session tracker, see create()'s answerStatusFor/
       setAnswerStatus below) or AHS.KnowledgeMasteryRuntime's own already-
       real per-knowledge-point mastery — never fabricated. An unanswered
       question at finish time counts toward 答錯題數 (a real, honest
       reflection of "this exam wasn't completed", the same way a blank
       exam answer is marked wrong — flagged in the EO report as a
       judgment call, since the PAT spec's own example has no separate
       "未作答" bucket). */
    function finish() {
      var correct = 0;
      var newWrongToday = 0;
      var kpSeen = {};
      questions.forEach(function (q) {
        var status = session.statusFor(kind, q.id);
        if (status === "correct") { correct += 1; }
        if (status === "wrong" && beforeState[q.id] !== "wrong") { newWrongToday += 1; }
        if (q.knowledgePoint) { kpSeen[q.knowledgePoint] = true; }
      });
      var masteryPercent = null;
      var kpList = Object.keys(kpSeen);
      if (kpList.length && AHS.KnowledgeMasteryRuntime && typeof AHS.KnowledgeMasteryRuntime.get === "function") {
        var sum = 0, n = 0;
        kpList.forEach(function (kp) {
          var rec = AHS.KnowledgeMasteryRuntime.get(kp);
          if (rec && typeof rec.mastery === "number") { sum += rec.mastery; n += 1; }
        });
        if (n) { masteryPercent = Math.round(sum / n); }
      }
      AHS.UI.mount(shell, buildScoreSummaryView(
        { correct: correct, total: total, newWrongToday: newWrongToday, masteryPercent: masteryPercent },
        { onBackToList: actions.onExit, onRetest: actions.onRetest }
      ));
    }

    renderQuestion();
    shell.appendChild(head);
    shell.appendChild(body);
    shell.appendChild(footer);
    overlay.appendChild(shell);
    overlay.appendChild(confirmOverlay);
    return overlay;
  }

  P.practiceEmptyState = practiceEmptyState;
  P.buildPracticeToolbar = buildPracticeToolbar;
  P.buildPracticeListView = buildPracticeListView;
  P.wrongBookHook = wrongBookHook;
  P.answersMatch = answersMatch;
  P.renderLegacyQuestionBody = renderLegacyQuestionBody;
  P.renderRealQuestionBody = renderRealQuestionBody;
  P.practiceHeaderMeta = practiceHeaderMeta;
  P.buildScoreSummaryView = buildScoreSummaryView;
  P.buildPracticeSessionView = buildPracticeSessionView;
})(AHS.QuizParts);
