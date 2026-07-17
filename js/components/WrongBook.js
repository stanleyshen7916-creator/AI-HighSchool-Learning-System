/* components/WrongBook.js — 錯題本 (Wrong Book) page.
   Master-detail layout: banner + filter bar + wrong-question list (with
   pagination) on the left, question detail panel on the right. Selecting a
   row updates the detail panel. All Mock. PascalCase under window.AHS. */
window.AHS = window.AHS || {};
AHS.WrongBook = (function () {
  "use strict";
  var el = AHS.UI.el;

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
     No field for this exists on WrongBookRuntime, and adding one is a
     Runtime schema change (forbidden this Work Order); persisting via
     localStorage is also forbidden. Implemented as session-scoped,
     in-memory state — the same durability class WrongBookRuntime itself
     already has (it also starts empty every reload, per earlier PMO
     ruling R2 — "this is EXPECTED behavior"). Fully automatic, no manual
     setting; resets on page reload along with everything else. */
  var masteryTracker = {}; // { [itemId]: consecutiveCorrectCount }

  function recordReviewResult(itemId, wasCorrect) {
    masteryTracker[itemId] = wasCorrect ? (masteryTracker[itemId] || 0) + 1 : 0;
  }
  function getMasteryStatus(itemId) {
    var count = masteryTracker[itemId] || 0;
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

  function chip(subjectKey) {
    var subj = AHS.Subjects[subjectKey];
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

    var reviewBtn = actionBtn("wb-action--primary", "refresh", "全部重新複習", function () {
      if (handlers.onReviewAll) { handlers.onReviewAll(); }
    });
    var favBtn = actionBtn("wb-action--ghost", "heart", "我的最愛", function (btnEl) {
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

  /* ---- Summary Card (W001-1, updated WS-001) -----------------------------
     Reads from AHS.WrongBookRuntime plus the session-scoped mastery
     tracker (see WS-001 above) — no Runtime schema change involved.
     "今日待複習" (due today) still has no representation anywhere (no
     Runtime field, no derivable concept, not addressed by any Work Order
     to date) and remains fixed at 0. "已精熟" (mastered) is now real,
     computed from getMasteryStatus() — automatic, session-scoped. */
  var SUMMARY_DEFS = [
    { key: "total", icon: "wrong", label: "全部錯題" },
    { key: "dueToday", icon: "clock", label: "今日待複習" },
    { key: "mastered", icon: "award", label: "已精熟" },
    { key: "favorite", icon: "heart", label: "我的收藏" }
  ];

  function summaryCounts(items) {
    return {
      total: items.length,
      dueToday: 0,
      mastered: items.filter(function (i) { return getMasteryStatus(i.id) === "已精熟"; }).length,
      favorite: items.filter(function (i) { return i.bookmarked; }).length
    };
  }

  function summaryCard(items) {
    var valueEls = {};
    var wrap = el("section", { class: "card wb-summary", "aria-label": "錯題本統計" },
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
      el("h3", { class: "wb-empty__title", text: "尚未建立錯題" }),
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
    var panel = el("div", { class: "wb-row__menu", role: "menu", hidden: "hidden" },
      [viewBtn, reviewBtn]);

    function close() {
      panel.setAttribute("hidden", "hidden");
      if (panel.parentNode) { panel.parentNode.removeChild(panel); }
      activeMenuId = null;
      onViewHandler = null;
      onReviewHandler = null;
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
    document.addEventListener("click", close);

    /* toggle(wrapEl, id, onView, onReview) — called by the row whose (...)
       button was clicked. Same id clicked again -> toggle closed. A
       different id -> close whichever row currently owns the menu, then
       reparent + open it on this row. */
    function toggle(wrapEl, id, onView, onReview) {
      var wasOpenHere = activeMenuId === id;
      close();
      if (wasOpenHere) { return; }
      onViewHandler = onView;
      onReviewHandler = onReview;
      wrapEl.appendChild(panel);
      panel.removeAttribute("hidden");
      activeMenuId = id;
    }

    return { toggle: toggle, close: close };
  }

  /* ---- Question row ---------------------------------------------------- */
  function questionRow(item, index, onSelect, status, toggleFavorite, moreMenuController, startReviewSession) {
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
      });
    });

    var row = el("article", {
      class: "wb-row" + (index === 0 ? " is-active" : ""),
      "data-subject": item.subject, "tabindex": "0", "role": "button",
      "aria-label": item.title
    }, [
      chip(item.subject),
      el("div", { class: "wb-row__info" }, [
        el("h3", { class: "wb-row__title", text: item.title }),
        el("p", { class: "wb-row__meta", text: item.chapter }),
        el("div", { class: "wb-row__status" }, [statusTag(getMasteryStatus(item.id))]),
        favBadge
      ]),
      el("div", { class: "wb-row__col wb-row__col--diff" }, [diffTag(deriveDifficulty(item))]),
      el("div", { class: "wb-row__col" }, [
        el("span", { class: "wb-row__count", text: item.errorCount + " 次" })
      ]),
      el("div", { class: "wb-row__col wb-row__col--date" }, [
        el("span", { class: "wb-row__date", text: item.lastError })
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
    var optionEls = item.options.map(function (o) {
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

    var options = el("ol", { class: "wb-detail__options" },
      item.options.map(function (o) {
        var mods = "";
        if (o.key === item.correctAnswer) { mods += " is-correct"; }
        if (o.key === item.yourAnswer && item.yourAnswer !== item.correctAnswer) { mods += " is-wrong"; }
        return el("li", { class: "wb-detail__option" + mods }, [
          el("span", { class: "wb-detail__option-key", text: o.key }),
          el("span", { class: "wb-detail__option-text", text: o.text })
        ]);
      }));

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
    var reviewBtn = el("button", { type: "button", class: "wb-detail__btn wb-detail__btn--primary" }, [
      el("span", { html: AHS.Icons.refresh() }),
      el("span", { text: "立即重做" })
    ]);
    function startReview() {
      var interaction = buildReviewInteraction(item, function (wasCorrect, selectedKey) {
        if (onReviewSubmit) { onReviewSubmit(item.id, wasCorrect, selectedKey); }
      });
      var optionsEl = body.querySelector(".wb-detail__options");
      if (optionsEl) { optionsEl.parentNode.replaceChild(interaction, optionsEl); }
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

    var body = el("div", { class: "wb-detail__body" }, [
      el("div", { class: "wb-detail__head" }, [
        el("h2", { class: "wb-detail__title", text: "題目詳解" }),
        kpTagBtn
      ]),
      el("div", { class: "wb-detail__tags" }, [
        chip(item.subject),
        el("span", { class: "wb-detail__chapter", text: item.chapter }),
        diffTag(deriveDifficulty(item)),
        el("span", { class: "wb-detail__status" }, [statusTag(getMasteryStatus(item.id))])
      ]),
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
        ]),
        el("div", { class: "wb-detail__answer" }, [
          el("span", { class: "wb-detail__answer-label", text: "錯誤次數" }),
          el("strong", { class: "wb-detail__answer-count", text: item.errorCount + " 次" })
        ])
      ]),
      el("div", { class: "wb-detail__kp" }, [
        el("span", { class: "wb-detail__kp-label", text: "知識點" }),
        el("span", { class: "wb-detail__kp-chip", text: item.knowledgePoint })
      ]),
      el("div", { class: "wb-detail__explain" }, [
        el("span", { class: "wb-detail__explain-label", text: "詳解" }),
        el("p", { class: "wb-detail__explain-text", text: item.explanation })
      ]),
      el("div", { class: "wb-detail__actions" }, [reviewBtn, favBtn])
    ]);

    if (autoStartReview) { startReview(); }
    return { el: body, favBtn: favBtn };
  }

  /* Master-detail body (filter bar + row list + detail panel) — unchanged
     structure, now sourced from AHS.WrongBookRuntime.list() instead of
     AHS.Mock.wrongBook. `data` still supplies page copy (title/subtitle/
     bannerTip) and filter dropdown option labels only.
     onFavoriteOnlyChange(isOn) — optional callback so a caller outside this
     function (the Header's 我的最愛 button, built separately in create())
     can stay visually in sync with the Favorite Filter chip. */
  function buildMasterDetail(data, runtimeItems, runtime, status, summary, onFavoriteOnlyChange, onReviewCenterChange) {
    var detailPanel = el("section", { class: "card wb-detail", "aria-label": "題目詳解" });
    var currentRow = null;
    var currentDetailItemId = null;
    var currentDetailFavBtn = null;

    function selectItem(item, row, autoStartReview) {
      if (currentRow) { currentRow.classList.remove("is-active"); }
      if (row) { row.classList.add("is-active"); currentRow = row; }
      detailPanel.innerHTML = "";
      var detail = renderDetail(item, status, toggleFavorite, onReviewSubmit, autoStartReview, onReviewCenterChange);
      detailPanel.appendChild(detail.el);
      currentDetailItemId = item.id;
      currentDetailFavBtn = detail.favBtn;
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
      var countEl = pair.row.querySelector(".wb-row__count");
      if (countEl) { countEl.textContent = pair.item.errorCount + " 次"; }
      var dateEl = pair.row.querySelector(".wb-row__date");
      if (dateEl) { dateEl.textContent = pair.item.lastError; }
      var statusSlot = pair.row.querySelector(".wb-row__status");
      if (statusSlot) {
        statusSlot.innerHTML = "";
        statusSlot.appendChild(statusTag(getMasteryStatus(pair.item.id)));
      }
    }

    /* WB-004 core: Answer Again -> Auto Grade -> Update Wrong Count ->
       (mastery tracking, WS-001) -> row chips refresh -> Summary refresh.
       Wrong re-answers use runtime.sync() (existing API) with the SAME
       questionId, which bumps errorCount/lastError in place rather than
       creating a duplicate record. Correct re-answers have no Runtime
       concept to update (Runtime only ever tracks wrong answers) — only
       the session-scoped mastery tracker advances. Shared by both the
       single-question flow and the batch Review Mode (WB-008). */
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
      recordReviewResult(itemId, wasCorrect);
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
      queue = queue || getVisibleItems();
      if (queue.length === 0) { return; }
      var index = 0;
      var results = { total: queue.length, correct: 0, wrong: 0, newlyMastered: 0 };
      var returnItemId = currentDetailItemId;

      function renderStep() {
        var item = queue[index];
        var interaction = buildReviewInteraction(item, function (wasCorrect, selectedKey) {
          var wasMasteredBefore = getMasteryStatus(item.id) === "已精熟";
          applyReviewResult(item.id, wasCorrect, selectedKey);
          if (wasCorrect) { results.correct += 1; } else { results.wrong += 1; }
          if (!wasMasteredBefore && getMasteryStatus(item.id) === "已精熟") { results.newlyMastered += 1; }
          index += 1;
          if (index < queue.length) { renderStep(); } else { renderResult(); }
        });
        detailPanel.innerHTML = "";
        detailPanel.appendChild(el("div", { class: "wb-detail__body wb-review-session" }, [
          el("p", { class: "wb-review-session__progress", text: "複習進度：" + (index + 1) + " / " + queue.length }),
          el("h2", { class: "wb-detail__title", text: item.title }),
          el("p", { class: "wb-detail__question", text: "題目：" + item.question }),
          interaction
        ]));
      }

      function renderResult() {
        var accuracy = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;
        var returnBtn = el("button", { type: "button", class: "wb-detail__btn wb-detail__btn--primary" }, [
          el("span", { text: "返回錯題本" })
        ]);
        returnBtn.addEventListener("click", function () {
          // Return Wrong Book automatically; filter state was never
          // touched, so this restores exactly what was visible.
          applyView();
          var backPair = (returnItemId && getPairById(returnItemId)) || getVisibleItems().map(function (it) {
            return getPairById(it.id);
          })[0];
          if (backPair) { selectItem(backPair.item, backPair.row); }
        });
        detailPanel.innerHTML = "";
        detailPanel.appendChild(el("div", { class: "wb-detail__body wb-review-result" }, [
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

    var moreMenuController = createMoreMenuController();

    var pairs = runtimeItems.map(function (it, i) {
      return {
        item: it,
        order: i,
        row: questionRow(it, i, selectItem, status, toggleFavorite, moreMenuController, startReviewSession)
      };
    });
    var rows = pairs.map(function (p) { return p.row; });
    currentRow = rows[0];

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
        var statusMatch = statusFilter === "all" || getMasteryStatus(p.item.id) === statusFilter;
        var searchMatch = !searchText || searchable(p.item).indexOf(searchText) !== -1;
        var favoriteMatch = !favoriteOnly || p.item.bookmarked;
        return subjectMatch && knowledgeMatch && difficultyMatch && statusMatch && searchMatch && favoriteMatch;
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

      // Left List <-> Right Detail must always stay synchronized — but
      // "preserve Detail selection correctly" (WB-013) means paging to a
      // different page must NOT change what's selected, only Filter/
      // Search truly removing the selected item from the result set
      // should trigger a fallback to the first match.
      var stillMatches = currentDetailItemId &&
        matching.some(function (p) { return p.item.id === currentDetailItemId; });
      if (!stillMatches && matching.length > 0) {
        selectItem(matching[0].item, matching[0].row);
      }
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
      Array.prototype.forEach.call(list.querySelectorAll(".wb-select__control"),
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

    var listChildren = [
      el("div", { class: "wb-list__head" }, [
        el("h2", { class: "wb-list__title", text: "錯題列表" }),
        el("span", { class: "wb-list__count", text: "共 " + runtimeItems.length + " 題" }),
        el("div", { class: "wb-list__cols" }, [
          el("span", { text: "難易度" }),
          el("span", { text: "錯誤次數" }),
          el("span", { text: "最後錯誤" })
        ])
      ]),
      rowsWrap,
      paginationCtrl.el
    ];
    var list = el("section", { class: "card wb-list", "aria-label": "錯題列表" }, listChildren);

    var mainCol = el("div", { class: "wb-main" }, [
      filterBar(data, knowledgeOptions, {
        onSubject: onSubjectFilter,
        onKnowledge: onKnowledgeFilter,
        onDifficulty: onDifficultyFilter,
        onStatus: onStatusFilter,
        onSearch: onSearchInput,
        onSort: onSortChange,
        onFavoriteToggle: setFavoriteOnly,
        onClear: clearFilters
      }),
      list,
      status
    ]);
    refreshFavoriteCount();

    // initial detail
    selectItem(runtimeItems[0], rows[0]);

    return {
      el: el("div", { class: "wb-layout" }, [mainCol, detailPanel]),
      setFavoriteOnly: setFavoriteOnly,
      isFavoriteOnly: isFavoriteOnly,
      getVisibleItems: getVisibleItems,
      startReviewSession: startReviewSession
    };
  }

  /* create(model?) — model defaults to AHS.Mock.wrongBook (page copy +
     filter option labels only; wrong-question records always come from
     AHS.WrongBookRuntime, per PMO ruling — Runtime is Source of Truth,
     no Mock fallback for records, no seed injection). */
  function create(model) {
    var data = model || AHS.Mock.wrongBook;
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
    var body = isEmpty
      ? { el: emptyState(), setFavoriteOnly: null, isFavoriteOnly: function () { return false; }, getVisibleItems: function () { return []; }, startReviewSession: function () {} }
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
      summary.el,
      reviewCenterPanelCtrl.el,
      body.el
    ]);
  }

  return { create: create };
})();
