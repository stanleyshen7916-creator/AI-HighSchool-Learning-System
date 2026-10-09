// Recompute the calculation items in rows.js and check structure.
const { ch1, ch2 } = require('./rows.js');
const find = (rows, s) => { const r = rows.filter((x) => x[2].includes(s)); if (r.length < 1) throw new Error('no ' + s); return r; };
const eq = (name, got, want) => { if (got !== want) throw new Error(name + ': ' + got + ' != ' + want); console.log('OK', name, got); };
eq('機會成本', find(ch1, '小安週六')[0][4], Math.max(800, 600, 300) + ' 元');
const [acc, eco] = find(ch1, '安安辭去');
const rev = 100, explicit = 30 + 50, hidden = 40 + 1;
eq('會計利潤', acc[4], (rev - explicit) + ' 萬元');
eq('經濟利潤', eco[4], '−' + Math.abs(rev - explicit - hidden) + ' 萬元');
// 甲 6 手機 / 3 平板, 乙 2 / 2 : opportunity cost of 1 phone in tablets
const ocA = 3 / 6, ocB = 2 / 2;
eq('比較利益 手機', find(ch1, '關於「絕對利益」')[0][4].startsWith('甲廠在手機與平板') && find(ch1, '下列敘述何者正確？').some((r) => r[4] === (ocA < ocB ? '甲廠在手機上具有比較利益' : '乙廠在手機上具有比較利益')), true);
// 小美 3 typing / 6 files, 小華 2 / 2: opportunity cost of 1 page in files
eq('比較利益 打字', find(ch1, '小美 1 小時')[0][4], (6 / 3 < 2 / 2 ? '小美打字、小華整理資料' : '小美整理資料、小華打字'));
eq('PPC 機會成本', find(ch1, 'A 點（電腦')[0][4], '電腦 ' + (100 - 80) + ' 臺');
const nb = { 甲: 500 - 300, 乙: 800 - 650, 丙: 400 - 150 };
eq('淨效益', find(ch1, '成本效益分析，應選擇')[0][4], Object.keys(nb).sort((a, b) => nb[b] - nb[a])[0]);
eq('需求量', find(ch2, '鬆餅')[0][4], [100, 80, 60].filter((p) => p >= 70).length + ' 份');
eq('供給量', find(ch2, '芒果')[0][4], [500, 700, 900].filter((p) => p <= 800).length + ' 箱');
console.log('ch1', ch1.length, 'ch2', ch2.length, 'multi', [...ch1, ...ch2].filter((r) => r[1] === 'M').length);
