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

  function chip(subjectKey) {
    var subj = AHS.Subjects[subjectKey];
    return el("span", {
      class: "chip",
      style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
    }, [el("span", { text: subj.name })]);
  }

  /* ---- Header ---------------------------------------------------------- */
  function header(data, status) {
    var search = el("div", { class: "mat-search" }, [
      el("span", { class: "mat-search__icon", html: AHS.Icons.search() }),
      el("input", {
        class: "mat-search__input", type: "search",
        placeholder: "搜尋教材名稱、章節、關鍵字…", "aria-label": "搜尋教材"
      })
    ]);
    return el("div", { class: "mat-header" }, [
      el("div", { class: "mat-header__titles" }, [
        el("h1", { class: "mat-header__title", text: data.title }),
        el("p", { class: "mat-header__subtitle", text: data.subtitle })
      ]),
      search
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

  /* ---- Material card --------------------------------------------------- */
  function materialCard(item, status) {
    var subj = AHS.Subjects[item.subject];
    var view = el("button", {
      type: "button", class: "mat-card__act",
      "aria-label": "檢視", html: AHS.Icons.search()
    });
    var dl = el("button", {
      type: "button", class: "mat-card__act",
      "aria-label": "下載", html: AHS.Icons.download()
    });
    function announce(msg) {
      status.textContent = msg; status.removeAttribute("hidden");
    }
    view.addEventListener("click", function () {
      announce("（Mock）檢視教材：" + subj.name + "《" + item.title + "》");
    });
    dl.addEventListener("click", function () {
      announce("（Mock）下載教材：" + subj.name + "《" + item.title + "》");
    });

    return el("article", {
      class: "mat-card", "data-subject": item.subject
    }, [
      el("div", {
        class: "mat-card__thumb",
        style: "background-color:" + subj.hex + "1f"
      }, [
        chip(item.subject),
        el("span", { class: "mat-card__thumb-icon",
          style: "color:" + subj.hex, html: AHS.Icons.book() })
      ]),
      el("h3", { class: "mat-card__title", text: item.title }),
      el("p", { class: "mat-card__meta", text: "高一" + subj.name + "｜" + item.chapter }),
      el("div", { class: "mat-card__foot" }, [
        el("span", { class: "mat-card__date", text: item.date }),
        el("span", { class: "mat-card__views" }, [
          el("span", { html: AHS.Icons.search() }),
          el("span", { text: item.views })
        ])
      ]),
      el("div", { class: "mat-card__acts" }, [view, dl])
    ]);
  }

  function grid(data, status) {
    var wrap = el("div", { class: "mat-grid", "data-view": "grid" },
      data.items.map(function (it) { return materialCard(it, status); }));
    return wrap;
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

  /* create(model?) — model defaults to AHS.Mock.materials. */
  function create(model) {
    var data = model || AHS.Mock.materials;
    var status = el("p", {
      class: "mat-status", "aria-live": "polite", hidden: "hidden"
    });

    var theGrid = grid(data, status);

    function filterBySubject(id) {
      var cards = theGrid.querySelectorAll(".mat-card");
      Array.prototype.forEach.call(cards, function (c) {
        var match = id === "all" || c.getAttribute("data-subject") === id;
        c.style.display = match ? "" : "none";
      });
    }
    function setView(mode) { theGrid.setAttribute("data-view", mode); }

    var main = el("div", { class: "mat-main" }, [
      subjectPanel(data, filterBySubject),
      el("div", { class: "mat-content" }, [
        toolbar(data, setView),
        theGrid,
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
      header(data, status),
      el("div", { class: "mat-layout" }, [main, rail])
    ]);
  }

  return { create: create };
})();
