/* js/runtime/TeachingMaterialLoader.js
   Teaching Material Repository — Loader.
   PMO Decision (Teaching Material Upload v1.0, LOCK): allowed as one of
   exactly three new pieces (Adapter / Loader / Bridge). Pure READ over
   the Repository's own data files (js/data/TeachingMaterialRepositoryIndex.js
   + js/data/TeachingMaterialPackage*.js) — no mutation, no call into
   MaterialRuntime or any other Runtime, no generated/guessed content.
   Mirrors the read-only role AHS.MaterialTextPipeline.getText() plays
   for uploaded files, but for Repository Packages. */
window.AHS = window.AHS || {};
AHS.TeachingMaterialLoader = (function () {
  "use strict";

  function index() {
    return Array.isArray(AHS.Data && AHS.Data.TeachingMaterialRepositoryIndex)
      ? AHS.Data.TeachingMaterialRepositoryIndex : [];
  }

  function packages() {
    return (AHS.Data && AHS.Data.TeachingMaterialPackages) ? AHS.Data.TeachingMaterialPackages : {};
  }

  function isValidPackage(pkg) {
    return !!(pkg && pkg.packageId && pkg.subject && pkg.chapter &&
      Array.isArray(pkg.questions) && Array.isArray(pkg.practiceQuestions));
  }

  /* getById(packageId) — one Package, or null if the Index references a
     packageId whose data file wasn't loaded (honest, never guessed). */
  function getById(packageId) {
    var pkg = packages()[packageId];
    return isValidPackage(pkg) ? pkg : null;
  }

  /* list() — every valid Package the Index points to, in Index order
     (i.e. the order new material was appended to the Repository). */
  function list() {
    var out = [];
    index().forEach(function (entry) {
      var pkg = getById(entry.packageId);
      if (pkg) { out.push(pkg); }
    });
    return out;
  }

  return {
    list: list,
    getById: getById,
    isValidPackage: isValidPackage
  };
})();
