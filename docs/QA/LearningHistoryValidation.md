# LearningHistoryValidation.md — Sprint AI-016

Repository Validation for the complete Production pipeline's final two hops (`Review → History → Dashboard`). Analysis only — the validation script that produced these results was run and then deleted (not committed; this Sprint's Scope and Execution Authority explicitly forbid implementation/commit/push).

## Check 1 — Full real Practice Mode + WrongBook + Review activity never writes to `HistoryRuntime`

Real flow exercised: `materials.html` (real generate+bridge) → `quiz.html` (real Runtime-only Practice read) → wrong answer → real `WrongBookSession` entry → real mastery promotion via `WrongBookGenerator.update()` → real `ReviewQueue.enqueue()`.

| Check | Result |
|---|---|
| `HistoryRuntime` starts empty | ✅ PASS |
| Real `WrongBookSession` entry created from a real Practice Mode wrong answer | ✅ PASS |
| `HistoryRuntime` count still 0 after the wrong answer | ✅ PASS |
| `HistoryRuntime` count still 0 after `WrongBookGenerator.update()` (mastery promotion) + `ReviewQueue.enqueue()` | ✅ PASS |
| No code path from WrongBook/Review writes to `HistoryRuntime.record()` (grep finding, re-confirmed empirically) | ✅ PASS |
| Console errors = 0 | ✅ PASS |

6/6 PASS — the `Review → History` edge in this Sprint's Baseline diagram does not exist.

## Check 2 — Exam Mode is confirmed as the sole real writer (control case)

| Check | Result |
|---|---|
| A real Exam session starts, finishes, and grades successfully | ✅ PASS |
| `HistoryRuntime.record()` — Exam Mode's real chain — is confirmed as a working write path (positive control, proving `HistoryRuntime` itself functions correctly for what it was built for) | ✅ PASS |
| Console errors = 0 | ✅ PASS |

3/3 PASS.

## Check 3 — Dashboard shows an unconditional Empty State regardless of real data

Loaded `dashboard.html` carrying the real `WrongBookSession`/`ReviewQueue` data produced in Check 1.

| Check | Result |
|---|---|
| `dashboard.html` does not load `HistoryRuntime.js` at all (`AHS.HistoryRuntime === undefined` in that page's namespace) | ✅ PASS |
| `dashboard.html` does not load `StatisticsRuntime.js` | ✅ PASS |
| `dashboard.html` does not load `WrongBookSession.js` / `ReviewQueue.js` | ✅ PASS |
| Dashboard renders the honest Empty State ("尚無學習數據") | ✅ PASS |
| Zero fabricated statistics rendered (no `.dash-stat` cards) | ✅ PASS |
| Console errors = 0 | ✅ PASS |

6/6 PASS — the `History → Dashboard` edge does not exist either; Dashboard is honest (no fake numbers) but structurally unable to consume any real data, from History or otherwise.

## Check 4 — Learning Center is a real, working (Exam-only) consumer

| Check | Result |
|---|---|
| `learning.html` loads `HistoryRuntime.js` and reads it for real | ✅ PASS |

1/1 PASS.

## Overall

**16/16 real-evidence checks PASS.**

## Repository Validation — the complete pipeline, per hop

```
Material ──✅── Summary ──✅── Question ──✅── Quiz ──✅── WrongBook ──✅── Review ──❌── History ──❌── Dashboard
(AI-015C)      (AI-015C)      (AI-015C)      (AI-015E)    (AI-015F)      (AI-015G,
                                                                          partial — only
                                                                          1 of 4 consumers)
```

- **Material → Summary → Question → Quiz → WrongBook**: validated working end-to-end across Sprints AI-015C/E/F.
- **WrongBook → Review**: validated working for exactly one of four Review consumers (`index.html`'s `ReviewWidget`, Sprint AI-015G).
- **Review → History**: **does not exist.** No code path, confirmed by grep and empirically (Check 1).
- **History → Dashboard**: **does not exist.** `dashboard.html` doesn't even load the relevant scripts, confirmed by grep and empirically (Check 3).

## Conclusion

The pipeline this Sprint's Baseline diagram describes terminates in practice at Review (and only partially, per Sprint AI-015G's findings) — it does not reach History or Dashboard at all. This is Repository Truth, confirmed with real evidence, not an assumption.
