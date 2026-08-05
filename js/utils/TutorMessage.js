/* js/utils/TutorMessage.js — Sprint AI-111 · AI-611/AI-612, re-scoped
   Sprint AI-117 AI-117-07 as the Platform Tutor Engine's own Rule-Based
   message builder.

   Stateless text builder shared by 首頁's AiTutorHomeCard model and
   AI Tutor's (tutor.html) real chat message — both need the exact same
   real-data-derived recommendation, and this is the one place that turns
   AHS.StatisticsRuntime.learningContext()'s real numbers/lists into
   Chinese sentences, so the two pages can never drift into two different
   texts for the same underlying data ("不得建立第二份統計"). Pure
   function, no Runtime, no store, no persistence — matches js/utils/'s
   own "small stateless helpers" role.

   Sprint AI-117 AI-117-07: "Tutor 只能讀取 Learning Analytics。不得直接
   存取各 Runtime。" build() previously called AHS.MaterialRuntime.
   getById()/AHS.LearningStateRuntime.materialState() directly for its
   pageContext.materialId branch — a real, pre-existing gap this Sprint's
   own rule now closes: it calls AHS.StatisticsRuntime.materialContext()
   instead (new this Sprint, itself the only place that wraps those two
   Runtimes), so every branch in this file reads exclusively through
   AHS.StatisticsRuntime — no exception. No LLM/AI API is called anywhere
   in this file (never has been) — every sentence is template text over
   real numbers, which is what "Rule-Based Tutor" / "完全不需 LLM API"
   means in practice.

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

  /* build(context, pageContext) — context: AHS.StatisticsRuntime.
     learningContext()'s own return shape. pageContext (Sprint AI-113
     AI-808, optional, additive — every existing caller that omits it
     keeps its exact prior behavior): { page, materialId, examId } —
     real signals about what the user is currently looking at. When a
     real materialId resolves to a real material (via
     AHS.StatisticsRuntime.materialContext(), Sprint AI-117 AI-117-07 —
     the Tutor Engine's sole read path, never MaterialRuntime/
     LearningStateRuntime directly), that specific material's own
     Material Completion stage/percent is mentioned FIRST, before the
     generic cross-material stats below — "目前教材/目前章節/目前測驗"
     context, never fabricated when no real materialId is given or it
     doesn't resolve to a real record. Builds each sentence only when
     its real data is present; omits it otherwise (never a placeholder
     for a missing signal). */
  function build(context, pageContext) {
    context = context || {};
    pageContext = pageContext || {};
    var sentences = [];
    var actions = [];

    if (pageContext.materialId && AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.materialContext === "function") {
      var materialCtx = AHS.StatisticsRuntime.materialContext(pageContext.materialId);
      if (materialCtx) {
        var line = "你目前在「" + materialCtx.title + "」" + (materialCtx.chapter ? "（" + materialCtx.chapter + "）" : "") +
          "，" + materialCtx.completion.label + "（" + materialCtx.completion.percent + "%）";
        if (materialCtx.completion.quizDone) {
          line += materialCtx.dueCount > 0
            ? "，這份教材還有 " + materialCtx.dueCount + " 題尚待複習到精熟"
            : "，這份教材的錯題已全部精熟";
        }
        sentences.push(line + "。");
      }
    }

    /* Sprint AI-114 AI-906: priority-driven primary suggestion — picks
       exactly one real, most-relevant "what to do next" for the current
       real state, in this fixed priority order (never fixed text: every
       branch's wording embeds real numbers/names that change with the
       actual data, per AHS.LearningStateRuntime's own real signals):
         ① 今天待複習     -> dueForReview 非空：提醒 Review（其中如有
                            correctStreak===0 的「錯題增加」新錯題，一併
                            提及，非兩個互斥分支硬套同一組真實資料）
         ③ 教材完成       -> completedMaterial 存在且 nextMaterial 存在：
                            推薦下一教材
         ④ 全部完成       -> allComplete：推薦挑戰測驗
       其餘既有真實訊號（弱科／建議章節／建議重測）作為次要補充，維持
       既有行為，不因新增優先序而消失。 */
    var freshlyWrong = (context.dueForReview || []).filter(function (w) { return (w.correctStreak || 0) === 0; });

    /* Sprint AI-118 AI-118-08: 所有推薦流程固定為 教材→學習總結→考前練習→
       正式測驗→錯題→再次推薦教材，不得跳脫此流程 — each action below now
       carries a real `href` into the correct next step (previously these
       tiles set only a status-text stub, no real navigation existed to
       stay "inside" or "jump outside" of in the first place). 前往複習
       中心 renamed 前往錯題本 (複習中心's Nav entry is gone this Sprint,
       AI-118-03: "所有入口整併：錯題本" — dueForReview's own real items
       live in WrongBookRuntime either way, so wrongbook.html is the
       correct, not a substitute, destination). */
    if (context.dueForReview && context.dueForReview.length) {
      var reviewLine = "你今天有 " + context.dueForReview.length + " 題錯題待複習，建議先完成今日複習。";
      if (freshlyWrong.length) {
        reviewLine += "其中 " + freshlyWrong.length + " 題是尚未複習過的新錯題。";
      }
      sentences.push(reviewLine);
      actions.push({
        icon: "clock", label: "前往錯題本", desc: context.dueForReview.length + " 題待複習",
        href: "wrongbook.html"
      });
    } else if (context.completedMaterial && context.nextMaterial) {
      sentences.push(
        "你已經完成「" + context.completedMaterial.title + "」，建議接著閱讀「" + context.nextMaterial.title + "」。"
      );
      actions.push({
        icon: "book", label: "前往教材中心", desc: context.nextMaterial.title,
        href: "materials.html?id=" + encodeURIComponent(context.nextMaterial.id)
      });
    } else if (context.allComplete) {
      sentences.push("太棒了！目前的教材與錯題都已完成，建議挑戰正式測驗鞏固實力。");
      actions.push({ icon: "quiz", label: "前往正式測驗", desc: "挑戰測驗", href: "quiz.html" });
    }

    if (context.weakestSubject) {
      sentences.push(
        "你在「" + subjectName(context.weakestSubject.subject) + "」的平均正確率是 " +
        context.weakestSubject.percent + "%，是目前較弱的科目。"
      );
      actions.push({
        icon: "quiz", label: "前往考前練習", desc: subjectName(context.weakestSubject.subject),
        href: "quiz.html?mode=practice"
      });
    }

    if (context.recommendedChapters && context.recommendedChapters.length) {
      var top = context.recommendedChapters[0];
      sentences.push(
        "「" + top.chapter + "」還有 " + top.count + " 題尚未精熟，建議優先複習這個章節。"
      );
    }

    if (context.recommendedRetest) {
      sentences.push(
        "「" + (context.recommendedRetest.title || "上次測驗") + "」上次正確率 " +
        (context.recommendedRetest.accuracy || 0) + "%，建議重新測驗加強。"
      );
      actions.push({
        icon: "refresh", label: "重新測驗", desc: context.recommendedRetest.title || "",
        href: context.recommendedRetest.examId ? "quiz.html?examId=" + encodeURIComponent(context.recommendedRetest.examId) : "quiz.html"
      });
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
