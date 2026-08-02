# HOTFIX-003_Material_Detail_Content_Integration_Report.md

## Summary

Follow-up to HOTFIX-002: with the real Civics material now correctly reaching `MaterialRuntime`
and rendering on Material Center, the PAT found the Detail Modal itself still showed five empty
sections (教材內容/AI 重點整理/AI 練習題/AI Gateway 重點整理/AI Gateway 練習題). Root cause:
each section reads from a **different** existing pipeline — `item.content` (a plain string field
`MaterialRuntime`'s schema has always had, but neither Repository track ever populated),
`AHS.AITutorService`'s on-demand Knowledge-Graph-derived summary/questions (which requires real
`item.content` text to analyze — also empty), and the AI Gateway adapters (correctly idle, since
the Gateway isn't deployed). None of these ever read the real, structured analysis data that
already exists in either Repository record.

## What was built

**New file `js/ui/MaterialDetailRepositorySource.js`** — a read-only resolver, explicitly **not**
touching `js/runtime/TeachingMaterialLoader.js` (this Hotfix's own constraint). Given a real
`MaterialRuntime` id, it reverse-looks-up the original Repository record (reading the same
`PersistenceAdapter`-backed id map `TeachingMaterialLoader.js` already writes, from either
`AHS.MaterialRepository` or `AHS.TeachingMaterialData`) and normalizes it into three shapes the
existing section components already know how to render — `sections` (string array),
`summary` (`AITutorService.getLearningSummary()`'s exact shape), `quiz`
(`AITutorService.getPracticeQuestions()`'s exact shape). Returns `null` for any material not
Repository-sourced (regular uploads keep their existing behavior untouched).

**`js/ui/MaterialContentView.js`** (AI-301/AI-302): added the `content → body → markdown → html →
sections` fallback chain requested, checking the raw `item` object first, then
`MaterialDetailRepositorySource` for `sections`. New `renderSections()` renders each entry as a
plain paragraph. Today, `body`/`markdown`/`html` never populate on any real record (neither
Repository ever captured raw source text) — the chain is there for correctness/future-proofing,
not because those fields exist now; `sections` (Repository-derived) is what actually fixes this
section for the real Civics material.

**`js/ui/MaterialSummaryCard.js`** (AI-303): checks `MaterialDetailRepositorySource.resolve()`
first; if it has real summary content, renders it directly (no "開始 AI 分析" click needed) and
returns early — falls through to the completely unmodified `AITutorService` path for every other
material.

**`js/ui/MaterialQuestionCard.js`** (AI-304): same pattern for quiz data — checked both at initial
render and inside `generate()` itself (so the existing "重新產生題目" button, if clicked, safely
re-renders the same real Repository data instead of falling through to `AITutorService`, which
would find nothing and incorrectly blank the section). Added 題數 (a real, computed count) above
the question list, and 難度/考點 per question when the source record actually has them (the
`AHS.MaterialRepository` track's questions do; this branch's own Package track's `questions.json`
schema has no difficulty field, so it's honestly omitted there, never fabricated).

**`js/ui/AIGatewayPanel.js`** (AI-305/AI-306): added the missing "尚未建立 Gateway
重點整理"/"尚未建立 Gateway 練習題" notice text to the idle state (the button and its real
Gateway-calling behavior were already correct and are untouched — this was purely a missing
string).

**`css/components/qiaoqiao.css`**: two small additions (`.mat-question__meta`,
`.mat-question__count`) reusing the existing muted small-text treatment already used by
`.mat-question__num` — no new Design Token, no layout change.

**`materials.html`**: one new `<script>` tag for `MaterialDetailRepositorySource.js`.

## Judgment calls (flagged, not hidden)

- "教材內容" (`sections`) is synthesized from each Repository's real `coreConcepts`/
  `definitions`/`keyPoints` — a readable restructuring of real facts, not invented content, since
  neither Repository ever captured genuinely separate raw source text. Kept visually distinct
  from "AI 重點整理" (plain paragraphs vs. a bullet/chip card) even though both draw on the same
  underlying real facts — there is no other real data to separate them with.
- `MaterialRepository` track: `coreConcepts`' `{term,definition}` pairs flattened to
  `"term：definition"` strings, matching the exact flattening `TeachingMaterialLoader.js` already
  uses for `SummaryRuntime.coreConcepts` (HOTFIX-002) — reused for consistency, not reinvented.
  A question's `correctAnswer` (a key) is resolved back to its option's real text, since
  `MaterialQuestionCard.js` displays the answer as plain text, not a key.
- Kept the "重新產生題目" button in the Repository-sourced ready state (harmless — `generate()`
  now checks the Repository first and safely re-renders the same real data) rather than adding a
  second UI variant to hide it, since removing it risked more surface area for a Hotfix scoped to
  "content binding," not UI redesign.

## Testing before relying on any of this

Rendered all five Detail Modal sections against the real, permanent Civics material via a direct
jsdom load of `materials.html` (real `<script>` order, real Runtimes): confirmed real content
appears in 教材內容/AI 重點整理/AI 練習題 (including a correct 6-question count, real 難度/考點,
and a correctly key-resolved 正確答案 matching the source's actual option text), and an honest
"尚未建立" + button in both AI Gateway sections. Separately confirmed a **regular** (non-Repository)
upload with real markdown `content` still renders it exactly as before, a regular upload with no
content still shows the honest empty state, and AI 重點整理/AI 練習題 for a regular upload still
show their original idle-button state — all completely unaffected. Added a permanent regression
test group ([25] in `BehaviorSuite.js`, 14 checks) covering both the Repository-sourced and
regular-upload paths.

## What was deliberately NOT done

- `js/runtime/TeachingMaterialLoader.js`, `docs/TeachingMaterials/` Repository schema,
  `data/materials/` Repository schema, `AHS.MaterialRuntime` API, `js/ui/MaterialCard.js` — all
  untouched, per this Hotfix's own explicit constraints.
- No AI Gateway deployment or behavior change — it remains genuinely undeployed; the idle state is
  still honest, just with the requested notice text added.
- No change to non-single_choice question types' Exam-Mode reachability (Sprint v1.6's own
  disclosed limitation) — Detail Modal's AI 練習題 section, unlike `quiz.html`'s Exam Mode, has no
  such restriction (it just lists question records, doesn't need `QuestionCard.js`'s `{key,text}`
  shape), so the Package track's non-`single_choice` questions would already display correctly
  here if any existed — not exercised by the current empty Package Repository, but not blocked
  either.

## QA

`npm run verify` PASS. `npm test` 194/194 PASS (182 prior + 12 new, from 1 new regression-test
group covering both the fix and the regular-upload no-regression path) + `PipelineRegression` 6/6
PASS. Test coverage increased, not decreased.

## Ready state

The live site's Material Detail Modal should now show real content across all five sections for
the Civics material once this PR merges. Awaiting Project Owner's live PAT re-verification.
