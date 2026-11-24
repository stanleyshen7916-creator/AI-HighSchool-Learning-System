# 詳解擴充格式規格（AHS-UP2 P2-1）— v0.1（已採用）

狀態：**已採用（Stanley 2026-11-19 確認 D5，四項全部採用）**。P2-2～P2-5 依本文實作。
日期：2026-11-19　範圍：上傳流程如何產出「詳解補強」（解題關鍵／步驟／常見錯誤），P2-2～P2-5 依本文實作。

## 1. 背景與已查證的事實

- 顯示端、驗證、資料格式**已存在**：`docs/TeachingMaterials/explanations/tm_N.json`（`GenerateExplanationSupplement.js` 驗證後產生 `js/data/ExplanationSupplementData.js`，前端 `ExplanationSupplement.js` 顯示：解題關鍵→示意圖→步驟→常見錯誤→原始詳解）。目前 37 份教材有，全部由人工／Claude 在 `explanations/build/*.js` 手寫。
- 現行 `GenerateExplanationSupplement.js` 的驗證規則（本規格必須通過）：`questionId` 存在於該教材包 `questionbank.json`；`concept` 為非空字串；`steps` 為非空字串陣列；`pitfalls` 若有必為陣列；`figures[]` 每張必須有 `caption`，`svg` 為單一 `<svg>` 且不含 script／事件屬性／外部引用／`<image>`。
- 現行 Prompt（`CouncilUpload.js` 的 `STEM_RULES`）已要求數理科詳解「分行、(1)(2)(3) 編號、一行『易錯：』」，但 **FinalParser 把整段詳解壓成一行純文字**。以 11/19 實測（範例見 §6）：換行全部變空格，`解題關鍵：`、`步驟：`、`易錯：` 只是文字裡的字，沒有被拆出。所以結構資訊已由 AI 寫出來、只是在解析時被丟掉。
- `PackageBuilder` 目前只寫 `questionbank.json` 的 `explanation` 欄，不寫 `explanations/`。

## 2. 設計原則

1. **向後相容**：`詳解：` 後面仍可以是單行純文字（國文、英文、舊格式）；沒有擴充標記就和現在完全一樣，不產生補強。
2. **`explanation` 欄維持扁平文字**（含全部內容），舊頁面與舊資料不受影響；補強是**另一份**資料，缺了不影響題目。
3. **不補完、不猜**：標記不完整就不產生該題補強並寫入 warnings；不自行用 AI 補。
4. **解析器只認標記，不判斷內容對錯**；內容正確性由出題／審議（雙方初稿）負責。
5. **不要求 AI 畫 SVG**（容易錯）。`figures` 上傳流程一律為空陣列；原圖走既有的【圖：檔名】機制，示意圖列為選配、之後再議。
6. 詳解擴充只套用在**主題庫題目（Q）**。變式題（V）本期**不產生**補強（變式題一般抽題不出現，只在錯題本「做一題類題」顯示，沿用現有扁平 `explanation`）。

## 3. Final.md 擴充格式

在每題 `詳解：` 之後，以下列**行首標記**分段（全形或半形冒號皆可，標記可加粗 `**…**`）：

```
**Q1.** 題幹
(A) …　(B) …　(C) …　(D) …
答案：A
詳解：
解題關鍵：一到兩句話，點出這題要用的觀念或突破口。
步驟：
(1) 第一步（含算式）。
(2) 第二步。
(3) 結果與單位。
易錯：最常見的錯誤一。
易錯：最常見的錯誤二。
補充：（選填）延伸說明、驗算方法。
知識點：…
難度：…
```

| 標記 | 必填 | 內容 | 對應欄位 |
|---|---|---|---|
| `解題關鍵：` | 是 | 單段文字 | `concept` |
| `步驟：` | 是 | 其後連續的編號行 `(1)`／`1.`／`1)`／`①`，一行一步；**不編號的接續行併入上一步** | `steps[]` |
| `易錯：` | 否 | 可重複，每次一條 | `pitfalls[]` |
| `補充：` | 否 | 單段文字 | `note` |

規則：
- 標記必須在行首（不含加粗符號與空白）。出現在行中的「易錯：」不算標記。
- `詳解：` 同一行若直接接文字（舊格式），該文字視為「原始詳解」，不影響結構標記。
- 遇到 `知識點：／難度：／出處：／對應…：／答案：／下一題` 即結束詳解區塊（與現行行為一致）。
- 出現以下任一情況，**該題只保留扁平 `explanation`，不產生補強**，並寫入 warnings（格式 `Qn：詳解擴充不完整（缺解題關鍵／步驟不足 2 步／…）`）：
  - 缺 `解題關鍵：`；
  - `步驟：` 之下少於 2 個編號步驟（單步驟不算補強，數理科 Prompt 要求至少 3 步，解析端放寬為 2，避免因少一步丟掉整題）；
  - 步驟編號不連續或重複（視為 AI 排版錯誤）。
- 文字內容沿用現有 `cleanText` 清理；單項長度上限沿用 `MAX_EXPLANATION_LENGTH`。

## 4. 資料對應（Final.md → 平台）

`FinalParser` 每題新增（選填）欄位：

```json
"explanationSupplement": {
  "concept": "…",
  "steps": ["…", "…", "…"],
  "pitfalls": ["…"],
  "note": ""
}
```

`PackageBuilder` 建立草稿時，若有任何題目含 `explanationSupplement`，寫出
`docs/TeachingMaterials/explanations/<materialId>.json`：

```json
{
  "materialId": "tm_123",
  "entries": [
    {
      "questionId": "tm_123_q1",
      "materialId": "tm_123",
      "question": "（由 Generate 腳本從 questionbank 複製，沿用既有行為）",
      "concept": "…",
      "steps": ["…"],
      "pitfalls": ["…"],
      "note": "",
      "figures": []
    }
  ]
}
```

- 與現有 `tm_1.json` 欄位**完全相同**，前端與 `GenerateExplanationSupplement.js` 的驗證不用改規則。
- 草稿階段不動 `js/data/ExplanationSupplementData.js`；**發布**（沿用既有 `docs/TeachingMaterials/scripts` 匯入流程）時才重新產生。既有教材包與既有 `tm_*.json` 一律不修改（符合「不得改動既有 tm_* 教材包」）。
- `GenerateExplanationSupplement.js` 目前的 `SOURCES` 是寫死清單，P2-4 改為「清單＋掃描 `explanations/tm_*.json` 中沒有對應 build 模組的檔案」。這是目前唯一需要改動既有腳本的地方。

## 5. 驗收（對應 M4）

- 單元：FinalParser 對 §6 的範例、舊格式（單行詳解）、缺標記、步驟過少、步驟編號跳號、標記出現在行中，各一項測試。
- 整合：以 §6 範例走 `createDraft` → `explanations/<id>.json` 通過 `GenerateExplanationSupplement.js --check` 的 `validateEntry`。
- 回歸：既有 `Q`／`V`、國文十五章節、現有 jest 243 項不得變動結果。
- M4 定義：新上傳教材中「每題有解題關鍵＋至少 2 步驟且通過 Validate」的比例；缺的題目一律列在 warnings，**不算通過**。

## 6. 範例與現況實測

輸入（同 §3 範例，節錄一題）經現行 `FinalParser.parseFinal` 的結果：

```
"explanation": "解題關鍵：由 sinθ 求對邊與斜邊，再補鄰邊。 步驟： (1) 設對邊 3、斜邊 5。 (2) 鄰邊 = √(5² − 3²) = 4。 (3) tanθ = 對邊/鄰邊 = 3/4。 易錯：把 tanθ 寫成 鄰邊/對邊。"
```

→ 結構標記還在文字裡，可由解析端拆回；因此 P2-2 **不需要改 AI 輸出的基本形狀**，只需新增標記解析並保留換行。

## 7. D5 確認結果（2026-11-19：四項全部採用）

1. 標記名稱與必填規則（§3 表）是否採用：`解題關鍵：`（必）、`步驟：`（必、≥2 步）、`易錯：`（選、可多條）、`補充：`（選）。
2. 不完整時「整題不產生補強、只警告」（§3）是否可接受，而不是退而求其次只存部分欄位。
3. 變式題本期不產生補強（§2-6）。
4. 示意圖 `figures` 上傳流程一律為空（§2-5）。

## 8. 已知限制（誠實說明）

- 本規格**尚未用真實 ChatGPT／Claude 輸出驗證**：AI 是否穩定遵守標記，要等週六用一份數學教材實跑才知道；解析端因此設計成「不完整就警告、不補」。
- 標記解析只保證結構，不保證數理內容正確。
- 國文／英文等非數理科的詳解擴充是否需要同樣標記，本草案不要求（保持現狀），可由 D5 一併決定。
