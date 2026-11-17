/* scripts/autopilot/AutopilotBridge.js — 本機橋接：讓 Docker 裡的 n8n 能啟動宿主機的 Claude Code。
   執行：node scripts/autopilot/AutopilotBridge.js（或雙擊 啟動自動駕駛橋接.bat）
   無外部依賴。只供本機自動化使用，需要 X-Autopilot-Token（scripts/autopilot/.token）。 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.AUTOPILOT_PORT || 5679);
const QUEUE = path.join(__dirname, 'queue.json');
const RULES = path.join(__dirname, 'AutopilotRules.md');
const RUNS = path.join(__dirname, 'runs');
const WORKTREES = path.resolve(ROOT, '..', 'AHS-autopilot');
const TOKEN_FILE = path.join(__dirname, '.token');
const CLAUDE = process.env.AUTOPILOT_CLAUDE || 'claude';

if (!fs.existsSync(TOKEN_FILE)) fs.writeFileSync(TOKEN_FILE, crypto.randomBytes(24).toString('hex'));
const TOKEN = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
fs.mkdirSync(RUNS, { recursive: true });

const ALLOWED_TOOLS = [
  'Bash(npm run *)', 'Bash(npm test)', 'Bash(node *)',
  'Bash(git add *)', 'Bash(git commit *)', 'Bash(git status *)', 'Bash(git diff *)', 'Bash(git log *)', 'Bash(git branch *)',
  'Read', 'Edit', 'Write', 'Glob', 'Grep'
];
const QUOTA_RE = /usage limit|rate.?limit|limit reached|quota|credit balance|resets? (at|in)|overloaded|too many requests/i;

const readQueue = () => JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
const writeQueue = (q) => fs.writeFileSync(QUEUE, JSON.stringify(q, null, 2) + '\n');
const git = (args, cwd) => spawnSync('git', args, { cwd, encoding: 'utf8' });

function ensureWorktree(taskId) {
  const safe = String(taskId).replace(/[^\w.-]/g, '_');
  const dir = path.join(WORKTREES, safe);
  const branch = 'autopilot/' + safe;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(WORKTREES, { recursive: true });
    const hasBranch = git(['rev-parse', '--verify', branch], ROOT).status === 0;
    const r = git(hasBranch ? ['worktree', 'add', dir, branch] : ['worktree', 'add', '-b', branch, dir, 'main'], ROOT);
    if (r.status !== 0) throw new Error('worktree: ' + r.stderr);
    const nm = path.join(dir, 'node_modules');
    if (!fs.existsSync(nm) && fs.existsSync(path.join(ROOT, 'node_modules'))) {
      fs.symlinkSync(path.join(ROOT, 'node_modules'), nm, 'junction');
    }
  }
  return { dir, branch };
}

function runClaude(prompt, sessionId, cwd) {
  return new Promise((resolve) => {
    const args = ['-p', '--output-format', 'json', '--permission-mode', 'acceptEdits',
      '--append-system-prompt-file', RULES, '--allowedTools', ...ALLOWED_TOOLS];
    if (sessionId) args.push('--resume', sessionId);
    const child = spawn(CLAUDE, args, { cwd, windowsHide: true });
    let out = '', err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => resolve({ code: -1, out, err: String(e) }));
    child.on('close', (code) => resolve({ code, out, err }));
    child.stdin.end(prompt);
  });
}

function check(cmd, cwd) {
  const r = spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', timeout: 900000 });
  return { ok: r.status === 0, tail: ((r.stdout || '') + (r.stderr || '')).slice(-1500) };
}

async function execute(job) {
  const base = { taskId: job.taskId, attempts: job.attempts || 0, sessionId: job.sessionId || '' };
  try {
    const { dir, branch } = ensureWorktree(job.taskId);
    base.branch = branch;
    const r = await runClaude(job.prompt, job.sessionId, dir);
    let parsed = null;
    try { parsed = JSON.parse(r.out); } catch (e) { /* non-JSON output handled below */ }
    const text = (parsed && parsed.result) || r.out || r.err || '';
    if (parsed && parsed.session_id) base.sessionId = parsed.session_id;
    if (!parsed || parsed.is_error || r.code !== 0) {
      if (QUOTA_RE.test(text + r.err)) return { ...base, status: 'quota', waitMinutes: 30, message: text.slice(0, 400) };
      return { ...base, status: 'error', message: (text || r.err).slice(0, 800) };
    }
    const m = text.match(/AUTOPILOT_DECISION_BEGIN\s*([\s\S]*?)\s*AUTOPILOT_DECISION_END/);
    if (m) {
      let decision;
      try { decision = JSON.parse(m[1]); } catch (e) { decision = { question: m[1], options: [], recommended: '' }; }
      return { ...base, status: 'decision', decision, summary: text.slice(0, 600) };
    }
    const v = check('npm run verify', dir);
    const t = v.ok ? check('npm test', dir) : { ok: false, tail: '' };
    if (!v.ok || !t.ok) {
      return { ...base, status: 'failed_checks', message: ((v.ok ? '' : 'verify:\n' + v.tail) + (t.ok ? '' : '\ntest:\n' + t.tail)).slice(-1800) };
    }
    return { ...base, status: 'done', summary: text.slice(0, 800) };
  } catch (e) {
    return { ...base, status: 'error', message: String(e.message || e) };
  }
}

function notify(title, message, url) {
  const esc = (s) => String(s || '').replace(/[<>&"']/g, ' ').slice(0, 250);
  const ps = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
$x = New-Object Windows.Data.Xml.Dom.XmlDocument
$x.LoadXml('<toast ${url ? `activationType="protocol" launch="${esc(url)}"` : ''}><visual><binding template="ToastGeneric"><text>${esc(title)}</text><text>${esc(message)}</text></binding></visual></toast>')
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Autopilot').Show([Windows.UI.Notifications.ToastNotification]::new($x))`;
  spawn('powershell', ['-NoProfile', '-Command', ps], { windowsHide: true });
  fs.writeFileSync(path.join(__dirname, 'LATEST_NOTIFICATION.txt'), `${new Date().toISOString()}\n${title}\n${message}\n${url || ''}\n`);
}

const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
const body = (req) => new Promise((ok) => { let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch (e) { ok({}); } }); });

http.createServer(async (req, res) => {
  const given = Buffer.from(String(req.headers['x-autopilot-token'] || ''));
  const want = Buffer.from(TOKEN);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return send(res, 401, { error: 'unauthorized' });
  const url = req.url.split('?')[0];
  try {
    if (req.method === 'GET' && url === '/health') return send(res, 200, { ok: true });
    if (req.method === 'GET' && url === '/queue/next') {
      const q = readQueue();
      const t = q.find((x) => x.status === 'pending');
      if (t) { t.status = 'running'; writeQueue(q); }
      return send(res, 200, { task: t || null });
    }
    const m = url.match(/^\/queue\/([^/]+)\/(done|blocked)$/);
    if (req.method === 'POST' && m) {
      const q = readQueue();
      const t = q.find((x) => x.id === decodeURIComponent(m[1]));
      if (t) { t.status = m[2]; writeQueue(q); }
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url === '/notify') {
      const b = await body(req);
      notify(b.title, b.message, b.url);
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url === '/run') {
      const job = await body(req);
      if (!job.taskId || !job.prompt || !job.callbackUrl) return send(res, 400, { error: 'taskId, prompt, callbackUrl required' });
      const jobId = crypto.randomUUID();
      send(res, 202, { jobId });
      execute(job).then(async (result) => {
        fs.writeFileSync(path.join(RUNS, jobId + '.json'), JSON.stringify({ job, result }, null, 2));
        await new Promise((r) => setTimeout(r, 2500)); // 讓 n8n 先進入 Wait 節點
        try {
          await fetch(job.callbackUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) });
        } catch (e) { console.error('callback failed', e.message); }
      });
      return;
    }
    return send(res, 404, { error: 'not found' });
  } catch (e) {
    return send(res, 500, { error: String(e.message || e) });
  }
}).listen(PORT, '0.0.0.0', () => console.log('Autopilot bridge listening on :' + PORT));
