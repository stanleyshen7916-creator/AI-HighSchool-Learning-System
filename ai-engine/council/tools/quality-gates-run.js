#!/usr/bin/env node
'use strict';
/* tools/quality-gates-run.js — 對已發布教材跑 AHS-QB1 品質關卡 1–4（只讀，不改題庫）。
   用途：校準關卡（QB1）、既有題庫體檢預跑（QB1.5）。需要本機 Ollama；重負載，只在批次窗口跑。

   node tools/quality-gates-run.js <tm_x> [tm_y …] [--out report.json] [--judge qwen3:8b] [--answer gpt-oss:20b] [--limit N]
   去重的比對對象：同科目其他已發布教材的題目。 */
const fs = require('fs');
const path = require('path');
const { runGates, createOllamaModels } = require('../platform/QualityGates');

const REPO = path.join(__dirname, '..', '..', '..');
const MATERIALS = path.join(REPO, 'docs', 'TeachingMaterials', 'materials');

function arg(name, dflt) { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; }
const ids = process.argv.slice(2).filter((a, i, all) => /^tm_\d+$/.test(a) && !String(all[i - 1] || '').startsWith('--'));
if (!ids.length) { console.error('usage: node tools/quality-gates-run.js <tm_x> [...] [--out file] [--judge model] [--answer model] [--limit N]'); process.exit(2); }

const read = (id, f) => JSON.parse(fs.readFileSync(path.join(MATERIALS, id, f), 'utf8'));
const subjectOf = (id) => { try { return read(id, 'metadata.json').subject; } catch (e) { return null; } };

(async () => {
  const models = createOllamaModels({ judgeModel: arg('--judge', 'qwen3:8b'), answerModel: arg('--answer', 'gpt-oss:20b') });
  const limit = Number(arg('--limit', 0)) || Infinity;
  const all = fs.readdirSync(MATERIALS).filter((d) => /^tm_\d+$/.test(d) && fs.existsSync(path.join(MATERIALS, d, 'questionbank.json')));
  const out = { startedAt: new Date().toISOString(), models: { judge: arg('--judge', 'qwen3:8b'), answer: arg('--answer', 'gpt-oss:20b'), embed: null }, materials: [] };
  for (const id of ids) {
    const subject = subjectOf(id);
    const existing = all.filter((d) => d !== id && subjectOf(d) === subject).flatMap((d) => read(d, 'questionbank.json').questions || []);
    const qs = (read(id, 'questionbank.json').questions || []).slice(0, limit);
    const t0 = Date.now();
    const { results, report } = await runGates(qs, Object.assign({}, models, {
      existing,
      onProgress: (r, n, total) => process.stdout.write(`\r${id} ${n}/${total} ${r.passed ? 'PASS' : 'FAIL@' + r.failedAt}        `),
    }));
    process.stdout.write('\n');
    out.materials.push({ materialId: id, subject, existingCompared: existing.length, seconds: Math.round((Date.now() - t0) / 1000), report, results });
    console.log(id, JSON.stringify(report));
  }
  out.finishedAt = new Date().toISOString();
  const file = arg('--out', null);
  if (file) { fs.writeFileSync(file, JSON.stringify(out, null, 2)); console.log('wrote', file); }
})().catch((e) => { console.error(e); process.exit(1); });
