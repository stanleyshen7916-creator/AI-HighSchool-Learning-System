/* lessons/src/CHI_H2_S1.js — 高二國文：長榮版第一～三課（tm_62；〈勞山道士〉〈發明為需求之母〉〈近體詩選〉）
   ＋正心版 C1〈狼之獨步〉〈雁〉、第二課〈劉姥姥〉、第三課〈玉山去來〉、第四課〈燭之武退秦師〉（tm_64／65／74／67／66）.
   國文沒有公式，「公式」欄放每課的核心概念、結構或格律；古典作品引用原文，現代作品不引用原文、只談意象與手法。
   字詞解釋與作家資料依教材包題庫答案；圖為示意。 */
"use strict";
module.exports = {
  lessonId: "CHI_H2_S1",
  title: "高二國文圖解教材",
  eyebrow: "國文 ・ 高二上",
  h1: "把文章畫成看得見的結構",
  h1small: "情節曲線、論證地圖、格律色塊、遊說路線",
  subject: "CHI",
  unit: "CHI-H2-S1",
  sections: [
    {
      id: "1", short: "勞山道士", title: "第一課 蒲松齡〈勞山道士〉",
      plan: { goal: "能說出作者與出處、畫出王生的心情變化，並讀懂關鍵字詞與「異史氏曰」的寓意。", prereq: "文言基本句式。", time: "約 4 節課。" },
      cards: [
        {
          id: "F1", title: "作者、出處與「異史氏曰」", page: "第一課 題解", tags: ["src"],
          say: "蒲松齡，字留仙，別號柳泉。十九歲考上秀才第一名，之後卻一路落榜，到七十二歲才補為貢生。他把滿肚子的不平寫進<b>《聊齋志異》</b>（「聊齋」是他的書齋名），這是收錄近五百篇的<b>文言短篇小說集</b>。〈勞山道士〉前面講故事，最後一段模仿《史記》的論贊，用「<b>異史氏曰</b>」直接說出主旨。",
          formula: "故事（王生學道）→「異史氏曰」（仿史書論贊）揭示主旨：諷刺好逸惡勞、想走捷徑的人；以及愛聽奉承、不聽忠言的人",
          widget: { id: "w-yishi", aria: "〈勞山道士〉文章結構：故事段落與異史氏曰的對照", rw: 0.42, rn: 0.95,
            controls: [{ k: "k", label: "段落", min: 0, max: 3, step: 1 }] },
          space: "前三塊是「說故事」，最後一塊顏色不同的是「作者跳出來說話」。看到「異史氏曰」，就知道主旨在這裡。",
          trap: "以為「異史氏」是另一位人物。他就是蒲松齡自己。",
          quiz: { q: "〈勞山道士〉末段以何種形式揭示主旨？", answer: "b", options: [
            { c: "a", text: "借道士之口說出教訓", why: "道士只在故事中說話，主旨在末段作者自己的評論。" },
            { c: "b", text: "模仿史書論贊，以「異史氏曰」發表議論" },
            { c: "c", text: "以王生的妻子作結論", why: "妻子只是揶揄王生，不是揭示主旨。" },
            { c: "d", text: "全文沒有直接點出主旨", why: "末段「異史氏曰」就是直接點題。" }] },
          sol: { id: "s-F1", aria: "逐步圖解：故事段與議論段" }
        },
        {
          id: "F2", title: "王生的心情曲線", page: "第一課", tags: ["src", "add"],
          say: "把王生的心情畫成曲線，主旨就跑出來了。他一開始很想學道，砍柴一個月<b>手足重繭</b>就<b>陰有歸志</b>；看到道士剪紙成月、壺酒不減、嫦娥起舞，又<b>忻慕</b>得不想走；再一個月還是吃不了苦，只求學個小技（穿牆術）。回家<b>自詡遇仙</b>，一撞牆<b>額上墳起</b>，被妻子<b>揶揄</b>。每次往下掉，都是因為「怕吃苦」。",
          formula: "慕道入山 → 作苦、重繭（想回家）→ 見法術（忻慕）→ 又苦（求小技）→ 學穿牆術 → 自詡遇仙 → 撞牆墳起、妻揶揄",
          widget: { id: "w-wang", aria: "王生在故事中的心情曲線與情節節點", rw: 0.42, rn: 0.95,
            controls: [{ k: "k", label: "情節", min: 0, max: 7, step: 1 }], play: { k: "k", dur: 7000 } },
          space: "曲線兩次往下掉都在「勞動吃苦」的時候，兩次往上衝都在「看到好處」的時候。最後一路跌到谷底。",
          trap: "以為王生學不成是因為道士藏私。道士其實早就提醒他「恐嬌惰不能作苦」。",
          quiz: { q: "王生「不堪其苦，陰有歸志」，句中「陰」的意思是？", answer: "a", options: [
            { c: "a", text: "暗中、私下" },
            { c: "b", text: "陰天", why: "此處不是指天氣。" },
            { c: "c", text: "陰險", why: "王生只是心裡偷偷想回家，沒有陰險的意思。" },
            { c: "d", text: "陰間", why: "與死亡無關。" }] },
          sol: { id: "s-F2", aria: "逐步圖解：兩次想回家的低點" }
        },
        {
          id: "F3", title: "字詞解碼：課文關鍵詞", page: "第一課 注釋", tags: ["src"],
          say: "文言文的關鍵字，放回句子裡最好記。像「然燭」的<b>然</b>通「燃」；「不勝酒力」的<b>勝</b>唸ㄕㄥ，是承受；「紿之」的<b>紿</b>是欺騙。異史氏曰裡的「<b>喜疢毒而畏藥石</b>」，是比喻愛聽好聽話、怕聽忠言。",
          formula: "通同字：然＝燃　｜　一字多義：勝（ㄕㄥ，承受）　｜　比喻：喜疢毒而畏藥石（喜聽諂媚、畏懼忠言）、吮癰舐痔（卑鄙討好他人）",
          widget: { id: "w-words", aria: "〈勞山道士〉關鍵字詞，依情節順序排列的字卡", rw: 0.4, rn: 0.95,
            controls: [{ k: "k", label: "字詞", min: 0, max: 15, step: 1 }] },
          space: "字卡依故事發生的順序排：拜師 → 勞動 → 月下宴 → 學穿牆 → 回家 → 異史氏曰。記字詞順便把情節串一次。",
          trap: "「勝」有兩個音：「良宵勝樂」是美好；「不勝酒力」唸ㄕㄥ，是承受。",
          quiz: { q: "「門人然燭來」中「然」的意思是？", answer: "c", options: [
            { c: "a", text: "然而", why: "此處不是轉折連詞。" },
            { c: "b", text: "如此", why: "不是指示代詞。" },
            { c: "c", text: "通「燃」，點燃" },
            { c: "d", text: "正確、對的", why: "不是表示肯定。" }] },
          sol: { id: "s-F3", aria: "逐步圖解：通同字與一字多義" }
        }
      ]
    },
    {
      id: "2", short: "發明", title: "第二課 賈德．戴蒙〈發明為需求之母〉",
      plan: { goal: "能說出本文翻轉的觀點與論證方法，認識作者與「人類大歷史三部曲」。", prereq: "論說文的論點、論據。", time: "約 3 節課。" },
      cards: [
        {
          id: "F4", title: "論證結構：先有發明，再找用途", page: "第二課", tags: ["src"],
          say: "一般人說「需求為發明之母」：先需要，才發明。作者把它<b>倒過來</b>：很多發明是先做出來，用途與需求<b>之後才被發掘</b>。他用「雅典娜從宙斯前額誕生」比喻大家以為發明是憑空出現的誤解；再舉<b>曼哈頓計畫</b>當作少數「需求先於發明」的<b>反例</b>，用例外襯托多數，這就是<b>正反例證</b>。",
          formula: "一般看法：需求 → 發明　｜　作者論點：發明 → 才發掘用途、產生需求　｜　手法：比喻（雅典娜誕生）、正反例證（曼哈頓計畫為例外）",
          widget: { id: "w-invent", aria: "需求與發明的箭頭方向：一般看法與作者論點的對照", rw: 0.42, rn: 0.95,
            controls: [{ k: "m", label: "看法", min: 0, max: 2, step: 1 }] },
          space: "注意箭頭方向：一般看法是「需求 → 發明」，作者的論點把箭頭整個翻過來。曼哈頓計畫是少數維持原方向的那一條。",
          trap: "以為曼哈頓計畫是作者主要的支持例子。它是反例（例外），用來襯托多數發明的情形。",
          quiz: { q: "作者舉「曼哈頓計畫」為例，作用是什麼？", answer: "d", options: [
            { c: "a", text: "證明所有發明都是需求先出現", why: "作者的論點剛好相反。" },
            { c: "b", text: "說明戰爭對科技毫無影響", why: "文中沒有這個意思。" },
            { c: "c", text: "比喻發明憑空而生", why: "那是雅典娜誕生的比喻。" },
            { c: "d", text: "作為少數「需求先於發明」的例外，襯托多數發明相反的論點" }] },
          sol: { id: "s-F4", aria: "逐步圖解：主要論點與反例" }
        },
        {
          id: "F5", title: "作者與「人類大歷史三部曲」", page: "第二課 作者", tags: ["src"],
          say: "賈德．戴蒙生於 <b>1937 年</b>，多次到<b>新幾內亞及周圍群島</b>研究鳥類，也在當地看見不同社會的發展差距。課本介紹的三本書剛好是三個問題：《<b>槍炮、病菌與鋼鐵</b>》問「為什麼文明發展有落差」（自然資源的不平等）；《<b>大崩壞</b>》問「偉大文明為什麼崩壞」；《<b>昨日世界</b>》融入新幾內亞傳統部落的田野經驗。",
          formula: "《槍炮、病菌與鋼鐵》：文明落差源於自然資源不平等　｜　《大崩壞》：文明崩壞的原因、今人如何運用地球資源　｜　《昨日世界》：新幾內亞部落的田野調查",
          widget: { id: "w-books", aria: "賈德．戴蒙三本書與各自探討的問題", rw: 0.4, rn: 0.95,
            controls: [{ k: "k", label: "書", min: 0, max: 2, step: 1 }] },
          space: "三本書排成一條時間線：過去（文明為何不同）→ 過去到現在（文明為何崩壞）→ 傳統社會能教我們什麼。",
          trap: "把《槍炮、病菌與鋼鐵》的原因說成「人種優劣」。作者強調的是自然資源與環境的不平等。",
          quiz: { q: "依課本介紹，《槍炮、病菌與鋼鐵》認為人類文明發展有落差的原因是？", answer: "b", options: [
            { c: "a", text: "人種智力的差異", why: "作者反對這種說法。" },
            { c: "b", text: "自然資源的不平等" },
            { c: "c", text: "宗教信仰的不同", why: "不是書中的核心論點。" },
            { c: "d", text: "語言文字的優劣", why: "不是書中的核心論點。" }] },
          sol: { id: "s-F5", aria: "逐步圖解：三本書各回答一個問題" }
        }
      ]
    },
    {
      id: "3", short: "近體詩", title: "第三課 近體詩選",
      plan: { goal: "能判斷律詩與絕句、找出押韻字與對仗聯，讀懂〈夜雨寄北〉的時空結構與〈寄黃幾復〉的典故。", prereq: "國中學過的唐詩。", time: "約 4 節課。" },
      cards: [
        {
          id: "F6", title: "近體詩格律：句數、押韻、對仗", page: "第三課", tags: ["src"],
          say: "近體詩先數句數：<b>四句是絕句，八句是律詩</b>。押韻看<b>偶數句的最後一個字</b>（首句可押可不押）。律詩八句分四聯：首聯、頷聯、頸聯、尾聯，其中<b>頷聯和頸聯必須對仗</b>。三首詩裡，〈旅夜書懷〉是五言律詩、〈寄黃幾復〉是七言律詩，〈夜雨寄北〉是<b>七言絕句</b>，不是律詩。",
          formula: "絕句：4 句　律詩：8 句（首、頷、頸、尾聯）｜ 押韻：偶數句末字　｜ 對仗：律詩頷聯、頸聯必對",
          widget: { id: "w-poem", aria: "三首近體詩的格律色塊：押韻字與對仗聯標示", rw: 0.55, rn: 1.15,
            controls: [{ k: "p", label: "詩", min: 0, max: 2, step: 1 }, { k: "v", label: "標示", min: 0, max: 1, step: 1 }] },
          space: "切換「標示」：押韻時紅框一路落在每聯的最後一個字；對仗時同一聯上下兩句的字會兩兩配對、顏色一樣。",
          trap: "以為〈夜雨寄北〉也是律詩。它只有四句，是七言絕句。",
          quiz: { q: "〈旅夜書懷〉的押韻字為下列哪一組？", answer: "c", options: [
            { c: "a", text: "岸、舟、闊、流", why: "押韻看偶數句末字，岸、闊在奇數句。" },
            { c: "b", text: "風、星、名、飄", why: "這些是句首附近的字。" },
            { c: "c", text: "舟、流、休、鷗" },
            { c: "d", text: "草、垂、豈、似", why: "押韻要看句末字。" }] },
          sol: { id: "s-F6", aria: "逐步圖解：找偶數句末字" }
        },
        {
          id: "F7", title: "〈旅夜書懷〉：大景與小我", page: "第三課", tags: ["src", "add"],
          say: "杜甫被稱為<b>詩聖</b>。這首詩的空間感很強：開頭鏡頭很近（岸邊細草、一條孤舟），頷聯一下拉到最遠——「<b>星垂平野闊，月湧大江流</b>」，天地無比遼闊；到結尾又把自己縮成「<b>天地一沙鷗</b>」。天地越大，人就顯得越渺小、越漂泊。",
          formula: "首聯：近景（細草、孤舟）→ 頷聯：遠景（星垂平野、月湧大江）→ 頸聯：自述（名、官）→ 尾聯：自比沙鷗（漂泊）",
          widget: { id: "w-zoom", aria: "鏡頭由近而遠再回到自己：〈旅夜書懷〉的空間層次", rw: 0.45, rn: 0.95,
            controls: [{ k: "k", label: "聯", min: 0, max: 3, step: 1 }] },
          space: "像電影鏡頭：先特寫小草和船，接著拉成大遠景的星空與江水，最後鏡頭停在天地間一隻小小的沙鷗上。",
          trap: "以為「星垂平野闊，月湧大江流」寫的是詩人心情很開闊。景越壯闊，越反襯出人的孤獨漂泊。",
          quiz: { q: "〈旅夜書懷〉中，寫遼闊自然景象的是哪兩句？", answer: "a", options: [
            { c: "a", text: "星垂平野闊，月湧大江流" },
            { c: "b", text: "細草微風岸，危檣獨夜舟", why: "這是近景。" },
            { c: "c", text: "名豈文章著，官應老病休", why: "這是自述心境。" },
            { c: "d", text: "飄飄何所似，天地一沙鷗", why: "這是自比沙鷗，寫漂泊。" }] },
          sol: { id: "s-F7", aria: "逐步圖解：近景到遠景" }
        },
        {
          id: "F8", title: "〈夜雨寄北〉：重複與時空交錯", page: "第三課", tags: ["src", "add"],
          say: "這首詩只有四句，「<b>巴山夜雨</b>」卻出現<b>兩次</b>。第一次是<b>現在</b>：秋天的巴山下著夜雨，池水漲了；第二次是<b>想像的未來</b>：哪天（<b>何當</b>＝何時能夠）和你在西窗下剪燭，回頭聊起今晚這場巴山夜雨。現在 → 未來 → 回望現在，時間繞了一個圈。",
          formula: "現在（巴山夜雨漲秋池）→ 未來（何當共剪西窗燭）→ 未來回望現在（卻話巴山夜雨時）｜ 七言絕句、「巴山夜雨」重複兩次",
          widget: { id: "w-loop", aria: "〈夜雨寄北〉的時間環：現在、未來、回望現在", rw: 0.42, rn: 0.95,
            controls: [{ k: "k", label: "句", min: 0, max: 3, step: 1 }] },
          space: "沿著圈圈走：從「此地此時」出發，飛到「彼地彼時」，又從那裡回頭看「此地此時」。同一個詞出現兩次，兩次的時間不一樣。",
          trap: "把「何當」解成「應當」。它是「何時能夠」。",
          quiz: { q: "〈夜雨寄北〉「何當共剪西窗燭」中「何當」的意思是？", answer: "b", options: [
            { c: "a", text: "應當", why: "「何當」是問時間。" },
            { c: "b", text: "何時能夠" },
            { c: "c", text: "為什麼", why: "不是問原因。" },
            { c: "d", text: "怎麼能", why: "不是反問語氣。" }] },
          sol: { id: "s-F8", aria: "逐步圖解：兩次「巴山夜雨」的時間不同" }
        },
        {
          id: "F9", title: "〈寄黃幾復〉：用典", page: "第三課", tags: ["src"],
          say: "黃庭堅號<b>山谷道人</b>，是<b>江西詩派</b>的開創者，最愛用典。這首詩幾乎每一聯都藏著典故：「北海、南海」相隔遙遠；「寄雁傳書」用蘇武雁足傳書；「<b>持家但有四立壁</b>」化用<b>家徒四壁</b>，說朋友清貧；「治病不蘄三折肱」用「三折肱為良醫」，說朋友早已有治世的本事。",
          formula: "四立壁 ← 家徒四壁（清貧）｜ 三折肱 ← 三折肱知為良醫（歷練豐富）｜ 寄雁傳書 ← 雁足傳書　｜ 押韻：能、燈、肱、藤",
          widget: { id: "w-allude", aria: "〈寄黃幾復〉詩句與典故的連線", rw: 0.48, rn: 1.05,
            controls: [{ k: "k", label: "典故", min: 0, max: 3, step: 1 }] },
          space: "左邊是詩句，右邊是典故，中間的線就是作者「化用」的痕跡。讀懂右邊，左邊的意思就出來了。",
          trap: "把「四立壁」解成「房子很大」。它化用「家徒四壁」，是說家中一無所有。",
          quiz: { q: "〈寄黃幾復〉「持家但有四立壁」化用了哪一個典故？", answer: "d", options: [
            { c: "a", text: "三折肱為良醫", why: "那是下一句「治病不蘄三折肱」。" },
            { c: "b", text: "雁足傳書", why: "那是「寄雁傳書謝不能」。" },
            { c: "c", text: "風馬牛不相及", why: "與北海、南海的距離有關，不是這一句。" },
            { c: "d", text: "家徒四壁" }] },
          sol: { id: "s-F9", aria: "逐步圖解：四立壁與三折肱" }
        },
        {
          id: "F14", title: "名詞並列與唐宋詩之別", page: "第三課", tags: ["src", "add"],
          say: "「<b>桃李春風一杯酒，江湖夜雨十年燈</b>」整聯沒有動詞，只把六個名詞詞組排在一起：桃李、春風、一杯酒｜江湖、夜雨、十年燈。讀者自己把畫面接起來——當年春日相聚飲酒，如今各自漂泊、十年孤燈。這種寫法叫<b>名詞並列</b>（列錦）。黃庭堅是<b>宋代</b>江西詩派的開創者；宋詩常「<b>以文為詩、以議論為詩、以才學為詩</b>」，喜歡說理、用典，唐詩則多<b>情景交融</b>。",
          formula: "名詞並列：句中只有名詞（詞組），省略動詞（雞聲茅店月，人跡板橋霜）｜ 唐詩：重情韻、情景交融 ｜ 宋詩：以文為詩、以議論為詩、以才學為詩（說理、用典）",
          widget: { id: "w-noun", aria: "名詞並列：把詩句拆成名詞積木", rw: 0.48, rn: 1.05,
            controls: [{ k: "k", label: "詩句", min: 0, max: 3, step: 1 }] },
          space: "把一句拆成幾塊名詞積木，每一塊都是一個鏡頭；積木之間沒有動詞，畫面靠讀者自己剪接。",
          trap: "看到「大漠孤煙直」也以為是名詞並列。「直」是謂語，句子有主語和謂語，不是只有名詞。",
          quiz: { q: "下列詩句，全由名詞（詞組）並列、沒有動詞的是？", answer: "b", options: [
            { c: "a", text: "星垂平野闊，月湧大江流", why: "「垂」「闊」「湧」「流」都是謂語。" },
            { c: "b", text: "雞聲茅店月，人跡板橋霜" },
            { c: "c", text: "大漠孤煙直，長河落日圓", why: "「直」「圓」是謂語。" },
            { c: "d", text: "春風又綠江南岸", why: "「綠」在這裡當動詞用（轉品）。" }] },
          sol: { id: "s-F14", aria: "逐步圖解：先找有沒有動詞" }
        }
      ]
    },
    {
      id: "4", short: "其他選文", title: "〈狼之獨步〉〈雁〉、〈劉姥姥〉、〈玉山去來〉、〈燭之武退秦師〉",
      plan: { goal: "比較兩首動物意象詩；分析人物性格、寫景結構與遊說策略。", prereq: "修辭、人物分析的基本方法。", time: "約 6 節課。" },
      cards: [
        {
          id: "F10", title: "〈狼之獨步〉與〈雁〉：動物意象比較", page: "C1", tags: ["src"],
          say: "兩首現代詩都借動物說人。紀弦的〈狼之獨步〉用「<b>我</b>」，一匹在曠野<b>獨來獨往</b>的狼，用<b>長嗥</b>宣示自己，孤獨中帶著自信，結尾一句「過癮」還有點痛快諧謔。白萩的〈雁〉用「<b>我們</b>」，一群雁一代接一代地飛，追著永遠追不到的<b>地平線</b>（理想），前面還有<b>雲翳</b>（阻礙）。共同點：<b>重過程，不重結果</b>。",
          formula: "狼：個體「我」、孤獨、自我宣示（長嗥）｜ 雁：群體「我們」、世代延續、追尋理想（地平線）｜ 共同：借動物意象寄託人生態度、重過程",
          widget: { id: "w-venn", aria: "〈狼之獨步〉與〈雁〉的比較：差異與共同點", rw: 0.48, rn: 1.1,
            controls: [{ k: "k", label: "比較面向", min: 0, max: 3, step: 1 }] },
          space: "左圈是狼、右圈是雁，中間重疊的部分就是兩首詩的共同點。點選不同面向，看兩邊各放什麼。",
          trap: "把〈雁〉的人稱也當成「我」。〈雁〉用「我們」，強調群體與世代延續。",
          quiz: { q: "兩首詩的人稱視角比較，何者最恰當？", answer: "a", options: [
            { c: "a", text: "〈狼之獨步〉以「我」凸顯個體，〈雁〉以「我們」凸顯群體" },
            { c: "b", text: "兩首都以「我們」表現群體", why: "〈狼之獨步〉是第一人稱單數「我」。" },
            { c: "c", text: "〈狼之獨步〉用第三人稱旁觀", why: "詩人以狼自喻，是「我」。" },
            { c: "d", text: "〈雁〉以「我」表現孤獨", why: "〈雁〉用「我們」，強調群體。" }] },
          sol: { id: "s-F10", aria: "逐步圖解：人稱與意象的差異" }
        },
        {
          id: "F11", title: "〈劉姥姥〉：人物關係與性格", page: "第二課", tags: ["src"],
          say: "這段選自《紅樓夢》（本名《石頭記》）<b>第四十回</b>，是劉姥姥<b>第二次</b>進榮國府。大家都在逗她，她卻心裡有數：被插滿頭花就自嘲「做個老風流」，滑一跤就說「才說嘴就打了嘴」，把出醜變成表演，哄老太太開心。看似滑稽，其實<b>純樸善良、詼諧慧黠、懂分寸</b>。",
          formula: "劉姥姥：表面滑稽 → 實則純樸善良、詼諧慧黠、知所分寸　｜　配角：王熙鳳（當家、捉弄）、鴛鴦（得寵、女篾片）、李紈（溫厚）、黛玉（書房似的繡房）、賈母（大箱大櫃）",
          widget: { id: "w-liu", aria: "〈劉姥姥〉人物關係圖，點選人物看與劉姥姥的互動", rw: 0.45, rn: 1.0,
            controls: [{ k: "k", label: "人物", min: 0, max: 4, step: 1 }] },
          space: "劉姥姥在中央，每條線是一次互動。線上寫的是那個場景，從場景反推她的性格。",
          trap: "以為劉姥姥是被捉弄卻不知情的傻老太太。她說「你先囑咐我，我就明白了」，是主動配合。",
          quiz: { q: "劉姥姥滑倒後爬起來說「才說嘴就打了嘴」，這句話的作用是？", answer: "c", options: [
            { c: "a", text: "抱怨大觀園的路不好走", why: "她是在自嘲，不是抱怨。" },
            { c: "b", text: "責怪旁人沒有扶她", why: "她沒有責怪任何人。" },
            { c: "c", text: "幽默自嘲，把出醜轉成有趣的表演" },
            { c: "d", text: "表示她要離開賈府", why: "與情節不符。" }] },
          sol: { id: "s-F11", aria: "逐步圖解：從言行看出性格" }
        },
        {
          id: "F12", title: "〈玉山去來〉：時間為經、見聞為緯", page: "第三課", tags: ["src", "add"],
          say: "陳列的〈玉山去來〉選自《<b>永遠的山</b>》。全文<b>以時間為經、登山見聞為緯</b>：凌晨摸黑上山、穿過冷杉林、到森林界線以上風大寒冷、天亮後看清陡崖反而更怕、到了<b>風口</b>視野突然打開、登頂看見雲海與群山。景物一路變，心情也跟著起伏，這就是<b>情景交融</b>。玉山主峰海拔 <b>3,952 公尺</b>。",
          formula: "時間：凌晨黑暗 → 曙光 → 日出後　｜　空間：山徑 → 冷杉林 → 森林界線以上 → 風口 → 頂峰　｜　手法：感官描寫、擬人、明喻、情景交融",
          widget: { id: "w-yushan", aria: "登玉山的時間與高度示意圖，天色隨時間由暗轉亮", rw: 0.42, rn: 0.95,
            controls: [{ k: "t", label: "時間", min: 0, max: 1, step: 0.01 }], play: { k: "t", dur: 8000 } },
          space: "往右拉，天色由黑到藍、人越爬越高；看「心情」那條線：天亮後看清陡崖反而往下掉，到風口和山頂才衝上去。",
          trap: "以為天亮後恐懼就消失了。看清楚巉岩陡崖，驚懼反而加重。",
          quiz: { q: "文中「風口」最重要的敘事功能是什麼？", answer: "b", options: [
            { c: "a", text: "說明登山隊伍休息的地點", why: "重點不在休息。" },
            { c: "b", text: "使視野由受山脈遮蔽轉為突然開闊" },
            { c: "c", text: "表示天氣即將變壞", why: "文中重點是視野的轉變。" },
            { c: "d", text: "結束登山的行程", why: "風口之後還要繼續登頂。" }] },
          sol: { id: "s-F12", aria: "逐步圖解：風口前後的視野變化" }
        },
        {
          id: "F13", title: "〈燭之武退秦師〉：一張地圖說服秦伯", page: "第四課", tags: ["src", "add"],
          say: "選自《<b>左傳》僖公三十年</b>。秦、晉聯軍圍鄭，燭之武夜裡垂繩出城去見秦穆公。他的話其實就是一張地圖：秦在西、晉在中間、鄭在東。<b>越國以鄙遠</b>——秦要越過晉才管得到鄭，根本守不住；滅了鄭只會讓晉變強，「<b>鄰之厚，君之薄也</b>」；晉東邊吃完鄭，下一步就往西吃秦。句句站在秦的利益說話，核心就是<b>利害關係</b>。",
          formula: "以退為進（鄭既知亡矣）→ 亡鄭無益於秦（越國以鄙遠）→ 亡鄭有害於秦（鄰之厚，君之薄）→ 舍鄭有益（東道主）→ 晉不可信、貪得無厭（東封鄭，又欲肆其西封）",
          widget: { id: "w-zheng", aria: "秦、晉、鄭三國位置示意圖，隨燭之武的說辭標出利害", rw: 0.45, rn: 0.95,
            controls: [{ k: "k", label: "說辭", min: 0, max: 4, step: 1 }] },
          space: "看秦到鄭的箭頭：一定要穿過晉。滅了鄭，土地全歸晉，晉的方塊變大；最後一步，晉的箭頭轉向西邊的秦。",
          trap: "把「越國以鄙遠」的「遠」當成秦國。「遠」指遠方的鄭國，「鄙」是把它當作邊境屬地。",
          quiz: { q: "燭之武說「越國以鄙遠，君知其難也」，所言之「遠」是指哪一國？", answer: "c", options: [
            { c: "a", text: "秦國", why: "秦是被說服的一方，「遠」指要越過晉才到得了的國家。" },
            { c: "b", text: "晉國", why: "晉是中間被越過的國家。" },
            { c: "c", text: "鄭國" },
            { c: "d", text: "楚國", why: "文中此句不涉及楚。" }] },
          sol: { id: "s-F13", aria: "逐步圖解：越國以鄙遠與鄰之厚君之薄" }
        }
      ]
    }
  ],
  footer: [
    "課本與講義：長榮版國文第一～三課（〈勞山道士〉〈發明為需求之母〉〈近體詩選〉）；正心版 C1、第二～四課（〈狼之獨步〉〈雁〉〈劉姥姥〉〈玉山去來〉〈燭之武退秦師〉）。",
    "古典詩文為公版作品，引用原文；現代詩文受著作權保護，本頁只說明意象與手法、不引用原文。地圖與曲線為示意。"
  ],
  script: String.raw`
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function lerp(a,b,u){ return a+(b-a)*u; }
function B(g,G,x0,y0,x1,y1,fill,stroke,lw){ box(g,G.X(Math.min(x0,x1)),G.Y(Math.max(y0,y1)),Math.abs(x1-x0)*G.sx,Math.abs(y1-y0)*G.sy,fill,stroke,lw); }
function circle(g,x,y,r,fill,stroke,w,dash){ g.save(); g.beginPath(); g.arc(x,y,Math.max(0,r),0,TAU); if(fill){ g.fillStyle=fill; g.fill(); } if(stroke){ g.strokeStyle=stroke; g.lineWidth=w||1.5; g.setLineDash(dash||[]); g.stroke(); } g.restore(); }
function arrow(g,x1,y1,x2,y2,c,w,dash){ var a=Math.atan2(y2-y1,x2-x1), h=6+(w||2)*2; L(g,x1,y1,x2-Math.cos(a)*h*0.6,y2-Math.sin(a)*h*0.6,c,w||2,dash); g.save(); g.fillStyle=c; g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-h*Math.cos(a-0.4),y2-h*Math.sin(a-0.4)); g.lineTo(x2-h*Math.cos(a+0.4),y2-h*Math.sin(a+0.4)); g.closePath(); g.fill(); g.restore(); }
function pill(g,x,y,txt,col,on,fs){ g.save(); g.font='700 '+fs+'px "Noto Sans TC",sans-serif'; var w=g.measureText(txt).width+18, h=fs+12; g.restore(); box(g,x-w/2,y-h/2,w,h,on?alpha(col,0.9):alpha(col,0.14),col,on?2:1); T(g,txt,x,y,on?'#ffffff':col,fs,'center','700'); return w; }
function wrap(g,txt,x,y,maxw,fs,col,wt,lh){ g.save(); g.font=(wt||'500')+' '+fs+'px "Noto Sans TC",sans-serif'; var lines=[], line=''; for(var i=0;i<txt.length;i++){ var t=line+txt[i]; if(g.measureText(t).width>maxw&&line){ lines.push(line); line=txt[i]; } else line=t; } lines.push(line); g.restore(); lines.forEach(function(l,i){ T(g,l,x,y+i*(lh||fs+5),col,fs,'left',wt||'500'); }); return lines.length; }
var GREEN='#3f8f4a', ORANGE='#e08a2c', PURPLE='#7d5ba6';

/* F1 結構 */
var YS=[['邑有王生，入勞山拜師','故事開端'],['作苦、見道士法術','故事發展'],['學穿牆術、歸家撞壁','故事結局'],['異史氏曰','作者議論：揭示主旨']];
function yishiDraw(g,c,C,k){ var G=frame(full(c),0,10,0,5,12,false), fs=c.narrow?11:13;
  YS.forEach(function(s,i){ var x=0.3+i*2.45, on=i===k, col=i===3?C.red:C.blue; B(g,G,x,1.4,x+2.2,3.8,alpha(col,on?0.3:0.1),col,on?3:1.2); wrap(g,s[0],G.X(x+0.15),G.Y(3.45),2.0*G.sx-6,fs,C.ink,'700'); T(g,s[1],G.X(x+1.1),G.Y(1.75),col,fs-1,'center','700'); if(i<3) arrow(g,G.X(x+2.22),G.Y(2.6),G.X(x+2.43),G.Y(2.6),C.muted,1.5); });
  L(g,G.X(0.3),G.Y(4.4),G.X(7.45),G.Y(4.4),C.blue,2); T(g,'說故事（小說）',G.X(3.9),G.Y(4.7),C.blue,fs,'center','700');
  L(g,G.X(7.65),G.Y(4.4),G.X(9.65),G.Y(4.4),C.red,2); T(g,'作者跳出來說話',G.X(8.65),G.Y(4.7),C.red,fs,'center','700');
  T(g,'仿《史記》「太史公曰」的論贊體例',G.X(8.65),G.Y(0.9),C.red,fs-1,'center'); T(g,'《聊齋志異》：文言短篇小說集，近五百篇',G.X(0.3),G.Y(0.4),C.muted,fs-1,'left'); }
widget('w-yishi',{state:{k:3},rw:0.42,rn:0.95,fmt:{k:function(v){ return YS[v][1]; }},
  draw:function(g,c,s){ yishiDraw(g,c,c.C,s.k); },
  out:function(s){ return s.k<3?YS[s.k][1]+'：'+YS[s.k][0]:'<b>異史氏曰</b>：蒲松齡模仿史書論贊，直接說出主旨 —— 諷刺想走捷徑、好逸惡勞的人，也諷刺愛聽奉承、不聽忠言的人'; }
});
widget('s-F1',{state:{},steps:2,rw:0.42,rn:0.95,
  draw:function(g,c,s){ yishiDraw(g,c,c.C,s.step?3:1); },
  out:steps(['前三段都在說故事，主旨沒有直接講出來。','最後一段「異史氏曰」仿史書論贊，由作者發表議論 → 答案。'])
});

/* F2 王生心情曲線 */
var WS=[['慕道入山',0.6,'少慕道，聞勞山多仙人，負笈往遊'],['作苦一月',-0.5,'隨眾採樵，手足重繭，不堪其苦，陰有歸志'],['見道士法術',0.9,'剪紙為月、壺酒不減、嫦娥起舞、移席月宮 → 竊忻慕，歸念遂息'],['又苦一月',-0.7,'又一月，苦不可忍，而道士並不傳教一術'],['求小技、學穿牆',0.5,'只求學個小技 → 道士傳穿牆術，「俛首驟入，勿逡巡」'],['自詡遇仙',0.8,'抵家，自詡遇仙，堅壁所不能阻'],['撞牆墳起',-0.9,'頭觸硬壁，額上墳起，如巨卵焉'],['妻揶揄',-1.0,'妻揶揄之，王慚忿，罵老道士之無良而已']];
function wangDraw(g,c,C,k){ var n=WS.length, G=frame(full(c),-0.5,n-0.5,-1.6,1.55,14,false), fs=c.narrow?10:12;
  B(g,G,-0.5,0,n-0.5,1.5,alpha(C.teal,0.05)); B(g,G,-0.5,-1.5,n-0.5,0,alpha(C.red,0.05)); T(g,'想學道 ↑',G.X(-0.45),G.Y(1.4),C.teal,fs,'left','700'); T(g,'想放棄 ↓',G.X(-0.45),G.Y(-1.4),C.red,fs,'left','700');
  L(g,G.X(-0.5),G.Y(0),G.X(n-0.5),G.Y(0),C.muted,1);
  g.save(); g.strokeStyle=C.blue; g.lineWidth=3; g.beginPath(); for(var i=0;i<=k;i++){ if(i) g.lineTo(G.X(i),G.Y(WS[i][1])); else g.moveTo(G.X(i),G.Y(WS[i][1])); } g.stroke(); g.restore();
  WS.forEach(function(w,i){ var on=i===k, show=i<=k; dot(g,G.X(i),G.Y(w[1]),on?7:4,show?(w[1]<0?C.red:C.teal):alpha(C.muted,0.4)); if(show&&(!c.narrow||on)) T(g,w[0],G.X(i),G.Y(w[1]+(w[1]>0?0.25:-0.25)),on?C.red:C.ink,fs,'center',on?'700':'500'); }); }
widget('w-wang',{state:{k:7},rw:0.42,rn:0.95,fmt:{k:function(v){ return WS[v][0]; }},
  draw:function(g,c,s){ wangDraw(g,c,c.C,s.k); },
  out:function(s){ return '<b>'+WS[s.k][0]+'</b>：'+WS[s.k][2]; }
});
widget('s-F2',{state:{},steps:2,rw:0.42,rn:0.95,
  draw:function(g,c,s){ wangDraw(g,c,c.C,s.step?3:1); },
  out:steps(['第一個低點：「不堪其苦，<b>陰</b>有歸志」—— 心裡偷偷想回家，「陰」是<b>暗中、私下</b>。','第二個低點又是因為吃苦。兩次想放棄，都是「怕吃苦」造成的。'])
});

/* F3 字詞 */
var WD=[['叩而與語','叩：拜見'],['素髮垂領','白髮披垂到脖子'],['作苦','勞動吃苦'],['稽首','叩頭至地，最恭敬的跪拜禮'],['手足重繭','因勞動長出層層厚皮'],['陰有歸志','陰：暗中、私下'],['光鑑毫芒','月光明亮，照見細微之物'],['分賚諸徒','賚：賞賜'],['競飲先釂','爭先乾杯'],['不勝酒力','勝：音ㄕㄥ，承受'],['門人然燭','然：通「燃」，點燃'],['而客杳矣','杳：不見蹤影'],['勿逡巡','逡巡：遲疑不前'],['額上墳起','墳起：高起、腫起'],['妻揶揄之','揶揄：譏笑嘲諷'],['紿之曰','紿：欺騙']];
var WG=[[0,4,'拜師、勞動'],[5,11,'月下宴'],[12,12,'學穿牆'],[13,14,'回家'],[15,15,'異史氏曰']];
function wordsDraw(g,c,C,k){ var cols=c.narrow?2:4, rows=Math.ceil(WD.length/cols), W=c.w, H=c.h, cw=(W-16)/cols, ch=(H-16)/rows, fs=c.narrow?11:13;
  WD.forEach(function(w,i){ var col=i%cols, row=Math.floor(i/cols), x=8+col*cw, y=8+row*ch, on=i===k, grp=0; WG.forEach(function(gp,j){ if(i>=gp[0]&&i<=gp[1]) grp=j; });
    var gc=[C.blue,PURPLE,C.teal,ORANGE,C.red][grp]; box(g,x+3,y+3,cw-6,ch-6,on?alpha(gc,0.22):alpha(gc,0.07),on?C.red:gc,on?2.5:1);
    T(g,w[0],x+12,y+ch*0.36,on?C.red:C.ink,fs+1,'left','700'); if(on||!c.narrow) T(g,w[1],x+12,y+ch*0.7,on?C.ink:C.muted,fs-1,'left',on?'700':'500'); }); }
widget('w-words',{state:{k:10},rw:0.4,rn:0.95,fmt:{k:function(v){ return WD[v][0]; }},
  draw:function(g,c,s){ wordsDraw(g,c,c.C,s.k); },
  out:function(s){ var grp=''; WG.forEach(function(gp){ if(s.k>=gp[0]&&s.k<=gp[1]) grp=gp[2]; }); return '「<b>'+WD[s.k][0]+'</b>」（'+grp+'）：'+WD[s.k][1]; }
});
widget('s-F3',{state:{},steps:2,rw:0.4,rn:0.95,
  draw:function(g,c,s){ wordsDraw(g,c,c.C,s.step?9:10); },
  out:steps(['「門人<b>然</b>燭來」：然＝燃，點燃 → 答案（通同字）。','順便對照「不<b>勝</b>酒力」：勝唸ㄕㄥ，承受（一字多義）。'])
});

/* F4 發明與需求 */
function inventDraw(g,c,C,m){ var G=frame(full(c),0,10,0,5,12,false), fs=c.narrow?11:13;
  var A=[2,2.6], Bp=[8,2.6];
  pill(g,G.X(A[0]),G.Y(A[1]),m===1?'發明':'需求',m===1?C.blue:ORANGE,true,fs+2); pill(g,G.X(Bp[0]),G.Y(Bp[1]),m===1?'用途、需求':'發明',m===1?ORANGE:C.blue,true,fs+2);
  arrow(g,G.X(3.1),G.Y(2.6),G.X(6.6),G.Y(2.6),m===1?C.red:C.muted,4);
  T(g,['一般看法：需求為發明之母','作者論點：多數發明先出現，用途之後才被發掘','反例：曼哈頓計畫（需求先於發明，屬少數）'][m],G.X(5),G.Y(4.4),m===1?C.red:C.ink,fs+1,'center','700');
  if(m===0) T(g,'比喻：以為發明像雅典娜從宙斯前額誕生 —— 憑空出現',G.X(5),G.Y(1.0),PURPLE,fs,'center','700');
  if(m===1) T(g,'先做出來 → 再找到「拿來做什麼」',G.X(5),G.Y(1.0),C.blue,fs,'center','700');
  if(m===2){ T(g,'原子彈：先有戰爭需求，才集中研發',G.X(5),G.Y(1.0),ORANGE,fs,'center','700'); T(g,'（用例外襯托多數 → 正反例證）',G.X(5),G.Y(0.45),C.muted,fs-1,'center'); } }
widget('w-invent',{state:{m:1},rw:0.42,rn:0.95,fmt:{m:function(v){ return ['一般看法','作者論點','反例'][v]; }},
  draw:function(g,c,s){ inventDraw(g,c,c.C,s.m); },
  out:function(s){ return ['一般看法：需求 → 發明。作者用「雅典娜誕生」比喻這種「發明憑空而生」的誤解','<b>作者論點</b>：許多發明先出現，用途與需求隨後才被發掘','<b>曼哈頓計畫</b>：少數「需求先於發明」的例外，用來襯托多數情形（正反例證）'][s.m]; }
});
widget('s-F4',{state:{},steps:2,rw:0.42,rn:0.95,
  draw:function(g,c,s){ inventDraw(g,c,c.C,s.step?2:1); },
  out:steps(['作者的主要論點：發明 → 用途（多數）。','曼哈頓計畫是「需求 → 發明」的少數<b>例外</b>，用來襯托多數發明相反的情形 → 答案。'])
});

/* F5 三本書 */
var BK=[['《槍炮、病菌與鋼鐵》','為什麼各地文明發展有落差？','自然資源的不平等'],['《大崩壞》','偉大的文明為什麼會崩壞？','反思今人如何運用地球資源'],['《昨日世界》','傳統社會能給我們什麼啟示？','融入新幾內亞傳統部落的田野調查']];
function booksDraw(g,c,C,k){ var G=frame(full(c),0,10,0,5,12,false), fs=c.narrow?10:12;
  T(g,'賈德．戴蒙（1937 年生）：多次前往新幾內亞及周圍群島研究鳥類',G.X(5),G.Y(4.6),C.muted,fs,'center','700');
  BK.forEach(function(b,i){ var x=0.3+i*3.25, on=i===k, col=[C.blue,C.red,GREEN][i]; B(g,G,x,0.5,x+3.0,3.9,alpha(col,on?0.22:0.07),col,on?3:1.2);
    T(g,b[0],G.X(x+1.5),G.Y(3.5),col,fs+1,'center','700'); wrap(g,'問：'+b[1],G.X(x+0.15),G.Y(2.7),3.0*G.sx-12,fs,C.ink,'500'); wrap(g,'答：'+b[2],G.X(x+0.15),G.Y(1.5),3.0*G.sx-12,fs,on?C.red:C.ink,'700'); }); }
widget('w-books',{state:{k:0},rw:0.4,rn:0.95,fmt:{k:function(v){ return BK[v][0]; }},
  draw:function(g,c,s){ booksDraw(g,c,c.C,s.k); },
  out:function(s){ return BK[s.k][0]+'：'+BK[s.k][1]+' → <b>'+BK[s.k][2]+'</b>'; }
});
widget('s-F5',{state:{},steps:2,rw:0.4,rn:0.95,
  draw:function(g,c,s){ booksDraw(g,c,c.C,0); },
  out:steps(['先找《槍炮、病菌與鋼鐵》：它問的是「文明為什麼有落差」。','作者的答案是<b>自然資源的不平等</b>，不是人種或智力。'])
});

/* F6 格律 */
var POEMS=[{t:'〈旅夜書懷〉杜甫｜五言律詩',l:['細草微風岸','危檣獨夜舟','星垂平野闊','月湧大江流','名豈文章著','官應老病休','飄飄何所似','天地一沙鷗'],dz:[[2,3],[4,5]]},
 {t:'〈夜雨寄北〉李商隱｜七言絕句',l:['君問歸期未有期','巴山夜雨漲秋池','何當共剪西窗燭','卻話巴山夜雨時'],dz:[]},
 {t:'〈寄黃幾復〉黃庭堅｜七言律詩',l:['我居北海君南海','寄雁傳書謝不能','桃李春風一杯酒','江湖夜雨十年燈','持家但有四立壁','治病不蘄三折肱','想見讀書頭已白','隔溪猿哭瘴溪藤'],dz:[[2,3],[4,5]]}];
var LIAN=['首聯','頷聯','頸聯','尾聯'];
function poemDraw(g,c,C,p,v){ var P=POEMS[p], n=P.l.length, len=P.l[0].length, W=c.w, H=c.h, fs=c.narrow?16:22, cell=Math.min((W-120)/(len+0.5), (H-70)/(n+0.6)), x0=c.narrow?70:110, y0=46;
  T(g,P.t,10,22,C.ink,c.narrow?13:15,'left','700');
  var pal=[C.blue,ORANGE,GREEN,PURPLE,C.red,C.teal,'#8a5a2b'];
  P.l.forEach(function(line,i){ var y=y0+i*cell+(Math.floor(i/2))*6, odd=i%2===1;
    if(n===8&&i%2===0) T(g,LIAN[i/2],x0-12,y+cell,C.muted,c.narrow?11:13,'right','700');
    if(n===4&&i===0) T(g,'絕句',x0-12,y+cell,C.muted,c.narrow?11:13,'right','700');
    for(var j=0;j<len;j++){ var x=x0+j*cell, ch=line[j], fill=null, stroke=C.grid, lw=1;
      if(v===0&&j===len-1&&odd){ fill=alpha(C.red,0.25); stroke=C.red; lw=2.5; }
      var dz=P.dz.filter(function(d){ return d[0]===i||d[1]===i; })[0]; if(v===1&&dz){ fill=alpha(pal[j%pal.length],0.22); stroke=pal[j%pal.length]; lw=1.5; }
      box(g,x+2,y+2,cell-4,cell-4,fill,stroke,lw); T(g,ch,x+cell/2,y+cell/2+1,C.ink,Math.min(fs,cell*0.62),'center','700'); }
    if(v===0&&odd) T(g,'押韻',x0+len*cell+8,y+cell/2,C.red,c.narrow?10:12,'left','700'); });
  if(v===1) T(g,P.dz.length?'頷聯、頸聯：上下句同位置的字兩兩相對（同色）':'絕句不要求對仗',x0,H-12,C.muted,c.narrow?11:13,'left','700'); }
widget('w-poem',{state:{p:0,v:0},rw:0.55,rn:1.15,fmt:{p:function(v){ return ['旅夜書懷','夜雨寄北','寄黃幾復'][v]; },v:function(v){ return v?'對仗':'押韻'; }},
  draw:function(g,c,s){ poemDraw(g,c,c.C,s.p,s.v); },
  out:function(s){ var P=POEMS[s.p], r=P.l.filter(function(l,i){ return i%2===1; }).map(function(l){ return l[l.length-1]; }); return P.t+'：'+P.l.length+' 句 → '+(P.l.length===8?'<b>律詩</b>':'<b>絕句</b>')+'；押韻字（偶數句末）：<b>'+r.join('、')+'</b>'+(P.l.length===8?'；頷聯、頸聯對仗':''); }
});
widget('s-F6',{state:{},steps:2,rw:0.55,rn:1.15,
  draw:function(g,c,s){ poemDraw(g,c,c.C,0,s.step?0:1); },
  out:steps(['先數句數：8 句 → 律詩，有四聯。','押韻看偶數句末字：<b>舟、流、休、鷗</b> → 答案。'])
});

/* F7 鏡頭遠近 */
var ZM=[['首聯','細草微風岸，危檣獨夜舟','特寫：岸邊細草、一條孤舟'],['頷聯','星垂平野闊，月湧大江流','大遠景：星空低垂、平野遼闊、月影湧動的大江'],['頸聯','名豈文章著，官應老病休','轉向內心：名聲、官場的感慨'],['尾聯','飄飄何所似，天地一沙鷗','回到天地間：自比一隻沙鷗']];
function zoomDraw(g,c,C,k){ var W=c.w, H=c.h, fs=c.narrow?11:13, cx=W/2, hy=H*0.55;
  box(g,0,0,W,hy,alpha('#1d2b53',k===1?0.9:0.55),null); box(g,0,hy,W,H-hy,alpha('#1d2b53',k===1?0.75:0.4),null);
  var r=seeded(4); for(var i=0;i<(k===1?70:25);i++){ dot(g,r()*W,r()*hy*(k===1?1:0.7),k===1?1.8:1.2,'#ffffff'); }
  if(k===0){ for(var j=0;j<14;j++) L(g,20+j*12,H,26+j*12,H-30-(j%3)*10,'#7fc97f',2); L(g,W*0.62,hy+20,W*0.62,hy-60,'#d9c79c',3); g.save(); g.fillStyle='#d9c79c'; g.beginPath(); g.moveTo(W*0.52,hy+20); g.lineTo(W*0.74,hy+20); g.lineTo(W*0.7,hy+34); g.lineTo(W*0.56,hy+34); g.closePath(); g.fill(); g.restore(); }
  if(k===1){ g.save(); g.strokeStyle=alpha('#ffffff',0.6); g.lineWidth=2; for(var m=0;m<6;m++){ g.beginPath(); for(var x=0;x<=W;x+=8){ var y=hy+20+m*14+5*Math.sin(x/30+m); if(x) g.lineTo(x,y); else g.moveTo(x,y); } g.stroke(); } g.restore(); circle(g,W*0.78,hy*0.3,16,'#f8f1c0',null); }
  if(k===2){ box(g,W*0.2,H*0.2,W*0.6,H*0.5,alpha('#ffffff',0.9),null); T(g,'名？　官？',cx,H*0.45,C.ink,fs+6,'center','700'); }
  if(k===3){ var bx=W*0.5, by=hy*0.55; L(g,bx-12,by,bx,by-6,'#ffffff',2); L(g,bx,by-6,bx+12,by,'#ffffff',2); T(g,'一沙鷗',bx,by+18,'#ffffff',fs,'center','700'); }
  box(g,0,H-34,W,34,alpha('#ffffff',0.9),null); T(g,ZM[k][0]+'：'+ZM[k][1],12,H-17,C.ink,fs+1,'left','700'); }
widget('w-zoom',{state:{k:1},rw:0.45,rn:0.95,fmt:{k:function(v){ return ZM[v][0]; }},
  draw:function(g,c,s){ zoomDraw(g,c,c.C,s.k); },
  out:function(s){ return '<b>'+ZM[s.k][0]+'</b>：'+ZM[s.k][2]; }
});
widget('s-F7',{state:{},steps:2,rw:0.45,rn:0.95,
  draw:function(g,c,s){ zoomDraw(g,c,c.C,s.step?1:0); },
  out:steps(['首聯是近景特寫：細草、孤舟。','頷聯鏡頭拉到最遠：<b>星垂平野闊，月湧大江流</b> → 遼闊的自然景象。'])
});

/* F8 時間環 */
var LP=[['君問歸期未有期','現在：你問我何時回去，我也說不準'],['巴山夜雨漲秋池','現在：秋天，巴山夜雨，池水漲滿'],['何當共剪西窗燭','未來：何時能夠和你在西窗下剪燭'],['卻話巴山夜雨時','未來回望現在：聊起今晚的巴山夜雨']];
function loopDraw(g,c,C,k){ var G=frame(full(c),-5,5,-3,3,10,true), fs=c.narrow?11:13, A=[-2.6,0], Bq=[2.6,0];
  circle(g,G.X(A[0]),G.Y(A[1]),1.3*G.sx,alpha(C.blue,0.12),C.blue,2); T(g,'此時此地',G.X(A[0]),G.Y(0.35),C.blue,fs+1,'center','700'); T(g,'巴山・夜雨・秋池',G.X(A[0]),G.Y(-0.3),C.blue,fs-1,'center');
  circle(g,G.X(Bq[0]),G.Y(Bq[1]),1.3*G.sx,alpha(ORANGE,0.12),ORANGE,2); T(g,'彼時彼地',G.X(Bq[0]),G.Y(0.35),ORANGE,fs+1,'center','700'); T(g,'西窗・剪燭・相聚',G.X(Bq[0]),G.Y(-0.3),ORANGE,fs-1,'center');
  g.save(); g.strokeStyle=k>=2?C.red:C.grid; g.lineWidth=3; g.beginPath(); g.moveTo(G.X(-1.3),G.Y(0.9)); g.quadraticCurveTo(G.X(0),G.Y(2.4),G.X(1.3),G.Y(0.9)); g.stroke(); g.restore(); if(k>=2) arrow(g,G.X(1.0),G.Y(1.25),G.X(1.3),G.Y(0.9),C.red,3);
  g.save(); g.strokeStyle=k>=3?C.red:C.grid; g.lineWidth=3; g.beginPath(); g.moveTo(G.X(1.3),G.Y(-0.9)); g.quadraticCurveTo(G.X(0),G.Y(-2.4),G.X(-1.3),G.Y(-0.9)); g.stroke(); g.restore(); if(k>=3) arrow(g,G.X(-1.0),G.Y(-1.25),G.X(-1.3),G.Y(-0.9),C.red,3);
  T(g,'想像',G.X(0),G.Y(2.05),k>=2?C.red:C.muted,fs,'center','700'); T(g,'回望',G.X(0),G.Y(-2.05),k>=3?C.red:C.muted,fs,'center','700');
  T(g,'「巴山夜雨」第 '+(k>=3?'2':'1')+' 次',G.X(A[0]),G.Y(-1.7),k===1||k===3?C.red:C.muted,fs,'center','700');
  T(g,LP[k][0],G.X(0),G.Y(2.75),C.ink,fs+2,'center','700'); }
widget('w-loop',{state:{k:3},rw:0.42,rn:0.95,fmt:{k:function(v){ return '第 '+(v+1)+' 句'; }},
  draw:function(g,c,s){ loopDraw(g,c,c.C,s.k); },
  out:function(s){ return '「'+LP[s.k][0]+'」— '+LP[s.k][1]; }
});
widget('s-F8',{state:{},steps:2,rw:0.42,rn:0.95,
  draw:function(g,c,s){ loopDraw(g,c,c.C,s.step?3:2); },
  out:steps(['「<b>何當</b>共剪西窗燭」：問的是「什麼時候才能」—— <b>何時能夠</b>。','到那時再回頭聊今晚的巴山夜雨：同一個詞出現兩次，時間一今一未來。'])
});

/* F9 典故 */
var AL=[['我居北海君南海','北海、南海（相隔遙遠）','兩人相隔極遠'],['寄雁傳書謝不能','雁足傳書（蘇武）','連鴻雁都飛不到，書信難通'],['持家但有四立壁','家徒四壁','朋友家境清貧'],['治病不蘄三折肱','三折肱知為良醫','朋友早已歷練豐富，有治世之才']];
function alDraw(g,c,C,k){ var W=c.w, H=c.h, fs=c.narrow?12:14, rh=(H-30)/AL.length, xl=c.narrow?8:20, xr=W*(c.narrow?0.52:0.55);
  AL.forEach(function(a,i){ var y=20+i*rh+rh/2, on=i===k; T(g,a[0],xl,y,on?C.red:C.ink,fs+1,'left','700'); g.save(); g.font='700 '+(fs+1)+'px "Noto Sans TC",sans-serif'; var w=g.measureText(a[0]).width; g.restore();
    L(g,xl+w+8,y,xr-8,y,on?C.red:C.grid,on?2.5:1,on?[]:[4,3]); pill(g,xr+(W-xr)/2,y-9,a[1],PURPLE,on,fs-2); T(g,a[2],xr+(W-xr)/2,y+16,on?C.ink:C.muted,fs-2,'center',on?'700':'500'); }); }
widget('w-allude',{state:{k:2},rw:0.48,rn:1.05,fmt:{k:function(v){ return AL[v][1]; }},
  draw:function(g,c,s){ alDraw(g,c,c.C,s.k); },
  out:function(s){ return '「'+AL[s.k][0]+'」← 典故：<b>'+AL[s.k][1]+'</b> → '+AL[s.k][2]; }
});
widget('s-F9',{state:{},steps:2,rw:0.48,rn:1.05,
  draw:function(g,c,s){ alDraw(g,c,c.C,s.step?2:3); },
  out:steps(['先排除：「三折肱」在下一句「治病不蘄三折肱」。','「持家但有四立壁」← <b>家徒四壁</b>：家裡只剩四面牆，形容清貧 → 答案。'])
});

/* F14 名詞並列 */
var NP=[['桃李春風一杯酒','桃李｜春風｜一杯酒','昔日春天相聚飲酒（黃庭堅〈寄黃幾復〉，宋）'],['江湖夜雨十年燈','江湖｜夜雨｜十年燈','十年漂泊、夜雨孤燈'],['雞聲茅店月','雞聲｜茅店｜月','溫庭筠〈商山早行〉（唐）：清晨趕路'],['枯藤老樹昏鴉','枯藤｜老樹｜昏鴉','馬致遠〈天淨沙・秋思〉（元曲）：蕭瑟秋景']];
function pw(g,t,fs){ g.save(); g.font='700 '+fs+'px "Noto Sans TC",sans-serif'; var w=g.measureText(t).width+18; g.restore(); return w; }
function npDraw(g,c,C,k){ var W=c.w, H=c.h, fs=c.narrow?11:14, rh=(H-20)/NP.length, xl=c.narrow?8:20, xr=W*(c.narrow?0.44:0.4);
  NP.forEach(function(a,i){ var y=10+i*rh+rh/2, on=i===k; T(g,a[0],xl,y-9,on?C.red:C.ink,fs+1,'left','700'); T(g,a[2],xl,y+13,on?C.ink:C.muted,fs-3,'left',on?'700':'500');
    var x=xr; a[1].split('｜').forEach(function(p,j){ var w=pw(g,p,fs); pill(g,x+w/2,y,p,[C.blue,PURPLE,ORANGE][j],on,fs); x+=w+6; }); }); }
widget('w-noun',{state:{k:0},rw:0.48,rn:1.05,fmt:{k:function(v){ return NP[v][0]; }},
  draw:function(g,c,s){ npDraw(g,c,c.C,s.k); },
  out:function(s){ return '「'+NP[s.k][0]+'」→ <b>'+NP[s.k][1]+'</b>：'+NP[s.k][2]; }
});
widget('s-F14',{state:{},steps:2,rw:0.48,rn:1.05,
  draw:function(g,c,s){ npDraw(g,c,c.C,s.step?2:-1); },
  out:steps(['先找動詞：「垂、闊、湧、流」「直、圓」「綠」都是謂語，這些句子不是只有名詞。','「雞聲｜茅店｜月，人跡｜板橋｜霜」六個名詞詞組並列、沒有動詞 → 答案。'])
});

/* F10 狼與雁 */
var VN=[['人稱','「我」（個體）','「我們」（群體）','都借動物寫人'],['意象','長嗥、曠野','地平線（理想）、雲翳（阻礙）','動物意象寄託人生態度'],['情感','孤獨淒涼 ＋ 自尊自信','堅持不放棄、世代延續','都不向困境低頭'],['重點','痛快宣示自我（「過癮」）','追尋的過程本身就是意義','重過程，不重結果']];
function vennDraw(g,c,C,k){ var G=frame(full(c),-5,5,-3.2,3.2,8,true), fs=c.narrow?10:12, v=VN[k];
  circle(g,G.X(-1.5),G.Y(0),2.7*G.sx,alpha(C.red,0.1),C.red,2); circle(g,G.X(1.5),G.Y(0),2.7*G.sx,alpha(C.blue,0.1),C.blue,2);
  T(g,'〈狼之獨步〉紀弦',G.X(-2.4),G.Y(2.85),C.red,fs+1,'center','700'); T(g,'〈雁〉白萩',G.X(2.4),G.Y(2.85),C.blue,fs+1,'center','700');
  T(g,v[0],G.X(0),G.Y(1.9),C.ink,fs+2,'center','700');
  wrap(g,v[1],G.X(-3.9),G.Y(0.4),2.2*G.sx,fs,C.ink,'700'); wrap(g,v[2],G.X(1.8),G.Y(0.4),2.3*G.sx,fs,C.ink,'700');
  wrap(g,v[3],G.X(-0.75),G.Y(-0.4),1.5*G.sx,fs,GREEN,'700');
  T(g,'差異',G.X(-2.9),G.Y(-1.9),C.red,fs-1,'center'); T(g,'共同',G.X(0),G.Y(-1.9),GREEN,fs-1,'center'); T(g,'差異',G.X(2.9),G.Y(-1.9),C.blue,fs-1,'center'); }
widget('w-venn',{state:{k:0},rw:0.48,rn:1.1,fmt:{k:function(v){ return VN[v][0]; }},
  draw:function(g,c,s){ vennDraw(g,c,c.C,s.k); },
  out:function(s){ var v=VN[s.k]; return '<b>'+v[0]+'</b>　狼：'+v[1]+'｜雁：'+v[2]+'｜共同：'+v[3]; }
});
widget('s-F10',{state:{},steps:2,rw:0.48,rn:1.1,
  draw:function(g,c,s){ vennDraw(g,c,c.C,s.step?1:0); },
  out:steps(['人稱：〈狼之獨步〉是「我」，凸顯個體；〈雁〉是「我們」，凸顯群體 → 答案。','再看意象：狼的長嗥是自我宣示；雁追著地平線，是一代代的追尋。'])
});

/* F11 劉姥姥 */
var LIU=[['王熙鳳','在劉姥姥頭上插滿花','劉姥姥自嘲「做個老風流」：明知被捉弄仍幽默配合'],['鴛鴦','稱劉姥姥為「女篾片」','篾片＝豪門幫閒湊趣的門客；劉姥姥說「你先囑咐我，我就明白了」，是主動配合'],['林黛玉','瀟湘館「竟比那上等的書房還好」','從陳設看出黛玉像讀書人，也見劉姥姥說話得體'],['賈母','正房「大箱大櫃大桌子大床，果然威武」','以「大」寫賈府富貴；劉姥姥讓路走土地，知所分寸'],['李紈','勸鴛鴦別淘氣','李紈溫厚穩重；鴛鴦回「有我呢」見其得寵']];
function liuDraw(g,c,C,k){ var G=frame(full(c),-5,5,-3.2,3.2,8,true), fs=c.narrow?10:12, ang=[2.2,0.9,-0.4,-1.7,3.5];
  circle(g,G.X(0),G.Y(0),0.95*G.sx,alpha(ORANGE,0.25),ORANGE,3); T(g,'劉姥姥',G.X(0),G.Y(0.15),C.ink,fs+3,'center','700'); T(g,'第二次進榮國府',G.X(0),G.Y(-0.4),C.muted,fs-2,'center');
  LIU.forEach(function(p,i){ var a=ang[i], x=3.3*Math.cos(a), y=2.4*Math.sin(a), on=i===k; L(g,G.X(0.95*Math.cos(a)),G.Y(0.95*Math.sin(a)),G.X(x*0.78),G.Y(y*0.78),on?C.red:C.grid,on?3:1.5);
    pill(g,G.X(x),G.Y(y),p[0],on?C.red:C.blue,on,fs+1); if(on) T(g,p[1],G.X(x*0.55),G.Y(y*0.55-0.35),on?C.red:C.muted,fs-1,'center',on?'700':'500'); });
  T(g,'《紅樓夢》（本名《石頭記》）第四十回',G.X(-4.9),G.Y(-3.0),C.muted,fs-1,'left'); }
widget('w-liu',{state:{k:0},rw:0.45,rn:1.0,fmt:{k:function(v){ return LIU[v][0]; }},
  draw:function(g,c,s){ liuDraw(g,c,c.C,s.k); },
  out:function(s){ var p=LIU[s.k]; return '<b>'+p[0]+'</b>：'+p[1]+' → '+p[2]; }
});
widget('s-F11',{state:{},steps:2,rw:0.45,rn:1.0,
  draw:function(g,c,s){ liuDraw(g,c,c.C,s.step?1:0); },
  out:steps(['被插滿頭花、滑一跤，劉姥姥都先自己笑自己。','「才說嘴就打了嘴」也是<b>幽默自嘲</b>，把出醜變成逗老太太開心的表演 → 答案。'])
});

/* F12 玉山 */
var YM=[[0.0,'凌晨摸黑上山','黑暗、崎嶇山徑；像史前跋涉者，有恐懼也有興奮',0.0,0.1],[0.2,'冷杉林','林中還有遮蔽',0.25,0.0],[0.38,'森林界線以上','遮蔽減少，風與寒氣直接侵襲',0.5,-0.2],[0.52,'天色轉亮','看清巉岩陡崖，驚懼反而加重',0.65,-0.5],[0.68,'風口','視野由受遮蔽轉為突然開闊',0.82,0.5],[0.84,'登頂（3,952 m）','嶔奇孤絕、冷肅硬毅；雲海翻湧',1.0,0.8],[1.0,'日出後','對照地圖認山名，群山「來到心中」，戀慕故鄉',1.0,1.0]];
function ysAt(t){ for(var i=YM.length-1;i>=0;i--) if(t>=YM[i][0]) return i; return 0; }
function yushanDraw(g,c,C,t,hl){ var G=frame(full(c),-0.05,1.05,-1.3,1.25,16,false), fs=c.narrow?10:12, i=ysAt(t);
  var sky=t<0.45?0.85-t:0.4*(1-t); box(g,0,0,c.w,c.h,alpha('#1d2b53',Math.max(0,sky)),null); if(t>0.5) box(g,0,0,c.w,c.h,alpha('#f6c343',0.08*(t-0.5)),null);
  function alt(u){ return u<0.84?u/0.84:1; }
  g.save(); g.fillStyle=alpha('#6b5b3a',0.35); g.beginPath(); g.moveTo(G.X(0),G.Y(-1.3)); for(var u=0;u<=1.0001;u+=0.01) g.lineTo(G.X(u),G.Y(alt(u)*1.05-0.05+0.03*Math.sin(u*40))); g.lineTo(G.X(1),G.Y(-1.3)); g.closePath(); g.fill(); g.restore();
  plot(g,G,function(u){ return alt(u)*1.05-0.05; },0,t,'#ffffff',3);
  g.save(); g.strokeStyle=C.red; g.lineWidth=2.5; g.setLineDash([6,4]); g.beginPath(); for(var j=0;j<=i;j++){ var px=YM[j][0], py=YM[j][4]*0.5-0.75; if(j) g.lineTo(G.X(px),G.Y(py)); else g.moveTo(G.X(px),G.Y(py)); } g.stroke(); g.restore();
  T(g,'心情',G.X(-0.03),G.Y(-0.3),C.red,fs,'left','700');
  YM.forEach(function(m,j){ var on=j===(hl!=null?hl:i), show=j<=i; dot(g,G.X(m[0]),G.Y(alt(m[0])*1.05-0.05),on?7:4,show?(on?C.red:'#ffffff'):alpha('#ffffff',0.3)); if(show&&(on||!c.narrow)) T(g,m[1],G.X(m[0]),G.Y(alt(m[0])*1.05+0.12),on?'#ffd166':'#ffffff',on?fs+1:fs,j===0?'left':j===YM.length-1?'right':'center','700'); });
  dot(g,G.X(t),G.Y(alt(t)*1.05-0.05),8,C.red); }
widget('w-yushan',{state:{t:0.7},rw:0.42,rn:0.95,fmt:{t:function(v){ return YM[ysAt(v)][1]; }},
  draw:function(g,c,s){ yushanDraw(g,c,c.C,s.t); },
  out:function(s){ var m=YM[ysAt(s.t)]; return '<b>'+m[1]+'</b>：'+m[2]; }
});
widget('s-F12',{state:{},steps:2,rw:0.42,rn:0.95,
  draw:function(g,c,s){ yushanDraw(g,c,c.C,s.step?0.7:0.55,s.step?4:3); },
  out:steps(['風口之前：天亮了但山脈擋住視線，又看見陡崖，心情往下掉。','到了<b>風口</b>：視野由受遮蔽轉為<b>突然開闊</b>，心情也跟著衝上去 → 答案。'])
});

/* F13 秦晉鄭 */
var ZH=[['以退為進','「秦、晉圍鄭，鄭既知亡矣」：先承認鄭將亡，卸下秦伯的防備'],['亡鄭無益於秦','「越國以鄙遠，君知其難也」：秦要越過晉才管得到鄭，守不住'],['亡鄭有害於秦','「鄰之厚，君之薄也」：鄭地歸晉，晉強則秦弱'],['舍鄭有益於秦','「若舍鄭以為東道主，行李之往來，共其乏困」：鄭可做秦的東方接待站'],['晉不可信、貪得無厭','「既東封鄭，又欲肆其西封；若不闕秦，將焉取之」：晉吃完鄭，下一步向西吃秦']];
function zhengDraw(g,c,C,k){ var G=frame(full(c),-5,5,-2.6,2.8,8,true), fs=c.narrow?11:13, jw=k>=2?2.6:2.0;
  B(g,G,-4.8,-1.0,-2.8,1.2,alpha(C.blue,0.18),C.blue,2); T(g,'秦（西）',G.X(-3.8),G.Y(0.1),C.blue,fs+2,'center','700');
  B(g,G,-2.6,-1.4,-2.6+jw*1.0+0.6,1.6,alpha(PURPLE,0.18),PURPLE,2); T(g,'晉',G.X(-2.6+(jw+0.6)/2),G.Y(0.1),PURPLE,fs+2,'center','700');
  var zx=k>=2?0.9:1.0; if(k<2){ B(g,G,zx,-0.9,zx+2.0,1.1,alpha(ORANGE,0.2),ORANGE,2); T(g,'鄭（東）',G.X(zx+1.0),G.Y(0.1),ORANGE,fs+2,'center','700'); }
  else { B(g,G,zx,-0.9,zx+2.0,1.1,alpha(PURPLE,0.12),PURPLE,1.5,[5,4]); T(g,'鄭地歸晉',G.X(zx+1.0),G.Y(0.1),PURPLE,fs,'center','700'); }
  if(k===0) T(g,'秦、晉聯軍圍鄭；燭之武夜縋而出，見秦伯',G.X(0),G.Y(2.3),C.ink,fs,'center','700');
  if(k===1){ g.save(); g.strokeStyle=C.red; g.lineWidth=3; g.setLineDash([7,5]); g.beginPath(); g.moveTo(G.X(-3.0),G.Y(1.4)); g.quadraticCurveTo(G.X(-1.0),G.Y(2.6),G.X(1.6),G.Y(1.3)); g.stroke(); g.restore(); arrow(g,G.X(1.3),G.Y(1.45),G.X(1.6),G.Y(1.3),C.red,3); T(g,'越國以鄙遠：要越過晉',G.X(-0.8),G.Y(2.45),C.red,fs,'center','700'); }
  if(k===2) T(g,'鄰之厚，君之薄也',G.X(-0.5),G.Y(2.3),C.red,fs+1,'center','700');
  if(k===3){ arrow(g,G.X(-2.9),G.Y(-1.4),G.X(1.4),G.Y(-1.2),GREEN,2.5); arrow(g,G.X(1.4),G.Y(-1.6),G.X(-2.9),G.Y(-1.8),GREEN,2.5); T(g,'東道主：使者往來，供其乏困',G.X(-0.7),G.Y(-2.25),GREEN,fs,'center','700'); B(g,G,zx,-0.9,zx+2.0,1.1,alpha(ORANGE,0.2),ORANGE,2); T(g,'鄭（保留）',G.X(zx+1.0),G.Y(0.1),ORANGE,fs,'center','700'); }
  if(k===4){ arrow(g,G.X(-1.0),G.Y(1.9),G.X(1.4),G.Y(1.9),PURPLE,3); T(g,'東封鄭',G.X(0.2),G.Y(2.3),PURPLE,fs,'center','700'); arrow(g,G.X(-2.4),G.Y(-1.7),G.X(-3.9),G.Y(-1.7),C.red,3.5); T(g,'又欲肆其西封 → 闕秦',G.X(-3.2),G.Y(-2.25),C.red,fs,'center','700'); } }
widget('w-zheng',{state:{k:1},rw:0.45,rn:0.95,fmt:{k:function(v){ return ZH[v][0]; }},
  draw:function(g,c,s){ zhengDraw(g,c,c.C,s.k); },
  out:function(s){ return '<b>'+ZH[s.k][0]+'</b>：'+ZH[s.k][1]; }
});
widget('s-F13',{state:{},steps:2,rw:0.45,rn:0.95,
  draw:function(g,c,s){ zhengDraw(g,c,c.C,s.step?2:1); },
  out:steps(['「越國以鄙遠」：越過晉國，把<b>遠方的鄭國</b>當作邊境 → 「遠」指鄭國。','滅鄭之後，土地全歸晉：「鄰之厚，君之薄也」。'])
});
`
};
