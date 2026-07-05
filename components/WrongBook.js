/* components/WrongBook.js — 錯題本 (Wrong Book) page.
   Master-detail layout: banner + filter bar + wrong-question list (with
   pagination) on the left, question detail panel on the right. Selecting a
   row updates the detail panel. All Mock. PascalCase under window.AHS. */
window.AHS = window.AHS || {};
AHS.WrongBook = (function () {
  "use strict";
  var el = AHS.UI.el;

  var DIFF_TONE = { "簡單": "#22b573", "中等": "#f59e0b", "困難": "#ef4444" };

  function chip(subjectKey) {
    var subj = AHS.Subjects[subjectKey];
    return el("span", {
      class: "chip",
      style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
    }, [el("span", { text: subj.name })]);
  }

  function diffTag(difficulty) {
    var tone = DIFF_TONE[difficulty] || "#6b7280";
    return el("span", {
      class: "wb-tag",
      style: "color:" + tone + ";background-color:" + tone + "1a",
      text: difficulty
    });
  }

  /* ---- Banner + actions ------------------------------------------------ */
  function headerBlock(data, status) {
    function actionBtn(cls, icon, label) {
      var b = el("button", { type: "button", class: "wb-action " + cls }, [
        el("span", { html: AHS.Icons[icon]() }),
        el("span", { text: label })
      ]);
      b.addEventListener("click", function () {
        status.textContent = "（Mock）" + label;
        status.removeAttribute("hidden");
      });
      return b;
    }

    return el("div", { class: "wb-header" }, [
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
      el("div", { class: "wb-header__actions" }, [
        actionBtn("wb-action--primary", "refresh", "重新練習"),
        actionBtn("wb-action--ghost", "heart", "我的最愛"),
        actionBtn("wb-action--ghost", "download", "錯題匯出")
      ])
    ]);
  }

  /* ---- Filter bar ------------------------------------------------------ */
  function filterBar(data, onSubject, onClear) {
    var search = el("div", { class: "wb-search" }, [
      el("span", { class: "wb-search__icon", html: AHS.Icons.search() }),
      el("input", {
        class: "wb-search__input", type: "search",
        placeholder: "搜尋錯題內容或關鍵字…", "aria-label": "搜尋錯題"
      })
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

    var clearBtn = el("button", { type: "button", class: "wb-clear" }, [
      el("span", { html: AHS.Icons.filterX() }),
      el("span", { text: "清除篩選" })
    ]);
    clearBtn.addEventListener("click", onClear);

    return el("section", { class: "card wb-filter", "aria-label": "篩選錯題" }, [
      search,
      el("div", { class: "wb-filter__row" }, [
        select("科目", data.subjectOptions, onSubject),
        select("知識點", data.knowledgeOptions, null),
        select("難易度", data.difficultyOptions, null),
        select("狀態", data.statusOptions, null),
        clearBtn
      ])
    ]);
  }

  /* ---- Question row ---------------------------------------------------- */
  function questionRow(item, index, onSelect) {
    var bm = el("button", {
      type: "button", class: "wb-row__bookmark" + (item.bookmarked ? " is-on" : ""),
      "aria-label": item.bookmarked ? "取消收藏" : "收藏",
      "aria-pressed": item.bookmarked ? "true" : "false",
      html: item.bookmarked ? AHS.Icons.bookmarkFill() : AHS.Icons.bookmark()
    });
    bm.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var on = bm.getAttribute("aria-pressed") === "true";
      bm.setAttribute("aria-pressed", on ? "false" : "true");
      bm.classList.toggle("is-on", !on);
      bm.innerHTML = on ? AHS.Icons.bookmark() : AHS.Icons.bookmarkFill();
    });

    var row = el("article", {
      class: "wb-row" + (index === 0 ? " is-active" : ""),
      "data-subject": item.subject, "tabindex": "0", "role": "button",
      "aria-label": item.title
    }, [
      chip(item.subject),
      el("div", { class: "wb-row__info" }, [
        el("h3", { class: "wb-row__title", text: item.title }),
        el("p", { class: "wb-row__meta", text: item.chapter })
      ]),
      el("div", { class: "wb-row__col wb-row__col--diff" }, [diffTag(item.difficulty)]),
      el("div", { class: "wb-row__col" }, [
        el("span", { class: "wb-row__count", text: item.errorCount + " 次" })
      ]),
      el("div", { class: "wb-row__col wb-row__col--date" }, [
        el("span", { class: "wb-row__date", text: item.lastError })
      ]),
      bm
    ]);
    row.addEventListener("click", function () { onSelect(item, row); });
    row.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(item, row); }
    });
    return row;
  }

  function pagination(data, status) {
    var pages = [1, 2, 3, 4, 5, "…", data.totalPages];
    var wrap = el("div", { class: "wb-pagination" });
    var prev = el("button", { type: "button", class: "wb-page wb-page--nav",
      "aria-label": "上一頁", html: AHS.Icons.chevronRight('style="transform:rotate(180deg)"') });
    wrap.appendChild(prev);
    pages.forEach(function (p) {
      if (p === "…") {
        wrap.appendChild(el("span", { class: "wb-page wb-page--gap", text: "…" }));
        return;
      }
      var b = el("button", {
        type: "button",
        class: "wb-page" + (p === 1 ? " is-active" : ""), text: String(p)
      });
      b.addEventListener("click", function () {
        var sibs = wrap.querySelectorAll(".wb-page");
        Array.prototype.forEach.call(sibs, function (s) { s.classList.remove("is-active"); });
        b.classList.add("is-active");
        status.textContent = "（Mock）切換到第 " + p + " 頁";
        status.removeAttribute("hidden");
      });
      wrap.appendChild(b);
    });
    var next = el("button", { type: "button", class: "wb-page wb-page--nav",
      "aria-label": "下一頁", html: AHS.Icons.chevronRight() });
    wrap.appendChild(next);

    return el("div", { class: "wb-list__foot" }, [
      wrap,
      el("span", { class: "wb-list__perpage", text: "每頁顯示 " + data.perPage + " 筆" })
    ]);
  }

  /* ---- Detail panel ---------------------------------------------------- */
  function renderDetail(item, status) {
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

    function bottomBtn(cls, icon, label) {
      var b = el("button", { type: "button", class: "wb-detail__btn " + cls }, [
        el("span", { html: AHS.Icons[icon]() }),
        el("span", { text: label })
      ]);
      b.addEventListener("click", function () {
        status.textContent = "（Mock）" + label + "：" + item.title;
        status.removeAttribute("hidden");
      });
      return b;
    }

    return el("div", { class: "wb-detail__body" }, [
      el("div", { class: "wb-detail__head" }, [
        el("h2", { class: "wb-detail__title", text: "題目詳解" }),
        el("button", { type: "button", class: "wb-detail__tag-btn" }, [
          el("span", { html: AHS.Icons.bookmark() }),
          el("span", { text: "標記知識點" })
        ])
      ]),
      el("div", { class: "wb-detail__tags" }, [
        chip(item.subject),
        el("span", { class: "wb-detail__chapter", text: item.chapter }),
        diffTag(item.difficulty)
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
      el("div", { class: "wb-detail__actions" }, [
        bottomBtn("wb-detail__btn--primary", "refresh", "重新練習"),
        bottomBtn("wb-detail__btn--ghost", "heart", "加入最愛")
      ])
    ]);
  }

  /* create(model?) — model defaults to AHS.Mock.wrongBook. */
  function create(model) {
    var data = model || AHS.Mock.wrongBook;
    var status = el("p", {
      class: "wb-status", "aria-live": "polite", hidden: "hidden"
    });

    var detailPanel = el("section", { class: "card wb-detail", "aria-label": "題目詳解" });
    var currentRow = null;
    function selectItem(item, row) {
      if (currentRow) { currentRow.classList.remove("is-active"); }
      if (row) { row.classList.add("is-active"); currentRow = row; }
      detailPanel.innerHTML = "";
      detailPanel.appendChild(renderDetail(item, status));
    }

    var rows = data.items.map(function (it, i) {
      return questionRow(it, i, selectItem);
    });
    currentRow = rows[0];

    var list = el("section", { class: "card wb-list", "aria-label": "錯題列表" }, [
      el("div", { class: "wb-list__head" }, [
        el("h2", { class: "wb-list__title", text: "錯題列表" }),
        el("span", { class: "wb-list__count", text: "共 " + data.totalCount + " 題" }),
        el("div", { class: "wb-list__cols" }, [
          el("span", { text: "難易度" }),
          el("span", { text: "錯誤次數" }),
          el("span", { text: "最後錯誤" })
        ])
      ]),
      el("div", { class: "wb-list__rows" }, rows),
      pagination(data, status)
    ]);

    function filterBySubjectLabel(label) {
      var id = null;
      if (label === "全部科目") { id = "all"; }
      else {
        Object.keys(AHS.Subjects).forEach(function (k) {
          if (AHS.Subjects[k].name === label) { id = k; }
        });
      }
      Array.prototype.forEach.call(list.querySelectorAll(".wb-row"), function (r) {
        var match = id === "all" || r.getAttribute("data-subject") === id;
        r.style.display = match ? "" : "none";
      });
    }
    function clearFilters() {
      Array.prototype.forEach.call(list.querySelectorAll(".wb-select__control"),
        function (s) { s.selectedIndex = 0; });
      Array.prototype.forEach.call(list.querySelectorAll(".wb-row"),
        function (r) { r.style.display = ""; });
      var searchInput = mainCol.querySelector(".wb-search__input");
      if (searchInput) { searchInput.value = ""; }
    }

    var mainCol = el("div", { class: "wb-main" }, [
      filterBar(data, filterBySubjectLabel, clearFilters),
      list,
      status
    ]);

    // initial detail
    detailPanel.appendChild(renderDetail(data.items[0], status));

    return el("div", { class: "wb-page" }, [
      headerBlock(data, status),
      el("div", { class: "wb-layout" }, [mainCol, detailPanel])
    ]);
  }

  return { create: create };
})();
