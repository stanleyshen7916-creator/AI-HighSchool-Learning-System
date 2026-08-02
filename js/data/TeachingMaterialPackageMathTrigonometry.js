/* js/data/TeachingMaterialPackageMathTrigonometry.js
   Teaching Material Repository — Material Package.
   PMO Decision (Teaching Material Upload v1.0, LOCK): new teaching
   material is no longer written into js/data/MockData.js. This file is
   one immutable "Repository Material Package" — a plain data record
   under window.AHS.Data.TeachingMaterialPackages, loaded by
   js/runtime/TeachingMaterialLoader.js and turned into real
   MaterialRuntime / KnowledgeGraphRuntime records by
   js/runtime/TeachingMaterialRepositoryBridge.js. This file contains
   NO logic — data only, exactly like every other file in js/data/.

   Source: 長榮高級中學114學年度下學期高一第三次段考數學科試題卷
   (命題範圍 第二冊 4-1~4-3). Every practiceQuestions entry was solved
   and verified by hand (not OCR-guessed); where the source photo's
   handwriting/figure was ambiguous (the unit-circle multi-choice item),
   that item was not reproduced — a fully self-verifiable original
   question on the same concept was written instead (origin: "generated").
   origin: "repository" = same setup/numbers as a real question on the
   source exam; origin: "generated" = an AI-authored extension question
   covering the same knowledge point. */
window.AHS = window.AHS || {};
AHS.Data = AHS.Data || {};
AHS.Data.TeachingMaterialPackages = AHS.Data.TeachingMaterialPackages || {};

AHS.Data.TeachingMaterialPackages["math-trigonometry-applications-v1"] = {
  packageId: "math-trigonometry-applications-v1",
  version: "1.0",
  metadata: {
    sourceExam: "長榮高級中學114學年度下學期高一第三次段考數學科試題卷",
    scope: "第二冊 4-1~4-3",
    analyzedBy: "Claude Code",
    analyzedAt: "2026-08-02",
    ocrPolicy: "不得使用 OCR 猜測答案；辨識不足之題目已略過，未自行補答案。"
  },
  subject: "math",
  grade: "高一",
  chapter: "第二冊 第四章 4-1~4-3：三角函數的應用",
  keywords: ["正弦定理", "餘弦定理", "圓內接四邊形", "三角形面積", "海龍公式", "單位圓", "象限角", "和差角恆等式"],
  summary: "本教材彙整高一數學第二冊第四章（4-1~4-3）三角函數的應用重點，涵蓋直角三角形邊角關係、正弦定理與餘弦定理、圓內接四邊形對角互補性質、三角形面積公式（含海龍公式）、角平分線長度計算，以及單位圓與象限角三角函數值的判斷，並附 14 題模擬試題與完整詳解，適合段考前複習與自我檢測。",
  reviewSuggestion: "建議複習順序：先熟悉直角三角形邊角關係與正弦定理／餘弦定理的基本操作，再練習圓內接四邊形對角互補的應用（含面積、外接圓半徑），最後加強單位圓定義與和差角恆等式的計算題；面積平分求最小值一類建議搭配算幾不等式一起複習。",
  questions: [
    { id: "kp1", type: "concept", label: "直角三角形複合角表示", content: "直角三角形複合角表示：利用共用斜邊（如 AD）拆解成兩個直角三角形，再以和差角公式合併，例如 CD = a sinθ − b cosθ。" },
    { id: "kp2", type: "formula", label: "正弦定理", content: "正弦定理：a/sinA = b/sinB = c/sinC = 2R（R 為外接圓半徑），可由已知兩角一邊求第三邊，或由弦長與其所對圓周角求外接圓半徑。" },
    { id: "kp3", type: "concept", label: "圓周角定理", content: "圓周角定理：同弧所對的圓周角相等，是連結「圓內接四邊形」與「正弦定理」的關鍵橋樑。" },
    { id: "kp4", type: "formula", label: "餘弦定理", content: "餘弦定理：c² = a² + b² − 2ab cosC，可由三邊長求角，或由兩邊夾角求第三邊；正負號可用來判斷銳角、直角、鈍角三角形。" },
    { id: "kp5", type: "knowledge_point", label: "圓內接四邊形對角互補", content: "圓內接四邊形對角互補：∠A + ∠C = 180°、∠B + ∠D = 180°，故 cosA = −cosC，是用餘弦定理解圓內接四邊形對角線的核心技巧。" },
    { id: "kp6", type: "formula", label: "三角形面積公式", content: "三角形面積公式：(1) 兩邊夾角 Area = (1/2)ab sinC；(2) 海龍公式 Area = √(s(s−a)(s−b)(s−c))，s 為半周長。" },
    { id: "kp7", type: "concept", label: "角平分線長度（面積分割法）", content: "角平分線長度：可用「面積分割法」，即 △ABC 面積 = △ABD 面積 + △ADC 面積，兩側都以 (1/2)×邊長×邊長×sin(半角) 展開求解。" },
    { id: "kp8", type: "definition", label: "單位圓定義", content: "單位圓定義：終邊與單位圓交於 C(cosθ, sinθ)；C 到 x 軸的投影長 = cosθ，投影點到 C 的垂直距離 = sinθ，且恆滿足 sin²θ + cos²θ = 1。" },
    { id: "kp9", type: "knowledge_point", label: "象限角正負判斷", content: "象限角正負判斷：第一象限 sinθ、cosθ、tanθ 皆正；第二象限僅 sinθ 正；第三象限僅 tanθ 正；第四象限僅 cosθ 正。" },
    { id: "kp10", type: "keyword", label: "終邊上一點求三角函數值", content: "點 P(x, y) 在終邊上時，r = √(x²+y²)，sinθ = y/r、cosθ = x/r、tanθ = y/x，可由任一已知量反推坐標與其餘三角函數值。" },
    { id: "kp11", type: "concept", label: "和差角應用", content: "和差角應用：已知終邊所在直線可直接求得 tanθ 再代入化簡；已知 sinθ + cosθ 可平方展開求 sinθcosθ（(sinθ+cosθ)² = 1 + 2sinθcosθ）。" },
    { id: "kp12", type: "knowledge_point", label: "極值問題（算幾不等式）", content: "極值問題：當兩正數乘積為定值時，其和的最小值可用算幾不等式（AM-GM）求得，常見於「面積平分求最短線段」類型的題目。" }
  ],
  practiceQuestions: [
    { id: "pq1", origin: "repository", type: "單選", knowledgePoint: "直角三角形複合角表示",
      question: "如圖，∠BAC = θ，∠ABD = ∠ACD = 90°，AB = a，BD = b（AD 介於 AB、AC 之間）。下列何者可表示 CD？",
      options: [
        { key: "A", text: "a sinθ + b cosθ" }, { key: "B", text: "a cosθ + b sinθ" },
        { key: "C", text: "a sinθ + b tanθ" }, { key: "D", text: "a sinθ − b cosθ" }
      ],
      correctAnswer: "D",
      explanation: "設 ∠BAD = φ。在 Rt△ABD 中，∠ABD = 90°，AB = a、BD = b，故 AD = √(a²+b²)，且 tanφ = b/a、sinφ = b/AD、cosφ = a/AD。由圖形知 AD 介於 AB、AC 之間，故 ∠DAC = ∠BAC − ∠BAD = θ − φ。在 Rt△ACD 中，∠ACD = 90°，CD 為角 ∠DAC 的對邊，故 CD = AD·sin(θ − φ) = AD(sinθcosφ − cosθsinφ) = a sinθ − b cosθ。故選 (D)。" },
    { id: "pq2", origin: "repository", type: "單選", knowledgePoint: "等腰直角三角形與正切",
      question: "△ABC 為等腰直角三角形，∠C = 90°，AC = BC，D 為 BC 中點，求 tan∠DAB。",
      options: [{ key: "A", text: "1/2" }, { key: "B", text: "1/3" }, { key: "C", text: "1/4" }, { key: "D", text: "1/5" }],
      correctAnswer: "B",
      explanation: "以 C 為原點建立坐標，設 AC = BC = 2，A(0,2)、B(2,0)、C(0,0)，則 D 為 BC 中點 D(1,0)。向量 AD=(1,−2)、AB=(2,−2)。tan∠DAB = |AD×AB| / (AD·AB) = |1×(−2) − (−2)×2| / (1×2+(−2)×(−2)) = 2/6 = 1/3（此比值與邊長無關）。故選 (B)。" },
    { id: "pq3", origin: "generated", type: "單選", knowledgePoint: "圓內接四邊形與正弦定理",
      question: "圓內接四邊形 ABCD 中，∠CAD = 30°，∠ACB = 60°，CD = 2，求 AB。",
      options: [{ key: "A", text: "2" }, { key: "B", text: "2√2" }, { key: "C", text: "2√3" }, { key: "D", text: "4" }],
      correctAnswer: "C",
      explanation: "設外接圓半徑為 R。∠CAD 為圓周角，所對弦為 CD，弦長 = 2R sin(圓周角)，故 2 = 2R sin30° = R，R = 2。∠ACB 所對弦為 AB，AB = 2R sin∠ACB = 2×2×sin60° = 2√3。故選 (C)。" },
    { id: "pq4", origin: "generated", type: "單選", knowledgePoint: "象限角三角函數值",
      question: "若角θ終邊上一點為 P(−4, 3)，求 sinθ + cosθ 之值。",
      options: [{ key: "A", text: "1/5" }, { key: "B", text: "−1/5" }, { key: "C", text: "7/5" }, { key: "D", text: "−7/5" }],
      correctAnswer: "B",
      explanation: "r = √((−4)²+3²) = √25 = 5，sinθ = y/r = 3/5，cosθ = x/r = −4/5。sinθ+cosθ = 3/5 + (−4/5) = −1/5。故選 (B)。" },
    { id: "pq5", origin: "repository", type: "多選", knowledgePoint: "象限角三角函數值",
      question: "若有向角θ的始邊為 x 軸正向，終邊上一點 P 的坐標為 P(x, −5√2)，且 tanθ = √2，則下列何者正確？",
      options: [
        { key: "A", text: "x = 5" }, { key: "B", text: "x = −5" }, { key: "C", text: "sinθ = √6/3" },
        { key: "D", text: "sinθ = −√6/3" }, { key: "E", text: "cosθ = −√3/3" }
      ],
      correctAnswer: "B、D、E",
      explanation: "tanθ = y/x = −5√2/x = √2，解得 x = −5，故 (A)錯、(B)對。r = √(x²+y²) = √(25+50) = √75 = 5√3。sinθ = y/r = −5√2/(5√3) = −√6/3，故 (C)錯、(D)對。cosθ = x/r = −5/(5√3) = −√3/3，故 (E)對。正確選項為 (B)(D)(E)。" },
    { id: "pq6", origin: "repository", type: "多選", knowledgePoint: "圓內接四邊形（餘弦定理＋面積＋外接圓）",
      question: "圓內接四邊形 ABCD，已知 AB=8、BC=5、CD=3、DA=5，試問下列各選項何者正確？",
      options: [
        { key: "A", text: "BD = √55" }, { key: "B", text: "sin∠BCD = √3/4" }, { key: "C", text: "△BCD 面積 = 15√3/4" },
        { key: "D", text: "四邊形 ABCD 面積 = 55√3/4" }, { key: "E", text: "外接圓半徑 = 7√3/3" }
      ],
      correctAnswer: "C、D、E",
      explanation: "設 BD=x。∠A、∠C 為對角，∠A+∠C=180°，故 cosC=−cosA。△ABD：cosA=(89−x²)/80。△CBD：cosC=(34−x²)/30。由 cosC=−cosA 得 80(34−x²)=−30(89−x²)，解得 x²=49，x=7，(A)錯。cosA=(89−49)/80=0.5，∠A=60°、∠C=120°，sin∠BCD=√3/2，(B)錯。△BCD 面積=(1/2)(5)(3)sin120°=15√3/4，(C)對。△ABD 面積=(1/2)(8)(5)sin60°=10√3=40√3/4，總面積=55√3/4，(D)對。外接圓半徑：BD/sin∠A=2R，R=7√3/3，(E)對。正確選項為 (C)(D)(E)。" },
    { id: "pq7", origin: "generated", type: "多選", knowledgePoint: "單位圓與三角函數定義",
      question: "設角θ的終邊與單位圓（圓心 O、半徑 1）交於點 C(cosθ, sinθ)，C 在 x 軸上的投影點為 D；過點 B(1,0) 且垂直 x 軸的直線與θ終邊（或其反向延長線）交於點 F。下列敘述何者正確？",
      options: [
        { key: "A", text: "OD = cosθ" }, { key: "B", text: "CD = sinθ" }, { key: "C", text: "BF = tanθ" },
        { key: "D", text: "CD² + OD² = 1" }, { key: "E", text: "BF = OD × CD" }
      ],
      correctAnswer: "A、B、C、D",
      explanation: "C=(cosθ, sinθ) 在 x 軸的投影為 D=(cosθ, 0)，故 OD=cosθ，(A)對；CD=sinθ，(B)對。過 B(1,0) 的鉛垂線 x=1 與終邊參數式 (t·cosθ, t·sinθ) 相交於 F=(1, tanθ)，故 BF=tanθ，(C)對。OC=1 為直角三角形 ODC 的斜邊，故 CD²+OD²=1，(D)對。BF=tanθ=sinθ/cosθ，OD×CD=cosθ×sinθ，兩者一般不相等，(E)錯。正確選項為 (A)(B)(C)(D)。" },
    { id: "pq8", origin: "repository", type: "計算", knowledgePoint: "正弦定理（圓周角）",
      question: "BC 為直徑 3 之圓內的一弦，BC=1，P 為圓上動點（P、B、C 相異），求 sin∠BPC。",
      options: null, correctAnswer: "1/3",
      explanation: "∠BPC 為圓周角，所對弦為 BC，由正弦定理 BC = 2R sin∠BPC，其中 2R = 直徑 = 3。代入 1 = 3·sin∠BPC，得 sin∠BPC = 1/3。" },
    { id: "pq9", origin: "repository", type: "計算", knowledgePoint: "餘弦定理（鄰補角）",
      question: "△ABC 中，D 為 BC 上一點，AB=7、BD=4、AD=5、CD=6，求 AC。",
      options: null, correctAnswer: "7",
      explanation: "∠ADB 與 ∠ADC 互補，cos∠ADC=−cos∠ADB。cos∠ADB=(25+16−49)/40=−1/5，故 cos∠ADC=1/5。AC²=25+36−2(5)(6)(1/5)=61−12=49，AC=7。" },
    { id: "pq10", origin: "repository", type: "計算", knowledgePoint: "角平分線長度（面積分割法）",
      question: "△ABC 中，AB=6、AC=3，AD 為 ∠BAC 的角平分線，∠BAD=∠CAD=60°，求 AD。",
      options: null, correctAnswer: "2",
      explanation: "∠BAC=120°。(1/2)(6)(3)sin120° = (1/2)(AD)sin60°(6+3)。左式=9√3/2，右式=(9√3/4)AD，解得 AD=2。" },
    { id: "pq11", origin: "repository", type: "計算", knowledgePoint: "三角形面積（海龍公式）",
      question: "△ABC 三邊長分別為 5、6、7，求 △ABC 的面積。",
      options: null, correctAnswer: "6√6",
      explanation: "s=(5+6+7)/2=9。面積=√(9×4×3×2)=√216=6√6。" },
    { id: "pq12", origin: "repository", type: "計算", knowledgePoint: "和差角恆等式（平方展開）",
      question: "已知θ為銳角，且 sinθ+cosθ=√5/2，求 sinθcosθ 之值。",
      options: null, correctAnswer: "1/8",
      explanation: "(sinθ+cosθ)²=1+2sinθcosθ=5/4。故 sinθcosθ=1/8。" },
    { id: "pq13", origin: "repository", type: "計算", knowledgePoint: "面積平分最小值（算幾不等式）",
      question: "△ABC 中，AB=5、BC=3、CA=4，在 AB 上取一點 P，在 AC 上取一點 Q，使線段 PQ 將 △ABC 的面積平分，求線段 PQ 的最小值。",
      options: null, correctAnswer: "2",
      explanation: "∠C=90°，面積=6，cosA=4/5、sinA=3/5。設 AP=m、AQ=n，mn·sinA/2=3 得 mn=10。PQ²=m²+n²−2mn·cosA≥2mn−16=4（AM-GM，m=n=√10 時取等），PQ 最小值為 2。" },
    { id: "pq14", origin: "repository", type: "計算", knowledgePoint: "終邊在直線上求三角函數式",
      question: "若θ角的終邊在直線 2x+y=0 上，求 (2cosθ−sinθ)/(3sinθ−cosθ) 之值。",
      options: null, correctAnswer: "−4/7",
      explanation: "tanθ=−2，即 sinθ=−2cosθ。分子=4cosθ、分母=−7cosθ，原式=−4/7。" }
  ]
};
