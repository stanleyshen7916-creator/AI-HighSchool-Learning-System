/* components/MaterialReviewQueue.js — Sprint AI-132（使用者需求 A）：
   「上傳資料...在我尚未同意前，保留在admin權限內，帶我同意後再分配
   使用」— Admin-only 審核佇列。

   Scope (與使用者確認過的方案一致): 只涵蓋 js/components/MaterialCenter.js
   學生上傳面板送出的教材（AHS.MaterialRuntime 的 approved:false 記錄，
   見 js/runtime/MaterialRuntime.js 自身標頭）。docs/TeachingMaterials
   Repository 匯入管線完全不受影響，一律照常可見。

   真實內容預覽（回應使用者「單純從上傳通知無法得知內容是否恰當」）：
   直接重用既有的 AHS.MaterialPreview.open()——那個元件本來就會渲染
   教材內容／AI 重點整理／AI 練習題（若已產生）等區塊，管理者點「預覽
   內容」看到的就是學生日後會看到的同一份真實畫面，不是另一套簡化版
   摘要，也不需要重新實作一次。

   核准（approve）沿用 MaterialRuntime.approve()；退回／刪除沿用既有、
   已測試過的 MaterialRuntime.remove()——審核佇列本身不新增第二套刪除
   邏輯。完全不掛在任何非管理者可達的路徑上：MaterialCenter.js 只在
   isAdmin() 為 true 時才呼叫 create()。
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialReviewQueue = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  function subjectChip(subjectKey) {
    var subj = AHS.Subjects[subjectKey] || { name: subjectKey || "其他", hex: "#6b7280" };
    return el("span", {
      class: "chip", style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
    }, [el("span", { text: subj.name })]);
  }

  /* doDownload(item) — real bytes only (live File this session uploaded,
     else this material's own stored bytes via AHS.MaterialFileStore),
     never a fabricated download. Deliberately a smaller, self-contained
     version of MaterialCenter.js's own doDownload() (which additionally
     falls back to generating a .docx from AI-derived content) — that
     fallback exists for the STUDENT-facing download CTA; an Admin
     reviewing a just-uploaded file always has real original bytes to
     work with, so the extra fallback path isn't needed here. */
  function doDownload(item) {
    var blob = item.file || null;
    if (!blob && AHS.MaterialFileStore && typeof AHS.MaterialFileStore.blobFor === "function") {
      blob = AHS.MaterialFileStore.blobFor(item.id);
    }
    if (blob && window.URL && typeof window.URL.createObjectURL === "function") {
      var url = window.URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = item.fileName || item.title || "教材";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return;
    }
    var dataUrl = AHS.MaterialFileStore && typeof AHS.MaterialFileStore.dataUrlFor === "function"
      ? AHS.MaterialFileStore.dataUrlFor(item.id) : null;
    if (dataUrl) {
      var a2 = document.createElement("a");
      a2.href = dataUrl;
      a2.download = item.fileName || item.title || "教材";
      document.body.appendChild(a2);
      a2.click();
      document.body.removeChild(a2);
    }
  }

  function queueRow(item, actions) {
    var previewBtn = el("button", { type: "button", class: "mat-review__btn", text: "預覽內容" });
    previewBtn.addEventListener("click", function () {
      AHS.MaterialRuntime.markPreviewed(item.id);
      var overlay = AHS.MaterialPreview.open(item, doDownload);
      document.body.appendChild(overlay);
    });

    var approveBtn = el("button", { type: "button", class: "mat-review__btn mat-review__btn--primary", text: "核准" });
    approveBtn.addEventListener("click", function () { actions.onApprove(item.id); });

    var rejectBtn = el("button", { type: "button", class: "mat-review__btn mat-review__btn--danger", text: "退回／刪除" });
    rejectBtn.addEventListener("click", function () {
      if (!window.confirm("確定要刪除這份未審核教材嗎？此操作無法復原。\n《" + item.title + "》")) { return; }
      actions.onReject(item.id);
    });

    return el("div", { class: "mat-review__row" }, [
      el("div", { class: "mat-review__info" }, [
        el("div", { class: "mat-review__info-top" }, [
          subjectChip(item.subject),
          el("strong", { class: "mat-review__title", text: item.title })
        ]),
        el("span", { class: "mat-review__meta", text: [item.grade, item.chapter || item.category, item.date].filter(Boolean).join("・") })
      ]),
      el("div", { class: "mat-review__actions" }, [previewBtn, approveBtn, rejectBtn])
    ]);
  }

  function emptyState() {
    return el("p", { class: "mat-review__empty", text: "目前沒有待審核的教材。" });
  }

  /* create() — returns the toggle button (real pending count in its own
     label, e.g. "審核佇列（3）") that opens the queue overlay on click.
     Caller (MaterialCenter.js) mounts this ONLY when isAdmin() is true —
     this component itself has no role-check of its own, matching the
     established "gate at the mount site" pattern this repo already uses
     elsewhere (e.g. Assessment Mode toggle only renders when both real
     variants exist). */
  function create() {
    var countLabel = el("span", { text: "審核佇列（" + AHS.MaterialRuntime.listPending().length + "）" });
    var toggleBtn = el("button", { type: "button", class: "mat-review__toggle" }, [
      el("span", { class: "mat-review__toggle-icon", html: AHS.Icons.bell() }),
      countLabel
    ]);

    var overlay = null;
    function onKeydown(e) { if (e.key === "Escape") { close(); } }
    function close() {
      if (overlay && overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
      overlay = null;
      document.removeEventListener("keydown", onKeydown);
    }

    function refresh(body) {
      var pending = AHS.MaterialRuntime.listPending();
      countLabel.textContent = "審核佇列（" + pending.length + "）";
      body.innerHTML = "";
      if (!pending.length) {
        body.appendChild(emptyState());
        return;
      }
      pending.forEach(function (item) {
        body.appendChild(queueRow(item, {
          onApprove: function (id) {
            AHS.MaterialRuntime.approve(id);
            refresh(body);
          },
          onReject: function (id) {
            AHS.MaterialRuntime.remove(id);
            refresh(body);
          }
        }));
      });
    }

    function open() {
      var closeX = el("button", { type: "button", class: "mat-review__close", "aria-label": "關閉", html: AHS.Icons.filterX() });
      closeX.addEventListener("click", close);
      var body = el("div", { class: "mat-review__body" });
      var panel = el("div", { class: "mat-review__panel card" }, [
        el("div", { class: "mat-review__head" }, [
          el("h2", { class: "mat-review__panel-title", text: "審核佇列" }),
          closeX
        ]),
        el("p", { class: "mat-review__hint", text: "學生上傳教材區的新內容，需要核准後才會出現在學生端。" }),
        body
      ]);
      overlay = el("div", { class: "mat-review-overlay", role: "dialog", "aria-modal": "true", "aria-label": "審核佇列" });
      overlay.appendChild(panel);
      overlay.addEventListener("click", function (e) { if (e.target === overlay) { close(); } });
      document.addEventListener("keydown", onKeydown);
      document.body.appendChild(overlay);
      refresh(body);
    }

    toggleBtn.addEventListener("click", open);
    return toggleBtn;
  }

  return { create: create };
})();
