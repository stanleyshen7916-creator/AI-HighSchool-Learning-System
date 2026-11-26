'use strict';
/* platform/QualityLessons.js — AHS 佇列 9 F「教訓庫」（2026-11-26）。
   每次發現錯題或關卡漏抓，就在這裡加一條「可以用程式執行」的規則，並在 tests/quality_lessons.test.js 加一個會觸發它的測試，
   讓同類錯誤不再發生。規則在關卡 1 執行；規則本身出錯（拋例外）時該題判定不通過（fail-closed）。

   新增規則：{ id: 'L00N', since: 'YYYY-MM-DD', from: '事件（任務編號／題號）', rule: '一句話', check(q) -> [原因…] } */

const stripLabel = (o) => String(o == null ? '' : o).replace(/^\s*[（(]?\s*[A-Ha-h]\s*[)）.．、]\s*/, '').trim();
const LETTERS = 'ABCDEFGH';
function answerLetter(q) {
  const opts = (q.options || []).map(stripLabel);
  const a = String(q.answer == null ? '' : q.answer).trim();
  if (/^[A-H]$/i.test(a)) return a.toUpperCase();
  const m = /^\s*[（(]\s*([A-H])\s*[)）]/i.exec(a);
  if (m) return m[1].toUpperCase();
  const i = opts.findIndex((o) => o && o.replace(/\s/g, '') === a.replace(/\s/g, ''));
  return i >= 0 ? LETTERS[i] : null;
}

const LESSONS = [
  {
    id: 'L001', since: '2026-11-15', from: 'AHS-B6 題組被抽題拆散（56 組 126 題）',
    rule: '題幹寫「承上題／承第 N 題／同上題／承上圖」的題目必須有 groupId',
    check: (q) => (/承上題|承第\s*[0-9０-９一二三四五六七八九十]+\s*題|同上題|承上圖/.test(String(q.question || '')) && !q.groupId ? ['題組題沒有 groupId，抽題時會被拆散'] : []),
  },
  {
    id: 'L002', since: '2026-11-15', from: 'AHS-B7 tm_94_q43 詳解寫的選項與答案不同',
    rule: '詳解明寫「故選／答案為／正解」某選項時，必須與答案一致',
    check: (q) => {
      const ex = String(q.explanation || '');
      const said = [...ex.matchAll(/(?:故選|答案(?:為|是)|正解(?:為|是)?|應選)\s*[（(]?\s*([A-H])\s*[)）]?/g)].map((m) => m[1]);
      const want = answerLetter(q);
      if (!said.length || !want) return [];
      return said.some((x) => x !== want) ? [`詳解寫選 ${said.join('、')}，答案是 ${want}`] : [];
    },
  },
  {
    id: 'L003', since: '2026-11-26', from: 'AHS-BUG 缺原圖題（29 題停用）',
    rule: '標記缺圖（figureMissing）且沒有 figureSvg 的題目不得出題',
    check: (q) => (q.figureMissing && !q.figureSvg ? ['題目缺原圖'] : []),
  },
  {
    id: 'L004', since: '2026-11-26', from: 'AHS-A3 實跑：本機初稿的變式題只有題幹',
    rule: '變式題（variantOf）必須有完整選項、答案與詳解',
    check: (q) => {
      if (!q.variantOf) return [];
      const r = [];
      if (!Array.isArray(q.options) || q.options.filter((o) => stripLabel(o)).length < 2) r.push('變式題缺選項');
      if (!String(q.answer || '').trim()) r.push('變式題缺答案');
      if (String(q.explanation || '').trim().length < 6) r.push('變式題缺詳解');
      return r;
    },
  },
];

function runLessons(q, lessons = LESSONS) {
  const reasons = [];
  for (const l of lessons) {
    let r;
    try { r = l.check(q) || []; } catch (e) { r = [`規則執行錯誤：${e.message}`]; }
    r.forEach((x) => reasons.push(`[${l.id}] ${x}`));
  }
  return reasons;
}

module.exports = { LESSONS, runLessons, answerLetter };
