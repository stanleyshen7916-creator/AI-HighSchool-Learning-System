/* js/components/CouncilUpload.js — 2026-09-29 教材上傳併入學習平台.

   Admin-only page component for upload.html. Replaces AI-Study-Council's
   own localhost web UI and adds the step that used to be done by hand:

     1 教材資訊        school/semester/subject from the platform's own data
     2 上傳原始檔      OCR via the engine (MinerU → Tesseract fallback);
                       originals are kept for the package's source/
     3 三方初稿        paste ChatGPT/Gemini/Claude (Web) drafts
     4 交叉審議        engine job → Final.md (or pick an existing Final)
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
  var POLL_MS = 3000;

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
     1 選教材與題數 → 複製出題 Prompt（貼到 Claude）
     2 貼回出題結果 → 擷取題目、複製「只有題目」的作答 Prompt
     3 貼回獨立作答結果（新的 Claude 對話；三方模式另加 ChatGPT、Gemini）
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
    var modeSingle = el("input", { type: "radio", name: "upl-sup-mode", value: "single", checked: "checked" });
    var modeTri = el("input", { type: "radio", name: "upl-sup-mode", value: "tri" });
    /* 2026-10-01: 歷屆試題 — official past exam questions pasted verbatim with
       「出處：」 lines; official answers, so no independent solve. */
    var modePast = el("input", { type: "radio", name: "upl-sup-mode", value: "past" });
    function mode() { return modePast.checked ? "past" : modeTri.checked ? "tri" : "single"; }
    var subjectHint = el("p", { class: "upl-hint upl-hint--warn", hidden: "hidden" });
    function selectedParent() {
      return state.parents.filter(function (p) { return p.materialId === materialSel.value; })[0] || null;
    }
    function updateSubjectHint() {
      var p = selectedParent();
      if (p && CALC_SUBJECTS.indexOf(p.subject) !== -1 && mode() === "single") {
        subjectHint.textContent = p.subject + "的計算與圖表題答案出錯的機率較高，建議改用三方核對，或至少逐題看過被標示的題目。";
        subjectHint.removeAttribute("hidden");
      } else {
        subjectHint.setAttribute("hidden", "hidden");
      }
    }
    materialSel.addEventListener("change", updateSubjectHint);
    [modeSingle, modeTri, modePast].forEach(function (r) { r.addEventListener("change", function () { updateSubjectHint(); updateSolverFields(); }); });

    var promptStatus = el("p", { class: "upl-status" });
    var promptPreview = el("div");
    function refresh() {
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
        if (keep) { materialSel.value = keep; }
        updateSubjectHint();
      });
    }
    var authorBtn = button("複製出題 Prompt", "primary", function () {
      if (!materialSel.value) { status(promptStatus, "請先選擇教材。", "error"); return; }
      var payload = { parentId: materialSel.value, count: Number(countInput.value), difficulty: {} };
      Object.keys(diff).forEach(function (k) { payload.difficulty[k] = Number(diff[k].value) || 0; });
      client.supplementAuthorPrompt(payload).then(function (r) {
        if (r.error) { status(promptStatus, r.error.message, "error"); return; }
        AHS.UI.mount(promptPreview, el("details", { class: "upl-details" }, [
          el("summary", { text: "預覽出題 Prompt（若複製失敗可從這裡手動複製）" }),
          el("pre", { class: "upl-pre", text: r.data.prompt })
        ]));
        copyText(r.data.prompt).then(function () {
          status(promptStatus, "已複製（出 " + r.data.count + " 題：易 " + r.data.difficulty["易"] + "、中等 " + r.data.difficulty["中等"] +
            "、難 " + r.data.difficulty["難"] + "；已避開既有 " + r.data.existingCount + " 題）。請貼到 Claude 網頁版，再把輸出貼到下一步。", "ok");
        }, function () { status(promptStatus, "瀏覽器不允許複製，請展開下方預覽手動複製。", "warn"); });
      });
    });
    var pickCard = card("1　選擇教材與題數", "補充題目會存成一份新的「補充題庫」，發布後併入該課題庫；原本的教材資料不會被修改。", [
      el("div", { class: "upl-grid" }, [
        field("教材", materialSel), field("題數（1～40）", countInput),
        field("易", diff["易"]), field("中等", diff["中等"]), field("難", diff["難"])
      ]),
      el("div", { class: "upl-radios" }, [
        el("label", { class: "upl-radio" }, [modeSingle, el("span", { text: "Claude 出題＋另開新對話獨立作答核對（建議）" })]),
        el("label", { class: "upl-radio" }, [modeTri, el("span", { text: "三方核對：Claude 出題，Claude 新對話、ChatGPT、Gemini 各自作答" })]),
        el("label", { class: "upl-radio" }, [modePast, el("span", { text: "歷屆試題：逐字貼上官方題目與官方答案，每題加上「出處：年度、考試、考科、題號」「對應課程：第X章 …」（至少對應到課）「對應程度：完全對應／部分對應」，可另加「對應節次：」「對應說明：」（不需獨立作答）" })])
      ]),
      subjectHint,
      el("div", { class: "upl-actions" }, [authorBtn]),
      promptStatus,
      promptPreview
    ]);

    /* 2 貼上出題結果 */
    var authorText = el("textarea", { class: "upl-textarea", rows: "14", placeholder: "把 Claude 依出題 Prompt 產出的完整內容貼在這裡。" });
    var solverPromptStatus = el("p", { class: "upl-status" });
    var solverPromptPreview = el("div");
    var solverBtn = button("擷取題目並複製作答 Prompt", "primary", function () {
      client.supplementSolverPrompt({ authorText: authorText.value }).then(function (r) {
        if (r.error) { status(solverPromptStatus, r.error.message, "error"); return; }
        AHS.UI.mount(solverPromptPreview, el("div", {}, [
          r.data.warnings.length ? el("ul", { class: "upl-warnings" }, r.data.warnings.map(function (w) { return el("li", { text: w }); })) : null,
          el("details", { class: "upl-details" }, [
            el("summary", { text: "預覽作答 Prompt（只有題目，沒有答案）" }),
            el("pre", { class: "upl-pre", text: r.data.prompt })
          ])
        ]));
        var where = mode() === "tri" ? "請分別貼到「新的」Claude 對話、ChatGPT、Gemini，" : "請開一個「新的」Claude 對話貼上（不要用出題的同一個對話），";
        copyText(r.data.prompt).then(function () {
          status(solverPromptStatus, "擷取到 " + r.data.count + " 題，作答 Prompt 已複製。" + where + "再把作答結果貼到下一步。", "ok");
        }, function () { status(solverPromptStatus, "擷取到 " + r.data.count + " 題；瀏覽器不允許複製，請展開下方預覽手動複製後，" + where + "再把作答結果貼到下一步。", "warn"); });
      });
    });
    var authorCard = card("2　貼上出題結果", "引擎會擷取題號、選項、答案、詳解、知識點與難度；格式不完整的題目不收錄，並列在警告中。", [
      field("Claude 出題結果", authorText),
      el("div", { class: "upl-actions" }, [solverBtn]),
      solverPromptStatus,
      solverPromptPreview
    ]);

    /* 3 貼上獨立作答結果 */
    var solverFields = [
      { id: "claude-fresh", name: "Claude（新對話）", tri: false },
      { id: "chatgpt", name: "ChatGPT", tri: true },
      { id: "gemini", name: "Gemini", tri: true }
    ].map(function (s) {
      s.input = el("textarea", { class: "upl-textarea", rows: "6", placeholder: "例如：\nQ1：B\nQ2：D" });
      s.field = field(s.name + " 作答結果", s.input);
      return s;
    });
    function updateSolverFields() {
      solverFields.forEach(function (s) {
        var show = mode() !== "past" && (!s.tri || mode() === "tri");
        if (show) { s.field.removeAttribute("hidden"); } else { s.field.setAttribute("hidden", "hidden"); }
      });
    }
    updateSolverFields();
    function currentSolvers() {
      if (mode() === "past") { return []; }
      return solverFields.filter(function (s) { return !s.tri || mode() === "tri"; })
        .map(function (s) { return { id: s.id, text: s.input.value }; });
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
    var solverCard = card("3　貼上獨立作答結果", "作答者看不到出題答案；答案和出題不一致、或作答者認為題目有問題時，會標示為需人工確認。", [
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
    var fileInput = el("input", { class: "upl-input", type: "file", multiple: "multiple", accept: ".pdf,.png,.jpg,.jpeg,.md,.txt" });
    var uploadStatus = el("p", { class: "upl-status" });
    var sourceText = el("textarea", { class: "upl-textarea", rows: "10", placeholder: "上傳後會出現解析出的教材本文，可直接修正 OCR 錯字；也可以直接貼上 MinerU 解析好的 Markdown。" });
    var imagesSlot = el("div", { class: "upl-images" });
    function refreshImages() {
      var id = sanitizeSegment(councilMeta().school) + "_" + [councilMeta().grade, councilMeta().subject, councilMeta().unit, councilMeta().category].map(sanitizeSegment).join("_");
      client.images(id).then(function (r) {
        AHS.UI.mount(imagesSlot, el("span"));
        if (r.error || !r.data || !r.data.count) { return; }
        AHS.UI.mount(imagesSlot, el("a", {
          class: "upl-link", href: client.imagesZipUrl(id), text: "下載本教材 " + r.data.count + " 張圖片（.zip），可拖進三方 AI 對話框"
        }));
      });
    }
    var uploadBtn = button("上傳並解析", "primary", function () {
      if (!fileInput.files || !fileInput.files.length) { status(uploadStatus, "請先選擇檔案。", "error"); return; }
      uploadBtn.disabled = true;
      status(uploadStatus, "解析中…掃描檔會交給 MinerU OCR，每頁可能需要一分鐘以上。");
      client.upload(fileInput.files).then(function (r) {
        uploadBtn.disabled = false;
        if (r.error) { status(uploadStatus, r.error.message, "error"); return; }
        state.sessionId = r.data.sessionId;
        sourceText.value = r.data.text || "";
        status(uploadStatus, "完成：" + r.data.files.map(function (f) { return f.filename + "（" + f.length + " 字）"; }).join("、") +
          "。原始檔已保存，建立教材包時會放進 source/。", "ok");
        refreshImages();
      });
    });
    var promptStatus = el("p", { class: "upl-status" });
    function buildPrompt() {
      var m = councilMeta();
      return [
        "你是一位資深學科教材編審 AI，請依照以下規範，針對提供的教材本文進行深度分析，並產出完整的十五大章節結構文件。",
        "",
        "【15 大章節架構】（請依序完整輸出，標題請完全比照下列格式，含圈號數字）"
      ].concat(COUNCIL_SECTIONS).concat([
        "",
        "【練習題格式】（學習平台會自動匯入題庫，格式請務必一致）",
        "請在⑪常考題型中，另外出 10 題單選練習題，每題格式如下：",
        "**Q1.** 題幹",
        "(A) 選項　(B) 選項　(C) 選項　(D) 選項",
        "答案：B",
        "詳解：解題說明",
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
    var uploadCard = card("2　上傳原始檔", "支援 PDF、圖片（掃描或拍照的課本頁）與 MinerU 解析好的 .md／.txt；多個檔案依檔名順序合併。", [
      field("選擇檔案", fileInput),
      el("div", { class: "upl-actions" }, [uploadBtn]),
      uploadStatus,
      field("教材本文（SOURCE）", sourceText),
      imagesSlot,
      el("div", { class: "upl-actions" }, [button("複製三方 AI 專用 Prompt", null, function () {
        copyText(buildPrompt()).then(function () {
          status(promptStatus, "已複製。請分別貼到 ChatGPT、Gemini、Claude 網頁版，再把三方輸出貼到下一步。", "ok");
        }, function () { status(promptStatus, "瀏覽器不允許複製，請改用 Ctrl+C。", "error"); });
      })]),
      promptStatus
    ]);

    /* ---- 3. 三方初稿 ---------------------------------------------------- */
    var drafts = {
      chatgpt: el("textarea", { class: "upl-textarea", rows: "12" }),
      gemini: el("textarea", { class: "upl-textarea", rows: "12" }),
      claude: el("textarea", { class: "upl-textarea", rows: "12" })
    };
    var draftsCard = card("3　三方初稿", "把三個網頁版 AI 依 Prompt 產出的完整內容分別貼上。", [
      el("div", { class: "upl-drafts" }, [
        field("ChatGPT (Web)", drafts.chatgpt), field("Gemini (Web)", drafts.gemini), field("Claude (Web)", drafts.claude)
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
    var runBtn = button("執行三方交叉審議", "primary", function () {
      if (state.polling) { return; }
      var m = councilMeta();
      if (!m.unit) { status(councilStatus, "請先在步驟 1 填寫章節。", "error"); return; }
      if (!drafts.chatgpt.value.trim() || !drafts.gemini.value.trim() || !drafts.claude.value.trim()) {
        status(councilStatus, "請先貼上三方初稿。", "error"); return;
      }
      runBtn.disabled = true;
      state.polling = true;
      status(councilStatus, "送出中…");
      client.createJob({
        school: m.school, grade: m.grade, subject: m.subject, unit: m.unit, category: m.category,
        sourceText: sourceText.value,
        drafts: { chatgpt: drafts.chatgpt.value, gemini: drafts.gemini.value, claude: drafts.claude.value }
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
    var councilCard = card("4　交叉審議產出 Final.md", "由本地 Qwen 逐條對照教材本文裁決三方內容；未通過驗證的陳述不會進入 Final。", [
      el("div", { class: "upl-actions" }, [runBtn]),
      councilStatus,
      el("div", { class: "upl-or" }, [
        field("或使用既有的 Final.md（例如 AI-Study-Council 之前產出、尚未上架的）", catalogSel),
        button("使用這份 Final", null, function () {
          if (!catalogSel.value) { return; }
          var item = catalogSel.options[catalogSel.selectedIndex].text.match(/\[(.+)\]$/);
          showFinal(catalogSel.value, item ? item[1] : null, null, true);
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
        body.push(el("div", { class: "upl-success" }, [
          el("p", { text: d.materialId + " 已匯入平台資料。學生端要等你把下列變更 commit 並 push、GitHub Pages 重新部署後才看得到：" }),
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
              status(draftStatus, "發布完成，正在推送到 GitHub…");
              (function poll() {
                client.gitJob(data.gitJobId).then(function (g) {
                  var job = g.data || {};
                  if (job.status === "pushed") {
                    status(draftStatus, "發布完成，已推送到 GitHub（commit " + job.commit + "）。約 1～3 分鐘後學生端可見。", "ok");
                    return;
                  }
                  if (job.status === "failed") {
                    status(draftStatus, "發布完成，但自動推送失敗：" + job.error + "。請用下方指令手動推送。", "error");
                    return;
                  }
                  tries += 1;
                  if (job.status === "pending" && job.publisherAlive === false && tries >= 3) {
                    status(draftStatus, "發布完成，但發布推送程式沒有在執行。請重新執行「啟動教材上傳引擎.bat」，它會自動補推；或用下方指令手動推送。", "error");
                    return;
                  }
                  if (tries > 100) {
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
        AHS.UI.mount(draftsList, el("ul", { class: "upl-list" }, list.map(function (d) {
          return el("li", { class: "upl-draft-row" }, [
            el("span", { text: d.materialId + "　" + (d.status === "published" ? "已發布" : "草稿") + "　" +
              (d.kind === "supplement" ? "補充題庫（為 " + d.parentId + " 加題）" : d.finalFilename) }),
            button("預覽", null, function () {
              client.getDraft(d.materialId).then(function (g) {
                if (g.error) { status(draftStatus, g.error.message, "error"); return; }
                renderPreview(g.data, false);
              });
            })
          ]);
        })));
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

    var modes = [
      { id: "new", name: "上傳新教材", cards: [metaCard, uploadCard, draftsCard, councilCard, packageCard],
        sub: "上傳課本或講義 → 三方 AI 分析 → 交叉審議 → 預覽確認後上架。僅管理者可見。" },
      { id: "supplement", name: "為既有教材加題", cards: supplementCards.cards,
        sub: "為已上架的教材補出新的練習題：Claude 出題 → 另開新對話獨立作答核對 → 預覽確認後併入該課題庫。僅管理者可見。" }
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
    ].concat(modes[0].cards, supplementCards.cards, [reviewCard]));
    showMode("new");
    checkEngine();
    return root;
  }

  return { create: create };
})();
