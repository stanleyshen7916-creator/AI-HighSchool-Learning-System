/* components/QuizCenter.js — 測驗中心 (Quiz Center) page.
   WO-Q004: Exam list + Exam-taking flow are now driven entirely by
   window.AHS.ExamRuntime (+ window.AHS.QuestionBank for question
   detail via questionIds). No Mock Data is used for the exam list or
   exam-taking flow. The right rail (stat cards / subject accuracy
   donut / history) is unrelated pre-existing Sprint 1 content and is
   left untouched by this Work Order — still driven by AHS.Mock.quiz.
   PascalCase component under window.AHS. Donut is pure inline SVG. */
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

  /* ---- Exam status label ------------------------------------------------ */
  var STATUS_LABEL = { draft: "未就緒", ready: "待測驗", running: "進行中", finished: "已完成" };
  function examStatusLabel(status) { return STATUS_LABEL[status] || status; }

  function formatDuration(minutes) { return minutes + " 分鐘"; }

  /* ---- mm:ss clock (display only — no auto-submit) ---------------------- */
  function formatClock(totalSeconds) {
    var t = Math.max(0, totalSeconds);
    var m = Math.floor(t / 60);
    var s = t % 60;
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return pad(m) + ":" + pad(s);
  }

  /* ---- Exam list row (function 1/2/3): data from AHS.ExamRuntime ------- */
  function examRow(exam, onStart) {
    var subj = AHS.Subjects[exam.subject];
    var diffTone = DIFF_TONE[exam.difficulty] || "#6b7280";
    var canStart = exam.questionIds.length > 0;

    var label = "開始測驗";
    if (exam.status === "running") { label = "繼續作答"; }
    else if (exam.status === "finished") { label = "重新測驗"; }

    var actionBtn = el("button", {
      type: "button", class: "quiz-row__start"
    }, [
      el("span", { html: AHS.Icons.play() }),
      el("span", { text: canStart ? label : "無題目" })
    ]);
    if (canStart) {
      actionBtn.addEventListener("click", function () { onStart(exam.id); });
    } else {
      actionBtn.setAttribute("disabled", "disabled");
    }

    return el("article", { class: "quiz-row", "data-exam-id": exam.id }, [
      el("span", {
        class: "quiz-row__icon",
        style: subj ? ("color:" + subj.hex + ";background-color:" + subj.hex + "1a") : "",
        html: AHS.Icons.quiz()
      }),
      el("div", { class: "quiz-row__info" }, [
        el("h3", { class: "quiz-row__title", text: exam.title }),
        el("div", { class: "quiz-row__tags" }, [
          subj ? chip(exam.subject) : null,
          el("span", { class: "quiz-row__tag", text: exam.grade }),
          el("span", { class: "quiz-row__tag", text: exam.chapter }),
          el("span", { class: "quiz-exam__status quiz-exam__status--" + exam.status,
            text: examStatusLabel(exam.status) })
        ]),
        el("p", { class: "quiz-row__desc" }, [
          el("span", { text: exam.totalQuestions + " 題" }),
          el("span", { class: "quiz-row__dot-sep", text: "·" }),
          el("span", { text: formatDuration(exam.duration) }),
          el("span", { class: "quiz-row__dot-sep", text: "·" }),
          el("span", { style: "color:" + diffTone + ";font-weight:700", text: exam.difficulty })
        ])
      ]),
      el("div", { class: "quiz-row__actions" }, [actionBtn])
    ]);
  }

  function examListView(onStart) {
    var exams = AHS.ExamRuntime.list();
    var body = exams.length
      ? el("div", { class: "quiz-list" }, exams.map(function (exam) { return examRow(exam, onStart); }))
      : el("p", { class: "quiz-empty", text: "目前尚無測驗。" });
    return el("div", { class: "quiz-exam-list" }, [body]);
  }

  /* ---- Exam-taking view (function 4/5/6/7) ------------------------------
     Question detail is fetched per-question via AHS.QuestionBank.get(id) —
     the Exam itself only ever holds questionIds. selectedAnswers is local
     UI-only state (never persisted, never graded, never leaves this
     closure): it exists purely to draw the single-choice highlight and
     the Navigator's "answered" dot. */
  function examTakingView(state, actions) {
    var exam = AHS.ExamRuntime.get(state.examId);
    if (!exam) { return null; }
    var subj = AHS.Subjects[exam.subject];
    var total = exam.questionIds.length;

    if (total === 0) {
      var backBtn = el("button", { type: "button", class: "quiz-exam__nav-btn", text: "返回列表" });
      backBtn.addEventListener("click", actions.onExit);
      return el("div", { class: "quiz-exam card" }, [
        el("p", { class: "quiz-empty", text: "此測驗尚無題目。" }),
        backBtn
      ]);
    }

    if (state.index >= total) { state.index = total - 1; }
    if (state.index < 0) { state.index = 0; }
    var qid = exam.questionIds[state.index];
    var question = AHS.QuestionBank.get(qid);

    var timerVal = el("span", {
      class: "quiz-exam__timer-val" + (state.remainingSeconds <= 0 ? " is-timeout" : ""),
      text: formatClock(state.remainingSeconds)
    });

    var head = el("div", { class: "quiz-exam__head card" }, [
      el("div", { class: "quiz-exam__title-row" }, [
        el("h2", { class: "quiz-exam__title", text: exam.title }),
        el("div", { class: "quiz-exam__timer" }, [
          el("span", { html: AHS.Icons.clock() }),
          timerVal
        ])
      ]),
      el("div", { class: "quiz-exam__meta" }, [
        subj ? chip(exam.subject) : null,
        el("span", { class: "quiz-row__tag", text: exam.grade }),
        el("span", { class: "quiz-row__tag", text: total + " 題" }),
        el("span", { class: "quiz-row__tag", text: formatDuration(exam.duration) }),
        el("span", { class: "quiz-row__tag", text: exam.difficulty })
      ]),
      el("div", { class: "quiz-exam__progress" }, [
        el("span", { class: "quiz-exam__progress-label", text: "第 " + (state.index + 1) + " / " + total + " 題" }),
        el("div", { class: "progressbar quiz-exam__bar" }, [
          el("div", { class: "progressbar__fill", style:
            "width:" + Math.round(((state.index + 1) / total) * 100) + "%;background-color:" +
            (subj ? subj.hex : "#7c5cff") })
        ])
      ])
    ]);

    var answeredSet = {};
    exam.questionIds.forEach(function (id, i) {
      if (state.selectedAnswers[id] != null) { answeredSet[i] = true; }
    });
    var nav = AHS.QuestionNavigator.create(total, state.index, answeredSet, actions.onJump);

    var qCard = question
      ? AHS.QuestionCard.create(
          question,
          state.selectedAnswers[qid] != null ? state.selectedAnswers[qid] : null,
          function (optionIndex) { actions.onSelect(qid, optionIndex); }
        )
      : el("p", { class: "quiz-empty", text: "題目載入失敗。" });

    var prevBtn = el("button", { type: "button", class: "quiz-exam__nav-btn", text: "上一題" });
    if (state.index === 0) { prevBtn.setAttribute("disabled", "disabled"); }
    prevBtn.addEventListener("click", actions.onPrev);

    var nextBtn = el("button", { type: "button", class: "quiz-exam__nav-btn", text: "下一題" });
    if (state.index >= total - 1) { nextBtn.setAttribute("disabled", "disabled"); }
    nextBtn.addEventListener("click", actions.onNext);

    var finishBtn = el("button", { type: "button", class: "quiz-exam__finish", text: "完成考試" });
    finishBtn.addEventListener("click", actions.onFinish);

    var actionRow = el("div", { class: "quiz-exam__actions" }, [prevBtn, nextBtn, finishBtn]);

    return el("div", { class: "quiz-exam" }, [head, nav, qCard, actionRow]);
  }

  /* ---- Right rail: stat cards ------------------------------------------ */
  function statCards(data) {
    return el("div", { class: "quiz-stats__grid" },
      data.stats.map(function (s) {
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
  function donut(data) {
    var R = 42, CX = 60, CY = 60;
    var C = 2 * Math.PI * R;
    var total = data.accuracyByStudy.reduce(function (s, d) { return s + d.percent; }, 0) || 1;
    var offset = 0;
    var segs = data.accuracyByStudy.map(function (d) {
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
      data.accuracyByStudy.map(function (d) {
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

  /* ---- History --------------------------------------------------------- */
  function history(data, status) {
    var list = el("div", { class: "quiz-history__list" },
      data.history.map(function (h) {
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

  /* create(model?) — model defaults to AHS.Mock.quiz, used ONLY by the
     unrelated right rail (stat cards / donut / history), unchanged from
     Sprint 1. The exam list + exam-taking flow (left side) is entirely
     driven by AHS.ExamRuntime / AHS.QuestionBank — no Mock Data. */
  function create(model) {
    var data = model || AHS.Mock.quiz;
    var status = el("p", {
      class: "quiz-status", "aria-live": "polite", hidden: "hidden"
    });

    var main = el("div", { class: "quiz-main" });

    /* ---- exam-taking state (local, UI-only) --------------------------- */
    var state = {
      examId: null,
      index: 0,
      selectedAnswers: {},   /* { [questionId]: optionIndex } */
      remainingSeconds: 0
    };
    var timerHandle = null;

    function clearTimer() {
      if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
    }

    /* startTimer() — pure display countdown from ExamRuntime.duration.
       WO-Q004: "僅顯示 UI，不實作自動交卷" — reaching 0 never calls
       finish() on its own; it just stops decrementing and shows 00:00. */
    function startTimer() {
      clearTimer();
      timerHandle = setInterval(function () {
        if (state.remainingSeconds > 0) {
          state.remainingSeconds -= 1;
          var timerVal = main.querySelector(".quiz-exam__timer-val");
          if (timerVal) {
            timerVal.textContent = formatClock(state.remainingSeconds);
            if (state.remainingSeconds <= 0) { timerVal.classList.add("is-timeout"); }
          }
        }
      }, 1000);
    }

    function showStatus(msg) {
      status.textContent = msg;
      status.removeAttribute("hidden");
    }

    function render() {
      main.innerHTML = "";
      var view = state.examId
        ? examTakingView(state, {
            onPrev: function () { state.index -= 1; render(); },
            onNext: function () { state.index += 1; render(); },
            onJump: function (i) { state.index = i; render(); },
            onSelect: function (qid, optionIndex) {
              state.selectedAnswers[qid] = optionIndex;
              render();
            },
            onFinish: function () { onFinishExam(state.examId); },
            onExit: function () { onFinishExam(state.examId); }
          })
        : examListView(onStartExam);
      if (!state.examId) { main.appendChild(banner(data)); }
      if (view) { main.appendChild(view); }
      main.appendChild(status);
    }

    /* onStartExam (function 2): calls ExamRuntime.start() only. Rejected
       (null) when a different exam is already running — enforced by
       ExamRuntime itself ("同時間僅允許一份 Running Exam"). */
    function onStartExam(examId) {
      var exam = AHS.ExamRuntime.start(examId);
      if (!exam) {
        showStatus("已有測驗正在進行中，請先完成該測驗。");
        render();
        return;
      }
      state.examId = exam.id;
      state.index = 0;
      state.selectedAnswers = {};
      state.remainingSeconds = exam.duration * 60;
      startTimer();
      render();
    }

    /* onFinishExam (function 7): calls ExamRuntime.finish() only — no
       Auto Grading, no Wrong Book, no Statistics. */
    function onFinishExam(examId) {
      var result = AHS.ExamRuntime.finish(examId);
      clearTimer();
      state.examId = null;
      state.index = 0;
      state.selectedAnswers = {};
      state.remainingSeconds = 0;
      if (result) { showStatus("測驗已完成：" + result.title); }
      render();
    }

    render();

    var rail = el("div", { class: "quiz-rail" }, [
      el("section", { class: "card quiz-stats", "aria-label": "學習統計" }, [
        el("div", { class: "card__head" }, [
          el("h2", { class: "card__title", text: "學習統計" }),
          el("span", { class: "quiz-stats__range", text: "本週" })
        ]),
        statCards(data)
      ]),
      el("section", { class: "card", "aria-label": "科目正確率分佈" }, [
        el("h2", { class: "card__title", text: "科目正確率分佈" }),
        donut(data)
      ]),
      history(data, status)
    ]);

    return el("div", { class: "quiz-layout" }, [main, rail]);
  }

  return { create: create };
})();
