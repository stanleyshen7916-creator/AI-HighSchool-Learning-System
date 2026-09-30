/* js/runtime/StudyAssistant.js — 2026-09-30 學習助教（取代原「AI Tutor」頁的回覆邏輯）.

   No LLM / AI API. Every answer comes from this platform's own real
   teaching materials in the current Workspace (school + semester):

     search(query)  查觀念 — ranks the materials' own sentences (核心概念、
                    定義、重點、易錯、複習建議、題目詳解) against the query and
                    returns them verbatim with their source. Nothing found
                    -> an honest "教材裡找不到", never a composed answer.
     pickQuiz(opts) 出題考我 — draws real single-choice questions from the
                    materials' own question banks (optionally from the
                    student's own 知識弱點 first).
     answer(q, key) grades one answer and records it exactly like the
                    Quiz Center does: KnowledgeMasteryRuntime.recordAttempt(),
                    a wrong answer -> WrongBookRuntime.sync(), a correct
                    answer to an existing 知識弱點 item -> recordRetry().
     reply(text, ctx) routes a chat message to one of the above (or to the
                    existing AHS.TutorEngine when the student arrived from a
                    specific 知識弱點 question).

   Sources: AHS.TeachingMaterialData (package track) and
   AHS.MaterialRepository (repository track) — the same two tracks and the
   same school/semester rule js/runtime/TeachingMaterialLoader.js uses. */
window.AHS = window.AHS || {};

AHS.StudyAssistant = (function () {
  "use strict";

  var OPTION_KEYS = ["A", "B", "C", "D", "E", "F"];
  var FILLERS = ["請問", "什麼是", "是什麼", "什麼叫做", "什麼叫", "叫做", "為什麼", "怎麼樣", "怎麼", "如何",
    "請解釋", "解釋一下", "解釋", "說明一下", "說明", "介紹一下", "介紹", "的意思", "意思", "的定義", "定義",
    "告訴我", "我想知道", "幫我", "一下", "嗎", "呢", "啊", "吧"];
  var QUIZ_WORDS = ["出題", "考我", "考考我", "測驗", "練習題", "做題"];
  var TUTOR_ENGINE_LABELS = ["解題步驟詳解", "概念解釋"];
  var KIND_WEIGHT = { "核心概念": 0.6, "定義": 0.6, "重點": 0.4, "易錯": 0.4, "複習建議": 0.2, "題目詳解": 0.2 };

  var cache = { key: null, sources: null };

  /* ---- Workspace & subjects -------------------------------------------- */

  function workspace() {
    return (AHS.WorkspaceRuntime && typeof AHS.WorkspaceRuntime.getCurrent === "function")
      ? AHS.WorkspaceRuntime.getCurrent() : null;
  }

  function allowed(school, semester) {
    var ws = workspace();
    if (!ws) { return true; }
    if (school && ws.schoolId !== school) { return false; }
    if (semester && ws.semesterIds.indexOf(semester) === -1) { return false; }
    return true;
  }

  function subjectKey(nameOrKey) {
    var subjects = AHS.Subjects || {};
    if (subjects[nameOrKey]) { return nameOrKey; }
    var found = Object.keys(subjects).filter(function (k) { return subjects[k].name === nameOrKey; })[0];
    return found || null;
  }

  function subjectName(key) {
    return (AHS.Subjects && AHS.Subjects[key]) ? AHS.Subjects[key].name : key;
  }

  function runtimeIdFor(sourceId) {
    return (AHS.TeachingMaterialLoader && typeof AHS.TeachingMaterialLoader.runtimeIdFor === "function")
      ? AHS.TeachingMaterialLoader.runtimeIdFor(sourceId) : null;
  }

  /* ---- Corpus ------------------------------------------------------------ */

  function strings(list) {
    return (Array.isArray(list) ? list : []).filter(function (s) { return typeof s === "string" && s.trim(); });
  }

  function packageSource(entry) {
    var m = entry.material || {};
    var subject = subjectKey(m.subject);
    if (!subject || !allowed(m.school, m.semester)) { return null; }
    var s = entry.summary || {};
    var docs = [];
    function add(kind, list) { strings(list).forEach(function (t) { docs.push({ kind: kind, text: t }); }); }
    add("核心概念", s.coreConcepts);
    add("定義", s.definitions);
    add("重點", s.memorize);
    add("易錯", s.pitfalls);
    add("複習建議", s.reviewSuggestions);
    var questions = [];
    (entry.questions || []).forEach(function (q) {
      if (q.explanation) { docs.push({ kind: "題目詳解", text: q.question + "　→　" + q.explanation }); }
      if (!q || q.type !== "single_choice" || !Array.isArray(q.options) || q.options.length < 2) { return; }
      var idx = q.options.indexOf(q.answer);
      if (idx === -1 || idx >= OPTION_KEYS.length) { return; }
      questions.push({
        id: q.id, text: q.question,
        options: q.options.map(function (t, i) { return { key: OPTION_KEYS[i], text: t }; }),
        correctAnswer: OPTION_KEYS[idx],
        knowledgePoint: q.knowledgePoint || m.chapter || "", explanation: q.explanation || ""
      });
    });
    return { sourceId: entry.materialId, title: m.title || m.chapter || entry.materialId, chapter: m.chapter || "", subject: subject, docs: docs, questions: questions };
  }

  function repositorySource(record) {
    var meta = record.metadata || {};
    var subject = subjectKey(meta.subject);
    if (!subject || !allowed(meta.workspaceSchool, meta.workspaceSemester)) { return null; }
    var docs = [];
    (record.coreConcepts || []).forEach(function (c) {
      if (c && c.term && c.definition) { docs.push({ kind: "定義", text: c.term + "：" + c.definition }); }
    });
    var summary = record.summary || {};
    Object.keys(summary).forEach(function (k) {
      strings(summary[k]).forEach(function (t) { docs.push({ kind: "重點", text: t }); });
    });
    (record.commonMistakes || []).forEach(function (c) {
      if (c && c.concept && c.correction) {
        docs.push({ kind: "易錯", text: c.concept + "：" + (c.misconception ? "常見誤解是「" + c.misconception + "」；" : "") + c.correction });
      }
    });
    var questions = [];
    var bank = record.questionBank || {};
    (Array.isArray(bank.singleChoice) ? bank.singleChoice : []).forEach(function (q) {
      if (q && q.explanation) { docs.push({ kind: "題目詳解", text: q.text + "　→　" + q.explanation }); }
      if (!q || !Array.isArray(q.options) || q.options.length < 2 || !q.correctAnswer) { return; }
      questions.push({
        id: q.id, text: q.text, options: q.options, correctAnswer: q.correctAnswer,
        knowledgePoint: q.knowledgePoint || meta.chapter || "", explanation: q.explanation || ""
      });
    });
    var title = summary.title || [meta.subjectLabel, meta.chapter, meta.unit].filter(Boolean).join(" ");
    return { sourceId: record.id, title: title, chapter: meta.chapter || "", subject: subject, docs: docs, questions: questions };
  }

  /* sources() — every material the current Workspace can see, built once
     per Workspace (school + semesters). */
  function sources() {
    var ws = workspace();
    var key = ws ? ws.schoolId + "|" + ws.semesterIds.join(",") : "*";
    if (cache.key === key && cache.sources) { return cache.sources; }
    var list = [];
    (Array.isArray(AHS.TeachingMaterialData) ? AHS.TeachingMaterialData : []).forEach(function (e) {
      var s = e && e.material ? packageSource(e) : null;
      if (s) { list.push(s); }
    });
    var repo = AHS.MaterialRepository && typeof AHS.MaterialRepository.list === "function" ? AHS.MaterialRepository.list() : [];
    repo.forEach(function (r) {
      var s = r && r.id ? repositorySource(r) : null;
      if (s) { list.push(s); }
    });
    list.forEach(function (s) {
      s.runtimeId = runtimeIdFor(s.sourceId);
      s.questions.forEach(function (q) {
        q.subject = s.subject;
        q.sourceId = s.sourceId;
        q.sourceTitle = s.title;
        q.chapter = s.chapter;
        q.runtimeId = s.runtimeId;
      });
      s.docs.forEach(function (d) { d.norm = normalize(d.text); });
    });
    cache = { key: key, sources: list };
    return list;
  }

  /* subjects() — [{ key, name, materials, questions }] present in the
     current Workspace, in AHS.Subjects order. */
  function subjects() {
    var by = {};
    sources().forEach(function (s) {
      by[s.subject] = by[s.subject] || { key: s.subject, name: subjectName(s.subject), materials: 0, questions: 0 };
      by[s.subject].materials += 1;
      by[s.subject].questions += s.questions.length;
    });
    return Object.keys(AHS.Subjects || {}).filter(function (k) { return by[k]; }).map(function (k) { return by[k]; });
  }

  /* ---- 查觀念 ---------------------------------------------------------- */

  function normalize(text) {
    return String(text || "").toLowerCase().replace(/[\s　]+/g, "");
  }

  function cleanQuery(text) {
    var q = String(text || "").replace(/[？?！!。，,、；;：:「」『』（）()《》〈〉"'“”‘’\s　]/g, "");
    FILLERS.forEach(function (f) { q = q.split(f).join(""); });
    q = q.replace(/^的+|的+$/g, "");
    /* 「為什麼有四季」→「有四季」→「四季」: leading helper verbs only
       dilute the match; keep them when they are the whole query. */
    var stripped = q.replace(/^(有|是|會|要|能|可以|在)/, "");
    if (stripped.length >= 2) { q = stripped; }
    return q.toLowerCase();
  }

  function bigrams(q) {
    if (q.length < 2) { return q ? [q] : []; }
    var out = [];
    for (var i = 0; i < q.length - 1; i++) {
      var g = q.slice(i, i + 2);
      if (out.indexOf(g) === -1) { out.push(g); }
    }
    return out;
  }

  /* search(text, opts) — opts.subject (key) and opts.limit (default 5).
     Returns { query, results: [{ text, kind, subject, subjectName, title,
     runtimeId, score }] }; results is [] when nothing in the current
     Workspace's materials really matches. */
  function search(text, opts) {
    opts = opts || {};
    var query = cleanQuery(text);
    var grams = bigrams(query);
    if (!query) { return { query: query, results: [] }; }
    var scored = [];
    sources().forEach(function (s) {
      if (opts.subject && s.subject !== opts.subject) { return; }
      s.docs.forEach(function (d) {
        /* bare keywords / labels ("穿牆術") are not an explanation */
        if (d.norm.length < 8) { return; }
        var exact = d.norm.indexOf(query) !== -1;
        var hits = grams.filter(function (g) { return d.norm.indexOf(g) !== -1; }).length;
        var coverage = grams.length ? hits / grams.length : 0;
        if (!exact && (query.length < 3 || coverage < 0.6)) { return; }
        scored.push({
          text: d.text, kind: d.kind, subject: s.subject, subjectName: subjectName(s.subject),
          title: s.title, runtimeId: s.runtimeId,
          score: (exact ? 3 : 0) + coverage * 2 + (KIND_WEIGHT[d.kind] || 0) + (d.norm.indexOf(query) === 0 ? 0.5 : 0) - d.text.length / 5000
        });
      });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    var seen = {};
    var results = [];
    var questionDocs = 0;
    scored.forEach(function (r) {
      if (results.length >= (opts.limit || 5) || seen[r.text]) { return; }
      if (r.kind === "題目詳解" && questionDocs >= 2) { return; }
      seen[r.text] = true;
      if (r.kind === "題目詳解") { questionDocs += 1; }
      results.push(r);
    });
    return { query: query, results: results };
  }

  /* topics(subject, n) — real knowledge-point names from the question
     banks, for 「你可以這樣問」 suggestions. */
  function topics(subject, n) {
    var seen = {};
    var bySubject = {};
    var order = [];
    sources().forEach(function (s) {
      if (subject && s.subject !== subject) { return; }
      s.questions.forEach(function (q) {
        /* "1-3 因次：動量" / "1-1｜弧度量" -> drop the section number */
        var kp = String(q.knowledgePoint || "").replace(/^[\d０-９]+([-－.．][\d０-９]+)*\s*[｜|：:、.．]?\s*/, "").trim();
        if (kp.length < 2 || kp.length > 14 || seen[kp]) { return; }
        seen[kp] = true;
        if (!bySubject[s.subject]) { bySubject[s.subject] = []; order.push(s.subject); }
        bySubject[s.subject].push(kp);
      });
    });
    /* round-robin across subjects so one subject doesn't fill the list;
       only suggest a topic that really finds something (question-type
       labels like 「閱讀理解：文章主旨」 often don't) */
    var out = [];
    for (var i = 0; out.length < (n || 8); i++) {
      var more = false;
      order.forEach(function (k) {
        var kp = bySubject[k][i];
        if (!kp) { return; }
        more = true;
        if (out.length < (n || 8) && search(kp, { subject: k, limit: 1 }).results.length) { out.push(kp); }
      });
      if (!more) { break; }
    }
    return out;
  }

  /* ---- 出題考我 -------------------------------------------------------- */

  function shuffle(list, random) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function weakItems() {
    if (!AHS.WrongBookRuntime || typeof AHS.WrongBookRuntime.list !== "function") { return []; }
    return AHS.WrongBookRuntime.list().filter(function (w) {
      return !w.archived && w.weaknessState !== "MASTERED" && w.weaknessState !== "ARCHIVED";
    });
  }

  /* pickQuiz(opts) — opts.subject, opts.count (default 5), opts.weakFirst,
     opts.random (injectable for tests). Returns { questions, fromWeak }:
     with weakFirst, questions the student got wrong (and others on the
     same knowledge points) come first; the rest is filled randomly. */
  function pickQuiz(opts) {
    opts = opts || {};
    var random = opts.random || Math.random;
    var count = opts.count || 5;
    var pool = [];
    sources().forEach(function (s) {
      if (opts.subject && s.subject !== opts.subject) { return; }
      pool = pool.concat(s.questions);
    });
    var picked = [];
    var fromWeak = 0;
    if (opts.weakFirst) {
      var weak = weakItems();
      var ids = {};
      var kps = {};
      weak.forEach(function (w) { ids[w.questionId] = true; if (w.knowledgePoint) { kps[w.knowledgePoint] = true; } });
      var exact = shuffle(pool.filter(function (q) { return ids[q.id]; }), random);
      var related = shuffle(pool.filter(function (q) { return !ids[q.id] && kps[q.knowledgePoint]; }), random);
      picked = exact.concat(related).slice(0, count);
      fromWeak = picked.length;
    }
    var rest = shuffle(pool.filter(function (q) { return picked.indexOf(q) === -1; }), random);
    picked = picked.concat(rest.slice(0, count - picked.length));
    /* Some question banks put the correct answer first every time (tm_16/
       tm_17: 22/22 are option A). Show the options in a shuffled order,
       but keep each option's ORIGINAL key — answer() and 知識弱點 always
       record the original keys, so the same question stays consistent
       with the Quiz Center's record of it. The UI labels by position. */
    picked = picked.map(function (q) {
      var copy = {};
      Object.keys(q).forEach(function (k) { copy[k] = q[k]; });
      /* Same fixed per-question order as 測驗中心／知識弱點 (AHS.OptionOrder),
         so a question looks the same everywhere; random fallback only if
         that helper isn't loaded. */
      copy.displayOptions = AHS.OptionOrder ? AHS.OptionOrder.order(q) : shuffle(q.options, random);
      return copy;
    });
    return { questions: picked, fromWeak: fromWeak, poolSize: pool.length };
  }

  /* answer(question, chosenKey) — grades and records one answer the same
     way the Quiz Center does. Returns { correct, correctAnswer, correctText,
     explanation, addedToWrongBook }. */
  function answer(question, chosenKey) {
    var correct = chosenKey === question.correctAnswer;
    if (AHS.KnowledgeMasteryRuntime && typeof AHS.KnowledgeMasteryRuntime.recordAttempt === "function" && question.knowledgePoint) {
      AHS.KnowledgeMasteryRuntime.recordAttempt(question.knowledgePoint, correct, question.subject, question.runtimeId || "");
    }
    var addedToWrongBook = false;
    if (AHS.WrongBookRuntime) {
      if (!correct && typeof AHS.WrongBookRuntime.sync === "function") {
        AHS.WrongBookRuntime.sync({
          subject: question.subject, title: question.sourceTitle, chapter: question.chapter,
          wrong: [{
            questionId: question.id, text: question.text, options: question.options,
            knowledgePoint: question.knowledgePoint, explanation: question.explanation,
            materialId: question.runtimeId || "", figureSvg: "",
            yourAnswer: chosenKey, correctAnswer: question.correctAnswer
          }]
        });
        addedToWrongBook = true;
      } else if (correct && typeof AHS.WrongBookRuntime.recordRetry === "function") {
        var existing = AHS.WrongBookRuntime.list().filter(function (w) { return w.questionId === question.id; })[0];
        if (existing) { AHS.WrongBookRuntime.recordRetry(existing.id, true); }
      }
    }
    var correctOption = question.options.filter(function (o) { return o.key === question.correctAnswer; })[0];
    return {
      correct: correct,
      correctAnswer: question.correctAnswer,
      correctText: correctOption ? correctOption.text : "",
      explanation: question.explanation || "",
      addedToWrongBook: addedToWrongBook
    };
  }

  /* ---- 對話路由 ---------------------------------------------------------- */

  /* reply(text, ctx) — ctx.subject (filter), ctx.questionId (arrived from a
     知識弱點 question). Returns one of:
       { type: "text", message }                 AHS.TutorEngine's answer
       { type: "quiz" }                          the student asked to be quizzed
       { type: "search", query, results }        results found
       { type: "none", query, message, topics, actions? } nothing found */
  function reply(text, ctx) {
    ctx = ctx || {};
    var trimmed = String(text || "").trim();
    if (!trimmed) { return null; }
    var engine = AHS.TutorEngine;
    var contextQuestion = engine && ctx.questionId ? engine.resolveQuestion(ctx) : null;
    if (contextQuestion && (TUTOR_ENGINE_LABELS.indexOf(trimmed) !== -1 || /解題|詳解|怎麼解|怎麼算|步驟/.test(trimmed))) {
      var r = engine.reply(trimmed, ctx);
      if (typeof r === "string") { return { type: "text", message: r }; }
    }
    if (QUIZ_WORDS.some(function (w) { return trimmed.indexOf(w) !== -1; })) { return { type: "quiz" }; }
    var found = search(trimmed, { subject: ctx.subject });
    if (found.results.length) { return { type: "search", query: found.query, results: found.results }; }
    var none = {
      type: "none", query: found.query, topics: topics(ctx.subject, 6),
      message: "目前的教材裡找不到和「" + (found.query || trimmed) + "」相關的內容。我只根據你這學期的教材回答，不會自己編答案。可以換個關鍵字試試，例如："
    };
    if (contextQuestion) {
      none.actions = TUTOR_ENGINE_LABELS.map(function (label) { return { label: label }; });
    }
    return none;
  }

  /* reset() — test helper: forget the cached corpus. */
  function reset() { cache = { key: null, sources: null }; }

  return {
    sources: sources,
    subjects: subjects,
    search: search,
    topics: topics,
    pickQuiz: pickQuiz,
    answer: answer,
    reply: reply,
    cleanQuery: cleanQuery,
    reset: reset
  };
})();
