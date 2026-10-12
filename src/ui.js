// ChatGPT-like interface components
const L = require('./lib');
const {F, W, H, P, clamp, lerp, ease, E, rr, fillRR, txt, measure, wrapLines, typed} = L;

// stylised six-fold knot "blossom" (echoes the knot ornament in her hair)
function knot(c, x, y, r, o = {}) {
  c.save(); c.translate(x, y); c.rotate(o.rot || 0);
  c.strokeStyle = o.color || P.text; c.lineWidth = o.lw || r * 0.16; c.lineCap = 'round'; c.lineJoin = 'round';
  c.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
  if (o.glow) { c.shadowColor = o.glowColor || P.lav; c.shadowBlur = o.glow; }
  const n = 6, p = o.p == null ? 1 : o.p, bloom = o.bloom == null ? 1 : o.bloom;
  for (let i = 0; i < n; i++) {
    const pp = clamp(p * n - i);
    if (pp <= 0) continue;
    c.save(); c.rotate(i * Math.PI * 2 / n);
    const ox = r * 0.30 * bloom, len = r * 0.95, rad = r * 0.27;
    const per = 2 * (len - 2 * rad) + 2 * Math.PI * rad;
    if (pp < 1) c.setLineDash([per * pp, per]);
    rr(c, ox - rad, -len / 2, rad * 2, len, rad);
    c.stroke(); c.restore();
  }
  c.restore();
}

function icon(c, kind, x, y, s, col) {
  c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2; c.lineCap = 'round';
  if (kind === 'plus') { c.beginPath(); c.moveTo(x - s, y); c.lineTo(x + s, y); c.moveTo(x, y - s); c.lineTo(x, y + s); c.stroke(); }
  if (kind === 'edit') { c.strokeRect(x - s, y - s, s * 2, s * 2); c.beginPath(); c.moveTo(x - s * .3, y + s * .3); c.lineTo(x + s * 1.1, y - s * 1.1); c.stroke(); }
  if (kind === 'search') { c.beginPath(); c.arc(x - s * .2, y - s * .2, s * .7, 0, 7); c.moveTo(x + s * .35, y + s * .35); c.lineTo(x + s, y + s); c.stroke(); }
  if (kind === 'mic') { fillRR(c, x - s * .35, y - s, s * .7, s * 1.3, s * .35, null, col, 2); c.beginPath(); c.arc(x, y, s * .7, 0.1, Math.PI - 0.1); c.moveTo(x, y + s * .7); c.lineTo(x, y + s); c.stroke(); }
  if (kind === 'up') { c.beginPath(); c.moveTo(x, y + s * .7); c.lineTo(x, y - s * .7); c.moveTo(x - s * .55, y - s * .15); c.lineTo(x, y - s * .7); c.lineTo(x + s * .55, y - s * .15); c.stroke(); }
  if (kind === 'stop') { c.fillRect(x - s * .4, y - s * .4, s * .8, s * .8); }
  if (kind === 'chev') { c.beginPath(); c.moveTo(x - s * .5, y - s * .25); c.lineTo(x, y + s * .25); c.lineTo(x + s * .5, y - s * .25); c.stroke(); }
  c.restore();
}

// Main window. o: {x,y,w,h, a, sidebar, chats, model, status, msgs, composer, hero, scroll}
function gpt(c, o = {}) {
  const x = o.x || 0, y = o.y || 0, w = o.w || W, h = o.h || H;
  c.save(); c.globalAlpha *= (o.a == null ? 1 : o.a);
  if (o.frame) { c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 60; }
  fillRR(c, x, y, w, h, o.radius == null ? 18 : o.radius, o.bg || P.bg2, o.frame ? P.line : null, 1.5);
  c.shadowBlur = 0;
  c.save(); rr(c, x, y, w, h, o.radius == null ? 18 : o.radius); c.clip();
  const sw = o.sidebar === false ? 0 : (o.sidebarW || 300) * (o.sidebarP == null ? 1 : o.sidebarP);
  if (sw > 0) {
    c.fillStyle = o.sbBg || '#100e13'; c.fillRect(x, y, sw, h);
    c.fillStyle = P.line; c.fillRect(x + sw - 1, y, 1, h);
    const sx = x + sw - (o.sidebarW || 300);
    knot(c, sx + 34, y + 36, 16, {color: P.text, lw: 2});
    icon(c, 'edit', sx + 262, y + 36, 9, P.sub);
    txt(c, 'New chat', sx + 66, y + 104, {font: F.ui(500, 19), color: P.text});
    icon(c, 'plus', sx + 38, y + 98, 8, P.sub);
    txt(c, 'Search chats', sx + 66, y + 146, {font: F.ui(400, 19), color: P.sub});
    icon(c, 'search', sx + 38, y + 140, 8, P.sub);
    txt(c, 'Chats', sx + 26, y + 214, {font: F.ui(500, 15), color: P.dim});
    (o.chats || []).forEach((ch, i) => {
      const cy = y + 252 + i * 42; const a = ch.a == null ? 1 : ch.a; if (a <= 0) return;
      c.save(); c.globalAlpha *= a; c.translate(ch.dx || 0, 0);
      if (ch.active) fillRR(c, sx + 12, cy - 27, 276, 38, 10, P.panel2);
      const col = ch.color || (ch.active ? P.text : P.sub);
      const tw = txt(c, ch.title, sx + 26, cy, {font: F.ui(400, 18), color: col});
      if (ch.strike) { c.fillStyle = ch.strikeColor || P.red; c.fillRect(sx + 24, cy - 7, tw * clamp(ch.strike) + 4, 2); }
      c.restore();
    });
    // user profile
    fillRR(c, sx + 22, y + h - 66, 38, 38, 19, P.lavDeep);
    txt(c, (o.userName || 'you')[0].toUpperCase(), sx + 41, y + h - 40, {font: F.ui(600, 18), color: P.white, align: 'center'});
    txt(c, o.userName || 'you', sx + 74, y + h - 40, {font: F.ui(500, 18), color: P.text});
    const st = o.userStatus || 'online';
    c.fillStyle = st === 'online' ? P.green : st === 'away' ? '#d6b25c' : P.dim;
    c.beginPath(); c.arc(sx + 54, y + h - 36, 6, 0, 7); c.fill();
    txt(c, o.userSub || '', sx + 74, y + h - 18, {font: F.ui(400, 14), color: P.dim});
  }
  // header
  const mx = x + sw, mw = w - sw;
  txt(c, o.model || 'ChatGPT', mx + 28, y + 44, {font: F.ui(500, 22), color: P.text});
  const mwid = measure(c, o.model || 'ChatGPT', F.ui(500, 22));
  icon(c, 'chev', mx + 44 + mwid, y + 37, 9, P.sub);
  if (o.status !== false) {
    const st = o.status || 'online';
    const col = st === 'online' ? P.green : st === 'error' ? P.red : P.dim;
    c.fillStyle = col; c.beginPath(); c.arc(mx + mw - 130, y + 37, 5, 0, 7); c.fill();
    txt(c, st, mx + mw - 116, y + 44, {font: F.mono(400, 17), color: P.sub});
  }
  // hero
  if (o.hero) {
    const ha = o.hero.a == null ? 1 : o.hero.a;
    txt(c, typed(o.hero.text || 'What can I help with?', o.hero.p == null ? 1 : o.hero.p), mx + mw / 2, y + h * 0.42, {font: F.ui(500, 40), color: P.text, align: 'center', alpha: ha});
  }
  // messages
  const colW = Math.min(820, mw - 160), colX = mx + (mw - colW) / 2;
  let my = y + 120 - (o.scroll || 0);
  (o.msgs || []).forEach(m => {
    const a = m.a == null ? 1 : m.a;
    const font = m.font || F.ui(400, 22);
    const s = m.p == null ? m.text : typed(m.text, m.p);
    if (m.role === 'user') {
      const lines = wrapLines(c, m.text, font, colW * 0.62);
      const lw = Math.max(...lines.map(l => measure(c, l, font))) + 44, bh = lines.length * 32 + 28;
      if (a > 0) {
        c.save(); c.globalAlpha *= a; c.translate((1 - a) * 0, (1 - a) * 20);
        fillRR(c, colX + colW - lw, my, lw, bh, 24, m.bg || P.panel2, m.border || null, 1.5);
        lines.forEach((l, i) => txt(c, l, colX + colW - lw + 22, my + 38 + i * 32, {font, color: m.color || P.text}));
        if (m.time) txt(c, m.time, colX + colW - 6, my + bh + 22, {font: F.ui(400, 14), color: P.dim, align: 'right'});
        c.restore();
      }
      my += bh + (m.gap || 40);
    } else {
      const lines = wrapLines(c, m.text, font, colW);
      const shown = wrapLines(c, s, font, colW);
      if (a > 0) {
        c.save(); c.globalAlpha *= a;
        if (m.icon !== false) knot(c, colX - 34, my + 18, 13, {color: P.text, lw: 1.8, rot: m.spin || 0});
        shown.forEach((l, i) => txt(c, l, colX + 10, my + 26 + i * (m.lh || 34), {font, color: m.color || P.text, glow: m.glow}));
        if (m.p != null && m.p < 1 && m.cursor !== false) {
          const last = shown[shown.length - 1] || ''; const lwid = measure(c, last, font);
          c.fillStyle = P.text; c.beginPath(); c.arc(colX + 22 + lwid, my + 18 + (shown.length - 1) * (m.lh || 34), 7, 0, 7); c.fill();
        }
        c.restore();
      }
      my += lines.length * (m.lh || 34) + (m.gap || 40);
    }
  });
  // composer
  if (o.composer !== false) {
    const cp = o.composer || {};
    const cw = Math.min(840, mw - 120), ch = 64, cx = mx + (mw - cw) / 2, cy = cp.y || (y + h - (cp.bottom || 150));
    c.save(); c.globalAlpha *= (cp.a == null ? 1 : cp.a);
    if (cp.glow) { c.shadowColor = cp.glowColor || P.lav; c.shadowBlur = cp.glow; }
    fillRR(c, cx, cy, cw, ch, 32, P.panel2, cp.focus ? P.line2 : P.line, 1.5);
    c.shadowBlur = 0;
    icon(c, 'plus', cx + 34, cy + 32, 9, P.sub);
    const ct = cp.text || '';
    if (ct) txt(c, ct, cx + 62, cy + 40, {font: cp.font || F.ui(400, 21), color: cp.color || P.text});
    else txt(c, cp.placeholder || 'Ask anything', cx + 62, cy + 40, {font: F.ui(400, 21), color: P.dim});
    if (cp.cursor) { const cwid = ct ? measure(c, ct, cp.font || F.ui(400, 21)) : 0; c.fillStyle = P.text; c.fillRect(cx + 63 + cwid, cy + 18, 2, 28); }
    icon(c, 'mic', cx + cw - 92, cy + 32, 10, P.sub);
    const sendOn = !!ct || cp.sendOn;
    c.fillStyle = cp.stop ? P.text : sendOn ? P.text : P.faint;
    c.beginPath(); c.arc(cx + cw - 38, cy + 32, 20, 0, 7); c.fill();
    icon(c, cp.stop ? 'stop' : 'up', cx + cw - 38, cy + 32, 12, P.bg);
    if (cp.foot !== false) txt(c, cp.footText || 'ChatGPT can make mistakes. Check important info.', mx + mw / 2, cy + ch + 34, {font: F.ui(400, 14), color: P.dim, align: 'center'});
    c.restore();
  }
  c.restore(); c.restore();
}

// generic floating panel / dialog
function panel(c, x, y, w, h, o = {}) {
  c.save(); c.globalAlpha *= (o.a == null ? 1 : o.a);
  c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = o.shadow == null ? 40 : o.shadow;
  fillRR(c, x, y, w, h, o.r || 16, o.bg || P.panel, null);
  c.shadowBlur = 0;
  fillRR(c, x, y, w, h, o.r || 16, null, o.border || P.line, o.lw || 1.5);
  if (o.title) {
    txt(c, o.title, x + 24, y + 38, {font: o.titleFont || F.ui(600, 18), color: o.titleColor || P.text});
    c.fillStyle = o.border || P.line; c.fillRect(x, y + 58, w, 1);
  }
  c.restore();
}
function toggle(c, x, y, on, o = {}) {
  const w = o.w || 56, h = o.h || 30;
  fillRR(c, x, y, w, h, h / 2, on > .5 ? (o.on || P.lav) : P.faint);
  c.fillStyle = P.white; c.beginPath(); c.arc(x + h / 2 + (w - h) * clamp(on), y + h / 2, h / 2 - 4, 0, 7); c.fill();
}
function bubbleAI(c, x, y, text, o = {}) { // floating ai pill used in kinetic scenes
  const font = o.font || F.ui(500, 26); const w = measure(c, text, font) + 48, h = o.h || 56;
  c.save(); c.globalAlpha *= (o.a == null ? 1 : o.a);
  const bx = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  fillRR(c, bx, y, w, h, h / 2, o.bg || P.panel2, o.border || P.line, 1.5);
  txt(c, text, bx + 24, y + h / 2 + 9, {font, color: o.color || P.text});
  c.restore(); return w;
}
function cursorArrow(c, x, y, s = 1, a = 1) {
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 26); c.lineTo(7, 20); c.lineTo(12, 31); c.lineTo(16, 29); c.lineTo(11, 18); c.lineTo(20, 18); c.closePath();
  c.fillStyle = P.white; c.fill(); c.strokeStyle = '#000'; c.lineWidth = 1.5; c.stroke(); c.restore();
}

module.exports = {knot, icon, gpt, panel, toggle, bubbleAI, cursorArrow};
