/* components/AiTutor.js — AI Tutor (巧巧老師) chat page.
   Hero + chat thread + input bar (left), suggestion tiles (middle),
   chat history + common resources (right). Sending a message appends the
   user bubble, then always either a real, grounded answer or a real
   answerable menu from AHS.TutorEngine.js's Rule-Based engine (no LLM/AI
   API — see that file's own header) — no fabricated canned reply.
   PascalCase under window.AHS. Assistant avatar reuses AHS.Qiaoqiao. */
window.AHS = window.AHS || {};
AHS.AiTutor = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  var FILE_TONE = { PDF: "#ef4444", PPT: "#f59e0b", DOCX: "#3b82f6", XLSX: "#22b573", MP4: "#7c5cff" };

  /* menu(actionList, onPick) — AHS.TutorEngine's off-topic menu, rendered
     inline under the reply. Every item is guaranteed to lead to a real
     answer (TutorEngine.offTopicMenu()'s own contract), never a dead
     end. Mirrors js/components/AiTutorHomeCard.js's established
     href-vs-button split: a real href renders a plain <a> (real
     navigation, never window.location.href=); no href re-invokes
     sendMessage() with that exact label — guaranteed answerable since
     TutorEngine only ever offers it here after resolving the question. */
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

  function bubble(msg, onMenuPick) {
    if (msg.role === "user") {
      return el("div", { class: "tutor-msg tutor-msg--user" }, [
        el("div", { class: "tutor-msg__bubble", text: msg.text }),
        el("span", { class: "tutor-msg__time", text: msg.time })
      ]);
    }
    // assistant: avatar + text lines (preserve line breaks)
    var lines = msg.text.split("\n");
    var body = el("div", { class: "tutor-msg__bubble" },
      lines.map(function (ln, i) {
        return el("span", { class: "tutor-msg__line", text: ln, "data-i": String(i) });
      }));
    var actions = el("div", { class: "tutor-msg__actions" }, [
      el("button", { type: "button", class: "tutor-msg__act", "aria-label": "複製", html: AHS.Icons.copy() }),
      el("button", { type: "button", class: "tutor-msg__act", "aria-label": "讚", html: AHS.Icons.like() }),
      el("button", { type: "button", class: "tutor-msg__act", "aria-label": "倒讚", html: AHS.Icons.dislike() })
    ]);
    var colChildren = [body];
    if (Array.isArray(msg.actions) && msg.actions.length) {
      colChildren.push(menu(msg.actions, onMenuPick));
    }
    colChildren.push(el("div", { class: "tutor-msg__foot" }, [
      el("span", { class: "tutor-msg__time", text: msg.time }),
      actions
    ]));
    return el("div", { class: "tutor-msg tutor-msg--ai" }, [
      el("span", { class: "tutor-msg__avatar qiaoqiao-bust qiaoqiao-bust--sm",
        html: AHS.Qiaoqiao.bust("gentle") }),
      el("div", { class: "tutor-msg__col" }, colChildren)
    ]);
  }

  function hero(data) {
    return el("section", { class: "tutor-hero", "aria-label": data.title }, [
      el("div", { class: "tutor-hero__avatar qiaoqiao-bust qiaoqiao-bust--xl",
        html: AHS.Qiaoqiao.bust("greeting") }),
      el("div", { class: "tutor-hero__text" }, [
        el("h1", { class: "tutor-hero__title", text: data.title }),
        el("p", { class: "tutor-hero__tagline", text: data.tagline }),
        el("span", { class: "tutor-hero__badge" }, [
          el("span", { html: AHS.Icons.robot() }),
          el("span", { text: data.badge })
        ])
      ])
    ]);
  }

  /* pageContext (Phase 1, additive/optional) — { questionId } from
     AHS.PlatformContext.resolve(), passed in by js/pages/AppTutor.js.
     Lets sendMessage() ground a real answer via AHS.TutorEngine when the
     student arrived here from a specific real question (js/components/
     WrongBook.js's new "問 AI 巧巧老師" link). */
  function create(model, pageContext) {
    var data = model || AHS.AppConfig.aiTutorPage;

    var thread = el("div", { class: "tutor-thread" }, [
      el("div", { class: "tutor-thread__day", text: "今天" })
    ]);
    data.messages.forEach(function (m) { thread.appendChild(bubble(m)); });

    function scrollBottom() { thread.scrollTop = thread.scrollHeight; }

    function sendMessage(text) {
      if (!text) { return; }
      thread.appendChild(bubble({ role: "user", time: "剛剛", text: text }));
      /* AHS.TutorEngine.js's Rule-Based engine always answers (a real,
         grounded reply, or a real answerable menu — never a dead end);
         the only fallback needed here is the defensive "core not ready"
         case (EO-S7.0-HOTFIX-001), never a fabricated canned reply. */
      var engineReply = (AHS.TutorEngine && typeof AHS.TutorEngine.reply === "function")
        ? AHS.TutorEngine.reply(text, pageContext) : null;
      if (engineReply && typeof engineReply === "object") {
        thread.appendChild(bubble({ role: "assistant", time: "剛剛", text: engineReply.message, actions: engineReply.actions }, sendMessage));
      } else {
        thread.appendChild(bubble({ role: "assistant", time: "剛剛", text: engineReply || "系統資源載入失敗，暫時無法回覆，請重新整理頁面。" }));
      }
      scrollBottom();
    }

    var input = el("input", {
      class: "tutor-input__field", type: "text",
      placeholder: "輸入你的問題…", "aria-label": "輸入你的問題"
    });
    var sendBtn = el("button", {
      type: "button", class: "tutor-input__send", "aria-label": "送出",
      html: AHS.Icons.send()
    });
    function submit() {
      var v = input.value.trim();
      if (v) { sendMessage(v); input.value = ""; input.focus(); }
    }
    sendBtn.addEventListener("click", submit);
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); submit(); }
    });

    /* AI-129 hotfix: 上傳檔案／拍照上傳／語音輸入 had no click handler at
       all (never wired to any real feature) — a dead, non-functional row
       that only misled students into thinking it did something. Hidden
       per explicit report rather than left as dead UI; the row can come
       back once a real upload/voice pipeline exists to back it. */
    var inputBar = el("div", { class: "tutor-input" }, [
      el("div", { class: "tutor-input__row" }, [input, sendBtn])
    ]);

    var chatCol = el("div", { class: "tutor-chat card" }, [thread, inputBar]);

    /* suggestions */
    var suggestions = el("section", { class: "card tutor-suggest", "aria-label": "你可以試著問我" }, [
      el("h2", { class: "card__title tutor-suggest__title" }, [
        el("span", { class: "tutor-suggest__spark", html: AHS.Icons.sparkle() }),
        el("span", { text: "你可以試著問我" })
      ]),
      el("div", { class: "tutor-suggest__list" },
        data.suggestions.map(function (s) {
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
    ]);

    /* history */
    var history = el("section", { class: "card tutor-history", "aria-label": "對話歷史" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "對話歷史" }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      el("div", { class: "tutor-history__list" },
        data.history.map(function (h) {
          return el("button", { type: "button", class: "tutor-history__item" }, [
            el("span", { class: "tutor-history__icon", html: AHS.Icons.chat() }),
            el("span", { class: "tutor-history__meta" }, [
              el("span", { class: "tutor-history__title-row" }, [
                el("span", { class: "tutor-history__title", text: h.title }),
                el("span", { class: "tutor-history__time", text: h.time })
              ]),
              el("span", { class: "tutor-history__sub", text: h.sub })
            ])
          ]);
        }))
    ]);

    /* resources */
    var resources = el("section", { class: "card tutor-res", "aria-label": "常用資源" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "常用資源" }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      el("div", { class: "tutor-res__list" },
        data.resources.map(function (r) {
          var tone = FILE_TONE[r.type] || "#6b7280";
          return el("button", { type: "button", class: "tutor-res__item" }, [
            el("span", { class: "tutor-res__badge",
              style: "color:" + tone + ";background-color:" + tone + "1a", text: r.type }),
            el("span", { class: "tutor-res__name", text: r.name }),
            el("span", { class: "tutor-res__dl", html: AHS.Icons.download() })
          ]);
        }))
    ]);

    var main = el("div", { class: "tutor-main" }, [hero(data), chatCol]);
    var rail = el("div", { class: "tutor-rail" }, [suggestions, history, resources]);

    return el("div", { class: "tutor-layout" }, [main, rail]);
  }

  return { create: create };
})();
