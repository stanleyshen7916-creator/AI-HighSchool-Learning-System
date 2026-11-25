/* scripts/qa/MeasureListPage.js — queue 9.4 (T1–T4 measurement). Real Chromium, real files, no external network.

   Opens materials.html (the 教材中心 list page) N times in two variants and reports the median of each number:
     "now"   — as it is: js/data/TeachingMaterialData.js (the whole array) is loaded by the page
     "index" — the same page with that one <script> replaced by js/data/TeachingMaterialIndex.js
               + js/runtime/TeachingMaterialContentLoader.js  (what the page would load after the split)
   Also times opening ONE material (its content file) for the median and the biggest material.

   Reported per variant: bytes of js/data/* fetched (raw, and gzip-compressed as GitHub Pages serves it),
   total JS bytes, DOMContentLoaded and load times, and how long TeachingMaterialLoader.load() takes inside the page.
   (The "index" page is only a loading-cost measurement: until the pages are switched over, other widgets that read
   the full array — queue 9.4 T5–T7 — are not converted yet.)

   Run: node scripts/qa/MeasureListPage.js [runs=5] [page=materials.html] */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { chromium } = require("playwright");

const REPO = path.join(__dirname, "..", "..");
const RUNS = Number(process.argv[2] || 5);
const PAGE = process.argv[3] || "materials.html";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp" };
const DATA_TAG = '<script src="js/data/TeachingMaterialData.js"></script>';

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
      const file = path.join(REPO, rel);
      if (!file.startsWith(REPO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
      let body = fs.readFileSync(file);
      const headers = { "content-type": TYPES[path.extname(file)] || "application/octet-stream" };
      if (/\.(js|html|css|json)$/.test(file) && /gzip/.test(req.headers["accept-encoding"] || "")) { body = zlib.gzipSync(body); headers["content-encoding"] = "gzip"; }
      res.writeHead(200, headers); res.end(body);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}
const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

async function measure(browser, base, variant) {
  const out = { dataRaw: [], dataGz: [], jsRaw: [], jsGz: [], dcl: [], load: [], loaderMs: [] };
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.route("**/*", (route) => {
      const u = new URL(route.request().url());
      if (u.hostname !== "127.0.0.1") { return route.abort(); }
      if (variant === "index" && u.pathname === "/" + PAGE) {
        return route.fetch().then(async (r) => {
          let body = await r.text();
          if (body.indexOf(DATA_TAG) === -1) { throw new Error(PAGE + " no longer has the TeachingMaterialData tag"); }
          body = body.replace(DATA_TAG, '<script src="js/data/TeachingMaterialIndex.js"></script><script src="js/runtime/TeachingMaterialContentLoader.js"></script>');
          route.fulfill({ response: r, body });
        });
      }
      return route.continue();
    });
    await page.addInitScript(() => { sessionStorage.setItem("ahs:workspace", JSON.stringify({ studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] })); });
    await page.goto(base + "/" + PAGE, { waitUntil: "load" });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const res = performance.getEntriesByType("resource").filter((e) => e.name.indexOf("/js/") !== -1);
      const nav = performance.getEntriesByType("navigation")[0];
      const sum = (list, k) => list.reduce((n, e) => n + (e[k] || 0), 0);
      const data = res.filter((e) => e.name.indexOf("/js/data/") !== -1);
      let loaderMs = null;
      if (window.AHS && AHS.TeachingMaterialLoader) {
        AHS.TeachingMaterialLoader.reset();
        const t = performance.now(); AHS.TeachingMaterialLoader.load(); loaderMs = performance.now() - t;
      }
      return { dataRaw: sum(data, "decodedBodySize"), dataGz: sum(data, "encodedBodySize"), jsRaw: sum(res, "decodedBodySize"), jsGz: sum(res, "encodedBodySize"), dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd, loaderMs };
    });
    Object.keys(out).forEach((k) => { if (r[k] != null) { out[k].push(r[k]); } });
    await ctx.close();
  }
  const m = {}; Object.keys(out).forEach((k) => { m[k] = out[k].length ? median(out[k]) : null; });
  return m;
}

async function measureOne(browser, base, id) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.route("**/*", (route) => (new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort()));
  await page.goto(base + "/privacy-blank.html", { waitUntil: "load" }).catch(() => {});
  const r = await page.evaluate(async (file) => {
    const t = performance.now();
    await new Promise((res, rej) => { const s = document.createElement("script"); s.src = file; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    const dt = performance.now() - t;
    const e = performance.getEntriesByType("resource").filter((x) => x.name.indexOf(file) !== -1)[0];
    return { ms: dt, gz: e ? e.encodedBodySize : 0, raw: e ? e.decodedBodySize : 0 };
  }, "/js/data/materials-content/" + id + ".js");
  await ctx.close();
  return r;
}

(async () => {
  const server = await serve();
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch();
  const sandbox = { AHS: {} }; sandbox.window = sandbox;
  require("vm").runInNewContext(fs.readFileSync(path.join(REPO, "js/data/TeachingMaterialIndex.js"), "utf8"), sandbox);
  const index = sandbox.AHS.TeachingMaterialIndex;
  const sorted = index.slice().sort((a, b) => a.content.bytes - b.content.bytes);
  const medianId = sorted[Math.floor(sorted.length / 2)].materialId, biggestId = sorted[sorted.length - 1].materialId;
  const now = await measure(browser, base, "now");
  const idx = await measure(browser, base, "index");
  const kb = (n) => (n / 1024).toFixed(0) + " KB";
  const ms = (n) => (n == null ? "—" : n.toFixed(0) + " ms");
  console.log("\n" + PAGE + " 中位數，" + RUNS + " 次，本機 Chromium、無外部網路");
  console.log("                         現在（完整資料）      改後（目錄）");
  console.log("js/data 傳輸（gzip）     " + kb(now.dataGz).padEnd(18) + kb(idx.dataGz));
  console.log("js/data 解壓後           " + kb(now.dataRaw).padEnd(18) + kb(idx.dataRaw));
  console.log("全部 js 傳輸（gzip）     " + kb(now.jsGz).padEnd(18) + kb(idx.jsGz));
  console.log("DOMContentLoaded         " + ms(now.dcl).padEnd(18) + ms(idx.dcl));
  console.log("load                     " + ms(now.load).padEnd(18) + ms(idx.load));
  console.log("TeachingMaterialLoader.load()  " + ms(now.loaderMs).padEnd(14) + ms(idx.loaderMs));
  const one = await measureOne(browser, base, medianId), big = await measureOne(browser, base, biggestId);
  console.log("\n開啟單一教材（載入內容檔）：");
  console.log("  中位數 " + medianId + "：" + kb(one.raw) + "（gzip " + kb(one.gz) + "），" + ms(one.ms));
  console.log("  最大   " + biggestId + "：" + kb(big.raw) + "（gzip " + kb(big.gz) + "），" + ms(big.ms));
  await browser.close();
  server.close();
})().catch((e) => { console.log("measure failed: " + e.stack); process.exit(1); });
