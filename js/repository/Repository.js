/* js/repository/Repository.js — Sprint AI-126B Repository Foundation.

   Abstract Repository interface. Every concrete Repository (currently
   only SupabaseRepository.js; a future LocalRepository.js could target
   sessionStorage/PersistenceAdapter instead) must implement every method
   below. This is the ONLY contract a Runtime is ever meant to depend on
   once a future Runtime Integration phase wires one in — no Runtime
   currently references this file (Sprint AI-126B is Repository Layer +
   Authentication only, zero Runtime/UI change, per its own Scope). */
window.AHS = window.AHS || {};

(function () {
  "use strict";

  function notImplemented(method) {
    throw new Error("Repository." + method + "() not implemented — use a concrete Repository (e.g. AHS.SupabaseRepository) via AHS.RepositoryFactory.create()");
  }

  AHS.Repository = function Repository() {};
  AHS.Repository.prototype.connect = function () { notImplemented("connect"); };
  AHS.Repository.prototype.login = function (/* email, password */) { notImplemented("login"); };
  AHS.Repository.prototype.logout = function () { notImplemented("logout"); };
  AHS.Repository.prototype.getSession = function () { notImplemented("getSession"); };
  AHS.Repository.prototype.read = function (/* table, query */) { notImplemented("read"); };
  AHS.Repository.prototype.insert = function (/* table, row */) { notImplemented("insert"); };
  AHS.Repository.prototype.update = function (/* table, query, patch */) { notImplemented("update"); };
  AHS.Repository.prototype.delete = function (/* table, query */) { notImplemented("delete"); };
})();
