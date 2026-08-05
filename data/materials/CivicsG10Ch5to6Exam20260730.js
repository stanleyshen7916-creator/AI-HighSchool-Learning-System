/* data/materials/CivicsG10Ch5to6Exam20260730.js — Teaching Material Repository entry.

   Source material：台南市私立長榮中學 114 學年度第二學期 高一第三次段考
   公民與社會科試題卷（龍騰版第二冊 第5～6課：所有權／勞動三權／夫妻財產制
   與繼承）。Uploaded as 6 photographed pages covering 單選題第1～50題、
   題組一二（統計圖判讀）與簡答／計算題。

   Content honesty note (per Teaching Material Analysis workflow)：
   - questionBank.singleChoice below is a small, verified subset of the
     source exam (6 of 50 items) — each correctAnswer is derived
     independently from 民法/勞動基準法 principle (origin:
     "exam-transcript-verified"), not read off the paper's handwritten
     grading marks, since those marks were not reliably legible from the
     photographs. The remaining ~44 questions are NOT transcribed here
     to avoid asserting an answer key that cannot be verified.
   - questionBank.fillIn / trueFalse are AI-derived practice items
     (origin: "ai-derived") built from this material's core concepts,
     not verbatim exam content — kept separate and labeled so they are
     never mistaken for the teacher's original questions.
   This is a stub-scope analysis (per CLAUDE.md: 教材分析中心's parser
   chain is a stub) — sparse/partial transcription here is intentional,
   not an error. */
window.AHS = window.AHS || {};
(function () {
  "use strict";
  if (!AHS.MaterialRepository || typeof AHS.MaterialRepository.register !== "function") { return; }

  AHS.MaterialRepository.register({
    id: "civics-g10-ch5-6-exam-20260730",

    metadata: {
      subject: "civics",
      subjectLabel: "公民與社會",
      grade: "高一",
      semester: "第二學期",
      /* workspaceSchool/workspaceSemester — Sprint AI-120 (Workspace
         Repository Integration) AI-120-01: distinct field names from the
         pre-existing `semester` above ("第二學期", a real display string
         from the source exam paper's own school year, never read by any
         code today — confirmed via repo-wide grep) to avoid conflating
         it with AHS.WorkspaceData.semesters[].id ("g1s2"). Migrated to
         長榮中學／高一下學期, same target as the Package track's tm_1~4
         (Sprint AI-119 §9), same rule: no id/content change. */
      workspaceSchool: "cjsh",
      workspaceSemester: "g1s2",
      chapter: "第5～6課",
      unit: "所有權與物上請求權／勞動三權與勞動基準法／夫妻財產制與法定繼承",
      materialType: "考卷",
      textbook: "龍騰版第二冊",
      source: "台南市私立長榮中學 114學年度第二學期 高一第三次段考 公民與社會科試題卷",
      keywords: [
        "所有權", "所有權特性", "物上請求權", "所有物返還請求權", "妨害除去請求權",
        "妨害防止請求權", "勞動三權", "團結權", "團體協商權", "團體爭議權", "工會",
        "團體協約", "勞動基準法", "法定財產制", "共同財產制", "分別財產制",
        "剩餘財產分配請求權", "法定繼承", "應繼分", "特留分", "性別勞動參與率"
      ],
      difficulty: "中等～困難",
      questionCountInSource: { singleChoice: 44, groupItems: 6, computation: 3 },
      createdAt: "2026-07-30",
      updatedAt: "2026-07-30",
      analyzedBy: "Teaching Material Analysis Center"
    },

    coreConcepts: [
      { term: "所有權的排他性", definition: "同一標的物上不得同時存在兩個以上互不相容的所有權；共有時仍僅一個所有權，由共有人分享應有部分。" },
      { term: "所有權的絕對性（對世性）", definition: "所有權人得對任何人主張其權利，具有對世效力。" },
      { term: "所有權的直接支配性", definition: "權利人無須他人意思介入，即可直接支配、使用、收益、處分其標的物。" },
      { term: "所有權的優先性", definition: "同一標的物上物權與債權併存時，物權效力優先於債權。" },
      { term: "所有物返還請求權", definition: "所有權人對無權占有或侵奪其所有物之人，得請求返還原物。" },
      { term: "妨害除去請求權", definition: "對於已發生之妨害（如不實登記、越界建築），得請求除去。" },
      { term: "妨害防止請求權", definition: "對於尚未發生但有可能發生之妨害，得請求防止。" },
      { term: "勞動三權", definition: "團結權（籌組工會）、團體協商權（締結團體協約）、團體爭議權（罷工等爭議行為）三者合稱。" },
      { term: "個別勞動權與集體勞動權", definition: "個別勞動權指《勞動基準法》保障之最低勞動條件（工資、工時、休假等）；集體勞動權指透過工會集體行使的協商、爭議權利。" },
      { term: "法定財產制", definition: "夫妻未約定財產制時適用之制度；婚姻關係消滅時，雙方得就婚後財產（扣除因繼承或無償取得之財產與慰撫金）差額請求平均分配。" },
      { term: "約定財產制：共同財產制", definition: "夫妻財產（除特有財產外）合併為公同共有，關係消滅時原則上各半分割。" },
      { term: "約定財產制：分別財產制", definition: "夫妻各自保有財產之所有權、管理、使用收益及處分權，各自負擔債務。" },
      { term: "法定繼承與應繼分", definition: "配偶為當然繼承人，與直系血親卑親屬同為繼承人時，應繼分依人數平均計算。" },
      { term: "特留分", definition: "直系血親卑親屬、配偶之特留分為其應繼分之二分之一；遺囑處分逾越特留分部分，繼承人得行使扣減權。" }
    ],

    summary: {
      title: "公民與社會｜所有權、勞動三權與夫妻財產制、繼承 重點整理",
      keyPoints: [
        "所有權四大特性：排他性、絕對性（對世性）、直接支配性、優先性——常考陷阱是把「絕對性」誤解為「不可處分」，或把「排他性」與「絕對性」的定義互換。",
        "物上請求權三分法：已發生的妨害用「妨害除去請求權」，尚未發生的用「妨害防止請求權」，物被無權占有用「所有物返還請求權」。",
        "勞動三權＝團結權＋團體協商權＋團體爭議權；個別勞動權（《勞基法》最低標準）與集體勞動權（工會集體行使）需分清楚。",
        "夫妻財產制分「法定財產制」與「約定財產制（共同財產制／分別財產制）」；法定財產制下的剩餘財產分配，須先扣除因繼承或無償取得（贈與）之財產。",
        "法定繼承：配偶與直系血親卑親屬同為繼承人時應繼分平均分配；特留分為應繼分之二分之一，遺囑不得侵害。",
        "圖表判讀題常考：勞動參與率、結婚率、出生數等統計資料的正確推論，需注意「相關不等於因果」。"
      ],
      definitions: [
        "排他性：同一標的物不得同時存在兩個以上互不相容的所有權。",
        "絕對性：所有權人得對任何人（而非僅特定人）主張其權利。",
        "直接支配性：權利人得逕行支配標的物，無須他人意思介入。",
        "優先性：物權效力優先於同一標的物上併存之債權。",
        "特留分：法律保障繼承人最低限度可得繼承之比例，為應繼分之二分之一。"
      ],
      keywords: [
        "所有權特性", "物上請求權", "勞動三權", "團體協約", "法定財產制",
        "共同財產制", "分別財產制", "剩餘財產分配請求權", "法定繼承", "特留分"
      ]
    },

    questionBank: {
      singleChoice: [
        {
          id: "civics-g10-ch5-6-exam-20260730-q17",
          sourceRef: "原題第17題",
          origin: "exam-transcript-verified",
          questionForm: "概念題",
          text: "《民法》保障人民的私有財產權，包括對於物品的所有權和使用權，請問依據法律保障的物權特性，下列說明何者正確？",
          options: [
            { key: "A", text: "佳惠向小美借走手機，就會因此獲得小美手機的所有權" },
            { key: "B", text: "莉莉想完成賣掉電視的交易，必須做書面登記才算完成" },
            { key: "C", text: "立中買了一臺筆電，可因保護之相對性而主張其所有權" },
            { key: "D", text: "小佳和小玲合買一本書，但是這本書只會有一個所有權" }
          ],
          correctAnswer: "D",
          knowledgePoint: "所有權的排他性",
          difficulty: "中等",
          explanation: "共有情形下不論人數多寡，同一標的物仍只存在「一個」所有權，由共有人分享應有部分，此即所有權的排他性；(A)借用不移轉所有權，(B)動產所有權移轉以交付為要件而非登記，(C)「相對性」並非所有權特性用語（應為絕對性），皆為混淆用詞的陷阱選項。"
        },
        {
          id: "civics-g10-ch5-6-exam-20260730-q28",
          sourceRef: "原題第28題",
          origin: "exam-transcript-verified",
          questionForm: "概念配對題",
          text: "下列關於所有權特性與說明的配對，何者正確？",
          options: [
            { key: "A", text: "直接支配性：指權利人可以對「任何人」主張他擁有的權利" },
            { key: "B", text: "保護絕對性：是指一個標的物上不會同時存在兩個所有權，可以排除其他無權利人的干涉" },
            { key: "C", text: "排他性：不需他人意思的介入，由權利人支配自己所擁有的物品" },
            { key: "D", text: "優先性：對於同一標的物同時存有債權與物權時，物權效力會先於債權" }
          ],
          correctAnswer: "D",
          knowledgePoint: "所有權特性的定義配對",
          difficulty: "中等",
          explanation: "(A)所述其實是絕對性的定義，(B)所述其實是排他性的定義，(C)所述其實是直接支配性的定義——本題刻意將四個特性的定義互相對調，只有(D)優先性「物權效力先於債權」對應正確。"
        },
        {
          id: "civics-g10-ch5-6-exam-20260730-q37",
          sourceRef: "原題第37題",
          origin: "exam-transcript-verified",
          questionForm: "情境應用題",
          text: "李家在臺北市社子島擁有數筆土地，這些土地在日治時期登記的姓名為「李根勇」等157人分別共有。1932年，這些土地因自然環境變遷沉入河川而遭政府抹消登記。2002年，臺北市士林地政事務所公告這些土地重新浮出水面並編列新地號，然後在2007年登記為國有土地。李根勇的後代繼承人認為依《土地法》第12條規定，土地浮覆後所有權便應該回復，於是向法院提起訴訟，要求塗銷國有登記，以保障自己的所有權。根據《民法》相關規定，李家後代主張最符合哪兩個請求權？（浮覆地：原本是陸地的土地，因自然變遷或河川改道等原因而暫時成為水域，之後該土地又重新浮出水面成為陸地）",
          options: [
            { key: "A", text: "損害賠償請求權、所有物返還請求權" },
            { key: "B", text: "所有物返還請求權、妨害防止請求權" },
            { key: "C", text: "所有物返還請求權、妨害除去請求權" },
            { key: "D", text: "損害賠償請求權、妨害防止請求權" }
          ],
          correctAnswer: "C",
          knowledgePoint: "物上請求權三分法：除去 vs 防止",
          difficulty: "困難",
          explanation: "要求返還浮覆後的土地屬「所有物返還請求權」；塗銷國有登記是排除一個「已經發生」的妨害（不實登記），屬「妨害除去請求權」，而非尚未發生的「妨害防止請求權」，故正確組合為(C)。"
        },
        {
          id: "civics-g10-ch5-6-exam-20260730-q38",
          sourceRef: "原題第38題",
          origin: "exam-transcript-verified",
          questionForm: "計算題",
          text: "建中與明明於2024年9月結婚，建中婚前擁有財產1,000萬，離婚時財產總額為5,100萬，另有酒店欠款100萬。明明婚前擁有財產500萬，婚後建中贈與1,200萬、父母贈與結婚賀禮500萬，離婚時財產總額為4,500萬。兩人結婚時沒有約定夫妻財產制，且離婚後無另外約定，請問在剩餘財產分配請求權方面，建中應給明明多少金額？",
          options: [
            { key: "A", text: "850萬元" },
            { key: "B", text: "2,250萬元" },
            { key: "C", text: "2,000萬元" },
            { key: "D", text: "0元" }
          ],
          correctAnswer: "A",
          knowledgePoint: "法定財產制之剩餘財產分配計算",
          difficulty: "困難",
          explanation: "建中婚後淨額＝5,100－1,000（婚前財產）－100（債務）＝4,000萬；明明婚後淨額＝4,500－500（婚前財產）－1,200－500（無償取得之贈與，應排除）＝2,300萬；差額＝4,000－2,300＝1,700萬，平均分配後建中應給付明明1,700÷2＝850萬元。"
        },
        {
          id: "civics-g10-ch5-6-exam-20260730-q15",
          sourceRef: "原題第15題",
          origin: "exam-transcript-verified",
          questionForm: "計算題",
          text: "某富商去世後留下6,000萬元遺產，留有大房（已歿）之子女四人，及二房（未登記結婚）母子二人。該富商遺囑指定遺產由二房獨子一人繼承，若其他繼承人均主張特留分，請問該二房獨子最終可繼承多少遺產？",
          options: [
            { key: "A", text: "1,000萬" },
            { key: "B", text: "1,200萬" },
            { key: "C", text: "3,500萬" },
            { key: "D", text: "3,600萬" }
          ],
          correctAnswer: "D",
          knowledgePoint: "法定繼承應繼分與特留分計算",
          difficulty: "困難",
          explanation: "二房未辦理結婚登記不具配偶繼承權，但其獨子仍為直系血親卑親屬；連同大房子女四人，共5名子女為繼承人，應繼分各6,000÷5＝1,200萬，特留分為應繼分之二分之一即600萬。大房四名子女各主張特留分600萬，合計2,400萬；二房獨子最終取得6,000－2,400＝3,600萬元。"
        },
        {
          id: "civics-g10-ch5-6-exam-20260730-q16",
          sourceRef: "原題第16題",
          origin: "exam-transcript-verified",
          questionForm: "計算題",
          text: "顧寶有兩個兒子、一個女兒，其生前立遺囑將所有財產都指定給好朋友阿青繼承。過世後，留下1,000萬元，負債200萬元，顧寶的妻子與三個小孩依照遺囑與特留分的規定，各別可得到多少遺產？",
          options: [
            { key: "A", text: "各得100萬元" },
            { key: "B", text: "妻子600萬，孩子則均分200萬" },
            { key: "C", text: "妻子200萬，子女各得100萬" },
            { key: "D", text: "皆無權獲得" }
          ],
          correctAnswer: "A",
          knowledgePoint: "配偶與子女之應繼分及特留分計算",
          difficulty: "中等",
          explanation: "淨遺產＝1,000－200＝800萬；配偶與3名子女共4人平均分應繼分，各200萬；特留分為應繼分之二分之一，各100萬；遺囑全數指定給非繼承人阿青，妻子與3名子女均得依特留分規定各主張100萬元。"
        }
      ],
      fillIn: [
        {
          id: "civics-g10-ch5-6-exam-20260730-fib1",
          origin: "ai-derived",
          text: "所有權具有＿＿＿性，指同一標的物上不能同時存在兩個以上互不相容的所有權。",
          answer: "排他",
          knowledgePoint: "所有權的排他性"
        },
        {
          id: "civics-g10-ch5-6-exam-20260730-fib2",
          origin: "ai-derived",
          text: "勞動三權中，勞工籌組工會的權利稱為＿＿＿權。",
          answer: "團結",
          knowledgePoint: "勞動三權"
        },
        {
          id: "civics-g10-ch5-6-exam-20260730-fib3",
          origin: "ai-derived",
          text: "依《民法》規定，直系血親卑親屬之特留分為其應繼分之＿＿＿。",
          answer: "二分之一",
          knowledgePoint: "特留分"
        }
      ],
      trueFalse: [
        {
          id: "civics-g10-ch5-6-exam-20260730-tf1",
          origin: "ai-derived",
          text: "所有權人得對任何人主張其所有權，此為所有權之絕對性（對世性）。",
          answer: true,
          knowledgePoint: "所有權的絕對性"
        },
        {
          id: "civics-g10-ch5-6-exam-20260730-tf2",
          origin: "ai-derived",
          text: "共同財產制下，夫妻婚前財產不列入共同財產，仍歸各自所有。",
          answer: false,
          knowledgePoint: "約定財產制：共同財產制",
          explanation: "共同財產制下，除特有財產外，夫妻財產（不分婚前婚後）皆合併為公同共有。"
        },
        {
          id: "civics-g10-ch5-6-exam-20260730-tf3",
          origin: "ai-derived",
          text: "法定財產制下，因繼承取得之財產仍應列入婚後剩餘財產分配之計算。",
          answer: false,
          knowledgePoint: "法定財產制之剩餘財產分配",
          explanation: "因繼承或其他無償取得之財產及慰撫金，應自婚後財產中排除，不列入剩餘財產分配。"
        }
      ]
    },

    commonMistakes: [
      {
        concept: "所有權「絕對性」與「排他性」用詞混淆",
        misconception: "誤以為多人合購一物時，各自都取得完整所有權；或把「絕對性」理解成文字上的相對／絕對，而非「對世效力」。",
        correction: "共有情形下仍只有一個所有權，由共有人分享應有部分（排他性）；絕對性指所有權人得對任何人主張其權利（對世性）。",
        relatedQuestions: ["原題第17題", "原題第28題"]
      },
      {
        concept: "物上請求權三種類型混淆",
        misconception: "分不清「妨害除去請求權」（妨害已發生，如不實登記）與「妨害防止請求權」（妨害尚未發生但有可能發生）。",
        correction: "已發生的妨害（如遭他人不實登記為國有）應主張除去；尚未發生但有可能發生的妨害才主張防止。",
        relatedQuestions: ["原題第37題"]
      },
      {
        concept: "剩餘財產分配請求權計算漏項",
        misconception: "計算法定財產制剩餘財產分配時，忘記將「因繼承或無償取得之財產」（如父母贈與、結婚賀禮）自婚後財產中排除。",
        correction: "計算前應先扣除因繼承、無償取得之財產及慰撫金，再以雙方淨額之差額平均分配。",
        relatedQuestions: ["原題第38題"]
      },
      {
        concept: "未登記結婚配偶之繼承權判斷",
        misconception: "誤以為「未辦理結婚登記」的同居配偶仍具法定繼承權。",
        correction: "民法上以結婚登記為要件，未登記者不具配偶之法定繼承權；但其所生子女仍為被繼承人之直系血親卑親屬，具繼承權。",
        relatedQuestions: ["原題第15題"]
      }
    ],

    relatedMaterials: []
  });
})();
