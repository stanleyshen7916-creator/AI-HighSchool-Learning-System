/* js/data/ExamArchiveData.js — 月考資料（2026-10-27）：歷次段考的考卷題目與解析。

   只放題目本身（逐字轉錄的題幹、閱讀文本、選項、表格，以及裁切或重繪的附圖），
   不放整份考卷照片，也不放任何學生的作答或得分。各科題目在
   js/data/ExamArchive<科目>.js，載入時 push 到 subjects；本檔必須先載入。

   每題欄位：no、type（single／multi／fill／essay）、stem、passageRef（共用文本，
   見該科 passages）、options、figure、table、answer、basis（確認＝原卷紅筆或可直接
   驗證；推論＝無官方解答，由解題推得）、confidence（"low"＝需人工確認）、
   explanation、topic、lessonRef（"<圖解教材 lessonId>#<卡片 id>" 或 "gap:<缺口 id>"）。 */
window.AHS = window.AHS || {};
AHS.ExamArchiveData = {
  exams: [
    {
      id: "115-1-m1",
      title: "115 學年度第一學期 高二第一次段考",
      school: "長榮中學",
      note: "題目依考卷逐字照錄，原卷錯漏不修正，加註「原卷如此」。沒有官方解答卷：國文依紅筆批改標【確認】，其他科由解題推得，標【推論】。物理、公民、歷史沒有考卷；生物第 35 題以後、英文非選擇題未拍攝。"
    }
  ],
  /* 平台教材尚未涵蓋的範圍（lessonRef 為 "gap:<id>" 的題目） */
  gaps: {
    "math-exp": "數學第 2 章 指數（平台尚無教材）",
    "math-log": "數學第 2 章 對數（平台尚無教材）",
    "chi-phonetics": "國文 字音字形・詞義（平台尚無專門練習）",
    "chi-shuizhengju": "國文〈水證據——給河流〉（平台尚無此課）",
    "chi-reading": "國文 課外閱讀題組（平台尚無專門練習）",
    "bio-nutrients": "生物 植物必需元素（平台教材未涵蓋）",
    "eng-grammar": "英文 Book3 綜合測驗文法（平台尚無專門練習）",
    "eng-structure": "英文 篇章結構（平台尚無專門練習）"
  },
  subjects: []
};
