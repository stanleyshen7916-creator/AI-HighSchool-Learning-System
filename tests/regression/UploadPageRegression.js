/* tests/regression/UploadPageRegression.js — 2026-09-29 教材上傳併入學習平台.

   upload.html against a fake 教材上傳引擎 (window.fetch stub that
   records every request):
   - 學生：Sidebar 沒有「教材上傳」，頁面只顯示僅限管理者，且完全不呼叫引擎。
   - Admin：Sidebar 出現「教材上傳」；引擎狀態顯示已連線。
   - 完整流程：三方初稿 → 交叉審議 job → Final → 建立草稿（送出平台的學校/
     學期/科目代碼與上傳批次）→ 預覽題目與答案 → 發布 → 顯示 git 指令。
   - 既有 Final.md：frontmatter 帶入步驟 1；預覽可修改並存回引擎（2026-10-04）。
   - 引擎沒啟動時顯示明確的啟動提示，不拋錯。

   Run: node tests/regression/UploadPageRegression.js */
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

const FINAL = "長榮中學_高二_數學_第一章_課本_Final.md";
const OLD_FINAL = "竹圍高中_高二_化學_化學_第三章_課本_Final.md";
const OLD_FINAL_CONTENT = "---\nschool: 竹圍高中\ngrade: 高二\nsubject: 化學\nunit: 化學 第三章\ncategory: 課本\nquality_gate: \"PENDING_MANUAL_REVIEW\"\n---\n\n# 化學 第三章 Final\n";
const DRAFT = {
  materialId: "tm_18", status: "draft", stage: "ANALYZING", qualityGate: "PASS",
  warnings: ["Q3：找不到答案或答案不在選項中，未收錄"],
  metadata: { subject: "數學", grade: "高二", chapter: "第一章" },
  summary: { coreConcepts: ["弧度的定義"], keywords: [], keyPoints: [], pitfalls: [], reviewSuggestions: [] },
  questions: [{ question: "5π/6 弳是幾度？", options: ["120°", "150°"], answer: "150°", explanation: "乘以 180/π" }],
  sourceFiles: [FINAL, "課本.pdf"]
};

function fakeEngine(window, log, mode) {
  function reply(status, body) {
    const text = JSON.stringify(body);
    return Promise.resolve({ ok: status < 300, status: status, text: () => Promise.resolve(text) });
  }
  return function (url, init) {
    const method = (init && init.method) || "GET";
    const body = init && typeof init.body === "string" ? JSON.parse(init.body) : null;
    log.push({ url: String(url), method: method, body: body });
    if (mode === "down") { return Promise.reject(new window.Error("connection refused")); }
    const u = String(url).replace(/^https?:\/\/[^/]+/, "");
    if (u === "/api/health") { return reply(200, { engine: "ahs-council", version: "1.1.0", mineru: true, ollama: true }); }
    if (u === "/api/catalog") { return reply(200, { items: [{ filename: OLD_FINAL, qualityGate: "PENDING_MANUAL_REVIEW" }] }); }
    if (u.indexOf("/api/finals/") === 0 && method === "PUT") {
      const name = decodeURIComponent(u.slice("/api/finals/".length));
      return reply(200, { filename: name, content: body.content, backup: name + ".orig" });
    }
    if (u === "/api/finals/" + encodeURIComponent(OLD_FINAL)) { return reply(200, { filename: OLD_FINAL, content: OLD_FINAL_CONTENT }); }
    if (u.indexOf("/api/finals/") === 0) { return reply(200, { filename: FINAL, content: "# Final" }); }
    if (u === "/api/assemble-council/jobs" && method === "POST") { return reply(202, { jobId: "job-1", status: "running" }); }
    if (u === "/api/assemble-council/jobs/job-1") {
      return reply(200, { status: "completed", result: { filename: FINAL, catalogEntry: { qualityGate: "PASS", finalScore: 98 } } });
    }
    if (u === "/api/platform/drafts" && method === "GET") { return reply(200, { drafts: [] }); }
    if (u === "/api/platform/drafts" && method === "POST") { return reply(201, DRAFT); }
    if (u === "/api/platform/drafts/tm_18/publish") {
      return reply(200, Object.assign({}, DRAFT, {
        status: "published", stage: "IMPORTED",
        changedPaths: ["docs/TeachingMaterials/materials/tm_18/", "js/data/TeachingMaterialData.js"]
      }));
    }
    if (u.indexOf("/api/materials/") === 0) { return reply(200, { count: 0, images: [] }); }
    /* 2026-10-01 為既有教材加題 */
    if (u === "/api/platform/supplements/parents") {
      return reply(200, { materials: [{ materialId: "tm_7", semester: "g2s1", subject: "數學", chapter: "第1章：三角函數", questionCount: 23, supplementCount: 0 }] });
    }
    if (u === "/api/platform/supplements/author-prompt") {
      return reply(200, { parentId: "tm_7", count: body.count, difficulty: body.difficulty, existingCount: 23, prompt: "出題 PROMPT" });
    }
    if (u === "/api/platform/supplements/solver-prompt") { return reply(200, { count: 3, numbers: [1, 2, 3], warnings: [], prompt: "作答 PROMPT" }); }
    if (u === "/api/platform/supplements/check") {
      const q = (n, status, reasons) => ({ number: n, question: "題目 " + n, options: ["a", "b", "c", "d"], answer: "b", answerKey: "B",
        explanation: "詳解 " + n, knowledgePoint: "弧長", difficulty: "易", solverAnswers: [{ id: "claude-fresh", name: "Claude（新對話）", key: "B" }], status, reasons });
      return reply(200, { parentId: "tm_7", counts: { ok: 1, review: 1, duplicate: 1 }, warnings: [], questions: [
        q(1, "ok", []), q(2, "review", ["Claude（新對話）答 C，出題答案為 B"]), q(3, "duplicate", ["與既有題目 tm_7_q3 重複"])] });
    }
    if (u === "/api/platform/supplements/drafts") {
      return reply(201, Object.assign({}, DRAFT, { materialId: "tm_19", kind: "supplement", supplementOf: "tm_7", warnings: [],
        questions: [{ question: "題目 1", options: ["a", "b", "c", "d"], answer: "b", explanation: "詳解 1", knowledgePoint: "弧長", difficulty: "易" }] }));
    }
    return reply(404, { error: "not found" });
  };
}

function loadUpload(studentId, mode) {
  const html = fs.readFileSync(path.join(REPO, "upload.html"), "utf8");
  const vconsole = new (require("jsdom").VirtualConsole)();
  const consoleErrors = [];
  vconsole.on("error", (m) => consoleErrors.push(String(m)));
  vconsole.on("jsdomError", (e) => {
    const s = String((e && e.message) || e);
    if (/Could not load link|Could not parse CSS|not implemented/i.test(s)) { return; }
    consoleErrors.push(s);
  });
  const dom = new JSDOM(html, { url: "https://ahs.test/upload.html", runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vconsole });
  const { window } = dom;
  const log = [];
  window.fetch = fakeEngine(window, log, mode);
  window.confirm = () => true;
  window.sessionStorage.setItem("ahs:workspace", JSON.stringify({ studentId: studentId, schoolId: "cjsh", semesterIds: ["g2s1"] }));
  [...window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src")).forEach((src) => {
    const p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; }
    window.eval(fs.readFileSync(p, "utf8"));
    /* engine I/O only: keep the committed Supabase config out of the way */
    if (/^js\/data\/SupabaseConfig(\.local)?\.js$/.test(src)) {
      window.AHS.SupabaseConfig = { url: "", anonKey: "" };
      window.AHS.SupabaseConfigLocal = null;
    }
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, doc: window.document, log, consoleErrors };
}

function settle() { return new Promise((r) => setTimeout(r, 30)); }
function click(node) { node.dispatchEvent(new node.ownerDocument.defaultView.MouseEvent("click", { bubbles: true })); }
function buttonByText(doc, text) { return [...doc.querySelectorAll("button")].find((b) => b.textContent.trim() === text); }
function fieldByLabel(doc, label) {
  const f = [...doc.querySelectorAll(".upl-field")].find((x) => x.querySelector(".upl-field__label").textContent === label);
  return f && f.querySelector("input, select, textarea");
}
function sidebarLabels(doc) { return [...doc.querySelectorAll(".sidebar__label")].map((n) => n.textContent); }

async function main() {
  console.log("Upload Page Regression — 教材上傳（Admin only）");

  console.log("\n[1] 學生帳號：看不到入口，頁面只顯示僅限管理者，不呼叫引擎");
  {
    const { doc, log, consoleErrors } = loadUpload("student_a");
    await settle();
    check("Sidebar 沒有「教材上傳」", sidebarLabels(doc).indexOf("教材上傳") === -1);
    check("顯示「僅限管理者」", doc.body.textContent.indexOf("此頁僅限管理者使用") !== -1);
    check("沒有任何上傳表單", !doc.querySelector(".upl-textarea"));
    check("完全沒有呼叫引擎", log.length === 0);
    check("Console errors = 0", consoleErrors.length === 0);
  }

  console.log("\n[2] Admin：入口與引擎狀態");
  const { window, doc, log, consoleErrors } = loadUpload("admin");
  await settle();
  check("Sidebar 出現「教材上傳」", sidebarLabels(doc).indexOf("教材上傳") !== -1);
  const visibleCards = () => [...doc.querySelectorAll(".upl-card")].filter((c) => !c.hasAttribute("hidden"));
  check("上傳新教材：七個區塊（引擎＋步驟 1～5＋草稿預覽與發布）", visibleCards().length === 7);
  check("預設不呼叫加題端點", !log.some((c) => c.url.indexOf("/supplements/") !== -1));
  check("引擎狀態顯示已連線", doc.body.textContent.indexOf("已連線（引擎 v1.1.0）") !== -1);
  check("學校選單來自平台資料（長榮中學 cjsh）", [...fieldByLabel(doc, "學校").options].some((o) => o.value === "cjsh" && o.textContent === "長榮中學"));
  check("科目選單含平台所有科目（含地球科學）", [...fieldByLabel(doc, "科目").options].some((o) => o.value === "地球科學"));
  check("教材類型不提供「考卷」（AI 出題不能標為原題考卷）", [...fieldByLabel(doc, "教材類型").options].every((o) => o.value !== "EXAM"));

  console.log("\n[3] 未填必要欄位時不送出");
  click(buttonByText(doc, "執行三方交叉審議"));
  await settle();
  check("未填章節：提示且不建立 job", doc.body.textContent.indexOf("請先在步驟 1 填寫章節") !== -1 && !log.some((c) => c.url.indexOf("/jobs") !== -1));
  click(buttonByText(doc, "建立教材包草稿"));
  await settle();
  check("沒有 Final：提示且不建立草稿", !log.some((c) => c.method === "POST" && /\/api\/platform\/drafts$/.test(c.url)));

  console.log("\n[4] 審議 → 建立草稿 → 預覽");
  fieldByLabel(doc, "科目").value = "數學";
  fieldByLabel(doc, "章節").value = "第一章";
  fieldByLabel(doc, "ChatGPT (Web)").value = "①核心概念\nA";
  fieldByLabel(doc, "Gemini (Web)").value = "①核心概念\nB";
  fieldByLabel(doc, "Claude (Web)").value = "①核心概念\nC";
  click(buttonByText(doc, "執行三方交叉審議"));
  await settle();
  const job = log.find((c) => c.method === "POST" && /\/api\/assemble-council\/jobs$/.test(c.url));
  check("送出審議 job，含三方初稿與 Council 用的學校名稱", !!job && job.body.school === "長榮中學" && job.body.drafts.claude === "①核心概念\nC" && job.body.unit === "第一章");
  check("審議完成後顯示 Final 檔名與 Quality Gate", doc.body.textContent.indexOf(FINAL) !== -1 && doc.body.textContent.indexOf("PASS · 98") !== -1);

  click(buttonByText(doc, "建立教材包草稿"));
  await settle();
  const create = log.find((c) => c.method === "POST" && /\/api\/platform\/drafts$/.test(c.url));
  check("建立草稿送出平台代碼（cjsh / g2s1 / 數學 / TEXTBOOK）",
    !!create && create.body.finalFilename === FINAL && create.body.metadata.school === "cjsh" &&
    create.body.metadata.semester === "g2s1" && create.body.metadata.subject === "數學" && create.body.metadata.materialType === "TEXTBOOK");
  check("預覽顯示草稿狀態（學生看不到）", doc.body.textContent.indexOf("草稿（學生看不到）") !== -1);
  check("預覽顯示轉換警告", doc.body.textContent.indexOf("Q3：找不到答案") !== -1);
  check("預覽標出正確答案", !!doc.querySelector(".upl-question__options .is-answer") && doc.querySelector(".upl-question__options .is-answer").textContent.indexOf("150°") === 0);

  console.log("\n[5] 發布");
  click(buttonByText(doc, "確認發布到平台"));
  await settle();
  check("呼叫 publish", log.some((c) => c.method === "POST" && /\/api\/platform\/drafts\/tm_18\/publish$/.test(c.url)));
  check("顯示已上架與 git 指令", doc.body.textContent.indexOf("已上架（IMPORTED）") !== -1 && doc.querySelector(".upl-success .upl-pre").textContent.indexOf("git add docs/TeachingMaterials/materials/tm_18/ js/data/TeachingMaterialData.js") === 0);
  check("發布後不再顯示發布／刪除按鈕", !buttonByText(doc, "確認發布到平台") && !buttonByText(doc, "刪除草稿"));
  check("Console errors = 0", consoleErrors.length === 0);

  console.log("\n[5a] 既有 Final.md：帶入步驟 1、預覽可修改並存回");
  const catalog = [...doc.querySelectorAll("select")].find((s2) => [...s2.options].some((o) => o.value === OLD_FINAL));
  catalog.value = OLD_FINAL;
  click(buttonByText(doc, "使用這份 Final"));
  await settle();
  check("帶入步驟 1：學校、科目、年級、教材類型、章節（去掉科目前綴）",
    fieldByLabel(doc, "學校").value === "zwsh" && fieldByLabel(doc, "科目").value === "化學" && fieldByLabel(doc, "年級").value === "高二" &&
    fieldByLabel(doc, "教材類型").value === "TEXTBOOK" && fieldByLabel(doc, "章節").value === "第三章" && fieldByLabel(doc, "單元").value === "");
  check("提示已帶入、可修正", doc.body.textContent.indexOf("已依 Final.md 帶入步驟 1") !== -1);
  const editor = doc.querySelector(".upl-final__editor");
  check("預覽是可編輯的文字框，內容為 Final.md", !!editor && editor.tagName === "TEXTAREA" && editor.value === OLD_FINAL_CONTENT);
  click(buttonByText(doc, "儲存修改"));
  await settle();
  check("沒有修改時不送出", !log.some((c) => c.method === "PUT"));
  editor.value = OLD_FINAL_CONTENT.replace(/第三章/g, "第二章");
  click(buttonByText(doc, "還原未儲存的修改"));
  check("還原未儲存的修改", editor.value === OLD_FINAL_CONTENT);
  editor.value = OLD_FINAL_CONTENT.replace(/第三章/g, "第二章");
  click(buttonByText(doc, "儲存修改"));
  await settle();
  const put = log.find((c) => c.method === "PUT");
  check("存回引擎：PUT /api/finals/<檔名>，送出修改後的內容", !!put && put.url.indexOf("/api/finals/" + encodeURIComponent(OLD_FINAL)) !== -1 &&
    put.body.content.indexOf("unit: 化學 第二章") !== -1);
  check("儲存後步驟 1 章節更新為第二章，並說明原始版本已保留", fieldByLabel(doc, "章節").value === "第二章" &&
    doc.body.textContent.indexOf(OLD_FINAL + ".orig") !== -1);
  click(buttonByText(doc, "建立教材包草稿"));
  await settle();
  const create2 = log.filter((c) => c.method === "POST" && /\/api\/platform\/drafts$/.test(c.url)).pop();
  check("建立草稿使用這份 Final 與修正後的章節", !!create2 && create2.body.finalFilename === OLD_FINAL &&
    create2.body.metadata.chapter === "第二章" && create2.body.metadata.school === "zwsh");
  check("Console errors = 0", consoleErrors.length === 0);

  console.log("\n[5b] 為既有教材加題");
  click(buttonByText(doc, "為既有教材加題"));
  await settle();
  check("切換後只顯示加題的四個步驟＋引擎＋草稿預覽", visibleCards().length === 6 && !visibleCards().some((c) => c.textContent.indexOf("三方初稿") !== -1));
  const parentSel = fieldByLabel(doc, "教材");
  check("教材清單來自引擎（含原題數）", !!parentSel && [...parentSel.options].some((o) => o.value === "tm_7" && o.textContent.indexOf("原有 23 題") !== -1));
  check("預設單一 Claude 模式：只有 Claude（新對話）作答欄", !!fieldByLabel(doc, "Claude（新對話） 作答結果") &&
    fieldByLabel(doc, "ChatGPT 作答結果").closest(".upl-field").hasAttribute("hidden"));
  parentSel.value = "tm_7";
  parentSel.dispatchEvent(new window.Event("change"));
  check("數學教材在單一模式下提示建議三方核對", doc.body.textContent.indexOf("建議改用三方核對") !== -1);
  const countInput = fieldByLabel(doc, "題數（1～40）");
  countInput.value = "10";
  countInput.dispatchEvent(new window.Event("input"));
  check("題數改變時自動分配難度（3/5/2）", fieldByLabel(doc, "易").value === "3" && fieldByLabel(doc, "中等").value === "5" && fieldByLabel(doc, "難").value === "2");
  click(buttonByText(doc, "複製出題 Prompt"));
  await settle();
  const ap = log.find((c) => /\/supplements\/author-prompt$/.test(c.url));
  check("出題 Prompt 送出教材、題數與難度", !!ap && ap.body.parentId === "tm_7" && ap.body.count === 10 && ap.body.difficulty["難"] === 2);
  check("出題 Prompt 可預覽", doc.body.textContent.indexOf("出題 PROMPT") !== -1);
  fieldByLabel(doc, "Claude 出題結果").value = "Q1. …";
  click(buttonByText(doc, "擷取題目並複製作答 Prompt"));
  await settle();
  check("擷取題目並提示開新的 Claude 對話", doc.body.textContent.indexOf("擷取到 3 題") !== -1 && doc.body.textContent.indexOf("「新的」Claude 對話") !== -1);
  fieldByLabel(doc, "Claude（新對話） 作答結果").value = "Q1：B";
  click(buttonByText(doc, "核對"));
  await settle();
  const ck = log.find((c) => /\/supplements\/check$/.test(c.url));
  check("核對送出單一作答者", !!ck && ck.body.solvers.length === 1 && ck.body.solvers[0].id === "claude-fresh" && ck.body.mode === "single");
  const boxes = [...doc.querySelectorAll(".upl-sup-results input[type=checkbox]")];
  check("一致預設勾選、需人工確認不勾、重複不能勾", boxes.length === 3 && boxes[0].checked && !boxes[1].checked && boxes[2].disabled);
  check("顯示需人工確認的原因", doc.body.textContent.indexOf("答 C，出題答案為 B") !== -1);
  boxes[1].checked = true;
  boxes[1].dispatchEvent(new window.Event("change"));
  check("勾選數顯示在按鈕上", !!buttonByText(doc, "建立補充題庫草稿（已勾選 2 題）"));
  click(buttonByText(doc, "建立補充題庫草稿（已勾選 2 題）"));
  await settle();
  const cd = log.find((c) => /\/supplements\/drafts$/.test(c.url));
  check("建立草稿送出勾選的題號與核對當時的內容", !!cd && JSON.stringify(cd.body.accept) === "[1,2]" && cd.body.authorText === "Q1. …" && cd.body.parentId === "tm_7");
  check("預覽標示補充題庫與原教材", doc.body.textContent.indexOf("補充題庫 → tm_7") !== -1 && doc.body.textContent.indexOf("併入 tm_7 的題庫") !== -1);
  check("加題流程 Console errors = 0", consoleErrors.length === 0);
  window.close();

  console.log("\n[6] 引擎未啟動");
  {
    const { doc: d2, consoleErrors: e2 } = loadUpload("admin", "down");
    await settle();
    check("顯示啟動提示", d2.body.textContent.indexOf("請先在這台電腦執行「啟動教材上傳引擎.bat」") !== -1);
    check("Console errors = 0", e2.length === 0);
  }

  console.log("\nUploadPageRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.log("  FAIL  unexpected error: " + (err && err.stack || err));
  process.exit(1);
});
