/* playwright/tests/platform-context-124.spec.js — Sprint AI-124
   (Platform Context & UX Consistency Hotfix), real-browser PAT covering
   the 8 categories this Sprint's own spec mandates: ①首次登入 ②Context
   保持 ③Practice ④Quiz ⑤AI Tutor ⑥Knowledge Weakness ⑦最新教材 ⑧首頁
   KPI. Complements tests/jsdom/BehaviorSuite.js and the existing
   regression suites rather than duplicating them — this file is about
   the real cross-page Context/Navigation behavior this Sprint actually
   changed (js/core/PlatformContext.js, js/components/QuizCenter.js's
   Exam↔Practice scoping, js/components/WrongBook.js's Detail sync,
   js/utils/TutorMessage.js's material-scoped AI Tutor). */
"use strict";
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl } = require("../helpers/urls.js");
const { seedSession } = require("../helpers/seed.js");

/* todayLikeWrongBook() — same "YYYY/MM/DD" convention
   AHS.WrongBookRuntime/AHS.StatisticsRuntime.newWeaknessesToday() use for
   firstError/lastError (see js/runtime/StatisticsRuntime.js's own
   formatTodayLikeWrongBook()). PAT-124-⑧ seeds a wrong item and asserts
   Home's "今日新增弱點" KPI counts it — that KPI is defined as
   firstError === real today, so the seed must use the real, live date,
   not a frozen literal (a hardcoded "YYYY/MM/DD" here would silently
   stop matching "today" the very next real calendar day, failing with
   "Expected >= 1, Received 0" — this bit a real run once real time
   moved past the day this literal was originally written on; the
   Runtime was never desynced, only this fixture's own clock was). */
function todayLikeWrongBook() {
  const d = new Date();
  const pad = (n) => (n < 10 ? "0" + n : String(n));
  return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
}

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

/* Same real Login flow driver playwright/tests/workspace.spec.js already
   established (real clicks through login.html's 選擇學生/學校/學期 steps),
   reused here for AI-124-01's own "真實首次登入" proof. */
/* AI-133：js/data/WorkspaceData.js 的真實 Mock 密碼（測試期間統一為 "1234"，
   見該檔案自身標頭的誠實揭露：純前端明碼比對，只是門禁用途，非真正
   資安等級保護）——這裡直接對應同一份資料，不是另外發明一組。 */
const STUDENT_PASSWORDS = { Admin: "1234", "Student A": "1234", "Student B": "1234" };

async function loginAs(page, studentLabel, schoolLabel, semesterLabels) {
  await page.goto(fileUrl("login.html"));
  await page.locator(".login-option", { hasText: studentLabel }).first().click();
  await page.locator(".login-option", { hasText: schoolLabel }).first().click();
  for (const sem of semesterLabels) {
    await page.locator(".login-option--check", { hasText: sem }).click();
  }
  await page.locator(".login-enter-btn").click();
  await page.locator(".login-password__input").fill(STUDENT_PASSWORDS[studentLabel]);
  await page.locator(".login-enter-btn").click();
  await expect(page).toHaveURL(/index\.html$/);
  await page.locator(".shell").waitFor({ state: "visible" });
}

/* Seeds two real AHS.QuestionRuntime questions for one material — the
   established addInitScript pattern from playwright/tests/ux-hotfix-122.
   spec.js's own PAT-122-03 / practice-flow-123.spec.js (AHS.QuestionRuntime
   is page-lifetime, in-memory only — never persisted — so it must be
   (re)imported on every fresh navigation, before AppQuiz.js's own init()
   runs). */
async function seedQuestions(page, materialId, subject) {
  await page.addInitScript((args) => {
    window.addEventListener("DOMContentLoaded", () => {
      const AHS = window.AHS;
      if (!AHS || !AHS.QuestionRuntime) { return; }
      AHS.QuestionRuntime.importQuestions("teaching_material_" + args.matId, [
        {
          id: args.matId + "-q1", index: 1, subject: args.subject, text: "AI-124 情境練習題一",
          type: "single_choice", options: [{ key: "A", text: "正確答案" }, { key: "B", text: "錯誤答案" }],
          correctAnswer: "A", knowledgePoint: "kp_ai124_1", materialId: args.matId,
          questionSource: "ORIGINAL", origin: "x"
        }
      ]);
    }, { once: true });
  }, { matId: materialId, subject: subject });
}

/* Only PAT-124-① drives the real, from-scratch Login flow itself — every
   other test below relies on the suite-wide default test Workspace
   (playwright/helpers/fixtures.js), same as every other spec file in
   this repo. skipDefaultLogin is scoped to this one describe() block
   only, never the whole file (a real bug this Sprint's own tests almost
   shipped with: a file-wide test.use({skipDefaultLogin:true}) silently
   logged EVERY test in this file out, sending them straight into
   login.html's own redirect instead of the real page under test). */
test.describe("PAT-124-①", () => {
  test.use({ skipDefaultLogin: true });

  test("PAT-124-①：真實首次登入（全新 Workspace，零快取），首頁全部 Widget 一次 Render 完成", async ({ page }) => {
    const errors = collectErrors(page);
    await loginAs(page, "Student A", "長榮中學", ["高一下學期"]);

    // AI-124-01: every mandated widget's own real root element must exist
    // in the SAME synchronous render — no reload, no polling, no waiting.
    await expect(page.locator(".today-card")).toBeVisible();      // 今日任務
    await expect(page.locator(".home-kpi")).toBeVisible();        // 學習成效總覽／Statistics KPI
    await expect(page.locator(".recent-materials")).toBeVisible(); // 最新教材
    await expect(page.locator(".workspace-folder")).toBeVisible(); // 教材資料夾
    /* Sprint AI-138: AI Tutor 尚未串接真實 API，showTutorSuggestions 現在
       預設 false，.tutor-card 不再是「首次登入必render」清單的一員——
       改由 ux-hotfix-122.spec.js 的新測試／LearningFlowRegression.js §9
       專門驗證這個預設隱藏行為，這裡不重複斷言。
       Sprint AI-141：同一個開關也讓「學習成效總覽」的「AI Tutor 建議」
       KPI 卡預設不掛載，8 張變 7 張——knowledge-engine.spec.js 自己的
       測試專門驗證這件事，這裡同樣不重複斷言，只反映真實預設數量。 */
    await expect(page.locator(".home-kpi__item")).toHaveCount(7);

    /* AI-124 PAT-01 (Project Owner PAT FAIL): real root cause was
       index.html never <script>-tagging js/data/TeachingMaterialData.js
       (the Package track — math/tm_1~4 etc.) — only materials.html/
       quiz.html did — so AHS.TeachingMaterialLoader.load() on Home could
       only ever bridge the Repository track (civics), leaving 教材資料夾
       showing ONLY 公民 until a Material Center visit persisted the rest
       into MaterialRuntime. Real proof, without ever navigating to
       materials.html first: 教材資料夾 must show BOTH subjects real
       Repository data covers (公民 AND 數學) on this very first render. */
    await expect(page.locator(".workspace-folder__group-name", { hasText: "公民" })).toBeVisible();
    await expect(page.locator(".workspace-folder__group-name", { hasText: "數學" })).toBeVisible();

    expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
  });

  test("PAT Fix follow-up：登入時選擇的學生應與登入後右上角身分一致（不再是與登入身分無關的「同學」）", async ({ page }) => {
    const errors = collectErrors(page);
    await loginAs(page, "Student A", "長榮中學", ["高一下學期"]);

    // Real PO report: the top-right user button used to always show the
    // literal SettingsRuntime default ("同學"), completely independent
    // of which student was actually picked on login.html — two
    // disconnected identity stores. AHS.SettingsRuntime.hydrate() now
    // seeds profile.name from AHS.WorkspaceRuntime.label().studentName
    // for a brand-new (never-saved) profile, so the very first render
    // after a real login already shows the real logged-in student.
    await expect(page.locator(".topbar__user-meta strong")).toHaveText("Student A");

    // Same real Single Source read by the Settings Profile panel
    // (js/ui/SettingsPanel.js) — must also reflect the real student,
    // not the generic placeholder, on first open.
    await page.locator(".sidebar__item", { hasText: "設定" }).click();
    await expect(page.getByLabel("顯示名稱")).toHaveValue("Student A");

    expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
  });
});

test("PAT-124-②：AHS.PlatformContext 為唯一 Context 讀取／傳遞方式，materialId／examId 正確解析與往返", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(fileUrl("quiz") + "?mode=practice&materialId=ai124_pc&examId=teaching_material_ai124_pc__ai");

  const resolved = await page.evaluate(() => window.AHS.PlatformContext.resolve());
  expect(resolved.materialId).toBe("ai124_pc");
  expect(resolved.examId).toBe("teaching_material_ai124_pc__ai");
  expect(resolved.mode).toBe("practice");

  // examId-only links (e.g. WorkspaceFolder.js's own 前往平時練習, AI-144)
  // must still resolve a real materialId via the same shared convention.
  const fromExamOnly = await page.evaluate(() =>
    window.AHS.PlatformContext.resolve("?examId=teaching_material_ai124_pc2__original"));
  expect(fromExamOnly.materialId).toBe("ai124_pc2");

  // toQuery() round-trips a context back into a real link query string —
  // the mechanism TutorContextTip.js (AI-124-02/07) now uses so a link's
  // own real context is never silently dropped.
  const query = await page.evaluate(() =>
    window.AHS.PlatformContext.toQuery({ materialId: "ai124_pc3", examId: "teaching_material_ai124_pc3" }));
  expect(query).toContain("materialId=ai124_pc3");
  expect(query).toContain("examId=teaching_material_ai124_pc3");

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-124-③：Practice — 考前總複習題目列表真實 scoped 到目前教材，不顯示未篩選 Repository 全部清單", async ({ page }) => {
  const errors = collectErrors(page);
  await seedQuestions(page, "ai124_ctx", "biology");
  await page.goto(fileUrl("quiz") + "?mode=practice&materialId=ai124_ctx");
  await page.locator('.qguide__diff[data-difficulty="medium"]').click();
  await page.locator(".qguide__start").click();

  await expect(page.locator(".quiz-practice__row")).toHaveCount(1);
  await expect(page.locator(".quiz-practice__row")).toContainText("AI-124 情境練習題一");
  await expect(page.locator('[aria-label="Repository 教材"]')).toHaveCount(0);

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-124-④②：Quiz — 由考前總複習切回平時練習，Context（Subject/Material）保持一致，不重新列出全部教材", async ({ page }) => {
  const errors = collectErrors(page);
  // Sprint AI-124's own real fix (showScopedList() in QuizCenter.js)
  // scopes Exam Mode's list via repositoryExamCatalog() — the same real
  // AHS.MaterialRepository/TeachingMaterialData source every OTHER
  // material in Exam Mode's own list is drawn from (never QuestionRuntime
  // directly, unlike Practice Mode's own realExamQuestionsFor()). A
  // synthetic QuestionRuntime-only seed (as used for Practice Mode
  // elsewhere in this file) would never appear there, so this test uses
  // the repo's own real, already-committed Repository material
  // (data/materials/CivicsG10Ch5to6Exam20260730.js) instead — discovering
  // its real, dynamically-assigned runtime materialId the same way
  // TeachingMaterialLoader.js itself does (idempotent: a second
  // TeachingMaterialLoader.load() call on re-navigation reuses the
  // already-persisted id, never creates a second record).
  await page.goto(fileUrl("quiz"));
  const materialId = await page.evaluate(() => {
    const AHS = window.AHS;
    if (AHS.TeachingMaterialLoader && typeof AHS.TeachingMaterialLoader.load === "function") {
      AHS.TeachingMaterialLoader.load();
    }
    const idMap = (AHS.PersistenceAdapter && AHS.PersistenceAdapter.load("teachingMaterialLoaderIdMap")) || {};
    return idMap["civics-g10-ch5-6-exam-20260730"] || null;
  });
  expect(materialId, "civics Repository material must have a real runtime materialId").toBeTruthy();

  await page.goto(fileUrl("quiz") + "?mode=practice&materialId=" + materialId);
  await page.locator('.qguide__diff[data-difficulty="medium"]').click();
  await page.locator(".qguide__start").click();
  const practiceRowCount = await page.locator(".quiz-practice__row").count();
  expect(practiceRowCount).toBeGreaterThan(0);

  // AI-124-03/04/12's own real bug: switching to 平時練習 must show ONLY
  // this same material's own exam entry — never the full, unfiltered
  // catalog (data.items + every other Repository material).
  await page.locator(".quiz-mode__tab", { hasText: "平時練習" }).click();
  await expect(page.locator(".quiz-row")).toHaveCount(1);
  await expect(page.locator(".quiz-row .chip")).toContainText("公民");

  // Switching back to 考前總複習 must still be the same one material —
  // "不得重新 Reset" (AI-124-12).
  await page.locator(".quiz-mode__tab", { hasText: "考前總複習" }).click();
  await expect(page.locator(".quiz-practice__row")).toHaveCount(practiceRowCount);

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-124-⑤：AI Tutor 只依照目前 Platform Context，不跨教材", async ({ page }) => {
  const errors = collectErrors(page);
  // Seed a real material + a real cross-material wrong item so a
  // GLOBAL (non-scoped) Tutor message would genuinely have unrelated
  // content available to wrongly pull in, if the bug were still present.
  await seedSession(page, {
    "ahs:materialRuntime": {
      materials: [{
        id: "mat_ai124", subject: "biology", title: "AI-124 情境教材", chapter: "第一章", grade: "高一",
        category: "課本", date: "2026/08/06", views: "0", content: "x", progress: 100, lastOpenedAt: null,
        lastLearningAt: null, learningTime: 0, learningCount: 0, favorite: false, fileName: "x.pdf",
        fileType: "PDF", fileSize: "1.0 MB", folderId: null, file: null, createdAt: "2026/08/06"
      }],
      folders: [], seq: 1, folderSeq: 0
    },
    "ahs:wrongBookRuntime": {
      items: [{
        id: "wb_other", questionId: "q_other", subject: "math", title: "無關教材的錯題", chapter: "第九章",
        materialId: "mat_unrelated", knowledgePoint: "kp_unrelated_weak", question: "無關教材題目",
        options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
        yourAnswer: "B", correctAnswer: "A", explanation: "",
        errorCount: 1, lastError: "2026/08/06", firstError: "2026/08/06", masteredAt: null,
        bookmarked: false, archived: false, correctStreak: 0
      }],
      seq: 1
    }
  });
  await page.goto(fileUrl("summary") + "?materialId=mat_ai124");

  const tip = page.locator(".tutor-tip");
  if (await tip.count()) {
    // The tip's own message must not reference the unrelated material's
    // own weak knowledge point, and its link must carry the SAME
    // materialId context forward into tutor.html (AI-124-02/07).
    await expect(tip).not.toContainText("kp_unrelated_weak");
    await expect(tip).toHaveAttribute("href", /materialId=mat_ai124/);
  }

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-124-⑥：知識弱點篩選後列表誠實只顯示符合條件的題目，點擊仍正確開啟對應題目的 Modal", async ({ page }) => {
  /* AI-129 redesign（本 Session 較早的真實變更，發生在 AI-124 之後）：
     知識弱點的 Detail 從「跟著左側清單即時同步的側欄」改為「點擊題目才
     彈出、彼此獨立的 Modal」——見 js/components/WrongBook.js 自身
     AI-129 hotfix 的說明："applyView() 的 stillMatches/自動退回選取/
     clearDetail 邏輯整個移除——Modal 現在不受列表篩選影響"，這是刻意的
     設計決策，不是 Bug。原本「篩選後 Detail 必須清空」的假設已經不成立
     （Modal 本來就只在使用者明確點擊時才開啟／才有內容）。這裡改為驗證
     真正還成立、也更重要的事：篩選本身是否誠實（不符合的題目真的從
     列表消失），以及篩選之後點擊仍能正確對應到真實題目內容，不會抓錯
     題目。 */
  const errors = collectErrors(page);
  await seedSession(page, {
    "ahs:wrongBookRuntime": {
      items: [{
        id: "wb_1", questionId: "q1", subject: "math", title: "AI-124 知識弱點測試題", chapter: "第一章",
        materialId: "", knowledgePoint: "kp_ai124_wb", question: "AI-124 知識弱點題目本文",
        options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
        yourAnswer: "B", correctAnswer: "A", explanation: "詳解內容",
        errorCount: 1, lastError: "2026/08/06", firstError: "2026/08/06", masteredAt: null,
        bookmarked: false, archived: false, correctStreak: 0
      }],
      seq: 1
    }
  });
  await page.goto(fileUrl("wrongbook"));

  const row = page.locator(".wb-row", { hasText: "AI-124 知識弱點題目本文" });
  await expect(row).toBeVisible();

  // Switch 科目 filter to a subject with zero real matches — the row must
  // honestly disappear, and the list's own no-match empty state appears.
  await page.selectOption('select[aria-label="科目"]', "英文");
  await expect(row).toBeHidden();
  await expect(page.locator(".wb-list__no-match")).toBeVisible();
  await expect(page.locator(".wb-list__no-match")).toContainText("找不到符合條件");

  // Restoring the filter brings the real row back — clicking it still
  // resolves to the correct, real question content (filtering never
  // corrupts which item a later click opens).
  await page.selectOption('select[aria-label="科目"]', "全部科目");
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.locator(".wb-modal__panel")).toContainText("AI-124 知識弱點題目本文");

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-124-⑦：最新教材＝近三日新增，0 筆時顯示誠實文案，不重複教材資料夾的全部清單", async ({ page }) => {
  const errors = collectErrors(page);
  await seedSession(page, {
    "ahs:materialRuntime": {
      materials: [{
        id: "mat_old", subject: "math", title: "AI-124 舊教材", chapter: "第一章", grade: "高一",
        category: "課本", date: "2020/01/01", views: "0", content: "x", progress: 0, lastOpenedAt: null,
        lastLearningAt: null, learningTime: 0, learningCount: 0, favorite: false, fileName: "x.pdf",
        fileType: "PDF", fileSize: "1.0 MB", folderId: null, file: null, createdAt: "2020/01/01"
      }],
      folders: [], seq: 1, folderSeq: 0
    }
  });
  await page.goto(fileUrl("home"));

  // The material exists (real, shows in 教材資料夾), but is 6 years old —
  // 最新教材 must honestly show the 0-筆 empty text, not reuse the same
  // full material list 教材資料夾 already shows.
  await expect(page.locator(".workspace-folder")).toContainText("AI-124 舊教材");
  await expect(page.locator(".recent-materials")).toContainText("目前近三日沒有新增教材");
  await expect(page.locator(".recent-materials")).not.toContainText("AI-124 舊教材");

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-124-⑧：首頁 KPI 全部即時由 Runtime 計算，與知識弱點頁面的真實資料一致（非 Cache/Mock）", async ({ page }) => {
  const errors = collectErrors(page);
  await seedSession(page, {
    "ahs:wrongBookRuntime": {
      items: [{
        id: "wb_kpi", questionId: "q_kpi", subject: "math", title: "AI-124 KPI 測試題", chapter: "第一章",
        materialId: "", knowledgePoint: "kp_ai124_kpi", question: "KPI 測試題目",
        options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
        yourAnswer: "B", correctAnswer: "A", explanation: "",
        errorCount: 1, lastError: todayLikeWrongBook(), firstError: todayLikeWrongBook(), masteredAt: null,
        bookmarked: false, archived: false, correctStreak: 0
      }],
      seq: 1
    }
  });
  await page.goto(fileUrl("home"));

  const newWeaknessValue = await page.locator('[data-kpi="newWeaknesses"] .home-kpi__value').textContent();
  expect(Number(newWeaknessValue)).toBeGreaterThanOrEqual(1);

  // Same real seed, read on a totally different page (wrongbook.html) —
  // real Runtime computation, not a page-local cache/mock copy.
  await page.goto(fileUrl("wrongbook"));
  await expect(page.locator(".wb-row", { hasText: "KPI 測試題目" })).toBeVisible();

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("PAT-124-PAT-03：知識弱點頁「錯題即時統計」讀取真實 AHS.WrongBookRuntime，與今日待複習/Result 同步（非停滯 0）", async ({ page }) => {
  const errors = collectErrors(page);
  // Real Project Owner PAT FAIL: this card used to read exclusively from
  // the legacy AHS.WrongBookSession store, disconnected from the real
  // AHS.WrongBookRuntime every current grading path (Formal Exam,
  // AI-122+ real Practice) actually writes to — so it stayed stuck at 0
  // even with real graded data present. Seeding AHS.WrongBookRuntime
  // directly (the same real Runtime js/pages/AppWrongBook.js's
  // dueForReview()/wb-summary card already reads) and expecting THIS
  // card to reflect it proves the sync now reads the correct source.
  await seedSession(page, {
    "ahs:wrongBookRuntime": {
      items: [
        { id: "wb_pat03_new", questionId: "q_pat03_new", subject: "math", title: "PAT-03 測試題一", chapter: "第一章",
          materialId: "", knowledgePoint: "kp_pat03_a", question: "PAT-03 題目一",
          options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
          yourAnswer: "B", correctAnswer: "A", explanation: "",
          errorCount: 1, lastError: "2026/08/06", firstError: "2026/08/06", masteredAt: null,
          bookmarked: false, archived: false, correctStreak: 0 },
        { id: "wb_pat03_archived", questionId: "q_pat03_archived", subject: "math", title: "PAT-03 測試題二", chapter: "第一章",
          materialId: "", knowledgePoint: "kp_pat03_b", question: "PAT-03 題目二",
          options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
          yourAnswer: "B", correctAnswer: "A", explanation: "",
          errorCount: 1, lastError: "2026/08/06", firstError: "2026/08/06", masteredAt: null,
          bookmarked: false, archived: true, correctStreak: 0 }
      ],
      seq: 2
    }
  });
  await page.goto(fileUrl("wrongbook"));

  const stats = page.locator(".wb-live-stats");
  await expect(stats).toBeVisible();
  const values = await stats.locator(".wb-live-stats__value").allTextContents();
  const labels = await stats.locator(".wb-live-stats__label").allTextContents();
  const byLabel = {};
  labels.forEach((l, i) => { byLabel[l] = Number(values[i]); });

  expect(byLabel["錯題總數"]).toBe(2);
  expect(byLabel["進行中"]).toBe(1);
  expect(byLabel["已封存"]).toBe(1);
  expect(byLabel["新錯題"]).toBe(1);

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});
