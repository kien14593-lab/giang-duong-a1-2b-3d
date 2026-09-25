// Chế độ "Phối cảnh đẹp": bầu trời + phản chiếu môi trường (ảnh CC0 Poly Haven), bóng tiếp xúc (GTAO), loá sáng nhẹ,
// bóng đổ nét hơn, đèn trong nhà, tinh chỉnh vật liệu kính/kim loại/nền, bối cảnh (dressing.js) và chụp ảnh độ phân giải cao.
// Mọi thay đổi chỉ áp dụng khi bật và được khôi phục khi tắt; phần dựng thêm không thuộc mô hình xuất glTF/OBJ.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { M, V, planes, canvasTexture, worldTex, TOP, L } from './common.js';
import { buildDressing, grassTexture, DG } from './dressing.js';

const HAZE = 0x989dac;   // màu chân trời của ảnh bầu trời = màu sương xa
const TWEAK = {
  glass: { color: 0x6b9cc6, opacity: 0.5, roughness: 0.02, metalness: 0.2, ior: 1.9 },
  cwGlass: { roughness: 0.02, metalness: 0.2, ior: 1.9 }, cwGlass2: { roughness: 0.02, metalness: 0.25, ior: 1.9 },
  cwGlass3: { roughness: 0.02, metalness: 0.25, ior: 1.9 }, railGlass: { roughness: 0.02, ior: 1.7 },
  gold: { metalness: 0.7, roughness: 0.32 }, gold2: { metalness: 0.65, roughness: 0.34 }, bronze: { metalness: 0.6, roughness: 0.42 },
  mullion: { metalness: 0.7, roughness: 0.3 }, cwFrame: { metalness: 0.6, roughness: 0.35 }, steel: { metalness: 0.8, roughness: 0.3 },
  dark: { roughness: 0.15, metalness: 0.5 }, water: { roughness: 0.05, metalness: 0.3 }, pave: { color: 0xffffff },
};
const GLASS = ['glass', 'railGlass', 'cwGlass', 'cwGlass2', 'cwGlass3'];
const SIMPLE_SITE = () => new Set([M.trunk, M.leaf, M.leaf2, M.p1, M.p2, M.p3]);
const noop = THREE.Material.prototype.onBeforeCompile, keyFn = THREE.Material.prototype.customProgramCacheKey;
const WARM = new THREE.Color(0xfff0dc), LAMP = new THREE.Color(0xffe2b4);

// kính: phản chiếu (specular) không bị nhân với độ trong suốt → kính phản chiếu bầu trời như ảnh phối cảnh
function glassPatch(m, on) {
  if (on) {
    m.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <opaque_fragment>', 'gl_FragColor = vec4( totalDiffuse * diffuseColor.a + totalSpecular + totalEmissiveRadiance, diffuseColor.a );')
        .replace('#include <premultiplied_alpha_fragment>', '');
    };
    m.customProgramCacheKey = () => 'glassRender';
  } else { m.onBeforeCompile = noop; m.customProgramCacheKey = keyFn; }
  m.premultipliedAlpha = on; m.needsUpdate = true;
}
// gạch lát sân 0,6 × 0,6 m (1 ô texture = 4,8 m)
function paveTexture() {
  let s = 99; const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  return canvasTexture(512, 512, (c, w, h) => {
    const n = 8, t = w / n;
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) { const v = 206 + Math.round((rnd() - 0.5) * 18); c.fillStyle = `rgb(${v},${v - 3},${v - 9})`; c.fillRect(a * t, b * t, t, t); }
    const img = c.getImageData(0, 0, w, h), d = img.data;
    for (let p = 0; p < d.length; p += 4) { const k = (rnd() - 0.5) * 16; d[p] += k; d[p + 1] += k; d[p + 2] += k; }
    c.putImageData(img, 0, 0);
    c.fillStyle = 'rgba(95,90,82,0.6)';
    for (let a = 0; a < n; a++) { c.fillRect(a * t, 0, 2, h); c.fillRect(0, a * t, w, 2); }
  });
}
// nền trời dịu khi tắt ảnh bầu trời (và cho ảnh chụp ở chế độ thường – canvas vốn trong suốt)
function gradientTexture() {
  return canvasTexture(4, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#a9cdec'); g.addColorStop(0.45, '#d6e8f7'); g.addColorStop(1, '#eef4f9');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
}
function mergeAll(geos) {
  const n = geos.reduce((a, g) => a + g.attributes.position.count, 0), pos = new Float32Array(n * 3), idx = [];
  let o = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, o * 3);
    for (const i of g.index.array) idx.push(i + o);
    o += g.attributes.position.count; g.dispose();
  }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setIndex(idx); return m;
}

export function initRender({ renderer, scene, camera, sun, hemi, getFloors, getSite, helpers, $, onToggle }) {
  const opt = { sky: true, ao: true, ctx: true, lights: true, bloom: true, exposure: 1.0 };
  let on = false, want = false, ready = null, composer, gtao, bloom, smaa, rpr = 1, skyBg, env, disk, dressing = null, dressProp = null, gradBg = null;
  const fog = new THREE.FogExp2(HAZE, 0.0012), saved = new Map(), hidden = [];
  const info = t => { const el = $('#rInfo'); if (el) el.innerHTML = t; };
  const lampMat = new THREE.MeshBasicMaterial({ color: LAMP.clone(), side: THREE.DoubleSide });
  lampMat.clippingPlanes = planes; lampMat.userData.shared = true;
  const paveTex = paveTexture();

  function ensure() {
    if (ready) return ready;
    info('Đang tải bầu trời &amp; dựng bối cảnh…');
    const ld = new THREE.TextureLoader();
    ready = Promise.all([ld.loadAsync('env/sky_4k.jpg'), ld.loadAsync('env/sky_1k.jpg')]).then(([big, small]) => {
      for (const t of [big, small]) { t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; }
      skyBg = big;
      const pm = new THREE.PMREMGenerator(renderer); env = pm.fromEquirectangular(small).texture; pm.dispose(); small.dispose();
      // nền cỏ rộng thay khối đất kỹ thuật; đẩy lùi độ sâu để đường/vỉa hè sát mặt cỏ không nhấp nháy khi nhìn xa
      const gm = new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 1, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 4 });
      worldTex(gm, 8);
      disk = new THREE.Mesh(new THREE.CircleGeometry(3500, 96), gm);
      disk.rotation.x = -Math.PI / 2; disk.position.y = DG; disk.receiveShadow = true; disk.name = 'NenCo'; disk.visible = false;
      disk.raycast = () => {};
      scene.add(disk);
      makeComposer();
    });
    ready.catch(() => { ready = null; });
    return ready;
  }

  const samples = () => (renderer.capabilities.isWebGL2 && renderer.capabilities.maxSamples >= 4 ? 4 : 0);
  const pixelRatio = size => Math.min(devicePixelRatio, size.x * size.y > 1.5e6 ? 1 : 1.5);
  function makeComposer() {
    const size = renderer.getSize(new THREE.Vector2());
    rpr = pixelRatio(size);
    const rt = new THREE.WebGLRenderTarget(size.x * rpr, size.y * rpr, { type: THREE.HalfFloatType, samples: samples() });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(rpr); composer.setSize(size.x, size.y);
    const w = size.x * rpr, h = size.y * rpr;
    gtao = new GTAOPass(scene, camera, w, h);
    gtao.normalMaterial.clippingPlanes = planes;
    gtao.updateGtaoMaterial({ radius: 1.6, distanceExponent: 1.5, thickness: 2.0, scale: 1.0, samples: 16, distanceFallOff: 1.0, screenSpaceRadius: false });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, radiusExponent: 1, rings: 2, samples: 16 });
    gtao.blendIntensity = 0.9;
    // lượt vẽ pháp tuyến/độ sâu của AO: bỏ tán lá (thẻ alpha) và nền trời (nền phẳng bị vẽ bằng vật liệu ghi đè)
    const ov = gtao.overrideVisibility.bind(gtao), rv = gtao.restoreVisibility.bind(gtao);
    let bg = null;
    gtao.overrideVisibility = () => { ov(); bg = scene.background; scene.background = null; scene.traverse(o => { if (o.userData.noAO) o.visible = false; }); };
    gtao.restoreVisibility = () => { rv(); scene.background = bg; };
    bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.22, 0.5, 1.0);
    const out = new OutputPass();   // canvas có kênh alpha → ép alpha = 1 (mép lá alpha-to-coverage không bị trong suốt)
    out.material.fragmentShader = out.material.fragmentShader.replace(/\}\s*$/, '\tgl_FragColor.a = 1.0;\n}');
    smaa = new SMAAPass(w, h);
    composer.addPass(new RenderPass(scene, camera)); composer.addPass(gtao); composer.addPass(bloom); composer.addPass(out); composer.addPass(smaa);
    passes();
  }
  function setSamples(n) {
    for (const rt of [composer.renderTarget1, composer.renderTarget2]) if (rt.samples !== n) { rt.samples = n; rt.dispose(); }
    passes();
  }
  function passes() { if (!composer) return; gtao.enabled = opt.ao; bloom.enabled = opt.bloom; smaa.enabled = composer.renderTarget1.samples === 0; }

  // ---- áp dụng / khôi phục
  function materials(v) {
    for (const [k, t] of Object.entries(TWEAK)) {
      const m = M[k]; if (!m) continue;
      if (v) {
        const s = {}; for (const p of Object.keys(t)) s[p] = p === 'color' ? m.color.getHex() : m[p];
        saved.set(m, s);
        for (const [p, x] of Object.entries(t)) if (p === 'color') m.color.setHex(x); else if (p in m) m[p] = x;
      } else {
        const s = saved.get(m); if (!s) continue;
        for (const [p, x] of Object.entries(s)) if (p === 'color') m.color.setHex(x); else if (p in m) m[p] = x;
        saved.delete(m);
      }
    }
    GLASS.forEach(k => glassPatch(M[k], v));
    M.pave.map = v ? paveTex : null;
    if (v) worldTex(M.pave, 4.8); else { M.pave.onBeforeCompile = noop; M.pave.customProgramCacheKey = keyFn; M.pave.needsUpdate = true; }
  }
  function shadows(v) {
    const sc = sun.shadow.camera, e = v ? 75 : 70, n = v ? 4096 : 2048;
    sun.shadow.mapSize.set(n, n);
    Object.assign(sc, { left: -e, right: e, top: e, bottom: -e }); sc.updateProjectionMatrix();
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  }
  function sky() {
    if (!on) return;
    scene.background = opt.sky ? skyBg : (gradBg || (gradBg = gradientTexture()));
    scene.environment = opt.sky ? env : null; scene.fog = opt.sky ? fog : null;
  }
  // phần phụ thuộc lần dựng mô hình (dựng lại khi đổi phương án/mặt đứng)
  function perBuild() {
    getFloors().forEach(f => f.group.children.filter(o => o.userData.renderOnly).forEach(o => { f.group.remove(o); o.geometry.dispose(); }));
    hidden.forEach(o => { o.visible = true; }); hidden.length = 0;
    if (!on) return;
    if (opt.lights) getFloors().slice(0, 9).forEach((f, i) => f.group.add(lamps(i)));
    const site = getSite(), simple = SIMPLE_SITE();
    if (site) site.traverse(o => { if (o.isMesh && o.visible && (o.material === M.ground || (opt.ctx && simple.has(o.material)))) { o.visible = false; hidden.push(o); } });
    if (opt.ctx && (!dressing || dressProp !== V.proposal)) {
      if (dressing) { scene.remove(dressing); dressing.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); }
      dressing = buildDressing(); dressProp = V.proposal; scene.add(dressing);
    }
    if (dressing) dressing.visible = opt.ctx;
  }
  // đèn ốp trần ánh vàng ấm (nhìn thấy qua kính); T1 bỏ vùng thông tầng hội trường
  function lamps(i) {
    const geos = [], z = TOP[i] - 0.17;
    for (let x = 1.4; x < L - 1; x += 2.5) {
      if ([8.2, 18.2, 28.2, 38.2].some(c => Math.abs(x - c) < 0.9)) continue;
      for (const y of [1.5, 3.4, 5.9, 7.9, 10.1, 11.9]) {
        if (i === 0 && x > 10.3 && x < 36.1 && y > 2.3 && y < 10.5) continue;
        const g = new THREE.PlaneGeometry(1.2, 0.22); g.rotateX(Math.PI / 2); g.translate(x, z, -y); geos.push(g);
      }
    }
    const m = new THREE.Mesh(mergeAll(geos), lampMat);
    m.name = 'DenTrongNha'; m.userData.renderOnly = true; m.raycast = () => {};
    return m;
  }

  async function setOn(v) {
    want = !!v;
    if (want === on) return;
    if (want) {
      try { await ensure(); } catch (e) {
        want = false; info('Không tải được ảnh bầu trời (env/sky_*.jpg): ' + (e && e.message ? e.message : e)); onToggle && onToggle(false); return;
      }
      if (!want || on) return;   // đã tắt lại trong lúc tải
      on = true; materials(true); shadows(true); camera.far = 4000; camera.updateProjectionMatrix(); disk.visible = true; sky(); perBuild(); resize();
    } else {
      on = false; materials(false); shadows(false); camera.far = 1200; camera.updateProjectionMatrix();
      scene.background = null; scene.environment = null; scene.fog = null; scene.backgroundIntensity = 1;
      disk.visible = false; if (dressing) dressing.visible = false; perBuild();
    }
    info(on ? 'Đang ở chế độ phối cảnh đẹp. Xoay/thu phóng như bình thường; máy yếu có thể chậm – tắt AO/bối cảnh nếu cần.' : 'Đang ở chế độ kỹ thuật (màu công năng, nền trơn).');
    onToggle && onToggle(on);
  }
  function set(k, v) {
    opt[k] = v;
    if (!on) return;
    if (k === 'sky') sky(); else if (k === 'ao' || k === 'bloom') passes(); else if (k === 'ctx' || k === 'lights') perBuild();
  }

  // Ánh sáng tạm thời cho khung hình: nắng mạnh hơn, trời (hemi) yếu đi vì đã có ảnh môi trường; chiều tối → tối dần, đèn sáng hơn
  function renderFrame() {
    const si = sun.intensity, hi = hemi.intensity, sc = sun.color.clone(), ex = renderer.toneMappingExposure;
    const k = THREE.MathUtils.clamp((si - 0.25) / 2.0, 0, 1);
    scene.backgroundIntensity = opt.sky ? 0.25 + 0.75 * k : 1;
    fog.color.setHex(HAZE).multiplyScalar(scene.backgroundIntensity);   // sương xa tối theo bầu trời → không lộ dải sáng ở chân trời lúc chiều tối
    sun.intensity = si * 1.15; hemi.intensity = hi * (opt.sky ? 0.3 : 0.75); sun.color.lerp(WARM, 0.5 * k);
    renderer.toneMappingExposure = opt.exposure * (0.55 + 0.45 * k);
    lampMat.color.copy(LAMP).multiplyScalar(1.5 + 2.5 * (1 - k));
    bloom.threshold = 1.0 + 1.6 * k;
    renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;   // AO vẽ cảnh lần 2 → không vẽ lại shadow map
    try { composer.render(); } finally {
      renderer.shadowMap.autoUpdate = true;
      sun.intensity = si; hemi.intensity = hi; sun.color.copy(sc); renderer.toneMappingExposure = ex;
    }
  }
  function resize() {
    if (!composer) return;
    const size = renderer.getSize(new THREE.Vector2());
    rpr = pixelRatio(size); composer.setPixelRatio(rpr); composer.setSize(size.x, size.y);
  }

  // Chụp ảnh w×h px theo góc nhìn hiện tại; nhãn chữ, lưới trục, đường đo và quỹ đạo mặt trời không nằm trong ảnh
  function shot(w, h) {
    const pr = renderer.getPixelRatio(), size = renderer.getSize(new THREE.Vector2()), asp = camera.aspect, bg0 = scene.background, bi0 = scene.backgroundIntensity;
    const hid = helpers().filter(o => o && o.visible); hid.forEach(o => { o.visible = false; });
    let p;
    renderer.setPixelRatio(1); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    try {
      if (on) { setSamples(w * h > 2.6e6 ? 0 : samples()); composer.setPixelRatio(1); composer.setSize(w, h); renderFrame(); }
      else { scene.background = gradBg || (gradBg = gradientTexture()); scene.backgroundIntensity = 1; renderer.render(scene, camera); }
      // toBlob sao chép ảnh ngay khi gọi → khôi phục kích thước ngay sau đó được
      p = new Promise((res, rej) => renderer.domElement.toBlob(b => (b ? res(b) : rej(new Error('Trình duyệt không tạo được ảnh PNG'))), 'image/png'));
    } finally {
      scene.background = bg0; scene.backgroundIntensity = bi0;
      hid.forEach(o => { o.visible = true; });
      renderer.setPixelRatio(pr); renderer.setSize(size.x, size.y, false);
      camera.aspect = asp; camera.updateProjectionMatrix();
      if (on) { setSamples(samples()); resize(); }
    }
    return p;
  }

  // Xuất glTF/OBJ khi đang bật: tạm trả vật liệu kỹ thuật, hiện lại nền/cây/người đơn giản, ẩn đèn trang trí
  function exportGuard() {
    if (!on) return () => {};
    const lampsOn = [];
    getFloors().forEach(f => f.group.children.forEach(o => { if (o.userData.renderOnly && o.visible) { o.visible = false; lampsOn.push(o); } }));
    const back = hidden.slice(); back.forEach(o => { o.visible = true; });
    materials(false);
    return () => { materials(true); lampsOn.forEach(o => { o.visible = true; }); back.forEach(o => { o.visible = false; }); };
  }

  return { get on() { return on; }, opt, setOn, set, render: renderFrame, resize, shot, exportGuard, afterBuild: () => { if (on) perBuild(); } };
}
