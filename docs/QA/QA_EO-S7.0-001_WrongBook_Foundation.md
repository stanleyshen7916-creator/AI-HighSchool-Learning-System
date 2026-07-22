# QA_EO-S7.0-001_WrongBook_Foundation（WrongBook Foundation QA Report）

- 日期：2026-07-22｜執行：Claude（Frontend）

## WrongBook QA（tests/regression/WrongBookFoundationV1.js — 37 PASS / 0 FAIL）
**Wrong Book Rule**：答對 → null 零寫入；查無題目 → 拒收（不得人工建立）；空答案 → 拒收；答錯 → 建立。**Wrong Count Rule**：再答錯同題 wrongCount+1 於同一筆、firstWrongAt 逐位不變（含 update 覆蓋攻擊測試）、lastWrongAt/updatedAt 更新。

## Schema QA
22 欄全數齊備；correctAnswer / knowledgePoint / explanation 與來源題目一致；**EO-S6.9 Traceability 逐位保留**；非法 masteryLevel（不得自行新增）、非法 status、答對記錄、空 explanation 全數 reject。

## Interface QA
update 允許 masteryLevel/nextReviewAt、鎖定 wrongCount/firstWrongAt；非法 patch 整筆拒絕原記錄不變；remove 正常。

## Runtime QA
Statistics 即時推導正確；Status 推導 empty/ready；**未通過 validate 之記錄直呼 store() 亦拒收**（Runtime Validation）；Review/Practice/AI Logic 方法不存在；isEmpty()/status="empty" 支撐「目前沒有錯題紀錄。」Empty State（接線屬未來 EO）。

## Review Queue Foundation
固定四欄；enqueue 需對應真實錯題；nextReviewAt 不自動排程（預設 null）；非法 masteryLevel 拒收；同 questionId 取代不重複。

## Isolation / Regression
LearningQuestionSession 唯讀（計數不變）；LearningQuestionRuntime 零寫入；Sprint-4 WrongBookRuntime（LOCK）零交叉；全域掃描零 Mock/Stub/Placeholder。全鏈迴歸：jsdom **71/71**、Generation **18/18**、Foundation **29/29**、Pipeline **6/6**、html5validator 10 頁 **0 errors**、VerifyPaths / VerifyForbiddenPatterns **PASS**、Console Error **= 0**。**既有 96 個 js/css 檔逐位 byte-identical**（HTML 亦零變更 —— Foundation 未接線）。
