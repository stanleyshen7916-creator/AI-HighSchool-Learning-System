/* js/core/PlatformContext.js — Sprint AI-124 (Platform Context & UX
   Consistency Hotfix) AI-124-02: the one, shared way every page reads
   "what is the student currently looking at" — Subject / Chapter /
   Material / Knowledge Point / Activity (practice vs exam) / Question
   Session — instead of each page bootstrap file (js/pages/AppQuiz.js,
   AppSummary.js, AppTutor.js, AppMaterials.js …) parsing
   `new URLSearchParams(window.location.search)` on its own, slightly
   differently each time (confirmed by grep: 4 separate ad hoc
   implementations before this Sprint).

   This is deliberately NOT a new Runtime: it holds no store of its own,
   calls AHS.PersistenceAdapter.save()/sessionStorage nowhere, and
   fabricates nothing — it only derives a normalized context object from
   the one real, already-existing source every page already has for
   free: the current URL's own query string (plus the
   "teaching_material_<id>" examId<->materialId convention every Runtime
   in this repo already uses, e.g. js/runtime/TeachingMaterialLoader.js's
   own resolveExamMeta(), js/components/QuizCenter.js's own
   materialIdFromExamId() before this Sprint). Per this Sprint's own
   LOCK ("僅允許：UI / Context / Navigation / Binding / Rendering / State
   Sync"), this file is Context/Navigation-layer glue — it never touches
   Learning Engine / Knowledge Engine / WrongBook / Knowledge Mastery /
   Statistics / Repository / Workspace Runtime, and only ever reads
   their already-existing, unmodified public API. PascalCase module
   under window.AHS, consistent with every other module in this repo. */
window.AHS = window.AHS || {};
AHS.PlatformContext = (function () {
  "use strict";

  var EXAM_ID_PREFIX = "teaching_material_";
  var EXAM_ID_SUFFIX_RE = /__original$|__ai$|__daily$|__retest$/;

  /* materialIdFromExamId(examId) — reverses the "teaching_material_<id>"
     convention (with AI-117-08/AI-121-05/07's own additive
     "__original"/"__ai"/"__daily"/"__retest" suffixes stripped first).
     Pure string parsing, no Runtime touched — the SAME logic every
     caller below used to keep its own private copy of. */
  function materialIdFromExamId(examId) {
    if (!examId) { return null; }
    var base = String(examId).replace(EXAM_ID_SUFFIX_RE, "");
    var m = /^teaching_material_(.+)$/.exec(base);
    return m ? m[1] : null;
  }

  /* examIdFromMaterialId(materialId) — the forward direction of the same
     convention, so callers never hand-build the "teaching_material_"
     prefix string in more than one place. */
  function examIdFromMaterialId(materialId) {
    return materialId ? (EXAM_ID_PREFIX + materialId) : null;
  }

  /* resolve(search) — search: optional query string (defaults to the
     real window.location.search); returns a normalized, real context:
       { subject, chapter, materialId, examId, knowledgePoint, mode,
         questionId }
     Every field is either a real value read straight from the URL, a
     real value derived from another real URL field via the
     materialId<->examId convention above, or null — never a guessed
     default. materialId is resolved even when only examId is present
     (and vice versa is NOT attempted — examId also carries the "which
     variant" suffix a bare materialId can't reconstruct, so that
     direction is left to each real caller's own existing
     TeachingMaterialLoader.resolveExamMeta()-based logic, unchanged). */
  function resolve(search) {
    var params = new URLSearchParams(search !== undefined ? search : window.location.search);
    var materialId = params.get("materialId") || null;
    var examId = params.get("examId") || null;
    if (!materialId && examId) { materialId = materialIdFromExamId(examId); }
    return {
      subject: params.get("subject") || null,
      chapter: params.get("chapter") || null,
      materialId: materialId,
      examId: examId,
      knowledgePoint: params.get("knowledgePoint") || null,
      mode: params.get("mode") || null,
      questionId: params.get("questionId") || null
    };
  }

  /* toQuery(ctx) — the inverse of resolve(): builds a query string that
     carries a real context forward into a link to another page, so
     "不得自行保存 Subject/Material，不得自行建立新的 Context" holds for
     outbound navigation too — every field present in ctx is preserved,
     nothing is silently dropped by a caller re-typing only the one
     param it happens to need this time. */
  function toQuery(ctx) {
    ctx = ctx || {};
    var params = new URLSearchParams();
    ["subject", "chapter", "materialId", "examId", "knowledgePoint", "mode", "questionId"].forEach(function (k) {
      if (ctx[k]) { params.set(k, ctx[k]); }
    });
    var qs = params.toString();
    return qs ? "?" + qs : "";
  }

  return {
    resolve: resolve,
    materialIdFromExamId: materialIdFromExamId,
    examIdFromMaterialId: examIdFromMaterialId,
    toQuery: toQuery
  };
})();
