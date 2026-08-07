/* js/repository/SupabaseRepository.js — Sprint AI-126B Repository
   Foundation.

   Concrete Repository implementation backed by the real Supabase
   project. This is one of the two files PMO-authorized to call fetch(
   — but not directly: it delegates every call to js/core/SupabaseClient.js,
   the actual fetch( boundary (see that file's own header). Requires
   Repository.js to load first (prototype chain). */
window.AHS = window.AHS || {};

(function () {
  "use strict";

  function SupabaseRepository() {
    AHS.Repository.call(this);
  }
  SupabaseRepository.prototype = Object.create(AHS.Repository.prototype);
  SupabaseRepository.prototype.constructor = SupabaseRepository;

  SupabaseRepository.prototype.connect = function () {
    return Promise.resolve({ connected: AHS.SupabaseClient.isConfigured() });
  };

  SupabaseRepository.prototype.login = function (email, password) {
    return AHS.SupabaseClient.signInWithPassword(email, password);
  };

  SupabaseRepository.prototype.logout = function () {
    return AHS.SupabaseClient.signOut();
  };

  SupabaseRepository.prototype.getSession = function () {
    return AHS.SupabaseClient.getSession();
  };

  SupabaseRepository.prototype.read = function (table, query) {
    return AHS.SupabaseClient.read(table, query);
  };

  SupabaseRepository.prototype.insert = function (table, row) {
    return AHS.SupabaseClient.insert(table, row);
  };

  SupabaseRepository.prototype.update = function (table, query, patch) {
    return AHS.SupabaseClient.update(table, query, patch);
  };

  SupabaseRepository.prototype.delete = function (table, query) {
    return AHS.SupabaseClient.remove(table, query);
  };

  AHS.SupabaseRepository = SupabaseRepository;
})();
