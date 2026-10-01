/* js/components/quiz/QuizListView.js — 測驗中心 (quiz.html), 平時練習 list: banner, filters, exam rows, stats rail, the multi-lesson
   chapter picker and buildListView().

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
  var DIFF_TONE = P.DIFF_TONE,
    chip = P.chip,
    repositoryExamCatalog = P.repositoryExamCatalog;

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
      status.textContent = "更多選項：" + item.title;
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

  /* openChapterPicker(mode, onConfirm) — 使用者需求 B："在「平時測驗」與
     「考前複習」裡增加一個選擇功能，用於可以挑選複習的課別...可以一次
     選擇三課來進行複習". A real pre-entry screen (使用者確認選項：「進入
     平時練習/考前總複習前，先跳出課別複選畫面」) listing this Sprint's
     already-real repositoryExamCatalog() entries as checkable rows,
     scoped to ONE subject at a time (使用者原文例子本身就是同一科目内
     跨課合併 — 從未要求跨科目合併). onConfirm(selectedExamIds) fires
     exactly once, only on a real confirm click with >=1 real
     _repoExamId selected — never invented ids, never auto-confirms.
     mode is display-only here (picker title text); the two real
     combined-session builders (tryCombinedExamEntry/openCombinedPractice,
     below) are what actually differ per mode. Overlay/close/Escape/
     backdrop-click pattern mirrors the existing, already-shipped
     js/ui/MaterialPreview.js overlay precedent — no new UI convention
     introduced. */
  function openChapterPicker(mode, onConfirm) {
    var catalog = repositoryExamCatalog();
    if (!catalog.length) {
      window.alert("目前沒有可合併複習的課別，請先於教材中心上傳並完成 AI 建立。");
      return;
    }
    var subjects = [];
    catalog.forEach(function (it) {
      if (it.subject && subjects.indexOf(it.subject) === -1) { subjects.push(it.subject); }
    });
    if (!subjects.length) {
      window.alert("目前沒有可合併複習的課別，請先於教材中心上傳並完成 AI 建立。");
      return;
    }
    var pickedSubject = subjects[0];
    var selected = {};

    var overlay = el("div", {
      class: "qpick-overlay", role: "dialog", "aria-modal": "true", "aria-label": "選擇合併複習課別"
    });
    function close() {
      if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
      document.removeEventListener("keydown", onKeydown);
    }
    function onKeydown(e) { if (e.key === "Escape") { close(); } }
    document.addEventListener("keydown", onKeydown);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) { close(); } });

    var body = el("div", { class: "qpick-body" });
    var footer = el("div", { class: "qpick-footer" });

    function renderFooter() {
      footer.innerHTML = "";
      var count = Object.keys(selected).length;
      var cancelBtn = el("button", { type: "button", class: "qpick-btn qpick-btn--ghost", text: "取消" });
      cancelBtn.addEventListener("click", close);
      var confirmBtn = el("button", {
        type: "button",
        class: "qpick-btn qpick-btn--primary",
        disabled: count ? null : "disabled",
        text: count ? "開始合併複習（已選 " + count + " 課）" : "請至少選擇 1 課"
      });
      confirmBtn.addEventListener("click", function () {
        if (!count) { return; }
        var examIds = Object.keys(selected);
        close();
        onConfirm(examIds);
      });
      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);
    }

    function renderBody() {
      body.innerHTML = "";
      var subjectRow = el("div", { class: "qpick-subjects" }, subjects.map(function (s) {
        var subj = AHS.Subjects[s] || { name: s, hex: "#6b7280" };
        var btn = el("button", {
          type: "button",
          class: "qpick-subject" + (s === pickedSubject ? " is-active" : ""),
          style: s === pickedSubject ? ("border-color:" + subj.hex + ";color:" + subj.hex) : "",
          text: subj.name
        });
        btn.addEventListener("click", function () {
          if (pickedSubject === s) { return; }
          pickedSubject = s;
          selected = {};
          renderBody();
          renderFooter();
        });
        return btn;
      }));
      var chapters = catalog.filter(function (it) { return it.subject === pickedSubject; });
      var rows = chapters.length ? chapters.map(function (it) {
        var checkbox = el("input", { type: "checkbox", "data-exam-id": it._repoExamId });
        checkbox.checked = !!selected[it._repoExamId];
        /* 2026-09-30 (PO 回報：長章節名稱把標題擠成一字一行): title and meta
           stack in one wrapping text column; the chapter is only repeated
           in the meta line when the title doesn't already contain it. */
        var showChapter = it.chapter && String(it.title || "").indexOf(it.chapter) === -1;
        var row = el("label", { class: "qpick-row" + (checkbox.checked ? " is-checked" : "") }, [
          checkbox,
          el("span", { class: "qpick-row-text" }, [
            el("span", { class: "qpick-row-title", text: it.title }),
            el("span", { class: "qpick-row-meta", text: (showChapter ? it.chapter + "・" : "") + "共 " + it.count + " 題" })
          ])
        ]);
        checkbox.addEventListener("change", function () {
          if (checkbox.checked) { selected[it._repoExamId] = true; } else { delete selected[it._repoExamId]; }
          row.classList.toggle("is-checked", checkbox.checked);
          renderFooter();
        });
        return row;
      }) : [el("p", { class: "qpick-empty", text: "此科目目前沒有可複習的課別。" })];
      body.appendChild(subjectRow);
      body.appendChild(el("div", { class: "qpick-list" }, rows));
    }

    renderBody();
    renderFooter();

    var closeX = el("button", { type: "button", class: "qpick-close", "aria-label": "關閉", html: AHS.Icons.filterX() });
    closeX.addEventListener("click", close);

    var panel = el("div", { class: "qpick-panel card" }, [
      el("div", { class: "qpick-head" }, [
        el("h2", {
          class: "qpick-title",
          text: mode === "practice" ? "選擇多課合併複習（考前總複習）" : "選擇多課合併複習（平時練習）"
        }),
        closeX
      ]),
      body,
      footer
    ]);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  /* ---- List view (Exam List) -------------------------------------------
     data: AHS.AppConfig.quiz. onStart(item): begins the real exam flow.
     Sprint 4.1: 科目/年級/章節/難易度/題型/只看未完成/排序 all drive a real
     filter+sort of data.items, re-rendered immediately into listContainer
     on every change (no page reload). Filter State lives here, in
     QuizCenter's own closure — not a new Runtime, not a new global.
     onOpenCombine() — Feature B, optional/additive: renders a "選擇多課
     合併複習" action when provided; every existing caller that omits it
     (none left, but future ones are safe) keeps the pre-Feature-B list
     unchanged. */
  function buildListView(data, onStart, onOpenCombine, onRandomPractice) {
    /* EO-S7.0-003 Production Cleanup: 預設題庫已移除 — Exam Mode 無
       真實測驗來源前顯示正式 Empty State（未來由測驗建立功能填入）。 */
    if (!data.items || !data.items.length) {
      return el("div", { class: "quiz-list quiz-list--empty" }, [
        AHS.EmptyState.create({
          title: "目前沒有可用的測驗",
          hint: "上傳教材並由 AI 建立練習後，正式測驗會在這裡開放。",
          ariaLabel: "測驗清單"
        })
      ]);
    }
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

    var combineRow = null;
    if (typeof onOpenCombine === "function") {
      var combineBtn = el("button", {
        type: "button", class: "quiz-combine-btn", html: AHS.Icons.chevronRight() + "<span>選擇多課合併複習</span>"
      });
      combineBtn.addEventListener("click", onOpenCombine);
      combineRow = el("div", { class: "quiz-combine-row" }, [combineBtn]);
    }
    /* 2026-10-01 綜合隨機練習（方案 C）: one exam across every lesson of the
       subject chosen in the filter above. */
    if (typeof onRandomPractice === "function") {
      var randomHint = el("p", { class: "quiz-random-hint", "aria-live": "polite", hidden: "hidden" });
      var randomBtn = el("button", {
        type: "button", class: "quiz-random-btn", html: AHS.Icons.chevronRight() + "<span>綜合隨機練習</span>",
        title: "從這個科目所有課隨機出題，優先出還沒做過與答錯過的題目"
      });
      randomBtn.addEventListener("click", function () {
        if (state.subject === "all") {
          randomHint.textContent = "請先在上方選擇一個科目，再開始綜合隨機練習。";
          randomHint.removeAttribute("hidden");
          return;
        }
        randomHint.setAttribute("hidden", "hidden");
        if (!onRandomPractice(state.subject)) {
          randomHint.textContent = "這個科目目前沒有可練習的題目。";
          randomHint.removeAttribute("hidden");
        }
      });
      combineRow = el("div", { class: "quiz-combine-row" }, [randomBtn].concat(combineRow ? Array.prototype.slice.call(combineRow.childNodes) : []));
      combineRow.appendChild(randomHint);
    }

    var main = el("div", { class: "quiz-main" }, [
      banner(data),
      filterBarContainer,
      combineRow,
      listContainer,
      status
    ].filter(Boolean));

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

  P.banner = banner;
  P.filterBar = filterBar;
  P.quizRow = quizRow;
  P.quizList = quizList;
  P.statCards = statCards;
  P.donut = donut;
  P.history = history;
  P.ALL_GRADE = ALL_GRADE;
  P.ALL_CHAPTER = ALL_CHAPTER;
  P.chapterOptionsFor = chapterOptionsFor;
  P.itemMatchesFilters = itemMatchesFilters;
  P.sortItems = sortItems;
  P.openChapterPicker = openChapterPicker;
  P.buildListView = buildListView;
})(AHS.QuizParts);
