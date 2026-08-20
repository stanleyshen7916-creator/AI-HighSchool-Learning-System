/* playwright/tests/question-figure-147.spec.js — Sprint AI-147（使用者需求：
   錯題本詳解裡寫著「依附圖」，但畫面上根本沒有圖可看，能否提供圖片詳解）.

   Real-browser proof that figureSvg — authored by hand from each
   question's own already-verified text content, wired through
   TeachingMaterialAdapter.js -> js/data/TeachingMaterialData.js ->
   TeachingMaterialLoader.js -> AutoGrader.js/ReviewRuntime.js/
   WrongBookRuntime.js — actually renders where a student would see it:
   the exam-taking card (js/ui/QuestionCard.js), and the 知識弱點 Detail
   Panel (js/components/WrongBook.js). Complements
   tests/regression/KnowledgeEngineRegression.js's own §11 (jsdom-level,
   same real tm_2_q3 question, Runtime-level assertions). */
"use strict";
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl } = require("../helpers/urls.js");
const { seedSession, todayStr } = require("../helpers/seed.js");

function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() !== "error") { return; }
    const loc = msg.location && msg.location();
    if (loc && /SupabaseConfig\.local\.js$/.test(loc.url || "")) { return; }
    errors.push(msg.text());
  });
  return errors;
}

test("AI-147：測驗中心作答畫面真實顯示題目附圖（顳窩親緣關係題）", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(fileUrl("quiz"));

  // tryDirectExamEntry()/drawCycle() only ever shows FORMAL_EXAM_QUESTION_
  // COUNT（10）questions randomly drawn from this real material's full
  // bank (32+ real questions) — a genuine random subset that may or may
  // not include tm_2_q3 on any one draw (confirmed flaky when this test
  // relied on that raw draw). Extract the SAME real question objects
  // (tm_2_q3's own real figureSvg included verbatim) and re-import them
  // under a small controlled examId instead — same real rendering path,
  // deterministic set.
  const controlled = await page.evaluate(() => {
    const AHS = window.AHS;
    AHS.TeachingMaterialLoader.initialize();
    const materials = AHS.MaterialRuntime.list();
    const m = materials.find((mm) =>
      AHS.QuestionRuntime.hasExam("teaching_material_" + mm.id) &&
      AHS.QuestionRuntime.getSet("teaching_material_" + mm.id).some((q) => q.id === "tm_2_q3"));
    if (!m) { return null; }
    const fullSet = AHS.QuestionRuntime.getSet("teaching_material_" + m.id);
    const qFigure = fullSet.find((q) => q.id === "tm_2_q3");
    const qPlain = fullSet.find((q) => q.id !== "tm_2_q3" && !q.figureSvg);
    return { questions: [qFigure, qPlain].filter(Boolean) };
  });
  expect(controlled && controlled.questions.length).toBeGreaterThan(0);

  const examId = "teaching_material_fig147_controlled";
  await page.addInitScript((args) => {
    window.addEventListener("DOMContentLoaded", () => {
      const AHS = window.AHS;
      if (!AHS || !AHS.QuestionRuntime || !AHS.QuestionBankRuntime) { return; }
      AHS.QuestionRuntime.importQuestions(args.examId, args.questions);
      AHS.QuestionBankRuntime.ensureBank(args.examId, args.questions);
    }, { once: true, capture: true });
  }, { examId, questions: controlled.questions });
  await page.goto(fileUrl("quiz") + "?examId=" + encodeURIComponent(examId));

  // Click through the (small, deterministic) set until the real 顳窩
  // question is showing, confirm its real figure renders — a genuine,
  // real SVG, not a placeholder box.
  let found = false;
  for (let i = 0; i < 5; i++) {
    const text = await page.locator(".qcard__text").textContent();
    if (text.indexOf("顳窩") !== -1) {
      found = true;
      break;
    }
    const next = page.locator(".qnav__next");
    if (!(await next.count())) { break; }
    await next.click();
  }
  expect(found).toBe(true);
  await expect(page.locator(".qcard__figure")).toBeVisible();
  await expect(page.locator(".qcard__figure svg")).toBeVisible();
  await expect(page.locator(".qcard__figure")).toContainText("羊膜動物祖先");

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-147：知識弱點 Detail Panel 真實顯示錯題附圖（原本「依附圖」卻無圖可看的缺口）", async ({ page }) => {
  const errors = collectErrors(page);
  const figureSvg = '<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="50" cy="30" r="20" fill="none" stroke="#333"/></svg>';
  await seedSession(page, {
    "ahs:wrongBookRuntime": {
      items: [{
        id: "wb_147_1", questionId: "q147", subject: "biology", title: "AI-147 測試教材", chapter: "第一章",
        materialId: "", knowledgePoint: "kp147", question: "AI-147 附圖測試題目",
        options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
        yourAnswer: "B", correctAnswer: "A", explanation: "依附圖可知...",
        figureSvg: figureSvg,
        errorCount: 1, lastError: todayStr(), firstError: todayStr(), masteredAt: null,
        bookmarked: false, archived: false, correctStreak: 0
      }], seq: 1
    }
  });
  await page.goto(fileUrl("wrongbook"));

  const row = page.locator(".wb-row", { hasText: "AI-147 附圖測試題目" });
  await expect(row).toBeVisible();
  await row.click();

  await expect(page.locator(".wb-detail__figure")).toBeVisible();
  await expect(page.locator(".wb-detail__figure svg")).toBeVisible();

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-148：舊有錯題紀錄（本身沒有 figureSvg，早於此功能上線就建立）在知識弱點也真實補回附圖", async ({ page }) => {
  const errors = collectErrors(page);
  /* 真實情境：這筆錯題紀錄是「題目附圖」（Sprint AI-147）上線前就存在的
     舊資料——WrongBookRuntime.sync() 只在第一次寫入該題時記下
     figureSvg，既有紀錄不會被回頭補上新欄位（同一份 discipline 也適用於
     question/options/explanation，故意不覆寫）。故意不在這筆種子資料放
     figureSvg，驗證 js/components/WrongBook.js 的 resolveFigureSvg() 真
     的會在畫面渲染當下，從 js/data/TeachingMaterialData.js 這個真實、
     已經內含 tm_1_q3 真實 figureSvg 的靜態資料補回來。 */
  await seedSession(page, {
    "ahs:wrongBookRuntime": {
      items: [{
        id: "wb_148_1", questionId: "tm_1_q3", subject: "math", title: "AI-148 舊紀錄測試教材", chapter: "第一章",
        materialId: "", knowledgePoint: "正弦定理、圓內接四邊形",
        question: "如下圖，設圓內接四邊形ABCD中∠CAD=30°，∠ACB=45°，CD=2，則 AB=?",
        options: [{ key: "1", text: "(1) 2" }, { key: "2", text: "(2) 2√2" }],
        yourAnswer: "1", correctAnswer: "2", explanation: "依附圖，CD所對圓周角∠CAD=30°...",
        // 刻意不設定 figureSvg —— 模擬舊紀錄。
        errorCount: 1, lastError: todayStr(), firstError: todayStr(), masteredAt: null,
        bookmarked: false, archived: false, correctStreak: 0
      }], seq: 1
    }
  });
  await page.goto(fileUrl("wrongbook"));

  const row = page.locator(".wb-row", { hasText: "圓內接四邊形ABCD" });
  await expect(row).toBeVisible();
  await row.click();

  await expect(page.locator(".wb-detail__figure")).toBeVisible();
  await expect(page.locator(".wb-detail__figure svg")).toBeVisible();
  // 這是 tm_1_q3 真實附圖裡才有的內容，證明真的是補回真實資料，不是隨便一張圖。
  await expect(page.locator(".wb-detail__figure")).toContainText("CD=2");

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-152：舊有錯題紀錄（本身沒有 options，早於此欄位上線就建立）「全部重新練習」也真實補回選項，不再卡住無法作答", async ({ page }) => {
  const errors = collectErrors(page);
  /* 真實情境（使用者 QA 回報）：點「全部重新練習」，複習彈窗顯示題目，
     但題目下面完全沒有選項可以選，卡在「提交答案」按不下去。根因：
     wrong_book 這張表原本沒有 options 欄位（AI-152 補上），任何在這之前
     就已經存在的紀錄，本地/雲端兩邊都沒有真正的選項資料可以下載回來。
     故意在這筆種子資料把 options 留空，模擬修正上線前就已存在的舊紀
     錄，驗證 js/components/WrongBook.js 的 resolveOptions() 真的會在畫
     面渲染當下，從 js/data/TeachingMaterialData.js 這個真實、已核實過
     的靜態資料（tm_1_q1 本尊）補回真正的選項——不是隨便湊幾個假選項。 */
  await seedSession(page, {
    "ahs:wrongBookRuntime": {
      items: [{
        id: "wb_152_1", questionId: "tm_1_q1", subject: "math", title: "AI-152 舊紀錄測試教材", chapter: "第一章",
        materialId: "", knowledgePoint: "正弦定理",
        question: "如圖，∠BAC=θ，∠ABD=∠ACD=90°，AB=a，BD=b，下列選項何者可以表示 CD？",
        options: [],
        yourAnswer: "A", correctAnswer: "E", explanation: "由∠ABD=90°、∠ACD=90°可推得...",
        errorCount: 1, lastError: todayStr(), firstError: todayStr(), masteredAt: null,
        bookmarked: false, archived: false, correctStreak: 0
      }], seq: 1
    }
  });
  await page.goto(fileUrl("wrongbook"));

  await page.locator(".wb-action--primary", { hasText: "全部重新練習" }).click();
  await expect(page.locator(".wb-review-session__progress")).toContainText("1 / 1");

  const options = page.locator(".wb-detail__options--interactive .wb-detail__option");
  await expect(options.first()).toBeVisible();
  await expect(options).toHaveCount(5);
  // 這是 tm_1_q1 真實選項裡才有的內容，證明真的是補回真實資料，不是隨便湊的。
  await expect(options.first()).toContainText("a sinθ + b cosθ");
  await expect(options.last()).toContainText("a sinθ − b cosθ");

  // 真的能選、真的能提交，不再卡住。
  await options.first().click();
  await page.locator(".wb-detail__btn--primary", { hasText: "提交答案" }).click();
  await expect(page.locator(".wb-detail__title", { hasText: "複習結果" })).toBeVisible();

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-153：questionId 是空字串的舊有雲端錯題紀錄（Sprint AI-152 上線前就已推上雲端，local_question_id 永遠補不回來），用題目文字比對一樣能真實補回選項", async ({ page }) => {
  const errors = collectErrors(page);
  /* 真實情境（使用者在無痕視窗重測，症狀依舊）：wrong_book.question_id
     是 UUID 外鍵，教材題目的本地 id（如 "tm_1_q1"）從未真的送上雲端過
     ——AI-153 新增 local_question_id 這個純文字欄位修正「之後」的推送/
     下載，但「之前」就已經存在雲端的紀錄，這個欄位永遠是 null，任何
     無痕視窗/新裝置撈回來的 questionId 就是空字串，永遠對不回
     TeachingMaterialData.js。這裡刻意把 questionId 留空字串（模擬這種
     已經回不去的舊雲端紀錄），只給題目文字（跟 wrong_book.question_text
     一樣，從第一天就忠實保存），驗證 findMaterialQuestion() 的文字比對
     備援路徑真的能補回真實選項——不是只靠 questionId 才行。 */
  await seedSession(page, {
    "ahs:wrongBookRuntime": {
      items: [{
        id: "wb_153_1", questionId: "", subject: "math", title: "AI-153 舊雲端紀錄測試教材", chapter: "第一章",
        materialId: "", knowledgePoint: "正弦定理",
        question: "如圖，∠BAC=θ，∠ABD=∠ACD=90°，AB=a，BD=b，下列選項何者可以表示 CD？（圖形為四邊形ABDC：B、C分別是以AD為斜邊的兩個直角三角形之直角頂點，∠ABD、∠ACD皆為直角）",
        options: [],
        yourAnswer: "A", correctAnswer: "E", explanation: "由∠ABD=90°、∠ACD=90°可推得...",
        errorCount: 1, lastError: todayStr(), firstError: todayStr(), masteredAt: null,
        bookmarked: false, archived: false, correctStreak: 0
      }], seq: 1
    }
  });
  await page.goto(fileUrl("wrongbook"));

  await page.locator(".wb-action--primary", { hasText: "全部重新練習" }).click();
  await expect(page.locator(".wb-review-session__progress")).toContainText("1 / 1");

  const options153 = page.locator(".wb-detail__options--interactive .wb-detail__option");
  await expect(options153.first()).toBeVisible();
  await expect(options153).toHaveCount(5);
  await expect(options153.first()).toContainText("a sinθ + b cosθ");

  await options153.first().click();
  await page.locator(".wb-detail__btn--primary", { hasText: "提交答案" }).click();
  await expect(page.locator(".wb-detail__title", { hasText: "複習結果" })).toBeVisible();

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});
