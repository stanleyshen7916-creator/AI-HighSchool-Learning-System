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
  var subjectCodeCache = null; /* { id: code, ... } — the reverse of subjectIdCache, same lazy-once-per-page-load cache discipline */

  /* Sprint AI-126E Task 1 (Runtime Mode Enable): "memory" mode disables
     every domain's background sync outright — every existing pushX()/
     pullFromRepository()/AHS.RepositorySync already gates on
     isConfigured() alone, so folding the mode check in here is the one,
     single integration point needed; nothing else changes. "hybrid" and
     "supabase" behave identically (see js/data/RuntimeModeConfig.js's own
     header for why a true async-only "supabase" mode would violate the
     AI-126C Architecture LOCK). */
  function isConfigured() {
    var mode = (AHS.RuntimeModeConfig && AHS.RuntimeModeConfig.mode) || "hybrid";
    if (mode === "memory") { return false; }
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

  /* subjectCodeFor(id) — Sprint AI-149（使用者需求：知識弱點的科目顯示為
     空白「科目」佔位字，選擇科目篩選時，資料時有時無）: the reverse of
     subjectIdFor() above. WrongBookRuntime.pullFromRepository() /
     KnowledgeMasteryRuntime.pullFromRepository() both merge real remote
     rows that only ever carry subject_id (a Supabase FK) — subjectIdFor()
     alone can resolve a local code -> real id for pushing, but nothing
     resolved a pulled row's real id back into this app's own local
     subject code ("math"／"biology"…), so every record that ever entered
     local state via a pull (a fresh device/session) was permanently
     stuck with subject "". Same real, AI-126A-seeded `subjects` table,
     same "cached in memory for the lifetime of the current page, re-
     resolved fresh on every page navigation" discipline as subjectIdFor()
     — never fabricates a code, returns null (never overwrites a real
     local value) if the id isn't a real seeded subject or the read
     fails. */
  function subjectCodeFor(id) {
    if (!id || !isConfigured()) { return Promise.resolve(null); }
    if (subjectCodeCache && Object.prototype.hasOwnProperty.call(subjectCodeCache, id)) {
      return Promise.resolve(subjectCodeCache[id]);
    }
    var repo = AHS.RepositoryFactory.create();
    return repo.read("subjects", "id=eq." + encodeURIComponent(id)).then(function (result) {
      subjectCodeCache = subjectCodeCache || {};
      var code = (!result.error && result.data && result.data[0]) ? result.data[0].code : null;
      subjectCodeCache[id] = code;
      return code;
    }).catch(function () {
      return null;
    });
  }

  /* --- Sprint AI-126E Task 5 (Offline Queue) ---------------------------
     In-memory only (a promiseFactory closure cannot be serialized to
     sessionStorage) — a retry buffer for this page's own lifetime, not a
     durable cross-reload queue. This does NOT put real user data at risk
     ("不得造成資料遺失"): every existing pushX() already writes its real
     value into the synchronous Memory Cache first (js/runtime/*.js,
     unchanged) — that Memory Cache, not this queue, is this app's
     durable local record; losing a still-queued retry on a hard reload
     before it flushes only delays the background Supabase sync, exactly
     as the very next real edit to that same record (which re-pushes
     current state) or the next real AHS.RepositorySync pull-hydrated
     page load would naturally re-attempt anyway. Capped so a long
     outage can't grow this without bound. */
  var MAX_QUEUE = 100;
  var MAX_ATTEMPTS = 5;
  var offlineQueue = [];

  /* isNetworkError(result) — distinguishes "the request never reached a
     server" (network down/DNS/CORS — AHS.SupabaseClient's own catch()
     blocks produce exactly this shape, no `status` field) from a real
     server response (RLS 403, validation 400, etc. — always carries
     `status`). Only the former is queued for retry; a real rejection
     retrying wouldn't fix is reported once and dropped, same as before
     this Sprint. */
  function isNetworkError(result) {
    return !!(result && result.error && !result.error.status);
  }

  function isAuthExpired(result) {
    return !!(result && result.error && result.error.status === 401);
  }

  /* flushQueue() — retries every still-queued push once. Fire-and-forget
     per entry (never awaited by the caller); a still-failing entry stays
     queued (attempts incremented) up to MAX_ATTEMPTS, then is dropped
     with a console.warn — the real data is never at risk (see header). */
  function flushQueue() {
    if (!offlineQueue.length) { return; }
    var pending = offlineQueue;
    offlineQueue = [];
    pending.forEach(function (entry) {
      var p;
      try { p = entry.promiseFactory(); } catch (err) { p = null; }
      if (!p || typeof p.then !== "function") { return; }
      p.then(function (result) {
        if (isNetworkError(result)) { requeue(entry); }
        else if (result && result.error && window.console && console.warn) {
          console.warn("SyncBridge: queued push failed (non-network, dropped) —", result.error.message || result.error);
        }
      }).catch(function () { requeue(entry); });
    });
  }

  function requeue(entry) {
    entry.attempts += 1;
    if (entry.attempts >= MAX_ATTEMPTS) {
      if (window.console && console.warn) { console.warn("SyncBridge: dropping queued push after " + MAX_ATTEMPTS + " failed attempts"); }
      return;
    }
    if (offlineQueue.length < MAX_QUEUE) { offlineQueue.push(entry); }
  }

  function queueSize() { return offlineQueue.length; }

  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("online", flushQueue);
  }

  /* pushFireAndForget(promiseFactory) — runs promiseFactory() (expected
     to return a Repository call's Promise) and swallows any error to a
     console.warn, so a Supabase outage/misconfiguration never surfaces
     to (or breaks) the synchronous Runtime caller that triggered it.
     Sprint AI-126E: a genuine network-level failure is queued for retry
     (Task 5) instead of being silently dropped forever; a 401 triggers
     one real session refresh attempt before falling back to the same
     honest console.warn (Task 2, Session Expire) — every existing
     caller's own contract (fire-and-forget, no return value relied on)
     is unchanged. */
  function pushFireAndForget(promiseFactory) {
    try {
      var p = promiseFactory();
      if (p && typeof p.then === "function") {
        p.then(function (result) {
          if (isAuthExpired(result) && AHS.SupabaseClient && typeof AHS.SupabaseClient.refreshSession === "function") {
            AHS.SupabaseClient.refreshSession().then(function (refreshResult) {
              if (!refreshResult.error) { pushFireAndForget(promiseFactory); }
              else if (window.console && console.warn) { console.warn("SyncBridge: session refresh failed, background push dropped —", refreshResult.error.message || refreshResult.error); }
            });
            return;
          }
          if (isNetworkError(result)) {
            offlineQueue.push({ promiseFactory: promiseFactory, attempts: 0 });
            if (offlineQueue.length > MAX_QUEUE) { offlineQueue.shift(); }
            return;
          }
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
    subjectCodeFor: subjectCodeFor,
    pushFireAndForget: pushFireAndForget,
    flushQueue: flushQueue,
    queueSize: queueSize
  };
})();
