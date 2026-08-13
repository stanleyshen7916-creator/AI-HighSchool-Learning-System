/* js/core/PetArt.js — Sprint AI-134 續（PO 提供正式寵物插畫素材）：首頁飼養
   寵物小遊戲的寵物圖案繪製。

   PO 直接提供兩套（老虎／恐龍）各 10 張成長階段插畫（10%~100%，每 10% 一
   張），本檔案改採與 js/core/Qiaoqiao.js 相同的做法：純 <img> 引用
   assets/pets/ 底下的真實 PNG（見該檔案標頭 PET_BASE 常數），不再是先前
   （尚無素材時）暫代用的 CSS/SVG 繪製。零外部圖檔依賴以外的相依，file://
   與 GitHub Pages 都能正常顯示。

   AHS.PetArt.render(speciesId, percent) -> <img> string
   percent（0-100，直接來自 AHS.PetRuntime.growth().percent）在這裡換算成
   最接近的 10% 檔名（10/20/.../100），未達 10% 時使用 10% 那張（蛋・1），
   不無中生有一張「0%」圖。 */
window.AHS = window.AHS || {};
AHS.PetArt = (function () {
  "use strict";

  var PET_BASE = "assets/pets/";

  var SPECIES_LABELS = { tiger: "老虎", dinosaur: "恐龍" };

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;"); }

  function speciesLabel(id) { return SPECIES_LABELS[id] || "寵物"; }

  /* bucketPercent(percent) — 換算成素材檔名對應的 10% 級距（10~100），
     四捨五入無意義（素材本身就是離散的 10 張），採「至少達到」的進位邏輯：
     0% 也顯示 10% 那張（蛋・1，尚在孵蛋），不存在 0% 圖檔。 */
  function bucketPercent(percent) {
    var p = typeof percent === "number" && percent > 0 ? percent : 0;
    var bucket = Math.ceil(p / 10) * 10;
    if (bucket < 10) { bucket = 10; }
    if (bucket > 100) { bucket = 100; }
    return bucket;
  }

  /* render(speciesId, percent) — 未知 speciesId 安全 fallback 為 tiger，
     不丟例外。 */
  function render(speciesId, percent) {
    var species = SPECIES_LABELS[speciesId] ? speciesId : "tiger";
    var bucket = bucketPercent(percent);
    var src = PET_BASE + species + "-" + (bucket < 100 ? "0" + bucket : "100") + ".png";
    return (
      '<img class="pet-art" src="' + esc(src) + '" alt="' + esc(speciesLabel(species)) + '" ' +
      'loading="lazy" draggable="false">'
    );
  }

  return { render: render, speciesLabel: speciesLabel };
})();
