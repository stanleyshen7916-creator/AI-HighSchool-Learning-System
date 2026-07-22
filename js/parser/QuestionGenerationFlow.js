/* js/parser/QuestionGenerationFlow.js — Sprint 6.9 · EO-S6.9-002
   AI Question Generation — the wiring EO for the v1.0 foundation:

     Summary Runtime ─▶ LearningQuestionGenerator (Interface v1.0)
                     ─▶ Question Schema v1.0 ─▶ LearningQuestionSession

   Content provenance (Generation Rule, hard):
     - Question content comes ONLY from Summary Runtime records —
       coreConcepts / definitions / pitfalls / memorize are the
       Knowledge Points. reviewSuggestions are study advice, not
       knowledge points, and are never turned into questions.
     - Never reads Material Runtime, never re-parses anything, never
       calls any parser-chain module. The ONLY other read is
       KnowledgeRuntime — read-only, metadata-only — to obtain the real
       knowledgeId for Schema v1.0 traceability (the pipeline's own
       Material → Knowledge → Summary lineage; Summary's LOCK schema
       carries no knowledgeId). If no Knowledge record exists for the
       material, candidates honestly fail validation and nothing is
       stored. This interpretation is flagged in EO-S6.9-002_Report.md.

   Honesty (hard): every question is built deterministically FROM the
   real summary text — statement checks, definition recall, category
   identification, blank-filling of the actual sentences. No fact is
   invented, no Mock/Stub/Placeholder is ever produced, and an
   empty-content summary (Parser not done yet) yields exactly zero
   questions, letting Practice Mode show the mandated
   「AI 正在建立練習題……」Empty State.

   Difficulty (PMO Ruling 2B, unchanged): run(materialId, difficulty)
   requires the caller's explicit difficulty; it is threaded verbatim
   into every generate() input. No inference, no default — a missing or
   illegal difficulty aborts the run with zero questions written.

   Question Type Rule — deterministic mapping by Knowledge Point kind
   (snake_case storage, fixed enum):
     coreConcepts → single_choice  (category identification; the four
                                    real section labels as options)
     definitions  → short_answer   (term：content records — recall the
                    content) or true_false (statement check) when the
                    definition has no term separator
     pitfalls     → true_false     (statement check)
     memorize     → fill_blank     (the actual sentence with its longest
                    real segment blanked; too-short texts fall back to
                    true_false so the blank is never trivial)

   Dedupe: re-running for the same material never duplicates — a
   candidate is skipped when the Session already holds a question with
   the same (materialId, knowledgePoint, questionType, difficulty).

   Validation is the foundation's triple gate, unchanged: Interface
   (generate/normalize) → Schema (validate) → Runtime (Session.add's
   own validate gate). This module never bypasses any of them and never
   writes to LearningQuestionRuntime or any other Runtime. */
window.AHS = window.AHS || {};
AHS.QuestionGenerationFlow = (function () {
  "use strict";

  var SECTION_LABELS = ["核心概念", "重要定義", "易錯重點", "必背內容"];

  function latestSummaryFor(materialId) {
    var rt = AHS.SummaryRuntime;
    if (!rt || typeof rt.findByMaterialId !== "function") { return null; }
    var records = rt.findByMaterialId(materialId);
    return (records && records.length) ? records[records.length - 1] : null;
  }

  /* Real knowledgeId via the pipeline's own lineage — read-only. */
  function knowledgeIdFor(materialId) {
    var rt = AHS.KnowledgeRuntime;
    if (!rt || typeof rt.findByMaterialId !== "function") { return null; }
    var records = rt.findByMaterialId(materialId);
    return (records && records.length) ? records[records.length - 1].id : null;
  }

  /* ---- Knowledge Point extraction (Summary content only) --------------- */
  function knowledgePoints(summary) {
    var kps = [];
    function collect(kind, label, items) {
      (Array.isArray(items) ? items : []).forEach(function (text) {
        var t = String(text || "").trim();
        if (t) { kps.push({ kind: kind, label: label, text: t }); }
      });
    }
    collect("core", "核心概念", summary.coreConcepts);
    collect("definition", "重要定義", summary.definitions);
    collect("pitfall", "易錯重點", summary.pitfalls);
    collect("memorize", "必背內容", summary.memorize);
    return kps;
  }

  /* ---- Deterministic question builders (no invention) ------------------- */

  function splitDefinition(text) {
    var idx = text.indexOf("：");
    if (idx === -1) { idx = text.indexOf(":"); }
    if (idx > 0 && idx < text.length - 1) {
      return { term: text.slice(0, idx).trim(), content: text.slice(idx + 1).trim() };
    }
    return null;
  }

  /* Longest real segment of the sentence (split on CJK/latin
     punctuation and spaces) — the blank is always actual summary text. */
  function longestSegment(text) {
    var segs = text.split(/[、，。；：！？,.;:!?\s()（）「」『』]+/).filter(Boolean);
    var best = "";
    segs.forEach(function (s) { if (s.length > best.length) { best = s; } });
    return best;
  }

  function buildCandidate(kp, summary, common) {
    var title = summary.title || "本教材";
    if (kp.kind === "core") {
      return Object.assign({}, common, {
        knowledgePoint: kp.text,
        questionType: "single_choice",
        question: "「" + kp.text + "」在《" + title + "》的學習總結中，屬於下列哪一類整理項目？",
        options: SECTION_LABELS.slice(),
        answer: "核心概念",
        explanation: "「" + kp.text + "」列於《" + title + "》學習總結的「核心概念」段落。",
        reference: "《" + title + "》學習總結・核心概念"
      });
    }
    if (kp.kind === "definition") {
      var parts = splitDefinition(kp.text);
      if (parts) {
        return Object.assign({}, common, {
          knowledgePoint: parts.term,
          questionType: "short_answer",
          question: "請依《" + title + "》的學習總結，寫出「" + parts.term + "」的定義內容。",
          options: [],
          answer: parts.content,
          explanation: "依《" + title + "》學習總結之重要定義：「" + kp.text + "」。",
          reference: "《" + title + "》學習總結・重要定義"
        });
      }
      return Object.assign({}, common, {
        knowledgePoint: kp.text,
        questionType: "true_false",
        question: "依據《" + title + "》的學習總結，下列敘述是否正確：「" + kp.text + "」",
        options: ["正確", "錯誤"],
        answer: "正確",
        explanation: "此敘述出自《" + title + "》學習總結的「重要定義」段落，內容一致，故為正確。",
        reference: "《" + title + "》學習總結・重要定義"
      });
    }
    if (kp.kind === "pitfall") {
      return Object.assign({}, common, {
        knowledgePoint: kp.text,
        questionType: "true_false",
        question: "「" + kp.text + "」是《" + title + "》整理的易錯重點之一——此說法是否正確？",
        options: ["正確", "錯誤"],
        answer: "正確",
        explanation: "《" + title + "》學習總結的「易錯重點」段落確實列有：「" + kp.text + "」。作答時應特別留意。",
        reference: "《" + title + "》學習總結・易錯重點"
      });
    }
    /* memorize */
    var blank = longestSegment(kp.text);
    if (blank && blank.length >= 2 && blank.length < kp.text.length) {
      return Object.assign({}, common, {
        knowledgePoint: kp.text,
        questionType: "fill_blank",
        question: "請填空（出自《" + title + "》必背內容）：「" + kp.text.replace(blank, "____") + "」",
        options: [],
        answer: blank,
        explanation: "完整內容：「" + kp.text + "」（出自《" + title + "》學習總結・必背內容）。",
        reference: "《" + title + "》學習總結・必背內容"
      });
    }
    return Object.assign({}, common, {
      knowledgePoint: kp.text,
      questionType: "true_false",
      question: "「" + kp.text + "」屬於《" + title + "》整理的必背內容——此說法是否正確？",
      options: ["正確", "錯誤"],
      answer: "正確",
      explanation: "《" + title + "》學習總結的「必背內容」段落確實列有：「" + kp.text + "」。",
      reference: "《" + title + "》學習總結・必背內容"
    });
  }

  function alreadyInSession(candidate) {
    var session = AHS.LearningQuestionSession;
    if (!session || typeof session.findByMaterialId !== "function") { return false; }
    return session.findByMaterialId(candidate.materialId).some(function (q) {
      return q.knowledgePoint === candidate.knowledgePoint &&
             q.questionType === candidate.questionType &&
             q.difficulty === candidate.difficulty;
    });
  }

  /* ---- run(materialId, difficulty) ---------------------------------------
     Returns an honest result object:
       { status: "ok" | "no_summary" | "no_content" | "invalid_difficulty"
                 | "unavailable",
         generated, skipped, rejected, errors: [] }
     "no_content" is the Parser-not-done case — Practice Mode's mandated
     「AI 正在建立練習題……」Empty State covers it; zero fake questions. */
  function run(materialId, difficulty) {
    var result = { status: "ok", generated: 0, skipped: 0, rejected: 0, errors: [] };
    var G = AHS.LearningQuestionGenerator, S = AHS.LearningQuestionSession;

    if (!G || !S) { result.status = "unavailable"; return result; }
    if (G.DIFFICULTIES.indexOf(String(difficulty || "").toLowerCase()) === -1) {
      /* Ruling 2B: caller must supply a legal difficulty — never
         inferred, never defaulted here. */
      result.status = "invalid_difficulty";
      return result;
    }

    var summary = latestSummaryFor(materialId);
    if (!summary) { result.status = "no_summary"; return result; }

    var kps = knowledgePoints(summary);
    if (!kps.length) { result.status = "no_content"; return result; }

    var knowledgeId = knowledgeIdFor(materialId);
    var common = {
      materialId: summary.materialId,
      subject: summary.subject,
      grade: summary.grade,
      chapter: summary.chapter,
      section: summary.section,
      difficulty: String(difficulty).toLowerCase(),
      learningObjective: "",
      knowledgeId: knowledgeId,
      summaryId: summary.id,
      source: {
        type: "summary_derived",
        summaryId: summary.id,
        reference: "Summary Runtime: " + summary.id
      },
      metadata: { mode: "summary_derived", flow: "EO-S6.9-002" }
    };

    kps.forEach(function (kp) {
      var input = buildCandidate(kp, summary, common);
      input.learningObjective = "能掌握《" + (summary.title || "本教材") + "》的" + kp.label + "：「" + kp.text + "」";
      var candidate = G.generate(input);              /* Interface gate */
      if (!candidate) { result.rejected += 1; return; }
      if (alreadyInSession(candidate)) { result.skipped += 1; return; }
      var check = G.validate(candidate);              /* Schema gate */
      if (!check.valid) {
        result.rejected += 1;
        result.errors = result.errors.concat(check.errors);
        return;
      }
      var stored = S.add(candidate);                  /* Runtime gate */
      if (stored) { result.generated += 1; } else { result.rejected += 1; }
    });

    return result;
  }

  return { run: run };
})();
