// 2026-11-17 B2 變式題：Final.md「⑩ 變式題」（V5. 代表 Q5 的變式題）→ questionbank.json 的 variantOf。
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createPlatformCopy } = require('./platformFixture');
const { createPackageBuilder } = require('../platform/PackageBuilder');
const { parseFinal } = require('../platform/FinalParser');

const META = {
  school: 'cjsh', semester: 'g2s1', subject: '數學', grade: '高二',
  chapter: '第一章 三角函數', unit: '1-1 弧度量', materialType: 'TEXTBOOK',
};
const BASE = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample_Final.md'), 'utf8').replace(/\r\n/g, '\n');
const VARIANTS = [
  '',
  '## ⑩ 變式題',
  '',
  '**V1.** 已知圓心角為 2π/3 弳，求其角度為多少度？',
  '(A) 60°　(B) 90°　(C) 120°　(D) 150°',
  '答案：C',
  '詳解：2π/3 × 180°/π = 120°。',
  '難度：易',
  '',
  '**V2.** 已知圓心角為 150°，求其弧度為多少？',
  '(A) π/6　(B) 5π/6　(C) 7π/6　(D) 3π/2',
  '答案：B',
  '',
  '**V99.** 找不到原題的變式題',
  '(A) 1　(B) 2',
  '答案：A',
  '',
  '**V1.** 已知圓心角為 5π/6 弳，求其角度為多少度？',
  '(A) 100°　(B) 120°　(C) 150°　(D) 165°',
  '答案：C',
  '',
  '**V2.** 已知圓心角為 180°，求其弧度？',
  '(A) π　(B) 2π',
  '',
].join('\n');
const FINAL = BASE.trimEnd() + '\n' + VARIANTS;

describe('FinalParser 變式題', () => {
  const r = parseFinal(FINAL);

  test('V1／V2 解析成對應原題的變式題，含答案、詳解、難度', () => {
    expect(r.variants.map((v) => v.parent)).toEqual([1, 2]);
    expect(r.variants[0]).toMatchObject({ answer: '120°', difficulty: '易' });
    expect(r.variants[0].explanation).toMatch(/120/);
    expect(r.variants[0].options).toHaveLength(4);
  });

  test('找不到原題、題幹與原題相同、沒有答案的變式題不收錄並列入警告', () => {
    expect(r.warnings.join('\n')).toMatch(/V99：找不到對應的原題/);
    expect(r.warnings.join('\n')).toMatch(/V1：題幹與原題 Q1 相同/);
    expect(r.warnings.join('\n')).toMatch(/V2：找不到答案/);
  });

  test('一般題數量不受影響（變式題不混進 questions）', () => {
    expect(r.questions).toHaveLength(3);
    expect(parseFinal(BASE).variants).toEqual([]);
  });
});

describe('建立草稿：variantOf', () => {
  test('變式題接在一般題之後，variantOf 指向原題 questionId，知識點與原題一致', () => {
    const platform = createPlatformCopy();
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahs-var-'));
    const builder = createPackageBuilder({ platformRoot: platform, dataDir });
    const draft = builder.createDraft({ finalFilename: 'v_Final.md', finalMarkdown: FINAL, metadata: META });
    const dir = path.join(platform, 'docs/TeachingMaterials/materials', draft.materialId);
    const qs = JSON.parse(fs.readFileSync(path.join(dir, 'questionbank.json'), 'utf8')).questions;
    const regular = qs.filter((q) => !q.variantOf);
    const variants = qs.filter((q) => q.variantOf);
    expect(regular).toHaveLength(3);
    expect(variants).toHaveLength(2);
    expect(variants[0].variantOf).toBe(`${draft.materialId}_q1`);
    expect(variants[1].variantOf).toBe(`${draft.materialId}_q2`);
    expect(variants[0].knowledgePoint).toBe(regular[0].knowledgePoint);
    expect(new Set(qs.map((q) => q.questionId)).size).toBe(qs.length);
    expect(draft.warnings ? JSON.stringify(draft.warnings) : '').not.toMatch(/驗證失敗/);
  });
});
