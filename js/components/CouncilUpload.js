/* js/components/CouncilUpload.js — 2026-09-29 教材上傳併入學習平台.

   Admin-only page component for upload.html. Replaces AI-Study-Council's
   own localhost web UI and adds the step that used to be done by hand:

     1 教材資訊        school/semester/subject from the platform's own data
     2 上傳原始檔      OCR via the engine (MinerU → Tesseract fallback);
                       originals are kept for the package's source/
     3 本機初稿        two local models (A, B) each write a draft in the engine
                       (2026-11-26 AHS-A3: no ChatGPT/Gemini/Claude drafts)
     4 交叉審議        local cross-check job → Final.md (or pick an existing Final),
                       then Claude 最後檢核 (judge only, no rewrite) → local revision, max 2 rounds
     5 建立教材包草稿  Final.md → docs/TeachingMaterials/materials/tm_N
                       (draft — students can't see it), preview, then
                       發布 (runs the repo's own import) or 刪除

   All engine I/O goes through AHS.CouncilEngineClient. Nothing here
   touches an existing material: the engine only ever creates a new tm_N
   and only publishes/deletes drafts it created itself.

   create({ client, isAdmin }) -> root element. */
window.AHS = window.AHS || {};

AHS.CouncilUpload = (function () {
  "use strict";

  var el;
  var MATERIAL_TYPES = [
    { id: "TEXTBOOK", name: "課本" },
    { id: "HANDOUT", name: "講義" },
    { id: "REFERENCE", name: "補充資料" }
  ];
  var GRADES = ["高一", "高二", "高三"];
  var COUNCIL_SECTIONS = [
    "①核心概念", "②章節摘要", "③重點詞彙", "④文意理解", "⑤修辭手法",
    "⑥文化脈絡", "⑦作者背景", "⑧段落結構", "⑨延伸思考", "⑩易混淆概念",
    "⑪常考題型", "⑫易錯陷阱", "⑬跨課連結", "⑭Cross Review", "⑮Final Score"
  ];
  /* 2026-11-18 AHS-UP2 P1-6：數學／理化／地科的章節模板。國文模板的⑤修辭手法、⑥文化脈絡、⑦作者背景對它們不適用。
     仍維持 15 章與圈號，且保留引擎 FinalParser 依標題關鍵字擷取的章節（核心概念、章節摘要、重要定義、
     延伸思考、易混淆、常考題型、易錯、跨課連結），所以匯入端不用改。 */
  var STEM_SUBJECTS = ["數學", "物理", "化學", "地球科學"];
  var STEM_SECTIONS = [
    "①核心概念", "②章節摘要", "③重要定義與公式", "④例題與解題步驟", "⑤計算技巧與驗算",
    "⑥圖形與符號說明", "⑦前置知識與單位", "⑧公式推導脈絡", "⑨延伸思考", "⑩易混淆概念",
    "⑪常考題型", "⑫易錯陷阱", "⑬跨課連結", "⑭Cross Review", "⑮Final Score"
  ];
  function sectionsFor(subject) {
    return STEM_SUBJECTS.indexOf(subject) !== -1 ? STEM_SECTIONS : COUNCIL_SECTIONS;
  }
  var STEM_RULES = [
    "【數理科規則】",
    /* 2026-11-18（Stanley 決定走 Unicode 路線）：學習平台前端目前沒有 LaTeX 渲染（沒有 KaTeX／MathJax），
       學生會直接看到 $\tan\theta$ 這種原始碼，所以輸出一律用一般文字與 Unicode 符號。教材本文（SOURCE）裡 MinerU
       轉出的 LaTeX 是辨識出來的公式原始碼，要讀懂後改寫。前端渲染列為之後的 P1-7。 */
    "- 公式與符號：教材本文裡的 LaTeX（$...$）是辨識出來的公式原始碼，請讀懂後改寫成一般文字與 Unicode 符號再輸出——學習平台目前無法顯示 LaTeX，輸出裡不得出現 $、\\frac、\\sqrt 等 LaTeX 語法。寫法：希臘字母與符號直接寫 θ、π、∠、△、≤、≥、×、÷、±；根號寫成 √(…)；上標寫成 ²、³ 或 ^n，下標寫成 x₁、x₂；分數寫成 a/b（分子或分母有運算時加括號，例如 (a+b)/(2c)）；單位寫在數值之後；看不清楚的符號不得推測或改寫。",
    "- 題目與詳解：計算題的選項要是具體的數值或式子（含單位），且只有一個正確；答案請自行完整計算兩次、結果一致才寫；每題「詳解：」請分行寫出主要計算步驟（至少 3 步，用 (1)(2)(3) 編號），最後寫出結果與單位，再用一行「易錯：」寫最常見的錯誤。",
    "- ④例題與解題步驟：每題列「已知／求／步驟（編號）／答案」；⑤計算技巧與驗算要說明如何檢查答案是否合理（單位、範圍、特例）。",
    "- 教材本文沒有出現的公式或數據不可自行補，寫「SOURCE 未提供」。",
    ""
  ];
  /* 2026-11-18 AHS-UP2 P1-5：品質閘。引擎逐頁估計辨識可信度；只有「低信心頁」才需要提供原檔，
     「疑點頁」請抽查。沒有結構化結果（沒走 MinerU）時不顯示，不假裝每頁都沒問題。 */
  function pageQualityNote(q) {
    if (!q || !q.totalPages) { return ""; }
    function pages(list) { return list.map(function (p) { return "第 " + p.page + " 頁"; }).join("、"); }
    var low = q.lowPages || [];
    var suspect = q.suspectPages || [];
    if (!low.length && !suspect.length) { return " 辨識品質檢查：" + q.totalPages + " 頁都沒有發現明顯問題（僅為啟發式檢查）。"; }
    return (low.length ? " 需要原檔人工處理：" + pages(low) + "。" : "") +
      (suspect.length ? " 建議抽查：" + pages(suspect) + "（疑似公式辨識錯誤）。" : "");
  }
  var POLL_MS = 3000;

  /* 2026-11-26 AHS-A3：本機模型工作（POST /api/local-ai/jobs）背景執行，每 POLL_MS 問一次結果。
     onTick(job) 顯示進度；resolve(result)，失敗時 reject(Error)。 */
  function waitLocalJob(client, payload, onTick) {
    return client.localJob(payload).then(function (r) {
      if (r.error) { throw new Error(r.error.message); }
      return new Promise(function (resolve, reject) {
        function tick() {
          client.getLocalJob(r.data.jobId).then(function (j) {
            if (j.error) { reject(new Error(j.error.message)); return; }
            if (j.data.status === "completed") { resolve(j.data.result); return; }
            if (j.data.status === "failed") { reject(new Error(j.data.error || "本機模型工作失敗")); return; }
            if (onTick) { onTick(j.data); }
            setTimeout(tick, POLL_MS);
          });
        }
        tick();
      });
    });
  }

  function card(title, hint, children) {
    return el("section", { class: "card upl-card" }, [
      el("div", { class: "card__head" }, [el("h2", { class: "card__title", text: title })]),
      hint ? el("p", { class: "upl-hint", text: hint }) : null
    ].concat(children));
  }

  function field(label, control) {
    return el("label", { class: "upl-field" }, [el("span", { class: "upl-field__label", text: label }), control]);
  }

  function select(options, value) {
    var node = el("select", { class: "upl-input" });
    options.forEach(function (o) {
      var opt = el("option", { value: o.id, text: o.name });
      if (o.id === value) { opt.selected = true; }
      node.appendChild(opt);
    });
    return node;
  }

  /* 引擎接受的上傳格式（ai-engine/council/server.js ALLOWED_UPLOAD_EXTENSIONS）；
     .heic／.heif（iPhone 照片）由引擎轉成 JPEG（2026-11-28）。 */
  var UPLOAD_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".heic", ".heif", ".md", ".txt"];
  var UPLOAD_ACCEPT = UPLOAD_EXTENSIONS.join(",");

  function button(text, variant, onClick) {
    var node = el("button", { type: "button", class: "upl-btn" + (variant ? " upl-btn--" + variant : ""), text: text });
    node.addEventListener("click", onClick);
    return node;
  }

  function status(node, text, kind) {
    node.textContent = text || "";
    node.className = "upl-status" + (kind ? " upl-status--" + kind : "");
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) { return navigator.clipboard.writeText(text); }
    var temp = el("textarea", { class: "upl-offscreen" });
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    var copied = false;
    try { copied = document.execCommand("copy"); } catch (e) { copied = false; }
    document.body.removeChild(temp);
    return copied ? Promise.resolve() : Promise.reject(new Error("copy not allowed"));
  }

  // 與引擎 buildMaterialId() 相同的命名規則（MinerU 圖片目錄、Final.md 檔名前綴）。
  function sanitizeSegment(value) {
    var cleaned = String(value == null ? "" : value).trim().replace(/[^\p{L}\p{N}_-]/gu, "_");
    return cleaned || "unknown";
  }

  function adminOnly() {
    return el("div", { class: "upl-page" }, [
      card("教材上傳", null, [
        el("p", { class: "upl-hint", text: "此頁僅限管理者使用。請以 Admin 帳號登入後再開啟。" })
      ])
    ]);
  }

  /* ---- 為既有教材加題（2026-10-01） --------------------------------------
     1 選教材與題數 → 本機模型 A 出題（2026-11-26 AHS-A3 起不再貼到網頁版 AI）
     2 出題結果（可修改）→ 擷取題目：本機模型 B 自動作答，並複製「只有題目」的作答 Prompt 給 Claude
     3 獨立作答結果：本機模型 B ＋ 新的 Claude 對話（最後檢核）
     4 核對結果：一致 → 預設勾選；需人工確認 → 預設不勾；重複 → 不能勾
       → 建立補充題庫草稿（新的 tm_N，原教材不修改）→ 共用的預覽／發布。 */
  var OPTION_LETTERS = ["A", "B", "C", "D", "E"];
  var CALC_SUBJECTS = ["數學", "物理", "化學", "地球科學"];
  var STATUS_LABEL = { ok: "核對一致", review: "需人工確認", duplicate: "重複，不能加入" };
  var STATUS_TONE = { ok: "ok", review: "warn", duplicate: "error" };

  function buildSupplementCards(client, hooks) {
    var state = { parents: [], checked: null };
    var semesters = (AHS.WorkspaceData && AHS.WorkspaceData.semesters) || [];
    function semesterName(id) {
      var s = semesters.filter(function (x) { return x.id === id; })[0];
      return s ? s.name : (id || "");
    }

    /* 1 選擇教材與題數 */
    var materialSel = el("select", { class: "upl-input" });
    var countInput = el("input", { class: "upl-input", type: "number", min: "1", max: "40", value: "20" });
    var diff = {
      "易": el("input", { class: "upl-input", type: "number", min: "0", max: "40" }),
      "中等": el("input", { class: "upl-input", type: "number", min: "0", max: "40" }),
      "難": el("input", { class: "upl-input", type: "number", min: "0", max: "40" })
    };
    function autoDifficulty() {
      var n = Math.max(0, Math.floor(Number(countInput.value) || 0));
      diff["易"].value = String(Math.round(n * 0.3));
      diff["難"].value = String(Math.round(n * 0.2));
      diff["中等"].value = String(n - Number(diff["易"].value) - Number(diff["難"].value));
    }
    countInput.addEventListener("input", autoDifficulty);
    autoDifficulty();
    var modeLocal = el("input", { type: "radio", name: "upl-sup-mode", value: "local", checked: "checked" });
    /* 2026-10-01: 歷屆試題 — official past exam questions pasted verbatim with
       「出處：」 lines; official answers, so no independent solve. */
    var modePast = el("input", { type: "radio", name: "upl-sup-mode", value: "past" });
    function mode() { return modePast.checked ? "past" : "local"; }
    var subjectHint = el("p", { class: "upl-hint upl-hint--warn", hidden: "hidden" });
    function selectedParent() {
      return state.parents.filter(function (p) { return p.materialId === materialSel.value; })[0] || null;
    }
    function updateSubjectHint() {
      var p = selectedParent();
      if (p && CALC_SUBJECTS.indexOf(p.subject) !== -1 && mode() === "local") {
        subjectHint.textContent = p.subject + "的計算與圖表題答案出錯的機率較高，請逐題看過被標示的題目。";
        subjectHint.removeAttribute("hidden");
      } else {
        subjectHint.setAttribute("hidden", "hidden");
      }
    }
    materialSel.addEventListener("change", updateSubjectHint);
    [modeLocal, modePast].forEach(function (r) { r.addEventListener("change", function () { updateSubjectHint(); updateSolverFields(); }); });

    var promptStatus = el("p", { class: "upl-status" });
    var promptPreview = el("div");
    function refresh(preselect) {
      client.supplementParents().then(function (r) {
        if (r.error) { status(promptStatus, r.error.message, "error"); return; }
        state.parents = r.data.materials || [];
        var keep = materialSel.value;
        AHS.UI.mount(materialSel, el("option", { value: "", text: state.parents.length ? "（選擇要加題的教材）" : "（沒有已上架的教材）" }));
        state.parents.slice().sort(function (a, b) {
          return String(b.semester).localeCompare(String(a.semester)) || String(a.subject).localeCompare(String(b.subject));
        }).forEach(function (p) {
          materialSel.appendChild(el("option", {
            value: p.materialId,
            text: semesterName(p.semester) + "・" + p.subject + "・" + (p.chapter || "") + (p.unit ? " " + p.unit : "") +
              "（" + p.materialId + "，原有 " + p.questionCount + " 題" + (p.supplementCount ? "、已補 " + p.supplementCount + " 題" : "") + "）"
          }));
        });
        if (preselect) { materialSel.value = preselect; } else if (keep) { materialSel.value = keep; }
        updateSubjectHint();
      });
    }
    var authorBtn = button("由本機模型 A 出題", "primary", function () {
      if (!materialSel.value) { status(promptStatus, "請先選擇教材。", "error"); return; }
      if (mode() === "past") { status(promptStatus, "歷屆試題請直接在步驟 2 貼上官方題目，不需要出題。", "error"); return; }
      var payload = { parentId: materialSel.value, count: Number(countInput.value), difficulty: {} };
      Object.keys(diff).forEach(function (k) { payload.difficulty[k] = Number(diff[k].value) || 0; });
      client.supplementAuthorPrompt(payload).then(function (r) {
        if (r.error) { status(promptStatus, r.error.message, "error"); return; }
        AHS.UI.mount(promptPreview, el("details", { class: "upl-details" }, [
          el("summary", { text: "預覽出題 Prompt" }),
          el("pre", { class: "upl-pre", text: r.data.prompt })
        ]));
        var plan = "出 " + r.data.count + " 題：易 " + r.data.difficulty["易"] + "、中等 " + r.data.difficulty["中等"] +
          "、難 " + r.data.difficulty["難"] + "；已避開既有 " + r.data.existingCount + " 題";
        authorBtn.disabled = true;
        status(promptStatus, "本機模型 A 出題中（" + plan + "）…約需數分鐘，請勿關閉本頁。");
        waitLocalJob(client, { kind: "author", prompt: r.data.prompt }).then(function (result) {
          authorBtn.disabled = false;
          authorText.value = result.text;
          status(promptStatus, "本機模型 A（" + result.model + "）已出題（" + plan + "），結果在步驟 2，可先檢視或修改。", "ok");
        }, function (e) { authorBtn.disabled = false; status(promptStatus, "本機模型出題失敗：" + e.message, "error"); });
      });
    });
    var pickCard = card("1　選擇教材與題數", "補充題目會存成一份新的「補充題庫」，發布後併入該課題庫；原本的教材資料不會被修改。", [
      el("div", { class: "upl-grid" }, [
        field("教材", materialSel), field("題數（1～40）", countInput),
        field("易", diff["易"]), field("中等", diff["中等"]), field("難", diff["難"])
      ]),
      el("div", { class: "upl-radios" }, [
        el("label", { class: "upl-radio" }, [modeLocal, el("span", { text: "本機模型 A 出題，本機模型 B 與 Claude 新對話各自獨立作答核對（Claude 只做最後檢核）" })]),
        el("label", { class: "upl-radio" }, [modePast, el("span", { text: "歷屆試題：逐字貼上官方題目與官方答案，每題加上「出處：年度、考試、考科、題號」「對應課程：第X章 …」（至少對應到課）「對應程度：完全對應／部分對應」，可另加「對應節次：」「對應說明：」（不需獨立作答）" })])
      ]),
      subjectHint,
      el("div", { class: "upl-actions" }, [authorBtn]),
      promptStatus,
      promptPreview
    ]);

    /* 2 貼上出題結果 */
    var authorText = el("textarea", { class: "upl-textarea", rows: "14", placeholder: "本機模型 A 的出題結果會出現在這裡（可修改）；歷屆試題請直接貼上。" });
    var solverPromptStatus = el("p", { class: "upl-status" });
    var solverPromptPreview = el("div");
    var solverBtn = button("擷取題目、本機模型 B 作答並複製 Claude 作答 Prompt", "primary", function () {
      client.supplementSolverPrompt({ authorText: authorText.value }).then(function (r) {
        if (r.error) { status(solverPromptStatus, r.error.message, "error"); return; }
        AHS.UI.mount(solverPromptPreview, el("div", {}, [
          r.data.warnings.length ? el("ul", { class: "upl-warnings" }, r.data.warnings.map(function (w) { return el("li", { text: w }); })) : null,
          el("details", { class: "upl-details" }, [
            el("summary", { text: "預覽作答 Prompt（只有題目，沒有答案）" }),
            el("pre", { class: "upl-pre", text: r.data.prompt })
          ])
        ]));
        if (mode() === "past") { status(solverPromptStatus, "擷取到 " + r.data.count + " 題（歷屆試題不需要獨立作答）。", "ok"); return; }
        var where = "請開一個新的 Claude 對話貼上作答 Prompt（最後檢核），再把作答結果貼到下一步。";
        var copied = copyText(r.data.prompt).then(function () { return "作答 Prompt 已複製。"; }, function () { return "瀏覽器不允許複製，請展開下方預覽手動複製。"; });
        solverBtn.disabled = true;
        copied.then(function (msg) { status(solverPromptStatus, "擷取到 " + r.data.count + " 題。" + msg + where + "本機模型 B 作答中…", "ok"); });
        waitLocalJob(client, { kind: "solve", prompt: r.data.prompt }).then(function (result) {
          solverBtn.disabled = false;
          solverFields[0].input.value = result.text;
          copied.then(function (msg) { status(solverPromptStatus, "擷取到 " + r.data.count + " 題。本機模型 B（" + result.model + "）已作答（步驟 3）。" + msg + where, "ok"); });
        }, function (e) { solverBtn.disabled = false; status(solverPromptStatus, "本機模型 B 作答失敗：" + e.message + "（仍可只用 Claude 作答核對）", "error"); });
      });
    });
    var authorCard = card("2　貼上出題結果", "引擎會擷取題號、選項、答案、詳解、知識點與難度；格式不完整的題目不收錄，並列在警告中。", [
      field("出題結果（本機模型 A；可修改）", authorText),
      el("div", { class: "upl-actions" }, [solverBtn]),
      solverPromptStatus,
      solverPromptPreview
    ]);

    /* 3 貼上獨立作答結果 */
    var solverFields = [
      { id: "local-b", name: "本機模型 B" },
      { id: "claude-fresh", name: "Claude（新對話，最後檢核）" }
    ].map(function (s) {
      s.input = el("textarea", { class: "upl-textarea", rows: "6", placeholder: "例如：\nQ1：B\nQ2：D" });
      s.field = field(s.name + " 作答結果", s.input);
      return s;
    });
    function updateSolverFields() {
      solverFields.forEach(function (s) {
        var show = mode() !== "past";
        if (show) { s.field.removeAttribute("hidden"); } else { s.field.setAttribute("hidden", "hidden"); }
      });
    }
    updateSolverFields();
    function currentSolvers() {
      if (mode() === "past") { return []; }
      return solverFields.map(function (s) { return { id: s.id, text: s.input.value }; });
    }
    var checkStatus = el("p", { class: "upl-status" });
    var resultSlot = el("div", { class: "upl-sup-results" });
    var checkBtn = button("核對", "primary", function () {
      if (!materialSel.value) { status(checkStatus, "請先在步驟 1 選擇教材。", "error"); return; }
      var snapshot = { parentId: materialSel.value, authorText: authorText.value, solvers: currentSolvers(), mode: mode(), pastExam: mode() === "past" };
      if (!snapshot.pastExam && !snapshot.solvers.some(function (s) { return s.text.trim(); })) {
        if (!window.confirm("還沒有貼上任何作答結果，所有題目都會標示為需人工確認。仍要核對嗎？")) { return; }
      }
      status(checkStatus, "核對中…");
      client.supplementCheck(snapshot).then(function (r) {
        if (r.error) { status(checkStatus, r.error.message, "error"); return; }
        state.checked = snapshot;
        status(checkStatus, "核對完成：一致 " + r.data.counts.ok + " 題、需人工確認 " + r.data.counts.review + " 題、重複 " + r.data.counts.duplicate + " 題。", "ok");
        renderResults(r.data);
      });
    });
    var solverCard = card("3　獨立作答結果", "本機模型 B 自動作答；Claude 新對話的作答是最後檢核。作答者看不到出題答案；任何一方答案和出題不一致、或認為題目有問題時，會標示為需人工確認。", [
      el("div", { class: "upl-drafts" }, solverFields.map(function (s) { return s.field; })),
      el("div", { class: "upl-actions" }, [checkBtn]),
      checkStatus
    ]);

    /* 4 核對結果 */
    var createStatus = el("p", { class: "upl-status" });
    var createBtn = button("建立補充題庫草稿", "primary", function () {
      var accept = Array.prototype.filter.call(resultSlot.querySelectorAll("input[type=checkbox]"), function (c) { return c.checked; })
        .map(function (c) { return Number(c.value); });
      if (!state.checked || !accept.length) { status(createStatus, "請先核對並勾選要加入的題目。", "error"); return; }
      createBtn.disabled = true;
      status(createStatus, "建立中…");
      client.createSupplementDraft({
        parentId: state.checked.parentId, authorText: state.checked.authorText, solvers: state.checked.solvers,
        mode: state.checked.mode, pastExam: state.checked.pastExam, accept: accept
      }).then(function (r) {
        createBtn.disabled = false;
        if (r.error) { status(createStatus, r.error.message, "error"); return; }
        status(createStatus, "已建立 " + r.data.materialId + "（" + r.data.questions.length + " 題）。", "ok");
        hooks.onDraft(r.data);
        refresh();
      });
    });
    function updateCreateLabel() {
      var n = resultSlot.querySelectorAll("input[type=checkbox]:checked").length;
      createBtn.textContent = "建立補充題庫草稿（已勾選 " + n + " 題）";
    }
    function renderResults(data) {
      AHS.UI.mount(resultSlot, el("ol", { class: "upl-questions" }, data.questions.map(function (q) {
        var box = el("input", { type: "checkbox", value: String(q.number) });
        if (q.status === "ok") { box.checked = true; }
        if (q.status === "duplicate") { box.disabled = true; }
        box.addEventListener("change", updateCreateLabel);
        var answers = (q.solverAnswers || []).map(function (a) {
          return a.name + "：" + (a.problem ? "認為有問題" : (a.key || "未作答"));
        });
        return el("li", { class: "upl-question upl-sup-item upl-sup-item--" + q.status }, [
          el("label", { class: "upl-sup-item__head" }, [
            box,
            el("span", { class: "upl-gate upl-gate--" + STATUS_TONE[q.status], text: STATUS_LABEL[q.status] }),
            el("span", { class: "upl-sup-item__no", text: "Q" + q.number })
          ]),
          el("p", { class: "upl-question__stem", text: q.question }),
          el("ul", { class: "upl-question__options" }, q.options.map(function (opt, i) {
            var isAnswer = OPTION_LETTERS[i] === q.answerKey;
            return el("li", { class: isAnswer ? "is-answer" : null, text: "(" + OPTION_LETTERS[i] + ") " + opt + (isAnswer ? "　✓ 出題答案" : "") });
          })),
          answers.length ? el("p", { class: "upl-hint", text: "獨立作答：" + answers.join("　") }) : null,
          q.reasons.length ? el("ul", { class: "upl-warnings" }, q.reasons.map(function (t) { return el("li", { text: t }); })) : null,
          q.reference ? el("p", { class: "upl-hint", text: "出處：" + q.reference }) : null,
          q.mapping && q.mapping.lesson
            ? el("p", { class: "upl-hint", text: "對應：" + q.mapping.lesson + (q.mapping.section ? " · " + q.mapping.section : "") + "（" + (q.mapping.fit || "未標示對應程度") + (q.mapping.note ? "：" + q.mapping.note : "") + "）" })
            : null,
          q.explanation ? el("p", { class: "upl-hint", text: "詳解：" + q.explanation }) : null,
          q.knowledgePoint || q.difficulty
            ? el("p", { class: "upl-hint", text: [q.knowledgePoint ? "知識點：" + q.knowledgePoint : "", q.difficulty ? "難度：" + q.difficulty : ""].filter(Boolean).join("　") })
            : null
        ]);
      })));
      updateCreateLabel();
    }
    var resultCard = card("4　核對結果與建立草稿", "核對一致的題目已預先勾選。需人工確認的題目請看過原因與詳解，確定正確才勾選；重複的題目不能加入。", [
      resultSlot,
      el("div", { class: "upl-actions" }, [createBtn]),
      createStatus
    ]);

    return { cards: [pickCard, authorCard, solverCard, resultCard], refresh: refresh };
  }

  function create(options) {
    el = AHS.UI.el;
    if (!options || !options.isAdmin) { return adminOnly(); }
    var client = options.client;
    var data = AHS.WorkspaceData || { schools: [], semesters: [] };
    var state = { sessionId: null, finalFilename: null, draft: null, polling: false };

    /* ---- 0. 引擎狀態 --------------------------------------------------- */
    var engineStatus = el("p", { class: "upl-status" });
    var engineUrl = el("input", { class: "upl-input", type: "url", value: client.displayUrl() });
    function checkEngine() {
      status(engineStatus, "檢查中…");
      client.health().then(function (r) {
        if (r.error) { status(engineStatus, r.error.message, "error"); return; }
        status(engineStatus,
          "已連線（引擎 v" + r.data.version + "）· MinerU OCR：" + (r.data.mineru ? "運作中" : "未啟動，改用 Tesseract") +
          " · 本地 Qwen 裁決：" + (r.data.ollama ? "運作中" : "未啟動，將以規則拼接並標示需人工覆核"),
          r.data.ollama && r.data.mineru ? "ok" : "warn");
        refreshCatalog();
        refreshDrafts();
      });
    }
    var engineControls = client.servedByEngine()
      ? [el("p", { class: "upl-hint", text: "本頁由教材上傳引擎直接提供（" + client.displayUrl() + "）。" })]
      : [
        field("引擎網址", engineUrl),
        el("p", { class: "upl-hint", text: "建議改從 http://localhost:3000/upload.html 開啟本頁（由引擎直接提供，不受瀏覽器跨網域限制）。" })
      ];
    var engineCard = card("教材上傳引擎", "教材的 OCR 與 AI 交叉審議在這台電腦的 Docker 內執行（原 AI-Study-Council）。尚未啟動請先執行 ai-engine\\council\\啟動教材上傳引擎.bat。",
      engineControls.concat([
        el("div", { class: "upl-actions" }, [button("重新檢查連線", null, function () {
          if (!client.servedByEngine()) { client.setBaseUrl(engineUrl.value); }
          checkEngine();
        })]),
        engineStatus
      ]));

    /* ---- 1. 教材資訊 ---------------------------------------------------- */
    var schoolSel = select(data.schools, data.schools[0] && data.schools[0].id);
    var semesterSel = select(data.semesters, "g2s1");
    var subjectSel = select(Object.keys(AHS.Subjects || {}).map(function (k) {
      return { id: AHS.Subjects[k].name, name: AHS.Subjects[k].name };
    }));
    var gradeSel = select(GRADES.map(function (g) { return { id: g, name: g }; }), "高二");
    var chapterInput = el("input", { class: "upl-input", type: "text", placeholder: "例如：第一章 三角函數" });
    var unitInput = el("input", { class: "upl-input", type: "text", placeholder: "例如：1-1 弧度量（可空白）" });
    var typeSel = select(MATERIAL_TYPES, "TEXTBOOK");
    function schoolName() {
      var s = data.schools.filter(function (x) { return x.id === schoolSel.value; })[0];
      return s ? s.name : schoolSel.value;
    }
    function typeName() {
      return MATERIAL_TYPES.filter(function (t) { return t.id === typeSel.value; })[0].name;
    }
    function councilMeta() {
      return {
        school: schoolName(), grade: gradeSel.value, subject: subjectSel.value,
        unit: [chapterInput.value.trim(), unitInput.value.trim()].filter(Boolean).join(" "),
        category: typeName()
      };
    }
    function platformMeta() {
      return {
        school: schoolSel.value, semester: semesterSel.value, subject: subjectSel.value, grade: gradeSel.value,
        chapter: chapterInput.value.trim(), unit: unitInput.value.trim(), materialType: typeSel.value
      };
    }
    var metaCard = card("1　教材資訊", "決定教材上架後出現在哪個學校、學期與科目。", [
      el("div", { class: "upl-grid" }, [
        field("學校", schoolSel), field("學期", semesterSel), field("科目", subjectSel), field("年級", gradeSel),
        field("章節", chapterInput), field("單元", unitInput), field("教材類型", typeSel)
      ])
    ]);

    /* ---- 2. 上傳原始檔 --------------------------------------------------- */
    var fileInput = el("input", { class: "upl-input", type: "file", multiple: "multiple", accept: UPLOAD_ACCEPT });
    var uploadStatus = el("p", { class: "upl-status" });
    var sourceText = el("textarea", { class: "upl-textarea", rows: "10", placeholder: "上傳後會出現解析出的教材本文，可直接修正 OCR 錯字；也可以直接貼上 MinerU 解析好的 Markdown。" });
    var imagesSlot = el("div", { class: "upl-images" });
    function refreshImages() {
      /* 2026-11-16 B1：這次上傳由 MinerU 切出的圖存在上傳批次底下；沒有時沿用舊的教材識別碼位置。 */
      var id = state.imagesId || sanitizeSegment(councilMeta().school) + "_" + [councilMeta().grade, councilMeta().subject, councilMeta().unit, councilMeta().category].map(sanitizeSegment).join("_");
      client.images(id).then(function (r) {
        AHS.UI.mount(imagesSlot, el("span"));
        if (r.error || !r.data || !r.data.count) { return; }
        AHS.UI.mount(imagesSlot, el("a", {
          class: "upl-link", href: client.imagesZipUrl(id), text: "下載本教材 " + r.data.count + " 張圖片（.zip；出題引用圖時用【圖：檔名】）"
        }));
      });
    }
    /* 2026-11-21：解析期間每 2 秒問引擎一次進度（MinerU 逐頁處理，長 PDF 可能數分鐘）。 */
    function progressText(p) {
      var text = "解析中…";
      if (p.fileCount > 1 && p.file) { text += "第 " + p.file + "／" + p.fileCount + " 個檔案"; }
      if (p.filename) { text += "（" + p.filename + "）"; }
      if (p.stage === "ocr") {
        text += p.total ? " MinerU OCR " + p.current + "／" + p.total : " MinerU OCR 處理中";
      }
      return text + "。掃描檔每頁可能需要一分鐘以上。";
    }
    var uploadBtn = button("上傳並解析", "primary", function () {
      if (!fileInput.files || !fileInput.files.length) { status(uploadStatus, "請先選擇檔案。", "error"); return; }
      /* 2026-11-28：不支援的格式先在這裡擋下。送到引擎才被拒絕時，瀏覽器還在送其他檔案，
         Chrome 只看到連線被切斷，會誤顯示「無法連線到教材上傳引擎」。 */
      var unsupported = Array.prototype.filter.call(fileInput.files, function (f) {
        var m = /\.[^.]+$/.exec(f.name);
        return !m || UPLOAD_EXTENSIONS.indexOf(m[0].toLowerCase()) === -1;
      }).map(function (f) { return f.name; });
      if (unsupported.length) {
        status(uploadStatus, "不支援這些檔案的格式：" + unsupported.join("、") + "。可上傳 " + UPLOAD_EXTENSIONS.join(" ") + "。", "error");
        return;
      }
      uploadBtn.disabled = true;
      var progressId = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      status(uploadStatus, "解析中…掃描檔會交給 MinerU OCR，每頁可能需要一分鐘以上。");
      var timer = window.setInterval(function () {
        client.uploadProgress(progressId).then(function (pr) {
          if (!pr.error && pr.data && pr.data.stage !== "finished" && pr.data.stage !== "error") {
            status(uploadStatus, progressText(pr.data));
          }
        });
      }, 2000);
      client.upload(fileInput.files, progressId).then(function (r) {
        window.clearInterval(timer);
        uploadBtn.disabled = false;
        if (r.error) { status(uploadStatus, r.error.message, "error"); return; }
        state.sessionId = r.data.sessionId;
        state.imagesId = r.data.imageCount ? r.data.imagesId : null;
        /* 單一檔案的本文沒有檔案標記，原文辨識協助包以這個檔名代表整份本文 */
        state.uploadFilename = r.data.files && r.data.files.length === 1 ? r.data.files[0].filename : null;
        sourceText.value = r.data.text || "";
        status(uploadStatus, "完成：" + r.data.files.map(function (f) { return f.filename + "（" + f.length + " 字）"; }).join("、") +
          "。原始檔已保存，建立教材包時會放進 source/。" + pageQualityNote(r.data.pageQuality), "ok");
        refreshImages();
        loadPageReview(r.data.structuredCount ? r.data.sessionId : null);
      });
    });
    /* 2026-11-21 逐頁預覽與校正：原頁圖片＋MinerU 辨識出的各區塊文字；改過的區塊在「套用」時
       回寫到教材本文（只在該段文字於本文中恰好出現一次才替換，避免改錯地方）。 */
    var pageStatus = el("p", { class: "upl-status" });
    var pageList = el("div", { class: "upl-pages" });
    var pageEdits = [];
    var pageFlags = {};
    var reviewSessionId = null;
    /* 2026-11-21 漏圖補查結果：本機視覺模型看到的圖比 MinerU 抽到的多時，在該頁標示提醒（只是提示，請對照原圖確認）。 */
    function applyRecheck(data) {
      var suspect = 0;
      var failed = 0;
      (data.files || []).forEach(function (file) {
        file.pages.forEach(function (page) {
          var flag = pageFlags[file.index + ":" + page.page];
          if (!flag) { return; }
          if (page.error) { failed += 1; status(flag, "補查失敗：" + page.error, "warn"); return; }
          if (page.suspect) {
            suspect += 1;
            status(flag, "⚠ 這頁可能有圖沒被抽到（MinerU " + page.mineruCount + " 張，補查看到 " + page.vlmCount + " 張" +
              (page.labels && page.labels.length ? "：" + page.labels.join("、") : "") + "）。請對照左邊原圖，缺的圖請手動補上。", "warn");
          } else {
            status(flag, "補查：圖片數量一致（" + page.mineruCount + " 張）。", "ok");
          }
        });
      });
      return { suspect: suspect, failed: failed };
    }
    function loadPageReview(sessionId) {
      pageEdits = [];
      pageFlags = {};
      reviewSessionId = sessionId;
      AHS.UI.mount(pageList, el("span"));
      if (!sessionId) { status(pageStatus, "這次上傳沒有 MinerU 的逐頁資料（可能是 .md／.txt，或 MinerU 未啟動而改用 Tesseract）。"); return; }
      status(pageStatus, "讀取逐頁資料中…");
      client.uploadPages(sessionId).then(function (r) {
        if (r.error || !r.data) { status(pageStatus, r.error ? r.error.message : "讀取失敗", "error"); return; }
        var total = 0;
        r.data.files.forEach(function (file) {
          var shown = el("div", { class: "upl-pages__file" }, [el("h3", { class: "upl-pages__title", text: file.filename + "（" + file.pageCount + " 頁）" })]);
          file.pages.forEach(function (page) {
            var blocks = el("div", { class: "upl-pages__blocks" });
            var flag = el("p", { class: "upl-status" });
            pageFlags[file.index + ":" + page.page] = flag;
            blocks.appendChild(flag);
            page.blocks.forEach(function (block) {
              if (block.type === "image") { blocks.appendChild(el("p", { class: "upl-hint", text: "［圖片］" + (block.image || "") })); return; }
              if (!block.text) { return; }
              if (block.type === "text" || block.type === "equation") {
                var box = el("textarea", { class: "upl-textarea upl-pages__block", rows: String(Math.min(6, Math.max(2, Math.ceil(block.text.length / 40)))) });
                box.value = block.text;
                pageEdits.push({ orig: block.text, box: box });
                blocks.appendChild(box);
              } else {
                blocks.appendChild(el("p", { class: "upl-hint", text: "［表格］" + block.text }));
              }
            });
            var img = el("img", { class: "upl-pages__img", loading: "lazy", alt: "第 " + page.page + " 頁原圖", src: client.pageImageUrl(sessionId, file.index, page.page) });
            shown.appendChild(el("div", { class: "upl-pages__row" }, [img, blocks]));
            total += 1;
          });
          pageList.appendChild(shown);
          pageList.appendChild(el("a", { class: "upl-link", href: client.structuredUrl(sessionId, file.index, "content_list"), text: "下載 " + file.filename + " 的 MinerU 結構化輸出（content_list.json）" }));
        });
        status(pageStatus, total ? "共 " + total + " 頁。改完按「套用校正到教材本文」。" : "沒有可顯示的頁面。");
        client.recheckResult(sessionId).then(function (rr) { if (!rr.error && rr.data) { applyRecheck(rr.data); } });
      });
    }
    var recheckBtn = button("補查漏圖（本機視覺模型）", null, function () {
      if (!reviewSessionId) { status(pageStatus, "請先上傳含 MinerU 逐頁資料的檔案。", "error"); return; }
      var progressId = "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      recheckBtn.disabled = true;
      status(pageStatus, "補查中…本機視覺模型逐頁檢查，每頁約數十秒，不會使用雲端 token。");
      client.recheckStart(reviewSessionId, progressId).then(function (started) {
        if (started.error) { recheckBtn.disabled = false; status(pageStatus, started.error.message, "error"); return; }
        var poll = window.setInterval(function () {
          client.uploadProgress(progressId).then(function (pr) {
            if (pr.error || !pr.data) { return; }
            var p = pr.data;
            if (p.stage === "recheck" && p.total) {
              status(pageStatus, "補查中…" + (p.fileCount > 1 ? "第 " + p.file + "／" + p.fileCount + " 個檔案，" : "") + "第 " + p.current + "／" + p.total + " 頁");
            } else if (p.stage === "finished" || p.stage === "error") {
              window.clearInterval(poll);
              recheckBtn.disabled = false;
              if (p.stage === "error") { status(pageStatus, "補查失敗：" + (p.error || "未知原因"), "error"); return; }
              client.recheckResult(reviewSessionId).then(function (rr) {
                if (rr.error || !rr.data) { status(pageStatus, rr.error ? rr.error.message : "讀取補查結果失敗", "error"); return; }
                var sum = applyRecheck(rr.data);
                status(pageStatus, "補查完成：" + sum.suspect + " 頁可能漏圖" + (sum.failed ? "、" + sum.failed + " 頁補查失敗" : "") + "。",
                  sum.suspect || sum.failed ? "warn" : "ok");
              });
            }
          });
        }, 3000);
      });
    });
    var applyPagesBtn = button("套用校正到教材本文", null, function () {
      var applied = 0;
      var missed = 0;
      pageEdits.forEach(function (edit) {
        var next = edit.box.value;
        if (next === edit.orig) { return; }
        var parts = sourceText.value.split(edit.orig);
        if (parts.length !== 2) { missed += 1; return; }
        sourceText.value = parts[0] + next + parts[1];
        edit.orig = next;
        applied += 1;
      });
      status(pageStatus, applied + " 處已套用" + (missed ? "；" + missed + " 處在本文中找不到唯一對應段落（已被其他修改改動或重複出現），請直接改上方教材本文" : "") + "。",
        missed ? "warn" : "ok");
    });
    var pageReviewBox = el("details", { class: "upl-images" }, [
      el("summary", { text: "逐頁預覽與校正（MinerU 辨識結果對照原頁）" }),
      el("div", { class: "upl-actions" }, [applyPagesBtn, recheckBtn]),
      pageStatus, pageList
    ]);
    var promptStatus = el("p", { class: "upl-status" });
    function buildPrompt() {
      var m = councilMeta();
      return [
        "你是一位資深學科教材編審 AI，請依照以下規範，針對提供的教材本文進行深度分析，並產出完整的十五大章節結構文件。",
        "",
        "【15 大章節架構】（請依序完整輸出，標題請完全比照下列格式，含圈號數字）"
      ].concat(sectionsFor(m.subject)).concat([
        /* 2026-11-28 AHS-B1：11/26 實跑本機模型 B 只寫 12/15 節、標題「# ①」與「①」混用。 */
        "- 15 節都必須輸出，不可省略任何一節；沒有內容的節寫「SOURCE 未提供」。",
        "- 每一節標題一律寫成「## ①核心概念」這種格式（兩個井號＋圈號數字＋章節名稱），不要用其他層級、粗體或省略井號。",
        ""
      ]).concat(STEM_SUBJECTS.indexOf(m.subject) !== -1 ? STEM_RULES : []).concat([
        "【練習題格式】（學習平台會自動匯入題庫，格式請務必一致）",
        /* 2026-10-06：10 → 30 題（每科題庫目標 100 題；一次出更多容易被 AI 回覆長度截斷，
           其餘發布後用「為既有教材加題」補足，發布完成時會提示還差幾題） */
        "請在⑪常考題型中，另外出 30 題單選練習題（題號 Q1～Q30，請全部出完，不可省略），每題格式如下：",
        "**Q1.** 題幹",
        "(A) 選項　(B) 選項　(C) 選項　(D) 選項",
        "答案：B",
        "詳解：解題說明",
        "",
        /* 2026-11-16 A7：附圖引用規則。引擎建立草稿時依檔名把圖複製進教材包並顯示在題目上。 */
        "【附圖規則】",
        "- 題目需要看圖才能作答時，在題幹最後加上【圖：檔名】，檔名必須與對話中附上的圖片檔名完全相同（例如【圖：p12_01.jpg】），一題可有多張。",
        "- 沒有對應圖片可引用時，不得出「如圖」「附圖」的題目，改出不需看圖的題目。",
        "- 圖片看不清楚的部分不可推測，請寫「圖片無法辨識」並避免以該處出題。",
        "",
        /* 2026-11-17 B2：變式題。平台匯入時存成題庫的變式題（variantOf 指向原題），一般抽題不會出現，
           只給錯題本「做一題類題」使用，讓學生答錯後練的是同觀念的新題而不是背原題答案。 */
        "【變式題】",
        "- 在全部 30 題之後，另起一個標題為「## 變式題」的章節，替每一題各出 1 題變式題（V1～V30，V5 代表 Q5 的變式題）。",
        "- 變式題與原題考同一個知識點與題型，但要換情境、數值或選項，題幹不可與原題相同；仍是單選、只有一個正解。",
        "- 變式題格式與一般題相同，每一題都必須有 (A)(B)(C)(D) 選項、答案與詳解，寫在該題下方；只有題幹的變式題無法收錄：",
        "**V1.** 題幹",
        "(A) 選項　(B) 選項　(C) 選項　(D) 選項",
        "答案：B",
        "詳解：解題說明",
        "- 原題需要看圖的，變式題不要引用圖片，改出不需看圖的題目。",
        "",
        "【自評規範】",
        "- 完成全部十五章節後，請針對本次輸出進行嚴格自我審查（是否有遺漏、錯誤、內容空泛等問題）。",
        "- 於⑮Final Score章節，以「Self-QA: XX/100」格式標註自評分數，且必須達到 95 分（含）以上；若初次自評未達 95 分，請自行修正後再輸出最終版本。",
        "- 教材本文沒有的資訊（作者、出版社、課綱版本等）請寫「SOURCE 未提供」，不得自行推測。",
        "",
        "【教材 metadata】",
        "學校：" + m.school, "年級：" + m.grade, "科目：" + m.subject, "單元：" + m.unit, "教材類別：" + m.category,
        "",
        "【教材本文（SOURCE）】",
        "<<<",
        sourceText.value.trim() || "（尚未提供教材本文）",
        ">>>",
        "",
        "【多模態圖片對齊指引】",
        "若有附上教材圖片，請依據圖片幾何資訊解題，並於輸出時以 ![圖號](images/檔名.png) 標註。",
        "",
        "請開始依序輸出完整十五章節內容。"
      ]).join("\n");
    }
    /* 2026-10-14 原文辨識協助包：本機 Qwen 找出 OCR 看不清楚的照片。2026-11-26 AHS-A3 起由本機視覺模型
       逐字轉錄這些照片（不再交給 ChatGPT／Claude 網頁版），再與 OCR 逐句比對；不一致的句子由管理者選定。 */
    var ocrStatus = el("p", { class: "upl-status" });
    var ocrPages = el("div");
    var ocrConflicts = el("div");
    var ocrLocal = el("textarea", { class: "upl-textarea", rows: "6", placeholder: "本機視覺模型的轉錄會出現在這裡（以「=== 檔名 ===」分段，可修改）" });
    var ocrFiles = [];
    var ocrCheckBtn = button("檢查 OCR 看不清楚的頁面", null, function () {
      if (!sourceText.value.trim()) { status(ocrStatus, "請先上傳或貼上教材本文。", "error"); return; }
      ocrCheckBtn.disabled = true;
      status(ocrStatus, "本機 Qwen 檢查中…每段約需數十秒。");
      client.ocrHelpCheck(sourceText.value, state.uploadFilename).then(function (r) {
        ocrCheckBtn.disabled = false;
        if (r.error) { status(ocrStatus, r.error.message, "error"); return; }
        ocrFiles = (r.data.pages || []).map(function (p) { return p.file; }).filter(Boolean);
        AHS.UI.mount(ocrPages, el("ul", {}, (r.data.pages || []).map(function (p) {
          return el("li", { text: (p.file || "（整份教材本文）") + "：" + p.reasons.join("；") });
        })));
        if (!r.data.pages || !r.data.pages.length) {
          status(ocrStatus, r.data.checked ? "沒有找到看不清楚的頁面，不需要轉錄。" : "本機 Qwen 無法完成檢查（" + (r.data.reason || "未知原因") + "），可稍後再試。", r.data.checked ? "ok" : "error");
          return;
        }
        status(ocrStatus, "共 " + r.data.pages.length + " 頁需要轉錄。" + (ocrFiles.length ? "按「本機轉錄」由本機視覺模型逐字轉錄。" : "上傳時沒有檔名，無法自動轉錄；請直接修改教材本文。"), "ok");
      });
    });
    var ocrTranscribeBtn = button("本機轉錄", null, function () {
      if (!ocrFiles.length) { status(ocrStatus, "請先檢查 OCR 看不清楚的頁面。", "error"); return; }
      if (!state.sessionId) { status(ocrStatus, "本機轉錄需要用本頁上傳的照片；請先在上方上傳原始檔。", "error"); return; }
      ocrTranscribeBtn.disabled = true;
      status(ocrStatus, "本機視覺模型轉錄中…每頁約需數十秒。");
      waitLocalJob(client, { kind: "transcribe", sessionId: state.sessionId, files: ocrFiles }, function (job) {
        if (job.step) { status(ocrStatus, "本機視覺模型轉錄中（" + job.step + " 頁）…"); }
      }).then(function (result) {
        ocrTranscribeBtn.disabled = false;
        ocrLocal.value = result.text;
        status(ocrStatus, "已轉錄（" + result.model + "）" + (result.failed.length ? "；" + result.failed.length + " 頁失敗：" + result.failed.map(function (f) { return f.name; }).join("、") : "") + "。請檢視後按「比對並套用到教材本文」。", result.failed.length ? "warn" : "ok");
      }, function (e) { ocrTranscribeBtn.disabled = false; status(ocrStatus, "本機轉錄失敗：" + e.message, "error"); });
    });
    function showConflicts(conflicts) {
      AHS.UI.mount(ocrConflicts, el("div", {}, conflicts.map(function (c) {
        var row = el("div", { class: "upl-status" });
        var choices = [["保留 OCR", c.local], ["用本機轉錄", c.transcribed], ["用第二份轉錄", c.second]].filter(function (x) { return x[1]; });
        AHS.UI.mount(row, el("div", {}, [
          el("p", { text: c.id + "（" + c.file + "）　OCR：" + c.local + (c.transcribed ? "　／本機轉錄：" + c.transcribed : "") + (c.second ? "　／第二份轉錄：" + c.second : "") }),
          el("div", { class: "upl-actions" }, choices.map(function (x) {
            return button(x[0], null, function () {
              if (x[1] !== c.local) sourceText.value = sourceText.value.replace(c.local, x[1]);
              AHS.UI.mount(row, el("p", { class: "upl-status", text: c.id + " 已選定：" + x[1] }));
            });
          }))
        ]));
        return row;
      })));
    }
    var ocrMergeBtn = button("比對並套用到教材本文", "primary", function () {
      if (!ocrLocal.value.trim()) { status(ocrStatus, "請先按「本機轉錄」。", "error"); return; }
      client.ocrHelpMerge({ sourceText: sourceText.value, filename: state.uploadFilename, local: ocrLocal.value }).then(function (r) {
        if (r.error) { status(ocrStatus, r.error.message, "error"); return; }
        sourceText.value = r.data.text;
        showConflicts(r.data.conflicts || []);
        status(ocrStatus, "自動更正 " + r.data.corrections.length + " 句、補回 " + r.data.additions.length + " 句" +
          (r.data.conflicts.length ? "；" + r.data.conflicts.length + " 句與 OCR 不一致，請在下面選定。" : "。") +
          "已寫回教材本文；若這份教材已審議過，請重新產生本機初稿並執行交叉審議。", "ok");
      });
    });
    var ocrHelpBox = el("details", { class: "upl-images" }, [
      el("summary", { text: "原文辨識協助包（OCR 有錯字或整頁辨識不出來時使用）" }),
      el("div", { class: "upl-actions" }, [ocrCheckBtn, ocrTranscribeBtn]),
      ocrStatus, ocrPages,
      field("本機轉錄", ocrLocal),
      el("div", { class: "upl-actions" }, [ocrMergeBtn]),
      ocrConflicts
    ]);
    var uploadCard = card("2　上傳原始檔", "支援 PDF、圖片（掃描或拍照的課本頁，含 iPhone 的 HEIC 照片）與 MinerU 解析好的 .md／.txt；多個檔案依檔名順序合併。", [
      field("選擇檔案", fileInput),
      el("div", { class: "upl-actions" }, [uploadBtn]),
      uploadStatus,
      field("教材本文（SOURCE）", sourceText),
      ocrHelpBox,
      pageReviewBox,
      imagesSlot
    ]);

    /* ---- 3. 本機初稿（2026-11-26 AHS-A3）：兩個本機模型依同一份 Prompt 各寫一份 ------------- */
    var drafts = {
      localA: el("textarea", { class: "upl-textarea", rows: "12" }),
      localB: el("textarea", { class: "upl-textarea", rows: "12" })
    };
    var promptPreviewPre = el("pre", { class: "upl-pre" });
    var writeBtn = button("由本機模型 A、B 撰寫初稿", "primary", function () {
      if (!sourceText.value.trim()) { status(promptStatus, "請先上傳或貼上教材本文。", "error"); return; }
      var filled = drafts.localA.value.trim() || drafts.localB.value.trim();
      if (filled && !window.confirm("步驟 3 已有初稿，重新撰寫會取代目前的內容。要繼續嗎？")) { return; }
      writeBtn.disabled = true;
      status(promptStatus, "本機模型撰寫初稿中…兩份依序產生，可能需要十幾分鐘，請勿關閉本頁。");
      waitLocalJob(client, { kind: "drafts", prompt: buildPrompt() }, function (job) {
        status(promptStatus, "本機模型 " + (job.step || "A") + " 撰寫初稿中…兩份依序產生，可能需要十幾分鐘，請勿關閉本頁。");
      }).then(function (result) {
        writeBtn.disabled = false;
        drafts.localA.value = result.localA;
        drafts.localB.value = result.localB;
        /* 2026-11-28 AHS-B1：引擎檢查初稿格式，缺漏時已請模型補寫一次；仍有缺漏就列出來。 */
        var issues = result.formatIssues || {};
        var lines = [["A", issues.localA], ["B", issues.localB]].filter(function (p) { return p[1] && p[1].length; })
          .map(function (p) { return "初稿 " + p[0] + "：" + p[1].join("；"); });
        status(promptStatus, "初稿完成（A：" + result.models.localA + "、B：" + result.models.localB + "）。" +
          (lines.length ? "格式仍有缺漏（已自動補寫一次）——" + lines.join("。") + "。可手動補齊後再執行步驟 4。" : "可先檢視，再執行步驟 4 的交叉審議。"),
          lines.length ? "error" : "ok");
      }, function (e) { writeBtn.disabled = false; status(promptStatus, "本機模型撰寫初稿失敗：" + e.message, "error"); });
    });
    var draftsCard = card("3　本機初稿", "兩個不同的本機模型（A、B）依同一份 Prompt 各寫一份初稿，全部在這台電腦產生；Claude 不寫初稿，只做最後檢核。", [
      el("div", { class: "upl-actions" }, [writeBtn]),
      promptStatus,
      el("div", { class: "upl-drafts" }, [
        field("本機模型 A 初稿", drafts.localA), field("本機模型 B 初稿", drafts.localB)
      ]),
      el("details", { class: "upl-details" }, [
        el("summary", { text: "預覽撰寫 Prompt" }),
        el("div", { class: "upl-actions" }, [button("產生預覽", null, function () { promptPreviewPre.textContent = buildPrompt(); })]),
        promptPreviewPre
      ])
    ]);

    /* ---- 4. 交叉審議 ---------------------------------------------------- */
    var councilStatus = el("p", { class: "upl-status" });
    var finalSlot = el("div", { class: "upl-final" });
    var catalogSel = el("select", { class: "upl-input" });

    /* 2026-10-04: Final.md 開頭的 frontmatter（school/grade/subject/unit/category）
       帶入步驟 1——教材包的學校、科目、章節以步驟 1 為準，帶入後判讀錯誤
       （例如第二章被寫成第三章）一眼就看得到，可直接在步驟 1 或 Final.md 修正。 */
    function frontmatterOf(content) {
      var m = /^﻿?---\r?\n([\s\S]*?)\r?\n---/.exec(content || "");
      var out = {};
      if (!m) { return out; }
      m[1].split(/\r?\n/).forEach(function (line) {
        var kv = /^([A-Za-z_]+)\s*:\s*(.*)$/.exec(line);
        if (kv) { out[kv[1].toLowerCase()] = kv[2].trim().replace(/^"(.*)"$/, "$1"); }
      });
      return out;
    }
    function pick(sel, value) {
      var opt = Array.prototype.filter.call(sel.options, function (o) { return o.value === value || o.textContent === value; })[0];
      if (opt) { sel.value = opt.value; }
      return !!opt;
    }
    function applyFrontmatter(content) {
      var fm = frontmatterOf(content);
      var filled = [];
      if (fm.school && pick(schoolSel, fm.school)) { filled.push("學校"); }
      if (fm.grade && pick(gradeSel, fm.grade)) { filled.push("年級"); }
      if (fm.subject && pick(subjectSel, fm.subject)) { filled.push("科目"); }
      if (fm.category && pick(typeSel, fm.category)) { filled.push("教材類型"); }
      if (fm.unit) {
        var chapter = fm.subject && fm.unit.indexOf(fm.subject) === 0 ? fm.unit.slice(fm.subject.length).trim() : fm.unit;
        chapterInput.value = chapter || fm.unit;
        unitInput.value = "";
        filled.push("章節");
      }
      return filled;
    }

    function showFinal(filename, gate, score, fillMeta) {
      state.finalFilename = filename;
      var editStatus = el("p", { class: "upl-status" });
      AHS.UI.mount(finalSlot, el("div", {}, [
        el("p", { class: "upl-final__name" }, [
          el("strong", { text: "Final：" }), filename,
          gate ? el("span", { class: "upl-gate upl-gate--" + (gate === "PASS" ? "ok" : "warn"), text: gate + (score != null ? " · " + score : "") }) : null
        ]),
        gate && gate !== "PASS" ? el("p", { class: "upl-hint upl-hint--warn", text: "Quality Gate 不是 PASS：建立草稿後請特別仔細檢查擷取結果再決定是否發布。" }) : null
      ]));
      client.finalContent(filename).then(function (r) {
        if (r.error) { status(editStatus, r.error.message, "error"); finalSlot.appendChild(editStatus); return; }
        var saved = r.data.content;
        var editor = el("textarea", { class: "upl-textarea upl-final__editor", rows: "20", spellcheck: "false" });
        editor.value = saved;
        var saveBtn = button("儲存修改", "primary", function () {
          if (editor.value === saved) { status(editStatus, "沒有修改。"); return; }
          saveBtn.disabled = true;
          status(editStatus, "儲存中…");
          client.saveFinal(filename, editor.value).then(function (s) {
            saveBtn.disabled = false;
            if (s.error) { status(editStatus, s.error.message, "error"); return; }
            saved = s.data.content;
            var filled = applyFrontmatter(saved);
            status(editStatus, "已存回 " + filename + "（引擎產出的原始版本保留為 " + s.data.backup + "）。" +
              (filled.length ? "步驟 1 已依修改後的內容更新：" + filled.join("、") + "。" : "") + "建立教材包草稿時會使用修改後的版本。", "ok");
          });
        });
        var revertBtn = button("還原未儲存的修改", null, function () {
          editor.value = saved;
          status(editStatus, "已還原為最後儲存的版本。");
        });
        finalSlot.appendChild(el("details", { class: "upl-details", open: "open" }, [
          el("summary", { text: "預覽與修改 Final.md" }),
          el("p", { class: "upl-hint", text: "內容有誤（例如章節判讀錯誤、OCR 錯字）可直接修改後按「儲存修改」。開頭 --- 之間的 unit、subject、grade 會帶入步驟 1。" }),
          editor,
          el("div", { class: "upl-actions" }, [saveBtn, revertBtn]),
          editStatus
        ]));
        /* 2026-10-12（審議改版第 1 階段）：沒有通過自動裁決的練習題 → Claude 最終審查包。
           不使用 API：複製審查包貼到 Claude 網頁版，再把回覆貼回來套用。 */
        client.practiceReview(filename).then(function (pr) {
          if (pr.error || !pr.data || !Array.isArray(pr.data.pending)) { return; }
          var d = pr.data;
          var reviewStatus = el("p", { class: "upl-status" });
          var summary = el("p", { class: "upl-hint", text: "練習題自動裁決：共 " + d.total + " 題，已收錄 " + d.accepted + " 題，待 Claude 最終審查 " + d.pending.length + " 題。" });
          var claims = d.claims || [];
          if (!d.pending.length && !claims.length) { finalSlot.appendChild(summary); return; }
          var promptBox = el("textarea", { class: "upl-textarea", rows: "10", readonly: "readonly", spellcheck: "false" });
          promptBox.value = d.prompt;
          var replyBox = el("textarea", { class: "upl-textarea", rows: "6", spellcheck: "false", placeholder: "把 Claude 的回覆貼在這裡（每題一行，例如「P1：正確」「P2：答案應為 C」「C1：成立」）" });
          var copyBtn = button("複製審查包", null, function () {
            promptBox.select();
            var done = function () { status(reviewStatus, "已複製。請貼到 Claude 網頁版，再把回覆貼回下方。", "ok"); };
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(promptBox.value).then(done, function () { document.execCommand("copy"); done(); });
            } else { document.execCommand("copy"); done(); }
          });
          var applyBtn = button("套用 Claude 審查結果", "primary", function () {
            if (!replyBox.value.trim()) { status(reviewStatus, "請先貼上 Claude 的回覆。", "error"); return; }
            applyBtn.disabled = true;
            status(reviewStatus, "套用中…");
            client.applyPracticeReview(filename, replyBox.value).then(function (r) {
              applyBtn.disabled = false;
              if (r.error) { status(reviewStatus, r.error.message, "error"); return; }
              saved = r.data.content;
              editor.value = saved;
              status(reviewStatus, "已套用：收錄 " + r.data.added + " 題、不收錄 " + r.data.dropped + " 題（刪除與無法判斷）" +
                (r.data.stillPending ? "，還有 " + r.data.stillPending + " 題沒有回覆，仍待審" : "") + "。Final.md 目前共 " + r.data.accepted + " 題練習題。" +
                (claims.length ? "陳述：確認 " + r.data.claimsConfirmed + " 條、刪除 " + r.data.claimsRemoved + " 條" + (r.data.claimsPending ? "、仍待審 " + r.data.claimsPending + " 條" : "") + "。" : ""), "ok");
            });
          });
          finalSlot.appendChild(el("details", { class: "upl-details", open: "open" }, [
            el("summary", { text: "待 Claude 判定（練習題 " + d.pending.length + " 題、陳述 " + claims.length + " 條）" }),
            summary,
            el("ul", { class: "upl-list" }, d.pending.map(function (p) { return el("li", { text: p.id + "　" + p.reason + "　" + p.question.slice(0, 40) }); })),
            claims.length ? el("ul", { class: "upl-list" }, claims.map(function (c) { return el("li", { text: c.id + "　" + (c.escalate ? "【兩次判斷或分段結論不一致】" : "") + c.claim.slice(0, 50) }); })) : null,
            el("p", { class: "upl-hint", text: "練習題：回覆「正確」或「答案應為 X」收進 Final.md，「刪除」與「無法判斷」不收錄。陳述：「成立」拿掉 ⚠️ 標記保留，「不成立」與「無法判斷」從 Final.md 刪除。" }),
            promptBox,
            el("div", { class: "upl-actions" }, [copyBtn]),
            replyBox,
            el("div", { class: "upl-actions" }, [applyBtn]),
            reviewStatus
          ]));
        });
        /* 2026-11-26 AHS-A3：Claude 最後檢核。引擎先用程式逐句對照教材本文（不耗 token）並標記，
           Claude 只逐句判定、不重寫；需修正時由本機模型只改被指出的句子，最多 2 輪，仍不通過標為需人工處理。 */
        var checkSlot = el("div");
        finalSlot.appendChild(checkSlot);
        function renderFinalCheck() {
          client.finalCheck(filename).then(function (fc) {
            if (fc.error || !fc.data) { return; }
            var d = fc.data;
            var checkStatus = el("p", { class: "upl-status" });
            var LABEL = { pending: "待檢核", needs_revision: "需修正", passed: "已通過", needs_human: "需人工處理" };
            var head = "Claude 最後檢核（" + LABEL[d.status] + "，已修正 " + d.revisionsDone + "／" + d.maxRevisions + " 輪；共 " + d.units + " 句，程式標記 " + d.flagged + " 句）";
            if (d.status === "passed" || d.status === "needs_human") {
              AHS.UI.mount(checkSlot, el("p", { class: "upl-hint" + (d.status === "passed" ? "" : " upl-hint--warn"),
                text: d.status === "passed" ? head + "：Claude 判定通過。" : head + "：修正 2 輪後仍未通過，請人工檢查 Final.md 後再決定是否建立草稿。" }));
              return;
            }
            var promptBox = el("textarea", { class: "upl-textarea", rows: "10", readonly: "readonly", spellcheck: "false" });
            promptBox.value = d.prompt;
            var replyBox = el("textarea", { class: "upl-textarea", rows: "6", spellcheck: "false", placeholder: "把 Claude 的回覆貼在這裡（例如「S12：錯誤：…」，最後一行「結論：通過」或「結論：需修正」）" });
            var copyBtn = button("複製檢核包", null, function () {
              copyText(promptBox.value).then(function () { status(checkStatus, "已複製。請貼到 Claude 網頁版，再把回覆貼回下方。", "ok"); },
                function () { status(checkStatus, "瀏覽器不允許複製，請改用 Ctrl+C。", "error"); });
            });
            var reviseBtn = button("由本機模型修正被指出的句子", "primary", function () {
              reviseBtn.disabled = true;
              status(checkStatus, "本機模型修正中…");
              client.reviseFinal(filename).then(function (rv) {
                reviseBtn.disabled = false;
                if (rv.error) { status(checkStatus, rv.error.message, "error"); return; }
                saved = rv.data.content;
                editor.value = saved;
                renderFinalCheck();
              });
            });
            if (d.status !== "needs_revision") { reviseBtn.setAttribute("hidden", "hidden"); }
            var applyBtn = button("套用 Claude 檢核結果", "primary", function () {
              if (!replyBox.value.trim()) { status(checkStatus, "請先貼上 Claude 的回覆。", "error"); return; }
              applyBtn.disabled = true;
              client.applyFinalCheck(filename, replyBox.value).then(function (ap) {
                applyBtn.disabled = false;
                if (ap.error) { status(checkStatus, ap.error.message, "error"); return; }
                if (ap.data.status === "needs_revision") {
                  status(checkStatus, "Claude 指出 " + ap.data.issues.length + " 句需要修正。請按「由本機模型修正被指出的句子」，修正後再檢核一次。", "warn");
                  reviseBtn.removeAttribute("hidden");
                  return;
                }
                renderFinalCheck();
              });
            });
            AHS.UI.mount(checkSlot, el("details", { class: "upl-details", open: "open" }, [
              el("summary", { text: head }),
              d.flags.length ? el("ul", { class: "upl-list" }, d.flags.map(function (f) { return el("li", { text: f.id + "［" + f.section + "］" + f.flags.join("；") + "　" + f.text.slice(0, 40) }); })) : null,
              el("p", { class: "upl-hint", text: "Claude 只逐句判定、指出錯誤，不重寫全文。程式標記只是提醒，教學補充不算錯。" }),
              promptBox,
              el("div", { class: "upl-actions" }, [copyBtn]),
              replyBox,
              el("div", { class: "upl-actions" }, [applyBtn, reviseBtn]),
              checkStatus
            ]));
          });
        }
        renderFinalCheck();
        if (fillMeta) {
          var filled = applyFrontmatter(saved);
          if (filled.length) {
            status(editStatus, "已依 Final.md 帶入步驟 1：" + filled.join("、") + "（章節：" + chapterInput.value + "）。若判讀有誤，請在步驟 1 或上方內容修正。", "warn");
          }
        }
      });
    }
    function poll(jobId) {
      client.getJob(jobId).then(function (r) {
        if (r.error) { state.polling = false; status(councilStatus, r.error.message, "error"); return; }
        var job = r.data;
        if (job.status === "queued" || job.status === "running") {
          status(councilStatus, "審議中（" + job.status + "）…本地 Qwen 完整裁決可能需要數分鐘，請勿關閉本頁。");
          setTimeout(function () { poll(jobId); }, POLL_MS);
          return;
        }
        state.polling = false;
        runBtn.disabled = false;
        if (job.status === "failed") { status(councilStatus, "審議失敗：" + job.error, "error"); return; }
        var entry = job.result.catalogEntry;
        status(councilStatus, "審議完成。", job.status === "completed" ? "ok" : "warn");
        showFinal(job.result.filename, entry.qualityGate, entry.finalScore);
        refreshCatalog();
      });
    }
    var runBtn = button("執行本機交叉審議", "primary", function () {
      if (state.polling) { return; }
      var m = councilMeta();
      if (!m.unit) { status(councilStatus, "請先在步驟 1 填寫章節。", "error"); return; }
      if (!drafts.localA.value.trim() || !drafts.localB.value.trim()) {
        status(councilStatus, "請先在步驟 3 產生本機模型 A、B 兩份初稿。", "error"); return;
      }
      runBtn.disabled = true;
      state.polling = true;
      status(councilStatus, "送出中…");
      client.createJob({
        school: m.school, grade: m.grade, subject: m.subject, unit: m.unit, category: m.category,
        sourceText: sourceText.value,
        drafts: { localA: drafts.localA.value, localB: drafts.localB.value }
      }).then(function (r) {
        if (r.error) { state.polling = false; runBtn.disabled = false; status(councilStatus, r.error.message, "error"); return; }
        poll(r.data.jobId);
      });
    });
    function refreshCatalog() {
      client.catalog().then(function (r) {
        var items = (r.data && r.data.items) || [];
        AHS.UI.mount(catalogSel, el("option", { value: "", text: items.length ? "（選擇既有的 Final.md）" : "（尚無既有 Final.md）" }));
        items.slice().reverse().forEach(function (item) {
          catalogSel.appendChild(el("option", { value: item.filename, text: item.filename + (item.qualityGate ? "　[" + item.qualityGate + "]" : "") }));
        });
      });
    }
    var councilCard = card("4　交叉審議產出 Final.md", "由本地 Qwen 逐條對照教材本文裁決兩份本機初稿；未通過驗證的陳述不會進入 Final，無法判定的列為「待 Claude 判定」，最後再交 Claude 檢核。", [
      el("div", { class: "upl-actions" }, [runBtn]),
      councilStatus,
      el("div", { class: "upl-or" }, [
        field("或使用既有的 Final.md（例如 AI-Study-Council 之前產出、尚未上架的）", catalogSel),
        button("使用這份 Final", null, function () {
          if (!catalogSel.value) { return; }
          var item = catalogSel.options[catalogSel.selectedIndex].text.match(/\[(.+)\]$/);
          showFinal(catalogSel.value, item ? item[1] : null, null, true);
          /* 2026-10-06：載回這份 Final 審議時保存的初稿，可直接重跑交叉審議（舊資料的 ChatGPT／Claude 初稿依序放進 A、B） */
          client.finalDrafts(catalogSel.value).then(function (r) {
            if (r.error || !r.data || !r.data.drafts) { return; }
            var saved = r.data.drafts;
            var filled = Object.keys(drafts).some(function (k) { return drafts[k].value.trim(); });
            if (filled && !window.confirm("這份 Final 有保存當時的初稿。要用它取代步驟 3 目前的內容嗎？")) { return; }
            drafts.localA.value = saved.localA || saved.chatgpt || "";
            drafts.localB.value = saved.localB || saved.claude || "";
            status(councilStatus, "已載回 " + new Date(r.data.savedAt).toLocaleString() + " 審議時保存的初稿（步驟 3），可直接重新執行交叉審議。", "ok");
          });
        })
      ]),
      finalSlot
    ]);

    /* ---- 5. 建立教材包草稿 → 預覽 → 發布 ------------------------------ */
    var draftStatus = el("p", { class: "upl-status" });
    var previewSlot = el("div", { class: "upl-preview" });
    var draftsList = el("div", { class: "upl-draft-list" });

    function gitCommands(result) {
      var what = result.kind === "supplement"
        ? " 補充題庫 " + (result.questions || []).length + " 題（為 " + result.supplementOf + " 加題）"
        : " 教材上架（教材上傳）";
      return [
        "git add " + result.changedPaths.join(" "),
        "git commit -m \"" + result.materialId + "｜" + (result.metadata.subject || "") + " " + (result.metadata.chapter || "") + what + "\"",
        "git push"
      ].join("\n");
    }

    function renderPreview(d, published) {
      state.draft = d;
      var q = d.questions || [];
      var s = d.summary || {};
      var isSupplement = d.kind === "supplement";
      var body = [
        el("div", { class: "upl-preview__head" }, [
          el("strong", { text: d.materialId }),
          isSupplement ? el("span", { class: "upl-gate upl-gate--info", text: "補充題庫 → " + d.supplementOf }) : null,
          el("span", { class: "upl-gate upl-gate--" + (d.stage === "IMPORTED" ? "ok" : "warn"), text: d.stage === "IMPORTED" ? "已上架（IMPORTED）" : "草稿（學生看不到）" }),
          d.qualityGate ? el("span", { class: "upl-gate upl-gate--" + (d.qualityGate === "PASS" ? "ok" : "warn"), text: "Quality Gate " + d.qualityGate }) : null
        ]),
        el("p", { class: "upl-hint", text: [d.metadata.subject, d.metadata.grade, d.metadata.chapter, d.metadata.unit].filter(Boolean).join(" · ") +
          "　｜　source/：" + (d.sourceFiles || []).join("、") })
      ];
      if ((d.warnings || []).length) {
        body.push(el("ul", { class: "upl-warnings" }, d.warnings.map(function (w) { return el("li", { text: w }); })));
      }
      if (isSupplement) {
        body.push(el("p", { class: "upl-hint", text: "發布後，這些題目會併入 " + d.supplementOf + " 的題庫，學生在測驗中心練習該課時就會抽到；不會出現一份獨立的教材。" }));
      } else {
        body.push(el("h3", { class: "upl-subtitle", text: "核心概念（" + (s.coreConcepts || []).length + "）" }));
        body.push(el("ul", { class: "upl-list" }, (s.coreConcepts || []).map(function (c) { return el("li", { text: c }); })));
        body.push(el("p", { class: "upl-hint", text: "重點詞彙 " + (s.keywords || []).length + "、重點 " + (s.keyPoints || []).length + "、易錯 " + (s.pitfalls || []).length + "、複習建議 " + (s.reviewSuggestions || []).length }));
      }
      var pastCount = q.filter(function (item) { return item.questionSource === "PAST_EXAM"; }).length;
      body.push(el("h3", { class: "upl-subtitle", text: "練習題（" + q.length + " 題，" + (pastCount ? "歷屆試題 " + pastCount + " 題，皆附出處" : "皆標示為 AI 出題") + "）" }));
      body.push(el("ol", { class: "upl-questions" }, q.map(function (item) {
        return el("li", { class: "upl-question" }, [
          el("p", { class: "upl-question__stem", text: item.question }),
          el("ul", { class: "upl-question__options" }, item.options.map(function (opt) {
            return el("li", { class: opt === item.answer ? "is-answer" : null, text: opt + (opt === item.answer ? "　✓" : "") });
          })),
          item.explanation ? el("p", { class: "upl-hint", text: "詳解：" + item.explanation }) : null,
          item.reference ? el("p", { class: "upl-hint", text: "出處：" + item.reference }) : null,
          item.knowledgePoint || item.difficulty
            ? el("p", { class: "upl-hint", text: [item.knowledgePoint ? "知識點：" + item.knowledgePoint : "", item.difficulty ? "難度：" + item.difficulty : ""].filter(Boolean).join("　") })
            : null
        ]);
      })));

      if (published) {
        var cmds = gitCommands(d);
        /* 2026-10-06：每科題庫目標 100 題，提示還差幾題並一鍵帶到「為既有教材加題」 */
        var cov = d.subjectCoverage;
        var parentId = d.supplementOf || d.materialId;
        var covNode = null;
        if (cov) {
          var short = Math.max(0, cov.target - cov.count);
          covNode = el("div", { class: short ? "upl-warn" : "upl-success" }, [
            el("p", { text: (((AHS.WorkspaceData && AHS.WorkspaceData.semesters) || []).filter(function (x) { return x.id === cov.semester; })[0] || { name: cov.semester }).name + "・" + cov.subject + " 題庫目前共 " + cov.count + " 題" +
              (short ? "，距每科 " + cov.target + " 題的目標還差 " + short + " 題。" : "，已達每科 " + cov.target + " 題的目標。") }),
            short ? el("div", { class: "upl-actions" }, [button("為 " + parentId + " 補題", "primary", function () {
              showMode("supplement");
              supplementCards.refresh(parentId);
              window.scrollTo(0, 0);
            })]) : null
          ]);
        }
        body.push(covNode);
        body.push(el("div", { class: "upl-success" }, [
          el("p", { text: d.materialId + " 已匯入平台資料，會自動送上 GitHub（見上方狀態）。若自動推送失敗，可改用下列指令手動推送：" }),
          el("pre", { class: "upl-pre", text: cmds }),
          button("複製指令", null, function () { copyText(cmds); })
        ]));
      } else if (d.stage !== "IMPORTED" && d.status === "draft") {
        body.push(el("div", { class: "upl-actions" }, [
          button("確認發布到平台", "primary", function () {
            if (!window.confirm("確定要把 " + d.materialId + " 發布到平台嗎？發布後這份教材包就不能再從這裡刪除。")) { return; }
            /* 409：平台上已有同校同章教材，請管理者確認不是選錯學校或重複上傳後才重送 */
            function publish(confirmExisting) {
              status(draftStatus, "發布中…（驗證並重新產生平台教材資料）");
              client.publishDraft(d.materialId, confirmExisting).then(function (r) {
                if (r.error && r.error.status === 409 && !confirmExisting) {
                  if (window.confirm(r.error.message)) { publish(true); return; }
                  status(draftStatus, "已取消發布：平台上已有同章教材，請確認學校與章節。", "error");
                  return;
                }
                if (r.error) { status(draftStatus, r.error.message, "error"); return; }
                renderPreview(r.data, true);
                refreshDrafts();
                trackPush(r.data);
              });
            }
            /* 2026-10-05：發布後由主機的推送程式自動 commit + push（ai-engine/council/
               platform/GitPublishQueue.js）。這裡只輪詢結果，失敗時保留下方的手動指令。 */
            function trackPush(data) {
              if (!data.gitJobId) {
                status(draftStatus, "發布完成，但無法排入自動推送（" + (data.gitQueueError || "未知原因") + "），請用下方指令手動推送。", "error");
                return;
              }
              var tries = 0;
              /* main 受保護：推送程式會開 PR、等自動測試通過再合併，約 5 分鐘 */
              var steps = {
                regenerate: "更新平台資料", commit: "建立 commit", push: "推送分支", pr: "建立 PR",
                checks: "等待 GitHub 自動測試（約 4～5 分鐘）", merge: "合併 PR"
              };
              status(draftStatus, "發布完成，正在送上 GitHub…（全程約 5 分鐘，請勿關閉推送視窗）");
              (function poll() {
                client.gitJob(data.gitJobId).then(function (g) {
                  var job = g.data || {};
                  if (job.status === "pushed") {
                    status(draftStatus, "已上架到 GitHub（" + (job.pr || "commit " + job.commit) + "）。約 1～3 分鐘後學生端可見。", "ok");
                    return;
                  }
                  if (job.status === "failed") {
                    status(draftStatus, "發布完成，但送上 GitHub 失敗：" + job.error + (job.pr ? "（" + job.pr + "）" : "") + "。", "error");
                    return;
                  }
                  tries += 1;
                  if (job.status === "pending" && !job.progress && job.publisherAlive === false && tries >= 3) {
                    status(draftStatus, "發布完成，但發布推送程式沒有在執行。請重新執行「啟動教材上傳引擎.bat」，它會自動補推；或用下方指令手動推送。", "error");
                    return;
                  }
                  if (job.progress && steps[job.progress]) {
                    status(draftStatus, "發布完成，正在送上 GitHub：" + steps[job.progress] + "…");
                  }
                  if (tries > 700) {
                    status(draftStatus, "發布完成，推送仍在進行中，請稍後到 GitHub 確認。", "error");
                    return;
                  }
                  setTimeout(poll, 3000);
                });
              })();
            }
            publish(false);
          }),
          button("刪除草稿", "danger", function () {
            if (!window.confirm("確定刪除草稿 " + d.materialId + "？")) { return; }
            client.deleteDraft(d.materialId).then(function (r) {
              if (r.error) { status(draftStatus, r.error.message, "error"); return; }
              status(draftStatus, d.materialId + " 已刪除。", "ok");
              AHS.UI.mount(previewSlot, el("span"));
              refreshDrafts();
            });
          })
        ]));
      }
      AHS.UI.mount(previewSlot, el("div", { class: "upl-preview__body" }, body));
    }

    function refreshDrafts() {
      client.listDrafts().then(function (r) {
        var list = (r.data && r.data.drafts) || [];
        if (!list.length) { AHS.UI.mount(draftsList, el("p", { class: "upl-hint", text: "目前沒有由教材上傳建立的教材包。" })); return; }
        /* 2026-10-09：「已發布」只代表本機匯入完成，還要送上 GitHub 才會上線。
           每列顯示實際上線狀態（引擎比對 GitHub main 的 index.json）。 */
        var LIVE = {
          online: ["已上線", "ok"], pushing: ["送上 GitHub 中", ""], stalled: ["未上線：推送程式沒有在執行", "error"],
          failed: ["未上線：送上 GitHub 失敗", "error"], offline: ["未上線", "error"],
          conflict: ["未上線：編號已被雲端其他教材使用", "error"], unknown: ["無法確認是否上線（連不到 GitHub）", ""]
        };
        var notOnline = list.filter(function (d) { return d.live && d.live.state !== "online" && d.live.state !== "unknown"; }).length;
        var banner = null;
        if (r.data && r.data.publisherAlive === false) {
          banner = el("p", { class: "upl-status upl-status--error", text: "推送程式沒有在執行：發布的教材不會送上 GitHub。請重新執行「啟動教材上傳引擎.bat」。" });
        } else if (notOnline) {
          banner = el("p", { class: "upl-status upl-status--error", text: notOnline + " 份已發布的教材尚未上線，見下方各列說明。" });
        }
        var rows = el("ul", { class: "upl-list" }, list.map(function (d) {
          var live = d.live && LIVE[d.live.state];
          var liveText = live ? live[0] + (d.live.state === "conflict" && d.live.remote ? "（雲端為 " + d.live.remote.subject + " " + d.live.remote.chapter + "）" : "") : "";
          return el("li", { class: "upl-draft-row" }, [
            el("span", { text: d.materialId + "　" + (d.status === "published" ? "已發布" : "草稿") + "　" +
              (d.kind === "supplement" ? "補充題庫（為 " + d.parentId + " 加題）" : d.finalFilename) }),
            live ? el("span", { class: "upl-live upl-live--" + (live[1] || "info"), text: liveText }) : null,
            button("預覽", null, function () {
              client.getDraft(d.materialId).then(function (g) {
                if (g.error) { status(draftStatus, g.error.message, "error"); return; }
                renderPreview(g.data, false);
              });
            })
          ]);
        }));
        AHS.UI.mount(draftsList, el("div", {}, banner ? [banner, rows] : [rows]));
      });
    }

    var createBtn = button("建立教材包草稿", "primary", function () {
      if (!state.finalFilename) { status(draftStatus, "請先完成步驟 4，或選擇一份既有的 Final.md。", "error"); return; }
      var meta = platformMeta();
      if (!meta.chapter) { status(draftStatus, "請先在步驟 1 填寫章節。", "error"); return; }
      createBtn.disabled = true;
      status(draftStatus, "建立中…");
      client.createDraft({ finalFilename: state.finalFilename, uploadSessionId: state.sessionId, metadata: meta }).then(function (r) {
        createBtn.disabled = false;
        if (r.error) { status(draftStatus, r.error.message, "error"); return; }
        status(draftStatus, r.data.materialId + " 草稿已建立（學生看不到）。請檢查下方擷取結果，確認無誤再發布。", "ok");
        renderPreview(r.data, false);
        refreshDrafts();
      });
    });
    var packageCard = card("5　建立教材包草稿", "把 Final.md 轉成平台教材包：只會新增一個新的教材編號，不會改動任何已上架的教材。擷取不到的內容會列在警告裡，不會自動補寫。", [
      el("div", { class: "upl-actions" }, [createBtn])
    ]);
    // 草稿預覽／發布與上傳紀錄：兩種模式共用。
    var reviewCard = card("草稿預覽與發布", "草稿學生看不到；確認內容無誤後再發布。", [
      draftStatus,
      previewSlot,
      el("h3", { class: "upl-subtitle", text: "教材上傳紀錄" }),
      draftsList
    ]);

    var supplementCards = buildSupplementCards(client, {
      onDraft: function (d) {
        status(draftStatus, d.materialId + " 補充題庫草稿已建立（學生看不到）。請檢查下方題目，確認無誤再發布。", "ok");
        renderPreview(d, false);
        refreshDrafts();
        if (reviewCard.scrollIntoView) { reviewCard.scrollIntoView({ behavior: "smooth", block: "start" }); }
      }
    });

    /* 2026-10-14 審議統計：本機 Qwen 沒有定論、送 Claude 最終審查的比例（⑥），與標準答案集累積筆數（⑤） */
    var statsStatus = el("p", { class: "upl-status" });
    var statsBody = el("div");
    function pct(x) { return x === null || x === undefined ? "—" : x + "%"; }
    function statsRow(name, b) {
      return el("tr", {}, [
        el("td", { text: name }), el("td", { class: "num", text: String(b.finals) }),
        el("td", { class: "num", text: b.claims.toClaude + "/" + b.claims.total }), el("td", { class: "num", text: pct(b.claimEscalationRate) }),
        el("td", { class: "num", text: b.claims.confirmed + "/" + (b.claims.confirmed + b.claims.removed) }),
        el("td", { class: "num", text: b.practice.toClaude + "/" + b.practice.total }), el("td", { class: "num", text: pct(b.practiceEscalationRate) })
      ]);
    }
    function refreshStats() {
      status(statsStatus, "統計中…");
      client.adjudicationStats().then(function (r) {
        if (r.error) { status(statsStatus, r.error.message, "error"); return; }
        var d = r.data;
        var head = el("tr", {}, ["範圍", "教材數", "陳述送審", "比例", "Claude 判成立", "練習題送審", "比例"].map(function (t, i) {
          return el("th", { class: i ? "num" : "", text: t });
        }));
        var rows = [statsRow("全部", d.overall)].concat(Object.keys(d.bySubject).map(function (k) { return statsRow(k, d.bySubject[k]); }));
        var g = d.gold;
        AHS.UI.mount(statsBody, el("div", {}, [
          el("div", { class: "upl-stats-wrap" }, [el("table", { class: "upl-stats" }, [el("thead", {}, [head]), el("tbody", {}, rows)])]),
          el("p", { class: "upl-hint", text: "「Claude 判成立」越高，代表本機模型越常把正確內容判為沒有定論（過度保守）。" +
            (d.legacy || d.fallback ? "不計入：" + [
              d.legacy ? d.legacy + " 份 2026-10-12 以前的審議（沒有送審紀錄）" : null,
              d.fallback ? d.fallback + " 份未完成語意裁決（備援模式）" : null
            ].filter(Boolean).join("、") + "。" : "") }),
          el("h3", { class: "upl-subtitle", text: "標準答案集" }),
          el("p", { class: "upl-hint", text: "累積 " + g.total + " 筆裁決（陳述 " + g.claims.total + "、練習題 " + g.practice.total + "），其中 " + g.scorable +
            " 筆可用於回歸測試。換模型前後在命令列執行：docker exec ahs-council-council-engine-1 node tools/gold-eval.js --model <模型名稱>" })
        ]));
        status(statsStatus, "", "ok");
      });
    }
    var statsCard = card("審議統計", "每次貼回 Claude 審查結果後更新。比例越低，代表本機模型越能自行定論。", [
      el("div", { class: "upl-actions" }, [button("重新整理", null, refreshStats)]),
      statsStatus, statsBody
    ]);

    var modes = [
      { id: "new", name: "上傳新教材", cards: [metaCard, uploadCard, draftsCard, councilCard, packageCard],
        sub: "上傳課本或講義 → 本機模型 A、B 各寫初稿 → 本機交叉審議 → Claude 最後檢核 → 預覽確認後上架。僅管理者可見。" },
      { id: "supplement", name: "為既有教材加題", cards: supplementCards.cards,
        sub: "為已上架的教材補出新的練習題：本機模型 A 出題 → 本機模型 B 與 Claude 新對話各自作答核對 → 預覽確認後併入該課題庫。僅管理者可見。" },
      { id: "stats", name: "審議統計", cards: [statsCard],
        sub: "本機 Qwen 沒有定論、送 Claude 最終審查的比例，以及標準答案集的累積情形。僅管理者可見。" }
    ];
    var headSub = el("p", { class: "upl-head__sub" });
    var tabs = el("div", { class: "upl-tabs", role: "tablist" });
    function showMode(id) {
      modes.forEach(function (m) {
        m.tab.setAttribute("aria-selected", m.id === id ? "true" : "false");
        m.tab.classList.toggle("is-active", m.id === id);
        m.cards.forEach(function (c) { if (m.id === id) { c.removeAttribute("hidden"); } else { c.setAttribute("hidden", "hidden"); } });
        if (m.id === id) { headSub.textContent = m.sub; }
      });
      if (id === "supplement") { supplementCards.refresh(); }
      if (id === "stats") { refreshStats(); reviewCard.setAttribute("hidden", "hidden"); } else { reviewCard.removeAttribute("hidden"); }
    }
    modes.forEach(function (m) {
      m.tab = el("button", { type: "button", class: "upl-tab", role: "tab", text: m.name });
      m.tab.addEventListener("click", function () { showMode(m.id); });
      tabs.appendChild(m.tab);
    });

    var root = el("div", { class: "upl-page" }, [
      el("header", { class: "upl-head" }, [
        el("h1", { class: "upl-head__title", text: "教材上傳" }),
        headSub
      ]),
      engineCard, tabs
    ].concat(modes[0].cards, supplementCards.cards, [statsCard, reviewCard]));
    showMode("new");
    checkEngine();
    return root;
  }

  return { create: create, sectionsFor: sectionsFor };
})();
