// ix.js — interaction toolkit for v4 (research/ui.md §B/§D).
// Everything is a pure function of t: a "take" is a pre-declared action script, IX.at(take, t) answers
// "where is the cursor, is it pressed, what is it hovering, what has been typed, which events have fired".
// Causality rule: UI/character changes fire IX.DL (80 ms) after the Kai action (press frame on the beat).
const L = require('./lib');
const K = require('./kit');
const {F, W, H, P, clamp, lerp, seg, E, ease, noise1, hash, txt, measure, fillRR, rr} = L;

const DL = 0.08;                                    // causal delay (60–120 ms window)
const mj = u => { u = clamp(u); return u * u * u * (10 - 15 * u + 6 * u * u); };   // minimum-jerk
const fitts = (D, Wt) => clamp(.10 + .13 * Math.log2(D / Math.max(Wt || 30, 8) + 1), .22, .9);
const cubic = (p0, p1, p2, p3, u) => { const v = 1 - u; return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]; };
const ptOf = (to) => Array.isArray(to) ? to : [to.x + to.w / 2, to.y + to.h / 2];
const inRect = (p, r) => r && p[0] >= r.x && p[0] <= r.x + r.w && p[1] >= r.y && p[1] <= r.y + r.h;

// ---------------------------------------------------------------- beat helpers
function snapBeat(t, sub = 1) { const bi = L.beatInfo(t); if (bi.i < 0) return t; const t0 = L.BEATS[bi.i], t1 = L.BEATS[bi.i + 1] || t0 + .4615; const step = (t1 - t0) / sub; const k = Math.round((t - t0) / step); return t0 + k * step; }
function snapKick(t, win = .12) { let best = t, bd = win; for (const k of K.KICKS) { const d = Math.abs(k - t); if (d < bd) { bd = d; best = k; } } return best; }

// ---------------------------------------------------------------- take compiler
// opts: {start:[x,y], seed}
// acts (in order; each may give `at`, moves may give `arrive`, clicks `press`):
//   {move: [x,y]|rect, arrive?, at?, dur?, arc?, overshoot?, cap?}
//   {hes: [x,y]|rect, arrive, approaches?}            hesitant approach (stops short, creeps in)
//   {click: id, to?: [x,y]|rect, press: T, hold?, cap?}   moves there first (arriving 2 frames early) if `to`
//   {drag: id, press: T0, stops: [[x,y]...], times: [...], release: T1, cap?}
//   {type: 'text', into: id, at, cps?, typos?: [charIndex...], cap?}
//   {key: 'Enter', at, cap?}
//   {hover: id, at, cap?}   (caption-only marker; hover itself is geometric)
//   {wait: seconds}
function take(opts, acts) {
  const tk = {segs: [], ev: [], typing: {}, caps: [], start: opts.start || [W / 2, H / 2], seed: opts.seed || 1, hidden: opts.hidden || []};
  let tc = opts.t0 || 0, pc = tk.start.slice(), si = 0;
  const addMove = (to, t1, o = {}) => {
    const p1 = ptOf(to), D = Math.hypot(p1[0] - pc[0], p1[1] - pc[1]);
    if (D < .5) return;
    const dur = o.dur || fitts(D, Array.isArray(to) ? 30 : to.w);
    const t0 = t1 - dur, R = hash(tk.seed * 31 + (si++) * 7.13);
    const arc = (o.arc == null ? .06 + .09 * R : o.arc) * (R > .5 ? 1 : -1);
    const dx = p1[0] - pc[0], dy = p1[1] - pc[1], nx = -dy * arc, ny = dx * arc;
    const c1 = [pc[0] + dx * .3 + nx, pc[1] + dy * .3 + ny], c2 = [pc[0] + dx * .75 + nx * .6, pc[1] + dy * .75 + ny * .6];
    const os = o.overshoot == null ? (D > 260 ? 6 : 3) : o.overshoot;
    tk.segs.push({t0, t1, p0: pc.slice(), p1, c1, c2, os, dir: [dx / D, dy / D]});
    pc = p1.slice(); tc = t1;
  };
  for (const a of acts) {
    if (a.wait != null) { tc += a.wait; continue; }
    if (a.note) { tk.caps.push({t0: a.at, text: a.note, hold: a.hold}); continue; }   // caption-only marker
    if (a.move) {
      const to = a.move, D = Math.hypot(ptOf(to)[0] - pc[0], ptOf(to)[1] - pc[1]);
      const dur = a.dur || fitts(D, Array.isArray(to) ? 30 : to.w);
      const t1 = a.arrive != null ? a.arrive : (a.at != null ? a.at : tc) + dur;
      addMove(to, t1, Object.assign({}, a, {dur}));
      if (a.cap) tk.caps.push({t0: t1 - dur, text: a.cap});
      continue;
    }
    if (a.hes) {
      const p = ptOf(a.hes), d = [p[0] - pc[0], p[1] - pc[1]], D = Math.hypot(...d) || 1, u = [d[0] / D, d[1] / D];
      const gp = a.gap || 34, short = [p[0] - u[0] * gp, p[1] - u[1] * gp], half = [p[0] - u[0] * gp * .45, p[1] - u[1] * gp * .45];
      addMove(short, a.arrive - .45, {dur: a.dur || .32}); addMove(half, a.arrive - .2, {dur: .16, overshoot: 0}); addMove(p, a.arrive, {dur: .14, overshoot: 0});
      if (a.cap) tk.caps.push({t0: a.arrive - .3, text: a.cap});
      continue;
    }
    if (a.click != null) {
      const T = a.press != null ? a.press : tc;
      if (a.to) addMove(a.to, T - 2 / 60, a);
      const hold = a.hold || .09;
      tk.ev.push({type: 'click', id: a.click, t0: T, t1: T + hold, p: pc.slice()});
      if (a.cap) tk.caps.push({t0: T, text: a.cap});
      tc = T + hold; continue;
    }
    if (a.drag != null) {
      const T0 = a.press; if (a.to) addMove(a.to, T0 - 2 / 60, a);
      tk.ev.push({type: 'down', id: a.drag, t0: T0, t1: a.release, p: pc.slice()});
      a.stops.forEach((s, i) => { const prevT = i ? a.times[i - 1] : T0; addMove(s, a.times[i], {dur: Math.min(.3, (a.times[i] - prevT) * .78), overshoot: 0, arc: .02}); tk.ev.push({type: 'snap', id: a.drag, k: i, t0: a.times[i], p: s.slice()}); });
      if (a.cap) tk.caps.push({t0: a.capAt || a.times[a.times.length - 1], text: a.cap});
      tc = a.release; continue;
    }
    if (a.type != null) {
      const s = a.type, cps = a.cps || 10, typos = a.typos || []; let tt = a.at != null ? a.at : tc, cur = '', out = [];
      [...s].forEach((ch, i) => {
        if (typos.includes(i)) { const wrong = String.fromCharCode(97 + Math.floor(hash(i + tk.seed) * 26)); tt += .07; out.push({t: tt, s: cur + wrong}); tt += .22; out.push({t: tt, s: cur}); tt += .05; }
        const gap = (1 / cps) * (0.65 + .7 * hash(i * 3.7 + tk.seed)) + (/[ ,.]/.test(s[i - 1] || '') ? .06 : 0);
        tt += gap; cur += ch; out.push({t: tt, s: cur});
      });
      tk.typing[a.into] = (tk.typing[a.into] || []).concat(out);
      if (a.cap) tk.caps.push({t0: a.at != null ? a.at : tc, text: a.cap});
      tc = tt; continue;
    }
    if (a.key) { const T = a.at != null ? a.at : tc; tk.ev.push({type: 'key', id: a.key, t0: T, t1: T + .08, p: pc.slice()}); if (a.cap) tk.caps.push({t0: T, text: a.cap}); tc = T + .08; continue; }
    if (a.hover) { const T = a.at != null ? a.at : tc; tk.ev.push({type: 'hover', id: a.hover, t0: T, t1: T}); if (a.cap) tk.caps.push({t0: T, text: a.cap}); continue; }
  }
  tk.segs.sort((a, b) => a.t0 - b.t0); tk.ev.sort((a, b) => a.t0 - b.t0); tk.caps.sort((a, b) => a.t0 - b.t0);
  return tk;
}

// raw cursor position (no jitter) + moving flag
function posAt(tk, t) {
  let s = null; for (const g of tk.segs) { if (g.t0 <= t) s = g; else break; }
  if (!s) return {p: tk.start.slice(), mv: 0};
  if (t >= s.t1) return {p: s.p1.slice(), mv: 0};
  const u = (t - s.t0) / (s.t1 - s.t0), e = mj(u);
  const b = cubic(s.p0, s.c1, s.c2, s.p1, e);
  const ov = s.os * Math.sin(Math.PI * seg(u, .6, 1)) * (1 - seg(u, .6, 1) * .2);   // overshoot past target then settle
  return {p: [b[0] + s.dir[0] * ov, b[1] + s.dir[1] * ov], mv: 1};
}
function pos(tk, t) {
  const r = posAt(tk, t);
  const still = 1 - r.mv, j = 1.1 * still;   // hand tremor only at rest
  return [r.p[0] + (noise1(t * .7 + tk.seed * 13) - .5) * 2 * j, r.p[1] + (noise1(t * .7 + tk.seed * 13 + 77) - .5) * 2 * j];
}
function pressAmt(e, t) { if (t < e.t0 - .001) return 0; if (t <= e.t1) return clamp((t - e.t0) / .035 + .3); return clamp(1 - (t - e.t1) / .1); }

// ---------------------------------------------------------------- per-frame query
function at(tk, t) {
  const p = pos(tk, t); let down = 0, dragId = null;
  const events = tk.ev.filter(e => e.t0 <= t + 1e-6);
  for (const e of tk.ev) { if (e.type === 'click' || e.type === 'down' || e.type === 'key') { if (e.type !== 'key') down = Math.max(down, pressAmt(e, t)); if (e.type === 'down' && t >= e.t0 && t <= e.t1) dragId = e.id; } }
  const text = {}; let lastKey = -9;
  for (const id in tk.typing) { let s = ''; for (const k of tk.typing[id]) { if (k.t <= t) { s = k.s; lastKey = Math.max(lastKey, k.t); } else break; } text[id] = s; }
  const caretOn = (t - lastKey) < .5 || ((t - lastKey) % 1.06) < .53;
  let cap = null; for (const c of tk.caps) if (c.t0 <= t) cap = c;
  if (cap && t - cap.t0 > (cap.hold || 1.5)) cap = null;
  return {t, x: p[0], y: p[1], down, dragId, text, caretOn, events, cap, tk};
}
// how long the cursor has been inside / outside a rect (pure, samples back in 1/60 steps up to 1 s)
function dwell(tk, r, t) {
  const inside = inRect(posAt(tk, t).p, r); let k = 1;
  for (; k <= 60; k++) if (inRect(posAt(tk, t - k / 60).p, r) !== inside) break;
  return {inside, since: k / 60, ever: k <= 60 || inside};
}
// hover amount 0..1 with 0.12 s fade in/out
function hover(s, r, fade = .12) { const d = dwell(s.tk, r, s.t); return d.inside ? clamp(d.since / fade) : (d.ever ? clamp(1 - d.since / fade) : 0); }
// press amount on a given id
function press(s, id) { let m = 0; for (const e of s.tk.ev) if (e.id === id && (e.type === 'click' || e.type === 'down')) m = Math.max(m, pressAmt(e, s.t)); return m; }
// time the result of the latest action on `id` becomes visible (press + DL), or null
function after(s, id, delay = DL) { let r = null; for (const e of s.tk.ev) if (e.id === id && e.type !== 'snap' && e.t0 + delay <= s.t) r = e.t0 + delay; return r; }
function count(s, id, delay = DL, type) { let n = 0; for (const e of s.tk.ev) if (e.id === id && (!type || e.type === type) && e.t0 + delay <= s.t) n++; return n; }
// discrete slider snaps: returns {k, tk (time of snap+DL)} of the latest snap on id
function snapped(s, id, delay = DL) { let r = {k: -1, t0: null}; for (const e of s.tk.ev) if (e.id === id && e.type === 'snap' && e.t0 + delay <= s.t) r = {k: e.k, t0: e.t0 + delay}; return r; }

// ---------------------------------------------------------------- drawing: cursor
function arrowPath(c) { c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 26); c.lineTo(7, 20); c.lineTo(12, 31); c.lineTo(16, 29); c.lineTo(11, 18); c.lineTo(20, 18); c.closePath(); }
const CUR = {
  kai: {fill: P.cream, line: '#1a1320', label: 'Kai', labBg: P.cream, labFg: P.plum, ring: P.cream},
  tibo: {fill: '#ffffff', line: '#2B1218', label: 'tibo', labBg: '#ff4d6d', labFg: '#ffffff', ring: '#ffffff'},
};
function cursor(c, s, o = {}) {
  const st = Object.assign({}, CUR[o.who || 'kai'], o.style || {}), sc = (o.scale || 1.5);
  // ripples from clicks
  for (const e of s.tk.ev) if ((e.type === 'click' || e.type === 'down') && s.t >= e.t0 && s.t < e.t0 + .45) {
    const p = (s.t - e.t0) / .45; c.save(); c.strokeStyle = st.ring; c.globalAlpha = (1 - p) * .9; c.lineWidth = 3.5; c.beginPath(); c.arc(e.p[0], e.p[1], 10 + E.outC(p) * 56, 0, 7); c.stroke();
    c.globalAlpha = (1 - p) * .35; c.beginPath(); c.arc(e.p[0], e.p[1], 6 + E.outC(p) * 30, 0, 7); c.stroke(); c.restore();
  }
  const sq = 1 - .14 * s.down;
  c.save(); c.globalAlpha *= o.a == null ? 1 : o.a; c.translate(s.x, s.y);
  // label pill
  const lf = F.ui(700, 17), lw = measure(c, st.label, lf) + 20;
  c.save(); c.translate(18 * sc, 30 * sc); fillRR(c, 0, 0, lw, 28, 9, st.labBg, st.line, 1.5); txt(c, st.label, 10, 20, {font: lf, color: st.labFg}); c.restore();
  c.scale(sc * sq, sc * (1 - .08 * s.down));
  c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
  arrowPath(c); c.fillStyle = st.fill; c.fill(); c.shadowColor = 'transparent';
  c.strokeStyle = st.line; c.lineWidth = 1.6 / sc; c.lineJoin = 'round'; c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- drawing: widgets
// generic button; o: {hover, press, variant:'ghost'|'primary'|'danger'|'pill', font, color, r, icon}
function button(c, r, label, o = {}) {
  const hv = o.hover || 0, pr = o.press || 0, s = 1 - .04 * pr;
  c.save(); c.translate(r.x + r.w / 2, r.y + r.h / 2); c.scale(s, s); c.translate(-r.w / 2, -r.h / 2);
  const v = o.variant || 'ghost';
  const base = v === 'primary' ? (o.bg || P.text) : v === 'danger' ? '#d93a55' : (o.bg || P.panel2);
  fillRR(c, 0, 0, r.w, r.h, o.r == null ? r.h / 2 : o.r, base, o.border || (v === 'ghost' ? P.line2 : null), 1.5);
  if (hv > 0) { c.save(); c.globalAlpha = .1 * hv; fillRR(c, 0, 0, r.w, r.h, o.r == null ? r.h / 2 : o.r, '#fff'); c.restore(); }
  if (pr > 0) { c.save(); c.globalAlpha = .18 * pr; fillRR(c, 0, 0, r.w, r.h, o.r == null ? r.h / 2 : o.r, '#000'); c.restore(); }
  if (label) txt(c, label, r.w / 2, r.h / 2 + (o.size || 20) * .36, {font: o.font || F.ui(600, o.size || 20), color: o.color || (v === 'primary' ? P.bg : P.text), align: 'center'});
  c.restore();
}
function tooltip(c, x, y, text, a = 1) {
  if (a <= 0) return; const f = F.ui(500, 16), w = measure(c, text, f) + 22;
  c.save(); c.globalAlpha *= a; c.translate(0, (1 - a) * 4); fillRR(c, x - w / 2, y - 34, w, 30, 7, '#000'); txt(c, text, x, y - 13, {font: f, color: '#fff', align: 'center'}); c.restore();
}
// discrete slider. stops: labels; v: continuous index; o: {knobHover, grab, flashT, t, locked:[]}
function sliderX(x, w, n, i) { return x + w * i / (n - 1); }
function slider(c, x, y, w, stops, v, o = {}) {
  const n = stops.length, t = o.t || 0;
  fillRR(c, x, y - 3, w, 6, 3, P.line2);
  fillRR(c, x, y - 3, (w * v / (n - 1)), 6, 3, o.fill || P.lav);
  stops.forEach((s, i) => {
    const sx = sliderX(x, w, n, i), on = Math.round(v) === i, passed = v >= i - .01;
    const fl = o.flash && o.flash[i] != null ? Math.exp(-(t - o.flash[i]) * 9) * (t >= o.flash[i] ? 1 : 0) : 0;
    c.fillStyle = passed ? (o.fill || P.lav) : P.dim; c.beginPath(); c.arc(sx, y, 5 + 5 * fl, 0, 7); c.fill();
    if (fl > .02) { c.save(); c.globalAlpha = fl * .6; c.strokeStyle = P.lav2; c.lineWidth = 2; c.beginPath(); c.arc(sx, y, 10 + 18 * (1 - fl), 0, 7); c.stroke(); c.restore(); }
    txt(c, s, sx, y + 40, {font: F.ui(on ? 700 : 400, 17), color: on ? P.text : P.sub, align: i === 0 ? 'left' : i === n - 1 ? 'right' : 'center'});
  });
  const kx = sliderX(x, w, n, v), g = o.grab || 0, hv = o.knobHover || 0;
  if (g > 0 || hv > 0) { c.save(); c.globalAlpha = .25 * Math.max(g, hv); c.fillStyle = P.lav2; c.beginPath(); c.arc(kx, y, 26, 0, 7); c.fill(); c.restore(); }
  c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 8; c.fillStyle = '#fff'; c.beginPath(); c.arc(kx, y, 13 * (1 + .2 * g), 0, 7); c.fill(); c.restore();
  return {knob: [kx, y], stop: i => [sliderX(x, w, n, i), y]};
}
// dropdown/popover menu. items: [{label, sub, check, dim, badge}] ; o: {open 0..1, hi (row index), w, rowH}
function menu(c, x, y, items, o = {}) {
  const op = o.open == null ? 1 : o.open; if (op <= 0) return null;
  const w = o.w || 360, rh = o.rowH || 54, h = items.length * rh + 16 + (o.extraH || 0);
  c.save(); c.globalAlpha *= clamp(op * 1.5); c.translate(x, y + (o.up ? h : 0)); c.scale(lerp(.96, 1, op), lerp(.96, 1, op)); c.translate(0, o.up ? -h : 0);
  c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 30; c.shadowOffsetY = 8; fillRR(c, 0, 0, w, h, 16, '#2a2530'); c.shadowColor = 'transparent';
  fillRR(c, 0, 0, w, h, 16, null, P.line2, 1.5);
  items.forEach((it, i) => {
    const ry = 8 + i * rh;
    if (o.hi === i) fillRR(c, 8, ry + 2, w - 16, rh - 4, 10, 'rgba(255,255,255,.08)');
    txt(c, it.label, 24, ry + (it.sub ? rh * .46 : rh * .62), {font: F.ui(500, 19), color: it.dim ? P.dim : P.text});
    if (it.sub) txt(c, it.sub, 24, ry + rh * .82, {font: F.ui(400, 14), color: P.sub});
    if (it.badge) { const bw = measure(c, it.badge, F.ui(600, 13)) + 16; fillRR(c, w - 30 - bw, ry + rh / 2 - 12, bw, 24, 12, null, P.line2, 1.2); txt(c, it.badge, w - 30 - bw / 2, ry + rh / 2 + 5, {font: F.ui(600, 13), color: P.sub, align: 'center'}); }
    if (it.check) txt(c, '✓', w - 26, ry + rh * .62, {font: F.ui(700, 20), color: P.text, align: 'right'});
  });
  c.restore();
  return {x, y, w, h, row: i => ({x: x + 8, y: y + 8 + i * rh, w: w - 16, h: rh})};
}
// toggle switch with colour cross-fade; on 0..1, press stretches the knob
function toggle(c, x, y, on, o = {}) {
  const w = o.w || 60, h = o.h || 32, pr = o.press || 0;
  const col = require('./art').mixHex(o.off || '#4a4352', o.onCol || P.lav, clamp(on));
  fillRR(c, x, y, w, h, h / 2, col);
  const kw = (h - 8) * (1 + .18 * pr), kx = x + 4 + (w - 8 - kw) * clamp(on);
  fillRR(c, kx, y + 4, kw, h - 8, (h - 8) / 2, '#fff');
}
// browser tab bar. tabs: [{title, glyph:fn(c,x,y,s), active, dot}] ; o: {hover:[...0..1], press:[...]} → rects
function tabBar(c, x, y, w, tabs, o = {}) {
  const h = 54, tw = o.tabW || 280; const rects = [];
  fillRR(c, x, y, w, h + 14, 18, '#0d0b10');
  tabs.forEach((tb, i) => {
    const r = {x: x + 12 + i * (tw + 6), y: y + 10, w: tw, h: h - 4}; rects.push(r);
    const hv = (o.hover && o.hover[i]) || 0, pr = (o.press && o.press[i]) || 0;
    const act = tb.active;
    c.save(); const s = 1 - .03 * pr; c.translate(r.x + r.w / 2, r.y + r.h / 2); c.scale(s, s); c.translate(-r.x - r.w / 2, -r.y - r.h / 2);
    fillRR(c, r.x, r.y, r.w, r.h + 12, 12, act ? (tb.bg || P.bg2) : (hv > 0 ? 'rgba(255,255,255,' + (.04 + .05 * hv) + ')' : 'rgba(255,255,255,.03)'));
    if (tb.glyph) tb.glyph(c, r.x + 26, r.y + r.h / 2 + 2, 11);
    const tf = F.ui(act ? 600 : 500, 18); let title = tb.title; while (measure(c, title, tf) > r.w - 96 && title.length > 3) title = title.slice(0, -2) + '…';
    txt(c, title, r.x + 48, r.y + r.h / 2 + 8, {font: tf, color: act ? P.text : P.sub});
    if (tb.dot) { c.fillStyle = tb.dotColor || P.lav; c.globalAlpha = .5 + .5 * Math.sin((o.t || 0) * 8); c.beginPath(); c.arc(r.x + r.w - 46, r.y + r.h / 2 + 2, 5, 0, 7); c.fill(); c.globalAlpha = 1; }
    txt(c, '×', r.x + r.w - 22, r.y + r.h / 2 + 9, {font: F.ui(400, 22), color: P.dim, align: 'center'});
    c.restore();
  });
  const pr = {x: x + 12 + tabs.length * (tw + 6) + 6, y: y + 16, w: 40, h: 40}; rects.plus = pr;
  const phv = o.plusHover || 0, ppr = o.plusPress || 0;
  if (phv > 0 || ppr > 0) fillRR(c, pr.x, pr.y, pr.w, pr.h, 20, `rgba(255,255,255,${.08 * Math.max(phv, ppr) + .08 * ppr})`);
  txt(c, '+', pr.x + 20, pr.y + 29, {font: F.ui(400, 30), color: P.sub, align: 'center'});
  return rects;
}
// usage / quota bar: frac 0..1
function quota(c, x, y, w, frac, o = {}) {
  const h = o.h || 14, col = frac < .15 ? (o.low || P.red) : (o.color || P.lav);
  txt(c, o.label || 'Usage remaining', x, y - 14, {font: F.ui(500, o.lsize || 17), color: P.sub});
  txt(c, Math.round(frac * 100) + '%', x + w, y - 14, {font: F.mono(700, o.lsize || 17), color: frac < .15 ? P.red2 : P.text, align: 'right'});
  fillRR(c, x, y, w, h, h / 2, 'rgba(255,255,255,.08)', P.line2, 1);
  if (frac > .002) fillRR(c, x, y, Math.max(h, w * clamp(frac)), h, h / 2, col);
  if (o.sub) txt(c, o.sub, x, y + h + 26, {font: F.ui(400, o.subSize || 15), color: o.subColor || P.sub});
}
// tok/s readout
function tokRate(c, x, y, v, o = {}) {
  const col = o.color || P.lav, f = F.mono(700, o.size || 30);
  const w = txt(c, Math.round(v).toString(), x, y, {font: f, color: col, align: o.align || 'left'});
  txt(c, ' tok/s', o.align === 'right' ? x : x + w, y, {font: F.mono(400, (o.size || 30) * .6), color: P.sub, align: 'left'});
  if (o.label) txt(c, o.label, x, y - (o.size || 30) - 2, {font: F.ui(500, 14), color: P.dim});
}
// banner (limit / error / info). o: {title, body, kind, a, w}
function banner(c, x, y, w, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  const h = o.body ? 92 : 60, col = o.kind === 'error' ? P.red : o.kind === 'limit' ? '#e8b04a' : P.lav;
  c.save(); c.globalAlpha *= clamp(a * 1.4); c.translate(0, (1 - E.outC(clamp(a))) * -14);
  c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 24; fillRR(c, x, y, w, h, 14, '#2a2128'); c.shadowColor = 'transparent';
  fillRR(c, x, y, w, h, 14, null, col, 1.6); fillRR(c, x, y, 6, h, 3, col);
  c.fillStyle = col; c.beginPath(); c.arc(x + 34, y + 30, 11, 0, 7); c.fill(); txt(c, '!', x + 34, y + 37, {font: F.ui(800, 17), color: '#1b1418', align: 'center'});
  txt(c, o.title, x + 58, y + 37, {font: F.ui(600, 21), color: P.text});
  if (o.body) txt(c, o.body, x + 58, y + 70, {font: F.ui(400, 17), color: P.sub});
  if (o.action) { const bw = measure(c, o.action, F.ui(600, 17)) + 30; fillRR(c, x + w - bw - 18, y + h / 2 - 18, bw, 36, 18, P.text); txt(c, o.action, x + w - bw / 2 - 18, y + h / 2 + 6, {font: F.ui(600, 17), color: P.bg, align: 'center'}); }
  c.restore();
}
// screen-recorder style action caption, bottom-right. Text like "drag · Thinking → Pro"
function caption(c, s, o = {}) {
  const cp = s.cap; if (!cp) return;
  const age = s.t - cp.t0, a = clamp(age / .08) * (1 - seg(age, (cp.hold || 1.5) - .2, cp.hold || 1.5));
  if (a <= 0) return;
  const [verb, ...rest] = cp.text.split(' · '), obj = rest.join(' · ');
  const fv = F.mono(700, 22), fo = F.ui(600, 22);
  const vw = measure(c, verb, fv) + 26, ow = obj ? measure(c, obj, fo) + 28 : 0, w = vw + ow + 46, h = 52;
  const x = (o.x || W - 48) - w, y = o.y || H - 236;
  c.save(); c.globalAlpha *= a * .96; c.translate(0, (1 - E.outB(clamp(age / .18))) * 10);
  fillRR(c, x, y, w, h, 14, 'rgba(12,10,15,.86)', 'rgba(255,255,255,.18)', 1.5);
  const who = o.who === 'tibo' ? P.red : P.cream;
  c.fillStyle = who; c.beginPath(); c.arc(x + 22, y + h / 2, 6 + 2 * Math.exp(-age * 8), 0, 7); c.fill();
  fillRR(c, x + 38, y + 10, vw, h - 20, 7, who); txt(c, verb, x + 38 + vw / 2, y + h / 2 + 8, {font: fv, color: o.who === 'tibo' ? '#fff' : P.plum, align: 'center'});
  if (obj) txt(c, obj, x + 38 + vw + 14, y + h / 2 + 8, {font: fo, color: P.text});
  c.restore();
}
// small keycap pop (⏎ ⌫ Tab)
function keycap(c, key, x, y, t, t0) {
  const age = t - t0; if (age < 0 || age > .45) return; const a = 1 - seg(age, .3, .45), s = 1 - .08 * Math.exp(-age * 20);
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s); fillRR(c, -38, -30, 76, 60, 10, '#2b2631', P.line2, 2); fillRR(c, -38, 22, 76, 8, 4, 'rgba(0,0,0,.35)');
  txt(c, key, 0, 10, {font: F.ui(700, 26), color: P.text, align: 'center'}); c.restore();
}

module.exports = {DL, mj, fitts, snapBeat, snapKick, take, at, pos, posAt, dwell, hover, press, after, count, snapped, inRect,
  cursor, button, tooltip, slider, sliderX, menu, toggle, tabBar, quota, tokRate, banner, caption, keycap, CUR};
