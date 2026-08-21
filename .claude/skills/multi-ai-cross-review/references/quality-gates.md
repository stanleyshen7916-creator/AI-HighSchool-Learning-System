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

Before handing off any formal `.md` (Round 1, Cross Review, or Final), confirm:

- [ ] The `.md` file actually exists on disk (written via a file-write tool, not just printed
      to chat)
- [ ] Content is complete for the requested deliverable type — no "see chat above" gaps
- [ ] Header block is filled with real values (title, AI, 版本, 日期, 科目, 單元, SOURCE,
      執行階段, Self-QA, Cross Review, Final Score, 狀態)
- [ ] SOURCE is stated, and every claim traces to a source tier (Level 1/2/3) or is marked
      `【需確認】`
- [ ] Self-QA score is present and honestly reflects the applicable gate above
- [ ] No fabricated citations, sources, or media references anywhere in the file
- [ ] Nothing from Level 2/3 material is presented as if it were Level 1 (textbook) content
- [ ] Nothing the PO explicitly asked to be included has been trimmed for length
