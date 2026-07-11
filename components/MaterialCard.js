/* components/MaterialCard.js — Material Center Sprint 2 · M006 (+ M007 Favorite).
   Material Card: 科目 Icon / 教材封面 / 教材名稱 / 年級 / 章節 / 教材簡介 /
   學習進度 (Progress Bar) / 收藏 Icon (Memory State, M007) / Continue Button.
   No search/filter/sort logic lives here — Favorite state is the only
   piece of state this component owns, and it is intentionally shared at
   module scope (not localStorage/API/fetch/XHR) so it survives grid
   re-renders triggered by Filter (M008) / Sort (M009).
   Reuses existing shared primitives — no new Design Token:
     .mat-card__thumb   → serves as the "教材封面" cover area
     .progressbar / .progressbar__fill → shared bar (already used by
       components/HomeRecentMaterials.js on the Home page)
     .continue-reading__btn → shared pill-button style (already used by
       the Recent Learning section) — reused verbatim for Continue Button
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialCard = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* Module Completion: Favorite state is now owned by MaterialRuntime
     (item.favorite is the single source of truth). The card reads
     item.favorite for initial render and delegates toggling to the
     onToggleFavorite callback, which updates the runtime and returns the
     new state. No separate in-card favorite store (removed to avoid a
     second, conflicting source of truth). */
  function clampProgress(value) {
    var n = typeof value === "number" && !isNaN(value) ? value : 0;
    if (n < 0) { return 0; }
    if (n > 100) { return 100; }
    return n;
  }

  function progressLabel(p) {
    return p === 0 ? "未開始" : p + "%";
  }

  /* create(item, status, opts)
     opts = { onOpen, onDownload, onDelete, onToggleFavorite }
     - onOpen(id): open preview (Feature 5). Also the card-body click.
     - onDownload(id): explicit download.
     - onDelete(id): remove from runtime (with confirm handled upstream).
     - onToggleFavorite(id): toggle favorite in runtime, returns new bool.
     A legacy positional signature (…, onOpenDetail, onDelete,
     onToggleFavorite) is still accepted for backward compatibility. */
  function create(item, status, opts, legacyDelete, legacyFav) {
    /* Backward-compat: if opts is a function, treat as onOpenDetail. */
    if (typeof opts === "function") {
      opts = { onOpen: opts, onDelete: legacyDelete, onToggleFavorite: legacyFav };
    }
    opts = opts || {};
    var onOpen = opts.onOpen;
    var onDownload = opts.onDownload;
    var onDelete = opts.onDelete;
    var onToggleFavorite = opts.onToggleFavorite;

    var subj = AHS.Subjects[item.subject] || { name: "其他", hex: "#6b7280" };
    var pct = clampProgress(item.progress);

    function announce(msg) {
      status.textContent = msg; status.removeAttribute("hidden");
    }

    function openMaterial() {
      if (typeof onOpen === "function") { onOpen(item.id); }
    }
    function downloadMaterial() {
      if (typeof onDownload === "function") { onDownload(item.id); }
      else { announce("（Mock）下載教材：" + subj.name + "《" + item.title + "》"); }
    }

    /* 科目 Icon + 教材封面 (existing thumb block, reused as the cover area) */
    var cover = el("div", {
      class: "mat-card__thumb",
      style: "background-color:" + subj.hex + "1f"
    }, [
      el("span", {
        class: "chip", style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
      }, [el("span", { text: subj.name })]),
      el("span", { class: "mat-card__thumb-icon",
        style: "color:" + subj.hex, html: AHS.Icons.book() })
    ]);

    /* 收藏 Icon — reflects item.favorite (Runtime). Quick toggle stays
       on the card for one-tap favoriting; also available in the ⋯ menu. */
    var isFav = !!item.favorite;
    function favLabel(f) { return f ? "取消收藏" : "收藏教材"; }
    var favBtn = el("button", {
      type: "button", class: "mat-card__act mat-card__fav" + (isFav ? " is-active" : ""),
      "aria-label": favLabel(isFav), title: favLabel(isFav), "aria-pressed": isFav ? "true" : "false",
      html: isFav ? AHS.Icons.bookmarkFill() : AHS.Icons.bookmark()
    });
    function applyFav(nowFav) {
      favBtn.setAttribute("aria-pressed", nowFav ? "true" : "false");
      favBtn.setAttribute("aria-label", favLabel(nowFav));
      favBtn.setAttribute("title", favLabel(nowFav));
      favBtn.classList.toggle("is-active", nowFav);
      favBtn.innerHTML = nowFav ? AHS.Icons.bookmarkFill() : AHS.Icons.bookmark();
    }
    favBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var nowFav = typeof onToggleFavorite === "function" ? onToggleFavorite(item.id) : !favBtn.classList.contains("is-active");
      applyFav(nowFav);
    });

    /* 更多 (⋯) menu — 開啟 / 下載 / 收藏 / 刪除. */
    var moreBtn = el("button", {
      type: "button", class: "mat-card__act mat-card__more",
      "aria-label": "更多功能", title: "更多功能", "aria-haspopup": "true",
      html: AHS.Icons.more()
    });
    var menu = el("div", { class: "mat-card__menu", role: "menu", hidden: "hidden" });

    function menuItem(label, handler) {
      var b = el("button", { type: "button", class: "mat-card__menu-item", role: "menuitem", text: label });
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        menu.setAttribute("hidden", "hidden");
        handler();
      });
      return b;
    }
    menu.appendChild(menuItem("開啟教材", openMaterial));
    menu.appendChild(menuItem("下載教材", downloadMaterial));
    var favMenuItem = menuItem("收藏教材", function () {
      var nowFav = typeof onToggleFavorite === "function" ? onToggleFavorite(item.id) : !favBtn.classList.contains("is-active");
      applyFav(nowFav);
    });
    menu.appendChild(favMenuItem);
    if (typeof onDelete === "function") {
      menu.appendChild(menuItem("刪除教材", function () { onDelete(item.id); }));
    }

    moreBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var willOpen = menu.hasAttribute("hidden");
      /* close any other open menus first */
      var others = document.querySelectorAll(".mat-card__menu");
      Array.prototype.forEach.call(others, function (m) { m.setAttribute("hidden", "hidden"); });
      if (willOpen) { menu.removeAttribute("hidden"); }
    });
    document.addEventListener("click", function () { menu.setAttribute("hidden", "hidden"); });
    menu.addEventListener("click", function (e) { e.stopPropagation(); });

    var moreWrap = el("div", { class: "mat-card__more-wrap" }, [moreBtn, menu]);

    /* Action row: quick favorite + ⋯ menu. */
    var acts = [favBtn, moreWrap];

    /* Continue Button — reuses .continue-reading__btn (same pill style,
       same Design Token as the Recent Learning section's button). */
    var continueBtn = el("button", {
      type: "button", class: "continue-reading__btn mat-card__continue",
      text: "繼續學習"
    });
    continueBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      openMaterial();
    });

    var progressBar = el("div", {
      class: "progressbar",
      role: "progressbar",
      "aria-valuenow": String(pct), "aria-valuemin": "0", "aria-valuemax": "100"
    }, [
      el("div", { class: "progressbar__fill", style: "width:" + pct + "%;background-color:" + subj.hex })
    ]);

    /* File info line — only for uploaded runtime materials (have a
       fileName). Shows 檔案名稱 / 檔案類型 / 檔案大小 / 建立時間, per the
       Material Card spec. Seed-shaped items (no fileName) skip this. */
    var fileInfo = null;
    if (item.fileName) {
      var bits = [item.fileType];
      if (item.fileSize) { bits.push(item.fileSize); }
      bits.push(item.date);
      fileInfo = el("p", { class: "mat-card__fileinfo" }, [
        el("span", { class: "mat-card__filename", text: item.fileName }),
        el("span", { class: "mat-card__filemeta", text: bits.join(" · ") })
      ]);
    }

    var card = el("article", {
      class: "mat-card",
      "data-subject": item.subject,
      "data-chapter": item.chapter,
      "data-id": item.id
    }, [
      cover,
      el("h3", { class: "mat-card__title", text: item.title }),
      el("p", { class: "mat-card__meta", text: (item.grade || "") + subj.name + "｜" + item.chapter }),
      fileInfo,
      el("p", { class: "mat-card__intro", text: item.content || "" }),
      el("div", { class: "mat-card__progress-block" }, [
        el("div", { class: "mat-card__progress-head" }, [
          el("span", { text: "學習進度" }),
          el("span", { class: "mat-card__pct", text: progressLabel(pct) })
        ]),
        progressBar
      ]),
      el("div", { class: "mat-card__foot" }, [
        el("span", { class: "mat-card__date", text: item.date }),
        el("span", { class: "mat-card__views" }, [
          el("span", { html: AHS.Icons.search() }),
          el("span", { text: item.views })
        ])
      ]),
      el("div", { class: "mat-card__acts" }, acts),
      continueBtn
    ]);

    /* MAT-F001 acceptance: clicking a material logs its id.
       MAT-F004 acceptance: clicking a material opens its detail. */
    card.addEventListener("click", function () {
      console.log(item.id);
      openMaterial();
    });

    return card;
  }

  return { create: create };
})();
