/* js/runtime/PetRuntime.js — Sprint AI-134（真實 PO 需求）："目前的首頁
   可否增加一個飼養寵物的小遊戲，巧巧老師的小提醒可以與寵物飼養結合，
   進行每日飼養提醒，而每日飼養的邏輯為依照教材完成度百分比的完成比例
   來做為成長的因子，並提供一些寵物的圖案，讓學生選擇"。

   確認方案（AskUserQuestion，使用者選擇）：
   - 成長機制：被動即時反映 — 寵物成長狀態直接對應目前 AHS.StatisticsRuntime.
     overallMaterialCompletion()（Single Source，本 Sprint 新增，重用既有
     materialCompletion() 而非另外發明第二套完成度定義），不需要學生額外
     做「餵食」操作，隨時打開首頁就是最新狀態。
   - 寵物圖案：本專案沒有任何寵物美術素材，沿用 js/core/Qiaoqiao.js 的
     角色識別做法（純 CSS/SVG 繪製，見 js/core/PetArt.js），不捏造/不外
     部引用不存在的圖檔。
   - 提供固定的幾種寵物圖案讓學生選擇（一次性選擇，可在 Widget 內重選），
     選擇結果透過 AHS.PersistenceAdapter 依 Workspace 隔離持久化。

   Single Source 原則：本檔案完全不重新計算「完成度」，只讀
   AHS.StatisticsRuntime.overallMaterialCompletion() 這一個既有數字。
   PascalCase Runtime under window.AHS，與其餘 Runtime 同一種
   hydrate/persist 樣式（範本：js/runtime/SettingsRuntime.js）。 */
window.AHS = window.AHS || {};
AHS.PetRuntime = (function () {
  "use strict";

  var STORAGE_KEY = "pet";

  /* 4 種固定寵物圖案，讓學生選擇 — id 對應 js/core/PetArt.js 實際繪製的
     圖形，name 為顯示用中文名稱。沒有任何外部圖檔依賴。 */
  var SPECIES = [
    { id: "cat", name: "貓咪" },
    { id: "dog", name: "小狗" },
    { id: "rabbit", name: "兔子" },
    { id: "bird", name: "小鳥" }
  ];

  /* 成長階段門檻，直接對應 overallMaterialCompletion() 的 0-100 百分比
     （與 materialCompletion() 自身 0/20/60/100 的分段精神一致，但這裡
     是寵物飼養主題的 4 個階段，不是同一份資料的重複顯示）。 */
  var STAGES = [
    { max: 24, label: "蛋", hint: "還在孵蛋，快去完成教材讓牠孵化吧！" },
    { max: 49, label: "幼年", hint: "剛孵化的幼年期，繼續完成教材餵養牠！" },
    { max: 74, label: "成長期", hint: "長大不少了，再加把勁就要成熟了！" },
    { max: 100, label: "成熟期", hint: "已經成熟茁壯，繼續維持每天的學習習慣吧！" }
  ];

  function defaultState() { return { speciesId: null }; }

  function hydrate() {
    var loaded = (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function")
      ? AHS.PersistenceAdapter.load(STORAGE_KEY) : null;
    if (!loaded || typeof loaded !== "object") { return defaultState(); }
    var validId = SPECIES.some(function (s) { return s.id === loaded.speciesId; });
    return { speciesId: validId ? loaded.speciesId : null };
  }

  var store = hydrate();

  function persist() {
    if (!AHS.PersistenceAdapter || typeof AHS.PersistenceAdapter.save !== "function") { return; }
    AHS.PersistenceAdapter.save(STORAGE_KEY, store);
  }

  function listSpecies() { return SPECIES.slice(); }

  function getSelectedSpecies() { return store.speciesId; }

  function selectSpecies(id) {
    if (!SPECIES.some(function (s) { return s.id === id; })) { return false; }
    store.speciesId = id;
    persist();
    return true;
  }

  function stageFor(percent) {
    for (var i = 0; i < STAGES.length; i += 1) {
      if (percent <= STAGES[i].max) { return { index: i, label: STAGES[i].label, hint: STAGES[i].hint }; }
    }
    return { index: STAGES.length - 1, label: STAGES[STAGES.length - 1].label, hint: STAGES[STAGES.length - 1].hint };
  }

  /* growth() — 唯一對外的成長狀態讀取入口：percent 直接來自
     AHS.StatisticsRuntime.overallMaterialCompletion()，stage/label/hint
     由 percent 換算而來，speciesId 是學生自己選的寵物圖案。沒有選寵物
     時 speciesId 為 null，交給 UI 層誠實顯示「請先選擇寵物」。 */
  function growth() {
    var percent = (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.overallMaterialCompletion === "function")
      ? AHS.StatisticsRuntime.overallMaterialCompletion() : 0;
    var stage = stageFor(percent);
    return {
      speciesId: store.speciesId,
      percent: percent,
      stageIndex: stage.index,
      stageLabel: stage.label,
      hint: stage.hint
    };
  }

  function speciesLabel(id) {
    var found = SPECIES.filter(function (s) { return s.id === id; })[0];
    return found ? found.name : "";
  }

  /* tipMessage() — 巧巧老師「每日飼養提醒」文字的單一組字入口，回傳
     { title, text }；沒有選寵物時誠實回傳 null（呼叫端維持原本通用提醒
     文案，不假裝已經有寵物）。js/pages/AppHome.js（首次 Render）與
     js/components/PetWidget.js（同一個 Session 內剛選定寵物、想立即
     更新畫面上既有的 Hero Card 提醒泡泡，不必整頁重新載入）共用同一份
     文字組成邏輯，不各自維護一份，避免兩處文案不一致。 */
  function tipMessage() {
    if (!store.speciesId) { return null; }
    var g = growth();
    return {
      title: "巧巧老師的每日飼養提醒",
      text: "你的『" + speciesLabel(g.speciesId) + "』" + g.stageLabel +
        "（教材完成度 " + g.percent + "%）—— " + g.hint
    };
  }

  return {
    listSpecies: listSpecies,
    getSelectedSpecies: getSelectedSpecies,
    selectSpecies: selectSpecies,
    growth: growth,
    tipMessage: tipMessage
  };
})();
