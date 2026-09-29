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

async function listUsers(url, serviceKey, fetchImpl) {
  const users = [];
  for (let page = 1; page < 100; page++) {
    const res = await fetchImpl(url + "/auth/v1/admin/users?page=" + page + "&per_page=200", {
      headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey }
    });
    if (!res.ok) { throw new Error("listing users failed: HTTP " + res.status + " " + (await res.text())); }
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
      results.push({ key: key, email: email, status: "missing", detail: "no such account — nothing changed" });
      continue;
    }
    if (options.dryRun) {
      results.push({ key: key, email: email, status: "would-update", detail: "user id " + user.id });
      continue;
    }
    const res = await fetchImpl(options.url + "/auth/v1/admin/users/" + encodeURIComponent(user.id), {
      method: "PUT",
      headers: { apikey: options.serviceKey, Authorization: "Bearer " + options.serviceKey, "Content-Type": "application/json" },
      body: JSON.stringify({ password: options.passwords[key] })
    });
    results.push(res.ok
      ? { key: key, email: email, status: "updated", detail: "user id " + user.id + " (unchanged)" }
      : { key: key, email: email, status: "failed", detail: "HTTP " + res.status + " " + (await res.text()) });
  }
  return results;
}

async function main(argv) {
  const fileIdx = argv.indexOf("--file");
  if (fileIdx === -1 || !argv[fileIdx + 1]) {
    console.error("Usage: SUPABASE_SERVICE_ROLE_KEY=... node scripts/maintenance/SetAccountPasswords.js --file <passwords.json> [--dry-run]");
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
    dryRun: argv.indexOf("--dry-run") !== -1
  });
  results.forEach(function (r) { console.log(r.status.padEnd(12) + " " + r.email + " — " + r.detail); });
  return results.some(function (r) { return r.status === "failed" || r.status === "missing"; }) ? 1 : 0;
}

if (require.main === module) {
  main(process.argv.slice(2)).then(function (code) { process.exit(code); }, function (err) {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { setPasswords: setPasswords, validatePasswords: validatePasswords, EMAIL_DOMAIN: EMAIL_DOMAIN };
