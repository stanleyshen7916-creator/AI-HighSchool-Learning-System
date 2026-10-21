# 圖解教材（互動）— Visual Lessons

2026-10-21 起，教材中心與學習助教可以顯示「互動圖解教材」：每一個公式／核心觀念都有一張教學卡，
學生可以拖動圖形、作答，答完逐步看圖解。第一份是高二數學第1章三角函數（tm_7，含補充題庫 tm_50、tm_57）。

教材包（`materials/tm_N/`）本身不修改；圖解教材是另外一個獨立的 HTML 檔。

## 檔案

| 檔案 | 用途 |
|---|---|
| `lessons/<科目>_<年級>_<章>_<主題>.html` | 一份完整的圖解教材。單一檔案，CSS／JS 全部內嵌，不使用 fetch、localStorage、import/export。只用 sessionStorage 記「我會了」進度。 |
| `js/data/VisualLessonData.js` | 登錄表：教材頁路徑、對應的 tm_N、每張卡片的 id／節次／標題／關鍵字。 |
| `js/utils/VisualLesson.js` | 依教材 id 找圖解教材；依文字或題目（knowledgePoint 優先）找最相關的公式卡片。 |
| `js/ui/VisualLessonFrame.js` | 以 iframe 顯示：整份（教材中心）、單一卡片（學習助教）、「看互動圖解」展開鈕（出題詳解）。 |
| `js/ui/VisualLessonReader.js` | 教材中心的全螢幕閱讀畫面（公式目錄、目前位置、「我會了」進度、文字教材分頁）。 |
| `css/components/visual-lesson.css` | 上述元件與教材卡片「互動圖解」標籤。 |
| `lessons/shared/LessonBoot.js`、`LessonRuntime.js`、`lesson.css` | 所有教材頁共用：載入模式、繪圖工具與 `widget()`、作答／逐步圖解／進度、與平台的 postMessage。每份教材頁只寫自己的卡片與圖。 |
| `scripts/VisualLessonCoverage.js` | 覆蓋率報告：哪些教材包還沒有圖解教材、題目有沒有都對應到卡片。 |

## 教材頁的三種載入方式

| 網址參數 | 用在 | 顯示 |
|---|---|---|
| （無） | 「開新分頁」 | 完整教材，跟隨系統深淺色 |
| `?embed=1&theme=light` | 教材中心「互動圖解」分頁 | 完整教材，可加 `#F10` 跳到卡片 |
| `?card=F10&theme=light` | 學習助教 | 只顯示一張卡片，並以 `postMessage({type:"ahs-visual-lesson:height"})` 回報高度，讓平台調整 iframe 高度 |

## 每張教學卡固定六段

1. 標頭：節次代碼、公式名稱、課本頁碼、來源標籤（依上傳教材／老師補充）
2. 老師說：高中老師口吻、口語化，用生活物件帶出公式意義
3. 公式：標準寫法與等價形式
4. 互動圖解：可拖動的圖，讀數列即時代入
5. 空間感＋常見錯誤
6. 小試身手：可作答的選擇題，錯誤選項各有「為什麼錯」，答完可逐步看圖解（上一步／下一步）

卡片 id 為 `F1`、`F2`…；小試身手為 `.qc[data-q="Fn"]`，逐步圖解為 `#s-Fn`（`tests/regression/VisualLessonRegression.js` 會檢查）。

## 新教材上架比照辦理（每一科都一樣）

1. 教材包上架後執行 `node docs/TeachingMaterials/scripts/VisualLessonCoverage.js --semester <學期>`，列出還沒有圖解教材的教材包。
2. 依六段格式做教材頁，放在本資料夾，載入 `shared/` 三個共用檔。題目與頁碼以課本原始檔核對；文科的「公式」以核心觀念、句型或因果關係取代。
3. 在 `js/data/VisualLessonData.js` 加一筆：`materialIds` 填該章所有 tm_N（課本＋補充題庫），卡片 `keywords` 以題庫的 `knowledgePoint` 用語為主。
   - 舊版教材庫（`data/materials/*.js`）的紀錄也可以放進 `materialIds`（填該檔的 `ID`）。
   - 一個教材包就是一整課（例如國文、英文的單課）、題目常常沒有關鍵詞時，用 `materialCards: { tm_N: "F3" }` 指定預設卡片；關鍵詞比對也只會在該卡片所屬的那一節裡進行。
   - 內容來源：教材頁的六段內容寫在 `src/<lessonId>.js`，用 `node docs/TeachingMaterials/scripts/BuildVisualLesson.js <lessonId>` 產生 html（測試會檢查兩者一致）。
   - 著作權：古典詩文可引用原文；現代文學、英文課文只說明意象、手法與句型，不整段引用。
4. 再跑一次覆蓋率報告，直到題目全部對應（`--strict` 不會失敗）。
5. 執行 `npm run verify`、`npm test`，以及 Playwright `visual-lesson-201`（會自動對每一份教材頁檢查：每題正解判對、逐步圖解走得完、每張圖都有畫出來、沒有腳本錯誤）。
