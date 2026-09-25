// Mặt đứng PA1 · PA2 · PA3 cho phương án "Báo cáo V3" – diễn giải từ các ảnh phối cảnh trong Báo cáo tóm tắt
// A1-2B V3 (24/09/2026). Báo cáo chỉ có ảnh phối cảnh minh hoạ (không có bản vẽ mặt đứng) → kích thước chi tiết
// là ước lượng, bám lưới cột, cao độ tầng, lõi thang và khối nhà của hồ sơ TKSB (mặt bằng không đổi).
import * as THREE from 'three';
import { M, L, W, GRADE, ROOF, TOWER_TOP, TUM_TOP, V } from './common.js';
import { logoBadge } from './storey.js';

export const FACADES = {
  tksb: { btn: 'Theo hồ sơ TKSB', file: '', tag: '', hint: 'Vỏ bao che theo hồ sơ TKSB: khối trắng trái, khối xanh phải, vách kính + lam ngang thân giữa.' },
  pa1: { btn: 'PA1', file: 'PA1', tag: 'MẶT ĐỨNG PA1', hint: 'PA1: đá ốp màu kem, trụ đứng viền vàng đồng, vách kính + băng spandrel xanh; khối phải khung đá + lam vàng đồng và logo.' },
  pa2: { btn: 'PA2', file: 'PA2', tag: 'MẶT ĐỨNG PA2', hint: 'PA2: cùng bố cục PA1, tông trắng lạnh, kính xanh đậm hơn, lam vàng nhạt.' },
  pa3: { btn: 'PA3', file: 'PA3', tag: 'MẶT ĐỨNG PA3', hint: 'PA3: khung lưới đá lớn 2–3 tầng, kính xanh, bồn cây xanh so le, dải lam vàng; khối phải dải kính xanh + logo, khối trái cửa sổ vuông.' },
};
export const paActive = () => V.v3 && V.facade !== 'tksb' && !!FACADES[V.facade];

let B = null, P = null;   // builder + bảng vật liệu của lần dựng hiện hành
const pal = () => V.facade === 'pa2' ? { st: M.stone2, gl: M.cwGlass2, au: M.gold2, bk: M.gold2 }
  : V.facade === 'pa3' ? { st: M.stone, gl: M.cwGlass3, au: M.gold, bk: M.bronze } : { st: M.stone, gl: M.cwGlass, au: M.gold, bk: M.gold };

// f: 0 = mặt trước (Y = 0), 1 = mặt sau (Y = W), 2 = hồi trái (X = 0), 3 = hồi phải (X = L)
// u: toạ độ dọc mặt (X với f = 0/1, Y với f = 2/3); o: khoảng nhô ra ngoài mặt nhà (âm = lùi vào trong)
function fb(f, u0, u1, o0, o1, z0, z1, m) {
  if (f === 0) B.box(u0, u1, -o1, -o0, z0, z1, m);
  else if (f === 1) B.box(u0, u1, W + o0, W + o1, z0, z1, m);
  else if (f === 2) B.box(-o1, -o0, u0, u1, z0, z1, m);
  else B.box(L + o0, L + o1, u0, u1, z0, z1, m);
}
// hình chữ nhật [u0,u1]×[z0,z1] trừ các lỗ [a0,a1,b0,b1] → các hình chữ nhật đặc (gộp theo cột)
function solid(u0, u1, z0, z1, holes) {
  const cuts = (a, b, k) => [...new Set([a, b, ...holes.flatMap(h => [h[k], h[k + 1]])])].filter(v => v >= a && v <= b).sort((p, q) => p - q);
  const us = cuts(u0, u1, 0), zs = cuts(z0, z1, 2), out = [];
  for (let a = 0; a < us.length - 1; a++) {
    const uc = (us[a] + us[a + 1]) / 2; let run = null;
    for (let b = 0; b < zs.length - 1; b++) {
      const zc = (zs[b] + zs[b + 1]) / 2;
      if (holes.some(h => uc > h[0] && uc < h[1] && zc > h[2] && zc < h[3])) { if (run) out.push(run); run = null; }
      else if (run) run[3] = zs[b + 1]; else run = [us[a], us[a + 1], zs[b], zs[b + 1]];
    }
    if (run) out.push(run);
  }
  return out;
}
function wall(f, u0, u1, z0, z1, holes = [], o0 = -0.2, o1 = 0.08, m = P.st) {
  for (const r of solid(u0, u1, z0, z1, holes)) fb(f, r[0], r[1], o0, o1, r[2], r[3], m);
}
// ô kính (tâm tại độ nhô og) + đố đứng chia ô ≈ step m (step = 0: không chia)
function pane(f, u0, u1, z0, z1, step = 1.25, og = -0.12, gl = P.gl) {
  if (z1 - z0 < 0.05 || u1 - u0 < 0.05) return;
  fb(f, u0, u1, og - 0.02, og + 0.02, z0, z1, gl);
  const n = step ? Math.max(1, Math.round((u1 - u0) / step)) : 1;
  for (let k = 1; k < n; k++) { const u = u0 + (u1 - u0) * k / n; fb(f, u - 0.025, u + 0.025, og - 0.05, og + 0.05, z0, z1, M.bronze); }
}
// băng sàn che đầu sàn + dầm biên (zf − 0,6 → zf + 0,1): tấm spandrel, có/không chỉ vàng
const BD = 0.6;
function band(f, u0, u1, zf, gold = true) {
  fb(f, u0, u1, -0.09, 0.03, zf - BD, gold ? zf + 0.05 : zf + 0.1, M.spandrel);
  if (gold) { fb(f, u0, u1, -0.09, 0.05, zf + 0.05, zf + 0.1, P.au); fb(f, u0, u1, -0.09, 0.05, zf - BD - 0.05, zf - BD, P.au); }
}
// dải kính đứng xuyên tầng trong tường đá (tầng i, sàn tại z0)
function strip(f, u0, u1, i, z0, z1, step = 1.2, gold = false) {
  pane(f, u0, u1, i ? z0 + 0.1 : 0.3, z1 - BD, step);
  if (i) band(f, u0, u1, z0, gold);
}
function pilaster(f, x, w, d, z0, z1, back = -0.1) {
  fb(f, x - w / 2, x + w / 2, back, d, z0, z1, P.st);
  fb(f, x - w / 2 - 0.06, x - w / 2, back, d - 0.12, z0, z1, P.au);
  fb(f, x + w / 2, x + w / 2 + 0.06, back, d - 0.12, z0, z1, P.au);
}
function slats(f, u0, u1, z0, z1, o0 = -0.04, o1 = 0.16, pitch = 0.3, w = 0.1, backing = true) {
  if (z1 - z0 < 0.05) return;
  if (backing) fb(f, u0, u1, -0.14, o0, z0, z1, P.bk);   // PA1/PA2: tấm nền cùng màu lam → mảng ốp gỗ có rãnh; PA3: nền sẫm
  const n = Math.max(1, Math.round((u1 - u0) / pitch));
  for (let k = 0; k < n; k++) { const u = u0 + (k + 0.5) * (u1 - u0) / n; fb(f, u - w / 2, u + w / 2, o0, o1, z0, z1, P.au); }
}
// cửa sổ vuông: kính + khung viền đồng sẫm nhô khỏi tường
function sqwin(f, u0, u1, [z0, z1], t = 0.08) {
  pane(f, u0, u1, z0, z1, 0);
  fb(f, u0 - t, u1 + t, 0.08, 0.18, z1, z1 + t, M.bronze); fb(f, u0 - t, u1 + t, 0.08, 0.24, z0 - t, z0, M.bronze);
  fb(f, u0 - t, u0, 0.08, 0.18, z0, z1, M.bronze); fb(f, u1, u1 + t, 0.08, 0.18, z0, z1, M.bronze);
}
// bụi cây trong bồn (khối cầu dẹt)
function blob(f, u, o, z, r) {
  const g = new THREE.IcosahedronGeometry(r, 1); g.scale(1, 0.8, 1);
  const [x, y] = f === 0 ? [u, -o] : f === 1 ? [u, W + o] : f === 2 ? [-o, u] : [L + o, u];
  g.translate(x, z, -y); B.add(g, M.shrub);
}

// ======================= PA1 / PA2 =======================
const PIL = [[8.2, 0.9], [13.2, 0.55], [18.2, 0.9], [23.2, 0.55], [28.2, 0.9], [33.2, 0.55], [38.2, 0.9]];
const pilD = (f, w) => (w > 0.8 ? (f ? 0.6 : 0.8) : (f ? 0.45 : 0.62));
const END_MULL = [[3.2, 0.08], [4.7, 0.45], [6.15, 0.08], [7.6, 0.08], [9.0, 0.45], [10.15, 0.08]];

// sảnh T1 mặt trước: vách kính lùi sâu 0,6 m, đố + khung cửa chính đồng sẫm
function lobbyGlass(zt) {
  fb(0, 8.2, 38.2, -0.62, -0.58, 0, zt, P.gl);
  for (let x = 9.45; x < 38.1; x += 1.25) if (x < 20.4 || x > 26.0) fb(0, x - 0.03, x + 0.03, -0.66, -0.54, 0, zt, M.bronze);
  fb(0, 20.6, 25.9, -0.7, -0.5, 2.6, zt, M.bronze);
  for (const x of [20.6, 21.9, 23.2, 24.5, 25.8]) fb(0, x - 0.05, x + 0.05, -0.7, -0.5, 0, 2.6, M.bronze);
}

function pa12(g, i, z0, z1) {
  const s = i ? z0 : 0.3, zg = i ? z0 : GRADE;   // T1: ốp đá chạy xuống tới mặt sân (sàn T1 cao hơn sân 1,0 m)
  // khối lõi thang trái: tường đá, dải kính thang bộ X 0,7–2,9, ô kính hẹp X 6,4–7,4; hồi trái 2 khe kính
  wall(0, -0.08, 8.2, zg, z1, [[0.7, 2.9, s, z1], [6.4, 7.4, s, z1]]); strip(0, 0.7, 2.9, i, z0, z1); strip(0, 6.4, 7.4, i, z0, z1, 0);
  wall(1, -0.08, 8.2, zg, z1, [[0.7, 2.9, s, z1]]); strip(1, 0.7, 2.9, i, z0, z1);
  wall(2, 0.2, 12.8, zg, z1, [[1.4, 2.2, s, z1], [10.8, 11.6, s, z1]]); strip(2, 1.4, 2.2, i, z0, z1, 0); strip(2, 10.8, 11.6, i, z0, z1, 0);
  // thân giữa: vách kính + băng spandrel chỉ vàng; trụ đá viền vàng (T1 chỉ trụ lớn, chạm đất)
  for (const f of [0, 1]) {
    if (i) { band(f, 8.2, 38.2, z0); pane(f, 8.2, 38.2, z0 + 0.1, z1 - BD); }
    for (const [x, w] of PIL) if (i || w > 0.8) pilaster(f, x, w, pilD(f, w), zg, i ? z1 : 3.4, !i && !f ? -0.58 : -0.1);
  }
  if (!i) {
    lobbyGlass(3.4);
    fb(0, 7.75, 38.65, -0.62, 0.8, 3.4, 4.12, P.st);                                         // dầm đá đỡ trụ trên sảnh
    fb(0, 19.2, 27.3, -0.58, 3.2, 3.1, 3.4, P.st); fb(0, 19.2, 27.3, 3.2, 3.26, 3.02, 3.4, P.au);   // mái sảnh + viền vàng
    wall(1, 14.43, 31.96, GRADE, 3.4);                                                        // tường sau hội trường ốp đá + chỉ vàng
    for (let x = 15.2; x < 31.5; x += 0.8) fb(1, x - 0.02, x + 0.02, 0.08, 0.11, 0.3, 3.1, P.au);
    pane(1, 8.2, 14.43, 0, 3.4); pane(1, 31.96, 38.2, 0, 3.4);
    fb(1, 7.75, 38.65, -0.2, 0.6, 3.4, 4.12, P.st);
  }
  // khối phải: khung đá nhô, tấm lam vàng đồng từ T3 lên đỉnh tum (T1–T2 kính); mặt sau dải kính; hồi phải vách kính trụ vàng
  wall(0, 38.65, 46.48, zg, z1, [[39.2, 45.6, i ? z0 : 0, z1]], -0.2, 0.3);
  if (i <= 1) { pane(0, 39.2, 45.6, i ? z0 + 0.1 : 0, z1 - BD, 1.07); if (i) band(0, 39.2, 45.6, z0, false); }
  else { if (i === 2) fb(0, 39.2, 45.6, -0.2, 0.2, z0 - BD, z0 + 0.1, P.st); slats(0, 39.2, 45.6, i === 2 ? z0 + 0.1 : z0, z1, 0.01, 0.2); }
  wall(1, 38.65, 46.48, zg, z1, [[40.0, 44.6, s, z1]]); strip(1, 40.0, 44.6, i, z0, z1, 1.15);
  wall(3, 0.2, 12.8, zg, z1, [[1.7, 11.3, s, z1]]); strip(3, 1.7, 11.3, i, z0, z1, 0, true);
  for (const [y, w] of END_MULL) fb(3, y - w / 2, y + w / 2, -0.17, 0.12, s, z1, P.au);
  if (i === 8) g.add(...logoBadge(z0, 42.4, 2.2, 0.2, 1.5));
}

function roof12() {
  const R = ROOF, T = TOWER_TOP, U = TUM_TOP;
  for (const f of [0, 1]) {   // lan can đá + gờ vàng; trụ vượt mái
    fb(f, 8.2, 38.2, -0.2, 0.3, R - BD, R + 1.1, P.st); fb(f, 8.2, 38.2, -0.2, 0.34, R + 1.1, R + 1.16, P.au);
    fb(f, 8.2, 38.2, -0.09, 0.05, R - BD - 0.05, R - BD, P.au);
    for (const [x, w] of PIL) pilaster(f, x, w, pilD(f, w), R, R + (w > 0.8 ? 1.6 : 1.35));
  }
  // tháp thang trái: dải kính thang bộ chạy tiếp lên đỉnh tháp
  for (const f of [0, 1]) { wall(f, -0.08, 8.2, R, T, [[0.7, 2.9, R, T - 0.6]]); band(f, 0.7, 2.9, R, false); pane(f, 0.7, 2.9, R + 0.1, T - 0.6, 1.2); }
  fb(0, 6.4, 7.4, -0.2, 0.08, R - BD, R, P.st);
  wall(2, 0.2, 12.8, R, T); for (const [a, b] of [[1.4, 2.2], [10.8, 11.6]]) fb(2, a, b, -0.2, 0.08, R - BD, R, P.st);
  B.box(8.0, 8.2, 0.2, 12.8, R, T, P.st); B.box(0.2, 8.0, 0.2, 12.8, T - 0.15, T, P.st);
  // tum phải: khung đá + lam vàng tới đỉnh, mặt sau dải kính, hồi phải vách kính
  wall(0, 38.65, 46.48, R, U, [[39.2, 45.6, R, U - 0.6]], -0.2, 0.3); slats(0, 39.2, 45.6, R, U - 0.6, 0.01, 0.2);
  wall(1, 38.65, 46.48, R, U, [[40.0, 44.6, R, U - 0.6]]); band(1, 40.0, 44.6, R, false); pane(1, 40.0, 44.6, R + 0.1, U - 0.6, 1.15);
  wall(3, 0.2, 12.8, R, U, [[1.7, 11.3, R, U - 0.6]]); band(3, 1.7, 11.3, R); pane(3, 1.7, 11.3, R + 0.1, U - 0.6, 0);
  for (const [y, w] of END_MULL) fb(3, y - w / 2, y + w / 2, -0.17, 0.12, R, U - 0.6, P.au);
  B.box(38.2, 38.4, 0.2, 12.8, R, U, P.st); B.box(38.4, 46.2, 0.2, 12.8, U - 0.15, U, P.st);
}

// ======================= PA3 =======================
// 3 dải khung lưới: A = T2–T3, B = T4–T6, C = T7–T9; vị trí thanh đứng mỗi dải lệch nhau
const P3V = [[8.2, 16.2, 23.2, 30.2, 38.2], [8.2, 20.2, 26.2, 38.2], [8.2, 14.2, 28.2, 38.2]];
const band3 = i => (i <= 2 ? 0 : i <= 5 ? 1 : 2);
const first3 = i => i === 1 || i === 3 || i === 6;
const OG3 = 0.04;   // kính PA3 đặt ngoài mép sàn, dầm biên

function pa3(g, i, z0, z1) {
  const s = i ? z0 : 0, zg = i ? z0 : GRADE, win = i ? [z0 + 0.9, z1 - 0.8] : [0.9, 3.0];
  // khối trái + khối phải (mặt sau): cửa sổ vuông viền đồng; khối phải mặt trước: dải kính xanh suốt chiều cao + logo
  for (const f of [0, 1]) { wall(f, -0.08, 8.2, zg, z1, [[2.8, 4.6, ...win]]); sqwin(f, 2.8, 4.6, win); }
  wall(2, 0.2, 12.8, zg, z1, [[2.2, 3.6, ...win], [9.4, 10.8, ...win]]); sqwin(2, 2.2, 3.6, win); sqwin(2, 9.4, 10.8, win);
  wall(0, 38.5, 46.48, zg, z1, [[40.2, 44.4, s, z1]]);
  pane(0, 40.2, 44.4, i ? z0 + 0.05 : 0, z1 - 0.1, 1.05, OG3); if (i) fb(0, 40.2, 44.4, 0, 0.1, z0 - 0.1, z0 + 0.05, M.cwFrame);
  wall(1, 38.5, 46.48, zg, z1, [[41.3, 43.3, ...win]]); sqwin(1, 41.3, 43.3, win);
  wall(3, 0.2, 12.8, zg, z1, [[2.2, 3.6, ...win], [5.5, 7.5, s, z1], [9.4, 10.8, ...win]]); sqwin(3, 2.2, 3.6, win); sqwin(3, 9.4, 10.8, win);
  pane(3, 5.5, 7.5, i ? z0 + 0.05 : 0, z1 - 0.1, 1.0, OG3); if (i) fb(3, 5.5, 7.5, 0, 0.1, z0 - 0.1, z0 + 0.05, M.cwFrame);
  if (i === 8) g.add(...logoBadge(z0, 42.3, 2.2, 0.09, 1.3));
  if (!i) {   // T1: sảnh kính lùi, chân khung đá, mái sảnh; mặt sau tường hội trường + kính
    lobbyGlass(3.4);
    fb(0, 7.9, 38.5, -0.62, 0, 3.4, 4.0, P.st);
    for (const [x, d] of [[8.2, 0.9], [18.2, 0.6], [28.2, 0.6], [38.2, 0.9]]) fb(0, x - 0.3, x + 0.3, -0.58, d, GRADE, 3.65, P.st);
    fb(0, 19.2, 27.3, -0.58, 3.0, 3.15, 3.4, P.st); fb(0, 19.2, 27.3, 3.0, 3.06, 3.07, 3.4, P.au);
    wall(1, 14.43, 31.96, GRADE, 3.65); pane(1, 8.2, 14.43, 0, 3.65, 1.25, OG3); pane(1, 31.96, 38.2, 0, 3.65, 1.25, OG3);
    for (const x of [8.2, 38.2]) fb(1, x - 0.3, x + 0.3, -0.1, 0.9, GRADE, 3.65, P.st);
    return;
  }
  const b = band3(i), vx = P3V[b], fst = first3(i), topFirst = i === 8 || first3(i + 1);
  const zb = fst ? z0 + 0.3 : z0 + 0.1, zt = topFirst ? z1 - 0.35 : z1 - 0.2, zp = zb;
  const sz0 = fst ? z0 + 0.3 : z0, sz1 = topFirst ? z1 - 0.35 : z1;
  for (const f of [0, 1]) {
    if (fst) fb(f, 7.9, 38.5, -0.1, 0.9, z0 - 0.35, z0 + 0.3, P.st); else fb(f, 8.2, 38.2, -0.1, 0.25, z0 - 0.2, z0 + 0.1, P.st);
    for (const x of vx) fb(f, x - 0.3, x + 0.3, -0.1, 0.9, z0, z1, P.st);
    for (let k = 0; k < vx.length - 1; k++) {
      const a = vx[k] + 0.3, c = vx[k + 1] - 0.3;
      pane(f, a, c, zb, zt, 1.6, OG3);
      if ((b + k + f) % 2) continue;   // bồn cây xanh ở các ô khung so le
      const a2 = f ? Math.max(a, 11.1) : a, c2 = f ? c : Math.min(c, 35.3);
      if (c2 - a2 < 1.5) continue;
      if (!fst) fb(f, a2, c2, 0.25, 0.9, z0 - 0.2, z0 + 0.1, P.st);
      fb(f, a2 + 0.1, c2 - 0.1, 0.3, 0.85, zp, zp + 0.45, M.planter);
      for (let u = a2 + 0.45, n = 0; u < c2 - 0.35; u += 0.68, n++) blob(f, u, 0.57, zp + 0.62, 0.3 + ((n * 7 + i * 3 + k) % 4) * 0.045);
    }
    for (const [a, c] of f ? [[8.5, 10.8], [35.6, 37.9]] : [[35.6, 37.9]]) slats(f, a, c, sz0, sz1, 0.3, 0.55, 0.25, 0.08, false);
  }
}

function roof3() {
  const R = ROOF, T = TOWER_TOP, U = TUM_TOP, win = [R + 0.9, T - 0.8];
  for (const f of [0, 1]) fb(f, 7.9, 38.5, -0.1, 0.9, R - 0.35, R + 0.9, P.st);   // dầm đỉnh khung lưới + lan can
  slats(0, 14.4, 28.0, R + 0.9, R + 2.3, 0.2, 0.45, 0.3, 0.08, false); fb(0, 14.4, 28.0, 0.15, 0.5, R + 2.3, R + 2.4, P.au);
  for (const f of [0, 1]) { wall(f, -0.08, 8.2, R, T, [[2.8, 4.6, ...win]]); sqwin(f, 2.8, 4.6, win); }
  wall(2, 0.2, 12.8, R, T, [[2.2, 3.6, ...win], [9.4, 10.8, ...win]]); sqwin(2, 2.2, 3.6, win); sqwin(2, 9.4, 10.8, win);
  B.box(8.0, 8.2, 0.2, 12.8, R, T, P.st); B.box(0.2, 8.0, 0.2, 12.8, T - 0.15, T, P.st);
  const tw = [R + 0.6, U - 0.6];
  wall(0, 38.5, 46.48, R, U, [[40.2, 44.4, R, U - 0.45]]); fb(0, 40.2, 44.4, 0, 0.1, R - 0.1, R + 0.05, M.cwFrame); pane(0, 40.2, 44.4, R + 0.05, U - 0.45, 1.05, OG3);
  wall(1, 38.5, 46.48, R, U, [[41.3, 43.3, ...tw]]); sqwin(1, 41.3, 43.3, tw);
  wall(3, 0.2, 12.8, R, U, [[5.5, 7.5, R, U - 0.45]]); fb(3, 5.5, 7.5, 0, 0.1, R - 0.1, R + 0.05, M.cwFrame); pane(3, 5.5, 7.5, R + 0.05, U - 0.45, 1.0, OG3);
  B.box(38.2, 38.4, 0.2, 12.8, R, U, P.st); B.box(38.4, 46.2, 0.2, 12.8, U - 0.15, U, P.st);
}

// ---- điểm vào: storey.js / roofsite.js gọi khi paActive()
export function facadePA(b, g, i, z0, z1) {
  B = b; P = pal();
  if (V.facade === 'pa3') pa3(g, i, z0, z1); else pa12(g, i, z0, z1);
  B = null;
}
export function roofPA(b) {
  B = b; P = pal();
  if (V.facade === 'pa3') roof3(); else roof12();
  B = null;
}
