# DependencyGraph.md — Sprint AI-015A Architecture Audit

Companion to `docs/Architecture/QuestionArchitecture.md`. Pure documentation — no code was modified. All edges below are real `<script>` wiring and real function-call references, verified via `grep`/`Read`, not inferred from file names alone.

## Loop 1 — Exam Mode (Sprint 4, Mock Data, fully wired)

```
AHS.Mock.quiz.items (static Mock Data)
        │
        ▼
QuestionBank.generate(examMeta)
        │
        ▼
QuestionRuntime.getSet(examId)  ◄──────────── QuizCenter.js (Exam Mode UI)
        │
        ▼
ExamRuntime → AnswerRuntime → AutoGrader.grade(examId)
        │                              │
        │                              ▼
        │                     WrongBookRuntime.sync(gradedResult)
        │                              │
        ▼                              ▼
ReviewRuntime.build(examId)     review.html (AppReview.js reads
        │                        WrongBookRuntime.list() + HistoryRuntime.list()
        ▼                        directly — does NOT call ReviewRuntime.build())
review.html (loaded but unused
 per AppReview.js's own comment)

Pages touched: quiz.html (Exam Mode), review.html, wrongbook.html
```

## Loop 2 — Practice Mode (Sprint 6 → 6.9 → 7.0, deterministic/Summary-derived)

```
materials.html: MaterialSummaryCard "開始 AI 練習" link
        │
        ▼
quiz.html?mode=practice&materialId=...
        │
        ▼
QuestionGuide.js (巧巧老師出題引導 — UI only, no generation)
        │  "開始練習" button
        ▼
QuestionGenerationFlow.run(materialId, difficulty)
        │
        ▼
LearningQuestionGenerator.generate()  ◄── reads ONLY AHS.SummaryRuntime
        │                                  (top-level Sprint-5 store —
        │                                   coreConcepts/definitions/
        │                                   pitfalls/memorize)
        ▼
LearningQuestionSession (current list / index / metadata)
        │
        │   (separate, parallel writer — same page, different trigger:)
        │   MaterialCenter.js "upload" → LearningPipeline.buildQuestions()
        │     → QuestionGenerator.generateAIQuestion() [Stub-only content]
        │     → LearningQuestionRuntime.sync()
        │
        ▼
QuizCenter.js buildPracticeListView()
  = LearningQuestionRuntime.list() ⊕ LearningQuestionSession records
  — filtered through isRealLearningQuestion() to hide [Stub]-prefixed items
        │
        ▼  (user answers incorrectly)
QuizCenter.wrongBookHook() → WrongBookGenerator.add({questionId, userAnswer})
  (rejects if answer correct; rejects if no matching LearningQuestionSession record)
        │
        ▼
WrongBookSession (store)
        │
        ▼
ReviewQueue.enqueue()  ◄── validates questionId against a real WrongBookSession entry
        │
        ▼
ReviewModel (read-only query layer over WrongBookSession + ReviewQueue)
        │
        ▼
ReviewWidget.js  →  index.html (HOME PAGE — not review.html)

Pages touched: materials.html (entry point only), quiz.html (Practice Mode),
                wrongbook.html (also loads this lineage's files), index.html (destination)
review.html is NOT part of this loop.
```

## Loop 3 — materials.html AI 練習題 (Sprint 8.2, real content, page-contained)

```
Material (real uploaded text)
        │
        ▼
MaterialTextPipeline.getText(materialId)
        │
        ▼
KnowledgePipeline.process(materialId)   (Analysis → Extraction → Graph)
        │
        ▼
KnowledgeGraphRuntime  ──────────┬──────────────┐
        │                        │              │
        ▼                        ▼              ▼
QuestionGenerationRuntime   (Summary capability, separate — see
  .generateQuestions()       ai-engine/ + KnowledgeSummaryRuntime,
        │                    unrelated to this doc's scope)
        ▼
AITutorService.ensureQuestionSet()
        │
        ▼
MaterialQuestionCard.js  →  "AI 練習題" card inside MaterialPreview.js

Pages touched: materials.html ONLY.
No edge leaves this page. Does not reach quiz.html, WrongBook, or Review at all.
```

## Cross-Loop Isolation (confirmed, not assumed)

```
grep -c "QuestionGenerationRuntime" inside Loop-1/Loop-2 files  → 0
grep -c "QuestionRuntime\b"          inside Loop-2/Loop-3 files → 0
grep -c "LearningQuestionRuntime"    inside Loop-1/Loop-3 files → 0
```

No component in any one loop references a component in either other loop. The only shared surface across all three is `window.AHS` itself (the global namespace every file attaches to) and, incidentally, `wrongbook.html`, which loads both Loop 1's `WrongBookRuntime.js` and Loop 2's `WrongBookGenerator.js`/`WrongBookSession.js`/`ReviewQueue.js` side by side without either lineage calling into the other.

## Review Destination Map

```
review.html        ← Loop 1 only (HistoryRuntime + WrongBookRuntime, direct read)
index.html (home)  ← Loop 2 only (ReviewWidget → ReviewModel → ReviewQueue → WrongBookSession)
materials.html     ← Loop 3's own AITutorRuntime.getReviewList() → ReviewGeneratorRuntime
                      (a FOURTH, independent Review consumer — reads WrongBook + Quiz/Exam
                      Result, but explicitly excludes KnowledgeGraph/Summary/Material by
                      construction; feeds the AI Tutor session panel, not review.html)
```

Four independent "Review" surfaces exist, none of which fully implement the single "WrongBook → Review → History" chain a reader would infer from the file names alone.
