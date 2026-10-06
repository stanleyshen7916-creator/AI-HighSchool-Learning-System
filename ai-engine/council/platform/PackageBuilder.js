// ai-engine/council/platform/PackageBuilder.js — 2026-09-29 教材上傳併入學習平台。
//
// 補上 AI-Study-Council 原本靠人工完成的最後一段：Final.md → 平台教材包（tm_N）→ 匯入。
//
//   createDraft()  新增一個全新的 docs/TeachingMaterials/materials/tm_N/，manifest.status
//                  = "draft"（生命週期 ANALYZING，學生端完全看不到）。
//   publish()      管理者在上傳頁預覽確認後才呼叫：draft → complete，接著走 repo 既有的
//                  RepositoryManager.prepare() + ImportManager.importAll()（不另寫一套匯入）。
//   deleteDraft()  刪除尚未發布的草稿。
//
// 既有教材不得修改：所有操作只接受登記在 <dataDir>/platform-drafts.json、由本模組自己
// 建立的 materialId；tm_N 一律取「目前最大編號 + 1」且資料夾必須不存在。已發布（IMPORTED）
// 的教材包之後也不能再經由這裡刪除或改寫。
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { parseFinal } = require('./FinalParser');
const { createSupplementBuilder, SUPPLEMENT_SOURCE, SOLVER_NAMES } = require('./SupplementBuilder');

const MATERIAL_TYPES = { TEXTBOOK: '課本', HANDOUT: '講義', REFERENCE: '補充資料' };

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

// 平台的學校／學期／科目定義都在瀏覽器用的 js 檔裡，以沙箱執行取得，不另維護一份。
function loadPlatformGlobals(platformRoot) {
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  ['js/core/Icons.js', 'js/data/WorkspaceData.js'].forEach((rel) => {
    vm.runInNewContext(fs.readFileSync(path.join(platformRoot, rel), 'utf8'), sandbox.window);
  });
  const AHS = sandbox.window.AHS;
  return {
    schools: AHS.WorkspaceData.schools,
    semesters: AHS.WorkspaceData.semesters,
    subjectNames: Object.keys(AHS.Subjects).map((k) => AHS.Subjects[k].name),
  };
}

function createPackageBuilder({ platformRoot, dataDir }) {
  const tmRoot = path.join(platformRoot, 'docs', 'TeachingMaterials');
  const materialsDir = path.join(tmRoot, 'materials');
  const registryFile = path.join(dataDir, 'platform-drafts.json');
  const scripts = path.join(tmRoot, 'scripts');
  const lifecycle = () => require(path.join(scripts, 'MaterialLifecycle.js'));
  const adapter = () => require(path.join(scripts, 'TeachingMaterialAdapter.js'));
  const repoManager = () => require(path.join(scripts, 'RepositoryManager.js'));
  const importManager = () => require(path.join(scripts, 'ImportManager.js'));
  const supplements = createSupplementBuilder({ platformRoot });

  function registry() {
    return readJson(registryFile, { drafts: {} });
  }

  function saveRegistry(reg) {
    fs.mkdirSync(dataDir, { recursive: true });
    writeJson(registryFile, reg);
  }

  function ownedEntry(materialId) {
    const entry = registry().drafts[materialId];
    if (!/^tm_\d+$/.test(String(materialId)) || !entry) {
      throw new Error(`${materialId} 不是由教材上傳建立的草稿，不能在這裡操作`);
    }
    return entry;
  }

  function packageDir(materialId) {
    return path.join(materialsDir, materialId);
  }

  function nextMaterialId() {
    const used = fs.readdirSync(materialsDir)
      .concat(Object.keys(registry().drafts))
      .map((name) => /^tm_(\d+)$/.exec(name))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    return `tm_${(used.length ? Math.max(...used) : 0) + 1}`;
  }

  function validateMetadata(input) {
    const globals = loadPlatformGlobals(platformRoot);
    const meta = {
      school: String(input.school || '').trim(),
      semester: String(input.semester || '').trim(),
      subject: String(input.subject || '').trim(),
      grade: String(input.grade || '').trim(),
      chapter: String(input.chapter || '').trim(),
      unit: String(input.unit || '').trim() || null,
      materialType: String(input.materialType || '').trim(),
    };
    const problems = [];
    if (!globals.schools.some((s) => s.id === meta.school)) problems.push('學校');
    if (!globals.semesters.some((s) => s.id === meta.semester)) problems.push('學期');
    if (!globals.subjectNames.includes(meta.subject)) problems.push('科目（必須是平台已支援的科目）');
    if (!meta.grade) problems.push('年級');
    if (!meta.chapter) problems.push('章節');
    // EXAM 教材依規定所有題目都必須是 ORIGINAL 原題；Council 產出的題目是 AI 撰寫，不能標成考卷。
    if (!MATERIAL_TYPES[meta.materialType]) problems.push('教材類型（課本／講義／補充資料）');
    if (problems.length) throw new Error(`教材資訊不完整或不正確：${problems.join('、')}`);
    meta.schoolName = globals.schools.find((s) => s.id === meta.school).name;
    meta.semesterName = globals.semesters.find((s) => s.id === meta.semester).name;
    return meta;
  }

  function materialMarkdown(materialId, meta, parsed, finalFilename, sourceNames) {
    const fm = parsed.frontmatter;
    const lines = [
      `# ${materialId} — ${meta.schoolName}${meta.grade}${meta.subject}「${meta.chapter}」`,
      '',
      `- **科目**：${meta.subject}（${meta.grade}）`,
      `- **學校／學期**：${meta.schoolName}（\`${meta.school}\`）／${meta.semesterName}（\`${meta.semester}\`）`,
      `- **章節**：${meta.chapter}${meta.unit ? ` / ${meta.unit}` : ''}`,
      `- **教材類型**：\`${meta.materialType}\`（${MATERIAL_TYPES[meta.materialType]}）`,
      `- **原始檔案**（\`source/\`）：${sourceNames.map((n) => `\`${n}\``).join('、')}`,
      '',
      '## 產出過程（自動轉換，誠實揭露）',
      '',
      `本教材包由學習平台「教材上傳」頁（upload.html）呼叫本機教材上傳引擎（ai-engine/council）建立：原始教材經 OCR 取得本文後，由 ChatGPT (Web)、Gemini (Web)、Claude (Web) 三方獨立分析，再經 Council 交叉審議產出 \`source/${finalFilename}\`。`,
      '',
      `- 審議模式：${fm.mode || '（未標示）'}；裁決：${fm.adjudicator || '（未標示）'}${fm.adjudication_mode ? `（${fm.adjudication_mode}）` : ''}`,
      `- Quality Gate：${parsed.qualityGate || '（未標示）'}；Final Score：${parsed.finalScore || '（未標示）'}${fm.run_id ? `；run_id：\`${fm.run_id}\`` : ''}`,
      '- `summary.json`、`questionbank.json` 由 FinalParser 從 Final.md 逐字擷取，不補寫、不猜測；題目一律標示為 `AI_GENERATED`，`page` 無法可靠對應，一律為 `null`。',
      '- `manifest.json` 的 `analysisEngine` 為 Schema 唯一允許的值 `"Claude"`，實際來源為上述三方 AI 與 Council 審議。',
      '- 管理者已在上傳頁預覽擷取結果後才發布。',
    ];
    if (parsed.warnings.length) {
      lines.push('', '### 轉換警告', '', ...parsed.warnings.map((w) => `- ${w}`));
    }
    lines.push('', '---', '', parsed.body.trim(), '');
    return lines.join('\n');
  }

  function buildQuestions(materialId, parsed, createdDate) {
    return parsed.questions.map((q, i) => {
      const record = {
        questionId: `${materialId}_q${i + 1}`,
        materialId,
        questionNumber: String(q.number),
        type: 'single_choice',
        questionSource: 'AI_GENERATED',
        origin: 'AI',
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        page: null,
        section: q.section || null,
        version: '1',
        createdDate,
      };
      if (q.section) record.knowledgePoint = q.section;
      return record;
    });
  }

  function preview(materialId) {
    const entry = ownedEntry(materialId);
    const dir = packageDir(materialId);
    if (!fs.existsSync(dir)) return { materialId, status: entry.status, missing: true };
    const summary = readJson(path.join(dir, 'summary.json'), {});
    const questionBank = readJson(path.join(dir, 'questionbank.json'), { questions: [] });
    const manifest = readJson(path.join(dir, 'manifest.json'), {});
    return {
      materialId,
      kind: entry.kind || 'material',
      supplementOf: entry.parentId || null,
      reviewed: entry.reviewed || [],
      status: entry.status,
      manifestStatus: manifest.status,
      stage: lifecycle().resolveStage(materialId),
      finalFilename: entry.finalFilename,
      qualityGate: entry.qualityGate,
      finalScore: entry.finalScore,
      warnings: entry.warnings || [],
      metadata: readJson(path.join(dir, 'metadata.json'), {}),
      summary,
      questions: questionBank.questions || [],
      sourceFiles: fs.readdirSync(path.join(dir, 'source')),
      subjectCoverage: subjectCoverage(readJson(path.join(dir, 'metadata.json'), {})),
    };
  }

  // 2026-10-06：每科題庫目標 100 題（模擬月考隨機出題的門檻）。統計平台上同校、同學期、
  // 同科目已上架教材（含補充題庫）的單選／是非題數，發布後提示還差幾題。
  const SUBJECT_QUESTION_TARGET = 100;
  function subjectCoverage(meta) {
    if (!meta || !meta.school || !meta.subject) return null;
    const lc = lifecycle();
    let count = 0;
    lc.listMaterialIds().forEach((id) => {
      if (lc.resolveStage(id) !== 'IMPORTED') return;
      const m = readJson(path.join(packageDir(id), 'metadata.json'), null);
      if (!m || m.school !== meta.school || m.semester !== meta.semester || m.subject !== meta.subject) return;
      const qb = readJson(path.join(packageDir(id), 'questionbank.json'), { questions: [] });
      count += (qb.questions || []).filter((q) => (q.type === 'single_choice' || q.type === 'true_false')
        && Array.isArray(q.options) && q.options.length >= 2 && q.answer).length;
    });
    return { school: meta.school, semester: meta.semester, subject: meta.subject, count, target: SUBJECT_QUESTION_TARGET };
  }

  function createDraft({ finalFilename, finalMarkdown, extraSourceFiles, metadata }) {
    const meta = validateMetadata(metadata || {});
    if (!String(finalMarkdown || '').trim()) throw new Error('Final.md 是空的');
    const parsed = parseFinal(finalMarkdown);
    const materialId = nextMaterialId();
    const dir = packageDir(materialId);
    if (fs.existsSync(dir)) throw new Error(`${materialId} 已存在，為避免覆寫既有教材已停止`);

    const now = new Date().toISOString();
    const sourceDir = path.join(dir, 'source');
    fs.mkdirSync(sourceDir, { recursive: true });
    const sourceNames = [path.basename(finalFilename)];
    fs.writeFileSync(path.join(sourceDir, sourceNames[0]), finalMarkdown, 'utf8');
    (extraSourceFiles || []).forEach((file) => {
      const name = path.basename(file.name);
      if (!name || sourceNames.includes(name)) return;
      fs.copyFileSync(file.path, path.join(sourceDir, name));
      sourceNames.push(name);
    });

    writeJson(path.join(dir, 'metadata.json'), {
      materialId,
      school: meta.school,
      semester: meta.semester,
      subject: meta.subject,
      grade: meta.grade,
      publisher: null,
      chapter: meta.chapter,
      unit: meta.unit,
      keywords: parsed.summary.keywords,
      difficulty: null,
      source: MATERIAL_TYPES[meta.materialType],
      uploadDate: now,
      version: '1',
      materialType: meta.materialType,
    });
    writeJson(path.join(dir, 'manifest.json'), {
      materialId,
      packageVersion: '1',
      createdDate: now,
      updatedDate: now,
      repositoryVersion: 'EO-S1.1-003',
      analysisEngine: 'Claude',
      status: 'draft',
    });
    writeJson(path.join(dir, 'summary.json'), { materialId, ...parsed.summary });
    writeJson(path.join(dir, 'questionbank.json'), { materialId, questions: buildQuestions(materialId, parsed, now) });
    writeJson(path.join(dir, 'related.json'), { materialId, related: [] });
    fs.writeFileSync(path.join(dir, 'material.md'), materialMarkdown(materialId, meta, parsed, sourceNames[0], sourceNames), 'utf8');

    const reg = registry();
    reg.drafts[materialId] = {
      materialId,
      status: 'draft',
      finalFilename: sourceNames[0],
      qualityGate: parsed.qualityGate,
      finalScore: parsed.finalScore,
      warnings: parsed.warnings,
      createdAt: now,
    };
    saveRegistry(reg);
    return preview(materialId);
  }

  function supplementMarkdown(materialId, parent, mode, accepted, checkResult, sourceNames, reviewNote) {
    const m = parent.metadata;
    const solved = (checkResult.solvers || []).length > 0;
    const pastExam = !!checkResult.pastExam;
    const modeLabel = pastExam ? '歷屆試題：題目與選項逐字取自官方公布的試卷，答案依官方公布的答案，不另做獨立作答核對' : !solved ? `未經獨立作答核對${reviewNote ? `；改以「${reviewNote}」確認` : ''}` : mode === 'tri' ? '三方核對（Claude 出題；Claude 新對話、ChatGPT、Gemini 各自獨立作答）'
      : '單一 Claude（Claude 出題；另開新的 Claude 對話獨立作答）';
    const reviewed = accepted.filter((q) => q.status === 'review');
    const lines = [
      `# ${materialId} — 補充題庫：${parent.materialId}「${m.chapter || ''}」`,
      '',
      `- **原教材**：\`${parent.materialId}\`（${m.subject || ''}，${m.grade || ''}，${m.chapter || ''}${m.unit ? ` / ${m.unit}` : ''}）`,
      `- **題數**：${accepted.length} 題（本批擷取 ${checkResult.questions.length} 題；重複 ${checkResult.counts.duplicate} 題未收錄）`,
      `- **原始檔案**（\`source/\`）：${sourceNames.map((n) => `\`${n}\``).join('、')}`,
      '',
      '## 產出過程（誠實揭露）',
      '',
      `本題庫由學習平台「教材上傳」頁的「為既有教材加題」建立，用來擴充 \`${parent.materialId}\` 的練習題。原教材包未做任何修改；`,
      '平台產生教材資料時，會把這裡的題目併入原教材的題庫（學生端不會看到一份獨立的「補充題庫」教材）。',
      '',
      `- 核對方式：${modeLabel}`,
      ...(pastExam ? [
        '- 題目一律標示為 `PAST_EXAM`（歷屆試題），每題都有「出處」（年度、考試、考科、題號），學生端顯示於題目下方。',
        '- 詳解不是官方提供，由 AI 撰寫（每題詳解開頭已註明）。',
        '- 試題著作權屬原出題單位所有；此處僅供非營利學習使用並逐題標註出處。',
      ] : [
        '- 出題 Prompt 依原教材 summary.json 的核心概念、定義、重點、易錯點與既有題目產生；題目一律標示為 `AI_GENERATED`，並附「出處」說明出題依據。',
        '- 引擎逐題比對出題答案與獨立作答答案；不一致、作答者認為題目有問題、缺詳解、選項不足或重複者，標示為「需人工確認」，預設不收錄。',
      ]),
      reviewed.length
        ? `- 以下 ${reviewed.length} 題原本標示為需人工確認，經${reviewNote ? `「${reviewNote}」` : '管理者'}確認後收錄：${reviewed.map((q) => `Q${q.number}（${q.reasons.join('；')}）`).join('、')}`
        : '- 本批收錄的題目皆通過自動核對。',
      '- 完整核對結果見 `source/check-report.json`。',
      '',
    ];
    return lines.join('\n');
  }

  // 為既有（已上架）教材加題：新增一份 tm_N「補充題庫」教材包（草稿），原教材不修改。
  // 只收錄管理者勾選、且不是「重複」的題目；需人工確認的題目要明確勾選才會收錄。
  // reviewNote（選填）：需人工確認的題目是如何確認的（例如沒有另開對話作答時，改用的核對方式），
  // 會如實寫進 material.md 與 check-report.json。
  // pastExam：歷屆試題（PAST_EXAM），每題必須有「出處」。AI 出題沒寫出處時，自動註明依據的教材與章節。
  function createSupplementDraft({ parentId, authorText, solvers, mode, accept, reviewNote, pastExam }) {
    const parent = supplements.loadParent(parentId);
    const result = supplements.check({ parentId, authorText, solvers, pastExam });
    const wanted = new Set((accept || []).map(Number));
    const chosen = result.questions.filter((q) => wanted.has(q.number) && q.status !== 'duplicate');
    if (!chosen.length) throw new Error('沒有勾選任何可加入的題目（重複的題目不能加入）');
    if (pastExam && chosen.some((q) => !q.reference)) throw new Error('歷屆試題每題都必須有「出處：」（年度、考試、考科、題號）');
    if (pastExam && chosen.some((q) => !q.mapping || !q.mapping.lesson || !/^(完全|部分)對應$/.test(q.mapping.fit || ''))) {
      throw new Error('歷屆試題每題都必須有「對應課程：」與「對應程度：完全對應／部分對應」（至少要對應到課）');
    }
    const aiReference = `AI 依 ${parent.materialId}「${parent.metadata.chapter || ''}」教材內容出題`;

    const materialId = nextMaterialId();
    const dir = packageDir(materialId);
    if (fs.existsSync(dir)) throw new Error(`${materialId} 已存在，為避免覆寫既有教材已停止`);
    const now = new Date().toISOString();
    const sourceDir = path.join(dir, 'source');
    fs.mkdirSync(sourceDir, { recursive: true });
    const sourceNames = ['author.md'];
    fs.writeFileSync(path.join(sourceDir, 'author.md'), String(authorText), 'utf8');
    (solvers || []).filter((s) => s && SOLVER_NAMES[s.id] && String(s.text || '').trim()).forEach((s) => {
      const name = `solver-${s.id}.md`;
      fs.writeFileSync(path.join(sourceDir, name), String(s.text), 'utf8');
      sourceNames.push(name);
    });
    writeJson(path.join(sourceDir, 'check-report.json'), {
      parentId, mode: mode === 'tri' ? 'tri' : 'single', createdAt: now,
      accepted: chosen.map((q) => q.number), reviewNote: reviewNote ? String(reviewNote) : null, ...result,
    });
    sourceNames.push('check-report.json');

    const pm = parent.metadata;
    writeJson(path.join(dir, 'metadata.json'), {
      materialId,
      school: pm.school || null,
      semester: pm.semester || null,
      subject: pm.subject || null,
      grade: pm.grade || null,
      publisher: null,
      chapter: pm.chapter || null,
      unit: pm.unit || null,
      keywords: Array.isArray(pm.keywords) ? pm.keywords : [],
      difficulty: null,
      source: SUPPLEMENT_SOURCE,
      uploadDate: now,
      version: '1',
      materialType: 'REFERENCE',
    });
    writeJson(path.join(dir, 'manifest.json'), {
      materialId,
      packageVersion: '1',
      createdDate: now,
      updatedDate: now,
      repositoryVersion: 'EO-S1.1-003',
      analysisEngine: 'Claude',
      status: 'draft',
    });
    // summary.json 是必要檔案：沿用原教材的摘要（同一份教材內容），平台上不會另外顯示。
    writeJson(path.join(dir, 'summary.json'), { ...parent.summary, materialId });
    writeJson(path.join(dir, 'questionbank.json'), {
      materialId,
      questions: chosen.map((q, i) => {
        const record = {
          questionId: `${materialId}_q${i + 1}`,
          materialId,
          questionNumber: String(i + 1),
          type: 'single_choice',
          questionSource: pastExam ? 'PAST_EXAM' : 'AI_GENERATED',
          origin: pastExam ? 'Past Exam' : 'AI',
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation,
          page: null,
          version: '1',
          createdDate: now,
        };
        if (q.knowledgePoint) record.knowledgePoint = q.knowledgePoint;
        if (q.difficulty) record.difficulty = q.difficulty;
        record.reference = q.reference || aiReference;
        if (q.mapping && q.mapping.lesson) {
          record.mapping = { lesson: q.mapping.lesson, section: q.mapping.section || null, fit: q.mapping.fit, note: q.mapping.note || '' };
        }
        return record;
      }),
    });
    writeJson(path.join(dir, 'related.json'), {
      materialId,
      related: [{ materialId: parent.materialId, reason: `${SUPPLEMENT_SOURCE}：為 ${parent.materialId}「${pm.chapter || ''}」擴充的${pastExam ? '歷屆試題' : ' AI 練習題'}` }],
    });
    fs.writeFileSync(path.join(dir, 'material.md'), supplementMarkdown(materialId, parent, mode, chosen, result, sourceNames, reviewNote ? String(reviewNote) : ''), 'utf8');

    const reviewed = chosen.filter((q) => q.status === 'review').map((q) => ({ number: q.number, reasons: q.reasons }));
    const reg = registry();
    reg.drafts[materialId] = {
      materialId,
      kind: 'supplement',
      parentId: parent.materialId,
      status: 'draft',
      finalFilename: 'author.md',
      qualityGate: null,
      finalScore: null,
      warnings: result.warnings.concat(reviewed.map((r) => `Q${r.number} 經人工確認後收錄（${r.reasons.join('；')}）`)),
      reviewed,
      createdAt: now,
    };
    saveRegistry(reg);
    return preview(materialId);
  }

  // 平台上已有同校、同年級、同科目、同一章的教材（補充題庫除外）。用來在發布前提醒
  // 「是不是重複上傳或選錯學校」。章名寫法常不一致（「第三章」／「第三章 液態與溶液」），
  // 所以有「第X章」時只比章號，沒有時才比完整章名。
  function sameChapterMaterials(materialId) {
    const lc = lifecycle();
    const meta = readJson(path.join(packageDir(materialId), 'metadata.json'), {});
    if (meta.source === SUPPLEMENT_SOURCE) return []; // 補充題庫本來就沿用原教材的章節
    const chapterOf = (m) => `${m.chapter || ''} ${m.unit || ''}`.trim();
    const chapterNo = (m) => (chapterOf(m).match(/第\s*[一二三四五六七八九十百\d]+\s*章/) || [''])[0].replace(/\s/g, '');
    return lc.listMaterialIds()
      .filter((id) => id !== materialId && lc.resolveStage(id) === 'IMPORTED')
      .map((id) => ({ id, m: readJson(path.join(packageDir(id), 'metadata.json'), null) }))
      .filter(({ m }) => m && m.source !== SUPPLEMENT_SOURCE
        && m.school === meta.school && m.grade === meta.grade && m.subject === meta.subject
        && (chapterNo(m) && chapterNo(meta) ? chapterNo(m) === chapterNo(meta) : chapterOf(m) === chapterOf(meta)))
      .map(({ id, m }) => `${id}（${m.school}／${m.grade}／${m.subject}／${chapterOf(m)}）`);
  }

  function publish(materialId, { confirmExisting = false } = {}) {
    const entry = ownedEntry(materialId);
    if (entry.status !== 'draft') throw new Error(`${materialId} 目前狀態為 ${entry.status}，只能發布草稿`);
    const lc = lifecycle();
    const dir = packageDir(materialId);
    const manifestFile = path.join(dir, 'manifest.json');
    const manifest = readJson(manifestFile, null);
    if (!manifest || manifest.status !== 'draft' || lc.resolveStage(materialId) !== 'ANALYZING') {
      throw new Error(`${materialId} 不是未發布的草稿，已停止`);
    }
    // importAll() 會匯入所有 READY_FOR_IMPORT 的教材包；若還有別的教材包正處於待匯入狀態，
    // 先停下來，避免順便把不是這次上傳的東西發布出去。
    const pending = lc.listMaterialIds()
      .filter((id) => id !== materialId && ['CLAUDE_READY', 'READY_FOR_IMPORT'].includes(lc.resolveStage(id)));
    if (pending.length) {
      throw new Error(`另有教材包 ${pending.join('、')} 正在等待匯入，為避免一併發布已停止，請先處理`);
    }
    const existing = sameChapterMaterials(materialId);
    if (existing.length && !confirmExisting) {
      const error = new Error(`平台上已有同校、同年級、同科目、同一章的教材：\n${existing.join('\n')}\n\n`
        + '請確認學校、章節是否選錯，或是否重複上傳。確定仍要發布嗎？');
      error.code = 'EXISTING_MATERIAL';
      throw error;
    }

    const draftManifest = fs.readFileSync(manifestFile, 'utf8');
    const revert = () => {
      fs.writeFileSync(manifestFile, draftManifest, 'utf8');
      ['knowledge.json', 'report.md'].forEach((f) => fs.rmSync(path.join(dir, f), { force: true }));
    };
    writeJson(manifestFile, { ...manifest, status: 'complete', updatedDate: new Date().toISOString() });

    const validation = adapter().validatePackage(materialId);
    if (!validation.valid) {
      revert();
      const failures = validation.output.split(/\r?\n/).filter((l) => /FAIL/.test(l)).slice(0, 10).join('\n');
      throw new Error(`教材包驗證未通過，未發布：\n${failures}`);
    }

    let result;
    try {
      repoManager().prepare();
      result = importManager().importAll();
    } catch (error) {
      revert();
      throw error;
    }
    if (!result.imported.includes(materialId)) {
      revert();
      const reason = (result.skipped.find((s) => s.materialId === materialId) || {}).reason || '未知原因';
      throw new Error(`匯入未完成（${reason}），已還原為草稿`);
    }

    const reg = registry();
    reg.drafts[materialId] = { ...reg.drafts[materialId], status: 'published', publishedAt: new Date().toISOString() };
    saveRegistry(reg);
    return {
      ...preview(materialId),
      changedPaths: [
        `docs/TeachingMaterials/materials/${materialId}/`,
        'docs/TeachingMaterials/index.json',
        'docs/TeachingMaterials/import-log.json',
        'js/data/TeachingMaterialData.js',
        'js/data/RepositoryStatus.js',
      ],
    };
  }

  function deleteDraft(materialId) {
    const entry = ownedEntry(materialId);
    if (entry.status !== 'draft') throw new Error(`${materialId} 已${entry.status === 'published' ? '發布' : '刪除'}，不能刪除`);
    const dir = packageDir(materialId);
    if (fs.existsSync(dir)) {
      if (lifecycle().resolveStage(materialId) === 'IMPORTED') throw new Error(`${materialId} 已在平台上，不能刪除`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
    const reg = registry();
    reg.drafts[materialId] = { ...entry, status: 'deleted', deletedAt: new Date().toISOString() };
    saveRegistry(reg);
    return { materialId, status: 'deleted' };
  }

  function listDrafts() {
    return Object.values(registry().drafts)
      .filter((d) => d.status !== 'deleted')
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  return {
    createDraft,
    createSupplementDraft,
    supplements,
    publish,
    deleteDraft,
    listDrafts,
    getDraft: preview,
    nextMaterialId,
    loadPlatformGlobals: () => loadPlatformGlobals(platformRoot),
  };
}

module.exports = { createPackageBuilder, MATERIAL_TYPES };
