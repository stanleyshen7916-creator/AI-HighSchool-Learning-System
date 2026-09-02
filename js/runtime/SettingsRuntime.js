/* js/runtime/SettingsRuntime.js — Sprint AI-113 · AI-804/AI-805 Settings
   + User Menu.

   Single, real source for every user-adjustable preference this static
   prototype can honestly support without a backend: display Profile
   (name/grade — reflected in the shared topbar, same pattern every
   other Runtime uses to be the one place a value lives), and a small
   set of real feature toggles other components already know how to
   honor (js/components/AiTutorHomeCard.js / js/ui/TutorContextTip.js
   read showTutorSuggestions; js/ui/AIGatewayPanel.js's own existing
   Gateway wiring reads aiGatewayEnabled). No component invents its own
   copy of these values — this is the Single Source (AI-802) for
   Settings, same discipline as AHS.StatisticsRuntime for Statistics.
   PersistenceAdapter-backed, same hydrate/persist pattern as every
   other stateful Runtime in this repo. */
window.AHS = window.AHS || {};
AHS.SettingsRuntime = (function () {
  "use strict";

  var STORAGE_KEY = "settings";

  /* Sprint AI-138：showTutorSuggestions 預設改為 false — AI Tutor 尚未
     串接真實 API，PO 決定 AiTutorHomeCard（首頁卡片）與 TutorContextTip
     （教材中心/學習總結/測驗中心/知識弱點/複習中心的建議 Banner）暫時隱藏。
     這是這兩個元件本來就有的既有真實開關（見 js/pages/AppHome.js／
     js/ui/TutorContextTip.js 對這個欄位的讀取），只是把預設值反過來，
     Settings > Learning 的「顯示 AI 巧巧老師建議卡片」開關仍在，使用者
     （或日後重新啟用時）仍可自行打開，不是刪除功能。 */
  var DEFAULTS = {
    profile: { name: "同學", grade: "高中生" },
    showTutorSuggestions: false,
    aiGatewayEnabled: false
  };

  /* PAT Fix follow-up (real PO report): profile.name used to default to
     the literal placeholder "同學" regardless of who actually logged
     in, so the topbar's user button and the Settings Profile panel
     both showed a name disconnected from the real student picked on
     login.html — "獨立事件". AHS.WorkspaceRuntime (loaded before this
     file on every page) is the single real source for "who is logged
     in"; its own label().studentName is used here ONLY as the seed for
     a brand-new profile that has never been explicitly saved — once a
     user edits their own display name via Settings, that saved value
     always wins (this function is never called again for that
     Workspace once a real profile.name exists in storage). */
  function defaultProfileName() {
    var label = (AHS.WorkspaceRuntime && typeof AHS.WorkspaceRuntime.label === "function")
      ? AHS.WorkspaceRuntime.label() : null;
    return (label && label.studentName) ? label.studentName : DEFAULTS.profile.name;
  }

  function hydrate() {
    var loaded = (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function")
      ? AHS.PersistenceAdapter.load(STORAGE_KEY) : null;
    if (!loaded || typeof loaded !== "object") {
      var seeded = clone(DEFAULTS);
      seeded.profile.name = defaultProfileName();
      return seeded;
    }
    var merged = clone(DEFAULTS);
    merged.profile = Object.assign({}, DEFAULTS.profile, loaded.profile || {});
    if (!loaded.profile || !loaded.profile.name) { merged.profile.name = defaultProfileName(); }
    if (typeof loaded.showTutorSuggestions === "boolean") { merged.showTutorSuggestions = loaded.showTutorSuggestions; }
    if (typeof loaded.aiGatewayEnabled === "boolean") { merged.aiGatewayEnabled = loaded.aiGatewayEnabled; }
    return merged;
  }

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function persist() {
    if (!AHS.PersistenceAdapter || typeof AHS.PersistenceAdapter.save !== "function") { return; }
    AHS.PersistenceAdapter.save(STORAGE_KEY, store);
  }

  var store = hydrate();

  function get() { return clone(store); }

  /* update(partial) — shallow-merges top-level keys; `profile` merges
     one level deeper so callers can update just `name` without needing
     to also pass the current `grade`. Persists, returns the new state. */
  function update(partial) {
    partial = partial || {};
    if (partial.profile) {
      store.profile = Object.assign({}, store.profile, partial.profile);
    }
    Object.keys(partial).forEach(function (k) {
      if (k === "profile") { return; }
      store[k] = partial[k];
    });
    persist();
    pushSettings();
    pushProfile();
    return get();
  }

  function reset() {
    store = clone(DEFAULTS);
    persist();
    return get();
  }

  /* pushSettings() — Sprint AI-126B Part 2, Task 7. public.user_settings
     holds only show_tutor_suggestions/ai_gateway_enabled — profile.name/
     grade live on student_profiles instead, pushed separately by
     pushProfile() below (see that function's own header for why). Read-
     then-upsert by the table's own real unique (student_profile_id)
     constraint. Fire-and-forget; never changes update()'s own
     already-returned value above. */
  function pushSettings() {
    if (!AHS.SyncBridge || !AHS.SyncBridge.isConfigured()) { return; }
    var identity = AHS.SyncBridge.identity();
    if (!identity) { return; }
    var repo = AHS.RepositoryFactory.create();
    var row = {
      user_id: identity.userId,
      student_profile_id: identity.studentProfileId,
      show_tutor_suggestions: !!store.showTutorSuggestions,
      ai_gateway_enabled: !!store.aiGatewayEnabled
    };
    AHS.SyncBridge.pushFireAndForget(function () {
      return repo.read("user_settings", "student_profile_id=eq." + identity.studentProfileId).then(function (readResult) {
        if (readResult.error) { return readResult; }
        if (readResult.data && readResult.data.length) {
          return repo.update("user_settings", "id=eq." + readResult.data[0].id, row);
        }
        return repo.insert("user_settings", row);
      });
    });
  }

  /* pushProfile() — real PO report (帳號修改後資料不同步／關閉瀏覽器後
     還原): profile.name/grade used to live ONLY in AHS.PersistenceAdapter
     (sessionStorage, namespaced per exact Workspace — studentId +
     schoolId + semesterIds). Two real, observed consequences: (1) the
     same real student editing their name under one School/Semester
     combination never showed it under a different one (or on this
     Runtime's next page load) — different parts of the same logged-in
     session showing two different names — and (2) sessionStorage is
     cleared when the browser itself is closed (see
     js/core/PersistenceAdapter.js's own header — 100% by design for the
     Learning State it otherwise owns), so a renamed profile silently
     reverted to the seed default on the next visit. student_profiles
     (Sprint AI-126A's real "User Mapping" — display_name/grade columns,
     AHS.AuthRepository.ensureOwnProfile() already creates this exact row
     at login) is the one real, per-STUDENT (not per-Workspace) backend
     record this data already has a home in. Pushing/pulling it here,
     the same fire-and-forget pattern pushSettings()/pullFromRepository()
     already use for user_settings, makes it survive a real browser
     restart and stay consistent across every Workspace for this student
     — a true no-op (silently skipped, exactly like pushSettings()) when
     Supabase isn't configured, so nothing changes for that case. */
  function pushProfile() {
    if (!AHS.SyncBridge || !AHS.SyncBridge.isConfigured()) { return; }
    var identity = AHS.SyncBridge.identity();
    if (!identity) { return; }
    var repo = AHS.RepositoryFactory.create();
    var row = { display_name: store.profile.name, grade: store.profile.grade };
    AHS.SyncBridge.pushFireAndForget(function () {
      return repo.update("student_profiles", "id=eq." + identity.studentProfileId, row);
    });
  }

  /* pullFromRepository() — additive, new async method. Merges both real
     tables profile/preferences already live on: user_settings (the two
     toggles) and, since the fix above, student_profiles' own
     display_name/grade — the real, per-student Single Source that now
     overrides whatever this Workspace's local sessionStorage cache
     happened to hold, so a rename made under any Workspace/device is
     visible everywhere on the next page load (RepositorySync.js already
     calls this on every page load for every domain, this Runtime
     included). */
  function pullFromRepository() {
    if (!AHS.SyncBridge || !AHS.SyncBridge.isConfigured()) { return Promise.resolve({ pulled: 0 }); }
    var identity = AHS.SyncBridge.identity();
    if (!identity) { return Promise.resolve({ pulled: 0 }); }
    var repo = AHS.RepositoryFactory.create();
    var pulled = 0;
    var firstError = null;

    var settingsPull = repo.read("user_settings", "student_profile_id=eq." + identity.studentProfileId).then(function (result) {
      if (result.error) { firstError = firstError || result.error; return; }
      if (!result.data || !result.data.length) { return; }
      var row = result.data[0];
      store.showTutorSuggestions = row.show_tutor_suggestions;
      store.aiGatewayEnabled = row.ai_gateway_enabled;
      pulled += 1;
    });

    var profilePull = repo.read("student_profiles", "id=eq." + identity.studentProfileId).then(function (result) {
      if (result.error) { firstError = firstError || result.error; return; }
      if (!result.data || !result.data.length) { return; }
      var row = result.data[0];
      if (row.display_name) { store.profile.name = row.display_name; }
      if (row.grade) { store.profile.grade = row.grade; }
      pulled += 1;
    });

    return Promise.all([settingsPull, profilePull]).then(function () {
      if (pulled > 0) { persist(); }
      var out = { pulled: pulled };
      if (pulled === 0 && firstError) { out.error = firstError; }
      return out;
    }).catch(function (err) {
      return { pulled: pulled, error: { message: String(err && err.message || err) } };
    });
  }

  return { get: get, update: update, reset: reset, pullFromRepository: pullFromRepository };
})();
