// Ink-separated character art + puppet animation (row-strip warp, breathing, sway, misregistration, ghosts, dissolve, reveal)
const L = require('./lib');
const {createCanvas, IMG, clamp, lerp, rng, noise1, hash, W, H} = L;

// palette states for the three inks [cream, lavender, plum]
const INK = {
  orig: ['#F5E9D6', '#B9A3DA', '#33223A'],
  bright: ['#FFF6E8', '#CDB6F2', '#3A2546'],
  off: ['#D9D5DC', '#8E8896', '#29262D'],
  ash: ['#A9A2A6', '#6E666B', '#221E22'],
  err: ['#F6E4E4', '#FF4D6D', '#2B1218'],
  errWarm: ['#F5E9D6', '#B9A3DA', '#2B1218'],
  ghost: ['#B9A3DA', '#7D63B4', '#3A2A4A'],
  white: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
  black: ['#0c0a0f', '#0c0a0f', '#0c0a0f'],
  plumSil: ['#33223A', '#33223A', '#33223A'],
  lavSil: ['#B9A3DA', '#B9A3DA', '#B9A3DA'],
  cream: ['#F5E9D6', '#F5E9D6', '#F5E9D6'],
  inv: ['#33223A', '#7D63B4', '#F5E9D6'],
};
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, t)), g = Math.round(lerp(pa >> 8 & 255, pb >> 8 & 255, t)), bl = Math.round(lerp(pa & 255, pb & 255, t));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}
// blend two palettes
function inkMix(a, b, t) { const A = typeof a === 'string' ? INK[a] : a, B = typeof b === 'string' ? INK[b] : b; return A.map((x, i) => mixHex(x, B[i], clamp(t))); }

// cached tinted layers. Colours are quantised to limit the cache.
const tintCache = new Map(); let tintOrder = [];
function tinted(name, li, col) {
  const key = name + '|' + li + '|' + col;
  let cv = tintCache.get(key);
  if (cv) return cv;
  const im = IMG[name + '_L' + li]; if (!im) throw new Error('no art ' + name);
  cv = createCanvas(im.width, im.height); const c = cv.getContext('2d');
  c.drawImage(im, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = col; c.fillRect(0, 0, im.width, im.height);
  tintCache.set(key, cv); tintOrder.push(key);
  if (tintOrder.length > 260) { const k = tintOrder.shift(); tintCache.delete(k); }
  return cv;
}
const scratch = {};
function scr(w, h, k = 'a') { const key = k + w + 'x' + h; let s = scratch[key]; if (!s) { const cv = createCanvas(w, h); s = scratch[key] = {cv, c: cv.getContext('2d')}; } s.c.setTransform(1, 0, 0, 1, 0, 0); s.c.globalAlpha = 1; s.c.globalCompositeOperation = 'source-over'; s.c.clearRect(0, 0, w, h); return s; }
const size = name => { const im = IMG[name + '_L0']; return {w: im.width, h: im.height}; };

// compose the three ink plates with optional misregistration into a scratch canvas
function compose(name, o) {
  const {w, h} = size(name), pad = 80;
  const s = scr(w + pad * 2, h + pad * 2, 'cmp');
  let pal = o.pal || 'orig'; pal = typeof pal === 'string' ? INK[pal] : pal;
  // snap colours for cache
  const reg = o.reg || 0, R = rng(o.regSeed || 7);
  const order = o.order || [0, 1, 2];
  const layers = o.layers || [1, 1, 1];
  for (const i of order) {
    if (!layers[i]) continue;
    const ang = R() * Math.PI * 2, rr = reg * (0.6 + R() * 0.6);
    const dx = i === 0 ? 0 : Math.cos(ang) * rr, dy = i === 0 ? 0 : Math.sin(ang) * rr;
    s.c.globalAlpha = typeof layers[i] === 'number' ? layers[i] : 1;
    s.c.drawImage(tinted(name, i, pal[i]), pad + dx, pad + dy);
  }
  s.c.globalAlpha = 1;
  return {cv: s.cv, w, h, pad};
}

// main puppet draw. o: {x, y (center of figure), h (display height), pal, reg, regSeed, alpha,
//   t (time for idle motion), sway (px, hair sway amp at bottom), swayF (Hz), breathe (0..), bob (px), rot, sx, sy,
//   flip, ghosts:[{dx,dy,a,rot,s}], dissolve (0..1), reveal (0..1 image-gen top-down reveal), comp, shadow, shadowColor,
//   clip: {y0,y1} fraction rows to draw, wind (px horizontal push), wave: extra lateral wave}
function draw(c, name, o = {}) {
  const t = o.t || 0;
  const {cv, w, h, pad} = compose(name, o);
  const H0 = o.h || 900, sc = H0 / h;
  const sway = o.sway == null ? 10 : o.sway, swayF = o.swayF || 0.35, br = o.breathe == null ? 0.012 : o.breathe;
  c.save();
  c.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  if (o.comp) c.globalCompositeOperation = o.comp;
  c.translate(o.x == null ? W / 2 : o.x, (o.y == null ? H / 2 : o.y) + (o.bob || 0));
  if (o.rot) c.rotate(o.rot);
  const breath = 1 + br * Math.sin(t * Math.PI * 2 / 3.6);
  c.scale((o.sx || 1) * sc * (o.flip ? -1 : 1) * (2 - breath) ** 0.3, (o.sy || 1) * sc * breath);
  if (o.shadow) { c.shadowColor = o.shadowColor || '#B9A3DA'; c.shadowBlur = o.shadow; }
  const drawRows = (alpha, gdx, gdy, gs) => {
    c.save(); c.globalAlpha *= alpha; if (gdx || gdy) c.translate(gdx / sc, gdy / sc); if (gs) c.scale(gs, gs);
    const step = o.step || 6, y0 = (o.clip ? o.clip[0] : 0) * h, y1 = (o.clip ? o.clip[1] : 1) * h;
    const revealY = o.reveal == null ? h + 1 : o.reveal * h;
    for (let y = y0; y < y1; y += step) {
      const fy = y / h;
      const wgt = Math.pow(clamp((fy - 0.18) / 0.82), 1.6);
      let dx = sway * wgt * Math.sin(t * Math.PI * 2 * swayF - fy * 4.2) + (o.wind || 0) * wgt
        + (sway * 0.35) * wgt * Math.sin(t * Math.PI * 2 * swayF * 2.3 - fy * 9 + 1.3);
      if (o.wave) dx += o.wave.amp * Math.sin(fy * o.wave.k + t * o.wave.f);
      const hh = Math.min(step + 1, y1 - y);
      if (y > revealY) break;
      c.drawImage(cv, 0, pad + y, w + pad * 2, hh, -w / 2 - pad + dx / sc, y - h / 2, w + pad * 2, hh);
    }
    c.restore();
  };
  if (o.ghosts) for (const g of o.ghosts) drawRows(g.a, g.dx || 0, g.dy || 0, g.s);
  if (o.dissolve > 0) {
    // draw with square holes, pieces drifting upward-right
    const d = o.dissolve, R = rng(o.dSeed || 3), cell = 18;
    drawRows(1, 0, 0);
    c.globalCompositeOperation = 'destination-out';
    for (let yy = 0; yy < h; yy += cell) for (let xx = 0; xx < w; xx += cell) {
      const th = (1 - (yy / h)) * 0.35 + (xx / w) * 0.3 + R() * 0.5;
      if (th < d * 1.2) c.fillRect(xx - w / 2, yy - h / 2, cell, cell);
    }
    c.globalCompositeOperation = o.comp || 'source-over';
    const R2 = rng(o.dSeed || 3);
    for (let yy = 0; yy < h; yy += cell) for (let xx = 0; xx < w; xx += cell) {
      const th = (1 - (yy / h)) * 0.35 + (xx / w) * 0.3 + R2() * 0.5;
      const k = d * 1.2 - th;
      if (k > 0 && k < 0.5) {
        const f = k / 0.5;
        c.globalAlpha = (1 - f) * (o.alpha == null ? 1 : o.alpha);
        c.drawImage(cv, pad + xx, pad + yy, cell, cell, xx - w / 2 + f * 260, yy - h / 2 - f * 340, cell * (1 - f * .5), cell * (1 - f * .5));
      }
    }
  } else drawRows(1, 0, 0);
  // image-gen style reveal: blurred lower part
  if (o.reveal != null && o.reveal < 1) {
    const ry = o.reveal * h;
    const s2 = scr(Math.ceil(w / 24), Math.ceil(h / 24), 'blur');
    s2.c.drawImage(cv, pad, pad, w, h, 0, 0, s2.cv.width, s2.cv.height);
    c.save(); c.beginPath(); c.rect(-w / 2, ry - h / 2, w, h - ry); c.clip();
    c.globalAlpha *= 0.85; c.imageSmoothingEnabled = true; c.drawImage(s2.cv, -w / 2, -h / 2, w, h); c.restore();
    // shimmer line
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-w / 2, ry - h / 2 - 2, w, 4);
  }
  c.restore();
  return {w: w * sc, h: H0};
}

// sample points on a figure (for constellation / particle builds)
const ptCache = {};
function points(name, n = 400, li = 2, seed = 1) {
  const key = name + n + li + seed; if (ptCache[key]) return ptCache[key];
  const im = IMG[name + '_L' + li]; const cv = createCanvas(im.width, im.height), c = cv.getContext('2d'); c.drawImage(im, 0, 0);
  const d = c.getImageData(0, 0, im.width, im.height).data; const R = rng(seed), out = [];
  let tries = 0;
  while (out.length < n && tries < n * 400) { tries++; const x = Math.floor(R() * im.width), y = Math.floor(R() * im.height); if (d[(y * im.width + x) * 4 + 3] > 128) out.push([x / im.width - .5, y / im.height - .5]); }
  return ptCache[key] = out;
}

module.exports = {INK, inkMix, mixHex, tinted, compose, draw, size, points};
