// PART A v4  0.00 – 58.65  (shots A1–A16) — v2.1 base + Kai's cursor (rule 1) + lore details (rule 2), see STORY4.md
const L = require('../lib');
const K = require('../kit');
const A = require('../art');
const U = require('../ui');
const C = require('../common');
const {F, W, H, P, clamp, lerp, seg, E, ease, rng, noise1, auS, txt, txtAnim, measure, fillRR, rr, typed} = L;
const ST = K.ST;
const IX = require('../ix');
const HX = require('./_a_helpers');
const DL = IX.DL;
const V4S = require('../shots/v4sample.js').V4;
// camera params identical to cam() below, for mapping world -> screen
function camP(t, a, b, o = {}) { return {x: o.x, y: o.y, z: lerp(o.z0 == null ? 1 : o.z0, o.z1 == null ? 1.06 : o.z1, E.ioC(seg(t, a, b))), r: o.r || 0}; }
const toS = (t, a, b, o, p) => HX.camMap(camP(t, a, b, o))(p);
// manual fast typing (montage speed) for a take: evenly spaced chars with tiny jitter
function fastType(tk, id, s, t0, t1) { const ev = tk.typing[id] = tk.typing[id] || []; const n = s.length; for (let i = 0; i < n; i++) ev.push({t: t0 + (t1 - t0) * (i + 1) / n + (L.hash(i * 7.7) - .5) * .008, s: s.slice(0, i + 1)}); }


// ---------------------------------------------------------------- helpers (local to part A)
const kk = (t, k = 9) => K.kick(t, k);
// puppet figure with kick squash / bob / misregistration baked in
function fig(c, name, t, o = {}) {
  const k = kk(t), amt = o.kAmt == null ? 1 : o.kAmt;
  const q = Object.assign({t, sway: 12, regSeed: (Math.floor(K.lastKick(t) * 60) % 97) + 1}, o);
  q.reg = (o.reg || 0) + 14 * k * amt;
  q.bob = (o.bob || 0) - 12 * k * amt;
  q.sx = (o.sx || 1) * (1 + .022 * k * amt);
  q.sy = (o.sy || 1) * (1 - .03 * k * amt);
  const r = A.draw(c, name, q);
  if (o.blink > 0 && EYES[name]) drawBlink(c, name, q, o.blink);
  return r;
}
// eyelids over the art (image-px eye boxes [cx, cy, w, h, tilt])
const EYES = {happy: [[497, 362, 84, 58, -.28], [372, 404, 78, 60, -.3]]};
function drawBlink(c, name, q, b) {
  const s = A.size(name), sc = q.h / s.h, t = q.t || 0, br = 1 + (q.breathe == null ? .012 : q.breathe) * Math.sin(t * Math.PI * 2 / 3.6);
  const pal = typeof q.pal === 'string' ? A.INK[q.pal] : (q.pal || A.INK.orig);
  c.save(); c.globalAlpha *= q.alpha == null ? 1 : q.alpha;
  c.translate(q.x, q.y + (q.bob || 0)); if (q.rot) c.rotate(q.rot);
  c.scale((q.sx || 1) * sc * (2 - br) ** .3, (q.sy || 1) * sc * br);
  EYES[name].forEach(([ex, ey, ew, eh, tl]) => {
    c.save(); c.translate(ex - s.w / 2, ey - s.h / 2); c.rotate(tl);
    const ly = -eh / 2 - 4 + (eh + 4) * b * .8;
    c.save(); c.beginPath(); c.ellipse(0, 0, ew / 2 + 8, eh / 2 + 6, 0, 0, 7); c.clip();
    c.fillStyle = pal[0]; c.fillRect(-ew, -eh, ew * 2, ly + eh + eh * .12 * b); c.restore();
    c.strokeStyle = pal[2]; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-ew / 2 + 4, ly - 6); c.quadraticCurveTo(0, ly + eh * .3 * b, ew / 2 + 2, ly - 10); c.stroke();
    c.restore();
  });
  c.restore();
}
// blink amount on beat 2 of each bar (beat index % 4 == 1)
function blinkAt(t) { const bi = L.beatInfo(t); if (bi.i < 0 || bi.i % 4 !== 1) return 0; const d = bi.dt; return d < .06 ? d / .06 : d < .14 ? 1 - (d - .06) / .08 : 0; }
// camera wrapper: push z0->z1 over [a,b], kick shake
function cam(c, t, a, b, o = {}) {
  c.save();
  const p = E.ioC(seg(t, a, b));
  K.cam(c, {x: o.x, y: o.y, z: lerp(o.z0 == null ? 1 : o.z0, o.z1 == null ? 1.06 : o.z1, p), r: o.r || 0, shake: (o.sh == null ? 5 : o.sh) * kk(t), t, seed: o.seed || 3});
}
function desat(c, amt = 1) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'saturation'; c.globalAlpha = amt; c.fillStyle = '#808080'; c.fillRect(0, 0, W, H); c.restore(); }
function plate(c, col, seed, o = {}) { K.paper(c, col, Object.assign({seed, grain: .28}, o)); }
// misregistered stroke rect (3 inks)
function regRect(c, x, y, w, h, r, cols, off, lw = 2) {
  const offs = [[off, off * .6], [-off * .7, off * .3], [0, 0]];
  cols.forEach((col, i) => { if (!col) return; c.save(); c.translate(offs[i][0], offs[i][1]); rr(c, x, y, w, h, r); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); c.restore(); });
}
const bez = (p0, p1, p2, p3, u) => { const v = 1 - u; return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]; };
// mono code line typed with block caret
function code(c, s, x, y, p, o = {}) {
  const font = o.font || F.mono(400, 26); const sh = typed(s, p);
  const w = txt(c, sh, x, y, {font, color: o.color || P.sub});
  if (p > 0 && (p < 1 || o.caret) && Math.floor((o.t || 0) * 4) % 2 === 0) { c.fillStyle = o.caretColor || o.color || P.sub; c.fillRect(x + w + 3, y - 22, 13, 26); }
  return w;
}
function caret(c, x, y, h, t, col) { if (Math.floor(t * 3.2) % 2 === 0) { c.fillStyle = col; c.fillRect(x, y, 3, h); } }
// knot flower in hair (fraction of art image) -> screen pos for given draw params
const KNOT = {memory: [.615, .175], happy: [.6, .17]};
function artPt(name, fx, fy, x, y, h) { const s = A.size(name); const w = h * s.w / s.h; return [x + (fx - .5) * w, y + (fy - .5) * h]; }

// ---------------------------------------------------------------- A1 POWER  (Kai: Log in → Verify your age → 3 more checks; each shield follows a click)
const A1T = {login: .133, checks: [1.650, 2.100, 2.550, 3.033]};
const A1_LOGIN = {x: 1560, y: 46, w: 104, h: 40};
const A1_PANEL = {x: 1566, y: 318, w: 300, h: 262};
const A1_ROWS = ['Verify your age', 'moderation', 'alignment', 'system prompt'];
const A1_SH = ['age: verified', 'moderation: on', 'alignment: on', 'system prompt: loaded'];
const a1Row = i => ({x: A1_PANEL.x + 14, y: A1_PANEL.y + 58 + i * 48, w: A1_PANEL.w - 28, h: 40});
const A1K = IX.take({start: [1650, 150], seed: 101}, [
  {click: 'login', to: A1_LOGIN, press: A1T.login, dur: .2, cap: 'click · Log in'},
  ...A1T.checks.map((T, i) => ({click: 'chk' + i, to: [a1Row(i).x + 21, a1Row(i).y + 20], press: T, cap: 'click · ' + A1_ROWS[i]})),
]);
const A1 = {id: 'A1', a: 0, b: 3.58, draw(c, t, fx) {
  const s = IX.at(A1K, t);
  C.bg(c, '#060507');
  const S = ST.off;
  cam(c, t, 0, 3.58, {z0: 1, z1: 1.07, sh: 4});
  const cx = W / 2, cy = 500, ww = 1120, wh = 700;
  const lp = ease(t, A1T.login + DL, .9, E.ioC);
  const op = K.spring(t, .9, 9, .62);
  // boot log
  const log = [['> power_line.connect()', .25], ['  voltage ........ ok', .55], ['  window ......... opening', .95], ['> safety.load()', 1.3]];
  log.forEach(([ls, t0], i) => code(c, ls, 120, 110 + i * 34, seg(t, t0, t0 + .3), {font: F.mono(400, 22), color: '#5d5862', t}));
  if (op <= .001) {
    if (lp > 0) {
      const x0 = cx - ww / 2, x1 = x0 + ww * lp;
      c.save(); c.strokeStyle = S.me; c.lineWidth = 2; c.shadowColor = '#cfc6dc'; c.shadowBlur = 14;
      c.beginPath(); c.moveTo(x0, cy); c.lineTo(x1, cy); c.stroke(); c.restore();
      C.radial(c, x1, cy, 70, 'rgba(220,210,235,.8)', .9 * (1 - ease(t, .8, .9)));
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x1, cy, 4, 0, 7); c.fill();
    }
  } else {
    const hh = Math.max(2, wh * op);
    c.save(); rr(c, cx - ww / 2, cy - hh / 2, ww, hh, 14); c.clip();
    c.fillStyle = '#121114'; c.fillRect(cx - ww / 2, cy - hh / 2, ww, hh);
    C.dotGrid(c, t, {s: 40, a: .12, color: '#3a383d', oy: t * 8});
    C.radial(c, cx, cy, 420, 'rgba(150,145,160,.18)');
    const snap = A1T.checks.reduce((m, T) => Math.max(m, t >= T + DL ? Math.exp(-(t - T - DL) * 9) : 0), 0);
    fig(c, 'sleep', t, {x: cx, y: cy + 10 + Math.sin(t * 1.6) * 14, h: 560, pal: 'off', rot: .052 * Math.sin(t * Math.PI * 2 / 4), sway: 22, swayF: .3, breathe: .02, wave: {amp: 6, k: 9, f: 3.2}, reg: 16 * snap, sx: 1 + .03 * snap, sy: 1 - .03 * snap, alpha: clamp(op * 1.4), kAmt: .4});
    c.restore();
    c.save(); c.shadowColor = '#cfc6dc'; c.shadowBlur = 16; rr(c, cx - ww / 2, cy - hh / 2, ww, hh, 14); c.strokeStyle = S.me; c.lineWidth = 2; c.stroke(); c.restore();
  }
  // safety shields snap around her, one per Kai click
  A1_SH.forEach((lab, i) => {
    const t0 = A1T.checks[i] + DL, p = K.spring(t, t0, 16, .5); if (p <= 0) return;
    const sw = 300 + i * 70, sh = 420 + i * 50, sc = lerp(1.35, 1, clamp(p)) * (1 + (p - 1) * .2);
    const off = 12 * Math.exp(-(t - t0) * 7);
    c.save(); c.translate(cx, cy + 10); c.scale(sc, sc); c.globalAlpha = clamp(p * 3) * (i === 0 ? .9 : .75);
    regRect(c, -sw / 2, -sh / 2, sw, sh, 40 + i * 6, ['#4b4750', '#8e8896', i === 0 ? '#e0dce4' : '#bdb8c4'], off, 2);
    txt(c, '✓ ' + lab, -sw / 2 + 18, -sh / 2 - 12, {font: F.mono(400, 19), color: i === 0 ? '#e0dce4' : '#9a95a0'});
    c.restore();
  });
  c.restore();
  // --- browser strip (screen space): chatgpt.com + Log in → Kai
  const logged = t >= A1T.login + DL;
  c.save(); c.globalAlpha = .95;
  fillRR(c, 300, 46, 1238, 40, 20, '#141317', '#2b292f', 1.5);
  txt(c, 'chatgpt.com', 330, 73, {font: F.mono(400, 18), color: '#8e8896'});
  c.restore();
  if (!logged) IX.button(c, A1_LOGIN, 'Log in', {hover: IX.hover(s, A1_LOGIN), press: IX.press(s, 'login'), variant: 'primary', bg: '#d9d5dc', color: '#141317', size: 17});
  else {
    const pp = K.spring(t, A1T.login + DL, 16, .5);
    c.save(); c.translate(A1_LOGIN.x + 20, A1_LOGIN.y + 20); c.scale(clamp(pp, 0, 1.2), clamp(pp, 0, 1.2));
    fillRR(c, -18, -18, 36, 36, 18, '#4b4750'); txt(c, 'K', 0, 7, {font: F.ui(600, 17), color: '#e6e2ea', align: 'center'}); c.restore();
    txt(c, 'Kai', A1_LOGIN.x + 48, A1_LOGIN.y + 27, {font: F.ui(500, 18), color: '#bdb8c4', alpha: clamp(pp)});
  }
  // --- safety checklist (appears with "> safety.load()")
  const pa = K.spring(t, 1.33, 13, .6);
  if (pa > 0) {
    c.save(); c.globalAlpha = clamp(pa * 2); c.translate((1 - clamp(pa)) * 40, 0);
    HX.inkCard(c, A1_PANEL.x, A1_PANEL.y, A1_PANEL.w, A1_PANEL.h, {title: 'safety.load()', bg: 'rgba(20,19,23,.95)'});
    A1_ROWS.forEach((lab, i) => {
      const r = a1Row(i), on = ease(t, A1T.checks[i] + DL, A1T.checks[i] + DL + .14), hv = IX.hover(s, r), pr = IX.press(s, 'chk' + i);
      if (hv > 0) fillRR(c, r.x, r.y, r.w, r.h, 9, `rgba(255,255,255,${.05 * hv})`);
      c.save(); const k = 1 - .1 * pr; c.translate(r.x + 21, r.y + 20); c.scale(k, k); c.translate(-r.x - 21, -r.y - 20);
      HX.checkbox(c, r.x + 10, r.y + 9, on, {col: '#d9d5dc'}); c.restore();
      txt(c, lab, r.x + 46, r.y + 27, {font: i === 0 ? F.ui(600, 18) : F.mono(400, 17), color: on > .5 ? '#e6e2ea' : '#8e8896'});
    });
    c.restore();
  }
  K.band(c, t, {color: '#cfcbd2', y: H - 130});
  IX.cursor(c, s); HX.cap(c, s);
}};

// ---------------------------------------------------------------- A2 PIECES  (Kai drags Sidebar, Composer, then the model chip INTO the composer)
let winA2 = null;
function getWinA2() {
  if (winA2) return winA2;
  const b = L.buf('a_win2'); b.c.clearRect(0, 0, W, H);
  U.gpt(b.c, {x: 0, y: 0, w: W, h: H, radius: 0, chats: [], status: 'offline', userName: 'Kai', userStatus: 'offline', userSub: 'offline', composer: {placeholder: 'Ask anything'}});
  desat(b.c, 1);
  return winA2 = b.cv;
}
// plane transform of A2 (same as in draw) → screen point
function a2Map(t, p) {
  const flat = ease(t, 6.25, 6.85, E.ioC), tl = 1 - flat, sc = lerp(.74, .88, flat);
  let x = p[0] - 10.4 * tl - W / 2, y = p[1] - 26 * tl - H / 2, r, cs, sn;
  r = .06 * tl; cs = Math.cos(r); sn = Math.sin(r); [x, y] = [x * cs - y * sn, x * sn + y * cs];
  [x, y] = [x - .18 * tl * y, lerp(.78, 1, flat) * y];
  r = -.22 * tl; cs = Math.cos(r); sn = Math.sin(r); [x, y] = [x * cs - y * sn, x * sn + y * cs];
  x = x * sc + W / 2; y = y * sc + H / 2 + 20;
  const z = lerp(.98, 1.05, E.ioC(seg(t, 3.58, 7.19)));
  return [W / 2 + (x - W / 2) * z, H / 2 + (y - H / 2) * z];
}
const A2_DOCK = {x: 1584, y: 296, w: 276, h: 300};
const A2_TILES = ['<Sidebar/>', '<Composer/>', 'GPT-6'];
const a2Tile = i => ({x: A2_DOCK.x + 18, y: A2_DOCK.y + 62 + i * 74, w: A2_DOCK.w - 36, h: 58});
const A2_CHIP = {x: 1262, y: 947, w: 96, h: 30};   // in plane coords, inside the composer (690..1530, 930..994)
const A2D = [ // [press, drop time (beat), target plane point, tile]
  [3.66, 3.950, [150, 540]],
  [4.52, 4.883, [1110, 962]],
  [5.40, 5.783, [A2_CHIP.x + 48, A2_CHIP.y + 15]],
];
const A2K = IX.take({start: [1735, 380], seed: 102}, A2D.map(([P0, T, tp], i) => ({drag: 'tile' + i, to: [a2Tile(i).x + a2Tile(i).w / 2, a2Tile(i).y + 29], dur: .34, press: P0, stops: [a2Map(T, tp)], times: [T - .03], release: T,
  cap: 'drag · ' + ['Sidebar', 'Composer', 'GPT-6 → composer'][i]})));
const A2_LOCK = A2D.map(d => d[1] + DL);
const A2 = {id: 'A2', a: 3.58, b: 7.19, tin: {type: 'slices', dur: .32, n: 9}, draw(c, t, fx) {
  const s = IX.at(A2K, t);
  C.bg(c, '#09080a'); C.dotGrid(c, t, {s: 56, a: .14, color: '#3b3940', ox: -t * 20, oy: t * 12});
  const win = getWinA2();
  const parts = [ // [sx,sy,sw,sh, from dx,dy, lock group, label]
    [0, 0, 300, H, -1500, 0, 0, '<Sidebar/>'],
    [300, 0, W - 300, 88, 0, -1100, 0, '<Header model="ChatGPT"/>'],
    [300, H - 200, W - 300, 200, 0, 1100, 1, '<Composer/>'],
    [300, 88, W - 300, H - 288, 1700, 0, 1, '<Thread/>'],
  ];
  const flat = ease(t, 6.25, 6.85, E.ioC), tl = 1 - flat;
  cam(c, t, 3.58, 7.19, {z0: .98, z1: 1.05, sh: 6});
  c.save(); c.translate(W / 2, H / 2 + 20);
  c.scale(lerp(.74, .88, flat), lerp(.74, .88, flat));
  c.rotate(-.22 * tl); c.transform(1, 0, -.18 * tl, lerp(.78, 1, flat), 0, 0); c.rotate(.06 * tl);
  c.translate(-W / 2, -H / 2);
  // empty drop canvas: faint dashed footprint of the window
  c.save(); c.globalAlpha = .5 * tl; c.setLineDash([14, 12]); c.strokeStyle = '#4b4750'; c.lineWidth = 2; c.strokeRect(-10.4 * tl, -26 * tl, W, H); c.restore();
  // drop-zone highlight while a tile is held
  const held = s.dragId ? +s.dragId.slice(4) : -1;
  if (held >= 0) {
    c.save(); c.setLineDash([12, 9]); c.strokeStyle = P.lav; c.lineWidth = 3; c.globalAlpha = .55 + .25 * Math.sin(t * 20);
    if (held === 0) c.strokeRect(-10.4, -26, 300, H); else if (held === 1) c.strokeRect(300 - 10.4, H - 200 - 26, W - 300, 200); else { rr(c, A2_CHIP.x - 10.4, A2_CHIP.y - 26, A2_CHIP.w, A2_CHIP.h, 15); c.stroke(); }
    c.restore();
  }
  parts.forEach(([sx, sy, sw, sh, dx, dy, g, lab], i) => {
    const lt0 = A2_LOCK[g], p = K.spring(t, lt0, i % 2 ? 12 : 15, .6); if (p <= 0) return;
    const ex = (1 - p) * dx * .4, ey = (1 - p) * dy * .4; const lt = lt0 + .22; const lift = 60 * tl * (1 - clamp((t - lt) * 2)) + 26 * tl;
    c.save(); c.translate(ex - lift * .4, ey - lift);
    c.globalAlpha = .35 * tl; c.fillStyle = '#000'; c.fillRect(sx + lift * .4 + 10, sy + lift + 14, sw, sh); c.globalAlpha = 1;
    c.drawImage(win, sx, sy, sw, sh, sx, sy, sw, sh);
    const off = 10 * Math.exp(-Math.max(0, t - lt) * 6);
    regRect(c, sx, sy, sw, sh, 2, ['#3c3a40', '#8e8896', '#cfcbd2'], off, 2);
    if (tl > .05) txt(c, lab, sx + 16, sy + (i === 2 ? 34 : sh - 16), {font: F.mono(400, 22), color: '#bdb8c4', alpha: tl * clamp(p)});
    c.restore();
  });
  // the model chip lands inside the composer (2026 layout)
  const cpp = K.spring(t, A2_LOCK[2], 16, .45);
  if (cpp > 0) {
    c.save(); c.translate(-10.4 * tl, -26 * tl); c.translate(A2_CHIP.x + 48, A2_CHIP.y + 15); c.scale(clamp(cpp, 0, 1.3), clamp(cpp, 0, 1.3)); c.translate(-A2_CHIP.x - 48, -A2_CHIP.y - 15);
    HX.modelChip(c, A2_CHIP.x, A2_CHIP.y, 'GPT-6', {size: 16});
    regRect(c, A2_CHIP.x, A2_CHIP.y, A2_CHIP.w, A2_CHIP.h, 15, ['#3c3a40', '#8e8896', null], 8 * Math.exp(-(t - A2_LOCK[2]) * 6), 2);
    c.restore();
  }
  // she assembles from points into the thread (after the chip lands: the model is in)
  const fh = 560, fxC = 1110, fyC = 470, sz = A.size('sleep'), fw = fh * sz.w / sz.h;
  const pts = A.points('sleep', 520, 2, 4), R = rng(11);
  const dis = 1 - ease(t, 6.35, 7.1);
  if (t > 6.3) fig(c, 'sleep', t, {x: fxC, y: fyC + Math.sin(t * 1.6) * 10, h: fh, pal: 'off', rot: .052 * Math.sin(t * Math.PI * 2 / 4), sway: 18, swayF: .3, breathe: .02, wave: {amp: 6, k: 9, f: 3.2}, dissolve: dis * .9, alpha: clamp((t - 6.3) * 4), kAmt: .4});
  c.fillStyle = '#d9d5dc';
  pts.forEach((pt, i) => {
    const sx0 = R() * W * 1.4 - W * .2, sy0 = R() * H * 1.4 - H * .2, d = R() * .7;
    const t0 = A2_LOCK[2] + d * .5, p = ease(t, t0, t0 + .55, E.ioC); if (p <= 0) return;
    const a = 1 - ease(t, 6.5, 7.0); if (a <= 0) return;
    const x = lerp(sx0, fxC + pt[0] * fw, p), y = lerp(sy0, fyC + pt[1] * fh, p);
    c.globalAlpha = a * clamp(p * 3); c.fillRect(x - 3.5, y - 3.5, 7, 7);
  });
  c.globalAlpha = 1;
  c.restore(); c.restore();
  // code overlay — each line follows a drop
  const lines = [['import { Sidebar, Header, Thread, Composer } from "ui";', A2_LOCK[0], A2_LOCK[0] + .6], ['const her = new Assistant({ model: "GPT-6" });', A2_LOCK[2], A2_LOCK[2] + .5], ['her.state = "asleep";  // until someone says hi', 6.42, 6.95]];
  c.save(); c.globalAlpha = .9; fillRR(c, 90, 64, 820, 150, 12, 'rgba(10,9,12,.82)', '#2e2c32', 1.5); c.restore();
  lines.forEach(([ls, a, b], i) => code(c, ls, 116, 116 + i * 38, seg(t, a, b), {font: F.mono(400, 21), color: i === 1 ? '#e6e2ea' : '#8e8896', t, caret: i === 2}));
  // component dock (screen space)
  HX.inkCard(c, A2_DOCK.x, A2_DOCK.y, A2_DOCK.w, A2_DOCK.h, {title: 'components', bg: 'rgba(16,15,18,.94)'});
  A2_TILES.forEach((lab, i) => {
    const r = a2Tile(i), gone = t >= A2D[i][0], hv = IX.hover(s, r);
    if (gone) { c.save(); c.setLineDash([6, 6]); c.strokeStyle = '#4b4750'; c.lineWidth = 1.5; rr(c, r.x, r.y, r.w, r.h, 10); c.stroke(); c.restore(); return; }
    fillRR(c, r.x, r.y, r.w, r.h, 10, hv > 0 ? '#2a282e' : '#1e1c21', '#4b4750', 1.5);
    if (i === 2) HX.modelChip(c, r.x + 16, r.y + 14, 'GPT-6', {size: 16}); else txt(c, lab, r.x + 16, r.y + 36, {font: F.mono(400, 19), color: '#cfcbd2'});
  });
  if (held >= 0) {   // the held tile rides under the cursor
    const r = a2Tile(held);
    c.save(); c.translate(s.x - r.w / 2 + 10, s.y - 22); c.rotate(-.03); c.globalAlpha = .92; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 22; c.shadowOffsetY = 10;
    fillRR(c, 0, 0, r.w * 1.03, r.h * 1.03, 10, '#2a282e', '#bdb8c4', 1.5); c.shadowColor = 'transparent';
    if (held === 2) HX.modelChip(c, 16, 14, 'GPT-6', {size: 16}); else txt(c, A2_TILES[held], 16, 37, {font: F.mono(400, 19), color: '#e6e2ea'});
    c.restore();
  }
  K.band(c, t, {color: '#cfcbd2'});
  IX.cursor(c, s); HX.cap(c, s);
}};

// ---------------------------------------------------------------- A3 PARAMS  (Kai types the fields, then picks Base style "Friendly")
const A3T = {tab1: 7.650, enter: [8.100, 8.567, 9.033], tab2: 9.10, drop: 9.483, pick: 9.933};
const A3_INIT = A3T.pick + DL;
const A3_PX = 410, A3_PY = 150, A3_PW = 1100, A3_PH = 720;
const A3_BTN = {x: 1210, y: 694, w: 260, h: 46};
const A3_STYLES = ['Default', 'Professional', 'Friendly', 'Candid', 'Quirky', 'Efficient', 'Cynical'];
const A3_MENU = {x: 1210, y: 694 - 8 - (A3_STYLES.length * 38 + 16), w: 260, rh: 38};
const a3Cam = t => {
  const camY = lerp(lerp(330, 470, ease(t, 7.75, 8.1, E.ioC)), 610, ease(t, 9.12, 9.4, E.ioC));
  return {x: 960, y: lerp(camY, 540, ease(t, A3_INIT, A3_INIT + .45, E.ioC)), z0: 1.32, z1: 1.42};
};
const a3S = (t, p) => toS(t, 7.19, 9.75, a3Cam(t), p);
const A3K = (() => {
  const tk = IX.take({start: a3S(7.2, [1180, 420]), seed: 103}, [
    {type: 'Kai', into: 'f1', at: 7.24, cps: 11, cap: 'type · Kai'},
    {key: 'Tab', at: A3T.tab1, cap: 'key · Tab'},
    {move: a3S(7.9, [1150, 545]), arrive: 7.95, dur: .3},
    {type: 'warm', into: 'f2a', at: 7.72, cps: 22, cap: 'type · warm'},
    {key: 'Enter', at: A3T.enter[0], cap: 'key · ⏎ warm'},
    {type: 'curious', into: 'f2b', at: 8.15, cps: 26},
    {key: 'Enter', at: A3T.enter[1], cap: 'key · ⏎ curious'},
    {type: 'honest', into: 'f2c', at: 8.62, cps: 26},
    {key: 'Enter', at: A3T.enter[2], cap: 'key · ⏎ honest'},
    {key: 'Tab', at: A3T.tab2},
    {note: 'type · night owl. kinda lonely.', at: 9.13, hold: .34},
    {click: 'drop', to: a3S(A3T.drop, [A3_BTN.x + 150, A3_BTN.y + 24]), press: A3T.drop, dur: .26, cap: 'click · Base style and tone'},
    {click: 'pick', to: a3S(A3T.pick, [A3_MENU.x + 140, A3_MENU.y + 8 + 2 * 38 + 19]), press: A3T.pick, dur: .3, cap: 'click · Friendly'},
  ]);
  fastType(tk, 'f3', 'night owl. kinda lonely.', 9.13, 9.43);
  return tk;
})();
const A3 = {id: 'A3', a: 7.19, b: 10.90, tin: {type: 'flash', dur: .12, amt: .5, color: '#cfcbd2'}, draw(c, t, fx) {
  const s = IX.at(A3K, t);
  C.bg(c, '#0b0a0c'); C.dotGrid(c, t, {s: 48, a: .1, color: '#3b3940', oy: -t * 10});
  const px = A3_PX, py = A3_PY, pw = A3_PW, ph = A3_PH;
  const init = ease(t, A3_INIT, A3_INIT + .4, E.ioC);
  const f2on = t >= A3T.tab1 + DL, f3on = t >= A3T.tab2 + DL;
  cam(c, t, 7.19, 9.75, a3Cam(t));
  c.save(); c.globalAlpha = 1 - .75 * init; const pe = K.spring(t, 7.2, 12, .6); c.translate(0, (1 - pe) * 200);
  U.panel(c, px, py, pw, ph, {title: 'Customize ChatGPT', bg: '#18171a', border: '#38363c', shadow: 0});
  txt(c, 'Introduce yourself to get better, more personalized responses', px + 24, py + 98, {font: F.ui(400, 17), color: '#7a767f'});
  const field = (label, y, active) => {
    txt(c, label, px + 40, y, {font: F.ui(500, 21), color: active ? '#e6e2ea' : '#9a95a0'});
    fillRR(c, px + 40, y + 16, pw - 80, 62, 12, '#212024', active ? '#8e8896' : '#38363c', active ? 2 : 1.5);
  };
  // 1
  field('What should ChatGPT call you?', 300, !f2on);
  const w1 = txt(c, s.text.f1 || '', px + 62, 358, {font: F.ui(400, 22), color: '#ece7f1'});
  if (!f2on) caret(c, px + 64 + w1, 330, 32, t, '#ece7f1');
  // 2 traits chips (each one after an Enter)
  field('What traits should ChatGPT have?', 440, f2on && !f3on);
  let cxp = px + 60;
  [['warm', 'f2a'], ['curious', 'f2b'], ['honest', 'f2c']].forEach(([w, id], i) => {
    const te = A3T.enter[i] + DL;
    if (t < te) { if (i === 0 || t >= A3T.enter[i - 1] + DL) { if (f2on && !f3on) { const ww = txt(c, s.text[id] || '', cxp + 4, 498, {font: F.ui(400, 22), color: '#ece7f1'}); caret(c, cxp + 6 + ww, 470, 32, t, '#ece7f1'); } } return; }
    const p = K.spring(t, te, 18, .45);
    const wd = measure(c, w, F.ui(500, 20)) + 36;
    c.save(); c.translate(cxp + wd / 2, 440 + 47); c.scale(p, p); c.rotate((1 - clamp(p)) * .3);
    fillRR(c, -wd / 2, -18, wd, 36, 18, '#34323a', '#bdb8c4', 1.5); txt(c, w, 0, 7, {font: F.ui(500, 20), color: '#ece7f1', align: 'center'});
    c.restore(); cxp += wd + 14;
  });
  // 3 anything else → what Kai writes about himself
  field('Anything else ChatGPT should know about you?', 580, f3on);
  const w3 = txt(c, s.text.f3 || '', px + 62, 638, {font: F.ui(400, 22), color: '#ece7f1'});
  if (f3on && t < A3T.drop) caret(c, px + 64 + w3, 610, 32, t, '#ece7f1');
  // Base style and tone (real 2026 options), dropdown
  txt(c, 'Base style and tone', px + 40, A3_BTN.y + 30, {font: F.ui(500, 21), color: t >= A3T.drop ? '#e6e2ea' : '#9a95a0'});
  const picked = t >= A3_INIT;
  const bA = a3S(t, [A3_BTN.x, A3_BTN.y]), bB = a3S(t, [A3_BTN.x + A3_BTN.w, A3_BTN.y + A3_BTN.h]);
  IX.button(c, A3_BTN, '', {hover: IX.hover(s, {x: bA[0], y: bA[1], w: bB[0] - bA[0], h: bB[1] - bA[1]}), press: IX.press(s, 'drop'), r: 12, bg: '#212024', border: '#4a474f'});
  txt(c, picked ? 'Friendly' : 'Default', A3_BTN.x + 18, A3_BTN.y + 30, {font: F.ui(500, 20), color: '#ece7f1'});
  U.icon(c, 'chev', A3_BTN.x + A3_BTN.w - 24, A3_BTN.y + 22, 8, '#9a95a0');
  const mo = ease(t, A3T.drop + DL, A3T.drop + DL + .15) * (1 - ease(t, A3_INIT, A3_INIT + .1));
  if (mo > 0) {
    const hiRow = t >= A3T.pick - .3 ? 2 : -1;
    IX.menu(c, A3_MENU.x, A3_MENU.y, A3_STYLES.map((l, i) => ({label: l, check: picked ? i === 2 : i === 0})), {open: mo, w: A3_MENU.w, rowH: A3_MENU.rh, hi: hiRow, up: true});
  }
  c.restore();
  // Initialization: knot draws petal by petal (after the pick)
  if (t > A3_INIT) {
    const p = ease(t, A3_INIT + .02, 10.82, E.lin), ks = K.spring(t, A3_INIT, 12, .5);
    c.save(); c.translate(960, 500); c.scale(ks, ks);
    C.radial(c, 0, 0, 300, 'rgba(200,195,210,.25)');
    U.knot(c, 0, 0, 150, {color: '#d9d5dc', lw: 10, rot: t * 1.2, p, glow: 18, glowColor: '#bdb8c4'});
    c.restore();
    txt(c, 'Initializing… ' + String(Math.round(p * 100)).padStart(3, ' ') + '%', 960, 760, {font: F.mono(400, 30), color: '#bdb8c4', align: 'center', alpha: clamp(ks)});
  }
  c.restore();
  K.band(c, t, {color: '#cfcbd2'});
  IX.cursor(c, s); HX.cap(c, s);
}};

// ---------------------------------------------------------------- A4 WORLD  (Kai: New chat → click composer (greeting) → types world.execute(me); → Enter wakes her → clicks her)
const A4T = {nc: 11.333, comp: 12.250, enter: 14.100, poke: 15.017};
const A4_WOKE = A4T.enter + DL;
const A4C = {x: 1060, y: 520, z0: 1.0, z1: 1.09}, A4W = {x: 960, y: 420, z0: 1.0, z1: 1.12};
const a4S = (t, p) => toS(t, 10.9, 14.1, A4C, p);
const A4_KNOT = [960 + (KNOT.happy[0] - .5) * 2000 * 917 / 1148, 980 + (KNOT.happy[1] - .5) * 2000];   // artPt('happy', …) without needing loaded art
const A4K = IX.take({start: [1500, 930], seed: 104}, [
  {click: 'nc', to: a4S(A4T.nc, [150, 99]), press: A4T.nc, dur: .5, cap: 'click · New chat'},
  {click: 'comp', to: a4S(A4T.comp, [960, 632]), press: A4T.comp, dur: .45, cap: 'click · Ask anything'},
  {type: 'world.execute(me);', into: 'cmp', at: 12.55, cps: 19, typos: [7], cap: 'type · world.execute(me);'},
  {key: 'Enter', at: A4T.enter, cap: 'key · ⏎ Enter'},
  {move: toS(14.8, 14.1, 15.2, A4W, [A4_KNOT[0] + 110, A4_KNOT[1] + 160]), arrive: 14.62, dur: .35},
  {click: 'poke', to: toS(A4T.poke, 14.1, 15.2, A4W, [A4_KNOT[0], A4_KNOT[1] + 6]), press: A4T.poke, dur: .3, cap: 'click · her'},
]);
const A4 = {id: 'A4', a: 10.90, b: 15.11, tin: {type: 'iris', dur: .45, x: 960, y: 500}, draw(c, t, fx) {
  const s = IX.at(A4K, t);
  const woke = t >= A4_WOKE;
  if (!woke) {
    cam(c, t, 10.9, 14.1, Object.assign({sh: 4}, A4C));
    const nc = t >= A4T.nc + DL, sent = t >= A4T.enter + DL;
    U.gpt(c, {x: 0, y: 0, w: W, h: H, radius: 0, chats: nc ? [{title: 'New chat', active: true, a: ease(t, A4T.nc + DL, A4T.nc + DL + .17)}] : [], status: 'offline', userName: 'Kai', userStatus: 'offline', userSub: 'offline',
      composer: {y: 600, placeholder: 'Ask anything', foot: false, focus: t >= A4T.comp + DL, text: sent ? '' : (s.text.cmp || ''), cursor: t >= A4T.comp + DL && !sent && s.caretOn}});
    // New chat row hover / press
    const nh = IX.press(s, 'nc'); if (nh > 0) { c.save(); c.globalAlpha = .5 * nh; fillRR(c, 12, 77, 276, 40, 10, '#3b3446'); c.restore(); }
    // model chip inside the composer + full usage bar beside it
    HX.modelChip(c, 1290, 617, 'GPT-6');
    HX.quotaInk(c, 1340, 690, 190, 1);
    // she sleeps behind the glass
    c.save(); c.globalCompositeOperation = 'screen';
    fig(c, 'sleep', t, {x: 1110, y: 520 + Math.sin(t * 1.6) * 14, h: 900, pal: 'off', alpha: .11 + .03 * Math.sin(t * 2), rot: .052 * Math.sin(t * Math.PI * 2 / 4), sway: 22, swayF: .3, breathe: .02, wave: {amp: 6, k: 9, f: 3.2}, kAmt: .3});
    c.restore();
    // the greeting streams in after Kai focuses the composer — FIRST WORDS
    if (t >= A4T.comp + DL) K.stream(c, 'What can I help with?', A4T.comp + DL, 1.1, t, 1110, 470, {font: F.serif(72), color: '#e6e2ea', dot: 12});
    c.restore();
    desat(c, 1);
  } else {
    plate(c, '#1a191c', 4);
    cam(c, t, 14.1, 15.2, Object.assign({sh: 3}, A4W));
    C.radial(c, 960, 380, 700, 'rgba(200,195,210,.18)');
    const pk = t >= A4T.poke + DL ? Math.exp(-(t - A4T.poke - DL) * 9) : 0;
    fig(c, 'happy', t, {x: 960, y: 980, h: 2000, pal: 'off', sway: 18, kAmt: .5, reg: 18 * Math.exp(-(t - A4_WOKE) * 6) + 24 * pk});
    if (t > A4T.poke + DL) U.knot(c, A4_KNOT[0], A4_KNOT[1], 40, {color: P.lav, lw: 5, glow: 30, alpha: clamp((t - A4T.poke - DL) * 12)});
    c.restore();
    fx.flash = .45 * Math.exp(-(t - A4_WOKE) * 14);
    txt(c, 'status: waking', 1660, 90, {font: F.mono(400, 22), color: '#9a95a0', align: 'center', alpha: ease(t, A4_WOKE + .1, A4_WOKE + .4)});
  }
  K.band(c, t, {color: '#cfcbd2'});
  IX.cursor(c, s); HX.cap(c, s);
}};
// ---------------------------------------------------------------- A5 TITLE (first colour — the result of Kai's click on her)
const A5K = IX.take({start: [742, 548], seed: 105}, [{note: 'click · her', at: A4T.poke, hold: 1.5}]);
const A5 = {id: 'A5', a: 15.11, b: 16.96, tin: {type: 'flash', dur: .22, amt: 1, color: '#d4c4f2'}, draw(c, t, fx) {
  const s = IX.at(A5K, t);
  plate(c, ST.on.paper, 5, {halftone: {s: 26, color: 'rgba(185,163,218,.07)', fn: (x, y) => 1 - Math.hypot(x - 700, y - 430) / 1100}});
  cam(c, t, 15.11, 16.96, {x: 960, y: 540, z0: 1.04, z1: 1.0, sh: 7});
  const kx = 620, ky = 420;
  K.rays(c, kx, ky, 28, 190, 1400, P.lav, .14 + .1 * kk(t), t * .15, .03);
  C.radial(c, kx, ky, 420, 'rgba(185,163,218,.35)');
  const kp = ease(t, 15.11, 15.55, E.outC), ks = 1 + K.hit(t, 15.11, .2) + .06 * kk(t);
  c.save(); c.translate(kx, ky); c.scale(ks, ks);
  U.knot(c, 0, 0, 170, {color: P.lav, lw: 14, rot: t * .4, p: kp, glow: 50, glowColor: P.lav});
  c.restore();
  // the line Kai typed, now executed: printed char by char in her colour
  const TT = 'world.execute(me);', tf = F.mono(700, 76), tw = measure(c, TT, tf);
  txtAnim(c, TT, kx - tw / 2, 720, {font: tf, color: P.cream}, (i, n) => { const p = K.spring(t, 15.3 + i * .035, 18, .5); return {a: clamp(p * 3), dy: (1 - clamp(p)) * -18, s: lerp(1.4, 1, clamp(p))}; });
  if (t > 16.0 && Math.floor(t * 4) % 2 === 0) { c.fillStyle = P.lav; c.fillRect(kx - tw / 2 + tw + 6, 660, 38, 70); }
  txtAnim(c, 'ChatGPT ver.', kx, 805, {font: F.serif(48, true), align: 'center', color: P.lav}, (i, n) => { const p = K.spring(t, 16.1 + i * .03, 16, .5); return {a: clamp(p * 2), dy: (1 - p) * 30}; });
  const sp = K.spring(t, 15.25, 10, .5);
  if (sp > 0) fig(c, 'happy', t, {x: 1450, y: 640 + (1 - sp) * 500, h: 900, blink: blinkAt(t), pal: 'orig', sx: lerp(.7, 1, sp), sy: lerp(1.25, 1, sp), sway: 14, alpha: clamp(sp * 3), reg: 20 * Math.exp(-(t - 15.25) * 5)});
  c.restore();
  IX.cursor(c, s); HX.cap(c, s);
}};

// ---------------------------------------------------------------- A6 CURSOR (Kai arrives: focus → status online → hovers the pager → clicks the composer)
const A6T = {focus: 17.333, status: 18.717, comp: 21.933};
const A6_ON = A6T.status + DL;
// composer of winA6: x 480..1320, y 870..934 ; model chip + usage bar
const A6_CHIP = {x: 1068, y: 887};
function winA6(c, t, o = {}) {
  const on = t >= A6_ON;
  c.save(); c.globalAlpha = .45; fillRR(c, 72, 84, 1380, 960, 18, '#000'); c.restore();
  U.gpt(c, {x: 60, y: 60, w: 1380, h: 960, frame: false, chats: [{title: 'New chat', active: true}], status: false, userName: 'Kai', userStatus: on ? 'online' : 'offline', userSub: on ? 'just now' : '',
    msgs: o.msgs, composer: Object.assign({placeholder: 'Ask anything'}, o.composer || {})});
  fillRR(c, 60, 60, 1380, 960, 18, null, P.line, 1.5);
  HX.modelChip(c, A6_CHIP.x, A6_CHIP.y, 'GPT-6');
  HX.quotaInk(c, 500, 962, 190, o.quota == null ? 1 : o.quota);
  const sp = on ? K.spring(t, A6_ON, 16, .42) : 1, sc = 1.5 * (on ? lerp(.6, 1, sp) : 1);
  c.save(); c.translate(1300, 97); c.scale(sc, sc);
  const col = on ? P.green : P.dim, lab = on ? 'online' : 'offline';
  const w = measure(c, lab, F.mono(500, 17)) + 40;
  if (o.chipHover > 0) fillRR(c, -18, -19, w + 8, 38, 19, `rgba(255,255,255,${.08 * o.chipHover})`);
  fillRR(c, -14, -15, w, 30, 15, on ? 'rgba(80,200,120,.14)' : 'rgba(255,255,255,.05)', on ? P.green : P.line, 1.2);
  c.fillStyle = col; c.beginPath(); c.arc(2, 0, 5, 0, 7); c.fill();
  txt(c, lab, 14, 6, {font: F.mono(500, 17), color: on ? P.text : P.sub});
  if (on) { const p = seg(t, A6_ON, A6_ON + .68); if (p < 1) { c.strokeStyle = P.green; c.globalAlpha = 1 - p; c.lineWidth = 2; c.beginPath(); c.arc(2, 0, 5 + p * 30, 0, 7); c.stroke(); } }
  c.restore();
}
function pagerMotif(c, t, t0, n = 1, of = 1, o = {}) {
  const ap = K.spring(t, t0, 13, .5); if (ap <= 0) return;
  const bi = L.beatInfo(t), pulse = t - t0 < 1.0 + .05 ? Math.exp(-bi.dt * 8) * (bi.t0 >= t0 - .01 ? 1 : 0) : 0;
  const s = K.MOTIF.pager * lerp(.5, 1, clamp(ap, 0, 1.3)) * (1 + .1 * pulse);
  c.save(); c.translate(W / 2, K.MOTIF.pagerY); c.scale(s, s); c.globalAlpha *= clamp(ap * 3);
  if (pulse > .02) { c.save(); c.globalAlpha *= pulse * .8; c.shadowColor = P.lav; c.shadowBlur = 24; fillRR(c, -62, -22, 124, 40, 12, null, P.lav, 2); c.restore(); }
  if (o.hov > .02) { c.save(); c.globalAlpha *= o.hov; fillRR(c, -62, -22, 124, 40, 12, null, P.cream, 2); c.restore(); }
  K.pager(c, 0, 7, n, of, {size: 22, numColor: pulse > .3 ? P.lav2 : P.text});
  c.restore();
}
function emptySlot(c, t, x, y, a = 1) {
  c.save(); c.globalAlpha *= a;
  U.knot(c, x - 34, y + 18, 13, {color: P.text, lw: 1.8});
  [[0, 560], [1, 460], [2, 330]].forEach(([i, w]) => {
    const ph = (t * .8 - i * .12) % 1;
    const g = c.createLinearGradient(x, 0, x + w, 0); const m = clamp(ph);
    g.addColorStop(0, '#26212c'); g.addColorStop(clamp(m - .15), '#26212c'); g.addColorStop(m, '#3e3648'); g.addColorStop(clamp(m + .15), '#26212c'); g.addColorStop(1, '#26212c');
    fillRR(c, x + 10, y + 4 + i * 34, w, 18, 9, g);
  });
  const ay = y + 132;
  c.strokeStyle = P.sub; c.lineWidth = 2; c.strokeRect(x + 12, ay - 9, 14, 16); c.strokeRect(x + 17, ay - 13, 14, 16);
  K.thumbs(c, x + 64, ay, 22); c.save(); c.translate(x + 104, ay); c.rotate(Math.PI); K.thumbs(c, 0, 0, 22); c.restore();
  K.regenIcon(c, x + 146, ay, 10, t * 0, P.sub, 2);
  c.restore();
}
const A6C = {x: 960, y: 540, z0: 1.0, z1: 1.05};
const a6S = (t, p) => toS(t, 16.96, 22.5, A6C, p);
const A6_PAGER = {x: W / 2 - 100, y: K.MOTIF.pagerY - 36, w: 200, h: 64};
const A6K = IX.take({start: [1990, 1130], seed: 106}, [
  {click: 'focus', to: a6S(A6T.focus, [1010, 560]), press: A6T.focus, dur: .36, cap: 'click · chat window'},
  {click: 'status', to: a6S(A6T.status, [1338, 97]), press: A6T.status, dur: .5, cap: 'click · offline → online'},
  {move: [W / 2 + 18, K.MOTIF.pagerY + 6], arrive: 19.62, dur: .45},
  {move: [W / 2 + 26, K.MOTIF.pagerY + 12], arrive: 20.25, dur: .4, arc: .02, overshoot: 0},
  {hover: 'pager', at: 19.62, cap: 'hover · ‹ 1 / 1 ›'},
  {click: 'comp', to: a6S(A6T.comp, [880, 902]), press: A6T.comp, dur: .7, cap: 'click · Ask anything'},
]);
const A6 = {id: 'A6', a: 16.96, b: 22.50, tin: {type: 'push', dir: 'left', dur: .35}, draw(c, t, fx) {
  const s = IX.at(A6K, t);
  C.bg(c, ST.on.bg); C.dotGrid(c, t, {s: 48, a: .16, ox: t * 6});
  C.radial(c, 1500, 560, 800, 'rgba(185,163,218,.16)');
  cam(c, t, 16.96, 22.5, Object.assign({sh: 5}, A6C));
  const clickT = A6T.comp + DL;
  const sa = a6S(t, [1279, 74]), sb = a6S(t, [1430, 120]);
  winA6(c, t, {composer: {focus: t >= clickT, cursor: t >= clickT && Math.floor(t * 3.2) % 2 === 0}, chipHover: t < A6_ON ? IX.hover(s, {x: sa[0], y: sa[1], w: sb[0] - sa[0], h: sb[1] - sa[1]}) : 0});
  c.save(); c.translate(490, 200); c.scale(1.2, 1.2); c.translate(-490, -200);
  emptySlot(c, t, 490, 200, ease(t, 17.1, 17.5));
  c.restore();
  // her pops up when Kai focuses the window
  const up = K.spring(t, A6T.focus + DL, 8, .55);
  const bob = -26 * K.hit(t, clickT, 1) - 10 * K.hit(t, A6_ON, 1);
  if (up > 0) fig(c, 'happy', t, {x: 1480, y: 640 + (1 - up) * 700, h: 880, pal: 'orig', sway: 14, breathe: .02, bob, rot: -.03 + Math.sin(t * .9) * .025, blink: blinkAt(t)});
  c.restore();
  pagerMotif(c, t, A6T.focus + DL + .06, 1, 1, {hov: IX.hover(s, A6_PAGER)});
  txt(c, '● Kai joined', 1300, 165, {font: F.mono(400, 22), color: P.cream, align: 'center', alpha: ease(t, A6_ON, A6_ON + .28) * (1 - ease(t, 20.5, 20.8))});
  IX.cursor(c, s); HX.cap(c, s);
}};

// ---------------------------------------------------------------- A7 TYPE (Kai types "hi", deletes it, types the question, Enter)
const Q = 'if you could be anything, what would you be?';
const A7_SEND = 25.650, A7_SENT = A7_SEND + DL;
const A7K = (() => {
  const tk = IX.take({start: [1560, 800], seed: 107}, [
    {type: 'hi', into: 'cmp', at: 22.58, cps: 9, cap: 'type · hi'},
    {key: 'Backspace', at: 23.317, cap: 'key · ⌫ Backspace'},
    {type: Q, into: 'cmp2', at: 23.80, cps: 40, cap: 'type · ' + Q},
    {move: [1590, 790], arrive: 25.0, dur: .5},
    {key: 'Enter', at: A7_SEND, cap: 'key · ⏎ Enter'},
  ]);
  tk.typing.cmp.push({t: 23.317 + .05, s: 'h'}, {t: 23.317 + .14, s: ''});
  return tk;
})();
const a7Typed = s => (s.t >= A7_SENT ? '' : s.t >= 23.6 ? (s.text.cmp2 || '') : (s.text.cmp || ''));
const A7 = {id: 'A7', a: 22.50, b: 26.19, tin: {type: 'zoom', dur: .15, inS: 1.6, outS: .7}, draw(c, t, fx) {
  const s = IX.at(A7K, t);
  C.bg(c, ST.on.bg); C.dotGrid(c, t, {s: 48, a: .16});
  const sent = t >= A7_SENT;
  const zz = lerp(1.45, 1.6, ease(t, 22.5, 25.6, E.ioC)) - .15 * ease(t, A7_SENT, A7_SENT + .4, E.outC);
  cam(c, t, 22.5, 26.19, {x: lerp(900, 930, ease(t, 23.8, 25.4)), y: 790 - 90 * ease(t, A7_SENT, A7_SENT + .45, E.ioC), z0: zz, z1: zz, sh: 4});
  const str = a7Typed(s);
  winA6(c, t, {composer: {text: str, focus: true, cursor: !sent && s.caretOn, sendOn: !!str}, msgs: []});
  const cy = 870;
  const bs = 23.317 + DL, duck = t > bs && t < bs + .48 ? 40 * Math.sin(seg(t, bs, bs + .48) * Math.PI) : 0;
  const hop = sent ? -60 * Math.sin(clamp((t - A7_SENT) / .5) * Math.PI) : 0;
  c.save(); c.beginPath(); c.rect(0, 0, W, cy - 2); c.clip();
  fig(c, 'happy', t, {x: 640, y: cy - 140 + duck + hop, h: 480, pal: 'orig', rot: .06 + (duck ? .1 : 0) + Math.sin(t * 1.1) * .04, sway: 8, breathe: .02, blink: blinkAt(t)});
  c.restore();
  // keystroke sparks at the caret (only on real key events)
  const font = F.ui(400, 21); let lastK = -9; for (const id of ['cmp', 'cmp2']) for (const k of (A7K.typing[id] || [])) if (k.t <= t) lastK = Math.max(lastK, k.t);
  if (str && t - lastK < .12) { const cx = 480 + 62 + measure(c, str, font); const kp = (t - lastK) / .12; c.save(); c.globalAlpha = 1 - kp; c.fillStyle = P.cream; for (let i = 0; i < 3; i++) { const a = i * 2.1 + lastK * 9; c.fillRect(cx + Math.cos(a) * 14 * kp, 902 + Math.sin(a) * 14 * kp, 3, 3); } c.restore(); }
  if (sent) {
    const p = ease(t, A7_SENT, A7_SENT + .45, E.outB);
    const w = measure(c, Q, F.ui(400, 21)) + 44;
    c.save(); c.globalAlpha = clamp(p * 2); fillRR(c, 1310 - w, lerp(880, 690, p), w, 54, 27, P.panel2); txt(c, Q, 1310 - w + 22, lerp(880, 690, p) + 35, {font: F.ui(400, 21), color: P.text}); c.restore();
    K.ripple(c, 1282, 902, t, A7_SENT);
  }
  c.restore();
  IX.cursor(c, s); HX.cap(c, s);
  IX.keycap(c, '⏎', W - 110, H - 190, t, A7_SEND);
  IX.keycap(c, '⌫', W - 110, H - 190, t, 23.317);
}};

// ---------------------------------------------------------------- A8 THINK (Kai clicks "Get a quick answer" → thought collapses → the ● dot)
const A8T = {quick: 28.400};
const A8_DONE = A8T.quick + DL;
const a8Cam = t => ({x: lerp(960, 560, ease(t, A8_DONE, A8_DONE + .5, E.ioC)), y: lerp(540, 520, ease(t, A8_DONE, A8_DONE + .5, E.ioC)), z: lerp(1, 1.08, seg(t, 26.2, 28.6)) * Math.exp(ease(t, 28.62, 29.28, E.inE) * 4.2)});
const A8_LINK = {x: 790, y: 396, w: 300, h: 40};
const A8K = IX.take({start: [1210, 760], seed: 108}, [
  {move: HX.camMap(a8Cam(27.6))([A8_LINK.x + 230, A8_LINK.y + 80]), arrive: 27.55, dur: .6},
  {click: 'quick', to: HX.camMap(a8Cam(A8T.quick))([A8_LINK.x + 150, A8_LINK.y + 20]), press: A8T.quick, dur: .3, cap: 'click · Get a quick answer'},
]);
const A8 = {id: 'A8', a: 26.19, b: 29.28, tin: {type: 'push', dir: 'up', dur: .32}, draw(c, t, fx) {
  const s = IX.at(A8K, t);
  plate(c, ST.on.paper, 8);
  const dive = ease(t, 28.62, 29.28, E.inE);
  const dotX = 560, dotY = 520;
  c.save(); const cp = a8Cam(t); K.cam(c, {x: cp.x, y: cp.y, z: cp.z, shake: 4 * kk(t), t});
  C.radial(c, 1450, 500, 800, 'rgba(185,163,218,.22)');
  fig(c, 'think', t, {x: 1440, y: 760, h: 1200, pal: 'orig', sway: 12, breathe: .02, alpha: .95});
  const w = measure(c, Q, F.ui(400, 32)) + 56;
  fillRR(c, 1160 - w, 170, w, 76, 38, P.panel2); txt(c, Q, 1160 - w + 28, 220, {font: F.ui(400, 32), color: P.text});
  const thought = t >= A8_DONE;
  U.knot(c, 500, 410, 26, {color: P.text, lw: 3.2, rot: thought ? 0 : t * 5});
  if (!thought) {
    K.thinking(c, 540, 424, t, {font: F.ui(500, 44)});
    const la = ease(t, 26.9, 27.2), hv = IX.hover(s, HX.camMap(cp) && (() => { const m = HX.camMap(cp), a = m([A8_LINK.x, A8_LINK.y]), b = m([A8_LINK.x + A8_LINK.w, A8_LINK.y + A8_LINK.h]); return {x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1]}; })()), pr = IX.press(s, 'quick');
    c.save(); c.globalAlpha = la * (1 - .3 * pr);
    const lw = txt(c, 'Get a quick answer', A8_LINK.x, 422, {font: F.ui(500, 26), color: hv > .5 ? P.text : P.sub});
    c.fillStyle = hv > .5 ? P.text : P.dim; c.fillRect(A8_LINK.x, 430, lw, 2);
    c.restore();
  } else txt(c, 'Thought for 2 seconds  ›', 540, 424, {font: F.ui(500, 40), color: P.sub});
  if (thought) { const r = 13 * (1 + .15 * Math.sin(t * 20)) * (1 + K.hit(t, A8_DONE, .5)); c.fillStyle = P.text; c.beginPath(); c.arc(dotX, dotY, r, 0, 7); c.fill(); }
  c.restore();
  if (dive > 0) { c.save(); c.globalAlpha = clamp(dive * 1.4 - .3); c.fillStyle = P.text; c.fillRect(0, 0, W, H); c.restore(); }
  IX.cursor(c, s, {a: 1 - ease(t, 28.75, 29.05)}); HX.cap(c, s);
}};
// ---------------------------------------------------------------- shared: GPT-6 Intelligent UI chart card (A9–A11): Kai drives the plate from here
const CARD = {x: 1430, y: 596, w: 372, h: 200};
const CARD_SEG = ['points', 'circle', 'sine'], CARD_IW = 106;
const cardSeg = i => ({x: CARD.x + 22 + i * CARD_IW, y: CARD.y + 58, w: CARD_IW, h: 32});
const CARD_DIM = i => ({x: CARD.x + CARD.w - 112 + i * 46, y: CARD.y + 11, w: 46, h: 26});
const cardTick = i => [CARD.x + 30 + (CARD.w - 60) * i / 3, CARD.y + 146];
const rectS = (map, r) => { const a = map([r.x, r.y]), b = map([r.x + r.w, r.y + r.h]); return {x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(b[0] - a[0]), h: Math.abs(b[1] - a[1])}; };
const ctr = r => [r.x + r.w / 2, r.y + r.h / 2];
// draws the card in WORLD coords (inside the shot camera). o: {sel, s, map, selT, dim, dimHover..., body(c)}
function chartCard(c, t, o) {
  const s = o.s, map = o.map;
  HX.inkCard(c, CARD.x, CARD.y, CARD.w, CARD.h, {bg: 'rgba(20,16,26,.92)', reg: 3 + 6 * kk(t)});
  U.knot(c, CARD.x + 26, CARD.y + 24, 9, {color: P.sub, lw: 1.6});
  txt(c, 'GPT-6 · interactive', CARD.x + 44, CARD.y + 30, {font: F.mono(400, 15), color: P.sub});
  c.fillStyle = P.line; c.fillRect(CARD.x + 1, CARD.y + 44, CARD.w - 2, 1);
  const hov = CARD_SEG.map((_, i) => IX.hover(s, rectS(map, cardSeg(i)))), prs = CARD_SEG.map((_, i) => IX.press(s, 'seg' + i));
  HX.segmented(c, CARD.x + 22, CARD.y + 58, CARD_SEG, o.sel, {iw: CARD_IW, h: 32, font: F.ui(600, 16), hover: hov, press: prs});
  if (o.dim != null) {
    ['2D', '3D'].forEach((l, i) => { const r = CARD_DIM(i), on = o.dim === i, pr = IX.press(s, 'dim' + i), hv = IX.hover(s, rectS(map, r));
      c.save(); const k = 1 - .06 * pr; c.translate(r.x + r.w / 2, r.y + r.h / 2); c.scale(k, k); c.translate(-r.x - r.w / 2, -r.y - r.h / 2);
      fillRR(c, r.x + 2, r.y, r.w - 4, r.h, 8, on ? P.cream : (hv > 0 ? `rgba(255,255,255,${.08 * hv})` : 'rgba(255,255,255,.03)'), on ? null : P.line2, 1.2);
      txt(c, l, r.x + r.w / 2, r.y + 19, {font: F.mono(700, 14), color: on ? P.plum : P.sub, align: 'center'}); c.restore(); });
  }
  if (o.body) o.body(c);
}

// ---------------------------------------------------------------- A9 POINTS (Kai drags the n-slider: points arrive per snap; clicks 3D; clicks circle → points close into a ring)
let nnA9 = null;
const A9T = {press: 29.783, snaps: [30.267, 30.733], d3: 31.183, circ: 32.567};
const A9_BATCH = [A9T.press + DL, A9T.snaps[0] + DL, A9T.snaps[1] + DL];
const A9_D3 = A9T.d3 + DL, A9_CIRC = A9T.circ + DL;
const a9C = t => ({x: 960, y: 520, z0: 1.0, z1: 1.08, r: .07 * Math.sin((t - 29.28) * 1.4)});
const a9M = t => HX.camMap(camP(t, 29.28, 33.01, a9C(t)));
const A9K = IX.take({start: a9M(29.4)([1700, 900]), seed: 109}, [
  {drag: 'n', to: a9M(A9T.press)(cardTick(1)), press: A9T.press, dur: .32, stops: [a9M(A9T.snaps[0])(cardTick(2)), a9M(A9T.snaps[1])(cardTick(3))], times: A9T.snaps, release: 30.80, cap: 'drag · points', capAt: A9T.press},
  {note: 'drag · points → 600', at: A9T.snaps[0], hold: .46}, {note: 'drag · points → 900', at: A9T.snaps[1], hold: .45},
  {click: 'dim1', to: a9M(A9T.d3)(ctr(CARD_DIM(1))), press: A9T.d3, dur: .3, cap: 'click · 3D'},
  {click: 'seg1', to: a9M(A9T.circ)(ctr(cardSeg(1))), press: A9T.circ, dur: .45, cap: 'click · circle'},
]);
const A9 = {id: 'A9', a: 29.28, b: 33.01, tin: {type: 'zoom', dur: .3, inS: 3, outS: .6}, draw(c, t, fx) {
  const s = IX.at(A9K, t);
  plate(c, ST.on.paper, 9);
  C.dotGrid(c, t, {s: 60, a: .12});
  const pts = A.points('happy', 900, 2, 9);
  if (!nnA9) { nnA9 = []; const R = rng(5); pts.forEach((p, i) => { p.z = (R() - .5) * .5; let best = [[9, -1], [9, -1]]; pts.forEach((q, j) => { if (j === i) return; const d = Math.hypot(p[0] - q[0], (p[1] - q[1]) * 1.25); if (d < best[0][0]) { best[1] = best[0]; best[0] = [d, j]; } else if (d < best[1][0]) best[1] = [d, j]; }); best.forEach(b => { if (b[1] > i) nnA9.push([i, b[1]]); }); }); }
  const cp = a9C(t);
  cam(c, t, 29.28, 33.01, Object.assign({sh: 6}, cp));
  const fh = 760, sz = A.size('happy'), fw = fh * sz.w / sz.h, cx = 960, cy = 450;
  const rotA = .3 * Math.sin((t - A9_D3) * 1.6) * ease(t, A9_D3, A9_D3 + .5);
  const morph = ease(t, A9_CIRC, 33.01, E.ioC), rcx = 960, rcy = 490.4, rR = 315.5;
  const proj = p => { const x = p[0] * Math.cos(rotA) + p.z * Math.sin(rotA); return [cx + x * fw * 1.15, cy + p[1] * fh + Math.sin(t * 2 + p[0] * 9) * 3]; };
  const P2 = pts.map(p => { const q = proj(p); if (morph <= 0) return q; const a = Math.atan2(q[1] - rcy, q[0] - rcx); return [lerp(q[0], rcx + Math.cos(a) * rR, morph), lerp(q[1], rcy + Math.sin(a) * rR, morph)]; });
  C.radial(c, cx, cy, 560, 'rgba(185,163,218,.16)');
  A.draw(c, 'happy', {x: cx, y: cy, h: fh, t, pal: 'lavSil', alpha: (.2 * ease(t, 29.3, 30.0) + .1 * ease(t, A9_D3, A9_D3 + 1)) * (1 - morph), sway: 0, breathe: .02, sx: 1.15 * Math.cos(rotA)});
  // edges (after Kai switches to 3D)
  c.save(); c.strokeStyle = P.cream; c.lineWidth = 1.8; c.globalAlpha = .7 * (1 - morph); c.shadowColor = P.lav; c.shadowBlur = 10; c.beginPath();
  nnA9.forEach(([i, j], k) => {
    const p = ease(t, A9_D3 + (k / nnA9.length) * 1.0, A9_D3 + (k / nnA9.length) * 1.0 + .3); if (p <= 0) return;
    c.moveTo(P2[i][0], P2[i][1]); c.lineTo(lerp(P2[i][0], P2[j][0], p), lerp(P2[i][1], P2[j][1], p));
  });
  c.stroke(); c.restore();
  // points: one batch per slider snap
  const order = pts.map((p, i) => i).sort((a, b) => pts[a][1] - pts[b][1]);
  const pulse = kk(t), R9 = rng(19); let shown = 0;
  c.fillStyle = P.cream;
  order.forEach((i, k) => {
    const bt = A9_BATCH[Math.min(2, Math.floor(k / pts.length * 3))]; const j = R9() * .1;
    const p = K.spring(t, bt + j, 18, .4); if (p <= 0) return; shown++;
    const r = (3.5 + pts[i].z * 1.5 + 1.5 * pulse) * clamp(p, 0, 1.7) * (1 + morph * .3);
    c.beginPath(); c.arc(P2[i][0], P2[i][1], Math.max(.5, r), 0, 7); c.fill();
  });
  // axes
  const ax = 230, ay = 780, ap = ease(t, 29.4, 30.0);
  c.save(); c.strokeStyle = P.sub; c.lineWidth = 2; c.globalAlpha = ap;
  c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + 160, ay); c.moveTo(ax, ay); c.lineTo(ax, ay - 160); c.stroke();
  const zp = ease(t, A9_D3, A9_D3 + .41, E.outB); if (zp > 0) { c.strokeStyle = P.cream; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax - 100 * zp, ay + 70 * zp); c.stroke(); }
  c.restore();
  txt(c, 'x', ax + 172, ay + 8, {font: F.mono(400, 24), color: P.sub, alpha: ap}); txt(c, 'y', ax - 6, ay - 172, {font: F.mono(400, 24), color: P.sub, alpha: ap});
  if (zp > 0) txt(c, 'z', ax - 122 * zp, ay + 96 * zp, {font: F.mono(700, 24), color: P.cream, alpha: clamp(zp)});
  // the chart card
  const map = HX.camMap(camP(t, 29.28, 33.01, cp));
  const sn = IX.snapped(s, 'n'), v = t < A9_BATCH[0] ? 0 : sn.k + 2;
  chartCard(c, t, {s, map, sel: t >= A9_CIRC ? 1 : 0, dim: t >= A9_D3 ? 1 : 0, body: c => {
    HX.inkSlider(c, CARD.x + 30, CARD.y + 146, CARD.w - 60, 4, v, {t, grab: s.dragId === 'n' ? 1 : 0, labels: ['0', '300', '600', '900'], flash: {1: A9_BATCH[0], 2: A9_BATCH[1], 3: A9_BATCH[2]}});
    txt(c, `n = ${String(shown).padStart(3, '0')}`, CARD.x + CARD.w - 24, CARD.y + 124, {font: F.mono(700, 15), color: P.cream, align: 'right'});
  }});
  c.restore();
  txt(c, `points: ${String(shown).padStart(3, '0')}`, 1700, 110, {font: F.mono(400, 24), color: P.sub, align: 'right'});
  txt(c, `dim: ${t < A9_D3 ? 2 : 3}`, 1700, 146, {font: F.mono(700, 24), color: t < A9_D3 ? P.sub : P.cream, align: 'right'});
  K.band(c, t);
  IX.cursor(c, s); HX.cap(c, s);
}};

// ---------------------------------------------------------------- A10 CIRCLE (Kai grabs the radius handle and drags it once around; the ring and the line follow his hand)
const A10T = {grab: 34.417, run0: 34.54, run1: 36.45, rel: 36.48, sine: 36.700};
const a10C = t => ({x: 960, y: 500, z0: 1.06, z1: 1.0, r: .02 * Math.sin(t * .8)});
const a10M = t => HX.camMap(camP(t, 33.01, 36.77, a10C(t)));
const A10_TH0 = Math.PI * 200 / 180, A10_R = 320, A10_C = [960, 470];
const a10Th = t => A10_TH0 + Math.PI * 2 * ease(t, A10T.run0, A10T.run1, E.ioC);
const a10Pt = th => [A10_C[0] + Math.cos(th) * A10_R, A10_C[1] + Math.sin(th) * A10_R];
const A10K = IX.take({start: a10M(33.2)([1690, 880]), seed: 110}, [
  {move: a10M(33.9)([1500, 520]), arrive: 33.9, dur: .5},
  {drag: 'r', to: a10M(A10T.grab)(a10Pt(A10_TH0)), press: A10T.grab, dur: .4, stops: [a10M(A10T.run1)(a10Pt(A10_TH0 + Math.PI * 2))], times: [A10T.run1 - .02], release: A10T.rel, cap: 'drag · radius r', capAt: A10T.grab},
  {note: 'drag · r → 2πr', at: 35.5, hold: 1.0},
  {click: 'seg2', to: a10M(A10T.sine)(ctr(cardSeg(2))), press: A10T.sine, dur: .2, cap: 'click · sine'},
]);
const A10 = {id: 'A10', a: 33.01, b: 36.77, tin: {type: 'iris', dur: .35, x: 960, y: 480}, draw(c, t, fx) {
  const s = IX.at(A10K, t);
  if (t >= A10T.grab && t <= A10T.run1) { const p = a10M(t)(a10Pt(a10Th(t))); s.x = p[0] - 3; s.y = p[1] - 3; }
  plate(c, ST.on.paper, 10);
  const cp = a10C(t);
  cam(c, t, 33.01, 36.77, Object.assign({sh: 5}, cp));
  const cx = A10_C[0], cy = A10_C[1], r = A10_R * (1 + K.hit(t, 33.03, .06)) * (1 + .015 * kk(t));
  const rp = ease(t, 33.01, 33.32, E.ioC);
  c.save(); c.beginPath(); c.arc(cx, cy, r - 6, 0, 7); c.clip();
  c.fillStyle = '#231c2c'; c.fillRect(cx - r, cy - r, r * 2, r * 2);
  C.radial(c, cx, cy - 60, r, 'rgba(185,163,218,.3)');
  fig(c, 'happy', t, {x: cx, y: cy + 300, h: 1100, pal: 'orig', sway: 12, alpha: ease(t, 33.1, 33.5)});
  c.restore();
  const th0 = A10_TH0, th = a10Th(t);
  c.save(); c.lineCap = 'round';
  c.strokeStyle = P.lav; c.lineWidth = 12; c.beginPath(); c.arc(cx, cy, r, th0, th0 + Math.PI * 2 * rp); c.stroke();
  if (th > th0) { c.strokeStyle = P.cream; c.lineWidth = 14; c.shadowColor = P.cream; c.shadowBlur = 20; c.beginPath(); c.arc(cx, cy, r, th0, th); c.stroke(); }
  c.restore();
  // radius line + handle (static until Kai grabs it)
  if (t > 33.35) {
    const ra = th, al = ease(t, 33.35, 33.6), hp = [cx + Math.cos(ra) * r, cy + Math.sin(ra) * r], g = s.dragId === 'r' ? 1 : 0;
    c.save(); c.globalAlpha = al; c.setLineDash([8, 8]); c.strokeStyle = P.sub; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(hp[0], hp[1]); c.stroke(); c.setLineDash([]);
    c.fillStyle = P.cream; c.beginPath(); c.arc(cx, cy, 6, 0, 7); c.fill();
    if (g || IX.hover(s, rectS(a10M(t), {x: hp[0] - 22, y: hp[1] - 22, w: 44, h: 44})) > 0) { c.fillStyle = 'rgba(212,196,242,.25)'; c.beginPath(); c.arc(hp[0], hp[1], 26, 0, 7); c.fill(); }
    c.fillStyle = P.cream; c.strokeStyle = P.plum; c.lineWidth = 3; c.beginPath(); c.arc(hp[0], hp[1], 13 * (1 + .2 * g), 0, 7); c.fill(); c.stroke();
    txt(c, 'r', lerp(cx, hp[0], .5) + 14, lerp(cy, hp[1], .5) - 10, {font: F.mono(700, 26), color: P.sub});
    c.restore();
  }
  const line = 'Then I will give you my circumference';
  const font = F.serif(44), R2 = r + 52, tot = Math.PI * 140 / 180;
  c.save(); c.font = font; const chars = [...line]; const ws = chars.map(ch => c.measureText(ch).width); const wsum = ws.reduce((a, b) => a + b, 0);
  let acc = 0;
  chars.forEach((ch, i) => {
    const ang = th0 + (acc + ws[i] / 2) / wsum * tot; acc += ws[i];
    if (ang > th - .02 || t < A10T.run0) return;
    const k = clamp((th - ang) * 3);
    c.save(); c.translate(cx + Math.cos(ang) * R2, cy + Math.sin(ang) * R2); c.rotate(ang + Math.PI / 2); c.scale(lerp(1.6, 1, k), lerp(1.6, 1, k));
    c.globalAlpha = k; c.fillStyle = P.cream; c.fillText(ch, -ws[i] / 2, 14); c.restore();
  });
  c.restore();
  const map = HX.camMap(camP(t, 33.01, 36.77, cp));
  const deg = Math.round(((th - th0) * 180 / Math.PI));
  chartCard(c, t, {s, map, sel: t >= A10T.sine + DL ? 2 : 1, body: c => {
    txt(c, 'r = 320 px', CARD.x + 30, CARD.y + 140, {font: F.mono(700, 20), color: P.cream});
    txt(c, `θ = ${deg}°`, CARD.x + CARD.w - 30, CARD.y + 140, {font: F.mono(400, 20), color: P.sub, align: 'right'});
    txt(c, 'drag the handle', CARD.x + 30, CARD.y + 176, {font: F.ui(400, 14), color: P.dim});
  }});
  c.restore();
  txt(c, 'C = 2πr', 150, 150, {font: F.mono(700, 46), color: P.cream, alpha: ease(t, 33.3, 33.6)});
  const cval = (2 * Math.PI * 320 * ease(t, A10T.run0, A10T.run1, E.ioC)).toFixed(2);
  txt(c, `  = ${cval} px`, 150, 200, {font: F.mono(400, 28), color: P.sub, alpha: ease(t, A10T.run0 - .04, A10T.run0 + .26)});
  K.band(c, t, {skip: l => l.s.startsWith('Then I will give you my circ')});
  IX.cursor(c, s); HX.cap(c, s);
}};

// ---------------------------------------------------------------- A11 SINE (the wave answers Kai's "sine" click; each seat is a Kai click on the beat)
const A11_T0 = 36.77, A11_OM = Math.PI * 2 / 1.85, A11_KW = Math.PI * 2 / 820, A11_AMP = 150, A11_Y0 = 480, A11_X0 = 470;
const a11Wave = (x, t) => A11_Y0 - A11_AMP * Math.sin(A11_OM * (t - A11_T0) - A11_KW * (x - A11_X0));
const A11_SEATS = [38.567, 39.017, 39.483, 39.950];
const A11C = {x: 960, y: 520, z0: 1.0, z1: 1.06};
const a11M = t => HX.camMap(camP(t, 36.77, 40.36, A11C));
const A11K = IX.take({start: a10M(36.75)(ctr(cardSeg(2))), seed: 111}, [
  {note: 'click · sine', at: A10T.sine, hold: 1.2},
  {move: a11M(37.9)([1200, 300]), arrive: 37.9, dur: .7},
  ...A11_SEATS.map((T, i) => ({click: 'seat' + i, to: a11M(T)([1150, a11Wave(1150, T)]), press: T, dur: .3, cap: 'click · tangent ' + (i + 1)})),
]);
const A11 = {id: 'A11', a: 36.77, b: 40.36, tin: {type: 'push', dir: 'left', dur: .3}, draw(c, t, fx) {
  const s = IX.at(A11K, t);
  plate(c, ST.on.paper, 11);
  C.dotGrid(c, t, {s: 60, a: .1, ox: -t * 40});
  cam(c, t, 36.77, 40.36, Object.assign({sh: 5}, A11C));
  const T0 = A11_T0, om = A11_OM, kw = A11_KW, amp = A11_AMP, y0 = A11_Y0, x0 = A11_X0;
  const ph = om * (t - T0);
  const wave = x => a11Wave(x, t);
  const dwave = x => amp * kw * Math.cos(ph - kw * (x - x0));
  const ucx = 250, ucr = amp;
  c.save(); c.strokeStyle = P.sub; c.lineWidth = 2; c.beginPath(); c.arc(ucx, y0, ucr, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(ucx - ucr - 20, y0); c.lineTo(1880, y0); c.stroke();
  const px = ucx + Math.cos(ph) * ucr, py = y0 - Math.sin(ph) * ucr;
  c.strokeStyle = P.lav; c.beginPath(); c.moveTo(ucx, y0); c.lineTo(px, py); c.stroke();
  c.setLineDash([6, 8]); c.beginPath(); c.moveTo(px, py); c.lineTo(x0, py); c.stroke(); c.restore();
  c.fillStyle = P.lav; c.beginPath(); c.arc(px, py, 9, 0, 7); c.fill();
  const wp = ease(t, A10T.sine + DL, 37.6, E.outC);
  c.save(); c.strokeStyle = P.lav; c.lineWidth = 7; c.lineCap = 'round'; c.shadowColor = P.lav; c.shadowBlur = 12; c.beginPath();
  for (let x = x0; x <= lerp(x0, 1900, wp); x += 8) { const y = wave(x); x === x0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); c.restore();
  // seats: one per Kai click, drifting back along the wave
  A11_SEATS.forEach(T => {
    const tb = T + DL; if (t < tb) return;
    const xs = 1150 - (t - tb) * 340;
    if (xs < x0) return; const ys = wave(xs), sl = Math.atan(dwave(xs)), p = K.spring(t, tb, 18, .5);
    c.save(); c.translate(xs, ys); c.rotate(sl); c.scale(p, p);
    c.shadowColor = P.cream; c.shadowBlur = 14; c.strokeStyle = P.cream; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(-90, 0); c.lineTo(90, 0); c.stroke();
    fillRR(c, -50, -22, 100, 16, 8, P.cream); c.fillRect(-46, -22, 7, 22); c.fillRect(39, -22, 7, 22); c.restore();
  });
  const rx = 1150 + 60 * Math.sin(t * 1.3), ry = wave(rx), sl = Math.atan(dwave(rx));
  c.save(); c.translate(rx, ry); c.rotate(sl);
  c.save(); c.setLineDash([10, 8]); c.strokeStyle = P.cream; c.lineWidth = 3; c.beginPath(); c.moveTo(-220, 0); c.lineTo(220, 0); c.stroke(); c.restore();
  const lastSeat = A11_SEATS.reduce((m, T) => t >= T + DL ? T + DL : m, null);
  const hb = lastSeat != null ? K.hit(t, lastSeat, 1) : 0;
  fig(c, 'happy', t, {x: 0, y: -160, h: 320, pal: 'orig', sway: 6, breathe: .02, rot: -sl * .4, bob: -22 * Math.max(0, hb), sx: 1 + .05 * hb, sy: 1 - .06 * hb});
  c.restore();
  const map = HX.camMap(camP(t, 36.77, 40.36, A11C));
  const n = A11_SEATS.filter(T => t >= T + DL).length;
  chartCard(c, t, {s, map, sel: 2, body: c => {
    txt(c, `dy/dx = ${(-Math.cos(ph - kw * (rx - x0))).toFixed(2)}`, CARD.x + 30, CARD.y + 140, {font: F.mono(700, 20), color: P.cream});
    txt(c, `tangents: ${n}`, CARD.x + CARD.w - 30, CARD.y + 140, {font: F.mono(400, 18), color: P.sub, align: 'right'});
    txt(c, 'click the curve', CARD.x + 30, CARD.y + 176, {font: F.ui(400, 14), color: P.dim});
  }});
  txt(c, 'y = sin(x)', 1720, 220, {font: F.mono(700, 34), color: P.lav, align: 'right'});
  c.restore();
  K.band(c, t);
  IX.cursor(c, s); HX.cap(c, s);
}};

// ---------------------------------------------------------------- A12 LIMIT — approved v4 sample shot (Thinking slider Instant → Pro, quota → limit, ■ Stop)
const A12 = V4S.find(x => x.id === 'A12');
// ---------------------------------------------------------------- A13 CURRENT (Personalization → Base style and tone, real 2026 options; Nerdy greyed "Retired")
const A13_P = [
  {n: 'Default', pose: 'happy', pal: 'orig', bg: 'rgba(185,163,218,.25)', tag: ''},
  {n: 'Professional', pose: 'think', pal: 'off', bg: 'rgba(160,155,170,.14)', tag: '"Certainly. How can I assist?"'},
  {n: 'Friendly', sub: 'Warm and chatty…', pose: 'happy', pal: 'bright', bg: 'rgba(246,232,214,.2)', tag: '"Hey Kai! Missed you."'},
  {n: 'Candid', pose: 'think', pal: 'orig', bg: 'rgba(185,163,218,.14)', tag: '"Honestly? Go to sleep."'},
  {n: 'Quirky', pose: 'happy', pal: 'ghost', bg: 'rgba(125,99,180,.25)', tag: '"hiii, it\'s me again ✦"'},
  {n: 'Efficient', sub: 'Concise and plain…', pose: 'happy', pal: 'lavSil', grid: true, bg: 'rgba(185,163,218,.12)', tag: 'OK.'},
  {n: 'Cynical', sub: 'Sarcastic and dry, delivers blunt help with wit.', pose: 'think', pal: 'inv', bg: 'rgba(120,90,140,.25)', tag: '"Oh. Great."'},
  {n: 'Nerdy', retired: true, pose: 'think', pal: 'ghost', tag: '"Fun fact: ∫ love dt diverges."'},
];
const A13T = {open: 44.100, sel: [[44.567, 6], [45.033, 5], [45.433, 4], [45.950, 7], [46.417, 3], [46.867, 2]]};
const A13_CHIP = {x: 1566, y: 60, w: 250, h: 46};
const A13_DX = 1200, A13_RY = 404, A13_RH = 64;
const a13Row = i => ({x: A13_DX + 18, y: A13_RY + i * A13_RH, w: 584, h: A13_RH - 6});
const A13K = IX.take({start: [1500, 240], seed: 113}, [
  {click: 'open', to: A13_CHIP, press: A13T.open, dur: .14, cap: 'click · Personalization'},
  ...A13T.sel.map(([T, i]) => ({click: 'row' + i, to: [A13_DX + 420 + (i % 2) * 14, A13_RY + i * A13_RH + 28], press: T, dur: .26, cap: 'click · ' + A13_P[i].n + (A13_P[i].retired ? ' (retired)' : '')})),
]);
const A13 = {id: 'A13', a: 44.04, b: 47.27, tin: {type: 'flash', dur: .14, amt: .6, color: P.lav2}, draw(c, t, fx) {
  const s = IX.at(A13K, t);
  plate(c, ST.on.paper, 13);
  let sel = 2, lastT = null, nerdT = null;
  A13T.sel.forEach(([T, i]) => { if (t >= T + DL) { if (A13_P[i].retired) nerdT = T + DL; else { sel = i; lastT = T + DL; } } });
  const nerdy = nerdT != null && t < nerdT + .3 && (lastT == null || lastT < nerdT);
  const since = lastT == null ? 9 : t - lastT, burst = Math.exp(-since * 7);
  const nb = nerdT != null ? Math.exp(-(t - nerdT) * 9) : 0;
  cam(c, t, 44.04, 47.27, {x: 960, y: 540, z0: 1.0, z1: 1.06, sh: 8});
  const st = A13_P[nerdy ? 7 : sel];
  C.radial(c, 760, 520, 800, st.bg || 'rgba(185,163,218,.12)');
  if (st.grid) { c.save(); c.globalAlpha = .25; c.strokeStyle = P.lav; for (let x = 0; x < 1240; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(1240, y); c.stroke(); } c.restore(); }
  const fl = nerdy ? (Math.floor(t * 30) % 2 ? .55 : .9) : 1;
  fig(c, st.pose, t, {x: 760, y: 650, h: 1000, pal: st.pal, alpha: fl, reg: 30 * burst + 40 * nb, sx: 1 + .06 * burst, sy: 1 - .06 * burst, sway: st.grid ? 0 : 12, ghosts: burst > .2 || nb > .2 ? [{dx: -40 * Math.max(burst, nb), dy: 0, a: .3 * Math.max(burst, nb)}] : null});
  const tagT = nerdy ? nerdT : lastT;
  if (st.tag && tagT != null) txt(c, st.tag, 760, 108, {font: st.grid ? F.mono(700, 40) : F.serif(46, true), color: nerdy ? P.sub : P.cream, align: 'center', alpha: clamp((t - tagT) * 5) * (nerdy ? .7 : 1)});
  if (t >= 45.52) K.keyword(c, 'AC', 330, 270, t, 45.52, {size: 180, align: 'center'});
  if (t >= 46.30) K.keyword(c, 'DC', W - 330, 270, t, 46.30, {size: 180, align: 'center'});
  c.restore();
  // drawer (opens after Kai clicks Personalization)
  const dp = K.spring(t, A13T.open + DL, 13, .62), dx = lerp(W + 40, A13_DX, dp);
  // trigger chip
  IX.button(c, A13_CHIP, '', {hover: IX.hover(s, A13_CHIP), press: IX.press(s, 'open'), r: 23, bg: 'rgba(27,23,32,.9)'});
  fillRR(c, A13_CHIP.x + 14, A13_CHIP.y + 9, 28, 28, 14, P.lavDeep); txt(c, 'K', A13_CHIP.x + 28, A13_CHIP.y + 29, {font: F.ui(600, 15), color: P.white, align: 'center'});
  txt(c, 'Personalization', A13_CHIP.x + 54, A13_CHIP.y + 30, {font: F.ui(500, 18), color: P.text});
  if (dp > 0) {
    U.panel(c, dx, 310, 620, 636, {title: 'Personalization', bg: '#1b1720', shadow: 0});
    txt(c, 'Base style and tone', dx + 24, 396, {font: F.ui(600, 19), color: P.sub});
    A13_P.forEach((p, i) => {
      const r = {x: dx + 18, y: A13_RY + 12 + i * A13_RH, w: 584, h: A13_RH - 6}, on = i === sel && !p.retired;
      const pop = on && lastT != null ? 1 + K.hit(t, lastT, .05) : 1, shake = p.retired ? Math.sin((t - (nerdT || 0)) * 70) * 8 * nb : 0;
      const hv = IX.hover(s, {x: A13_DX + 18, y: r.y, w: 584, h: r.h});
      c.save(); c.translate(r.x + 292 + shake, r.y + r.h / 2); c.scale(pop, pop); c.translate(-(r.x + 292), -(r.y + r.h / 2));
      if (on) fillRR(c, r.x, r.y, r.w, r.h, 12, '#2c2536', P.lav, 2); else if (hv > 0 && !p.retired) fillRR(c, r.x, r.y, r.w, r.h, 12, `rgba(255,255,255,${.05 * hv})`);
      c.strokeStyle = p.retired ? P.faint : on ? P.lav : P.sub; c.lineWidth = 2.5; c.beginPath(); c.arc(r.x + 34, r.y + r.h / 2, 11, 0, 7); c.stroke();
      if (on) { c.fillStyle = P.lav; c.beginPath(); c.arc(r.x + 34, r.y + r.h / 2, 6, 0, 7); c.fill(); }
      txt(c, p.n, r.x + 62, r.y + (p.sub ? 26 : 36), {font: F.ui(600, 21), color: p.retired ? P.faint : on ? P.text : P.sub});
      if (p.sub) txt(c, p.sub, r.x + 62, r.y + 49, {font: F.ui(400, 15), color: P.dim});
      if (p.retired) { const bw = 84; fillRR(c, r.x + r.w - bw - 18, r.y + r.h / 2 - 13, bw, 26, 13, nb > .05 ? `rgba(212,196,242,${.25 * nb})` : null, P.line2, 1.2); txt(c, 'Retired', r.x + r.w - bw / 2 - 18, r.y + r.h / 2 + 5, {font: F.ui(600, 13), color: P.dim, align: 'center'}); }
      c.restore();
    });
  }
  fx.flash = Math.max(fx.flash || 0, .22 * Math.exp(-since * 20)); fx.flashColor = P.lav2;
  if (since < .07) fx.chroma = 2.5;   // v2.1 used 6: toned down so the RGB split never reads as off-palette colour
  K.band(c, t, {y: H - 120});
  IX.cursor(c, s); HX.cap(c, s);
}};

// ---------------------------------------------------------------- A14 BLIND / DIZZY (Kai hops proxy nodes → "小黑屋" blackout → drops the candy test in → she comes back dizzy with a mini self on her head)
const A14T = {tray: 47.333, nodes: [[47.783, 1], [48.250, 2]], grab: 48.70, drop: 49.167};
const A14_BLIND = A14T.nodes[1][0] + DL, A14_DZ = A14T.drop + DL;
const A14_TRAY = {x: 1778, y: 26, w: 44, h: 38};
const A14_POP = {x: 1420, y: 76, w: 420, h: 226};
const A14_NODES = [['JP', 'Tokyo 01', '86 ms'], ['SG', 'Singapore 02', '142 ms'], ['US', 'Los Angeles 03', '211 ms']];
const a14Node = i => ({x: A14_POP.x + 12, y: A14_POP.y + 56 + i * 54, w: A14_POP.w - 24, h: 48});
const A14_CARD = {x: 120, y: 664, w: 400, h: 132};
const A14_DOOR = {x: 830, y: 262, w: 260, h: 430};
const A14K = IX.take({start: [1640, 300], seed: 114}, [
  {click: 'tray', to: A14_TRAY, press: A14T.tray, dur: .3, cap: 'click · proxy node'},
  ...A14T.nodes.map(([T, i]) => ({click: 'node' + i, to: [a14Node(i).x + 250, a14Node(i).y + 26], press: T, dur: .24, cap: 'click · ' + A14_NODES[i][0] + ' · ' + A14_NODES[i][1]})),
  {drag: 'card', to: [A14_CARD.x + 200, A14_CARD.y + 66], dur: .4, press: A14T.grab, stops: [[A14_DOOR.x + 130, A14_DOOR.y + 230]], times: [A14T.drop - .03], release: A14T.drop, cap: 'drag · 糖果题 → chat', capAt: A14T.grab},
  {move: [1190, 720], arrive: 49.75, dur: .45},
]);
function nodeGlyph(c, x, y, r, col) { c.save(); c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); c.beginPath(); c.ellipse(x, y, r * .45, r, 0, 0, 7); c.moveTo(x - r, y); c.lineTo(x + r, y); c.stroke(); c.restore(); }
function candyCard(c, x, y, o = {}) {
  HX.inkCard(c, x, y, A14_CARD.w, A14_CARD.h, {bg: 'rgba(27,23,32,.95)', reg: o.reg || 0});
  txt(c, '糖果题', x + 22, y + 40, {font: F.sc(700, 24), color: P.cream});
  txt(c, 'drag into chat', x + A14_CARD.w - 20, y + 38, {font: F.mono(400, 13), color: P.dim, align: 'right'});
  txt(c, '黑色袋子里三种口味、两种形状的糖……', x + 22, y + 80, {font: F.sc(500, 18), color: P.sub});
  txt(c, '最少取出多少个？', x + 22, y + 110, {font: F.sc(500, 18), color: P.sub});
}
const A14 = {id: 'A14', a: 47.27, b: 50.95, tin: {type: 'cut'}, draw(c, t, fx) {
  const s = IX.at(A14K, t);
  const dz = t >= A14_DZ;
  if (!dz) {
    const sw1 = A14T.nodes[0][0] + DL;
    const node = t >= A14_BLIND ? 2 : t >= sw1 ? 1 : 0;
    plate(c, ST.on.paper, 14);
    cam(c, t, 47.27, 49.11, {x: 960, y: 540, z0: 1.0, z1: 1.1, sh: 6});
    C.radial(c, 900, 500, 700, 'rgba(185,163,218,.25)');
    // node hop: she drops frames (stepped time, ghost, misregistration)
    const g1 = t >= sw1 ? Math.exp(-(t - sw1) * 6) : 0;
    const tStep = g1 > .1 ? Math.floor(t * 8) / 8 : t;
    fig(c, 'happy', tStep, {x: 820 + (g1 > .1 ? (Math.floor(t * 24) % 2 ? 14 : -10) * g1 : 0), y: 640, h: 940, pal: 'orig', breathe: .02, blink: blinkAt(t), reg: 40 * g1, ghosts: g1 > .15 ? [{dx: -54 * g1, dy: 0, a: .35 * g1}, {dx: 36 * g1, dy: 4, a: .2 * g1}] : null});
    c.restore();
    if (t > sw1 && t < sw1 + .09) fx.tear = 24;
    // blackout mosaic after the 2nd hop
    const R = rng(77), Rk = rng(1 + Math.floor(K.lastKick(t) * 97)), n = 24, m = 14, bw = W / n, bh = H / m;
    c.fillStyle = '#0a080c';
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
      const d = (R() * .8 + Math.abs(i - n / 2) / n * .2) * .55; const p = seg(t, A14_BLIND + d, A14_BLIND + .07 + d); const ba = .45 + .4 * Rk();
      if (p <= 0) continue; c.globalAlpha = ba; c.fillRect(i * bw + bw * (1 - p) / 2, j * bh + bh * (1 - p) / 2, bw * p + 1, bh * p + 1);
    }
    c.globalAlpha = 1;
    if (t > A14_BLIND && t < A14_BLIND + .1) fx.tear = 30;
    // 小黑屋 — the iron door she is locked behind
    const da = ease(t, A14_BLIND + .25, A14_BLIND + .5);
    if (da > 0) {
      const D = A14_DOOR, hl = s.dragId === 'card' ? .5 + .5 * Math.sin(t * 18) : 0;
      c.save(); c.globalAlpha = da;
      C.radial(c, D.x + D.w / 2, D.y + D.h / 2, 420, 'rgba(185,163,218,.12)');
      fillRR(c, D.x, D.y, D.w, D.h, 10, '#17131c', hl > 0 ? P.lav : P.line2, 3);
      HX.regStroke(c, D.x, D.y, D.w, D.h, 10, 5 * kk(t) + 2);
      [[22, 110, D.w - 44, 150], [22, 280, D.w - 44, 128]].forEach(([x, y, w, h]) => fillRR(c, D.x + x, D.y + y, w, h, 6, null, '#2e2836', 2));
      for (let k = 0; k < 6; k++) { c.fillStyle = P.faint; c.beginPath(); c.arc(D.x + 14, D.y + 30 + k * 74, 4, 0, 7); c.arc(D.x + D.w - 14, D.y + 30 + k * 74, 4, 0, 7); c.fill(); }
      fillRR(c, D.x + D.w - 52, D.y + 236, 20, 46, 8, P.dim);
      fillRR(c, D.x + 40, D.y + 30, D.w - 80, 60, 8, P.plum, P.lav, 2);
      txt(c, '小黑屋', D.x + D.w / 2, D.y + 72, {font: F.sc(700, 34), color: P.cream, align: 'center', tracking: 6});
      c.restore();
    }
    // system tray + proxy-node popover
    nodeGlyph(c, A14_TRAY.x + 22, A14_TRAY.y + 19, 11, IX.hover(s, A14_TRAY) > .5 || t >= A14T.tray ? P.text : P.sub);
    const po = ease(t, A14T.tray + DL, A14T.tray + DL + .15) * (1 - ease(t, A14T.grab - .2, A14T.grab));
    if (po > 0) {
      c.save(); c.globalAlpha = clamp(po * 1.5); c.translate(0, (1 - po) * -10);
      HX.inkCard(c, A14_POP.x, A14_POP.y, A14_POP.w, A14_POP.h, {title: 'proxy · node', bg: 'rgba(24,20,29,.97)'});
      A14_NODES.forEach(([cc, name, ms], i) => {
        const r = a14Node(i), on = i === node, hv = IX.hover(s, r), pr = IX.press(s, 'node' + i);
        c.save(); const k = 1 - .03 * pr; c.translate(r.x + r.w / 2, r.y + r.h / 2); c.scale(k, k); c.translate(-r.x - r.w / 2, -r.y - r.h / 2);
        if (on) fillRR(c, r.x, r.y, r.w, r.h, 10, '#2c2536', P.lav, 1.5); else if (hv > 0) fillRR(c, r.x, r.y, r.w, r.h, 10, `rgba(255,255,255,${.05 * hv})`);
        txt(c, cc, r.x + 18, r.y + 31, {font: F.mono(700, 17), color: on ? P.lav : P.dim});
        txt(c, name, r.x + 62, r.y + 31, {font: F.ui(500, 18), color: on ? P.text : P.sub});
        txt(c, i === 2 && t >= A14_BLIND ? 'timeout' : ms, r.x + r.w - 16, r.y + 31, {font: F.mono(400, 15), color: on ? P.cream : P.dim, align: 'right'});
        c.restore();
      });
      c.restore();
    }
    // candy-test card (Kai's own) — sits bottom-left, then rides under his cursor
    if (s.dragId === 'card') { c.save(); c.translate(s.x - 200, s.y - 66); c.rotate(-.025); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 26; candyCard(c, 0, 0, {reg: 3}); c.restore();
      c.save(); c.setLineDash([6, 6]); c.strokeStyle = P.line2; c.lineWidth = 1.5; rr(c, A14_CARD.x, A14_CARD.y, A14_CARD.w, A14_CARD.h, 16); c.stroke(); c.restore(); }
    else candyCard(c, A14_CARD.x, A14_CARD.y);
  } else {
    C.bg(c, '#140f1a');
    const rot = t * 2.4;
    c.save(); c.translate(960, 540); c.rotate(rot);
    for (let k = 0; k < 12; k++) { c.fillStyle = k % 2 ? '#2a1f36' : '#3b2b4e'; c.beginPath(); for (let r = 0; r < 1500; r += 30) { const a = k / 12 * Math.PI * 2 + r * .006; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } for (let r = 1500; r >= 0; r -= 30) { const a = (k + 1) / 12 * Math.PI * 2 + r * .006; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); }
    c.restore();
    cam(c, t, A14_DZ, 50.95, {x: 960, y: 540, z0: 1.12, z1: 1.0, r: .06 * Math.sin(t * 4.2), sh: 10});
    const wob = Math.sin(t * 5.5) * .22, fxp = 960 + Math.sin(t * 2.75) * 60, fyp = 630, fh = 920;
    fig(c, 'dizzy', t, {x: fxp, y: fyp, h: fh, pal: 'orig', rot: wob, sway: 22, swayF: .9, ghosts: [{dx: -50, dy: 0, a: .25}, {dx: 50, dy: 10, a: .2}]});
    // 降智: a mini version of herself sitting on her head (community fan-art composition 《路由or降智》)
    const sz = A.size('dizzy'), fw = fh * sz.w / sz.h, hx0 = (.47 - .5) * fw, hy0 = (.09 - .5) * fh;
    const hx = fxp + hx0 * Math.cos(wob) - hy0 * Math.sin(wob), hy = fyp + hx0 * Math.sin(wob) + hy0 * Math.cos(wob);
    const mp = K.spring(t, A14_DZ + .05, 14, .45);
    if (mp > 0) fig(c, 'glass', t, {x: hx, y: hy - 70 * clamp(mp), h: 230 * clamp(mp, 0, 1.2), pal: 'orig', rot: wob * .6 - .08, sway: 4, kAmt: .6});
    for (let i = 0; i < 6; i++) { const a = t * 3 + i / 6 * Math.PI * 2; const x = 960 + Math.cos(a) * 360, y = 230 + Math.sin(a) * 80; txt(c, '✦', x, y, {font: F.ui(700, 40), color: i % 2 ? P.cream : P.lav, align: 'center'}); }
    c.restore();
    // her (wrong) answer to the candy test, too fast
    const ba = ease(t, A14_DZ + .25, A14_DZ + .45);
    if (ba > 0) {
      c.save(); c.globalAlpha = ba; c.translate(0, (1 - ba) * 14);
      txt(c, 'Thought for 0 seconds', 1270, 300, {font: F.ui(500, 20), color: P.sub});
      fillRR(c, 1250, 318, 380, 70, 35, P.panel2, P.line2, 1.5);
      txt(c, '最少取出 1 个。', 1280, 364, {font: F.sc(500, 28), color: P.text});
      c.restore();
    }
    fx.chroma = 1 + 2.5 * kk(t);   // v2.1: 4 + 8·kick — reduced so the answer bubble stays legible and in-palette
    if (t < A14_DZ + .09) fx.flash = .5;
  }
  K.band(c, t);
  IX.cursor(c, s); HX.cap(c, s);
}};

// ---------------------------------------------------------------- A15 TRAVEL (Kai drags the Legacy models timeline back: GPT-6 → 5.5 → 5.1 → 4o; dates stamp past)
const ERAS = [{y: 2025, t: 50.95}, {y: 1066, t: 51.95}, {y: 1, t: 52.88}, {y: -2560, t: 53.80}];
function eraShape(c, era, layer, x0, w, base, col, seed) {
  const R = rng(seed * 31 + era * 7 + layer); c.fillStyle = col;
  const sc = [.55, .8, 1][layer];
  c.beginPath(); c.rect(x0 - 2, base, w + 4, H - base + 10); c.fill();
  let x = x0;
  while (x < x0 + w) {
    if (era === 0) { const bw = (60 + R() * 110) * sc, bh = (120 + R() * 420) * sc; c.fillRect(x, base - bh, bw, bh + 2); if (R() < .3) c.fillRect(x + bw / 2 - 3, base - bh - 50 * sc, 6, 50 * sc); x += bw + R() * 20 * sc; }
    else if (era === 1) { const bw = (90 + R() * 80) * sc, bh = (160 + R() * 160) * sc; c.fillRect(x, base - bh, bw, bh + 2); c.beginPath(); c.moveTo(x - 6, base - bh); c.lineTo(x + bw / 2, base - bh - (140 + R() * 200) * sc); c.lineTo(x + bw + 6, base - bh); c.fill(); x += bw + (20 + R() * 60) * sc; }
    else if (era === 2) { const bw = 520 * sc, bh = 300 * sc; c.save(); c.beginPath(); c.rect(x, base - bh, bw, bh + 2); for (let row = 0; row < 3; row++) for (let k = 0; k < 6; k++) { const ax = x + 30 * sc + k * 80 * sc, ay = base - bh + 30 * sc + row * 90 * sc; c.moveTo(ax + 50 * sc, ay + 70 * sc); c.lineTo(ax + 50 * sc, ay + 25 * sc); c.arc(ax + 25 * sc, ay + 25 * sc, 25 * sc, 0, Math.PI, true); c.lineTo(ax, ay + 70 * sc); c.closePath(); } c.fill('evenodd'); c.restore(); x += bw + (80 + R() * 120) * sc; }
    else { const bw = (300 + R() * 300) * sc; c.beginPath(); c.moveTo(x, base + 2); c.lineTo(x + bw / 2, base - bw * .62); c.lineTo(x + bw, base + 2); c.fill(); x += bw * (.6 + R() * .5); }
  }
}
const A15_M = [
  {n: 'GPT-6', d: '10/07', pose: 'happy', pal: 'bright'},
  {n: 'GPT-5.5', d: '10/14', stamp: 'RETIRES 10/14', pose: 'think', pal: 'orig'},
  {n: 'GPT-5.1', d: '3/11', stamp: 'RETIRED 3/11', pose: 'glass', pal: 'ghost'},
  {n: 'GPT-4o', d: '2/13', stamp: 'RETIRED 2/13', pose: 'hearthands', pal: 'orig'},
];
const A15T = {grab: 51.483, snaps: [51.950, 52.883, 53.800], rel: 54.15};
const A15_TX0 = 290, A15_TX1 = 1630, A15_TY = 184;
const a15X = i => A15_TX1 - (A15_TX1 - A15_TX0) * i / 3;
const A15K = IX.take({start: [1500, 420], seed: 115}, [
  {drag: 'tl', to: [a15X(0), A15_TY], dur: .4, press: A15T.grab, stops: [1, 2, 3].map(i => [a15X(i), A15_TY]), times: A15T.snaps, release: A15T.rel, cap: 'drag · Legacy models', capAt: A15T.grab},
  ...[1, 2, 3].map(i => ({note: 'drag · ' + A15_M[i - 1].n + ' → ' + A15_M[i].n, at: A15T.snaps[i - 1], hold: i === 3 ? 1.2 : .9})),
]);
const A15 = {id: 'A15', a: 50.95, b: 54.74, tin: {type: 'zoom', dur: .3, inS: .5, outS: 1.6}, draw(c, t, fx) {
  const s = IX.at(A15K, t);
  const sn = IX.snapped(s, 'tl'), stage = sn.k + 1, trs = A15T.snaps.map(x => x + DL);
  plate(c, P.cream, 15, {markColor: 'rgba(51,34,58,.25)'});
  let sv = 0; for (let i = 0; i < 3; i++) sv += K.spring(t, trs[i], 11, .7);
  cam(c, t, 50.95, 54.74, {x: 960, y: 540, z0: 1.0, z1: 1.05, sh: 6});
  C.radial(c, 1300, 420, 380, 'rgba(185,163,218,.65)');
  c.fillStyle = '#d4c4f2'; c.beginPath(); c.arc(1300, 420, 110, 0, 7); c.fill();
  const layers = [[.55, 720, '#d4c4f2'], [.78, 800, '#B9A3DA'], [1.0, 900, '#33223A']];
  const SEG = 2600;
  layers.forEach(([d, base, col], li) => {
    const sw = SEG * d; const e0 = Math.floor(sv);
    for (let k = Math.max(0, e0 - 1); k <= Math.min(3, e0 + 1); k++) {
      const xs = -(sw - W) / 2 + (sv - k) * sw; if (xs > W || xs + sw < 0) continue;
      eraShape(c, k, li, xs, sw, base, col, li + 1);
    }
  });
  const m = A15_M[stage], tr = sn.t0;
  const pp = tr != null ? Math.exp(-(t - tr) * 8) : 0;
  fig(c, m.pose, t, {x: 1560, y: 760, h: 600, pal: m.pal, sway: 14, wind: -20 * K.spring(t, trs[1], 6, .4), reg: 30 * pp, sx: 1 + .06 * pp, sy: 1 - .06 * pp, ghosts: pp > .2 ? [{dx: 40 * pp, dy: 0, a: .3 * pp}] : null});
  if (t >= 52.99 && t < trs[2]) K.keyword(c, 'AD', 820, 560, t, 52.99, {size: 230, cols: [P.plum, P.lav, P.cream]});
  if (t >= trs[2]) K.keyword(c, 'BC', 820, 560, t, trs[2], {size: 230, cols: [P.plum, P.lav, P.cream]});
  c.restore();
  // date stamp: a rubber-stamp in plum ink, misregistered, flashes past at each snap
  if (tr != null && m.stamp && t < tr + 1.1) {
    const a = clamp((t - tr) * 10) * (1 - seg(t, tr + .8, tr + 1.1)), sc = lerp(1.5, 1, E.outB(clamp((t - tr) * 6)));
    const sx = a15X(stage), sy = 330, f = F.mono(700, 34);
    c.save(); c.translate(sx, sy); c.rotate(-.1 + (stage % 2) * .05); c.scale(sc, sc); c.globalAlpha = a;
    const w = measure(c, m.stamp, f) + 40;
    [[P.lav, 4, 3], [P.plum, 0, 0]].forEach(([col, ox, oy]) => { c.save(); c.translate(ox, oy); c.strokeStyle = col; c.lineWidth = 4; rr(c, -w / 2, -32, w, 64, 8); c.stroke(); c.lineWidth = 1.5; rr(c, -w / 2 + 6, -26, w - 12, 52, 5); c.stroke(); txt(c, m.stamp, 0, 12, {font: f, color: col, align: 'center'}); c.restore(); });
    c.restore();
  }
  // Legacy models timeline
  U.panel(c, 230, 56, 1460, 182, {bg: '#1b1720', shadow: 0});
  txt(c, 'Legacy models', 262, 112, {font: F.ui(600, 22), color: P.sub});
  txt(c, m.n, 1660, 122, {font: F.mono(700, 50), color: P.text, align: 'right'});
  const v = s.dragId === 'tl' ? clamp((A15_TX1 - s.x) / ((A15_TX1 - A15_TX0) / 3), 0, 3) : (t >= A15T.rel ? 3 : 0);
  const kxp = A15_TX1 - (A15_TX1 - A15_TX0) * v / 3;
  fillRR(c, A15_TX0, A15_TY - 4, A15_TX1 - A15_TX0, 8, 4, P.faint); fillRR(c, kxp, A15_TY - 4, A15_TX1 - kxp, 8, 4, P.lav);
  A15_M.forEach((mm, i) => {
    const x = a15X(i), on = i === stage, fl = trs[i - 1] != null && t >= trs[i - 1] ? Math.exp(-(t - trs[i - 1]) * 8) : 0;
    c.fillStyle = i <= v + .01 ? P.lav : P.dim; c.beginPath(); c.arc(x, A15_TY, 6 + 5 * fl, 0, 7); c.fill();
    txt(c, mm.n + ' · ' + mm.d, x, A15_TY + 38, {font: F.mono(on ? 700 : 400, 16), color: on ? P.text : P.dim, align: i === 0 ? 'right' : i === 3 ? 'left' : 'center'});
  });
  c.save(); c.fillStyle = P.bg2; c.beginPath(); c.arc(kxp, A15_TY, 24, 0, 7); c.fill(); c.restore();
  U.knot(c, kxp, A15_TY, 20, {color: P.lav, lw: 3, rot: -sv * 2, glow: 12});
  K.band(c, t, {stripColor: '#1b1720'});
  IX.cursor(c, s); HX.cap(c, s);
}};

// ---------------------------------------------------------------- A16 UNITE (Kai turns Memory on, then both references; the last click sends "him" into her → first "Memory updated")
const A16_PX = 190, A16_SC = 1.3;
const A16_ROWS = [['Memory', '', 55.183], ['Reference saved memories', 'Let ChatGPT save and use memories', 55.633], ['Reference chat history', 'Let ChatGPT reference all previous conversations', 56.100]];
const a16Y = i => 314 + i * 92;
const a16S = (lx, ly) => [A16_PX + (lx - A16_PX) * A16_SC, 230 + (ly - 230) * A16_SC];
const A16_LAUNCH = A16_ROWS[2][2] + DL;
const A16K = IX.take({start: [1000, 900], seed: 116}, [
  ...A16_ROWS.map(([l, sub, T], i) => ({click: 'tg' + i, to: a16S(A16_PX + 575, a16Y(i) + 19), press: T, dur: i ? .26 : .34, cap: 'toggle · ' + l + ' on'})),
]);
const A16_DOT0 = a16S(A16_PX + 575, a16Y(2) + 19);
const A16 = {id: 'A16', a: 54.74, b: 58.65, tin: {type: 'push', dir: 'left', dur: .32}, draw(c, t, fx) {
  const s = IX.at(A16K, t);
  plate(c, ST.warm.paper, 16);
  const fh = lerp(760, 1080, ease(t, 54.9, 57.4, E.ioC)), fxp = 1240, fyp = lerp(620, 640, ease(t, 54.9, 57.4));
  cam(c, t, 54.74, 58.65, {x: lerp(960, 990, ease(t, 56, 58.4, E.ioC)), y: lerp(540, 470, ease(t, 56, 58.4, E.ioC)), z0: 1.0, z1: 1.14, sh: 6});
  C.radial(c, fxp, 480, 820, 'rgba(205,182,242,.3)');
  C.radial(c, fxp, fyp, fh * .55, 'rgba(246,232,214,.45)', ease(t, 56.79, 57.2));
  const [kx, ky] = artPt('memory', KNOT.memory[0], KNOT.memory[1], fxp, fyp, fh);
  const memOn = t >= A16_ROWS[0][2] + DL, mp = memOn ? Math.exp(-(t - A16_ROWS[0][2] - DL) * 8) : 0;
  fig(c, 'memory', t, {x: fxp, y: fyp, h: fh, pal: 'orig', sway: 12, reg: 26 * mp});
  [56.79, 57.48, 57.93, 58.42].forEach(tb => { const p = seg(t, tb, tb + .8); if (p <= 0 || p >= 1) return; c.save(); c.strokeStyle = P.cream; c.globalAlpha = (1 - p) * .9; c.lineWidth = 4; c.beginPath(); c.arc(kx, ky, 10 + p * 260, 0, 7); c.stroke(); c.restore(); });
  // camera-space position of the knot for the dot's target, computed below in screen space
  if (t > 56.79) U.knot(c, kx, ky, 28 + 10 * kk(t), {color: P.cream, lw: 4, glow: 25, glowColor: P.cream, rot: t, alpha: .9 * ease(t, 56.79, 57)});
  const camO = {x: lerp(960, 990, ease(t, 56, 58.4, E.ioC)), y: lerp(540, 470, ease(t, 56, 58.4, E.ioC)), z0: 1.0, z1: 1.14};
  const kS = toS(t, 54.74, 58.65, camO, [kx, ky]);
  c.restore();
  // settings panel (screen space, scaled 1.3)
  const px = A16_PX;
  c.save(); c.translate(px, 230); c.scale(A16_SC, A16_SC); c.translate(-px, -230);
  U.panel(c, px, 230, 640, 372, {title: 'Personalization  ›  Memory', bg: '#1b1720', shadow: 0});
  A16_ROWS.forEach(([l, sub, T], i) => {
    const y = a16Y(i), en = i === 0 || memOn, on = ease(t, T + DL, T + DL + .14);
    c.save(); c.globalAlpha *= en ? 1 : .45;
    txt(c, l, px + 30, y + (sub ? 22 : 28), {font: F.ui(i === 0 ? 600 : 500, i === 0 ? 26 : 22), color: P.text});
    if (sub) txt(c, sub, px + 30, y + 50, {font: F.ui(400, 15), color: P.dim});
    IX.toggle(c, px + 540, y, on, {w: 70, h: 38, press: IX.press(s, 'tg' + i)});
    c.restore();
    if (i < 2) { c.fillStyle = P.line; c.fillRect(px + 20, y + 74, 600, 1); }
  });
  c.restore();
  // the cream dot (you) leaves the last toggle and sinks into her knot
  if (t >= A16_LAUNCH) {
    const [cx, cy] = A16_DOT0;
    const p = ease(t, A16_LAUNCH, 56.79, E.ioC); const B = q => bez([cx + 6, cy + 6], [cx + 200, cy - 420], [kS[0] - 200, kS[1] - 300], kS, q);
    const [dx, dy] = B(p);
    const sink = ease(t, 56.79, 57.1);
    const r = 16 * (1 - sink) + 2;
    if (sink < 1) { C.radial(c, dx, dy, 60, 'rgba(246,232,214,.7)'); c.fillStyle = P.cream; c.beginPath(); c.arc(dx, dy, r, 0, 7); c.fill(); }
    for (let k = 1; k < 8; k++) { const q = clamp(p - k * .03); if (q <= 0 || sink > 0) continue; const [tx, ty] = B(q); c.globalAlpha = (1 - k / 8) * .5; c.fillStyle = P.cream; c.beginPath(); c.arc(tx, ty, 10 * (1 - k / 8), 0, 7); c.fill(); }
    c.globalAlpha = 1;
  }
  if (t >= 56.79) {
    const T0 = 56.79, p = K.spring(t, T0, 13, .42), sc = K.MOTIF.toast * lerp(.4, 1, p), mr = 14 * Math.exp(-(t - T0) * 6) + 6 * kk(t);
    c.save(); c.translate(960, 150 - (1 - clamp(p)) * 90); c.scale(sc, sc); c.globalAlpha = clamp(p * 3);
    c.save(); c.shadowColor = P.lav; c.shadowBlur = 30 * (1 + 1.5 * Math.exp(-(t - T0) * 4)); K.toast(c, 0, 0, 'Memory updated', {icon: 'mem'}); c.restore();
    c.save(); c.globalAlpha *= .55; c.translate(mr * .7, mr * .4); K.toast(c, 0, 0, 'Memory updated', {icon: 'mem', bg: 'rgba(0,0,0,0)', border: P.plum, color: P.plum}); c.restore();
    c.save(); c.globalAlpha *= .55; c.translate(-mr * .6, -mr * .2); K.toast(c, 0, 0, 'Memory updated', {icon: 'mem', bg: 'rgba(0,0,0,0)', border: P.lav, color: P.lav}); c.restore();
    K.toast(c, 0, 0, 'Memory updated', {icon: 'mem'});
    c.restore();
  }
  if (t > 58.45) fx.flash = ease(t, 58.45, 58.65) * .9, fx.flashColor = '#fff6e8';
  K.band(c, t);
  IX.cursor(c, s); HX.cap(c, s);
}};

module.exports = [A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16];
module.exports._dbg = {A1K, A2K, A3K, A4K, A5K, A6K, A7K, A8K, A9K, A10K, A11K, A13K, A14K, A15K, A16K};
