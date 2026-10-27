/* js/components/ExamArchive.js — 月考資料（2026-10-27）。

   依考試、科目瀏覽 AHS.ExamArchiveData 的段考題目：題目逐字照錄（題組文本、
   選項、表格、附圖），每題下方的「解析」預設收合，展開後顯示答案、
   【確認】／【推論】、解析要點，以及對應的圖解教材卡片或平台缺口。
   純瀏覽，不計分、不寫入任何學習紀錄。 */
window.AHS = window.AHS || {};
AHS.ExamArchive = (function () {
  "use strict";
  var el = AHS.UI.el;
  var TYPE_LABEL = { single: "單選", multi: "多選", fill: "選填", essay: "非選" };

  function data() { return AHS.ExamArchiveData || { exams: [], subjects: [], gaps: {} }; }

  function table(t) {
    if (!t) { return null; }
    return el("div", { class: "xa-table-wrap" }, [
      el("table", { class: "xa-table" }, [
        el("thead", {}, [el("tr", {}, t.head.map(function (h) { return el("th", { text: h }); }))]),
        el("tbody", {}, t.rows.map(function (r) {
          return el("tr", {}, r.map(function (c) { return el("td", { text: c }); }));
        }))
      ]),
      t.caption ? el("p", { class: "xa-note", text: t.caption }) : null
    ]);
  }

  function figure(src, note) {
    if (!src) { return null; }
    return el("figure", { class: "xa-figure" }, [
      el("img", { src: src, alt: "題目附圖", loading: "lazy" }),
      note ? el("figcaption", { class: "xa-note", text: note }) : null
    ]);
  }

  function note(text) { return text ? el("p", { class: "xa-note", text: text }) : null; }

  function passage(p) {
    return el("div", { class: "xa-passage" }, [
      p.title ? el("p", { class: "xa-passage__title", text: p.title }) : null,
      p.wordBank ? el("p", { class: "xa-wordbank", text: p.wordBank }) : null,
      p.text ? el("p", { class: "xa-text", text: p.text }) : null,
      p.options ? el("ul", { class: "xa-opts" }, p.options.map(function (o) { return el("li", { text: o }); })) : null,
      table(p.table),
      figure(p.figure),
      figure(p.figure2),
      note(p.note)
    ]);
  }

  /* lessonRef → 對應的圖解教材卡片連結，或平台缺口說明 */
  function lessonLink(ref) {
    if (ref.indexOf("gap:") === 0) {
      return el("p", { class: "xa-gap", text: "平台缺口：" + (data().gaps[ref.slice(4)] || ref.slice(4)) });
    }
    var parts = ref.split("#");
    var lesson = (AHS.VisualLessonData || []).filter(function (l) { return l.lessonId === parts[0]; })[0];
    var card = lesson && lesson.cards.filter(function (c) { return c.id === parts[1]; })[0];
    if (!lesson || !card) { return null; }
    return el("p", { class: "xa-lesson" }, [
      "對應教材：",
      el("a", { href: lesson.href + "#" + card.id, target: "_blank", rel: "noopener", text: lesson.title + "・" + card.title })
    ]);
  }

  function explain(q) {
    var tag = q.basis === "確認" ? "【確認】" : "【推論】";
    return el("details", { class: "xa-expl" }, [
      el("summary", { text: "看答案與解析" }),
      el("div", { class: "xa-expl__body" }, [
        el("p", { class: "xa-answer" }, [
          el("strong", { text: "答案：" + q.answer }),
          el("span", { class: "xa-basis xa-basis--" + (q.basis === "確認" ? "ok" : "infer"), text: tag }),
          q.confidence === "low" ? el("span", { class: "xa-basis xa-basis--low", text: "信心較低，需向老師確認" }) : null
        ]),
        el("p", { class: "xa-text", text: q.explanation }),
        el("p", { class: "xa-topic", text: "考點：" + q.topic }),
        lessonLink(q.lessonRef)
      ])
    ]);
  }

  function question(q) {
    return el("li", { class: "xa-q", id: "q-" + q.no }, [
      el("p", { class: "xa-q__head" }, [
        el("span", { class: "xa-q__no", text: q.no + "." }),
        el("span", { class: "xa-q__type", text: TYPE_LABEL[q.type] || "" })
      ]),
      el("p", { class: "xa-text", text: q.stem }),
      note(q.stemNote),
      q.passage ? el("p", { class: "xa-text xa-quote", text: q.passage }) : null,
      note(q.passageNote),
      figure(q.figure, q.figureNote),
      table(q.table),
      note(q.tableNote),
      table(q.table2),
      q.options ? el("ul", { class: "xa-opts" }, q.options.map(function (o) { return el("li", { text: o }); })) : null,
      explain(q)
    ]);
  }

  function subjectView(s) {
    var shown = {};
    var body = [
      el("header", { class: "xa-paper card" }, [
        el("h2", { class: "xa-paper__title", text: s.title }),
        el("p", { class: "xa-paper__meta", text: [s.scope, s.credits].filter(Boolean).join("　") }),
        s.notes.length ? el("ul", { class: "xa-paper__notes" }, s.notes.map(function (n) { return el("li", { text: n }); })) : null
      ])
    ];
    s.sections.forEach(function (sec) {
      var items = [];
      sec.questions.forEach(function (q) {
        /* 題組文本放在第一個引用它的題目前面 */
        if (q.passageRef && !shown[q.passageRef]) {
          shown[q.passageRef] = true;
          items.push(el("li", { class: "xa-q xa-q--passage" }, [passage(s.passages[q.passageRef])]));
        }
        items.push(question(q));
      });
      body.push(el("section", { class: "xa-section", "aria-label": sec.title }, [
        el("h3", { class: "xa-section__title", text: sec.title }),
        note(sec.intro),
        el("ol", { class: "xa-qs" }, items)
      ]));
    });
    return el("div", { class: "xa-subject" }, body);
  }

  function create() {
    var d = data();
    var root = el("section", { class: "xa", "aria-label": "月考資料" });
    var exam = d.exams[0];
    var head = el("header", { class: "xa-head" }, [
      el("h1", { class: "xa-title", text: "月考資料" }),
      el("p", { class: "xa-sub", text: "歷次段考的考卷題目與解析。題目只供練習：先自己作答，再展開「看答案與解析」。" })
    ]);
    if (!exam) {
      AHS.UI.mount(root, el("div", { class: "xa-list" }, [head, el("p", { class: "xa-empty", text: "目前還沒有月考資料。" })]));
      return root;
    }
    var subjects = d.subjects.filter(function (s) { return s.examId === exam.id; });
    var panel = el("div", { class: "xa-panel", role: "tabpanel" });
    var tabs = el("div", { class: "xa-tabs", role: "tablist", "aria-label": "科目" });

    function select(i) {
      [].forEach.call(tabs.children, function (b, j) {
        b.classList.toggle("is-active", i === j);
        b.setAttribute("aria-selected", i === j ? "true" : "false");
      });
      AHS.UI.mount(panel, subjectView(subjects[i]));
    }

    subjects.forEach(function (s, i) {
      var count = s.sections.reduce(function (n, sec) { return n + sec.questions.length; }, 0);
      var b = el("button", { type: "button", class: "xa-tab", role: "tab", text: s.name + "（" + count + " 題）" });
      b.addEventListener("click", function () { select(i); });
      tabs.appendChild(b);
    });

    AHS.UI.mount(root, el("div", { class: "xa-list" }, [
      head,
      el("div", { class: "xa-exam card" }, [
        el("h2", { class: "xa-exam__title", text: exam.school + "・" + exam.title }),
        el("p", { class: "xa-sub", text: exam.note })
      ]),
      tabs,
      panel
    ]));
    if (subjects.length) { select(0); }
    return root;
  }

  return { create: create };
})();
