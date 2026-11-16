// 2026-11-16 A7：題幹【圖：檔名】→ 建立草稿時複製到教材包 figures/，寫成 figureSvg <img>。
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createPlatformCopy } = require('./platformFixture');
const { createPackageBuilder } = require('../platform/PackageBuilder');
const { parseQuestionText } = require('../platform/FinalParser');

const META = {
  school: 'cjsh', semester: 'g2s1', subject: '數學', grade: '高二',
  chapter: '第一章 三角函數', unit: '1-1 弧度量', materialType: 'TEXTBOOK',
};
const FINAL = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample_Final.md'), 'utf8')
  .replace(/(\*\*Q1\.\*\*[^\n]*)/, '$1【圖：p12_01.jpg】')
  .replace(/(\*\*Q2\.\*\*[^\n]*)/, '$1【圖：missing.png】');

describe('附圖引用（A7）', () => {
  test('FinalParser 擷取【圖：檔名】並從題幹移除', () => {
    const r = parseQuestionText('**Q1.** 依圖判斷【圖：a/b/p1.jpg】\n(A) 1 (B) 2 (C) 3 (D) 4\n答案：B');
    expect(r.questions[0].figures).toEqual(['p1.jpg']);
    expect(r.questions[0].question).not.toMatch(/圖：/);
  });

  test('建立草稿：找到的圖複製進 figures/ 並寫入 figureSvg；找不到的列入警告', () => {
    const platform = createPlatformCopy();
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahs-fig-'));
    const imgDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahs-img-'));
    fs.writeFileSync(path.join(imgDir, 'p12_01.jpg'), 'JPEGDATA');
    const builder = createPackageBuilder({ platformRoot: platform, dataDir });
    const draft = builder.createDraft({ finalFilename: 'f_Final.md', finalMarkdown: FINAL, metadata: META, figureDirs: [imgDir] });
    const dir = path.join(platform, 'docs/TeachingMaterials/materials', draft.materialId);
    const qb = JSON.parse(fs.readFileSync(path.join(dir, 'questionbank.json'), 'utf8'));
    const q1 = qb.questions.find((q) => q.questionNumber === '1');
    expect(q1.figureSvg).toContain(`materials/${draft.materialId}/figures/${q1.questionId}.jpg`);
    expect(fs.readFileSync(path.join(dir, 'figures', `${q1.questionId}.jpg`), 'utf8')).toBe('JPEGDATA');
    const q2 = qb.questions.find((q) => q.questionNumber === '2');
    expect(q2.figureSvg).toBeUndefined();
    expect(JSON.stringify(draft)).toContain('找不到附圖 missing.png');
  });
});
