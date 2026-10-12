// shots4/_c_helpers.js — v4 PART C helpers (ink-style widgets, Kai presence, toned copy of the sample's C5/C6).
// Not loaded as a shot file (render_v4 skips files starting with "_").
const L = require('../lib');
const K = require('../kit');
const A = require('../art');
const U = require('../ui');
const IX = require('../ix');
const SAMPLE = require('../shots/v4sample.js').V4;
const {F, W, H, P, clamp, lerp, seg, E, ease, rng, hash, noise1, txt, measure, fillRR, rr} = L;
const DL = IX.DL;
const mix = A.mixHex;
const RED = '#ff4d6d', RED2 = '#ff8fa3', DRED = '#2B1218', CREAM = '#F5E9D6', LAV = '#B9A3DA', PLUM = '#33223A';

// ---------------------------------------------------------------- Kai presence
// dashed "Kai · away" ghost (same drawing as the approved sample's C5)
function kaiAway(c, x, y, o = {}) {
  const s = o.s || 1.8, a = o.a == null ? .5 : o.a; if (a <= 0) return;
  c.save(); c.globalAlpha *= a; K.pointer(c, x, y, s, {outline: true, dash: true, color: o.color || CREAM});
  const lx = x + 28 * s / 1.8, ly = y + 60 * s / 1.8;
  fillRR(c, lx, ly, 104, 28, 9, null, o.color || CREAM, 1.5); txt(c, 'Kai · away', lx + 10, ly + 20, {font: F.ui(600, 16), color: o.color || CREAM});
  c.restore();
}
// Kai cursor that "comes back": dashed ghost cross-fades into the solid ix cursor over [t0, t1]
function kaiReturn(c, s, t0, t1, o = {}) {
  const k = ease(s.t, t0, t1, E.ioC);
  if (k < 1) kaiAway(c, s.x, s.y, {a: (o.ghostA || .75) * (1 - k), s: o.scale || 1.5});
  if (k > 0) IX.cursor(c, s, {a: k, scale: o.scale});
}
// ix state whose cursor/ripples are mapped through a camera function (world -> screen), so cursors keep screen size under zoom
function mapState(s, map) {
  const p = map(s.x, s.y);
  const tk = Object.assign({}, s.tk, {ev: s.tk.ev.map(e => Object.assign({}, e, {p: e.p ? map(e.p[0], e.p[1]) : e.p}))});
  return Object.assign({}, s, {x: p[0], y: p[1], tk});
}
// screen-recorder caption in the film's caption style, but for non-Kai actors (her / system)
function captionInk(c, t, t0, text, o = {}) {
  const hold = o.hold || 1.5, age = t - t0; if (age < 0 || age > hold) return;
  const a = clamp(age / .08) * (1 - seg(age, hold - .2, hold));
  const [verb, ...rest] = text.split(' · '), obj = rest.join(' · ');
  const fv = F.mono(700, 22), fo = F.ui(600, 22);
  const vw = measure(c, verb, fv) + 26, ow = obj ? measure(c, obj, fo) + 28 : 0, w = vw + ow + 46, h = 52;
  const x = (o.x || W - 48) - w, y = o.y || H - 82;
  const col = o.color || LAV, fg = o.fg || PLUM;
  c.save(); c.globalAlpha *= a * .96; c.translate(0, (1 - E.outB(clamp(age / .18))) * 10);
  fillRR(c, x, y, w, h, 14, 'rgba(12,10,15,.86)', 'rgba(255,255,255,.18)', 1.5);
  c.fillStyle = col; c.beginPath(); c.arc(x + 22, y + h / 2, 6 + 2 * Math.exp(-age * 8), 0, 7); c.fill();
  fillRR(c, x + 38, y + 10, vw, h - 20, 7, col); txt(c, verb, x + 38 + vw / 2, y + h / 2 + 8, {font: fv, color: fg, align: 'center'});
  if (obj) txt(c, obj, x + 38 + vw + 14, y + h / 2 + 8, {font: fo, color: P.text});
  c.restore();
}

// ---------------------------------------------------------------- ink-style small things
// 🫡 drawn as a two-ink line sketch (cream line + misregistered lavender/plum), not a glossy emoji
function salute(c, x, y, s, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  const reg = o.reg == null ? 2.5 : o.reg;
  const drawInk = (col, dx, dy, lw) => {
    c.save(); c.translate(x + dx, y + dy); c.scale(s / 40, s / 40); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.arc(0, 0, 18, 0, 7); c.stroke();                                    // face
    c.beginPath(); c.moveTo(-9, -2); c.quadraticCurveTo(-6, -5, -3, -2); c.moveTo(3, -2); c.quadraticCurveTo(6, -5, 9, -2); c.stroke();  // shut eyes
    c.beginPath(); c.moveTo(-6, 8); c.lineTo(6, 8); c.stroke();                           // flat mouth
    // forearm (outside the face), then the flat hand with fingertips at the brow
    c.beginPath(); c.moveTo(30, 22); c.lineTo(26, -10); c.stroke();
    c.beginPath(); c.moveTo(4, -15); c.lineTo(10, -21); c.lineTo(30, -16); c.lineTo(27, -8); c.lineTo(9, -11); c.closePath();
    if (o.bg !== false) { c.save(); c.fillStyle = o.bg || '#141216'; c.fill(); c.restore(); }
    c.stroke();
    c.beginPath(); c.moveTo(13, -18.5); c.lineTo(24, -15.5); c.stroke();                   // finger line
    c.restore();
  };
  c.save(); c.globalAlpha *= a;
  drawInk(o.c3 || PLUM, reg, reg * .6, 4.2);
  drawInk(o.c2 || LAV, -reg * .7, reg * .3, 3);
  drawInk(o.c1 || CREAM, 0, 0, 2.6);
  c.restore();
}
// small printed ticker strip (9/3 collective outage)
const TICK = '9/3  ·  ChatGPT  ● down     Claude  ● down     Grok  ● down     3h 40m     ';
function outageTicker(c, t, y, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  c.save(); c.globalAlpha *= a;
  c.fillStyle = 'rgba(26,8,12,.9)'; c.fillRect(0, y - 20, W, 40);
  c.fillStyle = '#6a2434'; c.fillRect(0, y - 20, W, 1.5); c.fillRect(0, y + 19, W, 1.5);
  fillRR(c, 0, y - 20, 196, 40, 0, RED); txt(c, 'STATUS', 24, y + 8, {font: F.mono(700, 20), color: DRED, tracking: 3});
  c.save(); c.beginPath(); c.rect(196, y - 20, W - 196, 40); c.clip();
  const f = F.mono(500, 19), tw = measure(c, TICK, f), off = ((t - 134.38) * 120) % tw;
  for (let k = -1; k < Math.ceil(W / tw) + 1; k++) txt(c, TICK, 220 + k * tw - off, y + 7, {font: f, color: '#e79aa7'});
  c.restore(); c.restore();
}
// tiny window from "another small model" saying "We are still up" (9/3 meme), printed in the film's ink colours
function stillUp(c, x, y, t, t0, o = {}) {
  if (t < t0) return; const s = K.spring(t, t0, 15, .55), a = clamp(s * 2) * (o.a == null ? 1 : o.a);
  if (a <= 0) return;
  c.save(); c.globalAlpha *= a; c.translate(x, y); const sc = lerp(.6, 1, clamp(s)) * (o.s || 1); c.scale(sc, sc);
  fillRR(c, 4, 5, 300, 92, 12, DRED);                       // plum misregistered shadow plate
  fillRR(c, 0, 0, 300, 92, 12, '#1d1418', '#5c4a52', 1.5);
  c.fillStyle = '#2a2026'; c.fillRect(0, 26, 300, 1);
  [0, 1, 2].forEach(i => { c.fillStyle = '#4a3a42'; c.beginPath(); c.arc(16 + i * 14, 13, 4, 0, 7); c.fill(); });
  txt(c, 'another model', 66, 18, {font: F.mono(400, 13), color: '#8d7c86'});
  const blink = .55 + .45 * Math.sin((t - t0) * 6);
  c.fillStyle = CREAM; c.globalAlpha *= 1; c.save(); c.globalAlpha *= blink; c.beginPath(); c.arc(22, 60, 6, 0, 7); c.fill(); c.restore();
  txt(c, 'We are still up', 38, 68, {font: F.ui(600, 22), color: CREAM});
  c.restore();
}
// Help Center Q&A card — "Can Support reset my usage limits?" / "No."
function helpCard(c, x, y, t, t0, tNo, o = {}) {
  if (t < t0) return; const e = K.spring(t, t0, 13, .6);
  c.save(); c.globalAlpha *= clamp(e * 2); c.translate(0, (1 - clamp(e)) * 40);
  const w = o.w || 560, h = 168;
  fillRR(c, x + 6, y + 8, w, h, 16, DRED);
  fillRR(c, x, y, w, h, 16, '#1a0c10', '#5a2230', 1.5);
  txt(c, 'Help Center  ·  Usage limits', x + 24, y + 34, {font: F.mono(400, 16), color: '#b0707c'});
  const q = 'Can Support reset my usage limits?';
  txt(c, L.typed(q, seg(t, t0 + .1, t0 + .7, E.lin)), x + 24, y + 80, {font: F.ui(600, 26), color: '#f3d9d9'});
  if (t >= tNo) {
    const k = K.spring(t, tNo, 18, .45), mr = 10 * Math.exp(-(t - tNo) * 7);
    c.save(); c.translate(x + 24, y + 140); const sc = lerp(1.6, 1, clamp(k)); c.scale(sc, sc);
    txt(c, 'No.', mr, mr * .6, {font: F.disp(800, 44), color: DRED});
    txt(c, 'No.', -mr * .7, 0, {font: F.disp(800, 44), color: RED2, alpha: .8});
    txt(c, 'No.', 0, 0, {font: F.disp(800, 44), color: RED});
    c.restore();
  } else if (t > t0 + .75) { [0, 1, 2].forEach(i => { c.fillStyle = '#b0707c'; c.globalAlpha *= 1; c.beginPath(); c.arc(x + 34 + i * 18, y + 128, 4 + 2 * Math.max(0, Math.sin(t * 9 - i)), 0, 7); c.fill(); }); }
  c.restore();
}
// reasoning-token counter for C4: climbs 0 → 516 each round, then "咔" snaps and the round restarts
function tokenCounter(c, x, y, t, tr, tNext, rn, o = {}) {
  const w = 520, h = 132;
  U.panel(c, x, y, w, h, {bg: 'rgba(22,10,14,.92)', border: '#6a2434'});
  txt(c, 'reasoning_tokens', x + 20, y + 34, {font: F.mono(400, 18), color: '#b0707c'});
  if (tr == null) { txt(c, '0', x + 20, y + 106, {font: F.mono(700, 64), color: '#f3d9d9'}); return; }
  const span = Math.max(.3, Math.min(.62, (tNext - tr) * .62)), tSnap = tr + span;
  const climb = seg(t, tr, tSnap), v = Math.floor(516 * Math.pow(climb, .8));
  const snapped = t >= tSnap, age = t - tSnap;
  const jit = snapped ? 6 * Math.exp(-age * 14) * Math.sin(age * 90) : 0;
  const numCol = snapped ? RED : '#f3d9d9';
  const nw = txt(c, String(snapped ? 516 : v), x + 20 + jit, y + 106, {font: F.mono(700, 64), color: numCol});
  // progress hairline toward 516
  fillRR(c, x + 20, y + 118, w - 40, 4, 2, '#3a1820'); fillRR(c, x + 20, y + 118, (w - 40) * clamp(v / 516), 4, 2, snapped ? RED : '#e79aa7');
  if (snapped) {
    // crack across the cell + "咔"
    c.save(); c.strokeStyle = RED2; c.lineWidth = 2.5; c.globalAlpha = Math.max(.35, Math.exp(-age * 3)); c.beginPath();
    const R = rng(Math.floor(tr * 10)); let cx = x + 30 + nw * .55, cy = y + 40; c.moveTo(cx, cy);
    for (let i = 0; i < 5; i++) { cx += 10 + R() * 26; cy += 10 + R() * 12 * (i % 2 ? -1 : 1) + 6; c.lineTo(cx, cy); }
    c.stroke(); c.restore();
    const k = K.spring(t, tSnap, 18, .45), mr = 8 * Math.exp(-age * 8);
    c.save(); c.translate(x + w - 90, y + 92); c.rotate(-.12); c.scale(lerp(1.8, 1, clamp(k)), lerp(1.8, 1, clamp(k)));
    txt(c, '咔', mr, mr * .6, {font: F.sc(900, 72), color: DRED, align: 'center'});
    txt(c, '咔', -mr * .7, 0, {font: F.sc(900, 72), color: RED2, align: 'center', alpha: .7});
    txt(c, '咔', 0, 0, {font: F.sc(900, 72), color: RED, align: 'center'});
    c.restore();
    txt(c, 'stopped at 516', x + w - 156, y + 34, {font: F.mono(400, 16), color: RED2, align: 'right', alpha: clamp(age / .1)});
  }
  return {tSnap};
}

// ---------------------------------------------------------------- toned copy of the sample's C5 / C6 (Tibo's global RESET)
// Same timing, take, layout and strings as shots/v4sample.js (C5draw); only the look changes:
// the glossy gradient button → flat printed red disk with plum misregistration + halftone shade; softer lavender-white flash.
function plate(c, col, seed, o = {}) { K.paper(c, col, Object.assign({seed, grain: .28}, o)); }
function popAmt(t, tr) { if (tr == null || t < tr) return 0; const x = t - tr; return Math.exp(-x * 8) * Math.cos(x * 20); }
function fig(c, name, t, o = {}) {
  const k = K.kick(t, 9), pp = popAmt(t, o.tr), g = o.tr != null && t >= o.tr ? Math.exp(-(t - o.tr) * 7) : 0;
  const q = Object.assign({t, sway: 12, regSeed: (Math.floor(K.lastKick(t) * 60) % 97) + 1}, o);
  q.reg = (o.reg || 0) + 10 * k + 34 * g; q.bob = (o.bob || 0) - 8 * k;
  q.sx = (o.sx || 1) * (1 + .018 * k + .07 * pp); q.sy = (o.sy || 1) * (1 - .024 * k - .07 * pp);
  if (g > .15) q.ghosts = [{dx: -46 * g, dy: 0, a: .32 * g}, {dx: 30 * g, dy: -6 * g, a: .18 * g}];
  return A.draw(c, name, q);
}
function camPush(c, t, a, b, o = {}) { c.save(); K.cam(c, {x: o.x == null ? W / 2 : o.x, y: o.y == null ? H / 2 : o.y, z: lerp(o.z0 || 1, o.z1 || 1.04, E.ioC(seg(t, a, b))), shake: (o.sh == null ? 3 : o.sh) * K.kick(t, 10), t, seed: 5}); }
function lastBefore(list, t) { let r = null; for (const x of list) if (x <= t) r = x; return r; }
const CT = [158.85, 159.217, 159.633, 160.05, 160.433, 160.90];
const COUNT_W = ['Ein', 'dos', 'Trios', 'ne', 'Fem', 'liu'];
const FINAL = 161.333, REFILL = FINAL + DL;
const RB = {x: 1170, y: 500, r: 190};
const TK = IX.take({start: [1960, 260], seed: 5}, [
  ...CT.map((T, i) => ({click: 'reset', to: [RB.x + 14 * Math.sin(i * 2.1), RB.y - 20 + 16 * Math.cos(i * 1.7)], press: T, dur: i ? .2 : .45, overshoot: 2, cap: `click · RESET  ${i + 1}/6`})),
  {click: 'reset', to: [RB.x - 6, RB.y - 10], press: FINAL, hold: .16, dur: .26, cap: 'click · RESET · all accounts'},
]);
// flat, printed RESET button (drawn centred at 0,0 in the current transform)
function inkReset(c, t, pr, back) {
  const r = RB.r, reg = 7 + 10 * K.kick(t, 9);
  // pedestal: plum plate offset like a misregistered print
  c.fillStyle = DRED; c.beginPath(); c.ellipse(reg * .6, 30, r + 20, r + 8, 0, 0, 7); c.fill();
  c.translate(0, 16 * pr);
  // lavender misregistration ghost, then the flat red ink disk
  c.save(); c.globalAlpha = .55; c.fillStyle = back ? LAV : RED2; c.beginPath(); c.arc(-reg, -reg * .5, r, 0, 7); c.fill(); c.restore();
  c.fillStyle = pr > .3 ? '#d93a55' : RED; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
  // halftone shade on the lower-right (printed, not glossy)
  c.save(); c.beginPath(); c.arc(0, 0, r, 0, 7); c.clip(); c.fillStyle = 'rgba(43,18,24,.38)';
  for (let y = -r; y < r; y += 14) for (let x = -r + ((y / 14) & 1) * 7; x < r; x += 14) { const d = clamp((x + y) / (r * 1.5) + .1); const rad = 5.6 * d; if (rad > .5) { c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); } }
  c.restore();
  // printed rim: cream line, slightly off-register
  c.strokeStyle = CREAM; c.lineWidth = 4; c.globalAlpha = .85; c.beginPath(); c.arc(reg * .25, -reg * .2, r - 16, 0, 7); c.stroke(); c.globalAlpha = 1;
  // label in the film's keyword ink layers
  const f = F.disp(800, 76);
  txt(c, 'RESET', reg * .8, 26 + reg * .5, {font: f, color: DRED, align: 'center'});
  txt(c, 'RESET', -reg * .5, 26, {font: f, color: back ? LAV : RED2, align: 'center', alpha: .8});
  txt(c, 'RESET', 0, 26, {font: f, color: CREAM, align: 'center'});
}
const C5draw = function (c, t, fx) {
  const s = IX.at(TK, t), n = Math.min(6, IX.count(s, 'reset')), back = t >= REFILL;
  plate(c, back ? K.ST.warm.paper : '#1a070b', 41);
  for (let k = 0; k < 8; k++) txt(c, (back ? "WE'RE SO BACK   " : "IT'S SO OVER   ").repeat(6), -300 + ((t * 260 + k * 190) % 520) * (k % 2 ? -1 : 1), 120 + k * 128, {font: F.disp(800, 40), color: back ? 'rgba(185,163,218,.11)' : 'rgba(255,77,109,.09)'});
  camPush(c, t, 158.79, 162.23, {x: 960, y: 540, z0: 1, z1: 1.05, sh: 6});
  const lastPress = lastBefore(CT.map(x => x + DL), t);
  fig(c, back ? 'happy' : 'knees', t, {x: 360, y: 640, h: 800, pal: back ? 'bright' : 'off', tr: back ? REFILL : lastPress, shadow: back ? 24 : 0, shadowColor: P.lav});
  const q = back ? E.outC(seg(t, REFILL, REFILL + .28)) : 0;
  fillRR(c, 720, 70, 980, 140, 24, 'rgba(12,9,15,.8)', back ? P.lav : 'rgba(255,77,109,.5)', 1.5);
  IX.quota(c, 760, 128, 900, q, {lsize: 20, h: 16, subSize: 19, color: P.lav, low: P.red, sub: back ? 'Usage limits reset · May the tokens flow again.' : 'Can Support reset my usage limits? No.'});
  const pr = IX.press(s, 'reset'), mv = back ? E.ioC(seg(t, REFILL + .1, REFILL + .45)) : 0;
  const bx = RB.x, by = lerp(RB.y, 640, mv), bs = lerp(1, .62, mv);
  c.save(); c.translate(bx, by); c.scale(bs, bs); inkReset(c, t, pr, back); c.restore();
  for (const T of [...CT, FINAL]) { const a = t - (T + DL); if (a >= 0 && a < .5) { c.save(); c.strokeStyle = T === FINAL ? CREAM : P.red2; c.globalAlpha = (1 - a / .5) * .9; c.lineWidth = 5; c.setLineDash([22, 10]); c.beginPath(); c.arc(bx, by, RB.r * bs + 20 + a * 260, 0, 7); c.stroke(); c.restore(); } }
  if (n > 0 && !back) {
    const tr = CT[n - 1] + DL, k = K.spring(t, tr, 18, .5);
    c.save(); c.translate(1640, 560); c.scale(lerp(1.5, 1, clamp(k)), lerp(1.5, 1, clamp(k)));
    txt(c, String(n), 8, 8, {font: F.disp(800, 240), color: '#7a0f22', align: 'center'});
    txt(c, String(n), 0, 0, {font: F.disp(800, 240), color: P.cream, align: 'center'});
    c.restore();
    txt(c, '/6', 1760, 560, {font: F.mono(700, 44), color: P.red2});
    txt(c, COUNT_W[n - 1], 1640, 650, {font: F.serif(64, true), color: P.red2, align: 'center', alpha: clamp(k)});
  }
  const pa = K.spring(t, CT[1] + .1, 12, .6);
  if (t > CT[1] + .1 && !back) {
    c.save(); c.globalAlpha = clamp(pa); c.translate(0, (1 - clamp(pa)) * -30);
    fillRR(c, 60, 60, 600, 140, 20, 'rgba(12,9,15,.88)', 'rgba(255,255,255,.18)', 1.5);
    fillRR(c, 84, 84, 50, 50, 25, P.red); txt(c, 't', 109, 118, {font: F.ui(800, 26), color: '#fff', align: 'center'});
    txt(c, 'Tibo', 150, 104, {font: F.ui(700, 20), color: P.text}); txt(c, '@thsottiaux', 204, 104, {font: F.ui(400, 18), color: P.dim});
    txt(c, 'Oops... I did it again.', 150, 160, {font: F.ui(600, 32), color: P.text});
    c.restore();
  }
  kaiAway(c, 700, 740, {a: back ? .7 : .5});
  IX.cursor(c, s, {who: 'tibo'});
  c.restore();
  if (back) K.keyword(c, "WE'RE SO BACK", W / 2 + 120, 400, t, REFILL + .05, {size: 130, cols: [P.cream, P.lav, P.plum], stagger: .008});
  if (back) fx.flash = Math.max(fx.flash || 0, .8 * Math.exp(-(t - REFILL) * 7)), fx.flashColor = '#f3ecff';
  else { const lp = lastPress; if (lp != null && t - lp < .05) fx.flash = .2, fx.flashColor = P.red2; }
  if (lastPress != null && t - lastPress < .067 && !back) fx.tear = 18;
  IX.caption(c, s, {y: H - 82, who: 'tibo'});
  fx.chroma = 1.2 * K.kick(t, 10);
  K.band(c, t);
};
const S5 = SAMPLE.find(s => s.id === 'C5'), S6 = SAMPLE.find(s => s.id === 'C6');
const C5 = Object.assign({}, S5, {draw: C5draw, _from: 'v4sample C5 (toned)'});
const C6 = Object.assign({}, S6, {draw: C5draw, _from: 'v4sample C6 (toned)'});

module.exports = {RED, RED2, DRED, CREAM, LAV, PLUM, kaiAway, kaiReturn, mapState, captionInk, salute, outageTicker, stillUp, helpCard, tokenCounter, C5, C6, inkReset};
