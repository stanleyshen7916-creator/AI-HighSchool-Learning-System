// 每個測試檔案使用各自的暫存資料目錄（COUNCIL_DATA_DIR），測試絕不寫入真正的 Final.md、
// catalog 或上傳暫存。PLATFORM_ROOT 不在這裡設定：需要寫入教材包的測試會自行建立
// 學習平台的暫存副本（見 tests/platformFixture.js）。
const fs = require('fs');
const os = require('os');
const path = require('path');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'council-data-'));
process.env.COUNCIL_DATA_DIR = dataDir;

afterAll(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
});
