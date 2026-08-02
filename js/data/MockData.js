/* js/mock-data.js — Mock data for AI 高中學習系統 (Prototype).
   No network / API / backend — all values are embedded here.
   Home v1.0 blocks: hero / today tasks / recent materials / AI tutor /
   study stats / study plan / achievements. */
window.AHS = window.AHS || {};
AHS.Mock = {
  teacher: { name: "AI 巧巧老師" },
  student: { name: "同學", grade: "高一生" },

  hero: {
    greeting: "早安，同學！",
    headline: "今天也是充實學習的一天！",
    recommendation: "持續學習，你會看到更好的自己！",
    tipTitle: "巧巧老師的小提醒",
    tip: "學習就像累積小小的進步，每天一點點，未來會很不一樣！",
    startLabel: "開始今日學習",
    continueLabel: "繼續昨天進度",
    startFeedback: "（Mock）開始今日學習：數學《二次函數的圖形與性質》",
    continueFeedback: "（Mock）繼續昨天進度：英文《文法練習》"
  },

  aiTutor: {
    title: "AI 巧巧老師",
    message: "同學加油！我建議你今天先從數學開始，打好基礎會讓學習更輕鬆喔！",
    askLabel: "問問我任何問題吧！",
    askFeedback: "（Mock）開啟與巧巧老師的對話",
    actions: [
      { id: "photo", icon: "camera", label: "拍照解題", desc: "上傳題目即時解答" },
      { id: "summary", icon: "summary", label: "重點整理", desc: "AI 快速整理筆記" },
      { id: "word", icon: "aa", label: "單字小幫手", desc: "英文單字隨記憶卡" },
      { id: "plan", icon: "calendar", label: "學習計畫", desc: "客製你的學習計畫" }
    ]
  },

  studyPlan: {
    title: "學習計畫",
    points: { earned: 0, target: 120 },
    slots: [
      { time: "09:00", subject: "math", unit: "二次函數的圖形與性質" },
      { time: "11:00", subject: "english", unit: "文法練習" },
      { time: "14:00", subject: "physics", unit: "牛頓運動定律" }
    ]
  },

  achievements: {
    title: "成就徽章",
    items: [
      { icon: "star", label: "學習新星", desc: "連續學習 3 天", tone: "gold" },
      { icon: "quiz", label: "測驗達人", desc: "測驗正確率 80%", tone: "brand" },
      { icon: "clock", label: "時間管理大師", desc: "本週學習超過 15 小時", tone: "physics" },
      { icon: "summary", label: "知識探索者", desc: "完成 50 個教材", tone: "chemistry" },
      { icon: "heart", label: "完美主義者", desc: "測驗正確率 100%", tone: "history" },
      { icon: "sparkle", label: "堅持不懈", desc: "連續學習 7 天", tone: "english" }
    ]
  },

  materials: {
    title: "教材中心",
    subtitle: "探索、學習與下載各科教材資源",
    subjectCounts: [
      { subject: "chinese", count: 128 },
      { subject: "english", count: 156 },
      { subject: "math", count: 143 },
      { subject: "physics", count: 98 },
      { subject: "chemistry", count: 88 },
      { subject: "biology", count: 74 },
      { subject: "history", count: 93 },
      { subject: "geography", count: 81 },
      { subject: "civics", count: 65 }
    ],
    categories: ["全部分類", "課本", "講義", "考卷", "筆記", "補充資料", "影片", "其他"],
    grades: ["高一", "高二", "高三"],
    sorts: ["最新上傳", "最多觀看", "學習進度"],
    formats: ["全部格式", "PDF", "PPT", "PPTX", "DOC", "DOCX", "XLS", "XLSX", "TXT", "MP4", "MP3", "JPG", "JPEG", "PNG", "GIF", "WEBP", "其他"],
    items: [
      { id: 1, subject: "math", title: "二次函數的圖形與性質", chapter: "第三章", grade: "高一", date: "2024/06/20", views: "1.2k", content: "本教材介紹二次函數的圖形特徵、頂點座標與對稱軸，並透過範例說明如何由標準式判斷開口方向與最大最小值。", progress: 45 },
      { id: 2, subject: "english", title: "英文閱讀理解攻略", chapter: "Unit 3", grade: "高一", date: "2024/06/19", views: "980", content: "本教材整理閱讀理解常見題型與解題技巧，包含主旨判斷、細節查找與推論題的解題步驟。", progress: 100 },
      { id: 3, subject: "physics", title: "牛頓運動定律總整理", chapter: "第二章", grade: "高一", date: "2024/06/18", views: "756", content: "本教材彙整牛頓三大運動定律的定義與應用範例，並附上常見計算題型解析。", progress: 0 },
      { id: 4, subject: "chemistry", title: "化學反應與平衡", chapter: "第三章", grade: "高一", date: "2024/06/17", views: "832", content: "本教材說明化學反應速率與平衡常數的關係，並介紹勒沙特列原理的應用情境。", progress: 70 },
      { id: 5, subject: "biology", title: "細胞構造與功能", chapter: "第 1-2 節", grade: "高一", date: "2024/06/16", views: "1.1k", content: "本教材介紹動植物細胞的基本構造與各胞器功能，並比較兩者的差異。", progress: 0 },
      { id: 6, subject: "history", title: "中國古代史總整理", chapter: "第二章", grade: "高一", date: "2024/06/15", views: "645", content: "本教材整理中國古代重要朝代的政治制度與社會變遷重點。", progress: 100 },
      { id: 7, subject: "geography", title: "臺灣的地形與氣候", chapter: "第二章", grade: "高一", date: "2024/06/14", views: "701", content: "本教材說明臺灣主要地形分布與氣候特徵，並分析其對產業發展的影響。", progress: 30 },
      { id: 8, subject: "civics", title: "憲法基本原則", chapter: "第一章", grade: "高一", date: "2024/06/13", views: "589", content: "本教材介紹憲法的基本原則與立憲精神，並說明其在國家治理中的角色。", progress: 0 },
      /* Sprint MAT-CONTENT-001：依長榮高中 114 學年度下學期高一第三次段考數學科
         試題卷（命題範圍 第二冊 4-1~4-3）分析整理之重點整理與模擬試題，
         每題均含完整詳解。keyPoints／practiceQuestions 為既有 Material 項目
         schema（id/subject/title/chapter/grade/date/views/content/progress）
         之附加欄位，供教材中心未來擴充「重點整理」「模擬試題」顯示使用；
         不影響任何既有欄位或現有渲染邏輯。 */
      { id: 9, subject: "math", title: "三角函數的應用：正弦定理、餘弦定理與圓內接四邊形",
        chapter: "第二冊 第四章 4-1~4-3", grade: "高一", date: "2026/07/30", views: "0",
        content: "本教材彙整高一數學第二冊第四章（4-1~4-3）三角函數的應用重點，涵蓋直角三角形邊角關係、正弦定理與餘弦定理、圓內接四邊形對角互補性質、三角形面積公式（含海龍公式）、角平分線長度計算，以及單位圓與象限角三角函數值的判斷，並附 14 題模擬試題與完整詳解，適合段考前複習與自我檢測。",
        progress: 0,
        keyPoints: [
          "直角三角形複合角表示：利用共用斜邊（如 AD）拆解成兩個直角三角形，再以和差角公式合併，例如 CD = a sinθ − b cosθ。",
          "正弦定理：a/sinA = b/sinB = c/sinC = 2R（R 為外接圓半徑），可由已知兩角一邊求第三邊，或由弦長與其所對圓周角求外接圓半徑。",
          "圓周角定理：同弧所對的圓周角相等，是連結「圓內接四邊形」與「正弦定理」的關鍵橋樑。",
          "餘弦定理：c² = a² + b² − 2ab cosC，可由三邊長求角，或由兩邊夾角求第三邊；正負號可用來判斷銳角、直角、鈍角三角形。",
          "圓內接四邊形對角互補：∠A + ∠C = 180°、∠B + ∠D = 180°，故 cosA = −cosC，是用餘弦定理解圓內接四邊形對角線的核心技巧。",
          "三角形面積公式：(1) 兩邊夾角 Area = (1/2)ab sinC；(2) 海龍公式 Area = √(s(s−a)(s−b)(s−c))，s 為半周長。",
          "角平分線長度：可用「面積分割法」，即 △ABC 面積 = △ABD 面積 + △ADC 面積，兩側都以 (1/2)×邊長×邊長×sin(半角) 展開求解。",
          "單位圓定義：終邊與單位圓交於 C(cosθ, sinθ)；C 到 x 軸的投影長 = cosθ，投影點到 C 的垂直距離 = sinθ，且恆滿足 sin²θ + cos²θ = 1。",
          "象限角正負判斷：第一象限 sinθ、cosθ、tanθ 皆正；第二象限僅 sinθ 正；第三象限僅 tanθ 正；第四象限僅 cosθ 正。",
          "點 P(x, y) 在終邊上時，r = √(x²+y²)，sinθ = y/r、cosθ = x/r、tanθ = y/x，可由任一已知量反推坐標與其餘三角函數值。",
          "和差角應用：已知終邊所在直線可直接求得 tanθ 再代入化簡；已知 sinθ + cosθ 可平方展開求 sinθcosθ（(sinθ+cosθ)² = 1 + 2sinθcosθ）。",
          "極值問題：當兩正數乘積為定值時，其和的最小值可用算幾不等式（AM-GM）求得，常見於「面積平分求最短線段」類型的題目。"
        ],
        practiceQuestions: [
          { type: "單選", knowledgePoint: "直角三角形複合角表示",
            question: "如圖，∠BAC = θ，∠ABD = ∠ACD = 90°，AB = a，BD = b（AD 介於 AB、AC 之間）。下列何者可表示 CD？",
            options: [
              { key: "A", text: "a sinθ + b cosθ" },
              { key: "B", text: "a cosθ + b sinθ" },
              { key: "C", text: "a sinθ + b tanθ" },
              { key: "D", text: "a sinθ − b cosθ" }
            ],
            correctAnswer: "D",
            explanation: "設 ∠BAD = φ。在 Rt△ABD 中，∠ABD = 90°，AB = a、BD = b，故 AD = √(a²+b²)，且 tanφ = b/a、sinφ = b/AD、cosφ = a/AD。由圖形知 AD 介於 AB、AC 之間，故 ∠DAC = ∠BAC − ∠BAD = θ − φ。在 Rt△ACD 中，∠ACD = 90°，CD 為角 ∠DAC 的對邊，故 CD = AD·sin(θ − φ) = AD(sinθcosφ − cosθsinφ) = AD·sinθ·(a/AD) − AD·cosθ·(b/AD) = a sinθ − b cosθ。故選 (D)。" },
          { type: "單選", knowledgePoint: "等腰直角三角形與正切",
            question: "△ABC 為等腰直角三角形，∠C = 90°，AC = BC，D 為 BC 中點，求 tan∠DAB。",
            options: [
              { key: "A", text: "1/2" }, { key: "B", text: "1/3" }, { key: "C", text: "1/4" }, { key: "D", text: "1/5" }
            ],
            correctAnswer: "B",
            explanation: "以 C 為原點建立坐標，設 AC = BC = 2，A(0,2)、B(2,0)、C(0,0)，則 D 為 BC 中點 D(1,0)。向量 AD=(1,−2)、AB=(2,−2)。tan∠DAB = |AD×AB| / (AD·AB) = |1×(−2) − (−2)×2| / (1×2+(−2)×(−2)) = |−2+4| / (2+4) = 2/6 = 1/3（此比值與邊長無關）。故選 (B)。" },
          { type: "單選", knowledgePoint: "圓內接四邊形與正弦定理",
            question: "圓內接四邊形 ABCD 中，∠CAD = 30°，∠ACB = 60°，CD = 2，求 AB。",
            options: [
              { key: "A", text: "2" }, { key: "B", text: "2√2" }, { key: "C", text: "2√3" }, { key: "D", text: "4" }
            ],
            correctAnswer: "C",
            explanation: "設外接圓半徑為 R。∠CAD 為圓周角，所對弦為 CD，弦長 = 2R sin(圓周角)，故 2 = 2R sin30° = R，R = 2。∠ACB 所對弦為 AB，AB = 2R sin∠ACB = 2×2×sin60° = 4×(√3/2) = 2√3。故選 (C)。" },
          { type: "單選", knowledgePoint: "象限角三角函數值",
            question: "若角θ終邊上一點為 P(−4, 3)，求 sinθ + cosθ 之值。",
            options: [
              { key: "A", text: "1/5" }, { key: "B", text: "−1/5" }, { key: "C", text: "7/5" }, { key: "D", text: "−7/5" }
            ],
            correctAnswer: "B",
            explanation: "r = √((−4)²+3²) = √25 = 5，sinθ = y/r = 3/5，cosθ = x/r = −4/5。sinθ+cosθ = 3/5 + (−4/5) = −1/5。故選 (B)。" },
          { type: "多選", knowledgePoint: "象限角三角函數值",
            question: "若有向角θ的始邊為 x 軸正向，終邊上一點 P 的坐標為 P(x, −5√2)，且 tanθ = √2，則下列何者正確？",
            options: [
              { key: "A", text: "x = 5" }, { key: "B", text: "x = −5" }, { key: "C", text: "sinθ = √6/3" },
              { key: "D", text: "sinθ = −√6/3" }, { key: "E", text: "cosθ = −√3/3" }
            ],
            correctAnswer: "B、D、E",
            explanation: "tanθ = y/x = −5√2/x = √2，解得 x = −5，故 (A)錯、(B)對。r = √(x²+y²) = √(25+50) = √75 = 5√3。sinθ = y/r = −5√2/(5√3) = −√2/√3 = −√6/3，故 (C)錯、(D)對。cosθ = x/r = −5/(5√3) = −1/√3 = −√3/3，故 (E)對。正確選項為 (B)(D)(E)。" },
          { type: "多選", knowledgePoint: "圓內接四邊形（餘弦定理＋面積＋外接圓）",
            question: "圓內接四邊形 ABCD，已知 AB=8、BC=5、CD=3、DA=5，試問下列各選項何者正確？",
            options: [
              { key: "A", text: "BD = √55" }, { key: "B", text: "sin∠BCD = √3/4" }, { key: "C", text: "△BCD 面積 = 15√3/4" },
              { key: "D", text: "四邊形 ABCD 面積 = 55√3/4" }, { key: "E", text: "外接圓半徑 = 7√3/3" }
            ],
            correctAnswer: "C、D、E",
            explanation: "設 BD=x。∠A、∠C 為圓內接四邊形之對角，∠A+∠C=180°，故 cosC=−cosA。在△ABD：cosA=(AB²+AD²−x²)/(2·AB·AD)=(89−x²)/80。在△CBD：cosC=(CB²+CD²−x²)/(2·CB·CD)=(34−x²)/30。由 cosC=−cosA 得 (34−x²)/30=−(89−x²)/80，整理得 80(34−x²)=−30(89−x²)，2720−80x²=−2670+30x²，110x²=5390，x²=49，x=7，故 BD=7，(A)錯。代回 cosA=(89−49)/80=0.5，∠A=60°、∠C=120°，sin∠BCD=sin120°=√3/2，故 (B)錯。△BCD 面積=(1/2)(5)(3)sin120°=15√3/4，(C)對。△ABD 面積=(1/2)(8)(5)sin60°=10√3=40√3/4，四邊形總面積=40√3/4+15√3/4=55√3/4，(D)對。外接圓半徑由正弦定理 BD/sin∠A=2R：7/sin60°=14/√3=14√3/3=2R，R=7√3/3，(E)對。正確選項為 (C)(D)(E)。" },
          { type: "多選", knowledgePoint: "單位圓與三角函數定義",
            question: "設角θ的終邊與單位圓（圓心 O、半徑 1）交於點 C(cosθ, sinθ)，C 在 x 軸上的投影點為 D；過點 B(1,0) 且垂直 x 軸的直線與θ終邊（或其反向延長線）交於點 F。下列敘述何者正確？",
            options: [
              { key: "A", text: "OD = cosθ" }, { key: "B", text: "CD = sinθ" }, { key: "C", text: "BF = tanθ" },
              { key: "D", text: "CD² + OD² = 1" }, { key: "E", text: "BF = OD × CD" }
            ],
            correctAnswer: "A、B、C、D",
            explanation: "C=(cosθ, sinθ) 在 x 軸的投影為 D=(cosθ, 0)，故（帶方向的）OD=cosθ，(A)對；CD 為 C 到 D 的垂直距離＝sinθ，(B)對。過 B(1,0) 的鉛垂線為 x=1，終邊參數式為 (t·cosθ, t·sinθ)，令 t·cosθ=1 得 t=1/cosθ，代入得 F=(1, tanθ)，故 BF=tanθ，(C)對。C 在單位圓上 OC=1，OD、CD 為直角三角形的兩股，故 CD²+OD²=OC²=1，(D)對。BF=tanθ=sinθ/cosθ，而 OD×CD=cosθ×sinθ，兩者一般不相等，故 (E)錯。正確選項為 (A)(B)(C)(D)。" },
          { type: "計算", knowledgePoint: "正弦定理（圓周角）",
            question: "BC 為直徑 3 之圓內的一弦，BC=1，P 為圓上動點（P、B、C 相異），求 sin∠BPC。",
            options: null, correctAnswer: "1/3",
            explanation: "∠BPC 為圓周角，所對弦為 BC，由正弦定理 BC = 2R sin∠BPC，其中 2R = 直徑 = 3。代入 1 = 3·sin∠BPC，得 sin∠BPC = 1/3。" },
          { type: "計算", knowledgePoint: "餘弦定理（鄰補角）",
            question: "△ABC 中，D 為 BC 上一點，AB=7、BD=4、AD=5、CD=6，求 AC。",
            options: null, correctAnswer: "7",
            explanation: "∠ADB 與 ∠ADC 為一直線上的鄰補角，互補，故 cos∠ADC=−cos∠ADB。在△ABD 用餘弦定理：cos∠ADB=(AD²+BD²−AB²)/(2·AD·BD)=(25+16−49)/40=−1/5。故 cos∠ADC=1/5。在△ADC 用餘弦定理：AC²=AD²+CD²−2·AD·CD·cos∠ADC=25+36−2(5)(6)(1/5)=61−12=49，AC=7。" },
          { type: "計算", knowledgePoint: "角平分線長度（面積分割法）",
            question: "△ABC 中，AB=6、AC=3，AD 為 ∠BAC 的角平分線，∠BAD=∠CAD=60°，求 AD。",
            options: null, correctAnswer: "2",
            explanation: "∠BAC=∠BAD+∠CAD=120°。由面積分割：△ABC面積=△ABD面積+△ACD面積。(1/2)(6)(3)sin120° = (1/2)(6)(AD)sin60° + (1/2)(3)(AD)sin60°。左式=9√3/2，右式=(9√3/4)AD。解得 AD=(9√3/2)/(9√3/4)=2。" },
          { type: "計算", knowledgePoint: "三角形面積（海龍公式）",
            question: "△ABC 三邊長分別為 5、6、7，求 △ABC 的面積。",
            options: null, correctAnswer: "6√6",
            explanation: "由海龍公式，半周長 s=(5+6+7)/2=9。面積=√(s(s−a)(s−b)(s−c))=√(9×4×3×2)=√216=√(36×6)=6√6。" },
          { type: "計算", knowledgePoint: "和差角恆等式（平方展開）",
            question: "已知θ為銳角，且 sinθ+cosθ=√5/2，求 sinθcosθ 之值。",
            options: null, correctAnswer: "1/8",
            explanation: "將等式平方：(sinθ+cosθ)²=sin²θ+2sinθcosθ+cos²θ=1+2sinθcosθ=(√5/2)²=5/4。故 2sinθcosθ=5/4−1=1/4，sinθcosθ=1/8。" },
          { type: "計算", knowledgePoint: "面積平分最小值（算幾不等式）",
            question: "△ABC 中，AB=5、BC=3、CA=4，在 AB 上取一點 P，在 AC 上取一點 Q，使線段 PQ 將 △ABC 的面積平分，求線段 PQ 的最小值。",
            options: null, correctAnswer: "2",
            explanation: "因 3²+4²=5²，△ABC 為直角三角形，∠C=90°，面積=(1/2)(3)(4)=6。由餘弦定理 cosA=(AB²+AC²−BC²)/(2·AB·AC)=(25+16−9)/40=4/5，sinA=3/5。設 AP=m、AQ=n，△APQ 面積=(1/2)mn·sinA=3，得 mn=10。由餘弦定理 PQ²=m²+n²−2mn·cosA=m²+n²−16。由算幾不等式 m²+n²≥2mn=20（等號成立於 m=n=√10，符合 m≤5、n≤4），故 PQ²≥4，PQ 最小值為 2。" },
          { type: "計算", knowledgePoint: "終邊在直線上求三角函數式",
            question: "若θ角的終邊在直線 2x+y=0 上，求 (2cosθ−sinθ)/(3sinθ−cosθ) 之值。",
            options: null, correctAnswer: "−4/7",
            explanation: "終邊在 2x+y=0（即 y=−2x）上，故 tanθ=y/x=−2，即 sinθ=−2cosθ（cosθ≠0）。代入：分子=2cosθ−sinθ=2cosθ−(−2cosθ)=4cosθ；分母=3sinθ−cosθ=3(−2cosθ)−cosθ=−7cosθ。故原式=4cosθ/(−7cosθ)=−4/7。" }
        ]
      },
      /* Sprint MAT-CONTENT-002：依私立長榮高中 114 學年度第二學期高一化學期末考
         試題卷分析整理之重點整理與模擬試題，每題均含完整詳解。同 id:9 之附加
         欄位模式（keyPoints／practiceQuestions），不影響任何既有欄位或現有
         渲染邏輯。 */
      { id: 10, subject: "chemistry", title: "酸鹼、溶解度與生活化學：高一化學期末考重點整理",
        chapter: "溶液配製、酸鹼指示劑、溶解度、奈米科技、氧化還原與環境化學", grade: "高一", date: "2026/08/02", views: "0",
        content: "本教材彙整高一化學期末考重點，涵蓋溶液配製與稀釋計算、酸鹼指示劑變色原理、強酸鹼稀釋的 pH 變化、溶解度與結晶量計算、奈米科技的表面效應、膠體與真溶液的區別、能源分類、大氣環境問題成因（臭氧層破壞、酸雨、溫室效應）、核酸結構、氧化還原反應判斷、綠色化學原子經濟、生活化學藥品與清潔劑成分，以及花青素酸鹼變色應用，並附 21 題模擬試題與完整詳解，適合期末考前複習與自我檢測。",
        progress: 0,
        keyPoints: [
          "溶液配製與稀釋：重量百分濃度、比重與莫耳濃度的換算公式 M=(1000×比重×重量百分濃度)/分子量；稀釋公式 C₁V₁=C₂V₂；精確量取定量液體用吸量管（移液管），精確定容配製溶液用容量瓶。",
          "酸鹼指示劑：每種指示劑都有其變色 pH 範圍，pH 低於範圍呈「酸性顏色」，高於範圍呈「鹼性顏色」，範圍內為過渡色；判斷時需比對待測液的實際 pH 與各指示劑的變色範圍。",
          "強鹼（或強酸）以水稀釋：pH 值會漸漸趨近 7，但強鹼稀釋後 pH 恆大於 7、強酸稀釋後 pH 恆小於 7，不會跨過 7 變成相反性質。",
          "溶解度與溫度關係：多數固體溶質的溶解度隨溫度上升而增加（溶解為吸熱反應）；由高溫飽和溶液冷卻至低溫時，超出低溫溶解度的部分會結晶析出，可用比例法計算析出量。",
          "奈米效應：物體尺寸縮小時，表面積 A 與體積 V 之比（A/V）及表面原子數與總原子數之比（n/N）都會上升，此表面效應使奈米材料的化學反應性、催化效率大幅提高；n/N 與半徑 R 成反比。",
          "膠體與真溶液的區別：真溶液（如食鹽水）粒子過小，無法以（超）顯微鏡觀察到廷得耳效應／布朗運動的散射光點；膠體（如牛奶、咖啡、醬油）粒子夠大，可觀察到此現象。",
          "能源分類：由農畜廢水、有機廢棄物、藻類發酵產生甲烷（沼氣）並用於燃燒供能，屬於「生質能」。",
          "大氣與環境問題成因：臭氧層破壞主因為氟氯碳化物（CFCs）；酸雨主因為硫的氧化物（及氮的氧化物）；溫室效應主因為二氧化碳等溫室氣體吸收紅外線（非紫外光）。",
          "核酸（DNA/RNA）結構：主鏈由「磷酸－（去氧）核糖」交替鍵結而成，含氮鹼基則以支鏈形式接在核糖上，並非主鏈的一部分。",
          "氧化還原判斷：先為各原子標定氧化數，氧化數上升者被氧化（本身是還原劑），氧化數下降者被還原（本身是氧化劑）；同一反應中可能同時存在超過一種氧化劑。",
          "綠色化學：核心精神為「原子經濟」，理想反應是所有反應物原子都轉化為目標產物、副產物越少越好，應從源頭減少污染，而非末端處理或轉移污染。",
          "生活化學（藥品／清潔劑）：常見成分需對應正確功用，例如氫氧化鋁、碳酸氫鈉為制酸劑；柳酸甲酯為外用止痛成分；磺胺類藥物屬於抗菌（磺胺劑）而非單純消炎藥。",
          "醣類與界面活性劑：蔗糖為雙醣，水解得葡萄糖與果糖各一分子；界面活性劑分子具親水端（如 -COO⁻、-SO₃⁻）與親油端（長碳鏈），親水端易與硬水中 Ca²⁺、Mg²⁺形成沉澱者為「硬性清潔劑」。",
          "花青素／天然酸鹼指示劑：花青素類色素隨 pH 值改變顏色（酸紅、中性偏微鹼紫、強鹼藍綠），可作為天然酸鹼指示劑；其結構隨 pH 改變質子化狀態（得失 H⁺）。"
        ],
        practiceQuestions: [
          { type: "計算", knowledgePoint: "重量百分濃度與莫耳濃度換算",
            question: "已知濃硫酸重量百分濃度 98%，比重 1.8，分子量 H₂SO₄=98，求其莫耳濃度。",
            options: null, correctAnswer: "18 M",
            explanation: "M = (1000×比重×重量百分濃度) / 分子量 = (1000×1.8×0.98) / 98 = 1764/98 = 18 M。" },
          { type: "計算", knowledgePoint: "稀釋計算",
            question: "承上題，欲配製 24.5%（比重 1.2）稀硫酸 1000 mL，需另外加入多少毫升蒸餾水（與所取的 98% 濃硫酸混合）？",
            options: null, correctAnswer: "約 900 mL",
            explanation: "目標溶液總質量 = 1000mL×1.2g/mL = 1200g；所需 H₂SO₄ 質量 = 1200×0.245 = 294g；提供 294g H₂SO₄ 所需 98% 濃硫酸質量 = 294/0.98 = 300g（體積 = 300/1.8 ≈ 166.7mL）；此 300g 濃硫酸與加入的水混合後總質量須為 1200g，故需加水質量 = 1200−300 = 900g ≈ 900 mL。" },
          { type: "單選", knowledgePoint: "定量溶液配製器材",
            question: "配製一定體積、一定濃度的溶液時，若要精確量取某體積的濃硫酸，並將稀釋後的溶液準確定容至一定體積，最適合依序使用的器材為？",
            options: [
              { key: "A", text: "燒杯、量筒" }, { key: "B", text: "量筒、燒杯" },
              { key: "C", text: "吸量管、容量瓶" }, { key: "D", text: "容量瓶、吸量管" }
            ],
            correctAnswer: "C",
            explanation: "吸量管（移液管）可精確量取一定體積的液體；容量瓶頸部有精確刻度線，用於將溶液加水定容至準確的總體積。燒杯與量筒僅適合粗略量測，不適合精確配製定量溶液。" },
          { type: "單選", knowledgePoint: "酸鹼指示劑變色判斷",
            question: "取少量稀鹽酸，滴入酚紅指示劑（變色範圍 pH 6.4~8.2，酸性色黃、鹼性色紅），已知該鹽酸的 pH 小於 3，則酚紅應呈現何色？",
            options: [
              { key: "A", text: "黃色" }, { key: "B", text: "紅色" }, { key: "C", text: "無色" }, { key: "D", text: "紫紅色" }
            ],
            correctAnswer: "A",
            explanation: "該溶液 pH（<3）低於酚紅變色範圍下限（6.4），故呈現其「酸性顏色」黃色。" },
          { type: "單選", knowledgePoint: "酸鹼指示劑變色判斷（鹼性）",
            question: "剛果紅的變色範圍為 pH 3.1~5.1（酸性色藍、鹼性色紅），石蕊為 pH 4.5~8.3（酸性色紅、鹼性色藍）。若溶液 pH=9.6，下列敘述何者錯誤？",
            options: [
              { key: "A", text: "剛果紅為藍色" }, { key: "B", text: "石蕊為藍色" },
              { key: "C", text: "剛果紅為紅色" }, { key: "D", text: "石蕊已呈鹼性顏色" }
            ],
            correctAnswer: "A",
            explanation: "pH=9.6 遠高於剛果紅變色範圍上限（5.1），應呈現其「鹼性顏色」紅色，而非藍色，故 (A) 錯誤、(C) 正確。石蕊變色範圍上限為 8.3，pH=9.6 亦高於此上限，呈現鹼性顏色藍色，故 (B)(D) 皆正確。" },
          { type: "單選", knowledgePoint: "強鹼稀釋的 pH 變化趨勢",
            question: "將 0.1M 氫氧化鈉溶液不斷加水稀釋，其 pH 值隨加水量增加的變化趨勢最可能為？",
            options: [
              { key: "A", text: "持續下降至低於 7 後趨於平緩" }, { key: "B", text: "持續下降但恆大於 7，並趨近 7" },
              { key: "C", text: "持續上升趨近某定值" }, { key: "D", text: "維持不變" }
            ],
            correctAnswer: "B",
            explanation: "強鹼加水稀釋只會使鹼性減弱，pH 值會逐漸下降並趨近 7，但由於水的解離平衡限制，pH 值恆大於 7，不可能因稀釋而變成酸性（pH<7）。" },
          { type: "計算", knowledgePoint: "溶解度與結晶量計算",
            question: "已知硝酸鉀在 60°C 時溶解度為 110 克/100 克水，在 20°C 時溶解度為 30 克/100 克水。取 105 克 60°C 的硝酸鉀飽和溶液，緩慢冷卻至 20°C，可析出多少克硝酸鉀結晶？",
            options: null, correctAnswer: "40.0 克",
            explanation: "60°C 飽和溶液中，每 210 克溶液含 110 克硝酸鉀與 100 克水。105 克恰為此比例的一半，故含 55 克硝酸鉀與 50 克水。20°C 時，50 克水最多可溶解 30/100×50=15 克硝酸鉀，故析出量 = 55−15 = 40 克。" },
          { type: "單選", knowledgePoint: "溶解度與吸放熱",
            question: "由硝酸鉀與氯化鉀的溶解度-溫度關係圖可知，兩者的溶解度皆隨溫度升高而增加，這代表兩者溶於水的過程屬於？",
            options: [
              { key: "A", text: "皆為吸熱" }, { key: "B", text: "皆為放熱" },
              { key: "C", text: "硝酸鉀吸熱、氯化鉀放熱" }, { key: "D", text: "無法判斷" }
            ],
            correctAnswer: "A",
            explanation: "若升高溫度使溶解度增加，依勒沙特列原理，代表升溫有利於正向（溶解）反應進行，故溶解過程為吸熱反應；兩者的溶解度-溫度曲線皆呈上升趨勢，故兩者溶解皆為吸熱。" },
          { type: "計算", knowledgePoint: "奈米效應（表面原子比）",
            question: "半徑 100nm 的實心鐵球，其表面原子數與總原子數比值（n/N）是半徑 1.0cm 實心鐵球的多少倍？",
            options: null, correctAnswer: "10⁵ 倍",
            explanation: "對固定原子半徑的實心球而言，n/N 近似與球半徑 R 成反比（n/N∝1/R）。兩球半徑比 = 1.0cm/100nm = (1.0×10⁷nm)/(100nm) = 10⁵，半徑愈小者 n/N 愈大，故比值為 10⁵ 倍。" },
          { type: "計算", knowledgePoint: "奈米尺度換算",
            question: "已知某奈米結構的特徵尺寸約為 100nm，氫原子直徑約 0.1nm，則此結構尺寸約為氫原子直徑的多少倍？",
            options: null, correctAnswer: "1000 倍",
            explanation: "100nm ÷ 0.1nm = 1000 倍。" },
          { type: "單選", knowledgePoint: "膠體與真溶液的區別",
            question: "以（超）顯微鏡於垂直光線方向觀察下列液態物質，何者因粒子過小（屬真溶液而非膠體）而無法觀察到光散射（廷得耳效應）的點狀分布？",
            options: [
              { key: "A", text: "食鹽水" }, { key: "B", text: "牛奶" }, { key: "C", text: "咖啡" }, { key: "D", text: "醬油" }
            ],
            correctAnswer: "A",
            explanation: "食鹽水中溶質為 Na⁺、Cl⁻離子，粒徑遠小於膠體粒子，屬於真溶液，無法產生可觀察到的光散射（廷得耳效應）；牛奶、咖啡、醬油皆含有懸浮的膠體顆粒，可觀察到散射光點。" },
          { type: "單選", knowledgePoint: "能源分類",
            question: "利用農畜廢水、有機廢棄物與藻類發酵所產生的甲烷，經燃燒後用於家用暖氣、發電及溫水游泳池加熱，此能源應歸類為？",
            options: [
              { key: "A", text: "生質能" }, { key: "B", text: "太陽能" }, { key: "C", text: "地熱能" }, { key: "D", text: "潮汐能" }
            ],
            correctAnswer: "A",
            explanation: "由生物性廢棄物（農畜廢水、有機廢棄物、藻類）轉化而來的能源（如沼氣中的甲烷）屬於生質能。" },
          { type: "單選", knowledgePoint: "臭氧層破壞成因",
            question: "下列何者為造成臭氧層破壞的主要化合物？",
            options: [
              { key: "A", text: "碳氫化合物" }, { key: "B", text: "氟氯碳化物" }, { key: "C", text: "硫的氧化物" }, { key: "D", text: "塑膠微粒" }
            ],
            correctAnswer: "B",
            explanation: "氟氯碳化物（CFCs）在平流層受紫外線照射分解出氯自由基，催化破壞臭氧分子，是造成臭氧層破壞（臭氧層破洞）的主要原因；硫的氧化物主要造成酸雨，碳氫化合物與塑膠微粒與臭氧層破壞無直接主要關係。" },
          { type: "多選", knowledgePoint: "氧化還原反應判斷",
            question: "黑火藥反應式：2KNO₃(s)+3C(s)+S(s) →點燃→ K₂S(s)+N₂(g)+3CO₂(g)。下列敘述哪些正確？（應選 2 項）",
            options: [
              { key: "A", text: "碳是還原劑" }, { key: "B", text: "硫是還原劑" },
              { key: "C", text: "氮由 +5 變為 0，被還原" }, { key: "D", text: "反應中只有一種氧化劑" }, { key: "E", text: "鉀的氧化數改變" }
            ],
            correctAnswer: "A、C",
            explanation: "氧化數分析：K 皆為 +1（不變），(E)錯。N 由 KNO₃ 中的 +5 降為 N₂ 中的 0，被還原，即 KNO₃ 中的 N 是氧化劑，(C)對。C 由單質 0 升為 CO₂ 中的 +4，被氧化，是還原劑，(A)對。硫由單質 0 降為 K₂S 中的 −2，被還原，本身是氧化劑而非還原劑，(B)錯。由於 N 和 S 都被還原（皆為氧化劑），反應中不只一種氧化劑，(D)錯。正確為 (A)(C)。" },
          { type: "單選", knowledgePoint: "綠色化學／原子經濟",
            question: "在綠色化學的原則下，下列哪一種做法最符合「原子經濟」精神？",
            options: [
              { key: "A", text: "深埋含鎘、汞的廢舊電池" }, { key: "B", text: "由乙烯直接水合製造酒精（C₂H₄+H₂O→C₂H₅OH）" },
              { key: "C", text: "化工廢氣向高空排放" }, { key: "D", text: "農民就地焚燒稻稈" }
            ],
            correctAnswer: "B",
            explanation: "原子經濟要求反應物原子盡量完全轉化為目標產物，減少副產物與廢棄物；乙烯直接水合生成酒精的加成反應中，反應物原子幾乎全部進入產物，原子利用率高，符合綠色化學精神。其餘選項皆屬於「末端掩埋／排放／焚燒」處理污染物的方式，並未從源頭減少污染，不符合原子經濟原則。" },
          { type: "單選", knowledgePoint: "生活化學（藥品成分與用途）",
            question: "下列常見家用藥品／清潔劑成分與其主要用途的配對，何者最需要修正？",
            options: [
              { key: "A", text: "氫氧化鋁——制酸劑，保護胃壁" }, { key: "B", text: "柳酸甲酯（冬青油）——肌肉痠痛的外用止痛劑" },
              { key: "C", text: "碳酸氫鈉——制酸、緩解胃酸過多" }, { key: "D", text: "磺胺類藥物（如對胺基苯磺醯胺）——消炎藥" }
            ],
            correctAnswer: "D",
            explanation: "磺胺類藥物（sulfa drugs）主要作用機制是抑制細菌葉酸合成，屬於「抗菌（磺胺）藥物」，用於治療細菌感染，而非一般認知的消炎止痛藥；其餘三項的成分與用途配對皆正確。" },
          { type: "單選", knowledgePoint: "水溶液酸鹼性判斷",
            question: "下列有關水溶液酸鹼性的敘述，何者正確？",
            options: [
              { key: "A", text: "於水中加入酸，Kw 會變小" }, { key: "B", text: "[H⁺]>[OH⁻] 的溶液必為酸性" },
              { key: "C", text: "25°C 時 pH>pOH 的溶液呈酸性" }, { key: "D", text: "中性溶液中 [H⁺]=[OH⁻]=0" }
            ],
            correctAnswer: "B",
            explanation: "Kw 僅隨溫度改變，加入酸鹼不影響其值，(A)錯。[H⁺]>[OH⁻] 為酸性溶液的定義，(B)對。25°C 時 pH+pOH=14，若 pH>pOH 則 pH>7，代表鹼性而非酸性，(C)錯。中性溶液中 [H⁺]=[OH⁻]=1×10⁻⁷M（25°C），並非 0，(D)錯。" },
          { type: "單選", knowledgePoint: "核酸結構",
            question: "DNA／RNA 的核苷酸鏈中，其「主鏈」的正確重複連接方式為何？",
            options: [
              { key: "A", text: "磷酸與（去氧）核糖交替鍵結成主鏈，含氮鹼基以支鏈形式接在核糖上" },
              { key: "B", text: "含氮鹼基與磷酸交替鍵結成主鏈，核糖以支鏈形式接在含氮鹼基上" },
              { key: "C", text: "三者依序排列在同一條主鏈上，無分支" },
              { key: "D", text: "核糖與含氮鹼基交替鍵結成主鏈，磷酸以支鏈形式接在核糖上" }
            ],
            correctAnswer: "A",
            explanation: "核酸的骨架由磷酸與（去氧）核糖以磷酸雙酯鍵交替連接而成，含氮鹼基則各自接在每個核糖分子上，並以氫鍵與互補鏈的鹼基配對，並不屬於主鏈的一部分。" },
          { type: "單選", knowledgePoint: "醣類水解",
            question: "蔗糖（雙醣）經水解後會產生下列何種產物？",
            options: [
              { key: "A", text: "2 分子葡萄糖" }, { key: "B", text: "1 分子葡萄糖 + 1 分子果糖" },
              { key: "C", text: "2 分子果糖" }, { key: "D", text: "1 分子葡萄糖 + 1 分子半乳糖" }
            ],
            correctAnswer: "B",
            explanation: "蔗糖是由一分子葡萄糖與一分子果糖以醣苷鍵結合而成的雙醣，水解後產生等莫耳數的葡萄糖與果糖。" },
          { type: "單選", knowledgePoint: "界面活性劑與硬水",
            question: "界面活性劑分子一端為親水端（如 -COO⁻Na⁺、-SO₃⁻Na⁺），另一端為長碳鏈親油端。若親水端易與硬水中的 Ca²⁺、Mg²⁺形成不溶性沉澱、降低清潔力，此類界面活性劑屬於？",
            options: [
              { key: "A", text: "硬性清潔劑" }, { key: "B", text: "軟性清潔劑" }, { key: "C", text: "中性清潔劑" }, { key: "D", text: "天然清潔劑" }
            ],
            correctAnswer: "A",
            explanation: "傳統肥皂類（脂肪酸鹽，-COO⁻）容易與硬水中的 Ca²⁺、Mg²⁺形成皂垢（不溶性沉澱），使清潔力下降，這類界面活性劑稱為「硬性清潔劑」；改用磺酸鹽類（-SO₃⁻）等不易與硬水離子形成沉澱者，清潔力較不受硬水影響。" },
          { type: "單選", knowledgePoint: "花青素與天然酸鹼指示劑",
            question: "花青素在不同 pH 環境下顏色改變：酸性（pH<3）呈紅色、中性偏微鹼（pH 6~7）呈紫色、強鹼（pH 8~10）呈藍綠色。這種因 pH 改變而變色的性質，最適合將花青素應用於下列何種用途？",
            options: [
              { key: "A", text: "天然抗生素" }, { key: "B", text: "天然酸鹼指示劑" }, { key: "C", text: "天然界面活性劑" }, { key: "D", text: "天然還原劑" }
            ],
            correctAnswer: "B",
            explanation: "花青素的顏色會隨溶液 pH 值改變而明顯改變（紅→紫→藍綠），此特性與人工酸鹼指示劑相似，故可作為天然的酸鹼指示劑。" }
        ]
      }
    ],
    recentFiles: [
      { name: "酸鹼、溶解度與生活化學重點整理與模擬試題.pdf", type: "PDF", size: "1.8 MB", date: "2026/08/02" },
      { name: "三角函數的應用重點整理與模擬試題.pdf", type: "PDF", size: "1.6 MB", date: "2026/07/30" },
      { name: "二次函數重點整理.pdf", type: "PDF", size: "2.4 MB", date: "2024/06/20" },
      { name: "牛頓定律講義.pptx", type: "PPT", size: "5.6 MB", date: "2024/06/18" },
      { name: "英文單字筆記.docx", type: "DOCX", size: "1.8 MB", date: "2024/06/17" },
      { name: "高一模考成績分析.xlsx", type: "XLSX", size: "2.1 MB", date: "2024/06/15" },
      { name: "化學反應動畫.mp4", type: "MP4", size: "45.2 MB", date: "2024/06/14" }
    ]
  },

  quiz: {
    title: "測驗中心",
    titleEn: "Quiz Center",
    subtitle: "大量題庫，智能練習，精準提升學習成效！",
    subjects: ["all", "math", "english", "physics", "chemistry", "biology"],
    grades: ["高一", "高二", "高三"],
    chapters: ["全部章節", "第一章", "第二章", "第三章"],
    difficulties: ["全部難度", "易", "中等", "難"],
    types: ["全部題型", "選擇題", "填充題", "問答題"],
    sorts: ["最新排序", "正確率", "完成度"],
    items: [
      { subject: "math", title: "二次函數的圖形與性質", grade: "高一上", chapter: "第三章",
        count: 10, type: "選擇題", difficulty: "易~中等", progress: 80, accuracy: 85, best: 85, done: false },
      { subject: "english", title: "英文閱讀理解攻略", grade: "高一上", chapter: "Unit 3",
        count: 15, type: "選擇題", difficulty: "中等", progress: 40, accuracy: 66, best: 66, done: false },
      { subject: "physics", title: "牛頓運動定律總整理", grade: "高一上", chapter: "第二章",
        count: 12, type: "選擇題", difficulty: "中等", progress: 60, accuracy: 75, best: 75, done: false },
      { subject: "chemistry", title: "化學反應與平衡", grade: "高一上", chapter: "第三章",
        count: 10, type: "選擇題", difficulty: "難", progress: 20, accuracy: 40, best: 40, done: false },
      { subject: "biology", title: "細胞構造與功能", grade: "高一上", chapter: "第一章",
        count: 10, type: "選擇題", difficulty: "易~中等", progress: 100, accuracy: 92, best: 92, done: true }
    ],
    stats: [
      { icon: "clock", label: "總測驗次數", value: "18", unit: "次", delta: "較上週 +4 次" },
      { icon: "target", label: "平均正確率", value: "78", unit: "%", delta: "較上週 +8%" },
      { icon: "award", label: "總得分", value: "1408", unit: "分", delta: "較上週 +256 分" },
      { icon: "check", label: "已完成題數", value: "156", unit: "題", delta: "較上週 +28 題" }
    ],
    accuracyByStudy: [
      { subject: "math", percent: 85 },
      { subject: "english", percent: 75 },
      { subject: "physics", percent: 70 },
      { subject: "chemistry", percent: 60 },
      { subject: "biology", percent: 90 },
      { subject: "history", percent: 65 },
      { subject: "geography", percent: 70 }
    ],
    history: [
      { subject: "math", title: "二次函數的圖形與性質", when: "2024/06/20 14:30", score: 85, accuracy: 85 },
      { subject: "english", title: "英文閱讀理解攻略", when: "2024/06/19 19:20", score: 66, accuracy: 66 },
      { subject: "physics", title: "牛頓運動定律總整理", when: "2024/06/19 10:15", score: 75, accuracy: 75 },
      { subject: "chemistry", title: "化學反應與平衡", when: "2024/06/18 16:45", score: 40, accuracy: 40 }
    ]
  },

  wrongBook: {
    title: "錯題本",
    subtitle: "整理錯題，釐清觀念，強化弱點！",
    bannerTip: "每一次錯誤，都是進步的線索！再試一次，你一定可以更好！",
    subjectOptions: ["全部科目", "國文", "英文", "數學", "物理", "化學", "生物", "歷史", "地理", "公民"],
    knowledgeOptions: ["全部知識點", "二次函數", "關係代名詞", "牛頓運動定律", "反應速率", "光合作用"],
    difficultyOptions: ["全部難易度", "簡單", "中等", "困難"],
    statusOptions: ["全部狀態", "待複習", "複習中", "已精熟"],
    totalCount: 58,
    perPage: 6,
    totalPages: 10,
    items: [
      {
        subject: "math", title: "二次函數的圖形與性質", chapter: "高一數學｜第二章 二次函數",
        difficulty: "困難", errorCount: 2, lastError: "2024/06/20", bookmarked: true,
        question: "若二次函數 f(x) = x² − 6x + 5，則下列敘述何者錯誤？",
        options: [
          { key: "A", text: "此函數圖形開口向上" },
          { key: "B", text: "頂點坐標為 (3, −4)" },
          { key: "C", text: "與 x 軸有兩個交點" },
          { key: "D", text: "y 截距為 5" }
        ],
        yourAnswer: "B", correctAnswer: "B",
        knowledgePoint: "二次函數的圖形與頂點",
        explanation: "頂點公式 x = −b / 2a = −(−6) / 2(1) = 3，代入 f(3) = 3² − 6(3) + 5 = 9 − 18 + 5 = −4，所以頂點為 (3, −4)。因此 (B) 頂點坐標為 (3, −4) 是正確的，故錯誤的選項應為其他敘述。"
      },
      {
        subject: "english", title: "關係代名詞綜合題", chapter: "高一英文｜Unit 4 關係子句",
        difficulty: "中等", errorCount: 1, lastError: "2024/06/18", bookmarked: false,
        question: "Choose the correct relative pronoun: The book ___ I borrowed is interesting.",
        options: [
          { key: "A", text: "who" },
          { key: "B", text: "which" },
          { key: "C", text: "whose" },
          { key: "D", text: "where" }
        ],
        yourAnswer: "A", correctAnswer: "B",
        knowledgePoint: "關係代名詞 which / that",
        explanation: "先行詞 the book 為「事物」，且關係子句中作受詞，應使用 which 或 that；who 用於「人」，故正確答案為 (B) which。"
      },
      {
        subject: "physics", title: "牛頓運動定律應用", chapter: "高一物理｜第二章 力與運動",
        difficulty: "中等", errorCount: 3, lastError: "2024/06/17", bookmarked: false,
        question: "質量 2 kg 的物體受 10 N 的水平力，若摩擦力為 2 N，則加速度為？",
        options: [
          { key: "A", text: "3 m/s²" },
          { key: "B", text: "4 m/s²" },
          { key: "C", text: "5 m/s²" },
          { key: "D", text: "6 m/s²" }
        ],
        yourAnswer: "C", correctAnswer: "B",
        knowledgePoint: "牛頓第二運動定律",
        explanation: "合力 = 10 − 2 = 8 N，由 F = ma 得 a = F / m = 8 / 2 = 4 m/s²，故正確答案為 (B)。"
      },
      {
        subject: "chemistry", title: "化學反應速率計算", chapter: "高一化學｜第三章 化學反應速率",
        difficulty: "困難", errorCount: 2, lastError: "2024/06/16", bookmarked: false,
        question: "溫度升高使反應速率加快，主要原因為？",
        options: [
          { key: "A", text: "活化能降低" },
          { key: "B", text: "有效碰撞次數增加" },
          { key: "C", text: "反應物濃度增加" },
          { key: "D", text: "催化劑增加" }
        ],
        yourAnswer: "A", correctAnswer: "B",
        knowledgePoint: "反應速率與碰撞理論",
        explanation: "溫度升高使分子平均動能增加，達到活化能的有效碰撞次數增加，故反應速率加快；活化能本身不因溫度而改變，故正確答案為 (B)。"
      },
      {
        subject: "biology", title: "光合作用階段比較", chapter: "高一生物｜第三章 植物的生理作用",
        difficulty: "簡單", errorCount: 1, lastError: "2024/06/15", bookmarked: false,
        question: "光反應發生的位置為？",
        options: [
          { key: "A", text: "基質" },
          { key: "B", text: "類囊體膜" },
          { key: "C", text: "細胞質" },
          { key: "D", text: "粒線體" }
        ],
        yourAnswer: "A", correctAnswer: "B",
        knowledgePoint: "光合作用的光反應",
        explanation: "光反應發生於葉綠體的類囊體膜上，暗反應（卡爾文循環）才發生於基質，故正確答案為 (B)。"
      },
      {
        subject: "history", title: "明清時期社會經濟發展", chapter: "高一歷史｜第二章 明清時期",
        difficulty: "中等", errorCount: 2, lastError: "2024/06/14", bookmarked: false,
        question: "明清時期江南地區經濟發展的重要特徵為？",
        options: [
          { key: "A", text: "遊牧經濟興盛" },
          { key: "B", text: "手工業與商業市鎮興起" },
          { key: "C", text: "莊園制度確立" },
          { key: "D", text: "海禁完全解除" }
        ],
        yourAnswer: "C", correctAnswer: "B",
        knowledgePoint: "明清社會經濟",
        explanation: "明清時期江南地區手工業（紡織）與商業市鎮蓬勃發展，出現專業化生產與商品經濟，故正確答案為 (B)。"
      }
    ]
  },

  summary: {
    title: "學習總結",
    subtitle: "AI 智能總結，幫助你快速掌握重點",
    subject: "chemistry",
    grade: "高一化學",
    chapter: "第三章 物質的組成與化學反應",
    section: "3-2 化學反應中的質量關係",
    stats: [
      { icon: "summary", label: "總結字數", value: "1,245", unit: "字" },
      { icon: "star", label: "重點數量", value: "12", unit: "個" },
      { icon: "clock", label: "預估閱讀時間", value: "6", unit: "分鐘" }
    ],
    summaryText: "本節重點在於理解「質量守恆定律」與化學方程式的計量關係。任何化學反應中，反應物的總質量等於生成物的總質量。透過莫耳概念與化學計量，可進行反應物與生成物之間的質量換算，並能解決相關計算題。此外，純物質與混合物的組成分析、溶液濃度的計算，也是本節常考點。",
    keywords: ["質量守恆定律", "莫耳概念", "化學計量", "濃度計算", "純物質與混合物"],
    mindmap: {
      center: "3-2 化學反應中的質量關係",
      branches: [
        { title: "質量守恆定律", tone: "#7c5cff", leaves: ["定義", "實驗驗證", "意義與應用"] },
        { title: "純物質與混合物", tone: "#f59e0b", leaves: ["純物質定義", "混合物定義", "分離方法"] },
        { title: "化學計量", tone: "#3b82f6", leaves: ["莫耳概念", "莫耳質量", "化學方程式"] },
        { title: "溶液濃度", tone: "#ec4899", leaves: ["重量百分率", "莫耳濃度", "稀釋計算"] },
        { title: "計算應用", tone: "#22b573", leaves: ["質量換算", "百分組成", "產率計算"] },
        { title: "常見考點", tone: "#06b6d4", leaves: ["計算題型", "圖表判讀", "易錯觀念"] }
      ]
    },
    keyPoints: [
      "質量守恆定律：反應前後物質的總質量不變。",
      "莫耳（mol）：物質的量單位，1 莫耳 = 6.02 × 10²³ 個粒子。",
      "莫耳質量：物質的質量 (g) ÷ 莫耳數 (mol)。",
      "化學方程式的計量關係可用於計算質量、莫耳數與體積。",
      "溶液濃度的計算需注意單位與稀釋前後的關係。",
      "純物質具有固定組成，混合物可用物理方法分離。"
    ],
    knowledgeTree: {
      root: "物質的組成與化學反應",
      nodes: [
        { name: "物質的分類", children: ["純物質", "混合物"] },
        { name: "化學反應", children: ["反應式", "反應類型"] },
        { name: "質量關係", children: ["質量守恆定律", "化學計量", "計算應用"] },
        { name: "溶液與濃度", children: ["濃度表示法", "稀釋計算", "應用題型"] }
      ]
    },
    resources: [
      { name: "課程講義：3-2 化學反應中的質量關係.pdf", type: "PDF" },
      { name: "精選例題與解析.pdf", type: "PDF" },
      { name: "課後筆記（老師版）.pptx", type: "PPT" },
      { name: "延伸閱讀：化學計量應用.docx", type: "DOCX" },
      { name: "歷屆試題精選（含解析）.pdf", type: "PDF" }
    ],
    notes: {
      text: "注意稀釋計算時，溶質的莫耳數不變！常考：利用化學計量計算產率。",
      tags: [
        { label: "計算題", tone: "#7c5cff" },
        { label: "濃度", tone: "#ec4899" },
        { label: "莫耳概念", tone: "#22b573" },
        { label: "常考觀念", tone: "#f59e0b" }
      ]
    }
  },

  myLearning: {
    title: "我的學習",
    overview: {
      title: "學習總覽",
      speech: "學習是一場馬拉松，你已經比昨天更進步了！繼續加油吧！",
      stats: [
        { icon: "clock", label: "總學習時間", value: "128.6", unit: "小時", delta: "較上週 +12.4 小時", tone: "ok" },
        { icon: "calendar", label: "累積學習天數", value: "46", unit: "天", delta: "連續學習 12 天", tone: "fire" },
        { icon: "check", label: "完成題數", value: "2,540", unit: "題", delta: "較上週 +320 題", tone: "ok" },
        { icon: "target", label: "正確率", value: "78.6", unit: "%", delta: "較上週 +6.3%", tone: "ok" }
      ]
    },
    record: {
      title: "學習記錄",
      tabs: ["本週", "本月", "今年", "全部"],
      bars: [
        { label: "5/12", sub: "週一", hours: 7.2 },
        { label: "5/13", sub: "週二", hours: 9.6 },
        { label: "5/14", sub: "週三", hours: 8.1 },
        { label: "5/15", sub: "週四", hours: 10.3 },
        { label: "5/16", sub: "週五", hours: 7.8 },
        { label: "5/17", sub: "週六", hours: 6.4 },
        { label: "5/18", sub: "週日", hours: 5.2 }
      ],
      todayFocus: [
        { time: "09:30", subject: "math", unit: "二次函數的圖形與性質", minutes: 45, done: true },
        { time: "11:15", subject: "english", unit: "文法練習：關係代名詞", minutes: 30, done: true },
        { time: "14:00", subject: "physics", unit: "牛頓運動定律總整理", minutes: 60, done: false }
      ]
    },
    weekly: {
      title: "週報告",
      range: "5/12 - 5/18",
      radar: [
        { subject: "math", now: 9.0, last: 7.0 },
        { subject: "english", now: 8.0, last: 7.0 },
        { subject: "physics", now: 7.0, last: 6.0 },
        { subject: "chemistry", now: 6.5, last: 6.0 },
        { subject: "biology", now: 7.5, last: 6.5 },
        { subject: "history", now: 6.0, last: 5.5 },
        { subject: "geography", now: 6.5, last: 6.0 },
        { subject: "chinese", now: 7.0, last: 6.0 }
      ],
      radarMax: 10,
      summary: [
        { label: "本週總時數", value: "54.6", unit: "小時", delta: "較上週 +12.4" },
        { label: "本週完成題數", value: "420", unit: "題", delta: "較上週 +85" },
        { label: "本週正確率", value: "78.6", unit: "%", delta: "較上週 +6.3%" }
      ]
    },
    calendar: {
      title: "學習日曆",
      monthLabel: "2024 年 5 月",
      firstWeekday: 3,
      daysInMonth: 31,
      today: 18,
      levels: {
        1: 1, 2: 2, 3: 1, 6: 2, 7: 3, 8: 1, 9: 2, 10: 2,
        12: 1, 13: 2, 14: 3, 15: 2, 16: 1, 17: 2, 18: 4,
        20: 2, 21: 1, 22: 3, 23: 2, 27: 1, 28: 2, 30: 1, 31: 1
      },
      legend: [
        { label: "0-1 小時", tone: "#c7f0da" },
        { label: "1-2 小時", tone: "#7fd8a8" },
        { label: "2-3 小時", tone: "#3fb877" },
        { label: "3 小時以上", tone: "#1f8f52" },
        { label: "無記錄", tone: "#eceef3" }
      ]
    },
    badges: {
      title: "成就徽章",
      items: [
        { icon: "star", label: "學習新星", desc: "連續學習 7 天", tone: "#f2b705" },
        { icon: "award", label: "勤奮學習者", desc: "學習時數滿 50 小時", tone: "#7c5cff" },
        { icon: "quiz", label: "測驗達人", desc: "完成測驗 100 次", tone: "#3b82f6" },
        { icon: "target", label: "滿分挑戰者", desc: "獲得滿分 10 次", tone: "#ef4444" },
        { icon: "summary", label: "知識探索者", desc: "探索知識點 200 個", tone: "#22b573" }
      ],
      recent: { label: "測驗達人", desc: "完成測驗 100 次", date: "2024/05/17" }
    },
    progress: {
      title: "學習進度",
      items: [
        { subject: "math", percent: 80, status: "進度超前" },
        { subject: "english", percent: 65, status: "持續進步" },
        { subject: "physics", percent: 70, status: "良好" },
        { subject: "chemistry", percent: 60, status: "加強練習" },
        { subject: "biology", percent: 75, status: "良好" },
        { subject: "history", percent: 55, status: "加強複習" },
        { subject: "geography", percent: 68, status: "持續進步" },
        { subject: "chinese", percent: 72, status: "良好" }
      ]
    }
  },

  aiTutorPage: {
    title: "巧巧老師 AI Tutor",
    tagline: "有問題儘管問我，我會陪你一起思考、一起進步！",
    badge: "AI 助教 · 24 小時在線",
    messages: [
      { role: "user", time: "10:30",
        text: "老師，請問二次函數 f(x) = x² − 4x + 3 的圖形與 x 軸的交點是？" },
      { role: "assistant", time: "10:30",
        text: "我們可以把二次函數因式分解，找出與 x 軸的交點（即 y = 0 時的 x 值）。\nf(x) = x² − 4x + 3 = (x − 1)(x − 3)\n令 f(x) = 0：(x − 1)(x − 3) = 0 ⇒ x = 1 或 x = 3\n所以圖形與 x 軸的交點為 (1, 0) 與 (3, 0)。" },
      { role: "user", time: "10:31", text: "可以畫圖讓我看嗎？" }
    ],
    suggestions: [
      { icon: "summary", label: "解題步驟詳解", desc: "請詳細解題" },
      { icon: "chat", label: "概念解釋", desc: "用簡單的方式說明" },
      { icon: "quiz", label: "類題練習", desc: "出類似的題目練習" },
      { icon: "bookmark", label: "重點整理", desc: "整理成重點筆記" },
      { icon: "target", label: "考卷解析", desc: "解析考卷題目" },
      { icon: "refresh", label: "換個主題", desc: "聊聊別的內容" }
    ],
    cannedReplies: [
      "好的！這是一個很好的問題，我們一步一步來看。首先確認題目的已知條件，再選擇適合的公式或方法。",
      "沒問題～我先幫你把關鍵概念拆解成幾個小步驟，這樣會更容易理解喔！",
      "很棒的思考方向！讓我用一個簡單的例子帶你一起推導看看。"
    ],
    history: [
      { title: "二次函數圖形與交點", sub: "老師，請問二次函數 f(x) = x² − 4x + 3 …", time: "10:31" },
      { title: "化學反應速率", sub: "請問影響化學反應速率的因素有哪些？", time: "昨天" },
      { title: "牛頓運動定律", sub: "作用力與反作用力的關係是？", time: "昨天" },
      { title: "英文時態整理", sub: "過去完成式怎麼用？", time: "2 天前" },
      { title: "光合作用過程", sub: "請解釋光反應與暗反應的差別", time: "3 天前" }
    ],
    resources: [
      { name: "高中數學公式手冊", type: "PDF" },
      { name: "化學元素週期表", type: "PDF" },
      { name: "物理重點整理筆記", type: "DOCX" },
      { name: "英文單字大全", type: "PDF" },
      { name: "生物圖解總整理", type: "PPT" }
    ]
  },

  dashboard: {
    title: "學習儀表板",
    subtitle: "掌握學習狀況，讓進步看得見！",
    stats: [
      { icon: "clock", label: "總學習時間", value: "128.6", unit: "小時", delta: "較上週 +12.4 小時", tone: "#7c5cff" },
      { icon: "check", label: "完成題數", value: "2,540", unit: "題", delta: "較上週 +320 題", tone: "#3b82f6" },
      { icon: "target", label: "正確率", value: "78.6", unit: "%", delta: "較上週 +6.3%", tone: "#22b573" },
      { icon: "star", label: "連續學習天數", value: "46", unit: "天", delta: "累計最佳 46 天", tone: "#f59e0b" },
      { icon: "award", label: "總積分", value: "14,080", unit: "分", delta: "較上週 +256 分", tone: "#7c5cff" }
    ],
    trend: {
      range: "近 7 天",
      hoursMax: 30,
      days: [
        { label: "5/12 一", hours: 14.2, acc: 72 },
        { label: "5/13 二", hours: 16.8, acc: 74 },
        { label: "5/14 三", hours: 18.6, acc: 77 },
        { label: "5/15", hours: 15.3, acc: 75 },
        { label: "5/16", hours: 17.9, acc: 78 },
        { label: "5/17 六", hours: 20.4, acc: 80 },
        { label: "5/18 日", hours: 25.4, acc: 82 }
      ]
    },
    timeDist: {
      total: "128.6", unit: "小時",
      items: [
        { subject: "math", label: "數學", percent: 28 },
        { subject: "english", label: "英文", percent: 20 },
        { subject: "physics", label: "物理", percent: 15 },
        { subject: "chemistry", label: "化學", percent: 13 },
        { subject: "biology", label: "生物", percent: 11 },
        { subject: "other", label: "其他", percent: 13 }
      ]
    },
    progress: {
      overall: 68,
      items: [
        { subject: "math", percent: 75 },
        { subject: "english", percent: 65 },
        { subject: "physics", percent: 60 },
        { subject: "chemistry", percent: 70 },
        { subject: "biology", percent: 55 },
        { subject: "history", percent: 60 },
        { subject: "geography", percent: 65 }
      ]
    },
    knowledge: [
      { name: "指數與對數", percent: 92 },
      { name: "二次函數", percent: 88 },
      { name: "力與運動", percent: 85 },
      { name: "化學計量", percent: 82 },
      { name: "細胞構造", percent: 78 },
      { name: "英文閱讀理解", percent: 75 },
      { name: "電學基礎", percent: 72 },
      { name: "酸鹼反應", percent: 70 },
      { name: "光合作用", percent: 68 },
      { name: "世界大戰", percent: 65 }
    ],
    todayTasks: {
      goalText: "完成 5 個任務可獲得 120 積分",
      goalDone: 3, goalTotal: 5,
      items: [
        { unit: "完成數學練習：指數與對數", points: 30, done: true },
        { unit: "閱讀英文長篇文章", points: 20, done: true },
        { unit: "觀看物理教學影片", points: 20, done: false },
        { unit: "完成化學章節測驗", points: 30, done: false },
        { unit: "整理生物重點筆記", points: 20, done: false }
      ]
    },
    subjectStatus: [
      { subject: "math", percent: 75 },
      { subject: "english", percent: 65 },
      { subject: "physics", percent: 60 },
      { subject: "chemistry", percent: 70 },
      { subject: "biology", percent: 55 },
      { subject: "history", percent: 60 },
      { subject: "geography", percent: 65 },
      { subject: "chinese", percent: 70 }
    ],
    aiTips: {
      intro: "根據你的學習狀況，巧巧建議你：",
      tips: [
        "加強「二次函數」的練習，正確率可提升至 85% 以上",
        "增加「英文閱讀」時間，每天 20 分鐘效果更佳",
        "本週可挑戰「化學計量」進階題型，提升應試能力"
      ]
    }
  },

  nav: {
    active: "home",
    /* EO-S5-002 · Sidebar 正式 IA：學習總結（原「重點整理」改名）、新增
       複習中心，並移除「儀表板」（新 IA 清單未列出；dashboard.html 本身
       未被更動，僅不再由 Sidebar 連結）。Bottom Navigation 不受影響。 */
    items: [
      { id: "home", label: "首頁", icon: "home" },
      { id: "materials", label: "教材中心", icon: "book" },
      { id: "quiz", label: "測驗中心", icon: "quiz" },
      { id: "wrongbook", label: "錯題本", icon: "wrong" },
      { id: "summary", label: "學習總結", icon: "summary" },
      { id: "review", label: "複習中心", icon: "clock" },
      { id: "learning", label: "我的學習", icon: "learning" },
      { id: "tutor", label: "AI Tutor", icon: "tutor" }
    ],
    /* EO-S5-003/004 · Bottom Navigation 正式 IA + Dead Button 根因修正：
       原 "我的" 項目 id 為 "me"，但 AppShell.js 的 ROUTES 沒有對應項目，
       導致永遠落入 Mock <button> 分支（無實際作用）。改為 id "dashboard"
       （ROUTES 已有 dashboard: "dashboard.html"），同時完成 WB-S5-004 要求
       的重新命名（教材/測驗/複習/我的）。不修改 AppShell.js 的渲染邏輯或
       ROUTES 本身 — 現有邏輯已支援，只是資料對不上。 */
    bottomItems: [
      { id: "home", label: "首頁", icon: "home" },
      { id: "materials", label: "教材", icon: "book" },
      { id: "quiz", label: "測驗", icon: "quiz" },
      { id: "review", label: "複習", icon: "clock" },
      { id: "dashboard", label: "我的", icon: "tutor" }
    ]
  },

  /* Material Center Sprint 3 · MAT-F005: 繼續閱讀 (Continue Reading). */
  lastReading: {
    materialId: 1
  },

  /* HOME-F009: Notification. */
  notifications: [
    { id: 1, title: "段考倒數提醒", message: "距離第一次段考還有 71 天，記得安排複習計畫。", type: "exam", time: "10 分鐘前", unread: true },
    { id: 2, title: "教材已更新", message: "數學第三章教材新增習題解析。", type: "material", time: "1 小時前", unread: true },
    { id: 3, title: "學習提醒", message: "你已經 3 天沒有完成今日任務了。", type: "reminder", time: "昨天", unread: false }
  ],

  /* HOME-F010: Profile Menu. */
  user: {
    name: "陳同學",
    avatar: "",
    email: "student@example.com"
  }
};
