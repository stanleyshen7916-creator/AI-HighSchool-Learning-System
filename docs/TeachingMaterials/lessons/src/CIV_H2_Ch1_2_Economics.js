/* lessons/src/CIV_H2_Ch1_2_Economics.js — 高二公民與社會：第1章 社會資源的分配（tm_8／tm_22／tm_58）、
   第2章 需求與供給（tm_9／tm_23／tm_59）.
   內容依教材包 summary.json；圖中金額、產量、願付／願售價格為老師自編的示意數字（不是課本例題數字），
   遺產稅級距依 2017 年修法（10%／15%／20%，之後級距金額隨物價指數調整）。答案已驗算。 */
"use strict";
module.exports = {
  lessonId: "CIV_H2_Ch1_2_Economics",
  title: "公民與社會 經濟篇圖解教材",
  eyebrow: "公民與社會 ・ 第1～2章 ・ 高二上",
  h1: "社會資源的分配・需求與供給",
  h1small: "把選擇、成本和市場畫成看得見的圖",
  subject: "CIV",
  unit: "CIV-H2-Ch1-2",
  sections: [
    {
      id: "1", short: "資源分配", title: "第1章 社會資源的分配",
      plan: { goal: "會算機會成本、會計利潤與經濟利潤，會讀生產可能曲線、判斷比較利益，並用淨效益與四大考量評估政策。", prereq: "國中的需求、成本概念。", time: "約 5 節課。" },
      cards: [
        {
          id: "F1", title: "稀少性與機會成本", page: "第1節", tags: ["src", "add"],
          say: "資源永遠不夠用（<b>稀少性</b>），所以一定要選。選了一個，就得放棄其他的。<b>機會成本</b>就是做這個選擇真正付出的代價：口袋實際掏出去的錢（<b>外顯成本</b>），加上<b>放棄的選項裡價值最高的那一個</b>（<b>隱藏成本</b>）。注意，不是把放棄的全部加起來。",
          formula: "機會成本 ＝ 外顯成本 ＋ 隱藏成本　　隱藏成本 ＝ 放棄的選項中<b>價值最高者</b>（只算一個）",
          widget: { id: "w-opp", aria: "週六下午三選一，比較選擇與放棄的價值，算出機會成本", rw: 0.45, rn: 0.95,
            controls: [{ k: "k", label: "我選", min: 0, max: 2, step: 1 }] },
          space: "灰色長條是被放棄的選項，只有最長那條（紅框）算進隱藏成本。右邊的機會成本長條＝外顯（橘）＋隱藏（紅）疊起來。",
          trap: "把所有沒選的選項加總當成隱藏成本。只能算放棄的選項中價值最高的那一個。",
          quiz: { q: "小安週六可以打工賺 1200 元、當家教賺 1500 元，或去看一場 500 元的電影。他決定去看電影，機會成本是多少？", answer: "b", options: [
            { c: "a", text: "500 元", why: "這只是外顯成本，還要加上放棄的最高價值（家教 1500 元）。" },
            { c: "b", text: "2000 元" },
            { c: "c", text: "3200 元", why: "把打工和家教都加進去了，隱藏成本只算價值最高的一個。" },
            { c: "d", text: "1500 元", why: "這只是隱藏成本，還要加上電影票 500 元。" }] },
          sol: { id: "s-F1", aria: "逐步圖解：外顯成本、隱藏成本、機會成本" }
        },
        {
          id: "F2", title: "會計利潤與經濟利潤", page: "第1節", tags: ["src"],
          say: "帳本上的利潤叫<b>會計利潤</b>：收入減掉真的花出去的錢。可是經濟學家會多問一句：「你放棄的那條路能賺多少？」把它也算進成本，就是<b>經濟利潤</b>。帳面賺錢，經濟利潤卻可能是負的，代表<b>你放棄的次佳選擇其實更划算</b>。",
          formula: "會計利潤 ＝ 總收入 － 外顯成本　　經濟利潤 ＝ 總收入 － 機會成本（外顯 ＋ 隱藏）",
          widget: { id: "w-profit", aria: "收入、外顯成本與隱藏成本的長條圖，比較會計利潤與經濟利潤", rw: 0.42, rn: 0.95,
            controls: [{ k: "R", label: "總收入", min: 0, max: 3000, step: 100 }, { k: "E", label: "外顯成本", min: 0, max: 1500, step: 100 }, { k: "H", label: "隱藏成本", min: 0, max: 2000, step: 100 }] },
          space: "把隱藏成本拉大：會計利潤不動，經濟利潤卻掉到 0 以下變紅色。這就是「帳面有賺、其實虧了」。",
          trap: "以為會計利潤是正的就是最好的選擇。要看經濟利潤：負的就代表另一個選擇更好。",
          quiz: { q: "小美擺攤一天收入 2000 元，材料費 600 元；她放棄的家教可賺 1500 元。下列何者正確？", answer: "c", options: [
            { c: "a", text: "會計利潤 1400 元、經濟利潤 1400 元", why: "經濟利潤還要扣掉隱藏成本 1500 元。" },
            { c: "b", text: "會計利潤 500 元、經濟利潤 −100 元", why: "會計利潤只扣外顯成本：2000 − 600 ＝ 1400 元。" },
            { c: "c", text: "會計利潤 1400 元、經濟利潤 −100 元，去當家教比較划算" },
            { c: "d", text: "經濟利潤為正，擺攤是最佳選擇", why: "2000 − 600 − 1500 ＝ −100，經濟利潤是負的。" }] },
          sol: { id: "s-F2", aria: "逐步圖解：先算會計利潤，再算經濟利潤" }
        },
        {
          id: "F3", title: "誘因的四個象限", page: "第1節", tags: ["src"],
          say: "人會回應<b>誘因</b>。分類只要問兩個問題：<b>跟錢有沒有關？</b>（金錢／非金錢）<b>是鼓勵還是阻止？</b>（正向／負向）。罰鍰、稅是金錢的負向誘因；獎狀、表揚是非金錢的正向誘因；坐牢（有期徒刑）不是罰錢，是非金錢的負向誘因。",
          formula: "金錢 × 正向：獎金、補助　｜　金錢 × 負向：罰鍰、稅　｜　非金錢 × 正向：獎狀、表揚　｜　非金錢 × 負向：記過、有期徒刑",
          widget: { id: "w-incent", aria: "誘因四象限，依是否涉及金錢與鼓勵或抑制分類", rw: 0.45, rn: 0.95,
            controls: [{ k: "k", label: "例子", min: 0, max: 7, step: 1 }] },
          space: "橫軸問「鼓勵還是阻止」，縱軸問「跟錢有沒有關」。每個例子先上下、再左右，就掉進唯一的格子。",
          trap: "把有期徒刑當成金錢誘因，或把稅、罰鍰當成非金錢誘因。",
          quiz: { q: "政府對酒駕者處以罰鍰，屬於哪一類誘因？", answer: "d", options: [
            { c: "a", text: "金錢的正向誘因", why: "罰鍰是要阻止酒駕，是負向。" },
            { c: "b", text: "非金錢的正向誘因", why: "罰鍰是要付錢，且是阻止行為。" },
            { c: "c", text: "非金錢的負向誘因", why: "罰鍰要付錢，是金錢誘因。" },
            { c: "d", text: "金錢的負向誘因" }] },
          sol: { id: "s-F3", aria: "逐步圖解：先問跟錢有沒有關，再問鼓勵或阻止" }
        },
        {
          id: "F4", title: "生產可能曲線（PPC）", page: "第2節", tags: ["src"],
          say: "一家餐廳的人力、食材固定，只能做壽司和炒飯。把「最多能做到的組合」連起來，就是<b>生產可能曲線</b>。點在<b>線上</b>：資源全用上，最有效率；在<b>線內</b>：有人閒著、資源沒用完；在<b>線外</b>：現在做不到。曲線向外凸（凹向原點），因為越做越多壽司，要放棄的炒飯越來越多（<b>機會成本遞增</b>）。",
          formula: "線上：最有效率　｜　線內：資源未充分利用（失業、停工）　｜　線外：目前無法達成　｜　技術進步、資源增加 → 整條線外移",
          widget: { id: "w-ppc", aria: "生產可能曲線，可移動生產點、調整資源利用程度與技術進步", rw: 0.48, rn: 0.95,
            controls: [{ k: "a", label: "壽司產量", min: 0, max: 90, step: 1 }, { k: "u", label: "資源利用", min: 0.5, max: 1.25, step: 0.05 }, { k: "gr", label: "技術／資源", min: 0.8, max: 1.25, step: 0.05 }] },
          space: "壽司產量往右拉，看紅色小三角形：同樣多做 10 份壽司，要放棄的炒飯（直的那一邊）越來越長，這就是機會成本遞增，曲線才會向外凸。",
          trap: "以為失業會讓整條 PPC 往內移。失業只是生產點落在線內，曲線本身沒動。",
          quiz: { q: "某國發生大量失業、工廠停工，在生產可能曲線上應如何表示？", answer: "a", options: [
            { c: "a", text: "生產點落在曲線內側，曲線本身不動" },
            { c: "b", text: "整條曲線向內移動", why: "資源和技術沒有減少，只是沒被充分利用。" },
            { c: "c", text: "生產點落在曲線外側", why: "線外是目前做不到的組合。" },
            { c: "d", text: "整條曲線向外移動", why: "那是技術進步或資源增加。" }] },
          sol: { id: "s-F4", aria: "逐步圖解：線上與線內的差別" }
        },
        {
          id: "F5", title: "絕對利益與比較利益", page: "第2節", tags: ["src"],
          say: "誰做得多、做得快，叫<b>絕對利益</b>。但分工不看這個，要看<b>比較利益</b>：誰做這件事<b>放棄的東西比較少</b>（機會成本較低）。就算一個人兩樣都比較強，還是各自做機會成本低的那一樣，再交換，兩邊都會更好。",
          formula: "生產 1 單位甲的機會成本 ＝ 乙的產量 ÷ 甲的產量　→ 數值較小者具<b>比較利益</b>　｜　絕對利益：產量較多（或成本較低）",
          widget: { id: "w-comp", aria: "兩家廠商的生產可能線與機會成本比較", rw: 0.48, rn: 1.05,
            controls: [{ k: "ap", label: "A 手機", min: 1, max: 10, step: 1 }, { k: "at", label: "A 平板", min: 1, max: 10, step: 1 }, { k: "bp", label: "B 手機", min: 1, max: 10, step: 1 }, { k: "bt", label: "B 平板", min: 1, max: 10, step: 1 }] },
          space: "直線越平，代表多做一支手機要放棄的平板越少，在手機上就有比較利益。兩條線斜率不同，分工交換才有好處。",
          trap: "比較利益換算時分子分母顛倒；或以為兩樣都比較強的一方就什麼都自己做。",
          quiz: { q: "甲一天可做 20 個蛋糕或 10 條麵包；乙一天可做 6 個蛋糕或 6 條麵包。誰在「麵包」具有比較利益？", answer: "b", options: [
            { c: "a", text: "甲，因為甲做的麵包比較多", why: "那是絕對利益。甲做 1 條麵包要放棄 2 個蛋糕，乙只放棄 1 個。" },
            { c: "b", text: "乙，因為乙做 1 條麵包只放棄 1 個蛋糕" },
            { c: "c", text: "兩人一樣", why: "機會成本不同：甲 2 個蛋糕、乙 1 個蛋糕。" },
            { c: "d", text: "甲，因為甲做 1 條麵包只放棄 0.5 個蛋糕", why: "分子分母顛倒了：1 條麵包 ＝ 20 ÷ 10 ＝ 2 個蛋糕。" }] },
          sol: { id: "s-F5", aria: "逐步圖解：算出兩人的機會成本再比較" }
        },
        {
          id: "F6", title: "成本效益分析：淨效益", page: "第3節", tags: ["src", "add"],
          say: "政府蓋一條鐵路，要高架化還是地下化？不是挑最便宜的，也不是挑效益最大的，而是挑<b>淨效益</b>最大的：總效益減總成本，剩下最多的那個。",
          formula: "淨效益 ＝ 總效益 － 總成本　→ 選淨效益最高的方案",
          widget: { id: "w-cba", aria: "四個方案的總效益、總成本與淨效益長條圖（示意數字）", rw: 0.42, rn: 0.95,
            controls: [{ k: "cc", label: "丙方案成本（億）", min: 10, max: 120, step: 5 }] },
          space: "看最右邊一組淨效益長條，最高的那條就是答案。把丙的成本拉高，答案會換人。",
          trap: "選「總成本最低」或「總效益最高」的方案，忽略了兩者相減的淨效益。",
          quiz: { q: "四個方案（億元）：甲 效益 40、成本 15；乙 效益 120、成本 100；丙 效益 90、成本 45；丁 效益 150、成本 140。依成本效益分析應選？", answer: "c", options: [
            { c: "a", text: "甲，成本最低", why: "甲淨效益 25，不是最高。" },
            { c: "b", text: "丁，效益最高", why: "丁淨效益只有 10。" },
            { c: "c", text: "丙，淨效益 45 最高" },
            { c: "d", text: "乙，效益與成本都中等", why: "乙淨效益 20。" }] },
          sol: { id: "s-F6", aria: "逐步圖解：逐一算出淨效益" }
        },
        {
          id: "F7", title: "政府的資源分配與累進稅率", page: "第3節", tags: ["src"],
          say: "政府分配資源要同時顧四件事：<b>經濟效率、公平正義、政治考量、環境永續</b>。公平正義最常見的工具是<b>累進稅率</b>：錢越多，超過門檻的那一段適用越高的稅率。我國遺產稅 2009 年是單一 10%，2017 年改成 10%、15%、20% 三段累進。",
          formula: "政府資源分配四大考量：經濟效率、公平正義（累進稅率）、政治考量、環境永續　｜　累進稅率：級距越高，該段適用的稅率越高",
          widget: { id: "w-tax", aria: "遺產淨額與應納稅額：三段累進稅率與單一稅率比較", rw: 0.45, rn: 0.95,
            controls: [{ k: "x", label: "遺產淨額（萬元）", min: 0, max: 20000, step: 500 }] },
          space: "紅線是累進稅（三段斜率越來越陡），灰虛線是單一 10%。遺產越多，兩條線差越大，有錢人多負擔一些，這就是用稅制追求公平。",
          trap: "把單一稅率（比例稅）當成累進稅率，或以為累進稅率是每個人繳一樣多的錢。",
          quiz: { q: "下列何者是「累進稅率」？", answer: "a", options: [
            { c: "a", text: "課稅的金額越高，超過門檻的部分適用越高的稅率" },
            { c: "b", text: "不論金額多少，一律適用相同稅率", why: "這是比例稅（單一稅率）。" },
            { c: "c", text: "每個人繳納相同的稅額", why: "這是定額稅（人頭稅）。" },
            { c: "d", text: "金額越高，稅率越低", why: "這是累退稅。" }] },
          sol: { id: "s-F7", aria: "逐步圖解：一段一段算出累進稅額" }
        }
      ]
    },
    {
      id: "2", short: "需求與供給", title: "第2章 需求與供給",
      plan: { goal: "分清「需求量／需求」「供給量／供給」，會判斷各種因素讓曲線往哪移，能算市場需求量與供給量，並認識消費者保護。", prereq: "第1章機會成本。", time: "約 5 節課。" },
      cards: [
        {
          id: "F8", title: "市場與經濟循環", page: "第1節", tags: ["src"],
          say: "家戶和廠商在兩個市場碰面。在<b>產品市場</b>，家戶買東西（需求者）、廠商賣東西（供給者）；在<b>生產要素市場</b>，角色倒過來：家戶提供勞動、土地、資本（供給者），廠商來僱用（需求者）。錢和東西就這樣一圈一圈往相反方向流。",
          formula: "產品市場：家戶＝需求者、廠商＝供給者　｜　生產要素市場：廠商＝需求者、家戶＝供給者　｜　有形市場（實體）／無形市場（網路平臺）",
          widget: { id: "w-flow", aria: "經濟循環圖：家戶、廠商、產品市場、生產要素市場之間的物流與金流", rw: 0.48, rn: 0.95,
            controls: [{ k: "t", label: "時間", min: 0, max: 1, step: 0.01 }], play: { k: "t", dur: 6000 } },
          space: "綠點（財貨、勞務、生產要素）順時針跑，金色的錢逆時針跑。同一個人在上面是買家，到下面就變成賣家。",
          trap: "以為家戶永遠是需求者。在生產要素市場（例如打工），家戶是勞動的供給者。",
          quiz: { q: "高中生小明到便利商店打工，就這個交易而言，小明是？", answer: "c", options: [
            { c: "a", text: "產品市場的需求者", why: "他不是在買東西。" },
            { c: "b", text: "產品市場的供給者", why: "他提供的是勞動，不是產品。" },
            { c: "c", text: "生產要素市場的供給者" },
            { c: "d", text: "生產要素市場的需求者", why: "需求勞動的是便利商店（廠商）。" }] },
          sol: { id: "s-F8", aria: "逐步圖解：打工屬於生產要素市場，小明提供勞動" }
        },
        {
          id: "F9", title: "願付價格、需求法則與市場需求量", page: "第2節", tags: ["src", "add"],
          say: "每個人心裡都有一個最多願意付的價錢（<b>願付價格</b>）。售價只要不超過，他就買。把價錢慢慢降低，買的人越來越多，這就是<b>需求法則</b>：價格和需求量反向。把每個價格下願意買的人數加起來，就是<b>市場需求量</b>，連起來就是需求線。",
          formula: "願付價格 ≥ 售價 → 購買　｜　需求法則：價格↑ 需求量↓　｜　市場需求量 ＝ 各消費者在該價格下需求量的加總",
          widget: { id: "w-wtp", aria: "五位消費者的願付價格與市場需求線（每人最多買 1 個，示意數字）", rw: 0.45, rn: 1.0,
            controls: [{ k: "p", label: "售價（元）", min: 10, max: 110, step: 5 }] },
          space: "左邊每根長條是一個人的願付價格，紅色水平線是售價：高過紅線的人會買。右邊把人數畫成點，一格一格就連成往右下的需求線。",
          trap: "把「需求量」（某個價格下的一個點）和「需求」（整條線）混用。",
          quiz: { q: "甲、乙、丙、丁四人對某飲料的願付價格分別是 90、70、50、30 元，每人最多買 1 杯。售價 60 元時，市場需求量是多少？", answer: "b", options: [
            { c: "a", text: "1 杯", why: "甲 90、乙 70 都 ≥ 60，兩人都會買。" },
            { c: "b", text: "2 杯" },
            { c: "c", text: "3 杯", why: "丙只願付 50 元，低於 60 元不買。" },
            { c: "d", text: "4 杯", why: "丙、丁的願付價格都低於 60 元。" }] },
          sol: { id: "s-F9", aria: "逐步圖解：把願付價格和售價比一比" }
        },
        {
          id: "F10", title: "需求量變動與需求變動", page: "第2節", tags: ["src"],
          say: "只有<b>商品自己的價格</b>變，是在同一條需求線上<b>移動點</b>（需求量變動）。其他因素變，整條線<b>移動</b>（需求變動）。五大原因：消費者人數、偏好、所得（正常財同向、<b>劣等財反向</b>）、相關產品價格（替代品漲 → 右移、互補品漲 → 左移）、對未來價格的預期（預期漲 → 現在搶買 → 右移）。",
          formula: "自身價格變動 → 沿線移動（需求量變動）　｜　其他五大因素 → 整條線移動（需求變動）：人數、偏好、所得、相關產品價格、預期",
          widget: { id: "w-dshift", aria: "需求線：價格變動沿線移動，其他因素讓整條需求線左右移動", rw: 0.45, rn: 0.95,
            controls: [{ k: "f", label: "發生什麼事", min: 0, max: 7, step: 1 }, { k: "p", label: "價格", min: 10, max: 90, step: 5 }] },
          space: "只拉價格：紅點在同一條線上滑。改「發生什麼事」：整條線跳到右邊（需求增加）或左邊（需求減少），灰色虛線是原來的位置。",
          trap: "劣等財（例如泡麵）在所得增加時，需求反而減少（左移），是最常見的誤判。",
          quiz: { q: "所得增加後，小華改吃餐廳，少買泡麵。對小華而言泡麵是劣等財，其需求線如何變動？", answer: "d", options: [
            { c: "a", text: "需求增加，需求線右移", why: "這是正常財的情形。" },
            { c: "b", text: "需求量減少，沿線移動", why: "泡麵自身價格沒變，是所得變動，要整條線移動。" },
            { c: "c", text: "需求不變", why: "所得改變會影響需求。" },
            { c: "d", text: "需求減少，需求線左移" }] },
          sol: { id: "s-F10", aria: "逐步圖解：價格沒變，是所得變動 → 劣等財左移" }
        },
        {
          id: "F11", title: "願售價格、供給法則與市場供給量", page: "第3節", tags: ["src", "add"],
          say: "賣方也有底線：<b>願售價格</b>，就是他生產這個東西的<b>機會成本</b>，低於這個價錢他寧可不賣。價格越高，願意賣的人越多，這就是<b>供給法則</b>：價格和供給量同向。把每個價格下願意賣的數量加起來，就是市場供給量。",
          formula: "售價 ≥ 願售價格（＝機會成本）→ 出售　｜　供給法則：價格↑ 供給量↑　｜　市場供給量 ＝ 各生產者在該價格下供給量的加總",
          widget: { id: "w-wta", aria: "五位生產者的願售價格與市場供給線（每人最多賣 1 個，示意數字）", rw: 0.45, rn: 1.0,
            controls: [{ k: "p", label: "售價（元）", min: 10, max: 110, step: 5 }] },
          space: "左邊長條是每個賣家的底價，紅線（售價）高過誰的長條，誰就願意賣。右邊的點越往上越往右，是往右上的供給線。",
          trap: "以為願售價格是賣家想賺的最高價。它是最低願意接受的價格，也就是生產的機會成本。",
          quiz: { q: "四位賣家的願售價格分別是 30、50、70、90 元，每人最多賣 1 個。售價 75 元時，市場供給量是？", answer: "c", options: [
            { c: "a", text: "1 個", why: "30、50、70 都 ≤ 75，三位都願意賣。" },
            { c: "b", text: "2 個", why: "願售 70 元的賣家在 75 元也會賣。" },
            { c: "c", text: "3 個" },
            { c: "d", text: "4 個", why: "願售 90 元的賣家不會在 75 元出售。" }] },
          sol: { id: "s-F11", aria: "逐步圖解：售價和每個賣家的底價比較" }
        },
        {
          id: "F12", title: "供給量變動與供給變動", page: "第3節", tags: ["src"],
          say: "供給也一樣：自身價格變，沿線移動；其他因素變，整條線移動。五大原因：生產者人數、原料價格（漲 → 左移）、技術（進步 → 右移）、生產上相關產品價格（<b>替代品漲 → 左移；互補品漲 → 右移</b>）、預期（預期未來漲價 → 現在<b>惜售</b> → 左移，和需求剛好相反）。",
          formula: "供給變動五大因素：生產者人數、生產要素與原料價格、生產技術、生產上相關產品價格、對未來價格的預期",
          widget: { id: "w-sshift", aria: "供給線：價格變動沿線移動，其他因素讓整條供給線左右移動", rw: 0.45, rn: 0.95,
            controls: [{ k: "f", label: "發生什麼事", min: 0, max: 6, step: 1 }, { k: "p", label: "價格", min: 10, max: 90, step: 5 }] },
          space: "注意「預期未來漲價」：需求線往右（買家搶買），供給線往左（賣家先不賣）。兩張卡切換著看就記得了。",
          trap: "把生產上的替代品、互補品方向弄反；或把預期漲價對供給的影響當成和需求一樣右移。",
          quiz: { q: "養雞用的飼料玉米價格大漲，對雞蛋市場的影響是？", answer: "b", options: [
            { c: "a", text: "供給增加，供給線右移", why: "原料變貴，同一價格下願意生產的量變少。" },
            { c: "b", text: "供給減少，供給線左移" },
            { c: "c", text: "供給量減少，沿線移動", why: "變的是原料價格，不是雞蛋本身價格，要整條線移動。" },
            { c: "d", text: "需求減少，需求線左移", why: "飼料是生產面的成本，影響的是供給。" }] },
          sol: { id: "s-F12", aria: "逐步圖解：原料漲價 → 供給左移" }
        },
        {
          id: "F13", title: "消費者保護：七日猶豫期與定型化契約", page: "第4節", tags: ["src"],
          say: "網購（<b>通訊交易</b>）或業務到家推銷（<b>訪問交易</b>），買之前摸不到商品，所以法律給你<b>七日猶豫期</b>：收到後 7 天內不用理由就能退。但有<b>例外</b>：生鮮食品、拆封的個人衛生用品、客製化商品、報紙雜誌、可複製的影音、已使用的 App、國際機票。另外，<b>定型化契約</b>要給消費者合理的<b>審閱期</b>，而且內容要平等互惠。",
          formula: "七日猶豫期：特種交易（通訊交易、訪問交易）收到商品後 7 日內可無條件解約退貨（有 7 類合理例外）　｜　定型化契約：審閱期、平等互惠原則；拋棄審閱期的約定無效",
          widget: { id: "w-coolp", aria: "選擇購物情境與收到商品後的天數，判斷能否無條件退貨", rw: 0.42, rn: 0.95,
            controls: [{ k: "k", label: "購物情境", min: 0, max: 7, step: 1 }, { k: "d", label: "收到後第幾天", min: 0, max: 10, step: 1 }] },
          space: "綠色那 7 格是猶豫期。先看情境是不是特種交易、是不是例外，再看天數有沒有超過第 7 天。",
          trap: "以為例外商品有瑕疵也不能退。排除的是「無條件退貨」，商品有瑕疵仍可依民法主張解約或減價。",
          quiz: { q: "下列網購商品，何者<b>不適用</b>七日猶豫期的無條件退貨？", answer: "a", options: [
            { c: "a", text: "生鮮海鮮" },
            { c: "b", text: "未拆封的外套", why: "一般網購商品，7 日內可無條件退貨。" },
            { c: "c", text: "電視購物買的吸塵器", why: "電視購物是通訊交易，適用七日猶豫期。" },
            { c: "d", text: "業務到府推銷的淨水器", why: "訪問交易，適用七日猶豫期。" }] },
          sol: { id: "s-F13", aria: "逐步圖解：生鮮食品屬於合理例外" }
        }
      ]
    }
  ],
  footer: [
    "課本：高二公民與社會 第1章 社會資源的分配、第2章 需求與供給（含補充題庫）。",
    "圖中的金額、產量、願付與願售價格是老師自編的示意數字，用來說明概念；遺產稅級距依 2017 年修法（之後級距金額隨物價指數調整）。"
  ],
  script: String.raw`
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function lerp(a,b,u){ return a+(b-a)*u; }
function B(g,G,x0,y0,x1,y1,fill,stroke,lw){ box(g,G.X(Math.min(x0,x1)),G.Y(Math.max(y0,y1)),Math.abs(x1-x0)*G.sx,Math.abs(y1-y0)*G.sy,fill,stroke,lw); }
function arrow(g,x1,y1,x2,y2,c,w){ var a=Math.atan2(y2-y1,x2-x1), h=6+(w||2)*2; L(g,x1,y1,x2-Math.cos(a)*h*0.6,y2-Math.sin(a)*h*0.6,c,w||2); g.save(); g.fillStyle=c; g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-h*Math.cos(a-0.4),y2-h*Math.sin(a-0.4)); g.lineTo(x2-h*Math.cos(a+0.4),y2-h*Math.sin(a+0.4)); g.closePath(); g.fill(); g.restore(); }
function money(v){ return (v<0?'−':'')+Math.abs(Math.round(v)).toLocaleString('en-US')+' 元'; }
var ORANGE='#e08a2c', GREEN='#3f8f4a';

/* F1 機會成本 */
var OPTS=[['打工',1200,0],['家教',1500,0],['擺攤',2000,600]];
function oppCalc(k){ var hid=0, who=''; OPTS.forEach(function(o,i){ if(i!==k&&o[1]-o[2]>hid){ hid=o[1]-o[2]; who=o[0]; } }); return {exp:OPTS[k][2], hid:hid, who:who}; }
function oppDraw(g,c,C,k){ var G=frame(full(c),-1.6,10.2,-0.9,3.6,14,false), r=oppCalc(k), fs=c.narrow?11:13, sc=3.0/2200;
  T(g,'各選項的價值（收入 − 外顯成本）',G.X(-1.5),G.Y(3.45),C.muted,fs-1,'left','700');
  OPTS.forEach(function(o,i){ var y=2.7-i*0.95, v=o[1]-o[2], on=i===k, hid=!on&&v===r.hid;
    T(g,o[0]+(on?'（選）':''),G.X(-0.1),G.Y(y),on?C.teal:C.ink,fs,'right','700');
    B(g,G,0,y-0.28,v*sc*2,y+0.28,on?alpha(C.teal,0.7):alpha(C.muted,0.35),hid?C.red:null,hid?3:1);
    T(g,money(v)+(o[2]?'（收入 2000 − 材料 600）':''),G.X(v*sc*2)+6,G.Y(y),C.ink,fs-1,'left'); if(hid) T(g,'← 放棄的最高價值',G.X(v*sc*2)+(o[2]?190:70),G.Y(y),C.red,fs-1,'left','700'); });
  var x0=6.4; T(g,'機會成本',G.X(x0+0.9),G.Y(3.45),C.ink,fs,'center','700');
  var h1=r.exp*sc, h2=r.hid*sc; B(g,G,x0+0.3,0,x0+1.5,h1,alpha(ORANGE,0.8)); B(g,G,x0+0.3,h1,x0+1.5,h1+h2,alpha(C.red,0.7));
  L(g,G.X(x0),G.Y(0),G.X(x0+1.8),G.Y(0),C.ink,1.5);
  if(r.exp) T(g,'外顯 '+money(r.exp),G.X(x0+1.6),G.Y(h1/2),ORANGE,fs-1,'left','700'); T(g,'隱藏 '+money(r.hid),G.X(x0+1.6),G.Y(h1+h2/2),C.red,fs-1,'left','700');
  T(g,'＝ '+money(r.exp+r.hid),G.X(x0+0.9),G.Y(h1+h2+0.25),C.ink,fs,'center','700'); }
widget('w-opp',{state:{k:2},rw:0.45,rn:0.95,fmt:{k:function(v){return OPTS[v][0];}},
  draw:function(g,c,s){ oppDraw(g,c,c.C,s.k); },
  out:function(s){ var r=oppCalc(s.k); return '選'+OPTS[s.k][0]+'：外顯成本 '+money(r.exp)+' ＋ 隱藏成本 '+money(r.hid)+'（放棄的'+r.who+'）＝ 機會成本 <b>'+money(r.exp+r.hid)+'</b>'; }
});
function movieDraw(g,c,C,step){ var G=frame(full(c),-1.6,10.2,-0.9,3.6,14,false), fs=c.narrow?11:13, sc=3.0/2200, M=[['打工',1200],['家教',1500]];
  T(g,'看電影：票價 500 元（外顯成本）',G.X(-1.5),G.Y(3.45),ORANGE,fs,'left','700');
  M.forEach(function(o,i){ var y=2.5-i*0.95, hid=i===1&&step>=1; T(g,o[0],G.X(-0.1),G.Y(y),C.ink,fs,'right','700'); B(g,G,0,y-0.28,o[1]*sc*2,y+0.28,alpha(C.muted,0.35),hid?C.red:null,3); T(g,money(o[1])+(hid?'　← 只算這個':''),G.X(o[1]*sc*2)+6,G.Y(y),hid?C.red:C.ink,fs-1,'left',hid?'700':'500'); });
  if(step>=2){ var x0=6.4; B(g,G,x0+0.3,0,x0+1.5,500*sc,alpha(ORANGE,0.8)); B(g,G,x0+0.3,500*sc,x0+1.5,2000*sc,alpha(C.red,0.7)); L(g,G.X(x0),G.Y(0),G.X(x0+1.8),G.Y(0),C.ink,1.5); T(g,'500 ＋ 1500 ＝ 2000 元',G.X(x0+0.9),G.Y(2000*sc+0.25),C.ink,fs,'center','700'); } }
widget('s-F1',{state:{},steps:3,rw:0.45,rn:0.95,
  draw:function(g,c,s){ movieDraw(g,c,c.C,s.step); },
  out:steps(['外顯成本：真正掏出去的電影票 <b>500 元</b>。','放棄的選項有打工 1200、家教 1500，隱藏成本只取最高的 <b>1500 元</b>。','機會成本 ＝ 500 ＋ 1500 ＝ <b>2000 元</b>。'])
});

/* F2 利潤 */
function profitDraw(g,c,C,R,E,H){ var G=frame(full(c),0,10,-2.4,3.4,16,false), sc=3.0/3000, fs=c.narrow?11:13, A=R-E, Ec=R-E-H;
  L(g,G.X(0),G.Y(0),G.X(10),G.Y(0),C.ink,1.5);
  B(g,G,0.4,0,1.8,R*sc,alpha(C.teal,0.7)); T(g,'總收入',G.X(1.1),G.Y(-0.3),C.ink,fs,'center','700'); T(g,money(R),G.X(1.1),G.Y(R*sc+0.2),C.ink,fs-1,'center');
  B(g,G,2.6,0,4.0,E*sc,alpha(ORANGE,0.8)); B(g,G,2.6,E*sc,4.0,(E+H)*sc,alpha(C.red,0.6)); T(g,'機會成本',G.X(3.3),G.Y(-0.3),C.ink,fs,'center','700'); T(g,'外顯 '+E,G.X(4.1),G.Y(E*sc/2),ORANGE,fs-1,'left','700'); T(g,'隱藏 '+H,G.X(4.1),G.Y(E*sc+H*sc/2),C.red,fs-1,'left','700');
  [[6.0,A,'會計利潤','收入 − 外顯'],[8.2,Ec,'經濟利潤','收入 − 外顯 − 隱藏']].forEach(function(b){ var neg=b[1]<0; B(g,G,b[0],0,b[0]+1.4,b[1]*sc,neg?alpha(C.red,0.75):alpha(GREEN,0.7)); T(g,b[2],G.X(b[0]+0.7),G.Y(neg?0.3:-0.3),C.ink,fs,'center','700'); T(g,money(b[1]),G.X(b[0]+0.7),G.Y(b[1]*sc+(neg?-0.25:0.2)),neg?C.red:C.ink,fs,'center','700'); T(g,b[3],G.X(b[0]+0.7),G.Y(neg?0.65:-0.65),C.muted,fs-2,'center'); }); }
widget('w-profit',{state:{R:2000,E:600,H:1500},rw:0.42,rn:0.95,fmt:{R:money,E:money,H:money},
  draw:function(g,c,s){ profitDraw(g,c,c.C,s.R,s.E,s.H); },
  out:function(s){ var ec=s.R-s.E-s.H; return '會計利潤 '+money(s.R-s.E)+'　｜　經濟利潤 <b>'+money(ec)+'</b>　→　'+(ec<0?'經濟利潤為負：放棄的次佳選擇<b>更划算</b>':ec===0?'剛好打平：兩個選擇一樣好':'經濟利潤為正：這個選擇<b>最划算</b>'); }
});
widget('s-F2',{state:{},steps:2,rw:0.42,rn:0.95,
  draw:function(g,c,s){ profitDraw(g,c,c.C,2000,600,s.step?1500:0); },
  out:steps(['會計利潤只扣材料費：2000 − 600 ＝ <b>1400 元</b>。','經濟利潤再扣掉放棄的家教 1500：2000 − 600 − 1500 ＝ <b>−100 元</b>，負的 → 去當家教比較划算。'])
});

/* F3 誘因 */
var INC=[['發全勤獎金',1,1],['開罰單、罰鍰',1,0],['課徵菸品健康捐',1,0],['電動機車購車補助',1,1],['頒發模範生獎狀',0,1],['公開表揚志工',0,1],['記過、禁足',0,0],['有期徒刑',0,0]];
function incDraw(g,c,C,k){ var G=frame(full(c),-1.4,10.2,-0.8,5.2,10,false), fs=c.narrow?11:13, cells=[[0,1,'金錢 × 負向'],[1,1,'金錢 × 正向'],[0,0,'非金錢 × 負向'],[1,0,'非金錢 × 正向']];
  cells.forEach(function(q){ var x0=q[0]*4.4, y0=q[1]*2.3, on=INC[k][1]===q[1]&&INC[k][2]===q[0]; B(g,G,x0,y0,x0+4.3,y0+2.2,on?alpha(C.red,0.12):alpha(C.blue,0.05),on?C.red:C.grid,on?2.5:1); T(g,q[2],G.X(x0+0.12),G.Y(y0+2.0),on?C.red:C.muted,fs,'left','700'); });
  T(g,'跟錢有關',G.X(-0.1),G.Y(3.45),C.ink,fs-1,'right','700'); T(g,'跟錢無關',G.X(-0.1),G.Y(1.15),C.ink,fs-1,'right','700'); T(g,'阻止（負向）',G.X(2.15),G.Y(4.85),C.ink,fs-1,'center','700'); T(g,'鼓勵（正向）',G.X(6.55),G.Y(4.85),C.ink,fs-1,'center','700');
  var slot={}; INC.forEach(function(e,i){ var key=e[1]+'-'+e[2], n=slot[key]=(slot[key]||0)+1, x=e[2]*4.4+0.4, y=e[1]*2.3+1.55-(n-1)*0.55, on=i===k; dot(g,G.X(x),G.Y(y),on?6:4,on?C.red:C.ink); T(g,e[0],G.X(x)+10,G.Y(y),on?C.red:C.ink,fs,'left',on?'700':'500'); }); }
widget('w-incent',{state:{k:7},rw:0.45,rn:0.95,fmt:{k:function(v){return INC[v][0];}},
  draw:function(g,c,s){ incDraw(g,c,c.C,s.k); },
  out:function(s){ var e=INC[s.k]; return e[0]+'：'+(e[1]?'跟錢有關':'跟錢無關')+'、'+(e[2]?'鼓勵':'阻止')+' → <b>'+(e[1]?'金錢':'非金錢')+'的'+(e[2]?'正向':'負向')+'誘因</b>'; }
});
widget('s-F3',{state:{},steps:2,rw:0.45,rn:0.95,
  draw:function(g,c,s){ incDraw(g,c,c.C,1); },
  out:steps(['罰鍰要付錢 → 先放上排「跟錢有關」。','目的在阻止酒駕 → 左邊「負向」。答案：<b>金錢的負向誘因</b>。'])
});

/* F4 PPC */
function ppcY(x,gr){ var X=100*gr; return x>=X?0:100*gr*Math.sqrt(1-(x/X)*(x/X)); }
function ppcDraw(g,c,C,a,u,gr){ var G=frame(full(c),-12,135,-14,135,14,true), fs=c.narrow?11:12;
  axes(g,G,[0,130,0,130],C,{xstep:20,ystep:20,xlabel:'壽司（份）',ylabel:'炒飯（份）'});
  if(Math.abs(gr-1)>0.01) plot(g,G,function(x){ return ppcY(x,1); },0,100,C.muted,1.5,[5,4]);
  g.save(); g.fillStyle=alpha(C.blue,0.08); g.beginPath(); g.moveTo(G.X(0),G.Y(0)); for(var x=0;x<=100*gr;x+=1) g.lineTo(G.X(x),G.Y(ppcY(x,gr))); g.lineTo(G.X(100*gr),G.Y(0)); g.closePath(); g.fill(); g.restore();
  plot(g,G,function(x){ return ppcY(x,gr); },0,100*gr,C.blue,3);
  var ax=Math.min(a,100*gr-0.5), ay=ppcY(ax,gr), px=ax*u, py=ay*u, on=Math.abs(u-1)<0.01, inside=u<1;
  if(ax+10<=100*gr){ var by=ppcY(ax+10,gr); L(g,G.X(ax),G.Y(ay),G.X(ax+10),G.Y(ay),C.red,2); L(g,G.X(ax+10),G.Y(ay),G.X(ax+10),G.Y(by),C.red,3); T(g,'少 '+(ay-by).toFixed(1),G.X(ax+10)+5,G.Y((ay+by)/2),C.red,fs,'left','700'); }
  dot(g,G.X(px),G.Y(py),7,on?GREEN:inside?C.gold:C.red);
  T(g,on?'線上：最有效率':inside?'線內：資源未充分利用':'線外：目前做不到',G.X(px)+10,G.Y(py)-14,on?GREEN:inside?C.gold:C.red,fs,'left','700'); return ay; }
widget('w-ppc',{state:{a:40,u:1,gr:1},rw:0.48,rn:0.95,fmt:{a:function(v){return v+' 份';},u:function(v){return Math.round(v*100)+'%';},gr:function(v){return v>1?'進步':v<1?'減少':'不變';}},
  constrain:function(s){ if(s.a>100*s.gr-1) s.a=Math.floor(100*s.gr-1); },
  draw:function(g,c,s){ ppcDraw(g,c,c.C,s.a,s.u,s.gr); },
  out:function(s){ var y0=ppcY(s.a,s.gr), y1=ppcY(s.a+10,s.gr); return '壽司從 '+s.a+' 份多做 10 份，炒飯要少做 <b>'+(y0-y1).toFixed(1)+' 份</b>（機會成本）；壽司越多，這個數字越大 → 機會成本遞增，曲線凹向原點'; }
});
widget('s-F4',{state:{},steps:2,rw:0.48,rn:0.95,
  draw:function(g,c,s){ ppcDraw(g,c,c.C,50,s.step?0.65:1,1); },
  out:steps(['資源全部用上時，生產點在曲線上（最有效率）。','大量失業、停工：資源和技術都還在，只是閒著 → 點掉到<b>線內</b>，曲線本身不動。'])
});

/* F5 比較利益 */
function compDraw(g,c,C,ap,at,bp,bt,N){ N=N||{x:'手機',y:'平板',a:'A',b:'B',ux:'支',uy:'台'}; var M=Math.max(ap,at,bp,bt)+1, P=panels(c,0.55), G=frame(P[0],-M*0.15,M*1.05,-M*0.15,M*1.05,10,true), fs=c.narrow?11:12;
  axes(g,G,[0,M,0,M],C,{xstep:M>12?4:2,ystep:M>12?4:2,xlabel:N.x,ylabel:N.y});
  L(g,G.X(ap),G.Y(0),G.X(0),G.Y(at),C.blue,3); L(g,G.X(bp),G.Y(0),G.X(0),G.Y(bt),ORANGE,3);
  T(g,N.a,G.X(ap/2)+6,G.Y(at/2)-6,C.blue,fs+2,'left','700'); T(g,N.b,G.X(bp/2)+6,G.Y(bt/2)-6,ORANGE,fs+2,'left','700');
  var oa=at/ap, ob=bt/bp, x0=P[1].x+(c.narrow?14:6), y0=P[1].y+(c.narrow?20:30), lh=c.narrow?22:25, rows=[
    ['做 1 '+N.ux+N.x+'要放棄的'+N.y,''],[N.a+'：'+at+' ÷ '+ap+' ＝ '+nf(oa,2),oa<ob?C.red:C.ink],[N.b+'：'+bt+' ÷ '+bp+' ＝ '+nf(ob,2),ob<oa?C.red:C.ink],
    ['做 1 '+N.uy+N.y+'要放棄的'+N.x,''],[N.a+'：'+ap+' ÷ '+at+' ＝ '+nf(1/oa,2),1/oa<1/ob?C.red:C.ink],[N.b+'：'+bp+' ÷ '+bt+' ＝ '+nf(1/ob,2),1/ob<1/oa?C.red:C.ink]];
  rows.forEach(function(r,i){ T(g,r[0],x0,y0+i*lh,r[1]||C.muted,fs,'left',r[1]?'700':'500'); });
  var msg=Math.abs(oa-ob)<1e-9?'機會成本相同，分工沒有好處':(oa<ob?N.a+' 做'+N.x+'、'+N.b+' 做'+N.y:N.a+' 做'+N.y+'、'+N.b+' 做'+N.x)+'，再交換';
  T(g,msg,x0,y0+6*lh+4,C.teal,fs,'left','700'); }
widget('w-comp',{state:{ap:6,at:3,bp:2,bt:2},rw:0.48,rn:1.05,fmt:{ap:function(v){return v+' 支';},at:function(v){return v+' 台';},bp:function(v){return v+' 支';},bt:function(v){return v+' 台';}},
  draw:function(g,c,s){ compDraw(g,c,c.C,s.ap,s.at,s.bp,s.bt); },
  out:function(s){ var abs=(s.ap>s.bp?'A':s.ap<s.bp?'B':'兩人相同')+' 在手機有絕對利益、'+(s.at>s.bt?'A':s.at<s.bt?'B':'兩人相同')+' 在平板有絕對利益'; var oa=s.at/s.ap, ob=s.bt/s.bp; return abs+'　｜　比較利益：'+(Math.abs(oa-ob)<1e-9?'機會成本相同':(oa<ob?'<b>A 手機、B 平板</b>':'<b>A 平板、B 手機</b>')); }
});
widget('s-F5',{state:{},steps:2,rw:0.48,rn:1.05,
  draw:function(g,c,s){ compDraw(g,c,c.C,20,10,6,6,{x:'蛋糕',y:'麵包',a:'甲',b:'乙',ux:'個',uy:'條'}); },
  out:steps(['甲：20 個蛋糕或 10 條麵包；乙：6 個蛋糕或 6 條麵包。甲兩樣都做得比較多（絕對利益），但分工要看機會成本。','做 1 條麵包要放棄的蛋糕：甲 20 ÷ 10 ＝ 2 個，乙 6 ÷ 6 ＝ 1 個 → <b>乙</b>在麵包有比較利益（雖然甲做得比較多）。'])
});

/* F6 成本效益 */
function cbaDraw(g,c,C,cc){ var P=[['甲',40,15],['乙',120,100],['丙',90,cc],['丁',150,140]], G=frame(full(c),-0.6,12.2,-0.9,6.4,12,false), sc=5.5/160, fs=c.narrow?11:12, best=0;
  P.forEach(function(p,i){ if(p[1]-p[2]>P[best][1]-P[best][2]) best=i; });
  L(g,G.X(-0.3),G.Y(0),G.X(12),G.Y(0),C.ink,1.5);
  P.forEach(function(p,i){ var x=i*3, net=p[1]-p[2], on=i===best;
    B(g,G,x,0,x+0.8,p[1]*sc,alpha(C.teal,0.7)); B(g,G,x+0.85,0,x+1.65,p[2]*sc,alpha(C.red,0.55)); B(g,G,x+1.7,0,x+2.5,net*sc,on?alpha(GREEN,0.85):alpha(C.muted,0.4),on?GREEN:null,2);
    T(g,p[1],G.X(x+0.4),G.Y(p[1]*sc+0.2),C.teal,fs-1,'center','700'); T(g,p[2],G.X(x+1.25),G.Y(p[2]*sc+0.2),C.red,fs-1,'center','700'); T(g,net,G.X(x+2.1),G.Y(net*sc+(net<0?-0.25:0.2)),on?GREEN:C.ink,fs,'center','700');
    T(g,'方案'+p[0]+(on?' ✔':''),G.X(x+1.25),G.Y(-0.45),on?GREEN:C.ink,fs+1,'center','700'); });
  [[C.teal,'總效益'],[C.red,'總成本'],[GREEN,'淨效益']].forEach(function(l,i){ box(g,G.X(0)+i*80,G.Y(6.3)-6,12,12,alpha(l[0],0.7),null); T(g,l[1],G.X(0)+i*80+16,G.Y(6.3),C.ink,fs-1,'left'); });
  return P[best][0]; }
widget('w-cba',{state:{cc:45},rw:0.42,rn:0.95,fmt:{cc:function(v){return v+' 億';}},
  draw:function(g,c,s){ s.best=cbaDraw(g,c,c.C,s.cc); },
  out:function(s){ return '淨效益：甲 25、乙 20、丙 '+(90-s.cc)+'、丁 10 → 應選<b>方案'+s.best+'</b>（數字為示意，單位億元）'; }
});
widget('s-F6',{state:{},steps:2,rw:0.42,rn:0.95,
  draw:function(g,c,s){ cbaDraw(g,c,c.C,45); },
  out:steps(['先別看誰效益大、誰成本小，一個一個相減：甲 40−15＝25、乙 120−100＝20、丙 90−45＝45、丁 150−140＝10。','淨效益最高的是<b>丙（45 億）</b>。丁效益最高、甲成本最低，都不是答案。'])
});

/* F7 累進稅率（2017 年遺產稅：5000 萬以下 10%、5000 萬～1 億 15%、1 億以上 20%） */
function prog(x){ return 0.10*Math.min(x,5000)+0.15*clamp(x-5000,0,5000)+0.20*Math.max(0,x-10000); }
function taxDraw(g,c,C,x,step){ var G=frame(full(c),-2200,21000,-450,3700,14,false), fs=c.narrow?11:12;
  axes(g,G,[0,20000,0,3500],C,{xstep:5000,ystep:500,xfmt:function(v){ return v?(v/10000)+' 億':'0'; },yfmt:function(v){ return v+' 萬'; },xlabel:'遺產淨額',ylabel:'應納稅額'});
  [[0,5000,'10%'],[5000,10000,'15%'],[10000,20000,'20%']].forEach(function(b,i){ B(g,G,b[0],0,b[1],3500,alpha([C.teal,C.gold,C.red][i],0.06)); T(g,'稅率 '+b[2],G.X((b[0]+b[1])/2),G.Y(3420),[C.teal,C.gold,C.red][i],fs,'center','700'); });
  L(g,G.X(0),G.Y(0),G.X(20000),G.Y(2000),C.muted,1.5,[5,4]); T(g,'單一 10%（2009）',G.X(20000),G.Y(2000)+14,C.muted,fs-1,'right');
  [[0,5000],[5000,10000],[10000,20000]].forEach(function(s2){ L(g,G.X(s2[0]),G.Y(prog(s2[0])),G.X(s2[1]),G.Y(prog(s2[1])),C.red,3); }); T(g,'三段累進（2017）',G.X(18500),G.Y(prog(18500))-12,C.red,fs-1,'right','700');
  if(step==null){ dot(g,G.X(x),G.Y(prog(x)),6,C.red); L(g,G.X(x),G.Y(0),G.X(x),G.Y(prog(x)),C.red,1,[3,3]); }
  else { var pts=[[5000,500],[10000,1250],[12000,1650]]; for(var i=0;i<=step;i++){ dot(g,G.X(pts[i][0]),G.Y(pts[i][1]),6,C.red); T(g,pts[i][1]+' 萬',G.X(pts[i][0])+8,G.Y(pts[i][1])+12,C.red,fs,'left','700'); } } }
widget('w-tax',{state:{x:12000},rw:0.45,rn:0.95,fmt:{x:function(v){ return v.toLocaleString('en-US')+' 萬'; }},
  draw:function(g,c,s){ taxDraw(g,c,c.C,s.x); },
  out:function(s){ var x=s.x, a=0.10*Math.min(x,5000), b=0.15*clamp(x-5000,0,5000), d=0.20*Math.max(0,x-10000); return '累進：'+nf(a,0)+(b?' ＋ '+nf(b,0):'')+(d?' ＋ '+nf(d,0):'')+' ＝ <b>'+nf(prog(x),0)+' 萬</b>　｜　單一 10%：'+nf(0.1*x,0)+' 萬'; }
});
widget('s-F7',{state:{},steps:3,rw:0.45,rn:0.95,
  draw:function(g,c,s){ taxDraw(g,c,c.C,0,s.step); },
  out:steps(['以遺產淨額 1.2 億為例：第一段 5000 萬 × 10% ＝ 500 萬。','第二段（5000 萬～1 億）5000 萬 × 15% ＝ 750 萬，累計 1250 萬。','超過 1 億的 2000 萬 × 20% ＝ 400 萬，合計 1650 萬。越上面的錢稅率越高 → <b>累進稅率</b>。'])
});

/* F8 經濟循環 */
function flowDraw(g,c,C,t,hl){ var G=frame(full(c),-5.4,5.4,-3.3,3.3,8,true), fs=c.narrow?11:13;
  var bx=function(x,y,w,h,txt,col,on){ box(g,G.X(x-w/2),G.Y(y+h/2),w*G.sx,h*G.sy,alpha(col,on?0.3:0.14),on?C.red:col,on?3:1.5); T(g,txt,G.X(x),G.Y(y),C.ink,fs+1,'center','700'); };
  bx(-3.8,0,2.6,1.2,'家戶',C.blue,false); bx(3.8,0,2.6,1.2,'廠商',ORANGE,false); bx(0,2.4,3.6,1.0,'產品市場',GREEN,hl===1); bx(0,-2.4,3.6,1.0,'生產要素市場',C.teal,hl===2);
  var outer=[[-3.8,0.6],[-3.8,2.4],[-1.8,2.4]], outer2=[[1.8,2.4],[3.8,2.4],[3.8,0.6]], inner=[[3.8,-0.6],[3.8,-2.4],[1.8,-2.4]], inner2=[[-1.8,-2.4],[-3.8,-2.4],[-3.8,-0.6]];
  function path(p,col,off,dir){ var q=p.map(function(v){ return [v[0]+off[0],v[1]+off[1]]; }); g.save(); g.strokeStyle=alpha(col,0.6); g.lineWidth=2; g.setLineDash([6,4]); g.beginPath(); q.forEach(function(v,i){ if(i) g.lineTo(G.X(v[0]),G.Y(v[1])); else g.moveTo(G.X(v[0]),G.Y(v[1])); }); g.stroke(); g.restore();
    for(var k=0;k<3;k++){ var u=((k/3)+t*(dir))%1; if(u<0) u+=1; var tot=0, Ls=[]; for(var i=1;i<q.length;i++){ var d=Math.hypot(q[i][0]-q[i-1][0],q[i][1]-q[i-1][1]); Ls.push(d); tot+=d; } var s=u*tot, j=0; while(j<Ls.length-1&&s>Ls[j]){ s-=Ls[j]; j++; } var v=Ls[j]?s/Ls[j]:0; dot(g,G.X(lerp(q[j][0],q[j+1][0],v)),G.Y(lerp(q[j][1],q[j+1][1],v)),5,col); } }
  /* 物流（綠）：要素 家戶→要素市場→廠商；產品 廠商→產品市場→家戶。金流（金）反向。 */
  path([[-3.8,-0.6],[-3.8,-2.4],[-1.8,-2.4]],GREEN,[-0.25,-0.2],1); path([[1.8,-2.4],[3.8,-2.4],[3.8,-0.6]],GREEN,[0.25,-0.2],1);
  path([[3.8,0.6],[3.8,2.4],[1.8,2.4]],GREEN,[0.25,0.2],1); path([[-1.8,2.4],[-3.8,2.4],[-3.8,0.6]],GREEN,[-0.25,0.2],1);
  path(outer,C.gold,[0.25,-0.2],1); path(outer2,C.gold,[-0.25,-0.2],1); path(inner,C.gold,[-0.25,0.2],1); path(inner2,C.gold,[0.25,0.2],1);
  T(g,'需求者',G.X(-2.6),G.Y(2.95),C.blue,fs-1,'center','700'); T(g,'供給者',G.X(2.6),G.Y(2.95),ORANGE,fs-1,'center','700');
  T(g,'供給者（勞動、土地、資本）',G.X(-2.4),G.Y(-3.05),C.blue,fs-1,'center','700'); T(g,'需求者',G.X(2.6),G.Y(-3.05),ORANGE,fs-1,'center','700');
  T(g,'● 財貨、勞務、生產要素',G.X(-5.3),G.Y(1.3),GREEN,fs-1,'left','700'); T(g,'● 貨幣',G.X(-5.3),G.Y(-1.3),C.gold,fs-1,'left','700'); }
widget('w-flow',{state:{t:0},rw:0.48,rn:0.95,fmt:{t:function(v){return Math.round(v*100)+'%';}},
  draw:function(g,c,s){ flowDraw(g,c,c.C,s.t,0); },
  out:function(){ return '產品市場：家戶是<b>需求者</b>、廠商是<b>供給者</b>　｜　生產要素市場：家戶是<b>供給者</b>、廠商是<b>需求者</b>'; }
});
widget('s-F8',{state:{},steps:2,rw:0.48,rn:0.95,
  draw:function(g,c,s){ flowDraw(g,c,c.C,0.3,s.step?2:1); },
  out:steps(['小明買東西時在上面的產品市場，是需求者；但打工不是買東西。','打工是把<b>勞動</b>（生產要素）賣給便利商店 → 小明是<b>生產要素市場的供給者</b>。'])
});

/* F9／F11 願付、願售價格 */
var WTP=[100,80,60,40,20], WTA=[20,40,60,80,100];
function stepDraw(g,c,C,p,vals,isD,showP){ var P=panels(c,0.48), fs=c.narrow?11:12, G=frame(P[0],-0.8,5.4,-14,125,10,false), H=frame(P[1],-0.8,6,-14,125,12,false), col=isD?C.blue:ORANGE, q=0;
  T(g,isD?'每個人的願付價格':'每個賣家的願售價格',G.X(-0.6),G.Y(118),C.ink,fs,'left','700');
  vals.forEach(function(v,i){ if(v<=0||v>120) return; var ok=isD?v>=p:v<=p; if(ok) q++; B(g,G,i+0.15,0,i+0.85,v,ok?alpha(col,0.75):alpha(C.muted,0.3)); T(g,v,G.X(i+0.5),G.Y(v+5),C.ink,fs-1,'center','700'); T(g,'甲乙丙丁戊'[i],G.X(i+0.5),G.Y(-7),C.ink,fs-1,'center'); });
  L(g,G.X(-0.2),G.Y(0),G.X(5.2),G.Y(0),C.ink,1.2);
  if(showP!==false){ L(g,G.X(-0.2),G.Y(p),G.X(5.2),G.Y(p),C.red,2.5); T(g,'售價 '+p,G.X(5.2),G.Y(p)-10,C.red,fs,'right','700'); }
  axes(g,H,[0,5.5,0,120],C,{xstep:1,ystep:20,xlabel:isD?'需求量':'供給量',ylabel:'價格'});
  g.save(); g.strokeStyle=col; g.lineWidth=3; g.beginPath(); var srt=vals.slice().sort(function(a,b){ return isD?b-a:a-b; });
  if(isD){ g.moveTo(H.X(0),H.Y(120)); srt.forEach(function(v,i){ g.lineTo(H.X(i),H.Y(v)); g.lineTo(H.X(i+1),H.Y(v)); }); g.lineTo(H.X(5),H.Y(0)); }
  else { g.moveTo(H.X(0),H.Y(0)); srt.forEach(function(v,i){ g.lineTo(H.X(i),H.Y(v)); g.lineTo(H.X(i+1),H.Y(v)); }); g.lineTo(H.X(5),H.Y(120)); }
  g.stroke(); g.restore(); T(g,isD?'需求線 D':'供給線 S',H.X(5.3),H.Y(isD?10:112),col,fs,'right','700');
  if(showP!==false){ L(g,H.X(0),H.Y(p),H.X(q),H.Y(p),C.red,1.5,[4,3]); dot(g,H.X(q),H.Y(p),6,C.red); T(g,'('+q+', '+p+')',H.X(q)+8,H.Y(p)-10,C.red,fs,'left','700'); }
  return q; }
widget('w-wtp',{state:{p:55},rw:0.45,rn:1.0,fmt:{p:function(v){return v+' 元';}},
  draw:function(g,c,s){ s.q=stepDraw(g,c,c.C,s.p,WTP,true); },
  out:function(s){ return '售價 '+s.p+' 元：願付價格 ≥ '+s.p+' 的有 <b>'+s.q+' 人</b> → 市場需求量 '+s.q+'。價格越低，買的人越多（<b>需求法則</b>）'; }
});
widget('s-F9',{state:{},steps:2,rw:0.45,rn:1.0,
  draw:function(g,c,s){ stepDraw(g,c,c.C,60,[90,70,50,30,0],true,s.step===1); },
  out:steps(['四人的願付價格：90、70、50、30（第五格空著）。','畫上售價 60 元：只有 90、70 高過紅線 → 市場需求量 <b>2 杯</b>。'])
});
widget('w-wta',{state:{p:55},rw:0.45,rn:1.0,fmt:{p:function(v){return v+' 元';}},
  draw:function(g,c,s){ s.q=stepDraw(g,c,c.C,s.p,WTA,false); },
  out:function(s){ return '售價 '+s.p+' 元：願售價格 ≤ '+s.p+' 的有 <b>'+s.q+' 人</b> → 市場供給量 '+s.q+'。價格越高，賣的人越多（<b>供給法則</b>）'; }
});
widget('s-F11',{state:{},steps:2,rw:0.45,rn:1.0,
  draw:function(g,c,s){ stepDraw(g,c,c.C,75,[30,50,70,90,200],false,s.step===1); },
  out:steps(['四位賣家的底價：30、50、70、90（第五格超出圖外，代表不賣）。','售價 75 元高過 30、50、70 → 市場供給量 <b>3 個</b>。'])
});

/* F10／F12 曲線移動 */
var DF=[['只有價格變動',0],['所得增加（正常財）',20],['所得增加（劣等財）',-20],['替代品漲價',20],['互補品漲價',-20],['預期未來漲價',20],['消費者偏好提高',20],['消費者人數減少',-20]];
var SF=[['只有價格變動',0],['原料價格上漲',-20],['生產技術進步',20],['生產者人數增加',20],['生產上替代品漲價',-20],['生產上互補品漲價',20],['預期未來漲價（惜售）',-20]];
function shiftDraw(g,c,C,isD,d,p,lab){ var G=frame(full(c),-12,125,-14,112,14,false), fs=c.narrow?11:12, col=isD?C.blue:ORANGE;
  axes(g,G,[0,120,0,105],C,{xstep:20,ystep:20,xlabel:isD?'數量':'數量',ylabel:'價格'});
  var f0=isD?function(q){ return 100-q; }:function(q){ return q; }, f1=isD?function(q){ return 100-(q-d); }:function(q){ return q-d; };
  clipTo(g,G,0,120,0,105); plot(g,G,f0,0,120,d?C.muted:col,d?1.5:3,d?[5,4]:[]); if(d) plot(g,G,f1,0,120,col,3); g.restore();
  if(d){ T(g,isD?'D₁':'S₁',G.X(isD?100+d-8:95+d),G.Y(isD?14:92),col,fs+1,'left','700'); var mx=isD?60:50, my=f0(mx); arrow(g,G.X(mx),G.Y(my),G.X(mx+d*0.8),G.Y(my),C.red,2.5); T(g,d>0?(isD?'需求增加':'供給增加'):(isD?'需求減少':'供給減少'),G.X(mx+d*0.4),G.Y(my)-14,C.red,fs,'center','700'); }
  T(g,isD?'D':'S',G.X(isD?92:95),G.Y(isD?14:100),d?C.muted:col,fs+1,'left','700');
  var q=isD?100-p+d:p+d; if(q>=0&&q<=120){ L(g,G.X(0),G.Y(p),G.X(q),G.Y(p),C.red,1.2,[3,3]); L(g,G.X(q),G.Y(p),G.X(q),G.Y(0),C.red,1.2,[3,3]); dot(g,G.X(q),G.Y(p),6,C.red); T(g,(isD?'需求量 ':'供給量 ')+q,G.X(q)+6,G.Y(0)-12,C.red,fs,'left','700'); }
  if(lab) T(g,lab,G.X(118),G.Y(108),C.ink,fs,'right','700'); return q; }
widget('w-dshift',{state:{f:0,p:50},rw:0.45,rn:0.95,fmt:{f:function(v){return DF[v][0];},p:function(v){return v+' 元';}},
  draw:function(g,c,s){ s.q=shiftDraw(g,c,c.C,true,DF[s.f][1],s.p,DF[s.f][0]); },
  out:function(s){ var d=DF[s.f][1]; return d===0?'只有價格變：在同一條需求線上移動，價格 '+s.p+' → 需求量 '+s.q+'（<b>需求量變動</b>）':DF[s.f][0]+' → 整條線往'+(d>0?'右':'左')+'移，<b>需求'+(d>0?'增加':'減少')+'</b>（需求變動）'; }
});
widget('s-F10',{state:{},steps:2,rw:0.45,rn:0.95,
  draw:function(g,c,s){ shiftDraw(g,c,c.C,true,s.step?-20:0,50,s.step?'所得增加（劣等財）':'原來的需求線'); },
  out:steps(['泡麵的價格沒變，變的是小華的<b>所得</b> → 不是沿線移動，而是整條線要動。','劣等財：所得增加反而少買 → <b>需求減少，需求線左移</b>。'])
});
widget('w-sshift',{state:{f:0,p:50},rw:0.45,rn:0.95,fmt:{f:function(v){return SF[v][0];},p:function(v){return v+' 元';}},
  draw:function(g,c,s){ s.q=shiftDraw(g,c,c.C,false,SF[s.f][1],s.p,SF[s.f][0]); },
  out:function(s){ var d=SF[s.f][1]; return d===0?'只有價格變：在同一條供給線上移動，價格 '+s.p+' → 供給量 '+s.q+'（<b>供給量變動</b>）':SF[s.f][0]+' → 整條線往'+(d>0?'右':'左')+'移，<b>供給'+(d>0?'增加':'減少')+'</b>（供給變動）'; }
});
widget('s-F12',{state:{},steps:2,rw:0.45,rn:0.95,
  draw:function(g,c,s){ shiftDraw(g,c,c.C,false,s.step?-20:0,50,s.step?'飼料（原料）價格上漲':'原來的供給線'); },
  out:steps(['飼料是生產雞蛋的原料，影響的是<b>供給</b>，不是需求；雞蛋本身價格沒變 → 整條線動。','原料變貴，同一價格下願意生產的雞蛋變少 → <b>供給減少，供給線左移</b>。'])
});

/* F13 七日猶豫期 */
var CASES=[['網購外套（通訊交易）',1,''],['電視購物買吸塵器',1,''],['業務到府推銷淨水器（訪問交易）',1,''],['網購生鮮海鮮',0,'生鮮食品'],['網購已拆封的牙刷',0,'個人衛生用品已拆封'],['線上訂製刻名字的杯子',0,'客製化商品'],['線上購買國際機票',0,'國際航空機票'],['在實體店面買手機',0,'不是特種交易（可現場檢查）']];
function coolDraw(g,c,C,k,d){ var G=frame(full(c),-0.6,11.2,-1.6,3.6,14,false), fs=c.narrow?11:13, e=CASES[k], ok=e[1]&&d<=7;
  T(g,e[0],G.X(-0.5),G.Y(3.25),C.ink,fs+1,'left','700');
  T(g,e[1]?'特種交易，適用七日猶豫期':'不適用：'+e[2],G.X(-0.5),G.Y(2.6),e[1]?GREEN:C.red,fs,'left','700');
  for(var i=0;i<=10;i++){ var inW=i>=1&&i<=7; B(g,G,i,0.6,i+0.95,1.6,inW?alpha(e[1]?GREEN:C.muted,e[1]?0.35:0.15):alpha(C.muted,0.08),i===d?C.red:C.grid,i===d?3:1); T(g,i?('第 '+i+' 天'):'收到',G.X(i+0.47),G.Y(1.1),C.ink,fs-2,'center'); }
  T(g,e[1]?'← 7 天內：不用理由就能退 →':'（例外：不能無條件退貨）',G.X(4.4),G.Y(0.25),e[1]?GREEN:C.muted,fs-1,'center','700');
  T(g,ok?'第 '+d+' 天：可以無條件退貨 ✔':'第 '+d+' 天：不能無條件退貨'+(e[1]&&d>7?'（已超過 7 天）':''),G.X(-0.5),G.Y(-0.75),ok?GREEN:C.red,fs+1,'left','700');
  T(g,'＊商品有瑕疵時，仍可依民法主張解約或減價',G.X(-0.5),G.Y(-1.3),C.muted,fs-2,'left'); }
widget('w-coolp',{state:{k:0,d:3},rw:0.42,rn:0.95,fmt:{k:function(v){return CASES[v][0];},d:function(v){return v?'第 '+v+' 天':'收到當天';}},
  draw:function(g,c,s){ coolDraw(g,c,c.C,s.k,s.d); },
  out:function(s){ var e=CASES[s.k]; return e[1]?(s.d<=7?'特種交易、在 7 天內 → <b>可以無條件解約退貨</b>':'已超過 7 天 → 不能再無條件退貨'):'<b>'+e[2]+'</b> → 不適用七日猶豫期的無條件退貨'; }
});
widget('s-F13',{state:{},steps:2,rw:0.42,rn:0.95,
  draw:function(g,c,s){ coolDraw(g,c,c.C,s.step?3:0,3); },
  out:steps(['一般網購、電視購物、到府推銷都是特種交易，7 天內可無條件退貨。','生鮮海鮮容易腐壞，屬於法定的<b>合理例外</b> → 不適用無條件退貨。'])
});
`
};
