/* lessons/src/CIV_H2_Ch3_4_Market.js — 高二公民與社會 第3章 市場機能、第4章 政府管制與外部效果（長榮版課本 p.56～109，tm_109、tm_110）.
   說明為改寫；供需圖為示意：紅茶用 P=60-0.1Q、P=0.1Q，雞蛋用 P=80-0.1Q、P=20+0.1Q（都符合課本圖上的點）。 */
"use strict";
module.exports = {
  lessonId: "CIV_H2_Ch3_4_Market",
  title: "市場機能・政府管制與外部效果・圖解教材",
  eyebrow: "公民與社會 ・ 第3章 市場機能 ＋ 第4章 政府管制與外部效果 ・ 高二上",
  h1: "價格怎麼指揮市場，政府什麼時候該出手",
  h1small: "供需找到均衡、剩餘看效率、管制與外部效果看取捨",
  subject: "CIV",
  unit: "CIV-H2-Ch3-4",
  sections: [
    {
      id: "3-1", short: "3-1", title: "3-1 市場價格的決定",
      plan: { goal: "會判斷超額需求與超額供給，說明價格如何把市場帶回均衡。", prereq: "願付價格、願售價格、需求線與供給線（第2章）。", time: "約 2 節課。課本 p.58～65。" },
      cards: [
        {
          id: "F1", title: "均衡：價格自己找到買賣雙方都同意的點", page: "p.58～63", tags: ["src"],
          say: "想像紅茶攤：<br>① 價格太低，想買的人比賣的多，這是<b>超額需求</b>（短缺），價格會被搶上去。<br>② 價格太高，賣的比買的多，這是<b>超額供給</b>（過剩），價格會被降下來。<br>③ 需求量＝供給量時，價格不再動，這就是<b>市場均衡</b>。<br>④ 交易量看比較少的那一邊：買賣要兩個人才成交。",
          formula: "需求量＝供給量 → 市場均衡　｜　價格低於均衡 → 超額需求 → 價格↑　｜　價格高於均衡 → 超額供給 → 價格↓",
          widget: { id: "w-eq", aria: "拖動市場價格，看需求量、供給量與交易量的變化", rw: 0.62, rn: 1.0,
            controls: [{ k: "p", label: "市場價格", min: 15, max: 50, step: 5 }] },
          space: "橫虛線是市場價格。藍點在需求線上，橘點在供給線上，兩點中間的紅線就是缺口。把價格拉到 30 元，缺口消失。",
          trap: "短缺時把需求量當成交易量。20 元時有 400 杯想買，但只有 200 杯能成交。",
          quiz: { q: "紅茶價格 40 元時，供給量 400 杯、需求量 200 杯。下列何者正確？", answer: "b", options: [
            { c: "a", text: "超額需求 200 杯，價格會上升", why: "賣的比買的多，是超額供給。" },
            { c: "b", text: "超額供給 200 杯，價格會下降" },
            { c: "c", text: "交易量 400 杯", why: "只有 200 杯有人買，交易量看較少的一邊。" },
            { c: "d", text: "市場已經均衡", why: "需求量不等於供給量，所以還沒均衡。" }] },
          sol: { id: "s-F1", aria: "逐步圖解：價格從 40 元回到均衡" }
        },
        {
          id: "F2", title: "看不見的手 vs 看得見的手", page: "p.64～65", tags: ["src"],
          say: "市場裡沒有總指揮：<br>① 每個人只看價格，決定買不買、賣不賣。<br>② 價格自動把資源送到最適合的人手上，所以叫<b>看不見的手</b>。<br>③ <b>海耶克</b>認為不需要最高指導者，願付價格與願售價格就是最重要的資訊。<br>④ 如果換成政府決定價格，就是<b>看得見的手</b>。哪一個比較好？第4章會回答。",
          formula: "看不見的手＝市場機能（價格自動調整）　｜　看得見的手＝政府管制（由政府決定價格或分配）",
          widget: { id: "w-hand", aria: "切換四個階段，看兩家藥局的口罩價格如何變化", rw: 0.5, rn: 0.9,
            controls: [{ k: "k", label: "階段", min: 0, max: 3, step: 1 }] },
          space: "階段 1、2 是市場自己調整，階段 3 疫情爆發，階段 4 政府限價。留意每一階段是誰決定價格。",
          trap: "以為看不見的手是某個大企業在幕後操控。它是所有人交易的結果，沒有人主導。",
          quiz: { q: "海耶克認為，決定市場交易最重要的資訊是什麼？", answer: "c", options: [
            { c: "a", text: "政府公告的物價", why: "他認為不需要最高指導者。" },
            { c: "b", text: "每個人的所得", why: "市場不需要知道每個人的所得。" },
            { c: "c", text: "願付價格與願售價格" },
            { c: "d", text: "廠商的廣告", why: "課本沒有提到廣告。" }] },
          sol: { id: "s-F2", aria: "逐步圖解：藥局為何調整價格" }
        }
      ]
    },
    {
      id: "3-2", short: "3-2", title: "3-2 供需變動的影響",
      plan: { goal: "會判斷單一變動與同時變動時，均衡價格與數量的方向。", prereq: "需求與供給的變動原因（第2章）。", time: "約 2 節課。課本 p.66～72。" },
      cards: [
        {
          id: "F3", title: "一條線移動：先問誰動了", page: "p.66～69", tags: ["src"],
          say: "三個步驟：<br>① 這件事影響買方還是賣方？<br>② 線往右（增加）還是往左（減少）？<br>③ 看新的交點。<br>需求變動時，價格和數量<b>同方向</b>；供給變動時，價格和數量<b>反方向</b>。",
          formula: "需求增加：價↑量↑　｜　需求減少：價↓量↓　｜　供給增加：價↓量↑　｜　供給減少：價↑量↓",
          widget: { id: "w-shift", aria: "切換四種供需變動，看均衡點移動", rw: 0.62, rn: 1.0,
            controls: [{ k: "k", label: "哪一種", min: 0, max: 3, step: 1 }] },
          space: "灰色是原來的線，彩色是移動後的線。E₁ 是原均衡，E₂ 是新均衡。",
          trap: "以為需求線右移 200，均衡數量就增加 200。價格上升會讓需求量減少，實際增加得比較少。",
          quiz: { q: "長賜輪阻塞運河，木漿運不到。若需求不變，紙類市場會如何？", answer: "d", options: [
            { c: "a", text: "需求減少，價格下降", why: "受影響的是賣方的原料，不是買方。" },
            { c: "b", text: "供給增加，價格下降", why: "原料變少，供給減少。" },
            { c: "c", text: "需求增加，價格上升", why: "買方沒有改變。" },
            { c: "d", text: "供給減少，價格上升、數量減少" }] },
          sol: { id: "s-F3", aria: "逐步圖解：供給線左移" }
        },
        {
          id: "F4", title: "兩條線一起動：同向定數量，反向定價格", page: "p.69～71", tags: ["src"],
          say: "兩條線都動時，只有一個答案確定：<br>① 需求、供給<b>同向</b>（都增加或都減少）：數量確定，價格不一定。<br>② 需求、供給<b>反向</b>：價格確定，數量不一定。<br>③ 不確定的那一個，要看誰動得比較多。",
          formula: "都增加：量↑ 價？　｜　都減少：量↓ 價？　｜　供給增、需求減：價↓ 量？　｜　需求增、供給減：價↑ 量？",
          widget: { id: "w-both", aria: "調整需求與供給的移動量，看新均衡", rw: 0.62, rn: 1.0,
            controls: [{ k: "d", label: "需求移動", min: -200, max: 200, step: 50 }, { k: "e", label: "供給移動", min: -200, max: 200, step: 50 }] },
          space: "先把需求與供給都調到＋100，再把供給改成＋200，看價格的方向改變，數量仍然增加。",
          trap: "不確定時硬選一個方向。答案常常就是「無法確定」。",
          quiz: { q: "舊型顯示卡的需求減少，礦工又把舊卡賣到二手市場。哪一項可以確定？", answer: "a", options: [
            { c: "a", text: "價格下降，數量無法確定" },
            { c: "b", text: "數量減少，價格無法確定", why: "需求與供給反向時，確定的是價格。" },
            { c: "c", text: "價格上升", why: "需求減少、供給增加都讓價格下降。" },
            { c: "d", text: "數量增加", why: "需求減少讓數量減少，供給增加讓數量增加，方向相反。" }] },
          sol: { id: "s-F4", aria: "逐步圖解：反向變動時數量不確定" }
        }
      ]
    },
    {
      id: "3-3", short: "3-3", title: "3-3 市場機能與經濟效率",
      plan: { goal: "會在圖上找消費者剩餘、生產者剩餘與無謂損失，判斷生產是否有效率。", prereq: "願付價格、願售價格、市場均衡。", time: "約 2 節課。課本 p.73～80。" },
      cards: [
        {
          id: "F5", title: "剩餘：交易讓買賣雙方賺到多少", page: "p.73～76", tags: ["src"],
          say: "把好處算成面積：<br>① 消費者賺到願付與實付的差，是價格線<b>上方</b>的三角形。<br>② 生產者賺到實收與成本的差，是價格線<b>下方</b>的三角形。<br>③ 兩塊加起來是<b>社會福利</b>，均衡時最大。<br>④ 交易量被限制，少掉的那塊就是<b>無謂損失</b>。",
          formula: "消費者剩餘＝願付總和－實付總和　｜　生產者剩餘＝實收總額－願售總和　｜　社會福利＝消費者剩餘＋生產者剩餘",
          widget: { id: "w-surplus", aria: "限制交易量，看兩種剩餘與無謂損失的面積", rw: 0.62, rn: 1.0,
            controls: [{ k: "q", label: "交易量", min: 50, max: 300, step: 25 }] },
          space: "藍色是消費者剩餘，橘色是生產者剩餘，紅色三角形是無謂損失。把交易量拉回 300 杯，紅色消失。",
          trap: "把交易總金額當成剩餘。總金額包含成本，生產者剩餘要扣掉成本。",
          quiz: { q: "市價 40 元。甲、乙、丙願付 50、40、30 元。消費者剩餘合計多少？", answer: "b", options: [
            { c: "a", text: "0 元", why: "甲賺到 10 元。" },
            { c: "b", text: "10 元" },
            { c: "c", text: "20 元", why: "丙不會買，沒有剩餘。" },
            { c: "d", text: "120 元", why: "這是願付價格總和，不是剩餘。" }] },
          sol: { id: "s-F5", aria: "逐步圖解：計算消費者剩餘" }
        },
        {
          id: "F6", title: "有效率：願付 ≥ 成本才值得生產", page: "p.77～80", tags: ["src"],
          say: "判斷有沒有效率只要比一件事：<br>① 這件產品有人願付多少？生產它要花多少？<br>② 願付 ≥ 成本：值得生產。<br>③ 願付 ＜ 成本：生產反而有損失。<br>④ 生產到兩者相等，就是均衡點，社會福利最大。<br>但有效率不代表公平：<b>黃牛票</b>讓票到願付最高的人手上，卻不一定是社會想要的結果。",
          formula: "願付價格 ≥ 生產成本 → 有效率　｜　均衡點：最後一件的價值＝成本　｜　公平與效率通常有抵換關係",
          widget: { id: "w-eff", aria: "選擇第幾杯紅茶，比較願付價格與生產成本", rw: 0.62, rn: 1.0,
            controls: [{ k: "q", label: "第幾杯", min: 100, max: 500, step: 50 }] },
          space: "直線段的上端是這一杯的願付價格，下端是成本。藍色代表值得生產，紅色代表生產反而損失。",
          trap: "以為有人買就是有效率。若價值低於成本，社會整體是損失的。",
          quiz: { q: "第 501 杯紅茶的成本是 41 元，最多只有人願付 39 元。下列何者正確？", answer: "c", options: [
            { c: "a", text: "有效率，因為有人願意買", why: "願付低於成本。" },
            { c: "b", text: "有效率，因為生產者賺 2 元", why: "收 39、花 41，生產者賠 2 元。" },
            { c: "c", text: "沒有效率，會造成 2 元損失" },
            { c: "d", text: "無法判斷", why: "比較願付與成本就能判斷。" }] },
          sol: { id: "s-F6", aria: "逐步圖解：黃牛票的效率與公平" }
        }
      ]
    },
    {
      id: "4-1", short: "4-1", title: "4-1 價格管制與經濟效率",
      plan: { goal: "會分析價格上限與下限的效果，說明誰受益、誰受損。", prereq: "剩餘與無謂損失。", time: "約 3 節課。課本 p.84～92。" },
      cards: [
        {
          id: "F7", title: "價格上限：想幫買方，卻讓東西變少", page: "p.84～87", tags: ["src"],
          say: "用缺蛋潮來看：<br>① 上限低於均衡價，成本較高的蛋農不生產。<br>② 價格低，想買的人更多，出現<b>短缺</b>。<br>③ 交易量由 300 萬斤掉到 200 萬斤，少掉的交易就是<b>無謂損失</b>。<br>④ 買到的人賺到，買不到的人受損，所以消費者剩餘<b>不一定</b>增加。",
          formula: "上限＜均衡價：價↓、量↓、生產者剩餘↓、社會福利↓、消費者剩餘不一定　｜　上限 ≥ 均衡價：沒有作用",
          widget: { id: "w-ceil", aria: "調整價格上限，看短缺與剩餘的變化", rw: 0.62, rn: 1.0,
            controls: [{ k: "c", label: "價格上限", min: 24, max: 60, step: 2 }] },
          space: "把上限拉到 50 元以上，圖不再變化；往下拉，紅色三角形變大。再比較消費者剩餘的數字，會先變大再變小。圖中剩餘的算法假設願付最高的人先買到。",
          trap: "看到上限就判斷短缺。要先比較上限與均衡價。",
          quiz: { q: "均衡價 50 元，政府訂價格上限 60 元，市場會如何？", answer: "d", options: [
            { c: "a", text: "一定短缺", why: "上限高於均衡價，沒有壓低價格。" },
            { c: "b", text: "一定過剩", why: "價格仍可在均衡價交易。" },
            { c: "c", text: "價格漲到 60 元", why: "上限只是不可超過，不是要求賣到這個價格。" },
            { c: "d", text: "沒有影響，仍在 50 元交易" }] },
          sol: { id: "s-F7", aria: "逐步圖解：上限 40 元的效果" }
        },
        {
          id: "F8", title: "價格下限：最低工資的兩面", page: "p.88～92", tags: ["src"],
          say: "勞動市場裡，勞工是<b>賣方</b>，雇主是<b>買方</b>，工資是價格。<br>① 最低工資高於均衡工資，雇主少聘人。<br>② 想工作的人變多，出現<b>過剩</b>（有人找不到工作）。<br>③ 有工作的人薪水變高，所以勞工不一定都受益。<br>④ 學界對實際效果<b>尚無定論</b>；政策還要考慮人權與社會公平。",
          formula: "下限＞均衡價：價↑、量↓、消費者剩餘↓、社會福利↓、生產者剩餘不一定　｜　2026 年月薪不得低於 29,500 元",
          widget: { id: "w-floor", aria: "調整最低工資，看勞動過剩與剩餘的變化（示意）", rw: 0.62, rn: 1.0,
            controls: [{ k: "c", label: "最低工資", min: 44, max: 76, step: 2 }] },
          space: "這張圖是示意，工資用指數表示。在這裡，雇主的剩餘相當於消費者剩餘，勞工的剩餘相當於生產者剩餘。",
          trap: "把勞工當成需求方。勞工提供勞動力，是供給者。",
          quiz: { q: "最低工資訂定後，勞動需求量 90 人、供給量 120 人。下列何者正確？", answer: "a", options: [
            { c: "a", text: "受僱 90 人，30 人找不到工作" },
            { c: "b", text: "受僱 120 人", why: "雇主只想聘 90 人。" },
            { c: "c", text: "缺工 30 人", why: "想工作的人比職缺多，是過剩。" },
            { c: "d", text: "受僱 105 人", why: "交易量看較少的一邊，不是平均。" }] },
          sol: { id: "s-F8", aria: "逐步圖解：表4-1 上限與下限的比較" }
        }
      ]
    },
    {
      id: "4-2", short: "4-2", title: "4-2 政府對聯合漲價的規範",
      plan: { goal: "會判斷聯合行為的要件，分辨聯合、結合與不公平競爭。", prereq: "市場機能、經濟效率。", time: "約 2 節課。課本 p.93～99。" },
      cards: [
        {
          id: "F9", title: "一家漲沒用，一起漲才有事", page: "p.93～96", tags: ["src"],
          say: "① 一家超商單獨漲價，客人走到隔壁，賺不到更多。<br>② 所有廠商<b>說好一起漲</b>，客人沒地方去，這就是聯合漲價，組織叫<b>卡特爾</b>。<br>③ 廠商少、產品差不多時，最有誘因聯合。<br>④ 但是協議不容易維持：成員偷偷增產就能多賺，OPEC 就有這種情形。",
          formula: "單獨漲價 → 客人流失　｜　聯合漲價 → 消費者被迫付高價、廠商不再積極競爭　｜　偷偷增產 → 供給增加、價格下跌",
          widget: { id: "w-cartel", aria: "切換四種情境，看三家廠商的價格與客人的流向", rw: 0.5, rn: 0.9,
            controls: [{ k: "k", label: "情境", min: 0, max: 3, step: 1 }] },
          space: "柱子高度是價格。箭頭是客人的流向。比較情境 2 與情境 3，客人有沒有地方去。",
          trap: "以為聯合之後價格就能一直維持。牽涉利益分配，協議很難長久。",
          quiz: { q: "OPEC 達成減產協議後，某成員私下增產，對油價的影響是？", answer: "b", options: [
            { c: "a", text: "供給減少，油價上升", why: "私下增產使供給增加。" },
            { c: "b", text: "供給增加，油價下跌" },
            { c: "c", text: "需求增加，油價上升", why: "買方沒有改變。" },
            { c: "d", text: "油價不受影響", why: "供給改變，均衡就會改變。" }] },
          sol: { id: "s-F9", aria: "逐步圖解：鮮乳聯合漲價案" }
        },
        {
          id: "F10", title: "聯合行為的判斷：同時漲價不等於聯合", page: "p.96～99", tags: ["src"],
          say: "公平交易法要看三件事：<br>① 是<b>同一階段</b>有競爭關係的廠商嗎？<br>② 有<b>合意</b>嗎？（契約、協議或其他方式）<br>③ 足以<b>影響市場功能</b>嗎？<br>都成立才是聯合行為。原物料上漲造成的同時漲價不算。<br>另外採<b>原則禁止、例外許可</b>：對整體經濟有益的聯合，經公平會許可就可以做。",
          formula: "聯合行為＝同一階段競爭關係＋合意＋足以影響市場功能　｜　原則禁止、例外許可　｜　結合：市占 1/3 以上要注意",
          widget: { id: "w-law", aria: "切換案例，看是否符合三個要件", rw: 0.5, rn: 0.9,
            controls: [{ k: "k", label: "案例", min: 0, max: 4, step: 1 }] },
          space: "三個格子對應三個要件，綠色代表成立，紅色代表不成立。先自己判斷，再看結論。",
          trap: "以為聯合行為一律違法。統一規格、共同研發、不景氣、中小企業聯合等可以申請許可。",
          quiz: { q: "下列何者是原則禁止的惡性卡特爾行為，不能申請例外許可？", answer: "c", options: [
            { c: "a", text: "統一商品規格", why: "這是可申請許可的項目。" },
            { c: "b", text: "中小企業聯合", why: "這是可申請許可的項目。" },
            { c: "c", text: "固定價格" },
            { c: "d", text: "共同研究開發", why: "這是可申請許可的項目。" }] },
          sol: { id: "s-F10", aria: "逐步圖解：三要件檢查" }
        }
      ]
    },
    {
      id: "4-3", short: "4-3", title: "4-3 外部效果的因應",
      plan: { goal: "會判斷外部效益與外部成本，比較政府的五種對策。", prereq: "供給移動、私人成本。", time: "約 3 節課。課本 p.100～108。" },
      cards: [
        {
          id: "F11", title: "外部效果：第三人被影響了", page: "p.100～102", tags: ["src"],
          say: "先找<b>第三人</b>：<br>① 第三人得到好處：外部效益（門口的燈讓路人安心）。<br>② 第三人受到損害：外部成本（工廠廢水害到漁民）。<br>③ 廠商沒算到外部成本，覺得生產很便宜，就會<b>生產太多</b>。<br>④ 課稅讓廠商把這筆成本算進去，這叫<b>內部化</b>。",
          formula: "社會效益＝私人效益＋外部效益　｜　社會成本＝私人成本＋外部成本　｜　內部化：把外部成本計入私人成本",
          widget: { id: "w-ext", aria: "調整每雙球鞋的外部成本，看社會成本線與適當產量", rw: 0.62, rn: 1.0,
            controls: [{ k: "e", label: "外部成本", min: 0, max: 20, step: 2 }] },
          space: "橘線是廠商看到的成本，紅線是社會真正負擔的成本。兩線的距離就是外部成本。紅線與需求線的交點才是社會想要的產量。",
          trap: "把買賣雙方自己付的錢當成外部成本。外部成本是第三人承擔的。",
          quiz: { q: "廠商每年私人成本 800 萬元，廢水使下游損失 300 萬元。社會成本是多少？", answer: "d", options: [
            { c: "a", text: "300 萬元", why: "這只是外部成本。" },
            { c: "b", text: "500 萬元", why: "社會成本是相加，不是相減。" },
            { c: "c", text: "800 萬元", why: "這只是私人成本。" },
            { c: "d", text: "1,100 萬元" }] },
          sol: { id: "s-F11", aria: "逐步圖解：課稅使外部成本內部化" }
        },
        {
          id: "F12", title: "寇斯：把權利說清楚，雙方可以自己談", page: "p.103", tags: ["src"],
          say: "外部成本常常是因為河流不知道是誰的。<br>① 權利是漁民的：球鞋廠要付錢，或自己解決廢水。<br>② 權利是球鞋廠的：漁民可以主動協商，請工廠減少汙染。<br>③ 寇斯認為，<b>財產權明確</b>且<b>沒有其他交易成本</b>時，雙方能自己解決。",
          formula: "外部成本的主因：財產權歸屬不明　｜　寇斯：財產權明確＋沒有其他交易成本 → 自願交換解決",
          widget: { id: "w-coase", aria: "切換河流使用權的歸屬，看雙方怎麼協商", rw: 0.5, rn: 0.9,
            controls: [{ k: "k", label: "情況", min: 0, max: 2, step: 1 }] },
          space: "看箭頭：錢往哪邊流？不論權利給誰，只要說得清楚，雙方都可以談。",
          trap: "以為寇斯的方法一定可行。交易成本高、人數太多時談不成，就要由政府介入。",
          quiz: { q: "若球鞋廠擁有河流使用權，依寇斯的看法該怎麼減少汙染？", answer: "a", options: [
            { c: "a", text: "漁民主動與球鞋廠協商" },
            { c: "b", text: "球鞋廠必須賠償漁民", why: "權利在球鞋廠，它沒有賠償的義務。" },
            { c: "c", text: "無法減少汙染", why: "雙方仍可以協商。" },
            { c: "d", text: "只能靠政府關廠", why: "財產權明確時可以自願交換。" }] },
          sol: { id: "s-F12", aria: "逐步圖解：談不成時怎麼辦" }
        },
        {
          id: "F13", title: "政府的五種工具", page: "p.104～108", tags: ["src"],
          say: "政府有五種做法：<br>① <b>建立制度</b>：財產權、資訊公開。<br>② <b>汙染者付費</b>：排得多，付得多。<br>③ <b>直接管制</b>：用法令禁止或限制。<br>④ <b>課稅或補貼</b>：外部成本課稅，外部效益補貼。<br>⑤ <b>碳權排放交易</b>：把排碳額度變成可以買賣的商品。<br>目標是適當的水準，不是把汙染降到零。",
          formula: "建立制度　｜　汙染者付費　｜　直接管制　｜　課稅或補貼　｜　建立汙染排放權交易市場",
          widget: { id: "w-tools", aria: "切換五種政策工具，看例子與作用方式", rw: 0.5, rn: 0.9,
            controls: [{ k: "k", label: "工具", min: 0, max: 4, step: 1 }] },
          space: "每一種工具都在回答同一個問題：怎麼讓行為者把第三人的損失算進自己的決策？",
          trap: "把空汙費當成直接管制。繳費是汙染者付費；用法令禁止才是直接管制。",
          quiz: { q: "超過配額的高汙染企業向低汙染企業購買排碳額度，這屬於哪一種工具？", answer: "c", options: [
            { c: "a", text: "直接管制", why: "企業可以自己選擇買或減排，不是直接禁止。" },
            { c: "b", text: "補貼", why: "沒有政府給錢。" },
            { c: "c", text: "碳權排放交易" },
            { c: "d", text: "建立資訊公開制度", why: "資訊公開是標示產地這類做法。" }] },
          sol: { id: "s-F13", aria: "逐步圖解：碳權交易" }
        }
      ]
    }
  ],
  footer: [
    "長榮高中高二公民與社會課本 第3章 市場機能、第4章 政府管制與外部效果（p.56～109）。本頁說明為改寫。",
    "供需圖的數字取自課本圖上的點，線的方程式為配合這些點的示意；最低工資圖為示意。"
  ],
  script: String.raw`
var GREEN='#2e8b57', ORANGE='#d9822b', PURPLE='#7a4fb5';
function arrow(g,x1,y1,x2,y2,c,w){ var a=Math.atan2(y2-y1,x2-x1), h=6+(w||2)*2; if(Math.hypot(x2-x1,y2-y1)<2) return; L(g,x1,y1,x2-Math.cos(a)*h*0.6,y2-Math.sin(a)*h*0.6,c,w||2); g.save(); g.fillStyle=c; g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-h*Math.cos(a-0.4),y2-h*Math.sin(a-0.4)); g.lineTo(x2-h*Math.cos(a+0.4),y2-h*Math.sin(a+0.4)); g.closePath(); g.fill(); g.restore(); }
function V(g,G,x1,y1,x2,y2,c,w){ arrow(g,G.X(x1),G.Y(y1),G.X(x2),G.Y(y2),c,w); }
function rbox(g,G,x,y,w,h,fill,stroke,lab,fs,col){ box(g,G.X(x),G.Y(y+h),w*G.sx,h*G.sy,fill,stroke,1.5); if(lab) T(g,lab,G.X(x+w/2),G.Y(y+h/2),col||'#333',fs,'center','700'); }
function money(v){ return Math.round(v).toLocaleString('en-US'); }
function fsz(c){ return c.narrow?11:13; }

/* 共用供需圖 */
function plane(c,ymax){ return frame(full(c),-70,640,-(ymax||68)*0.14,(ymax||68)*1.03,20,false); }
function axesPQ(g,G,C,fs,ymax,yl,xl,yt){ var top=ymax||66; L(g,G.X(0),G.Y(0),G.X(630),G.Y(0),C.ink,1.5); L(g,G.X(0),G.Y(0),G.X(0),G.Y(top),C.ink,1.5);
  T(g,yl||'P（元）',G.X(12),G.Y(top),C.muted,fs-1,'left','700'); T(g,xl||'Q（杯）',G.X(630),G.Y(-top*0.09),C.muted,fs-1,'right','700');
  (yt||[10,20,30,40,50,60]).forEach(function(v){ L(g,G.X(-5),G.Y(v),G.X(5),G.Y(v),C.ink,1); T(g,String(v),G.X(-12),G.Y(v),C.muted,fs-2,'right'); });
  [100,200,300,400,500,600].forEach(function(v){ L(g,G.X(v),G.Y(-0.8),G.X(v),G.Y(0.8),C.ink,1); T(g,String(v),G.X(v),G.Y(-top*0.05),C.muted,fs-2,'center'); }); }
function td(q,d){ return 60-0.1*(q-(d||0)); }
function ts(q,e){ return 0.1*(q-(e||0)); }
function lineD(g,G,C,d,col,w,dash){ var a=Math.max(0,(d||0)),b=Math.min(620,(d||0)+560); plot(g,G,function(q){ return td(q,d); },a,b,col||C.blue,w||3,dash); }
function lineS(g,G,C,e,col,w,dash){ var a=Math.max(0,(e||0)+10),b=Math.min(620,(e||0)+620); plot(g,G,function(q){ return ts(q,e); },a,b,col||ORANGE,w||3,dash); }
function eq(d,e){ var q=300+(d+e)/2; return {q:q,p:ts(q,e)}; }

/* F1 均衡 */
function eqDraw(g,c,C,p){ var G=plane(c), fs=fsz(c), qd=(60-p)*10, qs=p*10; axesPQ(g,G,C,fs); lineD(g,G,C); lineS(g,G,C);
  L(g,G.X(0),G.Y(p),G.X(610),G.Y(p),alpha(C.ink,0.5),1.5,[5,4]); L(g,G.X(Math.min(qd,qs)),G.Y(p),G.X(Math.max(qd,qs)),G.Y(p),C.red,3.5);
  dot(g,G.X(qd),G.Y(p),6,C.blue); dot(g,G.X(qs),G.Y(p),6,ORANGE); T(g,'D',G.X(590),G.Y(4),C.blue,fs,'left','700'); T(g,'S',G.X(600),G.Y(62),ORANGE,fs,'left','700');
  T(g,p<30?'超額需求':p>30?'超額供給':'市場均衡',G.X(320),G.Y(64),p===30?GREEN:C.red,fs+3,'center','700'); }
widget('w-eq',{state:{p:20},rw:0.62,rn:1.0,fmt:{p:function(v){ return v+' 元'; }},
  draw:function(g,c,s){ eqDraw(g,c,c.C,s.p); },
  out:function(s){ var qd=(60-s.p)*10, qs=s.p*10; return s.p===30?'需求量 300 杯＝供給量 300 杯 → <b>市場均衡</b>，交易量 300 杯':'需求量 '+qd+' 杯、供給量 '+qs+' 杯 → '+(qd>qs?'<b>超額需求 ':'<b>超額供給 ')+Math.abs(qd-qs)+' 杯</b>，交易量 '+Math.min(qd,qs)+' 杯，價格有向'+(qd>qs?'上':'下')+'的壓力'; }
});
widget('s-F1',{state:{},steps:3,rw:0.62,rn:1.0,
  draw:function(g,c,s){ eqDraw(g,c,c.C,[40,35,30][s.step]); },
  out:steps(['40 元：供給 400、需求 200，過剩 200 杯，賣不掉的廠商開始降價。','35 元：供給 350、需求 250，過剩減少為 100 杯，交易量增加到 250 杯。','30 元：供給＝需求＝300 杯，<b>達到均衡</b>，價格不再變動。'])
});

/* F2 手 */
var HAND=[['市場機能','★★藥局 8 元','○○藥局 4 元','8 元太貴，客人走到 ○○ 藥局'],['市場機能','★★藥局 6 元','○○藥局 4 元（售完）','賣不出去只好降價，4 元的很快賣完'],['疫情爆發','藥局 25 元（售完）','很多藥局缺貨','搶口罩，價格被抬高，還是買不到'],['政府管制','★★藥局 5 元','○○藥局 5 元','政府限價並實名制，但沒賺頭會不會就不賣了？']];
function handDraw(g,c,C,k){ var G=frame(full(c),0,24,0,14,14,false), fs=fsz(c), h=HAND[k], col=k<2?PURPLE:k===2?C.teal:GREEN;
  rbox(g,G,1,11,22,2.4,alpha(col,0.2),col,(k<2?'看不見的手・':k===3?'看得見的手・':'')+h[0],fs+2,C.ink);
  rbox(g,G,1,5.5,10.5,4.2,alpha(C.blue,0.08),C.blue,h[1],fs+1,C.ink); rbox(g,G,12.5,5.5,10.5,4.2,alpha(ORANGE,0.1),ORANGE,h[2],fs+1,C.ink);
  T(g,h[3],G.X(12),G.Y(3),C.ink,fs,'center','500'); }
widget('w-hand',{state:{k:0},rw:0.5,rn:0.9,fmt:{k:function(v){ return '階段 '+(v+1); }},
  draw:function(g,c,s){ handDraw(g,c,c.C,s.k); },
  out:function(s){ return s.k<2?'價格由市場決定，廠商與消費者各自反應':s.k===2?'需求突然大增，出現搶購與哄抬':'價格由政府決定，這是<b>看得見的手</b>'; }
});
widget('s-F2',{state:{},steps:2,rw:0.5,rn:0.9,
  draw:function(g,c,s){ handDraw(g,c,c.C,s.step); },
  out:steps(['★★藥局標 8 元，客人走掉了。這個拒絕購買的行動就是資訊。','藥局不用問任何人，看到賣不掉就知道要降價：價格傳遞了願付價格的資訊。'])
});

/* F3 單邊移動 */
var SHF=[['需求增加',120,0,'黃沙使口罩需求大增','價格↑ 數量↑'],['需求減少',-120,0,'疫情使石油需求減少','價格↓ 數量↓'],['供給增加',0,120,'頁岩油開採技術、OPEC 增產','價格↓ 數量↑'],['供給減少',0,-120,'長賜輪阻塞，紙類供給減少','價格↑ 數量↓']];
function shDraw(g,c,C,d,e,lab){ var G=plane(c), fs=fsz(c), a=eq(0,0), b=eq(d,e); axesPQ(g,G,C,fs);
  lineD(g,G,C,0,d?alpha(C.muted,0.7):C.blue,d?2:3); lineS(g,G,C,0,e?alpha(C.muted,0.7):ORANGE,e?2:3);
  if(d) lineD(g,G,C,d,C.blue,3); if(e) lineS(g,G,C,e,ORANGE,3);
  L(g,G.X(a.q),G.Y(0),G.X(a.q),G.Y(a.p),alpha(C.ink,0.3),1,[4,4]); L(g,G.X(0),G.Y(a.p),G.X(a.q),G.Y(a.p),alpha(C.ink,0.3),1,[4,4]);
  L(g,G.X(b.q),G.Y(0),G.X(b.q),G.Y(b.p),alpha(C.red,0.6),1,[4,4]); L(g,G.X(0),G.Y(b.p),G.X(b.q),G.Y(b.p),alpha(C.red,0.6),1,[4,4]);
  dot(g,G.X(a.q),G.Y(a.p),5,C.ink); dot(g,G.X(b.q),G.Y(b.p),6,C.red); T(g,'E₁',G.X(a.q),G.Y(a.p+4),C.ink,fs,'center','700'); if(d||e) T(g,'E₂',G.X(b.q),G.Y(b.p+4),C.red,fs,'center','700');
  if(lab) T(g,lab,G.X(330),G.Y(64),C.red,fs+2,'center','700'); }
widget('w-shift',{state:{k:0},rw:0.62,rn:1.0,fmt:{k:function(v){ return SHF[v][0]; }},
  draw:function(g,c,s){ var h=SHF[s.k]; shDraw(g,c,c.C,h[1],h[2],h[0]+'：'+h[4]); },
  out:function(s){ var h=SHF[s.k]; return h[3]+' → '+(h[1]?'需求線':'供給線')+(h[1]+h[2]>0?'右移':'左移')+' → <b>'+h[4]+'</b>'; }
});
widget('s-F3',{state:{},steps:3,rw:0.62,rn:1.0,
  draw:function(g,c,s){ shDraw(g,c,c.C,0,s.step?-120:0,''); },
  out:steps(['先問誰動了：木漿運不到，影響的是<b>賣方</b>的原料。','供給減少，供給線左移，在原價格下出現超額需求。','新交點 E₂ 比較高、比較左：<b>價格上升、數量減少</b>。'])
});

/* F4 同時移動 */
function bothText(d,e){ var dq=(d+e)/2, dp=0.05*(d-e); var A=dp>0?'價格上升':dp<0?'價格下降':'價格不變', B=dq>0?'數量增加':dq<0?'數量減少':'數量不變'; return A+'、'+B; }
function bothRule(d,e){ if(!d||!e) return '只有一條線移動'; if(d*e>0) return '同向：數量確定'+(d>0?'增加':'減少')+'，價格看幅度'; return '反向：價格確定'+(d>0?'上升':'下降')+'，數量看幅度'; }
widget('w-both',{state:{d:100,e:100},rw:0.62,rn:1.0,fmt:{d:function(v){ return (v>0?'＋':v<0?'－':'')+Math.abs(v); },e:function(v){ return (v>0?'＋':v<0?'－':'')+Math.abs(v); }},
  draw:function(g,c,s){ shDraw(g,c,c.C,s.d,s.e,''); },
  out:function(s){ return bothRule(s.d,s.e)+' → 這一次的結果：<b>'+bothText(s.d,s.e)+'</b>'; }
});
var BSOL=[[-100,100],[-100,200],[-200,100]];
widget('s-F4',{state:{},steps:3,rw:0.62,rn:1.0,
  draw:function(g,c,s){ var b=BSOL[s.step]; shDraw(g,c,c.C,b[0],b[1],bothText(b[0],b[1])); },
  out:steps(['需求減少＋供給增加：幅度相同時，價格下降、數量不變。','供給增加得比較多：價格仍下降，數量增加。','需求減少得比較多：價格仍下降，數量減少。所以<b>價格確定下降，數量無法確定</b>。'])
});

/* F5 剩餘 */
function surDraw(g,c,C,q){ var G=plane(c), fs=fsz(c), pq=td(q), sq=ts(q); axesPQ(g,G,C,fs);
  poly(g,G,[[0,60],[q,pq],[q,30],[0,30]],alpha(C.blue,0.25)); poly(g,G,[[0,0],[q,sq],[q,30],[0,30]],alpha(ORANGE,0.3));
  if(q<300) poly(g,G,[[q,pq],[300,30],[q,sq]],alpha(C.red,0.45));
  plot(g,G,function(x){ return td(x); },0,560,C.blue,3); plot(g,G,function(x){ return ts(x); },10,600,ORANGE,3);
  L(g,G.X(0),G.Y(30),G.X(400),G.Y(30),alpha(C.ink,0.5),1.5,[5,4]); T(g,'消費者剩餘',G.X(Math.max(70,q*0.36)),G.Y(36),C.blue,fs-1,'center','700'); T(g,'生產者剩餘',G.X(Math.max(70,q*0.36)),G.Y(24),ORANGE,fs-1,'center','700');
  if(q<300) T(g,'無謂損失',G.X(420),G.Y(38),C.red,fs,'left','700'); }
function surVals(q){ var cs=30*q-0.05*q*q, dw=(td(q)-ts(q))*(300-q)/2; return {cs:cs,dw:dw}; }
widget('w-surplus',{state:{q:200},rw:0.62,rn:1.0,fmt:{q:function(v){ return v+' 杯'; }},
  draw:function(g,c,s){ surDraw(g,c,c.C,s.q); },
  out:function(s){ var r=surVals(s.q); return '消費者剩餘 '+money(r.cs)+' ＋ 生產者剩餘 '+money(r.cs)+' ＝ 社會福利 <b>'+money(2*r.cs)+' 元</b>；無謂損失 <b>'+money(r.dw)+' 元</b>'+(s.q===300?'（均衡時最大）':''); }
});
function stepsBar(g,c,C,st){ var G=frame(full(c),0,70,-8,62,18,false), fs=fsz(c), L1=[['甲',50],['乙',40],['丙',30]];
  L(g,G.X(0),G.Y(40),G.X(66),G.Y(40),C.red,2,[5,4]); T(g,'市價 40',G.X(66),G.Y(44),C.red,fs,'right','700');
  L1.forEach(function(p,i){ var x=4+i*21; box(g,G.X(x),G.Y(p[1]),15*G.sx,p[1]*G.sy,alpha(C.blue,0.18),C.blue,1.5); T(g,p[0]+' 願付 '+p[1],G.X(x+7.5),G.Y(-4),C.ink,fs,'center','700');
    if(st>=1&&p[1]>40) box(g,G.X(x),G.Y(p[1]),15*G.sx,(p[1]-40)*G.sy,alpha(C.blue,0.6),null); if(st>=1) T(g,p[1]>40?'賺 10':p[1]===40?'賺 0':'不買',G.X(x+7.5),G.Y(p[1]+4),p[1]<40?C.muted:C.blue,fs,'center','700'); }); }
widget('s-F5',{state:{},steps:2,rw:0.55,rn:0.95,
  draw:function(g,c,s){ stepsBar(g,c,c.C,s.step); },
  out:steps(['每個人比較願付價格與市價 40 元。','甲賺 10、乙賺 0、丙不買 → 消費者剩餘合計 <b>10 元</b>。'])
});

/* F6 效率 */
widget('w-eff',{state:{q:200},rw:0.62,rn:1.0,fmt:{q:function(v){ return '第 '+v+' 杯'; }},
  draw:function(g,c,s){ var G=plane(c), C=c.C, fs=fsz(c), a=td(s.q), b=ts(s.q), ok=a>=b; axesPQ(g,G,C,fs); lineD(g,G,C); lineS(g,G,C); L(g,G.X(s.q),G.Y(a),G.X(s.q),G.Y(b),ok?C.blue:C.red,5); dot(g,G.X(s.q),G.Y(a),5,C.blue); dot(g,G.X(s.q),G.Y(b),5,ORANGE); dot(g,G.X(300),G.Y(30),5,C.ink); T(g,'E',G.X(300),G.Y(35),C.ink,fs,'center','700'); },
  out:function(s){ var a=td(s.q), b=ts(s.q); return '願付 '+a+' 元、成本 '+b+' 元 → '+(a>b?'<b>值得生產</b>，社會多賺 '+(a-b)+' 元':a===b?'<b>剛好相等</b>，這就是均衡點':'<b>不值得生產</b>，社會損失 '+(b-a)+' 元'); }
});
var FAIR=[['固定票價','願付高的人買不到票','效率低'],['黃牛轉售','票到願付最高的人手上','有效率，但富人優先'],['禁止黃牛','大家用合理價格買票','較公平，犧牲一些效率']];
widget('s-F6',{state:{},steps:3,rw:0.5,rn:0.9,
  draw:function(g,c,s){ var G=frame(full(c),0,24,0,12,14,false), C=c.C, fs=fsz(c); FAIR.forEach(function(r,i){ var on=i===s.step, y=8.2-i*3.6; rbox(g,G,1,y,22,3,on?alpha(PURPLE,0.2):alpha(C.ink,0.04),on?PURPLE:alpha(C.ink,0.25),r[0]+'：'+r[1],fs,C.ink); }); },
  out:function(s){ return ['固定票價下，願付價格高的人可能買不到。原先的分配沒有效率。','黃牛把票賣給願付最高的人：有利可圖，正是因為原本沒有效率。','若社會希望不論貧富都能入場，就禁止黃牛。公平與效率有<b>抵換關係</b>。'][s.step]; }
});

/* F7、F8 管制 */
function ed(q){ return 80-0.1*q; } function es(q){ return 20+0.1*q; }
function ctrlVals(c,floor){ var bind=floor?c>50:c<50, q=bind?(floor?(80-c)*10:(c-20)*10):300, p=bind?c:50; var cs=(80-p)*q-0.05*q*q, ps=(p-20)*q-0.05*q*q, dw=(ed(q)-es(q))*(300-q)/2; return {bind:bind,q:q,p:p,cs:cs,ps:ps,dw:dw,qd:(80-p)*10,qs:(p-20)*10}; }
function ctrlDraw(g,c,C,v,floor,yl,xl){ var G=plane(c,85), fs=fsz(c), r=ctrlVals(v,floor), q=r.q, p=r.p; axesPQ(g,G,C,fs,84,yl,xl,[20,40,60,80]);
  poly(g,G,[[0,80],[q,ed(q)],[q,p],[0,p]],alpha(C.blue,0.22)); poly(g,G,[[0,20],[q,es(q)],[q,p],[0,p]],alpha(ORANGE,0.28));
  if(r.bind){ if(floor) poly(g,G,[[q,ed(q)],[300,50],[q,es(q)]],alpha(C.red,0.45)); else poly(g,G,[[q,ed(q)],[300,50],[q,es(q)]],alpha(C.red,0.45)); }
  plot(g,G,function(x){ return ed(x); },0,600,C.blue,3); plot(g,G,function(x){ return es(x); },0,600,ORANGE,3); L(g,G.X(0),G.Y(v),G.X(620),G.Y(v),r.bind?C.red:alpha(C.muted,0.8),2,[6,4]);
  T(g,(floor?'下限 ':'上限 ')+v,G.X(622),G.Y(v+4),r.bind?C.red:C.muted,fs,'right','700'); dot(g,G.X(300),G.Y(50),5,C.ink); T(g,'E',G.X(300),G.Y(55),C.ink,fs,'center','700');
  if(r.bind){ L(g,G.X(Math.min(r.qd,r.qs)),G.Y(v),G.X(Math.max(r.qd,r.qs)),G.Y(v),C.red,3.5); } }
function ctrlOut(c,floor,unit,gap){ var r=ctrlVals(c,floor); if(!r.bind) return (floor?'下限低於或等於':'上限高於或等於')+'均衡價 50：<b>管制沒有作用</b>，市場仍在 50、300 交易'; return (gap+' '+money(Math.abs(r.qd-r.qs))+unit)+'，交易量 '+money(r.q)+unit+'；消費者剩餘 '+money(r.cs)+'、生產者剩餘 '+money(r.ps)+'、無謂損失 <b>'+money(r.dw)+'</b>（均衡時兩種剩餘都是 4,500）'; }
widget('w-ceil',{state:{c:40},rw:0.62,rn:1.0,fmt:{c:function(v){ return v+' 元'; }},
  draw:function(g,c,s){ ctrlDraw(g,c,c.C,s.c,false,'P（元）','Q（萬斤）'); },
  out:function(s){ return ctrlOut(s.c,false,' 萬斤','短缺'); }
});
var CMP=[['交易價格','下降','提高'],['交易數量','下降','下降'],['消費者剩餘','不一定','下降'],['生產者剩餘','下降','不一定'],['社會福利','下降','下降']];
function cmpDraw(g,c,C,st){ var G=frame(full(c),0,24,0,14,14,false), fs=fsz(c); T(g,'價格上限',G.X(13),G.Y(13.2),C.blue,fs,'center','700'); T(g,'價格下限',G.X(20),G.Y(13.2),ORANGE,fs,'center','700');
  CMP.forEach(function(r,i){ var y=10.2-i*2.3, on=i<=st; rbox(g,G,0.5,y,8.5,2,alpha(C.ink,0.05),alpha(C.ink,0.25),r[0],fs,C.ink); if(on){ rbox(g,G,9.5,y,7,2,alpha(C.blue,0.12),C.blue,r[1],fs,C.ink); rbox(g,G,17,y,6.5,2,alpha(ORANGE,0.14),ORANGE,r[2],fs,C.ink); } }); }
widget('s-F7',{state:{},steps:3,rw:0.62,rn:1.0,
  draw:function(g,c,s){ ctrlDraw(g,c,c.C,[50,40,40][s.step],false,'P（元）','Q（萬斤）'); },
  out:steps(['限價前：均衡 50 元、300 萬斤。','上限 40 元：成本較高的蛋農不生產，供給量 200 萬斤，交易量減少。','第 200 萬斤願付 60 元、成本 40 元，少了 100 萬斤交易：無謂損失＝20 × 100 ÷ 2＝<b>1,000 萬元</b>。'])
});
widget('w-floor',{state:{c:60},rw:0.62,rn:1.0,fmt:{c:function(v){ return '指數 '+v; }},
  draw:function(g,c,s){ ctrlDraw(g,c,c.C,s.c,true,'工資（指數）','勞動量'); },
  out:function(s){ return ctrlOut(s.c,true,' 人','勞動過剩'); }
});
widget('s-F8',{state:{},steps:5,rw:0.6,rn:1.0,
  draw:function(g,c,s){ cmpDraw(g,c,c.C,s.step); },
  out:steps(['表4-1：上限壓低價格，下限抬高價格。','兩者都讓交易量下降。','上限時買到的人受益、買不到的人受損，所以消費者剩餘不一定。下限時消費者剩餘下降。','下限時生產者剩餘不一定；上限時生產者剩餘下降。','兩者都使<b>社會福利下降</b>。前提是管制真的改變了均衡價格。'])
});

/* F9 卡特爾 */
var CAR=[['三家競爭',[50,50,50],null,'價格相同，各做各的生意'],['A 單獨漲價',[60,50,50],'out','客人跑到 B、C，A 利潤未必提高'],['三家說好一起漲',[60,60,60],null,'客人沒地方去，只能付高價'],['C 偷偷增產降價',[60,60,52],'c','客人流向 C，聯盟瓦解，價格下跌']];
function carDraw(g,c,C,k){ var G=frame(full(c),0,30,-6,72,14,false), fs=fsz(c), h=CAR[k]; ['A','B','C'].forEach(function(n,i){ var x=3+i*9, v=h[1][i]; box(g,G.X(x),G.Y(v),6*G.sx,v*G.sy,alpha(i===0?C.blue:i===1?GREEN:ORANGE,0.5),null); T(g,v+' 元',G.X(x+3),G.Y(v+4),C.ink,fs,'center','700'); T(g,'超商 '+n,G.X(x+3),G.Y(-3),C.ink,fs,'center','700'); });
  if(h[2]==='out') V(g,G,9,30,12,30,C.red,3); if(h[2]==='c'){ V(g,G,9,30,21,30,C.red,3); }
  T(g,h[0],G.X(15),G.Y(69),C.red,fs+2,'center','700'); }
widget('w-cartel',{state:{k:1},rw:0.5,rn:0.9,fmt:{k:function(v){ return CAR[v][0]; }},
  draw:function(g,c,s){ carDraw(g,c,c.C,s.k); },
  out:function(s){ return CAR[s.k][3]; }
});
var MILK=[['乳品 A','40%','77→83'],['乳品 B','30%','76→82'],['乳品 C','20%','76→82']];
widget('s-F9',{state:{},steps:3,rw:0.5,rn:0.9,
  draw:function(g,c,s){ var G=frame(full(c),0,24,0,12,14,false), C=c.C, fs=fsz(c); MILK.forEach(function(m,i){ var y=8.5-i*3; rbox(g,G,1,y,7,2.4,alpha(C.blue,0.1),C.blue,m[0],fs,C.ink); if(s.step>=0) T(g,'市占 '+m[1],G.X(11.5),G.Y(y+1.2),C.ink,fs,'center','700'); if(s.step>=1) T(g,m[2]+' 元（漲 6 元）',G.X(18.5),G.Y(y+1.2),C.red,fs,'center','700'); }); if(s.step>=2) T(g,'裁罰 3,000 萬元',G.X(12),G.Y(1),C.red,fs+2,'center','700'); },
  out:steps(['第一步：三家占市場大部分，足以影響市場功能。','第二步：同時間、同漲幅，可以合理推論有合意。','第三步：公平會加上其他間接證據認定聯合行為並裁罰；業者提起司法救濟也敗訴。'])
});

/* F10 判斷 */
var LAW=[['鮮乳三家同時同幅漲價',1,1,1,'聯合行為，公平會裁罰'],['原物料上漲，各家漲到均衡價',1,0,0,'不構成：沒有合意'],['中小企業聯合，經公平會許可',1,1,1,'例外許可，可以合法實施'],['兩家 KTV 合併，市占超過 1/3',1,0,1,'不是聯合，而是結合，可能被駁回'],['用虛偽不實廣告搶客人',0,0,0,'不是聯合，而是不公平競爭']];
function lawDraw(g,c,C,k,show){ var G=frame(full(c),0,24,0,12,14,false), fs=fsz(c), h=LAW[k], N=['同一階段競爭','合意','影響市場功能']; T(g,h[0],G.X(12),G.Y(10.8),C.ink,fs+1,'center','700');
  N.forEach(function(n,i){ var ok=h[i+1], x=0.6+i*7.8, lit=show>i; rbox(g,G,x,4.6,7.2,4.4,lit?alpha(ok?GREEN:C.red,0.25):alpha(C.ink,0.05),lit?(ok?GREEN:C.red):alpha(C.ink,0.3),n,fs-1,C.ink); if(lit) T(g,ok?'成立':'不成立',G.X(x+3.6),G.Y(5.3),ok?GREEN:C.red,fs-1,'center','700'); });
  if(show>2) T(g,h[4],G.X(12),G.Y(2.2),C.red,fs+1,'center','700'); }
widget('w-law',{state:{k:0},rw:0.5,rn:0.9,fmt:{k:function(v){ return '案例 '+(v+1); }},
  draw:function(g,c,s){ lawDraw(g,c,c.C,s.k,3); },
  out:function(s){ return LAW[s.k][0]+' → <b>'+LAW[s.k][4]+'</b>'; }
});
widget('s-F10',{state:{},steps:3,rw:0.5,rn:0.9,
  draw:function(g,c,s){ lawDraw(g,c,c.C,1,s.step+1); },
  out:steps(['這些廠商是同一階段的競爭者：成立。','各自因成本上升而調價，沒有合意：不成立。','所以即使同時漲價，也<b>不構成</b>聯合行為。'])
});

/* F11 外部成本 */
function extDraw(g,c,C,e,tax){ var G=plane(c), fs=fsz(c), m=eq(0,0), q2=300-5*e, p2=td(q2); axesPQ(g,G,C,fs,66,'P（元）','Q（雙）'); lineD(g,G,C); lineS(g,G,C);
  if(e){ plot(g,G,function(q){ return ts(q)+e; },0,560,C.red,3,tax?null:[6,4]); poly(g,G,[[q2,p2],[300,30],[q2,ts(q2)]],alpha(C.red,0.25)); }
  dot(g,G.X(m.q),G.Y(m.p),5,C.ink); T(g,'私人決策',G.X(m.q),G.Y(m.p-8),C.ink,fs-1,'center','700'); if(e){ dot(g,G.X(q2),G.Y(p2),6,C.red); T(g,'適當產量',G.X(q2),G.Y(p2+5),C.red,fs-1,'center','700'); }
  T(g,'私人成本',G.X(560),G.Y(50),ORANGE,fs-1,'right','700'); if(e) T(g,'社會成本',G.X(430),G.Y(60),C.red,fs-1,'right','700'); }
widget('w-ext',{state:{e:10},rw:0.62,rn:1.0,fmt:{e:function(v){ return '每雙 '+v+' 元'; }},
  draw:function(g,c,s){ extDraw(g,c,c.C,s.e,false); },
  out:function(s){ return s.e?'廠商只看私人成本，生產 300 雙；算進外部成本後，適當產量是 <b>'+(300-5*s.e)+' 雙</b>，多生產了 '+(5*s.e)+' 雙':'沒有外部成本時，私人成本＝社會成本，市場均衡就是適當產量'; }
});
widget('s-F11',{state:{},steps:3,rw:0.62,rn:1.0,
  draw:function(g,c,s){ extDraw(g,c,c.C,s.step?10:0,s.step>=2); },
  out:steps(['廠商只算私人成本，覺得生產很便宜，產量偏多。','政府對汙染行為課稅，私人成本上升，成本線往上移。','供給減少：價格上升、交易量減少，社會成本降低。這就是<b>內部化</b>。'])
});

/* F12 寇斯 */
var COA=[['河流使用權：漁民','球鞋廠','漁民','球鞋廠付錢給漁民，或自己加裝防汙設備'],['河流使用權：球鞋廠','漁民','球鞋廠','漁民主動協商，付錢請工廠減少汙染'],['權利不明或交易成本太高','？','？','談不成，要由政府介入']];
function coaDraw(g,c,C,k){ var G=frame(full(c),0,24,0,12,14,false), fs=fsz(c), h=COA[k]; T(g,h[0],G.X(12),G.Y(10.8),C.ink,fs+1,'center','700'); rbox(g,G,1,4.5,7,4,alpha(ORANGE,0.14),ORANGE,h[1],fs+1,C.ink); rbox(g,G,16,4.5,7,4,alpha(C.blue,0.1),C.blue,h[2],fs+1,C.ink);
  if(k<2){ V(g,G,8.4,6.5,15.6,6.5,GREEN,3.5); T(g,'付費協商',G.X(12),G.Y(7.6),GREEN,fs,'center','700'); } else { T(g,'✕',G.X(12),G.Y(6.5),C.red,fs+8,'center','700'); } T(g,h[3],G.X(12),G.Y(2.4),C.ink,fs,'center','500'); }
widget('w-coase',{state:{k:0},rw:0.5,rn:0.9,fmt:{k:function(v){ return ['權利給漁民','權利給工廠','談不成'][v]; }},
  draw:function(g,c,s){ coaDraw(g,c,c.C,s.k); },
  out:function(s){ return s.k<2?'權利明確：雙方透過交易把外部成本納入決策，資源得到有效利用':'無法協商時，就需要政府訂定政策'; }
});
widget('s-F12',{state:{},steps:2,rw:0.5,rn:0.9,
  draw:function(g,c,s){ coaDraw(g,c,c.C,s.step?2:1); },
  out:steps(['權利在球鞋廠時，漁民可以協商，雙方都有利。','但是如果人數很多、協商很花時間，交易成本太高，就要靠政府的制度與政策。'])
});

/* F13 工具 */
var TOOL=[['建立制度','財產權、資訊公開','例：標示豬肉產地，保障知與選擇的權利'],['汙染者付費','排得多，付得多','例：空氣汙染防制費、垃圾清除處理費'],['直接管制','用法令禁止或限制','例：公共場所禁菸、禁用一次性塑膠吸管'],['課稅或補貼','外部成本課稅，外部效益補貼','例：碳稅；補助蛋農升級禽舍'],['碳權排放交易','額度可以買賣','例：京都議定書、巴黎協定、氣候變遷因應法']];
function toolDraw(g,c,C,k){ var G=frame(full(c),0,25,0,12,14,false), fs=c.narrow?10:12; TOOL.forEach(function(t,i){ var on=i===k; rbox(g,G,0.5+i*4.9,8,4.6,3.4,on?alpha(GREEN,0.3):alpha(C.ink,0.05),on?GREEN:alpha(C.ink,0.25),t[0].length>5?t[0].slice(0,4):t[0],fs-1,C.ink); }); T(g,TOOL[k][0],G.X(12.5),G.Y(6),GREEN,fs+4,'center','700'); T(g,TOOL[k][1],G.X(12.5),G.Y(4.2),C.ink,fs+1,'center','700'); T(g,TOOL[k][2],G.X(12.5),G.Y(2.2),C.muted,fs+1,'center','500'); }
widget('w-tools',{state:{k:0},rw:0.5,rn:0.9,fmt:{k:function(v){ return TOOL[v][0]; }},
  draw:function(g,c,s){ toolDraw(g,c,c.C,s.k); },
  out:function(s){ return '<b>'+TOOL[s.k][0]+'</b>：'+TOOL[s.k][2]; }
});
widget('s-F13',{state:{},steps:3,rw:0.5,rn:0.9,
  draw:function(g,c,s){ var G=frame(full(c),0,24,0,12,14,false), C=c.C, fs=fsz(c); rbox(g,G,8.5,8.5,7,2.6,alpha(C.ink,0.08),C.ink,'政府分配額度',fs,C.ink); if(s.step>=1){ rbox(g,G,0.8,2,8,3,alpha(C.red,0.14),C.red,'高汙染企業：不夠',fs-1,C.ink); rbox(g,G,15.2,2,8,3,alpha(GREEN,0.18),GREEN,'低汙染企業：有剩',fs-1,C.ink); V(g,G,10,8.3,5,5.2,C.ink,2); V(g,G,14,8.3,19,5.2,C.ink,2); } if(s.step>=2){ V(g,G,15,3.5,9,3.5,GREEN,3); T(g,'賣排碳權',G.X(12),G.Y(4.4),GREEN,fs-1,'center','700'); T(g,'付錢',G.X(12),G.Y(2.4),C.red,fs-1,'center','700'); } },
  out:steps(['政府先決定總量目標，把排放額度分給企業。','高汙染企業額度不夠，低汙染企業額度有剩。','低汙染企業把多的額度賣給高汙染企業：減排有錢賺，排放總量也被控制。'])
});
`
};
