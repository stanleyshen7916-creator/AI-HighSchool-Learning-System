/* js/runtime/WorkspaceRuntime.js — Sprint AI-119 (Platform Core Baseline)
   §1/§2/§6/§7 Workspace Architecture — the platform's single top-level
   Context (Student + School + Semester[]).

   Single source for "who is currently logged in and into which
   Workspace" — every page's Login gate (AHS.AppShell.create), the
   Topbar's Current Workspace display/switcher, and
   AHS.PersistenceAdapter's own Workspace-namespacing (see that file's
   own header) all read this Runtime, never re-derive their own copy.

   Persisted via AHS.PersistenceAdapter's *Global variants only — the
   Workspace pointer itself must NOT be namespaced by the very Workspace
   it defines (that would be circular); see PersistenceAdapter.js. This
   is the one deliberate, documented exception to "everything goes
   through save()/load()" in this Runtime family. */
window.AHS = window.AHS || {};
AHS.WorkspaceRuntime = (function () {
  "use strict";

  var STORAGE_KEY = "workspace";

  function hydrate() {
    var loaded = (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.loadGlobal === "function")
      ? AHS.PersistenceAdapter.loadGlobal(STORAGE_KEY) : null;
    if (!loaded || typeof loaded !== "object" || !loaded.studentId || !loaded.schoolId ||
        !Array.isArray(loaded.semesterIds) || !loaded.semesterIds.length) {
      return null;
    }
    return loaded;
  }

  var current = hydrate();

  function persist() {
    if (!AHS.PersistenceAdapter) { return; }
    if (current && typeof AHS.PersistenceAdapter.saveGlobal === "function") {
      AHS.PersistenceAdapter.saveGlobal(STORAGE_KEY, current);
    } else if (!current && typeof AHS.PersistenceAdapter.removeGlobal === "function") {
      AHS.PersistenceAdapter.removeGlobal(STORAGE_KEY);
    }
  }

  function students() { return (AHS.WorkspaceData && AHS.WorkspaceData.students) || []; }
  function schools() { return (AHS.WorkspaceData && AHS.WorkspaceData.schools) || []; }
  function semesters() { return (AHS.WorkspaceData && AHS.WorkspaceData.semesters) || []; }

  function permissionsFor(studentId) {
    var all = (AHS.WorkspaceData && AHS.WorkspaceData.permissions) || {};
    return all[studentId] || { schoolIds: [], semesterIds: [] };
  }

  /* schoolsFor(studentId) / semestersFor(studentId) — 權限過濾後的清單，
     §6「登入後，僅顯示：具有權限之 School／Semester」。 */
  function schoolsFor(studentId) {
    var perm = permissionsFor(studentId);
    return schools().filter(function (s) { return perm.schoolIds.indexOf(s.id) !== -1; });
  }
  function semestersFor(studentId) {
    var perm = permissionsFor(studentId);
    return semesters().filter(function (s) { return perm.semesterIds.indexOf(s.id) !== -1; });
  }

  function findStudent(id) { return students().filter(function (s) { return s.id === id; })[0] || null; }
  function findSchool(id) { return schools().filter(function (s) { return s.id === id; })[0] || null; }
  function findSemester(id) { return semesters().filter(function (s) { return s.id === id; })[0] || null; }

  function getCurrent() { return current ? JSON.parse(JSON.stringify(current)) : null; }

  /* setCurrent({studentId, schoolId, semesterIds}) — 驗證權限後才寫入；
     任何越權組合（不在該 Student permissions 內的 School／Semester）一律
     拒絕、回傳 null、不寫入 —— 對應 §6「不得自行切換未授權 Workspace」。
     semesterIds 支援複選（§5「支援：單選／複選」），未授權的 id 會被
     靜默過濾掉而非整體拒絕，讓合法子集仍可成功登入。 */
  function setCurrent(next) {
    next = next || {};
    var studentId = next.studentId;
    var schoolId = next.schoolId;
    var semesterIds = Array.isArray(next.semesterIds) ? next.semesterIds.slice()
      : (next.semesterId ? [next.semesterId] : []);
    var student = findStudent(studentId);
    if (!student) { return null; }
    var perm = permissionsFor(studentId);
    if (perm.schoolIds.indexOf(schoolId) === -1) { return null; }
    semesterIds = semesterIds.filter(function (id) { return perm.semesterIds.indexOf(id) !== -1; });
    if (!semesterIds.length) { return null; }
    current = { studentId: studentId, schoolId: schoolId, semesterIds: semesterIds };
    persist();
    return getCurrent();
  }

  function isLoggedIn() { return !!current; }

  /* logout() — 只清除 Workspace 指標本身，不觸碰任何 Runtime 已持久化的
     Learning State（每個 Workspace 的資料已透過 PersistenceAdapter 的
     命名空間彼此隔離，登出/換人不代表要清空——這正是 §11「Learning
     State：依 Workspace 完全隔離」的自然結果：換一個 Workspace 登入，
     看到的本就是空的或該 Workspace 自己的資料，不需要、也不應該用
     PersistenceAdapter.clear() 把其他 Workspace 的真實學習紀錄一起清掉。
     這是相對於 Sprint 前 doLogout() 全域 clear() 的刻意行為變更，見
     EO Report「判斷與取捨」。 */
  function logout() {
    current = null;
    persist();
  }

  /* storageNamespace() — AHS.PersistenceAdapter 的唯一呼叫進入點。
     semesterIds 先排序再組字串，確保同一組 Semester 不論選取點擊順序，
     命名空間都相同（真正的隔離，而非因為陣列順序不同而意外分裂）。 */
  function storageNamespace() {
    if (!current) { return ""; }
    var sems = current.semesterIds.slice().sort().join("+");
    return current.studentId + "__" + current.schoolId + "__" + sems;
  }

  /* label() — 供 Topbar「目前 Workspace」固定顯示與切換選單使用，§7。 */
  function label() {
    if (!current) { return null; }
    var student = findStudent(current.studentId);
    var school = findSchool(current.schoolId);
    var semesterNames = current.semesterIds.map(function (id) {
      var s = findSemester(id);
      return s ? s.name : id;
    });
    return {
      studentId: current.studentId,
      studentName: student ? student.name : current.studentId,
      schoolId: current.schoolId,
      schoolName: school ? school.name : current.schoolId,
      semesterIds: current.semesterIds.slice(),
      semesterNames: semesterNames
    };
  }

  return {
    students: students,
    schools: schools,
    semesters: semesters,
    schoolsFor: schoolsFor,
    semestersFor: semestersFor,
    findStudent: findStudent,
    findSchool: findSchool,
    findSemester: findSemester,
    getCurrent: getCurrent,
    setCurrent: setCurrent,
    isLoggedIn: isLoggedIn,
    logout: logout,
    storageNamespace: storageNamespace,
    label: label
  };
})();
