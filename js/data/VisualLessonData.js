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
      { id: "F1", section: "1-1", title: "弧度（弳）的定義", keywords: ["弧度的定義", "弳的定義", "弧長公式", "由弧長與半徑求圓心角", "弧度與角度的區別", "弧度與象限", "弧長", "弧度", "弳"] },
      { id: "F2", section: "1-1", title: "扇形面積", keywords: ["扇形面積", "弓形面積", "扇形周長", "扇形"] },
      { id: "F3", section: "1-1", title: "度與弳的換算", keywords: ["度與弧度的換算", "弧度轉度數", "度數轉弧度", "化為弧度", "化為度", "同界角", "換算"] },
      { id: "F4", section: "1-1", title: "圓錐展開成扇形", keywords: ["圓錐", "展開", "攤平", "最短路徑", "斜高", "母線"] },
      { id: "F5", section: "1-2", title: "正弦函數 y = sin x", keywords: ["正弦函數", "正弦函數的值域", "正弦函數的週期", "三角方程式", "sin x 的圖形", "sinx", "單位圓", "對稱軸", "對稱中心"] },
      { id: "F6", section: "1-2", title: "餘弦函數 y = cos x", keywords: ["餘弦函數", "正弦與餘弦圖形的關係", "三角函數的對稱性", "cosx", "cos x"] },
      { id: "F7", section: "1-2", title: "平移與伸縮 y = a sin(bx − h) + k", keywords: ["一般正弦函數", "平移組合", "圖形的平移", "圖形的伸縮", "平移與伸縮", "由圖形求正弦函數", "由極值求參數", "振幅", "週期", "平移", "伸縮"] },
      { id: "F8", section: "1-2", title: "週期模型：月球亮面比例", keywords: ["週期模型", "週期性現象", "月球", "月相", "摩天輪", "潮汐", "擬合", "情境"] },
      { id: "F9", section: "1-2", title: "正切函數 y = tan x", keywords: ["正切函數", "正切函數的定義域", "正切函數的週期", "正切函數性質", "漸近線", "tanx", "tan x", "正切"] },
      { id: "F10", section: "1-3", title: "和角與差角公式", keywords: ["和角公式", "差角公式", "和差角", "特殊角精確值", "已知函數值求和角值", "sin(α+β)", "cos(α+β)", "和角", "差角"] },
      { id: "F11", section: "1-3", title: "正切差角與兩直線夾角", keywords: ["兩直線夾角", "兩直線的夾角", "夾角", "斜率", "傾斜角"] },
      { id: "F12", section: "1-3", title: "二倍角公式", keywords: ["二倍角", "倍角公式", "倍角", "sin2θ", "cos2θ"] },
      { id: "F13", section: "1-3", title: "半角公式", keywords: ["半角公式", "半角", "θ/2"] },
      { id: "F14", section: "1-4", title: "疊合公式", keywords: ["正餘弦疊合", "疊合公式", "疊合", "表示為(r,α)數對", "求振幅r值", "a sin x + b cos x"] },
      { id: "F15", section: "1-4", title: "疊合求區間最大值、最小值", keywords: ["限定區間求極值", "區間求極值", "限定區間", "區間內的最大值", "區間最大值", "區間最小值"] }
    ]
  }
];
