// 知識弱點「產生重點整理」按鈕（2026-11-06）。
//
// 真正的產生工作在主機上執行（tools/wrongbook-notes.ps1：需要主機的 Claude Code、
// git、gh 與 Supabase 金鑰，Docker 裡沒有），引擎只負責兩件事：
//   requestRun()  在 <資料目錄>/wrongbook_notes 寫一個 run.request，主機程式看到就開始跑
//   status()      讀主機程式寫的 status.json，並回報主機程式是否在執行（heartbeat）
const fs = require('fs');
const path = require('path');

// 主機程式每 5 秒寫一次 heartbeat。2026-11-08：改看檔案「內容」裡的時間，不看檔案
// 修改時間——Windows 的 Docker Desktop 掛載資料夾時，容器內看到的修改時間可能不更新，
// 導致主機程式明明在跑，頁面卻顯示「沒有在執行」。門檻放寬到 60 秒，容忍兩邊時鐘誤差。
const HEARTBEAT_STALE_MS = 60000;

function createWrongBookNotesJob({ dataDir }) {
  const dir = path.join(dataDir, 'wrongbook_notes');

  function workerAlive() {
    const file = path.join(dir, 'worker.heartbeat');
    try {
      let at = Date.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').trim());
      if (Number.isNaN(at)) at = fs.statSync(file).mtimeMs;
      return Math.abs(Date.now() - at) < HEARTBEAT_STALE_MS;
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
