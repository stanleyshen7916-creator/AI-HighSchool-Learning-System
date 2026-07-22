/* js/runtime/FolderRuntime.js — Sprint 8.0 · EO-S8.0-003
   Folder Scope Runtime（Study Scope Baseline v1.0）.

   A Folder is NOT a file folder. It is a STUDY SCOPE — 第一次月考 /
   期末考 / 學測總複習 — and, per the PMO Study Scope Baseline, the
   scope of every AI flow that follows:

     Folder (Study Scope) → Files → Knowledge Graph → Summary
     → Question → Wrong Book → Review

   Public API — exactly seven (不得新增其他公開 API):
     createFolder(input) / updateFolder(id, patch) / deleteFolder(id)
     getFolder(id) / listFolders() / validate(record) / status(id)

   ID-space decision (flagged in the EO report): AHS.MaterialRuntime
   (LOCK) already owns folder containers ("fd_N") and each material
   carries a single folderId assigned at add() time; it exposes no
   re-assign API. So createFolder() WRAPS MaterialRuntime.addFolder()
   — its public API, used not modified — to obtain the canonical id,
   and stores the Study Scope metadata against that same id. This keeps
   Material Binding real (a material's folderId resolves to this scope)
   instead of inventing a parallel id space that nothing would point
   at. 一個檔案只能屬於一個 Folder is therefore structural: the
   material record has exactly one folderId field.

   Reserved links (knowledgeGraphId / summaryId / questionBankId /
   wrongBookId / reviewId) are created as null and stay null: this EO
   builds NO Summary, Question, Answer, Review or WrongBook content,
   runs no AI analysis, and never calls LearningQuestionGenerator,
   LearningQuestionSession or AnswerBuilderRuntime — verified by a
   source-scan assertion in tests/regression/FolderRuntimeV1.js.
   KnowledgeGraphRuntime is never modified (never even imported here). */
window.AHS = window.AHS || {};
AHS.FolderRuntime = (function () {
  "use strict";

  var STORAGE_KEY = "folderRuntime";
  var SCOPE_TYPES = ["exam", "review", "subject", "custom"];

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && Array.isArray(loaded.items)) { return loaded; }
    }
    return null;
  }
  function persist() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.save === "function") {
      AHS.PersistenceAdapter.save(STORAGE_KEY, store);
    }
  }
  var store = hydrate() || { items: [], seq: 0 };
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function nowIso() { return new Date().toISOString(); }

  function findIndex(folderId) {
    for (var i = 0; i < store.items.length; i += 1) {
      if (store.items[i].folderId === folderId) { return i; }
    }
    return -1;
  }

  /* Files in this scope — resolved READ-ONLY from MaterialRuntime. */
  function filesOf(folderId) {
    var mr = AHS.MaterialRuntime;
    if (!mr || typeof mr.list !== "function") { return []; }
    return mr.list()
      .filter(function (m) { return m.folderId === folderId; })
      .map(function (m) {
        return { sourceFileId: m.id, fileName: m.fileName || "", title: m.title || "", subject: m.subject || null };
      });
  }

  /* ---- validate(record) --------------------------------------------------
     folderName 不得為空；folderId 唯一；scopeType 於固定清單；
     預留關聯欄位必須存在（值允許 null）。 */
  function validate(record) {
    var errors = [];
    record = record || {};

    if (!record.folderId) { errors.push("缺少 folderId"); }
    if (!String(record.folderName || "").trim()) { errors.push("folderName 不得為空"); }
    if (record.scopeType && SCOPE_TYPES.indexOf(record.scopeType) === -1) {
      errors.push("scopeType 不合法（僅允許：" + SCOPE_TYPES.join(" / ") + "）");
    }
    ["knowledgeGraphId", "summaryId", "questionBankId", "wrongBookId", "reviewId"].forEach(function (k) {
      if (!(k in record)) { errors.push("缺少預留關聯欄位：" + k + "（值允許 null）"); }
    });
    ["createdAt", "updatedAt"].forEach(function (k) {
      if (!record[k]) { errors.push("缺少 " + k); }
    });

    /* folderId 唯一 — 重複視為無效（同一筆自身除外）。 */
    var seen = 0;
    store.items.forEach(function (f) { if (f.folderId === record.folderId) { seen += 1; } });
    if (seen > 1) { errors.push("folderId 重複（必須唯一）"); }

    return { valid: errors.length === 0, errors: errors };
  }

  /* ---- createFolder(input) ---------------------------------------------- */
  function createFolder(input) {
    input = input || {};
    if (!String(input.folderName || "").trim()) { return null; }

    /* Canonical id from MaterialRuntime's own folder container so that
       material.folderId binding resolves to this scope. */
    var folderId = null;
    var mr = AHS.MaterialRuntime;
    if (mr && typeof mr.addFolder === "function") {
      var container = mr.addFolder({ name: String(input.folderName).trim(), subject: input.subject || null });
      folderId = container && container.id ? container.id : null;
    }
    if (!folderId) {
      store.seq += 1;
      folderId = "fr_" + store.seq;   /* honest fallback if MaterialRuntime absent */
    }
    if (findIndex(folderId) !== -1) { return null; }   /* uniqueness guard */

    var now = nowIso();
    var record = {
      folderId: folderId,
      folderName: String(input.folderName).trim(),
      subject: input.subject || null,
      scopeType: input.scopeType || "custom",
      description: String(input.description || ""),
      /* 預留關聯 — 本 EO 一律 null，不得建立任何實際內容。 */
      knowledgeGraphId: null,
      summaryId: null,
      questionBankId: null,
      wrongBookId: null,
      reviewId: null,
      createdAt: now,
      updatedAt: now
    };

    var check = validate(record);
    if (!check.valid) { return null; }
    store.items.push(record);
    persist();
    return clone(record);
  }

  /* ---- updateFolder(id, patch) ------------------------------------------
     Editable: folderName / subject / scopeType / description, plus the
     reserved link ids (so a future EO can attach real artefacts through
     this same interface). Identity and timestamps are locked. */
  function updateFolder(folderId, patch) {
    var idx = findIndex(folderId);
    if (idx === -1) { return null; }
    patch = (patch && typeof patch === "object") ? patch : {};

    var EDITABLE = ["folderName", "subject", "scopeType", "description",
      "knowledgeGraphId", "summaryId", "questionBankId", "wrongBookId", "reviewId"];
    var next = clone(store.items[idx]);
    EDITABLE.forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) { next[k] = patch[k]; }
    });
    if (Object.prototype.hasOwnProperty.call(patch, "folderName") &&
        !String(patch.folderName || "").trim()) {
      return null;   /* folderName 不得為空 */
    }
    next.updatedAt = nowIso();

    var saved = store.items[idx];
    store.items[idx] = next;
    var check = validate(next);
    if (!check.valid) { store.items[idx] = saved; return null; }
    persist();
    return clone(next);
  }

  /* ---- deleteFolder(id) --------------------------------------------------
     Delegates container removal to MaterialRuntime's public removeFolder(),
     which DETACHES its materials (folderId = null) and never deletes a
     file — then drops the scope record. */
  function deleteFolder(folderId) {
    var idx = findIndex(folderId);
    if (idx === -1) { return false; }
    var mr = AHS.MaterialRuntime;
    if (mr && typeof mr.removeFolder === "function") { mr.removeFolder(folderId); }
    store.items.splice(idx, 1);
    persist();
    return true;
  }

  /* ---- getFolder(id) — scope record + its bound files -------------------- */
  function getFolder(folderId) {
    var idx = findIndex(folderId);
    if (idx === -1) { return null; }
    var record = clone(store.items[idx]);
    record.files = filesOf(folderId);
    record.fileCount = record.files.length;
    return record;
  }

  function listFolders() {
    return store.items.map(function (f) {
      var r = clone(f);
      r.fileCount = filesOf(f.folderId).length;
      return r;
    });
  }

  /* ---- status(id) --------------------------------------------------------
     "unknown"  no such scope
     "empty"    scope exists, no files bound yet
     "ready"    files bound; downstream artefacts not built yet
     "analyzed" a reserved link has been attached by a future EO */
  function status(folderId) {
    var idx = findIndex(folderId);
    if (idx === -1) { return "unknown"; }
    var f = store.items[idx];
    if (f.knowledgeGraphId || f.summaryId || f.questionBankId || f.wrongBookId || f.reviewId) {
      return "analyzed";
    }
    return filesOf(folderId).length ? "ready" : "empty";
  }

  return {
    createFolder: createFolder,
    updateFolder: updateFolder,
    deleteFolder: deleteFolder,
    getFolder: getFolder,
    listFolders: listFolders,
    validate: validate,
    status: status
  };
})();
