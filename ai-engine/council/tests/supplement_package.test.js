// 2026-11-19 AHS-UP2 P2-3：建立草稿時寫 explanations/<id>.json（規格 Specifications_ExplanationSupplementUpload_v0.1.md）
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createPlatformCopy } = require('./platformFixture');
const { createPackageBuilder } = require('../platform/PackageBuilder');

const META = {
  school: 'cjsh', semester: 'g2s1', subject: '數學', grade: '高二',
  chapter: '第一章 三角函數', unit: '1-1 弧度量', materialType: 'TEXTBOOK',
};
const q = (n, stem, explanation) => `**Q${n}.** ${stem}\n(A) 3/4　(B) 4/3　(C) 3/5　(D) 4/5\n答案：A\n詳解：${explanation}`;
const FULL = '\n解題關鍵：由 sinθ 補鄰邊。\n步驟：\n(1) 設對邊 3、斜邊 5。\n(2) 鄰邊 = 4。\n易錯：把對邊鄰邊弄反。';
const FINAL = ['# T', '## ⑪常考題型',
  q(1, '題目甲 tanθ = ？', FULL),
  q(2, '題目乙 tanθ = ？', '單行舊格式詳解。'),
  q(3, '題目丙 tanθ = ？', '\n解題關鍵：重點。\n步驟：\n(1) 只有一步。'),
  q(4, '題目丁 tanθ = ？', FULL.replace('鄰邊 = 4', '鄰邊 = 4（第四題）')),
].join('\n\n');

function setup() {
  const platform = createPlatformCopy();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahs-sup-'));
  const builder = createPackageBuilder({ platformRoot: platform, dataDir });
  const explDir = path.join(platform, 'docs/TeachingMaterials/explanations');
  return { platform, builder, explDir };
}

describe('詳解擴充寫入教材包（P2-3）', () => {
  test('建立草稿：合格的題目寫入 explanations/<id>.json，欄位與既有 tm_N.json 相同', () => {
    const { builder, explDir } = setup();
    const draft = builder.createDraft({ finalFilename: 'f_Final.md', finalMarkdown: FINAL, metadata: META });
    const file = path.join(explDir, `${draft.materialId}.json`);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(data.materialId).toBe(draft.materialId);
    expect(data.entries.map((e) => e.questionId)).toEqual([`${draft.materialId}_q1`, `${draft.materialId}_q4`]);
    expect(data.entries[0]).toEqual({
      questionId: `${draft.materialId}_q1`, materialId: draft.materialId, question: '題目甲 tanθ = ？',
      concept: '由 sinθ 補鄰邊。', steps: ['設對邊 3、斜邊 5。', '鄰邊 = 4。'], pitfalls: ['把對邊鄰邊弄反。'], note: '', figures: [],
    });
    // questionId 對得上題庫、題庫的扁平詳解照舊
    const bank = draft.questions.map((x) => x.questionId);
    data.entries.forEach((e) => expect(bank).toContain(e.questionId));
    expect(draft.questions[1].explanation).toBe('單行舊格式詳解。');
    // 不完整的第 3 題只有解析警告，沒有補強
    expect(draft.warnings.some((w) => /Q3：詳解擴充不完整/.test(w))).toBe(true);
  });

  test('沒有任何詳解擴充時不建立檔案；不碰既有的 explanations 檔', () => {
    const { builder, explDir } = setup();
    const before = fs.readdirSync(explDir).sort();
    const draft = builder.createDraft({ finalFilename: 'f_Final.md', finalMarkdown: FINAL.split('\n\n').filter((b) => !/解題關鍵/.test(b)).join('\n\n'), metadata: META });
    expect(fs.existsSync(path.join(explDir, `${draft.materialId}.json`))).toBe(false);
    expect(fs.readdirSync(explDir).sort()).toEqual(before);
  });

  test('刪除草稿時一併移除該教材的詳解擴充檔，其他檔案不動', () => {
    const { builder, explDir } = setup();
    const before = fs.readdirSync(explDir).sort();
    const draft = builder.createDraft({ finalFilename: 'f_Final.md', finalMarkdown: FINAL, metadata: META });
    expect(fs.existsSync(path.join(explDir, `${draft.materialId}.json`))).toBe(true);
    builder.deleteDraft(draft.materialId);
    expect(fs.readdirSync(explDir).sort()).toEqual(before);
  });

  test('寫入的內容符合 GenerateExplanationSupplement 的驗證條件（questionId、concept、steps、pitfalls、figures）', () => {
    const { builder, explDir } = setup();
    const draft = builder.createDraft({ finalFilename: 'f_Final.md', finalMarkdown: FINAL, metadata: META });
    const data = JSON.parse(fs.readFileSync(path.join(explDir, `${draft.materialId}.json`), 'utf8'));
    const ids = new Set(draft.questions.map((x) => x.questionId));
    data.entries.forEach((e) => {
      expect(ids.has(e.questionId)).toBe(true);
      expect(typeof e.concept).toBe('string');
      expect(e.concept).not.toBe('');
      expect(Array.isArray(e.steps) && e.steps.length > 0 && e.steps.every((t) => typeof t === 'string' && t)).toBe(true);
      expect(Array.isArray(e.pitfalls)).toBe(true);
      expect(e.figures).toEqual([]);
    });
  });

  test('發布：詳解擴充檔列入要推送的路徑', () => {
    const { builder } = setup();
    const withSup = builder.createDraft({ finalFilename: 'f_Final.md', finalMarkdown: FINAL, metadata: META });
    const result = builder.publish(withSup.materialId);
    expect(result.changedPaths).toContain(`docs/TeachingMaterials/explanations/${withSup.materialId}.json`);
  });
});
