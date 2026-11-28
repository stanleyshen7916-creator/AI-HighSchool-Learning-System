// 2026-11-28：iPhone／iPad 拍的課本照片是 HEIC（.heic／.heif），MinerU、Tesseract 與瀏覽器
// 預覽都不能直接讀。上傳時先轉成 JPEG（heic-convert，純 JS／wasm，不需要系統套件），
// 之後整條流程把它當一般 .jpg 照片處理。原本引擎直接拒收 .heic，而且是在瀏覽器還在送
// 其他檔案時就回 400，Chrome 只看到連線被切斷，上傳頁顯示誤導的「無法連線到教材上傳引擎」。
const fs = require('fs');
const path = require('path');

const HEIC_EXTENSIONS = new Set(['.heic', '.heif']);

function isHeic(name) {
  return HEIC_EXTENSIONS.has(path.extname(String(name || '')).toLowerCase());
}

// 把 multer 存下來的 HEIC 檔轉成同目錄的 .jpg，回傳新的路徑並刪掉原檔。
async function convertToJpeg(filePath, { convert = require('heic-convert'), quality = 0.92 } = {}) {
  const input = await fs.promises.readFile(filePath);
  const output = await convert({ buffer: input, format: 'JPEG', quality });
  const target = filePath.replace(/\.(heic|heif)$/i, '') + '.jpg';
  await fs.promises.writeFile(target, Buffer.from(output));
  await fs.promises.unlink(filePath).catch(() => {});
  return target;
}

// multer 的 file 物件：HEIC 的轉成 JPEG，path／originalname／mimetype 都改成 .jpg。
async function normalizeUploadedFiles(files, opts) {
  for (const file of files) {
    if (!isHeic(file.originalname)) continue;
    // eslint-disable-next-line no-await-in-loop
    file.path = await convertToJpeg(file.path, opts);
    file.originalname = file.originalname.replace(/\.(heic|heif)$/i, '') + '.jpg';
    file.mimetype = 'image/jpeg';
    file.filename = path.basename(file.path);
  }
  return files;
}

module.exports = { HEIC_EXTENSIONS, isHeic, convertToJpeg, normalizeUploadedFiles };
