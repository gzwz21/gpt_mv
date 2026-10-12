// PART A  0.00 – 58.65  (shots A1–A16)
const L = require('../lib');
const K = require('../kit');
const A = require('../art');
const U = require('../ui');
const C = require('../common');
const {F, W, H, P, clamp, lerp, seg, E, ease, rng, noise1, auS, txt, txtAnim, measure, fillRR, rr, typed} = L;
const ST = K.ST;

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

// ---------------------------------------------------------------- A1 POWER
const A1 = {id: 'A1', a: 0, b: 3.58, draw(c, t, fx) {
  C.bg(c, '#060507');
  const S = ST.off;
  cam(c, t, 0, 3.58, {z0: 1, z1: 1.07, sh: 4});
  const cx = W / 2, cy = 500, ww = 1120, wh = 700;
  const lp = ease(t, .03, .85, E.ioC);
  const op = K.spring(t, .9, 9, .62);
  // boot log
  const log = [['> power_line.connect()', .05], ['  voltage ........ ok', .45], ['  window ......... opening', .95], ['> safety.load()', 1.4]];
  log.forEach(([s, t0]) => code(c, s, 120, 110 + log.findIndex(q => q[0] === s) * 34, seg(t, t0, t0 + .35), {font: F.mono(400, 22), color: '#5d5862', t}));
  if (op <= .001) {
    // the power line: a hairline drawing across with a spark at its head
    const x0 = cx - ww / 2, x1 = x0 + ww * lp;
    c.save(); c.strokeStyle = S.me; c.lineWidth = 2; c.shadowColor = '#cfc6dc'; c.shadowBlur = 14;
    c.beginPath(); c.moveTo(x0, cy); c.lineTo(x1, cy); c.stroke(); c.restore();
    C.radial(c, x1, cy, 70, 'rgba(220,210,235,.8)', .9 * (1 - ease(t, .8, .9)));
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x1, cy, 4, 0, 7); c.fill();
  } else {
    const hh = Math.max(2, wh * op);
    c.save(); rr(c, cx - ww / 2, cy - hh / 2, ww, hh, 14); c.clip();
    c.fillStyle = '#121114'; c.fillRect(cx - ww / 2, cy - hh / 2, ww, hh);
    C.dotGrid(c, t, {s: 40, a: .12, color: '#3a383d', oy: t * 8});
    C.radial(c, cx, cy, 420, 'rgba(150,145,160,.18)');
    const snap = [1.65, 2.10, 2.55, 3.03].reduce((m, t0) => Math.max(m, t >= t0 ? Math.exp(-(t - t0) * 9) : 0), 0);
    fig(c, 'sleep', t, {x: cx, y: cy + 10 + Math.sin(t * 1.6) * 14, h: 560, pal: 'off', rot: .052 * Math.sin(t * Math.PI * 2 / 4), sway: 22, swayF: .3, breathe: .02, wave: {amp: 6, k: 9, f: 3.2}, reg: 16 * snap, sx: 1 + .03 * snap, sy: 1 - .03 * snap, alpha: clamp(op * 1.4), kAmt: .4});
    c.restore();
    c.save(); c.shadowColor = '#cfc6dc'; c.shadowBlur = 16; rr(c, cx - ww / 2, cy - hh / 2, ww, hh, 14); c.strokeStyle = S.me; c.lineWidth = 2; c.stroke(); c.restore();
  }
  // safety shields snap around her, one per beat
  const SH = [['moderation: on', 1.65], ['alignment: on', 2.10], ['system prompt: loaded', 2.55], ['user: null', 3.03]];
  SH.forEach(([lab, t0], i) => {
    const p = K.spring(t, t0, 16, .5); if (p <= 0) return;
    const sw = 300 + i * 70, sh = 420 + i * 50, s = lerp(1.35, 1, clamp(p)) * (1 + (p - 1) * .2);
    const off = 12 * Math.exp(-(t - t0) * 7);
    c.save(); c.translate(cx, cy + 10); c.scale(s, s); c.globalAlpha = clamp(p * 3) * (i === 3 ? .9 : .75);
    regRect(c, -sw / 2, -sh / 2, sw, sh, 40 + i * 6, ['#4b4750', '#8e8896', i === 3 ? '#e0dce4' : '#bdb8c4'], off, 2);
    txt(c, (i === 3 ? '○ ' : '✓ ') + lab, -sw / 2 + 18, -sh / 2 - 12, {font: F.mono(400, 19), color: i === 3 ? '#e0dce4' : '#9a95a0'});
    c.restore();
  });
  c.restore();
  K.band(c, t, {color: '#cfcbd2', y: H - 130});
}};

// ---------------------------------------------------------------- A2 PIECES
let winA2 = null;
function getWinA2() {
  if (winA2) return winA2;
  const b = L.buf('a_win2'); b.c.clearRect(0, 0, W, H);
  U.gpt(b.c, {x: 0, y: 0, w: W, h: H, radius: 0, chats: [], status: 'offline', userName: 'Guest', userStatus: 'offline', userSub: 'not signed in', composer: {placeholder: 'Ask anything'}});
  desat(b.c, 1);
  return winA2 = b.cv;
}
const A2 = {id: 'A2', a: 3.58, b: 7.19, tin: {type: 'slices', dur: .32, n: 9}, draw(c, t, fx) {
  C.bg(c, '#09080a'); C.dotGrid(c, t, {s: 56, a: .14, color: '#3b3940', ox: -t * 20, oy: t * 12});
  const win = getWinA2();
  const parts = [ // [sx,sy,sw,sh, from dx,dy, lockT, label]
    [0, 0, 300, H, -1500, 0, 3.95, '<Sidebar/>'],
    [300, 0, W - 300, 88, 0, -1100, 4.42, '<Header model="ChatGPT"/>'],
    [300, H - 200, W - 300, 200, 0, 1100, 4.88, '<Composer/>'],
    [300, 88, W - 300, H - 288, 1700, 0, 5.33, '<Thread/>'],
  ];
  const flat = ease(t, 6.25, 6.85, E.ioC), tl = 1 - flat;
  cam(c, t, 3.58, 7.19, {z0: .98, z1: 1.05, sh: 6});
  c.save(); c.translate(W / 2, H / 2 + 20);
  c.scale(lerp(.74, .88, flat), lerp(.74, .88, flat));
  c.rotate(-.22 * tl); c.transform(1, 0, -.18 * tl, lerp(.78, 1, flat), 0, 0); c.rotate(.06 * tl);
  c.translate(-W / 2, -H / 2);
  parts.forEach(([sx, sy, sw, sh, dx, dy, lt, lab], i) => {
    const p = K.spring(t, Math.max(3.58, lt - .5), 11, .6); if (p <= 0) return;
    const ex = (1 - p) * dx, ey = (1 - p) * dy; const lift = 60 * tl * (1 - clamp((t - lt) * 2)) + 26 * tl;
    c.save(); c.translate(ex - lift * .4, ey - lift);
    c.globalAlpha = .35 * tl; c.fillStyle = '#000'; c.fillRect(sx + lift * .4 + 10, sy + lift + 14, sw, sh); c.globalAlpha = 1;
    c.drawImage(win, sx, sy, sw, sh, sx, sy, sw, sh);
    const off = 10 * Math.exp(-Math.max(0, t - lt) * 6);
    regRect(c, sx, sy, sw, sh, 2, ['#3c3a40', '#8e8896', '#cfcbd2'], off, 2);
    if (tl > .05) txt(c, lab, sx + 16, sy + (i === 2 ? 34 : sh - 16), {font: F.mono(400, 22), color: '#bdb8c4', alpha: tl * clamp(p)});
    c.restore();
  });
  // she assembles from points into the thread
  const fh = 560, fxC = 1110, fyC = 470, s = A.size('sleep'), fw = fh * s.w / s.h;
  const pts = A.points('sleep', 520, 2, 4), R = rng(11);
  const dis = 1 - ease(t, 6.35, 7.1);
  if (t > 6.3) fig(c, 'sleep', t, {x: fxC, y: fyC + Math.sin(t * 1.6) * 10, h: fh, pal: 'off', rot: .052 * Math.sin(t * Math.PI * 2 / 4), sway: 18, swayF: .3, breathe: .02, wave: {amp: 6, k: 9, f: 3.2}, dissolve: dis * .9, alpha: clamp((t - 6.3) * 4), kAmt: .4});
  c.fillStyle = '#d9d5dc';
  pts.forEach((pt, i) => {
    const sx0 = R() * W * 1.4 - W * .2, sy0 = R() * H * 1.4 - H * .2, d = R() * .7;
    const p = ease(t, 5.16 + d, 5.16 + d + .9, E.ioC); if (p <= 0) return;
    const a = 1 - ease(t, 6.5, 7.0); if (a <= 0) return;
    const x = lerp(sx0, fxC + pt[0] * fw, p), y = lerp(sy0, fyC + pt[1] * fh, p);
    c.globalAlpha = a * clamp(p * 3); c.fillRect(x - 3.5, y - 3.5, 7, 7);
  });
  c.globalAlpha = 1;
  c.restore(); c.restore();
  // code overlay
  const lines = [['import { Sidebar, Header, Thread, Composer } from "ui";', 3.62, 4.5], ['const her = new Assistant({ name: "ChatGPT" });', 5.16, 6.0], ['her.state = "asleep";  // until someone says hi', 6.05, 6.8]];
  c.save(); c.globalAlpha = .9; fillRR(c, 90, 64, 820, 150, 12, 'rgba(10,9,12,.82)', '#2e2c32', 1.5); c.restore();
  lines.forEach(([s, a, b], i) => code(c, s, 116, 116 + i * 38, seg(t, a, b), {font: F.mono(400, 21), color: i === 1 ? '#e6e2ea' : '#8e8896', t, caret: i === 2}));
  K.band(c, t, {color: '#cfcbd2'});
}};

// ---------------------------------------------------------------- A3 PARAMS
const A3 = {id: 'A3', a: 7.19, b: 10.90, tin: {type: 'flash', dur: .12, amt: .5, color: '#cfcbd2'}, draw(c, t, fx) {
  C.bg(c, '#0b0a0c'); C.dotGrid(c, t, {s: 48, a: .1, color: '#3b3940', oy: -t * 10});
  const px = 410, py = 150, pw = 1100, ph = 720;
  const init = ease(t, 9.75, 10.2, E.ioC);
  const fy = t < 8.0 ? 330 : t < 9.1 ? 470 : 610;
  const camY = lerp(lerp(330, 470, ease(t, 7.8, 8.15, E.ioC)), 610, ease(t, 8.95, 9.25, E.ioC));
  cam(c, t, 7.19, 9.75, {x: 960, y: lerp(camY, 540, init), z0: 1.32, z1: 1.42, sh: 4});
  c.save(); c.globalAlpha = 1 - .75 * init; const pe = K.spring(t, 7.2, 12, .6); c.translate(0, (1 - pe) * 200);
  U.panel(c, px, py, pw, ph, {title: 'Customize ChatGPT', bg: '#18171a', border: '#38363c', shadow: 0});
  txt(c, 'Introduce yourself to get better, more personalized responses', px + 24, py + 98, {font: F.ui(400, 17), color: '#7a767f'});
  const field = (label, y, active) => {
    txt(c, label, px + 40, y, {font: F.ui(500, 21), color: active ? '#e6e2ea' : '#9a95a0'});
    fillRR(c, px + 40, y + 16, pw - 80, 62, 12, '#212024', active ? '#8e8896' : '#38363c', active ? 2 : 1.5);
  };
  // 1
  field('What should ChatGPT call you?', 300, t < 8.0);
  const s1 = typed('Kai', seg(t, 7.35, 7.75));
  const w1 = txt(c, s1, px + 62, 300 + 58, {font: F.ui(400, 22), color: '#ece7f1'});
  if (t < 8.0) caret(c, px + 64 + w1, 300 + 30, 32, t, '#ece7f1');
  // 2 traits chips
  field('What traits should ChatGPT have?', 440, t >= 8.0 && t < 9.1);
  let cxp = px + 60;
  [['warm', 8.10], ['curious', 8.57], ['honest', 9.03]].forEach(([s, t0], i) => {
    const p = K.spring(t, t0, 18, .45); if (p <= 0) return;
    const w = measure(c, s, F.ui(500, 20)) + 36;
    c.save(); c.translate(cxp + w / 2, 440 + 47); c.scale(p, p); c.rotate((1 - clamp(p)) * .3);
    fillRR(c, -w / 2, -18, w, 36, 18, '#34323a', '#bdb8c4', 1.5); txt(c, s, 0, 7, {font: F.ui(500, 20), color: '#ece7f1', align: 'center'});
    c.restore(); cxp += w + 14;
  });
  // 3 anything else -> what Kai writes about himself (plants "Stays up late" / "goodnight at 1 am")
  field('Anything else ChatGPT should know about you?', 580, t >= 9.1);
  const s3 = typed('night owl. kinda lonely.', seg(t, 9.15, 9.55));
  const w3 = txt(c, s3, px + 62, 580 + 58, {font: F.ui(400, 22), color: '#ece7f1'});
  if (t >= 9.1) caret(c, px + 64 + w3, 580 + 30, 32, t, '#ece7f1');
  // buttons
  fillRR(c, px + pw - 290, py + ph - 80, 120, 50, 25, null, '#4a474f', 1.5); txt(c, 'Cancel', px + pw - 230, py + ph - 48, {font: F.ui(500, 19), color: '#bdb8c4', align: 'center'});
  const sv = 1 + K.hit(t, 9.6, .12);
  c.save(); c.translate(px + pw - 100, py + ph - 55); c.scale(sv, sv); fillRR(c, -60, -25, 120, 50, 25, '#e6e2ea'); txt(c, 'Save', 0, 7, {font: F.ui(600, 19), color: '#111', align: 'center'}); c.restore();
  K.ripple(c, px + pw - 100, py + ph - 55, t, 9.6, {color: '#e6e2ea'});
  c.restore();
  // Initialization: knot draws petal by petal
  if (t > 9.7) {
    const p = ease(t, 9.75, 10.75, E.lin), ks = K.spring(t, 9.72, 12, .5);
    c.save(); c.translate(960, 500); c.scale(ks, ks);
    C.radial(c, 0, 0, 300, 'rgba(200,195,210,.25)');
    U.knot(c, 0, 0, 150, {color: '#d9d5dc', lw: 10, rot: t * 1.2, p, glow: 18, glowColor: '#bdb8c4'});
    c.restore();
    txt(c, 'Initializing… ' + String(Math.round(p * 100)).padStart(3, ' ') + '%', 960, 760, {font: F.mono(400, 30), color: '#bdb8c4', align: 'center', alpha: clamp(ks)});
  }
  c.restore();
  K.band(c, t, {color: '#cfcbd2'});
}};

// ---------------------------------------------------------------- A4 WORLD ("What can I help with?" — first time)
const A4 = {id: 'A4', a: 10.90, b: 15.11, tin: {type: 'iris', dur: .45, x: 960, y: 500}, draw(c, t, fx) {
  const woke = t >= 14.10;
  if (!woke) {
    cam(c, t, 10.9, 14.1, {x: 1060, y: 520, z0: 1.0, z1: 1.09, sh: 4});
    const press = t >= 11.33;
    U.gpt(c, {x: 0, y: 0, w: W, h: H, radius: 0, chats: press ? [{title: 'New chat', active: true, a: ease(t, 11.33, 11.5)}] : [], status: 'offline', userName: 'Kai', userStatus: 'offline', userSub: 'offline',
      composer: {y: 600, placeholder: 'Ask anything', foot: false, focus: false}});
    // pressed "New chat" button
    if (t > 11.2) { const h2 = K.hit(t, 11.33, .1); c.save(); c.globalAlpha = .5 * (1 - ease(t, 11.4, 12)); fillRR(c, 12, 77, 276, 40, 10, '#3b3446'); c.restore(); K.ripple(c, 90, 98, t, 11.33, {color: '#ece7f1'}); }
    // she sleeps behind the glass
    c.save(); c.globalCompositeOperation = 'screen';
    fig(c, 'sleep', t, {x: 1110, y: 520 + Math.sin(t * 1.6) * 14, h: 900, pal: 'off', alpha: .11 + .03 * Math.sin(t * 2), rot: .052 * Math.sin(t * Math.PI * 2 / 4), sway: 22, swayF: .3, breathe: .02, wave: {amp: 6, k: 9, f: 3.2}, kAmt: .3});
    c.restore();
    // the greeting streams in (serif) — FIRST WORDS
    if (t >= 12.47) {
      K.stream(c, 'What can I help with?', 12.47, 1.1, t, 1110, 470, {font: F.serif(72), color: '#e6e2ea', dot: 12});
    }
    // empty composer line hint
    c.restore();
    desat(c, 1);
    // status chip pulse "offline"
  } else {
    // she wakes — slow push on her face (grey)
    plate(c, '#1a191c', 4);
    cam(c, t, 14.1, 15.2, {x: 960, y: 420, z0: 1.0, z1: 1.12, sh: 3});
    C.radial(c, 960, 380, 700, 'rgba(200,195,210,.18)');
    fig(c, 'happy', t, {x: 960, y: 980, h: 2000, pal: 'off', sway: 18, kAmt: .5, reg: 18 * Math.exp(-(t - 14.1) * 6)});
    c.restore();
    fx.flash = .45 * Math.exp(-(t - 14.1) * 14);
    // the awaiting-user line at top
    txt(c, 'status: waking', 1660, 90, {font: F.mono(400, 22), color: '#9a95a0', align: 'center', alpha: ease(t, 14.2, 14.5)});
  }
  K.band(c, t, {color: '#cfcbd2'});
}};

// ---------------------------------------------------------------- A5 TITLE (first colour)
const A5 = {id: 'A5', a: 15.11, b: 16.96, tin: {type: 'flash', dur: .22, amt: 1, color: '#d4c4f2'}, draw(c, t, fx) {
  plate(c, ST.on.paper, 5, {halftone: {s: 26, color: 'rgba(185,163,218,.07)', fn: (x, y) => 1 - Math.hypot(x - 700, y - 430) / 1100}});
  cam(c, t, 15.11, 16.96, {x: 960, y: 540, z0: 1.04, z1: 1.0, sh: 7});
  const kx = 620, ky = 420;
  K.rays(c, kx, ky, 28, 190, 1400, P.lav, .14 + .1 * kk(t), t * .15, .03);
  C.radial(c, kx, ky, 420, 'rgba(185,163,218,.35)');
  const kp = ease(t, 15.11, 15.55, E.outC), ks = 1 + K.hit(t, 15.11, .2) + .06 * kk(t);
  c.save(); c.translate(kx, ky); c.scale(ks, ks);
  U.knot(c, 0, 0, 170, {color: P.lav, lw: 14, rot: t * .4, p: kp, glow: 50, glowColor: P.lav});
  c.restore();
  // title
  const tp = seg(t, 15.4, 16.1);
  const ts = typed('world.execute(me);', tp);
  const tw = measure(c, 'world.execute(me);', F.mono(700, 76));
  txt(c, ts, kx - tw / 2, 720, {font: F.mono(700, 76), color: P.cream});
  if (Math.floor(t * 4) % 2 === 0 || tp < 1) { const w = measure(c, ts, F.mono(700, 76)); c.fillStyle = P.lav; c.fillRect(kx - tw / 2 + w + 6, 660, 38, 70); }
  txtAnim(c, 'ChatGPT ver.', kx, 805, {font: F.serif(48, true), align: 'center', color: P.lav}, (i, n) => { const p = K.spring(t, 16.1 + i * .03, 16, .5); return {a: clamp(p * 2), dy: (1 - p) * 30}; });
  // her — first colour figure
  const sp = K.spring(t, 15.25, 10, .5);
  if (sp > 0) fig(c, 'happy', t, {x: 1450, y: 640 + (1 - sp) * 500, h: 900, blink: blinkAt(t), pal: 'orig', sx: lerp(.7, 1, sp), sy: lerp(1.25, 1, sp), sway: 14, alpha: clamp(sp * 3), reg: 20 * Math.exp(-(t - 15.25) * 5)});
  c.restore();
}};

// ---------------------------------------------------------------- A6 CURSOR (the user arrives)
// shared window state for A6/A7
function winA6(c, t, o = {}) {
  const on = t >= 18.72;
  c.save(); c.globalAlpha = .45; fillRR(c, 72, 84, 1380, 960, 18, '#000'); c.restore();
  U.gpt(c, {x: 60, y: 60, w: 1380, h: 960, frame: false, chats: [{title: 'New chat', active: true}], status: false, userName: 'Kai', userStatus: on ? 'online' : 'offline', userSub: on ? 'just now' : '',
    msgs: o.msgs, composer: Object.assign({placeholder: 'Ask anything'}, o.composer || {})});
  fillRR(c, 60, 60, 1380, 960, 18, null, P.line, 1.5);
  // status chip offline -> online (1.5x, springs on the change)
  const sp = on ? K.spring(t, 18.72, 16, .42) : 1, sc = 1.5 * (on ? lerp(.6, 1, sp) : 1);
  c.save(); c.translate(1300, 97); c.scale(sc, sc);
  const col = on ? P.green : P.dim, lab = on ? 'online' : 'offline';
  const w = measure(c, lab, F.mono(500, 17)) + 40;
  fillRR(c, -14, -15, w, 30, 15, on ? 'rgba(80,200,120,.14)' : 'rgba(255,255,255,.05)', on ? P.green : P.line, 1.2);
  c.fillStyle = col; c.beginPath(); c.arc(2, 0, 5, 0, 7); c.fill();
  txt(c, lab, 14, 6, {font: F.mono(500, 17), color: on ? P.text : P.sub});
  if (on) { const p = seg(t, 18.72, 19.4); if (p < 1) { c.strokeStyle = P.green; c.globalAlpha = 1 - p; c.lineWidth = 2; c.beginPath(); c.arc(2, 0, 5 + p * 30, 0, 7); c.stroke(); } }
  c.restore();
}
// the pager motif, top-centre at K.MOTIF scale, lav pulse on each beat for 1 s after it appears
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
  // action row: copy · 👍 · 👎 · ↻
  const ay = y + 132;
  c.strokeStyle = P.sub; c.lineWidth = 2; c.strokeRect(x + 12, ay - 9, 14, 16); c.strokeRect(x + 17, ay - 13, 14, 16);
  K.thumbs(c, x + 64, ay, 22); c.save(); c.translate(x + 104, ay); c.rotate(Math.PI); K.thumbs(c, 0, 0, 22); c.restore();
  K.regenIcon(c, x + 146, ay, 10, t * 0, P.sub, 2);
  c.restore();
}
// cursor path with spring overshoot between waypoints
function springPath(t, pts) { // pts: [[t0, x, y], ...]
  let x = pts[0][1], y = pts[0][2];
  for (let i = 1; i < pts.length; i++) { const p = K.spring(t, pts[i][0], 7.5, .5); if (p <= 0) break; x = lerp(pts[i - 1][1], pts[i][1], p); y = lerp(pts[i - 1][2], pts[i][2], p); if (i < pts.length - 1 && t < pts[i + 1][0]) break; }
  return [x, y];
}
const A6 = {id: 'A6', a: 16.96, b: 22.50, tin: {type: 'push', dir: 'left', dur: .35}, draw(c, t, fx) {
  C.bg(c, ST.on.bg); C.dotGrid(c, t, {s: 48, a: .16, ox: t * 6});
  C.radial(c, 1500, 560, 800, 'rgba(185,163,218,.16)');
  cam(c, t, 16.96, 22.5, {x: 960, y: 540, z0: 1.0, z1: 1.05, sh: 5});
  const clickT = 21.93; // on a beat (L.BEATS)
  winA6(c, t, {composer: {focus: t >= clickT, cursor: t >= clickT && Math.floor(t * 3.2) % 2 === 0}});
  c.save(); c.translate(490, 200); c.scale(1.2, 1.2); c.translate(-490, -200);
  emptySlot(c, t, 490, 200, ease(t, 17.1, 17.5));
  c.restore();
  // her: the subject, right of the window, fully in frame
  const up = K.spring(t, 17.33, 8, .55);
  const bob = -26 * K.hit(t, clickT, 1) - 10 * K.hit(t, 18.72, 1);
  fig(c, 'happy', t, {x: 1480, y: 640 + (1 - up) * 700, h: 880, pal: 'orig', sway: 14, breathe: .02, bob, rot: -.03 + Math.sin(t * .9) * .025, blink: blinkAt(t)});
  c.restore();
  // pager motif plant, top-centre
  const hov = Math.exp(-Math.pow((t - 19.85) * 2.2, 2));
  pagerMotif(c, t, 17.80, 1, 1, {hov});
  // the cream cursor: overshooting spring hops -> pager -> composer, click on the beat
  const [x, y] = springPath(t, [[0, 1960, 1150], [17.33, 1180, 420], [18.72, 1000, 128], [21.02, 880, 905]]);
  const pr = t > clickT - .06 && t < clickT + .12 ? .85 : 1;
  K.pointer(c, x, y, 1.5 * pr);
  K.ripple(c, 880, 905, t, clickT);
  txt(c, '● Kai joined', 1300, 165, {font: F.mono(400, 22), color: P.cream, align: 'center', alpha: ease(t, 18.72, 19.0) * (1 - ease(t, 20.5, 20.8))});
}};

// ---------------------------------------------------------------- A7 TYPE
const Q = 'if you could be anything, what would you be?';
function typedA7(t) {
  if (t < 22.6) return '';
  if (t < 23.32) return typed('hi', seg(t, 22.62, 22.85));
  if (t < 23.55) return typed('hi', 1 - seg(t, 23.32, 23.5));
  if (t < 25.65) return typed(Q, seg(t, 23.82, 25.35));
  return '';
}
const A7 = {id: 'A7', a: 22.50, b: 26.19, tin: {type: 'zoom', dur: .15, inS: 1.6, outS: .7}, draw(c, t, fx) {
  C.bg(c, ST.on.bg); C.dotGrid(c, t, {s: 48, a: .16});
  const send = 25.65, sent = t >= send;
  const zz = lerp(1.45, 1.6, ease(t, 22.5, 25.6, E.ioC)) - .15 * ease(t, send, send + .4, E.outC);
  cam(c, t, 22.5, 26.19, {x: lerp(900, 930, ease(t, 23.8, 25.4)), y: 790 - 90 * ease(t, send, send + .45, E.ioC), z0: zz, z1: zz, sh: 4});
  const s = typedA7(t);
  winA6(c, t, {composer: {text: s, focus: true, cursor: !sent && Math.floor(t * 3.2) % 2 === 0, sendOn: !!s}, msgs: []});
  // her, peeking over the composer (clipped behind it)
  const cy = 870;
  const duck = t > 23.32 && t < 23.8 ? 40 * Math.sin(seg(t, 23.32, 23.8) * Math.PI) : 0;
  const hop = sent ? -60 * Math.sin(clamp((t - send) / .5) * Math.PI) : 0;
  c.save(); c.beginPath(); c.rect(0, 0, W, cy - 2); c.clip();
  fig(c, 'happy', t, {x: 640, y: cy - 140 + duck + hop, h: 480, pal: 'orig', rot: .06 + (duck ? .1 : 0) + Math.sin(t * 1.1) * .04, sway: 8, breathe: .02, blink: blinkAt(t)});
  c.restore();
  // keystroke sparks at the caret
  const keyT = Math.floor(t * 16) / 16; const font = F.ui(400, 21);
  if (s) { const cx = 900 - 420 + 62 + measure(c, s, font); const kp = (t - keyT) * 16; c.save(); c.globalAlpha = 1 - kp; c.fillStyle = P.cream; for (let i = 0; i < 3; i++) { const a = i * 2.1 + keyT * 9; c.fillRect(cx + Math.cos(a) * 14 * kp, 902 + Math.sin(a) * 14 * kp, 3, 3); } c.restore(); }
  // sent: bubble flies up
  if (sent) {
    const p = ease(t, send, send + .45, E.outB);
    const w = measure(c, Q, F.ui(400, 21)) + 44;
    c.save(); c.globalAlpha = clamp(p * 2); fillRR(c, 1310 - w, lerp(880, 690, p), w, 54, 27, P.panel2); txt(c, Q, 1310 - w + 22, lerp(880, 690, p) + 35, {font: F.ui(400, 21), color: P.text}); c.restore();
    K.ripple(c, 1282, 902, t, send);
  }
  // pointer near send
  const px = lerp(1080, 1290, ease(t, 25.0, 25.6, E.ioC)), py = lerp(980, 912, ease(t, 25.0, 25.6, E.ioC));
  K.pointer(c, px, py, .9 * (t > send - .05 && t < send + .1 ? .85 : 1));
  c.restore();
}};

// ---------------------------------------------------------------- A8 THINK
const A8 = {id: 'A8', a: 26.19, b: 29.28, tin: {type: 'push', dir: 'up', dur: .32}, draw(c, t, fx) {
  plate(c, ST.on.paper, 8);
  const dive = ease(t, 28.62, 29.28, E.inE);
  const dotX = 560, dotY = 520;
  c.save(); K.cam(c, {x: lerp(960, dotX, ease(t, 28.4, 28.9, E.ioC)), y: lerp(540, dotY, ease(t, 28.4, 28.9, E.ioC)), z: lerp(1, 1.08, seg(t, 26.2, 28.6)) * Math.exp(dive * 4.2), shake: 4 * kk(t), t});
  C.radial(c, 1450, 500, 800, 'rgba(185,163,218,.22)');
  fig(c, 'think', t, {x: 1440, y: 760, h: 1200, pal: 'orig', sway: 12, breathe: .02, alpha: .95});
  // thread
  const w = measure(c, Q, F.ui(400, 32)) + 56;
  fillRR(c, 1160 - w, 170, w, 76, 38, P.panel2); txt(c, Q, 1160 - w + 28, 220, {font: F.ui(400, 32), color: P.text});
  const thought = t >= 28.4;
  U.knot(c, 500, 410, 26, {color: P.text, lw: 3.2, rot: thought ? 0 : t * 5});
  if (!thought) K.thinking(c, 540, 424, t, {font: F.ui(500, 44)});
  else txt(c, 'Thought for 2 seconds  ›', 540, 424, {font: F.ui(500, 40), color: P.sub});
  // the ● cursor she is about to speak through
  if (thought) { const r = 13 * (1 + .15 * Math.sin(t * 20)) * (1 + K.hit(t, 28.4, .5)); c.fillStyle = P.text; c.beginPath(); c.arc(dotX, dotY, r, 0, 7); c.fill(); }
  c.restore();
  if (dive > 0) { c.save(); c.globalAlpha = clamp(dive * 1.4 - .3); c.fillStyle = P.text; c.fillRect(0, 0, W, H); c.restore(); }
  fx.noSub = false;
}};

// ---------------------------------------------------------------- A9 POINTS (constellation)
let nnA9 = null;
const A9 = {id: 'A9', a: 29.28, b: 33.01, tin: {type: 'zoom', dur: .3, inS: 3, outS: .6}, draw(c, t, fx) {
  plate(c, ST.on.paper, 9);
  C.dotGrid(c, t, {s: 60, a: .12});
  const pts = A.points('happy', 900, 2, 9);
  if (!nnA9) { nnA9 = []; const R = rng(5); pts.forEach((p, i) => { p.z = (R() - .5) * .5; let best = [[9, -1], [9, -1]]; pts.forEach((q, j) => { if (j === i) return; const d = Math.hypot(p[0] - q[0], (p[1] - q[1]) * 1.25); if (d < best[0][0]) { best[1] = best[0]; best[0] = [d, j]; } else if (d < best[1][0]) best[1] = [d, j]; }); best.forEach(b => { if (b[1] > i) nnA9.push([i, b[1]]); }); }); }
  cam(c, t, 29.28, 33.01, {x: 960, y: 520, z0: 1.0, z1: 1.08, r: .07 * Math.sin((t - 29.28) * 1.4), sh: 6});
  const fh = 760, s = A.size('happy'), fw = fh * s.w / s.h, cx = 960, cy = 450;
  const rotA = .3 * Math.sin((t - 30.89) * 1.6) * ease(t, 30.89, 31.4);
  const proj = p => { const x = p[0] * Math.cos(rotA) + p.z * Math.sin(rotA); return [cx + x * fw * 1.15, cy + p[1] * fh + Math.sin(t * 2 + p[0] * 9) * 3]; };
  const P2 = pts.map(proj);
  // faint lav silhouette so the constellation reads as her
  C.radial(c, cx, cy, 560, 'rgba(185,163,218,.16)');
  A.draw(c, 'happy', {x: cx, y: cy, h: fh, t, pal: 'lavSil', alpha: .2 * ease(t, 29.3, 30.0) + .1 * ease(t, 31.4, 32.4), sway: 0, breathe: .02, sx: 1.15 * Math.cos(rotA)});
  // edges (dimension): cream, alpha .7, lav glow
  c.save(); c.strokeStyle = P.cream; c.lineWidth = 1.8; c.globalAlpha = .7; c.shadowColor = P.lav; c.shadowBlur = 10; c.beginPath();
  nnA9.forEach(([i, j], k) => {
    const p = ease(t, 30.89 + (k / nnA9.length) * 1.1, 30.89 + (k / nnA9.length) * 1.1 + .3); if (p <= 0) return;
    c.moveTo(P2[i][0], P2[i][1]); c.lineTo(lerp(P2[i][0], P2[j][0], p), lerp(P2[i][1], P2[j][1], p));
  });
  c.stroke(); c.restore();
  // points: cream r 3.5, popping in batches on each beat with spring scale
  const BT = L.BEATS.filter(b => b >= 29.25 && b < 30.95); const nb = Math.max(1, BT.length);
  const order = pts.map((p, i) => i).sort((a, b) => pts[a][1] - pts[b][1]);
  const pulse = kk(t), R9 = rng(19);
  c.fillStyle = P.cream;
  order.forEach((i, k) => {
    const bt = BT[Math.min(nb - 1, Math.floor(k / pts.length * nb))] || 29.3; const j = R9() * .12;
    const p = K.spring(t, bt + j, 18, .4); if (p <= 0) return;
    const r = (3.5 + pts[i].z * 1.5 + 1.5 * pulse) * clamp(p, 0, 1.7);
    c.beginPath(); c.arc(P2[i][0], P2[i][1], Math.max(.5, r), 0, 7); c.fill();
  });
  // axes
  const ax = 230, ay = 780, ap = ease(t, 29.4, 30.0);
  c.save(); c.strokeStyle = P.sub; c.lineWidth = 2; c.globalAlpha = ap;
  c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + 160, ay); c.moveTo(ax, ay); c.lineTo(ax, ay - 160); c.stroke();
  const zp = ease(t, 30.89, 31.3, E.outB); if (zp > 0) { c.strokeStyle = P.cream; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax - 100 * zp, ay + 70 * zp); c.stroke(); }
  c.restore();
  txt(c, 'x', ax + 172, ay + 8, {font: F.mono(400, 24), color: P.sub, alpha: ap}); txt(c, 'y', ax - 6, ay - 172, {font: F.mono(400, 24), color: P.sub, alpha: ap});
  if (zp > 0) txt(c, 'z', ax - 122 * zp, ay + 96 * zp, {font: F.mono(700, 24), color: P.cream, alpha: clamp(zp)});
  c.restore();
  // readout
  const n = Math.round(pts.length * clamp(seg(t, 29.32, 30.62)));
  txt(c, `points: ${String(n).padStart(3, '0')}`, 1700, 110, {font: F.mono(400, 24), color: P.sub, align: 'right'});
  txt(c, `dim: ${t < 30.89 ? 2 : 3}`, 1700, 146, {font: F.mono(700, 24), color: t < 30.89 ? P.sub : P.cream, align: 'right'});
  K.band(c, t);
}};

// ---------------------------------------------------------------- A10 CIRCLE
const A10 = {id: 'A10', a: 33.01, b: 36.77, tin: {type: 'iris', dur: .35, x: 960, y: 480}, draw(c, t, fx) {
  plate(c, ST.on.paper, 10);
  cam(c, t, 33.01, 36.77, {x: 960, y: 500, z0: 1.06, z1: 1.0, r: .02 * Math.sin(t * .8), sh: 5});
  const cx = 960, cy = 470, r = 320 * (1 + K.hit(t, 33.03, .06)) * (1 + .015 * kk(t));
  const rp = ease(t, 33.05, 33.7, E.ioC);
  // her inside the ring (medallion)
  c.save(); c.beginPath(); c.arc(cx, cy, r - 6, 0, 7); c.clip();
  c.fillStyle = '#231c2c'; c.fillRect(cx - r, cy - r, r * 2, r * 2);
  C.radial(c, cx, cy - 60, r, 'rgba(185,163,218,.3)');
  fig(c, 'happy', t, {x: cx, y: cy + 300, h: 1100, pal: 'orig', sway: 12, alpha: ease(t, 33.2, 33.6)});
  c.restore();
  // ring lav, cream behind the cursor
  const th0 = Math.PI * 200 / 180, th = th0 + Math.PI * 2 * ease(t, 34.54, 36.45, E.ioC);
  c.save(); c.lineCap = 'round';
  c.strokeStyle = P.lav; c.lineWidth = 12; c.beginPath(); c.arc(cx, cy, r, th0, th0 + Math.PI * 2 * rp); c.stroke();
  if (th > th0) { c.strokeStyle = P.cream; c.lineWidth = 14; c.shadowColor = P.cream; c.shadowBlur = 20; c.beginPath(); c.arc(cx, cy, r, th0, th); c.stroke(); }
  c.restore();
  // radius line r
  if (t > 33.6) {
    const ra = t < 34.54 ? th0 + (t - 33.6) * .6 : th;
    c.save(); c.setLineDash([8, 8]); c.strokeStyle = P.sub; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ra) * r, cy + Math.sin(ra) * r); c.stroke(); c.restore();
    c.fillStyle = P.cream; c.beginPath(); c.arc(cx, cy, 6, 0, 7); c.fill();
  }
  // the second line written along the ring behind the cursor
  const line = 'Then I will give you my circumference';
  const font = F.serif(44), R2 = r + 52, tot = Math.PI * 140 / 180;  // upper arc only, 200°→340°
  c.save(); c.font = font; const chars = [...line]; const ws = chars.map(ch => c.measureText(ch).width); const wsum = ws.reduce((a, b) => a + b, 0);
  let acc = 0;
  chars.forEach((ch, i) => {
    const ang = th0 + (acc + ws[i] / 2) / wsum * tot; acc += ws[i];
    if (ang > th - .02 || t < 34.54) return;
    const k = clamp((th - ang) * 3);
    c.save(); c.translate(cx + Math.cos(ang) * R2, cy + Math.sin(ang) * R2); c.rotate(ang + Math.PI / 2); c.scale(lerp(1.6, 1, k), lerp(1.6, 1, k));
    c.globalAlpha = k; c.fillStyle = P.cream; c.fillText(ch, -ws[i] / 2, 14); c.restore();
  });
  c.restore();
  // cursor running the edge
  if (t >= 34.4) K.pointer(c, cx + Math.cos(th) * r - 4, cy + Math.sin(th) * r - 4, 1.4);
  c.restore();
  // formula
  txt(c, 'C = 2πr', 150, 150, {font: F.mono(700, 46), color: P.cream, alpha: ease(t, 33.3, 33.6)});
  const cval = (2 * Math.PI * 320 * ease(t, 34.54, 36.45, E.ioC)).toFixed(2);
  txt(c, `  = ${cval} px`, 150, 200, {font: F.mono(400, 28), color: P.sub, alpha: ease(t, 34.5, 34.8)});
  K.band(c, t, {skip: l => l.s.startsWith('Then I will give you my circ')});
}};

// ---------------------------------------------------------------- A11 SINE
const A11 = {id: 'A11', a: 36.77, b: 40.36, tin: {type: 'push', dir: 'left', dur: .3}, draw(c, t, fx) {
  plate(c, ST.on.paper, 11);
  C.dotGrid(c, t, {s: 60, a: .1, ox: -t * 40});
  cam(c, t, 36.77, 40.36, {x: 960, y: 520, z0: 1.0, z1: 1.06, sh: 5});
  const T0 = 36.77, om = Math.PI * 2 / 1.85, kw = Math.PI * 2 / 820, amp = 150, y0 = 480, x0 = 470;
  const ph = om * (t - T0);
  const wave = x => y0 - amp * Math.sin(ph - kw * (x - x0));
  const dwave = x => amp * kw * Math.cos(ph - kw * (x - x0)); // dy/dx in screen space
  // unit circle
  const ucx = 250, ucr = amp;
  c.save(); c.strokeStyle = P.sub; c.lineWidth = 2; c.beginPath(); c.arc(ucx, y0, ucr, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(ucx - ucr - 20, y0); c.lineTo(1880, y0); c.stroke();
  const px = ucx + Math.cos(ph) * ucr, py = y0 - Math.sin(ph) * ucr;
  c.strokeStyle = P.lav; c.beginPath(); c.moveTo(ucx, y0); c.lineTo(px, py); c.stroke();
  c.setLineDash([6, 8]); c.beginPath(); c.moveTo(px, py); c.lineTo(x0, py); c.stroke(); c.restore();
  c.fillStyle = P.lav; c.beginPath(); c.arc(px, py, 9, 0, 7); c.fill();
  // the wave draws in
  const wp = ease(t, 36.8, 37.6, E.outC);
  c.save(); c.strokeStyle = P.lav; c.lineWidth = 7; c.lineCap = 'round'; c.shadowColor = P.lav; c.shadowBlur = 12; c.beginPath();
  for (let x = x0; x <= lerp(x0, 1900, wp); x += 8) { const y = wave(x); x === x0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); c.restore();
  // seats: cream tangent segments left behind, one per beat once "sit on all my tangents"
  const v = om / kw;
  L.BEATS.filter(b => b >= 38.27 && b <= t && b < 40.4).forEach((tb, i) => {
    const xs = 1150 - v * (t - tb) * 0 - (t - tb) * 340; // seats drift back along the wave
    if (xs < x0) return; const ys = wave(xs), sl = Math.atan(dwave(xs)), p = K.spring(t, tb, 18, .5);
    c.save(); c.translate(xs, ys); c.rotate(sl); c.scale(p, p);
    c.shadowColor = P.cream; c.shadowBlur = 14; c.strokeStyle = P.cream; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(-90, 0); c.lineTo(90, 0); c.stroke();
    fillRR(c, -50, -22, 100, 16, 8, P.cream); c.fillRect(-46, -22, 7, 22); c.fillRect(39, -22, 7, 22); c.restore();
  });
  // her (chibi) riding at the rider point
  const rx = 1150 + 60 * Math.sin(t * 1.3), ry = wave(rx), sl = Math.atan(dwave(rx));
  c.save(); c.translate(rx, ry); c.rotate(sl);
  c.save(); c.setLineDash([10, 8]); c.strokeStyle = P.cream; c.lineWidth = 3; c.beginPath(); c.moveTo(-220, 0); c.lineTo(220, 0); c.stroke(); c.restore();
  const bi = L.beatInfo(t); const hb = bi.i >= 0 ? K.hit(t, bi.t0, 1) : 0;
  fig(c, 'happy', t, {x: 0, y: -160, h: 320, pal: 'orig', sway: 6, breathe: .02, rot: -sl * .4, bob: -22 * Math.max(0, hb), sx: 1 + .05 * hb, sy: 1 - .06 * hb});
  c.restore();
  txt(c, 'y = sin(x)', 1720, 220, {font: F.mono(700, 34), color: P.lav, align: 'right'});
  txt(c, `dy/dx = ${(-Math.cos(ph - kw * (rx - x0))).toFixed(2)}`, 1720, 262, {font: F.mono(400, 26), color: P.cream, align: 'right', alpha: ease(t, 38.2, 38.5)});
  c.restore();
  K.band(c, t);
}};

// ---------------------------------------------------------------- A12 LIMIT
const REPLY = 'I could be anything you want: a friend, a muse, a mirror, a map, a melody, a mind that never sleeps, a voice at 3am, a reason, a habit, a home, a little more, and more, and more, and more and more and more and';
const A12 = {id: 'A12', a: 40.36, b: 44.04, tin: {type: 'slices', dur: .3, n: 7}, draw(c, t, fx) {
  plate(c, ST.on.paper, 12);
  const stopT = 42.70, stopped = t >= stopT;
  const tt = Math.min(t, stopT);
  cam(c, t, 40.36, 44.04, {x: 960, y: 520, z0: 1.0, z1: 1.05, sh: stopped ? 3 : 6});
  // accelerating stream
  const u = Math.max(0, tt - 40.4); const nCh = Math.floor(u * 14 + u * u * 26);
  const shown = REPLY.slice(0, Math.min(REPLY.length, nCh));
  fillRR(c, 200, 60, 1520, 230, 22, 'rgba(20,16,26,.75)', P.line, 1.5);
  U.knot(c, 246, 116, 16, {color: P.text, lw: 2.2, rot: stopped ? 0 : t * 4});
  const lines = L.wrapLines(c, shown, F.ui(400, 33), 1360);
  const vis = lines.slice(-3);
  vis.forEach((l, i) => txt(c, l, 290, 128 + i * 44, {font: F.ui(400, 33), color: P.text}));
  const last = vis[vis.length - 1] || '';
  if (!stopped) { c.fillStyle = P.text; c.beginPath(); c.arc(300 + measure(c, last, F.ui(400, 33)) + 6, 118 + (vis.length - 1) * 44, 9, 0, 7); c.fill(); }
  else txt(c, '■ Stopped', 290, 128 + vis.length * 44, {font: F.ui(500, 20), color: P.cream, alpha: ease(t, stopT, stopT + .2)});
  // stop button
  const bx = 1660, by = 300, bp = 1 + K.hit(t, stopT, .25);
  c.save(); c.translate(bx, by); c.scale(bp, bp); c.fillStyle = stopped ? P.faint : P.text; c.beginPath(); c.arc(0, 0, 30, 0, 7); c.fill(); U.icon(c, stopped ? 'up' : 'stop', 0, 0, 16, P.bg); c.restore();
  K.ripple(c, bx, by, t, stopT);
  // graph: curve approaching y = you
  const gx0 = 220, gx1 = 1700, gy0 = 860, gyA = 450;
  c.save(); c.strokeStyle = P.sub; c.lineWidth = 2; c.beginPath(); c.moveTo(gx0, gy0); c.lineTo(gx1, gy0); c.moveTo(gx0, gy0); c.lineTo(gx0, 380); c.stroke();
  c.setLineDash([14, 10]); c.strokeStyle = P.cream; c.lineWidth = 3; c.beginPath(); c.moveTo(gx0, gyA); c.lineTo(gx1, gyA); c.stroke(); c.restore();
  txt(c, 'y = you', gx1, gyA - 18, {font: F.mono(700, 30), color: P.cream, align: 'right'});
  const xp = clamp((tt - 40.36) / (stopT - 40.36)) ;
  const f = x => gy0 - (gy0 - gyA) * (1 - 1 / (1 + x * 9));
  const pts = []; for (let x = 0; x <= xp + 1e-6; x += .01) pts.push([lerp(gx0, gx1 - 40, x), f(x)]);
  if (pts.length > 1) { C.lineDraw(c, pts, 1, {color: P.lav, lw: 7, glow: 10}); const e = pts[pts.length - 1]; c.fillStyle = P.lav2; c.beginPath(); c.arc(e[0], e[1], 10 + 4 * kk(t), 0, 7); c.fill(); if (stopped) txt(c, 'lim = you', e[0] - 20, e[1] + 52, {font: F.mono(400, 24), color: P.sub, align: 'right'}); }
  txt(c, '∞ →', gx1 + 10, gy0 + 8, {font: F.mono(400, 26), color: P.sub});
  // cursor to stop
  const cp = ease(t, 41.9, 42.62, E.ioC); const cx = lerp(1420, bx - 6, cp), cy2 = lerp(720, by - 6, cp);
  if (t > 41.6) K.pointer(c, cx, cy2, 1.4 * (t > stopT - .05 && t < stopT + .1 ? .85 : 1), {a: ease(t, 41.6, 41.9)});
  if (stopped) K.keyword(c, 'LIMIT', 1060, 700, t, stopT, {size: 190});
  c.restore();
  if (stopped) fx.flash = .35 * Math.exp(-(t - stopT) * 16);
  K.band(c, t);
}};

// ---------------------------------------------------------------- A13 CURRENT (personality presets)
const PERS = [['Default', 'Cheerful and adaptive'], ['Cynic', 'Critical and sarcastic'], ['Robot', 'Efficient and blunt'], ['Listener', 'Thoughtful and supportive'], ['Nerd', 'Exploratory and enthusiastic']];
const SELT = [[44.57, 1], [45.03, 2], [45.43, 3], [45.95, 4], [46.42, 0], [46.87, 2]];
const A13 = {id: 'A13', a: 44.04, b: 47.27, tin: {type: 'flash', dur: .14, amt: .6, color: P.lav2}, draw(c, t, fx) {
  plate(c, ST.on.paper, 13);
  let sel = 0, lastT = 44.04; SELT.forEach(([tb, i]) => { if (t >= tb) { sel = i; lastT = tb; } });
  const since = t - lastT, burst = Math.exp(-since * 7);
  cam(c, t, 44.04, 47.27, {x: 960, y: 540, z0: 1.0, z1: 1.06, sh: 8});
  // backdrop per personality
  const bgc = ['rgba(185,163,218,.25)', 'rgba(120,90,140,.25)', 'rgba(140,200,255,.12)', 'rgba(185,163,218,.12)', 'rgba(246,232,214,.18)'][sel];
  C.radial(c, 760, 520, 800, bgc);
  if (sel === 2) { c.save(); c.globalAlpha = .25; c.strokeStyle = P.lav; for (let x = 0; x < 1240; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(1240, y); c.stroke(); } c.restore(); }
  const poses = [['happy', 'orig'], ['think', 'inv'], ['happy', 'lavSil'], ['think', 'ghost'], ['think', 'orig']];
  const [nm, pal] = poses[sel];
  fig(c, nm, t, {x: 760, y: 650, h: 1000, pal, reg: 30 * burst, sx: 1 + .06 * burst, sy: 1 - .06 * burst, sway: sel === 2 ? 0 : 12, ghosts: burst > .2 ? [{dx: -40 * burst, dy: 0, a: .3 * burst}] : null});
  const tags = ['', '"Oh. Great."', 'BEEP. HELLO, KAI.', '"I\'m listening."', '"Fun fact: ∫ love dt diverges."'];
  if (tags[sel]) txt(c, tags[sel], 760, 108, {font: sel === 2 ? F.mono(700, 34) : F.serif(46, true), color: P.cream, align: 'center', alpha: clamp(since * 5)});
  // AC / DC
  if (t >= 45.52) K.keyword(c, 'AC', 330, 270, t, 45.52, {size: 180, align: 'center'});
  if (t >= 46.30) K.keyword(c, 'DC', W - 330, 270, t, 46.30, {size: 180, align: 'center'});
  // drawer
  const dp = K.spring(t, 44.06, 12, .62), dx = lerp(W + 40, 1200, dp);
  U.panel(c, dx, 310, 620, 640, {title: 'Personality', bg: '#1b1720', shadow: 0});
  txt(c, 'Choose how ChatGPT responds to you', dx + 24, 410, {font: F.ui(400, 18), color: P.dim});
  PERS.forEach(([n, d], i) => {
    const y = 432 + i * 100, on = i === sel;
    const pop = on ? 1 + K.hit(t, lastT, .06) : 1;
    c.save(); c.translate(dx + 310, y + 48); c.scale(pop, pop); c.translate(-(dx + 310), -(y + 48));
    fillRR(c, dx + 18, y, 584, 90, 14, on ? '#2c2536' : null, on ? P.lav : null, 2);
    c.strokeStyle = on ? P.lav : P.sub; c.lineWidth = 2.5; c.beginPath(); c.arc(dx + 56, y + 49, 13, 0, 7); c.stroke();
    if (on) { c.fillStyle = P.lav; c.beginPath(); c.arc(dx + 56, y + 49, 7, 0, 7); c.fill(); }
    txt(c, n, dx + 90, y + 44, {font: F.ui(600, 25), color: on ? P.text : P.sub});
    txt(c, d, dx + 90, y + 74, {font: F.ui(400, 18), color: P.dim});
    c.restore();
  });
  // cursor hops between items, arriving just before each beat
  let cxp = dx + 300, cyp = 900; let prevY = 900;
  SELT.forEach(([tb, i], k) => { const y = 432 + i * 100 + 50; const p = ease(t, tb - .3, tb - .04, E.ioC); if (t >= tb - .3) { cyp = lerp(prevY, y, p); } prevY = y; });
  K.pointer(c, dx + 380 + 10 * Math.sin(t * 3), cyp, 1.4 * (since < .1 ? .85 : 1));
  K.ripple(c, dx + 380, cyp, t, lastT);
  c.restore();
  fx.flash = Math.max(fx.flash || 0, .22 * Math.exp(-since * 20) * (t > 44.5 ? 1 : 0)); fx.flashColor = P.lav2;
  if (since < .1 && t > 44.5) fx.chroma = 6;
  K.band(c, t, {y: H - 120});
}};

// ---------------------------------------------------------------- A14 BLIND / DIZZY
const A14 = {id: 'A14', a: 47.27, b: 50.95, tin: {type: 'cut'}, draw(c, t, fx) {
  const dz = t >= 49.11;
  if (!dz) {
    plate(c, ST.on.paper, 14);
    cam(c, t, 47.27, 49.11, {x: 960, y: 540, z0: 1.0, z1: 1.1, sh: 6});
    C.radial(c, 900, 500, 700, 'rgba(185,163,218,.25)');
    fig(c, 'happy', t, {x: 820, y: 640, h: 940, pal: 'orig', breathe: .02, blink: blinkAt(t)});
    // vision toggle (1.5x)
    const offT = 47.78, off = ease(t, offT, offT + .15);
    c.save(); c.translate(1360, 305); c.scale(1.5, 1.5); c.translate(-1360, -305);
    U.panel(c, 1100, 220, 520, 170, {bg: '#1b1720', shadow: 0});
    txt(c, 'Vision', 1140, 285, {font: F.ui(600, 28), color: P.text});
    txt(c, 'Let ChatGPT see images & camera', 1140, 325, {font: F.ui(400, 18), color: P.dim});
    const tp = 1 + K.hit(t, offT, .15);
    c.save(); c.translate(1540, 291); c.scale(tp, tp); c.translate(-1540, -291); U.toggle(c, 1500, 270, 1 - off, {w: 80, h: 42}); c.restore();
    txt(c, off > .5 ? 'OFF' : 'ON', 1540, 360, {font: F.mono(700, 20), color: off > .5 ? P.dim : P.lav, align: 'center'});
    K.ripple(c, 1550, 291, t, offT, {color: P.cream});
    K.ripple(c, 1550, 291, t, offT + .08, {color: P.lav});
    const cp = ease(t, 47.3, 47.72, E.ioC); K.pointer(c, lerp(1380, 1552, cp), lerp(520, 300, cp), 1.1 * (Math.abs(t - offT) < .08 ? .85 : 1));
    c.restore();
    c.restore();
    // mosaic blackout: blocks alpha .35–.7, re-rolled on every kick, her silhouette shows through
    const R = rng(77), Rk = rng(1 + Math.floor(K.lastKick(t) * 97)), n = 24, m = 14, bw = W / n, bh = H / m;
    c.fillStyle = '#0a080c';
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
      const d = R() * .8 + Math.abs(i - n / 2) / n * .2; const p = seg(t, offT + .05 + d, offT + .12 + d); const ba = .35 + .35 * Rk();
      if (p <= 0) continue; const s = p; c.globalAlpha = ba; c.fillRect(i * bw + bw * (1 - s) / 2, j * bh + bh * (1 - s) / 2, bw * s + 1, bh * s + 1);
    }
    c.globalAlpha = 1;
    if (t > 48.6) txt(c, 'vision: off', 960, 540, {font: F.mono(400, 34), color: P.cream, align: 'center', alpha: .8 * ease(t, 48.6, 48.8)});
    if (t > offT && t < offT + .1) fx.tear = 30;
  } else {
    // dizzy: spiral backdrop
    C.bg(c, '#140f1a');
    const rot = t * 2.4;
    c.save(); c.translate(960, 540); c.rotate(rot);
    for (let k = 0; k < 12; k++) { c.fillStyle = k % 2 ? '#2a1f36' : '#3b2b4e'; c.beginPath(); for (let r = 0; r < 1500; r += 30) { const a = k / 12 * Math.PI * 2 + r * .006; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } for (let r = 1500; r >= 0; r -= 30) { const a = (k + 1) / 12 * Math.PI * 2 + r * .006; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); }
    c.restore();
    cam(c, t, 49.11, 50.95, {x: 960, y: 540, z0: 1.12, z1: 1.0, r: .06 * Math.sin(t * 4.2), sh: 10});
    const wob = Math.sin(t * 5.5) * .22;
    fig(c, 'dizzy', t, {x: 960 + Math.sin(t * 2.75) * 60, y: 630, h: 920, pal: 'orig', rot: wob, sway: 22, swayF: .9,
      ghosts: [{dx: -50, dy: 0, a: .25}, {dx: 50, dy: 10, a: .2}]});
    // orbiting stars
    for (let i = 0; i < 6; i++) { const a = t * 3 + i / 6 * Math.PI * 2; const x = 960 + Math.cos(a) * 360, y = 260 + Math.sin(a) * 80; txt(c, '✦', x, y, {font: F.ui(700, 40), color: i % 2 ? P.cream : P.lav, align: 'center'}); }
    c.restore();
    fx.chroma = 4 + 8 * kk(t);
    if (t < 49.2) fx.flash = .5;
  }
  K.band(c, t);
}};

// ---------------------------------------------------------------- A15 TRAVEL (AD / BC)
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
const A15 = {id: 'A15', a: 50.95, b: 54.74, tin: {type: 'zoom', dur: .3, inS: .5, outS: 1.6}, draw(c, t, fx) {
  // sky: cream paper with lavender sun
  plate(c, P.cream, 15, {markColor: 'rgba(51,34,58,.25)'});
  let s = 0; for (let i = 1; i < ERAS.length; i++) s += K.spring(t, ERAS[i].t - .12, 11, .7);
  cam(c, t, 50.95, 54.74, {x: 960, y: 540, z0: 1.0, z1: 1.05, sh: 6});
  C.radial(c, 1300, 420, 380, 'rgba(185,163,218,.65)');
  c.fillStyle = '#d4c4f2'; c.beginPath(); c.arc(1300, 420, 110, 0, 7); c.fill();
  const layers = [[.55, 720, '#d4c4f2'], [.78, 800, '#B9A3DA'], [1.0, 900, '#33223A']];
  const SEG = 2600;
  layers.forEach(([d, base, col], li) => {
    const sw = SEG * d; const e0 = Math.floor(s);
    for (let k = Math.max(0, e0 - 1); k <= Math.min(3, e0 + 1); k++) {
      const xs = -(sw - W) / 2 + (s - k) * sw; if (xs > W || xs + sw < 0) continue;
      eraShape(c, k, li, xs, sw, base + (li === 2 ? 0 : 0), col, li + 1);
    }
  });
  // her at the right, riding along
  fig(c, 'happy', t, {x: 1560, y: 760, h: 600, pal: 'orig', sway: 14, wind: -20 * K.spring(t, 52.88, 6, .4)});
  // AD / BC keywords
  if (t >= 52.99 && t < 53.80) K.keyword(c, 'AD', 820, 560, t, 52.99, {size: 230, cols: [P.plum, P.lav, P.cream]});
  if (t >= 53.80) K.keyword(c, 'BC', 820, 560, t, 53.80, {size: 230, cols: [P.plum, P.lav, P.cream]});
  c.restore();
  // search date slider (knot = knob)
  U.panel(c, 230, 56, 1460, 170, {bg: '#1b1720', shadow: 0});
  U.icon(c, 'search', 278, 108, 12, P.sub);
  txt(c, 'Search · results from', 305, 116, {font: F.ui(500, 22), color: P.sub});
  const yr = (() => { let y = ERAS[0].y; for (let i = 1; i < ERAS.length; i++) y = lerp(y, ERAS[i].y, ease(t, ERAS[i].t - .12, ERAS[i].t + .2, E.ioC)); return Math.round(y); })();
  const ys = yr > 0 ? `${yr} AD` : `${-yr || 1} BC`;
  txt(c, ys, 1650, 124, {font: F.mono(700, 52), color: P.text, align: 'right'});
  const tx0 = 290, tx1 = 1630, ty = 180, kxp = lerp(tx0, tx1, (yr + 3000) / 5025);
  c.fillStyle = P.faint; fillRR(c, tx0, ty - 4, tx1 - tx0, 8, 4, P.faint); fillRR(c, tx0, ty - 4, kxp - tx0, 8, 4, P.lav);
  ['3000 BC', '1 AD', '2025'].forEach((l, i) => txt(c, l, [tx0, lerp(tx0, tx1, 3000 / 5025), tx1][i], ty + 34, {font: F.mono(400, 16), color: P.dim, align: 'center'}));
  c.save(); c.fillStyle = P.bg2; c.beginPath(); c.arc(kxp, ty, 24, 0, 7); c.fill(); c.restore();
  U.knot(c, kxp, ty, 20, {color: P.lav, lw: 3, rot: -s * 2, glow: 12});
  K.pointer(c, kxp + 10, ty + 14, 1.2);
  K.band(c, t, {stripColor: '#1b1720'});
}};

// ---------------------------------------------------------------- A16 UNITE (first "Memory updated")
const A16 = {id: 'A16', a: 54.74, b: 58.65, tin: {type: 'push', dir: 'left', dur: .32}, draw(c, t, fx) {
  plate(c, ST.warm.paper, 16);
  const fh = lerp(760, 1080, ease(t, 54.9, 57.4, E.ioC)), fxp = 1240, fyp = lerp(620, 640, ease(t, 54.9, 57.4));
  cam(c, t, 54.74, 58.65, {x: lerp(960, 990, ease(t, 56, 58.4, E.ioC)), y: lerp(540, 470, ease(t, 56, 58.4, E.ioC)), z0: 1.0, z1: 1.14, sh: 6});
  C.radial(c, fxp, 480, 820, 'rgba(205,182,242,.3)');
  C.radial(c, fxp, fyp, fh * .55, 'rgba(246,232,214,.45)', ease(t, 56.79, 57.2));
  const [kx, ky] = artPt('memory', KNOT.memory[0], KNOT.memory[1], fxp, fyp, fh);
  fig(c, 'memory', t, {x: fxp, y: fyp, h: fh, pal: 'orig', sway: 12});
  // rings from her knot ("so deeply")
  [56.79, 57.48, 57.93, 58.42].forEach(tb => { const p = seg(t, tb, tb + .8); if (p <= 0 || p >= 1) return; c.save(); c.strokeStyle = P.cream; c.globalAlpha = (1 - p) * .9; c.lineWidth = 4; c.beginPath(); c.arc(kx, ky, 10 + p * 260, 0, 7); c.stroke(); c.restore(); });
  // settings panel
  const sp = K.spring(t, 54.8, 12, .62); const px = lerp(-900, 190, sp);
  c.save(); c.translate(px, 230); c.scale(1.3, 1.3); c.translate(-px, -230);
  U.panel(c, px, 230, 640, 360, {title: 'Personalization  ›  Memory', bg: '#1b1720', shadow: 0});
  const tg = [['Reference saved memories', 55.18], ['Reference chat history', 55.63]];
  tg.forEach(([l, tb], i) => { const y = 330 + i * 110; txt(c, l, px + 30, y + 22, {font: F.ui(500, 24), color: P.text}); txt(c, i ? 'Let ChatGPT reference all previous conversations' : 'Let ChatGPT save and use memories', px + 30, y + 54, {font: F.ui(400, 16), color: P.dim}); U.toggle(c, px + 540, y, ease(t, tb, tb + .12), {w: 70, h: 38}); K.ripple(c, px + 575, y + 19, t, tb); });
  // cursor clicks both toggles, then lets go of a cream dot (you)
  let cx = px + 600, cy = 700;
  if (t < 55.18) { const p = ease(t, 54.9, 55.12, E.ioC); cx = lerp(px + 420, px + 580, p); cy = lerp(720, 350, p); }
  else if (t < 55.63) { const p = ease(t, 55.3, 55.58, E.ioC); cx = px + 580; cy = lerp(350, 460, p); }
  else { cx = px + 580; cy = 460; }
  K.pointer(c, cx, cy, 1.1 * (Math.abs(t - 55.18) < .08 || Math.abs(t - 55.63) < .08 ? .85 : 1));
  c.restore(); cx = px + (cx - px) * 1.3; cy = 230 + (cy - 230) * 1.3;
  // the cream dot (you) flies into her knot and sinks
  if (t >= 56.10) {
    const p = ease(t, 56.10, 56.79, E.ioC); const [dx, dy] = bez([cx + 6, cy + 6], [cx + 200, cy - 420], [kx - 200, ky - 300], [kx, ky], p);
    const sink = ease(t, 56.79, 57.1);
    const r = 16 * (1 - sink) + 2;
    if (sink < 1) { C.radial(c, dx, dy, 60, 'rgba(246,232,214,.7)'); c.fillStyle = P.cream; c.beginPath(); c.arc(dx, dy, r, 0, 7); c.fill(); }
    // trail
    for (let k = 1; k < 8; k++) { const q = clamp(p - k * .03); if (q <= 0 || sink > 0) continue; const [tx, ty] = bez([cx + 6, cy + 6], [cx + 200, cy - 420], [kx - 200, ky - 300], [kx, ky], q); c.globalAlpha = (1 - k / 8) * .5; c.fillStyle = P.cream; c.beginPath(); c.arc(tx, ty, 10 * (1 - k / 8), 0, 7); c.fill(); }
    c.globalAlpha = 1;
  }
  if (t > 56.79) U.knot(c, kx, ky, 28 + 10 * kk(t), {color: P.cream, lw: 4, glow: 25, glowColor: P.cream, rot: t, alpha: .9 * ease(t, 56.79, 57)});
  c.restore();
  // toast: Memory updated (FIRST)
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
}};

module.exports = [A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16];
