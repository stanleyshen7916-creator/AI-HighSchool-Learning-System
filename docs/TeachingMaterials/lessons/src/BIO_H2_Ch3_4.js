/* lessons/src/BIO_H2_Ch3_4.js — 高二生物 第3章 植物體的物質吸收、合成與運輸＋4-1 植物的生殖（長榮版課本 p.76～134，tm_106、tm_107）.
   說明為改寫；圖為示意（光譜曲線為形狀示意，不是實測數據）。
   「老師說」用生活比喻＋①②③短句，每張圖只講一個重點（使用者要求的簡單寫法）。 */
"use strict";
module.exports = {
  lessonId: "BIO_H2_Ch3_4",
  title: "高二生物第3章～4-1・圖解教材",
  eyebrow: "生物 ・ 第3章 植物體的物質吸收、合成與運輸 ＋ 4-1 植物的生殖 ・ 高二上",
  h1: "植物怎麼喝水、吃光、送便當、生寶寶",
  h1small: "水往上拉、糖往需要的地方送、花裡完成雙重受精",
  subject: "BIO",
  unit: "BIO-H2-Ch3-4",
  sections: [
    {
      id: "3-1", short: "3-1", title: "3-1 水和礦物質的吸收與運輸",
      plan: { goal: "知道根怎麼吸水和礦物質、水怎麼一路往上走、氣孔怎麼開關。", prereq: "擴散、滲透作用、根莖葉的構造。", time: "約 4 節課。課本 p.78～89。" },
      cards: [
        {
          id: "F1", title: "根吸水：靠「裡面比外面濃」", page: "p.78～81", tags: ["src"],
          say: "① 植物需要約 17 種<b>必需元素</b>，例如 N、P、K（肥料三要素）、Mg（葉綠素的成分）。<br>② 根先用<b>主動運輸</b>把礦物質離子「搬」進來（要花能量）。<br>③ 裡面變濃了：<b>中柱 > 皮層 > 表皮 > 土壤</b>，水就自己滲透進來。<br>④ 肥料下太多，土壤比根還濃，水反而被吸出去，植物就枯萎。",
          formula: "滲透壓：中柱 > 皮層 > 表皮 > 土壤溶液 → 水往根裡走　｜　礦物質：主動運輸（少部分促進性擴散）",
          widget: { id: "w-root", aria: "改變土壤溶液濃度，看水往根內或根外移動", rw: 0.55, rn: 0.95,
            controls: [{ k: "soil", label: "土壤溶液濃度", min: 0, max: 10, step: 1 }] },
          space: "藍色深淺＝濃度。土壤比根毛淡時，水（箭頭）往根裡跑；把土壤濃度拉到比根毛濃，箭頭就反過來。",
          trap: "以為「肥料越多越好」。施肥過量會讓根吸不到水。",
          quiz: { q: "植物遇到過度施肥常會萎凋，主要原因是？", answer: "c", options: [
            { c: "a", text: "礦物質太多使光合作用太快", why: "跟光合作用無關，是水的方向出了問題。" },
            { c: "b", text: "肥料堵住了導管", why: "肥料溶在土壤水中，不會堵住導管。" },
            { c: "c", text: "土壤溶液滲透壓變高，根吸不到水" },
            { c: "d", text: "根毛數量變多", why: "根毛變多反而有利吸水。" }] },
          sol: { id: "s-F1", aria: "逐步圖解：施肥前後水的方向" }
        },
        {
          id: "F2", title: "兩條路進中柱，卡氏帶是「驗票口」", page: "p.82", tags: ["src"],
          say: "水從根毛走到中柱，有兩條路：<br>① <b>共質體路徑</b>：穿過一個個細胞的細胞質（靠原生質絲連通）。<br>② <b>質外體路徑</b>：走細胞壁和細胞間的縫隙。<br>③ 到了<b>內皮</b>，細胞壁上有<b>卡氏帶</b>擋住，走縫隙的水一定要「進細胞」才能過——像捷運的驗票口。<br>④ 好處：控制吸水速度、水不會倒流、擋住有毒物質和病原體。",
          formula: "共質體：細胞質 → 原生質絲 → 細胞質　｜　質外體：細胞壁、細胞間隙 → 內皮（卡氏帶）→ 進入細胞",
          widget: { id: "w-path", aria: "根的橫切面示意，水沿共質體與質外體兩條路徑走向中柱", rw: 0.45, rn: 0.8,
            controls: [{ k: "t", label: "時間", min: 0, max: 1, step: 0.02 }], play: { k: "t", dur: 5000 } },
          space: "藍點走細胞裡面（共質體），橘點走細胞壁（質外體）。按播放：橘點走到內皮（紅色卡氏帶）時被擋，只好轉進細胞裡。",
          trap: "以為質外體路徑可以一路走到中柱。到內皮一定會被卡氏帶擋住。",
          quiz: { q: "水經質外體路徑到達內皮時，為何必須進入細胞內？", answer: "b", options: [
            { c: "a", text: "內皮細胞沒有細胞壁", why: "內皮細胞有細胞壁，卡氏帶就在細胞壁上。" },
            { c: "b", text: "卡氏帶擋住水從細胞壁通過" },
            { c: "c", text: "中柱的滲透壓比皮層低", why: "中柱滲透壓最高，水才會往裡面走。" },
            { c: "d", text: "內皮會把水分解", why: "水分解是光反應的事。" }] },
          sol: { id: "s-F2", aria: "逐步圖解：橘色路徑在內皮轉彎" }
        },
        {
          id: "F3", title: "水往上走：蒸散在上面「拉」最用力", page: "p.82～87", tags: ["src"],
          say: "把樹想成一根很長的<b>吸管</b>：<br>① <b>蒸散作用</b>：葉子的水從氣孔蒸發，產生負壓，把整條水柱往上<b>拉</b>（最主要的力量）。<br>② 水分子會手牽手（<b>內聚力</b>），水柱才不會斷。<br>③ <b>根壓</b>：從下面<b>推</b>，力量小；清晨葉緣冒水珠（泌溢）就是它。<br>④ <b>毛細現象</b>：細管子裡水會自己爬一點，力量也小。<br>⑤ 木質部運輸：<b>只往上、不花能量</b>。",
          formula: "蒸散作用（拉，主要）＋ 根壓（推）＋ 毛細現象　｜　內聚力—張力理論　｜　超過 90% 的水會蒸散掉",
          widget: { id: "w-xylem", aria: "樹的木質部水柱，選擇三種力量中的一種看它作用的位置", rw: 0.6, rn: 1.0,
            controls: [{ k: "f", label: "看哪一種力", min: 0, max: 2, step: 1 }] },
          space: "選「蒸散」：葉子在上面拉；選「根壓」：根在下面推；選「毛細」：細管壁旁邊一點點往上爬。箭頭越粗，力量越大。",
          trap: "以為高大的樹是靠根壓把水推上去。根壓只能推幾公尺，主要靠蒸散的拉力。",
          quiz: { q: "下列哪種情況最容易看到葉緣冒出水珠（泌溢現象）？", answer: "a", options: [
            { c: "a", text: "潮溼的清晨，土壤水分多" },
            { c: "b", text: "炎熱乾燥的中午", why: "中午蒸散旺盛，水都被拉走蒸散了。" },
            { c: "c", text: "強風的午後", why: "有風會增加蒸散，不容易泌溢。" },
            { c: "d", text: "土壤乾旱時", why: "土壤缺水，根壓很小。" }] },
          sol: { id: "s-F3", aria: "逐步圖解：清晨根壓大、蒸散小" }
        },
        {
          id: "F4", title: "氣孔開關：保衛細胞「吸飽水」就打開", page: "p.88～89", tags: ["src"],
          say: "氣孔旁邊有兩個腰子形的<b>保衛細胞</b>：<br>① 內側的壁厚、外側的壁薄，吸水膨脹時會向外彎，中間的洞（氣孔）就打開。<br>② 白天照光：<b>K⁺ 進入</b>保衛細胞 → 變濃 → 吸水 → 氣孔<b>開</b>。<br>③ 晚上或缺水（植物產生 <b>ABA</b>）：K⁺ 跑出去 → 失水 → 氣孔<b>關</b>，省水。",
          formula: "照光、CO₂ 下降 → K⁺ 進入、醣類增加 → 滲透壓↑ → 吸水 → 膨壓↑ → 氣孔開　｜　缺水 → ABA → K⁺ 流出 → 氣孔關",
          widget: { id: "w-stoma", aria: "保衛細胞的鉀離子量改變時，氣孔開口大小的變化", rw: 0.55, rn: 0.95,
            controls: [{ k: "k", label: "保衛細胞內 K⁺ 的量", min: 0, max: 10, step: 1 }] },
          space: "拉高 K⁺：保衛細胞變胖、往外彎，中間的氣孔張大；拉低 K⁺：細胞變瘦，氣孔關起來。",
          trap: "以為保衛細胞是「縮起來」才把氣孔拉開。其實是吸水變胖才打開。",
          quiz: { q: "土壤缺水時，哪一種激素會讓氣孔關閉？", answer: "d", options: [
            { c: "a", text: "生長素", why: "生長素和向光性、細胞伸長有關。" },
            { c: "b", text: "吉貝素", why: "吉貝素和莖伸長、種子萌發有關。" },
            { c: "c", text: "細胞分裂素", why: "細胞分裂素促進細胞分裂。" },
            { c: "d", text: "離層酸（ABA）" }] },
          sol: { id: "s-F4", aria: "逐步圖解：ABA 讓 K⁺ 流出" }
        }
      ]
    },
    {
      id: "3-2", short: "3-2", title: "3-2 光合作用",
      plan: { goal: "知道光合色素吸收哪些光、光反應和固碳反應各做什麼。", prereq: "葉綠體的構造、ATP。", time: "約 5 節課。課本 p.90～111。" },
      cards: [
        {
          id: "F5", title: "葉子是綠色，因為「綠光沒被吃掉」", page: "p.92～93、104～107", tags: ["src"],
          say: "① 葉綠素 a、b 最愛<b>紅光</b>和<b>藍紫光</b>；類胡蘿蔔素吸收藍紫光。<br>② <b>綠光</b>幾乎沒被吸收，反射到我們眼睛，所以葉子看起來是綠的。<br>③ 英格曼用三稜鏡分光照水綿，好氧菌都擠在紅光、藍光那邊（那裡產氧最多）。<br>④ 實驗：用<b>丙酮</b>萃取色素（色素不溶於水），濾紙層析後由上而下是：胡蘿蔔素、葉黃素、葉綠素 a、葉綠素 b。",
          formula: "吸收光譜 ≈ 作用光譜（紅光、藍紫光）　｜　Rf ＝ 色素移動距離 ÷ 展開液移動距離",
          widget: { id: "w-spec", aria: "光合色素的吸收光譜示意，拖動波長看哪些色素吸收", rw: 0.55, rn: 0.95,
            controls: [{ k: "wl", label: "光的波長（nm）", min: 400, max: 700, step: 10 }] },
          space: "曲線越高＝吸收越多（形狀示意）。把波長拉到 550 nm（綠光），三條曲線都很低——這就是葉子綠色的原因。",
          trap: "以為葉子是綠色因為「最愛綠光」。剛好相反，是綠光吸收最少。",
          quiz: { q: "色素移動 3.6 cm、展開液移動 12 cm，該色素的 Rf 值是？", answer: "b", options: [
            { c: "a", text: "3.3", why: "要用色素距離除以展開液距離，不是倒過來。" },
            { c: "b", text: "0.3" },
            { c: "c", text: "0.36", why: "3.6 ÷ 12 = 0.3。" },
            { c: "d", text: "8.4", why: "不是相減。" }] },
          sol: { id: "s-F5", aria: "逐步圖解：Rf 值計算" }
        },
        {
          id: "F6", title: "光反應「充電」，固碳反應「做糖」", page: "p.91～99、108～111", tags: ["src"],
          say: "葉綠體像一間<b>工廠</b>：<br>① <b>光反應</b>（類囊體）：吸光、把<b>水分解</b>放出 O₂，充好兩顆「電池」：<b>ATP</b>、<b>NADPH</b>。<br>② 電子的路線：H₂O → P680 → … → P700 → … → NADP⁺。<br>③ <b>固碳反應</b>（基質，卡爾文循環）：用電池的能量把 <b>CO₂ 做成醣</b>。<br>④ 沒光 → 電池沒電 → 做糖也停了。所以「暗反應」這名字不準。<br>⑤ 希爾反應：照光時葉綠體讓藍色 DCPIP 變成<b>無色</b>，證明光反應有還原作用。",
          formula: "光反應：H₂O + NADP⁺ + ADP + Pi →（光）O₂ + NADPH + ATP　｜　固碳反應：CO₂ + ATP + NADPH → 醣類",
          widget: { id: "w-photo", aria: "照光強度改變時，光反應產物與固碳反應產糖的變化", rw: 0.6, rn: 1.0,
            controls: [{ k: "light", label: "光照強度", min: 0, max: 10, step: 1 }] },
          space: "左邊類囊體做 ATP、NADPH（黃色電池），交給右邊基質做糖。把光拉到 0：電池沒電，右邊的糖也不做了。",
          trap: "以為 O₂ 來自 CO₂。O₂ 來自水的分解（凡尼耳推論、同位素證實）。",
          quiz: { q: "光合作用釋放的 O₂ 來自哪種物質？", answer: "a", options: [
            { c: "a", text: "H₂O" },
            { c: "b", text: "CO₂", why: "CO₂ 的碳和氧進入醣類，O₂ 來自水。" },
            { c: "c", text: "醣類", why: "醣類是產物，不是 O₂ 的來源。" },
            { c: "d", text: "ATP", why: "ATP 是能量分子，不放出 O₂。" }] },
          sol: { id: "s-F6", aria: "逐步圖解：光反應與固碳反應的接力" }
        }
      ]
    },
    {
      id: "3-3", short: "3-3", title: "3-3 有機養分的運輸",
      plan: { goal: "會用壓力流假說說明糖怎麼從葉送到需要的地方。", prereq: "滲透作用、膨壓。", time: "約 2 節課。課本 p.100～103。" },
      cards: [
        {
          id: "F7", title: "壓力流：糖從「供給部」流向「匯集部」", page: "p.100～103", tags: ["src"],
          say: "把篩管想成一條<b>送便當的水管</b>：<br>① 葉子做的糖（<b>蔗糖</b>）裝進篩管 → 篩管變濃 → 旁邊導管的水滲進來 → 壓力變大（<b>供給部</b>）。<br>② 根、果實把糖卸下來用掉 → 變淡 → 水流出 → 壓力變小（<b>匯集部</b>）。<br>③ 汁液就從壓力大流到壓力小——方向看「誰供、誰需」，可上可下。<br>④ 裝糖、卸糖靠伴細胞（要耗能）；篩管裡的流動本身不耗能。",
          formula: "供給部：蔗糖裝載 → 滲透壓↑ → 吸水 → 膨壓↑　→（汁液流動）→　匯集部：蔗糖卸載 → 滲透壓↓ → 水流出 → 膨壓↓",
          widget: { id: "w-flow", aria: "葉部篩管裝載的蔗糖量改變時，汁液流向根部的速度", rw: 0.55, rn: 0.95,
            controls: [{ k: "sugar", label: "葉部裝進篩管的蔗糖", min: 0, max: 10, step: 1 }] },
          space: "左邊葉（供給部）、右邊根（匯集部）。蔗糖裝得越多，兩邊壓力差越大，汁液（橘點）流得越快；裝 0 就不流了。",
          trap: "以為養分一定往下送。開花結果時糖送往花和果實；春天的塊莖反而變成供給部往上送。",
          quiz: { q: "春天馬鈴薯塊莖發芽時，塊莖扮演什麼角色？", answer: "c", options: [
            { c: "a", text: "匯集部", why: "夏天它接收葉送來的糖時才是匯集部。" },
            { c: "b", text: "只運輸水", why: "塊莖儲存澱粉，春天會分解送出。" },
            { c: "c", text: "供給部（澱粉分解成蔗糖往上送）" },
            { c: "d", text: "兩者都不是", why: "同一器官會隨季節改變角色。" }] },
          sol: { id: "s-F7", aria: "逐步圖解：夏季與春季的塊莖" }
        }
      ]
    },
    {
      id: "4-1", short: "4-1", title: "4-1 植物的生殖",
      plan: { goal: "分清無性生殖與有性生殖；會說出世代交替、雙重受精、種子與果實的來源。", prereq: "減數分裂、有絲分裂。", time: "約 3 節課。課本 p.124～134。" },
      cards: [
        {
          id: "F8", title: "無性生殖：剪一段就能長成一棵", page: "p.124～126", tags: ["src"],
          say: "① 用根、莖、葉繁殖叫<b>營養繁殖</b>：番薯（塊根）、馬鈴薯（塊莖）、竹（根莖）、草莓（走莖）、落地生根（葉）。<br>② 農夫常用：<b>扦插</b>（剪枝插土，如非洲菫）、<b>嫁接</b>（把枝條接到別株有根的莖上，如火龍果）。<br>③ 植物細胞有<b>全潛能性</b>：一個細胞就能長成整株。<b>組織培養</b>：細胞 → 癒傷組織 → 完整植株。<br>④ 優點：寶寶和爸媽<b>幾乎一樣</b>，好品種不會走樣。",
          formula: "營養繁殖：塊根、塊莖、根莖、走莖、葉　｜　組織培養：組織 → 癒傷組織 → 分化 → 植株",
          widget: { id: "w-veg", aria: "選擇一種植物，看它用哪個營養器官繁殖", rw: 0.5, rn: 0.9,
            controls: [{ k: "p", label: "選一種植物", min: 0, max: 4, step: 1 }] },
          space: "拉動選項，看每種植物用的是根、莖還是葉。注意：馬鈴薯是「莖」，番薯才是「根」。",
          trap: "把馬鈴薯和番薯搞混：馬鈴薯是塊莖，番薯是塊根。",
          quiz: { q: "組織培養時，細胞先分裂形成一團還沒分化的細胞，叫做？", answer: "d", options: [
            { c: "a", text: "胚乳", why: "胚乳是種子裡儲存養分的部分。" },
            { c: "b", text: "胚囊", why: "胚囊是雌配子體。" },
            { c: "c", text: "形成層", why: "形成層是莖裡的分生組織。" },
            { c: "d", text: "癒傷組織" }] },
          sol: { id: "s-F8", aria: "逐步圖解：組織培養三步驟" }
        },
        {
          id: "F9", title: "雙重受精：一個做寶寶，一個做便當", page: "p.127～131", tags: ["src"],
          say: "① <b>世代交替</b>：孢子體（2n，我們看到的植物）⇄ 配子體（n，藏在花裡）。<br>② 花粉管裡有 <b>2 個精細胞</b>；胚囊裡有<b>卵</b>和含 2 個極核的<b>中央細胞</b>。<br>③ 精細胞 1 ＋ 卵 → <b>合子（2n）</b> → 胚（寶寶）。<br>④ 精細胞 2 ＋ 中央細胞（n＋n）→ <b>胚乳（3n）</b>（寶寶的便當）。<br>⑤ 兩個精細胞都用上了，所以叫<b>雙重受精</b>，是被子植物獨有的。",
          formula: "精（n）＋ 卵（n）→ 合子（2n）→ 胚　｜　精（n）＋ 中央細胞（n＋n）→ 胚乳母細胞（3n）→ 胚乳",
          widget: { id: "w-cycle", aria: "被子植物生活史的步驟，標示每一步的染色體套數", rw: 0.6, rn: 1.0,
            controls: [{ k: "s", label: "第幾步", min: 0, max: 5, step: 1 }], play: { k: "s", dur: 6000 } },
          space: "按播放，一步一步走完生活史。藍色＝2n（孢子體世代），橘色＝n（配子體世代），紫色＝3n（胚乳）。",
          trap: "中央細胞寫成 2n。它是兩個獨立的單倍體極核，寫 n＋n，加上精細胞才是 3n。",
          quiz: { q: "雙重受精中，精細胞與中央細胞結合，形成的胚乳母細胞是幾倍體？", answer: "b", options: [
            { c: "a", text: "2n", why: "2n 是合子（精＋卵）。" },
            { c: "b", text: "3n" },
            { c: "c", text: "n", why: "n 是單一配子。" },
            { c: "d", text: "4n", why: "中央細胞 n＋n，加上精細胞 n，共 3n。" }] },
          sol: { id: "s-F9", aria: "逐步圖解：兩個精細胞各自的去處" }
        },
        {
          id: "F10", title: "子房變果實、胚珠變種子", page: "p.128～134", tags: ["src"],
          say: "① 受精後：<b>子房 → 果實</b>、<b>胚珠 → 種子</b>、珠被 → 種皮。<br>② 種子裡：<b>胚</b>（胚芽、胚軸、胚根、子葉）會長成新植物；<b>胚乳、子葉</b>存養分。<br>③ 玉米（單子葉）：1 片子葉、胚乳很大。菜豆（雙子葉）：2 片子葉、胚乳退化，養分存在子葉。<br>④ 葵瓜子、米粒其實是<b>果實</b>；西瓜子、南瓜子才是種子。<br>⑤ 種子搭便車：風（蒲公英）、水（椰子）、黏動物（大花咸豐草）、被吃（奇異果）、自己彈（鳳仙花）。",
          formula: "子房 → 果實　｜　胚珠 → 種子　｜　珠被 → 種皮　｜　合子 → 胚　｜　胚乳母細胞 → 胚乳",
          widget: { id: "w-seed", aria: "切換單子葉（玉米）與雙子葉（菜豆）種子的構造示意", rw: 0.55, rn: 0.95,
            controls: [{ k: "m", label: "種子", min: 0, max: 1, step: 1 }] },
          space: "切換看看：玉米的黃色胚乳占了大半；菜豆幾乎沒有胚乳，兩片綠色子葉又大又厚。",
          trap: "以為葵瓜子是種子。殼是乾掉的果皮，所以整顆葵瓜子是果實。",
          quiz: { q: "受精完成後，胚珠會發育成什麼？", answer: "a", options: [
            { c: "a", text: "種子" },
            { c: "b", text: "果實", why: "子房才發育成果實。" },
            { c: "c", text: "胚乳", why: "胚乳由胚乳母細胞發育而來，在種子裡面。" },
            { c: "d", text: "花萼", why: "花萼不參與受精。" }] },
          sol: { id: "s-F10", aria: "逐步圖解：花的各部分變成什麼" }
        }
      ]
    }
  ],
  footer: [
    "課本：長榮版高二生物 第3章 植物體的物質吸收、合成與運輸（p.76～121）、第4章 4-1 植物的生殖（p.122～134），說明為改寫。",
    "圖為示意；光譜曲線只表示形狀（紅光、藍紫光吸收多，綠光吸收少），不是實測數值。"
  ],
  script: String.raw`
var ORANGE='#e08a2c', GREEN='#3f8f4a', PURPLE='#7d5ba6', YELLOW='#d4a017';
function arrow(g,x1,y1,x2,y2,c,w){ var a=Math.atan2(y2-y1,x2-x1), h=6+(w||2)*2; if(Math.hypot(x2-x1,y2-y1)<2) return; L(g,x1,y1,x2-Math.cos(a)*h*0.6,y2-Math.sin(a)*h*0.6,c,w||2); g.save(); g.fillStyle=c; g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-h*Math.cos(a-0.4),y2-h*Math.sin(a-0.4)); g.lineTo(x2-h*Math.cos(a+0.4),y2-h*Math.sin(a+0.4)); g.closePath(); g.fill(); g.restore(); }
function V(g,G,x1,y1,x2,y2,c,w){ arrow(g,G.X(x1),G.Y(y1),G.X(x2),G.Y(y2),c,w); }
function rbox(g,G,x,y,w,h,fill,stroke,lab,fs,col){ box(g,G.X(x),G.Y(y+h),w*G.sx,h*G.sx,fill,stroke,1.5); if(lab) T(g,lab,G.X(x+w/2),G.Y(y+h/2),col||'#333',fs,'center','700'); }
function shade(C,v){ return alpha(C.blue,0.08+0.07*v); }

/* F1 根吸水 */
var ROOT=[['土壤',0],['表皮',4],['皮層',6],['中柱',8]];
function rootDraw(g,c,C,soil){ var G=frame(full(c),0,20,-2,9,18,true), fs=c.narrow?11:13; var vals=[soil,4,6,8];
  for(var i=0;i<4;i++){ rbox(g,G,i*5,1,5,5,shade(C,vals[i]),C.blue,ROOT[i][0],fs,C.ink); T(g,'濃度 '+vals[i],G.X(i*5+2.5),G.Y(1.6),C.muted,fs-1,'center','700'); }
  var into=soil<4; if(soil!==4){ for(var k=0;k<3;k++){ var y=7.2+k*0.6; if(into) V(g,G,1,y,6.5,y,C.blue,2.5); else V(g,G,6.5,y,1,y,C.red,2.5); } }
  T(g,soil<4?'水往根裡走（滲透作用）':soil===4?'土壤和表皮一樣濃：水不進不出':'土壤比根還濃：水被吸出去 → 萎凋',G.X(0),G.Y(-1),soil<4?C.blue:C.red,fs+1,'left','700'); }
widget('w-root',{state:{soil:1},rw:0.55,rn:0.95,fmt:{soil:function(v){ return String(v); }},
  draw:function(g,c,s){ rootDraw(g,c,c.C,s.soil); },
  out:function(s){ return s.soil<4?'土壤濃度 '+s.soil+' < 表皮 4：滲透壓 中柱 > 皮層 > 表皮 > 土壤，水<b>進入</b>根部':s.soil===4?'兩邊一樣濃，水的淨移動為 0':'土壤濃度 '+s.soil+' > 表皮 4（像施肥過量）：水<b>離開</b>根部，植物萎凋'; }
});
widget('s-F1',{state:{},steps:2,rw:0.55,rn:0.95,
  draw:function(g,c,s){ rootDraw(g,c,c.C,s.step?9:1); },
  out:steps(['施肥前：土壤比根毛淡，水自然滲進根裡。','施肥過量：土壤比根毛還濃，水反而被「吸」出去 → 植物缺水萎凋。'])
});

/* F2 共質體／質外體 */
function pathDraw(g,c,C,t){ var G=frame(full(c),0,24,-1,10,16,true), fs=c.narrow?10:12; var names=['表皮','皮層','皮層','內皮','中柱'];
  for(var i=0;i<5;i++){ for(var r=0;r<2;r++){ rbox(g,G,i*4.4+0.6,1+r*4,3.6,3.4,i===4?alpha(GREEN,0.18):alpha(C.blue,0.08),alpha(C.ink,0.4),'',fs); } T(g,names[i],G.X(i*4.4+2.4),G.Y(9.4),C.muted,fs,'center','700'); }
  box(g,G.X(13.2),G.Y(8.8),0.5*G.sx,8.4*G.sx,alpha(C.red,0.85),null); T(g,'卡氏帶',G.X(13.45),G.Y(-0.4),C.red,fs,'center','700');
  var x=t*21; dot(g,G.X(0.6+x),G.Y(6.7),6,C.blue);
  var ax=0.4+x, ay=3.0; if(ax>13.0&&t<0.7){ ax=13.0; } if(t>=0.7){ ax=Math.min(22,13.6+(t-0.7)*28); ay=2.7; }
  dot(g,G.X(ax),G.Y(ay>3?ay:4.7),6,ORANGE);
  T(g,'藍：共質體（走細胞裡）',G.X(0.4),G.Y(-0.4),C.blue,fs,'left','700'); T(g,'橘：質外體（走細胞壁）',G.X(17),G.Y(-0.4),ORANGE,fs,'left','700'); }
widget('w-path',{state:{t:0.4},rw:0.45,rn:0.8,fmt:{t:function(v){ return Math.round(v*100)+'%'; }},
  draw:function(g,c,s){ pathDraw(g,c,c.C,s.t); },
  out:function(s){ return s.t<0.58?'兩條路一起往中柱前進':s.t<0.7?'橘點走到內皮，被<b>卡氏帶</b>擋住了':'橘點改從內皮細胞「進細胞」後才進入中柱'; }
});
widget('s-F2',{state:{},steps:2,rw:0.45,rn:0.8,
  draw:function(g,c,s){ pathDraw(g,c,c.C,s.step?0.9:0.62); },
  out:steps(['質外體路徑走細胞壁，到了內皮碰上卡氏帶（紅色），過不去。','只能經水通道蛋白進入內皮細胞的細胞質，再進中柱 → 這就是「驗票口」。'])
});

/* F3 三種力 */
function xyDraw(g,c,C,f){ var G=frame(full(c),-6,6,-1,13,18,true), fs=c.narrow?11:13;
  box(g,G.X(-0.6),G.Y(11),1.2*G.sx,10*G.sx,alpha(C.blue,0.25),C.blue,1.5);
  g.save(); g.fillStyle=alpha(GREEN,0.35); g.beginPath(); g.ellipse(G.X(0),G.Y(11.5),3.5*G.sx,1.3*G.sx,0,0,TAU); g.fill(); g.restore();
  L(g,G.X(0),G.Y(1),G.X(-2.5),G.Y(-0.5),C.ink,2); L(g,G.X(0),G.Y(1),G.X(2.5),G.Y(-0.5),C.ink,2);
  var W=[f===0?7:2,f===1?6:2,f===2?6:2];
  if(f===0){ V(g,G,0,10,0,12.6,C.red,W[0]); T(g,'蒸散：從葉子往上「拉」',G.X(1),G.Y(12.6),C.red,fs+1,'left','700'); }
  if(f===1){ V(g,G,0,0,0,3.5,ORANGE,W[1]); T(g,'根壓：從根往上「推」',G.X(1),G.Y(2.5),ORANGE,fs+1,'left','700'); }
  if(f===2){ for(var y=3;y<10;y+=2.2){ V(g,G,-0.45,y,-0.45,y+1.2,PURPLE,2.5); } T(g,'毛細：沿管壁慢慢爬',G.X(1),G.Y(6),PURPLE,fs+1,'left','700'); }
  T(g,'葉（氣孔）',G.X(-5.6),G.Y(11.6),GREEN,fs,'left','700'); T(g,'木質部水柱',G.X(-5.6),G.Y(6),C.blue,fs,'left','700'); T(g,'根',G.X(-5.6),G.Y(0.2),C.muted,fs,'left','700'); }
widget('w-xylem',{state:{f:0},rw:0.6,rn:1.0,fmt:{f:function(v){ return ['蒸散作用','根壓','毛細現象'][v]; }},
  draw:function(g,c,s){ xyDraw(g,c,c.C,s.f); },
  out:function(s){ return ['<b>蒸散作用</b>：主要動力。葉子散失水產生負壓（張力），靠水分子間的內聚力把整條水柱往上拉。','<b>根壓</b>：卡氏帶擋住水外流，把水往上推，只能推幾公尺；切口滲水、清晨泌溢和它有關。','<b>毛細現象</b>：細管中水與管壁的附著力加上表面張力，力量很小。'][s.f]; }
});
widget('s-F3',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ xyDraw(g,c,c.C,s.step?1:0); },
  out:steps(['清晨溼度高、氣孔關閉：蒸散的「拉力」很弱。','土壤水多 → 根壓的「推力」變大，多的水從葉緣水孔冒出 → <b>泌溢現象</b>。'])
});

/* F4 氣孔 */
function stDraw(g,c,C,k){ var G=frame(full(c),-6,6,-5,5,18,true), fs=c.narrow?11:13, open=k/10, bulge=1.2+open*1.3;
  function cell(sx){ g.save(); g.fillStyle=alpha(GREEN,0.35); g.strokeStyle=GREEN; g.lineWidth=2; g.beginPath(); var n=30;
    for(var i=0;i<=n;i++){ var a=-PI/2+PI*i/n, y=3.6*Math.sin(a), x=sx*(0.3+open*0.9+ bulge*Math.cos(a)); if(i) g.lineTo(G.X(x),G.Y(y)); else g.moveTo(G.X(x),G.Y(y)); }
    for(var j=n;j>=0;j--){ var b=-PI/2+PI*j/n, y2=3.6*Math.sin(b), x2=sx*(0.3+open*0.9*Math.cos(b)*Math.cos(b)); g.lineTo(G.X(x2),G.Y(y2)); }
    g.closePath(); g.fill(); g.stroke(); g.restore(); }
  cell(1); cell(-1);
  g.save(); g.fillStyle=alpha(C.ink,0.75); g.beginPath(); g.ellipse(G.X(0),G.Y(0),Math.max(0.5,open*0.9*G.sx),3.2*G.sx*Math.max(0.15,open),0,0,TAU); g.fill(); g.restore();
  T(g,open>0.3?'氣孔打開':'氣孔關閉',G.X(0),G.Y(-4.4),open>0.3?GREEN:C.red,fs+1,'center','700'); T(g,'保衛細胞',G.X(4.8),G.Y(3.8),GREEN,fs,'center','700'); }
widget('w-stoma',{state:{k:7},rw:0.55,rn:0.95,fmt:{k:function(v){ return String(v); }},
  draw:function(g,c,s){ stDraw(g,c,c.C,s.k); },
  out:function(s){ return s.k>3?'K⁺ 多 → 保衛細胞滲透壓高 → 吸水膨脹 → 往外彎，<b>氣孔打開</b>（白天照光）':'K⁺ 少 → 失水變瘦 → <b>氣孔關閉</b>（夜晚，或缺水時 ABA 讓 K⁺ 流出）'; }
});
widget('s-F4',{state:{},steps:2,rw:0.55,rn:0.95,
  draw:function(g,c,s){ stDraw(g,c,c.C,s.step?1:8); },
  out:steps(['土壤缺水時，葉部產生 ABA（離層酸）。','ABA 讓 K⁺ 離開保衛細胞 → 失水 → 氣孔關閉，減少水分散失。'])
});

/* F5 光譜（形狀示意） */
function bell(x,m,s){ return Math.exp(-(x-m)*(x-m)/(2*s*s)); }
function chlA(x){ return 0.95*bell(x,430,18)+0.75*bell(x,662,14); }
function chlB(x){ return 0.9*bell(x,455,16)+0.5*bell(x,642,13); }
function car(x){ return 0.8*bell(x,450,22)+0.7*bell(x,480,15); }
function wlColor(w){ return w<450?'#6a4fd1':w<495?'#2f6fdb':w<570?'#3fa34d':w<590?'#d8c22a':w<620?'#e08a2c':'#d23b3b'; }
function specDraw(g,c,C,wl){ var G=frame(full(c),390,710,-0.15,1.15,24,false), fs=c.narrow?11:13;
  for(var w=400;w<700;w+=5){ box(g,G.X(w),G.Y(-0.02),5*G.sx+1,0.1*G.sy,wlColor(w),null); }
  L(g,G.X(395),G.Y(0.1),G.X(705),G.Y(0.1),C.ink,1.5);
  plot(g,G,function(x){ return 0.1+chlA(x); },400,700,GREEN,2.5); plot(g,G,function(x){ return 0.1+chlB(x); },400,700,'#7cbf5a',2.5); plot(g,G,function(x){ return 0.1+car(x); },400,700,ORANGE,2.5);
  L(g,G.X(wl),G.Y(0.05),G.X(wl),G.Y(1.1),alpha(C.ink,0.6),1.5,[4,4]);
  T(g,'葉綠素 a',G.X(600),G.Y(1.05),GREEN,fs,'left','700'); T(g,'葉綠素 b',G.X(600),G.Y(0.95),'#7cbf5a',fs,'left','700'); T(g,'類胡蘿蔔素',G.X(600),G.Y(0.85),ORANGE,fs,'left','700');
  T(g,'吸收多 ↑（示意）',G.X(392),G.Y(1.12),C.muted,fs-1,'left','700'); }
widget('w-spec',{state:{wl:550},rw:0.55,rn:0.95,fmt:{wl:function(v){ return v+' nm'; }},
  draw:function(g,c,s){ specDraw(g,c,c.C,s.wl); },
  out:function(s){ var a=Math.max(chlA(s.wl),chlB(s.wl),car(s.wl)); return s.wl+' nm（'+(s.wl<450?'藍紫光':s.wl<495?'藍光':s.wl<570?'綠光':s.wl<620?'黃橙光':'紅光')+'）：'+(a>0.4?'<b>吸收多</b>，光合作用利用得好':'<b>吸收少</b>'+(s.wl>=495&&s.wl<570?'，反射出來 → 葉子看起來是綠色':'')); }
});
widget('s-F5',{state:{},steps:2,rw:0.55,rn:0.95,
  draw:function(g,c,s){ var G=frame(full(c),-1,9,-1,14,20,true), C=c.C, fs=c.narrow?11:13; box(g,G.X(3),G.Y(13),2*G.sx,13*G.sx,alpha(C.ink,0.06),C.ink,1.5); L(g,G.X(2.5),G.Y(12),G.X(5.5),G.Y(12),C.blue,2,[4,4]); T(g,'展開液 12 cm',G.X(5.8),G.Y(12),C.blue,fs,'left','700'); dot(g,G.X(4),G.Y(0),5,C.ink); dot(g,G.X(4),G.Y(3.6),7,GREEN); T(g,'色素 3.6 cm',G.X(5.8),G.Y(3.6),GREEN,fs,'left','700'); if(s.step) T(g,'Rf = 3.6 ÷ 12 = 0.3',G.X(-0.8),G.Y(8),C.red,fs+2,'left','700'); },
  out:steps(['從原點量起：色素走了 3.6 cm，展開液走了 12 cm。','Rf ＝ 色素距離 ÷ 展開液距離 ＝ 3.6 ÷ 12 ＝ <b>0.3</b>（一定小於 1）。'])
});

/* F6 光反應／固碳反應 */
function phDraw(g,c,C,light){ var G=frame(full(c),0,24,-2,11,18,true), fs=c.narrow?11:13, e=light/10;
  rbox(g,G,0.5,1,9,8,alpha(GREEN,0.18),GREEN,'',fs); T(g,'類囊體：光反應',G.X(5),G.Y(9.8),GREEN,fs+1,'center','700');
  rbox(g,G,14,1,9.5,8,alpha(C.blue,0.08),C.blue,'',fs); T(g,'基質：固碳反應',G.X(18.75),G.Y(9.8),C.blue,fs+1,'center','700');
  for(var i=0;i<Math.round(light/2);i++) V(g,G,1+i*1.6,12,2+i*1.6,8.5,YELLOW,2.5);
  T(g,'H₂O → O₂',G.X(5),G.Y(2),C.muted,fs,'center','700'); if(e>0) T(g,'放出 O₂',G.X(5),G.Y(0),C.red,fs,'center','700');
  var nb=Math.round(e*4); for(var b=0;b<nb;b++){ rbox(g,G,10.2,2+b*1.6,3,1.2,alpha(YELLOW,0.8),YELLOW,b%2?'NADPH':'ATP',fs-2,C.ink); }
  if(e>0) V(g,G,9.6,5,13.8,5,YELLOW,3);
  T(g,'CO₂ →',G.X(15),G.Y(6),C.ink,fs,'left','700'); var ns=Math.round(e*5); for(var s=0;s<ns;s++) dot(g,G.X(16+s*1.4),G.Y(3.5),7,ORANGE);
  T(g,ns?'做出醣類（橘點）':'沒電池 → 停工',G.X(18.75),G.Y(2),ns?ORANGE:C.red,fs,'center','700'); }
widget('w-photo',{state:{light:7},rw:0.6,rn:1.0,fmt:{light:function(v){ return String(v); }},
  draw:function(g,c,s){ phDraw(g,c,c.C,s.light); },
  out:function(s){ return s.light?'光反應把光能存進 ATP、NADPH（電池），交給卡爾文循環把 CO₂ 做成醣':'沒有光：光反應停止，沒有 ATP、NADPH，固碳反應也跟著停'; }
});
widget('s-F6',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ phDraw(g,c,c.C,s.step?8:2); },
  out:steps(['光反應：水被分解，<b>O₂ 來自 H₂O</b>（不是 CO₂），電子一路傳給 NADP⁺。','固碳反應：CO₂ 的碳原子被接到五碳醣上，用 ATP、NADPH 做成醣。'])
});

/* F7 壓力流 */
function flDraw(g,c,C,sug){ var G=frame(full(c),0,24,-2,10,18,true), fs=c.narrow?11:13;
  rbox(g,G,0,2,6,6,alpha(GREEN,0.25),GREEN,'葉（供給部）',fs,C.ink); rbox(g,G,18,2,6,6,alpha(ORANGE,0.2),ORANGE,'根（匯集部）',fs,C.ink);
  box(g,G.X(6),G.Y(6),12*G.sx,1.5*G.sx,alpha(ORANGE,0.12),ORANGE,1.5); T(g,'篩管（韌皮部）',G.X(12),G.Y(7),ORANGE,fs,'center','700');
  box(g,G.X(6),G.Y(3.5),12*G.sx,1.5*G.sx,alpha(C.blue,0.12),C.blue,1.5); T(g,'導管（木質部）',G.X(12),G.Y(1.4),C.blue,fs,'center','700');
  var n=Math.round(sug*0.8); for(var i=0;i<n;i++) dot(g,G.X(6.8+i*1.4),G.Y(5.25),5,ORANGE);
  if(sug>0){ V(g,G,8,5.25,16,5.25,C.red,1.5+sug*0.35); V(g,G,17,2.75,7,2.75,C.blue,2); }
  T(g,'膨壓 '+(sug>0?'高':'—'),G.X(3),G.Y(-0.5),GREEN,fs,'center','700'); T(g,'膨壓 '+(sug>0?'低':'—'),G.X(21),G.Y(-0.5),ORANGE,fs,'center','700'); }
widget('w-flow',{state:{sugar:6},rw:0.55,rn:0.95,fmt:{sugar:function(v){ return String(v); }},
  draw:function(g,c,s){ flDraw(g,c,c.C,s.sugar); },
  out:function(s){ return s.sugar?'裝進 '+s.sugar+' 份蔗糖 → 葉端篩管滲透壓、膨壓升高 → 汁液被<b>推</b>向根（壓力差越大流越快）；水由導管回流':'沒有裝糖：兩端沒有壓力差，篩管汁液不流動'; }
});
widget('s-F7',{state:{},steps:2,rw:0.55,rn:0.95,
  draw:function(g,c,s){ var G=frame(full(c),0,24,-1,10,18,true), C=c.C, fs=c.narrow?11:13; rbox(g,G,8,0.5,8,4,alpha(C.ink,0.08),C.ink,'塊莖',fs,C.ink); rbox(g,G,8,6,8,3,alpha(GREEN,0.25),GREEN,s.step?'芽（匯集部）':'葉（供給部）',fs,C.ink);
    if(s.step) V(g,G,12,4.7,12,5.9,ORANGE,4); else V(g,G,12,5.9,12,4.7,ORANGE,4); T(g,s.step?'春季：塊莖是供給部':'夏季：塊莖是匯集部',G.X(12),G.Y(-0.6),ORANGE,fs+1,'center','700'); },
  out:steps(['夏季：葉行光合作用，蔗糖往下送，塊莖把它存成澱粉 → 塊莖是<b>匯集部</b>。','春季：塊莖的澱粉分解成蔗糖，往上送到生長中的芽 → 塊莖變成<b>供給部</b>。'])
});

/* F8 營養繁殖 */
var VEG=[['番薯','塊根','根'],['馬鈴薯','塊莖','莖'],['竹','根莖','莖'],['草莓','走莖','莖'],['落地生根','葉','葉']];
function vgDraw(g,c,C,p){ var G=frame(full(c),0,20,-1,10,18,true), fs=c.narrow?11:13, v=VEG[p], col=v[2]==='根'?ORANGE:v[2]==='莖'?C.blue:GREEN;
  L(g,G.X(0),G.Y(4),G.X(20),G.Y(4),alpha(C.ink,0.5),2); box(g,G.X(0),G.Y(4),20*G.sx,5*G.sx,alpha('#8a6d3b',0.12),null);
  ['根','莖','葉'].forEach(function(o,i){ rbox(g,G,1+i*6.4,6,5.4,2.6,o===v[2]?alpha(col,0.35):alpha(C.ink,0.05),o===v[2]?col:alpha(C.ink,0.3),o,fs+1,C.ink); });
  T(g,v[0]+'：用「'+v[1]+'」繁殖',G.X(10),G.Y(1.5),col,fs+3,'center','700'); }
widget('w-veg',{state:{p:1},rw:0.5,rn:0.9,fmt:{p:function(v){ return VEG[v][0]; }},
  draw:function(g,c,s){ vgDraw(g,c,c.C,s.p); },
  out:function(s){ var v=VEG[s.p]; return v[0]+'的'+v[1]+'屬於<b>'+v[2]+'</b>，種下去就能長出新植株（子代和親代幾乎一樣）'; }
});
widget('s-F8',{state:{},steps:3,rw:0.5,rn:0.9,
  draw:function(g,c,s){ var G=frame(full(c),0,20,-1,8,18,true), C=c.C, fs=c.narrow?11:13, labs=['① 取一小塊組織','② 長成癒傷組織','③ 分化成完整植株'];
    for(var i=0;i<=s.step;i++){ rbox(g,G,i*7,2,5.5,4,alpha(GREEN,0.12+0.12*i),GREEN,labs[i],fs-1,C.ink); if(i) V(g,G,i*7-1.3,4,i*7-0.1,4,C.ink,2); } },
  out:steps(['取植物的一小塊組織，滅菌後放在含養分與激素的培養基上（全程無菌）。','細胞先分裂成一團還沒分化的細胞：<b>癒傷組織</b>。','調整激素的濃度比率，癒傷組織分化出根、莖、葉，長成完整植株（植物細胞有全潛能性）。'])
});

/* F9 生活史 */
var CY=[['孢子體（我們看到的植物）','2n'],['減數分裂 → 大、小孢子','n'],['配子體：花粉管（2 精細胞）、胚囊（卵＋中央細胞）','n'],['精＋卵 → 合子','2n'],['精＋中央細胞 → 胚乳母細胞','3n'],['胚＋胚乳 → 種子 → 新的孢子體','2n']];
function cyDraw(g,c,C,st){ var G=frame(full(c),-7,7,-7,7,16,true), fs=c.narrow?10:12;
  for(var i=0;i<6;i++){ var a=PI/2-i*PI/3, x=4.6*Math.cos(a), y=4.6*Math.sin(a), pl=CY[i][1], col=pl==='2n'?C.blue:pl==='n'?ORANGE:PURPLE, on=i===st;
    dot(g,G.X(x),G.Y(y),on?22:15,alpha(col,on?0.9:0.3)); T(g,pl,G.X(x),G.Y(y),on?C.sheet:col,fs+1,'center','700');
    var a2=PI/2-(i+1)*PI/3; V(g,G,4.6*Math.cos(a-0.35),4.6*Math.sin(a-0.35),4.6*Math.cos(a2+0.35),4.6*Math.sin(a2+0.35),alpha(C.ink,0.3),1.5); }
  T(g,'第 '+(st+1)+' 步',G.X(0),G.Y(0.6),C.ink,fs+3,'center','700'); }
widget('w-cycle',{state:{s:0},rw:0.6,rn:1.0,fmt:{s:function(v){ return '第 '+(v+1)+' 步'; }},
  draw:function(g,c,s){ cyDraw(g,c,c.C,s.s); },
  out:function(s){ var v=CY[s.s]; return '<b>'+v[0]+'</b>（'+v[1]+'）'+(s.s===4?'：中央細胞有兩個極核（n＋n），加上精細胞（n）＝ 3n':''); }
});
widget('s-F9',{state:{},steps:2,rw:0.6,rn:1.0,
  draw:function(g,c,s){ cyDraw(g,c,c.C,s.step?4:3); },
  out:steps(['精細胞 1（n）＋ 卵（n）→ 合子（2n）→ 發育成胚。','精細胞 2（n）＋ 中央細胞（n＋n）→ 胚乳母細胞（<b>3n</b>）→ 發育成胚乳。'])
});

/* F10 種子 */
function sdDraw(g,c,C,m){ var G=frame(full(c),-8,8,-6,6,18,true), fs=c.narrow?11:13;
  g.save(); g.strokeStyle=C.ink; g.lineWidth=2.5; g.beginPath(); g.ellipse(G.X(0),G.Y(0),6*G.sx,4.5*G.sx,0,0,TAU); g.stroke(); g.restore();
  if(m===0){ g.save(); g.fillStyle=alpha(YELLOW,0.55); g.beginPath(); g.ellipse(G.X(1.2),G.Y(0),4.6*G.sx,4*G.sx,0,0,TAU); g.fill(); g.restore(); T(g,'胚乳（很大）',G.X(2),G.Y(0.5),C.ink,fs,'center','700');
    g.save(); g.fillStyle=alpha(GREEN,0.5); g.beginPath(); g.ellipse(G.X(-4),G.Y(0),1.3*G.sx,3*G.sx,0,0,TAU); g.fill(); g.restore(); T(g,'子葉 1 片',G.X(-4),G.Y(-5.2),GREEN,fs,'center','700'); T(g,'胚',G.X(-4),G.Y(0),C.ink,fs,'center','700');
    T(g,'玉米（單子葉）',G.X(0),G.Y(5.4),C.ink,fs+2,'center','700'); }
  else { [-1,1].forEach(function(sx){ g.save(); g.fillStyle=alpha(GREEN,0.45); g.beginPath(); g.ellipse(G.X(sx*2.7),G.Y(0),2.6*G.sx,4*G.sx,0,0,TAU); g.fill(); g.restore(); });
    T(g,'子葉',G.X(-2.7),G.Y(0),C.ink,fs,'center','700'); T(g,'子葉',G.X(2.7),G.Y(0),C.ink,fs,'center','700'); dot(g,G.X(0),G.Y(3.6),6,C.red); T(g,'胚芽、胚根',G.X(0),G.Y(-5.2),C.red,fs,'center','700');
    T(g,'菜豆（雙子葉）：胚乳退化',G.X(0),G.Y(5.4),C.ink,fs+2,'center','700'); } }
widget('w-seed',{state:{m:0},rw:0.55,rn:0.95,fmt:{m:function(v){ return v?'菜豆':'玉米'; }},
  draw:function(g,c,s){ sdDraw(g,c,c.C,s.m); },
  out:function(s){ return s.m?'菜豆：兩片子葉，胚乳在成熟時退化，養分存在肥大的子葉裡（非胚乳型種子）':'玉米：一片子葉，胚乳發達，養分大多存在胚乳（胚乳型種子）；其實每顆玉米粒都是一個果實'; }
});
widget('s-F10',{state:{},steps:2,rw:0.55,rn:0.95,
  draw:function(g,c,s){ var G=frame(full(c),0,20,-1,9,18,true), C=c.C, fs=c.narrow?11:13, pairs=s.step?[['胚珠','種子'],['珠被','種皮']]:[['子房','果實'],['花萼','（凋落）']];
    pairs.forEach(function(p,i){ rbox(g,G,1,5-i*4,6,2.4,alpha(PURPLE,0.15),PURPLE,p[0],fs+1,C.ink); V(g,G,7.4,6.2-i*4,11.6,6.2-i*4,C.ink,2.5); rbox(g,G,12,5-i*4,7,2.4,alpha(GREEN,0.18),GREEN,p[1],fs+1,C.ink); }); },
  out:steps(['受精後：<b>子房 → 果實</b>（保護種子、幫忙傳播）。','<b>胚珠 → 種子</b>，胚珠外圍的珠被 → 種皮。所以答案是「種子」。'])
});
`
};
