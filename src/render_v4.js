// v2 renderer. usage:
//   node render.js sheet out.jpg t1 t2 ...      contact sheet (4 cols)
//   node render.js frame out.png t              single full-res frame
//   node render.js video f0 f1 out.mp4          encode frames [f0,f1)
// Shots live in shots/*.js, each exporting an array of {id, a, b, tin?:{type,dur,...}, step?, mb?, draw(c, t, fx)}
const L = require('./lib');
const C = require('./common');
const post = require('./post');
const T = require('./trans');
const K = require('./kit');
const {spawn} = require('child_process');
const fs = require('fs');
const {W, H} = L;
let SC = [];
for (const f of fs.readdirSync(__dirname + '/shots4').sort()) if (f.endsWith('.js') && !f.startsWith('_')) SC = SC.concat(require('./shots4/' + f));
SC.sort((a, b) => a.a - b.a);

const out = L.createCanvas(W, H), oc = out.getContext('2d');
const bA = L.createCanvas(W, H), cA = bA.getContext('2d');
const bB = L.createCanvas(W, H), cB = bB.getContext('2d');
const bM = L.createCanvas(W, H), cM = bM.getContext('2d');

function drawShot(c, s, t, fx) {
  c.canvas.width = W;  // hard reset: drops any transform/clip/alpha a previous shot leaked
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#0c0a0f'; c.fillRect(0, 0, W, H);
  let tt = t;
  if (s.step) tt = s.a + Math.floor((t - s.a) * s.step) / s.step;   // limited-animation stepping
  if (fx.step) tt = s.a + Math.floor((t - s.a) * fx.step) / fx.step;
  K.setCur(s); s.draw(c, tt, fx); K.setCur(null);
  c.restore();
}
function renderShot(c, s, t, fx) {
  if (s.mb && s.mb > 1) {
    // motion blur: average n subframes over 1/60 s
    const n = s.mb; cM.clearRect(0, 0, W, H);
    for (let k = 0; k < n; k++) { const f2 = {}; drawShot(c, s, t - k / (60 * n), f2); if (k === 0) Object.assign(fx, f2); cM.globalAlpha = 1 / (k + 1); cM.drawImage(c.canvas, 0, 0); }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.drawImage(bM, 0, 0); c.restore();
  } else drawShot(c, s, t, fx);
}
function renderFrame(t, fi) {
  let si = SC.findIndex(s => t >= s.a && t < s.b); if (si < 0) si = t < SC[0].a ? 0 : SC.length - 1;
  const s = SC[si], fx = {};
  const tin = s.tin && s.tin.type !== 'cut' ? s.tin : null;
  const tinP = tin ? (t - s.a) / (tin.dur || .25) : 1;
  if (tin && tinP < 1 && si > 0) {
    const fxp = {};
    renderShot(cB, SC[si - 1], t, fxp);
    renderShot(cA, s, t, fx);
    T.apply(oc, bB, bA, tin, L.clamp(tinP), t, fx);
  } else {
    renderShot(cA, s, t, fx);
    oc.globalCompositeOperation = 'copy'; oc.drawImage(bA, 0, 0); oc.globalCompositeOperation = 'source-over';
  }
  if (tin && tin.type === 'flash' && tinP < 1) fx.flash = Math.max(fx.flash || 0, (tin.amt || .9) * (1 - tinP) ** 2), fx.flashColor = tin.color || fx.flashColor;
  if (!fx.noSub) { oc.save(); C.subtitle(oc, t, fx.sub || {}); oc.restore(); }
  const cp = L.buf('postsrc'); cp.c.globalCompositeOperation = 'copy'; cp.c.drawImage(out, 0, 0); cp.c.globalCompositeOperation = 'source-over';
  post.apply(oc, cp.cv, fx, fi);
  if (fx.tear) T.tear(oc, fx.tear, fi);
  return out;
}

(async () => {
  await L.loadAssets(); post.init();
  const [mode, ...args] = process.argv.slice(2);
  if (mode === 'frame') { renderFrame(+args[1], Math.round(+args[1] * 60)); fs.writeFileSync(args[0], out.toBuffer('image/png')); }
  else if (mode === 'sheet') {
    const o = args[0], ts = args.slice(1).map(Number); const cols = 4, tw = 480, th = 270, rows = Math.ceil(ts.length / cols);
    const sh = L.createCanvas(cols * tw, rows * (th + 24)), c = sh.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, sh.width, sh.height);
    ts.forEach((t, i) => { renderFrame(t, Math.round(t * 60)); const x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 24); c.drawImage(out, x, y, tw, th); c.fillStyle = '#fff'; c.font = '16px Inter400'; const s = SC.find(s => t >= s.a && t < s.b); c.fillText(t.toFixed(2) + '  ' + (s ? s.id : ''), x + 6, y + th + 18); });
    fs.writeFileSync(o, sh.toBuffer('image/jpeg', {quality: .85}));
  } else if (mode === 'video') {
    const f0 = +args[0], f1 = +args[1], o = args[2];
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', `${W}x${H}`, '-r', '60', '-i', '-', '-c:v', 'libx264', '-preset', process.env.PRESET || 'medium', '-crf', process.env.CRF || '17', '-pix_fmt', 'yuv420p', o], {stdio: ['pipe', 'inherit', 'inherit']});
    const t0 = Date.now();
    for (let f = f0; f < f1; f++) {
      renderFrame(f / 60, f); const b = out.toBuffer('raw');
      if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 300 === 0) console.error(`[${o}] frame ${f} ${((Date.now() - t0) / 1000 / (f - f0 + 1)).toFixed(3)}s/f`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.error('done', o, (Date.now() - t0) / 1000);
  } else if (mode === 'list') { for (const s of SC) console.log(s.a.toFixed(2), s.b.toFixed(2), s.id, s.tin ? s.tin.type : ''); }
})();
