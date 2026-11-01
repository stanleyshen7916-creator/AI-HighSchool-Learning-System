/* js/utils/ExamPeriod.js — 判斷教材／題目屬於哪一次月考（資料：js/data/ExamPeriodConfig.js）。
   of(material, materialId)     -> { id, label, current, done } | null
   ofMaterialId(materialId)      -> 同上（從 AHS.TeachingMaterialData 找教材）
   ofQuestionId("tm_94_q3")      -> 同上（Package 題目編號帶有教材編號）
   ofRuntimeMaterial(item)       -> 頁面上的教材紀錄（AHS.MaterialRuntime）
   ofWrongItem(record)           -> 錯題紀錄
   options(school, semesterIds)  -> 篩選用的選項 [{ id, label }]（沒有設定時為 []）
   currentFor(school, semesterIds) -> 目前月考 { id, label } | null
   沒有設定的學校／學期一律回傳 null，畫面就不顯示任何月考標籤。 */
window.AHS = window.AHS || {};
AHS.ExamPeriod = (function () {
  "use strict";

  function config(school, semester) {
    var ranges = (AHS.ExamPeriodConfig && AHS.ExamPeriodConfig.ranges) || {};
    return ranges[school + "|" + semester] || null;
  }

  function describe(cfg, id) {
    var p = (cfg.periods || []).filter(function (x) { return x.id === id; })[0];
    return p ? { id: p.id, label: p.label, current: p.id === cfg.current, done: !!p.done } : null;
  }

  function of(material, materialId) {
    if (!material) { return null; }
    var cfg = config(material.school, material.semester);
    if (!cfg) { return null; }
    var fixed = materialId && cfg.materials && cfg.materials[materialId];
    if (fixed) { return describe(cfg, fixed); }
    var date = String(material.date || "").slice(0, 10);
    var id = (cfg.periods[0] || {}).id;
    (cfg.periods || []).forEach(function (p) { if (p.from && date && date >= p.from) { id = p.id; } });
    return describe(cfg, id);
  }

  function entryFor(materialId) {
    var all = Array.isArray(AHS.TeachingMaterialData) ? AHS.TeachingMaterialData : [];
    for (var i = 0; i < all.length; i += 1) {
      if (all[i] && all[i].materialId === materialId) { return all[i]; }
    }
    return null;
  }

  function ofMaterialId(materialId) {
    var e = entryFor(materialId);
    if (e) { return of(e.material, materialId); }
    /* 舊版教材庫紀錄（data/materials/*.js）：學校／學期／建立日期在 metadata 裡 */
    var rec = AHS.MaterialRepository && typeof AHS.MaterialRepository.getById === "function"
      ? AHS.MaterialRepository.getById(materialId) : null;
    var meta = rec && rec.metadata;
    return meta ? of({ school: meta.workspaceSchool, semester: meta.workspaceSemester, date: meta.createdAt }, materialId) : null;
  }

  /* 頁面上的教材（AHS.MaterialRuntime 紀錄）：Package 教材帶有 originKey（tm_…）；
     舊版教材庫紀錄用 TeachingMaterialLoader 存的對照表反查來源編號。 */
  function ofRuntimeMaterial(item) {
    if (!item) { return null; }
    if (item.originKey) { return ofMaterialId(item.originKey); }
    var idMap = (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function")
      ? (AHS.PersistenceAdapter.load("teachingMaterialLoaderIdMap") || {}) : {};
    var keys = Object.keys(idMap);
    for (var i = 0; i < keys.length; i += 1) {
      if (idMap[keys[i]] === item.id) { return ofMaterialId(keys[i]); }
    }
    return null;
  }

  /* 錯題紀錄：先看題目編號（tm_94_q3），再看教材編號 */
  function ofWrongItem(item) {
    if (!item) { return null; }
    return ofQuestionId(item.questionId) ||
      (item.materialId ? (ofMaterialId(item.materialId) || ofRuntimeMaterial({ id: item.materialId })) : null);
  }

  function ofQuestionId(questionId) {
    var m = /^(tm_\d+)_q/.exec(String(questionId || ""));
    return m ? ofMaterialId(m[1]) : null;
  }

  function firstConfig(school, semesterIds) {
    var sems = Array.isArray(semesterIds) ? semesterIds : [semesterIds];
    for (var i = 0; i < sems.length; i += 1) {
      var cfg = config(school, sems[i]);
      if (cfg) { return cfg; }
    }
    return null;
  }

  function options(school, semesterIds) {
    var cfg = firstConfig(school, semesterIds);
    if (!cfg) { return []; }
    /* 目前的月考排第一個，方便直接選 */
    var list = (cfg.periods || []).map(function (p) { return { id: p.id, label: p.label + (p.done ? "（已結束）" : "") }; });
    list.sort(function (a, b) { return (b.id === cfg.current) - (a.id === cfg.current); });
    return list;
  }

  function currentFor(school, semesterIds) {
    var cfg = firstConfig(school, semesterIds);
    return cfg ? describe(cfg, cfg.current) : null;
  }

  function workspace() {
    var ws = AHS.WorkspaceRuntime && typeof AHS.WorkspaceRuntime.getCurrent === "function"
      ? AHS.WorkspaceRuntime.getCurrent() : null;
    return ws || null;
  }

  /* 目前登入的學校／學期的選項；沒有設定時為 [] */
  function workspaceOptions() {
    var ws = workspace();
    return ws ? options(ws.schoolId, ws.semesterIds || []) : [];
  }

  function workspaceCurrent() {
    var ws = workspace();
    return ws ? currentFor(ws.schoolId, ws.semesterIds || []) : null;
  }

  return {
    of: of, ofMaterialId: ofMaterialId, ofQuestionId: ofQuestionId,
    ofRuntimeMaterial: ofRuntimeMaterial, ofWrongItem: ofWrongItem,
    options: options, currentFor: currentFor,
    workspaceOptions: workspaceOptions, workspaceCurrent: workspaceCurrent
  };
})();
