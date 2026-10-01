/* js/core/CouncilEngineClient.js — 2026-09-29 教材上傳併入學習平台.

   The one browser-side connection point to the local 教材上傳引擎
   (ai-engine/council, the former AI-Study-Council server running in
   Docker on the Admin's own computer). Like js/core/SupabaseClient.js,
   this is an authorized fetch() exception (scripts/verify/
   VerifyForbiddenPatterns.js AUTHORIZED_EXCEPTIONS): only
   js/components/CouncilUpload.js uses it, and only on upload.html.

   Engine URL: same origin when the page itself is served by the engine
   (http://localhost:3000/upload.html — the recommended way, no cross-
   origin or mixed-content limits); otherwise http://localhost:3000,
   which the engine's CORS allowlist accepts from the GitHub Pages site.
   The Admin can override it on the page; the override is remembered for
   this browser session only (PersistenceAdapter global, sessionStorage).

   Every call resolves to { data, error } and never rejects, matching
   AHS.SupabaseClient's convention. */
window.AHS = window.AHS || {};

AHS.CouncilEngineClient = (function () {
  "use strict";

  var URL_KEY = "councilEngineUrl";
  var DEFAULT_URL = "http://localhost:3000";

  function servedByEngine() {
    var loc = window.location || {};
    return loc.protocol === "http:" && /^(localhost|127\.0\.0\.1):3000$/.test(loc.host || "");
  }

  function baseUrl() {
    if (servedByEngine()) { return ""; }
    var saved = AHS.PersistenceAdapter && AHS.PersistenceAdapter.loadGlobal(URL_KEY);
    return saved || DEFAULT_URL;
  }

  function setBaseUrl(url) {
    var clean = String(url || "").trim().replace(/\/+$/, "");
    if (AHS.PersistenceAdapter) { AHS.PersistenceAdapter.saveGlobal(URL_KEY, clean || null); }
  }

  function displayUrl() {
    return servedByEngine() ? window.location.origin : baseUrl();
  }

  function request(method, path, body) {
    var init = { method: method, headers: {} };
    if (body instanceof FormData) {
      init.body = body;
    } else if (body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    return fetch(baseUrl() + path, init).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
        if (!res.ok) {
          return { data: null, error: { status: res.status, message: (data && data.error) || ("HTTP " + res.status) } };
        }
        return { data: data, error: null };
      });
    }).catch(function () {
      return {
        data: null,
        error: { status: 0, message: "無法連線到教材上傳引擎（" + displayUrl() + "）。請先在這台電腦執行「啟動教材上傳引擎.bat」。" }
      };
    });
  }

  function enc(value) { return encodeURIComponent(value); }

  return {
    displayUrl: displayUrl,
    setBaseUrl: setBaseUrl,
    servedByEngine: servedByEngine,
    health: function () { return request("GET", "/api/health"); },
    catalog: function () { return request("GET", "/api/catalog"); },
    finalContent: function (filename) { return request("GET", "/api/finals/" + enc(filename)); },
    upload: function (files) {
      var form = new FormData();
      Array.prototype.forEach.call(files, function (f) { form.append("files", f, f.name); });
      return request("POST", "/api/upload", form);
    },
    createJob: function (payload) { return request("POST", "/api/assemble-council/jobs", payload); },
    getJob: function (jobId) { return request("GET", "/api/assemble-council/jobs/" + enc(jobId)); },
    images: function (sourceId) { return request("GET", "/api/materials/" + enc(sourceId) + "/images"); },
    imagesZipUrl: function (sourceId) { return baseUrl() + "/api/materials/" + enc(sourceId) + "/images/download"; },
    listDrafts: function () { return request("GET", "/api/platform/drafts"); },
    getDraft: function (id) { return request("GET", "/api/platform/drafts/" + enc(id)); },
    createDraft: function (payload) { return request("POST", "/api/platform/drafts", payload); },
    publishDraft: function (id) { return request("POST", "/api/platform/drafts/" + enc(id) + "/publish"); },
    deleteDraft: function (id) { return request("DELETE", "/api/platform/drafts/" + enc(id)); },
    /* 2026-10-01 為既有教材加題 */
    supplementParents: function () { return request("GET", "/api/platform/supplements/parents"); },
    supplementAuthorPrompt: function (payload) { return request("POST", "/api/platform/supplements/author-prompt", payload); },
    supplementSolverPrompt: function (payload) { return request("POST", "/api/platform/supplements/solver-prompt", payload); },
    supplementCheck: function (payload) { return request("POST", "/api/platform/supplements/check", payload); },
    createSupplementDraft: function (payload) { return request("POST", "/api/platform/supplements/drafts", payload); }
  };
})();
