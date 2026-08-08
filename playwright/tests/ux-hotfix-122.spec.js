/* playwright/tests/ux-hotfix-122.spec.js — Sprint AI-122 (Learning
   Experience UX Hotfix) AI-122-12: PAT-122-01~08, real-browser proof of
   this Sprint's own UX fixes (no new Runtime, no Learning Engine change
   — this Sprint's own LOCK), complementing tests/jsdom/BehaviorSuite.js
   and tests/regression/LearningFlowRegression.js's jsdom-level coverage
   rather than duplicating it. */
"use strict";
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl } = require("../helpers/urls.js");
const { seedSession, todayStr } = require("../helpers/seed.js");

function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() !== "error") { return; }
    /* AI Supabase Persistence Root Cause Fix (Root Cause A): the one,
       git-ignored, optional js/data/SupabaseConfig.local.js this project
       already documents (.gitignore) — a real browser 404 on it (there is
       no way to reference an optional local-only file from a <script> tag
       without a real browser logging this, network-level, regardless of
       any onerror handler) is expected in CI/this Sandbox where the file
       never exists by design; every real reader already falls back to the
       committed blank AHS.SupabaseConfig. Filtered by the failing
       resource's own URL (msg.location().url), not by message text, so a
       genuine 404 on any other file still fails this assertion. */
    const loc = msg.location && msg.location();
    if (loc && /SupabaseConfig\.local\.js$/.test(loc.url || "")) { return; }
    errors.push(msg.text());
  });
  return errors;
}

function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const pad = (v) => (v < 10 ? "0" + v : String(v));
  return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
}

/* Sprint AI-122: seeding via page.evaluate(AHS.WrongBookRuntime.sync())
   immediately followed by page.reload() proved genuinely unreliable
   under CPU contention — even after confirming the write landed via
   page.waitForFunction() (still inside the SAME page/JS context) before
   reloading, sessionStorage was occasionally found completely empty
   after the reload (not just a slow render — the key itself absent).
   The robust, already-established pattern the rest of this suite uses
   for every other Runtime (see e.g. playwright/tests/analytics-scenario.
   spec.js's own "ahs:wrongBookRuntime" seed) sidesteps the whole
   evaluate()+reload() choreography: seedSession() writes directly into
   sessionStorage via page.addInitScript(), which runs before ANY of the
   page's own <script> tags on every subsequent navigation — so a single
   page.goto() (never page.reload()) always finds the real data already
   in place before AHS.WrongBookRuntime's own hydrate() call runs. */
function wrongBookItem(overrides) {
  return Object.assign({
    id: "wb_1", questionId: "q1", subject: "math", title: "教材", chapter: "第一章",
    materialId: "", knowledgePoint: "kp", question: "Q",
    options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
    yourAnswer: "B", correctAnswer: "A", explanation: "",
    errorCount: 1, lastError: todayStr(), firstError: todayStr(), masteredAt: null,
    bookmarked: false, archived: false, correctStreak: 0
  }, overrides);
}

async function gotoWrongbookWithItem(page, overrides) {
  await seedSession(page, { "ahs:wrongBookRuntime": { items: [wrongBookItem(overrides)], seq: 1 } });
  await page.goto(fileUrl("wrongbook"));
}

test("PAT-122-01：立即重做 Session Reset — 完整重置作答狀態，不留上一次答案/解析/正解", async ({ page }) => {
  const errors = collectErrors(page);
  await gotoWrongbookWithItem(page, {
    id: "wb_1", questionId: "pat122-01-q1", title: "PAT-122-01 測試教材", knowledgePoint: "kp_pat122_01",
    question: "PAT-122-01 測試題目",
    options: [{ key: "A", text: "選項A" }, { key: "B", text: "選項B" }, { key: "C", text: "選項C" }],
    yourAnswer: "B", correctAnswer: "A", explanation: "PAT-122-01 詳解內容"
  });
  const row = page.locator(".wb-row", { hasText: "PAT-122-01 測試題目" });
  await expect(row).toBeVisible();
  await row.click();

  // Before redo: previous answer/explanation are honestly visible.
  await expect(page.locator(".wb-detail__answers")).toBeVisible();
  await expect(page.locator(".wb-detail__explain")).toBeVisible();

  await page.locator(".wb-detail__btn--primary", { hasText: "立即重做" }).click();

  // AI-122-01 core requirement: previous answer/correct-answer/explanation
  // blocks are hidden during the redo — never spoil the answer.
  await expect(page.locator(".wb-detail__answers")).toBeHidden();
  await expect(page.locator(".wb-detail__explain")).toBeHidden();
  // Reset to 尚未作答: interactive options exist, none pre-selected/marked.
  const freshOptions = page.locator(".wb-detail__options--interactive .wb-detail__option");
  await expect(freshOptions).toHaveCount(3);
  await expect(page.locator(".wb-detail__option.is-selected")).toHaveCount(0);
  await expect(page.locator(".wb-detail__option.is-correct")).toHaveCount(0);
  await expect(page.locator(".wb-detail__option.is-wrong")).toHaveCount(0);

  // Submit a (wrong-on-purpose) answer, then redo again — must reset a
  // SECOND time too, not just the first (proves it's a real rebuild of
  // the Question Session, not a one-shot special case).
  await freshOptions.filter({ hasText: "選項B" }).click();
  await page.locator(".wb-detail__review .wb-detail__btn--primary").click();
  await expect(page.locator(".wb-detail__answers")).toBeVisible();

  await page.locator(".wb-detail__btn--primary", { hasText: "立即重做" }).click();
  await expect(page.locator(".wb-detail__answers")).toBeHidden();
  await expect(page.locator(".wb-detail__option.is-selected")).toHaveCount(0);

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-122-02：所有「前往考前練習」皆進入 Practice Mode，不得再導向正式測驗", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(fileUrl("quiz"));
  await page.evaluate(() => {
    const AHS = window.AHS;
    const questions = [];
    for (let i = 1; i <= 3; i++) {
      questions.push({
        id: "pat122-02-q" + i, index: i, subject: "math", text: "PAT-122-02 練習題 " + i,
        type: "single_choice", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
        correctAnswer: "A", knowledgePoint: "kp_pat122_02", difficulty: "中等",
        materialId: "pat122_02", questionSource: "ORIGINAL", origin: "x"
      });
    }
    AHS.QuestionRuntime.importQuestions("teaching_material_pat122_02", questions);
  });
  await page.goto(fileUrl("quiz") + "?mode=practice&materialId=pat122_02");

  // Real proof it's Practice Mode, never Formal Exam: 巧巧老師出題引導
  // renders (Practice Mode's own real entry, AI-122-02/03), .qcard
  // (Formal Exam's own question card) never mounts.
  await expect(page.locator('.qguide[aria-label="巧巧老師出題引導"]')).toBeVisible();
  await expect(page.locator(".qcard")).toHaveCount(0);
  await expect(page.locator(".quiz-practice-root")).not.toHaveAttribute("hidden", "");

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-122-03：Practice Mode 完整承接 Material Context，不重新回首頁／不重新列出全部教材", async ({ page }) => {
  const errors = collectErrors(page);
  /* AHS.QuestionRuntime is a page-lifetime, in-memory Runtime (never
     persisted to sessionStorage, unlike QuestionBankRuntime) — a plain
     page.evaluate() import before a SECOND page.goto() would be wiped
     by that navigation. addInitScript() runs before AppQuiz.js's own
     init() on every subsequent navigation in this context, so the
     import is real and already in place by the time QuizCenter.js's
     own create() reads AHS.QuestionRuntime.hasExam() during its first
     render on the mode=practice URL below. */
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const AHS = window.AHS;
      if (!AHS || !AHS.QuestionRuntime) { return; }
      AHS.QuestionRuntime.importQuestions("teaching_material_pat122_03", [{
        id: "pat122-03-q1", index: 1, subject: "math", text: "PAT-122-03 專屬練習題",
        type: "single_choice", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
        correctAnswer: "A", knowledgePoint: "kp_pat122_03", materialId: "pat122_03",
        questionSource: "ORIGINAL", origin: "x"
      }]);
    }, { once: true });
  });
  await page.goto(fileUrl("quiz") + "?mode=practice&materialId=pat122_03");

  await page.locator('.qguide__diff[data-difficulty="medium"]').click();
  await page.locator(".qguide__start").click();

  // Real practice list scoped to THIS material only — never the
  // unfiltered Repository catalog (which would only appear when no
  // filterMaterialId is given).
  await expect(page.locator(".quiz-practice__row")).toHaveCount(1);
  await expect(page.locator(".quiz-practice__row")).toContainText("PAT-122-03 專屬練習題");
  await expect(page.locator('[aria-label="Repository 教材"]')).toHaveCount(0);

  await page.locator(".quiz-practice__row").click();
  await expect(page.locator(".quiz-practice__question")).toContainText("PAT-122-03 專屬練習題");

  // Sprint AI-123 AI-123-01/03: clicking a row now opens the full-screen
  // Practice View (.qpv-overlay), not an inline Detail Panel — the
  // question itself is still real and unchanged. 返回題目列表 (AI-123-03)
  // keeps the SAME material context — never drops back to an
  // unfiltered/home view. This one-question set is still unanswered, so
  // AI-123-12's real confirm prompt appears first.
  await page.locator(".qpv__back").click();
  await expect(page.locator(".qpv-confirm__text")).toContainText("尚有 1 題未完成");
  await page.locator(".qpv-confirm__btn", { hasText: "返回列表" }).click();
  await expect(page.locator(".quiz-practice__row")).toHaveCount(1);
  await expect(page.locator(".quiz-practice__row")).toContainText("PAT-122-03 專屬練習題");

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-122-04：知識弱點左側改為 Question List — 題號/題目/Knowledge Point/難度/錯誤次數/最近錯誤日期，不重複教材名稱", async ({ page }) => {
  const errors = collectErrors(page);
  await gotoWrongbookWithItem(page, {
    id: "wb_1", questionId: "pat122-04-q1", title: "PAT-122-04 教材標題（不應出現在列表列）",
    knowledgePoint: "kp_pat122_04", question: "PAT-122-04 這是題目本身的文字",
    options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
    yourAnswer: "B", correctAnswer: "A"
  });

  const row = page.locator(".wb-row", { hasText: "PAT-122-04 這是題目本身的文字" });
  await expect(row).toBeVisible();
  // 第一行＝題目文字 (not the material title).
  await expect(row.locator(".wb-row__question")).toHaveText("PAT-122-04 這是題目本身的文字");
  await expect(row.locator(".wb-row__index")).toContainText("第");
  // Knowledge Point shown, real value.
  await expect(row.locator(".wb-row__meta")).toContainText("kp_pat122_04");
  // 難度／錯誤次數／最近錯誤日期 all present.
  await expect(row.locator(".wb-row__col--diff")).toBeVisible();
  await expect(row.locator(".wb-row__count")).toContainText("次");
  await expect(row.locator(".wb-row__date")).toBeVisible();
  // 教材名稱 (item.title) must NOT repeat inside the row itself.
  await expect(row).not.toContainText("PAT-122-04 教材標題（不應出現在列表列）");

  // 教材資訊 stays on the right — Detail Panel's own Header.
  await row.click();
  await expect(page.locator(".wb-detail__material")).toContainText("PAT-122-04 教材標題");

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-122-05：Detail Panel Layout — Question List 30% / Detail Panel 70%", async ({ page }) => {
  const errors = collectErrors(page);
  await gotoWrongbookWithItem(page, {
    id: "wb_1", questionId: "pat122-05-q1", title: "PAT-122-05 教材", knowledgePoint: "kp_pat122_05",
    question: "PAT-122-05 題目", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
    yourAnswer: "B", correctAnswer: "A"
  });

  const list = page.locator(".wb-list");
  const detail = page.locator(".wb-detail");
  await expect(list).toBeVisible();
  await expect(detail).toBeVisible();
  const listBox = await list.boundingBox();
  const detailBox = await detail.boundingBox();
  expect(listBox).toBeTruthy();
  expect(detailBox).toBeTruthy();
  // Detail Panel is now the MAIN reading area — real proof: it must be
  // meaningfully wider than the list (≈ 70/30 ⇒ detail ≳ 1.5× list),
  // reversing the old fixed-400px-sidebar layout.
  expect(detailBox.width).toBeGreaterThan(listBox.width * 1.5);

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-122-06：最近新增教材 = 近三日新增教材（CreatedAt >= Today-3Days），0 筆時誠實顯示空狀態", async ({ page }) => {
  const errors = collectErrors(page);

  await seedSession(page, {
    "ahs:materialRuntime": {
      materials: [{
        id: "pat122_06_recent", order: 1, subject: "math", title: "PAT-122-06 近三日教材",
        chapter: "第一章", grade: "高一", category: "課本", date: todayStr(), views: "1", content: "",
        createdAt: todayStr(), progress: 0, lastOpenedAt: null, lastLearningAt: null,
        learningTime: 0, learningCount: 0, favorite: false, fileName: "", fileType: "FILE",
        fileSize: "", folderId: null
      }, {
        id: "pat122_06_old", order: 2, subject: "math", title: "PAT-122-06 十天前教材",
        chapter: "第一章", grade: "高一", category: "課本", date: daysAgoStr(10), views: "1", content: "",
        createdAt: daysAgoStr(10), progress: 0, lastOpenedAt: null, lastLearningAt: null,
        learningTime: 0, learningCount: 0, favorite: false, fileName: "", fileType: "FILE",
        fileSize: "", folderId: null
      }],
      folders: [], seq: 2, folderSeq: 0
    }
  });
  await page.goto(fileUrl("home"));

  const recentSection = page.locator(".recent-materials");
  await expect(recentSection).toContainText("PAT-122-06 近三日教材");
  await expect(recentSection).not.toContainText("PAT-122-06 十天前教材");

  // 教材資料夾 (unfiltered by date) still honestly shows BOTH — proves
  // the 3-day rule is 最近教材's own definition, not a global filter.
  const folderSection = page.locator(".workspace-folder");
  await expect(folderSection).toContainText("PAT-122-06 近三日教材");
  await expect(folderSection).toContainText("PAT-122-06 十天前教材");

  // 0 筆 (only the old material) -> honest empty copy, never the full
  // catalog re-listed.
  await seedSession(page, {
    "ahs:materialRuntime": {
      materials: [{
        id: "pat122_06_old2", order: 1, subject: "math", title: "PAT-122-06 唯一但過期的教材",
        chapter: "第一章", grade: "高一", category: "課本", date: daysAgoStr(30), views: "1", content: "",
        createdAt: daysAgoStr(30), progress: 0, lastOpenedAt: null, lastLearningAt: null,
        learningTime: 0, learningCount: 0, favorite: false, fileName: "", fileType: "FILE",
        fileSize: "", folderId: null
      }],
      folders: [], seq: 1, folderSeq: 0
    }
  });
  await page.goto(fileUrl("home"));
  await expect(page.locator(".recent-materials")).toContainText("目前近三日沒有新增教材");
  await expect(page.locator(".recent-materials")).not.toContainText("PAT-122-06 唯一但過期的教材");

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-122-07：首頁 CTA 一致化 — 教材資料夾「前往考前練習」真實導向 Practice Mode", async ({ page }) => {
  const errors = collectErrors(page);
  await seedSession(page, {
    "ahs:materialRuntime": {
      materials: [{
        id: "pat122_07", order: 1, subject: "math", title: "PAT-122-07 教材",
        chapter: "第一章", grade: "高一", category: "課本", date: todayStr(), views: "1", content: "",
        createdAt: todayStr(), progress: 0, lastOpenedAt: null, lastLearningAt: null,
        learningTime: 0, learningCount: 0, favorite: false, fileName: "", fileType: "FILE",
        fileSize: "", folderId: null
      }],
      folders: [], seq: 1, folderSeq: 0
    }
  });
  await page.goto(fileUrl("home"));

  const folderRow = page.locator(".workspace-folder__material", { hasText: "PAT-122-07 教材" });
  await expect(folderRow).toBeVisible();
  await folderRow.locator(".workspace-folder__link", { hasText: "前往考前練習" }).click();

  await expect(page).toHaveURL(/quiz\.html\?mode=practice&examId=/);
  await expect(page.locator(".qcard")).toHaveCount(0);
  await expect(page.locator(".quiz-practice-root")).not.toHaveAttribute("hidden", "");

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-122-08：首頁資訊排序與單一目的 — 無重複資訊，區塊順序符合 Hero→今日任務→學習成果總覽→最近新增教材→教材資料夾→AI Tutor", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(fileUrl("home"));

  // 首頁不再自動掛載 ReviewWidget（與 學習成效總覽/今日任務 資訊重複）。
  await expect(page.locator(".review-widget")).toHaveCount(0);
  // 單一直向欄位，不再有 main/rail 雙欄。
  await expect(page.locator(".home__rail")).toHaveCount(0);

  const order = await page.evaluate(() => {
    const main = document.querySelector(".home__main");
    const selectors = [
      [".hero-card", "hero"],
      ['[aria-label="今日任務"]', "today"],
      [".home-kpi", "kpi"],
      [".recent-materials", "recent"],
      [".workspace-folder", "folder"],
      [".tutor-card", "tutor"]
    ];
    const found = selectors.map(([sel, name]) => {
      const el = main.querySelector(sel);
      if (!el) { return null; }
      const all = [...main.querySelectorAll("*")];
      return { name, index: all.indexOf(el) };
    }).filter(Boolean);
    found.sort((a, b) => a.index - b.index);
    return found.map((f) => f.name);
  });
  expect(order).toEqual(["hero", "today", "kpi", "recent", "folder", "tutor"]);

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});
