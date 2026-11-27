'use strict';
/* 佇列 9：品質標準 A／B／D／E 與教訓庫 F 的規則測試——每條規則都有會觸發它的測試。 */
const { loadConfig, leakChecks, bloomDistribution, explanationClaims, examCoverage, extraneousLoad } = require('../platform/QualityRules');
const { LESSONS, runLessons } = require('../platform/QualityLessons');
const { difficultyOf, runGates } = require('../platform/QualityGates');

const cfg = loadConfig();
const q = (o) => Object.assign({ id: 'x', type: 'single_choice', question: '下列何者是羅馬共和時期保障平民權益的官職？', options: ['執政官', '護民官', '獨裁官', '監察官'], answer: 'B', explanation: '護民官保障平民。難度：易 出處：「平民爭取權益，設立護民官」', section: '1-3' }, o);

describe('A 防洩題', () => {
  test('乾淨的題目沒有 fail 也沒有 warn', () => {
    expect(leakChecks(q(), cfg, '歷史')).toEqual({ fail: [], warn: [] });
  });
  test('1 長度洩題：正確選項 > 2 倍 → fail；1.5–2 倍 → warn', () => {
    const long = leakChecks(q({ options: ['執政官', '負責保障平民權益並可否決不利法案的護民官', '獨裁官', '監察官'] }), cfg, '歷史');
    expect(long.fail.join()).toMatch(/長度洩題/);
    const mid = leakChecks(q({ options: ['執政官制度', '古羅馬護民官制度', '獨裁官制度', '監察官制度'] }), cfg, '歷史');
    expect(mid.fail).toEqual([]);
    expect(mid.warn.join()).toMatch(/長度偏長/);
  });
  test('2 字詞洩題：題幹兩個以上的關鍵詞只出現在正確選項 → fail', () => {
    const r = leakChecks(q({ question: '羅馬平民爭取權益後設立了哪一個官職？', options: ['執政官', '平民權益的護民官', '獨裁官', '監察官'] }), cfg, '歷史');
    expect(r.fail.join()).toMatch(/字詞洩題/);
  });
  test('3 收斂洩題：正確選項與其他選項重疊最多 → warn', () => {
    const r = leakChecks(q({ question: '下列何者正確？', options: ['甲乙丙丁戊己', '甲乙丙丁戊庚', '甲乙丙丁辛己', '甲乙丙壬戊己'], answer: 'A', explanation: '甲乙丙丁。' }), cfg, '歷史');
    expect(r.warn.join()).toMatch(/收斂洩題/);
  });
  test('4 絕對詞只出現在錯誤選項 → warn', () => {
    const r = leakChecks(q({ options: ['執政官一定由貴族擔任', '護民官可否決法案', '獨裁官絕不交出權力', '監察官只有一人'] }), cfg, '歷史');
    expect(r.warn.join()).toMatch(/絕對詞/);
  });
  test('5 選項結構：長短差太多或超過字數上限 → warn', () => {
    const r = leakChecks(q({ options: ['官', '護民官', '獨裁官與元老院', '監察官'] }), cfg, '歷史');
    expect(r.warn.join()).toMatch(/長短差距過大/);
    const r2 = leakChecks(q({ options: ['甲'.repeat(80), '乙'.repeat(80), '丙'.repeat(80), '丁'.repeat(80)], answer: 'A', question: '下列何者正確？', explanation: '甲。' }), cfg, '歷史');
    expect(r2.warn.join()).toMatch(/超過 70 字/);
  });
  test('讀不到答案 → fail（fail-closed）', () => {
    expect(leakChecks(q({ answer: 'Z' }), cfg, '歷史').fail.join()).toMatch(/讀不出來/);
  });
});

describe('B Bloom 分布由程式重算', () => {
  const mk = (arr) => arr.map((b) => ({ bloom: b }));
  test('符合目標分布 → ok', () => {
    const r = bloomDistribution(mk([...Array(3).fill('記憶'), ...Array(3).fill('理解'), ...Array(3).fill('應用'), '分析']), cfg);
    expect(r.ok).toBe(true);
  });
  test('偏差超過 15% → 不 ok，列出缺的層次', () => {
    const r = bloomDistribution(mk([...Array(8).fill('記憶'), '理解', '應用']), cfg);
    expect(r.ok).toBe(false);
    expect(r.over).toEqual(['記憶']);
    expect(r.short).toEqual(['理解', '應用']);
  });
  test('有題目沒有標籤 → 不 ok（fail-closed）', () => {
    const r = bloomDistribution(mk(['記憶', '理解', '應用', null]), cfg);
    expect(r.unlabeled).toBe(1);
    expect(r.ok).toBe(false);
  });
});

describe('D 詳解逐項驗證', () => {
  const SRC = '羅馬共和時期，平民爭取權益，設立護民官，可以否決對平民不利的法案。十二表法是羅馬第一部成文法。';
  test('每個論述都在原文有依據 → 不標待複核', () => {
    const r = explanationClaims(q({ explanation: '平民爭取權益，設立護民官。護民官可以否決對平民不利的法案。難度：易 出處：「設立護民官」' }), SRC, cfg);
    expect(r.claims.length).toBe(2);
    expect(r.review).toEqual([]);
  });
  test('有論述找不到依據 → 標待複核並列出', () => {
    const r = explanationClaims(q({ explanation: '平民爭取權益，設立護民官。凱撒在高盧戰爭中擴張了羅馬版圖。' }), SRC, cfg);
    expect(r.unsupported.map((x) => x.claim).join()).toMatch(/凱撒/);
    expect(r.review.join()).toMatch(/1 個論述/);
  });
  test('沒有原文 → 標待複核（fail-closed）', () => {
    expect(explanationClaims(q(), '', cfg).review.join()).toMatch(/沒有教材原文/);
  });
});

describe('E 月考組卷效度', () => {
  test('涵蓋度 ≥ 70% → ok；不足列出缺的知識點', () => {
    const scope = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    expect(examCoverage(scope.slice(0, 7).map((k) => ({ knowledgePoint: k })), scope, cfg).ok).toBe(true);
    const low = examCoverage(scope.slice(0, 3).map((k) => ({ knowledgePoint: k })), scope, cfg);
    expect(low.ok).toBe(false);
    expect(low.missing).toHaveLength(7);
  });
  test('數理題幹超過字數上限 → 無關負擔警告；文科不檢查', () => {
    expect(extraneousLoad({ question: '甲'.repeat(130) }, '數學', cfg).join()).toMatch(/超過 數學 的 120 字/);
    expect(extraneousLoad({ question: '甲'.repeat(130) }, '歷史', cfg)).toEqual([]);
  });
});

describe('F 教訓庫', () => {
  test('每條規則都有編號、日期、來源事件與說明', () => {
    for (const l of LESSONS) {
      expect(l.id).toMatch(/^L\d{3}$/);
      expect(l.since).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(l.from.length).toBeGreaterThan(4);
      expect(typeof l.check).toBe('function');
    }
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });
  test('L001 題組題沒有 groupId', () => {
    expect(runLessons(q({ question: '承上題，該官職的主要權力為何？' })).join()).toMatch(/\[L001\]/);
    expect(runLessons(q({ question: '承上題，該官職的主要權力為何？', groupId: 'tm_1_g1' }))).toEqual([]);
  });
  test('L002 詳解寫的選項與答案不同（tm_94_q43 類）', () => {
    expect(runLessons(q({ explanation: '護民官保障平民，故選(A)。' })).join()).toMatch(/\[L002\] 詳解寫選 A，答案是 B/);
    expect(runLessons(q({ explanation: '護民官保障平民，故選(B)。' }))).toEqual([]);
  });
  test('L002 也擋「正確答案為 C」（佇列 8.7：tm_112_q28 等 9 題，選項打亂後詳解字母沒跟著改）', () => {
    expect(runLessons(q({ explanation: '護民官保障平民，因此正確答案為 C。' })).join()).toMatch(/\[L002\] 詳解寫選 C，答案是 B/);
    expect(runLessons(q({ explanation: '護民官保障平民，因此正確答案為 「護民官」。' }))).toEqual([]);
  });
  test('L003 缺原圖', () => {
    expect(runLessons(q({ figureMissing: true })).join()).toMatch(/\[L003\]/);
  });
  test('L004 變式題殘缺', () => {
    expect(runLessons(q({ variantOf: 'tm_1_q1', options: [], answer: '', explanation: '' })).join()).toMatch(/\[L004\] 變式題缺選項.*變式題缺答案.*變式題缺詳解/);
  });
  test('規則拋例外 → 該題不通過（fail-closed）', () => {
    const boom = [{ id: 'L999', check: () => { throw new Error('壞掉'); } }];
    expect(runLessons(q(), boom).join()).toMatch(/\[L999\] 規則執行錯誤/);
  });
});

describe('A4 接點（佇列 9）', () => {
  test('difficultyOf 讀得到「難度 ：中」（原本正則寫成 s*）', () => {
    expect(difficultyOf({ explanation: '說明。難度 ：中' })).toBe('中');
  });
  test('runGates：extraStructure 併入關卡 1 淘汰；reviewFlags 只記待複核', async () => {
    const { results, report } = await runGates([q({ id: 'a' }), q({ id: 'b', question: '承上題，該官職的主要權力為何？' })], {
      extraStructure: (x) => runLessons(x),
      reviewFlags: () => ['詳解有 1 個論述在原文找不到依據'],
    });
    expect(results[0]).toMatchObject({ passed: true, review: ['詳解有 1 個論述在原文找不到依據'] });
    expect(results[1]).toMatchObject({ passed: false, failedAt: 'structure' });
    expect(report.eliminated.structure).toBe(1);
  });
});

describe('關卡 2 出處比對容許 OCR 差異（佇列 9 tm_112 實跑）', () => {
  const { evidenceMatch, gateSource } = require('../platform/QualityGates');
  const SRC = '羅馬城建造的源頭也可追溯到希腊神話中的特洛伊戰爭，連結羅馬人與希腊神話的關係。';
  test('逐字＝exact；異體字（臘／腊）＝near；換一句話＝none', () => {
    expect(evidenceMatch('羅馬城建造的源頭也可追溯到希腊神話', SRC)).toBe('exact');
    expect(evidenceMatch('羅馬城建造的源頭也可追溯到希臘神話中的特洛伊戰爭，連結羅馬人與希腊神話的關係', SRC)).toBe('near');
    expect(evidenceMatch('雅典娜每天搭火箭去月球上班', SRC)).toBe('none');
  });
  test('near 不淘汰；none 仍淘汰', async () => {
    const mk = (quote) => ({ question: '羅馬城的建城傳說和哪一場戰爭有關？', options: ['特洛伊戰爭', '布匿克戰爭'], answer: 'A', explanation: `出處：「${quote}」` });
    expect(await gateSource(mk('羅馬城建造的源頭也可追溯到希臘神話中的特洛伊戰爭，連結羅馬人與希腊神話的關係'), { sourceText: SRC })).toEqual([]);
    expect(await gateSource(mk('雅典娜每天搭火箭去月球上班賺錢'), { sourceText: SRC })).toEqual(['依據不在教材原文裡（可能是模型捏造）']);
  });
});
