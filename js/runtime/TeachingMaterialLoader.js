/* js/runtime/TeachingMaterialLoader.js — HOTFIX-001 Repository Loader
   Integration.

   Bridges the Teaching Material Repository (data/materials/, git-tracked
   Source of Truth) into MaterialRuntime (the session-scoped Runtime
   Cache that Material Center / Summary Center / Home / My Learning
   actually render from). Before this file, MaterialRuntime.list() stayed
   [] forever because nothing ever called MaterialRuntime.add() with
   Repository content — the Repository and the Runtime were built but
   never connected.

   Read-only bridge, nothing else:
   - Never mutates AHS.MaterialRepository (Repository Schema unchanged).
   - Never adds/changes a AHS.MaterialRuntime method (Runtime API
     unchanged) — calls only its existing add()/list().
   - No UI code (Material Card UI unchanged).

   Idempotent by (subject + title): MaterialRuntime persists across page
   navigations via PersistenceAdapter/sessionStorage, and this loader's
   load() runs again on every page that wires it in, so it skips any
   Repository record that already has a matching MaterialRuntime entry
   instead of appending a duplicate each time. */
window.AHS = window.AHS || {};
AHS.TeachingMaterialLoader = (function () {
  "use strict";

  function alreadyLoaded(existing, subject, title) {
    for (var i = 0; i < existing.length; i++) {
      if (existing[i].subject === subject && existing[i].title === title) { return true; }
    }
    return false;
  }

  /* toMaterialRuntimeRecord(repoRecord) — maps one Repository entry's
     metadata/summary into the plain object MaterialRuntime.add() already
     accepts (subject/title/chapter/grade/category/date/views/content/
     progress). Reads the Repository record only; never writes it. */
  function toMaterialRuntimeRecord(repoRecord) {
    var meta = repoRecord.metadata || {};
    var summary = repoRecord.summary || {};
    return {
      subject: meta.subject || "other",
      title: summary.title || meta.unit || repoRecord.id,
      chapter: meta.chapter || "未分類",
      grade: meta.grade || "高一",
      category: meta.materialType || "其他",
      date: meta.updatedAt || meta.createdAt || "",
      views: "0",
      content: (summary.keyPoints && summary.keyPoints.length) ? summary.keyPoints.join(" ") : "",
      progress: 0
    };
  }

  /* load() — ensures every Repository entry has a matching MaterialRuntime
     record. Returns how many records this call actually added (0 when a
     previous page in the same session already loaded everything). Safe
     to call multiple times and safe to call before either dependency
     exists (no-ops instead of throwing, matching this repo's
     coreReady()-style defensive convention). */
  function load() {
    if (!AHS.MaterialRepository || typeof AHS.MaterialRepository.list !== "function") { return 0; }
    if (!AHS.MaterialRuntime || typeof AHS.MaterialRuntime.add !== "function" ||
        typeof AHS.MaterialRuntime.list !== "function") { return 0; }

    var existing = AHS.MaterialRuntime.list();
    var added = 0;

    AHS.MaterialRepository.list().forEach(function (repoRecord) {
      var mapped = toMaterialRuntimeRecord(repoRecord);
      if (alreadyLoaded(existing, mapped.subject, mapped.title)) { return; }
      AHS.MaterialRuntime.add(mapped);
      existing = AHS.MaterialRuntime.list();
      added += 1;
    });

    return added;
  }

  return { load: load };
})();
