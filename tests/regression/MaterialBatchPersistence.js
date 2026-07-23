/* tests/regression/MaterialBatchPersistence.js — HF-8.2.003.
   Batch Image Upload Persistence regression, covering the six EO
   requirements: single PASS, batch PASS, per-file persistence bytes,
   one unique storage key per file (never overwriting), download working
   for every file, and honest behaviour when the browser quota is full.

   These pages are driven with jsdom's OWN DOMContentLoaded (no manual
   dispatch): dispatching it manually fires the page bootstrap twice,
   which detaches the first instance's nodes and produces misleading
   results. A real browser fires it exactly once.
   Run: node tests/regression/MaterialBatchPersistence.js */
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs"), path = require("path");
const REPO = path.join(__dirname, "..", "..");

let pass = 0, fail = 0;
function check(name, cond) { cond ? pass++ : fail++; console.log((cond ? "  PASS  " : "  FAIL  ") + name); }

/* openMaterials({ seed, quotaBytes }) -> ctx (resolves once initialised) */
function openMaterials(opts) {
  opts = opts || {};
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
  Object.entries(opts.seed || {}).forEach(([k, v]) => window.sessionStorage.setItem(k, v));

  if (opts.quotaBytes) {
    /* jsdom's sessionStorage is unbounded — emulate a real browser quota
       so the honest oversize path is genuinely exercised. */
    const realSet = window.sessionStorage.setItem.bind(window.sessionStorage);
    window.sessionStorage.setItem = function (k, v) {
      let used = 0;
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const key = window.sessionStorage.key(i);
        if (key !== k) { used += key.length + String(window.sessionStorage.getItem(key)).length; }
      }
      if (used + k.length + String(v).length > opts.quotaBytes) {
        const err = new Error("QuotaExceededError"); err.name = "QuotaExceededError"; throw err;
      }
      return realSet(k, v);
    };
  }

  let lastBlob = null;
  window.URL.createObjectURL = function (blob) { lastBlob = blob; return "blob:ahs/" + (blob && blob.size); };
  window.URL.revokeObjectURL = function () {};

  for (const src of [...window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"))) {
    window.eval(fs.readFileSync(path.join(REPO, src), "utf8"));
  }
  const ctx = { window, doc: window.document, consoleErrors, lastBlob: () => lastBlob };
  return new Promise((resolve) => setTimeout(() => resolve(ctx), 60));
}

function upload(ctx, files) {
  const input = ctx.doc.querySelector('input[type="file"]');
  Object.defineProperty(input, "files", { value: files, configurable: true });
  input.dispatchEvent(new ctx.window.Event("change", { bubbles: true }));
  [...ctx.doc.querySelectorAll(".mat-dialog__overlay select")].forEach((sel) => {
    if (sel.options.length) { sel.value = sel.options[sel.options.length - 1].value; }
  });
  const go = [...ctx.doc.querySelectorAll(".mat-dialog__overlay button")]
    .find((b) => /開始匯入|建立教材/.test(b.textContent || ""));
  if (go) { go.click(); }
  return new Promise((resolve) => setTimeout(resolve, 600));
}

function carrySession(ctx) {
  const out = {};
  for (let i = 0; i < ctx.window.sessionStorage.length; i += 1) {
    const k = ctx.window.sessionStorage.key(i);
    out[k] = ctx.window.sessionStorage.getItem(k);
  }
  return out;
}

function clickDownload(ctx, card) {
  let fileName = null;
  const orig = ctx.doc.createElement.bind(ctx.doc);
  ctx.doc.createElement = function (tag) {
    const node = orig(tag);
    if (String(tag).toLowerCase() === "a") {
      node.click = function () { fileName = node.getAttribute("download"); };
    }
    return node;
  };
  card.querySelector(".mat-card__dl").click();
  ctx.doc.createElement = orig;
  return fileName;
}

(async function run() {
  /* ---- 要求 2 / 3 / 4：批次三張圖，各自唯一 key，內容不互相覆蓋 ---- */
  console.log("[1] 批次上傳三張圖片：每張皆有位元組且各有唯一 Storage Key");
  const a = await openMaterials({});
  const imgs = [
    new a.window.File(["IMG-ONE-aaaa"], "圖一.png", { type: "image/png" }),
    new a.window.File(["IMG-TWO-bbbbbb"], "圖二.jpg", { type: "image/jpeg" }),
    new a.window.File(["IMG-THREE-cccccccc"], "圖三.png", { type: "image/png" })
  ];
  const expectedSizes = imgs.map((f) => f.size);
  await upload(a, imgs);

  const store = a.window.AHS.MaterialFileStore;
  check("三個教材建立完成", a.window.AHS.MaterialRuntime.list().length === 3);
  const stats = store.stats();
  check("三張全部保存（stored=3, oversize=0, failed=0）",
    stats.total === 3 && stats.stored === 3 && stats.oversize === 0 && stats.failed === 0);
  const entries = store.list();
  const keys = entries.map((e) => e.storageKey);
  check("每張擁有唯一 Storage Key（互不覆蓋）",
    keys.length === 3 && new Set(keys).size === 3 && keys.every((k) => /^materialFile:rt_\d+$/.test(k)));
  check("每張皆有 Persistence Bytes", entries.every((e) => !!store.get(e.materialId)));
  const sizes = entries.map((e) => store.blobFor(e.materialId).size).sort((x, y) => x - y);
  check("每張位元組內容各自獨立且與原檔一致",
    JSON.stringify(sizes) === JSON.stringify(expectedSizes.slice().sort((x, y) => x - y)));
  check("原始檔名與 MIME 逐張保存",
    entries.every((e) => /圖[一二三]\.(png|jpg)/.test(e.name)) &&
    entries.filter((e) => e.type === "image/jpeg").length === 1);
  check("批次上傳 Console errors = 0", a.consoleErrors.length === 0);
  if (a.consoleErrors.length) { console.log("   errors:", a.consoleErrors.slice(0, 3)); }

  /* ---- 要求 1 / 5：跨頁後三張的預覽與下載全部正常 ---- */
  console.log("\n[2] 跨頁後：三張圖片預覽與下載全部正常");
  const b = await openMaterials({ seed: carrySession(a) });
  const cards = [...b.doc.querySelectorAll(".mat-card")];
  check("跨頁後首次載入即顯示三張教材", cards.length === 3);
  check("Runtime 的 file 皆為 null（跨頁前提成立）",
    b.window.AHS.MaterialRuntime.list().every((m) => m.file === null));

  let previewOk = 0, downloadOk = 0;
  const downloadedNames = [];
  cards.forEach((card) => {
    card.querySelector(".mat-card__preview").click();
    const overlay = b.doc.querySelector(".mat-preview__overlay, .mat-preview");
    const img = overlay && overlay.querySelector("img.mat-preview__media");
    if (img && img.getAttribute("src")) { previewOk += 1; }
    const closeBtn = overlay && overlay.querySelector(".mat-preview__close");
    if (closeBtn) { closeBtn.click(); }

    const name = clickDownload(b, card);
    if (name) { downloadOk += 1; downloadedNames.push(name); }
  });
  check("三張圖片跨頁預覽全部渲染（image viewer 有 src）", previewOk === 3);
  check("三張圖片跨頁下載全部觸發", downloadOk === 3);
  check("下載檔名逐張正確且不重複",
    new Set(downloadedNames).size === 3 && downloadedNames.every((n) => /圖[一二三]\.(png|jpg)/.test(n)));
  const finalBlob = b.lastBlob();
  check("下載使用真實 Blob（非空）", !!finalBlob && expectedSizes.indexOf(finalBlob.size) !== -1);
  check("跨頁預覽/下載 Console errors = 0", b.consoleErrors.length === 0);
  if (b.consoleErrors.length) { console.log("   errors:", b.consoleErrors.slice(0, 3)); }

  /* ---- 要求 1：單張仍完全正常 ---- */
  console.log("\n[3] 單張上傳：跨頁下載正常（不受批次修正影響）");
  const c = await openMaterials({});
  await upload(c, [new c.window.File(["SINGLE-ONLY-xyz"], "單張.png", { type: "image/png" })]);
  check("單張已保存（stored=1）", c.window.AHS.MaterialFileStore.stats().stored === 1);
  const d = await openMaterials({ seed: carrySession(c) });
  const singleName = clickDownload(d, d.doc.querySelector(".mat-card"));
  check("單張跨頁下載檔名正確", singleName === "單張.png");
  check("單張跨頁 Blob 長度正確", d.lastBlob() && d.lastBlob().size === 15);
  check("單張流程 Console errors = 0", d.consoleErrors.length === 0);

  /* ---- 配額耗盡：誠實處理，且不影響已保存者 ---- */
  console.log("\n[4] 瀏覽器暫存配額耗盡：誠實回報，已保存者不受影響");
  const e = await openMaterials({ quotaBytes: 5 * 1024 * 1024 });
  const bigFile = (n) => new e.window.File(["X".repeat(2 * 1024 * 1024)], "大圖" + n + ".png", { type: "image/png" });
  await upload(e, [bigFile(1), bigFile(2), bigFile(3)]);
  await new Promise((r) => setTimeout(r, 2200));
  const qStats = e.window.AHS.MaterialFileStore.stats();
  check("三個教材仍全部建立（配額不影響教材本身）",
    e.window.AHS.MaterialRuntime.list().length === 3);
  check("能存的存下、存不下的標記 oversize（不靜默失敗）",
    qStats.total === 3 && qStats.stored >= 1 && qStats.stored + qStats.oversize === 3);
  check("已保存者仍可取得真實 Blob（單一檔案失敗不波及他人）",
    e.window.AHS.MaterialFileStore.list().filter((x) => x.state === "stored")
      .every((x) => !!e.window.AHS.MaterialFileStore.blobFor(x.materialId)));
  const statusText = (e.doc.querySelector("p.mat-status") || {}).textContent || "";
  check("狀態列具名告知哪些檔案僅限本次階段", /超出瀏覽器暫存空間.*大圖/.test(statusText));
  const overCard = [...e.doc.querySelectorAll(".mat-card")].find((card) =>
    /大圖3/.test(card.textContent));
  if (overCard) {
    clickDownload(e, overCard);
    const st = (e.doc.querySelector("p.mat-status") || {}).textContent || "";
    check("oversize 教材於同一階段仍可下載（live File 尚在）", /已下載教材/.test(st));
  } else {
    check("oversize 教材於同一階段仍可下載（live File 尚在）", false);
  }
  check("配額情境 Console errors = 0", e.consoleErrors.length === 0);
  if (e.consoleErrors.length) { console.log("   errors:", e.consoleErrors.slice(0, 3)); }

  /* ---- 刪除釋放 ---- */
  console.log("\n[5] 刪除教材同步釋放其位元組（僅該張，不影響其他）");
  const f = await openMaterials({ seed: carrySession(a) });
  const before = f.window.AHS.MaterialFileStore.stats().total;
  f.doc.querySelector(".mat-card__delete-btn").click();
  const del = [...f.doc.querySelectorAll(".mat-dialog__overlay button")]
    .find((b2) => /^刪除$/.test((b2.textContent || "").trim()));
  if (del) { del.click(); }
  const after = f.window.AHS.MaterialFileStore.stats().total;
  check("僅釋放被刪除的那一張", before === 3 && after === 2);
  check("其餘兩張位元組仍完整",
    f.window.AHS.MaterialFileStore.list().every((x) => !!f.window.AHS.MaterialFileStore.get(x.materialId)));
  check("刪除流程 Console errors = 0", f.consoleErrors.length === 0);

  console.log("\nMaterialBatchPersistence: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail === 0 ? 0 : 1);
})();
