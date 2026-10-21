/* lessons/src/ESC_H2_EarthHistoryAstronomy.js — 高二地球科學：地球的歷史＋天文（tm_17／tm_55／tm_60／tm_68／tm_69／tm_70）.
   內容依教材包 tm_17 summary.json（主題1～11）；大氣成分演變、黑體輻射、大氣透明度等曲線為示意；答案已驗算。 */
"use strict";
module.exports = {
  lessonId: "ESC_H2_EarthHistoryAstronomy",
  title: "地球歷史與天文圖解教材",
  eyebrow: "地球科學 ・ 主題 1～11 ・ 高二上",
  h1: "地球的歷史與天文",
  h1small: "從 46 億年前一路看到整個宇宙",
  subject: "ESC",
  unit: "ESC-H2-T1-11",
  sections: [
    {
      id: "1-2", short: "地球的歷史", title: "地球的起源與地質年代（主題1、2）",
      plan: { goal: "知道地球如何形成與分層、大氣如何演變，會用相對與絕對地質年代判斷先後與年代。", prereq: "國中的岩石、化石與地層。", time: "約 4 節課。" },
      cards: [
        {
          id: "F1", title: "地球的形成與分層", page: "主題1", tags: ["src", "add"],
          say: "剛形成的地球被<b>隕石撞擊、重力收縮、放射性元素衰變</b>三件事加熱到熔化。熔化之後就像一鍋湯：重的鐵鎳沉到中心變成地核，輕的矽酸鹽浮到外面變成地函和地殼。這叫<b>密度分異</b>。",
          formula: "熔融原因：隕石撞擊 ＋ 重力收縮 ＋ 放射性衰變　→　密度分異：地核（鐵鎳）｜地函、地殼（矽酸鹽）",
          widget: { id: "w-diff", aria: "熔融的地球中，重的鐵往中心沉、輕的矽酸鹽往外浮", rw: 0.45, rn: 0.85,
            controls: [{ k: "t", label: "時間", min: 0, max: 1, step: 0.01 }], play: { k: "t", dur: 4000 } },
          space: "深色的鐵粒子一路往中心跑，淺色的留在外面，最後一圈一圈分好層。越往中心密度越大。",
          trap: "把「太陽照射」當成熔融原因。地球是被自己內部和撞擊的能量熔化的。",
          quiz: { q: "下列何者<b>不是</b>早期地球熔融的原因？", answer: "d", options: [
            { c: "a", text: "隕石撞擊", why: "撞擊的動能轉成熱，是熔融原因之一。" },
            { c: "b", text: "重力收縮", why: "物質往中心擠壓會放出熱，是原因之一。" },
            { c: "c", text: "放射性元素衰變", why: "衰變持續放熱，是原因之一。" },
            { c: "d", text: "太陽輻射加熱" }] },
          sol: { id: "s-F1", aria: "逐步圖解：加熱、熔化、分層" }
        },
        {
          id: "F2", title: "大氣三階段演變", page: "主題1", tags: ["src", "add"],
          say: "地球的大氣換過三次「衣服」：第一件是太陽星雲的<b>氫、氦</b>，很快跑光了；第二件是<b>火山噴出的水氣和二氧化碳</b>，水氣冷凝成海；第三件靠<b>藍綠菌</b>的光合作用慢慢加入氧氣。氧氣先被海裡的鐵吃掉（帶狀鐵礦），之後才在大氣累積，形成臭氧層，生物才能上陸。",
          formula: "① 氫、氦（逸散）→ ② 火山釋氣：H<sub>2</sub>O、CO<sub>2</sub>（形成海洋）→ ③ 海、氣、生物交互作用：CO<sub>2</sub> 被除去、O<sub>2</sub> 增加（約 20 億年前顯著上升；約 4 億年前臭氧層形成，生物上陸）",
          widget: { id: "w-atmo", aria: "46 億年來大氣主要成分比例與重要事件時間軸（示意）", rw: 0.48, rn: 0.95,
            controls: [{ k: "t", label: "距今（億年）", min: 0, max: 46, step: 0.5 }], play: { k: "t", dur: 6000 } },
          space: "往右拖（時間往現在走）：CO₂ 一路減少（被海洋溶解成石灰岩、被生物吸收），O₂ 從幾乎沒有到 21%。",
          trap: "以為氧氣一出現就馬上留在大氣。最早的氧氣先和海水中的鐵反應，沉積成帶狀鐵礦。",
          quiz: { q: "大氣演變的第二階段（火山釋氣），大氣的主要成分是？", answer: "b", options: [
            { c: "a", text: "氫氣與氦氣", why: "那是第一階段（原始太陽星雲氣體）。" },
            { c: "b", text: "水氣與二氧化碳" },
            { c: "c", text: "氮氣與氧氣", why: "那是現在（第三階段之後）的大氣。" },
            { c: "d", text: "臭氧與氧氣", why: "臭氧層約 4 億年前才形成。" }] },
          sol: { id: "s-F2", aria: "逐步圖解：三個階段" }
        },
        {
          id: "F3", title: "相對地質年代：疊置、截切、包裹體", page: "主題2", tags: ["src"],
          say: "地層像一疊考卷：先寫完的放在下面，這是<b>疊置定律</b>。一條岩脈切過好幾層，代表切的人比被切的年輕，這是<b>截切定律</b>。岩石裡包著另一種岩石碎塊，碎塊比較老，這是<b>包裹體定律</b>。只能排先後，不知道確切幾年前。",
          formula: "疊置：下老上新　　截切：切人者新、被切者老　　包裹體：被包者老　　化石比對：同化石 → 同時代　（理論基礎：均變說）",
          widget: { id: "w-strata", aria: "地層剖面依序堆積、岩脈切穿，再被新地層覆蓋", rw: 0.45, rn: 0.85,
            controls: [{ k: "t", label: "演進", min: 0, max: 5, step: 1 }], play: { k: "t", dur: 4000 } },
          space: "按播放：A、B、C 一層層往上疊，接著 D 從下面切上來，最後 E 蓋在上面而且沒被切到。所以 D 比 C 新、比 E 老。",
          trap: "以為下面的岩脈一定比較老。岩脈切過誰，就比誰年輕，跟它在下面無關。",
          quiz: { q: "地層由下而上為 A、B、C，岩脈 D 切穿 A、B、C，但沒有切到最上面的 E。形成先後順序是？", answer: "a", options: [
            { c: "a", text: "A → B → C → D → E" },
            { c: "b", text: "D → A → B → C → E", why: "D 切過 A、B、C，所以比它們都年輕。" },
            { c: "c", text: "A → B → C → E → D", why: "D 沒切到 E，表示 E 是在 D 之後才蓋上去的。" },
            { c: "d", text: "E → C → B → A → D", why: "疊置定律：下面的比較老。" }] },
          sol: { id: "s-F3", aria: "逐步圖解：先疊置、再截切" }
        },
        {
          id: "F4", title: "標準化石與地質年代劃分", page: "主題2", tags: ["src"],
          say: "要對比不同地方的地層，用<b>標準化石</b>：這種生物<b>只活了很短的時間、卻分布很廣</b>，看到它就知道是哪個年代。<b>指相化石</b>則告訴你當時的環境（例如珊瑚 → 溫暖淺海）。顯生元依生物大滅絕切成古生代、中生代、新生代。",
          formula: "標準化石：生存時間短、分布廣、數量多 → 判斷年代　　指相化石：對環境要求嚴格 → 判斷古環境<br>大滅絕：二疊紀末（古生代/中生代）、白堊紀末（中生代/新生代）",
          widget: { id: "w-eras", aria: "地質年代表與生物大滅絕位置", rw: 0.62, rn: 1.1,
            controls: [{ k: "t", label: "距今（百萬年）", min: 0, max: 4600, step: 10 }] },
          space: "前 40 億年（隱生元）都擠在左邊一大段，顯生元只有最後 5.4 億年。生物多樣化幾乎都發生在這最後一小段。",
          trap: "把「生存時間長」當成標準化石的條件。時間越短，越能精準指出年代。",
          quiz: { q: "適合當作標準化石的生物，應該具備哪些特徵？", answer: "c", options: [
            { c: "a", text: "生存時間長、分布範圍小", why: "時間長就無法指出特定年代，分布小又無法跨地區對比。" },
            { c: "b", text: "生存時間長、分布範圍廣", why: "分布廣對了，但時間要短。" },
            { c: "c", text: "生存時間短、分布範圍廣" },
            { c: "d", text: "只生活在特定環境", why: "那是指相化石的特徵。" }] },
          sol: { id: "s-F4", aria: "逐步圖解：比較兩種化石的生存時間" }
        },
        {
          id: "F5", title: "絕對地質年代：放射性定年與半衰期", page: "主題2", tags: ["src"],
          say: "放射性的母元素會慢慢變成子元素，速度固定：每過一個<b>半衰期</b>，母元素就剩一半。量出岩石裡母元素剩多少，就能反推過了幾個半衰期。剩 1/2 是 1 個、1/4 是 2 個、1/8 是 3 個…",
          formula: "<span class=\"fr\"><span><i>N</i></span><span><i>N</i><sub>0</sub></span></span> = (½)<sup><i>n</i></sup>　　年代 = <i>n</i> × 半衰期　　定年極限約 10 個半衰期",
          widget: { id: "w-decay", aria: "母元素與子元素隨半衰期的變化", rw: 0.42, rn: 0.8,
            controls: [{ k: "n", label: "經過半衰期數", min: 0, max: 10, step: 0.1 }], play: { k: "n", dur: 5000 } },
          space: "藍色母元素每過一格就少一半，金色子元素補上去，兩者加起來永遠是 100%。過了 10 個半衰期只剩約 0.1%，量不準了。",
          trap: "以為 1/8 是 8 個半衰期，或把 3 個半衰期算成 3 × 一半。",
          quiz: { q: "碳-14 半衰期 5730 年。某木炭中碳-14 只剩原來的 1/8，距今約多久？", answer: "b", options: [
            { c: "a", text: "45840 年", why: "1/8 是 (½)³，經過 3 個半衰期，不是 8 個。" },
            { c: "b", text: "17190 年" },
            { c: "c", text: "11460 年", why: "這是 2 個半衰期（剩 1/4）。" },
            { c: "d", text: "2865 年", why: "時間越久剩越少，剩 1/8 要超過一個半衰期。" }] },
          sol: { id: "s-F5", aria: "逐步圖解：一半、一半、再一半" }
        }
      ]
    },
    {
      id: "3-6", short: "恆星與宇宙", title: "恆星、太陽系與宇宙（主題3～6）",
      plan: { goal: "分清亮度、光度與星等，從顏色判斷溫度，比較類地與類木行星，理解防護罩、適居性與宇宙膨脹。", prereq: "光的強度與距離平方成反比。", time: "約 5 節課。" },
      cards: [
        {
          id: "F6", title: "亮度、光度與星等", page: "主題3", tags: ["src"],
          say: "<b>亮度</b>是你看到多亮，<b>光度</b>是星星本身多會發光。同一盞燈，離遠一點就變暗，可是光度沒變。星等是古希臘人排的「名次」，<b>數字越小越亮</b>，而且每差 5 等，亮度差 100 倍。",
          formula: "每差 1 等，亮度差 100<sup>1/5</sup> ≈ 2.512 倍　　每差 5 等，亮度差 100 倍<br>視星等：從地球看到的　　絕對星等：放在 10 秒差距處的（代表真實光度）",
          widget: { id: "w-mag", aria: "不同星等的星星大小與亮度比", rw: 0.36, rn: 0.7,
            controls: [{ k: "a", label: "甲星等", min: -1, max: 6, step: 1 }, { k: "b", label: "乙星等", min: -1, max: 6, step: 1 }] },
          space: "1 等和 6 等差 5 等，亮度剛好差 100 倍；2 等和 7 等也是 100 倍。是「倍數」關係，不是相減。",
          trap: "以為星等數字大比較亮，或以為差 5 等就是差 5 倍。",
          quiz: { q: "一顆 1 等星比一顆 6 等星亮幾倍？", answer: "d", options: [
            { c: "a", text: "5 倍", why: "星等是倍數關係，每差 5 等是 100 倍。" },
            { c: "b", text: "6 倍", why: "要用星等差，而且是倍數關係。" },
            { c: "c", text: "2.512 倍", why: "那是差 1 等，這裡差 5 等。" },
            { c: "d", text: "100 倍" }] },
          sol: { id: "s-F6", aria: "逐步圖解：每差一等乘 2.512" }
        },
        {
          id: "F7", title: "恆星的顏色與溫度", page: "主題3", tags: ["src", "add"],
          say: "鐵燒紅、再燒到發白，溫度越高顏色越偏藍白。恆星也是：輻射最強的波長隨溫度變短，<b>藍白色最熱、紅色最冷</b>。太陽約 5800 K，最強在綠黃光附近。",
          formula: "溫度越高 → 輻射峰值波長越短 → 顏色越偏藍　　<i>λ</i><sub>max</sub> ≈ <span class=\"fr\"><span>2.9 × 10⁶ nm·K</span><span><i>T</i></span></span>　　光度 <i>L</i> ∝ <i>R</i>²<i>T</i>⁴",
          widget: { id: "w-bb", aria: "不同溫度恆星的輻射曲線與顏色", rw: 0.42, rn: 0.8,
            controls: [{ k: "t", label: "表面溫度 (K)", min: 3000, max: 12000, step: 100 }], play: { k: "t", dur: 5000 } },
          space: "把溫度往上拉，曲線的高峰往左（短波長、藍色）移，而且整條變高很多（T⁴）。",
          trap: "以為紅色的恆星比較熱（像火焰）。在恆星裡，紅色反而最冷。行星的顏色則是表面物質決定，跟溫度無關。",
          quiz: { q: "下列哪一種顏色的恆星，表面溫度最高？", answer: "a", options: [
            { c: "a", text: "藍白色" },
            { c: "b", text: "黃色", why: "黃色（像太陽）約 6000 K，藍白色更熱。" },
            { c: "c", text: "橙色", why: "橙色比黃色更冷。" },
            { c: "d", text: "紅色", why: "紅色恆星最冷（約 3000 K）。" }] },
          sol: { id: "s-F7", aria: "逐步圖解：峰值往短波移動" }
        },
        {
          id: "F8", title: "太陽系：類地行星與類木行星", page: "主題4", tags: ["src"],
          say: "八大行星分兩隊：內側的<b>水金地火</b>是岩石和金屬做的，小小的但很紮實（密度大）；外側的<b>木土天海</b>主要是氣體，超大顆但很鬆（密度小），土星的密度甚至比水小。",
          formula: "類地行星（水、金、地、火）：體積小、密度大、岩石金屬　　類木行星（木、土、天、海）：體積大、密度小、氣體為主",
          widget: { id: "w-planets", aria: "八大行星半徑與密度的散布圖", rw: 0.45, rn: 0.85,
            controls: [{ k: "i", label: "行星", min: 0, max: 7, step: 1 }] },
          space: "左上一群（小、密度大）、右下一群（大、密度小），兩隊分得很清楚。土星在最右下角，密度不到 1。",
          trap: "以為大顆的行星密度一定大。類木行星大，但主要是氣體，密度反而小。",
          quiz: { q: "與類地行星相比，類木行星的特徵是？", answer: "b", options: [
            { c: "a", text: "體積小、密度大", why: "那是類地行星。" },
            { c: "b", text: "體積大、密度小" },
            { c: "c", text: "體積大、密度大", why: "類木行星以氣體為主，密度小。" },
            { c: "d", text: "體積小、密度小", why: "類木行星都很大。" }] },
          sol: { id: "s-F8", aria: "逐步圖解：兩群行星的位置" }
        },
        {
          id: "F9", title: "地球防護罩與適居性", page: "主題5", tags: ["src", "add"],
          say: "太陽一直吹出帶電粒子（太陽風）。地球的<b>磁層</b>像一把傘把它們偏折開，只有在兩極附近漏進來一些，撞上大氣變成極光；<b>臭氧層</b>則吸收紫外線。加上離太陽距離剛好（適居帶），地球才能留住液態水和生命。",
          formula: "磁層：偏折太陽風帶電粒子（極光、范艾倫輻射帶）　　大氣（臭氧層）：吸收紫外線　　適居性：恆星質量適當、距離在適居帶、行星大小適中",
          widget: { id: "w-shield", aria: "太陽風粒子被地球磁場偏折，磁場弱時會直接撞到地球", rw: 0.42, rn: 0.8,
            controls: [{ k: "b", label: "磁場強度", min: 0, max: 1, step: 0.05 }, { k: "t", label: "時間", min: 0, max: 1, step: 0.01 }], play: { k: "t", dur: 3000 } },
          space: "把磁場調到 0：粒子直直撞上地球。這就是火星的處境，沒有全球磁場，大氣被太陽風慢慢剝走。",
          trap: "以為臭氧層擋住太陽風。臭氧層擋的是紫外線，擋帶電粒子的是磁層。",
          quiz: { q: "地球的防護罩中，主要能偏折太陽風帶電粒子的是？", answer: "a", options: [
            { c: "a", text: "磁層" },
            { c: "b", text: "臭氧層", why: "臭氧層吸收紫外線，不是偏折帶電粒子。" },
            { c: "c", text: "對流層", why: "對流層是天氣現象發生的地方。" },
            { c: "d", text: "海洋", why: "海洋不在地球外圍，擋不到太陽風。" }] },
          sol: { id: "s-F9", aria: "逐步圖解：有磁場和沒磁場" }
        },
        {
          id: "F10", title: "宇宙膨脹與哈伯定律", page: "主題6", tags: ["src", "add"],
          say: "在氣球上畫幾個點再吹氣，每個點都看到別的點在遠離自己，而且<b>越遠的點跑得越快</b>。宇宙就是這樣：星系間的空間在膨脹，所以遠方星系的光被拉長（紅移），而且速度和距離成正比，這是<b>哈伯定律</b>。",
          formula: "<i>v</i> = <i>H</i><sub>0</sub> × <i>d</i>　　（<i>H</i><sub>0</sub> ≈ 70 km/s/Mpc）　　大霹靂證據：紅移與哈伯定律、宇宙微波背景輻射（約 2.7 K）",
          widget: { id: "w-hubble", aria: "星系隨宇宙膨脹互相遠離，速度與距離成正比", rw: 0.42, rn: 0.85,
            controls: [{ k: "s", label: "膨脹", min: 1, max: 2, step: 0.01 }], play: { k: "s", dur: 4000 } },
          space: "從任何一個星系看出去都一樣：別人都在遠離你。所以宇宙膨脹沒有中心。",
          trap: "以為宇宙是從某個中心點往外炸開。膨脹的是空間本身，處處都在膨脹。",
          quiz: { q: "若 H₀ = 70 km/s/Mpc，一個距離 100 Mpc 的星系，遠離我們的速度約為？", answer: "c", options: [
            { c: "a", text: "0.7 km/s", why: "v = H₀ × d，要相乘：70 × 100。" },
            { c: "b", text: "1.43 km/s", why: "100 ÷ 70 是除反了。" },
            { c: "c", text: "7000 km/s" },
            { c: "d", text: "70 km/s", why: "那是 1 Mpc 處星系的速度。" }] },
          sol: { id: "s-F10", aria: "逐步圖解：讀 v-d 直線" }
        }
      ]
    },
    {
      id: "7-11", short: "天球與四季", title: "天球、周日運動、周年運動與四季（主題7～11）",
      plan: { goal: "會用北極星仰角求緯度、判斷拱極星，知道恆星日比太陽日短 4 分鐘，會用太陽直射緯度算正午太陽仰角，知道多波段觀測的限制。", prereq: "地球自轉與公轉、地軸傾斜 23.5°。", time: "約 5 節課。" },
      cards: [
        {
          id: "F11", title: "周日運動：北極星仰角與拱極星", page: "主題9", tags: ["src"],
          say: "地球自轉，所以天上的星星每小時繞北極星轉 15°。<b>北極星的仰角剛好等於你所在的緯度</b>。在台北（約 25°N）北極星離地平線 25°；離北極星夠近的星星整圈都在地平線上，永遠不會落下，叫<b>拱極星</b>。",
          formula: "北極星仰角 = 觀測者緯度 <i>φ</i>　　周日運動：每小時 15°（東升西落）　　拱極星：與北天極的角距 &lt; <i>φ</i>",
          widget: { id: "w-polaris", aria: "觀測者的地平線、北極星仰角與拱極星範圍", rw: 0.45, rn: 0.85,
            controls: [{ k: "lat", label: "緯度 φ", min: 0, max: 90, step: 1 }] },
          space: "走到北極（90°），北極星在頭頂，所有星星都是拱極星；走到赤道（0°），北極星貼在地平線上，沒有拱極星。",
          trap: "用 90° − 緯度當北極星仰角。那是北極星的「天頂距」。",
          quiz: { q: "在北緯 25° 的地方觀察，北極星的仰角約是？", answer: "a", options: [
            { c: "a", text: "25°" },
            { c: "b", text: "65°", why: "65° 是 90° − 25°，是北極星離天頂的角度。" },
            { c: "c", text: "23.5°", why: "23.5° 是地軸傾角，跟北極星仰角無關。" },
            { c: "d", text: "0°", why: "只有在赤道上北極星才會貼著地平線。" }] },
          sol: { id: "s-F11", aria: "逐步圖解：仰角等於緯度" }
        },
        {
          id: "F12", title: "周年運動：恆星日與太陽日", page: "主題10", tags: ["src", "add"],
          say: "地球自轉一圈（相對遠方恆星）是<b>恆星日 23 時 56 分</b>。可是地球同時在公轉，每天往前走約 1°，要再多轉 1° 才會再對到太陽，所以<b>太陽日是 24 小時</b>。結果每顆星每天提早約 4 分鐘升起，一個月提早約 2 小時，所以四季的星空不同。",
          formula: "恆星日 ≈ 23 時 56 分　　太陽日 = 24 時　　每天差約 4 分鐘 → 每月約 2 小時 → 一年剛好 24 小時",
          widget: { id: "w-sidereal", aria: "地球公轉時，相對恆星與相對太陽轉一圈的差別", rw: 0.45, rn: 0.85,
            controls: [{ k: "d", label: "經過天數", min: 0, max: 60, step: 1 }] },
          space: "圖中把每天公轉的角度放大來看：紅箭頭（指向遠方恆星）轉滿一圈時，藍箭頭（指向太陽）還差一點。",
          trap: "把提早和延後搞反：恆星日比較短，所以同一顆星每天<b>提早</b>出現。",
          quiz: { q: "某恆星今晚 20:00 在正南方。約 30 天後，它何時會在正南方？", answer: "c", options: [
            { c: "a", text: "22:00", why: "恆星每天提早 4 分鐘，不是延後。" },
            { c: "b", text: "20:00", why: "每天提早 4 分鐘，30 天累積 2 小時。" },
            { c: "c", text: "18:00" },
            { c: "d", text: "19:56", why: "這只是 1 天後。30 天要提早 120 分鐘。" }] },
          sol: { id: "s-F12", aria: "逐步圖解：每天 4 分鐘累積" }
        },
        {
          id: "F13", title: "四季成因與正午太陽仰角", page: "主題11", tags: ["src"],
          say: "四季不是因為地球離太陽遠近，而是<b>地軸傾斜 23.5°</b>。公轉時太陽直射的緯度在南北回歸線之間來回移動：夏至直射北回歸線、冬至直射南回歸線、春秋分直射赤道。太陽越直射，正午仰角越高、白天越長，就越熱。",
          formula: "正午太陽仰角 = 90° − |<i>φ</i> − <i>δ</i>|　　（<i>φ</i>：觀測緯度，<i>δ</i>：太陽直射緯度，北為正）<br>夏至 <i>δ</i> = +23.5°　春秋分 <i>δ</i> = 0°　冬至 <i>δ</i> = −23.5°",
          widget: { id: "w-season", aria: "一年中太陽直射緯度變化與某地正午太陽仰角", rw: 0.45, rn: 0.85,
            controls: [{ k: "d", label: "日期", min: 0, max: 364, step: 1 }, { k: "lat", label: "觀測緯度", min: -60, max: 70, step: 1 }], play: { k: "d", dur: 6000 } },
          space: "把觀測緯度設在 25°N 拉日期：夏至時太陽幾乎在頭頂（88.5°），冬至只剩 41.5°，影子差很多。",
          trap: "以為夏天是因為地球離太陽比較近。北半球夏天時，地球其實離太陽比較遠一點。",
          quiz: { q: "台北約在北緯 25°。夏至當天正午的太陽仰角約是？", answer: "b", options: [
            { c: "a", text: "65°", why: "那是春分、秋分（直射赤道）時：90° − 25°。" },
            { c: "b", text: "88.5°" },
            { c: "c", text: "41.5°", why: "那是冬至（直射南回歸線）時。" },
            { c: "d", text: "113.5°", why: "仰角不會超過 90°。要用 90° − |25° − 23.5°|。" }] },
          sol: { id: "s-F13", aria: "逐步圖解：直射緯度與觀測緯度相差 1.5°" }
        },
        {
          id: "F14", title: "多波段觀測與大氣窗口", page: "主題8", tags: ["src", "add"],
          say: "天體會發出各種波長的電磁波，但地球大氣只讓<b>可見光</b>和<b>部分無線電波</b>（及少部分紅外線）順利通過，這叫大氣窗口。γ 射線、X 射線、大部分紫外線都被擋掉，要觀測它們必須把望遠鏡送上<b>太空</b>。",
          formula: "大氣窗口：可見光、部分紅外線、無線電波 → 地面望遠鏡可觀測　　γ 射線、X 射線、紫外線、多數紅外線 → 需太空望遠鏡",
          widget: { id: "w-window", aria: "各波段電磁波穿透大氣到達地面的比例（示意）", rw: 0.36, rn: 0.7,
            controls: [{ k: "w", label: "波段", min: 0, max: 6, step: 1 }] },
          space: "藍色曲線高的地方，地面就看得到。中間兩個「窗口」（可見光、無線電）以外，都要上太空。",
          trap: "以為所有波段在高山上都能觀測。高山能減少一點水氣吸收，但 X 射線、γ 射線一定要上太空。",
          quiz: { q: "想觀測黑洞周圍發出的 X 射線，應該使用？", answer: "c", options: [
            { c: "a", text: "高山上的光學望遠鏡", why: "X 射線會被大氣吸收，高山也到不了地面。" },
            { c: "b", text: "地面的電波望遠鏡", why: "電波望遠鏡只收得到無線電波。" },
            { c: "c", text: "太空中的 X 射線望遠鏡" },
            { c: "d", text: "任何望遠鏡都可以", why: "不同波段要用不同的望遠鏡，且 X 射線要上太空。" }] },
          sol: { id: "s-F14", aria: "逐步圖解：X 射線到不了地面" }
        }
      ]
    }
  ],
  footer: [
    "課本與講義：高二地球科學 地球的歷史（主題1、2）＋天文（主題3～11）。本機原始檔「地球科學/」。",
    "內容依平台教材包 tm_17 等；大氣成分演變、黑體輻射曲線、大氣透明度為示意圖；行星半徑與密度為常用數據；H₀ 取 70 km/s/Mpc。"
  ],
  script: String.raw`
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function circle(g,x,y,r,fill,stroke,w){ g.save(); g.beginPath(); g.arc(x,y,r,0,TAU); if(fill){ g.fillStyle=fill; g.fill(); } if(stroke){ g.strokeStyle=stroke; g.lineWidth=w||1.5; g.stroke(); } g.restore(); }

/* F1 密度分異 */
function diffDraw(g,c,C,t){ var G=frame(full(c),-1.2,1.2,-1.2,1.2,16,true), R=1, rnd=seeded(21), cx=G.X(0), cy=G.Y(0), r0=R*G.sx;
  circle(g,cx,cy,r0,t<0.15?alpha('#a0522d',0.5):alpha('#e07b39',0.25+0.4*Math.min(t*3,1)),C.ink,2);
  if(t>0.5){ var k=(t-0.5)/0.5; circle(g,cx,cy,r0*0.55,alpha('#d98c3a',0.35*k),null); circle(g,cx,cy,r0*0.36,alpha('#5b6578',0.55*k),null); }
  for(var i=0;i<140;i++){ var a=rnd()*TAU, rr=Math.sqrt(rnd())*0.95, iron=i%3===0, tgt=iron?rnd()*0.34:0.55+rnd()*0.4, s=clamp((t-0.15)/0.75,0,1), r=rr+(tgt-rr)*s; dot(g,G.X(r*Math.cos(a)),G.Y(r*Math.sin(a)),iron?3.5:2.6,iron?'#3d4452':'#e8d6a8'); }
  if(t<0.3) T(g,'加熱：撞擊、收縮、衰變',G.X(0),G.Y(-1.12),C.red,12,'center','700');
  if(t>0.9){ T(g,'地核（鐵鎳）',G.X(0),G.Y(0),C.sheet,12,'center','700'); T(g,'地函、地殼（矽酸鹽）',G.X(0),G.Y(0.78),C.ink,12,'center','700'); } }
widget('w-diff',{state:{t:0},rw:0.45,rn:0.85,fmt:{t:function(v){return Math.round(v*100)+'%';}},
  draw:function(g,c,s){ diffDraw(g,c,c.C,s.t); },
  out:function(s){ return s.t<0.15?'剛形成：成分混在一起。':s.t<0.6?'熔化中：<b>重的鐵往中心沉</b>，輕的矽酸鹽往外浮。':'<b>密度分異</b>完成：地核（鐵鎳）在中心，地函與地殼在外。'; }
});
widget('s-F1',{state:{},steps:3,rw:0.45,rn:0.85,
  draw:function(g,c,s){ diffDraw(g,c,c.C,[0.1,0.45,1][s.step]); },
  out:steps(['熱的來源：隕石撞擊、重力收縮、放射性衰變。','地球熔化後，重的往下、輕的往上。','形成分層。<b>太陽輻射</b>只加熱表面，不是熔融原因。'])
});

/* F2 大氣演變（示意） */
function atmoComp(t){ /* t = 距今億年；回傳各成分比例 [H/He, H2O+CO2, N2, O2] */
  if(t>45) return [1,0,0,0]; if(t>43){ var u=(45-t)/2; return [1-u,u*0.85,u*0.15,0]; }
  var o2=t>24?0.001:t>4?0.02+0.08*(24-t)/20:0.1+0.11*(4-t)/4, n2=t>24?0.15+0.35*(43-t)/19:0.5+0.28*(24-t)/24, co=Math.max(0,1-o2-n2); return [0,co,n2,o2]; }
var EV=[[46,'地球形成'],[40,'海洋形成'],[35,'藍綠菌、疊層石'],[24,'氧氣增加、帶狀鐵礦'],[5.4,'寒武紀大爆發'],[4,'臭氧層、生物上陸']];
function atmoDraw(g,c,C,t,hl){ var G=frame(full(c),48,-2,-0.45,1.12,26,false); axes(g,G,[46,0,0,1],C,{xstep:-10,ystep:0.25,yfmt:function(v){return Math.round(v*100)+'%';},xlabel:'距今（億年）'});
  var cols=['#c9b9e8',C.gold,C.blue,C.teal], labs=['氫、氦','水氣、CO₂','氮氣','氧氣'];
  for(var k=0;k<4;k++){ g.save(); g.fillStyle=alpha(cols[k],0.55); g.beginPath(); var first=true; for(var x=46;x>=0;x-=0.25){ var a=atmoComp(x), lo=0; for(var j=0;j<k;j++) lo+=a[j]; g.lineTo(G.X(x),G.Y(lo+a[k])); } for(var x2=0;x2<=46;x2+=0.25){ var b=atmoComp(x2), lo2=0; for(var j2=0;j2<k;j2++) lo2+=b[j2]; g.lineTo(G.X(x2),G.Y(lo2)); } g.closePath(); g.fill(); g.restore(); }
  L(g,G.X(t),G.Y(0),G.X(t),G.Y(1.05),C.red,2.5);
  EV.forEach(function(e,i){ var y=-0.12-0.1*(i%3); dot(g,G.X(e[0]),G.Y(-0.04),4,C.ink); T(g,e[1],G.X(e[0]),G.Y(y),hl===i?C.red:C.ink,11,'center',hl===i?'700':'500'); });
  labs.forEach(function(l,k){ box(g,G.X(46)+k*82,G.Y(1.1)-6,12,12,alpha(cols[k],0.7),null); T(g,l,G.X(46)+k*82+16,G.Y(1.1),C.ink,11,'left'); }); }
widget('w-atmo',{state:{t:30},rw:0.48,rn:0.95,fmt:{t:function(v){return v.toFixed(1)+' 億年前';}},
  draw:function(g,c,s){ atmoDraw(g,c,c.C,s.t,-1); },
  out:function(s){ var a=atmoComp(s.t), st=s.t>43?'第一階段：原始太陽星雲氣體（氫、氦）':s.t>24?'第二階段：火山釋氣（水氣、CO₂ 為主）':'第三階段：海、氣、生物交互作用（CO₂ 減少、O₂ 增加）'; return s.t.toFixed(1)+' 億年前：<b>'+st+'</b>　｜　O₂ 約 '+Math.round(a[3]*100)+'%（示意）'; }
});
widget('s-F2',{state:{},steps:3,rw:0.48,rn:0.95,
  draw:function(g,c,s){ atmoDraw(g,c,c.C,[44.5,32,10][s.step],[0,1,3][s.step]); },
  out:steps(['第一階段：太陽星雲的氫、氦，很快逸散到太空。','第二階段：火山釋出<b>水氣與二氧化碳</b>，水氣冷凝成原始海洋。','第三階段：CO₂ 被海洋與生物除去，藍綠菌製造氧氣，大氣逐漸變成現在的氮、氧為主。'])
});

/* F3 地層剖面 */
function strataDraw(g,c,C,t,lab){ var G=frame(full(c),0,10,-0.5,6.5,16,false), cols=['#c9a66b','#9fb4c7','#d6c28f','#b5a9c9'], names=['A','B','C'];
  for(var i=0;i<3;i++){ if(t>i){ var y0=i*1.4, y1=y0+1.4; box(g,G.X(0.5),G.Y(y1),9*G.sx,1.4*G.sy,alpha(cols[i],0.85),C.ink,1); T(g,names[i],G.X(1.2),G.Y((y0+y1)/2),C.ink,15,'center','700'); } }
  if(t>3){ g.save(); g.fillStyle=alpha('#c0392b',0.75); g.beginPath(); g.moveTo(G.X(5),G.Y(0)); g.lineTo(G.X(5.8),G.Y(0)); g.lineTo(G.X(6.3),G.Y(4.2)); g.lineTo(G.X(5.6),G.Y(4.2)); g.closePath(); g.fill(); g.restore(); T(g,'D 岩脈',G.X(6.4),G.Y(2.2),C.red,14,'left','700'); }
  if(t>4){ box(g,G.X(0.5),G.Y(5.6),9*G.sx,1.4*G.sy,alpha(cols[3],0.85),C.ink,1); T(g,'E',G.X(1.2),G.Y(4.9),C.ink,15,'center','700'); }
  if(lab) T(g,lab,G.X(9.4),G.Y(6.3),C.blue,12,'right','700'); }
var LAWS=['尚未沉積','A 先沉積（最老）','B 疊在 A 上（疊置定律）','C 疊在 B 上','D 切穿 A、B、C（截切定律：D 比較新）','E 蓋在最上面，沒被 D 切到（E 最新）'];
widget('w-strata',{state:{t:5},rw:0.45,rn:0.85,fmt:{t:function(v){return v+' / 5';}},
  draw:function(g,c,s){ strataDraw(g,c,c.C,s.t,LAWS[s.t]); },
  out:function(s){ return '<b>'+LAWS[s.t]+'</b>'+(s.t===5?'　→　順序 A → B → C → D → E':''); }
});
widget('s-F3',{state:{},steps:3,rw:0.45,rn:0.85,
  draw:function(g,c,s){ strataDraw(g,c,c.C,[3,4,5][s.step],['疊置：A → B → C','截切：D 比 A、B、C 新','E 沒被切：E 比 D 新'][s.step]); },
  out:steps(['疊置定律：下面的先沉積，A → B → C。','截切定律：D 切穿 A、B、C，所以 D 在它們之後。','E 蓋在上面而且沒有被 D 切到，E 最後形成：<b>A → B → C → D → E</b>。'])
});

/* F4 地質年代 */
var ERAS=[[4600,4000,'冥古元','#7a6a8f'],[4000,2500,'太古元','#9a86b5'],[2500,541,'元古元','#b9a8d0'],[541,252,'古生代','#7fb3a6'],[252,66,'中生代','#a7cf8f'],[66,0,'新生代','#e8d38a']];
function erasDraw(g,c,C,t,fos){ var P={x:0,y:0,w:c.w,h:c.h}, G=frame(P,4700,-100,-5.4,2.3,22,false), Z=frame(P,640,-20,-5.4,2.3,22,false);
  /* 上排：整個 46 億年 */
  ERAS.forEach(function(e,i){ box(g,G.X(e[0]),G.Y(1.6),(e[0]-e[1])*Math.abs(G.sx),0.9*Math.abs(G.sy),alpha(e[3],0.8),C.sheet,1); if(i<3) T(g,e[2],G.X((e[0]+e[1])/2),G.Y(1.15),C.ink,11,'center','700'); });
  T(g,'← 隱生元（約 40 億年）',G.X(2600),G.Y(2.0),C.muted,11,'center'); T(g,'顯生元',G.X(270),G.Y(2.0),C.red,11,'center','700');
  for(var k=0;k<=4600;k+=1000) T(g,(k/100)+' 億年前',G.X(k),G.Y(0.45),C.muted,10,'center');
  if(t>541){ L(g,G.X(t),G.Y(1.9),G.X(t),G.Y(0.6),C.ink,2); dot(g,G.X(t),G.Y(1.9),5,C.ink); }
  /* 放大鏡：顯生元 5.41 億年 */
  g.save(); g.fillStyle=alpha(C.red,0.07); g.beginPath(); g.moveTo(G.X(541),G.Y(0.7)); g.lineTo(G.X(0),G.Y(0.7)); g.lineTo(Z.X(-20),Z.Y(-0.2)); g.lineTo(Z.X(640),Z.Y(-0.2)); g.closePath(); g.fill(); g.restore();
  L(g,G.X(541),G.Y(0.7),Z.X(640),Z.Y(-0.2),C.red,1,[3,3]); L(g,G.X(0),G.Y(0.7),Z.X(-20),Z.Y(-0.2),C.red,1,[3,3]);
  T(g,'放大最近 5.41 億年',Z.X(320),Z.Y(0.15),C.red,11,'center','700');
  ERAS.slice(3).forEach(function(e){ box(g,Z.X(e[0]),Z.Y(-0.4),(e[0]-e[1])*Math.abs(Z.sx),0.9*Math.abs(Z.sy),alpha(e[3],0.85),C.sheet,1); T(g,e[2],Z.X((e[0]+e[1])/2),Z.Y(-0.85),C.ink,13,'center','700'); });
  [[541,'5.41 億'],[252,'2.52 億'],[66,'0.66 億'],[0,'現在']].forEach(function(m){ T(g,m[1],Z.X(m[0]),Z.Y(-1.55),C.muted,10,'center'); });
  [252,66].forEach(function(x){ L(g,Z.X(x),Z.Y(-0.2),Z.X(x),Z.Y(-1.35),C.red,2.5); T(g,'大滅絕',Z.X(x),Z.Y(-0.05),C.red,11,'center','700'); });
  if(t<=541){ L(g,Z.X(t),Z.Y(-0.25),Z.X(t),Z.Y(-1.35),C.ink,2); dot(g,Z.X(t),Z.Y(-0.25),5,C.ink); }
  if(fos){ var rows=[['三葉蟲（標準化石）',521,252,C.blue],['恐龍、菊石（標準化石）',230,66,C.teal],['珊瑚（指相化石）',500,0,C.gold]]; rows.forEach(function(r,i){ var y=-2.4-i*1.25; L(g,Z.X(r[1]),Z.Y(y),Z.X(r[2]),Z.Y(y),r[3],7); T(g,r[0],Z.X(r[1]),Z.Y(y+0.32),r[3],11,'left','700'); }); } }
function eraOf(t){ for(var i=0;i<ERAS.length;i++) if(t<=ERAS[i][0]&&t>=ERAS[i][1]) return ERAS[i][2]; return ''; }
widget('w-eras',{state:{t:150},rw:0.62,rn:1.1,fmt:{t:function(v){return v+' 百萬年前';}},
  draw:function(g,c,s){ erasDraw(g,c,c.C,s.t,true); },
  out:function(s){ return s.t+' 百萬年前：<b>'+eraOf(s.t)+'</b>　｜　古生代／中生代、中生代／新生代的分界都是生物大滅絕'; }
});
widget('s-F4',{state:{},steps:2,rw:0.62,rn:1.1,
  draw:function(g,c,s){ erasDraw(g,c,c.C,s.step?230:400,true); },
  out:steps(['三葉蟲只生活在古生代、恐龍和菊石只在中生代：時間短、分布廣，一看到就知道年代，是<b>標準化石</b>。','珊瑚活了很長時間，不能指出年代，但能告訴你當時是溫暖淺海，是<b>指相化石</b>。答案：生存時間短、分布範圍廣。'])
});

/* F5 半衰期 */
function decayDraw(g,c,C,n,mark){ var P=panels(c,0.62), G=frame(P[0],-0.4,10.4,-0.08,1.1,26,false); axes(g,G,[0,10,0,1],C,{xstep:1,ystep:0.25,yfmt:function(v){return Math.round(v*100)+'%';},xlabel:'半衰期數'});
  plot(g,G,function(x){return Math.pow(0.5,x);},0,10,C.muted,1.5,[4,4]); plot(g,G,function(x){return 1-Math.pow(0.5,x);},0,10,alpha(C.gold,0.6),1.5,[4,4]);
  plot(g,G,function(x){return Math.pow(0.5,x);},0,n,C.blue,3); dot(g,G.X(n),G.Y(Math.pow(0.5,n)),6,C.red);
  if(mark) for(var k=1;k<=3;k++){ dot(g,G.X(k),G.Y(Math.pow(0.5,k)),5,C.teal); T(g,'1/'+Math.pow(2,k),G.X(k)+6,G.Y(Math.pow(0.5,k))-10,C.teal,12,'left','700'); }
  var H=frame(P[1],0,3,-0.1,1.1,24,false), p=Math.pow(0.5,n); box(g,H.X(0.6),H.Y(1),1.8*H.sx,1*H.sy,alpha(C.gold,0.35),C.gold,2); box(g,H.X(0.6),H.Y(p),1.8*H.sx,p*H.sy,alpha(C.blue,0.5),C.blue,2);
  T(g,'母 '+(p*100).toFixed(1)+'%',H.X(1.5),H.Y(p/2),C.sheet,12,'center','700'); T(g,'子 '+((1-p)*100).toFixed(1)+'%',H.X(1.5),H.Y((1+p)/2),C.ink,12,'center','700'); }
widget('w-decay',{state:{n:1},rw:0.42,rn:0.8,fmt:{n:function(v){return v.toFixed(1);}},
  draw:function(g,c,s){ decayDraw(g,c,c.C,s.n,false); },
  out:function(s){ var p=Math.pow(0.5,s.n); return '經過 '+s.n.toFixed(1)+' 個半衰期：母元素剩 <b>'+(p*100).toFixed(2)+'%</b>，子元素 '+((1-p)*100).toFixed(2)+'%'+(s.n>=10?'（太少了，定年誤差過大）':''); }
});
widget('s-F5',{state:{},steps:2,rw:0.42,rn:0.8,
  draw:function(g,c,s){ decayDraw(g,c,c.C,3,true); },
  out:steps(['剩 1/8 = ½ × ½ × ½：經過 <b>3 個半衰期</b>。','年代 = 3 × 5730 = <b>17190 年</b>。'])
});

/* F6 星等 */
function magDraw(g,c,C,a,b){ var G=frame(full(c),-2,7.5,0,10,20,false);
  g.save(); g.fillStyle='#0f1730'; g.fillRect(G.X(-2),G.Y(10),9.5*G.sx,10*Math.abs(G.sy)); g.restore();
  for(var m=-1;m<=6;m++){ var r=Math.max(1.5,9*Math.pow(10,-0.2*m)); circle(g,G.X(m),G.Y(6.5),r,'rgba(255,248,220,'+(0.35+0.65*Math.pow(10,-0.12*(m+1)))+')',null); T(g,m+' 等',G.X(m),G.Y(4.6),'#c9d3ee',11,'center'); }
  [[a,C.red,'甲'],[b,C.teal,'乙']].forEach(function(o,i){ L(g,G.X(o[0]),G.Y(8.4),G.X(o[0]),G.Y(7.6),o[1],3); T(g,o[2],G.X(o[0]),G.Y(8.9),o[1],13,'center','700'); });
  var d=b-a, ratio=Math.pow(100,d/5); T(g,'甲比乙亮 '+(ratio>=1?ratio.toFixed(ratio<10?2:0):ratio.toFixed(3))+' 倍',G.X(2.75),G.Y(2),'#ffffff',16,'center','700'); }
widget('w-mag',{state:{a:1,b:6},rw:0.36,rn:0.7,fmt:{a:function(v){return v+' 等';},b:function(v){return v+' 等';}},
  draw:function(g,c,s){ magDraw(g,c,c.C,s.a,s.b); },
  out:function(s){ var d=s.b-s.a; return '星等差 '+d+'：亮度比 = 100^('+d+'/5) = 2.512^'+d+' = <b>'+Math.pow(100,d/5).toFixed(2)+'</b>（數字越小越亮）'; }
});
widget('s-F6',{state:{},steps:2,rw:0.36,rn:0.7,
  draw:function(g,c,s){ magDraw(g,c,c.C,1,s.step?6:2); },
  out:steps(['差 1 等：亮度差 2.512 倍。','1 等和 6 等差 5 等：2.512⁵ = <b>100 倍</b>。'])
});

/* F7 黑體輻射 */
function planck(l,T){ var x=1.4388e7/(l*T); return 1/(Math.pow(l,5)*(Math.exp(x)-1)); }
function tColor(T){ var t=T/100, r,g,b; if(t<=66){ r=255; g=99.47*Math.log(t)-161.12; b=t<=19?0:138.52*Math.log(t-10)-305.04; } else { r=329.7*Math.pow(t-60,-0.1332); g=288.12*Math.pow(t-60,-0.0755); b=255; } function c(v){ return Math.round(Math.max(0,Math.min(255,v))); } return 'rgb('+c(r)+','+c(g)+','+c(b)+')'; }
function bbDraw(g,c,C,K,mark){ var P=panels(c,0.72), G=frame(P[0],80,2100,-0.08,1.12,26,false), ref=planck(2.9e6/12000,12000);
  axes(g,G,[100,2000,0,1.05],C,{xstep:300,ystep:0.25,xlabel:'波長 (nm)',ylabel:'輻射強度（相對）'});
  var grd=g.createLinearGradient(G.X(400),0,G.X(700),0); ['#7b3fe4','#3b5bff','#22c3c3','#38c348','#f2e33a','#f29b30','#e53935'].forEach(function(col,i){ grd.addColorStop(i/6,col); }); g.save(); g.globalAlpha=0.18; g.fillStyle=grd; g.fillRect(G.X(400),G.Y(1.05),G.X(700)-G.X(400),G.Y(0)-G.Y(1.05)); g.restore();
  T(g,'可見光',G.X(550),G.Y(1.08),C.muted,11,'center','700');
  if(mark){ [3500,5800,10000].forEach(function(t2){ plotClip(g,G,function(l){return planck(l,t2)/ref;},100,2000,1.05,C.muted,1.2,[4,4]); }); }
  clipTo(g,G,100,2000,0,1.05); plot(g,G,function(l){return planck(l,K)/ref;},100,2000,C.red,3); g.restore();
  var lm=2.9e6/K; if(lm<2000){ L(g,G.X(lm),G.Y(0),G.X(lm),G.Y(Math.min(1.05,planck(lm,K)/ref)),C.ink,1.2,[3,3]); }
  var H={x:P[1].x+12,y:P[1].y+20,w:P[1].w-24,h:P[1].h-40}; circle(g,H.x+H.w/2,H.y+H.h/2,Math.min(H.w,H.h)/2.6,tColor(K),C.ink,1); T(g,K+' K',H.x+H.w/2,H.y+H.h-6,C.ink,13,'center','700'); }
widget('w-bb',{state:{t:5800},rw:0.42,rn:0.8,fmt:{t:function(v){return v+' K';}},
  draw:function(g,c,s){ bbDraw(g,c,c.C,s.t,false); },
  out:function(s){ var lm=2.9e6/s.t; return '峰值波長 λmax ≈ 2.9×10⁶ ÷ '+s.t+' = <b>'+lm.toFixed(0)+' nm</b>　｜　溫度越高，峰值越往短波（藍）移'; }
});
widget('s-F7',{state:{},steps:2,rw:0.42,rn:0.8,
  draw:function(g,c,s){ bbDraw(g,c,c.C,s.step?10000:3500,true); },
  out:steps(['3500 K 的恆星：峰值在紅外線附近，看起來偏<b>紅</b>。','10000 K 的恆星：峰值在紫外線附近，看起來<b>藍白</b>，表面溫度最高。'])
});

/* F8 行星 */
var PL=[['水星',0.38,5.43],['金星',0.95,5.24],['地球',1,5.51],['火星',0.53,3.93],['木星',11.2,1.33],['土星',9.45,0.69],['天王星',4.0,1.27],['海王星',3.88,1.64]];
function planetDraw(g,c,C,idx,groups){ var G=frame(full(c),-0.6,1.25,-0.3,6.3,30,false);
  function lx(r){ return Math.log10(r); }
  for(var k=-0.5;k<=1.2;k+=0.5){ } [0.3,1,3,10].forEach(function(r){ L(g,G.X(lx(r)),G.Y(0),G.X(lx(r)),G.Y(6),C.grid,1); T(g,String(r),G.X(lx(r)),G.Y(0)+13,C.muted,11,'center'); });
  for(var d=0;d<=6;d++){ L(g,G.X(-0.55),G.Y(d),G.X(1.2),G.Y(d),C.grid,1); T(g,String(d),G.X(-0.55)-6,G.Y(d),C.muted,11,'right'); }
  T(g,'半徑（地球 = 1，對數刻度）',G.X(1.2),G.Y(0)+28,C.muted,11,'right'); T(g,'密度 (g/cm³)',G.X(-0.55)+4,G.Y(6.2),C.muted,11,'left');
  L(g,G.X(-0.55),G.Y(1),G.X(1.2),G.Y(1),C.blue,1.2,[4,3]); T(g,'水 = 1',G.X(1.2),G.Y(1)-9,C.blue,10,'right');
  if(groups){ g.save(); g.strokeStyle=C.teal; g.lineWidth=2; g.setLineDash([5,4]); g.beginPath(); g.ellipse(G.X(-0.15),G.Y(5),70,40,0,0,TAU); g.stroke(); g.strokeStyle=C.gold; g.beginPath(); g.ellipse(G.X(0.82),G.Y(1.2),90,40,0,0,TAU); g.stroke(); g.restore(); T(g,'類地行星',G.X(-0.15),G.Y(5)-48,C.teal,12,'center','700'); T(g,'類木行星',G.X(0.82),G.Y(1.2)-48,C.gold,12,'center','700'); }
  PL.forEach(function(p,i){ var on=i===idx, x=G.X(lx(p[1])), y=G.Y(p[2]), r=4+3*Math.sqrt(p[1]); circle(g,x,y,r,alpha(i<4?C.teal:C.gold,on?0.9:0.45),on?C.red:null,3); T(g,p[0],x+r+4,y,on?C.red:C.ink,11,'left',on?'700':'500'); }); }
widget('w-planets',{state:{i:5},rw:0.45,rn:0.85,fmt:{i:function(v){return PL[v][0];}},
  draw:function(g,c,s){ planetDraw(g,c,c.C,s.i,false); },
  out:function(s){ var p=PL[s.i]; return p[0]+'：半徑 '+p[1]+' 倍地球、密度 <b>'+p[2]+' g/cm³</b>　→　'+(s.i<4?'類地行星（小、密度大）':'類木行星（大、密度小）'); }
});
widget('s-F8',{state:{},steps:2,rw:0.45,rn:0.85,
  draw:function(g,c,s){ planetDraw(g,c,c.C,s.step?5:2,true); },
  out:steps(['水金地火在左上：半徑小、密度約 4～5.5。','木土天海在右下：半徑大、密度小（土星不到 1）。類木行星：<b>體積大、密度小</b>。'])
});

/* F9 防護罩 */
function shieldDraw(g,c,C,B,t){ var G=frame(full(c),-6,6,-3,3,14,true), rnd=seeded(31);
  circle(g,G.X(-5.2),G.Y(0),0.9*G.sx,'#f6c343',null); T(g,'太陽風 →',G.X(-4.2),G.Y(2.6),C.gold,12,'left','700');
  if(B>0.02){ g.save(); g.strokeStyle=alpha(C.blue,0.35+0.4*B); g.lineWidth=1.5; for(var k=1;k<=4;k++){ var a=(0.6+k*0.45)*(0.6+0.6*B); g.beginPath(); g.ellipse(G.X(2+a*0.2),G.Y(0),a*G.sx,a*0.75*G.sx,0,0,TAU); g.stroke(); } g.restore(); }
  circle(g,G.X(2),G.Y(0),0.55*G.sx,alpha(C.blue,0.8),C.ink,1.5); T(g,'地球',G.X(2),G.Y(0),C.sheet,11,'center','700');
  var R=0.9+2.3*B;
  for(var i=0;i<14;i++){ var y0=-2.4+i*0.37+0.1*rnd(), x=-4+t*7.5, y=y0, hit=false;
    if(x>2-R){ var push=(x-(2-R))/R; if(B>0.02){ y=y0+(y0>=0?1:-1)*Math.min(3,push*push*2.5*B); } if(B<0.02&&Math.abs(y0)<0.55&&x>1.45){ x=1.45; hit=true; } }
    dot(g,G.X(x),G.Y(y),3.5,hit?C.red:C.gold); }
  if(B<0.1) T(g,'沒有磁層：粒子直接撞上',G.X(2),G.Y(-2.6),C.red,12,'center','700'); }
widget('w-shield',{state:{b:1,t:0.6},rw:0.42,rn:0.8,fmt:{b:function(v){return Math.round(v*100)+'%';},t:function(v){return Math.round(v*100)+'%';}},
  draw:function(g,c,s){ shieldDraw(g,c,c.C,s.b,s.t); },
  out:function(s){ return s.b>0.1?'磁層把帶電粒子<b>偏折</b>開，只有兩極附近漏進來形成極光。':'磁場很弱：太陽風<b>直接撞上</b>大氣（像火星一樣，大氣會被慢慢剝走）。'; }
});
widget('s-F9',{state:{},steps:2,rw:0.42,rn:0.8,
  draw:function(g,c,s){ shieldDraw(g,c,c.C,s.step?1:0,0.75); },
  out:steps(['沒有磁場時，太陽風的帶電粒子直接撞上地球。','有磁層時粒子被偏折：<b>磁層</b>擋太陽風；臭氧層擋的是紫外線。'])
});

/* F10 哈伯定律 */
function hubbleDraw(g,c,C,sc,mark){ var P=panels(c,0.45), G=frame(P[0],-5,5,-5,5,14,true), pts=[[0,0],[1.4,0.6],[-1.1,1.3],[0.6,-1.6],[-1.7,-0.7],[2.2,-1.2],[-0.4,2.3],[2.8,1.6],[-2.6,-2.1]];
  pts.forEach(function(p,i){ var x=p[0]*sc, y=p[1]*sc; if(i){ L(g,G.X(0),G.Y(0),G.X(x),G.Y(y),C.grid,1,[2,3]); L(g,G.X(p[0]),G.Y(p[1]),G.X(x),G.Y(y),C.red,2); } circle(g,G.X(x),G.Y(y),i?6:8,i?alpha(C.blue,0.7):C.gold,C.ink,1); });
  T(g,'我們',G.X(0),G.Y(0)-14,C.ink,11,'center','700');
  var H=frame(P[1],-20,330,-2500,25000,26,false); axes(g,H,[0,320,0,23000],C,{xstep:100,ystep:5000,xlabel:'d (Mpc)',ylabel:'v (km/s)'});
  L(g,H.X(0),H.Y(0),H.X(320),H.Y(70*320),C.blue,2.5);
  [40,90,150,210,280].forEach(function(d){ dot(g,H.X(d),H.Y(70*d*(1+0.05*Math.sin(d))),5,C.ink); });
  if(mark){ dot(g,H.X(100),H.Y(7000),7,C.red); L(g,H.X(100),H.Y(0),H.X(100),H.Y(7000),C.red,1,[3,3]); L(g,H.X(0),H.Y(7000),H.X(100),H.Y(7000),C.red,1,[3,3]); T(g,'7000',H.X(0)+4,H.Y(7000)-9,C.red,12,'left','700'); } }
widget('w-hubble',{state:{s:1.4},rw:0.42,rn:0.85,fmt:{s:function(v){return '× '+v.toFixed(2);}},
  draw:function(g,c,s){ hubbleDraw(g,c,c.C,s.s,false); },
  out:function(s){ return '空間放大 '+s.s.toFixed(2)+' 倍：離得越遠的星系，移動的距離越長（紅線越長）→ <b>速度與距離成正比</b>　v = H₀d'; }
});
widget('s-F10',{state:{},steps:2,rw:0.42,rn:0.85,
  draw:function(g,c,s){ hubbleDraw(g,c,c.C,1.3,s.step>=1); },
  out:steps(['哈伯定律：v = H₀ × d，是一條通過原點的直線。','v = 70 × 100 = <b>7000 km/s</b>。'])
});

/* F11 北極星仰角 */
function polarisDraw(g,c,C,lat,mark){ var G=frame(full(c),-1.35,1.35,-0.35,1.3,18,true), a=lat*PI/180;
  wSector(g,G,0,0,1,0,PI,alpha(C.blue,0.06)); wArc(g,G,0,0,1,0,PI,C.muted,1.2); L(g,G.X(-1.2),G.Y(0),G.X(1.2),G.Y(0),C.ink,2.5);
  T(g,'北',G.X(1.2),G.Y(0)+14,C.ink,12,'center','700'); T(g,'南',G.X(-1.2),G.Y(0)+14,C.ink,12,'center','700'); T(g,'天頂',G.X(0),G.Y(1.08),C.muted,11,'center');
  if(lat>0){ g.save(); g.fillStyle=alpha(C.gold,0.18); g.beginPath(); g.arc(G.X(Math.cos(a)),G.Y(Math.sin(a)),Math.sin(a)*G.sx,0,TAU); g.fill(); g.restore(); T(g,'拱極星（永不落下）',G.X(Math.cos(a)),G.Y(Math.sin(a))-Math.sin(a)*G.sx-8,C.gold,11,'center','700'); }
  wArc(g,G,0,0,0.3,0,a,C.red,2.5); L(g,G.X(0),G.Y(0),G.X(Math.cos(a)),G.Y(Math.sin(a)),C.red,2); circle(g,G.X(Math.cos(a)),G.Y(Math.sin(a)),6,'#fff8d0',C.ink,1.2);
  T(g,'北極星',G.X(Math.cos(a))+8,G.Y(Math.sin(a))+12,C.ink,12,'left','700'); T(g,'仰角 '+lat+'°',G.X(0.42*Math.cos(a/2))+6,G.Y(0.42*Math.sin(a/2)),C.red,13,'left','700');
  dot(g,G.X(0),G.Y(0),5,C.ink); T(g,'觀測者',G.X(0),G.Y(0)+14,C.ink,11,'center'); }
widget('w-polaris',{state:{lat:25},rw:0.45,rn:0.85,fmt:{lat:function(v){return v+'°N';}},
  draw:function(g,c,s){ polarisDraw(g,c,c.C,s.lat,false); },
  out:function(s){ return '北緯 '+s.lat+'°：北極星仰角 = <b>'+s.lat+'°</b>　｜　離北天極 '+s.lat+'° 以內的星星都是拱極星'+(s.lat===0?'（赤道上沒有拱極星）':s.lat===90?'（北極：所有北天星星都是拱極星）':''); }
});
widget('s-F11',{state:{},steps:2,rw:0.45,rn:0.85,
  draw:function(g,c,s){ polarisDraw(g,c,c.C,s.step?25:90,true); },
  out:steps(['在北極（90°N），北極星在頭頂，仰角 90°：仰角 = 緯度。','在北緯 25°，北極星仰角 = <b>25°</b>。'])
});

/* F12 恆星日與太陽日（角度放大示意） */
function siderealDraw(g,c,C,d){ var G=frame(full(c),-1.5,1.5,-1.25,1.25,14,true), ang=d*(PI/180)*6, ex=Math.cos(ang), ey=Math.sin(ang), er=0.12;
  circle(g,G.X(0),G.Y(0),16,'#f6c343',null); T(g,'太陽',G.X(0),G.Y(0)+26,C.ink,11,'center','700'); wArc(g,G,0,0,1,0,TAU,C.grid,1,[3,4]);
  wArc(g,G,0,0,1,0,ang,C.teal,3); circle(g,G.X(ex),G.Y(ey),er*G.sx,alpha(C.blue,0.8),C.ink,1);
  var star=[1,0]; L(g,G.X(ex),G.Y(ey),G.X(ex+0.35*star[0]),G.Y(ey+0.35*star[1]),C.red,3); L(g,G.X(ex),G.Y(ey),G.X(ex-0.35*ex),G.Y(ey-0.35*ey),C.blue,3);
  T(g,'→ 遠方恆星方向',G.X(1.45),G.Y(1.12),C.red,12,'right','700'); T(g,'公轉 '+(d)+' 天（角度放大 6 倍示意）',G.X(-1.45),G.Y(1.12),C.muted,11,'left'); }
widget('w-sidereal',{state:{d:30},rw:0.45,rn:0.85,fmt:{d:function(v){return v+' 天';}},
  draw:function(g,c,s){ siderealDraw(g,c,c.C,s.d); },
  out:function(s){ var m=4*s.d; return '經過 '+s.d+' 天：同一顆星提早 '+s.d+' × 4 = <b>'+m+' 分鐘</b>（約 '+(m/60).toFixed(1)+' 小時）出現在同一位置'; }
});
widget('s-F12',{state:{},steps:2,rw:0.45,rn:0.85,
  draw:function(g,c,s){ siderealDraw(g,c,c.C,s.step?30:1); },
  out:steps(['恆星日比太陽日短約 4 分鐘，所以星星每天<b>提早</b> 4 分鐘到同一位置。','30 天 × 4 分鐘 = 120 分鐘 = 2 小時：20:00 − 2 小時 = <b>18:00</b>。'])
});

/* F13 四季與正午太陽仰角 */
function decl(d){ return 23.5*Math.sin(TAU*(d-80)/365); }
function seasonDraw(g,c,C,d,lat){ var P=panels(c,0.5), G=frame(P[0],-1.6,1.6,-1.3,1.3,14,true), del=decl(d)*PI/180, tilt=23.5*PI/180;
  circle(g,G.X(0),G.Y(0),G.sx,alpha(C.blue,0.15),C.ink,1.5);
  [0,23.5,-23.5,66.5,-66.5].forEach(function(l,i){ var y=Math.sin(l*PI/180), w=Math.cos(l*PI/180); L(g,G.X(-w),G.Y(y),G.X(w),G.Y(y),i?C.grid:C.ink,i?1:1.5,i>2?[3,3]:[]); });
  T(g,'赤道',G.X(1.02),G.Y(0),C.ink,10,'left'); T(g,'北回歸線',G.X(Math.cos(0.41)+0.03),G.Y(Math.sin(0.41)),C.muted,10,'left'); T(g,'南回歸線',G.X(Math.cos(0.41)+0.03),G.Y(-Math.sin(0.41)),C.muted,10,'left');
  for(var k=-4;k<=4;k++){ var y=k*0.28; L(g,G.X(-1.6),G.Y(y),G.X(-Math.sqrt(Math.max(0,1-y*y))),G.Y(y),alpha(C.gold,0.7),1.5); }
  L(g,G.X(-1.6),G.Y(Math.sin(del)),G.X(-Math.cos(del)),G.Y(Math.sin(del)),C.red,3); dot(g,G.X(-Math.cos(del)),G.Y(Math.sin(del)),6,C.red); T(g,'直射 '+nf(decl(d),1)+'°',G.X(-Math.cos(del))-8,G.Y(Math.sin(del))-12,C.red,12,'right','700');
  var la=lat*PI/180; dot(g,G.X(-Math.cos(la)),G.Y(Math.sin(la)),5,C.teal);
  var H=frame(P[1],-0.2,1.25,-0.1,1.15,20,true), alt=90-Math.abs(lat-decl(d));
  L(g,H.X(0),H.Y(0),H.X(1.2),H.Y(0),C.ink,2); T(g,'地平線（向南）',H.X(1.2),H.Y(0)+14,C.muted,11,'right');
  if(alt>0){ var r=alt*PI/180; L(g,H.X(0.1),H.Y(0),H.X(0.1+Math.cos(r)),H.Y(Math.sin(r)),C.gold,3); circle(g,H.X(0.1+Math.cos(r)),H.Y(Math.sin(r)),9,'#f6c343',null); wArc(g,H,0.1,0,0.25,0,r,C.red,2); T(g,alt.toFixed(1)+'°',H.X(0.45),H.Y(0.12),C.red,14,'left','700'); }
  dot(g,H.X(0.1),H.Y(0),5,C.teal); T(g,'正午太陽仰角（緯度 '+lat+'°）',H.X(0),H.Y(1.12),C.teal,12,'left','700'); return alt; }
function dateStr(d){ var m=[31,28,31,30,31,30,31,31,30,31,30,31], i=0; d=Math.round(d); while(i<11&&d>=m[i]){ d-=m[i]; i++; } return (i+1)+'/'+(d+1); }
widget('w-season',{state:{d:172,lat:25},rw:0.45,rn:0.85,fmt:{d:dateStr,lat:function(v){return (v>=0?v+'°N':(-v)+'°S');}},
  draw:function(g,c,s){ seasonDraw(g,c,c.C,s.d,s.lat); },
  out:function(s){ var de=decl(s.d), alt=90-Math.abs(s.lat-de); return dateStr(s.d)+'：太陽直射 '+nf(de,1)+'°　→　正午仰角 = 90° − |'+s.lat+' − ('+nf(de,1)+')| = <b>'+alt.toFixed(1)+'°</b>'; }
});
widget('s-F13',{state:{},steps:2,rw:0.45,rn:0.85,
  draw:function(g,c,s){ seasonDraw(g,c,c.C,s.step?172:80,25); },
  out:steps(['春分直射赤道：台北正午仰角 = 90° − 25° = 65°。','夏至直射北回歸線 23.5°N：仰角 = 90° − |25° − 23.5°| = <b>88.5°</b>，幾乎在頭頂。'])
});

/* F14 大氣窗口（示意） */
var BANDS=[['γ 射線',-12,-11,'太空'],['X 射線',-11,-8,'太空'],['紫外線',-8,-6.4,'太空（少量近紫外可達地面）'],['可見光',-6.4,-6.15,'地面可觀測'],['紅外線',-6.15,-3,'多數需太空（部分可在高山）'],['微波',-3,-1.5,'部分可在地面'],['無線電波',-1.5,1,'地面電波望遠鏡']];
function trans(x){ var v=0; v+=Math.exp(-Math.pow((x+6.28)/0.16,2)); v+=0.35*Math.exp(-Math.pow((x+5.6)/0.25,2)); v+=0.25*Math.exp(-Math.pow((x+4.6)/0.2,2)); v+=x>-2.3&&x<1.2?Math.min(1,(x+2.3)/0.6)*Math.min(1,(1.2-x)/0.4):0; return Math.min(1,v); }
function windowDraw(g,c,C,w){ var G=frame(full(c),-12.3,1.3,-0.55,1.25,22,false);
  BANDS.forEach(function(b,i){ var on=i===w; box(g,G.X(b[1]),G.Y(1.18),(b[2]-b[1])*G.sx,0.12*Math.abs(G.sy),alpha(on?C.red:C.muted,on?0.35:0.12),C.sheet,1); });
  BANDS.forEach(function(b,i){ T(g,b[0],G.X((b[1]+b[2])/2),G.Y(-0.25-0.13*(i%2)),i===w?C.red:C.ink,11,'center',i===w?'700':'500'); });
  L(g,G.X(-12.3),G.Y(0),G.X(1.3),G.Y(0),C.ink,1.3); T(g,'到達地面的比例（示意）',G.X(-12.2),G.Y(1.08),C.muted,11,'left');
  g.save(); g.fillStyle=alpha(C.blue,0.3); g.beginPath(); g.moveTo(G.X(-12.3),G.Y(0)); for(var x=-12.3;x<=1.3;x+=0.02) g.lineTo(G.X(x),G.Y(trans(x))); g.lineTo(G.X(1.3),G.Y(0)); g.closePath(); g.fill(); g.restore();
  plot(g,G,trans,-12.3,1.3,C.blue,2); T(g,'短波長 ←',G.X(-12.2),G.Y(-0.5),C.muted,10,'left'); T(g,'→ 長波長',G.X(1.2),G.Y(-0.5),C.muted,10,'right'); }
widget('w-window',{state:{w:1},rw:0.36,rn:0.7,fmt:{w:function(v){return BANDS[v][0];}},
  draw:function(g,c,s){ windowDraw(g,c,c.C,s.w); },
  out:function(s){ var b=BANDS[s.w]; return b[0]+'：<b>'+b[3]+'</b>'; }
});
widget('s-F14',{state:{},steps:2,rw:0.36,rn:0.7,
  draw:function(g,c,s){ windowDraw(g,c,c.C,s.step?1:3); },
  out:steps(['可見光在大氣窗口裡，地面望遠鏡看得到。','X 射線幾乎全部被大氣吸收（藍色曲線貼地），必須用<b>太空中的 X 射線望遠鏡</b>。'])
});
`
};
