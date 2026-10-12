const L = require('./lib');
const {F, W, H, P, clamp, lerp, seg, E, ease, rng, hash, noise1, au, auS, beatInfo, pulse, LRC, txt, txtAnim, measure, fillRR, rr, typed} = L;
const ZH = JSON.parse(require('fs').readFileSync(__dirname + '/assets/zh.json'));

function bg(c, col = P.bg) { c.fillStyle = col; c.fillRect(0, 0, W, H); }
function radial(c, x, y, r, col, a = 1) {
  c.save(); c.globalAlpha *= a; const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
}
function dotGrid(c, t, o = {}) {
  const s = o.s || 48, a = o.a == null ? .18 : o.a; c.save(); c.fillStyle = o.color || P.line2;
  const ox = ((o.ox || 0) % s + s) % s, oy = ((o.oy || 0) % s + s) % s;
  for (let x = -s + ox; x < W + s; x += s) for (let y = -s + oy; y < H + s; y += s) {
    const d = o.wave ? Math.sin(x * .01 + y * .008 - t * 2) * .5 + .5 : 1;
    c.globalAlpha = a * d; c.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
  c.restore();
}
function particles(c, t, o = {}) {
  const n = o.n || 60, R = rng(o.seed || 3); c.save();
  for (let i = 0; i < n; i++) {
    const x0 = R() * W, y0 = R() * H, sp = 10 + R() * 40, sz = .8 + R() * 2.2, ph = R() * 6;
    const x = (x0 + Math.sin(t * .3 + ph) * 30 + W) % W, y = ((y0 - t * sp) % H + H) % H;
    c.globalAlpha = (o.a || .5) * (.4 + .6 * Math.sin(t * 2 + ph) ** 2); c.fillStyle = o.color || P.lav;
    c.beginPath(); c.arc(x, y, sz, 0, 7); c.fill();
  }
  c.restore();
}
function lyricAt(t) { for (let i = LRC.length - 1; i >= 0; i--) if (LRC[i].t <= t) return LRC[i]; return null; }
function zh(s) { return ZH[s] || ''; }
// global Chinese subtitle
function subtitle(c, t, o = {}) {
  const l = lyricAt(t); if (!l || !l.s) return;
  const z = zh(l.s); if (!z) return;
  const a = Math.min(ease(t, l.t, l.t + .15), 1 - ease(t, l.e - .12, l.e)) * (o.a == null ? 1 : o.a);
  if (a <= 0) return;
  const y = o.y || H - 34, font = F.sc(500, 28), w = measure(c, z, font, 4) + 56;
  c.save(); c.globalAlpha = a * .72; fillRR(c, W / 2 - w / 2, y - 36, w, 50, 25, 'rgba(8,7,10,.85)'); c.restore();
  txt(c, z, W / 2, y, {font, color: o.color || 'rgba(236,231,241,.92)', align: 'center', alpha: a, tracking: 4});
}
// big kinetic word: chars rise in staggered
function kword(c, s, x, y, t, t0, o = {}) {
  const st = o.stagger || .035, du = o.dur || .35;
  return txtAnim(c, s, x, y, {font: o.font || F.disp(800, 120), align: o.align || 'center', tracking: o.tracking || 0, color: o.color || P.text, glow: o.glow, glowColor: o.glowColor, stroke: o.stroke, lw: o.lw, noFill: o.noFill}, (i, n) => {
    const p = ease(t, t0 + i * st, t0 + i * st + du, o.fn || E.outB);
    const out = o.out ? 1 - ease(t, o.out + i * st * .5, o.out + i * st * .5 + .25, E.inC) : 1;
    return {a: Math.min(clamp(p * 1.5), out), dy: (1 - p) * (o.rise || 60) + (1 - out) * -30, s: o.scaleIn ? lerp(.4, 1, p) : null, color: o.colorFn ? o.colorFn(i, n) : null};
  });
}
function shake(c, amt, t, seed = 1) { c.translate((noise1(t * 30 + seed) - .5) * amt * 2, (noise1(t * 30 + 50 + seed) - .5) * amt * 2); }
function lineDraw(c, pts, p, o = {}) {
  // draw polyline up to fraction p
  if (p <= 0 || pts.length < 2) return; let tot = 0; const seglen = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seglen.push(d); tot += d; }
  let rem = tot * clamp(p); c.save(); c.strokeStyle = o.color || P.lav; c.lineWidth = o.lw || 3; c.lineCap = 'round'; c.lineJoin = 'round';
  if (o.glow) { c.shadowColor = o.glowColor || o.color || P.lav; c.shadowBlur = o.glow; }
  c.globalAlpha *= (o.a == null ? 1 : o.a);
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); let last = pts[0];
  for (let i = 1; i < pts.length; i++) {
    if (rem >= seglen[i - 1]) { c.lineTo(pts[i][0], pts[i][1]); rem -= seglen[i - 1]; last = pts[i]; }
    else { const f = rem / seglen[i - 1]; last = [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; c.lineTo(last[0], last[1]); break; }
  }
  c.stroke(); c.restore(); return last;
}
// lyric line rendered in serif with word-by-word reveal timed to line duration
function lyricLine(c, l, t, x, y, o = {}) {
  if (!l) return; const words = l.s.split(' ');
  const font = o.font || F.serif(64); const dur = (o.dur || (l.e - l.t) * .7);
  c.save(); c.font = font; const sp = c.measureText(' ').width; const ws = words.map(w => c.measureText(w).width); c.restore();
  const tw = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let ax = o.align === 'left' ? x : o.align === 'right' ? x - tw : x - tw / 2;
  words.forEach((w, i) => {
    const t0 = l.t + dur * i / words.length; const p = ease(t, t0, t0 + .25);
    txt(c, w, ax, y + (1 - p) * 24, {font, color: o.colorFn ? o.colorFn(i, w) : (o.color || P.text), alpha: p * (o.a == null ? 1 : o.a), glow: o.glow, glowColor: o.glowColor});
    ax += ws[i] + sp;
  });
  return tw;
}
function counter(c, n, x, y, o = {}) { return txt(c, String(n).padStart(o.pad || 4, '0'), x, y, {font: o.font || F.mono(700, 64), color: o.color || P.text, align: o.align, glow: o.glow}); }

module.exports = {bg, radial, dotGrid, particles, lyricAt, zh, subtitle, kword, shake, lineDraw, lyricLine, counter};
