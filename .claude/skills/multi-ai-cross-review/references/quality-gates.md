# Quality Gates — Self-QA and Final

Two gates, same spirit: a plausible-looking answer is worthless if it's wrong, and a wrong
answer in exam-prep content costs a real student real points. Score honestly — the point of a
gate is to catch problems before they reach the PO or the student, not to wave content through.

## Self-QA gate (Round 1, pass threshold ≥ 95/100)

Run this before delivering any Round 1 `.md`. Any one of the following is a HARD FAIL — a hit
on any single item fails the gate regardless of how strong everything else is:

- 知識錯誤 (a factual/conceptual error)
- 答案錯誤 (a wrong answer)
- 雙答案／答案不唯一 (the question has two valid answers, or the intended one is ambiguous)
- SOURCE 無法支持答案 (the answer isn't actually backed by the SOURCE material)
- 答案與詳解矛盾 (the stated answer contradicts its own explanation)
- 選項解析與答案矛盾 (an option's rationale contradicts the marked answer)
- 捏造來源 (a fabricated citation/source)
- 捏造影片 (a fabricated video/media reference)
- 將 Level 2／3 資訊誤標為教材內容 (presenting supplementary-tier info as if it were textbook
  content)

If you hit any of these: don't deliver. State `FAIL` explicitly, name the specific blocking
issue (quote the offending line/claim), fix it, and re-run the check. Never pass an unfixed
version through to Cross Review or to the user as if it cleared the gate — a downstream AI or
the PO shouldn't have to catch what Self-QA was supposed to catch.

Score the remaining 100-point rubric on completeness and quality relative to the deliverable
type requested (coverage of the SOURCE material, clarity, whether ⭐/⚠️/🔑 markers are used
where they add real signal, whether uncertain claims are flagged `【需確認】` rather than
guessed). ≥95 with zero HARD FAILs is a pass.

## Final Quality Gate (Stage 3, pass threshold ≥ 98/100)

Same HARD FAIL discipline, higher bar, and a wider list because a Final has already been
through Cross Review and is expected to be authoritative:

- 明顯知識錯誤 (a clear factual/conceptual error)
- 答案錯誤 (a wrong answer)
- 雙答案 (dual/ambiguous answers)
- SOURCE 無法支持 (unsupported by SOURCE)
- 捏造資料 (fabricated data/facts)
- 詳解與答案矛盾 (explanation contradicts the answer)
- 出處虛構 (a fictitious citation)
- 將推測當成教材事實 (presenting a guess/inference as if it were a stated fact from the
  material)

**Any HARD FAIL present means the Final is FAIL, even if the numeric score is ≥ 98.** A high
score does not offset a HARD FAIL — they're independent checks, and the HARD FAIL always wins.
Report the outcome as `FINAL_PASS` only when both conditions hold: score ≥ 98 AND zero HARD
FAILs. Otherwise report `FINAL_FAIL` with the specific triggering issue(s) named, so the next
revision has something concrete to fix.

## Pre-delivery checklist

Before handing off any formal `.md` (Round 1, Cross Review, or Final), confirm every item below
— this is the full v1.1 §11 list, kept as separate checks rather than merged, so nothing gets
silently skipped:

- [ ] The `.md` file actually exists on disk (written via a file-write tool, not just printed
      to chat) — `.md` 檔案確實建立
- [ ] Content is complete for the requested deliverable type — no "see chat above" gaps —
      內容完整
- [ ] The `.md` matches the actual work performed — not a summary, reinterpretation, or
      abridged stand-in for it — 與正式成果一致
- [ ] The `# [文件標題]` title is correct and specific to this deliverable — 標題正確
- [ ] The header's `AI：` field correctly identifies the producing AI (`Claude`, unless
      assembling on behalf of another platform's supplied output) — AI 身份正確
- [ ] The header's `版本：` field correctly reflects the stage (`Round 1` / `Cross Review` /
      `Final`) — 版本正確
- [ ] SOURCE is stated, and every claim traces to a source tier (Level 1/2/3) — SOURCE 有標示
- [ ] Self-QA score is present and honestly reflects the applicable gate above — Self-QA 有標示
- [ ] The header's `Cross Review：` field is set to a real, current value (`PENDING` /
      `IN_PROGRESS` / `COMPLETE` / `N/A`), not left stale from a template — Cross Review 狀態有標示
- [ ] The header's `Final Score：` field is set to a real, current value (score, `PENDING`, or
      `N/A`) — Final Score 有標示
- [ ] Every claim that can't be confirmed against SOURCE is explicitly marked `【需確認】` inline
      — 不確定內容有標示
- [ ] No fabricated citations, sources, or media references anywhere in the file — 沒有捏造來源
- [ ] Nothing from Level 2/3 material is presented as if it were Level 1 (textbook) content
- [ ] Nothing the PO explicitly asked to be included has been trimmed or omitted for length —
      沒有遺漏 Project Owner 指定內容
