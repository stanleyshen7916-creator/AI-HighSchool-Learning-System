/* js/components/MonthExam.js — 模擬月考專區（2026-10-05）。

   三個畫面：
     1. 科目列表：每科勾選範圍（預設為管理者設定，學生可自行調整）、題庫題數、
        「開始作答」；管理者另有「設為全體預設範圍」（經本機教材上傳引擎上架）。
     2. 作答：60 分鐘倒數，時間到自動交卷，不得再作答。
     3. 成績：分數、每題正確答案；答錯（含未作答）附詳解。
   出題、計時與批改都在 AHS.MonthExamRuntime。 */
window.AHS = window.AHS || {};
AHS.MonthExam = (function () {
  "use strict";
  var el = AHS.UI.el;
  var RT = function () { return AHS.MonthExamRuntime; };

  function button(text, variant, onClick, attrs) {
    var node = el("button", Object.assign({ type: "button", class: "mx-btn" + (variant ? " mx-btn--" + variant : ""), text: text }, attrs || {}));
    node.addEventListener("click", onClick);
    return node;
  }

  function isAdmin() {
    var ws = AHS.WorkspaceRuntime && AHS.WorkspaceRuntime.getCurrent && AHS.WorkspaceRuntime.getCurrent();
    var st = ws && AHS.WorkspaceRuntime.findStudent ? AHS.WorkspaceRuntime.findStudent(ws.studentId) : null;
    return !!(st && st.role === "ADMIN");
  }

  function fmt(ms) {
    var s = Math.ceil(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function create() {
    var root = el("section", { class: "mx", "aria-label": "模擬月考專區" });
    var timer = null;

    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
    function show(node) { stopTimer(); AHS.UI.mount(root, node); window.scrollTo(0, 0); }

    /* ---- 1. 科目列表 ---------------------------------------------------- */
    function renderList(notice) {
      var subjects = RT().listSubjects();
      var head = el("header", { class: "mx-head" }, [
        el("h1", { class: "mx-title", text: "模擬月考專區" }),
        el("p", { class: "mx-sub", text: "每科作答 60 分鐘，按「開始作答」後即開始計時，時間到自動交卷，未作答視為答錯。數學 30 題（題組另計，含題組最多 50 題），其他科 50 題；每次重新隨機出題。" })
      ]);
      var body = [head];
      if (notice) { body.push(el("p", { class: "mx-notice", text: notice })); }
      if (!subjects.length) {
        body.push(el("p", { class: "mx-empty", text: "目前的學校與學期還沒有可出題的教材。" }));
      }
      subjects.forEach(function (s) { body.push(subjectCard(s)); });
      body.push(historyCard());
      show(el("div", { class: "mx-list" }, body));
    }

    function subjectCard(s) {
      var range = RT().getRange(s.subject);
      var chosen = {};
      range.materialIds.forEach(function (id) { chosen[id] = true; });
      var poolText = el("span", { class: "mx-pool" });
      var srcText = el("p", { class: "mx-range-src" });
      var status = el("p", { class: "mx-status", hidden: "hidden" });

      function selected() { return s.materials.filter(function (m) { return chosen[m.materialId]; }).map(function (m) { return m.materialId; }); }
      function refresh() {
        var ids = selected();
        var pool = s.materials.filter(function (m) { return chosen[m.materialId]; }).reduce(function (n, m) { return n + m.count; }, 0);
        var need = s.subject === "數學" ? 30 : 50;
        poolText.textContent = "範圍內題庫 " + pool + " 題" + (pool && pool < need ? "（不足 " + need + " 題，將全部出題）" : "");
        startBtn.disabled = !ids.length || !pool;
      }

      var list = el("ul", { class: "mx-range" }, s.materials.map(function (m) {
        var box = el("input", { type: "checkbox", id: "mx-" + m.materialId });
        box.checked = !!chosen[m.materialId];
        box.addEventListener("change", function () {
          chosen[m.materialId] = box.checked;
          RT().setRange(s.subject, selected());
          srcText.textContent = "範圍：你自行調整";
          refresh();
        });
        return el("li", {}, [box, el("label", { for: "mx-" + m.materialId, text: m.label + "（" + m.count + " 題）" })]);
      }));

      srcText.textContent = range.source === "admin" ? "範圍：老師設定的本次月考範圍"
        : range.source === "student" ? "範圍：你自行調整" : "範圍：全部課次（尚未設定月考範圍）";

      var startBtn = button("開始作答", "primary", function () {
        var ids = selected();
        if (!window.confirm(s.subject + " 模擬月考：作答時間 60 分鐘，按下確定後立即開始計時，中途不能暫停。確定開始？")) { return; }
        try {
          RT().start(s.subject, ids);
        } catch (e) {
          status.textContent = e.message; status.removeAttribute("hidden"); return;
        }
        renderExam();
      });

      var actions = [startBtn];
      if (isAdmin()) {
        actions.push(button("設為全體預設範圍", "ghost", function () {
          var ids = selected();
          var key = RT().rangeKey().split(",")[0];
          if (!ids.length || !key) { return; }
          if (!AHS.CouncilEngineClient) { status.textContent = "此頁面沒有載入教材上傳引擎連線。"; status.removeAttribute("hidden"); return; }
          status.textContent = "儲存中…（需要本機的教材上傳引擎）"; status.removeAttribute("hidden");
          AHS.CouncilEngineClient.saveMonthExamRange({ key: key, subject: s.subject, materialIds: ids }).then(function (r) {
            if (r.error) { status.textContent = "儲存失敗：" + r.error.message; return; }
            status.textContent = r.data.gitJobId
              ? "已儲存，正在送上 GitHub（約 5 分鐘，請勿關閉推送視窗）。上架後所有學生的預設範圍會更新。"
              : "已儲存，但無法排入自動上架：" + (r.data.gitQueueError || "未知原因");
          });
        }));
      }

      refresh();
      return el("article", { class: "card mx-card" }, [
        el("div", { class: "mx-card__head" }, [el("h2", { class: "mx-card__title", text: s.subject }), poolText]),
        srcText, list, el("div", { class: "mx-actions" }, actions), status
      ]);
    }

    function historyCard() {
      var items = RT().history();
      var rows = items.length ? el("ul", { class: "mx-history" }, items.map(function (h) {
        var d = new Date(h.submittedAt);
        return el("li", {}, [
          el("span", { text: d.toLocaleDateString() + " " + d.toLocaleTimeString().slice(0, 5) + "　" + h.subject }),
          el("strong", { text: h.score + " 分" + (h.timedOut ? "（時間到）" : "") }),
          button("查看", "ghost", function () { renderResult(h); })
        ]);
      })) : el("p", { class: "mx-empty", text: "還沒有模擬月考紀錄。" });
      return el("article", { class: "card mx-card" }, [el("h2", { class: "mx-card__title", text: "作答紀錄" }), rows]);
    }

    /* ---- 2. 作答 ---------------------------------------------------------- */
    function renderExam() {
      var session = RT().active();
      if (!session) { renderList(); return; }
      var clock = el("strong", { class: "mx-clock", "aria-live": "off" });
      var progress = el("span", { class: "mx-progress" });
      var total = session.items.length;

      function updateProgress() {
        var s = RT().active();
        progress.textContent = "已作答 " + (s ? Object.keys(s.answers).length : 0) + " / " + total;
      }

      var questions = session.items.map(function (it, idx) {
        var q = RT().findQuestion(it.qid);
        if (!q) { return null; }
        var btns = it.order.map(function (oi) {
          var opt = q.options[oi];
          var b = el("button", { type: "button", class: "mx-opt", text: String.fromCharCode(65 + it.order.indexOf(oi)) + ". " + opt });
          if (session.answers[it.qid] === opt) { b.classList.add("is-picked"); }
          b.addEventListener("click", function () {
            if (!RT().answer(it.qid, opt)) { finish(true); return; }
            btns.forEach(function (x) { x.classList.remove("is-picked"); });
            b.classList.add("is-picked");
            updateProgress();
          });
          return b;
        });
        return el("li", { class: "mx-q" }, [
          el("p", { class: "mx-q__text", text: (idx + 1) + ". " + q.question }),
          el("div", { class: "mx-opts" }, btns)
        ]);
      });

      function finish(timedOut) {
        stopTimer();
        var result = timedOut ? RT().settleExpired() : RT().submit();
        if (result) { renderResult(result, timedOut ? "時間到，已自動交卷，未作答的題目視為答錯。" : null); } else { renderList(); }
      }

      var submitBtn = button("交卷", "primary", function () {
        var s = RT().active();
        var left = total - (s ? Object.keys(s.answers).length : 0);
        if (!window.confirm(left ? "還有 " + left + " 題未作答，未作答視為答錯。確定交卷？" : "確定交卷？")) { return; }
        finish(false);
      });

      var bar = el("div", { class: "mx-bar" }, [
        el("span", { class: "mx-bar__subject", text: session.subject + " 模擬月考（" + total + " 題）" }),
        clock, progress, submitBtn
      ]);
      var notes = session.poolSize < (session.subject === "數學" ? 30 : 50)
        ? el("p", { class: "mx-notice", text: "範圍內題庫只有 " + session.poolSize + " 題，本次全部出題。" }) : null;
      show(el("div", { class: "mx-exam" }, [bar, notes, el("ol", { class: "mx-qs" }, questions), el("div", { class: "mx-actions" }, [submitBtn.cloneNode(true)])]));
      root.querySelector(".mx-qs + .mx-actions button").addEventListener("click", function () { submitBtn.click(); });

      function tick() {
        var left = RT().remainingMs(session);
        clock.textContent = "剩餘 " + fmt(left);
        clock.classList.toggle("is-urgent", left <= 5 * 60 * 1000);
        if (left <= 0) { finish(true); }
      }
      updateProgress();
      tick();
      timer = setInterval(tick, 1000);
    }

    /* ---- 3. 成績與詳解 ------------------------------------------------------ */
    function renderResult(r, notice) {
      var wrongOnly = true;
      var listSlot = el("ol", { class: "mx-qs" });
      function drawRows() {
        AHS.UI.mount(listSlot, el("div", {}, r.rows.map(function (row, i) {
          if (wrongOnly && row.correct) { return null; }
          return el("li", { class: "mx-q " + (row.correct ? "is-correct" : "is-wrong"), value: String(i + 1) }, [
            el("p", { class: "mx-q__text", text: (i + 1) + ". " + row.question }),
            el("ul", { class: "mx-ans" }, row.options.map(function (o, k) {
              var cls = o === row.answer ? "is-answer" : (o === row.given ? "is-given" : "");
              return el("li", { class: cls, text: String.fromCharCode(65 + k) + ". " + o + (o === row.answer ? "　✔ 正確答案" : "") + (o === row.given && o !== row.answer ? "　✘ 你的答案" : "") });
            })),
            row.given == null ? el("p", { class: "mx-given", text: "未作答（視為答錯）" }) : null,
            !row.correct && row.explanation ? el("div", { class: "mx-expl" }, [el("strong", { text: "詳解　" }), el("span", { text: row.explanation })]) : null
          ]);
        })));
      }
      var toggle = button("顯示全部題目", "ghost", function () {
        wrongOnly = !wrongOnly;
        toggle.textContent = wrongOnly ? "顯示全部題目" : "只看錯題";
        drawRows();
      });
      drawRows();
      show(el("div", { class: "mx-result" }, [
        notice ? el("p", { class: "mx-notice", text: notice }) : null,
        el("article", { class: "card mx-card mx-score" }, [
          el("h1", { class: "mx-title", text: r.subject + " 模擬月考成績" }),
          el("p", { class: "mx-score__num", text: r.score + " 分" }),
          el("p", { text: "答對 " + r.correct + " / " + r.total + " 題　未作答 " + r.unanswered + " 題" + (r.timedOut ? "　（時間到自動交卷）" : "") }),
          el("p", { class: "mx-sub", text: "錯題已加入「知識弱點」。" }),
          el("div", { class: "mx-actions" }, [
            button("回模擬月考專區", "ghost", function () { renderList(); }),
            toggle
          ])
        ]),
        el("h2", { class: "mx-card__title", text: "錯題詳解" }),
        listSlot
      ]));
    }

    /* 進入頁面：超時的考卷先自動交卷；進行中的考卷接續作答。 */
    var expired = RT().settleExpired();
    if (expired) { renderResult(expired, "上次的模擬月考已超過 60 分鐘，已自動交卷，未作答的題目視為答錯。"); }
    else if (RT().active()) { renderExam(); }
    else { renderList(); }
    return root;
  }

  return { create: create };
})();
