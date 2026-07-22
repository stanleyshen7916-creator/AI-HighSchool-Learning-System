/* components/BulkUploadDialog.js — Sprint 6.6 · GitHub QA Fix (WO-006)
   Bulk Upload Metadata.

   Used only when multiple files are picked at once (MaterialCenter.js
   still uses the existing, unchanged AHS.MaterialUploadDialog for a
   single file — this is purely additive, no existing single-file
   behavior changes). Flow (per WO-006):
     Step 1 (already done by the caller: files are already picked)
     Step 2: 共同設定 — one shared set of 年級/科目/資料夾/教材類型
     Step 3: 套用全部 — one click copies the shared settings onto every
       file row below
     Step 4: 允許個別修改 — each file row's fields stay individually
       editable after applying
     開始匯入 — validates every row (科目/年級/教材分類 required, same
       rule as the existing single-file dialog) then calls onConfirmAll
       with the finished list; never partially imports.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.BulkUploadDialog = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  var SUBJECTS = ["chinese", "english", "math", "physics", "chemistry",
    "biology", "history", "geography", "civics"];
  var GRADES = ["高一", "高二", "高三"];
  var CATEGORIES = ["課本", "講義", "考卷", "筆記", "補充資料", "影片", "其他"];

  function selectField(labelText, options, small) {
    var sel = el("select", { class: small ? "mat-bulk__mini-control" : "mat-dialog__control", "aria-label": labelText },
      [el("option", { value: "", text: "請選擇" })].concat(
        options.map(function (o) { return el("option", { value: o.value, text: o.label }); })
      ));
    return {
      field: el("label", { class: small ? "mat-bulk__mini-field" : "mat-dialog__field" }, [
        el("span", { class: small ? "mat-bulk__mini-label" : "mat-dialog__field-label", text: labelText }),
        sel
      ]),
      control: sel
    };
  }

  /* open(files, onConfirmAll, onCancel, folders)
     files: real File[] array (length > 1). onConfirmAll receives an
     array of { file, title, subject, grade, category, folderId }. */
  function open(files, onConfirmAll, onCancel, folders) {
    var folderList = folders || [];
    var folderOptions = [{ value: "", label: "未分類" }].concat(
      folderList.map(function (f) { return { value: f.id, label: f.name }; })
    );

    /* ---- Step 2: 共同設定 ------------------------------------------- */
    var sharedSubjectF = selectField("科目", SUBJECTS.map(function (k) { return { value: k, label: AHS.Subjects[k].name }; }));
    var sharedGradeF = selectField("年級", GRADES.map(function (g) { return { value: g, label: g }; }));
    var sharedCategoryF = selectField("教材分類", CATEGORIES.map(function (c) { return { value: c, label: c }; }));
    var sharedFolderF = selectField("資料夾", folderOptions);

    var applyAllBtn = el("button", { type: "button", class: "mat-dialog__btn mat-dialog__btn--ghost", text: "套用全部" });

    /* ---- Step 4: per-file rows (individually editable) ---------------- */
    var rows = files.map(function (file) {
      var defaultName = file && file.name ? file.name.replace(/\.[^.]+$/, "") : "未命名教材";
      var nameInput = el("input", { class: "mat-bulk__mini-control", type: "text", value: defaultName, "aria-label": "教材名稱" });
      var subjectF = selectField("科目", SUBJECTS.map(function (k) { return { value: k, label: AHS.Subjects[k].name }; }), true);
      var gradeF = selectField("年級", GRADES.map(function (g) { return { value: g, label: g }; }), true);
      var categoryF = selectField("教材分類", CATEGORIES.map(function (c) { return { value: c, label: c }; }), true);
      var folderF = selectField("資料夾", folderOptions, true);
      var rowError = el("span", { class: "mat-bulk__row-error", hidden: "hidden", text: "請完整填寫科目、年級與教材分類" });

      var row = el("div", { class: "mat-bulk__row" }, [
        el("p", { class: "mat-bulk__row-file", text: file.name }),
        el("div", { class: "mat-bulk__row-fields" }, [
          el("label", { class: "mat-bulk__mini-field" }, [
            el("span", { class: "mat-bulk__mini-label", text: "教材名稱" }),
            nameInput
          ]),
          subjectF.field, gradeF.field, categoryF.field, folderF.field
        ]),
        rowError
      ]);

      return {
        file: file, row: row, rowError: rowError,
        nameInput: nameInput, subjectF: subjectF, gradeF: gradeF, categoryF: categoryF, folderF: folderF
      };
    });

    applyAllBtn.addEventListener("click", function () {
      var subject = sharedSubjectF.control.value;
      var grade = sharedGradeF.control.value;
      var category = sharedCategoryF.control.value;
      var folderId = sharedFolderF.control.value;
      rows.forEach(function (r) {
        if (subject) { r.subjectF.control.value = subject; }
        if (grade) { r.gradeF.control.value = grade; }
        if (category) { r.categoryF.control.value = category; }
        if (folderId) { r.folderF.control.value = folderId; }
      });
    });

    var errorMsg = el("p", { class: "mat-dialog__error", role: "alert", hidden: "hidden" });
    var overlay = el("div", { class: "mat-dialog__overlay", role: "dialog", "aria-modal": "true", "aria-label": "批量新增教材" });

    function close() {
      if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
    }

    var cancelBtn = el("button", { type: "button", class: "mat-dialog__btn mat-dialog__btn--ghost", text: "取消" });
    cancelBtn.addEventListener("click", function () {
      close();
      if (typeof onCancel === "function") { onCancel(); }
    });

    /* 開始匯入 — validates every row first; never partially imports. */
    var importBtn = el("button", { type: "button", class: "mat-dialog__btn mat-dialog__btn--primary", text: "開始匯入" });
    importBtn.addEventListener("click", function () {
      var results = [];
      var allValid = true;
      rows.forEach(function (r) {
        var subject = r.subjectF.control.value;
        var grade = r.gradeF.control.value;
        var category = r.categoryF.control.value;
        var valid = !!(subject && grade && category);
        if (!valid) {
          allValid = false;
          r.rowError.removeAttribute("hidden");
        } else {
          r.rowError.setAttribute("hidden", "hidden");
        }
        results.push({
          file: r.file,
          title: r.nameInput.value.trim() || r.file.name.replace(/\.[^.]+$/, ""),
          subject: subject, grade: grade, category: category,
          folderId: r.folderF.control.value || null
        });
      });

      if (!allValid) {
        errorMsg.textContent = "請完整填寫每個檔案的科目、年級與教材分類。";
        errorMsg.removeAttribute("hidden");
        return;
      }

      close();
      if (typeof onConfirmAll === "function") { onConfirmAll(results); }
    });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        close();
        if (typeof onCancel === "function") { onCancel(); }
      }
    });

    var dialog = el("div", { class: "mat-dialog mat-dialog--bulk" }, [
      el("div", { class: "mat-dialog__head" }, [
        el("h2", { class: "mat-dialog__title", text: "批量新增教材" }),
        el("p", { class: "mat-dialog__sub", text: "共 " + files.length + " 個檔案" })
      ]),
      el("div", { class: "mat-dialog__body" }, [
        el("div", { class: "mat-bulk__shared" }, [
          el("p", { class: "mat-bulk__shared-title", text: "共同設定" }),
          el("div", { class: "mat-bulk__shared-fields" }, [
            sharedSubjectF.field, sharedGradeF.field, sharedCategoryF.field, sharedFolderF.field
          ]),
          applyAllBtn
        ]),
        el("div", { class: "mat-bulk__rows" }, rows.map(function (r) { return r.row; })),
        errorMsg
      ]),
      el("div", { class: "mat-dialog__foot" }, [cancelBtn, importBtn])
    ]);

    overlay.appendChild(dialog);
    return overlay;
  }

  return { open: open };
})();
