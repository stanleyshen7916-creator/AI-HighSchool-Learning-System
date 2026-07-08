/* components/HomeRecentMaterials.js — 最近教材 (Home Recent Materials) v1.0.
   Cards: subject chip / unit / teacher / 學習進度 bar + doc & download
   actions (Mock). PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.HomeRecentMaterials = (function () {
  "use strict";
  var el = AHS.UI.el;

  function card(item, status) {
    var subj = AHS.Subjects[item.subject];
    var pct = Math.max(0, Math.min(100, item.percent));

    var docBtn = el("button", {
      type: "button", class: "recent-card__act",
      "aria-label": "開啟教材", html: AHS.Icons.doc()
    });
    var dlBtn = el("button", {
      type: "button", class: "recent-card__act",
      "aria-label": "下載教材", html: AHS.Icons.download()
    });
    function announce(msg) {
      status.textContent = msg;
      status.removeAttribute("hidden");
    }
    docBtn.addEventListener("click", function () {
      announce("（Mock）開啟教材：" + subj.name + "《" + item.unit + "》");
    });
    dlBtn.addEventListener("click", function () {
      announce("（Mock）下載教材：" + subj.name + "《" + item.unit + "》");
    });

    return el("article", { class: "recent-card" }, [
      el("span", {
        class: "chip",
        style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
      }, [el("span", { text: subj.name })]),
      el("h3", { class: "recent-card__unit", text: item.unit }),
      el("p", { class: "recent-card__meta", text: "高一" + subj.name + "｜" + item.teacher }),
      el("div", { class: "recent-card__progress" }, [
        el("div", { class: "recent-card__progress-head" }, [
          el("span", { text: "學習進度" }),
          el("span", { class: "recent-card__pct", text: pct + "%" })
        ]),
        el("div", {
          class: "progressbar",
          role: "progressbar",
          "aria-valuenow": String(pct), "aria-valuemin": "0", "aria-valuemax": "100"
        }, [
          el("div", {
            class: "progressbar__fill",
            style: "width:" + pct + "%;background-color:" + subj.hex
          })
        ])
      ]),
      el("div", { class: "recent-card__acts" }, [docBtn, dlBtn])
    ]);
  }

  /* create(model?) — model defaults to AHS.Mock.recentMaterials. */
  function create(model) {
    var data = model || AHS.Mock.recentMaterials;
    var status = el("p", {
      class: "recent-materials__status", "aria-live": "polite", hidden: "hidden"
    });
    var list = el("div", { class: "recent-materials__list" },
      data.items.map(function (item) { return card(item, status); }));

    return el("section", { class: "card recent-materials", "aria-label": data.title }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: data.title }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      list,
      status
    ]);
  }

  return { create: create };
})();
