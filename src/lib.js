// Core helpers for the world.execute(me) ChatGPT MV renderer
const {createCanvas, loadImage, registerFont} = require('canvas');
const fs = require('fs');
const path = require('path');
const D = __dirname;

// ---------- fonts ----------
for (const f of fs.readdirSync(D + '/fonts')) {
  if (!f.endsWith('.ttf')) continue;
  const fam = f.replace('.ttf', '');
  if (fam.startsWith('DMSerifDisplay')) {
    registerFont(D + '/fonts/' + f, {family: 'DMSerif', style: fam.includes('Italic') ? 'italic' : 'normal'});
  } else registerFont(D + '/fonts/' + f, {family: fam});
}
// font shorthands: F.ui(600, 32) -> "32px Inter600"
const F = {
  ui: (w, s) => `${s}px Inter${w}, NotoSC${w >= 600 ? 700 : 500}`,
  mono: (w, s) => `${s}px JBM${w >= 600 ? 700 : 400}, NotoSC500`,
  serif: (s, it) => `${it ? 'italic ' : ''}${s}px DMSerif, NotoSerifSC500`,
  sc: (w, s) => `${s}px NotoSC${w}`,
  scSerif: (w, s) => `${s}px NotoSerifSC${w}`,
  disp: (w, s) => `${s}px Unbounded${w}, NotoSC900`,
};

const W = 1920, H = 1080;

// ---------- palette ----------
const P = {
  bg: '#0c0a0f', bg2: '#141118', panel: '#1b1720', panel2: '#221d29', line: '#2e2836', line2: '#3b3446',
  text: '#ece7f1', sub: '#a59db0', dim: '#6b6377', faint: '#3f3849',
  lav: '#b9a3e0', lav2: '#d4c4f2', lavDeep: '#7d63b4', cream: '#f6e8d6', plum: '#36243c',
  red: '#ff4d6d', red2: '#ff8fa3', green: '#5fd39a', white: '#ffffff',
};

// ---------- math ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  lin: t => t,
  inQ: t => t * t, outQ: t => 1 - (1 - t) * (1 - t),
  inC: t => t * t * t, outC: t => 1 - Math.pow(1 - t, 3),
  ioC: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outE: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inE: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  ioE: t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outB: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outEl: t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI) / 3) + 1,
};
const ease = (t, a, b, fn = E.outC) => fn(seg(t, a, b));
function rng(seed) { let s = seed >>> 0; return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };

// ---------- audio ----------
const AU = JSON.parse(fs.readFileSync(D + '/assets/audio.json'));
const au = (k, t) => { const i = clamp(Math.round(t * 60), 0, AU[k].length - 1); return AU[k][i] || 0; };
const auS = (k, t, n = 3) => { let s = 0; for (let i = -n; i <= n; i++) s += au(k, t + i / 60); return s / (2 * n + 1); };
const BEATS = AU.beats;
function beatInfo(t) {
  let lo = 0, hi = BEATS.length - 1;
  if (t < BEATS[0]) return {i: -1, dt: 99, ph: 0};
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (BEATS[m] <= t) lo = m; else hi = m - 1; }
  const next = BEATS[lo + 1] || BEATS[lo] + .4645;
  return {i: lo, dt: t - BEATS[lo], ph: (t - BEATS[lo]) / (next - BEATS[lo]), t0: BEATS[lo]};
}
const pulse = (t, k = 7) => Math.exp(-beatInfo(t).dt * k);

// ---------- lyrics ----------
const LRC = fs.readFileSync(D + '/assets/synced.lrc', 'utf8').split('\n').map(l => {
  const m = l.match(/\[(\d+):(\d+\.\d+)\]\s?(.*)/); if (!m) return null;
  return {t: +m[1] * 60 + +m[2], s: m[3].trim()};
}).filter(Boolean);
LRC.forEach((l, i) => l.e = LRC[i + 1] ? LRC[i + 1].t : l.t + 3);

// ---------- drawing helpers ----------
function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function fillRR(c, x, y, w, h, r, fill, stroke, lw = 1) {
  rr(c, x, y, w, h, r);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}
// text with tracking (letter spacing in px), returns width
function txt(c, s, x, y, o = {}) {
  c.save();
  c.font = o.font || F.ui(400, 24);
  c.fillStyle = o.color || P.text;
  c.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
  c.textBaseline = o.base || 'alphabetic';
  if (o.glow) { c.shadowColor = o.glowColor || o.color || P.lav; c.shadowBlur = o.glow; }
  const tr = o.tracking || 0;
  let w;
  if (!tr) {
    w = c.measureText(s).width;
    const ax = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.lw || 2; c.strokeText(s, ax, y); }
    if (!o.noFill) c.fillText(s, ax, y);
  } else {
    const chars = [...s]; const ws = chars.map(ch => c.measureText(ch).width);
    w = ws.reduce((a, b) => a + b, 0) + tr * (chars.length - 1);
    let ax = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    chars.forEach((ch, i) => {
      if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.lw || 2; c.strokeText(ch, ax, y); }
      if (!o.noFill) c.fillText(ch, ax, y); ax += ws[i] + tr;
    });
  }
  c.restore();
  return w;
}
function measure(c, s, font, tr = 0) { c.save(); c.font = font; const w = c.measureText(s).width + tr * Math.max(0, [...s].length - 1); c.restore(); return w; }
// per-character animated text: fn(i,n) => {dx,dy,a,s,rot,color}
function txtAnim(c, s, x, y, o, fn) {
  c.save(); c.font = o.font; c.textBaseline = o.base || 'alphabetic';
  const chars = [...s]; const tr = o.tracking || 0; const ws = chars.map(ch => c.measureText(ch).width);
  const w = ws.reduce((a, b) => a + b, 0) + tr * (chars.length - 1);
  let ax = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  chars.forEach((ch, i) => {
    const r = fn(i, chars.length) || {};
    const a = r.a == null ? 1 : r.a;
    if (a > 0.003) {
      c.save(); c.globalAlpha *= a;
      c.translate(ax + ws[i] / 2 + (r.dx || 0), y + (r.dy || 0));
      if (r.rot) c.rotate(r.rot); if (r.s != null) c.scale(r.s, r.s);
      c.fillStyle = r.color || o.color || P.text;
      if (o.glow || r.glow) { c.shadowColor = r.glowColor || o.glowColor || c.fillStyle; c.shadowBlur = r.glow || o.glow; }
      if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.lw || 2; c.strokeText(ch, -ws[i] / 2, 0); }
      if (!o.noFill) c.fillText(ch, -ws[i] / 2, 0);
      c.restore();
    }
    ax += ws[i] + tr;
  });
  c.restore(); return w;
}
const typed = (s, p) => { const ch = [...s]; return ch.slice(0, Math.round(clamp(p) * ch.length)).join(''); };
function wrapLines(c, s, font, maxW) {
  c.save(); c.font = font; const words = s.split(' '); const out = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur); c.restore(); return out;
}

// ---------- images ----------
const IMG = {};
async function loadAssets() {
  for (const f of fs.readdirSync(D + '/art')) if (f.endsWith('.png')) IMG[f.replace('.png', '')] = await loadImage(D + '/art/' + f);
}
// draw character: name e.g. 'reach', pal e.g. 'orig'; (cx, bottomY) with height h
function drawChar(c, name, pal, cx, cy, h, o = {}) {
  const im = IMG[name + '_' + pal]; if (!im) throw new Error('no img ' + name + '_' + pal);
  const w = h * im.width / im.height;
  c.save(); c.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
  if (o.comp) c.globalCompositeOperation = o.comp;
  if (o.shadow) { c.shadowColor = o.shadowColor || P.lav; c.shadowBlur = o.shadow; }
  if (o.slices) {
    // horizontal glitch slices
    const n = o.slices.n || 24, R = rng(o.slices.seed || 1), amt = o.slices.amt || 40;
    for (let i = 0; i < n; i++) {
      const y0 = i / n, y1 = (i + 1) / n; const off = (R() < o.slices.p ? (R() - .5) * 2 * amt : 0);
      c.drawImage(im, 0, y0 * im.height, im.width, (y1 - y0) * im.height, cx - w / 2 + off, cy - h / 2 + y0 * h, w, (y1 - y0) * h + 1);
    }
  } else if (o.reveal != null) {
    // reveal from top (0..1)
    const r = clamp(o.reveal);
    if (r > 0) c.drawImage(im, 0, 0, im.width, im.height * r, cx - w / 2, cy - h / 2, w, h * r);
  } else c.drawImage(im, cx - w / 2, cy - h / 2, w, h);
  c.restore();
  return w;
}

// ---------- off-screen buffers ----------
const bufs = {};
function buf(name, w = W, h = H) { if (!bufs[name]) { const cv = createCanvas(w, h); bufs[name] = {cv, c: cv.getContext('2d')}; } return bufs[name]; }

module.exports = {createCanvas, F, W, H, P, clamp, lerp, seg, E, ease, rng, hash, noise1, au, auS, beatInfo, pulse, BEATS, LRC,
  rr, fillRR, txt, measure, txtAnim, typed, wrapLines, IMG, loadAssets, drawChar, buf};
