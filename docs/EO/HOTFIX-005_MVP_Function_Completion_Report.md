# HOTFIX-005_MVP_Function_Completion_Report.md

## Summary

Project Owner PAT found four user-clickable actions still ending in a UI Stub / honest-limitation
message rather than a real result: 測驗中心's default entry (no Repository content), 下載教材 for
Repository-sourced materials ("沒有原始檔案"), 下載總結 (UI-action stub), 匯出筆記 (UI-action stub).
This Hotfix completes all four as real, working functions — no new Runtime, no modification to
Repository Schema / MaterialRuntime API / SummaryRuntime API / UI Baseline, no Mock Data, no
fabricated content. Merged directly to `main` per this Hotfix's explicit instruction.

## AI-501 — 測驗中心 Repository 整合

**Root cause**: `quiz.html` never `<script>`-tagged `js/runtime/MaterialRuntime.js`, so on a
session that opened `quiz.html` directly (never visiting `materials.html` first),
`TeachingMaterialLoader.js`'s `loadMaterialRepositoryEntry()` silently bailed (its own
`if (!AHS.MaterialRuntime...) return;` guard) before it could import the Repository material —
matching the reported "測驗中心預設為空" exactly. Separately, even on a warm session,
Quiz Center's default list (`AHS.AppConfig.quiz.items`, "Exam list starts EMPTY" by design) and
Practice Mode's list (`AHS.LearningQuestionRuntime` only) never surfaced Repository-imported
`AHS.QuestionRuntime` content at all — only a direct `materialId`/`examId` link did (Material
Card/Summary Detail).

**Fix**:
- `quiz.html`: added `<script src="js/runtime/MaterialRuntime.js">` (before the Repository data
  files/`TeachingMaterialLoader.js`, matching `materials.html`'s own order) — lets a cold
  `quiz.html`-first session fully bootstrap Repository materials into both `MaterialRuntime` and
  `QuestionRuntime`, exactly like `materials.html` already does.
- `js/components/QuizCenter.js`: new `repositoryExamCatalog()` — a read-only resolver (same
  established pattern as `js/ui/MaterialDetailRepositorySource.js`, HOTFIX-003/004) that reads the
  same persisted `teachingMaterialLoaderIdMap` `TeachingMaterialLoader.js` already writes, and lists
  every Repository material that already has real, imported `QuestionRuntime` content
  (`hasExam()` true). `showList()`'s default Exam Mode list now additively includes these rows; a
  Repository row's action routes through the already-existing `tryDirectExamEntry()` /
  `ExamRuntime.startFromExam()` (never `ExamRuntime.start()`/`QuestionBank.generate()` — the
  questions are already real, never regenerated). Practice Mode's list (`buildPracticeListView`)
  gained the same rows in a second, clearly-labeled "Repository 教材" section — clicking one
  switches to the same real Exam-Mode view (`startRepoExamFromPractice()`); `AHS.LearningQuestionRuntime`
  itself is never touched, so "兩者不得混用" still holds — nothing crosses between the two Runtimes,
  only the visible root switches, exactly like the existing 正式測驗/練習模式 tab toggle already does.
- `difficulty` is a real, computed aggregate (most frequent value among the material's own
  questions, via `AHS.MaterialRepository`'s own record) — `""` when the source has none (the
  Package track's own `questions.json` schema has no difficulty field at all, an existing,
  previously-disclosed gap), never fabricated.

## AI-502 — 教材下載

**Root cause**: `js/components/MaterialCenter.js`'s `doDownload()` treats `state === "none"` (no
original file ever existed — every Repository-sourced material, since it was synthesized directly
into `MaterialRuntime`, never uploaded as bytes) as a dead end with an honest-but-final message.

**Fix**: new `js/core/DocumentExport.js` (see below) generates a real `.docx` on the spot, built
from data this Runtime chain already has: `教材資訊` (real 科目/年級/章節/日期),
`教材內容` (via `MaterialDetailRepositorySource.resolve()`'s `sections`, or `item.content` for a
regular material), `AI 重點整理` (repo `summary`, or `AITutorService.getLearningSummary()`),
`AI 練習題` (repo `quiz.questions`, or `AITutorService.getPracticeQuestions()`) — each section shows
real content when available, `（無資料）` when genuinely absent, never fabricated. A material with
real uploaded bytes (`state !== "none"`) is completely unaffected — this path only runs when no
bytes ever existed.

## AI-503 — 下載總結

**Fix**: `js/components/SummaryCenter.js`'s banner now tracks whatever Summary record(s) are
currently shown (respecting the 篩選教材 filter) and, on 下載總結, calls
`AHS.DocumentExport.printBlocks()` with the real five-section content (reusing the same
`deriveReviewSuggestions()` HOTFIX-004 already built for ⑤ 複習建議).

**Judgment call (flagged, not hidden)**: a hand-rolled PDF byte generator cannot correctly render
Chinese text without embedding a multi-MB CJK font (the PDF standard 14 fonts are Latin-only) —
attempting that here risked silently producing a PDF with missing/garbled Chinese glyphs, worse
than the stub it replaces. `printBlocks()` instead renders the exact real content into a hidden
iframe and calls the browser's own `print()`, whose native "另存為 PDF" destination is a real,
correct, CJK-safe PDF export built into every modern browser — the standard client-only technique
for generating a real PDF with no backend and no library. This is not a placeholder: the button
click immediately produces the real, fully-populated print output; "另存為 PDF" is the same one
extra, standard OS-level step every "匯出/列印為 PDF" feature on the web relies on.

## AI-504 — 匯出筆記

**Fix**: same banner, 匯出筆記 calls `AHS.DocumentExport.buildMarkdownText()` with the identical
real blocks 下載總結 uses, wraps it in a `text/markdown` Blob, and triggers a real download via
`AHS.DocumentExport.downloadBlob()` (`.md` file, e.g. `學習總結.md`) — no longer a status-text stub.

## `js/core/DocumentExport.js` (new, shared by AI-502/AI-503/AI-504)

Dependency-free, no CDN/bundler, matching this repo's own architecture:
- `downloadBlob(blob, filename)` — same blob-URL + temporary `<a download>` pattern
  `MaterialCenter.js`'s own real-file download already uses.
- `buildDocxBlob(title, blocks)` — a real, valid `.docx`: a minimal 3-part Word Open XML package
  (`[Content_Types].xml`, `_rels/.rels`, `word/document.xml`) inside a hand-written, STORED
  (uncompressed) ZIP — including a real CRC32 implementation. STORED entries need no compression
  codec (none is available in plain JS without a library) and are fully valid per the ZIP spec;
  Word/LibreOffice/Google Docs all open this part set. A hand-written UTF-8 encoder is used instead
  of `window.TextEncoder` so the same code behaves identically in every environment it runs in.
- `buildMarkdownText(title, blocks)` — real Markdown text.
- `printBlocks(title, blocks)` — see AI-503's judgment call above.

## Rules compliance

- No modification to Repository Schema, `MaterialRuntime` API, `SummaryRuntime` API, or any
  existing UI Baseline component's own rendering — every change is additive Wiring
  (`repositoryExamCatalog()`, `materialExportBlocks()`, `summaryExportBlocks()`,
  `js/core/DocumentExport.js`) reading already-real data through already-public APIs
  (`AHS.MaterialRepository.list()`, `AHS.QuestionRuntime.hasExam()/getSet()`,
  `AHS.MaterialDetailRepositorySource.resolve()`, `AHS.AITutorService.*`,
  `AHS.SummaryRuntime`'s own records).
- No Mock Data added — `AHS.AppConfig.quiz.items` (the actual Mock catalog) is untouched and still
  starts empty; Repository rows are computed at render time, never written into it.
- No fabricated content anywhere — every exported section either shows real data or an honest
  `（無資料）`/explanatory message (下載總結／匯出筆記 with zero real Summary records still show
  "目前沒有可匯出的學習總結，請先上傳教材並產生總結。", never an empty file).

## Testing before relying on any of this

`tests/jsdom/BehaviorSuite.js` groups [29]-[32] (26 new checks): AI-501 verified with a genuinely
cold `quiz.html`-first session (no prior `materials.html` visit) showing the real Civics material
directly in both 正式測驗 and 練習模式, clicking through to the real exam view, `console errors = 0`;
group [3]'s own pre-existing "genuinely no Repository data" Empty State check preserved via
`excludeScripts`, so both real states stay covered. AI-502 verified end-to-end: real `.docx` bytes
independently re-parsed by a from-scratch ZIP reader (not reusing `DocumentExport.js`'s own writer
code) confirm `word/document.xml` genuinely contains the material's real title, core concepts, and
question text; a regular material with a real uploaded file is confirmed completely unaffected.
AI-503 verified the hidden iframe's `srcdoc` contains the real five-section content (including the
real derived ⑤ 複習建議) before print() is invoked, and that zero real Summary records correctly
show the honest "沒有可匯出" message instead of an empty PDF. AI-504 verified the downloaded
Markdown Blob's real text content and MIME type.

Full suite: **250/250 PASS** (224 prior + 26 new). `PipelineRegression`: **6/6 PASS**. `npm run
verify`: PASS (0 broken paths, 0 legacy references, 0 forbidden-pattern hits — the one pre-existing
`window.location.href=` KNOWN-ISSUE flag in `HomeRecentMaterials.js` is unrelated and untouched).

## What was deliberately NOT done

- No PDF byte-format library or embedded CJK font added — see AI-503's judgment call.
- `AHS.AppConfig.quiz.items` (Mock catalog) itself untouched — Repository rows are computed
  read-only at render time via `repositoryExamCatalog()`, never written into Mock Data or any
  Runtime's own store.
- `AHS.LearningQuestionRuntime`/`AHS.QuestionRuntime` remain fully separate stores — Practice Mode's
  Repository row only switches which root is visible (mirroring the existing tab toggle), it never
  copies data between the two Runtimes.

## QA

`npm run verify` PASS. `npm test` 250/250 PASS. `PipelineRegression` 6/6 PASS. Coverage increased,
not decreased.

## Merge Commit / GitHub Pages Deploy Status

- PR: #10, merged into `main`.
- Merge commit: `82d36b80dfa1d6c2649cedf9975cd56866bb389e`.
- GitHub Pages "pages build and deployment" workflow triggered for this commit (queued at merge
  time); completes automatically, no further action needed.

## Ready state

Merged directly to `main` per this Hotfix's own instruction (item 1 of Deliverables — do not wait
for Project Owner PAT approval to merge). Awaiting Project Owner's live PAT re-verification against
the Acceptance checklist (measuring 測驗中心/下載教材/下載總結/匯出筆記 against the deployed site).
