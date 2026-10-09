// 2026-10-09：竹圍高中 tm_52–54 撞號事件的防護。
//  - PackageBuilder.nextMaterialId() 一併排除 GitHub main 上已用的編號（setRemoteIds）。
//  - GitPublishQueue.latestFor() 取得某份教材最近一次推送請求的狀態（上傳紀錄顯示是否上線）。
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createPackageBuilder } = require('../platform/PackageBuilder');
const { createGitPublishQueue } = require('../platform/GitPublishQueue');

function tempPlatform(ids) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rid-platform-'));
  ids.forEach((id) => fs.mkdirSync(path.join(root, 'docs/TeachingMaterials/materials', id), { recursive: true }));
  return root;
}

describe('新教材編號排除 GitHub 上已用的編號', () => {
  test('本機只到 tm_51，雲端已到 tm_62：下一個是 tm_63', () => {
    const platformRoot = tempPlatform(['tm_50', 'tm_51']);
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rid-data-'));
    const builder = createPackageBuilder({ platformRoot, dataDir });
    expect(builder.nextMaterialId()).toBe('tm_52');
    builder.setRemoteIds(['tm_1', 'tm_52', 'tm_62', 'not-an-id']);
    expect(builder.nextMaterialId()).toBe('tm_63');
  });
});

describe('GitPublishQueue.latestFor', () => {
  test('回傳該教材最新一次請求的狀態；沒有請求時回 null', () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rid-q-'));
    const platformRoot = tempPlatform(['tm_64']);
    const queue = createGitPublishQueue({ dataDir, platformRoot });
    expect(queue.latestFor('tm_64')).toBeNull();
    const first = queue.enqueue('tm_64', ['docs/TeachingMaterials/materials/tm_64/']);
    fs.writeFileSync(path.join(queue.queueDir, `${first}.result.json`), JSON.stringify({ ok: false, error: 'boom' }), 'utf8');
    expect(queue.latestFor('tm_64')).toMatchObject({ status: 'failed', error: 'boom' });
    // A later request supersedes the failed one.
    const later = `${Date.now() + 1000}_tm_64`;
    fs.writeFileSync(path.join(queue.queueDir, `${later}.request.json`), '{"materialId":"tm_64","paths":["x"]}', 'utf8');
    expect(queue.latestFor('tm_64')).toMatchObject({ id: later, status: 'pending', publisherAlive: false });
    // Other materials (and delete-tm_64 tasks) are not mixed in.
    queue.enqueueTask('delete-tm_64', ['x'], 'chore');
    expect(queue.latestFor('tm_64').id).toBe(later);
    expect(queue.latestFor('tm_6')).toBeNull();
  });
});
