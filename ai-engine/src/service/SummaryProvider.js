/* ai-engine/src/service/SummaryProvider.js — EO-AI-011 · AI Summary Dual-run Integration
   Single entry point for retrieving a Summary, selectable between the
   Baseline Legacy system (AHS.KnowledgeSummaryRuntime, read-only, never
   written to) and the New Pipeline (AHS.AIEngine.SummaryService, which
   already owns the one SummaryRuntime/SummaryPipeline singleton pair —
   this file creates no second Runtime, no second Cache, no second UI).

   Mode is one of "legacy" / "new" / "compare", default "legacy" (never
   auto-switched). In "compare" mode, getSummary() still returns the
   Legacy summary — the value a caller would render never changes just
   because Dual-run is active — while both Legacy and New are generated
   in the background and diffed via the existing, unmodified
   SummaryComparator; the resulting report is kept in one in-memory
   variable (getLastComparison()) for QA to read, never written to any
   Runtime, never persisted, never shown to the user.

   Not wired into any page's <script> order, not called by
   MaterialSummaryCard.js — same "built, not wired" status as the rest
   of ai-engine/. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

AHS.AIEngine.SummaryProvider = (function () {
  "use strict";

  var MODES = ["legacy", "new", "compare"];
  var mode = "legacy";
  var comparator = new AHS.AIEngine.SummaryComparator();
  var lastComparison = null;

  function setMode(nextMode) {
    if (MODES.indexOf(nextMode) === -1) {
      throw new AHS.AIEngine.ValidationError(
        "SummaryProvider.setMode requires one of: " + MODES.join(", ")
      );
    }
    mode = nextMode;
  }

  function getMode() {
    return mode;
  }

  /* Read-only — never writes to AHS.KnowledgeSummaryRuntime. */
  function getLegacySummary(materialId) {
    if (
      typeof window !== "undefined" &&
      window.AHS &&
      AHS.KnowledgeSummaryRuntime &&
      typeof AHS.KnowledgeSummaryRuntime.getSummaryByMaterial === "function"
    ) {
      return AHS.KnowledgeSummaryRuntime.getSummaryByMaterial(materialId);
    }
    return null;
  }

  /* Delegates to the existing SummaryService singleton — no second
     SummaryPipeline/SummaryRuntime instance created here. */
  function getNewSummary(materialId) {
    return AHS.AIEngine.SummaryService.generate(materialId);
  }

  /* Compare Mode (Development §2-3): runs both, diffs via
     SummaryComparator, keeps the report in memory only for QA
     (getLastComparison()). Returns the Legacy summary — Compare mode
     never changes what a caller/UI would receive. */
  function runCompare(materialId) {
    var legacy = getLegacySummary(materialId);
    var fresh = getNewSummary(materialId);
    lastComparison = {
      materialId: materialId,
      coverage: comparator.coverageReport(legacy, fresh),
      missingItems: comparator.missingItems(legacy, fresh),
      compatibility: {
        legacy: comparator.checkCompatibility(legacy),
        new: comparator.checkCompatibility(fresh)
      }
    };
    return legacy;
  }

  function getSummary(materialId) {
    if (mode === "new") { return getNewSummary(materialId); }
    if (mode === "compare") { return runCompare(materialId); }
    return getLegacySummary(materialId);
  }

  function getLastComparison() {
    return lastComparison;
  }

  return {
    MODES: MODES.slice(),
    setMode: setMode,
    getMode: getMode,
    getSummary: getSummary,
    getLastComparison: getLastComparison
  };
})();
