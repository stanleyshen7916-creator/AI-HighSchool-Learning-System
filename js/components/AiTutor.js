/* components/AiTutor.js — 學習助教（巧巧老師） page, 2026-09-30.

   Formerly "AI Tutor" with static demo history/resources. Now every reply
   comes from AHS.StudyAssistant (js/runtime/StudyAssistant.js): no LLM /
   AI API, only the current Workspace's own teaching materials.

     Left  hero + chat. 查觀念: type a concept, get the materials' own
           sentences with their source; 出題考我: in-chat quiz cards.
     Right 我的學習狀況（我哪裡弱／今天讀什麼 — from the student's own
           知識弱點 and mastery records), 出題考我 settings,
           「你可以這樣問」 topics taken from the real
           question banks, and — only when the student arrived from a
           specific 知識弱點 question (pageContext.questionId) — the two
           AHS.TutorEngine intents for that question.

   create(model?, pageContext?) — both optional (model defaults to
   AHS.AppConfig.aiTutorPage). PascalCase under window.AHS. */
window.AHS = window.AHS || {};
AHS.AiTutor = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */
  var DISPLAY_KEYS = ["A", "B", "C", "D", "E", "F"];

  function menu(actionList, onPick) {
    return el("div", { class: "tutor-msg__menu" },
      actionList.map(function (a) {
        if (a.href) {
          return el("a", { class: "tutor-msg__menu-item", href: a.href }, [el("span", { text: a.label })]);
        }
        var btn = el("button", { type: "button", class: "tutor-msg__menu-item" }, [el("span", { text: a.label })]);
        if (onPick) { btn.addEventListener("click", function () { onPick(a.label); }); }
        return btn;
      }));
  }

  /* assistant bubble with arbitrary content nodes */
  function aiBubble(contentNodes, actions, onMenuPick) {
    var col = [el("div", { class: "tutor-msg__bubble" }, contentNodes)];
    if (Array.isArray(actions) && actions.length) { col.push(menu(actions, onMenuPick)); }
    return el("div", { class: "tutor-msg tutor-msg--ai" }, [
      el("span", { class: "tutor-msg__avatar qiaoqiao-bust qiaoqiao-bust--sm", html: AHS.Qiaoqiao.bust("gentle") }),
      el("div", { class: "tutor-msg__col" }, col)
    ]);
  }

  function textLines(text) {
    return String(text).split("\n").map(function (ln, i) {
      return el("span", { class: "tutor-msg__line", text: ln, "data-i": String(i) });
    });
  }

  function bubble(msg, onMenuPick) {
    if (msg.role === "user") {
      return el("div", { class: "tutor-msg tutor-msg--user" }, [el("div", { class: "tutor-msg__bubble", text: msg.text })]);
    }
    return aiBubble(textLines(msg.text), msg.actions, onMenuPick);
  }

  function hero(data) {
    return el("section", { class: "tutor-hero", "aria-label": data.title }, [
      el("div", { class: "tutor-hero__avatar qiaoqiao-bust qiaoqiao-bust--xl", html: AHS.Qiaoqiao.bust("greeting") }),
      el("div", { class: "tutor-hero__text" }, [
        el("h1", { class: "tutor-hero__title", text: data.title }),
        el("p", { class: "tutor-hero__tagline", text: data.tagline }),
        el("span", { class: "tutor-hero__badge" }, [
          el("span", { html: AHS.Icons.book() }),
          el("span", { text: data.badge })
        ])
      ])
    ]);
  }

  function subjectSelect(subjects, withAll) {
    var s = el("select", { class: "tutor-select", "aria-label": "科目" });
    if (withAll) { s.appendChild(el("option", { value: "", text: "全部科目" })); }
    subjects.forEach(function (sub) { s.appendChild(el("option", { value: sub.key, text: sub.name })); });
    return s;
  }

  /* 查觀念 results: each item is the material's own sentence + source */
  function searchResults(reply) {
    var list = el("ol", { class: "tutor-results" }, reply.results.map(function (r) {
      var source = el("span", { class: "tutor-results__source" }, [
        el("span", { class: "tutor-results__tag", text: r.subjectName + "・" + r.kind }),
        el("span", { class: "tutor-results__title", text: r.title })
      ]);
      if (r.runtimeId) {
        source.appendChild(el("a", { class: "tutor-results__link", href: "materials.html?id=" + encodeURIComponent(r.runtimeId), text: "看教材" }));
      }
      return el("li", { class: "tutor-results__item" }, [el("p", { class: "tutor-results__text", text: r.text }), source]);
    }));
    return [
      el("span", { class: "tutor-msg__line", text: "教材裡和「" + reply.query + "」有關的內容：" }),
      list,
      el("span", { class: "tutor-msg__note", text: "以上都是教材原文，沒有經過改寫。" })
    ];
  }

  function create(model, pageContext) {
    var data = model || AHS.AppConfig.aiTutorPage;
    var ctx = pageContext || {};
    var SA = AHS.StudyAssistant;
    var subjects = SA ? SA.subjects() : [];

    var thread = el("div", { class: "tutor-thread", "aria-live": "polite" });
    function scrollBottom() { thread.scrollTop = thread.scrollHeight; }
    function push(node) { thread.appendChild(node); scrollBottom(); return node; }

    (data.messages || []).forEach(function (m) { push(bubble(m)); });
    push(bubble({
      role: "assistant",
      text: subjects.length
        ? "嗨！我是學習助教。輸入一個觀念（例如「" + ((SA.topics("", 1)[0]) || "半衰期") + "」），我會找出教材裡的原文給你；想練習的話，輸入「出題考我」，或使用「出題考我」卡片選科目與題數。"
        : "目前這個學期還沒有可以查詢的教材，等教材上架後就可以開始使用。"
    }));

    var chatSubject = subjectSelect(subjects, true);

    /* ---- 出題考我 ------------------------------------------------------ */
    function runQuiz(opts) {
      if (!SA) { return; }
      var picked = SA.pickQuiz(opts);
      if (!picked.questions.length) {
        push(bubble({ role: "assistant", text: "這個範圍目前沒有可以出的單選題。" }));
        return;
      }
      var intro = "開始出題：共 " + picked.questions.length + " 題" +
        (opts.weakFirst ? (picked.fromWeak ? "，其中 " + picked.fromWeak + " 題來自你的知識弱點" : "（目前沒有未精熟的知識弱點，改從題庫隨機出題）") : "") + "。";
      push(bubble({ role: "assistant", text: intro }));
      var score = { right: 0, wrong: 0 };
      askNext(picked.questions, 0, score);
    }

    function askNext(questions, index, score) {
      if (index >= questions.length) {
        push(bubble({
          role: "assistant",
          text: "作答完成：" + questions.length + " 題答對 " + score.right + " 題。" +
            (score.wrong ? "答錯的 " + score.wrong + " 題已加入「知識弱點」，之後可以在那裡重做。" : "全部答對，太棒了！")
        }, null));
        return;
      }
      var q = questions[index];
      var feedback = el("div", { class: "tutor-quiz__feedback", hidden: "hidden" });
      var options = el("div", { class: "tutor-quiz__options" });
      q.displayOptions.forEach(function (opt, i) {
        var btn = el("button", { type: "button", class: "tutor-quiz__option", "data-key": opt.key }, [
          el("span", { class: "tutor-quiz__key", text: DISPLAY_KEYS[i] }),
          el("span", { class: "tutor-quiz__text", text: opt.text })
        ]);
        btn.addEventListener("click", function () {
          if (options.getAttribute("data-answered")) { return; }
          options.setAttribute("data-answered", "true");
          var result = SA.answer(q, opt.key);
          if (result.correct) { score.right += 1; } else { score.wrong += 1; }
          Array.prototype.forEach.call(options.children, function (b) {
            b.disabled = true;
            if (b.getAttribute("data-key") === q.correctAnswer) { b.classList.add("is-correct"); }
            else if (b === btn) { b.classList.add("is-wrong"); }
          });
          var correctLabel = DISPLAY_KEYS[q.displayOptions.map(function (o) { return o.key; }).indexOf(q.correctAnswer)];
          feedback.appendChild(el("p", {
            class: "tutor-quiz__verdict " + (result.correct ? "is-correct" : "is-wrong"),
            text: result.correct ? "答對了！" : "答錯了，正確答案是 " + correctLabel + "「" + result.correctText + "」。"
          }));
          /* 2026-10-01 數學詳解補強: steps + figures when available. */
          var rich = AHS.ExplanationSupplement ? AHS.ExplanationSupplement.render(q, result.explanation) : null;
          if (rich) { feedback.appendChild(el("div", { class: "tutor-quiz__explain tutor-quiz__explain--rich" }, [rich])); }
          else if (result.explanation) { feedback.appendChild(el("p", { class: "tutor-quiz__explain", text: "詳解：" + result.explanation })); }
          feedback.removeAttribute("hidden");
          scrollBottom();
          askNext(questions, index + 1, score);
        });
        options.appendChild(btn);
      });
      push(aiBubble([
        el("p", { class: "tutor-quiz__meta", text: "第 " + (index + 1) + "／" + questions.length + " 題・" + (AHS.Subjects[q.subject] ? AHS.Subjects[q.subject].name : "") + "・" + (q.knowledgePoint || "") }),
        el("p", { class: "tutor-quiz__stem", text: q.text }),
        (window.AHS && AHS.QuestionReference ? AHS.QuestionReference.node(q) : null),
        options,
        feedback
      ]));
    }

    /* ---- 對話 ---------------------------------------------------------- */
    function sendMessage(text) {
      if (!text) { return; }
      push(bubble({ role: "user", text: text }));
      var reply = SA ? SA.reply(text, { subject: chatSubject.value || undefined, questionId: ctx.questionId }) : null;
      if (!reply) {
        push(bubble({ role: "assistant", text: "系統資源載入失敗，暫時無法回覆，請重新整理頁面。" }));
        return;
      }
      if (reply.type === "text") {
        push(bubble({ role: "assistant", text: reply.message }));
      } else if (reply.type === "weak") {
        push(aiBubble(weakNodes(reply.weakness)));
      } else if (reply.type === "plan") {
        push(aiBubble(planNodes(reply.plan)));
      } else if (reply.type === "quiz") {
        runQuiz({ subject: chatSubject.value || undefined, count: 5, weakFirst: true });
      } else if (reply.type === "search") {
        push(aiBubble(searchResults(reply)));
      } else {
        var nodes = textLines(reply.message);
        if (reply.topics && reply.topics.length) { nodes.push(topicChips(reply.topics)); }
        push(aiBubble(nodes, reply.actions, sendMessage));
      }
    }

    /* ---- 我哪裡弱／今天讀什麼 ------------------------------------------ */
    function actionButton(label, onClick) {
      var b = el("button", { type: "button", class: "tutor-msg__menu-item", text: label });
      b.addEventListener("click", onClick);
      return b;
    }

    function searchAction(query) {
      return actionButton("查觀念", function () { sendMessage(query); });
    }

    function quizAction(label, opts) {
      return actionButton(label, function () {
        push(bubble({ role: "user", text: label }));
        runQuiz(opts);
      });
    }

    function weakNodes(w) {
      if (!w.total) {
        return textLines("目前沒有未精熟的知識弱點。可以先做一次「出題考我」，答錯的題目會自動記下來，我再幫你整理。")
          .concat([el("div", { class: "tutor-msg__menu" }, [quizAction("出題考我", { count: 5 })])]);
      }
      var list = el("ol", { class: "tutor-weak" }, w.points.map(function (p) {
        var facts = [p.subjectName, "錯 " + p.errors + " 次", p.questions + " 題"];
        if (p.mastery !== null) { facts.push("掌握度 " + p.mastery + "%"); }
        var actions = [searchAction(p.knowledgePoint)];
        if (p.practicable) {
          actions.push(quizAction("練習「" + p.knowledgePoint + "」", { knowledgePoint: p.knowledgePoint, count: Math.min(5, p.practicable) }));
        }
        return el("li", { class: "tutor-weak__item" }, [
          el("strong", { class: "tutor-weak__kp", text: p.knowledgePoint }),
          el("span", { class: "tutor-weak__facts", text: facts.join("・") }),
          el("div", { class: "tutor-msg__menu" }, actions)
        ]);
      }));
      var nodes = [el("span", { class: "tutor-msg__line", text: "你目前有 " + w.total + " 題還沒精熟的知識弱點，錯最多的是：" }), list];
      if (w.stale) {
        nodes.push(el("span", { class: "tutor-msg__line", text: "其中 " + w.stale + " 題已經超過 7 天沒複習。" }));
        nodes.push(el("div", { class: "tutor-msg__menu" }, [el("a", { class: "tutor-msg__menu-item", href: "wrongbook.html", text: "前往知識弱點重做" })]));
      }
      return nodes;
    }

    function planNodes(p) {
      var intro = p.empty
        ? "你還沒有作答紀錄，今天先從這一步開始："
        : "依你目前的 " + p.total + " 題知識弱點，今天建議這樣讀：";
      var steps = el("ol", { class: "tutor-plan" }, p.steps.map(function (s) {
        var a = s.action;
        var buttons = [];
        if (s.search) { buttons.push(searchAction(s.search)); }
        if (a.type === "wrongbook") {
          buttons.push(el("a", { class: "tutor-msg__menu-item", href: "wrongbook.html", text: "前往知識弱點" }));
        } else if (a.type === "quiz") {
          buttons.push(quizAction(a.knowledgePoint ? "練習「" + a.knowledgePoint + "」" : "開始練習", { knowledgePoint: a.knowledgePoint, count: a.count, weakFirst: a.weakFirst }));
        } else if (a.type === "search" && !s.search) {
          buttons.push(searchAction(a.query));
        }
        return el("li", { class: "tutor-plan__step" }, [
          el("span", { class: "tutor-plan__text", text: s.text }),
          el("div", { class: "tutor-msg__menu" }, buttons)
        ]);
      }));
      return [el("span", { class: "tutor-msg__line", text: intro }), steps];
    }

    function topicChips(list) {
      return el("div", { class: "tutor-topics" }, list.map(function (t) {
        var b = el("button", { type: "button", class: "tutor-topics__chip", text: t });
        b.addEventListener("click", function () { sendMessage(t); });
        return b;
      }));
    }

    var input = el("input", { class: "tutor-input__field", type: "text", placeholder: "輸入想查的觀念，或輸入「出題考我」…", "aria-label": "輸入你的問題" });
    var sendBtn = el("button", { type: "button", class: "tutor-input__send", "aria-label": "送出", html: AHS.Icons.send() });
    function submit() {
      var v = input.value.trim();
      if (v) { sendMessage(v); input.value = ""; input.focus(); }
    }
    sendBtn.addEventListener("click", submit);
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); submit(); }
    });

    var inputBar = el("div", { class: "tutor-input" }, [
      el("div", { class: "tutor-input__row" }, [chatSubject, input, sendBtn])
    ]);
    var chatCol = el("div", { class: "tutor-chat card" }, [thread, inputBar]);

    /* ---- 右欄 ------------------------------------------------------------ */
    var quizSubject = subjectSelect(subjects, true);
    var quizCount = el("select", { class: "tutor-select", "aria-label": "題數" }, [5, 10].map(function (n) {
      return el("option", { value: String(n), text: n + " 題" });
    }));
    var weakBox = el("input", { type: "checkbox", class: "tutor-check__box", checked: "checked" });
    var startBtn = el("button", { type: "button", class: "tutor-start", text: "開始出題" });
    startBtn.addEventListener("click", function () {
      push(bubble({ role: "user", text: "出題考我" + (quizSubject.value ? "（" + AHS.Subjects[quizSubject.value].name + "）" : "") }));
      runQuiz({ subject: quizSubject.value || undefined, count: Number(quizCount.value), weakFirst: weakBox.checked });
    });
    var quizCard = el("section", { class: "card tutor-quiz-card", "aria-label": "出題考我" }, [
      el("h2", { class: "card__title", text: "出題考我" }),
      el("p", { class: "tutor-card-hint", text: "從這學期教材的題庫出單選題，答錯的題目會自動加入知識弱點。" }),
      el("div", { class: "tutor-quiz-card__row" }, [quizSubject, quizCount]),
      el("label", { class: "tutor-check" }, [weakBox, el("span", { text: "優先出我的知識弱點" })]),
      startBtn
    ]);

    var topicSlot = el("div");
    function renderTopics() {
      var list = SA ? SA.topics(chatSubject.value || "", 10) : [];
      AHS.UI.mount(topicSlot, list.length ? topicChips(list) : el("p", { class: "tutor-card-hint", text: "這個科目目前沒有可以建議的觀念。" }));
    }
    chatSubject.addEventListener("change", renderTopics);
    renderTopics();
    var topicsCard = el("section", { class: "card tutor-suggest", "aria-label": "你可以這樣問" }, [
      el("h2", { class: "card__title tutor-suggest__title" }, [
        el("span", { class: "tutor-suggest__spark", html: AHS.Icons.sparkle() }),
        el("span", { text: "你可以這樣問" })
      ]),
      el("p", { class: "tutor-card-hint", text: "點一個觀念，我會找出教材原文。左下可以先選科目縮小範圍。" }),
      topicSlot
    ]);

    var statusCard = el("section", { class: "card tutor-status-card", "aria-label": "我的學習狀況" }, [
      el("h2", { class: "card__title", text: "我的學習狀況" }),
      el("p", { class: "tutor-card-hint", text: "根據你的知識弱點與作答紀錄整理，不是猜的。" }),
      el("div", { class: "tutor-status-card__actions" }, ["我哪裡弱？", "今天讀什麼？"].map(function (label) {
        var b = el("button", { type: "button", class: "tutor-status-card__btn", text: label });
        b.addEventListener("click", function () { sendMessage(label); });
        return b;
      }))
    ]);

    var railCards = [statusCard, quizCard, topicsCard];
    /* 從知識弱點的「問巧巧老師」進來時：針對那一題的兩個 AHS.TutorEngine 選項 */
    if (ctx.questionId && AHS.TutorEngine && AHS.TutorEngine.resolveQuestion(ctx)) {
      railCards.unshift(el("section", { class: "card tutor-suggest", "aria-label": "針對這一題" }, [
        el("h2", { class: "card__title", text: "針對你正在看的這一題" }),
        el("div", { class: "tutor-suggest__list" }, (data.suggestions || []).map(function (s) {
          var b = el("button", { type: "button", class: "tutor-suggest__item" }, [
            el("span", { class: "tutor-suggest__icon", html: AHS.Icons[s.icon]() }),
            el("span", { class: "tutor-suggest__meta" }, [
              el("span", { class: "tutor-suggest__label", text: s.label }),
              el("span", { class: "tutor-suggest__desc", text: s.desc })
            ])
          ]);
          b.addEventListener("click", function () { sendMessage(s.label); });
          return b;
        }))
      ]));
    }

    var main = el("div", { class: "tutor-main" }, [hero(data), chatCol]);
    var rail = el("div", { class: "tutor-rail" }, railCards);
    return el("div", { class: "tutor-layout" }, [main, rail]);
  }

  return { create: create };
})();
