/* lessons/src/CHE_H2_Ch1_Stoichiometry.js — 高二化學 第1章 物質的特性、化學計量與反應熱（tm_12／tm_13／tm_26）.
   內容依教材包 tm_12（講義：1-1 化學反應式的平衡及應用、1-2 化學反應中的能量變化、實驗活動1）與
   tm_13（課本第9～52頁：物質特性與鑑定、化學計量、反應熱）的 summary.json；答案已驗算。 */
"use strict";
module.exports = {
  lessonId: "CHE_H2_Ch1_Stoichiometry",
  title: "化學計量與反應熱圖解教材",
  eyebrow: "化學 ・ 第 1 章 ・ 高二上",
  h1: "化學計量與反應熱",
  h1small: "用粒子和能量圖看懂化學反應",
  subject: "CHE",
  unit: "CHE-H2-CH1",
  sections: [
    {
      id: "1-0", short: "物質特性與鑑定", title: "物質的特性與鑑定",
      plan: { goal: "會用加熱曲線分辨純物質與混合物，會算色層分析的比移值 Rf。", prereq: "國中的三態變化、熔點與沸點。", time: "約 1 至 2 節課。課本第9～20頁。" },
      cards: [
        {
          id: "F1", title: "純物質與混合物：看加熱曲線", page: "課本 物質特性", tags: ["src"],
          say: "冰塊加熱，溫度到 0 °C 會<b>停住</b>，等冰全部融化才繼續上升，這段水平的平台就是純物質的身分證。混合物沒有固定熔點、沸點，相變化時溫度一邊變化一邊進行，曲線是斜的。",
          formula: "純物質：熔點、沸點固定 → 加熱曲線有<b>水平平台</b>　　混合物：熔點、沸點是一個溫度範圍 → 沒有平台",
          widget: { id: "w-heat", aria: "純物質與混合物的加熱曲線比較", rw: 0.45, rn: 0.8,
            controls: [{ k: "t", label: "加熱時間", min: 0, max: 10, step: 0.05 }, { k: "mix", label: "看哪種", min: 0, max: 1, step: 1 }], play: { k: "t", dur: 6000 } },
          space: "平台那一段，熱一直加進去，溫度卻不動，熱都拿去「拆開粒子之間的吸引力」（相變化）了。",
          trap: "把平台當成「沒在加熱」。平台時一直在吸熱，只是熱用在相變化。",
          quiz: { q: "某固體加熱時，溫度從 52 °C 一路慢慢升到 61 °C 才完全熔化，中間沒有停住。這個樣品最可能是？", answer: "b", options: [
            { c: "a", text: "純物質，熔點是 52 °C", why: "純物質熔化時溫度會停在熔點不動，不會一路上升。" },
            { c: "b", text: "混合物" },
            { c: "c", text: "純物質，熔點是 61 °C", why: "純物質的熔點是一個固定溫度，不是一段範圍。" },
            { c: "d", text: "無法判斷", why: "沒有水平平台、熔化溫度是一段範圍，就是混合物的特徵。" }] },
          sol: { id: "s-F1", aria: "逐步圖解：兩條加熱曲線比較" }
        },
        {
          id: "F2", title: "色層分析與比移值 Rf", page: "課本 物質特性", tags: ["src"],
          say: "把混合物點在濾紙下方，讓展開液慢慢往上爬。每種成分「黏在紙上」和「溶在展開液裡」的程度不同，跑的距離也不同，就分開了。<b>Rf = 物質移動距離 ÷ 展開液移動距離</b>，同一個條件下，同一種物質的 Rf 固定。",
          formula: "<i>R</i><sub>f</sub> = <span class=\"fr\"><span>物質移動距離 <i>Y</i></span><span>展開液移動距離 <i>X</i></span></span>　　0 &lt; <i>R</i><sub>f</sub> &lt; 1",
          widget: { id: "w-tlc", aria: "色層分析片上展開液往上爬，兩個成分以不同比例移動", rw: 0.55, rn: 0.95,
            controls: [{ k: "t", label: "展開時間", min: 0, max: 1, step: 0.01 }], play: { k: "t", dur: 5000 } },
          space: "不管展開多久，每個色點和展開液前緣的距離比例都不變，所以 Rf 是固定的。Rf 越大，代表越不黏紙、越容易被展開液帶走。",
          trap: "把 Y 和 X 放反（Rf 一定小於 1），或從紙的邊緣開始量（要從起點線量）。",
          quiz: { q: "展開液從起點線往上移動了 8.0 cm，某色點從起點線移動了 3.2 cm。它的 Rf 是？", answer: "a", options: [
            { c: "a", text: "0.40" },
            { c: "b", text: "2.5", why: "放反了。Rf = 物質距離 ÷ 展開液距離，一定小於 1。" },
            { c: "c", text: "4.8", why: "4.8 是兩個距離相減，Rf 要用相除。" },
            { c: "d", text: "0.60", why: "0.60 是 (8.0 − 3.2) ÷ 8.0，題目問的是色點本身的移動比例。" }] },
          sol: { id: "s-F2", aria: "逐步圖解：量兩個距離再相除" }
        }
      ]
    },
    {
      id: "1-1", short: "化學計量", title: "化學反應式的平衡及應用",
      plan: { goal: "會平衡反應式（原子、電荷、電子守恆），用係數比做計量，判斷限量試劑並算產率。", prereq: "原子量、莫耳、STP 下 1 mol 氣體 22.4 L。", time: "約 4 節課。講義 1-1、課本化學計量。" },
      cards: [
        {
          id: "F3", title: "平衡反應式：原子守恆", page: "講義 1-1", tags: ["src", "add"],
          say: "化學反應只是原子「換搭檔」，原子不會憑空出現或消失。所以箭頭左右，每一種原子的數目都要一樣。下面調係數，看長條什麼時候左右一樣高。小訣竅：先平衡只出現一次的 C 和 H，<b>O 留到最後</b>。",
          formula: "a C<sub>3</sub>H<sub>8</sub> + b O<sub>2</sub> → c CO<sub>2</sub> + d H<sub>2</sub>O　　每種原子：左邊數目 = 右邊數目",
          widget: { id: "w-bal", aria: "調整係數，比較反應式左右兩邊各原子的數目", rw: 0.42, rn: 0.85,
            controls: [{ k: "a", label: "C₃H₈", min: 1, max: 3, step: 1 }, { k: "b", label: "O₂", min: 1, max: 15, step: 1 }, { k: "c", label: "CO₂", min: 1, max: 9, step: 1 }, { k: "d", label: "H₂O", min: 1, max: 12, step: 1 }] },
          space: "改 C₃H₈ 的係數，C 和 H 兩條都跟著變；改 O₂ 只動 O 那一條。所以先定碳氫、最後補氧最省事。",
          trap: "為了平衡去改化學式的下標（把 H₂O 改成 H₂O₂）。只能改前面的係數。",
          quiz: { q: "丙烷燃燒：C₃H₈ + __O₂ → 3CO₂ + 4H₂O。O₂ 的係數是？", answer: "c", options: [
            { c: "a", text: "3", why: "右邊 O 原子：3 × 2 + 4 × 1 = 10 個，O₂ 要提供 10 個 O。" },
            { c: "b", text: "4", why: "再數一次右邊的 O：CO₂ 有 6 個、H₂O 有 4 個。" },
            { c: "c", text: "5" },
            { c: "d", text: "10", why: "10 是 O「原子」的數目，O₂ 一個分子有 2 個 O，所以要 5 個 O₂。" }] },
          sol: { id: "s-F3", aria: "逐步圖解：先碳、再氫、最後氧" }
        },
        {
          id: "F4", title: "化學計量：係數比 = 莫耳數比", page: "講義 1-1", tags: ["src"],
          say: "平衡好的反應式就是一份「食譜」：2H₂ + O₂ → 2H₂O 的意思是<b>每 2 份氫配 1 份氧，做出 2 份水</b>。「份」就是莫耳。要算質量，先換成莫耳，用係數比，最後再換回質量。",
          formula: "係數比 = 莫耳數比 =（同溫同壓氣體）體積比　　質量 ÷ 分子量 = 莫耳數　　STP：1 mol 氣體 = 22.4 L",
          widget: { id: "w-stoich", aria: "氫氣與氧氣分子依係數比反應成水分子", rw: 0.34, rn: 0.75,
            controls: [{ k: "n", label: "H₂ 莫耳數", min: 1, max: 8, step: 1 }] },
          space: "每多 2 個 H₂ 分子，就多用掉 1 個 O₂、多做出 2 個 H₂O。分子數比永遠是 2 : 1 : 2。",
          trap: "用質量比當係數比。2 g 的 H₂ 不會剛好配 1 g 的 O₂，要先換成莫耳。",
          quiz: { q: "4 mol 氫氣與足量氧氣完全反應（2H₂ + O₂ → 2H₂O），生成水多少克？（H = 1、O = 16）", answer: "a", options: [
            { c: "a", text: "72 g" },
            { c: "b", text: "36 g", why: "H₂ 和 H₂O 的係數都是 2，4 mol H₂ 生成 4 mol H₂O，不是 2 mol。" },
            { c: "c", text: "64 g", why: "64 g 是需要的氧氣（2 mol × 32），題目問的是水。" },
            { c: "d", text: "144 g", why: "4 mol × 18 g/mol = 72 g，不需要再乘 2。" }] },
          sol: { id: "s-F4", aria: "逐步圖解：莫耳數比再乘分子量" }
        },
        {
          id: "F5", title: "限量試劑與產率", page: "講義 1-1", tags: ["src"],
          say: "做三明治要 2 片麵包配 1 片起司。有 10 片麵包、3 片起司，最多做 3 個，起司先用完，它就是<b>限量試劑</b>。化學一樣：各反應物的莫耳數 ÷ 係數，<b>最小的那個先用完</b>，它決定產物最多有多少。",
          formula: "限量試劑：<span class=\"fr\"><span>莫耳數</span><span>係數</span></span> 最小者　　產率 = <span class=\"fr\"><span>實際產量</span><span>理論產量</span></span> × 100%",
          widget: { id: "w-limit", aria: "氮氣與氫氣分子反應成氨，看哪一種先用完", rw: 0.4, rn: 0.85,
            controls: [{ k: "a", label: "N₂ 莫耳", min: 1, max: 4, step: 1 }, { k: "b", label: "H₂ 莫耳", min: 1, max: 12, step: 1 }] },
          space: "灰掉的分子就是剩下沒反應的。只有剛好照 1 : 3 的比例時，兩種才會同時用完。",
          trap: "直接比莫耳數多寡（3 mol H₂ 比 2 mol N₂ 多，就說 N₂ 是限量）。要先除以係數再比。",
          quiz: { q: "N₂ + 3H₂ → 2NH₃。取 2 mol N₂ 與 3 mol H₂ 反應，實際得到 1.5 mol NH₃。限量試劑與產率是？", answer: "a", options: [
            { c: "a", text: "H₂；產率 75%" },
            { c: "b", text: "N₂；產率 37.5%", why: "N₂：2 ÷ 1 = 2，H₂：3 ÷ 3 = 1，H₂ 的比值較小才是限量試劑。" },
            { c: "c", text: "H₂；產率 50%", why: "理論產量：1 mol（以 H₂ 計）× 2 = 2 mol NH₃，1.5 ÷ 2 = 75%。" },
            { c: "d", text: "N₂；產率 75%", why: "產率對了，但限量試劑是 H₂（3 mol 只夠配 1 mol N₂）。" }] },
          sol: { id: "s-F5", aria: "逐步圖解：除以係數、找最小、算理論產量" }
        },
        {
          id: "F6", title: "氧化還原與電子守恆", page: "課本 化學計量", tags: ["src", "add"],
          say: "鋅片放進硫酸銅溶液，鋅慢慢溶掉、表面長出紅色的銅。發生了什麼事？鋅把 2 個電子<b>交給</b>銅離子。失去電子的叫<b>氧化</b>，得到電子的叫<b>還原</b>。讓別人被氧化的，就是<b>氧化劑</b>，它自己被還原。",
          formula: "Zn → Zn²⁺ + 2e⁻（氧化，Zn 是還原劑）　　Cu²⁺ + 2e⁻ → Cu（還原，Cu²⁺ 是氧化劑）　　失去電子數 = 得到電子數",
          widget: { id: "w-redox", aria: "鋅原子把兩個電子交給銅離子", rw: 0.36, rn: 0.65,
            controls: [{ k: "t", label: "反應進度", min: 0, max: 1, step: 0.01 }], play: { k: "t", dur: 3000 } },
          space: "看氧化數：Zn 從 0 變 +2（升高，被氧化），Cu 從 +2 變 0（降低，被還原）。兩邊的數字變化一樣多，因為電子是從一邊搬到另一邊。",
          trap: "把「氧化劑」和「被氧化」搞混。氧化劑自己是被還原的那一個。",
          quiz: { q: "Zn + Cu²⁺ → Zn²⁺ + Cu 中，氧化劑是？", answer: "b", options: [
            { c: "a", text: "Zn", why: "Zn 失去電子被氧化，它是還原劑。" },
            { c: "b", text: "Cu²⁺" },
            { c: "c", text: "Zn²⁺", why: "Zn²⁺ 是產物（鋅被氧化後的樣子）。" },
            { c: "d", text: "Cu", why: "Cu 是產物（銅離子被還原後的樣子）。" }] },
          sol: { id: "s-F6", aria: "逐步圖解：看氧化數升降" }
        }
      ]
    },
    {
      id: "1-2", short: "反應熱", title: "化學反應中的能量變化",
      plan: { goal: "看懂熱含量圖與 ΔH 正負，會用熱化學方程式的性質、生成熱、燃燒熱、赫斯定律算反應熱，會用卡計 Q = msΔT。", prereq: "能量守恆；1-1 的係數比。", time: "約 4 至 5 節課。講義 1-2、實驗活動1。" },
      cards: [
        {
          id: "F7", title: "反應熱 ΔH：吸熱與放熱", page: "講義 1-2", tags: ["src"],
          say: "每種物質都有自己的「熱含量」H。反應熱 ΔH = 生成物 − 反應物。生成物比較高，代表反應<b>吸</b>了熱，ΔH &gt; 0；生成物比較低，代表<b>放</b>出熱，ΔH &lt; 0。拉拉看，能量圖上的箭頭朝上還是朝下。",
          formula: "Δ<i>H</i> = Σ<i>H</i><sub>生成物</sub> − Σ<i>H</i><sub>反應物</sub>　　Δ<i>H</i> &gt; 0 吸熱　　Δ<i>H</i> &lt; 0 放熱",
          widget: { id: "w-dh", aria: "熱含量能量圖：反應物與生成物的高度差", rw: 0.42, rn: 0.8,
            controls: [{ k: "dh", label: "ΔH (kJ)", min: -300, max: 300, step: 10 }] },
          space: "箭頭往下：能量跑到外面，周圍變熱（燃燒、酸鹼中和）。箭頭往上：從周圍拿熱，周圍變冷（冷敷袋的硝酸鉀溶解）。",
          trap: "以為反應熱大的反應就比較快。反應熱只看「起點和終點的高度差」，跟快慢無關。",
          quiz: { q: "某反應 ΔH = +180 kJ。下列何者正確？", answer: "c", options: [
            { c: "a", text: "放熱反應，生成物熱含量較高", why: "ΔH > 0 是吸熱，不是放熱。" },
            { c: "b", text: "放熱反應，生成物熱含量較低", why: "那是 ΔH < 0 的情形。" },
            { c: "c", text: "吸熱反應，生成物熱含量較高" },
            { c: "d", text: "反應速率一定很快", why: "ΔH 和反應速率沒有關係。" }] },
          sol: { id: "s-F7", aria: "逐步圖解：生成物在上面" }
        },
        {
          id: "F8", title: "熱化學方程式：倍數與逆寫", page: "講義 1-2", tags: ["src"],
          say: "熱化學方程式有兩個規則：反應式<b>乘幾倍，ΔH 就乘幾倍</b>（莫耳數變了，能量也跟著變）；<b>反過來寫，ΔH 數值不變、正負相反</b>（爬上去和走下來的高度一樣）。",
          formula: "H<sub>2</sub>(g) + ½O<sub>2</sub>(g) → H<sub>2</sub>O(l)　Δ<i>H</i> = −285.8 kJ<br>× <i>n</i> → Δ<i>H</i> × <i>n</i>　　逆寫 → Δ<i>H</i> 變號",
          widget: { id: "w-thermo", aria: "把反應式乘上倍數或逆寫，ΔH 跟著變化", rw: 0.36, rn: 0.7,
            controls: [{ k: "i", label: "倍數", min: 0, max: 5, step: 1 }] },
          space: "負的倍數就是「反過來寫」。能量圖上的箭頭跟著反轉，長度跟著倍數伸縮。",
          trap: "逆寫時只記得變號，忘了係數也乘了 2。",
          quiz: { q: "已知 H₂(g) + ½O₂(g) → H₂O(l)，ΔH = −285.8 kJ。則 2H₂O(l) → 2H₂(g) + O₂(g) 的 ΔH 是？", answer: "a", options: [
            { c: "a", text: "+571.6 kJ" },
            { c: "b", text: "−571.6 kJ", why: "逆寫要變號：分解水是吸熱。" },
            { c: "c", text: "+285.8 kJ", why: "變號對了，但係數乘了 2，ΔH 也要乘 2。" },
            { c: "d", text: "−285.8 kJ", why: "逆寫要變號，乘 2 要加倍。" }] },
          sol: { id: "s-F8", aria: "逐步圖解：先逆寫、再乘 2" }
        },
        {
          id: "F9", title: "生成熱、燃燒熱與赫斯定律", page: "講義 1-2", tags: ["src", "add"],
          say: "從山腳到山頂，走大路或爬小路，高度差都一樣。反應熱也是：<b>只看起點和終點，跟走哪條路無關</b>，這就是赫斯定律。所以量不到的反應熱，可以用量得到的反應「繞路」加出來。",
          formula: "Δ<i>H</i><sub>反應</sub> = ΣΔ<i>H</i><sub>f</sub>(生成物) − ΣΔ<i>H</i><sub>f</sub>(反應物) = ΣΔ<i>H</i><sub>c</sub>(反應物) − ΣΔ<i>H</i><sub>c</sub>(生成物)<br><span style=\"font-size:.8em\">最穩定元素的生成熱 = 0；不可燃物（CO₂、H₂O…）的燃燒熱 = 0</span>",
          widget: { id: "w-hess", aria: "碳燃燒成二氧化碳的兩條路徑，總能量變化相同", rw: 0.45, rn: 0.85,
            controls: [{ k: "p", label: "走哪條路", min: 0, max: 1, step: 1 }] },
          space: "藍色直達和金色繞路，最後都掉到同一個高度 −393.5 kJ。所以「CO 燒成 CO₂」那一段，就是兩個已知數字相減。",
          trap: "相減時方向弄反：ΔH 一律是「後面（生成物）減前面（反應物）」。",
          quiz: { q: "已知 C(s) + O₂ → CO₂，ΔH = −393.5 kJ；C(s) + ½O₂ → CO，ΔH = −110.5 kJ。則 CO + ½O₂ → CO₂ 的 ΔH 是？", answer: "c", options: [
            { c: "a", text: "−504.0 kJ", why: "兩個直接相加了。CO 是中途站，要用「全程 − 前半段」。" },
            { c: "b", text: "+283.0 kJ", why: "CO 燃燒是放熱，ΔH 要是負的。" },
            { c: "c", text: "−283.0 kJ" },
            { c: "d", text: "−393.5 kJ", why: "這是 C 一路燒到 CO₂ 的全程。" }] },
          sol: { id: "s-F9", aria: "逐步圖解：全程減前半段" }
        },
        {
          id: "F10", title: "卡計：Q = m·s·ΔT", page: "實驗活動1", tags: ["src"],
          say: "反應放出的熱被水吸收，水溫上升。水吸了多少熱，用 <b>Q = m × s × ΔT</b>：質量越大、溫度升越多，吸的熱越多。水的比熱 s = 4.18 J/(g·°C)。",
          formula: "<i>Q</i> = <i>m</i> × <i>s</i> × Δ<i>T</i>　　水：<i>s</i> = 4.18 J/(g·°C)　　Δ<i>H</i> = −<span class=\"fr\"><span><i>Q</i></span><span>反應莫耳數</span></span>（放熱時）",
          widget: { id: "w-cal", aria: "卡計中的水量與溫度上升，算出吸收的熱量", rw: 0.4, rn: 0.8,
            controls: [{ k: "m", label: "水 m (g)", min: 50, max: 300, step: 10 }, { k: "dt", label: "ΔT (°C)", min: 0, max: 20, step: 0.5 }] },
          space: "同樣多的熱，水越多溫度升得越少；所以實驗時水量要量準，否則 ΔT 一變，算出的熱就差很多。",
          trap: "忘了乘質量，或把 J 和 kJ 混用（1 kJ = 1000 J）。",
          quiz: { q: "卡計內有 100 g 水，反應後水溫上升 5.0 °C。水吸收的熱量是？", answer: "c", options: [
            { c: "a", text: "20.9 kJ", why: "100 × 4.18 × 5.0 = 2090 J，換成 kJ 是 2.09，不是 20.9。" },
            { c: "b", text: "418 J", why: "少乘了溫度變化 5.0 °C。" },
            { c: "c", text: "2.09 kJ" },
            { c: "d", text: "20.9 J", why: "少乘了水的質量 100 g。" }] },
          sol: { id: "s-F10", aria: "逐步圖解：三個數字相乘再換單位" }
        }
      ]
    }
  ],
  footer: [
    "課本與講義：高二化學 第1章（課本第9～52頁；講義 1-1 化學反應式的平衡及應用、1-2 化學反應中的能量變化、實驗活動1 化學反應熱）。本機原始檔「化學講義/」。",
    "內容依平台教材包 tm_12、tm_13（經交叉審查）；數據取常用值（如 ΔHf(CO₂) = −393.5 kJ/mol、ΔHf(CO) = −110.5 kJ/mol、水的比熱 4.18 J/(g·°C)），答案已驗算。"
  ],
  script: String.raw`
function mol(g,x,y,atoms,C,r){ r=r||7; atoms.forEach(function(a){ g.save(); g.fillStyle=a[2]; g.strokeStyle=C.ink; g.lineWidth=1; g.beginPath(); g.arc(x+a[0]*r,y+a[1]*r,r*(a[3]||1),0,TAU); g.fill(); g.stroke(); g.restore(); }); }
function H2(C){ return [[-0.7,0,'#e8eef8'],[0.7,0,'#e8eef8']]; }
function O2(C){ return [[-0.75,0,C.red,1.2],[0.75,0,C.red,1.2]]; }
function H2O(C){ return [[0,0,C.red,1.2],[-1.05,0.75,'#e8eef8'],[1.05,0.75,'#e8eef8']]; }
function N2(C){ return [[-0.75,0,C.blue,1.15],[0.75,0,C.blue,1.15]]; }
function NH3(C){ return [[0,0,C.blue,1.15],[-1.1,0.7,'#e8eef8'],[1.1,0.7,'#e8eef8'],[0,-1.25,'#e8eef8']]; }
function fade(atoms){ return atoms.map(function(a){ return [a[0],a[1],'rgba(150,160,175,0.35)',a[3]]; }); }
function grid(g,x0,y0,w,cols,n,dx,dy,fn){ for(var i=0;i<n;i++){ fn(x0+(i%cols)*dx+dx/2, y0+Math.floor(i/cols)*dy+dy/2, i); } }

/* F1 加熱曲線 */
function heatPure(t){ if(t<2) return -20+10*t; if(t<4) return 0; if(t<6.5) return 0+40*(t-4); if(t<9) return 100; return 100+20*(t-9); }
function heatMix(t){ if(t<2) return -20+10*t; if(t<4.2) return 0+6*(t-2); if(t<6.3) return 13.2+38*(t-4.2); if(t<9) return 93+5*(t-6.3); return 106.5+20*(t-9); }
function heatDraw(g,c,C,t,mix,both){ var G=frame(full(c),-0.6,10.6,-35,135,26,false); axes(g,G,[0,10.4,-30,130],C,{xstep:2,ystep:20,xlabel:'加熱時間',ylabel:'溫度 (°C)',y0:-30});
  if(both||!mix){ plot(g,G,heatPure,0,10,both?C.teal:C.muted,both?3:1.5,both?[]:[4,4]); }
  if(both||mix){ plot(g,G,heatMix,0,10,both?C.gold:C.muted,both?3:1.5,both?[]:[4,4]); }
  if(!both){ var f=mix?heatMix:heatPure; plot(g,G,f,0,t,mix?C.gold:C.teal,3.5); dot(g,G.X(t),G.Y(f(t)),6,C.red); }
  if(both){ T(g,'純物質：平台（0 °C、100 °C）',G.X(4.2),G.Y(0)-12,C.teal,12,'left','700'); T(g,'混合物：斜的，沒有平台',G.X(4.4),G.Y(40),C.gold,12,'left','700'); } }
widget('w-heat',{state:{t:3,mix:0},rw:0.45,rn:0.8,
  fmt:{t:function(v){return v.toFixed(1);},mix:function(v){return v?'混合物（鹽水）':'純物質（水）';}},
  draw:function(g,c,s){ heatDraw(g,c,c.C,s.t,s.mix,false); },
  out:function(s){ var f=s.mix?heatMix:heatPure, T0=f(s.t), flat=Math.abs(f(s.t+0.05)-T0)<0.01; return (s.mix?'混合物':'純物質')+'：目前 '+T0.toFixed(1)+' °C'+(flat?'　→　<b>水平平台：吸熱用在相變化，溫度不變</b>':''); }
});
widget('s-F1',{state:{},steps:2,rw:0.45,rn:0.8,
  draw:function(g,c,s){ heatDraw(g,c,c.C,10,0,true); },
  out:steps(['純物質（青綠）熔化時溫度停在熔點，出現水平平台；混合物（金色）熔化時溫度一路上升。','題目中的樣品從 52 °C 升到 61 °C 才熔完，沒有平台，是<b>混合物</b>。'])
});

/* F2 色層分析 */
var RF=[0.75,0.4];
function tlcDraw(g,c,C,t,mark){ var P=panels(c,0.4), G=frame(P[0],-1,6,-1,11,12,true), front=0.6+8.6*t;
  box(g,G.X(0),G.Y(10),5*G.sx,10*G.sy,alpha(C.gold,0.08),C.ink,1.5);
  box(g,G.X(0),G.Y(Math.max(0.6,front)),5*G.sx,Math.max(0.6,front)*G.sy,alpha(C.blue,0.1),null);
  L(g,G.X(0),G.Y(0.6),G.X(5),G.Y(0.6),C.muted,1.2,[4,3]); T(g,'起點線',G.X(5)+4,G.Y(0.6),C.muted,11,'left');
  L(g,G.X(0),G.Y(front),G.X(5),G.Y(front),C.blue,2); T(g,'展開液前緣',G.X(5)+4,G.Y(front),C.blue,11,'left','700');
  var cols=[C.red,C.teal]; RF.forEach(function(r,i){ var y=0.6+(front-0.6)*r; dot(g,G.X(1.6+i*1.8),G.Y(y),7,cols[i]); });
  if(mark){ var X=front-0.6; L(g,G.X(4.4),G.Y(0.6),G.X(4.4),G.Y(front),C.blue,3); T(g,'X',G.X(4.4)+6,G.Y((0.6+front)/2),C.blue,13,'left','700');
    var y2=0.6+X*RF[1]; L(g,G.X(3.4)+12,G.Y(0.6),G.X(3.4)+12,G.Y(y2),C.teal,3); T(g,'Y',G.X(3.4)+18,G.Y((0.6+y2)/2),C.teal,13,'left','700'); }
  var H=frame(P[1],-0.2,2.4,-0.15,1.15,24,false); axes(g,H,[0,2.2,0,1.05],C,{xstep:1,ystep:0.25,xfmt:function(v){return v===0?'':v===1?'紅':'青';},ylabel:'Rf'});
  RF.forEach(function(r,i){ box(g,H.X(i+0.7),H.Y(r),0.6*H.sx,r*H.sy,alpha(cols[i],0.4),cols[i],2); T(g,r.toFixed(2),H.X(i+1),H.Y(r)-10,cols[i],12,'center','700'); }); }
widget('w-tlc',{state:{t:0.6},rw:0.55,rn:0.95,
  fmt:{t:function(v){return Math.round(v*100)+'%';}},
  draw:function(g,c,s){ tlcDraw(g,c,c.C,s.t,false); },
  out:function(s){ var X=8.6*s.t; return '展開液移動 X = '+X.toFixed(2)+'　｜　紅點 Y = '+(X*RF[0]).toFixed(2)+'，Rf = <b>'+RF[0]+'</b>　｜　青點 Y = '+(X*RF[1]).toFixed(2)+'，Rf = <b>'+RF[1]+'</b>（展開多久都一樣）'; }
});
widget('s-F2',{state:{},steps:2,rw:0.55,rn:0.95,
  draw:function(g,c,s){ tlcDraw(g,c,c.C,8.0/8.6,s.step>=0); },
  out:steps(['從<b>起點線</b>量：展開液前緣移動 X = 8.0 cm，色點移動 Y = 3.2 cm。','Rf = Y ÷ X = 3.2 ÷ 8.0 = <b>0.40</b>（一定介於 0 和 1 之間）。'])
});

/* F3 平衡反應式 */
function balDraw(g,c,C,a,b,cc,d){ var L1=[3*a,8*a,2*b], R1=[cc,2*d,2*cc+d], labs=['C','H','O'], G=frame(full(c),-0.5,9.5,-2,30,26,false);
  axes(g,G,[0,9.2,0,28],C,{xstep:100,ystep:4,ylabel:'原子數'});
  labs.forEach(function(l,i){ var x=0.6+i*3.1; box(g,G.X(x),G.Y(L1[i]),0.9*G.sx,L1[i]*G.sy,alpha(C.blue,0.4),C.blue,2); box(g,G.X(x+1.1),G.Y(R1[i]),0.9*G.sx,R1[i]*G.sy,alpha(C.gold,0.4),C.gold,2);
    T(g,L1[i],G.X(x+0.45),G.Y(L1[i])-9,C.blue,12,'center','700'); T(g,R1[i],G.X(x+1.55),G.Y(R1[i])-9,C.gold,12,'center','700');
    var ok=L1[i]===R1[i]; T(g,l+(ok?' ✓':' ✗'),G.X(x+1),G.Y(0)+16,ok?C.teal:C.red,14,'center','700'); });
  T(g,'藍＝左邊　金＝右邊',G.X(9.2),G.Y(28),C.muted,11,'right'); return L1.every(function(v,i){return v===R1[i];}); }
widget('w-bal',{state:{a:1,b:3,c:3,d:4},rw:0.42,rn:0.85,
  fmt:{a:String,b:String,c:String,d:String},
  draw:function(g,c,s){ balDraw(g,c,c.C,s.a,s.b,s.c,s.d); },
  out:function(s){ var ok=3*s.a===s.c&&8*s.a===2*s.d&&2*s.b===2*s.c+s.d; return s.a+' C₃H₈ + '+s.b+' O₂ → '+s.c+' CO₂ + '+s.d+' H₂O　→　'+(ok?'<b>平衡了！</b>':'還沒平衡，看哪一種原子打 ✗'); }
});
widget('s-F3',{state:{},steps:3,rw:0.42,rn:0.85,
  draw:function(g,c,s){ balDraw(g,c,c.C,1,[1,1,5][s.step],[3,3,3][s.step],[1,4,4][s.step]); },
  out:steps(['先看 C：左邊 3 個，所以 CO₂ 係數 3。','再看 H：左邊 8 個，H₂O 每個有 2 個 H，所以 H₂O 係數 4。','最後數右邊 O：3 × 2 + 4 = 10 個，O₂ 要 10 ÷ 2 = <b>5</b>。C₃H₈ + 5O₂ → 3CO₂ + 4H₂O。'])
});

/* F4 計量（粒子圖） */
function stoichDraw(g,c,C,n,showTxt){ var P=panels(c,0.5), oN=n/2;
  T(g,'反應前',P[0].x+10,P[0].y+16,C.muted,12,'left','700'); T(g,'反應後',P[1].x+10,P[1].y+16,C.muted,12,'left','700');
  var cols=c.narrow?6:4, dx=Math.min(70,(P[0].w-20)/cols), dy=52;
  grid(g,P[0].x+10,P[0].y+28,0,cols,n,dx,dy,function(x,y){ mol(g,x,y,H2(C),C,11); });
  grid(g,P[0].x+10,P[0].y+28+Math.ceil(n/cols)*dy,0,cols,Math.floor(oN),dx,dy,function(x,y){ mol(g,x,y,O2(C),C,11); });
  if(oN%1) { var k=Math.floor(oN), x=P[0].x+10+(k%cols)*dx+dx/2, y=P[0].y+28+Math.ceil(n/cols)*dy+Math.floor(k/cols)*dy+dy/2; mol(g,x,y,[[0,0,C.red,1.2]],C,11); T(g,'½',x+18,y,C.red,12,'left','700'); }
  grid(g,P[1].x+10,P[1].y+28,0,cols,n,dx,dy,function(x,y){ mol(g,x,y,H2O(C),C,11); });
  L(g,P[1].x,P[1].y+20,P[1].x,P[1].y+P[1].h-10,C.grid,1); }
widget('w-stoich',{state:{n:4},rw:0.34,rn:0.75,
  fmt:{n:function(v){return v+' mol';}},
  draw:function(g,c,s){ stoichDraw(g,c,c.C,s.n); },
  out:function(s){ return 'H₂ '+s.n+' mol（'+(2*s.n)+' g）＋ O₂ '+(s.n/2)+' mol（'+(16*s.n)+' g）→ H₂O <b>'+s.n+' mol（'+(18*s.n)+' g）</b>　｜　莫耳比 2 : 1 : 2；質量守恆 '+(2*s.n)+' + '+(16*s.n)+' = '+(18*s.n)+' ✓'; }
});
widget('s-F4',{state:{},steps:2,rw:0.34,rn:0.75,
  draw:function(g,c,s){ stoichDraw(g,c,c.C,4); },
  out:steps(['係數比 H₂ : H₂O = 2 : 2 = 1 : 1，所以 4 mol H₂ 生成 <b>4 mol H₂O</b>。','H₂O 分子量 18，質量 = 4 × 18 = <b>72 g</b>。'])
});

/* F5 限量試劑 */
function limitDraw(g,c,C,a,b){ var P=panels(c,0.5), used=Math.min(a,b/3), cols=c.narrow?7:5, dx=Math.min(64,(P[0].w-20)/cols), dy=48;
  T(g,'反應前（灰色 = 用不完）',P[0].x+10,P[0].y+16,C.muted,12,'left','700'); T(g,'反應後',P[1].x+10,P[1].y+16,C.muted,12,'left','700');
  grid(g,P[0].x+10,P[0].y+28,0,cols,a,dx,dy,function(x,y,i){ mol(g,x,y,i<used-1e-9?N2(C):fade(N2(C)),C,10); });
  var off=Math.ceil(a/cols)*dy; grid(g,P[0].x+10,P[0].y+28+off,0,cols,b,dx,dy,function(x,y,i){ mol(g,x,y,i<3*used-1e-9?H2(C):fade(H2(C)),C,10); });
  var nh=Math.round(2*used*100)/100; grid(g,P[1].x+10,P[1].y+28,0,cols,Math.floor(nh),dx,dy+4,function(x,y){ mol(g,x,y,NH3(C),C,10); });
  L(g,P[1].x,P[1].y+20,P[1].x,P[1].y+P[1].h-10,C.grid,1); }
widget('w-limit',{state:{a:2,b:3},rw:0.4,rn:0.85,
  fmt:{a:function(v){return v+' mol';},b:function(v){return v+' mol';}},
  draw:function(g,c,s){ limitDraw(g,c,c.C,s.a,s.b); },
  out:function(s){ var ra=s.a/1, rb=s.b/3, lim=ra<rb?'N₂':rb<ra?'H₂':'剛好一起用完'; return 'N₂：'+s.a+' ÷ 1 = '+ra.toFixed(2)+'　H₂：'+s.b+' ÷ 3 = '+rb.toFixed(2)+'　→　限量試劑 <b>'+lim+'</b>，最多生成 NH₃ <b>'+(2*Math.min(ra,rb)).toFixed(2)+' mol</b>'; }
});
widget('s-F5',{state:{},steps:3,rw:0.4,rn:0.85,
  draw:function(g,c,s){ limitDraw(g,c,c.C,2,3); },
  out:steps(['除以係數：N₂ 2 ÷ 1 = 2，H₂ 3 ÷ 3 = 1。H₂ 的比值小，<b>H₂ 是限量試劑</b>（圖中 N₂ 剩下 1 個灰色）。','理論產量：1 mol（N₂ 用掉的量）× 2 = <b>2 mol NH₃</b>。','產率 = 1.5 ÷ 2 × 100% = <b>75%</b>。'])
});

/* F6 氧化還原 */
function redoxDraw(g,c,C,t,showOx){ var G=frame(full(c),-6,6,-2.6,2.6,16,true), ex=-3+6*t;
  var zr=1.1, cr=1.1; g.save(); g.fillStyle=alpha('#8a95a5',1-0.5*t); g.beginPath(); g.arc(G.X(-3),G.Y(0),zr*G.sx,0,TAU); g.fill(); g.restore(); T(g,t>0.95?'Zn²⁺':'Zn',G.X(-3),G.Y(0),C.ink,16,'center','700');
  g.save(); g.fillStyle=t>0.95?'#c46a3a':alpha(C.blue,0.5); g.beginPath(); g.arc(G.X(3),G.Y(0),cr*G.sx,0,TAU); g.fill(); g.restore(); T(g,t>0.95?'Cu':'Cu²⁺',G.X(3),G.Y(0),C.sheet,16,'center','700');
  if(t<0.98){ [0.55,-0.55].forEach(function(dy){ dot(g,G.X(ex),G.Y(dy+0.9*Math.sin(t*PI)),7,C.gold); T(g,'e⁻',G.X(ex)+10,G.Y(dy+0.9*Math.sin(t*PI))-8,C.gold,11,'left','700'); }); }
  if(showOx){ T(g,'氧化數 0 → +2（升高：被氧化）',G.X(-3),G.Y(-1.9),C.teal,12,'center','700'); T(g,'氧化數 +2 → 0（降低：被還原）',G.X(3),G.Y(-1.9),C.red,12,'center','700'); }
  T(g,'還原劑',G.X(-3),G.Y(1.9),C.teal,12,'center','700'); T(g,'氧化劑',G.X(3),G.Y(1.9),C.red,12,'center','700'); }
widget('w-redox',{state:{t:0.4},rw:0.36,rn:0.65,
  fmt:{t:function(v){return Math.round(v*100)+'%';}},
  draw:function(g,c,s){ redoxDraw(g,c,c.C,s.t,true); },
  out:function(s){ return 'Zn 失去 2 個電子（<b>氧化</b>，是還原劑）　→　Cu²⁺ 得到 2 個電子（<b>還原</b>，是氧化劑）　｜　失去 2 e⁻ = 得到 2 e⁻（電子守恆）'; }
});
widget('s-F6',{state:{},steps:2,rw:0.36,rn:0.65,
  draw:function(g,c,s){ redoxDraw(g,c,c.C,s.step?1:0.5,true); },
  out:steps(['看氧化數：Zn 0 → +2（升高），Cu 從 +2 → 0（降低）。','Cu²⁺ 拿走 Zn 的電子、讓 Zn 被氧化，所以 <b>Cu²⁺ 是氧化劑</b>（它自己被還原）。'])
});

/* F7 ΔH 能量圖 */
function levels(g,c,C,dh,lab1,lab2,arrowCol){ var R=Math.max(340,Math.abs(dh)*1.2), G=frame(full(c),0,10,-R,R,26,false), y1=0, y2=dh;
  L(g,G.X(1),G.Y(-R*0.94),G.X(1),G.Y(R*0.94),C.ink,1.3); T(g,'熱含量 H',G.X(1)+6,G.Y(R*0.94),C.muted,11,'left');
  L(g,G.X(1.8),G.Y(y1),G.X(4.2),G.Y(y1),C.ink,4); T(g,lab1,G.X(3),G.Y(y1)+(dh<0?-14:16),C.ink,13,'center','700');
  L(g,G.X(5.8),G.Y(y2),G.X(8.2),G.Y(y2),C.ink,4); T(g,lab2,G.X(7),G.Y(y2)+(dh<0?16:-14),C.ink,13,'center','700');
  L(g,G.X(4.2),G.Y(y1),G.X(5.8),G.Y(y1),C.grid,1,[3,3]);
  if(Math.abs(dh)>5){ var col=arrowCol||(dh>0?C.red:C.blue); L(g,G.X(5.2),G.Y(y1),G.X(5.2),G.Y(y2),col,4); g.save(); g.fillStyle=col; var yy=G.Y(y2), d=dh>0?1:-1; g.beginPath(); g.moveTo(G.X(5.2),yy); g.lineTo(G.X(5.2)-6,yy+d*10); g.lineTo(G.X(5.2)+6,yy+d*10); g.closePath(); g.fill(); g.restore();
    T(g,'ΔH = '+(dh>0?'+':'')+dh+' kJ',G.X(5.2)-10,G.Y(dh/2),col,13,'right','700'); } }
widget('w-dh',{state:{dh:-200},rw:0.42,rn:0.8,
  fmt:{dh:function(v){return (v>0?'+':'')+v;}},
  draw:function(g,c,s){ levels(g,c,c.C,s.dh,'反應物','生成物'); },
  out:function(s){ return s.dh>0?'生成物比反應物高 '+s.dh+' kJ：<b>吸熱反應</b>（從周圍吸熱，周圍變冷）':s.dh<0?'生成物比反應物低 '+(-s.dh)+' kJ：<b>放熱反應</b>（把熱放到周圍）':'ΔH = 0：高度一樣'; }
});
widget('s-F7',{state:{},steps:2,rw:0.42,rn:0.8,
  draw:function(g,c,s){ levels(g,c,c.C,s.step?180:0,'反應物','生成物'); },
  out:steps(['ΔH = 生成物 − 反應物。','ΔH = +180 kJ > 0：生成物在上面，<b>熱含量較高、吸熱反應</b>。ΔH 不能看出反應快慢。'])
});

/* F8 熱化學方程式倍數 */
var MULT=[-2,-1,-0.5,0.5,1,2];
function eqText(k){ var a=Math.abs(k); function co(x){ return x===1?'':x===0.5?'½':String(x); } var L1=co(a)+'H₂(g) + '+co(a/2)+'O₂(g)', R1=co(a)+'H₂O(l)'; return k>0? L1+' → '+R1 : R1+' → '+L1; }
widget('w-thermo',{state:{i:4},rw:0.36,rn:0.7,
  fmt:{i:function(v){ var k=MULT[v]; return (k<0?'逆寫 × ':'× ')+Math.abs(k); }},
  draw:function(g,c,s){ var k=MULT[s.i]; levels(g,c,c.C,Math.round(-285.8*k),k>0?'反應物':'H₂O(l)',k>0?'H₂O(l)':'H₂、O₂'); },
  out:function(s){ var k=MULT[s.i], dh=-285.8*k; return eqText(k)+'　ΔH = <b>'+(dh>0?'+':'')+dh.toFixed(1)+' kJ</b>'; }
});
widget('s-F8',{state:{},steps:2,rw:0.36,rn:0.7,
  draw:function(g,c,s){ var dh=s.step?572:286; levels(g,c,c.C,dh,'H₂O(l)','H₂、O₂'); },
  out:steps(['先逆寫：H₂O(l) → H₂(g) + ½O₂(g)，ΔH 變號 = <b>+285.8 kJ</b>。','再乘 2：2H₂O(l) → 2H₂(g) + O₂(g)，ΔH = 2 × 285.8 = <b>+571.6 kJ</b>。'])
});

/* F9 赫斯定律 */
function hessDraw(g,c,C,p,step){ var G=frame(full(c),0,10,-430,50,26,false);
  function lev(x,y,lab){ L(g,G.X(x-1.3),G.Y(y),G.X(x+1.3),G.Y(y),C.ink,4); T(g,lab,G.X(x),G.Y(y)-12,C.ink,13,'center','700'); }
  function arr(x1,y1,x2,y2,col,lab,side){ L(g,G.X(x1),G.Y(y1),G.X(x2),G.Y(y2),col,4); var ang=Math.atan2(G.Y(y2)-G.Y(y1),G.X(x2)-G.X(x1)); g.save(); g.fillStyle=col; g.translate(G.X(x2),G.Y(y2)); g.rotate(ang); g.beginPath(); g.moveTo(0,0); g.lineTo(-11,-6); g.lineTo(-11,6); g.closePath(); g.fill(); g.restore(); T(g,lab,(G.X(x1)+G.X(x2))/2+(side||10),(G.Y(y1)+G.Y(y2))/2,col,12,side<0?'right':'left','700'); }
  lev(1.8,0,'C + O₂'); lev(5,-110.5,'CO + ½O₂'); lev(8.2,-393.5,'CO₂');
  if(step==null||step>=0){ if(p===0||step!=null) arr(1.8,0,8.2,-393.5,C.blue,'−393.5（直達）',-8); }
  if(p===1||step!=null){ arr(1.8,0,5,-110.5,C.gold,'−110.5',10); if(step==null||step>=1) arr(5,-110.5,8.2,-393.5,step!=null?C.red:C.gold,step!=null?'？ = −283.0':'−283.0',10); } }
widget('w-hess',{state:{p:1},rw:0.45,rn:0.85,
  fmt:{p:function(v){return v?'繞路（先變 CO）':'直達';}},
  draw:function(g,c,s){ hessDraw(g,c,c.C,s.p,null); },
  out:function(s){ return s.p?'繞路：(−110.5) + (−283.0) = <b>−393.5 kJ</b>':'直達：C + O₂ → CO₂，ΔH = <b>−393.5 kJ</b>'; }
});
widget('s-F9',{state:{},steps:2,rw:0.45,rn:0.85,
  draw:function(g,c,s){ hessDraw(g,c,c.C,1,s.step); },
  out:steps(['直達（藍）−393.5 kJ = 前半段（金）−110.5 kJ + 後半段（紅，未知）。','後半段 = −393.5 − (−110.5) = <b>−283.0 kJ</b>。'])
});

/* F10 卡計 */
function calDraw(g,c,C,m,dt){ var P=panels(c,0.42), G=frame(P[0],-3,3,-0.5,6,14,true), h=1+m/300*3.4;
  box(g,G.X(-2),G.Y(5),4*G.sx,5*G.sy,null,C.ink,2.5); box(g,G.X(-2),G.Y(h),4*G.sx,h*G.sy,alpha(C.blue,0.25),null); T(g,m+' g 水',G.X(0),G.Y(h/2),C.blue,13,'center','700');
  var tY=1.2+dt/20*3.4; box(g,G.X(1.3),G.Y(5.6),0.3*G.sx,4.8*G.sy,C.sheet,C.ink,1.5); box(g,G.X(1.3),G.Y(tY),0.3*G.sx,(tY-0.8)*G.sy,C.red,null); T(g,'+'+dt+' °C',G.X(1.7),G.Y(tY),C.red,12,'left','700');
  var Q=m*4.18*dt, H=frame(P[1],-0.3,2.3,-0.1*26000,26000*1.1,24,false); axes(g,H,[0,2.2,0,26000],C,{xstep:5,ystep:5000,yfmt:function(v){return (v/1000)+' kJ';}});
  box(g,H.X(0.6),H.Y(Q),0.9*H.sx,Q*H.sy,alpha(C.red,0.35),C.red,2); T(g,'Q = '+(Q/1000).toFixed(2)+' kJ',H.X(1.05),H.Y(Q)-10,C.red,13,'center','700'); }
widget('w-cal',{state:{m:100,dt:5},rw:0.4,rn:0.8,
  fmt:{m:function(v){return v+' g';},dt:function(v){return v.toFixed(1)+' °C';}},
  draw:function(g,c,s){ calDraw(g,c,c.C,s.m,s.dt); },
  out:function(s){ var Q=s.m*4.18*s.dt; return 'Q = '+s.m+' × 4.18 × '+s.dt.toFixed(1)+' = '+Q.toFixed(0)+' J = <b>'+(Q/1000).toFixed(2)+' kJ</b>'; }
});
widget('s-F10',{state:{},steps:2,rw:0.4,rn:0.8,
  draw:function(g,c,s){ calDraw(g,c,c.C,100,5); },
  out:steps(['Q = m × s × ΔT = 100 × 4.18 × 5.0 = <b>2090 J</b>。','換成 kJ：2090 ÷ 1000 = <b>2.09 kJ</b>。'])
});
`
};
