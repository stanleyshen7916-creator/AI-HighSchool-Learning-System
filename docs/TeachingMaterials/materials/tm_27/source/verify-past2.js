// Verify the 分科測驗 化學 / 學測數學A past exam questions against 大考中心's official PDFs.
// Formulas lose sub/superscripts and fractions in the PDF text layer, so this compares
// every CJK character (in order) of stem + options with the official text, and checks the
// answer against the official FINAL key. Formulas were checked by eye against the page
// images (see material.md).
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const { parseQuestionText } = require('C:/GitHub/AI-HighSchool-Learning-System/ai-engine/council/platform/FinalParser');
const D = path.join(__dirname, 'ceec');
const cjk = (s) => (String(s).normalize('NFKC').match(/[\u4e00-\u9fff]/g) || []).join('');
const pdfText = (pdf, layout) => execSync(`pdftotext ${layout ? '-layout ' : ''}-enc UTF-8 "${path.join(D, pdf)}" -`).toString('utf8').normalize('NFKC');
const keyOf = (pdf) => { const k = {}; for (const m of pdfText(pdf, true).matchAll(/(\d+(?:-\d+)?)\s+([A-E]+|[1-5](?:,[1-5])*|／)(?=\s)/g)) if (!(m[1] in k)) k[m[1]] = m[2]; return k; };
const SRC = {
  '113學年度分科測驗 化學考科': { paper: 'che113.pdf', key: 'che113-ans.pdf', letters: 'ABCDE' },
  '111學年度分科測驗 化學考科': { paper: 'che111.pdf', key: 'che111-ans.pdf', letters: 'ABCDE' },
  '112學年度學科能力測驗 數學A考科': { paper: 'mat112.pdf', key: 'mat112-ans.pdf', letters: '12345' },
};
// official question text = from "N." to the next question number (CJK only)
function officialCjk(paper, num) {
  const t = pdfText(paper).replace(/\r/g, '');
  const m = new RegExp('(?:^|\\n)\\s*' + num + '\\s*\\.\\s([\\s\\S]*?)(?=\\n\\s*' + (Number(num) + 1) + '\\s*\\.\\s|\\n\\s*' + (Number(num) + 1) + '\\s*-\\s*\\d+\\s*題為題組|$)').exec(t);
  return m ? cjk(m[1]) : '';
}
function groupCjk(paper, a, b) {
  const t = pdfText(paper).replace(/\r/g, '');
  const m = new RegExp(a + '\\s*-\\s*' + b + '\\s*題\\s*為\\s*題\\s*組([\\s\\S]*?)(?=\\n\\s*' + a + '\\s*\\.\\s)').exec(t);
  return m ? cjk(m[1]) : '';
}
let ok = true, n = 0;
for (const f of ['past-tm_13.md', 'past-tm_1.md']) {
  for (const q of parseQuestionText(fs.readFileSync(path.join(__dirname, f), 'utf8')).questions) {
    n++;
    const [, exam, num] = /^(.*?) 第(\d+)題/.exec(q.reference);
    const src = SRC[exam];
    const problems = [];
    let mine = q.question.replace(/（第\d+–\d+題為題組）/, '').replace(/（原卷附圖略，本題作答不需參考）/g, '');
    const g = /第(\d+)–(\d+)題題組/.exec(q.reference);
    if (g) {
      const off = groupCjk(src.paper, g[1], g[2]);
      const groupMine = cjk(mine.split(/\n/)[0].includes('請問') ? mine : mine).slice(0, off.length);
      if (!off || cjk(mine).indexOf(off) !== 0) problems.push('group text differs:\n   mine=' + cjk(mine).slice(0, off.length + 5) + '\n   off =' + off);
      mine = cjk(mine).slice(off.length);
    } else {
      mine = cjk(mine);
    }
    // Documented exceptions (checked against the page images):
    //  - 111 化學 Q1: the text layer mixes the figure's labels 「2.46 atm 氯化氫」「6.80 克 氨氣」「圖 1」
    //    into the options; the figure is omitted (not needed to answer).
    //  - 112 數學A Q18: the scoring note 「（單選題，3 分）」 is left out.
    const offQ = officialCjk(src.paper, num)
      .replace(/的氨氣氯化氫克氨氣的氯化氫圖的氯化氫$/, '的氨氣的氯化氫的氯化氫')
      .replace(/單選題分$/, '');
    const myQ = mine + cjk(q.options.join(''));
    if (offQ !== myQ) problems.push('question text differs:\n   mine=' + myQ + '\n   off =' + offQ);
    const key = keyOf(src.key)[num];
    const mineLetter = src.letters['ABCDE'.indexOf('ABCDE'[q.options.indexOf(q.answer)])];
    if (key !== mineLetter) problems.push('answer ' + mineLetter + ' but official ' + key);
    console.log((problems.length ? 'BAD ' : 'OK  ') + f + ' ' + q.reference + (problems.length ? '\n  ' + problems.join('\n  ') : ''));
    ok = ok && !problems.length;
  }
}
console.log(n + ' questions, ' + (ok ? 'ALL MATCH (Chinese text in order + official final answer)' : 'MISMATCHES FOUND'));
