# PLATFORM_REFACTOR_MASTER_Report.md — Platform Integration (v2.0)

## Summary

Platform Refactor Master's stated goal was not new features but "重新整理 Platform"（Platform
Integration）: fix cross-page inconsistencies in how Progress / Accuracy / Mastery are defined
and displayed, establish a Single Source of Truth, extend the existing Tutor Context, and decide
whether any of 首頁/教材中心/學習總結/我的學習/複習中心/測驗中心/錯題本/AI Tutor should be
consolidated or have their responsibilities redefined. No new Runtime/Repository/Architecture was
authorized — only reorganize/consolidate/correct.

Traced against real code (not assumed): the platform's underlying data pipeline
(Material → Summary → Question → Quiz → WrongBook → Review → History → Statistics → Tutor,
LOCKed through Sprint AI-112) has no bug in it. The real problem, exactly as the task's own Root
Cause section stated, is Platform UX / label consistency, not Runtime correctness. This report
covers what was fixed, what was investigated and correctly left alone, and what was investigated
and explicitly flagged as contradicting this same task's own scope (mirroring the precedent set
in Sprint AI-109 for AI-605/606/607).

## Platform Consistency（PAT 2, 6, 7）

**Root cause (concrete, evidenced):** `AHS.MaterialRuntime`'s `item.progress` field measures
per-material **reading/interaction progress** only (set via `startLearning()`). It was labeled
「學習進度」（Learning Progress）on the Home "最近教材" card
(`js/components/HomeRecentMaterials.js`) and every Material Center card
(`js/ui/MaterialCard.js`). "Learning Progress" reads, to a user, as "how much of this I've
learned" — but the field only ever tracks whether the material was opened/read, completely
independent of whether any quiz on that material was ever answered correctly. This is exactly the
scenario the PO described: Home showed 100% "學習進度" for a material whose Quiz Center accuracy
was 17% and whose AI Tutor still said "未精熟" — three different, all-correct, real numbers from
three different real Runtimes, made to look contradictory only by one mislabeled UI string.

**Fix (display-only, zero calculation change):**
- `js/components/HomeRecentMaterials.js` — label 「學習進度」→「閱讀進度」(Reading Progress)
- `js/ui/MaterialCard.js` — same label fix (Material Center grid cards)
- `js/data/AppConfig.js` — 教材中心 sort-by option 「學習進度」→「閱讀進度」(same underlying
  field, used as a sort key); hero `continueFeedback` copy updated to match ("...閱讀進度")
- `js/components/Dashboard.js` — corrected a stale file-header comment ("All Mock") that
  predates Sprint AI-020's real wiring; not a UI or data change, `data.progress`/`data.knowledge`
  in that file are still — correctly — never populated by `AppDashboard.js` today (no Runtime
  produces that data), so those sections keep rendering their existing honest Empty State

No sort logic, filter logic, or Runtime call site matches on the literal Chinese string — verified
by grep before renaming, so this is a pure label fix with no behavioral side effects.

`js/components/MyLearning.js`'s "科目進度" section (`computeSubjectProgress()`) also averages
`MaterialRuntime.progress`, but its section title ("科目進度"/Subject Progress, not "學習進度")
doesn't use the word "學習" and sits on the same page as the already-fixed real-正確率 "學習總覽"
block (Platform Sync Check), giving it correct context in place. Left unchanged — flagged here
for PO visibility, not silently decided either way.

## Single Source of Truth（PAT 3）

New `docs/Architecture/Architecture_Platform_Terminology_v1.0.md` is now the one authoritative
definition of 閱讀進度 (Reading Progress) / 正確率 (Accuracy) / 精熟度 (Mastery) — each mapped to
exactly one real Runtime and API, with an explicit rule that no other module may recompute those
numbers independently.

Full-repo audit of every "accuracy"/"correctCount" display in `js/components/`: confirmed
`QuizCenter.js`, `MyLearning.js` (fixed earlier in Platform Sync Check), `WrongBook.js` (single
review-session result, not a cross-page aggregate — no second source to diverge from),
`ReviewRecentSession.js` (renders a caller-supplied value, computes nothing itself), and
`AppDashboard.js` (reads `StatisticsRuntime.refresh()` + `LearningHistoryModel.refresh()`
directly) all trace to exactly one real source each. No new duplicate-calculation bug found beyond
the one already fixed in Platform Sync Check.

## Tutor Context（PAT 8, 9, 10）— investigated, NOT extended, contradiction flagged

The task asks the AI Tutor Context (built in Sprint AI-111: `StatisticsRuntime.learningContext()`
+ `TutorMessage.build()`, currently consumed by 首頁 and `tutor.html` only) to also be referenced
by 教材中心/學習總結/測驗中心/錯題本/複習中心, and for the Tutor to stop being "a fixed
template".

Investigated concretely: grepped every component under `js/components/` for any existing
AI-suggestion-style UI or independent "what should I do next" logic on those five pages. None
exists — `SummaryCenter.js`'s own "複習建議" is a **content-derived** review-suggestion for that
specific material (from `SummaryRuntime`'s own `reviewSuggestions`/derived text), a genuinely
different concept from a personalized cross-material Tutor Context; no other page has anything
comparable. There is nothing to "consolidate onto the shared context" here, because nothing
duplicative exists to begin with — literally satisfying items 8/9/10 would mean designing and
adding new AI-suggestion UI blocks to five pages that have never had one.

That directly contradicts this same task's own stated scope: "不得新增新功能...只能整理/整合/
修正". This is the same category of self-contradiction already found and correctly not guessed at
in Sprint AI-109 (AI-605/606/607) — reported here with the same discipline rather than either
inventing new UI unilaterally or silently dropping the PAT item. **Not implemented.** Awaiting an
explicit Project Owner ruling on whether this authorizes new UI (in which case it should be
re-scoped as its own Sprint with real UI acceptance criteria) or whether the existing 首頁/Tutor
sharing already satisfies the intent.

## Page Responsibility（PAT 11）— investigated, no consolidation performed

Checked whether 學習總結 (`summary.html`) / 我的學習 (`learning.html`) / 複習中心
(`review.html`) are genuinely redundant, since this task (unlike AI-109) explicitly authorizes
merging them if so ("若高度重疊，可直接整併，不需保留"):

- **學習總結** (`SummaryCenter.js`) — per-material content digest: 核心概念/重要定義/易錯重點/
  必背內容/複習建議, sourced from `SummaryRuntime`. Content-focused.
- **我的學習** (`MyLearning.js`, 607 lines, read in full) — personal aggregate dashboard across
  six real sections: 學習總覽/學習記錄/週報告/學習日曆/成就徽章/科目進度. Stats-focused,
  cross-material.
- **複習中心** (`AppReview.js`/`WrongBook`-driven) — action-focused: today's due review items,
  most recent review session, direct entry into re-answering wrong questions.

These have three distinct primary jobs (read a material's own content vs. see aggregate personal
stats vs. act on due reviews) — not three views of the same thing. **No consolidation performed.**
This finding is the concrete answer to item 11, not a placeholder: the investigation happened, the
conclusion is "genuinely distinct, do not merge," matching the same evidence-based standard used
throughout this session for every other consolidation question (e.g., the two Teaching Material
Repository tracks in Sprint AI-112, correctly NOT merged for the same reason — real, load-bearing
architectural distinctness, not duplication).

## Navigation（PAT 12）— one real defect found and fixed

While tracing `js/data/AppConfig.js`'s `nav` object (the real, production navigation config —
confirmed `AppConfig.js`, not the unwired legacy `MockData.js`, is what every page's Sidebar/Bottom
Navigation actually renders from), found: the Sidebar's `nav.items` list already excludes
「儀表板」(dashboard.html) — a deliberate change from **EO-S5-002**, whose own comment explains
`learning.html` (我的學習) is dashboard.html's real replacement. But `nav.bottomItems` (Mobile
Bottom Navigation) still had `{ id: "dashboard", label: "我的", icon: "tutor" }` — EO-S5-002 fixed
the Sidebar but never updated this second list, so mobile users' only "my stats" destination
stayed on the already-deprioritized page while desktop Sidebar users got the real one. Also: the
old entry's `icon: "tutor"` was itself a leftover from an earlier bug (WB-S5-003/004, documented in
`MockData.js`'s own comment) never fully cleaned up.

**Fix**: `js/data/AppConfig.js` `nav.bottomItems`'s last entry is now
`{ id: "learning", label: "我的", icon: "learning" }` — matches the Sidebar exactly (`js/ui/
AppShell.js`'s `ROUTES.learning = "learning.html"`, already existed, unmodified). `dashboard.html`
itself is untouched and still directly reachable by URL — this only changes what the primary
navigation points at, extending EO-S5-002's own already-established precedent rather than
introducing a new decision.

## Learning Flow / Cross Page（PAT 4, 5）

Re-verified (not re-built) the closed loop 教材→Summary→Quiz→WrongBook→Review→Tutor→首頁 via the
existing `tests/regression/RepositoryFoundation.js` (21/21) and `BehaviorSuite.js` groups [33]–[35]
(Sprint AI-109/AI-111/Platform Sync Check's own end-to-end regression coverage, all still passing
unmodified) — no drift found since Sprint AI-112. 錯題/Progress/Review/Mastery cross-page
consistency (item 5) is the same ground already covered by group [34]'s real DOM-click
retry-to-mastery flow (WrongBook ↔ Review ↔ Quiz Center all reading the same
`WrongBookRuntime.correctStreak`) — reconfirmed passing, no new desync found.

## What was deliberately NOT done

- No new Runtime, no Runtime API changed, no new Repository, no new Architecture — per this
  task's own explicit constraint.
- No new AI Tutor Context UI added to 教材中心/學習總結/測驗中心/錯題本/複習中心 (PAT 8/9/10) —
  flagged as contradicting the same task's "no new feature" rule; awaiting explicit PO ruling
  rather than guessed at.
- No page deleted or merged (PAT 11) — 學習總結/我的學習/複習中心 confirmed genuinely distinct,
  not redundant.
- `dashboard.html` itself not removed, not un-routed from `ROUTES` — only the Bottom Navigation's
  default destination changed, consistent with the Sidebar's own prior EO-S5-002 decision.
- `MyLearning.js`'s "科目進度" section left unchanged (flagged for PO awareness above, not
  silently decided).

## 修改檔案

- `js/components/HomeRecentMaterials.js` — label 學習進度→閱讀進度
- `js/ui/MaterialCard.js` — label 學習進度→閱讀進度
- `js/data/AppConfig.js` — sort option 學習進度→閱讀進度；hero copy 用詞同步；
  `nav.bottomItems`「我的」routes to `learning` instead of `dashboard`
- `js/components/Dashboard.js` — file-header comment correction only (no logic/UI change)
- `docs/Architecture/Architecture_Platform_Terminology_v1.0.md` (new)
- `tests/jsdom/BehaviorSuite.js` — new group [36] (3 checks: label fix, nav fix, console errors)
- `docs/PMO/PROJECT_STATUS.json`, `docs/PMO/SPRINT.json`

## Verify / Test

`npm run verify` → PASS (0 broken paths, 0 legacy references, 0 forbidden-pattern hits; 1 known,
pre-existing, already-tracked `window.location.href` exception in `HomeRecentMaterials.js`,
untouched this Sprint).

`npm test` → **BehaviorSuite 276/276 PASS** (273 + 3 new) / **PipelineRegression 6/6 PASS** /
**RepositoryFoundation 21/21 PASS**. All three suites clean.

## Merge Commit / GitHub Pages Deploy Status

Filled in after merge.

## Acceptance

- ☑ Platform Consistency — root cause of PAT 6/7 confirmed and fixed (label, not logic)
- ☑ Single Source — terminology doc + full audit, no new duplicate-calculation bug found
- ⚠ Tutor Context — investigated, contradiction with "no new feature" flagged, not built;
  awaiting explicit PO ruling
- ⚠ Page Responsibility — investigated, genuinely distinct, no consolidation performed
  (this is the completed answer to item 11, not a deferral)
- ☑ Learning Flow / Cross Page — re-verified via existing regression, no drift found
- ☑ Navigation — one real defect found (Bottom Nav "我的" → deprecated dashboard.html) and fixed
- ☑ Verify / Test — all clean

等待 Project Owner PAT 後 Platform Refactor Master Closed（Tutor Context 擴充範圍需 PO 明確裁定
是否授權新增 UI，或維持現狀由首頁/AI Tutor 共用即可）。
