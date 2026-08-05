/* js/ui/SettingsPanel.js — Sprint AI-113 · AI-804 Settings + AI-805 User
   Menu. One real, shared modal — mounted once per page by AppShell.js,
   opened from either the Sidebar's existing 設定 button or the Profile
   menu's existing Settings item (both previously Mock/no-op, per
   js/ui/AppShell.js's own Sprint AI-107 RC-01 comment). No new page,
   no redesign of any existing page's layout — this is a dialog overlay
   like js/ui/MaterialUploadDialog.js already establishes.

   Every control here does something real:
     - Profile: writes AHS.SettingsRuntime (real, persisted), patches
       the live topbar name/grade text directly (no reload needed).
     - Learning: toggles AHS.SettingsRuntime.showTutorSuggestions, read
       by AiTutorHomeCard's caller (AppHome.js) and TutorContextTip.js.
     - AI: real, read-only status from AHS.AppConfig.aiGateway (never a
       fabricated "connected").
     - Repository: real counts from AHS.MaterialRepository /
       AHS.TeachingMaterialData, with a real "reload" action that calls
       the existing AHS.TeachingMaterialLoader.load().
     - Data: real Backup/Restore (full session, via
       AHS.PersistenceAdapter.exportAll()/importAll()) and Export/Import
       (學習紀錄 only, via WrongBookRuntime/HistoryRuntime's own
       importRecords()) — real file downloads (AHS.DocumentExport.
       downloadBlob, the same mechanism already used for real material
       downloads) and real file reads (FileReader, a local-file API, not
       network — not the forbidden fetch()/XHR). */
window.AHS = window.AHS || {};
AHS.SettingsPanel = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined;

  var GRADES = ["高一", "高二", "高三", "高中生"];

  function statusLine(text, ok) {
    var line = el("p", {
      class: "settings-panel__status" + (ok === false ? " is-error" : ""),
      role: "status"
    }, [el("span", { text: text })]);
    return line;
  }

  function setStatus(node, text, ok) {
    node.textContent = text;
    node.classList.toggle("is-error", ok === false);
  }

  /* ---- Profile ---------------------------------------------------- */
  function profileSection() {
    var settings = AHS.SettingsRuntime.get();
    var nameInput = el("input", {
      class: "settings-panel__input", type: "text", value: settings.profile.name || "",
      "aria-label": "顯示名稱", maxlength: "20"
    });
    var gradeSelect = el("select", { class: "settings-panel__input", "aria-label": "年級" },
      GRADES.map(function (g) {
        return el("option", { value: g, selected: g === settings.profile.grade ? "selected" : null, text: g });
      }));
    var status = statusLine("");
    var saveBtn = el("button", { type: "button", class: "settings-panel__btn settings-panel__btn--primary", text: "儲存" });
    saveBtn.addEventListener("click", function () {
      var name = String(nameInput.value || "").trim();
      if (!name) { setStatus(status, "顯示名稱不可為空白", false); return; }
      var next = AHS.SettingsRuntime.update({ profile: { name: name, grade: gradeSelect.value } });
      var nameEl = document.querySelector(".topbar__user-meta strong");
      var gradeEl = document.querySelector(".topbar__user-meta small");
      if (nameEl) { nameEl.textContent = next.profile.name; }
      if (gradeEl) { gradeEl.textContent = next.profile.grade; }
      setStatus(status, "已儲存");
    });

    return el("section", { class: "settings-panel__section", "aria-label": "Profile" }, [
      el("h3", { class: "settings-panel__title", text: "Profile" }),
      el("label", { class: "settings-panel__field" }, [el("span", { text: "顯示名稱" }), nameInput]),
      el("label", { class: "settings-panel__field" }, [el("span", { text: "年級" }), gradeSelect]),
      el("div", { class: "settings-panel__actions" }, [saveBtn]),
      status
    ]);
  }

  /* ---- Learning ------------------------------------------------------ */
  function learningSection() {
    var settings = AHS.SettingsRuntime.get();
    var toggle = el("input", { type: "checkbox", class: "settings-panel__checkbox" });
    toggle.checked = settings.showTutorSuggestions !== false;
    var status = statusLine("");
    toggle.addEventListener("change", function () {
      AHS.SettingsRuntime.update({ showTutorSuggestions: toggle.checked });
      setStatus(status, "已儲存，重新整理頁面後套用於首頁與各頁面的 AI 建議卡片");
    });

    return el("section", { class: "settings-panel__section", "aria-label": "Learning" }, [
      el("h3", { class: "settings-panel__title", text: "Learning" }),
      el("label", { class: "settings-panel__field settings-panel__field--row" }, [
        toggle, el("span", { text: "顯示 AI 巧巧老師建議卡片（首頁／教材中心／學習總結／測驗中心／知識弱點／複習中心）" })
      ]),
      status
    ]);
  }

  /* ---- AI -------------------------------------------------------------- */
  function aiSection() {
    var gw = (AHS.AppConfig && AHS.AppConfig.aiGateway) || {};
    var configured = !!gw.endpoint;
    return el("section", { class: "settings-panel__section", "aria-label": "AI" }, [
      el("h3", { class: "settings-panel__title", text: "AI" }),
      el("p", { class: "settings-panel__info", text: "AI 學習總結引擎：已啟用（正式）" }),
      el("p", { class: "settings-panel__info", text: "AI Gateway：" + (configured ? "已設定（" + gw.provider + "）" : "尚未設定 Endpoint（AI Gateway 相關功能維持既有離線狀態）") }),
      configured ? el("p", { class: "settings-panel__info", text: "Model：" + (gw.model || "使用伺服器預設") }) : null
    ].filter(Boolean));
  }

  /* ---- Repository ------------------------------------------------------ */
  /* Sprint AI-115 AI-115-07: Repository Status (Dashboard) — real
     per-lifecycle-stage Package counts from AHS.RepositoryStatus
     (js/data/RepositoryStatus.js, generated offline by
     GenerateTeachingMaterialData.js from docs/TeachingMaterials/
     scripts/MaterialLifecycle.js's own countByStage() — this static
     prototype has no fetch/backend, so this is the only honest way the
     browser can ever see RAW/ANALYZING/CLAUDE_READY/READY_FOR_IMPORT
     counts at all, since those Packages are, by definition, not yet in
     the Runtime-visible js/data/TeachingMaterialData.js). Degrades to a
     hidden section (never a fabricated "0 everything") when the data
     file isn't loaded on a given page. */
  var STAGE_LABELS = [
    ["RAW", "RAW"], ["ANALYZING", "分析中"], ["CLAUDE_READY", "Claude 已完成"],
    ["READY_FOR_IMPORT", "待匯入"], ["IMPORTED", "已匯入"], ["ARCHIVED", "已封存"]
  ];

  function repositoryStatusLine() {
    if (!AHS.RepositoryStatus || !AHS.RepositoryStatus.counts) { return null; }
    var counts = AHS.RepositoryStatus.counts;
    var text = STAGE_LABELS.map(function (pair) {
      return pair[1] + "：" + (counts[pair[0]] || 0);
    }).join("｜");
    return el("p", { class: "settings-panel__info", text: "Repository Status — " + text });
  }

  /* workspaceRepositoryLine() — Sprint AI-120 (Workspace Repository
     Integration) AI-120-07: real School／Semester／Subject／Material
     Count／Question Count for the Current Workspace, so Settings ->
     Repository doubles as a real per-Workspace management view
     ("方便管理教材"). Question Count reuses the exact
     "teaching_material_" + materialId examId convention MaterialCard.js's
     own 前往考前練習 link and TeachingMaterialLoader.js already build —
     not a second, invented id scheme. 最近教材時間 is the real max
     material.date across Current Workspace's own materials (never a
     fabricated "import" timestamp — no such event is actually recorded
     anywhere in this static, no-backend app). */
  function questionCountForCurrentWorkspace(materials) {
    if (!AHS.QuestionRuntime || typeof AHS.QuestionRuntime.getSet !== "function") { return 0; }
    var total = 0;
    materials.forEach(function (m) {
      var examId = "teaching_material_" + m.id;
      if (typeof AHS.QuestionRuntime.hasExam === "function" && AHS.QuestionRuntime.hasExam(examId)) {
        total += AHS.QuestionRuntime.getSet(examId).length;
      }
    });
    return total;
  }

  function workspaceRepositoryLine() {
    if (!AHS.WorkspaceRuntime || typeof AHS.WorkspaceRuntime.label !== "function") { return null; }
    var ws = AHS.WorkspaceRuntime.label();
    if (!ws) { return null; }
    var materials = (AHS.MaterialRuntime && typeof AHS.MaterialRuntime.list === "function")
      ? AHS.MaterialRuntime.list() : [];
    var bySubject = {};
    materials.forEach(function (m) {
      var key = m.subject || "unknown";
      bySubject[key] = (bySubject[key] || 0) + 1;
    });
    var subjectText = Object.keys(bySubject).map(function (key) {
      var subj = (AHS.Subjects && AHS.Subjects[key]) || { name: key };
      return subj.name + " " + bySubject[key];
    }).join("、") || "（尚無教材）";
    var latestDate = materials.reduce(function (max, m) { return (m.date && m.date > max) ? m.date : max; }, "");
    var lines = [
      "School：" + ws.schoolName,
      "Semester：" + ws.semesterNames.join("、"),
      "Subject：" + subjectText,
      "Material Count：" + materials.length,
      "Question Count：" + questionCountForCurrentWorkspace(materials)
    ];
    if (latestDate) { lines.push("最近教材時間：" + latestDate); }
    return el("p", { class: "settings-panel__info", text: lines.join("｜") });
  }

  function repositorySection() {
    var countLine = el("p", { class: "settings-panel__info" });
    var workspaceLine = el("div", { class: "settings-panel__repo-workspace" });
    var statusBlock = el("div", { class: "settings-panel__repo-status" });
    var status = statusLine("");
    function refreshCounts() {
      var repoCount = (AHS.MaterialRepository && typeof AHS.MaterialRepository.list === "function")
        ? AHS.MaterialRepository.list().length : 0;
      var packageCount = Array.isArray(AHS.TeachingMaterialData) ? AHS.TeachingMaterialData.length : 0;
      countLine.textContent = "Repository 教材：" + repoCount + " 筆｜Package 教材：" + packageCount + " 筆";
      workspaceLine.innerHTML = "";
      var wsLine = workspaceRepositoryLine();
      if (wsLine) { workspaceLine.appendChild(wsLine); }
      statusBlock.innerHTML = "";
      var line = repositoryStatusLine();
      if (line) { statusBlock.appendChild(line); }
    }
    refreshCounts();

    var reloadBtn = el("button", { type: "button", class: "settings-panel__btn", text: "重新載入 Repository" });
    reloadBtn.addEventListener("click", function () {
      var loader = AHS.TeachingMaterialLoader;
      if (loader && typeof loader.load === "function") { loader.load(); }
      else if (loader && typeof loader.initialize === "function") { loader.initialize(); }
      refreshCounts();
      setStatus(status, "已重新載入");
    });

    return el("section", { class: "settings-panel__section", "aria-label": "Repository" }, [
      el("h3", { class: "settings-panel__title", text: "Repository" }),
      countLine,
      workspaceLine,
      statusBlock,
      el("div", { class: "settings-panel__actions" }, [reloadBtn]),
      status
    ]);
  }

  /* ---- Data：Backup / Restore / Export / Import ------------------------ */
  function downloadJson(data, filename) {
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    AHS.DocumentExport.downloadBlob(blob, filename);
  }

  function readJsonFile(file, onDone) {
    var reader = new FileReader();
    reader.onload = function () {
      try { onDone(JSON.parse(String(reader.result)), null); }
      catch (e) { onDone(null, "檔案內容不是有效的 JSON"); }
    };
    reader.onerror = function () { onDone(null, "檔案讀取失敗"); };
    reader.readAsText(file);
  }

  function timestamp() {
    var d = new Date();
    function p(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes());
  }

  function dataSection() {
    var status = statusLine("");

    var backupBtn = el("button", { type: "button", class: "settings-panel__btn", text: "備份全部資料" });
    backupBtn.addEventListener("click", function () {
      var data = AHS.PersistenceAdapter.exportAll();
      downloadJson(data, "ahs-backup-" + timestamp() + ".json");
      setStatus(status, "已下載完整備份檔");
    });

    var restoreInput = el("input", { type: "file", accept: "application/json", hidden: "hidden" });
    var restoreBtn = el("button", { type: "button", class: "settings-panel__btn", text: "還原全部資料" });
    restoreBtn.addEventListener("click", function () { restoreInput.click(); });
    restoreInput.addEventListener("change", function () {
      var file = restoreInput.files && restoreInput.files[0];
      restoreInput.value = "";
      if (!file) { return; }
      if (!window.confirm("還原將會覆蓋目前工作階段的所有資料，確定要繼續嗎？")) { return; }
      readJsonFile(file, function (data, err) {
        if (err) { setStatus(status, err, false); return; }
        AHS.PersistenceAdapter.clear();
        var count = AHS.PersistenceAdapter.importAll(data);
        setStatus(status, "已還原 " + count + " 項資料，頁面即將重新整理");
        window.setTimeout(function () { window.location.reload(); }, 800);
      });
    });

    var exportBtn = el("button", { type: "button", class: "settings-panel__btn", text: "匯出學習紀錄" });
    exportBtn.addEventListener("click", function () {
      var data = {
        wrongBook: (AHS.WrongBookRuntime && AHS.WrongBookRuntime.list) ? AHS.WrongBookRuntime.list() : [],
        history: (AHS.HistoryRuntime && AHS.HistoryRuntime.list) ? AHS.HistoryRuntime.list() : []
      };
      downloadJson(data, "ahs-learning-record-" + timestamp() + ".json");
      setStatus(status, "已下載學習紀錄");
    });

    var importInput = el("input", { type: "file", accept: "application/json", hidden: "hidden" });
    var importBtn = el("button", { type: "button", class: "settings-panel__btn", text: "匯入學習紀錄" });
    importBtn.addEventListener("click", function () { importInput.click(); });
    importInput.addEventListener("change", function () {
      var file = importInput.files && importInput.files[0];
      importInput.value = "";
      if (!file) { return; }
      readJsonFile(file, function (data, err) {
        if (err) { setStatus(status, err, false); return; }
        var wbCount = (AHS.WrongBookRuntime && typeof AHS.WrongBookRuntime.importRecords === "function")
          ? AHS.WrongBookRuntime.importRecords(data.wrongBook) : 0;
        var histCount = (AHS.HistoryRuntime && typeof AHS.HistoryRuntime.importRecords === "function")
          ? AHS.HistoryRuntime.importRecords(data.history) : 0;
        setStatus(status, "已匯入 " + wbCount + " 筆錯題、" + histCount + " 筆測驗紀錄，頁面即將重新整理");
        window.setTimeout(function () { window.location.reload(); }, 800);
      });
    });

    return el("section", { class: "settings-panel__section", "aria-label": "Backup / Restore / Export / Import" }, [
      el("h3", { class: "settings-panel__title", text: "Backup / Restore / Export / Import" }),
      el("p", { class: "settings-panel__hint", text: "備份／還原：完整工作階段資料。匯出／匯入：僅學習紀錄（知識弱點＋測驗歷史）。" }),
      el("div", { class: "settings-panel__actions" }, [backupBtn, restoreBtn, exportBtn, importBtn]),
      restoreInput, importInput,
      status
    ]);
  }

  /* create() — returns { root, open, close }. root starts hidden;
     AppShell mounts it once per page. */
  function create() {
    if (!el) { return null; }

    var closeBtn = el("button", { type: "button", class: "settings-panel__close", "aria-label": "關閉設定" }, [
      el("span", { html: AHS.Icons.close ? AHS.Icons.close() : "×" })
    ]);

    var dialog = el("div", { class: "settings-panel__dialog", role: "dialog", "aria-modal": "true", "aria-label": "設定" }, [
      el("div", { class: "settings-panel__head" }, [
        el("h2", { class: "settings-panel__heading", text: "設定" }),
        closeBtn
      ]),
      el("div", { class: "settings-panel__body" }, [
        profileSection(),
        learningSection(),
        aiSection(),
        repositorySection(),
        dataSection()
      ])
    ]);

    var overlay = el("div", { class: "settings-panel__overlay", hidden: "hidden" }, [dialog]);

    function close() { overlay.setAttribute("hidden", "hidden"); }
    function open() { overlay.removeAttribute("hidden"); }

    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) { close(); } });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !overlay.hasAttribute("hidden")) { close(); }
    });

    return { root: overlay, open: open, close: close };
  }

  return { create: create };
})();
