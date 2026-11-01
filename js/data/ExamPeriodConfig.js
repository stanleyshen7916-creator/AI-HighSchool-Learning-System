/* js/data/ExamPeriodConfig.js — 月考範圍（第一次／第二次月考）。

   2026-11-01 使用者需求：「第一次月考已結束，目前上傳均為第二次月考的範圍，
   在所有內容中均須加以區分出來，便於複習」。第二次月考範圍（使用者提供）：
   國文第五～八課、歷史第3～4章、地球科學單元3 地質（主題12～14）；另含第一次
   月考後上傳的數學第3章、英文 Lessons 4–6。

   ranges["<學校>|<學期>"]:
   - current：目前要準備的月考（模擬月考、篩選的預設提示都以它為準）。
   - periods：依序列出各次月考；from（YYYY-MM-DD）以後上傳的教材預設歸入該次。
   - materials：明確指定的教材編號（優先於 from 日期規則）。 */
window.AHS = window.AHS || {};
AHS.ExamPeriodConfig = {
  ranges: {
    "cjsh|g2s1": {
      current: "m2",
      periods: [
        { id: "m1", label: "第一次月考", done: true },
        { id: "m2", label: "第二次月考", from: "2026-10-29" }
      ],
      materials: {
        tm_84: "m2", tm_85: "m2", tm_86: "m2", tm_92: "m2", tm_98: "m2", tm_99: "m2", tm_100: "m2",
        tm_94: "m2", tm_95: "m2", tm_96: "m2", tm_97: "m2"
      }
    }
  }
};
