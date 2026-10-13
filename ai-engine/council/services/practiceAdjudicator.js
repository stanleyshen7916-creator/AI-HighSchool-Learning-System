// ai-engine/council/services/practiceAdjudicator.js — 2026-10-12 練習題自動裁決（審議改版第 1 階段）。
//
// 過去 ⑪ 的練習題（題幹＋選項＋答案）原樣附在 Final.md，標「未經 Qwen 逐題裁決」，答案正確性
// 只能靠人工檢查。現在每一題依序檢查：
//   1. 格式（程式判斷）：選項至少 2 個、不重複；答案必須是其中一個選項（FinalParser 已保證）。
//   2. 三方比對（程式判斷）：題幹相同的題目若出現在多份初稿，答案必須一致。
//   3. Qwen 獨立作答：只給教材原文、題幹與選項（不給答案），請 Qwen 作答並逐字引用依據；
//      作答與初稿答案一致才通過。
// 全部通過的題目收進 Final.md；其餘整理成「Claude 最終審查包」，由管理者貼到 Claude 網頁版
// （不使用 API），Claude 對每題只能回「正確／答案應為 X／刪除／無法判斷」，貼回後套用：
// 正確、答案應為 X → 收錄；刪除、無法判斷 → 不收錄（Project Owner 2026-10-11 決定）。
const { parseQuestionText } = require('../platform/FinalParser');

const DRAFT_LABEL = { chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude' };
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const PRACTICE_START = '<!-- practice:start -->';
const PRACTICE_END = '<!-- practice:end -->';

function stemKey(text) {
  return String(text || '').replace(/[\s\p{P}\p{S}]/gu, '');
}

function letterOf(q, answerText) {
  const i = q.options.indexOf(answerText);
  return i >= 0 ? LETTERS[i] : null;
}

// 三份初稿的 ⑪ 小節 -> 依題幹分組的候選題目。
function collectCandidates(practiceTexts) {
  const groups = new Map();
  Object.keys(practiceTexts).forEach((origin) => {
    const text = practiceTexts[origin];
    if (!text || !/(^|\n)\s*(\*\*\s*)?(Q|第)\s*\d/.test(text)) return;
    parseQuestionText(text).questions.forEach((q) => {
      const key = stemKey(q.question);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ origin, q });
    });
  });
  return Array.from(groups.values());
}

function formatProblem(q) {
  if (!Array.isArray(q.options) || q.options.length < 2) return '選項少於 2 個';
  if (new Set(q.options.map((o) => stemKey(o))).size !== q.options.length) return '選項內容重複';
  if (q.options.indexOf(q.answer) === -1) return '答案不在選項中';
  return null;
}

function buildBlindSolvePrompt(sourceText, q) {
  return [
    '你是高中考題的獨立解題者。只能根據下方【教材原文】作答，不得使用原文以外的知識猜測。',
    '請選出唯一正確的選項，並把作為依據的教材原文「逐字」複製到 quoted_source_span（每個字元都必須與原文相同）。',
    '若原文不足以判斷，answer 請填 null。',
    '只輸出一個 JSON 物件，不得輸出任何其他文字：',
    '{ "answer": "A" 到 "E" 之一或 null, "quoted_source_span": "..." 或 null, "reason": "簡短理由" }',
    '',
    '【教材原文】',
    sourceText,
    '',
    '【題目】',
    q.question,
    ...q.options.map((o, i) => `(${LETTERS[i]}) ${o}`),
  ].join('\n');
}

function parseJson(raw) {
  const s = String(raw || '');
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a === -1 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch (_) { return null; }
}

// deps: { callModel(prompt) -> raw string, fitSource(build, focus) -> { prompt } | null }
async function adjudicatePractice(practiceTexts, sourceText, deps) {
  const accepted = [];
  const pending = [];
  const groups = collectCandidates(practiceTexts);
  for (const group of groups) {
    const rep = group[0];
    const q = rep.q;
    const origins = group.map((g) => DRAFT_LABEL[g.origin] || g.origin);
    const item = {
      question: q.question, options: q.options, answer: q.answer, explanation: q.explanation || null,
      knowledgePoint: q.knowledgePoint || null, difficulty: q.difficulty || null,
      origins, checks: {},
    };
    const fmt = formatProblem(q);
    if (fmt) { pending.push(Object.assign(item, { reason: `格式不符：${fmt}` })); continue; }
    const answers = Array.from(new Set(group.map((g) => g.q.answer)));
    if (answers.length > 1) {
      item.checks.drafts = group.map((g) => `${DRAFT_LABEL[g.origin]}：${letterOf(q, g.q.answer) || g.q.answer}`).join('、');
      pending.push(Object.assign(item, { reason: `三方答案不一致（${item.checks.drafts}）` }));
      continue;
    }
    let solved = null;
    if (sourceText && deps && typeof deps.callModel === 'function') {
      try {
        const fitted = deps.fitSource((src) => buildBlindSolvePrompt(src, q), [q.question].concat(q.options).join('\n'));
        if (fitted) solved = parseJson(await deps.callModel(fitted.prompt));
      } catch (error) {
        item.checks.qwenError = error && (error.reason || error.message) || 'UNKNOWN';
      }
    }
    const key = letterOf(q, q.answer);
    const qwen = solved && typeof solved.answer === 'string' ? solved.answer.trim().toUpperCase().replace(/[^A-E]/g, '') : null;
    item.checks.qwen = qwen || null;
    item.checks.qwenReason = solved && solved.reason ? String(solved.reason) : null;
    const span = solved && typeof solved.quoted_source_span === 'string' ? solved.quoted_source_span.trim() : '';
    item.checks.quote = span && sourceText.includes(span) ? span : null;
    if (qwen && qwen === key) { accepted.push(item); continue; }
    pending.push(Object.assign(item, {
      reason: qwen ? `Qwen 獨立作答為 (${qwen})，初稿答案為 (${key})`
        : item.checks.qwenError ? `Qwen 作答失敗（${item.checks.qwenError}）` : 'Qwen 無法依教材原文判斷',
    }));
  }
  return { accepted, pending, total: groups.length };
}

function renderQuestions(list) {
  return list.map((q, i) => [
    `**Q${i + 1}.** ${q.question}`,
    ...q.options.map((o, k) => `(${LETTERS[k]}) ${o}`),
    `答案：${letterOf(q, q.answer)}`,
    ...(q.explanation ? [`詳解：${q.explanation}`] : []),
    '',
  ].join('\n')).join('\n');
}

function renderPracticeBlock(accepted, pendingCount) {
  return [
    PRACTICE_START,
    '### 練習題（已逐題裁決：格式、三方比對、Qwen 獨立作答皆通過）',
    '',
    accepted.length ? renderQuestions(accepted) : '（本輪沒有通過自動裁決的練習題）',
    ...(pendingCount ? [`> 另有 ${pendingCount} 題未通過自動裁決，尚未收錄；請於上傳頁產生「Claude 最終審查包」。`] : []),
    PRACTICE_END,
  ].join('\n');
}

function buildClaudeReviewPrompt(metadata, pending, claims) {
  claims = claims || [];
  if (!pending.length) return buildClaimPrompt(metadata, claims, true);
  const head = [
    `你是高中${metadata.subject || ''}老師。以下是「${metadata.school || ''} ${metadata.grade || ''} ${metadata.subject || ''} ${metadata.unit || ''}」教材練習題中，`,
    '本地模型自動裁決沒有通過的題目。請逐題判斷原稿答案是否正確，每題只回覆一行，格式必須完全如下（不要加其他說明）：',
    '',
    'P1：正確',
    'P2：答案應為 C',
    'P3：刪除',
    'P4：無法判斷',
    '',
    '「正確」＝原稿答案正確；「答案應為 X」＝題目沒問題但答案應為 X（A～E）；「刪除」＝題目本身有誤或不適合；「無法判斷」＝無法確定。',
    '',
  ];
  const body = pending.map((p, i) => [
    `## P${i + 1}（出自 ${p.origins.join('、')}；未通過原因：${p.reason}）`,
    p.question,
    ...p.options.map((o, k) => `(${LETTERS[k]}) ${o}`),
    `原稿答案：(${letterOf(p, p.answer) || '?'})`,
    ...(p.checks && p.checks.qwenReason ? [`本地模型理由：${p.checks.qwenReason}`] : []),
    ...(p.checks && p.checks.quote ? [`相關教材原文：「${p.checks.quote}」`] : []),
    '',
  ].join('\n'));
  return head.concat(body).join('\n') + (claims.length ? `\n\n${buildClaimPrompt(metadata, claims, false)}` : '');
}

// 2026-10-13（第 2 階段）：交叉審議中沒有定論的陳述（分段結論不一致、兩次判斷不一致、
// 證據不足、無根據）。Final.md 中以「⚠️尚待人工覆核（VERDICT）：陳述」呈現。
function claimMarker(c) {
  return `⚠️尚待人工覆核（${c.verdict}）：${c.claim}`;
}

function buildClaimPrompt(metadata, claims, standalone) {
  if (!claims.length) return '';
  const head = standalone
    ? [`你是高中${metadata.subject || ''}老師，正在審查「${metadata.school || ''} ${metadata.grade || ''} ${metadata.subject || ''} ${metadata.unit || ''}」的教材重點。`]
    : ['---', '', '第二部分：教材重點中，本地模型沒有定論的陳述。'];
  return head.concat([
    '請依教材內容與學科知識判斷每條陳述是否正確，每條只回覆一行，格式如下（不要加其他說明）：',
    '',
    'C1：成立',
    'C2：不成立',
    'C3：無法判斷',
    '',
  ], claims.map((c, i) => `## C${i + 1}（${c.reason || c.verdict}）\n${c.claim}\n`)).join('\n');
}

// 成立 → 拿掉 ⚠️ 標記，保留陳述；不成立、無法判斷 → 從 Final.md 刪除這條陳述。
function applyClaimReview(markdown, claims, replyText) {
  const verdicts = {};
  String(replyText || '').split(/\r?\n/).forEach((line) => {
    const m = /^\s*[*\-]*\s*C\s*(\d+)\s*[：:.、]\s*(.+?)\s*$/.exec(line);
    if (m) verdicts[Number(m[1])] = m[2];
  });
  let md = markdown;
  const confirmed = [];
  const removed = [];
  const unanswered = [];
  claims.forEach((c, i) => {
    const v = verdicts[i + 1];
    if (!v) { unanswered.push(i + 1); return; }
    const marker = claimMarker(c);
    if (/^成立/.test(v)) {
      md = md.split(marker).join(c.claim);
      confirmed.push(c);
    } else {
      md = md.split(`${marker}\n\n`).join('').split(`\n\n${marker}`).join('').split(marker).join('');
      removed.push({ claim: c, verdict: /無法判斷/.test(v) ? '無法判斷' : '不成立' });
    }
  });
  return { markdown: md, confirmed, removed, unanswered };
}

// Claude 的回覆 -> { accepted:[item], dropped:[{item, verdict}], unanswered:[index] }
function applyClaudeReview(pending, replyText) {
  const verdicts = {};
  String(replyText || '').split(/\r?\n/).forEach((line) => {
    const m = /^\s*[*\-]*\s*P\s*(\d+)\s*[：:.、]\s*(.+?)\s*$/.exec(line);
    if (m) verdicts[Number(m[1])] = m[2];
  });
  const accepted = [];
  const dropped = [];
  const unanswered = [];
  pending.forEach((p, i) => {
    const v = verdicts[i + 1];
    if (!v) { unanswered.push(i + 1); return; }
    if (/^正確/.test(v)) { accepted.push(Object.assign({}, p, { claude: '正確' })); return; }
    const fix = /答案應為\s*[（(]?\s*([A-E])/.exec(v);
    if (fix) {
      const idx = LETTERS.indexOf(fix[1]);
      if (idx >= 0 && idx < p.options.length) {
        accepted.push(Object.assign({}, p, { answer: p.options[idx], claude: `答案應為 ${fix[1]}`, explanation: null }));
        return;
      }
    }
    dropped.push({ item: p, verdict: /無法判斷/.test(v) ? '無法判斷' : /刪除/.test(v) ? '刪除' : `無法解讀的回覆：${v}` });
  });
  return { accepted, dropped, unanswered };
}

// 把 Final.md 中 practice 區塊換成新的已收錄題目。
function replacePracticeBlock(markdown, accepted, pendingCount) {
  const block = renderPracticeBlock(accepted, pendingCount);
  const a = markdown.indexOf(PRACTICE_START);
  const b = markdown.indexOf(PRACTICE_END);
  if (a === -1 || b === -1 || b < a) return null;
  return markdown.slice(0, a) + block + markdown.slice(b + PRACTICE_END.length);
}

module.exports = {
  adjudicatePractice, collectCandidates, buildBlindSolvePrompt, renderPracticeBlock, buildClaudeReviewPrompt,
  applyClaudeReview, replacePracticeBlock, applyClaimReview, claimMarker, PRACTICE_START, PRACTICE_END,
};
