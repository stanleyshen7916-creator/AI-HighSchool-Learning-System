/* components/AiTutorHomeCard.js — AI 巧巧老師 home card.
   Speech message + "ask" button + four quick-action tiles + character
   illustration. NOT a full chat room (Product Baseline forbids that on
   Home) — just an entry point. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.AiTutorHomeCard = (function () {
  "use strict";
  var el = AHS.UI.el;

  function actionTile(action, status) {
    var btn = el("button", { type: "button", class: "tutor-card__tile" }, [
      el("span", { class: "tutor-card__tile-icon", html: AHS.Icons[action.icon]() }),
      el("span", { class: "tutor-card__tile-label", text: action.label }),
      el("span", { class: "tutor-card__tile-desc", text: action.desc })
    ]);
    btn.addEventListener("click", function () {
      status.textContent = "（Mock）啟動：" + action.label;
      status.removeAttribute("hidden");
    });
    return btn;
  }

  /* create(model?) — model defaults to AHS.Mock.aiTutor. */
  function create(model) {
    var data = model || AHS.Mock.aiTutor;
    var status = el("p", {
      class: "tutor-card__status", "aria-live": "polite", hidden: "hidden"
    });

    var askBtn = el("button", { type: "button", class: "tutor-card__ask" }, [
      el("span", { html: AHS.Icons.chat() }),
      el("span", { text: data.askLabel })
    ]);
    askBtn.addEventListener("click", function () {
      status.textContent = data.askFeedback;
      status.removeAttribute("hidden");
    });

    return el("section", { class: "card tutor-card", "aria-label": data.title }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: data.title }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "換一句話" }),
          el("span", { html: AHS.Icons.refresh() })
        ])
      ]),
      el("div", { class: "tutor-card__top" }, [
        el("div", { class: "tutor-card__speech" }, [
          el("p", { class: "tutor-card__msg", text: data.message }),
          askBtn
        ]),
        el("div", {
          class: "tutor-card__avatar qiaoqiao-full qiaoqiao-full--sm",
          html: AHS.Qiaoqiao.full("pointing")
        })
      ]),
      el("div", { class: "tutor-card__tiles" },
        data.actions.map(function (a) { return actionTile(a, status); })),
      status
    ]);
  }

  return { create: create };
})();
