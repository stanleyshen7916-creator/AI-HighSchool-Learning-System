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
     read from the question record; nothing is generated here.
     HOTFIX-003 AI-304: 難度/考點 shown when the record actually has them
     (Repository-sourced questions may; AI-generated ones may not) —
     never fabricated when absent. */
  function questionCard(question, index) {
    var card = el("div", { class: "mat-question__card" });

    var metaBits = [];
    if (question.difficulty) { metaBits.push("難度：" + question.difficulty); }
    if (question.knowledgePoint) { metaBits.push("考點：" + question.knowledgePoint); }

    card.appendChild(el("div", { class: "mat-question__q" }, [
      el("span", { class: "mat-question__num", text: "第 " + (index + 1) + " 題" }),
      el("p", { class: "mat-question__text", text: String(question.question || "") }),
      metaBits.length ? el("p", { class: "mat-question__meta", text: metaBits.join("　") }) : null
    ]));

    /* Sprint AI-139: 選項改為真正可點選作答（原本只是純文字列表，點了
       沒有任何反應）— 沿用 js/components/WrongBook.js buildReviewInteraction()
       既有的 role="button"/tabindex 互動慣例，一題只能選一次：點下後立即
       用 is-correct／is-wrong 標示（答錯時同時標出正確選項），不再需要另
       外的「提交」步驟，因為這裡本來就只是預覽用途，不寫入任何 Runtime。 */
    var options = Array.isArray(question.options) ? question.options : [];
    var LETTERS = ["A", "B", "C", "D", "E", "F"];
    var correctText = String(question.answer || "");
    var answered = false;
    var optionNodes = [];
    var optionsList = el("ul", { class: "mat-question__options" });
    options.forEach(function (opt, i) {
      var optText = String(opt);
      var isAnswer = optText === correctText;
      var li = el("li", {
        class: "mat-question__option", role: "button", tabindex: "0", "aria-pressed": "false"
      }, [
        el("span", { class: "mat-question__optletter", text: (LETTERS[i] || String(i + 1)) + "." }),
        el("span", { class: "mat-question__opttext", text: optText })
      ]);
      function pick() {
        if (answered) { return; }
        answered = true;
        li.classList.add(isAnswer ? "is-correct" : "is-wrong");
        li.setAttribute("aria-pressed", "true");
        if (!isAnswer) {
          var correctLi = optionNodes.filter(function (n) { return n.isAnswer; })[0];
          if (correctLi) { correctLi.el.classList.add("is-correct"); }
        }
      }
      li.addEventListener("click", pick);
      li.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); }
      });
      optionNodes.push({ el: li, isAnswer: isAnswer });
      optionsList.appendChild(li);
    });
    card.appendChild(optionsList);

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
        /* HOTFIX-003 AI-304: "至少顯示：題數" — a real, computed count,
           never a hardcoded/fabricated number. */
        section.appendChild(el("p", { class: "mat-question__count", text: "共 " + set.questions.length + " 題" }));
        section.appendChild(el("div", { class: "mat-question__list" },
          set.questions.map(function (q, i) { return questionCard(q, i); })));
        /* Sprint AI-139（PO 回報）: 「重新產生題目」先隱藏、暫不使用 ——
           Repository-sourced 教材（repoQuiz() 命中時）本來就直接短路回傳
           同一份 quiz，force=true 也不會產生任何不同結果，按了等於沒按；
           AI 產生流程本身也還是 stub（見 CLAUDE.md parser/ 說明），同樣
           沒有真正「重新」產生的效果。保留 generate(true) 這條路徑本身
           （reloadBtn 只是不掛進畫面），未來真的接上會變化的來源時可以
           直接恢復，不必重寫。 */
        var reloadBtn = el("button", {
          type: "button", class: "mat-summary__btn mat-question__reload", text: "重新產生題目"
        });
        reloadBtn.addEventListener("click", function () { generate(true); });
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

    /* HOTFIX-003 AI-304: resolves this material's Repository-sourced
       quiz, if any — checked first by both the initial render and
       generate() itself, so a Repository-sourced material's real
       question bank is never overwritten/blanked by the AI-generation
       pipeline (which would legitimately find nothing, since these
       materials have no item.content for it to analyse). */
    function repoQuiz() {
      return (AHS.MaterialDetailRepositorySource && typeof AHS.MaterialDetailRepositorySource.resolve === "function")
        ? AHS.MaterialDetailRepositorySource.resolve(item.id) : null;
    }

    function generate(force) {
      var repo = repoQuiz();
      if (repo && hasQuestions(repo.quiz)) { render("ready", repo.quiz); return; }
      render("loading");
      /* Defer so the loading state paints before the synchronous,
         in-memory generation runs. */
      window.setTimeout(function () {
        var service = AHS.AITutorService;
        var set = (service && typeof service.ensureQuestionSet === "function")
          ? service.ensureQuestionSet(item.id, force) : null;
        if (hasQuestions(set)) {
          /* Sprint AI-015E (Option A, PMO-approved, EO-AI-015E-002):
             this button is now the single Production Question Pipeline's
             real trigger — ensureQuestionSet() generates from the
             Knowledge Graph, QuestionProviderBridge.bridge() (existing,
             unmodified, Sprint AI-015C) pushes that same real content
             into LearningQuestionSession + LearningQuestionRuntime, so
             quiz.html's read-only Practice Mode can display it. Both
             calls are existing Public API — no new Runtime, no second
             pipeline. */
          if (AHS.QuestionProviderBridge && typeof AHS.QuestionProviderBridge.bridge === "function") {
            AHS.QuestionProviderBridge.bridge(item.id);
          }
          /* Sprint AI-018 · Review Production Integration: refresh this
             material's Review list from whatever real WrongBook entries
             already exist for it (e.g. from a prior quiz.html Practice
             session) — ReviewGeneratorRuntime is memory-only, same as
             QuestionGenerationRuntime itself, so it must be re-derived on
             every real trigger rather than assumed stale-free. Honestly
             returns null when there is nothing to review yet; that is
             not treated as an error. Existing, unmodified Public API. */
          if (AHS.ReviewGeneratorRuntime && typeof AHS.ReviewGeneratorRuntime.generateReview === "function") {
            AHS.ReviewGeneratorRuntime.generateReview(item.id);
          }
          render("ready", set);
        } else {
          render("empty");
        }
      }, 0);
    }

    /* Initial state: a Repository-sourced material's real question bank
       (HOTFIX-003 AI-304) wins first — otherwise, show an existing
       AI-generated set if one is already in memory, otherwise offer the
       generate button. Reading is pure either way. */
    var initialRepo = repoQuiz();
    var service = AHS.AITutorService;
    var existing = (service && typeof service.getPracticeQuestions === "function")
      ? service.getPracticeQuestions(item.id) : [];
    if (initialRepo && hasQuestions(initialRepo.quiz)) {
      render("ready", initialRepo.quiz);
    } else if (Array.isArray(existing) && existing.length &&
        service && typeof service.getTutorSession === "function") {
      render("ready", { questions: existing });
    } else {
      render("idle");
    }

    return { node: section, render: render };
  }

  return { create: create, hasQuestions: hasQuestions };
})();
