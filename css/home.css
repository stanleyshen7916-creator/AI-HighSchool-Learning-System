/* css/home.css — Home v1.0 page: shared primitives (card / chip /
   progressbar) + the responsive content grid + block-specific styles.
   BEM. RWD: 3-region grid on desktop, single column on mobile. */

/* ---- Content grid ---------------------------------------------------- */
.home {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: start;
}
.home__main,
.home__rail {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}
.home__statsplan {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

/* ---- Hero ------------------------------------------------------------ */
.hero-card {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 24px;
  min-height: 300px;
  border-radius: var(--radius-xl);
  padding: 36px 44px;
  background-image: linear-gradient(120deg, #e7dfff 0%, #efe8fe 52%, #e4d9ff 100%);
  border: 1px solid var(--brand-line);
  box-shadow: 0 10px 30px rgba(124, 92, 255, 0.12);
  overflow: hidden;
}

.hero-card__body { flex: 1 1 auto; min-width: 0; align-self: center; }
.hero-card__greeting { margin: 0; font-size: 20px; font-weight: 700; color: var(--brand-ink); }
.hero-card__headline { margin: 6px 0 10px; font-size: 34px; line-height: 1.25; font-weight: 800; color: var(--text); }
.hero-card__reco { margin: 0 0 26px; color: var(--text-muted); font-size: 15px; }

.hero-card__actions { display: flex; flex-wrap: wrap; gap: 12px; }

.hero-card__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: var(--radius-pill);
  padding: 14px 28px;
  min-height: 52px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
.hero-card__btn svg { width: 16px; height: 16px; }
.hero-card__btn:active { transform: translateY(1px); }
.hero-card__btn:focus-visible { outline: 3px solid var(--brand-line); outline-offset: 2px; }

.hero-card__btn--primary { background-color: var(--brand); color: #ffffff; box-shadow: var(--shadow-btn); }
.hero-card__btn--primary:hover { background-color: var(--brand-strong); }
.hero-card__btn--ghost { background-color: var(--card); color: var(--brand); border: 1.5px solid var(--brand-line); }
.hero-card__btn--ghost:hover { background-color: var(--brand-soft); }

.hero-card__status {
  margin: 16px 0 0;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background-color: rgba(255, 255, 255, 0.7);
  color: var(--brand-ink);
  font-size: 14px;
  font-weight: 600;
}

.hero-card__figure {
  flex: 0 0 auto;
  align-self: center;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  position: relative;
}

.hero-card__bubble {
  align-self: center;
  position: relative;
  max-width: 230px;
  background-color: var(--card);
  border-radius: 18px;
  padding: 14px 16px;
  box-shadow: var(--shadow-card);
}
.hero-card__bubble-title { font-size: 13px; font-weight: 700; color: var(--brand); }
.hero-card__bubble-text { margin: 6px 0 0; font-size: 13px; color: var(--text-muted); }
.hero-card__bubble-heart { position: absolute; right: 12px; bottom: 8px; color: var(--brand); }
.hero-card__bubble-heart svg { width: 16px; height: 16px; }

/* ---- Hero: date / exam countdown / daily quote (Sprint 1 · Task 002-004) */
/* Minimal data-carrying nodes per PMO Decision (Sprint1-Task002-Clarification
   + Future Rule). Does not alter hero layout, spacing rules, or typography
   system. (Corrected 2026-07-07: moved here from the orphaned css/hero.css,
   which is never linked by index.html and therefore never applied.) */
.hero-date-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
}

.hero-date { color: var(--text-muted); }
.hero-weekday { color: var(--text-muted); }

.hero-exam-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
}

.hero-exam-name { color: var(--text-muted); }
.hero-exam-days { color: var(--brand-ink); }

.hero-quote {
  margin: 0 0 12px;
  font-size: 14px;
  font-style: italic;
  color: var(--text-muted);
}

@media (max-width: 560px) {
  .hero-date-info { justify-content: center; }
  .hero-exam-info { justify-content: center; }
}

/* ---- 今日任務 -------------------------------------------------------- */
.today-card__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }

.today-task {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 10px;
  border-radius: 12px;
}
.today-task:hover { background-color: var(--bg); }

.today-task__check {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border: 2px solid var(--line-strong);
  border-radius: 7px;
  background-color: var(--card);
  cursor: pointer;
  position: relative;
}
.today-task__check[aria-pressed="true"] {
  background-color: var(--brand);
  border-color: var(--brand);
}
.today-task__check[aria-pressed="true"]::after {
  content: "";
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid #ffffff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.today-task__unit { flex: 1 1 auto; min-width: 0; font-size: 15px; font-weight: 600; }
.today-task__count { flex: 0 0 auto; font-size: 13px; font-weight: 700; color: var(--text-faint); }
.today-task.is-done .today-task__unit { color: var(--text-faint); text-decoration: line-through; }

.today-card__empty {
  margin: 0;
  padding: 12px 0 4px;
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
}

.today-card__add {
  margin-top: 10px;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px dashed var(--brand-line);
  border-radius: 12px;
  padding: 10px;
  background-color: var(--card);
  color: var(--brand);
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.today-card__add svg { width: 16px; height: 16px; }
.today-card__add:hover { background-color: var(--brand-soft); }

/* ---- 最近教材 -------------------------------------------------------- */
.recent-materials__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 14px;
}

.recent-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 210px;
  justify-content: space-between;
}
.recent-card__unit { margin: 2px 0 0; font-size: 15px; font-weight: 700; }
.recent-card__meta { margin: 0; font-size: 12px; color: var(--text-faint); }
.recent-card__progress-head { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.recent-card__pct { font-weight: 700; color: var(--text); }
.recent-card__acts { display: flex; gap: 8px; margin-top: 2px; }

.recent-card__act {
  width: 38px;
  height: 38px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background-color: var(--card);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.recent-card__act svg { width: 18px; height: 18px; }
.recent-card__act:hover { background-color: var(--brand-soft); color: var(--brand); }

.recent-materials__status,
.tutor-card__status,
.plan-card__status {
  margin: 12px 0 0;
  padding: 8px 12px;
  border-radius: 10px;
  background-color: var(--brand-soft);
  color: var(--brand-ink);
  font-size: 13px;
  font-weight: 600;
}

/* ---- AI 巧巧老師卡 --------------------------------------------------- */
.tutor-card__top { display: flex; gap: 12px; align-items: flex-end; }
.tutor-card__speech { flex: 1 1 auto; }
.tutor-card__msg {
  margin: 0 0 12px;
  background-color: var(--brand-soft);
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 14px;
  color: var(--brand-ink);
}
.tutor-card__ask {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: var(--radius-pill);
  padding: 10px 18px;
  background-color: var(--brand);
  color: #ffffff;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-btn);
}
.tutor-card__ask svg { width: 16px; height: 16px; }
.tutor-card__ask:hover { background-color: var(--brand-strong); }
.tutor-card__avatar { flex: 0 0 auto; }

.tutor-card__tiles {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.tutor-card__tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background-color: var(--card);
  cursor: pointer;
  text-align: center;
  font: inherit;
}
.tutor-card__tile:hover { background-color: var(--bg); }
.tutor-card__tile-icon { color: var(--brand); }
.tutor-card__tile-icon svg { width: 22px; height: 22px; }
.tutor-card__tile-label { font-size: 13px; font-weight: 700; }
.tutor-card__tile-desc { font-size: 11px; color: var(--text-faint); }

/* ---- 學習統計 -------------------------------------------------------- */
.stats-card__range {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 4px 10px;
}
.stats-card__total { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.stats-card__total-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background-color: var(--brand-soft);
  color: var(--brand);
  display: flex; align-items: center; justify-content: center;
}
.stats-card__total-icon svg { width: 22px; height: 22px; }
.stats-card__total-label { display: block; font-size: 12px; color: var(--text-muted); }
.stats-card__total-num { font-size: 26px; font-weight: 800; color: var(--text); }
.stats-card__total-num small { font-size: 13px; font-weight: 600; color: var(--text-muted); }
.stats-card__total-delta { display: block; font-size: 12px; font-weight: 600; color: var(--ok); }
.stats-card__caption { margin: 0 0 8px; font-size: 13px; color: var(--text-muted); }

.stats-card__chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 172px;
}
.stats-card__bar-col {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
  justify-content: flex-end;
}
.stats-card__bar-val { font-size: 11px; font-weight: 700; color: var(--text-muted); }
.stats-card__bar-track { width: 60%; flex: 1 1 auto; display: flex; align-items: flex-end; }
.stats-card__bar-fill {
  width: 100%;
  border-radius: 8px 8px 0 0;
  min-height: 6px;
}
.stats-card__bar-label { font-size: 12px; color: var(--text-muted); }

/* ---- 學習計畫 -------------------------------------------------------- */
.plan-card__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.plan-card__slot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 6px;
  border-bottom: 1px solid var(--line);
}
.plan-card__slot:last-child { border-bottom: 0; }
.plan-card__time { flex: 0 0 auto; font-size: 13px; font-weight: 700; color: var(--text-muted); width: 42px; }
.plan-card__dot { width: 8px; height: 8px; border-radius: var(--radius-pill); flex: 0 0 auto; }
.plan-card__unit { flex: 1 1 auto; min-width: 0; font-size: 14px; font-weight: 600; }
.plan-card__start {
  flex: 0 0 auto;
  border: 1px solid var(--brand-line);
  border-radius: var(--radius-pill);
  padding: 6px 14px;
  background-color: var(--card);
  color: var(--brand);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.plan-card__start:hover { background-color: var(--brand-soft); }

.plan-card__points {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  background-color: #fff8e6;
}
.plan-card__points-icon { color: var(--gold); }
.plan-card__points-icon svg { width: 20px; height: 20px; }
.plan-card__points-text { flex: 1 1 auto; font-size: 13px; font-weight: 600; color: #8a6a00; }
.plan-card__points-count { font-size: 13px; font-weight: 800; color: #8a6a00; }

/* ---- 成就徽章 -------------------------------------------------------- */
.badges-card__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px 14px;
}
.badge-item { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
.badge-item__icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 10px rgba(31, 36, 48, 0.08);
}
.badge-item__icon svg { width: 24px; height: 24px; }
.badge-item__label { font-size: 13px; font-weight: 700; }
.badge-item__desc { font-size: 11px; color: var(--text-faint); }

/* ---- RWD ------------------------------------------------------------- */
@media (max-width: 1024px) {
  .home {
    grid-template-columns: minmax(0, 1fr);
  }
  .hero-card { flex-direction: column; }
  .hero-card__figure { align-self: center; }
}

@media (max-width: 620px) {
  .home__statsplan { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 560px) {
  .hero-card { padding: 22px 18px; }
  .hero-card__headline { font-size: 24px; }
  .hero-card__btn { flex: 1 1 auto; justify-content: center; }
  .tutor-card__tiles { grid-template-columns: repeat(2, 1fr); }
  .badges-card__grid { grid-template-columns: repeat(2, 1fr); }
  .hero-card__figure { flex-direction: column-reverse; align-items: center; }
  .hero-card__bubble { max-width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-card__btn { transition: none; }
}

/* ---- 今日學習時間 (HOME-F006) ------------------------------------------ */
.learning-time-card__value {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: var(--brand-ink);
}

/* ---- Continue Learning (HOME-F007) ------------------------------------ */
.continue-learning-card__link {
  display: block;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}
.continue-learning-card__subject { margin: 0 0 4px; font-size: 13px; font-weight: 700; color: var(--text-muted); }
.continue-learning-card__lesson { margin: 0 0 8px; font-size: 16px; font-weight: 700; color: var(--text); }
.continue-learning-card__progress { margin: 0; font-size: 14px; font-weight: 800; color: var(--brand-ink); }
.continue-learning-card__empty { margin: 0; padding: 8px 0 4px; color: var(--text-muted); font-size: 14px; text-align: center; }

/* ---- Recent Materials: card is now clickable (HOME-F008) ---------------
   Supplementary rule (does not modify the existing .recent-card block
   above) — card stays an <article> (buttons inside it can't legally
   nest in an <a href>) but behaves like a link via JS + role="link". */
.recent-card { cursor: pointer; }
.recent-card:focus-visible { outline: 3px solid var(--brand-soft); outline-offset: 2px; }
.recent-card__title { margin: 0; font-size: 13px; color: var(--text-muted); }
.recent-card__last-opened { margin: 0; font-size: 12px; color: var(--text-faint); }
