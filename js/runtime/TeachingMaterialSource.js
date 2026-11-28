/* js/runtime/TeachingMaterialSource.js — queue 9.4 T5 (2026-11-27). The one place every page and module reads the
   package-track teaching materials from.

   Today every page loads the whole js/data/TeachingMaterialData.js (AHS.TeachingMaterialData). After T7 a page loads
   only the small js/data/TeachingMaterialIndex.js and each material's summary / questions come from
   js/data/materials-content/<id>.js through AHS.TeachingMaterialContentLoader. Readers must not care which:

     entries()          -> [{ materialId, material, related, summary?, questions, variants? }]
                           the full array when TeachingMaterialData is loaded; otherwise one entry per index record,
                           with its content when that content has been loaded (questions [] until then)
     ready(ids, fn)     -> make sure these materials' content is here, then call fn(). ids: an array of tm ids, or
                           "all". Calls fn SYNCHRONOUSLY when nothing has to be loaded (always the case while the full
                           array is on the page), so a page that wraps its init in ready() behaves exactly as before.
                           A content file that fails to load is reported on the console and fn still runs: the page
                           shows what it has instead of a blank screen.
     allIds()           -> every package material id
     workspaceIds()     -> the ids the current Workspace (school + semester) may see; same rule as the Loader
     wrongBookIds()     -> the ids the wrong-book records come from, or "all" when one cannot be tied to a material
     union(a, b, ...)   -> merged id lists ("all" wins)
     materialIdOfQuestion(questionId) -> "tm_N" for a package question id ("tm_N_q.."), else null
     isPending(questionId) -> true when that package question's material is in the index but its content is not loaded
                           yet (never true while the full array is on the page): code that runs before ready() must not
                           treat "not found" as "does not exist" for such a question
     onContent(fn)      -> fn() runs every time ready() has loaded new content, before ready()'s own callback
     lastErrors()       -> the load failures of the last ready() (for tests / diagnostics)

   No fetch / XHR here: loading is the ContentLoader's dynamic <script>, which works over file:// and GitHub Pages. */
window.AHS = window.AHS || {};
AHS.TeachingMaterialSource = (function () {
  "use strict";

  var errors = [];

  function fullData() { return Array.isArray(AHS.TeachingMaterialData) ? AHS.TeachingMaterialData : null; }
  function index() { return Array.isArray(AHS.TeachingMaterialIndex) ? AHS.TeachingMaterialIndex : []; }
  function store() { return AHS.TeachingMaterialContentStore || {}; }

  function entryFromIndex(rec, content) {
    var e = { materialId: rec.materialId, material: rec.material, related: rec.related };
    if (content) {
      e.summary = content.summary;
      e.questions = content.questions || [];
      if (content.variants) { e.variants = content.variants; }
    } else {
      e.questions = [];
    }
    return e;
  }

  /* Rebuilt index entries are cached per content-store state, so callers that loop entries() many times (WrongBook
     renders one lookup per card) get the same objects back instead of a new array each call. */
  var cache = null;
  function entries() {
    var full = fullData();
    if (full) { return full; }
    var idx = index();
    var s = store();
    var loaded = idx.filter(function (r) { return r && s[r.materialId]; }).length;
    if (cache && cache.idx === idx && cache.loaded === loaded) { return cache.list; }
    var list = idx.map(function (rec) { return entryFromIndex(rec, s[rec.materialId]); });
    cache = { idx: idx, loaded: loaded, list: list };
    return list;
  }

  function allIds() {
    var src = fullData() || index();
    return src.map(function (e) { return e && e.materialId; }).filter(Boolean);
  }

  function workspaceIds() {
    var ws = AHS.WorkspaceRuntime && typeof AHS.WorkspaceRuntime.getCurrent === "function" ? AHS.WorkspaceRuntime.getCurrent() : null;
    return (fullData() || index()).filter(function (e) {
      var m = e && e.material;
      if (!m) { return false; }
      if (!ws) { return true; }
      if (m.school && m.school !== ws.schoolId) { return false; }
      if (m.semester && (ws.semesterIds || []).indexOf(m.semester) === -1) { return false; }
      return true;
    }).map(function (e) { return e.materialId; });
  }

  /* wrongBookIds() — the materials the student's wrong-book records come from (they may be synced from another device
     or semester). A record that cannot be tied to a package material (repository track, no question id) can only be
     looked up by its text across every material, so then the answer is "all". */
  function wrongBookIds() {
    var W = AHS.WrongBookRuntime;
    var L = AHS.TeachingMaterialLoader;
    if (!W || typeof W.list !== "function") { return "all"; }
    var ids = {};
    var all = false;
    W.list().forEach(function (item) {
      var id = materialIdOfQuestion(item.questionId) ||
        (/^tm_\d+$/.test(String(item.materialId || "")) ? item.materialId : null) ||
        (L && typeof L.sourceIdFor === "function" && item.materialId ? L.sourceIdFor(item.materialId) : null);
      if (id && /^tm_\d+$/.test(id)) { ids[id] = true; } else { all = true; }
    });
    return all ? "all" : Object.keys(ids);
  }

  /* union(a, b, ...) — id lists merged; "all" wins. */
  function union() {
    var out = {};
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] === "all") { return "all"; }
      (arguments[i] || []).forEach(function (id) { out[id] = true; });
    }
    return Object.keys(out);
  }

  /* A question's id starts with the package it was written for; a supplement package merged into another material
     (index record's "merged") lives in that material's content file, so map it there. */
  var mergedCache = null;
  function mergedMap() {
    var idx = index();
    if (mergedCache && mergedCache.idx === idx) { return mergedCache.map; }
    var map = {};
    idx.forEach(function (r) { (r && r.merged || []).forEach(function (p) { map[p] = r.materialId; }); });
    mergedCache = { idx: idx, map: map };
    return map;
  }
  function materialIdOfQuestion(questionId) {
    var m = /^(tm_\d+)_/.exec(String(questionId || ""));
    if (!m) { return null; }
    return mergedMap()[m[1]] || m[1];
  }

  function isPending(questionId) {
    if (fullData()) { return false; }
    var id = materialIdOfQuestion(questionId);
    if (!id || store()[id]) { return false; }
    return index().some(function (r) { return r && r.materialId === id; });
  }

  var hooks = [];
  function onContent(fn) { if (typeof fn === "function") { hooks.push(fn); } }
  function runHooks() {
    hooks.forEach(function (h) {
      try { h(); } catch (err) { if (window.console) { console.warn("教材內容載入後的處理失敗：" + (err && err.message || err)); } }
    });
  }

  function missing(ids) {
    if (fullData()) { return []; }
    var known = {};
    index().forEach(function (r) { if (r && r.materialId) { known[r.materialId] = true; } });
    var s = store();
    var seen = {};
    return (ids === "all" ? allIds() : (Array.isArray(ids) ? ids : [])).filter(function (id) {
      if (!known[id] || s[id] || seen[id]) { return false; }
      seen[id] = true;
      return true;
    });
  }

  /* T6: the explanation supplements of these materials. Only on a page that loads the small
     js/data/ExplanationSupplementIndex.js instead of the whole ExplanationSupplementData.js; a supplement file is named
     by the package its questions were written for, so a material's merged packages are included. */
  function missingSupplements(ids) {
    var list = Array.isArray(AHS.ExplanationSupplementIndex) ? AHS.ExplanationSupplementIndex : null;
    if (!list || fullData()) { return []; }
    var has = {};
    list.forEach(function (id) { has[id] = true; });
    var loaded = AHS.ExplanationSupplementLoaded || {};
    var byId = {};
    index().forEach(function (r) { if (r && r.materialId) { byId[r.materialId] = r; } });
    var out = [];
    (ids === "all" ? allIds() : (Array.isArray(ids) ? ids : [])).forEach(function (id) {
      var rec = byId[id];
      if (!rec) { return; }
      [id].concat(rec.merged || []).forEach(function (pkg) {
        if (has[pkg] && !loaded[pkg] && out.indexOf(pkg) === -1) { out.push(pkg); }
      });
    });
    return out;
  }

  function ready(ids, fn) {
    var need = missing(ids);
    var sup = missingSupplements(ids);
    var L = AHS.TeachingMaterialContentLoader;
    errors = [];
    if ((!need.length && !sup.length) || !L) {
      if ((need.length || sup.length) && window.console) { console.warn("TeachingMaterialContentLoader is not loaded; " + need.length + " material(s) have no content"); }
      fn();
      return;
    }
    var jobs = need.map(function (id) {
      return { id: id, run: function () { return L.ensure(id); }, label: "教材內容" };
    }).concat(sup.map(function (id) {
      return { id: id, run: function () { return L.loadScript("js/data/explanations-content/" + id + ".js"); }, label: "詳解補強" };
    }));
    var pending = jobs.length;
    jobs.forEach(function (job) {
      job.run().catch(function (err) {
        errors.push({ materialId: job.id, message: String(err && err.message || err) });
        if (window.console) { console.warn(job.label + "載入失敗：" + job.id); }
      }).then(function () {
        pending -= 1;
        if (pending === 0) { runHooks(); fn(); }
      });
    });
  }

  function lastErrors() { return errors.slice(); }

  return {
    entries: entries,
    ready: ready,
    allIds: allIds,
    workspaceIds: workspaceIds,
    wrongBookIds: wrongBookIds,
    union: union,
    materialIdOfQuestion: materialIdOfQuestion,
    isPending: isPending,
    onContent: onContent,
    lastErrors: lastErrors
  };
})();
