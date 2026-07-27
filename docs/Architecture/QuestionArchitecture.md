# QuestionArchitecture.md — Sprint AI-015A Architecture Audit

Pure audit. No code, HTML, Runtime, API, or README was modified to produce this document. Every claim below is verified against real file contents and real `<script>` wiring (`grep`/`Read`), not assumption.

## Part A — Question Runtime Inventory (Repository 真實內容)

Four independent generations of "Question" tooling exist, each deliberately given a different name than its predecessor specifically to avoid modifying/breaking the prior one (a repeated, explicit "naming flag" pattern in the source comments):

| # | Component(s) | Sprint / EO | Content source | Wired into |
|---|---|---|---|---|
| 1 | `js/runtime/QuestionRuntime.js` + `js/runtime/QuestionBank.js` | Sprint 4 | `AHS.Mock.quiz.items` (static Mock Data), deterministic multiple-choice generation | `quiz.html` Exam Mode — `QuizCenter.js` calls `AHS.QuestionRuntime.getSet(session.examId)` |
| 2 | `js/runtime/LearningQuestionRuntime.js` + `js/parser/QuestionGenerator.js` | Sprint 6 (EO-S6-004) | Knowledge Runtime records, via `LearningPipeline.buildQuestions()` — but `QuestionGenerator.generateAIQuestion()` hard-codes literal `"[Stub] AI 題目尚未產生"` content (no real generation exists) | `materials.html` + `quiz.html`; triggered automatically by `MaterialCenter.js`'s `runLearningPipeline()` on material upload |
| 3 | `js/runtime/LearningQuestionSession.js` + `js/parser/LearningQuestionGenerator.js` + `js/parser/QuestionGenerationFlow.js` | Sprint 6.9 (EO-S6.9-001/002) | Top-level `AHS.SummaryRuntime` records (coreConcepts/definitions/pitfalls/memorize) — deterministic, not AI | `quiz.html` Practice Mode — triggered by the "開始練習" button inside `QuizCenter.showQuestionGuide()` |
| 4 | `js/runtime/QuestionGenerationRuntime.js` | Sprint 8.2 (EO-S8.2.003) | `AHS.KnowledgeGraphRuntime` (real content nodes from the Material's actual text) — rule-based, no LLM, but genuinely derived from real material content | `materials.html` only — `AITutorService.ensureQuestionSet()` → `MaterialPreview.js`'s "AI 練習題" card (`MaterialQuestionCard.js`) |

`QuestionGuide.js` (Sprint 6.8, EO-S6.8-002) is a fifth, thin UI-only component ("巧巧老師出題引導") sitting between Summary and Practice inside `quiz.html?mode=practice` — it renders reading/difficulty advice and hands off to #3's Practice list; it generates nothing itself.

**Critical naming collision (real, not cosmetic)**: the Sprint AI-015 spec's "QuestionRuntime" and "LearningQuestionRuntime" are **not interchangeable** — #1 (`QuestionRuntime`) is Exam Mode's mock-data runtime; #2/#3 (`LearningQuestionRuntime`/`LearningQuestionSession`) are the Practice-Mode/AI-flavored runtimes. #4 (`QuestionGenerationRuntime`, the one actually named "AI Question Generator" in EO-S8.2.003 and the only one deriving from real material content) has no relationship to any of #1–#3 at all — confirmed by zero cross-references in either direction.

## Part B — Question Flow (Generate / Store / Read / Display)

```
Loop 1 (Sprint 4, Exam Mode — 100% Mock Data, fully wired end-to-end):
  Generate: QuestionBank.generate(examMeta)      [from AHS.Mock.quiz.items]
  Store:    QuestionRuntime (in-memory, by examId)
  Read:     ExamRuntime / AnswerRuntime / AutoGrader
  Display:  QuizCenter.js Exam Mode UI

Loop 2 (Sprint 6→6.9, Practice Mode — deterministic, Summary-derived):
  Generate: QuestionGenerationFlow.run(materialId, difficulty)
              → LearningQuestionGenerator.generate() [reads AHS.SummaryRuntime only]
  Store:    LearningQuestionSession (current list/index/metadata)
            (separately: LearningPipeline.buildQuestions() also writes
             Stub-only content into LearningQuestionRuntime automatically
             on upload — a second, parallel writer into a THIRD store)
  Read:     QuizCenter.js — buildPracticeListView() merges
            LearningQuestionRuntime.list() + LearningQuestionSession records,
            filtering out anything QuizCenter.isRealLearningQuestion()
            identifies as [Stub]-prefixed
  Display:  QuizCenter.js Practice Mode UI (via QuestionCard.js)

Loop 3 (Sprint 8.2, materials.html-only — real content, page-contained):
  Generate: AITutorService.ensureQuestionSet(materialId)
              → QuestionGenerationRuntime.generateQuestions(materialId)
              [reads AHS.KnowledgeGraphRuntime — real material text nodes]
  Store:    QuestionGenerationRuntime (in-memory, by materialId)
  Read:     AITutorService.getPracticeQuestions() / ensureQuestionSet()
  Display:  MaterialPreview.js's "AI 練習題" card (MaterialQuestionCard.js)
            — never leaves materials.html, never reaches quiz.html
```

**Loops 1–3 do not intersect.** No component in Loop 3 is referenced by Loop 1 or Loop 2's files (confirmed by grep — zero cross-references either direction). Loop 2's own "real AI content" writer (`QuestionGenerator.generateAIQuestion()`, feeding `LearningQuestionRuntime`) only ever produces `[Stub]` placeholder text, which Loop 2's own display layer (`QuizCenter.isRealLearningQuestion()`) filters out and hides — so even within Loop 2, nothing AI-real is ever actually shown to the user today.

## Part C — WrongBook Inventory

| Implementation | Sprint / EO | Trigger | Feeds |
|---|---|---|---|
| `js/runtime/WrongBookRuntime.js` | Sprint 4 | `sync(gradedResult)` called after `AutoGrader.grade()` (Exam Mode only) | `review.html` (`AppReview.js` reads it), `wrongbook.html` |
| `js/runtime/WrongBookSession.js` + `js/parser/WrongBookGenerator.js` | Sprint 7.0 (EO-S7.0-001) | `WrongBookGenerator.add({questionId, userAnswer})`, called from `QuizCenter.wrongBookHook()` **only when the Practice-Mode answer is incorrect** (`finishSubmit(isCorrect,...)`, guarded by `!isCorrect`); rejects correct answers and rejects questions with no matching `LearningQuestionSession` record | `ReviewQueue` → `ReviewModel` → `ReviewWidget` (home page) |

Two independent WrongBook stores, matching their two independent source loops (Exam Mode vs. Practice Mode). Both correctly gate on "wrong answer only" — neither writes on generation. `wrongbook.html` loads **both** implementations' supporting files simultaneously (`WrongBookRuntime.js` AND `WrongBookGenerator.js`/`WrongBookSession.js`), i.e. that page is itself a merge point for both lineages' wrong-answer records, though `js/components/WrongBook.js`'s actual read/render logic was not traced further in this audit (out of the explicitly-scoped Question/WrongBook/Review inventory; would need its own pass if PMO wants it).

## Part D — Review Inventory

| Component | Sprint / EO | Role | Wired into |
|---|---|---|---|
| `js/runtime/ReviewRuntime.js` | Sprint 4 | `build(examId)` — shapes `AutoGrader`'s graded result into a right/wrong view-model. Reads nothing else. | `review.html` (loaded, but `AppReview.js` explicitly states it is "intentionally NOT used" for the review home page) |
| `js/runtime/ReviewGeneratorRuntime.js` | Sprint 8.2 (EO-S8.2.005) | Consumes "Learning Result" only (Quiz/Exam Result + WrongBook) — by construction excludes Material/Analysis/Summary/KnowledgeGraph (source-scan asserted) | `AITutorRuntime.getReviewList()` → `AITutorService` (materials.html's AI Tutor session only) |
| `js/runtime/ReviewQueue.js` | Sprint 7.0 (EO-S7.0-001) | Foundation-only queue store: `{questionId, nextReviewAt, priority, masteryLevel}`; `enqueue()` validates the `questionId` against a real `WrongBookSession` entry | `quiz.html`, `wrongbook.html` |
| `js/runtime/ReviewModel.js` | Sprint 7.0 (EO-S7.0-003) | Read-only query layer over `WrongBookSession` + `ReviewQueue` — explicitly named to avoid colliding with the Sprint-4 `ReviewRuntime` | Not loaded on `review.html`; loaded via `ReviewWidget.js` on `index.html` (home page) |
| `js/pages/AppReview.js` | Sprint 5 (EO-R001/R001A) | Home-page-style bootstrap for `review.html`: reads `AHS.HistoryRuntime.list()` + `AHS.WrongBookRuntime.list()` directly; does **not** call `ReviewRuntime.build()`, does **not** touch `ReviewGeneratorRuntime`/`ReviewQueue`/`ReviewModel` at all | `review.html` |

**`review.html`'s real page does not run the "WrongBook → Review → History" chain a reader would expect from the file names.** It runs a simpler, direct `HistoryRuntime` + `WrongBookRuntime` read (Sprint 4/5 lineage). The WrongBook-Intelligence chain (`WrongBookSession → ReviewQueue → ReviewModel`) that genuinely implements "wrong-answer-aware spaced review" is real and functioning, but its only rendered destination today is the `ReviewWidget` on the **home page** (`index.html`), not `review.html`.

## Part E — Dependency Graph

See `docs/Architecture/DependencyGraph.md` for the full Question → Quiz → WrongBook → Review graph across all three loops.

## Part F — 真正的 Learning Loop 是哪一條（依 Repository 真實內容，非推測）

**沒有單一、統一的 Learning Loop。目前 Repository 真實存在的是三條互不相交的路徑：**

1. **Loop 1（Sprint 4，Exam Mode）**：`QuestionBank`（Mock Data）→ `QuestionRuntime` → `AutoGrader` → `WrongBookRuntime` + `ReviewRuntime`/`HistoryRuntime` → `review.html`／`wrongbook.html`。**跨頁完整銜接，但完全不是 AI**——內容 100% 來自 `AHS.Mock.quiz.items`。
2. **Loop 2（Sprint 6→7.0，Practice Mode）**：`materials.html`（Summary→開始 AI 練習）→ `QuestionGuide` → `quiz.html?mode=practice` → `QuestionGenerationFlow`（源自 Sprint-5 頂層 `SummaryRuntime`，非 AI，確定性）→ `LearningQuestionSession` → 答錯 → `WrongBookGenerator` → `WrongBookSession` → `ReviewQueue` → `ReviewModel` → **首頁 `ReviewWidget`**（不是 `review.html`）。這條路徑在精神上最接近 Sprint AI-015 描述的「Material→Summary→Question→Quiz→WrongBook→Review」，但（a）內容並非真正 AI 產生，是確定性規則；（b）終點是首頁 Widget，不是 `review.html` 頁面本身。
3. **Loop 3（Sprint 8.2，materials.html 內部）**：`AITutorService.ensureQuestionSet()` → `QuestionGenerationRuntime`（源自真實 `KnowledgeGraphRuntime`，這是三條路徑中唯一真正從教材真實內容衍生的）→ `MaterialQuestionCard`。**完全封閉在 `materials.html` 一頁之內**，從未離開，不接 Quiz、不接 WrongBook、不接 Review。

**若要回答「AI Question Generator Foundation 應該整合到哪一條」**：Sprint AI-015 原文所稱「已完成的 AI Question Generator Foundation」最貼切對應的是 Loop 3（`QuestionGenerationRuntime`，EO-S8.2.003 標題本身就是「AI Question Generation Runtime」），但 Loop 3 目前與 Quiz Center／WrongBook／Review 完全無關聯——若要接上，勢必要在 Loop 2（或建立新路徑）與 Loop 3 之間搭橋，這正是 Sprint AI-015 執行前已回報的架構衝突（命名混淆、內容來源不一致、`review.html` 真實流程與描述不符）。本次僅盤點，決策留待 PMO。
