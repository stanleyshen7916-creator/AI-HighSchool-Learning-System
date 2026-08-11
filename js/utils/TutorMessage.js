/* js/utils/TutorMessage.js — Sprint AI-111 · AI-611/AI-612.

   Stateless text builder shared by 首頁's AiTutorHomeCard model and
   AI Tutor's (tutor.html) real chat message — both need the exact same
   real-data-derived recommendation, and this is the one place that turns
   AHS.StatisticsRuntime.learningContext()'s real numbers/lists into
   Chinese sentences, so the two pages can never drift into two different
   texts for the same underlying data ("不得建立第二份統計"). Pure
   function, no Runtime, no store, no persistence — matches js/utils/'s
   own "small stateless helpers" role.

   build(context) -> { message, actions } | null. Returns null when
   context has genuinely nothing real yet — callers must render their own
   existing Empty State (never invent filler text; "不得使用 Mock，不得
   固定文字" — every returned sentence embeds real numbers/names that
   change with the actual data, never a canned string). */
window.AHS = window.AHS || {};
AHS.TutorMessage = (function () {
  "use strict";

  function subjectName(key) {
    return (AHS.Subjects && AHS.Subjects[key]) ? AHS.Subjects[key].name : (key || "");
  }

  /* build(context) — context: AHS.StatisticsRuntime.learningContext()'s
     own return shape. Builds each sentence only when its real data is
     present; omits it otherwise (never a placeholder for a missing
     signal). */
  function build(context) {
    context = context || {};
    var sentences = [];
    var actions = [];

    if (context.weakestSubject) {
      sentences.push(
        "你在「" + subjectName(context.weakestSubject.subject) + "」的平均正確率是 " +
        context.weakestSubject.percent + "%，是目前較弱的科目。"
      );
      actions.push({ icon: "quiz", label: "加強練習", desc: subjectName(context.weakestSubject.subject) });
    }

    if (context.recommendedChapters && context.recommendedChapters.length) {
      var top = context.recommendedChapters[0];
      sentences.push(
        "「" + top.chapter + "」還有 " + top.count + " 題尚未精熟，建議優先複習這個章節。"
      );
    }

    if (context.dueForReview && context.dueForReview.length) {
      sentences.push("錯題本中有 " + context.dueForReview.length + " 題尚待複習到精熟。");
      actions.push({ icon: "wrong", label: "前往錯題本", desc: context.dueForReview.length + " 題待複習" });
    }

    if (context.recommendedRetest) {
      sentences.push(
        "「" + (context.recommendedRetest.title || "上次測驗") + "」上次正確率 " +
        (context.recommendedRetest.accuracy || 0) + "%，建議重新測驗加強。"
      );
      actions.push({ icon: "refresh", label: "重新測驗", desc: context.recommendedRetest.title || "" });
    }

    if (context.masteredCount) {
      sentences.push("已有 " + context.masteredCount + " 題錯題達到精熟，繼續保持！");
    }

    if (!sentences.length) { return null; }

    return {
      message: sentences.join(""),
      actions: actions
    };
  }

  return { build: build };
})();
