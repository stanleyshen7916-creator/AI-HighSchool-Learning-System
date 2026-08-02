# PLATFORM_SYNC_CHECK_Report.md

## Platform Sync Report

| Area | Result |
|---|---|
| Runtime | PASS |
| Persistence | PASS |
| Repository | PASS |
| Cross Page | PASS |
| Statistics | PASS *(1 real issue found and fixed — see below)* |
| GitHub | PASS *(1 finding, flagged only — see below)* |
| Verify | PASS |
| Test | PASS |
| Deployment | PASS |

## Method

Every check below was performed against real repository state (`git log`, `grep`/static analysis
across every file, actual script-tag inspection of all 10 root HTML pages), not assumed. Where a
prior EO/Sprint already documented and justified something that looks unusual at first glance
(e.g. a Runtime with no persistence, a script-order deviation), that documentation was read and
the real functional behavior verified via the existing test suite before concluding PASS — not
just trusting the comment.

## 1. Runtime — PASS

`AHS.MaterialRuntime` / `AHS.SummaryRuntime` / `AHS.QuestionRuntime` / `AHS.WrongBookRuntime` /
`AHS.ReviewRuntime` / `AHS.HistoryRuntime` / `AHS.StatisticsRuntime` each have **exactly one**
declaration in `js/runtime/`, confirmed via `grep -rn "AHS\.<Name> = (function" js/`. No duplicate
declarations, no legacy/orphaned copies anywhere in `js/`.

`ai-engine/src/runtime/QuestionRuntime.js` and `ai-engine/src/runtime/SummaryRuntime.js` (loaded on
`materials.html`, EO-AI-012A/AI-100 "New Runtime" AI pipeline mode) were specifically checked for a
namespace collision — they declare `AHS.AIEngine.QuestionRuntime`/`AHS.AIEngine.SummaryRuntime`
under a distinct `AHS.AIEngine.*` sub-namespace, never touching `AHS.QuestionRuntime`/
`AHS.SummaryRuntime` directly. No collision; this is the same, already-tested "New Runtime" mode
group `[23]` in the regression suite already covers.

## 2. Persistence — PASS

4 of the 7 Runtimes persist via `AHS.PersistenceAdapter` (`MaterialRuntime`, `SummaryRuntime`,
`WrongBookRuntime`, `HistoryRuntime` — the last two as of Sprint AI-109/111). The other 3 are
**legitimately memory-only by design**, not an inconsistency:
- `QuestionRuntime` — documented Exam-Mode-memory-only design (`PROJECT_STATUS.json`'s
  `runtimePersistence.notCovered`), re-populated every page load via `TeachingMaterialLoader.js`.
- `ReviewRuntime` — a stateless view-model builder over `AutoGrader`'s own cache; has no rows of its
  own to persist (see its own file header).
- `StatisticsRuntime` — purely computed fresh from `HistoryRuntime`/`WrongBookRuntime` on every
  call; storing anything here would itself create a second, driftable copy of the same data.

No Runtime silently drops real data across a page navigation that should have survived it — this
was the actual real gap (WrongBookRuntime/HistoryRuntime) closed by Sprint AI-109, verified fixed
by the cross-page tests in that Sprint and re-confirmed still passing here.

## 3. Repository — PASS

Exactly one `AHS.MaterialRepository` declaration (`data/materials/MaterialRepositoryIndex.js`),
exactly one real material registered against it (`CivicsG10Ch5to6Exam20260730.js`), exactly one
`AHS.TeachingMaterialData` declaration (`js/data/TeachingMaterialData.js`, still genuinely empty —
no drift), exactly one `js/runtime/TeachingMaterialLoader.js` bridging both tracks into
`MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime` — the same, single, already-documented
architecture from HOTFIX-002 onward. Material Center / Summary / Quiz / WrongBook / Review / Tutor
all read from this same bridged state (via `MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime`/
`WrongBookRuntime`/`HistoryRuntime`/`StatisticsRuntime` — never a second Repository read path).

## 4. Cross Page — PASS

Re-ran Sprint AI-111's end-to-end regression (group `[34]`): 教材中心 → 學習總結 → AI 練習 → 測驗
中心 → 錯題本 → 複習中心 → 首頁 → AI Tutor, across 7 fresh page loads carrying only
`sessionStorage` forward (a real browser-tab-equivalent journey, not a shared in-memory `window`).
All real data (WrongBook entries, mastery status, exam stats) agrees at every step. Still 100%
passing after the latest merges.

## 5. Statistics — PASS (1 real issue found and fixed)

**Root cause found**: `js/components/MyLearning.js`'s (我的學習) own "正確率" stat computed
`totalCorrect / totalQuestions` (a **weighted** average across all real `AHS.HistoryRuntime`
records) — a different formula than `AHS.StatisticsRuntime.overview().avgAccuracy` (the average of
each exam's own accuracy%, already used as "平均正確率" on 測驗中心's stat card). Same real
underlying data, two different formulas, two different displayed percentages depending which page
you were on — exactly the "重新計算不同結果" this check exists to catch. (Concrete example: exam
1 = 3/4 correct = 75%, exam 2 = 1/10 correct = 10% → StatisticsRuntime's average-of-percentages =
43%, MyLearning's old weighted average = 28.6%.)

**Fix**: `MyLearning.js` now reads `AHS.StatisticsRuntime.overview().avgAccuracy` directly instead
of computing its own. `完成題數` (total questions across all exams) has no equivalent metric on
`StatisticsRuntime` and was left as its own real, local sum of `HistoryRuntime` records — not a
duplicate of anything, just a different real metric. `learning.html` gained the missing
`<script src="js/runtime/StatisticsRuntime.js">` tag (it read `HistoryRuntime` directly before but
never had `StatisticsRuntime` loaded at all).

All other 正確率/得分/完成率 displays checked (`ReviewRecentSession.js`, `QuizCenter.js`,
`WrongBook.js`'s own retry-session summary) either pass through an already-real Runtime field
unchanged, or compute a genuinely different, non-duplicate metric (e.g. WrongBook.js's batch-review
session score is "how many you got right in this retry session," never claimed to be "exam
accuracy") — no other divergent-formula issue found.

## 6. GitHub Merge — PASS (1 finding, flagged only — outside this check's allowed scope to fix)

No merge-conflict markers anywhere in the repository. No duplicate Runtime files. No dead-code
regression from recent merges beyond the pre-existing, already-PMO-documented Foundation-only file
set (`PROJECT_STATUS.json`'s own `knownLimitations` list — unchanged).

**Finding**: the most recent merge (`5091d44`, "Sprint MAT-CONTENT-002｜酸鹼、溶解度與生活化學重點
整理與模擬試題") added a real, well-formed material entry (`id: 10`) to `AHS.Mock.materials` in
`js/data/MockData.js`. Checked every root HTML page's `<script>` tags: **`MockData.js` is not
loaded by any of them** — it is not a new problem this Sprint introduced (this file has never been
`<script>`-tagged anywhere; it is part of the same pre-existing, already-documented "Foundation
layer, not yet page-wired" set noted in `PROJECT_STATUS.json`), but it does mean this specific new
content is currently invisible in the live app, despite its own commit message's stated intent
("供教材中心資料使用"). This task's own scope explicitly forbids modifying `MockData.js` or wiring
new content into a page ("不得修改 MockData"/"不得新增功能") — so this is reported for Project
Owner awareness/decision only, not fixed here.

## 7. Script — PASS

Every root HTML page's script list was checked for missing files (0), duplicate `<script src>`
entries (0), and that the page's own bootstrap (`js/pages/AppXxx.js`) is the last script loaded (10
of 10 pages correct). One script-order deviation was found and investigated, not fixed:
`index.html`/`summary.html` load `SummaryRuntime.js` *after* `TeachingMaterialLoader.js` — but this
predates this session (HOTFIX-001) and is explicitly documented by its own inline comment ("Must
load after MaterialRuntime.js and before AppHome.js, which calls
TeachingMaterialLoader.load()") — `TeachingMaterialLoader.js` only calls into `SummaryRuntime` from
inside deferred functions (`load()`), never at its own script-parse time, so definition order
between the two is functionally irrelevant as long as both exist before `load()` is actually
invoked (which it is — `AppHome.js`/`AppSummary.js` are always the last script). Confirmed safe by
the passing cross-page test suite on both exact pages. Not changed, to avoid unnecessary churn on
a pre-existing, working, already-explained pattern.

## 8. Build — PASS

```
npm run verify → VerifyPaths PASS (0 broken / 0 legacy) · VerifyForbiddenPatterns PASS
npm test       → 273/273 PASS
```

## 9. Runtime Smoke Test — PASS

The full 教材 → Summary → Quiz → WrongBook → Review → Tutor chain is exercised end-to-end by
regression group `[34]` (introduced Sprint AI-111, re-verified here) plus the new group `[35]`
(this check). No Runtime interruption anywhere in the chain.

## 修正檔案（唯一一項真實修正）

- `js/components/MyLearning.js` — 正確率改為讀取 `AHS.StatisticsRuntime.overview().avgAccuracy`
  （單一真實來源），移除獨立的加權平均計算
- `learning.html` — 補上缺少的 `js/runtime/StatisticsRuntime.js` script tag
- `tests/jsdom/BehaviorSuite.js` — 新增 group `[35]`（3 項檢查，含「兩公式在此資料下確實會分歧」
  的非退化驗證，確保測試本身有效）
- `docs/EO/PLATFORM_SYNC_CHECK_Report.md`（本檔案）

## Verify / Test

`npm run verify` PASS。`npm test` **273/273 PASS**（270 之前 + 3 新增）。`PipelineRegression`
6/6 PASS。

## Merge Commit / GitHub Pages Deploy Status

Filled in after merge.
