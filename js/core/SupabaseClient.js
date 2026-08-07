/* js/core/SupabaseClient.js — Sprint AI-126B Repository Foundation.

   The ONE module in this repository allowed to call fetch( — see
   CLAUDE.md's Project Overview and scripts/verify/VerifyForbiddenPatterns.js's
   AUTHORIZED_EXCEPTIONS for the PMO-authorized exception this file is.
   Talks to the real Supabase project (Auth + PostgREST) provisioned in
   Sprint AI-126A. Called ONLY by js/repository/SupabaseRepository.js —
   never by a Runtime, a page, or a UI file directly.

   Deliberately NOT the @supabase/supabase-js npm package: this project
   has no bundler and no build step (CLAUDE.md, "no framework, no
   bundler"), so a real npm dependency has nowhere to be bundled from
   without either adding a build step (a structural change this Sprint
   was not authorized to make) or vendoring a large third-party UMD
   bundle. Supabase's Auth and PostgREST APIs are plain HTTP/JSON — this
   file talks to the exact same endpoints supabase-js itself calls
   internally, hand-written with the native fetch(), keeping the
   project's "vanilla JS, zero dependencies" architecture intact.

   Session persistence uses AHS.PersistenceAdapter's *Global (non-
   Workspace-namespaced) methods — a Supabase session is a different
   identity concept from this app's existing Mock Student Workspace
   login, so it deliberately does not share that namespacing. Existing
   PersistenceAdapter code is unmodified; this file only calls its
   already-public saveGlobal/loadGlobal/removeGlobal. */
window.AHS = window.AHS || {};
AHS.SupabaseClient = (function () {
  "use strict";

  var SESSION_KEY = "supabase.session";

  /* Sprint AI-126B Final PAT: prefers AHS.SupabaseConfigLocal (set by the
     git-ignored js/data/SupabaseConfig.local.js — see that file's own
     header and js/data/SupabaseConfig.js's) whenever it exists and
     carries a real, non-empty url; otherwise falls back to the committed
     AHS.SupabaseConfig placeholder exactly as before. Every other
     function in this file is unchanged — this is the only place that
     reads either global. */
  function config() {
    if (AHS.SupabaseConfigLocal && AHS.SupabaseConfigLocal.url) {
      return AHS.SupabaseConfigLocal;
    }
    return (AHS.SupabaseConfig || { url: "", anonKey: "" });
  }

  function isConfigured() {
    var c = config();
    return !!(c.url && c.anonKey);
  }

  function session() {
    if (!AHS.PersistenceAdapter || typeof AHS.PersistenceAdapter.loadGlobal !== "function") { return null; }
    return AHS.PersistenceAdapter.loadGlobal(SESSION_KEY) || null;
  }

  function setSession(newSession) {
    if (!AHS.PersistenceAdapter) { return; }
    if (newSession) {
      AHS.PersistenceAdapter.saveGlobal(SESSION_KEY, newSession);
    } else {
      AHS.PersistenceAdapter.removeGlobal(SESSION_KEY);
    }
  }

  function baseHeaders(extra) {
    var c = config();
    var h = { "apikey": c.anonKey, "Content-Type": "application/json" };
    var s = session();
    h["Authorization"] = "Bearer " + (s && s.access_token ? s.access_token : c.anonKey);
    if (extra) { for (var k in extra) { if (extra.hasOwnProperty(k)) { h[k] = extra[k]; } } }
    return h;
  }

  function parseResponse(res) {
    return res.text().then(function (text) {
      var body = null;
      try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
      if (!res.ok) {
        var message = (body && (body.error_description || body.msg || body.message)) || ("HTTP " + res.status);
        return { data: null, error: { status: res.status, message: message, raw: body } };
      }
      return { data: body, error: null };
    });
  }

  function requireConfigured() {
    if (!isConfigured()) {
      return Promise.resolve({ data: null, error: { message: "AHS.SupabaseConfig.url/anonKey not set — Project Owner must supply real values before this client can connect." } });
    }
    return null;
  }

  /* --- Auth --- */

  /* signUp() is not part of the Repository interface's public contract
     (Task 3 only asked for Login/Logout/Session Restore) — it exists so
     the Repository Smoke Test (Task 4) can provision its own throwaway
     test account and prove real Connect/Login/CRUD end-to-end using
     only SUPABASE_URL/SUPABASE_ANON_KEY, without a separately-provisioned
     test user's credentials. */
  function signUp(email, password) {
    var guard = requireConfigured();
    if (guard) { return guard; }
    var c = config();
    return fetch(c.url + "/auth/v1/signup", {
      method: "POST",
      headers: { "apikey": c.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password })
    }).then(parseResponse).then(function (result) {
      if (!result.error && result.data && result.data.access_token) {
        setSession(result.data);
      }
      return result;
    }).catch(function (err) {
      return { data: null, error: { message: String(err && err.message || err) } };
    });
  }

  function signInWithPassword(email, password) {
    var guard = requireConfigured();
    if (guard) { return guard; }
    var c = config();
    return fetch(c.url + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { "apikey": c.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password })
    }).then(parseResponse).then(function (result) {
      if (!result.error && result.data && result.data.access_token) {
        setSession(result.data);
      }
      return result;
    }).catch(function (err) {
      return { data: null, error: { message: String(err && err.message || err) } };
    });
  }

  /* refreshSession() — Sprint AI-126E Task 2 (Session Expire). Supabase's
     own `/auth/v1/token?grant_type=password` response (already stored
     whole, unchanged, by setSession() above) carries a real
     `refresh_token` alongside `access_token` — this was already being
     persisted, just never used until now. Exchanges it for a fresh
     access_token via the same real Auth endpoint every other function
     here already uses. No-op (honest, real error) if there is no
     current session or it never had a refresh_token (e.g. this session
     predates this Sprint). Not part of the original Task 3 contract
     (Login/Logout/Session Restore) — purely additive, called by
     js/repository/SyncBridge.js's pushFireAndForget() on a real 401. */
  function refreshSession() {
    var guard = requireConfigured();
    if (guard) { return guard; }
    var c = config();
    var s = session();
    var refreshToken = s && s.refresh_token;
    if (!refreshToken) {
      return Promise.resolve({ data: null, error: { message: "No refresh_token on the current session — cannot refresh." } });
    }
    return fetch(c.url + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { "apikey": c.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken })
    }).then(parseResponse).then(function (result) {
      if (!result.error && result.data && result.data.access_token) {
        setSession(result.data);
      }
      return result;
    }).catch(function (err) {
      return { data: null, error: { message: String(err && err.message || err) } };
    });
  }

  function signOut() {
    var c = config();
    var s = session();
    if (!isConfigured() || !s) { setSession(null); return Promise.resolve({ data: null, error: null }); }
    return fetch(c.url + "/auth/v1/logout", {
      method: "POST",
      headers: baseHeaders()
    }).then(function () {
      setSession(null);
      return { data: null, error: null };
    }).catch(function (err) {
      setSession(null);
      return { data: null, error: { message: String(err && err.message || err) } };
    });
  }

  function getSession() {
    return session();
  }

  /* --- PostgREST (Read / Insert / Update / Delete) --- */

  function restUrl(table, query) {
    var c = config();
    var qs = query ? ("?" + query) : "";
    return c.url + "/rest/v1/" + table + qs;
  }

  function read(table, query) {
    var guard = requireConfigured();
    if (guard) { return guard; }
    return fetch(restUrl(table, query), { method: "GET", headers: baseHeaders() })
      .then(parseResponse)
      .catch(function (err) { return { data: null, error: { message: String(err && err.message || err) } }; });
  }

  function insert(table, row) {
    var guard = requireConfigured();
    if (guard) { return guard; }
    return fetch(restUrl(table), {
      method: "POST",
      headers: baseHeaders({ "Prefer": "return=representation" }),
      body: JSON.stringify(row)
    }).then(parseResponse)
      .catch(function (err) { return { data: null, error: { message: String(err && err.message || err) } }; });
  }

  function update(table, query, patch) {
    var guard = requireConfigured();
    if (guard) { return guard; }
    return fetch(restUrl(table, query), {
      method: "PATCH",
      headers: baseHeaders({ "Prefer": "return=representation" }),
      body: JSON.stringify(patch)
    }).then(parseResponse)
      .catch(function (err) { return { data: null, error: { message: String(err && err.message || err) } }; });
  }

  function remove(table, query) {
    var guard = requireConfigured();
    if (guard) { return guard; }
    return fetch(restUrl(table, query), {
      method: "DELETE",
      headers: baseHeaders({ "Prefer": "return=representation" })
    }).then(parseResponse)
      .catch(function (err) { return { data: null, error: { message: String(err && err.message || err) } }; });
  }

  return {
    isConfigured: isConfigured,
    signUp: signUp,
    signInWithPassword: signInWithPassword,
    signOut: signOut,
    refreshSession: refreshSession,
    getSession: getSession,
    read: read,
    insert: insert,
    update: update,
    remove: remove
  };
})();
