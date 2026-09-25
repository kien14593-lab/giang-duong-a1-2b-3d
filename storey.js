// Dựng một tầng điển hình: sàn, dầm, cột, phòng (tường, cửa, nội thất), thang máy, thang bộ, vỏ bao che.
import * as THREE from 'three';
import { Builder, M, L, W, FFL, TOP, FLOOR_KEY, COL_X, COL_Y, VOID, KIND, kindColor, planes, GRADE, V, rect } from './common.js';
import { propRooms, propStorey } from './proposal.js';

export const STAIR_WELLS = [[0.3, 5.8, 0.3, 4.4], [40.6, 46.1, 0.3, 4.4]];
export const LIFTS = [[0.24, 2.45, 4.74, 6.94], [0.24, 2.45, 7.14, 9.34]];
export { rect };

export const kindMats = {};
for (const k of Object.keys(KIND)) kindMats[k] = new THREE.MeshStandardMaterial({ color: kindColor(k), roughness: 0.9, clippingPlanes: planes });
export const plainMat = new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.9, clippingPlanes: planes });

const BAL = [[10.34, 4.6, 16.31, 4.6], [30.09, 4.6, 36.05, 4.6], [36.05, 4.6, 36.05, 10.4], [10.34, 4.6, 10.34, 10.4], [10.34, 10.4, 14.43, 10.4], [31.96, 10.4, 36.05, 10.4]];

export function makePatch(geo, kind, rec) {
  const m = new THREE.Mesh(geo, kindMats[kind]);
  m.name = rec.name; m.receiveShadow = true; m.userData.room = rec; m.userData.kind = kind; return m;
}

export function buildStorey(i) {
  const z0 = FFL[i], z1 = TOP[i], key = FLOOR_KEY[i];
  const rooms = V.proposal ? propRooms(i, window.ROOMS[key]) : V.v3 ? window.ROOMS_V3['T' + (i + 1)] : window.ROOMS[key];
  const g = new THREE.Group(); g.name = 'storey' + i;
  const B = new Builder(), P = new Builder(true), hover = [], labels = [];

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
    const rec = { name: r.name, area: r.area, est: r.est, kind: r.k, floor: i, note: r.note };
    if (r.prop) { r.prop(P, r, z0, z1); addPatch(g, hover, r, z0, rec); labels.push(lbl(r, z0, rec)); continue; }
    if (r.special === 'hall') continue;
    if (r.special === 'lift') { lift(B, r, z0, z1); if (i === 0) labels.push(lbl(r, z0, rec)); continue; }
    if (r.special === 'stair') {
      stairRoom(B, r, z0, z1, i);
      if (i === 0) { addPatch(g, hover, r, z0, rec); labels.push(lbl(r, z0, rec)); }
      continue;
    }
    addPatch(g, hover, r, z0, rec);
    if (!r.nowalls) {
      walls(B, r, z0, z1);
      if (r.part) { partition(P, r, z0, z1); furniture(B, { ...r, x1: r.part - 0.06 }, z0); furniture(B, { ...r, x0: r.part + 0.06 }, z0); }
      else furniture(B, r, z0);
    }
    if (r.k !== 'corr') labels.push(lbl(r, z0, rec));
  }
  stairs(B, z0, z1, false); stairs(B, z0, z1, true);
  if (i === 1) for (const [xa, ya, xb, yb] of BAL) {
    B.wall(xa, ya, xb, yb, z0, z0 + 1.05, 0.04, M.railGlass);
    B.wall(xa, ya, xb, yb, z0 + 1.05, z0 + 1.1, 0.07, M.rail);
  }
  facade(B, g, i, z0, z1);
  B.build(g);
  if (V.proposal) propStorey(P, i, z0, z1);
  P.build(g);
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
  if (r.door) { door(B, r, r.door[0], r.door[1], z0, t); return; }   // vị trí cửa chỉ định: [cạnh, tỷ lệ dọc cạnh]
  let e;
  if (r.x1 <= 5.4 && r.y0 >= 10) e = 'x1'; else if (r.x0 >= 41) e = 'x0'; else if (r.y0 > 6.5) e = 'y0'; else e = 'y1';
  if (ext[e]) e = ['y1', 'y0', 'x0', 'x1'].find(k => !ext[k]);
  if (!e) return;
  const along = e[0] === 'x' ? r.y1 - r.y0 : r.x1 - r.x0;
  const spots = along > 9 ? [0.25, 0.75] : [0.5];
  if (r.part) spots.splice(0, 2, ((r.x0 + r.part) / 2 - r.x0) / (r.x1 - r.x0), ((r.part + r.x1) / 2 - r.x0) / (r.x1 - r.x0));   // mỗi nửa phòng một cửa riêng
  for (const f of spots) door(B, r, e, f, z0, t);
}

// Vách di động chia phòng linh hoạt (F1/F2): tấm 1,2 m ghép, cao tới trần, để 1 khe cửa 1,0 m sát hành lang
function partition(P, r, z0, z1) {
  const x = r.part, h = z1 - 0.15, ya = r.y0, yb = r.y1 - 1.2;
  for (let y = ya; y < yb - 0.05; y += 1.2) P.box(x - 0.05, x + 0.05, y + 0.02, Math.min(y + 1.18, yb), z0, h, M.wood);
  P.box(x - 0.05, x + 0.05, yb, r.y1, z0 + 2.2, h, M.wood);
  P.box(x - 0.08, x + 0.08, ya, r.y1, h - 0.12, h, M.rail);   // ray treo
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

// Nội thất theo loại phòng; `r.fx` chỉ định kiểu riêng: desk | lounge | rack | shelf | studio | sim
function furniture(B, r, z0) {
  const w = r.x1 - r.x0, d = r.y1 - r.y0, yc = (r.y0 + r.y1) / 2;
  const fx = r.fx || r.k;
  if (fx === 'lecture') {
    B.box(r.x0 + 0.02, r.x0 + 0.06, yc - 1.8, yc + 1.8, z0 + 0.9, z0 + 2.1, M.board);
    B.box(r.x0 + 0.9, r.x0 + 2.3, yc - 0.7, yc + 0.7, z0 + 0.72, z0 + 0.76, M.wood);
    B.box(r.x0 + 0.95, r.x0 + 2.25, yc - 0.65, yc + 0.65, z0 + 0.3, z0 + 0.72, M.wood);
    for (let x = r.x0 + 3.2; x + 1.05 < r.x1 - 0.6; x += 1.15) for (const [ya, yb] of [[r.y0 + 0.7, yc - 0.55], [yc + 0.55, r.y1 - 0.7]]) {
      if (yb - ya < 1) continue;
      B.box(x, x + 0.45, ya, yb, z0 + 0.72, z0 + 0.76, M.wood);
      B.box(x, x + 0.03, ya, yb, z0 + 0.3, z0 + 0.72, M.wood);
      for (let y = ya + 0.1; y + 0.45 <= yb; y += 0.6) B.box(x + 0.6, x + 1.0, y, y + 0.42, z0 + 0.42, z0 + 0.46, M.seat), B.box(x + 0.95, x + 1.0, y, y + 0.42, z0 + 0.46, z0 + 0.85, M.seat);
    }
  } else if (fx === 'meet') {
    const tl = Math.min(w - 2.6, 6.5), xc = (r.x0 + r.x1) / 2;
    B.box(xc - tl / 2, xc + tl / 2, yc - 0.7, yc + 0.7, z0 + 0.72, z0 + 0.76, M.wood);
    B.box(xc - tl / 2 + 0.6, xc + tl / 2 - 0.6, yc - 0.3, yc + 0.3, z0, z0 + 0.72, M.wood);
    for (let x = xc - tl / 2 + 0.4; x + 0.45 <= xc + tl / 2; x += 0.8) for (const y of [yc - 1.15, yc + 0.7]) B.box(x, x + 0.45, y, y + 0.45, z0 + 0.42, z0 + 0.46, M.seat), B.box(x, x + 0.45, y + (y < yc ? 0 : 0.4), y + (y < yc ? 0.05 : 0.45), z0 + 0.46, z0 + 0.9, M.seat);
    B.box(r.x0 + 0.02, r.x0 + 0.06, yc - 1.2, yc + 1.2, z0 + 0.9, z0 + 2.2, M.board);
  } else if (fx === 'lab' || fx === 'sim') labFurniture(B, r, z0, fx === 'sim');
  else if (fx === 'learn' || fx === 'studio') learnFurniture(B, r, z0, fx === 'studio');
  else if (fx === 'rack') racks(B, r, z0);
  else if (fx === 'shelf') shelves(B, r, z0);
  else if (fx === 'lounge') lounge(B, r, z0);
  else if ((fx === 'tech' || fx === 'desk') && r.area >= 8 && d > 2.2 && w > 2.2) {
    const n = r.area > 18 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const x = r.x0 + 0.6 + k * 2.2, y = r.y1 - 1.3;
      B.box(x, x + 1.4, y, y + 0.7, z0 + 0.72, z0 + 0.75, M.wood); B.box(x + 0.05, x + 1.35, y + 0.05, y + 0.65, z0, z0 + 0.72, M.wood);
      B.box(x + 0.45, x + 0.95, y - 0.6, y - 0.15, z0 + 0.42, z0 + 0.46, M.seat);
    }
  }
}

// ghế đơn 0,45 m tại (x, y); lưng quay về phía (sx, sy)
function chair(B, x, y, z0, sy = 1, sx = 0) {
  B.box(x - 0.22, x + 0.22, y - 0.22, y + 0.22, z0 + 0.42, z0 + 0.46, M.seat);
  if (sy) B.box(x - 0.22, x + 0.22, y + sy * 0.22 - (sy > 0 ? 0.05 : 0), y + sy * 0.22 + (sy > 0 ? 0 : 0.05), z0 + 0.46, z0 + 0.9, M.seat);
  else B.box(x + sx * 0.22 - (sx > 0 ? 0.05 : 0), x + sx * 0.22 + (sx > 0 ? 0 : 0.05), y - 0.22, y + 0.22, z0 + 0.46, z0 + 0.9, M.seat);
}
const roundTable = (B, x, y, z0, rad, h, mat) => { const g = new THREE.CylinderGeometry(rad, rad, 0.04, 20); g.translate(x, z0 + h, -y); B.add(g, mat); B.box(x - 0.06, x + 0.06, y - 0.06, y + 0.06, z0, z0 + h - 0.02, M.steel); };

// PTN / mô phỏng: bảng + bàn GV, dãy bàn thí nghiệm cao 0,9 m (màn hình, thiết bị, ghế xoay), tủ thiết bị cuối phòng; `sim`: ca-bin mô phỏng lái
function labFurniture(B, r, z0, sim) {
  const yc = (r.y0 + r.y1) / 2, xEnd = sim ? r.x1 - 4.3 : r.x1 - 0.9;
  B.box(r.x0 + 0.02, r.x0 + 0.06, yc - 1.8, yc + 1.8, z0 + 0.9, z0 + 2.1, M.board);
  B.box(r.x0 + 0.9, r.x0 + 2.3, yc - 0.7, yc + 0.7, z0 + 0.72, z0 + 0.76, M.wood);
  B.box(r.x0 + 0.95, r.x0 + 2.25, yc - 0.65, yc + 0.65, z0 + 0.3, z0 + 0.72, M.wood);
  for (let x = r.x0 + 3.2; x + 1.6 < xEnd; x += 2.3) for (const [ya, yb] of [[r.y0 + 0.6, yc - 0.6], [yc + 0.6, r.y1 - 0.6]]) {
    if (yb - ya < 1.2) continue;
    B.box(x, x + 0.8, ya, yb, z0 + 0.86, z0 + 0.9, M.wood);
    B.box(x + 0.05, x + 0.75, ya + 0.05, yb - 0.05, z0, z0 + 0.86, M.concrete);
    for (let y = ya + 0.3; y + 0.5 <= yb - 0.1; y += 1.2) {
      B.box(x + 0.15, x + 0.2, y, y + 0.5, z0 + 0.95, z0 + 1.3, M.rail);
      B.box(x + 0.45, x + 0.75, y + 0.05, y + 0.35, z0 + 0.9, z0 + 1.05, M.steel);
      B.box(x + 1.0, x + 1.4, y + 0.05, y + 0.45, z0 + 0.45, z0 + 0.5, M.p1);
      B.box(x + 1.15, x + 1.25, y + 0.05, y + 0.45, z0, z0 + 0.45, M.steel);
    }
  }
  if (sim) {
    const x = r.x1 - 3.3;
    B.box(x, x + 2.4, yc - 0.8, yc + 0.8, z0, z0 + 2.0, M.p1);                       // ca-bin lái
    B.box(x - 0.6, x - 0.5, yc - 1.8, yc + 1.8, z0 + 0.6, z0 + 2.6, M.rail);          // màn hình cong phía trước
    B.box(x - 0.6, x - 0.5, yc - 1.8, yc + 1.8, z0 + 0.65, z0 + 2.55, M.railGlass);
  } else for (let y = r.y0 + 0.4; y + 1.0 <= r.y1 - 0.4; y += 1.1) B.box(r.x1 - 0.65, r.x1 - 0.05, y, y + 1.0, z0, z0 + 1.9, M.shaft);
}

// Learning Commons / Student Support Hub: bàn tròn 4 ghế; `studio`: bàn 2,4 × 1,2 m 6 ghế; kệ sách dọc tường cuối
function learnFurniture(B, r, z0, studio) {
  const px = studio ? 3.4 : 3.0, py = studio ? 3.0 : 2.8;
  const nx = Math.floor((r.x1 - r.x0 - 1.6) / px), ny = Math.floor((r.y1 - r.y0 - 1.0) / py);
  const ox = r.x0 + ((r.x1 - r.x0) - nx * px) / 2 + px / 2, oy = r.y0 + ((r.y1 - r.y0) - ny * py) / 2 + py / 2;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const cx = ox + i * px, cy = oy + j * py;
    if (studio) {
      B.box(cx - 1.2, cx + 1.2, cy - 0.6, cy + 0.6, z0 + 0.72, z0 + 0.76, M.wood);
      for (const dx of [-0.9, 0.9]) B.box(cx + dx - 0.03, cx + dx + 0.03, cy - 0.5, cy + 0.5, z0, z0 + 0.72, M.steel);
      for (const s of [-1, 1]) for (const dx of [-0.8, 0, 0.8]) chair(B, cx + dx, cy + s * 0.9, z0, s);
    } else {
      roundTable(B, cx, cy, z0, 0.6, 0.74, M.wood);
      for (const [dx, dy] of [[0, -0.85], [0, 0.85], [-0.85, 0], [0.85, 0]]) chair(B, cx + dx, cy + dy, z0, Math.sign(dy), Math.sign(dx));
    }
  }
  if (r.x1 - r.x0 > 8) for (let y = r.y0 + 0.4; y + 1.0 <= r.y1 - 0.4; y += 1.1) B.box(r.x1 - 0.4, r.x1 - 0.05, y, y + 1.0, z0, z0 + 1.8, M.wood);
}

// Máy chủ / UPS: tủ rack 0,6 × 1,0 × 2,0 m dọc tường sau (và tường trước nếu phòng sâu), tủ UPS cạnh cửa
function racks(B, r, z0) {
  const yc = (r.y0 + r.y1) / 2, rows = r.y1 - r.y0 > 5 ? [r.y1 - 1.3, r.y0 + 0.3] : [r.y1 - 1.3];
  for (const y of rows) for (let x = r.x0 + 1.8; x + 0.6 <= r.x1 - 0.4; x += 0.75) {
    B.box(x, x + 0.6, y, y + 1.0, z0, z0 + 2.0, M.rail);
    B.box(x + 0.05, x + 0.55, y - 0.02, y, z0 + 0.3, z0 + 1.9, M.steel);
  }
  B.box(r.x0 + 0.3, r.x0 + 1.5, yc - 0.4, yc + 0.4, z0, z0 + 1.6, M.shaft);
}

// Kho / chuẩn bị thiết bị: kệ 4 tầng dọc hai tường dài
function shelves(B, r, z0) {
  for (const [ya, yb] of [[r.y0 + 0.15, r.y0 + 0.65], [r.y1 - 0.65, r.y1 - 0.15]]) for (let x = r.x0 + 0.4; x + 1.0 <= r.x1 - 0.4; x += 1.1) {
    for (const z of [0.1, 0.6, 1.1, 1.6]) B.box(x, x + 1.0, ya, yb, z0 + z, z0 + z + 0.04, M.wood);
    B.box(x, x + 0.04, ya, yb, z0, z0 + 2.0, M.steel); B.box(x + 0.96, x + 1.0, ya, yb, z0, z0 + 2.0, M.steel);
  }
}

// Phòng GV / nghỉ GV / Student Support Hub: sofa quanh bàn trà, bàn làm việc cuối phòng, tủ tài liệu
function lounge(B, r, z0) {
  const w = r.x1 - r.x0, d = r.y1 - r.y0, xc = (r.x0 + r.x1) / 2, yc = (r.y0 + r.y1) / 2;
  if (w < 2.5 || d < 2.5) return;
  roundTable(B, xc, yc, z0, 0.45, 0.42, M.wood);
  for (const s of [-1, 1]) {
    B.box(xc - 0.9, xc + 0.9, yc + s * 0.75 - 0.35, yc + s * 0.75 + 0.35, z0 + 0.15, z0 + 0.45, M.p1);
    B.box(xc - 0.9, xc + 0.9, yc + s * 1.05 - 0.05, yc + s * 1.05 + 0.05, z0 + 0.15, z0 + 0.8, M.p1);
  }
  if (w > 4) {
    B.box(r.x1 - 0.9, r.x1 - 0.1, yc - 0.8, yc + 0.8, z0 + 0.72, z0 + 0.75, M.wood); B.box(r.x1 - 0.85, r.x1 - 0.15, yc - 0.75, yc + 0.75, z0, z0 + 0.72, M.wood);
    chair(B, r.x1 - 1.3, yc, z0, 0, -1);
  }
  for (let y = r.y0 + 0.3; y + 0.8 <= r.y1 - 0.3; y += 0.9) B.box(r.x0 + 0.05, r.x0 + 0.45, y, y + 0.8, z0, z0 + 1.9, M.wood);
}

function lift(B, r, z0, z1) {
  const t = 0.12, yc = (r.y0 + r.y1) / 2;
  B.box(r.x0 - t, r.x1 + t, r.y0 - t, r.y0, z0, z1, M.shaft); B.box(r.x0 - t, r.x1 + t, r.y1, r.y1 + t, z0, z1, M.shaft);
  B.box(r.x1, r.x1 + t, r.y0, yc - 0.5, z0, z1, M.shaft); B.box(r.x1, r.x1 + t, yc + 0.5, r.y1, z0, z1, M.shaft);
  B.box(r.x1, r.x1 + t, yc - 0.5, yc + 0.5, z0 + 2.1, z1, M.shaft);
  B.box(r.x1 - 0.03, r.x1 + 0.03, yc - 0.5, yc + 0.5, z0, z0 + 2.1, M.steel);
}

function stairRoom(B, r, z0, z1, i) {
  const t = 0.15, h = z1 - 0.15, right = r.x0 > 20;
  B.box(r.x0 - t, r.x1 + t, r.y1, r.y1 + t, z0, h, M.wall);
  if (right) B.box(r.x0 - t, r.x0, r.y0, r.y1 + t, z0, h, M.wall); else B.box(r.x1, r.x1 + t, r.y0, r.y1 + t, z0, h, M.wall);
  if (V.proposal && right && i === 0) return;   // PA đề xuất: thang phải ở T1 ra qua buồng đệm phía Tây
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
    if (!V.proposal) { B.box(19.2, 27.3, -2.6, 0.3, 3.3, 3.55, M.white); B.box(19.2, 27.3, -2.6, -2.35, 2.95, 3.3, M.white); }
    B.box(14.43, 31.96, 12.8, 13.05, 0, 3.4, M.white);
    B.box(8.2, 14.43, 12.81, 12.85, 0, 3.4, M.glass); B.box(31.96, 38.2, 12.81, 12.85, 0, 3.4, M.glass);
    for (let x = 8.2; x <= 38.2 + 1e-6; x += 1.25) if (x < 14.5 || x > 31.9) B.box(x - 0.03, x + 0.03, 12.75, 12.95, 0, 3.4, M.mullion);
  } else {
    B.box(8.2, 38.2, -0.05, 0.25, z0 - 0.6, z0 + 0.12, M.white); B.box(8.2, 38.2, 12.75, 13.05, z0 - 0.6, z0 + 0.12, M.white);
    B.box(8.2, 38.2, 0.13, 0.17, g0, g1, M.glass);
    for (let x = 8.2; x <= 38.2 + 1e-6; x += 1.25) B.box(x - 0.03, x + 0.03, 0.05, 0.25, g0, g1, M.mullion);
    if (!V.proposal) {
      for (const dz of [1.5, 1.95, 2.4, 2.85]) B.box(8.2, 38.2, -0.62, -0.05, z0 + dz - 0.03, z0 + dz + 0.03, M.louvre);
      for (let x = 8.2; x <= 38.2 + 1e-6; x += 2.5) B.box(x - 0.05, x + 0.05, -0.62, -0.5, g0, g1, M.louvre);
    }
    B.box(8.2, 38.2, 12.81, 12.85, g0, g1, M.glass);
    for (let x = 8.2; x <= 38.2 + 1e-6; x += 1.25) B.box(x - 0.03, x + 0.03, 12.75, 12.95, g0, g1, M.mullion);
    for (let k = 0; 8.55 + 0.7 * k < 38.0; k++) {
      if ((k + 2 * i) % 4 === 3) continue;
      const x = 8.55 + 0.7 * k; if (V.proposal && x > 36.0) continue;
      B.box(x - 0.06, x + 0.06, 12.85, 13.3, g0, g1, M.fin);
    }
  }
  if (i === 8) g.add(...logoBadge(z0));
}

// ---- Logo trường trên khối xanh mặt chính (T9): đĩa nền trắng Ø2,2 m + logo chính thức UTC/UTC2 (img/logo-utc.png).
// CircleGeometry nằm trong mặt XY, hướng +z (mặt trước) → ảnh thẳng, không lật/xoay; texture dùng chung, không dispose khi dựng lại.
let logoTex = null;
export function logoBadge(z0, x = 42.3, dz = 1.9) {
  if (!logoTex) {
    logoTex = new THREE.TextureLoader().load('img/logo-utc.png');
    logoTex.colorSpace = THREE.SRGBColorSpace; logoTex.anisotropy = 8;
  }
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.06, 48), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, clippingPlanes: planes }));
  disc.rotation.x = Math.PI / 2; disc.position.set(x, z0 + dz, 0.09); disc.castShadow = true; disc.name = 'Logo_De';
  const logo = new THREE.Mesh(new THREE.CircleGeometry(1.04, 64), new THREE.MeshStandardMaterial({
    map: logoTex, transparent: true, alphaTest: 0.05, roughness: 0.6, emissive: 0xffffff, emissiveMap: logoTex, emissiveIntensity: 0.22, clippingPlanes: planes,
  }));
  logo.position.set(x, z0 + dz, 0.125); logo.name = 'Logo_UTC2';
  for (const m of [disc, logo]) { m.userData.facade = true; m.userData.keep = true; }
  return [disc, logo];
}
