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
  }
];
