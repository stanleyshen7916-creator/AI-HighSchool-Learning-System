/* docs/TeachingMaterials/scripts/VisualLessonCoverage.js — 圖解教材覆蓋率報告.

   新上架的教材比照辦理：每個教材包（tm_N）都應該有對應的圖解教材，題庫每一題都應該
   對應到一張公式／觀念卡片（學習助教「看互動圖解」用）。本腳本列出：
     - 每個教材包有沒有圖解教材（依科目、章節分組）
     - 有圖解教材的教材，題目對應到卡片的比例與沒對應到的知識點

   Run: node docs/TeachingMaterials/scripts/VisualLessonCoverage.js [--semester g2s1] [--strict]
   --strict：有題目對應不到卡片時以 exit 1 結束（給 CI／上架前檢查用）。 */
"use strict";
const path = require("path");
const REPO = path.join(__dirname, "..", "..", "..");

function load() {
  global.window = global.window || {};
  window.AHS = window.AHS || {};
  global.AHS = window.AHS;
  require(path.join(REPO, "js/data/TeachingMaterialData.js"));
  require(path.join(REPO, "js/data/VisualLessonData.js"));
  require(path.join(REPO, "js/utils/VisualLesson.js"));
  return AHS;
}

function report(opts) {
  opts = opts || {};
  const A = load();
  const rows = [];
  A.TeachingMaterialData.forEach((e) => {
    const m = e.material || {};
    if (opts.semester && m.semester !== opts.semester) { return; }
    const lesson = A.VisualLesson.forMaterial(e.materialId);
    const unmatched = {};
    let matched = 0;
    if (lesson) {
      (e.questions || []).forEach((q) => {
        const hit = A.VisualLesson.forQuestion({ id: q.id, knowledgePoint: q.knowledgePoint, text: q.question });
        if (hit) { matched++; } else { unmatched[q.knowledgePoint || "（無知識點）"] = (unmatched[q.knowledgePoint || "（無知識點）"] || 0) + 1; }
      });
    }
    rows.push({ materialId: e.materialId, subject: m.subject, semester: m.semester, chapter: m.chapter || "", lesson: lesson ? lesson.lessonId : null,
      questions: (e.questions || []).length, matched: matched, unmatched: unmatched });
  });
  return rows;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const sem = args.indexOf("--semester") !== -1 ? args[args.indexOf("--semester") + 1] : null;
  const rows = report({ semester: sem });
  let missing = 0, gaps = 0;
  rows.forEach((r) => {
    const mark = r.lesson ? "✓" : "—";
    if (!r.lesson) { missing++; }
    const cov = r.lesson ? "  題目對應 " + r.matched + "/" + r.questions : "";
    console.log(mark + " " + r.materialId.padEnd(6) + " " + (r.subject || "").padEnd(6) + " " + r.chapter.slice(0, 40) + (r.lesson ? "  → " + r.lesson : "  （尚無圖解教材）") + cov);
    Object.keys(r.unmatched).forEach((kp) => { gaps++; console.log("      未對應：" + kp + " ×" + r.unmatched[kp]); });
  });
  console.log("\n共 " + rows.length + " 個教材包，" + (rows.length - missing) + " 個有圖解教材，" + missing + " 個尚無；未對應知識點 " + gaps + " 個。");
  process.exit(args.indexOf("--strict") !== -1 && gaps ? 1 : 0);
}

module.exports = { report: report };
