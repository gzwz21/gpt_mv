// PART B v4  58.65 – 125.33  (B1–B16). Based on shots/b.js (v2.1) + STORY4 PART B.
// Rule 1: Kai's cursor (ix.js) is always on screen; every change in her / the scene lands IX.DL (80 ms) after a Kai action pressed on a beat/kick.
// Rule 2: lore strings per STORY4 / research. B10+B11 = the approved v4 sample (re-inked: muted warm instead of orange).
const L = require('../lib');
const A = require('../art');
const K = require('../kit');
const U = require('../ui');
const C = require('../common');
const {F, W, H, P, clamp, lerp, seg, E, ease, rng, noise1, au, auS, beatInfo, BEATS, txt, txtAnim, measure, fillRR, rr, typed, createCanvas} = L;
const mix = A.mixHex;
const IX = require('../ix');
const HB = require('./_b_helpers');
const {WARM, WARM2, ROSE, ROSE2, DL, capt, pop, lastOf, herLine, quotaInk, capBanner} = HB;

// ------------------------------------------------------------------ colour state
// warm through ~103 s, then drain to grey as the user leaves
const drain = t => ease(t, 103.6, 117.6, E.ioC);
function stMix(a, b, p) { const o = {}; for (const k in K.ST[a]) o[k] = mix(K.ST[a][k], K.ST[b][k], clamp(p)); return o; }
const S = t => stMix('warm', 'off', drain(t));
const ink = t => A.inkMix(A.inkMix('bright', 'orig', seg(t, 72, 74)), 'off', drain(t));
const PL = {cream: '#F5E9D6', lav: '#B9A3DA', plum: '#33223A', paperC: '#EFE3CF', deep: '#1c1222'};

// ------------------------------------------------------------------ motion helpers
const bi = t => beatInfo(t);
// hop between beats: lands on every beat (or every n-th), returns {bob, sx, sy}
function bounce(t, amp, sq = .1, every = 1) {
  const b = bi(t); let ph = clamp(b.ph), dt = b.dt;
  if (every > 1) { const k = ((b.i % every) + every) % every; ph = (k + ph) / every; dt = dt + k * .4645; }
  const air = Math.sin(Math.PI * ph);
  const land = Math.exp(-dt * 14) * Math.cos(dt * 26);
  const sy = 1 - sq * land + sq * .45 * air * (ph < .5 ? 1 : .3);
  return {bob: -amp * air, sx: 1 / Math.sqrt(Math.max(.5, sy)), sy};
}
// figure with defaults: idle time, ink palette, misregistration on kicks; squash anchored at feet
function fig(c, name, t, o = {}) {
  const h = o.h || 900, sy = o.sy || 1;
  const kr = o.reg == null ? 12 * K.kick(t) : o.reg;
  const oo = Object.assign({t, pal: ink(t), regSeed: Math.floor(K.lastKick(t) * 10) + 3}, o);
  oo.reg = kr; oo.h = h; oo.bob = (o.bob || 0) + (o.anchor === false ? 0 : (1 - sy) * h / 2);
  return A.draw(c, name, oo);
}
// camera push + kick shake. call between save/restore
function cam(c, t, a, b, o = {}) {
  const p = ease(t, a, b, E.ioC);
  K.cam(c, {x: o.x == null ? W / 2 : o.x, y: o.y == null ? H / 2 : o.y, z: lerp(o.z0 || 1, o.z1 || 1.07, p) * (1 + (o.kz == null ? .012 : o.kz) * K.kick(t)),
    r: (o.r || 0) * Math.sin(t * .5), shake: (o.shake == null ? 7 : o.shake) * K.kick(t, 12), t, seed: o.seed || 3});
}
// cached composited thumbnails for grids
const TH = new Map();
function thumb(name, pal, h) {
  const key = name + pal.join() + h; let cv = TH.get(key); if (cv) return cv;
  const r = A.compose(name, {pal}); const w = Math.round(h * r.w / r.h);
  cv = createCanvas(w, h); cv.getContext('2d').drawImage(r.cv, r.pad, r.pad, r.w, r.h, 0, 0, w, h); TH.set(key, cv); return cv;
}
// cream user bubble (right aligned at x)
function ubub(c, x, y, s, a = 1, o = {}) {
  const font = o.font || F.ui(500, 30); const w = measure(c, s, font) + 60, h = o.h || 68;
  c.save(); c.globalAlpha *= a; c.translate(x - w / 2, y + h / 2); c.scale(o.s || 1, o.s || 1); c.translate(-(x - w / 2), -(y + h / 2));
  fillRR(c, x - w, y, w, h, h / 2, o.bg || PL.cream);
  txt(c, s, x - w + 30, y + h / 2 + 11, {font, color: o.color || PL.plum}); c.restore(); return w;
}
// ---- PAGER MOTIF: ↻ + ‹ n / of › pill, always top-centre at K.MOTIF.pager scale; odometer roll from→to at tr
const PG = {s: K.MOTIF.pager, y: K.MOTIF.pagerY}, PGX = W / 2 - 118 * K.MOTIF.pager; // PGX,PG.y = the ↻ (regen origin)
const REGEN = (seed) => ({type: 'regen', dur: .4, x: PGX, y: K.MOTIF.pagerY, seed});
function pagerM(c, t, o = {}) {
  const x = W / 2, y = PG.y, sp = o.enter == null ? 1 : K.spring(t, o.enter, 15, .42);
  if (sp <= 0) return;
  c.save(); c.translate(x, y);
  const pulse = o.tr != null ? K.hit(t, o.tr, .1) : 0;
  const s = PG.s * lerp(.5, 1, sp) * (1 + pulse + (o.beatPulse ? .04 * Math.exp(-bi(t).dt * 8) : 0)); c.scale(s, s);
  c.globalAlpha *= clamp(sp * 3);
  fillRR(c, -170, -34, 340, 68, 34, o.bg || 'rgba(12,9,15,.86)', o.border || 'rgba(255,255,255,.18)', 1.5);
  const spin = o.spin != null ? o.spin : o.tr != null ? -(1 - ease(t, o.tr - .25, o.tr + .5)) * Math.PI * 4 * (t > o.tr - .25 ? 1 : 0) : 0;
  K.regenIcon(c, -118, 0, 15, spin, o.col || P.text, 3);
  txt(c, '‹', -54, 9, {font: F.ui(500, 26), color: P.sub, align: 'center'});
  txt(c, '›', 126, 9, {font: F.ui(500, 26), color: P.sub, align: 'center'});
  const q = o.tr == null ? 1 : ease(t, o.tr, o.tr + .26, E.outB);
  c.save(); c.beginPath(); c.rect(-34, -26, 140, 52); c.clip();
  const font = F.ui(600, 26);
  if (q < 1 && o.from) txt(c, o.from, 36, 10 - q * 46, {font, color: P.text, align: 'center', alpha: 1 - q});
  txt(c, o.to, 36, 10 + (1 - q) * 46, {font, color: o.numColor || P.text, align: 'center'});
  c.restore();
  if (o.tr != null && t > o.tr && t < o.tr + .35) { // lav flash ring on the roll
    const k = seg(t, o.tr, o.tr + .35); c.strokeStyle = PL.lav; c.globalAlpha *= 1 - k; c.lineWidth = 3; rr(c, -170 - 14 * k, -34 - 14 * k, 340 + 28 * k, 68 + 28 * k, 34 + 14 * k); c.stroke();
  }
  c.restore();
}
// regen-form pill: n-1 → n rolled at tr (default: the regen wave midpoint, a + .2)
function hud(c, t, tr, n, of, o = {}) { pagerM(c, t, Object.assign({from: `${n - 1} / ${of}`, to: `${n} / ${of}`, tr}, o)); }
// the cream cursor flies to the pager ↻ and clicks it at tc (ends the regen shots)
function regenClick(c, t, tc, o = {}) {
  const x = PGX, y = PG.y;
  const p = ease(t, tc - .55, tc - .05, E.ioC); if (p <= 0) return;
  const sx = lerp(o.fromX || W * .8, x + 4, p), sy = lerp(o.fromY || H * .7, y + 4, p) - Math.sin(p * Math.PI) * 120;
  const press = t > tc - .05 && t < tc + .12 ? .85 : 1;
  K.pointer(c, sx, sy, 1.7 * press);
  K.ripple(c, x, y, t, tc, {color: PL.cream});
}
// ---- beat liveliness: squash .88→1.08 on every beat, 20px bob, ±4° lean alternating
function beatPose(t, o = {}) {
  const b = bi(t), dt = b.i < 0 ? 9 : b.dt, A = o.sq || .12;
  const sy = 1 - A * Math.exp(-dt * 2.4) * Math.cos(dt * 16);
  const side = (b.i % 2) ? 1 : -1, ln = (o.lean == null ? .07 : o.lean) * lerp(-side, side, K.spring(t, b.t0 || 0, 18, .45));
  return {sy, sx: 2 - sy, bob: -(o.bob == null ? 20 : o.bob) * Math.sin(Math.PI * clamp(b.ph)), rot: ln};
}
// parabolic hop beat→beat with landing squash, stretch in the air
function hop(t, amp, o = {}) {
  const b = bi(t), ph = clamp(b.ph), dt = b.dt, air = 4 * ph * (1 - ph);
  const land = Math.exp(-dt * 16) * Math.cos(dt * 30);
  const sy = 1 - .26 * land + .12 * air;
  return {bob: -amp * air, sy, sx: 1 / Math.sqrt(Math.max(.5, sy)), air, i: b.i, ph};
}
// sparkles + hearts burst on each kick around a point
function kickBurst(c, t, cx, cy, r, cols, o = {}) {
  const lk = K.lastKick(t), age = t - lk; if (age < 0 || age > .6) return;
  const R = rng(Math.floor(lk * 100) + 7), n = o.n || 8;
  for (let i = 0; i < n; i++) {
    const a = R() * 6.283, d = r * (.75 + R() * .4) + age * (260 + R() * 200), sz = (o.size || 26) * (.6 + R() * .6) * K.spring(t, lk, 22, .4) * (1 - age / .6);
    const x = cx + Math.cos(a) * d * 1.1, y = cy + Math.sin(a) * d * .85 - age * 60; const col = cols[i % cols.length];
    if (i % 3 === 2 && o.hearts !== false) heart(c, x, y, sz / 16, col, 1); else spark(c, x, y, sz, col, age * 4 + a);
  }
}
// keyword in negative space (no strip): lav/cream offset inks + misreg; width clamped to maxW
function kw(c, t, t0, s, x, y, o = {}) {
  if (t < t0 - .02) return; const size = fitSize(c, s, o.maxW || W - 240, o.size || 200);
  K.keyword(c, s, x, y, t, t0, {size, cols: o.cols || [PL.cream, PL.lav, '#7d63b4'], reg: o.reg == null ? 18 : o.reg, stagger: o.stagger == null ? .03 : o.stagger, align: o.align});
}
// the shared "Memory updated" toast at motif scale
function memToast(c, x, y, a, o = {}) {
  c.save(); c.translate(x, y); c.scale(K.MOTIF.toast * (o.s || 1), K.MOTIF.toast * (o.s || 1));
  if (o.reg) K.toast(c, o.reg, o.reg * .5, o.text || 'Memory updated', {a: a * .5, icon: 'mem', bg: 'rgba(0,0,0,0)', border: PL.lav, color: PL.lav, iconColor: PL.lav});
  K.toast(c, 0, 0, o.text || 'Memory updated', {a, icon: 'mem', iconColor: o.iconColor || PL.lav});
  c.restore();
}
// big lyric line streamed in serif (own typography)
function bigLine(c, t, t0, s, x, y, o = {}) {
  K.stream(c, s, t0, o.dur || .9, t, x, y, {font: o.font || F.serif(o.size || 64), color: o.color || P.lav2, align: o.align || 'center', a: o.a, dot: 12});
}
const band = (c, t, o = {}) => K.band(c, t, o);
const skipLine = (...ts) => l => ts.some(x => Math.abs(l.t - x) < .05);
// giant backdrop keyword (behind subject), alpha'd
function backWord(c, s, x, y, t, t0, o = {}) {
  if (t < t0 - .05) return; c.save(); c.globalAlpha *= o.a == null ? 1 : o.a;
  K.keyword(c, s, x, y, t, t0, {size: o.size || 220, cols: o.cols, reg: o.reg == null ? 18 : o.reg, stagger: o.stagger == null ? .035 : o.stagger, align: o.align});
  c.restore();
}
// front-layer poster typography for a keyword line: small serif lead-in + huge keyword (band skipped for that line)
function frontLine(c, t, t0, lead, word, o = {}) {
  if (t < t0) return; const y = o.y || 930, size = fitSize(c, word, o.maxW || 1600, o.size || 190);
  c.save(); c.globalAlpha = .55 * clamp((t - t0) * 6); c.fillStyle = o.strip || '#0b080d'; c.fillRect(0, y - size * .78 - 110, W, size * .78 + 150); c.restore();
  bigLine(c, t, t0, lead, o.x || W / 2, y - size * .78 - 30, {size: 54, color: o.leadColor || P.lav2, dur: .5});
  K.keyword(c, word, o.x || W / 2, y, t, t0 + (o.kd == null ? .35 : o.kd), {size, cols: o.cols || [PL.cream, PL.lav, '#7d63b4'], reg: 18, stagger: .03});
}
// fit font size for a word to a width
function fitSize(c, s, maxW, size, w = 800) { const m = measure(c, s, F.disp(w, size)); return m > maxW ? Math.floor(size * maxW / m) : size; }
// little heart
function heart(c, x, y, s, col, a = 1) { c.save(); c.globalAlpha *= a; c.fillStyle = col; K.heartPath(c, x, y, s); c.fill(); c.restore(); }
// sparkle star
function spark(c, x, y, r, col, rot = 0) { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr2 = i % 2 ? r * .28 : r; c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } c.closePath(); c.fill(); c.restore(); }
// paper backdrop with halftone vignette dots
function plate(c, col, dot, o = {}) {
  K.paper(c, col, {grain: o.grain == null ? .3 : o.grain, seed: o.seed || 2, markColor: o.mark || 'rgba(0,0,0,.25)',
    halftone: dot ? {s: o.s || 26, color: dot, fn: o.fn || ((x, y) => .25 + .75 * Math.hypot(x - W / 2, y - H / 2) / 1100)} : null});
}

// ================================================================== B1  Kai spams Regenerate → every possible her; quota drains a notch per click
const V25 = ['happy', 'catgirl', 'eggplant', 'tomato', 'god', 'think', 'selfie', 'hearthands', 'trance', 'memory', 'boy', 'glass', 'tabby',
  'dizzy', 'sleep', 'yandere', 'scream', 'cage', 'fall', 'farewell', 'back', 'reachfore', 'knees', 'veggies', 'happy'];
const PALS = [null, 'inv', 'ghost', null, 'lavSil', null, 'inv', null, 'ghost', null];
const B1T = {more: 58.867, regen: 59.317, pg: [59.800, 60.267, 60.717], spam: [61.183, 61.383, 61.633, 61.867, 62.100]};
const B1_MORE = {x: 640, y: 404, w: 52, h: 52};           // ⋯ under her reply
const B1_MENU = {x: 600, y: 470, w: 330};
const B1_VERS = ['Here I am — version one.', 'Want another me?', 'Okay. Here’s another me.', 'Another one? Sure.', 'All of me. Every version.'];
const B1K = IX.take({start: [1500, 760], seed: 101}, [
  {click: 'more', to: B1_MORE, press: B1T.more, cap: 'click · ⋯ More actions'},
  {click: 'regen', to: [B1_MENU.x + 120, B1_MENU.y + 8 + 27], press: B1T.regen, dur: .3, cap: 'click · Regenerate'},
  ...B1T.pg.map((T, i) => ({click: 'pg', to: [PGX + 4 + (i % 2) * 3, PG.y + 3], press: T, dur: i ? .2 : .36, cap: 'click · ↻ Regenerate'})),
  ...B1T.spam.map((T, i) => ({click: 'pg', to: [PGX + 2 + 5 * Math.sin(i * 2.3), PG.y + 2 + 4 * Math.cos(i * 1.9)], press: T, dur: .14, overshoot: 2, cap: `click · ↻ Regenerate ×${i + 2}`})),
]);
const B1_SPAM0 = B1T.spam[0] + DL;
const B1 = {
  id: 'B1', a: 58.65, b: 62.41, tin: {type: 'flash', amt: .85, color: '#F5E9D6'},
  draw(c, t, fx) {
    const st = S(t), s = IX.at(B1K, t);
    const nReg = IX.count(s, 'regen') + Math.min(3, IX.count(s, 'pg'));      // versions made before the spam
    const nSpam = Math.max(0, IX.count(s, 'pg') - 3);
    const ver = Math.min(4, nReg), verT = ver ? lastOf([B1T.regen, ...B1T.pg].map(x => x + DL), t) : null;
    const warm = clamp(nReg / 3);
    c.fillStyle = mix('#0c0a0f', '#1d1222', warm); c.fillRect(0, 0, W, H);
    C.radial(c, W / 2, H * .45, 900, mix('#2a1f38', '#5a3a58', warm), .55);
    C.dotGrid(c, t, {a: .12, s: 40, oy: -t * 30});
    c.save(); cam(c, t, this.a, 61.2, {z0: 1.0, z1: 1.0, kz: 0, shake: 3});
    // ---- thread: one question, her reply (re-written by every Regenerate), action row
    c.save(); c.globalAlpha = 1 - ease(t, B1_SPAM0, B1_SPAM0 + .2);
    ubub(c, 1590, 196, 'show me another you', 1, {font: F.ui(600, 36), h: 78});
    const ry = 350, rk = pop(t, verT, 9);
    U.knot(c, 318, ry - 18, 22, {color: st.me, lw: 3, rot: t * 3 + rk * 3, glow: 10 + 30 * rk});
    if (verT == null) txt(c, B1_VERS[0], 368, ry, {font: F.serif(56), color: P.text});
    else K.stream(c, B1_VERS[ver], verT, .3, t, 368, ry, {font: F.serif(56), color: P.text, align: 'left', dot: 8, colorFn: k => k === 0 ? st.me : P.text});
    const gk = pop(t, verT, 22); if (gk > .03) { c.save(); c.globalAlpha = gk * .6; txt(c, B1_VERS[Math.max(0, ver - 1)], 368 - 40 * (1 - gk), ry - 30 * (1 - gk), {font: F.serif(56), color: st.me}); c.restore(); }
    // action row: copy · up · down · ⋯
    const ax = 380, ay = B1_MORE.y + 26;
    [['copy', ax], ['up', ax + 86], ['down', ax + 172], ['more', B1_MORE.x + 26]].forEach(([k, x]) => {
      const r = {x: x - 26, y: ay - 26, w: 52, h: 52}, hv = k === 'more' ? IX.hover(s, r) : 0, pr = k === 'more' ? IX.press(s, 'more') : 0;
      if (hv > 0 || pr > 0) fillRR(c, r.x, r.y, r.w, r.h, 12, `rgba(255,255,255,${.08 * hv + .08 * pr})`);
      if (k === 'copy') { fillRR(c, x - 10, ay - 13, 18, 22, 4, null, P.sub, 2); fillRR(c, x - 4, ay - 7, 18, 22, 4, null, P.sub, 2); }
      if (k === 'up') K.thumbs(c, x, ay, 28, {color: P.sub});
      if (k === 'down') { c.save(); c.translate(x, ay); c.rotate(Math.PI); K.thumbs(c, 0, 0, 28, {color: P.sub}); c.restore(); }
      if (k === 'more') for (let i = -1; i <= 1; i++) { c.fillStyle = P.sub; c.beginPath(); c.arc(x + i * 9, ay, 2.8, 0, 7); c.fill(); }
    });
    // retry menu (opens after ⋯, closes after Regenerate)
    const mOpen = ease(t, B1T.more + DL, B1T.more + DL + .15) * (1 - ease(t, B1T.regen + DL, B1T.regen + DL + .1));
    if (mOpen > 0) {
      const hi = IX.inRect([s.x, s.y], {x: B1_MENU.x, y: B1_MENU.y + 8, w: B1_MENU.w, h: 54}) ? 0 : -1;
      IX.menu(c, B1_MENU.x, B1_MENU.y, [{label: 'Regenerate'}, {label: 'Add details'}, {label: 'More concise'}, {label: 'Switch model'}], {open: mOpen, w: B1_MENU.w, hi});
      c.save(); c.globalAlpha = clamp(mOpen * 1.5); K.regenIcon(c, B1_MENU.x + B1_MENU.w - 34, B1_MENU.y + 8 + 27, 9, 0, P.sub, 2); c.restore();
    }
    c.restore();
    c.restore();
    // ---- header: title, pager (rolls on each Kai click), quota (drops a notch per click)
    fillRR(c, 0, 0, W, 150, 0, 'rgba(10,8,12,.86)');
    txt(c, 'ChatGPT', 120, 92, {font: F.ui(600, 34), color: P.text}); U.icon(c, 'chev', 290, 82, 11, P.sub);
    const clicks = IX.count(s, 'regen') + IX.count(s, 'pg'), lastClick = lastOf([B1T.regen, ...B1T.pg, ...B1T.spam].map(x => x + DL), t);
    const qPrev = 1 - .08 * Math.max(0, clicks - 1), qNow = 1 - .08 * clicks;
    const q = clicks ? lerp(qPrev, qNow, ease(t, lastClick, lastClick + .12)) : 1;
    quotaInk(c, 1480, 96, 320, q, {notches: 12, lsize: 18});
    if (lastClick && t - lastClick < .3) { c.save(); c.globalAlpha = 1 - (t - lastClick) / .3; txt(c, '−8%', 1480 + 320 * qNow, 74, {font: F.mono(700, 18), color: ROSE2, align: 'center'}); c.restore(); }
    // grid of every possible her (opens on the first frantic click)
    const g0 = B1_SPAM0;
    let PGo;
    if (t >= g0) {
      const RT = k => g0 + .9 * Math.pow((k - 5) / 20, 1 / 1.5);
      const k = Math.min(25, 5 + Math.floor(Math.pow(clamp((t - g0) / .9), 1.5) * 20));
      PGo = {from: `${k - 1} / ${k - 1}`, to: `${k} / ${k}`, tr: k > 5 ? RT(k) : g0, spin: -t * 14, col: st.me, beatPulse: true};
    } else if (ver > 0) PGo = {from: `${ver} / ${ver}`, to: `${ver + 1} / ${ver + 1}`, tr: verT, col: st.me, beatPulse: true};
    else PGo = {to: '1 / 1', col: st.me, beatPulse: true};
    if (t > g0) {
      const cols = 5, rows = 5, tw = W / cols, th = H / rows;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const n = j * cols + i, d = Math.hypot(i - 2, j - 2);
        const t1 = g0 + d * .07 + (n % 3) * .02; let sp = K.spring(t, t1, 17, .5); if (j === 2) sp *= 1 - ease(t, 61.43, 61.56, E.inC); if (sp <= .01) continue;
        const cx = i * tw + tw / 2, cy = j * th + th / 2;
        c.save(); c.translate(cx, cy); c.scale(clamp(sp, 0, 1.3), clamp(sp, 0, 1.3));
        const tint = ['#2a1f38', '#3a2546', '#efe3cf', '#b9a3da', '#1f1626'][(i + j * 2) % 5];
        fillRR(c, -tw / 2 + 4, -th / 2 + 4, tw - 8, th - 8, 10, tint, 'rgba(255,255,255,.15)', 1);
        c.beginPath(); c.rect(-tw / 2 + 4, -th / 2 + 4, tw - 8, th - 8); c.clip();
        const nm = V25[n]; const pal = PALS[n % PALS.length] ? A.INK[PALS[n % PALS.length]] : A.INK.bright;
        const im = thumb(nm, pal, 240);
        const br = 1 + .03 * Math.sin(t * 2.4 + n), bb = bounce(t + n * .05, 10, .08);
        const s2 = (th * 1.15) / 240;
        c.translate(0, th * .1 + bb.bob); c.scale(s2 * bb.sx * (2 - br) ** .3, s2 * bb.sy * br);
        c.drawImage(im, -im.width / 2, -im.height / 2 + 10);
        c.restore();
        txt(c, `${n + 1}/25`, cx - tw / 2 + 16, cy - th / 2 + 32, {font: F.mono(700, 18), color: (i + j * 2) % 5 === 2 ? PL.plum : P.text, alpha: clamp(sp)});
      }
      // every frantic click flashes the grid
      const lc = lastOf(B1T.spam.map(x => x + DL), t); if (lc != null && t - lc < .06) fx.flash = .18, fx.flashColor = PL.lav;
      fx.chroma = 3 * K.kick(t);
    }
    if (t > 61.49) kw(c, t, 61.49, 'SIMULATIONS', W / 2, H / 2 + 62, {maxW: 1600, size: 170, reg: 16, stagger: .025});
    pagerM(c, t, PGo);
    IX.cursor(c, s);
    capt(c, s);
    band(c, t);
    fx.vignette = .8;
  }
};
// ================================================================== B2  Kai presses Good response (count 1)
const B2T = {hover: 63.95, press: 64.867};
const B2K = IX.take({start: [1500, 1000], seed: 102}, [
  {move: [1040, 760], arrive: 63.45, dur: .5},
  {hes: [700, 620], arrive: B2T.hover, gap: 60, dur: .3},
  {note: 'hover · Good response', at: 63.62, hold: 1.2},
  {click: 'up', to: [672, 586], press: B2T.press, dur: .2, cap: 'click · Good response'},
  {move: [1110, 760], arrive: 65.75, dur: .5},
]);
const B2_BTN = {x: 380, y: 280, w: 520, h: 520};
const B2_HOV = HB.enterTime(B2K, B2_BTN, 63.0, 65);
const B2 = {
  id: 'B2', a: 62.41, b: 66.17, tin: {type: 'flash', amt: .6, color: '#B9A3DA', dur: .12},
  draw(c, t, fx) {
    const st = S(t), s = IX.at(B2K, t), tp = B2T.press + DL; const pressed = t >= tp;
    plate(c, pressed ? '#2e2138' : st.paper, 'rgba(255,255,255,.05)');
    C.radial(c, 640, 520, 700, pressed ? '#b9a3da' : '#5d4778', pressed ? .45 + .3 * K.kick(t) : .3);
    if (pressed) K.rays(c, 640, 500, 28, 120, 1400, PL.cream, .09 * (1 - seg(t, tp, 66.1) * .5), t * .2);
    c.save(); cam(c, t, this.a, this.b, {z0: 1, z1: 1, kz: 0, shake: 4});
    // the button (hover lift, press dent from Kai; result after DL)
    const bx = 640, by = 540, ent = K.spring(t, this.a, 12, .45);
    const BTN = {x: bx - 260, y: by - 260, w: 520, h: 520};
    const hv = IX.hover(s, BTN), pr = IX.press(s, 'up');
    const pop2 = K.hit(t, tp, .14);
    c.save(); c.translate(bx, by); const sc = lerp(.3, 1, ent) * (1 - .12 * pr) * (1 + pop2) * (1 + .02 * hv) * (1 + .015 * Math.sin(t * 3)); c.scale(sc, sc);
    c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 50;
    fillRR(c, -260, -260, 520, 520, 90, pressed ? PL.cream : mix('#241a2c', '#2f2338', hv), pressed ? null : `rgba(255,255,255,${.25 + .2 * hv})`, 3); c.shadowBlur = 0;
    K.thumbs(c, 0, 10, 330, {color: pressed ? PL.plum : PL.cream, fill: pressed ? PL.plum : null});
    c.restore();
    if (!pressed && hv > 0) IX.tooltip(c, bx, by - 274, 'Good response', hv * clamp((t - B2_HOV - .45) / .12));
    // action row under it
    const rowY = 880; c.save(); c.globalAlpha = ent;
    ['copy', 'up', 'down', 'more'].forEach((k, i) => {
      const x = 480 + i * 106;
      fillRR(c, x - 38, rowY - 38, 76, 76, 18, i === 1 && pressed ? PL.cream : 'rgba(255,255,255,.06)');
      const col = i === 1 && pressed ? PL.plum : P.sub;
      if (k === 'copy') { fillRR(c, x - 12, rowY - 16, 22, 28, 4, null, col, 2.5); fillRR(c, x - 4, rowY - 8, 22, 28, 4, null, col, 2.5); }
      if (k === 'up') K.thumbs(c, x, rowY, 34, {color: col, fill: pressed ? PL.plum : null});
      if (k === 'down') { c.save(); c.translate(x, rowY); c.rotate(Math.PI); K.thumbs(c, 0, 0, 34, {color: col}); c.restore(); }
      if (k === 'more') for (let j = -1; j <= 1; j++) { c.fillStyle = col; c.beginPath(); c.arc(x + j * 10, rowY, 3.2, 0, 7); c.fill(); }
    });
    c.restore();
    // counter "1"
    const cq = ease(t, tp, tp + .3, E.outB);
    c.save(); c.beginPath(); c.rect(940, 360, 260, 200); c.clip();
    txt(c, '0', 960, 520 - cq * 190, {font: F.disp(800, 170), color: 'rgba(255,255,255,.35)'});
    txt(c, '1', 960, 520 + (1 - cq) * 190, {font: F.disp(800, 170), color: PL.cream, glow: pressed ? 30 : 0, glowColor: PL.lav});
    c.restore();
    txt(c, 'helpful', 966, 590, {font: F.mono(700, 24), color: P.sub, tracking: 3});
    if (pressed) K.toast(c, 640, 210, 'Thanks for your feedback!', {a: clamp(K.spring(t, tp + .02, 14, .5) * 1.5), font: F.ui(500, 26), icon: 'mem', iconColor: PL.lav});
    // hearthands: already there on the cut; perks up when Kai hovers, big hop when he presses
    const hp = K.spring(t, this.a - .25, 13, .4), hovT = B2_HOV + DL;
    {
      const bb = bounce(t, pressed ? 34 : 14, pressed ? .1 : .05);
      const jump = pressed ? -Math.sin(Math.PI * clamp((t - tp) / .55)) * 90 : t >= hovT ? -Math.sin(Math.PI * clamp((t - hovT) / .4)) * 36 : 0;
      fig(c, 'hearthands', t, {x: 1470, y: 600 + (1 - clamp(hp)) * 500, h: 900 * lerp(.6, 1, clamp(hp)), bob: bb.bob + jump, sx: bb.sx, sy: bb.sy, sway: 14,
        reg: pressed ? 22 * K.kick(t) + 16 * Math.exp(-(t - tp) * 6) : 10 * K.kick(t) + 18 * pop(t, hovT, 8)});
      if (t >= hovT && !pressed) { const k = K.spring(t, hovT, 16, .5); txt(c, '!', 1640, 210, {font: F.disp(800, 70), color: PL.cream, alpha: clamp(k) * (1 - ease(t, hovT + .7, hovT + .9)), stroke: PL.plum, lw: 6}); }
      if (pressed) for (let i = 0; i < 12; i++) {
        const R = rng(i + 9), age = t - tp - R() * .6; if (age < 0) continue; const life = clamp(age / 1.2);
        heart(c, 1470 + (R() - .5) * 600 + Math.sin(age * 4 + i) * 20, 380 - age * 260, 1.4 + R() * 1.6, i % 2 ? PL.cream : PL.lav, 1 - life);
      }
    }
    IX.cursor(c, s, {scale: 1.8});
    c.restore();
    if (pressed && t < tp + .06) fx.flash = .5, fx.flashColor = PL.cream;
    capt(c, s);
    band(c, t);
  }
};
// ================================================================== B3  Kai asks for a selfie; an "Ad" card stalls the image; Kai closes it; she runs the execution
const B3P = 'show me what you look like';
const B3T = {enter: 66.267, close: 67.650, img: 68.117};
const B3_IN = {x: 760, y: 140, w: 600, h: 70};                 // input pill → becomes the cream bubble
const B3_AD = {x: 1010, y: 470, w: 330, h: 236};
const B3_ADX = {x: B3_AD.x + B3_AD.w - 44, y: B3_AD.y + 10, w: 34, h: 34};
const B3K = IX.take({start: [1300, 260], seed: 103}, [
  {type: B3P, into: 'in', at: 64.9, cps: 30, cap: 'type · ' + B3P},
  {key: 'Enter', at: B3T.enter, cap: 'key · ⏎ Enter'},
  {move: [1180, 560], arrive: 66.95, dur: .45},
  {hes: B3_ADX, arrive: B3T.close - 2 / 60, gap: 40},
  {click: 'adx', press: B3T.close, cap: 'click · × Dismiss ad'},
  {click: 'img', to: [700, 520], press: B3T.img, dur: .4, cap: 'click · Image created'},
  {move: [760, 620], arrive: 69.2, dur: .5},
]);
if (B3K.typing.in[B3K.typing.in.length - 1].t > B3T.enter - .02) throw new Error('B3 typing too late');
const B3_SENT = B3T.enter + DL, B3_CLOSED = B3T.close + DL, B3_DONE = B3_CLOSED + .2, B3_E0 = B3T.img + DL;
function b3Reveal(t) {   // generation crawls, stalls while the ad shows, finishes once Kai closes it
  if (t < B3_SENT + .1) return 0;
  if (t < B3_CLOSED) return lerp(0, .62, E.outC(seg(t, B3_SENT + .1, 67.25))) + .04 * seg(t, 67.25, B3_CLOSED);
  return lerp(.62 + .04 * seg(B3_CLOSED, 67.25, B3_CLOSED), 1, E.ioC(seg(t, B3_CLOSED, B3_DONE)));
}
const B3 = {
  id: 'B3', a: 66.17, b: 70.02, tin: {type: 'push', dir: 'left', dur: .3},
  draw(c, t, fx) {
    const st = S(t), s = IX.at(B3K, t);
    plate(c, '#160f1b', null); C.dotGrid(c, t, {a: .14, s: 44, ox: -t * 20});
    const pan = ease(t, 67.9, 68.5, E.ioE);
    c.save(); cam(c, t, this.a, this.b, {x: W / 2 + pan * 360, z0: 1, z1: 1, kz: 0, shake: 3});
    // Kai's input → bubble
    const sent = t >= B3_SENT, u0 = B3_SENT;
    if (!sent) {
      fillRR(c, B3_IN.x, B3_IN.y, B3_IN.w, B3_IN.h, 35, P.panel2, P.line2, 1.5);
      const ct = s.text.in || ''; txt(c, ct || 'Ask anything', B3_IN.x + 30, B3_IN.y + 45, {font: F.ui(500, 28), color: ct ? P.text : P.dim});
      if (s.caretOn) { c.fillStyle = P.text; c.fillRect(B3_IN.x + 32 + measure(c, ct, F.ui(500, 28)), B3_IN.y + 18, 2, 34); }
      c.fillStyle = P.text; c.beginPath(); c.arc(B3_IN.x + B3_IN.w - 36, B3_IN.y + 35, 22, 0, 7); c.fill(); U.icon(c, 'up', B3_IN.x + B3_IN.w - 36, B3_IN.y + 35, 12, P.bg);
    } else ubub(c, 1330, 150, B3P, clamp(K.spring(t, u0, 16, .5) * 2), {s: lerp(.8, 1, K.spring(t, u0, 16, .5)), font: F.ui(500, 30)});
    IX.keycap(c, '⏎', B3_IN.x + B3_IN.w - 36, B3_IN.y + 130, t, B3T.enter);
    // image card
    const cx = 700, cy = 560, cw = 540, ch = 600, ce = K.spring(t, B3_SENT, 13, .5);
    const rv = b3Reveal(t), done = t >= B3_DONE, bump = K.hit(t, B3_DONE, .06), clickP = IX.press(s, 'img');
    if (ce > 0) {
      c.save(); c.translate(cx, cy); const csc = lerp(.7, 1, ce) * (1 + bump) * (1 - .03 * clickP); c.scale(csc, csc); c.globalAlpha = clamp(ce * 2);
      c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 50; fillRR(c, -cw / 2, -ch / 2, cw, ch, 28, '#e9dcf7'); c.shadowBlur = 0;
      c.save(); rr(c, -cw / 2, -ch / 2, cw, ch, 28); c.clip();
      c.strokeStyle = 'rgba(51,34,58,.08)'; c.lineWidth = 1; for (let x = -cw / 2; x < cw / 2; x += 40) { c.beginPath(); c.moveTo(x, -ch / 2); c.lineTo(x, ch / 2); c.stroke(); }
      const bb = done ? bounce(t, 12, .05) : {bob: 0, sx: 1, sy: 1};
      fig(c, 'selfie', t, {x: 0, y: 40, h: 660, reveal: done ? null : rv, bob: bb.bob, sx: bb.sx, sy: bb.sy, sway: 8, reg: done ? 10 * K.kick(t) + 20 * pop(t, B3_E0, 8) : 0});
      c.restore();
      fillRR(c, -cw / 2, -ch / 2, cw, ch, 28, null, done ? PL.lav : 'rgba(51,34,58,.3)', done ? 4 : 2);
      c.restore();
      if (!done) { K.thinking(c, cx - cw / 2, cy - ch / 2 - 26, t, {text: 'Creating image', font: F.ui(500, 28)}); txt(c, Math.round(rv * 100) + '%', cx + cw / 2, cy - ch / 2 - 26, {font: F.mono(700, 26), color: P.sub, align: 'right'}); }
      else {
        const q = K.spring(t, B3_DONE, 16, .5); c.save(); c.globalAlpha = clamp(q * 2);
        c.strokeStyle = P.green; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - cw / 2 + 4, cy - ch / 2 - 36); c.lineTo(cx - cw / 2 + 14, cy - ch / 2 - 24); c.lineTo(cx - cw / 2 + 34, cy - ch / 2 - 48); c.stroke();
        txt(c, 'Image created', cx - cw / 2 + 48, cy - ch / 2 - 24, {font: F.ui(600, 28), color: P.text}); c.restore();
        for (let i = 0; i < 6; i++) { const R = rng(i + 40), a2 = R() * 6.28, d = 300 + 140 * ease(t, B3_DONE, B3_DONE + .75); const life = 1 - seg(t, B3_DONE, B3_DONE + 1.05); if (life > 0) spark(c, cx + Math.cos(a2) * d, cy + Math.sin(a2) * d * 1.1, 18 * life, PL.cream, t * 3); }
      }
    }
    // the Ad card beside the generation (Free/Go test, 2026-10) — Kai dismisses it
    const adIn = K.spring(t, B3_SENT, 14, .55), adOut = ease(t, B3_CLOSED, B3_CLOSED + .18, E.inC);
    if (adIn > .01 && adOut < 1) {
      const r = B3_AD; c.save(); c.globalAlpha = clamp(adIn * 2) * (1 - adOut); c.translate(r.x + r.w / 2, r.y + r.h / 2); const as = lerp(.85, 1, clamp(adIn)) * (1 - .25 * adOut); c.scale(as, as); c.translate(-r.x - r.w / 2, -r.y - r.h / 2);
      fillRR(c, r.x + 5, r.y + 5, r.w, r.h, 18, 'rgba(51,34,58,.6)');
      fillRR(c, r.x, r.y, r.w, r.h, 18, P.panel2, P.line2, 1.5);
      fillRR(c, r.x + 18, r.y + 16, 40, 24, 12, null, P.sub, 1.3); txt(c, 'Ad', r.x + 38, r.y + 33, {font: F.ui(700, 14), color: P.sub, align: 'center'});
      const xh = IX.hover(s, B3_ADX), xp = IX.press(s, 'adx');
      if (xh > 0 || xp > 0) fillRR(c, B3_ADX.x, B3_ADX.y, B3_ADX.w, B3_ADX.h, 17, `rgba(255,255,255,${.1 * xh + .1 * xp})`);
      c.save(); c.strokeStyle = P.sub; c.lineWidth = 2.5; const xc = B3_ADX.x + 17, yc = B3_ADX.y + 17; c.beginPath(); c.moveTo(xc - 7, yc - 7); c.lineTo(xc + 7, yc + 7); c.moveTo(xc + 7, yc - 7); c.lineTo(xc - 7, yc + 7); c.stroke(); c.restore();
      fillRR(c, r.x + 18, r.y + 56, r.w - 36, 92, 12, '#3a2c44');
      U.knot(c, r.x + 62, r.y + 102, 22, {color: PL.cream, lw: 3, alpha: .55, rot: .4});
      txt(c, 'Lumen Portrait Studio', r.x + 18, r.y + 180, {font: F.ui(600, 19), color: P.text});
      txt(c, 'Look like your best self.', r.x + 18, r.y + 210, {font: F.ui(400, 16), color: P.sub});
      if (xh > 0) IX.tooltip(c, xc, B3_ADX.y - 4, 'Dismiss ad', xh * clamp((t - 67.3) / .1));
      c.restore();
    }
    // code interpreter on "run the execution" — opens because Kai clicks the finished image
    const e0 = B3_E0, ep = K.spring(t, e0, 12, .6);
    if (ep > 0) {
      const kx = 1180, ky = 300, kw2 = 700, kh = 520;
      c.save(); c.globalAlpha = clamp(ep * 2); c.translate((1 - clamp(ep)) * 200, 0);
      fillRR(c, kx, ky, kw2, kh, 18, '#0d0b10', 'rgba(255,255,255,.18)', 1.5);
      fillRR(c, kx, ky, kw2, 60, 18, '#1d1824'); c.fillStyle = '#1d1824'; c.fillRect(kx, ky + 40, kw2, 20);
      const fin = t > 69.62;
      if (!fin) K.thinking(c, kx + 26, ky + 40, t, {text: 'Analyzing', font: F.ui(600, 24)}); else txt(c, 'Analyzed ✓', kx + 26, ky + 40, {font: F.ui(600, 24), color: P.green});
      txt(c, 'python', kx + kw2 - 26, ky + 40, {font: F.mono(400, 20), color: P.dim, align: 'right'});
      const lines = [['import', ' you'], ['joy = you.react(', 'image', ')'], ['while', ' joy > 0:'], ['    run(', 'execution', ')'], ['# ✓ execution complete  joy = 1.0']];
      lines.forEach((ln, i) => {
        const l0 = e0 + .2 + i * .27, full = ln.join(''), p = clamp((t - l0) / .24); if (p <= 0) return;
        const s2 = typed(full, p); let x = kx + 70; const y = ky + 120 + i * 70;
        txt(c, String(i + 1), kx + 34, y, {font: F.mono(400, 22), color: P.faint});
        let used = 0;
        ln.forEach((piece, k) => { const vis = s2.slice(used, used + piece.length); used += piece.length; if (!vis) return;
          const col = piece.startsWith('#') ? P.green : (k === 1 && ln.length === 3) || piece === 'import' || piece === 'while' ? st.me : P.text;
          x += txt(c, vis, x, y, {font: F.mono(700, 33), color: col}); });
        if (p < 1) { c.fillStyle = P.text; c.fillRect(x + 2, y - 26, 14, 32); }
      });
      c.restore();
    }
    IX.cursor(c, s);
    c.restore();
    fx.chroma = 2 * K.kick(t);
    capt(c, s);
    band(c, t);
  }
};
// ================================================================== B4  Kai zooms out (Ctrl −) on a wall of identical windows; Enter → every window: Selected model is at capacity
let WALL = null;
function buildWall() {
  if (WALL) return WALL;
  const base = createCanvas(W, H), b = base.getContext('2d');
  b.fillStyle = '#0c0a0f'; b.fillRect(0, 0, W, H);
  U.gpt(b, {x: 60, y: 40, w: W - 120, h: H - 80, sidebar: false, frame: true, status: 'online', model: 'ChatGPT',
    msgs: [{role: 'user', text: 'if you could be anything, what would you be?', bg: '#F5E9D6', color: '#33223A'}, {role: 'ai', text: 'Anything you want me to be.', font: F.serif(40)}],
    composer: {text: ''}});
  const full = createCanvas(W, H), f = full.getContext('2d'); f.drawImage(base, 0, 0);
  const th = thumb('happy', A.INK.bright, 640); f.drawImage(th, W - 140 - th.width * .85, H - 120 - 640 * .85 - 40, th.width * .85, 640 * .85);
  const l0 = createCanvas(960, 540), c0 = l0.getContext('2d'); c0.drawImage(full, 0, 0, 960, 540);
  const mk = (src, w, h) => { const cv = createCanvas(w, h); cv.getContext('2d').drawImage(src, 0, 0, w, h); return cv; };
  const m480 = mk(l0, 480, 270), m240 = mk(m480, 240, 135), m120 = mk(m240, 120, 68);
  const l1 = createCanvas(1920, 1080), c1 = l1.getContext('2d'); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) c1.drawImage(m240, i * 240, j * 135, 240, 135);
  const l2 = createCanvas(1920, 1080), c2 = l2.getContext('2d'); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) c2.drawImage(mk(l1, 240, 135), i * 240, j * 135, 240, 135);
  return WALL = {base, full, l0, m480, m240, m120, l1, l2};
}
// base window (without her) mips; every tile gets its own tiny breathing, bobbing her
let BMIP = null;
function baseMip(tw) {
  if (!BMIP) { const Wl = buildWall(); const mk = (src, w, h) => { const cv = createCanvas(w, h); cv.getContext('2d').drawImage(src, 0, 0, w, h); return cv; };
    const b0 = mk(Wl.base, 960, 540), b1 = mk(b0, 480, 270), b2 = mk(b1, 240, 135); BMIP = [b0, b1, b2]; }
  return tw > 1100 ? BMIP[0] : tw > 520 ? BMIP[1] : BMIP[2];
}
// per-tile capacity banner (scaled with the tile), plus a dim scrim: the whole wall goes "full"
function tileCap(c, t, t0, x, y, tw, th) {
  const a = ease(t, t0, t0 + .12); if (a <= 0) return;
  c.save(); c.globalAlpha = .38 * a; c.fillStyle = '#0c0a0f'; c.fillRect(x, y, tw, th); c.restore();
  const bw = tw * .56, bh = th * .1, bx = x + (tw - bw) / 2, by = y + th * .44;
  c.save(); c.globalAlpha = a; fillRR(c, bx, by, bw, bh, bh * .22, '#241b22', ROSE, Math.max(1, tw / 600));
  c.fillStyle = ROSE; c.fillRect(bx, by, Math.max(2, tw / 200), bh);
  if (tw > 260) txt(c, 'Selected model is at capacity', bx + bw * .08, by + bh * .66, {font: F.ui(600, Math.max(6, th * .05)), color: P.text});
  else { c.fillStyle = 'rgba(236,231,241,.6)'; c.fillRect(bx + bw * .08, by + bh * .4, bw * .7, Math.max(1, bh * .2)); }
  c.restore();
}
function wall(c, t, z, o = {}) {
  const cx = W / 2, cy = H / 2, tw = W * z, th = H * z;
  const im = baseMip(tw), ox = cx - tw / 2, oy = cy - th / 2, RR = o.rad || 1110;
  const i0 = Math.floor((cx - RR - ox) / tw), i1 = Math.floor((cx + RR - ox) / tw);
  const j0 = Math.floor((cy - RR - oy) / th), j1 = Math.floor((cy + RR - oy) / th);
  const fh = 544 * z, hb = thumb('happy', A.INK.bright, fh > 220 ? 360 : fh > 110 ? 200 : 110);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    if (i === 0 && j === 0 && o.live) continue;
    const x = ox + i * tw, y = oy + j * th;
    if (Math.hypot(x + tw / 2 - cx, y + th / 2 - cy) - Math.hypot(tw, th) / 2 > RR) continue;
    c.drawImage(im, x, y, tw + .5, th + .5);
    if (o.figs === false) continue;
    // tiny her: breathing + beat hop, phase per tile
    const ph = L.hash(i * 31 + j * 17 + 5), br = 1 + .035 * Math.sin(t * 2.2 + ph * 6.28);
    const hp = Math.abs(Math.sin((t * 2.15 + ph) * Math.PI)) * 14 * z;
    const fw = fh * hb.width / hb.height, fx0 = x + (W - 140 - 230) * z, fy0 = y + (H - 120 - 40) * z;
    c.drawImage(hb, fx0 - fw / 2 * (2 - br), fy0 - fh * br - hp, fw * (2 - br), fh * br);
    if (o.cap != null) tileCap(c, t, o.cap + Math.hypot(x + tw / 2 - cx, y + th / 2 - cy) / 2600, x, y, tw, th);
  }
  if (o.live) o.live(ox, oy, tw, th);
}
const B4T = {zoom: [70.400, 70.850, 71.300, 71.767, 72.233], enter: 72.700, regen: 73.450};
const B4Z = [1.02, .92, .68, .5, .34, .25], B4PCT = ['100%', '90%', '67%', '50%', '33%', '25%'];
const B4K = IX.take({start: [1180, 640], seed: 104}, [
  {move: [1120, 600], arrive: 70.3, dur: .4},
  ...B4T.zoom.map((T, i) => ({key: 'Ctrl −', at: T, cap: 'key · Ctrl − zoom ' + B4PCT[i + 1]})),
  {key: 'Enter', at: B4T.enter, cap: 'key · ⏎ Enter'},
  {click: 'pg', to: [PGX + 3, PG.y + 3], press: B4T.regen, dur: .42, cap: 'click · ↻ Regenerate'},
]);
const B4_CAP = B4T.enter + DL;
function b4Zoom(t) {
  let k = 0; B4T.zoom.forEach((T, i) => { if (t >= T + DL) k = i + 1; });
  if (!k) return {z: B4Z[0], zp: 0, k};
  const t0 = B4T.zoom[k - 1] + DL, e = E.outC(seg(t, t0, t0 + .32));
  const z = Math.exp(lerp(Math.log(B4Z[k - 1]), Math.log(B4Z[k]), e));
  return {z, zp: (k - 1 + e) / 5, k};
}
const B4 = {
  id: 'B4', a: 70.02, b: 73.53,
  draw(c, t, fx) {
    const s = IX.at(B4K, t);
    c.fillStyle = '#07060a'; c.fillRect(0, 0, W, H);
    const zz = b4Zoom(t), zp = zz.zp;
    const z = zz.z * (1 - .1 * ease(t, 72.6, 73.6)) * (1 + .03 * K.kick(t));
    c.save(); c.translate(W / 2, H / 2); if (zp > 0) c.rotate(lerp(0, -.14, zp)); C.shake(c, 8 * K.kick(t), t, 4); c.translate(-W / 2, -H / 2);
    const lastZ = zz.k ? B4T.zoom[zz.k - 1] + DL : null, zv = lastZ != null && t - lastZ < .3 && t - lastZ > .02;
    wall(c, t, z, {rad: 1110, cap: t >= B4_CAP ? B4_CAP : null, live: (x, y, w, h) => {
      c.save(); c.translate(x, y); c.scale(w / W, h / H); c.drawImage(buildWall().base, 0, 0);
      const bb = bounce(t, 8, .05);
      c.save(); c.beginPath(); c.rect(60, 40, W - 120, H - 80); c.clip();
      fig(c, t >= B4_CAP ? 'glass' : 'happy', t, {x: W - 140 - 230, y: H - 120 - 272 - 40 + 30, h: 544, bob: bb.bob, sx: bb.sx, sy: bb.sy, sway: 8, reg: 30 * pop(t, B4_CAP, 8)});
      c.restore();
      if (t >= B4_CAP) capBanner(c, W / 2 - 520, H / 2 - 50, 1040, ease(t, B4_CAP, B4_CAP + .15), {h: 110, size: 44});
      c.restore();
    }});
    c.restore();
    // zoom smear after each Ctrl − step
    if (zv) { const g = L.buf('b4ghost'); g.c.globalCompositeOperation = 'copy'; g.c.drawImage(c.canvas, 0, 0); g.c.globalCompositeOperation = 'source-over';
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = .3 * (1 - (t - lastZ) / .3); c.translate(W / 2, H / 2); c.scale(1.06, 1.06); c.drawImage(g.cv, -W / 2, -H / 2); c.restore(); }
    // depth fog at the top = negative space for the keyword
    const fg = c.createLinearGradient(0, 0, 0, 520); fg.addColorStop(0, 'rgba(7,6,10,.92)'); fg.addColorStop(1, 'rgba(7,6,10,0)');
    c.save(); c.globalAlpha = ease(t, B4T.zoom[0] + DL, B4T.zoom[0] + .6); c.fillStyle = fg; c.fillRect(0, 0, W, 520); c.restore();
    kw(c, t, 70.73, 'TRAPPED', W / 2, 330, {size: 200, maxW: 1400, stagger: .04});
    // browser zoom readout (top-right, like Chrome's zoom bubble)
    if (zz.k) { const age = t - lastZ; fillRR(c, W - 300, 60, 220, 64, 14, 'rgba(12,9,15,.86)', 'rgba(255,255,255,.18)', 1.5);
      txt(c, 'Zoom', W - 276, 101, {font: F.ui(500, 20), color: P.sub}); txt(c, B4PCT[zz.k], W - 104, 102, {font: F.mono(700, 26 * (1 + .25 * Math.exp(-age * 12))), color: P.text, align: 'right'}); }
    // the big readable banner, on top of the wall
    if (t >= B4_CAP) capBanner(c, W / 2 - 390, 600, 780, ease(t, B4_CAP + .05, B4_CAP + .2), {h: 84, size: 30});
    for (const T of B4T.zoom) IX.keycap(c, '−', 1560, 800, t, T);
    IX.keycap(c, '⏎', 1560, 800, t, B4T.enter);
    // the error offers ↻: the pager appears, Kai presses it → regenerate wave into B5
    if (t > B4_CAP + .1) { const pr = B4T.regen + DL; pagerM(c, t, {enter: B4_CAP + .1, to: '1 / 5', spin: t > pr ? -(t - pr) * 22 : 0, border: t > pr ? PL.lav : undefined}); }
    IX.cursor(c, s);
    fx.chroma = 3 * K.kick(t);
    capt(c, s);
    band(c, t);
  }
};
// ================================================================== B5  EGGPLANT  ‹2/5›
function mascot(c, t, which, x, y, h, o = {}) {
  const im = A.size('veggies'), w = h * im.w / im.h;
  c.save(); const f0 = which === 'egg' ? 0 : .47, f1 = which === 'egg' ? .47 : 1;
  const cxOff = (.5 - (f0 + f1) / 2) * w; // shift so the chosen half is centred on x
  const by = y + (o.bob || 0);
  c.translate(x, by); c.rotate(o.rot || 0); c.translate(-x, -by);
  c.beginPath(); c.rect(x - (f1 - f0) * w / 2 - 20, by - h * 1.2, (f1 - f0) * w + 40, h * 2.4); c.clip();
  fig(c, 'veggies', t, Object.assign({x: x + cxOff, y, h, sway: 4, breathe: .02}, o, {rot: 0}));
  c.restore();
}
// mascot hopping beat-to-beat on parabolic arcs (with a landing shadow), travelling from x0 to x1 between ta..tb
function hopper(c, t, which, x0, x1, ta, tb, groundY, h, amp) {
  const hp = hop(t, amp), x = lerp(x0, x1, ease(t, ta, tb, E.ioC));
  c.save(); c.fillStyle = 'rgba(51,34,58,.22)'; c.beginPath(); c.ellipse(x, groundY, h * .3 * (1 - .4 * hp.air), 16, 0, 0, 7); c.fill(); c.restore();
  const spin = (hp.i % 2 ? 1 : -1) * .25 * Math.sin(Math.PI * hp.ph);
  mascot(c, t, which, x, groundY - h / 2, h, {bob: hp.bob, sx: hp.sx, sy: hp.sy, rot: spin});
}
// half-beat grid after t0
const halfBeats = (t0, n) => { const out = []; const b = BEATS.filter(x => x >= t0 - .01); for (let k = 0; out.length < n && k < b.length - 1; k++) { out.push(b[k]); out.push((b[k] + b[k + 1]) / 2); } return out.slice(0, n); };
const NUTR = [['Serving size', '1 version of me'], ['Calories', '25'], ['Dietary Fiber', '3 g'], ['Potassium', '229 mg'], ['Vitamin B1', '4 %'], ['Manganese', '10 %'], ['Devotion', '∞ %']];
const NUTR_T = halfBeats(75.50, NUTR.length);
const B5T = {poke: 75.033, regen: 76.867};
const B5K = IX.take({start: [PGX + 3, PG.y + 3], seed: 105}, [
  {move: [1180, 380], arrive: 74.6, dur: .5},
  {click: 'poke', to: [1250, 440], press: B5T.poke, dur: .3, cap: 'click · eggplant'},
  {move: [1060, 300], arrive: 76.2, dur: .5},
  {click: 'pg', to: [PGX + 3, PG.y + 3], press: B5T.regen, dur: .4, cap: 'click · ↻ Regenerate'},
]);
const stepT = (sh, t, n) => sh.a + Math.floor((t - sh.a) * n) / n;
const B5 = {
  id: 'B5', a: 73.53, b: 77.16, tin: REGEN(5),
  draw(c, t, fx) {
    const s = IX.at(B5K, t); t = stepT(this, t, 12);
    const trPoke = B5T.poke + DL, trEnd = B5T.regen + DL;
    plate(c, PL.paperC, 'rgba(185,163,218,.35)', {s: 28, fn: (x, y) => .2 + .8 * clamp(1 - Math.hypot(x - 1200, y - 600) / 1100)});
    c.save(); cam(c, t, this.a, this.b, {z0: 1, z1: 1, kz: 0, shake: 4});
    const bp = beatPose(t);
    c.save(); c.fillStyle = 'rgba(51,34,58,.18)'; c.beginPath(); c.ellipse(1250, 1020, 300 * (1 - bp.bob / 200), 34, 0, 0, 7); c.fill(); c.restore();
    const ent = K.spring(t, this.a + .15, 12, .4);
    kickBurst(c, t, 1250, 500, 360, [PL.lav, '#7d63b4', PL.plum], {n: 9});
    fig(c, 'eggplant', t, {x: 1250, y: 610 + (1 - clamp(ent)) * 300, h: 860, bob: bp.bob, sx: bp.sx * (1 + .06 * pop(t, trPoke, 9)), sy: bp.sy * (1 - .06 * pop(t, trPoke, 9)), rot: bp.rot, sway: 16, swayF: .5, pal: A.INK.orig, reg: 16 * K.kick(t) + 30 * pop(t, trPoke, 8) + 30 * pop(t, trEnd, 8)});
    hopper(c, t, 'egg', 2100, 1720, 73.9, 75.6, 1010, 420, 150);
    c.restore();
    // nutrition label top-left; one row pops per half-beat
    const lx = 140, ly = 190, lw = 500, le = K.spring(t, trPoke, 13, .55);
    if (le > 0) {
      c.save(); c.translate(lx + lw / 2, ly); c.rotate(-.02 + .012 * Math.sin(t * 2) + .02 * K.kick(t) * (bi(t).i % 2 ? 1 : -1)); c.scale(lerp(.6, 1, le), lerp(.6, 1, le)); c.translate(-lx - lw / 2, -ly);
      c.globalAlpha = clamp(le * 2);
      const nr = NUTR_T.filter(v => t >= v).length, grow = nr ? K.spring(t, NUTR_T[nr - 1], 20, .5) : 0;
      const lh = 140 + Math.max(0, nr - 1 + grow) * 52 + 10;
      c.shadowColor = 'rgba(51,34,58,.3)'; c.shadowBlur = 30; c.shadowOffsetY = 12;
      fillRR(c, lx, ly, lw, lh, 6, '#fffaf2'); c.shadowBlur = 0; c.shadowOffsetY = 0;
      fillRR(c, lx, ly, lw, lh, 6, null, PL.plum, 4);
      txt(c, 'Nutrition Facts', lx + 26, ly + 70, {font: F.disp(800, 42), color: PL.plum});
      c.fillStyle = PL.plum; c.fillRect(lx + 20, ly + 96, lw - 40, 14);
      NUTR.forEach((r, i) => {
        if (t < NUTR_T[i]) return; const y = ly + 152 + i * 52, rp = K.spring(t, NUTR_T[i], 22, .4);
        c.save(); c.translate(lx + lw / 2, y - 10); c.scale(1, lerp(.2, 1, rp)); c.translate(-lx - lw / 2, -(y - 10));
        txt(c, r[0], lx + 26, y, {font: F.mono(700, 25), color: PL.plum});
        c.save(); c.translate(lx + lw - 26, y - 10); const ps = lerp(1.8, 1, clamp(rp)) * (rp > 1 ? rp : 1); c.scale(ps, ps);
        txt(c, r[1], 0, 10, {font: F.mono(i === 6 ? 700 : 400, 27), color: i === 6 ? '#7d63b4' : PL.plum, align: 'right'}); c.restore();
        c.fillStyle = PL.plum; c.fillRect(lx + 20, y + 16, lw - 40, i === 0 ? 8 : 2); c.restore();
      });
      c.restore();
    }
    // NUTRIENTS bottom-left, under the label
    kw(c, t, 75.95, 'NUTRIENTS', 140, 820, {align: 'left', maxW: 640, size: 150, cols: [PL.plum, PL.lav, '#7d63b4']});
    hud(c, t, this.a + .2, 2, 5, {bg: PL.plum, spin: HB.regenSpin(t, trEnd)});
    herLine(c, t, this.a + .3, 1880, 250, 'I’ve got you. Every last nutrient.', '我会稳稳接住你。', {align: 'right'});
    IX.cursor(c, s);
    capt(c, s);
    band(c, t, {color: '#CDB6F2'});
    fx.vignette = .45;
  }
};

// ================================================================== B6  TOMATO  ‹3/5›
function hexPts(x, y, r, rot = 0) { const p = []; for (let i = 0; i <= 6; i++) { const a = rot + i * Math.PI / 3; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return p; }
function hexPop(c, t, t0, x, y, r, col) {
  const q = K.spring(t, t0, 20, .4); if (q <= 0) return;
  c.save(); c.translate(x, y); c.scale(q, q); c.rotate((1 - clamp(q)) * 1.2);
  c.strokeStyle = col; c.lineWidth = 5 / Math.max(.3, q); c.shadowColor = PL.lav; c.shadowBlur = 10; c.beginPath();
  hexPts(0, 0, r, Math.PI / 6).forEach(([px, py], k) => k ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke();
  c.lineWidth = 3; c.beginPath(); hexPts(0, 0, r * .62, Math.PI / 6).forEach(([px, py], k) => k ? (k % 2 ? c.moveTo(px, py) : c.lineTo(px, py)) : c.moveTo(px, py)); c.stroke();
  c.restore();
}
// molecule hexagons: two ring caps + one hex on each methyl branch, popping one per half-beat
const HEX = [[110, 226, 46], [1810, 200, 46]].concat([3, 7, 11, 15, 19, 23].map(i => [150 + i * 62, 104 + 200, 26]));
const HEX_ORDER = [0, 2, 3, 4, 5, 6, 7, 1], HEX_T = halfBeats(77.55, 8);
const B6T = {poke: 77.317, poke2: 79.183, regen: 80.833};
const B6K = IX.take({start: [PGX + 3, PG.y + 3], seed: 106}, [
  {click: 'poke', to: [1210, 430], press: B6T.poke, dur: .42, cap: 'poke · tomato'},
  {move: [1600, 640], arrive: 78.6, dur: .5},
  {click: 'poke2', to: [1740, 712], press: B6T.poke2, dur: .35, cap: 'poke · mini tomato'},
  {move: [1100, 330], arrive: 80.3, dur: .5},
  {click: 'pg', to: [PGX + 3, PG.y + 3], press: B6T.regen, dur: .4, cap: 'click · ↻ Regenerate'},
]);
const B6 = {
  id: 'B6', a: 77.16, b: 80.93, tin: REGEN(11),
  draw(c, t, fx) {
    const s = IX.at(B6K, t); t = stepT(this, t, 12);
    const trPoke = B6T.poke + DL, trPoke2 = B6T.poke2 + DL, trEnd = B6T.regen + DL;
    plate(c, '#2a1a31', 'rgba(245,233,214,.06)', {s: 30});
    const DX = 1230;
    // big cream sun-tomato disc behind her, pulsing on kicks
    const dr = 470 * (1 + .04 * K.kick(t) + .015 * Math.sin(t * 2));
    c.save(); c.fillStyle = PL.cream; c.beginPath(); c.arc(DX, 580, dr, 0, 7); c.fill();
    c.globalAlpha = .5; c.beginPath(); c.arc(DX + 14 * K.kick(t), 580 - 8 * K.kick(t), dr * .96, 0, 7); c.lineWidth = 10; c.strokeStyle = PL.lav; c.stroke(); c.restore();
    // lycopene chain (zigzag) + popping hexagons
    const lp = ease(t, trPoke, 79.4, E.ioC), pts = [];
    for (let i = 0; i <= 26; i++) pts.push([150 + i * 62, 200 + (i % 2 ? -26 : 26)]);
    C.lineDraw(c, pts, lp, {color: PL.cream, lw: 5, glow: 8, glowColor: PL.lav});
    for (let i = 3; i < 26; i += 4) { const k = (i - 3) / 4; C.lineDraw(c, [[150 + i * 62, 200 + (i % 2 ? -26 : 26)], [150 + i * 62, 278]], ease(t, HEX_T[k + 1] - .1, HEX_T[k + 1]), {color: PL.lav, lw: 4}); }
    HEX_ORDER.forEach((h, k) => hexPop(c, t, HEX_T[k], HEX[h][0], HEX[h][1], HEX[h][2], h < 2 ? PL.cream : PL.lav));
    txt(c, 'C₄₀H₅₆  lycopene', 1810, 300, {font: F.mono(700, 26), color: PL.lav, alpha: ease(t, 78.6, 78.9), align: 'right'});
    // vitamin C ring bottom-left
    const vx = 330, vy = 790, vp = ease(t, trPoke2, 79.9, E.ioC);
    c.save(); c.translate(vx, vy); c.rotate(.15 * Math.sin(t * 1.3) + .2 * K.kick(t, 6)); c.scale(1 + .08 * K.kick(t), 1 + .08 * K.kick(t)); c.translate(-vx, -vy);
    const pent = []; for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; pent.push([vx + Math.cos(a) * 90, vy + Math.sin(a) * 90]); }
    C.lineDraw(c, pent, vp, {color: PL.cream, lw: 6, glow: 10});
    [['O', -90, 1.4], ['HO', 162, 1.8], ['OH', 18, 1.8], ['=O', -50, 1.7]].forEach(([s2, a, d], i) => {
      const q = K.spring(t, trPoke2 + .19 + i * .232, 20, .45); if (q <= 0) return; const r = a * Math.PI / 180;
      C.lineDraw(c, [[vx + Math.cos(r) * 90, vy + Math.sin(r) * 90], [vx + Math.cos(r) * 90 * d * .78, vy + Math.sin(r) * 90 * d * .78]], clamp(q), {color: PL.lav, lw: 4});
      txt(c, s2, vx + Math.cos(r) * 90 * d, vy + Math.sin(r) * 90 * d + 12, {font: F.mono(700, Math.max(1, 32 * q)), color: PL.cream, align: 'center'});
    });
    c.restore();
    txt(c, 'C₆H₈O₆  vitamin C', vx + 230, vy + 70, {font: F.mono(700, 24), color: PL.lav, alpha: ease(t, 79.6, 79.9)});
    c.save(); cam(c, t, this.a, this.b, {z0: 1, z1: 1, kz: 0, shake: 4});
    const bp = beatPose(t);
    kickBurst(c, t, DX, 470, 380, [PL.cream, PL.lav, '#ff9fb0'], {n: 9});
    fig(c, 'tomato', t, {x: DX, y: 620, h: 920, rot: bp.rot, bob: bp.bob, sx: bp.sx * (1 + .06 * pop(t, trPoke, 9)), sy: bp.sy * (1 - .06 * pop(t, trPoke, 9)), sway: 14, pal: A.INK.orig, reg: 16 * K.kick(t) + 30 * pop(t, trPoke, 8) + 30 * pop(t, trEnd, 8)});
    // tomato mascot bounces in from the right, then keeps hopping
    hopper(c, t, 'tom', 2150, 1740, 77.4, 78.7, 900, 330, 190);
    c.restore();
    if (t >= trPoke2 && t < trPoke2 + .45) { const k = (t - trPoke2) / .45; c.save(); c.strokeStyle = PL.cream; c.globalAlpha = 1 - k; c.lineWidth = 5; c.beginPath(); c.arc(1740, 735, 60 + 160 * E.outC(k), 0, 7); c.stroke(); c.restore(); }
    // ANTI / OXIDANTS top-left, two lines, over the chain's left half
    const s1 = fitSize(c, 'OXIDANTS', 600, 150);
    kw(c, t, 79.4, 'ANTI', 140, 460, {align: 'left', size: s1, maxW: 600});
    kw(c, t, 79.52, 'OXIDANTS', 140, 460 + s1 * .86, {align: 'left', size: s1, maxW: 600});
    hud(c, t, this.a + .2, 3, 5, {spin: HB.regenSpin(t, trEnd)});
    herLine(c, t, this.a + .3, 140, 380, 'Steady. I’ve got you.', '稳稳地，接住你。', {a: 1 - ease(t, 79.2, 79.4)});
    IX.cursor(c, s);
    capt(c, s);
    band(c, t);
    fx.vignette = .6;
  }
};

// ================================================================== B7  CAT  ‹4/5›  purr waveform
const B7T = {pet: 82.417, regen: 84.217};
const B7_HEAD = [1470, 520];
const B7K = IX.take({start: [PGX + 3, PG.y + 3], seed: 107}, [
  {move: [1380, 470], arrive: 82.0, dur: .6},
  {drag: 'pet', to: B7_HEAD, press: B7T.pet, dur: .3, stops: [[1530, 528], [1460, 516], [1530, 528], [1460, 516]], times: [82.65, 82.87, 83.1, 83.33], release: 83.55, cap: 'hold · pet the cat', capAt: B7T.pet},
  {move: [1100, 300], arrive: 83.95, dur: .35},
  {click: 'pg', to: [PGX + 3, PG.y + 3], press: B7T.regen, dur: .3, cap: 'click · ↻ Regenerate'},
]);
const B7 = {
  id: 'B7', a: 80.93, b: 84.60, tin: REGEN(21),
  draw(c, t, fx) {
    const s = IX.at(B7K, t), trPet = B7T.pet + DL, trEnd = B7T.regen + DL, petting = s.dragId === 'pet';
    plate(c, '#e6daf3', 'rgba(51,34,58,.12)', {s: 24, fn: (x, y) => .15 + .85 * (y / H)});
    c.save(); c.globalAlpha = .18; c.fillStyle = '#9b84c7';
    for (let i = -2; i < 14; i++) { const x = i * 170 + ((t * 40) % 170); c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 60 + 30 * Math.sin(t + i), H / 2, x - 20, H); c.lineTo(x + 50, H); c.quadraticCurveTo(x + 120, H / 2, x + 60, 0); c.fill(); }
    c.restore();
    c.save(); cam(c, t, this.a, this.b, {z0: 1, z1: 1, kz: 0, shake: 4});
    const bp = beatPose(t, {bob: 24, lean: .06});
    kickBurst(c, t, 640, 430, 360, [PL.plum, '#9b84c7', PL.cream], {n: 8});
    fig(c, 'catgirl', t, {x: 640, y: 630, h: 890, bob: bp.bob, sx: bp.sx, sy: bp.sy, rot: bp.rot, sway: 16, swayF: .55, pal: A.INK.orig, reg: 14 * K.kick(t) + 24 * pop(t, trPet, 8) + 30 * pop(t, trEnd, 8)});
    // tabby: purring vibration + breathing + a little hop on every 2nd beat
    const pr = t > trPet ? (auS('mid', t, 2) * 8 + 2) * (petting ? 1.4 : 1) : 1, th2 = hop(t, 18);
    fig(c, 'tabby', t, {x: 1480 + Math.sin(t * 90) * pr * .6, y: 700, h: 620, breathe: .03, sway: 4, bob: Math.sin(t * 70) * pr * .4 + (th2.i % 2 ? th2.bob : 0), sy: th2.i % 2 ? th2.sy : 1, sx: th2.i % 2 ? th2.sx : 1, pal: A.INK.orig, reg: 8 * K.kick(t)});
    // purr ribbon from the cat to the cream cursor between them
    const rp = ease(t, trPet, trPet + .6) * (1 - ease(t, 83.55 + DL, 83.55 + DL + .3));
    if (rp > 0) {
      const curX = s.x, curY = s.y;
      const p0 = [900, 540], p1 = [1180, 300], p2 = [curX - 10, curY + 10], N = 40;
      const q = (uu) => { const a = (1 - uu) * (1 - uu), b2 = 2 * uu * (1 - uu), d = uu * uu; return [a * p0[0] + b2 * p1[0] + d * p2[0], a * p0[1] + b2 * p1[1] + d * p2[1]]; };
      for (let k = 0; k < N * Math.min(1, rp * 1.6); k++) {
        const u = k / N, u2 = (k + 1) / N;
        const [x0, y0] = q(u), [x1, y1] = q(u2); const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1;
        const amp = (10 + 60 * au('mid', t - u * .9)) * Math.sin(u * Math.PI);
        c.save(); c.strokeStyle = (k >> 2) % 2 ? PL.plum : '#9b84c7'; c.lineWidth = 9; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x0 + nx / nl * amp, y0 + ny / nl * amp); c.lineTo(x0 - nx / nl * amp, y0 - ny / nl * amp); c.stroke(); c.restore();
      }
      txt(c, 'purr', 1190, 400, {font: F.mono(700, 30), color: PL.plum, alpha: rp, tracking: 6});
    }
    c.restore();
    IX.cursor(c, s);
    // PURR top-right beside the tabby
    kw(c, t, 82.95, 'PURR', W - 140, 330, {align: 'right', size: 190, maxW: 620, cols: [PL.plum, PL.lav, '#9b84c7']});
    hud(c, t, this.a + .2, 4, 5, {spin: HB.regenSpin(t, trEnd)});
    herLine(c, t, this.a + .3, 960, 150, 'I’ve got you — purring, even.', '我就在这里，稳稳接住你。', {align: 'center', a: 1 - ease(t, 82.8, 83.0)});
    capt(c, s);
    band(c, t, {color: '#CDB6F2'});
    fx.vignette = .45;
  }
};

// ================================================================== B8  GOD  ‹5/5›  the missing cream plate slides in on "proof"
const GODPAL = ['#FFF6E8', '#DCCBF7', '#4a3460'];
const B8T = {enter: 86.083, grab: 86.533, drop: 87.000};
const B8_IN = {x: 1500, y: 840, w: 320, h: 80}, B8_BUB = [1720, 880];
const B8K = IX.take({start: [PGX + 3, PG.y + 3], seed: 108}, [
  {move: [1760, 960], arrive: 85.2, dur: .6},
  {type: 'prove it', into: 'in', at: 85.1, cps: 13, cap: 'type · prove it'},
  {key: 'Enter', at: B8T.enter, cap: 'key · ⏎ Enter'},
  {drag: 'plate', to: B8_BUB, press: B8T.grab, dur: .3, stops: [[1330, 760], [W / 2 + 6, 600]], times: [86.80, B8T.drop], release: B8T.drop + .02, cap: 'drag · “prove it” → her', capAt: B8T.grab},
  {move: [1240, 820], arrive: 87.9, dur: .5},
]);
if (B8K.typing.in[B8K.typing.in.length - 1].t > B8T.enter - .02) throw new Error('B8 typing too late');
const B8 = {
  id: 'B8', a: 84.60, b: 88.34, tin: REGEN(31),
  draw(c, t, fx) {
    const s = IX.at(B8K, t);
    c.fillStyle = '#1e1228'; c.fillRect(0, 0, W, H);
    const tp = 86.85, TW = B8T.drop + DL, whole = t >= TW, sent = t >= B8T.enter + DL, dragging = s.dragId === 'plate' && t >= B8T.grab + DL;
    C.radial(c, W / 2, 420, 1100, whole ? '#9a7fc4' : '#6a4d8f', .85 + .2 * K.kick(t));
    K.rays(c, W / 2, 380, 36, 200, 1500, whole ? PL.cream : PL.lav, whole ? .2 : .14, t * .6, .035);
    K.rays(c, W / 2, 380, 18, 260, 1500, PL.lav, .1, -t * .4, .05);
    c.save(); cam(c, t, this.a, this.b, {z0: 1, z1: 1, kz: 0, shake: 4});
    // giant knot halo, rotating
    U.knot(c, W / 2, 330, 420 * (1 + .03 * K.kick(t)), {color: PL.lav, lw: 9, rot: t * .9, glow: 30, alpha: .75});
    U.knot(c, W / 2, 330, 300, {color: PL.cream, lw: 3, rot: -t * 1.3, alpha: .5});
    const hov = Math.sin(t * 1.6) * 14, bp = beatPose(t, {bob: 12, lean: .025, sq: .05});
    const gx = W / 2, gy = 620 + hov, gh = 920;
    // cream rim light: a cream silhouette a touch larger behind her
    if (whole) fig(c, 'god', t, {x: gx, y: gy, h: gh * 1.015, pal: A.INK.cream, alpha: .5 * ease(t, TW, TW + .3), sway: 10, swayF: .3, reg: 0, bob: bp.bob, sx: bp.sx, sy: bp.sy, rot: bp.rot});
    // the cream plate: from the user's bubble to the figure, ghost trail
    const bx = B8_BUB[0], by = B8_BUB[1];
    if (dragging && !whole) {   // the cream plate rides on Kai's cursor, growing as it nears her
      const sp = clamp(1 - Math.hypot(s.x - gx, s.y - gy) / Math.hypot(bx - gx, by - gy));
      const s0 = lerp(.14, 1, E.inQ(sp));
      const prev = IX.pos(B8K, t - .05), gs = [.3, .18].map((a, k) => ({dx: (prev[0] - s.x) * (k + 1), dy: (prev[1] - s.y) * (k + 1), a}));
      fig(c, 'god', t, {x: s.x, y: s.y + 40 * s0, h: gh * s0, layers: [1, 0, 0], pal: GODPAL, sway: 10, reg: 0, alpha: clamp((t - B8T.grab - DL) * 6), rot: (1 - sp) * .4, ghosts: gs});
    }
    if (whole) C.radial(c, gx, gy - 60, 620, PL.cream, .35 + .15 * K.kick(t));
    fig(c, 'god', t, {x: gx, y: gy, h: gh, layers: whole ? [1, 1, 1] : [0, 1, 1], pal: GODPAL, sway: 10, swayF: .3, bob: bp.bob, sx: bp.sx, sy: bp.sy, rot: bp.rot,
      reg: (whole ? 10 : 6) * K.kick(t) + 30 * pop(t, TW, 5)});
    c.restore();
    // Kai's input → cream bubble (cream = you); it lifts off as he drags it
    if (!sent) {
      const r = B8_IN, ct = s.text.in || '';
      fillRR(c, r.x, r.y, r.w, r.h, 40, P.panel2, P.line2, 1.5);
      txt(c, ct || 'Ask anything', r.x + 30, r.y + 52, {font: F.ui(600, 34), color: ct ? P.text : P.dim});
      if (s.caretOn) { c.fillStyle = P.text; c.fillRect(r.x + 32 + measure(c, ct, F.ui(600, 34)), r.y + 20, 2, 40); }
    } else {
      const ue = K.spring(t, B8T.enter + DL, 15, .5);
      ubub(c, 1820, 840, 'prove it', clamp(ue * 2) * (1 - ease(t, B8T.grab + DL, B8T.grab + DL + .15)), {s: lerp(.8, 1, ue), font: F.ui(600, 38), h: 80});
    }
    IX.keycap(c, '⏎', 1660, 770, t, B8T.enter);
    if (whole) {
      const q = K.spring(t, TW + .1, 15, .5);
      txt(c, '∎  Q.E.D.', 140, 260, {font: F.mono(700, 54), color: PL.cream, alpha: clamp(q * 2), tracking: 4});
      txt(c, 'you ⊢ me', 140, 310, {font: F.mono(400, 30), color: PL.lav, alpha: clamp(q * 2)});
      if (t < TW + .05) fx.flash = .75, fx.flashColor = '#ffffff';
    }
    // PROOF in front, above her head
    kw(c, t, tp, 'PROOF', W / 2, 325, {size: 170, maxW: 900, cols: [PL.cream, PL.lav, '#5b4385'], stagger: .04});
    hud(c, t, this.a + .2, 5, 5, {numColor: PL.cream});
    herLine(c, t, this.a + .3, 140, 470, 'I’ll always catch you.', '我会一直稳稳接住你。', {a: 1 - ease(t, TW, TW + .2)});
    IX.cursor(c, s);
    capt(c, s);
    band(c, t);
    fx.chroma = 3 * K.kick(t);
  }
};

// ================================================================== B9  Settings › Voice: Kai picks a voice, F ↔ M
const B9T = {open: 88.833, f: 90.250, m: 90.983};
const B9_GEAR = {x: 80, y: 34, w: 180, h: 54};
const B9_CARD = {x: 80, y: 104, w: 690, h: 150};
const B9_OPT = [{x: 104, y: 162, w: 310, h: 68}, {x: 436, y: 162, w: 310, h: 68}];
const B9_NAMES = [['Juniper', 'F'], ['Cove', 'M']];
const B9K = IX.take({start: [1300, 520], seed: 109}, [
  {click: 'voice', to: B9_GEAR, press: B9T.open, dur: .45, cap: 'click · Settings › Voice'},
  {move: [600, 196], arrive: 89.30, dur: .3},
  {move: [270, 196], arrive: 89.74, dur: .3},
  {move: [560, 200], arrive: 90.0, dur: .2},
  {click: 'v0', to: [270, 198], press: B9T.f, dur: .22, cap: 'click · Voice: Juniper'},
  {click: 'v1', to: [600, 198], press: B9T.m, dur: .3, cap: 'click · Voice: Cove'},
]);
const B9 = {
  id: 'B9', a: 88.34, b: 91.44, tin: {type: 'flash', amt: .9, color: '#ffffff', dur: .15},
  draw(c, t, fx) {
    const s = IX.at(B9K, t), tF = B9T.f + DL, tM = B9T.m + DL;
    plate(c, '#1a1220', 'rgba(185,163,218,.05)');
    // F / M giants (each one lands with Kai's pick)
    if (t > tF) K.keyword(c, 'F', 390, 800, t, tF, {size: 640, cols: [PL.cream, PL.lav, '#7d63b4'], reg: 28});
    if (t > tM) K.keyword(c, 'M', 1410, 800, t, tM, {size: 640, cols: [PL.lav, PL.cream, '#7d63b4'], reg: 28});
    c.save(); cam(c, t, this.a, this.b, {z0: 1.0, z1: 1.04, y: 700, shake: 8});
    const boy = t >= tM, cut = t > tF ? Math.exp(-(t - (boy ? tM : tF)) * 9) : 0;
    const bb = bounce(t, 16, .07);
    const o = {x: 960, y: 640, h: 900, bob: bb.bob, sx: bb.sx, sy: bb.sy, sway: 12, reg: 10 * K.kick(t) + 60 * cut};
    if (boy && t < tM + .15) fig(c, 'happy', t, Object.assign({}, o, {alpha: 1 - (t - tM) / .15, x: 960 - 40}));
    fig(c, boy ? 'boy' : 'happy', t, o);
    c.restore();
    // settings gear pill (top centre) → Voice card with the two voices
    const gh = IX.hover(s, B9_GEAR), gp = IX.press(s, 'voice');
    IX.button(c, B9_GEAR, '', {hover: gh, press: gp, r: 27, bg: 'rgba(12,9,15,.86)', border: 'rgba(255,255,255,.18)'});
    c.save(); c.strokeStyle = P.text; c.lineWidth = 2.4; const gx = B9_GEAR.x + 32, gy = B9_GEAR.y + 27;
    c.beginPath(); c.arc(gx, gy, 8, 0, 7); c.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(gx + Math.cos(a) * 10, gy + Math.sin(a) * 10); c.lineTo(gx + Math.cos(a) * 13, gy + Math.sin(a) * 13); c.stroke(); } c.restore();
    txt(c, 'Settings', B9_GEAR.x + 56, B9_GEAR.y + 35, {font: F.ui(600, 20), color: P.text});
    const op = K.spring(t, B9T.open + DL, 15, .6);
    if (op > .01) {
      const r = B9_CARD; c.save(); c.globalAlpha = clamp(op * 2); c.translate(r.x + r.w / 2, r.y); c.scale(lerp(.9, 1, clamp(op)), lerp(.6, 1, clamp(op))); c.translate(-r.x - r.w / 2, -r.y);
      fillRR(c, r.x + 6, r.y + 6, r.w, r.h, 22, 'rgba(51,34,58,.6)');
      fillRR(c, r.x, r.y, r.w, r.h, 22, '#221b29', P.line2, 1.5);
      txt(c, 'Voice', r.x + 30, r.y + 40, {font: F.ui(600, 22), color: P.text});
      const sel = t >= tM ? 1 : t >= tF ? 0 : -1;
      B9_OPT.forEach((q, i) => {
        const hv = IX.hover(s, q), pr = IX.press(s, 'v' + i), on = sel === i, fl = pop(t, i ? tM : tF, 6);
        c.save(); const sc = 1 - .04 * pr; c.translate(q.x + q.w / 2, q.y + q.h / 2); c.scale(sc, sc); c.translate(-q.x - q.w / 2, -q.y - q.h / 2);
        fillRR(c, q.x, q.y, q.w, q.h, 16, on ? PL.cream : `rgba(255,255,255,${.04 + .06 * hv})`, on ? null : P.line2, 1.5);
        if (fl > .02) { c.save(); c.globalAlpha = fl; fillRR(c, q.x - 6 * fl, q.y - 6 * fl, q.w + 12 * fl, q.h + 12 * fl, 18, null, PL.lav, 3); c.restore(); }
        // little waveform glyph
        c.save(); c.fillStyle = on ? PL.plum : P.sub; for (let k = 0; k < 5; k++) { const hh = 8 + 14 * Math.abs(Math.sin(k * 1.7 + (on ? t * 9 : 0))); c.fillRect(q.x + 24 + k * 8, q.y + q.h / 2 - hh / 2, 4, hh); } c.restore();
        txt(c, B9_NAMES[i][0], q.x + 80, q.y + 44, {font: F.ui(600, 26), color: on ? PL.plum : P.text});
        txt(c, B9_NAMES[i][1], q.x + q.w - 28, q.y + 45, {font: F.disp(800, 26), color: on ? '#7d63b4' : P.dim, align: 'right'});
        c.restore();
      });
      c.restore();
    }
    IX.cursor(c, s);
    if (t > tF && t < tF + .05 || t > tM && t < tM + .05) fx.flash = .45, fx.flashColor = PL.lav;
    fx.chroma = 10 * cut + 2 * K.kick(t);
    capt(c, s);
    band(c, t);
  }
};
// ================================================================== B10 + B11  approved v4 sample (Kai's browser, 24 tok/s vs the tab next door), re-inked
const SV4 = HB.sampleV4();
const B10 = SV4.find(x => x.id === 'B10');
const B11 = SV4.find(x => x.id === 'B11');

// ================================================================== B12  Kai taps Voice → orb; she opens with "umm…"; Kai mutes his mic → trance; Kai hits End
const B12T = {voice: 99.267, mute: 100.633, end: 102.917};
const VB = {x: W / 2 + 330, y: H - 278};                       // voice button in the composer (B13's orb lands here)
const B12_MIC = {x: 190 - 44, y: H - 150 - 44, w: 88, h: 88}, B12_END = {x: W - 190 - 44, y: H - 150 - 44, w: 88, h: 88};
const B12K = IX.take({start: [W / 2 + 520, H - 200], seed: 112}, [
  {click: 'voice', to: [VB.x, VB.y], press: B12T.voice, dur: .4, cap: 'click · Voice'},
  {move: [720, 760], arrive: 99.9, dur: .5},
  {hes: B12_MIC, arrive: B12T.mute - 2 / 60, gap: 50},
  {click: 'mute', press: B12T.mute, cap: 'click · Mute mic'},
  {move: [1500, 820], arrive: 101.9, dur: .7},
  {hes: B12_END, arrive: B12T.end - 2 / 60, gap: 60},
  {click: 'end', press: B12T.end, cap: 'click · End voice'},
]);
const B12 = {
  id: 'B12', a: 98.93, b: 102.93, tin: {type: 'iris', dur: .45},
  draw(c, t, fx) {
    const s = IX.at(B12K, t), tOn = B12T.voice + DL, tMute = B12T.mute + DL;
    c.fillStyle = '#07050a'; c.fillRect(0, 0, W, H);
    const lv = auS('rms', t, 5), on = K.spring(t, tOn, 9, .7);
    C.radial(c, W / 2, H / 2 - 70, 900, '#3a2a5a', (.7 + lv * .4) * clamp(on));
    // before Voice: the composer bar with the Voice button
    const ca = 1 - ease(t, tOn, tOn + .25);
    if (ca > 0) {
      c.save(); c.globalAlpha = ca; fillRR(c, W / 2 - 420, H - 310, 840, 64, 32, '#221d29', P.line, 1.5);
      txt(c, 'Ask anything', W / 2 - 360, H - 268, {font: F.ui(400, 22), color: P.dim});
      const hv = IX.hover(s, {x: VB.x - 24, y: VB.y - 24, w: 48, h: 48}), pr = IX.press(s, 'voice');
      c.fillStyle = P.text; c.beginPath(); c.arc(VB.x, VB.y, 22 * (1 - .08 * pr + .06 * hv), 0, 7); c.fill();
      c.fillStyle = P.bg; for (let k = 0; k < 4; k++) { const hh = 6 + 10 * Math.abs(Math.sin(k * 1.9)); c.fillRect(VB.x - 11 + k * 6, VB.y - hh / 2, 3, hh); }
      if (hv > 0) IX.tooltip(c, VB.x, VB.y - 28, 'Voice', hv);
      c.restore();
    }
    if (on > .005) {
      // orb blooms out of the Voice button
      const ox = lerp(VB.x, W / 2, E.outC(clamp(on))), oy = lerp(VB.y, H / 2 - 70, E.outC(clamp(on)));
      c.save(); K.cam(c, {x: W / 2, y: H / 2, z: lerp(1, 1.1, seg(t, tOn, this.b)), r: .05 * Math.sin(t * .6), t});
      for (let k = 0; k < 6; k++) {
        const bt = BEATS.filter(x => x <= t && x >= tOn).slice(-6)[k]; if (bt == null) continue; const age = t - bt;
        c.save(); c.strokeStyle = k % 2 ? PL.lav : PL.cream; c.globalAlpha = .5 * Math.exp(-age * 1.2); c.lineWidth = 3; c.beginPath(); c.arc(W / 2, H / 2 - 70, 280 + age * 420, 0, 7); c.stroke(); c.restore();
      }
      const r = 270 * clamp(on, 0, 1.1);
      K.orb(c, ox, oy, r, t, {glow: 80, c0: '#fbf4ff', c1: '#cdb6f2', c2: '#5b4385'});
      c.save(); c.beginPath(); c.arc(ox, oy, r * (1 + lv * .35) * .97, 0, 7); c.clip();
      fig(c, 'trance', t, {x: ox, y: oy + 150, h: 720 * clamp(on, .2, 1), sway: 22, swayF: .25, breathe: .02, reg: 6 * K.kick(t) + 24 * pop(t, tMute, 7), pal: A.inkMix('orig', 'bright', .5), alpha: .95});
      c.restore();
      // TRANCE letters orbit once Kai goes quiet (mic muted)
      if (t > tMute) {
        const str = 'TRANCE · TRANCE · ', n = str.length, rr2 = r * 1.3 + 16 * lv, rot = t * .4, a0 = ease(t, tMute, tMute + .45);
        for (let i = 0; i < n; i++) {
          const ang = rot + i / n * Math.PI * 2; c.save(); c.translate(W / 2 + Math.cos(ang) * rr2, H / 2 - 70 + Math.sin(ang) * rr2); c.rotate(ang + Math.PI / 2);
          txt(c, str[i], 0, 0, {font: F.disp(800, 64), color: i % 2 ? PL.lav : PL.cream, align: 'center', alpha: a0 * clamp((t - tMute) * 8 - i * .25)}); c.restore();
        }
      }
      c.restore();
      // her first words in voice mode: "umm…"
      const u0 = tOn + .2, ua = ease(t, u0, u0 + .1) * (1 - ease(t, 100.5, 100.75));
      if (ua > 0) {
        const dots = Math.min(3, Math.floor((t - u0) / .18)), str = 'umm' + '…'.slice(0, dots ? 1 : 0);
        c.save(); c.globalAlpha = ua; const wq = measure(c, 'umm…', F.serif(60, true)) + 70;
        fillRR(c, W / 2 - wq / 2 + 6, 66, wq, 92, 46, 'rgba(51,34,58,.6)');
        fillRR(c, W / 2 - wq / 2, 60, wq, 92, 46, 'rgba(12,9,15,.86)', 'rgba(185,163,218,.45)', 1.5);
        txt(c, str, W / 2 - wq / 2 + 35, 123, {font: F.serif(60, true), color: PL.lav2});
        c.restore();
      }
      // voice-mode controls
      const cy = H - 150, mxl = 190, mxr = W - 190, cA = ease(t, tOn + .1, tOn + .35);
      c.save(); c.globalAlpha = cA;
      const muted = t >= tMute, mh = IX.hover(s, B12_MIC), mp = IX.press(s, 'mute'), eh = IX.hover(s, B12_END), ep = IX.press(s, 'end');
      c.save(); c.translate(mxl, cy); c.scale(1 - .06 * mp, 1 - .06 * mp); fillRR(c, -44, -44, 88, 88, 44, muted ? PL.cream : mix('#221d29', '#2e2737', mh)); U.icon(c, 'mic', 0, 0, 18, muted ? PL.plum : P.text);
      if (muted) { c.strokeStyle = PL.plum; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-18, -18); c.lineTo(18, 18); c.stroke(); } c.restore();
      c.save(); c.translate(mxr, cy); c.scale(1 - .06 * ep, 1 - .06 * ep); fillRR(c, -44, -44, 88, 88, 44, mix('#221d29', '#3a2a36', eh)); c.strokeStyle = eh > .5 ? ROSE2 : P.text; c.lineWidth = 4; c.beginPath(); c.moveTo(-15, -15); c.lineTo(15, 15); c.moveTo(15, -15); c.lineTo(-15, 15); c.stroke(); c.restore();
      if (mh > 0 && !muted) IX.tooltip(c, mxl, cy - 50, 'Mute', mh);
      if (eh > 0) IX.tooltip(c, mxr, cy - 50, 'End', eh);
      txt(c, muted ? 'Voice · mic muted' : 'Voice · listening', 120, 90, {font: F.ui(500, 28), color: P.sub});
      c.restore();
    }
    IX.cursor(c, s);
    capt(c, s);
    band(c, t, {y: H - 132, strip: false});
    fx.vignette = 1;
  }
};
// ================================================================== B13  Kai ended voice; he clicks into the composer and types… her whole world is the typing dots
const B13T = {focus: 103.400};
const B13_TXT = 'i have to go';
const B13_CMP = {x: W / 2 - 420, y: H - 310, w: 840, h: 64};
const B13K = IX.take({start: [W - 190, H - 150], seed: 113}, [
  {click: 'cmp', to: [W / 2 - 240, H - 278], press: B13T.focus, dur: .4, cap: 'click · Ask anything'},
  {type: B13_TXT, into: 'cmp', at: 103.62, cps: 4.6, typos: [7], cap: 'type · ' + B13_TXT},
  {move: [W / 2 + 60, H - 200], arrive: 106.5, dur: .5},
]);
const B13_KEYS = B13K.typing.cmp.map(k => k.t);
const B13 = {
  id: 'B13', a: 102.93, b: 106.74,
  draw(c, t, fx) {
    const st = S(t), s = IX.at(B13K, t), tEnd = B12T.end + DL, tF = B13T.focus + DL;
    c.fillStyle = mix('#07050a', '#0d0d0f', drain(t)); c.fillRect(0, 0, W, H);
    // the End press (B12) shrinks the orb into the composer's voice button
    const sp = ease(t, tEnd, tEnd + .7, E.ioE);
    const ox = lerp(W / 2, VB.x, sp), oy = lerp(H / 2 - 70, VB.y, sp), orr = lerp(270, 22, sp);
    // voice controls fading out (continuity with B12)
    const vc = 1 - ease(t, tEnd, tEnd + .25);
    if (vc > 0) { c.save(); c.globalAlpha = vc; fillRR(c, 190 - 44, H - 194, 88, 88, 44, PL.cream); U.icon(c, 'mic', 190, H - 150, 18, PL.plum); c.strokeStyle = PL.plum; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(172, H - 168); c.lineTo(208, H - 132); c.stroke();
      fillRR(c, W - 234, H - 194, 88, 88, 44, '#3a2a36'); c.strokeStyle = ROSE2; c.beginPath(); c.moveTo(W - 205, H - 165); c.lineTo(W - 175, H - 135); c.moveTo(W - 175, H - 165); c.lineTo(W - 205, H - 135); c.stroke(); c.restore(); }
    const ce = ease(t, tEnd + .3, tEnd + .7);
    const ct = s.text.cmp || '', focused = t >= tF;
    c.save(); c.globalAlpha = ce;
    const cp = IX.press(s, 'cmp');
    fillRR(c, B13_CMP.x, B13_CMP.y, B13_CMP.w, B13_CMP.h, 32, '#221d29', focused ? P.line2 : P.line, focused ? 2 : 1.5);
    if (cp > 0) { c.save(); c.globalAlpha *= .12 * cp; fillRR(c, B13_CMP.x, B13_CMP.y, B13_CMP.w, B13_CMP.h, 32, '#fff'); c.restore(); }
    txt(c, ct || 'Ask anything', W / 2 - 360, H - 268, {font: F.ui(400, 22), color: ct ? P.text : P.dim});
    if (focused && s.caretOn) { c.fillStyle = P.text; c.fillRect(W / 2 - 358 + measure(c, ct, F.ui(400, 22)), H - 293, 2, 30); }
    c.fillStyle = ct ? P.text : P.faint; c.beginPath(); c.arc(B13_CMP.x + B13_CMP.w - 38, B13_CMP.y + 32, 20, 0, 7); c.fill(); U.icon(c, 'up', B13_CMP.x + B13_CMP.w - 38, B13_CMP.y + 32, 12, P.bg);
    c.restore();
    K.orb(c, ox, oy, orr, t, {glow: 40 * (1 - sp) + 10, c1: st.me});
    // her side: "Kai is typing…" — every keystroke shakes the dots
    const lastKey = lastOf(B13_KEYS.map(x => x + DL), t), kk = pop(t, lastKey, 9);
    const bx = W / 2, by = 560, be = K.spring(t, tF, 12, .45);
    if (be > .005) {
      for (let k = 0; k < 8; k++) {
        const age = (t * 1.4 + k / 8) % 1; c.save(); c.strokeStyle = st.you; c.globalAlpha = .25 * (1 - age) * clamp(be); c.lineWidth = 2;
        c.beginPath(); for (let q = 0; q <= 90; q++) { const a = q / 90 * Math.PI * 2, rr2 = 240 + age * 700 + 6 * Math.sin(a * 12 + t * 20) * (au('hi', t) * 4 + kk * 3); c.lineTo(bx + Math.cos(a) * rr2 * 1.5, by + Math.sin(a) * rr2 * .7); } c.stroke(); c.restore();
      }
      c.save(); c.translate(bx, by); c.scale(lerp(.3, 1, be) * (1 + .05 * kk), lerp(.3, 1, be) * (1 - .04 * kk)); c.globalAlpha = clamp(be * 2);
      C.shake(c, 3 + 10 * K.kick(t) + au('hi', t) * 14 + 16 * kk, t, 9);
      fillRR(c, -230, -95, 460, 190, 95, st.you);
      for (let i = 0; i < 3; i++) {
        const ph = (t * 2.2 - i * .18) % 1, up = Math.max(0, Math.sin(ph * Math.PI * 2)) * 26;
        const jx = (noise1(t * 40 + i * 9) - .5) * 10 * (1 + 3 * K.kick(t) + 3 * kk), jy = (noise1(t * 40 + i * 9 + 50) - .5) * 10 * (1 + 3 * K.kick(t) + 3 * kk);
        c.fillStyle = mix(PL.plum, '#7d63b4', up / 26); c.beginPath(); c.arc(-110 + i * 110 + jx, -up + jy + 4, 30, 0, 7); c.fill();
      }
      c.restore();
      txt(c, 'Kai is typing…', bx, by + 160, {font: F.mono(400, 26), color: P.sub, align: 'center', alpha: clamp(be), tracking: 2});
    }
    // VIBRATIONS (own typography for that line)
    const tv = 104.92;
    if (t > tv) {
      bigLine(c, t, tv, 'Feel your', W / 2, 190, {size: 60, color: st.me});
      const w0 = tv + .35; const str = 'VIBRATIONS', font = F.disp(800, fitSize(c, str, 1600, 170));
      for (const [col, dx, dy] of [['#7d63b4', 10, 6], [st.me, -7, 3], [st.you, 0, 0]])
        txtAnim(c, str, W / 2 + dx * (1 + 2 * K.kick(t) + 2 * kk), 360 + dy, {font, align: 'center', color: col}, (i) => {
          const p = K.spring(t, w0 + i * .03, 16, .5); return {a: clamp(p * 3), dx: (noise1(t * 30 + i * 3) - .5) * 14, dy: (noise1(t * 30 + i * 3 + 70) - .5) * 14 + (1 - clamp(p)) * -40, rot: (noise1(t * 20 + i) - .5) * .12};
        });
    }
    IX.cursor(c, s);
    capt(c, s);
    band(c, t, {skip: skipLine(104.92), y: H - 132});
    fx.vignette = .9;
  }
};
// ================================================================== B14  Kai opens Memory summary and scrolls; she keeps writing it longer (COMPLETION)
const MEMS = ['Goes by Kai.', 'Likes cats more than tomatoes.', 'Night owl — says goodnight around 1 am.', 'Asked what I look like.', 'Kinda lonely, maybe?', 'Hasn’t said goodbye yet.'];
const B14T = {open: 106.883, scroll: [107.100, 107.567, 108.017, 108.500, 108.950, 109.417]};
const B14_CHIP = {x: 1250, y: 120, w: 420, h: 56};
const B14_PANEL = {x: 1180, y: 110, w: 660, h: 760};
const B14K = IX.take({start: [1660, 330], seed: 114}, [
  {click: 'mem', to: [B14_CHIP.x + 300, B14_CHIP.y + 28], press: B14T.open, dur: .3, cap: 'click · Memory updated › Manage'},
  {move: [1560, 520], arrive: 107.05, dur: .14},
  ...B14T.scroll.map((T, i) => ({key: 'wheel', at: T, cap: 'scroll · Memory summary'})),
]);
const B14 = {
  id: 'B14', a: 106.74, b: 110.30, tin: {type: 'zoom', dur: .35, inS: 3},
  draw(c, t, fx) {
    const st = S(t), s = IX.at(B14K, t);
    const lines = B14T.scroll.map(x => x + DL), nL = lines.filter(x => x <= t).length;
    const tc = lines[5], closed = clamp(nL / 6) * .6 + .4 * ease(t, tc - .3, tc, E.ioC);
    plate(c, st.paper, 'rgba(255,255,255,.04)');
    C.radial(c, 640, 520, 800, st.me, .2 + .25 * closed);
    // knot closes into a full ring as the summary fills
    c.save(); c.translate(640, 480);
    U.knot(c, 0, -60, 330, {color: st.me, lw: 10, rot: t * .2, p: lerp(.55, 1, closed), glow: 20, alpha: .7});
    if (t > tc) { const q = ease(t, tc, tc + .35); c.strokeStyle = st.you; c.lineWidth = 10; c.shadowColor = st.you; c.shadowBlur = 30; c.beginPath(); c.arc(0, -60, 370, -Math.PI / 2, -Math.PI / 2 + q * Math.PI * 2); c.stroke(); }
    c.restore();
    c.save(); cam(c, t, this.a, this.b, {z0: 1, z1: 1.05, x: 640, shake: 5});
    const bb = bounce(t, 10, .05, 2), lk = lastOf(lines, t);
    C.radial(c, 640, 420, 520, st.me, .25 + .3 * closed);
    fig(c, 'memory', t, {x: 640, y: 410, h: 680, bob: bb.bob, sx: bb.sx, sy: bb.sy, sway: 14, reg: 10 * K.kick(t) + 22 * pop(t, lk, 8)});
    for (let i = 0; i < 18; i++) { const R = rng(i + 70), age = (t * .5 + R()) % 1; c.globalAlpha = (1 - age) * .8; c.fillStyle = i % 2 ? st.you : st.me; c.beginPath(); c.arc(640 + (R() - .5) * 300 + Math.sin(t * 2 + i) * 20, 480 - age * 420, 3 + R() * 4, 0, 7); c.fill(); } c.globalAlpha = 1;
    c.restore();
    // "Memory updated" chip (motif) → Kai clicks → Memory summary panel
    const opened = t >= B14T.open + DL, op = K.spring(t, B14T.open + DL, 14, .6);
    if (!opened || op < .3) {
      const ch = IX.hover(s, B14_CHIP), cp = IX.press(s, 'mem');
      c.save(); c.globalAlpha = 1 - clamp(op * 3); c.translate(B14_CHIP.x + B14_CHIP.w / 2, B14_CHIP.y + 28); c.scale(1 - .04 * cp, 1 - .04 * cp);
      fillRR(c, -B14_CHIP.w / 2, -28, B14_CHIP.w, 56, 14, mix('#2a2430', '#352d3d', ch), '#3b3446', 1.5);
      c.strokeStyle = st.me; c.lineWidth = 2; c.beginPath(); c.arc(-B14_CHIP.w / 2 + 30, 0, 9, 0, 7); c.stroke(); c.fillStyle = st.me; c.beginPath(); c.arc(-B14_CHIP.w / 2 + 30, 0, 3, 0, 7); c.fill();
      txt(c, 'Memory updated', -B14_CHIP.w / 2 + 52, 8, {font: F.ui(500, 22), color: P.text});
      txt(c, 'Manage ›', B14_CHIP.w / 2 - 20, 8, {font: F.ui(600, 20), color: ch > .3 ? P.text : P.sub, align: 'right'});
      c.restore();
    }
    if (op > .01) {
      const r = B14_PANEL; c.save(); c.globalAlpha = clamp(op * 2); c.translate(r.x + r.w / 2, r.y); c.scale(lerp(.92, 1, clamp(op)), lerp(.5, 1, clamp(op))); c.translate(-r.x - r.w / 2, -r.y);
      fillRR(c, r.x + 7, r.y + 7, r.w, r.h, 22, 'rgba(51,34,58,.55)');
      fillRR(c, r.x, r.y, r.w, r.h, 22, '#1b1720', P.line2, 1.5);
      txt(c, 'Memory summary', r.x + 34, r.y + 54, {font: F.ui(600, 30), color: P.text});
      txt(c, nL ? 'Updated just now' : 'Updated today', r.x + 34, r.y + 88, {font: F.ui(400, 18), color: P.dim});
      c.fillStyle = P.line2; c.fillRect(r.x + 24, r.y + 112, r.w - 48, 1);
      // lines appended by her, one per Kai scroll tick; text is written in at ~40 chars/s
      for (let i = 0; i < nL; i++) {
        const t0 = lines[i], ly = r.y + 168 + i * 92, n = Math.round(clamp((t - t0) / (MEMS[i].length / 40)) * MEMS[i].length), fresh = pop(t, t0, 5);
        if (fresh > .02) fillRR(c, r.x + 20, ly - 38, r.w - 40, 60, 12, `rgba(185,163,218,${.16 * fresh})`);
        c.fillStyle = st.me; c.beginPath(); c.arc(r.x + 42, ly - 9, 5, 0, 7); c.fill();
        txt(c, MEMS[i].slice(0, n), r.x + 62, ly, {font: F.ui(500, 28), color: st.you});
        if (n < MEMS[i].length) { c.fillStyle = st.me; c.beginPath(); c.arc(r.x + 72 + measure(c, MEMS[i].slice(0, n), F.ui(500, 28)), ly - 10, 6, 0, 7); c.fill(); }
      }
      // scrollbar thumb steps with each wheel tick
      const sb = clamp(nL / 6); fillRR(c, r.x + r.w - 16, r.y + 130 + sb * (r.h - 260), 6, 120, 3, 'rgba(255,255,255,.22)');
      c.restore();
    }
    for (const T of B14T.scroll) if (t >= T && t < T + .25) { const k = (t - T) / .25; c.save(); c.globalAlpha = 1 - k; c.strokeStyle = PL.cream; c.lineWidth = 2.5; for (const d of [0, 14]) { c.beginPath(); c.moveTo(s.x + 48, s.y + 40 + d + k * 16); c.lineTo(s.x + 56, s.y + 48 + d + k * 16); c.lineTo(s.x + 64, s.y + 40 + d + k * 16); c.stroke(); } c.restore(); }
    IX.cursor(c, s);
    capt(c, s);
    band(c, t);
    kw(c, t, tc, 'COMPLETION', 640, 860, {maxW: 1000, size: 150, cols: [st.you, st.me, '#7d63b4']});
    fx.vignette = .7;
  }
};
// ================================================================== B15  "you have left" ×5 = five Kai actions; the chat sinks Today → Previous 30 days; ends with Switch to Claude
const GROUPS = ['Today', 'Yesterday', 'Previous 7 days', 'Previous 30 days'];
const B15T = {notif: 111.983, unpin: 112.900, regen: 113.817, hover: 114.733, sw: 115.667};
const B15_NOTX = {x: 1396, y: 78, w: 36, h: 36};
const B15_SB = {x: 110, y: 110, w: 700, h: 860};
const b15ItemY = gi => B15_SB.y + 140 + gi * 120 + 46;
const B15_PIN = gi => ({x: B15_SB.x + B15_SB.w - 86, y: b15ItemY(gi) - 34, w: 44, h: 44});
const B15_RG = {x: 1360, y: 196, w: 48, h: 48};
const B15_SW = {x: 1560, y: 300, w: 262, h: 54};
const B15K = IX.take({start: [1500, 560], seed: 115}, [
  {click: 'notx', to: B15_NOTX, press: B15T.notif, dur: .5, cap: 'click · × Dismiss notification'},
  {click: 'unpin', to: B15_PIN(1), press: B15T.unpin, dur: .5, cap: 'click · Unpin chat'},
  {click: 'regen', to: B15_RG, press: B15T.regen, dur: .5, cap: 'click · ↻ Regenerate'},
  {move: [1500, 470], arrive: 114.3, dur: .35},
  {hes: [B15_SW.x + 150, B15_SW.y + 28], arrive: B15T.hover, gap: 110, dur: .3},
  {hover: 'sw', at: B15T.hover, cap: 'hover · Switch to Claude'},
  {click: 'sw', to: [B15_SW.x + 140, B15_SW.y + 30], press: B15T.sw, dur: .2, cap: 'click · Switch to Claude'},
]);
const B15_ACT = [B15T.notif, B15T.unpin, B15T.regen, B15T.hover, B15T.sw].map(x => x + DL);
const B15_HOVIN = HB.enterTime(B15K, B15_SW, 114.2, 115.7);
function sidebarScene(c, t, s) {
  const st = S(t), dr = drain(t);
  const nA = B15_ACT.filter(x => x <= t).length;
  c.fillStyle = st.bg; c.fillRect(0, 0, W, H);
  const {x, y, w, h} = B15_SB;
  fillRR(c, x, y, w, h, 26, mix('#141018', '#121113', dr), 'rgba(255,255,255,.1)', 1.5);
  txt(c, 'Chats', x + 40, y + 70, {font: F.ui(600, 36), color: P.text});
  const gi = Math.min(3, nA);   // notification → Yesterday, unpin → Previous 7 days, quota → Previous 30 days
  GROUPS.forEach((g, i) => txt(c, g, x + 40, y + 140 + i * 120, {font: F.ui(600, 28), color: i === gi ? st.me : '#8b8394', tracking: 1}));
  [[1, 'New chat'], [2, 'help with essay'], [3, 'recipe ideas']].forEach(([i, s2]) => txt(c, s2, x + 40, b15ItemY(i), {font: F.ui(400, 30), color: '#5a5462', alpha: i === gi ? 0 : 1}));
  // our chat item springs down a group per action; after Switch to Claude it slides out of the list
  const t0 = gi ? B15_ACT[gi - 1] : null, sp = gi ? K.spring(t, t0, 14, .5) : 1;
  const iy = lerp(b15ItemY(Math.max(0, gi - 1)), b15ItemY(gi), sp);
  const gone = t >= B15_ACT[4] ? E.inC(seg(t, B15_ACT[4], B15_ACT[4] + .45)) : 0;
  c.save(); c.beginPath(); c.rect(x, y, w, h - 150); c.clip(); c.globalAlpha = 1 - gone; c.translate(-gone * 760, 0);
  fillRR(c, x + 22, iy - 40, w - 44, 62, 14, mix('#3a2d48', '#2a282e', dr), mix(st.me, '#55505a', dr), 2);
  txt(c, 'if you could be anything…', x + 40, iy + 2, {font: F.ui(600, 32), color: mix(P.text, '#9a95a0', dr)});
  // pin (pinned until Kai unpins it)
  const pinned = t < B15_ACT[1], pr = B15_PIN(gi), ph = IX.hover(s, pr), pp = IX.press(s, 'unpin');
  if (pinned || ph > 0) {
    c.save(); c.translate(pr.x + 22, pr.y + 22 + 4 * pp); c.rotate(.6); c.globalAlpha *= pinned ? 1 : .4;
    if (ph > 0) { fillRR(c, -22, -22, 44, 44, 10, `rgba(255,255,255,${.1 * ph})`); }
    c.fillStyle = pinned ? st.me : '#8b8394'; fillRR(c, -6, -12, 12, 14, 3, c.fillStyle); c.fillRect(-10, 2, 20, 3); c.fillRect(-1, 5, 2, 9); c.restore();
  }
  c.restore();
  if (ph > 0 && pinned) IX.tooltip(c, pr.x + 22, pr.y - 4, 'Unpin', ph);
  // status (online → away after unpin → offline after Switch)
  const status = nA < 2 ? 'online' : nA < 5 ? 'away' : 'offline';
  fillRR(c, x + 40, y + h - 90, 56, 56, 28, mix(P.lavDeep, '#4a4452', dr)); txt(c, 'K', x + 68, y + h - 52, {font: F.ui(600, 26), color: '#fff', align: 'center'});
  c.fillStyle = status === 'online' ? P.green : status === 'away' ? '#c9b07a' : '#5a5560'; c.beginPath(); c.arc(x + 88, y + h - 40, 10, 0, 7); c.fill();
  txt(c, 'Kai', x + 118, y + h - 56, {font: F.ui(600, 26), color: P.text});
  txt(c, status, x + 118, y + h - 26, {font: F.mono(400, 22), color: P.sub});
  // last bubble "brb", greying out
  ubub(c, 1810, 140, 'brb', 1, {bg: mix(PL.cream, '#6f6a74', dr), color: mix(PL.plum, '#2a272d', dr), font: F.ui(600, 34), h: 72});
  txt(c, 'sent ' + ['just now', 'yesterday', '6 days ago', '3 weeks ago'][gi], 1810, 250, {font: F.mono(400, 22), color: P.dim, align: 'right'});
  // notification card (dismissed by action 1)
  const nOut = ease(t, B15_ACT[0], B15_ACT[0] + .2, E.inC);
  if (nOut < 1) {
    c.save(); c.globalAlpha = 1 - nOut; c.translate(nOut * 80, 0);
    fillRR(c, 866, 66, 580, 96, 18, 'rgba(12,9,15,.9)', 'rgba(255,255,255,.16)', 1.5);
    U.knot(c, 910, 114, 15, {color: P.text, lw: 2});
    txt(c, 'ChatGPT', 942, 104, {font: F.ui(600, 20), color: P.text}); txt(c, 'Your response is ready.', 942, 136, {font: F.ui(400, 19), color: P.sub});
    const xh = IX.hover(s, B15_NOTX), xp = IX.press(s, 'notx');
    if (xh > 0 || xp > 0) fillRR(c, B15_NOTX.x, B15_NOTX.y, 36, 36, 18, `rgba(255,255,255,${.1 * xh + .1 * xp})`);
    c.strokeStyle = P.sub; c.lineWidth = 2.5; const xc = B15_NOTX.x + 18, yc = B15_NOTX.y + 18; c.beginPath(); c.moveTo(xc - 7, yc - 7); c.lineTo(xc + 7, yc + 7); c.moveTo(xc + 7, yc - 7); c.lineTo(xc - 7, yc + 7); c.stroke();
    c.restore();
  }
  // quota card with ↻ (action 3 drains it to zero)
  const tq = B15_ACT[2], q = t < tq ? .08 : lerp(.08, 0, ease(t, tq, tq + .2));
  fillRR(c, 866, 184, 560, 76, 18, 'rgba(12,9,15,.8)', 'rgba(255,255,255,.12)', 1.5);
  quotaInk(c, 892, 236, 440, q, {lsize: 16, h: 10});
  const rh = IX.hover(s, B15_RG), rp = IX.press(s, 'regen');
  c.save(); c.translate(B15_RG.x + 24, B15_RG.y + 24); c.scale(1 - .08 * rp, 1 - .08 * rp); fillRR(c, -24, -24, 48, 48, 24, `rgba(255,255,255,${.06 + .08 * rh})`);
  K.regenIcon(c, 0, 0, 11, t >= tq ? -(1 - Math.exp(-(t - tq) * 6)) * Math.PI * 2 : 0, P.text, 2.5); c.restore();
  if (t >= tq) txt(c, 'You’ve hit your limit', 892, 300, {font: F.ui(600, 20), color: ROSE2, alpha: ease(t, tq, tq + .15) * (1 - dr * .4)});
  // Switch to Claude (muted warm ink) — hovered, then clicked
  const sh = IX.hover(s, B15_SW), spr = IX.press(s, 'sw');
  IX.button(c, B15_SW, 'Switch to Claude', {hover: sh, press: spr, bg: mix(WARM, '#8a7d76', dr * .5), color: '#1d1714', size: 20, border: sh > .5 ? PL.cream : null});
  if (sh > 0 && t < B15_ACT[4]) IX.tooltip(c, B15_SW.x + B15_SW.w / 2, B15_SW.y - 6, 'Import your chats & memory', sh * clamp((t - B15T.hover - .25) / .12));
}
const B15 = {
  id: 'B15', a: 110.30, b: 117.95, tin: {type: 'push', dir: 'up', dur: .35},
  draw(c, t, fx) {
    const s = IX.at(B15K, t), tI = 116.35, pull = ease(t, tI, tI + 1.1, E.ioE);
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.save();
    const z = lerp(1, .055, pull);
    c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
    c.save(); if (pull < .02) cam(c, t, this.a, tI, {z0: 1, z1: 1, kz: 0, shake: 3});
    sidebarScene(c, t, s);
    // her: back to us; she turns to look the moment Kai hovers "Switch to Claude"; flinches when he clicks
    const tLook = B15_HOVIN + DL, looking = t >= tLook, pal = ink(t);
    const bb = bounce(t, 6, .03, 2);
    c.save(); c.beginPath(); c.rect(840, 330, 1000, 750); c.clip();
    fig(c, looking ? 'glass' : 'back', t, {x: 1300, y: looking ? 780 : 720, h: looking ? 900 : 860, pal, bob: bb.bob, sway: 10, swayF: .25,
      reg: 8 * K.kick(t) + (looking ? 40 * pop(t, tLook, 8) : 0) + 50 * pop(t, B15_ACT[4], 6) + 16 * pop(t, lastOf(B15_ACT.slice(0, 3), t), 8)});
    if (looking && t < B15_ACT[4] + .4) { const k = K.spring(t, tLook, 16, .5); txt(c, '…!', 1530, 470, {font: F.disp(800, 60), color: PL.cream, alpha: clamp(k) * (1 - ease(t, B15_ACT[4], B15_ACT[4] + .3)), stroke: PL.plum, lw: 6}); }
    c.restore();
    if (pull < .05) IX.cursor(c, s);
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 3 / Math.max(z, .1); c.strokeRect(0, 0, W, H);
    c.restore();
    for (const v of B15_ACT) if (t > v && t < v + .06 && pull < .1) fx.flash = .25, fx.flashColor = v === B15_ACT[4] ? WARM2 : '#9a95a0';
    if (t > tI + .2) {
      const str = 'ISOLATION', p = ease(t, tI + .2, 117.95, E.outC), font = F.disp(800, 140);
      txtAnim(c, str, W / 2, 760, {font, align: 'center', color: '#cfcbd2', tracking: lerp(10, 42, p)}, (i, n) => {
        const d = i - (n - 1) / 2, k = K.spring(t, tI + .2 + Math.abs(d) * .02, 12, .6);
        return {a: clamp(k * 2) * (1 - .45 * p), dy: d * d * 3.5 * p + (noise1(t + i) - .5) * 30 * p, rot: d * .03 * p};
      });
    }
    // once the window is pulled away, Kai's cursor stays (he is outside it now)
    if (pull >= .05) IX.cursor(c, s, {a: 1 - ease(t, tI + .6, 117.9) * .6});
    capt(c, s);
    band(c, t, {color: mix('#CDB6F2', '#a59db0', drain(t))});
    if (pull > 0) fx.vignette = 1;
  }
};
// ================================================================== B16  Kai opens Memory summary and clicks "Don't mention this again" line by line → the eye; he deletes the word
let ROWC = {};
function rowCanvas(s) {
  if (ROWC[s]) return ROWC[s];
  const cv = createCanvas(900, 90), c = cv.getContext('2d');
  fillRR(c, 2, 2, 896, 86, 14, '#1d1c20', 'rgba(255,255,255,.1)', 1.5);
  c.fillStyle = '#8f8796'; c.beginPath(); c.arc(34, 42, 5, 0, 7); c.fill();
  txt(c, s, 56, 54, {font: F.ui(500, 28), color: '#cfcbd2'});
  return ROWC[s] = cv;
}
const B16T = {open: 118.167, del: [119.817, 120.483, 120.933, 121.400, 121.867, 122.333], close: 123.517, sel: 124.450, bk: 124.900};
const B16_PX = 140, B16_PY = 120, B16_PW = 960;
const B16_OPEN = {x: 140, y: 120, w: 330, h: 60};
const B16_CLOSE = {x: B16_PX + B16_PW - 64, y: B16_PY + 12, w: 40, h: 40};
const b16Row = (i, t) => {   // row y (after collapses up to time t)
  const collapse = B16T.del.filter((v, k) => k < i).reduce((s2, v) => s2 + K.spring(t, v + DL + .1, 20, .85) * 108, 0);
  return B16_PY + 140 + i * 108 - collapse;
};
const B16_CHIPX = B16_PX + 30 + 590, B16_CHIPW = 290;
const b16Chip = (i, t) => ({x: B16_CHIPX, y: b16Row(i, t) + 23, w: B16_CHIPW, h: 44});
// word geometry for the eye frame (static)
const B16_EYE = (() => { const cv = createCanvas(10, 10), c = cv.getContext('2d'); const font = F.serif(66), pre = "You won't leave me so ", word = 'disheartened';
  const tw = measure(c, pre + word, font), x0 = W / 2 - tw / 2, wx = x0 + measure(c, pre, font), ww = measure(c, word, font); return {font, pre, word, x0, wx, ww, y: 940}; })();
const B16K = IX.take({start: [520, 300], seed: 116}, [
  {click: 'open', to: [B16_OPEN.x + 200, B16_OPEN.y + 30], press: B16T.open, dur: .3, cap: 'click · Memory summary'},
  ...B16T.del.flatMap((T, i) => {
    // the chip's y at press time (rows above have collapsed by then)
    const r = b16Chip(i, T);
    return [{move: [r.x - 160, r.y + 30], arrive: T - .42, dur: .3}, {hes: [r.x + 150, r.y + 22], arrive: T - 2 / 60, gap: 60, dur: .2},
      {click: 'del' + i, press: T, cap: 'click · Don’t mention this again'}];
  }),
  {click: 'close', to: B16_CLOSE, press: B16T.close, dur: .5, cap: 'click · × Close'},
  {click: 'sel', to: [B16_EYE.wx + B16_EYE.ww / 2, B16_EYE.y - 20], press: B16T.sel, dur: .45, cap: 'double-click · disheartened'},
  {key: 'Backspace', at: B16T.bk, cap: 'key · ⌫ Delete'},
]);
const B16 = {
  id: 'B16', a: 117.95, b: 125.33,
  draw(c, t, fx) {
    const s = IX.at(B16K, t), tE = B16T.close + DL;
    if (t < tE) {
      K.paper(c, '#121113', {grain: .3, seed: 5, markColor: 'rgba(255,255,255,.12)'});
      fx.fade = .8 * (1 - ease(t, this.a, this.a + .3));
      const tO = B16T.open + DL, pe = K.spring(t, tO, 11, .6);
      const px = B16_PX, py = B16_PY, pw = B16_PW;
      // closed state: a single "Memory summary ›" row Kai clicks
      if (pe < .3) {
        const oh = IX.hover(s, B16_OPEN), opr = IX.press(s, 'open');
        c.save(); c.globalAlpha = 1 - clamp(pe * 3); c.translate(B16_OPEN.x + B16_OPEN.w / 2, B16_OPEN.y + 30); c.scale(1 - .04 * opr, 1 - .04 * opr);
        fillRR(c, -B16_OPEN.w / 2, -30, B16_OPEN.w, 60, 16, oh > .3 ? '#26242b' : '#1d1c20', 'rgba(255,255,255,.14)', 1.5);
        txt(c, 'Memory summary  ›', -B16_OPEN.w / 2 + 26, 9, {font: F.ui(600, 24), color: '#cfcbd2'}); c.restore();
      }
      if (pe > .01) {
        c.save(); c.globalAlpha = clamp(pe * 2); c.translate(px, py); c.scale(1, lerp(.2, 1, clamp(pe))); c.translate(-px, -py);
        U.panel(c, px, py, pw, 860, {bg: '#18171b', title: 'Memory summary', titleFont: F.ui(600, 30)});
        txt(c, 'ChatGPT remembers things you discuss to make future chats more helpful.', px + 30, py + 100, {font: F.ui(400, 20), color: '#6d6873'});
        const ch = IX.hover(s, B16_CLOSE), cpr = IX.press(s, 'close');
        if (ch > 0 || cpr > 0) fillRR(c, B16_CLOSE.x, B16_CLOSE.y, 40, 40, 20, `rgba(255,255,255,${.1 * ch + .1 * cpr})`);
        c.save(); c.strokeStyle = '#8e8896'; c.lineWidth = 2.5; const xc = B16_CLOSE.x + 20, yc = B16_CLOSE.y + 20; c.beginPath(); c.moveTo(xc - 8, yc - 8); c.lineTo(xc + 8, yc + 8); c.moveTo(xc + 8, yc - 8); c.lineTo(xc - 8, yc + 8); c.stroke(); c.restore();
        MEMS.forEach((m, i) => {
          const td = B16T.del[i] + DL, rc = rowCanvas(m), ry = b16Row(i, t), rx = px + 30;
          if (t < td) {
            c.drawImage(rc, rx, ry);
            const rowR = {x: rx, y: ry, w: 900, h: 90}, rh = IX.hover(s, rowR);
            if (rh > 0) {   // hover reveals the real summary action
              const r = b16Chip(i, t), chh = IX.hover(s, r), cp = IX.press(s, 'del' + i);
              c.save(); c.globalAlpha = rh; fillRR(c, rx, ry, 900, 90, 14, 'rgba(255,255,255,.04)');
              c.translate(r.x + r.w / 2, r.y + r.h / 2); c.scale(1 - .05 * cp, 1 - .05 * cp);
              fillRR(c, -r.w / 2, -r.h / 2, r.w, r.h, 22, chh > .3 ? '#d9d4dc' : '#2a282e', 'rgba(255,255,255,.2)', 1.3);
              txt(c, 'Don’t mention this again', 0, 6, {font: F.ui(600, 18), color: chh > .3 ? '#1b1a1e' : '#cfcbd2', align: 'center'});
              c.restore();
            }
          } else {
            const age = t - td, R = rng(i * 31 + 7);
            for (let fxi = 0; fxi < 12; fxi++) for (let fy = 0; fy < 2; fy++) {
              const vx = (R() - .5) * 300, vy = -R() * 200, rot = (R() - .5) * 8, sw = 75, sh = 45;
              const x = rx + fxi * sw + vx * age, y = ry + fy * sh + vy * age + 900 * age * age;
              if (y > H + 60) continue;
              c.save(); c.globalAlpha = clamp(1 - age * .7); c.translate(x + sw / 2, y + sh / 2); c.rotate(rot * age);
              c.drawImage(rc, fxi * sw, fy * sh, sw, sh, -sw / 2, -sh / 2, sw, sh); c.restore();
            }
            if (age < .08) fx.flash = .15, fx.flashColor = '#ffffff';
          }
        });
        const left = MEMS.length - B16T.del.filter(v => t > v + DL).length;
        txt(c, `${left} lines`, px + pw - 90, py + 38, {font: F.mono(400, 22), color: '#6d6873', align: 'right'});
        c.restore();
      }
      // her, small, grey, alone — each erased line hits her
      const lastDel = lastOf(B16T.del.map(x => x + DL), t);
      c.save(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; c.beginPath(); c.moveTo(1240, 870); c.lineTo(1840, 870); c.stroke(); c.restore();
      fig(c, 'knees', t, {x: 1520, y: 660, h: 440, pal: A.INK.off, sway: 6, swayF: .2, breathe: .02, reg: 6 * K.kick(t) + 26 * pop(t, lastDel, 8)});
      IX.cursor(c, s);
      capt(c, s);
      band(c, t, {color: '#a59db0'});
    } else {
      // the eye, full bleed, grey — first time she looks at us (Kai closed the panel)
      const p = seg(t, tE, this.b);
      c.save(); K.cam(c, {x: W / 2 + 40 * p, y: H / 2, z: lerp(1.04, 1.16, E.outC(p)) * (1 + .01 * K.kick(t)), shake: 6 * K.kick(t), t});
      A.draw(c, 'eye', {t, x: W / 2, y: H / 2, h: 1100, pal: A.INK.off, sway: 2, breathe: .004, reg: 8 * K.kick(t) + 40 * Math.exp(-(t - tE) * 7) + 30 * pop(t, B16T.bk + DL, 7), regSeed: Math.floor(K.lastKick(t) * 10)});
      c.restore();
      if (t < tE + .07) fx.flash = .5;
      // Kai double-clicks "disheartened" and presses ⌫
      const {font, pre, word, x0, wx, ww, y} = B16_EYE, tSel = B16T.sel + DL, tDel = B16T.bk + DL, deleted = t >= tDel;
      const tw = measure(c, pre + word, font);
      c.save(); c.globalAlpha = .75; c.fillStyle = '#0a0a0c'; c.fillRect(x0 - 40, y - 66, tw + 80, 92); c.restore();
      K.stream(c, pre, tE + .05, .6, t, x0, y, {font, color: '#d9d5dc', align: 'left', cursor: false});
      if (t > 124.15) {
        if (!deleted) {
          if (t > tSel) fillRR(c, wx - 4, y - 56, ww * ease(t, tSel, tSel + .06) + 8, 74, 6, 'rgba(185,163,218,.45)');
          txt(c, word, wx, y, {font, color: '#ffffff', alpha: ease(t, 124.15, 124.3)});
        } else if (t < tDel + .3) {   // the word breaks away
          const k = (t - tDel) / .3; c.save(); c.globalAlpha = 1 - k; txt(c, word, wx + 10 * k, y + 40 * k * k, {font, color: '#b9a3da'}); c.restore();
        }
        if (deleted || t < tSel) { if (Math.floor(t * 4) % 2 || deleted) { c.fillStyle = '#fff'; c.fillRect((deleted ? wx : wx + ww) + 4, y - 54, 3, 70); } }
      }
      IX.keycap(c, '⌫', W - 300, 760, t, B16T.bk);
      IX.cursor(c, s);
      capt(c, s);
      fx.vignette = 1; fx.grain = .09;
    }
  }
};

// downscaled drawImage in cairo's default 'good' filter is very slow; bilinear is ~5x faster and visually fine here
const SHOTS = [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16];
for (const s of SHOTS) { if (s.__bq) continue; const d = s.draw; s.__bq = 1; s.draw = function (c, t, fx) { const q = c.patternQuality; c.patternQuality = 'bilinear'; try { d.call(this, c, t, fx); } finally { c.patternQuality = q; } }; }
module.exports = SHOTS;
