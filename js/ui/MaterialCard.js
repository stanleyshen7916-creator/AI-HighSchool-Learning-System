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
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

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
    /* RC-003-006/007: preview (查看，不更新進度) is separate from learn
       (開始/繼續學習，更新進度). onPreview preferred; onOpen kept as a
       backward-compat alias for preview. onLearn starts a Learning
       Session. */
    var onPreview = opts.onPreview || opts.onOpen;
    var onLearn = opts.onLearn;
    var onDownload = opts.onDownload;
    var onDelete = opts.onDelete;
    var onToggleFavorite = opts.onToggleFavorite;

    var subj = AHS.Subjects[item.subject] || { name: "其他", hex: "#6b7280" };
    var pct = clampProgress(item.progress);
    /* Sprint AI-117 AI-117-01/AI-117-10: 取消「閱讀進度」作為完成度的顯示
       依據 — displayed completion now comes solely from
       AHS.StatisticsRuntime.materialCompletion() (① 教材閱讀 ② 完成測驗
       ③ 完成複習), this card never computes its own completion number
       again. `pct` (raw AHS.MaterialRuntime.progress) is kept only for
       the 開始學習/繼續學習 button label decision below (a real, distinct
       "has reading started at all" check, not a completion % shown to
       the user) — the Runtime field itself is unmodified, only what this
       card displays as "完成度" changed. Falls back to the old raw-
       progress display when StatisticsRuntime isn't loaded on a given
       page (defensive, matches this file's own "never throw at load
       time" convention). */
    var completion = (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.materialCompletion === "function")
      ? AHS.StatisticsRuntime.materialCompletion(item.id) : null;
    var completionPct = completion ? completion.percent : pct;
    var completionLabel = completion ? completion.label + "（" + completion.percent + "%）" : progressLabel(pct);

    function announce(msg) {
      status.textContent = msg; status.removeAttribute("hidden");
    }

    function previewMaterial() {
      if (typeof onPreview === "function") { onPreview(item.id); }
    }
    function learnMaterial() {
      if (typeof onLearn === "function") { onLearn(item.id); }
      else { previewMaterial(); }
    }
    function downloadMaterial() {
      if (typeof onDownload === "function") { onDownload(item.id); }
      else { announce("下載教材：" + subj.name + "《" + item.title + "》"); }
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
    function favTip(f) { return f ? "取消收藏" : "收藏教材"; }
    var favBtn = el("button", {
      type: "button", class: "mat-card__act mat-card__fav" + (isFav ? " is-active" : ""),
      "aria-label": favTip(isFav), "data-tip": favTip(isFav), "aria-pressed": isFav ? "true" : "false",
      html: isFav ? AHS.Icons.bookmarkFill() : AHS.Icons.bookmark()
    });
    function applyFav(nowFav) {
      favBtn.setAttribute("aria-pressed", nowFav ? "true" : "false");
      favBtn.setAttribute("aria-label", favTip(nowFav));
      favBtn.setAttribute("data-tip", favTip(nowFav));
      favBtn.classList.toggle("is-active", nowFav);
      favBtn.innerHTML = nowFav ? AHS.Icons.bookmarkFill() : AHS.Icons.bookmark();
    }
    favBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var nowFav = typeof onToggleFavorite === "function" ? onToggleFavorite(item.id) : !favBtn.classList.contains("is-active");
      applyFav(nowFav);
    });

    /* 下載 standalone icon button — hover shows only a tooltip (WO-006);
       the action fires on click, never on hover. HOTFIX-009-2: the
       separate "預覽教材" icon button was removed — it opened the exact
       same AHS.MaterialPreview.open() dialog as clicking the card body
       (line ~275 below) and as 開始學習/繼續學習 (learnMaterial(), which
       also opens it plus starts the Learning Session), so it was a pure
       duplicate action, not a distinct feature. previewMaterial() itself
       is kept — the card body click still uses it. */
    var dlBtn = el("button", {
      type: "button", class: "mat-card__act mat-card__dl",
      "aria-label": "下載教材", "data-tip": "下載教材", html: AHS.Icons.download()
    });
    dlBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      downloadMaterial();
    });

    /* Sprint v1.6 Module A — Material Card Navigation Action, relabeled
       Sprint AI-118 AI-118-04: 前往學習總結 / 前往考前練習 (was 查看摘要 /
       開始練習) — matches the Learning Loop's own terminology (AI-118-01:
       首頁→教材中心→學習總結→測驗中心→知識弱點→首頁) and AI-118-06's
       考前練習/正式測驗 naming, so a student never sees two different
       names for the same next step. Href/behavior unchanged — AI-118-04
       only requires the label to route into 學習總結, never expand
       Summary inline, which was already true (plain <a href>, never
       window.location.href=, per this repo's forbidden-pattern rule).
       Rendered on every card unconditionally — summary.html/quiz.html
       already show their own honest Empty State when there's nothing
       real yet, exactly like every other real-content-dependent link in
       this app. The "teaching_material_" + id examId convention matches
       js/runtime/TeachingMaterialLoader.js's own examIdFor(). */
    var summaryLink = el("a", {
      class: "mat-card__act mat-card__summary-link",
      href: "summary.html?materialId=" + encodeURIComponent(item.id),
      "aria-label": "前往學習總結", "data-tip": "前往學習總結",
      html: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" ' +
        'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M6 4h9l3 3v13H6z"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>'
    });
    summaryLink.addEventListener("click", function (e) { e.stopPropagation(); });

    var practiceLink = el("a", {
      class: "mat-card__act mat-card__practice-link",
      href: "quiz.html?mode=practice&examId=" + encodeURIComponent("teaching_material_" + item.id),
      "aria-label": "前往考前總複習", "data-tip": "前往考前總複習",
      html: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" ' +
        'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'
    });
    practiceLink.addEventListener("click", function (e) { e.stopPropagation(); });

    /* RC-003-007, updated HOTFIX-009-2/AI-118-04: card icons are 收藏 /
       下載教材 / 前往學習總結 / 前往考前練習 / 刪除教材. No 開啟教材 icon,
       and no separate 預覽教材 icon (duplicated the card-click/繼續學習
       preview action). */
    var acts = [favBtn, dlBtn, summaryLink, practiceLink];
    if (typeof onDelete === "function") {
      /* Trash icon defined locally (the shared Icons.js is out of this
         WO's modify scope); matches the spec's 垃圾桶 glyph. */
      var trashSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" ' +
        'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
        'stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/>' +
        '<path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/></svg>';
      var deleteBtn = el("button", {
        type: "button", class: "mat-card__act mat-card__delete-btn",
        "aria-label": "刪除教材", "data-tip": "刪除教材"
      }, [
        el("span", { class: "mat-card__delete-icon", html: trashSvg }),
        el("span", { class: "mat-card__delete-text", text: "刪除" })
      ]);
      deleteBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        onDelete(item.id);
      });
      acts.push(deleteBtn);
    }

    /* Bottom button — 開始學習 (progress 0) / 繼續學習 (progress > 0).
       Clicking starts a Learning Session (updates progress / recent
       learning / learning time), NOT a preview (RC-003-006). */
    var continueBtn = el("button", {
      type: "button", class: "continue-reading__btn mat-card__continue",
      text: pct > 0 ? "繼續學習" : "開始學習"
    });
    continueBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      learnMaterial();
    });

    var progressBar = el("div", {
      class: "progressbar",
      role: "progressbar",
      "aria-valuenow": String(completionPct), "aria-valuemin": "0", "aria-valuemax": "100"
    }, [
      el("div", { class: "progressbar__fill", style: "width:" + completionPct + "%;background-color:" + subj.hex })
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
          el("span", { text: "教材完成度" }),
          el("span", { class: "mat-card__pct", text: completionLabel })
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

    /* RC-003-006: clicking a card opens PREVIEW (view only, no progress
       update). Learning is started explicitly via the bottom button.
       Sprint AI-107 RC-01: removed a leftover console.log(item.id) debug
       statement (originally added to satisfy MAT-F001's early acceptance
       check, long since superseded by the real click behavior below). */
    card.addEventListener("click", function () {
      previewMaterial();
    });

    return card;
  }

  return { create: create };
})();
