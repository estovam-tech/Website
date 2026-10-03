/* Home-only effects: image lightbox, scroll-pinned hero with shell compare,
   caption scramble, split-flap "Contact us". Loaded by index.html after site.js.
   The 3D viewer lives in viewer.js, not here. */

// 1. Image lightbox. A figure with class es-zoomable and data-raw="solid|clear|head" opens the full-size render.
(function () {
  const base = document.currentScript.src;
  const full = name => new URL('../img/' + name, base).href;
  const RAW = { white: full('render-solid-full.jpg'), clear: full('render-clear-full.jpg'), head: full('render-head-full.jpg') };
  const lb = document.getElementById('lb'), img = document.getElementById('lbImg'), x = document.getElementById('lbX'), pct = document.getElementById('lbPct');
  if (!lb) return;
  const NW = 2200, NH = 1238, cl = (v, a, b) => Math.min(Math.max(v, a), b);
  let fit = 1, s = 1, tx = 0, ty = 0, opener = null, open = false; const P = new Map(); let pinch0 = null, moved = 0, downOnBg = false;
  function clamp() {
    const w = NW * s, h = NH * s, W = innerWidth, H = innerHeight;
    tx = w <= W ? (W - w) / 2 : cl(tx, W - w - 40, 40); ty = h <= H ? (H - h) / 2 : cl(ty, H - h - 40, 40);
  }
  function paint() { clamp(); img.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')'; pct.textContent = 'Zoom ' + Math.round(s / fit * 100) + '%'; }
  function zoomAt(ns, cx, cy) { ns = cl(ns, fit, fit * 5); const k = ns / s; tx = cx - (cx - tx) * k; ty = cy - (cy - ty) * k; s = ns; paint(); }
  function openLb(key, from) {
    if (key === 'auto') { const l = document.getElementById('cmpLbl'); key = l && /clear/i.test(l.textContent) ? 'clear' : 'white'; }
    opener = from; img.src = RAW[key]; img.alt = from.getAttribute('aria-label') || '';
    fit = Math.min(innerWidth * .92 / NW, innerHeight * .86 / NH); s = fit; tx = (innerWidth - NW * s) / 2; ty = (innerHeight - NH * s) / 2; paint();
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); open = true; x.focus({ preventScroll: true });
  }
  function closeLb() {
    if (!open) return; open = false; lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); P.clear(); pinch0 = null;
    if (opener) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
  }
  document.querySelectorAll('.es-zoomable').forEach(f => {
    f.addEventListener('click', () => openLb(f.dataset.raw, f));
    f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(f.dataset.raw, f); } });
  });
  x.addEventListener('click', closeLb);
  lb.addEventListener('wheel', e => { e.preventDefault(); zoomAt(s * Math.exp(-e.deltaY * (e.deltaMode === 1 ? .05 : .0016)), e.clientX, e.clientY); }, { passive: false });
  lb.addEventListener('pointerdown', e => {
    if (e.target === x || x.contains(e.target)) return;
    downOnBg = e.target === lb; moved = 0; P.set(e.pointerId, { x: e.clientX, y: e.clientY }); lb.setPointerCapture(e.pointerId);
    if (P.size === 2) { const [a, b] = [...P.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), s }; }
    img.classList.add('drag');
  });
  lb.addEventListener('pointermove', e => {
    const p = P.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; moved += Math.abs(dx) + Math.abs(dy);
    if (P.size === 2 && pinch0) {
      P.set(e.pointerId, { x: e.clientX, y: e.clientY }); const [a, b] = [...P.values()];
      zoomAt(pinch0.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch0.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
    } else { tx += dx; ty += dy; P.set(e.pointerId, { x: e.clientX, y: e.clientY }); paint(); }
  });
  function up(e) {
    const had = P.delete(e.pointerId); if (P.size < 2) pinch0 = null; if (!P.size) img.classList.remove('drag');
    if (had && downOnBg && moved < 6 && e.target === lb && e.type === 'pointerup') closeLb(); downOnBg = false;
  }
  lb.addEventListener('pointerup', up); lb.addEventListener('pointercancel', up);
  img.addEventListener('dblclick', e => { const big = s > fit * 1.05; zoomAt(big ? fit : Math.min(1, fit * 5), e.clientX, e.clientY); });
  addEventListener('resize', () => { if (!open) return; const r = s / fit; fit = Math.min(innerWidth * .92 / NW, innerHeight * .86 / NH); s = fit * r; paint(); });
  addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); closeLb(); }
    else if (e.key === 'Tab') { e.preventDefault(); x.focus(); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomAt(s * 1.25, innerWidth / 2, innerHeight / 2); }
    else if (e.key === '-') { e.preventDefault(); zoomAt(s / 1.25, innerWidth / 2, innerHeight / 2); }
    else if (e.key === '0') { e.preventDefault(); zoomAt(fit, innerWidth / 2, innerHeight / 2); }
    else if ([' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) e.preventDefault();
  });
})();

// 2. Scroll-pinned hero: "Estovam Tech" splits apart, the tagline lights up word by word,
//    and the shell compare wipes from solid to clear. Scroll progress p runs 0 to 1 across .es-reveal.
(function () {
  const box = document.getElementById('reveal'); if (!box) return;
  const ws = [...box.querySelectorAll('.w')], words = document.getElementById('words'), b1 = document.getElementById('b1'), b2 = document.getElementById('b2'),
    cmp = document.getElementById('cmp'), B = document.getElementById('cmpB'), line = document.getElementById('cmpLine'),
    rng = document.getElementById('cmpRange'), rd = document.getElementById('cmpRead'), lbl = document.getElementById('cmpLbl');
  // The "clear shell" half of the compare reuses the clear render from the design section
  const src = document.querySelector('#design img'); if (src) B.src = src.src;
  box.classList.add('reveal-ready');
  const A0 = .15, A1 = .85, cl = x => Math.min(Math.max(x, 0), 1), ease = t => t * t * (3 - 2 * t);
  let v = 0, vt = 0, manual = false, catching = false, lastP = -1, lastIn = -1e9, vraf = 0, vlt = 0, tp = 0, sp = -1, raf = 0, lt = 0;
  function show() {
    const x = (A0 + (A1 - A0) * v) * 100; B.style.clipPath = 'inset(0 ' + (100 - x) + '% 0 0)'; line.style.left = x + '%';
    rd.textContent = 'Shell ' + Math.round((1 - v) * 100) + '%'; lbl.textContent = v < .5 ? 'Solid shell' : 'Clear shell';
    if (performance.now() - lastIn > 300) rng.value = Math.round(v * 100);
    rng.setAttribute('aria-valuetext', (v < .5 ? 'Solid shell, ' : 'Clear shell, ') + Math.round((v < .5 ? 1 - v : v) * 100) + ' percent');
  }
  function stepV(now) { vraf = 0; const dt = Math.min(now - vlt, 64); vlt = now; v += (vt - v) * (1 - Math.exp(-dt / 130)); if (Math.abs(vt - v) < .002) { v = vt; if (!manual) catching = false; } show(); if (v !== vt) vraf = requestAnimationFrame(stepV); }
  function kickV() { if (!vraf) { vlt = performance.now(); vraf = requestAnimationFrame(stepV); } }
  function render(p) {
    const t = ease(cl((p - .03) / .14));
    b1.style.transform = 'translate3d(' + (-t * 60).toFixed(3) + 'vw,0,0)'; b2.style.transform = 'translate3d(' + (t * 60).toFixed(3) + 'vw,0,0)';
    b1.style.opacity = b2.style.opacity = (1 - t).toFixed(3);
    const o = cl((p - .12) / .08); words.style.opacity = o.toFixed(3); cmp.style.opacity = o.toFixed(3);
    const k = p < .42 ? 0 : p < .66 ? 1 : 2; ws.forEach((w, i) => w.classList.toggle('act', o > 0 && i === k));
    cmp.style.pointerEvents = o > .4 ? 'auto' : 'none'; cmp.style.visibility = o > 0 ? 'visible' : 'hidden';
    if (!manual) { const sv = cl((p - .3) / .6); if (catching) { vt = sv; kickV(); } else { v = vt = sv; show(); } }
  }
  function step(now) {
    raf = 0; if (sp < 0) sp = tp; const dt = Math.min(now - lt, 64); lt = now;
    sp += (tp - sp) * (1 - Math.exp(-dt / 110)); if (Math.abs(tp - sp) < .0003) sp = tp;
    render(sp); if (sp !== tp) raf = requestAnimationFrame(step);
  }
  function upd() {
    const r = box.getBoundingClientRect(), span = r.height - innerHeight, p = span > 0 ? cl(-r.top / span) : 1;
    if (Math.abs(p - lastP) > .0005) { if (lastP >= 0 && manual) { manual = false; catching = true; } lastP = p; }
    tp = p; if (!raf) { lt = performance.now(); raf = requestAnimationFrame(step); }
  }
  rng.addEventListener('input', () => { manual = true; catching = false; lastIn = performance.now(); vt = rng.value / 100; kickV(); });
  addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
})();

// 3. Caption scramble: HUD captions on the renders decode when they scroll into view or on hover
(function () {
  const CH = '!<>-_[]{}=+*^?#0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  function run(el) {
    if (el._run) return; el._run = true;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), list = []; let n;
    while (n = w.nextNode()) if (n.nodeValue.trim()) list.push({ n, t: n.nodeValue });
    const total = list.reduce((a, x) => a + x.t.length, 0), t0 = performance.now(), dur = 900; let last = 0, cache = [];
    (function f(now) {
      const p = Math.min((now - t0) / dur, 1), res = Math.floor(p * p * total * 1.15);
      if (now - last > 45 || p === 1) {
        last = now; cache = []; let i = 0;
        list.forEach(x => { let o = ''; for (const c of x.t) { o += (i < res || c === ' ' || c === '/') ? c : CH[Math.random() * CH.length | 0]; i++; } cache.push(o); });
        list.forEach((x, k) => x.n.nodeValue = cache[k]);
      }
      if (p < 1) requestAnimationFrame(f); else { list.forEach(x => x.n.nodeValue = x.t); el._run = false; }
    })(t0);
  }
  const caps = document.querySelectorAll('.es-frame--img .es-frame__tl');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: .4 });
  caps.forEach(c => { io.observe(c); c.parentElement.addEventListener('mouseenter', () => run(c)); });
})();

// 4. Split-flap letters on the contact buttons (bottom bar and footer)
(function () {
  const big = document.querySelector('.es-cta__big'), barParts = document.querySelectorAll('.es-bar .es-btn span');
  if (!big || !barParts.length) return;
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function flapify(el) {
    const txt = el.textContent.trim(); el.setAttribute('aria-label', txt);
    el.textContent = ''; const wrap = document.createElement('span'); wrap.setAttribute('aria-hidden', 'true'); el.appendChild(wrap);
    const cells = [];
    [...txt].forEach(ch => {
      if (ch === ' ') { wrap.appendChild(document.createTextNode(' ')); return; }
      const c = document.createElement('span'); c.className = 'sf';
      c.innerHTML = '<span class="m"></span><span class="g"></span>';
      c.querySelector('.m').textContent = ch; const g = c.querySelector('.g'); g.textContent = ch; c._g = g; c._ch = ch; wrap.appendChild(c); cells.push(c);
    });
    function spin(c, next, done) {
      const g = c._g, P = 'perspective(500px) rotateY(';
      g.animate([{ transform: P + '0deg)', offset: 0, easing: 'ease-in' }, { transform: P + '90deg)', offset: .5 }, { transform: P + '-90deg)', offset: .5001, easing: 'ease-out' }, { transform: P + '0deg)', offset: 1 }], { duration: 230, easing: 'linear' }).onfinish = done;
      setTimeout(() => { g.textContent = next; }, 115);
    }
    let running = false;
    function run() {
      if (running) return; running = true; let left = cells.length;
      cells.forEach((c, k) => {
        let steps = 2 + (k % 2);
        const go = () => {
          const last = steps <= 1, next = last ? c._ch : ABC[Math.random() * 26 | 0];
          spin(c, next, () => { if (last) { if (--left === 0) running = false; } else { steps--; go(); } });
        };
        setTimeout(go, k * 55);
      });
    }
    return { run };
  }
  const bars = [...barParts].map(flapify), F2 = flapify(big);
  setTimeout(() => bars.forEach(f => f.run()), 600);
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { F2.run(); io.disconnect(); } }), { threshold: .4 }); io.observe(big);
})();
