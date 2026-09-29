// ai-engine/council/platform/FinalParser.js — 2026-09-29 教材上傳併入學習平台。
//
// 把 Council 產出的 Final.md 拆成教材包（docs/TeachingMaterials 的 Package Standard）
// 需要的結構化內容：summary.json 的各欄位、questionbank.json 的單選題。
//
// 原則：只擷取 Final.md 裡「真的寫出來」的內容，不補寫、不猜測。
//   - 章節內容是「未提供有效內容」「（待補充…）」這類佔位文字時，視為空白。
//   - 題目必須同時找得到題幹、至少兩個選項、以及對應到某個選項的答案才會收錄；
//     缺任何一項就不收錄，並記一筆 warning，交給管理者在上傳頁預覽時判斷。
// Final.md 的格式在各次產出之間並不一致（Council 模板十五章節、Tri-Web 模板的
// ⑨練習題／⑩每題答案／⑪每題完整詳解等），所以一律以「標題關鍵字」找章節。
'use strict';

const PLACEHOLDER = /^(（待補充|\(待補充|未提供有效內容|N\/A$|無$)/;
const MAX_ITEM_LENGTH = 400;

function parseFrontmatter(markdown) {
  const text = String(markdown || '').replace(/^﻿/, '');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { frontmatter: {}, body: text };
  const frontmatter = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const kv = /^\s*([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) return;
    frontmatter[kv[1].toLowerCase()] = kv[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  });
  return { frontmatter, body: text.slice(match[0].length) };
}

// 以二級標題（## ）切章節；三級以下標題留在章節內容中。
function splitSections(body) {
  const sections = [];
  let current = null;
  String(body).split(/\r?\n/).forEach((line) => {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h && !/^###/.test(line)) {
      current = { heading: h[1].trim(), lines: [] };
      sections.push(current);
      return;
    }
    if (current) current.lines.push(line);
  });
  return sections.map((s) => ({ heading: s.heading, body: s.lines.join('\n').trim() }));
}

function isPlaceholder(body) {
  const t = String(body || '').replace(/^[-\s]+$/gm, '').trim();
  return !t || PLACEHOLDER.test(t);
}

function findSections(sections, keywords, exclude) {
  return sections.filter((s) =>
    keywords.some((k) => s.heading.includes(k)) &&
    !(exclude || []).some((k) => s.heading.includes(k)) &&
    !isPlaceholder(s.body));
}

function cleanInline(text) {
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ITEM_LENGTH);
}

// 條列項目：「- 」「* 」「• 」「1. 」「1) 」「1、」開頭的行。
function bullets(body) {
  const out = [];
  String(body).split(/\r?\n/).forEach((line) => {
    const m = /^\s*(?:[-*•]|\d+[.)、])\s+(.+)$/.exec(line);
    if (!m) return;
    const item = cleanInline(m[1]);
    if (item && !/[：:]$/.test(item)) out.push(item);
  });
  return out;
}

function unique(items, max) {
  const seen = new Set();
  const out = [];
  items.forEach((item) => {
    if (!item || seen.has(item)) return;
    seen.add(item);
    out.push(item);
  });
  return out.slice(0, max);
}

function collectBullets(sections, keywords, max, exclude) {
  return unique(findSections(sections, keywords, exclude).flatMap((s) => bullets(s.body)), max);
}

// 沒有條列時的退路：章節內的一般段落（略過「Claude 認為：」這類標籤行、標題、表格、分隔線）。
function paragraphs(body) {
  return String(body).split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^(#|\||-{3,}|>)/.test(line) && !/[：:]$/.test(line))
    .map(cleanInline)
    .filter(Boolean);
}

function collectItems(sections, keywords, max) {
  const found = collectBullets(sections, keywords, max);
  if (found.length) return found;
  return unique(findSections(sections, keywords).flatMap((s) => paragraphs(s.body)), max);
}

// 關鍵字：條列項目冒號／破折號前的詞，或粗體標出的詞。
function keywordTerms(sections) {
  const terms = [];
  findSections(sections, ['重點詞彙', '關鍵字', '重要定義']).forEach((s) => {
    (s.body.match(/\*\*([^*\n]{1,20})\*\*/g) || []).forEach((b) => terms.push(b.replace(/\*\*/g, '').trim()));
    bullets(s.body).forEach((item) => {
      const head = item.split(/[：:—－=（(]/)[0].trim();
      if (head && head.length <= 20) terms.push(head);
    });
  });
  return unique(terms.filter((t) => !/[：:]$/.test(t)), 40);
}

// ---- 題目 -------------------------------------------------------------------

const Q_STEM = /^\s*(?:\*\*\s*)?(?:Q|第)\s*(\d+)\s*(?:題)?\s*[.．、:：]?\s*(?:\*\*)?\s*(.*)$/;
const OPTION_TOKEN = /[（(]\s*([A-E])\s*[)）]/;
const OPTION_LINE = /^\s*([A-E])\s*[.．、]\s*(.+)$/;
// 題目區塊內直接寫出的答案／詳解（上傳頁的 Prompt 要求的格式）。
const INLINE_ANSWER = /^\s*(?:\*\*)?\s*答案\s*(?:\*\*)?\s*[:：]\s*(?:\*\*)?\s*[（(]?\s*([A-E])\s*[)）]?/;
const INLINE_EXPLANATION = /^\s*(?:\*\*)?\s*(?:詳解|解析)\s*(?:\*\*)?\s*[:：]\s*(?:\*\*)?\s*(.*)$/;

function parseOptions(lines) {
  const joined = lines.join('\n');
  const options = [];
  if (OPTION_TOKEN.test(joined)) {
    const parts = joined.split(/[（(]\s*([A-E])\s*[)）]/);
    for (let i = 1; i < parts.length; i += 2) {
      options.push({ key: parts[i], text: cleanInline(parts[i + 1] || '') });
    }
  } else {
    lines.forEach((line) => {
      const m = OPTION_LINE.exec(line);
      if (m) options.push({ key: m[1], text: cleanInline(m[2]) });
    });
  }
  const keys = options.map((o) => o.key).join('');
  // 選項必須是 A、B、C… 依序連續且內容非空，否則視為解析失敗。
  if (options.length < 2 || !'ABCDE'.startsWith(keys) || options.some((o) => !o.text)) return null;
  return options;
}

// 題目區塊：從「Qn.」開始到下一個「Qn.」或下一個 ### 小節為止。
function questionBlocks(body) {
  const blocks = [];
  let subheading = null;
  let current = null;
  String(body).split(/\r?\n/).forEach((line) => {
    const sub = /^###\s+(.+?)\s*$/.exec(line);
    if (sub) {
      subheading = cleanInline(sub[1]);
      current = null;
      return;
    }
    const q = Q_STEM.exec(line);
    if (q && /^\s*(\*\*\s*)?(Q|第)\s*\d/.test(line)) {
      current = {
        number: Number(q[1]), stemLines: q[2] ? [q[2]] : [], optionLines: [],
        inlineAnswer: null, explanationLines: null, section: subheading,
      };
      blocks.push(current);
      return;
    }
    if (!current || !line.trim() || /^-{3,}$/.test(line.trim())) return;
    const answer = INLINE_ANSWER.exec(line);
    if (answer) { current.inlineAnswer = answer[1]; return; }
    const explanation = INLINE_EXPLANATION.exec(line);
    if (explanation) { current.explanationLines = explanation[1] ? [explanation[1]] : []; return; }
    if (current.explanationLines) { current.explanationLines.push(line); return; }
    if (OPTION_TOKEN.test(line) || OPTION_LINE.test(line) || current.optionLines.length) {
      current.optionLines.push(line);
    } else {
      current.stemLines.push(line);
    }
  });
  return blocks;
}

// 答案：表格（| 題號 | 1 | 2 |… 下一列 | 答案 | C | B |…）或「Q1. 答案：C」。
function parseAnswers(sections) {
  const answers = {};
  findSections(sections, ['答案', '詳解', '解析']).forEach((s) => {
    const rows = s.body.split(/\r?\n/).filter((l) => /^\s*\|/.test(l))
      .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
    for (let i = 0; i + 1 < rows.length; i++) {
      if (!/題號/.test(rows[i][0] || '')) continue;
      const answerRow = rows.slice(i + 1).find((r) => /答案/.test(r[0] || ''));
      if (!answerRow) continue;
      rows[i].slice(1).forEach((num, idx) => {
        const letter = (answerRow[idx + 1] || '').replace(/[^A-E]/g, '');
        if (/^\d+$/.test(num) && letter.length === 1) answers[Number(num)] = letter;
      });
    }
    s.body.split(/\r?\n/).forEach((line) => {
      const m = /(?:Q|第)\s*(\d+)\s*(?:題)?\s*[.．、]?\s*(?:\*\*)?\s*答案\s*[:：]\s*(?:\*\*)?\s*[（(]?([A-E])[)）]?/.exec(line);
      if (m && !answers[Number(m[1])]) answers[Number(m[1])] = m[2];
    });
  });
  return answers;
}

// 詳解：詳解章節內「Qn. 答案：X」之後、下一個 Qn. 之前的文字。
function parseExplanations(sections) {
  const explanations = {};
  findSections(sections, ['詳解', '解析']).forEach((s) => {
    let current = null;
    s.body.split(/\r?\n/).forEach((line) => {
      const m = /^\s*(?:\*\*\s*)?(?:Q|第)\s*(\d+)/.exec(line);
      if (m) {
        current = Number(m[1]);
        explanations[current] = explanations[current] || [];
        return;
      }
      if (current !== null && line.trim() && !/^-{3,}$/.test(line.trim())) explanations[current].push(line.trim());
    });
  });
  const out = {};
  Object.keys(explanations).forEach((k) => {
    const text = cleanInline(explanations[k].join(' '));
    if (text) out[k] = text;
  });
  return out;
}

function parseQuestions(sections) {
  const warnings = [];
  const practice = findSections(sections, ['練習題', '練習', '題目', '常考題型'], ['答案', '詳解', '解析']);
  const answers = parseAnswers(sections);
  const explanations = parseExplanations(sections);
  const questions = [];
  const seen = new Set();

  practice.forEach((s) => questionBlocks(s.body).forEach((block) => {
    const label = `Q${block.number}`;
    if (seen.has(block.number)) {
      warnings.push(`${label}：題號重複，只保留第一題`);
      return;
    }
    seen.add(block.number);
    const stem = cleanInline(block.stemLines.join(' '));
    const options = parseOptions(block.optionLines);
    const letter = block.inlineAnswer || answers[block.number];
    const inlineExplanation = block.explanationLines ? cleanInline(block.explanationLines.join(' ')) : '';
    if (!stem) { warnings.push(`${label}：找不到題幹，未收錄`); return; }
    if (!options) { warnings.push(`${label}：找不到完整的 (A)(B)… 選項，未收錄`); return; }
    const chosen = options.find((o) => o.key === letter);
    if (!chosen) { warnings.push(`${label}：找不到答案或答案不在選項中，未收錄`); return; }
    if (/!\[[^\]]*\]\(/.test(block.stemLines.join(' '))) warnings.push(`${label}：題幹引用圖片，平台不會顯示該圖`);
    questions.push({
      number: block.number,
      question: stem,
      options: options.map((o) => o.text),
      answer: chosen.text,
      explanation: inlineExplanation || explanations[block.number] || null,
      section: block.section,
    });
  }));

  if (!questions.length) warnings.push('沒有可匯入的單選題（需有題號、(A)(B)… 選項與答案），題庫為空');
  return { questions, warnings };
}

// ---- 入口 -------------------------------------------------------------------

function parseFinal(markdown) {
  const { frontmatter, body } = parseFrontmatter(markdown);
  const sections = splitSections(body);
  const titleMatch = /^#\s+(.+?)\s*$/m.exec(body);
  const { questions, warnings } = parseQuestions(sections);

  const summary = {
    coreConcepts: collectItems(sections, ['核心概念'], 20),
    definitions: collectBullets(sections, ['重要定義', '重點詞彙', '關鍵字'], 30),
    keywords: keywordTerms(sections),
    keyPoints: collectBullets(sections, ['章節摘要', '常考', '重點整理', '需熟記'], 30, ['易錯']),
    pitfalls: collectBullets(sections, ['易錯', '易混淆'], 20),
    reviewSuggestions: collectBullets(sections, ['複習建議', '延伸思考'], 15),
  };
  if (!summary.coreConcepts.length) warnings.push('「核心概念」章節沒有可擷取的條列內容');

  const placeholderSections = sections.filter((s) => isPlaceholder(s.body)).map((s) => s.heading);
  return {
    frontmatter,
    title: titleMatch ? cleanInline(titleMatch[1]) : null,
    body,
    sections: sections.map((s) => ({ heading: s.heading, empty: isPlaceholder(s.body) })),
    placeholderSections,
    summary,
    questions,
    qualityGate: frontmatter.quality_gate || null,
    finalScore: frontmatter.final_score || null,
    warnings,
  };
}

module.exports = { parseFinal, parseFrontmatter, splitSections, parseOptions, isPlaceholder };
