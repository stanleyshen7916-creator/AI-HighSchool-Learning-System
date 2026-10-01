/* docs/TeachingMaterials/explanations/build/SvgFigures.js — 2026-10-01 詳解補強.

   Small, dependency-free SVG builders for explanation figures. Every
   figure is computed from real coordinates (never hand-placed), so a
   graph's period, a sector's angle or a triangle's side really match the
   numbers in the explanation. Output is a plain <svg> string with a
   viewBox (scales to any width), no scripts, no external references.

   Builders: unitCircle(), plot(), sector(), shape(). */
"use strict";

const C = {
  text: "#1f2430", muted: "#6b7280", grid: "#e5e7eb", axis: "#9aa1ad",
  brand: "#7c5cff", red: "#ef4444", green: "#16a34a", blue: "#2563eb", orange: "#f59e0b",
  fill: "rgba(124,92,255,0.14)"
};
const FONT = "font-family=\"'Noto Sans TC','Microsoft JhengHei',sans-serif\"";

function r2(n) { return Math.round(n * 100) / 100; }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function svgWrap(w, h, body, label) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="' + esc(label || "") + '">' + body + "</svg>";
}

function text(x, y, s, o) {
  o = o || {};
  return '<text x="' + r2(x) + '" y="' + r2(y) + '" ' + FONT + ' font-size="' + (o.size || 13) + '" fill="' + (o.color || C.text) +
    '" text-anchor="' + (o.anchor || "middle") + '"' + (o.bold ? ' font-weight="700"' : "") + ">" + esc(s) + "</text>";
}

function line(x1, y1, x2, y2, o) {
  o = o || {};
  return '<line x1="' + r2(x1) + '" y1="' + r2(y1) + '" x2="' + r2(x2) + '" y2="' + r2(y2) + '" stroke="' + (o.color || C.text) +
    '" stroke-width="' + (o.width || 1.5) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : "") + "/>";
}

function circle(cx, cy, r, o) {
  o = o || {};
  return '<circle cx="' + r2(cx) + '" cy="' + r2(cy) + '" r="' + r2(r) + '" fill="' + (o.fill || "none") + '" stroke="' + (o.color || C.text) +
    '" stroke-width="' + (o.width || 1.5) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : "") + "/>";
}

function dot(x, y, color) { return circle(x, y, 3.5, { fill: color || C.text, color: color || C.text, width: 1 }); }

function arrowHead(x, y, angle, color) {
  const a = 8, s = 0.45;
  const p1 = [x - a * Math.cos(angle - s), y - a * Math.sin(angle - s)];
  const p2 = [x - a * Math.cos(angle + s), y - a * Math.sin(angle + s)];
  return '<path d="M' + r2(x) + " " + r2(y) + "L" + r2(p1[0]) + " " + r2(p1[1]) + "L" + r2(p2[0]) + " " + r2(p2[1]) + 'Z" fill="' + (color || C.text) + '"/>';
}

/* arc in screen space around (cx,cy) from math angle a1 to a2 (radians, counter-clockwise) */
function arcPath(cx, cy, r, a1, a2) {
  const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2), y2 = cy - r * Math.sin(a2);
  const large = Math.abs(a2 - a1) > Math.PI ? 1 : 0;
  const sweep = a2 > a1 ? 0 : 1;
  return "M" + r2(x1) + " " + r2(y1) + "A" + r2(r) + " " + r2(r) + " 0 " + large + " " + sweep + " " + r2(x2) + " " + r2(y2);
}

/* unitCircle(o)
   o.angles: [{ rad, label, color }] terminal sides drawn from the origin
   o.arcs:   [{ from, to, label, color, radius }] angle arcs (radians, math sense)
   o.points: [{ x, y, label, color, dx, dy }] in unit coordinates
   o.segments: [{ x1,y1,x2,y2, color, dash, label }] in unit coordinates
   o.scale: px per unit (default 110), o.extent: half-size in units (default 1.35) */
function unitCircle(o) {
  const s = o.scale || 110, ext = o.extent || 1.35;
  const half = s * ext, w = half * 2, h = half * 2, cx = half, cy = half;
  const X = (x) => cx + x * s, Y = (y) => cy - y * s;
  let b = "";
  b += line(0, cy, w, cy, { color: C.axis, width: 1 }) + line(cx, 0, cx, h, { color: C.axis, width: 1 });
  b += text(w - 8, cy - 6, "x", { color: C.muted, anchor: "end" }) + text(cx + 8, 14, "y", { color: C.muted, anchor: "start" });
  if (o.circle !== false) { b += circle(cx, cy, s, { color: C.muted, width: 1.2 }); }
  (o.segments || []).forEach((g) => {
    b += line(X(g.x1), Y(g.y1), X(g.x2), Y(g.y2), { color: g.color || C.muted, dash: g.dash, width: g.width || 1.5 });
    if (g.label) { b += text(X((g.x1 + g.x2) / 2) + (g.ldx || 0), Y((g.y1 + g.y2) / 2) + (g.ldy || 0), g.label, { color: g.color || C.muted, size: 12 }); }
  });
  (o.arcs || []).forEach((a) => {
    const r = a.radius || 0.28;
    b += '<path d="' + arcPath(cx, cy, r * s, a.from, a.to) + '" fill="none" stroke="' + (a.color || C.red) + '" stroke-width="1.8"/>';
    if (a.label) {
      const mid = (a.from + a.to) / 2, lr = r + (a.labelOffset || 0.16);
      b += text(X(lr * Math.cos(mid)), Y(lr * Math.sin(mid)) + 4, a.label, { color: a.color || C.red, size: 12, bold: true });
    }
  });
  (o.angles || []).forEach((a) => {
    const len = a.length || 1;
    b += line(cx, cy, X(len * Math.cos(a.rad)), Y(len * Math.sin(a.rad)), { color: a.color || C.brand, width: 2.2 });
    if (a.label) {
      const lr = (a.labelRadius || len + 0.14);
      b += text(X(lr * Math.cos(a.rad)), Y(lr * Math.sin(a.rad)) + 4, a.label, { color: a.color || C.brand, size: 12, bold: true });
    }
  });
  (o.points || []).forEach((p) => {
    b += dot(X(p.x), Y(p.y), p.color || C.text);
    if (p.label) { b += text(X(p.x) + (p.dx || 0), Y(p.y) + (p.dy || -8), p.label, { color: p.color || C.text, size: 12 }); }
  });
  b += text(cx - 8, cy + 15, "O", { color: C.muted, size: 12 });
  return svgWrap(w, h, b, o.label);
}

/* plot(o) — function graphs.
   o.x: [x0, x1], o.y: [y0, y1], o.w, o.h
   o.curves: [{ f, color, label, labelAt, dash, from, to }]
   o.xTicks / o.yTicks: [{ v, label }]
   o.hlines / o.vlines: [{ v, color, dash, label }]
   o.points: [{ x, y, label, color, dx, dy }]
   o.bands: [{ y1, y2, color }] horizontal arrows (e.g. amplitude)
   o.areas: [{ f, from, to, color, label, lx, ly }] shaded region between f and y = 0
   o.axes: { x: "t (s)", y: "v (m/s)" } axis titles */
function plot(o) {
  const w = o.w || 460, h = o.h || 250, pad = { l: 34, r: 16, t: 16, b: 26 };
  const [x0, x1] = o.x, [y0, y1] = o.y;
  const X = (x) => pad.l + (x - x0) / (x1 - x0) * (w - pad.l - pad.r);
  const Y = (y) => pad.t + (y1 - y) / (y1 - y0) * (h - pad.t - pad.b);
  let b = "";
  (o.yTicks || []).forEach((t) => {
    b += line(pad.l, Y(t.v), w - pad.r, Y(t.v), { color: C.grid, width: 1 });
    b += text(pad.l - 6, Y(t.v) + 4, t.label, { color: C.muted, size: 11, anchor: "end" });
  });
  (o.xTicks || []).forEach((t) => {
    b += line(X(t.v), pad.t, X(t.v), h - pad.b, { color: C.grid, width: 1 });
    b += text(X(t.v), h - 8, t.label, { color: C.muted, size: 11 });
  });
  (o.areas || []).forEach((a) => {
    const n = 200;
    let d = "M" + r2(X(a.from)) + " " + r2(Y(0));
    for (let i = 0; i <= n; i++) { const x = a.from + (a.to - a.from) * i / n; d += "L" + r2(X(x)) + " " + r2(Y(a.f(x))); }
    d += "L" + r2(X(a.to)) + " " + r2(Y(0)) + "Z";
    b += '<path d="' + d + '" fill="' + (a.color || C.fill) + '" stroke="none"/>';
    if (a.label) { b += text(X(a.lx != null ? a.lx : (a.from + a.to) / 2), Y(a.ly != null ? a.ly : a.f((a.from + a.to) / 2) / 2), a.label, { color: a.textColor || C.brand, size: 12, bold: true }); }
  });
  if (y0 <= 0 && y1 >= 0) { b += line(pad.l, Y(0), w - pad.r, Y(0), { color: C.axis, width: 1.2 }); }
  if (x0 <= 0 && x1 >= 0) { b += line(X(0), pad.t, X(0), h - pad.b, { color: C.axis, width: 1.2 }); }
  (o.hlines || []).forEach((l) => {
    b += line(pad.l, Y(l.v), w - pad.r, Y(l.v), { color: l.color || C.muted, dash: l.dash || "5 4", width: 1.3 });
    if (l.label) { b += text(w - pad.r - 2, Y(l.v) - 5, l.label, { color: l.color || C.muted, size: 11, anchor: "end" }); }
  });
  (o.vlines || []).forEach((l) => {
    b += line(X(l.v), pad.t, X(l.v), h - pad.b, { color: l.color || C.muted, dash: l.dash || "5 4", width: 1.3 });
    if (l.label) { b += text(X(l.v) + 4, pad.t + 12, l.label, { color: l.color || C.muted, size: 11, anchor: "start" }); }
  });
  (o.curves || []).forEach((c) => {
    const from = c.from != null ? c.from : x0, to = c.to != null ? c.to : x1;
    const n = 400;
    let d = "", pen = false;
    for (let i = 0; i <= n; i++) {
      const x = from + (to - from) * i / n, y = c.f(x);
      if (!isFinite(y) || y < y0 - 0.5 || y > y1 + 0.5) { pen = false; continue; }
      d += (pen ? "L" : "M") + r2(X(x)) + " " + r2(Y(y));
      pen = true;
    }
    b += '<path d="' + d + '" fill="none" stroke="' + (c.color || C.brand) + '" stroke-width="' + (c.width || 2.2) + '"' + (c.dash ? ' stroke-dasharray="' + c.dash + '"' : "") + "/>";
    if (c.label) {
      const lx = c.labelAt != null ? c.labelAt : to - (to - from) * 0.1;
      b += text(X(lx), Y(c.f(lx)) - 9 + (c.labelDy || 0), c.label, { color: c.color || C.brand, size: 12, bold: true });
    }
  });
  (o.bands || []).forEach((band) => {
    const xx = X(band.x);
    b += line(xx, Y(band.y1), xx, Y(band.y2), { color: band.color || C.red, width: 1.6 });
    b += arrowHead(xx, Y(band.y2), (Y(band.y2) > Y(band.y1) ? 1 : -1) * Math.PI / 2, band.color || C.red);
    b += arrowHead(xx, Y(band.y1), (Y(band.y1) > Y(band.y2) ? 1 : -1) * Math.PI / 2, band.color || C.red);
    if (band.label) { b += text(xx + 6, (Y(band.y1) + Y(band.y2)) / 2 + 4, band.label, { color: band.color || C.red, size: 12, anchor: "start", bold: true }); }
  });
  (o.spans || []).forEach((sp) => {
    const yy = Y(sp.y);
    b += line(X(sp.x1), yy, X(sp.x2), yy, { color: sp.color || C.green, width: 1.6 });
    b += arrowHead(X(sp.x2), yy, 0, sp.color || C.green) + arrowHead(X(sp.x1), yy, Math.PI, sp.color || C.green);
    if (sp.label) { b += text((X(sp.x1) + X(sp.x2)) / 2, yy - 6, sp.label, { color: sp.color || C.green, size: 12, bold: true }); }
  });
  (o.points || []).forEach((p) => {
    b += dot(X(p.x), Y(p.y), p.color || C.red);
    if (p.label) { b += text(X(p.x) + (p.dx || 0), Y(p.y) + (p.dy || -9), p.label, { color: p.color || C.red, size: 12, bold: true }); }
  });
  if (o.axes) {
    if (o.axes.x) { b += text(w - pad.r, (y0 <= 0 && y1 >= 0 ? Y(0) : h - pad.b) - 6, o.axes.x, { color: C.muted, size: 11, anchor: "end" }); }
    if (o.axes.y) { b += text((x0 <= 0 && x1 >= 0 ? X(0) : pad.l) + 6, pad.t + 10, o.axes.y, { color: C.muted, size: 11, anchor: "start" }); }
  }
  return svgWrap(w, h, b, o.label);
}

/* sector(o) — o.thetaDeg, o.rLabel, o.angleLabel, o.arcLabel, o.shade */
function sector(o) {
  const R = 150, th = o.thetaDeg * Math.PI / 180, pad = 46;
  /* bounding box of the centre, both radii ends and the arc's extreme points */
  const xs = [0, R, R * Math.cos(th)], ys = [0, R * Math.sin(th)];
  [Math.PI / 2, Math.PI].forEach((a) => { if (a < th) { xs.push(R * Math.cos(a)); ys.push(R * Math.sin(a)); } });
  const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), maxY = Math.max.apply(null, ys);
  const w = Math.round(maxX - minX + 2 * pad + 30), h = Math.round(maxY + 2 * pad);
  const cx = pad - minX, cy = h - pad;
  const ex = cx + R * Math.cos(th), ey = cy - R * Math.sin(th);
  let b = "";
  const arc = arcPath(cx, cy, R, 0, th);
  if (o.shade) { b += '<path d="M' + cx + " " + cy + "L" + (cx + R) + " " + cy + arc.replace(/^M[^A]+/, "") + 'Z" fill="' + C.fill + '" stroke="none"/>'; }
  b += line(cx, cy, cx + R, cy, { color: C.text, width: 2 }) + line(cx, cy, ex, ey, { color: C.text, width: 2 });
  b += '<path d="' + arc + '" fill="none" stroke="' + C.brand + '" stroke-width="3"/>';
  b += '<path d="' + arcPath(cx, cy, 30, 0, th) + '" fill="none" stroke="' + C.red + '" stroke-width="1.8"/>';
  b += text(cx + 40 * Math.cos(th / 2) + 6, cy - 40 * Math.sin(th / 2) + 5, o.angleLabel, { color: C.red, size: 13, bold: true, anchor: "start" });
  b += text(cx + R / 2, cy + 18, o.rLabel, { color: C.text, size: 13 });
  const mid = th / 2;
  b += text(cx + (R + 18) * Math.cos(mid), cy - (R + 18) * Math.sin(mid), o.arcLabel, { color: C.brand, size: 13, bold: true, anchor: "start" });
  if (o.areaLabel) { b += text(cx + R * 0.55 * Math.cos(mid), cy - R * 0.55 * Math.sin(mid) + 4, o.areaLabel, { color: C.brand, size: 13, bold: true }); }
  b += dot(cx, cy, C.text);
  return svgWrap(w, h, b, o.label);
}

/* shape(o) — polygons / triangles from real coordinates.
   o.points: { A: [x,y], ... } (math coordinates), o.polygons: [["A","B","C"], ...]
   o.segments: [{ a, b, color, dash, label, ldx, ldy }]
   o.labels: { A: [dx, dy] } vertex label offsets, o.rightAngles: [["A","B","C"]] (right angle at B)
   o.angleMarks: [{ at, from, to, label, color, radius }]
   o.circles: [{ c: [x,y] or "P", r, dash }], o.extraText: [{ x, y, s, color }]
   o.width: px; scale computed to fit. */
function shape(o) {
  const pts = o.points;
  const all = Object.keys(pts).map((k) => pts[k]);
  (o.circles || []).forEach((c) => {
    const cc = typeof c.c === "string" ? pts[c.c] : c.c;
    all.push([cc[0] - c.r, cc[1] - c.r], [cc[0] + c.r, cc[1] + c.r]);
  });
  const minX = Math.min.apply(null, all.map((p) => p[0])), maxX = Math.max.apply(null, all.map((p) => p[0]));
  const minY = Math.min.apply(null, all.map((p) => p[1])), maxY = Math.max.apply(null, all.map((p) => p[1]));
  const W = o.width || 360, pad = 34;
  const s = (W - 2 * pad) / Math.max(maxX - minX, (maxY - minY) * 1.0, 1e-9);
  const H = Math.round((maxY - minY) * s + 2 * pad);
  const X = (x) => pad + (x - minX) * s, Y = (y) => H - pad - (y - minY) * s;
  const P = (k) => [X(pts[k][0]), Y(pts[k][1])];
  let b = "";
  (o.circles || []).forEach((c) => {
    const cc = typeof c.c === "string" ? pts[c.c] : c.c;
    b += circle(X(cc[0]), Y(cc[1]), c.r * s, { color: c.color || C.muted, dash: c.dash, width: 1.2 });
  });
  (o.polygons || []).forEach((poly, i) => {
    const d = poly.map((k, j) => (j ? "L" : "M") + r2(P(k)[0]) + " " + r2(P(k)[1])).join("") + "Z";
    b += '<path d="' + d + '" fill="' + (o.fills && o.fills[i] ? o.fills[i] : "none") + '" stroke="' + C.text + '" stroke-width="1.8"/>';
  });
  (o.segments || []).forEach((g) => {
    const a = P(g.a), c = P(g.b);
    b += line(a[0], a[1], c[0], c[1], { color: g.color || C.brand, dash: g.dash, width: g.width || 2 });
    if (g.label) { b += text((a[0] + c[0]) / 2 + (g.ldx || 0), (a[1] + c[1]) / 2 + (g.ldy || 0), g.label, { color: g.color || C.brand, size: 13, bold: true }); }
  });
  (o.sideLabels || []).forEach((g) => {
    const a = P(g.a), c = P(g.b);
    b += text((a[0] + c[0]) / 2 + (g.dx || 0), (a[1] + c[1]) / 2 + (g.dy || 0), g.label, { color: g.color || C.text, size: 13 });
  });
  (o.rightAngles || []).forEach((t) => {
    const p = pts[t[1]], u = pts[t[0]], v = pts[t[2]];
    const len = 10 / s;
    const du = [(u[0] - p[0]), (u[1] - p[1])], dv = [(v[0] - p[0]), (v[1] - p[1])];
    const nu = Math.hypot(du[0], du[1]), nv = Math.hypot(dv[0], dv[1]);
    const a = [p[0] + du[0] / nu * len, p[1] + du[1] / nu * len];
    const c = [p[0] + dv[0] / nv * len, p[1] + dv[1] / nv * len];
    const m = [a[0] + c[0] - p[0], a[1] + c[1] - p[1]];
    b += '<path d="M' + r2(X(a[0])) + " " + r2(Y(a[1])) + "L" + r2(X(m[0])) + " " + r2(Y(m[1])) + "L" + r2(X(c[0])) + " " + r2(Y(c[1])) + '" fill="none" stroke="' + C.text + '" stroke-width="1.2"/>';
  });
  (o.angleMarks || []).forEach((m) => {
    const p = pts[m.at], a1 = Math.atan2(pts[m.from][1] - p[1], pts[m.from][0] - p[0]), a2 = Math.atan2(pts[m.to][1] - p[1], pts[m.to][0] - p[0]);
    let from = a1, to = a2;
    while (to < from) { to += 2 * Math.PI; }
    if (to - from > Math.PI) { const t = from; from = to - 2 * Math.PI; to = t; }
    const r = (m.radius || 22);
    b += '<path d="' + arcPath(X(p[0]), Y(p[1]), r, from, to) + '" fill="none" stroke="' + (m.color || C.red) + '" stroke-width="1.8"/>';
    if (m.label) {
      const mid = (from + to) / 2, lr = r + 14;
      b += text(X(p[0]) + lr * Math.cos(mid), Y(p[1]) - lr * Math.sin(mid) + 4, m.label, { color: m.color || C.red, size: 12, bold: true });
    }
  });
  Object.keys(pts).forEach((k) => {
    if (o.hide && o.hide.indexOf(k) !== -1) { return; }
    const p = P(k), off = (o.labels && o.labels[k]) || [0, -10];
    b += dot(p[0], p[1], C.text) + text(p[0] + off[0], p[1] + off[1], k, { size: 14, bold: true });
  });
  (o.extraText || []).forEach((t) => { b += text(X(t.x), Y(t.y), t.s, { color: t.color || C.muted, size: t.size || 12, anchor: t.anchor || "middle" }); });
  return svgWrap(W, H, b, o.label);
}

/* numberLine(o) — positions on a straight line (displacement, relative motion).
   o.min, o.max, o.ticks: [values], o.unit: "m"
   o.arrows: [{ from, to, row, label, color }] row 0 = just above the line, 1, 2 … stacked upwards
   o.points: [{ v, label, color }]  o.width */
function numberLine(o) {
  const W = o.width || 460, pad = 30, rowH = 30;
  const rows = Math.max(1, ...(o.arrows || []).map((a) => (a.row || 0) + 1));
  const H = 40 + rows * rowH + 24, base = H - 34;
  const X = (v) => pad + (v - o.min) / (o.max - o.min) * (W - 2 * pad);
  let b = line(pad - 10, base, W - pad + 10, base, { color: C.axis, width: 1.4 }) + arrowHead(W - pad + 12, base, 0, C.axis);
  (o.ticks || []).forEach((t) => {
    b += line(X(t), base - 4, X(t), base + 4, { color: C.axis, width: 1.2 });
    b += text(X(t), base + 18, String(t) + (o.unit && t === o.ticks[o.ticks.length - 1] ? " " + o.unit : ""), { color: C.muted, size: 11 });
  });
  (o.arrows || []).forEach((a) => {
    const y = base - 16 - (a.row || 0) * rowH, color = a.color || C.brand;
    b += line(X(a.from), y, X(a.to), y, { color: color, width: 2.4 });
    b += arrowHead(X(a.to), y, a.to >= a.from ? 0 : Math.PI, color);
    if (a.label) { b += text((X(a.from) + X(a.to)) / 2, y - 7, a.label, { color: color, size: 12, bold: true }); }
  });
  (o.points || []).forEach((p) => {
    b += dot(X(p.v), base, p.color || C.text);
    if (p.label) { b += text(X(p.v), base + 32, p.label, { color: p.color || C.text, size: 12, bold: true }); }
  });
  return svgWrap(W, H + 12, b, o.label);
}

module.exports = { unitCircle, plot, sector, shape, numberLine, COLORS: C };
