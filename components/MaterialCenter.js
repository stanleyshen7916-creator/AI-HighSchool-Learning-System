/* components/MaterialCenter.js — 教材中心 (Material Center) page.
   Subject filter panel + toolbar (categories / grade / sort / format /
   grid-list toggle) + material card grid + upload dropzone + recent files.
   All Mock. PascalCase component under window.AHS.
   File-type colors for recent files. */
window.AHS = window.AHS || {};
AHS.MaterialCenter = (function () {
  "use strict";
  var el = AHS.UI.el;

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
  function toolbar(data, onView) {
    var catChips = el("div", { class: "mat-toolbar__cats" },
      data.categories.map(function (c, i) {
        var b = el("button", {
          type: "button",
          class: "mat-toolbar__cat" + (i === 0 ? " is-active" : ""),
          text: c
        });
        b.addEventListener("click", function () {
          var sibs = catChips.querySelectorAll(".mat-toolbar__cat");
          Array.prototype.forEach.call(sibs, function (s) {
            s.classList.remove("is-active");
          });
          b.classList.add("is-active");
        });
        return b;
      }));

    function select(label, options) {
      return el("label", { class: "mat-select" }, [
        el("span", { class: "mat-select__label", text: label }),
        el("select", { class: "mat-select__control", "aria-label": label },
          options.map(function (o) { return el("option", { text: o }); }))
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
      catChips,
      el("div", { class: "mat-toolbar__selects" }, [
        select("年級", data.grades),
        select("排序", data.sorts),
        select("格式", data.formats),
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

  /* ---- Upload panel + recent files ------------------------------------ */
  function uploadPanel(status) {
    var pick = el("button", { type: "button", class: "upload__pick", text: "選擇檔案" });
    pick.addEventListener("click", function () {
      status.textContent = "（Mock）開啟檔案選擇器"; status.removeAttribute("hidden");
    });
    return el("section", { class: "card upload", "aria-label": "上傳教材" }, [
      el("h2", { class: "card__title", text: "上傳教材" }),
      el("div", { class: "upload__drop" }, [
        el("span", { class: "upload__drop-icon", html: AHS.Icons.download() }),
        el("p", { class: "upload__drop-text", text: "拖曳檔案到此處，或點擊上傳" }),
        el("p", { class: "upload__drop-hint", text: "支援 PDF、PPT、DOCX、MP4 等格式" }),
        pick
      ])
    ]);
  }

  function recentFiles(data, status) {
    var list = el("div", { class: "recent-files__list" },
      data.recentFiles.map(function (f) {
        var tone = FILE_TONE[f.type] || "#6b7280";
        var row = el("button", { type: "button", class: "recent-file" }, [
          el("span", {
            class: "recent-file__badge",
            style: "color:" + tone + ";background-color:" + tone + "1a",
            text: f.type
          }),
          el("span", { class: "recent-file__meta" }, [
            el("span", { class: "recent-file__name", text: f.name }),
            el("span", { class: "recent-file__sub", text: f.type + " · " + f.size + " · " + f.date })
          ]),
          el("span", { class: "recent-file__dl", html: AHS.Icons.download() })
        ]);
        row.addEventListener("click", function () {
          status.textContent = "（Mock）開啟檔案：" + f.name;
          status.removeAttribute("hidden");
        });
        return row;
      }));

    return el("section", { class: "card recent-files", "aria-label": "最近檔案" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "最近檔案" }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      list
    ]);
  }

  /* ---- Material detail (MAT-F004) --------------------------------------
     Reuses the existing .mat-status announcement area as the material
     detail display region (no new layout/UI section introduced). */
  function findMaterialById(data, id) {
    for (var i = 0; i < data.items.length; i++) {
      if (data.items[i].id === id) { return data.items[i]; }
    }
    return null;
  }

  function formatDetail(item) {
    var subj = AHS.Subjects[item.subject];
    return "教材詳情：《" + item.title + "》｜" + subj.name + "｜" + item.chapter +
      " — " + item.content;
  }

  /* create(model?) — model defaults to AHS.Mock.materials. */
  function create(model) {
    var data = model || AHS.Mock.materials;
    var status = el("p", {
      class: "mat-status", "aria-live": "polite", hidden: "hidden"
    });

    function openDetail(id) {
      var item = findMaterialById(data, id);
      if (!item) {
        status.textContent = "教材不存在";
        status.removeAttribute("hidden");
        return;
      }
      status.textContent = formatDetail(item);
      status.removeAttribute("hidden");
    }

    /* M004: Recent Learning section delegated to AHS.MaterialRecentLearning
       (extracted/upgraded from the previous inline "繼續閱讀" banner,
       MAT-F005). Data source (AHS.Mock.lastReading) and hide-when-absent
       behavior are unchanged. */
    var continueBanner = AHS.MaterialRecentLearning.create(data, openDetail);

    /* M005/M006: Grid + Card delegated to AHS.MaterialGrid / AHS.MaterialCard. */
    var theGrid = AHS.MaterialGrid.create(data.items, status, openDetail);

    /* M010: Empty State — full component (illustration / title /
       description / reset action) rendered into this slot on demand. */
    var emptyState = el("div", { class: "mat-grid__empty-slot", hidden: "hidden" });

    var currentSubject = "all";
    var currentChapter = "all";
    /* M008: Filter Panel state. */
    var currentFilter = { subject: "all", grade: "all", status: "all" };
    /* M009: Sort state. */
    var currentSort = "newest";
    /* M013: Search keyword + Subject Tabs group — all state lives in
       memory (plain closure vars), confirming the Memory State flow. */
    var currentSearch = "";
    var currentTabGroup = "all";
    var searchLoadingTimer = null;

    function computeVisibleItems() {
      var keyword = currentSearch.trim().toLowerCase();
      var groupSubjects = AHS.MaterialSubjectTabs.subjectsForGroup(currentTabGroup);

      var list = data.items.filter(function (item) {
        var subjMatch = currentSubject === "all" || item.subject === currentSubject;
        var chapMatch = currentChapter === "all" || item.chapter === currentChapter;
        var filterSubjMatch = currentFilter.subject === "all" || item.subject === currentFilter.subject;
        var filterGradeMatch = currentFilter.grade === "all" || item.grade === currentFilter.grade;
        var filterStatusMatch = currentFilter.status === "all" ||
          AHS.MaterialFilter.statusOf(item.progress) === currentFilter.status;
        /* M013: Subject Tabs group filter (null = 全部, no restriction). */
        var tabMatch = !groupSubjects || groupSubjects.indexOf(item.subject) !== -1;
        /* M013: keyword search over 名稱/章節/簡介. */
        var searchMatch = !keyword ||
          String(item.title).toLowerCase().indexOf(keyword) !== -1 ||
          String(item.chapter).toLowerCase().indexOf(keyword) !== -1 ||
          String(item.content || "").toLowerCase().indexOf(keyword) !== -1;
        return subjMatch && chapMatch && filterSubjMatch && filterGradeMatch &&
          filterStatusMatch && tabMatch && searchMatch;
      });
      return AHS.MaterialSort.apply(list, currentSort);
    }

    function resetAllFilters() {
      currentSubject = "all";
      currentChapter = "all";
      currentFilter = { subject: "all", grade: "all", status: "all" };
      currentSearch = "";
      currentTabGroup = "all";
      /* Sync sidebar active states back to 全部科目 without redesigning
         them: re-render the chapter panel and clear subject highlight. */
      var subjButtons = subjPanelEl.querySelectorAll(".subj-filter__item");
      Array.prototype.forEach.call(subjButtons, function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-id") === "all");
      });
      /* Reset Filter Panel selects to 全部. */
      var filterSelects = filterEl.querySelectorAll(".mat-filter__control");
      Array.prototype.forEach.call(filterSelects, function (s) { s.value = "all"; });
      /* M013: clear search input + reset Subject Tabs to 全部. */
      searchBar.clear();
      tabsEl.resetToAll();
      renderChapterPanel();
      renderGrid();
    }

    function emptyVariant() {
      return currentSearch.trim() ? "search" : "filter";
    }

    function renderGrid() {
      var list = computeVisibleItems();
      var newGrid = AHS.MaterialGrid.create(list, status, openDetail);
      newGrid.setAttribute("data-view", theGrid.getAttribute("data-view") || "grid");
      theGrid.parentNode.replaceChild(newGrid, theGrid);
      theGrid = newGrid;

      if (list.length === 0) {
        /* M010/M013: variant depends on whether a search keyword is the
           likely cause of the empty result. */
        emptyState.innerHTML = "";
        emptyState.appendChild(AHS.MaterialEmptyState.create(emptyVariant(), resetAllFilters));
        emptyState.removeAttribute("hidden");
      } else {
        emptyState.innerHTML = "";
        emptyState.setAttribute("hidden", "hidden");
      }
    }

    /* M011/M013: Loading State display logic for search — swap in the
       skeleton grid briefly, then render results. Uses a plain timer +
       memory state only; no network, no library. */
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

    var chapterSlot = el("div", { class: "chapter-filter-slot" });
    function renderChapterPanel() {
      chapterSlot.innerHTML = "";
      chapterSlot.appendChild(chapterPanel(data, currentSubject, function (chapterId) {
        currentChapter = chapterId;
        renderGrid();
      }));
    }

    function onSubjectPick(id) {
      currentSubject = id;
      currentChapter = "all";
      renderChapterPanel();
      renderGrid();
    }

    function setView(mode) { theGrid.setAttribute("data-view", mode); }

    var subjPanelEl = subjectPanel(data, onSubjectPick);
    renderChapterPanel();
    subjPanelEl.appendChild(chapterSlot);

    /* M008 Filter + M009 Sort — new controls, mounted as siblings next
       to the existing (untouched) toolbar. */
    var filterEl = AHS.MaterialFilter.create(data, function (state) {
      currentFilter = state;
      renderGrid();
    });
    var sortEl = AHS.MaterialSort.create(function (sortId) {
      currentSort = sortId;
      renderGrid();
    });
    var filterSortRow = el("div", { class: "mat-filter-sort-row" }, [filterEl, sortEl]);

    /* M013: Search + Subject Tabs instances, wired into the unified
       filter pipeline. Search shows the M011 skeleton briefly; tab
       switches render immediately (in-memory, no wait to simulate). */
    var searchBar = AHS.MaterialSearchBar.create(function (keyword) {
      currentSearch = keyword;
      renderGridWithLoading();
    });
    var tabsEl = AHS.MaterialSubjectTabs.create(function (groupId) {
      currentTabGroup = groupId;
      renderGrid();
    });

    var main = el("div", { class: "mat-main" }, [
      subjPanelEl,
      el("div", { class: "mat-content" }, [
        toolbar(data, setView),
        filterSortRow,
        theGrid,
        emptyState,
        status
      ])
    ]);

    var rail = el("div", { class: "mat-rail" }, [
      el("div", { class: "mat-rail__actions" }, [
        el("button", { type: "button", class: "mat-rail__btn mat-rail__btn--ghost" }, [
          el("span", { html: AHS.Icons.download() }),
          el("span", { text: "上傳教材" })
        ]),
        el("button", { type: "button", class: "mat-rail__btn mat-rail__btn--primary" }, [
          el("span", { html: AHS.Icons.plus() }),
          el("span", { text: "新增資料夾" })
        ])
      ]),
      uploadPanel(status),
      recentFiles(data, status)
    ]);

    return el("div", { class: "mat-page" }, [
      header(data, searchBar),
      tabsEl,
      continueBanner,
      el("div", { class: "mat-layout" }, [main, rail])
    ]);
  }

  return { create: create };
})();
