/* js/data/MonthExamConfig.js — 模擬月考的預設範圍（管理者設定）。

   由模擬月考專區的「設為全體預設範圍」經本機教材上傳引擎寫入，並透過自動 PR
   上架（ai-engine/council/server.js 的 /api/platform/month-exam-config）。請勿手動
   編輯格式：ranges["<學校>|<學期>"]["<科目>"] = [教材編號…]。
   學生可以在頁面上自行調整範圍；沒有調整時用這裡的預設，這裡也沒有時為該科全部教材。 */
window.AHS = window.AHS || {};
AHS.MonthExamConfig = {
  "ranges": {
    "cjsh|g2s1": {
      "國文": [
        "tm_91",
        "tm_94",
        "tm_95",
        "tm_96",
        "tm_97"
      ],
      "英文": [
        "tm_93",
        "tm_98",
        "tm_99",
        "tm_100",
        "tm_103",
        "tm_104",
        "tm_105"
      ],
      "數學": [
        "tm_92"
      ],
      "歷史": [
        "tm_85",
        "tm_86"
      ],
      "公民與社會": [
        "tm_109",
        "tm_110"
      ],
      "物理": [
        "tm_101",
        "tm_102"
      ],
      "化學": [
        "tm_28",
        "tm_76",
        "tm_108"
      ],
      "生物": [
        "tm_106",
        "tm_107"
      ]
    }
  }
};
