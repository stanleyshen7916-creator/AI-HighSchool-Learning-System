/* data/materials/MaterialRepositoryIndex.js — Teaching Material Repository
   (Persistent Data Layer, Source of Truth for analyzed teaching materials).

   Requested target architecture:
     Repository（教材）→ MaterialRuntime → Summary → QuestionBank → AITutor
   This file is the Repository box only. It is a plain, git-tracked data
   store — analysis output from the Teaching Material Analysis workflow is
   registered here so it survives across sessions/deploys, unlike
   js/runtime/MaterialRuntime.js (session-only, sessionStorage-backed
   Runtime Cache) or js/data/MockData.js (orphaned demo seed, no longer
   loaded by any page).

   Not yet wired into any Runtime, page, or <script> tag by design — this
   EO builds the data layer itself; a later EO connects MaterialRuntime /
   QuizRuntime / AITutor Router to read from it. No fetch/XHR, no
   localStorage/IndexedDB, no ES module syntax — plain window.AHS
   attachment, safe under file:// and GitHub Pages like every other data
   file in this repo.

   Append Only: register() never overwrites an existing id and there is
   no remove/update-in-place API here — matches the Teaching Material
   Analysis workflow's Append Only principle (新增/更新/關聯 allowed,
   刪除/覆蓋 not allowed). A genuine content update should add a new
   version-dated id and cross-reference the prior one via
   relatedMaterials, not mutate history in place. */
window.AHS = window.AHS || {};
AHS.MaterialRepository = AHS.MaterialRepository || (function () {
  "use strict";

  var materials = {};

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* register(record) — adds one Repository entry. Requires record.id.
     Silently no-ops on a duplicate id (Append Only — never overwrites). */
  function register(record) {
    if (!record || !record.id || materials[record.id]) { return null; }
    materials[record.id] = record;
    return clone(record);
  }

  function getById(id) {
    return materials[id] ? clone(materials[id]) : null;
  }

  function list() {
    return Object.keys(materials).map(function (id) { return clone(materials[id]); });
  }

  function findBySubject(subject) {
    return list().filter(function (m) { return m.metadata && m.metadata.subject === subject; });
  }

  function findByChapter(chapter) {
    return list().filter(function (m) { return m.metadata && m.metadata.chapter === chapter; });
  }

  function findByKeyword(keyword) {
    var kw = String(keyword || "").toLowerCase();
    if (!kw) { return []; }
    return list().filter(function (m) {
      var keywords = (m.metadata && m.metadata.keywords) || [];
      return keywords.some(function (k) { return String(k).toLowerCase().indexOf(kw) !== -1; });
    });
  }

  return {
    register: register,
    getById: getById,
    list: list,
    findBySubject: findBySubject,
    findByChapter: findByChapter,
    findByKeyword: findByKeyword
  };
})();
