# Production_Cleanup_Report — EO-S7.0-003

## 刪除檔案
- js/data/MockData.js（571 行全站模擬資料）
- js/data/ExamData.js（假段考日期 → 首頁倒數自動隱藏，Countdown null-safe）
- js/data/TasksData.js（假今日任務 → TodayMission 既有空模型）

## 新建
- js/data/AppConfig.js — 僅正式 UI config/文案（nav、頁面標題、篩選詞彙、巧巧台詞、通用使用者「同學」）；v2.1 §js/data 為其指定位置
- js/ui/EmptyState.js — 共用正式 Empty State 元件（不得重複撰寫相同 UI）

## 逐項移除清單
| 模擬資料 | 去向 |
|---|---|
| 預設教材 items / recentFiles | MaterialRuntime 為唯一來源（既有） |
| 預設題庫 quiz.items（5 筆）＋假測驗統計 stats/accuracyByStudy/history | Exam Mode 正式 Empty State「目前沒有可用的測驗」 |
| 預設錯題（W004B 16 筆，前 EO 已除）＋ wrongBook.items | WrongBookSession 唯一來源 |
| dashboard 假統計 | 正式 Empty State「尚無學習數據」 |
| studyPlan / achievements 假內容 | 正式 Empty State |
| 假通知 3 筆 | notifications: []（AppShell 既有空狀態） |
| 假使用者 陳同學 / email | 通用「同學」、空 email |
| AI Tutor 假對話 / 假紀錄 / 假檔案 | 空陣列（對話從零開始） |
| lastReading seed | 移除 fallback，僅真實路徑 |
| 假科目數量 128/156… | **MaterialRuntime 即時計算** |
| 使用者可見「（Mock）」前綴 ×12 | 全數清除（保留誠實「尚未實作」文案） |

## 保留（Flag，PMO 可裁定移除）
- QuotesData.js 勵志語錄、AppConfig.aiTutorPage.cannedReplies 巧巧回覆台詞 —— 策劃 UI 文案，非模擬資料
- QuestionBank.js（LOCK）內部產文含「（Mock）」字樣 —— 不得修改；題庫為空故永不觸發，待 LOCK 解除一併清理

## Data Verification
全庫 grep（陳同學/（Mock）/wb_seed/DEV_SEED）於 js+html = 0 命中（僅 AppConfig 說明註解與 LOCK QuestionBank）；jsdom First-Run 六頁零模擬內容斷言通過。
