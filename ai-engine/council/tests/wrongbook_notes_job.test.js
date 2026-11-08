const fs = require('fs');
const os = require('os');
const path = require('path');
const { createWrongBookNotesJob } = require('../platform/WrongBookNotesJob');

describe('WrongBookNotesJob（知識弱點「產生重點整理」按鈕）', () => {
  let dataDir;
  let job;

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wbn-data-'));
    job = createWrongBookNotesJob({ dataDir });
  });

  test('還沒跑過：idle，主機程式未執行', () => {
    expect(job.status()).toMatchObject({ state: 'idle', queued: false, workerAlive: false });
  });

  test('按下按鈕寫入 run.request；主機程式的 status.json（含 BOM）可讀', () => {
    const r = job.requestRun();
    expect(r.accepted).toBe(true);
    expect(fs.existsSync(path.join(job.dir, 'run.request'))).toBe(true);
    fs.writeFileSync(path.join(job.dir, 'status.json'), '﻿{"state":"done","added":3,"pr":"https://github.com/x/y/pull/1"}', 'utf8');
    fs.writeFileSync(path.join(job.dir, 'worker.heartbeat'), new Date().toISOString(), 'utf8');
    expect(job.status()).toMatchObject({ state: 'done', added: 3, workerAlive: true, queued: true });
  });

  test('執行中（主機程式活著）時不重複排入', () => {
    fs.mkdirSync(job.dir, { recursive: true });
    fs.writeFileSync(path.join(job.dir, 'status.json'), '{"state":"running","step":"writing"}', 'utf8');
    fs.writeFileSync(path.join(job.dir, 'worker.heartbeat'), new Date().toISOString(), 'utf8');
    const r = job.requestRun();
    expect(r).toMatchObject({ accepted: false, reason: 'running' });
    expect(fs.existsSync(path.join(job.dir, 'run.request'))).toBe(false);
  });

  test('heartbeat 以檔案內容的時間判斷（檔案修改時間不可靠時）', () => {
    fs.mkdirSync(job.dir, { recursive: true });
    const hb = path.join(job.dir, 'worker.heartbeat');
    fs.writeFileSync(hb, new Date().toISOString(), 'utf8');
    const old = new Date(Date.now() - 3600 * 1000);
    fs.utimesSync(hb, old, old);
    expect(job.workerAlive()).toBe(true);
    fs.writeFileSync(hb, new Date(Date.now() - 5 * 60 * 1000).toISOString(), 'utf8');
    expect(job.workerAlive()).toBe(false);
  });
});
