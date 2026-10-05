// 發布後自動 commit + push（2026-10-05）。
//
// 引擎在 Docker 裡，沒有 git，也拿不到主機的 GitHub 憑證；repo 又是 Windows 掛載
// （CRLF 轉換由主機 git 的 core.autocrlf 負責），在容器內跑 git 會把換行與 index 弄亂。
// 所以引擎只負責「排隊」：發布成功後在 <資料目錄>/git_queue 寫一份推送請求，
// 由主機上的 tools/git-publisher.ps1（啟動教材上傳引擎.bat 一併啟動）實際執行
// git add / commit / push，再把結果寫回同一個資料夾，上傳頁輪詢結果。
//
//   <id>.request.json  { materialId, paths, createdAt }   引擎寫
//   <id>.message.txt   commit message（UTF-8，給 git commit -F）  引擎寫
//   <id>.progress.txt  目前步驟                            推送程式寫
//   <id>.result.json   { ok, commit, pr, error, log }      推送程式寫
//   publisher.heartbeat                                     推送程式每輪更新
//
// main 受 GitHub ruleset 保護（只能經 PR、且自動測試須通過），所以推送程式是
// 推到 publish/<tm_N> 分支 → 開 PR → 等自動測試 → squash 合併，全程約 5 分鐘。
const fs = require('fs');
const path = require('path');

const HEARTBEAT_STALE_MS = 15000;

function createGitPublishQueue({ dataDir, platformRoot }) {
  const queueDir = path.join(dataDir, 'git_queue');

  function title(materialId) {
    // material.md 第一行：「# tm_34 — 竹圍高中高二化學「第三章 液態與溶液」」
    try {
      const first = fs.readFileSync(path.join(platformRoot, 'docs/TeachingMaterials/materials', materialId, 'material.md'), 'utf8')
        .split(/\r?\n/)[0].replace(/^#\s*/, '').trim();
      if (first) return first;
    } catch (_) { /* 沒有 material.md 就只用編號 */ }
    return materialId;
  }

  function enqueue(materialId, paths) {
    if (!/^tm_\d+$/.test(String(materialId))) throw new Error('不合法的教材識別碼');
    return enqueueTask(materialId, paths, `feat: ${title(materialId)}\n\n由教材上傳頁發布後自動推送（ai-engine/council）。\n`);
  }

  // 教材以外的上架（例如模擬月考預設範圍）。name 用於分支名稱 publish/<name>-…
  function enqueueTask(name, paths, message) {
    if (!/^[a-z0-9_-]+$/.test(String(name))) throw new Error('不合法的推送名稱');
    if (!Array.isArray(paths) || !paths.length) throw new Error('沒有要推送的檔案');
    fs.mkdirSync(queueDir, { recursive: true });
    const id = `${Date.now()}_${name}`;
    fs.writeFileSync(path.join(queueDir, `${id}.message.txt`), message, 'utf8');
    fs.writeFileSync(path.join(queueDir, `${id}.request.json`),
      JSON.stringify({ materialId: name, paths, createdAt: new Date().toISOString() }, null, 2), 'utf8');
    return id;
  }

  function publisherAlive() {
    try {
      return Date.now() - fs.statSync(path.join(queueDir, 'publisher.heartbeat')).mtimeMs < HEARTBEAT_STALE_MS;
    } catch (_) {
      return false;
    }
  }

  function status(id) {
    if (!/^\d+_[a-z0-9_-]+$/.test(String(id))) throw new Error('不合法的推送編號');
    const resultFile = path.join(queueDir, `${id}.result.json`);
    if (fs.existsSync(resultFile)) {
      const result = JSON.parse(fs.readFileSync(resultFile, 'utf8').replace(/^﻿/, ''));
      return { id, status: result.ok ? 'pushed' : 'failed', ...result };
    }
    if (!fs.existsSync(path.join(queueDir, `${id}.request.json`))) throw new Error('推送請求不存在');
    // 推送程式處理中時寫的步驟：commit／push／pr／checks（等自動測試，約 5 分鐘）／merge
    let progress = null;
    try { progress = fs.readFileSync(path.join(queueDir, `${id}.progress.txt`), 'utf8').trim() || null; } catch (_) { /* 尚未開始 */ }
    return { id, status: 'pending', progress, publisherAlive: publisherAlive() };
  }

  return { enqueue, enqueueTask, status, publisherAlive, queueDir };
}

module.exports = { createGitPublishQueue, HEARTBEAT_STALE_MS };
