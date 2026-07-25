/* js/ui/MaterialQuestionCard.js — Sprint 8.3 · EO-S8.3.006
   AI 練習題 UI for the material preview overlay: the「AI 練習題」
   section, its「產生 AI 題目」/「重新產生題目」buttons, the generating
   state, per-question cards (題號 + 題目 + 四個選項), and a per-question
   「查看答案」that reveals the correct answer plus the existing AI
   explanation.

   This is a thin presentation helper — every question comes from
   AHS.QuestionGenerationRuntime (via AITutorService); the UI NEVER
   builds a question, an option or an explanation itself. The buttons
   coordinate through AHS.AITutorService.ensureQuestionSet(), which
   derives questions from the already-built Knowledge Graph — no
   material is re-analysed.

   Reuses the existing .mat-summary__* visual language (same card /
   button / loading styles) rather than introducing a new design; the
   question-specific pieces use .mat-question__* added alongside them. */
window.AHS = window.AHS || {};
AHS.MaterialQuestionCard = (function () {
  "use strict";

  var el = AHS.UI.el;

  function hasQuestions(set) {
    return !!(set && Array.isArray(set.questions) && set.questions.length > 0);
  }

  /* One question card: 題號 + 題目 + 四個選項 + 查看答案. All content is
     read from the question record; nothing is generated here. */
  function questionCard(question, index) {
    var card = el("div", { class: "mat-question__card" });

    card.appendChild(el("div", { class: "mat-question__q" }, [
      el("span", { class: "mat-question__num", text: "第 " + (index + 1) + " 題" }),
      el("p", { class: "mat-question__text", text: String(question.question || "") })
    ]));

    var options = Array.isArray(question.options) ? question.options : [];
    var LETTERS = ["A", "B", "C", "D", "E", "F"];
    card.appendChild(el("ul", { class: "mat-question__options" },
      options.map(function (opt, i) {
        return el("li", { class: "mat-question__option" }, [
          el("span", { class: "mat-question__optletter", text: (LETTERS[i] || String(i + 1)) + "." }),
          el("span", { class: "mat-question__opttext", text: String(opt) })
        ]);
      })));

    /* 查看答案 — reveals the real answer + existing explanation only. */
    var answerBox = el("div", { class: "mat-question__answer", hidden: "hidden" }, [
      el("p", { class: "mat-question__answerline" }, [
        el("span", { class: "mat-question__answerlabel", text: "正確答案：" }),
        el("span", { class: "mat-question__answervalue", text: String(question.answer || "") })
      ]),
      question.explanation
        ? el("p", { class: "mat-question__explain" }, [
            el("span", { class: "mat-question__answerlabel", text: "解析：" }),
            el("span", { text: String(question.explanation) })
          ])
        : null
    ]);
    var revealBtn = el("button", {
      type: "button", class: "mat-question__reveal", text: "查看答案"
    });
    revealBtn.addEventListener("click", function () {
      if (answerBox.hasAttribute("hidden")) {
        answerBox.removeAttribute("hidden");
        revealBtn.textContent = "隱藏答案";
      } else {
        answerBox.setAttribute("hidden", "hidden");
        revealBtn.textContent = "查看答案";
      }
    });
    card.appendChild(revealBtn);
    card.appendChild(answerBox);
    return card;
  }

  /* create(item) — the whole「AI 練習題」section. Returns { node }. */
  function create(item) {
    var section = el("section", { class: "mat-question", "aria-label": "AI 練習題" });

    function render(state, set) {
      section.innerHTML = "";
      section.appendChild(el("div", { class: "mat-summary__head" }, [
        el("h3", { class: "mat-summary__heading", text: "AI 練習題" })
      ]));

      if (state === "loading") {
        section.appendChild(el("p", { class: "mat-summary__loading", text: "AI 正在產生練習題..." }));
        return;
      }

      if (state === "ready" && hasQuestions(set)) {
        section.appendChild(el("div", { class: "mat-question__list" },
          set.questions.map(function (q, i) { return questionCard(q, i); })));
        /* 重新產生題目 — regenerates from the same graph, no re-analysis. */
        var reloadBtn = el("button", {
          type: "button", class: "mat-summary__btn mat-question__reload", text: "重新產生題目"
        });
        reloadBtn.addEventListener("click", function () { generate(true); });
        section.appendChild(reloadBtn);
        return;
      }

      if (state === "empty") {
        section.appendChild(el("p", { class: "mat-summary__notice",
          text: "此教材目前尚無可出題的內容（需先具備教材文字內容）。" }));
      }

      /* idle / empty both offer the generate button. */
      var genBtn = el("button", {
        type: "button", class: "mat-summary__btn", text: "產生 AI 題目"
      });
      genBtn.addEventListener("click", function () { generate(false); });
      section.appendChild(genBtn);
    }

    function generate(force) {
      render("loading");
      /* Defer so the loading state paints before the synchronous,
         in-memory generation runs. */
      window.setTimeout(function () {
        var service = AHS.AITutorService;
        var set = (service && typeof service.ensureQuestionSet === "function")
          ? service.ensureQuestionSet(item.id, force) : null;
        if (hasQuestions(set)) { render("ready", set); } else { render("empty"); }
      }, 0);
    }

    /* Initial state: show an existing set if one is already in memory,
       otherwise offer the generate button. Reading is pure. */
    var service = AHS.AITutorService;
    var existing = (service && typeof service.getPracticeQuestions === "function")
      ? service.getPracticeQuestions(item.id) : [];
    if (Array.isArray(existing) && existing.length &&
        service && typeof service.getTutorSession === "function") {
      render("ready", { questions: existing });
    } else {
      render("idle");
    }

    return { node: section, render: render };
  }

  return { create: create, hasQuestions: hasQuestions };
})();
