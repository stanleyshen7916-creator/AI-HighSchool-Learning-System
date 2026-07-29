/* js/ui/AIGatewayPanel.js — Sprint AI-101C · Frontend AI Integration
   Scope items 4-6: a real, additive「AI Gateway」section for the
   material preview overlay, offering Gateway-backed Summary and
   Question generation alongside the existing (untouched) 「AI 重點整理」
   /「AI 練習題」cards. Thin presentation only — every piece of content
   comes from AHS.SummaryAdapter.generateViaGateway()/
   AHS.QuestionAdapter.generateViaGateway() (Sprint AI-101C), which never
   fabricates a response: a real network failure, timeout, or schema
   mismatch surfaces here as a real, friendly error state with a Retry
   button — this panel never fakes success.

   Reuses the existing mat-summary__ and mat-question__ prefixed classes
   (same card/button/loading/notice styles MaterialSummaryCard.js and
   MaterialQuestionCard.js already use) rather than introducing new CSS —
   zero CSS files touched by this Sprint. */
window.AHS = window.AHS || {};
AHS.AIGatewayPanel = (function () {
  "use strict";

  var el = AHS.UI.el;

  function summaryContent(data) {
    var children = [
      el("h4", { class: "mat-summary__title", text: data.title || "AI Gateway 重點整理" })
    ];
    [["concepts", "重點概念"], ["definitions", "重要定義"], ["formulas", "公式"], ["examples", "範例"]]
      .forEach(function (pair) {
        var list = Array.isArray(data[pair[0]]) ? data[pair[0]] : [];
        if (!list.length) { return; }
        children.push(el("p", { class: "mat-summary__label", text: pair[1] }));
        children.push(el("ul", { class: "mat-summary__points" },
          list.map(function (item) { return el("li", { class: "mat-summary__point", text: String(item) }); })));
      });
    var keywords = Array.isArray(data.keywords) ? data.keywords : [];
    if (keywords.length) {
      children.push(el("p", { class: "mat-summary__label", text: "關鍵字" }));
      children.push(el("div", { class: "mat-summary__keywords" },
        keywords.map(function (kw) { return el("span", { class: "mat-summary__chip", text: String(kw) }); })));
    }
    return el("div", { class: "mat-summary__card" }, children);
  }

  function questionItem(question, index) {
    var options = Array.isArray(question.options) ? question.options : [];
    var LETTERS = ["A", "B", "C", "D", "E", "F"];
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
    var revealBtn = el("button", { type: "button", class: "mat-question__reveal", text: "查看答案" });
    revealBtn.addEventListener("click", function () {
      if (answerBox.hasAttribute("hidden")) { answerBox.removeAttribute("hidden"); revealBtn.textContent = "隱藏答案"; }
      else { answerBox.setAttribute("hidden", "hidden"); revealBtn.textContent = "查看答案"; }
    });
    return el("div", { class: "mat-question__card" }, [
      el("div", { class: "mat-question__q" }, [
        el("span", { class: "mat-question__num", text: "第 " + (index + 1) + " 題" }),
        el("p", { class: "mat-question__text", text: String(question.question || "") })
      ]),
      el("ul", { class: "mat-question__options" }, options.map(function (opt, i) {
        return el("li", { class: "mat-question__option" }, [
          el("span", { class: "mat-question__optletter", text: (LETTERS[i] || String(i + 1)) + "." }),
          el("span", { class: "mat-question__opttext", text: String(opt) })
        ]);
      })),
      revealBtn, answerBox
    ]);
  }

  function questionContent(data) {
    var questions = Array.isArray(data.questions) ? data.questions : [];
    if (!questions.length) {
      return el("p", { class: "mat-summary__notice", text: "AI Gateway 回應中沒有任何題目。" });
    }
    return el("div", { class: "mat-question__list" }, questions.map(questionItem));
  }

  /* create(item, spec) — spec: { operation: "summary"|"question",
     heading, buttonLabel, adapter: {generateViaGateway}, renderContent }.
     Returns { node, render } — same shape as MaterialSummaryCard/
     MaterialQuestionCard's create(). */
  function create(item, spec) {
    var section = el("section", { class: "mat-summary", "aria-label": spec.heading });
    var inFlight = false;

    function render(state, payload) {
      section.innerHTML = "";
      section.appendChild(el("div", { class: "mat-summary__head" }, [
        el("h3", { class: "mat-summary__heading", text: spec.heading }
      )]));

      if (state === "loading") {
        section.appendChild(el("p", { class: "mat-summary__loading", text: "AI Gateway 正在產生內容..." }));
        return;
      }

      if (state === "ready") {
        section.appendChild(spec.renderContent(payload));
        var retryBtn = el("button", { type: "button", class: "mat-summary__btn", text: "重新產生" });
        retryBtn.addEventListener("click", generate);
        section.appendChild(retryBtn);
        return;
      }

      if (state === "error") {
        section.appendChild(el("p", { class: "mat-summary__notice", text: payload }));
        var retry = el("button", { type: "button", class: "mat-summary__btn", text: "重試" });
        retry.addEventListener("click", generate);
        section.appendChild(retry);
        return;
      }

      /* idle */
      var genBtn = el("button", { type: "button", class: "mat-summary__btn", text: spec.buttonLabel });
      genBtn.addEventListener("click", generate);
      section.appendChild(genBtn);
    }

    function generate() {
      if (inFlight) { return; }
      inFlight = true;
      render("loading");
      spec.adapter.generateViaGateway(item.id).then(function (result) {
        inFlight = false;
        if (result.ok) { render("ready", result.data); }
        else { render("error", result.message); }
      });
    }

    render("idle");
    return { node: section, render: render };
  }

  function createSummaryPanel(item) {
    return create(item, {
      operation: "summary",
      heading: "AI Gateway 重點整理",
      buttonLabel: "透過 AI Gateway 產生重點整理",
      adapter: AHS.SummaryAdapter,
      renderContent: summaryContent
    });
  }

  function createQuestionPanel(item) {
    return create(item, {
      operation: "question",
      heading: "AI Gateway 練習題",
      buttonLabel: "透過 AI Gateway 產生練習題",
      adapter: AHS.QuestionAdapter,
      renderContent: questionContent
    });
  }

  return { create: create, createSummaryPanel: createSummaryPanel, createQuestionPanel: createQuestionPanel };
})();
