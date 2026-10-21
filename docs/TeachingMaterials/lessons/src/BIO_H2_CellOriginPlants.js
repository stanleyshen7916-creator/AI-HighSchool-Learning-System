/* lessons/src/BIO_H2_CellOriginPlants.js — 高二生物：細胞膜與物質運輸（tm_5／tm_20）、
   第1章 生物的起源與演化（tm_54）、第2章 植物體的形態、構造與功能（tm_56）.
   內容依教材包 summary.json 與題庫知識點；細胞、實驗裝置、組織切面皆為示意圖；答案已核對。 */
"use strict";
module.exports = {
  lessonId: "BIO_H2_CellOriginPlants",
  title: "高二生物圖解教材",
  eyebrow: "生物 ・ 細胞膜運輸、第1～2章 ・ 高二上",
  h1: "細胞膜運輸・生命起源・植物體",
  h1small: "把看不見的分子、幾十億年的歷史和植物切面畫出來",
  subject: "BIO",
  unit: "BIO-H2-S1",
  sections: [
    {
      id: "0", short: "細胞膜", title: "細胞膜構造與物質運輸",
      plan: { goal: "會判斷小分子與大分子的運輸方式，能用溶質濃度推出水的移動方向與細胞形狀變化。", prereq: "國中的擴散作用、細胞構造。", time: "約 3 節課。" },
      cards: [
        {
          id: "F1", title: "細胞膜與小分子的運輸", page: "細胞膜講義", tags: ["src"],
          say: "細胞膜是兩層<b>磷脂質</b>排成的，中間插著<b>蛋白質</b>，像一片會流動的油膜。小分子進出有三條路：自己鑽過去（簡單擴散）、走蛋白質開的門（促進性擴散），或花 ATP 被幫浦硬推過去（主動運輸）。判斷的重點只有一個：<b>有沒有花 ATP、是不是逆濃度</b>。",
          formula: "被動運輸（不耗能、高濃度 → 低濃度）：簡單擴散、促進性擴散（要膜蛋白）　｜　主動運輸（耗 ATP、低濃度 → 高濃度，要膜蛋白）",
          widget: { id: "w-trans", aria: "細胞膜磷脂雙層與三種小分子運輸方式的動畫", rw: 0.5, rn: 0.95,
            controls: [{ k: "m", label: "運輸方式", min: 0, max: 2, step: 1 }, { k: "t", label: "時間", min: 0, max: 1, step: 0.01 }], play: { k: "t", dur: 5000 } },
          space: "看粒子的方向：前兩種都是從粒子多的上方往粒子少的下方跑；只有主動運輸是從少的地方被推到已經很多的地方，所以要花能量。",
          trap: "以為「有用到膜蛋白」就是主動運輸。促進性擴散也要膜蛋白，真正的關鍵是<b>耗不耗 ATP、順不順濃度</b>。",
          quiz: { q: "某物質經細胞膜上的載體蛋白進入細胞，而且是由<b>低濃度往高濃度</b>移動。這種方式是？", answer: "c", options: [
            { c: "a", text: "簡單擴散", why: "簡單擴散不需要膜蛋白，而且只能由高濃度往低濃度。" },
            { c: "b", text: "促進性擴散", why: "促進性擴散雖然用膜蛋白，但只能順濃度（高→低）。" },
            { c: "c", text: "主動運輸" },
            { c: "d", text: "胞吞作用", why: "胞吞是大分子被細胞膜包成囊泡帶進來，不經載體蛋白。" }] },
          sol: { id: "s-F1", aria: "逐步圖解：先看膜蛋白，再看方向與能量" }
        },
        {
          id: "F2", title: "大分子的運輸：胞吞與胞吐", page: "細胞膜講義", tags: ["src"],
          say: "蛋白質這種大分子太大，門根本進不去，細胞就乾脆用<b>膜把它整個包起來</b>。往裡包叫<b>胞吞</b>，把囊泡裡的東西倒出去叫<b>胞吐</b>。如果膜上有<b>受體</b>，只抓特定的分子，就是受體媒介胞吞。這些都要<b>耗能</b>。",
          formula: "胞吞：細胞膜內凹 → 包住物質 → 形成囊泡進入細胞　｜　胞吐：囊泡移到細胞膜 → 融合 → 排出物質　（皆耗 ATP）",
          widget: { id: "w-endo", aria: "細胞膜內凹形成囊泡（胞吞）與囊泡和細胞膜融合（胞吐）的動畫", rw: 0.48, rn: 0.85,
            controls: [{ k: "e", label: "方式", min: 0, max: 2, step: 1 }, { k: "t", label: "時間", min: 0, max: 1, step: 0.01 }], play: { k: "t", dur: 4500 } },
          space: "把細胞膜想成一張保鮮膜：往下壓出一個口袋，口袋口一束起來就變成囊泡掉進細胞裡；反過來，囊泡貼上保鮮膜、攤平，裡面的東西就倒到外面。",
          trap: "以為胞吞、胞吐不耗能。它們和主動運輸一樣都要用 ATP。",
          quiz: { q: "胰臟細胞把消化酶（蛋白質）分泌到細胞外，用的是哪一種方式？", answer: "b", options: [
            { c: "a", text: "主動運輸", why: "主動運輸搬的是離子、小分子，蛋白質太大要靠囊泡。" },
            { c: "b", text: "胞吐作用" },
            { c: "c", text: "促進性擴散", why: "大分子過不了膜蛋白的通道，而且分泌也不是順濃度擴散。" },
            { c: "d", text: "胞吞作用", why: "方向反了：胞吞是把東西送進細胞。" }] },
          sol: { id: "s-F2", aria: "逐步圖解：消化酶裝在囊泡裡，和細胞膜融合後排出" }
        },
        {
          id: "F3", title: "水分子的極性與氫鍵", page: "細胞膜講義", tags: ["src", "add"],
          say: "水約占細胞重量的 <b>70%</b>。水分子是彎的，氧比較會搶電子所以帶一點負電（δ−），兩個氫帶一點正電（δ+），這叫<b>極性</b>。一個水分子的氫會去拉隔壁的氧，形成<b>氫鍵</b>。要讓水升溫，得先把一堆氫鍵打開，所以水的<b>比熱很大</b>，溫度不容易變。",
          formula: "O（δ−）、H（δ+）→ 極性分子 → 分子間形成氫鍵 → 比熱大（調節體溫）、良好溶劑（運輸物質、進行代謝）",
          widget: { id: "w-water", aria: "水分子與分子間氫鍵，加熱時氫鍵逐漸斷開", rw: 0.48, rn: 0.85,
            controls: [{ k: "t", label: "加熱", min: 0, max: 1, step: 0.01 }], play: { k: "t", dur: 4000 } },
          space: "虛線就是氫鍵。往右加熱時分子開始亂跑，虛線一條一條斷掉。熱量先拿去斷氫鍵，所以溫度上升得慢。",
          trap: "把水當成非極性分子，或以為水分子之間沒有吸引力。",
          quiz: { q: "人體運動產熱後，體溫不會劇烈上升，和水的哪一個特性最有關？", answer: "a", options: [
            { c: "a", text: "水分子間有氫鍵，比熱大" },
            { c: "b", text: "水在 4 °C 時密度最大", why: "這和湖面結冰有關，和調節體溫無關。" },
            { c: "c", text: "水是非極性分子", why: "水是極性分子。" },
            { c: "d", text: "水分子之間沒有作用力", why: "水分子之間有氫鍵。" }] },
          sol: { id: "s-F3", aria: "逐步圖解：單一水分子的極性，到分子間的氫鍵" }
        },
        {
          id: "F4", title: "滲透作用與滲透壓", page: "細胞膜講義", tags: ["src"],
          say: "滲透作用就是<b>水分子穿過半透膜的擴散</b>。記一句話：<b>水往溶質濃的地方跑</b>。U 形管左邊純水、右邊糖水，糖過不了膜，水就一直往右擠，右邊液面升高。想把它壓回去要用的力，就是<b>滲透壓</b>。溶質越濃，滲透壓越大。",
          formula: "水分子淨移動：溶質濃度低（水多）→ 溶質濃度高（水少）　｜　滲透壓 ∝ 溶質濃度",
          widget: { id: "w-osmo", aria: "U 形管中間隔著半透膜，左邊純水、右邊糖水，右邊液面上升", rw: 0.5, rn: 0.95,
            controls: [{ k: "cs", label: "右側糖水濃度", min: 0, max: 1, step: 0.05 }, { k: "t", label: "時間", min: 0, max: 1, step: 0.01 }], play: { k: "t", dur: 4000 } },
          space: "把濃度拉大再按播放：糖越多，液面差越大，代表右邊「吸水的力量」（滲透壓）越大。濃度拉到 0，兩邊一樣，液面不動。",
          trap: "以為溶質濃度越高滲透壓越小。剛好相反，滲透壓和溶質濃度成正比。",
          quiz: { q: "半透膜左側是 5% 葡萄糖液、右側是 10% 葡萄糖液（葡萄糖無法通過）。水分子的淨移動方向是？", answer: "d", options: [
            { c: "a", text: "由右往左", why: "水往溶質濃的那一側跑，右側比較濃。" },
            { c: "b", text: "不會移動", why: "兩邊濃度不同，就會有淨移動。" },
            { c: "c", text: "葡萄糖由左往右", why: "題目說葡萄糖不能通過半透膜。" },
            { c: "d", text: "由左往右" }] },
          sol: { id: "s-F4", aria: "逐步圖解：右邊溶質多，水往右移，右液面上升" }
        },
        {
          id: "F5", title: "等張、高張、低張：動物細胞與植物細胞", page: "細胞膜講義", tags: ["src"],
          say: "把細胞丟進不同濃度的水裡：外面比較稀（<b>低張</b>），水跑進細胞；外面比較濃（<b>高張</b>），水跑出細胞。紅血球沒有細胞壁，吸太多水會<b>脹破（溶血）</b>，失水會<b>皺縮</b>。植物細胞有細胞壁撐著，吸水只是<b>膨壓變大</b>，失水則細胞膜和細胞壁分開，叫<b>質壁分離</b>。",
          formula: "低張：水淨流入 → 紅血球膨脹甚至溶血；植物膨壓最大　｜　等張：形狀不變　｜　高張：水淨流出 → 紅血球皺縮；植物質壁分離",
          widget: { id: "w-tonic", aria: "外液濃度改變時，紅血球與植物細胞的形狀變化", rw: 0.46, rn: 1.05,
            controls: [{ k: "s", label: "外液濃度（細胞內＝1）", min: 0.3, max: 1.7, step: 0.05 }] },
          space: "從左拉到右：紅血球由脹破、膨脹、正常到皺巴巴；右邊植物細胞外框（細胞壁）完全不動，裡面的原生質在高張時縮離細胞壁。",
          trap: "以為植物細胞在清水裡也會像紅血球一樣脹破。細胞壁會頂住，只會膨壓增加。",
          quiz: { q: "把洋蔥表皮細胞放進清水（低張溶液）中，會發生什麼事？", answer: "b", options: [
            { c: "a", text: "吸水後脹破", why: "細胞壁撐住了，不會破。會破的是沒有細胞壁的紅血球。" },
            { c: "b", text: "吸水，膨壓增加，但不會破裂" },
            { c: "c", text: "發生質壁分離", why: "質壁分離發生在高張溶液中。" },
            { c: "d", text: "沒有任何變化", why: "清水是低張溶液，水會淨流入細胞。" }] },
          sol: { id: "s-F5", aria: "逐步圖解：低張、等張、高張三種情形" }
        }
      ]
    },
    {
      id: "1", short: "生物起源", title: "第1章 生物的起源與演化",
      plan: { goal: "會說出生源說與非生源說的關鍵實驗與變因，能依序排出有機演化與生命型式演化的各階段。", prereq: "國中的細胞構造、光合作用與呼吸作用。", time: "約 4 節課。" },
      cards: [
        {
          id: "F6", title: "生源說與非生源說：巴斯德鵝頸瓶", page: "1-1", tags: ["src"],
          say: "以前很多人相信生物可以從無生命的東西自己長出來（<b>非生源說</b>）。巴斯德把肉汁煮沸，裝進<b>瓶頸彎彎的鵝頸瓶</b>：空氣可以進出，但灰塵和微生物會卡在彎曲處。結果肉汁一直保持澄清；把瓶頸打斷，沒幾天就長滿微生物。這就確立了<b>生源說</b>：生物只能由生物產生。",
          formula: "非生源說：亞里斯多德、尼丹、蒲歇　｜　生源說：雷迪、約伯勒、斯巴蘭贊尼、巴斯德（鵝頸瓶，確立生源說）",
          widget: { id: "w-flask", aria: "巴斯德鵝頸瓶，瓶頸完整時肉汁澄清，打斷瓶頸後長出微生物", rw: 0.5, rn: 0.9,
            controls: [{ k: "day", label: "天數", min: 0, max: 30, step: 1 }, { k: "b", label: "瓶頸", min: 0, max: 1, step: 1 }], play: { k: "day", dur: 4000 } },
          space: "看灰塵的路線：瓶頸完整時灰塵一路滑到彎曲的最低點就停住；打斷之後，灰塵直接掉進瓶子裡。",
          trap: "以為鵝頸瓶是為了隔絕空氣。剛好相反，它讓空氣可以流通，才能反駁「生物需要空氣中的生命力才會長出來」。",
          quiz: { q: "巴斯德把瓶頸做成彎曲的鵝頸狀，主要目的是？", answer: "c", options: [
            { c: "a", text: "完全隔絕空氣", why: "空氣可以流通，這正是實驗設計的重點。" },
            { c: "b", text: "讓肉汁加熱得更快", why: "加熱煮沸是為了殺死原有微生物，和瓶頸形狀無關。" },
            { c: "c", text: "讓空氣能進出，但微生物沉在彎曲處進不去" },
            { c: "d", text: "讓微生物更容易進入", why: "剛好相反。" }] },
          sol: { id: "s-F6", aria: "逐步圖解：瓶頸完整與打斷瓶頸的結果比較" }
        },
        {
          id: "F7", title: "雷迪實驗與操作變因", page: "1-1", tags: ["src"],
          say: "雷迪想知道腐肉的蛆是哪來的。他準備三個瓶子放一樣的肉：開口、用紗布封住、完全密封。結果只有開口的瓶子裡長蛆，紗布瓶的蛆只出現在紗布上（蒼蠅在上面產卵）。他改變的只有一件事：<b>蒼蠅能不能碰到肉</b>。",
          formula: "操作變因：蒼蠅能否接觸肉　｜　控制變因：肉的種類、溫度、放置時間　｜　應變變因：肉上是否長蛆",
          widget: { id: "w-redi", aria: "雷迪的三個瓶子：開口、紗布封口、密封，隨天數觀察是否長蛆", rw: 0.45, rn: 0.85,
            controls: [{ k: "day", label: "天數", min: 0, max: 8, step: 0.1 }], play: { k: "day", dur: 5000 } },
          space: "按播放：蒼蠅可以飛進開口瓶；紗布瓶的蒼蠅只能停在紗布上，卵也下在紗布上；密封瓶完全沒事。",
          trap: "把紗布實驗的操作變因說成「空氣」。紗布讓空氣照樣流通，被改變的是蒼蠅能不能接觸。",
          quiz: { q: "雷迪的紗布實驗中，「操作變因」是什麼？", answer: "a", options: [
            { c: "a", text: "蒼蠅能否接觸到肉" },
            { c: "b", text: "空氣能否進入瓶中", why: "紗布能讓空氣進出，空氣不是被改變的變因。" },
            { c: "c", text: "肉的種類", why: "三瓶放一樣的肉，是控制變因。" },
            { c: "d", text: "溫度", why: "溫度相同，是控制變因。" }] },
          sol: { id: "s-F7", aria: "逐步圖解：比較三個瓶子的結果" }
        },
        {
          id: "F8", title: "原始湯與尤里－米勒實驗", page: "1-2", tags: ["src"],
          say: "歐帕林和霍爾丹提出<b>原始湯</b>：原始大氣的無機物在海裡合成有機物，越積越多。尤里與米勒做了一台「小型原始地球」：把 <b>CH₄、NH₃、H₂、水蒸氣</b>（沒有氧氣）裝進瓶子，加熱水模擬海洋蒸發、用放電模擬閃電、冷凝模擬下雨。一週後，收集管裡出現了<b>胺基酸</b>。",
          formula: "無機物（CH₄、NH₃、H₂、H₂O，無 O₂）＋ 能量（放電、加熱）→ 小分子有機物（胺基酸等）",
          widget: { id: "w-miller", aria: "尤里與米勒實驗裝置：加熱的水、放電瓶、冷凝管與收集管", rw: 0.52, rn: 0.95,
            controls: [{ k: "day", label: "天數", min: 0, max: 7, step: 0.1 }], play: { k: "day", dur: 5000 } },
          space: "跟著小點繞一圈：海（加熱的水）→ 大氣（氣體瓶）→ 閃電 → 下雨（冷凝）→ 回到海。收集管的顏色越來越深，就是累積的有機物。",
          trap: "以為氣體裡有氧氣或氮氣。原始大氣模擬的是 CH₄、NH₃、H₂、水蒸氣，沒有 O₂。",
          quiz: { q: "尤里與米勒實驗通入的混合氣體中，<b>不包含</b>哪一種？", answer: "d", options: [
            { c: "a", text: "甲烷（CH₄）", why: "有通入甲烷。" },
            { c: "b", text: "氨（NH₃）", why: "有通入氨。" },
            { c: "c", text: "氫氣（H₂）", why: "有通入氫氣。" },
            { c: "d", text: "氧氣（O₂）" }] },
          sol: { id: "s-F8", aria: "逐步圖解：裝置的三個部分各模擬什麼" }
        },
        {
          id: "F9", title: "有機演化四階段與 RNA", page: "1-2", tags: ["src"],
          say: "生命不是一步登天，是一階一階爬上來的：無機物 → <b>小分子有機物</b> → <b>大分子有機物</b> → <b>能自我複製的 RNA</b> → 被<b>膜</b>包起來成為原始細胞。為什麼最早是 RNA？因為它既能<b>帶遺傳訊息</b>，又能像酵素一樣<b>催化反應</b>（核糖酵素），一個人做兩份工作。",
          formula: "無機物 →（尤里與米勒、卡爾文）小分子有機物 →（福克斯）大分子有機物 →（闕克、吉爾伯特）RNA →（勒曼，微脂體）原始細胞",
          widget: { id: "w-stairs", aria: "有機演化的階梯：從無機物一路到原始細胞", rw: 0.45, rn: 0.9,
            controls: [{ k: "k", label: "階段", min: 0, max: 4, step: 1 }] },
          space: "每往右爬一階，分子就更大、更有組織。第 4 階的 RNA 是一條單股的鏈，第 5 階被一層膜圈起來，才像個細胞。",
          trap: "以為 DNA 比較穩定，所以是最早的遺傳物質。最早的是 RNA。",
          quiz: { q: "科學家推測最早的遺傳物質是 RNA 而不是 DNA，主要理由是？", answer: "b", options: [
            { c: "a", text: "DNA 的構造比較不穩定", why: "剛好相反，DNA 比較穩定。" },
            { c: "b", text: "RNA 能攜帶遺傳訊息，也能催化反應" },
            { c: "c", text: "RNA 是雙股螺旋", why: "RNA 通常是單股。" },
            { c: "d", text: "原始大氣中有大量 RNA", why: "RNA 是在原始海洋中逐步合成的，不在大氣裡。" }] },
          sol: { id: "s-F9", aria: "逐步圖解：RNA 的兩種功能，再被膜包起來" }
        },
        {
          id: "F10", title: "內共生假說：粒線體與葉綠體", page: "1-3", tags: ["src"],
          say: "真核細胞裡的粒線體和葉綠體，以前可能是<b>獨立的細菌</b>。一個大細胞把<b>好氧細菌</b>吞進去卻沒消化，牠留下來幫忙做有氧呼吸，變成<b>粒線體</b>；後來有些細胞又吞了<b>藍綠菌</b>，變成<b>葉綠體</b>。證據：它們都有<b>自己的 DNA、雙層膜</b>，可以自己分裂（半自主胞器）。",
          formula: "好氧細菌 → 粒線體（先）　｜　藍綠菌 → 葉綠體（後）　｜　證據：具自己的 DNA、核糖體、雙層膜，能自行分裂（瑪格莉斯）",
          widget: { id: "w-endosym", aria: "大細胞先吞入好氧細菌成為粒線體，再吞入藍綠菌成為葉綠體", rw: 0.5, rn: 0.9,
            controls: [{ k: "t", label: "演化", min: 0, max: 1, step: 0.01 }], play: { k: "t", dur: 6000 } },
          space: "注意被吞進來時外面多包了一層膜（虛線），這就是粒線體、葉綠體有「雙層膜」的由來。",
          trap: "以為葉綠體比粒線體早。幾乎所有真核生物都有粒線體，只有植物和藻類有葉綠體，所以粒線體先。",
          quiz: { q: "依內共生假說，下列敘述何者正確？", answer: "a", options: [
            { c: "a", text: "粒線體先共生，葉綠體後共生" },
            { c: "b", text: "葉綠體先共生，粒線體後共生", why: "幾乎所有真核生物都有粒線體，只有植物和藻類有葉綠體，所以粒線體較早。" },
            { c: "c", text: "兩者同時被吞入", why: "動物細胞只有粒線體，表示兩者是不同時間發生的。" },
            { c: "d", text: "葉綠體是由粒線體變來的", why: "兩者來自不同的細菌（好氧細菌、藍綠菌）。" }] },
          sol: { id: "s-F10", aria: "逐步圖解：先吞好氧細菌，再吞藍綠菌" }
        },
        {
          id: "F11", title: "生命型式的演化", page: "1-3", tags: ["src", "add"],
          say: "最早的生物住在原始湯裡，直接吃現成的有機物（<b>異營</b>），也沒有氧氣可用（<b>無氧呼吸</b>）。後來出現會光合作用的藍綠菌（<b>自營</b>），氧氣越來越多，才有<b>有氧呼吸</b>。接著原核變<b>真核</b>（內共生），單細胞再變<b>多細胞</b>。",
          formula: "異營 → 自營　｜　無氧代謝 → 有氧代謝　｜　原核 → 真核　｜　單細胞 → 多細胞",
          widget: { id: "w-life", aria: "40 億年來生命型式演化的時間軸與氧氣濃度（示意）", rw: 0.42, rn: 0.95,
            controls: [{ k: "ty", label: "距今（億年）", min: 0, max: 40, step: 0.5 }], play: { k: "ty", dur: 6000 } },
          space: "藍色曲線是大氣氧氣（示意）。氧氣在藍綠菌出現後才慢慢升高，所以有氧呼吸一定排在自營之後。",
          trap: "以為氧氣出現後厭氧生物就全部死光。它們退到沒有氧氣的環境繼續生活。",
          quiz: { q: "下列生命型式的演化方向，何者正確？", answer: "c", options: [
            { c: "a", text: "自營 → 異營", why: "最早的生物靠原始湯裡的有機物生活，是異營。" },
            { c: "b", text: "有氧代謝 → 無氧代謝", why: "早期大氣沒有氧氣，先有無氧代謝。" },
            { c: "c", text: "原核 → 真核" },
            { c: "d", text: "多細胞 → 單細胞", why: "先有單細胞，後有多細胞。" }] },
          sol: { id: "s-F11", aria: "逐步圖解：依時間排出四組演化方向" }
        }
      ]
    },
    {
      id: "2", short: "植物體", title: "第2章 植物體的形態、構造與功能",
      plan: { goal: "認得三種植物細胞與各組織，會畫出根、莖、葉的橫切面並說出各構造的功能。", prereq: "國中的植物構造、維管束。", time: "約 5 節課。" },
      cards: [
        {
          id: "F12", title: "植物細胞：薄壁、厚角、厚壁", page: "2-1", tags: ["src"],
          say: "三種細胞看<b>細胞壁</b>就分得出來。<b>薄壁細胞</b>壁薄、活的，負責儲存養分和光合作用；<b>厚角細胞</b>也是活的，只有初生壁，但<b>角落特別厚</b>（果膠多），負責支持；<b>厚壁細胞</b>有很厚的<b>次生壁（木質素）</b>，成熟後是<b>死細胞</b>，像石細胞、纖維細胞。",
          formula: "薄壁：活、初生壁 → 儲存、光合　｜　厚角：活、初生壁角隅增厚（果膠）→ 支持　｜　厚壁：死、次生壁（木質素）→ 支持",
          widget: { id: "w-pcell", aria: "薄壁細胞、厚角細胞、厚壁細胞的橫切面比較", rw: 0.42, rn: 0.9,
            controls: [{ k: "k", label: "細胞", min: 0, max: 2, step: 1 }] },
          space: "看壁的厚度從左到右越來越厚；最右邊的厚壁細胞中間是空的，裡面已經沒有細胞質，所以是死的。",
          trap: "以為厚角細胞有次生細胞壁。它只有初生壁，只是角落增厚；有次生壁的是厚壁細胞。",
          quiz: { q: "關於厚角細胞，下列何者正確？", answer: "a", options: [
            { c: "a", text: "活細胞，只有初生細胞壁，在角隅不均勻增厚" },
            { c: "b", text: "死細胞，具有次生細胞壁", why: "那是厚壁細胞。" },
            { c: "c", text: "細胞壁富含木質素", why: "厚角細胞富含果膠；富含木質素的是厚壁細胞。" },
            { c: "d", text: "是進行光合作用的主要細胞", why: "那是薄壁細胞（如葉肉）。" }] },
          sol: { id: "s-F12", aria: "逐步圖解：比較厚角與厚壁細胞" }
        },
        {
          id: "F13", title: "分生組織與根尖的分區", page: "2-1、2-2", tags: ["src"],
          say: "植物會一直長，靠的是<b>分生組織</b>。根尖從最前端往後看：<b>根帽</b>戴在最前面保護；後面是<b>生長點</b>，細胞拚命分裂；再來是<b>延長區</b>，細胞拉長把根往前推；最後是<b>成熟區</b>，表皮細胞往外凸出<b>根毛</b>吸水。這是初生分生組織，讓根變長；變粗則靠形成層（次生分生組織）。",
          formula: "根尖（由前端往後）：根帽 → 生長點（細胞分裂）→ 延長區（細胞伸長）→ 成熟區（根毛）　｜　初生分生組織：縱向生長　次生分生組織（維管束形成層、木栓形成層）：橫向加粗",
          widget: { id: "w-roottip", aria: "根尖往前生長，生長點分裂、延長區伸長、成熟區長出根毛", rw: 0.38, rn: 0.7,
            controls: [{ k: "t", label: "生長", min: 0, max: 1, step: 0.01 }], play: { k: "t", dur: 4500 } },
          space: "按播放盯著根毛：它們固定在原地不動，是根尖往前長，成熟區才往前延伸，新的根毛一路長出來。",
          trap: "以為根毛長在生長點或延長區。只有細胞成熟了才會長根毛。",
          quiz: { q: "根毛主要分布在根尖的哪一區？", answer: "d", options: [
            { c: "a", text: "根帽", why: "根帽負責保護生長點。" },
            { c: "b", text: "生長點", why: "生長點負責細胞分裂。" },
            { c: "c", text: "延長區", why: "延長區的細胞還在拉長，還沒長根毛。" },
            { c: "d", text: "成熟區" }] },
          sol: { id: "s-F13", aria: "逐步圖解：由根尖往後依序找出各區" }
        },
        {
          id: "F14", title: "根的橫切面", page: "2-2", tags: ["src"],
          say: "把根橫切，從外往內是：<b>表皮</b>（有根毛）→ <b>皮層</b>（儲存養分）→ <b>內皮</b>（有<b>卡氏帶</b>，像海關控管物質進入中柱）→ <b>周鞘</b>（側根從這裡長出來）→ 中間的維管束。雙子葉根中央是<b>星形的木質部、沒有髓</b>；單子葉根的維管束排一圈，<b>中央有髓</b>。",
          formula: "表皮 → 皮層 → 內皮（卡氏帶）→ 周鞘（長側根）→ 維管束（木質部、韌皮部相間排列）　｜　雙子葉根：無髓　單子葉根：有髓",
          widget: { id: "w-rootxs", aria: "根的橫切面，由外而內標示各層，可切換雙子葉與單子葉", rw: 0.5, rn: 1.3,
            controls: [{ k: "k", label: "由外而內", min: 0, max: 5, step: 1 }, { k: "m", label: "類型", min: 0, max: 1, step: 1 }] },
          space: "一層一層往內點：紅色那圈就是現在講的構造。切到「類型」看中央：雙子葉是一顆木質部星星，單子葉中間是一塊髓。",
          trap: "以為側根是表皮長出來的。表皮外凸的是根毛，側根由周鞘長出來。",
          quiz: { q: "植物的側根是由根的哪一層長出來的？", answer: "c", options: [
            { c: "a", text: "表皮", why: "表皮細胞外凸形成的是根毛。" },
            { c: "b", text: "皮層", why: "皮層主要儲存養分。" },
            { c: "c", text: "周鞘" },
            { c: "d", text: "內皮", why: "內皮以卡氏帶控管物質進入中柱。" }] },
          sol: { id: "s-F14", aria: "逐步圖解：從表皮往內數到周鞘" }
        },
        {
          id: "F15", title: "莖的橫切面：雙子葉與單子葉", page: "2-2", tags: ["src"],
          say: "莖橫切最好認：雙子葉莖的維管束<b>排成一圈</b>，中間有<b>形成層</b>，所以會越長越粗，中央有<b>髓</b>；單子葉莖（玉米、竹子）的維管束<b>散生</b>，<b>沒有形成層</b>，長到一個粗度就不再變粗。每個維管束都是韌皮部在外、木質部在內。",
          formula: "雙子葉莖：維管束環狀排列、有形成層、有髓　｜　單子葉莖：維管束散生、無形成層　｜　維管束：韌皮部在外、木質部在內",
          widget: { id: "w-stemxs", aria: "雙子葉莖與單子葉莖的橫切面", rw: 0.48, rn: 1.25,
            controls: [{ k: "m", label: "類型", min: 0, max: 1, step: 1 }] },
          space: "切換類型：一圈整齊的「珍珠項鍊」是雙子葉；撒了一把芝麻的是單子葉。紅色虛線圈就是形成層，單子葉沒有。",
          trap: "把雙子葉根（無髓、木質部在中央）和雙子葉莖（有髓、維管束一圈）搞混。",
          quiz: { q: "玉米莖（單子葉植物）的橫切面有什麼特徵？", answer: "b", options: [
            { c: "a", text: "維管束環狀排列，有形成層", why: "那是雙子葉莖。" },
            { c: "b", text: "維管束散生，沒有形成層" },
            { c: "c", text: "中央是木質部，沒有髓", why: "那是雙子葉根。" },
            { c: "d", text: "有明顯的年輪", why: "年輪由形成層產生，玉米沒有形成層。" }] },
          sol: { id: "s-F15", aria: "逐步圖解：雙子葉莖與單子葉莖對照" }
        },
        {
          id: "F16", title: "木本莖：年輪、心材與樹皮", page: "2-2", tags: ["src"],
          say: "樹會變粗，是<b>形成層</b>往內做木材、往外做韌皮部。春夏長得快，細胞大、顏色淺（<b>早材</b>）；秋冬長得慢，顏色深（<b>晚材</b>），一淺一深合起來是一圈<b>年輪</b>。內側比較老的木材顏色變深，不再運水，叫<b>心材</b>；外側還在運水的是<b>邊材</b>。形成層外面全部都算<b>樹皮</b>。",
          formula: "年輪 ＝ 早材（淺、寬）＋ 晚材（深、窄）　｜　心材：內側、深色、無運輸功能　邊材：外側、能運水　｜　樹皮：形成層以外（韌皮部、皮層、栓皮層、木栓形成層、木栓層）",
          widget: { id: "w-wood", aria: "木本莖橫切面隨年份增加年輪，內側逐漸形成心材", rw: 0.5, rn: 1.25,
            controls: [{ k: "y", label: "年數", min: 1, max: 10, step: 1 }], play: { k: "y", dur: 5000 } },
          space: "按播放：每過一年，紅色的形成層圈往外推一圈，留下一淺一深的年輪；第 4 年起，最裡面的年輪開始變成深色的心材。",
          trap: "把邊材當成早材。邊材是位置（外側、能運水），早材是生長季節（春夏）。",
          quiz: { q: "關於木本植物的莖，下列何者正確？", answer: "d", options: [
            { c: "a", text: "一圈早材就代表一年", why: "一年是早材加晚材，合起來才是一圈年輪。" },
            { c: "b", text: "邊材就是早材", why: "邊材是外側仍能運水的木材；早材是春夏長的部分，兩者不同。" },
            { c: "c", text: "樹皮只有木栓層", why: "樹皮包括形成層以外的所有部分（韌皮部、皮層、栓皮層、木栓形成層、木栓層）。" },
            { c: "d", text: "心材位在內側，顏色較深，已無運輸功能" }] },
          sol: { id: "s-F16", aria: "逐步圖解：數年輪、分出心材和邊材" }
        },
        {
          id: "F17", title: "維管束：木質部與韌皮部", page: "2-1", tags: ["src"],
          say: "植物的水管和送餐管分開走。<b>木質部</b>的<b>導管、管胞</b>是<b>死細胞</b>，裡面空空的，剛好當水管，把水和礦物質由根往上送。<b>韌皮部</b>的<b>篩管</b>是<b>活細胞但沒有細胞核</b>，靠旁邊有核的<b>伴細胞</b>照顧，把葉子做好的養分送到全身。",
          formula: "木質部：導管、管胞（死細胞）→ 水、礦物質，由下往上　｜　韌皮部：篩管（活、無核）＋ 伴細胞（活、有核）→ 有機養分，雙向運輸",
          widget: { id: "w-vasc", aria: "導管與管胞運送水分向上，篩管運送養分，旁有伴細胞", rw: 0.5, rn: 0.95,
            controls: [{ k: "t", label: "時間", min: 0, max: 1, step: 0.01 }], play: { k: "t", dur: 4000 } },
          space: "藍點一路往上（水），橘點在篩管裡上下都有（養分從葉子送到根，也送到果實、嫩芽）。導管的橫隔都打通了，篩管則留著有孔的篩板。",
          trap: "以為導管、管胞是活細胞，或以為篩管有細胞核。",
          quiz: { q: "下列哪一種細胞在成熟、執行功能時是<b>活細胞</b>？", answer: "b", options: [
            { c: "a", text: "導管細胞", why: "導管成熟後是死細胞，中空才能當水管。" },
            { c: "b", text: "篩管細胞" },
            { c: "c", text: "管胞", why: "管胞也是死細胞。" },
            { c: "d", text: "纖維細胞", why: "纖維細胞是厚壁細胞，成熟後是死細胞。" }] },
          sol: { id: "s-F17", aria: "逐步圖解：逐一判斷死細胞與活細胞" }
        },
        {
          id: "F18", title: "葉的構造", page: "2-2", tags: ["src"],
          say: "葉子像一個三明治：最上面是<b>上表皮</b>（外面有角質層防水）；下面是排得整整齊齊、葉綠體最多的<b>柵狀組織</b>；再下面是鬆鬆的、有很多空隙的<b>海綿組織</b>，方便氣體流動；最底下是<b>下表皮</b>，<b>氣孔</b>多在這裡。中間穿過的葉脈就是維管束：<b>木質部在上、韌皮部在下，沒有形成層</b>。",
          formula: "上表皮（角質層）→ 柵狀組織 → 海綿組織 → 下表皮（氣孔、保衛細胞）　｜　葉脈：木質部在上、韌皮部在下、無形成層　｜　單子葉：平行脈　雙子葉：網狀脈",
          widget: { id: "w-leaf", aria: "葉的橫切面，標示表皮、柵狀組織、海綿組織、葉脈與氣孔", rw: 0.5, rn: 0.95,
            controls: [{ k: "k", label: "構造", min: 0, max: 4, step: 1 }] },
          space: "一層一層切換：柵狀組織像直立的鉛筆排排站，正對陽光；海綿組織之間的白色空隙，連到下表皮的氣孔，是氣體的走道。",
          trap: "以為葉脈裡也有形成層，或把木質部、韌皮部的上下位置記反。",
          quiz: { q: "葉脈中維管束的排列，何者正確？", answer: "a", options: [
            { c: "a", text: "木質部在上（靠上表皮）、韌皮部在下，沒有形成層" },
            { c: "b", text: "韌皮部在上、木質部在下", why: "上下位置反了。" },
            { c: "c", text: "木質部與韌皮部之間有形成層", why: "葉脈沒有形成層，這是常見錯誤。" },
            { c: "d", text: "只有木質部", why: "也有韌皮部，負責把葉子製造的養分送出去。" }] },
          sol: { id: "s-F18", aria: "逐步圖解：柵狀組織與葉脈的位置" }
        }
      ]
    }
  ],
  footer: [
    "課本與講義：高二生物 細胞膜與物質運輸、第1章 生物的起源與演化、第2章 植物體的形態、構造與功能。",
    "內容依平台教材包 tm_5、tm_20、tm_54、tm_56；分子、細胞、實驗裝置與組織切面皆為示意圖，比例不代表實際大小；生命演化時間軸與氧氣曲線為示意。"
  ],
  script: String.raw`
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function lerp(a,b,u){ return a+(b-a)*u; }
function circle(g,x,y,r,fill,stroke,w,dash){ g.save(); g.beginPath(); g.arc(x,y,Math.max(0,r),0,TAU); if(fill){ g.fillStyle=fill; g.fill(); } if(stroke){ g.strokeStyle=stroke; g.lineWidth=w||1.5; g.setLineDash(dash||[]); g.stroke(); } g.restore(); }
function ell(g,x,y,rx,ry,rot,fill,stroke,w){ g.save(); g.beginPath(); g.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),rot||0,0,TAU); if(fill){ g.fillStyle=fill; g.fill(); } if(stroke){ g.strokeStyle=stroke; g.lineWidth=w||1.5; g.stroke(); } g.restore(); }
function rrect(g,x,y,w,h,r,fill,stroke,lw,dash){ g.save(); r=Math.max(0,Math.min(r,Math.abs(w)/2,Math.abs(h)/2)); g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); if(fill){ g.fillStyle=fill; g.fill(); } if(stroke){ g.strokeStyle=stroke; g.lineWidth=lw||1.5; g.setLineDash(dash||[]); g.stroke(); } g.restore(); }
function arrow(g,x1,y1,x2,y2,c,w){ var a=Math.atan2(y2-y1,x2-x1), h=6+(w||2)*2; L(g,x1,y1,x2-Math.cos(a)*h*0.6,y2-Math.sin(a)*h*0.6,c,w||2); g.save(); g.fillStyle=c; g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-h*Math.cos(a-0.4),y2-h*Math.sin(a-0.4)); g.lineTo(x2-h*Math.cos(a+0.4),y2-h*Math.sin(a+0.4)); g.closePath(); g.fill(); g.restore(); }
function B(g,G,x0,y0,x1,y1,fill,stroke,lw){ box(g,G.X(Math.min(x0,x1)),G.Y(Math.max(y0,y1)),Math.abs(x1-x0)*G.sx,Math.abs(y1-y0)*G.sy,fill,stroke,lw); }
function WR(g,G,x0,y0,x1,y1,r,fill,stroke,lw,dash){ rrect(g,G.X(Math.min(x0,x1)),G.Y(Math.max(y0,y1)),Math.abs(x1-x0)*G.sx,Math.abs(y1-y0)*G.sy,r,fill,stroke,lw,dash); }
function poly2(g,G,pts,c,w,dash){ g.save(); g.strokeStyle=c; g.lineWidth=w||2; g.lineJoin='round'; g.lineCap='round'; g.setLineDash(dash||[]); g.beginPath(); pts.forEach(function(p,i){ if(i) g.lineTo(G.X(p[0]),G.Y(p[1])); else g.moveTo(G.X(p[0]),G.Y(p[1])); }); g.stroke(); g.restore(); }
function along(pts,u){ var Ls=[], tot=0; for(var i=1;i<pts.length;i++){ var d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]); Ls.push(d); tot+=d; } var s=u*tot; for(var j=0;j<Ls.length;j++){ if(s<=Ls[j]){ var v=Ls[j]?s/Ls[j]:0; return [lerp(pts[j][0],pts[j+1][0],v),lerp(pts[j][1],pts[j+1][1],v)]; } s-=Ls[j]; } return pts[pts.length-1]; }
var GREEN='#3f8f4a', BROWN='#8a5a2b', ORANGE='#e08a2c', PURPLE='#7d5ba6', MEM='#e0a84a';

/* F1 小分子運輸 */
var TMODE=['簡單擴散','促進性擴散','主動運輸'];
function bilayer(g,G,C,x0,x1){ var r=Math.max(2.5,0.11*G.sy);
  for(var x=x0+0.15;x<x1-0.05;x+=0.3){ [-0.04,0.04].forEach(function(o){ L(g,G.X(x+o),G.Y(3.25),G.X(x+o),G.Y(3.03),C.muted,1); L(g,G.X(x+o),G.Y(2.75),G.X(x+o),G.Y(2.97),C.muted,1); });
    circle(g,G.X(x),G.Y(3.3),r,'#f2c879',C.ink,0.8); circle(g,G.X(x),G.Y(2.7),r,'#f2c879',C.ink,0.8); } }
function transDraw(g,c,C,m,t){ var G=frame(full(c),0,10,0,6,12,false), fs=c.narrow?11:12;
  B(g,G,0,3.4,10,6,alpha(C.blue,0.06)); B(g,G,0,0,10,2.6,alpha(C.gold,0.06));
  if(m===0) bilayer(g,G,C,0,10); else { bilayer(g,G,C,0,5.75); bilayer(g,G,C,7.05,10); }
  if(m===1){ ell(g,G.X(6.05),G.Y(3),0.3*G.sx,0.7*G.sy,0,alpha(C.teal,0.85),C.ink,1); ell(g,G.X(6.75),G.Y(3),0.3*G.sx,0.7*G.sy,0,alpha(C.teal,0.85),C.ink,1); }
  if(m===2){ WR(g,G,5.85,2.2,6.95,3.8,8,alpha(PURPLE,0.85),C.ink,1); }
  var r=seeded(11), P=[]; for(var i=0;i<14;i++){ P.push({s:[0.4+r()*9.2,3.95+r()*1.6], e:[0.4+r()*9.2,0.45+r()*1.75]}); }
  var nTop=m===2?3:11, nMove=m===2?2:4, moved=0, busy=false, col=[C.blue,C.gold,C.teal][m], pr=[4,6,5][m];
  for(var i=0;i<14;i++){ var p=i<nTop?P[i].s:P[i].e;
    if(i<nMove){ var u=clamp(t*(nMove+1)-i,0,1), xc=m===0?P[i].s[0]:6.4, a=[xc,3.9], b=[xc,2.1];
      p=u<0.4?[lerp(P[i].s[0],a[0],u/0.4),lerp(P[i].s[1],a[1],u/0.4)]:u<0.6?[xc,lerp(3.9,2.1,(u-0.4)/0.2)]:[lerp(b[0],P[i].e[0],(u-0.6)/0.4),lerp(b[1],P[i].e[1],(u-0.6)/0.4)];
      if(u>=0.6) moved++; if(u>0.3&&u<0.7) busy=true; }
    circle(g,G.X(p[0]),G.Y(p[1]),pr,col,C.ink,0.8); }
  T(g,'細胞外：'+(nTop-moved)+' 個',G.X(0.15),G.Y(5.78),C.ink,fs,'left','700'); T(g,'細胞內：'+(14-nTop+moved)+' 個',G.X(0.15),G.Y(0.2),C.ink,fs,'left','700');
  if(m>0) T(g,m===1?'通道／載體蛋白':'幫浦蛋白',G.X(9.85),G.Y(5.78),m===1?C.teal:PURPLE,fs,'right','700');
  if(m===2&&busy) T(g,'ATP → ADP＋Pi（耗能）',G.X(9.85),G.Y(0.2),C.red,fs,'right','700'); }
var TOUT=['<b>簡單擴散</b>：O₂、CO₂ 等小分子直接穿過磷脂雙層，順濃度（多→少），<b>不耗能</b>','<b>促進性擴散</b>：葡萄糖等要靠<b>膜蛋白</b>幫忙，但仍是順濃度（多→少），<b>不耗能</b>','<b>主動運輸</b>：靠幫浦蛋白<b>逆濃度</b>（少→多）搬運，要<b>消耗 ATP</b>'];
widget('w-trans',{state:{m:0,t:0},rw:0.5,rn:0.95,fmt:{m:function(v){return TMODE[v];},t:function(v){return Math.round(v*100)+'%';}},
  draw:function(g,c,s){ transDraw(g,c,c.C,s.m,s.t); },
  out:function(s){ return TOUT[s.m]; }
});
widget('s-F1',{state:{},steps:2,rw:0.5,rn:0.95,
  draw:function(g,c,s){ transDraw(g,c,c.C,s.step?2:1,1); },
  out:steps(['促進性擴散也用載體蛋白，所以「有膜蛋白」不能用來判斷。','關鍵是方向：由少的一側被搬到多的一側（逆濃度），必須花 ATP → <b>主動運輸</b>。'])
});

/* F2 胞吞與胞吐 */
var EMODE=['胞吞作用','胞吐作用','受體媒介胞吞'];
function memU(g,G,d){ g.save(); g.strokeStyle=MEM; g.lineWidth=Math.max(5,0.2*G.sx); g.lineCap='round'; g.beginPath(); g.moveTo(G.X(-5),G.Y(1));
  if(d>0.02){ g.lineTo(G.X(-1.5),G.Y(1)); g.bezierCurveTo(G.X(-1.15),G.Y(1),G.X(-1.25),G.Y(1-d),G.X(0),G.Y(1-d)); g.bezierCurveTo(G.X(1.25),G.Y(1-d),G.X(1.15),G.Y(1),G.X(1.5),G.Y(1)); }
  g.lineTo(G.X(5),G.Y(1)); g.stroke(); g.restore(); }
function cargo(g,G,x,y,col,tri){ for(var i=0;i<6;i++){ var a=i/5*TAU, rr=i?0.42:0, px=G.X(x+rr*Math.cos(a)), py=G.Y(y+rr*Math.sin(a)), s=Math.max(3,0.16*G.sx);
  if(tri){ g.save(); g.fillStyle=col; g.beginPath(); g.moveTo(px,py-s); g.lineTo(px+s,py+s*0.8); g.lineTo(px-s,py+s*0.8); g.closePath(); g.fill(); g.restore(); } else circle(g,px,py,s,col,null); } }
function endoDraw(g,c,C,e,t){ var G=frame(full(c),-5,5,-3,3,10,true), fs=c.narrow?11:12, col=e===2?C.teal:C.red;
  B(g,G,-5,-3,5,1,alpha(C.gold,0.07)); T(g,'細胞外',G.X(-4.9),G.Y(2.7),C.muted,fs,'left','700'); T(g,'細胞質',G.X(-4.9),G.Y(-2.7),C.muted,fs,'left','700');
  if(e===1){
    if(t<0.5){ var y=-2+t/0.5*1.05; memU(g,G,0); circle(g,G.X(0),G.Y(y),0.95*G.sx,alpha(MEM,0.12),MEM,Math.max(5,0.2*G.sx)); cargo(g,G,0,y,col); T(g,'囊泡（由高基體送來）',G.X(1.25),G.Y(y),C.ink,fs,'left'); }
    else { var u=(t-0.5)/0.5, d=1.9*(1-u); memU(g,G,d); cargo(g,G,0,1-d*0.5+u*1.5,col); T(g,'囊泡和細胞膜融合 → 物質排出',G.X(1.6),G.Y(2.2),C.ink,fs,'left'); }
  } else {
    if(e===2){ [[-3.6,2.1],[-2.6,1.7],[2.8,2.3],[3.8,1.8]].forEach(function(p){ circle(g,G.X(p[0]),G.Y(p[1]),Math.max(3,0.16*G.sx),C.muted,null); }); T(g,'不和受體結合的分子留在外面',G.X(4.9),G.Y(2.7),C.muted,fs,'right'); }
    if(t<0.6){ var d2=t/0.6*1.9, cy=2-d2*(1.95/1.9); memU(g,G,d2); cargo(g,G,0,cy,col,e===2);
      if(e===2){ for(var k=-2;k<=2;k++){ var ang=-PI/2+k*0.45, rx=Math.cos(ang)*0.95, ry=1-d2+0.95+Math.sin(ang)*0.95; if(d2<0.3){ rx=k*0.55; ry=1.15; } T(g,'Y',G.X(rx),G.Y(ry),C.teal,12,'center','700'); } }
    } else { var yv=0.05-(t-0.6)/0.4*1.6; memU(g,G,0); circle(g,G.X(0),G.Y(yv),0.95*G.sx,alpha(MEM,0.12),MEM,Math.max(5,0.2*G.sx)); cargo(g,G,0,yv,col,e===2); T(g,'形成囊泡',G.X(1.25),G.Y(yv),C.ink,fs,'left'); }
    if(e===2) T(g,'Y＝受體',G.X(-4.9),G.Y(-2.2),C.teal,fs,'left','700');
  }
  if(t>0.05&&t<0.95) T(g,'耗能（ATP）',G.X(4.9),G.Y(-2.7),C.red,fs,'right','700'); }
var EOUT=['<b>胞吞</b>：細胞膜向內凹，把大分子包成囊泡帶進細胞（耗能）','<b>胞吐</b>：囊泡和細胞膜融合，把消化酶、激素等排出細胞（耗能）','<b>受體媒介胞吞</b>：只有和膜上<b>受體</b>結合的特定分子才會被包進去（耗能）'];
widget('w-endo',{state:{e:0,t:0},rw:0.48,rn:0.85,fmt:{e:function(v){return EMODE[v];},t:function(v){return Math.round(v*100)+'%';}},
  draw:function(g,c,s){ endoDraw(g,c,c.C,s.e,s.t); },
  out:function(s){ return EOUT[s.e]; }
});
widget('s-F2',{state:{},steps:2,rw:0.48,rn:0.85,
  draw:function(g,c,s){ endoDraw(g,c,c.C,1,s.step?0.85:0.3); },
  out:steps(['消化酶是蛋白質（大分子），先裝在囊泡裡往細胞膜移動。','囊泡和細胞膜融合，把消化酶倒到細胞外 → <b>胞吐作用</b>。'])
});

/* F3 水分子 */
function waterMol(g,G,C,x,y,ang,s){ var hs=[ang+0.91,ang-0.91].map(function(a){ return [x+0.62*s*Math.cos(a),y+0.62*s*Math.sin(a)]; });
  hs.forEach(function(h){ L(g,G.X(x),G.Y(y),G.X(h[0]),G.Y(h[1]),C.ink,1.5); circle(g,G.X(h[0]),G.Y(h[1]),0.25*s*G.sx,'#ffffff',C.ink,1.2); });
  circle(g,G.X(x),G.Y(y),0.42*s*G.sx,'#e05a4f',C.ink,1.2); return hs; }
function waterDraw(g,c,C,t,single){ var fs=c.narrow?11:13;
  if(single){ var G=frame(full(c),-3,3,-2,2,10,true), hs=waterMol(g,G,C,0,-0.4,PI/2,2.4);
    T(g,'δ−',G.X(0),G.Y(-1.75),C.red,18,'center','700'); hs.forEach(function(h){ T(g,'δ+',G.X(h[0]+(h[0]<0?-0.75:0.75)),G.Y(h[1]),C.blue,18,'center','700'); });
    wArc(g,G,0,-0.4,0.75,PI/2-0.91,PI/2+0.91,C.gold,2); T(g,'104.5°',G.X(0),G.Y(0.55),C.gold,13,'center','700');
    T(g,'氧比較會搶電子 → 帶部分負電',G.X(-2.9),G.Y(1.75),C.ink,fs,'left'); return 0; }
  var G=frame(full(c),-5,5,-3,3,10,true), r=seeded(17), M=[];
  for(var j=0;j<4;j++) for(var i=0;i<5;i++){ var a=r()*TAU, dx=(r()-0.5)*2*t, dy=(r()-0.5)*2*t, da=(r()-0.5)*PI*t; M.push({x:-3.6+i*1.8+(j%2)*0.45+dx*0.9, y:-2.4+j*1.6+dy*0.9, a:a+da}); }
  var Hs=M.map(function(m){ return waterMol(g,G,C,m.x,m.y,m.a,1); }), nb=0;
  Hs.forEach(function(hs,i){ hs.forEach(function(h){ var best=-1, bd=1e9; M.forEach(function(m,k){ if(k===i) return; var d=Math.hypot(m.x-h[0],m.y-h[1]); if(d<bd){ bd=d; best=k; } }); if(bd<1.45){ nb++; L(g,G.X(h[0]),G.Y(h[1]),G.X(M[best].x),G.Y(M[best].y),C.teal,1.6,[4,3]); } }); });
  T(g,'虛線 ＝ 氫鍵（共 '+nb+' 條）',G.X(4.9),G.Y(2.85),C.teal,fs,'right','700'); return nb; }
widget('w-water',{state:{t:0},rw:0.48,rn:0.85,fmt:{t:function(v){return Math.round(v*100)+'%';}},
  draw:function(g,c,s){ s.nb=waterDraw(g,c,c.C,s.t,false); },
  out:function(s){ return '氫鍵剩 '+s.nb+' 條：熱量要先拿去<b>打斷氫鍵</b>，分子才動得快 → 水的<b>比熱大</b>，溫度不容易變'; }
});
widget('s-F3',{state:{},steps:2,rw:0.48,rn:0.85,
  draw:function(g,c,s){ waterDraw(g,c,c.C,0,!s.step); },
  out:steps(['水分子是彎的：O 帶部分負電（δ−）、H 帶部分正電（δ+），是<b>極性分子</b>。','一個分子的 H 吸住另一個分子的 O，形成很多<b>氫鍵</b>；要升溫得先打斷它們 → <b>比熱大</b>，體溫不易劇烈變化。'])
});

/* F4 滲透 */
function osmoDraw(g,c,C,cs,t){ var G=frame(full(c),-5,5,0,7.4,10,true), h=cs*2.2*t, hL=4.3-h/2, hR=4.3+h/2, fs=c.narrow?11:12;
  B(g,G,-3,0.5,-1.4,hL,alpha(C.blue,0.25)); B(g,G,-1.4,0.5,0,2,alpha(C.blue,0.25)); B(g,G,0,0.5,1.4,2,alpha(C.blue,0.25+0.15*cs)); B(g,G,1.4,0.5,3,hR,alpha(C.blue,0.25+0.15*cs));
  [[[-3,6.6],[-3,0.5],[3,0.5],[3,6.6]],[[-1.4,6.6],[-1.4,2],[1.4,2],[1.4,6.6]]].forEach(function(p){ poly2(g,G,p,C.ink,2); });
  L(g,G.X(0),G.Y(0.5),G.X(0),G.Y(2),C.red,2.5,[4,3]); T(g,'半透膜',G.X(0),G.Y(0.15),C.red,fs,'center','700');
  var r=seeded(3), n=Math.round(cs*18); for(var i=0;i<n;i++){ var x,y; if(i%3===0){ x=0.15+r()*1.1; y=0.65+r()*1.2; } else { x=1.6+r()*1.25; y=0.65+r()*Math.max(0.2,hR-0.9); } circle(g,G.X(x),G.Y(y),Math.max(3,0.1*G.sx),C.gold,C.ink,0.8); }
  T(g,'純水',G.X(-2.2),G.Y(7.0),C.ink,fs,'center','700'); T(g,cs>0?'糖水（糖過不了膜）':'純水',G.X(2.2),G.Y(7.0),C.ink,fs,'center','700');
  if(cs>0){ arrow(g,G.X(-1.1),G.Y(1.25),G.X(1.1),G.Y(1.25),C.blue,2+cs*3); T(g,'水',G.X(-0.6),G.Y(1.7),C.blue,fs,'center','700'); }
  if(h>0.05){ L(g,G.X(-3),G.Y(hL),G.X(3.6),G.Y(hL),C.muted,1,[4,3]); L(g,G.X(1.4),G.Y(hR),G.X(3.6),G.Y(hR),C.muted,1,[4,3]); L(g,G.X(3.45),G.Y(hL),G.X(3.45),G.Y(hR),C.red,2); T(g,'液面差',G.X(3.6),G.Y((hL+hR)/2),C.red,fs,'left','700'); } }
widget('w-osmo',{state:{cs:0.6,t:0},rw:0.5,rn:0.95,fmt:{cs:function(v){return Math.round(v*100)+'%';},t:function(v){return Math.round(v*100)+'%';}},
  draw:function(g,c,s){ osmoDraw(g,c,c.C,s.cs,s.t); },
  out:function(s){ return s.cs===0?'兩邊都是純水：水分子進出一樣多，液面不變':'水由<b>左（水多）</b>往<b>右（溶質多）</b>淨移動；溶質越濃，液面差越大，<b>滲透壓越大</b>。要把右液面壓回原高度所需的壓力＝滲透壓'; }
});
widget('s-F4',{state:{},steps:2,rw:0.5,rn:0.95,
  draw:function(g,c,s){ osmoDraw(g,c,c.C,0.5,s.step?1:0); },
  out:steps(['右邊 10% 比左邊 5% 濃：右邊溶質多，代表水分子比較少。','水分子由水多的左邊往水少的右邊淨移動 → <b>由左往右</b>，右液面上升。'])
});

/* F5 等張、高張、低張 */
function tonicName(s){ return s<0.9?'低張溶液':s>1.1?'高張溶液':'等張溶液'; }
function waterArrows(g,G,C,s,r0,r1){ if(s>=0.9&&s<=1.1) return; for(var k=0;k<4;k++){ var a=PI/4+k*PI/2, o=s<0.9?r0:r1, i=s<0.9?r1:r0; arrow(g,G.X(o*Math.cos(a)),G.Y(o*Math.sin(a)),G.X(i*Math.cos(a)),G.Y(i*Math.sin(a)),C.blue,2); } }
function tonicDraw(g,c,C,s){ var P=panels(c,0.5), fs=c.narrow?11:13; box(g,0,0,c.w,c.h,alpha(C.blue,0.03+0.12*(s-0.3)/1.4),null);
  var G=frame(P[0],-3,3,-3.3,3.3,8,true), R=1.45;
  T(g,'紅血球（無細胞壁）',G.X(0),G.Y(3.0),C.ink,fs,'center','700');
  if(s<0.45){ for(var k=0;k<6;k++){ g.save(); g.strokeStyle='#c0392b'; g.lineWidth=3; g.beginPath(); g.arc(G.X(0),G.Y(0),R*1.35*G.sx,k*TAU/6+0.15,k*TAU/6+0.75); g.stroke(); g.restore(); }
    var r=seeded(9); for(var i=0;i<30;i++){ var a=r()*TAU, d=r()*2.5; dot(g,G.X(d*Math.cos(a)),G.Y(d*Math.sin(a)),2.5,alpha('#c0392b',0.7)); } T(g,'溶血（脹破）',G.X(0),G.Y(-2.75),C.red,fs,'center','700'); }
  else { var f=Math.pow(1/s,0.45), cren=s>1.1?(s-1.1)/0.6:0; g.save(); g.beginPath(); for(var i=0;i<=160;i++){ var a=i/160*TAU, rr=R*f*(1+0.1*cren*Math.sin(14*a)), x=G.X(rr*Math.cos(a)), y=G.Y(rr*Math.sin(a)); if(i) g.lineTo(x,y); else g.moveTo(x,y); } g.closePath(); g.fillStyle='#d9534f'; g.fill(); g.strokeStyle='#8e2a24'; g.lineWidth=1.5; g.stroke(); g.restore();
    if(cren<0.5) circle(g,G.X(0),G.Y(0),R*f*0.42*G.sx,alpha('#ffffff',0.28),null);
    T(g,s<0.9?'膨脹':s>1.1?'皺縮':'正常',G.X(0),G.Y(-2.75),s>1.1||s<0.9?C.red:C.ink,fs,'center','700'); waterArrows(g,G,C,s,2.75,2.05); }
  var H=frame(P[1],-3,3,-3.3,3.3,8,true), W=2.1, Hh=1.45, k=s<=1.05?1:Math.max(0.6,1-(s-1.05)*0.6);
  T(g,'植物細胞（有細胞壁）',H.X(0),H.Y(3.0),C.ink,fs,'center','700');
  WR(g,H,-W,-Hh,W,Hh,6,alpha(GREEN,0.06),GREEN,5);
  var w=(W-0.15)*k, h=(Hh-0.15)*k; WR(g,H,-w,-h,w,h,10,alpha('#7fc97f',0.55),'#2e7d32',1.5); WR(g,H,-w*0.62,-h*0.55,w*0.5,h*0.55,10,alpha('#ffffff',0.6),null);
  dot(g,H.X(w*0.75),H.Y(h*0.55),5,'#5b3a1a');
  if(k<0.97) T(g,'質壁分離',H.X(0),H.Y(-Hh-0.4),C.red,fs,'center','700');
  var tg=clamp((1.3-s)/1.0,0,1); B(g,H,-W,-2.85,W,-2.6,alpha(C.muted,0.2)); B(g,H,-W,-2.85,-W+2*W*tg,-2.6,C.teal); T(g,'膨壓',H.X(-W-0.1),H.Y(-2.72),C.teal,fs,'right','700');
  waterArrows(g,H,C,s,2.95,2.4); }
widget('w-tonic',{state:{s:1},rw:0.46,rn:1.05,fmt:{s:function(v){ return v.toFixed(2)+'（'+tonicName(v)+'）'; }},
  draw:function(g,c,s){ tonicDraw(g,c,c.C,s.s); },
  out:function(s){ var v=s.s; return v<0.9?'<b>低張</b>：水淨流入細胞 → 紅血球膨脹'+(v<0.45?'到<b>溶血</b>':'')+'；植物細胞<b>膨壓變大</b>，被細胞壁頂住不會破':v>1.1?'<b>高張</b>：水淨流出細胞 → 紅血球<b>皺縮</b>；植物細胞<b>質壁分離</b>，膨壓降低':'<b>等張</b>：水進出一樣多，形狀不變'; }
});
widget('s-F5',{state:{},steps:3,rw:0.46,rn:1.05,
  draw:function(g,c,s){ tonicDraw(g,c,c.C,[0.6,1,1.6][s.step]); },
  out:steps(['清水是<b>低張</b>：水跑進洋蔥細胞，膨壓變大，細胞壁頂住，所以<b>不會破</b>（紅血球才會溶血）。','等張時水進出平衡，兩種細胞都正常。','對照高張：水跑出來，植物細胞才會質壁分離。答案：<b>吸水、膨壓增加、不破裂</b>。'])
});

/* F6 鵝頸瓶 */
function flaskDraw(g,c,C,day,br){ var G=frame(full(c),-5,5,0,6,10,true), cx=-1, cy=1.6, R=1.5, fs=c.narrow?11:12, cl=br?clamp(day/10,0,1):0;
  g.save(); g.beginPath(); g.arc(G.X(cx),G.Y(cy),R*G.sx,0,TAU); g.clip(); B(g,G,cx-R,cy-R,cx+R,cy+0.2,alpha('#d9b56b',0.45+0.4*cl));
  var r=seeded(8); for(var i=0;i<Math.round(cl*45);i++){ var a=r()*TAU, d=Math.sqrt(r())*R*0.95, x=cx+d*Math.cos(a), y=cy+d*Math.sin(a); if(y<cy+0.15) dot(g,G.X(x),G.Y(y),2.5,alpha('#5b4a2a',0.8)); } g.restore();
  circle(g,G.X(cx),G.Y(cy),R*G.sx,null,C.ink,2);
  var tube=function(path){ [[0.42*G.sx,C.ink],[0.42*G.sx-4,'#ffffff']].forEach(function(st){ g.save(); g.strokeStyle=st[1]; g.lineWidth=st[0]; g.lineCap='butt'; g.beginPath(); path(); g.stroke(); g.restore(); }); };
  if(!br){ tube(function(){ g.moveTo(G.X(cx),G.Y(3.0)); g.lineTo(G.X(cx),G.Y(3.8)); g.bezierCurveTo(G.X(cx),G.Y(4.7),G.X(0),G.Y(3.1),G.X(0.7),G.Y(3.1)); g.bezierCurveTo(G.X(1.5),G.Y(3.1),G.X(2.4),G.Y(3.8),G.X(2.6),G.Y(4.9)); });
    var nt=Math.min(9,Math.floor(day/3)); for(var k=0;k<nt;k++) dot(g,G.X(0.35+k*0.09),G.Y(3.13+(k%2)*0.06),2.8,'#6b5b3a');
    if(day>3) T(g,'灰塵、微生物卡在彎曲處',G.X(0.7),G.Y(2.55),C.red,fs,'center','700');
    T(g,'空氣 ⇄',G.X(2.75),G.Y(5.2),C.blue,fs,'left','700');
    var r2=seeded(2); for(var j=0;j<6;j++){ var x=1.6+r2()*2.6, y=6-((r2()*3+day*0.35)%3); dot(g,G.X(x),G.Y(y),2.5,'#6b5b3a'); } }
  else { tube(function(){ g.moveTo(G.X(cx),G.Y(3.0)); g.lineTo(G.X(cx),G.Y(3.75)); }); poly2(g,G,[[cx-0.25,3.75],[cx-0.1,3.85],[cx+0.05,3.72],[cx+0.22,3.84]],C.ink,1.5);
    T(g,'瓶頸打斷',G.X(cx+0.4),G.Y(3.95),C.red,fs,'left','700');
    var r3=seeded(2); for(var j=0;j<7;j++){ var x=cx+(r3()-0.5)*0.5, y=5.8-((r3()*2.4+day*0.3)%2.4); dot(g,G.X(x),G.Y(y),2.5,'#6b5b3a'); } }
  T(g,cl>0.5?'長滿微生物（混濁）':'煮沸過的肉汁（澄清）',G.X(cx),G.Y(cy-0.5),cl>0.5?C.red:C.ink,fs,'center','700');
  T(g,'第 '+Math.round(day)+' 天',G.X(-4.9),G.Y(5.7),C.ink,fs+1,'left','700'); }
widget('w-flask',{state:{day:0,b:0},rw:0.5,rn:0.9,fmt:{day:function(v){return Math.round(v)+' 天';},b:function(v){return v?'打斷':'完整';}},
  draw:function(g,c,s){ flaskDraw(g,c,c.C,s.day,s.b); },
  out:function(s){ return s.b?'瓶頸打斷：灰塵和微生物直接掉進去 → 肉汁<b>變混濁</b>，長出微生物':'瓶頸完整：空氣照樣流通，但灰塵和微生物被彎曲處攔下 → 肉汁<b>一直澄清</b>'; }
});
widget('s-F6',{state:{},steps:2,rw:0.5,rn:0.9,
  draw:function(g,c,s){ flaskDraw(g,c,c.C,30,s.step); },
  out:steps(['瓶頸完整：空氣可以進出，30 天後肉汁還是澄清。所以「接觸空氣」不會讓生物自己長出來。','打斷瓶頸，微生物掉進去才長滿。彎曲瓶頸的目的：<b>讓空氣進出，但擋住微生物</b>。'])
});

/* F7 雷迪 */
function jar(g,G,C,x,lid){ var x0=x-1.1, x1=x+1.1, y0=0.3, y1=2.9;
  B(g,G,x0,y0,x1,y1,alpha(C.blue,0.06)); poly2(g,G,[[x0,y1],[x0,y0],[x1,y0],[x1,y1]],C.ink,2);
  ell(g,G.X(x),G.Y(0.6),0.75*G.sx,0.25*G.sy,0,'#a0522d',C.ink,1);
  if(lid===1) L(g,G.X(x0-0.12),G.Y(y1),G.X(x1+0.12),G.Y(y1),C.muted,4,[3,2]);
  if(lid===2) B(g,G,x0-0.12,y1,x1+0.12,y1+0.2,C.ink); }
function fly(g,G,x,y){ ell(g,G.X(x-0.12),G.Y(y+0.1),0.13*G.sx,0.07*G.sx,-0.5,alpha('#9fc5e8',0.8),null); ell(g,G.X(x+0.12),G.Y(y+0.1),0.13*G.sx,0.07*G.sx,0.5,alpha('#9fc5e8',0.8),null); ell(g,G.X(x),G.Y(y),0.14*G.sx,0.08*G.sx,0,'#333333',null); }
function rediDraw(g,c,C,day){ var G=frame(full(c),-5,5,-0.6,5,10,true), xs=[-3.4,0,3.4], fs=c.narrow?11:13;
  ['開口','紗布封口','密封'].forEach(function(n,i){ jar(g,G,C,xs[i],i); T(g,n,G.X(xs[i]),G.Y(-0.3),C.ink,fs,'center','700'); });
  for(var i=0;i<6;i++){ var j=i%3, ph=day*1.7+i*1.3, fx=xs[j]+Math.sin(ph)*0.8, fy=3.7+0.5*Math.cos(ph*1.3)+(i>2?0.5:0);
    if(i===0&&day>0.5){ fx=xs[0]+0.4*Math.sin(ph); fy=1.3+0.2*Math.cos(ph); } if(i===1&&day>0.5){ fx=xs[1]+0.3*Math.sin(ph*0.5); fy=3.08; } fly(g,G,fx,fy); }
  var ne=day>2?Math.min(8,Math.floor((day-2)*3)):0; for(var k=0;k<ne;k++) circle(g,G.X(xs[1]-0.6+k*0.17),G.Y(2.98),3,'#ffffff',C.ink,0.8);
  var nm=day>3?Math.min(10,Math.floor((day-3)*2.5)):0; for(var k2=0;k2<nm;k2++) ell(g,G.X(xs[0]-0.55+(k2%5)*0.27),G.Y(0.92+(k2>4?0.16:0)),0.12*G.sx,0.05*G.sx,0.3,'#f5f0e1',C.ink,0.8);
  if(day>5){ for(var k3=0;k3<3;k3++) ell(g,G.X(xs[1]-0.3+k3*0.3),G.Y(3.08),0.12*G.sx,0.05*G.sx,0,'#f5f0e1',C.ink,0.8); }
  T(g,'第 '+day.toFixed(0)+' 天',G.X(-4.9),G.Y(4.75),C.ink,fs,'left','700');
  if(day>3) T(g,'長蛆',G.X(xs[0]),G.Y(1.55),C.red,fs,'center','700'); if(day>5) T(g,'蛆只在紗布上',G.X(xs[1]),G.Y(3.55),C.red,fs,'center','700'); if(day>3) T(g,'沒有蛆',G.X(xs[2]),G.Y(1.55),C.teal,fs,'center','700'); }
widget('w-redi',{state:{day:0},rw:0.45,rn:0.85,fmt:{day:function(v){return v.toFixed(0)+' 天';}},
  draw:function(g,c,s){ rediDraw(g,c,c.C,s.day); },
  out:function(s){ return s.day<3?'蒼蠅在瓶子附近飛來飛去，能不能碰到肉，三個瓶子不一樣':'開口瓶<b>長蛆</b>；紗布瓶的卵和蛆只在紗布上；密封瓶<b>沒有蛆</b> → 蛆來自蒼蠅產的卵（支持生源說）'; }
});
widget('s-F7',{state:{},steps:2,rw:0.45,rn:0.85,
  draw:function(g,c,s){ rediDraw(g,c,c.C,s.step?8:1); },
  out:steps(['三個瓶子：肉一樣、溫度一樣、時間一樣（控制變因）；空氣在開口和紗布瓶都能進出。','唯一不同的是<b>蒼蠅能不能碰到肉</b>，這就是操作變因；長不長蛆是應變變因。'])
});

/* F8 尤里與米勒 */
function millerDraw(g,c,C,day,hl){ var G=frame(full(c),0,10,0,6,10,true), fs=c.narrow?10:12, hc=function(i){ return hl===i?C.red:C.ink; }, hw=function(i){ return hl===i?3:2; };
  var loop=[[2,2.3],[2,4.9],[5.9,4.9]];
  poly2(g,G,loop,C.muted,5); poly2(g,G,[[7,3.15],[7,1.25]],C.muted,5); poly2(g,G,[[6.65,0.85],[3.4,0.85],[2.85,1.1]],C.muted,5);
  circle(g,G.X(2),G.Y(1.4),0.9*G.sx,null,hc(1),hw(1)); g.save(); g.beginPath(); g.arc(G.X(2),G.Y(1.4),0.9*G.sx,0,TAU); g.clip(); B(g,G,1,0.4,3,1.35,alpha(C.blue,0.4)); g.restore();
  g.save(); g.fillStyle=ORANGE; g.beginPath(); g.moveTo(G.X(1.7),G.Y(0.05)); g.quadraticCurveTo(G.X(2),G.Y(0.75),G.X(2.3),G.Y(0.05)); g.closePath(); g.fill(); g.restore();
  T(g,'加熱的水',G.X(0.95),G.Y(1.9),hc(1),fs,'right','700'); T(g,'（原始海洋）',G.X(0.95),G.Y(1.5),hc(1),fs,'right');
  circle(g,G.X(7),G.Y(4.3),1.15*G.sx,alpha(C.gold,0.12),hc(2),hw(2));
  L(g,G.X(6.2),G.Y(5.45),G.X(6.72),G.Y(4.45),C.ink,2); L(g,G.X(7.8),G.Y(5.45),G.X(7.28),G.Y(4.45),C.ink,2);
  if(Math.floor(day*10)%3!==0) poly2(g,G,[[6.72,4.45],[6.85,4.6],[6.95,4.35],[7.08,4.58],[7.18,4.33],[7.28,4.45]],'#f5c518',2.5);
  T(g,'CH₄　NH₃',G.X(7),G.Y(3.95),C.ink,fs,'center','700'); T(g,'H₂　H₂O',G.X(7),G.Y(3.6),C.ink,fs,'center','700');
  T(g,'放電（閃電）',G.X(8.25),G.Y(5.0),hc(2),fs,'left','700');
  B(g,G,6.62,1.8,7.38,3.0,alpha(C.blue,0.15),hc(3),hw(3)-0.5); T(g,'冷凝（下雨）',G.X(7.5),G.Y(2.4),hc(3),fs,'left','700');
  circle(g,G.X(7),G.Y(0.9),0.38*G.sx,alpha('#8a5a2b',0.1+0.75*day/7),hc(3),hw(3)); T(g,'收集管：有機物累積',G.X(7.5),G.Y(0.9),hc(3),fs,'left','700');
  for(var k=0;k<7;k++){ var p=along(loop.concat([[6.9,4.6]]),((k/7)+day*0.25)%1); dot(g,G.X(p[0]),G.Y(p[1]),3.5,C.blue); }
  T(g,'第 '+day.toFixed(1)+' 天',G.X(0.1),G.Y(5.7),C.ink,fs+1,'left','700'); }
widget('w-miller',{state:{day:0},rw:0.52,rn:0.95,fmt:{day:function(v){return v.toFixed(1)+' 天';}},
  draw:function(g,c,s){ millerDraw(g,c,c.C,s.day,0); },
  out:function(s){ return '第 '+s.day.toFixed(1)+' 天：收集管裡的有機物（<b>胺基酸</b>等）越積越多 → 無機物加上能量，可以合成<b>小分子有機物</b>'; }
});
widget('s-F8',{state:{},steps:3,rw:0.52,rn:0.95,
  draw:function(g,c,s){ millerDraw(g,c,c.C,7,s.step+1); },
  out:steps(['加熱的水模擬<b>原始海洋</b>，水蒸氣往上跑。','放電瓶裡是原始大氣：<b>CH₄、NH₃、H₂、H₂O</b>，用放電模擬閃電。<b>沒有氧氣</b>。','冷凝模擬下雨，產物流回「海洋」累積。所以答案是 <b>O₂</b>：模擬的原始大氣沒有氧氣。'])
});

/* F9 有機演化階梯 */
var STG=[['無機物','原始大氣：CH₄、NH₃、H₂、H₂O'],['小分子有機物','胺基酸等｜尤里與米勒、卡爾文'],['大分子有機物','類蛋白質｜福克斯'],['可複製的 RNA','核糖酵素｜闕克、吉爾伯特'],['原始細胞','膜包住 RNA｜勒曼（微脂體）']];
function stgIcon(g,G,C,i,x,y,on){ var a=on?1:0.35, b=Math.max(3,0.09*G.sx);
  if(i===0){ [[-0.4,0,C.red],[-0.1,0.2,C.blue],[0.2,-0.05,C.gold],[0.45,0.2,C.teal]].forEach(function(p){ circle(g,G.X(x+p[0]),G.Y(y+p[1]),b,alpha(p[2],a),null); }); }
  if(i===1||i===2){ var n=i===1?3:7; for(var k=0;k<n;k++){ var px=x-0.55+k*(1.1/(n-1||1)), py=y+(k%2?0.12:-0.12); if(k) L(g,G.X(x-0.55+(k-1)*(1.1/(n-1))),G.Y(y+((k-1)%2?0.12:-0.12)),G.X(px),G.Y(py),alpha(C.ink,a),1.2); circle(g,G.X(px),G.Y(py),b,alpha(C.teal,a),null); } }
  if(i===3||i===4){ g.save(); g.strokeStyle=alpha(C.red,a); g.lineWidth=2; g.beginPath(); for(var k2=0;k2<=30;k2++){ var px2=x-0.55+k2*1.1/30, py2=y+0.12*Math.sin(k2*0.8); if(k2) g.lineTo(G.X(px2),G.Y(py2)); else g.moveTo(G.X(px2),G.Y(py2)); } g.stroke(); g.restore();
    for(var k3=0;k3<8;k3++) L(g,G.X(x-0.5+k3*0.14),G.Y(y+0.12*Math.sin((k3*0.14+0.05)/1.1*30*0.8)),G.X(x-0.5+k3*0.14),G.Y(y-0.2),alpha(C.red,a*0.7),1);
    if(i===4){ ell(g,G.X(x),G.Y(y),0.8*G.sx,0.45*G.sy,0,null,alpha(MEM,a),3); } } }
function stairsDraw(g,c,C,k){ var G=frame(full(c),0,10,-0.2,6.4,10,false), fs=c.narrow?10:13;
  STG.forEach(function(s,i){ var x0=i*2, h=1.1+i*1.0, on=i===k, past=i<=k;
    B(g,G,x0+0.06,0,x0+1.94,h,alpha(on?C.red:C.teal,past?(on?0.22:0.14):0.05),on?C.red:C.muted,on?2.5:1);
    T(g,(i+1)+'. '+s[0],G.X(x0+1),G.Y(h+0.35),past?(on?C.red:C.ink):C.muted,fs,'center','700');
    stgIcon(g,G,C,i,x0+1,h-0.55,past); }); }
widget('w-stairs',{state:{k:0},rw:0.45,rn:0.9,fmt:{k:function(v){return (v+1)+'. '+STG[v][0];}},
  draw:function(g,c,s){ stairsDraw(g,c,c.C,s.k); },
  out:function(s){ return '<b>'+STG[s.k][0]+'</b>：'+STG[s.k][1]; }
});
widget('s-F9',{state:{},steps:2,rw:0.45,rn:0.9,
  draw:function(g,c,s){ stairsDraw(g,c,c.C,s.step?4:3); },
  out:steps(['第 4 階的 <b>RNA</b>：能帶遺傳訊息（可複製），又能像酵素一樣催化（核糖酵素），一個分子包辦兩件事。','之後才被膜包成原始細胞，DNA 和蛋白質分工是更後來的事。答案：<b>RNA 能攜帶遺傳訊息，也能催化反應</b>。'])
});

/* F10 內共生 */
function bact(g,G,x,y,col){ rrect(g,G.X(x-0.5),G.Y(y+0.24),1.0*G.sx,0.48*G.sx,0.24*G.sx,alpha(col,0.35),col,2); }
function mito(g,G,x,y){ ell(g,G.X(x),G.Y(y),0.7*G.sx,0.38*G.sx,0,alpha(PURPLE,0.22),PURPLE,2.5); ell(g,G.X(x),G.Y(y),0.58*G.sx,0.27*G.sx,0,null,PURPLE,1); poly2(g,G,[[x-0.45,y],[x-0.32,y+0.2],[x-0.18,y-0.2],[x-0.04,y+0.2],[x+0.1,y-0.2],[x+0.24,y+0.2],[x+0.38,y-0.2],[x+0.48,y]],PURPLE,1.2); }
function chloro(g,G,x,y){ ell(g,G.X(x),G.Y(y),0.75*G.sx,0.4*G.sx,0,alpha(GREEN,0.22),GREEN,2.5); ell(g,G.X(x),G.Y(y),0.63*G.sx,0.29*G.sx,0,null,GREEN,1); [-0.35,0,0.35].forEach(function(o){ for(var k=0;k<3;k++) L(g,G.X(x+o-0.12),G.Y(y-0.1+k*0.1),G.X(x+o+0.12),G.Y(y-0.1+k*0.1),GREEN,2); }); }
function endoSymDraw(g,c,C,t){ var G=frame(full(c),-5,5,-3,3,10,true), fs=c.narrow?11:12;
  ell(g,G.X(0),G.Y(-0.3),3.3*G.sx,2.3*G.sx,0,alpha(C.gold,0.12),C.ink,2); ell(g,G.X(0.2),G.Y(-1.0),0.75*G.sx,0.55*G.sx,0,alpha(C.ink,0.12),C.ink,1.2); T(g,'細胞核',G.X(0.2),G.Y(-1.0),C.ink,11,'center');
  T(g,'較大的宿主細胞',G.X(0),G.Y(2.75),C.ink,fs,'center','700');
  var u1=clamp(t/0.4,0,1), p1=[lerp(-4.3,-1.6,u1),lerp(2.5,0.6,u1)];
  if(t<0.45){ bact(g,G,p1[0],p1[1],PURPLE); if(u1>0.6) ell(g,G.X(p1[0]),G.Y(p1[1]),0.72*G.sx,0.45*G.sx,0,null,C.ink,1.2); T(g,'好氧細菌',G.X(p1[0]),G.Y(p1[1]+0.55),PURPLE,fs,'center','700'); }
  else { mito(g,G,-1.6,0.6); T(g,'粒線體',G.X(-1.6),G.Y(1.2),PURPLE,fs,'center','700'); }
  if(t>=0.45){ var u2=clamp((t-0.5)/0.4,0,1), p2=[lerp(4.3,1.6,u2),lerp(2.5,0.5,u2)];
    if(t<0.95){ bact(g,G,p2[0],p2[1],GREEN); if(u2>0.6) ell(g,G.X(p2[0]),G.Y(p2[1]),0.72*G.sx,0.45*G.sx,0,null,C.ink,1.2); T(g,'藍綠菌',G.X(p2[0]),G.Y(p2[1]+0.55),GREEN,fs,'center','700'); }
    else { chloro(g,G,1.6,0.5); T(g,'葉綠體',G.X(1.6),G.Y(1.1),GREEN,fs,'center','700'); } }
  T(g,t<0.45?'① 吞入好氧細菌':t<0.95?'② 再吞入藍綠菌':'動物細胞停在 ①，植物細胞走到 ②',G.X(-4.9),G.Y(-2.8),C.red,fs,'left','700'); }
widget('w-endosym',{state:{t:0},rw:0.5,rn:0.9,fmt:{t:function(v){return Math.round(v*100)+'%';}},
  draw:function(g,c,s){ endoSymDraw(g,c,c.C,s.t); },
  out:function(s){ return s.t<0.45?'好氧細菌被吞入卻沒被消化，留下來做有氧呼吸 → 變成<b>粒線體</b>（多包了一層膜）':'有些細胞再吞入藍綠菌，變成<b>葉綠體</b>。兩者都有<b>自己的 DNA、雙層膜</b>，能自行分裂'; }
});
widget('s-F10',{state:{},steps:2,rw:0.5,rn:0.9,
  draw:function(g,c,s){ endoSymDraw(g,c,c.C,s.step?1:0.46); },
  out:steps(['第一步：吞入好氧細菌 → 粒線體。幾乎所有真核生物（動物、植物、真菌）都有粒線體。','第二步：只有植物、藻類的祖先再吞入藍綠菌 → 葉綠體。所以<b>粒線體先、葉綠體後</b>。'])
});

/* F11 生命型式演化（示意） */
var LEV=[[38,'最早的生命：原核、單細胞、異營、無氧代謝'],[30,'自營出現：光合細菌、藍綠菌'],[24,'氧氣累積 → 有氧代謝出現'],[18,'真核細胞出現（內共生）'],[8,'多細胞生物出現']];
function o2(x){ return 0.8/(1+Math.exp((x-22)/1.6))+0.2/(1+Math.exp((x-6)/1.0)); }
function lifeDraw(g,c,C,ty){ var G=frame(full(c),41,-1,-1.95,1.35,22,false), fs=c.narrow?10:12;
  L(g,G.X(40),G.Y(0),G.X(0),G.Y(0),C.ink,2);
  for(var k=0;k<=40;k+=10) T(g,k?k+' 億年前':'現在',G.X(k),G.Y(0.12),C.muted,10,'center');
  g.save(); g.fillStyle=alpha(C.blue,0.15); g.beginPath(); g.moveTo(G.X(40),G.Y(0.25)); for(var x=40;x>=0;x-=0.2) g.lineTo(G.X(x),G.Y(0.25+o2(x))); g.lineTo(G.X(0),G.Y(0.25)); g.closePath(); g.fill(); g.restore();
  plot(g,G,function(x){ return 0.25+o2(x); },0,40,C.blue,2); T(g,'大氣 O₂（示意）',G.X(3),G.Y(1.3),C.blue,fs,'right','700');
  LEV.forEach(function(e,i){ var past=e[0]>=ty, y=-0.35-0.36*i; L(g,G.X(e[0]),G.Y(0),G.X(e[0]),G.Y(y),past?C.ink:C.grid,1); dot(g,G.X(e[0]),G.Y(0),5,past?C.red:C.muted); T(g,e[1],G.X(e[0])+(i<3?6:-6),G.Y(y),past?C.ink:C.muted,fs,i<3?'left':'right',past?'700':'500'); });
  L(g,G.X(ty),G.Y(1.3),G.X(ty),G.Y(-1.9),C.red,2,[5,4]); }
widget('w-life',{state:{ty:20},rw:0.42,rn:0.95,fmt:{ty:function(v){return v?v+' 億年前':'現在';}},
  draw:function(g,c,s){ lifeDraw(g,c,c.C,s.ty); },
  out:function(s){ var p=LEV.filter(function(e){ return e[0]>=s.ty; }); return p.length?'到這時已經發生：'+p.map(function(e){ return e[1]; }).join('　→　'):'生命還沒出現（時間軸為示意）'; }
});
widget('s-F11',{state:{},steps:2,rw:0.42,rn:0.95,
  draw:function(g,c,s){ lifeDraw(g,c,c.C,s.step?0:26); },
  out:steps(['最早的生物：異營、無氧代謝、原核、單細胞。之後才出現自營，氧氣跟著上升。','依時間由左到右讀：異營→自營、無氧→有氧、<b>原核→真核</b>、單細胞→多細胞。'])
});

/* F12 植物細胞 */
var PCELL=[['薄壁細胞','活｜只有初生壁','儲存、光合'],['厚角細胞','活｜初生壁角隅增厚（果膠）','支持'],['厚壁細胞','死｜次生壁（木質素）','支持']];
function pcellDraw(g,c,C,k){ var G=frame(full(c),0,12.6,-0.9,4.4,8,true), fs=c.narrow?10:12;
  [0.6,4.8,9].forEach(function(x0,i){ var y0=1, s=3;
    if(i===0){ WR(g,G,x0,y0,x0+s,y0+s,4,alpha('#a5d6a7',0.4),GREEN,2); WR(g,G,x0+0.5,y0+0.6,x0+2.2,y0+2.3,14,alpha('#ffffff',0.7),null); dot(g,G.X(x0+2.55),G.Y(y0+2.5),6,'#5b3a1a'); [[0.35,0.35],[2.6,0.4],[2.6,1.5],[0.3,2.6],[1.3,0.3]].forEach(function(p){ ell(g,G.X(x0+p[0]),G.Y(y0+p[1]),0.17*G.sx,0.09*G.sx,0.4,GREEN,null); }); }
    if(i===1){ WR(g,G,x0,y0,x0+s,y0+s,3,alpha('#a5d6a7',0.3),GREEN,2); g.save(); g.beginPath(); g.rect(G.X(x0),G.Y(y0+s),s*G.sx,s*G.sy); g.clip(); [[x0,y0],[x0+s,y0],[x0,y0+s],[x0+s,y0+s]].forEach(function(p){ circle(g,G.X(p[0]),G.Y(p[1]),0.65*G.sx,alpha(GREEN,0.55),null); }); g.restore(); dot(g,G.X(x0+1.5),G.Y(y0+1.5),6,'#5b3a1a'); }
    if(i===2){ WR(g,G,x0,y0,x0+s,y0+s,3,'#b08a5a',C.ink,1.5); WR(g,G,x0+0.6,y0+0.6,x0+s-0.6,y0+s-0.6,6,'#ffffff',null); [[x0+1.5,y0,x0+1.5,y0+0.6],[x0+1.5,y0+s-0.6,x0+1.5,y0+s],[x0,y0+1.5,x0+0.6,y0+1.5],[x0+s-0.6,y0+1.5,x0+s,y0+1.5]].forEach(function(p){ L(g,G.X(p[0]),G.Y(p[1]),G.X(p[2]),G.Y(p[3]),'#ffffff',3); }); T(g,'空腔',G.X(x0+1.5),G.Y(y0+1.5),C.muted,11,'center'); }
    if(i===k) WR(g,G,x0-0.15,y0-0.15,x0+s+0.15,y0+s+0.15,6,null,C.red,3);
    T(g,PCELL[i][0],G.X(x0+1.5),G.Y(0.5),i===k?C.red:C.ink,fs+1,'center','700'); T(g,PCELL[i][1],G.X(x0+1.5),G.Y(0.05),C.ink,fs-1,'center'); T(g,'功能：'+PCELL[i][2],G.X(x0+1.5),G.Y(-0.4),C.muted,fs-1,'center'); }); }
widget('w-pcell',{state:{k:0},rw:0.42,rn:0.9,fmt:{k:function(v){return PCELL[v][0];}},
  draw:function(g,c,s){ pcellDraw(g,c,c.C,s.k); },
  out:function(s){ var p=PCELL[s.k]; return '<b>'+p[0]+'</b>：'+p[1]+'；功能：'+p[2]+(s.k===2?'（如石細胞、纖維細胞）':''); }
});
widget('s-F12',{state:{},steps:2,rw:0.42,rn:0.9,
  draw:function(g,c,s){ pcellDraw(g,c,c.C,s.step?2:1); },
  out:steps(['厚角細胞：裡面有細胞核，是<b>活細胞</b>；壁只在角落加厚，仍是<b>初生壁</b>（富含果膠）。','對照厚壁細胞：次生壁含木質素、中間空掉，是死細胞。答案：<b>活細胞、只有初生壁、角隅增厚</b>。'])
});

/* F13 根尖 */
function rootTipDraw(g,c,C,t){ var G=frame(full(c),-0.3,12.4,-2.4,2.4,10,true), xt=8.6+2.6*t, Rr=0.85, fs=c.narrow?10:12;
  var body=function(){ g.beginPath(); g.moveTo(G.X(0),G.Y(Rr)); g.lineTo(G.X(xt-0.9),G.Y(Rr)); g.quadraticCurveTo(G.X(xt+0.05),G.Y(Rr),G.X(xt),G.Y(0)); g.quadraticCurveTo(G.X(xt+0.05),G.Y(-Rr),G.X(xt-0.9),G.Y(-Rr)); g.lineTo(G.X(0),G.Y(-Rr)); g.closePath(); };
  for(var x=0.2;x<xt-4.2;x+=0.35){ var len=Math.min(0.9,(xt-4.2-x)*0.5+0.12), off=((x*10)%3)*0.05; L(g,G.X(x),G.Y(Rr),G.X(x+0.1),G.Y(Rr+len-off),C.muted,1.3); L(g,G.X(x+0.17),G.Y(-Rr),G.X(x+0.27),G.Y(-Rr-len+off),C.muted,1.3); }
  g.save(); body(); g.fillStyle='#f6ecd2'; g.fill(); g.clip();
  B(g,G,xt-0.7,-2,xt+0.2,2,alpha(BROWN,0.35)); B(g,G,xt-1.7,-2,xt-0.7,2,alpha(C.red,0.18)); B(g,G,xt-4.2,-2,xt-1.7,2,alpha(C.teal,0.12));
  for(var a=xt-1.7;a<xt-0.7;a+=0.18) L(g,G.X(a),G.Y(-Rr),G.X(a),G.Y(Rr),alpha(C.ink,0.4),1);
  var b=xt-1.7, w=0.22; while(b>xt-4.2){ L(g,G.X(b),G.Y(-Rr),G.X(b),G.Y(Rr),alpha(C.ink,0.35),1); b-=w; w+=0.1; }
  for(var m=0;m<xt-4.2;m+=0.6) L(g,G.X(m),G.Y(-Rr),G.X(m),G.Y(Rr),alpha(C.ink,0.3),1);
  [-0.42,0,0.42].forEach(function(y){ L(g,G.X(0),G.Y(y),G.X(xt-0.7),G.Y(y),alpha(C.ink,0.2),1); }); g.restore();
  g.save(); body(); g.strokeStyle=C.ink; g.lineWidth=1.5; g.stroke(); g.restore();
  var Z=[[0,xt-4.2,'成熟區（根毛）',1.95],[xt-4.2,xt-1.7,'延長區',1.95],[xt-1.7,xt-0.7,'生長點',1.5],[xt-0.7,xt,'根帽',1.95]];
  Z.forEach(function(z){ L(g,G.X(z[0]+0.05),G.Y(z[3]-0.2),G.X(z[1]-0.05),G.Y(z[3]-0.2),C.ink,1); T(g,z[2],G.X((z[0]+z[1])/2),G.Y(z[3]),C.ink,fs,'center','700'); });
  T(g,'生長方向 →',G.X(12.3),G.Y(-1.9),C.red,fs,'right','700'); }
widget('w-roottip',{state:{t:0},rw:0.38,rn:0.7,fmt:{t:function(v){return Math.round(v*100)+'%';}},
  draw:function(g,c,s){ rootTipDraw(g,c,c.C,s.t); },
  out:function(){ return '<b>生長點</b>細胞分裂 → <b>延長區</b>細胞拉長把根往前推 → <b>成熟區</b>表皮細胞外凸成<b>根毛</b>吸水；根帽在最前端保護生長點'; }
});
widget('s-F13',{state:{},steps:2,rw:0.38,rn:0.7,
  draw:function(g,c,s){ rootTipDraw(g,c,c.C,s.step?1:0); },
  out:steps(['由最前端往後：根帽（保護）→ 生長點（分裂）→ 延長區（伸長），這三區都還沒有根毛。','細胞長大、成熟後，表皮才外凸成根毛 → 根毛在<b>成熟區</b>。'])
});

/* F14 根橫切 */
var RLAY=['表皮（根毛）','皮層','內皮（卡氏帶）','周鞘（長出側根）','維管束（木質部、韌皮部）','髓（單子葉根才有）'];
function rootXsDraw(g,c,C,k,m){ var P=panels(c,0.6), G=frame(P[0],-3.7,3.7,-3.6,3.6,6,true), cx=G.X(0), cy=G.Y(0), fs=c.narrow?11:13, on=function(i){ return k===i; };
  for(var a=0;a<TAU;a+=TAU/16) L(g,G.X(2.95*Math.cos(a)),G.Y(2.95*Math.sin(a)),G.X(3.55*Math.cos(a+0.06)),G.Y(3.55*Math.sin(a+0.06)),on(0)?C.red:C.muted,1.5);
  circle(g,cx,cy,3*G.sx,on(0)?alpha(C.red,0.2):'#f3ead2',on(0)?C.red:C.ink,on(0)?3:1.5);
  circle(g,cx,cy,2.8*G.sx,on(1)?alpha(C.red,0.15):'#f8f2e2',null);
  for(var rr=1.75;rr<2.75;rr+=0.33){ var n=Math.floor(TAU*rr/0.34); for(var j=0;j<n;j++){ var aa=j/n*TAU+rr; circle(g,G.X(rr*Math.cos(aa)),G.Y(rr*Math.sin(aa)),0.15*G.sx,null,alpha(C.ink,0.3),1); } }
  circle(g,cx,cy,1.45*G.sx,null,on(2)?C.red:'#8a6d3b',Math.max(4,0.16*G.sx)); for(var j2=0;j2<20;j2++){ var a2=j2/20*TAU; dot(g,G.X(1.45*Math.cos(a2)),G.Y(1.45*Math.sin(a2)),2,'#3b2a10'); }
  circle(g,cx,cy,1.28*G.sx,on(3)?alpha(C.red,0.25):'#fffaf0',on(3)?C.red:C.teal,on(3)?3:1.5);
  if(m===0){ var pts=[]; for(var q=0;q<8;q++){ var ang=q*PI/4, rad=q%2?0.32:1.05; pts.push([rad*Math.cos(ang),rad*Math.sin(ang)]); }
    g.save(); g.beginPath(); pts.forEach(function(p,i){ if(i) g.lineTo(G.X(p[0]),G.Y(p[1])); else g.moveTo(G.X(p[0]),G.Y(p[1])); }); g.closePath(); g.fillStyle=on(4)?alpha(C.red,0.45):alpha(C.blue,0.5); g.fill(); g.strokeStyle=C.ink; g.lineWidth=1; g.stroke(); g.restore();
    for(var q2=0;q2<4;q2++){ var a3=PI/4+q2*PI/2; circle(g,G.X(0.82*Math.cos(a3)),G.Y(0.82*Math.sin(a3)),0.22*G.sx,on(4)?alpha(C.red,0.45):alpha(ORANGE,0.7),C.ink,1); }
    if(on(5)) T(g,'雙子葉根：中央是木質部，沒有髓',G.X(0),G.Y(-3.45),C.red,fs,'center','700'); }
  else { circle(g,cx,cy,0.72*G.sx,on(5)?alpha(C.red,0.3):'#fffdf5',C.ink,1);
    for(var q3=0;q3<10;q3++){ var a4=q3/10*TAU; circle(g,G.X(0.98*Math.cos(a4)),G.Y(0.98*Math.sin(a4)),0.14*G.sx,on(4)?alpha(C.red,0.5):alpha(C.blue,0.6),C.ink,0.8); var a5=a4+PI/10; circle(g,G.X(1.08*Math.cos(a5)),G.Y(1.08*Math.sin(a5)),0.11*G.sx,on(4)?alpha(C.red,0.5):alpha(ORANGE,0.75),null); } }
  var x0=P[1].x+(c.narrow?16:8), y0=P[1].y+(c.narrow?22:30);
  T(g,m?'單子葉根（由外而內）':'雙子葉根（由外而內）',x0,y0,C.ink,fs+1,'left','700');
  RLAY.forEach(function(s,i){ T(g,(i+1)+'. '+s,x0,y0+26+i*24,on(i)?C.red:(i===5&&m===0?C.muted:C.ink),fs,'left',on(i)?'700':'500'); });
  T(g,'藍＝木質部　橘＝韌皮部',x0,y0+26+6*24+6,C.muted,fs-1,'left'); }
widget('w-rootxs',{state:{k:0,m:0},rw:0.5,rn:1.3,fmt:{k:function(v){return (v+1)+'. '+RLAY[v].replace(/（.*/,'');},m:function(v){return v?'單子葉':'雙子葉';}},
  draw:function(g,c,s){ rootXsDraw(g,c,c.C,s.k,s.m); },
  out:function(s){ var t=['表皮：最外層，細胞外凸成<b>根毛</b>吸水','皮層：很多薄壁細胞，<b>儲存養分</b>','內皮：細胞壁上有木栓化的<b>卡氏帶</b>，控管物質進入中柱','周鞘：<b>側根</b>由這裡長出來','維管束：木質部與韌皮部<b>相間排列</b>',s.m?'髓：單子葉根中央有髓':'雙子葉根<b>沒有髓</b>，中央是木質部']; return t[s.k]; }
});
widget('s-F14',{state:{},steps:2,rw:0.5,rn:1.3,
  draw:function(g,c,s){ rootXsDraw(g,c,c.C,s.step?3:0,0); },
  out:steps(['表皮往外凸出來的是<b>根毛</b>，不是側根。','往內數：表皮 → 皮層 → 內皮 → <b>周鞘</b>。側根就是從周鞘長出，再穿過外面各層冒出來。'])
});

/* F15 莖橫切 */
function stemXsDraw(g,c,C,m){ var P=panels(c,0.58), G=frame(P[0],-3.4,3.4,-3.4,3.4,6,true), cx=G.X(0), cy=G.Y(0), fs=c.narrow?11:13;
  circle(g,cx,cy,3.1*G.sx,'#eef6e4',GREEN,2.5);
  var bundle=function(x,y,a,s){ ell(g,G.X(x+0.2*s*Math.cos(a)),G.Y(y+0.2*s*Math.sin(a)),0.22*s*G.sx,0.17*s*G.sx,-a,alpha(ORANGE,0.8),null); ell(g,G.X(x-0.15*s*Math.cos(a)),G.Y(y-0.15*s*Math.sin(a)),0.24*s*G.sx,0.2*s*G.sx,-a,alpha(C.blue,0.65),null); circle(g,G.X(x),G.Y(y),0.42*s*G.sx,null,C.ink,1); };
  if(m===0){ circle(g,cx,cy,1.6*G.sx,'#fbf7e9',null); T(g,'髓',cx,cy,C.muted,fs,'center','700');
    for(var i=0;i<8;i++){ var a=i/8*TAU; bundle(2.15*Math.cos(a),2.15*Math.sin(a),a,1.5); }
    circle(g,cx,cy,2.15*G.sx,null,C.red,2,[5,4]); T(g,'形成層',G.X(2.3*Math.cos(PI/8))+4,G.Y(2.3*Math.sin(PI/8)),C.red,fs-1,'left','700'); }
  else { var r=seeded(5), pts=[]; while(pts.length<26){ var rr=Math.sqrt(r())*2.7, a2=r()*TAU, p=[rr*Math.cos(a2),rr*Math.sin(a2)]; if(pts.every(function(q){ return Math.hypot(q[0]-p[0],q[1]-p[1])>0.62; })) pts.push(p); }
    pts.forEach(function(p){ bundle(p[0],p[1],Math.atan2(p[1],p[0]),0.9); }); }
  var x0=P[1].x+(c.narrow?16:8), y0=P[1].y+(c.narrow?22:34), L2=m?['單子葉莖（玉米、竹子）','維管束「散生」','沒有形成層 → 不會一直長粗','沒有明顯的髓']:['雙子葉莖','維管束排成一圈（環狀）','有形成層 → 會越長越粗','中央有髓'];
  L2.forEach(function(s,i){ T(g,s,x0,y0+i*26,i?C.ink:C.red,i?fs:fs+1,'left','700'); });
  T(g,'藍＝木質部（內）　橘＝韌皮部（外）',x0,y0+4*26+4,C.muted,fs-1,'left'); }
widget('w-stemxs',{state:{m:0},rw:0.48,rn:1.25,fmt:{m:function(v){return v?'單子葉莖':'雙子葉莖';}},
  draw:function(g,c,s){ stemXsDraw(g,c,c.C,s.m); },
  out:function(s){ return s.m?'<b>單子葉莖</b>：維管束散生、沒有形成層（所以沒有年輪）':'<b>雙子葉莖</b>：維管束環狀排列、有形成層、中央有髓'; }
});
widget('s-F15',{state:{},steps:2,rw:0.48,rn:1.25,
  draw:function(g,c,s){ stemXsDraw(g,c,c.C,s.step?1:0); },
  out:steps(['先看雙子葉莖：維管束排一圈，有形成層（紅虛線）。','玉米是單子葉：維管束<b>散生</b>，<b>沒有形成層</b>，所以也不會有年輪。'])
});

/* F16 年輪 */
function woodDraw(g,c,C,y){ var P=panels(c,0.55), G=frame(P[0],-3.3,3.3,-3.3,3.3,6,true), cx=G.X(0), cy=G.Y(0), dr=0.25, R=y*dr, fs=c.narrow?11:13, hw=y>=4?y-3:0;
  circle(g,cx,cy,(R+0.45)*G.sx,'#6b4a2b',null); for(var k=0;k<10;k++){ var a=k/10*TAU+0.3; L(g,G.X((R+0.2)*Math.cos(a)),G.Y((R+0.2)*Math.sin(a)),G.X((R+0.45)*Math.cos(a)),G.Y((R+0.45)*Math.sin(a)),'#3e2a16',2); }
  circle(g,cx,cy,(R+0.12)*G.sx,alpha(ORANGE,0.85),null);
  for(var i=y;i>=1;i--){ circle(g,cx,cy,i*dr*G.sx,'#c9955d',null); circle(g,cx,cy,(i*dr-0.07)*G.sx,'#ecd2a6',null); }
  if(hw) circle(g,cx,cy,hw*dr*G.sx,alpha('#7a4a1f',0.6),null);
  dot(g,cx,cy,3,'#5b3a1a'); circle(g,cx,cy,R*G.sx+1,null,C.red,2.5);
  var x0=P[1].x+(c.narrow?16:8), y0=P[1].y+(c.narrow?22:30), items=[['#6b4a2b','樹皮（形成層以外的全部）'],[C.red,'形成層：往內做木材、往外做韌皮部'],['#ecd2a6','早材：春夏，淺、寬'],['#c9955d','晚材：秋冬，深、窄'],['#9c6b3e','心材：內側、深色、不運水'],['#ecd2a6','邊材：外側、仍能運水']];
  T(g,'第 '+y+' 年：年輪 '+y+' 圈',x0,y0,C.ink,fs+1,'left','700');
  items.forEach(function(it,i){ var yy=y0+28+i*25; box(g,x0,yy-7,14,14,it[0],C.ink,1); T(g,it[1],x0+22,yy,(i===4&&!hw)?C.muted:C.ink,fs,'left'); }); }
widget('w-wood',{state:{y:5},rw:0.5,rn:1.25,fmt:{y:function(v){return v+' 年';}},
  draw:function(g,c,s){ woodDraw(g,c,c.C,s.y); },
  out:function(s){ var hw=s.y>=4?s.y-3:0; return s.y+' 年：<b>'+s.y+' 圈年輪</b>（一圈＝早材＋晚材）'+(hw?'；內側 '+hw+' 圈已變成<b>心材</b>，外側 3 圈是邊材':'；還沒有形成心材'); }
});
widget('s-F16',{state:{},steps:2,rw:0.5,rn:1.25,
  draw:function(g,c,s){ woodDraw(g,c,c.C,s.step?8:3); },
  out:steps(['一淺（早材）一深（晚材）合起來才是一年；3 年就是 3 圈。','8 年時，內側深色的是<b>心材</b>，已不運水；外側淺色仍運水的是邊材。答案：<b>心材在內側、顏色深、無運輸功能</b>。'])
});

/* F17 維管束 */
function vascDraw(g,c,C,t){ var G=frame(full(c),0,10,-0.5,6.4,10,false), fs=c.narrow?10:12;
  for(var i=0;i<4;i++){ var y0=0.3+i*1.2; L(g,G.X(0.9),G.Y(y0),G.X(0.9),G.Y(y0+1.2),C.blue,2.5); L(g,G.X(2.3),G.Y(y0),G.X(2.3),G.Y(y0+1.2),C.blue,2.5); L(g,G.X(0.9),G.Y(y0),G.X(1.15),G.Y(y0),C.blue,2); L(g,G.X(2.05),G.Y(y0),G.X(2.3),G.Y(y0),C.blue,2); for(var r=0.15;r<1.2;r+=0.25){ L(g,G.X(0.9),G.Y(y0+r),G.X(1.0),G.Y(y0+r+0.08),C.blue,1.2); L(g,G.X(2.3),G.Y(y0+r),G.X(2.2),G.Y(y0+r+0.08),C.blue,1.2); } }
  for(var j=0;j<2;j++){ var b=0.3+j*2.4; g.save(); g.strokeStyle=C.blue; g.lineWidth=2; g.beginPath(); g.moveTo(G.X(3.1),G.Y(b)); g.lineTo(G.X(3.45),G.Y(b+0.4)); g.lineTo(G.X(3.45),G.Y(b+2.0)); g.lineTo(G.X(3.1),G.Y(b+2.4)); g.lineTo(G.X(2.75),G.Y(b+2.0)); g.lineTo(G.X(2.75),G.Y(b+0.4)); g.closePath(); g.stroke(); g.restore(); for(var p=0.6;p<2.0;p+=0.3) dot(g,G.X(3.1),G.Y(b+p),2,C.blue); }
  for(var k=0;k<10;k++){ var yy=0.4+((k*0.48+t*4.8)%4.6); dot(g,G.X(1.6+0.35*Math.sin(k*1.7)),G.Y(yy),4,C.blue); }
  for(var i2=0;i2<4;i2++){ var y1=0.3+i2*1.2; B(g,G,5.3,y1,6.9,y1+1.2,alpha(ORANGE,0.13),ORANGE,1.5); if(i2) L(g,G.X(5.3),G.Y(y1),G.X(6.9),G.Y(y1),ORANGE,4,[4,3]); B(g,G,7.0,y1+0.05,7.6,y1+1.15,alpha(GREEN,0.12),GREEN,1.2); dot(g,G.X(7.3),G.Y(y1+0.6),4.5,'#5b3a1a'); }
  for(var k2=0;k2<9;k2++){ var dir=k2%3===0?1:-1, yy2=dir<0?5.0-((k2*0.5+t*4.6)%4.6):0.4+((k2*0.5+t*4.6)%4.6); dot(g,G.X(6.1+0.4*Math.sin(k2*2.1)),G.Y(yy2),4,ORANGE); }
  T(g,'木質部：水＋礦物質 ↑',G.X(2.1),G.Y(5.95),C.blue,fs+1,'center','700'); T(g,'韌皮部：有機養分 ⇅',G.X(6.4),G.Y(5.95),ORANGE,fs+1,'center','700');
  T(g,'導管（死、中空）',G.X(1.6),G.Y(-0.2),C.ink,fs,'center','700'); T(g,'管胞（死）',G.X(3.1),G.Y(-0.2),C.ink,fs,'center','700'); T(g,'篩管（活、無核）',G.X(6.1),G.Y(-0.2),C.ink,fs,'center','700');
  T(g,'← 伴細胞（有核）',G.X(7.75),G.Y(3.0),GREEN,fs,'left','700'); T(g,'← 篩板（有孔）',G.X(7.75),G.Y(1.5),ORANGE,fs,'left','700'); }
widget('w-vasc',{state:{t:0},rw:0.5,rn:0.95,fmt:{t:function(v){return Math.round(v*100)+'%';}},
  draw:function(g,c,s){ vascDraw(g,c,c.C,s.t); },
  out:function(){ return '<b>導管、管胞</b>是死細胞，中空當水管，水由下往上；<b>篩管</b>是活細胞但沒有核，靠<b>伴細胞</b>維持，養分雙向運輸'; }
});
widget('s-F17',{state:{},steps:2,rw:0.5,rn:0.95,
  draw:function(g,c,s){ vascDraw(g,c,c.C,s.step?0.5:0); },
  out:steps(['導管、管胞：死細胞（中空才好運水）；纖維細胞：厚壁細胞，也是死的。','篩管細胞沒有核，但仍是<b>活細胞</b>（靠伴細胞幫忙）→ 答案是<b>篩管細胞</b>。'])
});

/* F18 葉 */
var LEAF=['上表皮（外有角質層）','柵狀組織','海綿組織','葉脈（維管束）','下表皮與氣孔'];
function leafDraw(g,c,C,k){ var G=frame(full(c),0,12.4,-0.2,6.4,8,false), fs=c.narrow?10:12, on=function(i){ return k===i; }, ol=function(i){ return on(i)?C.red:alpha(C.ink,0.6); }, vx=3.2, sx=6.9;
  B(g,G,0,5.6,9,5.75,alpha('#d9c06a',on(0)?1:0.7));
  for(var x=0;x<9-0.01;x+=0.75) WR(g,G,x+0.02,5.05,x+0.73,5.58,3,on(0)?alpha(C.red,0.15):'#fdfbf4',ol(0),on(0)?2:1);
  for(var x2=0.04;x2<9-0.5;x2+=0.6){ WR(g,G,x2,3.5,x2+0.54,5.0,6,on(1)?alpha(C.red,0.14):alpha(GREEN,0.16),ol(1),on(1)?2:1); for(var q=0;q<5;q++) dot(g,G.X(x2+(q%2?0.18:0.36)),G.Y(3.7+q*0.28),3,GREEN); }
  var r=seeded(12), cells=[]; for(var tries=0;tries<400&&cells.length<30;tries++){ var p=[0.3+r()*8.4,1.45+r()*1.85]; if(Math.hypot(p[0]-vx,p[1]-2.45)<1.05||Math.hypot(p[0]-sx,p[1]-1.5)<0.6) continue; if(cells.every(function(q2){ return Math.hypot(q2[0]-p[0],q2[1]-p[1])>0.55; })) cells.push(p); }
  cells.forEach(function(p){ ell(g,G.X(p[0]),G.Y(p[1]),0.27*G.sx,0.22*G.sy,0,on(2)?alpha(C.red,0.14):alpha(GREEN,0.12),ol(2),on(2)?2:1); dot(g,G.X(p[0]+0.08),G.Y(p[1]),2.5,GREEN); });
  for(var x3=0;x3<9-0.01;x3+=0.75){ if(x3+0.75>sx-0.45&&x3<sx+0.45) continue; WR(g,G,x3+0.02,0.7,x3+0.73,1.2,3,on(4)?alpha(C.red,0.12):'#fdfbf4',ol(4),on(4)?2:1); }
  ell(g,G.X(sx-0.22),G.Y(0.95),0.22*G.sx,0.3*G.sy,0,alpha(GREEN,0.6),ol(4),on(4)?2:1); ell(g,G.X(sx+0.22),G.Y(0.95),0.22*G.sx,0.3*G.sy,0,alpha(GREEN,0.6),ol(4),on(4)?2:1);
  if(on(4)) arrow(g,G.X(sx),G.Y(0.1),G.X(sx),G.Y(1.7),C.teal,2);
  g.save(); g.beginPath(); g.arc(G.X(vx),G.Y(2.45),0.9*G.sy,PI,TAU); g.closePath(); g.fillStyle=on(3)?alpha(C.red,0.35):alpha(C.blue,0.5); g.fill(); g.restore();
  g.save(); g.beginPath(); g.arc(G.X(vx),G.Y(2.45),0.9*G.sy,0,PI); g.closePath(); g.fillStyle=on(3)?alpha(C.red,0.2):alpha(ORANGE,0.6); g.fill(); g.restore();
  circle(g,G.X(vx),G.Y(2.45),0.9*G.sy,null,on(3)?C.red:C.ink,on(3)?2.5:1.2);
  T(g,'木質部',G.X(vx),G.Y(2.85),C.ink,fs-1,'center','700'); T(g,'韌皮部',G.X(vx),G.Y(2.05),C.ink,fs-1,'center','700');
  var lab=[[9.2,5.35,0],[9.2,4.25,1],[9.2,2.6,2],[9.2,3.4,3],[9.2,0.95,4]];
  lab.forEach(function(l){ T(g,LEAF[l[2]],G.X(l[0]),G.Y(l[1]),on(l[2])?C.red:C.ink,fs,'left',on(l[2])?'700':'500'); });
  L(g,G.X(vx+0.95),G.Y(2.6),G.X(9.1),G.Y(3.4),alpha(C.ink,0.4),1,[3,3]); }
widget('w-leaf',{state:{k:0},rw:0.5,rn:0.95,fmt:{k:function(v){return LEAF[v].replace(/（.*/,'');}},
  draw:function(g,c,s){ leafDraw(g,c,c.C,s.k); },
  out:function(s){ return ['上表皮：一層透明細胞，外有<b>角質層</b>防止水分散失','柵狀組織：細胞直立排列，<b>葉綠體最多</b>，光合作用主力','海綿組織：排列疏鬆、<b>空隙多</b>，利於氣體流通','葉脈：<b>木質部在上、韌皮部在下</b>，沒有形成層','下表皮：<b>氣孔</b>多在這裡，由一對保衛細胞控制開關'][s.k]; }
});
widget('s-F18',{state:{},steps:2,rw:0.5,rn:0.95,
  draw:function(g,c,s){ leafDraw(g,c,c.C,s.step?3:1); },
  out:steps(['葉肉分兩層：上面整齊的柵狀組織、下面疏鬆的海綿組織。葉脈就埋在葉肉中間。','葉脈的維管束：<b>木質部靠上表皮、韌皮部靠下表皮</b>，而且<b>沒有形成層</b>（葉子不會變厚）。'])
});
`
};
