/* components/MaterialCenter.js — 教材中心 (Material Center) page.
   Subject filter panel + toolbar (categories / grade / sort / format /
   grid-list toggle) + material card grid + upload dropzone + recent files.
   Beta: all material data (list / upload / delete / favorite / search /
   filter / sort / recent) is driven by AHS.MaterialRuntime (in-memory,
   starts empty). AHS.AppConfig.materials is used ONLY as Developer Seed Data
   for static config/labels (e.g. filter option lists), never as the
   material list. PascalCase component under window.AHS.
   File-type colors for recent files. */
window.AHS = window.AHS || {};
AHS.MaterialCenter = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  var FILE_TONE = {
    PDF: "#ef4444", PPT: "#f59e0b", DOCX: "#3b82f6",
    XLSX: "#22b573", MP4: "#7c5cff"
  };

  /* ---- Header ---------------------------------------------------------- */
  function header(data, searchBar) {
    /* M001: Title/Subtitle delegated to AHS.MaterialHeader.
       M002/M013: Search Bar instance is created by the integrator
       (create() below) so its callback + clear() are wired into the
       unified filter pipeline. Same combined layout — no visual change. */
    return el("div", { class: "mat-header" }, [
      AHS.MaterialHeader.create(data),
      searchBar
    ]);
  }

  /* ---- Subject filter panel ------------------------------------------- */
  function subjectPanel(data, onPick) {
    var buttons = [];
    function makeBtn(id, label, count, isAll) {
      var subj = isAll ? null : AHS.Subjects[id];
      var row = el("button", {
        type: "button",
        class: "subj-filter__item" + (isAll ? " is-active" : ""),
        "data-id": id
      }, [
        subj
          ? el("span", { class: "subj-filter__dot", "aria-hidden": "true",
              style: "background-color:" + subj.hex })
          : el("span", { class: "subj-filter__dot subj-filter__dot--all",
              "aria-hidden": "true" }),
        el("span", { class: "subj-filter__name", text: label }),
        count != null
          ? el("span", { class: "subj-filter__count", text: String(count) })
          : null
      ]);
      row.addEventListener("click", function () {
        buttons.forEach(function (b) { b.classList.remove("is-active"); });
        row.classList.add("is-active");
        onPick(id);
      });
      buttons.push(row);
      return row;
    }

    var list = el("div", { class: "subj-filter__list" }, [
      makeBtn("all", "全部科目", null, true)
    ]);
    data.subjectCounts.forEach(function (s) {
      list.appendChild(makeBtn(s.subject, AHS.Subjects[s.subject].name, s.count, false));
    });

    return el("aside", { class: "subj-filter card", "aria-label": "科目篩選" }, [
      el("h2", { class: "subj-filter__title", text: "科目" }),
      list
    ]);
  }

  /* ---- Toolbar --------------------------------------------------------- */
  function toolbar(data, onView, onGrade, onFormat) {
    function select(label, options, onChange) {
      var sel = el("select", { class: "mat-select__control", "aria-label": label },
        options.map(function (o) { return el("option", { text: o }); }));
      if (typeof onChange === "function") {
        sel.addEventListener("change", function () { onChange(sel.value); });
      }
      return el("label", { class: "mat-select" }, [
        el("span", { class: "mat-select__label", text: label }),
        sel
      ]);
    }

    var gridBtn = el("button", {
      type: "button", class: "mat-toolbar__view is-active",
      "aria-label": "格狀檢視", "aria-pressed": "true", html: AHS.Icons.dashboard()
    });
    var listBtn = el("button", {
      type: "button", class: "mat-toolbar__view",
      "aria-label": "列表檢視", "aria-pressed": "false", html: AHS.Icons.summary()
    });
    gridBtn.addEventListener("click", function () {
      gridBtn.classList.add("is-active"); gridBtn.setAttribute("aria-pressed", "true");
      listBtn.classList.remove("is-active"); listBtn.setAttribute("aria-pressed", "false");
      onView("grid");
    });
    listBtn.addEventListener("click", function () {
      listBtn.classList.add("is-active"); listBtn.setAttribute("aria-pressed", "true");
      gridBtn.classList.remove("is-active"); gridBtn.setAttribute("aria-pressed", "false");
      onView("list");
    });

    return el("div", { class: "mat-toolbar" }, [
      el("div", { class: "mat-toolbar__selects" }, [
        select("年級", ["全部年級"].concat(data.grades), onGrade),
        select("排序", data.sorts),
        select("格式", data.formats, onFormat),
        el("div", { class: "mat-toolbar__views" }, [gridBtn, listBtn])
      ])
    ]);
  }

  /* ---- Material grid (M005/M006 delegated to AHS.MaterialGrid / AHS.MaterialCard) */

  /* ---- Chapter filter panel (MAT-F003) --------------------------------- */
  /* Chapters shown depend on the currently selected subject; "全部章節"
     resets to showing every chapter under that subject scope. */
  function chaptersForSubject(data, subjectId) {
    var chapters = [];
    data.items.forEach(function (item) {
      var inScope = subjectId === "all" || item.subject === subjectId;
      if (inScope && chapters.indexOf(item.chapter) === -1) {
        chapters.push(item.chapter);
      }
    });
    return chapters;
  }

  function chapterPanel(data, subjectId, onPick) {
    var buttons = [];
    function makeBtn(id, label, isAll) {
      var btn = el("button", {
        type: "button",
        class: "chapter-filter__item" + (isAll ? " is-active" : ""),
        "data-chapter-id": id
      }, [el("span", { text: label })]);
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        onPick(id);
      });
      buttons.push(btn);
      return btn;
    }

    var list = el("div", { class: "chapter-filter__list" }, [makeBtn("all", "全部章節", true)]);
    chaptersForSubject(data, subjectId).forEach(function (c) {
      list.appendChild(makeBtn(c, c, false));
    });

    return el("div", { class: "chapter-filter", "aria-label": "章節篩選" }, [
      el("h3", { class: "chapter-filter__title", text: "章節" }),
      list
    ]);
  }

  /* ---- Upload panel + recent files ------------------------------------
     Runtime Migration: real <input type="file"> + File Picker; picked
     files are handed to onFilesPicked (which writes to runtime). No
     server, memory only. */
  function uploadPanel(status, onFilesPicked) {
    var fileInput = el("input", {
      type: "file",
      class: "upload__input",
      multiple: "multiple",
      "aria-hidden": "true",
      tabindex: "-1"
    });
    fileInput.style.display = "none";
    fileInput.addEventListener("change", function () {
      if (typeof onFilesPicked === "function") { onFilesPicked(fileInput.files); }
      /* Reset so picking the same file again re-triggers change. */
      fileInput.value = "";
    });

    function openPicker() { fileInput.click(); }

    var pick = el("button", { type: "button", class: "upload__pick", text: "選擇檔案" });
    pick.addEventListener("click", openPicker);

    var drop = el("div", { class: "upload__drop" }, [
      el("span", { class: "upload__drop-icon", html: AHS.Icons.download() }),
      el("p", { class: "upload__drop-text", text: "拖曳檔案到此處，或點擊上傳" }),
      el("p", { class: "upload__drop-hint", text: "支援 PDF、PPT、DOCX、MP4 等格式" }),
      pick,
      fileInput
    ]);

    /* Drag & drop also feeds the same runtime path. */
    drop.addEventListener("dragover", function (e) { e.preventDefault(); drop.classList.add("is-dragover"); });
    drop.addEventListener("dragleave", function () { drop.classList.remove("is-dragover"); });
    drop.addEventListener("drop", function (e) {
      e.preventDefault();
      drop.classList.remove("is-dragover");
      if (e.dataTransfer && typeof onFilesPicked === "function") {
        onFilesPicked(e.dataTransfer.files);
      }
    });

    var root = el("section", { class: "card upload", "aria-label": "上傳教材" }, [
      el("h2", { class: "card__title", text: "上傳教材" }),
      drop
    ]);

    /* The Upload Panel is now the single upload entry (BUG-011); the
       panel's own "選擇檔案" button drives openPicker internally. */
    return { root: root };
  }

  /* recentFilesFromRuntime — mirrors uploaded materials (newest first),
     replacing the old AHS.AppConfig.recentFiles seed list. onOpen(id) opens
     the material (Bug 002). */
  function recentFilesFromRuntime(status, onOpen) {
    var recent = AHS.MaterialRuntime.recentByCreatedOrder();
    var body;
    if (recent.length === 0) {
      body = el("p", { class: "today-card__empty", text: "尚無檔案" });
    } else {
      body = el("div", { class: "recent-files__list" }, recent.map(function (m) {
        var tone = FILE_TONE[m.fileType] || "#6b7280";
        var row = el("button", { type: "button", class: "recent-file" }, [
          el("span", {
            class: "recent-file__badge",
            style: "color:" + tone + ";background-color:" + tone + "1a",
            text: m.fileType
          }),
          el("span", { class: "recent-file__meta" }, [
            el("span", { class: "recent-file__name", text: m.fileName || m.title }),
            el("span", { class: "recent-file__sub", text: m.fileType + (m.fileSize ? " · " + m.fileSize : "") + " · " + m.date })
          ]),
          el("span", { class: "recent-file__dl", html: AHS.Icons.download() })
        ]);
        row.addEventListener("click", function () {
          if (typeof onOpen === "function") { onOpen(m.id); }
        });
        return row;
      }));
    }

    return el("section", { class: "card recent-files", "aria-label": "最近檔案" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "最近檔案" })
      ]),
      body
    ]);
  }

  function fileExt(name) {
    var m = /\.([a-zA-Z0-9]+)$/.exec(name || "");
    return m ? m[1].toUpperCase() : "FILE";
  }

  function formatSize(bytes) {
    if (typeof bytes !== "number" || isNaN(bytes) || bytes <= 0) { return ""; }
    if (bytes < 1024) { return bytes + " B"; }
    if (bytes < 1024 * 1024) { return Math.round(bytes / 1024) + " KB"; }
    return (Math.round(bytes / (1024 * 1024) * 10) / 10) + " MB";
  }

  /* create() — Runtime Migration: Material Center now reads/writes
     AHS.MaterialRuntime (starts empty), NOT AHS.AppConfig.materials. Mock is
     kept only as Developer Seed Data for other modules. `data` below is
     used ONLY for static config still sourced from seed (title/subtitle,
     subjectCounts labels, grades, sorts) — never for the item list. */
  function create() {
    var seed = AHS.AppConfig.materials; /* 正式 UI config：標籤/選項，零模擬資料。 */
    /* EO-S7.0-003: per-subject counts are REAL — derived live from
       MaterialRuntime, never faked (the old Mock 128/156… numbers are
       gone). */
    if (AHS.MaterialRuntime && typeof AHS.MaterialRuntime.list === "function") {
      var realCounts = {};
      AHS.MaterialRuntime.list().forEach(function (m) {
        realCounts[m.subject] = (realCounts[m.subject] || 0) + 1;
      });
      seed = Object.assign({}, seed, {
        subjectCounts: seed.subjectCounts.map(function (c) {
          return { subject: c.subject, count: realCounts[c.subject] || 0 };
        })
      });
    }
    var status = el("p", {
      class: "mat-status", "aria-live": "polite", hidden: "hidden"
    });

    function runtimeItems() { return AHS.MaterialRuntime.list(); }

    /* Recent Learning — Runtime-driven (created-order). Rendered into a
       slot so it can refresh / hide on every runtime change. */
    var recentLearningSlot = el("div", { class: "mat-recent-learning-slot" });

    /* Grid starts empty (runtime is empty on first open); renderGrid()
       rebuilds it as a grouped layout on every change. */
    var theGrid = AHS.MaterialGrid.create([], status, {});
    var emptyState = el("div", { class: "mat-grid__empty-slot", hidden: "hidden" });

    var currentSubject = "all";
    var currentChapter = "all";
    var currentFilter = { subject: "all", grade: "all", status: "all" };
    var currentSort = "newest";
    var currentSearch = "";
    var currentCategory = "all";
    var currentFolder = "all"; /* "all" | null (未分類) | folderId */
    var currentFavoriteOnly = false;
    var currentToolbarGrade = "all"; /* RC-003-001 toolbar 年級 */
    var currentFormat = "all";       /* RC-003-001 toolbar 格式 */
    var searchLoadingTimer = null;

    /* computeVisibleItems() — returns the filtered list (NOT sorted here;
       RC-006 sorts per-group inside the grid). Applies: left-sidebar
       subject/chapter, Filter Panel (subject/grade/status), top category
       tab (RC-002), folder filter (BUG-010-006), favorite-only, and
       keyword search (which also matches a material's folder name). */
    function computeVisibleItems() {
      var keyword = currentSearch.trim().toLowerCase();

      return runtimeItems().filter(function (item) {
        var subjMatch = currentSubject === "all" || item.subject === currentSubject;
        var chapMatch = currentChapter === "all" || item.chapter === currentChapter;
        var filterSubjMatch = currentFilter.subject === "all" || item.subject === currentFilter.subject;
        var filterGradeMatch = currentFilter.grade === "all" || item.grade === currentFilter.grade;
        var filterStatusMatch = currentFilter.status === "all" ||
          AHS.MaterialFilter.statusOf(item.progress) === currentFilter.status;
        /* RC-002: top category tab controls which Group(s) show. */
        var categoryMatch = currentCategory === "all" || item.category === currentCategory;
        /* BUG-010-006: folder filter. "all" = 不限；null = 未分類。 */
        var folderMatch = currentFolder === "all" || (item.folderId || null) === currentFolder;
        /* RC-003-001: toolbar 年級 / 格式.
           Sprint 6.6 Runtime QA Round 3 (WO-012, Issue #023): "其他"
           genuinely filters now — matches any fileType NOT in the named
           list below, instead of being a decorative option with no
           real effect on the list. */
        var toolbarGradeMatch = currentToolbarGrade === "all" || currentToolbarGrade === "全部年級" ||
          item.grade === currentToolbarGrade;
        var KNOWN_FORMATS = ["PDF", "PPT", "PPTX", "DOC", "DOCX", "XLS", "XLSX", "TXT", "MP4", "MP3", "JPG", "JPEG", "PNG", "GIF", "WEBP"];
        var fmt = String(currentFormat || "").toLowerCase();
        var itemFmt = String(item.fileType || "").toUpperCase();
        var formatMatch = currentFormat === "all" || currentFormat === "全部格式" || !fmt ||
          (currentFormat === "其他" ? KNOWN_FORMATS.indexOf(itemFmt) === -1 : itemFmt.toLowerCase() === fmt);
        var favMatch = !currentFavoriteOnly || item.favorite === true;
        var folderName = "";
        if (item.folderId) {
          var fd = AHS.MaterialRuntime.getFolderById(item.folderId);
          folderName = fd ? fd.name : "";
        }
        var searchMatch = !keyword ||
          String(item.title).toLowerCase().indexOf(keyword) !== -1 ||
          String(item.chapter).toLowerCase().indexOf(keyword) !== -1 ||
          String(item.fileName || "").toLowerCase().indexOf(keyword) !== -1 ||
          String(item.content || "").toLowerCase().indexOf(keyword) !== -1 ||
          String(item.id || "").toLowerCase().indexOf(keyword) !== -1 ||
          String(folderName).toLowerCase().indexOf(keyword) !== -1;
        return subjMatch && chapMatch && filterSubjMatch && filterGradeMatch &&
          filterStatusMatch && categoryMatch && folderMatch && toolbarGradeMatch &&
          formatMatch && favMatch && searchMatch;
      });
    }

    /* Per-group sort function passed to the grid (RC-006). */
    function sortWithin(list) {
      return AHS.MaterialSort.apply(list, currentSort);
    }

    function resetAllFilters() {
      currentSubject = "all";
      currentChapter = "all";
      currentFilter = { subject: "all", grade: "all", status: "all" };
      currentSearch = "";
      currentCategory = "all";
      currentFolder = "all";
      currentFavoriteOnly = false;
      currentToolbarGrade = "all";
      currentFormat = "all";
      var subjButtons = subjPanelEl.querySelectorAll(".subj-filter__item");
      Array.prototype.forEach.call(subjButtons, function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-id") === "all");
      });
      var filterSelects = filterUI.panel.querySelectorAll(".mat-filter__control");
      Array.prototype.forEach.call(filterSelects, function (s) { s.value = "all"; });
      searchBar.clear();
      tabsEl.resetToAll();
      renderChapterPanel();
      renderAll();
    }

    function emptyVariant() {
      if (currentFavoriteOnly) { return "favorite"; }
      if (currentSearch.trim()) { return "search"; }
      return "filter";
    }

    function renderGrid() {
      var list = computeVisibleItems();
      var newGrid = AHS.MaterialGrid.create(list, status, {
        onPreview: previewMaterial,
        onLearn: startLearningSession,
        onDownload: downloadMaterial,
        onDelete: confirmDeleteMaterial,
        onToggleFavorite: onToggleFavorite
      }, sortWithin);
      newGrid.setAttribute("data-view", theGrid.getAttribute("data-view") || "grid");
      theGrid.parentNode.replaceChild(newGrid, theGrid);
      theGrid = newGrid;

      if (list.length === 0) {
        emptyState.innerHTML = "";
        var variant = AHS.MaterialRuntime.isEmpty() ? "empty" : emptyVariant();
        emptyState.appendChild(AHS.MaterialEmptyState.create(variant, resetAllFilters));
        emptyState.removeAttribute("hidden");
      } else {
        emptyState.innerHTML = "";
        emptyState.setAttribute("hidden", "hidden");
      }
    }

    /* Recent Learning: hide entirely if runtime empty (no fake data). */
    function renderRecentLearning() {
      recentLearningSlot.innerHTML = "";
      var recent = AHS.MaterialRuntime.recentByCreatedOrder();
      if (recent.length === 0) { return; }
      recentLearningSlot.appendChild(
        AHS.MaterialRecentLearning.createFromRuntime(recent, startLearningSession)
      );
    }

    /* Recent Files: mirror runtime uploads (newest first). */
    var recentFilesSlot = el("div", { class: "mat-recent-files-slot" });
    function renderRecentFiles() {
      recentFilesSlot.innerHTML = "";
      recentFilesSlot.appendChild(recentFilesFromRuntime(status, previewMaterial));
    }

    /* Folder list slot (BUG-010): left sidebar folder container list. */
    var folderSlot = el("div", { class: "mat-folder-slot" });
    function renderFolders() {
      folderSlot.innerHTML = "";
      folderSlot.appendChild(AHS.MaterialFolder.renderList(
        AHS.MaterialRuntime.listFolders(),
        {
          activeId: currentFolder,
          countOf: function (fid) { return AHS.MaterialRuntime.folderMaterialCount(fid); },
          onPick: function (id) {
            currentFolder = id;
            renderFolders();
            renderGrid();
          },
          onDelete: function (id) { confirmDeleteFolder(id); }
        }
      ));
    }

    /* Full refresh after any runtime mutation. */
    function renderAll() {
      renderGrid();
      renderRecentLearning();
      renderRecentFiles();
      renderFolders();
    }

    function renderGridWithLoading() {
      if (searchLoadingTimer) { clearTimeout(searchLoadingTimer); }
      var skeleton = AHS.MaterialLoadingState.skeletonGrid(computeVisibleItems().length || 3);
      skeleton.setAttribute("data-view", theGrid.getAttribute("data-view") || "grid");
      theGrid.parentNode.replaceChild(skeleton, theGrid);
      theGrid = skeleton;
      emptyState.setAttribute("hidden", "hidden");
      searchLoadingTimer = setTimeout(function () {
        searchLoadingTimer = null;
        renderGrid();
      }, 250);
    }

    /* ---- Upload Flow (with metadata dialog) ---------------------------
       Single file -> existing AHS.MaterialUploadDialog (unchanged).
       Multiple files -> AHS.BulkUploadDialog (WO-006): shared metadata
       step, 套用全部, then per-file override, then one 開始匯入 that
       creates every material and runs the Learning Pipeline for each. */
    function onFilesPicked(fileList) {
      if (!fileList || fileList.length === 0) { return; }
      var files = Array.prototype.slice.call(fileList);

      if (files.length > 1 && AHS.BulkUploadDialog) {
        var bulkDialog = AHS.BulkUploadDialog.open(files, function (items) {
          items.forEach(function (item) {
            var record = AHS.MaterialRuntime.add({
              title: item.title, subject: item.subject, grade: item.grade,
              category: item.category, folderId: item.folderId,
              fileName: item.file.name, fileType: fileExt(item.file.name),
              fileSize: formatSize(item.file.size), file: item.file
            });
            /* HF-8.2.001 · HF-002: keep the real bytes so download still
               works after leaving this page (Runtime cannot persist a File). */
            rememberFileBytes(record.id, item.file);
            runLearningPipeline(record.id);
          });
          status.textContent = "已新增 " + items.length + " 個教材";
          status.removeAttribute("hidden");
          renderAll();
        }, function () { /* cancelled — nothing to do */ }, AHS.MaterialRuntime.listFolders());
        document.body.appendChild(bulkDialog);
        return;
      }

      function next() {
        if (files.length === 0) { return; }
        var f = files.shift();
        var dialog = AHS.MaterialUploadDialog.open(f, function (meta) {
          var record = AHS.MaterialRuntime.add({
            title: meta.title,
            subject: meta.subject,
            grade: meta.grade,
            category: meta.category,
            folderId: meta.folderId || null,
            fileName: f.name,
            fileType: fileExt(f.name),
            fileSize: formatSize(f.size),
            file: f
          });
          /* HF-8.2.001 · HF-002: keep the real bytes so download still
             works after leaving this page (Runtime cannot persist a File). */
          rememberFileBytes(record.id, f);
          status.textContent = "已新增教材：" + meta.title;
          status.removeAttribute("hidden");
          renderAll();
          runLearningPipeline(record.id);
          next();
        }, function () {
          /* cancelled — continue with remaining files if any */
          next();
        }, AHS.MaterialRuntime.listFolders());
        document.body.appendChild(dialog);
      }
      next();
    }

    /* ---- Learning Pipeline progress (EO-S6-006) -------------------------
       Runs the existing AHS.LearningPipeline.process() (untouched Public
       API, not re-implemented here) and narrates it stage-by-stage via
       AHS.LearningPipeline.getProgress(). process() itself is
       synchronous, so the staged reveal below is a paced UI narration of
       the REAL final outcome (which stage was actually reached, and
       whether it errored) — never a fabricated animation of stages that
       didn't happen. */
    function runLearningPipeline(materialId) {
      if (!AHS.LearningPipeline || typeof AHS.LearningPipeline.process !== "function") { return; }

      var STAGE_LABELS = {
        material: "解析教材", knowledge: "建立知識結構",
        summary: "生成摘要", questions: "生成練習題", done: "完成"
      };
      var STAGE_ORDER = ["material", "knowledge", "summary", "questions", "done"];

      AHS.LearningPipeline.process(materialId);
      var result = AHS.LearningPipeline.getProgress();
      var reachedIndex = STAGE_ORDER.indexOf(result.stage);

      var i = 0;
      function step() {
        var stage = STAGE_ORDER[i];
        var label = STAGE_LABELS[stage] || stage;
        if (i === reachedIndex && result.status === "error") {
          status.textContent = "學習內容建立失敗（" + label + "）：" + (result.errors[0] || "");
          status.removeAttribute("hidden");
          return;
        }
        if (stage === "done") {
          status.textContent = "學習內容已建立完成（知識結構／摘要／練習題）";
        } else {
          status.textContent = "處理中：" + label + " …";
        }
        status.removeAttribute("hidden");
        i += 1;
        if (i <= reachedIndex) { setTimeout(step, 260); }
      }
      step();
    }

    /* ---- Preview (RC-003-006) ----------------------------------------
       Opens the preview overlay (view only). Records lastOpenedAt via
       markPreviewed but NEVER changes progress / learning stats. */
    function previewMaterial(id) {
      var item = AHS.MaterialRuntime.getById(id);
      if (!item) {
        status.textContent = "教材不存在";
        status.removeAttribute("hidden");
        return;
      }
      AHS.MaterialRuntime.markPreviewed(id);
      var overlay = AHS.MaterialPreview.open(item, function (it) {
        doDownload(it);
      });
      document.body.appendChild(overlay);
    }

    /* ---- Learning Session (RC-003-005/006/008) -----------------------
       Starts/continues learning: advances progress and updates learning
       statistics + Recent Learning + Recent Files. Opens the material
       for viewing too (same overlay), but the key difference from
       preview is that progress/learning ARE updated here. */
    function startLearningSession(id) {
      var item = AHS.MaterialRuntime.getById(id);
      if (!item) {
        status.textContent = "教材不存在";
        status.removeAttribute("hidden");
        return;
      }
      AHS.MaterialRuntime.startLearning(id);
      status.textContent = "開始學習：" + item.title + "（進度 " + item.progress + "%）";
      status.removeAttribute("hidden");
      var overlay = AHS.MaterialPreview.open(item, function (it) { doDownload(it); });
      document.body.appendChild(overlay);
      renderAll();
    }

    /* ---- Download Flow · file byte store (HF-8.2.001 · HF-002) ---------
       Root cause of "教材存在，點擊下載無反應／下載失敗": MaterialRuntime's
       `file` field holds a live File object and is documented as NOT
       persisted (a File cannot be JSON-serialised). The material RECORD
       survives navigation through the Adapter, the File does not — so
       from the second page view onward every download fell into the
       "no downloadable file" branch, whose only feedback was one line of
       small status text that reads as "no reaction".

       Fix, without touching the Runtime Schema (forbidden) and without a
       new Runtime: the Download Flow keeps its own companion store of the
       real uploaded bytes as a data URL, keyed by material id, written
       only through AHS.PersistenceAdapter (sessionStorage — the same
       sanctioned mechanism every Runtime uses; never localStorage /
       indexedDB). On download, a live File is used when present,
       otherwise the stored bytes are rebuilt into a Blob. Everything is
       client-side and same-origin, so it behaves identically on GitHub
       Pages as locally.

       Honesty: sessionStorage has a quota (~5 MB). When a file is too
       large to keep, nothing is silently swallowed — the entry is marked
       oversize and the download message says so explicitly, and the file
       still downloads normally within the session that uploaded it. */
    var FILE_STORE_KEY = "materialFileStore";

    function readFileStore() {
      var loaded = (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function")
        ? AHS.PersistenceAdapter.load(FILE_STORE_KEY) : null;
      if (loaded && typeof loaded === "object" && loaded.files && typeof loaded.files === "object") {
        return loaded;
      }
      return { files: {} };
    }

    function writeFileStore(store) {
      return !!(AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.save === "function" &&
                AHS.PersistenceAdapter.save(FILE_STORE_KEY, store));
    }

    /* rememberFileBytes(materialId, file) — called right after a real
       upload. Reads the actual bytes (FileReader, no network) and stores
       them verbatim; on quota failure records an honest oversize marker
       instead of a half-written entry. */
    function rememberFileBytes(materialId, file) {
      if (!materialId || !file || typeof window.FileReader === "undefined") { return; }
      var reader = new window.FileReader();
      reader.onload = function () {
        var store = readFileStore();
        store.files[materialId] = {
          name: file.name || "",
          type: file.type || "",
          dataUrl: String(reader.result || "")
        };
        if (!writeFileStore(store)) {
          /* Quota exceeded — keep the record honest and small. */
          var fallback = readFileStore();
          fallback.files[materialId] = { name: file.name || "", type: file.type || "", oversize: true };
          writeFileStore(fallback);
        }
      };
      reader.onerror = function () { /* nothing stored — download reports honestly */ };
      try { reader.readAsDataURL(file); } catch (e) { /* same honest fallback */ }
    }

    function forgetFileBytes(materialId) {
      var store = readFileStore();
      if (store.files[materialId]) {
        delete store.files[materialId];
        writeFileStore(store);
      }
    }

    function storedEntry(materialId) {
      return readFileStore().files[materialId] || null;
    }

    /* dataUrlToBlob(dataUrl) — decodes the stored bytes back into a real
       Blob so the download carries the original binary content, not a
       text approximation. Returns null if decoding isn't possible. */
    function dataUrlToBlob(dataUrl) {
      if (typeof dataUrl !== "string" || dataUrl.indexOf(",") === -1) { return null; }
      if (typeof window.atob !== "function" || typeof window.Uint8Array === "undefined" ||
          typeof window.Blob === "undefined") { return null; }
      var head = dataUrl.slice(0, dataUrl.indexOf(","));
      var body = dataUrl.slice(dataUrl.indexOf(",") + 1);
      var mime = /:(.*?);/.exec(head);
      try {
        if (head.indexOf("base64") === -1) {
          return new window.Blob([decodeURIComponent(body)], { type: mime ? mime[1] : "" });
        }
        var binary = window.atob(body);
        var bytes = new window.Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i += 1) { bytes[i] = binary.charCodeAt(i); }
        return new window.Blob([bytes], { type: mime ? mime[1] : "application/octet-stream" });
      } catch (e) {
        return null;
      }
    }

    /* Low-level download (explicit user action only). */
    /* Sprint 6.7 Hotfix-002 (PAT-003, Issue 001/002): root cause of
       "點擊下載無反應" — revokeObjectURL() was called synchronously
       immediately after a.click(). In many browsers the actual download
       read of the blob URL hasn't started yet at that point in the same
       call stack; revoking it that early can silently cancel the
       download before it begins. Deferring the revoke via setTimeout
       gives the browser time to actually start reading the blob first.
       This is the only change to the download mechanism itself — no
       Runtime, no new Storage, no Parser Interface change. */
    function doDownload(item) {
      /* HF-8.2.001 · HF-002: prefer the live File (same-session upload),
         otherwise rebuild the real bytes kept by the Download Flow's
         companion store — this is what makes download work after any
         page change, which previously always failed. */
      var entry = item.file ? null : storedEntry(item.id);
      var source = item.file || (entry && !entry.oversize ? dataUrlToBlob(entry.dataUrl) : null);

      if (!source) {
        /* Never a silent fail — each cause gets its own precise message. */
        if (entry && entry.oversize) {
          status.textContent = "此教材檔案過大，超出瀏覽器暫存空間，僅能於上傳的同一次瀏覽階段下載。";
        } else if (entry) {
          status.textContent = "此教材的檔案內容已無法還原，請重新上傳後再下載。";
        } else {
          status.textContent = "此教材沒有可下載的原始檔案，此檔案來源不支援直接下載。";
        }
        status.removeAttribute("hidden");
        return;
      }

      var hasObjectUrl = (typeof window.URL !== "undefined" && !!window.URL.createObjectURL);
      /* Blob URL is preferred; where createObjectURL is unavailable the
         stored data URL is used directly as the anchor href, so the
         download still works (both are same-origin and need no server —
         identical behaviour on GitHub Pages). */
      if (!hasObjectUrl && !(entry && entry.dataUrl)) {
        status.textContent = "此瀏覽器不支援直接下載檔案，請改用其他瀏覽器。";
        status.removeAttribute("hidden");
        return;
      }
      var url = hasObjectUrl ? window.URL.createObjectURL(source) : entry.dataUrl;
      var a = document.createElement("a");
      a.href = url;
      /* Issue 005: always the original fileName (set verbatim from the
         real File.name at upload time — see onFilesPicked below), so
         the browser saves it with its real name and extension, never
         "download.bin" / "unknown.file". Falls back to title only in
         the defensive case fileName itself is somehow missing. */
      a.download = item.fileName || item.title || "教材";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      /* Only an ObjectURL may be revoked — a data URL must not be, and
         the revoke stays deferred (Sprint 6.7 Hotfix-002 root cause:
         revoking synchronously after click() can cancel the download). */
      if (hasObjectUrl && window.URL.revokeObjectURL) {
        setTimeout(function () { window.URL.revokeObjectURL(url); }, 1000);
      }
      status.textContent = "已下載教材：" + (item.fileName || item.title);
      status.removeAttribute("hidden");
    }

    function downloadMaterial(id) {
      var item = AHS.MaterialRuntime.getById(id);
      if (item) { doDownload(item); }
    }

    /* WO-008-004: custom confirm modal (replaces native window.confirm).
       "是否確定刪除此教材？" with【取消】【刪除】. Reuses .mat-dialog
       styles. Deletes only on explicit 刪除. */
    function confirmDeleteMaterial(id) {
      var item = AHS.MaterialRuntime.getById(id);
      var name = item ? (item.title || "此教材") : "此教材";

      var overlay = el("div", {
        class: "mat-dialog__overlay", role: "dialog", "aria-modal": "true", "aria-label": "刪除教材"
      });
      function close() { if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); } }

      var cancelBtn = el("button", { type: "button", class: "mat-dialog__btn mat-dialog__btn--ghost", text: "取消" });
      cancelBtn.addEventListener("click", close);

      var confirmBtn = el("button", { type: "button", class: "mat-dialog__btn mat-dialog__btn--danger", text: "刪除" });
      confirmBtn.addEventListener("click", function () {
        close();
        onDeleteMaterial(id);
      });

      overlay.addEventListener("click", function (e) { if (e.target === overlay) { close(); } });
      function onKey(e) {
        if (e.key === "Escape" || e.keyCode === 27) { close(); document.removeEventListener("keydown", onKey); }
      }
      document.addEventListener("keydown", onKey);

      overlay.appendChild(el("div", { class: "mat-dialog mat-dialog--confirm" }, [
        el("div", { class: "mat-dialog__head" }, [
          el("h2", { class: "mat-dialog__title", text: "刪除教材" })
        ]),
        el("div", { class: "mat-dialog__body" }, [
          el("p", { class: "mat-dialog__confirm-text", text: "是否確定刪除此教材？" }),
          el("p", { class: "mat-dialog__confirm-sub", text: "《" + name + "》" })
        ]),
        el("div", { class: "mat-dialog__foot" }, [cancelBtn, confirmBtn])
      ]));
      document.body.appendChild(overlay);
    }

    /* Delete: MaterialRuntime.remove() -> renderAll (grid + empty state
       + recent all update; empty state auto-shows when none left). */
    function onDeleteMaterial(id) {
      if (AHS.MaterialRuntime.remove(id)) {
        /* HF-8.2.001 · HF-002: release the companion bytes too, so the
           store never accumulates entries for deleted materials. */
        forgetFileBytes(id);
        status.textContent = "已刪除教材";
        status.removeAttribute("hidden");
        renderAll();
      }
    }

    /* BUG-010-007: delete folder. Empty folder -> delete directly.
       Non-empty -> confirm; on 確定, folder is removed and its materials
       are detached (folderId = null → 未分類), never deleted. */
    function confirmDeleteFolder(id) {
      var folder = AHS.MaterialRuntime.getFolderById(id);
      if (!folder) { return; }
      var count = AHS.MaterialRuntime.folderMaterialCount(id);

      if (count === 0) {
        doDeleteFolder(id);
        return;
      }

      var overlay = el("div", {
        class: "mat-dialog__overlay", role: "dialog", "aria-modal": "true", "aria-label": "刪除資料夾"
      });
      function close() { if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); } }

      var cancelBtn = el("button", { type: "button", class: "mat-dialog__btn mat-dialog__btn--ghost", text: "取消" });
      cancelBtn.addEventListener("click", close);
      var confirmBtn = el("button", { type: "button", class: "mat-dialog__btn mat-dialog__btn--danger", text: "確定" });
      confirmBtn.addEventListener("click", function () { close(); doDeleteFolder(id); });

      overlay.addEventListener("click", function (e) { if (e.target === overlay) { close(); } });
      function onKey(e) {
        if (e.key === "Escape" || e.keyCode === 27) { close(); document.removeEventListener("keydown", onKey); }
      }
      document.addEventListener("keydown", onKey);

      overlay.appendChild(el("div", { class: "mat-dialog mat-dialog--confirm" }, [
        el("div", { class: "mat-dialog__head" }, [
          el("h2", { class: "mat-dialog__title", text: "刪除資料夾" })
        ]),
        el("div", { class: "mat-dialog__body" }, [
          el("p", { class: "mat-dialog__confirm-text", text: "資料夾內仍有教材，是否刪除資料夾？" }),
          el("p", { class: "mat-dialog__confirm-sub", text: "教材將移至【未分類】，不會被刪除。" })
        ]),
        el("div", { class: "mat-dialog__foot" }, [cancelBtn, confirmBtn])
      ]));
      document.body.appendChild(overlay);
    }

    function doDeleteFolder(id) {
      if (AHS.MaterialRuntime.removeFolder(id)) {
        if (currentFolder === id) { currentFolder = "all"; }
        status.textContent = "已刪除資料夾（教材已移至未分類）";
        status.removeAttribute("hidden");
        renderAll();
      }
    }

    /* Favorite: MaterialRuntime.toggleFavorite() is the single source of
       truth; the card reflects the returned state. Grid is NOT fully
       re-rendered here (the card updates its own icon in place), except
       when the favorite-only view is active, where the set changes. */
    function onToggleFavorite(id) {
      var nowFav = AHS.MaterialRuntime.toggleFavorite(id);
      if (currentFavoriteOnly) { renderGrid(); }
      return nowFav;
    }

    var chapterSlot = el("div", { class: "chapter-filter-slot" });
    function renderChapterPanel() {
      chapterSlot.innerHTML = "";
      chapterSlot.appendChild(chapterPanel(
        { items: runtimeItems() }, currentSubject, function (chapterId) {
          currentChapter = chapterId;
          renderGrid();
        }
      ));
    }

    function onSubjectPick(id) {
      currentSubject = id;
      currentChapter = "all";
      renderChapterPanel();
      renderGrid();
    }

    function setView(mode) { theGrid.setAttribute("data-view", mode); }

    var subjPanelEl = subjectPanel(seed, onSubjectPick);
    renderChapterPanel();
    subjPanelEl.appendChild(chapterSlot);
    renderFolders();
    subjPanelEl.appendChild(folderSlot);

    var filterUI = AHS.MaterialFilter.create(seed, function (state) {
      currentFilter = state;
      renderGrid();
    });
    var sortEl = AHS.MaterialSort.create(function (sortId) {
      currentSort = sortId;
      renderGrid();
    });
    /* Filter button + Sort sit in the controls row; the Filter PANEL is a
       separate full-width in-flow block placed BELOW the row and ABOVE
       the grid, so opening it reserves layout space and pushes the grid
       down instead of overlaying cards (WO-008-001). */
    var filterSortRow = el("div", { class: "mat-filter-sort-row" }, [filterUI.button, sortEl]);

    var searchBar = AHS.MaterialSearchBar.create(function (keyword) {
      currentSearch = keyword;
      renderGridWithLoading();
    });
    var tabsEl = AHS.MaterialCategoryTabs.create(function (categoryId) {
      currentCategory = categoryId;
      renderGrid();
    });

    var main = el("div", { class: "mat-main" }, [
      subjPanelEl,
      el("div", { class: "mat-content" }, [
        toolbar(seed, setView, function (g) {
          currentToolbarGrade = g;
          renderGrid();
        }, function (fmt) {
          currentFormat = fmt;
          renderGrid();
        }),
        filterSortRow,
        filterUI.panel,
        theGrid,
        emptyState,
        status
      ])
    ]);

    var uploadUI = uploadPanel(status, onFilesPicked);

    var newFolderBtn = el("button", { type: "button", class: "mat-rail__btn mat-rail__btn--primary" }, [
      el("span", { html: AHS.Icons.plus() }),
      el("span", { text: "新增資料夾" })
    ]);
    newFolderBtn.addEventListener("click", function () {
      var dialog = AHS.MaterialFolder.openDialog(function (meta) {
        var folder = AHS.MaterialRuntime.addFolder(meta);
        status.textContent = "已新增資料夾：" + folder.name;
        status.removeAttribute("hidden");
        renderFolders();
      });
      document.body.appendChild(dialog);
    });

    var rail = el("div", { class: "mat-rail" }, [
      el("div", { class: "mat-rail__actions" }, [
        newFolderBtn
      ]),
      uploadUI.root,
      recentFilesSlot
    ]);

    /* ---- Initial paint ---------------------------------------------------
       HF-8.2.001 · HF-001 root cause: `theGrid` is created empty at the
       top of create() (AHS.MaterialGrid.create([], …)) and this initial
       paint previously rendered ONLY the two recent slots — renderGrid()
       and renderFolders() were never called. The grid therefore stayed
       empty until the first user event (subject tab, filter, search…),
       which is exactly the reported "第二次切換才正常顯示".

       Fix: paint the full page once, here, through the same renderAll()
       every mutation already uses — grid + recent learning + recent
       files + folders. renderGrid() itself owns the Empty State
       (choosing the "empty" variant when the runtime is empty and the
       filter/search/favorite variant otherwise), so the previous manual
       empty-state block is removed as redundant — it could only ever
       produce the same or a less accurate result.

       Timing is safe: `main` (line ~817) is composed before this point,
       so theGrid.parentNode exists for renderGrid()'s replaceChild.
       No Runtime, no lifecycle rewrite, no new render path. */
    renderAll();

    var page = el("div", { class: "mat-page" }, [
      header(seed, searchBar),
      tabsEl,
      recentLearningSlot,
      el("div", { class: "mat-layout" }, [main, rail])
    ]);

    /* Sprint 6.6 Runtime QA Round 3 (WO-011, Issue #022): the shared
       AppShell Header search bar lives OUTSIDE this component (it's a
       sibling in the page shell, not a descendant), so it can't reach
       MaterialCenter's internal currentSearch closure directly. This
       hook lets the page bootstrap (js/pages/app-materials.js) forward
       keystrokes from that Header input into the exact same, already-
       working search pipeline this page's own search bar uses — same
       matching logic (title/chapter/fileName/content/folder name), same
       real-time re-render, same Empty State on no matches. Attached to
       the DOM node itself (same pattern MaterialSearchBar.js already
       uses for its own .clear() helper) rather than changing this
       function's return type, so every existing caller is unaffected. */
    page.setKeyword = function (keyword) {
      currentSearch = keyword || "";
      var inPageInput = searchBar.querySelector(".mat-search__input");
      if (inPageInput) { inPageInput.value = currentSearch; }
      renderGridWithLoading();
    };

    return page;
  }

  return { create: create };
})();
