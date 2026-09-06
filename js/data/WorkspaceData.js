/* js/data/WorkspaceData.js — Sprint AI-119 (Platform Core Baseline)
   §3/§4/§5/§6 Student／School／Semester／Permission mock data.

   Static config only (per CLAUDE.md's data/ category — no logic here),
   mirroring AHS.Subjects' own {id -> display} shape. First version per
   the spec's own literal §3/§4/§5 lists: 3 Students (Admin + 2 real
   demo accounts, "保留未來新增" —更多學生留待未來新增，不在此 Sprint 憑空
   捏造), 1 School（長榮中學）, 5 Semesters（高一下～高三下）.

   09/05 新增第二間學校「竹圍高中」(zwsh)：因平台開始收錄竹圍高中高二化學
   課本教材（tm_13），一度新增獨立的第 4 位學生 student_c（僅授權
   zwsh／g2s1）。真實 PO 回報：登入頁一次出現 4 位學生造成混淆，且平台
   已在今天開始真實使用（Student A 已有真實練習紀錄）——依 PO 明確指示
   整併回 3 位登入帳號：**id 仍是 "student_c"**（保留其已建立的真實
   Supabase 帳號/資料，不重新指派 id，避免任何已產生的紀錄跟錯帳號)，
   只把顯示名稱從 "Student C" 改回 "Student B"；原本的長榮中學版
   student_b（cjsh／g1s2）條目直接移除。竹圍高中（zwsh）本身、tm_13
   教材皆保留不動，Admin 仍同時擁有 cjsh／zwsh 存取權限。這代表 Student B
   現在示範的是「跨校」資料隔離（長榮 vs 竹圍），不再是「同校不同學期」
   隔離——原本 Student A／Student B 都在長榮中學、僅學期範圍不同的示範
   場景已不存在，這是 PO 明確要求整併帳號數量的直接結果，非回歸。

   permissions — §6 "登入後，僅顯示：具有權限之 School／Semester"。
   Student A 被授權長榮中學 高一下 + 高二上（示範複選、示範跨學期切換）；
   Student B（id: student_c）僅被授權竹圍高中 高二上（示範跨校資料完全
   隔離，看不到長榮中學任何內容）。Admin 授權全部 School／Semester，供
   PAT 全流程驗證使用。這是 Mock Data，不是真實帳號權限系統。

   password — Sprint AI-133（使用者需求：登入流程選完學生/學校/學期後，
   按下「進入平台」前，需輸入密碼才可進入）。測試期間統一改為 "1234"
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
    { id: "admin", name: "Admin", role: "ADMIN", password: "1234" },
    { id: "student_a", name: "Student A", role: "STUDENT", password: "1234" },
    { id: "student_c", name: "Student B", role: "STUDENT", password: "1234" }
  ],
  schools: [
    { id: "cjsh", name: "長榮中學" },
    { id: "zwsh", name: "竹圍高中" }
  ],
  semesters: [
    { id: "g1s2", name: "高一下學期", order: 1 },
    { id: "g2s1", name: "高二上學期", order: 2 },
    { id: "g2s2", name: "高二下學期", order: 3 },
    { id: "g3s1", name: "高三上學期", order: 4 },
    { id: "g3s2", name: "高三下學期", order: 5 }
  ],
  permissions: {
    admin: { schoolIds: ["cjsh", "zwsh"], semesterIds: ["g1s2", "g2s1", "g2s2", "g3s1", "g3s2"] },
    student_a: { schoolIds: ["cjsh"], semesterIds: ["g1s2", "g2s1"] },
    student_c: { schoolIds: ["zwsh"], semesterIds: ["g2s1"] }
  }
};
