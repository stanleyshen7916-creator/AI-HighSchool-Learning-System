/* js/runtime/MonthExamRuntime.js — 模擬月考專區的出題、計時與批改（2026-10-05）。

   出題（決定：題池＋原題庫隨機抽題，之後再加數值變化題）：
     - 題目來源是範圍內各教材在 AHS.TeachingMaterialData 的題庫。管理者用上傳頁
       「為既有教材加題」補的題目在產生平台資料時已併入原教材題庫，所以補題就是
       擴充月考題池，不需要另一套資料。
     - 每次應考重新隨機抽題、打亂題目與選項順序。2026-10-09：只收單選與多選題
       （不收是非題，Project Owner 決定）；多選題全部選對才算答對。選項本身帶
       「(A)」等代號的題目（多選題一律如此）不打亂選項，以免代號錯亂。
     - 題組（「（7-8題組）」「第18–20題題組」等標記）整組一起抽、連續排列。
     - 數學：單題最多 30 題，題組另計，含題組總數最多 50 題。其他科：50 題。
       範圍內題目不夠時，整份題庫都出，並如實回報題數。
     - 2026-10-09：也收舊版教材庫（AHS.MaterialRepository，data/materials/*.js，
       國文第一～三課、英文第一課等）的單選題。這些紀錄不在 TeachingMaterialData
       裡，在此轉成相同格式（選項 {key,text} 轉成文字、正確答案轉成選項文字），
       materialId 以「repo:」開頭。原始紀錄不修改。
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

  /* 舊版教材庫紀錄 -> 與 TeachingMaterialData 相同的 { materialId, material, questions }。 */
  var repoCache = null;
  function repoEntries() {
    var R = AHS.MaterialRepository;
    if (!R || typeof R.list !== "function") { return []; }
    var records = R.list();
    if (repoCache && repoCache.n === records.length) { return repoCache.entries; }
    var out = records.map(function (r) {
      var m = r.metadata || {};
      var subj = AHS.Subjects && AHS.Subjects[m.subject] ? AHS.Subjects[m.subject].name : m.subject;
      var questions = ((r.questionBank || {}).singleChoice || []).map(function (q) {
        var opts = (q.options || []).map(function (o) { return o && typeof o === "object" ? String(o.text) : String(o); });
        var hit = (q.options || []).filter(function (o) { return o && o.key === q.correctAnswer; })[0];
        return { id: q.id, type: "single_choice", question: q.text, options: opts,
          answer: hit ? String(hit.text) : null, explanation: q.explanation || "", knowledgePoint: q.knowledgePoint || "" };
      }).filter(function (q) { return q.id && q.answer != null; });
      return { materialId: "repo:" + r.id,
        material: { subject: subj, school: m.workspaceSchool, semester: m.workspaceSemester,
          chapter: [m.chapter, m.unit].filter(Boolean).join(" ") || r.id },
        questions: questions };
    }).filter(function (e) { return e.material.subject && e.questions.length; });
    repoCache = { n: records.length, entries: out };
    return out;
  }

  function allEntries() {
    return (AHS.TeachingMaterialData || []).concat(repoEntries());
  }

  /* 目前 Workspace（學校＋學期）可用的教材，依科目分組。 */
  function entries() {
    var data = allEntries().filter(function (e) { return e && e.material; });
    var ws = workspace();
    if (!ws) { return data; }
    return data.filter(function (e) {
      var m = e.material;
      if (m.school && m.school !== ws.schoolId) { return false; }
      if (m.semester && (ws.semesterIds || []).indexOf(m.semester) === -1) { return false; }
      return true;
    });
  }

  var MULTI_ANSWER = /^(\([A-G]\)){2,}$/;
  var LETTER_ANSWER = /^\(([A-G])\)$/;
  var SELF_LABEL = /^\s*[(（]\s*[A-Ga-g]\s*[)）]/;

  /* spec(q) -> { multi: bool, correct: [option text...] } or null when the
     question can't be asked here (not single-choice, or its answer doesn't
     match its options). */
  function spec(q) {
    if (!q || String(q.type || q.questionType || "") !== "single_choice") { return null; }
    var opts = Array.isArray(q.options) ? q.options : [];
    if (opts.length < 2) { return null; }
    var ans = String(q.answer == null ? "" : q.answer).trim();
    if (!ans) { return null; }
    var byLetter = function (L) { return opts.filter(function (o) { return String(o).trim().indexOf("(" + L + ")") === 0; })[0]; };
    if (opts.indexOf(q.answer) !== -1) { return { multi: false, correct: [q.answer] }; }
    var one = LETTER_ANSWER.exec(ans);
    if (one) { var o1 = byLetter(one[1]); return o1 ? { multi: false, correct: [o1] } : null; }
    if (MULTI_ANSWER.test(ans)) {
      var picked = (ans.match(/\(([A-G])\)/g) || []).map(function (m) { return byLetter(m.charAt(1)); });
      return picked.every(Boolean) ? { multi: true, correct: picked } : null;
    }
    return null;
  }

  function usable(q) { return !!spec(q); }

  function selfLabeled(q) {
    return (q.options || []).some(function (o) { return SELF_LABEL.test(String(o)); });
  }

  function sameSet(a, b) {
    if (a.length !== b.length) { return false; }
    return a.every(function (x) { return b.indexOf(x) !== -1; });
  }

  function materialLabel(e) {
    var m = e.material;
    return m.chapter || m.title || e.materialId;
  }

  /* tm_N 依數字排序，舊版教材庫（repo:）排在後面。 */
  function orderOf(id) {
    var n = /^tm_(\d+)$/.exec(id);
    return n ? Number(n[1]) : 1e9;
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
      return { subject: s, materials: bySubject[s].sort(function (a, b) { return orderOf(a.materialId) - orderOf(b.materialId) || (a.materialId < b.materialId ? -1 : 1); }) };
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
    var all = allEntries();
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
        var idx = q.options.map(function (_, i) { return i; });
        return { qid: q.id, multi: spec(q).multi, order: selfLabeled(q) ? idx : shuffle(idx, rng) };
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

  /* 單選：存選項文字。多選：切換該選項，存選項文字陣列；全部取消時視為未作答。 */
  function answer(qid, optionText, now) {
    var s = active();
    if (!s || remainingMs(s, now) <= 0) { return false; } /* 時間到不得再作答 */
    var item = s.items.filter(function (it) { return it.qid === qid; })[0];
    if (item && item.multi) {
      var cur = Array.isArray(s.answers[qid]) ? s.answers[qid].slice() : [];
      var at = cur.indexOf(optionText);
      if (at === -1) { cur.push(optionText); } else { cur.splice(at, 1); }
      if (cur.length) { s.answers[qid] = cur; } else { delete s.answers[qid]; }
    } else {
      s.answers[qid] = optionText;
    }
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
      var sp = spec(q) || { multi: false, correct: [] };
      var givenList = given == null ? [] : (Array.isArray(given) ? given : [given]);
      var letters = function (list) {
        return list.map(function (o) { return SELF_LABEL.test(String(o)) ? String(o).trim().charAt(1) : ""; })
          .filter(Boolean).sort().map(function (L) { return "(" + L + ")"; }).join("");
      };
      return {
        qid: it.qid, materialId: q.materialId, question: q.question,
        options: it.order.map(function (i) { return q.options[i]; }).filter(function (o) { return o != null; }),
        multi: sp.multi, correctOptions: sp.correct, givenOptions: givenList,
        answer: sp.multi ? letters(sp.correct) : (sp.correct[0] != null ? sp.correct[0] : q.answer),
        given: given == null ? null : (sp.multi ? letters(givenList) : given),
        correct: givenList.length > 0 && sameSet(givenList, sp.correct),
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
            /* 多選題存成知識弱點通用的代號字串（"BD"），重做時才能正確比對。 */
            yourAnswer: r.given == null ? "（未作答）" : (r.multi ? r.given.replace(/[()]/g, "") : r.given),
            correctAnswer: r.multi ? r.answer.replace(/[()]/g, "") : r.answer,
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
    usable: usable,
    selfLabeled: selfLabeled,
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
