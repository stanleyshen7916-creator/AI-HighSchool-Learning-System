# 教材上傳引擎（ai-engine/council）

原 [AI-Study-Council](https://github.com/stanleyshen7916-creator/AI-Study-Council) 的上傳與審議引擎，2026-09-29 併入學習平台。原 repo 保留不動。

在管理者自己的電腦以 Docker 執行（需要 GPU 跑 Ollama、CPU 跑 MinerU OCR），學習平台的 `upload.html`（僅 Admin 可見）透過它完成整條上架流程：

1. **上傳原始檔**：PDF、掃描／拍照的課本頁、MinerU 的 .md/.txt。OCR 用 MinerU，沒啟動時退回 Tesseract。原始檔會保留下來。
2. **三方初稿**：把上傳頁產生的 Prompt 貼到 ChatGPT、Gemini、Claude 網頁版，再把三份輸出貼回上傳頁。
3. **交叉審議**：本地 Qwen2.5 逐條對照教材本文裁決，產出 `Final.md`。
4. **建立教材包草稿**：`platform/PackageBuilder.js` 把 Final.md 轉成新的 `docs/TeachingMaterials/materials/tm_N/`。草稿的 `manifest.status` 為 `draft`，學生看不到。原始檔放進 `source/`。
5. **預覽 → 發布**：發布時走 repo 既有的 `RepositoryManager.prepare()` + `ImportManager.importAll()`。之後由管理者 `git commit` / `git push`，GitHub Pages 部署後學生才看得到。

## 為既有教材加題（2026-10-01）

上傳頁的「為既有教材加題」分頁，用來為已上架的教材補出新的練習題（`platform/SupplementBuilder.js`）。不呼叫任何 AI API，所有 AI 步驟都由管理者在網頁版操作：

1. **選教材與題數**：引擎依該教材的 `summary.json`（核心概念、定義、重點、易錯）與既有題目，產生出題 Prompt，貼到 Claude 網頁版。
2. **擷取題目**：貼回 Claude 的輸出。引擎擷取每題的題幹、選項、答案、詳解、知識點、難度，再產生只有題目、沒有答案的作答 Prompt。
3. **獨立作答**：把作答 Prompt 貼到**新的** Claude 對話。三方模式另外貼到 ChatGPT、Gemini。再把作答結果貼回。
4. **核對**：
   - 作答答案和出題答案不一致、作答者認為題目有問題、缺詳解、選項不足或重複、與既有題目相似 → **需人工確認**，預設不勾選。
   - 與既有題目或本批其他題重複 → **不能加入**。
5. **建立補充題庫草稿**：新增一份 `tm_N`，內容如下。之後的預覽、發布、刪除與上面相同。
   - `metadata.source = "補充題庫"`
   - `related.json` 指向原教材
   - `source/` 保留出題結果、作答結果與 `check-report.json`
6. **併入原教材題庫**：產生平台資料時（`GenerateTeachingMaterialData.js` 的 `mergeSupplements()`），補充題目會併入原教材的題庫。補充題庫本身不會成為一份教材，原教材的檔案完全不修改。

## 已上架資料的保護

- 引擎只會新增 `tm_<目前最大編號+1>`，資料夾若已存在就停止，不會覆寫。
- 發布與刪除只接受引擎自己建立、登記在 `<資料目錄>/platform-drafts.json` 的草稿。既有教材（tm_1…）一律拒絕操作。
- 已發布的教材包不能再透過引擎刪除。
- 如果還有其他教材包在等待匯入，發布會先停下來，避免順便把它們一起上架。
- `summary.json` 與 `questionbank.json` 只擷取 Final.md 裡實際寫出的內容，不自動補寫：
  - 題目必須同時有題號、(A)(B)… 選項和答案才會收錄，缺任何一項會列在警告裡。
  - 題目一律標示為 `AI_GENERATED`。
- 測試（`tests/platform.test.js`）在學習平台的暫存副本上執行，並比對既有教材包每個檔案的雜湊，確認前後完全一致。

## 啟動

雙擊 `啟動教材上傳引擎.bat`，完成後會自動開啟 http://localhost:3000/upload.html，請以 Admin 登入。

- 啟動器會先停止（stop，不刪除資料）舊的 AI-Study-Council Runtime，避免 port 3000 衝突。
- 執行期資料放在 `COUNCIL_DATA_DIR`，裡面包含 Final.md、上傳原始檔、MinerU 佇列、Ollama 模型與 MinerU 模型快取。
  - 未設定時，如果 `..\..\..\AI-Study-Council` 存在，會直接沿用舊資料夾（模型不必重新下載，既有的 Final.md 可以在上傳頁「使用既有的 Final.md」選到）。
  - 否則使用 `ai-engine/council/data/`（已列入 .gitignore）。
- 手動啟動：`docker compose -f ai-engine/council/docker-compose.yml up -d --build`。
- 引擎沒有登入機制，只綁在 `127.0.0.1`。來自其他網站的瀏覽器請求一律回 403。允許的來源是 localhost 和 GitHub Pages 正式站，可用 `COUNCIL_ALLOWED_ORIGINS` 追加。

## 開發與測試

```bash
npm ci --prefix ai-engine/council
npm run test:engine          # Jest：原 Council 的 109 項 + 平台整合 20 項（Ollama 以 mock 取代）
```

`server.js` 可以不經 Docker 直接執行：

```bash
COUNCIL_DATA_DIR=... PLATFORM_ROOT=... node server.js
```

`PLATFORM_ROOT` 預設是 repo 根目錄。
