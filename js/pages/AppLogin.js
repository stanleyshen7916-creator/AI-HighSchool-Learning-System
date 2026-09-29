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
    step: 1, studentId: null, schoolId: null, semesterIds: [],
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
     密碼，才可進入本平台使用"）。選完學生/學校/學期、按下「進入平台」後才
     要求輸入，驗證通過才呼叫 AHS.WorkspaceRuntime.setCurrent() 並導向
     index.html。

     2026-09-29 資安修正：正式站（已設定 Supabase）改由 Supabase Auth 驗證
     使用者輸入的密碼（AHS.AuthRepository.login()），瀏覽器端不再存放或比對
     密碼；密碼由管理者以 scripts/maintenance/SetAccountPasswords.js 設定。
     只有未設定 Supabase 的離線／本機開發模式（file://、測試），才沿用
     AHS.WorkspaceData 的本機開發密碼——該模式沒有任何雲端資料可保護。 */
  function stepPassword() {
    var passwordInput = el("input", {
      type: "password", class: "login-password__input", placeholder: "請輸入密碼",
      autocomplete: "current-password"
    });
    passwordInput.value = state.password || "";

    /* 顯示/隱藏密碼切換按鈕 — 使用者反映登入一直失敗但看不出是不是打錯字，
       加這顆按鈕讓學生能親眼確認自己實際輸入的內容，純前端 input type
       password/text 切換，不影響既有的密碼比對邏輯。 */
    var toggleBtn = el("button", {
      type: "button", class: "login-password__toggle",
      "aria-label": "顯示密碼", html: AHS.Icons.eye()
    });
    toggleBtn.addEventListener("click", function () {
      var showing = passwordInput.type === "text";
      passwordInput.type = showing ? "password" : "text";
      toggleBtn.setAttribute("aria-label", showing ? "顯示密碼" : "隱藏密碼");
      toggleBtn.innerHTML = showing ? AHS.Icons.eye() : AHS.Icons.eyeOff();
      passwordInput.focus();
    });

    var errorEl = state.passwordError
      ? el("p", { class: "login-error", role: "alert", text: state.passwordError })
      : null;

    var enterBtn = el("button", { type: "button", class: "login-enter-btn", text: "進入平台" });

    function fail(message) {
      state.password = "";
      state.passwordError = message;
      render();
    }

    function enter() {
      var ws = AHS.WorkspaceRuntime.setCurrent({
        studentId: state.studentId, schoolId: state.schoolId, semesterIds: state.semesterIds
      });
      if (!ws) {
        state.passwordError = "登入失敗：權限驗證未通過，請重新選擇。";
        render();
        return;
      }
      window.location.assign("index.html");
    }

    function submit() {
      if (enterBtn.disabled) { return; }
      var student = AHS.WorkspaceRuntime.findStudent(state.studentId);
      var typed = passwordInput.value;
      var auth = AHS.AuthRepository;

      if (auth && typeof auth.isConfigured === "function" && auth.isConfigured()) {
        /* 等待真實 Supabase Auth 登入（含 ensureOwnProfile() 寫入 identity
           cache）完成後才導向，避免整頁刷新時遺失尚未寫入的 identity。 */
        enterBtn.disabled = true;
        passwordInput.disabled = true;
        auth.login(student, typed).then(function (result) {
          if (result && result.ok) { enter(); return; }
          fail(result && result.reason === "network"
            ? "無法連線到登入伺服器，請確認網路後再試一次。"
            : "密碼錯誤，請再試一次。");
        });
        return;
      }

      var expected = student && student.password;
      if (!expected || typed !== expected) {
        fail("密碼錯誤，請再試一次。");
        return;
      }
      enter();
    }

    enterBtn.addEventListener("click", submit);
    passwordInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { submit(); }
    });

    var body = el("div", { class: "login-step" }, [
      backButton(3),
      el("h1", { class: "login-step__title", text: "輸入密碼" }),
      el("p", { class: "login-step__hint", text: "請輸入你的登入密碼才能進入平台。" }),
      el("div", { class: "login-password" }, [
        el("div", { class: "login-password__field" }, [passwordInput, toggleBtn]),
        errorEl
      ].filter(Boolean)),
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
