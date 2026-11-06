/* js/utils/MathText.js — 2026-11-06 知識弱點「重點整理」：用方程式呈現解題步驟。

   不靠外部數學排版函式庫（頁面要能離線、file:// 開啟），用一小段標記
   自己排成 DOM（全部 textContent，不用 innerHTML，資料裡的文字不會被當成
   HTML）：

     frac{分子}{分母}   上下堆疊的分數
     sqrt{內容}         根號，內容上方加橫線
     ^{上標}  _{下標}
   其餘文字照原樣顯示；可以巢狀，例如 sqrt{1^{2} + (sqrt{3})^{2}}。

   API
     inline(src)      -> <span class="mt">…</span>
     equations(lines) -> <div class="mt-eq">，依關係符號對齊的算式：
       一行以 "= " 或 "⇒ " 開頭 → 接續上一行（左邊留空，符號對齊）；
       否則在第一個 " = " / " ⇒ " 處拆成 左式｜符號｜右式；都沒有就整行
       放在右式欄。 */
window.AHS = window.AHS || {};

AHS.MathText = (function () {
  "use strict";

  function span(cls, children) {
    var s = document.createElement("span");
    if (cls) { s.className = cls; }
    (children || []).forEach(function (c) { if (c) { s.appendChild(c); } });
    return s;
  }
  function text(t) { return document.createTextNode(t); }

  /* 讀取 src[i] 開始的 {…}（含巢狀），回傳 { body, next } 或 null。 */
  function group(src, i) {
    if (src.charAt(i) !== "{") { return null; }
    var depth = 0;
    for (var j = i; j < src.length; j++) {
      var c = src.charAt(j);
      if (c === "{") { depth++; }
      else if (c === "}") { depth--; if (depth === 0) { return { body: src.slice(i + 1, j), next: j + 1 }; } }
    }
    return null;
  }

  function parse(src) {
    var out = [];
    var buf = "";
    var i = 0;
    function flush() { if (buf) { out.push(text(buf)); buf = ""; } }
    while (i < src.length) {
      var g, g2;
      if (src.substr(i, 5) === "frac{" && (g = group(src, i + 4)) && (g2 = group(src, g.next))) {
        flush();
        out.push(span("mt-frac", [span("mt-frac__num", parse(g.body)), span("mt-frac__den", parse(g2.body))]));
        i = g2.next; continue;
      }
      if (src.substr(i, 5) === "sqrt{" && (g = group(src, i + 4))) {
        flush();
        out.push(span("mt-sqrt", [span("mt-sqrt__sign", [text("√")]), span("mt-sqrt__body", parse(g.body))]));
        i = g.next; continue;
      }
      if ((src.charAt(i) === "^" || src.charAt(i) === "_") && (g = group(src, i + 1))) {
        flush();
        var el = document.createElement(src.charAt(i) === "^" ? "sup" : "sub");
        el.className = "mt-script";
        parse(g.body).forEach(function (n) { el.appendChild(n); });
        out.push(el);
        i = g.next; continue;
      }
      if (src.charAt(i) === "✓") {
        /* 數學字型會把 ✓ 畫成像根號的字形，改用一般字型顯示。 */
        flush();
        out.push(span("mt-ok", [text("✓")]));
        i++; continue;
      }
      buf += src.charAt(i);
      i++;
    }
    flush();
    return out;
  }

  function inline(src) { return span("mt", parse(String(src == null ? "" : src))); }

  var OPS = ["=", "⇒"];
  function splitLine(line) {
    var t = String(line).trim();
    for (var k = 0; k < OPS.length; k++) {
      if (t.indexOf(OPS[k] + " ") === 0) { return { lhs: "", op: OPS[k], rhs: t.slice(OPS[k].length + 1) }; }
    }
    var best = -1, op = "";
    OPS.forEach(function (o) {
      var at = t.indexOf(" " + o + " ");
      if (at !== -1 && (best === -1 || at < best)) { best = at; op = o; }
    });
    if (best === -1) { return { lhs: "", op: "", rhs: t }; }
    return { lhs: t.slice(0, best), op: op, rhs: t.slice(best + op.length + 2) };
  }

  function equations(lines) {
    var wrap = document.createElement("div");
    wrap.className = "mt-eq";
    (lines || []).forEach(function (line) {
      var parts = splitLine(line);
      wrap.appendChild(span("mt-eq__lhs", [inline(parts.lhs)]));
      wrap.appendChild(span("mt-eq__op", [text(parts.op)]));
      wrap.appendChild(span("mt-eq__rhs", [inline(parts.rhs)]));
    });
    return wrap;
  }

  return { inline: inline, equations: equations };
})();
