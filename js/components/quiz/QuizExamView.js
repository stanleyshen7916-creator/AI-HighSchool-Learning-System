/* js/components/quiz/QuizExamView.js — 測驗中心 (quiz.html), exam-taking view (incl. the 原始試卷 / AI 練習 toggle) and the result
   review view.

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
  var richExplanation = P.richExplanation;

  /* baseAssessmentExamId(examId) — Sprint AI-117 AI-117-08: strips the
     "__original"/"__ai" Assessment Mode suffix (see
     js/runtime/TeachingMaterialLoader.js's importAssessmentModeVariants())
     to recover the underlying teaching_material_<id> examId both mode
     variants share. */
  function baseAssessmentExamId(examId) {
    return String(examId || "").replace(/__original$|__ai$/, "");
  }

  /* baseFormalExamId(examId) — Sprint AI-145 (使用者需求：平時練習需支援
     當日多次進行，且不是同一組題目重複做): tryDirectExamEntry()'s own
     drawCycle branch (below) always derives its running examId as
     "<realExamId>__formal_<Date.now()>" before calling showExam() — the
     one place that suffix is ever produced. Recovering the original,
     undecorated examId from it (and ONLY it — returns null for any other
     shape, e.g. Mock catalog exams, __original/__ai Assessment Mode
     sessions, or __retest sessions) lets the Review screen offer a real
     "再次出題" action: call tryDirectExamEntry() again with that same
     real examId, which draws the NEXT batch from QuestionBankRuntime's
     already-persisted shuffled bag (drawCycle()'s own "never repeats
     until every question has been drawn once" guarantee) — never
     re-showing the exact same set on purpose, and never a second/parallel
     draw mechanism of its own. */
  function baseFormalExamId(examId) {
    var m = /^(.+)__formal_\d+$/.exec(String(examId || ""));
    return m ? m[1] : null;
  }

  /* assessmentModeToggle(session, onSwitchMode) — Sprint AI-117 AI-117-08
     Assessment Mode. Renders "□ 原始試卷 □ AI 練習" ONLY when this exam's
     base id genuinely has both real variants loaded (AHS.QuestionRuntime.
     hasExam() — never a fake/forced choice when a material only ever had
     one source of questions). "不得混用": each click abandons the
     currently-running session (never grades/records it — see
     ExamRuntime.abandon()'s own header) and starts a brand-new session
     scoped to exactly one mode's question set; the two modes' questions
     are never in QuestionRuntime under the same running examId at once. */
  function assessmentModeToggle(session, onSwitchMode) {
    if (typeof onSwitchMode !== "function") { return null; }
    if (!AHS.QuestionRuntime || typeof AHS.QuestionRuntime.hasExam !== "function") { return null; }
    var base = baseAssessmentExamId(session.examId);
    if (!/^teaching_material_/.test(base)) { return null; }
    var hasOriginal = AHS.QuestionRuntime.hasExam(base + "__original");
    var hasAi = AHS.QuestionRuntime.hasExam(base + "__ai");
    if (!hasOriginal || !hasAi) { return null; }
    var currentMode = session.examId === base + "__original" ? "original"
      : session.examId === base + "__ai" ? "ai" : null;

    function modeBtn(mode, label) {
      var btn = el("button", {
        type: "button",
        class: "qexam__mode-btn" + (currentMode === mode ? " is-active" : ""),
        "aria-pressed": currentMode === mode ? "true" : "false",
        text: (currentMode === mode ? "☑ " : "□ ") + label
      });
      btn.addEventListener("click", function () {
        if (currentMode !== mode) { onSwitchMode(base, mode); }
      });
      return btn;
    }

    return el("div", { class: "qexam__mode-toggle", role: "group", "aria-label": "Assessment Mode" }, [
      modeBtn("original", "原始試卷"),
      modeBtn("ai", "AI 練習")
    ]);
  }

  /* ---- Exam-taking view --------------------------------------------------
     session: ExamRuntime session record. rerender(): callback so the
     navigator/card can trigger a full re-render of this view after each
     interaction (selecting an answer, moving between questions).
     onSwitchMode(baseExamId, mode) — Sprint AI-117 AI-117-08, optional/
     additive: every existing caller that omits it keeps this view's
     exact prior behavior (assessmentModeToggle() returns null without
     it). onFinishEarly() — 完成測試 hotfix, optional/additive: passed
     straight through to QuestionNavigator so a "完成測試" button is
     always visible regardless of currentIndex; omitted entirely means
     no button renders (QuestionNavigator's own additive default). */
  function buildExamView(session, rerender, onFinish, onSwitchMode, onFinishEarly) {
    var questions = AHS.QuestionRuntime.getSet(session.examId);
    var currentQuestion = questions[session.currentIndex];
    var answers = AHS.AnswerRuntime.getAnswers(session.examId);
    var selected = answers[currentQuestion.id] != null ? answers[currentQuestion.id] : null;

    var card = AHS.QuestionCard.create(currentQuestion, selected, function (key) {
      AHS.AnswerRuntime.saveAnswer(session.examId, currentQuestion.id, key);
      rerender();
    });

    var nav = AHS.QuestionNavigator.create({
      total: questions.length,
      currentIndex: session.currentIndex,
      answeredIds: Object.keys(answers),
      questionIds: questions.map(function (q) { return q.id; }),
      onGoTo: function (index) { AHS.ExamRuntime.goTo(session.examId, index); rerender(); },
      onPrev: function () { AHS.ExamRuntime.prev(session.examId); rerender(); },
      onNext: function () { AHS.ExamRuntime.next(session.examId); rerender(); },
      onFinish: onFinish,
      onFinishEarly: onFinishEarly
    });

    var subj = AHS.Subjects[session.subject];
    var header = el("div", { class: "qexam__head" }, [
      el("span", {
        class: "qexam__subject",
        style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a",
        text: subj.name
      }),
      el("h1", { class: "qexam__title", text: session.title }),
      assessmentModeToggle(session, onSwitchMode)
    ].filter(Boolean));

    return el("div", { class: "qexam" }, [header, card, nav]);
  }

  /* ---- Review view --------------------------------------------------------
     review: ReviewRuntime view-model. onBack(): return to the exam list.
     onRetry() — Sprint AI-145, optional/additive: every existing caller
     that omits it keeps this view's exact prior behavior (只有返回測驗
     中心一個按鈕). When provided (finishExam()/finishExamEarly() below
     only ever pass it for a real drawCycle-drawn 平時練習 session — see
     baseFormalExamId() above), renders a second "再次出題" button so a
     student can immediately start another round the same day without
     leaving Quiz Center, using the exact same bank instead of a second,
     independently-invented draw. */
  function buildReviewView(review, onBack, onRetry) {
    var subj = AHS.Subjects[review.subject];

    var summary = el("section", { class: "card qreview__summary" }, [
      el("div", {
        class: "qreview__badge",
        style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a",
        text: subj.name
      }),
      el("h1", { class: "qreview__title", text: review.title }),
      el("div", { class: "qreview__score-row" }, [
        el("div", { class: "qreview__score" }, [
          el("strong", { text: review.score + " 分" }),
          el("span", { text: "本次得分" })
        ]),
        el("div", { class: "qreview__score" }, [
          el("strong", { text: review.accuracy + "%" }),
          el("span", { text: "正確率" })
        ]),
        el("div", { class: "qreview__score" }, [
          el("strong", { text: review.correctCount + " / " + review.totalCount }),
          el("span", { text: "答對題數" })
        ])
      ])
    ]);

    var list = el("div", { class: "qreview__list" },
      review.questions.map(function (q) {
        var toneHex = q.isCorrect ? "#22b573" : "#ef4444";
        return el("article", { class: "card qreview__item" }, [
          el("div", { class: "qreview__item-head" }, [
            el("span", {
              class: "qreview__mark", style: "color:" + toneHex + ";background-color:" + toneHex + "1a",
              html: q.isCorrect ? AHS.Icons.check() : AHS.Icons.wrong()
            }),
            el("span", { class: "qreview__item-index", text: "第 " + q.index + " 題" })
          ]),
          el("p", { class: "qreview__item-text", text: q.text }),
          /* Sprint AI-147（使用者需求：題目附圖）: real passthrough render
             only, same discipline as QuestionCard.js's own qcard__figure. */
          q.figureSvg ? el("div", { class: "qreview__item-figure", html: q.figureSvg }) : null,
          el("div", { class: "qreview__item-answers" }, [
            /* 2026-09-30: letters as displayed while answering (AHS.OptionOrder)
               plus the option text, instead of the bare original key. */
            el("span", { text: "你的答案：" + (AHS.OptionOrder ? AHS.OptionOrder.describe(q, q.yourAnswer) : (q.yourAnswer || "未作答")) }),
            el("span", { style: "color:" + toneHex + ";font-weight:700",
              text: "正確答案：" + (AHS.OptionOrder ? AHS.OptionOrder.describe(q, q.correctAnswer) : q.correctAnswer) })
          ]),
          /* 2026-10-01 數學詳解補強: richer worked solution with figures when
             one exists (AHS.ExplanationSupplement), else the original text. */
          richExplanation(q, q.explanation, "qreview__item-explain") ||
            el("p", { class: "qreview__item-explain", text: q.explanation })
        ]);
      }));

    var backBtn = el("button", { type: "button", class: "qreview__back" }, [
      el("span", { text: "返回測驗中心" })
    ]);
    backBtn.addEventListener("click", onBack);

    var retryBtn = null;
    if (typeof onRetry === "function") {
      retryBtn = el("button", { type: "button", class: "qreview__retry" }, [
        el("span", { text: "再次出題" })
      ]);
      retryBtn.addEventListener("click", onRetry);
    }

    var actions = el("div", { class: "qreview__actions" }, [retryBtn, backBtn].filter(Boolean));

    return el("div", { class: "qreview" }, [summary, list, actions]);
  }

  P.baseAssessmentExamId = baseAssessmentExamId;
  P.baseFormalExamId = baseFormalExamId;
  P.assessmentModeToggle = assessmentModeToggle;
  P.buildExamView = buildExamView;
  P.buildReviewView = buildReviewView;
})(AHS.QuizParts);
