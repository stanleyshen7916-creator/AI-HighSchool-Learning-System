# QA_Sprint_AI-013_Equivalence_Validation.md — Legacy ↔ New Coverage (Part B)

Validated with real jsdom against real `materials.html` (ai-engine wired in via EO-AI-012A), using **Compare Mode**, against all **8 real Repository MockData materials** (`js/data/MockData.js` — not synthetic test strings), per this Sprint's own constraint: "資料來源：Repository MockData / BehaviorSuite / Regression Suite / Compare Mode".

## First run — before EO-AI-010B

```
Aggregate across all 8 Repository MockData materials:
  coreConcepts      totalLegacy=8  totalNew=2   materials-with-degradation=6
  keywords          totalLegacy=0  totalNew=0   materials-with-degradation=0
  definitions       totalLegacy=0  totalNew=0   materials-with-degradation=0
  formulas          totalLegacy=0  totalNew=0   materials-with-degradation=0
  importantPoints   totalLegacy=0  totalNew=6   materials-with-degradation=0
```

6 of 8 real materials lost their Core Concept (misclassified as Important Point) — every one opens with "本教材介紹/整理/彙整/說明...", a phrasing `CONCEPT_SENTENCE_PATTERN` didn't cover. Reported to PMO; fixed by EO-AI-010B (Pattern Expansion — see `docs/migration/EO_AI_010B_REPORT.md` and the "Pattern Expansion" section of `docs/migration/EO_AI_010_VALIDATION.md` for full detail).

## Second run — after EO-AI-010B

| Subject | Core Concepts | Keywords | Definitions | Formulas | Important Points | Title | Compat (Legacy/New) |
|---|---|---|---|---|---|---|---|
| math | 100% | — | — | — | — | correct | true/true |
| english | 100% | — | — | — | — | correct | true/true |
| physics | 100% | — | — | — | — | correct | true/true |
| chemistry | 100% | — | — | — | — | correct | true/true |
| biology | 100% | — | — | — | — | correct | true/true |
| history | 100% | — | — | — | — | correct | true/true |
| geography | 100% | — | — | — | — | correct | true/true |
| civics | 100% | — | — | — | — | correct | true/true |

```
Aggregate across all 8 Repository MockData materials:
  coreConcepts      totalLegacy=8  totalNew=8   materials-with-degradation=0
  keywords          totalLegacy=0  totalNew=0   materials-with-degradation=0
  definitions       totalLegacy=0  totalNew=0   materials-with-degradation=0
  formulas          totalLegacy=0  totalNew=0   materials-with-degradation=0
  importantPoints   totalLegacy=0  totalNew=0   materials-with-degradation=0
```

**Zero degradation across all 5 categories, all 8 real materials.** Every material's real title now flows through correctly (EO-AI-012E), and `MaterialSummaryCard.hasSummaryContent()` compatibility is PASS for both Legacy and New on every material.

## Conclusion

Part B's "確認：無退化" gate is satisfied against real Repository data (not synthetic scenarios alone). Part A (Default Mode Migration) is safe to proceed.
