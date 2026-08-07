# AI-126A Schema Overview

Table-by-table mapping from each existing Runtime/store (the L1 `sessionStorage` layer `docs/Architecture/Architecture_AI125_Learning_Persistence_v1.0.md` documents) to its new L3 (`Account Persistence`) table. This is the reference AI-126B (Repository Layer) and AI-126C (Runtime Integration) are expected to build against — every column below was chosen to match an existing Runtime's real, already-shipped field shape, not invented fresh (see each migration file's own inline comments for the specific source file/line evidence).

## Entity-relationship summary

```
auth.users (Supabase built-in)
  └─ users (1:1, adds is_admin only)
       └─ student_profiles (User Mapping: mock_student_key ↔ real user_id)
            ├─ learning_progress ──┐
            ├─ exam_sessions ──┐   │
            ├─ wrong_book       │   │
            ├─ knowledge_mastery│   │
            ├─ statistics       │   │
            ├─ user_settings    │   │
            └─ activity_logs    │   │
                                │   │
subjects ───────────────────┐  │   │
  └─ materials ──────────┐  │  │   │
       └─ folders         │  │  │   │
            └─ question_sets  │  │
                 └─ questions │  │
                      └─ exam_answers
                           └─ exam_sessions (FK)
```

## Table → Runtime mapping

| Table | Existing Runtime (real source) | Notes |
|---|---|---|
| `users` | — (new; Supabase Auth extension) | `is_admin` is the only platform-specific field; email/password/session stay in `auth.users`, never duplicated. |
| `student_profiles` | `AHS.WorkspaceRuntime` (`js/runtime/WorkspaceRuntime.js`) + `AHS.SettingsRuntime.profile` (`js/runtime/SettingsRuntime.js`) | `mock_student_key` = the real, unmodified login.html picker key (`student_a`/`student_b`/…). `display_name`/`grade` = the exact fields the PAT fix "登入選擇的學生應與登入後右上角身分一致" made SettingsRuntime's Single Source for. `school_code`/`semester_codes` mirror `WorkspaceRuntime`'s `{schoolId, semesterIds}` shape. |
| `subjects` | `js/data/WorkspaceData.js` / Mock subject lists | Fixed lookup, `code` = same short key already used everywhere (`"math"`, etc.). |
| `folders` | `AHS.FolderRuntime` (`js/runtime/FolderRuntime.js`) | Study Scope concept, not a filesystem folder — field names/`scope_type` values match that Runtime's own `SCOPE_TYPES` verbatim. |
| `materials` | `AHS.MaterialRuntime` (`js/runtime/MaterialRuntime.js`) + Package/Repository tracks (`js/data/TeachingMaterialData.js`, `data/materials/MaterialRepositoryIndex.js`) | `origin_key` = the stable external id `TeachingMaterialLoader.js` already tracks for idempotent re-import. |
| `question_sets` | The "examId" concept `AHS.QuestionRuntime`/`AHS.ExamRuntime` already key by | `source` preserves the ORIGINAL/AI_GENERATED split AI-117-08 already enforces must never mix. |
| `questions` | `AHS.LearningQuestionRuntime` (`js/runtime/LearningQuestionRuntime.js`) | Field set matches that Runtime's own `validate()` requirements exactly. |
| `learning_progress` | `AHS.MaterialRuntime`'s per-material progress fields | `progress`/`lastOpenedAt`/`lastLearningAt`/`learningTime`/`learningCount`/`favorite` — the real signals `AHS.LearningStateRuntime`'s Reading signal already derives from. |
| `exam_sessions` | `AHS.ExamRuntime` (`js/runtime/ExamRuntime.js`, draft→ready→running→finished) + `AHS.HistoryRuntime` (`js/runtime/HistoryRuntime.js`, finished summary) | One durable row spans both — no second summary record. |
| `exam_answers` | `AHS.AnswerRuntime` (`js/runtime/AnswerRuntime.js`) | That Runtime is explicitly documented "In-memory only" — this table is its durable replacement once AI-126C wires it in (this is the one real Memory-only gap `Architecture_AI125_Learning_Persistence_v1.0.md` identified). |
| `wrong_book` | `AHS.WrongBookRuntime` (`js/runtime/WrongBookRuntime.js`) | Field-for-field match (`errorCount`/`firstError`/`lastError`/`masteredAt`/`bookmarked`/`archived`/`correctStreak`). `correctStreak` remains the input to that Runtime's own `weaknessState()` derivation — that logic is NOT duplicated in the schema. |
| `knowledge_mastery` | `AHS.KnowledgeMasteryRuntime` (`js/runtime/KnowledgeMasteryRuntime.js`) | `correct_count`/`wrong_count` per knowledge point, exactly what that Runtime's own header describes tracking. |
| `statistics` | `AHS.StatisticsRuntime` (`js/runtime/StatisticsRuntime.js`) — **stays purely computed**, this table does not replace it | Durable daily snapshot log only, for `"today"`-relative counters (`newWeaknessesToday()`/`resolvedWeaknessesToday()`) after "today" has passed — the one real gap a live-only computation can't cover on its own. |
| `user_settings` | `AHS.SettingsRuntime`'s remaining toggles (`js/runtime/SettingsRuntime.js`) | `show_tutor_suggestions`/`ai_gateway_enabled` only — name/grade stay on `student_profiles` (see above). |
| `activity_logs` | — (new; no existing Runtime precedent) | Added because Scope §2 names it explicitly. Generic `action`/`entity_type`/`entity_id`/`metadata` shape for future Admin/AI/API/Import Repository callers (§5). |

## Design decisions worth flagging explicitly

- **Denormalized `user_id` on every private table.** Each per-student table carries both `student_profile_id` (the business FK everything else in the schema joins on) and a denormalized `user_id` (the real auth identity). This is deliberate: Supabase's own RLS performance guidance recommends checking `auth.uid() = user_id` directly on the row rather than an `EXISTS`/`JOIN` through `student_profiles` on every single row of every query. The two columns are kept in lockstep by the Repository Layer's own writes (AI-126B) — not a second trigger — since a `student_profiles` row's `user_id` is never reassigned after creation.
- **`statistics` does not replace live computation.** `AHS.StatisticsRuntime.js`'s own header says "Purely computed... no storage of its own" — per §6 ("不得影響任何既有功能"), that stays true. The table exists only to make "✓ Statistics 可永久保存" (§7) hold for historical/trend views of `"今日"`-relative counters, which a live-only computation structurally cannot answer once today has become yesterday.
- **`folders`/`materials`/`question_sets`/`questions` are Admin Only writes**, per the original AI-126 scope's §7 ("學生不得新增教材...改為 Admin Only"). Every authenticated student can `SELECT` (read the shared Repository catalog); only `is_admin = true` users can write.
