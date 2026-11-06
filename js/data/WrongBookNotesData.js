/* data/WrongBookNotesData.js — 2026-11-06 知識弱點改版「重點整理」
   使用者需求：把知識弱點的每一道錯題改成「重點整理」——錯題詳解（含針對
   學生所選錯誤選項的說明）＋網路上的相關說明連結，方便複習；複習完成後
   可以刪除。

   以題目的 local question id（wrong_book.local_question_id，例如
   "tm_7_q18"）為 key。每筆筆記由人工／Claude 離線整理後寫入此檔（頁面
   本身不得連網抓資料，見 CLAUDE.md 的 fetch( 禁令），沒有筆記的題目
   照舊只顯示原本的詳解。

   欄位：
     keyPoint   一句話重點（這題真正要會的觀念）
     formulas   要背／要會用的公式（純文字）
     whyWrong   { 選項代號: 為什麼這個選項錯 }——依學生實際選的選項顯示
     steps      逐步詳解
     traps      易錯提醒
     steps      [{ title, lines, note }]：lines 是一行一個算式，以 "= "／"⇒ "
                開頭表示接續上一行（畫面會把關係符號對齊）；算式與 note 用
                AHS.MathText 標記：frac{分子}{分母}、sqrt{…}、^{上標}。
                （舊格式「動作｜結果」字串仍可顯示）
     variants   類題（同觀念、不同數字，給「立即重做」用，避免背答案）：
                [{ question, options:[{key,text}], correctAnswer, steps（同上格式） }]
     references 延伸閱讀 [{ title, source, url, kind }]，kind：講義／影片／互動
     注意：平台會打亂選項的顯示順序（AHS.OptionOrder），所以 whyWrong 的
     key 用題目「原始」選項代號，筆記內文不要寫 (A)(B) 這類選項字母，
     改寫選項內容；畫面上的「你選 X」由元件換成實際顯示的字母。
     basis      【確認】＝可直接驗算或與課本一致；【推論】＝整理者判斷 */
window.AHS = window.AHS || {};

AHS.WrongBookNotesData = {
  "tm_7_q18": {
    keyPoint: "a sin x + b cos x 不能把兩項的最大值直接相加——兩項不會在同一個 x 同時最大；必須先疊合成 r sin(x+α)，最大值是 r＝√(a²+b²)。",
    formulas: [
      "a sin x + b cos x = r sin(x + α)，r = sqrt{a^{2} + b^{2}}",
      "cos α = frac{a}{r}，sin α = frac{b}{r}（用 a、b 的正負決定 α 的象限）",
      "最大值 r：x + α = frac{π}{2} + 2kπ；最小值 −r：x + α = frac{3π}{2} + 2kπ"
    ],
    whyWrong: {
      C: "把 sin x 的最大值 1 和 √3 cos x 的最大值 √3 直接相加得 √3+1。但 sin x＝1 時 x＝π/2，此時 cos x＝0，兩項不可能同時最大；代 x＝π/6 驗算：sin(π/6)＋√3 cos(π/6)＝1/2＋3/2＝2，不是 √3+1。",
      B: "x＝π/3 是疊合角 α，不是取到最大值的 x。最大值發生在 x＋α＝π/2，要再解一次才是 x＝π/6。",
      D: "x＝2π/3 代入：sin(2π/3)＋√3 cos(2π/3)＝√3/2 − √3/2＝0，不是最大值。"
    },
    steps: [
      { title: "找出 a、b，算 r", lines: [
        "a = 1，b = sqrt{3}",
        "r = sqrt{a^{2} + b^{2}}",
        "= sqrt{1^{2} + (sqrt{3})^{2}}",
        "= sqrt{4} = 2"
      ] },
      { title: "提出 r，疊合成一個 sin", lines: [
        "y = sin x + sqrt{3} cos x",
        "= 2 ( frac{1}{2} sin x + frac{sqrt{3}}{2} cos x )",
        "= 2 ( sin x cos frac{π}{3} + cos x sin frac{π}{3} )",
        "= 2 sin ( x + frac{π}{3} )"
      ], note: "cos frac{π}{3} = frac{1}{2}、sin frac{π}{3} = frac{sqrt{3}}{2}，所以 α = frac{π}{3}；最後一步用和角公式 sin(A + B) = sin A cos B + cos A sin B" },
      { title: "用 sin 的範圍求最大值", lines: [
        "−1 ≤ sin ( x + frac{π}{3} ) ≤ 1",
        "⇒ −2 ≤ y ≤ 2",
        "⇒ 最大值 = 2"
      ] },
      { title: "求取到最大值的 x", lines: [
        "x + frac{π}{3} = frac{π}{2}",
        "x = frac{π}{2} − frac{π}{3}",
        "= frac{π}{6}"
      ], note: "0 ≤ x < 2π 內只有這一個解" },
      { title: "代回原式驗算", lines: [
        "y = sin frac{π}{6} + sqrt{3} cos frac{π}{6}",
        "= frac{1}{2} + sqrt{3} · frac{sqrt{3}}{2}",
        "= frac{1}{2} + frac{3}{2}",
        "= 2 ✓"
      ] }
    ],
    traps: [
      "最大值不是 |a|＋|b|，是 √(a²+b²)；√(a²+b²) ≤ |a|＋|b|，兩者只有在其中一項為 0 時相等。",
      "α 是疊合用的角，不是答案的 x——求出 α 之後還要解 x＋α＝π/2。",
      "有限制範圍（0≤x<2π）時，要確認解出的 x 在範圍內；必要時加減 2π。",
      "求出答案後代回原式驗算，10 秒就能抓到「√3+1」這類錯誤。"
    ],
    references: [
      { title: "高中數學（3）A 習作 1-4 正餘弦函數的疊合（例題 3、4：求最大最小值）", source: "陽明高中 數學科", url: "https://math.ymhs.tyc.edu.tw/chenjt99/ScrClass/1091/%E9%AB%98%E4%BA%8C%E7%BF%92%E4%BD%9C3A/ch1/1-4.pdf", kind: "講義" },
      { title: "高中數學（3）A 習作 1-4 正餘弦函數的疊合（含方程式、不等式應用）", source: "南崁高中", url: "https://www.nksh.tyc.edu.tw/ischool/wr/file/1/12649/d99902f4065ed71bbe0b4c393bff22f9.pdf", kind: "講義" },
      { title: "18. 正餘弦函數的疊合進階", source: "均一教育平台", url: "https://www.junyiacademy.org/course-compare/math-high/math-11/j-m11a-a-ch1/v/-jQJQccdyV8", kind: "影片" },
      { title: "正餘弦函數的疊合之二", source: "GeoGebra", url: "https://mat.geogebra.org/material/show/id/ZMrktEQV", kind: "互動" }
    ],
    variants: [
      {
        question: "求 y = √3 sin x − cos x 的最大值，以及使函數達到最大值時的 x 值（0≤x<2π）。",
        options: [
          { key: "A", text: "最大值2，x=2π/3" },
          { key: "B", text: "最大值√3+1，x=2π/3" },
          { key: "C", text: "最大值2，x=π/6" },
          { key: "D", text: "最大值2，x=π/3" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "算 r", lines: ["r = sqrt{(sqrt{3})^{2} + (−1)^{2}}", "= sqrt{4} = 2"] },
          { title: "疊合", lines: [
            "y = 2 ( frac{sqrt{3}}{2} sin x − frac{1}{2} cos x )",
            "= 2 ( sin x cos frac{π}{6} − cos x sin frac{π}{6} )",
            "= 2 sin ( x − frac{π}{6} )"
          ], note: "b 是負的，所以 α = −frac{π}{6}；用差角公式 sin(A − B)" },
          { title: "最大值與 x", lines: ["x − frac{π}{6} = frac{π}{2}", "x = frac{2π}{3}", "⇒ 最大值 = 2"] },
          { title: "驗算", lines: ["y = sqrt{3} · frac{sqrt{3}}{2} − (−frac{1}{2})", "= frac{3}{2} + frac{1}{2} = 2 ✓"] }
        ]
      },
      {
        question: "求 y = sin x + cos x 的最小值，以及使函數達到最小值時的 x 值（0≤x<2π）。",
        options: [
          { key: "A", text: "最小值−√2，x=5π/4" },
          { key: "B", text: "最小值−2，x=5π/4" },
          { key: "C", text: "最小值−√2，x=3π/4" },
          { key: "D", text: "最小值−√2，x=π/4" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "算 r", lines: ["r = sqrt{1^{2} + 1^{2}}", "= sqrt{2}"], note: "不是 1 + 1 = 2" },
          { title: "疊合", lines: [
            "y = sqrt{2} ( frac{sqrt{2}}{2} sin x + frac{sqrt{2}}{2} cos x )",
            "= sqrt{2} sin ( x + frac{π}{4} )"
          ] },
          { title: "最小值與 x", lines: ["x + frac{π}{4} = frac{3π}{2}", "x = frac{5π}{4}", "⇒ 最小值 = −sqrt{2}"] },
          { title: "驗算", lines: ["y = −frac{sqrt{2}}{2} − frac{sqrt{2}}{2}", "= −sqrt{2} ✓"] }
        ]
      },
      {
        question: "函數 y = 3 sin x + 4 cos x 的最大值為何？",
        options: [
          { key: "A", text: "5" },
          { key: "B", text: "7" },
          { key: "C", text: "4" },
          { key: "D", text: "1" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "算 r", lines: ["r = sqrt{3^{2} + 4^{2}}", "= sqrt{25} = 5"] },
          { title: "最大值", lines: ["y = 5 sin ( x + α )", "⇒ 最大值 = 5"], note: "3 + 4 = 7 是把兩項最大值直接相加，錯" }
        ]
      }
    ],
    basis: "【確認】r、α 與最大值皆可代入驗算；各選項錯因與類題答案已逐一代值檢查。"
  }
};
