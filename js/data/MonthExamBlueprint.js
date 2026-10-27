/* js/data/MonthExamBlueprint.js — 模擬月考的試卷結構（2026-10-27）。

   依實際段考的題型、題數與配分出題，讓模擬月考更貼近月考：
   blueprints["<學校>|<學期>"]["<科目>"] = { source, sections: [section…] }
     section = { title, kind, count, points, scoring }
       kind：single（單選）、multi（多選）、fill（選填：輸入答案，全部格子答對才給分）
       scoring（多選）：
         all    全部選對才給分
         n2k    答錯 k 個選項得 (n − 2k)/n 題分（n 為選項數），最低 0 分
         8520   全對 8 分、錯 1 個選項 5 分、錯 2 個 2 分、其餘 0 分（依配分等比例）
         fifth  每答錯 1 個選項倒扣 1/5 題分，最低 0 分
   沒有結構的學校、科目（例如沒有段考考卷的物理、歷史、公民）照原本方式出題。
   結構依 docs/QA/QA_115-1_M1_Exam_Coverage.md（長榮 115-1 第一次段考）。 */
window.AHS = window.AHS || {};
AHS.MonthExamBlueprint = {
  blueprints: {
    "cjsh|g2s1": {
      "國文": {
        source: "長榮 115-1 第一次段考：單選 21 題（每題 2 分）、多選 8 題（每題 4 分，答錯 k 個選項得 (n−2k)/n）。混合題的非選擇題不出題。",
        sections: [
          { title: "一、單一選擇題（每題 2 分）", kind: "single", count: 21, points: 2 },
          { title: "二、多重選擇題（每題 4 分，答錯 k 個選項得 (n−2k)/n 題分）", kind: "multi", count: 8, points: 4, scoring: "n2k" }
        ]
      },
      "英文": {
        source: "長榮 115-1 第一次段考：綜合測驗 30 題（每題 1 分）、文意選填／篇章結構／閱讀測驗 20 題（每題 2 分）。非選擇題不出題。",
        sections: [
          { title: "一、綜合測驗（每題 1 分）", kind: "single", count: 30, points: 1 },
          { title: "二、文意選填、篇章結構與閱讀測驗（每題 2 分）", kind: "single", count: 20, points: 2 }
        ]
      },
      "數學": {
        source: "長榮 115-1 第一次段考數學 A：單選 4 題（每題 4 分）、多選 3 題（每題 8 分，8-5-2-0 計分）、選填 10 格（每格 6 分，全對才給分）。",
        sections: [
          { title: "一、單選題（每題 4 分）", kind: "single", count: 4, points: 4 },
          { title: "二、多選題（每題 8 分，依 8-5-2-0 計分）", kind: "multi", count: 3, points: 8, scoring: "8520" },
          { title: "三、選填題（每題 6 分，全對才給分）", kind: "fill", count: 10, points: 6 }
        ]
      },
      "化學": {
        source: "長榮 115-1 第一次段考：單選 24 題（每題 3 分）、多選 7 題（每題 4 分）。",
        sections: [
          { title: "第一部份：單選題（每題 3 分）", kind: "single", count: 24, points: 3 },
          { title: "第二部份：多選題（每題 4 分，答錯 k 個選項得 (n−2k)/n 題分）", kind: "multi", count: 7, points: 4, scoring: "n2k" }
        ]
      },
      "生物": {
        source: "長榮 115-1 第一次段考：單選題每題 3 分；多選題每題 2.4 分，答錯倒扣 1/5 題分（考卷第 3 頁未拍攝，多選題數依配分推估）。",
        sections: [
          { title: "一、單選題（每題 3 分）", kind: "single", count: 23, points: 3 },
          { title: "二、多選題（每題 2.4 分，每答錯 1 個選項倒扣 1/5 題分）", kind: "multi", count: 13, points: 2.4, scoring: "fifth" }
        ]
      },
      "地球科學": {
        source: "長榮 115-1 第一次段考：單選 40 題（每題 2.5 分）。",
        sections: [
          { title: "一、單選題（每題 2.5 分）", kind: "single", count: 40, points: 2.5 }
        ]
      }
    }
  }
};
