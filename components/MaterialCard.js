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

  /* M007: shared Memory State for Favorite — a plain object living for
     the lifetime of this page load (module-level closure variable).
     Persists across grid re-renders triggered by Filter/Sort (M008/M009)
     without any localStorage/API/fetch/XHR. Resets naturally on page
     reload, matching "Memory State only" per M007 spec. */
  var favoriteState = {};

  function isFavorited(id) { return !!favoriteState[id]; }
  function toggleFavorite(id) {
    favoriteState[id] = !favoriteState[id];
    return favoriteState[id];
  }

  function clampProgress(value) {
    var n = typeof value === "number" && !isNaN(value) ? value : 0;
    if (n < 0) { return 0; }
    if (n > 100) { return 100; }
    return n;
  }

  function progressLabel(p) {
    return p === 0 ? "未開始" : p + "%";
  }

  /* create(item, status, onOpenDetail) */
  function create(item, status, onOpenDetail) {
    var subj = AHS.Subjects[item.subject];
    var pct = clampProgress(item.progress);

    function announce(msg) {
      status.textContent = msg; status.removeAttribute("hidden");
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

    /* 收藏 Icon — driven by shared Memory State (favoriteState), so the
       toggle survives grid re-renders from Filter/Sort. */
    var favBtn = el("button", {
      type: "button", class: "mat-card__act mat-card__fav" + (isFavorited(item.id) ? " is-active" : ""),
      "aria-label": "收藏", "aria-pressed": isFavorited(item.id) ? "true" : "false",
      html: isFavorited(item.id) ? AHS.Icons.bookmarkFill() : AHS.Icons.bookmark()
    });
    favBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var nowFavorited = toggleFavorite(item.id);
      favBtn.setAttribute("aria-pressed", nowFavorited ? "true" : "false");
      favBtn.classList.toggle("is-active", nowFavorited);
      favBtn.innerHTML = nowFavorited ? AHS.Icons.bookmarkFill() : AHS.Icons.bookmark();
    });

    var viewBtn = el("button", {
      type: "button", class: "mat-card__act",
      "aria-label": "檢視", html: AHS.Icons.search()
    });
    var dlBtn = el("button", {
      type: "button", class: "mat-card__act",
      "aria-label": "下載", html: AHS.Icons.download()
    });
    viewBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      announce("（Mock）檢視教材：" + subj.name + "《" + item.title + "》");
    });
    dlBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      announce("（Mock）下載教材：" + subj.name + "《" + item.title + "》");
    });

    /* Continue Button — reuses .continue-reading__btn (same pill style,
       same Design Token as the Recent Learning section's button). */
    var continueBtn = el("button", {
      type: "button", class: "continue-reading__btn mat-card__continue",
      text: "繼續學習"
    });
    continueBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      onOpenDetail(item.id);
    });

    var progressBar = el("div", {
      class: "progressbar",
      role: "progressbar",
      "aria-valuenow": String(pct), "aria-valuemin": "0", "aria-valuemax": "100"
    }, [
      el("div", { class: "progressbar__fill", style: "width:" + pct + "%;background-color:" + subj.hex })
    ]);

    var card = el("article", {
      class: "mat-card",
      "data-subject": item.subject,
      "data-chapter": item.chapter,
      "data-id": item.id
    }, [
      cover,
      el("h3", { class: "mat-card__title", text: item.title }),
      el("p", { class: "mat-card__meta", text: (item.grade || "") + subj.name + "｜" + item.chapter }),
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
      el("div", { class: "mat-card__acts" }, [favBtn, viewBtn, dlBtn]),
      continueBtn
    ]);

    /* MAT-F001 acceptance: clicking a material logs its id.
       MAT-F004 acceptance: clicking a material opens its detail. */
    card.addEventListener("click", function () {
      console.log(item.id);
      onOpenDetail(item.id);
    });

    return card;
  }

  return { create: create, isFavorited: isFavorited };
})();
