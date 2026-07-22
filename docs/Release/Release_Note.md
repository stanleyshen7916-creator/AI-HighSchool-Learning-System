# Release Note — v0.6.6-beta.5

**Sprint 6.6 · Runtime QA Final Bug Fix — Learning Center Runtime Integration**
Date: 2026-07-21
Architecture Baseline: Architecture Evolution v2.0（PMO Decision 025，LOCK）

**Sprint 6.6 Runtime QA 正式結案**（待 GPT PMO 最終確認）。下一個
Sprint（6.7 AI Learning Pipeline）將於 LOCK 確認後、收到正式 EO 才
開始。

---

## 本版修正

### Issue #026 — 我的學習日曆日期錯誤
學習日曆原本固定顯示「2024 年 5 月」，與系統實際日期無關。本版改為
即時依系統日期計算目前月份，「上一月」／「下一月」／「今日」皆為
真實可用的月份切換，點擊任一日期會顯示該日真實學習時數（或誠實顯示
沒有學習記錄）。

### Issue #027 — Learning Center Runtime Integration
「我的學習」頁面所有互動元件已全面確認符合三種狀態之一：已完成真實
Runtime 串接、明確 Disabled 並說明原因、或明確標示 Coming Soon：
- **學習總覽**：累積學習天數／完成題數／正確率改為真實計算
- **學習記錄**：「本週」長條圖改為真實資料；「本月／今年／全部」
  維持 Disabled + Coming Soon（無對應歷史資料可用）
- **週報告**：雷達圖改為真實本週對上週資料比較；「查看全部」改為
  明確 Coming Soon
- **學習日曆**：見 Issue #026
- **科目進度**：長條圖改為真實計算；「查看全部」改為明確 Coming Soon
- **成就徽章**：「分享成就」按鈕與「查看全部」連結原本完全無反應，
  現已明確標示 Disabled／Coming Soon

---

## 已知限制（誠實記錄，非本版可解決範圍）

1. 「今日學習重點」與「今日任務」／「AI 老師建議」目前沒有對應
   Runtime，永久顯示 Empty State
2. 「本月／今年／全部」學習記錄檢視需要一個依時間區間查詢的歷史
   Runtime，目前不存在，屬新功能範疇
3. 成就徽章目前沒有真正的達成判定邏輯，展示內容維持既有視覺呈現，
   互動功能待未來 Sprint 決定是否納入
4. 學習總結五大區塊內容偏少，因全站無真實文件解析能力（Stub
   Implementation 設計，非本次缺陷）

---

## Compatibility
本版未修改：Repository Structure、Runtime API、Runtime Schema、
Design Token、UI Library、Architecture。全站迴歸測試 Console Error =
0，Runtime Error = 0。

## Upgrade Notes
無需任何手動遷移步驟。純前端靜態檔案更新，直接部署即可生效。

---

## 歷史版本



### Issue #022 — 教材中心 Header 全域搜尋無法使用
教材中心頁面最上方共用 Header 的搜尋框，過去從未綁定任何事件，輸入
任何文字皆無反應。本版修正後，Header 搜尋框可即時依教材名稱、教材
編號、章節、關鍵字篩選教材中心畫面，並與教材中心自身的搜尋框同步。

### Issue #023 — 格式篩選選項不足
格式下拉選單原本只有 5 個選項（PDF／PPT／DOCX／MP4／全部格式），
現已擴充為 17 個選項（新增 PPTX／DOC／XLS／XLSX／TXT／MP3／JPG／
JPEG／PNG／GIF／WebP／其他），且「其他」選項現在能真正篩選出不屬於
已列名格式的教材。

### Issue #024 — 學習總結摘要內容顯示異常
經調查確認：學習總結頁面**確實有正確讀取真實資料**，並非讀取邏輯
故障。畫面顯示「尚無資料」是因為教材解析（PDF/文件內容擷取）功能
目前尚未實作真實解析能力，屬於已知、刻意的 Prototype 設計限制，而
非本次缺陷。本版已改善呈現方式：
- 教材完全沒有建立過學習總結時，明確顯示「尚未建立學習總結」
- 已建立學習總結但目前內容仍為初步狀態時，顯示單一清楚說明，取代
  五個重複的「尚無資料」訊息
- 若部分區塊已有真實內容，正常逐一顯示

### Runtime Interactive Component Audit
全面檢查教材中心所有互動元件（Header 搜尋、教材搜尋、分類、科目、
年級、排序、格式、篩選、檢視切換、新增資料夾、教材上傳、教材卡片、
最近學習、學習總結），確認除上述已修正項目外，其餘元件皆已完整
串接真實 Runtime，沒有發現額外「畫面存在但功能未實作」的問題。

---

## 已知限制（誠實記錄，非本版可解決範圍）

1. **學習總結內容仍偏空白**：因全站目前沒有任何真實 PDF／文件內容
   解析能力（無對應函式庫、不允許新增後端或雲端服務），核心概念／
   重要定義／易錯重點／必背內容目前多為空。這需要未來一個獨立的
   Architecture 決策（引入文件解析能力）才能解決，非本次 Bug Fix
   範圍。
2. **首頁教材卡片的開啟／下載僅在同一次瀏覽 Session 內有效**：因
   瀏覽器 File 物件本身無法序列化保存，跨頁重新載入後會遺失，按鈕
   會正確變為 Disabled 並說明原因。
3. **今日任務／AI 老師建議** 目前沒有對應 Runtime，永久顯示 Empty
   State，需等待未來 Sprint 授權建立對應能力。
4. **我的學習頁面的「本月／今年／全部」** 目前為 Disabled + Coming
   Soon，因無歷史學習資料 Runtime 可用；「本週」維持正常可用。

---

## Compatibility
本版未修改：Repository Structure、Runtime Architecture、UI Library、
Design Token、Component Baseline、Runtime API、Runtime Schema。所有
既有頁面與功能經全站迴歸測試，Console Error = 0，Runtime Error = 0。

## Upgrade Notes
無需任何手動遷移步驟。純前端靜態檔案更新，直接部署即可生效。
