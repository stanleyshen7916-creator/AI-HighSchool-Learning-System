#!/usr/bin/env node
'use strict';
/* tools/quality-pipeline-run.js — AHS 佇列 9：對一份已發布教材跑品質關卡 1–6（只讀，不改題庫）。重負載，只在批次窗口跑。

   node tools/quality-pipeline-run.js tm_112 --source <md 檔或資料夾> [--source …] --out report.json --pack claude-pack.md
       [--judge qwen3:8b] [--answer gpt-oss:20b] [--review gpt-oss:20b] [--embed bge-m3|none] [--rate 0.1] [--limit N] [--no-gold]

   --source  教材原文（MinerU 輸出的 .md；可給資料夾，會讀其中所有 .md）。詳解逐項驗證 D 與出處比對用；沒有給就全部標待複核。
   --mineru-range <mineru_outputs 資料夾>:<起始時間戳>-<結束時間戳>  一次上傳多頁照片時，每頁是一個 mineru-<時間戳>-… 工作，用時間範圍一次讀進來。
   --review  關卡 5 的審題模型，要與出題模型不同（預設 gpt-oss:20b）。
   --pack    關卡 6 的 Claude 抽樣包（抽樣題＋所有待複核題），貼給 Claude 審；結果用 LocalQA.parseClaudeReview／applyClaudeReview 套回。
   金標準：同科目其他教材中 questionSource=ORIGINAL 的題目（講義／歷屆原題，有官方答案）。 */
const fs = require('fs');
const path = require('path');
const { createOllamaModels, createEmbedCache } = require('../platform/QualityGates');
const { runPipeline } = require('../platform/QualityPipeline');
const { buildClaudePack } = require('../platform/LocalQA');

const REPO = path.join(__dirname, '..', '..', '..');
const MATERIALS = path.join(REPO, 'docs', 'TeachingMaterials', 'materials');
const args = process.argv.slice(2);
const arg = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const all = (name) => args.map((a, i) => (a === name ? args[i + 1] : null)).filter(Boolean);
const id = args.find((a, i) => /^tm_\d+$/.test(a) && !String(args[i - 1] || '').startsWith('--'));
if (!id) { console.error('usage: node tools/quality-pipeline-run.js <tm_x> --source <md|dir> --out file --pack file'); process.exit(2); }

const read = (m, f) => JSON.parse(fs.readFileSync(path.join(MATERIALS, m, f), 'utf8'));
function sourceText(list) {
  const files = [];
  for (const p of list) {
    if (fs.statSync(p).isDirectory()) {
      (function walk(d) { for (const f of fs.readdirSync(d)) { const x = path.join(d, f); if (fs.statSync(x).isDirectory()) walk(x); else if (x.endsWith('.md')) files.push(x); } })(p);
    } else files.push(p);
  }
  return { text: files.map((f) => fs.readFileSync(f, 'utf8')).join('\n\n'), files: files.length };
}

(async () => {
  const meta = read(id, 'metadata.json');
  const ranged = all('--mineru-range').flatMap((spec) => {
    const m = /^(.*):(\d+)-(\d+)$/.exec(spec);
    if (!m) throw new Error('--mineru-range 格式：<資料夾>:<起>-<迄>');
    return fs.readdirSync(m[1]).filter((d) => { const t = Number((/^mineru-(\d+)-/.exec(d) || [])[1]); return t >= Number(m[2]) && t <= Number(m[3]); }).map((d) => path.join(m[1], d));
  });
  const src = sourceText(all('--source').concat(ranged));
  if (!src.files) console.warn('沒有 --source：詳解逐項驗證會把每題標成待複核');
  const judge = arg('--judge', 'qwen3:8b');
  const answer = arg('--answer', 'gpt-oss:20b');
  const reviewModel = arg('--review', 'gpt-oss:20b');
  const embedName = arg('--embed', 'bge-m3');
  const models = createOllamaModels({ judgeModel: judge, answerModel: answer, embedModel: embedName === 'none' ? null : embedName });
  const OLLAMA = process.env.OLLAMA_URL || 'http://127.0.0.1:11435';
  const review = async (prompt, { temperature = 0 } = {}) => {
    const extra = /gpt-oss/i.test(reviewModel) ? { think: 'low' } : (/qwen3/i.test(reviewModel) ? { think: false } : {});
    const r = await fetch(OLLAMA + '/api/generate', { method: 'POST', body: JSON.stringify(Object.assign({ model: reviewModel, prompt, stream: false, options: { temperature, num_predict: 1500 } }, extra)) });
    if (!r.ok) throw new Error(`Ollama HTTP ${r.status}`);
    return (await r.json()).response || '';
  };
  const cache = models.embed ? createEmbedCache(models.embed, { file: path.join(__dirname, '..', 'data', 'embed-cache', embedName.replace(/[^\w.-]/g, '_') + '.json'), model: embedName }) : null;
  const others = fs.readdirSync(MATERIALS).filter((d) => /^tm_\d+$/.test(d) && d !== id && fs.existsSync(path.join(MATERIALS, d, 'questionbank.json')));
  const sameSubject = others.filter((d) => { try { return read(d, 'metadata.json').subject === meta.subject; } catch (e) { return false; } });
  const existing = sameSubject.flatMap((d) => read(d, 'questionbank.json').questions || []);
  // 金標準優先用同科目原題；同科目沒有（例如歷史目前沒有講義原題）就退回其他科目的原題，報告記下來源。
  let goldPool = args.includes('--no-gold') ? [] : existing.filter((q) => q.questionSource === 'ORIGINAL');
  let goldSource = goldPool.length ? 'same-subject' : 'none';
  if (!goldPool.length && !args.includes('--no-gold')) {
    // 跨科目借題時帶上原題自己的科目，關卡 5 才不會用「歷史」去判斷數學題是否超綱。
    const subjectOf = (d) => { try { return read(d, 'metadata.json').subject || ''; } catch (e) { return ''; } };
    goldPool = others.flatMap((d) => (read(d, 'questionbank.json').questions || []).map((q) => Object.assign({ subject: subjectOf(d) }, q))).filter((q) => q.questionSource === 'ORIGINAL');
    goldSource = goldPool.length ? 'other-subjects' : 'none';
  }
  const limit = Number(arg('--limit', 0)) || Infinity;
  const qs = (read(id, 'questionbank.json').questions || []).slice(0, limit);

  const t0 = Date.now();
  const out = await runPipeline(qs, {
    judge: models.judge, answer: models.answer, embed: cache ? cache.embed : null, review,
    sourceText: src.text, existing, goldPool, meta, samplingRate: arg('--rate', null) != null ? Number(arg('--rate')) : undefined,
    onProgress: (stage, n, total) => process.stdout.write(`\r${id} ${stage} ${n}/${total}        `),
  });
  process.stdout.write('\n');
  if (cache) cache.save();
  const report = Object.assign({ materialId: id, subject: meta.subject, models: { judge, answer, review: reviewModel, embed: cache ? embedName : null }, sourceFiles: src.files, goldPool: goldPool.length, goldSource, existingCompared: existing.length, totalSeconds: Math.round((Date.now() - t0) / 1000) }, out.report);
  console.log(JSON.stringify(report, null, 2));
  const file = arg('--out', null);
  if (file) fs.writeFileSync(file, JSON.stringify({ report, rows: out.rows, gold: out.goldRows, sample: out.sample }, null, 2));
  const pack = arg('--pack', null);
  if (pack) {
    const byId = Object.fromEntries(qs.map((q) => [q.id || q.questionId, q]));
    const rowOf = Object.fromEntries(out.rows.map((r) => [r.id, r]));
    fs.writeFileSync(pack, buildClaudePack(out.sample.all.map((x) => ({ id: x, q: byId[x], note: (rowOf[x].review || []).join('；') }))));
    console.log('wrote', pack, out.sample.all.length, 'questions');
  }
})().catch((e) => { console.error(e); process.exit(1); });
