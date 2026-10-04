// Verify tm_29's past exam questions against 大考中心's official papers and FINAL answer keys.
// Compares every CJK character (in order) of stem + options with the official text (the PDF text
// layer loses sub/superscripts, so formulas were checked by eye against the page images), and the
// answer letter against the official 「選擇題答案」. Documented exceptions are listed below.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const { parseQuestionText } = require('C:/GitHub/AI-HighSchool-Learning-System/ai-engine/council/platform/FinalParser');
const D = path.join(__dirname, '..', 'ceec');
const cjk = (s) => (String(s).normalize('NFKC').match(/[\u4e00-\u9fff]/g) || []).join('');
const text = (pdf, layout) => execSync(`pdftotext ${layout ? '-layout ' : ''}-enc UTF-8 "${path.join(D, pdf)}" -`).toString('utf8').normalize('NFKC');
const keyOf = (pdf) => { const k = {}; for (const m of text(pdf, true).matchAll(/(\d+)\s+([A-E]+(?:或[A-E])?)(?=\s)/g)) if (!(m[1] in k)) k[m[1]] = m[2]; return k; };
const SRC = {
  '108學年度指定科目考試 化學考科': { paper: 'che108.pdf', key: 'che108-ans.pdf' },
  '106學年度指定科目考試 化學考科': { paper: 'che106.pdf', key: 'che106-ans.pdf' },
  '107學年度指定科目考試 化學考科': { paper: 'che107.pdf', key: 'che107-ans.pdf' },
  '111學年度分科測驗 化學考科': { paper: 'che111.pdf', key: 'che111-ans.pdf' },
};
function block(paper, num) {
  const t = text(paper).replace(/\r/g, '');
  const m = new RegExp('(?:^|\\n)\\s*' + num + '\\s*\\.\\s([\\s\\S]*?)(?=\\n\\s*' + (num + 1) + '\\s*\\.\\s|\\n\\s*\\d+\\s*-\\s*\\d+\\s*題\\s*為\\s*題\\s*組|$)').exec(t);
  return m ? m[1] : '';
}
function groupIntro(paper, a, b) {
  const t = text(paper).replace(/\r/g, '');
  const m = new RegExp(a + '\\s*-\\s*' + b + '\\s*題\\s*為\\s*題\\s*組([\\s\\S]*?)(?=\\n\\s*' + a + '\\s*\\.\\s)').exec(t);
  return m ? cjk(m[1]) : '';
}
// Page furniture the text layer interleaves into a question block.
const furniture = (s) => s.replace(/二多選題占分說明.*$/, '').replace(/第頁共頁年指考化學考科/g, '').replace(/年指考化學考科第頁共頁/g, '');
let ok = true;
for (const q of parseQuestionText(fs.readFileSync(path.join(__dirname, 'past-tm_29.md'), 'utf8')).questions) {
  const [, exam, num] = /^(.*?) 第(\d+)題/.exec(q.reference);
  const src = SRC[exam];
  const problems = [];
  let mine = q.question.replace(/（第\d+–\d+題為題組）/, '')
    .replace(/（原卷附圖略，本題作答不需參考）/g, '')
    .replace(/（原卷圖 3 以文字描述：[^）]*）/, ''); // 106-20: added figure description (documented)
  let off = furniture(cjk(block(src.paper, Number(num))));
  const g = /第(\d+)–(\d+)題題組/.exec(q.reference);
  if (g) {
    const intro = groupIntro(src.paper, g[1], g[2]);
    if (cjk(mine).indexOf(intro) !== 0) problems.push('group intro differs');
    mine = cjk(mine).slice(intro.length);
  } else mine = cjk(mine);
  // 106-9: the table is rewritten as one line of text; compare the text before and after it.
  if (exam.startsWith('106') && num === '9') {
    const cut = (s) => s.replace(/表容器甲乙丙丁[\s\S]*?(假設所有氣體)/, '$1');
    mine = cut(mine); off = cut(off.replace(/表容器/, '表容器'));
  }
  // 106-20: figure labels 「圖」 in the text layer.
  if (exam.startsWith('106') && num === '20') off = off.replace(/等於圖/, '等於');
  // 111-1: figure labels inserted into the options by the text layer (same exception as tm_26).
  if (exam.startsWith('111') && num === '1') off = off.replace(/的氨氣氯化氫克氨氣的氯化氫圖的氯化氫$/, '的氨氣的氯化氫的氯化氫');
  const myAll = mine + cjk(q.options.join(''));
  if (off !== myAll) problems.push('text differs:\n   mine=' + myAll + '\n   off =' + off);
  const key = keyOf(src.key)[num];
  const letter = 'ABCDE'[q.options.indexOf(q.answer)];
  if (key !== letter) problems.push('answer ' + letter + ' but official ' + key);
  console.log((problems.length ? 'BAD ' : 'OK  ') + q.reference + (problems.length ? '\n  ' + problems.join('\n  ') : ''));
  ok = ok && !problems.length;
}
console.log(ok ? 'ALL MATCH (Chinese text in order + official final answer)' : 'MISMATCHES FOUND');
