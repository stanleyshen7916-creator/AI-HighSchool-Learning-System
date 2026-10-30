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
    materialIds: ["tm_7", "tm_50", "tm_57", "tm_77", "tm_80"],
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
    materialIds: ["tm_12", "tm_13", "tm_26", "tm_75"],
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
    materialIds: ["tm_28", "tm_29", "tm_30", "tm_31", "tm_32", "tm_76"],
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
    materialIds: ["tm_17", "tm_55", "tm_60", "tm_68", "tm_69", "tm_70", "tm_82"],
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
  },
  {
    lessonId: "ESC_H2_Unit3_Geology",
    href: "docs/TeachingMaterials/lessons/ESC_H2_Unit3_Geology.html",
    title: "單元3 地質・圖解教材",
    subject: "地球科學",
    materialIds: ["tm_84"],
    source: "課本 單元3 地質（主題12 固體地球的結構、主題13 板塊運動、主題14 臺灣的板塊構造，p.73～102）",
    sections: [
      { id: "12", title: "固體地球的結構" },
      { id: "13", title: "板塊運動" },
      { id: "14", title: "臺灣的板塊構造" }
    ],
    cards: [
      { id: "F1", section: "12", title: "地震波：P 波與 S 波", keywords: ["P波與S波", "P波陰影帶", "陰影帶", "地震波的性質", "縱波", "橫波", "初達波", "次達波"] },
      { id: "F2", section: "12", title: "地球內部分層與不連續面", keywords: ["地球內部分層", "不連續面", "莫氏", "古氏", "雷曼", "地震波速度", "分層", "外核", "內核"] },
      { id: "F3", section: "12", title: "岩石圈、軟流圈與大陸／海洋地殼", keywords: ["大陸與海洋地殼", "地球內部組成", "岩石圈", "軟流圈", "捕獲岩", "地殼"] },
      { id: "F4", section: "13", title: "從大陸漂移到海底擴張", keywords: ["大陸漂移", "海底擴張", "地磁倒轉", "韋格納", "海斯"] },
      { id: "F5", section: "13", title: "張裂型板塊邊界：中洋脊與裂谷", keywords: ["張裂型", "板塊構造學說", "中洋脊", "裂谷", "岩石循環", "三種板塊邊界"] },
      { id: "F6", section: "13", title: "聚合型板塊邊界：隱沒與碰撞", keywords: ["聚合型", "隱沒帶", "海溝", "火山島弧", "班尼奧夫", "環太平洋", "地震分布", "造山"] },
      { id: "F7", section: "13", title: "錯動型板塊邊界：轉形斷層", keywords: ["錯動型", "轉形斷層"] },
      { id: "F8", section: "13", title: "判斷斷層類型", keywords: ["斷層類型", "正斷層", "逆斷層", "平移斷層", "右移", "左移"] },
      { id: "F9", section: "13", title: "熱點與板塊移動方向", keywords: ["熱點", "夏威夷"] },
      { id: "F10", section: "14", title: "臺灣的雙向隱沒", keywords: ["臺灣的板塊位置", "臺灣的雙向隱沒", "臺灣的地殼變形", "臺灣的地質綜合", "菲律賓海板塊", "花東縱谷", "琉球", "呂宋"] },
      { id: "F11", section: "14", title: "臺灣的地質分區與岩石", keywords: ["臺灣的火成岩", "臺灣的岩石", "臺灣的地質分區", "臺灣的造山", "臺灣造山帶", "隆起與侵蝕", "中央山脈", "海岸山脈", "澎湖"] }
    ]
  },
  {
    lessonId: "BIO_H2_CellOriginPlants",
    href: "docs/TeachingMaterials/lessons/BIO_H2_CellOriginPlants.html",
    title: "細胞膜運輸・生命起源・植物體・圖解教材",
    subject: "生物",
    materialIds: ["tm_5", "tm_20", "tm_54", "tm_56", "tm_81", "biology-g11-origin-and-evolution-of-life", "biology-g11-ch1-handout-review"],
    source: "生物 細胞膜與物質運輸、第1章 生物的起源與演化、第2章 植物體的形態、構造與功能",
    sections: [
      { id: "0", title: "細胞膜構造與物質運輸" },
      { id: "1", title: "第1章 生物的起源與演化" },
      { id: "2", title: "第2章 植物體的形態、構造與功能" }
    ],
    cards: [
      { id: "F1", section: "0", title: "細胞膜與小分子的運輸", keywords: ["細胞膜的基本構造", "細胞膜的構造", "細胞膜", "物質通過細胞膜", "運輸方式", "是否耗能", "促進性擴散", "主動運輸", "被動運輸", "簡單擴散", "磷脂", "膜蛋白"] },
      { id: "F2", section: "0", title: "大分子的運輸：胞吞與胞吐", keywords: ["胞吞", "胞吐", "大分子的運輸", "受體媒介", "囊泡"] },
      { id: "F3", section: "0", title: "水分子的極性與氫鍵", keywords: ["水分子的特性", "水分子", "氫鍵", "極性", "比熱"] },
      { id: "F4", section: "0", title: "滲透作用與滲透壓", keywords: ["滲透壓", "滲透作用", "淨移動方向", "半透膜"] },
      { id: "F5", section: "0", title: "等張、高張、低張：動物細胞與植物細胞", keywords: ["等張", "高張", "低張", "膨壓", "質壁分離", "細胞形狀", "保護作用", "細胞壁對細胞", "紅血球", "溶血"] },
      { id: "F6", section: "1", title: "生源說與非生源說：巴斯德鵝頸瓶", keywords: ["生源說", "非生源說", "巴斯德", "鵝頸瓶", "加熱的目的", "約伯勒", "斯巴蘭贊尼", "尼丹", "亞里斯多德", "乾草浸液", "自然發生"] },
      { id: "F7", section: "1", title: "雷迪實驗與操作變因", keywords: ["雷迪", "操作變因", "紗布", "對照組"] },
      { id: "F8", section: "1", title: "原始湯與尤里－米勒實驗", keywords: ["尤里與米勒", "米勒", "原始湯", "原始大氣", "原始地球", "卡爾文", "最初生物", "有機演化的實驗", "歐帕林"] },
      { id: "F9", section: "1", title: "有機演化四階段與 RNA", keywords: ["有機演化", "RNA", "福克斯", "原始細胞", "微脂體", "核糖酵素", "四個階段", "遺傳物質"] },
      { id: "F10", section: "1", title: "內共生假說：粒線體與葉綠體", keywords: ["內共生", "真核細胞的形成", "半自主", "粒線體", "葉綠體", "瑪格莉斯"] },
      { id: "F11", section: "1", title: "生命型式的演化", keywords: ["生命型式", "營養方式的演化", "呼吸作用的演化", "氧氣出現", "細胞數目的演化", "異營", "自營", "多細胞", "厭氧"] },
      { id: "F12", section: "2", title: "植物細胞：薄壁、厚角、厚壁", keywords: ["薄壁細胞", "厚角細胞", "厚壁細胞", "石細胞", "纖維細胞", "初生與次生細胞壁", "細胞壁", "植物細胞", "壁孔", "木質素", "果膠"] },
      { id: "F13", section: "2", title: "分生組織與根尖的分區", keywords: ["分生組織", "根尖", "生長點", "根毛", "植物組織", "組織系統", "表皮組織", "基本組織", "初生組織與次生組織", "植物的體制", "營養器官", "根系", "植物的演化", "植物的分類"] },
      { id: "F14", section: "2", title: "根的橫切面", keywords: ["根的構造", "內皮", "側根", "周鞘", "卡氏帶", "根莖構造的比較", "變態根", "皮層"] },
      { id: "F15", section: "2", title: "莖的橫切面：雙子葉與單子葉", keywords: ["雙子葉植物莖", "單子葉植物莖", "維管束的排列", "莖的構造", "髓", "髓腔", "單子葉與雙子葉", "莖的外部形態", "變態莖", "維管束形成層"] },
      { id: "F16", section: "2", title: "木本莖：年輪、心材與樹皮", keywords: ["年輪", "心材", "邊材", "樹皮", "木栓形成層", "木栓層", "木質莖", "形成層", "皮孔", "早材", "晚材"] },
      { id: "F17", section: "2", title: "維管束：木質部與韌皮部", keywords: ["維管束", "導管", "管胞", "篩管", "伴細胞", "木質部", "韌皮部", "運輸管道"] },
      { id: "F18", section: "2", title: "葉的構造", keywords: ["葉的構造", "葉脈", "葉肉", "氣孔", "葉序", "葉柄", "托葉", "葉的外部形態", "葉的形態", "水生植物", "陸生", "植物形態與環境", "陸地與水域環境", "柵狀組織", "海綿組織"] }
    ]
  },
  {
    lessonId: "CIV_H2_Ch1_2_Economics",
    href: "docs/TeachingMaterials/lessons/CIV_H2_Ch1_2_Economics.html",
    title: "社會資源的分配・需求與供給・圖解教材",
    subject: "公民與社會",
    materialIds: ["tm_8", "tm_22", "tm_58", "tm_9", "tm_23", "tm_59"],
    source: "公民與社會 第1章 社會資源的分配、第2章 需求與供給",
    sections: [
      { id: "1", title: "第1章 社會資源的分配" },
      { id: "2", title: "第2章 需求與供給" }
    ],
    cards: [
      { id: "F1", section: "1", title: "稀少性與機會成本", keywords: ["機會成本", "稀少性", "外顯成本", "隱藏成本", "多種用途", "取捨"] },
      { id: "F2", section: "1", title: "會計利潤與經濟利潤", keywords: ["會計利潤", "經濟利潤", "利潤"] },
      { id: "F3", section: "1", title: "誘因的四個象限", keywords: ["誘因", "金錢正向", "金錢負向", "非金錢", "看不見的手", "市場機能"] },
      { id: "F4", section: "1", title: "生產可能曲線（PPC）", keywords: ["PPC", "生產可能曲線", "凹向原點", "線上點", "線內", "機會成本遞增"] },
      { id: "F5", section: "1", title: "絕對利益與比較利益", keywords: ["絕對利益", "比較利益", "專業分工", "分工", "雙產品雙廠商"] },
      { id: "F6", section: "1", title: "成本效益分析：淨效益", keywords: ["成本效益", "淨效益", "總效益"] },
      { id: "F7", section: "1", title: "政府的資源分配與累進稅率", keywords: ["累進稅率", "累進", "政治考量", "環境永續", "公平正義", "經濟效率", "光電", "效率vs永續", "政府資源分配", "遺產稅"] },
      { id: "F8", section: "2", title: "市場與經濟循環", keywords: ["市場定義", "市場", "經濟循環", "產品市場", "生產要素市場", "有形市場", "無形市場"] },
      { id: "F9", section: "2", title: "願付價格、需求法則與市場需求量", keywords: ["願付價格", "需求法則", "市場需求量", "需求量加總"] },
      { id: "F10", section: "2", title: "需求量變動與需求變動", keywords: ["需求變動", "正常財", "劣等財", "消費者偏好", "預期未來", "替代品", "互補品", "需求"] },
      { id: "F11", section: "2", title: "願售價格、供給法則與市場供給量", keywords: ["願售價格", "願售價格與機會成本", "供給法則", "市場供給量", "供給量加總"] },
      { id: "F12", section: "2", title: "供給量變動與供給變動", keywords: ["供給變動", "原料成本", "生產上替代品", "生產上互補品", "生產上的", "生產替代", "供給面", "禽流感", "飼料", "供給"] },
      { id: "F13", section: "2", title: "消費者保護：七日猶豫期與定型化契約", keywords: ["七日猶豫期", "猶豫期", "定型化契約", "審閱期", "平等互惠", "瑕疵擔保", "特種交易", "通訊交易", "訪問交易", "消費者保護"] }
    ]
  },
  {
    lessonId: "GEO_H2_Ch4_Europe",
    href: "docs/TeachingMaterials/lessons/GEO_H2_Ch4_Europe.html",
    title: "第4章 歐洲文明的發展與擴散・圖解教材",
    subject: "地理",
    materialIds: ["tm_87"],
    source: "課本 第4章 歐洲文明的發展與擴散（第一節 自然環境、第二節 歐洲文明與經濟發展、第三節 歐盟的區域競爭與合作、問題探究，p.86～109）",
    sections: [
      { id: "1", title: "自然環境" },
      { id: "2", title: "歐洲文明與經濟發展" },
      { id: "3", title: "歐盟的區域競爭與合作" },
      { id: "4", title: "問題探究：西方文化圈的形成與特色" }
    ],
    cards: [
      { id: "F1", section: "1", title: "半島、谷灣與峽灣：一個離海很近的洲", keywords: ["半島深入海洋", "海岸線曲折多港灣", "維京人"] },
      { id: "F2", section: "1", title: "北大西洋暖流與冬溫正偏差", keywords: ["氣候溫和溼潤", "冬溫正偏差"] },
      { id: "F3", section: "1", title: "歐洲的氣候類型：6 個城市的氣候圖", keywords: ["歐洲氣候類型"] },
      { id: "F4", section: "2", title: "文明核心的移動：地中海 → 西歐 → 全世界", keywords: ["歐洲文明的起源與擴散", "地中海——歐洲文明的搖籃", "文明核心轉移至大西洋沿岸", "地理大發現與文化擴散", "西方文化圈"] },
      { id: "F5", section: "2", title: "哥倫布大交換：餐桌上的世界史", keywords: ["哥倫布大交換"] },
      { id: "F6", section: "2", title: "工業革命：從英國的煤和鐵開始", keywords: ["工業革命", "工業革命的影響", "工業革命對全球貿易的影響", "日不落國"] },
      { id: "F7", section: "3", title: "歐盟的發展：從煤鋼共同體到英國脫歐", keywords: ["歐盟的緣起與發展", "歐盟統合原則", "歐洲結盟歷程", "英國脫歐"] },
      { id: "F8", section: "3", title: "歐盟、申根、歐元：三個圈圈不一樣", keywords: ["申根公約", "馬斯垂克條約"] },
      { id: "F9", section: "3", title: "結盟的好處與麻煩，以及核心與邊陲", keywords: ["經濟實力增強", "產業合作分工", "形成保護政策", "歐盟內部矛盾", "均衡區域發展", "邊界合作區"] },
      { id: "F10", section: "4", title: "疾病、聖地牙哥與葡萄酒：西方文化怎麼移植", keywords: ["觀察航海路線看西方文化擴散", "疾病對新大陸的影響", "西方文化與生活"] }
    ]
  },
  {
    lessonId: "HIS_H2_Ch3_Islam",
    href: "docs/TeachingMaterials/lessons/HIS_H2_Ch3_Islam.html",
    title: "第3章 伊斯蘭與世界・圖解教材",
    subject: "歷史",
    materialIds: ["tm_85"],
    source: "課本 第3章 伊斯蘭與世界（第1節 伊斯蘭文化的發展與擴張、第2節 伊斯蘭世界與西方的互動，p.72～93）",
    sections: [
      { id: "1", title: "伊斯蘭文化的發展與擴張" },
      { id: "2", title: "伊斯蘭世界與西方的互動" }
    ],
    cards: [
      { id: "F1", section: "1", title: "伊斯蘭教的建立：從麥加到麥地那", keywords: ["耶路撒冷", "三教共同聖地", "宗教寬容", "建立背景", "麥加", "麥地那", "穆罕默德"] },
      { id: "F2", section: "1", title: "教義與五功", keywords: ["教義", "古蘭經", "五功"] },
      { id: "F3", section: "1", title: "擴張與王朝更迭：正統哈里發、奧米雅、阿拔斯", keywords: ["正統哈里發", "奧米雅王朝", "阿拔斯王朝", "哈里發"] },
      { id: "F4", section: "1", title: "什葉派、遜尼派與「一分為三」", keywords: ["什葉派與遜尼派", "一分為三", "法提馬王朝", "什葉派", "遜尼派"] },
      { id: "F5", section: "1", title: "伊斯蘭文明：科學、藝術與文學", keywords: ["伊斯蘭科學", "伊斯蘭藝術", "伊斯蘭文學", "海什木", "一千零一夜"] },
      { id: "F6", section: "1", title: "東西交流的橋梁：傳入中國、東南亞，傳出到歐洲", keywords: ["傳入中國", "傳入東南亞", "交流的橋梁", "智慧宮", "翻譯運動", "花剌子密"] },
      { id: "F7", section: "2", title: "十字軍運動（1095～1291）", keywords: ["十字軍運動", "十字軍的影響", "十字軍", "烏爾班二世", "塞爾柱"] },
      { id: "F8", section: "2", title: "蒙古西征與帖木兒", keywords: ["蒙古西征", "帖木兒", "汗國"] },
      { id: "F9", section: "2", title: "三大火藥帝國：鄂圖曼、薩法維、蒙兀兒", keywords: ["三大火藥帝國", "火藥帝國", "鄂圖曼帝國", "薩法維帝國", "蒙兀兒帝國", "蒙兀兒文化", "泰姬瑪哈陵"] },
      { id: "F10", section: "2", title: "鄂圖曼帝國與西方：從恐懼到輕視", keywords: ["鄂圖曼帝國與西方", "歐洲人的心態", "閱讀探究"] }
    ]
  },
  {
    lessonId: "HIS_H2_Ch4_West",
    href: "docs/TeachingMaterials/lessons/HIS_H2_Ch4_West.html",
    title: "第4章 西方與世界・圖解教材",
    subject: "歷史",
    materialIds: ["tm_86"],
    source: "課本 第4章 西方與世界（第1節 近代歐洲的擴張、第2節 兩次世界大戰、第3節 政治運動與反殖民運動興起，p.94～131）",
    sections: [
      { id: "1", title: "近代歐洲的擴張" },
      { id: "2", title: "兩次世界大戰" },
      { id: "3", title: "政治運動與反殖民運動興起" }
    ],
    cards: [
      { id: "F1", section: "1", title: "大航海時代：為什麼出海、怎麼走", keywords: ["大航海時代的動機", "開拓新航路", "新航路"] },
      { id: "F2", section: "1", title: "美洲殖民與三角貿易", keywords: ["三角貿易", "中南美洲的殖民統治", "北美的競逐", "巴西甘蔗園"] },
      { id: "F3", section: "1", title: "殖民社會階級與中南美洲獨立", keywords: ["中南美洲的獨立運動", "門羅主義"] },
      { id: "F4", section: "1", title: "新帝國主義與瓜分非洲", keywords: ["新帝國主義", "非洲大獵", "瓜分非洲", "經濟及軍事入侵非洲", "英國統治印度", "東南亞的殖民", "歐洲文化對其他地區的影響"] },
      { id: "F5", section: "2", title: "第一次世界大戰：結盟、火藥庫與導火線", keywords: ["巴爾幹半島", "三國同盟與三國協約", "大戰爆發", "美國參戰", "一次大戰經過"] },
      { id: "F6", section: "2", title: "戰後秩序與戰間期：國聯、大恐慌、極權崛起", keywords: ["巴黎和會", "十四點原則", "戰後和約", "國際聯盟", "蘇聯共產政權", "經濟大恐慌", "美國孤立主義", "法西斯主義"] },
      { id: "F7", section: "2", title: "第二次世界大戰與戰爭的反思", keywords: ["義德的擴張", "二次大戰過程", "總體戰與聯合國", "戰爭對歐洲文明的衝擊", "反戰運動"] },
      { id: "F8", section: "3", title: "勞工與女性：爭取政治權利", keywords: ["勞工與政治運動", "女性爭取參政權"] },
      { id: "F9", section: "3", title: "反殖民運動：亞洲、非洲與中南美洲", keywords: ["民族自決", "反殖民運動", "亞洲的獨立之路", "非洲的獨立浪潮", "中南美洲的經濟獨立", "基督教傳教與帝國主義", "殖民地文化的變遷"] },
      { id: "F10", section: "1", title: "文明相遇的雙向傳播：咖啡、馬鈴薯、紅茶", keywords: ["全球貿易下的文化交流"] }
    ]
  },
  {
    lessonId: "HIS_H2_EuropeEastAsia",
    href: "docs/TeachingMaterials/lessons/HIS_H2_EuropeEastAsia.html",
    title: "歐洲文化・自由與民主・東亞戰爭與冷戰・圖解教材",
    subject: "歷史",
    materialIds: ["tm_6", "tm_14", "tm_19", "tm_40", "tm_15", "tm_24", "tm_41", "tm_16", "tm_25", "tm_42", "tm_63"],
    source: "歷史 序篇、第1章 歐洲文化與基督教傳統、第2章 歐洲自由與民主的發展、第一課 東亞的戰爭與冷戰",
    sections: [
      { id: "1", title: "序篇與第1章 歐洲文化與基督教傳統" },
      { id: "2", title: "第2章 歐洲自由與民主的發展" },
      { id: "3", title: "第一課 東亞的戰爭與冷戰" }
    ],
    cards: [
      { id: "F1", section: "1", title: "單元脈絡：從古希臘到文藝復興", keywords: ["讀歷史", "序篇", "單元整體脈絡", "整體脈絡", "從臺灣走向世界", "時代先後"] },
      { id: "F2", section: "1", title: "希臘城邦與兩場戰爭", keywords: ["希臘文明", "城邦", "波希戰爭", "伯羅奔尼撒", "雅典", "斯巴達", "愛琴文明", "希臘神話", "荷馬"] },
      { id: "F3", section: "1", title: "希臘哲學與希臘化時代", keywords: ["希臘三哲", "蘇格拉底", "柏拉圖", "亞里斯多德", "希臘化", "亞歷山卓", "斯多噶", "伊比鳩魯", "理型論", "詰問法", "哲學"] },
      { id: "F4", section: "1", title: "羅馬政治三階段與羅馬法", keywords: ["羅馬法", "羅馬政治", "十二表法", "萬民法", "公民法", "自然法", "查士丁尼", "共和", "屋大維", "羅馬"] },
      { id: "F5", section: "1", title: "基督教的興起：313、392、476", keywords: ["希伯來", "早期基督教", "基督教成為國教", "米蘭詔令", "保羅", "耶穌", "教會組織", "基督教"] },
      { id: "F6", section: "1", title: "中古西歐的封建與莊園", keywords: ["封建", "莊園", "農奴", "附庸", "領主"] },
      { id: "F7", section: "1", title: "中古的政教關係：合作到衝突", keywords: ["政教合作", "政教衝突", "查理曼", "丕平", "授職之爭", "亞維儂", "神聖羅馬帝國", "教會的社會政治角色"] },
      { id: "F8", section: "1", title: "兩次教會分裂與拜占庭", keywords: ["東西教會分裂", "教會分裂", "大分裂", "拜占庭", "聖像破壞", "東正教", "政教合一"] },
      { id: "F9", section: "1", title: "十字軍、經院哲學與人文主義", keywords: ["經院哲學", "人文主義", "十字軍", "阿奎那", "學術復甦", "修道院"] },
      { id: "F10", section: "1", title: "文藝復興：人物、作品與線性透視", keywords: ["文藝復興的定義", "文藝復興人物", "藝術技法", "透視", "人物著作配對", "代表人物", "達文西", "米開朗基羅", "拉斐爾", "但丁", "佩脫拉克", "薄伽丘", "馬基維利", "文藝復興"] },
      { id: "F11", section: "1", title: "北方文藝復興與活版印刷", keywords: ["北方文藝復興", "義大利與北方", "古騰堡", "活版印刷", "伊拉斯謨斯", "摩爾"] },
      { id: "F12", section: "2", title: "宗教改革與三十年戰爭", keywords: ["宗教改革", "因信稱義", "新教", "路德", "喀爾文", "三十年戰爭", "西發里亞", "贖罪券", "亨利八世", "核心線索"] },
      { id: "F13", section: "2", title: "科學革命：從地心說到日心說", keywords: ["科學革命", "哥白尼", "地心說", "日心說", "科學方法", "歸納法", "演繹法", "伽利略", "克卜勒", "牛頓", "培根", "笛卡兒"] },
      { id: "F14", section: "2", title: "英國君主立憲與啟蒙思想", keywords: ["啟蒙運動", "君主立憲", "洛克", "孟德斯鳩", "盧梭", "光榮革命", "權利法案", "大憲章", "三權分立"] },
      { id: "F15", section: "2", title: "美國獨立與法國大革命", keywords: ["美國獨立", "法國大革命", "吉倫特", "雅各賓", "恐怖統治", "獨立宣言", "拿破崙", "國家體制"] },
      { id: "F16", section: "2", title: "保守與自由、民族主義與統一", keywords: ["保守與自由", "維也納會議", "1830", "1848", "民族主義", "義大利統一", "德意志統一", "俾斯麥", "加富爾"] },
      { id: "F17", section: "2", title: "工業革命、社會主義與英國選舉權", keywords: ["工業革命", "自由經濟", "穀物法", "功利主義", "社會主義", "工人運動", "選舉權", "馬克思", "烏托邦"] },
      { id: "F18", section: "3", title: "日本擴張：從九一八到太平洋戰爭", keywords: ["盧溝橋", "九一八", "一二八", "淞滬", "重慶", "維琪", "法屬越南", "禁運", "珍珠港", "太平洋戰爭", "跳島", "花園口", "三光", "南京", "進軍東南亞", "太平洋戰場", "制海權"] },
      { id: "F19", section: "3", title: "戰時體制：臺灣與朝鮮的皇民化", keywords: ["皇民化", "創氏改名", "內鮮一體", "國家總動員法", "臺灣特設勤勞團", "招募臺人", "已移居南洋的臺灣人", "勤勞團", "南洋", "東京審判", "甲級戰犯", "慰安婦", "金學順"] },
      { id: "F20", section: "3", title: "戰後中國：國共內戰到改革開放", keywords: ["西安", "剿共", "馬歇爾", "國共", "決定性戰役", "三面紅旗", "反右", "四個堅持", "天安門", "南巡", "改革開放"] },
      { id: "F21", section: "3", title: "冷戰下的東亞：中、美、蘇三角", keywords: ["中蘇", "珍寶島", "烏蘇里江", "赫魯雪夫", "修正主義", "尼克森", "乒乓外交", "上海公報", "韓戰", "抗美援朝", "和平共處", "萬隆", "東約", "東南亞公約", "紅色高棉", "柬埔寨"] }
    ]
  },
  {
    lessonId: "CHI_H2_S1",
    href: "docs/TeachingMaterials/lessons/CHI_H2_S1.html",
    title: "高二國文・圖解教材",
    subject: "國文",
    materialIds: ["tm_62", "tm_64", "tm_65", "tm_66", "tm_67", "tm_74", "chinese-g11-laoshan-daoshi", "chinese-g11-inventions-changed-world", "chinese-g11-jinti-shixuan", "tm_78", "tm_83"],
    source: "國文 〈勞山道士〉〈發明為需求之母〉〈近體詩選〉〈狼之獨步〉〈雁〉〈劉姥姥〉〈玉山去來〉〈燭之武退秦師〉",
    /* 正心版的教材包一包就是一課：題目沒提到關鍵詞時，直接對應該課的卡片 */
    materialCards: { tm_64: "F10", tm_65: "F10", tm_74: "F11", tm_67: "F12", tm_66: "F13" },
    sections: [
      { id: "1", title: "第一課 蒲松齡〈勞山道士〉" },
      { id: "2", title: "第二課 賈德．戴蒙〈發明為需求之母〉" },
      { id: "3", title: "第三課 近體詩選" },
      { id: "4", title: "〈狼之獨步〉〈雁〉、〈劉姥姥〉、〈玉山去來〉、〈燭之武退秦師〉" }
    ],
    cards: [
      { id: "F1", section: "1", title: "作者、出處與「異史氏曰」", keywords: ["蒲松齡", "聊齋志異", "聊齋", "異史氏", "勞山", "題解", "留仙", "柳泉"] },
      { id: "F2", section: "1", title: "王生的心情曲線", keywords: ["王生", "情節理解", "法術", "壺酒", "穿牆", "道士"] },
      { id: "F3", section: "1", title: "字詞解碼：課文關鍵詞", keywords: ["字詞", "素髮垂領", "叩而與語", "作苦", "稽首", "重繭", "光鑑毫芒", "環聽奔走", "競飲先釂", "乃爾寂飲", "霓裳", "廣寒", "一字多義", "通同字", "勿誤樵蘇", "忻慕", "逡巡", "資斧", "自詡", "墳起", "揶揄", "疢毒", "吮癰", "紿"] },
      { id: "F4", section: "2", title: "論證結構：先有發明，再找用途", keywords: ["發明為需求之母", "發明", "篇旨", "比喻", "正反例證", "曼哈頓", "雅典娜", "論證"] },
      { id: "F5", section: "2", title: "作者與「人類大歷史三部曲」", keywords: ["賈德", "戴蒙", "人類大歷史", "三部曲", "槍炮", "大崩壞", "昨日世界", "新幾內亞"] },
      { id: "F6", section: "3", title: "近體詩格律：句數、押韻、對仗", keywords: ["格律", "押韻", "對仗", "體裁", "律詩", "絕句", "近體詩", "綜合比較"] },
      { id: "F7", section: "3", title: "〈旅夜書懷〉：大景與小我", keywords: ["旅夜書懷", "杜甫", "詩聖", "沙鷗"] },
      { id: "F8", section: "3", title: "〈夜雨寄北〉：重複與時空交錯", keywords: ["夜雨寄北", "李商隱", "巴山夜雨", "何當", "章法", "重複"] },
      { id: "F9", section: "3", title: "〈寄黃幾復〉：用典", keywords: ["寄黃幾復", "黃庭堅", "用典", "典故", "江西詩派", "山谷", "四立壁", "三折肱"] },
      { id: "F14", section: "3", title: "名詞並列與唐宋詩之別", keywords: ["名詞並列", "名詞詞組", "列錦", "唐詩與宋詩", "宋詩的特色", "宋代詩人"] },
      { id: "F10", section: "4", title: "〈狼之獨步〉與〈雁〉：動物意象比較", keywords: ["狼之獨步", "狼", "長嗥", "紀弦", "白萩", "雁", "地平線", "雲翳", "戰慄", "獨來獨往", "搖撼", "虛無", "現代派", "笠詩社", "兩首詩", "意象", "修辭辨識", "詞語解釋", "主旨推論", "比較閱讀", "文意判讀", "核心概念", "短答題"] },
      { id: "F11", section: "4", title: "〈劉姥姥〉：人物關係與性格", keywords: ["劉姥姥", "紅樓夢", "石頭記", "榮國府", "鳳姐", "王熙鳳", "鴛鴦", "李紈", "賈母", "黛玉", "瀟湘館", "大觀園", "薛寶釵", "薛姨媽", "篾片", "豐兒"] },
      { id: "F12", section: "4", title: "〈玉山去來〉：時間為經、見聞為緯", keywords: ["玉山", "永遠的山", "陳列", "登山", "冷杉", "森林界線", "風口", "雲", "山脈", "氤氳", "情景交融", "無痕山林", "LNT", "高山", "日出", "隊伍", "山峰", "山名"] },
      { id: "F13", section: "4", title: "〈燭之武退秦師〉：一張地圖說服秦伯", keywords: ["燭之武", "秦伯", "秦穆公", "晉文公", "晉侯", "鄭文公", "佚之狐", "左傳", "春秋", "越國以鄙遠", "東道主", "行李", "闕秦", "子犯", "晉君", "鄭"] }
    ]
  },
  {
    lessonId: "ENG_H2_S1",
    href: "docs/TeachingMaterials/lessons/ENG_H2_S1.html",
    title: "高二英文・圖解教材",
    subject: "英文",
    materialIds: ["tm_61", "tm_51", "tm_49", "tm_48", "tm_72", "english-g11-day-i-broke-the-rules", "tm_79"],
    source: "英文 Lesson 1 The Day I Broke the Rules、L3 Prometheus、R1 3D Printing、單字練習",
    /* 一包一課：題目沒提到關鍵詞時，對應該課的卡片 */
    materialCards: { tm_51: "F1", tm_61: "F1", "english-g11-day-i-broke-the-rules": "F1", tm_49: "F5", tm_48: "F7", tm_72: "F8", tm_79: "F9" },
    sections: [
      { id: "1", title: "Lesson 1 The Day I Broke the Rules" },
      { id: "2", title: "L3 Prometheus" },
      { id: "3", title: "R1 3D Printing" },
      { id: "4", title: "單字練習：一字多義與搭配詞" },
      { id: "5", title: "段考文法：綜合測驗常考句型" }
    ],
    cards: [
      { id: "F1", section: "1", title: "故事地圖：規則、衝突、選擇", keywords: ["文章主旨", "人物性格", "言外之意", "細節理解", "推論", "人物情緒", "課文出處", "Billy", "Ronald", "narrator", "hospital", "rule", "hug", "Santa", "germs", "passage"] },
      { id: "F2", section: "1", title: "句型：find / consider + it + adj. + to VR", keywords: ["find/consider", "虛受詞", "consider it", "find it", "feel it", "think it", "Combine the sentences"] },
      { id: "F3", section: "1", title: "句型：It seems that… ↔ S seems to V", keywords: ["It seems", "It appears", "seems to", "appears to", "seem"] },
      { id: "F4", section: "1", title: "字群與片語：一次記一整串", keywords: ["字彙", "片語", "反義片語", "詞性辨識", "OPPOSITE", "employ", "terminal", "tremendous", "frighten", "contact", "warmth", "prompt", "confine", "sparkle", "stretch", "refus", "hesitat", "drowsy", "frail", "pass away", "make a difference", "after all", "cheer", "turn down", "be about to", "聽力策略"] },
      { id: "F5", section: "2", title: "故事弧線：從禮物分配到盜火", keywords: ["Prometheus", "Epimetheus", "Zeus", "Mecone", "clay", "fire", "gifts", "offerings", "upright", "humankind"] },
      { id: "F6", section: "2", title: "時間軸：by the time ＋ 過去完成式", keywords: ["By the time", "by the time", "had run", "Angry about", "so that", "expanded"] },
      { id: "F7", section: "3", title: "積層製造：一層一層長出來", keywords: ["3D", "printing", "printed", "capable of", "enable", "make use of", "bionic", "prosthetic", "coral"] },
      { id: "F8", section: "4", title: "一字多義、搭配詞與同反義", keywords: ["award", "rough", "process", "vision", "comfort", "communicate", "aware", "run the risk", "burst", "cave in", "vanish", "temporary", "county"] },
      { id: "F9", section: "5", title: "段考文法：代名詞、介系詞與分詞構句", keywords: ["段考文法", "綜合測驗", "the other", "with + N + left", "despite", "not … until", "make + O + adj.", "keep + V-ing", "否定句 either"] },
    ]
  }
];
