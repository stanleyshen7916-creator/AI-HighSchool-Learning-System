# EO-S8.1.001_Report — Parser Adapter Foundation

## Status
COMPLETE — Parser Adapter Baseline v1.0 建立，**零修改任何既有 Runtime**。Parser QA 47/47、全鏈迴歸 489/489 零回歸、LOCK Runtime byte-identical、UI 零變更。未 Git Push、未 GitHub QA。

## New Files（4）
- js/parser/ParserAdapterRegistry.js（五個公開 API；五個 Stub adapter；bridge 接入）
- tests/regression/ParserAdapterV1.js（47 項）
- docs/Specifications/Specifications_ParserAdapter_v1.0.md
- docs/QA/QA_EO-S8.1.001_Foundation.md

## Modified Files
**無** —— MaterialTextProvider（LOCK）已於 EO-S8.0-005 內建 adapter 諮詢機制並公開 `registerAdapter()`，本 Registry 僅透過該公開 API 接入，故七個 LOCK Runtime 全數逐位一致。

## 設計重點
1. **雙合約橋接**：EO 之 adapter 合約（supports(fileType)／extract(file)→{status,content,metadata}）與 Provider 既有合約（supports(material)／extract(material)→string）由單一 bridge 轉譯。
2. **零回歸安全設計**：bridge 僅在 parser 確實產出文字時接手，否則讓位 —— Provider 的 content fallback 與 insufficient_source 行為完全不變（既有測試全綠驗證）。
3. **Parser 不得回傳學習成果**：extract 結果含 knowledge／summary／question 等鍵即判定格式不合法並讓位（測試反證）。
4. **零真正解析**：pdf／docx／pptx／ocr 全數 supports=false、extract 固定 not_supported；無任何解析程式庫。

## Flag
TXT Adapter 的 `extract()` 取用教材記錄既有文字（純文字無需解析），為目前唯一能真實產出文字的路徑。實務瓶頸仍在**文字如何進入系統**：上傳流程不收集文字（UI 不得改）。架構已就緒 —— 下個 EO 只要開通文字輸入（教材文字欄位或 .txt 讀取），TXT Adapter 即刻讓全鏈產出真實知識節點。

## Acceptance
✅ Console Error = 0 ✅ Runtime Regression PASS ✅ Existing Runtime Zero Regression ✅ LOCK Runtime byte-identical ✅ No UI Change ✅ No Git Push ✅ No GitHub QA
