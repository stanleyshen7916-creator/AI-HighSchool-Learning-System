# DataFlow.md — Sprint AI-104A｜Repository Baseline Synchronization

The real, current, verified data flow — not the simplified diagram any individual Sprint has
sketched. Consolidates `docs/Architecture/ProductionIntegrationBlueprint.md` (Sprint AI-017, still
accurate) with everything added since (AI-018 through AI-103).

## Core Production Pipeline (materials.html-centric, real, LOCK)

```
Material Upload (MaterialRuntime.add)
  │
  ▼
DocumentClassifierRuntime.classify()  →  material | handout | exam | answer_key | note | other
  │
  ▼
MaterialTextProvider → MaterialTextPipeline → ParserAdapterRegistry → AnalysisRuntime
  │
  ▼
KnowledgeExtractionRuntime
  │
  ▼
KnowledgeGraphRuntime  ◄── the ONE shared graph, Single Source of Truth for every real AI feature
  │                            (multiple uploaded files about the same subject/chapter merge into it)
  ├──────────────────────────────┬─────────────────────────────┐
  ▼                               ▼                              ▼
KnowledgeSummaryRuntime      QuestionGenerationRuntime      AnswerBuilderRuntime
(real Summary, rule-based)   (real Questions, 4 real          (explanation chain,
  │                           options, no invented              Foundation-scope)
  │                           distractors)
  │                               │
  ▼                               ▼
AITutorService                QuestionProviderBridge (shape-mapping bridge)
(ensureLearningSummary/           │
 ensureQuestionSet)                ▼
  │                           LearningQuestionSession / LearningQuestionRuntime
  ▼                               │
MaterialSummaryCard.js             ▼
(materials.html UI)            QuizCenter.js Practice Mode (quiz.html)
                                    │
                                    ▼ (wrong answer)
                                WrongBookGenerator → WrongBookSession
                                    │
                                    ▼
                                ReviewGeneratorRuntime (Sprint AI-018, Knowledge-Graph-traceable)
                                    │                        │
                                    ▼                        ▼
                                ReviewQueue/ReviewModel   LearningHistoryModel (Sprint AI-019, Projection)
                                (review.html)                  │
                                                                ▼
                                                            Dashboard (StatisticsRuntime + LearningHistoryModel, Sprint AI-020)
```

## Exam Mode (quiz.html, parallel, independent, Sprint 4 lineage — NOT the same chain)

```
QuestionBank.generate(examMeta)  (reads AHS.Mock.quiz.items — the one path still Mock-driven by design)
  │
  ▼
QuestionRuntime.loadForExam()  ──── (Sprint AI-103 also writes here via importQuestions(), additive)
  │
  ▼
ExamRuntime (session state machine) + AnswerRuntime (student answers)
  │
  ▼
AutoGrader.grade()  →  cached graded result per examId
  │
  ├──────────────┬───────────────┐
  ▼               ▼                ▼
ReviewRuntime  WrongBookRuntime  HistoryRuntime
(view-model)   .sync()            .record()
                                    │
                                    ▼
                                StatisticsRuntime.refresh()  →  Dashboard's Exam-side stat cards
```

**Important, previously under-documented reality**: Exam Mode and Practice Mode are two fully
parallel, non-converging chains that happen to both feed Dashboard, through *different* Runtimes
(`HistoryRuntime`/`StatisticsRuntime` for Exam; `WrongBookSession`/`LearningHistoryModel` for
Practice). Neither `QuestionRuntime` nor `WrongBookRuntime` (both Exam Mode, Sprint 4) is read by
Dashboard directly — this caused a real, disclosed limitation in Sprint AI-103 (imported Quiz/
ErrorBook content, written via `QuestionRuntime`/`WrongBookRuntime`, does not appear on Dashboard).

## AI Engine Layer (ai-engine/, parallel infrastructure, partially live)

```
materials.html loads a dependency-traced ai-engine subset (EO-AI-012A, extended AI-101/AI-100/AI-101C)
  │
  ▼
SummaryProvider (mode: legacy | new | compare, default 'new' since Sprint AI-013)
  │
  ├── legacy → KnowledgeSummaryRuntime (the real production path above, read-only)
  └── new    → SummaryService → SummaryPipeline → SummaryEngine → SummaryRuntime (ai-engine, 12-field model)
                                                                        │
QuestionProvider (mode: legacy | new, default 'legacy' — New has no real content yet)         (LIVE default since AI-013)
  │
  ├── legacy → QuestionGenerationRuntime (the real production path above, read-only)
  └── new    → QuestionService → QuestionPipeline → QuestionEngine → QuestionRuntime (ai-engine, honest empty questions[] stub)

AIGateway (Sprint AI-100) — provider-independent, isConfigured()=false unless a real endpoint is set
  │
  └── HttpApiClient (Sprint AI-101C, real fetch()) → AI-HighSchool-AI-Gateway (separate repo)
        │                                                  │
        ▼                                                  ▼
  GatewayIntegration.js (owns the one AIGateway     Cloudflare Worker (code complete, NOT deployed —
  instance; AppConfig.aiGateway.endpoint empty       see docs/QA/Sprint_AI_102_ProductionValidationReport.md)
  by default → zero network calls by default)              │
        │                                                   ▼
        ▼                                            OpenAI Responses API (never called — no live deploy)
  SummaryAdapter/QuestionAdapter.generateViaGateway()
        │
        ▼
  AIGatewayPanel.js (materials.html, additive UI — loading/ready/error states)
```

## Import Runtime (Sprint AI-103, built, not yet wired to any UI)

```
Import Files (Material.md/Summary.json/Quiz.json/Answer.json/Metadata.json/ErrorBook.json)
  │
  ▼
ImportValidator → MetadataParser/ContentLoader → ImportRuntime (Coordinator, no store)
  │
  ├── MaterialRuntime.add()            (existing API)
  ├── SummaryRuntime.add()              (existing API, js/runtime/ 5-section schema)
  ├── QuestionRuntime.importQuestions()  (Sprint AI-103's one Runtime Extension)
  └── WrongBookRuntime.sync()             (existing API, reshaped input)
```

Not yet reachable from any page — no UI trigger exists (deliberately deferred, matching the
AI-100→AI-101C "Runtime first, UI later" precedent).

## Summary of Real vs. Assumed Edges (superseding AI-017's table where it has changed)

| Assumed edge (seen in various Sprint drafts) | Real edge |
|---|---|
| "Material Runtime → Summary Runtime → Question Runtime → Quiz → WrongBook → Review → Dashboard" as ONE linear chain | Two parallel chains (Exam Mode / Practice Mode) that never cross, converging only at Dashboard through different Runtimes each |
| "WrongBookRuntime feeds Dashboard" | `WrongBookSession` feeds Dashboard; `WrongBookRuntime` (Sprint 4) does not |
| "QuestionRuntime feeds Dashboard" | Neither Exam-Mode `QuestionRuntime` nor Practice-Mode `LearningQuestionRuntime` feeds Dashboard directly — Dashboard reads `StatisticsRuntime`(from `HistoryRuntime`) and `LearningHistoryModel`(from `WrongBookSession`+`ReviewQueue`) |
| "ai-engine is unwired scaffolding" | Live and default since Sprint AI-013 (Summary) — real users see `ai-engine`-produced Summary content today via `SummaryProvider` mode `'new'` |
