#!/usr/bin/env node
// ai-engine/council/tools/gold-eval.js — 2026-10-14 標準答案集回歸測試（審議改版第 3 階段 ⑤）。
//
// 用本機模型重新判斷標準答案集裡每一筆有定論的裁決，計算與最終裁決（Claude／管理者）的一致率。
// 換模型或改 Prompt 前後各跑一次比較；第 4 階段離峰改用 14B 前，也用這份結果決定值不值得。
//
// 在引擎容器內執行（Ollama 位址與資料目錄沿用容器設定）：
//   docker exec ahs-council-council-engine-1 node tools/gold-eval.js
//   docker exec ahs-council-council-engine-1 node tools/gold-eval.js --model qwen2.5:14b-instruct-q4_K_M --limit 20
// 結果印在畫面上，並存到 <資料目錄>/gold/evals/<時間>_<模型>.json。
const fs = require('fs');
const path = require('path');
const goldSet = require('../services/goldSet');

const DEFAULT_MODEL = 'qwen2.5:7b-instruct-q4_K_M';

function parseArgs(argv) {
  const args = { model: DEFAULT_MODEL, url: process.env.OLLAMA_URL || 'http://ollama:11434', limit: 0, dataDir: process.env.COUNCIL_DATA_DIR || path.join(__dirname, '..', 'data') };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--model') args.model = argv[++i];
    else if (argv[i] === '--url') args.url = argv[++i];
    else if (argv[i] === '--limit') args.limit = Number(argv[++i]) || 0;
    else if (argv[i] === '--data-dir') args.dataDir = argv[++i];
  }
  return args;
}

// deps: { loadSource(hash), verifyClaim(source, claim) -> { verdict }, solve(source, q) -> 'A'..'E' | null }
async function evaluate(rulings, deps, { limit = 0, onProgress } = {}) {
  const items = rulings.filter((r) => goldSet.expectationOf(r) && r.sourceHash);
  const picked = limit ? items.slice(-limit) : items;
  const results = [];
  for (let i = 0; i < picked.length; i += 1) {
    const r = picked[i];
    const expect = goldSet.expectationOf(r);
    const source = deps.loadSource(r.sourceHash);
    let got = null;
    let error = null;
    if (!source) error = '找不到教材本文快照';
    else {
      try {
        // eslint-disable-next-line no-await-in-loop
        got = r.kind === 'claim' ? (await deps.verifyClaim(source, r.claim)).verdict : await deps.solve(source, r);
      } catch (e) { error = e.reason || e.message; }
    }
    const agree = error ? null : r.kind === 'claim' ? (got === 'SUPPORTED') === expect.supported : got === expect.answer;
    results.push({ kind: r.kind, final: r.final, text: r.claim || r.question, ruling: r.ruling, expected: expect, got, agree, error });
    if (onProgress) onProgress(i + 1, picked.length, results[results.length - 1]);
  }
  const judged = results.filter((x) => x.agree !== null);
  const part = (kind) => {
    const list = judged.filter((x) => x.kind === kind);
    return { judged: list.length, agree: list.filter((x) => x.agree).length, rate: list.length ? Math.round((list.filter((x) => x.agree).length / list.length) * 1000) / 10 : null };
  };
  return {
    total: picked.length, errors: results.filter((x) => x.error).length,
    agreement: part('claim'), practiceAgreement: part('practice'),
    overallRate: judged.length ? Math.round((judged.filter((x) => x.agree).length / judged.length) * 1000) / 10 : null,
    results,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const multiAi = require('../services/multiAi');
  const { buildBlindSolvePrompt } = require('../services/practiceAdjudicator');
  const rulings = goldSet.readRulings(args.dataDir);
  const timeoutMs = multiAi.DEFAULT_ADJUDICATION_TIMEOUT_MS;
  const deps = {
    loadSource: (hash) => goldSet.loadSource(args.dataDir, hash),
    verifyClaim: (source, claim) => multiAi.verifyClaimAgainstSource(source, claim, args.model, args.url, timeoutMs),
    solve: async (source, q) => {
      const fitted = multiAi.fitSourceIntoPrompt((src) => buildBlindSolvePrompt(src, q), source, [q.question].concat(q.options).join('\n'));
      if (!fitted) throw new Error('教材本文超過模型 context');
      const raw = String(await multiAi.callOllamaAdjudication(fitted.prompt, args.model, args.url, timeoutMs));
      const m = raw.match(/"answer"\s*:\s*"([A-E])"/i);
      return m ? m[1].toUpperCase() : null;
    },
  };
  console.log(`標準答案集：${rulings.length} 筆，模型 ${args.model}`);
  const report = await evaluate(rulings, deps, {
    limit: args.limit,
    onProgress: (i, n, r) => console.log(`[${i}/${n}] ${r.error ? `錯誤：${r.error}` : r.agree ? '一致' : '不一致'}　${String(r.text).slice(0, 40)}`),
  });
  const pct = (x) => (x === null ? '—' : `${x}%`);
  console.log(`\n陳述一致率 ${pct(report.agreement.rate)}（${report.agreement.agree}/${report.agreement.judged}）`);
  console.log(`練習題一致率 ${pct(report.practiceAgreement.rate)}（${report.practiceAgreement.agree}/${report.practiceAgreement.judged}）`);
  console.log(`整體 ${pct(report.overallRate)}，錯誤 ${report.errors} 筆`);
  const dir = path.join(goldSet.goldDir(args.dataDir), 'evals');
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}_${args.model.replace(/[^\w.-]/g, '_')}.json`);
  fs.writeFileSync(out, JSON.stringify(Object.assign({ model: args.model, at: new Date().toISOString() }, report), null, 2), 'utf8');
  console.log(`結果已存到 ${out}`);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { evaluate, parseArgs };
