// Independent numeric check of every tm_1 supplement answer: compute the value, then find which option equals it.
const d = Math.PI / 180, r3 = Math.sqrt(3), r2 = Math.sqrt(2);
const close = (a, b) => Math.abs(a - b) < 1e-9;
const cases = [
  ['Q1', Math.acos((25 + 9 - 49) / 30) / d, [60, 90, 120, 150], 'C'],
  ['Q2', Math.sqrt(64 + 25 - 80 * Math.cos(60 * d)), [6, 7, Math.sqrt(89), Math.sqrt(129)], 'B'],
  ['Q3', 6 / Math.sin(30 * d) / 2, [6, 3, 12, 6 * r3], 'A'],
  ['Q4', 0.5 * 4 * 6 * Math.sin(150 * d), [6 * r3, 12, 6, 3], 'C'],
  ['Q5', 2 * r2 * Math.sin(60 * d) / Math.sin(45 * d), [Math.sqrt(6), 2 * r3, 3 * r2, 4], 'B'],
  ['Q6', Math.sqrt(10 * 5 * 3 * 2), [10 * r3, 20 * r3, 10, 5 * r3], 'A'],
  ['Q7', null, null, 'D'],
  ['Q8', Math.acos((9 + 25 - 49) / 30) / d, [90, 120, 135, 150], 'B'],
  ['Q9', 10 / (5 / 13) / 2, [26, 6.5, 10, 13], 'D'],
  ['Q10', 6 * 8 * Math.sin(60 * d), [12 * r3, 24, 24 * r3, 48], 'C'],
  ['Q11', Math.min(Math.sqrt(36 + 64 - 96 * Math.cos(60 * d)), Math.sqrt(36 + 64 - 96 * Math.cos(120 * d))), [2 * Math.sqrt(13), 2 * Math.sqrt(37), 10, 14], 'A'],
  ['Q12', 100 * Math.sin(45 * d) / Math.sin(60 * d), [50 * Math.sqrt(6), 100 * Math.sqrt(6) / 3, 50 * r2, 100 * r3 / 3], 'B'],
];
// Q7: obtuse iff largest^2 > sum of others^2
const sets = [[3, 4, 5], [5, 12, 13], [6, 7, 8], [4, 5, 7]];
const obtuse = sets.map((s) => { const [a, b, c] = s.slice().sort((x, y) => x - y); return c * c > a * a + b * b; });
let ok = true;
for (const [q, v, opts, ans] of cases) {
  let got;
  if (q === 'Q7') got = obtuse.filter(Boolean).length === 1 ? 'ABCD'[obtuse.indexOf(true)] : '?';
  else { const hits = opts.map((o, i) => close(o, v) ? 'ABCD'[i] : null).filter(Boolean); got = hits.length === 1 ? hits[0] : '?(' + hits.join() + ')'; }
  const pass = got === ans; ok = ok && pass;
  console.log(q, pass ? 'OK ' : 'BAD', 'computed→', got, 'key', ans, v == null ? '' : '(' + v.toFixed(6) + ')');
}
console.log(ok ? 'ALL ANSWERS VERIFIED' : 'MISMATCH');
