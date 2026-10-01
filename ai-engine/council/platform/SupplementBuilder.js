// ai-engine/council/platform/SupplementBuilder.js — 2026-10-01 為既有教材加題。
//
// 題庫太小（每課 10～60 題）時，用網頁版 AI 為「已上架」的教材補出新題目。不呼叫任何
// AI API：引擎只負責產生 Prompt、擷取貼回來的結果、核對，由管理者複製貼上。
//
//   1. authorPrompt()   依原教材的核心概念／定義／重點／易錯點與既有題目，產生出題 Prompt。
//   2. solverPrompt()   擷取出題結果，產生「只有題目、沒有答案」的作答 Prompt，
//                       交給「新的」Claude 對話（三方模式再加 ChatGPT、Gemini）獨立作答。
//   3. check()          逐題核對：作答答案與出題答案不一致、作答者認為題目有問題、
//                       缺詳解、選項不足或重複 → 需人工確認；與既有題目或本批其他題
//                       重複 → 重複（不能加入）。
//
// 補充題目由 PackageBuilder.createSupplementDraft() 存成一份新的 tm_N「補充題庫」
// 教材包（metadata.source = 補充題庫，related.json 指向原教材），原教材完全不修改；
// 產生平台資料時（GenerateTeachingMaterialData.js）再併入原教材的題庫。
'use strict';

const fs = require('fs');
const path = require('path');
const { parseQuestionText } = require('./FinalParser');

const SUPPLEMENT_SOURCE = '補充題庫';
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const MAX_COUNT = 40;
// 題幹相似度（Dice）：≥ 0.9 視為重複；0.7～0.9 且選項相同也視為重複（換句話說的同一題）；
// 0.7～0.9 但選項不同 → 需人工確認（可能只是改了數字）。
const DUPLICATE_THRESHOLD = 0.9;
const SIMILAR_THRESHOLD = 0.7;
const SOLVER_NAMES = { 'claude-fresh': 'Claude（新對話）', chatgpt: 'ChatGPT', gemini: 'Gemini' };

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

// 比對重複用：去掉空白與標點。
function normalizeStem(text) {
  return String(text || '').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
}

function bigrams(text) {
  const out = new Map();
  for (let i = 0; i < text.length - 1; i++) {
    const g = text.slice(i, i + 2);
    out.set(g, (out.get(g) || 0) + 1);
  }
  return out;
}

// Dice 係數（字元雙字組）；太短的題幹只看是否完全相同。
function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 6 || b.length < 6) return 0;
  const ga = bigrams(a);
  const gb = bigrams(b);
  let overlap = 0;
  ga.forEach((n, g) => { overlap += Math.min(n, gb.get(g) || 0); });
  return (2 * overlap) / (a.length - 1 + b.length - 1);
}

function optionKey(options) {
  return (options || []).map(normalizeStem).sort().join('|');
}

// 'duplicate' | 'similar' | null
function compareQuestions(a, b) {
  const sim = similarity(a.norm, b.norm);
  if (sim >= DUPLICATE_THRESHOLD || (sim >= SIMILAR_THRESHOLD && a.opts && a.opts === b.opts)) return 'duplicate';
  return sim >= SIMILAR_THRESHOLD ? 'similar' : null;
}

function isSupplement(metadata, related) {
  return !!metadata && metadata.source === SUPPLEMENT_SOURCE &&
    !!related && Array.isArray(related.related) && related.related.length === 1;
}

function createSupplementBuilder({ platformRoot }) {
  const tmRoot = path.join(platformRoot, 'docs', 'TeachingMaterials');
  const materialsDir = path.join(tmRoot, 'materials');
  const lifecycle = () => require(path.join(tmRoot, 'scripts', 'MaterialLifecycle.js'));

  function loadPackage(materialId) {
    const dir = path.join(materialsDir, materialId);
    return {
      materialId,
      metadata: readJson(path.join(dir, 'metadata.json'), null),
      manifest: readJson(path.join(dir, 'manifest.json'), {}),
      summary: readJson(path.join(dir, 'summary.json'), {}),
      questions: (readJson(path.join(dir, 'questionbank.json'), { questions: [] }).questions) || [],
      related: readJson(path.join(dir, 'related.json'), { related: [] }),
    };
  }

  function materialIds() {
    if (!fs.existsSync(materialsDir)) return [];
    return fs.readdirSync(materialsDir).filter((n) => /^tm_\d+$/.test(n))
      .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
  }

  // 已上架、不是補充題庫、也沒有封存的教材，才能加題。
  function loadParent(parentId) {
    if (!/^tm_\d+$/.test(String(parentId || ''))) throw new Error('請選擇要加題的教材');
    if (!fs.existsSync(path.join(materialsDir, parentId))) throw new Error(`找不到教材 ${parentId}`);
    const pkg = loadPackage(parentId);
    if (!pkg.metadata) throw new Error(`${parentId} 的 metadata.json 無法讀取`);
    if (isSupplement(pkg.metadata, pkg.related)) throw new Error(`${parentId} 本身是補充題庫，請改選原教材`);
    if (pkg.manifest.archived === true) throw new Error(`${parentId} 已封存`);
    if (lifecycle().resolveStage(parentId) !== 'IMPORTED') throw new Error(`${parentId} 尚未上架，不能加題`);
    return pkg;
  }

  // parentId -> [補充題庫教材包]（含草稿：避免草稿尚未發布時重複出同樣的題目）。
  function supplementsOf(parentId) {
    return materialIds().map(loadPackage)
      .filter((p) => isSupplement(p.metadata, p.related) && p.related.related[0].materialId === parentId);
  }

  function listParents() {
    const lc = lifecycle();
    const all = materialIds().map(loadPackage).filter((p) => p.metadata);
    const supplementCounts = {};
    all.filter((p) => isSupplement(p.metadata, p.related)).forEach((p) => {
      const parent = p.related.related[0].materialId;
      supplementCounts[parent] = (supplementCounts[parent] || 0) + p.questions.length;
    });
    return all
      .filter((p) => !isSupplement(p.metadata, p.related) && p.manifest.archived !== true && lc.resolveStage(p.materialId) === 'IMPORTED')
      .map((p) => ({
        materialId: p.materialId,
        semester: p.metadata.semester || null,
        subject: p.metadata.subject || null,
        grade: p.metadata.grade || null,
        chapter: p.metadata.chapter || null,
        unit: p.metadata.unit || null,
        materialType: p.metadata.materialType || null,
        questionCount: p.questions.length,
        supplementCount: supplementCounts[p.materialId] || 0,
      }));
  }

  function existingQuestions(parent) {
    return parent.questions.concat(...supplementsOf(parent.materialId).map((s) => s.questions))
      .map((q) => ({ questionId: q.questionId, question: q.question, norm: normalizeStem(q.question), opts: optionKey(q.options) }));
  }

  function difficultyPlan(count, difficulty) {
    const d = difficulty || {};
    const plan = { 易: Number(d['易']) || 0, 中等: Number(d['中等']) || 0, 難: Number(d['難']) || 0 };
    const total = plan['易'] + plan['中等'] + plan['難'];
    if (total !== count) {
      plan['易'] = Math.round(count * 0.3);
      plan['難'] = Math.round(count * 0.2);
      plan['中等'] = count - plan['易'] - plan['難'];
    }
    return plan;
  }

  function section(title, items) {
    const list = (items || []).filter(Boolean);
    return list.length ? [`${title}：`, ...list.map((t) => `- ${t}`), ''] : [];
  }

  function authorPrompt({ parentId, count, difficulty }) {
    const parent = loadParent(parentId);
    const n = Math.floor(Number(count));
    if (!(n >= 1 && n <= MAX_COUNT)) throw new Error(`題數請填 1～${MAX_COUNT}`);
    const plan = difficultyPlan(n, difficulty);
    const m = parent.metadata;
    const s = parent.summary || {};
    const existing = existingQuestions(parent);
    const stems = existing.slice(0, 150).map((q) => `- ${String(q.question).replace(/\s+/g, ' ').slice(0, 70)}`);
    const materialInfo = [
      `科目：${m.subject || ''}（${m.grade || ''}）`,
      `章節：${m.chapter || ''}${m.unit ? ` / ${m.unit}` : ''}`,
    ];
    const summaryLines = [
      ...section('核心概念', s.coreConcepts),
      ...section('重要定義', s.definitions),
      ...section('重點整理', s.keyPoints),
      ...section('易錯觀念', s.pitfalls),
    ];
    const prompt = [
      `你是一位資深的高中${m.subject || ''}老師。請為下列教材出 ${n} 題「全新」的單選練習題，用來擴充學生的練習題庫。`,
      '',
      '【教材】',
      ...materialInfo,
      '',
      '【教材重點】（只能依據這些內容與本章節的課綱範圍出題，不得超出範圍）',
      ...(summaryLines.length ? summaryLines : ['（此教材沒有整理好的摘要，請依章節名稱與下列既有題目判斷範圍）', '']),
      `【既有題目】（共 ${existing.length} 題；不要出重複的題目，也不要只改數字或換句話說）`,
      ...(stems.length ? stems : ['（無）']),
      ...(existing.length > stems.length ? [`…（其餘 ${existing.length - stems.length} 題略）`] : []),
      '',
      `【難度分布】易 ${plan['易']} 題、中等 ${plan['中等']} 題、難 ${plan['難']} 題`,
      '',
      '【出題規則】',
      '1. 每題 4 個選項 (A)～(D)，只有一個正確答案；正確答案的位置請平均分散在 A～D。',
      '2. 不要使用「以上皆是」「以上皆非」「兩者皆是」這類選項。',
      '3. 題目不可依賴圖片；需要圖形時請用文字完整描述。',
      '4. 數學式用一般文字與 Unicode 符號（例如 √2、π、x²、θ、≤），不要用 LaTeX。',
      '5. 詳解要寫出完整的推理或計算步驟，並簡短說明其他選項為什麼錯。',
      '6. 每題標註知識點（使用上面教材重點的用語）與難度（易／中等／難）。',
      '7. 全部出完後，請逐題重新驗算答案；發現錯誤請直接改正後再輸出。',
      '',
      '【輸出格式】（學習平台會自動擷取，請完全依照此格式，不要輸出其他說明文字）',
      'Q1. 題幹',
      '(A) 選項　(B) 選項　(C) 選項　(D) 選項',
      '答案：B',
      '詳解：完整解題步驟',
      '知識點：…',
      '難度：中等',
      '',
      'Q2. …',
    ].join('\n');
    return { parentId, count: n, difficulty: plan, existingCount: existing.length, prompt };
  }

  function parseAuthor(authorText) {
    if (!String(authorText || '').trim()) throw new Error('請先貼上出題結果');
    const parsed = parseQuestionText(authorText);
    const seen = new Set();
    const questions = parsed.questions.filter((q) => {
      if (seen.has(q.number)) return false;
      seen.add(q.number);
      return true;
    });
    if (!questions.length) throw new Error(`擷取不到任何題目：${parsed.warnings.join('；')}`);
    return { questions, warnings: parsed.warnings };
  }

  function solverPrompt({ authorText }) {
    const { questions, warnings } = parseAuthor(authorText);
    const prompt = [
      `請獨立作答以下 ${questions.length} 題單選題。每題只有一個正確答案，請仔細計算或推理後再作答。`,
      '',
      '【輸出格式】每行一題，只輸出題號與答案，例如：',
      'Q1：B',
      'Q2：D',
      '如果某題題意不清、沒有正確選項、或不只一個正確選項，請改寫成：',
      'Q3：有問題（簡短說明原因）',
      '',
      '【題目】',
      ...questions.flatMap((q) => [
        `Q${q.number}. ${q.question}`,
        q.options.map((o, i) => `(${LETTERS[i]}) ${o}`).join('　'),
        '',
      ]),
    ].join('\n');
    return { count: questions.length, numbers: questions.map((q) => q.number), warnings, prompt };
  }

  // 作答結果：「Q1：B」「第1題 答案：(B)」「1. B」；「Q3：有問題（原因）」。
  function parseSolver(text) {
    const answers = {};
    String(text || '').split(/\r?\n/).forEach((raw) => {
      const line = raw.replace(/\*\*/g, '').trim();
      const head = /^(?:Q|第)?\s*(\d+)\s*(?:題)?\s*[.．、:：)）]?\s*(.*)$/i.exec(line);
      if (!head || !/^(?:Q|第|\d)/i.test(line)) return;
      const number = Number(head[1]);
      const rest = head[2].replace(/^答案\s*[:：]?\s*/, '');
      if (/有問題|無法作答|無解|題目有誤/.test(rest)) {
        answers[number] = { key: null, problem: rest.replace(/^[:：\s]+/, '') || '作答者認為題目有問題' };
        return;
      }
      const m = /^[（(]?\s*([A-E])\s*[)）]?(?![A-Za-z])/.exec(rest);
      if (m && !answers[number]) answers[number] = { key: m[1], problem: null };
    });
    return answers;
  }

  function check({ parentId, authorText, solvers }) {
    const parent = loadParent(parentId);
    const { questions, warnings } = parseAuthor(authorText);
    const existing = existingQuestions(parent);
    const solverList = (solvers || [])
      .filter((s) => s && SOLVER_NAMES[s.id] && String(s.text || '').trim())
      .map((s) => ({ id: s.id, name: SOLVER_NAMES[s.id], answers: parseSolver(s.text) }));

    const accepted = [];
    const results = questions.map((q) => {
      const answerKey = LETTERS[q.options.indexOf(q.answer)];
      const self = { norm: normalizeStem(q.question), opts: optionKey(q.options) };
      const reasons = [];
      let status = 'ok';

      const dupExisting = existing.find((e) => compareQuestions(self, e) === 'duplicate');
      const dupBatch = accepted.find((a) => compareQuestions(self, a) === 'duplicate');
      if (dupExisting) reasons.push(`與既有題目 ${dupExisting.questionId} 重複：「${String(dupExisting.question).slice(0, 40)}」`);
      if (dupBatch) reasons.push(`與本批 Q${dupBatch.number} 重複`);
      if (dupExisting || dupBatch) {
        status = 'duplicate';
      } else {
        const simExisting = existing.find((e) => compareQuestions(self, e) === 'similar');
        const simBatch = accepted.find((a) => compareQuestions(self, a) === 'similar');
        if (simExisting) reasons.push(`與既有題目 ${simExisting.questionId} 相似（可能只改了數字或換句話說）：「${String(simExisting.question).slice(0, 40)}」`);
        if (simBatch) reasons.push(`與本批 Q${simBatch.number} 相似（可能只改了數字或換句話說）`);
        accepted.push({ number: q.number, ...self });
      }

      const solverAnswers = solverList.map((s) => {
        const a = s.answers[q.number];
        return { id: s.id, name: s.name, key: a ? a.key : null, problem: a ? a.problem : null };
      });
      if (!solverList.length) reasons.push('尚未獨立作答核對');
      solverAnswers.forEach((a) => {
        if (a.problem) reasons.push(`${a.name}認為題目有問題：${a.problem}`);
        else if (!a.key) reasons.push(`${a.name}沒有作答本題`);
        else if (a.key !== answerKey) reasons.push(`${a.name}答 ${a.key}，出題答案為 ${answerKey}`);
      });
      if (!q.explanation) reasons.push('缺少詳解');
      if (q.options.length < 4) reasons.push(`只有 ${q.options.length} 個選項`);
      if (new Set(q.options.map(normalizeStem)).size !== q.options.length) reasons.push('有重複的選項');
      if (status === 'ok' && reasons.length) status = 'review';

      return {
        number: q.number,
        question: q.question,
        options: q.options,
        answer: q.answer,
        answerKey,
        explanation: q.explanation,
        knowledgePoint: q.knowledgePoint || q.section || null,
        difficulty: q.difficulty || null,
        solverAnswers,
        status,
        reasons,
      };
    });

    const counts = { ok: 0, review: 0, duplicate: 0 };
    results.forEach((r) => { counts[r.status] += 1; });
    return { parentId, solvers: solverList.map((s) => ({ id: s.id, name: s.name })), counts, warnings, questions: results };
  }

  return { listParents, loadParent, authorPrompt, solverPrompt, parseSolver, check, supplementsOf };
}

module.exports = { createSupplementBuilder, isSupplement, normalizeStem, similarity, compareQuestions, optionKey, SUPPLEMENT_SOURCE, SOLVER_NAMES };
