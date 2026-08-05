/* js/ui/TutorContextTip.js — Platform Refactor Master · Platform
   Integration (PAT 8/9/10): a single, compact, read-only widget so
   教材中心/學習總結/測驗中心/知識弱點/複習中心 (not just 首頁/AI Tutor)
   reference the exact same real Tutor Context, instead of each page
   deciding independently (or not referencing it at all).

   No new Runtime, no new data source: reads only the already-existing,
   already-LOCKed AHS.StatisticsRuntime.learningContext() ->
   AHS.TutorMessage.build() pipeline built in Sprint AI-111 for 首頁's
   AiTutorHomeCard and tutor.html's real chat message. This widget does
   not duplicate that logic, it reuses it verbatim — "不得建立第二份
   統計" holds. Self-contained (reads the Runtime directly) so every
   page that mounts it needs zero extra per-page model-building code,
   only the same <script> tags 首頁/tutor.html already carry.

   Deliberately NOT a second AiTutorHomeCard: no quick-action tiles, no
   speech bubble, no character illustration — those are 首頁's own
   dedicated card design (Product Baseline). This is a compact banner
   that links to tutor.html for the full experience, so "AI Tutor 不再
   只存在於 tutor.html" is satisfied without inventing five different
   interaction patterns.

   create() returns null (mounts nothing) when there is genuinely no
   real data yet — never a placeholder/empty-state box added to a page
   that never had one before. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.TutorContextTip = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  /* create(pageContext) — pageContext (Sprint AI-113 AI-808, optional):
     { page, materialId, examId } real signals about the page mounting
     this tip, forwarded verbatim to AHS.TutorMessage.build() (see that
     file's own header for exactly how a real materialId changes the
     message). Omit it and this behaves exactly as before. */
  function create(pageContext) {
    if (!el) { return null; }
    /* Sprint AI-113 AI-804: same Settings > Learning toggle AppHome.js's
       AiTutorHomeCard respects — one real preference, one real effect,
       everywhere it applies. */
    if (AHS.SettingsRuntime && typeof AHS.SettingsRuntime.get === "function" &&
        AHS.SettingsRuntime.get().showTutorSuggestions === false) { return null; }
    if (!AHS.StatisticsRuntime || typeof AHS.StatisticsRuntime.learningContext !== "function") { return null; }
    if (!AHS.TutorMessage || typeof AHS.TutorMessage.build !== "function") { return null; }

    var model = AHS.TutorMessage.build(AHS.StatisticsRuntime.learningContext(), pageContext);
    if (!model || !model.message) { return null; }

    return el("a", {
      class: "tutor-tip", href: "tutor.html",
      "aria-label": "AI 巧巧老師建議：" + model.message + "，前往 AI Tutor 查看更多"
    }, [
      el("span", { class: "tutor-tip__icon", html: AHS.Icons.tutor() }),
      el("span", { class: "tutor-tip__body" }, [
        el("span", { class: "tutor-tip__label", text: "AI 巧巧老師建議" }),
        el("span", { class: "tutor-tip__msg", text: model.message })
      ]),
      el("span", { class: "tutor-tip__more", text: "查看更多 ›" })
    ]);
  }

  return { create: create };
})();
