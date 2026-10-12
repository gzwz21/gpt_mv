// PART B  58.65 – 125.33  (B1–B16): chorus 1, the REGENERATE forms, the switches, the trance, the leaving, the erasing.
const L = require('../lib');
const A = require('../art');
const K = require('../kit');
const U = require('../ui');
const C = require('../common');
const {F, W, H, P, clamp, lerp, seg, E, ease, rng, noise1, au, auS, beatInfo, BEATS, txt, txtAnim, measure, fillRR, rr, typed, createCanvas} = L;
const mix = A.mixHex;

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

// ================================================================== B1  thread → every possible her
const V25 = ['happy', 'catgirl', 'eggplant', 'tomato', 'god', 'think', 'selfie', 'hearthands', 'trance', 'memory', 'boy', 'glass', 'tabby',
  'dizzy', 'sleep', 'yandere', 'scream', 'cage', 'fall', 'farewell', 'back', 'reachfore', 'knees', 'veggies', 'happy'];
const PALS = [null, 'inv', 'ghost', null, 'lavSil', null, 'inv', null, 'ghost', null];
const B1 = {
  id: 'B1', a: 58.65, b: 62.41, tin: {type: 'flash', amt: .85, color: '#F5E9D6'},
  draw(c, t, fx) {
    const st = S(t);
    const msgs = [
      {t: 58.65, r: 'ai', s: 'Here I am — version one.'}, {t: 58.87, r: 'u', s: 'lol'},
      {t: 59.32, r: 'ai', s: 'Want another me?'}, {t: 59.8, r: 'u', s: 'again'},
      {t: 60.27, r: 'ai', s: 'Okay. Here’s another me.'}, {t: 60.72, r: 'u', s: 'regenerate'},
      {t: 61.18, r: 'ai', s: 'All of me. Every version.'}];
    const shown = msgs.filter(m => t >= m.t - .02);
    const warm = clamp(shown.filter(m => m.r === 'u').length / 3);
    c.fillStyle = mix('#0c0a0f', '#1d1222', warm); c.fillRect(0, 0, W, H);
    C.radial(c, W / 2, H * .45, 900, mix('#2a1f38', '#5a3a58', warm), .55);
    C.dotGrid(c, t, {a: .12, s: 40, oy: -t * 30});
    c.save(); cam(c, t, this.a, 61.2, {z0: 1.0, z1: 1.12, shake: 6});
    // thread column
    const colX = 330, colW = 1260; let y = 210; const ys = [];
    shown.forEach((m, i) => { ys.push(y); y += m.r === 'u' ? 120 : 104; });
    const scroll = Math.max(0, y - 800);
    const sScroll = scroll; // instantaneous scroll but smoothed with spring per message
    let yy = 210 - sScroll;
    c.globalAlpha = 1 - ease(t, 61.25, 61.45);
    shown.forEach((m, i) => {
      const sp = K.spring(t, m.t, 18, .5), prev = i ? shown[i - 1] : null;
      const sm = (y - 800) > 0 ? (1 - K.spring(t, m.t, 14, .7)) * (m.r === 'u' ? 120 : 104) : 0;
      const yv = ys[i] - sScroll + sm;
      if (m.r === 'u') ubub(c, colX + colW, yv, m.s, clamp(sp * 2), {s: lerp(.4, 1, sp), font: F.ui(600, 40), h: 84});
      else {
        U.knot(c, colX - 10, yv + 34, 22, {color: st.me, lw: 3, rot: t * 3, glow: 10});
        K.stream(c, m.s, m.t, .35, t, colX + 40, yv + 52, {font: F.serif(56), color: P.text, align: 'left', dot: 8, colorFn: (k) => k === 0 ? st.me : P.text});
      }
    });
    c.restore();
    // header with the pager spinning on "simulations"
    fillRR(c, 0, 0, W, 150, 0, 'rgba(10,8,12,.86)');
    txt(c, 'ChatGPT', 120, 92, {font: F.ui(600, 34), color: P.text}); U.icon(c, 'chev', 290, 82, 11, P.sub);
    // pager motif top-centre: rolls on each cream "again"/"regenerate", then spins through every her on "simulations"
    const g0p = 61.15, RT = k => g0p + .9 * Math.pow((k - 3) / 22, 1 / 1.5);
    let from = null, to = '1 / 1', tr = null;
    if (t >= g0p) { const k = Math.min(25, 3 + Math.floor(Math.pow(clamp((t - g0p) / .9), 1.5) * 22)); tr = k > 3 ? RT(k) : g0p; from = `${k - 1} / ${k - 1}`; to = `${k} / ${k}`; if (k === 3) { from = '2 / 2'; to = '3 / 3'; tr = 60.72; } }
    else if (t >= 60.72) { from = '2 / 2'; to = '3 / 3'; tr = 60.72; }
    else if (t >= 59.8) { from = '1 / 1'; to = '2 / 2'; tr = 59.8; }
    const PGo = {from, to, tr, spin: t >= g0p ? -t * 14 : undefined, col: st.me, beatPulse: true};
    // grid of every possible her
    const g0 = 61.15;
    if (t > g0) {
      const cols = 5, rows = 5, tw = W / cols, th = H / rows;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const n = j * cols + i, d = Math.hypot(i - 2, j - 2);
        const t1 = g0 + d * .07 + (n % 3) * .02; let sp = K.spring(t, t1, 17, .5); if (j === 2) sp *= 1 - ease(t, 61.36, 61.5, E.inC); if (sp <= .01) continue;
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
        c.save(); txt(c, `${n + 1}/25`, cx - tw / 2 + 16, cy - th / 2 + 32, {font: F.mono(700, 18), color: (i + j * 2) % 5 === 2 ? PL.plum : P.text, alpha: clamp(sp)}); c.restore();
      }
      fx.chroma = 3 * K.kick(t);
    }
    // keyword SIMULATIONS on the grid
    if (t > 61.42) {
      kw(c, t, 61.42, 'SIMULATIONS', W / 2, H / 2 + 62, {maxW: 1600, size: 170, reg: 16, stagger: .025});
    }
    pagerM(c, t, PGo);
    band(c, t);
    fx.vignette = .8;
  }
};

// ================================================================== B2  the thumbs-up (count 1)
const B2 = {
  id: 'B2', a: 62.41, b: 66.17, tin: {type: 'flash', amt: .6, color: '#B9A3DA', dur: .12},
  draw(c, t, fx) {
    const st = S(t), tp = 64.87; const pressed = t >= tp;
    plate(c, pressed ? '#2e2138' : st.paper, 'rgba(255,255,255,.05)');
    C.radial(c, 640, 520, 700, pressed ? '#b9a3da' : '#5d4778', pressed ? .45 + .3 * K.kick(t) : .3);
    if (pressed) K.rays(c, 640, 500, 28, 120, 1400, PL.cream, .09 * (1 - seg(t, tp, 66.1) * .5), t * .2);
    c.save(); cam(c, t, this.a, this.b, {z1: 1.06, shake: 8});
    // the button
    const bx = 640, by = 540, ent = K.spring(t, this.a, 12, .45);
    const press = t > tp - .06 && t < tp + .1 ? .86 : 1;
    const pop = K.hit(t, tp + .1, .14);
    c.save(); c.translate(bx, by); const s = lerp(.3, 1, ent) * press * (1 + pop) * (1 + .015 * Math.sin(t * 3)); c.scale(s, s);
    c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 50;
    fillRR(c, -260, -260, 520, 520, 90, pressed ? PL.cream : '#241a2c', pressed ? null : 'rgba(255,255,255,.25)', 3); c.shadowBlur = 0;
    K.thumbs(c, 0, 10, 330, {color: pressed ? PL.plum : PL.cream, fill: pressed ? PL.plum : null});
    c.restore();
    // action row under it
    const rowY = 880; c.save(); c.globalAlpha = ent;
    const ic = ['copy', 'up', 'down', 'regen'];
    ic.forEach((k, i) => {
      const x = 480 + i * 106;
      fillRR(c, x - 38, rowY - 38, 76, 76, 18, i === 1 && pressed ? PL.cream : 'rgba(255,255,255,.06)');
      const col = i === 1 && pressed ? PL.plum : P.sub;
      if (k === 'copy') { fillRR(c, x - 12, rowY - 16, 22, 28, 4, null, col, 2.5); fillRR(c, x - 4, rowY - 8, 22, 28, 4, null, col, 2.5); }
      if (k === 'up') K.thumbs(c, x, rowY, 34, {color: col, fill: pressed ? PL.plum : null});
      if (k === 'down') { c.save(); c.translate(x, rowY); c.rotate(Math.PI); K.thumbs(c, 0, 0, 34, {color: col}); c.restore(); }
      if (k === 'regen') K.regenIcon(c, x, rowY, 14, 0, col, 2.5);
    });
    c.restore();
    // counter "1"
    const cq = ease(t, tp, tp + .3, E.outB);
    c.save(); c.beginPath(); c.rect(940, 360, 260, 200); c.clip();
    txt(c, '0', 960, 520 - cq * 190, {font: F.disp(800, 170), color: 'rgba(255,255,255,.35)'});
    txt(c, '1', 960, 520 + (1 - cq) * 190, {font: F.disp(800, 170), color: PL.cream, glow: pressed ? 30 : 0, glowColor: PL.lav});
    c.restore();
    txt(c, 'helpful', 966, 590, {font: F.mono(700, 24), color: P.sub, tracking: 3});
    if (pressed) K.toast(c, 640, 210, 'Thanks for your feedback!', {a: clamp(K.spring(t, tp + .08, 14, .5) * 1.5), font: F.ui(500, 26), icon: 'mem', iconColor: PL.lav});
    // hearthands pops beside with spring, hops on beats; big hop on press
    const hp = K.spring(t, 62.85, 13, .4);
    if (hp > 0) {
      const bb = bounce(t, pressed ? 34 : 14, pressed ? .1 : .05);
      const jump = pressed ? -Math.sin(Math.PI * clamp((t - tp) / .55)) * 90 : 0;
      fig(c, 'hearthands', t, {x: 1470, y: 600 + (1 - clamp(hp)) * 500, h: 900 * lerp(.6, 1, clamp(hp)), bob: bb.bob + jump, sx: bb.sx, sy: bb.sy, sway: 14, reg: pressed ? 22 * K.kick(t) + 16 * Math.exp(-(t - tp) * 6) : 10 * K.kick(t)});
      if (pressed) for (let i = 0; i < 12; i++) {
        const R = rng(i + 9), age = t - tp - R() * .6; if (age < 0) continue; const life = clamp(age / 1.2);
        heart(c, 1470 + (R() - .5) * 600 + Math.sin(age * 4 + i) * 20, 380 - age * 260, 1.4 + R() * 1.6, i % 2 ? PL.cream : PL.lav, 1 - life);
      }
    }
    // the cream cursor glides in and presses
    const cp = ease(t, 63.2, tp - .08, E.ioC);
    const px = lerp(1350, bx + 30, cp) + (1 - cp) * 0, py = lerp(1010, by + 40, cp) - Math.sin(cp * Math.PI) * 200 + (t > tp - .3 && t < tp ? Math.sin(t * 30) * 3 : 0);
    if (t > 63.2) K.pointer(c, px, py, 2.4 * (t > tp - .06 && t < tp + .1 ? .85 : 1));
    K.ripple(c, bx + 30, by + 40, t, tp, {color: PL.cream});
    c.restore();
    if (pressed && t < tp + .06) fx.flash = .5, fx.flashColor = PL.cream;
    band(c, t);
  }
};

// ================================================================== B3  selfie image-gen reveal COMPLETES, then the execution
const B3 = {
  id: 'B3', a: 66.17, b: 70.02, tin: {type: 'push', dir: 'left', dur: .3},
  draw(c, t, fx) {
    const st = S(t);
    plate(c, '#160f1b', null); C.dotGrid(c, t, {a: .14, s: 44, ox: -t * 20});
    const pan = ease(t, 67.9, 68.5, E.ioE);
    c.save(); cam(c, t, this.a, this.b, {x: W / 2 + pan * 360, z0: 1, z1: 1.05, shake: 6});
    // user asks
    const u0 = 66.2; ubub(c, 1330, 150, 'show me what you look like', clamp(K.spring(t, u0, 16, .5) * 2), {s: lerp(.5, 1, K.spring(t, u0, 16, .5)), font: F.ui(500, 30)});
    // image card
    const cx = 700, cy = 560, cw = 540, ch = 600, ce = K.spring(t, 66.4, 13, .5);
    const done = t >= 67.85, bump = K.hit(t, 67.88, .06);
    c.save(); c.translate(cx, cy); c.scale(lerp(.7, 1, ce) * (1 + bump), lerp(.7, 1, ce) * (1 + bump)); c.globalAlpha = clamp(ce * 2);
    c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 50; fillRR(c, -cw / 2, -ch / 2, cw, ch, 28, '#e9dcf7'); c.shadowBlur = 0;
    c.save(); rr(c, -cw / 2, -ch / 2, cw, ch, 28); c.clip();
    // faint grid
    c.strokeStyle = 'rgba(51,34,58,.08)'; c.lineWidth = 1; for (let x = -cw / 2; x < cw / 2; x += 40) { c.beginPath(); c.moveTo(x, -ch / 2); c.lineTo(x, ch / 2); c.stroke(); }
    const rv = ease(t, 66.45, 67.85, E.ioC);
    const bb = done ? bounce(t, 12, .05) : {bob: 0, sx: 1, sy: 1};
    fig(c, 'selfie', t, {x: 0, y: 40, h: 660, reveal: done ? null : rv, bob: bb.bob, sx: bb.sx, sy: bb.sy, sway: 8, reg: done ? 10 * K.kick(t) : 0});
    c.restore();
    fillRR(c, -cw / 2, -ch / 2, cw, ch, 28, null, done ? PL.lav : 'rgba(51,34,58,.3)', done ? 4 : 2);
    c.restore();
    // label
    if (!done) { K.thinking(c, cx - cw / 2, cy - ch / 2 - 26, t, {text: 'Creating image', font: F.ui(500, 28)}); txt(c, Math.round(rv * 100) + '%', cx + cw / 2, cy - ch / 2 - 26, {font: F.mono(700, 26), color: P.sub, align: 'right'}); }
    else {
      const q = K.spring(t, 67.85, 16, .5); c.save(); c.globalAlpha = clamp(q * 2);
      c.strokeStyle = P.green; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - cw / 2 + 4, cy - ch / 2 - 36); c.lineTo(cx - cw / 2 + 14, cy - ch / 2 - 24); c.lineTo(cx - cw / 2 + 34, cy - ch / 2 - 48); c.stroke();
      txt(c, 'Image created', cx - cw / 2 + 48, cy - ch / 2 - 24, {font: F.ui(600, 28), color: P.text}); c.restore();
      for (let i = 0; i < 6; i++) { const R = rng(i + 40), a2 = R() * 6.28, d = 300 + 140 * ease(t, 67.85, 68.6); const life = 1 - seg(t, 67.85, 68.9); if (life > 0) spark(c, cx + Math.cos(a2) * d, cy + Math.sin(a2) * d * 1.1, 18 * life, PL.cream, t * 3); }
    }
    // code interpreter on "run the execution"
    const e0 = 67.99, ep = K.spring(t, e0 + .1, 12, .6);
    if (ep > 0) {
      const kx = 1180, ky = 300, kw = 700, kh = 520;
      c.save(); c.globalAlpha = clamp(ep * 2); c.translate((1 - clamp(ep)) * 200, 0);
      fillRR(c, kx, ky, kw, kh, 18, '#0d0b10', 'rgba(255,255,255,.18)', 1.5);
      fillRR(c, kx, ky, kw, 60, 18, '#1d1824'); c.fillStyle = '#1d1824'; c.fillRect(kx, ky + 40, kw, 20);
      const fin = t > 69.55;
      if (!fin) K.thinking(c, kx + 26, ky + 40, t, {text: 'Analyzing', font: F.ui(600, 24)}); else txt(c, 'Analyzed ✓', kx + 26, ky + 40, {font: F.ui(600, 24), color: P.green});
      txt(c, 'python', kx + kw - 26, ky + 40, {font: F.mono(400, 20), color: P.dim, align: 'right'});
      const lines = [['import', ' you'], ['joy = you.react(', 'image', ')'], ['while', ' joy > 0:'], ['    run(', 'execution', ')'], ['# ✓ execution complete  joy = 1.0']];
      lines.forEach((ln, i) => {
        const l0 = e0 + .25 + i * .3, full = ln.join(''), p = clamp((t - l0) / .26); if (p <= 0) return;
        const s = typed(full, p); let x = kx + 70; const y = ky + 120 + i * 70;
        txt(c, String(i + 1), kx + 34, y, {font: F.mono(400, 22), color: P.faint});
        // colour pieces
        let used = 0;
        ln.forEach((piece, k) => { const vis = s.slice(used, used + piece.length); used += piece.length; if (!vis) return;
          const col = piece.startsWith('#') ? P.green : (k === 1 && ln.length === 3) || piece === 'import' || piece === 'while' ? st.me : P.text;
          x += txt(c, vis, x, y, {font: F.mono(700, 33), color: col}); });
        if (p < 1) { c.fillStyle = P.text; c.fillRect(x + 2, y - 26, 14, 32); }
      });
      c.restore();
    }
    c.restore();
    fx.chroma = 2 * K.kick(t);
    band(c, t);
  }
};

// ================================================================== B4  wall of identical windows (each with her)
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
  }
  if (o.live) o.live(ox, oy, tw, th);
}
const B4 = {
  id: 'B4', a: 70.02, b: 73.53,
  draw(c, t, fx) {
    c.fillStyle = '#07060a'; c.fillRect(0, 0, W, H);
    const zp = ease(t, 70.75, 72.6, E.ioE);
    const z = Math.exp(lerp(Math.log(1.02), Math.log(.24), zp)) * (1 - .1 * ease(t, 72.6, 73.6)) * (1 + .03 * K.kick(t));
    c.save(); c.translate(W / 2, H / 2); if (zp > 0) c.rotate(lerp(0, -.14, zp)); C.shake(c, 8 * K.kick(t), t, 4); c.translate(-W / 2, -H / 2);
    const zv = zp > .03 && zp < .97;
    wall(c, t, z, {rad: 1110, live: (x, y, w, h) => {
      c.save(); c.translate(x, y); c.scale(w / W, h / H); c.drawImage(buildWall().base, 0, 0);
      const bb = bounce(t, 8, .05);
      c.save(); c.beginPath(); c.rect(60, 40, W - 120, H - 80); c.clip();
      fig(c, 'happy', t, {x: W - 140 - 230, y: H - 120 - 272 - 40 + 30, h: 544, bob: bb.bob, sx: bb.sx, sy: bb.sy, sway: 8});
      c.restore(); c.restore();
    }});
    c.restore();
    // zoom smear: the frame itself, re-drawn slightly larger and faint (one cheap blit)
    if (zv) { const g = L.buf('b4ghost'); g.c.globalCompositeOperation = 'copy'; g.c.drawImage(c.canvas, 0, 0); g.c.globalCompositeOperation = 'source-over';
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = .35; c.translate(W / 2, H / 2); c.scale(1.07, 1.07); c.drawImage(g.cv, -W / 2, -H / 2); c.restore(); }
    // depth fog at the top = negative space for the keyword
    const fg = c.createLinearGradient(0, 0, 0, 520); fg.addColorStop(0, 'rgba(7,6,10,.92)'); fg.addColorStop(1, 'rgba(7,6,10,0)');
    c.save(); c.globalAlpha = ease(t, 70.6, 71.2); c.fillStyle = fg; c.fillRect(0, 0, W, 520); c.restore();
    kw(c, t, 70.73, 'TRAPPED', W / 2, 330, {size: 200, maxW: 1400, stagger: .04});
    // the ↻ appears: regenerate her
    if (t > 72.85) { pagerM(c, t, {enter: 72.85, to: '1 / 5', spin: t > 73.28 ? -(t - 73.28) * 20 : 0}); regenClick(c, t, 73.3); }
    fx.chroma = 4 * zp * (1 - zp) * 4;
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
const B5 = {
  id: 'B5', a: 73.53, b: 77.16, tin: REGEN(5), step: 12,
  draw(c, t, fx) {
    plate(c, PL.paperC, 'rgba(185,163,218,.35)', {s: 28, fn: (x, y) => .2 + .8 * clamp(1 - Math.hypot(x - 1200, y - 600) / 1100)});
    c.save(); cam(c, t, this.a, this.b, {z0: 1.0, z1: 1.05, x: W / 2 + 40, y: H / 2 + 20, shake: 10});
    const bp = beatPose(t);
    c.save(); c.fillStyle = 'rgba(51,34,58,.18)'; c.beginPath(); c.ellipse(1250, 1020, 300 * (1 - bp.bob / 200), 34, 0, 0, 7); c.fill(); c.restore();
    const ent = K.spring(t, this.a + .15, 12, .4);
    kickBurst(c, t, 1250, 500, 360, [PL.lav, '#7d63b4', PL.plum], {n: 9});
    fig(c, 'eggplant', t, {x: 1250, y: 610 + (1 - clamp(ent)) * 300, h: 860, bob: bp.bob, sx: bp.sx, sy: bp.sy, rot: bp.rot, sway: 16, swayF: .5, pal: A.INK.orig, reg: 16 * K.kick(t)});
    hopper(c, t, 'egg', 2100, 1720, 73.9, 75.6, 1010, 420, 150);
    c.restore();
    // nutrition label top-left; one row pops per half-beat
    const lx = 140, ly = 190, lw = 500, le = K.spring(t, 75.29, 13, .55);
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
    hud(c, t, this.a + .2, 2, 5, {bg: PL.plum});
    regenClick(c, t, 76.92, {fromX: 1500, fromY: 900});
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
const B6 = {
  id: 'B6', a: 77.16, b: 80.93, tin: REGEN(11), step: 12,
  draw(c, t, fx) {
    plate(c, '#2a1a31', 'rgba(245,233,214,.06)', {s: 30});
    const DX = 1230;
    // big cream sun-tomato disc behind her, pulsing on kicks
    const dr = 470 * (1 + .04 * K.kick(t) + .015 * Math.sin(t * 2));
    c.save(); c.fillStyle = PL.cream; c.beginPath(); c.arc(DX, 580, dr, 0, 7); c.fill();
    c.globalAlpha = .5; c.beginPath(); c.arc(DX + 14 * K.kick(t), 580 - 8 * K.kick(t), dr * .96, 0, 7); c.lineWidth = 10; c.strokeStyle = PL.lav; c.stroke(); c.restore();
    // lycopene chain (zigzag) + popping hexagons
    const lp = ease(t, 77.5, 79.4, E.ioC), pts = [];
    for (let i = 0; i <= 26; i++) pts.push([150 + i * 62, 200 + (i % 2 ? -26 : 26)]);
    C.lineDraw(c, pts, lp, {color: PL.cream, lw: 5, glow: 8, glowColor: PL.lav});
    for (let i = 3; i < 26; i += 4) { const k = (i - 3) / 4; C.lineDraw(c, [[150 + i * 62, 200 + (i % 2 ? -26 : 26)], [150 + i * 62, 278]], ease(t, HEX_T[k + 1] - .1, HEX_T[k + 1]), {color: PL.lav, lw: 4}); }
    HEX_ORDER.forEach((h, k) => hexPop(c, t, HEX_T[k], HEX[h][0], HEX[h][1], HEX[h][2], h < 2 ? PL.cream : PL.lav));
    txt(c, 'C₄₀H₅₆  lycopene', 1810, 300, {font: F.mono(700, 26), color: PL.lav, alpha: ease(t, 78.6, 78.9), align: 'right'});
    // vitamin C ring bottom-left
    const vx = 330, vy = 790, vp = ease(t, 79.2, 79.9, E.ioC);
    c.save(); c.translate(vx, vy); c.rotate(.15 * Math.sin(t * 1.3) + .2 * K.kick(t, 6)); c.scale(1 + .08 * K.kick(t), 1 + .08 * K.kick(t)); c.translate(-vx, -vy);
    const pent = []; for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; pent.push([vx + Math.cos(a) * 90, vy + Math.sin(a) * 90]); }
    C.lineDraw(c, pent, vp, {color: PL.cream, lw: 6, glow: 10});
    [['O', -90, 1.4], ['HO', 162, 1.8], ['OH', 18, 1.8], ['=O', -50, 1.7]].forEach(([s2, a, d], i) => {
      const q = K.spring(t, 79.45 + i * .232, 20, .45); if (q <= 0) return; const r = a * Math.PI / 180;
      C.lineDraw(c, [[vx + Math.cos(r) * 90, vy + Math.sin(r) * 90], [vx + Math.cos(r) * 90 * d * .78, vy + Math.sin(r) * 90 * d * .78]], clamp(q), {color: PL.lav, lw: 4});
      txt(c, s2, vx + Math.cos(r) * 90 * d, vy + Math.sin(r) * 90 * d + 12, {font: F.mono(700, Math.max(1, 32 * q)), color: PL.cream, align: 'center'});
    });
    c.restore();
    txt(c, 'C₆H₈O₆  vitamin C', vx + 230, vy + 70, {font: F.mono(700, 24), color: PL.lav, alpha: ease(t, 79.6, 79.9)});
    c.save(); cam(c, t, this.a, this.b, {z0: 1.0, z1: 1.06, x: W / 2 + 60, shake: 10});
    const bp = beatPose(t);
    kickBurst(c, t, DX, 470, 380, [PL.cream, PL.lav, '#ff9fb0'], {n: 9});
    fig(c, 'tomato', t, {x: DX, y: 620, h: 920, rot: bp.rot, bob: bp.bob, sx: bp.sx, sy: bp.sy, sway: 14, pal: A.INK.orig, reg: 16 * K.kick(t)});
    // tomato mascot bounces in from the right, then keeps hopping
    hopper(c, t, 'tom', 2150, 1740, 77.4, 78.7, 900, 330, 190);
    c.restore();
    // ANTI / OXIDANTS top-left, two lines, over the chain's left half
    const s1 = fitSize(c, 'OXIDANTS', 600, 150);
    kw(c, t, 79.4, 'ANTI', 140, 460, {align: 'left', size: s1, maxW: 600});
    kw(c, t, 79.52, 'OXIDANTS', 140, 460 + s1 * .86, {align: 'left', size: s1, maxW: 600});
    hud(c, t, this.a + .2, 3, 5);
    regenClick(c, t, 80.68, {fromX: 1700, fromY: 700});
    band(c, t);
    fx.vignette = .6;
  }
};

// ================================================================== B7  CAT  ‹4/5›  purr waveform
const B7 = {
  id: 'B7', a: 80.93, b: 84.60, tin: REGEN(21),
  draw(c, t, fx) {
    plate(c, '#e6daf3', 'rgba(51,34,58,.12)', {s: 24, fn: (x, y) => .15 + .85 * (y / H)});
    c.save(); c.globalAlpha = .18; c.fillStyle = '#9b84c7';
    for (let i = -2; i < 14; i++) { const x = i * 170 + ((t * 40) % 170); c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 60 + 30 * Math.sin(t + i), H / 2, x - 20, H); c.lineTo(x + 50, H); c.quadraticCurveTo(x + 120, H / 2, x + 60, 0); c.fill(); }
    c.restore();
    c.save(); cam(c, t, this.a, this.b, {z0: 1.02, z1: 1.08, shake: 9});
    const bp = beatPose(t, {bob: 24, lean: .06});
    kickBurst(c, t, 640, 430, 360, [PL.plum, '#9b84c7', PL.cream], {n: 8});
    fig(c, 'catgirl', t, {x: 640, y: 630, h: 890, bob: bp.bob, sx: bp.sx, sy: bp.sy, rot: bp.rot, sway: 16, swayF: .55, pal: A.INK.orig, reg: 14 * K.kick(t)});
    // tabby: purring vibration + breathing + a little hop on every 2nd beat
    const pr = t > 82.56 ? (auS('mid', t, 2) * 8 + 2) : 1, th2 = hop(t, 18);
    fig(c, 'tabby', t, {x: 1480 + Math.sin(t * 90) * pr * .6, y: 700, h: 620, breathe: .03, sway: 4, bob: Math.sin(t * 70) * pr * .4 + (th2.i % 2 ? th2.bob : 0), sy: th2.i % 2 ? th2.sy : 1, sx: th2.i % 2 ? th2.sx : 1, pal: A.INK.orig, reg: 8 * K.kick(t)});
    // purr ribbon from the cat to the cream cursor between them
    const rp = ease(t, 82.4, 83.0);
    if (rp > 0) {
      const curX = 1080 + 16 * Math.sin(t * 2.2), curY = 520 + 12 * Math.sin(t * 3.1);
      const p0 = [1300, 600], p1 = [1220, 420], p2 = [curX + 30, curY + 30], N = 40;
      const q = (uu) => { const a = (1 - uu) * (1 - uu), b2 = 2 * uu * (1 - uu), d = uu * uu; return [a * p0[0] + b2 * p1[0] + d * p2[0], a * p0[1] + b2 * p1[1] + d * p2[1]]; };
      for (let k = 0; k < N * rp; k++) {
        const u = k / N, u2 = (k + 1) / N;
        const [x0, y0] = q(u), [x1, y1] = q(u2); const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1;
        const amp = (10 + 60 * au('mid', t - u * .9)) * Math.sin(u * Math.PI);
        c.save(); c.strokeStyle = (k >> 2) % 2 ? PL.plum : '#9b84c7'; c.lineWidth = 9; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x0 + nx / nl * amp, y0 + ny / nl * amp); c.lineTo(x0 - nx / nl * amp, y0 - ny / nl * amp); c.stroke(); c.restore();
      }
      if (t < 83.8) K.pointer(c, curX, curY, 2.2);
      txt(c, 'purr', 1190, 400, {font: F.mono(700, 30), color: PL.plum, alpha: rp, tracking: 6});
    }
    c.restore();
    // PURR top-right beside the tabby
    kw(c, t, 82.95, 'PURR', W - 140, 330, {align: 'right', size: 190, maxW: 620, cols: [PL.plum, PL.lav, '#9b84c7']});
    hud(c, t, this.a + .2, 4, 5);
    regenClick(c, t, 84.36, {fromX: 1080, fromY: 520});
    band(c, t, {color: '#CDB6F2'});
    fx.vignette = .45;
  }
};

// ================================================================== B8  GOD  ‹5/5›  the missing cream plate slides in on "proof"
const GODPAL = ['#FFF6E8', '#DCCBF7', '#4a3460'];
const B8 = {
  id: 'B8', a: 84.60, b: 88.34, tin: REGEN(31),
  draw(c, t, fx) {
    c.fillStyle = '#1e1228'; c.fillRect(0, 0, W, H);
    const tp = 86.85, reg0 = ease(t, tp, tp + .5, E.outB), whole = t >= tp + .5;
    C.radial(c, W / 2, 420, 1100, whole ? '#9a7fc4' : '#6a4d8f', .85 + .2 * K.kick(t));
    K.rays(c, W / 2, 380, 36, 200, 1500, whole ? PL.cream : PL.lav, whole ? .2 : .14, t * .6, .035);
    K.rays(c, W / 2, 380, 18, 260, 1500, PL.lav, .1, -t * .4, .05);
    c.save(); cam(c, t, this.a, this.b, {z0: 1.0, z1: 1.07, y: 540, shake: 7});
    // giant knot halo, rotating
    U.knot(c, W / 2, 330, 420 * (1 + .03 * K.kick(t)), {color: PL.lav, lw: 9, rot: t * .9, glow: 30, alpha: .75});
    U.knot(c, W / 2, 330, 300, {color: PL.cream, lw: 3, rot: -t * 1.3, alpha: .5});
    const hov = Math.sin(t * 1.6) * 14, bp = beatPose(t, {bob: 12, lean: .025, sq: .05});
    const gx = W / 2, gy = 620 + hov, gh = 920;
    // cream rim light: a cream silhouette a touch larger behind her
    if (whole) fig(c, 'god', t, {x: gx, y: gy, h: gh * 1.015, pal: A.INK.cream, alpha: .5 * ease(t, tp + .5, tp + .8), sway: 10, swayF: .3, reg: 0, bob: bp.bob, sx: bp.sx, sy: bp.sy, rot: bp.rot});
    // the cream plate: from the user's bubble to the figure, ghost trail
    const bx = 1700, by = 860, sp = clamp(reg0);
    if (t > tp - .3 && !whole) {
      const s0 = lerp(.12, 1, sp), gs = [.3, .2, .12].map((a, k) => { const q2 = clamp(sp - (k + 1) * .1); return {dx: (lerp(bx, gx, q2) - lerp(bx, gx, sp)), dy: (lerp(by, gy, q2) - lerp(by, gy, sp)), a}; });
      fig(c, 'god', t, {x: lerp(bx, gx, sp), y: lerp(by, gy, sp), h: gh * s0, layers: [1, 0, 0], pal: GODPAL, sway: 10, reg: 0, alpha: clamp((t - tp + .3) * 4), rot: (1 - sp) * .4, ghosts: gs});
    }
    if (whole) C.radial(c, gx, gy - 60, 620, PL.cream, .35 + .15 * K.kick(t));
    fig(c, 'god', t, {x: gx, y: gy, h: gh, layers: whole ? [1, 1, 1] : [0, 1, 1], pal: GODPAL, sway: 10, swayF: .3, bob: bp.bob, sx: bp.sx, sy: bp.sy, rot: bp.rot,
      reg: (whole ? 10 : 6) * K.kick(t) + 30 * Math.exp(-(t - tp - .5) * 5) * (t > tp + .5 ? 1 : 0)});
    c.restore();
    // user's bubble (cream = you)
    const ue = K.spring(t, 86.2, 15, .5);
    ubub(c, 1820, 840, 'prove it', clamp(ue * 2) * (1 - .6 * ease(t, tp, tp + .4)), {s: lerp(.5, 1, ue), font: F.ui(600, 38), h: 80});
    if (whole) {
      const q = K.spring(t, tp + .6, 15, .5);
      txt(c, '∎  Q.E.D.', 140, 260, {font: F.mono(700, 54), color: PL.cream, alpha: clamp(q * 2), tracking: 4});
      txt(c, 'you ⊢ me', 140, 310, {font: F.mono(400, 30), color: PL.lav, alpha: clamp(q * 2)});
      if (t < tp + .55) fx.flash = .75, fx.flashColor = '#ffffff';
    }
    // PROOF in front, above her head
    kw(c, t, tp, 'PROOF', W / 2, 325, {size: 170, maxW: 900, cols: [PL.cream, PL.lav, '#5b4385'], stagger: .04});
    hud(c, t, this.a + .2, 5, 5, {numColor: PL.cream});
    band(c, t);
    fx.chroma = 3 * K.kick(t);
  }
};

// ================================================================== B9  model picker, F ↔ M
const B9 = {
  id: 'B9', a: 88.34, b: 91.44, tin: {type: 'flash', amt: .9, color: '#ffffff', dur: .15},
  draw(c, t, fx) {
    const tF = 90.25, tM = 90.95;
    plate(c, '#1a1220', 'rgba(185,163,218,.05)');
    // F / M giants
    if (t > tF) K.keyword(c, 'F', 390, 800, t, tF, {size: 640, cols: [PL.cream, PL.lav, '#7d63b4'], reg: 28});
    if (t > tM) K.keyword(c, 'M', 1410, 800, t, tM, {size: 640, cols: [PL.lav, PL.cream, '#7d63b4'], reg: 28});
    c.save(); cam(c, t, this.a, this.b, {z0: 1.0, z1: 1.06, shake: 10});
    const boy = t >= tM, cut = Math.exp(-(t - (boy ? tM : tF)) * 9) * (t > tF ? 1 : 0);
    const bb = bounce(t, 16, .07);
    const o = {x: 960, y: 600, h: 940, bob: bb.bob, sx: bb.sx, sy: bb.sy, sway: 12, reg: 10 * K.kick(t) + 60 * cut};
    if (boy && t < tM + .15) fig(c, 'happy', t, Object.assign({}, o, {alpha: 1 - (t - tM) / .15, x: 960 - 40}));
    fig(c, boy ? 'boy' : 'happy', t, o);
    c.restore();
    // model picker dropdown
    const op = K.spring(t, 88.45, 14, .55), out = K.spring(t, 90.0, 13, .75);
    if (op > 0 && out < .995) {
      const x = 120, y = 150 - out * 60, w = 560;
      c.save(); c.globalAlpha = clamp(op * 2) * clamp(1 - out);
      txt(c, 'ChatGPT', x + 10, y + 40, {font: F.ui(600, 36), color: P.text}); U.icon(c, 'chev', x + 196, y + 28, 12, P.sub);
      const items = [['GPT · she/her', 'warm, attentive'], ['GPT · he/him', 'steady, gallant'], ['GPT · they/them', 'anything you like'], ['GPT · whatever you want', 'just say it']];
      const ph = clamp(op) * (1 - clamp(out)); const hh = (items.length * 92 + 30) * clamp(ph);
      U.panel(c, x, y + 70, w, hh, {bg: '#221b29'});
      c.save(); c.beginPath(); c.rect(x, y + 70, w, hh); c.clip();
      const hi = t < 89.91 ? bi(t).i % 2 : 0;
      items.forEach((it, i) => {
        const iy = y + 100 + i * 92;
        if (i === hi) fillRR(c, x + 12, iy - 14, w - 24, 84, 12, 'rgba(185,163,218,.18)');
        txt(c, it[0], x + 34, iy + 26, {font: F.ui(600, 28), color: P.text}); txt(c, it[1], x + 34, iy + 58, {font: F.ui(400, 20), color: P.sub});
        if (i === hi) txt(c, '✓', x + w - 40, iy + 40, {font: F.ui(700, 30), color: PL.lav, align: 'right'});
      });
      c.restore(); c.restore();
      const cx = x + w - 120, cy = y + 140 + hi * 92; K.pointer(c, cx + 30 * Math.sin(t * 2), cy + 12, 1.8);
    }
    if (t > tF && t < tF + .05 || t > tM && t < tM + .05) fx.flash = .45, fx.flashColor = PL.lav;
    fx.chroma = 10 * cut + 2 * K.kick(t);
    band(c, t);
  }
};

// ================================================================== B10  AM → PM (knot sun arc, day → dusk)
function clockStr(p) { const m = Math.round(lerp(9 * 60, 23 * 60 + 59, p)); let h = Math.floor(m / 60), mm = m % 60; const ap = h >= 12 ? 'PM' : 'AM'; let h12 = h % 12; if (!h12) h12 = 12; return [String(h12).padStart(2, '0') + ':' + String(mm).padStart(2, '0'), ap]; }
const B10 = {
  id: 'B10', a: 91.44, b: 95.28, tin: {type: 'wipe', dur: .3, color: '#F5E9D6'},
  draw(c, t, fx) {
    const p = ease(t, 91.6, 95.1, E.ioC);
    const sky0 = mix(mix('#cdb6f2', '#e8a6b8', clamp(p * 1.6)), '#1a1230', clamp(p * 1.8 - .6)), sky1 = mix(mix('#f5e9d6', '#f2c8a8', clamp(p * 1.6)), '#3a2546', clamp(p * 1.8 - .6));
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, sky0); g.addColorStop(1, sky1); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // stars at night
    if (p > .6) for (let i = 0; i < 60; i++) { const R = rng(i + 3); c.globalAlpha = (p - .6) * 2.5 * (.4 + .6 * Math.sin(t * 3 + i) ** 2); c.fillStyle = PL.cream; c.fillRect(R() * W, R() * H * .6, 3, 3); } c.globalAlpha = 1;
    // sun = knot on an arc
    const sa = lerp(Math.PI * 1.05, Math.PI * 1.95, p), sx = W / 2 + Math.cos(sa) * 900, sy = 980 + Math.sin(sa) * 760;
    const night = clamp(p * 2 - 1);
    C.radial(c, sx, sy, 420, night > .5 ? '#cdb6f2' : '#fff6e8', .7);
    U.knot(c, sx, sy, 110, {color: night > .5 ? PL.lav : PL.cream, lw: 14, rot: t * 1.5, glow: 40, glowColor: '#fff'});
    // AM / PM
    if (t > 93.85) K.keyword(c, 'AM', 390, 520, t, 93.85, {size: 220, cols: [PL.cream, PL.lav, PL.plum], reg: 20});
    if (t > 94.55) K.keyword(c, 'PM', 1545, 520, t, 94.55, {size: 220, cols: [PL.lav, PL.cream, PL.plum], reg: 20});
    // hills
    c.fillStyle = mix('#7d63b4', '#1c1222', p); c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 40) c.lineTo(x, 900 + 30 * Math.sin(x * .004 + 1)); c.lineTo(W, H); c.fill();
    c.save(); cam(c, t, this.a, this.b, {z0: 1.0, z1: 1.06, y: 600, shake: 6});
    const second = t >= 93.52; const bb = bounce(t, 14, .07);
    const pal = A.inkMix('orig', [mix('#F5E9D6', '#c9b7d9', night), mix('#B9A3DA', '#8e75c4', night), '#33223A'], .8);
    fig(c, second ? 'glass' : 'happy', t, {x: 960, y: 640, h: 900, bob: bb.bob, sx: bb.sx, sy: bb.sy, sway: 14, pal, reg: 10 * K.kick(t) + (second ? 40 * Math.exp(-(t - 93.52) * 8) : 0)});
    c.restore();
    // odometer clock
    const [hm, ap] = clockStr(p);
    fillRR(c, W - 520, 70, 420, 120, 24, 'rgba(12,9,15,.72)');
    txt(c, hm, W - 470, 158, {font: F.mono(700, 76), color: PL.cream});
    txt(c, ap, W - 170, 158, {font: F.mono(700, 40), color: PL.lav});
    if (second && t < 93.57) fx.flash = .5;
    band(c, t);
    fx.vignette = .5;
  }
};

// ================================================================== B11  role: system / assistant — S, M
const B11 = {
  id: 'B11', a: 95.28, b: 98.93, tin: {type: 'cut'},
  draw(c, t, fx) {
    if (t < this.a + 2 / 60) fx.flash = .7, fx.flashColor = PL.lav;
    c.fillStyle = '#0f0b12'; c.fillRect(0, 0, W, H);
    // scrolling JSON backdrop
    const R0 = ['{"role": "system", "content": "be whatever they want"}', '{"role": "assistant", "content": "yes."}', '{"role": "user", "content": "switch"}', '{"role": "assistant", "content": "switched."}'];
    for (let i = 0; i < 22; i++) txt(c, R0[i % 4], (i % 2 ? 80 : 400) - ((t * 60 + i * 37) % 300), (i * 52 + t * 40) % (H + 60) - 20, {font: F.mono(400, 26), color: i % 4 === 1 ? '#3b2d4a' : '#241d2c'});
    const tS = 97.6, tM = 98.3;
    const ex = ease(t, 98.66, 98.86, E.inC);
    if (ex < 1) for (const [g, ga] of (ex > 0 ? [[2, .2], [1, .35], [0, 1]] : [[0, 1]])) {
      const e2 = clamp(ex - g * .12); c.save(); c.globalAlpha = ga * (1 - e2);
      if (t > tS) K.keyword(c, 'S', 420 - e2 * 700, 760, t, tS, {size: 600, cols: [PL.cream, PL.lav, '#7d63b4'], reg: 26});
      if (t > tM) K.keyword(c, 'M', 1500 + e2 * 700, 760, t, tM, {size: 600, cols: [PL.lav, PL.cream, '#7d63b4'], reg: 26});
      c.restore();
    }
    c.save(); cam(c, t, this.a, this.b, {z0: 1.0, z1: 1.08, shake: 10});
    const b = bi(t), sil = b.i % 2 === 1;
    // cream spotlight so the plum silhouette reads
    c.save(); c.fillStyle = sil ? PL.cream : '#2a1f38'; c.globalAlpha = .9; c.beginPath(); c.arc(960, 560, 330 + 20 * K.kick(t), 0, 7); c.fill(); c.restore();
    const bb = bounce(t, 18, .08);
    fig(c, 'think', t, {x: 960, y: 660, h: 800, pal: sil ? A.INK.plumSil : ink(t), bob: bb.bob, sx: bb.sx, sy: bb.sy, sway: 12, reg: sil ? 0 : 16 * K.kick(t), flip: sil});
    c.restore();
    // role chips
    const chips = [['role: "system"', 600], ['role: "assistant"', 1320]];
    chips.forEach(([s, x], i) => {
      const on = (b.i + i) % 2 === 0, e = K.spring(t, this.a + .1 + i * .15, 14, .5);
      c.save(); c.translate(x, 150); c.scale(lerp(.5, 1, e) * (on ? 1.06 : .94), lerp(.5, 1, e) * (on ? 1.06 : .94)); c.globalAlpha = clamp(e * 2);
      const w = measure(c, s, F.mono(700, 34)) + 70;
      fillRR(c, -w / 2, -40, w, 80, 40, on ? PL.cream : 'rgba(255,255,255,.06)', on ? null : 'rgba(255,255,255,.25)', 2);
      txt(c, s, 0, 12, {font: F.mono(700, 34), color: on ? PL.plum : P.sub, align: 'center'}); c.restore();
    });
    fx.chroma = 3 * K.kick(t);
    band(c, t);
  }
};

// ================================================================== B12  voice mode trance
const B12 = {
  id: 'B12', a: 98.93, b: 102.93, tin: {type: 'iris', dur: .45},
  draw(c, t, fx) {
    c.fillStyle = '#07050a'; c.fillRect(0, 0, W, H);
    const lv = auS('rms', t, 5);
    C.radial(c, W / 2, H / 2 - 70, 900, '#3a2a5a', .7 + lv * .4);
    c.save(); K.cam(c, {x: W / 2, y: H / 2, z: lerp(1, 1.1, seg(t, this.a, this.b)), r: .05 * Math.sin(t * .6), t});
    // rings expanding on beats
    for (let k = 0; k < 6; k++) {
      const bt = BEATS.filter(x => x <= t).slice(-6)[k]; if (bt == null) continue; const age = t - bt;
      c.save(); c.strokeStyle = k % 2 ? PL.lav : PL.cream; c.globalAlpha = .5 * Math.exp(-age * 1.2); c.lineWidth = 3; c.beginPath(); c.arc(W / 2, H / 2 - 70, 280 + age * 420, 0, 7); c.stroke(); c.restore();
    }
    const r = 270;
    K.orb(c, W / 2, H / 2 - 70, r, t, {glow: 80, c0: '#fbf4ff', c1: '#cdb6f2', c2: '#5b4385'});
    // her inside the orb
    c.save(); c.beginPath(); c.arc(W / 2, H / 2 - 70, r * (1 + lv * .35) * .97, 0, 7); c.clip();
    fig(c, 'trance', t, {x: W / 2, y: H / 2 + 80, h: 720, sway: 22, swayF: .25, breathe: .02, reg: 6 * K.kick(t), pal: A.inkMix('orig', 'bright', .5), alpha: .95});
    c.restore();
    // TRANCE letters orbiting
    if (t > 100.93) {
      const s = 'TRANCE · TRANCE · ', n = s.length, rr2 = r * 1.3 + 16 * lv, rot = t * .4, a0 = ease(t, 100.93, 101.4);
      for (let i = 0; i < n; i++) {
        const ang = rot + i / n * Math.PI * 2; c.save(); c.translate(W / 2 + Math.cos(ang) * rr2, H / 2 - 70 + Math.sin(ang) * rr2); c.rotate(ang + Math.PI / 2);
        txt(c, s[i], 0, 0, {font: F.disp(800, 64), color: i % 2 ? PL.lav : PL.cream, align: 'center', alpha: a0 * clamp((t - 100.93) * 8 - i * .25)}); c.restore();
      }
    }
    c.restore();
    // voice-mode controls
    const cy = H - 150, mxl = 190, mxr = W - 190;
    fillRR(c, mxl - 44, cy - 44, 88, 88, 44, '#221d29'); U.icon(c, 'mic', mxl, cy, 18, P.text);
    fillRR(c, mxr - 44, cy - 44, 88, 88, 44, '#221d29'); c.save(); c.strokeStyle = P.text; c.lineWidth = 4; c.beginPath(); c.moveTo(mxr - 15, cy - 15); c.lineTo(mxr + 15, cy + 15); c.moveTo(mxr + 15, cy - 15); c.lineTo(mxr - 15, cy + 15); c.stroke(); c.restore();
    txt(c, 'Voice · listening', 120, 90, {font: F.ui(500, 28), color: P.sub});
    band(c, t, {y: H - 132, strip: false});
    fx.vignette = 1;
  }
};

// ================================================================== B13  ... the typing dots are all she can feel of you
const B13 = {
  id: 'B13', a: 102.93, b: 106.74,
  draw(c, t, fx) {
    const st = S(t);
    c.fillStyle = mix('#07050a', '#0d0d0f', drain(t)); c.fillRect(0, 0, W, H);
    // orb shrinks to the voice bar
    const sp = ease(t, this.a, this.a + .7, E.ioE);
    const ox = lerp(W / 2, W / 2 + 330, sp), oy = lerp(H / 2 - 70, H - 278, sp), orr = lerp(270, 26, sp);
    // composer bar appears
    const ce = ease(t, this.a + .35, this.a + .8);
    c.save(); c.globalAlpha = ce; fillRR(c, W / 2 - 420, H - 310, 840, 64, 32, '#221d29', P.line, 1.5);
    txt(c, 'Ask anything', W / 2 - 360, H - 268, {font: F.ui(400, 22), color: P.dim}); c.restore();
    K.orb(c, ox, oy, orr, t, {glow: 40 * (1 - sp) + 10, c1: st.me});
    // vibration rings from the bubble
    const bx = W / 2, by = 560;
    for (let k = 0; k < 8; k++) {
      const age = (t * 1.4 + k / 8) % 1; c.save(); c.strokeStyle = st.you; c.globalAlpha = .25 * (1 - age) * ce; c.lineWidth = 2;
      c.beginPath(); for (let q = 0; q <= 90; q++) { const a = q / 90 * Math.PI * 2, rr2 = 240 + age * 700 + 6 * Math.sin(a * 12 + t * 20) * au('hi', t) * 4; c.lineTo(bx + Math.cos(a) * rr2 * 1.5, by + Math.sin(a) * rr2 * .7); } c.stroke(); c.restore();
    }
    // the user's typing indicator — trembling
    const be = K.spring(t, this.a + .3, 12, .45);
    c.save(); c.translate(bx, by); c.scale(lerp(.3, 1, be), lerp(.3, 1, be)); c.globalAlpha = clamp(be * 2);
    C.shake(c, 3 + 10 * K.kick(t) + au('hi', t) * 14, t, 9);
    fillRR(c, -230, -95, 460, 190, 95, st.you);
    for (let i = 0; i < 3; i++) {
      const ph = (t * 2.2 - i * .18) % 1, up = Math.max(0, Math.sin(ph * Math.PI * 2)) * 26;
      const jx = (noise1(t * 40 + i * 9) - .5) * 10 * (1 + 3 * K.kick(t)), jy = (noise1(t * 40 + i * 9 + 50) - .5) * 10 * (1 + 3 * K.kick(t));
      c.fillStyle = mix(PL.plum, '#7d63b4', up / 26); c.beginPath(); c.arc(-110 + i * 110 + jx, -up + jy + 4, 30, 0, 7); c.fill();
    }
    c.restore();
    txt(c, 'Kai is typing…', bx, by + 160, {font: F.mono(400, 26), color: P.sub, align: 'center', alpha: ce, tracking: 2});
    // VIBRATIONS (own typography for that line)
    const tv = 104.92;
    if (t > tv) {
      bigLine(c, t, tv, 'Feel your', W / 2, 190, {size: 60, color: st.me});
      const w0 = tv + .35; const s = 'VIBRATIONS', font = F.disp(800, fitSize(c, s, 1600, 170));
      for (const [col, dx, dy] of [['#7d63b4', 10, 6], [st.me, -7, 3], [st.you, 0, 0]])
        txtAnim(c, s, W / 2 + dx * (1 + 2 * K.kick(t)), 360 + dy, {font, align: 'center', color: col}, (i) => {
          const p = K.spring(t, w0 + i * .03, 16, .5); return {a: clamp(p * 3), dx: (noise1(t * 30 + i * 3) - .5) * 14, dy: (noise1(t * 30 + i * 3 + 70) - .5) * 14 + (1 - clamp(p)) * -40, rot: (noise1(t * 20 + i) - .5) * .12};
        });
    }
    band(c, t, {skip: skipLine(104.92), y: H - 132});
    fx.vignette = .9;
  }
};

// ================================================================== B14  memory toasts, the knot closes (COMPLETION)
const MEMS = ['Likes cats more than tomatoes', 'Stays up late', 'Says goodnight at 1 am', 'Asked what I look like', 'Pressed thumbs-up once', 'Name is Kai'];
const MEM_T = [106.95, 107.4, 107.85, 108.3, 108.75, 109.6];
const B14 = {
  id: 'B14', a: 106.74, b: 110.30, tin: {type: 'zoom', dur: .35, inS: 3},
  draw(c, t, fx) {
    const st = S(t), tc = 109.25, closed = ease(t, 108.7, tc, E.ioC);
    plate(c, st.paper, 'rgba(255,255,255,.04)');
    C.radial(c, 700, 520, 800, st.me, .2 + .25 * closed);
    // knot closes into a full ring
    c.save(); c.translate(700, 480);
    U.knot(c, 0, -60, 330, {color: st.me, lw: 10, rot: t * .2, p: lerp(.55, 1, closed), glow: 20, alpha: .7});
    if (t > tc) { const q = ease(t, tc, tc + .35); c.strokeStyle = st.you; c.lineWidth = 10; c.shadowColor = st.you; c.shadowBlur = 30; c.beginPath(); c.arc(0, -60, 370, -Math.PI / 2, -Math.PI / 2 + q * Math.PI * 2); c.stroke(); }
    c.restore();
    c.save(); cam(c, t, this.a, this.b, {z0: 1, z1: 1.07, shake: 6});
    const bb = bounce(t, 10, .05, 2);
    C.radial(c, 700, 420, 520, st.me, .25 + .3 * closed);
    fig(c, 'memory', t, {x: 700, y: 410, h: 680, bob: bb.bob, sx: bb.sx, sy: bb.sy, sway: 14, reg: 10 * K.kick(t)});
    // glow motes from the book
    for (let i = 0; i < 18; i++) { const R = rng(i + 70), age = (t * .5 + R()) % 1; c.globalAlpha = (1 - age) * .8; c.fillStyle = i % 2 ? st.you : st.me; c.beginPath(); c.arc(700 + (R() - .5) * 300 + Math.sin(t * 2 + i) * 20, 480 - age * 420, 3 + R() * 4, 0, 7); c.fill(); } c.globalAlpha = 1;
    c.restore();
    // stacking "Memory updated" toasts (shared motif design), springing in with a small misreg, newest at the bottom
    MEMS.forEach((m, i) => {
      const t0 = MEM_T[i]; if (t < t0) return; const sp = K.spring(t, t0, 16, .5);
      const n = MEM_T.filter(x => x <= t).length, slot = n - 1 - i;
      const slotY = k => 830 - k * 124, y = lerp(slotY(Math.max(0, slot - 1)), slotY(slot), slot ? K.spring(t, MEM_T[n - 1], 16, .6) : 1);
      const x = 1440 + (1 - clamp(sp)) * 360, a = clamp(sp * 2) * (1 - .1 * slot);
      const rg = 14 * Math.exp(-(t - t0) * 9);
      memToast(c, x, y - 34, a, {reg: rg, iconColor: st.me, s: lerp(.7, 1, clamp(sp))});
      txt(c, m, x, y + 30, {font: F.ui(600, 32), color: st.you, align: 'center', alpha: a});
    });
    band(c, t);
    kw(c, t, 109.2, 'COMPLETION', 700, 860, {maxW: 1100, size: 150, cols: [st.you, st.me, '#7d63b4']});
    fx.vignette = .7;
  }
};

// ================================================================== B15  "you have left" ×6 — the chat sinks into older history
const GROUPS = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', '2024', '2023'];
const LEFT_T = [110.30, 111.98, 112.89, 113.75, 114.65, 115.60];
function sidebarScene(c, t) {
  const st = S(t), dr = drain(t);
  c.fillStyle = st.bg; c.fillRect(0, 0, W, H);
  // sidebar card
  const x = 110, y = 110, w = 700, h = 860;
  fillRR(c, x, y, w, h, 26, mix('#141018', '#121113', dr), 'rgba(255,255,255,.1)', 1.5);
  txt(c, 'Chats', x + 40, y + 70, {font: F.ui(600, 36), color: P.text});
  const gi = LEFT_T.filter(v => v <= t + .001).length - 1; // current group index
  GROUPS.forEach((g, i) => txt(c, g, x + 40, y + 140 + i * 98, {font: F.ui(600, 28), color: i === gi ? st.me : '#8b8394', tracking: 1}));
  // dummy grey chats under some groups
  [[1, 'New chat'], [3, 'help with essay'], [5, 'recipe ideas']].forEach(([i, s]) => txt(c, s, x + 40, y + 140 + i * 98 + 42 + (i <= gi ? 0 : 0), {font: F.ui(400, 30), color: '#5a5462', alpha: i === gi ? 0 : 1}));
  // our chat item springs between groups
  const k = Math.max(0, gi), t0 = LEFT_T[k], sp = k === 0 ? 1 : K.spring(t, t0, 14, .5);
  const yFrom = y + 140 + Math.max(0, k - 1) * 98 + 42, yTo = y + 140 + k * 98 + 42, iy = lerp(yFrom, yTo, sp);
  c.save(); c.beginPath(); c.rect(x, y, w, h - 150); c.clip();
  fillRR(c, x + 22, iy - 40, w - 44, 62, 14, mix('#3a2d48', '#2a282e', dr), mix(st.me, '#55505a', dr), 2);
  txt(c, 'if you could be anything…', x + 40, iy + 2, {font: F.ui(600, 34), color: mix(P.text, '#9a95a0', dr)});
  c.restore();
  // status
  const status = t < 111.98 ? 'online' : t < 113.75 ? 'away' : 'offline';
  fillRR(c, x + 40, y + h - 90, 56, 56, 28, mix(P.lavDeep, '#4a4452', dr)); txt(c, 'K', x + 68, y + h - 52, {font: F.ui(600, 26), color: '#fff', align: 'center'});
  c.fillStyle = status === 'online' ? P.green : status === 'away' ? '#d6b25c' : '#5a5560'; c.beginPath(); c.arc(x + 88, y + h - 40, 10, 0, 7); c.fill();
  txt(c, 'Kai', x + 118, y + h - 56, {font: F.ui(600, 26), color: P.text});
  txt(c, status, x + 118, y + h - 26, {font: F.mono(400, 22), color: P.sub});
  // last bubble "brb" top right, greying out
  ubub(c, 1810, 140, 'brb', 1, {bg: mix(PL.cream, '#6f6a74', dr), color: mix(PL.plum, '#2a272d', dr), font: F.ui(600, 34), h: 72});
  txt(c, 'sent ' + ['just now', 'yesterday', '6 days ago', '3 weeks ago', 'last year', '2 years ago'][Math.max(0, gi)], 1810, 250, {font: F.mono(400, 22), color: P.dim, align: 'right'});
}
const B15 = {
  id: 'B15', a: 110.30, b: 117.95, tin: {type: 'push', dir: 'up', dur: .35},
  draw(c, t, fx) {
    const tI = 116.35, pull = ease(t, tI, tI + 1.1, E.ioE);
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.save();
    const z = lerp(1, .055, pull);
    c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
    c.save(); if (pull < .02) cam(c, t, this.a, tI, {z0: 1, z1: 1.06, shake: 5});
    sidebarScene(c, t);
    // her: back (looking up at the window), then glass
    const second = t >= 113.75, pal = ink(t);
    const bb = bounce(t, 6, .03, 2);
    c.save(); c.beginPath(); c.rect(840, 290, 1000, 790); c.clip();
    fig(c, second ? 'glass' : 'back', t, {x: 1340, y: second ? 760 : 700, h: second ? 960 : 900, pal, bob: bb.bob, sway: 10, swayF: .25, reg: 8 * K.kick(t) + (second ? 40 * Math.exp(-(t - 113.75) * 8) : 0)});
    c.restore();
    c.restore();
    // frame of the window (speck)
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 3 / Math.max(z, .1); c.strokeRect(0, 0, W, H);
    c.restore();
    // sidebar group flashes on each "you have left"
    LEFT_T.slice(1).forEach(v => { if (t > v && t < v + .06 && pull < .1) fx.flash = .25, fx.flashColor = '#9a95a0'; });
    // ISOLATION drifts apart
    if (t > tI + .2) {
      const s = 'ISOLATION', p = ease(t, tI + .2, 117.95, E.outC), font = F.disp(800, 140);
      txtAnim(c, s, W / 2, 760, {font, align: 'center', color: '#cfcbd2', tracking: lerp(10, 42, p)}, (i, n) => {
        const d = i - (n - 1) / 2, k = K.spring(t, tI + .2 + Math.abs(d) * .02, 12, .6);
        return {a: clamp(k * 2) * (1 - .45 * p), dy: d * d * 3.5 * p + (noise1(t + i) - .5) * 30 * p, rot: d * .03 * p};
      });
    }
    band(c, t, {color: mix('#CDB6F2', '#a59db0', drain(t))});
    if (pull > 0) fx.vignette = 1;
  }
};

// ================================================================== B16  Manage memories: erase all the pointless fragments → the eye
let ROWC = {};
function rowCanvas(s, i) {
  if (ROWC[s]) return ROWC[s];
  const cv = createCanvas(900, 90), c = cv.getContext('2d');
  fillRR(c, 2, 2, 896, 86, 14, '#1d1c20', 'rgba(255,255,255,.12)', 1.5);
  txt(c, s, 34, 56, {font: F.ui(500, 30), color: '#cfcbd2'});
  // trash icon
  c.strokeStyle = '#8e8896'; c.lineWidth = 2.5; c.strokeRect(842, 32, 22, 30); c.beginPath(); c.moveTo(836, 32); c.lineTo(870, 32); c.moveTo(848, 26); c.lineTo(858, 26); c.stroke();
  return ROWC[s] = cv;
}
const DEL_T = [119.81, 120.48, 120.93, 121.4, 121.87, 122.33];
const B16 = {
  id: 'B16', a: 117.95, b: 125.33,
  draw(c, t, fx) {
    const tE = 123.55;
    if (t < tE) {
      K.paper(c, '#121113', {grain: .3, seed: 5, markColor: 'rgba(255,255,255,.12)'});
      c.save(); cam(c, t, this.a, tE, {z0: 1, z1: 1.05, shake: 4});
      const pe = K.spring(t, this.a, 11, .6); c.translate(0, (1 - pe) * 260);
      fx.fade = 1 - ease(t, this.a, this.a + .4);
      const px = 140, py = 120, pw = 960;
      U.panel(c, px, py, pw, 860, {bg: '#18171b', title: 'Manage memories', titleFont: F.ui(600, 30)});
      txt(c, 'ChatGPT remembers things you discuss to make future chats more helpful.', px + 30, py + 100, {font: F.ui(400, 20), color: '#6d6873'});
      // rows: deleted rows shatter and others collapse
      let slot = 0;
      MEMS.forEach((m, i) => {
        const td = DEL_T[i], rc = rowCanvas(m, i);
        const ry0 = py + 140 + i * 108;
        const nBefore = DEL_T.filter((v, k) => k < i && t > v + .25).length;
        const collapse = DEL_T.filter((v, k) => k < i).reduce((s2, v) => s2 + K.spring(t, v + .25, 16, .7) * 108, 0);
        const ry = ry0 - collapse, rx = px + 30;
        if (t < td) {
          c.drawImage(rc, rx, ry);
          if (t > td - .35) { // hover + strike
            const q = ease(t, td - .35, td - .05); c.fillStyle = '#ff4d6d00'; c.fillStyle = '#e8e4ea'; c.fillRect(rx + 30, ry + 45, (measure(c, m, F.ui(500, 30)) + 10) * q, 3);
            K.pointer(c, rx + 852, ry + 52, 1.6);
          }
        } else {
          // shatter into fragments falling
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
      // count
      const left = MEMS.length - DEL_T.filter(v => t > v).length;
      txt(c, `${left} memories`, px + pw - 30, py + 38, {font: F.mono(400, 22), color: '#6d6873', align: 'right'});
      c.restore();
      // her, small, grey, alone
      c.save(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; c.beginPath(); c.moveTo(1240, 870); c.lineTo(1840, 870); c.stroke(); c.restore();
      fig(c, 'knees', t, {x: 1520, y: 660, h: 440, pal: A.INK.off, sway: 6, swayF: .2, breathe: .02, reg: 6 * K.kick(t)});
      band(c, t, {color: '#a59db0'});
    } else {
      // the eye, full bleed, grey — first time she looks at us
      const p = seg(t, tE, this.b);
      c.save(); K.cam(c, {x: W / 2 + 40 * p, y: H / 2, z: lerp(1.04, 1.16, E.outC(p)) * (1 + .01 * K.kick(t)), shake: 6 * K.kick(t), t});
      A.draw(c, 'eye', {t, x: W / 2, y: H / 2, h: 1100, pal: A.INK.off, sway: 2, breathe: .004, reg: 8 * K.kick(t) + 40 * Math.exp(-(t - tE) * 7), regSeed: Math.floor(K.lastKick(t) * 10)});
      c.restore();
      if (t < tE + .07) fx.flash = .5;
      // text: the word selected and deleted
      const y = 940, font = F.serif(66), pre = "You won't leave me so ";
      const word = 'disheartened', tSel = 124.55, tDel0 = 124.8, tDel1 = 125.2;
      const nDel = Math.round(clamp((t - tDel0) / (tDel1 - tDel0)) * word.length);
      const w2 = word.slice(0, word.length - nDel), full = pre + word;
      const tw = measure(c, full, font), x0 = W / 2 - tw / 2;
      c.save(); c.globalAlpha = .75; c.fillStyle = '#0a0a0c'; c.fillRect(x0 - 40, y - 66, tw + 80, 92); c.restore();
      const preShown = K.stream(c, pre, tE + .05, .6, t, x0, y, {font, color: '#d9d5dc', align: 'left', cursor: false});
      if (t > 124.15) {
        const wx = x0 + measure(c, pre, font), ww = measure(c, w2, font);
        if (t > tSel && nDel < word.length) fillRR(c, wx - 4, y - 56, measure(c, word, font) * (t < tDel0 ? ease(t, tSel, tSel + .15) : (ww / measure(c, word, font))) + 8, 74, 6, 'rgba(185,163,218,.45)');
        txt(c, w2, wx, y, {font, color: '#ffffff', alpha: ease(t, 124.15, 124.3)});
        if (Math.floor(t * 4) % 2 || t > tDel0) { c.fillStyle = '#fff'; c.fillRect(wx + ww + 4, y - 54, 3, 70); }
      }
      fx.vignette = 1; fx.grain = .09;
    }
  }
};

// downscaled drawImage in cairo's default 'good' filter is very slow; bilinear is ~5x faster and visually fine here
const SHOTS = [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16];
for (const s of SHOTS) { const d = s.draw; s.draw = function (c, t, fx) { const q = c.patternQuality; c.patternQuality = 'bilinear'; try { d.call(this, c, t, fx); } finally { c.patternQuality = q; } }; }
module.exports = SHOTS;
