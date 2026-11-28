// 2026-11-28：iPhone 的 HEIC 照片上傳後轉成 JPEG（services/heicImage.js）。
const fs = require('fs');
const os = require('os');
const path = require('path');
const heicImage = require('../services/heicImage');

describe('heicImage', () => {
  let dir;
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'heic-')); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  test('isHeic 認得 .heic／.heif（不分大小寫），其他格式不算', () => {
    expect(heicImage.isHeic('IMG_5230.HEIC')).toBe(true);
    expect(heicImage.isHeic('a.heif')).toBe(true);
    expect(heicImage.isHeic('a.jpg')).toBe(false);
    expect(heicImage.isHeic('heic.pdf')).toBe(false);
  });

  test('normalizeUploadedFiles：HEIC 轉成 JPEG，path／originalname／mimetype 改成 .jpg、原檔刪除，其他檔案不動', async () => {
    const heicPath = path.join(dir, '1-1.heic');
    const pngPath = path.join(dir, '1-2.png');
    fs.writeFileSync(heicPath, 'HEIC-BYTES');
    fs.writeFileSync(pngPath, 'PNG-BYTES');
    const convert = jest.fn(async ({ buffer, format }) => Buffer.from(`JPEG(${format}):${buffer.toString()}`));
    const files = [
      { originalname: 'IMG_5230.HEIC', path: heicPath, mimetype: 'image/heic', filename: '1-1.heic' },
      { originalname: 'p2.png', path: pngPath, mimetype: 'image/png', filename: '1-2.png' },
    ];
    await heicImage.normalizeUploadedFiles(files, { convert });
    expect(convert).toHaveBeenCalledTimes(1);
    expect(files[0].originalname).toBe('IMG_5230.jpg');
    expect(files[0].mimetype).toBe('image/jpeg');
    expect(files[0].path).toBe(path.join(dir, '1-1.jpg'));
    expect(fs.readFileSync(files[0].path, 'utf8')).toBe('JPEG(JPEG):HEIC-BYTES');
    expect(fs.existsSync(heicPath)).toBe(false);
    expect(files[1].path).toBe(pngPath);
    expect(files[1].originalname).toBe('p2.png');
  });
});
