/* components/MaterialPreview.js — Material preview overlay.
   Clicking a material opens this preview first (never an auto-download).
   Previewable types (PDF / image / video / audio / TXT) render inline
   via an object URL from the retained File. Non-previewable types
   (DOC/DOCX/PPT/PPTX/XLS/XLSX/ZIP/unknown) show an info page (name /
   subject / grade / category / format / size) plus a notice and
   Download / Back actions — download only happens on explicit click.
   Object URLs are built in-memory; no fetch/XHR/backend.

   Sprint 6.7 Hotfix-001 (Issue 001, Batch JPG Preview): kind resolution
   now checks BOTH the file extension (existing, still primary) AND the
   real File object's MIME type (`file.type`) as a fallback — per this
   Hotfix's explicit checklist (File.type / MIME Type / Extension /
   Preview Type). This is purely additive: every format that already
   resolved correctly via extension (PDF/PNG/DOCX/MP4, etc.) is
   completely unaffected, since extension match is checked first and
   short-circuits. The MIME-type check only helps in the specific case
   where extension-based detection alone would miss a real image and
   fall through to the Generic File Preview info page. No Runtime
   change, no Storage, no Parser Interface change — this file has no
   dependency on either.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialPreview = (function () {
  "use strict";
  var el = AHS.UI.el;

  var PREVIEWABLE = {
    pdf: "pdf",
    png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", svg: "image",
    mp4: "video", webm: "video", ogg: "video", mov: "video",
    mp3: "audio", wav: "audio", m4a: "audio",
    txt: "text"
  };

  /* MIME-type fallback map — only consulted when extension-based
     lookup finds nothing. Keeps every existing extension-based result
     untouched. */
  var MIME_PREVIEWABLE = {
    "application/pdf": "pdf",
    "image/png": "image", "image/jpeg": "image", "image/jpg": "image",
    "image/gif": "image", "image/webp": "image", "image/svg+xml": "image",
    "video/mp4": "video", "video/webm": "video", "video/ogg": "video", "video/quicktime": "video",
    "audio/mpeg": "audio", "audio/wav": "audio", "audio/mp4": "audio", "audio/x-m4a": "audio",
    "text/plain": "text"
  };

  function kindOf(ext, mimeType) {
    var byExt = PREVIEWABLE[String(ext || "").toLowerCase()];
    if (byExt) { return byExt; }
    var byMime = MIME_PREVIEWABLE[String(mimeType || "").toLowerCase()];
    return byMime || null;
  }

  function infoRow(label, value) {
    return el("div", { class: "mat-preview__inforow" }, [
      el("span", { class: "mat-preview__infolabel", text: label }),
      el("span", { class: "mat-preview__infovalue", text: value || "—" })
    ]);
  }

  /* open(item, onDownload) — item: runtime record. onDownload(item) is
     invoked only when the user explicitly clicks 下載教材. Returns the
     overlay node. */
  function open(item, onDownload) {
    var subjName = (AHS.Subjects[item.subject] || { name: "其他" }).name;
    var ext = String(item.fileType || "").toLowerCase();
    var kind = kindOf(ext, item.file && item.file.type);

    var overlay = el("div", {
      class: "mat-preview__overlay", role: "dialog", "aria-modal": "true",
      "aria-label": "教材預覽"
    });
    function close() {
      /* Revoke any created object URL to avoid leaks. */
      if (overlay._objectUrl && window.URL && window.URL.revokeObjectURL) {
        window.URL.revokeObjectURL(overlay._objectUrl);
      }
      if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
    }

    var backBtn = el("button", { type: "button", class: "mat-preview__btn mat-preview__btn--ghost", text: "返回教材中心" });
    backBtn.addEventListener("click", close);

    var closeX = el("button", {
      type: "button", class: "mat-preview__close", "aria-label": "關閉", html: AHS.Icons.filterX()
    });
    closeX.addEventListener("click", close);

    var bodyChildren = [];
    var hasFile = !!item.file && typeof window.URL !== "undefined" && !!window.URL.createObjectURL;
    var url = hasFile ? window.URL.createObjectURL(item.file) : null;
    overlay._objectUrl = url;

    if (kind && hasFile) {
      /* Inline preview. */
      var viewer;
      if (kind === "image") {
        viewer = el("img", { class: "mat-preview__media", src: url, alt: item.title });
      } else if (kind === "video") {
        viewer = el("video", { class: "mat-preview__media", src: url, controls: "controls" });
      } else if (kind === "audio") {
        viewer = el("audio", { class: "mat-preview__media", src: url, controls: "controls" });
      } else {
        /* pdf / text — iframe renders both in-browser. */
        viewer = el("iframe", { class: "mat-preview__frame", src: url, title: item.title });
      }
      bodyChildren.push(el("div", { class: "mat-preview__stage" }, [viewer]));
    } else {
      /* Non-previewable: info page. No auto-download. */
      bodyChildren.push(el("div", { class: "mat-preview__info" }, [
        infoRow("教材名稱", item.title),
        infoRow("科目", subjName),
        infoRow("年級", item.grade),
        infoRow("教材分類", item.category),
        infoRow("檔案格式", item.fileType),
        infoRow("檔案大小", item.fileSize),
        el("p", { class: "mat-preview__notice",
          text: "此檔案格式目前無法於瀏覽器直接預覽。您可以下載原始檔後，使用對應軟體開啟。" })
      ]));
    }

    var footChildren = [backBtn];
    var dlBtn = el("button", { type: "button", class: "mat-preview__btn mat-preview__btn--primary", text: "下載教材" });
    dlBtn.addEventListener("click", function () {
      if (typeof onDownload === "function") { onDownload(item); }
    });
    footChildren.push(dlBtn);

    overlay.addEventListener("click", function (e) { if (e.target === overlay) { close(); } });

    var panel = el("div", { class: "mat-preview" }, [
      el("div", { class: "mat-preview__head" }, [
        el("h2", { class: "mat-preview__title", text: item.title }),
        closeX
      ]),
      el("div", { class: "mat-preview__body" }, bodyChildren),
      el("div", { class: "mat-preview__foot" }, footChildren)
    ]);
    overlay.appendChild(panel);
    return overlay;
  }

  return { open: open, kindOf: kindOf };
})();
