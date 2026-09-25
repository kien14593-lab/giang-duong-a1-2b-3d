// Ứng dụng: cảnh, camera, dựng/dựng lại mô hình theo phương án, giao diện điều khiển.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { KIND, kindColor, planes, FLOOR_NAME, ROOF, HC, V, M } from './common.js';
import { buildStorey, kindMats, plainMat } from './storey.js';
import { buildHall } from './hall.js';
import { buildRoof, buildSite, buildGrid } from './roofsite.js';
import { CHANGES } from './proposal.js';
import { CHANGES_V3 } from './v3.js';
import { initSun } from './sun.js';
import { initMeasure } from './measure.js';
import { initOverlay } from './overlay.js';
import { initExport } from './export.js';

const $ = s => document.querySelector(s);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;
document.body.insertBefore(renderer.domElement, $('#labels'));
const labelRenderer = new CSS2DRenderer({ element: $('#labels') }); labelRenderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
const hemi = new THREE.HemisphereLight(0xdff0ff, 0x8a7f6a, 0.95); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.3);
sun.position.set(-40, 75, 50); sun.target.position.set(HC, 15, -6.5); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 320 });

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.3, 1200);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI * 0.55; controls.autoRotateSpeed = 0.8;

// ---- dựng mô hình (có thể dựng lại khi đổi phương án)
const fmt = v => v.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
const S = { labels: false, facade: true, colors: true, grid: false, explode: 0, cutX: 47, cutY: 14, cutZ: 38, variant: 'orig', hl: false };
const building = new THREE.Group(); scene.add(building);
let floors = [], hover = [], site = null, propMeshes = [];
const grid = buildGrid(); scene.add(grid.group);
const overlay = initOverlay({ $ });

function mkLabel(d) {
  const el = document.createElement('div'); el.className = 'lbl';
  el.innerHTML = `<b>${d.rec.name}</b>` + (d.rec.area ? `<span>${d.rec.est ? '≈ ' : ''}${fmt(d.rec.area)} m²</span>` : '');
  const o = new CSS2DObject(el); o.position.set(d.x, d.z, -d.y); o.visible = false; return o;
}
function dispose(root) {
  root.traverse(o => {
    if (o.isCSS2DObject) o.element.remove();   // sự kiện 'removed' chỉ phát cho con trực tiếp
    if (o.isMesh) { o.geometry.dispose(); if (o.material.map && !o.userData.overlay && !o.userData.keep) { o.material.map.dispose(); o.material.dispose(); } }
  });
  while (root.children.length) root.remove(root.children[0]);
}
function build() {
  const vis = floors.map(f => f.group.visible);
  dispose(building); if (site) { scene.remove(site); dispose(site); }
  floors = []; hover = []; propMeshes = [];
  for (let i = 0; i < 9; i++) {
    const r = buildStorey(i); r.group.name = 'Tang_' + (i + 1);
    floors.push({ group: r.group, hover: r.hover, labels: r.labels.map(mkLabel), name: FLOOR_NAME[i] });
    r.labels.forEach((d, k) => r.group.add(floors[i].labels[k]));
    hover.push(...r.hover); building.add(r.group);
  }
  buildHall(floors[0].group, floors[1].group, hover).forEach(d => { const f = floors[d.rec.floor ?? 0], o = mkLabel(d); f.labels.push(o); f.group.add(o); });
  floors.push({ group: buildRoof(), hover: [], labels: [], name: 'Mái & tum' }); floors[9].group.name = 'Mai_Tum'; building.add(floors[9].group);
  site = buildSite(); site.name = 'KhuDat'; scene.add(site);
  building.name = 'GiangDuong_A1-2B_' + variantName();
  [building, site].forEach(g => g.traverse(o => { if (o.userData.prop) propMeshes.push(o); }));
  overlay.attach(floors); buildLegend();
  // áp lại trạng thái giao diện
  floors.forEach((f, i) => { f.group.visible = vis.length ? vis[i] : true; f.group.position.y = i * S.explode; });
  building.traverse(o => { if (o.userData.facade) o.visible = S.facade; });
  hover.forEach(m => { m.material = S.colors ? kindMats[m.userData.kind] : plainMat; });
  applyHighlight(); updateLabels();
}
function applyHighlight() {
  propMeshes.forEach(o => { o.material = S.hl ? M.prop : o.userData.mat0; });
}
const VARIANTS = {
  orig: { file: 'BanGoc', tag: 'BẢN GỐC · Hồ sơ TKSB', short: 'bản gốc', changes: null },
  prop: { file: 'DeXuat', tag: 'PHƯƠNG ÁN ĐỀ XUẤT', short: 'phương án đề xuất', changes: CHANGES },
  v3: { file: 'BaoCaoV3', tag: 'BÁO CÁO V3 · 24/09/2026', short: 'phương án theo Báo cáo V3', changes: CHANGES_V3 },
};
const variantName = () => VARIANTS[S.variant].file;
function setVariant(v) {
  if (!VARIANTS[v]) return;
  S.variant = v; V.proposal = v === 'prop'; V.v3 = v === 'v3';
  const d = VARIANTS[v];
  document.querySelectorAll('#variant .b').forEach(b => b.classList.toggle('on', b.dataset.variant === v));
  document.querySelectorAll('#variantNote > div').forEach(n => { n.style.display = n.dataset.variant === v ? '' : 'none'; });
  $('#variantTag').textContent = d.short;
  $('#banner .tag').textContent = d.tag;
  $('#banner .tag').className = 'tag ' + v;
  $('#changes').className = v; $('#changes').innerHTML = (d.changes || []).map(([c, t]) => `<li><b>${c}:</b> ${t}</li>`).join('');
  $('#changesBox').style.display = d.changes ? '' : 'none';
  $('#roominfo').style.display = 'none';
  build();
}
$('#variant').addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.variant !== S.variant) setVariant(b.dataset.variant); });
$('#hlOn').onchange = e => { S.hl = e.target.checked; applyHighlight(); };

// ---- tầng
const floorsEl = $('#floors');
for (let i = 0; i < 10; i++) {
  const row = document.createElement('div'); row.className = 'fl';
  row.innerHTML = `<input type="checkbox" checked data-i="${i}"><span class="nm" data-i="${i}">${i < 9 ? FLOOR_NAME[i] : 'Mái & tum'}</span><small>${i < 9 ? '+' + fmt([0, 4, 7.6, 11.2, 14.8, 18.4, 22, 25.6, 29.2][i]) : '+' + fmt(ROOF)}</small>`;
  floorsEl.appendChild(row);
}
floorsEl.addEventListener('change', e => { if (e.target.matches('input')) setFloor(+e.target.dataset.i, e.target.checked); });
floorsEl.addEventListener('click', e => { if (e.target.matches('.nm')) { const k = +e.target.dataset.i; floors.forEach((f, i) => setFloor(i, i === k)); } });
$('#allOn').onclick = () => floors.forEach((f, i) => setFloor(i, true));
$('#allOff').onclick = () => floors.forEach((f, i) => setFloor(i, false));
function setFloor(i, on) { floors[i].group.visible = on; floorsEl.querySelector(`input[data-i="${i}"]`).checked = on; updateLabels(); }
function updateLabels() {
  floors.forEach(f => f.labels.forEach(l => { l.visible = S.labels && f.group.visible; }));
  grid.labels.forEach(l => { l.visible = S.grid; });
}

const legend = $('#legend');
function buildLegend() {
  const used = new Set(hover.map(m => m.userData.kind)); legend.innerHTML = '';
  for (const [k, v] of Object.entries(KIND)) {
    if (!used.has(k)) continue;
    const it = document.createElement('div'); it.className = 'it';
    it.innerHTML = `<span class="sw" style="background:#${kindColor(k).getHexString()}"></span>${v.n}`; legend.appendChild(it);
  }
}

// ---- công cụ chung
$('#labelsOn').onchange = e => { S.labels = e.target.checked; updateLabels(); };
$('#facadeOn').onchange = e => { S.facade = e.target.checked; building.traverse(o => { if (o.userData.facade) o.visible = S.facade; }); };
$('#colorsOn').onchange = e => { S.colors = e.target.checked; hover.forEach(m => { m.material = S.colors ? kindMats[m.userData.kind] : plainMat; }); };
$('#gridOn').onchange = e => { S.grid = e.target.checked; grid.group.visible = S.grid; updateLabels(); };
$('#rotateOn').onchange = e => { controls.autoRotate = e.target.checked; };
$('#shadowOn').onchange = e => { sun.castShadow = e.target.checked; };
const sliders = {
  explode: v => { S.explode = v; floors.forEach((f, i) => { f.group.position.y = i * v; }); return fmt(v) + ' m'; },
  cutX: v => { S.cutX = v; planes[0].constant = v >= 47 ? 1000 : v; return v >= 47 ? '—' : fmt(v) + ' m'; },
  cutY: v => { S.cutY = v; planes[1].constant = v >= 14 ? 1000 : v; return v >= 14 ? '—' : fmt(v) + ' m'; },
  cutZ: v => { S.cutZ = v; planes[2].constant = v >= 38 ? 1000 : v; return v >= 38 ? '—' : '+' + fmt(v) + ' m'; },
};
for (const id of Object.keys(sliders)) {
  const el = $('#' + id), out = el.parentElement.querySelector('.v');
  el.oninput = () => { out.textContent = sliders[id](+el.value); };
}
const setSlider = (id, v) => { const el = $('#' + id); el.value = v; el.oninput(); };
$('#resetCuts').onclick = () => { setSlider('cutX', 47); setSlider('cutY', 14); setSlider('cutZ', 38); };
$('#resetAll').onclick = () => {
  $('#resetCuts').onclick(); setSlider('explode', 0);
  for (const [id, v] of [['labelsOn', false], ['facadeOn', true], ['colorsOn', true], ['gridOn', false], ['rotateOn', false], ['shadowOn', true], ['hlOn', false]]) { const el = $('#' + id); el.checked = v; el.onchange({ target: el }); }
  floors.forEach((f, i) => setFloor(i, true)); overlay.setOn(false); sunSim.setEnabled(false); measure.setOn(false); setView('persp');
};
$('#togglePanel').onclick = () => $('#panel').classList.toggle('hidden');
$('#closeInfo').onclick = () => { $('#roominfo').style.display = 'none'; };

// ---- góc nhìn
const VIEWS = {
  persp: { p: [-10, 27, 58], t: [HC, 10, -6.5] },
  front: { p: [HC, 17, 112], t: [HC, 15, -6.5] },
  rear: { p: [HC, 17, -125], t: [HC, 15, -6.5] },
  side: { p: [-98, 17, -6.5], t: [0, 15, -6.5] },
  top: { p: [HC, 115, -6.3], t: [HC, 0, -6.5] },
  section: { p: [92, 24, 32], t: [HC, 12, -6.5], cutX: HC },
  hall: { p: [23.2, 3.8, -2.75], t: [23.2, 1.3, -9.6] },
  balcony: { p: [15.3, 6.5, -10.3], t: [24.2, 4.0, -4.0] },
  room: { p: [9.4, 9.3, -7.6], t: [20, 8.6, -4.5] },
};
let tween = null;
function setView(name) {
  const v = VIEWS[name]; if (!v) return;
  document.querySelectorAll('#views .b').forEach(b => b.classList.toggle('on', b.dataset.view === name));
  if (v.cutX !== undefined) setSlider('cutX', v.cutX); else if (S.cutX < 47 && name !== 'section') setSlider('cutX', 47);
  tween = { t0: performance.now(), p0: camera.position.clone(), t0v: controls.target.clone(), p1: new THREE.Vector3(...v.p), t1: new THREE.Vector3(...v.t) };
}
$('#views').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setView(b.dataset.view); });
camera.position.set(...VIEWS.persp.p); controls.target.set(...VIEWS.persp.t);

// ---- các module bổ sung
const roots = () => [building, site];
const sunSim = initSun({ sun, hemi, scene, $ });
const measure = initMeasure({ scene, camera, dom: renderer.domElement, roots, $ });
initExport({ roots, variantName, $ });

// ---- rê / bấm chọn phòng
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), tip = $('#tip');
let down = null, hit = null;
function pick(ev) {
  mouse.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const vis = hover.filter(m => { let o = m; while (o) { if (!o.visible) return false; o = o.parent; } return true; });
  const h = ray.intersectObjects(vis, false)[0];
  return h ? h.object.userData.room : null;
}
const roomText = r => `${floors[r.floor].name} · ${KIND[r.kind]?.n || ''}` + (r.area ? ` · ${r.est ? '≈ ' : ''}${fmt(r.area)} m²` : '') + (r.note ? ` · ${r.note}` : '');
renderer.domElement.addEventListener('pointermove', ev => {
  if (ev.buttons || measure.S.on) { tip.style.display = 'none'; return; }
  hit = pick(ev);
  if (hit) { tip.innerHTML = `<b>${hit.name}</b>${roomText(hit)}`; tip.style.display = 'block'; tip.style.left = (ev.clientX + 14) + 'px'; tip.style.top = (ev.clientY + 14) + 'px'; }
  else tip.style.display = 'none';
});
renderer.domElement.addEventListener('pointerdown', ev => { down = [ev.clientX, ev.clientY]; });
renderer.domElement.addEventListener('pointerup', ev => {
  if (measure.S.on || !down || Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 5) return;
  const r = pick(ev); if (!r) return;
  $('#roominfo h3').textContent = r.name; $('#roominfo .c').textContent = roomText(r); $('#roominfo').style.display = 'block';
});
renderer.domElement.addEventListener('pointerleave', () => { tip.style.display = 'none'; });

// ---- vòng lặp
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); labelRenderer.setSize(innerWidth, innerHeight); });
const ease = t => 1 - Math.pow(1 - t, 3);
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (tween) {
    const k = Math.min(1, (now - tween.t0) / 900), e = ease(k);
    camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0v, tween.t1, e);
    if (k >= 1) tween = null;
  }
  sunSim.tick(dt); controls.update();
  renderer.render(scene, camera); labelRenderer.render(scene, camera);
}
setVariant(S.variant);
requestAnimationFrame(frame);
$('#loading').remove();
// Hook chẩn đoán (không ảnh hưởng người dùng)
window.__app = { renderer, scene, camera, controls, setView, setSlider, setFloor, setVariant, S, V, sunSim, measure, overlay, get floors() { return floors; }, get building() { return building; }, get site() { return site; },
  shot: (name = 'shot') => { renderer.render(scene, camera); labelRenderer.render(scene, camera); return fetch('/shot?name=' + name, { method: 'POST', body: renderer.domElement.toDataURL('image/png') }).then(r => r.text()); } };
addEventListener('error', e => { (window.__errs = window.__errs || []).push(String(e.message)); });
addEventListener('unhandledrejection', e => { (window.__errs = window.__errs || []).push(String(e.reason)); });
