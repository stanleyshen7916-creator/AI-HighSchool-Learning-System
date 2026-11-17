# QA｜英文 Lessons 4～6 單字克漏字（tm_103～tm_105）（長榮）Self-QA

AI：Claude
版本：Round 2
日期：2026-11-02
科目：英文（長榮高中 高二上）
單元：Lesson 4 Day of the Dead、Lesson 5 Kyoto: The Heart of Japan、Lesson 6 The Country of the Blind 的 Vocabulary & Phrases
SOURCE：Level 1：課本照片（雲端「仔功課／高二第一次月考／1101／1101-1」HEIC：IMG_1331～1334 p.88～95、IMG_1343～1345 p.112～117、IMG_1355～1358 p.136～143）
Self-QA：96 / 100
Cross Review：N/A（全部由 Claude 直接執行）
狀態：ROUND_2_PASS

## 1. 範圍與做法

- **需求**：英文 L4、L5、L6 的單字各自整理，做成「克漏字」方式背誦練習。
- **單字來源**：直接看課本 Vocabulary & Phrases 頁，逐字抄錄單字、詞性與中文。
  - tm_98～tm_100 的題庫只有每課約 10 題單字題，沒有完整字表，所以回到照片。
  - L4：Words for Production 25 個與衍生字、Idioms and Phrases 5 個、Words for Recognition 13 個，共 56 題。
  - L5：Words for Production 20 個與衍生字、Idioms and Phrases 5 個、Words for Recognition 6 個，共 43 題。
  - L6：Words for Production 24 個與衍生字、Idioms and Phrases 8 個、Words for Recognition 13 個，共 55 題。
- **題型**：每課一個教材包，全部是填充題（`fill_blank`）。
  - 每題一個空格，給首字母與字母數（例如 `j _ _ _ _ _`），題末附詞性與中文。
  - 學生輸入英文後按「確定答案」，自動批改；大小寫與前後空格不影響。
  - 答錯的字會進入知識弱點。
- **句子**：克漏字句子全部自編，不抄課本例句。
  - 空格只放要背的字。句子都寫成直接填原形就對的形式，不需要再加 -s、-ed。
- **片語提示**：只寫中文。例如「片語 紀念」，不寫英文「in honor of」，避免洩漏答案。
- **月考範圍**：三包都歸入第二次月考。
- **圖解教材**：三包都對應 ENG_H2_S2 的 L4／L5／L6 字彙卡片，VisualLessonCoverage 56/56、43/43、55/55。

## 2. 平台修改

- `js/utils/QuestionKind.js` 的 `gradable()`：
  - 原本只自動批改 12 字以內的短答，所以 transformation、participation、confrontation、for the sake of 等答案會被測驗略過。
  - 改為：一個英文單字或片語（只含字母、空格、連字號、撇號，30 字以內）也能自動批改。
  - 已確認現有教材沒有任何題目因此新增進入測驗，只影響這三包。
- `js/ui/QuestionCard.js`：答案是英文單字或片語時，輸入提示改成「拼出完整的英文單字或片語（大小寫不拘）」。原本的提示「數字可用分數、√、π」不適用。
- `tests/regression/QuestionKindRegression.js` 新增 6 項檢查：
  - 三包題數全部進入測驗。
  - 長單字與片語可以自動批改。
  - 拼錯算錯。
  - 題卡有輸入框與首字母提示。

## 3. HARD FAIL 檢查

| 項目 | 結果 | 說明 |
|---|---|---|
| 單字／中文錯誤 | 無 | 逐字對照課本頁面 |
| 答案不唯一 | 無 | 有首字母與字母數限制；同義字不會符合字數 |
| 提示洩漏答案 | 無 | 已用程式檢查，提示中不含答案字串（金閣寺一題原本有，已改） |
| 自動批改錯誤 | 無 | 154 題全部檢查：原字、大寫加空格都算對；少一個字母算錯 |

## 4. 已知限制

- p.94／p.117／p.142 的片語，空格只放片語的關鍵部分。例如 scare…to death 只填 scare，feast one's eyes on 只填 feast。片語其餘部分留在句子裡。
- 句子為自編，難度約為課本例句程度。如果要改成課本原句，需要另外決定是否引用。

## 5. Round 2（2026-11-16）：改為短文＋單選

- **需求**：克漏字改成以一篇文章呈現，要測的單字留空白，文章程度以高二為主；每個空格改成單選題。
- **做法**：154 題的單字與題號（`tm_103_q1`…）不變，錯題本與知識弱點的紀錄不會斷掉；題型由 `fill_blank` 改為 `single_choice`。
  - 共 19 篇自編短文：L4 七篇（每篇 8 格）、L5 五篇（8～9 格）、L6 七篇（7～8 格），每篇約 100～130 字。
  - 每格 4 個選項，答案位置輪替；干擾選項取自同一課的字表，詞性或字形與空格不符，或語意明顯不通；同義字（例如 mournful／sorrowful、splendid／magnificent／breathtaking、cemetery／graveyard）不放在同一格。
  - 題幹含整篇短文，本題空格以【(n) ______】標示，其他空格為 (n) ______；題目下方的出處寫「第 1–N 題為題組」，月考出題時整篇一起抽。
  - 詞性與中文移到解析：顯示原句、答案的詞性與中文，以及其他選項的意思。
- **平台修改**：`quiz.css`、`wrongbook.css`、`qiaoqiao.css` 的題幹加 `white-space: pre-line`，短文才會分段顯示。`QuestionKind.js`、`QuestionCard.js` 的英文拼字輸入邏輯沒有刪，其他教材仍可使用。
- **測試**：`QuestionKindRegression.js` 的克漏字區塊改驗 4 選 1、題幹含短文與唯一的本題空格、正確選項唯一、題卡有 4 個選項且沒有輸入框；`ExplanationSupplementRegression.js` 登記這三包的核准修改。
- **已知限制**：
  - 月考英文單選部分的題庫現在會包含這三包的克漏字題組（原本是填充題，不會進單選；依出題程式邏輯推得，未實際抽卷測過）。
  - 干擾選項的語意是人工逐格檢查，未經老師或其他 AI 複核。
  - `BuildVisualLesson --check` 對全部 25 個圖解教材都回報 STALE，不是這次修改造成的，疑為 Windows 換行字元差異。

## 6. Round 3（2026-11-16）：整篇短文一張卡片、每格自己的選單

- **問題**：Round 2 把每個空格做成一題，題幹重複整篇短文，一次只能答一格，不像克漏字。
- **做法**：題目與作答 key 不變（每格仍是一題，錯題本、統計照舊），改變的是畫面與題組：
  - 題幹加「（第 a–b 題為題組）」，產生器自動判定 `groupId`（tm_103 七組、tm_104 五組、tm_105 七組）；`questionNumber` 改為短文中的順序（題目 id 不變）。
  - 測驗頁（`QuizExamView.js`）：同一篇短文的題目畫成一張卡片（`QuestionCard.createCloze`），短文只出現一次，每個空格內嵌自己的下拉選單；選擇只存該格那一題的作答。上一題／下一題以整篇短文為單位。
  - 成績頁只列含該格的那一句；錯題本不再列「題組情境（前面的題目）」；月考頁整篇短文只在第一格印一次，其餘只列「第 n 格」與選項。
  - 新增 `js/utils/ClozeGroup.js`（解析短文與空格編號），`QuestionKindRegression.js` 新增卡片、作答、上一題／下一題的檢查。
- **已知限制**：測驗中心的「平時練習」逐題作答畫面（`QuizPracticeView.js`）與錯題本重做仍是一次一格，題幹含整篇短文並標示本題空格；尚未改成整篇一張卡片。
