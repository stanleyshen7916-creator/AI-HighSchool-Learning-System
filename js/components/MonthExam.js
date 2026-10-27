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
    var onList = false;
    /* 2026-10-09: 雲端撈回歷次成績後（RepositorySync），停在科目列表時重畫，
       讓「作答紀錄」顯示其他裝置的成績。作答中或看結果時不打擾。 */
    window.addEventListener("ahs:repository-pulled", function () { if (onList && !RT().active()) { renderList(); } });

    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
    function show(node) { onList = false; stopTimer(); AHS.UI.mount(root, node); window.scrollTo(0, 0); }

    /* ---- 1. 科目列表 ---------------------------------------------------- */
    function renderList(notice) {
      var subjects = RT().listSubjects();
      var head = el("header", { class: "mx-head" }, [
        el("h1", { class: "mx-title", text: "模擬月考專區" }),
        el("p", { class: "mx-sub", text: "每科作答 60 分鐘，按「開始作答」後即開始計時，時間到自動交卷，未作答視為答錯。有段考考卷的科目依段考的題型、題數與配分出題（數學有選填題，輸入答案作答）；其他科 50 題。每次重新隨機出題。" })
      ]);
      var body = [head];
      if (notice) { body.push(el("p", { class: "mx-notice", text: notice })); }
      if (!subjects.length) {
        body.push(el("p", { class: "mx-empty", text: "目前的學校與學期還沒有可出題的教材。" }));
      }
      subjects.forEach(function (s) { body.push(subjectCard(s)); });
      body.push(historyCard());
      show(el("div", { class: "mx-list" }, body)); onList = true;
    }

    function subjectCard(s) {
      var range = RT().getRange(s.subject);
      var chosen = {};
      range.materialIds.forEach(function (id) { chosen[id] = true; });
      var poolText = el("span", { class: "mx-pool" });
      var srcText = el("p", { class: "mx-range-src" });
      var status = el("p", { class: "mx-status", hidden: "hidden" });

      function selected() { return s.materials.filter(function (m) { return chosen[m.materialId]; }).map(function (m) { return m.materialId; }); }
      var bp = RT().blueprintFor(s.subject);
      var KIND = { single: "單選", multi: "多選", fill: "選填" };
      function refresh() {
        var ids = selected();
        var pool = s.materials.filter(function (m) { return chosen[m.materialId]; }).reduce(function (n, m) { return n + m.count; }, 0);
        if (bp) {
          /* 2026-10-27：依段考結構出題，顯示各題型的題數是否足夠。 */
          var have = RT().poolCounts(ids);
          var need = {};
          bp.sections.forEach(function (x) { need[x.kind] = (need[x.kind] || 0) + x.count; });
          poolText.textContent = "範圍內題庫：" + Object.keys(need).map(function (k) {
            return KIND[k] + " " + have[k] + " 題" + (have[k] < need[k] ? "（不足 " + need[k] + " 題）" : "");
          }).join("、");
        } else {
          var needN = s.subject === "數學" ? 30 : 50;
          poolText.textContent = "範圍內題庫 " + pool + " 題" + (pool && pool < needN ? "（不足 " + needN + " 題，將全部出題）" : "");
        }
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
        bp ? el("p", { class: "mx-range-src", text: "試卷結構：" + bp.source + "滿分 " + RT().blueprintTotal(bp) + " 分。" }) : null,
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

      /* 2026-10-27：依段考結構分部分（js/data/MonthExamBlueprint.js），選填題輸入答案。 */
      var multiHint = function (sec) {
        if (!sec || !sec.scoring || sec.scoring === "all") { return "【多選題，全部選對才得分】"; }
        return { n2k: "【多選題，答錯 k 個選項得 (n−2k)/n 題分】", "8520": "【多選題，8-5-2-0 計分】", fifth: "【多選題，每答錯 1 個選項倒扣 1/5 題分】" }[sec.scoring];
      };
      var questions = session.items.map(function (it, idx) {
        var q = RT().findQuestion(it.qid);
        if (!q) { return null; }
        var sec = session.sections && it.section != null ? session.sections[it.section] : null;
        var head = el("p", { class: "mx-q__text", text: (idx + 1) + ". " + (it.multi ? multiHint(sec) : "") + q.question });
        var fig = q.figureSvg ? el("div", { class: "mx-q__figure", html: q.figureSvg }) : null;
        if (it.fill) {
          var prev = RT().active() ? RT().active().answers[it.qid] : session.answers[it.qid];
          var boxes = [];
          for (var k = 0; k < (it.parts || 1); k += 1) {
            boxes.push(el("input", { type: "text", class: "mx-fill__input", autocomplete: "off",
              "aria-label": "第 " + (idx + 1) + " 題" + (it.parts > 1 ? "第 " + (k + 1) + " 格" : "") + "答案",
              value: Array.isArray(prev) && prev[k] != null ? prev[k] : "" }));
          }
          boxes.forEach(function (b) {
            b.addEventListener("input", function () {
              if (!RT().answer(it.qid, boxes.map(function (x) { return x.value; }))) { finish(true); return; }
              updateProgress();
            });
          });
          return el("li", { class: "mx-q" }, [head, fig,
            el("p", { class: "mx-fill__hint", text: "選填：輸入答案（可用分數、√、π，例如 2/3、3√2；有多個值時依序以「、」分隔），" + (it.parts > 1 ? "每一格都答對" : "答對") + "才給分。" }),
            el("ol", { class: "mx-fill" }, boxes.map(function (b, k) {
              return el("li", {}, [it.parts > 1 ? el("span", { class: "mx-fill__no", text: "(" + (k + 1) + ")" }) : null, b]);
            }))
          ]);
        }
        /* 2026-10-09: 多選題可複選；選項自帶 (A) 代號時不再加字母前綴。 */
        var labeled = RT().selfLabeled(q);
        var picked = function (opt) {
          var a = RT().active() ? RT().active().answers[it.qid] : session.answers[it.qid];
          return Array.isArray(a) ? a.indexOf(opt) !== -1 : a === opt;
        };
        var btns = it.order.map(function (oi) {
          var opt = q.options[oi];
          var b = el("button", { type: "button", class: "mx-opt", text: labeled ? opt : String.fromCharCode(65 + it.order.indexOf(oi)) + ". " + opt });
          if (picked(opt)) { b.classList.add("is-picked"); }
          b.addEventListener("click", function () {
            if (!RT().answer(it.qid, opt)) { finish(true); return; }
            btns.forEach(function (x, k) { x.classList.toggle("is-picked", picked(q.options[it.order[k]])); });
            updateProgress();
          });
          return b;
        });
        return el("li", { class: "mx-q" }, [head, fig, el("div", { class: "mx-opts" }, btns)]);
      });

      /* 依部分分段：每部分一個標題（題號連續）。 */
      var body = [];
      if (session.sections) {
        session.sections.forEach(function (sec, si) {
          var items = [];
          var first = null;
          session.items.forEach(function (it, i) { if (it.section === si && questions[i]) { items.push(questions[i]); if (first == null) { first = i + 1; } } });
          if (!items.length) { return; }
          body.push(el("h2", { class: "mx-section", text: sec.title + (sec.count < sec.want ? "　範圍內只有 " + sec.count + " 題（段考 " + sec.want + " 題）" : "") }));
          body.push(el("ol", { class: "mx-qs", start: String(first) }, items));
        });
      } else {
        body.push(el("ol", { class: "mx-qs" }, questions));
      }

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
      var notes = session.sections ? el("p", { class: "mx-sub", text: "試卷結構依" + session.source })
        : session.poolSize < (session.subject === "數學" ? 30 : 50)
          ? el("p", { class: "mx-notice", text: "範圍內題庫只有 " + session.poolSize + " 題，本次全部出題。" }) : null;
      var bottom = el("div", { class: "mx-actions" }, [submitBtn.cloneNode(true)]);
      show(el("div", { class: "mx-exam" }, [bar, notes].concat(body, [bottom])));
      bottom.querySelector("button").addEventListener("click", function () { submitBtn.click(); });

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
          var pts = row.points != null && r.sections ? el("p", { class: "mx-pts", text: "得分 " + row.earned + " / " + row.points }) : null;
          if (row.fill) {
            return el("li", { class: "mx-q " + (row.correct ? "is-correct" : "is-wrong"), value: String(i + 1) }, [
              el("p", { class: "mx-q__text", text: (i + 1) + ". " + row.question }),
              (function () { var fq = RT().findQuestion(row.qid); return fq && fq.figureSvg ? el("div", { class: "mx-q__figure", html: fq.figureSvg }) : null; })(),
              pts,
              el("ul", { class: "mx-ans" }, [
                el("li", { class: "is-answer", text: "正確答案：" + row.answer }),
                el("li", { class: row.correct ? "is-answer" : "is-given", text: "你的答案：" + (row.given == null ? "未作答" : row.given) + (row.correct ? "　✔" : "　✘") })
              ]),
              row.explanation ? el("div", { class: "mx-expl" }, [el("strong", { text: "詳解　" }), el("span", { text: row.explanation })]) : null
            ]);
          }
          return el("li", { class: "mx-q " + (row.correct ? "is-correct" : "is-wrong"), value: String(i + 1) }, [
            el("p", { class: "mx-q__text", text: (i + 1) + ". " + row.question }),
            pts,
            (function () { var fq = RT().findQuestion(row.qid); return fq && fq.figureSvg ? el("div", { class: "mx-q__figure", html: fq.figureSvg }) : null; })(),
            el("ul", { class: "mx-ans" }, row.options.map(function (o, k) {
              var isAns = row.correctOptions ? row.correctOptions.indexOf(o) !== -1 : o === row.answer;
              var isGiven = row.givenOptions ? row.givenOptions.indexOf(o) !== -1 : o === row.given;
              var cls = isAns ? "is-answer" : (isGiven ? "is-given" : "");
              var label = row.correctOptions && RT().selfLabeled({ options: row.options }) ? "" : String.fromCharCode(65 + k) + ". ";
              return el("li", { class: cls, text: label + o + (isAns ? "　✔ 正確答案" : "") + (isGiven && !isAns ? "　✘ 你的答案" : "") + (isAns && isGiven && row.multi ? "（你有選）" : "") });
            })),
            row.multi && row.given != null && !row.correct ? el("p", { class: "mx-given", text: "你的答案：" + row.given + "　正確答案：" + row.answer }) : null,
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
          el("p", { class: "mx-score__num", text: (r.sections ? r.rawScore + " / " + r.maxScore : r.score) + " 分" }),
          r.sections && r.maxScore !== 100 ? el("p", { class: "mx-sub", text: "換算百分制：" + r.score + " 分" }) : null,
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
