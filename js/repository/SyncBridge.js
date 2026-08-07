/* js/repository/SyncBridge.js — Sprint AI-126B Part 2, Tasks 3-7.

   Small, shared helper every Runtime's Supabase sync glue reuses —
   deliberately NOT a redesign of Repository.js/SupabaseRepository.js/
   RepositoryFactory.js (unchanged, per this Sprint's own "不得重新設計
   Repository"), just the identity/subject-lookup/error-handling code
   every domain integration would otherwise duplicate five times.

   Every Runtime's existing synchronous public API (list()/sync()/
   update()/...) is unchanged in signature and return value — pushes to
   Supabase are fire-and-forget background writes (pushFireAndForget),
   never awaited by a caller, never able to make an existing call throw
   or return something different than it does today. */
window.AHS = window.AHS || {};

(function () {
  "use strict";

  var IDENTITY_KEY = "supabase.identity";
  var subjectIdCache = null; /* { code: id, ... } — resolved lazily, once per page load */

  function isConfigured() {
    return !!(AHS.SupabaseClient && AHS.SupabaseClient.isConfigured());
  }

  /* identity() — { userId, studentProfileId } for the CURRENT real
     session, or null if not logged in / not configured / profile not
     yet resolved. Cached per real user_id (via AHS.PersistenceAdapter's
     *Global, non-Workspace-namespaced storage — a Supabase identity is
     a different concept from this app's Mock Workspace) so switching
     which real account is signed in never reuses a stale profile id. */
  function identity() {
    if (!isConfigured()) { return null; }
    var session = AHS.SupabaseClient.getSession();
    var userId = session && session.user && session.user.id;
    if (!userId) { return null; }
    var cached = (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.loadGlobal === "function")
      ? AHS.PersistenceAdapter.loadGlobal(IDENTITY_KEY) : null;
    if (cached && cached.userId === userId && cached.studentProfileId) {
      return { userId: userId, studentProfileId: cached.studentProfileId };
    }
    return null;
  }

  /* cacheIdentity(userId, studentProfileId) — called once by
     AHS.AuthRepository right after it resolves (find-or-creates) the
     signed-in account's own student_profiles row. */
  function cacheIdentity(userId, studentProfileId) {
    if (!AHS.PersistenceAdapter || typeof AHS.PersistenceAdapter.saveGlobal !== "function") { return; }
    AHS.PersistenceAdapter.saveGlobal(IDENTITY_KEY, { userId: userId, studentProfileId: studentProfileId });
  }

  /* subjectIdFor(code) — real subjects.id for a given subject code
     (e.g. "math"), resolved from the real, AI-126A-seeded subjects
     table (9 rows, all authenticated users can SELECT). Cached in
     memory for the lifetime of the current page (subjects never change
     within a session — re-resolved fresh on every page navigation,
     same "Runtime island" boundary every other Runtime already lives
     with). Returns null (never fabricates a fake id) if the code isn't
     a real seeded subject or the read fails. */
  function subjectIdFor(code) {
    if (!code || !isConfigured()) { return Promise.resolve(null); }
    if (subjectIdCache && Object.prototype.hasOwnProperty.call(subjectIdCache, code)) {
      return Promise.resolve(subjectIdCache[code]);
    }
    var repo = AHS.RepositoryFactory.create();
    return repo.read("subjects", "code=eq." + encodeURIComponent(code)).then(function (result) {
      subjectIdCache = subjectIdCache || {};
      var id = (!result.error && result.data && result.data[0]) ? result.data[0].id : null;
      subjectIdCache[code] = id;
      return id;
    }).catch(function () {
      return null;
    });
  }

  /* pushFireAndForget(promiseFactory) — runs promiseFactory() (expected
     to return a Repository call's Promise) and swallows any error to a
     console.warn, so a Supabase outage/misconfiguration never surfaces
     to (or breaks) the synchronous Runtime caller that triggered it. */
  function pushFireAndForget(promiseFactory) {
    try {
      var p = promiseFactory();
      if (p && typeof p.then === "function") {
        p.then(function (result) {
          if (result && result.error && window.console && console.warn) {
            console.warn("SyncBridge: background push failed —", result.error.message || result.error);
          }
        }).catch(function (err) {
          if (window.console && console.warn) { console.warn("SyncBridge: background push threw —", err); }
        });
      }
    } catch (err) {
      if (window.console && console.warn) { console.warn("SyncBridge: background push threw —", err); }
    }
  }

  AHS.SyncBridge = {
    isConfigured: isConfigured,
    identity: identity,
    cacheIdentity: cacheIdentity,
    subjectIdFor: subjectIdFor,
    pushFireAndForget: pushFireAndForget
  };
})();
