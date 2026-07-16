Work Order
S4 / WB-HOTFIX-003 — Complete All Wrong Book Interactions, Fix Runtime Behaviors

Status
PASS

Modified Files
- js/components/WrongBook.js
- css/pages/wrongbook.css

Unmodified this Work Order (confirmed by checksum): js/runtime/WrongBookRuntime.js, js/pages/app-wrongbook.js, wrongbook.html, js/data/mock-data.js (last touched in WB-HOTFIX-002, untouched here).

---

WB-001 More Menu — PASS (no change needed, re-verified)

WB-002 Knowledge Filter — PASS (no change needed, re-verified, composes with the new pagination too)

WB-003 標記知識點 → renamed 加入重點整理 — PASS
No longer a bare local toggle. Now adds/removes the current question's Knowledge Point from a session-scoped Review Center collection (a plain object used as a Set — see WS-004). "Same Knowledge Point cannot be duplicated" is guaranteed structurally: Set membership has no concept of duplicates, and re-selecting a different question that shares a Knowledge Point already in the collection correctly shows "已加入重點整理". No Runtime field exists for this; session-scoped for the same reason as WS-001 (Runtime change and localStorage both forbidden).

WB-004 重新練習 → renamed 立即重做 — PASS
Behavior unchanged from prior Work Order (single question, inline re-answer, no Review Session/Result screen) — only the label changed.

WB-005 加入最愛 — PASS (no change needed, re-verified)

WB-006 查看詳情 — PASS (no change needed, re-verified) — view only, confirmed no review UI of any kind appears.

WB-007 開始複習 — PASS (real behavior change per WS-003)
Previously (WB-HOTFIX-002) this launched the same inline flow as 立即重做. This Work Order explicitly requires it to be different: it now creates a Review SESSION — even for a single question — with a progress indicator ("複習進度：1 / 1") and ends in a Review Result screen (Total/Correct/Wrong/Accuracy/Newly Mastered), then returns to the normal view. Implemented by generalizing the batch-review machinery (startReviewSession(queue)) to accept any queue, including a single-item one.

WB-008 重新練習 (Header) → renamed 全部重新複習 — PASS
Same batch-review-over-the-filtered-list behavior as before, now sharing the same startReviewSession() function as WB-007 (queue = getVisibleItems() by default) — only the label changed, and the implementation is now unified rather than duplicated.

WB-009 我的最愛 — PASS (no change needed, re-verified)

WB-010 錯題匯出 — PASS (no change needed, re-verified)

WB-011 CSV UTF-8 BOM — PASS (no change needed, re-verified)

WB-012 Difficulty — PASS (no change needed, re-verified)

WB-013 Pagination — PASS (newly implemented — was static Mock chrome before)
Previous Sprint versions rendered a static, non-functional "1 2 3 4 5 … N" pager. Rebuilt as a real, live-updatable control: Previous/Next/page-number all work, recomputed every time the filter/search/sort/favorite predicate changes, always reflecting the true count of matching items (not the full unfiltered Runtime list). Verified: filter/search/sort state is preserved across Previous/Next navigation (page navigation never touches those variables — only the filter/search/sort HANDLERS reset the page back to 1, which is standard UX and distinct from "losing" that state). Detail Panel selection is preserved correctly across pagination: paging to a different page does NOT change what's shown in the Detail Panel, since the selected item still matches the active filter (only truly being filtered OUT, not merely being on a different page, triggers a fallback to the first match).

Incidental fix: found and fixed a latent CSS class collision while rebuilding this — the individual page-number buttons and the outer page wrapper (built in create()) both used the literal class ".wb-page". Renamed the pagination-specific classes to ".wb-pagination__btn" / ".wb-pagination__nav" to eliminate the ambiguity (properties like flex-direction/gap from the unrelated page-wrapper rule were inadvertently also applying to pagination buttons, though with no visible effect given the specific properties involved — still worth fixing given this Work Order's "fix all Runtime behaviors" framing).

---

WS-001 Mastered Rule — PASS (no change needed, re-verified) — still session-scoped, same flag as before.

WS-002 Cascade Filter — PASS (no change needed, re-verified) — Subject → Knowledge Point cascade still works, now also correctly interacts with pagination (changing Subject resets to page 1, as it should).

WS-003 Review Flow — PASS (this Work Order's core distinguishing requirement)
Verified all four functions are behaviorally distinct with no duplicated functionality:
- 查看詳情 → View Detail only, no review UI at all.
- 立即重做 → Single Question Review, inline, no session wrapper, no Result screen.
- 開始複習 → Creates a Single Question Review SESSION (progress + Result screen), even though the queue has exactly one item.
- 全部重新複習 → Creates a Review Session using the current filtered Question List (multi-item queue).
查看詳情/立即重做/開始複習/全部重新複習 no longer share any code path that conflates "inline redo" with "session with a result screen" — 開始複習 and 全部重新複習 now share one function (startReviewSession), differing only in queue size, while 立即重做 remains entirely separate (renderDetail's own startReview()).

WS-004 Review Center — PASS (newly implemented)
加入重點整理 → adds to a Review Center collection (a small card panel, hidden until non-empty, shown between the Summary Card and the main list) → shows a Knowledge Summary as a list of chips → available for future reference. "One Knowledge Point only once" guaranteed by Set semantics. Session-scoped (see WB-003 note — no Runtime field, no localStorage permitted).

WS-005 Empty State — PASS (no change needed, re-verified)
Confirmed the shared .wb-list__no-match component now also correctly covers Pagination (an out-of-range/empty page after a filter change resets to page 1, and if the filtered set itself is empty, the same unified Empty State shows, not a separate "no page" state).

---

Developer QA
- More Menu: PASS
- Search: PASS
- Subject Filter: PASS
- Cascade Filter: PASS
- Difficulty Filter: PASS
- Status Filter: PASS
- Sort: PASS
- Pagination: PASS (WB-013, newly functional)
- Summary: PASS
- Favorite: PASS
- Detail: PASS
- Review: PASS (立即重做, single-question inline)
- Review Session: PASS (開始複習, 全部重新複習 — both via startReviewSession)
- Review Result: PASS
- Mastered: PASS (session-scoped)
- Review Center: PASS (WS-004, newly implemented, session-scoped)
- CSV Export: PASS
- JSON Export: PASS
- UTF-8 BOM: PASS
- Empty State: PASS
- Responsive: PASS (existing breakpoints cover the new pagination/Review Center elements; no overflow introduced)
- Console Error = 0: PASS (jsdom, 165/165 assertions across all suites, 0 errors)
- Console Warning = 0: PASS

Regression QA
- Wrong Book only: confirmed. Only js/components/WrongBook.js and css/pages/wrongbook.css modified this Work Order.
- No impact to Home / Material Center / Quiz Center: confirmed — no files belonging to those modules were touched, and js/runtime/WrongBookRuntime.js / js/pages/app-wrongbook.js / wrongbook.html / js/data/mock-data.js are all byte-identical to the prior delivery (confirmed by checksum).
- Full prior regression suite (W001–W004B, HOTFIX-002/003, WB-HOTFIX-001/002 — 139 assertions) re-run and passing, with one intentionally-updated assertion (WB-007's test now checks for the Review Session wrapper instead of just the shared inline-interaction markup, since this Work Order explicitly changed that button's behavior — documented above, not silent).

Known Issues
- WS-001 (Mastered Rule) and WS-004 (Review Center) are both session-scoped, in-memory state by structural necessity (no Runtime schema change or localStorage permitted) — same flag carried forward from the prior Work Order.
- WB-012's Difficulty remains a derived heuristic from errorCount, not an authored property.
- 今日待複習 (Summary Card) remains fixed at 0 — no due-date/spaced-repetition concept has been defined by any Work Order to date.
