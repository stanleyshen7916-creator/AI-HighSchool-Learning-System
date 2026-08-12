/* components/WrongBook.js — 知識弱點 (Wrong Book) page.
   Master-detail layout: banner + filter bar + wrong-question list (with
   pagination) on the left, question detail panel on the right. Selecting a
   row updates the detail panel. All Mock. PascalCase under window.AHS. */
window.AHS = window.AHS || {};
AHS.WrongBook = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  var DIFF_TONE = { "簡單": "#22b573", "中等": "#f59e0b", "困難": "#ef4444" };

  /* WB-012: WrongBookRuntime records carry no `difficulty` field. Rather
     than inventing a stored value (a schema change, forbidden), Difficulty
     is derived at display/filter time from the existing errorCount field —
     stateless, read-only, no Runtime change. Documented as an
     interpretation in REPORT.md. */
  function deriveDifficulty(item) {
    var count = item.errorCount || 0;
    if (count >= 3) { return "困難"; }
    if (count === 2) { return "中等"; }
    return "簡單";
  }

  /* WS-001: Mastered Rule — three consecutive correct reviews -> 已精熟.
     Sprint AI-111 AI-610: now backed by WrongBookRuntime's own real,
     persisted `correctStreak` field (see that file's recordRetry(),
     additive) instead of a session-scoped, in-memory-only local tracker —
     the previous version was invisible to any other page/Runtime and
     lost on reload, so a real "答對" never actually reached
     WrongBookRuntime/Review/Statistics as this Sprint requires. Pure
     derivation, no local state of its own anymore. */
  function getMasteryStatus(correctStreak) {
    var count = correctStreak || 0;
    if (count >= 3) { return "已精熟"; }
    if (count > 0) { return "複習中"; }
    return "待複習";
  }

  var STATUS_TONE = { "待複習": "#6b7280", "複習中": "#f59e0b", "已精熟": "#22b573" };
  function statusTag(status) {
    var tone = STATUS_TONE[status] || "#6b7280";
    return el("span", {
      class: "wb-tag",
      style: "color:" + tone + ";background-color:" + tone + "1a",
      text: status
    });
  }

  /* WS-004: Review Center — a deduplicated collection of Knowledge Points
     added via 加入重點整理 (WB-003), for future review. Same reasoning as
     the mastery tracker above: no Runtime field exists for this, adding
     one is forbidden, localStorage is forbidden, so this is session-
     scoped in-memory state (an object used as a Set). "Same Knowledge
     Point cannot be duplicated" is guaranteed structurally — a Set has no
     concept of duplicate membership. */
  var reviewCenter = {};
  function isInReviewCenter(kp) { return !!reviewCenter[kp]; }
  function toggleReviewCenter(kp) {
    if (reviewCenter[kp]) { delete reviewCenter[kp]; } else { reviewCenter[kp] = true; }
    return !!reviewCenter[kp];
  }
  function reviewCenterList() { return Object.keys(reviewCenter); }

  function reviewCenterPanel() {
    var countEl = el("span", { class: "wb-review-center__count", text: "(0)" });
    var listEl = el("div", { class: "wb-review-center__list" });
    var wrap = el("section", {
      class: "card wb-review-center", hidden: "hidden", "aria-label": "重點整理"
    }, [
      el("div", { class: "wb-review-center__head" }, [
        el("h2", { class: "wb-review-center__title", text: "重點整理" }),
        countEl
      ]),
      listEl
    ]);
    function refresh() {
      var kps = reviewCenterList();
      listEl.innerHTML = "";
      countEl.textContent = "(" + kps.length + ")";
      if (kps.length === 0) { wrap.setAttribute("hidden", "hidden"); return; }
      wrap.removeAttribute("hidden");
      kps.forEach(function (kp) {
        listEl.appendChild(el("span", { class: "wb-tag wb-review-center__chip", text: kp }));
      });
    }
    refresh();
    return { el: wrap, refresh: refresh };
  }

  /* AI-127 hotfix: a wrong-book record pulled fresh from Supabase can
     legitimately have subject "" (WrongBookRuntime.pullFromRepository()'s
     own `local.subject = local.subject || "";`, same non-canonical
     placeholder class already fixed once for TodayMission.js) — reuse
     AHS.Subjects with the same safe fallback rather than assuming every
     item.subject is always a real key, so the row/detail chip never
     throws and silently blanks the whole list. */
  function chip(subjectKey) {
    var subj = AHS.Subjects[subjectKey] || { name: subjectKey || "科目", hex: "#7c5cff" };
    return el("span", {
      class: "chip",
      style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
    }, [el("span", { text: subj.name })]);
  }

  function diffTag(difficulty) {
    if (!difficulty) {
      return el("span", { class: "wb-tag wb-tag--muted", text: "—" });
    }
    var tone = DIFF_TONE[difficulty] || "#6b7280";
    return el("span", {
      class: "wb-tag",
      style: "color:" + tone + ";background-color:" + tone + "1a",
      text: difficulty
    });
  }

  /* ---- Banner + actions ------------------------------------------------ */
  function headerBlock(data, status, handlers) {
    handlers = handlers || {};

    function actionBtn(cls, icon, label, onClick) {
      var b = el("button", { type: "button", class: "wb-action " + cls }, [
        el("span", { html: AHS.Icons[icon]() }),
        el("span", { text: label })
      ]);
      b.addEventListener("click", function () { onClick(b); });
      return b;
    }

    /* Sprint AI-118 AI-118-07: 全部重新複習/我的最愛 relabeled 全部重新練習/
       收藏 — matches the spec's own wording exactly; behavior unchanged. */
    var reviewBtn = actionBtn("wb-action--primary", "refresh", "全部重新練習", function () {
      if (handlers.onReviewAll) { handlers.onReviewAll(); }
    });
    var favBtn = actionBtn("wb-action--ghost", "heart", "收藏", function (btnEl) {
      if (handlers.onToggleFavoriteMode) { handlers.onToggleFavoriteMode(btnEl); }
    });
    var exportBtn = actionBtn("wb-action--ghost", "download", "錯題匯出", function () {
      if (handlers.onExport) { handlers.onExport(); }
    });

    var headerEl = el("div", { class: "wb-header" }, [
      el("div", { class: "wb-header__intro" }, [
        el("div", { class: "wb-header__titles" }, [
          el("h1", { class: "wb-header__title", text: data.title }),
          el("p", { class: "wb-header__subtitle", text: data.subtitle })
        ]),
        el("div", { class: "wb-banner" }, [
          el("span", {
            class: "wb-banner__avatar qiaoqiao-bust qiaoqiao-bust--md",
            html: AHS.Qiaoqiao.bust("cheer")
          }),
          el("p", { class: "wb-banner__tip", text: data.bannerTip })
        ])
      ]),
      el("div", { class: "wb-header__actions" }, [reviewBtn, favBtn, exportBtn])
    ]);

    return { el: headerEl, favBtn: favBtn };
  }

  /* ---- Export (WB-010) ---------------------------------------------------
     Browser-only download (Blob + object URL + temporary <a download>) —
     no backend. Exports the currently visible (filtered) Wrong Book set as
     both JSON and CSV, using only fields already on the Runtime record. */
  var EXPORT_FIELDS = [
    "subject", "title", "chapter", "knowledgePoint", "question",
    "yourAnswer", "correctAnswer", "explanation", "errorCount", "lastError", "bookmarked"
  ];

  function csvEscape(value) {
    var s = value === null || value === undefined ? "" : String(value);
    if (/[",\r\n]/.test(s)) { s = "\"" + s.replace(/"/g, "\"\"") + "\""; }
    return s;
  }

  function buildExportPayload(items) {
    var json = JSON.stringify(items, null, 2);
    var lines = [EXPORT_FIELDS.join(",")];
    items.forEach(function (it) {
      lines.push(EXPORT_FIELDS.map(function (f) { return csvEscape(it[f]); }).join(","));
    });
    return { json: json, csv: lines.join("\r\n") };
  }

  function downloadFile(filename, content, mime) {
    try {
      var blob = new Blob([content], { type: mime });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    } catch (e) {
      /* Browser download APIs unavailable — no-op rather than a thrown
         console error (this only matters in non-browser test harnesses;
         every supported browser implements Blob/URL/<a download>). */
    }
  }

  function exportWrongBook(items) {
    var payload = buildExportPayload(items);
    downloadFile("wrongbook_export.json", payload.json, "application/json");
    // WB-011: UTF-8 BOM prefix — without it, Excel (and some locale
    // configurations of other spreadsheet apps) misreads UTF-8 CSV as the
    // system default codepage, garbling Traditional Chinese characters.
    downloadFile("wrongbook_export.csv", "\uFEFF" + payload.csv, "text/csv;charset=utf-8;");
  }

  /* ---- Summary Card (W001-1, updated WS-001/AI-902, reworked Sprint
     AI-118 AI-118-07) --------------------------------------------------
     複習中心's Navigation entry is gone this Sprint (AI-118-03: "所有入口
     整併：知識弱點") — 知識弱點 is now the single place "今日待複習" is
     reachable from, so AI-902's old "不得混入今日複習" separation no
     longer applies (there is no second page left to conflict with).
     "移除所有重複統計。所有統計：StatisticsRuntime" — the 4-stat block
     (全部錯題/尚未精熟/已精熟/我的收藏) is replaced with the one real
     stat AI-118-07 actually asks WrongBook to show, computed via
     AHS.StatisticsRuntime.dueForReview() (LOCKed this Sprint — read
     only, same single Source every other page already uses) rather than
     a second local computation; falls back to the exact same real rule
     (correctStreak < 3) only when StatisticsRuntime genuinely isn't
     loaded on a given page, matching this file's own defensive
     convention elsewhere. 全部重新練習/收藏 are the Header's own real
     action buttons (headerBlock, above) — not a second stat tile here. */
  var SUMMARY_DEFS = [
    { key: "dueToday", icon: "clock", label: "今日待複習" }
  ];

  function summaryCounts(items) {
    var dueToday = (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.dueForReview === "function")
      ? AHS.StatisticsRuntime.dueForReview().length
      : items.filter(function (i) { return (i.correctStreak || 0) < 3; }).length;
    return { dueToday: dueToday };
  }

  function summaryCard(items) {
    var valueEls = {};
    var wrap = el("section", { class: "card wb-summary", "aria-label": "知識弱點統計" },
      SUMMARY_DEFS.map(function (d) {
        var valueEl = el("strong", { class: "wb-summary__value", text: "0" });
        valueEls[d.key] = valueEl;
        return el("div", { class: "wb-summary__item" }, [
          el("span", { class: "wb-summary__icon", html: AHS.Icons[d.icon]() }),
          el("div", { class: "wb-summary__meta" }, [
            valueEl,
            el("span", { class: "wb-summary__label", text: d.label })
          ])
        ]);
      }));

    function refresh(list) {
      var counts = summaryCounts(list);
      Object.keys(valueEls).forEach(function (key) {
        valueEls[key].textContent = String(counts[key]);
      });
    }
    refresh(items);

    return { el: wrap, refresh: refresh };
  }

  /* ---- Empty State (W001-2) ---------------------------------------------
     Shown only when AHS.WrongBookRuntime.isEmpty(). No seed data, no Mock
     fallback — reuses the existing Qiaoqiao illustration asset and the
     page's own .wb-action--primary button style (no new visual token). */
  function emptyState() {
    var btn = el("a", {
      class: "wb-action wb-action--primary wb-empty__btn",
      href: "quiz.html"
    }, [
      el("span", { html: AHS.Icons.arrowRight() }),
      el("span", { text: "前往測驗中心" })
    ]);
    return el("div", { class: "card wb-empty", role: "status" }, [
      el("div", {
        class: "wb-empty__illustration qiaoqiao-full qiaoqiao-full--sm",
        html: AHS.Qiaoqiao.full("reading")
      }),
      el("h3", { class: "wb-empty__title", text: "目前沒有錯題紀錄。" }) /* EO-S7.0-002 mandated Empty State copy */,
      el("p", {
        class: "wb-empty__description",
        text: "完成測驗後，答錯的題目會自動整理在這裡，方便你複習。"
      }),
      btn
    ]);
  }

  /* ---- Filter bar ------------------------------------------------------ */
  var SORT_OPTIONS = ["預設", "最新錯誤", "錯誤次數", "我的收藏"];

  function filterBar(data, knowledgeOptions, handlers) {
    handlers = handlers || {};
    var searchInput = el("input", {
      class: "wb-search__input", type: "search",
      placeholder: "搜尋標題、章節或知識點…", "aria-label": "搜尋錯題"
    });
    if (handlers.onSearch) {
      searchInput.addEventListener("input", function () { handlers.onSearch(searchInput.value); });
    }
    var search = el("div", { class: "wb-search" }, [
      el("span", { class: "wb-search__icon", html: AHS.Icons.search() }),
      searchInput
    ]);

    function select(label, options, onChange) {
      var sel = el("select", { class: "wb-select__control", "aria-label": label },
        options.map(function (o) { return el("option", { text: o }); }));
      if (onChange) { sel.addEventListener("change", function () { onChange(sel.value); }); }
      return el("label", { class: "wb-select" }, [
        el("span", { class: "wb-select__label", text: label }),
        sel
      ]);
    }

    var favToggle = el("button", {
      type: "button", class: "wb-fav-filter", "aria-pressed": "false", "aria-label": "只看收藏錯題"
    }, [
      el("span", { class: "wb-fav-filter__icon", html: AHS.Icons.heart() }),
      el("span", { text: "只看收藏" }),
      el("span", { class: "wb-fav-filter__count", text: "(0)" })
    ]);
    favToggle.addEventListener("click", function () {
      var isOn = favToggle.getAttribute("aria-pressed") === "true";
      if (handlers.onFavoriteToggle) { handlers.onFavoriteToggle(!isOn); }
    });

    var clearBtn = el("button", { type: "button", class: "wb-clear" }, [
      el("span", { html: AHS.Icons.filterX() }),
      el("span", { text: "清除篩選" })
    ]);
    clearBtn.addEventListener("click", handlers.onClear);

    return el("section", { class: "card wb-filter", "aria-label": "篩選錯題" }, [
      search,
      el("div", { class: "wb-filter__row" }, [
        select("科目", data.subjectOptions, handlers.onSubject),
        select("知識點", knowledgeOptions, handlers.onKnowledge),
        select("難易度", data.difficultyOptions, handlers.onDifficulty),
        select("狀態", data.statusOptions, handlers.onStatus),
        select("排序", SORT_OPTIONS, handlers.onSort),
        favToggle,
        clearBtn
      ])
    ]);
  }

  /* ---- More Menu (HOTFIX-003) --------------------------------------------
     Exactly ONE .wb-row__menu DOM node exists for the whole page — it is
     reparented into whichever row's .wb-row__menu-wrap is currently active
     (tracked via activeMenuId), never duplicated per row. Closing means
     detaching it from the DOM entirely (not just hiding it), so there is
     no possibility of "every row shows an opened menu". */
  function createMoreMenuController() {
    var activeMenuId = null;
    var onViewHandler = null;
    var onReviewHandler = null;

    var viewBtn = el("button", {
      type: "button", class: "wb-row__menu-item", role: "menuitem", text: "查看詳情"
    });
    var reviewBtn = el("button", {
      type: "button", class: "wb-row__menu-item", role: "menuitem", text: "開始複習"
    });
    /* AI-121-08: 知識弱點 Archive — real, persisted, never-delete state
       change (AHS.WrongBookRuntime.archive()/unarchive()). Label toggles
       per-row (set by toggle() below, since this one DOM node is shared
       across every row). */
    var archiveBtn = el("button", {
      type: "button", class: "wb-row__menu-item", role: "menuitem", text: "封存"
    });
    var panel = el("div", { class: "wb-row__menu", role: "menu", hidden: "hidden" },
      [viewBtn, reviewBtn, archiveBtn]);
    var onArchiveHandler = null;

    function close() {
      panel.setAttribute("hidden", "hidden");
      if (panel.parentNode) { panel.parentNode.removeChild(panel); }
      activeMenuId = null;
      onViewHandler = null;
      onReviewHandler = null;
      onArchiveHandler = null;
    }

    viewBtn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var handler = onViewHandler;
      close();
      if (handler) { handler(); }
    });
    reviewBtn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var handler = onReviewHandler;
      close();
      if (handler) { handler(); }
    });
    archiveBtn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var handler = onArchiveHandler;
      close();
      if (handler) { handler(); }
    });
    document.addEventListener("click", close);

    /* toggle(wrapEl, id, onView, onReview, archived, onArchive) — called
       by the row whose (...) button was clicked. Same id clicked again ->
       toggle closed. A different id -> close whichever row currently owns
       the menu, then reparent + open it on this row. archived (real,
       current AHS.WrongBookRuntime state for this row) drives the
       archiveBtn's own label — 封存 / 取消封存. */
    function toggle(wrapEl, id, onView, onReview, archived, onArchive) {
      var wasOpenHere = activeMenuId === id;
      close();
      if (wasOpenHere) { return; }
      onViewHandler = onView;
      onReviewHandler = onReview;
      onArchiveHandler = onArchive;
      archiveBtn.textContent = archived ? "取消封存" : "封存";
      wrapEl.appendChild(panel);
      panel.removeAttribute("hidden");
      activeMenuId = id;
    }

    return { toggle: toggle, close: close };
  }

  /* ---- Question row ---------------------------------------------------- */
  function questionRow(item, index, onSelect, status, toggleFavorite, moreMenuController, startReviewSession, toggleArchive) {
    var favBadge = el("span", {
      class: "wb-row__favbadge" + (item.bookmarked ? "" : " is-hidden")
    }, [
      el("span", { html: AHS.Icons.heart() }),
      el("span", { text: "收藏" })
    ]);

    var bm = el("button", {
      type: "button", class: "wb-row__bookmark" + (item.bookmarked ? " is-on" : ""),
      "aria-label": item.bookmarked ? "取消收藏" : "收藏",
      "aria-pressed": item.bookmarked ? "true" : "false",
      html: item.bookmarked ? AHS.Icons.bookmarkFill() : AHS.Icons.bookmark()
    });
    bm.addEventListener("click", function (ev) {
      ev.stopPropagation();
      toggleFavorite(item.id);
    });

    var moreToggleBtn = el("button", {
      type: "button", class: "wb-row__more",
      "aria-label": "更多選項", "aria-haspopup": "true",
      html: AHS.Icons.more()
    });
    var menuWrap = el("div", { class: "wb-row__menu-wrap" }, [moreToggleBtn]);
    moreToggleBtn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      moreMenuController.toggle(menuWrap, item.id, function () {
        onSelect(item, row); // WB-006: 查看詳情 selects only, no review
      }, function () {
        startReviewSession([item]); // WB-007/WS-003: distinct Review Session, single-item queue
      }, item.archived, function () {
        toggleArchive(item.id); // AI-121-08: 封存／取消封存，真實持久化，永不刪除
      });
    });

    /* Sprint AI-122 AI-122-04: 左側列表改為真正的「題目列表」— 題號→題目
       （第一行）→Knowledge Point→難度→錯誤次數→最近錯誤日期，不得再重複
       教材名稱（item.title，教材/測驗標題，改僅保留於右側 Detail Panel
       Header，見 renderDetail 的 wb-detail__tags）。這樣才知道「錯哪一
       題」，而非只看到一堆同名的教材列。 */
    var row = el("article", {
      class: "wb-row",
      "data-subject": item.subject, "tabindex": "0", "role": "button",
      "aria-label": "第 " + (index + 1) + " 題：" + item.question
    }, [
      chip(item.subject),
      el("div", { class: "wb-row__info" }, [
        el("h3", { class: "wb-row__title" }, [
          el("span", { class: "wb-row__index", text: "第 " + (index + 1) + " 題" }),
          el("span", { class: "wb-row__question", text: item.question })
        ]),
        el("p", { class: "wb-row__meta", text: item.knowledgePoint || "" }),
        el("div", { class: "wb-row__stats" }, [
          el("span", { class: "wb-row__col wb-row__col--diff" }, [diffTag(deriveDifficulty(item))]),
          /* AI-128: 錯誤次數／正確次數 both shown side by side (was
             錯誤次數 only) — item.correctCount is the new real, cumulative
             field WrongBookRuntime.recordRetry() maintains (see that
             file's own comment on why it's distinct from correctStreak). */
          el("span", { class: "wb-row__col wb-row__col--counts" }, [
            el("span", { class: "wb-row__count wb-row__count--wrong", text: "錯 " + item.errorCount + " 次" }),
            el("span", { class: "wb-row__count wb-row__count--correct", text: "對 " + (item.correctCount || 0) + " 次" })
          ]),
          el("span", { class: "wb-row__col wb-row__col--date" }, [
            el("span", { class: "wb-row__date", text: item.lastError })
          ])
        ]),
        el("div", { class: "wb-row__status" }, [statusTag(getMasteryStatus(item.correctStreak))]),
        favBadge
      ]),
      bm,
      menuWrap
    ]);
    row.addEventListener("click", function () { onSelect(item, row); });
    row.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(item, row); }
    });
    return row;
  }

  /* WB-013: real, functional pagination control (was static Mock chrome
     before). onGoToPage(n) is called for Previous/Next/page-number clicks;
     render(page, totalPages) is called by applyView() whenever the
     filtered/sorted result set changes, keeping the control in sync. */
  function paginationControl(perPage, onGoToPage) {
    var prev = el("button", { type: "button", class: "wb-pagination__nav",
      "aria-label": "上一頁", html: AHS.Icons.chevronRight('style="transform:rotate(180deg)"') });
    var next = el("button", { type: "button", class: "wb-pagination__nav",
      "aria-label": "下一頁", html: AHS.Icons.chevronRight() });
    var pagesWrap = el("div", { class: "wb-pagination__pages" });
    var current = 1;
    var total = 1;

    prev.addEventListener("click", function () { if (current > 1) { onGoToPage(current - 1); } });
    next.addEventListener("click", function () { if (current < total) { onGoToPage(current + 1); } });

    function render(page, totalPages) {
      current = page;
      total = totalPages;
      prev.disabled = page <= 1;
      next.disabled = page >= totalPages;
      pagesWrap.innerHTML = "";
      for (var i = 1; i <= totalPages; i++) {
        (function (num) {
          var b = el("button", {
            type: "button", class: "wb-pagination__btn" + (num === page ? " is-active" : ""),
            text: String(num)
          });
          b.addEventListener("click", function () { onGoToPage(num); });
          pagesWrap.appendChild(b);
        })(i);
      }
      if (totalPages <= 1) { wrap.setAttribute("hidden", "hidden"); }
      else { wrap.removeAttribute("hidden"); }
    }

    var wrap = el("div", { class: "wb-list__foot" }, [
      el("div", { class: "wb-pagination" }, [prev, pagesWrap, next]),
      el("span", { class: "wb-list__perpage", text: "每頁顯示 " + perPage + " 筆" })
    ]);
    render(1, 1);
    return { el: wrap, render: render };
  }

  /* ---- Detail panel ---------------------------------------------------- */
  /* WB-004: interactive re-answer UI used by the Detail Panel's 立即重做
     (single question, inline, no Review Session/Result screen) and by
     startReviewSession()'s per-question steps (WB-007/WB-008, which DO
     wrap it in a Review Session + Result screen — see WS-003). */
  function buildReviewInteraction(item, onSubmit) {
    var selectedKey = null;
    /* AI-127 hotfix: same missing-options guard as renderDetail() —
       a record pulled from Supabase never has item.options. */
    var optionEls = (Array.isArray(item.options) ? item.options : []).map(function (o) {
      var li = el("li", { class: "wb-detail__option", role: "button", tabindex: "0" }, [
        el("span", { class: "wb-detail__option-key", text: o.key }),
        el("span", { class: "wb-detail__option-text", text: o.text })
      ]);
      function pick() {
        selectedKey = o.key;
        Array.prototype.forEach.call(list.querySelectorAll(".wb-detail__option"), function (n) {
          n.classList.remove("is-selected");
        });
        li.classList.add("is-selected");
        submitBtn.removeAttribute("disabled");
      }
      li.addEventListener("click", pick);
      li.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); }
      });
      return li;
    });
    var list = el("ol", { class: "wb-detail__options wb-detail__options--interactive" }, optionEls);
    var submitBtn = el("button", {
      type: "button", class: "wb-detail__btn wb-detail__btn--primary", disabled: "disabled"
    }, [el("span", { text: "提交答案" })]);
    submitBtn.addEventListener("click", function () {
      if (!selectedKey) { return; }
      onSubmit(selectedKey === item.correctAnswer, selectedKey);
    });
    return el("div", { class: "wb-detail__review" }, [
      el("p", { class: "wb-detail__review-prompt", text: "重新作答，選出正確答案：" }),
      list,
      submitBtn
    ]);
  }

  function statBlock(label, value) {
    return el("div", { class: "wb-review-result__stat" }, [
      el("strong", { class: "wb-review-result__value", text: String(value) }),
      el("span", { class: "wb-review-result__label", text: label })
    ]);
  }

  function renderDetail(item, status, toggleFavorite, onReviewSubmit, autoStartReview, onReviewCenterChange) {
    var subj = AHS.Subjects[item.subject];
    var isCorrectNow = item.yourAnswer === item.correctAnswer;

    /* AI-127 hotfix: wrong_book has no `options` column at all (see
       supabase/migrations/20260807000004_learning_tables.sql) — a record
       hydrated purely from WrongBookRuntime.pullFromRepository() (i.e.
       every cross-session/cross-device record) never has item.options.
       Only a record still in this session's memory from a real sync()
       carries it. Guard to [] rather than assume it's always an array;
       an empty option list renders honestly empty instead of crashing
       (which previously aborted the whole Detail Panel + Question List
       render before either could mount). */
    var itemOptions = Array.isArray(item.options) ? item.options : [];
    var options = itemOptions.length ? el("ol", { class: "wb-detail__options" },
      itemOptions.map(function (o) {
        var mods = "";
        if (o.key === item.correctAnswer) { mods += " is-correct"; }
        if (o.key === item.yourAnswer && item.yourAnswer !== item.correctAnswer) { mods += " is-wrong"; }
        return el("li", { class: "wb-detail__option" + mods }, [
          el("span", { class: "wb-detail__option-key", text: o.key }),
          el("span", { class: "wb-detail__option-text", text: o.text })
        ]);
      })) : null;

    /* WB-003 (renamed from 標記知識點): 加入重點整理 — adds/removes this
       question's Knowledge Point from the session-scoped Review Center
       collection (WS-004). No Runtime field exists for this; see the
       Review Center comment above for why it's session-scoped. */
    var kpInCenter = isInReviewCenter(item.knowledgePoint);
    var kpTagBtn = el("button", {
      type: "button", class: "wb-detail__tag-btn" + (kpInCenter ? " is-on" : ""),
      "aria-pressed": kpInCenter ? "true" : "false"
    }, [
      el("span", { html: AHS.Icons.bookmark() }),
      el("span", { class: "wb-detail__tag-btn-label", text: kpInCenter ? "已加入重點整理" : "加入重點整理" })
    ]);
    kpTagBtn.addEventListener("click", function () {
      var nowOn = toggleReviewCenter(item.knowledgePoint);
      kpTagBtn.setAttribute("aria-pressed", nowOn ? "true" : "false");
      kpTagBtn.classList.toggle("is-on", nowOn);
      kpTagBtn.querySelector(".wb-detail__tag-btn-label").textContent = nowOn ? "已加入重點整理" : "加入重點整理";
      if (onReviewCenterChange) { onReviewCenterChange(); }
    });

    /* WB-004: 重新練習 — Current Question -> Answer Again -> Auto Grade ->
       Update Wrong Count -> Refresh Detail -> Return Wrong Book, entirely
       in place (no page navigation). WB-007: the row's More Menu 開始複習
       triggers the exact same flow via autoStartReview below. */
    /* AI-127 hotfix: 立即重做 needs real option choices to be interactive
       at all (buildReviewInteraction() above) — a record pulled from
       Supabase (no options persisted) has none, so honestly disable the
       button with a real reason rather than opening an interaction with
       nothing to click. */
    var reviewBtn = el("button", {
      type: "button", class: "wb-detail__btn wb-detail__btn--primary",
      disabled: itemOptions.length ? null : "disabled",
      title: itemOptions.length ? null : "此題無選項資料，暫不支援立即重做"
    }, [
      el("span", { html: AHS.Icons.refresh() }),
      el("span", { text: "立即重做" })
    ]);
    /* Sprint AI-122 AI-122-01: 立即重做 must be a real, honest reset — the
       previous attempt's own 你的答案／正確答案／詳解 (still showing the
       real correct answer and full explanation from BEFORE this re-do)
       stayed visible directly under the fresh interactive option list,
       defeating the entire point of "重做" (the student could just read
       the answer right below it). Hiding `.wb-detail__answers` and
       `.wb-detail__explain` for the duration of the interactive attempt
       — not deleting them, so they honestly return once
       onReviewSubmit()'s selectItem() re-render supplies this attempt's
       own real new answer/explanation — is the real, minimal fix. */
    function startReview() {
      var interaction = buildReviewInteraction(item, function (wasCorrect, selectedKey) {
        if (onReviewSubmit) { onReviewSubmit(item.id, wasCorrect, selectedKey); }
      });
      var optionsEl = body.querySelector(".wb-detail__options");
      if (optionsEl) { optionsEl.parentNode.replaceChild(interaction, optionsEl); }
      var answersEl = body.querySelector(".wb-detail__answers");
      if (answersEl) { answersEl.setAttribute("hidden", "hidden"); }
      var explainEl = body.querySelector(".wb-detail__explain");
      if (explainEl) { explainEl.setAttribute("hidden", "hidden"); }
      reviewBtn.setAttribute("disabled", "disabled");
    }
    reviewBtn.addEventListener("click", startReview);

    /* WB-005: 加入最愛 — now calls the real toggleFavorite(id), the same
       shared function the row's own bookmark button uses, so Favorite
       Counter / Summary / Favorite Filter all refresh immediately. */
    var favBtn = el("button", {
      type: "button", class: "wb-detail__btn wb-detail__btn--ghost" + (item.bookmarked ? " is-on" : ""),
      "aria-pressed": item.bookmarked ? "true" : "false"
    }, [
      el("span", { html: AHS.Icons.heart() }),
      el("span", { class: "wb-detail__btn-label", text: item.bookmarked ? "已加入最愛" : "加入最愛" })
    ]);
    favBtn.addEventListener("click", function () {
      var nowOn = toggleFavorite(item.id);
      favBtn.classList.toggle("is-on", nowOn);
      favBtn.setAttribute("aria-pressed", nowOn ? "true" : "false");
      favBtn.querySelector(".wb-detail__btn-label").textContent = nowOn ? "已加入最愛" : "加入最愛";
    });

    /* AI Tutor Rule-Based Engine Phase 1: real entry point carrying this
       question's own real, local id (item.id — the only stable way
       AHS.TutorEngine can resolve back to this exact WrongBookRuntime
       record on tutor.html) via AHS.PlatformContext.toQuery(), the same
       shared Context every other cross-page link already uses (never a
       second, ad-hoc query-string builder). */
    var askTutorLink = el("a", {
      class: "wb-detail__btn wb-detail__btn--ghost",
      href: "tutor.html" + (AHS.PlatformContext ? AHS.PlatformContext.toQuery({ questionId: item.id }) : "")
    }, [
      el("span", { html: AHS.Icons.robot() }),
      el("span", { text: "問 AI 巧巧老師" })
    ]);

    /* AI-128（知識弱點排版重新設計）: 錯誤次數／正確次數獨立成一列明顯的
       統計區塊，取代過去混在「你的答案／正確答案／錯誤次數」三欄裡、不易
       一眼看出的舊排版 — 直接對應使用者需求「秀出本題目一共錯誤幾次，
       正確幾次」。correctCount 是 WrongBookRuntime 這次新增的真實累計
       欄位（見該檔 recordRetry() 的註解），不是借用 correctStreak。 */
    var statsBlock = el("div", { class: "wb-detail__stats" }, [
      el("div", { class: "wb-detail__stat wb-detail__stat--wrong" }, [
        el("strong", { class: "wb-detail__stat-value", text: String(item.errorCount || 0) }),
        el("span", { class: "wb-detail__stat-label", text: "錯誤次數" })
      ]),
      el("div", { class: "wb-detail__stat wb-detail__stat--correct" }, [
        el("strong", { class: "wb-detail__stat-value", text: String(item.correctCount || 0) }),
        el("span", { class: "wb-detail__stat-label", text: "正確次數" })
      ])
    ]);

    /* AI-128: 詳解預設收合，「當點選本題目時，才展開詳解」— 點擊本題目
       只展開題目本身的作答資訊（題目／選項／你的答案），詳解本身要再點一次
       這顆按鈕才會展開，避免右側一開始就是一整片文字牆。 */
    var explainToggle = el("button", {
      type: "button", class: "wb-detail__explain-toggle", "aria-expanded": "false"
    }, [
      el("span", { class: "wb-detail__explain-toggle-label", text: "詳解" }),
      el("span", { class: "wb-detail__explain-chevron", html: AHS.Icons.chevronRight() })
    ]);
    var explainText = el("p", { class: "wb-detail__explain-text", text: item.explanation, hidden: "hidden" });
    explainToggle.addEventListener("click", function () {
      var isOpen = explainToggle.getAttribute("aria-expanded") === "true";
      explainToggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
      explainToggle.classList.toggle("is-open", !isOpen);
      if (isOpen) { explainText.setAttribute("hidden", "hidden"); }
      else { explainText.removeAttribute("hidden"); }
    });

    var body = el("div", { class: "wb-detail__body" }, [
      el("div", { class: "wb-detail__head" }, [
        el("h2", { class: "wb-detail__title", text: "題目詳解" }),
        kpTagBtn
      ]),
      /* Sprint AI-122 AI-122-04: 教材資訊（item.title／item.chapter）不再
         顯示於左側題目列表（避免重複，見 questionRow），改保留於此
         Detail Panel 自己的 Header 區塊 — 唯一顯示教材資訊的位置。 */
      el("div", { class: "wb-detail__tags" }, [
        chip(item.subject),
        el("span", { class: "wb-detail__material", text: item.title }),
        el("span", { class: "wb-detail__chapter", text: item.chapter }),
        diffTag(deriveDifficulty(item)),
        el("span", { class: "wb-detail__status" }, [statusTag(getMasteryStatus(item.correctStreak))])
      ]),
      statsBlock,
      el("p", { class: "wb-detail__question", text: "題目：" + item.question }),
      options,
      el("div", { class: "wb-detail__answers" }, [
        el("div", { class: "wb-detail__answer" }, [
          el("span", { class: "wb-detail__answer-label", text: "你的答案" }),
          el("span", {
            class: "wb-detail__answer-badge " + (isCorrectNow ? "is-correct" : "is-wrong"),
            text: item.yourAnswer
          })
        ]),
        el("div", { class: "wb-detail__answer" }, [
          el("span", { class: "wb-detail__answer-label", text: "正確答案" }),
          el("span", { class: "wb-detail__answer-badge is-correct", text: item.correctAnswer })
        ])
      ]),
      el("div", { class: "wb-detail__kp" }, [
        el("span", { class: "wb-detail__kp-label", text: "知識點" }),
        el("span", { class: "wb-detail__kp-chip", text: item.knowledgePoint })
      ]),
      el("div", { class: "wb-detail__explain" }, [explainToggle, explainText]),
      el("div", { class: "wb-detail__actions" }, [reviewBtn, favBtn, askTutorLink])
    ]);

    if (autoStartReview && itemOptions.length) { startReview(); }
    return { el: body, favBtn: favBtn };
  }

  /* AI-129（知識弱點排版重新設計）: 題目詳解改為點擊題目後才彈出的 Modal
     （取代原本常駐右側 30/70 的 Detail Panel），呼應使用者需求「點選題目
     後，再彈出『題目詳解』視窗」。沿用 js/ui/MaterialPreview.js 已建立的
     overlay/panel/close 慣例（同一個 role="dialog" aria-modal="true"、
     背景點擊關閉、右上角 X 關閉），不是重新發明一套彈窗機制。
     openDetailModal(bodyEl, ariaLabel, onClose) — onClose 在「任何」關閉
     途徑（X／背景點擊／Escape）都會真實觸發一次，呼叫端用它同步清空自己
     的選取狀態，永遠不會有「面板顯示過期資料」的問題。 */
  function openDetailModal(bodyEl, ariaLabel, onClose) {
    var overlay = el("div", {
      class: "wb-modal__overlay", role: "dialog", "aria-modal": "true",
      "aria-label": ariaLabel || "題目詳解"
    });
    var bodyWrap = el("div", { class: "wb-modal__body" }, [bodyEl]);
    function close() {
      if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
      document.removeEventListener("keydown", onKeydown);
      if (onClose) { onClose(); }
    }
    function onKeydown(ev) { if (ev.key === "Escape") { close(); } }
    document.addEventListener("keydown", onKeydown);
    overlay.addEventListener("click", function (ev) { if (ev.target === overlay) { close(); } });
    var closeX = el("button", {
      type: "button", class: "wb-modal__close", "aria-label": "關閉", html: AHS.Icons.filterX()
    });
    closeX.addEventListener("click", close);
    var panel = el("div", { class: "card wb-modal__panel" }, [closeX, bodyWrap]);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    return {
      close: close,
      setBody: function (nextBodyEl) {
        bodyWrap.innerHTML = "";
        bodyWrap.appendChild(nextBodyEl);
      }
    };
  }

  /* Master-detail body (filter bar + row list + detail modal) — sourced
     from AHS.WrongBookRuntime.list() instead of AHS.AppConfig.wrongBook.
     `data` still supplies page copy (title/subtitle/bannerTip) and filter
     dropdown option labels only.
     onFavoriteOnlyChange(isOn) — optional callback so a caller outside this
     function (the Header's 我的最愛 button, built separately in create())
     can stay visually in sync with the Favorite Filter chip. */
  function buildMasterDetail(data, runtimeItems, runtime, status, summary, onFavoriteOnlyChange, onReviewCenterChange) {
    var currentModal = null;
    var currentRow = null;
    var currentDetailItemId = null;
    var currentDetailFavBtn = null;

    /* showDetailBody(bodyEl) — AI-129: opens the 題目詳解 Modal on the
       first call, then re-uses the SAME modal (setBody) for every
       subsequent call while it's still open (e.g. onReviewSubmit()'s own
       re-render after answering, or the multi-step Review Session's
       renderStep()/renderResult() below) — never stacks a second modal
       on top of an already-open one. */
    function showDetailBody(bodyEl) {
      if (currentModal) { currentModal.setBody(bodyEl); return; }
      currentModal = openDetailModal(bodyEl, "題目詳解", function () {
        currentModal = null;
        if (currentRow) { currentRow.classList.remove("is-active"); currentRow = null; }
        currentDetailItemId = null;
        currentDetailFavBtn = null;
      });
    }

    function selectItem(item, row, autoStartReview) {
      if (currentRow) { currentRow.classList.remove("is-active"); }
      if (row) { row.classList.add("is-active"); currentRow = row; }
      currentDetailItemId = item.id;
      var detail = renderDetail(item, status, toggleFavorite, onReviewSubmit, autoStartReview, onReviewCenterChange);
      currentDetailFavBtn = detail.favBtn;
      showDetailBody(detail.el);
    }

    function getPairById(id) {
      return pairs.filter(function (p) { return p.item.id === id; })[0];
    }

    /* Refreshes a row's own difficulty / wrong-count / last-error / status
       chips in place after a review result — used by both the single-
       question flow (WB-004) and the batch Review Mode (WB-008). */
    function refreshRowChips(pair) {
      var diffCol = pair.row.querySelector(".wb-row__col--diff");
      if (diffCol) {
        diffCol.innerHTML = "";
        diffCol.appendChild(diffTag(deriveDifficulty(pair.item)));
      }
      var wrongCountEl = pair.row.querySelector(".wb-row__count--wrong");
      if (wrongCountEl) { wrongCountEl.textContent = "錯 " + pair.item.errorCount + " 次"; }
      var correctCountEl = pair.row.querySelector(".wb-row__count--correct");
      if (correctCountEl) { correctCountEl.textContent = "對 " + (pair.item.correctCount || 0) + " 次"; }
      var dateEl = pair.row.querySelector(".wb-row__date");
      if (dateEl) { dateEl.textContent = pair.item.lastError; }
      var statusSlot = pair.row.querySelector(".wb-row__status");
      if (statusSlot) {
        statusSlot.innerHTML = "";
        statusSlot.appendChild(statusTag(getMasteryStatus(pair.item.correctStreak)));
      }
    }

    /* WB-004 core: Answer Again -> Auto Grade -> Update Wrong Count ->
       real mastery tracking (AI-610) -> row chips refresh -> Summary
       refresh. Wrong re-answers use runtime.sync() (existing API) with
       the SAME questionId, which bumps errorCount/lastError in place
       rather than creating a duplicate record. Correct re-answers now
       call runtime.recordRetry() (Sprint AI-111 AI-610, additive) so
       progress toward 已精熟 is real and persisted, not session-local —
       AHS.StatisticsRuntime and 複習中心 read this same real field.
       Shared by both the single-question flow and the batch Review Mode
       (WB-008). */
    function applyReviewResult(itemId, wasCorrect, selectedKey) {
      var pair = getPairById(itemId);
      if (!pair) { return null; }
      if (!wasCorrect) {
        var touched = runtime.sync({
          subject: pair.item.subject, title: pair.item.title, chapter: pair.item.chapter,
          wrong: [{
            questionId: pair.item.questionId, knowledgePoint: pair.item.knowledgePoint,
            text: pair.item.question, options: pair.item.options,
            yourAnswer: selectedKey, correctAnswer: pair.item.correctAnswer,
            explanation: pair.item.explanation
          }]
        });
        if (touched && touched[0]) {
          var updated = touched[0];
          Object.keys(updated).forEach(function (k) { pair.item[k] = updated[k]; });
        }
      } else {
        pair.item.yourAnswer = selectedKey;
      }
      if (typeof runtime.recordRetry === "function") {
        var retried = runtime.recordRetry(itemId, wasCorrect);
        if (retried) { Object.keys(retried).forEach(function (k) { pair.item[k] = retried[k]; }); }
      }
      /* Sprint AI-121: same real correct/wrong knowledge-point signal
         AHS.ReviewRuntime.answerCurrent() records — this file has its
         own, separate WrongBook-page retry flow (WB-004/WB-008), not a
         call through ReviewRuntime, so it must feed
         AHS.KnowledgeMasteryRuntime itself too. */
      if (AHS.KnowledgeMasteryRuntime && typeof AHS.KnowledgeMasteryRuntime.recordAttempt === "function") {
        AHS.KnowledgeMasteryRuntime.recordAttempt(pair.item.knowledgePoint, wasCorrect, pair.item.subject);
      }
      refreshRowChips(pair);
      if (summary && summary.refresh) { summary.refresh(runtime.list()); }
      return pair;
    }

    /* WB-004: single-question review, triggered from the Detail Panel's
       重新練習 (and, via autoStartReview, the row's More Menu 開始複習,
       WB-007). Refreshes the Detail Panel in place — "Return Wrong Book"
       is automatic since we never navigated away. */
    function onReviewSubmit(itemId, wasCorrect, selectedKey) {
      var pair = applyReviewResult(itemId, wasCorrect, selectedKey);
      if (pair) {
        selectItem(pair.item, pair.row);
        applyView();
      }
    }

    /* WS-003: three distinct behaviors, no duplicated functionality —
       - 查看詳情: selectItem() only, no review at all.
       - 立即重做 (WB-004): single question, inline re-answer, refreshes
         the Detail Panel directly, NO Review Session / Result screen.
       - 開始複習 (WB-007) and 全部重新複習 (WB-008/WS-004) both create a
         Review SESSION (progress indicator -> ... -> Review Result
         screen) via this same startReviewSession(); they differ only in
         queue size: 開始複習 = [this one question], 全部重新複習 = the
         current filtered Question List. Filter state (WS-003) is never
         touched by this flow. */
    function startReviewSession(queue) {
      /* Sprint AI-114 AI-902: 全部重新複習 (no explicit queue passed) only
         reviews 尚未精熟 items — a specific row's own 開始複習/立即重做
         (explicit single-item queue) is a deliberate per-item choice and
         stays untouched. */
      queue = queue || getVisibleItems().filter(function (it) { return getMasteryStatus(it.correctStreak) !== "已精熟"; });
      if (queue.length === 0) { return; }
      var index = 0;
      var results = { total: queue.length, correct: 0, wrong: 0, newlyMastered: 0 };

      /* EO-S7.0-003 · Review → Submit → WrongBook 更新（單一路徑）：
         複習作答結果同步回 v1.0 WrongBookSession —— 一律經
         WrongBookGenerator Interface，絕不直接操作 Session。
         規則（決定性，非 AI）：
           答對 → masteryLevel 沿固定階梯升一級
                  new → learning → reviewing → mastered
           答錯 → Generator.add()（同一 Duplicate Rule：wrongCount+1、
                  降回 new、firstWrongAt 不覆蓋）
         兩者皆同步更新 Review Queue（priority = wrongCount；
         nextReviewAt 維持既值/null —— 本 Sprint 不排程）。
         查無對應 v1.0 記錄（legacy 資料）則安靜略過。 */
      function syncV1OnReviewResult(item, wasCorrect, selectedKey) {
        var session = AHS.WrongBookSession, gen = AHS.WrongBookGenerator, rq = AHS.ReviewQueue;
        if (!session || !gen) { return; }
        var rec = session.getByQuestionId(item.questionId);
        if (!rec) { return; }
        var updated = null;
        if (wasCorrect) {
          var ladder = gen.MASTERY_LEVELS;
          var next = ladder[Math.min(ladder.indexOf(rec.masteryLevel) + 1, ladder.length - 1)];
          updated = gen.update(rec.id, { masteryLevel: next });
        } else {
          updated = gen.add({ questionId: item.questionId, userAnswer: selectedKey || "（複習答錯）" });
        }
        if (updated && rq && typeof rq.enqueue === "function") {
          rq.enqueue({
            questionId: updated.questionId,
            masteryLevel: updated.masteryLevel,
            priority: updated.wrongCount,
            nextReviewAt: updated.nextReviewAt || null
          });
        }
      }

      function renderStep() {
        var item = queue[index];
        var interaction = buildReviewInteraction(item, function (wasCorrect, selectedKey) {
          var wasMasteredBefore = getMasteryStatus(item.correctStreak) === "已精熟";
          applyReviewResult(item.id, wasCorrect, selectedKey);
          syncV1OnReviewResult(item, wasCorrect, selectedKey);
          if (wasCorrect) { results.correct += 1; } else { results.wrong += 1; }
          if (!wasMasteredBefore && getMasteryStatus(item.correctStreak) === "已精熟") { results.newlyMastered += 1; }
          index += 1;
          if (index < queue.length) { renderStep(); } else { renderResult(); }
        });
        showDetailBody(el("div", { class: "wb-detail__body wb-review-session" }, [
          el("p", { class: "wb-review-session__progress", text: "複習進度：" + (index + 1) + " / " + queue.length }),
          el("h2", { class: "wb-detail__title", text: item.title }),
          el("p", { class: "wb-detail__question", text: "題目：" + item.question }),
          interaction
        ]));
      }

      function renderResult() {
        var accuracy = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;
        var returnBtn = el("button", { type: "button", class: "wb-detail__btn wb-detail__btn--primary" }, [
          el("span", { text: "返回知識弱點" })
        ]);
        /* AI-129: 題目詳解已改為彈出視窗 — 沒有常駐面板可「返回」，這裡的
           返回動作就是關掉視窗，回到題目列表（filter 狀態全程未被觸碰，
           所以列表本來就維持原樣）。 */
        returnBtn.addEventListener("click", function () {
          applyView();
          if (currentModal) { currentModal.close(); }
        });
        showDetailBody(el("div", { class: "wb-detail__body wb-review-result" }, [
          el("h2", { class: "wb-detail__title", text: "複習結果" }),
          el("div", { class: "wb-review-result__stats" }, [
            statBlock("總題數", results.total),
            statBlock("答對", results.correct),
            statBlock("答錯", results.wrong),
            statBlock("正確率", accuracy + "%"),
            statBlock("新精熟", results.newlyMastered)
          ]),
          returnBtn
        ]));
      }

      renderStep();
    }

    /* WB-005: single shared entry point for toggling Favorite, used by
       both the row's own bookmark button AND the Detail Panel's 加入最愛
       button — keeps every surface (row icon/badge, Detail Panel button,
       Summary Card, Favorite Counter, Favorite Filter view) in sync no
       matter which one triggered the change. Real Runtime API only. */
    function toggleFavorite(id) {
      var nowOn = runtime.toggleBookmark(id);
      var pair = pairs.filter(function (p) { return p.item.id === id; })[0];
      if (pair) {
        pair.item.bookmarked = nowOn;
        var bmBtn = pair.row.querySelector(".wb-row__bookmark");
        var badge = pair.row.querySelector(".wb-row__favbadge");
        if (bmBtn) {
          bmBtn.setAttribute("aria-pressed", nowOn ? "true" : "false");
          bmBtn.classList.toggle("is-on", nowOn);
          bmBtn.innerHTML = nowOn ? AHS.Icons.bookmarkFill() : AHS.Icons.bookmark();
          bmBtn.setAttribute("aria-label", nowOn ? "取消收藏" : "收藏");
        }
        if (badge) { badge.classList.toggle("is-hidden", !nowOn); }
      }
      if (currentDetailItemId === id && currentDetailFavBtn) {
        currentDetailFavBtn.classList.toggle("is-on", nowOn);
        currentDetailFavBtn.setAttribute("aria-pressed", nowOn ? "true" : "false");
        var label = currentDetailFavBtn.querySelector(".wb-detail__btn-label");
        if (label) { label.textContent = nowOn ? "已加入最愛" : "加入最愛"; }
      }
      onFavoriteChange();
      return nowOn;
    }

    /* AI-121-08: 封存／取消封存 — real, persisted Runtime call, never a
       delete. Re-renders this row's status tag + re-applies the current
       view (封存 by default drops out of every non-已封存 filter, same
       as toggleFavorite() above keeps every other real surface in sync). */
    function toggleArchive(id) {
      var current = runtime.getById(id);
      if (!current) { return; }
      var updated = current.archived ? runtime.unarchive(id) : runtime.archive(id);
      if (!updated) { return; }
      var pair = pairs.filter(function (p) { return p.item.id === id; })[0];
      if (pair) {
        pair.item.archived = updated.archived;
        pair.item.weaknessState = updated.weaknessState;
        var statusSlot = pair.row.querySelector(".wb-row__status");
        if (statusSlot) {
          statusSlot.innerHTML = "";
          statusSlot.appendChild(statusTag(getMasteryStatus(pair.item.correctStreak)));
        }
      }
      applyView();
    }

    var moreMenuController = createMoreMenuController();

    var pairs = runtimeItems.map(function (it, i) {
      return {
        item: it,
        order: i,
        row: questionRow(it, i, selectItem, status, toggleFavorite, moreMenuController, startReviewSession, toggleArchive)
      };
    });
    var rows = pairs.map(function (p) { return p.row; });

    /* ---- Filter + Search + Sort (combined) ------------------------------- */
    var SORT_COMPARATORS = {
      "預設": function (a, b) { return a.order - b.order; },
      "最新錯誤": function (a, b) { return (b.item.lastError || "").localeCompare(a.item.lastError || ""); },
      "錯誤次數": function (a, b) { return (b.item.errorCount || 0) - (a.item.errorCount || 0); },
      "我的收藏": function (a, b) { return (b.item.bookmarked ? 1 : 0) - (a.item.bookmarked ? 1 : 0); }
    };
    var subjectFilterId = "all";
    var knowledgeFilter = "all";
    var difficultyFilter = "all";
    var statusFilter = "all";
    var searchText = "";
    var sortKey = "預設";
    var favoriteOnly = false;

    /* WB-002: Knowledge Point options built from the real Runtime data
       (unique knowledgePoint values actually present), not static Mock
       labels — a static list would rarely match real seeded/synced
       records and the filter would silently never match anything. */
    function knowledgeOptionsFor(subjectId) {
      var relevant = subjectId === "all" ? runtimeItems
        : runtimeItems.filter(function (it) { return it.subject === subjectId; });
      var unique = relevant.reduce(function (acc, it) {
        if (it.knowledgePoint && acc.indexOf(it.knowledgePoint) === -1) { acc.push(it.knowledgePoint); }
        return acc;
      }, []).sort();
      return ["全部知識點"].concat(unique);
    }
    var knowledgeOptions = knowledgeOptionsFor("all");

    /* WS-002: Cascade Filter — selecting Subject refreshes the Knowledge
       Point dropdown to show only knowledge points that actually belong
       to that subject (instead of the full unfiltered list). */
    function refreshKnowledgeSelect(subjectId) {
      var sel = mainCol.querySelector('select[aria-label="知識點"]');
      if (!sel) { return; }
      sel.innerHTML = "";
      knowledgeOptionsFor(subjectId).forEach(function (label) {
        sel.appendChild(el("option", { text: label }));
      });
      sel.selectedIndex = 0;
      knowledgeFilter = "all";
    }

    function searchable(item) {
      return [item.title, item.chapter, item.knowledgePoint]
        .filter(function (v) { return v; }).join(" ").toLowerCase();
    }

    var noMatch = el("div", { class: "wb-list__no-match", hidden: "hidden" }, [
      el("p", { class: "wb-list__no-match-text", text: "找不到符合條件的錯題，試著調整篩選或搜尋。" })
    ]);
    var noMatchReset = el("button", { type: "button", class: "wb-clear wb-list__no-match-btn" }, [
      el("span", { html: AHS.Icons.filterX() }),
      el("span", { text: "清除篩選" })
    ]);
    noMatch.appendChild(noMatchReset);

    var currentPage = 1;

    function applyView() {
      var ordered = pairs.slice().sort(SORT_COMPARATORS[sortKey] || SORT_COMPARATORS["預設"]);
      var matching = ordered.filter(function (p) {
        var subjectMatch = subjectFilterId === "all" || p.item.subject === subjectFilterId;
        var knowledgeMatch = knowledgeFilter === "all" || p.item.knowledgePoint === knowledgeFilter;
        // WB-012 / WS-001: Difficulty and Status are derived (not stored on
        // the Runtime record — see deriveDifficulty()/getMasteryStatus()
        // above), so these compare against the derived value, not a
        // nonexistent item.difficulty/item.status field.
        var difficultyMatch = difficultyFilter === "all" || deriveDifficulty(p.item) === difficultyFilter;
        /* AI-121-08: 已封存 is its own explicit filter value — selecting
           it shows ONLY archived items (real History, never deleted);
           every other 狀態 value (including 全部狀態) honestly excludes
           archived items by default, since 封存 means "dismissed from
           the active Knowledge Weakness view", not "gone". */
        var isArchivedFilter = statusFilter === "已封存";
        var archivedMatch = isArchivedFilter ? !!p.item.archived : !p.item.archived;
        var statusMatch = isArchivedFilter || statusFilter === "all" || getMasteryStatus(p.item.correctStreak) === statusFilter;
        var searchMatch = !searchText || searchable(p.item).indexOf(searchText) !== -1;
        var favoriteMatch = !favoriteOnly || p.item.bookmarked;
        return subjectMatch && knowledgeMatch && difficultyMatch && statusMatch && archivedMatch && searchMatch && favoriteMatch;
      });

      // WB-013: Pagination — slice the matching set to the current page.
      var perPage = data.perPage || matching.length || 1;
      var totalPages = Math.max(1, Math.ceil(matching.length / perPage));
      if (currentPage > totalPages) { currentPage = totalPages; }
      if (currentPage < 1) { currentPage = 1; }
      var pageStart = (currentPage - 1) * perPage;
      var pageIds = matching.slice(pageStart, pageStart + perPage)
        .map(function (p) { return p.item.id; });

      ordered.forEach(function (p) { rowsWrap.insertBefore(p.row, noMatch); });
      ordered.forEach(function (p) {
        p.row.style.display = pageIds.indexOf(p.item.id) !== -1 ? "" : "none";
      });

      if (matching.length === 0) { noMatch.removeAttribute("hidden"); }
      else { noMatch.setAttribute("hidden", "hidden"); }

      if (paginationCtrl) { paginationCtrl.render(currentPage, totalPages); }
      /* AI-129: 題目詳解已是使用者自己點開的獨立 Modal（非常駐面板），與
         左側列表的篩選/分頁狀態脫鉤 — 篩選變更不再需要「回退到第一筆符合
         項目」或「清空過期 Detail」，Modal 若已開啟就維持原樣，關閉與否
         完全由使用者自己決定。 */
    }

    function goToPage(page) {
      currentPage = page;
      applyView();
    }

    /* Live 我的收藏 count shown on the Favorite Filter chip itself,
       independent from (but refreshed alongside) the Summary Card. */
    function refreshFavoriteCount() {
      var countEl = mainCol.querySelector(".wb-fav-filter__count");
      if (countEl) {
        var count = runtime.list().filter(function (i) { return i.bookmarked; }).length;
        countEl.textContent = "(" + count + ")";
      }
    }

    /* Single entry point for any Favorite state change — refreshes the
       Summary Card, the Favorite Filter's own counter, and re-applies the
       current view (so Favorite Filter / 我的收藏 sort immediately reflect
       the change). */
    function onFavoriteChange() {
      var list = runtime.list();
      if (summary && summary.refresh) { summary.refresh(list); }
      refreshFavoriteCount();
      applyView();
    }

    function onSubjectFilter(label) {
      subjectFilterId = "all";
      if (label !== "全部科目") {
        Object.keys(AHS.Subjects).forEach(function (k) {
          if (AHS.Subjects[k].name === label) { subjectFilterId = k; }
        });
      }
      refreshKnowledgeSelect(subjectFilterId);
      currentPage = 1;
      applyView();
    }
    function onKnowledgeFilter(label) {
      knowledgeFilter = label === "全部知識點" ? "all" : label;
      currentPage = 1;
      applyView();
    }
    function onDifficultyFilter(label) {
      difficultyFilter = label === "全部難易度" ? "all" : label;
      currentPage = 1;
      applyView();
    }
    function onStatusFilter(label) {
      statusFilter = label === "全部狀態" ? "all" : label;
      currentPage = 1;
      applyView();
    }
    function onSearchInput(value) {
      searchText = (value || "").trim().toLowerCase();
      currentPage = 1;
      applyView();
    }
    function onSortChange(label) {
      sortKey = label;
      currentPage = 1;
      applyView();
    }

    /* WB-009: single source of truth for Favorite Mode, shared by the
       Favorite Filter chip (filter bar) AND the Header's 我的最愛 button —
       whichever triggers it, both stay visually in sync via
       onFavoriteOnlyChange. */
    function setFavoriteOnly(isOn) {
      favoriteOnly = isOn;
      var favToggleEl = mainCol.querySelector(".wb-fav-filter");
      if (favToggleEl) {
        favToggleEl.setAttribute("aria-pressed", isOn ? "true" : "false");
        favToggleEl.classList.toggle("is-on", isOn);
      }
      currentPage = 1;
      applyView();
      if (typeof onFavoriteOnlyChange === "function") { onFavoriteOnlyChange(isOn); }
    }
    function isFavoriteOnly() { return favoriteOnly; }

    function getVisibleItems() {
      return pairs.filter(function (p) { return p.row.style.display !== "none"; })
        .map(function (p) { return p.item; });
    }

    function clearFilters() {
      /* AI-129 bugfix: this used to query `list` (the 題目列表 section) —
         but the actual <select> controls live in the filter bar, a
         SIBLING of `list`, never a descendant of it, so selectedIndex was
         never really reset here (only the underlying filter STATE
         variables were, via the assignments below) — the dropdowns kept
         showing their old label even though filtering behaved as "全部".
         mainCol wraps both, so querying from there actually reaches
         them. */
      Array.prototype.forEach.call(mainCol.querySelectorAll(".wb-select__control"),
        function (s) { s.selectedIndex = 0; });
      var searchInput = mainCol.querySelector(".wb-search__input");
      if (searchInput) { searchInput.value = ""; }
      subjectFilterId = "all";
      knowledgeFilter = "all";
      difficultyFilter = "all";
      statusFilter = "all";
      searchText = "";
      sortKey = "預設";
      currentPage = 1;
      refreshKnowledgeSelect("all");
      setFavoriteOnly(false);
    }
    noMatchReset.addEventListener("click", clearFilters);

    var rowsWrap = el("div", { class: "wb-list__rows" }, rows.concat([noMatch]));
    var paginationCtrl = paginationControl(data.perPage, goToPage);
    applyView();

    /* Sprint AI-122 AI-122-04: the old .wb-list__cols header (難易度/
       錯誤次數/最後錯誤 as right-aligned table headers) assumed each row
       was one horizontal table line — no longer true now that a row is a
       stacked 題號/題目/Knowledge Point/難度/錯誤次數/最近錯誤 block, so
       those floating column labels no longer align to anything real. */
    var listChildren = [
      el("div", { class: "wb-list__head" }, [
        el("h2", { class: "wb-list__title", text: "錯題列表" }),
        el("span", { class: "wb-list__count", text: "共 " + runtimeItems.length + " 題" })
      ]),
      rowsWrap,
      paginationCtrl.el
    ];
    var list = el("section", { class: "card wb-list", "aria-label": "錯題列表" }, listChildren);

    /* AI-129: 篩選區與「今日待複習」統計卡並排（wb-top-row），取代原本
       篩選區獨立一列、統計卡另外顯示在頁面最上方的排版；題目列表本身則
       改為單欄全寬（取代原本 30%/70% 的左右兩欄），呼應「左邊題目改到
       中間『題目詳解』位置」— 題目列表現在佔用的正是過去 Detail Panel
       所在的主要閱讀區域。 */
    var filterBarEl = filterBar(data, knowledgeOptions, {
      onSubject: onSubjectFilter,
      onKnowledge: onKnowledgeFilter,
      onDifficulty: onDifficultyFilter,
      onStatus: onStatusFilter,
      onSearch: onSearchInput,
      onSort: onSortChange,
      onFavoriteToggle: setFavoriteOnly,
      onClear: clearFilters
    });
    var topRow = el("div", { class: "wb-top-row" }, [summary.el, filterBarEl]);
    var mainCol = el("div", { class: "wb-main" }, [
      topRow,
      list,
      status
    ]);
    refreshFavoriteCount();

    return {
      el: mainCol,
      setFavoriteOnly: setFavoriteOnly,
      isFavoriteOnly: isFavoriteOnly,
      getVisibleItems: getVisibleItems,
      startReviewSession: startReviewSession
    };
  }

  /* create(model?) — model defaults to AHS.AppConfig.wrongBook (page copy +
     filter option labels only; wrong-question records always come from
     AHS.WrongBookRuntime, per PMO ruling — Runtime is Source of Truth,
     no Mock fallback for records, no seed injection). */
  function create(model) {
    var data = model || AHS.AppConfig.wrongBook;
    var runtime = AHS.WrongBookRuntime;
    var runtimeItems = runtime ? runtime.list() : [];
    var isEmpty = runtime ? runtime.isEmpty() : runtimeItems.length === 0;

    var status = el("p", {
      class: "wb-status", "aria-live": "polite", hidden: "hidden"
    });

    var summary = summaryCard(runtimeItems);
    var reviewCenterPanelCtrl = reviewCenterPanel();

    // WB-009: keeps the Header's 我的最愛 button visually in sync whenever
    // Favorite Mode changes, regardless of whether it was triggered by the
    // Header button itself or the filter bar's 只看收藏 chip.
    var headerFavBtn = null;
    /* AI-129: summary.el (今日待複習) is now paired side-by-side with the
       filter bar INSIDE buildMasterDetail's own wb-top-row — only the
       true-empty branch (no filter bar exists to pair it with) still
       renders it here as its own standalone row. */
    var body = isEmpty
      ? { el: el("div", { class: "wb-empty-wrap" }, [summary.el, emptyState()]), setFavoriteOnly: null, isFavoriteOnly: function () { return false; }, getVisibleItems: function () { return []; }, startReviewSession: function () {} }
      : buildMasterDetail(data, runtimeItems, runtime, status, summary, function (isOn) {
        if (headerFavBtn) {
          headerFavBtn.setAttribute("aria-pressed", isOn ? "true" : "false");
          headerFavBtn.classList.toggle("is-on", isOn);
        }
      }, reviewCenterPanelCtrl.refresh);

    var header = headerBlock(data, status, {
      // WB-008/WS-004: Header 重新練習 — reviews the CURRENT filtered
      // Question List (not a single question), then shows a Review Result
      // screen before returning to the normal Wrong Book view.
      onReviewAll: function () {
        if (body.startReviewSession) { body.startReviewSession(); }
      },
      // WB-009: Header 我的最愛 toggles the same Favorite Mode as the
      // filter bar's 只看收藏 chip (single shared state).
      onToggleFavoriteMode: function () {
        if (!body.setFavoriteOnly) { return; }
        body.setFavoriteOnly(!body.isFavoriteOnly());
      },
      // WB-010: real browser-only JSON+CSV download of the current
      // (filtered/visible) Wrong Book set. No backend.
      onExport: function () {
        var items = body.getVisibleItems ? body.getVisibleItems() : runtimeItems;
        exportWrongBook(items);
        status.textContent = "已匯出 " + items.length + " 筆錯題（JSON / CSV）";
        status.removeAttribute("hidden");
      }
    });
    headerFavBtn = header.favBtn;

    return el("div", { class: "wb-page" }, [
      header.el,
      reviewCenterPanelCtrl.el,
      body.el
    ]);
  }

  /* Sprint AI-114 AI-901/902: buildReviewInteraction is a pure function
     (item, onSubmit) -> DOM node — no dependency on this module's own
     closure state (pairs/currentModal/etc.). Exposed so js/components/
     ReviewSession.js (複習中心's own real Review Session, AI-901) can
     reuse the exact same real question-interaction UI instead of
     building a second one — same rendering, same "選了才能提交" behavior,
     one definition. */
  return { create: create, buildReviewInteraction: buildReviewInteraction };
})();
