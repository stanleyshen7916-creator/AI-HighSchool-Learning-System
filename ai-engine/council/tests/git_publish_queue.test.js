const fs = require('fs');
const os = require('os');
const path = require('path');
const { createGitPublishQueue } = require('../platform/GitPublishQueue');

describe('GitPublishQueue（發布後自動 commit + push 的排隊）', () => {
  let dataDir;
  let platformRoot;
  let queue;

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gpq-data-'));
    platformRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gpq-platform-'));
    const dir = path.join(platformRoot, 'docs/TeachingMaterials/materials/tm_40');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'material.md'), '# tm_40 — 竹圍高中高二化學「第三章」\n\n內容', 'utf8');
    queue = createGitPublishQueue({ dataDir, platformRoot });
  });

  test('寫入推送請求與 commit message；結果未出來前為 pending', () => {
    const id = queue.enqueue('tm_40', ['docs/TeachingMaterials/materials/tm_40/', 'js/data/TeachingMaterialData.js']);
    const req = JSON.parse(fs.readFileSync(path.join(queue.queueDir, `${id}.request.json`), 'utf8'));
    expect(req.paths).toEqual(['docs/TeachingMaterials/materials/tm_40/', 'js/data/TeachingMaterialData.js']);
    expect(fs.readFileSync(path.join(queue.queueDir, `${id}.message.txt`), 'utf8'))
      .toMatch(/^feat: tm_40 — 竹圍高中高二化學「第三章」\n/);
    expect(queue.status(id)).toMatchObject({ status: 'pending', publisherAlive: false });
  });

  test('推送程式寫回結果（含 BOM 也能讀）後回報 pushed／failed', () => {
    const ok = queue.enqueue('tm_40', ['a']);
    fs.writeFileSync(path.join(queue.queueDir, `${ok}.result.json`), '﻿{"ok":true,"commit":"abc1234"}', 'utf8');
    expect(queue.status(ok)).toMatchObject({ status: 'pushed', commit: 'abc1234' });

    const bad = `${Date.now() + 1}_tm_40`;
    fs.writeFileSync(path.join(queue.queueDir, `${bad}.request.json`), '{}', 'utf8');
    fs.writeFileSync(path.join(queue.queueDir, `${bad}.result.json`), '{"ok":false,"error":"push rejected"}', 'utf8');
    expect(queue.status(bad)).toMatchObject({ status: 'failed', error: 'push rejected' });
  });

  test('heartbeat 新鮮時視為推送程式在執行', () => {
    fs.mkdirSync(queue.queueDir, { recursive: true });
    fs.writeFileSync(path.join(queue.queueDir, 'publisher.heartbeat'), 'x');
    expect(queue.publisherAlive()).toBe(true);
  });

  test('拒絕不合法的編號與空的檔案清單', () => {
    expect(() => queue.enqueue('../tm_1', ['a'])).toThrow('不合法');
    expect(() => queue.enqueue('tm_40', [])).toThrow('沒有要推送的檔案');
    expect(() => queue.status('../../etc/passwd')).toThrow('不合法');
    expect(() => queue.status('123_tm_9')).toThrow('不存在');
  });
});
