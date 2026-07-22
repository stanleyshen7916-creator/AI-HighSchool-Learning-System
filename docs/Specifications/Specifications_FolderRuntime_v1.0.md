# FolderRuntime_Report — EO-S8.0-003（Study Scope Baseline v1.0）

## 定位
`AHS.FolderRuntime`（js/runtime/FolderRuntime.js）—— Folder 不是檔案資料夾，而是 **Study Scope**（第一次月考／期末考／學測總複習…），為 PMO Study Scope Baseline 之流程起點：

```
Folder (Study Scope) → Files → Knowledge Graph → Summary → Question → Wrong Book → Review
```

## 公開 API（恰七個，測試以 Object.keys 驗證無其他）
`createFolder()`｜`updateFolder()`｜`deleteFolder()`｜`getFolder()`｜`listFolders()`｜`validate()`｜`status()`

## Folder Schema
`folderId`／`folderName`／`subject`／`scopeType`（exam｜review｜subject｜custom）／`description`／`createdAt`／`updatedAt`
**預留關聯（本 EO 一律 null，不得建立任何實際內容）**：`knowledgeGraphId`／`summaryId`／`questionBankId`／`wrongBookId`／`reviewId` —— 缺任一欄位即 validate 拒絕；未來 EO 可經同一 `updateFolder()` 介面附掛真實 artefact（已前驗）。

## ID 空間決策（重要，供 PMO 確認）
`AHS.MaterialRuntime`（LOCK）已擁有 folder 容器（`fd_N`）且每個 material 於 `add()` 時取得單一 `folderId`，**未提供重新指派 API**。因此 `createFolder()` **包裝** MaterialRuntime 之公開 `addFolder()` 取得同一組 canonical id，Study Scope metadata 由 FolderRuntime 自存於獨立 storage key（`folderRuntime`）。

- 好處：Material Binding 真實可用（material.folderId 直接解析到此 Scope），無平行 id 空間造成的孤兒關聯。
- 遵守：**未修改 MaterialRuntime**（僅使用其公開 API），LOCK byte-identical 驗證通過。

## Material Binding
`getFolder(id)` 以唯讀方式自 MaterialRuntime 解析 `files[]`（sourceFileId／fileName／title／subject）與 `fileCount`。**一個檔案只能屬於一個 Folder** 為結構性保證 —— material 記錄只有單一 `folderId` 欄位。

## deleteFolder 行為
委派 MaterialRuntime 之 `removeFolder()`：**卸除**其下教材（folderId → null）但**永不刪除檔案**，再移除 Scope 記錄（測試驗證檔案總數不變）。

## status()
`unknown`（無此 Scope）｜`empty`（尚無檔案）｜`ready`（已綁定檔案）｜`analyzed`（已附掛任一預留關聯）。

## Runtime Rules 遵守（原始碼掃描驗證）
程式碼**零出現** LearningQuestionGenerator／LearningQuestionSession／AnswerBuilderRuntime／KnowledgeGraphRuntime／KnowledgeExtractionRuntime／AnalysisRuntime／SummaryRuntime／WrongBook／Review／ExamBank／DocumentClassifier 之任何呼叫；零 generate／analyze／extract；零 fetch/XHR；零 AI。
