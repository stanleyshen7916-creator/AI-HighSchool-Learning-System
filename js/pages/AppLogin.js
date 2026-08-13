/* js/pages/AppLogin.js — Sprint AI-119 (Platform Core Baseline) §2 Login
   Flow: 選擇學生 -> 選擇學校 -> 選擇學期 -> 進入平台. Fixed 3-step order,
   each step's options permission-filtered via AHS.WorkspaceRuntime
   (§6 "登入後，僅顯示：具有權限之 School／Semester"). Standalone page —
   no AHS.AppShell (not logged in yet, nothing to gate). */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  var el;
  var state = {
    step: 1, studentId: null, schoolId: null, semesterIds: [], loginPromise: null,
    /* Sprint AI-133（使用者需求：選完學生/學校/學期後，按下「進入平台」
       前需輸入密碼）。password 只在單次表單提交時短暫存在於記憶體，never
       persisted — 見 stepPassword() 自身的誠實揭露：純前端明碼比對，非
       真正資安等級保護，僅供一般訪客擋門用途（使用者已明確確認）。 */
    password: "", passwordError: null
  };

  function studentsList() { return (AHS.WorkspaceRuntime && AHS.WorkspaceRuntime.students()) || []; }

  /* displayNameFor(student) — AI-131 (real PO report): 選擇學生 used to
     always show AHS.WorkspaceData's static seed name ("Student A") even
     after the user had genuinely renamed themselves via Settings under a
     previously-picked Workspace — the rename never carried back to this
     pre-Workspace step, so re-logging in looked like the rename "didn't
     save". No Workspace is active yet here, so AHS.SettingsRuntime.get()
     (which only ever reads the CURRENT Workspace's own namespace) can't
     answer this; AHS.PersistenceAdapter.findFirstForNamespacePrefix()
     scans every namespace this studentId has ever saved a real settings
     value under and returns the first one found — real, not a guess: the
     static seed name is still the honest fallback when nothing was ever
     saved (a student who's never touched Settings). */
  function displayNameFor(student) {
    var saved = (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.findFirstForNamespacePrefix === "function")
      ? AHS.PersistenceAdapter.findFirstForNamespacePrefix(student.id + "__", "settings") : null;
    return (saved && saved.profile && saved.profile.name) ? saved.profile.name : student.name;
  }

  function stepLabel(n) {
    return n === 1 ? "選擇學生" : n === 2 ? "選擇學校" : n === 3 ? "選擇學期" : "輸入密碼";
  }

  function steps() {
    var list = el("ol", { class: "login-steps" });
    [1, 2, 3, 4].forEach(function (n) {
      list.appendChild(el("li", {
        class: "login-steps__item" + (n === state.step ? " is-active" : "") + (n < state.step ? " is-done" : "")
      }, [
        el("span", { class: "login-steps__num", text: String(n) }),
        el("span", { class: "login-steps__label", text: stepLabel(n) })
      ]));
    });
    return list;
  }

  function optionButton(label, sub, onClick) {
    var btn = el("button", { type: "button", class: "login-option" }, [
      el("span", { class: "login-option__label", text: label }),
      sub ? el("span", { class: "login-option__sub", text: sub }) : null
    ].filter(Boolean));
    btn.addEventListener("click", onClick);
    return btn;
  }

  function backButton(toStep) {
    var btn = el("button", { type: "button", class: "login-back", text: "← 上一步" });
    btn.addEventListener("click", function () { state.step = toStep; render(); });
    return btn;
  }

  function stepStudent() {
    var list = el("div", { class: "login-options" });
    var all = studentsList();
    if (!all.length) {
      list.appendChild(el("p", { class: "login-empty", text: "尚無可登入的學生資料。" }));
    }
    all.forEach(function (s) {
      list.appendChild(optionButton(displayNameFor(s), s.role === "ADMIN" ? "管理者" : "學生", function () {
        state.studentId = s.id;
        state.schoolId = null;
        state.semesterIds = [];
        state.step = 2;
        /* Sprint AI-126B Part 2, Task 2 / AI Supabase Persistence Root
           Cause Fix (Root Cause C): real Supabase Auth login, fired
           invisibly the moment this Student is picked (no UI change —
           see js/repository/AuthRepository.js's own header for why this
           is the only way "真實 Email Login" + "保持目前 Login UI" can
           both hold). loginForMockStudent() always resolves (its own
           internal .catch() turns a real failure into a resolved
           { error } result, never a rejection) — state.loginPromise is
           therefore a real completion signal, not a fire-and-forget void
           call: stepSemester()'s "進入平台" now waits on this exact
           Promise before navigating away (see that handler's own
           comment), closing the race where a full-page navigation could
           fire before AHS.SyncBridge.cacheIdentity() ever ran. null when
           Supabase isn't configured — "進入平台" then behaves exactly as
           before this fix (no wait). */
        state.loginPromise = (AHS.AuthRepository && typeof AHS.AuthRepository.loginForMockStudent === "function")
          ? AHS.AuthRepository.loginForMockStudent(s).catch(function () { /* never rejects in practice; defensive only */ })
          : null;
        render();
      }));
    });
    return el("div", { class: "login-step" }, [
      el("h1", { class: "login-step__title", text: "選擇學生" }),
      list
    ]);
  }

  function stepSchool() {
    var schools = (AHS.WorkspaceRuntime && AHS.WorkspaceRuntime.schoolsFor(state.studentId)) || [];
    var list = el("div", { class: "login-options" });
    if (!schools.length) {
      list.appendChild(el("p", { class: "login-empty", text: "此學生尚未被授權任何學校，請聯絡管理者。" }));
    }
    schools.forEach(function (sc) {
      list.appendChild(optionButton(sc.name, null, function () {
        state.schoolId = sc.id;
        state.semesterIds = [];
        state.step = 3;
        render();
      }));
    });
    return el("div", { class: "login-step" }, [
      backButton(1),
      el("h1", { class: "login-step__title", text: "選擇學校" }),
      list
    ]);
  }

  function stepSemester() {
    var semesters = (AHS.WorkspaceRuntime && AHS.WorkspaceRuntime.semestersFor(state.studentId)) || [];
    var list = el("div", { class: "login-options login-options--check" });
    if (!semesters.length) {
      list.appendChild(el("p", { class: "login-empty", text: "此學生在此學校尚未被授權任何學期，請聯絡管理者。" }));
    }
    semesters.forEach(function (sem) {
      var isChecked = state.semesterIds.indexOf(sem.id) !== -1;
      var btn = el("button", {
        type: "button",
        class: "login-option login-option--check" + (isChecked ? " is-checked" : ""),
        "aria-pressed": isChecked ? "true" : "false"
      }, [
        el("span", { class: "login-option__check", "aria-hidden": "true" }),
        el("span", { class: "login-option__label", text: sem.name })
      ]);
      btn.addEventListener("click", function () {
        var idx = state.semesterIds.indexOf(sem.id);
        if (idx === -1) { state.semesterIds.push(sem.id); } else { state.semesterIds.splice(idx, 1); }
        render();
      });
      list.appendChild(btn);
    });
    var enterBtn = el("button", {
      type: "button",
      class: "login-enter-btn",
      disabled: state.semesterIds.length ? null : "disabled",
      text: "進入平台"
    });
    enterBtn.addEventListener("click", function () {
      if (!state.semesterIds.length || enterBtn.disabled) { return; }
      /* Sprint AI-133：真正的 setCurrent()／導向 index.html 動作，移到
         新增的第 4 步（stepPassword）——這裡只負責前進到密碼輸入步驟。 */
      state.password = "";
      state.passwordError = null;
      state.step = 4;
      render();
    });
    return el("div", { class: "login-step" }, [
      backButton(2),
      el("h1", { class: "login-step__title", text: "選擇學期（可複選）" }),
      list,
      enterBtn
    ]);
  }

  /* stepPassword() — Sprint AI-133（真實 PO 需求："首頁登入畫面後，需輸入
     密碼，才可進入本平台使用"）。密碼統一為 "1234"（測試期間使用者確認
     方案，見 AHS.WorkspaceData.students[].password），選完學生/學校/學期、按下
     「進入平台」後才要求輸入，答對才真的呼叫 AHS.WorkspaceRuntime.
     setCurrent() 並導向 index.html——這一步之前，setCurrent() 完全不會
     被呼叫，即使跳過畫面直接改網址也一樣（AppShell.create() 本來就會在
     沒有有效 Workspace 時導回 login.html，這裡沒有新增/修改那個既有把關）。
     誠實揭露：純前端明碼比對，技術上可被繞過，只作為一般訪客擋門用途
     （使用者已在需求討論中明確確認接受這個定位，非真正資安等級保護）。 */
  function stepPassword() {
    var passwordInput = el("input", {
      type: "password", class: "login-password__input", placeholder: "請輸入密碼",
      autocomplete: "current-password"
    });
    passwordInput.value = state.password || "";

    var errorEl = state.passwordError
      ? el("p", { class: "login-error", role: "alert", text: state.passwordError })
      : null;

    var enterBtn = el("button", { type: "button", class: "login-enter-btn", text: "進入平台" });

    function submit() {
      var student = AHS.WorkspaceRuntime.findStudent(state.studentId);
      var expected = student && student.password;
      if (!expected || passwordInput.value !== expected) {
        state.password = "";
        state.passwordError = "密碼錯誤，請再試一次。";
        render();
        return;
      }
      var ws = AHS.WorkspaceRuntime.setCurrent({
        studentId: state.studentId, schoolId: state.schoolId, semesterIds: state.semesterIds
      });
      if (!ws) {
        state.passwordError = "登入失敗：權限驗證未通過，請重新選擇。";
        render();
        return;
      }
      /* AI Supabase Persistence Root Cause Fix (Root Cause C)：同既有邏輯
         （原本掛在選學期步驟的「進入平台」上），等待真實 Supabase Auth
         登入鏈完成後才導向，避免整頁刷新時遺失尚未寫入的 identity cache。
         state.loginPromise 未設定 Supabase 時為 null，Promise.resolve(null)
         下一個 microtask 就會 resolve，行為等同立即導向。 */
      enterBtn.disabled = true;
      passwordInput.disabled = true;
      Promise.resolve(state.loginPromise).then(function () {
        window.location.assign("index.html");
      });
    }

    enterBtn.addEventListener("click", submit);
    passwordInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { submit(); }
    });

    var body = el("div", { class: "login-step" }, [
      backButton(3),
      el("h1", { class: "login-step__title", text: "輸入密碼" }),
      el("p", { class: "login-step__hint", text: "請輸入你的登入密碼才能進入平台。" }),
      el("div", { class: "login-password" }, [passwordInput, errorEl].filter(Boolean)),
      enterBtn
    ]);
    setTimeout(function () { passwordInput.focus(); }, 0);
    return body;
  }

  function render() {
    var app = document.getElementById("app");
    if (!app) { return; }
    var stepBody = state.step === 1 ? stepStudent()
      : state.step === 2 ? stepSchool()
      : state.step === 3 ? stepSemester()
      : stepPassword();
    var card = el("div", { class: "login-card" }, [
      el("div", { class: "login-card__brand" }, [
        el("span", { class: "login-card__logo", html: AHS.Icons.book() }),
        el("strong", { text: "AI 高中學習系統" })
      ]),
      steps(),
      stepBody
    ]);
    AHS.UI.mount(app, el("div", { class: "login-page" }, [card]));
  }

  function coreReady() {
    return !!(window.AHS && AHS.UI && typeof AHS.UI.el === "function" && AHS.Icons &&
      AHS.WorkspaceRuntime && typeof AHS.WorkspaceRuntime.setCurrent === "function");
  }

  function guardedInit() {
    var app = document.getElementById("app");
    if (!coreReady()) {
      if (app) { app.textContent = "系統資源載入失敗，請重新整理。"; }
      if (window.console && console.warn) { console.warn("AHS core not ready — Login page mount aborted."); }
      return;
    }
    el = AHS.UI.el;
    /* 已登入（有效 Workspace）者直接進平台，不必重走 Login —— 換 Workspace
       走 Topbar 的快速切換（§7），Login 頁只負責「初次進入」。 */
    if (AHS.WorkspaceRuntime.isLoggedIn()) {
      window.location.assign("index.html");
      return;
    }
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", guardedInit);
  } else {
    guardedInit();
  }
})();
