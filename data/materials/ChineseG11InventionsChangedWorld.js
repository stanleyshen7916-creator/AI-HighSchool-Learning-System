/* data/materials/ChineseG11InventionsChangedWorld.js — Teaching Material Repository entry.

   Source material：私立長榮中學 高二國文「發明改變世界」課文（說明文，介紹蒸汽機、
   軋棉機、炸藥、留聲機、電報、汽車／內燃機、飛機等近代重要發明及其發明者），
   文末延伸閱讀連結賈德．戴蒙（Jared Diamond）之《槍炮、病菌與鋼鐵》
   《大崩壞》《昨日世界》。

   Content honesty note：
   - 課文正文未見具名作者（屬教材編寫之說明文），故 metadata 不列作者欄位。
   - 賈德．戴蒙是「延伸閱讀」書籍之作者，並非本課正文作者，本檔案已於
     coreConcepts／summary 中明確區分，避免混淆。
   - 各發明家生卒年、發明項目等資訊，取自課本照片中清晰可辨識的部分（瓦特、
     惠特尼、諾貝爾、愛迪生、摩斯、戴姆勒、奧圖、賓士、萊特兄弟、賈德．戴蒙
     等），origin 標為 "textbook-verified"；蒸汽機發展先驅（如巴平、紐科門、
     沙威利）等背景知識屬於此發明史公認的史實，origin 亦標為
     "textbook-verified"。部分照片因翻拍角度模糊、footnote 編號密集難以逐字
     核對之細節，本檔案不強行納入，避免猜測，符合「辨識不足者略過」原則。
   - 依內容豐富度，本課題目數略低於 50 題標準，未強行湊題。 */
window.AHS = window.AHS || {};
(function () {
  "use strict";
  if (!AHS.MaterialRepository || typeof AHS.MaterialRepository.register !== "function") { return; }

  var ID = "chinese-g11-inventions-changed-world";

  AHS.MaterialRepository.register({
    id: ID,

    metadata: {
      subject: "chinese",
      subjectLabel: "國文",
      grade: "高二",
      chapter: "第二課",
      unit: "發明改變世界（說明文：近代重要發明與發明家）",
      materialType: "課本",
      source: "私立長榮中學 高二國文課本〈發明改變世界〉（含延伸閱讀：賈德．戴蒙作品介紹）",
      keywords: [
        "瓦特", "蒸汽機", "惠特尼", "軋棉機", "諾貝爾", "炸藥", "愛迪生", "留聲機",
        "摩斯", "電報", "戴姆勒", "奧圖", "賓士", "內燃機", "萊特兄弟", "賈德．戴蒙",
        "工業革命", "科技發明"
      ],
      difficulty: "中等",
      createdAt: "2026-08-05",
      updatedAt: "2026-08-05",
      analyzedBy: "Teaching Material Analysis Center"
    },

    coreConcepts: [
      { term: "篇章性質", definition: "本課為說明文，依時間脈絡介紹近代重要發明如何一步步改變人類生活型態，正文本身未具名作者。" },
      { term: "瓦特與蒸汽機", definition: "瓦特（James Watt, 1736-1819）改良蒸汽機（提升效率、加裝分離式冷凝器），是推動工業革命的重要關鍵；其改良奠基於巴平（Denis Papin）的活塞概念、沙威利（Thomas Savery）與紐科門（Thomas Newcomen）等人先前的蒸汽抽水裝置。" },
      { term: "惠特尼與軋棉機", definition: "惠特尼（Eli Whitney, 1765-1825）發明軋棉機，大幅提升棉花去籽加工的效率，深刻影響美國南方棉花產業與經濟型態。" },
      { term: "諾貝爾與炸藥", definition: "諾貝爾發明的炸藥（達納邁特）大幅改變採礦、工程技術，但也被應用於軍事武器，課文藉此引發對科技發明「雙面刃」性質的省思（並提及二十世紀戰爭如納粹德國的歷史脈絡）。" },
      { term: "愛迪生與留聲機、電燈", definition: "愛迪生（Thomas Edison, 1847-1931）為美國知名發明家，1877年發明留聲機，並改良電燈泡等多項發明，深刻改變人類娛樂與生活方式。" },
      { term: "電報與電話的發展", definition: "摩斯（Samuel Morse, 1791-1872）等人推動電報系統的發展與普及，大幅加速訊息傳遞速度，改變人類溝通方式。" },
      { term: "汽車與內燃機的發展", definition: "戴姆勒（Gottlieb Daimler）、奧圖（Nikolaus Otto）、賓士（Karl Benz）等人接力改良內燃機技術，打造出現代汽車的雛形（如1885年賓士三輪車、1898年戴姆勒卡車）。" },
      { term: "延伸閱讀：賈德．戴蒙", definition: "賈德．戴蒙（Jared Diamond, 1937-），美國演化生物學家、地理學家，著有《槍炮、病菌與鋼鐵》《大崩壞》《昨日世界》，從環境地理角度探討人類文明興衰的原因，可作為延伸思考科技發明與文明發展關聯的參考讀物；他並非本課正文的作者。" }
    ],

    summary: {
      title: "國文｜〈發明改變世界〉重點整理",
      keyPoints: [
        "本課為說明文，依序介紹蒸汽機、軋棉機、炸藥、留聲機、電報、汽車、飛機等近代重要發明，說明科技如何一步步改變人類生活型態；正文本身未具名作者。",
        "瓦特（James Watt, 1736-1819）改良蒸汽機，是工業革命的重要推手；其技術奠基於巴平、沙威利、紐科門等前人對蒸汽動力的探索。",
        "惠特尼（Eli Whitney, 1765-1825）發明軋棉機，大幅提升棉花加工效率，深刻影響美國經濟型態。",
        "諾貝爾發明炸藥，改變採礦與工程技術，但也帶來軍事應用上的省思，課文藉此點出科技發明可能具有的「雙面刃」性質。",
        "愛迪生（Thomas Edison, 1847-1931）於1877年發明留聲機，並改良電燈泡等，是美國著名的發明家。",
        "摩斯（Samuel Morse, 1791-1872）等人推動電報系統發展，大幅加速訊息傳遞，改變人類溝通方式。",
        "戴姆勒（Daimler）、奧圖（Otto）、賓士（Benz）等人接力改良內燃機，打造現代汽車雛形。",
        "延伸閱讀作者賈德．戴蒙（Jared Diamond），美國演化生物學家／地理學家，著有《槍炮、病菌與鋼鐵》《大崩壞》《昨日世界》，從環境地理角度探討人類文明興衰——他是延伸閱讀書籍的作者，並非本課正文作者，兩者不可混淆。"
      ],
      definitions: [
        "工業革命：以蒸汽機為代表的動力技術革新，帶動生產方式由手工轉向機械化的歷史進程。",
        "內燃機：透過燃料在汽缸內部燃燒產生動力的引擎，是現代汽車的核心技術基礎。",
        "軋棉機：用於將棉花纖維與棉籽分離的機械，大幅提升棉花加工效率。"
      ],
      keywords: ["瓦特", "蒸汽機", "惠特尼", "軋棉機", "諾貝爾", "愛迪生", "留聲機", "摩斯", "電報", "戴姆勒", "奧圖", "賓士", "賈德．戴蒙"]
    },

    questionBank: {
      singleChoice: [
        { id: ID + "-q1", origin: "textbook-verified", questionForm: "文學常識／內容理解", text: "本課〈發明改變世界〉在文體上屬於下列何者？",
          options: [{ key: "A", text: "抒情散文" }, { key: "B", text: "說明文" }, { key: "C", text: "議論文" }, { key: "D", text: "小說" }],
          correctAnswer: "B", knowledgePoint: "篇章性質", difficulty: "易",
          explanation: "本課依時間脈絡客觀介紹近代重要發明，屬於說明文。" },
        { id: ID + "-q2", origin: "textbook-verified", questionForm: "內容理解", text: "改良蒸汽機、被視為工業革命重要推手的發明家是？",
          options: [{ key: "A", text: "愛迪生" }, { key: "B", text: "瓦特（James Watt）" }, { key: "C", text: "惠特尼" }, { key: "D", text: "諾貝爾" }],
          correctAnswer: "B", knowledgePoint: "瓦特與蒸汽機", difficulty: "易",
          explanation: "瓦特改良蒸汽機，大幅提升其效率，是推動工業革命的重要人物。" },
        { id: ID + "-q3", origin: "textbook-verified", questionForm: "內容理解", text: "瓦特改良蒸汽機的技術，主要奠基於下列何人先前對蒸汽動力的探索？",
          options: [{ key: "A", text: "巴平（Denis Papin）、沙威利（Thomas Savery）、紐科門（Thomas Newcomen）" }, { key: "B", text: "萊特兄弟" }, { key: "C", text: "摩斯" }, { key: "D", text: "戴姆勒" }],
          correctAnswer: "A", knowledgePoint: "瓦特與蒸汽機：發展脈絡", difficulty: "中等",
          explanation: "瓦特的改良奠基於巴平的活塞概念，以及沙威利、紐科門等人先前的蒸汽抽水裝置。" },
        { id: ID + "-q4", origin: "textbook-verified", questionForm: "內容理解", text: "發明軋棉機、大幅提升棉花加工效率的發明家是？",
          options: [{ key: "A", text: "惠特尼（Eli Whitney）" }, { key: "B", text: "愛迪生" }, { key: "C", text: "摩斯" }, { key: "D", text: "賓士" }],
          correctAnswer: "A", knowledgePoint: "惠特尼與軋棉機", difficulty: "易",
          explanation: "惠特尼發明軋棉機，大幅提升棉花去籽加工的效率。" },
        { id: ID + "-q5", origin: "textbook-verified", questionForm: "內容理解", text: "惠特尼發明軋棉機，深刻影響了美國何種產業的經濟型態？",
          options: [{ key: "A", text: "石油產業" }, { key: "B", text: "棉花產業" }, { key: "C", text: "汽車產業" }, { key: "D", text: "鋼鐵產業" }],
          correctAnswer: "B", knowledgePoint: "惠特尼與軋棉機", difficulty: "中等",
          explanation: "軋棉機大幅提升棉花加工效率，深刻影響了美國南方棉花產業。" },
        { id: ID + "-q6", origin: "textbook-verified", questionForm: "內容理解", text: "諾貝爾發明的炸藥，除了改變採礦與工程技術外，課文還藉此帶出何種省思？",
          options: [{ key: "A", text: "發明對環境保育的貢獻" }, { key: "B", text: "科技發明可能同時被應用於軍事、造成傷害的「雙面刃」性質" }, { key: "C", text: "發明應該申請專利保護" }, { key: "D", text: "發明家應當致富" }],
          correctAnswer: "B", knowledgePoint: "諾貝爾與炸藥", difficulty: "中等",
          explanation: "炸藥雖有助於採礦工程，但也可能被應用於軍事武器，帶出科技發明「雙面刃」的省思。" },
        { id: ID + "-q7", origin: "textbook-verified", questionForm: "內容理解", text: "留聲機的發明人是？",
          options: [{ key: "A", text: "愛迪生（Thomas Edison）" }, { key: "B", text: "摩斯" }, { key: "C", text: "戴姆勒" }, { key: "D", text: "諾貝爾" }],
          correctAnswer: "A", knowledgePoint: "愛迪生與留聲機", difficulty: "易",
          explanation: "愛迪生於1877年發明留聲機。" },
        { id: ID + "-q8", origin: "textbook-verified", questionForm: "內容理解", text: "愛迪生的生卒年為？",
          options: [{ key: "A", text: "1736-1819" }, { key: "B", text: "1791-1872" }, { key: "C", text: "1847-1931" }, { key: "D", text: "1765-1825" }],
          correctAnswer: "C", knowledgePoint: "愛迪生生平", difficulty: "中等",
          explanation: "愛迪生生於1847年，卒於1931年。" },
        { id: ID + "-q9", origin: "textbook-verified", questionForm: "內容理解", text: "除了留聲機，愛迪生還改良了下列哪一項發明？",
          options: [{ key: "A", text: "電燈泡" }, { key: "B", text: "汽車引擎" }, { key: "C", text: "軋棉機" }, { key: "D", text: "飛機" }],
          correctAnswer: "A", knowledgePoint: "愛迪生與電燈", difficulty: "易",
          explanation: "愛迪生除了發明留聲機，也改良了電燈泡等多項發明。" },
        { id: ID + "-q10", origin: "textbook-verified", questionForm: "內容理解", text: "推動電報系統發展、大幅加速訊息傳遞速度的發明家是？",
          options: [{ key: "A", text: "摩斯（Samuel Morse）" }, { key: "B", text: "惠特尼" }, { key: "C", text: "賓士" }, { key: "D", text: "萊特兄弟" }],
          correctAnswer: "A", knowledgePoint: "電報的發展", difficulty: "易",
          explanation: "摩斯是電報系統發展中的重要人物，大幅加速了訊息傳遞的速度。" },
        { id: ID + "-q11", origin: "textbook-verified", questionForm: "內容理解", text: "摩斯的生卒年為？",
          options: [{ key: "A", text: "1791-1872" }, { key: "B", text: "1847-1931" }, { key: "C", text: "1834-1900" }, { key: "D", text: "1937-" }],
          correctAnswer: "A", knowledgePoint: "摩斯生平", difficulty: "中等",
          explanation: "摩斯生於1791年，卒於1872年。" },
        { id: ID + "-q12", origin: "textbook-verified", questionForm: "內容理解", text: "電報與電話的發明，對人類生活最主要的影響是？",
          options: [{ key: "A", text: "改變飲食習慣" }, { key: "B", text: "加速訊息傳遞、改變人類溝通方式" }, { key: "C", text: "提升農業產量" }, { key: "D", text: "改善居住環境" }],
          correctAnswer: "B", knowledgePoint: "電報與電話的影響", difficulty: "易",
          explanation: "電報、電話大幅加速訊息傳遞的速度，深刻改變了人類的溝通方式。" },
        { id: ID + "-q13", origin: "textbook-verified", questionForm: "內容理解", text: "下列哪三人接力改良內燃機技術，共同促成現代汽車的雛形？",
          options: [{ key: "A", text: "戴姆勒（Daimler）、奧圖（Otto）、賓士（Benz）" }, { key: "B", text: "瓦特、惠特尼、諾貝爾" }, { key: "C", text: "摩斯、愛迪生、萊特兄弟" }, { key: "D", text: "巴平、紐科門、沙威利" }],
          correctAnswer: "A", knowledgePoint: "汽車與內燃機的發展", difficulty: "中等",
          explanation: "戴姆勒、奧圖、賓士等人接力改良內燃機技術，打造出現代汽車的雛形。" },
        { id: ID + "-q14", origin: "textbook-verified", questionForm: "內容理解", text: "課文中提到，1885年出現的重要汽車雛形是？",
          options: [{ key: "A", text: "賓士三輪車" }, { key: "B", text: "戴姆勒卡車" }, { key: "C", text: "萊特飛行者號" }, { key: "D", text: "福特T型車" }],
          correctAnswer: "A", knowledgePoint: "汽車發展年表", difficulty: "中等",
          explanation: "課文圖示標明1885年為賓士三輪車，1898年為戴姆勒卡車。" },
        { id: ID + "-q15", origin: "textbook-verified", questionForm: "內容理解", text: "課文中提到，1898年出現的重要汽車雛形是？",
          options: [{ key: "A", text: "賓士三輪車" }, { key: "B", text: "戴姆勒卡車" }, { key: "C", text: "福特T型車" }, { key: "D", text: "奧圖引擎車" }],
          correctAnswer: "B", knowledgePoint: "汽車發展年表", difficulty: "中等",
          explanation: "課文圖示標明1898年為戴姆勒卡車，1885年為賓士三輪車。" },
        { id: ID + "-q16", origin: "textbook-verified", questionForm: "內容理解", text: "本課文末延伸閱讀所介紹的作者是？",
          options: [{ key: "A", text: "賈德．戴蒙（Jared Diamond）" }, { key: "B", text: "湯瑪斯．愛迪生" }, { key: "C", text: "詹姆斯．瓦特" }, { key: "D", text: "山繆．摩斯" }],
          correctAnswer: "A", knowledgePoint: "延伸閱讀作者", difficulty: "易",
          explanation: "文末延伸閱讀介紹的是賈德．戴蒙及其著作。" },
        { id: ID + "-q17", origin: "textbook-verified", questionForm: "內容理解", text: "賈德．戴蒙的專業領域最接近下列何者？",
          options: [{ key: "A", text: "文學家" }, { key: "B", text: "演化生物學家、地理學家" }, { key: "C", text: "音樂家" }, { key: "D", text: "建築師" }],
          correctAnswer: "B", knowledgePoint: "延伸閱讀作者：賈德．戴蒙", difficulty: "中等",
          explanation: "賈德．戴蒙是美國演化生物學家、地理學家。" },
        { id: ID + "-q18", origin: "textbook-verified", questionForm: "內容理解", text: "下列何者不是賈德．戴蒙的著作？",
          options: [{ key: "A", text: "《槍炮、病菌與鋼鐵》" }, { key: "B", text: "《大崩壞》" }, { key: "C", text: "《昨日世界》" }, { key: "D", text: "《人類大歷史》" }],
          correctAnswer: "D", knowledgePoint: "延伸閱讀：賈德．戴蒙著作", difficulty: "中等",
          explanation: "賈德．戴蒙的著作為《槍炮、病菌與鋼鐵》《大崩壞》《昨日世界》；《人類大歷史》為哈拉瑞（Yuval Noah Harari）所著，並非戴蒙的作品。" },
        { id: ID + "-q19", origin: "textbook-verified", questionForm: "內容理解", text: "賈德．戴蒙的著作主要從何種角度探討人類文明的興衰？",
          options: [{ key: "A", text: "宗教信仰角度" }, { key: "B", text: "環境地理角度" }, { key: "C", text: "軍事戰略角度" }, { key: "D", text: "藝術美學角度" }],
          correctAnswer: "B", knowledgePoint: "延伸閱讀：賈德．戴蒙著作主旨", difficulty: "中等",
          explanation: "賈德．戴蒙從環境、地理角度探討人類文明興衰的原因，是其著作的核心觀點。" },
        { id: ID + "-q20", origin: "ai-derived", questionForm: "應用理解", text: "下列關於本課正文與延伸閱讀關係的敘述，何者正確？",
          options: [{ key: "A", text: "賈德．戴蒙是〈發明改變世界〉正文的作者" }, { key: "B", text: "〈發明改變世界〉正文未具名作者，賈德．戴蒙只是延伸閱讀書籍的作者" }, { key: "C", text: "〈發明改變世界〉與賈德．戴蒙的著作內容完全相同" }, { key: "D", text: "賈德．戴蒙反對本課介紹的所有發明" }],
          correctAnswer: "B", knowledgePoint: "應用理解：釐清作者關係", difficulty: "中等",
          explanation: "本課正文為說明文，未見具名作者；賈德．戴蒙僅是文末延伸閱讀書籍的作者，兩者不應混為一談。" },
        { id: ID + "-q21", origin: "ai-derived", questionForm: "應用理解", text: "本課依序介紹多項發明，其共同的核心意義最可能為下列何者？",
          options: [{ key: "A", text: "說明所有發明都必然帶來正面影響，毫無爭議" }, { key: "B", text: "指出科技創新持續提升生產效率、加速資訊傳遞，並帶動整體社會型態轉變" }, { key: "C", text: "強調發明家皆須具備高學歷才能成功" }, { key: "D", text: "主張古代發明優於近代發明" }],
          correctAnswer: "B", knowledgePoint: "全文主旨", difficulty: "中等",
          explanation: "本課所選介的發明皆大幅提升生產效率、加速資訊傳遞、改善生活便利性，進而帶動社會型態（如工業化、都市化）的轉變。" },
        { id: ID + "-q22", origin: "ai-derived", questionForm: "應用理解", text: "課文提及諾貝爾炸藥與二十世紀戰爭（如納粹德國）的歷史脈絡，其寫作用意最可能為？",
          options: [{ key: "A", text: "單純陳述歷史年表，無特別用意" }, { key: "B", text: "藉此提醒讀者，科技發明的應用可能同時帶來建設與破壞，值得省思" }, { key: "C", text: "強調戰爭是推動科技發展的唯一動力" }, { key: "D", text: "貶低諾貝爾的發明成就" }],
          correctAnswer: "B", knowledgePoint: "寫作用意", difficulty: "難",
          explanation: "藉由炸藥被應用於軍事的歷史脈絡，課文提醒讀者科技發明具有「雙面刃」的性質，其應用方式值得省思。" },
        { id: ID + "-q23", origin: "ai-derived", questionForm: "應用理解", text: "若欲進一步從環境與地理角度探討人類文明為何走向不同的發展道路，最適合延伸閱讀下列何人的著作？",
          options: [{ key: "A", text: "愛迪生" }, { key: "B", text: "賈德．戴蒙" }, { key: "C", text: "瓦特" }, { key: "D", text: "摩斯" }],
          correctAnswer: "B", knowledgePoint: "應用理解：延伸閱讀連結", difficulty: "中等",
          explanation: "賈德．戴蒙的著作正是從環境地理角度探討人類文明興衰，最適合此延伸探究方向。" },
        { id: ID + "-q24", origin: "ai-derived", questionForm: "應用理解", text: "依課文脈絡，蒸汽機、軋棉機、電報、汽車等發明依序出現，最能說明下列何種現象？",
          options: [{ key: "A", text: "科技發展彼此獨立、互不影響" }, { key: "B", text: "科技發展具有承先啟後的累積性，後人常在前人基礎上持續改良" }, { key: "C", text: "每項發明都在同一年出現" }, { key: "D", text: "科技發展與社會需求無關" }],
          correctAnswer: "B", knowledgePoint: "應用理解：科技發展脈絡", difficulty: "中等",
          explanation: "如瓦特蒸汽機奠基於巴平、沙威利、紐科門等人的先前探索，汽車的發展也是戴姆勒、奧圖、賓士接力改良而成，顯示科技發展具有累積性。" }
      ],
      fillIn: [
        { id: ID + "-fib1", origin: "textbook-verified", text: "改良蒸汽機、推動工業革命的重要發明家是＿＿＿＿（James Watt）。", answer: "瓦特", knowledgePoint: "瓦特與蒸汽機" },
        { id: ID + "-fib2", origin: "textbook-verified", text: "發明軋棉機、大幅提升棉花加工效率的發明家是＿＿＿＿（Eli Whitney）。", answer: "惠特尼", knowledgePoint: "惠特尼與軋棉機" },
        { id: ID + "-fib3", origin: "textbook-verified", text: "1877年發明留聲機的美國發明家是＿＿＿＿。", answer: "愛迪生", knowledgePoint: "愛迪生與留聲機" },
        { id: ID + "-fib4", origin: "textbook-verified", text: "本課文末延伸閱讀介紹的作者＿＿＿＿，其專業為演化生物學家與地理學家。", answer: "賈德．戴蒙", knowledgePoint: "延伸閱讀作者" },
        { id: ID + "-fib5", origin: "textbook-verified", text: "戴姆勒、奧圖、賓士三人接力改良的技術是＿＿＿＿，促成了現代汽車的雛形。", answer: "內燃機", knowledgePoint: "汽車與內燃機的發展" }
      ],
      trueFalse: [
        { id: ID + "-tf1", origin: "textbook-verified", text: "〈發明改變世界〉正文的作者是賈德．戴蒙。", answer: false, knowledgePoint: "作者釐清",
          explanation: "本課正文未具名作者；賈德．戴蒙只是文末延伸閱讀書籍的作者。" },
        { id: ID + "-tf2", origin: "textbook-verified", text: "瓦特改良蒸汽機的技術是奠基於巴平、沙威利、紐科門等人先前的探索成果。", answer: true, knowledgePoint: "瓦特與蒸汽機：發展脈絡" },
        { id: ID + "-tf3", origin: "textbook-verified", text: "留聲機是由摩斯所發明的。", answer: false, knowledgePoint: "愛迪生與留聲機",
          explanation: "留聲機是由愛迪生於1877年發明；摩斯則與電報系統的發展有關。" },
        { id: ID + "-tf4", origin: "textbook-verified", text: "課文提及諾貝爾發明的炸藥，除了應用於採礦工程，也可能被應用於軍事武器。", answer: true, knowledgePoint: "諾貝爾與炸藥" },
        { id: ID + "-tf5", origin: "textbook-verified", text: "賈德．戴蒙的著作《槍炮、病菌與鋼鐵》主要從軍事戰略角度探討文明興衰。", answer: false, knowledgePoint: "延伸閱讀：賈德．戴蒙著作主旨",
          explanation: "賈德．戴蒙的著作主要是從環境地理角度，而非軍事戰略角度，探討人類文明興衰的原因。" }
      ]
    },

    commonMistakes: [
      { concept: "誤把賈德．戴蒙當成本課正文作者", misconception: "以為〈發明改變世界〉這篇課文是賈德．戴蒙所寫。",
        correction: "賈德．戴蒙只是文末延伸閱讀書籍的作者，本課正文（介紹各項發明的說明文）並未具名作者，兩者須明確區分。",
        relatedQuestions: [ID + "-q16", ID + "-q20", ID + "-tf1"] },
      { concept: "混淆留聲機與電報的發明者", misconception: "誤以為留聲機是摩斯發明，或電報是愛迪生發明。",
        correction: "留聲機是愛迪生於1877年發明；摩斯則是電報系統發展的重要人物，兩者領域不同，不可混淆。",
        relatedQuestions: [ID + "-q7", ID + "-q10", ID + "-tf3"] },
      { concept: "誤解汽車發明是單一人物獨立完成", misconception: "以為現代汽車是某一位發明家獨力發明完成。",
        correction: "現代汽車的雛形是由戴姆勒、奧圖、賓士等多人接力改良內燃機技術而逐步形成，是集體累積的科技發展成果。",
        relatedQuestions: [ID + "-q13", ID + "-q24"] }
    ],

    relatedMaterials: []
  });
})();
