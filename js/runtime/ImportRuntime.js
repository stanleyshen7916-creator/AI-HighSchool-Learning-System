/* js/runtime/ImportRuntime.js — Sprint AI-103 · Content Import Runtime
   Coordinator only — per this Sprint's own Runtime Rule: "不得保存資料
   / 不得管理 UI / 不得覆寫 Runtime / 唯一工作：協調 Import". This file
   holds NO internal store (no `var store = ...` anywhere, unlike every
   other Runtime in this codebase) and calls only existing, LOCK Runtime
   write APIs — AHS.MaterialRuntime.add(), AHS.SummaryRuntime.add(),
   AHS.QuestionRuntime.importQuestions() (the one small, additive
   Runtime Extension this Sprint authorized when a gap was found — see
   that file), and AHS.WrongBookRuntime.sync() (existing API, no
   extension needed — ErrorBook entries are reshaped to match
   sync()'s existing gradedResult contract).

   Architecture: Import Files -> ImportValidator -> MetadataParser/
   ContentLoader -> ImportRuntime -> Existing Runtime -> UI. This file
   never touches the DOM and never writes to a Runtime this Sprint did
   not explicitly authorize reusing.

   Known, honestly-disclosed limitation (not fixed here — see
   Sprint_AI_103_RuntimeIntegrationReport.md): AHS.QuestionRuntime and
   AHS.WrongBookRuntime (both Sprint 4, Exam Mode) are NOT what
   Dashboard actually reads (Dashboard's real sources, established
   Sprint AI-020, are HistoryRuntime/WrongBookSession/StatisticsRuntime/
   LearningHistoryModel). Imported Quiz/ErrorBook content is genuinely
   written and queryable via QuestionRuntime/WrongBookRuntime's existing
   APIs, but will not visibly appear on Dashboard today — a pre-existing
   architecture reality, not something this file works around by
   writing into a different Runtime than the ones this Sprint named. */
window.AHS = window.AHS || {};
AHS.ImportRuntime = (function () {
  "use strict";

  var QUESTION_TYPES = ["single_choice", "multiple_choice", "true_false"];

  function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  function firstHeading(body) {
    var match = /^#\s+(.+)$/m.exec(body || "");
    return match ? match[1].trim() : null;
  }

  /* Metadata (if present) takes precedence over Material.md's own
     frontmatter header for subject/grade/chapter/unit — Metadata.json
     is the more complete, authoritative source; the header is a
     same-file fallback when no Metadata.json was supplied. */
  function resolveField(metadata, header, key, headerKey) {
    if (metadata && metadata[key]) { return metadata[key]; }
    if (header && header[headerKey]) { return header[headerKey]; }
    return null;
  }

  function importMaterial(loaded, metadata) {
    var header = loaded.material.header;
    var body = loaded.material.body;
    var record = {
      title: firstHeading(body) || null,
      subject: resolveField(metadata, header, "subject", "subject"),
      grade: resolveField(metadata, header, "grade", "grade"),
      chapter: resolveField(metadata, header, "chapter", "chapter"),
      category: resolveField(metadata, header, "unit", "unit"),
      content: body,
      fileName: "Material.md",
      fileType: "MD"
    };
    return AHS.MaterialRuntime.add(record);
  }

  /* Summary.json -> AHS.SummaryRuntime.add(). Keywords (if present in
     Summary.json) are intentionally NOT written anywhere: the existing,
     LOCK SummaryRuntime schema (coreConcepts/definitions/pitfalls/
     memorize/reviewSuggestions) has no keywords field, and inventing
     one, or silently folding Keywords into coreConcepts, would
     mislabel them — an honest gap, not fabricated content. Reported in
     the Runtime Integration Report. */
  function importSummary(summaryJson, material, metadata) {
    if (!isPlainObject(summaryJson)) { return null; }
    return AHS.SummaryRuntime.add({
      materialId: material.id,
      subject: material.subject,
      grade: material.grade,
      chapter: material.chapter,
      section: (metadata && metadata.unit) || "",
      title: material.title || "",
      coreConcepts: Array.isArray(summaryJson.KeyPoints) ? summaryJson.KeyPoints
        : (Array.isArray(summaryJson.keyPoints) ? summaryJson.keyPoints : []),
      memorize: Array.isArray(summaryJson.Memory) ? summaryJson.Memory
        : (Array.isArray(summaryJson.memory) ? summaryJson.memory : [])
    });
  }

  /* Quiz.json (+ optional Answer.json, merged by id) ->
     AHS.QuestionRuntime.importQuestions(examId, questions). Only the
     three question types this Sprint's Import Standard names
     (single_choice/multiple_choice/true_false) are accepted; anything
     else is dropped with a warning rather than silently imported with
     a made-up type. */
  function importQuiz(quizJson, answerJson, material, warnings) {
    if (!Array.isArray(quizJson) || quizJson.length === 0) { return { examId: null, questions: [] }; }

    var answerById = {};
    if (Array.isArray(answerJson)) {
      answerJson.forEach(function (a) { if (a && a.id !== undefined) { answerById[a.id] = a; } });
    } else if (isPlainObject(answerJson)) {
      answerById = answerJson;
    }

    var questions = [];
    quizJson.forEach(function (q) {
      if (!isPlainObject(q) || QUESTION_TYPES.indexOf(q.type) === -1) {
        warnings.push("Quiz.json: skipped question with unsupported or missing type" + (q && q.id ? " (id=" + q.id + ")" : ""));
        return;
      }
      var ans = answerById[q.id] || {};
      questions.push({
        id: q.id,
        type: q.type,
        question: q.question || "",
        options: Array.isArray(q.options) ? q.options.slice() : [],
        answer: ans.answer !== undefined ? ans.answer : (q.answer !== undefined ? q.answer : null),
        explanation: ans.explanation !== undefined ? ans.explanation : (q.explanation || ""),
        knowledgePoint: q.knowledgePoint || null
      });
    });

    var examId = "import_" + material.id;
    var stored = AHS.QuestionRuntime.importQuestions(examId, questions);
    return { examId: examId, questions: stored };
  }

  /* ErrorBook.json -> AHS.WrongBookRuntime.sync(gradedResult). Reshapes
     the imported entries into sync()'s existing, unmodified
     gradedResult contract ({subject, title, chapter, wrong: [...]})—
     no extension needed, this is the API as designed. */
  function importErrorBook(errorBookJson, material) {
    if (!Array.isArray(errorBookJson) || errorBookJson.length === 0) { return []; }
    var gradedResult = {
      subject: material.subject,
      title: material.title || "",
      chapter: material.chapter,
      wrong: errorBookJson.map(function (e) {
        return {
          questionId: e.questionId || null,
          text: e.question || "",
          options: Array.isArray(e.options) ? e.options.slice() : [],
          yourAnswer: e.yourAnswer !== undefined ? e.yourAnswer : null,
          correctAnswer: e.correctAnswer !== undefined ? e.correctAnswer : null,
          explanation: e.explanation || "",
          knowledgePoint: e.knowledgePoint || null
        };
      })
    };
    return AHS.WrongBookRuntime.sync(gradedResult);
  }

  /* importFolder(input) -> Promise<ImportResult>. input: either a plain
     {filename: rawText} map or an array/FileList of File objects (see
     ContentLoader.js). Runs Validator first; on failure, returns
     immediately with zero Runtime writes. */
  function importFolder(input) {
    return AHS.ContentLoader.load(input).then(function (loaded) {
      var validation = AHS.ImportValidator.validate(loaded.raw);
      if (!validation.valid) {
        return { success: false, errors: validation.errors, warnings: validation.warnings };
      }

      var metadata = AHS.MetadataParser.parse(loaded.raw["Metadata.json"]);
      var warnings = validation.warnings.slice();

      var material = importMaterial(loaded, metadata);
      var summary = importSummary(loaded.summary, material, metadata);
      var quiz = importQuiz(loaded.quiz, loaded.answer, material, warnings);
      var wrongBookEntries = importErrorBook(loaded.errorBook, material);

      return {
        success: true,
        errors: [],
        warnings: warnings,
        material: material,
        metadata: metadata,
        summary: summary,
        quiz: quiz,
        wrongBookEntries: wrongBookEntries
      };
    });
  }

  return { importFolder: importFolder };
})();
