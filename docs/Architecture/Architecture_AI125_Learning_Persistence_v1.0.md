# Architecture_AI125_Learning_Persistence_v1.0 — Learning Persistence 調查報告 ＋ PMO Decision（Account Persistence Architecture）

**Status**：**LOCK** — PMO Decision 已核准（2026-08-06，Sprint AI-125｜PMO Decision｜Account Persistence Architecture v1.0）。第 0～4 節為原始調查結果（保留不變）；第 5 節起為 PMO Decision 新增的 Persistence Level／Runtime Rule／Repository Layer／Account Persistence Baseline，**本次修訂同樣不含任何程式碼變更**，僅更新本份 Architecture 文件。
**Scope**：Task 指定的 4 個領域 — Learning Progress／Question Session／WrongBook／Knowledge Mastery。逐一以直接讀取原始碼（非記憶、非既有文件）驗證。

## 0. 結論摘要（先講重點）

逐檔驗證後，4 個領域裡有 **3 個其實已經是真正的 Persistence（sessionStorage，Workspace 隔離）**，只有 **Question Session 的「進行中」狀態是刻意設計為 Memory-only**：

| PO 回報的領域 | 真正的資料來源 | 現況 |
|---|---|---|
| Learning Progress | `AHS.MaterialRuntime`（`item.progress`）+ `AHS.LearningStateRuntime`/`AHS.MaterialLearningStateRuntime`（純計算，無自己的 store） | ✅ 已 Persist（底層 `MaterialRuntime` 有；計算層本來就不需要） |
| Question Session | `AHS.QuestionRuntime`／`AHS.AnswerRuntime`／`AHS.ExamRuntime`（進行中作答）vs `AHS.LearningQuestionRuntime`／`AHS.LearningQuestionSession`（已完成的練習紀錄） | ⚠️ **進行中的部分是 Memory-only（刻意設計）**；已完成的練習紀錄已 Persist |
| WrongBook | `AHS.WrongBookRuntime`（現行真實來源）＋ `AHS.WrongBookSession`（舊版 v1.0） | ✅ 已 Persist（兩者皆有） |
| Knowledge Mastery | `AHS.KnowledgeMasteryRuntime` | ✅ 已 Persist |

換句話說：**「重新登入全部消失」這個現象，不能單純解釋為「這些 Runtime 都還是 Memory」**——多數底層資料其實已經有真正的持久化程式碼。第 3 節會列出幾種真正可能造成「看起來全部消失」的情境，供 PMO 判斷實際重現的是哪一種。

## 1. Persistence 機制本身（現有架構，未改動）

`js/core/PersistenceAdapter.js`（PMO Decision 025，LOCK）：

- 唯一允許直接碰 `window.sessionStorage` 的模組。
- 明確**只用 sessionStorage，不用 localStorage / IndexedDB / Backend**（該檔案自己的文件明講這是刻意保留的限制，非本次調查新發現）。
- Sprint AI-119 起，`save()`/`load()`/`remove()` 會自動加上「目前 Workspace 的命名空間」（`AHS.WorkspaceRuntime.storageNamespace()` = `studentId__schoolId__semesterIds`），因此不同學生／不同 School／不同 Semester 組合的資料天生互相隔離，這是**設計上刻意的行為，不是 bug**。
- `logout()`（`js/ui/AppShell.js:64-74`）目前**只清除 Workspace 指標本身**（`AHS.WorkspaceRuntime.logout()`），**不會**呼叫 `AHS.PersistenceAdapter.clear()`。這是 Sprint AI-119 的刻意行為變更（該檔案自己的註解引用了「Sprint AI-119 EO Report」），目的正是避免登出時清掉其他 Workspace 的真實進度。也就是說：**同一位學生、同一個 School/Semester 組合，登出後再登入，理論上應該讀回一模一樣的命名空間、一模一樣的資料**——這點與 PO 描述的「重新登入全部消失」不完全吻合，需要第 3 節釐清實際測試情境。
- **關鍵、已在檔案自身文件揭露的限制**：sessionStorage 的生命週期是「同一個瀏覽器分頁/視窗的會話」——**分頁或瀏覽器關閉後，資料就會被清空**，這是瀏覽器原生行為，不是這個 Adapter 的 bug。如果 PO 測試「重新登入」時實際上是關閉分頁/瀏覽器再重新開啟，這就是目前架構下**預期中、且已被文件揭露**的限制，而非程式缺陷。

## 2. 逐 Runtime 稽核（直接讀原始碼確認，非推測）

### 2.1 Learning Progress

| Runtime | 是否有自己的 store | Persistence | 備註 |
|---|---|---|---|
| `AHS.MaterialRuntime`（`item.progress` 欄位） | 有 | ✅ `PersistenceAdapter`，key `materialRuntime` | 閱讀進度真正的來源 |
| `AHS.LearningStateRuntime` | **沒有**，純計算 | 不適用（by design） | 每次呼叫都即時彙整 `MaterialRuntime`＋`WrongBookRuntime`＋`SummaryRuntime`＋`HistoryRuntime`，自己完全不落地任何資料——這是刻意的設計（檔案標頭：「Purely computed, same pattern as StatisticsRuntime」），與 `StatisticsRuntime` 同一慣例。 |
| `AHS.MaterialLearningStateRuntime`（NOT_STARTED→READING→READY_FOR_PRACTICE→READY_FOR_RETEST→MASTERED 狀態機） | **沒有**，純計算 | 不適用（by design） | 包裝 `LearningStateRuntime`，同樣是「五個狀態是三個真實訊號的確定性函數」，檔案標頭明講「no second, persisted, driftable copy is created here」。 |

**結論**：Learning Progress 的底層真實資料（`MaterialRuntime.progress`）**已經 Persist**。「Learning Progress 消失」若真的發生，代表消失的其實是 `MaterialRuntime` 本身的資料（連動整個 Material，不會只有進度單獨消失），或是命名空間對不上（見第 3 節）。

### 2.2 Question Session

這個名稱底下實際對應到 **5 個不同的 Runtime**，狀態不一致：

| Runtime | 職責 | Persistence | 備註 |
|---|---|---|---|
| `AHS.QuestionRuntime` | 目前這場考試/練習載入的題目集合（`examId → 題目陣列`） | ❌ **Memory-only（刻意設計）** | 檔案標頭原文：「keeps it in-memory... plain in-memory object under window.AHS, starts EMPTY, no localStorage / API / backend」。每次頁面重新整理都會透過 `AHS.QuestionBank.generate()` 重新產生（正式測驗）或由 `LearningQuestionRuntime` 重新餵入（考前練習），**這是 Sprint 4 建立以來就存在的既有設計**，不是本次才發現的缺陷。 |
| `AHS.AnswerRuntime` | 目前這場考試/練習「尚未送出」的即時作答紀錄 | ❌ **Memory-only（刻意設計）** | 檔案標頭原文：「Records the student's answers while an ExamRuntime session is running... In-memory only, keyed by examId」。 |
| `AHS.ExamRuntime` | 考試 session 狀態機（draft→ready→running→finished） | ❌ **Memory-only（刻意設計）** | 檔案標頭原文：「In-memory only」。 |
| `AHS.LearningQuestionRuntime` | AI-122+ 真實考前練習的題目/作答紀錄（已完成/進行中皆會即時同步） | ✅ **已 Persist**，key `learningQuestionRuntime` | 檔案標頭：「hydrates from AHS.PersistenceAdapter on module load and persists after every write」。 |
| `AHS.LearningQuestionSession` | 舊版 v1.0 練習 session 儲存 | ✅ **已 Persist**，key `learningQuestionSession` | 同上模式。 |

**結論**：Question Session 是 4 個領域裡**唯一真正「Memory-only」的一塊**，而且只限於「正式測驗（Exam Mode）進行中、尚未送出/尚未批改」的那段即時狀態（題目集合＋即時作答）——這是 Sprint 4（本專案最早期）就確立的既有架構，**刻意**不落地，理由是這類「草稿中」的狀態原本被視為單頁生命週期內的暫存資料。**只要離開頁面（含重新整理、含重新登入），進行中、未送出的正式測驗會被重置**——這與 PO 描述的「Question Session 重新登入消失」完全吻合，是本次調查中唯一確認為真的落差。已完成／已批改的測驗結果則走 `AHS.AutoGrader`→`AHS.HistoryRuntime`（已 Persist，Sprint AI-109 AI-602 修正）與 `AHS.WrongBookRuntime`（已 Persist，見 2.3），不受影響。

### 2.3 WrongBook

| Runtime | Persistence | 備註 |
|---|---|---|
| `AHS.WrongBookRuntime`（正式測驗＋AI-122+ 真實考前練習皆寫入此處，是目前唯一真實批改路徑的目的地） | ✅ **已 Persist**，key `wrongBookRuntime` | Sprint AI-109 AI-601 修正：檔案標頭自陳「this store was plain in-memory only... Fixed with the exact same hydrate()/persist() pattern」——**在 Sprint AI-109 之前確實是 Memory-only 過**，但那是很早期的既有修正，非本次調查新發現的問題。 |
| `AHS.WrongBookSession`（舊版 v1.0，僅剩舊版 Practice pipeline 會寫入） | ✅ **已 Persist**，key `wrongBookSession` | 同樣模式。 |

**結論**：WrongBook **已經 Persist**（且是這 4 個領域裡持久化歷史最久的——Sprint AI-109，早於本次 AI-124 PAT Fix）。若 PO 實測看到 WrongBook 消失，最可能的解釋同樣落在第 3 節列的情境，而非「這個 Runtime 從未 Persist」。

### 2.4 Knowledge Mastery

| Runtime | Persistence | 備註 |
|---|---|---|
| `AHS.KnowledgeMasteryRuntime` | ✅ **已 Persist**，key `knowledgeMasteryRuntime` | 檔案標頭自 Sprint AI-121 建立時就已經是「hydrate()/persist() through AHS.PersistenceAdapter... starts empty, grows only via real recordAttempt()/recordGraded() calls」——**從一開始設計就有 Persistence，不是後補的**。 |

**結論**：Knowledge Mastery **已經 Persist**。

## 3. 「重新登入：全部消失」的可能真實成因（供 PMO 判斷是哪一種）

既然 4 個領域裡有 3 個的底層資料早已透過 `PersistenceAdapter` 落地，「全部消失」這個現象最可能對應以下情境之一（本次調查未能取得 PO 實測時的確切操作步驟，故並列，不臆測何者為真）：

1. **瀏覽器分頁/視窗被關閉再重新開啟**（而非在同一分頁內按「登出」→「登入」）：sessionStorage 的生命週期本來就只到瀏覽器/分頁關閉為止——這是**現有架構已知、已在 `PersistenceAdapter.js` 自身文件中揭露的限制**，不是本次調查的新發現。若這是實際重現方式，代表 PO 觀察到的其實是「sessionStorage 是否仍是正確的 Persistence Provider」這個更大的架構問題，而不是個別 Runtime 缺了持久化程式碼。
2. **兩次登入選了不同的 Workspace 組合**（例如學生／School／Semester 任一項不同）：命名空間 `studentId__schoolId__semesterIds` 不同，會正確地讀到「空」——這是 Sprint AI-119 刻意設計的隔離行為（同一位學生在不同班級/學期不該混用彼此的學習資料），不是缺陷。
3. **測試的正好是 2.2 節指出的「進行中、尚未送出的正式測驗」**：這部分本來就是刻意 Memory-only（Sprint 4 既有設計），重新登入（或單純重新整理）本就會重置，符合預期。
4. **sessionStorage 被瀏覽器隱私模式／設定封鎖**：`PersistenceAdapter.isAvailable()` 會偵測並靜默 fallback 成完全的 Memory-only（`js/core/PersistenceAdapter.js` 自身文件：「Fails safe... Runtimes fall back to their existing in-memory-only behavior」）——這種情況下，連本來已 Persist 的 3 個領域也會表現得像全部消失，且不會有任何錯誤訊息。

## 4. 調查階段原列的決策選項（已由第 5 節 PMO Decision 取代，保留作為紀錄）

> 以下 3 個選項是本文件初版（調查完成當下）提交給 PMO 參考的選項清單，**PMO 已於 2026-08-06 做出正式決策（見第 5 節），本節內容不再是待決事項，僅保留作稽核紀錄，不代表目前的 Architecture Baseline**。

1. ~~維持現況 + 加強使用者溝通~~：sessionStorage 的分頁生命週期限制屬於本專案既有、公開揭露的架構限制（PMO Decision 025 的既有保留範圍），若情境 1 是真正成因，可考慮在登出/關閉分頁前提示使用者，而非變更持久化層。
2. ~~正式測驗「進行中」狀態納入 Persistence~~：將 `AHS.QuestionRuntime`／`AHS.AnswerRuntime`／`AHS.ExamRuntime` 的進行中 session 比照 `AHS.LearningQuestionRuntime` 的既有模式接上 `PersistenceAdapter`。
3. ~~升級 Persistence Provider（sessionStorage → 更長效的儲存）~~：若情境 1 才是 PO 真正在意的「重新登入」，這已超出「補齊某個 Runtime 的持久化程式碼」的範圍，而是要不要放寬 PMO Decision 025 的既有保留限制。

**PMO 的實際決策比上述 3 個選項都更根本**：不只是「要不要換一種瀏覽器端儲存」，而是重新定義「什麼才算平台的 Persistence」——見第 5 節。

---

# 5. PMO Decision（LOCK）— Account Persistence Architecture

> 依據：Sprint AI-125｜PMO Decision｜Account Persistence Architecture v1.0（2026-08-06，Status: LOCK）。
> 本節為 PMO 正式決策內容的文件化，**非本次調查／文件產出的自主判斷**——第 0～4 節的調查事實維持不變，本節是 PMO 收到那份調查後，對「Persistence 應該如何定義」做出的架構層級決定。

## 5.1 決策背景與範圍

第 0～4 節的調查結論被 PMO **原文接受，不得修改**：Learning Progress／WrongBook／Knowledge Mastery 均已透過 `AHS.PersistenceAdapter` → `sessionStorage` 完成「Browser Session Persistence」；Question Session 仍為 Memory Only。

PMO 對此提出的問題**不是**「調查結果錯了」，而是：本平台的定位已更新為 **Knowledge Learning Platform**——Platform Baseline 要求「同一帳號，不論手機／平板／桌機／Browser，重新登入，最終資料均必須一致」。以此標準衡量，**sessionStorage 不足以被定義為平台的最終 Persistence**（sessionStorage 換一台裝置、甚至同裝置換一個 Browser，資料就對不上，不符合上述 Baseline）。

**本任務僅止於修正 Architecture Baseline（重新定義 Persistence 的分級與未來方向），不是立即實作 Cloud Sync**：不得開始 Cloud Sync、不得開始 API、不得開始 Database；不得修改 Learning Engine／Knowledge Engine／WrongBook Runtime／Workspace Runtime／Statistics Runtime／Question Runtime／Exam Runtime／UI／Learning Logic 任一項；不得新增任何功能。Implementation 何時開始、如何分階段，等待 PMO 下一步交辦。

## 5.2 Persistence Level 定義（L0～L3）

| Level | 名稱 | 說明 | 平台是否可視為最終 Persistence |
|---|---|---|---|
| **L0** | **Memory Only** | Runtime Memory（純記憶體變數，如 `AHS.QuestionRuntime`／`AHS.AnswerRuntime`／`AHS.ExamRuntime` 目前的狀態）。重新整理即消失。 | ❌ 否 |
| **L1** | **Browser Session** | `sessionStorage`（本專案目前透過 `AHS.PersistenceAdapter` 提供的機制，即第 0～4 節調查的 Learning Progress／WrongBook／Knowledge Mastery 現況）。僅同一 Browser Session 有效——分頁/瀏覽器關閉即消失，換裝置、換瀏覽器也不同步。 | ❌ **不得視為平台 Persistence**——PMO 明確不接受將 L1 定義為 Persistence，僅可作為 **Runtime Cache**。 |
| **L2** | **Device Persistence** | `IndexedDB` 或 `localStorage`。僅同一裝置有效，跨裝置仍不同步。 | ❌ **不得作為最終平台架構**——比 L1 更持久，但仍不滿足「同一帳號跨裝置一致」的 Platform Baseline。 |
| **L3** | **Account Persistence（Platform Baseline）** | `User Account` → `Repository Layer` → `Cloud Storage` → `Runtime Cache`。 | ✅ **Platform 唯一可信來源（Single Source of Truth）**——見 5.4。 |

**現行架構對應**：本專案目前所有已 Persist 的 Runtime（`MaterialRuntime`／`WrongBookRuntime`／`WrongBookSession`／`KnowledgeMasteryRuntime`／`HistoryRuntime`／`LearningQuestionRuntime`／`LearningQuestionSession`／`ReviewQueue`／`SummaryRuntime`／`KnowledgeRuntime`／`QuestionBankRuntime` 等，見第 2 節逐一稽核）目前都停留在 **L1**；`QuestionRuntime`／`AnswerRuntime`／`ExamRuntime` 停留在 **L0**。**沒有任何現行 Runtime 達到 L3**——這正是本次 PMO Decision 的核心：L1 過去在文件中被當作「已完成 Persistence」，PMO 決定日後不得再如此定義，L1 只能被定位為 Runtime 的 Cache 層，不是平台的資料落地層。

## 5.3 Runtime Rule（LOCK）

> Runtime 僅負責：Cache／UI State／Temporary State。
> Runtime **不得**成為唯一資料來源（Single Source of Truth）。

在 L3 成為 Platform Baseline 之後，本專案既有的每一個 Runtime（`MaterialRuntime`、`WrongBookRuntime`、`KnowledgeMasteryRuntime`、`QuestionRuntime`……）在架構上的定位改為：**Repository Layer 之上的 Cache／UI State／Temporary State 層**，而不再是「資料本身活在哪裡」的答案。這是**未來方向的架構原則**，本次不要求、也不允許任何 Runtime 立即改動其程式碼或行為（見 5.1／第 6 節）。

## 5.4 Repository Layer（LOCK）— 新增架構層

PMO 決定在既有的 UI → Runtime → Persistence Adapter → sessionStorage 這條線之上，**新增一層 Repository Layer**，重新定義完整的資料流向：

```
User Account
    ↓
Repository（新增層）
    ↓
Persistence（L3：Cloud Storage／未來 Implementation）
    ↓
Runtime（Cache／UI State／Temporary State，L0/L1，現行既有架構）
    ↓
UI
```

- **User Account**：平台唯一的資料歸屬單位（見 5.5）。
- **Repository**：新增的抽象層，介於 User Account 與實際 Persistence 機制之間；本次僅定義其在架構圖中的位置與職責邊界，**不進行任何介面設計或程式實作**。
- **Persistence（L3）**：Cloud Storage，尚未開始 Implementation。
- **Runtime**：**不得**直接管理 Persistence——現行「Runtime 自己呼叫 `AHS.PersistenceAdapter.save()/load()`」的既有程式碼**保持不變、不受本次決策影響**（見第 6 節「不得修改」），但這條路徑在架構圖上被重新定位為「Runtime 對 Repository/Persistence 的 Cache 讀寫」，不再是「Runtime 就是資料本身活的地方」。

## 5.5 Single Source of Truth 說明

在 L3 Account Persistence 成為 Platform Baseline 後，以下資料的唯一可信來源（Single Source of Truth）皆定義為 **User Account**（透過 Repository Layer 落地於 Cloud Storage），Runtime 端的 L0/L1 版本一律降級為該資料的 **Cache**，僅供目前這次瀏覽/這個分頁即時讀寫使用：

- Learning Progress
- WrongBook
- Knowledge Mastery
- Question Session
- AI Tutor Context
- Statistics
- Learning History

換句話說：「同一帳號、不同裝置/瀏覽器登入後資料是否一致」這件事，日後只由 L3（User Account → Repository → Cloud Storage）回答，不再由任何一個 Runtime 或 `sessionStorage` 內容回答。

## 5.6 AI-125 後續 Implementation（現況：尚未開始）

- **不得開始**：Cloud Sync、API、Database。
- 本次僅完成 Architecture 文件更新（本文件）；Implementation 的啟動時機、分階段規劃，等待 PMO 下一步交辦。

## 6. LOCK 遵循聲明

本文件為純調查與文件產出，**未修改任何 Runtime／HTML／CSS／測試檔案**，符合 AI-125 任務「不得：直接修改」的明確指示。所有結論均基於直接讀取以下原始檔案得出，未依賴既有文件（`docs/Architecture/RuntimeInventory.md` 部分內容已過時，例如仍記載 `HistoryRuntime` 為 memory-only，但該檔案已於 Sprint AI-109 AI-602 修正為真正 Persist——本文件的結論以直接讀原始碼為準，不採信該過時記載）：

`js/core/PersistenceAdapter.js`、`js/runtime/MaterialRuntime.js`、`js/runtime/LearningStateRuntime.js`、`js/runtime/MaterialLearningStateRuntime.js`、`js/runtime/QuestionRuntime.js`、`js/runtime/AnswerRuntime.js`、`js/runtime/ExamRuntime.js`、`js/runtime/LearningQuestionRuntime.js`、`js/runtime/LearningQuestionSession.js`、`js/runtime/WrongBookRuntime.js`、`js/runtime/WrongBookSession.js`、`js/runtime/KnowledgeMasteryRuntime.js`、`js/runtime/HistoryRuntime.js`、`js/ui/AppShell.js`（`doLogout()`）、`js/runtime/WorkspaceRuntime.js`（`logout()`/`storageNamespace()`）。

**本次修訂（第 5 節 PMO Decision 併入）同樣純屬文件更新**：依 PMO 本次 Decision 的明確指示，未修改 Learning Engine／Knowledge Engine／WrongBook Runtime／Workspace Runtime／Statistics Runtime／Question Runtime／Exam Runtime／UI／Learning Logic 任一項，未新增任何功能，未開始 Cloud Sync／API／Database Implementation，未修改本文件以外的任何 Architecture 文件。`npm run verify` 已重新執行確認通過（純文件變更不影響任何程式碼路徑）。
