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
  var el = AHS.UI.el;

  var DIFF_TONE = { "易": "#22b573", "易~中等": "#22b573", "中等": "#f59e0b", "難": "#ef4444" };

  function chip(subjectKey) {
    var subj = AHS.Subjects[subjectKey];
    return el("span", {
      class: "chip",
      style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
    }, [el("span", { text: subj.name })]);
  }

  /* ---- Banner ---------------------------------------------------------- */
  function banner(data) {
    return el("section", { class: "quiz-banner", "aria-label": data.title }, [
      el("div", { class: "quiz-banner__text" }, [
        el("h1", { class: "quiz-banner__title", text: data.title }),
        el("p", { class: "quiz-banner__en", text: data.titleEn }),
        el("p", { class: "quiz-banner__subtitle", text: data.subtitle })
      ]),
      el("div", {
        class: "quiz-banner__figure qiaoqiao-bust qiaoqiao-bust--xl",
        html: AHS.Qiaoqiao.bust("cheer")
      })
    ]);
  }

  /* ---- Filter bar --------------------------------------------------------
     Sprint 4.1 · Quiz Filter Integration: every control now carries its
     current value (so re-rendering the filter bar — e.g. after a subject
     change resets 章節 — doesn't lose the other selections) and reports
     changes via onChange. Filter State itself lives in QuizCenter's
     create()/buildListView() closure (see `state` below) — no new Runtime,
     no new global. */
  function filterBar(data, state, chapterOptions, handlers) {
    var subjChips = el("div", { class: "quiz-filter__subjects" },
      data.subjects.map(function (id) {
        var label = id === "all" ? "全部科目" : AHS.Subjects[id].name;
        var b = el("button", {
          type: "button",
          class: "quiz-filter__subject" + (id === state.subject ? " is-active" : ""),
          "data-id": id, text: label
        });
        b.addEventListener("click", function () {
          var sibs = subjChips.querySelectorAll(".quiz-filter__subject");
          Array.prototype.forEach.call(sibs, function (s) { s.classList.remove("is-active"); });
          b.classList.add("is-active");
          handlers.onSubject(id);
        });
        return b;
      }));

    function select(label, options, currentValue, onChange) {
      var sel = el("select", { class: "quiz-select__control", "aria-label": label },
        options.map(function (o) {
          return el("option", { text: o, selected: o === currentValue ? "selected" : null });
        }));
      if (typeof onChange === "function") {
        sel.addEventListener("change", function () { onChange(sel.value); });
      }
      return el("label", { class: "quiz-select" }, [
        el("span", { class: "quiz-select__label", text: label }),
        sel
      ]);
    }

    var toggle = el("button", {
      type: "button", class: "quiz-toggle", "aria-pressed": state.onlyIncomplete ? "true" : "false"
    }, [
      el("span", { class: "quiz-toggle__track" }, [
        el("span", { class: "quiz-toggle__thumb" })
      ]),
      el("span", { class: "quiz-toggle__label", text: "只看未完成" })
    ]);
    toggle.addEventListener("click", function () {
      var on = toggle.getAttribute("aria-pressed") === "true";
      toggle.setAttribute("aria-pressed", on ? "false" : "true");
      handlers.onToggleIncomplete(!on);
    });

    return el("div", { class: "quiz-filter card" }, [
      el("div", { class: "quiz-filter__row" }, [
        el("span", { class: "quiz-filter__caption", text: "科目" }),
        subjChips
      ]),
      el("div", { class: "quiz-filter__row quiz-filter__row--controls" }, [
        select("年級", data.gradeOptions, state.grade, handlers.onGrade),
        select("章節", chapterOptions, state.chapter, handlers.onChapter),
        select("難易度", data.difficulties, state.difficulty, handlers.onDifficulty),
        select("題型", data.types, state.type, handlers.onType),
        toggle,
        select("排序", data.sorts, state.sort, handlers.onSort)
      ])
    ]);
  }

  /* ---- Quiz row -------------------------------------------------------- */
  function quizRow(item, status, onStart) {
    var subj = AHS.Subjects[item.subject];
    var diffTone = DIFF_TONE[item.difficulty] || "#6b7280";

    var actionBtn = el("button", { type: "button", class: "quiz-row__start" }, [
      el("span", { html: AHS.Icons.play() }),
      el("span", { text: item.done ? "重新測驗" : "開始測驗" })
    ]);
    actionBtn.addEventListener("click", function () { onStart(item); });

    var more = el("button", {
      type: "button", class: "quiz-row__more",
      "aria-label": "更多", html: AHS.Icons.more()
    });
    more.addEventListener("click", function () {
      status.textContent = "（Mock）更多選項：" + item.title;
      status.removeAttribute("hidden");
    });

    return el("article", {
      class: "quiz-row" + (item.done ? " is-done" : "")
    }, [
      el("span", {
        class: "quiz-row__icon",
        style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a",
        html: AHS.Icons.quiz()
      }),
      el("div", { class: "quiz-row__info" }, [
        el("h3", { class: "quiz-row__title", text: item.title }),
        el("div", { class: "quiz-row__tags" }, [
          chip(item.subject),
          el("span", { class: "quiz-row__tag", text: item.grade }),
          el("span", { class: "quiz-row__tag", text: item.chapter })
        ]),
        el("p", { class: "quiz-row__desc" }, [
          el("span", { text: item.count + " 題" }),
          el("span", { class: "quiz-row__dot-sep", text: "·" }),
          el("span", { text: item.type }),
          el("span", { class: "quiz-row__dot-sep", text: "·" }),
          el("span", { style: "color:" + diffTone + ";font-weight:700", text: item.difficulty })
        ])
      ]),
      el("div", { class: "quiz-row__metrics" }, [
        el("div", { class: "quiz-row__metric" }, [
          el("span", { class: "quiz-row__metric-label", text: "進度" }),
          el("div", { class: "progressbar quiz-row__bar" }, [
            el("div", { class: "progressbar__fill",
              style: "width:" + item.progress + "%;background-color:" + subj.hex })
          ]),
          el("span", { class: "quiz-row__metric-val", text: item.progress + "%" })
        ]),
        el("div", { class: "quiz-row__metric quiz-row__metric--num" }, [
          el("span", { class: "quiz-row__metric-label", text: "正確率" }),
          el("span", { class: "quiz-row__metric-strong", text: item.accuracy + "%" })
        ]),
        el("div", { class: "quiz-row__metric quiz-row__metric--num" }, [
          el("span", { class: "quiz-row__metric-label", text: "最高分" }),
          el("span", { class: "quiz-row__metric-strong", text: item.best + "/100" })
        ])
      ]),
      el("div", { class: "quiz-row__actions" }, [actionBtn, more])
    ]);
  }

  function quizList(data, status, onStart) {
    return el("div", { class: "quiz-list" },
      data.items.map(function (it) { return quizRow(it, status, onStart); }));
  }

  /* ---- Right rail: stat cards ------------------------------------------ */
  function statCards(stats) {
    return el("div", { class: "quiz-stats__grid" },
      stats.map(function (s) {
        return el("div", { class: "quiz-stat" }, [
          el("span", { class: "quiz-stat__icon", html: AHS.Icons[s.icon]() }),
          el("span", { class: "quiz-stat__label", text: s.label }),
          el("strong", { class: "quiz-stat__value" }, [
            el("span", { text: s.value }),
            el("small", { text: " " + s.unit })
          ]),
          el("span", { class: "quiz-stat__delta", text: s.delta })
        ]);
      }));
  }

  /* ---- Donut chart (pure SVG) ------------------------------------------ */
  function donut(accuracyByStudy) {
    var R = 42, CX = 60, CY = 60;
    var C = 2 * Math.PI * R;
    var total = accuracyByStudy.reduce(function (s, d) { return s + d.percent; }, 0) || 1;
    var offset = 0;
    var segs = accuracyByStudy.map(function (d) {
      var subj = AHS.Subjects[d.subject];
      var frac = d.percent / total;
      var dash = frac * C;
      var seg =
        '<circle cx="' + CX + '" cy="' + CY + '" r="' + R + '" fill="none" ' +
        'stroke="' + subj.hex + '" stroke-width="16" ' +
        'stroke-dasharray="' + dash.toFixed(2) + " " + (C - dash).toFixed(2) + '" ' +
        'stroke-dashoffset="' + (-offset).toFixed(2) + '"/>';
      offset += dash;
      return seg;
    }).join("");

    var svg =
      '<svg viewBox="0 0 120 120" role="img" aria-label="科目正確率分佈" ' +
      'xmlns="http://www.w3.org/2000/svg">' +
      '<g transform="rotate(-90 60 60)">' + segs + '</g>' +
      '<circle cx="60" cy="60" r="26" fill="#ffffff"/>' +
      '</svg>';

    var legend = el("ul", { class: "quiz-donut__legend" },
      accuracyByStudy.map(function (d) {
        var subj = AHS.Subjects[d.subject];
        return el("li", { class: "quiz-donut__legend-item" }, [
          el("span", { class: "quiz-donut__swatch",
            style: "background-color:" + subj.hex }),
          el("span", { class: "quiz-donut__legend-name", text: subj.name }),
          el("span", { class: "quiz-donut__legend-val", text: d.percent + "%" })
        ]);
      }));

    return el("div", { class: "quiz-donut" }, [
      el("div", { class: "quiz-donut__chart", html: svg }),
      legend
    ]);
  }

  /* ---- History ----------------------------------------------------------
     Uses live AHS.HistoryRuntime records (this session's completed exams)
     when any exist; falls back to the static Mock history otherwise, so
     a first-ever visit still shows example content. */
  function history(mockHistory) {
    var live = AHS.HistoryRuntime.list();
    var rows = live.length ? live.map(function (h) {
      return { subject: h.subject, title: h.title, when: h.when, score: h.score, accuracy: h.accuracy };
    }) : mockHistory;

    var list = el("div", { class: "quiz-history__list" },
      rows.map(function (h) {
        var subj = AHS.Subjects[h.subject];
        return el("div", { class: "quiz-history__item" }, [
          el("span", {
            class: "quiz-history__icon",
            style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a",
            html: AHS.Icons.quiz()
          }),
          el("div", { class: "quiz-history__meta" }, [
            el("span", { class: "quiz-history__title", text: h.title }),
            el("span", { class: "quiz-history__sub", text: subj.name + " · " + h.when })
          ]),
          el("div", { class: "quiz-history__score" }, [
            el("strong", { text: h.score + "分" }),
            el("span", { class: "quiz-history__acc", text: "正確率 " + h.accuracy + "%" })
          ])
        ]);
      }));

    return el("section", { class: "card quiz-history", "aria-label": "歷史紀錄" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "歷史紀錄" }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      list
    ]);
  }

  /* ---- Filter State helpers (Sprint 4.1) --------------------------------
     ALL_* sentinels match the "全部…" option already shown first in each
     select (章節/難易度/題型 already carry one in Mock Data; 年級 doesn't,
     so one is prepended locally for rendering only — Mock Data itself is
     untouched). Filtering uses "contains" matching for 年級/難易度/題型
     because a handful of Mock rows carry combined labels (e.g. grade
     "高一上", difficulty "易~中等") that a strict equality check would
     never match against the plain filter option text. */
  var ALL_GRADE = "全部年級";
  var ALL_CHAPTER = "全部章節";

  function chapterOptionsFor(items, subject) {
    var seen = [];
    items.forEach(function (it) {
      if ((subject === "all" || it.subject === subject) && seen.indexOf(it.chapter) === -1) {
        seen.push(it.chapter);
      }
    });
    return [ALL_CHAPTER].concat(seen);
  }

  function itemMatchesFilters(it, state) {
    var subjOk = state.subject === "all" || it.subject === state.subject;
    var gradeOk = state.grade === ALL_GRADE || it.grade.indexOf(state.grade) !== -1;
    var chapterOk = state.chapter === ALL_CHAPTER || it.chapter === state.chapter;
    var diffOk = state.difficulty === state.difficultyAll || it.difficulty.indexOf(state.difficulty) !== -1;
    var typeOk = state.type === state.typeAll || it.type.indexOf(state.type) !== -1;
    var progressOk = !state.onlyIncomplete || it.progress < 100;
    return subjOk && gradeOk && chapterOk && diffOk && typeOk && progressOk;
  }

  function sortItems(items, sortKey) {
    var arr = items.slice();
    if (sortKey === "正確率") {
      arr.sort(function (a, b) { return b.accuracy - a.accuracy; });
    } else if (sortKey === "完成度") {
      arr.sort(function (a, b) { return b.progress - a.progress; });
    }
    /* "最新排序" (default) — keep Mock authoring order as-is. */
    return arr;
  }

  /* ---- List view (Exam List) -------------------------------------------
     data: AHS.Mock.quiz. onStart(item): begins the real exam flow.
     Sprint 4.1: 科目/年級/章節/難易度/題型/只看未完成/排序 all drive a real
     filter+sort of data.items, re-rendered immediately into listContainer
     on every change (no page reload). Filter State lives here, in
     QuizCenter's own closure — not a new Runtime, not a new global. */
  function buildListView(data, onStart) {
    var status = el("p", {
      class: "quiz-status", "aria-live": "polite", hidden: "hidden"
    });

    var state = {
      subject: "all",
      grade: ALL_GRADE,
      chapter: ALL_CHAPTER,
      difficulty: data.difficulties[0],
      difficultyAll: data.difficulties[0],
      type: data.types[0],
      typeAll: data.types[0],
      onlyIncomplete: false,
      sort: data.sorts[0]
    };
    var gradeOptions = [ALL_GRADE].concat(data.grades);

    var filterBarContainer = el("div", {});
    var listContainer = el("div", {});

    function renderList() {
      var filtered = data.items.filter(function (it) { return itemMatchesFilters(it, state); });
      var sorted = sortItems(filtered, state.sort);
      AHS.UI.mount(listContainer, quizList({ items: sorted }, status, onStart));
    }

    function renderFilterBar() {
      var chapterOptions = chapterOptionsFor(data.items, state.subject);
      AHS.UI.mount(filterBarContainer, filterBar(
        { subjects: data.subjects, gradeOptions: gradeOptions, difficulties: data.difficulties,
          types: data.types, sorts: data.sorts },
        state,
        chapterOptions,
        {
          onSubject: function (id) { state.subject = id; state.chapter = ALL_CHAPTER; renderFilterBar(); renderList(); },
          onGrade: function (v) { state.grade = v; renderList(); },
          onChapter: function (v) { state.chapter = v; renderList(); },
          onDifficulty: function (v) { state.difficulty = v; renderList(); },
          onType: function (v) { state.type = v; renderList(); },
          onToggleIncomplete: function (on) { state.onlyIncomplete = on; renderList(); },
          onSort: function (v) { state.sort = v; renderList(); }
        }
      ));
    }

    renderFilterBar();
    renderList();

    var main = el("div", { class: "quiz-main" }, [
      banner(data),
      filterBarContainer,
      listContainer,
      status
    ]);

    /* Live stats once at least one exam has been completed this session;
       otherwise the original Mock numbers (first-open example content). */
    var live = AHS.StatisticsRuntime.overview();
    var statsData = live.totalCount ? AHS.StatisticsRuntime.refresh() : data;

    var rail = el("div", { class: "quiz-rail" }, [
      el("section", { class: "card quiz-stats", "aria-label": "學習統計" }, [
        el("div", { class: "card__head" }, [
          el("h2", { class: "card__title", text: "學習統計" }),
          el("span", { class: "quiz-stats__range", text: "本週" })
        ]),
        statCards(statsData.stats)
      ]),
      el("section", { class: "card", "aria-label": "科目正確率分佈" }, [
        el("h2", { class: "card__title", text: "科目正確率分佈" }),
        donut(statsData.accuracyByStudy)
      ]),
      history(data.history)
    ]);

    return el("div", { class: "quiz-layout" }, [main, rail]);
  }

  /* ---- Exam-taking view --------------------------------------------------
     session: ExamRuntime session record. rerender(): callback so the
     navigator/card can trigger a full re-render of this view after each
     interaction (selecting an answer, moving between questions). */
  function buildExamView(session, rerender, onFinish) {
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
      onFinish: onFinish
    });

    var subj = AHS.Subjects[session.subject];
    var header = el("div", { class: "qexam__head" }, [
      el("span", {
        class: "qexam__subject",
        style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a",
        text: subj.name
      }),
      el("h1", { class: "qexam__title", text: session.title })
    ]);

    return el("div", { class: "qexam" }, [header, card, nav]);
  }

  /* ---- Review view --------------------------------------------------------
     review: ReviewRuntime view-model. onBack(): return to the exam list. */
  function buildReviewView(review, onBack) {
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
          el("div", { class: "qreview__item-answers" }, [
            el("span", { text: "你的答案：" + (q.yourAnswer || "未作答") }),
            el("span", { style: "color:" + toneHex + ";font-weight:700",
              text: "正確答案：" + q.correctAnswer })
          ]),
          el("p", { class: "qreview__item-explain", text: q.explanation })
        ]);
      }));

    var backBtn = el("button", { type: "button", class: "qreview__back" }, [
      el("span", { text: "返回測驗中心" })
    ]);
    backBtn.addEventListener("click", onBack);

    return el("div", { class: "qreview" }, [summary, list, backBtn]);
  }

  /* create(model?) — model defaults to AHS.Mock.quiz. Owns view
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
  function isRealLearningQuestion(record) {
    var q = String((record && record.question) || "");
    var a = (record && record.answer !== undefined && record.answer !== null)
      ? String(record.answer) : "";
    return q.indexOf("[Stub]") !== 0 && a.indexOf("[Stub]") !== 0;
  }

  function practiceEmptyState(forMaterialId) {
    var hint = forMaterialId
      ? "這份教材目前還沒有練習題，AI 出題功能仍在開發中。"
      : "請先上傳教材，系統會自動產生練習題。";
    return el("section", { class: "card quiz-practice__empty", "aria-label": "尚無練習題" }, [
      el("span", { class: "quiz-practice__empty-icon", html: AHS.Icons.quiz() }),
      el("p", { class: "quiz-practice__empty-title", text: "尚未建立題目" }),
      el("p", { class: "quiz-practice__empty-hint", text: hint })
    ]);
  }

  function buildPracticeListView(onPractice, filterMaterialId) {
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

    if (!items.length) {
      return el("div", { class: "quiz-practice" }, [practiceEmptyState(filterMaterialId)]);
    }

    var rows = items.map(function (record) {
      var subj = AHS.Subjects[record.subject] || { name: record.subject || "未分類", hex: "#6b7280" };
      var row = el("button", { type: "button", class: "quiz-practice__row" }, [
        el("span", {
          class: "chip", style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
        }, [el("span", { text: subj.name })]),
        el("span", { class: "quiz-practice__row-q", text: record.question || "（尚無題目）" }),
        el("span", { class: "quiz-practice__row-meta", text: record.knowledgePoint || record.chapter || "" }),
        el("span", { class: "quiz-practice__row-arrow", html: AHS.Icons.chevronRight() })
      ]);
      row.addEventListener("click", function () { onPractice(record); });
      return row;
    });

    return el("div", { class: "quiz-practice" }, [
      el("section", { class: "card quiz-practice__list", "aria-label": "練習題列表" }, [
        el("div", { class: "card__head" }, [
          el("h2", { class: "card__title", text: "練習題（" + items.length + "）" })
        ]),
        el("div", { class: "quiz-practice__rows" }, rows)
      ])
    ]);
  }

  function buildPracticeQuestionView(record, onBack) {
    var backBtn = el("button", { type: "button", class: "quiz-practice__back", text: "← 返回列表" });
    backBtn.addEventListener("click", onBack);

    var answerSlot = el("div", { class: "quiz-practice__answer", hidden: "hidden" });
    var revealed = false;

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
      [
        expBlock("解題步驟", exp.steps),
        expBlock("為什麼答案正確", exp.whyCorrect ? [exp.whyCorrect] : []),
        expBlock("其他選項錯誤原因", exp.whyOthersWrong),
        expBlock("常見錯誤", exp.commonMistakes),
        expBlock("解題技巧", exp.tips)
      ].filter(Boolean).forEach(function (node) { answerSlot.appendChild(node); });
      if (record.knowledgePoint) {
        answerSlot.appendChild(el("p", { class: "quiz-practice__meta", text: "考點：" + record.knowledgePoint }));
      }
      if (record.learningObjective) {
        answerSlot.appendChild(el("p", { class: "quiz-practice__meta", text: "學習目標：" + record.learningObjective }));
      }
    }

    var revealBtn = el("button", { type: "button", class: "quiz-practice__reveal", text: "顯示解答" });
    revealBtn.addEventListener("click", function () {
      revealed = !revealed;
      if (revealed) {
        renderAnswer();
        answerSlot.removeAttribute("hidden");
        revealBtn.textContent = "隱藏解答";
      } else {
        answerSlot.setAttribute("hidden", "hidden");
        revealBtn.textContent = "顯示解答";
      }
    });

    var optionsBlock = (record.options && record.options.length)
      ? el("div", { class: "quiz-practice__options" },
          record.options.map(function (opt) { return el("div", { class: "quiz-practice__option", text: String(opt) }); }))
      : null;

    return el("div", { class: "quiz-practice" }, [
      backBtn,
      el("section", { class: "card quiz-practice__question", "aria-label": "練習題" },
        [
          el("p", { class: "quiz-practice__q-text", text: record.question }),
          optionsBlock,
          revealBtn,
          answerSlot
        ].filter(Boolean))
    ]);
  }

  /* create(model, initialMode, initialMaterialId)
     Sprint 6.8 EO-S6.8-001 (Task 001/002, AI Learning Flow): initialMode
     ("practice" | undefined) and initialMaterialId are optional and
     additive — every existing caller (js/pages/app-quiz.js with no
     extra args) gets EXACTLY the same behavior as before (Exam Mode
     tab active by default). When a real deep link from Summary Detail
     passes initialMode: "practice", Practice Mode is shown first
     instead, optionally pre-filtered to one material's own questions —
     completing the Material → AI Summary → Practice flow. No change to
     any Exam Mode function below, no change to ExamRuntime/QuestionBank/
     QuestionRuntime. */
  function create(model, initialMode, initialMaterialId) {
    var data = model || AHS.Mock.quiz;
    var root = el("div", { class: "quiz-root" });

    function showList() {
      AHS.UI.mount(root, buildListView(data, startExam));
    }

    function startExam(item) {
      var session = AHS.ExamRuntime.start({
        subject: item.subject, title: item.title, chapter: item.chapter,
        grade: item.grade, count: item.count, type: item.type, difficulty: item.difficulty
      });
      if (!session) { return; } /* another exam already running — ignore. */
      showExam(session.examId);
    }

    function showExam(examId) {
      var session = AHS.ExamRuntime.getCurrent();
      if (!session || session.examId !== examId) { showList(); return; }
      AHS.UI.mount(root, buildExamView(session, function () { showExam(examId); }, function () {
        finishExam(examId);
      }));
    }

    function finishExam(examId) {
      var finished = AHS.ExamRuntime.finish(examId);
      if (!finished) { showList(); return; }
      var graded = AHS.AutoGrader.grade(finished);
      if (graded) {
        AHS.WrongBookRuntime.sync(graded);
        AHS.HistoryRuntime.record(graded);
      }
      var review = AHS.ReviewRuntime.build(examId);
      if (!review) { showList(); return; }
      AHS.UI.mount(root, buildReviewView(review, showList));
    }

    showList();

    /* ---- Practice Mode mount (EO-S6-006) — entirely separate root,
       never touches `root` / any Exam Mode function above. ---- */
    var practiceRoot = el("div", { class: "quiz-practice-root" });
    var startOnPractice = (initialMode === "practice");
    if (!startOnPractice) { practiceRoot.setAttribute("hidden", "hidden"); }

    function showPracticeList() {
      AHS.UI.mount(practiceRoot, buildPracticeListView(showPracticeQuestion, initialMaterialId));
    }
    function showPracticeQuestion(record) {
      AHS.UI.mount(practiceRoot, buildPracticeQuestionView(record, showPracticeList));
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
    function showQuestionGuide() {
      var runtime = AHS.LearningQuestionRuntime;
      var records = (runtime && typeof runtime.findByMaterialId === "function")
        ? runtime.findByMaterialId(initialMaterialId) : [];
      AHS.UI.mount(practiceRoot, AHS.QuestionGuide.create({
        materialId: initialMaterialId,
        questions: records.filter(isRealLearningQuestion),
        onStart: showPracticeList
      }));
    }

    if (startOnPractice && initialMaterialId && AHS.QuestionGuide) {
      showQuestionGuide();
    } else {
      showPracticeList();
    }

    /* ---- Mode toggle — "Practice ↓ LearningQuestionRuntime" vs
       "Exam ↓ QuestionRuntime", 兩者不得混用: switching modes only
       toggles visibility, it never mounts Exam content into
       practiceRoot or vice versa. */
    var examTab = el("button", { type: "button", class: "quiz-mode__tab" + (startOnPractice ? "" : " is-active"), text: "正式測驗" });
    var practiceTab = el("button", { type: "button", class: "quiz-mode__tab" + (startOnPractice ? " is-active" : ""), text: "練習模式" });
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
