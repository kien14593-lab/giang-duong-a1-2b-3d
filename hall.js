// Hội trường 204 chỗ: thông tầng T1–T2, sàn bậc, sân khấu, ghế; vào từ sảnh hai bên ở cao độ sàn.
import * as THREE from 'three';
import { Builder, M, HALL, HC, hallXL, polyGeom, V } from './common.js';
import { makePatch } from './storey.js';
import { propHall } from './proposal.js';
import { v3Hall } from './v3.js';

export function buildHall(g1, g2, hover) {
  const B = new Builder();
  const src = (V.v3 ? window.ROOMS_V3.T1 : window.ROOMS.T1).find(r => r.special === 'hall');
  const rec = { name: src.name, area: src.area, kind: 'hall', floor: 0, note: src.note };
  const floor = makePatch(polyGeom(HALL, 0.012, 0.02), 'hall', rec); g1.add(floor); hover.push(floor);

  // ---- tường T1 (0–3,85) dày 0,2 ra phía ngoài đa giác; bỏ cạnh trùng tường ngoài nhà
  for (let e = 0; e < HALL.length; e++) {
    const [x0, y0] = HALL[e], [x1, y1] = HALL[(e + 1) % HALL.length];
    if (y0 > 12.7 && y1 > 12.7) continue;
    B.wall(x0, y0, x1, y1, 0, 3.85, 0.2, M.wall);
  }
  // cửa đôi vào hội trường từ sảnh tầng 1 hai bên
  B.box(14.2, 14.46, 6.7, 8.5, 0, 2.4, M.door); B.box(31.93, 32.19, 6.7, 8.5, 0, 2.4, M.door);

  // ---- sân khấu, bậc lên, bục giảng, phông chiếu
  B.box(17.99, 28.4, 8.7, 10.48, 0, 0.9, M.stage);
  B.box(16.9, 17.99, 9.3, 10.33, 0, 0.45, M.stage); B.box(17.45, 17.99, 9.3, 10.33, 0.45, 0.9, M.stage);
  B.box(28.4, 29.49, 9.3, 10.33, 0, 0.45, M.stage); B.box(28.4, 28.94, 9.3, 10.33, 0.45, 0.9, M.stage);
  B.box(20.2, 20.9, 9.1, 9.6, 0.9, 2.0, M.wood);
  B.box(19.6, 26.8, 10.22, 10.3, 1.5, 3.5, M.board);

  // ---- khán đài bậc: 7 hàng sâu 0,83 m, chênh 0,36 m; hàng đầu ở cao độ sàn
  for (let k = 1; k <= 6; k++) {
    const ya = 8.2 - (k + 1) * 0.83, yb = 8.2 - k * 0.83, pts = [];
    const ys = [yb]; if (6.5 < yb && 6.5 > ya) ys.push(6.5); ys.push(ya);
    for (const y of ys) pts.push([hallXL(y), y]);
    for (let j = ys.length - 1; j >= 0; j--) pts.push([2 * HC - hallXL(ys[j]), ys[j]]);
    B.poly(pts, 0, k * 0.36, M.tier);
    B.box(22.6, 23.8, yb, yb + 0.4, (k - 1) * 0.36, (k - 0.5) * 0.36, M.tier);   // bậc phụ lối đi giữa
  }
  for (let k = 0; k <= 6; k++) {
    if (V.proposal && k === 6) continue;   // PA đề xuất: hàng trên cùng thành sàn cầu/thang vào từ T2
    const yc = 8.2 - (k + 0.5) * 0.83, zf = k * 0.36, xl = hallXL(yc) + 0.65, xr = 2 * HC - hallXL(yc) - 0.65;
    for (let x = xl; x + 0.5 <= xr; x += 0.56) {
      if (x + 0.5 > 22.55 && x < 23.85) continue;
      if (V.proposal && k === 0 && (x < 16.4 || x + 0.5 > 2 * HC - 16.4)) continue;   // chỗ xe lăn hàng đầu
      B.box(x, x + 0.5, yc - 0.22, yc + 0.22, zf + 0.22, zf + 0.45, M.seat);
      B.box(x, x + 0.5, yc - 0.34, yc - 0.22, zf + 0.22, zf + 0.98, M.seat);
    }
  }
  // lan can thấp mép hàng ghế trên cùng (bảo vệ phía tường trước)
  if (!V.proposal) B.box(hallXL(2.6) + 0.2, 2 * HC - hallXL(2.6) - 0.2, 2.42, 2.5, 2.16, 3.1, M.rail);
  B.build(g1);

  // ---- phần trên (T2, 3,85–7,45): tường quanh khối hội trường trong khoảng thông tầng
  const U = new Builder();
  const up = [[14.43, 10.48], [14.43, 6.5], [18.5, 2.38], [27.9, 2.38], [31.96, 6.5], [31.96, 10.48]];
  for (let e = 0; e < up.length - 1; e++) {
    if ((V.proposal || V.v3) && e === 2) continue;   // tường trước: PA đề xuất / V3 dựng lại với 2 cửa đôi
    U.wall(up[e][0], up[e][1], up[e + 1][0], up[e + 1][1], 3.85, 7.45, 0.2, M.wall);
  }
  U.box(14.23, 32.16, 10.33, 10.48, 3.85, 7.45, M.wall);
  if (!V.v3) U.box(18.6, 27.8, 2.16, 2.2, 6.0, 7.2, M.glass);   // dải cửa sổ hắt sáng (V3: dải kính nằm trên cửa ban công)
  U.build(g2);
  const labels = [{ x: HC, y: 6.3, z: 3.2, rec }];
  if (V.proposal) { const P1 = new Builder(true), P2 = new Builder(true); propHall(P1, P2); P1.build(g1); P2.build(g2); }
  if (V.v3) { const P2 = new Builder(true); labels.push(v3Hall(P2, g2, hover)); P2.build(g2); }

  return labels;
}
