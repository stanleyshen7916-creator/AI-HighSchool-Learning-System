/* js/ui/MaterialFileStore.js — HF-8.2.003 · Batch Image Upload Persistence.

   Shared companion store for the REAL bytes of uploaded material files.
   It exists because AHS.MaterialRuntime's `file` field holds a live File
   object and is documented as NOT persisted (a File cannot be
   JSON-serialised): the material record survives navigation, the File
   does not. This store is a UI-layer helper — it is NOT a Runtime, holds
   no material data, and never touches MaterialRuntime,
   MaterialTextProvider, AnalysisRuntime, KnowledgeGraphRuntime or any
   Foundation Runtime (all byte-identical).

   Why it replaced HF-8.2.001's inline single-key version — the root
   cause of the batch failure:
     HF-8.2.001 kept EVERY file inside ONE key ("materialFileStore").
     Each save therefore rewrote the whole collection, so with a batch of
     images the second write already had to fit image 1 + image 2 in a
     single value; sessionStorage's ~5 MB quota rejected it and every
     file after the first silently degraded to an oversize marker.
     Single upload passed, batch upload failed — exactly as reported.

   Fix — ONE UNIQUE STORAGE KEY PER MATERIAL:
     bytes  →  "materialFile:<materialId>"      (never shared, so two
                                                 uploads can never
                                                 overwrite each other)
     index  →  "materialFileIndex"              (ids + name/type/state
                                                 only — kept tiny)
   Each write touches only its own key, so a per-file quota failure
   leaves every other file intact, and a batch stores as many complete
   files as the browser's quota physically allows.

   All writes go through AHS.PersistenceAdapter (sessionStorage) only —
   never localStorage or indexedDB (project-forbidden). Bytes are stored
   VERBATIM: no compression, no re-encoding, no modification, so a
   download returns the original file byte-for-byte.

   Honest limits: sessionStorage's quota is a hard browser limit and
   base64 inflates bytes by ~33%. A file that cannot fit is recorded as
   { state: "oversize" } — never silently dropped — and callers report
   that it is downloadable only within the session that uploaded it
   (where the live File object is still in memory). */
window.AHS = window.AHS || {};
AHS.MaterialFileStore = (function () {
  "use strict";

  var INDEX_KEY = "materialFileIndex";
  var KEY_PREFIX = "materialFile:";
  /* Refuse to even attempt a value this large — sessionStorage limits
     sit near 5 MB and a doomed setItem just throws. */
  var MAX_VALUE_CHARS = 4 * 1024 * 1024;

  function adapter() {
    return (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.save === "function")
      ? AHS.PersistenceAdapter : null;
  }

  /* keyFor(materialId) — the unique storage key of one material's bytes.
     Exposed so QA can prove keys never collide. */
  function keyFor(materialId) {
    return KEY_PREFIX + String(materialId);
  }

  function readIndex() {
    var a = adapter();
    var loaded = a ? a.load(INDEX_KEY) : null;
    if (loaded && typeof loaded === "object" && loaded.entries && typeof loaded.entries === "object") {
      return loaded;
    }
    return { entries: {} };
  }

  function writeIndex(index) {
    var a = adapter();
    return !!(a && a.save(INDEX_KEY, index));
  }

  function setIndexEntry(materialId, entry) {
    var index = readIndex();
    index.entries[materialId] = entry;
    return writeIndex(index);
  }

  function dropIndexEntry(materialId) {
    var index = readIndex();
    if (index.entries[materialId]) {
      delete index.entries[materialId];
      writeIndex(index);
    }
  }

  /* ---- put(materialId, file, done) --------------------------------------
     Reads the real bytes (FileReader — no network) and stores them under
     this material's OWN key. done(result) receives:
       { materialId, state: "stored" | "oversize" | "failed", reason }
     Never throws; a failure for one file cannot affect another. */
  function put(materialId, file, done) {
    function finish(state, reason) {
      setIndexEntry(materialId, {
        name: (file && file.name) || "",
        type: (file && file.type) || "",
        state: state
      });
      if (typeof done === "function") {
        done({ materialId: materialId, state: state, reason: reason || null });
      }
    }

    if (!materialId || !file) {
      if (typeof done === "function") {
        done({ materialId: materialId || null, state: "failed", reason: "缺少 materialId 或檔案" });
      }
      return;
    }
    if (typeof window.FileReader === "undefined" || !adapter()) {
      finish("failed", "此瀏覽器不支援檔案讀取或暫存不可用");
      return;
    }

    var reader = new window.FileReader();
    reader.onload = function () {
      var dataUrl = String(reader.result || "");
      if (!dataUrl) { finish("failed", "檔案內容讀取為空"); return; }
      if (dataUrl.length > MAX_VALUE_CHARS) {
        finish("oversize", "檔案超出瀏覽器暫存單筆上限");
        return;
      }
      var ok = adapter().save(keyFor(materialId), {
        name: file.name || "", type: file.type || "", dataUrl: dataUrl
      });
      if (!ok) {
        /* Quota exhausted by files already stored. Only THIS file is
           affected — every previously stored file stays intact. */
        adapter().remove(keyFor(materialId));
        finish("oversize", "瀏覽器暫存空間不足");
        return;
      }
      finish("stored", null);
    };
    reader.onerror = function () { finish("failed", "檔案讀取失敗"); };
    try { reader.readAsDataURL(file); }
    catch (e) { finish("failed", "檔案讀取失敗"); }
  }

  /* ---- get / state / blobFor -------------------------------------------- */

  /* get(materialId) — the stored payload, or null when no bytes exist. */
  function get(materialId) {
    var a = adapter();
    if (!a || !materialId) { return null; }
    var payload = a.load(keyFor(materialId));
    if (payload && typeof payload === "object" && typeof payload.dataUrl === "string") {
      return payload;
    }
    return null;
  }

  /* state(materialId) — "stored" | "oversize" | "failed" | "none". */
  function state(materialId) {
    if (get(materialId)) { return "stored"; }
    var entry = readIndex().entries[materialId];
    return entry ? entry.state : "none";
  }

  /* dataUrlToBlob(dataUrl) — rebuild the original binary exactly. */
  function dataUrlToBlob(dataUrl) {
    if (typeof dataUrl !== "string" || dataUrl.indexOf(",") === -1) { return null; }
    if (typeof window.Blob === "undefined") { return null; }
    var head = dataUrl.slice(0, dataUrl.indexOf(","));
    var body = dataUrl.slice(dataUrl.indexOf(",") + 1);
    var mimeMatch = /:(.*?);/.exec(head);
    var mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    try {
      if (head.indexOf("base64") === -1) {
        return new window.Blob([decodeURIComponent(body)], { type: mime });
      }
      if (typeof window.atob !== "function" || typeof window.Uint8Array === "undefined") { return null; }
      var binary = window.atob(body);
      var bytes = new window.Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i += 1) { bytes[i] = binary.charCodeAt(i); }
      return new window.Blob([bytes], { type: mime });
    } catch (e) {
      return null;
    }
  }

  /* blobFor(materialId) — a real Blob of the original bytes, or null. */
  function blobFor(materialId) {
    var payload = get(materialId);
    return payload ? dataUrlToBlob(payload.dataUrl) : null;
  }

  /* dataUrlFor(materialId) — for consumers that need a src/href
     directly (image preview, or download where ObjectURL is missing). */
  function dataUrlFor(materialId) {
    var payload = get(materialId);
    return payload ? payload.dataUrl : null;
  }

  function remove(materialId) {
    var a = adapter();
    if (a) { a.remove(keyFor(materialId)); }
    dropIndexEntry(materialId);
  }

  /* list() — [{ materialId, name, type, state }] from the tiny index. */
  function list() {
    var entries = readIndex().entries;
    return Object.keys(entries).map(function (id) {
      return {
        materialId: id, name: entries[id].name, type: entries[id].type,
        state: entries[id].state, storageKey: keyFor(id)
      };
    });
  }

  function stats() {
    var out = { total: 0, stored: 0, oversize: 0, failed: 0 };
    list().forEach(function (e) {
      out.total += 1;
      if (e.state === "stored") { out.stored += 1; }
      else if (e.state === "oversize") { out.oversize += 1; }
      else { out.failed += 1; }
    });
    return out;
  }

  return {
    keyFor: keyFor,
    put: put,
    get: get,
    state: state,
    blobFor: blobFor,
    dataUrlFor: dataUrlFor,
    remove: remove,
    list: list,
    stats: stats
  };
})();
