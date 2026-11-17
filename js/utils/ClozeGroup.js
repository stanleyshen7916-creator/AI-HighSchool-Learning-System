/* js/utils/ClozeGroup.js — 2026-11-16 短文式英文克漏字（tm_103～tm_105）。
   一篇短文的每個空格各是一題（題號與作答 key 不變，錯題本與統計照舊），題幹格式：
     【單字克漏字】閱讀短文〈標題〉，選出第 n 格最適合的答案。（第 a–b 題為題組）\n\n短文…
   短文中本題空格為【(n) ______】，其他空格為 (n) ______。同一篇短文的題目有相同的
   groupId（QuestionGroupDetector 依「第 a–b 題為題組」自動判定）。測驗頁把整篇短文
   畫成一張卡片，每個空格內嵌自己的下拉選單；這支工具只負責從題幹取出短文與空格編號。
   純函式、無 DOM。 */
window.AHS = window.AHS || {};
AHS.ClozeGroup = (function () {
  "use strict";

  var HEAD = /^【單字克漏字】/;
  var BLANK = /【?\((\d+)\) ______】?/;

  function textOf(q) { return String((q && (q.text || q.question)) || ""); }

  function isCloze(q) { return HEAD.test(textOf(q)); }

  /* parse(q) -> { title, number, passage }；number 是本題的空格編號。 */
  function parse(q) {
    var t = textOf(q);
    var i = t.indexOf("\n\n");
    var head = i === -1 ? t : t.slice(0, i);
    var passage = i === -1 ? "" : t.slice(i + 2);
    var title = /〈([^〉]*)〉/.exec(head);
    var own = /【\((\d+)\) ______】/.exec(passage);
    return { title: title ? title[1] : "", number: own ? Number(own[1]) : 0, passage: passage };
  }

  /* split(passage) -> [文字, 空格編號, 文字, 空格編號, …, 文字]（偶數位是文字）。 */
  function split(passage) {
    return String(passage || "").split(new RegExp(BLANK.source, "g"));
  }

  /* snippet(q) -> 〈標題〉第 n 格：含本題空格的那一句（成績頁用，不重複整篇短文）。 */
  function snippet(q) {
    var p = parse(q);
    var sentences = p.passage.replace(/([.!?]["”]?)\s+/g, "$1\u0001").split("\u0001");
    var hit = sentences.filter(function (s) { return s.indexOf("【(" + p.number + ") ______】") !== -1; })[0] || "";
    /* 同一句有別的空格時，只有本題空格畫成 ______，其他空格寫成 (n) …，才分得出是哪一格。 */
    return "〈" + p.title + "〉第 " + p.number + " 格：" + hit.replace(/【\(\d+\) ______】/, "______").replace(/\((\d+)\) ______/g, "($1) …");
  }

  return { isCloze: isCloze, parse: parse, split: split, snippet: snippet };
})();
