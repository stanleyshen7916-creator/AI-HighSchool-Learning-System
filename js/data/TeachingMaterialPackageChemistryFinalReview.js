/* js/data/TeachingMaterialPackageChemistryFinalReview.js
   Teaching Material Repository — Material Package.
   PMO Decision (Teaching Material Upload v1.0, LOCK): new teaching
   material is no longer written into js/data/MockData.js. This file is
   one immutable "Repository Material Package" — a plain data record
   under window.AHS.Data.TeachingMaterialPackages, loaded by
   js/runtime/TeachingMaterialLoader.js and turned into real
   MaterialRuntime / KnowledgeGraphRuntime records by
   js/runtime/TeachingMaterialRepositoryBridge.js. This file contains
   NO logic — data only, exactly like every other file in js/data/.

   Source: 私立長榮高級中學114學年度第二學期高一化學期末考試題卷.
   Every practiceQuestions entry was solved/verified against real
   chemistry facts (not OCR-guessed); items whose source figure/diagram
   was ambiguous (氮循環圖、核酸鏈結構圖、溶解度圖確切數值) were not
   reproduced as-is — a fully self-verifiable original question on the
   same concept was written instead (origin: "generated").
   origin: "repository" = same setup/data/answer as a real question on
   the source exam; origin: "generated" = an AI-authored extension
   question covering the same knowledge point. */
window.AHS = window.AHS || {};
AHS.Data = AHS.Data || {};
AHS.Data.TeachingMaterialPackages = AHS.Data.TeachingMaterialPackages || {};

AHS.Data.TeachingMaterialPackages["chemistry-final-exam-review-v1"] = {
  packageId: "chemistry-final-exam-review-v1",
  version: "1.0",
  metadata: {
    sourceExam: "私立長榮高級中學114學年度第二學期高一（1~4班）化學科期末考試題卷",
    scope: "溶液配製、酸鹼指示劑、溶解度、奈米科技、氧化還原與環境化學",
    analyzedBy: "Claude Code",
    analyzedAt: "2026-08-02",
    ocrPolicy: "不得使用 OCR 猜測答案；辨識不足之題目（如氮循環圖、核酸鏈結構圖）已略過，未自行補答案。"
  },
  subject: "chemistry",
  grade: "高一",
  chapter: "溶液配製、酸鹼指示劑、溶解度、奈米科技、氧化還原與環境化學",
  keywords: ["溶液配製", "酸鹼指示劑", "溶解度", "奈米效應", "膠體", "氧化還原", "綠色化學", "花青素"],
  summary: "本教材彙整高一化學期末考重點，涵蓋溶液配製與稀釋計算、酸鹼指示劑變色原理、強酸鹼稀釋的 pH 變化、溶解度與結晶量計算、奈米科技的表面效應、膠體與真溶液的區別、能源分類、大氣環境問題成因（臭氧層破壞、酸雨、溫室效應）、核酸結構、氧化還原反應判斷、綠色化學原子經濟、生活化學藥品與清潔劑成分，以及花青素酸鹼變色應用，並附 21 題模擬試題與完整詳解，適合期末考前複習與自我檢測。",
  reviewSuggestion: "建議複習順序：先熟悉濃度換算與稀釋計算，再掌握各類指示劑的變色範圍判讀，接著練習溶解度結晶量計算與氧化還原氧化數判斷，最後複習環境化學（臭氧層／酸雨／溫室效應成因）與生活化學（藥品、清潔劑成分）常考觀念。",
  questions: [
    { id: "kp1", type: "formula", label: "重量百分濃度與莫耳濃度換算", content: "重量百分濃度與莫耳濃度換算公式：M=(1000×比重×重量百分濃度)/分子量。" },
    { id: "kp2", type: "concept", label: "定量溶液配製器材", content: "精確量取定量液體用吸量管（移液管），精確定容配製溶液用容量瓶；稀釋公式 C₁V₁=C₂V₂。" },
    { id: "kp3", type: "knowledge_point", label: "酸鹼指示劑變色原理", content: "每種指示劑都有其變色 pH 範圍，pH 低於範圍呈「酸性顏色」，高於範圍呈「鹼性顏色」，範圍內為過渡色。" },
    { id: "kp4", type: "concept", label: "強鹼稀釋的 pH 變化趨勢", content: "強鹼（或強酸）以水稀釋：pH 值會漸漸趨近 7，但強鹼稀釋後 pH 恆大於 7、強酸稀釋後 pH 恆小於 7，不會跨過 7 變成相反性質。" },
    { id: "kp5", type: "knowledge_point", label: "溶解度與溫度關係", content: "多數固體溶質的溶解度隨溫度上升而增加（溶解為吸熱反應）；由高溫飽和溶液冷卻至低溫時，超出低溫溶解度的部分會結晶析出，可用比例法計算析出量。" },
    { id: "kp6", type: "concept", label: "奈米效應", content: "物體尺寸縮小時，表面積 A 與體積 V 之比（A/V）及表面原子數與總原子數之比（n/N）都會上升，此表面效應使奈米材料的化學反應性、催化效率大幅提高；n/N 與半徑 R 成反比。" },
    { id: "kp7", type: "definition", label: "膠體與真溶液的區別", content: "真溶液（如食鹽水）粒子過小，無法以（超）顯微鏡觀察到廷得耳效應／布朗運動的散射光點；膠體（如牛奶、咖啡、醬油）粒子夠大，可觀察到此現象。" },
    { id: "kp8", type: "keyword", label: "能源分類", content: "由農畜廢水、有機廢棄物、藻類發酵產生甲烷（沼氣）並用於燃燒供能，屬於「生質能」。" },
    { id: "kp9", type: "knowledge_point", label: "大氣與環境問題成因", content: "臭氧層破壞主因為氟氯碳化物（CFCs）；酸雨主因為硫的氧化物（及氮的氧化物）；溫室效應主因為二氧化碳等溫室氣體吸收紅外線（非紫外光）。" },
    { id: "kp10", type: "definition", label: "核酸結構", content: "核酸（DNA/RNA）主鏈由「磷酸－（去氧）核糖」交替鍵結而成，含氮鹼基則以支鏈形式接在核糖上，並非主鏈的一部分。" },
    { id: "kp11", type: "concept", label: "氧化還原判斷", content: "先為各原子標定氧化數，氧化數上升者被氧化（本身是還原劑），氧化數下降者被還原（本身是氧化劑）；同一反應中可能同時存在超過一種氧化劑。" },
    { id: "kp12", type: "concept", label: "綠色化學／原子經濟", content: "綠色化學核心精神為「原子經濟」，理想反應是所有反應物原子都轉化為目標產物、副產物越少越好，應從源頭減少污染，而非末端處理或轉移污染。" },
    { id: "kp13", type: "knowledge_point", label: "生活化學藥品與清潔劑", content: "常見成分需對應正確功用，例如氫氧化鋁、碳酸氫鈉為制酸劑；柳酸甲酯為外用止痛成分；磺胺類藥物屬於抗菌（磺胺劑）而非單純消炎藥。" },
    { id: "kp14", type: "keyword", label: "醣類與界面活性劑", content: "蔗糖為雙醣，水解得葡萄糖與果糖各一分子；界面活性劑分子具親水端（如 -COO⁻、-SO₃⁻）與親油端（長碳鏈），親水端易與硬水中 Ca²⁺、Mg²⁺形成沉澱者為「硬性清潔劑」。" }
  ],
  practiceQuestions: [
    { id: "pq1", origin: "generated", type: "計算", knowledgePoint: "重量百分濃度與莫耳濃度換算",
      question: "已知濃硫酸重量百分濃度 98%，比重 1.8，分子量 H₂SO₄=98，求其莫耳濃度。",
      options: null, correctAnswer: "18 M",
      explanation: "M = (1000×比重×重量百分濃度) / 分子量 = (1000×1.8×0.98) / 98 = 18 M。" },
    { id: "pq2", origin: "repository", type: "計算", knowledgePoint: "稀釋計算",
      question: "承上題，欲配製 24.5%（比重 1.2）稀硫酸 1000 mL，需另外加入多少毫升蒸餾水（與所取的 98% 濃硫酸混合）？",
      options: null, correctAnswer: "約 900 mL",
      explanation: "目標溶液總質量 = 1000×1.2 = 1200g；所需 H₂SO₄ 質量 = 1200×0.245 = 294g；提供 294g H₂SO₄ 所需 98% 濃硫酸質量 = 294/0.98 = 300g；加水質量 = 1200−300 = 900g ≈ 900 mL。" },
    { id: "pq3", origin: "generated", type: "單選", knowledgePoint: "定量溶液配製器材",
      question: "配製一定體積、一定濃度的溶液時，若要精確量取某體積的濃硫酸，並將稀釋後的溶液準確定容至一定體積，最適合依序使用的器材為？",
      options: [
        { key: "A", text: "燒杯、量筒" }, { key: "B", text: "量筒、燒杯" },
        { key: "C", text: "吸量管、容量瓶" }, { key: "D", text: "容量瓶、吸量管" }
      ],
      correctAnswer: "C",
      explanation: "吸量管（移液管）可精確量取一定體積的液體；容量瓶頸部有精確刻度線，用於將溶液加水定容至準確的總體積。燒杯與量筒僅適合粗略量測。" },
    { id: "pq4", origin: "repository", type: "單選", knowledgePoint: "酸鹼指示劑變色判斷",
      question: "取少量稀鹽酸，滴入酚紅指示劑（變色範圍 pH 6.4~8.2，酸性色黃、鹼性色紅），已知該鹽酸的 pH 小於 3，則酚紅應呈現何色？",
      options: [{ key: "A", text: "黃色" }, { key: "B", text: "紅色" }, { key: "C", text: "無色" }, { key: "D", text: "紫紅色" }],
      correctAnswer: "A",
      explanation: "該溶液 pH（<3）低於酚紅變色範圍下限（6.4），故呈現其「酸性顏色」黃色。" },
    { id: "pq5", origin: "repository", type: "單選", knowledgePoint: "酸鹼指示劑變色判斷（鹼性）",
      question: "剛果紅的變色範圍為 pH 3.1~5.1（酸性色藍、鹼性色紅），石蕊為 pH 4.5~8.3（酸性色紅、鹼性色藍）。若溶液 pH=9.6，下列敘述何者錯誤？",
      options: [
        { key: "A", text: "剛果紅為藍色" }, { key: "B", text: "石蕊為藍色" },
        { key: "C", text: "剛果紅為紅色" }, { key: "D", text: "石蕊已呈鹼性顏色" }
      ],
      correctAnswer: "A",
      explanation: "pH=9.6 遠高於剛果紅變色範圍上限（5.1），應呈現其「鹼性顏色」紅色，而非藍色，故 (A) 錯誤、(C) 正確。石蕊上限為 8.3，pH=9.6 亦高於此上限，呈鹼性顏色藍色，(B)(D) 皆正確。" },
    { id: "pq6", origin: "generated", type: "單選", knowledgePoint: "強鹼稀釋的 pH 變化趨勢",
      question: "將 0.1M 氫氧化鈉溶液不斷加水稀釋，其 pH 值隨加水量增加的變化趨勢最可能為？",
      options: [
        { key: "A", text: "持續下降至低於 7 後趨於平緩" }, { key: "B", text: "持續下降但恆大於 7，並趨近 7" },
        { key: "C", text: "持續上升趨近某定值" }, { key: "D", text: "維持不變" }
      ],
      correctAnswer: "B",
      explanation: "強鹼加水稀釋只會使鹼性減弱，pH 值會逐漸下降並趨近 7，但由於水的解離平衡限制，pH 值恆大於 7，不可能因稀釋而變成酸性（pH<7）。" },
    { id: "pq7", origin: "repository", type: "計算", knowledgePoint: "溶解度與結晶量計算",
      question: "已知硝酸鉀在 60°C 時溶解度為 110 克/100 克水，在 20°C 時溶解度為 30 克/100 克水。取 105 克 60°C 的硝酸鉀飽和溶液，緩慢冷卻至 20°C，可析出多少克硝酸鉀結晶？",
      options: null, correctAnswer: "40.0 克",
      explanation: "60°C 飽和溶液中，每 210 克溶液含 110 克硝酸鉀與 100 克水。105 克恰為此比例的一半，含 55 克硝酸鉀與 50 克水。20°C 時 50 克水最多溶解 30/100×50=15 克，析出量 = 55−15 = 40 克。" },
    { id: "pq8", origin: "repository", type: "單選", knowledgePoint: "溶解度與吸放熱",
      question: "由硝酸鉀與氯化鉀的溶解度-溫度關係圖可知，兩者的溶解度皆隨溫度升高而增加，這代表兩者溶於水的過程屬於？",
      options: [
        { key: "A", text: "皆為吸熱" }, { key: "B", text: "皆為放熱" },
        { key: "C", text: "硝酸鉀吸熱、氯化鉀放熱" }, { key: "D", text: "無法判斷" }
      ],
      correctAnswer: "A",
      explanation: "若升高溫度使溶解度增加，依勒沙特列原理，代表升溫有利於正向（溶解）反應進行，故溶解過程為吸熱反應。" },
    { id: "pq9", origin: "repository", type: "計算", knowledgePoint: "奈米效應（表面原子比）",
      question: "半徑 100nm 的實心鐵球，其表面原子數與總原子數比值（n/N）是半徑 1.0cm 實心鐵球的多少倍？",
      options: null, correctAnswer: "10⁵ 倍",
      explanation: "n/N 近似與球半徑 R 成反比。兩球半徑比 = 1.0cm/100nm = (1.0×10⁷nm)/(100nm) = 10⁵，半徑愈小者 n/N 愈大，比值為 10⁵ 倍。" },
    { id: "pq10", origin: "generated", type: "計算", knowledgePoint: "奈米尺度換算",
      question: "已知某奈米結構的特徵尺寸約為 100nm，氫原子直徑約 0.1nm，則此結構尺寸約為氫原子直徑的多少倍？",
      options: null, correctAnswer: "1000 倍",
      explanation: "100nm ÷ 0.1nm = 1000 倍。" },
    { id: "pq11", origin: "repository", type: "單選", knowledgePoint: "膠體與真溶液的區別",
      question: "以（超）顯微鏡於垂直光線方向觀察下列液態物質，何者因粒子過小（屬真溶液而非膠體）而無法觀察到光散射（廷得耳效應）的點狀分布？",
      options: [{ key: "A", text: "食鹽水" }, { key: "B", text: "牛奶" }, { key: "C", text: "咖啡" }, { key: "D", text: "醬油" }],
      correctAnswer: "A",
      explanation: "食鹽水中溶質為 Na⁺、Cl⁻離子，粒徑遠小於膠體粒子，屬於真溶液，無法產生可觀察到的光散射；牛奶、咖啡、醬油皆含懸浮膠體顆粒，可觀察到散射光點。" },
    { id: "pq12", origin: "repository", type: "單選", knowledgePoint: "能源分類",
      question: "利用農畜廢水、有機廢棄物與藻類發酵所產生的甲烷，經燃燒後用於家用暖氣、發電及溫水游泳池加熱，此能源應歸類為？",
      options: [{ key: "A", text: "生質能" }, { key: "B", text: "太陽能" }, { key: "C", text: "地熱能" }, { key: "D", text: "潮汐能" }],
      correctAnswer: "A",
      explanation: "由生物性廢棄物轉化而來的能源（如沼氣中的甲烷）屬於生質能。" },
    { id: "pq13", origin: "repository", type: "單選", knowledgePoint: "臭氧層破壞成因",
      question: "下列何者為造成臭氧層破壞的主要化合物？",
      options: [{ key: "A", text: "碳氫化合物" }, { key: "B", text: "氟氯碳化物" }, { key: "C", text: "硫的氧化物" }, { key: "D", text: "塑膠微粒" }],
      correctAnswer: "B",
      explanation: "氟氯碳化物（CFCs）在平流層受紫外線照射分解出氯自由基，催化破壞臭氧分子；硫的氧化物主要造成酸雨。" },
    { id: "pq14", origin: "generated", type: "多選", knowledgePoint: "氧化還原反應判斷",
      question: "黑火藥反應式：2KNO₃(s)+3C(s)+S(s) →點燃→ K₂S(s)+N₂(g)+3CO₂(g)。下列敘述哪些正確？（應選 2 項）",
      options: [
        { key: "A", text: "碳是還原劑" }, { key: "B", text: "硫是還原劑" },
        { key: "C", text: "氮由 +5 變為 0，被還原" }, { key: "D", text: "反應中只有一種氧化劑" }, { key: "E", text: "鉀的氧化數改變" }
      ],
      correctAnswer: "A、C",
      explanation: "K 皆為 +1（不變），(E)錯。N 由 +5 降為 0，被還原，即 N 是氧化劑，(C)對。C 由 0 升為 +4，被氧化，是還原劑，(A)對。S 由 0 降為 −2，被還原，本身是氧化劑而非還原劑，(B)錯。N 和 S 都被還原，反應中不只一種氧化劑，(D)錯。正確為 (A)(C)。" },
    { id: "pq15", origin: "repository", type: "單選", knowledgePoint: "綠色化學／原子經濟",
      question: "在綠色化學的原則下，下列哪一種做法最符合「原子經濟」精神？",
      options: [
        { key: "A", text: "深埋含鎘、汞的廢舊電池" }, { key: "B", text: "由乙烯直接水合製造酒精（C₂H₄+H₂O→C₂H₅OH）" },
        { key: "C", text: "化工廢氣向高空排放" }, { key: "D", text: "農民就地焚燒稻稈" }
      ],
      correctAnswer: "B",
      explanation: "乙烯直接水合生成酒精的加成反應中，反應物原子幾乎全部進入產物，原子利用率高，符合綠色化學精神；其餘選項皆為末端污染處理方式。" },
    { id: "pq16", origin: "repository", type: "單選", knowledgePoint: "生活化學（藥品成分與用途）",
      question: "下列常見家用藥品／清潔劑成分與其主要用途的配對，何者最需要修正？",
      options: [
        { key: "A", text: "氫氧化鋁——制酸劑，保護胃壁" }, { key: "B", text: "柳酸甲酯（冬青油）——肌肉痠痛的外用止痛劑" },
        { key: "C", text: "碳酸氫鈉——制酸、緩解胃酸過多" }, { key: "D", text: "磺胺類藥物（如對胺基苯磺醯胺）——消炎藥" }
      ],
      correctAnswer: "D",
      explanation: "磺胺類藥物主要作用機制是抑制細菌葉酸合成，屬於「抗菌（磺胺）藥物」，用於治療細菌感染，而非一般認知的消炎止痛藥。" },
    { id: "pq17", origin: "generated", type: "單選", knowledgePoint: "水溶液酸鹼性判斷",
      question: "下列有關水溶液酸鹼性的敘述，何者正確？",
      options: [
        { key: "A", text: "於水中加入酸，Kw 會變小" }, { key: "B", text: "[H⁺]>[OH⁻] 的溶液必為酸性" },
        { key: "C", text: "25°C 時 pH>pOH 的溶液呈酸性" }, { key: "D", text: "中性溶液中 [H⁺]=[OH⁻]=0" }
      ],
      correctAnswer: "B",
      explanation: "Kw 僅隨溫度改變，(A)錯。[H⁺]>[OH⁻] 為酸性溶液的定義，(B)對。25°C 時 pH+pOH=14，pH>pOH 則 pH>7，代表鹼性，(C)錯。中性溶液中 [H⁺]=[OH⁻]=1×10⁻⁷M，並非 0，(D)錯。" },
    { id: "pq18", origin: "generated", type: "單選", knowledgePoint: "核酸結構",
      question: "DNA／RNA 的核苷酸鏈中，其「主鏈」的正確重複連接方式為何？",
      options: [
        { key: "A", text: "磷酸與（去氧）核糖交替鍵結成主鏈，含氮鹼基以支鏈形式接在核糖上" },
        { key: "B", text: "含氮鹼基與磷酸交替鍵結成主鏈，核糖以支鏈形式接在含氮鹼基上" },
        { key: "C", text: "三者依序排列在同一條主鏈上，無分支" },
        { key: "D", text: "核糖與含氮鹼基交替鍵結成主鏈，磷酸以支鏈形式接在核糖上" }
      ],
      correctAnswer: "A",
      explanation: "核酸的骨架由磷酸與（去氧）核糖以磷酸雙酯鍵交替連接而成，含氮鹼基則各自接在每個核糖分子上，並不屬於主鏈的一部分。" },
    { id: "pq19", origin: "generated", type: "單選", knowledgePoint: "醣類水解",
      question: "蔗糖（雙醣）經水解後會產生下列何種產物？",
      options: [
        { key: "A", text: "2 分子葡萄糖" }, { key: "B", text: "1 分子葡萄糖 + 1 分子果糖" },
        { key: "C", text: "2 分子果糖" }, { key: "D", text: "1 分子葡萄糖 + 1 分子半乳糖" }
      ],
      correctAnswer: "B",
      explanation: "蔗糖是由一分子葡萄糖與一分子果糖以醣苷鍵結合而成的雙醣，水解後產生等莫耳數的葡萄糖與果糖。" },
    { id: "pq20", origin: "generated", type: "單選", knowledgePoint: "界面活性劑與硬水",
      question: "界面活性劑分子一端為親水端（如 -COO⁻Na⁺、-SO₃⁻Na⁺），另一端為長碳鏈親油端。若親水端易與硬水中的 Ca²⁺、Mg²⁺形成不溶性沉澱、降低清潔力，此類界面活性劑屬於？",
      options: [{ key: "A", text: "硬性清潔劑" }, { key: "B", text: "軟性清潔劑" }, { key: "C", text: "中性清潔劑" }, { key: "D", text: "天然清潔劑" }],
      correctAnswer: "A",
      explanation: "傳統肥皂類（脂肪酸鹽，-COO⁻）容易與硬水中的 Ca²⁺、Mg²⁺形成皂垢（不溶性沉澱），使清潔力下降，這類界面活性劑稱為「硬性清潔劑」。" },
    { id: "pq21", origin: "generated", type: "單選", knowledgePoint: "花青素與天然酸鹼指示劑",
      question: "花青素在不同 pH 環境下顏色改變：酸性（pH<3）呈紅色、中性偏微鹼（pH 6~7）呈紫色、強鹼（pH 8~10）呈藍綠色。這種因 pH 改變而變色的性質，最適合將花青素應用於下列何種用途？",
      options: [{ key: "A", text: "天然抗生素" }, { key: "B", text: "天然酸鹼指示劑" }, { key: "C", text: "天然界面活性劑" }, { key: "D", text: "天然還原劑" }],
      correctAnswer: "B",
      explanation: "花青素的顏色會隨溶液 pH 值改變而明顯改變（紅→紫→藍綠），此特性與人工酸鹼指示劑相似，故可作為天然的酸鹼指示劑。" }
  ]
};
