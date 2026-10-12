// transitions between shots: apply(out, prevCanvas, nextCanvas, spec, p 0..1, t, fx)
const L = require('./lib');
const {W, H, clamp, lerp, E, rng} = L;
const U = require('./ui');

function draw(c, cv, o = {}) {
  c.save(); c.globalAlpha = o.a == null ? 1 : o.a; c.translate(W / 2 + (o.dx || 0), H / 2 + (o.dy || 0)); if (o.r) c.rotate(o.r); c.scale(o.s || 1, o.s || 1);
  c.drawImage(cv, -W / 2, -H / 2); c.restore();
}
function apply(c, A, B, sp, p, t, fx) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const ty = sp.type;
  if (ty === 'flash' || ty === 'fade') {
    draw(c, A); draw(c, B, {a: ty === 'fade' ? E.ioC(p) : clamp(p * 4)});
  } else if (ty === 'black') {
    draw(c, A, {a: 1 - clamp(p * 2)}); c.fillStyle = '#000'; c.globalAlpha = 1; draw(c, B, {a: clamp(p * 2 - 1)});
  } else if (ty === 'push') {
    const d = sp.dir || 'left'; const e = E.ioE(p); const vx = d === 'left' ? -1 : d === 'right' ? 1 : 0, vy = d === 'up' ? -1 : d === 'down' ? 1 : 0;
    for (let g = 3; g >= 0; g--) { const ee = clamp(e - g * .035); const a = g ? .18 : 1; draw(c, A, {dx: vx * W * ee, dy: vy * H * ee, a}); draw(c, B, {dx: vx * W * (ee - 1), dy: vy * H * (ee - 1), a}); }
  } else if (ty === 'zoom') {
    const e = E.ioC(p);
    draw(c, A, {s: lerp(1, sp.inS || 4, E.inC(clamp(p * 1.4))), a: 1 - clamp(p * 1.6 - .4)});
    for (let g = 2; g >= 0; g--) draw(c, B, {s: lerp(sp.outS || .55, 1, E.outC(clamp(e - g * .05))), a: clamp(p * 2.2 - .3) * (g ? .3 : 1)});
  } else if (ty === 'iris') {
    // reveal next inside the ChatGPT knot / circle growing from centre
    draw(c, A);
    c.save(); const r = E.inQ(p) * Math.hypot(W, H) * .62; const x = sp.x == null ? W / 2 : sp.x, y = sp.y == null ? H / 2 : sp.y;
    c.beginPath(); c.arc(x, y, Math.max(1, r), 0, Math.PI * 2); c.clip(); draw(c, B); c.restore();
    U.knot(c, x, y, Math.max(1, r * .9), {color: '#F5E9D6', lw: 6, rot: p * 2, alpha: 1 - p});
  } else if (ty === 'regen') {
    // signature "regenerate": 16x9 tiles flip on their vertical axis in a wave rippling out from the ↻ / pager
    const n = 16, m = 9, tw = W / n, th = H / m; const ox = sp.x == null ? W / 2 : sp.x, oy = sp.y == null ? 90 : sp.y;
    const maxD = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy)); const edge = sp.edge || '#B9A3DA';
    if (p >= 1) { draw(c, B); } else {
      c.fillStyle = '#0c0a0f'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
        const cx = i * tw + tw / 2, cy = j * th + th / 2; const d = Math.hypot(cx - ox, cy - oy) / maxD;
        const q = clamp((p - d * .55) / .45); const src = q < .5 ? A : B; const sx = Math.max(.02, Math.abs(Math.cos(q * Math.PI)));
        c.save(); c.translate(cx, cy); c.scale(sx, 1 - .06 * Math.sin(q * Math.PI));
        c.drawImage(src, i * tw, j * th, tw, th, -tw / 2 - .5, -th / 2 - .5, tw + 1.5, th + 1.5);
        if (q > 0 && q < 1) { c.globalAlpha = Math.sin(q * Math.PI); c.fillStyle = edge; c.fillRect(-tw / 2, -th / 2, 2 / sx, th); c.fillRect(tw / 2 - 2 / sx, -th / 2, 2 / sx, th); }
        c.restore();
      }
    }
  } else if (ty === 'slices') {
    const n = sp.n || 9; const sh = H / n; draw(c, A);
    for (let i = 0; i < n; i++) { const d = (i % 2 ? 1 : -1); const q = E.outE(clamp(p * 1.4 - i * .04)); c.drawImage(B, 0, i * sh, W, sh + 1, d * W * (1 - q), i * sh, W, sh + 1); }
  } else if (ty === 'glitch') {
    const R = rng(Math.floor(t * 60)); draw(c, p < .5 ? A : B);
    for (let i = 0; i < 14; i++) { const y = R() * H, h = 10 + R() * 120, dx = (R() - .5) * 300 * (1 - Math.abs(p - .5) * 2); c.drawImage(R() < p ? B : A, 0, y, W, h, dx, y, W, h); }
  } else if (ty === 'wipe') {
    const x = E.ioC(p) * W; draw(c, A); c.save(); c.beginPath(); c.rect(0, 0, x, H); c.clip(); draw(c, B); c.restore();
    c.fillStyle = sp.color || '#B9A3DA'; c.fillRect(x - 3, 0, 6, H);
  } else { draw(c, B); }
  c.restore();
}
// 6-frame tear: horizontal tear band offsets
function tear(c, amt, fi) {
  const R = rng(fi * 13 + 1); const src = L.buf('tear'); src.c.globalCompositeOperation = 'copy'; src.c.drawImage(c.canvas, 0, 0); src.c.globalCompositeOperation = 'source-over';
  const y = H * (.25 + R() * .5), dx = (R() < .5 ? -1 : 1) * amt;
  c.drawImage(src.cv, 0, y, W, H - y, dx, y + 4, W, H - y);
  c.fillStyle = '#fff'; c.globalAlpha = .8; c.fillRect(0, y, W, 3); c.globalAlpha = 1;
}
module.exports = {apply, tear};
