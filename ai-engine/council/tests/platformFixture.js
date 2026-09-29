// 學習平台的暫存副本：需要寫入教材包的測試一律在這裡操作，絕不碰真正的
// docs/TeachingMaterials 與 js/data。只複製 PackageBuilder／匯入流程會讀寫的部分；
// source/ 內超過 256KB 的原始檔（掃描 PDF 等）以 1 byte 佔位檔取代——驗證只檢查
// source/ 內「有檔案」，不比對內容。
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REAL_PLATFORM_ROOT = path.resolve(__dirname, '..', '..', '..');
const COPIED = [
  'docs/TeachingMaterials',
  'js/core/Icons.js',
  'js/data/WorkspaceData.js',
  'js/data/TeachingMaterialData.js',
  'js/data/RepositoryStatus.js',
];

function copyTree(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((name) => copyTree(path.join(src, name), path.join(dest, name)));
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (stat.size > 256 * 1024 && src.includes(`${path.sep}source${path.sep}`)) {
    fs.writeFileSync(dest, 'x');
    return;
  }
  fs.copyFileSync(src, dest);
}

function createPlatformCopy() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ahs-platform-'));
  COPIED.forEach((rel) => copyTree(path.join(REAL_PLATFORM_ROOT, rel), path.join(root, rel)));
  return root;
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(p) : [p];
  });
}

// { 相對路徑: sha256 }，用來證明既有教材包的每一個檔案都沒有被改動。
function hashTree(root, rel) {
  const out = {};
  listFiles(path.join(root, rel)).forEach((file) => {
    out[path.relative(root, file).split(path.sep).join('/')] =
      crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  });
  return out;
}

function existingMaterialIds(root) {
  return fs.readdirSync(path.join(root, 'docs/TeachingMaterials/materials')).filter((n) => /^tm_\d+$/.test(n));
}

module.exports = { createPlatformCopy, hashTree, existingMaterialIds, REAL_PLATFORM_ROOT };
