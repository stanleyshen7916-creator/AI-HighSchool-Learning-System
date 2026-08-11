/* data/materials/ChineseG11DuFuLvYeShuHuai.js — Teaching Material Repository entry.

   Source material：私立長榮中學 高二國文「近體詩選」單元──杜甫〈旅夜書懷〉
   （題解、作者介紹、課文本文，共 3 頁照片）。

   Content honesty note：
   - 題解與作者段落依課本照片可清楚辨識之內容整理。
   - 課文本文「細草微風岸，危檣獨夜舟。星垂平野闊，月湧大江流。名豈文章著，
     官應老病休。飄飄何所似，天地一沙鷗。」為杜甫〈旅夜書懷〉通行定本，
     照片本身亦清晰可辨識，逐字相符。
   - 本詩僅八句，可支撐之不重複題目數量有限，依使用者指示「無法達到50題
     可自動減少，不需為湊題而產生不必要的題目」，本課題目數低於50題標準。 */
window.AHS = window.AHS || {};
(function () {
  "use strict";
  if (!AHS.MaterialRepository || typeof AHS.MaterialRepository.register !== "function") { return; }

  var ID = "chinese-g11-dufu-lvyeshuhuai";

  AHS.MaterialRepository.register({
    id: ID,

    metadata: {
      subject: "chinese",
      subjectLabel: "國文",
      grade: "高二",
      chapter: "第三課／近體詩選",
      unit: "杜甫〈旅夜書懷〉",
      materialType: "課本",
      source: "私立長榮中學 高二國文課本「近體詩選」單元：杜甫〈旅夜書懷〉（題解／作者／課文）",
      keywords: ["杜甫", "詩聖", "詩史", "旅夜書懷", "五言律詩", "情景交融", "羈旅詩"],
      difficulty: "中等",
      createdAt: "2026-08-05",
      updatedAt: "2026-08-05",
      analyzedBy: "Teaching Material Analysis Center"
    },

    coreConcepts: [
      { term: "作者：杜甫", definition: "字子美，自號少陵野老，河南鞏縣人，生於唐玄宗先天元年（712），卒於唐代宗大曆五年（770），年五十九，被後世尊稱為「詩聖」，其詩反映社會現實、憂國憂民，被稱為「詩史」。" },
      { term: "體裁", definition: "〈旅夜書懷〉為五言律詩，是杜甫晚年漂泊西南時所作，抒發羈旅飄零、老病孤獨、壯志未酬之感慨。" },
      { term: "首聯：細草微風岸，危檣獨夜舟", definition: "以孤舟夜泊之景，襯托詩人孤獨飄零之感；「獨」字點出全詩孤寂基調。" },
      { term: "頷聯：星垂平野闊，月湧大江流", definition: "千古名句，以壯闊的星野江流反襯詩人渺小孤寂之情，是情景交融、以樂景寫哀情的代表句。" },
      { term: "頸聯：名豈文章著，官應老病休", definition: "反語自嘲：文名豈是我所求？辭官實因老病所致，暗含仕途不遇的無奈與感慨。" },
      { term: "尾聯：飄飄何所似，天地一沙鷗", definition: "以孤獨的沙鷗自喻，寫盡詩人漂泊無依、壯志未酬的悲涼心境，是全詩情感的總結。" }
    ],

    summary: {
      title: "國文｜杜甫〈旅夜書懷〉重點整理",
      keyPoints: [
        "作者杜甫，字子美，自號少陵野老，河南鞏縣人（712-770），被尊稱為「詩聖」，其詩反映社會現實、憂國憂民，被稱為「詩史」。",
        "〈旅夜書懷〉為五言律詩，是杜甫晚年漂泊西南時所作，抒發羈旅飄零、老病孤獨、壯志未酬之感慨。",
        "首聯「細草微風岸，危檣獨夜舟」以孤舟夜泊之景，襯托詩人孤獨飄零之感。",
        "頷聯「星垂平野闊，月湧大江流」為千古名句，以壯闊的星野江流反襯詩人渺小孤寂之情，是情景交融的代表句。",
        "頸聯「名豈文章著，官應老病休」為反語自嘲：文名豈是我所求？實因老病而辭官，暗含仕途不遇的無奈。",
        "尾聯「飄飄何所似，天地一沙鷗」以孤獨的沙鷗自喻，寫盡漂泊無依、壯志未酬的悲涼心境。",
        "全詩以寫景始、以抒懷結，情景交融，是杜甫晚年羈旅詩的代表作。"
      ],
      definitions: [
        "詩聖：後世對杜甫的尊稱，因其詩藝造詣登峰造極。",
        "詩史：後世對杜甫詩作的稱譽，因其詩多反映當代社會現實與時代動盪，具有史料價值。",
        "情景交融：詩歌寫作手法，將外在景物描寫與內在情感抒發融合為一，使景中含情、情因景生。",
        "反語：字面意思與實際意欲表達的情感相反或帶有嘲諷意味的修辭手法。"
      ],
      keywords: ["杜甫", "詩聖", "詩史", "五言律詩", "情景交融", "反語自嘲", "羈旅詩", "沙鷗"]
    },

    questionBank: {
      singleChoice: [
        { id: ID + "-q1", origin: "textbook-verified", questionForm: "文學常識", text: "〈旅夜書懷〉的作者被後世尊稱為？",
          options: [{ key: "A", text: "詩仙" }, { key: "B", text: "詩聖" }, { key: "C", text: "詩鬼" }, { key: "D", text: "詩佛" }],
          correctAnswer: "B", knowledgePoint: "文學常識：作者尊稱", difficulty: "易",
          explanation: "杜甫被後世尊稱為「詩聖」。" },
        { id: ID + "-q2", origin: "textbook-verified", questionForm: "文學常識", text: "杜甫的詩作因反映社會現實、時代動盪，被後世稱為？",
          options: [{ key: "A", text: "詩話" }, { key: "B", text: "詩史" }, { key: "C", text: "詩品" }, { key: "D", text: "詩鈔" }],
          correctAnswer: "B", knowledgePoint: "文學常識：詩作稱譽", difficulty: "易",
          explanation: "杜甫的詩多反映社會現實與時代動盪，被稱為「詩史」。" },
        { id: ID + "-q3", origin: "textbook-verified", questionForm: "文學常識", text: "杜甫，字為何？",
          options: [{ key: "A", text: "子美" }, { key: "B", text: "留仙" }, { key: "C", text: "退之" }, { key: "D", text: "摩詰" }],
          correctAnswer: "A", knowledgePoint: "文學常識：作者字號", difficulty: "易",
          explanation: "杜甫字子美。" },
        { id: ID + "-q4", origin: "textbook-verified", questionForm: "文學常識", text: "杜甫自號為？",
          options: [{ key: "A", text: "青蓮居士" }, { key: "B", text: "少陵野老" }, { key: "C", text: "柳泉居士" }, { key: "D", text: "六一居士" }],
          correctAnswer: "B", knowledgePoint: "文學常識：作者自號", difficulty: "中等",
          explanation: "杜甫自號少陵野老。" },
        { id: ID + "-q5", origin: "textbook-verified", questionForm: "文學常識", text: "杜甫的籍貫為？",
          options: [{ key: "A", text: "河南鞏縣" }, { key: "B", text: "山東淄川" }, { key: "C", text: "四川成都" }, { key: "D", text: "江西修水" }],
          correctAnswer: "A", knowledgePoint: "文學常識：籍貫", difficulty: "中等",
          explanation: "杜甫籍貫河南鞏縣。" },
        { id: ID + "-q6", origin: "textbook-verified", questionForm: "文學常識", text: "杜甫享年幾歲？",
          options: [{ key: "A", text: "四十九歲" }, { key: "B", text: "五十九歲" }, { key: "C", text: "六十九歲" }, { key: "D", text: "七十六歲" }],
          correctAnswer: "B", knowledgePoint: "文學常識：生卒年", difficulty: "中等",
          explanation: "杜甫生於712年，卒於770年，年五十九。" },
        { id: ID + "-q7", origin: "textbook-verified", questionForm: "文學常識", text: "〈旅夜書懷〉的體裁是？",
          options: [{ key: "A", text: "七言絕句" }, { key: "B", text: "五言律詩" }, { key: "C", text: "樂府詩" }, { key: "D", text: "詞" }],
          correctAnswer: "B", knowledgePoint: "文學常識：體裁", difficulty: "易",
          explanation: "〈旅夜書懷〉為五言律詩，共八句。" },
        { id: ID + "-q8", origin: "textbook-verified", questionForm: "文學常識", text: "〈旅夜書懷〉最可能作於杜甫人生的哪個階段？",
          options: [{ key: "A", text: "青年得意、初入仕途之時" }, { key: "B", text: "晚年漂泊西南、老病交加之時" }, { key: "C", text: "中年官至宰相之時" }, { key: "D", text: "少年遊學求師之時" }],
          correctAnswer: "B", knowledgePoint: "文學常識：創作背景", difficulty: "中等",
          explanation: "本詩是杜甫晚年漂泊西南時所作，抒發羈旅飄零、老病孤獨之感。" },

        { id: ID + "-q9", origin: "textbook-verified", questionForm: "字詞注釋", text: "「危檣獨夜舟」中「危檣」意思是？",
          options: [{ key: "A", text: "破損的船身" }, { key: "B", text: "高聳的船桅" }, { key: "C", text: "危險的暗礁" }, { key: "D", text: "傾斜的船帆" }],
          correctAnswer: "B", knowledgePoint: "字詞注釋", difficulty: "中等",
          explanation: "「危檣」指高聳的船桅，「危」在此作「高」解。" },
        { id: ID + "-q10", origin: "textbook-verified", questionForm: "字詞注釋", text: "「星垂平野闊」中「垂」字所描寫的景象是？",
          options: [{ key: "A", text: "星光低垂，彷彿貼近遼闊的原野" }, { key: "B", text: "星星逐漸消失" }, { key: "C", text: "星星墜落地面" }, { key: "D", text: "星光被雲遮蔽" }],
          correctAnswer: "A", knowledgePoint: "字詞注釋", difficulty: "中等",
          explanation: "「星垂」形容星光低垂，彷彿因原野遼闊而顯得貼近地面。" },
        { id: ID + "-q11", origin: "textbook-verified", questionForm: "字詞注釋", text: "「月湧大江流」中「湧」字所描寫的景象是？",
          options: [{ key: "A", text: "月光隨江水波動而彷彿湧動" }, { key: "B", text: "江水乾涸" }, { key: "C", text: "月亮墜入江中" }, { key: "D", text: "江面結冰" }],
          correctAnswer: "A", knowledgePoint: "字詞注釋", difficulty: "中等",
          explanation: "「月湧」形容月光映照在奔流的江水上，隨波光粼粼而彷彿湧動。" },
        { id: ID + "-q12", origin: "textbook-verified", questionForm: "字詞注釋", text: "「名豈文章著」中「豈」字的語氣作用是？",
          options: [{ key: "A", text: "表示肯定、加強語氣" }, { key: "B", text: "表示反詰、否定之意" }, { key: "C", text: "表示疑問，不含情緒" }, { key: "D", text: "表示感嘆、讚美" }],
          correctAnswer: "B", knowledgePoint: "字詞注釋：虛詞", difficulty: "中等",
          explanation: "「豈」為反詰語氣詞，此句意為「文名豈是我所追求的呢」，帶有否定、自嘲之意。" },
        { id: ID + "-q13", origin: "textbook-verified", questionForm: "字詞注釋", text: "「官應老病休」中「應」字意思最接近？",
          options: [{ key: "A", text: "應該、理應（此處帶自嘲語氣）" }, { key: "B", text: "回應、答覆" }, { key: "C", text: "應付、敷衍" }, { key: "D", text: "答應、允諾" }],
          correctAnswer: "A", knowledgePoint: "字詞注釋：虛詞", difficulty: "中等",
          explanation: "「應」作「應該」解，此處以自嘲語氣說明辭官是因老病所致。" },
        { id: ID + "-q14", origin: "textbook-verified", questionForm: "字詞注釋", text: "「飄飄何所似」中「飄飄」形容的是？",
          options: [{ key: "A", text: "衣袂隨風飛揚的美感" }, { key: "B", text: "人生漂泊無依的狀態" }, { key: "C", text: "雪花飛舞的景象" }, { key: "D", text: "船隻行駛快速" }],
          correctAnswer: "B", knowledgePoint: "字詞注釋", difficulty: "中等",
          explanation: "「飄飄」在此形容詩人漂泊無依、居無定所的人生狀態。" },
        { id: ID + "-q15", origin: "textbook-verified", questionForm: "字詞注釋", text: "「天地一沙鷗」中詩人以沙鷗自喻，最主要是取沙鷗的何種特質？",
          options: [{ key: "A", text: "凶猛善鬥" }, { key: "B", text: "孤獨、渺小、漂泊無依" }, { key: "C", text: "色彩鮮豔" }, { key: "D", text: "群居合作" }],
          correctAnswer: "B", knowledgePoint: "字詞注釋／內容理解", difficulty: "中等",
          explanation: "詩人以在天地間孤獨飛翔的一隻沙鷗自喻，取其孤獨渺小、漂泊無依的意象。" },

        { id: ID + "-q16", origin: "textbook-verified", questionForm: "內容理解", text: "首聯「細草微風岸，危檣獨夜舟」所描寫的場景是？",
          options: [{ key: "A", text: "白日熱鬧的市集" }, { key: "B", text: "夜晚孤舟停泊江岸的景象" }, { key: "C", text: "戰場上兩軍對峙" }, { key: "D", text: "山中隱居的居所" }],
          correctAnswer: "B", knowledgePoint: "內容理解：首聯", difficulty: "易",
          explanation: "首聯描寫細草微風輕拂江岸，一艘高桅孤舟獨自停泊夜宿的景象。" },
        { id: ID + "-q17", origin: "textbook-verified", questionForm: "內容理解", text: "頸聯「名豈文章著，官應老病休」所表達的真正心境為？",
          options: [{ key: "A", text: "對自己文章成就感到自豪" }, { key: "B", text: "以反語自嘲仕途不遇，辭官實因老病所迫的無奈" }, { key: "C", text: "慶幸終於能夠退休享福" }, { key: "D", text: "對朝廷心懷感激" }],
          correctAnswer: "B", knowledgePoint: "內容理解：頸聯", difficulty: "中等",
          explanation: "此聯以反語自嘲，暗含仕途不遇、被迫因老病去職的無奈與感慨，並非真正以文名自豪或甘於退休。" },
        { id: ID + "-q18", origin: "textbook-verified", questionForm: "內容理解", text: "全詩八句中，何處由寫景轉為直接抒情議論？",
          options: [{ key: "A", text: "首聯與頷聯" }, { key: "B", text: "頸聯（名豈文章著，官應老病休）" }, { key: "C", text: "全詩皆為寫景，無抒情" }, { key: "D", text: "全詩皆為抒情，無寫景" }],
          correctAnswer: "B", knowledgePoint: "內容理解：結構安排", difficulty: "中等",
          explanation: "首聯、頷聯以寫景為主，至頸聯轉為直接抒發仕途不遇的感慨，尾聯再以沙鷗意象收束全詩情感。" },
        { id: ID + "-q19", origin: "textbook-verified", questionForm: "內容理解", text: "「天地一沙鷗」在全詩結構中的作用是？",
          options: [{ key: "A", text: "開啟下一段新的敘述" }, { key: "B", text: "總結全詩漂泊無依、孤獨渺小的情感基調" }, { key: "C", text: "與主旨無關的閒筆" }, { key: "D", text: "轉為歌頌壯麗山河" }],
          correctAnswer: "B", knowledgePoint: "內容理解：結構作用", difficulty: "中等",
          explanation: "尾聯以孤獨的沙鷗自喻，總結全詩漂泊無依、孤獨渺小的情感基調，是全詩情感的收束。" },

        { id: ID + "-q20", origin: "ai-derived", questionForm: "修辭與寫作手法", text: "「星垂平野闊，月湧大江流」所使用的主要寫作手法是？",
          options: [{ key: "A", text: "對比映襯，以壯闊之景襯托詩人自身的孤寂渺小" }, { key: "B", text: "直接抒情，不假景物" }, { key: "C", text: "用典明志" }, { key: "D", text: "純粹寫景，與情感無關" }],
          correctAnswer: "A", knowledgePoint: "修辭與寫作手法：以景襯情", difficulty: "中等",
          explanation: "此聯表面寫壯闊夜景，實則以景物之壯闊反襯詩人自身之渺小孤獨，是「以樂景寫哀情」的典型手法。" },
        { id: ID + "-q21", origin: "ai-derived", questionForm: "修辭與寫作手法", text: "「名豈文章著，官應老病休」一句所使用的語氣屬於？",
          options: [{ key: "A", text: "自豪誇耀" }, { key: "B", text: "反語自嘲" }, { key: "C", text: "直接責備他人" }, { key: "D", text: "平鋪直敘、不帶情緒" }],
          correctAnswer: "B", knowledgePoint: "修辭與寫作手法：反語", difficulty: "中等",
          explanation: "此句以反語自嘲的語氣，表面言文名、辭官，實則暗含仕途失意的無奈與感慨。" },
        { id: ID + "-q22", origin: "ai-derived", questionForm: "修辭與寫作手法", text: "尾聯「飄飄何所似，天地一沙鷗」使用了何種修辭手法？",
          options: [{ key: "A", text: "設問加譬喻，以沙鷗自喻漂泊心境" }, { key: "B", text: "誇飾加排比" }, { key: "C", text: "頂真加類疊" }, { key: "D", text: "借代加雙關" }],
          correctAnswer: "A", knowledgePoint: "修辭與寫作手法", difficulty: "中等",
          explanation: "「飄飄何所似」以設問開啟，「天地一沙鷗」以譬喻作答，將自身比擬為天地間一隻孤獨的沙鷗。" },
        { id: ID + "-q23", origin: "ai-derived", questionForm: "修辭與寫作手法", text: "全詩「情景交融」的寫作手法，主要體現在下列哪一組詩句的組合關係中？",
          options: [{ key: "A", text: "頷聯壯闊之景與頸聯、尾聯孤寂之情的強烈對照" }, { key: "B", text: "全詩八句皆為純粹寫景，毫無情感" }, { key: "C", text: "全詩八句皆為純粹抒情，毫無寫景" }, { key: "D", text: "首聯與尾聯互相矛盾、邏輯不通" }],
          correctAnswer: "A", knowledgePoint: "修辭與寫作手法：情景交融", difficulty: "難",
          explanation: "頷聯以壯闊星野江流之景，與頸聯、尾聯所抒發的孤寂身世之情形成強烈對照，正是「情景交融、以景襯情」的具體展現。" },

        { id: ID + "-q24", origin: "ai-derived", questionForm: "主旨與情意", text: "本詩最主要抒發的情感是？",
          options: [{ key: "A", text: "對山水美景的單純讚嘆" }, { key: "B", text: "羈旅飄零、老病孤獨、壯志未酬的悲涼感慨" }, { key: "C", text: "對友人重逢的喜悅" }, { key: "D", text: "對戰爭勝利的歌頌" }],
          correctAnswer: "B", knowledgePoint: "主旨與情意", difficulty: "易",
          explanation: "全詩抒發杜甫晚年漂泊西南、老病交加、壯志未酬的悲涼心境。" },
        { id: ID + "-q25", origin: "ai-derived", questionForm: "主旨與情意", text: "詩人以「沙鷗」而非其他意象（如鴻雁、大鵬）自喻，最能強調何種情感特質？",
          options: [{ key: "A", text: "遠大志向、一飛沖天" }, { key: "B", text: "孤獨渺小、漂泊無依、命運無法自主" }, { key: "C", text: "群體合作、團結一心" }, { key: "D", text: "凶猛威武、睥睨天下" }],
          correctAnswer: "B", knowledgePoint: "主旨與情意：意象選擇", difficulty: "難",
          explanation: "沙鷗形體渺小、隨波逐流、居無定所，最能貼切呈現詩人晚年漂泊無依、命運身不由己的孤寂心境，與「大鵬」等象徵遠大志向的意象截然不同。" }
      ],
      fillIn: [
        { id: ID + "-fib1", origin: "textbook-verified", text: "杜甫被後世尊稱為「＿＿＿」，其詩作因反映社會現實而被稱為「詩史」。", answer: "詩聖", knowledgePoint: "文學常識" },
        { id: ID + "-fib2", origin: "textbook-verified", text: "〈旅夜書懷〉的體裁是＿＿＿律詩。", answer: "五言", knowledgePoint: "文學常識：體裁" },
        { id: ID + "-fib3", origin: "textbook-verified", text: "「星垂平野闊，月湧大＿＿流」為本詩頷聯的千古名句。", answer: "江", knowledgePoint: "課文默寫" },
        { id: ID + "-fib4", origin: "textbook-verified", text: "詩末以「天地一＿＿」自喻，寫盡漂泊無依之感。", answer: "沙鷗", knowledgePoint: "課文默寫／內容理解" }
      ],
      trueFalse: [
        { id: ID + "-tf1", origin: "textbook-verified", text: "〈旅夜書懷〉是杜甫年輕得意時所作，內容歌頌功成名就的喜悅。", answer: false, knowledgePoint: "文學常識：創作背景",
          explanation: "本詩是杜甫晚年漂泊西南、老病交加時所作，抒發的是孤獨飄零之感，並非年輕得意之作。" },
        { id: ID + "-tf2", origin: "textbook-verified", text: "「名豈文章著，官應老病休」是杜甫真心以文名自豪、甘願辭官退休之語。", answer: false, knowledgePoint: "內容理解：頸聯",
          explanation: "此句實為反語自嘲，暗含仕途不遇、被迫因老病去職的無奈，並非真心自豪或甘願。" },
        { id: ID + "-tf3", origin: "textbook-verified", text: "「星垂平野闊，月湧大江流」是本詩流傳千古的名句，以壯闊之景反襯詩人的孤寂渺小。", answer: true, knowledgePoint: "修辭與寫作手法" },
        { id: ID + "-tf4", origin: "textbook-verified", text: "本詩尾聯以沙鷗自喻，象徵詩人志向遠大、前途光明。", answer: false, knowledgePoint: "主旨與情意",
          explanation: "尾聯以沙鷗自喻，象徵的是詩人漂泊無依、孤獨渺小的心境，而非志向遠大、前途光明。" }
      ]
    },

    commonMistakes: [
      { concept: "誤讀「名豈文章著，官應老病休」的語氣", misconception: "以為此句是杜甫真心以文章成名為榮、甘願因老病退休。",
        correction: "此句實為反語自嘲，杜甫真正想表達的是仕途不遇的無奈，辭官是被迫而非甘願。",
        relatedQuestions: [ID + "-q12", ID + "-q13", ID + "-q17", ID + "-q21", ID + "-tf2"] },
      { concept: "誤解「星垂平野闊，月湧大江流」純為寫景，與情感無關", misconception: "以為頷聯只是單純的寫景句，與全詩孤寂主旨無關。",
        correction: "此聯表面寫壯闊夜景，實則以景物之壯闊反襯詩人自身的渺小孤獨，是「情景交融、以樂景寫哀情」的關鍵句。",
        relatedQuestions: [ID + "-q20", ID + "-q23"] }
    ],

    relatedMaterials: []
  });
})();
