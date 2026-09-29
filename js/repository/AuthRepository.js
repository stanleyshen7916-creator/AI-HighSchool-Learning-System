/* js/repository/AuthRepository.js — Sprint AI-126B Part 2, Task 2.

   Real Authentication behind login.html's picker (選擇學生→選擇學校→
   選擇學期→輸入密碼). Each fixed mock_student_key (student_a/student_c/
   admin — js/data/WorkspaceData.js) maps 1:1 to one real, persistent
   Supabase Auth account, <key>@ahs-mock.local — the "User Mapping"
   supabase/migrations/20260807000002_reference_tables.sql documents.

   2026-09-29 security fix: the password used to be derived in this file
   ("Ahs126B$" + key), so anyone reading the page source could sign in
   as any student and read/write their private rows — RLS only proves
   "you are this account", and every account's credentials were public.
   The password is now the one the user types on login.html's 輸入密碼
   step, sent straight to Supabase Auth and never stored or compared in
   the browser. Account passwords are set by the Project Owner with
   scripts/maintenance/SetAccountPasswords.js (service-role key, run
   locally). The sign-up fallback is gone too: an unknown or wrong
   password is simply a failed login, never a new account. The existing
   accounts, their auth.users ids and every data row keyed on them are
   unchanged.

   Architecture Decision (Project Owner, 2026-08-07, LOCK): Student =
   User = Profile — no second Student->Email mapping layer. The email/
   password pair here is pure plumbing to obtain a real Supabase
   auth.users.id (Supabase Auth has no sign-in method that skips a
   credential entirely) — it is not a second identity concept a caller
   ever sees or reasons about. The one real, permanent identifier every
   domain (Learning Progress/WrongBook/Knowledge Mastery/Statistics/
   Settings) associates with is student_profiles.user_id, resolved once
   here via ensureOwnProfile() and reused everywhere via
   AHS.SyncBridge.identity(). A future Email/Google/AI Tutor login would
   only ever change how this file obtains that same real user_id — the
   data model (student_profiles.user_id as the sole identity every table
   hangs off) never changes.

   Every function below is a no-op (returns { skipped: true }) whenever
   AHS.SupabaseClient isn't configured — preserves today's exact login
   behavior until the Project Owner supplies real SUPABASE_URL/
   SUPABASE_ANON_KEY. */
window.AHS = window.AHS || {};

(function () {
  "use strict";

  var EMAIL_DOMAIN = "ahs-mock.local";

  function accountEmail(mockStudentKey) {
    return mockStudentKey + "@" + EMAIL_DOMAIN;
  }

  function isConfigured() {
    return !!(AHS.SupabaseClient && AHS.SupabaseClient.isConfigured());
  }

  /* login(student, password) — student is one of
     AHS.WorkspaceRuntime.students()'s own entries ({id, name, role});
     password is exactly what the user typed. Signs in that student's
     existing account, then ensures (find-or-create, RLS owner-scoped) its
     own student_profiles row exists — the row every other Repository
     (WrongBook/KnowledgeMastery/Statistics/Settings) resolves
     student_profile_id/user_id from. Always resolves:
       { skipped: true }                      Supabase not configured
       { ok: true, session, profile }         signed in
       { ok: false, reason: "credentials" }   Supabase rejected the password
       { ok: false, reason: "network", error } could not reach Supabase */
  function login(student, password) {
    if (!student || !student.id) { return Promise.resolve({ ok: false, reason: "credentials" }); }
    if (!isConfigured()) { return Promise.resolve({ skipped: true, reason: "not-configured" }); }
    if (!password) { return Promise.resolve({ ok: false, reason: "credentials" }); }
    return AHS.SupabaseClient.signInWithPassword(accountEmail(student.id), password).then(function (result) {
      if (result.error || !result.data || !result.data.access_token) {
        var status = result.error && result.error.status;
        /* 400/401/422 are Supabase Auth's "invalid login credentials"
           family; anything without an HTTP status is a fetch failure. */
        var reason = status >= 400 && status < 500 ? "credentials" : "network";
        return { ok: false, reason: reason, error: result.error || null };
      }
      return ensureOwnProfile(student).then(function (profileResult) {
        return { ok: true, session: result.data, profile: profileResult };
      });
    }).catch(function (err) {
      return { ok: false, reason: "network", error: { message: String(err && err.message || err) } };
    });
  }

  /* ensureOwnProfile(student) — find-or-create THIS (already-logged-in)
     account's own student_profiles row. RLS (auth.uid() = user_id) means
     this can only ever see/create the caller's own row — never another
     mock student's, even though mock_student_key is globally unique. */
  function ensureOwnProfile(student) {
    var repo = AHS.RepositoryFactory.create();
    var session = repo.getSession();
    var userId = session && session.user && session.user.id;
    if (!userId) { return Promise.resolve({ error: { message: "no session" } }); }

    return repo.read("student_profiles", "user_id=eq." + userId).then(function (readResult) {
      if (readResult.error) { return readResult; }
      if (readResult.data && readResult.data.length) {
        if (AHS.SyncBridge) { AHS.SyncBridge.cacheIdentity(userId, readResult.data[0].id, student.id); }
        return { data: readResult.data[0], error: null };
      }
      return repo.insert("student_profiles", {
        user_id: userId,
        mock_student_key: student.id,
        display_name: student.name || "同學",
        grade: student.grade || "高中生",
        role: student.role === "ADMIN" ? "ADMIN" : "STUDENT"
      }).then(function (insertResult) {
        if (insertResult.error || !insertResult.data || !insertResult.data[0]) { return insertResult; }
        if (AHS.SyncBridge) { AHS.SyncBridge.cacheIdentity(userId, insertResult.data[0].id, student.id); }
        return { data: insertResult.data[0], error: null };
      });
    });
  }

  function logout() {
    if (!AHS.SupabaseClient || !AHS.SupabaseClient.isConfigured()) { return Promise.resolve({ skipped: true }); }
    return AHS.RepositoryFactory.create().logout();
  }

  function getSession() {
    if (!AHS.SupabaseClient) { return null; }
    return AHS.SupabaseClient.getSession();
  }

  AHS.AuthRepository = {
    login: login,
    isConfigured: isConfigured,
    accountEmail: accountEmail,
    ensureOwnProfile: ensureOwnProfile,
    logout: logout,
    getSession: getSession
  };
})();
