const L = require('./lib');
const {W, H, P, clamp, rng, buf, createCanvas} = L;
let vign, grains = [];
function init() {
  vign = createCanvas(W, H); const v = vign.getContext('2d');
  const g = v.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.75)'); v.fillStyle = g; v.fillRect(0, 0, W, H);
  for (let k = 0; k < 6; k++) {
    const cv = createCanvas(480, 270), c = cv.getContext('2d'), id = c.createImageData(480, 270), R = rng(k * 99 + 7);
    for (let i = 0; i < id.data.length; i += 4) { const n = R() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = n; id.data[i + 3] = 255; }
    c.putImageData(id, 0, 0); grains.push(cv);
  }
}
// fx: {vignette, grain, chroma(px), glitch:{amt,p,seed,n}, flash(0..1), flashColor, scan, invert, shake}
function apply(c, frameCv, fx, fi) {
  // glitch slices + chroma operate on a copy of the frame
  if (fx.chroma > 0.5 || (fx.glitch && fx.glitch.amt > 0)) {
    const s = buf('src'); s.c.globalCompositeOperation = 'copy'; s.c.drawImage(frameCv, 0, 0); s.c.globalCompositeOperation = 'source-over';
    let src = s.cv;
    if (fx.glitch && fx.glitch.amt > 0) {
      const g = fx.glitch, R = rng(g.seed || fi), n = g.n || 18;
      const t = buf('gl'); t.c.drawImage(src, 0, 0);
      for (let i = 0; i < n; i++) {
        if (R() > (g.p || .5)) continue;
        const y = Math.floor(R() * H), h = Math.floor(8 + R() * (g.maxH || 120)), dx = (R() - .5) * 2 * g.amt;
        t.c.drawImage(src, 0, y, W, h, dx, y, W, h);
      }
      src = t.cv;
    }
    if (fx.chroma > 0.5) {
      const r = buf('cr'), b = buf('cb'), d = fx.chroma;
      r.c.globalCompositeOperation = 'copy'; r.c.drawImage(src, 0, 0); r.c.globalCompositeOperation = 'multiply'; r.c.fillStyle = '#ff0000'; r.c.fillRect(0, 0, W, H);
      b.c.globalCompositeOperation = 'copy'; b.c.drawImage(src, 0, 0); b.c.globalCompositeOperation = 'multiply'; b.c.fillStyle = '#00ffff'; b.c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'copy'; c.drawImage(r.cv, -d, 0); c.globalCompositeOperation = 'lighter'; c.drawImage(b.cv, d, 0);
      c.globalCompositeOperation = 'source-over';
    } else { c.globalCompositeOperation = 'copy'; c.drawImage(src, 0, 0); c.globalCompositeOperation = 'source-over'; }
  }
  if (fx.invert > 0) { c.save(); c.globalCompositeOperation = 'difference'; c.globalAlpha = fx.invert; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.restore(); }
  if (fx.scan) { c.save(); c.globalAlpha = fx.scan; c.fillStyle = '#000'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2); c.restore(); }
  if (fx.flash > 0) { c.save(); c.globalAlpha = clamp(fx.flash); c.fillStyle = fx.flashColor || '#fff'; c.fillRect(0, 0, W, H); c.restore(); }
  if (fx.vignette !== 0) { c.save(); c.globalAlpha = fx.vignette == null ? 1 : fx.vignette; c.drawImage(vign, 0, 0); c.restore(); }
  if (fx.fade > 0) { c.save(); c.globalAlpha = clamp(fx.fade); c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.restore(); }
  const ga = fx.grain == null ? 0.05 : fx.grain;
  if (ga > 0) { c.save(); c.globalAlpha = ga; c.globalCompositeOperation = 'overlay'; c.drawImage(grains[fi % grains.length], 0, 0, W, H); c.restore(); }
}
module.exports = {init, apply};
