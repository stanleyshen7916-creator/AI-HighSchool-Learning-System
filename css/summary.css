/* css/summary.css — 總結中心 / 學習總結 (Summary Center). BEM. RWD. */

.sum-page { display: flex; flex-direction: column; gap: 18px; }

/* ---- Banner ---------------------------------------------------------- */
.sum-banner {
  display: flex; align-items: center; justify-content: space-between;
  gap: 18px; flex-wrap: wrap;
  border-radius: var(--radius-xl); padding: 22px 26px;
  background-image: linear-gradient(120deg, #efeaff 0%, #f5effe 100%);
  border: 1px solid var(--brand-line);
  box-shadow: 0 8px 24px rgba(124, 92, 255, 0.10);
}
.sum-banner__title { margin: 0; font-size: 24px; font-weight: 800; }
.sum-banner__subtitle { margin: 4px 0 0; font-size: 14px; color: var(--text-muted); }
.sum-banner__actions { display: flex; gap: 10px; flex-wrap: wrap; }
.sum-export {
  display: inline-flex; align-items: center; gap: 10px;
  border-radius: var(--radius-md); padding: 10px 18px;
  font: inherit; cursor: pointer; text-align: left;
}
.sum-export__icon { display: flex; }
.sum-export__icon svg { width: 20px; height: 20px; }
.sum-export__text { display: flex; flex-direction: column; line-height: 1.2; }
.sum-export__text strong { font-size: 14px; font-weight: 700; }
.sum-export__text small { font-size: 11px; opacity: 0.75; }
.sum-export--primary { border: 0; background-color: var(--brand); color: #ffffff; box-shadow: var(--shadow-btn); }
.sum-export--primary:hover { background-color: var(--brand-strong); }
.sum-export--ghost { border: 1px solid var(--line); background-color: var(--card); color: var(--text); }
.sum-export--ghost:hover { background-color: var(--bg); }

/* ---- Topic bar ------------------------------------------------------- */
.sum-topic { display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; }
.sum-topic__id { display: flex; align-items: center; gap: 14px; }
.sum-topic__badge {
  width: 52px; height: 52px; border-radius: 14px; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
}
.sum-topic__badge svg { width: 26px; height: 26px; }
.sum-topic__chapter { margin: 6px 0 0; font-size: 14px; font-weight: 700; }
.sum-topic__section { margin: 2px 0 0; font-size: 13px; color: var(--text-muted); }
.sum-topic__stats { display: flex; gap: 24px; flex-wrap: wrap; }
.sum-topic__stat { display: flex; align-items: center; gap: 10px; }
.sum-topic__stat-icon {
  width: 38px; height: 38px; border-radius: 10px;
  background-color: var(--brand-soft); color: var(--brand);
  display: flex; align-items: center; justify-content: center;
}
.sum-topic__stat-icon svg { width: 18px; height: 18px; }
.sum-topic__stat-label { display: block; font-size: 12px; color: var(--text-muted); }
.sum-topic__stat-value { font-size: 18px; font-weight: 800; }
.sum-topic__stat-value small { font-size: 12px; font-weight: 600; color: var(--text-muted); }

/* ---- Grid ------------------------------------------------------------ */
.sum-grid {
  display: grid;
  grid-template-columns: 1fr 1.35fr 0.95fr;
  grid-template-areas:
    "summary   mindmap  resources"
    "keypoints tree     notes";
  gap: 16px;
  align-items: start;
}
.sum-grid__summary { grid-area: summary; }
.sum-grid__mindmap { grid-area: mindmap; }
.sum-grid__resources { grid-area: resources; }
.sum-grid__keypoints { grid-area: keypoints; }
.sum-grid__tree { grid-area: tree; }
.sum-grid__notes { grid-area: notes; }

/* ---- AI summary ------------------------------------------------------ */
.sum-ai__spark { color: var(--brand); display: inline-flex; margin-right: 4px; vertical-align: -2px; }
.sum-ai__spark svg { width: 18px; height: 18px; }
.sum-ai__text { margin: 0 0 14px; font-size: 14px; line-height: 1.9; color: var(--text-muted); }
.sum-ai__keywords { display: flex; flex-wrap: wrap; gap: 8px; }
.sum-ai__keyword {
  font-size: 12px; font-weight: 600; color: var(--brand);
  background-color: var(--brand-soft); padding: 4px 12px; border-radius: var(--radius-pill);
}

/* ---- Mind map -------------------------------------------------------- */
.sum-mm__ctrls { display: flex; gap: 6px; }
.sum-mm__ctrl {
  width: 32px; height: 32px; border: 1px solid var(--line); border-radius: 9px;
  background-color: var(--card); color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.sum-mm__ctrl svg { width: 16px; height: 16px; }
.sum-mm__ctrl:hover { background-color: var(--brand-soft); color: var(--brand); }
.sum-mm__center {
  margin: 4px auto 18px; max-width: 320px; text-align: center;
  padding: 14px 18px; border-radius: 14px;
  background-image: linear-gradient(120deg, #7c5cff 0%, #6a49f2 100%);
  color: #ffffff; font-size: 15px; font-weight: 700;
  box-shadow: var(--shadow-btn);
}
.sum-mm__branches {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
}
.sum-mm__branch { display: flex; flex-direction: column; gap: 8px; }
.sum-mm__branch-title {
  border: 1px solid; border-radius: 12px; padding: 8px 12px;
  font-size: 13px; font-weight: 700; text-align: center;
}
.sum-mm__leaves { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
.sum-mm__leaf { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted);
  padding: 6px 10px; border: 1px solid var(--line); border-radius: 9px; background-color: var(--card); }
.sum-mm__leaf-dot { width: 7px; height: 7px; border-radius: var(--radius-pill); flex: 0 0 auto; }

/* ---- Key points ------------------------------------------------------ */
.sum-kp__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.sum-kp__item { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; }
.sum-kp__num {
  flex: 0 0 auto; width: 24px; height: 24px; border-radius: var(--radius-pill);
  background-color: var(--brand); color: #ffffff; font-size: 12px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; margin-top: 1px;
}
.sum-kp__text { flex: 1 1 auto; font-size: 14px; line-height: 1.6; }
.sum-kp__badge {
  flex: 0 0 auto; font-size: 11px; font-weight: 700; color: var(--warn);
  background-color: #fff3e0; padding: 2px 8px; border-radius: 6px; margin-top: 2px;
}

/* ---- Knowledge tree -------------------------------------------------- */
.sum-tree__tabs { display: flex; gap: 4px; }
.sum-tree__tab {
  border: 1px solid var(--line); border-radius: 9px; padding: 5px 14px;
  background-color: var(--card); font: inherit; font-size: 13px; font-weight: 600;
  color: var(--text-muted); cursor: pointer;
}
.sum-tree__tab.is-active { background-color: var(--brand-soft); color: var(--brand); border-color: var(--brand-line); }

.sum-tree__root {
  display: inline-block; margin: 4px 0 14px;
  padding: 10px 16px; border-radius: 12px;
  background-color: var(--brand-soft); color: var(--brand-ink);
  font-size: 14px; font-weight: 700;
}
.sum-tree__branches { list-style: none; margin: 0; padding: 0 0 0 12px; border-left: 2px solid var(--line); display: flex; flex-direction: column; gap: 12px; }
.sum-tree__node-name { font-size: 14px; font-weight: 700; display: inline-block; margin-bottom: 6px; }
.sum-tree__leaves { list-style: none; margin: 0; padding: 0 0 0 14px; display: flex; flex-wrap: wrap; gap: 6px; }
.sum-tree__leaf {
  font-size: 12px; color: var(--text-muted);
  border: 1px solid var(--line); border-radius: 8px; padding: 4px 10px; background-color: var(--bg);
}
.sum-tree__rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.sum-tree__row { display: flex; align-items: center; gap: 10px; padding: 10px 4px; border-bottom: 1px solid var(--line); font-size: 13px; }
.sum-tree__row:last-child { border-bottom: 0; }
.sum-tree__row-cat { flex: 0 0 96px; font-weight: 700; color: var(--brand); }
.sum-tree__row-item { color: var(--text-muted); }

/* ---- Resources ------------------------------------------------------- */
.sum-res__list { display: flex; flex-direction: column; gap: 2px; }
.sum-res__item { display: flex; align-items: center; gap: 10px; padding: 10px 6px; border: 0; border-radius: 10px; background: transparent; font: inherit; cursor: pointer; text-align: left; width: 100%; }
.sum-res__item:hover { background-color: var(--bg); }
.sum-res__badge { flex: 0 0 auto; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
.sum-res__name { flex: 1 1 auto; min-width: 0; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sum-res__dl { flex: 0 0 auto; color: var(--text-faint); display: flex; }
.sum-res__dl svg { width: 18px; height: 18px; }

/* ---- Notes ----------------------------------------------------------- */
.sum-notes__add { display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--brand-line); border-radius: var(--radius-pill); padding: 5px 12px; background-color: var(--brand-soft); color: var(--brand); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
.sum-notes__add svg { width: 14px; height: 14px; }
.sum-notes__text { margin: 0 0 12px; font-size: 14px; line-height: 1.8; color: var(--text-muted); background-color: #fff8e6; border-radius: 12px; padding: 12px 14px; }
.sum-notes__tags { display: flex; flex-wrap: wrap; gap: 8px; }
.sum-notes__tag { font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 8px; }

.sum-status { margin: 0; padding: 8px 12px; border-radius: 10px; background-color: var(--brand-soft); color: var(--brand-ink); font-size: 13px; font-weight: 600; }

/* ---- RWD ------------------------------------------------------------- */
@media (max-width: 1024px) {
  .sum-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "summary   mindmap"
      "keypoints mindmap"
      "tree      resources"
      "notes     resources";
  }
}
@media (max-width: 720px) {
  .sum-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "summary" "mindmap" "keypoints" "tree" "resources" "notes";
  }
  .sum-mm__branches { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .sum-banner__actions { width: 100%; }
  .sum-export { flex: 1 1 auto; }
  .sum-mm__branches { grid-template-columns: 1fr; }
  .sum-topic__stats { gap: 14px; }
}
