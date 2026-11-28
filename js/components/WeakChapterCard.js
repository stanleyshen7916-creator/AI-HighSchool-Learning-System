/* js/components/WeakChapterCard.js — 2026-11-27 AHS-FEAT 弱點單元分析與加強練習（學習總結頁頂端；
   學習統計頁 dashboard.html 不在導覽列上，學生到不了，所以放在學習總結）。
   依科目列出每個單元（來源教材）最近作答的題數與正確率；「需加強」的單元有「加強練習」按鈕，
   連到測驗中心既有的測驗流程（quiz.html?mode=weak&materialId=tm_N）。數字全由
   AHS.WeakChapterRuntime 從真實作答紀錄重算，每次開頁都重新計算，練習達標就自然移出「需加強」。
   還沒有任何可歸到單元的作答時回傳 null（頁面不顯示這張卡）。 */
window.AHS = window.AHS || {};
AHS.WeakChapterCard = (function () {
  "use strict";

  var STATUS_TEXT = { weak: "需加強", insufficient: "資料不足", ok: "穩定" };

  function unitName(materialId) {
    /* 兩份產生檔的教材紀錄都是 { materialId, material }，頁面載了哪一份就用哪一份。 */
    var idx = (AHS.TeachingMaterialSource ? AHS.TeachingMaterialSource.entries() : (AHS.TeachingMaterialData || []));
    for (var i = 0; i < idx.length; i++) {
      if (idx[i].materialId === materialId) {
        var m = idx[i].material || {};
        var name = String(m.chapter || m.title || materialId);
        var cut = name.indexOf("（");
        return cut > 0 ? name.slice(0, cut) : name;
      }
    }
    return materialId;
  }

  function subjectName(key) {
    return (AHS.Subjects && AHS.Subjects[key] && AHS.Subjects[key].name) || key || "未分類";
  }

  function row(u) {
    var el = AHS.UI.el;
    var cfg = AHS.WeakChapterRuntime.config();
    var detail = u.status === "insufficient"
      ? "已作答 " + u.counted + " 題（滿 " + cfg.minAttempts + " 題才判斷）"
      : "最近 " + u.counted + " 題答對 " + u.correct + " 題";
    return el("li", { class: "weak-unit__row is-" + u.status }, [
      el("div", { class: "weak-unit__info" }, [
        el("span", { class: "weak-unit__name", text: unitName(u.materialId) }),
        el("span", { class: "weak-unit__detail", text: detail })
      ]),
      el("span", { class: "weak-unit__pct", text: u.accuracy === null ? "—" : u.accuracy + "%" }),
      el("span", { class: "weak-unit__badge", text: STATUS_TEXT[u.status] }),
      u.status === "weak"
        ? el("a", { class: "weak-unit__go", href: "quiz.html?mode=weak&materialId=" + encodeURIComponent(u.materialId), text: "加強練習" })
        : null
    ].filter(Boolean));
  }

  function create() {
    if (!AHS.WeakChapterRuntime || !AHS.UI) { return null; }
    var units = AHS.WeakChapterRuntime.units();
    if (!units.length) { return null; }
    var rank = { weak: 0, insufficient: 2, ok: 1 };
    var bySubject = {};
    var subjects = [];
    units.forEach(function (u) {
      var key = u.subject || "";
      if (!bySubject[key]) { bySubject[key] = []; subjects.push(key); }
      bySubject[key].push(u);
    });
    var el = AHS.UI.el;
    var groups = subjects.map(function (key) {
      var list = bySubject[key].sort(function (a, b) {
        return (rank[a.status] - rank[b.status]) || ((a.accuracy === null ? 101 : a.accuracy) - (b.accuracy === null ? 101 : b.accuracy));
      });
      return el("div", { class: "weak-unit__group" }, [
        el("h3", { class: "weak-unit__subject", text: subjectName(key) }),
        el("ul", { class: "weak-unit__list" }, list.map(row))
      ]);
    });
    var weakCount = units.filter(function (u) { return u.status === "weak"; }).length;
    return el("section", { class: "card weak-unit", "aria-label": "弱點單元" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "弱點單元" }),
        el("span", { class: "weak-unit__summary", text: weakCount ? weakCount + " 個單元需加強" : "目前沒有需加強的單元" })
      ])
    ].concat(groups));
  }

  return { create: create };
})();
