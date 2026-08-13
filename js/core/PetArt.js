/* js/core/PetArt.js — Sprint AI-134 首頁飼養寵物小遊戲的寵物圖案繪製。

   本專案完全沒有寵物美術素材（js/core/Qiaoqiao.js 用的是官方核准的真實
   PNG 插畫，見該檔案自身標頭說明 — 不是 CSS/SVG 畫出來的），這裡誠實地
   用純 inline SVG 畫幾種簡單、扁平風格的寵物圖案，零外部圖檔依賴，
   file:// 與 GitHub Pages 都能正常顯示，符合本專案「無 Build、無外部
   資源」的限制。

   AHS.PetArt.render(speciesId, stageIndex) -> SVG string
   stageIndex 0 = 蛋（尚未孵化，四種寵物共用蛋型，只是配色不同）
   stageIndex 1-3 = 幼年/成長期/成熟期（同一隻寵物，體型隨階段放大，
   成熟期加一個小裝飾點綴，代表「養成」） */
window.AHS = window.AHS || {};
AHS.PetArt = (function () {
  "use strict";

  var PALETTE = {
    cat: { body: "#f4b183", ear: "#e08e45", accent: "#5b3a29" },
    dog: { body: "#d7b98e", ear: "#b8895a", accent: "#5b3a29" },
    rabbit: { body: "#f5e6f0", ear: "#e8b9d6", accent: "#8a5a78" },
    bird: { body: "#a9d6c7", ear: "#5fae94", accent: "#2f5c4c" }
  };

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;"); }

  /* eggArt(color) — stage 0 共用蛋型，同一份 markup 只換配色，代表「尚未
     孵化」，不是某一種特定寵物。 */
  function eggArt(color) {
    return (
      '<ellipse cx="60" cy="66" rx="34" ry="42" fill="' + color + '" opacity="0.9"/>' +
      '<ellipse cx="48" cy="48" rx="7" ry="10" fill="#ffffff" opacity="0.35"/>' +
      '<path d="M40 60 L52 68 L44 78" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round" stroke-linejoin="round"/>'
    );
  }

  /* earsFor(species, palette) — 只有耳朵/頭頂形狀是各物種真正不同之處，
     其餘身體/臉部共用同一套簡單造型，維持整體風格一致（呼應
     Qiaoqiao.js 檔頭「Single source of truth for the character's
     appearance」同一種精神：同一套零件庫，不同角色只換關鍵特徵）。 */
  function earsFor(species, p) {
    if (species === "cat") {
      return '<path d="M30 44 L38 20 L50 42 Z" fill="' + p.ear + '"/>' +
             '<path d="M90 44 L82 20 L70 42 Z" fill="' + p.ear + '"/>';
    }
    if (species === "dog") {
      return '<ellipse cx="30" cy="46" rx="11" ry="20" fill="' + p.ear + '" transform="rotate(-18 30 46)"/>' +
             '<ellipse cx="90" cy="46" rx="11" ry="20" fill="' + p.ear + '" transform="rotate(18 90 46)"/>';
    }
    if (species === "rabbit") {
      return '<ellipse cx="42" cy="14" rx="8" ry="26" fill="' + p.ear + '"/>' +
             '<ellipse cx="78" cy="14" rx="8" ry="26" fill="' + p.ear + '"/>';
    }
    /* bird — 頭頂羽冠代替耳朵 */
    return '<path d="M52 26 L60 8 L68 26 Z" fill="' + p.ear + '"/>';
  }

  /* bodyArt(species, stageIndex) — 幼年/成長期/成熟期共用同一套臉部造
     型，體型（scale）隨 stageIndex 放大；成熟期（stageIndex 3）額外加一
     個小愛心裝飾，視覺上代表「養成完畢」。 */
  function bodyArt(species, stageIndex) {
    var p = PALETTE[species] || PALETTE.cat;
    var scale = [0, 0.72, 0.86, 1][stageIndex] || 1;
    var decoration = stageIndex >= 3
      ? '<path d="M60 96 C56 92 50 92 50 87 C50 84 53 82 56 84 C58 85 59 87 60 88 C61 87 62 85 64 84 C67 82 70 84 70 87 C70 92 64 92 60 96 Z" fill="#ef7ba0"/>'
      : "";
    return (
      '<g transform="translate(60 62) scale(' + scale + ') translate(-60 -62)">' +
      earsFor(species, p) +
      '<ellipse cx="60" cy="66" rx="30" ry="26" fill="' + p.body + '"/>' +
      '<circle cx="48" cy="60" r="4.5" fill="' + p.accent + '"/>' +
      '<circle cx="72" cy="60" r="4.5" fill="' + p.accent + '"/>' +
      '<path d="M54 74 Q60 80 66 74" stroke="' + p.accent + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<circle cx="60" cy="68" r="3" fill="' + p.accent + '"/>' +
      decoration +
      "</g>"
    );
  }

  /* render(speciesId, stageIndex) — stageIndex 0 顯示蛋，1-3 顯示對應體
     型的寵物。未知 speciesId 安全 fallback 為 cat，不丟例外。 */
  function render(speciesId, stageIndex) {
    var species = PALETTE[speciesId] ? speciesId : "cat";
    var stage = typeof stageIndex === "number" && stageIndex >= 0 && stageIndex <= 3 ? stageIndex : 0;
    var inner = stage === 0 ? eggArt(PALETTE[species].body) : bodyArt(species, stage);
    return (
      '<svg class="pet-art" viewBox="0 0 120 120" role="img" aria-label="' + esc(speciesLabel(species)) + '"' +
      ' xmlns="http://www.w3.org/2000/svg">' + inner + "</svg>"
    );
  }

  function speciesLabel(id) {
    return { cat: "貓咪", dog: "小狗", rabbit: "兔子", bird: "小鳥" }[id] || "寵物";
  }

  return { render: render, speciesLabel: speciesLabel };
})();
