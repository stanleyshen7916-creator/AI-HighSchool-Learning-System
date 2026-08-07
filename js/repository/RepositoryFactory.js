/* js/repository/RepositoryFactory.js — Sprint AI-126B Repository
   Foundation.

   Single place that picks WHICH concrete Repository a caller gets —
   Runtimes (once a future Runtime Integration phase wires one in) call
   AHS.RepositoryFactory.create(), never `new AHS.SupabaseRepository()`
   directly, so swapping providers later never touches call sites. Only
   "supabase" exists today; the provider map is deliberately a map (not
   an if/else) so a future "local" entry (e.g. a LocalRepository.js
   backed by AHS.PersistenceAdapter) is a one-line addition, not a
   rewrite — the "保留未來 Local/Supabase 可切換能力" requirement this
   Sprint's Task 1 asks for. */
window.AHS = window.AHS || {};

(function () {
  "use strict";

  var DEFAULT_PROVIDER = "supabase";

  var PROVIDERS = {
    supabase: function () { return new AHS.SupabaseRepository(); }
  };

  function create(providerName) {
    var name = providerName || DEFAULT_PROVIDER;
    var factory = PROVIDERS[name];
    if (!factory) {
      throw new Error("RepositoryFactory: unknown provider \"" + name + "\" (known: " + Object.keys(PROVIDERS).join(", ") + ")");
    }
    return factory();
  }

  AHS.RepositoryFactory = {
    create: create
  };
})();
