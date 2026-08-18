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
        var row = el("label", { class: "qpick-row" + (checkbox.checked ? " is-checked" : "") }, [
          checkbox,
          el("span", { class: "qpick-row-title", text: it.title }),
          el("span", { class: "qpick-row-meta", text: (it.chapter ? it.chapter + "・" : "") + "共 " + it.count + " 題" })
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
  function buildListView(data, onStart, onOpenCombine) {
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
    return AHS.QuestionRuntime.hasExam(examId) ? AHS.QuestionRuntime.getSet(examId) : [];
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
        var row = el("button", { type: "button", class: "quiz-practice__row" }, [
          el("span", {
            class: "chip", style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
          }, [el("span", { text: subj.name })]),
          el("span", { class: "quiz-practice__row-q", text: entry.title }),
          el("span", { class: "quiz-practice__row-meta", text: (entry.chapter || "") + "（共 " + entry.count + " 題）" }),
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
        el("span", { text: q.correctAnswer })
      ]));
      if (q.explanation) {
        answerSlot.appendChild(el("div", { class: "quiz-practice__exp-block" }, [
          el("strong", { class: "quiz-practice__exp-title", text: "詳解" }),
          el("p", { text: q.explanation })
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

    optionBtns = (q.options || []).map(function (o) {
      var b = el("button", {
        type: "button", class: "quiz-practice__option quiz-practice__option--btn", "data-key": o.key
      }, [el("span", { text: o.key + "、" + o.text })]);
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
      AHS.UI.mount(root, buildListView(mergedListData(), unifiedStart, openCombinePicker));
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
        combined = combined.concat(drawn);
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
