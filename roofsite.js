// Mái + tum thang, khu đất xung quanh, lưới trục.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Builder, M, L, W, GRADE, ROOF, TOWER_TOP, TUM_TOP, COL_X, COL_Y, GRID_X, GRID_Y, V } from './common.js';
import { STAIR_WELLS, LIFTS, rect } from './storey.js';
import { propRoof, propSite } from './proposal.js';
import { paActive, roofPA } from './facade_v3.js';

export function buildRoof() {
  const g = new THREE.Group(); g.name = 'roof';
  const B = new Builder();
  B.poly(rect(0, L, 0, W), ROOF - 0.15, ROOF, M.slab, [...STAIR_WELLS, ...LIFTS].map(r => rect(...r)));
  for (const y of COL_Y) B.box(0, L, y - 0.15, y + 0.15, ROOF - 0.6, ROOF - 0.15, M.concrete);
  for (const x of COL_X) B.box(x - 0.15, x + 0.15, 0, W, ROOF - 0.6, ROOF - 0.15, M.concrete);
  if (paActive()) roofPA(B); else roofTKSB(B);
  B.box(7.97, 8.23, 5.2, 6.2, ROOF, ROOF + 2.2, M.door);
  B.box(38.17, 38.43, 5.2, 6.2, ROOF, ROOF + 2.2, M.door);
  // thiết bị mái: bồn nước trên tum, dàn nóng điều hoà
  for (const x of [40.6, 43.4]) { const c = new THREE.CylinderGeometry(0.9, 0.9, 1.6, 24); c.translate(x, TUM_TOP + 0.8, -6.5); B.add(c, M.steel); }
  for (const x of [11, 16, 21, 26, 31]) B.box(x, x + 1.1, 11.0, 11.9, ROOF, ROOF + 0.9, M.steel);
  B.build(g);
  if (V.proposal) { const P = new Builder(true); propRoof(P); P.build(g); }
  return g;
}

// vỏ mái theo hồ sơ TKSB (mặt đứng PA1–PA3 của Báo cáo V3: facade_v3.js)
function roofTKSB(B) {
  // ốp đầu sàn + lan can mái thân giữa
  B.box(8.2, 38.2, -0.05, 0.25, ROOF - 0.6, ROOF + 1.0, M.white); B.box(8.2, 38.2, 12.75, 13.05, ROOF - 0.6, ROOF + 1.0, M.white);
  // tháp trắng trái (lõi thang + thang máy vượt mái)
  B.box(0, 8.2, -0.05, 0.2, ROOF, TOWER_TOP, M.white); B.box(0, 8.2, 12.8, 13.05, ROOF, TOWER_TOP, M.white);
  B.box(-0.05, 0.2, -0.05, 13.05, ROOF, TOWER_TOP, M.white); B.box(8.0, 8.2, 0, 13, ROOF, TOWER_TOP, M.white);
  B.box(-0.05, 8.2, -0.05, 13.05, TOWER_TOP - 0.15, TOWER_TOP, M.white);
  for (const x of [1.6, 3.6, 5.6]) { B.box(x, x + 1, -0.08, -0.03, ROOF + 1.3, ROOF + 2.3, M.dark); B.box(x, x + 1, 13.03, 13.08, ROOF + 1.3, ROOF + 2.3, M.dark); }
  // tum xanh phải
  B.box(38.2, 46.4, -0.05, 0.2, ROOF, TUM_TOP, M.blue); B.box(38.2, 46.4, 12.8, 13.05, ROOF, TUM_TOP, M.blue);
  B.box(46.2, 46.45, -0.05, 13.05, ROOF, TUM_TOP, M.blue); B.box(38.2, 38.4, 0, 13, ROOF, TUM_TOP, M.blue);
  B.box(38.2, 46.45, -0.05, 13.05, TUM_TOP - 0.15, TUM_TOP, M.blue);
  for (let k = 0; k < 7; k++) { const x = 39.3 + k; B.box(x, x + 0.25, -0.08, -0.03, ROOF + 0.3, TUM_TOP - 0.3, M.dark); }
  // khung mái (pergola) nhẹ trên thân giữa
  B.box(8.2, 38.2, 0.4, 0.7, 35.3, 35.85, M.white); B.box(8.2, 38.2, 12.3, 12.6, 35.3, 35.85, M.white);
  for (let x = 10.7; x < 38.2; x += 5) { B.box(x - 0.15, x + 0.15, 0.4, 0.7, ROOF, 35.3, M.white); B.box(x - 0.15, x + 0.15, 12.3, 12.6, ROOF, 35.3, M.white); }
  for (let x = 8.2 + 0.625; x < 38.2; x += 1.25) B.box(x - 0.06, x + 0.06, 0.4, 12.6, 35.6, 35.85, M.louvre);
}

export function buildSite() {
  const g = new THREE.Group(); g.name = 'site';
  const B = new Builder();
  B.box(-70, 120, -70, 85, GRADE - 0.3, GRADE - 0.02, M.ground);
  B.box(-8, L + 8, -14, W + 6, GRADE - 0.03, GRADE, M.pave);
  // thềm bậc trước sảnh chính (sàn tầng 1 cao hơn sân 1,0 m)
  for (let k = 0; k < 5; k++) B.box(18.3, 28.2, -2.6 + k * 0.42, -0.1, GRADE + k * 0.2, GRADE + (k + 1) * 0.2, M.pave);
  // dốc tiếp cận cho người khuyết tật (PA gốc: 7 m, dốc 1/7 – PA đề xuất thay bằng dốc 1/12 trong proposal.js)
  B.box(16.6, 18.3, -1.8, -0.1, GRADE, 0, M.pave);
  if (!V.proposal) {
    B.slope(13.1, -0.95, GRADE + 0.5 - 0.07, Math.hypot(7, 1), 1.7, 0.14, 0, Math.atan2(1, 7), M.pave);
    B.box(9.5, 16.6, -1.9, -1.8, GRADE, 0.9, M.rail);
  }
  // cây xanh
  let trees = [[-5, -7], [-5, 9], [52, -7], [52, 9], [7, -10], [39, -10], [14, -12], [32, -12], [-13, 1], [59, 4], [3, 19], [43, 19], [23, 20], [-10, 16], [56, 16]];
  if (V.proposal) trees = trees.filter(([x, y]) => !(y > 14 && x > 0 && x < 50));
  trees.forEach(([x, y], k) => {
    const t = new THREE.CylinderGeometry(0.16, 0.22, 2.4, 8); t.translate(x, GRADE + 1.2, -y); B.add(t, M.trunk);
    const r = 1.5 + (k % 3) * 0.35, s = new THREE.SphereGeometry(r, 12, 9); s.translate(x, GRADE + 2.4 + r * 0.85, -y); B.add(s, k % 2 ? M.leaf : M.leaf2);
  });
  // người (tỉ lệ)
  const ppl = [[22.4, -4.2, M.p1], [24.6, -5.6, M.p2], [19.5, -7.5, M.p3], [30.5, -3.6, M.p1], [11, -4.5, M.p2], [27.5, -8.5, M.p3]];
  for (const [x, y, m] of ppl) {
    const b = new THREE.CylinderGeometry(0.18, 0.2, 1.3, 8); b.translate(x, GRADE + 0.65, -y); B.add(b, m);
    const h = new THREE.SphereGeometry(0.14, 8, 6); h.translate(x, GRADE + 1.47, -y); B.add(h, m);
  }
  B.build(g);
  if (V.proposal) { const P = new Builder(true); propSite(P); P.build(g); }
  return g;
}

export function buildGrid() {
  const g = new THREE.Group(); g.name = 'grid'; g.visible = false;
  const pts = [], z = GRADE + 0.03, labels = [];
  const tag = (txt, x, y) => { const d = document.createElement('div'); d.className = 'lbl axis'; d.textContent = txt; const o = new CSS2DObject(d); o.position.set(x, z, -y); g.add(o); labels.push(o); };
  GRID_X.forEach((x, k) => { pts.push(x, z, 4, x, z, -(W + 4)); tag(String(k + 1), x, -5.2); tag(String(k + 1), x, W + 5.2); });
  GRID_Y.forEach((y, k) => { pts.push(-4, z, -y, L + 4, z, -y); tag('ABCD'[k], -5.2, y); tag('ABCD'[k], L + 5.2, y); });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(geo, new THREE.LineDashedMaterial({ color: 0x333333, dashSize: 0.6, gapSize: 0.3 })));
  g.children[g.children.length - 1].computeLineDistances();
  return { group: g, labels };
}
