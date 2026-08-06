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

  var DEFAULTS = {
    profile: { name: "同學", grade: "高中生" },
    showTutorSuggestions: true,
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
    return get();
  }

  function reset() {
    store = clone(DEFAULTS);
    persist();
    return get();
  }

  return { get: get, update: update, reset: reset };
})();
