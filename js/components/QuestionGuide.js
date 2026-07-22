/* components/QuestionGuide.js — AI Question Guide (巧巧老師出題引導).
   Sprint 6.8 · EO-S6.8-002 Task 001.

   Position in the AI Learning Flow (fixed, per this EO):
     Summary → Question Guide → Practice
   Summary Detail's real "開始 AI 練習" link (quiz.html?mode=practice&
   materialId=...) now lands on this guide first; its 開始練習 button
   then reveals the existing Practice list (untouched behavior). Entering
   Practice Mode any other way (mode tab, no materialId) skips the guide
   entirely — this component is additive only.

   Honesty rules (same convention as every Sprint 6 module): every line
   of guidance below is computed from REAL records only —
     - AHS.SummaryRuntime.findByMaterialId() (read-only; loaded via a new
       ordered <script> tag in quiz.html)
     - the real Learning Question records passed in by QuizCenter.js
       (already filtered there to exclude [Stub] placeholder questions,
       per this EO's Task 004)
   Nothing is invented: if the material's summary/questions genuinely
   have no content yet (Parser still a stub), each row says so honestly
   ("教材仍在分析中…") — never Lorem, never Mock Data, never fabricated
   reading advice about content that doesn't exist.

   Scope discipline: reads Runtimes only (never writes), touches no
   Runtime Schema, no Parser Interface, no ExamRuntime/QuestionBank/
   QuestionRuntime. Navigation back to Summary uses a real <a href>
   (never programmatic location navigation, per project convention).
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.QuestionGuide = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  /* Fixed five-section order — mirrors SummaryCenter.js exactly. */
  var SECTION_ORDER = [
    { key: "coreConcepts", label: "核心概念" },
    { key: "definitions", label: "重要定義" },
    { key: "pitfalls", label: "易錯重點" },
    { key: "memorize", label: "必背內容" },
    { key: "reviewSuggestions", label: "複習建議" }
  ];

  /* questionType / difficulty value -> student-facing label. Values not
     in the map fall back to the raw value (shown as-is, never hidden,
     never re-labeled into something it isn't). */
  var TYPE_LABELS = {
    multiple_choice: "選擇題",
    short_answer: "簡答題",
    true_false: "是非題",
    fill_blank: "填空題"
  };
  var DIFF_LABELS = { easy: "易", medium: "中等", hard: "難" };

  function typeLabel(v) { return TYPE_LABELS[v] || String(v || "未分類"); }
  function diffLabel(v) { return DIFF_LABELS[v] || String(v || "未分類"); }

  /* countBy(records, field) -> [{ value, count }] sorted by count desc.
     Deterministic derivation from real records only. */
  function countBy(records, field) {
    var counts = {};
    var order = [];
    records.forEach(function (r) {
      var v = String((r && r[field]) || "");
      if (!v) { return; }
      if (!(v in counts)) { counts[v] = 0; order.push(v); }
      counts[v] += 1;
    });
    return order
      .map(function (v) { return { value: v, count: counts[v] }; })
      .sort(function (a, b) { return b.count - a.count; });
  }

  /* latestSummaryFor(materialId) — newest real Summary Runtime record
     for this material (list is append-ordered), or null. Read-only. */
  function latestSummaryFor(materialId) {
    var rt = AHS.SummaryRuntime;
    if (!materialId || !rt || typeof rt.findByMaterialId !== "function") { return null; }
    var records = rt.findByMaterialId(materialId);
    return (records && records.length) ? records[records.length - 1] : null;
  }

  function nonEmptySections(summary) {
    if (!summary) { return []; }
    return SECTION_ORDER.filter(function (s) {
      return Array.isArray(summary[s.key]) && summary[s.key].length > 0;
    });
  }

  /* ---- One labeled guidance row ---------------------------------------- */
  function guideRow(label, content) {
    var body = Array.isArray(content)
      ? el("ul", { class: "qguide__row-list" },
          content.map(function (t) { return el("li", { text: String(t) }); }))
      : el("p", { class: "qguide__row-text", text: String(content) });
    return el("div", { class: "qguide__row" }, [
      el("strong", { class: "qguide__row-label", text: label }),
      body
    ]);
  }

  /* ---- Row content builders — every branch is real-data-derived. ------- */

  function introText(summary, questions) {
    var title = (summary && summary.title) ? "《" + summary.title + "》" : "這份教材";
    if (questions.length > 0) {
      return title + "目前有 " + questions.length + " 題 AI 練習題，出發前先看看下面的建議吧！";
    }
    return title + "目前還沒有 AI 練習題（教材仍在分析中），以下先提供目前掌握到的學習資訊。";
  }

  function readingAdvice(summary) {
    var sections = nonEmptySections(summary);
    if (!sections.length) {
      return "教材仍在分析中，尚未取得可整理內容；完成分析後會依實際內容提供建議的閱讀順序。";
    }
    return "建議先依序閱讀學習總結的：" +
      sections.map(function (s) { return s.label; }).join(" → ") + "。";
  }

  function typeAdvice(questions) {
    var counts = countBy(questions, "questionType");
    if (!counts.length) {
      return "目前尚無 AI 練習題，暫無題型建議。";
    }
    return "本次練習包含：" + counts.map(function (c) {
      return typeLabel(c.value) + " " + c.count + " 題";
    }).join("、") + "。";
  }

  function difficultyAdvice(questions) {
    var counts = countBy(questions, "difficulty");
    if (!counts.length) {
      return "目前尚無 AI 練習題，暫無難度建議。";
    }
    var main = counts[0];
    var detail = counts.map(function (c) {
      return diffLabel(c.value) + " " + c.count + " 題";
    }).join("、");
    return "本次練習以「" + diffLabel(main.value) + "」難度為主（" + detail + "）。";
  }

  function answeringReminder(summary, questions) {
    var pitfalls = (summary && Array.isArray(summary.pitfalls)) ? summary.pitfalls.length : 0;
    if (pitfalls > 0) {
      return "本教材整理了 " + pitfalls + " 個易錯重點，作答前建議先回顧一次再開始。";
    }
    if (questions.length > 0) {
      return "目前沒有標記易錯重點；作答時仍建議逐題確認題意後再作答。";
    }
    return "教材分析完成前，暫無作答提醒。";
  }

  function learningAdvice(summary) {
    var suggestions = (summary && Array.isArray(summary.reviewSuggestions))
      ? summary.reviewSuggestions.filter(Boolean) : [];
    if (suggestions.length) { return suggestions.map(String); }
    return "教材分析完成後，將依實際內容提供學習建議。";
  }

  /* ---- create(opts) ------------------------------------------------------
     opts = {
       materialId,
       questions: [...],  real Learning Question records for this
                          material, ALREADY filtered by QuizCenter.js to
                          exclude [Stub] placeholders (Task 004) — this
                          component never re-reads the Runtime for them,
                          keeping one single filter authority.
       onStart: function  called on 開始練習 click (reveals Practice list)
     } */
  function create(opts) {
    opts = opts || {};
    var questions = Array.isArray(opts.questions) ? opts.questions : [];
    var summary = latestSummaryFor(opts.materialId);

    /* EO-S6.9-002 · Difficulty is the Generator Interface's caller
       parameter (PMO Ruling 2B): the student picks it EXPLICITLY here —
       no option is pre-selected and 開始練習 stays disabled until one
       is chosen, so the flow can never run on an inferred or defaulted
       difficulty. */
    var chosenDifficulty = null;
    var startBtn = el("button", { type: "button", class: "qguide__start", disabled: "disabled" }, [
      el("span", { text: "開始練習" }),
      el("span", { html: AHS.Icons.chevronRight() })
    ]);

    var diffBtns = [
      { value: "easy", label: "易" },
      { value: "medium", label: "中等" },
      { value: "hard", label: "難" }
    ].map(function (d) {
      var btn = el("button", {
        type: "button", class: "qguide__diff", "data-difficulty": d.value, text: d.label
      });
      btn.addEventListener("click", function () {
        chosenDifficulty = d.value;
        diffBtns.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        startBtn.removeAttribute("disabled");
      });
      return btn;
    });

    startBtn.addEventListener("click", function () {
      if (!chosenDifficulty) { return; }
      if (typeof opts.onStart === "function") { opts.onStart(chosenDifficulty); }
    });

    /* Real <a href> back into this material's Summary Detail — never
       programmatic location navigation (project rule). */
    var backLink = el("a", {
      class: "qguide__back",
      href: "summary.html?materialId=" + encodeURIComponent(opts.materialId || "")
    }, [el("span", { text: "返回學習總結" })]);

    return el("section", { class: "card qguide", "aria-label": "巧巧老師出題引導" }, [
      el("div", { class: "qguide__head" }, [
        el("div", {
          class: "qguide__avatar qiaoqiao-bust qiaoqiao-bust--sm",
          html: AHS.Qiaoqiao.bust("cheer")
        }),
        el("div", { class: "qguide__titles" }, [
          el("h2", { class: "qguide__title", text: "巧巧老師出題引導" }),
          el("p", { class: "qguide__intro", text: introText(summary, questions) })
        ])
      ]),
      el("div", { class: "qguide__rows" }, [
        guideRow("建議閱讀方式", readingAdvice(summary)),
        guideRow("建議題型", typeAdvice(questions)),
        guideRow("建議難度", difficultyAdvice(questions)),
        guideRow("作答提醒", answeringReminder(summary, questions)),
        guideRow("學習建議", learningAdvice(summary))
      ]),
      el("div", { class: "qguide__pick" }, [
        el("strong", { class: "qguide__row-label", text: "選擇本次練習難度（必選）" }),
        el("div", { class: "qguide__diffs" }, diffBtns)
      ]),
      el("div", { class: "qguide__actions" }, [backLink, startBtn])
    ]);
  }

  return { create: create };
})();
