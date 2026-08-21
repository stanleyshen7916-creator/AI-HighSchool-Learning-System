---
name: multi-ai-cross-review
description: Operationalizes the AI Study Council's locked Multi-AI Cross Review process (v1.1) for producing formal, gradeable study-material deliverables — 教材分析、重點整理、題庫／命題、題目詳解、Self-QA、Cross Review、Final Review、錯題整理、補充資料、學習筆記、專案分析報告. Use this skill whenever the user asks for any of those Chinese-language deliverable types, asks to "cross review" or "self-QA" study content across GPT/Gemini/Claude, references SOURCE materials (課本/講義/PDF) that need fact-checking, or wants a Final.md study guide — even if they just say "整理這份教材" or "幫我出題" without naming the process explicitly. This is a hard-gated workflow: every formal deliverable must ship as a standalone .md file (never chat-only output) and pass a Self-QA gate (>=95/100) before Round 1 delivery, and a Final must clear a >=98/100 quality gate with zero HARD FAILs before it can be marked FINAL.
---

# Multi-AI Cross Review (AI Study Council v1.1)

This skill encodes a LOCKED process document the user's project owner (PO) uses to run the
same study-material task past multiple AI platforms (GPT, Gemini, Claude) independently,
then reconcile their outputs against the original source material. It exists because a single
AI's plausible-sounding answer is not good enough for exam-prep content — wrong answers,
fabricated sources, or unsupported claims directly hurt a student's grade. The gates below are
how the process catches that before it reaches a student.

Read `references/templates.md` for the exact header block, file-naming patterns, Final
structure skeleton, and Cross Review table to copy from. Read
`references/quality-gates.md` for the full Self-QA and Final HARD FAIL checklists before
scoring any deliverable — don't rely on memory for those lists.

## The two rules that override everything else

1. **A formal deliverable is not done until it exists as a `.md` file.** Chat output alone,
   "see above," a summary-only version, or "I'll assemble the .md later" do not satisfy this.
   If the user's request matches one of the deliverable types in the description above, your
   job isn't finished until you've written the file (via the Write tool) and can point to its
   path.
2. **When AI outputs disagree, go back to SOURCE — never settle by majority vote.** Two AIs
   agreeing and one disagreeing tells you nothing about who's right. The only tiebreaker is
   re-checking the original source material referenced in the SOURCE field.

## SOURCE priority — resolve every fact against this hierarchy

- **Level 1 (highest)** — the original teaching material itself: 課本、教師講義、原始 PDF、
  原始教材圖片、教師指定補充資料. If Level 1 material was provided or is available, it is the
  final word.
- **Level 2** — official/reliable supplements: 出版社官方資料、教育部／國教署、大考中心、官方
  教學資源. Usable to fill gaps Level 1 doesn't cover, but never to override Level 1.
- **Level 3** — general reference material. Fine as supplementary color, but must never be
  presented as if it came from the textbook itself.
- **Can't confirm a fact against any level?** Mark it `【需確認】` inline. Do not guess, and do
  not silently drop it — an honest gap beats a fabricated answer every time.

## Workflow

The process has up to four stages depending on what the user is asking for right now. Figure
out which stage applies — don't run all four unless the user actually wants the whole pipeline.

### Stage 1 — Round 1 (single-AI first pass)

This is the default stage: the user hands you source material and asks for one of the
deliverable types (analysis, summary, question bank, wrong-book entry, etc.).

1. Work only from the SOURCE the user gave you (or SOURCE they point you to) — do not peek at
   or borrow from another AI's output at this stage, and don't treat this skill's own prior
   runs as ground truth either. Each Round 1 pass stands on its own.
2. Build the content using the structure in `references/templates.md` (student-facing Final
   structure §① wherever a full study-guide shape is asked for; a narrower shape is fine for
   narrower requests like "just give me the question bank").
3. Before delivering, run the **Self-QA gate** — see `references/quality-gates.md`. Score it
   yourself against the HARD FAIL list and the 100-point rubric implied there.
   - **Score ≥ 95** → proceed to write the deliverable file.
   - **Score < 95** → do not deliver. State the FAIL and what's blocking it, fix the specific
     problem, and re-score. Never hand off an unfixed version as if it were Round-1-complete.
4. Write the `.md` file using the naming pattern `Claude_[科目]_[單元]_Round1.md` (substitute
   the actual subject/unit) and the required header block (both in
   `references/templates.md`). Fill in a real Self-QA score, not a placeholder.
5. Tell the user the file's path plainly. Don't just paste its contents into chat as the
   "real" deliverable — the file is the deliverable.

### Stage 2 — Cross Review (the PO has GPT.md / Gemini.md / Claude.md in hand)

The user provides (or asks you to produce, alongside GPT/Gemini outputs they already have)
multiple Round-1 `.md` files for the same unit.

1. Build the comparison table from `references/templates.md` (§Cross Review table) —
   SOURCE MAP, 核心概念, ⭐常考考點, ⚠️易錯點, 🔑必背內容, 題目品質, 答案唯一性, 選項解析,
   出處可追溯性, 補充資料, 歷年大考, 不確定性揭露 — one column per AI, one Final column.
2. Where the AIs disagree, resolve by re-checking SOURCE (per the priority hierarchy above),
   not by picking whichever two agree.
3. Do not simply pick one AI's version as the base draft. Extract what's strong from each,
   discard what fails SOURCE verification, and reintegrate — that reintegration is the actual
   work of this stage, not a formality.
4. Write `[科目]_[單元]_CrossReview.md`.

### Stage 3 — Final

1. Assemble the Final using the full student-facing structure (① through ⑮) in
   `references/templates.md`.
2. Run the **Final Quality Gate** from `references/quality-gates.md`: score against the
   100-point rubric and check every HARD FAIL condition.
   - **Any HARD FAIL present → the Final is FAIL, full stop, regardless of numeric score.**
     A 99/100 with a fabricated source is still FAIL. Say so plainly, list what failed, and
     fix it before re-presenting.
   - Only a score ≥ 98 with zero HARD FAILs may be marked FINAL / PASS.
3. Write `[科目]_[單元]_Final.md` with the header block's 狀態 field set to reflect the actual
   outcome (e.g. `FINAL_PASS`, not an aspirational status).

### Stage 4 — Self-QA / QA-only requests

If the user just asks you to Self-QA or grade an existing `.md` (theirs or another AI's),
apply the relevant gate from `references/quality-gates.md` and report the score plus every
HARD FAIL hit, citing the specific line/claim that triggered each one. This can be a chat-only
response if the user is just asking "does this pass," but if they ask you to produce the
graded/annotated version, that still ships as a `.md`.

## Required header block

Every formal `.md` this skill produces starts with the header block from
`references/templates.md` (§Header Block), filled in with real values — 日期 is today's date,
AI is `Claude`, and Self-QA / Cross Review / Final Score / 狀態 reflect the actual state of
*this* deliverable, not copy-pasted placeholders from the spec.

## A note on scope

This skill is about producing/grading study-material deliverables per the AI Study Council
process — it does not touch this repository's application code (`js/`, `css/`, HTML pages).
If a request also happens to involve editing the AI-HighSchool-Learning-System codebase, treat
that as a separate task governed by the repo's own CLAUDE.md, not by this skill.
