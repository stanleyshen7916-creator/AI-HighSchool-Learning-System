/* components/QiaoqiaoGallery.js — QA/reference page only (not linked from
   the product navigation). Renders every expression + pose from the
   shared AHS.Qiaoqiao library so GPT QA can review the full set at once. */
window.AHS = window.AHS || {};
AHS.QiaoqiaoGallery = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  function card(sizeClass, svgHtml, label, key) {
    return el("figure", { class: "qq-gallery__card" }, [
      el("div", { class: sizeClass, html: svgHtml }),
      el("figcaption", { class: "qq-gallery__caption" }, [
        el("span", { class: "qq-gallery__label", text: label }),
        el("span", { class: "qq-gallery__key", text: key })
      ])
    ]);
  }

  function section(title, cards) {
    return el("section", { class: "qq-gallery__section" }, [
      el("h2", { class: "qq-gallery__title", text: title }),
      el("div", { class: "qq-gallery__grid" }, cards)
    ]);
  }

  function create() {
    var Q = AHS.Qiaoqiao;

    var expressionCards = Q.expressionKeys.map(function (key) {
      return card(
        "qiaoqiao-bust qiaoqiao-bust--xl",
        Q.bust(key),
        Q.expressionLabel(key),
        key
      );
    });

    var poseCards = Q.poseKeys.map(function (key) {
      return card(
        "qiaoqiao-full qiaoqiao-full--md",
        Q.full(key),
        Q.poseLabel(key),
        key
      );
    });

    return el("div", { class: "qq-gallery" }, [
      el("header", { class: "qq-gallery__header" }, [
        el("h1", { text: "AI 巧巧老師 素材庫" }),
        el("p", {
          text: "表情 " + expressionCards.length + " 款 · 姿勢 " +
            poseCards.length + " 款 — 供 GPT QA 驗收比對"
        })
      ]),
      section("表情 Expressions", expressionCards),
      section("姿勢 Poses", poseCards)
    ]);
  }

  return { create: create };
})();
