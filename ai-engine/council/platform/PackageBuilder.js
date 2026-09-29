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
    };
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

  function publish(materialId) {
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
    publish,
    deleteDraft,
    listDrafts,
    getDraft: preview,
    nextMaterialId,
    loadPlatformGlobals: () => loadPlatformGlobals(platformRoot),
  };
}

module.exports = { createPackageBuilder, MATERIAL_TYPES };
