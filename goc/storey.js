// Dựng một tầng điển hình: sàn, dầm, cột, phòng (tường, cửa, nội thất), thang máy, thang bộ, vỏ bao che.
import * as THREE from 'three';
import { Builder, M, L, W, FFL, TOP, FLOOR_KEY, COL_X, COL_Y, VOID, KIND, kindColor, planes, canvasTexture, GRADE } from './common.js';

export const STAIR_WELLS = [[0.3, 5.8, 0.3, 4.4], [40.6, 46.1, 0.3, 4.4]];
export const LIFTS = [[0.24, 2.45, 4.74, 6.94], [0.24, 2.45, 7.14, 9.34]];
export const rect = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

export const kindMats = {};
for (const k of Object.keys(KIND)) kindMats[k] = new THREE.MeshStandardMaterial({ color: kindColor(k), roughness: 0.9, clippingPlanes: planes });
export const plainMat = new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.9, clippingPlanes: planes });

const BAL = [[10.34, 4.6, 16.31, 4.6], [30.09, 4.6, 36.05, 4.6], [36.05, 4.6, 36.05, 10.4], [10.34, 4.6, 10.34, 10.4], [10.34, 10.4, 14.43, 10.4], [31.96, 10.4, 36.05, 10.4]];

export function makePatch(geo, kind, rec) {
  const m = new THREE.Mesh(geo, kindMats[kind]);
  m.receiveShadow = true; m.userData.room = rec; m.userData.kind = kind; return m;
}

export function buildStorey(i) {
  const z0 = FFL[i], z1 = TOP[i], key = FLOOR_KEY[i], rooms = window.ROOMS[key];
  const g = new THREE.Group(); g.name = 'storey' + i;
  const B = new Builder(), hover = [], labels = [];

  // ---- sàn, dầm, cột
  if (i === 0) {
    B.box(-0.1, L + 0.1, -0.1, W + 0.1, GRADE, -0.15, M.plinth);
    B.poly(rect(0, L, 0, W), -0.15, 0, M.slab, LIFTS.map(r => rect(...r)));
  } else {
    const holes = [...STAIR_WELLS, ...LIFTS].map(r => rect(...r));
    if (i === 1) holes.push(VOID);
    B.poly(rect(0, L, 0, W), z0 - 0.15, z0, M.slab, holes);
    beams(B, z0 - 0.15, i === 1);
  }
  for (const x of COL_X) for (const y of COL_Y) {
    if (i <= 1 && (x === 18.2 || x === 28.2) && (y === 4.7 || y === 9.0)) continue;
    B.box(x - 0.3, x + 0.3, y - 0.2, y + 0.2, z0, z1, M.col);
  }

  // ---- phòng
  for (const r of rooms) {
    const rec = { name: r.name, area: r.area, est: r.est, kind: r.k, floor: i };
    if (r.special === 'hall') continue;
    if (r.special === 'lift') { lift(B, r, z0, z1); if (i === 0) labels.push(lbl(r, z0, rec)); continue; }
    if (r.special === 'stair') {
      stairRoom(B, r, z0, z1);
      if (i === 0) { addPatch(g, hover, r, z0, rec); labels.push(lbl(r, z0, rec)); }
      continue;
    }
    addPatch(g, hover, r, z0, rec);
    if (!r.nowalls) { walls(B, r, z0, z1); furniture(B, r, z0); }
    if (r.k !== 'corr') labels.push(lbl(r, z0, rec));
  }
  stairs(B, z0, z1, false); stairs(B, z0, z1, true);
  if (i === 1) for (const [xa, ya, xb, yb] of BAL) {
    B.wall(xa, ya, xb, yb, z0, z0 + 1.05, 0.04, M.railGlass);
    B.wall(xa, ya, xb, yb, z0 + 1.05, z0 + 1.1, 0.07, M.rail);
  }
  facade(B, g, i, z0, z1);
  B.build(g);
  return { group: g, hover, labels };
}

const lbl = (r, z0, rec) => ({ x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2, z: z0 + 1.7, rec });

function addPatch(g, hover, r, z0, rec) {
  const geo = new THREE.BoxGeometry(Math.max(0.1, r.x1 - r.x0 - 0.16), 0.02, Math.max(0.1, r.y1 - r.y0 - 0.16));
  geo.translate((r.x0 + r.x1) / 2, z0 + 0.012, -(r.y0 + r.y1) / 2);
  const m = makePatch(geo, r.k, rec); g.add(m); hover.push(m);
}

function beams(B, zTop, isT2) {
  const zb = zTop - 0.45, w = 0.15;
  for (const y of COL_Y) {
    if (isT2 && (y === 4.7 || y === 9.0)) { B.box(0, 10.34, y - w, y + w, zb, zTop, M.concrete); B.box(36.05, L, y - w, y + w, zb, zTop, M.concrete); }
    else B.box(0, L, y - w, y + w, zb, zTop, M.concrete);
  }
  for (const x of COL_X) {
    if (isT2 && (x === 18.2 || x === 28.2)) { B.box(x - w, x + w, 0, 2.38, zb, zTop, M.concrete); B.box(x - w, x + w, 10.4, W, zb, zTop, M.concrete); }
    else B.box(x - w, x + w, 0, W, zb, zTop, M.concrete);
  }
}

function walls(B, r, z0, z1) {
  const t = 0.15, h = r.wallh ? z0 + r.wallh : z1 - 0.15;
  const ext = { x0: r.x0 < 0.3, x1: r.x1 > 46.1, y0: r.y0 < 0.3, y1: r.y1 > 12.7 };
  if (!ext.x0) B.box(r.x0 - t, r.x0, r.y0 - t, r.y1 + t, z0, h, M.wall);
  if (!ext.x1) B.box(r.x1, r.x1 + t, r.y0 - t, r.y1 + t, z0, h, M.wall);
  if (!ext.y0) B.box(r.x0 - t, r.x1 + t, r.y0 - t, r.y0, z0, h, M.wall);
  if (!ext.y1) B.box(r.x0 - t, r.x1 + t, r.y1, r.y1 + t, z0, h, M.wall);
  let e;
  if (r.x1 <= 5.4 && r.y0 >= 10) e = 'x1'; else if (r.x0 >= 41) e = 'x0'; else if (r.y0 > 6.5) e = 'y0'; else e = 'y1';
  if (ext[e]) e = ['y1', 'y0', 'x0', 'x1'].find(k => !ext[k]);
  if (!e) return;
  const along = e[0] === 'x' ? r.y1 - r.y0 : r.x1 - r.x0;
  const spots = along > 9 ? [0.25, 0.75] : [0.5];
  for (const f of spots) door(B, r, e, f, z0, t);
}

function door(B, r, e, f, z0, t, w = 0.95, hgt = 2.2) {
  if (e[0] === 'x') {
    const x = e === 'x0' ? r.x0 - t : r.x1, yc = r.y0 + (r.y1 - r.y0) * f;
    B.box(x - 0.02, x + t + 0.02, yc - w / 2, yc + w / 2, z0, z0 + hgt, M.door);
  } else {
    const y = e === 'y0' ? r.y0 - t : r.y1, xc = r.x0 + (r.x1 - r.x0) * f;
    B.box(xc - w / 2, xc + w / 2, y - 0.02, y + t + 0.02, z0, z0 + hgt, M.door);
  }
}

function furniture(B, r, z0) {
  const w = r.x1 - r.x0, d = r.y1 - r.y0, yc = (r.y0 + r.y1) / 2;
  if (r.k === 'lecture') {
    B.box(r.x0 + 0.02, r.x0 + 0.06, yc - 1.8, yc + 1.8, z0 + 0.9, z0 + 2.1, M.board);
    B.box(r.x0 + 0.9, r.x0 + 2.3, yc - 0.7, yc + 0.7, z0 + 0.72, z0 + 0.76, M.wood);
    B.box(r.x0 + 0.95, r.x0 + 2.25, yc - 0.65, yc + 0.65, z0 + 0.3, z0 + 0.72, M.wood);
    for (let x = r.x0 + 3.2; x + 1.05 < r.x1 - 0.6; x += 1.15) for (const [ya, yb] of [[r.y0 + 0.7, yc - 0.55], [yc + 0.55, r.y1 - 0.7]]) {
      if (yb - ya < 1) continue;
      B.box(x, x + 0.45, ya, yb, z0 + 0.72, z0 + 0.76, M.wood);
      B.box(x, x + 0.03, ya, yb, z0 + 0.3, z0 + 0.72, M.wood);
      for (let y = ya + 0.1; y + 0.45 <= yb; y += 0.6) B.box(x + 0.6, x + 1.0, y, y + 0.42, z0 + 0.42, z0 + 0.46, M.seat), B.box(x + 0.95, x + 1.0, y, y + 0.42, z0 + 0.46, z0 + 0.85, M.seat);
    }
  } else if (r.k === 'meet') {
    const tl = Math.min(w - 2.6, 6.5), xc = (r.x0 + r.x1) / 2;
    B.box(xc - tl / 2, xc + tl / 2, yc - 0.7, yc + 0.7, z0 + 0.72, z0 + 0.76, M.wood);
    B.box(xc - tl / 2 + 0.6, xc + tl / 2 - 0.6, yc - 0.3, yc + 0.3, z0, z0 + 0.72, M.wood);
    for (let x = xc - tl / 2 + 0.4; x + 0.45 <= xc + tl / 2; x += 0.8) for (const y of [yc - 1.15, yc + 0.7]) B.box(x, x + 0.45, y, y + 0.45, z0 + 0.42, z0 + 0.46, M.seat), B.box(x, x + 0.45, y + (y < yc ? 0 : 0.4), y + (y < yc ? 0.05 : 0.45), z0 + 0.46, z0 + 0.9, M.seat);
    B.box(r.x0 + 0.02, r.x0 + 0.06, yc - 1.2, yc + 1.2, z0 + 0.9, z0 + 2.2, M.board);
  } else if (r.k === 'tech' && r.area >= 8 && d > 2.2 && w > 2.2) {
    const n = r.area > 18 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const x = r.x0 + 0.6 + k * 2.2, y = r.y1 - 1.3;
      B.box(x, x + 1.4, y, y + 0.7, z0 + 0.72, z0 + 0.75, M.wood); B.box(x + 0.05, x + 1.35, y + 0.05, y + 0.65, z0, z0 + 0.72, M.wood);
      B.box(x + 0.45, x + 0.95, y - 0.6, y - 0.15, z0 + 0.42, z0 + 0.46, M.seat);
    }
  }
}

function lift(B, r, z0, z1) {
  const t = 0.12, yc = (r.y0 + r.y1) / 2;
  B.box(r.x0 - t, r.x1 + t, r.y0 - t, r.y0, z0, z1, M.shaft); B.box(r.x0 - t, r.x1 + t, r.y1, r.y1 + t, z0, z1, M.shaft);
  B.box(r.x1, r.x1 + t, r.y0, yc - 0.5, z0, z1, M.shaft); B.box(r.x1, r.x1 + t, yc + 0.5, r.y1, z0, z1, M.shaft);
  B.box(r.x1, r.x1 + t, yc - 0.5, yc + 0.5, z0 + 2.1, z1, M.shaft);
  B.box(r.x1 - 0.03, r.x1 + 0.03, yc - 0.5, yc + 0.5, z0, z0 + 2.1, M.steel);
}

function stairRoom(B, r, z0, z1) {
  const t = 0.15, h = z1 - 0.15, right = r.x0 > 20;
  B.box(r.x0 - t, r.x1 + t, r.y1, r.y1 + t, z0, h, M.wall);
  if (right) B.box(r.x0 - t, r.x0, r.y0, r.y1 + t, z0, h, M.wall); else B.box(r.x1, r.x1 + t, r.y0, r.y1 + t, z0, h, M.wall);
  const xd = right ? L - 6.87 : 6.87;
  B.box(xd - 0.6, xd + 0.6, r.y1 - 0.02, r.y1 + t + 0.02, z0, z0 + 2.2, M.door);
}

// Thang bộ 2 vế đổi chiều: vế 1 (Y 2,44–4,4) từ X 5,8 lên chiếu nghỉ X 0,3–2,2; vế 2 (Y 0,3–2,26) lên X 5,8
function stairs(B, z0, z1, mir) {
  const X = x => (mir ? L - x : x), lo = (a, b) => Math.min(X(a), X(b)), hi = (a, b) => Math.max(X(a), X(b));
  const H = z1 - z0, n = 11, tr = 3.6 / n, rs = H / 2 / n;
  for (let k = 0; k < n; k++) {
    const t1 = z0 + (k + 1) * rs; B.box(lo(5.8 - (k + 1) * tr, 5.8 - k * tr), hi(5.8 - (k + 1) * tr, 5.8 - k * tr), 2.44, 4.4, t1 - rs, t1, M.stair);
    const t2 = z0 + H / 2 + (k + 1) * rs; B.box(lo(2.2 + k * tr, 2.2 + (k + 1) * tr), hi(2.2 + k * tr, 2.2 + (k + 1) * tr), 0.3, 2.26, t2 - rs, t2, M.stair);
  }
  const len = Math.hypot(3.6, H / 2), tilt = Math.atan2(H / 2, 3.6), a1 = mir ? 0 : Math.PI, a2 = mir ? Math.PI : 0;
  B.slope(X(4.0), 3.42, z0 + H / 4 - 0.2, len, 1.96, 0.14, a1, tilt, M.concrete);
  B.slope(X(4.0), 1.28, z0 + 3 * H / 4 - 0.2, len, 1.96, 0.14, a2, tilt, M.concrete);
  B.box(lo(0.3, 2.2), hi(0.3, 2.2), 0.3, 4.4, z0 + H / 2 - 0.15, z0 + H / 2, M.stair);
  B.slope(X(4.0), 2.46, z0 + H / 4 + 0.5, len, 0.03, 0.9, a1, tilt, M.railGlass);
  B.slope(X(4.0), 2.24, z0 + 3 * H / 4 + 0.5, len, 0.03, 0.9, a2, tilt, M.railGlass);
  B.slope(X(4.0), 2.46, z0 + H / 4 + 0.97, len, 0.07, 0.05, a1, tilt, M.rail);
  B.slope(X(4.0), 2.24, z0 + 3 * H / 4 + 0.97, len, 0.07, 0.05, a2, tilt, M.rail);
  B.box(lo(0.3, 2.2), hi(0.3, 2.2), 2.24, 2.46, z0 + H / 2, z0 + H / 2 + 1.0, M.railGlass);
}

function facade(B, g, i, z0, z1) {
  const g0 = z0 + 0.12, g1 = z1 - 0.6;
  // khối trắng trái (lõi thang) và khối xanh phải
  B.box(0, 8.2, -0.05, 0.2, z0, z1, M.white); B.box(0, 8.2, 12.8, 13.05, z0, z1, M.white); B.box(-0.05, 0.2, -0.05, 13.05, z0, z1, M.white);
  for (const x of [1.6, 3.6, 5.6]) { B.box(x, x + 1, -0.08, -0.03, z0 + 1.3, z0 + 2.3, M.dark); B.box(x, x + 1, 13.03, 13.08, z0 + 1.3, z0 + 2.3, M.dark); }
  B.box(38.2, 46.4, -0.05, 0.2, z0, z1, M.blue); B.box(38.2, 46.4, 12.8, 13.05, z0, z1, M.blue); B.box(46.2, 46.45, -0.05, 13.05, z0, z1, M.blue);
  for (let k = 0; k < 7; k++) { const x = 39.3 + k; B.box(x, x + 0.25, -0.08, -0.03, z0 + 0.3, z1 - 0.3, M.dark); B.box(x, x + 0.25, 13.03, 13.08, z0 + 0.3, z1 - 0.3, M.dark); }
  if (i === 0) {
    B.box(8.2, 38.2, 0.58, 0.62, 0, 3.4, M.glass);
    for (let x = 8.2; x <= 38.2 + 1e-6; x += 1.25) B.box(x - 0.03, x + 0.03, 0.5, 0.7, 0, 3.4, M.mullion);
    B.box(20.6, 25.9, 0.45, 0.75, 2.6, 3.4, M.dark);
    for (const x of [20.6, 21.9, 23.2, 24.5, 25.8]) B.box(x - 0.05, x + 0.05, 0.45, 0.75, 0, 2.6, M.dark);
    B.box(19.2, 27.3, -2.6, 0.3, 3.3, 3.55, M.white); B.box(19.2, 27.3, -2.6, -2.35, 2.95, 3.3, M.white);
    B.box(14.43, 31.96, 12.8, 13.05, 0, 3.4, M.white);
    B.box(8.2, 14.43, 12.81, 12.85, 0, 3.4, M.glass); B.box(31.96, 38.2, 12.81, 12.85, 0, 3.4, M.glass);
    for (let x = 8.2; x <= 38.2 + 1e-6; x += 1.25) if (x < 14.5 || x > 31.9) B.box(x - 0.03, x + 0.03, 12.75, 12.95, 0, 3.4, M.mullion);
  } else {
    B.box(8.2, 38.2, -0.05, 0.25, z0 - 0.6, z0 + 0.12, M.white); B.box(8.2, 38.2, 12.75, 13.05, z0 - 0.6, z0 + 0.12, M.white);
    B.box(8.2, 38.2, 0.13, 0.17, g0, g1, M.glass);
    for (let x = 8.2; x <= 38.2 + 1e-6; x += 1.25) B.box(x - 0.03, x + 0.03, 0.05, 0.25, g0, g1, M.mullion);
    for (const dz of [1.5, 1.95, 2.4, 2.85]) B.box(8.2, 38.2, -0.62, -0.05, z0 + dz - 0.03, z0 + dz + 0.03, M.louvre);
    for (let x = 8.2; x <= 38.2 + 1e-6; x += 2.5) B.box(x - 0.05, x + 0.05, -0.62, -0.5, g0, g1, M.louvre);
    B.box(8.2, 38.2, 12.81, 12.85, g0, g1, M.glass);
    for (let x = 8.2; x <= 38.2 + 1e-6; x += 1.25) B.box(x - 0.03, x + 0.03, 12.75, 12.95, g0, g1, M.mullion);
    for (let k = 0; 8.55 + 0.7 * k < 38.0; k++) { if ((k + 2 * i) % 4 === 3) continue; const x = 8.55 + 0.7 * k; B.box(x - 0.06, x + 0.06, 12.85, 13.3, g0, g1, M.fin); }
  }
  if (i === 8) {
    // Logo chính thức UTC/UTC2 (../img/logo-utc.png) trên đĩa nền trắng; CircleGeometry hướng +z → ảnh thẳng, không xoay
    const tex = new THREE.TextureLoader().load('../img/logo-utc.png'); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.06, 48), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, clippingPlanes: planes }));
    disc.rotation.x = Math.PI / 2; disc.position.set(42.3, z0 + 1.9, 0.09); disc.userData.facade = true; disc.castShadow = true; g.add(disc);
    const logo = new THREE.Mesh(new THREE.CircleGeometry(1.04, 64), new THREE.MeshStandardMaterial({
      map: tex, transparent: true, alphaTest: 0.05, roughness: 0.6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.22, clippingPlanes: planes,
    }));
    logo.position.set(42.3, z0 + 1.9, 0.125); logo.userData.facade = true; g.add(logo);
  }
}
