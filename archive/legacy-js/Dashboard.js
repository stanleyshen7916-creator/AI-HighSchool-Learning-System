/* components/SummaryCenter.js — 總結中心 / 學習總結 (Summary Center) page.
   Banner + topic bar + AI 智能總結 + 思維導圖 + 重點整理 + 知識樹
   (tree/list toggle) + 相關資源 + 筆記與標籤. All Mock. PascalCase under
   window.AHS. Mind map / tree connectors are pure CSS/inline markup. */
window.AHS = window.AHS || {};
AHS.SummaryCenter = (function () {
  "use strict";
  var el = AHS.UI.el;

  var FILE_TONE = { PDF: "#ef4444", PPT: "#f59e0b", DOCX: "#3b82f6", XLSX: "#22b573", MP4: "#7c5cff" };

  /* ---- Banner ---------------------------------------------------------- */
  function banner(data, status) {
    function exportBtn(cls, icon, label, sub) {
      var b = el("button", { type: "button", class: "sum-export " + cls }, [
        el("span", { class: "sum-export__icon", html: AHS.Icons[icon]() }),
        el("span", { class: "sum-export__text" }, [
          el("strong", { text: label }),
          el("small", { text: sub })
        ])
      ]);
      b.addEventListener("click", function () {
        status.textContent = "（Mock）" + label + "（" + sub + "）";
        status.removeAttribute("hidden");
      });
      return b;
    }
    return el("div", { class: "sum-banner" }, [
      el("div", { class: "sum-banner__titles" }, [
        el("h1", { class: "sum-banner__title", text: data.title }),
        el("p", { class: "sum-banner__subtitle", text: data.subtitle })
      ]),
      el("div", { class: "sum-banner__actions" }, [
        exportBtn("sum-export--primary", "download", "下載總結", "PDF / DOCX / PPT"),
        exportBtn("sum-export--ghost", "bookmark", "匯出筆記", "Notion / Evernote")
      ])
    ]);
  }

  /* ---- Topic bar ------------------------------------------------------- */
  function topicBar(data) {
    var subj = AHS.Subjects[data.subject];
    var stats = el("div", { class: "sum-topic__stats" },
      data.stats.map(function (s) {
        return el("div", { class: "sum-topic__stat" }, [
          el("span", { class: "sum-topic__stat-icon", html: AHS.Icons[s.icon]() }),
          el("div", {}, [
            el("span", { class: "sum-topic__stat-label", text: s.label }),
            el("strong", { class: "sum-topic__stat-value" }, [
              el("span", { text: s.value }),
              el("small", { text: " " + s.unit })
            ])
          ])
        ]);
      }));

    return el("section", { class: "card sum-topic" }, [
      el("div", { class: "sum-topic__id" }, [
        el("span", {
          class: "sum-topic__badge",
          style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a",
          html: AHS.Icons.summary()
        }),
        el("div", {}, [
          el("span", {
            class: "chip",
            style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
          }, [el("span", { text: subj.name })]),
          el("p", { class: "sum-topic__chapter", text: data.grade + "｜" + data.chapter }),
          el("p", { class: "sum-topic__section", text: data.section })
        ])
      ]),
      stats
    ]);
  }

  /* ---- AI summary ------------------------------------------------------ */
  function aiSummary(data) {
    return el("section", { class: "card sum-ai", "aria-label": "AI 智能總結" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title" }, [
          el("span", { class: "sum-ai__spark", html: AHS.Icons.sparkle() }),
          el("span", { text: "AI 智能總結" })
        ])
      ]),
      el("p", { class: "sum-ai__text", text: data.summaryText }),
      el("div", { class: "sum-ai__keywords" },
        data.keywords.map(function (k) {
          return el("span", { class: "sum-ai__keyword", text: k });
        }))
    ]);
  }

  /* ---- Mind map -------------------------------------------------------- */
  function mindmap(data, status) {
    var mm = data.mindmap;

    function ctrl(icon, label) {
      var b = el("button", { type: "button", class: "sum-mm__ctrl", "aria-label": label,
        html: AHS.Icons[icon]() });
      b.addEventListener("click", function () {
        status.textContent = "（Mock）思維導圖：" + label;
        status.removeAttribute("hidden");
      });
      return b;
    }

    var branches = el("div", { class: "sum-mm__branches" },
      mm.branches.map(function (br) {
        return el("div", { class: "sum-mm__branch" }, [
          el("div", {
            class: "sum-mm__branch-title",
            style: "background-color:" + br.tone + "1a;color:" + br.tone +
              ";border-color:" + br.tone + "55",
            text: br.title
          }),
          el("ul", { class: "sum-mm__leaves" },
            br.leaves.map(function (lf) {
              return el("li", { class: "sum-mm__leaf" }, [
                el("span", { class: "sum-mm__leaf-dot", style: "background-color:" + br.tone }),
                el("span", { text: lf })
              ]);
            }))
        ]);
      }));

    return el("section", { class: "card sum-mm", "aria-label": "思維導圖" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "思維導圖" }),
        el("div", { class: "sum-mm__ctrls" }, [
          ctrl("maximize", "全螢幕"),
          ctrl("minus", "縮小"),
          ctrl("plus", "放大")
        ])
      ]),
      el("div", { class: "sum-mm__center", text: mm.center }),
      branches
    ]);
  }

  /* ---- Key points ------------------------------------------------------ */
  function keyPoints(data) {
    return el("section", { class: "card sum-kp", "aria-label": "重點整理" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "重點整理" })
      ]),
      el("ol", { class: "sum-kp__list" },
        data.keyPoints.map(function (p, i) {
          return el("li", { class: "sum-kp__item" }, [
            el("span", { class: "sum-kp__num", text: String(i + 1) }),
            el("span", { class: "sum-kp__text", text: p }),
            el("span", { class: "sum-kp__badge", text: "重要" })
          ]);
        }))
    ]);
  }

  /* ---- Knowledge tree (tree / list toggle) ----------------------------- */
  function knowledgeTree(data, status) {
    var kt = data.knowledgeTree;
    var body = el("div", { class: "sum-tree__body", "data-view": "tree" });

    function renderTree() {
      body.innerHTML = "";
      var root = el("div", { class: "sum-tree__root", text: kt.root });
      var branches = el("ul", { class: "sum-tree__branches" },
        kt.nodes.map(function (n) {
          return el("li", { class: "sum-tree__node" }, [
            el("span", { class: "sum-tree__node-name", text: n.name }),
            el("ul", { class: "sum-tree__leaves" },
              n.children.map(function (c) {
                return el("li", { class: "sum-tree__leaf", text: c });
              }))
          ]);
        }));
      body.appendChild(root);
      body.appendChild(branches);
    }
    function renderList() {
      body.innerHTML = "";
      var rows = [];
      kt.nodes.forEach(function (n) {
        n.children.forEach(function (c) {
          rows.push(el("li", { class: "sum-tree__row" }, [
            el("span", { class: "sum-tree__row-cat", text: n.name }),
            el("span", { class: "sum-tree__row-item", text: c })
          ]));
        });
      });
      body.appendChild(el("ul", { class: "sum-tree__rows" }, rows));
    }

    var treeBtn = el("button", { type: "button", class: "sum-tree__tab is-active", text: "樹狀" });
    var listBtn = el("button", { type: "button", class: "sum-tree__tab", text: "列表" });
    treeBtn.addEventListener("click", function () {
      treeBtn.classList.add("is-active"); listBtn.classList.remove("is-active");
      body.setAttribute("data-view", "tree"); renderTree();
    });
    listBtn.addEventListener("click", function () {
      listBtn.classList.add("is-active"); treeBtn.classList.remove("is-active");
      body.setAttribute("data-view", "list"); renderList();
    });

    renderTree();

    return el("section", { class: "card sum-tree", "aria-label": "知識樹" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "知識樹" }),
        el("div", { class: "sum-tree__tabs" }, [treeBtn, listBtn])
      ]),
      body
    ]);
  }

  /* ---- Related resources ----------------------------------------------- */
  function resources(data, status) {
    var list = el("div", { class: "sum-res__list" },
      data.resources.map(function (f) {
        var tone = FILE_TONE[f.type] || "#6b7280";
        var row = el("button", { type: "button", class: "sum-res__item" }, [
          el("span", {
            class: "sum-res__badge",
            style: "color:" + tone + ";background-color:" + tone + "1a",
            text: f.type
          }),
          el("span", { class: "sum-res__name", text: f.name }),
          el("span", { class: "sum-res__dl", html: AHS.Icons.download() })
        ]);
        row.addEventListener("click", function () {
          status.textContent = "（Mock）下載：" + f.name;
          status.removeAttribute("hidden");
        });
        return row;
      }));

    return el("section", { class: "card sum-res", "aria-label": "相關資源" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "相關資源" }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看更多" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      list
    ]);
  }

  /* ---- Notes ----------------------------------------------------------- */
  function notes(data, status) {
    var addBtn = el("button", { type: "button", class: "sum-notes__add" }, [
      el("span", { html: AHS.Icons.plus() }),
      el("span", { text: "新增筆記" })
    ]);
    addBtn.addEventListener("click", function () {
      status.textContent = "（Mock）新增筆記";
      status.removeAttribute("hidden");
    });

    return el("section", { class: "card sum-notes", "aria-label": "筆記與標籤" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "筆記與標籤" }),
        addBtn
      ]),
      el("p", { class: "sum-notes__text", text: data.notes.text }),
      el("div", { class: "sum-notes__tags" },
        data.notes.tags.map(function (t) {
          return el("span", {
            class: "sum-notes__tag",
            style: "color:" + t.tone + ";background-color:" + t.tone + "1a",
            text: t.label
          });
        }))
    ]);
  }

  /* create(model?) — model defaults to AHS.Mock.summary. */
  function create(model) {
    var data = model || AHS.Mock.summary;
    var status = el("p", {
      class: "sum-status", "aria-live": "polite", hidden: "hidden"
    });

    function slot(area, node) {
      var w = el("div", { class: "sum-grid__" + area });
      w.appendChild(node);
      return w;
    }

    var grid = el("div", { class: "sum-grid" }, [
      slot("summary", aiSummary(data)),
      slot("mindmap", mindmap(data, status)),
      slot("resources", resources(data, status)),
      slot("keypoints", keyPoints(data)),
      slot("tree", knowledgeTree(data, status)),
      slot("notes", notes(data, status))
    ]);

    return el("div", { class: "sum-page" }, [
      banner(data, status),
      topicBar(data),
      grid,
      status
    ]);
  }

  return { create: create };
})();
