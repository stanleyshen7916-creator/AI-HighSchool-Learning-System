/* js/runtime/MonthExamRuntime.js — 模擬月考專區的出題、計時與批改（2026-10-05）。

   出題（決定：題池＋原題庫隨機抽題，之後再加數值變化題）：
     - 題目來源是範圍內各教材在 AHS.TeachingMaterialData 的題庫。管理者用上傳頁
       「為既有教材加題」補的題目在產生平台資料時已併入原教材題庫，所以補題就是
       擴充月考題池，不需要另一套資料。
     - 每次應考重新隨機抽題、打亂題目與選項順序；只收有選項的單選／是非題。
     - 題組（「（7-8題組）」「第18–20題題組」等標記）整組一起抽、連續排列。
     - 數學：單題最多 30 題，題組另計，含題組總數最多 50 題。其他科：50 題。
       範圍內題目不夠時，整份題庫都出，並如實回報題數。
   計時：開始作答即記錄開始時間，以開始時間為準（重新整理或離開頁面不暫停），
   時間到自動交卷，未作答視為答錯。作答與進行中的考卷存在 PersistenceAdapter
   （依 Workspace 分開），重新整理後可接續。 */
window.AHS = window.AHS || {};
AHS.MonthExamRuntime = (function () {
  "use strict";

  var DURATION_MS = 60 * 60 * 1000;
  var MATH_SUBJECT = "數學";
  var MATH_SINGLE_LIMIT = 30;
  var TOTAL_LIMIT = 50;
  var KEY_ACTIVE = "monthexam:active";
  var KEY_HISTORY = "monthexam:history";
  var KEY_RANGE = "monthexam:range";
  var HISTORY_LIMIT = 20;

  function store() { return AHS.PersistenceAdapter || null; }
  function load(key, fallback) {
    var s = store();
    var v = s && typeof s.load === "function" ? s.load(key) : null;
    return v == null ? fallback : v;
  }
  function save(key, value) {
    var s = store();
    if (s && typeof s.save === "function") { s.save(key, value); }
  }

  function workspace() {
    var ws = AHS.WorkspaceRuntime && typeof AHS.WorkspaceRuntime.getCurrent === "function"
      ? AHS.WorkspaceRuntime.getCurrent() : null;
    return ws || null;
  }

  /* 目前 Workspace（學校＋學期）可用的教材，依科目分組。 */
  function entries() {
    var data = (AHS.TeachingMaterialData || []).filter(function (e) { return e && e.material; });
    var ws = workspace();
    if (!ws) { return data; }
    return data.filter(function (e) {
      var m = e.material;
      if (m.school && m.school !== ws.schoolId) { return false; }
      if (m.semester && (ws.semesterIds || []).indexOf(m.semester) === -1) { return false; }
      return true;
    });
  }

  function usable(q) {
    var t = String(q.type || q.questionType || "");
    return (t === "single_choice" || t === "true_false") &&
      Array.isArray(q.options) && q.options.length >= 2 && q.answer != null && q.answer !== "";
  }

  function materialLabel(e) {
    var m = e.material;
    return m.chapter || m.title || e.materialId;
  }

  function listSubjects() {
    var bySubject = {};
    entries().forEach(function (e) {
      var s = e.material.subject;
      if (!s) { return; }
      bySubject[s] = bySubject[s] || [];
      bySubject[s].push({
        materialId: e.materialId,
        label: materialLabel(e),
        count: (e.questions || []).filter(usable).length
      });
    });
    return Object.keys(bySubject).map(function (s) {
      return { subject: s, materials: bySubject[s].sort(function (a, b) { return Number(a.materialId.slice(3)) - Number(b.materialId.slice(3)); }) };
    });
  }

  function rangeKey() {
    var ws = workspace();
    return ws ? ws.schoolId + "|" + (ws.semesterIds || []).join(",") : "";
  }

  /* 範圍：學生自己調整過的優先，其次管理者設定的預設（js/data/MonthExamConfig.js），
     都沒有時為該科全部教材。只保留目前仍存在的教材。 */
  function getRange(subject) {
    var available = (listSubjects().filter(function (s) { return s.subject === subject; })[0] || { materials: [] })
      .materials.map(function (m) { return m.materialId; });
    var keep = function (ids) { return (ids || []).filter(function (id) { return available.indexOf(id) !== -1; }); };
    var own = (load(KEY_RANGE, {}) || {})[subject];
    if (own && keep(own).length) { return { materialIds: keep(own), source: "student" }; }
    var cfg = (AHS.MonthExamConfig && AHS.MonthExamConfig.ranges) || {};
    var ws = workspace();
    var preset = null;
    if (ws) {
      (ws.semesterIds || []).forEach(function (sem) {
        var r = cfg[ws.schoolId + "|" + sem];
        if (!preset && r && r[subject] && keep(r[subject]).length) { preset = keep(r[subject]); }
      });
    }
    if (preset) { return { materialIds: preset, source: "admin" }; }
    return { materialIds: available, source: "all" };
  }

  function setRange(subject, materialIds) {
    var all = load(KEY_RANGE, {}) || {};
    if (materialIds && materialIds.length) { all[subject] = materialIds.slice(); } else { delete all[subject]; }
    save(KEY_RANGE, all);
  }

  /* 題組辨識：同一教材、同一段「a–b 題組」標記的題目為一組。 */
  function groupKeyOf(q) {
    var text = String(q.question || "") + " " + String(q.reference || "");
    var m = /第\s*(\d+)\s*[–—~～-]\s*(\d+)\s*題\s*(?:為)?\s*題組/.exec(text);
    if (m) { return q.materialId + "|R" + m[1] + "-" + m[2] + "|" + String(q.reference || "").replace(/第\s*\d+\s*題/g, ""); }
    var s = /(\d+)\s*[–—~～-]\s*(\d+)\s*題組/.exec(String(q.section || ""));
    if (s) { return q.materialId + "|S" + q.section; }
    return null;
  }

  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i -= 1) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function questionsFor(materialIds) {
    var byId = {};
    entries().forEach(function (e) { byId[e.materialId] = e; });
    var out = [];
    materialIds.forEach(function (id) {
      var e = byId[id];
      if (!e) { return; }
      (e.questions || []).forEach(function (q) {
        if (usable(q)) { out.push(Object.assign({ materialId: id }, q)); }
      });
    });
    return out;
  }

  /* buildPaper(subject, materialIds, rng) -> { questions, poolSize, limit } */
  function buildPaper(subject, materialIds, rng) {
    rng = rng || Math.random;
    var pool = questionsFor(materialIds);
    var groups = {};
    var units = [];
    pool.forEach(function (q) {
      var k = groupKeyOf(q);
      if (!k) { units.push([q]); return; }
      if (!groups[k]) { groups[k] = []; units.push(groups[k]); }
      groups[k].push(q);
    });
    units.forEach(function (u) {
      u.sort(function (a, b) { return Number(a.questionNumber || 0) - Number(b.questionNumber || 0); });
    });
    var isMath = subject === MATH_SUBJECT;
    var picked = [];
    var singles = 0;
    var total = 0;
    shuffle(units, rng).forEach(function (u) {
      var isGroup = u.length > 1 || !!groupKeyOf(u[0]);
      if (total + u.length > TOTAL_LIMIT) { return; }
      if (isMath && !isGroup && singles >= MATH_SINGLE_LIMIT) { return; }
      if (!isMath && total >= TOTAL_LIMIT) { return; }
      picked.push(u);
      total += u.length;
      if (!isGroup) { singles += 1; }
    });
    var questions = [];
    picked.forEach(function (u) { u.forEach(function (q) { questions.push(q); }); });
    return {
      questions: questions,
      poolSize: pool.length,
      limit: isMath ? "單題 " + MATH_SINGLE_LIMIT + " 題（題組另計，含題組最多 " + TOTAL_LIMIT + " 題）" : TOTAL_LIMIT + " 題"
    };
  }

  function findQuestion(qid) {
    var all = AHS.TeachingMaterialData || [];
    for (var i = 0; i < all.length; i += 1) {
      var qs = all[i].questions || [];
      for (var j = 0; j < qs.length; j += 1) {
        if (qs[j].id === qid) { return Object.assign({ materialId: all[i].materialId }, qs[j]); }
      }
    }
    return null;
  }

  function start(subject, materialIds, opts) {
    opts = opts || {};
    var rng = opts.rng || Math.random;
    var paper = buildPaper(subject, materialIds, rng);
    if (!paper.questions.length) { throw new Error("範圍內沒有可出題的題目"); }
    var session = {
      id: "me_" + (opts.now || Date.now()),
      subject: subject,
      materialIds: materialIds.slice(),
      startedAt: opts.now || Date.now(),
      durationMs: DURATION_MS,
      poolSize: paper.poolSize,
      items: paper.questions.map(function (q) {
        return { qid: q.id, order: shuffle(q.options.map(function (_, i) { return i; }), rng) };
      }),
      answers: {}
    };
    save(KEY_ACTIVE, session);
    return session;
  }

  function active() { return load(KEY_ACTIVE, null); }

  function remainingMs(session, now) {
    return Math.max(0, session.startedAt + session.durationMs - (now || Date.now()));
  }

  function answer(qid, optionText, now) {
    var s = active();
    if (!s || remainingMs(s, now) <= 0) { return false; } /* 時間到不得再作答 */
    s.answers[qid] = optionText;
    save(KEY_ACTIVE, s);
    return true;
  }

  /* 交卷：未作答視為答錯。timedOut：時間到自動交卷。 */
  function submit(opts) {
    opts = opts || {};
    var s = active();
    if (!s) { return null; }
    var rows = s.items.map(function (it) {
      var q = findQuestion(it.qid) || { id: it.qid, question: "（題目已不存在）", options: [], answer: null };
      var given = Object.prototype.hasOwnProperty.call(s.answers, it.qid) ? s.answers[it.qid] : null;
      return {
        qid: it.qid, materialId: q.materialId, question: q.question,
        options: it.order.map(function (i) { return q.options[i]; }).filter(function (o) { return o != null; }),
        answer: q.answer, given: given, correct: given != null && given === q.answer,
        explanation: q.explanation || "", knowledgePoint: q.knowledgePoint || ""
      };
    });
    var correct = rows.filter(function (r) { return r.correct; }).length;
    var result = {
      id: s.id, subject: s.subject, materialIds: s.materialIds,
      startedAt: s.startedAt, submittedAt: opts.now || Date.now(),
      timedOut: !!opts.timedOut, total: rows.length, correct: correct,
      unanswered: rows.filter(function (r) { return r.given == null; }).length,
      score: rows.length ? Math.round(correct / rows.length * 1000) / 10 : 0,
      rows: rows
    };
    var history = load(KEY_HISTORY, []) || [];
    history.unshift(result);
    save(KEY_HISTORY, history.slice(0, HISTORY_LIMIT));
    save(KEY_ACTIVE, null);
    syncWrong(result);
    return result;
  }

  /* 錯題（含未作答）加入知識弱點，與平常練習相同。 */
  function syncWrong(result) {
    var wrong = result.rows.filter(function (r) { return !r.correct && r.answer != null; });
    if (wrong.length && AHS.WrongBookRuntime && typeof AHS.WrongBookRuntime.sync === "function") {
      AHS.WrongBookRuntime.sync({
        subject: result.subject, title: "模擬月考", chapter: "",
        wrong: wrong.map(function (r) {
          return {
            questionId: r.qid, knowledgePoint: r.knowledgePoint, text: r.question, options: r.options,
            yourAnswer: r.given == null ? "（未作答）" : r.given, correctAnswer: r.answer,
            explanation: r.explanation, materialId: r.materialId
          };
        })
      });
    }
    if (AHS.KnowledgeMasteryRuntime && typeof AHS.KnowledgeMasteryRuntime.recordAttempt === "function") {
      result.rows.forEach(function (r) {
        if (r.knowledgePoint) { AHS.KnowledgeMasteryRuntime.recordAttempt(r.knowledgePoint, r.correct, result.subject, r.materialId); }
      });
    }
  }

  /* 頁面載入時：進行中的考卷若已超時，用已存的作答自動交卷。 */
  function settleExpired(now) {
    var s = active();
    if (s && remainingMs(s, now) <= 0) { return submit({ timedOut: true, now: s.startedAt + s.durationMs }); }
    return null;
  }

  function history() { return load(KEY_HISTORY, []) || []; }

  return {
    DURATION_MS: DURATION_MS,
    listSubjects: listSubjects,
    getRange: getRange,
    setRange: setRange,
    rangeKey: rangeKey,
    buildPaper: buildPaper,
    groupKeyOf: groupKeyOf,
    start: start,
    active: active,
    remainingMs: remainingMs,
    answer: answer,
    submit: submit,
    settleExpired: settleExpired,
    history: history,
    findQuestion: findQuestion
  };
})();
