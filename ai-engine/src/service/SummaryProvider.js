/* ai-engine/src/service/SummaryProvider.js — EO-AI-011 · AI Summary Dual-run Integration
   EO-AI-012C · Migration Bridge Hotfix (Read/Generate separation)
   Single entry point for retrieving a Summary, selectable between the
   Baseline Legacy system (AHS.KnowledgeSummaryRuntime, read-only, never
   written to) and the New Pipeline (AHS.AIEngine.SummaryService, which
   already owns the one SummaryRuntime/SummaryPipeline singleton pair —
   this file creates no second Runtime, no second Cache, no second UI).

   Mode is one of "legacy" / "new" / "compare", default "legacy" (never
   auto-switched).

   EO-AI-012C LOCK Contract: getSummary() is ALWAYS Read Only, in every
   mode — it never generates, never triggers the pipeline, never
   creates a Summary. Before this hotfix, "new" mode's read path called
   SummaryService.generate() unconditionally, so the very first read
   (e.g. MaterialSummaryCard.create()'s initial mount) silently
   produced real content and skipped straight to "ready" state — a
   confirmed regression (3 real BehaviorSuite failures) once Sprint
   AI-013 tried to flip the default mode. generateSummary() is the new,
   separate entry point that actually runs the New pipeline; nothing
   in this file calls it automatically — it is only ever meant to be
   invoked from an explicit user action (the「開始 AI 分析」button flow,
   mirroring how AITutorService.ensureLearningSummary() is the sole
   trigger for Legacy generation).

   In "compare" mode, getSummary() still returns the Legacy summary —
   the value a caller would render never changes just because Dual-run
   is active — and now reads (never generates) both sides to diff via
   the existing, unmodified SummaryComparator; the resulting report is
   kept in one in-memory variable (getLastComparison()) for QA to read,
   never written to any Runtime, never persisted, never shown to the
   user. A caller wanting a meaningful comparison must call
   generateSummary(materialId) first to populate the New side.

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

  /* EO-AI-012C: read-only — returns whatever the New pipeline's own
     Runtime already has cached (undefined if generateSummary() has
     never been called for this materialId). Never runs the pipeline. */
  function readNewSummary(materialId) {
    return AHS.AIEngine.SummaryService.get(materialId);
  }

  /* EO-AI-012C: the only function that actually runs the New pipeline.
     Delegates to the existing SummaryService singleton — no second
     SummaryPipeline/SummaryRuntime instance created here. */
  function runNewSummary(materialId) {
    return AHS.AIEngine.SummaryService.generate(materialId);
  }

  /* Compare Mode (Development §2-3): reads (never generates) both
     sides, diffs via SummaryComparator, keeps the report in memory
     only for QA (getLastComparison()). Returns the Legacy summary —
     Compare mode never changes what a caller/UI would receive. */
  function runCompare(materialId) {
    var legacy = getLegacySummary(materialId);
    var fresh = readNewSummary(materialId);
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

  /* getSummary(materialId) — EO-AI-012C LOCK Contract: ALWAYS Read
     Only regardless of mode. Never generates, never triggers the
     pipeline, never creates a Summary. */
  function getSummary(materialId) {
    if (mode === "new") { return readNewSummary(materialId); }
    if (mode === "compare") { return runCompare(materialId); }
    return getLegacySummary(materialId);
  }

  /* generateSummary(materialId) — EO-AI-012C Part B: the explicit
     Generate API. Only meant to be called from an explicit user
     action; nothing in this file calls it automatically. */
  function generateSummary(materialId) {
    if (mode === "new" || mode === "compare") {
      return runNewSummary(materialId);
    }
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
    generateSummary: generateSummary,
    getLastComparison: getLastComparison
  };
})();
