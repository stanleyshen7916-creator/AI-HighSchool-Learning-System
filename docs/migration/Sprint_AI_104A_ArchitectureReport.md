# ArchitectureReport.md — Sprint AI-104A｜Repository Baseline Synchronization

Priority：P0 ｜ Type：Documentation Sprint（Execution only，zero code changes）｜ 完成後停止，等待 PMO 驗收。

## Objective

修正 PMO 文件與 Repository 真實狀態的落差，建立所有後續 Sprint 必須依循的新 Baseline。零功能新增、
零 UI 修改、零 Runtime 修改。

## Why This Sprint Was Necessary — evidence from the last three Sprints

This Sprint exists because the exact staleness it corrects caused real, avoidable friction in the
three Sprints immediately preceding it:

1. **Sprint 7 (original "Content Import Runtime")** asked to "建立 Material Runtime／Summary
   Runtime／WrongBook Runtime" and a new top-level `/import` folder — all three Runtimes already
   existed as LOCK production code, and no top-level folder is sanctioned. Required a full pause
   and PMO correction (issued as Sprint AI-103, PMO Decision AI-103-001) before implementation
   could proceed safely.
2. **Sprint AI-103 itself**, even after that correction, still required discovering (via direct code
   inspection, not assumption) that `QuestionRuntime` had no external-question-import path — resolved
   with one small, disclosed Runtime Extension rather than a workaround.
3. **Sprint MVP-01 ("Material Runtime Integration")** asked to seed Material Center from
   `/data/materials.json` and rebuild Material/Summary Runtimes from scratch, again colliding with
   the same two LOCK Runtimes, plus a `fetch()`-based load path this project's own rules forbid.
   Currently paused pending PMO clarification.

All three used a genuine, real Repository Structure document (`Architecture_Repository_Structure_v2.1.md`)
that itself understated the truth (e.g., described `ai-engine/` as empty scaffolding when it has
been 60 real files, live in production for Summary generation, since Sprint AI-013). This Sprint
closes that gap directly with real, verified content, not incremental patches.

## Deliverables (per this Sprint's own Output list)

| # | Deliverable | File |
|---|---|---|
| 1 | Repository Structure | `docs/Architecture/Architecture_Repository_Structure_vNext.md` |
| 2 | Runtime Inventory | `docs/Architecture/RuntimeInventory.md` |
| 3 | Component Inventory | `docs/Architecture/ComponentInventory.md` |
| 4 | Data Flow | `docs/Architecture/DataFlow.md` |
| 5 | Extension Point | `docs/Architecture/ExtensionPoints.md` |
| 6 | Architecture Report | this file |
| 7 | Updated Sprint Status | `docs/PMO/SPRINT.json` (rewritten with real history + real repository position) |

## Methodology — verified, not recalled

Every fact in the five Architecture documents was checked directly against the repository, not
written from memory of prior Sprints in this session:

- Full top-level and `js/`/`ai-engine/src/` directory listings via `find`/`ls`.
- Every Runtime's real public API confirmed by reading its actual header comment and return object
  (not assumed from its filename).
- Real Sprint/EO chronology reconstructed from `git log` (89 commits, full history read start to
  finish), not from `docs/PMO/SPRINT.json`'s prior (stale, "Sprint 6.6") content.
- Cross-checked specific claims two prior Sprints got wrong: confirmed `AHS.DashboardRuntime` does
  not exist anywhere (`grep`); confirmed Dashboard's real data sources
  (`StatisticsRuntime`/`LearningHistoryModel`) are distinct from the Sprint-4 `QuestionRuntime`/
  `WrongBookRuntime` pair; confirmed `js/ai/` is a real, 3-file, production ninth `js/` category, not
  covered by the "eight categories" rule in the prior structure document.

## Key Corrections to Prior Documentation

1. **`js/` has nine categories, not eight** — `ai/` (3 files: `SummaryAdapter`, `QuestionAdapter`,
   `GatewayIntegration`) has been real since EO-AI-007.
2. **`ai-engine/` is not empty scaffolding** — 60 real files, live in production for Summary
   generation since Sprint AI-013 Beta Cutover. `platform/`/`shared/` remain genuinely empty and
   still correctly described as placeholder-only.
3. **`AHS.DashboardRuntime` does not exist** — Dashboard is a UI component + page bootstrap reading
   `StatisticsRuntime`/`LearningHistoryModel` directly.
4. **Exam Mode and Practice Mode are two parallel, non-converging chains**, not one linear pipeline —
   they share no Runtime until Dashboard, and even there through different Runtimes each.
5. **No top-level `/import` or `/data` folder is sanctioned** — `js/data/` (existing category) is the
   correct home for any static/seed content a future Sprint needs to ship.
6. **Real Sprint/EO chronology** now reflects all ~89 commits through Sprint AI-102, plus the current,
   honest status of AI-103 (built, pending PMO acceptance) and MVP-01 (paused).

## Changed Files

**新增（6 個檔案）**
```
docs/Architecture/Architecture_Repository_Structure_vNext.md
docs/Architecture/RuntimeInventory.md
docs/Architecture/ComponentInventory.md
docs/Architecture/DataFlow.md
docs/Architecture/ExtensionPoints.md
docs/migration/Sprint_AI_104A_ArchitectureReport.md
```

**修改（1 個檔案，依 Task AI104A-06 明確授權）**
```
docs/PMO/SPRINT.json   — real Sprint history + real repository position, replacing stale "Sprint 6.6"
```

**未修改**：任何 `.js`／`.html`／`.css` 檔案（本 Sprint 零程式碼變更，符合 Objective 明確要求）。
`docs/Architecture/Architecture_Repository_Structure_v2.1.md` 本身未刪除，僅由 `vNext.md` 於本次
落差處取代其權威性；未落差之規則（命名規則、`assets/`/`css/`/`docs/` 分類規則等）仍然有效。

## Root Cause

無（Documentation Sprint，非 Bug Fix）。

## QA

零程式碼變更 = 零 regression 風險。`npm test`／`npm run verify`／全部 25 個 regression 檔案結果與
Sprint AI-103 完成時完全相同（1160/1160），因為沒有任何受測程式碼被觸碰。已用 `git diff --stat --
'*.js' '*.html' '*.css'` 確認為空。

## 停止聲明

依 Sprint 指示，完成後停止。**禁止 Push**，等待 PMO 驗收。驗收後，所有後續 Sprint 規劃須完全依照
本 Baseline（五份 Architecture 文件 + 更新後的 SPRINT.json），不得再依照舊文件規劃。
