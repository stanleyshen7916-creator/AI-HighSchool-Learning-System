// 知識弱點「產生重點整理」按鈕（2026-11-06）。
//
// 真正的產生工作在主機上執行（tools/wrongbook-notes.ps1：需要主機的 Claude Code、
// git、gh 與 Supabase 金鑰，Docker 裡沒有），引擎只負責兩件事：
//   requestRun()  在 <資料目錄>/wrongbook_notes 寫一個 run.request，主機程式看到就開始跑
//   status()      讀主機程式寫的 status.json，並回報主機程式是否在執行（heartbeat）
const fs = require('fs');
const path = require('path');

const HEARTBEAT_STALE_MS = 20000;

function createWrongBookNotesJob({ dataDir }) {
  const dir = path.join(dataDir, 'wrongbook_notes');

  function workerAlive() {
    try {
      return Date.now() - fs.statSync(path.join(dir, 'worker.heartbeat')).mtimeMs < HEARTBEAT_STALE_MS;
    } catch (_) {
      return false;
    }
  }

  function status() {
    let current = { state: 'idle' };
    try {
      current = JSON.parse(fs.readFileSync(path.join(dir, 'status.json'), 'utf8').replace(/^﻿/, ''));
    } catch (_) { /* 還沒跑過 */ }
    return { ...current, queued: fs.existsSync(path.join(dir, 'run.request')), workerAlive: workerAlive() };
  }

  function requestRun() {
    const now = status();
    if (now.state === 'running' && now.workerAlive) return { ...now, accepted: false, reason: 'running' };
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'run.request'), new Date().toISOString(), 'utf8');
    return { ...status(), accepted: true };
  }

  return { dir, status, requestRun, workerAlive };
}

module.exports = { createWrongBookNotesJob };
