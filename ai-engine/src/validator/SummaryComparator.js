/* ai-engine/src/validator/SummaryComparator.js — EO-AI-010 · AI Summary Equivalence Validation
   Compares a Legacy Summary (AHS.KnowledgeSummaryRuntime shape) against
   a New Summary (SummaryPipeline output, EO-AI-009's `.summary`
   sub-object) for Functional Equivalence — existence / count /
   completeness / empty ratio per category. Never compares text content
   for exact string equality (the two systems extract independently,
   so identical wording is not the bar — "both produce real content in
   this category" is).

   checkCompatibility() calls the REAL, unmodified
   AHS.MaterialSummaryCard.hasSummaryContent() — this file never
   reimplements that logic and never modifies MaterialSummaryCard.js. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var SECTIONS = ["coreConcepts", "keywords", "definitions", "formulas", "importantPoints"];

  function SummaryComparator() {}

  SummaryComparator.SECTIONS = Object.freeze(SECTIONS.slice());

  function sectionArray(summary, section) {
    return (summary && summary.summary && Array.isArray(summary.summary[section]))
      ? summary.summary[section]
      : [];
  }

  /* Compare Items (Development §2): existence / count / completeness /
     empty ratio per section. No string-equality comparison anywhere. */
  SummaryComparator.prototype.compare = function (legacySummary, newSummary) {
    var report = {};
    SECTIONS.forEach(function (section) {
      var legacyItems = sectionArray(legacySummary, section);
      var newItems = sectionArray(newSummary, section);
      report[section] = {
        exists: { legacy: legacyItems.length > 0, new: newItems.length > 0 },
        count: { legacy: legacyItems.length, new: newItems.length },
        completeness: legacyItems.length > 0
          ? Math.min(1, newItems.length / legacyItems.length)
          : (newItems.length > 0 ? 1 : 0),
        emptyRatio: {
          legacy: legacyItems.length === 0 ? 1 : 0,
          new: newItems.length === 0 ? 1 : 0
        }
      };
    });
    return AHS.AIEngine.Utilities.freeze(report);
  };

  /* Coverage Report (Development §3): Legacy Count / New Count /
     Coverage % / Missing per section. */
  SummaryComparator.prototype.coverageReport = function (legacySummary, newSummary) {
    var comparison = this.compare(legacySummary, newSummary);
    var coverage = {};
    SECTIONS.forEach(function (section) {
      var c = comparison[section];
      var pct;
      if (c.count.legacy > 0) {
        pct = Math.round((Math.min(c.count.new, c.count.legacy) / c.count.legacy) * 100);
      } else {
        pct = c.count.new > 0 ? 100 : 0;
      }
      coverage[section] = {
        legacyCount: c.count.legacy,
        newCount: c.count.new,
        coveragePercent: pct,
        missing: c.count.legacy > 0 && c.count.new === 0
      };
    });
    return AHS.AIEngine.Utilities.freeze(coverage);
  };

  /* Section names where Legacy has content but New has none. */
  SummaryComparator.prototype.missingItems = function (legacySummary, newSummary) {
    var coverage = this.coverageReport(legacySummary, newSummary);
    return SECTIONS.filter(function (section) { return coverage[section].missing; });
  };

  /* Compatibility Validation (Development §4): the REAL
     MaterialSummaryCard.hasSummaryContent(), not a reimplementation. */
  SummaryComparator.prototype.checkCompatibility = function (summary) {
    if (
      typeof window !== "undefined" &&
      window.AHS &&
      AHS.MaterialSummaryCard &&
      typeof AHS.MaterialSummaryCard.hasSummaryContent === "function"
    ) {
      return AHS.MaterialSummaryCard.hasSummaryContent(summary);
    }
    return false;
  };

  AHS.AIEngine.SummaryComparator = SummaryComparator;
})();
