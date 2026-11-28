/* js/core/CouncilEngineClient.js — 2026-09-29 教材上傳併入學習平台.

   The one browser-side connection point to the local 教材上傳引擎
   (ai-engine/council, the former AI-Study-Council server running in
   Docker on the Admin's own computer). Like js/core/SupabaseClient.js,
   this is an authorized fetch() exception (scripts/verify/
   VerifyForbiddenPatterns.js AUTHORIZED_EXCEPTIONS): used by
   js/components/CouncilUpload.js on upload.html.

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
        error: { status: 0, message: offlineMessage() }
      };
    });
  }

  // An https page (GitHub Pages) reaching http://localhost also needs Chrome's
  // "Local network access" permission for the site; when it is blocked the
  // engine is running but every request fails exactly like an engine that is down.
  function offlineMessage() {
    var msg = "無法連線到教材上傳引擎（" + displayUrl() + "）。";
    if ((window.location || {}).protocol === "https:") {
      msg += "如果引擎已經在執行，通常是 Chrome 封鎖了這個網站存取本機網路：按網址列左邊的網站設定圖示，把「本機網路存取」改為「允許」後重新整理；或改開 " + DEFAULT_URL + "/upload.html。如果引擎還沒啟動，";
    }
    return msg + "請先在這台電腦執行「啟動教材上傳引擎.bat」。";
  }

  function enc(value) { return encodeURIComponent(value); }

  return {
    displayUrl: displayUrl,
    setBaseUrl: setBaseUrl,
    servedByEngine: servedByEngine,
    health: function () { return request("GET", "/api/health"); },
    catalog: function () { return request("GET", "/api/catalog"); },
    finalContent: function (filename) { return request("GET", "/api/finals/" + enc(filename)); },
    /* 2026-10-06 審議時保存的初稿（2026-11-26 起為本機模型 A、B 兩份） */
    finalDrafts: function (filename) { return request("GET", "/api/finals/" + enc(filename) + "/drafts"); },
    saveFinal: function (filename, content) { return request("PUT", "/api/finals/" + enc(filename), { content: content }); },
    /* 2026-10-12: 練習題 Claude 最終審查包 */
    practiceReview: function (filename) { return request("GET", "/api/finals/" + enc(filename) + "/practice-review"); },
    applyPracticeReview: function (filename, reply) { return request("POST", "/api/finals/" + enc(filename) + "/practice-review", { reply: reply }); },
    /* 2026-10-14: 原文辨識協助包（2026-11-26 起 OCR 看不清楚的照片由本機視覺模型轉錄） */
    ocrHelpCheck: function (sourceText, filename) { return request("POST", "/api/ocr-help/check", { sourceText: sourceText, filename: filename || null }); },
    ocrHelpMerge: function (payload) { return request("POST", "/api/ocr-help/merge", payload); },
    /* 2026-10-14: 送 Claude 最終審查的比例與標準答案集筆數 */
    adjudicationStats: function () { return request("GET", "/api/stats/adjudication"); },
    /* 2026-11-26 AHS-A3：本機模型工作（kind＝drafts｜author｜solve｜transcribe），背景執行、輪詢結果 */
    localJob: function (payload) { return request("POST", "/api/local-ai/jobs", payload); },
    getLocalJob: function (jobId) { return request("GET", "/api/local-ai/jobs/" + enc(jobId)); },
    /* 2026-11-26 AHS-A3：Claude 最後檢核（只判定、不重寫）；需修正時由本機模型修正，最多 2 輪 */
    finalCheck: function (filename) { return request("GET", "/api/finals/" + enc(filename) + "/final-check"); },
    applyFinalCheck: function (filename, reply) { return request("POST", "/api/finals/" + enc(filename) + "/final-check", { reply: reply }); },
    reviseFinal: function (filename) { return request("POST", "/api/finals/" + enc(filename) + "/final-check/revise", {}); },
    upload: function (files, progressId) {
      var form = new FormData();
      Array.prototype.forEach.call(files, function (f) { form.append("files", f, f.name); });
      return request("POST", "/api/upload" + (progressId ? "?progressId=" + enc(progressId) : ""), form);
    },
    /* 2026-11-21 MinerU：解析進度、逐頁區塊、原頁圖片與結構化 JSON 下載 */
    uploadProgress: function (progressId) { return request("GET", "/api/upload/progress/" + enc(progressId)); },
    uploadPages: function (sessionId) { return request("GET", "/api/uploads/" + enc(sessionId) + "/pages"); },
    pageImageUrl: function (sessionId, fileIndex, page) {
      return baseUrl() + "/api/uploads/" + enc(sessionId) + "/files/" + fileIndex + "/pages/" + page + "/image";
    },
    structuredUrl: function (sessionId, fileIndex, kind) {
      return baseUrl() + "/api/uploads/" + enc(sessionId) + "/files/" + fileIndex + "/structured/" + kind;
    },
    /* 2026-11-21 漏圖補查：背景執行（本機視覺模型逐頁檢查），進度走 uploadProgress，結果用 recheckResult 讀 */
    recheckStart: function (sessionId, progressId) {
      return request("POST", "/api/uploads/" + enc(sessionId) + "/recheck?progressId=" + enc(progressId), {});
    },
    recheckResult: function (sessionId) { return request("GET", "/api/uploads/" + enc(sessionId) + "/recheck"); },
    createJob: function (payload) { return request("POST", "/api/assemble-council/jobs", payload); },
    getJob: function (jobId) { return request("GET", "/api/assemble-council/jobs/" + enc(jobId)); },
    images: function (sourceId) { return request("GET", "/api/materials/" + enc(sourceId) + "/images"); },
    imagesZipUrl: function (sourceId) { return baseUrl() + "/api/materials/" + enc(sourceId) + "/images/download"; },
    listDrafts: function () { return request("GET", "/api/platform/drafts"); },
    getDraft: function (id) { return request("GET", "/api/platform/drafts/" + enc(id)); },
    createDraft: function (payload) { return request("POST", "/api/platform/drafts", payload); },
    publishDraft: function (id, confirmExisting) {
      return request("POST", "/api/platform/drafts/" + enc(id) + "/publish", { confirmExisting: !!confirmExisting });
    },
    /* 2026-10-05 發布後自動 commit + push 的進度 */
    gitJob: function (jobId) { return request("GET", "/api/platform/git-jobs/" + enc(jobId)); },
    /* 2026-10-05 模擬月考：管理者把某校某學期某科的範圍設為全體預設（寫入 js/data/MonthExamConfig.js 並自動上架） */
    saveMonthExamRange: function (payload) { return request("POST", "/api/platform/month-exam-config", payload); },
    /* 2026-10-06 從平台永久刪除已上架的教材（連同補充題庫），自動 PR 上架 */
    deleteMaterial: function (id) { return request("POST", "/api/platform/materials/" + enc(id) + "/delete", { confirm: true }); },
    deleteDraft: function (id) { return request("DELETE", "/api/platform/drafts/" + enc(id)); },
    /* 2026-10-01 為既有教材加題 */
    supplementParents: function () { return request("GET", "/api/platform/supplements/parents"); },
    supplementAuthorPrompt: function (payload) { return request("POST", "/api/platform/supplements/author-prompt", payload); },
    supplementSolverPrompt: function (payload) { return request("POST", "/api/platform/supplements/solver-prompt", payload); },
    supplementCheck: function (payload) { return request("POST", "/api/platform/supplements/check", payload); },
    createSupplementDraft: function (payload) { return request("POST", "/api/platform/supplements/drafts", payload); }
  };
})();
