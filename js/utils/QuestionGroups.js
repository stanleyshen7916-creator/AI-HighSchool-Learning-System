/* js/utils/QuestionGroups.js — 題組（groupId）工具（2026-11-15）。
   題組＝題幹含「承上題／承第N題／同上題／承上圖」或標示「【題組X】／（第a–b題為題組）」
   的題目，拆開就無法作答。教材包 questionbank.json 以選填欄位 groupId 標記，同組
   題目在陣列中連續、依作答順序排列。打亂／抽題時以「整組」為單位，組內順序不變。
   純函式、無 DOM。 */
window.AHS = window.AHS || {};
AHS.QuestionGroups = (function () {
  "use strict";

  function keyOf(q) { return q && q.groupId ? String(q.groupId) : ""; }

  /* units(list) — 依 groupId 聚成 unit（無 groupId 自成一個），unit 依第一次出現的
     位置排列，組內維持 list 原順序。 */
  function units(list) {
    var out = [];
    var byKey = {};
    (list || []).forEach(function (q) {
      var k = keyOf(q);
      if (!k) { out.push([q]); return; }
      if (!byKey[k]) { byKey[k] = []; out.push(byKey[k]); }
      byKey[k].push(q);
    });
    return out;
  }

  function flatten(us) { return us.reduce(function (a, u) { return a.concat(u); }, []); }

  /* shuffle(list, rng) — 只打亂 unit 的順序，回傳新陣列。 */
  function shuffle(list, rng) {
    var random = typeof rng === "function" ? rng : Math.random;
    var us = units(list);
    for (var i = us.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var t = us[i]; us[i] = us[j]; us[j] = t;
    }
    return flatten(us);
  }

  /* take(list, n) — 依序取整個 unit，直到題數達到 n（最後一組可讓總數略超過 n，
     但不拆組；第一個 unit 一定取）。 */
  function take(list, n) {
    if (typeof n !== "number") { return (list || []).slice(); }
    var out = [];
    units(list).some(function (u) {
      if (out.length >= n) { return true; }
      out = out.concat(u);
      return false;
    });
    return out;
  }

  /* regroup(selected, pool, idOf) — selected 中只要有一題屬於某題組，就把 pool 裡
     同組的其他題補進來，整組放在該組最早出現的位置，組內依 pool 順序；去重。 */
  function regroup(selected, pool, idOf) {
    var getId = typeof idOf === "function" ? idOf : function (q) { return q.id; };
    var mates = {};
    (pool || []).forEach(function (q) {
      var k = keyOf(q);
      if (k) { (mates[k] = mates[k] || []).push(q); }
    });
    var out = [];
    var used = {};
    var doneGroup = {};
    (selected || []).forEach(function (q) {
      var k = keyOf(q);
      if (k && mates[k]) {
        if (doneGroup[k]) { return; }
        doneGroup[k] = true;
        mates[k].forEach(function (m) {
          var id = getId(m);
          if (!used[id]) { used[id] = true; out.push(m); }
        });
        return;
      }
      var qid = getId(q);
      if (!used[qid]) { used[qid] = true; out.push(q); }
    });
    return out;
  }

  /* contextFor(questionId) — 同題組中排在這題之前的題目（情境題），取自
     AHS.TeachingMaterialData；不是題組或找不到時回傳 []。 */
  function contextFor(questionId) {
    var data = (AHS.TeachingMaterialSource ? AHS.TeachingMaterialSource.entries() : (AHS.TeachingMaterialData || []));
    if (!questionId || !Array.isArray(data)) { return []; }
    for (var i = 0; i < data.length; i++) {
      var qs = data[i] && data[i].questions;
      if (!Array.isArray(qs)) { continue; }
      for (var j = 0; j < qs.length; j++) {
        if (qs[j].id !== questionId) { continue; }
        var k = keyOf(qs[j]);
        if (!k) { return []; }
        return qs.slice(0, j).filter(function (q) { return keyOf(q) === k; });
      }
    }
    return [];
  }

  return { units: units, shuffle: shuffle, take: take, regroup: regroup, contextFor: contextFor };
})();
