/* js/runtime/DocumentClassifierRuntime.js — Sprint 8.0 · EO-S8.0-001
   Module 1 · Document Classifier.

   classify(materialRecord) -> { materialId, documentType, signal,
   sourceFileId } where documentType ∈ material | handout | exam |
   answer_key | note | other (教材/講義/考卷/解答/筆記/其他).

   Classification is DETERMINISTIC and reads only the real material
   record — never a UI-chosen value (不得由 UI 指定: the uploader's
   分類 field is deliberately ignored). Signals, in priority order,
   are filename keywords then extension hints; no signal → honest
   "other". Content-level classification requires a real parser or a
   bound AI Provider — both out of scope this Sprint — and is flagged
   in the EO report; nothing here guesses. Results persist via the
   Adapter (key "documentClassifier"), one record per materialId. */
window.AHS = window.AHS || {};
AHS.DocumentClassifierRuntime = (function () {
  "use strict";
  var STORAGE_KEY = "documentClassifier";
  var TYPES = ["material", "handout", "exam", "answer_key", "note", "other"];

  /* keyword -> type, checked in order (answer keys often contain 考卷
     words too, so answer wins first). All lowercase compare. */
  var RULES = [
    { type: "answer_key", words: ["解答", "詳解", "answerkey", "answer_key", "answers", "解析卷"] },
    { type: "exam", words: ["考卷", "試題", "試卷", "段考", "模擬考", "小考", "期中考", "期末考", "exam", "quiz", "test"] },
    { type: "note", words: ["筆記", "note"] },
    { type: "handout", words: ["講義", "handout"] },
    { type: "material", words: ["課本", "教材", "textbook", "chapter"] }
  ];

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
  var store = hydrate() || { items: [] };
  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function detect(name) {
    var n = String(name || "").toLowerCase();
    for (var i = 0; i < RULES.length; i += 1) {
      for (var j = 0; j < RULES[i].words.length; j += 1) {
        if (n.indexOf(RULES[i].words[j]) !== -1) {
          return { type: RULES[i].type, signal: "filename:" + RULES[i].words[j] };
        }
      }
    }
    return { type: "other", signal: "none" };
  }

  function classify(material) {
    if (!material || !material.id) { return null; }
    var hit = detect((material.fileName || "") + " " + (material.title || ""));
    var record = {
      materialId: material.id,
      sourceFileId: material.id,
      documentType: hit.type,
      signal: hit.signal,
      classifiedAt: new Date().toISOString()
    };
    store.items = store.items.filter(function (r) { return r.materialId !== material.id; });
    store.items.push(record);
    persist();
    return clone(record);
  }

  function getByMaterialId(materialId) {
    var found = null;
    store.items.forEach(function (r) { if (r.materialId === materialId) { found = r; } });
    return found ? clone(found) : null;
  }

  function validate(record) {
    var errors = [];
    if (!record || !record.materialId) { errors.push("缺少 materialId"); }
    if (!record || TYPES.indexOf(record.documentType) === -1) { errors.push("documentType 不合法"); }
    return { valid: errors.length === 0, errors: errors };
  }

  function reset() { store = { items: [] }; persist(); }

  return { classify: classify, getByMaterialId: getByMaterialId, validate: validate, TYPES: TYPES.slice(), reset: reset };
})();
