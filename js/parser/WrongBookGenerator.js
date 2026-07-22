/* js/parser/WrongBookGenerator.js — Sprint 7.0 · EO-S7.0-001
   Wrong Book Intelligence Foundation — Interface v1.0.

   Position in the lineage (fixed):
     LearningQuestionSession ─▶ WrongBookGenerator ─▶ WrongBookSession
                                                   ─▶ Review Queue ─▶ Review Center

   Interface (fixed four methods): add() / update() / remove() /
   validate(). All Wrong Book writes go through THIS interface —
   consumers never operate WrongBookSession's store directly, and the
   Session double-checks every record with this same validate()
   (Runtime Validation) before storing.

   Wrong Book Rule — enforced structurally, not by convention:
     - add() accepts ONLY { questionId, userAnswer }. Every other field
       (correctAnswer, subject, knowledgePoint, difficulty,
       questionType, explanation, traceability, materialId, chapter,
       section) is resolved READ-ONLY from the REAL question record in
       AHS.LearningQuestionSession. No matching question ⇒ reject.
       人工建立 and 假資料 are therefore impossible: there is no code
       path that stores a wrong-book entry whose content wasn't copied
       from a real, validate-gated Schema v1.0 question.
     - 答對不得加入: when the normalized userAnswer equals the real
       correctAnswer, add() rejects. Only wrong answers create entries.
     - Wrong Count rule: first wrong ⇒ wrongCount = 1 and firstWrongAt
       set once (never overwritten afterwards — update paths cannot
       touch it); every subsequent wrong on the same questionId ⇒
       wrongCount + 1 and lastWrongAt refreshed.
     - No Mock / Stub / Placeholder entry can exist: validate() rejects
       empty userAnswer/correctAnswer/explanation/knowledgePoint, and
       the resolution step above is the only content source.

   Mastery Model (fixed, no additions, no AI inference):
     new → learning → reviewing → mastered   (stored snake/lowercase,
     consistent with the repo's Ruling-4 storage convention; the EO's
     display labels New/Learning/Reviewing/Mastered belong to the UI
     layer). masteryLevel changes only via update() with an explicit
     caller-supplied level from this enum — nothing here infers it.

   Status (fixed): active | archived.

   This module reads LearningQuestionSession (read-only) and calls
   WrongBookSession's store API. It never touches LearningQuestion-
   Runtime, Material/Summary Runtimes, the Parser chain, or the legacy
   Sprint-4 WrongBookRuntime — all LOCK, all byte-identical (QA-proven).
   No AI model, no scheduling, no review logic. Foundation only. */
window.AHS = window.AHS || {};
AHS.WrongBookGenerator = (function () {
  "use strict";

  var MASTERY_LEVELS = ["new", "learning", "reviewing", "mastered"];
  var STATUSES = ["active", "archived"];

  function str(v) { return (typeof v === "string") ? v.trim() : ""; }

  function nowIso() { return new Date().toISOString(); }

  var seq = 0;
  function nextId() { seq += 1; return "wb_" + Date.now() + "_" + seq; }

  /* Answers may be strings or (multiple_choice) arrays — normalize to a
     comparable string without inventing anything. */
  function answerKey(v) {
    if (Array.isArray(v)) { return v.map(function (x) { return String(x).trim(); }).sort().join("||"); }
    return (v === undefined || v === null) ? "" : String(v).trim();
  }

  function questionFor(questionId) {
    var s = AHS.LearningQuestionSession;
    if (!s || typeof s.getById !== "function") { return null; }
    return s.getById(questionId);
  }

  /* ---- validate(record) — Schema Validation v1.0 ------------------------ */
  function validate(record) {
    var errors = [];
    record = record || {};

    ["id", "questionId", "materialId", "subject", "createdAt", "updatedAt"].forEach(function (k) {
      if (!record[k]) { errors.push("缺少必要欄位：" + k); }
    });
    if (!str(record.knowledgePoint)) { errors.push("knowledgePoint 不得為空"); }
    if (answerKey(record.userAnswer) === "") { errors.push("userAnswer 不得為空"); }
    if (answerKey(record.correctAnswer) === "") { errors.push("correctAnswer 不得為空"); }
    if (!str(record.explanation)) { errors.push("explanation 不得為空"); }

    if (answerKey(record.userAnswer) !== "" &&
        answerKey(record.userAnswer) === answerKey(record.correctAnswer)) {
      errors.push("答對不得加入錯題本（userAnswer 與 correctAnswer 相同）");
    }

    var g = AHS.LearningQuestionGenerator;
    if (g) {
      if (g.QUESTION_TYPES.indexOf(str(record.questionType).toLowerCase()) === -1) {
        errors.push("questionType 不合法");
      }
      if (g.DIFFICULTIES.indexOf(str(record.difficulty).toLowerCase()) === -1) {
        errors.push("difficulty 不合法");
      }
    }

    if (MASTERY_LEVELS.indexOf(record.masteryLevel) === -1) {
      errors.push("masteryLevel 不合法（僅允許：" + MASTERY_LEVELS.join(" / ") + "，不得自行新增）");
    }
    if (STATUSES.indexOf(record.status) === -1) {
      errors.push("status 不合法（僅允許：active / archived）");
    }

    if (typeof record.wrongCount !== "number" || record.wrongCount < 1) {
      errors.push("wrongCount 必須為 ≥1 之數字（僅答錯可建立）");
    }
    if (!record.firstWrongAt) { errors.push("缺少：firstWrongAt"); }
    if (!record.lastWrongAt) { errors.push("缺少：lastWrongAt"); }

    var trace = record.traceability;
    if (!trace || typeof trace !== "object" || !trace.materialId) {
      errors.push("缺少：traceability（EO-S6.9 全部 Traceability 必須保留）");
    }

    return { valid: errors.length === 0, errors: errors };
  }

  /* ---- add({ questionId, userAnswer }) -----------------------------------
     The ONLY way a wrong answer becomes (or increments) a Wrong Book
     entry. Returns the stored record, or null with no side effects when
     the question doesn't exist, the answer is actually correct, or
     validation fails. */
  function add(input) {
    input = input || {};
    var session = AHS.WrongBookSession;
    if (!session) { return null; }

    var question = questionFor(input.questionId);
    if (!question) { return null; }                       /* 不得人工建立 */

    var user = input.userAnswer;
    if (answerKey(user) === "") { return null; }
    if (answerKey(user) === answerKey(question.answer)) { return null; } /* 答對不得加入 */

    var existing = session.getByQuestionId(question.id);
    var now = nowIso();

    if (existing) {
      /* Wrong Count rule: +1, refresh lastWrongAt; firstWrongAt is
         deliberately NOT part of this patch — 不得覆蓋.
         EO-S7.0-002 Duplicate Rule: masteryLevel is also updated on a
         repeat wrong — deterministically demoted to "new" (a wrong
         answer returns the question to the start of the fixed Mastery
         Model; no AI inference). */
      return session.store(Object.assign({}, existing, {
        userAnswer: user,
        wrongCount: existing.wrongCount + 1,
        lastWrongAt: now,
        masteryLevel: "new",
        updatedAt: now
      }), validate);
    }

    var record = {
      id: nextId(),
      questionId: question.id,
      materialId: question.materialId,
      subject: question.subject,
      chapter: question.chapter,
      section: question.section,
      knowledgePoint: question.knowledgePoint,
      difficulty: question.difficulty,
      questionType: question.questionType,
      userAnswer: user,
      correctAnswer: question.answer,
      explanation: question.explanation,
      traceability: question.traceability,               /* EO-S6.9 全數保留 */
      wrongCount: 1,
      firstWrongAt: now,
      lastWrongAt: now,
      nextReviewAt: null,                                /* 不得自動排程 */
      masteryLevel: "new",
      status: "active",
      metadata: { source: "learning_question_session", flow: "EO-S7.0-001" },
      createdAt: now,
      updatedAt: now
    };
    return session.store(record, validate);
  }

  /* ---- update(id, patch) --------------------------------------------------
     Explicit-field updates only (e.g. masteryLevel transitions within
     the fixed enum, status archive/active, caller-set nextReviewAt).
     firstWrongAt / wrongCount / createdAt / identity fields are locked
     here — the wrong-count path is exclusively add()'s. */
  function update(id, patch) {
    var session = AHS.WrongBookSession;
    if (!session) { return null; }
    var existing = session.getById(id);
    if (!existing) { return null; }

    patch = (patch && typeof patch === "object") ? patch : {};
    var LOCKED = ["id", "questionId", "materialId", "wrongCount", "firstWrongAt", "createdAt", "traceability"];
    var next = Object.assign({}, existing);
    for (var k in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, k) && LOCKED.indexOf(k) === -1) {
        next[k] = patch[k];
      }
    }
    next.updatedAt = nowIso();
    return session.store(next, validate);
  }

  function remove(id) {
    var session = AHS.WrongBookSession;
    if (!session) { return false; }
    return session.removeById(id);
  }

  return {
    add: add,
    update: update,
    remove: remove,
    validate: validate,
    MASTERY_LEVELS: MASTERY_LEVELS.slice(),
    STATUSES: STATUSES.slice()
  };
})();
