#!/usr/bin/env node
'use strict';
/* tools/quality-gates-run.js — 對已發布教材跑 AHS-QB1 品質關卡 1–4（只讀，不改題庫）。
   用途：校準關卡（QB1）、既有題庫體檢預跑（QB1.5）。需要本機 Ollama；重負載，只在批次窗口跑。

   node tools/quality-gates-run.js <tm_x> [tm_y …] [--out report.json] [--judge qwen3:8b] [--answer gpt-oss:20b] [--embed bge-m3|none] [--limit N]
   去重的比對對象：同科目其他已發布教材的題目。
   關卡 4 預設用 bge-m3（餘弦 ≥0.95）；向量快取在 data/embed-cache/（不進版控），第二次起只算新題。
   Ollama 沒有該模型或寫 --embed none 時，改用字元雙字組相似度（Jaccard ≥0.8）。 */
const fs = require('fs');
const path = require('path');
const { runGates, createOllamaModels, createEmbedCache } = require('../platform/QualityGates');

const REPO = path.join(__dirname, '..', '..', '..');
const MATERIALS = path.join(REPO, 'docs', 'TeachingMaterials', 'materials');
const OLLAMA = process.env.OLLAMA_URL || 'http://127.0.0.1:11435';

function arg(name, dflt) { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; }
const ids = process.argv.slice(2).filter((a, i, all) => /^tm_\d+$/.test(a) && !String(all[i - 1] || '').startsWith('--'));
if (!ids.length) { console.error('usage: node tools/quality-gates-run.js <tm_x> [...] [--out file] [--judge model] [--answer model] [--embed model|none] [--limit N]'); process.exit(2); }

const read = (id, f) => JSON.parse(fs.readFileSync(path.join(MATERIALS, id, f), 'utf8'));
const subjectOf = (id) => { try { return read(id, 'metadata.json').subject; } catch (e) { return null; } };

/* 確認 Ollama 裡有這個 embedding 模型；沒有就回 null（改用雙字組）。 */
async function embedModelOrNull(name) {
  if (!name || name === 'none') return null;
  try {
    const tags = await (await fetch(OLLAMA + '/api/tags')).json();
    const found = (tags.models || []).some((m) => m.name === name || m.name === name + ':latest');
    if (!found) console.warn(`Ollama 沒有 ${name}，關卡 4 改用字元雙字組相似度`);
    return found ? name : null;
  } catch (e) {
    console.warn(`無法連到 Ollama（${e.message}），關卡 4 改用字元雙字組相似度`);
    return null;
  }
}

(async () => {
  const judge = arg('--judge', 'qwen3:8b');
  const answer = arg('--answer', 'gpt-oss:20b');
  const embedModel = await embedModelOrNull(arg('--embed', 'bge-m3'));
  const models = createOllamaModels({ judgeModel: judge, answerModel: answer, embedModel });
  const cache = embedModel ? createEmbedCache(models.embed, {
    file: path.join(__dirname, '..', 'data', 'embed-cache', embedModel.replace(/[^\w.-]/g, '_') + '.json'),
    model: embedModel,
  }) : null;
  const limit = Number(arg('--limit', 0)) || Infinity;
  const all = fs.readdirSync(MATERIALS).filter((d) => /^tm_\d+$/.test(d) && fs.existsSync(path.join(MATERIALS, d, 'questionbank.json')));
  const out = { startedAt: new Date().toISOString(), models: { judge, answer, embed: embedModel }, materials: [] };
  for (const id of ids) {
    const subject = subjectOf(id);
    const existing = all.filter((d) => d !== id && subjectOf(d) === subject).flatMap((d) => read(d, 'questionbank.json').questions || []);
    const qs = (read(id, 'questionbank.json').questions || []).slice(0, limit);
    const t0 = Date.now();
    const { results, report } = await runGates(qs, Object.assign({}, models, {
      embed: cache ? cache.embed : null,
      existing,
      onProgress: (r, n, total) => process.stdout.write(`\r${id} ${n}/${total} ${r.passed ? 'PASS' : 'FAIL@' + r.failedAt}        `),
    }));
    process.stdout.write('\n');
    if (cache) { cache.save(); console.log(id, 'embed cache', JSON.stringify(cache.stats())); }
    out.materials.push({ materialId: id, subject, existingCompared: existing.length, seconds: Math.round((Date.now() - t0) / 1000), report, results });
    console.log(id, JSON.stringify(report));
  }
  out.finishedAt = new Date().toISOString();
  const file = arg('--out', null);
  if (file) { fs.writeFileSync(file, JSON.stringify(out, null, 2)); console.log('wrote', file); }
})().catch((e) => { console.error(e); process.exit(1); });
