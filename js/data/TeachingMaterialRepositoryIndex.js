/* js/data/TeachingMaterialRepositoryIndex.js
   Teaching Material Repository — Index.
   PMO Decision (Teaching Material Upload v1.0, LOCK): 新教材建立於
   Teaching Material Repository（不再寫入 js/data/MockData.js）。此
   Index 只是一份指標清單（packageId + 對應的 script 檔案），本身不含
   任何教材內容 — 內容一律存放在各自的
   js/data/TeachingMaterialPackage*.js（每個檔案各自把自己的 Package
   掛進 window.AHS.Data.TeachingMaterialPackages）。

   新增教材時只在陣列「末端追加一筆」，不得回頭修改既有教材的項目
   （對應規範「不得人工修改其他教材」）。實際的 Package 物件由
   TeachingMaterialLoader 於執行期透過 packageId 從
   AHS.Data.TeachingMaterialPackages 取得（此 Index 純粹是清單，不做
   任何運算）。 */
window.AHS = window.AHS || {};
AHS.Data = AHS.Data || {};

AHS.Data.TeachingMaterialRepositoryIndex = [
  { packageId: "math-trigonometry-applications-v1", subject: "math", file: "js/data/TeachingMaterialPackageMathTrigonometry.js" },
  { packageId: "chemistry-final-exam-review-v1", subject: "chemistry", file: "js/data/TeachingMaterialPackageChemistryFinalReview.js" }
];
