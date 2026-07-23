/* tests/regression/MaterialDownloadFlow.js — HF-8.2.001 · HF-002.
   End-to-end Download Flow regression: a REAL file upload through the
   Material Center dialog, the bytes being kept by the Download Flow's
   companion store, and the download still working on a LATER page view
   (the exact scenario that was broken — MaterialRuntime cannot persist a
   File object, so every post-navigation download failed).

   HF-8.2.003 update: the byte store now uses ONE UNIQUE KEY PER
   MATERIAL (AHS.MaterialFileStore, "materialFile:<id>") instead of
   HF-8.2.001's single shared key, because the shared key was the root
   cause of the batch-upload failure. These assertions therefore read
   through the store's API rather than one raw key.

   This lives in its own file because FileReader is asynchronous and the
   jsdom BehaviorSuite is synchronous end-to-end.
   Run: node tests/regression/MaterialDownloadFlow.js */
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs"), path = require("path");
const REPO = path.join(__dirname, "..", "..");

let pass = 0, fail = 0;
function check(name, cond) { cond ? pass++ : fail++; console.log((cond ? "  PASS  " : "  FAIL  ") + name); }

function loadMaterials(seed) {
  const html = fs.readFileSync(path.join(REPO, "materials.html"), "utf8");
  const consoleErrors = [];
  const vc = new VirtualConsole();
  vc.on("error", (m) => consoleErrors.push(String(m)));
  vc.on("jsdomError", (e) => {
    const s = String(e && e.message || e);
    if (/Could not load link|Could not parse CSS|not implemented/i.test(s)) return;
    consoleErrors.push(s);
  });
  const dom = new JSDOM(html, {
    url: "https://ahs.test/materials.html",
    runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vc
  });
  const { window } = dom;
  Object.entries(seed || {}).forEach(([k, v]) => window.sessionStorage.setItem(k, v));
  /* jsdom does not implement createObjectURL — minimal stub that records
     the Blob it actually receives, so the test verifies real bytes. */
  let lastBlobSize = null;
  window.URL.createObjectURL = function (blob) { lastBlobSize = blob && blob.size; return "blob:ahs/test"; };
  window.URL.revokeObjectURL = function () {};
  for (const src of [...window.document.querySelectorAll("script[src]")].map(s => s.getAttribute("src"))) {
    window.eval(fs.readFileSync(path.join(REPO, src), "utf8"));
  }
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors, blobSize: () => lastBlobSize };
}

/* carryAll(ctx) — copy the whole sessionStorage into the next page view,
   mirroring a real navigation (per-material byte keys included). */
function carryAll(ctx) {
  const out = {};
  for (let i = 0; i < ctx.window.sessionStorage.length; i += 1) {
    const k = ctx.window.sessionStorage.key(i);
    out[k] = ctx.window.sessionStorage.getItem(k);
  }
  return out;
}

/* Capture what the anchor was actually asked to download. */
function instrumentAnchor(doc) {
  const captured = { href: null, fileName: null };
  const orig = doc.createElement.bind(doc);
  doc.createElement = function (tag) {
    const node = orig(tag);
    if (String(tag).toLowerCase() === "a") {
      node.click = function () {
        captured.href = node.getAttribute("href");
        captured.fileName = node.getAttribute("download");
      };
    }
    return node;
  };
  return captured;
}

const FILE_TEXT = "%PDF-1.4 AHS 真實上傳位元組內容";
const FILE_BYTES = Buffer.from(FILE_TEXT).length;

console.log("[1] 真實上傳：教材建立 + Download Flow 保存真實位元組");
const first = loadMaterials({});
const doc1 = first.window.document;
const input = doc1.querySelector('input[type="file"]');
check("教材中心提供檔案輸入", !!input);

const file = new first.window.File([FILE_TEXT], "上課講義.pdf", { type: "application/pdf" });
Object.defineProperty(input, "files", { value: [file], configurable: true });
input.dispatchEvent(new first.window.Event("change", { bubbles: true }));
const dialog = doc1.querySelector(".mat-dialog__overlay");
check("上傳對話框開啟", !!dialog);
[...doc1.querySelectorAll(".mat-dialog__overlay select")].forEach((sel) => {
  if (sel.options.length) { sel.value = sel.options[sel.options.length - 1].value; }
});
const confirmBtn = [...doc1.querySelectorAll(".mat-dialog__overlay button")]
  .find((b) => /建立教材/.test(b.textContent || ""));
check("找到「建立教材」按鈕", !!confirmBtn);
confirmBtn.click();
check("教材已建立於 MaterialRuntime", first.window.AHS.MaterialRuntime.list().length === 1);

/* FileReader is async — wait for the byte store to be written. */
setTimeout(function () {
  const fileStore = first.window.AHS.MaterialFileStore;
  const entries = fileStore.list();
  check("位元組已寫入 Download Flow 存放（經 PersistenceAdapter）", entries.length === 1);
  const materialId = entries.length ? entries[0].materialId : null;
  check("使用該教材專屬的唯一 Storage Key",
    entries.length === 1 && entries[0].storageKey === "materialFile:" + materialId);
  const payload = materialId ? fileStore.get(materialId) : null;
  check("保存原始檔名與 MIME", !!payload && payload.name === "上課講義.pdf" && payload.type === "application/pdf");
  check("保存為 data URL（真實內容，非佔位）",
    !!payload && /^data:application\/pdf;base64,/.test(payload.dataUrl) && payload.dataUrl.length > 40);
  check("首次上傳後 Console errors = 0", first.consoleErrors.length === 0);

  console.log("\n[2] 跨頁後下載（HF-002 修正核心：先前必失敗）");
  /* A fresh page view carrying the same sessionStorage — exactly what a
     user does when navigating away and back. The File object is gone. */
  const second = loadMaterials(carryAll(first));
  const doc2 = second.window.document;
  check("新頁面首次載入即顯示教材（HF-001 亦成立）", doc2.querySelectorAll(".mat-card").length === 1);
  check("Runtime 記錄之 file 已為 null（File 無法持久化，前提成立）",
    second.window.AHS.MaterialRuntime.list()[0].file === null);

  const captured = instrumentAnchor(doc2);
  doc2.querySelector(".mat-card__dl").click();
  check("下載事件觸發並取得 Blob URL", captured.href === "blob:ahs/test");
  check("Blob 由真實位元組重建（長度與原檔一致）", second.blobSize() === FILE_BYTES);
  check("檔名為原始 fileName", captured.fileName === "上課講義.pdf");
  const status2 = doc2.querySelector(".mat-status, [role='status']");
  check("回報下載成功（非失敗訊息）", !!status2 && /已下載教材：上課講義\.pdf/.test(status2.textContent));
  check("跨頁下載 Console errors = 0", second.consoleErrors.length === 0);

  console.log("\n[3] 刪除教材同步釋放位元組（避免暫存空間累積）");
  const third = loadMaterials(carryAll(first));
  const doc3 = third.window.document;
  doc3.querySelector(".mat-card__delete-btn").click();
  const delConfirm = [...doc3.querySelectorAll(".mat-dialog__overlay button")]
    .find((b) => /^刪除$/.test((b.textContent || "").trim()));
  check("刪除確認對話框出現", !!delConfirm);
  if (delConfirm) { delConfirm.click(); }
  check("教材刪除後其位元組亦被釋放", third.window.AHS.MaterialFileStore.list().length === 0);
  check("刪除流程 Console errors = 0", third.consoleErrors.length === 0);

  console.log("\nMaterialDownloadFlow: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail === 0 ? 0 : 1);
}, 400);
