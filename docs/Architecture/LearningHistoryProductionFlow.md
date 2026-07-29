# LearningHistoryProductionFlow.md — Sprint AI-016 Part A

Repository Audit of the Learning History architecture. Pure documentation — no code touched. Every claim below is taken from reading `js/runtime/HistoryRuntime.js`, `js/runtime/StatisticsRuntime.js`, `js/components/Dashboard.js`, `js/pages/AppDashboard.js`, `js/components/MyLearning.js`, `js/components/QuizCenter.js`, `js/pages/AppReview.js`, `ai-engine/src/runtime/SummaryHistory.js` in full, plus `grep`-verified real call sites across the repository and `<script>` wiring on `dashboard.html`/`learning.html`/`quiz.html`/`review.html` — not inferred from this Sprint's diagram.

## 1. Which Runtime is the official Production learning history?

**`js/runtime/HistoryRuntime.js` (Sprint 4) is the only History Runtime in the repository.** No `LearningHistoryRuntime.js` and no `AppHistory.js` page exist — confirmed via repository-wide search (`find . -iname "*history*"`), which returns exactly two files: this one, and the unrelated `ai-engine/src/runtime/SummaryHistory.js` (see §2).

`HistoryRuntime`'s real, complete shape: `record(gradedResult)` appends one Exam-Mode-graded-result summary (`{id, order, examId, subject, title, chapter, score, accuracy, correctCount, totalCount, when}`) to a plain in-memory array (no `PersistenceAdapter`, resets on reload — genuinely session-only, same as `WrongBookRuntime`). `list()` returns everything, newest-first. There is no `materialId`, no `questionId`, no field connecting a history entry to the Learning Question / WrongBook / Review chain at all — its schema is Exam-Mode-native only.

**It is the official history for Exam Mode only.** For Practice Mode / the Production Pipeline (Material → Summary → Question → Quiz → WrongBook → Review), **no history mechanism exists anywhere in the repository.**

## 2. Do multiple History models exist?

Two files with "History" in the name exist, but they are not competing implementations of the same concept — they track entirely different things:

| File | Tracks | Written by |
|---|---|---|
| `js/runtime/HistoryRuntime.js` | One row per finished, graded Exam Mode exam | `QuizCenter.js`'s `finishExam()` only |
| `ai-engine/src/runtime/SummaryHistory.js` | When a Summary Model was generated for a material (AI Summary Pipeline's own generation timestamp log) | AI Summary Pipeline (`EO-AI-006`) |

`SummaryHistory.js`'s own header explicitly documents why it does **not** call `AHS.HistoryRuntime.record()`: *"that method's fixed exam-result shape is consumed by StatisticsRuntime; feeding it a Summary Model would corrupt quiz statistics."* This is a deliberate, documented separation from an earlier EO — not confusion, not duplication of the same concept. **There is no second, competing "Learning History" model** — there is simply no history model at all for the Practice/Production pipeline.

## 3. Does any Legacy implementation remain?

`HistoryRuntime` itself, relative to the Production track (Sprint AI-015C onward), *is* the Legacy implementation — it was never extended or connected to the new pipeline; it remains exactly as built in Sprint 4. One additional, real Legacy artifact found: `QuizCenter.js`'s own Exam Mode right-rail `history()` function falls back to **static Mock data** (`mockHistory`) when `HistoryRuntime` is empty — its own comment: *"falls back to the static Mock history otherwise, so a first-ever visit still shows example content."* This predates, and was never touched by, the EO-S7.0-003 "Production Cleanup" pattern that removed equivalent Mock fallbacks from WrongBook/Dashboard/Review in earlier Sprints (Part C documents this precisely).

## 4. Does Dashboard consume the Production history?

**No — confirmed structurally and empirically.** `dashboard.html`'s `<script>` list (`grep -n "<script" dashboard.html`) loads exactly: `UI.js`, `EmptyState.js`, `Icons.js`, `AppConfig.js`, `Qiaoqiao.js`, `AppShell.js`, `Dashboard.js`, `AppDashboard.js`. **`HistoryRuntime.js`, `StatisticsRuntime.js`, `WrongBookSession.js`, `ReviewQueue.js` are not loaded on this page at all** — structurally impossible to consume them even by intent.

`AppDashboard.js` calls `AHS.Dashboard.create()` with **no arguments**. `Dashboard.js`'s own `create(model)`:
```js
var data = model;
if (!data) {
  return AHS.EmptyState.create({ title: "尚無學習數據", ... });
}
```
Since `model` is always `undefined` here, `Dashboard.js` **always** renders the Empty State — confirmed empirically (Part B) even when real `HistoryRuntime`/`WrongBookSession`/`ReviewQueue` data exists elsewhere in the same session. The component's own comment (`EO-S7.0-003 Production Cleanup`) states this precisely: *"the Mock 學習分析 dataset is removed. Until real analytics derive from the Runtimes, the page shows the 正式 Empty State — never fake statistics."* This is honest (no fabricated numbers), but it means Dashboard has been in a permanent, unconditional Empty State since that EO, with no Sprint since having wired real data into it. The file's own top-of-file header comment ("All Mock...") is now stale relative to this later, honest-Empty-State behavior — the header was never updated when EO-S7.0-003 removed the Mock dataset.

## 5. Does the AI Learning Flow terminate correctly at History?

**No.** Confirmed via `grep -rn "HistoryRuntime\.record("` across the entire repository: the **only** call site is `js/components/QuizCenter.js`'s `finishExam()` — Exam Mode's own function, entirely disjoint from Practice Mode (per Sprint AI-015A/E/F/G's repeated, re-confirmed finding that Exam Mode and Practice Mode share no code path). Empirically validated in Part B: a full real Practice Mode session — real material → real question generation → real Bridge write → real wrong answer → real `WrongBookSession` entry → real mastery promotion via `WrongBookGenerator.update()` → real `ReviewQueue.enqueue()` — never once calls `HistoryRuntime.record()`. The Production Pipeline this Sprint's diagram describes (`Material → Summary → Question → Quiz → WrongBook → Review → History → Dashboard`) has a real, confirmed break at the `Review → History` edge: no such edge exists in the codebase.

## 6. Full consumer map (Repository Truth)

```
Exam Mode (Loop A)                          Practice Mode / Production Pipeline (Loop B)
        │                                            │
        ▼                                            ▼
AutoGrader.grade()                    WrongBookGenerator → WrongBookSession
        │                                            │
        ▼                                            ▼
HistoryRuntime.record()               ReviewQueue → ReviewModel → ReviewWidget (index.html)
   (QuizCenter.js's finishExam(),                    │
    the ONLY write path)                             ▼
        │                                    (terminates here — no History write,
        ├──▶ StatisticsRuntime               no Dashboard connection — confirmed
        │      (read by QuizCenter.js's       empirically in Part B)
        │      own right-rail only)
        ├──▶ MyLearning.js (learning.html,
        │      real consumer, Exam-only data)
        ├──▶ ReviewHomeCard/ReviewRecentSession
        │      (review.html via AppReview.js,
        │      real consumer, Exam-only data)
        └──▶ QuizCenter.js's own history()
               (Exam Mode right-rail; falls
               back to static Mock when empty)

dashboard.html: does not load HistoryRuntime.js, StatisticsRuntime.js,
WrongBookSession.js, or ReviewQueue.js at all. Always renders Empty State
("尚無學習數據"), regardless of real data existing elsewhere.
```
