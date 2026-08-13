/* js/components/PetWidget.js — Sprint AI-134（真實 PO 需求）：首頁飼養
   寵物小遊戲。續（PO 回饋）：寵物不要獨立成首頁另一個項目，改掛進 Hero
   Card 內（見 js/components/HeroCard.js 的 .hero-card__pet 插槽 與
   js/pages/AppHome.js buildHome() 如何把 create() 的回傳值掛進去）。

   讀取 AHS.PetRuntime（Single Source：寵物選擇 + 由
   AHS.StatisticsRuntime.overallMaterialCompletion() 換算出的成長狀態，
   本檔案完全不重新計算完成度），畫面分兩種狀態：
   1) 尚未選擇寵物 — 顯示可選圖案（AHS.PetArt 引用 assets/pets/ 真實插
      畫），點擊即選定並立即持久化（AHS.PetRuntime.selectSpecies()）。
   2) 已選擇寵物 — 顯示目前成長階段的寵物圖案、真實完成度百分比、成長
      進度條。巧巧老師的每日飼養提醒文字改由 Hero Card 自己的提醒泡泡
      顯示（同一份 AHS.PetRuntime.tipMessage()，不在這裡重複畫一次），
      避免同一張 Hero 卡片裡出現兩個內容重複的泡泡。可點擊「換一隻寵物」
      回到選擇畫面重新選。

   同一個 Home Section 內用 refresh(body) 局部重繪（與既有
   js/components/MaterialReviewQueue.js 的 refresh() 樣式一致），不需要
   整頁重新載入。PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.PetWidget = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  /* 選寵物畫面的預覽圖固定用 40%（幼年・2）— 兩種寵物在這個階段都已經
     孵化、體態最可愛討喜，比顯示蛋（10%）更適合當作選擇畫面的預覽圖。 */
  var OPTION_PREVIEW_PERCENT = 40;

  function speciesOption(species, onPick) {
    var btn = el("button", { type: "button", class: "pet-widget__option" }, [
      el("span", { class: "pet-widget__option-art", html: AHS.PetArt.render(species.id, OPTION_PREVIEW_PERCENT) }),
      el("span", { class: "pet-widget__option-name", text: species.name })
    ]);
    btn.addEventListener("click", function () { onPick(species.id); });
    return btn;
  }

  /* syncHeroBubble() — Hero Card 本身只在頁面初次載入時渲染一次（見
     js/pages/AppHome.js 的 applyPetTip()，與這個 Home 上其他 Widget 一
     樣，本專案沒有整頁 Live-render 機制）。學生在同一個 Session 內第一
     次選寵物時，若不順手更新已經畫在畫面上的泡泡文字，會出現「剛選好
     寵物，上面的提醒卻還是舊的通用文案」這種真實可見的不一致——所以在
     這裡直接找到既有的 Hero Card 泡泡 DOM 節點更新文字，沿用與
     AppHome.js 完全相同的 AHS.PetRuntime.tipMessage()（Single Source，
     不是另外一套文案）。找不到 Hero Card（理論上不會發生，PetWidget 只
     掛在首頁）時安全地什麼都不做，不丟例外。 */
  function syncHeroBubble() {
    var msg = AHS.PetRuntime.tipMessage();
    if (!msg) { return; }
    var titleEl = document.querySelector(".hero-card__bubble-title");
    var textEl = document.querySelector(".hero-card__bubble-text");
    if (titleEl) { titleEl.textContent = msg.title; }
    if (textEl) { textEl.textContent = msg.text; }
  }

  function pickerView(body, refresh) {
    body.appendChild(el("p", { class: "pet-widget__intro",
      text: "選一隻寵物，讓牠陪你每天一起成長！寵物的成長速度會依照你目前的教材完成度自動變化，不需要額外操作。" }));
    body.appendChild(el("div", { class: "pet-widget__options" },
      AHS.PetRuntime.listSpecies().map(function (species) {
        return speciesOption(species, function (id) {
          AHS.PetRuntime.selectSpecies(id);
          syncHeroBubble();
          refresh(body, false);
        });
      })));
  }

  function displayView(body, refresh) {
    var growth = AHS.PetRuntime.growth();
    var changeBtn = el("button", { type: "button", class: "pet-widget__change", text: "換一隻寵物" });
    changeBtn.addEventListener("click", function () { refresh(body, true); });

    body.appendChild(el("div", { class: "pet-widget__stage" }, [
      el("span", { class: "pet-widget__stage-art", html: AHS.PetArt.render(growth.speciesId, growth.percent) }),
      el("div", { class: "pet-widget__stage-info" }, [
        el("strong", { class: "pet-widget__stage-name",
          text: AHS.PetArt.speciesLabel(growth.speciesId) + "・" + growth.stageLabel }),
        el("div", { class: "progressbar" }, [
          el("div", { class: "progressbar__fill", style: "width:" + growth.percent + "%" })
        ]),
        el("span", { class: "pet-widget__stage-pct", text: "教材完成度 " + growth.percent + "%" })
      ])
    ]));

    /* Sprint AI-134 續：這個 Widget 現在直接掛在 Hero Card 裡面（見
       js/components/HeroCard.js 標頭說明），Hero 自己的巧巧老師提醒泡泡
       已經在顯示同一份 AHS.PetRuntime.tipMessage() 文案（syncHeroBubble()
       負責同步），這裡不再重複畫一次幾乎一樣的提醒文字，避免同一張卡片
       裡出現兩個內容重複的泡泡。 */
    body.appendChild(changeBtn);
  }

  function refresh(body, forcePicker) {
    body.innerHTML = "";
    var selected = !forcePicker && AHS.PetRuntime.getSelectedSpecies();
    if (selected) { displayView(body, refresh); } else { pickerView(body, refresh); }
  }

  /* create() — Sprint AI-134 續：真實 PO 回饋「寵物可否不要獨立在一個
     項目」，改為掛進 js/pages/AppHome.js 的 Hero Card 裡（.hero-card__pet
     插槽，非首頁另一個獨立 <section class="card">），所以這裡回傳的是
     .hero-card__pet 這個「嵌在 Hero 裡的區塊」，不再是自己的白色卡片＋
     標題列。內部 .pet-widget__* 這些 class 完全不變（PetGameRegression.js
     與 Playwright 都是抓這些 class，換外層容器不影響既有測試）。 */
  function create() {
    var body = el("div", { class: "pet-widget__body" });
    refresh(body, false);
    return el("div", { class: "hero-card__pet pet-widget", "aria-label": "飼養寵物" }, [
      el("h2", { class: "hero-card__pet-title", text: "我的學習寵物" }),
      body
    ]);
  }

  return { create: create };
})();
