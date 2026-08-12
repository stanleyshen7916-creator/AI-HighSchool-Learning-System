/* js/data/WorkspaceData.js — Sprint AI-119 (Platform Core Baseline)
   §3/§4/§5/§6 Student／School／Semester／Permission mock data.

   Static config only (per CLAUDE.md's data/ category — no logic here),
   mirroring AHS.Subjects' own {id -> display} shape. First version per
   the spec's own literal §3/§4/§5 lists: 3 Students (Admin + 2 real
   demo accounts, "保留未來新增" —更多學生留待未來新增，不在此 Sprint 憑空
   捏造), 1 School（長榮中學）, 5 Semesters（高一下～高三下）.

   permissions — §6 "登入後，僅顯示：具有權限之 School／Semester"，
   §20 PAT②「Student B 不得看到 Student A 任何資料」的示範資料：
   Student A 被授權 高一下 + 高二上（示範複選、示範跨學期切換）；
   Student B 僅被授權 高一下（示範同一 School 下、依然被 Semester
   權限完全隔開，看不到高二上）。Admin 授權全部 Semester，供 PAT 全流程
   驗證使用。這是 Mock Data，不是真實帳號權限系統。

   password — Sprint AI-133（使用者需求：登入流程選完學生/學校/學期後，
   按下「進入平台」前，需輸入密碼才可進入）。每個學生各自一組密碼
   （使用者確認方案），由 js/pages/AppLogin.js 新增的第 4 步驟
   （stepPassword）在瀏覽器端比對。誠實揭露：這個專案是純前端靜態
   Prototype，沒有後端資料庫可驗證帳密，這裡的密碼必然明文寫在前端
   程式碼裡、由瀏覽器端 JavaScript 比對——技術上任何看得到原始碼或開啟
   開發者工具的人都能繞過，不是真正資安等級的保護，只能當作「一般訪客
   擋門」的門禁（使用者已明確確認接受此定位，見 Sprint AI-133 對話紀錄）。
   刻意不做任何雜湊/混淆假裝安全——明碼比隱藏起來看似安全但其實一樣能
   被繞過更誠實。 */
window.AHS = window.AHS || {};
AHS.WorkspaceData = {
  students: [
    { id: "admin", name: "Admin", role: "ADMIN", password: "admin2026" },
    { id: "student_a", name: "Student A", role: "STUDENT", password: "studentA2026" },
    { id: "student_b", name: "Student B", role: "STUDENT", password: "studentB2026" }
  ],
  schools: [
    { id: "cjsh", name: "長榮中學" }
  ],
  semesters: [
    { id: "g1s2", name: "高一下學期", order: 1 },
    { id: "g2s1", name: "高二上學期", order: 2 },
    { id: "g2s2", name: "高二下學期", order: 3 },
    { id: "g3s1", name: "高三上學期", order: 4 },
    { id: "g3s2", name: "高三下學期", order: 5 }
  ],
  permissions: {
    admin: { schoolIds: ["cjsh"], semesterIds: ["g1s2", "g2s1", "g2s2", "g3s1", "g3s2"] },
    student_a: { schoolIds: ["cjsh"], semesterIds: ["g1s2", "g2s1"] },
    student_b: { schoolIds: ["cjsh"], semesterIds: ["g1s2"] }
  }
};
