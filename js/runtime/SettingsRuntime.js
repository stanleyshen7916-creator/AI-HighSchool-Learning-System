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

  function hydrate() {
    var loaded = (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function")
      ? AHS.PersistenceAdapter.load(STORAGE_KEY) : null;
    if (!loaded || typeof loaded !== "object") { return clone(DEFAULTS); }
    var merged = clone(DEFAULTS);
    merged.profile = Object.assign({}, DEFAULTS.profile, loaded.profile || {});
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
