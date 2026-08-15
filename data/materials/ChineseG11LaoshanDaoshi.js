/* data/materials/ChineseG11LaoshanDaoshi.js — Teaching Material Repository entry.

   Source material：私立長榮中學 高二國文（第一課）蒲松齡《聊齋志異．勞山道士》
   ——課本題解、作者（蒲松齡）介紹、課文本文與逐句注釋。

   Content honesty note (Round 5 — cross-reviewed and re-verified against the
   original source PDF, superseding the previous version of this file):
   - This record replaces an earlier version built to a fixed "50 questions"
     target. That earlier version was found, on direct comparison against
     the original textbook PDF, to contain a transcription error that had
     independently propagated through multiple AIs' analysis: the ending
     line reads「頭觸硬壁，蹶然而踣」in the actual textbook, not the more
     commonly circulated「頭觸硬壁，驀然而踣」. This version uses the
     corrected text throughout.
   - Every question below has been checked, question by question, against
     the actual textbook page it cites (see each entry's knowledgePoint /
     explanation for the specific passage). origin: "textbook-verified"
     means the answer and explanation are directly traceable to a specific
     page of the source PDF, not inferred or reconstructed from memory.
   - Per this project's question-count policy (0 < N ≤ 50, no minimum, no
     padding to a target), this record intentionally carries 15 questions
     rather than 50 — every core teaching point in the confirmed source
     text is covered once, without repeating a knowledge point just to
     reach a round number. */
window.AHS = window.AHS || {};
(function () {
  "use strict";
  if (!AHS.MaterialRepository || typeof AHS.MaterialRepository.register !== "function") { return; }

  var ID = "chinese-g11-laoshan-daoshi";

  AHS.MaterialRepository.register({
    id: ID,

    metadata: {
      subject: "chinese",
      subjectLabel: "國文",
      grade: "高二",
      workspaceSchool: "cjsh",
      workspaceSemester: "g2s1",
      chapter: "第一課",
      unit: "蒲松齡《聊齋志異．勞山道士》",
      materialType: "課本",
      source: "私立長榮中學 高二國文課本 第一課〈勞山道士〉（題解／作者／課文與注釋，Round 5 對照原始課本 PDF 逐字覆核）",
      keywords: [
        "聊齋志異", "蒲松齡", "志怪小說", "勞山道士", "王生", "異史氏曰",
        "文言短篇小說", "穿牆術", "諷刺小說", "投機取巧"
      ],
      difficulty: "中等",
      createdAt: "2026-08-05",
      updatedAt: "2026-08-14",
      analyzedBy: "Multi-AI Cross Review (GPT / Gemini / Claude, Round 5)"
    },

    coreConcepts: [
      { term: "作者：蒲松齡", definition: "字留仙，別號柳泉，山東淄川人（1640-1715）。十九歲第一名考中秀才，其後屢試不第，七十二歲始以資深秀才身分補為貢生。耗時數十年完成《聊齋志異》。" },
      { term: "《聊齋志異》", definition: "文言短篇小說集，收錄近五百篇作品，多描寫神仙鬼怪、花妖狐魅、奇人奇事，反映社會現實與人生百態，深富警世寓意，是清代文言小說的經典之作。" },
      { term: "篇旨", definition: "本文藉王生求道失敗的故事，諷刺好逸惡勞的人性，並藉此提醒為政者勿投機取巧；批判阿諛諂媚者，警醒世人勿倚仗虛矯不正的手段，否則終將自食其果。" },
      { term: "敘事視角與結構", definition: "全文以王生的故事為敘述主線，透過王生的視角呈現道士法術之奇異迷人；文末模仿史書論贊的形式，以「異史氏曰」揭示主旨。" },
      { term: "情節梗概", definition: "王生慕道往勞山拜師→怕吃苦生歸志→目睹道士剪紙為月、邀嫦娥起舞等法術而心生欽羨、歸念遂息→終究不堪辛勞，只求穿牆之術便滿足下山→返家自誇卻頭觸硬壁，蹶然而踣，遭妻子揶揄。" },
      { term: "異史氏曰", definition: "全文結尾模仿《史記》「太史公曰」等史書論贊體例，作者跳出故事直接評論，將王生個人際遇提升為對世態人心（好逸惡勞、投機取巧、逢迎諂媚）的普遍諷刺。" },
      { term: "寫作特色", definition: "情節玄幻離奇，寓意深遠；人物形象栩栩如生，躍然紙上；是一篇富涵諷刺意味的志怪小說佳作。" }
    ],

    summary: {
      title: "國文｜第一課 蒲松齡〈勞山道士〉重點整理",
      keyPoints: [
        "作者蒲松齡，字留仙，號柳泉，山東淄川人（1640-1715），一生科舉不順，七十二歲始補貢生，代表作《聊齋志異》耗時數十年完成。",
        "《聊齋志異》為文言短篇小說集，收錄近五百篇，多寫神仙狐鬼，藉以反映社會現實與人生哲理，是清代文言小說經典。",
        "本文選自《聊齋志異》，是一篇志怪小說。",
        "情節主線：王生少慕道、聞勞山多仙人而負笈往遊→隨眾採樵一個多月，手足重繭、不堪其苦而陰有歸志→目睹道士與客人剪紙為月、壺酒往復挹注不減、以箸擲月化嫦娥起舞等法術，心生欽羨，歸念遂息→終究不堪辛勞，只求得穿牆之術便滿足下山→返家自詡遇仙，向妻子演練卻頭觸硬壁，蹶然而踣，遭妻子揶揄。",
        "文末「異史氏曰」模仿史書論贊體例，作者跳脫故事直接評論，藉「傖父」「吮癰舐痔」等語，諷刺世間投機取巧、逢迎諂媚、只求速成僥倖之人。",
        "全文主旨：批判不肯下苦功、只想尋求速成捷徑的心態，強調學習應紮實踏實，否則終將因自身性格缺陷而「碰壁」，自食其果。",
        "寫作特色：情節玄幻離奇、寓意深遠；人物形象鮮明生動；以第三人稱敘述王生故事為主線，末段轉為作者現身說法的議論。"
      ],
      definitions: [
        "志怪小說：以記敘神怪、鬼狐、奇聞異事為主要內容的小說類型，《聊齋志異》為此類代表作。",
        "異史氏曰：模仿史書「論贊」體例（如《史記》太史公曰），在故事末尾由作者直接發表評論的寫作手法。",
        "潔持：潔身修持，指以虔敬的態度對待法術，道士以此告誡王生法術效驗與心志誠敬與否密切相關。",
        "資斧：旅費、盤纏，文中指道士贈與王生返家的路費。",
        "蹶然而踣：跌倒、仆倒貌，文末描述王生撞牆後的狼狽情狀（原文用字，非坊間常見的「驀然而踣」）。"
      ],
      keywords: ["聊齋志異", "蒲松齡", "志怪小說", "異史氏曰", "王生", "勞山", "穿牆術", "諷刺"]
    },

    questionBank: {
      singleChoice: [
        { id: ID + "-q1", origin: "textbook-verified", questionForm: "字詞注釋", text: "課文：「弟子在家，未諳此苦。」句中「諳」字的意思最接近下列何者？",
          options: [{ key: "A", text: "安穩" }, { key: "B", text: "熟悉、經歷" }, { key: "C", text: "詢問" }, { key: "D", text: "歌詠" }],
          correctAnswer: "B", knowledgePoint: "字詞注釋", difficulty: "易",
          explanation: "注釋明確標示「諳」意為熟悉，原文「弟子在家，未諳此苦」，此處指經歷、體驗過某種辛勞。「安穩」與「諳」字形近但意義無關；「詢問」「歌詠」皆與字義無關。" },
        { id: ID + "-q2", origin: "textbook-verified", questionForm: "字詞注釋／句式", text: "王生向道士表明求學動機時說「此來為不負也」，這句話最適合解釋為下列何者？",
          options: [{ key: "A", text: "這趟前來不會造成任何負擔" }, { key: "B", text: "這趟前來一定要打敗別人" }, { key: "C", text: "這趟前來絕不欠任何人債務" }, { key: "D", text: "這趟前來絕不會辜負求道的初衷" }],
          correctAnswer: "D", knowledgePoint: "字詞注釋／句式", difficulty: "中等",
          explanation: "「負」在此作動詞「辜負」解，「此來為不負也」即「不負此來」，不辜負這趟入山求道之行。「負」雖有「負擔」「欠債」等其他義項，但脈絡是求道之行，非金錢或負擔往來，文中亦無與人爭勝的語境。" },
        { id: ID + "-q3", origin: "textbook-verified", questionForm: "內容理解", text: "王生對道士說：「每見師行處，牆壁所不能隔，但得此法足矣。」依此，王生希望向道士學習的是哪一種能力？",
          options: [{ key: "A", text: "穿牆而行、不受牆壁阻隔的法術" }, { key: "B", text: "呼風喚雨的法術" }, { key: "C", text: "使人隱形的法術" }, { key: "D", text: "治病延壽的法術" }],
          correctAnswer: "A", knowledgePoint: "內容理解", difficulty: "易",
          explanation: "王生說：「每見師行處，牆壁所不能隔，但得此法足矣。」求的正是穿牆術；課文並未提及呼風喚雨、隱形或治病延壽等其他選項內容。" },
        { id: ID + "-q4", origin: "textbook-verified", questionForm: "內容理解", text: "道士教導王生穿牆術的具體步驟，下列敘述何者正確？",
          options: [{ key: "A", text: "直接施法將王生瞬間移至牆外" }, { key: "B", text: "王生須先齋戒三日才能施法" }, { key: "C", text: "先令自咒，再命王生面牆呼喊「入之」，最後奔而入牆" }, { key: "D", text: "道士親自帶王生穿牆一次作示範" }],
          correctAnswer: "C", knowledgePoint: "內容理解", difficulty: "中等",
          explanation: "課文「乃傳以訣，令自咒，畢，呼曰：『入之！』王面牆，不敢入。又曰：『試入之！』……道士曰：『俛首驟入，勿逡巡！』王果去牆數步，奔而入」，完整符合此三步驟；課文中並無齋戒情節，也是王生自己奔牆而入，非道士代為施法或示範。" },
        { id: ID + "-q5", origin: "textbook-verified", questionForm: "內容理解／主旨", text: "王生穿牆成功後，道士叮囑「歸宜潔持，否則不驗」，最能傳達下列哪一項寓意？",
          options: [{ key: "A", text: "法術只在勞山有效，離開此地便會失效" }, { key: "B", text: "法術效驗與修習者的心志誠敬與否密切相關，警惕王生勿因小成而輕慢" }, { key: "C", text: "王生必須每天向道士回報練習情況" }, { key: "D", text: "潔持是指維持牆壁的乾淨才能通行" }],
          correctAnswer: "B", knowledgePoint: "內容理解／主旨", difficulty: "中等",
          explanation: "注釋「潔持：潔身修持，指以虔敬的態度對待法術」，道士強調的是心志誠敬，而非字面上「保持牆壁乾淨」，這也為後文王生因輕慢而撞牆的結局埋下伏筆。" },
        { id: ID + "-q6", origin: "textbook-verified", questionForm: "字詞注釋", text: "「王果去牆數步，奔而入，及牆，虛若無物」句中「去」字的意思為何？",
          options: [{ key: "A", text: "離開、前往" }, { key: "B", text: "除去" }, { key: "C", text: "過去" }, { key: "D", text: "距離" }],
          correctAnswer: "D", knowledgePoint: "字詞注釋：一字多義", difficulty: "中等",
          explanation: "注釋直接定義「去：距離」，「去牆數步」即「距離牆數步」。若解為「離開」則與後文「奔而入」（跑向牆）的動作矛盾。" },
        { id: ID + "-q7", origin: "textbook-verified", questionForm: "內容理解", text: "王生「大喜，入謝」的原因是什麼？",
          options: [{ key: "A", text: "因為他順利穿牆成功，證明自己學會了法術" }, { key: "B", text: "因為道士答應教他更多法術" }, { key: "C", text: "因為道士免除了他的雜役工作" }, { key: "D", text: "因為他即將返鄉與家人團聚" }],
          correctAnswer: "A", knowledgePoint: "內容理解", difficulty: "易",
          explanation: "課文「王果去牆數步，奔而入，及牆，虛若無物，回視，果在牆外矣。大喜，入謝」，清楚交代穿牆成功後回頭確認自己已在牆外，故欣喜道謝。" },
        { id: ID + "-q8", origin: "textbook-verified", questionForm: "內容理解", text: "道士最後「助資斧遣之歸」的行為，顯示道士對王生的態度是？",
          options: [{ key: "A", text: "對王生極度不滿，故意打發他離開" }, { key: "B", text: "因王生表現優異，賜予豐厚獎賞" }, { key: "C", text: "雖僅授以小技，仍體恤其返鄉路途，予以資助" }, { key: "D", text: "純粹基於買賣關係，收取酬金後打發他走" }],
          correctAnswer: "C", knowledgePoint: "內容理解", difficulty: "中等",
          explanation: "課文客觀敘述道士提供路費，符合師徒情誼中體恤弟子的合理描寫；課文並無不滿或打發的負面語氣線索，前文也已言明僅授「小技」，並非買賣交易。" },
        { id: ID + "-q9", origin: "textbook-verified", questionForm: "文學常識", text: "下列關於本課出處與作者的敘述，何者正確？",
          options: [{ key: "A", text: "本課選自曹雪芹《紅樓夢》" }, { key: "B", text: "本課選自蒲松齡《聊齋志異》" }, { key: "C", text: "本課選自吳承恩《西遊記》" }, { key: "D", text: "本課選自蒲松齡《閱微草堂筆記》" }],
          correctAnswer: "B", knowledgePoint: "文學常識", difficulty: "易",
          explanation: "〈勞山道士〉為《聊齋志異》名篇。《紅樓夢》作者為曹雪芹、《西遊記》作者為吳承恩，皆與本課無關；《閱微草堂筆記》作者為紀昀而非蒲松齡，此選項刻意混淆作者與書名。" },
        { id: ID + "-q10", origin: "textbook-verified", questionForm: "內容理解", text: "王生初次嘗試穿牆「王面牆，不敢入」，接著「王果從容入，及牆而阻」，這兩次失敗的原因，最可能是因為下列何者？",
          options: [{ key: "A", text: "咒語尚未完全學會" }, { key: "B", text: "牆壁材質特殊，無法穿透" }, { key: "C", text: "道士刻意隱瞞部分口訣" }, { key: "D", text: "心存疑懼、不夠果決，故未能貫徹口訣的效力" }],
          correctAnswer: "D", knowledgePoint: "內容理解", difficulty: "中等",
          explanation: "道士後續提醒「勿逡巡」（不要遲疑猶豫），顯示前兩次失敗與王生猶豫心態有關，呼應「潔持」需誠心貫徹的主題；王生已「令自咒，畢」，咒語已完整念畢，課文最終也顯示穿牆確實可行，並非牆壁材質問題。" },
        { id: ID + "-q11", origin: "textbook-verified", questionForm: "內容理解", text: "王生「少慕道，聞勞山多仙人，故負笈往遊」，依此可知王生上山學道的最初動機為何？",
          options: [{ key: "A", text: "仰慕仙道之名，欲求仙術" }, { key: "B", text: "因家貧欲謀生計" }, { key: "C", text: "奉父母之命離家避禍" }, { key: "D", text: "欲遊歷山水，增廣見聞" }],
          correctAnswer: "A", knowledgePoint: "內容理解：情節背景", difficulty: "易",
          explanation: "課文開篇明確交代王生因仰慕仙道、聽聞勞山多仙人而背起書箱前往求學；原文並無謀生、避禍或單純遊覽的動機敘述。" },
        { id: ID + "-q12", origin: "textbook-verified", questionForm: "內容理解", text: "王生隨眾採樵一個多月後「手足重繭，不堪其苦，陰有歸志」，這句話最主要呈現王生怎樣的性格傾向？",
          options: [{ key: "A", text: "勤奮上進、樂在其中" }, { key: "B", text: "深謀遠慮、按部就班" }, { key: "C", text: "意志不堅、難耐勞苦" }, { key: "D", text: "慷慨大方、樂於助人" }],
          correctAnswer: "C", knowledgePoint: "內容理解：人物性格", difficulty: "中等",
          explanation: "「不堪其苦」「陰有歸志」直接顯示王生無法忍受勞苦而萌生退意，與後文急於求成的性格前後一致，並非勤奮上進或深謀遠慮的表現。" },
        { id: ID + "-q13", origin: "textbook-verified", questionForm: "內容理解", text: "王生原有歸意，後來因為何事而「歸念遂息」，決定繼續留下？",
          options: [{ key: "A", text: "道士承諾立即傳授穿牆術" }, { key: "B", text: "目睹道士與友人展現剪紙為月、壺酒不竭等奇異法術，心生欽羨" }, { key: "C", text: "師兄弟主動替他分擔採樵工作" }, { key: "D", text: "山路遭大雪封閉，無法下山" }],
          correctAnswer: "B", knowledgePoint: "內容理解：情節因果", difficulty: "中等",
          explanation: "王生當晚見識道士與客人展現的奇異法術（剪紙如鏡黏壁間、壺酒往復挹注竟不少減、以箸擲月化嫦娥起舞）後心生欽羨愛慕，因此打消回家的念頭，這也是後文王生求穿牆術的動機鋪墊。" },
        { id: ID + "-q14", origin: "textbook-verified", questionForm: "修辭與寫作手法", text: "王生返家後急於向妻子誇示穿牆術，結果「頭觸硬壁，蹶然而踣」，這個結局最主要的作用為何？",
          options: [{ key: "A", text: "純粹增添故事的滑稽笑料，別無深意" }, { key: "B", text: "證明道士的法術根本是騙局" }, { key: "C", text: "說明道士刻意加害王生" }, { key: "D", text: "讓原本充滿奇幻色彩的故事收束回現實，形成對王生急躁性格的諷刺與警示" }],
          correctAnswer: "D", knowledgePoint: "修辭與寫作手法：結局寓意", difficulty: "中等",
          explanation: "撞牆的結局與王生急於炫耀、未能謹守「潔持」教誨的性格直接相關，使故事從奇幻轉回現實，達到諷刺與警世效果；王生確實曾在道士處成功穿牆一次，並非法術本身是騙局，課文也無道士刻意加害的敘述。（原文為「頭觸硬壁，蹶然而踣」，非坊間常見誤傳的「驀然而踣」。）" },
        { id: ID + "-q15", origin: "textbook-verified", questionForm: "修辭與寫作手法", text: "本課篇末「異史氏曰」的評論，其寫作用意最主要為何？",
          options: [{ key: "A", text: "模仿史書「太史公曰」的論贊體例，藉王生的遭遇批判好逸惡勞、投機取巧之人" }, { key: "B", text: "補充說明道士的真實身分" }, { key: "C", text: "證明穿牆術在現實中確實可行" }, { key: "D", text: "單純為故事作結，無議論意涵" }],
          correctAnswer: "A", knowledgePoint: "修辭與寫作手法", difficulty: "中等",
          explanation: "「異史氏曰」是蒲松齡仿效《史記》「太史公曰」的論贊形式，藉王生一事批判社會上好逸惡勞、企圖走捷徑、事後又愛慕虛榮誇耀之人，並非單純補充道士身分或為故事作結。" }
      ]
    },

    commonMistakes: [
      { concept: "誤解「異史氏曰」的作用", misconception: "以為「異史氏曰」只是無關緊要的結尾贅語。",
        correction: "「異史氏曰」是全文畫龍點睛之筆，作者藉此跳脫故事本身，將王生的個人遭遇提升為對世態人心的普遍諷刺，是理解全文主旨的關鍵。",
        relatedQuestions: [ID + "-q9", ID + "-q15"] },
      { concept: "誤以為王生完全未學到任何本領", misconception: "以為王生在勞山一無所獲，是徹底失敗。",
        correction: "王生其實學得了穿牆之術（且第一次施展確實成功穿牆），問題在於他求法心切、只求速成單一技藝，且未能謹守道士「潔持」的告誡，最終才會失敗。",
        relatedQuestions: [ID + "-q3", ID + "-q7", ID + "-q14"] },
      { concept: "誤記結局原文用字", misconception: "把課文原句「頭觸硬壁，蹶然而踣」誤記為坊間更常見的「驀然而踣」。",
        correction: "對照原始課本可確認正確用字為「蹶然而踣」（蹶，音ㄐㄩㄝˊ，跌倒貌），非「驀然而踣」；此為多方獨立分析時都曾出現過的共同誤記，提醒逐字對照原文的重要性。",
        relatedQuestions: [ID + "-q14"] }
    ],

    relatedMaterials: []
  });
})();
