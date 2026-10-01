// Verify every past-exam question against the official text + official answer key.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const { parseQuestionText } = require('C:/GitHub/AI-HighSchool-Learning-System/ai-engine/council/platform/FinalParser');
const D = path.join(__dirname, 'ceec');
const strip = (s) => String(s).replace(/[\s\u3000]/g, '');
const keyOf = (pdf) => { const t = execSync(`pdftotext -layout -enc UTF-8 "${path.join(D, pdf)}" -`).toString(); const k = {}; for (const m of t.matchAll(/(\d+)\s+([A-E]+|／)/g)) if (!(m[1] in k)) k[m[1]] = m[2]; return k; };
const KEYS = { 114: keyOf('114-soc-ans.pdf'), 113: keyOf('113-soc-final.pdf') };
const official = (year, args) => execSync(`python extract.py ${year}-soc.txt ${args}`, { cwd: D, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }).toString('utf8');
let ok = true, n = 0;
for (const f of fs.readdirSync(__dirname).filter((x) => /^past-tm_\d+\.md$/.test(x))) {
  const qs = parseQuestionText(fs.readFileSync(path.join(__dirname, f), 'utf8')).questions;
  for (const q of qs) {
    n++;
    const m = /(11[34])學年度學科能力測驗 社會考科 第(\d+)題/.exec(q.reference || '');
    const g = /第(\d+)–(\d+)題題組/.exec(q.reference || '');
    const year = m[1], num = m[2];
    const off = official(year, num);
    const offStem = /^Q \d+ \| (.*)$/m.exec(off)[1];
    const offOpts = [...off.matchAll(/^\s+\(([A-E])\) (.*)$/gm)].map((x) => x[2]);
    // my stem = [group text] + question; question part is after the last "請問：" (or whole stem)
    const mine = q.question.replace(/（第\d+–\d+題為題組）/, '').replace(/（原卷附圖略，本題作答不需參考）/g, '').replace(/表3（依原卷表格內容轉為文字）.*?(?=根據表 3)/, '');
    const qPart = mine.split('請問：').pop();
    const problems = [];
    if (strip(qPart) !== strip(offStem)) problems.push('stem differs:\n   mine=' + qPart + '\n   off =' + offStem);
    if (JSON.stringify(q.options.map(strip)) !== JSON.stringify(offOpts.map(strip))) problems.push('options differ: ' + JSON.stringify(q.options) + ' vs ' + JSON.stringify(offOpts));
    const letter = 'ABCDE'[q.options.indexOf(q.answer)];
    if (KEYS[year][num] !== letter) problems.push('answer ' + letter + ' but official ' + KEYS[year][num]);
    if (g) {
      const offGroup = strip(/^GROUP \S+ \| (.*)$/m.exec(official(year, g[1] + '-' + g[2]))[1]);
      const groupPart = mine.slice(0, mine.lastIndexOf('請問：') + 3);
      // every sentence of my group text must appear in the official group text
      // Documented exception: in 113 社會 the text layer has the map label 「俄羅斯」 inserted
      // mid-sentence (「…東方（西亞）」俄羅斯之間」); the page image (p.15) shows 「…」之間」.
      const offFixed = offGroup.replace('（西亞）」俄羅斯之間', '（西亞）」之間');
      const missing = groupPart.split(/(?<=[。：])/).map(strip).filter((s) => s && !offFixed.includes(s));
      if (missing.length) problems.push('group sentences not found: ' + missing.join(' / '));
    }
    console.log((problems.length ? 'BAD ' : 'OK  ') + f + ' ' + q.reference + (problems.length ? '\n  ' + problems.join('\n  ') : ''));
    ok = ok && !problems.length;
  }
}
console.log(n + ' questions, ' + (ok ? 'ALL MATCH the official text and answer key' : 'MISMATCHES FOUND'));
