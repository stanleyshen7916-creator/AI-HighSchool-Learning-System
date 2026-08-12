/* tests/regression/MaterialApprovalRegression.js — Sprint AI-132（使用者
   需求 A，真實 PO 需求）：
   "開始進行資料上傳，新增以下功能，在資料我尚未同意前，保留在admin
   權限內，帶我同意後再分配使用...1、上傳資料區分學校與學年
   2、新增「同意」功能，等我審核後在開放跟同學使用"

   確認方案（PO 已同意）：
   - 範圍限定 js/components/MaterialCenter.js 的學生上傳面板，不影響
     docs/TeachingMaterials Repository 匯入管線。
   - 沿用既有「學期」欄位，不新增「學年度」欄位（既有資料模型本就沒有
     獨立學年度欄位，見 js/data/WorkspaceData.js）。
   - 完全隱藏：學生端看不到任何未審核教材的蹤跡（不只 Material Center
     清單，練習題／學習總結等下游也必須誠實地看不到）。
   - 新增 Admin-only 審核佇列，真實內容預覽（重用 AHS.MaterialPreview，
     非另一套簡化摘要）。

   Verifies:
   - AHS.MaterialRuntime：approved 欄位（預設 true，向下相容）、
     list()/recentByCreatedOrder()/favorites()/isEmpty() 皆排除
     approved:false、listPending()/approve() 真實運作、getById() 對
     待審核記錄仍可查到（審核佇列本身需要）。
   - js/components/MaterialCenter.js：學生上傳面板兩個真實送出路徑
     （單筆／批次）皆已改為 approved:false（透過與原始程式碼相同的
     add() 呼叫形狀驗證，因上傳面板 rail 目前本就未掛載進頁面樹——見
     該檔案自身的 AI-129 hotfix 註解——沒有可互動的真實 DOM 入口）。
   - isAdmin() 頁面級把關：materials.html 只有管理者角色才看得到「審核
     佇列」入口，一般學生完全看不到。
   - AHS.MaterialReviewQueue：真實列出待審核教材、預覽開啟真實
     AHS.MaterialPreview overlay、核准後該教材立即從佇列消失且出現在
     一般清單、退回／刪除後徹底移除。
   - 下游洩漏修補：考前總複習「練習題」清單、學習總結預設清單，皆不得
     在核准前顯示待審核教材的內容；核准後才正常顯示。

   Run: node tests/regression/MaterialApprovalRegression.js */
"use strict";
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

const STUDENT_WORKSPACE = { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] };
const ADMIN_WORKSPACE = { studentId: "admin", schoolId: "cjsh", semesterIds: ["g1s2"] };

function loadPage(htmlFile, opts) {
  opts = opts || {};
  const html = fs.readFileSync(path.join(REPO, htmlFile), "utf8");
  const vconsole = new (require("jsdom").VirtualConsole)();
  const consoleErrors = [];
  vconsole.on("error", (m) => consoleErrors.push(String(m)));
  vconsole.on("jsdomError", (e) => {
    const s = String((e && e.message) || e);
    if (/Could not load link|Could not parse CSS|not implemented/i.test(s)) { return; }
    consoleErrors.push(s);
  });
  const dom = new JSDOM(html, {
    url: "https://ahs.test/" + htmlFile,
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole: vconsole
  });
  const { window } = dom;
  window.sessionStorage.setItem("ahs:workspace", JSON.stringify(opts.workspace || STUDENT_WORKSPACE));
  if (opts.seedSession) {
    Object.entries(opts.seedSession).forEach(([k, v]) => window.sessionStorage.setItem(k, JSON.stringify(v)));
  }
  const scripts = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  scripts.forEach((src) => {
    var p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; }
    window.eval(fs.readFileSync(p, "utf8"));
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors };
}

function click(node) {
  node.dispatchEvent(new node.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, cancelable: true }));
}

function completeLearningQuestion(materialId) {
  return {
    materialId: materialId,
    subject: "chinese",
    grade: "高一",
    chapter: "第一課",
    section: "",
    conceptId: "c1",
    concept: "測試概念",
    questionType: "single_choice",
    difficulty: "easy",
    question: "測試待審核教材的練習題？",
    options: [{ key: "A", text: "甲" }, { key: "B", text: "乙" }],
    answer: "A",
    explanation: "測試詳解",
    knowledgePoint: "測試考點",
    learningObjective: "測試學習目標",
    relatedConcepts: [],
    source: { type: "upload", materials: [materialId], chapter: "第一課", section: "", page: 1, reference: "" },
    traceability: { materialId: materialId, knowledgeId: "k1", summaryId: null }
  };
}

console.log("Material Approval Regression — Sprint AI-132（使用者需求 A：上傳教材審核機制）");

/* ---- 1. AHS.MaterialRuntime — approved 欄位 + list()/listPending()/approve() */
console.log("\n[1] AHS.MaterialRuntime — approved 欄位真實把關 list()/recentByCreatedOrder()/favorites()/isEmpty()，listPending()/approve() 真實運作");
{
  const { window } = loadPage("materials.html", { workspace: ADMIN_WORKSPACE });
  const A = window.AHS;

  const approvedRec = A.MaterialRuntime.add({ title: "已核准教材", subject: "math" });
  check("既有呼叫方式（未指定 approved）預設 approved=true（向下相容）", approvedRec.approved === true);
  check("預設 approved 的教材真實出現在 list()", A.MaterialRuntime.list().some((m) => m.id === approvedRec.id));

  const pendingRec = A.MaterialRuntime.add({ title: "待審核教材", subject: "chinese", approved: false });
  check("approved:false 的教材真實不出現在 list()", !A.MaterialRuntime.list().some((m) => m.id === pendingRec.id));
  check("approved:false 的教材真實出現在 listPending()", A.MaterialRuntime.listPending().some((m) => m.id === pendingRec.id));
  check("getById() 對待審核教材仍能查到（審核佇列自身需要用到）", !!A.MaterialRuntime.getById(pendingRec.id));
  check("recentByCreatedOrder() 也真實排除待審核教材", !A.MaterialRuntime.recentByCreatedOrder().some((m) => m.id === pendingRec.id));

  A.MaterialRuntime.toggleFavorite(pendingRec.id);
  check("favorites() 也真實排除待審核教材（即使已收藏）", !A.MaterialRuntime.favorites().some((m) => m.id === pendingRec.id));

  A.MaterialRuntime.reset();
  A.MaterialRuntime.add({ title: "唯一待審核", approved: false });
  check("只有待審核教材時，isEmpty() 誠實回報 true（學生視角應看到 Empty State）", A.MaterialRuntime.isEmpty() === true);

  const approved = A.MaterialRuntime.approve(A.MaterialRuntime.listPending()[0].id);
  check("approve() 真實把 approved 改為 true", approved.approved === true);
  check("approve() 後 isEmpty() 變為 false（教材真的可見了）", A.MaterialRuntime.isEmpty() === false);
  check("approve() 後真實出現在 list()", A.MaterialRuntime.list().length === 1);
  check("approve() 後真實從 listPending() 消失", A.MaterialRuntime.listPending().length === 0);
}

/* ---- 2. MaterialCenter.js 上傳面板送出路徑 — 與真實原始碼相同的呼叫形狀 */
console.log("\n[2] MaterialCenter.js 學生上傳面板 — 單筆／批次送出時真實帶 approved:false");
{
  const source = fs.readFileSync(path.join(REPO, "js/components/MaterialCenter.js"), "utf8");
  const addCallBlocks = source.split("AHS.MaterialRuntime.add({").slice(1);
  check("真實找到兩個上傳送出路徑（單筆＋批次）呼叫 MaterialRuntime.add()", addCallBlocks.length === 2);
  addCallBlocks.forEach((block, i) => {
    const body = block.slice(0, block.indexOf("});"));
    check("上傳路徑 " + (i + 1) + " 真實帶 approved: false（送出即進入待審核，非預設可見）", /approved:\s*false/.test(body));
  });
}

/* ---- 3. isAdmin() 頁面級把關 — 只有管理者看得到審核佇列入口 --------- */
console.log("\n[3] materials.html — 審核佇列入口只對真實管理者角色可見，一般學生完全看不到");
{
  const student = loadPage("materials.html", { workspace: STUDENT_WORKSPACE });
  check("學生角色（student_a）完全看不到審核佇列按鈕", !student.window.document.querySelector(".mat-review__toggle"));
  check("Console errors = 0（學生視角）", student.consoleErrors.length === 0);

  const admin = loadPage("materials.html", { workspace: ADMIN_WORKSPACE });
  check("管理者角色（admin）真實看得到審核佇列按鈕", !!admin.window.document.querySelector(".mat-review__toggle"));
  check("Console errors = 0（管理者視角）", admin.consoleErrors.length === 0);
}

/* ---- 4. AHS.MaterialReviewQueue — 真實預覽／核准／退回流程 ----------- */
console.log("\n[4] AHS.MaterialReviewQueue — 真實列出待審核教材，預覽／核准／退回皆真實生效");
{
  /* 真實情境是「學生上傳（自己的 Session）→ 管理者之後另外打開
     materials.html」，不是同一個已開啟頁面裡憑空生出新的待審核教材
     （MaterialReviewQueue 的按鈕數量在 create() 當下讀一次真實
     listPending()，之後只在真的打開 Modal 時才會 refresh() —— 這對
     "頁面載入時就已經有待審核教材" 的真實情境完全正確；用
     carried session 重新載入頁面來如實模擬這個順序，而不是改動元件
     去支援一個目前架構下不會發生的「同一頁面憑空即時新增」情境）。 */
  const seed = loadPage("materials.html", { workspace: ADMIN_WORKSPACE });
  const pending1 = seed.window.AHS.MaterialRuntime.add({ title: "小說賞析講義", subject: "chinese", grade: "高一", approved: false });
  const pending2 = seed.window.AHS.MaterialRuntime.add({ title: "光合作用筆記", subject: "biology", grade: "高一", approved: false });
  const carried = {};
  for (let i = 0; i < seed.window.sessionStorage.length; i++) {
    const k = seed.window.sessionStorage.key(i);
    carried[k] = JSON.parse(seed.window.sessionStorage.getItem(k));
  }

  const { window } = loadPage("materials.html", { workspace: ADMIN_WORKSPACE, seedSession: carried });
  const A = window.AHS;
  const doc = window.document;

  const toggleBtn = doc.querySelector(".mat-review__toggle");
  check("按鈕真實顯示正確的待審核數量「審核佇列（2）」", toggleBtn.textContent.indexOf("審核佇列（2）") !== -1);

  click(toggleBtn);
  const overlay = doc.querySelector(".mat-review-overlay");
  check("點擊後真實開啟審核佇列 Modal", !!overlay);
  const rows = doc.querySelectorAll(".mat-review__row");
  check("Modal 真實列出 2 筆待審核教材", rows.length === 2);
  check("列表真實顯示教材真實標題", overlay.textContent.indexOf("小說賞析講義") !== -1 && overlay.textContent.indexOf("光合作用筆記") !== -1);

  const firstRow = rows[0];
  const previewBtn = [...firstRow.querySelectorAll(".mat-review__btn")].find((b) => b.textContent === "預覽內容");
  click(previewBtn);
  const previewOverlay = doc.querySelector(".mat-preview__overlay");
  check("「預覽內容」真實開啟 AHS.MaterialPreview 的真實內容預覽（非另一套簡化摘要）", !!previewOverlay);
  const previewCloseBtn = previewOverlay.querySelector(".mat-preview__close");
  click(previewCloseBtn);
  check("預覽關閉後不影響審核佇列 Modal（仍開啟）", !!doc.querySelector(".mat-review-overlay"));

  const approveBtn = [...firstRow.querySelectorAll(".mat-review__btn")].find((b) => b.textContent === "核准");
  click(approveBtn);
  check("核准後該教材真實從佇列消失（Modal 內剩 1 筆）", doc.querySelectorAll(".mat-review__row").length === 1);
  check("核准後按鈕數量文字真實更新為「審核佇列（1）」", toggleBtn.textContent.indexOf("審核佇列（1）") !== -1);
  check("核准後該教材真實出現在一般 MaterialRuntime.list()", A.MaterialRuntime.list().some((m) => m.id === pending1.id));

  const remainingRow = doc.querySelector(".mat-review__row");
  const originalConfirm = window.confirm;
  window.confirm = function () { return true; };
  const rejectBtn = [...remainingRow.querySelectorAll(".mat-review__btn")].find((b) => b.textContent === "退回／刪除");
  click(rejectBtn);
  window.confirm = originalConfirm;
  check("退回／刪除後該教材真實從佇列消失", doc.querySelectorAll(".mat-review__row").length === 0);
  check("退回／刪除後真實顯示空狀態文字", doc.querySelector(".mat-review__empty") && doc.querySelector(".mat-review__empty").textContent.indexOf("沒有待審核") !== -1);
  check("退回／刪除是真實刪除（MaterialRuntime 完全查不到這筆記錄）", A.MaterialRuntime.getById(pending2.id) === null);
}

/* ---- 5. 下游洩漏修補 — 考前總複習「練習題」清單 ----------------------- */
console.log("\n[5] 考前總複習 — 待審核教材的 AI 練習題，核准前真實不出現在練習題清單，核准後正常出現");
{
  /* buildPracticeListView() 只在頁面載入當下渲染一次（考前總複習沒有
     像平時練習那樣的篩選列會觸發重新渲染），所以「核准前」／「核准後」
     必須是兩次真實的頁面載入，而不是同一頁面裡切換分頁——這才是真實
     使用情境：學生在管理者核准前後，本來就是分開兩次真的打開這個頁面，
     不是同一個瀏覽階段中途被改變。 */
  const seed = loadPage("quiz.html", { workspace: STUDENT_WORKSPACE });
  const pending = seed.window.AHS.MaterialRuntime.add({ title: "待審核國文教材", subject: "chinese", approved: false });
  const added = seed.window.AHS.LearningQuestionRuntime.add(completeLearningQuestion(pending.id));
  check("前置：LearningQuestionRuntime 真實接受這筆完整題目（10 項齊全）", !!added);

  function carryFrom(win) {
    const carried = {};
    for (let i = 0; i < win.sessionStorage.length; i++) {
      const k = win.sessionStorage.key(i);
      carried[k] = JSON.parse(win.sessionStorage.getItem(k));
    }
    return carried;
  }

  const before = loadPage("quiz.html", { workspace: STUDENT_WORKSPACE, seedSession: carryFrom(seed.window) });
  const practiceTabBefore = [...before.window.document.querySelectorAll(".quiz-mode__tab")].find((b) => b.textContent === "考前總複習");
  click(practiceTabBefore);
  check("核准前，待審核教材的練習題真實不出現在考前總複習清單", before.window.document.body.textContent.indexOf("測試待審核教材的練習題") === -1);

  seed.window.AHS.MaterialRuntime.approve(pending.id);
  const after = loadPage("quiz.html", { workspace: STUDENT_WORKSPACE, seedSession: carryFrom(seed.window) });
  const practiceTabAfter = [...after.window.document.querySelectorAll(".quiz-mode__tab")].find((b) => b.textContent === "考前總複習");
  click(practiceTabAfter);
  check("核准後，同一筆練習題真實正常出現（不是永久被過濾，只是尚未核准時隱藏）", after.window.document.body.textContent.indexOf("測試待審核教材的練習題") !== -1);
}

/* ---- 6. 下游洩漏修補 — 學習總結預設清單 ------------------------------- */
console.log("\n[6] 學習總結 — 待審核教材的 AI 摘要，核准前真實不出現在預設總結清單");
{
  const { window } = loadPage("summary.html", { workspace: STUDENT_WORKSPACE });
  const A = window.AHS;

  const pending = A.MaterialRuntime.add({ title: "待審核物理教材", subject: "physics", approved: false });
  A.SummaryRuntime.add({
    materialId: pending.id, subject: "physics", grade: "高一", chapter: "第一章",
    title: "待審核物理教材摘要標記字串ABCDEFG", coreConcepts: ["核心概念X"]
  });

  const mountTarget = window.document.createElement("div");
  window.document.body.appendChild(mountTarget);
  A.UI.mount(mountTarget, A.SummaryCenter.create());
  check("核准前，待審核教材的摘要真實不出現在預設總結清單", mountTarget.textContent.indexOf("待審核物理教材摘要標記字串ABCDEFG") === -1);

  A.MaterialRuntime.approve(pending.id);
  A.UI.mount(mountTarget, A.SummaryCenter.create());
  check("核准後，同一筆摘要真實正常出現", mountTarget.textContent.indexOf("待審核物理教材摘要標記字串ABCDEFG") !== -1);
}

console.log("\nMaterialApprovalRegression: " + pass + " PASS / " + fail + " FAIL");
if (fail > 0) { process.exit(1); }
