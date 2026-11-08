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
  },

  "tm_106_q46": {
    keyPoint: "篩管汁液中含量最高的是蔗糖——植物把光合產物合成蔗糖，再經韌皮部篩管運往根、果實等部位。",
    formulas: [
      "韌皮部篩管：運輸有機養分（以蔗糖為主），由「源」（成熟葉）運往「積儲」（根、果實、幼芽）",
      "木質部導管：運輸水和礦物質，由根往上",
      "蚜蟲口器實驗：口針插入單一篩管，切下蟲體後汁液仍持續流出 ⇒ 篩管內有正壓",
      "篩管汁液成分：醣類（蔗糖最多）、胺基酸、激素"
    ],
    whyWrong: {
      A: "葡萄糖是光合作用的產物之一，但植物運輸前會先合成蔗糖；篩管汁液中葡萄糖很少。動物血液運輸的才是葡萄糖。",
      C: "澱粉是不溶於水的儲存形式，存在葉綠體或儲藏器官，無法在篩管中流動。",
      D: "礦物質主要由木質部導管運輸；篩管汁液雖有少量離子，但不是主要成分。"
    },
    steps: [
      { title: "抓題幹關鍵", lines: [
        "題幹關鍵：蚜蟲口器插入篩管",
        "⇒ 收集到的是韌皮部篩管汁液",
        "⇒ 問的是「篩管運輸的主要物質」"
      ] },
      { title: "判斷運輸形式", lines: [
        "葉肉細胞把光合產物合成蔗糖",
        "⇒ 蔗糖裝載進入篩管，運往積儲",
        "⇒ 篩管汁液中蔗糖含量最高"
      ] },
      { title: "排除其他選項", lines: [
        "葡萄糖：運輸前已轉成蔗糖 ⇒ 含量少",
        "澱粉：不溶於水的儲存形式 ⇒ 不能在篩管流動",
        "礦物質：主要走木質部 ⇒ 不是篩管主成分"
      ] },
      { title: "對照課本確認", lines: [
        "課本：汁液含醣類、胺基酸、激素，以蔗糖最多",
        "⇒ 答案是蔗糖 ✓"
      ] }
    ],
    traps: [
      "看到「糖」就選葡萄糖——植物體內長距離運輸用的是蔗糖。",
      "篩管（韌皮部）運有機養分；導管（木質部）運水和礦物質，不要對調。",
      "澱粉是儲存形式，要先分解成可溶的醣才能運輸。",
      "蚜蟲不必用力吸，汁液靠篩管內的正壓自己流出。"
    ],
    references: [
      { title: "植物維管束韌皮部的物質運輸（有機養分）", source: "均一教育平台", url: "https://www.junyiacademy.org/video/R-j6a3ljlZ8?parent-topic-id=junyi-botany", kind: "影片" },
      { title: "壓力流學說（Pressure Flow Theory）：含蚜蟲口針實驗", source: "科學Online（臺灣大學）", url: "https://case.ntu.edu.tw/highscope/%E5%A3%93%E5%8A%9B%E6%B5%81%E5%AD%B8%E8%AA%AA%EF%BC%88pressure-flow-theory%EF%BC%89/index.html", kind: "文章" },
      { title: "植物體內養分的運輸（篩管汁液以蔗糖為主）", source: "科學Online（臺灣大學）", url: "https://case.ntu.edu.tw/highscope/%E6%A4%8D%E7%89%A9%E9%AB%94%E5%85%A7%E9%A4%8A%E5%88%86%E7%9A%84%E9%81%8B%E8%BC%B8%EF%BC%88nutrition%EF%BC%89-%E5%9C%8B%E7%AB%8B%E5%8F%B0%E7%81%A3%E5%B8%AB%E7%AF%84%E5%A4%A7%E5%AD%B8%E7%94%9F%E5%91%BD/index.html", kind: "文章" }
    ],
    variants: [
      {
        question: "將樹幹的樹皮環狀剝除一圈（環剝），一段時間後剝除處上方的樹皮膨大。最主要的原因是？",
        options: [
          { key: "A", text: "葉製造的有機養分往下運輸受阻而堆積" },
          { key: "B", text: "根吸收的水分往上運輸受阻而堆積" },
          { key: "C", text: "礦物質往上運輸受阻而堆積" },
          { key: "D", text: "木質部導管被破壞而無法運水" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "環剝移除了什麼", lines: ["樹皮含韌皮部 ⇒ 篩管被切斷", "木質部在內側 ⇒ 仍完整"] },
          { title: "判斷", lines: [
            "水和礦物質走木質部 ⇒ 照常上運",
            "蔗糖由葉往下走篩管 ⇒ 在切口上方受阻",
            "⇒ 養分堆積，上方膨大 ✓"
          ] }
        ]
      },
      {
        question: "下列關於植物體內物質運輸的配對，何者正確？",
        options: [
          { key: "A", text: "篩管—蔗糖—由源運往積儲" },
          { key: "B", text: "導管—蔗糖—只能由下往上" },
          { key: "C", text: "篩管—水和礦物質—只能由下往上" },
          { key: "D", text: "導管—澱粉—由葉運往根" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "逐項判斷", lines: [
            "篩管運蔗糖，方向由源到積儲 ⇒ 正確",
            "導管運水和礦物質，不運蔗糖 ⇒ 錯",
            "水和礦物質走導管，不是篩管 ⇒ 錯",
            "澱粉不溶於水，不能被運輸 ⇒ 錯"
          ] }
        ]
      },
      {
        question: "把正在吸食的蚜蟲身體切除、只留口針在莖內，口針斷口持續流出汁液。這個現象最能說明什麼？",
        options: [
          { key: "A", text: "篩管內汁液具有正壓，可自行流出" },
          { key: "B", text: "篩管汁液是靠蒸散作用往上拉" },
          { key: "C", text: "蚜蟲口針會主動分泌糖液" },
          { key: "D", text: "導管內的水被根壓推出" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "推理", lines: [
            "蟲體已移除 ⇒ 沒有吸力",
            "汁液仍流出 ⇒ 篩管內壓力大於外界",
            "蒸散拉力、根壓作用在木質部 ⇒ 與篩管無關",
            "⇒ 篩管內有正壓 ✓（支持壓力流學說）"
          ] }
        ]
      }
    ],
    basis: "【確認】與題目所附課本 p.100 敘述一致（篩管汁液以蔗糖含量最高），並經科學Online 文章確認蔗糖為篩管主要運輸物。"
  },

  "tm_28_q76": {
    keyPoint: "先用「PV 相加」求定溫混合後的壓力，再用定容 P ∝ T 換到新溫度；定容加熱，壓力只會變大。",
    formulas: [
      "定溫混合：P_{總} V_{總} = P_{1} V_{1} + P_{2} V_{2}",
      "定容：frac{P_{1}}{T_{1}} = frac{P_{2}}{T_{2}}（T 用 K）",
      "合併：P = frac{P_{1}V_{1} + P_{2}V_{2}}{V_{總}} × frac{T_{新}}{T_{舊}}"
    ],
    whyWrong: {
      B: "4.0 比 300 K 混合後的 5.0 還小，但體積不變時加熱，壓力只會上升；常見錯因是溫度比倒過來乘（5.0 × 300/420 ≈ 3.6）。",
      A: "3.0 只是甲容器原本的壓力，沒有考慮乙容器的氣體與加熱。",
      C: "5.0 是 300 K 時混合後的壓力，忘了再加熱到 420 K。",
      D: "6.0 是乙容器原本的壓力；混合後總體積變成 60 L，壓力不會維持原值。"
    },
    steps: [
      { title: "300 K 定溫混合", lines: [
        "P_{混} × 60.0 = 3.00 × 20.0 + 6.00 × 40.0",
        "= 60.0 + 240",
        "= 300",
        "⇒ P_{混} = frac{300}{60.0} = 5.00 atm"
      ], note: "總體積 = 20.0 + 40.0 = 60.0 L" },
      { title: "定容加熱到 420 K", lines: [
        "frac{5.00}{300} = frac{P}{420}",
        "P = 5.00 × frac{420}{300}",
        "= 7.00 atm"
      ] },
      { title: "用 PV = nRT 驗算", lines: [
        "n_{總} = frac{300}{0.082 × 300} ≈ 12.2 mol",
        "P = frac{12.2 × 0.082 × 420}{60.0}",
        "≈ 7.0 atm ✓"
      ] }
    ],
    traps: [
      "混合後的體積是兩容器相加的 60 L，不是各自的體積。",
      "題目有兩個變化（混合、加熱），要分兩步，或用合併式一次算。",
      "溫度一定用 K；定容加熱壓力變大，答案必大於 5.0。"
    ],
    references: [
      { title: "【觀念】理想氣體方程式", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/Ub7qvuO8Hf8", kind: "影片" },
      { title: "【觀念】道耳頓分壓定律", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/UV1DPXzVruE", kind: "影片" },
      { title: "高三上物理 1-5 理想氣體方程式（5）：絕對溫度 0 K", source: "均一教育平台", url: "https://www.junyiacademy.org/video/nt0pBRp2q-c?parent-topic-id=junyi-heat", kind: "影片" }
    ],
    variants: [
      {
        question: "10.0 L 容器裝 2.00 atm 氦氣，30.0 L 容器裝 4.00 atm 氖氣，兩者皆 300 K，以閘門相連。打開閘門後加熱到 450 K（容器體積不變），平衡壓力為幾 atm？",
        options: [
          { key: "A", text: "5.25" },
          { key: "B", text: "3.50" },
          { key: "C", text: "3.00" },
          { key: "D", text: "4.50" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "定溫混合", lines: ["P_{混} × 40.0 = 2.00 × 10.0 + 4.00 × 30.0", "= 140", "P_{混} = 3.50 atm"] },
          { title: "定容加熱", lines: ["P = 3.50 × frac{450}{300}", "= 5.25 atm"] },
          { title: "驗算", lines: ["5.25 × 40.0 = 210", "140 × frac{450}{300} = 210 ✓"] }
        ]
      },
      {
        question: "2.0 L 容器裝 1.5 atm 氣體、3.0 L 容器裝 2.0 atm 氣體，皆 27°C，相連混合後冷卻到 −73°C（體積不變），壓力為幾 atm？",
        options: [
          { key: "A", text: "1.2" },
          { key: "B", text: "1.8" },
          { key: "C", text: "2.7" },
          { key: "D", text: "1.75" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "定溫混合", lines: ["P_{混} × 5.0 = 1.5 × 2.0 + 2.0 × 3.0", "= 9.0", "P_{混} = 1.8 atm"] },
          { title: "定容冷卻", lines: ["T：300 K → 200 K", "P = 1.8 × frac{200}{300}", "= 1.2 atm"] },
          { title: "驗算", lines: ["1.2 × 5.0 = 6.0", "9.0 × frac{200}{300} = 6.0 ✓"], note: "1.75 是把兩壓力直接平均，錯" }
        ]
      }
    ],
    basis: "【確認】分步計算與 PV = nRT 驗算皆得 7.0 atm，與正確答案一致；類題已代回驗算。"
  },

  "tm_28_q70": {
    keyPoint: "用 PV = nRT 求莫耳數再乘亞佛加厥數；關鍵是 mmHg 先除以 760 換成 atm、溫度換成 K。",
    formulas: [
      "n = frac{PV}{RT}，R = 0.082 atm·L/(mol·K)",
      "1 atm = 760 mmHg；T = t + 273",
      "粒子數 N = n × 6.02 × 10^{23}"
    ],
    whyWrong: {
      E: "比正確值大 100 倍，代表某個單位換算差了 10^{2}；逐項檢查 mmHg→atm（÷760）、溫度（K）與指數運算。",
      A: "比正確值小 100 倍，多半是指數相乘相除時算錯。",
      B: "比正確值小 10 倍，指數運算少了一次方。",
      D: "比正確值大 10 倍，指數運算多了一次方。"
    },
    steps: [
      { title: "統一單位", lines: [
        "P = frac{4 × 10^{−9}}{760} atm",
        "≈ 5.26 × 10^{−12} atm",
        "V = 2.0 L，T = 27 + 273 = 300 K"
      ] },
      { title: "求莫耳數", lines: [
        "n = frac{PV}{RT}",
        "= frac{5.26 × 10^{−12} × 2.0}{0.082 × 300}",
        "= frac{1.05 × 10^{−11}}{24.6}",
        "≈ 4.28 × 10^{−13} mol"
      ] },
      { title: "換成粒子數", lines: [
        "N = 4.28 × 10^{−13} × 6.02 × 10^{23}",
        "≈ 2.58 × 10^{11}",
        "≈ 2.6 × 10^{11} 個"
      ] },
      { title: "數量級驗算", lines: [
        "PV = 4 × 10^{−9} × 2.0 = 8 × 10^{−9} mmHg·L",
        "760 × 24.6 ≈ 1.87 × 10^{4}",
        "n ≈ frac{8 × 10^{−9}}{1.87 × 10^{4}} ≈ 4.3 × 10^{−13} ✓"
      ] }
    ],
    traps: [
      "R = 0.082 時，P 必須是 atm、V 是 L、T 是 K。",
      "4×10⁻⁹ mmHg 要先 ÷760，這一步最常漏。",
      "指數相乘：10^{−13} × 10^{23} = 10^{10}，再乘 4.28 × 6.02 ≈ 25.8，得 2.58 × 10^{11}。"
    ],
    references: [
      { title: "【觀念】理想氣體方程式", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/Ub7qvuO8Hf8", kind: "影片" },
      { title: "高三上物理 1-5 理想氣體方程式（3）：1 標準大氣壓與托里切利實驗", source: "均一教育平台", url: "https://www.junyiacademy.org/video/3-PWACY6LRc?parent-topic-id=junyi-heat", kind: "影片" },
      { title: "【例題】大氣壓力的單位換算（指考物理 106）", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-phy/main-seni-ph-ele2/main-seni-ph-ele2-4/v/TMQ1SnrEeRQ", kind: "影片" }
    ],
    variants: [
      {
        question: "1.0 L 的真空容器在 27°C 時內部壓力為 7.6×10⁻⁶ mmHg，容器內的氣體粒子數約為多少個？",
        options: [
          { key: "A", text: "2.4×10¹⁴" },
          { key: "B", text: "2.4×10¹¹" },
          { key: "C", text: "2.4×10¹⁷" },
          { key: "D", text: "1.9×10¹⁷" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "換單位", lines: ["P = frac{7.6 × 10^{−6}}{760} = 1.0 × 10^{−8} atm"] },
          { title: "求 n 與 N", lines: [
            "n = frac{1.0 × 10^{−8} × 1.0}{0.082 × 300}",
            "≈ 4.07 × 10^{−10} mol",
            "N = 4.07 × 10^{−10} × 6.02 × 10^{23}",
            "≈ 2.4 × 10^{14} 個"
          ], note: "忘了除以 760 會得到約 1.9 × 10^{17}" },
          { title: "驗算", lines: ["frac{2.4 × 10^{14}}{6.02 × 10^{23}} ≈ 4.0 × 10^{−10} mol ✓"] }
        ]
      },
      {
        question: "在 0°C、1 atm 下，1.0 mL 的氣體約含多少個分子？",
        options: [
          { key: "A", text: "2.7×10¹⁹" },
          { key: "B", text: "2.7×10²²" },
          { key: "C", text: "2.7×10¹⁶" },
          { key: "D", text: "6.0×10²⁰" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "莫耳數", lines: ["n = frac{1.0 × 10^{−3} L}{22.4 L/mol}", "≈ 4.46 × 10^{−5} mol"], note: "mL 要先換成 L" },
          { title: "分子數", lines: ["N = 4.46 × 10^{−5} × 6.02 × 10^{23}", "≈ 2.7 × 10^{19} 個"] },
          { title: "驗算", lines: ["frac{2.7 × 10^{19}}{6.02 × 10^{23}} × 22.4 ≈ 1.0 × 10^{−3} L ✓"] }
        ]
      }
    ],
    basis: "【確認】依 PV = nRT 重算得 2.58×10¹¹ ≈ 2.6×10¹¹，與正確答案一致；類題已代回驗算。"
  },

  "tm_28_q31": {
    keyPoint: "定壓下體積與攝氏溫度成直線關係；用兩點求直線，令 V = 0 的溫度就是絕對零度，答案必為負值。",
    formulas: [
      "查理定律：V = V_{0} ( 1 + frac{t}{273} )（定壓、t 為 °C）",
      "絕對溫度：V ∝ T，T = t + 273",
      "直線斜率 = frac{b − a}{100 − 0}"
    ],
    whyWrong: {
      E: "分子多乘了一個體積 b，結果的單位變成「溫度×體積」，不可能是溫度；代 a = 273、b = 373 會得到 −101829，不是 −273。",
      B: "分母寫成 b − a，因 b > a 結果為正（代入得 +273），但絕對零度一定低於 0°C。",
      C: "分子用了 b，代 a = 273、b = 373 得 −373，不是 −273。",
      D: "代入得 +373，正負號與分子都錯。"
    },
    steps: [
      { title: "寫出直線", lines: [
        "V = a + k t",
        "t = 100 時 V = b ⇒ b = a + 100k",
        "⇒ k = frac{b − a}{100}"
      ] },
      { title: "令 V = 0", lines: [
        "0 = a + frac{b − a}{100} t",
        "t = frac{−100a}{b − a}",
        "= frac{100a}{a − b}"
      ] },
      { title: "檢查正負", lines: [
        "定壓加熱體積變大 ⇒ b > a",
        "⇒ a − b < 0 ⇒ t < 0 ✓"
      ] },
      { title: "代數字驗算", lines: [
        "取 a = 273，b = 373（V ∝ T）",
        "t = frac{100 × 273}{273 − 373}",
        "= frac{27300}{−100} = −273 °C ✓"
      ] }
    ],
    traps: [
      "絕對零度一定是負的攝氏溫度——寫完先檢查正負號。",
      "答案要是「溫度」，分子分母的體積單位必須約掉，ab 相乘的式子單位不對。",
      "選項全是代數式時，代 a = 273、b = 373 是最快的驗證法。"
    ],
    references: [
      { title: "4. 查理定律與亞佛加厥定律", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/junyi-chemistry/v1217-new-topic-1/j-d-che-u1/j-d-che-u1-7/v/Tn4SrtHiVZ4", kind: "影片" },
      { title: "高三上物理 1-5 理想氣體方程式（5）：絕對溫度 0 K = −273.15°C", source: "均一教育平台", url: "https://www.junyiacademy.org/video/nt0pBRp2q-c?parent-topic-id=junyi-heat", kind: "影片" },
      { title: "氣體定律", source: "教育百科（國家教育研究院）", url: "https://pedia.cloud.edu.tw/Entry/Detail/?title=%E6%B0%A3%E9%AB%94%E5%AE%9A%E5%BE%8B", kind: "文章" }
    ],
    variants: [
      {
        question: "定壓下，定量氣體在 0°C 與 50°C 時的體積分別為 V₁、V₂，則以攝氏溫度表示的絕對零度為何？",
        options: [
          { key: "A", text: "50V₁/(V₁−V₂)" },
          { key: "B", text: "50V₁/(V₂−V₁)" },
          { key: "C", text: "50V₂/(V₁−V₂)" },
          { key: "D", text: "100V₁/(V₁−V₂)" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "直線", lines: ["V = V_{1} + frac{V_{2} − V_{1}}{50} t"] },
          { title: "令 V = 0", lines: ["t = frac{−50 V_{1}}{V_{2} − V_{1}}", "= frac{50 V_{1}}{V_{1} − V_{2}}"] },
          { title: "驗算", lines: ["取 V_{1} = 273，V_{2} = 323", "t = frac{50 × 273}{−50} = −273 ✓"] }
        ]
      },
      {
        question: "定壓下，某氣體在 27°C 時體積為 300 mL，加熱到 127°C 時體積為多少 mL？",
        options: [
          { key: "A", text: "400" },
          { key: "B", text: "1411" },
          { key: "C", text: "327" },
          { key: "D", text: "373" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "換成 K", lines: ["T_{1} = 300 K，T_{2} = 400 K"] },
          { title: "V ∝ T", lines: ["V_{2} = 300 × frac{400}{300}", "= 400 mL"], note: "用攝氏 127/27 相比會得 1411，錯" },
          { title: "驗算", lines: ["frac{300}{300} = frac{400}{400} = 1 ✓"] }
        ]
      }
    ],
    basis: "【確認】兩點式推導得 100a/(a−b)，並以 a = 273、b = 373 代入得 −273°C；其餘選項代入皆不符。"
  },

  "tm_28_q59": {
    keyPoint: "同重時莫耳數 ∝ 1/M；同體積時壓力 ∝ nT；原子數 = 分子數 × 每分子原子數；同重同體積則密度相同。",
    formulas: [
      "n = frac{w}{M}（同重 ⇒ n ∝ frac{1}{M}）",
      "P = frac{nRT}{V}（同體積 ⇒ P ∝ nT）",
      "原子數 = 分子數 × 每分子原子數",
      "d = frac{w}{V}"
    ],
    whyWrong: {
      B: "壓力 ∝ nT，要用莫耳數比 8：1：2 乘溫度 300、350、400，得 48：7：16，不是 3：28：80。",
      A: "同重時莫耳數與分子量成反比：frac{1}{4}：frac{1}{32}：frac{1}{16} = 8：1：2，不是 4：1：2。",
      D: "質量相同、體積相同，密度 = 質量 ÷ 體積就相同，比為 1：1：1。"
    },
    steps: [
      { title: "莫耳數（分子數）", lines: [
        "分子量：He 4、O₂ 32、CH₄ 16",
        "n 比 = frac{1}{4}：frac{1}{32}：frac{1}{16}",
        "= 8：1：2"
      ], note: "分子數比 = 莫耳數比 = 8：1：2" },
      { title: "壓力", lines: [
        "T：300、350、400 K",
        "P ∝ nT = 8 × 300：1 × 350：2 × 400",
        "= 2400：350：800",
        "= 48：7：16"
      ] },
      { title: "原子數", lines: [
        "每分子原子數：He 1、O₂ 2、CH₄ 5",
        "= 8 × 1：1 × 2：2 × 5",
        "= 8：2：10 = 4：1：5"
      ] },
      { title: "密度", lines: ["d = frac{w}{V}，w 與 V 皆相同", "⇒ 1：1：1"] },
      { title: "代數字驗算", lines: [
        "設各 32 g：n = 8、1、2 mol ✓",
        "原子：8、2、10 mol ⇒ 4：1：5 ✓"
      ] }
    ],
    traps: [
      "同重比莫耳數要「倒過來」：分子量愈大，莫耳數愈少。",
      "溫度不同時壓力比要乘溫度（K），不能只看莫耳數。",
      "甲烷 CH₄ 一個分子有 5 個原子，氧 O₂ 有 2 個。",
      "多選題每個選項都要獨立算過，不要只檢查一兩項。"
    ],
    references: [
      { title: "【觀念】理想氣體方程式", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/Ub7qvuO8Hf8", kind: "影片" },
      { title: "【觀念】亞佛加厥定律", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/EOl8UCr_iuE", kind: "影片" },
      { title: "4. 查理定律與亞佛加厥定律", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/junyi-chemistry/v1217-new-topic-1/j-d-che-u1/j-d-che-u1-7/v/Tn4SrtHiVZ4", kind: "影片" }
    ],
    variants: [
      {
        question: "同溫下，三個相同體積的容器分別裝入同重的 H₂、He、CH₄（H＝1、He＝4、C＝12），三者壓力比為何？",
        options: [
          { key: "A", text: "8：4：1" },
          { key: "B", text: "1：2：8" },
          { key: "C", text: "2：1：1" },
          { key: "D", text: "1：1：1" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "莫耳數", lines: ["M：2、4、16", "n 比 = frac{1}{2}：frac{1}{4}：frac{1}{16}", "= 8：4：1"] },
          { title: "壓力", lines: ["同溫同體積 ⇒ P ∝ n", "⇒ 8：4：1"] },
          { title: "驗算", lines: ["設各 16 g：n = 8、4、1 mol ✓"] }
        ]
      },
      {
        question: "兩個相同體積的容器，分別裝同重的 O₂（27°C）與 SO₂（327°C），O₂ 與 SO₂ 的壓力比為何？（O＝16、S＝32）",
        options: [
          { key: "A", text: "1：1" },
          { key: "B", text: "2：1" },
          { key: "C", text: "1：2" },
          { key: "D", text: "1：4" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "莫耳數", lines: ["M：32、64", "n 比 = frac{1}{32}：frac{1}{64} = 2：1"] },
          { title: "壓力", lines: ["T：300、600 K", "P ∝ nT = 2 × 300：1 × 600", "= 600：600 = 1：1"] },
          { title: "驗算", lines: ["設各 64 g：n = 2、1 mol", "nT = 600、600 ✓"] }
        ]
      }
    ],
    basis: "【確認】逐項重算：莫耳數 8：1：2、壓力 48：7：16、原子數 4：1：5、密度 1：1：1，正確為原子數與分子數兩項，與答案一致。"
  },

  "tm_28_q118": {
    keyPoint: "活栓全開後三瓶是同一個空間：每種氣體用 P₁V₁ = P₂V₂ 擴散到總體積求分壓，各瓶的總壓與分壓全都相同。",
    formulas: [
      "各氣體分壓：P_{後} = frac{P_{前} V_{前}}{V_{總}}（定溫）",
      "道耳頓分壓定律：P_{總} = P_{A} + P_{B} + P_{C}",
      "連通後均勻混合 ⇒ 各瓶組成、壓力相同"
    ],
    whyWrong: {
      C: "84.8 = 63.6 + 21.2，是把原本壓力直接相加，沒考慮體積擴大成 2.5 L；而且全開後三瓶總壓相同，都是 42.4 mmHg。",
      D: "氦擴散到 2.5 L 後分壓 = 63.6 × 1.0 ÷ 2.5 ≈ 25.4 mmHg，不是 10.6。"
    },
    steps: [
      { title: "總體積", lines: ["V_{總} = 1.0 + 1.0 + 0.5 = 2.5 L"] },
      { title: "各氣體分壓", lines: [
        "P_{He} = frac{63.6 × 1.0}{2.5} = 25.44 mmHg",
        "P_{N₂} = frac{21.2 × 1.0}{2.5} = 8.48 mmHg",
        "P_{H₂} = frac{42.4 × 0.5}{2.5} = 8.48 mmHg"
      ] },
      { title: "總壓", lines: [
        "P_{總} = 25.44 + 8.48 + 8.48",
        "= 42.4 mmHg",
        "⇒ 每一瓶的總壓、各分壓都相同"
      ] },
      { title: "逐項判斷", lines: [
        "丙瓶中氦 25.44 最大 ⇒ 正確",
        "乙瓶總壓 42.4 ⇒ 正確",
        "丙瓶總壓 42.4，不是 84.8 ⇒ 錯",
        "甲瓶氦分壓 25.44，不是 10.6 ⇒ 錯",
        "乙瓶氮、氫都是 8.48 ⇒ 正確"
      ] },
      { title: "驗算", lines: [
        "混合前 ΣPV = 63.6 × 1.0 + 21.2 × 1.0 + 42.4 × 0.5 = 106",
        "混合後 P_{總} V_{總} = 42.4 × 2.5 = 106 ✓"
      ] }
    ],
    traps: [
      "活栓全開後不要分瓶計算：整個系統只有一個總壓。",
      "原本壓力不能直接相加，要先乘各自體積、再除以總體積。",
      "丙瓶體積只有 0.5 L，氫的 PV 只有 21.2，別漏乘體積。"
    ],
    references: [
      { title: "【觀念】道耳頓分壓定律", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/UV1DPXzVruE", kind: "影片" },
      { title: "【觀念】波以耳定律", source: "均一教育平台", url: "https://www.junyiacademy.org/video/xoCE_fBonO4?parent-topic-id=main-seni-ph-ele2-4", kind: "影片" },
      { title: "【觀念】理想氣體方程式", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/Ub7qvuO8Hf8", kind: "影片" }
    ],
    variants: [
      {
        question: "定溫下，2.0 L 甲瓶裝 3.0 atm 的氦，3.0 L 乙瓶裝 1.0 atm 的氖，以活栓相連。打開活栓平衡後，乙瓶中氦的分壓為幾 atm？",
        options: [
          { key: "A", text: "1.2" },
          { key: "B", text: "3.0" },
          { key: "C", text: "1.8" },
          { key: "D", text: "0" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "氦擴散到總體積", lines: ["V_{總} = 5.0 L", "P_{He} = frac{3.0 × 2.0}{5.0} = 1.2 atm"], note: "均勻混合，乙瓶中氦的分壓與甲瓶相同" },
          { title: "驗算", lines: ["1.2 × 5.0 = 6.0 = 3.0 × 2.0 ✓"] }
        ]
      },
      {
        question: "承上題，活栓打開平衡後，系統的總壓為幾 atm？",
        options: [
          { key: "A", text: "1.8" },
          { key: "B", text: "4.0" },
          { key: "C", text: "2.0" },
          { key: "D", text: "0.9" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "各分壓", lines: ["P_{He} = frac{6.0}{5.0} = 1.2", "P_{Ne} = frac{1.0 × 3.0}{5.0} = 0.6"] },
          { title: "總壓", lines: ["P_{總} = 1.2 + 0.6 = 1.8 atm"], note: "4.0 是原壓力直接相加，2.0 是直接平均，都錯" },
          { title: "驗算", lines: ["1.8 × 5.0 = 9.0", "3.0 × 2.0 + 1.0 × 3.0 = 9.0 ✓"] }
        ]
      }
    ],
    basis: "【確認】重算分壓 25.44、8.48、8.48 mmHg、總壓 42.4 mmHg，並以 ΣPV 守恆驗算；正確選項為三項，與答案一致。"
  },

  "tm_28_q16": {
    keyPoint: "氣體粒子間距大、作用力小、不停運動 ⇒ 會擴散、能均勻混合、可壓縮；但體積會隨溫度壓力改變，也不可能壓縮到零。",
    formulas: [
      "氣體通性：無固定形狀與體積、可壓縮、可擴散、可任意比例均勻混合",
      "波以耳定律：定溫 PV = 定值；查理定律：定壓 V ∝ T",
      "粒子本身有體積 ⇒ 體積不可能壓縮到零"
    ],
    whyWrong: {
      C: "氣體體積會隨溫度、壓力改變——這正是波以耳定律與查理定律描述的現象。",
      E: "氣體粒子本身仍有體積，加壓到一定程度會液化，不可能壓縮到零。"
    },
    steps: [
      { title: "氣體的微觀特性", lines: [
        "粒子間距離大、作用力小、運動快",
        "⇒ 可擴散、可均勻混合、可壓縮"
      ] },
      { title: "逐項判斷", lines: [
        "可以擴散：粒子不停運動 ⇒ 正確",
        "可均勻混合：任何氣體都能以任意比例互溶 ⇒ 正確",
        "體積不受溫度壓力影響：與波以耳、查理定律矛盾 ⇒ 錯",
        "粒子間距遠大於固體：所以容易壓縮 ⇒ 正確",
        "體積可壓縮至零：粒子本身有體積 ⇒ 錯"
      ] },
      { title: "檢查漏選", lines: [
        "擴散、均勻混合是氣體最基本的通性",
        "⇒ 正確答案共三項，不能只選粒子間距那一項"
      ] }
    ],
    traps: [
      "多選題要逐項判斷，「擴散」「均勻混合」這種最基本的敘述最容易被漏選。",
      "「理想氣體分子本身體積可忽略」是計算上的近似，不代表真的能壓縮到零。",
      "看到「不會受溫度、壓力影響」這種絕對說法，先想想有沒有定律反駁它。"
    ],
    references: [
      { title: "2. 理想氣體粒子模型", source: "均一教育平台", url: "https://www.junyiacademy.org/video/zgyi05zBnfA?parent-topic-id=j-d-che-u1-7", kind: "影片" },
      { title: "6. 理想氣體與真實氣體的差異", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/junyi-chemistry/v1217-new-topic-1/j-d-che-u1/j-d-che-u1-7/v/fY0cp1Uj9kY", kind: "影片" },
      { title: "【觀念】波以耳定律", source: "均一教育平台", url: "https://www.junyiacademy.org/video/xoCE_fBonO4?parent-topic-id=main-seni-ph-ele2-4", kind: "影片" }
    ],
    variants: [
      {
        question: "下列何者「不是」氣體的通性？",
        options: [
          { key: "A", text: "有固定的形狀" },
          { key: "B", text: "可以被壓縮" },
          { key: "C", text: "會自行擴散" },
          { key: "D", text: "會充滿整個容器" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "逐項判斷", lines: [
            "粒子自由運動 ⇒ 沒有固定形狀，會充滿容器",
            "粒子間距大 ⇒ 可壓縮",
            "粒子不停運動 ⇒ 會擴散",
            "⇒ 「有固定形狀」是固體的性質 ✓"
          ] }
        ]
      },
      {
        question: "氣體比液體容易被壓縮，主要原因是？",
        options: [
          { key: "A", text: "氣體粒子間的距離很大" },
          { key: "B", text: "氣體粒子本身的體積可以變小" },
          { key: "C", text: "氣體粒子間的吸引力很強" },
          { key: "D", text: "氣體粒子不會運動" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "判斷", lines: [
            "壓縮時縮小的是粒子間的空隙，不是粒子本身",
            "氣體粒子間距遠大於液體 ⇒ 空隙多，容易壓縮 ✓",
            "吸引力強、粒子不動都與氣體特性相反 ⇒ 錯"
          ] }
        ]
      }
    ],
    basis: "【確認】依氣體通性與波以耳、查理定律逐項判斷，正確為擴散、均勻混合、粒子間距大三項，與答案一致。"
  },

  "tm_76_q5": {
    keyPoint: "液柱壓力 P = d × h：同一個壓力，密度愈大液柱愈短，換成汞柱要「除以」13.6，並注意 cm 換 mm。",
    formulas: [
      "P = d × h（同一壓力 ⇒ d_{1} h_{1} = d_{2} h_{2}）",
      "h_{汞} = frac{d_{液} × h_{液}}{13.6}",
      "1 mmHg = 1 mm 汞柱；1 cm = 10 mm"
    ],
    whyWrong: {
      D: "925 ≈ 68 × 13.6，是乘以 13.6——方向弄反了。汞比點滴液重 13.6 倍，同樣壓力的汞柱應該比較短，要除以 13.6。",
      B: "68 是直接把液柱高度 68 cm 當成 mmHg，沒有換密度，也沒換單位。",
      C: "5.0 = 68 ÷ 13.6，單位是 cmHg，忘了換成 mm（×10）。"
    },
    steps: [
      { title: "統一單位", lines: ["h_{液} = 68.0 cm = 680 mm"] },
      { title: "換算成汞柱", lines: [
        "d_{液} h_{液} = d_{汞} h_{汞}",
        "1.00 × 680 = 13.6 × h_{汞}",
        "h_{汞} = frac{680}{13.6}",
        "= 50.0 mm ⇒ 50 mmHg"
      ] },
      { title: "驗算", lines: [
        "13.6 × 50.0 = 680 ✓",
        "汞較重 ⇒ 汞柱比液柱短 ✓"
      ] }
    ],
    traps: [
      "換算方向：密度大的液體柱比較短，所以換成汞柱是除以 13.6。",
      "mmHg 的單位是 mm，題目給 cm 要先 ×10。",
      "算完用「汞柱應該比較短」檢查一次，就能抓到乘除顛倒。"
    ],
    references: [
      { title: "絕對壓力（錶壓與液柱高度）", source: "科學Online（臺灣大學）", url: "https://case.ntu.edu.tw/highscope/%E7%B5%95%E5%B0%8D%E5%A3%93%E5%8A%9B/index.html", kind: "文章" },
      { title: "氣壓計（Barometer）", source: "科學Online（臺灣大學）", url: "https://case.ntu.edu.tw/highscope/%E6%B0%A3%E5%A3%93%E8%A8%88barometer/index.html", kind: "文章" },
      { title: "高三上物理 1-5 理想氣體方程式（3）：1 標準大氣壓與托里切利實驗", source: "均一教育平台", url: "https://www.junyiacademy.org/video/3-PWACY6LRc?parent-topic-id=junyi-heat", kind: "影片" }
    ],
    variants: [
      {
        question: "10.0 m 高的水柱（密度 1.00 g/cm³）所產生的壓力，約相當於多少 mmHg？（汞密度 13.6 g/cm³）",
        options: [
          { key: "A", text: "735" },
          { key: "B", text: "136000" },
          { key: "C", text: "73.5" },
          { key: "D", text: "1000" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "換單位", lines: ["h_{水} = 10.0 m = 10000 mm"] },
          { title: "換汞柱", lines: ["h_{汞} = frac{1.00 × 10000}{13.6}", "≈ 735 mm ⇒ 735 mmHg"] },
          { title: "驗算", lines: ["13.6 × 735 ≈ 10000 ✓"] }
        ]
      },
      {
        question: "點滴瓶液面比針頭高 81.6 cm，點滴液密度 1.00 g/cm³（汞 13.6 g/cm³）。若靜脈血壓（不含大氣壓）為 40 mmHg，液柱壓力為多少？點滴能否流入？",
        options: [
          { key: "A", text: "60 mmHg，能流入" },
          { key: "B", text: "60 mmHg，不能流入" },
          { key: "C", text: "6.0 mmHg，不能流入" },
          { key: "D", text: "1110 mmHg，能流入" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "換汞柱", lines: ["h = 81.6 cm = 816 mm", "h_{汞} = frac{816}{13.6} = 60 mm"] },
          { title: "比較", lines: ["60 mmHg > 40 mmHg", "⇒ 液柱壓力大於血壓，能流入"] },
          { title: "驗算", lines: ["13.6 × 60 = 816 ✓"] }
        ]
      }
    ],
    basis: "【確認】680 ÷ 13.6 = 50.0，並以 13.6 × 50 = 680 驗算；錯誤選項分別對應乘除顛倒與單位未換算。"
  },

  "tm_28_q36": {
    keyPoint: "同溫同壓下：密度比 = 分子量比；同體積 ⇒ 分子數相同；等重 ⇒ 分子數與分子量成反比。",
    formulas: [
      "同溫同壓：frac{d_{1}}{d_{2}} = frac{M_{1}}{M_{2}}",
      "亞佛加厥定律：同溫同壓同體積 ⇒ 分子數相同（n ∝ V）",
      "等重：n = frac{w}{M} ⇒ n ∝ frac{1}{M}"
    ],
    whyWrong: {
      D: "同溫同壓下同體積的任何氣體分子數都相同（亞佛加厥定律），三者是 1：1：1，沒有大小之分。",
      A: "密度比 = 分子量比，甲的分子量 = 32 × frac{1}{2} = 16，不是 28。"
    },
    steps: [
      { title: "求甲的分子量", lines: [
        "frac{d_{甲}}{d_{O₂}} = frac{M_{甲}}{M_{O₂}}",
        "frac{1}{2} = frac{M_{甲}}{32}",
        "M_{甲} = 16"
      ] },
      { title: "求乙的分子量", lines: [
        "等重：n_{乙} M_{乙} = n_{O₂} × 32",
        "同溫同壓 n ∝ V ⇒ 8 M_{乙} = 9 × 32",
        "M_{乙} = frac{288}{8} = 36"
      ] },
      { title: "密度與分子數", lines: [
        "d ∝ M ⇒ 乙 36 > 氧 32 > 甲 16",
        "同體積 ⇒ 分子數 1：1：1",
        "等重 ⇒ 分子數 ∝ frac{1}{M} ⇒ 甲 > 氧 > 乙"
      ] },
      { title: "驗算", lines: [
        "8 × 36 = 288，9 × 32 = 288 ✓ 等重",
        "甲密度 frac{16}{32} = frac{1}{2} 倍 ✓"
      ] }
    ],
    traps: [
      "「同體積」比分子數 ⇒ 一律相同；「等重」比分子數 ⇒ 分子量小的多。兩者別混。",
      "體積大的那份比較輕的話，分子量較大：8 mL 乙 = 9 mL 氧重 ⇒ 乙較重。",
      "多選題要把每一項都算完，正確的不只兩個。"
    ],
    references: [
      { title: "【觀念】亞佛加厥定律", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/EOl8UCr_iuE", kind: "影片" },
      { title: "4. 查理定律與亞佛加厥定律", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/junyi-chemistry/v1217-new-topic-1/j-d-che-u1/j-d-che-u1-7/v/Tn4SrtHiVZ4", kind: "影片" },
      { title: "【觀念】理想氣體方程式", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/Ub7qvuO8Hf8", kind: "影片" }
    ],
    variants: [
      {
        question: "同溫同壓下，某氣體的密度是氫氣（H₂）的 22 倍，此氣體的分子量為何？",
        options: [
          { key: "A", text: "44" },
          { key: "B", text: "22" },
          { key: "C", text: "11" },
          { key: "D", text: "88" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "密度比 = 分子量比", lines: ["frac{M}{2} = 22", "M = 44"] },
          { title: "驗算", lines: ["frac{44}{2} = 22 ✓"], note: "22 是忘了乘 H₂ 的分子量 2" }
        ]
      },
      {
        question: "同溫同壓下，5 L 的氣體 X 與 4 L 的 SO₂ 等重，X 的分子量為何？（S＝32、O＝16）",
        options: [
          { key: "A", text: "51.2" },
          { key: "B", text: "80" },
          { key: "C", text: "64" },
          { key: "D", text: "40" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "等重列式", lines: ["n ∝ V ⇒ 5 M_{X} = 4 × 64", "M_{X} = frac{256}{5} = 51.2"] },
          { title: "驗算", lines: ["5 × 51.2 = 256 = 4 × 64 ✓"], note: "80 是體積比倒過來，錯" }
        ]
      }
    ],
    basis: "【確認】重算甲分子量 16、乙 36，再逐項判斷密度與分子數，正確為三項，與答案一致。"
  },

  "tm_28_q57": {
    keyPoint: "直接用 n = PV/RT，體溫 37°C 要換成 310 K；粗估 1 mol 氣體在體溫下約 25 L。",
    formulas: [
      "n = frac{PV}{RT}，R = 0.082 atm·L/(mol·K)",
      "T = t + 273"
    ],
    whyWrong: {
      D: "0.7 比正確值大了約 7 倍；最常見的原因是溫度沒換成 K（直接用 37 代入會得到約 0.8），代入前先確認單位。",
      A: "0.05 約為正確值的一半，代入的數字有誤（例如體積或溫度多乘了 2）。",
      C: "0.4 比正確值大 4 倍，單位或代入的數字有誤。",
      E: "1 mol 氣體在體溫下約 25 L，2.5 L 只有十分之一。"
    },
    steps: [
      { title: "統一單位", lines: ["T = 37 + 273 = 310 K", "P = 1 atm，V = 2.5 L"] },
      { title: "代入公式", lines: [
        "n = frac{PV}{RT}",
        "= frac{1 × 2.5}{0.082 × 310}",
        "= frac{2.5}{25.42}",
        "≈ 0.098 ≈ 0.1 mol"
      ] },
      { title: "驗算", lines: [
        "0.1 × 0.082 × 310 ≈ 2.54 L ≈ 2.5 L ✓",
        "粗估：1 mol 在 310 K 約 25 L ⇒ 2.5 L ≈ 0.1 mol ✓"
      ] }
    ],
    traps: [
      "溫度一定要用 K：37°C = 310 K。",
      "記住「1 mol 氣體約 22.4～25 L」，可以秒估答案的數量級。"
    ],
    references: [
      { title: "【觀念】理想氣體方程式", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/Ub7qvuO8Hf8", kind: "影片" },
      { title: "高三上物理 1-5 理想氣體方程式（5）：絕對溫度 0 K", source: "均一教育平台", url: "https://www.junyiacademy.org/video/nt0pBRp2q-c?parent-topic-id=junyi-heat", kind: "影片" },
      { title: "氣體定律", source: "教育百科（國家教育研究院）", url: "https://pedia.cloud.edu.tw/Entry/Detail/?title=%E6%B0%A3%E9%AB%94%E5%AE%9A%E5%BE%8B", kind: "文章" }
    ],
    variants: [
      {
        question: "27°C、1 atm 下，4.92 L 的氣體為多少莫耳？",
        options: [
          { key: "A", text: "0.20" },
          { key: "B", text: "2.2" },
          { key: "C", text: "0.22" },
          { key: "D", text: "0.020" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "代入", lines: ["n = frac{1 × 4.92}{0.082 × 300}", "= frac{4.92}{24.6}", "= 0.20 mol"], note: "用 27 代入會得 2.2；用 22.4 L 會得 0.22（那是 0°C 的莫耳體積）" },
          { title: "驗算", lines: ["0.20 × 24.6 = 4.92 ✓"] }
        ]
      },
      {
        question: "0.50 mol 氣體在 127°C 時裝在 8.2 L 容器中，壓力為幾 atm？",
        options: [
          { key: "A", text: "2.0" },
          { key: "B", text: "0.64" },
          { key: "C", text: "1.0" },
          { key: "D", text: "4.0" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "代入", lines: ["T = 127 + 273 = 400 K", "P = frac{0.50 × 0.082 × 400}{8.2}", "= frac{16.4}{8.2} = 2.0 atm"] },
          { title: "驗算", lines: ["2.0 × 8.2 = 16.4 = 0.50 × 0.082 × 400 ✓"] }
        ]
      }
    ],
    basis: "【確認】n = 2.5 ÷ (0.082 × 310) ≈ 0.098 ≈ 0.1 mol，與正確答案一致；錯誤選項的成因為【推論】。"
  },

  "tm_28_q47": {
    keyPoint: "汞柱封氣：找出「氣體實際承受的壓力」——水平時 = P，管口朝上 = P + a，朝下 = P − a；再用 P₁V₁ = P₂V₂，截面相同時體積用長度代替。",
    formulas: [
      "波以耳定律：P_{1} V_{1} = P_{2} V_{2}（定溫）",
      "管口朝上：P_{氣} = P_{大氣} + 汞柱長",
      "管口朝下：P_{氣} = P_{大氣} − 汞柱長",
      "截面積相同 ⇒ V ∝ 氣柱長"
    ],
    whyWrong: {
      E: "分母 Pℓ + a 把「壓力×長度」和「長度」相加，單位不一致；氣體承受的壓力應是 P + a。",
      B: "P − a 是管口朝下時氣體的壓力；管口朝上時汞柱壓在氣體上，壓力是 P + a。",
      C: "這是答案的倒數，單位變成「1/長度」，不是長度。",
      D: "倒數形式且用了 P − a，單位與方向都錯。"
    },
    steps: [
      { title: "水平時", lines: ["汞柱水平，不對氣體施加額外壓力", "⇒ P_{1} = P，氣柱長 ℓ"] },
      { title: "管口朝上", lines: ["汞柱壓在氣體上方", "⇒ P_{2} = P + a，氣柱長 L"] },
      { title: "波以耳定律", lines: [
        "P_{1} V_{1} = P_{2} V_{2}",
        "P ℓ = ( P + a ) L",
        "L = frac{P ℓ}{P + a}"
      ] },
      { title: "合理性驗算", lines: [
        "P + a > P ⇒ L < ℓ ✓（壓力變大，氣柱變短）",
        "a = 0 時 ⇒ L = ℓ ✓"
      ] }
    ],
    traps: [
      "先畫圖：汞柱在氣體上方 ⇒ 加；在下方（管口朝下）⇒ 減。",
      "答案要是長度，用單位檢查可以直接刪掉倒數與單位不一致的選項。",
      "壓力變大氣柱一定變短，用這點確認答案方向。"
    ],
    references: [
      { title: "【觀念】波以耳定律", source: "均一教育平台", url: "https://www.junyiacademy.org/video/xoCE_fBonO4?parent-topic-id=main-seni-ph-ele2-4", kind: "影片" },
      { title: "【例題】密閉系統內的氣體壓力計算", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/middle-school-physics-chemistry/s4zyl-/v/T8jk-FDr1DM", kind: "影片" },
      { title: "高三上物理 1-5 理想氣體方程式（3）：1 標準大氣壓與托里切利實驗", source: "均一教育平台", url: "https://www.junyiacademy.org/video/3-PWACY6LRc?parent-topic-id=junyi-heat", kind: "影片" }
    ],
    variants: [
      {
        question: "一端封閉的細玻璃管內有 19 cm 汞柱，水平放置時封入的空氣柱長 20 cm。大氣壓力為 76 cmHg，將管口垂直朝下時，空氣柱長約為多少 cm？",
        options: [
          { key: "A", text: "26.7" },
          { key: "B", text: "16.0" },
          { key: "C", text: "20.0" },
          { key: "D", text: "25.0" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "找壓力", lines: ["水平：P_{1} = 76", "管口朝下：P_{2} = 76 − 19 = 57"] },
          { title: "波以耳", lines: ["76 × 20 = 57 × L", "L = frac{1520}{57} ≈ 26.7 cm"], note: "用 76 + 19 會得 16.0，那是管口朝上" },
          { title: "驗算", lines: ["57 × 26.7 ≈ 1520 ✓", "壓力變小 ⇒ 氣柱變長 ✓"] }
        ]
      },
      {
        question: "一端封閉的細玻璃管內有 25 cm 汞柱，水平放置時封入的空氣柱長 20 cm。大氣壓力為 75 cmHg，將管口垂直朝上時，空氣柱長為多少 cm？",
        options: [
          { key: "A", text: "15" },
          { key: "B", text: "30" },
          { key: "C", text: "20" },
          { key: "D", text: "12" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "找壓力", lines: ["水平：P_{1} = 75", "管口朝上：P_{2} = 75 + 25 = 100"] },
          { title: "波以耳", lines: ["75 × 20 = 100 × L", "L = 15 cm"] },
          { title: "驗算", lines: ["100 × 15 = 1500 = 75 × 20 ✓"] }
        ]
      }
    ],
    basis: "【確認】由 Pℓ = (P + a)L 推得 Pℓ/(P + a)，並以 a = 0、壓力增大氣柱變短檢查合理性，與答案一致。"
  },

  "tm_28_q94": {
    keyPoint: "混合時若會反應，要先用 PV（∝ 莫耳數）算反應後剩下的氣體，生成的固體不算壓力。",
    formulas: [
      "定溫：n ∝ PV，可直接用 PV 當莫耳數比較",
      "NH₃(g) + HCl(g) → NH₄Cl(s)（1：1）",
      "P_{最終} = frac{剩餘氣體 PV 總和}{V_{容器}}"
    ],
    whyWrong: {
      D: "以為氨氣仍是 3 atm；但氨氣從 3 L 擴散到 4 L，且有一部分被氯化氫消耗，壓力一定下降。",
      C: "2.5 = (9 + 1) ÷ 4，只做混合、忘了氨與氯化氫會反應生成固體氯化銨。"
    },
    steps: [
      { title: "用 PV 代表莫耳數", lines: ["NH₃：3 × 3 = 9", "HCl：1 × 1 = 1"] },
      { title: "反應", lines: [
        "NH₃(g) + HCl(g) → NH₄Cl(s)",
        "1：1 反應，HCl 全部用完",
        "剩餘 NH₃：9 − 1 = 8"
      ] },
      { title: "最終壓力", lines: ["P × 4 = 8", "P = 2.0 atm"] },
      { title: "驗算", lines: [
        "NH₄Cl 是固體，不貢獻氣體壓力 ✓",
        "若沒有反應：P = frac{10}{4} = 2.5，比 2.0 大 ⇒ 反應使氣體變少 ✓"
      ] }
    ],
    traps: [
      "看到 NH₃ 與 HCl、H₂ 與 O₂ 等組合，先想會不會反應。",
      "產物是固體或液體時不計入氣體壓力。",
      "定溫下用 PV 比較即可，不必算出真正的莫耳數。"
    ],
    references: [
      { title: "【觀念】道耳頓分壓定律", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/UV1DPXzVruE", kind: "影片" },
      { title: "【觀念】理想氣體方程式", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/Ub7qvuO8Hf8", kind: "影片" },
      { title: "【觀念】波以耳定律", source: "均一教育平台", url: "https://www.junyiacademy.org/video/xoCE_fBonO4?parent-topic-id=main-seni-ph-ele2-4", kind: "影片" }
    ],
    variants: [
      {
        question: "定溫下，將 2.0 atm 的 H₂ 2.0 L 與 3.0 atm 的 O₂ 2.0 L 置於 4.0 L 容器中點火，完全反應生成液態水（忽略水蒸氣壓），最終壓力為幾 atm？",
        options: [
          { key: "A", text: "1.0" },
          { key: "B", text: "2.5" },
          { key: "C", text: "0" },
          { key: "D", text: "1.5" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "PV 比較", lines: ["H₂：2.0 × 2.0 = 4.0", "O₂：3.0 × 2.0 = 6.0"] },
          { title: "反應", lines: ["2H₂ + O₂ → 2H₂O(l)", "H₂ 4.0 用掉 O₂ 2.0", "剩 O₂：6.0 − 2.0 = 4.0"] },
          { title: "最終壓力", lines: ["P = frac{4.0}{4.0} = 1.0 atm"] },
          { title: "驗算", lines: ["H₂：O₂ 消耗 4.0：2.0 = 2：1 ✓"] }
        ]
      },
      {
        question: "定溫下，將 2.0 atm 的 NH₃ 2.0 L 與 2.0 atm 的 HCl 3.0 L 置於 5.0 L 容器中，最終壓力為幾 atm？",
        options: [
          { key: "A", text: "0.40" },
          { key: "B", text: "2.0" },
          { key: "C", text: "0.80" },
          { key: "D", text: "1.2" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "PV 比較", lines: ["NH₃：2.0 × 2.0 = 4.0", "HCl：2.0 × 3.0 = 6.0"] },
          { title: "反應", lines: ["1：1 反應，NH₃ 用完", "剩 HCl：6.0 − 4.0 = 2.0"] },
          { title: "最終壓力", lines: ["P = frac{2.0}{5.0} = 0.40 atm"], note: "沒考慮反應會得 2.0，錯" },
          { title: "驗算", lines: ["0.40 × 5.0 = 2.0 ✓"] }
        ]
      }
    ],
    basis: "【確認】以 PV 計算剩餘 NH₃ 為 8 atm·L，除以 4 L 得 2.0 atm，與答案一致。"
  },

  "tm_28_q80": {
    keyPoint: "理想氣體的兩個假設：分子本身體積可忽略、分子間作用力可忽略；同溫同壓下莫耳體積與種類無關，但密度、等質量的莫耳數都與分子量有關。",
    formulas: [
      "PV = nRT",
      "密度 d = frac{PM}{RT}（與分子量 M 有關）",
      "莫耳體積 V_{m} = frac{RT}{P}（與種類無關）",
      "n = frac{w}{M}"
    ],
    whyWrong: {
      E: "這個敘述本身正確；錯在只選它，漏選「分子間作用力可忽略」——這是理想氣體的基本假設。",
      A: "PV 只有在定量、定溫時才是定值，少了條件就不成立。",
      C: "d = PM/RT，同溫同壓下密度與分子量成正比，和種類有關。",
      D: "等質量時 n = w/M，分子量不同莫耳數就不同。"
    },
    steps: [
      { title: "理想氣體假設", lines: [
        "分子本身體積可忽略",
        "分子間作用力可忽略",
        "⇒ 完全遵守 PV = nRT"
      ] },
      { title: "逐項判斷", lines: [
        "PV 為定值：缺「定量、定溫」條件 ⇒ 錯",
        "分子間作用力可忽略：基本假設 ⇒ 正確",
        "密度 d = frac{PM}{RT}：含 M ⇒ 與種類有關 ⇒ 錯",
        "等質量 n = frac{w}{M}：M 不同 ⇒ 莫耳數不同 ⇒ 錯",
        "同溫同壓 V_{m} = frac{RT}{P}：與種類無關 ⇒ 正確"
      ] },
      { title: "STP 代數字驗算", lines: [
        "1 g H₂：n = 0.5 mol；1 g O₂：n ≈ 0.031 mol ⇒ 等質量莫耳數不同 ✓",
        "H₂ 密度 frac{2}{22.4} ≈ 0.089 g/L，O₂ 密度 frac{32}{22.4} ≈ 1.43 g/L ⇒ 密度不同 ✓"
      ] }
    ],
    traps: [
      "多選題選出一個正確選項後別停，其他敘述也要一一驗證。",
      "「分子間作用力可忽略」「分子體積可忽略」是理想氣體定義，必考。",
      "「與種類無關」的只有莫耳體積（同溫同壓），密度與質量相關的量都和分子量有關。"
    ],
    references: [
      { title: "2. 理想氣體粒子模型", source: "均一教育平台", url: "https://www.junyiacademy.org/video/zgyi05zBnfA?parent-topic-id=j-d-che-u1-7", kind: "影片" },
      { title: "6. 理想氣體與真實氣體的差異", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/junyi-chemistry/v1217-new-topic-1/j-d-che-u1/j-d-che-u1-7/v/fY0cp1Uj9kY", kind: "影片" },
      { title: "【觀念】理想氣體方程式", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/Ub7qvuO8Hf8", kind: "影片" }
    ],
    variants: [
      {
        question: "同溫同壓下，下列關於理想氣體的量，何者與氣體種類無關？",
        options: [
          { key: "A", text: "莫耳體積" },
          { key: "B", text: "密度" },
          { key: "C", text: "1 克氣體的莫耳數" },
          { key: "D", text: "1 公升氣體的質量" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "逐項判斷", lines: [
            "V_{m} = frac{RT}{P}：無 M ⇒ 與種類無關 ✓",
            "d = frac{PM}{RT}：含 M ⇒ 有關",
            "1 克莫耳數 = frac{1}{M} ⇒ 有關",
            "1 公升質量 = 密度 × 1 ⇒ 有關"
          ] }
        ]
      },
      {
        question: "真實氣體在下列哪一種條件下，行為最接近理想氣體？",
        options: [
          { key: "A", text: "高溫、低壓" },
          { key: "B", text: "低溫、高壓" },
          { key: "C", text: "低溫、低壓" },
          { key: "D", text: "高溫、高壓" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "判斷", lines: [
            "低壓 ⇒ 分子間距大，分子本身體積相對可忽略",
            "高溫 ⇒ 分子動能大，分子間作用力相對可忽略",
            "⇒ 高溫、低壓最接近理想氣體 ✓"
          ] }
        ]
      }
    ],
    basis: "【確認】依理想氣體假設與 d = PM/RT、n = w/M 逐項判斷，並以 STP 下 H₂、O₂ 代數字驗算，正確為兩項，與答案一致。"
  },

  "tm_28_q68": {
    keyPoint: "用 PV = nRT 求出莫耳數，再用 M = 質量 ÷ 莫耳數求分子量，最後比對各分子的分子量。",
    formulas: [
      "n = frac{PV}{RT}",
      "M = frac{w}{n} = frac{wRT}{PV}",
      "760 mmHg = 1 atm；1000 mL = 1 L；T = t + 273"
    ],
    whyWrong: {
      E: "N₂O₄ 的分子量是 92，約為算出的 44 的 2 倍；若得到 92，表示莫耳數只算了一半，檢查體積與溫度的換算。",
      B: "NO₂ 分子量 46，與算出的 44 不符；CO₂ 的 44 才吻合。",
      A: "NO 分子量 30，與 44 差很多。",
      C: "CO 分子量 28，與 44 差很多。"
    },
    steps: [
      { title: "統一單位", lines: [
        "P = 760.0 mmHg = 1.00 atm",
        "V = 300.0 mL = 0.3000 L",
        "T = 27 + 273 = 300 K"
      ] },
      { title: "求莫耳數", lines: [
        "n = frac{1.00 × 0.300}{0.082 × 300}",
        "= frac{0.300}{24.6}",
        "≈ 0.0122 mol"
      ] },
      { title: "求分子量", lines: ["M = frac{0.537}{0.0122}", "≈ 44 g/mol"] },
      { title: "比對選項", lines: [
        "NO 30、NO₂ 46、CO 28、CO₂ 44、N₂O₄ 92",
        "⇒ CO₂ = 12 + 2 × 16 = 44 ✓"
      ] },
      { title: "驗算", lines: [
        "n = frac{0.537}{44} ≈ 0.0122 mol",
        "V = 0.0122 × 0.082 × 300 ≈ 0.300 L ✓"
      ] }
    ],
    traps: [
      "mL 要換成 L、°C 要換成 K，任何一個漏掉都會差很多倍。",
      "算出的分子量接近兩個選項時（44 與 46），用有效數字判斷，44 與 CO₂ 完全吻合。"
    ],
    references: [
      { title: "【觀念】理想氣體方程式", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/Ub7qvuO8Hf8", kind: "影片" },
      { title: "【觀念】亞佛加厥定律", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/EOl8UCr_iuE", kind: "影片" },
      { title: "4. 查理定律與亞佛加厥定律", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/junyi-chemistry/v1217-new-topic-1/j-d-che-u1/j-d-che-u1-7/v/Tn4SrtHiVZ4", kind: "影片" }
    ],
    variants: [
      {
        question: "0.64 g 某氣體在 0°C、1 atm 下佔 224 mL，此氣體可能為何？（S＝32、O＝16、C＝12）",
        options: [
          { key: "A", text: "SO₂" },
          { key: "B", text: "O₂" },
          { key: "C", text: "SO₃" },
          { key: "D", text: "CO₂" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "莫耳數", lines: ["n = frac{0.224}{22.4} = 0.0100 mol"] },
          { title: "分子量", lines: ["M = frac{0.64}{0.0100} = 64"] },
          { title: "比對驗算", lines: ["SO₂ = 32 + 2 × 16 = 64 ✓", "O₂ 32、SO₃ 80、CO₂ 44 ⇒ 不符"] }
        ]
      },
      {
        question: "27°C、1 atm 下，1.23 L 某氣體重 1.60 g，此氣體可能為何？（N＝14、O＝16、C＝12、H＝1、Ar＝40）",
        options: [
          { key: "A", text: "O₂" },
          { key: "B", text: "N₂" },
          { key: "C", text: "CH₄" },
          { key: "D", text: "Ar" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "莫耳數", lines: ["n = frac{1 × 1.23}{0.082 × 300}", "= frac{1.23}{24.6} = 0.0500 mol"] },
          { title: "分子量", lines: ["M = frac{1.60}{0.0500} = 32"] },
          { title: "比對驗算", lines: ["O₂ = 32 ✓", "N₂ 28、CH₄ 16、Ar 40 ⇒ 不符"] }
        ]
      }
    ],
    basis: "【確認】重算 n ≈ 0.0122 mol、M ≈ 44，並代回 PV = nRT 驗算體積 0.300 L，與答案 CO₂ 一致。"
  },

  "tm_76_q1": {
    keyPoint: "開口式壓力計：先把液柱高度換成汞柱（÷13.6 再乘液體密度），再看哪一端液面高——開口端較高代表氣體壓力大於大氣壓，要加。",
    formulas: [
      "h_{汞} = frac{d_{液} × h_{液}}{13.6}",
      "開口端液面較高：P_{氣} = P_{大氣} + h_{汞}",
      "氣體端液面較高：P_{氣} = P_{大氣} − h_{汞}"
    ],
    whyWrong: {
      D: "590 = 750 − 160：液柱高度沒換成汞柱，而且方向也錯——開口端液面較高代表氣體壓力比大氣大，要用加的。",
      B: "730 = 750 − 20：汞柱換算對了，但方向相反；開口端較高要加 20。",
      C: "910 = 750 + 160：方向對了，但 16.0 cm 液柱沒有換算成汞柱。"
    },
    steps: [
      { title: "液柱換汞柱", lines: [
        "h = 16.0 cm = 160 mm",
        "1.70 × 160 = 13.6 × h_{汞}",
        "h_{汞} = frac{272}{13.6} = 20.0 mm"
      ] },
      { title: "判斷方向", lines: [
        "開口端液面較高 ⇒ 氣體把液體推向開口端",
        "⇒ P_{氣} > P_{大氣}"
      ] },
      { title: "計算", lines: ["P_{氣} = 750 + 20", "= 770 mmHg"] },
      { title: "驗算", lines: [
        "以氣體端液面為基準：左邊 770，右邊 750 + 20 = 770 ✓",
        "13.6 × 20.0 = 272 = 1.70 × 160 ✓"
      ] }
    ],
    traps: [
      "非汞液體一定要先換成汞柱，密度比是 frac{1.70}{13.6}。",
      "看哪一端液面被「推」下去：氣體端液面低 ⇒ 氣體壓力大 ⇒ 加。",
      "cm 要換 mm，因為答案單位是 mmHg。"
    ],
    references: [
      { title: "絕對壓力（錶壓＋大氣壓、以液柱高度度量壓力）", source: "科學Online（臺灣大學）", url: "https://case.ntu.edu.tw/highscope/%E7%B5%95%E5%B0%8D%E5%A3%93%E5%8A%9B/index.html", kind: "文章" },
      { title: "氣壓計（Barometer）", source: "科學Online（臺灣大學）", url: "https://case.ntu.edu.tw/highscope/%E6%B0%A3%E5%A3%93%E8%A8%88barometer/index.html", kind: "文章" },
      { title: "【例題】大氣壓力的單位換算（指考物理 106）", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-phy/main-seni-ph-ele2/main-seni-ph-ele2-4/v/TMQ1SnrEeRQ", kind: "影片" }
    ],
    variants: [
      {
        question: "以裝汞的開口式壓力計測氣體壓力，大氣壓力為 760 mmHg，氣體端液面比開口端液面高 50 mm，氣體壓力為多少 mmHg？",
        options: [
          { key: "A", text: "710" },
          { key: "B", text: "810" },
          { key: "C", text: "760" },
          { key: "D", text: "50" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "判斷方向", lines: ["氣體端液面較高 ⇒ 大氣把液體推向氣體端", "⇒ P_{氣} < P_{大氣}"] },
          { title: "計算", lines: ["P_{氣} = 760 − 50 = 710 mmHg"] },
          { title: "驗算", lines: ["以開口端液面為基準：710 + 50 = 760 ✓"] }
        ]
      },
      {
        question: "開口式壓力計內裝水（密度 1.00 g/mL，汞 13.6 g/mL），大氣壓力為 760 mmHg，開口端液面比氣體端高 27.2 cm，氣體壓力為多少 mmHg？",
        options: [
          { key: "A", text: "780" },
          { key: "B", text: "740" },
          { key: "C", text: "1032" },
          { key: "D", text: "488" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "換汞柱", lines: ["h = 27.2 cm = 272 mm", "h_{汞} = frac{1.00 × 272}{13.6} = 20 mm"] },
          { title: "計算", lines: ["開口端較高 ⇒ 加", "P_{氣} = 760 + 20 = 780 mmHg"], note: "1032 是沒換成汞柱，740 是方向相反" },
          { title: "驗算", lines: ["13.6 × 20 = 272 ✓"] }
        ]
      }
    ],
    basis: "【確認】160 × 1.70 ÷ 13.6 = 20.0 mmHg，開口端較高故 750 + 20 = 770 mmHg，與答案一致；錯誤選項皆可對應到換算或方向錯誤。"
  },

  "tm_28_q75": {
    keyPoint: "定容時 P = frac{nR}{V} T：P–T 圖是通過原點的直線，斜率 frac{nR}{V}；體積變小，斜率變大，線變陡。",
    formulas: [
      "PV = nRT",
      "定容：P = frac{nR}{V} T ⇒ P ∝ T（T 用絕對溫度）",
      "斜率 k = frac{nR}{V}：V 變小 ⇒ k 變大"
    ],
    whyWrong: {
      E: "丁線向下彎曲趨平，表示 P 與 T 不成正比；理想氣體定容時 P ∝ T，一定是通過原點的直線。",
      A: "丙是原來體積的線；體積壓小後斜率 frac{nR}{V} 變大，不會和原線重合。",
      C: "戊比丙平緩，斜率較小，對應的是體積「變大」的情況。",
      D: "乙向上彎曲，同樣不是正比關係；理想氣體不會出現曲線。"
    },
    steps: [
      { title: "寫出定容關係", lines: [
        "PV = nRT",
        "⇒ P = frac{nR}{V} T",
        "⇒ P–T 圖：通過原點的直線，斜率 k = frac{nR}{V}"
      ] },
      { title: "比較斜率", lines: [
        "n、R 不變，V_{2} < V_{1}",
        "⇒ k_{2} = frac{nR}{V_{2}} > frac{nR}{V_{1}} = k_{1}",
        "⇒ 新線是比丙更陡的直線 ⇒ 甲"
      ] },
      { title: "代數字驗算", lines: [
        "設 n = 1 mol，T = 300 K",
        "V_{1} = 24.6 L：P = frac{1 × 0.082 × 300}{24.6} = 1 atm",
        "V_{2} = 12.3 L：P = frac{1 × 0.082 × 300}{12.3} = 2 atm",
        "⇒ 同溫下壓力變大，斜率變 2 倍 ✓"
      ] }
    ],
    traps: [
      "理想氣體在 P–T、V–T 圖上都是直線，曲線先排除。",
      "斜率看「常數部分」：定容時是 frac{nR}{V}，V 在分母。",
      "溫度軸若用 °C，直線不會通過原點；本題通過原點代表用 K。"
    ],
    references: [
      { title: "【觀念】理想氣體方程式", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/Ub7qvuO8Hf8", kind: "影片" },
      { title: "4. 查理定律與亞佛加厥定律", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/junyi-chemistry/v1217-new-topic-1/j-d-che-u1/j-d-che-u1-7/v/Tn4SrtHiVZ4", kind: "影片" },
      { title: "氣體定律", source: "教育部 教育百科", url: "https://pedia.cloud.edu.tw/Entry/Detail/?title=%E6%B0%A3%E9%AB%94%E5%AE%9A%E5%BE%8B", kind: "文章" }
    ],
    variants: [
      {
        question: "定壓下測得某理想氣體的 V–T（K）圖為通過原點的直線。若把外加壓力增大後固定，再做同樣實驗，新的圖形為何？",
        options: [
          { key: "A", text: "通過原點、比原線平緩的直線" },
          { key: "B", text: "通過原點、比原線陡的直線" },
          { key: "C", text: "與原線重合" },
          { key: "D", text: "向上彎曲的曲線" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "寫出關係", lines: ["V = frac{nR}{P} T", "⇒ 斜率 = frac{nR}{P}"] },
          { title: "比較", lines: ["P 變大，在分母", "⇒ 斜率變小 ⇒ 線變平緩"] },
          { title: "驗算", lines: ["P 由 1 atm 變 2 atm", "⇒ 同溫下 V 變一半 ⇒ 斜率變一半 ✓"] }
        ]
      },
      {
        question: "定容容器內的理想氣體，P–T（K）圖為通過原點的直線。若在相同體積下改裝入 2 倍莫耳數的同種氣體，新的圖形為何？",
        options: [
          { key: "A", text: "通過原點、斜率為原來 2 倍的直線" },
          { key: "B", text: "通過原點、斜率為原來一半的直線" },
          { key: "C", text: "與原線平行、截距較大的直線" },
          { key: "D", text: "與原線重合" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "寫出斜率", lines: ["P = frac{nR}{V} T", "⇒ 斜率 = frac{nR}{V}"] },
          { title: "比較", lines: ["n 變 2 倍，在分子", "⇒ 斜率變 2 倍，仍通過原點"] },
          { title: "驗算", lines: ["T = 0 K 時 P = 0 ⇒ 仍過原點 ✓", "同溫下 P 變 2 倍 ✓"] }
        ]
      }
    ],
    basis: "【確認】由 PV = nRT 推得定容斜率 nR/V，並以 24.6 L、12.3 L 代值驗算，體積減半壓力加倍，與答案甲線一致。"
  },

  "tm_109_q21": {
    keyPoint: "需求與供給同時增加：兩者都讓數量增加，所以數量一定增加；對價格的影響方向相反，價格要看幅度，無法確定。",
    formulas: [
      "需求增加：價格↑、數量↑",
      "供給增加：價格↓、數量↑",
      "同向變動 ⇒ 數量確定、價格不確定",
      "反向變動 ⇒ 價格確定、數量不確定"
    ],
    whyWrong: {
      C: "價格不變只發生在兩者增加幅度剛好相同時，題目問「一定成立」，不能選。",
      B: "價格下降要供給增幅大於需求增幅才成立，不是一定。",
      D: "價格上升要需求增幅大於供給增幅才成立，不是一定。"
    },
    steps: [
      { title: "分開看兩個變動", lines: [
        "需求增加 ⇒ 價格↑、數量↑",
        "供給增加 ⇒ 價格↓、數量↑"
      ] },
      { title: "合併判斷", lines: [
        "數量：↑ 加 ↑ ⇒ 一定增加",
        "價格：↑ 加 ↓ ⇒ 看哪邊幅度大 ⇒ 不確定"
      ] },
      { title: "用數字驗算三種幅度", lines: [
        "原本：Q_{d} = 100 − P，Q_{s} = P − 20 ⇒ P = 60，Q = 40",
        "同幅各 +20：120 − P = P ⇒ P = 60，Q = 60",
        "需求 +40、供給 +20：140 − P = P ⇒ P = 70，Q = 70",
        "需求 +20、供給 +40：120 − P = P + 20 ⇒ P = 50，Q = 70",
        "⇒ 價格可升、可降、可不變；數量都 > 40 ✓"
      ] }
    ],
    traps: [
      "「一定成立」的題目，只能選每種幅度下都對的敘述。",
      "價格不變也是「不確定」的一種可能，不是必然結果。",
      "口訣：同向變動看數量，反向變動看價格。"
    ],
    references: [
      { title: "供需（線）同時移動", source: "陳碩老師經濟學（痞客邦）", url: "https://sochen1010.pixnet.net/blog/posts/9261581678", kind: "文章" },
      { title: "【觀念】需求法則、供給法則、均衡點", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-society/middle-school-civics/h4cjj-/h4cjj-d/v/EyTeCp0y5Js", kind: "影片" },
      { title: "經濟學原理 06. Supply and Demand (II)（臺大 林明仁）", source: "均一教育平台", url: "https://www.junyiacademy.org/video/KaxzicvlKhg?parent-topic-id=ocw-102s116", kind: "影片" }
    ],
    variants: [
      {
        question: "某商品的需求減少，同時供給增加。下列何者一定成立？",
        options: [
          { key: "A", text: "均衡價格下降" },
          { key: "B", text: "均衡數量減少" },
          { key: "C", text: "均衡數量增加" },
          { key: "D", text: "均衡價格上升" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "分開看", lines: ["需求減少 ⇒ 價格↓、數量↓", "供給增加 ⇒ 價格↓、數量↑"] },
          { title: "合併", lines: ["價格：↓ 加 ↓ ⇒ 一定下降", "數量：↓ 加 ↑ ⇒ 不確定"] },
          { title: "驗算", lines: ["Q_{d} = 80 − P，Q_{s} = P ⇒ P = 40", "比原本 P = 60 低 ✓"] }
        ]
      },
      {
        question: "某商品的需求增加，同時供給減少。下列何者一定成立？",
        options: [
          { key: "A", text: "均衡價格上升" },
          { key: "B", text: "均衡數量增加" },
          { key: "C", text: "均衡數量減少" },
          { key: "D", text: "均衡價格不變" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "分開看", lines: ["需求增加 ⇒ 價格↑、數量↑", "供給減少 ⇒ 價格↑、數量↓"] },
          { title: "合併", lines: ["價格：↑ 加 ↑ ⇒ 一定上升", "數量：↑ 加 ↓ ⇒ 不確定"] },
          { title: "驗算", lines: ["Q_{d} = 120 − P，Q_{s} = P − 40 ⇒ P = 80", "比原本 P = 60 高 ✓"] }
        ]
      }
    ],
    basis: "【確認】與題目所附課本 p.69 一致；並以線性供需數例驗算三種幅度，數量皆增加、價格方向不定。"
  },

  "tm_109_q1": {
    keyPoint: "均衡點是「需求量＝供給量」的那一列：表中只有 40 元時兩者都是 60 個。",
    formulas: [
      "均衡：Q_{d} = Q_{s}",
      "Q_{d} > Q_{s}：超額需求 ⇒ 價格上漲",
      "Q_{d} < Q_{s}：超額供給 ⇒ 價格下跌"
    ],
    whyWrong: {
      A: "30 元時需求量 70、供給量只有 50，有 20 個超額需求，價格會被推高；70 只是需求量，不是成交量。",
      B: "50 元時供給量 80、需求量只有 40，有 40 個超額供給，價格會下跌；80 只是供給量。",
      D: "表中沒有 35 元這一列；60 個只在 40 元時同時是需求量與供給量。"
    },
    steps: [
      { title: "逐列算 Q_{d} − Q_{s}", lines: [
        "20 元：90 − 30 = 60 ⇒ 超額需求",
        "30 元：70 − 50 = 20 ⇒ 超額需求",
        "40 元：60 − 60 = 0 ⇒ 均衡",
        "50 元：40 − 80 = −40 ⇒ 超額供給"
      ] },
      { title: "結論", lines: [
        "均衡價格 = 40 元",
        "均衡數量 = 60 個"
      ] },
      { title: "驗算", lines: [
        "40 元時需求量 60 = 供給量 60 ✓",
        "比 40 元低 ⇒ 超額需求、價格上升；比 40 元高 ⇒ 超額供給、價格下降 ⇒ 會回到 40 元 ✓"
      ] }
    ],
    traps: [
      "均衡數量要同時等於需求量和供給量，不能只看一邊。",
      "不要把兩個價格平均，要找表中 Q_{d} = Q_{s} 的那一列。",
      "非均衡價格下，實際成交量是兩者中較小的那個。"
    ],
    references: [
      { title: "【觀念】需求法則、供給法則、均衡點", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-society/middle-school-civics/h4cjj-/h4cjj-d/v/EyTeCp0y5Js", kind: "影片" },
      { title: "經濟學原理 06. Supply and Demand (II)（臺大 林明仁）", source: "均一教育平台", url: "https://www.junyiacademy.org/video/KaxzicvlKhg?parent-topic-id=ocw-102s116", kind: "影片" }
    ],
    variants: [
      {
        question: "某市場：10 元時需求量 50、供給量 10；20 元時需求量 40、供給量 25；30 元時需求量 30、供給量 30；40 元時需求量 20、供給量 35。均衡價格與均衡數量為何？",
        options: [
          { key: "A", text: "30 元、30 個" },
          { key: "B", text: "20 元、40 個" },
          { key: "C", text: "40 元、35 個" },
          { key: "D", text: "25 元、35 個" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "逐列比較", lines: ["10 元：50 − 10 = 40", "20 元：40 − 25 = 15", "30 元：30 − 30 = 0 ⇒ 均衡", "40 元：20 − 35 = −15"] },
          { title: "驗算", lines: ["30 元時需求量 = 供給量 = 30 ✓"] }
        ]
      },
      {
        question: "承原題的表（30 元時需求量 70、供給量 50），若價格停在 30 元，市場會出現什麼情況？",
        options: [
          { key: "A", text: "超額需求 20 個，價格會上漲" },
          { key: "B", text: "超額供給 20 個，價格會下跌" },
          { key: "C", text: "已達均衡，價格不變" },
          { key: "D", text: "超額需求 20 個，價格會下跌" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "比較", lines: ["Q_{d} − Q_{s} = 70 − 50 = 20 > 0", "⇒ 超額需求 20 個"] },
          { title: "調整方向", lines: ["買不到的人願意出更高價", "⇒ 價格上漲，往 40 元移動 ✓"] }
        ]
      }
    ],
    basis: "【確認】逐列比較需求量與供給量，只有 40 元時兩者相等（60 個），與答案一致。"
  },

  "tm_109_q27": {
    keyPoint: "稻作轉作讓供給減少、飲食西化讓需求減少：兩者都使數量減少，數量一定減少；對價格的影響相反，價格無法確定。",
    formulas: [
      "供給減少：價格↑、數量↓",
      "需求減少：價格↓、數量↓",
      "同向變動 ⇒ 數量確定、價格不確定"
    ],
    whyWrong: {
      D: "把確定與不確定弄反了：兩者同向減少時，數量一定減少；價格才是無法確定。",
      A: "價格不一定下降，只有需求減幅大於供給減幅時才會下降。",
      B: "價格不一定上升，只有供給減幅大於需求減幅時才會上升。"
    },
    steps: [
      { title: "判斷各是哪條線動", lines: [
        "輔導稻作轉作 ⇒ 種稻變少 ⇒ 供給減少（左移）",
        "飲食西化 ⇒ 吃米變少 ⇒ 需求減少（左移）"
      ] },
      { title: "合併判斷", lines: [
        "數量：↓ 加 ↓ ⇒ 一定減少",
        "價格：↑ 加 ↓ ⇒ 不確定"
      ] },
      { title: "用數字驗算", lines: [
        "原本：Q_{d} = 100 − P，Q_{s} = P − 20 ⇒ P = 60，Q = 40",
        "各減 20：80 − P = P − 40 ⇒ P = 60，Q = 20",
        "需求減 30、供給減 10：70 − P = P − 30 ⇒ P = 50，Q = 20",
        "需求減 10、供給減 30：90 − P = P − 50 ⇒ P = 70，Q = 20",
        "⇒ 數量都減少，價格可升可降 ✓"
      ] }
    ],
    traps: [
      "先分清楚每個事件動的是供給還是需求，再合併。",
      "同向變動（都增或都減）：數量確定；反向變動：價格確定。",
      "課本圖 3-11 的分區就是這四種組合。"
    ],
    references: [
      { title: "供需（線）同時移動", source: "陳碩老師經濟學（痞客邦）", url: "https://sochen1010.pixnet.net/blog/posts/9261581678", kind: "文章" },
      { title: "經濟學原理 06. Supply and Demand (II)（臺大 林明仁）", source: "均一教育平台", url: "https://www.junyiacademy.org/video/KaxzicvlKhg?parent-topic-id=ocw-102s116", kind: "影片" }
    ],
    variants: [
      {
        question: "新技術使某商品生產成本下降，同時它的替代品大幅降價。對該商品市場的判斷何者正確？",
        options: [
          { key: "A", text: "價格下降，數量無法確定" },
          { key: "B", text: "數量增加，價格無法確定" },
          { key: "C", text: "價格與數量都下降" },
          { key: "D", text: "價格上升，數量減少" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "判斷", lines: ["成本下降 ⇒ 供給增加 ⇒ 價格↓、數量↑", "替代品降價 ⇒ 需求減少 ⇒ 價格↓、數量↓"] },
          { title: "合併", lines: ["價格：↓ 加 ↓ ⇒ 一定下降", "數量：↑ 加 ↓ ⇒ 無法確定 ✓"] }
        ]
      },
      {
        question: "颱風使蔬菜產量減少，同時寒流讓火鍋店的蔬菜需求增加。對蔬菜市場的判斷何者正確？",
        options: [
          { key: "A", text: "價格上升，數量無法確定" },
          { key: "B", text: "數量減少，價格無法確定" },
          { key: "C", text: "價格與數量都上升" },
          { key: "D", text: "價格下降，數量增加" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "判斷", lines: ["產量減少 ⇒ 供給減少 ⇒ 價格↑、數量↓", "需求增加 ⇒ 價格↑、數量↑"] },
          { title: "合併", lines: ["價格：↑ 加 ↑ ⇒ 一定上升", "數量：↓ 加 ↑ ⇒ 無法確定 ✓"] }
        ]
      }
    ],
    basis: "【確認】與題目所附課本 p.81 一致（供給減少＋需求減少：數量減少、價格不確定）；並以三組數例驗算。"
  },

  "tm_109_q32": {
    keyPoint: "生產者剩餘＝市價－成本，只算「願意賣」的人；成本高於市價的人不會賣，剩餘是 0，不是負數。",
    formulas: [
      "生產者剩餘 = 市場價格 − 成本（願意接受的最低價格）",
      "成本 > 市價 ⇒ 不賣 ⇒ 剩餘 0",
      "消費者剩餘 = 願付價格 − 市場價格"
    ],
    whyWrong: {
      D: "把己的 40 − 50 = −10 算進去，和丁的 10 抵銷成 0；但己成本高於市價不會賣，不會有負的剩餘。",
      A: "30 是把每人都當成賺 10 元，忽略了各人成本不同。",
      C: "20 是把己的差距 10 當成正的剩餘；己根本不會賣。"
    },
    steps: [
      { title: "逐人判斷是否賣", lines: [
        "丁：成本 30 < 40 ⇒ 賣",
        "戊：成本 40 = 40 ⇒ 賣（剛好不賺不賠）",
        "己：成本 50 > 40 ⇒ 不賣"
      ] },
      { title: "計算剩餘", lines: [
        "丁 = 40 − 30 = 10",
        "戊 = 40 − 40 = 0",
        "己 = 0（沒有交易）"
      ] },
      { title: "加總與驗算", lines: [
        "合計 = 10 + 0 + 0 = 10 元",
        "檢查：沒有任何一人的剩餘是負數 ✓"
      ] }
    ],
    traps: [
      "剩餘不可能是負的：會虧錢的人就不會交易。",
      "成本剛好等於市價的人，剩餘是 0。",
      "生產者剩餘用「市價減成本」，消費者剩餘用「願付減市價」，方向別弄反。"
    ],
    references: [
      { title: "經濟學原理 09. Efficiency of Markets（臺大 林明仁）", source: "均一教育平台", url: "https://www.junyiacademy.org/video/eApmSuj7EMI?parent-topic-id=ocw-102s116", kind: "影片" },
      { title: "生產者剩餘", source: "MBA智庫百科", url: "https://wiki.mbalib.com/zh-tw/%E7%94%9F%E4%BA%A7%E8%80%85%E5%89%A9%E4%BD%99", kind: "文章" }
    ],
    variants: [
      {
        question: "一碗麵市價 60 元。甲、乙、丙三家店的成本分別是 40、55、70 元。三家的生產者剩餘合計是多少？",
        options: [
          { key: "A", text: "25 元" },
          { key: "B", text: "15 元" },
          { key: "C", text: "35 元" },
          { key: "D", text: "45 元" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "逐家計算", lines: ["甲 = 60 − 40 = 20", "乙 = 60 − 55 = 5", "丙：70 > 60 ⇒ 不賣 ⇒ 0"] },
          { title: "加總", lines: ["20 + 5 + 0 = 25 元"], note: "15 是把丙算成 −10；35 是把丙算成 +10" }
        ]
      },
      {
        question: "一杯咖啡市價 40 元。三位顧客願意付的最高價格分別是 60、45、35 元。三人的消費者剩餘合計是多少？",
        options: [
          { key: "A", text: "25 元" },
          { key: "B", text: "20 元" },
          { key: "C", text: "30 元" },
          { key: "D", text: "0 元" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "逐人計算", lines: ["60 − 40 = 20", "45 − 40 = 5", "35 < 40 ⇒ 不買 ⇒ 0"] },
          { title: "加總", lines: ["20 + 5 + 0 = 25 元 ✓"] }
        ]
      }
    ],
    basis: "【確認】與題目所附課本 p.75 一致：丁 10、戊 0、己不賣，合計 10 元。"
  },

  "tm_109_q46": {
    keyPoint: "效率是讓社會總福利最大，不是人人分一樣多；效率與公平常要取捨，要多公平由社會決定，經濟學負責說明各政策的影響。",
    formulas: [
      "效率：資源配置使社會總剩餘（消費者剩餘＋生產者剩餘）最大",
      "公平：分配是否合理，屬於價值判斷",
      "兩者常有抵換（取捨）關係"
    ],
    whyWrong: {
      E: "「一定」太絕對：管制可能帶來排隊、黑市、供給減少，不一定能達成政府希望的公平。",
      A: "漏選：追求效率與追求公平往往要互相取捨，這句是正確的。",
      B: "社會福利最大是效率的概念，不代表每個人得到相同好處。"
    },
    steps: [
      { title: "逐項判斷", lines: [
        "效率與公平有抵換關係 ⇒ 課本說法，正確",
        "福利最大＝人人一樣 ⇒ 混淆效率與平均分配，錯",
        "多公平由社會整體決定 ⇒ 公平是價值選擇，正確",
        "經濟學揭明政策影響 ⇒ 經濟學的角色，正確",
        "管制一定公平 ⇒ 「一定」過度，錯"
      ] },
      { title: "結論與檢查", lines: [
        "正確三項：抵換關係、社會決定公平、經濟學分析影響",
        "⇒ 學生漏了「抵換關係」，多選了「管制一定公平」"
      ] }
    ],
    traps: [
      "看到「一定」「每個人都」這類絕對字眼，先懷疑。",
      "效率回答「餅做多大」，公平回答「餅怎麼分」。",
      "經濟學能分析後果，但不替社會決定要多公平。"
    ],
    references: [
      { title: "經濟學原理 09. Efficiency of Markets（臺大 林明仁）", source: "均一教育平台", url: "https://www.junyiacademy.org/video/eApmSuj7EMI?parent-topic-id=ocw-102s116", kind: "影片" },
      { title: "經濟學原理 08. Supply, Demand, and Government Policies（臺大 林明仁）", source: "均一教育平台", url: "https://www.junyiacademy.org/video/8JoubnvV940?parent-topic-id=ocw-102s116", kind: "影片" }
    ],
    variants: [
      {
        question: "經濟學所說的「效率」，下列何者最正確？",
        options: [
          { key: "A", text: "資源配置使社會總剩餘最大" },
          { key: "B", text: "每個人分到的好處一樣多" },
          { key: "C", text: "所有價格都由政府決定" },
          { key: "D", text: "商品價格越低越好" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "判斷", lines: [
            "效率看總量 ⇒ 社會總剩餘最大，正確",
            "人人一樣多 ⇒ 是平均分配，屬公平議題",
            "政府定價 ⇒ 是管制手段，不是效率定義",
            "價格低 ⇒ 生產者剩餘可能變小，不等於有效率"
          ] }
        ]
      },
      {
        question: "下列何者最能說明「效率與公平的抵換關係」？",
        options: [
          { key: "A", text: "提高高所得者稅率以縮小貧富差距，但可能降低工作意願" },
          { key: "B", text: "技術進步使產量增加、價格下降" },
          { key: "C", text: "需求增加使均衡價格上升" },
          { key: "D", text: "廠商聯合漲價使消費者受損" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "判斷", lines: [
            "重稅縮小差距 ⇒ 增加公平",
            "工作意願下降 ⇒ 總產出減少，效率降低",
            "⇒ 得到一邊、犧牲另一邊 ⇒ 抵換 ✓",
            "其他選項只描述供需或市場結構變化，沒有兩者取捨"
          ] }
        ]
      }
    ],
    basis: "【確認】與題目所附課本 p.80 說明一致（效率不等於人人一樣多；管制不一定達到公平）。"
  },

  "tm_109_q13": {
    keyPoint: "由政府決定價格與分配方式（限價、實名制）＝看得見的手；由價格自由調整供需＝看不見的手。",
    formulas: [
      "看不見的手：市場機能，價格自動協調供需",
      "看得見的手：政府管制，政府直接決定價格、數量或分配"
    ],
    whyWrong: {
      D: "看不見的手是讓價格自由漲跌來調整供需；限價與實名制是政府直接介入，正好相反。",
      B: "聯合行為是廠商之間約定價格或產量，本題是政府在定價。",
      C: "外部效益是交易讓第三者得到好處卻沒付費，與誰決定價格無關。"
    },
    steps: [
      { title: "抓題幹關鍵", lines: [
        "題幹關鍵：政府限制價格、實施實名制",
        "⇒ 決定價格與分配的是政府，不是市場"
      ] },
      { title: "對應概念", lines: [
        "政府決定 ⇒ 看得見的手（政府管制）",
        "市場價格決定 ⇒ 看不見的手"
      ] },
      { title: "排除其他選項", lines: [
        "聯合行為 ⇒ 主角是廠商，不符",
        "外部效益 ⇒ 談第三者受益，不符",
        "⇒ 答案是政府管制 ✓"
      ] }
    ],
    traps: [
      "先問「誰決定價格」：市場就是看不見的手，政府就是看得見的手。",
      "「看得見」是因為政府的介入看得到，不是指市場透明。",
      "管制是否讓社會更好，是另一個問題（課本第 4 章）。"
    ],
    references: [
      { title: "「看得見的手」與「買不到的口罩」", source: "ETtoday 雲論（鍾文榮）", url: "https://forum.ettoday.net/news/1637766", kind: "文章" },
      { title: "經濟學原理 08. Supply, Demand, and Government Policies（臺大 林明仁）", source: "均一教育平台", url: "https://www.junyiacademy.org/video/8JoubnvV940?parent-topic-id=ocw-102s116", kind: "影片" }
    ],
    variants: [
      {
        question: "颱風過後菜價大漲，許多農民趕緊搶種短期蔬菜，一個月後菜價回落。這最能說明什麼？",
        options: [
          { key: "A", text: "看不見的手：市場機能" },
          { key: "B", text: "看得見的手：政府管制" },
          { key: "C", text: "廠商聯合行為" },
          { key: "D", text: "外部成本" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "判斷", lines: [
            "價格上漲 ⇒ 農民自行增加生產",
            "沒有政府介入 ⇒ 價格訊號協調供需",
            "⇒ 看不見的手 ✓"
          ] }
        ]
      },
      {
        question: "政府規定雇主支付的時薪不得低於某金額，這屬於什麼？",
        options: [
          { key: "A", text: "看得見的手：政府管制" },
          { key: "B", text: "看不見的手：市場機能" },
          { key: "C", text: "外部效益" },
          { key: "D", text: "廠商聯合行為" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "判斷", lines: [
            "政府規定工資下限 ⇒ 價格（工資）由政府介入決定",
            "⇒ 看得見的手 ✓"
          ] }
        ]
      }
    ],
    basis: "【確認】與題目所附課本 p.65 一致：由政府決定價格與分配方法即為看得見的手。"
  },

  "tm_109_q16": {
    keyPoint: "需求線右移 200，價格會上升；新價格下需求量沿新需求線減少、供給量沿供給線增加，所以均衡數量增加，但少於 200。",
    formulas: [
      "需求增加 ⇒ 價格↑、數量↑",
      "數量增加幅度 < 需求線右移幅度（供給線為正斜率時）",
      "只有供給線水平（價格不變）時，才剛好增加 200"
    ],
    whyWrong: {
      D: "多於 200 需要供給也同時增加；只有需求右移時，價格上升會讓需求量減少一部分。",
      A: "剛好 200 要價格完全不變，只有供給線是水平線時才會發生。",
      C: "需求右移、供給線正斜率，均衡數量一定增加。"
    },
    steps: [
      { title: "設一個例子", lines: [
        "Q_{d} = 1000 − 10P，Q_{s} = 10P",
        "1000 − 10P = 10P ⇒ P = 50，Q = 500"
      ] },
      { title: "需求右移 200", lines: [
        "Q_{d} = 1200 − 10P",
        "1200 − 10P = 10P ⇒ P = 60，Q = 600",
        "⇒ 數量只增加 100 < 200"
      ] },
      { title: "為什麼少於 200", lines: [
        "價格由 50 漲到 60",
        "⇒ 新需求線上 P = 60 的需求量 = 1200 − 600 = 600",
        "⇒ 比 P = 50 時的 700 少了 100"
      ] },
      { title: "驗算", lines: [
        "P = 60：Q_{d} = 600、Q_{s} = 600 ✓"
      ] }
    ],
    traps: [
      "「線移動多少」不等於「均衡數量變多少」，價格也會跟著變。",
      "價格上升時，要同時看需求量沿線減少的部分。",
      "供給越陡，價格漲越多，數量增加越少。"
    ],
    references: [
      { title: "經濟學原理 06. Supply and Demand (II)（臺大 林明仁）", source: "均一教育平台", url: "https://www.junyiacademy.org/video/KaxzicvlKhg?parent-topic-id=ocw-102s116", kind: "影片" },
      { title: "【觀念】需求法則、供給法則、均衡點", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-society/middle-school-civics/h4cjj-/h4cjj-d/v/EyTeCp0y5Js", kind: "影片" }
    ],
    variants: [
      {
        question: "某商品 Q_d = 300 − 2P，Q_s = P。若每種價格下需求量都增加 60，均衡數量增加多少？",
        options: [
          { key: "A", text: "20" },
          { key: "B", text: "60" },
          { key: "C", text: "40" },
          { key: "D", text: "0" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "原均衡", lines: ["300 − 2P = P", "⇒ P = 100，Q = 100"] },
          { title: "新均衡", lines: ["360 − 2P = P", "⇒ P = 120，Q = 120"] },
          { title: "比較與驗算", lines: ["ΔQ = 120 − 100 = 20 < 60", "P = 120：Q_{d} = 360 − 240 = 120 = Q_{s} ✓"] }
        ]
      },
      {
        question: "每一種價格下某商品的供給都增加 100（供給線右移 100），需求線為負斜率。均衡數量會增加多少？",
        options: [
          { key: "A", text: "少於 100" },
          { key: "B", text: "剛好 100" },
          { key: "C", text: "多於 100" },
          { key: "D", text: "不會增加" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "推理", lines: [
            "供給增加 ⇒ 價格下降",
            "價格下降 ⇒ 供給量沿新供給線減少一部分",
            "⇒ 數量增加，但少於 100 ✓"
          ] }
        ]
      }
    ],
    basis: "【確認】與題目所附課本 p.67 一致；並以線性供需例子驗算，需求右移 200 時均衡數量只增加 100。"
  },

  "tm_106_q7": {
    keyPoint: "水由低滲透壓往高滲透壓移動；根細胞主動吸收礦物質離子，越往內離子越多，所以滲透壓：中柱 > 皮層 > 表皮 > 土壤溶液。",
    formulas: [
      "滲透：水由低滲透壓（稀）往高滲透壓（濃）移動",
      "根吸收離子：主動運輸，需消耗 ATP",
      "根部滲透壓梯度：中柱 > 皮層 > 表皮 > 土壤溶液"
    ],
    whyWrong: {
      D: "四者相等就沒有滲透壓差，水不會持續由土壤往中柱移動。",
      A: "方向相反：土壤滲透壓最高時，水會由根流回土壤（植物會萎凋）。",
      B: "表皮最高時，水進入表皮後就不會再往皮層、中柱移動，無法送到導管。"
    },
    steps: [
      { title: "確定水移動方向", lines: [
        "水要從土壤 ⇒ 表皮 ⇒ 皮層 ⇒ 中柱導管",
        "水往高滲透壓處移動"
      ] },
      { title: "推出滲透壓順序", lines: [
        "終點要最高 ⇒ 中柱最高",
        "起點要最低 ⇒ 土壤溶液最低",
        "⇒ 中柱 > 皮層 > 表皮 > 土壤溶液"
      ] },
      { title: "說明梯度怎麼來", lines: [
        "根細胞主動吸收礦物質離子",
        "⇒ 離子在內部累積，越往中柱越濃",
        "⇒ 形成由外往內遞增的滲透壓"
      ] },
      { title: "檢查其他選項", lines: [
        "相等 ⇒ 沒有驅動力",
        "土壤最高 ⇒ 水往外流",
        "表皮最高 ⇒ 水卡在表皮 ⇒ 都不能把水送進中柱"
      ] }
    ],
    traps: [
      "水往「濃」的地方走，不是往「稀」的地方走。",
      "梯度要一路連續遞增，水才能一層一層往內移動。",
      "施肥過量讓土壤變濃，水反而被吸出根部。"
    ],
    references: [
      { title: "根壓", source: "維基百科", url: "https://zh.wikipedia.org/zh-tw/%E6%A0%B9%E5%8E%8B", kind: "文章" },
      { title: "根壓", source: "教育部 教育百科", url: "https://pedia.cloud.edu.tw/Entry/Detail/?title=%E6%A0%B9%E5%A3%93", kind: "文章" }
    ],
    variants: [
      {
        question: "盆栽一次施了大量濃肥，不久後植物萎凋。最主要的原因是？",
        options: [
          { key: "A", text: "土壤溶液滲透壓高於根細胞，根部失水" },
          { key: "B", text: "肥料使根細胞滲透壓變得比土壤高" },
          { key: "C", text: "肥料堵塞了葉片氣孔" },
          { key: "D", text: "肥料使篩管無法運輸蔗糖" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "推理", lines: [
            "濃肥 ⇒ 土壤溶液變濃 ⇒ 滲透壓升高",
            "土壤 > 根細胞 ⇒ 水由根流向土壤",
            "⇒ 根失水，植物萎凋 ✓"
          ] }
        ]
      },
      {
        question: "根細胞吸收土壤中的礦物質離子時需要消耗能量，主要原因是？",
        options: [
          { key: "A", text: "離子是由低濃度往高濃度運送（逆濃度梯度）" },
          { key: "B", text: "離子是由高濃度往低濃度擴散" },
          { key: "C", text: "離子要經過卡氏帶的細胞間隙" },
          { key: "D", text: "離子要靠蒸散作用拉入根部" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "推理", lines: [
            "根細胞內離子濃度高於土壤",
            "⇒ 吸收是逆濃度梯度",
            "⇒ 需要主動運輸、消耗 ATP ✓"
          ] }
        ]
      }
    ],
    basis: "【確認】與題目所附課本 p.80 敘述一致（中柱 > 皮層 > 表皮 > 土壤溶液），並與滲透作用方向相符。"
  },

  "tm_106_q2": {
    keyPoint: "葉綠素分子環狀結構的中心是鎂（Mg）；缺鎂時葉綠素不足，葉片黃化。",
    formulas: [
      "葉綠素：卟啉環＋中心鎂原子",
      "血紅素中心是鐵（Fe），葉綠素中心是鎂（Mg）",
      "鉀：酵素活性、滲透壓、氣孔開閉"
    ],
    whyWrong: {
      D: "鈣主要參與細胞壁構成與細胞訊息傳遞，不在葉綠素分子裡。",
      A: "鐵是合成葉綠素時需要的元素（缺鐵也會黃化），但不是葉綠素分子的成分；血紅素中心才是鐵。",
      C: "鉀與酵素活性、滲透壓及氣孔開閉有關，不在葉綠素中。"
    },
    steps: [
      { title: "回想葉綠素結構", lines: [
        "葉綠素 = 環狀卟啉結構 + 長碳鏈尾巴",
        "⇒ 環中央有一個鎂原子"
      ] },
      { title: "排除其他選項", lines: [
        "鐵 ⇒ 血紅素中心，葉綠素合成需要但不在分子內",
        "鉀 ⇒ 酵素、滲透壓、氣孔",
        "鈣 ⇒ 細胞壁、訊息傳遞"
      ] },
      { title: "對照課本確認", lines: [
        "課本：鎂是葉綠素成分，缺鎂葉片黃化",
        "⇒ 答案是鎂 ✓"
      ] }
    ],
    traps: [
      "缺鐵、缺鎂都會黃化，但只有鎂在葉綠素分子裡。",
      "葉綠素配鎂、血紅素配鐵，不要記反。"
    ],
    references: [
      { title: "葉綠素", source: "維基百科", url: "https://zh.wikipedia.org/zh-tw/%E8%91%89%E7%B6%A0%E7%B4%A0", kind: "文章" }
    ],
    variants: [
      {
        question: "人體血紅素與植物葉綠素的中心金屬元素分別是？",
        options: [
          { key: "A", text: "鐵、鎂" },
          { key: "B", text: "鎂、鐵" },
          { key: "C", text: "鐵、鐵" },
          { key: "D", text: "鈣、鎂" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "判斷", lines: ["血紅素 ⇒ 鐵（結合氧）", "葉綠素 ⇒ 鎂", "⇒ 鐵、鎂 ✓"] }
        ]
      },
      {
        question: "某植物葉片缺乏葉綠素而黃化，若補充下列哪一種元素最直接，因為它就是葉綠素分子的組成？",
        options: [
          { key: "A", text: "鎂" },
          { key: "B", text: "鉀" },
          { key: "C", text: "鈣" },
          { key: "D", text: "鈉" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "判斷", lines: ["題幹關鍵：葉綠素分子的組成", "⇒ 葉綠素中心是鎂", "⇒ 補鎂 ✓"] }
        ]
      }
    ],
    basis: "【確認】與題目所附課本 p.79 一致，並經維基百科「葉綠素」條目確認環中央為鎂原子。"
  },

  "tm_106_q13": {
    keyPoint: "莖切斷後切口滲出水珠，是根部把水往上「推」的力量——根壓；蒸散是葉片往上「拉」，切斷後上方已沒有葉子。",
    formulas: [
      "根壓：根吸收離子 ⇒ 中柱滲透壓高 ⇒ 水進入導管形成正壓，往上推",
      "卡氏帶：擋住中柱的水向外回流，使壓力建立",
      "根壓證據：切口滲水（傷流）、葉緣泌溢（吐水）",
      "蒸散拉力：葉片蒸散把水柱往上拉（高大樹木的主要動力）"
    ],
    whyWrong: {
      B: "蒸散是葉片把水「往上拉」；莖已切斷、切口上方沒有葉子，水是從下方被推出來的。",
      C: "毛細現象只能讓水在細管中上升一小段，不會讓水持續從切口溢出。",
      D: "壓力流是韌皮部篩管運輸有機養分的機制，與木質部的水無關。"
    },
    steps: [
      { title: "抓題幹關鍵", lines: [
        "題幹關鍵：莖橫切後，切口（下段）滲出水珠",
        "⇒ 切口上方沒有葉 ⇒ 不是蒸散拉力",
        "⇒ 水是被下方往上推出"
      ] },
      { title: "根壓怎麼形成", lines: [
        "根細胞主動吸收礦物質離子",
        "⇒ 中柱滲透壓高 ⇒ 水滲入導管",
        "卡氏帶擋住水外流 ⇒ 導管內形成正壓 ⇒ 根壓"
      ] },
      { title: "排除其他選項", lines: [
        "蒸散 ⇒ 需要葉片，切斷後不成立",
        "毛細現象 ⇒ 上升有限，不會持續外溢",
        "壓力流 ⇒ 韌皮部運有機養分",
        "⇒ 答案是根壓 ✓"
      ] }
    ],
    traps: [
      "推力（根壓）和拉力（蒸散）要分清：切斷後還在冒水的是推力。",
      "清晨葉緣的水珠也是根壓造成，不是露水。",
      "高大樹木水分上升主要靠蒸散拉力，根壓只是輔助。"
    ],
    references: [
      { title: "根壓（含傷流與吐水現象）", source: "維基百科", url: "https://zh.wikipedia.org/zh-tw/%E6%A0%B9%E5%8E%8B", kind: "文章" },
      { title: "根壓", source: "教育部 教育百科", url: "https://pedia.cloud.edu.tw/Entry/Detail/?title=%E6%A0%B9%E5%A3%93", kind: "文章" }
    ],
    variants: [
      {
        question: "潮濕無風的清晨，草葉邊緣常掛著小水珠（泌溢現象）。這主要與什麼有關？",
        options: [
          { key: "A", text: "根壓" },
          { key: "B", text: "蒸散作用" },
          { key: "C", text: "壓力流" },
          { key: "D", text: "光合作用產生的水" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "推理", lines: [
            "潮濕夜晚 ⇒ 蒸散幾乎停止",
            "根仍持續吸水 ⇒ 根壓把水推到葉緣水孔",
            "⇒ 泌溢 ✓"
          ] }
        ]
      },
      {
        question: "數十公尺高的大樹，把水送到樹頂的主要動力是？",
        options: [
          { key: "A", text: "蒸散作用產生的拉力，配合水分子內聚力" },
          { key: "B", text: "根壓" },
          { key: "C", text: "毛細現象" },
          { key: "D", text: "篩管的壓力流" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "推理", lines: [
            "根壓只能把水推高有限距離",
            "葉片蒸散失水 ⇒ 拉動導管中連續的水柱",
            "⇒ 主要動力是蒸散拉力 ✓"
          ] }
        ]
      }
    ],
    basis: "【確認】與題目所附課本 p.83 一致（切口滲水與泌溢皆與根壓有關），並經維基百科「根壓」條目確認。"
  },

  "tm_106_q38": {
    keyPoint: "光反應中，PSII 失去的電子由水分解補充並放出 O₂；卡爾文循環中 NADPH 用來把三碳化合物還原成三碳醣，五碳醣再生只用 ATP。",
    formulas: [
      "水分解：2H₂O ⇒ 4H⁺ + 4e⁻ + O₂（補充 PSII 的電子）",
      "天線色素：吸收、匯集光能；反應中心：少數葉綠素 a 進行電子傳遞",
      "卡爾文循環：三碳化合物 ⇒ 三碳醣（用 ATP + NADPH）",
      "三碳醣 ⇒ 五碳醣（RuBP）再生：只用 ATP"
    ],
    whyWrong: {
      E: "三碳醣轉成五碳醣（RuBP 再生）只消耗 ATP；NADPH 是用在三碳化合物還原成三碳醣那一步。",
      C: "漏選：PSII 受光激發失去的電子由水分解補充，這句正確。",
      B: "大部分葉綠素是天線色素，只負責吸收、匯集光能；直接參與電子傳遞的只有反應中心的少數葉綠素 a。",
      D: "O₂ 來自水的分解，不是 CO₂；CO₂ 的碳與氧進入醣類。"
    },
    steps: [
      { title: "逐項判斷", lines: [
        "紅、藍、綠光利用效率不同 ⇒ 綠光多被反射，正確",
        "大部分葉綠素直接傳電子 ⇒ 大多是天線色素，錯",
        "PSII 的電子由水提供 ⇒ 水分解補電子，正確",
        "O₂ 由 CO₂ 分解 ⇒ O₂ 來自水，錯",
        "三碳醣轉五碳醣耗 NADPH ⇒ 只耗 ATP，錯"
      ] },
      { title: "檢查選項數", lines: [
        "正確 2 項：光的利用效率不同、PSII 電子由水提供",
        "⇒ 與「應選 2 項」相符 ✓"
      ] }
    ],
    traps: [
      "NADPH 只用在「還原」那一步；再生 RuBP 只要 ATP。",
      "O₂ 的來源是水，用 ¹⁸O 標記水才會出現在 O₂ 裡。",
      "天線色素多、反應中心少：大部分葉綠素只負責收集光能。"
    ],
    references: [
      { title: "光合作用電子傳遞過程", source: "清華大學 生命科學系課程網頁", url: "https://life.nthu.edu.tw/~lslty/phy/lightrxn-3.htm", kind: "講義" },
      { title: "把陽光變成糖：光合作用如何驅動整個生命世界", source: "Uedu Biology", url: "https://uedu.tw/biology/a/photosynthesis", kind: "文章" },
      { title: "葉綠素", source: "維基百科", url: "https://zh.wikipedia.org/zh-tw/%E8%91%89%E7%B6%A0%E7%B4%A0", kind: "文章" }
    ],
    variants: [
      {
        question: "以含 ¹⁸O 的水供植物進行光合作用，¹⁸O 最先出現在哪一種產物中？",
        options: [
          { key: "A", text: "氧氣" },
          { key: "B", text: "葡萄糖" },
          { key: "C", text: "三碳醣" },
          { key: "D", text: "二氧化碳" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "推理", lines: [
            "水在光反應被分解",
            "⇒ 水中的氧原子形成 O₂ 釋出",
            "⇒ ¹⁸O 出現在氧氣 ✓"
          ] }
        ]
      },
      {
        question: "卡爾文循環中，NADPH 主要用在哪一步？",
        options: [
          { key: "A", text: "三碳化合物還原成三碳醣" },
          { key: "B", text: "三碳醣轉成五碳醣" },
          { key: "C", text: "CO₂ 與五碳醣結合" },
          { key: "D", text: "水的分解" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "推理", lines: [
            "固碳：CO₂ + RuBP ⇒ 三碳化合物（不耗能）",
            "還原：三碳化合物 ⇒ 三碳醣（ATP + NADPH）",
            "再生：三碳醣 ⇒ RuBP（只耗 ATP）",
            "⇒ NADPH 用在還原 ✓"
          ] }
        ]
      }
    ],
    basis: "【確認】與題目所附課本 p.95 一致（天線色素、O₂ 來自水、五碳醣再生只需 ATP），並經清華大學課程網頁確認 PSII 電子由水分解補充。"
  },

  "tm_28_q19": {
    keyPoint: "壓力換算都先換成 atm：1 atm = 76 cmHg = 1033.6 gw/cm² ≈ 1013 hPa。",
    formulas: [
      "1 atm = 76 cmHg = 760 mmHg",
      "液柱壓力 P = d × h：13.6 g/cm³ × 76 cm = 1033.6 gw/cm²",
      "1 atm ≈ 1013 hPa（百帕）"
    ],
    whyWrong: {
      "1；2；3": "填的是空格編號，沒有填入數值。正確依序為：2 atm、2067.2 gw/cm²、約 2026 百帕。"
    },
    steps: [
      { title: "① 換成 atm", lines: [
        "152 cmHg ÷ 76 cmHg/atm",
        "= 2 atm"
      ] },
      { title: "② 換成 gw/cm²", lines: [
        "P = d × h",
        "= 13.6 g/cm³ × 152 cm",
        "= 2067.2 gw/cm²"
      ] },
      { title: "③ 換成百帕", lines: [
        "2 atm × 1013 hPa/atm",
        "= 2026 hPa"
      ], note: "用 1013.25 會得到 2026.5，四捨五入仍約 2026" },
      { title: "驗算", lines: [
        "1033.6 × 2 = 2067.2 ✓",
        "frac{2026}{1013} = 2 ✓"
      ] }
    ],
    traps: [
      "gw/cm² 要用汞的密度 13.6 乘上 cm 高度，單位才對得上。",
      "cmHg 和 mmHg 差 10 倍，先確認單位。",
      "百帕與 atm 的換算是 1013，不是 1000。"
    ],
    references: [
      { title: "【例題】大氣壓力的單位換算（指考物理 106）", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-phy/main-seni-ph-ele2/main-seni-ph-ele2-4/v/TMQ1SnrEeRQ", kind: "影片" },
      { title: "高三上物理 1-5 理想氣體方程式（3）：1 標準大氣壓與托里切利實驗", source: "均一教育平台", url: "https://www.junyiacademy.org/video/3-PWACY6LRc?parent-topic-id=junyi-heat", kind: "影片" },
      { title: "氣壓計（Barometer）", source: "科學Online（臺灣大學）", url: "https://case.ntu.edu.tw/highscope/%E6%B0%A3%E5%A3%93%E8%A8%88barometer/index.html", kind: "文章" }
    ],
    variants: [
      {
        question: "38 cmHg 等於多少 atm？",
        options: [
          { key: "A", text: "0.5" },
          { key: "B", text: "2" },
          { key: "C", text: "38" },
          { key: "D", text: "0.38" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "計算", lines: ["38 ÷ 76 = 0.5 atm"] },
          { title: "驗算", lines: ["0.5 × 76 = 38 ✓"] }
        ]
      },
      {
        question: "2280 mmHg 約等於多少百帕（hPa）？",
        options: [
          { key: "A", text: "3039" },
          { key: "B", text: "2280" },
          { key: "C", text: "3" },
          { key: "D", text: "1013" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "先換 atm", lines: ["2280 ÷ 760 = 3 atm"] },
          { title: "再換百帕", lines: ["3 × 1013 = 3039 hPa"] },
          { title: "驗算", lines: ["frac{3039}{1013} = 3，3 × 760 = 2280 ✓"] }
        ]
      }
    ],
    basis: "【確認】152 ÷ 76 = 2 atm；13.6 × 152 = 2067.2 gw/cm²；2 × 1013 = 2026 百帕，與題目詳解一致。"
  },

  "tm_28_q69": {
    keyPoint: "先用 PV = nRT（T 用 K）算出氣體壓力，再看壓力計方向：氣體端汞面較高代表氣體壓力小於大氣壓，x = 760 − P_{氣}。",
    formulas: [
      "n = frac{質量}{分子量}",
      "P = frac{nRT}{V}，R = 0.082 atm·L/(mol·K)，T = °C + 273",
      "氣體端汞面較高：P_{氣} = P_{大氣} − x",
      "1 atm = 760 mmHg"
    ],
    whyWrong: {
      B: "750 是溫度直接代 27（沒換成 300 K）：P ≈ 0.0148 atm ≈ 11 mmHg，760 − 11 ≈ 749。",
      A: "124 是氣體本身的壓力（mmHg），題目問的是高度差 x。",
      D: "氣體端汞面較高時 x = 760 − P_{氣}，x 不可能大於 760。",
      E: "884 = 760 + 124，把方向弄反，當成氣體壓力大於大氣壓。"
    },
    steps: [
      { title: "求莫耳數", lines: [
        "N_{2} 分子量 = 28",
        "n = frac{1.12}{28} = 0.04 mol"
      ] },
      { title: "求氣體壓力", lines: [
        "P = frac{nRT}{V}",
        "= frac{0.04 × 0.082 × 300}{6}",
        "= frac{0.984}{6} = 0.164 atm",
        "= 0.164 × 760 ≈ 124.6 mmHg"
      ] },
      { title: "依方向求 x", lines: [
        "氣體端汞面較高 ⇒ P_{氣} < P_{大氣}",
        "P_{氣} = 760 − x",
        "⇒ x = 760 − 124.6 ≈ 635 mm"
      ] },
      { title: "驗算", lines: [
        "以開口端汞面為基準：124.6 + 635.4 = 760 ✓",
        "0.04 × 0.082 × 300 = 0.984 ✓"
      ] }
    ],
    traps: [
      "溫度一定要用 K：27 °C = 300 K。",
      "N₂ 是雙原子分子，分子量 28，不是 14。",
      "先判斷汞面哪端高，再決定加或減；算出的氣體壓力不是答案。"
    ],
    references: [
      { title: "【觀念】理想氣體方程式", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/Ub7qvuO8Hf8", kind: "影片" },
      { title: "絕對壓力（錶壓＋大氣壓、以液柱高度度量壓力）", source: "科學Online（臺灣大學）", url: "https://case.ntu.edu.tw/highscope/%E7%B5%95%E5%B0%8D%E5%A3%93%E5%8A%9B/index.html", kind: "文章" },
      { title: "【例題】密閉系統內的氣體壓力計算", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/middle-school-physics-chemistry/s4zyl-/v/T8jk-FDr1DM", kind: "影片" }
    ],
    variants: [
      {
        question: "4.1 L 的氣體球內有 0.02 mol 氦氣，溫度 27 °C，接開口式水銀壓力計（大氣 760 mmHg），氣體端汞面較高。高度差約為多少 mm？",
        options: [
          { key: "A", text: "669" },
          { key: "B", text: "91" },
          { key: "C", text: "851" },
          { key: "D", text: "760" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "求壓力", lines: [
            "P = frac{0.02 × 0.082 × 300}{4.1}",
            "= frac{0.492}{4.1} = 0.12 atm",
            "= 0.12 × 760 = 91.2 mmHg"
          ] },
          { title: "求高度差", lines: ["x = 760 − 91.2 ≈ 669 mm"] },
          { title: "驗算", lines: ["91.2 + 668.8 = 760 ✓"] }
        ]
      },
      {
        question: "8.2 L 的氣體球內有 0.5 mol 理想氣體，溫度 27 °C，接開口式水銀壓力計（大氣 760 mmHg），開口端汞面較高。高度差為多少 mm？",
        options: [
          { key: "A", text: "380" },
          { key: "B", text: "1140" },
          { key: "C", text: "1900" },
          { key: "D", text: "760" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "求壓力", lines: [
            "P = frac{0.5 × 0.082 × 300}{8.2}",
            "= frac{12.3}{8.2} = 1.5 atm",
            "= 1.5 × 760 = 1140 mmHg"
          ] },
          { title: "求高度差", lines: ["開口端較高 ⇒ P_{氣} = 760 + x", "x = 1140 − 760 = 380 mm"] },
          { title: "驗算", lines: ["760 + 380 = 1140 ✓"] }
        ]
      }
    ],
    basis: "【確認】n = 0.04 mol，P = 0.164 atm ≈ 124.6 mmHg，x = 760 − 124.6 ≈ 635 mm，與答案一致；錯誤選項可對應到溫度未換 K、方向弄反或誤把壓力當高度差。"
  },

  "tm_28_q37": {
    keyPoint: "同一個開口式壓力計、同樣的高度差 ⇒ 兩氣體壓力相同；再加上同溫（標準狀況）、同體積（同一氣體球），依亞佛加厥定律粒子數相同。",
    formulas: [
      "開口式壓力計：P_{氣} = P_{大氣} ± h",
      "PV = nRT ⇒ 同 P、V、T ⇒ 同 n",
      "亞佛加厥定律：同溫同壓下，同體積的任何氣體（含混合氣體）粒子數相同"
    ],
    whyWrong: {
      C: "同一壓力計、高度差都是 h，兩氣體壓力相同，不會一大一小；壓力和氣體種類無關。",
      A: "開口式壓力計量的是與大氣壓的差，氣體壓力是 76 ± h cmHg，不是 h cmHg。",
      B: "同上，高度差相同代表壓力相同，沒有誰大誰小。",
      E: "混合氣體也遵守亞佛加厥定律，不一定是純物質。"
    },
    steps: [
      { title: "比較壓力", lines: [
        "同一壓力計、同一大氣壓",
        "高度差都是 h ⇒ P_{X} = P_{Y} = 76 ± h cmHg"
      ] },
      { title: "比較 T、V", lines: [
        "標準狀況 ⇒ T 相同",
        "同一氣體球 ⇒ V 相同"
      ] },
      { title: "推出粒子數", lines: [
        "n = frac{PV}{RT}",
        "P、V、T 都相同 ⇒ n_{X} = n_{Y}",
        "⇒ 粒子數一定相同"
      ] },
      { title: "檢查其他敘述", lines: [
        "壓力是 h cmHg ⇒ 漏了大氣壓，錯",
        "壓力一大一小 ⇒ 與高度差相同矛盾，錯",
        "一定是純物質 ⇒ 混合氣體也適用，錯"
      ] }
    ],
    traps: [
      "開口式壓力計要加減大氣壓；只有閉口式（真空端）才是 P = h。",
      "亞佛加厥定律只看 P、V、T，跟氣體種類、是否混合無關。",
      "粒子數相同不代表質量相同，分子量不同質量就不同。"
    ],
    references: [
      { title: "【觀念】亞佛加厥定律", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/main-seni-cm/chemistry-high-publisher/n-chemical-high/n-11a-chemical/n-11a-chemical-2/v/EOl8UCr_iuE", kind: "影片" },
      { title: "4. 查理定律與亞佛加厥定律", source: "均一教育平台", url: "https://www.junyiacademy.org/junyi-science/science-high/junyi-chemistry/v1217-new-topic-1/j-d-che-u1/j-d-che-u1-7/v/Tn4SrtHiVZ4", kind: "影片" },
      { title: "絕對壓力（錶壓＋大氣壓、以液柱高度度量壓力）", source: "科學Online（臺灣大學）", url: "https://case.ntu.edu.tw/highscope/%E7%B5%95%E5%B0%8D%E5%A3%93%E5%8A%9B/index.html", kind: "文章" }
    ],
    variants: [
      {
        question: "同溫同壓下，1 L 的 O₂ 與 1 L 的 CO₂，下列何者一定相同？",
        options: [
          { key: "A", text: "分子數" },
          { key: "B", text: "質量" },
          { key: "C", text: "原子總數" },
          { key: "D", text: "密度" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "判斷", lines: [
            "同 T、P、V ⇒ 同 n ⇒ 分子數相同",
            "分子量 32 與 44 不同 ⇒ 質量、密度不同",
            "每分子原子數 2 與 3 不同 ⇒ 原子總數不同"
          ] }
        ]
      },
      {
        question: "標準狀況下，11.2 L 的 N₂ 與 11.2 L 的 He、Ne 混合氣體相比，下列何者正確？",
        options: [
          { key: "A", text: "粒子總數相同" },
          { key: "B", text: "質量相同" },
          { key: "C", text: "混合氣體不適用亞佛加厥定律" },
          { key: "D", text: "N₂ 的粒子數較多" }
        ],
        correctAnswer: "A",
        steps: [
          { title: "計算", lines: [
            "n = frac{11.2}{22.4} = 0.5 mol（兩者相同）",
            "⇒ 粒子總數相同 ✓"
          ] },
          { title: "排除", lines: ["混合氣體也適用", "平均分子量不同 ⇒ 質量不一定相同"] }
        ]
      }
    ],
    basis: "【確認】依題意兩次高度差同為 h（同方向），壓力相同；同溫、同體積下由 PV = nRT 得粒子數相同，與答案一致。"
  }
};
