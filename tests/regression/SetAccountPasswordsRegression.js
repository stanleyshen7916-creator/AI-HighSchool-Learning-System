/* tests/regression/SetAccountPasswordsRegression.js — 2026-09-29 login
   security fix. scripts/maintenance/SetAccountPasswords.js runs against
   the live Supabase project with the service-role key, so its "only the
   password of existing accounts changes" promise is verified here with a
   recording fake fetch: no account is ever created or deleted, no email
   or id changes, weak/old passwords are refused before any request.

   Run: node tests/regression/SetAccountPasswordsRegression.js */
"use strict";
const path = require("path");
const { setPasswords, validatePasswords } = require(path.join(__dirname, "..", "..", "scripts", "maintenance", "SetAccountPasswords.js"));

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

const USERS = [
  { id: "uid-a", email: "student_a@ahs-mock.local" },
  { id: "uid-c", email: "student_c@ahs-mock.local" },
  { id: "uid-admin", email: "admin@ahs-mock.local" }
];

function fakeFetch(log) {
  return function (url, init) {
    const method = (init && init.method) || "GET";
    log.push({ url: url, method: method, body: init && init.body ? JSON.parse(init.body) : null });
    const reply = method === "GET" ? { users: USERS } : {};
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(reply), text: () => Promise.resolve(JSON.stringify(reply)) });
  };
}

async function main() {
  console.log("SetAccountPasswords Regression");

  console.log("\n[1] 密碼檢核 — 太短、舊的公開密碼皆拒絕，且在送出任何請求前就拒絕");
  check("拒絕 < 8 字元", validatePasswords({ student_a: "short" }).length === 1);
  check("拒絕舊的本機密碼 1234", validatePasswords({ student_a: "1234" }).length >= 1);
  check("拒絕舊的推算密碼 Ahs126B$…", validatePasswords({ student_a: "Ahs126B$student_a" }).length === 1);
  check("拒絕空清單", validatePasswords({}).length === 1);
  check("接受合格密碼", validatePasswords({ student_a: "Strong-Passw0rd" }).length === 0);
  {
    const log = [];
    let threw = false;
    try {
      await setPasswords({ url: "https://x.supabase.co", serviceKey: "k", passwords: { student_a: "1234" }, fetchImpl: fakeFetch(log) });
    } catch (e) { threw = true; }
    check("不合格時直接拋錯", threw);
    check("不合格時完全沒有發出任何請求", log.length === 0);
  }

  console.log("\n[2] 實際更新 — 只對既有帳號 PUT { password }，不建立、不刪除、不改 email");
  {
    const log = [];
    const results = await setPasswords({
      url: "https://x.supabase.co", serviceKey: "k",
      passwords: { student_a: "New-Pass-A1", admin: "New-Pass-Admin1", ghost: "New-Pass-Ghost1" },
      fetchImpl: fakeFetch(log)
    });
    const writes = log.filter((c) => c.method !== "GET");
    check("只有 2 個寫入請求（student_a、admin）", writes.length === 2);
    check("寫入全部是 PUT /auth/v1/admin/users/<既有 id>",
      writes.every((w) => w.method === "PUT" && /\/auth\/v1\/admin\/users\/uid-(a|admin)$/.test(w.url)));
    check("寫入內容只有 password 欄位",
      writes.every((w) => Object.keys(w.body).length === 1 && typeof w.body.password === "string"));
    check("沒有任何 POST／DELETE（不建立、不刪除帳號）", log.every((c) => c.method === "GET" || c.method === "PUT"));
    check("沒有觸碰任何 /rest/v1 資料表", log.every((c) => c.url.indexOf("/rest/v1") === -1));
    const ghost = results.find((r) => r.key === "ghost");
    check("不存在的帳號回報 missing 且不會被建立", ghost && ghost.status === "missing");
  }

  console.log("\n[3] --dry-run — 只列出，不寫入");
  {
    const log = [];
    const results = await setPasswords({
      url: "https://x.supabase.co", serviceKey: "k", dryRun: true,
      passwords: { student_c: "New-Pass-C1" }, fetchImpl: fakeFetch(log)
    });
    check("dry-run 只有 GET", log.every((c) => c.method === "GET"));
    check("dry-run 回報 would-update", results[0].status === "would-update");
  }

  console.log("\n[4] --create-missing — 只替不存在的帳號新建，既有帳號照常只改密碼");
  {
    const log = [];
    const results = await setPasswords({
      url: "https://x.supabase.co", serviceKey: "k", createMissing: true,
      passwords: { student_a: "New-Pass-A1", ghost: "New-Pass-Ghost1" }, fetchImpl: fakeFetch(log)
    });
    const posts = log.filter((c) => c.method === "POST");
    check("只 POST 一次（ghost）", posts.length === 1 && /\/auth\/v1\/admin\/users$/.test(posts[0].url));
    check("新帳號 email 正確且已確認", posts[0].body.email === "ghost@ahs-mock.local" && posts[0].body.email_confirm === true);
    check("既有帳號仍只 PUT 密碼", log.filter((c) => c.method === "PUT").length === 1);
    check("沒有任何 DELETE 或 /rest/v1", log.every((c) => c.method !== "DELETE" && c.url.indexOf("/rest/v1") === -1));
    check("回報 created", results.find((r) => r.key === "ghost").status === "created");
    check("列出密碼檔以外的平台帳號", results.others.join(",") === "student_c@ahs-mock.local,admin@ahs-mock.local");
  }
  {
    const log = [];
    const results = await setPasswords({
      url: "https://x.supabase.co", serviceKey: "k", createMissing: true, dryRun: true,
      passwords: { ghost: "New-Pass-Ghost1" }, fetchImpl: fakeFetch(log)
    });
    check("dry-run + create-missing 只有 GET，回報 would-create", log.every((c) => c.method === "GET") && results[0].status === "would-create");
  }

  console.log("\nSetAccountPasswordsRegression: " + pass + " PASS / " + fail + " FAIL");
  if (fail > 0) { process.exit(1); }
}

main().catch(function (err) {
  console.log("  FAIL  unexpected error: " + (err && err.stack || err));
  process.exit(1);
});
