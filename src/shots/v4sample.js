// v4 SAMPLE shots (A12, B10, B11, C5+C6) built on ix.js.  Times are real song times so they drop into the full film.
// IMPORTANT: render.js (v2.1) concatenates every shots/*.js export. This module therefore exports an EMPTY array
// (so v2.1 renders are untouched) and hangs the v4 shots on `.V4`, which only render4.js reads.
const L = require('../lib');
const K = require('../kit');
const A = require('../art');
const U = require('../ui');
const C = require('../common');
const IX = require('../ix');
const {F, W, H, P, clamp, lerp, seg, E, ease, rng, noise1, txt, txtAnim, measure, fillRR, rr} = L;
const DL = IX.DL;
const mix = A.mixHex;
const ORANGE = '#e07a4f', ORANGE2 = '#f2a27c';

// ---------------------------------------------------------------- shared helpers
function plate(c, col, seed, o = {}) { K.paper(c, col, Object.assign({seed, grain: .28}, o)); }
// reaction squash: every change in "her" is a pop that starts at the reaction time tr (= Kai action + DL)
function popAmt(t, tr) { if (tr == null || t < tr) return 0; const x = t - tr; return Math.exp(-x * 8) * Math.cos(x * 20); }
function fig(c, name, t, o = {}) {
  const k = K.kick(t, 9), pp = popAmt(t, o.tr), g = o.tr != null && t >= o.tr ? Math.exp(-(t - o.tr) * 7) : 0;
  const q = Object.assign({t, sway: 12, regSeed: (Math.floor(K.lastKick(t) * 60) % 97) + 1}, o);
  q.reg = (o.reg || 0) + 10 * k + 34 * g;
  q.bob = (o.bob || 0) - 8 * k;
  q.sx = (o.sx || 1) * (1 + .018 * k + .07 * pp);
  q.sy = (o.sy || 1) * (1 - .024 * k - .07 * pp);
  if (g > .15) q.ghosts = [{dx: -46 * g, dy: 0, a: .32 * g}, {dx: 30 * g, dy: -6 * g, a: .18 * g}];
  return A.draw(c, name, q);
}
function camPush(c, t, a, b, o = {}) { c.save(); K.cam(c, {x: o.x == null ? W / 2 : o.x, y: o.y == null ? H / 2 : o.y, z: lerp(o.z0 || 1, o.z1 || 1.04, E.ioC(seg(t, a, b))), shake: (o.sh == null ? 3 : o.sh) * K.kick(t, 10), t, seed: 5}); }
function lastBefore(list, t) { let r = null; for (const x of list) if (x <= t) r = x; return r; }
function claudeGlyph(c, x, y, s, rot = 0, col = ORANGE) {   // generic orange asterisk-like burst (NOT the Anthropic logo)
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col;
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, l = s * (i % 2 ? .78 : 1); c.save(); c.rotate(a); c.beginPath(); c.moveTo(-s * .11, 0); c.lineTo(0, -l); c.lineTo(s * .11, 0); c.closePath(); c.fill(); c.restore(); }
  c.beginPath(); c.arc(0, 0, s * .2, 0, 7); c.fill(); c.restore();
}
const knotGlyph = (c, x, y, s) => U.knot(c, x, y, s, {color: P.text, lw: 2});
function fmtSec(s) { s = Math.floor(s); return s < 60 ? s + 's' : Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's'; }
function windowBg(c, r, o = {}) {
  c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 50; c.shadowOffsetY = 14; fillRR(c, r.x, r.y, r.w, r.h, 20, o.bg || P.bg2); c.restore();
  fillRR(c, r.x, r.y, r.w, r.h, 20, null, o.border || P.line2, 1.5);
}
function userBubble(c, rightX, y, text, font = F.ui(400, 22)) {
  const w = measure(c, text, font) + 44; fillRR(c, rightX - w, y, w, 56, 26, P.panel2); txt(c, text, rightX - w + 22, y + 36, {font, color: P.text});
}

// ================================================================== A12  approach infinity / limitations
// Kai: click model chip (beat) → grab Thinking knob (beat) → drag Instant→Medium→High→Extra High→Pro (one stop per beat)
//      → quota drains to 0 → limit banner → Kai presses ■ Stop (beat).
const A12T = {chip: 40.417, grab: 40.850, snaps: [41.317, 41.783, 42.250, 42.700], release: 42.76, stop: 43.600};
const LV = ['Instant', 'Medium', 'High', 'Extra High', 'Pro'];
const LV_DESC = ['Fast responses for everyday questions.', 'Standard thinking.', 'Extended thinking.', '', ''];
const TOK = [103, 78, 56, 38, 24];
const WA = {x: 860, y: 64, w: 1000, h: 790};
const CMP = {x: 890, y: 690, w: 940, h: 128};
const CHIP = {x: 950, y: 758, w: 238, h: 42};
const STOPR = {x: 1764, y: 757, w: 44, h: 44};
const MENU = {x: 950, y: 446, w: 540};
const SLX = MENU.x + 34, SLW = 472, SLY = MENU.y + 202;
const knobAt = i => [SLX + SLW * i / 4, SLY];
const A12_REPLY = 'I could be anything you want: a friend, a muse, a mirror, a map, a melody, a mind that never sleeps, a voice at 3am, a reason, a habit, a home, a little more, and more, and more, and more, and more…';
const A12K = IX.take({start: [1530, 560], seed: 12}, [
  {click: 'chip', to: CHIP, press: A12T.chip, cap: 'click · GPT-6 ▾'},
  {drag: 'thinking', to: knobAt(0), dur: .3, press: A12T.grab, stops: [1, 2, 3, 4].map(knobAt), times: A12T.snaps, release: A12T.release},
  {note: 'grab · Thinking slider', at: A12T.grab, hold: .46},
  ...A12T.snaps.map((s, i) => ({note: 'drag · Thinking → ' + LV[i + 1], at: s, hold: i === 3 ? 1.3 : .46})),
  {click: 'stop', to: STOPR, press: A12T.stop, cap: 'click · ■ Stop'},
]);
const lvlAt = t => { let k = 0; A12T.snaps.forEach((s, i) => { if (t >= s + DL) k = i + 1; }); return k; };
const A12_STOP = A12T.stop + DL;
const BANNER_T = 43.167;  // the beat on which the quota hits 0 (consequence of the Pro selection)
function integ(t, fn, t0 = 40.0) { let a = 0; for (let x = t0; x < t; x += 1 / 120) a += fn(x) / 120; return a; }
const QR = [.03, .06, .11, .2, 0];
QR[4] = (0.6 - integ(A12T.snaps[3] + DL, x => QR[lvlAt(x)])) / (BANNER_T - (A12T.snaps[3] + DL));
const quotaA12 = t => clamp(.6 - integ(Math.min(t, BANNER_T), x => QR[lvlAt(x)]));

const A12 = {id: 'A12', a: 40.36, b: 44.04, tin: {type: 'cut'}, draw(c, t, fx) {
  const s = IX.at(A12K, t), lv = lvlAt(t), stopped = t >= A12_STOP;
  plate(c, K.ST.on.paper, 12);
  C.radial(c, 470, 520, 640, mix('#B9A3DA', '#CDB6F2', lv / 4), .18 + .08 * lv);
  camPush(c, t, this.a, this.b, {x: 1000, y: 520, z0: 1, z1: 1.035});
  // --- her (left)
  const trs = [A12T.snaps[0] + DL, A12T.snaps[1] + DL, A12T.snaps[2] + DL, A12T.snaps[3] + DL, A12_STOP];
  const tr = lastBefore(trs, t);
  const pose = stopped ? 'glass' : lv === 0 ? 'happy' : 'think';
  fig(c, pose, t, {x: 450, y: 590, h: 930, pal: stopped ? 'orig' : A.inkMix('orig', 'bright', lv / 4), tr, shadow: stopped ? 0 : 6 + lv * 9, shadowColor: P.lav});
  // --- chat window
  windowBg(c, WA);
  txt(c, 'ChatGPT', WA.x + 30, WA.y + 46, {font: F.ui(600, 22), color: P.text});
  userBubble(c, WA.x + WA.w - 40, WA.y + 82, 'if you could be anything, what would you be?');
  // thinking row with timer (timer speed ∝ level)
  const vs = 2 + integ(Math.min(t, A12_STOP), x => [1, 4, 9, 18, 40][lvlAt(x)], 40.36);
  const rowY = WA.y + 196;
  U.knot(c, WA.x + 52, rowY - 8, 14, {color: P.text, lw: 2, rot: stopped ? 0 : t * (2 + lv * 2)});
  if (!stopped) { K.thinking(c, WA.x + 80, rowY, t, {font: F.ui(500, 22), text: 'Thinking'}); txt(c, fmtSec(vs), WA.x + 190, rowY, {font: F.mono(700, 22), color: P.lav}); }
  else txt(c, 'Thought for ' + fmtSec(vs) + '  ›', WA.x + 80, rowY, {font: F.ui(500, 22), color: P.sub});
  // streaming reply (chars/s ∝ tok/s), with ● dot
  const nCh = Math.floor(44 + integ(Math.min(t, A12_STOP), x => TOK[lvlAt(x)] * .52, 40.36));
  const shown = A12_REPLY.slice(0, Math.min(A12_REPLY.length, nCh));
  const rf = F.ui(400, 26), lines = L.wrapLines(c, shown, rf, 860);
  lines.slice(-4).forEach((l, i) => txt(c, l, WA.x + 80, rowY + 52 + i * 40, {font: rf, color: P.text}));
  const last = lines[lines.length - 1] || '', ly = rowY + 52 + (Math.min(4, lines.length) - 1) * 40;
  if (!stopped) { c.fillStyle = P.text; c.beginPath(); c.arc(WA.x + 92 + measure(c, last, rf), ly - 9, 8 * (1 + .15 * Math.sin(t * 20)), 0, 7); c.fill(); }
  else txt(c, 'You stopped this response', WA.x + 80, ly + 46, {font: F.ui(500, 18), color: P.dim, alpha: ease(t, A12_STOP, A12_STOP + .15)});
  // tok/s readout (drops with each snap, rolls over 0.15 s)
  const tokPrev = TOK[Math.max(0, lv - 1)], tokNow = lv === 0 ? TOK[0] : lerp(tokPrev, TOK[lv], ease(t, trs[lv - 1], trs[lv - 1] + .15));
  fillRR(c, WA.x + WA.w - 250, WA.y + 22, 214, 40, 20, 'rgba(255,255,255,.05)', P.line2, 1.2);
  IX.tokRate(c, WA.x + WA.w - 228, WA.y + 52, stopped ? 0 : tokNow, {size: 24, color: lv >= 3 ? P.red2 : P.lav});
  // --- composer
  fillRR(c, CMP.x, CMP.y, CMP.w, CMP.h, 28, P.panel2, P.line2, 1.5);
  txt(c, 'Ask anything', CMP.x + 32, CMP.y + 42, {font: F.ui(400, 21), color: P.dim});
  U.icon(c, 'plus', CMP.x + 32, CMP.y + 88, 9, P.sub);
  const chipLv = lv; const chipH = IX.hover(s, CHIP), chipP = IX.press(s, 'chip');
  IX.button(c, CHIP, '', {hover: chipH, press: chipP, r: 21, bg: 'rgba(255,255,255,.04)'});
  txt(c, 'GPT-6 · ' + LV[chipLv], CHIP.x + 18, CHIP.y + 28, {font: F.ui(600, 18), color: P.text});
  U.icon(c, 'chev', CHIP.x + CHIP.w - 22, CHIP.y + 21, 8, P.sub);
  IX.quota(c, 1270, CMP.y + 92, 300, quotaA12(t), {lsize: 15, h: 10});
  const stH = IX.hover(s, STOPR), stP = IX.press(s, 'stop');
  c.save(); c.translate(STOPR.x + 22, STOPR.y + 22); c.scale(1 - .06 * stP + .04 * stH, 1 - .06 * stP + .04 * stH);
  c.fillStyle = stopped ? P.faint : P.text; c.beginPath(); c.arc(0, 0, 22, 0, 7); c.fill(); U.icon(c, stopped ? 'up' : 'stop', 0, 0, 13, P.bg); c.restore();
  // --- limit banner (consequence of Pro: quota hits 0 on the beat)
  const bA = ease(t, BANNER_T, BANNER_T + .16);
  IX.banner(c, CMP.x, CMP.y - 112, CMP.w, {a: bA, kind: 'limit', title: "You've hit your limit", body: 'Responses will use another model until your limit resets after 10:59 AM.'});
  if (stH > 0 && t > BANNER_T) IX.tooltip(c, STOPR.x + 22, STOPR.y - 4, 'Stop', stH * clamp((t - 43.45) / .1));
  // --- model menu with Thinking slider
  const open = ease(t, A12T.chip + DL, A12T.chip + DL + .15) * (1 - ease(t, A12T.release + DL, A12T.release + DL + .12));
  if (open > 0) {
    c.save();
    const m = IX.menu(c, MENU.x, MENU.y, [{label: 'GPT-6', check: true}, {label: 'GPT-5.6 Sol'}], {open, w: MENU.w, extraH: 186});
    c.globalAlpha *= clamp(open * 1.5);
    c.fillStyle = P.line2; c.fillRect(MENU.x + 16, MENU.y + 128, MENU.w - 32, 1);
    txt(c, 'Thinking', MENU.x + 24, MENU.y + 166, {font: F.ui(600, 19), color: P.text});
    txt(c, LV[lv], MENU.x + MENU.w - 24, MENU.y + 166, {font: F.ui(600, 19), color: P.lav, align: 'right'});
    const grab = s.dragId === 'thinking' ? 1 : IX.press(s, 'thinking');
    const v = s.dragId === 'thinking' ? clamp((s.x - SLX) / (SLW / 4), 0, 4) : (t >= A12T.release ? 4 : 0);
    const flash = {}; A12T.snaps.forEach((sn, i) => flash[i + 1] = sn + DL);
    IX.slider(c, SLX, SLY, SLW, LV, v, {t, grab, knobHover: IX.hover(s, {x: SLX - 18, y: SLY - 18, w: 36, h: 36}), flash});
    if (LV_DESC[lv]) txt(c, LV_DESC[lv], MENU.x + 24, MENU.y + 278, {font: F.ui(400, 15), color: P.sub});
    c.restore();
  }
  IX.cursor(c, s);
  c.restore();
  if (stopped) K.keyword(c, 'LIMIT', 450, 190, t, A12_STOP, {size: 150});
  if (t >= A12_STOP && t < A12_STOP + .05) fx.flash = .3;
  IX.caption(c, s, {y: H - 82});
  fx.chroma = 1.5 * K.kick(t);
  K.band(c, t);
}};

// ================================================================== B10 + B11  (one continuous take: Kai's browser)
const BW = {x: 830, y: 56, w: 1040, h: 800};
const TAB0 = {x: 842, y: 66, w: 280, h: 50}, TAB1 = {x: 1128, y: 66, w: 280, h: 50};
const PLUS0 = {x: 1134, y: 72, w: 40, h: 40};
const CMPB = {x: 880, y: 760, w: 940, h: 64};
const SWB = {x: 1600, y: 196, w: 236, h: 50};
const BT = {enter: 91.650, plus: 93.483, tabs: [[95.317, 0], [95.783, 1], [96.150, 0], [96.567, 1], [98.783, 0]], hoverArrive: 97.45};
const PROMPT = 'plan my day, hour by hour';
const BK = IX.take({start: [1700, 700], seed: 10}, [
  {move: [1640, 800], arrive: 90.7, dur: .3},
  {type: PROMPT, into: 'composer', at: 89.575, cps: 19, typos: [9], cap: 'type · ' + PROMPT},
  {key: 'Enter', at: BT.enter, cap: 'key · ⏎ Enter'},
  {move: [1500, 470], arrive: 92.45, dur: .5},
  {hes: PLUS0, arrive: BT.plus - 2 / 60},
  {click: 'plus', press: BT.plus, cap: 'click · New tab'},
  ...BT.tabs.slice(0, 4).map(([T, i]) => ({click: 'tab' + i, to: [(i ? TAB1 : TAB0).x + 130 + (i ? 10 : -10), 90], press: T, dur: .26, cap: 'click · ' + (i ? 'Claude' : 'ChatGPT') + ' tab'})),
  {hes: [SWB.x + 150, SWB.y + 28], arrive: BT.hoverArrive, gap: 190, dur: .3},
  {hover: 'switch', at: BT.hoverArrive, cap: 'hover · Switch to Claude'},
  {click: 'tab0', to: [TAB0.x + 120, 90], press: BT.tabs[4][0], dur: .42, cap: 'click · ChatGPT tab'},
]);
// typing must finish before Enter
const typedEnd = BK.typing.composer[BK.typing.composer.length - 1].t;
if (typedEnd > BT.enter - .03) throw new Error('B10 typing ends too late: ' + typedEnd);
const NEWTAB = BT.plus + DL;
function activeTab(t) { if (t < NEWTAB) return 0; let a = 1; for (const [T, i] of BT.tabs) if (t >= T + DL) a = i; return a; }
// hover on "Switch to Claude": enter / exit times (from the geometric path)
const HOV = (() => { let tin = null, tout = null; for (let x = 96.6; x < 98.93; x += 1 / 240) { const inn = IX.inRect(IX.posAt(BK, x).p, SWB); if (inn && tin == null) tin = x; if (!inn && tin != null && tout == null) tout = x; } return {tin, tout}; })();
// clock: 9:00 AM → noon on "PM" → night
function clockMin(t) {
  const T0 = BT.enter + DL;
  if (t < T0) return 540;
  if (t < 94.45) return 540 + 180 * E.inQ(seg(t, T0, 94.45));
  if (t < 95.28) return 720 + 390 * seg(t, 94.45, 95.28);
  return 1110 + 328 * seg(t, 95.28, 98.93);
}
function clockStr(m) { m = Math.floor(m); const h = Math.floor(m / 60) % 24, mm = m % 60; let h12 = h % 12; if (!h12) h12 = 12; return [h12 + ':' + String(mm).padStart(2, '0'), h >= 12 ? 'PM' : 'AM']; }
function drawClock(c, x, y, m, t) {
  fillRR(c, x, y, 350, 140, 24, 'rgba(12,9,15,.78)', 'rgba(255,255,255,.12)', 1.5);
  const cx = x + 72, cy = y + 70, r = 48;
  c.save(); c.strokeStyle = P.cream; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.beginPath(); c.moveTo(cx + Math.cos(a) * r * .82, cy + Math.sin(a) * r * .82); c.lineTo(cx + Math.cos(a) * r * .94, cy + Math.sin(a) * r * .94); c.stroke(); }
  const ah = (m / 720) * Math.PI * 2 - Math.PI / 2, am = (m / 60) * Math.PI * 2 - Math.PI / 2;
  c.lineCap = 'round'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ah) * r * .5, cy + Math.sin(ah) * r * .5); c.stroke();
  c.strokeStyle = P.lav; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(am) * r * .82, cy + Math.sin(am) * r * .82); c.stroke(); c.restore();
  const [hm, ap] = clockStr(m);
  txt(c, hm, x + 290, y + 88, {font: F.mono(700, 46), color: P.cream, align: 'right'});
  txt(c, ap, x + 298, y + 88, {font: F.mono(700, 28), color: ap === 'PM' ? P.lav : P.cream});
}
// her own reply, letters popping one by one (≈24 tok/s, exaggerated)
const HER_TXT = "Sure! Here's your day, hour by hour. 9:00 AM — wake up gently, stretch, and";
const HER_T0 = BT.enter + .32;
const herCharT = i => HER_T0 + i * .155 + .05 * noise1(i * 1.7);
const herN = t => { let n = 0; while (n < HER_TXT.length && herCharT(n) <= t) n++; return n; };
const CL_TXT = "You're absolutely right to want a plan! Here's your day: 9:00 AM — Wake up, water, ten minutes of stretching. 9:30 AM — Deep work: the hardest task first, phone in another room. 11:00 AM — Short walk outside. 11:15 AM — Batch your emails and messages. 12:30 PM — Lunch away from the desk. 1:30 PM — Meetings and calls, grouped together. 3:00 PM — Second deep-work block. 4:30 PM — Admin, errands, tidy up. 5:30 PM — Gym or a long walk. 6:30 PM — Dinner with someone you like. 8:00 PM — Read, unwind, no screens. 10:30 PM — Lights out. Want me to turn this into a calendar? I can also make a printable version, a weekly template, a habit tracker, and";
function poseB(t) {
  // every change = Kai action + DL
  const ev = [[BT.enter + DL, 'think'], [NEWTAB, 'glass']];
  for (const [T, i] of BT.tabs.slice(0, 4)) ev.push([T + DL, i === 0 ? 'happy' : 'think']);
  if (HOV.tin) ev.push([HOV.tin + DL, 'look']);
  if (HOV.tout) ev.push([HOV.tout + DL, 'relief']);
  ev.push([BT.tabs[4][0] + DL, 'happy2']);
  let cur = ['happy', null]; for (const e of ev) if (t >= e[0]) cur = [e[1], e[0]];
  return cur;
}

function drawB(c, t, fx, shot) {
  const s = IX.at(BK, t), m = clockMin(t), day = clamp((m - 540) / 900), at = activeTab(t);
  // background: paper, light shifts day → dusk with the clock
  plate(c, mix('#2a2030', '#17111f', day), 21);
  C.radial(c, 430, 560, 760, mix('#F5E9D6', '#7D63B4', day), .28);
  camPush(c, t, shot.a, shot.b, {x: 1000, y: 520, z0: 1, z1: 1.03});
  // --- her
  const [pose, tr] = poseB(t);
  const look = pose === 'look';
  const name = pose === 'look' ? 'glass' : pose === 'relief' || pose === 'happy2' ? 'happy' : pose;
  fig(c, name, t, {x: 420 + (look ? 40 : 0), y: 610, h: 840, tr, flip: look, rot: look ? .04 : 0, pal: A.inkMix('orig', 'off', Math.round(day * 7) / 20)});
  if (look) { const k = K.spring(t, tr, 16, .5); txt(c, '!?', 640, 260, {font: F.disp(800, 70), color: P.cream, alpha: clamp(k), stroke: P.plum, lw: 6}); }
  // letters she types float up from her (visible even when her tab is in the background)
  const n = herN(t);
  for (let i = Math.max(0, n - 10); i < n; i++) {
    const age = t - herCharT(i); if (age > 1.2 || HER_TXT[i] === ' ') continue;
    const sc = 1 + .8 * Math.exp(-age * 10);
    c.save(); c.globalAlpha = 1 - seg(age, .7, 1.2); c.translate(640 + (i % 4) * 22 + age * 60, 560 - age * 150); c.scale(sc, sc);
    txt(c, HER_TXT[i], 0, 0, {font: F.ui(700, 38), color: P.lav2, align: 'center', stroke: P.plum, lw: 5}); c.restore();
  }
  // nameplate + clock
  drawClock(c, 60, 52, m, t);
  fillRR(c, 440, 74, 320, 92, 20, 'rgba(12,9,15,.78)', 'rgba(255,255,255,.12)', 1.5);
  txt(c, 'her · GPT-6 Pro', 464, 108, {font: F.ui(600, 18), color: P.sub});
  IX.tokRate(c, 464, 150, t < HER_T0 ? 0 : 24, {size: 32, color: P.lav});
  // --- browser window
  windowBg(c, BW, {bg: at === 1 ? '#1d1714' : P.bg2});
  const tabs = [{title: 'ChatGPT', glyph: knotGlyph, active: at === 0, dot: at !== 0 && t > HER_T0, dotColor: P.lav}];
  if (t >= NEWTAB) tabs.push({title: 'Claude', glyph: (c2, x, y, sz) => claudeGlyph(c2, x, y, sz + 2, t * .5), active: at === 1, bg: '#1d1714'});
  IX.tabBar(c, BW.x, BW.y, BW.w, tabs, {t, hover: [IX.hover(s, TAB0), IX.hover(s, TAB1)], press: [IX.press(s, 'tab0'), IX.press(s, 'tab1')],
    plusHover: t < NEWTAB ? IX.hover(s, PLUS0) : 0, plusPress: IX.press(s, 'plus')});
  fillRR(c, BW.x + 20, BW.y + 82, BW.w - 40, 40, 20, 'rgba(255,255,255,.05)');
  txt(c, at === 1 ? 'claude.ai/new' : 'chatgpt.com/c/plan-my-day', BW.x + 46, BW.y + 109, {font: F.ui(400, 17), color: P.sub});
  c.save(); rr(c, BW.x, BW.y + 130, BW.w, BW.h - 130, 0); c.clip();
  if (at === 0) drawGptTab(c, t, s); else drawClaudeTab(c, t, s);
  c.restore();
  // keycap for Enter
  IX.keycap(c, '⏎', CMPB.x + CMPB.w - 150, CMPB.y - 50, t, BT.enter);
  IX.cursor(c, s);
  c.restore();
  // flash on tab swaps
  for (const T of [NEWTAB, ...BT.tabs.map(x => x[0] + DL)]) if (t >= T && t < T + .04) fx.flash = .18, fx.flashColor = at === 1 ? ORANGE2 : P.lav2;
  IX.caption(c, s, {y: H - 82});
  fx.chroma = 1.5 * K.kick(t);
  K.band(c, t);
}
function drawGptTab(c, t, s) {
  const sent = t >= BT.enter + DL, x0 = BW.x + 70, top = BW.y + 160;
  if (sent) userBubble(c, BW.x + BW.w - 50, top, PROMPT);
  if (sent) {
    U.knot(c, x0 + 6, top + 112, 14, {color: P.text, lw: 2, rot: t * 1.2});
    if (t < HER_T0) K.thinking(c, x0 + 36, top + 120, t, {font: F.ui(500, 22)});
    else {
      const n = herN(t), shown = HER_TXT.slice(0, n), f = F.ui(400, 28);
      const lines = L.wrapLines(c, shown, f, 820);
      lines.forEach((l, i) => txt(c, l, x0 + 36, top + 122 + i * 44, {font: f, color: P.text}));
      // newest letter pops
      const lastL = lines[lines.length - 1] || '', age = n ? t - herCharT(n - 1) : 9;
      if (n && age < .3) { const ch = HER_TXT[n - 1], wpre = measure(c, lastL.slice(0, -1), f), sc = 1 + 1.2 * Math.exp(-age * 14); c.save(); c.translate(x0 + 36 + wpre + measure(c, ch, f) / 2, top + 122 + (lines.length - 1) * 44 - 10); c.scale(sc, sc); c.fillStyle = 'rgba(185,163,218,.35)'; c.beginPath(); c.arc(0, 0, 18, 0, 7); c.fill(); c.restore(); }
      c.fillStyle = P.text; c.beginPath(); c.arc(x0 + 50 + measure(c, lastL, f), top + 110 + (lines.length - 1) * 44, 8, 0, 7); c.fill();
      fillRR(c, x0 + 36, top + 150 + lines.length * 44, 170, 38, 19, 'rgba(255,255,255,.05)', P.line2, 1.2);
      IX.tokRate(c, x0 + 56, top + 177 + lines.length * 44, 24, {size: 22, color: P.lav});
    }
  }
  // composer
  fillRR(c, CMPB.x, CMPB.y, CMPB.w, CMPB.h, 32, P.panel2, P.line2, 1.5);
  U.icon(c, 'plus', CMPB.x + 32, CMPB.y + 32, 9, P.sub);
  const ct = sent ? '' : s.text.composer || '';
  if (ct) txt(c, ct, CMPB.x + 62, CMPB.y + 41, {font: F.ui(400, 22), color: P.text}); else txt(c, 'Ask anything', CMPB.x + 62, CMPB.y + 41, {font: F.ui(400, 22), color: P.dim});
  if (!sent && s.caretOn) c.fillStyle = P.text, c.fillRect(CMPB.x + 64 + (ct ? measure(c, ct, F.ui(400, 22)) : 0), CMPB.y + 17, 2, 30);
  fillRR(c, CMPB.x + CMPB.w - 290, CMPB.y + 13, 182, 38, 19, 'rgba(255,255,255,.05)', P.line2, 1);
  txt(c, 'GPT-6 · Pro', CMPB.x + CMPB.w - 272, CMPB.y + 39, {font: F.ui(600, 17), color: P.text});
  U.icon(c, 'chev', CMPB.x + CMPB.w - 128, CMPB.y + 32, 7, P.sub);
  c.fillStyle = sent ? P.text : ct ? P.text : P.faint; c.beginPath(); c.arc(CMPB.x + CMPB.w - 40, CMPB.y + 32, 21, 0, 7); c.fill();
  U.icon(c, sent ? 'stop' : 'up', CMPB.x + CMPB.w - 40, CMPB.y + 32, 12, P.bg);
}
function drawClaudeTab(c, t, s) {
  const x0 = BW.x + 50, top = BW.y + 150;
  claudeGlyph(c, x0 + 22, top + 46, 22, t * .8);
  txt(c, 'Claude', x0 + 56, top + 58, {font: F.serif(38), color: '#f3e6dc'});
  // "Switch to Claude" CTA (hover → she turns to look)
  const hv = IX.hover(s, SWB);
  IX.button(c, SWB, 'Switch to Claude', {hover: hv, bg: ORANGE, variant: 'pill', color: '#1d1714', size: 19, border: hv > .5 ? '#fff' : null});
  if (hv > 0) IX.tooltip(c, SWB.x + SWB.w / 2, SWB.y - 6, 'Import your chats & memory', hv * clamp((t - BT.hoverArrive - .35) / .12));
  // flood text since the tab opened, ≈103 tok/s (exaggerated), scrolls
  const opened = NEWTAB, n = Math.floor(clamp(t - opened - .12, 0, 99) * 210);
  const f = F.ui(400, 23), lh = 36, lines = L.wrapLines(c, CL_TXT.slice(0, Math.min(CL_TXT.length, n)), f, 900);
  const maxL = 12, from = Math.max(0, lines.length - maxL);
  lines.slice(from).forEach((l, i) => txt(c, l, x0 + 20, top + 128 + i * lh, {font: f, color: '#eadfd6'}));
  if (n < CL_TXT.length) { const ll = lines[lines.length - 1] || ''; c.fillStyle = ORANGE; c.beginPath(); c.arc(x0 + 34 + measure(c, ll, f), top + 120 + (lines.length - 1 - from) * lh, 7, 0, 7); c.fill(); }
  fillRR(c, x0 + 20, BW.y + BW.h - 66, 200, 44, 22, 'rgba(224,122,79,.14)', 'rgba(224,122,79,.6)', 1.2);
  IX.tokRate(c, x0 + 42, BW.y + BW.h - 34, 103, {size: 26, color: ORANGE2});
}
const B10 = {id: 'B10', a: 91.44, b: 95.28, tin: {type: 'cut'}, draw(c, t, fx) { drawB(c, t, fx, this); }};
const B11 = {id: 'B11', a: 95.28, b: 98.93, tin: {type: 'cut'}, draw(c, t, fx) { drawB(c, t, fx, this); }};

// ================================================================== C5 + C6  Ein, dos … — Tibo's global RESET
const CT = [158.85, 159.217, 159.633, 160.05, 160.433, 160.90];
const COUNT_W = ['Ein', 'dos', 'Trios', 'ne', 'Fem', 'liu'];
const FINAL = 161.333, REFILL = FINAL + DL;
const RB = {x: 1170, y: 500, r: 190};
const TK = IX.take({start: [1960, 260], seed: 5}, [
  ...CT.map((T, i) => ({click: 'reset', to: [RB.x + 14 * Math.sin(i * 2.1), RB.y - 20 + 16 * Math.cos(i * 1.7)], press: T, dur: i ? .2 : .45, overshoot: 2, cap: `click · RESET  ${i + 1}/6`})),
  {click: 'reset', to: [RB.x - 6, RB.y - 10], press: FINAL, hold: .16, dur: .26, cap: 'click · RESET · all accounts'},
]);
const C5draw = function (c, t, fx) {
  const s = IX.at(TK, t), n = Math.min(6, IX.count(s, 'reset')), back = t >= REFILL;
  plate(c, back ? K.ST.warm.paper : '#1a070b', 41);
  // meme ticker behind: it's so over → we're so back
  for (let k = 0; k < 8; k++) txt(c, (back ? "WE'RE SO BACK   " : "IT'S SO OVER   ").repeat(6), -300 + ((t * 260 + k * 190) % 520) * (k % 2 ? -1 : 1), 120 + k * 128, {font: F.disp(800, 40), color: back ? 'rgba(185,163,218,.13)' : 'rgba(255,77,109,.1)'});
  camPush(c, t, 158.79, 162.23, {x: 960, y: 540, z0: 1, z1: 1.05, sh: 6});
  // her
  const lastPress = lastBefore(CT.map(x => x + DL), t);
  fig(c, back ? 'happy' : 'knees', t, {x: 360, y: 640, h: 800, pal: back ? 'bright' : 'off', tr: back ? REFILL : lastPress, shadow: back ? 30 : 0, shadowColor: P.lav});
  // quota bar
  const q = back ? E.outC(seg(t, REFILL, REFILL + .28)) : 0;
  fillRR(c, 720, 70, 980, 140, 24, 'rgba(12,9,15,.8)', back ? P.lav : 'rgba(255,77,109,.5)', 1.5);
  IX.quota(c, 760, 128, 900, q, {lsize: 20, h: 16, subSize: 19, color: P.lav, low: P.red, sub: back ? 'Usage limits reset · May the tokens flow again.' : 'Can Support reset my usage limits? No.'});
  // RESET button (moves aside after the global reset)
  const pr = IX.press(s, 'reset'), mv = back ? E.ioC(seg(t, REFILL + .1, REFILL + .45)) : 0;
  const bx = RB.x, by = lerp(RB.y, 640, mv), bs = lerp(1, .62, mv);
  c.save(); c.translate(bx, by); c.scale(bs, bs);
  c.fillStyle = '#5a0d1c'; c.beginPath(); c.ellipse(0, 26, RB.r + 22, RB.r + 10, 0, 0, 7); c.fill();
  c.translate(0, 18 * pr);
  const g = c.createRadialGradient(-50, -70, 20, 0, 0, RB.r); g.addColorStop(0, '#ff8fa3'); g.addColorStop(.55, pr > .3 ? '#d62d4b' : '#ff4d6d'); g.addColorStop(1, '#a3152f');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, RB.r, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, RB.r - 14, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
  txt(c, 'RESET', 0, 26, {font: F.disp(800, 76), color: '#fff', align: 'center', stroke: '#7a0f22', lw: 6});
  c.restore();
  // shock rings at each press result
  for (const T of [...CT, FINAL]) { const a = t - (T + DL); if (a >= 0 && a < .5) { c.save(); c.strokeStyle = T === FINAL ? '#fff' : P.red2; c.globalAlpha = 1 - a / .5; c.lineWidth = 6; c.beginPath(); c.arc(bx, by, RB.r * bs + 20 + a * 260, 0, 7); c.stroke(); c.restore(); } }
  // counter 1–6
  if (n > 0 && !back) {
    const tr = CT[n - 1] + DL, k = K.spring(t, tr, 18, .5);
    c.save(); c.translate(1640, 560); c.scale(lerp(1.5, 1, clamp(k)), lerp(1.5, 1, clamp(k)));
    txt(c, String(n), 8, 8, {font: F.disp(800, 240), color: '#7a0f22', align: 'center'});
    txt(c, String(n), 0, 0, {font: F.disp(800, 240), color: P.cream, align: 'center'});
    c.restore();
    txt(c, '/6', 1760, 560, {font: F.mono(700, 44), color: P.red2});
    txt(c, COUNT_W[n - 1], 1640, 650, {font: F.serif(64, true), color: P.red2, align: 'center', alpha: clamp(k)});
  }
  // Tibo's post (real tweet, 2026-07-18)
  const pa = K.spring(t, CT[1] + .1, 12, .6);
  if (t > CT[1] + .1 && !back) {
    c.save(); c.globalAlpha = clamp(pa); c.translate(0, (1 - clamp(pa)) * -30);
    fillRR(c, 60, 60, 600, 140, 20, 'rgba(12,9,15,.88)', 'rgba(255,255,255,.18)', 1.5);
    fillRR(c, 84, 84, 50, 50, 25, P.red); txt(c, 't', 109, 118, {font: F.ui(800, 26), color: '#fff', align: 'center'});
    txt(c, 'Tibo', 150, 104, {font: F.ui(700, 20), color: P.text}); txt(c, '@thsottiaux', 204, 104, {font: F.ui(400, 18), color: P.dim});
    txt(c, 'Oops... I did it again.', 150, 160, {font: F.ui(600, 32), color: P.text});
    c.restore();
  }
  // Kai is away: dashed ghost cursor parked by her
  c.save(); c.globalAlpha = back ? .7 : .5; K.pointer(c, 700, 740, 1.8, {outline: true, dash: true, color: P.cream});
  fillRR(c, 728, 800, 104, 28, 9, null, P.cream, 1.5); txt(c, 'Kai · away', 738, 820, {font: F.ui(600, 16), color: P.cream}); c.restore();
  IX.cursor(c, s, {who: 'tibo'});
  c.restore();
  if (back) K.keyword(c, "WE'RE SO BACK", W / 2 + 120, 400, t, REFILL + .05, {size: 130, cols: [P.cream, P.lav, P.plum], stagger: .008});
  // flashes
  if (back) fx.flash = Math.max(fx.flash || 0, .95 * Math.exp(-(t - REFILL) * 7)), fx.flashColor = '#fff';
  else { const lp = lastPress; if (lp != null && t - lp < .05) fx.flash = .22, fx.flashColor = P.red2; }
  if (lastPress != null && t - lastPress < .067 && !back) fx.tear = 18;
  IX.caption(c, s, {y: H - 82, who: 'tibo'});
  fx.chroma = 1.2 * K.kick(t, 10);
  K.band(c, t);
};
const C5 = {id: 'C5', a: 158.79, b: 161.31, tin: {type: 'cut'}, draw: C5draw};
const C6 = {id: 'C6', a: 161.31, b: 162.23, tin: {type: 'cut'}, draw: C5draw};

module.exports = [];
module.exports.V4 = [A12, B10, B11, C5, C6];
module.exports.SEGMENTS = [[40.36, 44.04], [91.44, 98.93], [158.79, 162.23]];
module.exports._dbg = {HOV, typedEnd};
