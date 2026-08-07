/* js/repository/AuthRepository.js — Sprint AI-126B Part 2, Task 2.

   Real Authentication ON TOP OF login.html's existing, completely
   unmodified 3-step picker (選擇學生→選擇學校→選擇學期 —
   js/pages/AppLogin.js has no email/password field anywhere, by design,
   per Sprint AI-119's own Login Flow). "真實 Email Login" + "保持目前
   Login UI" only reconcile one way: each fixed mock_student_key
   (student_a/student_b/admin — js/data/WorkspaceData.js) maps to one
   real, persistent Supabase Auth account via a DETERMINISTIC, invisible
   email/password — clicking a student's own picker card silently signs
   that same real account in every time (sign up once, sign in ever
   after), with zero visible UI change. This is the exact "User Mapping"
   supabase/migrations/20260807000002_reference_tables.sql's own header
   already documents: "mock_student_key is login.html's existing,
   unmodified picker key ... mapped 1:1 to a real, persistent auth
   user_id."

   This is NOT a real secret — the whole point of this platform's
   picker is that there is no real credential a user enters, so a
   deterministic, publicly-derivable password provides zero additional
   secrecy over the picker itself. Real access control is RLS
   (auth.uid() = user_id on every private table), not this password.

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

  function deterministicCredentials(mockStudentKey) {
    return {
      email: mockStudentKey + "@" + EMAIL_DOMAIN,
      password: "Ahs126B$" + mockStudentKey
    };
  }

  /* loginForMockStudent(student) — student is one of
     AHS.WorkspaceRuntime.students()'s own real entries ({id, name,
     role}). Signs in the matching deterministic account; signs it up
     first if this is the very first time this mock student has ever
     "logged in" for real. Then ensures (find-or-create, RLS owner-
     scoped) that account's own student_profiles row exists — the real
     row every other Repository (WrongBook/KnowledgeMastery/Statistics/
     Settings) resolves student_profile_id/user_id from. */
  function loginForMockStudent(student) {
    if (!student || !student.id) { return Promise.resolve({ skipped: true, reason: "no student" }); }
    if (!AHS.SupabaseClient || !AHS.SupabaseClient.isConfigured()) {
      return Promise.resolve({ skipped: true, reason: "not-configured" });
    }
    var creds = deterministicCredentials(student.id);
    return AHS.SupabaseClient.signInWithPassword(creds.email, creds.password).then(function (loginResult) {
      if (!loginResult.error) { return loginResult; }
      return AHS.SupabaseClient.signUp(creds.email, creds.password);
    }).then(function (result) {
      if (result.error || !result.data || !result.data.access_token) {
        return { skipped: false, error: result.error || { message: "no session issued (Auth email confirmation may be enabled on this project)" } };
      }
      return ensureOwnProfile(student).then(function (profileResult) {
        return { skipped: false, session: result.data, profile: profileResult };
      });
    }).catch(function (err) {
      return { skipped: false, error: { message: String(err && err.message || err) } };
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
        if (AHS.SyncBridge) { AHS.SyncBridge.cacheIdentity(userId, readResult.data[0].id); }
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
        if (AHS.SyncBridge) { AHS.SyncBridge.cacheIdentity(userId, insertResult.data[0].id); }
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
    loginForMockStudent: loginForMockStudent,
    ensureOwnProfile: ensureOwnProfile,
    logout: logout,
    getSession: getSession
  };
})();
