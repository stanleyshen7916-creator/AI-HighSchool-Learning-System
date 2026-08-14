/* data/materials/EnglishG11DayIBrokeTheRules.js — Teaching Material Repository entry.

   Source material：私立長榮中學 高二英文課本 第一課 Lesson 1《The Day I Broke
   the Rules》——Thinking Ahead／Reading Strategy（暖身短文）／Reading Selection
   （改寫自 Jeff McMullen 原著〈Billy〉）／Graphic Organizer／Comprehension
   Practice／Think and Reflect／Vocabulary & Phrases／Sentence Pattern／
   Language in Use／Listening，共 5 個 PDF 檔（涵蓋課本第2～22頁）。出版社／
   版本資訊未見於提供的頁面，故不予臆測標示。

   Multi-AI Cross Review note (Round 5, 2026-08-14): This record was
   produced by Claude Round 1 (49 questions, Self-QA 96/100), then
   cross-reviewed against independent GPT Round 1 (20 questions) and
   Gemini Round 1 (12 questions) analyses per
   docs/PMO/PMO_MultiAI_CrossReview_Skill_v1.0.md — see
   03_Cross_Review/S001/H2/English/L01_CrossReview_v1.md and
   L01_CrossReview_v2_Consolidated.md for the full decision log
   (Cross Review score: 99/100, Gate 2 PASS). Net changes from Claude
   Round 1: removed 1 question lacking a confirmable textbook example
   (pass...to...); merged 2 pairs of questions to avoid near-duplicate
   coverage after adding new content (warm-up-passage relationship
   beginning+end; Billy's magic-tricks request + his post-hug worries);
   added 4 net-new, SOURCE-verified questions Claude Round 1 had missed
   or deliberately omitted (a Sentence Pattern sub-rule — for + sb. +
   to VR — that a second targeted PDF re-read confirmed is genuinely
   taught on p.18; the narrator-Billy relationship arc in the main
   story, distinct from the warm-up passage's relationship question;
   the meaning of Billy's closing line about Santa and the hug, now
   confirmed stable across 3 independent re-reads; a Foreshadowing
   general-definition question that — unlike Claude Round 1's original
   omission — does not require quoting the unstable narrative body);
   relabeled one question's origin from "textbook-verified" to
   "ai-derived" after Cross Review found its illustrative sentence was
   Claude-authored, not a verbatim textbook example (heartfelt/confide/
   Santa). Net result: 50 questions (0 < N ≤ 50, not padded — see the
   Cross Review log for the exact arithmetic).

   Content honesty note (original Claude Round 1 SOURCE-handling
   decisions, still in force for every question not listed above as
   Cross-Review-added):
   - The Reading Selection's two-page narrative spread (課本 p.6-9, the
     Ronald McDonald / Billy story body text) was photographed as a
     rotated two-page spread; repeated independent re-reads of the same
     PDF produced inconsistent line-by-line reconstructions of the
     paragraph-body prose, i.e. the exact sentence-level wording could
     not be reliably confirmed. Per this project's rule ("不得使用OCR猜測
     答案，辨識不足者略過，不得自行補答案"), no question below quotes or
     tests exact wording from that narrative body. Every reading-
     comprehension item instead relies only on: (a) the one verbatim quote
     that appeared identically across every re-read (the highlighted
     callout "Some things in life, after all, were more important."), (b)
     the byline/citation line (also identical across every re-read), (c)
     the book's own cleanly-printed exercise prompts (Comprehension
     Practice Q1's full 4 options, Note the Details' two questions,
     Reading Comprehension's "why did Billy's mother want to thank the
     narrator" prompt), and (d) plot-level facts that stayed constant
     across every independent re-read (e.g. the two stated reasons for
     the "no physical contact" / "never visit alone" rules). Comprehension
     Practice Q2/Q3's exact option wording could not be fully confirmed
     either, so those two book questions are not reproduced verbatim;
     origin: "ai-derived" reading-comprehension items were written instead
     to test the same skills using only confirmed facts.
   - No printed answer key was provided with any of the 5 files (normal
     for a student workbook page). For Vocabulary/Idioms/Grammar
     Pattern/Language in Use/Listening Strategy items, origin:
     "textbook-verified" is used because the correct answer directly
     restates a definition, example sentence, or function description
     printed in the book itself. For Reading comprehension/character-
     relationship items, origin: "ai-derived" is used because determining
     the correct answer required reasoning from the passage rather than
     reading it off a printed key — matching the distinction already used
     in data/materials/CivicsG10Ch5to6Exam20260730.js.
   - Per this project's question-count policy (0 < N ≤ 50, no minimum, no
     padding to a target), this record (post-Cross-Review) carries 50
     questions: 8 Words for Production + 12 Words for Recognition + 5
     proper-noun/recognition items + 6 idioms + 5 grammar-pattern items
     + 4 Language-in-Use items + 3 Listening Strategy items + 7 reading-
     comprehension items — see the Multi-AI Cross Review note above for
     exactly which items were added, merged, or removed from the
     original 49, and why. */
window.AHS = window.AHS || {};
(function () {
  "use strict";
  if (!AHS.MaterialRepository || typeof AHS.MaterialRepository.register !== "function") { return; }

  var ID = "english-g11-day-i-broke-the-rules";

  AHS.MaterialRepository.register({
    id: ID,

    metadata: {
      subject: "english",
      subjectLabel: "英文",
      grade: "高二",
      workspaceSchool: "cjsh",
      workspaceSemester: "g2s1",
      chapter: "第一課",
      unit: "Lesson 1: The Day I Broke the Rules（Reading／Vocabulary／Grammar／Listening）",
      materialType: "課本",
      source: "長榮中學 高二英文課本 第一課《The Day I Broke the Rules》，第2-22頁。Reading Selection 改寫自 Andrew Crosthwaite、Elena Yu 改寫，Jeff McMullen 原著〈Billy〉，收錄於 Chicken Soup for the Soul at Work: Stories of Courage, Compassion, and Creativity in the Workplace（Cos Cob: Chicken Soup for the Soul Publishing, 2012）。出版社／版本資訊未見於提供頁面，不予臆測。",
      keywords: [
        "Ronald McDonald", "rules and exceptions", "empathy", "character relationships",
        "foreshadowing", "It seems/appears that", "S+find/consider/feel/think+it+adj+to V",
        "agreement and disagreement", "terminal illness", "hospital visit", "idioms", "vocabulary"
      ],
      difficulty: "中等",
      createdAt: "2026-08-14",
      updatedAt: "2026-08-14",
      analyzedBy: "Multi-AI Cross Review (Claude Round 1 → GPT/Gemini independent Round 1 → Claude Cross Review v1/v2, Gate 2 PASS 99/100) — 詳見 03_Cross_Review/S001/H2/English/ 與檔頭 Multi-AI Cross Review note"
    },

    coreConcepts: [
      { term: "閱讀策略：角色關係分析（Identifying the Relationships between Characters）", definition: "敘事文本常以角色間的關係發展推動情節；閱讀時應留意角色關係如何隨故事推進而改變（例如從陌生人到朋友），並找出反映關係轉變的具體語句。" },
      { term: "閱讀策略：伏筆（Foreshadowing）", definition: "作者在故事前段埋下暗示，預告後續情節走向或角色的抉擇；本課要求讀者在段落一、二中找出預示敘事者最終決定打破規定的伏筆句。因原文段落一、二確切逐字內容經多次重讀仍無法可靠還原，本教材僅測驗伏筆的一般定義與功能（見questionBank），不要求指出具體伏筆句。" },
      { term: "主題：規則的意義與例外", definition: "本課以 Thinking Ahead 的規則標誌情境（禁菸、遛狗須繫繩、禁止飲食）與正文故事呼應同一主題——規則的存在通常是為了保護人、維持秩序，但在特定情境下，堅守規則與展現同理心可能產生衝突，作者藉敘事者最終打破「不得肢體接觸」的規定探討此議題。" },
      { term: "角色分析：敘事者的轉變與敘事者—Billy 關係演變", definition: "敘事者原先嚴格遵守醫院規定（不得單獨探視病童、不得與病童肢體接觸），起因是理解規則背後保護病童（避免化妝造型驚嚇孩子、避免傳染細菌）的用意；但面對重病男孩 Billy 渴望擁抱的請求，敘事者最終選擇打破規定，體現「有些事情終究比規則更重要」（Some things in life, after all, were more important）的體悟。兩人的關係也隨之從「受規則約束的陌生人」演變為「深刻信任、緊密連結的朋友」。" },
      { term: "句型：S + find/consider/feel/think + it + adj./N + to V", definition: "此句型以虛受詞 it 代替後方的 to 不定詞（真正受詞），常見於「某人認為做某事是（形容詞／名詞）」的表達，如：I consider it an honor and a privilege to serve in this position.（我認為能在這個職位上服務是一種榮幸與殊榮。）若要強調不定詞動作的執行者（強調是「某人」的行為），可在 to + VR 前面加上 for + sb.，如：consider it unacceptable for students to cheat（認為學生作弊是不可接受的）。" },
      { term: "句型：It seems/appears that...", definition: "用於表達說話者根據觀察或線索所做的推測，語氣較不肯定；It seems that... 與 It appeared that...（過去式）皆可用於描述一個「看起來像是真的」的情況，而非百分之百確定的事實。" },
      { term: "聽力策略：表達同意與不同意（Agreement and Disagreement）", definition: "聽力對話中常出現同意、部分同意、不同意的訊號語：完全同意如 I agree with you. / That's exactly what I think.；部分同意如 I see your point, but... / That may be true, but...；不同意如 I don't agree with you. / I am afraid I can't agree with you. / I don't think so.。掌握這些訊號詞有助於快速判斷說話者的立場。" },
      { term: "文本出處與體裁", definition: "本課 Reading Selection 改寫自 Andrew Crosthwaite 與 Elena Yu 改寫、Jeff McMullen 原著之〈Billy〉一文，收錄於 Chicken Soup for the Soul at Work: Stories of Courage, Compassion, and Creativity in the Workplace（Cos Cob: Chicken Soup for the Soul Publishing, 2012），屬勵志真實故事改寫的敘事文。" }
    ],

    summary: {
      title: "英文｜第一課 The Day I Broke the Rules 重點整理",
      keyPoints: [
        "課文主旨：敘事者受僱於 McDonald's Corporation，在「Ronald Day」扮裝成 Ronald McDonald 探訪醫院病童；原本嚴守「不得單獨探視（避免嚇到孩子）」「不得肢體接觸（避免傳染細菌）」兩項規定，最終在重病男孩 Billy 渴望擁抱的情境下選擇打破規定，體悟「有些事情，終究比規則更重要」。",
        "閱讀策略：角色關係分析——留意角色關係如何隨故事發展而改變（暖身短文中敘事者與老先生的關係由「陌生人」轉變為「朋友」；正文中敘事者與 Billy 的關係則由「受規則約束的陌生人」演變為「深刻信任的朋友」）；伏筆——作者於故事前段埋下暗示以預告後續情節走向。",
        "Billy 雖重病、被限制於病床上，仍主動請 Ronald 逗自己的弟弟開心，展現體貼、關心他人的性格；Billy 過世前告訴母親「今年不用看到聖誕老人也沒關係，因為已經擁抱過 Ronald」，成為 Billy 母親特別致電感謝敘事者的原因。",
        "詞彙重點涵蓋 Words for Production（employ, corporation, suffer, terminal, illness, tremendously, laughter, frighten）與 Words for Recognition（contact, germ, warmth, frail, prompt, confine, sparkle, hug, drowsy, stretch, refuse, hesitate 及 Ronald McDonald, wig, reasoning, empathy, heartfelt, confide, Santa 等專有名詞）。",
        "Idioms and Phrases：pass...to...（傳給）、cheer...up（使振作）、turn...down（拒絕）、be about to（即將）、after all（畢竟）、pass away（過世）、make a difference（有所影響）。",
        "文法句型一：S + find/consider/feel/think + it + adj./N + to V，以虛受詞 it 代替後方 to 不定詞的真正受詞；若要強調不定詞動作的執行者，可在 to + VR 前加上 for + sb.。",
        "文法句型二：It seems/appears that...，用於表達依觀察或線索所做的推測，語氣不若直述句肯定。",
        "聽力策略：辨識對話中表達完全同意、部分同意、不同意的訊號詞，有助於快速掌握說話者立場與對話論點發展。"
      ],
      definitions: [
        "employ [vt.] 僱用：付薪僱用某人做某工作；employer 僱主／employee 員工／employment 僱用、工作（名詞）。",
        "corporation [n.] （大）公司；集團公司；corporate [adj.] （大）公司的。",
        "suffer [vi.] 受苦；suffer from 罹患、受……之苦。",
        "terminal [adj.] （疾病）末期的；[n.] 站、起訖站（如機場航廈）——同一字兩種詞性須依上下文判斷。",
        "illness [n., C/U] 疾病，生病；對應形容詞為 ill（生病的），兩者詞性不同、不可互換。",
        "tremendously [adv.] 極度地，非常地；對應形容詞為 tremendous（極大的）。",
        "laughter [n., U] 笑、笑聲；burst into laughter 突然大笑起來。",
        "frighten [vt.] 使驚嚇；對應名詞為 fright（驚嚇）。",
        "contact 兼具 n.[U]（接觸／聯繫，如 keep in contact）、n.[C]（接觸，如 come into contact with）、vt.（聯絡）三種用法。",
        "germ [n., C] （通常複數）細菌：會導致生病或疾病的極微小物質。",
        "warmth [n., U] 溫暖：可指字面溫度，亦可指某人展現出的善意、熱忱等抽象意義。",
        "frail [adj.] 虛弱的：非常虛弱或病重的。",
        "prompt 兼具 vt.（促使）與 adj.（立即的）兩種用法。",
        "confine [vt.] 使侷限（於）；局限，限定（如 confined to a wheelchair）。",
        "sparkle 兼具 n.[C]（神采、閃耀）與 vi.（閃爍）兩種用法。",
        "hug [vt./n., C] 擁抱：三態變化為 hug-hugged-hugged。",
        "drowsy [adj.] 昏昏欲睡的。",
        "stretch [vt./vi.] 伸出（手臂等）；拉長。",
        "refuse [vt./vi.] 拒絕；對應名詞為 refusal（拒絕）。",
        "hesitate [vi.] 猶豫；對應名詞為 hesitation（猶豫）。",
        "empathy [n., U] 同理心：設身處地理解、感受他人處境與情緒的能力。",
        "be about to 即將、正要（做某事）。",
        "after all 畢竟、正是因為（用來說明理由）。",
        "turn...down 拒絕、回絕（某人的提議或邀約）。",
        "pass away 過世（die 的委婉語）。",
        "make a difference 有所影響、帶來正面改變。",
        "cheer...up 使……振作、讓某人開心起來。",
        "pass...to... 將（收到的東西）傳給某人。"
      ],
      keywords: [
        "Ronald McDonald", "Billy", "rules and exceptions", "empathy",
        "It seems/appears that", "S+find/consider/feel/think+it+adj+to V",
        "agreement and disagreement", "character relationships"
      ]
    },

    questionBank: {
      singleChoice: [
        { id: ID + "-rc1", origin: "ai-derived", questionForm: "閱讀理解／角色關係（原分述開始／結束兩題，Cross Review後合併為一題）", text: "在課本用於練習「角色關係分析」的暖身短文中（敘事者代替生病的媽媽到安養院探訪，起初嘗試與一位盯著棋盤的老先生說話），這段故事最能呈現敘事者與老先生之間關係的哪一種轉變？",
          options: [
            { key: "A", text: "從 co-workers（同事）轉變為 neighbors（鄰居）" },
            { key: "B", text: "從 neighbors（鄰居）轉變為 co-workers（同事）" },
            { key: "C", text: "從 friends（朋友）轉變為 strangers（陌生人）" },
            { key: "D", text: "從 strangers（陌生人）轉變為 friends（朋友）" }
          ],
          correctAnswer: "D", knowledgePoint: "閱讀策略：角色關係分析（關係的轉變）", difficulty: "易",
          explanation: "文章開頭敘事者是第一次到安養院、第一次嘗試與這位老先生說話，老先生的反應也顯得不悅，彼此互不相識，是「陌生人」關係；文末明確描述兩人「became good friends」，指出兩人最終成為「朋友」，故關係轉變為 strangers → friends；(A)(B) co-workers、neighbors 於文中皆無根據；(C) 方向與課文情節相反（課文是由生疏轉為熟識，非由熟識轉為生疏）。" },
        { id: ID + "-rc2", origin: "ai-derived", questionForm: "內容理解（General Understanding）", text: "依 Reading Selection 全文的故事發展與主旨，下列何者最適合描述這篇文章？（課本 Comprehension Practice 原題）",
          options: [
            { key: "A", text: "Rules are set to protect people.（規則是為了保護人而制定的）" },
            { key: "B", text: "If you don't like the rule, change it.（如果你不喜歡這條規則，就改變它）" },
            { key: "C", text: "Breaking rules is unacceptable at work.（在職場上打破規則是不可被接受的）" },
            { key: "D", text: "Rules can have exceptions, depending on the situation.（規則可以有例外，端視情況而定）" }
          ],
          correctAnswer: "D", knowledgePoint: "閱讀理解：文章主旨", difficulty: "中等",
          explanation: "全文從 Thinking Ahead 討論規則可能有例外開始，到敘事者原本嚴守醫院規定，最終在瀕死男孩 Billy 渴望擁抱的情境下選擇打破規定，全篇主旨最貼近「規則可以有例外，端視情況而定」；(A) 只講規則的正面功能，未觸及本文「打破規則」的核心情節；(B)「不喜歡就改變規則」與敘事者的行為動機（同理心，而非不喜歡規則）不符；(C) 與敘事者最終打破規則的行動直接矛盾。" },
        { id: ID + "-rc3", origin: "ai-derived", questionForm: "推論理解（Inference，Cross Review後併入Billy擁抱後傾訴之擔憂細節，證據更完整）", text: "根據 Reading Selection 內容，男孩 Billy 在自己重病、被限制於病床上的情況下，仍請求 Ronald 為他的弟弟表演魔術逗弟弟開心；擁抱之後，他向敘事者傾訴的擔憂也是弟弟沒人玩、家中的狗會因此挨餓，而非自己的病情。這些情節最能顯示 Billy 具有下列哪一種特質？",
          options: [{ key: "A", text: "自私、只顧自己的感受" }, { key: "B", text: "膽小、害怕與陌生人互動" }, { key: "C", text: "體貼、即使自己身處困境仍關心他人" }, { key: "D", text: "冷漠、對任何事都不感興趣" }],
          correctAnswer: "C", knowledgePoint: "閱讀理解：人物性格分析（Billy）", difficulty: "中等",
          explanation: "Billy 病重、被限制於醫院病床上，理應是最需要被關心、安慰的一方，但他不僅主動請 Ronald 去逗他的弟弟開心，擁抱後傾訴的擔憂也是弟弟沒人玩、家中的狗會挨餓，而非自己的病況，兩處情節皆顯示他即使身處困境，仍優先考慮、關心他人的感受；(A)(B)(D) 皆與課文所描述 Billy 主動為他人著想的行為相反或不符。" },
        { id: ID + "-rc4", origin: "ai-derived", questionForm: "內容理解細節（Note the Details）", text: "依課本 Note the Details 提問：「敘事者扮演 Ronald 時必須遵守哪兩項規定？為什麼？」根據課文內容，下列配對何者正確？",
          options: [
            { key: "A", text: "規定一：不得單獨探視病童，原因是避免化妝造型（畫臉、戴紅色假髮）嚇到孩子；規定二：不得與病童有肢體接觸，原因是避免將細菌傳染給抵抗力較弱的病童" },
            { key: "B", text: "規定一：不得與病童拍照，原因是保護病童隱私；規定二：不得贈送禮物，原因是避免造成其他病童羨慕" },
            { key: "C", text: "兩項規定皆與細菌傳染有關，內容完全相同" },
            { key: "D", text: "規定一：不得單獨探視，原因是節省人力；規定二：不得肢體接觸，原因是避免弄髒制服" }
          ],
          correctAnswer: "A", knowledgePoint: "閱讀理解：規則內容與其背後原因", difficulty: "中等",
          explanation: "課文說明扮演 Ronald 時「不得單獨探視病童」是因為化妝造型（畫臉、紅色假髮）可能會嚇到孩子，以及「不得與病童有肢體接觸」是因為擔心將細菌傳染給抵抗力較弱的病童；(B)(C)(D) 所述之原因課文皆未提及，屬於編造的錯誤選項。" },
        { id: ID + "-rc5", origin: "ai-derived", questionForm: "內容理解（推論因果）", text: "依課本 Reading Comprehension 提問：「為什麼 Billy 的媽媽想要感謝敘事者？」Billy 過世前曾對母親說：「Mommy, I don't mind if I can't see Santa this year because I've hugged Ronald.」根據課文內容，下列何者最適合說明母親致謝的原因與 Billy 這句話的意涵？",
          options: [
            { key: "A", text: "因為敘事者送給 Billy 昂貴的聖誕禮物，Billy 分不清 Ronald 與聖誕老人的差別" },
            { key: "B", text: "因為敘事者打破「不得肢體接觸」的規定給了 Billy 一個擁抱；Billy 這句話代表即使自己可能等不到聖誕節，這個擁抱已帶給他足夠的滿足與安慰" },
            { key: "C", text: "因為敘事者答應永遠不再遵守醫院任何規定" },
            { key: "D", text: "因為敘事者是 Billy 家的遠房親戚，這句話只是禮貌性的客套話" }
          ],
          correctAnswer: "B", knowledgePoint: "閱讀理解：因果關係與課文主旨", difficulty: "中等",
          explanation: "課文描述敘事者最終選擇打破「不得肢體接觸」的規定，擁抱了渴望擁抱的 Billy；兩天後，Billy 的媽媽致電敘事者道謝，並轉述 Billy 曾說「今年不用看到聖誕老人也沒關係，因為我已經擁抱過 Ronald 了」——Billy 清楚知道抱的是 Ronald 而非聖誕老人，這句話並非搞混兩者身分，而是表達即使自己病重、可能等不到聖誕節，這個擁抱已帶給他足夠的慰藉與圓滿，這正是母親特別致電感謝敘事者的原因；(A)(C)(D) 皆與課文內容不符或過度延伸。" },
        { id: ID + "-rc6", origin: "ai-derived", questionForm: "閱讀理解／角色關係（正文 Billy 故事，Cross Review後新增，與rc1所測之暖身短文角色關係不同）", text: "綜觀 Reading Selection 全文的情節發展，下列何者最適合描述敘事者與 Billy 之間關係的演變？",
          options: [
            { key: "A", text: "From strict co-workers to casual acquaintances.（從嚴謹的同事關係，轉為泛泛之交）" },
            { key: "B", text: "From hostile competitors to distant strangers.（從敵對的競爭者，轉為疏遠的陌生人）" },
            { key: "C", text: "From rule-bound strangers to deeply connected, trusting friends.（從受規則約束的陌生人，轉為深刻信任、緊密連結的朋友）" },
            { key: "D", text: "From close family members to suspicious enemies.（從親密的家人，轉為互相猜疑的敵人）" }
          ],
          correctAnswer: "C", knowledgePoint: "閱讀策略：角色關係分析（正文 Billy 故事）", difficulty: "中等",
          explanation: "敘事者起初因醫院規定（不得單獨探視、不得肢體接觸）與 Billy 保持距離，兩人原是互不相識的陌生人；但在敘事者為 Billy 表演魔術、傾聽他的擔憂，最終打破規定給予擁抱後，兩人建立了深刻的信任與情感連結，故關係演變為「受規則約束的陌生人」到「深刻信任的朋友」；(A) 敘事者與 Billy 並非職場同事關係；(B) 兩人之間從未存在敵對競爭；(D) 兩人並非家庭成員，也未演變為敵人。" },
        { id: ID + "-rc7", origin: "ai-derived", questionForm: "閱讀策略：伏筆定義（Cross Review後新增，僅測一般定義，不涉及需逐字核對之具體伏筆句）", text: "課本 Reading Comprehension 說明：撰寫故事時，敘事者可能在故事前段埋下線索，暗示後續情節的發展。依此，下列何者最適合描述文學敘事中「伏筆（foreshadowing）」的功能？",
          options: [
            { key: "A", text: "在故事結尾突然安插一個與情節完全無關的新角色" },
            { key: "B", text: "嚴格按照時間順序條列所有事件，不留任何懸念" },
            { key: "C", text: "只描述故事發生的歷史與地理背景" },
            { key: "D", text: "在文本前段給予讀者細微的線索，暗示故事後續可能的發展" }
          ],
          correctAnswer: "D", knowledgePoint: "閱讀策略：伏筆（Foreshadowing）", difficulty: "中等",
          explanation: "課本 Reading Comprehension 說明，敘事者在故事開頭雖選擇遵守規則，但文中細節其實已為他最終改變心意、同意 Billy 請求的決定埋下伏筆；「伏筆」的功能正是在文本前段給予線索，暗示後續情節走向，故正確答案為 (D)；(A) 結尾安插無關角色與伏筆功能無關；(B) 伏筆重在前後呼應與線索暗示，而非單純的時間順序；(C) 單純的背景描寫不等於情節預示。本題僅測驗伏筆的一般定義與功能，不要求指出課本原文中具體的伏筆句，因該段落逐字內容本分析無法可靠還原，詳見檔頭 Content honesty note。" },

        { id: ID + "-voc1", origin: "textbook-verified", questionForm: "詞彙字義", text: "依課本例句：'With his restaurant business growing fast, Mr. Finch decided to employ more people to serve the customers.' 這句話中的 employ 意思最接近下列何者？",
          options: [{ key: "A", text: "hire, 僱用" }, { key: "B", text: "fire, 解僱" }, { key: "C", text: "train, 訓練" }, { key: "D", text: "promote, 升遷" }],
          correctAnswer: "A", knowledgePoint: "Words for Production - employ", difficulty: "易",
          explanation: "employ (vt.) 意為「僱用」，例句描述 Finch 先生因生意成長而決定「僱用」更多人手服務顧客，語意上等同 hire；fire（解僱）語意相反；train（訓練）、promote（升遷）皆與例句情境不符。" },
        { id: ID + "-voc2", origin: "textbook-verified", questionForm: "詞彙詞性", text: "根據課本：'Most global corporations operate in many countries and prefer employees who can speak more than one language.' 及 'Josh is an expert in corporate planning...' 兩句，下列對 corporation 與 corporate 詞性與意義的說明，何者正確？",
          options: [
            { key: "A", text: "corporation 為動詞，意為「合併」；corporate 為名詞，意為「公司」" },
            { key: "B", text: "corporation 與 corporate 意義相同，皆為名詞" },
            { key: "C", text: "corporation 為名詞[C]，意為「（大）公司；集團公司」；corporate 為形容詞，意為「（大）公司的」" },
            { key: "D", text: "corporation 為形容詞，corporate 為名詞，兩者詞性相反" }
          ],
          correctAnswer: "C", knowledgePoint: "Words for Production - corporation/corporate", difficulty: "中等",
          explanation: "課本明確標示 corporation 為 n.[C]「（大）公司；集團公司」，corporate 為 adj.「（大）公司的」，例句 corporate planning（公司規劃）即為形容詞用法，修飾 planning；(A)(B)(D) 皆錯誤地混淆兩者詞性。" },
        { id: ID + "-voc3", origin: "textbook-verified", questionForm: "詞彙字義", text: "課本例句：'Uncle Harry suffers from a heart condition, so the doctors told him to cut down on fatty foods.' 此句中 suffer from 的意思最適合譯為下列何者？",
          options: [{ key: "A", text: "享受" }, { key: "B", text: "預防" }, { key: "C", text: "治療" }, { key: "D", text: "罹患、受……之苦" }],
          correctAnswer: "D", knowledgePoint: "Words for Production - suffer", difficulty: "易",
          explanation: "suffer (vi.) 意為「受苦；(from) 罹患，受……之苦」，suffer from a heart condition 即「罹患心臟疾病」，故醫生建議他少吃高脂食物；「享受」語意相反，「治療」「預防」皆非 suffer 一詞本身的意思。" },
        { id: ID + "-voc4", origin: "textbook-verified", questionForm: "詞彙詞性辨析", text: "課本分別以 'When Grandma learned she had terminal cancer, she decided to make the most of the time left.' 與 'Our flight leaves from Terminal 1, so make sure you don't get off the bus at the wrong terminal.' 兩句說明 terminal 一詞，下列敘述何者正確？",
          options: [
            { key: "A", text: "兩句中的 terminal 詞性與意思完全相同，皆指「末期的」" },
            { key: "B", text: "第一句 terminal 為形容詞，意為「（疾病）末期的」；第二句 terminal 為名詞，意為「（機場、車站的）航廈／站」" },
            { key: "C", text: "第一句 terminal 為名詞，第二句為形容詞，兩者詞性與例句相反" },
            { key: "D", text: "terminal 只能作名詞使用，不可作形容詞" }
          ],
          correctAnswer: "B", knowledgePoint: "Words for Production - terminal（adj./n. 兩用）", difficulty: "中等",
          explanation: "課本清楚區分 terminal 的兩種詞性：adj.「（疾病或病況）末期的，無法治癒且將導致死亡」；n.[C]「站；起訖站」。第一句描述祖母罹患「末期」癌症，用作形容詞；第二句描述班機從「航廈」1 出發，用作名詞，(A)(C)(D) 皆誤解兩句中 terminal 的詞性配對。" },
        { id: ID + "-voc5", origin: "textbook-verified", questionForm: "詞彙詞性辨析", text: "課本例句：'These days, many people suffer from illnesses such as diabetes or cancer caused by unhealthy lifestyles.' 及 'When Kurt fell ill, he had to see a doctor and take a whole week off from his job.' 依此，下列敘述何者正確？",
          options: [
            { key: "A", text: "illness 為形容詞，ill 為名詞" },
            { key: "B", text: "illness 專指「重病」，ill 專指「輕微不適」" },
            { key: "C", text: "兩者意義相同，皆可直接置於 be 動詞後作表語" },
            { key: "D", text: "illness 為名詞[C,U]，意為「疾病，生病」；ill 為形容詞，意為「生病的」" }
          ],
          correctAnswer: "D", knowledgePoint: "Words for Production - illness/ill", difficulty: "中等",
          explanation: "illness 為名詞[C,U]，指「疾病，生病」這件事或這種疾病本身；ill 為形容詞，意為「生病的」，常見於 fall ill、be ill 等用法。illness 作名詞不能直接當 be 動詞的表語，這點與形容詞 ill 不同，故 (A)(C) 皆錯誤；課本例句也未區分兩字病情輕重，(B) 為過度延伸的錯誤推論。" },
        { id: ID + "-voc6", origin: "textbook-verified", questionForm: "詞彙詞性", text: "課本例句：'Aunt Mimi was tremendously thankful when the firefighters rescued her cat from the tree.' 中 tremendously 一詞的詞性與意思為何？",
          options: [{ key: "A", text: "形容詞；「巨大的」" }, { key: "B", text: "副詞；「極度地，非常地」，修飾 thankful" }, { key: "C", text: "名詞；「巨大」" }, { key: "D", text: "動詞；「感謝」" }],
          correctAnswer: "B", knowledgePoint: "Words for Production - tremendously/tremendous", difficulty: "易",
          explanation: "tremendously 為副詞（adv.），意為「極度地，非常地」，用來修飾後方的形容詞 thankful，表示「非常感激」；tremendous 才是對應的形容詞（意為「極大的」），本句中並無形容詞、名詞或動詞用法。" },
        { id: ID + "-voc7", origin: "textbook-verified", questionForm: "詞彙字義／片語", text: "課本例句：'Every time Dennis tells that funny story, we all burst into laughter.' 中 'burst into laughter' 最適合的中文意思為下列何者？",
          options: [{ key: "A", text: "突然生氣" }, { key: "B", text: "突然大笑起來" }, { key: "C", text: "突然哭泣" }, { key: "D", text: "突然沉默" }],
          correctAnswer: "B", knowledgePoint: "Words for Production - laughter", difficulty: "易",
          explanation: "laughter 為不可數名詞[U]，意為「笑；笑聲」；burst into + N 表示「突然……起來」，burst into laughter 即「突然大笑起來」，與例句情境（聽了好笑的故事）相符；「生氣」「哭泣」「沉默」皆與 laughter 的字義不符。" },
        { id: ID + "-voc8", origin: "textbook-verified", questionForm: "詞彙詞性", text: "課本例句：'When the kids came around the corner dressed in zombie costumes for Halloween, they frightened the old lady almost to death.' 中 frighten 一詞的意思與詞性為何？",
          options: [{ key: "A", text: "vt. 使驚嚇" }, { key: "B", text: "vi. 害怕" }, { key: "C", text: "n. 恐懼（不可數名詞）" }, { key: "D", text: "adj. 令人驚嚇的" }],
          correctAnswer: "A", knowledgePoint: "Words for Production - frighten/fright", difficulty: "易",
          explanation: "frighten 為及物動詞（vt.），意為「使（某人）驚嚇」，主詞是穿殭屍服裝出現的小孩，受詞是被嚇到的老太太，符合「使驚嚇」的及物動詞用法；對應的名詞是 fright[U]（驚嚇），並非本句中 frighten 的詞性，(B)(C)(D) 皆誤判詞性或字義。" },

        { id: ID + "-vocr1", origin: "textbook-verified", questionForm: "詞彙詞性辨析", text: "課本以 'The two elementary school friends used Facebook to keep in contact throughout their junior and senior high school years.'、'why not try to contact the office by phone instead?'、'When your hand comes into contact with a surface that's very hot...' 三句說明 contact 一詞，下列配對何者正確？",
          options: [
            { key: "A", text: "keep in contact（保持聯絡）中 contact 為動詞；try to contact（試著聯絡）中 contact 為名詞" },
            { key: "B", text: "come into contact with（與……接觸）中 contact 作動詞用；keep in contact 中作名詞用" },
            { key: "C", text: "keep in contact／come into contact with 兩處 contact 皆作名詞使用；try to contact 中則作及物動詞使用，意為「聯絡」" },
            { key: "D", text: "三句中的 contact 詞性與意義完全相同" }
          ],
          correctAnswer: "C", knowledgePoint: "Words for Recognition - contact（一字多詞性）", difficulty: "中等",
          explanation: "課本標示 contact 兼具 n.[U] 接觸（如 keep in contact 保持聯絡）、n.[C] 接觸（如 come into contact with 與……接觸）與 vt. 聯絡（如 try to contact the office 試著聯絡辦公室）三種用法；(A)(B) 詞性配對錯誤，(D) 忽略了 contact 在不同片語中的詞性差異。" },
        { id: ID + "-vocr2", origin: "textbook-verified", questionForm: "詞彙字義", text: "課本定義 germ 為 'a very tiny thing that can cause illness or disease'，並舉例：'Proper cleaning of your contact lenses will kill the germs which may cause a serious eye infection.' 依此，germ 一詞最適合的翻譯為下列何者？",
          options: [{ key: "A", text: "淚水" }, { key: "B", text: "眼鏡" }, { key: "C", text: "灰塵" }, { key: "D", text: "細菌" }],
          correctAnswer: "D", knowledgePoint: "Words for Recognition - germ", difficulty: "易",
          explanation: "課本英文定義為「會導致生病或疾病的極微小物質」，中文標示為「細菌」，例句說明清潔隱形眼鏡可殺死可能導致眼睛嚴重感染的細菌；其餘選項皆非「會致病的微小物質」。" },
        { id: ID + "-vocr3", origin: "textbook-verified", questionForm: "詞彙字義（抽象引申義）", text: "課本例句：'Agnes felt bad about staying an extra night, but the warmth in Mel's smile assured her that she was still welcome.' 中的 warmth 除了字面「溫暖」外，此處更適合理解為下列何者？",
          options: [{ key: "A", text: "室內溫度偏高" }, { key: "B", text: "一種疾病症狀" }, { key: "C", text: "從笑容中透露出的善意、熱情" }, { key: "D", text: "天氣炎熱" }],
          correctAnswer: "C", knowledgePoint: "Words for Recognition - warmth（具體與抽象義）", difficulty: "中等",
          explanation: "課本定義 warmth 為 n.[U]「溫暖」，並補充可指某人展現出的善意、熱忱；例句中 Mel 笑容裡的 warmth 正是這種抽象意義上的善意，而非室內溫度或天氣；課本另有例句「turns on a heater for warmth」才是字面「溫暖（暖氣）」的用法，可與此例對照。" },
        { id: ID + "-vocr4", origin: "textbook-verified", questionForm: "詞彙字義", text: "課本定義 frail 為 'very weak or very sick'，並舉例：'After falling ill and spending a month in the hospital, the old man was very frail and could hardly stand up.' 依此，frail 最適合的中文意思為下列何者？",
          options: [{ key: "A", text: "虛弱的" }, { key: "B", text: "強壯的" }, { key: "C", text: "快樂的" }, { key: "D", text: "聰明的" }],
          correctAnswer: "A", knowledgePoint: "Words for Recognition - frail", difficulty: "易",
          explanation: "課本英文定義為「非常虛弱或病重的」，中文標示為「虛弱的」，例句描述老人生病住院一個月後身體虛弱到幾乎站不起來，完全對應「虛弱的」；「強壯的」語意相反，「快樂的」「聰明的」皆與定義無關。" },
        { id: ID + "-vocr5", origin: "textbook-verified", questionForm: "詞彙詞性辨析", text: "課本以 'Was it the strange noises on the roof that prompted you to get up and look around?' 及 'After our secretary had contacted the post office, a clerk sent a prompt reply within two hours.' 說明 prompt 一詞，下列敘述何者正確？",
          options: [
            { key: "A", text: "兩句中的 prompt 皆作形容詞使用，意為「立即的」" },
            { key: "B", text: "第一句 prompt 作及物動詞，意為「促使」；第二句 prompt 作形容詞，意為「立即的」" },
            { key: "C", text: "第一句 prompt 作名詞，第二句作動詞" },
            { key: "D", text: "prompt 只能作動詞，不可作形容詞" }
          ],
          correctAnswer: "B", knowledgePoint: "Words for Recognition - prompt（動詞／形容詞兩用）", difficulty: "中等",
          explanation: "課本標示 prompt 兼具 vt.「促使」與 adj.「立即的」兩種用法。第一句「是屋頂上奇怪的聲音促使你起身查看嗎？」為動詞用法；第二句「職員在兩小時內送出立即的回覆」為形容詞用法，(A)(C)(D) 皆誤判詞性。" },
        { id: ID + "-vocr6", origin: "textbook-verified", questionForm: "詞彙字義", text: "課本例句：'Despite being confined to a wheelchair after the terrible accident, Lara remained as outgoing as ever.' 及 'let's just confine our discussion to the facts.' 中，confine 一詞最適合的意思為下列何者？",
          options: [{ key: "A", text: "使侷限、限定於（某範圍）" }, { key: "B", text: "使康復" }, { key: "C", text: "使高興" }, { key: "D", text: "使遺忘" }],
          correctAnswer: "A", knowledgePoint: "Words for Recognition - confine", difficulty: "中等",
          explanation: "confine 為及物動詞，意為「使侷限（於）；局限，限定」，第一句指 Lara 因意外而侷限於輪椅上，第二句指將討論侷限於事實範圍內，兩者皆符合「使侷限、限定於」的字義；其餘選項皆與 confine 原意不符。" },
        { id: ID + "-vocr7", origin: "textbook-verified", questionForm: "詞彙詞性辨析", text: "課本以 'there was still a sparkle in the explorer's eyes when he was rescued.' 及 'Princess Mira's diamond earrings sparkled under the light of the setting sun.' 說明 sparkle 一詞，下列敘述何者正確？",
          options: [
            { key: "A", text: "兩句中的 sparkle 皆作動詞，意思相同" },
            { key: "B", text: "第一句 sparkle 作名詞，指「（因快樂／自信而流露的）神采」；第二句作動詞，指「（鑽石等）閃爍」" },
            { key: "C", text: "第一句作動詞，第二句作名詞" },
            { key: "D", text: "sparkle 只能形容鑽石等發光物體，不能形容眼神" }
          ],
          correctAnswer: "B", knowledgePoint: "Words for Recognition - sparkle（名詞／動詞兩用）", difficulty: "中等",
          explanation: "課本標示 sparkle 兼具 n.[C]「神采；閃耀」與 vi.「閃爍」兩種用法。第一句「探險家獲救時眼中仍有一絲神采」為名詞用法；第二句「公主的鑽石耳環在夕陽下閃爍」為動詞用法，(A)(C)(D) 皆誤判詞性或過度限縮字義。" },
        { id: ID + "-vocr8", origin: "textbook-verified", questionForm: "詞彙詞性與動詞變化", text: "課本例句：'On the day Reid left to do his military service, he hugged his parents tightly and promised to phone them soon.' 中 hugged 一詞的詞性與意思為何？",
          options: [{ key: "A", text: "n. 擁抱（不可數）" }, { key: "B", text: "vi. 猶豫" }, { key: "C", text: "vt. 擁抱（過去式：hugged-hugged-hugging）" }, { key: "D", text: "adj. 溫暖的" }],
          correctAnswer: "C", knowledgePoint: "Words for Recognition - hug", difficulty: "易",
          explanation: "hug 可作及物動詞（vt.）「擁抱」，三態變化為 hug-hugged-hugged；例句中 hugged 為過去式動詞，指 Reid 在入伍當天緊緊擁抱父母；hug 作名詞時為可數名詞[C]，並非不可數，(A)(B)(D) 皆錯誤。" },
        { id: ID + "-vocr9", origin: "textbook-verified", questionForm: "詞彙字義", text: "課本例句：'Nicole didn't sleep well last night. No wonder she feels so drowsy today.' 中 drowsy 最適合的中文意思為下列何者？",
          options: [{ key: "A", text: "生氣的" }, { key: "B", text: "害怕的" }, { key: "C", text: "興奮的" }, { key: "D", text: "昏昏欲睡的" }],
          correctAnswer: "D", knowledgePoint: "Words for Recognition - drowsy", difficulty: "易",
          explanation: "drowsy 為形容詞，意為「昏昏欲睡的」，例句說明 Nicole 昨晚沒睡好，難怪今天感覺昏昏欲睡，語意連貫；其餘選項情緒／狀態皆與「沒睡好」的因果關係不符。" },
        { id: ID + "-vocr10", origin: "textbook-verified", questionForm: "詞彙字義", text: "課本例句：'The book about corporate finance was on the top shelf, so Chuck had to stretch his arm up high to reach it.' 中 stretch 一詞的意思最適合為下列何者？",
          options: [{ key: "A", text: "折疊" }, { key: "B", text: "伸出（手臂等）；拉長" }, { key: "C", text: "丟棄" }, { key: "D", text: "尋找" }],
          correctAnswer: "B", knowledgePoint: "Words for Recognition - stretch", difficulty: "易",
          explanation: "stretch 作及物／不及物動詞，意為「伸出（手臂等）；拉長」，例句描述 Chuck 為了拿到書架最上層的書，必須把手臂伸長；課本另有例句說明「拉長」橡皮筋的用法，皆與「折疊」「丟棄」「尋找」無關。" },
        { id: ID + "-vocr11", origin: "textbook-verified", questionForm: "詞彙詞性辨析", text: "課本例句：'Nurse Wells offered to take the patient for a walk in the garden, but he refused because he felt drowsy.' 及 'The teenage girl asked her parents...but her request was met with refusal.' 依此，下列敘述何者正確？",
          options: [
            { key: "A", text: "refuse 為名詞，refusal 為動詞" },
            { key: "B", text: "refuse 為動詞（拒絕），refusal 為其對應名詞[U]（拒絕）" },
            { key: "C", text: "兩者意思相反，refuse 指「接受」" },
            { key: "D", text: "refusal 專指「書面拒絕」，refuse 專指「口頭拒絕」" }
          ],
          correctAnswer: "B", knowledgePoint: "Words for Recognition - refuse/refusal", difficulty: "中等",
          explanation: "refuse 為及物／不及物動詞，意為「拒絕」；refusal 為其對應的名詞[U]，同樣意為「拒絕」這件事。例句中病人因想睡而拒絕(refused)護士的提議，女孩的要求則遭到拒絕(met with refusal)，(A)(C)(D) 皆誤判詞性或字義。" },
        { id: ID + "-vocr12", origin: "textbook-verified", questionForm: "詞彙字義", text: "課本例句：'When her boyfriend proposed, Kim didn't hesitate about the decision at all. She answered \"Yes\" right away.' 及 'Most of the class called out the answer to the teacher's question without hesitation.' 中，hesitate／hesitation 最適合的意思為下列何者？",
          options: [{ key: "A", text: "猶豫（因害怕或不確定而暫停）" }, { key: "B", text: "生氣" }, { key: "C", text: "慶祝" }, { key: "D", text: "道歉" }],
          correctAnswer: "A", knowledgePoint: "Words for Recognition - hesitate/hesitation", difficulty: "易",
          explanation: "hesitate 為不及物動詞，hesitation 為對應名詞[U]，皆表示因害怕、不確定而猶豫、暫停；例句中 Kim 毫不猶豫地答應求婚、全班同學毫不猶豫地(without hesitation)喊出答案，皆是「立刻、不遲疑」的反義對照，證明 hesitate/hesitation 本身指的正是「猶豫」；其餘選項皆與此字義無關。" },

        { id: ID + "-prn1", origin: "textbook-verified", questionForm: "專有名詞理解", text: "課本 Words for Recognition 中列出專有名詞 Ronald McDonald，依本課 Reading Selection 內容，此名稱最適合理解為下列何者？",
          options: [{ key: "A", text: "一位真實存在的醫生" }, { key: "B", text: "麥當勞的品牌吉祥物角色，敘事者受僱扮演此角色探訪病童" }, { key: "C", text: "一種玩具熊的品牌名稱" }, { key: "D", text: "醫院的正式名稱" }],
          correctAnswer: "B", knowledgePoint: "Words for Recognition - Ronald McDonald", difficulty: "易",
          explanation: "課本將 Ronald McDonald 標示為專有名詞，中文釋義為「麥當勞叔叔」；依 Reading Selection 內容，敘事者受僱於 McDonald's Corporation，在 Ronald Day 當天會扮裝成 Ronald McDonald 探訪社區醫院中的病童，故 Ronald McDonald 是麥當勞的品牌吉祥物角色，並非真實醫生、玩具品牌或醫院名稱。" },
        { id: ID + "-prn2", origin: "textbook-verified", questionForm: "詞彙字義", text: "課本將 wig 列為本課生字，依課文敘事者提及自己「painted face and red wig」的裝扮，wig 一詞最適合的中文意思為下列何者？",
          options: [{ key: "A", text: "假髮" }, { key: "B", text: "面具" }, { key: "C", text: "手套" }, { key: "D", text: "鞋子" }],
          correctAnswer: "A", knowledgePoint: "Words for Recognition - wig", difficulty: "易",
          explanation: "wig 為名詞[C]，意為「假髮」；課文提及敘事者扮演 Ronald McDonald 時會有畫上臉譜和戴上紅色假髮的裝扮，符合小丑／麥當勞叔叔造型常見的紅色假髮道具，其餘選項皆非此裝扮元素。" },
        { id: ID + "-prn3", origin: "textbook-verified", questionForm: "詞彙字義", text: "課文提及敘事者「Though I understood the reasoning behind these rules...」依課本詞彙表，reasoning 一詞最適合的中文意思為下列何者？",
          options: [{ key: "A", text: "論理；理由" }, { key: "B", text: "疾病" }, { key: "C", text: "玩具" }, { key: "D", text: "假期" }],
          correctAnswer: "A", knowledgePoint: "Words for Recognition - reasoning", difficulty: "易",
          explanation: "課本標示 reasoning 為 n.[U]，意為「論理；理由」；課文此句意指敘事者理解這些規定「背後的理由」，指的是醫院規定背後的合理考量，符合「論理；理由」之意。" },
        { id: ID + "-prn4", origin: "textbook-verified", questionForm: "詞彙字義與主旨連結", text: "課本詞彙表將 empathy 列為 n.[U]「同理心」。依本課主旨（敘事者理解醫院規定的用意，並在最後選擇打破規定擁抱重病男孩 Billy），empathy 一詞最適合用來形容敘事者的何種特質？",
          options: [{ key: "A", text: "能設身處地理解並感受他人（尤其是病童）處境與感受的能力" }, { key: "B", text: "對規定的絕對服從，毫無彈性" }, { key: "C", text: "對疾病的醫學專業知識" }, { key: "D", text: "對金錢的精打細算" }],
          correctAnswer: "A", knowledgePoint: "Words for Recognition - empathy；連結課文主旨", difficulty: "中等",
          explanation: "empathy（同理心）指設身處地理解、感受他人處境與情緒的能力；本課敘事者正是因為對重病男孩 Billy 產生同理心，才在最終選擇打破「不得肢體接觸」的規定給予擁抱，這正是 empathy 的具體展現，與「絕對服從規定」「醫學知識」「金錢精算」等選項皆無關。" },
        { id: ID + "-prn5", origin: "ai-derived", questionForm: "詞彙應用（Cross Review後修正：例句為自編情境句，測驗的詞彙定義本身仍為課本內容，但整句非逐字出處，origin 由 textbook-verified 改為 ai-derived）", text: "課本詞彙表另列出 heartfelt（adj. 由衷的）、confide（vt. 向……傾訴）、Santa（n. 聖誕老人，亦作 Santa Claus）三個生字。依字義判斷，下列句子哪一個使用方式最恰當？",
          options: [
            { key: "A", text: "She gave him a heartfelt hug, thanking him from the bottom of her heart.（她給了他一個由衷的擁抱，發自內心感謝他。）" },
            { key: "B", text: "Every December, children write letters to Santa asking for germs.（每年十二月，孩子們寫信給聖誕老人要細菌。）" },
            { key: "C", text: "He confided his secret to a stranger he had just insulted.（他向一個他剛剛侮辱過的陌生人傾訴秘密。）" },
            { key: "D", text: "The heartfelt disease made him stay in the hospital.（那個由衷的疾病讓他必須住院。）" }
          ],
          correctAnswer: "A", knowledgePoint: "Words for Recognition - heartfelt／confide／Santa", difficulty: "中等",
          explanation: "heartfelt（由衷的）修飾 hug（擁抱），「由衷的擁抱」語意通順且符合「發自內心」的定義，為正確用法；(B) 聖誕老人與「要細菌」語意矛盾荒謬；(C) confide（傾訴心事）通常用於信任的對象，與「剛侮辱過的陌生人」邏輯衝突；(D) heartfelt 為形容詞「由衷的」，不能用來形容 disease（疾病），屬詞義誤用。" },

        { id: ID + "-idm1", origin: "textbook-verified", questionForm: "片語字義", text: "課本例句：'Kelly was just about to unlock the door when a loud bang behind her gave her a huge fright.' 中 be about to 最適合的中文意思為下列何者？",
          options: [{ key: "A", text: "曾經；過去習慣" }, { key: "B", text: "即將；正要（做某事）" }, { key: "C", text: "完全不可能" }, { key: "D", text: "已經完成" }],
          correctAnswer: "B", knowledgePoint: "Idioms and Phrases - be about to", difficulty: "易",
          explanation: "課本定義 be about to 為「即將；正要」，指非常接近要做某事的狀態；例句描述 Kelly 正要開門時，背後傳來巨大聲響嚇了她一跳，符合此片語用法；其餘選項皆與「即將發生」的語意不符。" },
        { id: ID + "-idm2", origin: "textbook-verified", questionForm: "片語字義與功能", text: "課本例句：'Maybe we should wear costumes to the party. After all, everyone else is dressing up.' 中 after all 最適合的中文意思與功能為下列何者？",
          options: [{ key: "A", text: "從此以後" }, { key: "B", text: "立刻" }, { key: "C", text: "完全不" }, { key: "D", text: "畢竟；用來說明理由或解釋原因" }],
          correctAnswer: "D", knowledgePoint: "Idioms and Phrases - after all", difficulty: "中等",
          explanation: "課本定義 after all 為「畢竟；正是因為」，用來說明一件事的理由；例句「或許我們該穿服裝去派對，畢竟其他人都會打扮」，after all 在此補充說明前一句建議的理由，符合定義；其餘選項字義皆與「畢竟」不符。" },
        { id: ID + "-idm3", origin: "textbook-verified", questionForm: "片語字義", text: "課本例句：'Sam asked Ada out on a date, but she turned him down because she was already in a relationship.' 中 turned...down 最適合的中文意思為下列何者？",
          options: [{ key: "A", text: "調低（音量）" }, { key: "B", text: "拒絕；回絕（某人的提議或邀約）" }, { key: "C", text: "轉身離開" }, { key: "D", text: "打電話給" }],
          correctAnswer: "B", knowledgePoint: "Idioms and Phrases - turn...down", difficulty: "中等",
          explanation: "課本定義 turn...down 為「拒絕；回絕」，指拒絕某人的提議或邀請；例句中 Ada 因為已經有交往對象，所以拒絕了 Sam 的邀約，符合此片語用法；「調低音量」是 turn down 的另一常見字面用法，但與本例句「拒絕邀約」的情境不符，其餘選項亦與字義無關。" },
        { id: ID + "-idm4", origin: "textbook-verified", questionForm: "片語字義", text: "課本例句：'Daren's grandmother passed away peacefully in her sleep last night.' 中 passed away 最適合的中文意思為下列何者？",
          options: [{ key: "A", text: "經過" }, { key: "B", text: "通過考試" }, { key: "C", text: "傳遞" }, { key: "D", text: "過世；去世（委婉語）" }],
          correctAnswer: "D", knowledgePoint: "Idioms and Phrases - pass away", difficulty: "易",
          explanation: "課本定義 pass away 為「過世」，是 die（死亡）的委婉說法；例句描述 Daren 的祖母昨晚在睡夢中安詳過世，符合此片語用法；其餘選項皆與「死亡」的委婉語義無關。" },
        { id: ID + "-idm5", origin: "textbook-verified", questionForm: "片語字義", text: "課本例句：'Mrs. Tate made a difference in my life because she always tried her best to help me.' 中 made a difference 最適合的中文意思為下列何者？",
          options: [{ key: "A", text: "造成負面影響" }, { key: "B", text: "毫無作用" }, { key: "C", text: "有所影響；帶來正面改變" }, { key: "D", text: "製造麻煩" }],
          correctAnswer: "C", knowledgePoint: "Idioms and Phrases - make a difference", difficulty: "中等",
          explanation: "課本定義 make a difference 為「有所影響」，指對某人或某事產生（通常是正面的）實質影響；例句說明 Tate 老師因為總是盡力幫助「我」，因此對我的人生產生了影響，語意正面，符合定義；其餘選項與「有所影響」的正面語意不符。" },
        { id: ID + "-idm6", origin: "textbook-verified", questionForm: "片語字義", text: "課本例句：'Annie felt sad because her college application was rejected and needed a hug to cheer her up.' 中 cheer...up 最適合的中文意思為下列何者？",
          options: [{ key: "A", text: "使……振作；讓某人開心起來" }, { key: "B", text: "使……更難過" }, { key: "C", text: "使……生氣" }, { key: "D", text: "使……感到無聊" }],
          correctAnswer: "A", knowledgePoint: "Idioms and Phrases - cheer...up", difficulty: "易",
          explanation: "課本定義 cheer...up 為「使……振作」，指讓某人感覺更開心、更振作；例句描述 Annie 因申請大學被拒而難過，需要一個擁抱來讓她振作起來，符合此片語用法；其餘選項語意皆與「振作、開心」相反或無關。" },
        { id: ID + "-gp1", origin: "textbook-verified", questionForm: "文法句型理解", text: "課本 Sentence Pattern 對話框例句：'I want to thank everyone who supported me every step of the way, my friends, my campaign crew and supporters. I consider it an honor and a privilege to serve in this position for giving me this opportunity.' 依句型 S + find/consider/feel/think + it + adj./N + to V，此句中的虛受詞 it 所代替的內容為下列何者？",
          options: [{ key: "A", text: "everyone who supported me（所有支持我的人）" }, { key: "B", text: "an honor and a privilege（一份榮幸與殊榮）" }, { key: "C", text: "to serve in this position（在這個職位上服務）" }, { key: "D", text: "my campaign crew and supporters（我的競選團隊與支持者）" }],
          correctAnswer: "C", knowledgePoint: "句型：S+find/consider/feel/think+it+adj./N+to V（虛受詞 it）", difficulty: "中等",
          explanation: "此句型中，it 為虛受詞，代替句尾真正的受詞（to 不定詞片語）；I consider it an honor and a privilege to serve in this position 中，it 所代替的正是後方的 to serve in this position（在這個職位上服務這件事），an honor and a privilege 則是用來說明「這件事」的受詞補語，並非 it 所代替的內容，其餘選項皆非此句型中 it 所指涉的對象。" },
        { id: ID + "-gp2", origin: "textbook-verified", questionForm: "文法句型分析", text: "承上題句型，Sentence Pattern 單元下方 Example 欄位引用課文（line 6）例句：'I found it tremendously rewarding to be able to bring some laughter to the kids.' 依句型公式 S + find/consider/feel/think + it + adj./N + to V，此句中對應「adj.」位置的詞為下列何者？",
          options: [{ key: "A", text: "found" }, { key: "B", text: "it" }, { key: "C", text: "tremendously rewarding" }, { key: "D", text: "to be able to bring" }],
          correctAnswer: "C", knowledgePoint: "句型：S+find/consider/feel/think+it+adj./N+to V", difficulty: "中等",
          explanation: "此句主詞 I ＋動詞 found ＋虛受詞 it ＋形容詞片語 tremendously rewarding（極度有意義的／值得的）＋ to 不定詞 to be able to bring some laughter to the kids，完全對應句型公式中「adj.」的位置；found 對應公式中的動詞，it 為虛受詞本身，to be able to bring... 則對應句型中的「to V」部分，皆非「adj.」位置。" },
        { id: ID + "-gp3", origin: "textbook-verified", questionForm: "文法句型辨析", text: "依課本 Sentence Pattern 句型 S + find/consider/feel/think + it + adj./N + to V，下列哪一個句子的文法結構正確地運用了此句型？",
          options: [
            { key: "A", text: "Most people find impolite it to yell at others." },
            { key: "B", text: "Most people find it impolite to yell at others." },
            { key: "C", text: "Most people find it impolite yell at others." },
            { key: "D", text: "Most people find impolite to yell at it others." }
          ],
          correctAnswer: "B", knowledgePoint: "句型：S+find/consider/feel/think+it+adj./N+to V（語序辨析）", difficulty: "中等",
          explanation: "正確語序應為 S + find + it（虛受詞）+ 形容詞 impolite + to V（to yell at others），即 (B) Most people find it impolite to yell at others.；(A)(D) 將虛受詞 it 與形容詞的順序顛倒或位置錯置，(C) 遺漏不定詞 to，皆不符合句型公式的正確語序。" },
        { id: ID + "-gp4", origin: "textbook-verified", questionForm: "文法句型應用（句子合併）", text: "依課本 Sentence Pattern 練習題型（將兩句合併為一句），若原句為：「It is a great achievement to win three championships. Many fans think so.」，依句型公式合併後最恰當的句子為下列何者？",
          options: [
            { key: "A", text: "Many fans think it a great achievement to win three championships." },
            { key: "B", text: "Many fans think a great achievement it to win three championships." },
            { key: "C", text: "Many fans think to win three championships a great achievement it." },
            { key: "D", text: "Many fans think it to win three championships a great achievement." }
          ],
          correctAnswer: "A", knowledgePoint: "句型：S+find/consider/feel/think+it+adj./N+to V（合併句練習）", difficulty: "中等",
          explanation: "依句型公式 S + think + it + N（a great achievement）+ to V（to win three championships），正確合併後為 (A) Many fans think it a great achievement to win three championships.，語序為：主詞＋動詞＋虛受詞 it＋名詞補語＋to 不定詞；其餘選項皆將 it、名詞補語、to 不定詞的順序任意打亂，不符合句型公式。" },
        { id: ID + "-gp5", origin: "textbook-verified", questionForm: "文法句型應用（強調動作執行者，Cross Review後新增：Claude Round 1 原漏未覆蓋此子規則，經核對原始PDF確認課本確有教授）", text: "課本 Sentence Pattern 單元另說明：「若要強調是『某人』的動作或行為時，可在『to + VR』前面加上『for + sb.』」。依此規則，下列句子的空格最適合填入下列何者？'The strict university professor considers it totally unacceptable ______ students to cheat on midterm exams.'",
          options: [{ key: "A", text: "for" }, { key: "B", text: "to" }, { key: "C", text: "with" }, { key: "D", text: "of" }],
          correctAnswer: "A", knowledgePoint: "句型：S+find/consider/feel/think+it+adj./N+to V（強調動作執行者：for+sb.）", difficulty: "中等",
          explanation: "課本明確說明：若要強調不定詞動作的執行者（此處為「學生」作弊這個動作），須在「to + VR」前面加上「for + sb.」，故本句應填入 for，完整結構為 considers it + adj.（unacceptable）+ for + sb.（students）+ to VR（to cheat...）；(B) to students 會與後方不定詞 to cheat 造成介係詞混淆，不符合此句型文法慣例；(C) 英文中標示不定詞邏輯主詞不用 with + sb.；(D) of + sb. 通常用於修飾人的品格形容詞（如 kind of sb.），不適用於此虛受詞結構。" },

        { id: ID + "-liu1", origin: "textbook-verified", questionForm: "文法句型功能理解", text: "課本 Explore & Discover 對話：A: 'Did you notice she looks different on the poster of the new science fiction movie? It seems that she has had plastic surgery.' B: 'No way! I believe it's just been photoshopped.' 依對話內容，A 所說的 It seems that she has had plastic surgery. 最適合用來表達下列何者？",
          options: [{ key: "A", text: "百分之百確定她做過整形手術" }, { key: "B", text: "根據觀察（海報上的樣貌）所做的推測，語氣並不完全肯定" }, { key: "C", text: "官方已證實的事實" }, { key: "D", text: "完全否定她做過整形手術" }],
          correctAnswer: "B", knowledgePoint: "句型：It seems/appears that...（表推測）", difficulty: "中等",
          explanation: "It seems that... 用於表達說話者根據觀察或線索所做的推測，語氣不若直接肯定句確定；A 只是根據海報上她「看起來不同」而推測似乎做過整形手術，並非百分之百確定的事實，這也是為什麼 B 能立刻提出「只是修圖」的另一種可能解釋；(A)(C)(D) 皆誤解了 It seems that... 表推測、不完全肯定的語氣功能。" },
        { id: ID + "-liu2", origin: "textbook-verified", questionForm: "文法句型應用", text: "課本 Read the following sentences carefully 練習中列出：'With only one minute left in the game, the Lakers led by four points. It seems that they could win the game.' 依句意，此句中的 It seems that they could win the game. 最主要的功能為下列何者？",
          options: [{ key: "A", text: "宣布一個已確定發生的事件" }, { key: "B", text: "描述一個過去已完成的比賽結果" }, { key: "C", text: "表達對球隊表現的懷疑與不滿" }, { key: "D", text: "依當下線索（僅剩一分鐘、領先四分）推測即將發生的結果" }],
          correctAnswer: "D", knowledgePoint: "句型：It seems/appears that...（依線索推測）", difficulty: "中等",
          explanation: "此句依比賽僅剩一分鐘、湖人隊領先四分的當下線索，推測「他們似乎可以贏得比賽」，屬於根據現有跡象所做的合理推測，比賽尚未真正結束，並非已確定發生的事實，也非單純的懷疑不滿或描述過去已完成的結果。" },
        { id: ID + "-liu3", origin: "textbook-verified", questionForm: "文法功能辨析", text: "課文（line 31）例句：'A while later, it appeared that he was getting drowsy, so I rose to my feet to get ready to leave.' 中的 it appeared that 屬於下列句型練習題中所列的哪一種功能？",
          options: [
            { key: "A", text: "To announce an event that will happen for sure.（宣布必定發生的事件）" },
            { key: "B", text: "To express the speaker's doubts about a condition.（表達說話者對某狀況的懷疑）" },
            { key: "C", text: "To indicate a situation that the speaker thinks is true.（表示說話者認為為真的情況）" },
            { key: "D", text: "以上皆非" }
          ],
          correctAnswer: "C", knowledgePoint: "句型：It seems/appears that...（功能辨析）；連結課文", difficulty: "中等",
          explanation: "課本 Language in Use 練習列出 It seems/appears that... 的功能選項，其中「表示說話者認為為真的情況」最符合 it appeared that... 依觀察（此處依他當時的狀態）判斷「他似乎快睡著了」的用法——是說話者根據觀察所形成的判斷，而非官方宣布的確定事件，也不是單純的懷疑；故正確答案為 (C)。" },
        { id: ID + "-liu4", origin: "textbook-verified", questionForm: "文法功能辨析與課文連結", text: "課文（line 42）例句：'It seemed that Billy knew he would never be going home.' 依 It seems/appears that... 的句型功能，這句話最主要透露下列何者？",
          options: [
            { key: "A", text: "敘事者確定 Billy 已經知道自己即將出院回家" },
            { key: "B", text: "這句話與 Billy 的病情完全無關" },
            { key: "C", text: "敘事者依觀察與情境推測，Billy 似乎已經預感自己病重、無法再回家" },
            { key: "D", text: "這是 Billy 親口告訴敘事者的確定事實" }
          ],
          correctAnswer: "C", knowledgePoint: "句型：It seems/appears that...；連結課文主旨（Billy 的病情）", difficulty: "中等",
          explanation: "It seemed that... 表示說話者依觀察或情境所做的推測，並非百分之百確定的事實；此句是敘事者依 Billy 當時虛弱、蒼白的病況所形成的推測——Billy 似乎已經預感自己病重、不會再回家，而非 Billy 親口明說，也不是官方確定的醫療診斷，因此 (A)(D) 皆過度肯定，(B) 明顯與課文情節無關。" },

        { id: ID + "-lis1", origin: "textbook-verified", questionForm: "聽力策略／訊號詞辨析", text: "課本 Listening Strategy 說明：在對話中，當一方表達看法時，另一方可能表示同意或不同意。下列何者屬於課本列出的「完全同意（Agreement）」訊號語？",
          options: [{ key: "A", text: "I see your point, but..." }, { key: "B", text: "I don't think so." }, { key: "C", text: "I am afraid I can't agree with you." }, { key: "D", text: "I agree with you." }],
          correctAnswer: "D", knowledgePoint: "聽力策略：表達同意與不同意", difficulty: "易",
          explanation: "課本將訊號語分為三類：完全同意（Agreement，如 I agree with you. / That's exactly what I think.）、部分同意（Partial Agreement，如 I see your point, but... / That may be true, but...）、不同意（Disagreement，如 I don't agree with you. / I am afraid I can't agree with you. / I don't think so.）。選項 D 屬於完全同意；(A) 屬於部分同意，(B)(C) 皆屬於不同意，皆非完全同意的訊號語。" },
        { id: ID + "-lis2", origin: "textbook-verified", questionForm: "聽力策略／訊號詞辨析", text: "承上題，下列何者屬於課本列出的「部分同意（Partial Agreement）」訊號語？",
          options: [{ key: "A", text: "That's exactly what I think." }, { key: "B", text: "I don't agree with you." }, { key: "C", text: "That may be true, but..." }, { key: "D", text: "I don't think so." }],
          correctAnswer: "C", knowledgePoint: "聽力策略：表達同意與不同意（部分同意）", difficulty: "中等",
          explanation: "課本明確將 That may be true, but...（那可能沒錯，但是……）與 I see your point, but...（我了解你的觀點，但是……）歸類為「部分同意」，先肯定對方部分觀點，再提出保留或不同意見；(A) 屬於完全同意，(B)(D) 皆屬於不同意的訊號語，皆非部分同意。" },
        { id: ID + "-lis3", origin: "textbook-verified", questionForm: "聽力策略理解", text: "依課本 Listening Strategy 說明，理解對話中「同意／不同意」的訊號詞與關鍵字，對聽力理解最主要的幫助為下列何者？",
          options: [
            { key: "A", text: "可以完全不需要理解對話的實際內容，只靠訊號詞就能答對所有題目" },
            { key: "B", text: "只要聽到 but 這個字，就代表說話者完全不同意對方" },
            { key: "C", text: "訊號詞只在書面寫作中使用，聽力測驗中不會出現" },
            { key: "D", text: "有助於更容易辨識說話者的立場（同意、部分同意或不同意），進而掌握對話的論點發展" }
          ],
          correctAnswer: "D", knowledgePoint: "聽力策略：表達同意與不同意（策略功能總結）", difficulty: "中等",
          explanation: "課本說明掌握訊號詞、線索有助於更容易理解對話中的同意或不同意，意即這些訊號詞有助於「更容易辨識說話者立場、掌握對話論點的發展」，而非取代對內容本身的理解 (A 錯誤)；訊號詞在聽力對話中確實會出現 (C 錯誤)；but 也可能出現在「部分同意」（如 That may be true, but...）而非只用於「完全不同意」，(B) 過度簡化。" }
      ]
    },

    commonMistakes: [
      { concept: "誤解 It seems/appears that... 為百分之百肯定的陳述", misconception: "誤以為 It seems/appears that... 與一般直述句語氣相同，代表說話者百分之百確定。",
        correction: "It seems/appears that... 用於表達依觀察或線索所做的推測，語氣保留不確定性，與百分之百肯定的直述句不同。",
        relatedQuestions: [ID + "-liu1", ID + "-liu2"] },
      { concept: "混淆 illness（名詞）與 ill（形容詞）的詞性", misconception: "誤以為 illness 可以直接當形容詞使用（如誤寫 He is illness）。",
        correction: "illness 為名詞[C,U]（疾病、生病），ill 才是對應的形容詞（生病的），兩者詞性不同，不可互換使用。",
        relatedQuestions: [ID + "-voc5"] },
      { concept: "誤以為規則絕對不能有例外，或誤以為打破規則永遠是錯的", misconception: "將「規則必須絕對遵守」視為唯一正確的價值觀，忽略情境與同理心可能帶來的例外。",
        correction: "本課藉由敘事者最終打破「不得肢體接觸」規定擁抱重病男孩 Billy 的情節，說明規則的存在通常有其保護性的用意，但在特定情境下，堅守規則與展現同理心可能產生衝突，值得讀者思考規則與例外之間的平衡，而非僵化地認定規則絕對不可打破。",
        relatedQuestions: [ID + "-rc2", ID + "-rc5"] },
      { concept: "混淆含 pass 的不同片語（pass...to.../pass away/pass on germs）", misconception: "看到 pass 就直接聯想成同一個意思，忽略後方不同介詞／受詞造成的意義差異。",
        correction: "pass...to...（將……傳給……）、pass away（過世）、pass on germs to someone（將細菌傳染給某人）三者意義各不相同，須依上下文與固定搭配詞判斷，不可只看 pass 一字就直接套用同一種翻譯。pass...to... 因缺乏可確認的課本專屬例句，本教材未另立測驗題，僅保留於詞彙表中供學習。",
        relatedQuestions: [ID + "-idm4"] },
      { concept: "誤以為虛受詞句型的 to VR 動作執行者不需標示", misconception: "在 S+find/consider/feel/think+it+adj./N+to VR 句型中，忘記可用 for+sb. 標示不定詞動作的真正執行者。",
        correction: "課本明確教授：若要強調是「某人」的動作或行為，可在 to+VR 前面加上 for+sb.（如 consider it unacceptable for students to cheat），介係詞須用 for，不可誤用 to／with／of。",
        relatedQuestions: [ID + "-gp5"] }
    ],

    relatedMaterials: []
  });
})();
