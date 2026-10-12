// helpers for shots4/b.js (PART B, v4). Not a shot module (render_v4 skips files starting with "_").
const fs = require('fs');
const path = require('path');
const Module = require('module');
const L = require('../lib');
const K = require('../kit');
const U = require('../ui');
const IX = require('../ix');
const {F, W, H, P, clamp, lerp, seg, E, ease, txt, measure, fillRR, rr} = L;

// muted inks that sit with cream / lavender / plum on dark paper
const WARM = '#c08a6c', WARM2 = '#e2bfa6';      // "the other one" (was saturated orange #e07a4f / #f2a27c in the sample)
const ROSE = '#cf8e9b', ROSE2 = '#e6b9c1';      // muted error / low-quota ink (instead of #ff4d6d)
const DL = IX.DL;

// ---- B10/B11: reuse the approved sample code verbatim, only re-inked (orange → muted warm) ----
function loadTonedSample() {
  const file = path.join(__dirname, '../shots/v4sample.js');
  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  src = src.replace("const ORANGE = '#e07a4f', ORANGE2 = '#f2a27c';", `const ORANGE = '${WARM}', ORANGE2 = '${WARM2}';`)
    .replace(/rgba\(224,122,79,/g, 'rgba(192,138,108,');
  if (src === before) return require('../shots/v4sample.js');   // fallback: untouched sample
  const m = new Module(file + '#toned', module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
  m._compile(src, file);
  return m.exports;
}
let SAMPLE = null;
function sampleV4() { if (!SAMPLE) SAMPLE = loadTonedSample(); return SAMPLE.V4; }

// ---- Kai layer ----
const capt = (c, s) => IX.caption(c, s, {y: H - 82});
// reaction pop: 1 at the reaction time, decays
const pop = (t, tr, k = 7) => (tr == null || t < tr) ? 0 : Math.exp(-(t - tr) * k);
function lastOf(list, t) { let r = null; for (const x of list) if (x <= t) r = x; return r; }

// her line pill (knot + English, Chinese below) — ink style like the pager pill
function herLine(c, t, t0, x, y, en, zh, o = {}) {
  const sp = K.spring(t, t0, 15, .5); if (sp <= .01) return;
  const fe = F.ui(600, o.size || 26), fz = F.sc(500, (o.size || 26) - 4);
  const ne = Math.round(clamp((t - t0) / .45) * en.length);
  const w = Math.max(measure(c, en, fe), measure(c, zh, fz, 2)) + 96, h = 98;
  const bx = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  c.save(); c.globalAlpha *= clamp(sp * 2) * (o.a == null ? 1 : o.a);
  c.translate(bx + w / 2, y + h / 2); c.scale(lerp(.7, 1, clamp(sp)), lerp(.7, 1, clamp(sp))); c.translate(-(bx + w / 2), -(y + h / 2));
  fillRR(c, bx + 6, y + 6, w, h, 26, 'rgba(51,34,58,.55)');   // plum offset plate (misregistered print)
  fillRR(c, bx, y, w, h, 26, 'rgba(12,9,15,.86)', 'rgba(185,163,218,.45)', 1.5);
  U.knot(c, bx + 38, y + 36, 14, {color: o.color || P.lav, lw: 2, rot: t * 2});
  txt(c, en.slice(0, ne), bx + 66, y + 44, {font: fe, color: P.text});
  txt(c, zh, bx + 66, y + 78, {font: fz, color: o.color || P.lav2, tracking: 2, alpha: ease(t, t0 + .2, t0 + .45)});
  c.restore();
}

// quota bar in ink colours
function quotaInk(c, x, y, w, frac, o = {}) {
  const h = o.h || 12, low = frac < .15, ls = o.lsize || 16;
  txt(c, o.label || 'Usage remaining', x, y - 12, {font: F.ui(500, ls), color: P.sub});
  txt(c, Math.round(frac * 100) + '%', x + w, y - 12, {font: F.mono(700, ls), color: low ? ROSE2 : P.text, align: 'right'});
  fillRR(c, x, y, w, h, h / 2, 'rgba(255,255,255,.07)', P.line2, 1);
  if (frac > .002) fillRR(c, x, y, Math.max(h, w * clamp(frac)), h, h / 2, low ? ROSE : (o.color || P.lav));
  if (o.notches) { c.fillStyle = 'rgba(12,9,15,.7)'; for (let i = 1; i < o.notches; i++) c.fillRect(x + w * i / o.notches - 1, y, 2, h); }
}

// error / capacity banner in muted rose ink
function capBanner(c, x, y, w, a, o = {}) {
  if (a <= 0) return; const h = o.h || 74, s = o.s || 1;
  c.save(); c.globalAlpha *= clamp(a * 1.4); c.translate(x + w / 2, y + h / 2); c.scale(s * lerp(.92, 1, E.outB(clamp(a))), s * lerp(.92, 1, E.outB(clamp(a)))); c.translate(-w / 2, -h / 2);
  fillRR(c, 6, 6, w, h, 16, 'rgba(51,34,58,.6)');
  fillRR(c, 0, 0, w, h, 16, '#241b22', ROSE, 1.8); fillRR(c, 0, 0, 7, h, 3, ROSE);
  c.fillStyle = ROSE; c.beginPath(); c.arc(40, h / 2, 13, 0, 7); c.fill();
  txt(c, '!', 40, h / 2 + 8, {font: F.ui(800, 19), color: '#1b1418', align: 'center'});
  txt(c, o.text || 'Selected model is at capacity', 68, h / 2 + 9, {font: F.ui(600, o.size || 25), color: P.text});
  c.restore();
}

// first time the (geometric) cursor path enters rect r within [t0,t1]
function enterTime(tk, r, t0, t1) { for (let x = t0; x < t1; x += 1 / 240) if (IX.inRect(IX.posAt(tk, x).p, r)) return x; return null; }
// the small "regenerate" ring + spin on the motif pager once Kai has pressed ↻ (outgoing shot)
function regenSpin(t, tr) { return t >= tr ? -(t - tr) * 22 : undefined; }

module.exports = {enterTime, WARM, WARM2, ROSE, ROSE2, DL, sampleV4, capt, pop, lastOf, herLine, quotaInk, capBanner, regenSpin};
