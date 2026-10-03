/* The 3D robot viewer. Used on Home and on the robot page.
   Needs, in this order on the page: three.js, OrbitControls, assets/models/robot-model.js, this file.
   Needs these ids in the page (copy the viewer block from index.html):
     viewer, lock, msg, az, el, zm, live, segShell, parts
   On phones it caps the pixel ratio at 2 and the shadow map at 1024, and does not even
   build the model until the viewer scrolls into view. Everywhere it stops drawing
   frames while the viewer is off screen. */
(function () {
  const box = document.getElementById('viewer'), msg = document.getElementById('msg');
  if (!box) return;

  const phone = matchMedia('(max-width: 760px)').matches;
  const lock = document.getElementById('lock');

  // "Click to interact" cover: unlocks mouse and touch control with a circular wipe
  window.__unlocked = false;
  if (lock) lock.addEventListener('click', () => {
    if (window.__unlocked) return;
    window.__unlocked = true;
    if (window.__ctl) window.__ctl.enabled = true;
    box.classList.remove('locked');
    const R = Math.hypot(box.clientWidth, box.clientHeight) / 2 + 4, t0 = performance.now(), D = 750;
    (function f(now) {
      const p = Math.min((now - t0) / D, 1), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      lock.style.setProperty('--r', (R * e).toFixed(1) + 'px');
      if (p < 1) requestAnimationFrame(f); else lock.hidden = true;
    })(t0);
  });

  function fail(e) {
    if (msg) msg.textContent = 'The 3D model could not load in this browser.';
    if (lock) lock.hidden = true;
    const live = document.getElementById('live');
    if (live) live.textContent = 'Offline';
    console.error(e);
  }

  async function start() {
    try {
      const M = window.ROBOT_MODEL, META = M.meta, DATA = M.data;
      const bin = Uint8Array.from(atob(DATA), c => c.charCodeAt(0));
      const raw = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      const nv = META.nv, pos = new Uint16Array(raw, 0, nv * 3), nrm4 = new Int8Array(raw, nv * 6, nv * 4);
      const nrm = new Int8Array(nv * 3); for (let i = 0; i < nv; i++) { nrm[i * 3] = nrm4[i * 4]; nrm[i * 3 + 1] = nrm4[i * 4 + 1]; nrm[i * 3 + 2] = nrm4[i * 4 + 2]; }
      const idx = new Uint32Array(raw.slice(nv * 10));
      const g = new THREE.BufferGeometry();
      const P = new Float32Array(nv * 3); for (let i = 0; i < nv * 3; i++) P[i] = pos[i] / 65535 * META.sc + META.mn[i % 3];
      g.setAttribute('position', new THREE.BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3, true));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      const glass = [], mats = []; let offset = 0;
      META.mats.forEach((m, i) => {
        const clear = /Glass|Polycarbonate|Translucent/.test(m.name), metal = /Steel|Lead/.test(m.name);
        const mt = new (clear ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({ color: new THREE.Color(m.kd[0], m.kd[1], m.kd[2]).convertSRGBToLinear(), metalness: metal ? .9 : .05, roughness: metal ? .3 : (clear ? .02 : .45), envMapIntensity: 1, side: clear ? THREE.FrontSide : THREE.DoubleSide });
        if (clear) { mt.transparent = true; mt.opacity = .3; mt.clearcoat = 1; mt.clearcoatRoughness = .02; mt.envMapIntensity = 3; mt.reflectivity = 1; mt.depthWrite = false; glass.push(mt); }
        g.addGroup(offset, m.count, i); offset += m.count; mats.push(mt);
      });
      const mesh = new THREE.Mesh(g, mats); mesh.castShadow = true; mesh.receiveShadow = true;
      const grp = new THREE.Group(); grp.add(mesh);
      g.computeBoundingBox(); const bb = g.boundingBox.clone(), c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
      mesh.position.sub(c);
      const scene = new THREE.Scene(); scene.add(grp);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x404048, .35));
      const shadowSize = phone ? 1024 : 2048;
      const d1 = new THREE.DirectionalLight(0xffffff, 1.6); d1.position.set(30, 60, 40); d1.castShadow = true;
      d1.shadow.mapSize.set(shadowSize, shadowSize); Object.assign(d1.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 200 }); d1.shadow.bias = -.0004; d1.shadow.radius = 4; scene.add(d1);
      const d2 = new THREE.DirectionalLight(0xbfd0ff, .7); d2.position.set(-40, 10, -30); scene.add(d2);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.ShadowMaterial({ opacity: .4 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -sz.y / 2; floor.receiveShadow = true; scene.add(floor);
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      r.setPixelRatio(Math.min(devicePixelRatio, phone ? 2 : 3));
      r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
      r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
      const env = new THREE.Scene(); env.background = new THREE.Color(0x1c1d20);
      const soft = (w, h, x, y, z, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
      soft(80, 50, 0, 70, 0, 12); soft(14, 80, 70, 10, 20, 14); soft(14, 80, -70, 10, -20, 10); soft(60, 20, 0, -5, -70, 4); soft(40, 14, 40, 30, 60, 14);
      const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(env, .03).texture; pm.dispose();
      box.insertBefore(r.domElement, box.firstChild);
      const cam = new THREE.PerspectiveCamera(35, 1, 1, 500);
      const dist = Math.max(sz.x, sz.y, sz.z) * 1.9; cam.position.set(dist * .55, dist * .25, dist * .85);
      const ctl = new THREE.OrbitControls(cam, r.domElement); window.__ctl = ctl; ctl.enabled = !!window.__unlocked; ctl.enableDamping = true; ctl.enablePan = true; ctl.screenSpacePanning = true; ctl.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }; r.domElement.addEventListener('contextmenu', e => e.preventDefault()); ctl.minDistance = dist * .35; ctl.maxDistance = dist * 2;
      const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      ctl.autoRotate = !calm; ctl.autoRotateSpeed = 1.2; ctl.addEventListener('start', () => ctl.autoRotate = false);
      function size() { const w = box.clientWidth, h = box.clientHeight; r.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }
      size(); addEventListener('resize', size);
      let mode = 'clear', smode = 'clear'; const shellBase = new Map(); mats.forEach((mt, i) => { if (META.mats[i].cat === 'shell') shellBase.set(mt, mt.color.clone()); });
      const NOISE = `float hh(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hh(i),hh(i+vec3(1.,0.,0.)),f.x),mix(hh(i+vec3(0.,1.,0.)),hh(i+vec3(1.,1.,0.)),f.x),f.y),mix(mix(hh(i+vec3(0.,0.,1.)),hh(i+vec3(1.,0.,1.)),f.x),mix(hh(i+vec3(0.,1.,1.)),hh(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}
float fld(vec3 p){float h=(p.y-uMin)/uRange;return h+.05*sin(p.x*.16+p.z*.11+h*2.)+(vn(p*.07)-.5)*.14;}
`;
      function attach(mt, side) {
        const u = { uU: { value: 0 }, uOn: { value: 0 }, uSide: { value: side }, uMin: { value: bb.min.y }, uRange: { value: bb.max.y - bb.min.y } }; mt.userData.u = u;
        mt.onBeforeCompile = sh => {
          Object.assign(sh.uniforms, u);
          sh.vertexShader = 'varying vec3 vOP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP=position;');
          sh.fragmentShader = 'varying vec3 vOP;\nuniform float uU;uniform float uOn;uniform float uSide;uniform float uMin;uniform float uRange;\n' + NOISE + sh.fragmentShader
            .replace('void main() {', 'void main() {\nfloat F=fld(vOP);if(uOn>.5&&(uSide>0.?F<uU:F>=uU))discard;')
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nif(uOn>.5)totalEmissiveRadiance+=vec3(1.)*(1.-smoothstep(0.,.09,abs(F-uU)))*1.9;');
        };
        mt.customProgramCacheKey = () => 'shellfx' + side;
      }
      const shellMats = mats.filter((_, i) => META.mats[i].cat === 'shell'); shellMats.forEach(m => attach(m, 1));
      const matsB = mats.map((mt, i) => {
        if (META.mats[i].cat !== 'shell') return new THREE.MeshBasicMaterial({ visible: false });
        const b = new THREE.MeshPhysicalMaterial({ color: shellBase.get(mt).clone(), metalness: .05 }); b.userData.base = shellBase.get(mt); attach(b, -1); return b;
      });
      const shellB = matsB.filter(m => m.userData.base);
      const meshB = new THREE.Mesh(g, matsB); meshB.position.copy(mesh.position); meshB.visible = false; grp.add(meshB);
      function styleShell(mt, hit, md) {
        const base = shellBase.get(mt) || mt.userData.base;
        if (md === 'white') { mt.color.setRGB(.95, .95, .93).convertSRGBToLinear(); mt.transparent = false; mt.opacity = 1; mt.depthWrite = true; mt.roughness = .42; mt.clearcoat = .2; mt.clearcoatRoughness = .3; mt.envMapIntensity = 1.1; mt.side = THREE.DoubleSide; }
        else { mt.color.copy(base); mt.transparent = true; mt.opacity = hit ? .75 : .3; mt.depthWrite = false; mt.roughness = .02; mt.clearcoat = 1; mt.clearcoatRoughness = .02; mt.envMapIntensity = 3; mt.side = THREE.FrontSide; }
      }
      function setFx(on, u) { shellMats.concat(shellB).forEach(m => { m.userData.u.uOn.value = on; m.userData.u.uU.value = u; }); }
      const ease = t => .5 - .5 * Math.cos(Math.PI * t); let anim = null;
      function finish() { if (!anim) return; const to = anim.to; anim = null; setFx(0, 0); meshB.visible = false; smode = to; apply(); }
      function goShell(to) {
        if (anim) finish(); if (sel.size || to === smode) { smode = to; apply(); return; }
        anim = { from: smode, to, t0: performance.now() };
        shellB.forEach(b => { styleShell(b, false, to === 'none' ? 'clear' : to); b.visible = to !== 'none'; b.needsUpdate = true; });
        meshB.visible = to !== 'none'; shellMats.forEach(m => { m.visible = anim.from !== 'none'; }); setFx(1, -.22);
      }
      function tickFx(now) { if (!anim) return; const p = Math.min((now - anim.t0) / 1100, 1); setFx(1, -.22 + 1.44 * ease(p)); if (p >= 1) finish(); }
      // Part groups for the index table. c lists the model categories each group isolates.
      // Select any number of groups. Selecting all of them shows the whole robot again.
      const G = [
        { n: 'Raspberry Pi 5', d: 'The robot\'s onboard computer. It runs the software that senses, decides, and moves, with Ethernet and USB ports reachable from outside', c: ['pi_board', 'pi_other', 'eth', 'usb', 'hdmi', 'sd', 'pins', 'chips', 'camconn'] },
        { n: 'ReSpeaker microphone board', d: 'Microphones on top of the head, so the robot can hear people and respond to what they say', c: ['mic'] },
        { n: 'NeoPixel LED stick', d: 'Eight RGB LEDs (WS2812) in the face that show what the robot is doing, so people can read its state at a glance', c: ['led'] },
        { n: 'Arducam IMX519 camera', d: 'The robot\'s eye. A 16 MP autofocus camera at the front of the head feeds vision to the onboard computer', c: ['cam'] },
        { n: 'Printed mounts and spacers', d: 'Nylon parts printed on a Formlabs Fuse 1 that hold every board in place, so the robot can be assembled and repaired with simple tools', c: ['mounts'] },
        { n: 'Outer shells', d: 'Four-section frosted shell that protects the electronics and comes off for service', c: ['shell'] }];
      const sel = new Set();
      function apply() {
        mats.forEach((mt, i) => {
          const m = META.mats[i], gl = glass.includes(mt), hit = sel.size && [...sel].some(g => g.c.includes(m.cat));
          if (m.cat === 'shell') { mt.visible = sel.size ? !!hit : smode !== 'none'; styleShell(mt, hit, smode); }
          else if (gl) { if (!sel.size) { mt.visible = true; mt.opacity = .3; } else { mt.visible = !!hit; mt.opacity = hit ? .75 : .3; } }
          else if (!sel.size || hit) { mt.transparent = false; mt.opacity = 1; mt.depthWrite = true; }
          else { mt.transparent = true; mt.opacity = .06; mt.depthWrite = false; }
          mt.emissive.setHex(hit ? 0x6a6a6a : 0); mt.needsUpdate = true;
        });
      }
      document.querySelectorAll('#segShell button').forEach(b => b.onclick = () => { mode = b.dataset.m; document.querySelectorAll('#segShell button').forEach(x => x.setAttribute('aria-pressed', x === b)); goShell(mode); });
      const tb = document.getElementById('parts');
      const rows = [];
      if (tb) G.forEach(gr => {
        const n = gr.c.reduce((a, x) => a + (META.catn[x] || 0), 0); if (!n) return;
        const tr = document.createElement('tr'); tr.innerHTML = '<td class="n"></td><td class="name"><button type="button" aria-pressed="false"></button></td><td></td><td class="num"></td>';
        tr.children[0].textContent = String(tb.children.length + 1).padStart(2, '0'); tr.querySelector('button').textContent = gr.n; tr.children[2].textContent = gr.d; tr.children[3].textContent = n.toLocaleString('en-US');
        tr.onclick = () => {
          if (sel.has(gr)) sel.delete(gr); else sel.add(gr);
          // Every group selected is the same as none: back to the full robot
          if (sel.size === rows.length) sel.clear();
          rows.forEach(x => { const on = sel.has(x.gr); x.tr.classList.toggle('on', on); if (on) x.tr.setAttribute('aria-selected', 'true'); else x.tr.removeAttribute('aria-selected'); x.tr.querySelector('button').setAttribute('aria-pressed', on); });
          apply();
        };
        rows.push({ gr, tr });
        tb.appendChild(tr);
      });
      if (msg) msg.remove();
      const live = document.getElementById('live'); if (live) { live.textContent = 'Live model'; live.classList.add('on'); setInterval(() => live.classList.toggle('off'), 1000); }
      const azE = document.getElementById('az'), elE = document.getElementById('el'), zmE = document.getElementById('zm'), sp = new THREE.Spherical(), tmp = new THREE.Vector3(); let last = '';

      // Draw frames only while the viewer is on screen
      let visible = false, running = false;
      function loop() {
        if (!visible) { running = false; return; }
        requestAnimationFrame(loop); tickFx(performance.now()); ctl.update(); r.render(scene, cam);
        sp.setFromVector3(tmp.copy(cam.position).sub(ctl.target));
        const az = Math.round((THREE.MathUtils.radToDeg(sp.theta) + 360) % 360), el = Math.round(90 - THREE.MathUtils.radToDeg(sp.phi)), zm = (dist / sp.radius).toFixed(1), k = az + '|' + el + '|' + zm;
        if (k !== last) { last = k; if (azE) azE.textContent = 'AZ ' + String(az).padStart(3, '0') + '°'; if (elE) elE.textContent = 'EL ' + String(el).padStart(2, '0') + '°'; if (zmE) zmE.textContent = 'Zoom ' + zm + '×'; }
      }
      function setVisible(v) { visible = v; if (v && !running) { running = true; loop(); } }
      if ('IntersectionObserver' in window) new IntersectionObserver(es => setVisible(es[es.length - 1].isIntersecting), { rootMargin: '100px' }).observe(box);
      else setVisible(true);
    } catch (e) { fail(e); }
  }

  if (!window.THREE || !window.ROBOT_MODEL) { fail(new Error('three.js or the robot model did not load')); return; }
  // Phones wait until the viewer is near the screen before doing any work
  if (phone && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { o.disconnect(); start(); } }, { rootMargin: '200px' });
    io.observe(box);
  } else start();
})();
