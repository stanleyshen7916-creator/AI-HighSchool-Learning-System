/* data/materials/ChineseG11LiShangyinYeYuJiBei.js — Teaching Material Repository entry.

   Source material：私立長榮中學 高二國文「近體詩選」單元──李商隱〈夜雨寄北〉
   （課文本文與逐句注釋，2 頁照片）。

   Content honesty note：
   - 課文本文「君問歸期未有期，巴山夜雨漲秋池。何當共剪西窗燭，卻話巴山夜雨
     時。」為通行定本七言絕句，與照片內容相符。
   - 課本注釋照片可清楚辨識「巴山」「何當」「共剪西窗燭」「卻話」等重要詞語
     之解釋，已納入 coreConcepts／questionBank。
   - 全詩僅四句，可支撐之不重複題目數量最為有限，依使用者指示「無法達到50
     題可自動減少，不需為湊題而產生不必要的題目」，本課題目數明顯低於50題
     標準，僅提供扎實、不重複的題目。 */
window.AHS = window.AHS || {};
(function () {
  "use strict";
  if (!AHS.MaterialRepository || typeof AHS.MaterialRepository.register !== "function") { return; }

  var ID = "chinese-g11-lishangyin-yeyujibei";

  AHS.MaterialRepository.register({
    id: ID,

    metadata: {
      subject: "chinese",
      subjectLabel: "國文",
      grade: "高二",
      chapter: "第三課／近體詩選",
      unit: "李商隱〈夜雨寄北〉",
      materialType: "課本",
      source: "私立長榮中學 高二國文課本「近體詩選」單元：李商隱〈夜雨寄北〉（課文與注釋）",
      keywords: ["李商隱", "夜雨寄北", "七言絕句", "巴山夜雨", "西窗剪燭", "虛實交錯"],
      difficulty: "中等",
      createdAt: "2026-08-05",
      updatedAt: "2026-08-05",
      analyzedBy: "Teaching Material Analysis Center"
    },

    coreConcepts: [
      { term: "體裁與寫作背景", definition: "〈夜雨寄北〉為七言絕句，是李商隱寄給妻子（一說友人）之作，抒發羈旅思歸、渴望團聚之情。" },
      { term: "巴山", definition: "泛指東川一帶的山嶺，東川古為巴郡之地，詩中指詩人當時所在的異鄉。" },
      { term: "何當", definition: "「何日、何時」之意，此處表達對未來重逢的期盼與想像。" },
      { term: "共剪西窗燭", definition: "指一起在西窗下剪燭夜談。古代住家建築常坐北朝南，日常起居多在西面廂房；剪燭，剔除燭芯，使燭光復亮，以延長照明時間。「共剪西窗燭」後成為夫妻或朋友重逢夜談的代稱典故。" },
      { term: "卻話", definition: "「卻」為回過頭來、還、再之意，「卻話」即回過頭來以往事作為談論的話題。" },
      { term: "全詩結構：今昔虛實交錯", definition: "首句「君問歸期未有期」以問答方式開篇，寫歸期未定的無奈；「巴山夜雨漲秋池」為眼前實景；後兩句「何當共剪西窗燭，卻話巴山夜雨時」為虛寫，想像來日重逢、共剪燭花、夜談往事，將今夜的孤寂化為未來團聚的期待。" }
    ],

    summary: {
      title: "國文｜李商隱〈夜雨寄北〉重點整理",
      keyPoints: [
        "〈夜雨寄北〉為七言絕句，是李商隱寄給妻子（一說友人）之作，抒發羈旅思歸、渴望團聚之情。",
        "首句「君問歸期未有期」以問答方式開篇，寫出歸期未定的無奈與遺憾。",
        "「巴山夜雨漲秋池」實寫眼前巴山夜雨之景，池水因雨上漲，烘托愁緒瀰漫。",
        "「何當共剪西窗燭，卻話巴山夜雨時」為虛寫，想像來日重逢、共剪燭花、夜談往事，將今夜的孤寂化為未來團聚的期待。",
        "全詩今昔虛實交錯（實寫眼前夜雨、虛寫未來重逢），是李商隱最具代表性的抒情短詩之一，語言淺白而情意深摯。",
        "「西窗剪燭」後成為夫妻或朋友重逢夜談的代稱典故。",
        "「巴山夜雨」一詞在詩中前後呼應、重複出現，形成迴環往復的結構美感，深化思歸念遠之情。"
      ],
      definitions: [
        "巴山：泛指東川一帶的山嶺，東川古為巴郡之地。",
        "何當：何日、何時之意。",
        "共剪西窗燭：一起在西窗下剪燭夜談；剪燭指剔除燭芯、使燭光復亮，以延長照明時間。",
        "卻話：回過頭來、還、再以往事作為談論的話題。"
      ],
      keywords: ["李商隱", "七言絕句", "巴山夜雨", "西窗剪燭", "虛實交錯", "羈旅思歸"]
    },

    questionBank: {
      singleChoice: [
        { id: ID + "-q1", origin: "textbook-verified", questionForm: "文學常識", text: "〈夜雨寄北〉的體裁是？",
          options: [{ key: "A", text: "五言律詩" }, { key: "B", text: "七言絕句" }, { key: "C", text: "樂府詩" }, { key: "D", text: "詞" }],
          correctAnswer: "B", knowledgePoint: "文學常識：體裁", difficulty: "易",
          explanation: "〈夜雨寄北〉為七言絕句，全詩共四句。" },
        { id: ID + "-q2", origin: "textbook-verified", questionForm: "文學常識", text: "〈夜雨寄北〉最可能是李商隱寄給何人之作？",
          options: [{ key: "A", text: "寄給皇帝的奏疏" }, { key: "B", text: "寄給妻子（一說友人）的抒情詩" }, { key: "C", text: "寄給敵國的戰書" }, { key: "D", text: "寄給學生的訓誡文" }],
          correctAnswer: "B", knowledgePoint: "文學常識：寫作背景", difficulty: "中等",
          explanation: "〈夜雨寄北〉是李商隱寄給妻子（一說友人）之作，抒發羈旅思歸、渴望團聚之情。" },
        { id: ID + "-q3", origin: "textbook-verified", questionForm: "字詞注釋", text: "「巴山夜雨漲秋池」中「巴山」所指為？",
          options: [{ key: "A", text: "泛指東川一帶的山嶺" }, { key: "B", text: "特指四川峨嵋山" }, { key: "C", text: "詩人的故鄉" }, { key: "D", text: "傳說中的仙山" }],
          correctAnswer: "A", knowledgePoint: "字詞注釋", difficulty: "中等",
          explanation: "「巴山」泛指東川一帶的山嶺，東川古為巴郡之地。" },
        { id: ID + "-q4", origin: "textbook-verified", questionForm: "字詞注釋", text: "「何當共剪西窗燭」中「何當」意思是？",
          options: [{ key: "A", text: "何日、何時" }, { key: "B", text: "為什麼" }, { key: "C", text: "應當、理當" }, { key: "D", text: "竟然" }],
          correctAnswer: "A", knowledgePoint: "字詞注釋", difficulty: "易",
          explanation: "「何當」意為何日、何時，此處表達對未來重逢的期盼。" },
        { id: ID + "-q5", origin: "textbook-verified", questionForm: "字詞注釋", text: "「共剪西窗燭」中「剪」燭的目的是？",
          options: [{ key: "A", text: "剔除燭芯，使燭光復亮以延長照明時間" }, { key: "B", text: "熄滅蠟燭以便入睡" }, { key: "C", text: "裝飾蠟燭外觀" }, { key: "D", text: "測量時間流逝" }],
          correctAnswer: "A", knowledgePoint: "字詞注釋", difficulty: "中等",
          explanation: "剪燭指剔除已燒黑的燭芯，使燭光重新明亮，以便延長夜談的時間。" },
        { id: ID + "-q6", origin: "textbook-verified", questionForm: "字詞注釋", text: "古代住家建築常坐北朝南，日常起居（如讀書、寫字、接待熟識賓客、喝茶談天）多在何處？",
          options: [{ key: "A", text: "正廳" }, { key: "B", text: "西面廂房" }, { key: "C", text: "後花園" }, { key: "D", text: "門樓" }],
          correctAnswer: "B", knowledgePoint: "字詞注釋：文化背景", difficulty: "難",
          explanation: "古代住家建築常坐北朝南，日常起居多在西面廂房，故詩中言「西窗」而非其他方位的窗。" },
        { id: ID + "-q7", origin: "textbook-verified", questionForm: "字詞注釋", text: "「卻話巴山夜雨時」中「卻」字的意思最接近？",
          options: [{ key: "A", text: "可是、然而" }, { key: "B", text: "回過頭來、還、再" }, { key: "C", text: "拒絕、推辭" }, { key: "D", text: "退後、後退" }],
          correctAnswer: "B", knowledgePoint: "字詞注釋", difficulty: "中等",
          explanation: "「卻」在此作「回過頭來、還、再」解，「卻話」即回過頭來談論往事。" },

        { id: ID + "-q8", origin: "textbook-verified", questionForm: "內容理解", text: "首句「君問歸期未有期」所呈現的心境是？",
          options: [{ key: "A", text: "對歸期的自信與篤定" }, { key: "B", text: "歸期未定的無奈與遺憾" }, { key: "C", text: "對故鄉的厭倦" }, { key: "D", text: "對旅途風光的讚嘆" }],
          correctAnswer: "B", knowledgePoint: "內容理解：首句", difficulty: "易",
          explanation: "首句以問答方式開篇，「未有期」寫出歸期無法確定的無奈與遺憾。" },
        { id: ID + "-q9", origin: "textbook-verified", questionForm: "內容理解", text: "「巴山夜雨漲秋池」一句所寫的是？",
          options: [{ key: "A", text: "想像未來重逢之景" }, { key: "B", text: "詩人眼前的實景" }, { key: "C", text: "回憶少年時的往事" }, { key: "D", text: "神話傳說中的景象" }],
          correctAnswer: "B", knowledgePoint: "內容理解：句意判讀", difficulty: "中等",
          explanation: "「巴山夜雨漲秋池」是詩人當下所見的眼前實景，秋雨使池水上漲，烘托孤寂愁緒。" },
        { id: ID + "-q10", origin: "textbook-verified", questionForm: "內容理解", text: "「何當共剪西窗燭，卻話巴山夜雨時」所描寫的是？",
          options: [{ key: "A", text: "詩人此刻正在西窗下剪燭" }, { key: "B", text: "詩人想像未來重逢，共剪燭花、夜談此刻經歷的虛景" }, { key: "C", text: "詩人回憶過去與友人相聚的往事" }, { key: "D", text: "詩人描述巴山的地理景觀" }],
          correctAnswer: "B", knowledgePoint: "內容理解：句意判讀", difficulty: "中等",
          explanation: "此二句是詩人想像未來重逢時，共剪燭花、夜談此刻經歷的虛景，並非眼前實況。" },
        { id: ID + "-q11", origin: "textbook-verified", questionForm: "內容理解", text: "全詩四句中，何處為實寫、何處為虛寫？",
          options: [{ key: "A", text: "前兩句寫眼前實景，後兩句想像未來重逢之虛景" }, { key: "B", text: "全詩皆為實景" }, { key: "C", text: "全詩皆為想像" }, { key: "D", text: "前後兩句皆為回憶" }],
          correctAnswer: "A", knowledgePoint: "內容理解：虛實結構", difficulty: "中等",
          explanation: "前兩句「君問歸期未有期，巴山夜雨漲秋池」寫眼前實景與心境；後兩句則轉為想像未來重逢的虛景。" },

        { id: ID + "-q12", origin: "ai-derived", questionForm: "修辭與寫作手法", text: "本詩虛實交錯的寫作手法，最主要的藝術效果是？",
          options: [{ key: "A", text: "使讀者混淆詩人所在的地點" }, { key: "B", text: "將眼前的孤寂苦悶，轉化為對未來團聚的美好期待，深化情感張力" }, { key: "C", text: "純粹展示詩人的想像力，與情感無關" }, { key: "D", text: "刻意製造情節的懸疑感" }],
          correctAnswer: "B", knowledgePoint: "修辭與寫作手法：虛實交錯", difficulty: "中等",
          explanation: "透過虛實交錯，詩人將此刻的孤寂化為未來重逢時的美好談資，深化了思歸念遠之情的藝術張力。" },
        { id: ID + "-q13", origin: "ai-derived", questionForm: "修辭與寫作手法", text: "「巴山夜雨」一詞在詩中前後重複出現（第二句與第四句），這樣的寫作手法稱為？",
          options: [{ key: "A", text: "類疊（詞語重複出現，形成迴環呼應的結構美感）" }, { key: "B", text: "誇飾" }, { key: "C", text: "借代" }, { key: "D", text: "映襯" }],
          correctAnswer: "A", knowledgePoint: "修辭與寫作手法：類疊", difficulty: "中等",
          explanation: "「巴山夜雨」一詞前後重複出現，形成迴環往復的結構美感，此修辭手法稱為類疊。" },
        { id: ID + "-q14", origin: "ai-derived", questionForm: "修辭與寫作手法", text: "「君問歸期未有期」一句運用了何種修辭手法？",
          options: [{ key: "A", text: "設問（假借對方發問，帶出下文的抒懷）" }, { key: "B", text: "排比" }, { key: "C", text: "頂真" }, { key: "D", text: "誇飾" }],
          correctAnswer: "A", knowledgePoint: "修辭與寫作手法：設問", difficulty: "中等",
          explanation: "首句以「君問歸期」的設問方式開篇，藉此引出詩人歸期未定的無奈與後文的抒懷。" },

        { id: ID + "-q15", origin: "ai-derived", questionForm: "主旨與情意", text: "「巴山夜雨」一詞重複出現的用意，最主要是為了？",
          options: [{ key: "A", text: "單純描寫巴山的氣候特色" }, { key: "B", text: "使今昔呼應、虛實交織，將孤寂之境轉化為來日團聚的美好期待" }, { key: "C", text: "強調巴山夜雨對農作物的影響" }, { key: "D", text: "諷刺當地氣候多變" }],
          correctAnswer: "B", knowledgePoint: "主旨與情意", difficulty: "難",
          explanation: "「巴山夜雨」首句實寫眼前孤寂之景，末句則在想像的未來重逢對話中再次出現，今昔呼應、虛實交織，深化了思歸念遠、盼望團聚的情感張力。" },
        { id: ID + "-q16", origin: "ai-derived", questionForm: "主旨與情意", text: "本詩整體語言風格與情感基調，最適合以下列何者形容？",
          options: [{ key: "A", text: "語言淺白，情意深摯" }, { key: "B", text: "詞藻華麗，情感激昂" }, { key: "C", text: "用典繁複，議論說理" }, { key: "D", text: "語言艱澀，情感冷漠" }],
          correctAnswer: "A", knowledgePoint: "主旨與情意：風格", difficulty: "中等",
          explanation: "本詩語言淺白平易，卻情意深摯動人，是李商隱最具代表性的抒情短詩之一。" }
      ],
      fillIn: [
        { id: ID + "-fib1", origin: "textbook-verified", text: "〈夜雨寄北〉的體裁是七言＿＿＿。", answer: "絕句", knowledgePoint: "文學常識：體裁" },
        { id: ID + "-fib2", origin: "textbook-verified", text: "「君問歸期未有期，巴山夜雨漲秋＿＿。」", answer: "池", knowledgePoint: "課文默寫" },
        { id: ID + "-fib3", origin: "textbook-verified", text: "「何當共剪西窗燭」中「共剪西窗燭」後成為夫妻或朋友重逢＿＿＿的代稱典故。", answer: "夜談", knowledgePoint: "字詞注釋／文化典故" }
      ],
      trueFalse: [
        { id: ID + "-tf1", origin: "textbook-verified", text: "「巴山夜雨漲秋池」是詩人想像未來重逢時的虛景，並非眼前實景。", answer: false, knowledgePoint: "內容理解：虛實結構",
          explanation: "「巴山夜雨漲秋池」是詩人眼前的實景；「何當共剪西窗燭，卻話巴山夜雨時」才是想像未來的虛景。" },
        { id: ID + "-tf2", origin: "textbook-verified", text: "「巴山夜雨」一詞在詩中前後重複出現，形成迴環呼應的結構美感。", answer: true, knowledgePoint: "修辭與寫作手法：類疊" },
        { id: ID + "-tf3", origin: "textbook-verified", text: "本詩語言風格華麗艱澀，用典繁複。", answer: false, knowledgePoint: "主旨與情意：風格",
          explanation: "本詩語言淺白平易，情意卻深摯動人，並非詞藻華麗或用典繁複之作。" }
      ]
    },

    commonMistakes: [
      { concept: "誤把「巴山夜雨漲秋池」當成想像之景", misconception: "以為全詩四句都是詩人想像中的畫面，分不清實景與虛景。",
        correction: "前兩句「君問歸期未有期，巴山夜雨漲秋池」是眼前實景與心境的直接呈現；後兩句「何當共剪西窗燭，卻話巴山夜雨時」才是想像未來重逢的虛景，須明確區分。",
        relatedQuestions: [ID + "-q9", ID + "-q10", ID + "-q11", ID + "-tf1"] },
      { concept: "忽略「巴山夜雨」重複出現的藝術用意", misconception: "以為「巴山夜雨」在詩中重複出現只是隨意用詞、無特別作用。",
        correction: "「巴山夜雨」前後呼應，形成今昔虛實交織的結構美感，將此刻的孤寂轉化為未來重逢的美好談資，是全詩情感深化的關鍵設計。",
        relatedQuestions: [ID + "-q13", ID + "-q15"] }
    ],

    relatedMaterials: []
  });
})();
