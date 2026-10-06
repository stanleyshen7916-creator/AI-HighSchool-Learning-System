// 2026-10-06：從平台永久刪除已上架的教材（教材中心的管理者刪除）。在學習平台的暫存副本上執行。
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { createPlatformCopy } = require('./platformFixture');
const { createPackageBuilder } = require('../platform/PackageBuilder');

const PLATFORM = createPlatformCopy();
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahs-delete-'));
const builder = createPackageBuilder({ platformRoot: PLATFORM, dataDir });
const materialsDir = path.join(PLATFORM, 'docs/TeachingMaterials/materials');

function platformMaterialIds() {
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(fs.readFileSync(path.join(PLATFORM, 'js/data/TeachingMaterialData.js'), 'utf8'), sandbox.window);
  return sandbox.window.AHS.TeachingMaterialData.map((e) => e.materialId);
}

describe('PackageBuilder.deletePublished', () => {
  test('補充題庫不能單獨刪除，要刪原教材', () => {
    expect(() => builder.deletePublished('tm_43')).toThrow('是補充題庫');
    expect(fs.existsSync(path.join(materialsDir, 'tm_43'))).toBe(true);
  });

  test('刪除原教材時連同補充題庫一起刪，並重新產生平台資料', () => {
    expect(platformMaterialIds()).toContain('tm_10');
    const r = builder.deletePublished('tm_10');
    expect(r.removed).toEqual(expect.arrayContaining(['tm_10', 'tm_43']));
    expect(fs.existsSync(path.join(materialsDir, 'tm_10'))).toBe(false);
    expect(fs.existsSync(path.join(materialsDir, 'tm_43'))).toBe(false);
    expect(platformMaterialIds()).not.toContain('tm_10');
    expect(r.changedPaths).toEqual(expect.arrayContaining([
      'docs/TeachingMaterials/materials/tm_10/', 'docs/TeachingMaterials/materials/tm_43/', 'js/data/TeachingMaterialData.js',
    ]));
  });

  test('不存在或不合法的編號會被拒絕', () => {
    expect(() => builder.deletePublished('tm_10')).toThrow('不存在');
    expect(() => builder.deletePublished('../x')).toThrow('不合法');
  });
});
