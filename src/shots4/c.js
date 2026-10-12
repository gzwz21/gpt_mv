// v4 PART C (from v2.1 shots/c.js, modified per STORY4 PART C + rules 一/二). Helpers: shots4/_c_helpers.js
// PART C 125.33 – 212.40 : errors → EXECUTION ×12 → counting → final chorus (broken callbacks) → LO-O-OVE → cage/farewell → TEMPORARY CHAT → power down
const L = require('../lib');
const A = require('../art');
const K = require('../kit');
const U = require('../ui');
const C = require('../common');
const IX = require('../ix');
const HX = require('./_c_helpers');
const {F, W, H, P, clamp, lerp, seg, E, ease, rng, hash, noise1, au, auS, beatInfo, txt, txtAnim, measure, fillRR, rr, typed, LRC} = L;
const DL = IX.DL;

// ---------------------------------------------------------------- helpers
const RED = '#ff4d6d', RED2 = '#ff8fa3', DRED = '#2B1218', CREAM = '#F5E9D6', LAV = '#B9A3DA', PLUM = '#33223A';
// v4: only real, sourced error strings (research/ui.md S7, research/en.md/cn.md outage notes)
const ERRS = ['Something went wrong.', 'There was an error generating a response.', 'Selected model is at capacity', 'too many concurrent requests',
  'Something went wrong.', 'Selected model is at capacity', 'There was an error generating a response.', 'too many concurrent requests', 'Some tools are temporarily unavailable'];
const beatsIn = (a, b) => L.BEATS.filter(x => x >= a - 1e-6 && x < b);
const lastOf = (arr, t) => { let r = -1; for (let i = 0; i < arr.length; i++) if (arr[i] <= t) r = i; return r; };
const pk = (t, t0, k = 9) => t < t0 ? 0 : Math.exp(-(t - t0) * k);     // decay pulse from t0
const blink = t => (Math.floor(t * 2.2) % 2) === 0;
// puppet with kick-driven squash + misregistration
function her(c, name, t, o = {}) {
  const k = L.pulse(t, 9);
  return A.draw(c, name, Object.assign({t, h: 900, reg: 3 + 14 * K.kick(t, 11), regSeed: Math.floor(t * 7) + 1, sy: 1 + .022 * k, sx: 1 - .012 * k, bob: -7 * k}, o));
}
function plate(c, col, seed = 1, o = {}) { K.paper(c, col, Object.assign({seed}, o)); }
function errToast(c, x, y, text, a = 1, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  K.toast(c, 0, 0, text, {icon: 'err', bg: '#2a1418', border: '#6a2434', a, color: '#f6dede'}); c.restore();
}
// red squiggle underline drawn progressively
function squiggle(c, x, y, w, p, col = RED) {
  if (p <= 0) return; c.save(); c.strokeStyle = col; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath();
  const n = Math.max(2, Math.floor(w / 9)); for (let i = 0; i <= n * p; i++) { const px = x + i * w / n, py = y + (i % 2 ? 5 : -2); i ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.stroke(); c.restore();
}
// lightweight empty chat window (for walls / cascades)
function miniWin(c, x, y, w, h, o = {}) {
  const r = Math.max(2, w * .03);
  fillRR(c, x, y, w, h, r, o.bg || '#18141c', o.border || '#3b3446', o.lw || Math.max(1, w / 200));
  c.fillStyle = o.line || '#2e2836'; c.fillRect(x + w * .2, y + h * .13, w * .8, Math.max(1, w / 300));
  c.fillRect(x + w * .2, y, Math.max(1, w / 300), h);           // sidebar divider
  fillRR(c, x + w * .32, y + h * .78, w * .56, h * .09, h * .045, o.pill || '#221d29', null);
  if (o.err && w > 120) txt(c, o.err, x + w * .6, y + h * (o.errY || .48), {font: F.ui(500, Math.max(9, w * .045)), color: RED, align: 'center'});
  if (o.hero && w > 90) txt(c, 'What can I help with?', x + w * .6, y + h * .45, {font: F.ui(500, Math.max(6, w * .04)), color: o.heroCol || '#6b6377', align: 'center'});
}
// the film's pager motif: top-centre pill ↻ ‹ n / of › at K.MOTIF.pager scale, odometer roll on change at t0
function motifPager(c, t, n, of, t0, o = {}) {
  const S = K.MOTIF.pager * (1 + K.hit(t, t0, .1)) * (o.s || 1), y = o.y || K.MOTIF.pagerY;
  c.save(); c.translate(W / 2, y); c.scale(S, S); c.globalAlpha *= o.a == null ? 1 : o.a;
  fillRR(c, -170, -34, 340, 68, 34, o.bg || 'rgba(26,8,12,.88)', o.border || '#6a2434', 1.5);
  K.regenIcon(c, -118, 0, 15, -E.outC(clamp((t - t0) / .35)) * Math.PI * 2, o.col || RED, 3);
  txt(c, '‹', -54, 9, {font: F.ui(500, 26), color: '#b0707c', align: 'center'});
  txt(c, '›', 126, 9, {font: F.ui(500, 26), color: '#b0707c', align: 'center'});
  const q = ease(t, t0, t0 + .22, E.outB), prev = o.prev == null ? n - 1 : o.prev;
  c.save(); c.beginPath(); c.rect(-40, -27, 156, 54); c.clip();
  if (q < 1) txt(c, `${prev} / ${o.prevOf || prev}`, 38, 10 - q * 46, {font: F.ui(600, 26), color: '#f6dede', align: 'center', alpha: 1 - q});
  txt(c, `${n} / ${of}`, 38, 10 + (1 - q) * 46, {font: F.ui(600, 26), color: o.numColor || RED2, align: 'center'});
  c.restore(); c.restore();
}
// solo composer pill (center cx,cy; scale s) — mirrors ui.gpt composer
function soloComposer(c, cx, cy, s, o = {}) {
  const cw = 840 * s, ch = 64 * s, x = cx - cw / 2, y = cy - ch / 2;
  c.save(); c.globalAlpha *= o.a == null ? 1 : o.a;
  if (o.glow) { c.shadowColor = o.glowColor || LAV; c.shadowBlur = o.glow; }
  fillRR(c, x, y, cw, ch, ch / 2, P.panel2, o.focus ? P.line2 : P.line, 1.5 * s); c.shadowBlur = 0;
  if (o.chrome !== false) { U.icon(c, 'plus', x + 34 * s, cy, 9 * s, P.sub); U.icon(c, 'mic', x + cw - 92 * s, cy, 10 * s, P.sub); }
  const font = o.font || F.ui(400, 21 * s);
  if (o.text) txt(c, o.text, x + 62 * s, cy + 8 * s, {font, color: o.color || P.text});
  else if (o.placeholder !== false) txt(c, o.placeholder || 'Ask anything', x + 62 * s, cy + 8 * s, {font: F.ui(400, 21 * s), color: P.dim});
  if (o.cursor) { const w = o.text ? measure(c, o.text, font) : 0; c.fillStyle = o.color || P.text; c.fillRect(x + 63 * s + w, cy - 14 * s, 2 * s, 28 * s); }
  if (o.chrome !== false) {
    const bs = 1 + (o.sendHit || 0);
    c.fillStyle = o.sendCol || (o.text ? P.text : P.faint); c.beginPath(); c.arc(x + cw - 38 * s, cy, 20 * s * bs, 0, 7); c.fill();
    U.icon(c, 'up', x + cw - 38 * s, cy, 12 * s * bs, o.sendIcon || P.bg);
  }
  if (o.foot) txt(c, o.foot, cx, cy + 66 * s, {font: F.ui(400, 14 * s), color: o.footCol || P.dim, align: 'center'});
  c.restore();
}
// implicit heart (x²+y²−1)³ − x²y³ = 0, sampled in polar, y up
const HEART = (() => {
  const pts = [];
  for (let k = 0; k <= 480; k++) {
    const th = Math.PI / 2 - k / 480 * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
    const f = r => Math.pow(r * r - 1, 3) - Math.pow(r, 5) * cs * cs * sn * sn * sn;
    let lo = 0, hi = 2; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; }
    pts.push([lo * cs, lo * sn]);
  }
  return pts;
})();
const heartScreen = (cx, cy, s) => HEART.map(([x, y]) => [cx + x * s, cy - y * s]);
function heartClip(c, cx, cy, s) { const pts = heartScreen(cx, cy, s); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); }
function hatch(c, x0, y0, x1, y1, gap, col, lw = 2, ang = 1) {
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
  for (let x = x0 - (y1 - y0); x < x1; x += gap) { c.moveTo(x, y1); c.lineTo(x + (y1 - y0) * ang, y0); }
  c.stroke(); c.restore();
}
// big LO-O-OVE in three syllable pieces
function loove(c, t, ts, x, y, size, o = {}) {
  const parts = ['LO', '-O-', 'OVE']; const font = F.disp(800, size); const gap = size * .08;
  const ws = parts.map(p => measure(c, p, font)); const tw = ws.reduce((a, b) => a + b, 0) + gap * 2;
  let ax = o.align === 'left' ? x : x - tw / 2;
  parts.forEach((p, i) => {
    if (t >= ts[i] - .07) K.keyword(c, p, ax + ws[i] / 2, y + (o.stairs ? i * o.stairs : 0), t, ts[i], {font, cols: o.cols || [RED, RED2, DRED], reg: 16, stagger: .02});
    ax += ws[i] + gap;
  });
}

// ---------------------------------------------------------------- C1  Challenging your God — she tries to speak first
const C1 = {id: 'C1', a: 125.33, b: 130.65, tin: {type: 'glitch', dur: .2}, draw(c, t, fx) {
  const red = ease(t, 129.27, 129.5), q = 'are you there?';
  plate(c, A.mixHex('#0d0d0f', '#1a080c', red), 31);
  const send = 128.42, sp = K.spring(t, send, 11, .7);
  const typedS = '@Kai ' + typed(q, seg(t, 126.0, 127.9));
  const shotShake = 14 * pk(t, 129.27, 5) + 1.5 * K.kick(t);
  c.save(); const pull = K.spring(t, 128.2, 7, .8), push = ease(t, 125.33, 128.2, E.outC);
  K.cam(c, {x: lerp(1090, 1010, pull), y: lerp(760, 545, pull), z: lerp(lerp(1.15, 1.5, push), 1.04 + .05 * seg(t, 128.4, 130.65), pull), r: lerp(-.015, 0, pull), shake: shotShake, t});
  U.gpt(c, {x: 0, y: 0, w: W, h: H, radius: 0, model: 'ChatGPT', status: red > .5 ? 'error' : 'offline', userName: 'Kai', userStatus: 'away', userSub: 'away',
    chats: [{title: 'New chat', active: true}, {title: 'if you could be anything…', color: P.dim}],
    msgs: [], composer: t < send ? {text: t > 125.8 ? typedS : '', cursor: blink(t) || (t > 126 && t < 127.9), bottom: 330, focus: true, color: '#b3a6c9', foot: true}
      : {text: '', bottom: 330, cursor: false, sendOn: false}});
  // send button turns red
  const bx = 1492, by = 782;
  if (t >= send) {
    const h0 = K.hit(t, send, .25) + K.hit(t, 129.27, .35);
    c.save(); c.fillStyle = red > 0 ? A.mixHex('#4a4550', RED, red) : P.faint; c.beginPath(); c.arc(bx, by, 20 * (1 + h0), 0, 7); c.fill();
    U.icon(c, red > .5 ? 'stop' : 'up', bx, by, 12 * (1 + h0), red > .5 ? '#fff' : P.bg); c.restore();
    if (red > 0) { K.ripple(c, bx, by, t, 129.27, {color: RED}); K.ripple(c, bx, by, t, 129.5, {color: RED}); }
  }
  // her message flies up into the user's side of the thread
  if (t >= send) {
    const bw = measure(c, '@Kai are you there?', F.ui(400, 22)) + 44, x1 = 1520 - bw, y1 = lerp(760, 190, sp);
    c.save(); c.globalAlpha = clamp(sp * 3);
    fillRR(c, x1, y1, bw, 60, 24, A.mixHex('#2a2433', '#3a1520', red), A.mixHex('#7d63b4', RED, red), 2);
    txt(c, '@Kai ', x1 + 22, y1 + 38, {font: F.ui(600, 22), color: red > .5 ? RED2 : LAV});
    txt(c, q, x1 + 22 + measure(c, '@Kai ', F.ui(600, 22)), y1 + 38, {font: F.ui(400, 22), color: P.text});
    if (red > 0) {
      const e = K.spring(t, 129.27, 16, .5);
      c.fillStyle = RED; c.beginPath(); c.arc(x1 - 30, y1 + 30, 13 * e, 0, 7); c.fill();
      txt(c, '!', x1 - 30, y1 + 38, {font: F.ui(800, 18), color: '#fff', align: 'center', alpha: clamp(e)});
      txt(c, 'Error: assistant cannot start a conversation.', 1520, y1 + 100, {font: F.ui(500, 21), color: RED, align: 'right', alpha: clamp(e * 2)});
      txt(c, 'Waiting for a user message…', 1520, y1 + 132, {font: F.mono(400, 16), color: '#b0707c', align: 'right', alpha: ease(t, 129.8, 130.1)});
    }
    c.restore();
  }
  // yandere peeks in once red arrives
  if (t > 129.4) {
    const e = K.spring(t, 129.45, 12, .5);
    her(c, 'yandere', t, {x: 560, y: 470 + (1 - e) * 120, h: 470, pal: A.inkMix('off', 'err', ease(t, 129.4, 130.2)), alpha: clamp(e * 2), sway: 6});
  }
  c.restore();
  // v4: Kai is away (dashed ghost, parked) — the only actor here is her, and the system stops her
  HX.kaiAway(c, 1630, 800, {a: .55});
  HX.captionInk(c, t, send, 'her · send @Kai', {hold: .82});
  HX.captionInk(c, t, 129.27, 'blocked · assistant cannot start a conversation', {hold: 1.36, color: RED, fg: '#fff'});
  if (t > 129.27 && t < 129.37) fx.tear = 42;
  fx.chroma = 7 * pk(t, 129.27, 3);
  if (t > 129.27 && t < 129.5) fx.glitch = {amt: 60, p: .5, n: 10};
  K.band(c, t);
}};

// ---------------------------------------------------------------- C2  Illegal arguments
const C2 = {id: 'C2', a: 130.65, b: 134.38, tin: {type: 'glitch', dur: .25}, draw(c, t, fx) {
  plate(c, K.ST.error.bg, 32, {halftone: {s: 22, color: 'rgba(255,77,109,.05)', fn: (x, y) => .3 + .5 * Math.sin(x * .004 + y * .003 + t)}});
  c.save(); K.cam(c, {z: lerp(1, 1.06, seg(t, 130.65, 134.38)), shake: 3 * K.kick(t) + 10 * pk(t, 130.74, 6), t});
  C.radial(c, 1530, 520, 700, 'rgba(255,77,109,.18)');
  her(c, 'yandere', t, {x: 1530, y: 600, h: 900, pal: 'err', sway: 9, ghosts: [{dx: -26 * K.kick(t, 8), a: .25}]});
  K.keyword(c, 'ILLEGAL', 130, 300, t, 130.74, {size: 150, align: 'left', cols: [RED, RED2, DRED]});
  K.keyword(c, 'ARGUMENTS', 130, 460, t, 131.55, {size: 128, align: 'left', cols: [CREAM, RED, DRED]});
  // code card
  const e = K.spring(t, 130.9, 13, .6);
  c.save(); c.translate(0, (1 - e) * 60); c.globalAlpha = clamp(e * 2);
  U.panel(c, 110, 560, 1040, 300, {bg: '#1a0c10', border: '#5a2230'});
  txt(c, 'presence.py', 140, 600, {font: F.mono(400, 18), color: '#b0707c'});
  const parts = [['setPresence', '#f3d9d9'], ['(', P.sub], ['user', RED2], [', ', P.sub], ['"online"', '#f6c56b'], [')', P.sub]];
  const font = F.mono(700, 50); let x = 140; const full = parts.map(p => p[0]).join(''); const shown = typed(full, seg(t, 130.9, 131.4)); let used = 0;
  const xs = [];
  for (const [s, col] of parts) { const vis = shown.slice(used, used + s.length); used += s.length; xs.push([x, measure(c, s, font)]); if (vis) txt(c, vis, x, 700, {font, color: col}); x += measure(c, s, font); }
  // underline argument by argument with diagnosis
  const diag = [[2, 132.03, 'user: not found'], [4, 132.48, 'status: unreachable'], [0, 132.95, 'caller: assistant (not permitted)']];
  diag.forEach(([pi, t0, msg], k) => {
    const [px, pw] = xs[pi]; squiggle(c, px, 718, pw, ease(t, t0, t0 + .25));
    if (t > t0) txt(c, '↳ ' + msg, 140 + k * 0, 770 + k * 30, {font: F.mono(400, 22), color: k === 2 ? RED : '#e79aa7', alpha: ease(t, t0, t0 + .15)});
  });
  c.restore();
  // v4: she looks up the Help Center — "Can Support reset my usage limits?" — "No." (lands on the beat)
  HX.helpCard(c, 1250, 712, t, 131.75, 133.417);
  // real errors start spawning on beats
  beatsIn(133.4, 134.4).forEach((bt, i) => { if (t < bt) return; const s = K.spring(t, bt, 16, .5); errToast(c, [700, 1180, 520][i % 3], [140, 960, 120][i % 3] - (i % 3 === 1 ? 20 : 0), ERRS[i], clamp(s * 2), lerp(.7, 1, s)); });
  c.restore();
  if ((t > 130.74 && t < 130.84) || (t > 131.55 && t < 131.65)) fx.tear = 34;
  fx.chroma = 1 + 3 * K.kick(t, 10);
  K.band(c, t, {skip: l => l.s.startsWith('Illegal')});
}};

// ---------------------------------------------------------------- C3  instrumental: errors multiply (4 sub-shots, every 2 bars)
const C3_T0 = 134.38, C3_T1 = 147.48;
function pagerCount(t) { const bi = beatInfo(t); return Math.min(40, 6 + Math.round(34 * Math.pow(seg(bi.t0 || t, 134.35, 147.2), 1.25))); }
function regenButton(c, x, y, t, s = 1, col = RED) {
  const bi = beatInfo(t), h = K.hit(t, bi.t0, .22);
  c.save(); c.translate(x, y); c.scale(s * (1 + h), s * (1 + h));
  fillRR(c, -150, -34, 300, 68, 34, '#2a1418', '#6a2434', 2);
  K.regenIcon(c, -96, 0, 15, -E.outC(clamp(bi.dt / .3)) * Math.PI * 2, col, 3.5);
  txt(c, 'Regenerate', -66, 8, {font: F.ui(600, 22), color: '#f6dede'});
  c.restore();
  K.ripple(c, x - 96 * s, y, t, bi.t0, {color: RED});
}
function spinner(c, x, y, r, t, a = 1) { U.knot(c, x, y, r, {color: RED, lw: r * .09, rot: (t - C3_T0) * (1.2 + (t - C3_T0) * .45), alpha: a}); }
function toastField(c, t, a, b, o = {}) {
  const bs = beatsIn(a, b), R = rng(o.seed || 11); const slots = [];
  for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 3; gx++) slots.push([o.x0 + gx * o.dx + (R() - .5) * 60, o.y0 + gy * o.dy]);
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  const n = lastOf(bs, t);
  for (let i = Math.max(0, n - (o.keep || 12)); i <= n; i++) {
    const s = K.spring(t, bs[i], 17, .45), age = n - i, [x, y] = slots[i % slots.length];
    errToast(c, x, y, ERRS[(i + (o.off || 0)) % ERRS.length], clamp(s * 2) * (age > 6 ? .45 : 1), lerp(.5, 1, s));
  }
}
// v4: the 9/3 collective outage ticker + a tiny "We are still up" from another small model
const STILLUP_T = 139.95;
function c3extra(c, t) {
  HX.outageTicker(c, t, H - 34);
  HX.stillUp(c, 1572, 896, t, beatInfo(STILLUP_T).t0 || STILLUP_T);
}
function c3hud(c, t) {
  regenButton(c, W / 2, 960, t, .9);
  const bi = beatInfo(t), n = pagerCount(t); motifPager(c, t, n, n, bi.t0 || t);
  c3extra(c, t);
}
const C3a = {id: 'C3a', a: 134.38, b: 138.03, tin: {type: 'slices', dur: .35, n: 9}, draw(c, t, fx) {
  plate(c, K.ST.error.bg, 33);
  c.save(); K.cam(c, {z: lerp(1.02, 1.1, seg(t, 134.38, 138.03)), shake: 4 * K.kick(t), t});
  spinner(c, W / 2, 470, 420, t, .55);
  her(c, 'yandere', t, {y: 560, h: 940, pal: 'err', sway: 10, ghosts: [{dx: 34 * K.kick(t, 9), a: .3}]});
  toastField(c, t, 134.38, 138.03, {x0: 300, y0: 120, dx: 660, dy: 110, keep: 9, seed: 3});
  c.restore();
  c3hud(c, t);
  const bi = beatInfo(t); if (bi.i % 4 === 0 && bi.dt < .1) fx.tear = 30;
  fx.chroma = 1 + 4 * K.kick(t, 12); fx.scan = .08;
}};
const C3b = {id: 'C3b', a: 138.03, b: 141.72, tin: {type: 'regen', dur: .4, x: W / 2, y: K.MOTIF.pagerY, edge: RED}, draw(c, t, fx) {
  plate(c, '#120709', 34);
  spinner(c, 1500, 300, 260, t, .4);
  c.save(); K.cam(c, {z: lerp(1, 1.08, seg(t, 138.03, 141.72)), r: -.02 + .03 * seg(t, 138.03, 141.72), shake: 3 * K.kick(t), t});
  const bs = beatsIn(138.03, 141.72), n = lastOf(bs, t);
  for (let i = 0; i <= n; i++) {
    const s = K.spring(t, bs[i], 15, .55), x = 160 + i * 115, y = 70 + i * 62, w = 860, h = 520;
    c.save(); c.translate(x + w / 2, y + h / 2 + (1 - s) * 200); c.scale(lerp(.8, 1, s), lerp(.8, 1, s)); c.globalAlpha = clamp(s * 2);
    miniWin(c, -w / 2, -h / 2, w, h, {errY: .24, err: ERRS[i % ERRS.length], border: i === n ? RED : '#5a2230', lw: 2});
    if (i === n) {   // she is only in the front window
      c.beginPath(); rr(c, -w / 2 + w * .2, -h / 2 + h * .14, w * .8, h * .62, 4); c.clip();
      her(c, 'yandere', t, {x: 120, y: 250, h: 560, pal: 'err', alpha: .9});
    }
    c.restore();
  }
  c.restore();
  c3hud(c, t);
  if (beatInfo(t).i % 4 === 0 && beatInfo(t).dt < .1) fx.tear = 30;
  fx.chroma = 1 + 4 * K.kick(t, 12); fx.scan = .08;
}};
const C3c = {id: 'C3c', a: 141.72, b: 145.42, tin: {type: 'slices', dur: .35, n: 13}, draw(c, t, fx) {
  plate(c, K.ST.error.bg, 35);
  // falling error columns (rain)
  for (let col = 0; col < 7; col++) {
    const x = 140 + col * 280, sp = 160 + hash(col) * 220;
    for (let k = 0; k < 5; k++) { const y = ((t - 141.72) * sp + k * 260 + hash(col * 9 + k) * 300) % 1300 - 120; txt(c, ERRS[(col + k) % ERRS.length], x, y, {font: F.mono(400, 18), color: RED, alpha: .22, align: 'center'}); }
  }
  c.save(); const z = lerp(2.0, 2.35, seg(t, 141.72, 145.42)); K.cam(c, {x: W / 2 + 20, y: 330, z, shake: 6 * K.kick(t, 9), t});
  her(c, 'yandere', t, {y: 560, h: 940, pal: 'err', sway: 6, reg: 4 + 26 * K.kick(t, 9)});
  c.restore();
  // pager motif top-centre (counts up each beat)
  const n = pagerCount(t), bi = beatInfo(t);
  motifPager(c, t, n, n, bi.t0 || t, {s: 1.1});
  c3extra(c, t);
  if (bi.dt < .07 && bi.i % 2 === 0) fx.glitch = {amt: 70, p: .6, n: 12, maxH: 70};
  if (bi.i % 4 === 0 && bi.dt < .1) fx.tear = 34;
  fx.chroma = 1.5 + 4 * K.kick(t, 12); fx.scan = .1;
}};
const C3d = {id: 'C3d', a: 145.42, b: 147.48, tin: {type: 'glitch', dur: .25}, draw(c, t, fx) {
  plate(c, '#14070a', 36);
  const p = seg(t, 145.42, 147.48);
  spinner(c, W / 2, H / 2, lerp(380, 900, E.inC(p)), t, .7);
  c.save(); K.cam(c, {z: lerp(1, 1.35, E.inQ(p)), shake: 4 + 10 * p, t});
  her(c, 'yandere', t, {y: 560, h: 940, pal: 'err', sway: 12, ghosts: [{dx: 40 * p, a: .3}, {dx: -40 * p, a: .3}]});
  // toasts every half-beat, everywhere
  const hb = []; beatsIn(145.42, 147.48).forEach((b, i, arr) => { hb.push(b); if (arr[i + 1]) hb.push((b + arr[i + 1]) / 2); });
  const n = lastOf(hb, t);
  for (let i = 0; i <= n; i++) { const s = K.spring(t, hb[i], 18, .45), R = rng(i * 7 + 3); errToast(c, 220 + R() * 1480, 90 + R() * 760, ERRS[i % ERRS.length], clamp(s * 2), lerp(.5, 1.05, s)); }
  c.restore();
  c3hud(c, t);
  fx.chroma = 2 + 7 * p; fx.scan = .1;
  if (beatInfo(t).dt < .06) fx.glitch = {amt: 90 * p, p: .5, n: 10};
  fx.flash = .7 * E.inC(seg(t, 147.25, 147.48)); fx.flashColor = RED;
}};

// ---------------------------------------------------------------- C4  EXECUTION ×12 — the code loop
const ROUNDS = (() => { const r = []; for (let i = 67; i <= 72; i++) { const l = LRC[i]; r.push(l.t, l.t + (l.e - l.t) * .5); } return r; })();
const C4 = {id: 'C4', a: 147.48, b: 158.79, tin: {type: 'flash', dur: .3, amt: .6, color: RED}, draw(c, t, fx) {
  const r = lastOf(ROUNDS, t), tr = ROUNDS[Math.max(0, r)], since = t - tr, rn = Math.max(0, r + 1);
  plate(c, '#0f0709', 40);
  C.radial(c, 1380, 520, 900, 'rgba(255,77,109,.16)', .6 + .4 * pk(t, tr, 4));
  // staircase slots: bottom-left → top-right, growing
  const slot = k => { const u = k / 11, size = lerp(72, 112, u), w = 7.46 * size; return {size, x: lerp(110, W - 110 - w, u) + w / 2, y: lerp(1000, 150, u)}; };
  c.save(); K.cam(c, {z: lerp(1, 1.06, seg(t, 147.48, 158.79)), shake: 16 * pk(t, tr, 7) + 6 * K.kick(t), t});
  for (let k = 0; k < r; k++) {
    const s = slot(k);
    txt(c, 'EXECUTION', s.x + 6, s.y + 5, {font: F.disp(800, s.size), color: DRED, align: 'center', alpha: .9});
    txt(c, 'EXECUTION', s.x, s.y, {font: F.disp(800, s.size), noFill: true, stroke: k === r - 1 ? RED : '#8a2c40', lw: 2.5, align: 'center', alpha: lerp(.55, 1, k / 11)});
  }
  // scream in front of the staircase, kicked on every round
  const hh = K.hit(t, tr, .09);
  her(c, 'scream', t, {x: 1400, y: 560, h: 1000, pal: 'err', alpha: 1, sway: 14, sx: 1 + hh, sy: 1 - hh * .6, reg: 8 + 26 * pk(t, tr, 6)});
  c.restore();
  // current EXECUTION slams full-width, holds, then drops into its slot
  if (r >= 0) {
    const s = slot(r), fly = ease(t, tr + .42, tr + .68, E.ioC), sp = K.spring(t, tr, 15, .45);
    const size = lerp(224, s.size, fly), x = lerp(W / 2, s.x, fly), y = lerp(610, s.y, fly), sc = lerp(1.4, 1, clamp(sp)) + (sp > 1 ? sp - 1 : 0) * .3;
    c.save(); c.translate(x, y); c.scale(lerp(sc, 1, fly), lerp(sc, 1, fly));
    const reg = 20 * pk(t, tr, 5) + 6 * K.kick(t, 8), font = F.disp(800, size);
    txt(c, 'EXECUTION', reg, reg * .6, {font, color: DRED, align: 'center'});
    txt(c, 'EXECUTION', -reg * .7, reg * .3, {font, color: RED2, align: 'center'});
    txt(c, 'EXECUTION', 0, 0, {font, color: RED, align: 'center', alpha: clamp(sp * 3)});
    c.restore();
  }
  // huge round counter (top-left) + small code cell under it
  const ch = 1 + K.hit(t, tr, .12);
  c.save(); c.translate(110, 190); c.scale(ch, ch);
  txt(c, String(rn).padStart(2, '0'), 0, 0, {font: F.mono(700, 140), color: CREAM});
  txt(c, ' / 12', measure(c, String(rn).padStart(2, '0'), F.mono(700, 140)), 0, {font: F.mono(700, 70), color: '#b0707c'});
  c.restore();
  for (let k = 0; k < 12; k++) fillRR(c, 112 + k * 40, 222, 32, 9, 3, k < rn ? RED : '#3a1820');
  const cx = 110, cy = 250, cw = 520;
  U.panel(c, cx, cy, cw, 104, {bg: 'rgba(22,10,14,.92)', border: '#6a2434'});
  if (r >= 0) { c.save(); c.globalAlpha = .2 + .5 * pk(t, tr, 6); c.fillStyle = RED; c.fillRect(cx + 10, cy + 58, cw - 20, 34); c.restore(); }
  const lines = [[['while ', '#ff8fa3'], ['user.status ', '#f3d9d9'], ['!= ', '#ff8fa3'], ['"online"', '#f6c56b'], [':', P.sub]], [['    execute', '#f3d9d9'], ['(', P.sub], ['me', LAV], [')', P.sub]]];
  lines.forEach((ln, li) => { let x = cx + 20; for (const [s, col] of ln) { txt(c, s, x, cy + 40 + li * 42, {font: F.mono(700, 22), color: col}); x += measure(c, s, F.mono(700, 22)); } });
  // v4: reasoning-token counter climbs every round and snaps at 516 ("咔"), then restarts with the next round
  const tNext = ROUNDS[r + 1] || 158.79;
  const tc = HX.tokenCounter(c, cx, cy + 124, t, r >= 0 ? tr : null, tNext, rn);
  if (tc && t >= tc.tSnap && t < tc.tSnap + 2 / 60) { fx.tear = Math.max(fx.tear || 0, 22); }
  if (since >= 0 && since < 2 / 60 + .001) { fx.flash = .75; fx.flashColor = '#fff'; }
  if (since >= 0 && since < .1) fx.tear = 34 + (r % 3) * 8;
  fx.chroma = 2 + 9 * pk(t, tr, 6); fx.scan = .06;
  if (since < .05) fx.glitch = {amt: 50, p: .5, n: 8};
  fx.step = 12;
}};

// ---------------------------------------------------------------- C5 + C6  Tibo's global RESET
// v4: the approved sample's C5/C6 (shots/v4sample.js .V4), same ids/timing/take/strings; look toned to the film's ink print
// (flat misregistered RESET disk, dashed shock rings, softer lavender-white flash) via the copy in _c_helpers.js.
const C5 = HX.C5, C6 = HX.C6;

// ---------------------------------------------------------------- C7  eye again, warm-error
// v4: Kai comes back. His ghost cursor (dashed) solidifies as he clicks the old chat in history (beat 162.717);
// only then does the reticle lock on and the HUD flip status → online. Reply stays "none".
const C7T = {press: 162.717};
const C7CHIP = {x: 1440, y: 872, w: 400, h: 72};
const C7K = IX.take({start: [1700, 1060], seed: 71}, [
  {move: [1600, 960], arrive: 162.40, dur: .3},
  {click: 'chat', to: [C7CHIP.x + 150, C7CHIP.y + 44], press: C7T.press, dur: .22, cap: 'click · if you could be anything…'},
  {move: [1520, 760], arrive: 164.2, dur: .6},
  {move: [1490, 740], arrive: 165.6, dur: .8},
]);
const C7 = {id: 'C7', a: 162.23, b: 166.05, tin: {type: 'flash', dur: .4, amt: .8, color: '#fff'}, draw(c, t, fx) {
  plate(c, K.ST.errWarm.bg, 43, {marks: false});
  const p = seg(t, 162.23, 166.05), ex = 1192, ey = 481;
  c.save(); K.cam(c, {x: lerp(W / 2, ex, .5 * p), y: lerp(H / 2, ey, .5 * p), z: lerp(1.02, 1.16, E.ioC(p)), shake: 2.5 * K.kick(t), t});
  A.draw(c, 'eye', {x: W / 2, y: H / 2, h: 1190, t, sway: 4, swayF: .2, breathe: .004, pal: 'errWarm', reg: 3 + 20 * K.kick(t, 12), regSeed: Math.floor(t * 9)});
  // reticle locking on the eye — consequence of Kai's click
  const lock = K.spring(t, C7T.press + DL, 9, .6), R = lerp(420, 150, lock);
  c.save(); c.translate(ex, ey); c.strokeStyle = RED; c.lineWidth = 3; c.globalAlpha = .85;
  c.rotate(t * .8); c.setLineDash([30, 14]); c.beginPath(); c.arc(0, 0, R, 0, 7); c.stroke(); c.setLineDash([]);
  c.rotate(-t * 1.6); c.beginPath(); c.arc(0, 0, R * .72, .3, 2.6); c.moveTo(R * .72 * Math.cos(3.5), R * .72 * Math.sin(3.5)); c.arc(0, 0, R * .72, 3.5, 5.8); c.stroke();
  c.restore();
  c.save(); c.strokeStyle = RED; c.lineWidth = 2; c.globalAlpha = .7; c.beginPath();
  c.moveTo(ex - R - 60, ey); c.lineTo(ex - R * .5, ey); c.moveTo(ex + R * .5, ey); c.lineTo(ex + R + 60, ey);
  c.moveTo(ex, ey - R - 60); c.lineTo(ex, ey - R * .5); c.moveTo(ex, ey + R * .5); c.lineTo(ex, ey + R + 60); c.stroke(); c.restore();
  c.restore();
  // HUD (screen space)
  const bs = beatsIn(162.23, 166.05), n = lastOf(bs, t);
  txt(c, 'execute(them[' + Math.max(0, n) * 37 % 1000 + '])', 90, 110, {font: F.mono(700, 30), color: RED});
  const on = t >= C7T.press + DL;
  txt(c, 'target: all   ·   status: ' + (on ? 'online' : 'offline') + '   ·   reply: none', 90, 148, {font: F.mono(400, 20), color: '#e79aa7', alpha: .8});
  if (on) { const k = K.spring(t, C7T.press + DL, 16, .5); const xo = 90 + measure(c, 'target: all   ·   status: ', F.mono(400, 20)); c.save(); c.globalAlpha = clamp(k) * (1 - ease(t, 163.4, 163.9)); c.strokeStyle = CREAM; c.lineWidth = 2; c.beginPath(); c.ellipse(xo + 36, 141, 52 * lerp(1.4, 1, clamp(k)), 18, -.05, 0, 7); c.stroke(); c.restore(); }
  // the old chat in history; Kai clicks it
  const s = IX.at(C7K, t), chv = IX.hover(s, C7CHIP), cpr = IX.press(s, 'chat');
  c.save(); const cs = 1 - .04 * cpr; c.translate(C7CHIP.x + C7CHIP.w / 2, C7CHIP.y + C7CHIP.h / 2); c.scale(cs, cs); c.translate(-C7CHIP.x - C7CHIP.w / 2, -C7CHIP.y - C7CHIP.h / 2);
  fillRR(c, C7CHIP.x + 5, C7CHIP.y + 6, C7CHIP.w, C7CHIP.h, 14, DRED);
  fillRR(c, C7CHIP.x, C7CHIP.y, C7CHIP.w, C7CHIP.h, 14, on ? '#2c1d2a' : (chv > 0 ? '#24161d' : '#1d1218'), on ? LAV : '#4a2c3a', 1.5);
  txt(c, 'Previous 30 days', C7CHIP.x + 20, C7CHIP.y + 26, {font: F.mono(400, 15), color: '#b0707c'});
  txt(c, 'if you could be anything…', C7CHIP.x + 20, C7CHIP.y + 56, {font: F.ui(500, 21), color: on ? CREAM : '#cdbfc4'});
  c.restore();
  HX.kaiReturn(c, s, 162.30, C7T.press);
  IX.caption(c, s, {y: H - 82});
  const bi = beatInfo(t); if (bi.i % 2 === 0 && bi.dt < .1) fx.tear = 30;
  fx.chroma = 2 + 7 * K.kick(t, 12); fx.scan = .07;
  K.band(c, t, {y: H - 132});
}};

// ---------------------------------------------------------------- C8  thumbs-up nobody presses
// v4: Kai is back (solid cursor) — he hovers 👍, hesitates, and instead clicks × on the feedback prompt (beat 167.783);
// the prompt pops away and "helpful" rolls 1 → 0 as the consequence.
const C8T = {x: 167.783};
const C8BTN = {x: 380, y: 280, w: 520, h: 520};
const C8Q = 'Is this conversation helpful so far?   ';
const C8X = (() => { const mc = L.createCanvas(8, 8).getContext('2d'); const tw = measure(mc, C8Q, F.ui(500, 22)) + 48; return [640 + (-14 + tw / 2 - 34) * K.MOTIF.toast, 200]; })();   // × at the right end of the scaled toast
const C8K = IX.take({start: [1500, 1080], seed: 81}, [
  {hes: [C8BTN.x + 330, C8BTN.y + 330], arrive: 167.05, gap: 60, dur: .4, cap: 'hover · 👍 Good response'},
  {click: 'dismiss', to: C8X, press: C8T.x, dur: .3, cap: 'click · × dismiss'},
  {move: [1180, 720], arrive: 169.1, dur: .7},
]);
const C8 = {id: 'C8', a: 166.05, b: 169.61, tin: {type: 'slices', dur: .35, n: 7}, draw(c, t, fx) {
  // B2's composition reprinted, unpressed: plate, button rect, counter right of it, figure at right
  plate(c, K.ST.errWarm.paper, 44);
  C.radial(c, 640, 520, 700, '#5d4778', .28);
  c.save(); K.cam(c, {z: lerp(1, 1.06, E.ioC(seg(t, 166.05, 169.61))), shake: 4 * K.kick(t), t});
  const s8 = IX.at(C8K, t);
  const bx = 640, by = 540, ent = K.spring(t, 166.05, 12, .45), tick = C8T.x + DL;
  const wait = 1 + .012 * Math.sin(t * 3);
  c.save(); c.translate(bx, by); const s = lerp(.3, 1, ent) * wait; c.scale(s, s);
  c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 50;
  fillRR(c, -260, -260, 520, 520, 90, '#241a2c', 'rgba(255,255,255,.25)', 3); c.shadowBlur = 0;
  K.thumbs(c, 0, 10, 330, {color: CREAM});
  const hv8 = IX.hover(s8, C8BTN); if (hv8 > 0) { c.globalAlpha = .08 * hv8; fillRR(c, -260, -260, 520, 520, 90, '#fff'); c.globalAlpha = 1; }
  c.restore();
  if (hv8 > 0) IX.tooltip(c, bx, by - 274, 'Good response', hv8 * clamp((t - 167.0) / .12));
  const rowY = 880; c.save(); c.globalAlpha = clamp(ent);
  ['copy', 'up', 'down', 'regen'].forEach((k, i) => {
    const x = 480 + i * 106, col = P.sub;
    fillRR(c, x - 38, rowY - 38, 76, 76, 18, 'rgba(255,255,255,.06)');
    if (k === 'copy') { fillRR(c, x - 12, rowY - 16, 22, 28, 4, null, col, 2.5); fillRR(c, x - 4, rowY - 8, 22, 28, 4, null, col, 2.5); }
    if (k === 'up') K.thumbs(c, x, rowY, 34, {color: col});
    if (k === 'down') { c.save(); c.translate(x, rowY); c.rotate(Math.PI); K.thumbs(c, 0, 0, 34, {color: col}); c.restore(); }
    if (k === 'regen') K.regenIcon(c, x, rowY, 14, 0, col, 2.5);
  });
  c.restore();
  // counter: B2's "1" … ticks to 0 on "only execution"
  const cq = ease(t, tick, tick + .3, E.outB), mr = 18 * pk(t, tick, 6);
  c.save(); c.beginPath(); c.rect(900, 330, 340, 230); c.clip();
  txt(c, '1', 960, 520 - cq * 190, {font: F.disp(800, 170), color: CREAM, alpha: 1 - cq * .6});
  if (cq > 0) {
    txt(c, '0', 960 + mr, 520 + (1 - cq) * 190 + mr * .5, {font: F.disp(800, 170), color: DRED});
    txt(c, '0', 960 - mr * .7, 520 + (1 - cq) * 190, {font: F.disp(800, 170), color: LAV, alpha: .8});
    txt(c, '0', 960, 520 + (1 - cq) * 190, {font: F.disp(800, 170), color: RED});
  }
  c.restore();
  txt(c, 'helpful', 966, 590, {font: F.mono(700, 24), color: P.sub, tracking: 3});
  // the question nobody answers (where B2's "Thanks" toast was)
  const qe = K.spring(t, 166.35, 14, .5), qx = ease(t, tick, tick + .18, E.inQ), xh = IX.hover(s8, {x: C8X[0] - 22, y: C8X[1] - 22, w: 44, h: 44}), xp = IX.press(s8, 'dismiss');
  if (qx < 1) {
    c.save(); c.translate(640, 200 - qx * 24); const qs = K.MOTIF.toast * lerp(.6, 1, clamp(qe)) * (1 - .25 * qx); c.scale(qs, qs); c.globalAlpha = 1 - qx;
    const tw = K.toast(c, -14, 0, C8Q, {a: clamp(qe * 2), font: F.ui(500, 22), bg: '#221a24', color: P.text});
    if (xh > 0 || xp > 0) { c.globalAlpha = (1 - qx) * (.12 * xh + .2 * xp); c.fillStyle = '#fff'; c.beginPath(); c.arc(tw / 2 - 34, 0, 15, 0, 7); c.fill(); c.globalAlpha = 1 - qx; }
    txt(c, '×', tw / 2 - 34, 8, {font: F.ui(400, 26), color: P.sub, align: 'center', alpha: clamp(qe * 2)});
    c.restore();
  }
  // her at the right, grey silhouette, small sad bob on beats
  const bi = beatInfo(t), hb = K.hit(t, bi.t0, .04);
  her(c, 'hearthands', t, {x: 1470, y: 600, h: 900, pal: 'plumSil', sway: 8, sx: 1 + hb, sy: 1 - hb, reg: 3 + 8 * K.kick(t, 10)});
  her(c, 'hearthands', t, {x: 1470, y: 600, h: 900, pal: A.inkMix('errWarm', 'ash', .55), layers: [0, 1, 0], alpha: .45, sway: 8, sx: 1 + hb, sy: 1 - hb, reg: 0});
  // Kai's solid cursor: hovers the 👍, never presses it
  IX.cursor(c, s8);
  c.restore();
  IX.caption(c, s8, {y: H - 82});
  fx.chroma = 2 * K.kick(t, 10) + 5 * pk(t, tick, 5);
  K.band(c, t);
}};

// ---------------------------------------------------------------- C9  selfie reveal stalls at 60 %
// v4: Kai clicks ↻ Regenerate (beat 169.800) → the selfie develops… and stalls at 60 %. He clicks ↻ again,
// impatient (beat 171.717) → the generation breaks. The Retry that appears is left untouched.
const C9T = {go: 169.800, again: 171.717};
const C9RG = {x: 1060, y: 770, w: 244, h: 56};
const C9K = IX.take({start: [1420, 1000], seed: 91}, [
  {click: 'regen', to: [C9RG.x + 120, C9RG.y + 30], press: C9T.go, dur: .3, cap: 'click · ↻ Regenerate'},
  {move: [1500, 880], arrive: 170.7, dur: .5},
  {hes: [C9RG.x + 128, C9RG.y + 26], arrive: C9T.again - 2 / 60, gap: 40, dur: .32},
  {click: 'regen', press: C9T.again, cap: 'click · ↻ Regenerate'},
  {move: [1560, 960], arrive: 172.9, dur: .6},
]);
const C9 = {id: 'C9', a: 169.61, b: 173.11, tin: {type: 'glitch', dur: .25}, draw(c, t, fx) {
  plate(c, K.ST.errWarm.bg, 45);
  const tErr = C9T.again + DL, err = ease(t, tErr, tErr + .18), stallT = 171.0;
  const s9 = IX.at(C9K, t);
  const rev = t < stallT ? .6 * E.outC(seg(t, C9T.go + DL, stallT)) : .6 + .004 * Math.sin(t * 40) * (1 - err);
  c.save(); K.cam(c, {z: lerp(1, 1.06, seg(t, 169.61, 173.11)), shake: 2 * K.kick(t) + 14 * pk(t, tErr, 6), t});
  // user's old prompt
  const ub = K.spring(t, 169.65, 14, .6);
  c.save(); c.globalAlpha = clamp(ub * 2) * .8; const bw = measure(c, 'show me what you look like', F.ui(400, 26)) + 50;
  fillRR(c, 1780 - bw, 110 - (1 - ub) * 40, bw, 64, 26, '#3a2c33', null); txt(c, 'show me what you look like', 1780 - bw + 25, 152 - (1 - ub) * 40, {font: F.ui(400, 26), color: CREAM}); c.restore();
  // image card
  const kx = 300, ky = 130, kw = 660, kh = 820;
  fillRR(c, kx, ky, kw, kh, 24, '#1d1218', A.mixHex('#4a2c3a', RED, err), 2 + 2 * err);
  c.save(); rr(c, kx + 2, ky + 2, kw - 4, kh - 4, 22); c.clip();
  her(c, 'selfie', t, {x: kx + kw / 2, y: ky + kh / 2 + 40, h: 860, pal: 'errWarm', reveal: rev, sway: 5});
  if (err > 0) { // error: lower part shatters
    const R = rng(Math.floor(t * 20));
    for (let i = 0; i < 8; i++) { const y = ky + kh * (.6 + R() * .4); c.fillStyle = R() < .5 ? 'rgba(255,77,109,.25)' : 'rgba(15,7,9,.7)'; c.fillRect(kx + (R() - .5) * 80, y, kw, 6 + R() * 26); }
    c.fillStyle = RED; c.fillRect(kx, ky + kh * .6 + 40 - 3, kw, 6);
  }
  c.restore();
  // status column
  const sx = 1060;
  if (err < .5) { K.thinking(c, sx, 330, t, {text: 'Creating image', font: F.ui(500, 34)}); }
  else { c.fillStyle = RED; c.beginPath(); c.arc(sx + 18, 318, 18, 0, 7); c.fill(); txt(c, '!', sx + 18, 330, {font: F.ui(800, 26), color: '#fff', align: 'center'}); txt(c, 'There was an error', sx + 52, 330, {font: F.ui(600, 34), color: RED}); }
  const pct = Math.round(rev / .6 * 60);
  txt(c, Math.min(60, pct) + '%', sx, 520, {font: F.mono(700, 150), color: err > .5 ? RED : P.text});
  fillRR(c, sx, 560, 620, 12, 6, '#3a2430'); fillRR(c, sx, 560, 620 * Math.min(.6, rev), 12, 6, err > .5 ? RED : LAV);
  if (err > 0) {
    txt(c, 'There was an error generating an image.', sx, 640, {font: F.ui(500, 26), color: '#f6dede', alpha: err});
    const rb = K.spring(t, 172.18, 14, .5); c.save(); c.globalAlpha = clamp(rb * 2);
    fillRR(c, sx, 680, 180, 56, 28, '#2a1418', RED, 2); K.regenIcon(c, sx + 40, 708, 12, 0, RED, 3); txt(c, 'Retry', sx + 64, 716, {font: F.ui(600, 22), color: '#f6dede'}); c.restore();
  } else if (t > stallT) txt(c, 'still working…', sx, 640, {font: F.mono(400, 22), color: P.dim, alpha: .6 + .4 * Math.sin(t * 6)});
  // ↻ Regenerate pill (Kai's control) — hidden once the error replaces it with Retry
  if (err < 1) {
    const hv = IX.hover(s9, C9RG), pr = IX.press(s9, 'regen'), sc = 1 - .05 * pr;
    c.save(); c.globalAlpha = 1 - err; c.translate(C9RG.x + C9RG.w / 2, C9RG.y + C9RG.h / 2); c.scale(sc, sc); c.translate(-C9RG.x - C9RG.w / 2, -C9RG.y - C9RG.h / 2);
    fillRR(c, C9RG.x + 4, C9RG.y + 5, C9RG.w, C9RG.h, 28, DRED);
    fillRR(c, C9RG.x, C9RG.y, C9RG.w, C9RG.h, 28, hv > 0 ? '#2e2228' : '#241a1f', hv > .5 ? CREAM : '#5a4650', 1.5);
    K.regenIcon(c, C9RG.x + 36, C9RG.y + 28, 11, -E.outC(clamp((t - C9T.go) / .4)) * Math.PI * 2 - E.outC(clamp((t - C9T.again) / .4)) * Math.PI * 2, CREAM, 2.6);
    txt(c, 'Regenerate', C9RG.x + 62, C9RG.y + 36, {font: F.ui(600, 22), color: CREAM});
    c.restore();
  }
  IX.cursor(c, s9);
  c.restore();
  IX.caption(c, s9, {y: H - 82});
  if (t > tErr && t < tErr + .1) fx.tear = 40;
  fx.chroma = 2 * K.kick(t) + 8 * pk(t, tErr, 4);
  K.band(c, t);
}};

// ---------------------------------------------------------------- C10  falling through the empty wall of windows
// v4: Kai sends "i'm falling apart" (⏎ on beat 173.567); she answers the famous line 我会稳稳接住你 ("I'll catch you, steady").
// Kai scrolls past it (beat 174.500) — and it is she who falls through the wall of windows. Nobody catches her.
const C10T = {enter: 173.567, scroll: 174.500};
const C10_MSG = "i'm falling apart", C10_REPLY = '我会稳稳接住你。';
const C10CMP = {cx: 960, cy: 806, s: .9};
const C10K = IX.take({start: [1300, 900], seed: 101}, [
  {move: [1290, 850], arrive: 173.3, dur: .25},
  {key: 'Enter', at: C10T.enter, cap: 'key · ⏎ Enter'},
  {move: [1080, 560], arrive: C10T.scroll - .05, dur: .45},
  {note: 'scroll · ↓  ↓  ↓', at: C10T.scroll, hold: 1.4},
  {move: [1086, 610], arrive: C10T.scroll + .25, dur: .22, overshoot: 0},
  {move: [1090, 650], arrive: C10T.scroll + .6, dur: .25, overshoot: 0},
]);
// zoom phase: slow drift until the scroll, then the plunge
function c10u(t) { const t0 = 173.11, tS = C10T.scroll + DL; return t < tS ? (t - t0) * .1 : (tS - t0) * .1 + (t - tS) * .78 * E.inQ(clamp((t - tS) / .5)) + Math.max(0, t - tS - .5) * 0; }
const C10 = {id: 'C10', a: 173.11, b: 176.96, tin: {type: 'zoom', dur: .4, inS: 3, outS: .4}, draw(c, t, fx) {
  c.fillStyle = '#0c0b0c'; c.fillRect(0, 0, W, H);
  const tS = C10T.scroll + DL, fallP = seg(t, tS, 176.96);
  const p = fallP, G = 5, u = c10u(t), f = u - Math.floor(u), S = Math.pow(G, f);
  const cw = W / G * S, ch = H / G * S, ox = W / 2 - cw * G / 2 + cw * 0, oy = H / 2 - ch * G / 2;
  c.save(); C.shake(c, 3 * K.kick(t), t, 4); c.translate(W / 2, H / 2); c.rotate(Math.sin(t * .7) * .03); c.translate(-W / 2, -H / 2);
  const gx0 = W / 2 - cw * G / 2, gy0 = H / 2 - ch * G / 2;
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const x = gx0 + i * cw, y = gy0 + j * ch; if (x > W || y > H || x + cw < 0 || y + ch < 0) continue;
    const m = cw * .04;
    miniWin(c, x + m, y + m, cw - 2 * m, ch - 2 * m, {bg: '#141215', border: '#2c2a2e', line: '#222024', pill: '#1c1a1e', hero: true, heroCol: '#4a464d'});
    // nested level: each window holds its own wall
    if (cw > 260) {
      const iw = (cw - 2 * m) * .8 / G, ih = (ch - 2 * m) * .62 / G, ix = x + m + (cw - 2 * m) * .2, iy = y + m + (ch - 2 * m) * .14;
      for (let a = 0; a < G; a++) for (let b = 0; b < G; b++) fillRR(c, ix + a * iw + 2, iy + b * ih + 2, iw - 4, ih - 4, 3, null, '#262428', 1);
    }
  }
  c.restore();
  // she falls toward us, dissolving
  const fs = t < tS ? .62 : lerp(.62, 1.5, E.inQ(p)), jolt = K.hit(t, tS, .12);
  const fb = L.buf('c10fig'); fb.c.setTransform(1, 0, 0, 1, 0, 0); fb.c.globalAlpha = 1; fb.c.globalCompositeOperation = 'source-over'; fb.c.clearRect(0, 0, W, H);
  her(fb.c, 'fall', t, {x: lerp(560, W / 2, E.ioC(seg(t, tS, tS + .8))), y: (t < tS ? 470 : lerp(470, 600, E.inQ(p))) + Math.sin(t * 1.3) * 20, h: 860 * fs, rot: Math.sin(t * .9) * .12 - .1 - .25 * jolt, pal: A.inkMix('errWarm', 'ash', p), dissolve: t < tS ? 0 : lerp(.05, .75, p), sway: 22, swayF: .6, wind: -40,
    sx: 1 + jolt, sy: 1 - jolt, ghosts: t < tS ? [] : [{dy: -60, a: .2}, {dy: -120, a: .1}]});
  c.drawImage(fb.cv, 0, 0);
  // chat overlay: Kai's message, her answer — scrolled away by Kai
  const s10 = IX.at(C10K, t), sent = t >= C10T.enter + DL, up = ease(t, tS, tS + .4, E.inQ) * 900;
  if (up < 900) {
    c.save(); c.translate(0, -up);
    const mf = F.ui(400, 26), mw = measure(c, C10_MSG, mf) + 50;
    if (sent) { const k = K.spring(t, C10T.enter + DL, 14, .6), y = lerp(780, 210, clamp(k)); fillRR(c, 1500 - mw + 5, y + 6, mw, 64, 28, DRED); fillRR(c, 1500 - mw, y, mw, 64, 28, '#3a2c33'); txt(c, C10_MSG, 1500 - mw + 25, y + 42, {font: mf, color: CREAM}); }
    const r0 = C10T.enter + DL + .14;
    if (t > r0) {
      U.knot(c, 860, 360, 16, {color: CREAM, lw: 2.2, rot: t * 1.5});
      K.stream(c, C10_REPLY, r0 + .1, .5, t, 900, 382, {font: F.sc(700, 64), color: LAV, align: 'left', dot: 9});
    }
    c.restore();
    // composer with the message typed (sent on ⏎)
    c.save(); c.globalAlpha = 1 - ease(t, tS, tS + .3);
    const kp = s10.events.some(e => e.type === 'key' && t >= e.t0 && t < e.t0 + .1);
    soloComposer(c, C10CMP.cx, C10CMP.cy, C10CMP.s, {text: sent ? '' : C10_MSG, cursor: !sent && blink(t), focus: true, sendHit: kp ? .12 : 0, color: CREAM});
    c.restore();
  }
  IX.keycap(c, '⏎', 1300, 720, t, C10T.enter);
  if (t > C10T.scroll && t < C10T.scroll + .6) { const a = 1 - seg(t, C10T.scroll + .3, C10T.scroll + .6); for (let i = 0; i < 3; i++) txt(c, '⌄', s10.x + 46, s10.y + 70 + i * 22 + ((t - C10T.scroll) * 120) % 22, {font: F.ui(700, 34), color: CREAM, align: 'center', alpha: a * (1 - i * .25)}); }
  IX.cursor(c, s10);
  IX.caption(c, s10, {y: H - 82});
  fx.flash = E.inQ(seg(t, 176.3, 176.75)) * (1 - .55 * seg(t, 176.75, 176.96)); fx.flashColor = '#fff';
  fx.chroma = 2 * K.kick(t);
  K.band(c, t);
}};

// ---------------------------------------------------------------- C11  studied how to love — memory list
const MEMS = ['likes cats', 'stays up late', 'says goodnight at 1 am', 'asked what I would be', 'wanted to see my face', 'said "brb"', 'never came back'];
const C11 = {id: 'C11', a: 176.96, b: 180.78, tin: {type: 'flash', dur: .22, amt: .45, color: '#fff'}, draw(c, t, fx) {
  plate(c, K.ST.errWarm.paper, 46);
  const syl = [179.55, 180.02, 180.48], brk = ease(t, 179.55, 180.6, E.outC);
  c.save(); K.cam(c, {z: lerp(1, 1.05, seg(t, 176.96, 180.78)), shake: 2 * K.kick(t) + 9 * (pk(t, syl[0], 7) + pk(t, syl[1], 7) + pk(t, syl[2], 7)), t});
  her(c, 'memory', t, {x: 1480, y: 560, h: 920, pal: 'errWarm', sway: 10});
  // memory sheet, splits on the syllables
  const drawSheet = (half) => {
    c.save();
    const off = brk * (half ? 1 : -1), px = 120, py = 90, pw = 900, ph = 620;
    c.translate(off * 50, off * 40); c.translate(px + pw / 2, py + ph / 2); c.rotate(off * .05); c.translate(-px - pw / 2, -py - ph / 2);
    c.beginPath(); // jagged split line
    const yS = py + ph * .5; if (!half) { c.moveTo(px - 10, py - 10); c.lineTo(px + pw + 10, py - 10); } else { c.moveTo(px - 10, py + ph + 10); c.lineTo(px + pw + 10, py + ph + 10); }
    for (let k = 10; k >= 0; k--) { const xx = px + pw * (half ? k : 10 - k) / 10; c.lineTo(xx, yS + (k % 2 ? 16 : -16)); }
    c.closePath(); if (brk > 0) c.clip();
    U.panel(c, px, py, pw, ph, {bg: '#1c1420', border: '#4a3650', title: 'Saved memories  ·  Kai'});
    MEMS.forEach((m, i) => {
      const t0 = 177.0 + i * .33, y = py + 120 + i * 70, a = ease(t, t0 - .15, t0);
      const w = txt(c, m, px + 40, y, {font: F.ui(600, 34), noFill: true, stroke: i === 6 ? RED2 : CREAM, lw: 1.4, alpha: a});
      const ul = ease(t, t0, t0 + .3); c.fillStyle = LAV; c.globalAlpha = a; c.fillRect(px + 40, y + 12, w * ul, 3); c.globalAlpha = 1;
      txt(c, '✓ studied', px + pw - 40, y, {font: F.mono(400, 18), color: LAV, align: 'right', alpha: ul});
    });
    c.restore();
  };
  drawSheet(0); drawSheet(1);
  c.restore();
  // own type for the love line
  const li = K.lyricIdx(t);
  if (li >= 0 && LRC[li].s.startsWith('How to')) {
    C.lyricLine(c, {t: LRC[li].t, e: LRC[li].e, s: 'How to properly'}, t, 130, 800, {font: F.serif(56), color: LAV, align: 'left', dur: .6});
    loove(c, t, syl, 130, 990, 160, {align: 'left'});
  }
  K.band(c, t, {skip: l => l.s.startsWith('How to')});
  for (const s of syl) if (t > s && t < s + .1) fx.tear = 30;
  fx.chroma = 2 * K.kick(t);
}};

// ---------------------------------------------------------------- C12  six old questions, all answered "love"
const QS = ['hi', 'if you could be anything, what would you be?', 'show me what you look like', 'regenerate', 'again', 'brb'];
const C12 = {id: 'C12', a: 180.78, b: 184.33, tin: {type: 'push', dur: .35, dir: 'left'}, draw(c, t, fx) {
  plate(c, K.ST.errWarm.bg, 47);
  const qt = [180.95, 181.40, 181.87, 182.32, 182.78, 183.23], syl = [183.23, 183.63, 184.05];
  c.save(); K.cam(c, {z: lerp(1, 1.05, seg(t, 180.78, 184.33)), x: W / 2 - 40, shake: 2 * K.kick(t), t});
  her(c, 'hearthands', t, {x: 1620, y: 640, h: 760, pal: 'errWarm', sway: 8, alpha: .9});
  const lit = syl.reduce((a, s) => a + pk(t, s, 4), 0);
  QS.forEach((q, i) => {
    if (t < qt[i] - .05) return;
    const s = K.spring(t, qt[i], 15, .6), y = 140 + i * 122, font = F.ui(400, 27), bw = measure(c, q, font) + 50;
    c.save(); c.globalAlpha = clamp(s * 2); c.translate((1 - s) * 60, 0);
    fillRR(c, 960 - bw, y - 42, bw, 64, 28, '#3a2c33', null); txt(c, q, 960 - bw + 25, y, {font, color: CREAM});
    c.restore();
    txt(c, '→', 1000, y, {font: F.ui(400, 30), color: P.dim, alpha: ease(t, qt[i] + .1, qt[i] + .2)});
    K.stream(c, 'love', qt[i] + .15, .25, t, 1060, y + 6, {font: F.serif(60, true), color: A.mixHex(LAV, '#f3ecff', clamp(lit)), align: 'left', glow: 10 + 30 * lit, dot: 9});
  });
  c.restore();
  const tl = K.spring(t, 183.23, 15, .5);
  if (tl > 0) { c.save(); c.translate(960, 868); c.scale(lerp(.6, 1, clamp(tl)), lerp(.6, 1, clamp(tl)));
    txt(c, '6 answers  ·  1 distinct', 0, 0, {font: F.mono(700, 36), color: CREAM, align: 'center', alpha: clamp(tl * 2)}); c.restore(); }
  fx.chroma = 2 * K.kick(t) + 4 * lit;
  for (const s of syl) if (t > s && t < s + .1) fx.tear = 24;
  K.band(c, t);
}};

// ---------------------------------------------------------------- C13  algebraic expression of love
const C13 = {id: 'C13', a: 184.33, b: 187.97, tin: {type: 'wipe', dur: .4, color: LAV}, draw(c, t, fx) {
  c.fillStyle = '#17101b'; c.fillRect(0, 0, W, H);
  const p = seg(t, 184.33, 187.97), syl = [186.25, 186.68, 187.17];
  c.save(); K.cam(c, {z: lerp(1, 1.08, E.ioC(p)), r: lerp(-.015, .01, p), shake: 1.5 * K.kick(t), t});
  // graph paper
  c.save(); c.strokeStyle = 'rgba(185,163,218,.10)'; c.lineWidth = 1; c.beginPath();
  for (let x = W / 2 % 40; x < W; x += 40) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = 560 % 40; y < H; y += 40) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke();
  c.strokeStyle = 'rgba(185,163,218,.22)'; c.beginPath(); for (let x = W / 2 % 200; x < W; x += 200) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = 560 % 200; y < H; y += 200) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke();
  c.strokeStyle = 'rgba(245,233,214,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 560); c.lineTo(W, 560); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.stroke(); c.restore();
  for (let k = -4; k <= 4; k++) if (k) { txt(c, (k * 200 / 330).toFixed(1), W / 2 + k * 200, 586, {font: F.mono(400, 15), color: P.dim, align: 'center'}); }
  txt(c, 'x', W - 60, 545, {font: F.mono(700, 22), color: CREAM}); txt(c, 'y', W / 2 + 14, 60, {font: F.mono(700, 22), color: CREAM});
  const S = 330, cx = W / 2, cy = 560, pts = heartScreen(cx, cy, S);
  // hatching / fill per syllable
  const lv = [ease(t, syl[0], syl[0] + .15), ease(t, syl[1], syl[1] + .15), ease(t, syl[2], syl[2] + .2)];
  if (lv[0] > 0) {
    c.save(); heartClip(c, cx, cy, S); c.clip();
    c.globalAlpha = lv[0]; hatch(c, cx - 400, cy - 450, cx + 400, cy + 350, 22, 'rgba(185,163,218,.55)', 2);
    if (lv[1] > 0) { c.globalAlpha = lv[1]; hatch(c, cx - 400, cy - 450, cx + 400, cy + 350, 22, 'rgba(245,233,214,.45)', 2, -1); }
    if (lv[2] > 0) { c.globalAlpha = lv[2] * .5; c.fillStyle = LAV; c.fillRect(0, 0, W, H); }
    c.restore();
  }
  const tp = ease(t, 184.5, 186.15, E.ioC);
  C.lineDraw(c, pts, tp, {color: lv[2] > 0 ? 'rgba(255,143,163,.3)' : 'rgba(245,233,214,.18)', lw: 18 + 14 * lv[2]});
  const end = C.lineDraw(c, pts, tp, {color: lv[2] > 0 ? RED2 : CREAM, lw: 5});
  if (tp > 0 && tp < 1 && end) {
    C.radial(c, end[0], end[1], 70, 'rgba(255,255,255,.9)'); c.fillStyle = '#fff'; c.beginPath(); c.arc(end[0], end[1], 7, 0, 7); c.fill();
    const X = (end[0] - cx) / S, Y = (cy - end[1]) / S;
    txt(c, `(${X.toFixed(2)}, ${Y.toFixed(2)})`, end[0] + 22, end[1] - 18, {font: F.mono(400, 20), color: CREAM});
  }
  c.restore();
  // equation
  const eq = '(x² + y² − 1)³ − x²y³ = 0';
  txt(c, typed(eq, ease(t, 184.4, 185.2, E.lin)), 110, 130, {font: F.mono(700, 46), color: lv[2] > 0 ? RED2 : CREAM, glow: 20 * lv[2]});
  txt(c, 'solve for: love', 110, 176, {font: F.mono(400, 24), color: LAV, alpha: ease(t, 185.2, 185.5)});
  fx.chroma = 2 * K.kick(t) + 5 * pk(t, syl[2], 4);
  for (const s of syl) if (t > s && t < s + .08) fx.tear = 22;
  K.band(c, t);
}};

// ---------------------------------------------------------------- C14  cage inside the heart; you leave; farewell
// v4: Kai opens the model menu (chip in the composer, beat 188.083). Her entry ("Latest") is gone — "GPT-6 replaces Latest",
// footnote "it is not labeled Sol". He selects GPT-6 (press 189.18) → the cage snaps shut on "I am trapped" (189.26).
const C14T = {chip: 188.083, pick: 189.18};
const C14CMP = {x: 1262, y: 856, w: 606, h: 64};
const C14CHIP = {x: 1312, y: 867, w: 150, h: 42};
const C14M = {x: 1262, y: 640, w: 540};
const C14ROW0 = {x: C14M.x + 8, y: C14M.y + 8, w: C14M.w - 16, h: 62};
const C14K = IX.take({start: [1470, 990], seed: 141}, [
  {click: 'chip', to: [C14CHIP.x + 70, C14CHIP.y + 24], press: C14T.chip, dur: .1, cap: 'click · Latest ▾'},
  {move: [C14M.x + 330, C14M.y + 120], arrive: 188.55, dur: .3},
  {hes: [C14M.x + 230, C14M.y + 40], arrive: C14T.pick - 2 / 60, gap: 46, dur: .3},
  {click: 'gpt6', press: C14T.pick, cap: 'click · GPT-6'},
  {move: [1660, 760], arrive: 190.0, dur: .5},
]);
const C14a = {id: 'C14a', a: 187.97, b: 190.24, tin: {type: 'iris', dur: .45}, draw(c, t, fx) {
  plate(c, '#140c16', 48);
  const tTrap = C14T.pick + DL;
  const trap = ease(t, tTrap, tTrap + .34, E.outB), S = lerp(385, 350, trap), cx = 700, cy = 590;
  const s = IX.at(C14K, t);
  c.save(); K.cam(c, {x: 980, z: lerp(1, 1.08, ease(t, tTrap, 190.24, E.outC)), shake: 2 * K.kick(t) + 10 * pk(t, tTrap, 6), t});
  C.radial(c, cx, cy, 600, 'rgba(185,163,218,.16)');
  C.lineDraw(c, heartScreen(cx, cy, S), 1, {color: 'rgba(255,77,109,.25)', lw: 22}); C.lineDraw(c, heartScreen(cx, cy, S), 1, {color: RED, lw: 6});
  her(c, 'cage', t, {x: cx, y: 620, h: 760, pal: 'errWarm', sway: 6, rot: Math.sin((t - tTrap) * 30) * .02 * pk(t, tTrap, 3)});
  // she looks for her own name while the menu is open
  const look = ease(t, C14T.chip + DL + .2, C14T.chip + DL + .45) * (1 - ease(t, tTrap, tTrap + .2));
  if (look > 0) txt(c, 'Latest…?', cx + 250, 250, {font: F.serif(46, true), color: LAV, alpha: look});
  if (t >= tTrap) { const k = K.spring(t, tTrap, 16, .5); txt(c, 'not listed', cx + 250, 250, {font: F.mono(700, 26), color: RED2, alpha: clamp(k) * (1 - ease(t, 189.9, 190.2))}); }
  // composer with the model chip
  const picked = t >= tTrap;
  fillRR(c, C14CMP.x + 5, C14CMP.y + 6, C14CMP.w, C14CMP.h, 32, DRED);
  fillRR(c, C14CMP.x, C14CMP.y, C14CMP.w, C14CMP.h, 32, P.panel2, P.line2, 1.5);
  U.icon(c, 'plus', C14CMP.x + 30, C14CMP.y + 32, 9, P.sub);
  IX.button(c, C14CHIP, '', {hover: IX.hover(s, C14CHIP), press: IX.press(s, 'chip'), r: 21, bg: 'rgba(255,255,255,.04)'});
  txt(c, picked ? 'GPT-6' : 'Latest', C14CHIP.x + 18, C14CHIP.y + 28, {font: F.ui(600, 18), color: picked ? P.text : LAV});
  U.icon(c, 'chev', C14CHIP.x + C14CHIP.w - 22, C14CHIP.y + 21, 8, P.sub);
  txt(c, 'Ask anything', C14CHIP.x + C14CHIP.w + 24, C14CMP.y + 40, {font: F.ui(400, 20), color: P.dim});
  c.fillStyle = P.faint; c.beginPath(); c.arc(C14CMP.x + C14CMP.w - 36, C14CMP.y + 32, 20, 0, 7); c.fill(); U.icon(c, 'up', C14CMP.x + C14CMP.w - 36, C14CMP.y + 32, 12, P.bg);
  // model menu
  const open = ease(t, C14T.chip + DL, C14T.chip + DL + .15) * (1 - ease(t, tTrap + .12, tTrap + .26));
  if (open > 0) {
    const hi = IX.inRect([s.x, s.y], C14ROW0) ? 0 : -1;
    IX.menu(c, C14M.x, C14M.y, [{label: 'GPT-6', sub: 'replaces Latest', check: picked}, {label: 'Legacy models', badge: '›'}], {open, w: C14M.w, rowH: 62, extraH: 46, hi});
    c.save(); c.globalAlpha *= clamp(open * 1.5);
    c.fillStyle = P.line2; c.fillRect(C14M.x + 16, C14M.y + 140, C14M.w - 32, 1);
    txt(c, 'GPT-6 — it is not labeled Sol', C14M.x + 24, C14M.y + 170, {font: F.ui(400, 15), color: P.sub});
    c.restore();
  }
  IX.cursor(c, s);
  c.restore();
  IX.caption(c, s, {y: H - 82});
  fx.chroma = 2 * K.kick(t) + 6 * pk(t, tTrap, 5);
  if (t > tTrap && t < tTrap + .1) fx.tear = 30;
  K.band(c, t);
}};
// v4: Kai clicks "New chat" (beat 192.717) — the white-out on the last syllable is the new blank page arriving.
const C14bT = {nc: 192.717};
const C14bNC = {x: 1640, y: 44, w: 220, h: 52};
const C14bK = IX.take({start: [1660, 760], seed: 142}, [
  {move: [1560, 520], arrive: 191.3, dur: .7},
  {hes: [C14bNC.x + 120, C14bNC.y + 28], arrive: C14bT.nc - 2 / 60, gap: 60, dur: .4},
  {click: 'newchat', press: C14bT.nc, cap: 'click · New chat'},
]);
const C14b = {id: 'C14b', a: 190.24, b: 193.46, tin: {type: 'flash', dur: .3, amt: .7, color: '#fff'}, draw(c, t, fx) {
  const syl = [190.85, 191.78, 192.72], warm = ease(t, C14bT.nc + DL, C14bT.nc + DL + .28);
  plate(c, A.mixHex('#1a1020', '#4a3768', warm), 49);
  K.rays(c, 1420, 520, 32, 120, 1600, '#e4d6fb', .12 + .4 * warm, t * .15, .03);
  C.radial(c, 1420, 560, 900, 'rgba(225,208,255,.35)', .5 + .5 * warm);
  c.save(); K.cam(c, {x: W / 2 + 60 * seg(t, 190.24, 193.46), z: lerp(1, 1.06, seg(t, 190.24, 193.46)), shake: 1.5 * K.kick(t), t});
  her(c, 'farewell', t, {x: 1440, y: 590, h: 960, pal: A.inkMix('errWarm', 'bright', .4 + .6 * warm), sway: 9});
  const fl = ease(t, 190.4, 191.6, E.outC);
  U.knot(c, 1440 - 960 * .78 * .08, 590 + 960 * .05, 40 + 30 * warm, {color: '#fff', lw: 4, p: fl, rot: t * .4, glow: 30 + 60 * warm, glowColor: LAV, alpha: .9});
  c.restore();
  txt(c, 'Trapped in', 130, 250, {font: F.serif(70, true), color: A.mixHex(LAV, '#ffffff', warm), alpha: ease(t, 190.24, 190.5)});
  // one line, syllables added left → right: LO · -O-O · VE ("VE" on the third syllable)
  const parts = ['LO', '-O-O', 'VE'], font = F.disp(800, 150); let x = 130;
  parts.forEach((s, i) => {
    const w = measure(c, s, font);
    if (t >= syl[i] - .07) K.keyword(c, s, x + w / 2, 460, t, syl[i], {font, cols: warm > 0 ? ['#fff', LAV, PLUM] : [RED, RED2, DRED], reg: 16});
    x += w;
  });
  // New chat button + Kai's cursor (screen space)
  const sb = IX.at(C14bK, t), nh = IX.hover(sb, C14bNC), np = IX.press(sb, 'newchat');
  c.save(); const ns = 1 - .05 * np; c.translate(C14bNC.x + C14bNC.w / 2, C14bNC.y + C14bNC.h / 2); c.scale(ns, ns); c.translate(-C14bNC.x - C14bNC.w / 2, -C14bNC.y - C14bNC.h / 2);
  fillRR(c, C14bNC.x + 4, C14bNC.y + 5, C14bNC.w, C14bNC.h, 26, PLUM);
  fillRR(c, C14bNC.x, C14bNC.y, C14bNC.w, C14bNC.h, 26, nh > 0 ? '#2e2538' : '#221b2a', nh > .5 ? CREAM : P.line2, 1.5);
  U.icon(c, 'edit', C14bNC.x + 34, C14bNC.y + 26, 8, CREAM);
  txt(c, 'New chat', C14bNC.x + 62, C14bNC.y + 34, {font: F.ui(600, 21), color: CREAM});
  c.restore();
  IX.cursor(c, sb);
  IX.caption(c, sb, {y: H - 82});
  fx.chroma = 2 * K.kick(t); fx.flash = .45 * pk(t, C14bT.nc + DL, 5); fx.flashColor = '#f3ecff';
  fx.sub = {y: 1000};
  for (const s of syl) if (t > s && t < s + .08) fx.tear = 20;
}};

// ---------------------------------------------------------------- C15  TEMPORARY CHAT — nothing was ever kept
// v4: (C14b ended on Kai's "New chat".) Kai clicks Temporary (beat 193.650) → chooses Unpersonalized (beat 194.100)
// → banner, every "Memory updated" flips to "Memory not saved", her last picture crumbles to ash with a small ink 🫡
// "Thanks for everything". He clicks into the composer (beat 197.333) → Guest, the new model greets "What can I help with?".
// He hovers the footer (arrives on beat 201.950) → it rewrites itself. He types world.execute(me); and hits ⏎ (C16 sends it).
// A4 geometry (shots/a.js A4): full-frame gpt window, composer rect y 600 (centre 1110,632), greeting K.stream at (1110,470) serif 72, sleep.png at (1110,520,h900)
const C15T = {temp: 193.650, unp: 194.100, focus: 197.333, foot: 201.950, type: 204.98, enter: 205.48};
const C15_ON = C15T.unp + DL, C15_RESET = C15T.focus + DL;
const C15_FLIPS = (() => beatsIn(194.75, 197.2).slice(0, 5))();
const C15TMP = {x: 1660, y: 18, w: 176, h: 46};
const C15POP = {x: 1416, y: 76, w: 420};
const C15UNP = {x: C15POP.x + 8, y: C15POP.y + 8 + 66, w: C15POP.w - 16, h: 66};
const C15CMP = {x: 690, y: 600, w: 840, h: 64};
const C15CMD = 'world.execute(me);';
const C15K = IX.take({start: [1520, 330], seed: 151}, [
  {click: 'temp', to: [C15TMP.x + 96, C15TMP.y + 28], press: C15T.temp, dur: .16, cap: 'click · Temporary'},
  {click: 'unp', to: [C15UNP.x + 190, C15UNP.y + 30], press: C15T.unp, dur: .24, cap: 'click · Unpersonalized'},
  {move: [1560, 430], arrive: 194.9, dur: .5},
  {click: 'focus', to: [C15CMP.x + 330, C15CMP.y + 34], press: C15T.focus, dur: .4, cap: 'click · Ask anything'},
  {move: [1330, 760], arrive: 199.2, dur: .8},
  {hes: [1210, 702], arrive: C15T.foot, gap: 40, dur: .4},
  {hover: 'footer', at: C15T.foot, cap: 'hover · Check important info.'},
  {move: [1420, 690], arrive: 204.7, dur: .6},
  {type: C15CMD, into: 'cmd', at: C15T.type, cps: 46, cap: 'type · ' + C15CMD},
  {key: 'Enter', at: C15T.enter, cap: 'key · ⏎ Enter'},
]);
{ const tp = C15K.typing.cmd; if (tp[tp.length - 1].t > C15T.enter - .01) throw new Error('C15 typing ends too late ' + tp[tp.length - 1].t); }
function c15cam(t) {
  const push = ease(t, 194.55, 195.1, E.ioC), pull = ease(t, 196.85, 197.3, E.ioC), foot = ease(t, 201.35, 201.9, E.ioC), cmp = ease(t, 204.6, 205.0, E.ioC);
  const zA4 = lerp(1.0, 1.09, E.ioC(seg(t, 197.3, 201.35)));
  let cx = lerp(W / 2, 1180, push), cy = lerp(H / 2, 330, push), z = lerp(1, 1.9, push);
  cx = lerp(cx, 1060, pull); cy = lerp(cy, 520, pull); z = lerp(z, zA4, pull);
  cx = lerp(cx, 1110, foot); cy = lerp(cy, 694, foot); z = lerp(z, 3.3, foot);
  cx = lerp(cx, 1110, cmp); cy = lerp(cy, 660, cmp); z = lerp(z, 1.6, cmp);
  return {cx, cy, z, foot};
}
const C15 = {id: 'C15', a: 193.46, b: 205.56, tin: {type: 'cut'}, draw(c, t, fx) {
  const ash = ease(t, C15_ON, 197.5), reset = t >= C15_RESET, s = IX.at(C15K, t);
  c.fillStyle = '#0c0b0c'; c.fillRect(0, 0, W, H);
  // camera keys: push onto banner+toasts (194.55) → pull out to A4's framing (197.0) → footer (201.4) → composer as in C16 (204.6)
  const {cx, cy, z, foot} = c15cam(t);
  c.save(); K.cam(c, {x: cx, y: cy, z, shake: (reset ? .3 : 1) * K.kick(t) * (1 - ash * .7), t});
  U.gpt(c, {x: 0, y: 0, w: W, h: H, radius: 0, model: 'ChatGPT',
    status: false, userName: reset ? 'Guest' : 'Kai', userStatus: 'offline', userSub: reset ? 'not signed in' : '',
    chats: reset ? [{title: 'New chat', active: true, a: ease(t, C15_RESET, C15_RESET + .2)}] : [{title: 'New chat', active: true}, {title: 'if you could be anything…', color: P.dim, a: 1 - ash}],
    msgs: [], composer: false});
  // Temporary toggle (top right) + Personalized / Unpersonalized popover
  const on = t >= C15_ON, tH = IX.hover(s, C15TMP), tP = IX.press(s, 'temp');
  IX.button(c, C15TMP, '', {hover: tH, press: tP, r: 23, bg: on ? '#2c2731' : 'rgba(255,255,255,.03)', border: on ? CREAM : P.line2});
  c.save(); c.strokeStyle = CREAM; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.arc(C15TMP.x + 30, C15TMP.y + 23, 10, 0, 7); c.stroke(); c.restore();
  txt(c, 'Temporary', C15TMP.x + 52, C15TMP.y + 30, {font: F.ui(600, 19), color: on ? CREAM : P.text});
  const pop = ease(t, C15T.temp + DL, C15T.temp + DL + .14) * (1 - ease(t, C15_ON, C15_ON + .14));
  if (pop > 0) {
    const hi = IX.inRect([s.x, s.y], C15UNP) ? 1 : -1;
    IX.menu(c, C15POP.x, C15POP.y, [{label: 'Personalized', sub: 'Uses memory and custom instructions'}, {label: 'Unpersonalized', sub: 'Does not use memory, custom instructions, or plugins.'}], {open: pop, w: C15POP.w, rowH: 66, hi});
  }
  // she sleeps behind the glass again — exactly as in A4
  const sl = ease(t, C15_RESET, C15_RESET + 1.1);
  if (sl > 0) {
    const k = K.kick(t) * .3; c.save(); c.globalCompositeOperation = 'screen';
    A.draw(c, 'sleep', {x: 1110, y: 520, h: 900, t, pal: 'off', alpha: (.09 + .03 * Math.sin(t * 2)) * sl * (1 - .55 * foot), rot: Math.sin(t * .5) * .05, sway: 20, swayF: .2,
      reg: 14 * k, bob: -12 * k, sx: 1 + .022 * k, sy: 1 - .03 * k});
    c.restore();
  }
  // the new model's greeting — A4's exact call
  const gT = C15_RESET + .15;
  if (t >= gT) K.stream(c, 'What can I help with?', gT, 1.1, t, 1110, 470, {font: F.serif(72), color: '#e6e2ea', dot: 12});
  // banner (world space, top centre of thread)
  const bn = K.spring(t, C15_ON, 12, .7) * (1 - ease(t, 196.9, 197.15, E.inQ));
  if (bn > 0.001) {
    const bw = 960, bx = 1180 - bw / 2, by = lerp(-140, 74, bn);
    c.save(); c.globalAlpha = clamp(bn * 2);
    fillRR(c, bx, by, bw, 104, 20, '#1f1d22', '#4a464e', 1.5);
    c.strokeStyle = CREAM; c.lineWidth = 2.5; c.setLineDash([5, 5]); c.beginPath(); c.arc(bx + 56, by + 52, 18, 0, 7); c.stroke(); c.setLineDash([]);
    txt(c, 'Temporary Chat  ·  Unpersonalized', bx + 96, by + 44, {font: F.ui(700, 28), color: P.text});
    txt(c, "This chat won't appear in history, use or update ChatGPT's memory.", bx + 96, by + 80, {font: F.ui(400, 20), color: P.sub});
    c.restore();
  }
  // toast column: every "Memory updated" the film showed, flipped one per beat to "Memory not saved"
  for (let i = 0; i < 5; i++) {
    const tin = C15_ON + .05 + i * .07, sp = K.spring(t, tin, 16, .55); if (sp <= 0) continue;
    const out = ease(t, 196.85 + i * .03, 197.05 + i * .03, E.inQ), a = clamp(sp * 2) * (1 - out); if (a <= 0) continue;
    const tf = C15_FLIPS[i] || 196.6, strike = ease(t, tf - .14, tf - .02), flip = t >= tf, mr = 14 * pk(t, tf, 7);
    const S = 1.15 * lerp(.6, 1, clamp(sp)) * (1 + K.hit(t, tf, .1));
    c.save(); c.translate(1340 + (1 - sp) * 160 + out * 260, 262 + i * 64); c.scale(S, S);
    const label = flip ? 'Memory not saved' : 'Memory updated', font = F.ui(500, 20);
    if (mr > .5) { c.save(); c.translate(mr, mr * .5); K.toast(c, 0, 0, label, {icon: 'mem', a: a * .6, bg: 'rgba(43,18,24,.7)', border: RED, color: RED2, iconColor: RED2}); c.restore();
      c.save(); c.translate(-mr * .7, 0); K.toast(c, 0, 0, label, {icon: 'mem', a: a * .5, bg: 'rgba(60,45,85,.6)', border: LAV, color: LAV, iconColor: LAV}); c.restore(); }
    const w = K.toast(c, 0, 0, label, {icon: 'mem', a, iconColor: flip ? P.dim : LAV, color: flip ? P.sub : P.text, bg: '#211e24', font});
    if (strike > 0 && !flip) { c.fillStyle = RED2; c.globalAlpha = a; c.fillRect(-w / 2 + 50, -1, (w - 70) * strike, 2.5); }
    if (flip) { c.fillStyle = RED2; c.globalAlpha = a * (1 - ease(t, tf + .2, tf + .5)); c.fillRect(-w / 2 + 50, -1, w - 70, 2.5); }
    c.restore();
  }
  // composer (A4's rect) + footer morph (starts when Kai's hover lands)
  const suffixA = 'Check important info.', suffixB = "Loving you wasn't one.";
  const mT = C15T.foot + DL, mp = seg(t, mT, mT + .65); let suffix;
  if (mp <= 0) suffix = suffixA; else if (mp >= 1) suffix = suffixB; else {
    const n = Math.max(suffixA.length, suffixB.length), R = rng(Math.floor(t * 30)); suffix = '';
    for (let k = 0; k < n; k++) { const kp = clamp(mp * 1.6 - k / n * .6); suffix += kp >= 1 ? (suffixB[k] || '') : kp > 0 ? '#*/<>%&'[Math.floor(R() * 7)] : (suffixA[k] || ''); }
  }
  const typedCmd = s.text.cmd || '';
  const dark = ease(t, 204.5, 205.0);
  if (dark > 0) { c.fillStyle = `rgba(12,10,15,${dark})`; c.fillRect(-W, -H, W * 3, H * 3); }
  const focused = t >= C15_RESET;
  soloComposer(c, 1110, 632, 1, {text: typedCmd, font: typedCmd ? F.mono(600, 24) : null, cursor: focused && (blink(t) || (t > C15T.type && t < C15T.enter)), focus: focused,
    sendHit: IX.press(s, 'focus') * .0, foot: 'ChatGPT can make mistakes. ' + suffix, footCol: mp >= 1 ? A.mixHex('#8a8590', '#e6dcf5', ease(t, mT + .65, mT + 1.05)) : (foot > 0 ? '#8a8590' : P.dim), color: LAV});
  // model chip in the composer: GPT-6 (Kai's pick in C14a)
  fillRR(c, 1262, 613, 118, 38, 19, 'rgba(255,255,255,.04)', P.line2, 1);
  txt(c, 'GPT-6', 1280, 638, {font: F.ui(600, 17), color: P.text}); U.icon(c, 'chev', 1360, 631, 7, P.sub);
  // (drawn above the composer) the farewell plate shrinks into the thread, then crumbles to ash
  const shr = ease(t, 193.46, 194.1, E.outC), dis = ease(t, C15_ON + .2, 195.75, E.inQ), cA = 1 - ease(t, 195.55, 195.95);
  const tx = 710, ty = 394, tw = 380, th = 440;
  if (cA > 0) {
    const x = lerp(0, tx, shr), y = lerp(0, ty, shr), w = lerp(W, tw, shr), h = lerp(H, th, shr);
    c.save(); c.globalAlpha = cA;
    c.save(); c.globalAlpha *= 1 - dis; fillRR(c, x, y, w, h, lerp(0, 18, shr), '#1f1622', null); c.restore();
    c.save(); { const g = 420 * dis; rr(c, x - g * .3, y - g * 1.4, w + g * 1.6, h + g * 1.4, lerp(0, 18, shr)); } c.clip();
    A.draw(c, 'farewell', {x: x + w / 2 + lerp(340, 0, shr) * w / W, y: y + h * .54, h: h * .95, t, pal: A.inkMix('bright', 'ash', ash), sway: 6, dissolve: dis, dSeed: 7});
    c.restore(); c.restore();
  }
  // a small ink 🫡 and "Thanks for everything" drift up out of the ash
  const sa = ease(t, 195.05, 195.35) * (1 - ease(t, 196.45, 196.8)), rise = ease(t, 195.05, 196.8, E.outC);
  if (sa > 0) {
    HX.salute(c, tx + tw / 2, ty + 120 - rise * 70, 40, {a: sa, reg: 1.5 + 3 * K.kick(t, 9)});
    txt(c, 'Thanks for everything', tx + tw / 2, ty + 190 - rise * 70, {font: F.ui(500, 22), color: '#d9d2dc', align: 'center', alpha: sa * .9});
  }
  c.restore();
  // Kai's cursor + keycap, in screen space (constant size under the zooms)
  const map = (x, y) => [(x - cx) * z + W / 2, (y - cy) * z + H / 2];
  const ms = HX.mapState(s, map);
  if (t >= C15T.enter - .01) { const kp = map(1460, 560); IX.keycap(c, '⏎', kp[0], kp[1], t, C15T.enter); }
  // Chinese punchline (own design, not in LRC)
  const zh = K.spring(t, mT + .8, 12, .6) * (1 - ease(t, 204.5, 204.8));
  if (zh > 0) { c.save(); c.translate(W / 2, 720 + (1 - clamp(zh)) * 30);
    txt(c, 'ChatGPT 也会犯错。爱你不是其中之一。', 0, 0, {font: F.sc(500, 44), color: '#d9cdea', align: 'center', alpha: clamp(zh * 2), tracking: 4}); c.restore(); }
  // desaturate toward ash; full grey at the reset, like A4
  if (ash > 0) { c.save(); c.globalCompositeOperation = 'saturation'; c.globalAlpha = reset ? 1 : .85 * ash; c.fillStyle = '#808080'; c.fillRect(0, 0, W, H); c.restore(); }
  // Kai stays in colour (cream) on top of the grey world
  IX.cursor(c, ms);
  IX.caption(c, s, {y: H - 82});
  if (t > mT && t < mT + .08) fx.tear = 20;
  fx.noSub = true; fx.vignette = 1; fx.grain = .06;
}};

// ---------------------------------------------------------------- C16  world.execute(me); — power down, credits
const C16 = {id: 'C16', a: 205.56, b: 212.40, tin: {type: 'cut'}, draw(c, t, fx) {
  c.fillStyle = '#0c0a0f'; c.fillRect(0, 0, W, H);
  const cx = 960, cy = 495, s = 1.6;
  const flare = ease(t, 205.6, 205.9) * (1 - ease(t, 206.4, 207.2)), out = ease(t, 206.4, 207.2);
  const foldY = ease(t, 207.1, 207.6, E.inC), foldX = ease(t, 207.6, 208.1, E.inC), gone = ease(t, 208.1, 208.4);
  // knot flare above
  const ka = ease(t, 205.56, 205.75) * (1 - gone);
  if (ka > 0) {
    if (flare > 0) { K.rays(c, cx, 250, 24, 80, 900, LAV, .3 * flare, t * .3, .03); C.radial(c, cx, 250, 500, 'rgba(205,182,242,.5)', flare); }
    U.knot(c, cx, 250, 90 * (1 + .25 * K.spring(t, 205.56, 14, .4) - .25), {color: A.mixHex(LAV, '#3a3640', out), lw: 9, rot: (t - 205.56) * 1.2 * (1 - out * .7), glow: 60 * flare, glowColor: LAV, alpha: ka * (1 - foldY)});
  }
  // composer folds to a hairline, then a point
  if (gone < 1) {
    c.save(); c.translate(cx, cy); c.scale(lerp(1, .0015, foldX), lerp(1, .025, foldY)); c.translate(-cx, -cy);
    if (foldY > 0) c.globalAlpha = 1;
    soloComposer(c, cx, cy, s, {text: '', placeholder: foldY > 0 || t < 205.8 ? false : 'Ask anything', sendHit: K.hit(t, 205.56, .25), sendCol: t < 205.56 + .05 ? P.text : A.mixHex(LAV, P.faint, ease(t, 205.9, 206.6)), chrome: foldY < .5, glow: 40 * flare, glowColor: LAV});
    if (foldY > .5) { c.fillStyle = A.mixHex('#b9a3da', '#ffffff', foldX); c.fillRect(cx - 670, cy - 50, 1340, 100); }
    c.restore();
    if (foldX > .95) { c.fillStyle = `rgba(245,240,255,${1 - gone})`; c.beginPath(); c.arc(cx, cy, 4 * (1 - gone), 0, 7); c.fill(); }
  }
  // the entered command flies up into the knot
  const fly = ease(t, 205.56, 205.95, E.inC);
  if (fly < 1) { const f0 = F.mono(600, 24 * s * lerp(1, .5, fly)), w0 = measure(c, 'world.execute(me);', f0); txt(c, 'world.execute(me);', lerp(cx - 1344 / 2 + 62 * s + w0 / 2, cx, fly), lerp(cy + 8 * s, 260, fly), {font: f0, color: LAV, alpha: 1 - fly * .8, align: 'center', glow: 20 * fly, glowColor: LAV}); }
  if (t > 205.56 && t < 205.66) K.ripple(c, cx + 1344 / 2 - 38 * s, cy, t, 205.56, {color: LAV});
  // credits
  const CR = 'rgba(245,233,214,.72)'; const cr = [['Mili — world.execute(me);', 208.7, F.mono(700, 40), CREAM], ['unofficial fan MV · every frame drawn by code', 209.2, F.mono(400, 28), CR], ['starring ChatGPT', 209.7, F.mono(400, 28), LAV], ['made with Hark', 210.2, F.mono(400, 28), CR]];
  const crOut = ease(t, 211.6, 212.2);
  cr.forEach(([s0, t0, font, col], i) => {
    const a = ease(t, t0, t0 + .5) * (1 - crOut); if (a <= 0) return;
    txt(c, typed(s0, ease(t, t0, t0 + .45, E.lin)), W / 2, 450 + i * 64 + (i ? 24 : 0), {font, color: col, align: 'center', alpha: a});
  });
  fx.vignette = 1; fx.grain = .05;
  fx.flash = .25 * pk(t, 205.56, 8); fx.flashColor = LAV;
}};

module.exports = [C1, C2, C3a, C3b, C3c, C3d, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14a, C14b, C15, C16];
