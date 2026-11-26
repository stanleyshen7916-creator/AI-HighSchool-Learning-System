/* js/data/MonthExamTopics.js — 模擬月考「依主題篩題」設定（AHS-EXAM-TOPIC，2026-11-25）。
   有些講義一份涵蓋多個主題（例：長榮地科講義含主題 1–11），月考只考其中幾個主題。
   這裡設定每個「<學校>|<學期>」、每一科只出哪些主題：
     topics["<學校>|<學期>"]["<科目>"] = { from: 起始主題, to: 結束主題, label: 顯示文字 }
   題目的主題由題目的 section／knowledgePoint／題幹中的「主題 N」判斷；
   有設定時，沒有主題標記的題目一律不出（無法確定屬於哪個主題）。
   與 MonthExamConfig.js 分開，避免「設為全體預設範圍」改寫 MonthExamConfig 時被覆蓋。 */
window.AHS = window.AHS || {};
AHS.MonthExamTopics = {
  "topics": {
    "cjsh|g2s1": {
      "地球科學": { "from": 6, "to": 11, "label": "主題 6–11" }
    }
  }
};
