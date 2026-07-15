/* js/runtime/QuestionBank.js — Sprint 4 · Quiz Runtime Foundation.
   QuestionBank is the question-pool source for the Quiz Center Runtime
   chain (QuestionRuntime -> QuestionBank -> ExamRuntime -> ...).

   Pure generator: given an exam's meta (subject / title / chapter /
   count / difficulty / type from AHS.Mock.quiz.items), it deterministically
   builds a set of multiple-choice questions. No state, no randomness
   (same input -> same output), so QuestionRuntime can safely cache /
   re-fetch without drift. All Mock Data — no fetch/XHR/API.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.QuestionBank = (function () {
  "use strict";

  var OPTION_KEYS = ["A", "B", "C", "D"];

  /* Per-subject templated stems, kept short and readable (Prototype
     Mock content, not curriculum-accurate). Cycled by question index
     so a 10~15 question exam still reads as varied content. */
  var STEMS = {
    math: [
      "關於「{chapter}」，下列敘述何者正確？",
      "承「{chapter}」的定義，下列選項中哪一個計算結果正確？",
      "在「{chapter}」的應用情境中，下列哪一個推論成立？"
    ],
    english: [
      "Choose the best answer related to \u300c{chapter}\u300d.",
      "Which option correctly completes the sentence about \u300c{chapter}\u300d?",
      "According to \u300c{chapter}\u300d, which choice is grammatically correct?"
    ],
    physics: [
      "關於「{chapter}」，下列物理現象的描述何者正確？",
      "依「{chapter}」的原理，下列哪一個結果會發生？",
      "在「{chapter}」的情境下，下列敘述何者錯誤？"
    ],
    chemistry: [
      "關於「{chapter}」，下列化學反應的敘述何者正確？",
      "依「{chapter}」的觀念，下列哪一個判斷是對的？",
      "在「{chapter}」中，下列選項何者不成立？"
    ],
    biology: [
      "關於「{chapter}」，下列生物學敘述何者正確？",
      "依「{chapter}」的機制，下列哪一個描述正確？",
      "在「{chapter}」的討論中，下列何者錯誤？"
    ],
    chinese: ["關於「{chapter}」，下列敘述何者正確？"],
    history: ["關於「{chapter}」，下列歷史敘述何者正確？"],
    geography: ["關於「{chapter}」，下列地理敘述何者正確？"],
    civics: ["關於「{chapter}」，下列公民與社會敘述何者正確？"]
  };

  var DEFAULT_STEMS = ["關於「{chapter}」，下列敘述何者正確？"];

  function fillStem(subject, index, chapter) {
    var pool = STEMS[subject] || DEFAULT_STEMS;
    var stem = pool[index % pool.length];
    return stem.split("{chapter}").join(chapter || "本單元");
  }

  function buildOptions(index) {
    return OPTION_KEYS.map(function (key, i) {
      return { key: key, text: "選項 " + key + "（第 " + (index + 1) + " 題示範內容 " + (i + 1) + "）" };
    });
  }

  /* correctAnswer cycles A/B/C/D deterministically by question index. */
  function correctFor(index) {
    return OPTION_KEYS[index % OPTION_KEYS.length];
  }

  /* generate(examMeta) — examMeta: { examId, subject, title, chapter,
     grade, count, type, difficulty }. Returns an array of question
     records (deep, fresh objects each call). */
  function generate(examMeta) {
    var meta = examMeta || {};
    var subject = meta.subject || "other";
    var chapter = meta.chapter || "";
    var count = typeof meta.count === "number" && meta.count > 0 ? meta.count : 10;
    var questions = [];
    for (var i = 0; i < count; i++) {
      var correct = correctFor(i);
      questions.push({
        id: (meta.examId || "exam") + "_q" + (i + 1),
        index: i + 1,
        subject: subject,
        chapter: chapter,
        grade: meta.grade || "高一",
        type: meta.type || "選擇題",
        difficulty: meta.difficulty || "中等",
        text: fillStem(subject, i, chapter),
        options: buildOptions(i),
        correctAnswer: correct,
        knowledgePoint: chapter || (meta.title || "本單元"),
        explanation: "（Mock）正確答案為 " + correct + "，依「" + (chapter || "本單元") +
          "」對應概念判斷。"
      });
    }
    return questions;
  }

  return { generate: generate };
})();
