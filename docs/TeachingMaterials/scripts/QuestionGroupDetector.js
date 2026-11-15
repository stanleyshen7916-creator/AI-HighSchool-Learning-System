/* docs/TeachingMaterials/scripts/QuestionGroupDetector.js — 題組自動判定（2026-11-15）。
   題組：拆開就無法作答的連續題目。判定規則（只看題幹，不改教材包）：
     1. 題幹含「承上題／承上圖／承上，／承第N題／同上題／延續（接續）上題」→ 與前一題
        （或第 N 題）同組。題幹內「(2) 承上題」這類同一題的小題不算。
     2. 標示「【題組X】」或「（第a–b題為題組）」且與前一題標記相同 → 同組。
   產生器（GenerateTeachingMaterialData.js）在寫出 js/data/TeachingMaterialData.js 時
   呼叫 annotate()，替題組題加上 groupId（格式 tm_N_gK）；既有 tm_* 教材包不修改，新上傳
   的教材發佈時同樣自動判定。前端以 js/utils/QuestionGroups.js 整組打亂／抽題。 */
"use strict";

const CONT = /(承上題|承上圖|承上[，,（(]|承第\s*(\d+)\s*題|同上題|(?:延續|接續)(?:上|前)一?題)/;
const SUBPART_BEFORE = /[（(]\s*\d+\s*[）)]\s*$/;
const MARK = /【(題組[^】，,]*)|（(第\s*\d+\s*[～~–\-－至]\s*\d+\s*題為題組)/;

function continuation(text) {
  const m = CONT.exec(text || "");
  if (!m) return null;
  if (SUBPART_BEFORE.test(text.slice(Math.max(0, m.index - 8), m.index))) return null;
  return { ref: m[2] || null };
}

function markOf(text) {
  const m = MARK.exec(text || "");
  return m ? (m[1] || m[2]).replace(/\s/g, "") : null;
}

/* detect(questions, opts) → [[index, ...], ...]，每組至少 2 題、依原順序。 */
function detect(questions) {
  const n = questions.length;
  const parent = questions.map((_, i) => i);
  const find = (x) => { while (parent[x] !== x) x = parent[x] = parent[parent[x]]; return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb); };
  for (let i = 1; i < n; i++) {
    const text = questions[i].question || "";
    const c = continuation(text);
    if (c) {
      let target = i - 1;
      if (c.ref) {
        const re = new RegExp("(^|\\D)" + c.ref + "$");
        for (let j = i - 1; j >= 0; j--) { if (re.test(String(questions[j].questionNumber || ""))) { target = j; break; } }
      }
      union(target, i);
    }
    const mk = markOf(text);
    if (mk && mk === markOf(questions[i - 1].question || "")) union(i - 1, i);
  }
  const groups = {};
  for (let i = 0; i < n; i++) (groups[find(i)] = groups[find(i)] || []).push(i);
  return Object.keys(groups).map((k) => groups[k]).filter((g) => g.length > 1).sort((a, b) => a[0] - b[0]);
}

/* annotate(materialId, questions) — 回傳新陣列，題組題加上 groupId；同組題目若不
   相鄰，依第一題位置重新排列成連續（組內原順序）。 */
function annotate(materialId, questions) {
  const list = (questions || []).slice();
  const groups = detect(list);
  if (!groups.length) return list;
  const gid = {};
  groups.forEach((g, k) => g.forEach((i) => { gid[i] = `${materialId}_g${k + 1}`; }));
  const out = [];
  const placed = {};
  list.forEach((q, i) => {
    if (placed[i]) return;
    if (gid[i] === undefined) { out.push(q); return; }
    groups.find((g) => g.includes(i)).forEach((j) => { placed[j] = true; out.push(Object.assign({}, list[j], { groupId: gid[j] })); });
  });
  return out;
}

module.exports = { detect, annotate, continuation };
