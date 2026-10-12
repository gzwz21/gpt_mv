// v2 shared kit: plates (paper), lyric band (token streaming), keywords, camera, ChatGPT-specific widgets
const L = require('./lib');
const {F, W, H, P, clamp, lerp, seg, E, ease, rng, hash, noise1, au, auS, beatInfo, pulse, LRC, txt, txtAnim, measure, fillRR, rr, typed, createCanvas} = L;
const C = require('./common');
const U = require('./ui');
const A = require('./art');

// ---------- story colour states ----------
// she = lavender, you = cream, system = mono grey, error = red, absence = grey
const ST = {
  off: {bg: '#0d0d0f', paper: '#1a191c', me: '#9a95a0', you: '#cfcbd2', ink: '#2a272d', sys: '#6d6873', err: '#9a95a0'},
  on: {bg: '#0c0a0f', paper: '#1d1824', me: '#B9A3DA', you: '#F5E9D6', ink: '#33223A', sys: '#8b8394', err: '#ff4d6d'},
  warm: {bg: '#100b14', paper: '#251c2e', me: '#CDB6F2', you: '#FFF3E2', ink: '#3A2546', sys: '#9a90a6', err: '#ff4d6d'},
  error: {bg: '#0f0709', paper: '#1e0f13', me: '#ff6b85', you: '#f3d9d9', ink: '#2B1218', sys: '#b0707c', err: '#ff4d6d'},
  errWarm: {bg: '#0f0709', paper: '#221218', me: '#CDB6F2', you: '#F5E9D6', ink: '#2B1218', sys: '#b0707c', err: '#ff4d6d'},
  ash: {bg: '#0c0b0c', paper: '#18161a', me: '#8f8796', you: '#b9b2b6', ink: '#221e22', sys: '#5f5a62', err: '#7a6a6e'},
};

// ---------- paper plate background with grain + halftone ----------
const paperCache = {};
function paperTex(seed) {
  if (paperCache[seed]) return paperCache[seed];
  const cv = createCanvas(W / 2, H / 2), c = cv.getContext('2d'); const id = c.createImageData(W / 2, H / 2), R = rng(seed);
  for (let i = 0; i < id.data.length; i += 4) { const n = (R() - .5) * 30 + (noise1(i / 4 % (W / 2) * .02 + R() * .2) - .5) * 18; id.data[i] = id.data[i + 1] = id.data[i + 2] = 128 + n; id.data[i + 3] = 255; }
  c.putImageData(id, 0, 0); return paperCache[seed] = cv;
}
function paper(c, col, o = {}) {
  c.save(); c.fillStyle = col; c.fillRect(-20, -20, W + 40, H + 40);
  c.globalCompositeOperation = 'overlay'; c.globalAlpha = o.grain == null ? .35 : o.grain; c.drawImage(paperTex(o.seed || 1), 0, 0, W, H);
  c.restore();
  if (o.halftone) halftone(c, o.halftone);
  if (o.marks !== false) cropMarks(c, o.markColor || 'rgba(255,255,255,.18)');
}
function halftone(c, o) {
  const s = o.s || 18; c.save(); c.fillStyle = o.color || 'rgba(255,255,255,.06)';
  for (let y = 0; y < H + s; y += s) for (let x = (y / s % 2) * s / 2; x < W + s; x += s) {
    const d = o.fn ? o.fn(x, y) : 0.5; const r = s * .42 * clamp(d); if (r < .4) continue; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
  c.restore();
}
function cropMarks(c, col) {
  c.save(); c.strokeStyle = col; c.lineWidth = 1.5; const m = 34, l = 26;
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    c.beginPath(); c.moveTo(x - sx * 10, y); c.lineTo(x + sx * l, y); c.moveTo(x, y - sy * 10); c.lineTo(x, y + sy * l); c.stroke();
  }
  // registration target
  c.beginPath(); c.arc(W / 2, 28, 7, 0, 7); c.moveTo(W / 2 - 13, 28); c.lineTo(W / 2 + 13, 28); c.moveTo(W / 2, 15); c.lineTo(W / 2, 41); c.stroke();
  c.restore();
}

// ---------- camera ----------
// cam(c, {x,y (focus point), z (zoom), r (rot), shake, t}) — call inside save/restore; maps focus point to screen centre
function cam(c, o) {
  const z = o.z || 1; c.translate(W / 2, H / 2);
  if (o.shake) C.shake(c, o.shake, o.t || 0, o.seed || 1);
  if (o.r) c.rotate(o.r); c.scale(z, z); c.translate(-(o.x == null ? W / 2 : o.x), -(o.y == null ? H / 2 : o.y));
}
// critically-damped spring step response (closed form) — value from 0 to 1 starting at t0, freq w (rad/s), zeta
function spring(t, t0, w = 14, zeta = .55) {
  const x = t - t0; if (x <= 0) return 0;
  if (zeta < 1) { const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); }
  return 1 - Math.exp(-w * x) * (1 + w * x);
}
// anticipation-then-overshoot pop for beat hits: returns scale offset
function hit(t, t0, amt = .08) {
  const x = t - t0; if (x < -.07) return 0; if (x < 0) return -amt * .4 * (1 + x / .07) * (-x / .07) * 4; // tiny anticipation
  return amt * Math.exp(-x * 9) * Math.cos(x * 22);
}
// kick-driven bump (uses detected kicks)
const KICKS = L.au && require('./assets/audio.json').kicks;
function lastKick(t) { let lo = 0, hi = KICKS.length - 1; if (t < KICKS[0]) return -9; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (KICKS[m] <= t) lo = m; else hi = m - 1; } return KICKS[lo]; }
const kick = (t, k = 10) => Math.exp(-(t - lastKick(t)) * k);

// ---------- lyric helpers ----------
function lyricIdx(t) { for (let i = LRC.length - 1; i >= 0; i--) if (LRC[i].t <= t + 1e-6) return i; return -1; }
function lyr(i) { return LRC[i]; }
// find lyric by text start
function lyricFind(s, after = 0) { return LRC.findIndex(l => l.t >= after - .01 && l.s.startsWith(s)); }
// ChatGPT token streaming: words appear over 75% of the line, with the ● cursor while streaming
function stream(c, s, t0, dur, t, x, y, o = {}) {
  const words = s.split(' '); const font = o.font || F.serif(56); c.save(); c.font = font; const sp = c.measureText(' ').width;
  const ws = words.map(w => c.measureText(w).width); c.restore();
  const tw = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let ax = o.align === 'left' ? x : o.align === 'right' ? x - tw : x - tw / 2; const startX = ax;
  const p = clamp((t - t0) / Math.max(.05, dur)); const nShown = p * words.length; let endX = ax;
  words.forEach((w, i) => {
    const k = clamp(nShown - i); if (k <= 0) return;
    txt(c, w, ax, y, {font, color: o.colorFn ? o.colorFn(i, w) : (o.color || P.lav), alpha: (o.a == null ? 1 : o.a) * (0.25 + .75 * clamp(k * 2)), glow: o.glow});
    ax += ws[i] + sp; endX = ax;
  });
  if (o.cursor !== false && p < 1 && t >= t0) {
    const sz = (o.dot || 11) * (1 + .15 * Math.sin(t * 20));
    c.save(); c.fillStyle = o.dotColor || o.color || P.lav; c.beginPath(); c.arc(endX + sz, y - sz * 1.6, sz, 0, 7); c.fill(); c.restore();
  }
  return {w: tw, x0: startX};
}
// the lyric band used across plates: English streamed (serif, her colour) + nothing else (Chinese is global subtitle)
let CUR = null; function setCur(s) { CUR = s; }
const MOTIF = {pager: 1.6, toast: 1.5, pagerY: 92};
function band(c, t, o = {}) {
  if (CUR && t >= CUR.b) return;   // outgoing shot during a transition: no second band
  const i = lyricIdx(t); if (i < 0) return; const l = LRC[i]; if (!l.s || t > l.e + .2) return;
  if (o.skip && o.skip(l)) return;
  const a = (1 - ease(t, l.e - .08, l.e + .05)) * (o.a == null ? 1 : o.a);
  if (a <= 0) return;
  const y = o.y || H - 132;
  if (o.strip !== false) { c.save(); c.globalAlpha = a * (o.stripA || .82); c.fillStyle = o.stripColor || '#0a080c'; const words = l.s.split(' '); const sd = Math.min(l.e - l.t, 1.6) * .8; const nw = Math.max(1, Math.ceil(clamp((t - l.t) / Math.max(.05, sd)) * words.length)); const full = measure(c, l.s, o.font || F.serif(54)); const part = measure(c, words.slice(0, nw).join(' '), o.font || F.serif(54)); const w = part + 110; const x = o.align === 'left' ? (o.x || 120) - 55 : (o.x || W / 2) - full / 2 - 55; c.fillRect(x, y - 62, w, 84); c.restore(); }
  stream(c, l.s, l.t, Math.min(l.e - l.t, 1.6) * .8, t, o.x || (o.align === 'left' ? 120 : W / 2), y, {font: o.font || F.serif(54), color: o.color || P.lav, align: o.align || 'center', a});
}
// huge keyword with per-letter punch & ink misregistration
function keyword(c, s, x, y, t, t0, o = {}) {
  const font = o.font || F.disp(800, o.size || 200); const cols = o.cols || [P.cream, P.lav, P.plum];
  const reg = (o.reg == null ? 14 : o.reg) * kick(t, 8);
  const draw = (col, dx, dy, alpha) => txtAnim(c, s, x + dx, y + dy, {font, align: o.align || 'center', tracking: o.tracking || 0, color: col}, (i, n) => {
    const p = spring(t, t0 + i * (o.stagger == null ? .03 : o.stagger), 16, .5);
    return {a: clamp(p * 3) * alpha, s: lerp(1.6, 1, clamp(p)), dy: (1 - clamp(p)) * -30};
  });
  if (cols[2]) draw(cols[2], reg, reg * .6, 1);
  if (cols[1]) draw(cols[1], -reg * .7, reg * .3, 1);
  draw(cols[0], 0, 0, 1);
}

// ---------- ChatGPT-specific widgets ----------
// regenerate pager  "‹ 2 / 5 ›"
function pager(c, x, y, n, of, o = {}) {
  const col = o.color || P.sub, font = o.font || F.ui(500, o.size || 22);
  txt(c, '‹', x - (o.size || 22) * 2.2, y, {font, color: col, align: 'center'});
  txt(c, `${n} / ${of}`, x, y, {font, color: o.numColor || P.text, align: 'center'});
  txt(c, '›', x + (o.size || 22) * 2.2, y, {font, color: col, align: 'center'});
}
// circular "regenerate" arrow icon
function regenIcon(c, x, y, r, rot = 0, col = P.text, lw) {
  c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw || r * .18; c.lineCap = 'round';
  c.beginPath(); c.arc(0, 0, r, -Math.PI * .15, Math.PI * 1.55); c.stroke();
  const a = Math.PI * 1.55, hx = Math.cos(a) * r, hy = Math.sin(a) * r;
  c.beginPath(); c.moveTo(hx + r * .45, hy - r * .05); c.lineTo(hx, hy); c.lineTo(hx + r * .1, hy + r * .45); c.stroke(); c.restore();
}
// toast like "Memory updated"
function toast(c, x, y, text, o = {}) {
  const font = o.font || F.ui(500, 20); const w = measure(c, text, font) + (o.icon ? 80 : 48), h = 48;
  c.save(); c.globalAlpha *= o.a == null ? 1 : o.a;
  fillRR(c, x - w / 2, y - h / 2, w, h, 12, o.bg || '#2a2430', o.border || '#3b3446', 1.5);
  if (o.icon === 'mem') { c.strokeStyle = o.iconColor || P.lav; c.lineWidth = 2; c.beginPath(); c.arc(x - w / 2 + 30, y, 9, 0, 7); c.stroke(); c.beginPath(); c.arc(x - w / 2 + 30, y, 3, 0, 7); c.fillStyle = o.iconColor || P.lav; c.fill(); }
  if (o.icon === 'err') { c.fillStyle = P.red; c.beginPath(); c.arc(x - w / 2 + 30, y, 10, 0, 7); c.fill(); txt(c, '!', x - w / 2 + 30, y + 7, {font: F.ui(700, 16), color: '#fff', align: 'center'}); }
  txt(c, text, x - w / 2 + (o.icon ? 54 : 24), y + 7, {font, color: o.color || P.text});
  c.restore(); return w;
}
// thumbs up / down under a reply
function thumbs(c, x, y, s, o = {}) {
  const col = o.color || P.sub;
  c.save(); c.translate(x, y); c.scale(s / 24, s / 24); c.strokeStyle = col; c.fillStyle = o.fill || 'transparent'; c.lineWidth = 2; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-10, -1); c.lineTo(-10, 11); c.lineTo(-5, 11); c.lineTo(-5, -1); c.closePath(); if (o.fill) c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-5, -1); c.lineTo(0, -11); c.quadraticCurveTo(4, -12, 4, -7); c.lineTo(3, -2); c.lineTo(10, -2); c.quadraticCurveTo(13, -1, 12, 3); c.lineTo(10, 9); c.quadraticCurveTo(9, 11, 6, 11); c.lineTo(-5, 11); if (o.fill) c.fill(); c.stroke();
  c.restore();
}
// "Thinking" shimmer label
function thinking(c, x, y, t, o = {}) {
  const s = o.text || 'Thinking'; const font = o.font || F.ui(500, 24);
  txtAnim(c, s, x, y, {font, align: o.align || 'left'}, (i, n) => { const ph = (t * 1.4 - i / n) % 1; const b = Math.exp(-Math.pow((ph - .5) * 6, 2)); return {color: A.mixHex('#6b6377', '#f1ecf7', b)}; });
}
// voice-mode orb: breathing blob reacting to audio
function orb(c, x, y, r, t, o = {}) {
  const lv = o.level == null ? auS('rms', t, 4) : o.level; const R = r * (1 + lv * .35);
  c.save(); const g = c.createRadialGradient(x - R * .3, y - R * .35, R * .1, x, y, R);
  g.addColorStop(0, o.c0 || '#f3ecff'); g.addColorStop(.55, o.c1 || '#B9A3DA'); g.addColorStop(1, o.c2 || '#5b4385');
  c.fillStyle = g; c.beginPath();
  for (let k = 0; k <= 64; k++) { const a = k / 64 * Math.PI * 2; const rr2 = R * (1 + .05 * Math.sin(a * 3 + t * 2) * (1 + lv * 2) + .03 * Math.sin(a * 5 - t * 3)); const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2; k ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.closePath(); if (o.glow) { c.shadowColor = o.c1 || '#B9A3DA'; c.shadowBlur = o.glow; } c.fill(); c.restore();
}
// the user's cursor (cream)
function pointer(c, x, y, s = 1, o = {}) {
  c.save(); c.globalAlpha *= o.a == null ? 1 : o.a; c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 26); c.lineTo(7, 20); c.lineTo(12, 31); c.lineTo(16, 29); c.lineTo(11, 18); c.lineTo(20, 18); c.closePath();
  if (o.outline) { c.setLineDash(o.dash ? [4, 4] : []); c.strokeStyle = o.color || P.cream; c.lineWidth = 2 / s; c.stroke(); }
  else { c.fillStyle = o.color || P.cream; c.fill(); c.strokeStyle = '#0c0a0f'; c.lineWidth = 1.5 / s; c.stroke(); }
  c.restore();
}
// click ripple
function ripple(c, x, y, t, t0, o = {}) { const p = seg(t, t0, t0 + .4); if (p <= 0 || p >= 1) return; c.save(); c.strokeStyle = o.color || P.cream; c.globalAlpha = 1 - p; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 8 + p * 50, 0, 7); c.stroke(); c.restore(); }
// heart curve point (algebraic heart)
function heartPt(u, s = 1) { const x = 16 * Math.pow(Math.sin(u), 3), y = -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)); return [x * s, y * s]; }
function heartPath(c, x, y, s) { c.beginPath(); for (let k = 0; k <= 120; k++) { const [px, py] = heartPt(k / 120 * Math.PI * 2, s); k ? c.lineTo(x + px, y + py) : c.moveTo(x + px, y + py); } c.closePath(); }

// speed lines / radial rays
function rays(c, x, y, n, r0, r1, col, a = .5, rot = 0, wid = .04) {
  c.save(); c.fillStyle = col; c.globalAlpha *= a;
  for (let i = 0; i < n; i++) { const an = rot + i / n * Math.PI * 2; c.beginPath(); c.moveTo(x + Math.cos(an - wid) * r0, y + Math.sin(an - wid) * r0); c.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); c.lineTo(x + Math.cos(an + wid) * r0, y + Math.sin(an + wid) * r0); c.fill(); }
  c.restore();
}

module.exports = {setCur, MOTIF, ST, paper, halftone, cropMarks, cam, spring, hit, kick, lastKick, KICKS, lyricIdx, lyr, lyricFind, stream, band, keyword,
  pager, regenIcon, toast, thumbs, thinking, orb, pointer, ripple, heartPt, heartPath, rays};
