'use strict';
/* platform/QualityGates.js — AHS-QB1 題目品質關卡 1–4（AHS-A4，2026-11-26，分支開發，12/1 前不合併）。

   每題依序通過：
     1. structure  結構：題幹、選項完整且不重複、恰有一個正確答案、有詳解、有科目／章節／難度標籤、沒有引用不存在的附圖
     2. source     出處：題目附有教材原文依據；有原文時依據必須真的出現在原文裡；再由模型確認答案能從依據推出
     3. blind      盲答：另一個本地模型不看答案作答，必須與答案一致
     4. dedupe     去重：與既有題庫（與同批已通過的題目）比相似度，太高就淘汰
   第一個不通過的關卡就淘汰（後面的關卡不跑，省模型時間）。

   只做判斷、不改題目、不碰線上出題。模型一律由呼叫端注入：
     judge(prompt)  -> 回覆文字（關卡 2）       answer(prompt) -> 回覆文字（關卡 3，要用與出題不同的模型）
     embed(text)    -> 數字陣列（關卡 4，可省略：沒有 embedding 模型時改用字元雙字組相似度）
   createOllamaModels() 是接本機 Ollama 的預設實作。 */

const LETTERS = 'ABCDEFGH';
const FIGURE_REF = /如圖|下圖|右圖|左圖|上圖|附圖|圖中|附表|如表|下表/;
const CHOICE_TYPES = new Set(['single_choice', 'multiple_choice']);
const DIFFICULTY = new Set(['易', '中', '難', 'easy', 'medium', 'hard']);

const norm = (s) => String(s == null ? '' : s).replace(/[\s，。、；：「」『』（）()《》〈〉！？!?,.;:'"`~\-—_…·]/g, '').toLowerCase();
const stripLabel = (o) => String(o == null ? '' : o).replace(/^\s*[（(]?\s*[A-Ha-h]\s*[)）.．、]\s*/, '').trim();

/* 答案在題庫裡可能是字母（"B"）、帶標籤的選項（"(B) …"）或選項原文。回傳選項索引，找不到為 -1。 */
function answerIndex(q) {
  const opts = (q.options || []).map(stripLabel);
  const a = String(q.answer == null ? '' : q.answer).trim();
  if (/^[A-H]$/i.test(a)) { const i = LETTERS.indexOf(a.toUpperCase()); return i < opts.length ? i : -1; }
  const m = /^\s*[（(]\s*([A-H])\s*[)）]/i.exec(a);
  if (m) { const i = LETTERS.indexOf(m[1].toUpperCase()); return i < opts.length ? i : -1; }
  const hits = opts.map((o, i) => (norm(o) === norm(a) ? i : -1)).filter((i) => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}

/* 出處依據：q.quote、q.source.quote，或詳解裡「出處：…「原文」」那一段。 */
function evidenceOf(q) {
  if (q.quote) return String(q.quote);
  if (q.source && q.source.quote) return String(q.source.quote);
  const ex = String(q.explanation || '');
  const at = ex.indexOf('出處');
  const m = /「([^」]{6,})」/.exec(at >= 0 ? ex.slice(at) : '');
  return m ? m[1] : '';
}

/* 難度：q.difficulty，或（舊題）詳解裡的「難度：易／中／難」。 */
function difficultyOf(q) {
  if (q.difficulty != null && q.difficulty !== '') return String(q.difficulty);
  const m = /難度s*[:：]s*(易|中|難)/.exec(String(q.explanation || ''));
  return m ? m[1] : null;
}

function gateStructure(q) {
  const reasons = [];
  if (!q || typeof q !== 'object') return ['不是題目物件'];
  if (String(q.question || '').trim().length < 6) reasons.push('題幹太短或缺少');
  if (!CHOICE_TYPES.has(q.type)) reasons.push(`題型 ${q.type} 不在本關卡範圍（只檢查選擇題）`);
  const opts = Array.isArray(q.options) ? q.options.map(stripLabel) : [];
  if (opts.length < 2 || opts.some((o) => !o)) reasons.push('選項不完整');
  else if (new Set(opts.map(norm)).size !== opts.length) reasons.push('選項重複');
  if (q.type === 'single_choice' && opts.length >= 2 && answerIndex(q) < 0) reasons.push('答案對不到恰好一個選項');
  if (String(q.explanation || '').trim().length < 6) reasons.push('缺詳解');
  if (!(q.knowledgePoint || q.section)) reasons.push('缺章節標籤');
  const diff = difficultyOf(q);
  if (!diff) reasons.push('缺難度標籤');
  else if (!DIFFICULTY.has(diff)) reasons.push(`難度標籤不正確：${diff}`);
  if ((q.figureMissing && !q.figureSvg) || (FIGURE_REF.test(String(q.question || '')) && !q.figureSvg)) reasons.push('引用附圖但沒有圖');
  return reasons;
}

function optionsBlock(q) {
  return (q.options || []).map((o, i) => `(${LETTERS[i]}) ${stripLabel(o)}`).join('\n');
}
function letterOf(reply) {
  const text = String(reply || '').split('</think>').pop();
  const m = /ANSWER\s*[:：]\s*\(?([A-H])\)?/i.exec(text) || /^\s*\(?([A-H])\)?\s*$/im.exec(text);
  return m ? m[1].toUpperCase() : null;
}

async function gateSource(q, ctx) {
  const ev = evidenceOf(q);
  if (norm(ev).length < 6) return ['缺教材原文依據'];
  if (ctx.sourceText && !norm(ctx.sourceText).includes(norm(ev))) return ['依據不在教材原文裡（可能是模型捏造）'];
  if (!ctx.judge) return [];
  const prompt = `你是高中題目審查員。只根據「依據」判斷「答案」是否能被推出，不要用其他知識。\n依據：${ev}\n題目：${q.question}\n${optionsBlock(q)}\n答案：(${LETTERS[answerIndex(q)]})\n最後一行只寫 VERDICT: YES 或 VERDICT: NO。`;
  const m = [...String(await ctx.judge(prompt)).matchAll(/VERDICT\s*[:：]\s*(YES|NO)/gi)].pop();
  if (!m) return ['出處判定沒有結論'];
  return m[1].toUpperCase() === 'YES' ? [] : ['依據推不出答案'];
}

async function gateBlind(q, ctx) {
  if (!ctx.answer) return [];
  const prompt = `你是高中生。回答下列單選題，不要解釋。\n${q.question}\n${optionsBlock(q)}\n只回一行：ANSWER: 字母`;
  const got = letterOf(await ctx.answer(prompt));
  const want = LETTERS[answerIndex(q)];
  if (!got) return ['盲答沒有給出選項'];
  return got === want ? [] : [`盲答選 ${got}，答案是 ${want}`];
}

function bigrams(s) { const t = norm(s); const out = new Set(); for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2)); return out; }
function jaccard(a, b) { let n = 0; a.forEach((x) => { if (b.has(x)) n++; }); const u = a.size + b.size - n; return u ? n / u : 0; }
function cosine(a, b) { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; } return x && y ? d / Math.sqrt(x * y) : 0; }
const textOf = (q) => `${q.question}\n${(q.options || []).map(stripLabel).join('\n')}`;

/* 去重索引：既有題庫＋同批已通過的題目。threshold 為 embedding 的餘弦或雙字組 Jaccard。 */
function createDedupeIndex({ embed = null, threshold = null } = {}) {
  const limit = threshold != null ? threshold : (embed ? 0.95 : 0.8);
  const items = [];
  async function featureOf(q) { return embed ? embed(textOf(q)) : bigrams(textOf(q)); }
  return {
    limit,
    async add(q) { items.push({ id: q.id || q.questionId, f: await featureOf(q) }); },
    async check(q) {
      const f = await featureOf(q);
      let best = { id: null, score: 0 };
      for (const it of items) {
        if (it.id && it.id === (q.id || q.questionId)) continue;
        const s = embed ? cosine(f, it.f) : jaccard(f, it.f);
        if (s > best.score) best = { id: it.id, score: s };
      }
      return { reasons: best.score >= limit ? [`與 ${best.id} 太相似（${best.score.toFixed(2)}）`] : [], best };
    },
  };
}

const GATES = ['structure', 'source', 'blind', 'dedupe'];

/* ctx: { judge, answer, embed, sourceText, existing: [既有題目], dedupeThreshold, onProgress } */
async function runGates(questions, ctx = {}) {
  const index = createDedupeIndex({ embed: ctx.embed, threshold: ctx.dedupeThreshold });
  for (const q of ctx.existing || []) await index.add(q);
  const results = [];
  const eliminated = { structure: 0, source: 0, blind: 0, dedupe: 0 };
  for (const q of questions) {
    let failedAt = null, reasons = [];
    const steps = [
      ['structure', async () => gateStructure(q)],
      ['source', async () => gateSource(q, ctx)],
      ['blind', async () => gateBlind(q, ctx)],
      ['dedupe', async () => (await index.check(q)).reasons],
    ];
    for (const [name, run] of steps) {
      let r;
      try { r = await run(); } catch (e) { r = [`關卡執行錯誤：${e.message}`]; }
      if (r.length) { failedAt = name; reasons = r; break; }
    }
    if (failedAt) eliminated[failedAt]++; else await index.add(q);
    const row = { id: q.id || q.questionId, passed: !failedAt, failedAt, reasons };
    results.push(row);
    if (ctx.onProgress) ctx.onProgress(row, results.length, questions.length);
  }
  const passed = results.filter((r) => r.passed).length;
  return { results, report: { generated: questions.length, eliminated, passed, passRate: questions.length ? passed / questions.length : 0 } };
}

/* 本機 Ollama 的預設實作。關卡 3 要用與出題不同的模型（呼叫端決定 answerModel）。 */
function createOllamaModels({ url = process.env.OLLAMA_URL || 'http://127.0.0.1:11435', judgeModel = 'qwen3:8b', answerModel = 'gpt-oss:20b', embedModel = null, timeoutMs = 180000 } = {}) {
  async function post(pathname, body) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url + pathname, { method: 'POST', body: JSON.stringify(body), signal: ctrl.signal });
      if (!r.ok) throw new Error(`Ollama ${pathname} HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(t); }
  }
  const gen = (model) => async (prompt) => {
    const extra = /gpt-oss/i.test(model) ? { think: 'low' } : (/qwen3/i.test(model) ? { think: false } : {});
    const d = await post('/api/generate', Object.assign({ model, prompt, stream: false, options: { temperature: 0, num_predict: 1500 } }, extra));
    return d.response || '';
  };
  return {
    judge: gen(judgeModel),
    answer: gen(answerModel),
    embed: embedModel ? async (text) => (await post('/api/embed', { model: embedModel, input: text })).embeddings[0] : null,
  };
}

module.exports = { GATES, difficultyOf, gateStructure, gateSource, gateBlind, createDedupeIndex, runGates, createOllamaModels, answerIndex, evidenceOf, letterOf };
