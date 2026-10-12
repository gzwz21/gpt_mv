// helpers for shots4/a.js (Part A v4). Underscore file: not loaded as a shot module.
const L = require('../lib');
const K = require('../kit');
const U = require('../ui');
const IX = require('../ix');
const {F, W, H, P, clamp, lerp, seg, E, ease, txt, measure, fillRR, rr} = L;

// camera mapping identical to K.cam (minus shake): screen = C + Rot(r)·z·(p − f)
function camMap(o) {
  const z = o.z || 1, r = o.r || 0, fx = o.x == null ? W / 2 : o.x, fy = o.y == null ? H / 2 : o.y, cs = Math.cos(r), sn = Math.sin(r);
  return p => { const dx = (p[0] - fx) * z, dy = (p[1] - fy) * z; return [W / 2 + dx * cs - dy * sn, H / 2 + dx * sn + dy * cs]; };
}
// draw Kai's cursor for a take authored in world coords, mapped to screen
function cursorMapped(c, s, map, o = {}) {
  const p = map([s.x, s.y]);
  const tk = Object.assign({}, s.tk, {ev: s.tk.ev.map(e => Object.assign({}, e, {p: map(e.p)}))});
  IX.cursor(c, Object.assign({}, s, {x: p[0], y: p[1], tk}), o);
}
const CAP_Y = H - 82;
function cap(c, s) { IX.caption(c, s, {y: CAP_Y}); }

// misregistered ink stroke around a rounded rect (cream / lav / plum plates)
function regStroke(c, x, y, w, h, r, off, o = {}) {
  const cols = o.cols || [P.plum, P.lav, P.cream], al = o.a == null ? 1 : o.a;
  const offs = [[off, off * .6], [-off * .7, off * .3], [0, 0]];
  cols.forEach((col, i) => { if (!col) return; c.save(); c.globalAlpha *= (i === 2 ? 1 : .55) * al; c.translate(offs[i][0], offs[i][1]); rr(c, x, y, w, h, r); c.strokeStyle = col; c.lineWidth = o.lw || 1.5; c.stroke(); c.restore(); });
}
// ink card: dark plate + faint misregistered edge (used for in-scene widgets)
function inkCard(c, x, y, w, h, o = {}) {
  c.save(); c.globalAlpha *= o.a == null ? 1 : o.a;
  c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 24; c.shadowOffsetY = 6; fillRR(c, x, y, w, h, o.r || 16, o.bg || 'rgba(27,23,32,.94)'); c.shadowColor = 'transparent';
  fillRR(c, x, y, w, h, o.r || 16, null, P.line2, 1.5);
  if (o.reg) regStroke(c, x, y, w, h, o.r || 16, o.reg, {a: .8});
  if (o.title) { txt(c, o.title, x + 18, y + 30, {font: o.titleFont || F.mono(500, 16), color: P.sub}); c.fillStyle = P.line; c.fillRect(x + 1, y + 44, w - 2, 1); }
  c.restore();
}
// segmented control; items: labels, sel index, hi (hover 0..1 per index), press per index
function segmented(c, x, y, items, sel, o = {}) {
  const f = o.font || F.ui(600, 17), pad = 18, h = o.h || 36; let cx = x; const rects = [];
  const iw = s => o.iw || measure(c, s, f) + pad * 2;
  const tw = items.reduce((a, s) => a + iw(s), 0);
  fillRR(c, x - 4, y - 4, tw + 8, h + 8, (h + 8) / 2, 'rgba(255,255,255,.04)', P.line2, 1.2);
  items.forEach((s, i) => {
    const w = iw(s), r = {x: cx, y, w, h}; rects.push(r);
    const on = i === sel, pr = (o.press && o.press[i]) || 0, hv = (o.hover && o.hover[i]) || 0;
    c.save(); const k = 1 - .05 * pr; c.translate(cx + w / 2, y + h / 2); c.scale(k, k); c.translate(-cx - w / 2, -y - h / 2);
    if (on) fillRR(c, cx, y, w, h, h / 2, P.lav);
    else if (hv > 0) fillRR(c, cx, y, w, h, h / 2, `rgba(255,255,255,${.07 * hv})`);
    txt(c, s, cx + w / 2, y + h / 2 + 6, {font: f, color: on ? P.plum : P.sub, align: 'center'});
    c.restore(); cx += w;
  });
  return rects;
}
// layout-only version of segmented (for take authoring)
function segRects(items, x, y, font, h = 36) {
  const cv = L.createCanvas(10, 10).getContext('2d'); let cx = x; return items.map(s => { cv.font = font; const w = cv.measureText(s).width + 36; const r = {x: cx, y, w, h}; cx += w; return r; });
}
// thin ink slider: track + ticks + cream knob with plum ring. v continuous 0..n-1
function inkSlider(c, x, y, w, n, v, o = {}) {
  c.save(); c.globalAlpha *= o.a == null ? 1 : o.a;
  fillRR(c, x, y - 2.5, w, 5, 2.5, P.line2);
  fillRR(c, x, y - 2.5, Math.max(5, w * v / (n - 1)), 5, 2.5, P.lav);
  for (let i = 0; i < n; i++) { const tx = x + w * i / (n - 1), fl = o.flash && o.flash[i] != null && o.t >= o.flash[i] ? Math.exp(-(o.t - o.flash[i]) * 9) : 0; c.fillStyle = v >= i - .01 ? P.lav : P.dim; c.beginPath(); c.arc(tx, y, 4 + 4 * fl, 0, 7); c.fill();
    if (o.labels) txt(c, o.labels[i], tx, y + 30, {font: F.mono(Math.round(v) === i ? 700 : 400, o.lsize || 14), color: Math.round(v) === i ? P.text : P.dim, align: i === 0 ? 'left' : i === n - 1 ? 'right' : 'center'});
  }
  const kx = x + w * v / (n - 1), g = o.grab || 0;
  if (g > 0) { c.globalAlpha *= 1; c.fillStyle = 'rgba(212,196,242,.22)'; c.beginPath(); c.arc(kx, y, 22, 0, 7); c.fill(); }
  c.fillStyle = P.cream; c.strokeStyle = P.plum; c.lineWidth = 2.5; c.beginPath(); c.arc(kx, y, 11 * (1 + .2 * g), 0, 7); c.fill(); c.stroke();
  c.restore();
  return kx;
}
// subtle usage bar in ink (no saturated colours)
function quotaInk(c, x, y, w, frac, o = {}) {
  c.save(); c.globalAlpha *= o.a == null ? 1 : o.a;
  const f = F.ui(500, o.size || 13);
  txt(c, o.label || 'Usage remaining', x, y - 8, {font: f, color: P.dim});
  txt(c, Math.round(frac * 100) + '%', x + w, y - 8, {font: F.mono(600, o.size || 13), color: P.sub, align: 'right'});
  fillRR(c, x, y, w, 6, 3, 'rgba(255,255,255,.06)', P.line2, 1);
  if (frac > .002) fillRR(c, x, y, Math.max(6, w * clamp(frac)), 6, 3, P.lav);
  // 10 notches
  c.fillStyle = 'rgba(12,10,15,.55)'; for (let i = 1; i < 10; i++) c.fillRect(x + w * i / 10 - .5, y, 1, 6);
  c.restore();
}
// model chip inside a composer
function modelChip(c, x, y, label, o = {}) {
  const f = F.ui(600, o.size || 16), w = measure(c, label, f) + 44, h = o.h || 30;
  c.save(); c.globalAlpha *= o.a == null ? 1 : o.a;
  fillRR(c, x, y, w, h, h / 2, o.hover ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.035)', P.line2, 1.2);
  txt(c, label, x + 14, y + h / 2 + 6, {font: f, color: P.text});
  U.icon(c, 'chev', x + w - 16, y + h / 2 - 1, 6, P.sub);
  c.restore(); return {x, y, w, h};
}
// little check box
function checkbox(c, x, y, on, o = {}) {
  const s = o.s || 22; fillRR(c, x, y, s, s, 5, on > .5 ? (o.col || P.lav) : 'rgba(255,255,255,.04)', on > .5 ? null : P.line2, 1.5);
  if (on > 0) { c.save(); c.strokeStyle = P.plum; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round'; const p = clamp(on); c.beginPath(); c.moveTo(x + s * .24, y + s * .52); c.lineTo(x + s * .43, y + s * .7); if (p > .5) c.lineTo(x + s * lerp(.43, .78, (p - .5) * 2), y + s * lerp(.7, .3, (p - .5) * 2)); c.stroke(); c.restore(); }
}
// pop amount for a reaction that starts at tr
function popAmt(t, tr) { if (tr == null || t < tr) return 0; const x = t - tr; return Math.exp(-x * 8) * Math.cos(x * 20); }

module.exports = {camMap, cursorMapped, cap, CAP_Y, regStroke, inkCard, segmented, segRects, inkSlider, quotaInk, modelChip, checkbox, popAmt};
