/* scripts/maintenance/SetAccountPasswords.js — 2026-09-29 login security fix.

   Sets the real Supabase Auth password of the platform's existing
   accounts (<mock_student_key>@ahs-mock.local — see
   js/repository/AuthRepository.js). Until 2026-09-29 those passwords were
   derived in public browser code, so anyone could sign in as any student.
   Run this BEFORE deploying the login fix, then give each student their
   new password.

   What it changes: ONLY the `password` field of accounts that already
   exist. It never creates or deletes an account, never changes an email
   or a user id, and never touches a single data row — every student's
   WrongBook/exam/progress rows stay attached to the same auth user id.

   Requires the project's service-role key, which must never be committed
   or used in the browser. Run it locally:

     SUPABASE_SERVICE_ROLE_KEY=... node scripts/maintenance/SetAccountPasswords.js --file <passwords.json>
     SUPABASE_SERVICE_ROLE_KEY=... node scripts/maintenance/SetAccountPasswords.js --file <passwords.json> --dry-run
     SUPABASE_SERVICE_ROLE_KEY=... node scripts/maintenance/SetAccountPasswords.js --file <passwords.json> --create-missing
   (--create-missing: also create accounts that have never existed — never
   touches an existing account or any data row)

   <passwords.json> maps mock_student_key -> new password, e.g.
     { "student_a": "…", "student_c": "…", "admin": "…" }
   Keep that file outside the repository (or name it *.passwords.json,
   which .gitignore excludes) and delete it afterwards.

   SUPABASE_URL defaults to the url in js/data/SupabaseConfig.js. */
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
const EMAIL_DOMAIN = "ahs-mock.local";
const MIN_PASSWORD_LENGTH = 8;

function defaultSupabaseUrl() {
  const src = fs.readFileSync(path.join(REPO, "js", "data", "SupabaseConfig.js"), "utf8");
  const m = src.match(/url:\s*"([^"]+)"/);
  return m ? m[1] : "";
}

function validatePasswords(passwords) {
  const problems = [];
  const keys = Object.keys(passwords || {});
  if (!keys.length) { problems.push("no accounts listed"); }
  keys.forEach(function (key) {
    const pw = passwords[key];
    if (!/^[a-z0-9_]+$/.test(key)) { problems.push(key + ": not a valid mock_student_key"); }
    if (typeof pw !== "string" || pw.length < MIN_PASSWORD_LENGTH) {
      problems.push(key + ": password must be at least " + MIN_PASSWORD_LENGTH + " characters");
    }
    if (pw === "1234" || /^Ahs126B\$/.test(String(pw))) {
      problems.push(key + ": must not reuse the old public password");
    }
  });
  return problems;
}

/* Legacy service_role keys are JWTs and go in both headers. The newer
   sb_secret_… keys are not JWTs and are rejected as a Bearer token, so
   they are sent in the apikey header only. */
function authHeaders(serviceKey) {
  const h = { apikey: serviceKey };
  if (/^eyJ/.test(serviceKey)) { h.Authorization = "Bearer " + serviceKey; }
  return h;
}

/* describeKey(key, url) — explains a 401 without ever printing the key:
   its kind (secret / publishable / legacy JWT role) and, for a JWT, which
   project it belongs to (the project ref is public — it is in the URL). */
function describeKey(serviceKey, url) {
  const key = String(serviceKey || "");
  const notes = [];
  if (key !== key.trim()) { notes.push("金鑰前後有空白或換行"); }
  if (/^["']|["']$/.test(key.trim())) { notes.push("金鑰含引號，請只貼金鑰本身"); }
  const k = key.trim().replace(/^["']|["']$/g, "");
  const projectRef = (/^https:\/\/([a-z0-9]+)\.supabase\.co/.exec(url || "") || [])[1];
  if (/^sb_publishable_/.test(k)) {
    notes.push("這是 publishable 金鑰（公開金鑰），請改用 secret 金鑰");
  } else if (/^sb_secret_/.test(k)) {
    notes.push("金鑰種類：secret（正確種類）。仍被拒絕代表它不屬於專案 " + projectRef + "，或複製不完整");
  } else if (/^eyJ/.test(k)) {
    try {
      const payload = JSON.parse(Buffer.from(k.split(".")[1], "base64url").toString("utf8"));
      notes.push("金鑰種類：舊版 JWT，role = " + payload.role + "，所屬專案 = " + payload.ref);
      if (payload.role !== "service_role") { notes.push("role 不是 service_role，請改用 service_role 金鑰"); }
      if (projectRef && payload.ref && payload.ref !== projectRef) {
        notes.push("這把金鑰屬於另一個專案（" + payload.ref + "），平台使用的是 " + projectRef);
      }
    } catch (e) { notes.push("JWT 格式不完整，可能複製時被截斷"); }
  } else {
    notes.push("無法辨識的金鑰格式（應以 sb_secret_ 或 eyJ 開頭）");
  }
  return notes.join("；");
}

async function listUsers(url, serviceKey, fetchImpl) {
  const users = [];
  for (let page = 1; page < 100; page++) {
    const res = await fetchImpl(url + "/auth/v1/admin/users?page=" + page + "&per_page=200", {
      headers: authHeaders(serviceKey)
    });
    if (!res.ok) {
      const hint = res.status === 401 || res.status === 403 ? "\n金鑰檢查：" + describeKey(serviceKey, url) : "";
      throw new Error("listing users failed: HTTP " + res.status + " " + (await res.text()) + hint + "\n沒有修改任何帳號。");
    }
    const body = await res.json();
    const batch = Array.isArray(body) ? body : (body.users || []);
    users.push.apply(users, batch);
    if (batch.length < 200) { break; }
  }
  return users;
}

/* setPasswords({ url, serviceKey, passwords, dryRun, fetchImpl }) —
   returns [{ key, email, status: "updated"|"would-update"|"missing"|"failed", detail }]. */
async function setPasswords(options) {
  const fetchImpl = options.fetchImpl || fetch;
  const problems = validatePasswords(options.passwords);
  if (problems.length) { throw new Error("invalid passwords file:\n  " + problems.join("\n  ")); }
  if (!options.url) { throw new Error("SUPABASE_URL is not set and js/data/SupabaseConfig.js has no url"); }
  if (!options.serviceKey) { throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set"); }

  const users = await listUsers(options.url, options.serviceKey, fetchImpl);
  const results = [];
  for (const key of Object.keys(options.passwords)) {
    const email = key + "@" + EMAIL_DOMAIN;
    const user = users.find(function (u) { return String(u.email || "").toLowerCase() === email; });
    if (!user) {
      /* --create-missing: an account that never signed in under the old
         auto-sign-up flow has no auth user at all. Creating it adds a new,
         empty account (email pre-confirmed); its student_profiles row is
         created by AuthRepository.ensureOwnProfile() on first login. It
         cannot touch any existing account or data row. */
      if (!options.createMissing) {
        results.push({ key: key, email: email, status: "missing", detail: "no such account — nothing changed (use --create-missing to create it)" });
        continue;
      }
      if (options.dryRun) {
        results.push({ key: key, email: email, status: "would-create", detail: "new account" });
        continue;
      }
      const created = await fetchImpl(options.url + "/auth/v1/admin/users", {
        method: "POST",
        headers: Object.assign(authHeaders(options.serviceKey), { "Content-Type": "application/json" }),
        body: JSON.stringify({ email: email, password: options.passwords[key], email_confirm: true })
      });
      const createdBody = created.ok ? await created.json() : null;
      results.push(created.ok
        ? { key: key, email: email, status: "created", detail: "user id " + (createdBody && createdBody.id) }
        : { key: key, email: email, status: "failed", detail: "HTTP " + created.status + " " + (await created.text()) });
      continue;
    }
    if (options.dryRun) {
      results.push({ key: key, email: email, status: "would-update", detail: "user id " + user.id });
      continue;
    }
    const res = await fetchImpl(options.url + "/auth/v1/admin/users/" + encodeURIComponent(user.id), {
      method: "PUT",
      headers: Object.assign(authHeaders(options.serviceKey), { "Content-Type": "application/json" }),
      body: JSON.stringify({ password: options.passwords[key] })
    });
    results.push(res.ok
      ? { key: key, email: email, status: "updated", detail: "user id " + user.id + " (unchanged)" }
      : { key: key, email: email, status: "failed", detail: "HTTP " + res.status + " " + (await res.text()) });
  }
  /* Other platform accounts in the project (only @ahs-mock.local — no
     real person's email), so a dry run shows e.g. an old student_b account
     before anyone creates a duplicate. */
  const listed = Object.keys(options.passwords).map(function (k) { return k + "@" + EMAIL_DOMAIN; });
  results.others = users
    .map(function (u) { return String(u.email || "").toLowerCase(); })
    .filter(function (e) { return e.endsWith("@" + EMAIL_DOMAIN) && listed.indexOf(e) === -1; });
  return results;
}

async function main(argv) {
  const fileIdx = argv.indexOf("--file");
  if (fileIdx === -1 || !argv[fileIdx + 1]) {
    console.error("Usage: SUPABASE_SERVICE_ROLE_KEY=... node scripts/maintenance/SetAccountPasswords.js --file <passwords.json> [--dry-run] [--create-missing]");
    return 2;
  }
  let passwords;
  try {
    // Notepad may save UTF-8 with a BOM; strip it before parsing.
    passwords = JSON.parse(fs.readFileSync(argv[fileIdx + 1], "utf8").replace(/^﻿/, ""));
  } catch (err) {
    // Never echo the file contents — they are real passwords.
    console.error("密碼檔不是正確的 JSON（" + err.message.replace(/"[^"]*"/g, '"…"') + "）。\n" +
      "格式必須是：{ \"admin\": \"…\", \"student_a\": \"…\", \"student_c\": \"…\" }\n" +
      "請確認：最外層有 { }、引號與冒號都是半形、最後一項後面沒有逗號。沒有修改任何帳號。");
    return 2;
  }
  const results = await setPasswords({
    url: process.env.SUPABASE_URL || defaultSupabaseUrl(),
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    passwords: passwords,
    dryRun: argv.indexOf("--dry-run") !== -1,
    createMissing: argv.indexOf("--create-missing") !== -1
  });
  results.forEach(function (r) { console.log(r.status.padEnd(12) + " " + r.email + " — " + r.detail); });
  console.log("其他平台帳號（不在密碼檔內，不會變動）：" + (results.others.length ? results.others.join("、") : "無"));
  return results.some(function (r) { return r.status === "failed" || r.status === "missing"; }) ? 1 : 0;
}

if (require.main === module) {
  /* exitCode instead of process.exit(): exiting while fetch's keep-alive
     socket is still closing trips a libuv assertion on Windows
     ("Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)"). */
  main(process.argv.slice(2)).then(function (code) { process.exitCode = code; }, function (err) {
    console.error(err.message);
    process.exitCode = 1;
  });
}

module.exports = { setPasswords: setPasswords, validatePasswords: validatePasswords, describeKey: describeKey, authHeaders: authHeaders, EMAIL_DOMAIN: EMAIL_DOMAIN };
