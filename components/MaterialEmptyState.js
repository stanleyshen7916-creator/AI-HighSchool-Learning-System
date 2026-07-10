/* components/MaterialEmptyState.js — Material Center Sprint 2 · M010.
   Empty State: Illustration (reuses the existing Qiaoqiao UI Library
   asset via AHS.Qiaoqiao.full — no new image assets) + Title +
   Description + Action Button (返回全部教材). Prototype UI only — no
   API. The action button reuses the shared .continue-reading__btn pill
   style (same Design Token as elsewhere).

   Variants cover the three required scenarios via message presets:
     "search"   → 搜尋無結果
     "filter"   → Filter 無結果
     "favorite" → 尚無收藏教材
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialEmptyState = (function () {
  "use strict";
  var el = AHS.UI.el;

  var PRESETS = {
    search: {
      title: "找不到符合的教材",
      description: "換個關鍵字試試，或返回全部教材繼續探索。"
    },
    filter: {
      title: "目前沒有教材",
      description: "沒有符合篩選條件的教材，調整條件或返回全部教材。"
    },
    favorite: {
      title: "尚無收藏教材",
      description: "點擊教材卡片上的書籤圖示，收藏喜歡的教材。"
    }
  };

  /* create(variant, onReset) — variant: "search" | "filter" | "favorite"
     (unknown values fall back to "filter"). onReset fires when the
     Action Button is clicked. Never throws. */
  function create(variant, onReset) {
    var preset = PRESETS[variant] || PRESETS.filter;

    var actionBtn = el("button", {
      type: "button",
      class: "continue-reading__btn mat-empty__btn",
      text: "返回全部教材"
    });
    actionBtn.addEventListener("click", function () {
      if (typeof onReset === "function") { onReset(); }
    });

    return el("div", { class: "mat-empty", role: "status" }, [
      el("div", { class: "mat-empty__illustration", html: AHS.Qiaoqiao.full("reading") }),
      el("h3", { class: "mat-empty__title", text: preset.title }),
      el("p", { class: "mat-empty__description", text: preset.description }),
      actionBtn
    ]);
  }

  return { create: create };
})();
