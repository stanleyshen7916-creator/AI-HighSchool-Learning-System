/* data/materials/ChineseG11HuangTingjianJiHuangJifu.js — Teaching Material Repository entry.

   Source material：私立長榮中學 高二國文「近體詩選」單元──黃庭堅〈寄黃幾復〉
   （題解、作者介紹、課文本文，4 頁照片）。

   Content honesty note：
   - 題解與作者段落依課本照片可清楚辨識之內容整理。
   - 課文本文照片翻拍角度大、部分文字遭手指遮擋，逐字 OCR 有困難；但透過
     照片中清晰可辨識之關鍵字詞（我居北海、君南海、桃李春風一杯酒、江湖
     夜雨十年燈、持家但有四立壁、治病不蘄三折肱、想得讀書頭已白、隔溪猿
     哭瘴溪藤），比對確認為黃庭堅傳世名篇之通行定本，並經使用者於對話中
     確認全文正確無誤，非憑空杜撰或逐字猜測照片內容。
   - 全詩八句，內容含大量典故與生難字詞，可支撐之不重複題目數量介於
     〈旅夜書懷〉與〈勞山道士〉之間，依內容豐富度提供，未強行湊題至50。 */
window.AHS = window.AHS || {};
(function () {
  "use strict";
  if (!AHS.MaterialRepository || typeof AHS.MaterialRepository.register !== "function") { return; }

  var ID = "chinese-g11-huangtingjian-jihuangjifu";

  AHS.MaterialRepository.register({
    id: ID,

    metadata: {
      subject: "chinese",
      subjectLabel: "國文",
      grade: "高二",
      /* workspaceSchool/workspaceSemester — Sprint AI-120 (Workspace
         Repository Integration): 長榮中學高二上學期，比照
         data/materials/CivicsG10Ch5to6Exam20260730.js 的既有欄位命名與
         用法（與上方 grade 顯示字串無關，AHS.WorkspaceData.semesters[].id
         格式）。使用者確認本課歸屬高二上學期。 */
      workspaceSchool: "cjsh",
      workspaceSemester: "g2s1",
      chapter: "第三課／近體詩選",
      unit: "黃庭堅〈寄黃幾復〉",
      materialType: "課本",
      source: "私立長榮中學 高二國文課本「近體詩選」單元：黃庭堅〈寄黃幾復〉（題解／作者／課文）",
      keywords: ["黃庭堅", "江西詩派", "寄黃幾復", "七言律詩", "桃李春風一杯酒", "江湖夜雨十年燈", "用典"],
      difficulty: "中等偏難",
      createdAt: "2026-08-05",
      updatedAt: "2026-08-05",
      analyzedBy: "Teaching Material Analysis Center"
    },

    coreConcepts: [
      { term: "作者：黃庭堅", definition: "字魯直，號山谷道人，北宋詩人、書法家，江西修水（分寧）人，江西詩派開創者。生於宋仁宗慶曆五年（1045），卒於宋徽宗崇寧四年（1105）。" },
      { term: "體裁與寫作背景", definition: "七言律詩，是黃庭堅寄贈遠在廣東四會任官的友人黃幾復所作，兩人相隔遙遠，藉詩寄託思念與人生感慨。" },
      { term: "首聯：我居北海君南海，寄雁傳書謝不能", definition: "感嘆彼此相隔南北兩地，路途遙遠，連傳統託雁傳書的方式都難以送達，極言相隔之遠、音訊之難通。" },
      { term: "頷聯：桃李春風一杯酒，江湖夜雨十年燈", definition: "千古名句：上句追憶昔日相聚歡飲的美好時光，下句感慨十年來各自漂泊、夜雨孤燈苦讀的境遇，今昔對比，情韻深長。" },
      { term: "頸聯：持家但有四立壁，治病不蘄三折肱", definition: "讚美黃幾復為官清廉（家徒四壁）；「治病不蘄三折肱」化用「三折肱知為良醫」之典，喻其經驗練達、處事得法，不必事事親身受挫才能領悟。" },
      { term: "尾聯：想得讀書頭已白，隔溪猿哭瘴溪藤", definition: "想像友人在瘴癘蠻荒之地苦讀已至白頭，猿啼溪藤，倍增淒涼與思念之情，是全詩情感的收束。" }
    ],

    summary: {
      title: "國文｜第三課（近體詩選）黃庭堅〈寄黃幾復〉重點整理",
      keyPoints: [
        "作者黃庭堅，字魯直，號山谷道人，江西修水（分寧）人，北宋詩人、書法家，江西詩派開創者，生於1045年，卒於1105年。",
        "本詩為七言律詩，是黃庭堅寄給遠在廣東四會任官的友人黃幾復所作，兩人相隔遙遠，藉詩寄託思念。",
        "首聯「我居北海君南海，寄雁傳書謝不能」感嘆兩地相隔遙遠，連雁足傳書都難以送達，極言音訊難通。",
        "頷聯「桃李春風一杯酒，江湖夜雨十年燈」為千古名句：上句追憶昔日相聚歡飲的美好時光，下句感慨十年來各自漂泊、夜雨孤燈的境遇，今昔對比，情韻深長。",
        "頸聯「持家但有四立壁，治病不蘄三折肱」讚美黃幾復為官清廉（家徒四壁）、行事練達得法（化用「三折肱知為良醫」之典）。",
        "尾聯「想得讀書頭已白，隔溪猿哭瘴溪藤」寫想像友人在瘴癘之地讀書已至白頭，猿啼溪藤，倍增淒涼與思念之情。",
        "全詩情感真摯，用典精鍊（雁足傳書、三折肱），是黃庭堅七律的代表作之一。"
      ],
      definitions: [
        "江西詩派：北宋以黃庭堅為宗主的詩歌流派，重視詩歌章法與字句錘鍊、講究用典。",
        "四立壁：家徒四壁，形容家境清貧、為官清廉。",
        "三折肱：典出「三折肱知為良醫」，比喻經歷多次挫折後累積出豐富經驗、精通此道，此處喻黃幾復處事練達，不待挫折即能領悟。",
        "瘴溪：瘴癘瀰漫的溪流之地，泛指南方蠻荒偏遠、氣候溼熱多疫病之地。"
      ],
      keywords: ["黃庭堅", "江西詩派", "七言律詩", "桃李春風一杯酒", "江湖夜雨十年燈", "用典", "三折肱"]
    },

    questionBank: {
      singleChoice: [
        { id: ID + "-q1", origin: "textbook-verified", questionForm: "文學常識", text: "黃庭堅，字為何？",
          options: [{ key: "A", text: "魯直" }, { key: "B", text: "子美" }, { key: "C", text: "留仙" }, { key: "D", text: "退之" }],
          correctAnswer: "A", knowledgePoint: "文學常識：作者字號", difficulty: "易",
          explanation: "黃庭堅字魯直。" },
        { id: ID + "-q2", origin: "textbook-verified", questionForm: "文學常識", text: "黃庭堅自號為？",
          options: [{ key: "A", text: "少陵野老" }, { key: "B", text: "山谷道人" }, { key: "C", text: "柳泉居士" }, { key: "D", text: "六一居士" }],
          correctAnswer: "B", knowledgePoint: "文學常識：作者自號", difficulty: "中等",
          explanation: "黃庭堅自號山谷道人。" },
        { id: ID + "-q3", origin: "textbook-verified", questionForm: "文學常識", text: "黃庭堅是下列哪一詩派的開創者？",
          options: [{ key: "A", text: "江西詩派" }, { key: "B", text: "山水詩派" }, { key: "C", text: "邊塞詩派" }, { key: "D", text: "花間詞派" }],
          correctAnswer: "A", knowledgePoint: "文學常識：詩派", difficulty: "中等",
          explanation: "黃庭堅是江西詩派的開創者。" },
        { id: ID + "-q4", origin: "textbook-verified", questionForm: "文學常識", text: "黃庭堅的籍貫為？",
          options: [{ key: "A", text: "江西修水（分寧）" }, { key: "B", text: "河南鞏縣" }, { key: "C", text: "山東淄川" }, { key: "D", text: "四川成都" }],
          correctAnswer: "A", knowledgePoint: "文學常識：籍貫", difficulty: "中等",
          explanation: "黃庭堅籍貫江西修水（分寧）。" },
        { id: ID + "-q5", origin: "textbook-verified", questionForm: "文學常識", text: "黃庭堅除了詩人身分，還擅長下列何種藝術？",
          options: [{ key: "A", text: "繪畫" }, { key: "B", text: "書法" }, { key: "C", text: "音樂" }, { key: "D", text: "建築" }],
          correctAnswer: "B", knowledgePoint: "文學常識：多重身分", difficulty: "中等",
          explanation: "黃庭堅是北宋詩人、書法家，兼擅詩藝與書法。" },
        { id: ID + "-q6", origin: "textbook-verified", questionForm: "文學常識", text: "〈寄黃幾復〉的體裁是？",
          options: [{ key: "A", text: "五言絕句" }, { key: "B", text: "七言律詩" }, { key: "C", text: "樂府詩" }, { key: "D", text: "詞" }],
          correctAnswer: "B", knowledgePoint: "文學常識：體裁", difficulty: "易",
          explanation: "〈寄黃幾復〉為七言律詩，全詩共八句。" },
        { id: ID + "-q7", origin: "textbook-verified", questionForm: "文學常識", text: "黃幾復當時在何處任官，使兩人相隔遙遠？",
          options: [{ key: "A", text: "廣東四會" }, { key: "B", text: "山東青島" }, { key: "C", text: "四川成都" }, { key: "D", text: "河南開封" }],
          correctAnswer: "A", knowledgePoint: "文學常識：寫作背景", difficulty: "中等",
          explanation: "黃幾復當時任官於廣東四會，與黃庭堅所在之地相隔遙遠。" },

        { id: ID + "-q8", origin: "textbook-verified", questionForm: "字詞注釋", text: "首聯「我居北海君南海，寄雁傳書謝不能」所表達的意思是？",
          options: [{ key: "A", text: "兩人相隔南北兩地，路途遙遠，連雁足傳書都難以送達" }, { key: "B", text: "兩人約定在北海相見" }, { key: "C", text: "詩人責怪友人不肯回信" }, { key: "D", text: "詩人描述北海的自然景觀" }],
          correctAnswer: "A", knowledgePoint: "字詞注釋／內容理解", difficulty: "中等",
          explanation: "「寄雁傳書謝不能」意為連傳統託雁傳書的方式都難以送達，極言相隔之遠、音訊難通。" },
        { id: ID + "-q9", origin: "textbook-verified", questionForm: "字詞注釋", text: "「桃李春風一杯酒」所描寫的是？",
          options: [{ key: "A", text: "昔日與友人相聚時春風和煦、把酒言歡的美好時光" }, { key: "B", text: "眼前正在飲酒賞花的場景" }, { key: "C", text: "對桃李樹木種植方法的描述" }, { key: "D", text: "對友人酒量的稱讚" }],
          correctAnswer: "A", knowledgePoint: "字詞注釋／內容理解", difficulty: "中等",
          explanation: "「桃李春風一杯酒」是詩人追憶昔日與友人相聚時春風和煦、開懷暢飲的美好時光。" },
        { id: ID + "-q10", origin: "textbook-verified", questionForm: "字詞注釋", text: "「江湖夜雨十年燈」所描寫的是？",
          options: [{ key: "A", text: "十年來彼此天各一方、各自於夜雨孤燈下漂泊苦讀的境遇" }, { key: "B", text: "詩人在江湖上經商致富的過程" }, { key: "C", text: "友人擔任漁夫十年的生活" }, { key: "D", text: "對江南夜景的單純描寫" }],
          correctAnswer: "A", knowledgePoint: "字詞注釋／內容理解", difficulty: "中等",
          explanation: "「江湖夜雨十年燈」感慨十年來兩人各自天涯漂泊、於夜雨孤燈下度過的艱辛歲月。" },
        { id: ID + "-q11", origin: "textbook-verified", questionForm: "字詞注釋", text: "「持家但有四立壁」中「四立壁」意思最接近下列何者？",
          options: [{ key: "A", text: "家徒四壁，形容家境清貧、為官清廉" }, { key: "B", text: "家中藏書豐富" }, { key: "C", text: "住宅四周築有高牆" }, { key: "D", text: "家族人丁興旺" }],
          correctAnswer: "A", knowledgePoint: "字詞注釋", difficulty: "中等",
          explanation: "「四立壁」即「家徒四壁」，形容家中一貧如洗，藉此讚美黃幾復為官清廉。" },
        { id: ID + "-q12", origin: "textbook-verified", questionForm: "字詞注釋", text: "「治病不蘄三折肱」中「三折肱」典出何種意涵？",
          options: [{ key: "A", text: "「三折肱知為良醫」，比喻經歷多次挫折後累積豐富經驗、精通此道" }, { key: "B", text: "形容一個人身體虛弱多病" }, { key: "C", text: "比喻做事三心二意、猶豫不決" }, { key: "D", text: "形容戰場上多次負傷" }],
          correctAnswer: "A", knowledgePoint: "字詞注釋：用典", difficulty: "難",
          explanation: "「三折肱」典出「三折肱知為良醫」，比喻歷經多次挫折、累積經驗後而精通某道。" },
        { id: ID + "-q13", origin: "textbook-verified", questionForm: "字詞注釋", text: "「治病不蘄三折肱」中「不蘄」意思是？",
          options: [{ key: "A", text: "不需要、不必等待" }, { key: "B", text: "非常渴望、迫切追求" }, { key: "C", text: "完全不了解" }, { key: "D", text: "堅決反對" }],
          correctAnswer: "A", knowledgePoint: "字詞注釋", difficulty: "難",
          explanation: "「蘄」意為祈求、期待，「不蘄」即不需要、不必等待，全句意指黃幾復處事練達，不必事事親身受挫才能領悟。" },
        { id: ID + "-q14", origin: "textbook-verified", questionForm: "字詞注釋", text: "「隔溪猿哭瘴溪藤」中「瘴溪」所指為？",
          options: [{ key: "A", text: "瘴癘瀰漫的溪流之地，泛指南方蠻荒偏遠、氣候溼熱多疫病之處" }, { key: "B", text: "清澈見底的山中溪流" }, { key: "C", text: "京城附近的護城河" }, { key: "D", text: "傳說中的仙境溪谷" }],
          correctAnswer: "A", knowledgePoint: "字詞注釋", difficulty: "中等",
          explanation: "「瘴溪」泛指瘴癘瀰漫的南方蠻荒偏遠之地，此處指黃幾復任官所在的廣東一帶。" },

        { id: ID + "-q15", origin: "textbook-verified", questionForm: "內容理解", text: "頷聯「桃李春風一杯酒，江湖夜雨十年燈」在時間結構上呈現何種對比？",
          options: [{ key: "A", text: "昔日歡聚的美好時光　與　十年來各自飄零的艱辛歲月" }, { key: "B", text: "白天的忙碌　與　夜晚的悠閒" }, { key: "C", text: "春天的繁花　與　秋天的落葉" }, { key: "D", text: "年輕時的無知　與　年老後的智慧" }],
          correctAnswer: "A", knowledgePoint: "內容理解：今昔對比", difficulty: "中等",
          explanation: "上句「桃李春風一杯酒」憶昔日歡聚，下句「江湖夜雨十年燈」轉寫十年飄零之境，形成強烈的今昔對比。" },
        { id: ID + "-q16", origin: "textbook-verified", questionForm: "內容理解", text: "頸聯「持家但有四立壁，治病不蘄三折肱」主要在讚美黃幾復的什麼特質？",
          options: [{ key: "A", text: "家財萬貫、生活富裕" }, { key: "B", text: "為官清廉、處事練達得法" }, { key: "C", text: "體弱多病、需要照顧" }, { key: "D", text: "熱衷交際、廣結人脈" }],
          correctAnswer: "B", knowledgePoint: "內容理解：頸聯", difficulty: "中等",
          explanation: "「四立壁」讚美其為官清廉；「不蘄三折肱」讚美其處事練達，不必事事親身受挫才能領悟。" },
        { id: ID + "-q17", origin: "textbook-verified", questionForm: "內容理解", text: "尾聯「想得讀書頭已白，隔溪猿哭瘴溪藤」所描寫的是？",
          options: [{ key: "A", text: "詩人回憶自己年輕時苦讀的經歷" }, { key: "B", text: "詩人想像友人在瘴癘之地苦讀已至白頭的處境" }, { key: "C", text: "詩人描寫溪邊猿猴嬉戲的趣味景象" }, { key: "D", text: "詩人邀請友人一同歸隱山林" }],
          correctAnswer: "B", knowledgePoint: "內容理解：尾聯", difficulty: "中等",
          explanation: "尾聯是詩人想像友人在瘴癘蠻荒之地讀書已至白頭，猿啼溪藤，倍增淒涼思念之情。" },
        { id: ID + "-q18", origin: "textbook-verified", questionForm: "內容理解", text: "全詩八句的情感發展脈絡，最貼近下列何者？",
          options: [{ key: "A", text: "感嘆相隔遙遠→今昔對比感慨→讚美友人品格→想像友人處境、深化思念" }, { key: "B", text: "純粹描寫自然景物，無情感起伏" }, { key: "C", text: "從喜悅逐漸轉為憤怒" }, { key: "D", text: "全詩皆為對仕途的批判議論" }],
          correctAnswer: "A", knowledgePoint: "內容理解：全詩結構", difficulty: "難",
          explanation: "首聯感嘆相隔遙遠，頷聯今昔對比感慨，頸聯讚美友人為官清廉練達，尾聯想像友人處境、深化思念，情感層層推進。" },

        { id: ID + "-q19", origin: "ai-derived", questionForm: "修辭與寫作手法", text: "「桃李春風一杯酒，江湖夜雨十年燈」一聯主要運用了何種寫作手法？",
          options: [{ key: "A", text: "今昔對比，凸顯歲月流逝、聚散無常" }, { key: "B", text: "誇飾與排比" }, { key: "C", text: "純粹寫景，不含情感" }, { key: "D", text: "頂真與類疊" }],
          correctAnswer: "A", knowledgePoint: "修辭與寫作手法：今昔對比", difficulty: "中等",
          explanation: "此聯以「桃李春風」對比「江湖夜雨」、「一杯酒」對比「十年燈」，形成強烈的今昔對比，凸顯歲月流逝、聚散無常的感慨。" },
        { id: ID + "-q20", origin: "ai-derived", questionForm: "修辭與寫作手法", text: "「治病不蘄三折肱」一句所使用的修辭手法是？",
          options: [{ key: "A", text: "用典（化用「三折肱知為良醫」的典故）" }, { key: "B", text: "譬喻" }, { key: "C", text: "誇飾" }, { key: "D", text: "設問" }],
          correctAnswer: "A", knowledgePoint: "修辭與寫作手法：用典", difficulty: "中等",
          explanation: "此句化用「三折肱知為良醫」的典故，屬於用典的寫作手法。" },
        { id: ID + "-q21", origin: "ai-derived", questionForm: "修辭與寫作手法", text: "「寄雁傳書謝不能」一句，藉由「雁足傳書」的典故，主要表達何種效果？",
          options: [{ key: "A", text: "以無法傳書的遺憾，極言兩地相隔之遙遠" }, { key: "B", text: "諷刺大雁不夠聰明" }, { key: "C", text: "讚美友人擅長飼養大雁" }, { key: "D", text: "描寫大雁遷徙的季節規律" }],
          correctAnswer: "A", knowledgePoint: "修辭與寫作手法：用典", difficulty: "難",
          explanation: "「雁足傳書」為傳統典故，此處以「謝不能」（連雁足傳書都難以做到）極言兩地相隔之遙遠、音訊難通。" },

        { id: ID + "-q22", origin: "ai-derived", questionForm: "主旨與情意", text: "「桃李春風一杯酒，江湖夜雨十年燈」今昔對比的藝術效果，最主要在於？",
          options: [{ key: "A", text: "凸顯歲月流逝、聚散無常，深化對友人的思念與人生際遇的感慨" }, { key: "B", text: "單純誇耀昔日飲酒的豪情" }, { key: "C", text: "批評友人不懂得珍惜光陰" }, { key: "D", text: "描述釀酒的技術過程" }],
          correctAnswer: "A", knowledgePoint: "主旨與情意", difficulty: "中等",
          explanation: "此聯今昔、樂與苦的強烈對比，凸顯歲月流逝、聚散無常，深化了對友人的思念與人生際遇的感慨，是全詩情韻最深長的名句。" },
        { id: ID + "-q23", origin: "ai-derived", questionForm: "主旨與情意", text: "全詩最主要抒發的情感是？",
          options: [{ key: "A", text: "對山水風光的單純讚嘆" }, { key: "B", text: "對遠方友人的深切思念，以及對彼此人生飄零境遇的感慨" }, { key: "C", text: "對朝廷政策的批判" }, { key: "D", text: "對戰爭勝利的歌頌" }],
          correctAnswer: "B", knowledgePoint: "主旨與情意", difficulty: "易",
          explanation: "全詩抒發對遠方友人黃幾復的深切思念，以及對彼此十年來各自飄零、聚少離多之人生境遇的感慨。" },
        { id: ID + "-q24", origin: "ai-derived", questionForm: "主旨與情意", text: "詩人在頸聯讚美黃幾復「持家但有四立壁」的清廉，其寫作用意最可能是？",
          options: [{ key: "A", text: "單純陳述友人的家境貧窮" }, { key: "B", text: "藉由稱許友人清廉自持的品格，寄託對其人格的敬重與期許" }, { key: "C", text: "暗示友人應該辭官返鄉" }, { key: "D", text: "諷刺當朝官員貪腐成風" }],
          correctAnswer: "B", knowledgePoint: "主旨與情意：寫作用意", difficulty: "難",
          explanation: "此句藉由稱許黃幾復為官清廉、家徒四壁仍堅守正道的品格，寄託詩人對其人格的敬重與深厚情誼。" }
      ],
      fillIn: [
        { id: ID + "-fib1", origin: "textbook-verified", text: "黃庭堅是北宋＿＿＿詩派的開創者。", answer: "江西", knowledgePoint: "文學常識：詩派" },
        { id: ID + "-fib2", origin: "textbook-verified", text: "「桃李春風一杯酒，江湖夜雨十年＿＿。」", answer: "燈", knowledgePoint: "課文默寫" },
        { id: ID + "-fib3", origin: "textbook-verified", text: "「持家但有四立壁」意指黃幾復為官＿＿＿（形容其清廉儉樸）。", answer: "清廉", knowledgePoint: "內容理解" },
        { id: ID + "-fib4", origin: "textbook-verified", text: "「治病不蘄三折肱」化用「三折肱知為＿＿＿」的典故。", answer: "良醫", knowledgePoint: "字詞注釋：用典" }
      ],
      trueFalse: [
        { id: ID + "-tf1", origin: "textbook-verified", text: "黃庭堅是唐代詩人，與杜甫、李商隱同時代。", answer: false, knowledgePoint: "文學常識",
          explanation: "黃庭堅是北宋詩人（1045-1105），與唐代的杜甫、李商隱並非同時代人。" },
        { id: ID + "-tf2", origin: "textbook-verified", text: "「桃李春風一杯酒，江湖夜雨十年燈」是全詩今昔對比最強烈、最為人稱頌的名句。", answer: true, knowledgePoint: "修辭與寫作手法" },
        { id: ID + "-tf3", origin: "textbook-verified", text: "頸聯「持家但有四立壁」是在諷刺黃幾復治家無方、家境敗落。", answer: false, knowledgePoint: "內容理解：頸聯",
          explanation: "「持家但有四立壁」實為讚美黃幾復為官清廉，家徒四壁反映其不貪不取的操守，並非諷刺其治家無方。" },
        { id: ID + "-tf4", origin: "textbook-verified", text: "尾聯是詩人想像友人在瘴癘之地讀書已至白頭，藉此深化思念之情。", answer: true, knowledgePoint: "內容理解：尾聯" }
      ]
    },

    commonMistakes: [
      { concept: "誤把「四立壁」理解為負面批評", misconception: "以為「持家但有四立壁」是在批評黃幾復家境貧困、治家無方。",
        correction: "「四立壁」即家徒四壁，此處是讚美黃幾復為官清廉、不貪不取，屬於正面稱許，並非負面批評。",
        relatedQuestions: [ID + "-q11", ID + "-q16", ID + "-tf3"] },
      { concept: "不理解「三折肱」的典故意涵", misconception: "誤以為「治病不蘄三折肱」是在描述黃幾復身體虛弱、多次受傷。",
        correction: "「三折肱」典出「三折肱知為良醫」，是用以稱讚黃幾復處事練達、經驗豐富，不必事事親身受挫才能領悟，屬於用典的讚美之詞。",
        relatedQuestions: [ID + "-q12", ID + "-q13", ID + "-q20"] }
    ],

    relatedMaterials: []
  });
})();
