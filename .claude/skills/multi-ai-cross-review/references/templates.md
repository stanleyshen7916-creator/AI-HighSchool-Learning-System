# Templates — Multi-AI Cross Review

Copy-paste starting points for every artifact this skill produces. Substitute the bracketed
placeholders; don't leave them literal in a delivered file.

## File naming

| Stage | Pattern | Example |
|---|---|---|
| Round 1 | `[AI]_[科目]_[單元]_Round1.md` | `Claude_BIO_PlantCell_Round1.md` |
| Cross Review | `[科目]_[單元]_CrossReview.md` | `BIO_PlantCell_CrossReview.md` |
| Final | `[科目]_[單元]_Final.md` | `BIO_PlantCell_Final.md` |

`[AI]` is whichever platform produced that Round 1 file (`GPT`, `Gemini`, `Claude`). `[科目]`
and `[單元]` should be short, filesystem-safe tokens (no spaces/slashes) — abbreviate the
subject/unit name the way the PO refers to it, e.g. `BIO`, `CHEM`, `PlantCell`,
`Photosynthesis`.

## Header block (required at the top of every formal `.md`)

```text
# [文件標題]

AI：[GPT｜Gemini｜Claude]
版本：[Round 1｜Cross Review｜Final]
日期：[YYYY-MM-DD]
科目：[科目]
單元：[單元]
SOURCE：[what SOURCE material this is grounded in, e.g. "Project Owner 提供教材" or a specific filename]
執行階段：[Round 1｜Cross Review｜Final]
Self-QA：[score] / 100
Cross Review：[PENDING｜IN_PROGRESS｜COMPLETE｜N/A]
Final Score：[score / 100｜PENDING｜N/A]
狀態：[ROUND_1_PASS｜ROUND_1_FAIL｜CROSS_REVIEW_COMPLETE｜FINAL_PASS｜FINAL_FAIL]
```

Fill every field with the real current value for *this* file. `PENDING`/`N/A` are legitimate
values at Round 1 (Cross Review and Final Score genuinely haven't happened yet) — the failure
mode to avoid is leaving a field that *should* have a real value (like Self-QA) as a
placeholder.

## Student-facing Final structure

Use this shape for a full study guide (Stage 1 when the user wants a complete unit writeup, or
Stage 3 Final). Skip sections that don't apply to a narrower request (e.g. a question-bank-only
ask doesn't need §①–④) rather than padding them out.

```text
① 核心概念
② 重要定義／公式／關鍵字
③ ⭐ 常考與 ⚠️ 易錯題型
④ 需熟記背誦
⑤ 複習建議
⑥ 歷年大考／正式考點
⑦ 補充資料
⑧ 教學資源
⑨ 練習題
⑩ 每題答案
⑪ 每題完整詳解
⑫ 錯題本
⑬ Self-QA
⑭ Cross Review
⑮ Final Score
```

If the PO specifies a different structure for a particular request, their explicit format
wins over this default.

## Cross Review comparison table

```markdown
| 項目 | GPT | Gemini | Claude | Final |
|---|---|---|---|---|
| SOURCE MAP | | | | |
| 核心概念 | | | | |
| ⭐ 常考考點 | | | | |
| ⚠️ 易錯點 | | | | |
| 🔑 必背內容 | | | | |
| 題目品質 | | | | |
| 答案唯一性 | | | | |
| 選項解析 | | | | |
| 出處可追溯性 | | | | |
| 補充資料 | | | | |
| 歷年大考 | | | | |
| 不確定性揭露 | | | | |
```

Fill each AI's column with a short note on what that AI got right/wrong for that row (not just
a checkmark) — the Final column then states the reconciled, SOURCE-verified answer, not a pick
of one AI's cell.
