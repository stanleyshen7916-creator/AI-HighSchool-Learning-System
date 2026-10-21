/* js/data/VisualLessonData.js — 2026-10-21 圖解教材（互動）.

   Registry of interactive visual lessons. Each lesson is ONE self-contained
   HTML page under docs/TeachingMaterials/lessons/ (inline CSS/JS, no fetch,
   no storage other than sessionStorage), shown in an <iframe> by
   js/ui/VisualLessonFrame.js:
     教材中心  — the whole lesson (?embed=1)
     學習助教  — a single formula card (?card=F10)
   The teaching-material packages themselves are not modified.

   materialIds: the tm_N packages this lesson belongs to (課本 + 補充題庫).
   cards[].keywords: matched against a student's question text or a quiz
   question's knowledgePoint/stem by js/utils/VisualLesson.js. */
window.AHS = window.AHS || {};
AHS.VisualLessonData = [
  {
    lessonId: "MAT_H2_Ch1_Trigonometry",
    href: "docs/TeachingMaterials/lessons/MAT_H2_Ch1_Trigonometry.html",
    title: "第1章 三角函數・圖解教材",
    subject: "數學",
    materialIds: ["tm_7", "tm_50", "tm_57"],
    source: "課本 p.2–67（1-1 p.2–13、1-2 p.14–39、1-3 p.40–54、1-4 p.55–67）",
    sections: [
      { id: "1-1", title: "弧度量" },
      { id: "1-2", title: "三角函數的圖形" },
      { id: "1-3", title: "和角與差角公式" },
      { id: "1-4", title: "正餘弦函數的疊合" }
    ],
    cards: [
      { id: "F1", section: "1-1", title: "弧度（弳）的定義", keywords: ["扇形弧長", "弧度的定義", "弳的定義", "弧長公式", "由弧長與半徑求圓心角", "弧度與角度的區別", "弧度與象限", "弧長", "弧度", "弳"] },
      { id: "F2", section: "1-1", title: "扇形面積", keywords: ["扇形面積", "弓形面積", "扇形周長", "扇形"] },
      { id: "F3", section: "1-1", title: "度與弳的換算", keywords: ["度與弧度的換算", "弧度轉度數", "度數轉弧度", "化為弧度", "化為度", "同界角", "換算"] },
      { id: "F4", section: "1-1", title: "圓錐展開成扇形", keywords: ["扇形展開", "圓錐", "展開", "攤平", "最短路徑", "斜高", "母線"] },
      { id: "F5", section: "1-2", title: "正弦函數 y = sin x", keywords: ["弧度與三角函數值", "三角函數值", "廣義角三角函數", "廣義角的化簡", "廣義角", "三角函數圖形的應用", "正弦函數", "正弦函數的值域", "正弦函數的週期", "三角方程式", "sin x 的圖形", "sinx", "單位圓", "對稱軸", "對稱中心"] },
      { id: "F6", section: "1-2", title: "餘弦函數 y = cos x", keywords: ["餘弦函數", "正弦與餘弦圖形的關係", "三角函數的對稱性", "cosx", "cos x"] },
      { id: "F7", section: "1-2", title: "平移與伸縮 y = a sin(bx − h) + k", keywords: ["正弦函數圖形的", "一般正弦函數", "平移組合", "圖形的平移", "圖形的伸縮", "平移與伸縮", "由圖形求正弦函數", "由極值求參數", "振幅", "週期", "平移", "伸縮"] },
      { id: "F8", section: "1-2", title: "週期模型：月球亮面比例", keywords: ["正弦函數模型", "函數模型", "模型", "週期模型", "週期性現象", "月球", "月相", "摩天輪", "潮汐", "擬合", "情境"] },
      { id: "F9", section: "1-2", title: "正切函數 y = tan x", keywords: ["正切函數", "正切函數的定義域", "正切函數的週期", "正切函數性質", "漸近線", "tanx", "tan x", "正切"] },
      { id: "F10", section: "1-3", title: "和角與差角公式", keywords: ["正切和角", "正切差角", "正切的和角", "和角公式", "差角公式", "和差角", "特殊角精確值", "已知函數值求和角值", "sin(α+β)", "cos(α+β)", "和角", "差角"] },
      { id: "F11", section: "1-3", title: "正切差角與兩直線夾角", keywords: ["兩直線夾角", "兩直線的夾角", "夾角", "斜率", "傾斜角"] },
      { id: "F12", section: "1-3", title: "二倍角公式", keywords: ["二倍角", "倍角公式", "倍角", "sin2θ", "cos2θ"] },
      { id: "F13", section: "1-3", title: "半角公式", keywords: ["半角公式", "半角", "θ/2"] },
      { id: "F14", section: "1-4", title: "疊合公式", keywords: ["正餘弦函數的疊合", "疊合成", "正餘弦疊合", "疊合公式", "疊合", "表示為(r,α)數對", "求振幅r值", "a sin x + b cos x"] },
      { id: "F15", section: "1-4", title: "疊合求區間最大值、最小值", keywords: ["限定區間求極值", "區間求極值", "限定區間", "區間內的最大值", "區間最大值", "區間最小值"] }
    ]
  },
  {
    lessonId: "PHY_H2_Ch1_Uncertainty",
    href: "docs/TeachingMaterials/lessons/PHY_H2_Ch1_Uncertainty.html",
    title: "第1章 測量與不確定度・圖解教材",
    subject: "物理",
    materialIds: ["tm_10", "tm_43", "tm_52"],
    source: "課本第1～25頁（1-1 簡介不確定度、1-2 不確定度的組合、1-3 物理量的因次）",
    sections: [
      { id: "1-1", title: "簡介不確定度" },
      { id: "1-2", title: "不確定度的組合" },
      { id: "1-3", title: "物理量的因次" }
    ],
    cards: [
      { id: "F1", section: "1-1", title: "從誤差到不確定度", keywords: ["從誤差到不確定度", "誤差與不確定度", "誤差vs不確定度", "誤差", "真值", "ISO"] },
      { id: "F2", section: "1-1", title: "A 類評估：u = s／√n", keywords: ["A類評估", "A類計算", "不確定度的A類評估", "樣本標準差", "標準差", "n-1"] },
      { id: "F3", section: "1-1", title: "B 類評估：u = 最小刻度／(2√3)", keywords: ["B類評估", "不確定度的B類評估", "最小刻度", "電壓表", "均勻分布"] },
      { id: "F4", section: "1-1", title: "進位規則與結果表示", keywords: ["進位規則", "有效數字", "進位", "結果表示"] },
      { id: "F5", section: "1-2", title: "A、B 類組合不確定度", keywords: ["A、B類組合", "A類與B類的組合", "組合不確定度", "合成不確定度"] },
      { id: "F6", section: "1-2", title: "加減法組合", keywords: ["加減法組合", "加法組合", "減法組合", "物理量加減後"] },
      { id: "F7", section: "1-2", title: "乘除法組合：相對不確定度", keywords: ["乘除法組合", "乘法組合", "除法組合", "物理量乘除後", "相對不確定度", "密度"] },
      { id: "F8", section: "1-3", title: "基本因次與常見物理量", keywords: ["常見物理量因次", "物理量的因次", "因次概念", "因次辨識", "因次：功", "因次：動量", "基本因次", "因次"] },
      { id: "F9", section: "1-3", title: "因次分析推導公式", keywords: ["因次分析推導", "因次推導", "因次分析", "單擺週期", "彈簧週期"] }
    ]
  },
  {
    lessonId: "PHY_H2_Ch2_LinearMotion",
    href: "docs/TeachingMaterials/lessons/PHY_H2_Ch2_LinearMotion.html",
    title: "第2章 直線運動・圖解教材",
    subject: "物理",
    materialIds: ["tm_11", "tm_44", "tm_53"],
    source: "課本第12～24頁（2-1 運動學簡介、2-2 物體運動圖、2-3 等加速運動、實驗1、2-4 相對運動）",
    sections: [
      { id: "2-1", title: "運動學簡介" },
      { id: "2-2", title: "物體運動圖" },
      { id: "2-3", title: "等加速運動（含實驗1）" },
      { id: "2-4", title: "相對運動" }
    ],
    cards: [
      { id: "F1", section: "2-1", title: "位移與路徑長", keywords: ["位移與路徑長", "路徑長", "位移"] },
      { id: "F2", section: "2-1", title: "平均速度與平均速率", keywords: ["平均速度與平均速率", "平均速度", "平均速率", "速度與速率", "瞬時速度", "速率"] },
      { id: "F3", section: "2-1", title: "加速度與加速、減速", keywords: ["加速度的意義", "平均加速度", "加速度", "加速", "減速"] },
      { id: "F4", section: "2-2", title: "x-t 圖：斜率 = 速度", keywords: ["x-t圖", "位置函數", "位置時間圖", "x-t"] },
      { id: "F5", section: "2-2", title: "v-t 圖：斜率 = 加速度、面積 = 位移", keywords: ["三大運動圖", "v-t圖", "運動圖", "v-t"] },
      { id: "F6", section: "2-2", title: "a-t 圖：面積 = 速度變化量", keywords: ["a-t圖", "速度變化量", "a-t"] },
      { id: "F7", section: "2-3", title: "等加速運動三公式", keywords: ["等加速運動公式", "等加速運動", "等加速位移公式", "等加速末速公式", "無時間公式", "煞車減速", "煞車", "等加速"] },
      { id: "F8", section: "2-3", title: "自由落體", keywords: ["自由落體", "自由落下"] },
      { id: "F9", section: "2-3", title: "鉛直上拋", keywords: ["鉛直上拋運動", "鉛直上拋", "上拋", "最高點"] },
      { id: "F10", section: "2-3", title: "實驗1：打點計時器", keywords: ["打點計時器實驗", "打點計時器", "實驗1", "點痕", "紙帶"] },
      { id: "F11", section: "2-4", title: "相對速度 v_AB = v_A − v_B", keywords: ["相對速度", "相對運動", "相對位移", "相對加速度"] }
    ]
  },
  {
    lessonId: "CHE_H2_Ch1_Stoichiometry",
    href: "docs/TeachingMaterials/lessons/CHE_H2_Ch1_Stoichiometry.html",
    title: "第1章 化學計量與反應熱・圖解教材",
    subject: "化學",
    materialIds: ["tm_12", "tm_13", "tm_26"],
    source: "課本第9～52頁、講義 1-1、1-2、實驗活動1",
    sections: [
      { id: "1-0", title: "物質的特性與鑑定" },
      { id: "1-1", title: "化學反應式的平衡及應用" },
      { id: "1-2", title: "化學反應中的能量變化" }
    ],
    cards: [
      { id: "F1", section: "1-0", title: "純物質與混合物：看加熱曲線", keywords: ["純物質與混合物", "純物質", "混合物", "加熱曲線", "物質鑑定", "鑑定", "熔點", "沸點"] },
      { id: "F2", section: "1-0", title: "色層分析與比移值 Rf", keywords: ["色層分析法", "色層分析", "比移值", "Rf"] },
      { id: "F3", section: "1-1", title: "平衡反應式：原子守恆", keywords: ["反應式平衡", "平衡反應式", "化學式推導", "原子守恆", "質量守恆"] },
      { id: "F4", section: "1-1", title: "化學計量：係數比 = 莫耳數比", keywords: ["化學計量", "計量", "係數比", "氣體體積比", "莫耳比", "倍比定律", "分子反應圖", "當量", "滴定", "燃燒產物", "質量比例", "連續反應", "電石", "濃度變化", "氣體反應體積", "燃燒反應與空氣"] },
      { id: "F5", section: "1-1", title: "限量試劑與產率", keywords: ["限量試劑", "產率計算", "產率", "剩餘量", "沉澱量"] },
      { id: "F6", section: "1-1", title: "氧化還原與電子守恆", keywords: ["氧化還原", "氧化數", "電子守恆", "氧化劑", "還原劑", "離子鑑定"] },
      { id: "F7", section: "1-2", title: "反應熱 ΔH：吸熱與放熱", keywords: ["反應熱位能圖", "反應熱概念", "反應熱基本性質", "各類反應熱正負值", "位能圖", "能量形式", "熱含量", "物質狀態", "吸熱", "放熱", "反應熱與生活"] },
      { id: "F8", section: "1-2", title: "熱化學方程式：倍數與逆寫", keywords: ["熱化學反應式", "熱化學方程式", "反應熱倍數關係", "倍數", "逆寫"] },
      { id: "F9", section: "1-2", title: "生成熱、燃燒熱與赫斯定律", keywords: ["赫斯定律", "莫耳生成熱", "莫耳燃燒熱", "生成熱", "燃燒熱", "同素異形體", "加成性", "氫化熱", "生質能量", "分解反應途徑"] },
      { id: "F10", section: "1-2", title: "卡計：Q = m·s·ΔT", keywords: ["卡計", "比熱", "溶解熱", "絕熱", "線性外插"] }
    ]
  },
  {
    lessonId: "CHE_H2_Ch2_Gases",
    href: "docs/TeachingMaterials/lessons/CHE_H2_Ch2_Gases.html",
    title: "第2章 氣體・圖解教材",
    subject: "化學",
    materialIds: ["tm_28", "tm_29", "tm_30", "tm_31", "tm_32"],
    source: "課本與講義 第2章（2-1 氣體的性質、2-2 氣體的基本定律、2-3 理想氣體、2-4 氣體的分壓）",
    sections: [
      { id: "2-1", title: "氣體的性質與壓力" },
      { id: "2-2", title: "氣體的基本定律" },
      { id: "2-3", title: "理想氣體" },
      { id: "2-4", title: "氣體的分壓" }
    ],
    cards: [
      { id: "F1", section: "2-1", title: "氣體壓力與單位換算", keywords: ["壓力單位換算", "氣體的通性", "氣體的共同性", "液體壓力", "體積單位換算", "大氣壓", "托里切利", "atm", "mmHg"] },
      { id: "F2", section: "2-1", title: "開口式與閉口式壓力計", keywords: ["壓力計的使用", "壓力計的計算", "開口式壓力計", "閉口式壓力計", "壓力計"] },
      { id: "F3", section: "2-2", title: "波以耳定律：P₁V₁ = P₂V₂", keywords: ["波以耳定律", "波以耳", "汞柱封氣", "J 型管", "U 形管"] },
      { id: "F4", section: "2-2", title: "查理定律：V₁/T₁ = V₂/T₂", keywords: ["查理定律", "查理", "絕對溫度", "絕對零度", "定容下壓力與溫度"] },
      { id: "F5", section: "2-2", title: "亞佛加厥定律與莫耳體積", keywords: ["亞佛加厥定律", "亞佛加厥", "莫耳體積", "氣體體積", "22.4", "STP", "莫耳數增加", "莫耳數"] },
      { id: "F6", section: "2-3", title: "理想氣體方程式 PV = nRT", keywords: ["理想氣體方程式", "PV＝nRT", "PM＝dRT", "PM = dRT", "求分子量", "求密度", "氣體定律綜合", "氣體定律"] },
      { id: "F7", section: "2-3", title: "理想氣體與真實氣體", keywords: ["理想氣體與真實氣體", "理想氣體的性質", "真實氣體", "氣體動力論"] },
      { id: "F8", section: "2-4", title: "道耳頓分壓定律與莫耳分率", keywords: ["道耳頓分壓定律", "分壓定律", "分壓", "莫耳分率", "混合時發生反應", "平均分子量"] },
      { id: "F9", section: "2-4", title: "飽和蒸氣壓與排水集氣", keywords: ["排水集氣法", "排水集氣", "飽和蒸氣壓", "蒸氣壓", "水蒸氣"] }
    ]
  },
  {
    lessonId: "CHE_H2_Ch3_Solutions",
    href: "docs/TeachingMaterials/lessons/CHE_H2_Ch3_Solutions.html",
    title: "第3章 液態與溶液・圖解教材",
    subject: "化學",
    materialIds: ["tm_39"],
    source: "課本 第3章 液態與溶液",
    sections: [
      { id: "3-1", title: "物質的三態與蒸氣壓" },
      { id: "3-2", title: "溶液的性質與依數性質" }
    ],
    cards: [
      { id: "F1", section: "3-1", title: "相變化與熔化熱、汽化熱", keywords: ["物質狀態變化", "狀態變化", "相變化", "熔化熱", "汽化熱", "加熱曲線", "潛熱"] },
      { id: "F2", section: "3-1", title: "飽和蒸氣壓與沸點", keywords: ["飽和蒸氣壓", "沸點較高", "正常沸點", "沸騰", "蒸發", "沸點"] },
      { id: "F3", section: "3-1", title: "相對溼度", keywords: ["相對溼度", "水蒸氣分壓", "溼度"] },
      { id: "F4", section: "3-2", title: "拉午耳定律 P = X·P°", keywords: ["拉午耳", "理想溶液", "莫耳分率", "非揮發性", "溶液的蒸氣壓"] },
      { id: "F5", section: "3-2", title: "依數性質：蒸氣壓下降與沸點上升", keywords: ["依數性質", "沸點上升", "水溶液沸點", "蔗糖", "K_b", "Kb"] },
      { id: "F6", section: "3-2", title: "電解質與凡特何夫因子 i", keywords: ["凡特何夫", "凝固點下降", "凝固點最低", "凝固點", "電解質", "CaCl"] },
      { id: "F7", section: "3-2", title: "亨利定律：氣體的溶解度", keywords: ["亨利定律", "亨利", "氣體溶解度", "溶解度"] },
      { id: "F8", section: "3-2", title: "滲透壓與細胞", keywords: ["滲透壓", "滲透", "紅血球", "高張", "低張", "等張", "半透膜"] }
    ]
  },
  {
    lessonId: "ESC_H2_EarthHistoryAstronomy",
    href: "docs/TeachingMaterials/lessons/ESC_H2_EarthHistoryAstronomy.html",
    title: "地球的歷史與天文・圖解教材",
    subject: "地球科學",
    materialIds: ["tm_17", "tm_55", "tm_60", "tm_68", "tm_69", "tm_70"],
    source: "地球科學 主題 1～11（地球的歷史、恆星與宇宙、天球與四季）",
    sections: [
      { id: "1-2", title: "地球的起源與地質年代" },
      { id: "3-6", title: "恆星、太陽系與宇宙" },
      { id: "7-11", title: "天球、周日運動、周年運動與四季" }
    ],
    cards: [
      { id: "F1", section: "1-2", title: "地球的形成與分層", keywords: ["地球的分層", "地球的形成", "熔融", "密度分異", "地核", "地函", "地殼"] },
      { id: "F2", section: "1-2", title: "大氣三階段演變", keywords: ["大氣的演變", "大氣三階段", "大氣演變", "除碳作用", "帶狀鐵礦", "縞狀鐵礦", "臭氧層與生物上陸", "疊層石", "海洋的形成", "藍綠菌", "火山釋氣", "海洋形成", "生物上陸", "四大圈", "保溫作用"] },
      { id: "F3", section: "1-2", title: "相對地質年代：疊置、截切、包裹體", keywords: ["相對地質年代", "相對年代", "疊置定律", "截切定律", "包裹體定律", "均變說", "地質年代的判定", "不整合", "研究方法", "地質作用"] },
      { id: "F4", section: "1-2", title: "標準化石與地質年代劃分", keywords: ["標準化石", "化石對比", "化石", "生物大滅絕", "大滅絕", "地質年代的劃分", "地質年代表", "冥古", "寒武紀", "古生代", "中生代", "新生代"] },
      { id: "F5", section: "1-2", title: "絕對地質年代：放射性定年與半衰期", keywords: ["半衰期", "放射性定年", "絕對地質年代", "絕對年代", "放射性", "隕石定年", "碳十四", "定年"] },
      { id: "F6", section: "3-6", title: "亮度、光度與星等", keywords: ["星等", "亮度", "光度", "距離模數", "絕對星等", "視星等"] },
      { id: "F7", section: "3-6", title: "恆星的顏色與溫度", keywords: ["恆星顏色", "恆星的顏色", "黑體輻射", "輻射曲線", "表面溫度", "恆星的溫度", "光譜", "太陽演化", "顏色"] },
      { id: "F8", section: "3-6", title: "太陽系：類地行星與類木行星", keywords: ["類地行星", "類木行星", "八大行星", "太陽系", "彗星", "矮行星", "柯伊伯帶", "小行星", "隕石", "流星", "火星", "太陽星雲", "行星"] },
      { id: "F9", section: "3-6", title: "地球防護罩與適居性", keywords: ["地球防護罩", "防護罩", "適居", "極光", "范艾倫", "太陽風", "大氣分層", "磁層", "地磁", "磁場", "大氣的保護", "太陽圈", "太陽黑子"] },
      { id: "F10", section: "3-6", title: "宇宙膨脹與哈伯定律", keywords: ["哈伯定律", "哈伯", "宇宙膨脹", "紅移", "大霹靂", "宇宙微波背景", "宇宙的結構", "銀河系", "星系", "都卜勒", "宇宙", "光年", "天文距離", "天文單位", "秒差距"] },
      { id: "F11", section: "7-11", title: "周日運動：北極星仰角與拱極星", keywords: ["北極星", "周日運動", "拱極星", "不同緯度的星空", "緯度", "仰角"] },
      { id: "F12", section: "7-11", title: "周年運動：恆星日與太陽日", keywords: ["恆星日", "周年運動", "太陽日", "季節星座", "黃道", "天球", "星座", "天赤道", "日食", "月食", "自轉"] },
      { id: "F13", section: "7-11", title: "四季成因與正午太陽仰角", keywords: ["四季", "正午太陽仰角", "太陽仰角", "太陽直射", "晝夜長短", "晝長", "極圈", "太陽軌跡", "黃赤交角", "夏至", "冬至", "春分", "秋分", "回歸線", "季節", "時區", "日落", "日出", "緯度與太陽仰角"] },
      { id: "F14", section: "7-11", title: "多波段觀測與大氣窗口", keywords: ["多波段觀測", "多波段", "大氣窗口", "太空望遠鏡", "望遠鏡", "觀測的限制", "電磁波", "波段", "無線電", "大氣散射"] }
    ]
  }
];
