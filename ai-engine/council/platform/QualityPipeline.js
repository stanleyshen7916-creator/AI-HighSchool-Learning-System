'use strict';
/* platform/QualityPipeline.js — AHS 佇列 9（2026-11-26，分支開發，12/1 合併 A4 後接上）：題目品質關卡 1–6 串接。

     關卡 1  結構（A4）＋防洩題 A＋教訓庫 F              程式
     關卡 2  出處（A4）＋詳解逐項驗證 D（只標待複核）     程式＋模型
     關卡 3  盲答（A4）                                    模型
     關卡 4  去重（A4，bge-m3）                            程式＋embedding
     關卡 5  本機自主 QA（LocalQA）＋金標準 C 混入           模型（審題模型 ≠ 出題模型）
     Bloom B 分布由程式重算
     關卡 6  選出 Claude 抽樣題（每單元 rate＋所有待複核）；抽樣結果由 applyClaudeReview 套回

   每題最後狀態：fail（任一關淘汰）／review（待複核，一定進抽樣）／pass。 */

const { runGates } = require('./QualityGates');
const { leakChecks, bloomDistribution, explanationClaims, loadConfig } = require('./QualityRules');
const { runLessons } = require('./QualityLessons');
const { gateLocalQA, buildGoldItems, mixGold, scoreGold, selectSample } = require('./LocalQA');

/* ctx: { judge, answer, embed, review, sourceText, existing, meta: { subject, grade }, cfg, goldPool, samplingRate,
          examples: [漏檢反例], rng, onProgress(stage, n, total) } */
async function runPipeline(questions, ctx = {}) {
  const cfg = ctx.cfg || loadConfig();
  const subject = (ctx.meta && ctx.meta.subject) || '';
  const rng = ctx.rng || Math.random;
  const warns = {};
  const idOf = (q) => q.id || q.questionId;
  const t0 = Date.now();

  // 關卡 1–4（A、F 併入關卡 1；D 在通過後記待複核）
  const g14 = await runGates(questions, Object.assign({}, ctx, {
    extraStructure: (q) => {
      const leak = leakChecks(q, cfg, subject);
      if (leak.warn.length) warns[idOf(q)] = leak.warn;
      return leak.fail.concat(runLessons(q));
    },
    reviewFlags: (q) => explanationClaims(q, ctx.sourceText, cfg).review,
    onProgress: ctx.onProgress ? (r, n, total) => ctx.onProgress('關卡1-4', n, total) : null,
  }));
  const t14 = Date.now();

  // 關卡 5：通過 1–4 的題目＋金標準（正本／改錯副本），打亂後交給本機 QA
  const passed = questions.filter((q) => g14.results.find((r) => r.id === idOf(q)).passed);
  const goldN = Math.ceil(passed.length * cfg.gold.ratio / (1 - cfg.gold.ratio) / 2);
  const goldItems = ctx.goldPool && ctx.goldPool.length ? buildGoldItems(ctx.goldPool, goldN, rng) : [];
  const { batch, goldIds } = goldItems.length ? mixGold(passed, goldItems, cfg.gold.ratio, rng) : { batch: passed, goldIds: {} };
  const qa = {};
  let n = 0;
  for (const q of batch) {
    // eslint-disable-next-line no-await-in-loop
    try { qa[idOf(q)] = await gateLocalQA(q, Object.assign({}, ctx, { cfg })); } catch (e) { qa[idOf(q)] = { status: 'fail', reasons: [`關卡 5 執行錯誤：${e.message}`], review: [] }; }
    n++;
    if (ctx.onProgress) ctx.onProgress('關卡5', n, batch.length);
  }
  const t5 = Date.now();

  const rows = questions.map((q) => {
    const g = g14.results.find((r) => r.id === idOf(q));
    const base = { id: idOf(q), unit: q.section || q.knowledgePoint || '', warn: warns[idOf(q)] || [] };
    if (!g.passed) return Object.assign(base, { status: 'fail', failedAt: g.failedAt, reasons: g.reasons, review: [] });
    const r5 = qa[idOf(q)];
    const review = (g.review || []).concat(r5.review || []);
    if (r5.status === 'fail') return Object.assign(base, { status: 'fail', failedAt: 'localqa', reasons: r5.reasons, review, bloom: r5.bloom || null });
    return Object.assign(base, { status: review.length ? 'review' : 'pass', failedAt: null, reasons: [], review, bloom: r5.bloom || null });
  });
  const goldRows = Object.keys(goldIds).map((id) => ({ id, status: qa[id].status, reasons: qa[id].reasons }));
  const gold = goldItems.length ? scoreGold(goldRows, goldIds) : null;

  const kept = rows.filter((r) => r.status !== 'fail');
  const bloom = bloomDistribution(kept.map((r) => ({ bloom: r.bloom })), cfg);
  const sample = selectSample(rows, ctx.samplingRate != null ? ctx.samplingRate : cfg.sampling.base, rng);

  const eliminated = Object.assign({}, g14.report.eliminated, { localqa: rows.filter((r) => r.failedAt === 'localqa').length });
  return {
    rows, goldRows, sample,
    report: {
      generated: questions.length, eliminated,
      review: rows.filter((r) => r.status === 'review').length,
      passed: rows.filter((r) => r.status === 'pass').length,
      warned: Object.keys(warns).length,
      bloom, gold,
      samplingRate: ctx.samplingRate != null ? ctx.samplingRate : cfg.sampling.base,
      sampleSize: sample.all.length,
      seconds: { gates1to4: Math.round((t14 - t0) / 1000), gate5: Math.round((t5 - t14) / 1000) },
    },
  };
}

module.exports = { runPipeline };
