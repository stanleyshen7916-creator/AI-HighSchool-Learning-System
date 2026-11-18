#!/usr/bin/env node
// 公式標準答案回歸（M2）：node tools/formula-eval.js --set 50.pdf=<content_list.json> --set 2.pdf=<content_list.json>
// 讀 MinerU 的 *_content_list.json，與 tests/fixtures/formula_gold.json 比對；換 MinerU 版本／前處理前後各跑一次。
const fs = require('fs');
const path = require('path');
const { splitContentList } = require('../services/mineruContentList');
const { evaluateFormulas } = require('../services/formulaGold');

const sets = {};
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === '--set') {
    const [name, file] = process.argv[++i].split('=');
    sets[name] = splitContentList(JSON.parse(fs.readFileSync(file, 'utf8'))).equations.map((e) => e.latex);
  }
}
const gold = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', 'fixtures', 'formula_gold.json'), 'utf8')).items;
const r = evaluateFormulas(gold, sets);
r.results.forEach((x) => console.log(`${x.pass ? 'PASS' : 'FAIL'} ${x.source}#${x.index} p${x.page} ${x.score}${x.missing ? ' (缺)' : ''}`));
console.log(`通過 ${r.passed}/${r.total}（${(r.passRate * 100).toFixed(0)}%，門檻 ${r.threshold}）`);
process.exit(r.passed === r.total ? 0 : 1);
