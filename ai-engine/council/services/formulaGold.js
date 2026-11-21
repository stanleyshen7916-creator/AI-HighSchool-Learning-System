// 2026-11-18 AHS-UP2 M2：公式標準答案比對。把 MinerU 的 equation LaTeX 與人工轉寫的標準答案
// 正規化後算相似度（Levenshtein），回報通過率。純函式，不碰檔案系統。

function normalizeLatex(latex) {
  let s = String(latex || '');
  s = s.replace(/\\(left|right|displaystyle|bigl|bigr|Big|big)(?![a-zA-Z])/g, '')
    .replace(/\\(begin|end)\{array\}(\{[^}]*\})?/g, '')
    .replace(/\\(mathop|mathrm|mathfrak|textstyle)(?![a-zA-Z])/g, '')
    .replace(/\\dfrac/g, '\\frac')
    .replace(/\\(qquad|quad)(?![a-zA-Z])/g, '')
    .replace(/\\[,;! ]/g, '')
    .replace(/\\\\/g, '')
    .replace(/[\s{}&]/g, '')
    .replace(/[.,，。]+$/, '')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\^\\circ/g, '°');
  return s;
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    const cur = [i];
    for (let j = 1; j <= n; j += 1) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

function similarity(a, b) {
  const x = normalizeLatex(a);
  const y = normalizeLatex(b);
  const len = Math.max(x.length, y.length);
  return len ? 1 - levenshtein(x, y) / len : 1;
}

// goldItems: [{ source, index, page, latex }]；equationsBySource: { '2.pdf': [latex, ...] }（依出現順序）
function evaluateFormulas(goldItems, equationsBySource, { threshold = 0.9 } = {}) {
  const results = goldItems.map((g) => {
    const got = (equationsBySource[g.source] || [])[g.index];
    const score = typeof got === 'string' ? similarity(got, g.latex) : 0;
    return { source: g.source, index: g.index, page: g.page, score: Number(score.toFixed(3)), pass: score >= threshold, missing: typeof got !== 'string' };
  });
  const passed = results.filter((r) => r.pass).length;
  return { total: results.length, passed, passRate: results.length ? passed / results.length : 0, threshold, results };
}

module.exports = { normalizeLatex, similarity, evaluateFormulas };
