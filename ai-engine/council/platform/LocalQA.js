'use strict';
/* platform/LocalQA.js — AHS 佇列 9（2026-11-26，分支開發）：
     關卡 5  本機自主 QA（不耗 Claude token）：寫題與審題用不同模型
     C      金標準：歷屆試題／講義原題（有官方答案）混入批次，量本機 QA 的實測誤判率與漏檢率
     關卡 6  Claude 抽樣：每單元每批抽樣＋所有待複核題；抽到一題答案錯誤，該單元這批全部退回
     校準   漏檢率決定下一批的抽樣比例；漏檢題收集成反例，加進本機 QA 的提示

   模型由呼叫端注入：review(prompt, { temperature }) -> 回覆文字（必須是與出題不同的模型）。
   缺欄位、讀不到結論一律判定不通過（fail-closed）。 */

const LETTERS = 'ABCDEFGH';
const LAZY_OPTION = /以上皆(是|非)|以上都(對|錯|是|不是)|皆(正確|錯誤)$/;
const FIGURE_REF = /如圖|下圖|右圖|左圖|上圖|附圖|圖中|附表|如表|下表/;
const stripLabel = (o) => String(o == null ? '' : o).replace(/^\s*[（(]?\s*[A-Ha-h]\s*[)）.．、]\s*/, '').trim();
const norm = (s) => String(s == null ? '' : s).replace(/\s/g, '');

function answerLetter(q) {
  const opts = (q.options || []).map(stripLabel);
  const a = String(q.answer == null ? '' : q.answer).trim();
  if (/^[A-H]$/i.test(a)) return a.toUpperCase();
  const m = /^\s*[（(]\s*([A-H])\s*[)）]/i.exec(a);
  if (m) return m[1].toUpperCase();
  const i = opts.findIndex((o) => norm(o) === norm(a));
  return i >= 0 ? LETTERS[i] : null;
}
const optionsBlock = (q) => (q.options || []).map((o, i) => `(${LETTERS[i]}) ${stripLabel(o)}`).join('\n');
const tail = (reply) => String(reply || '').split('</think>').pop();
function field(reply, name) {
  const m = [...tail(reply).matchAll(new RegExp(`${name}\\s*[:：]\\s*([^\\n]+)`, 'gi'))].pop();
  return m ? m[1].trim() : null;
}

/* 1. 一致性：不看答案作答 3 次（溫度不同）。3 次一致＝通過；2 次＝待複核；其餘＝淘汰。 */
async function consistency(q, review, temperatures) {
  const want = answerLetter(q);
  const got = [];
  for (const t of temperatures) {
    // eslint-disable-next-line no-await-in-loop
    const r = await review(`你是高中生。回答下列單選題，不要解釋。\n${q.question}\n${optionsBlock(q)}\n只回一行：ANSWER: 字母`, { temperature: t });
    const m = /ANSWER\s*[:：]\s*\(?([A-H])\)?/i.exec(tail(r));
    got.push(m ? m[1].toUpperCase() : '?');
  }
  const same = got.filter((x) => x === want).length;
  return { want, got, same, verdict: same === temperatures.length ? 'pass' : (same === temperatures.length - 1 ? 'review' : 'fail') };
}

/* 2–4. 詳解、選項、範圍與程度、Bloom 層次：一次呼叫，固定欄位格式。缺欄位就重問一次，仍缺＝淘汰。 */
function checkPrompt(q, meta, examples) {
  return [
    '你是高中題目審查員，逐項檢查下列單選題，每項只回一行，依照格式：',
    'EXPLANATION: YES 或 NO（詳解的結論是否支持標準答案，沒有自相矛盾）',
    'CORRECT: 你認為正確的所有選項字母，以逗號分隔（例如 B 或 A,C）',
    'ABSURD: NONE 或 一看就錯、沒有誘答力的錯誤選項字母',
    'SCOPE: IN 或 OUT（題目是否屬於本單元、符合高中程度、沒有超綱）',
    'BLOOM: 記憶、理解、應用、分析 擇一（題目主要考的認知層次）',
    examples && examples.length ? `\n以下是過去本機審查放行、但後來被判定有錯的題目，請特別注意同類錯誤：\n${examples.slice(-5).map((e) => `- ${e}`).join('\n')}` : '',
    '',
    `科目：${meta.subject || ''}　年級：${meta.grade || ''}　單元：${q.section || q.knowledgePoint || meta.unit || ''}`,
    `題目：${q.question}`,
    optionsBlock(q),
    `標準答案：(${answerLetter(q)})`,
    `詳解：${q.explanation || ''}`,
  ].filter((l) => l !== '').join('\n');
}
function parseCheck(reply) {
  const ex = field(reply, 'EXPLANATION');
  const correct = field(reply, 'CORRECT');
  const absurd = field(reply, 'ABSURD');
  const scope = field(reply, 'SCOPE');
  const bloom = field(reply, 'BLOOM');
  const missing = [['EXPLANATION', ex], ['CORRECT', correct], ['SCOPE', scope], ['BLOOM', bloom]].filter(([, v]) => !v).map(([k]) => k);
  return {
    missing,
    explanation: ex && /^YES/i.test(ex),
    correct: correct ? [...new Set((correct.toUpperCase().match(/[A-H]/g) || []))] : [],
    absurd: absurd && !/NONE|無/i.test(absurd) ? (absurd.toUpperCase().match(/[A-H]/g) || []) : [],
    scope: scope && /^IN/i.test(scope),
    bloom: bloom ? (['記憶', '理解', '應用', '分析'].find((l) => bloom.includes(l)) || null) : null,
  };
}

/* 關卡 5。回傳 { status: 'pass'|'review'|'fail', reasons, review: [待複核原因], bloom, detail } */
async function gateLocalQA(q, ctx) {
  const cfg = ctx.cfg;
  if (!ctx.review) return { status: 'fail', reasons: ['沒有審題模型（fail-closed）'], review: [] };
  const reasons = [], review = [];
  const opts = (q.options || []).map(stripLabel);
  if (opts.some((o) => LAZY_OPTION.test(o))) reasons.push('有「以上皆是／皆非」之類的偷懶選項');
  if (FIGURE_REF.test(String(q.question || '')) && !q.figureSvg) reasons.push('題幹提到圖表但沒有圖');
  if (!answerLetter(q)) reasons.push('答案對不到選項');
  if (reasons.length) return { status: 'fail', reasons, review };

  const cons = await consistency(q, ctx.review, cfg.consistency.temperatures);
  if (cons.verdict === 'fail') return { status: 'fail', reasons: [`一致性：3 次作答只有 ${cons.same} 次與答案相同（${cons.got.join('')}，答案 ${cons.want}）`], review, detail: { consistency: cons } };
  if (cons.verdict === 'review') review.push(`一致性：3 次作答 2 次與答案相同（${cons.got.join('')}）`);

  let chk = parseCheck(await ctx.review(checkPrompt(q, ctx.meta || {}, ctx.examples), { temperature: 0 }));
  if (chk.missing.length) chk = parseCheck(await ctx.review(checkPrompt(q, ctx.meta || {}, ctx.examples) + '\n\n（上一次回覆缺少欄位，請完整回覆五行。）', { temperature: 0 }));
  if (chk.missing.length) return { status: 'fail', reasons: [`審查回覆缺欄位：${chk.missing.join('、')}（fail-closed）`], review, detail: { consistency: cons } };
  if (!chk.explanation) reasons.push('詳解不支持標準答案');
  if (q.type !== 'multiple_choice' && chk.correct.length > 1) reasons.push(`審查認為不只一個正確選項：${chk.correct.join('、')}`);
  if (chk.correct.length && !chk.correct.includes(cons.want)) reasons.push(`審查認為正確選項是 ${chk.correct.join('、')}，答案是 ${cons.want}`);
  if (!chk.scope) reasons.push('超出單元範圍或高中程度');
  if (chk.absurd.length) review.push(`錯誤選項 ${chk.absurd.join('、')} 可能沒有誘答力`);
  return { status: reasons.length ? 'fail' : (review.length ? 'review' : 'pass'), reasons, review, bloom: chk.bloom, detail: { consistency: cons, check: chk } };
}

/* C. 金標準：從有官方答案的題目（questionSource ORIGINAL）抽 n 題，每題一份正本（應通過）和一份
   「答案被改錯」的副本（應淘汰）。副本只存在於這一批、絕不寫回題庫。 */
function buildGoldItems(pool, n, rng = Math.random) {
  const usable = pool.filter((q) => q.questionSource === 'ORIGINAL' && q.type === 'single_choice' && answerLetter(q) && (q.options || []).length >= 3);
  const picked = [...usable].sort(() => rng() - 0.5).slice(0, n);
  const items = [];
  picked.forEach((q, i) => {
    const want = answerLetter(q);
    const others = LETTERS.slice(0, q.options.length).split('').filter((l) => l !== want);
    const wrong = others[Math.floor(rng() * others.length)];
    items.push({ q: Object.assign({}, q, { id: `gold_${i}_ok`, questionId: `gold_${i}_ok` }), gold: 'correct' });
    items.push({ q: Object.assign({}, q, { id: `gold_${i}_bad`, questionId: `gold_${i}_bad`, answer: wrong }), gold: 'corrupted' });
  });
  return items;
}
/* 把金標準混進批次（佔 ratio），順序打亂，回傳 { batch, goldIds }；QA 只看到題目，不知道哪些是金標準。 */
function mixGold(questions, goldItems, ratio, rng = Math.random) {
  const want = Math.max(2, Math.round(questions.length * ratio / (1 - ratio)));
  const gold = goldItems.slice(0, want - (want % 2));
  const batch = [...questions, ...gold.map((g) => g.q)].sort(() => rng() - 0.5);
  return { batch, goldIds: Object.fromEntries(gold.map((g) => [g.q.questionId, g.gold])) };
}
/* 本機 QA 對金標準的表現：誤判率＝正本被淘汰；漏檢率＝被改錯的副本卻通過。 */
function scoreGold(results, goldIds) {
  let ok = 0, okRejected = 0, bad = 0, badPassed = 0;
  for (const r of results) {
    const g = goldIds[r.id];
    if (!g) continue;
    if (g === 'correct') { ok++; if (r.status === 'fail') okRejected++; }
    if (g === 'corrupted') { bad++; if (r.status === 'pass') badPassed++; }
  }
  return { correctItems: ok, falseRejectRate: ok ? okRejected / ok : null, corruptedItems: bad, missRate: bad ? badPassed / bad : null };
}

/* 關卡 6：每單元抽樣（比例 rate，至少 1 題）＋所有待複核題。 */
function selectSample(rows, rate, rng = Math.random) {
  const byUnit = {};
  for (const r of rows) {
    if (r.status === 'pass') (byUnit[r.unit || '（未分單元）'] = byUnit[r.unit || '（未分單元）'] || []).push(r);
  }
  const sampled = [];
  for (const [, list] of Object.entries(byUnit)) {
    const k = Math.max(1, Math.ceil(list.length * rate));
    sampled.push(...[...list].sort(() => rng() - 0.5).slice(0, k));
  }
  const reviews = rows.filter((r) => r.status === 'review');
  return { sampled: sampled.map((r) => r.id), review: reviews.map((r) => r.id), all: [...sampled, ...reviews].map((r) => r.id) };
}

/* Claude 抽樣包（貼到 Claude 新對話或由桌機 Claude 直接審）與回覆解析。 */
function buildClaudePack(items) {
  return [
    '你是高中題目審查員。逐題判定答案與詳解是否正確，只依教材內容與高中課綱。',
    '每題一行：「Q編號：正確」或「Q編號：答案錯誤：正確答案與理由」或「Q編號：其他問題：說明」。',
    '最後一行寫「完成」。',
    '',
    ...items.map((x) => `Q${x.id}\n單元：${x.q.section || x.q.knowledgePoint || ''}\n${x.q.question}\n${optionsBlock(x.q)}\n答案：(${answerLetter(x.q)})\n詳解：${x.q.explanation || ''}${x.note ? `\n（本機 QA：${x.note}）` : ''}`),
  ].join('\n\n');
}
function parseClaudeReview(text, ids) {
  const out = {};
  String(text || '').split(/\r?\n/).forEach((line) => {
    const m = /^\s*Q(\S+?)\s*[:：]\s*(正確|答案錯誤|其他問題)\s*[:：]?\s*(.*)$/.exec(line);
    if (m && ids.includes(m[1])) out[m[1]] = { verdict: m[2], note: m[3].trim() };
  });
  const missing = ids.filter((id) => !out[id]);
  return { verdicts: out, missing };
}

/* 抽樣結果套回批次：某單元抽到一題「答案錯誤」，該單元這批全部退回。回傳每單元結論與漏檢統計。 */
function applyClaudeReview(rows, verdicts) {
  const units = {};
  for (const r of rows) {
    const u = r.unit || '（未分單元）';
    units[u] = units[u] || { unit: u, returned: false, wrong: [], sampledPass: 0, missed: 0 };
    const v = verdicts[r.id];
    if (!v) continue;
    if (r.status === 'pass') units[u].sampledPass++;
    if (v.verdict === '答案錯誤') {
      units[u].returned = true;
      units[u].wrong.push(r.id);
      if (r.status === 'pass') units[u].missed++;
    }
  }
  const list = Object.values(units);
  const sampledPass = list.reduce((n, u) => n + u.sampledPass, 0);
  const missed = list.reduce((n, u) => n + u.missed, 0);
  return { units: list, missRate: sampledPass ? missed / sampledPass : null, sampledPass, missed };
}

/* 校準：依各批漏檢率決定下一批抽樣比例。
   任一批 > highMissRate → high（並回報 cloud 檢討提示）；最近 lowAfterBatches 批都 < lowMissRate → low；其餘 base。 */
function nextSamplingRate(history, cfg) {
  const s = cfg.sampling;
  const rates = history.map((h) => h.missRate).filter((x) => x != null);
  if (!rates.length) return { rate: s.base, reason: '沒有歷史，用預設比例' };
  const last = rates[rates.length - 1];
  if (last > s.highMissRate) return { rate: s.high, reason: `上一批漏檢率 ${(last * 100).toFixed(1)}% > ${s.highMissRate * 100}%，抽樣提高並回報 cloud 檢討 QA 提示`, escalate: true };
  const recent = rates.slice(-s.lowAfterBatches);
  if (recent.length === s.lowAfterBatches && recent.every((r) => r < s.lowMissRate)) return { rate: s.low, reason: `連續 ${s.lowAfterBatches} 批漏檢率 < ${s.lowMissRate * 100}%` };
  return { rate: s.base, reason: '維持預設比例' };
}

module.exports = {
  gateLocalQA, consistency, checkPrompt, parseCheck, answerLetter,
  buildGoldItems, mixGold, scoreGold,
  selectSample, buildClaudePack, parseClaudeReview, applyClaudeReview, nextSamplingRate,
};
