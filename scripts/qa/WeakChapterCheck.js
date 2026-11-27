/* scripts/qa/WeakChapterCheck.js — 2026-11-27 AHS-FEAT 弱點單元與加強練習的真實瀏覽器實測。
   拋棄式瀏覽器 context，只寫 sessionStorage（測試學生 student_a），不登入、不碰任何真實帳號。
   1. 先放 5 筆 tm_112 答錯、3 筆 tm_113 的作答紀錄 → 學習總結頁應顯示 tm_112「需加強」、tm_113「資料不足」。
   2. 按「加強練習」→ 測驗中心開出 10 題的加強練習，全部答對後完成測驗。
   3. 回學習總結頁：tm_112 重新計算後移出「需加強」。
   Run: node scripts/qa/WeakChapterCheck.js [baseUrl] [screenshotDir] */
"use strict";
const { chromium } = require("playwright");
const BASE = (process.argv[2] || "https://stanleyshen7916-creator.github.io/AI-HighSchool-Learning-System").replace(/\/$/, "");
const SHOTS = process.argv[3] || null;
const WS = { studentId: "student_a", schoolId: "zwsh", semesterIds: ["g2s1"] };
const KEY = "ahs:student_a__zwsh__g2s1:knowledgeMasteryRuntime";

function seed() {
  const ts = (i) => new Date(Date.UTC(2026, 10, 20, 12, 0, i)).toISOString();
  const points = {};
  for (let i = 1; i <= 5; i++) { points["seed-112-" + i] = { subject: "history", materialId: "", attempts: [{ correct: false, day: "2026/11/20", ts: ts(i), materialId: "tm_112", questionId: "tm_112_q" + i }] }; }
  for (let i = 1; i <= 3; i++) { points["seed-113-" + i] = { subject: "history", materialId: "", attempts: [{ correct: true, day: "2026/11/20", ts: ts(10 + i), materialId: "tm_113", questionId: "tm_113_q" + i }] }; }
  return { points: points };
}

async function rowOf(page, name) {
  return page.locator(".weak-unit__row", { has: page.locator(".weak-unit__name", { hasText: name }) }).first();
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  /* 資源載入失敗改用 response 記下網址；js/data/SupabaseConfig.local.js 本來就不進版控（每頁都 404），不算錯誤。 */
  page.on("console", (m) => { if (m.type() === "error" && !/^Failed to load resource/.test(m.text())) { errors.push("console: " + m.text()); } });
  page.on("response", (r) => { if (r.status() >= 400 && !/SupabaseConfig\.local\.js$/.test(r.url())) { errors.push(r.status() + " " + r.url()); } });
  page.on("dialog", (d) => d.accept());
  await page.addInitScript(([ws, key, data]) => {
    if (!sessionStorage.getItem("ahs:wcc-seeded")) {
      sessionStorage.setItem("ahs:workspace", JSON.stringify(ws));
      sessionStorage.setItem(key, JSON.stringify(data));
      sessionStorage.setItem("ahs:wcc-seeded", "1");
    }
  }, [WS, KEY, seed()]);
  const out = {};

  await page.goto(BASE + "/summary.html", { waitUntil: "load" });
  await page.waitForSelector(".weak-unit", { timeout: 15000 });
  const r112 = await rowOf(page, "第1章");
  const r113 = await rowOf(page, "第2章");
  out.before = { tm_112: await r112.innerText(), tm_113: await r113.innerText() };
  if (SHOTS) { await page.locator(".weak-unit").screenshot({ path: SHOTS + "/weak-before.png" }); }

  await r112.locator(".weak-unit__go").click();
  await page.waitForSelector(".qexam", { timeout: 15000 });
  out.examTitle = await page.locator(".qexam__title").innerText();
  out.questionCount = await page.evaluate(() => AHS.ExamRuntime.getCurrent().totalQuestions);
  out.questionIds = await page.evaluate(() => { const s = AHS.ExamRuntime.getCurrent(); return AHS.QuestionRuntime.getSet(s.examId).map((q) => q.id); });
  if (SHOTS) { await page.screenshot({ path: SHOTS + "/weak-practice.png" }); }
  for (let i = 0; i < out.questionCount; i++) {
    const key = await page.evaluate(() => { const s = AHS.ExamRuntime.getCurrent(); return AHS.QuestionRuntime.getQuestion(s.examId, s.currentIndex).correctAnswer; });
    await page.locator('.qcard-option[data-key="' + key + '"]').first().click();
    const finish = page.locator("button", { hasText: /^完成測(驗|試)$/ });
    if (i === out.questionCount - 1) { await finish.first().click(); }
    else { await page.locator("button", { hasText: "下一題" }).first().click(); }
  }
  await page.waitForSelector(".qreview", { timeout: 15000 });
  out.score = await page.locator(".qreview__score").first().innerText().catch(() => null);

  await page.goto(BASE + "/summary.html", { waitUntil: "load" });
  await page.waitForSelector(".weak-unit", { timeout: 15000 });
  out.after = { tm_112: await (await rowOf(page, "第1章")).innerText() };
  if (SHOTS) { await page.locator(".weak-unit").screenshot({ path: SHOTS + "/weak-after.png" }); }
  out.errors = errors;
  console.log(JSON.stringify(out, null, 2));
  const ok = /需加強/.test(out.before.tm_112) && /資料不足/.test(out.before.tm_113) && out.questionCount === 10 &&
    /加強練習/.test(out.examTitle) && !/需加強/.test(out.after.tm_112) && !errors.length;
  console.log(ok ? "PASS" : "FAIL");
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
