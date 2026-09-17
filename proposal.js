// Phương án đề xuất: các hạng mục bổ sung/thay đổi so với bản vẽ gốc (dựng khi V.proposal = true).
// Mọi hình khối ở đây đi qua Builder(true) → mesh có userData.prop để có thể tô sáng.
import { M, GRADE, ROOF, HC, hallXL } from './common.js';

export const CHANGES = [
  ['PCCC', 'Hai buồng thang bộ chuyển thành loại không nhiễm khói N2/N3: buồng đệm 2 cửa chống cháy trước mỗi lối vào thang (T1–T9) + ống tăng áp trong giếng thang, quạt đặt trên tum.'],
  ['PCCC', 'Tháp thang máy bổ sung sát mặt sau (trục 5, X 36,2–41,0): 1 thang máy chữa cháy có sảnh đệm riêng T2–T9, ở T1 mở thẳng ra sân sau (sân đỗ xe chữa cháy) + 1 thang máy khách mở vào sảnh/hành lang.'],
  ['Kết cấu', 'Dầm chuyển 0,7 × 1,15 m ở sàn T3 theo trục 3 và 4 (nhịp 12,6 m, trục A→D) đỡ 4 cột bị ngắt trên hội trường; thông thuỷ hành lang T2 dưới dầm 2,45 m – cần kiểm tra khi thiết kế kết cấu.'],
  ['Hội trường', 'Lối vào/thoát nạn thứ hai từ sảnh T2: 2 cửa đôi 1,4 m hai bên tường trước, mỗi cửa có chiếu tới + vế thang 10 bậc chạy dọc tường xuống lối đi giữa ở hàng ghế trên cùng (−1,84 m); 2 vị trí xe lăn ở hàng đầu cạnh cửa. Giảm ≈ 11 chỗ hàng cuối.'],
  ['Vỏ bao che', 'Thay lam ngang trên thân kính bằng hệ che nắng dạng hộp (fin đứng cách 1,25 m + 2 tấm ngang, sâu 0,7 m) hiệu quả cho cả nắng Đông/Tây; kết hợp kính Low-E. Kiểm tra bằng công cụ bóng nắng.'],
  ['Mái', 'Mái xanh 29,6 × 9,6 m trên sàn mái (cách nhiệt, giảm nhiệt tầng 9) + 162 tấm PV ≈ 50 kWp đặt nghiêng 10° trên pergola.'],
  ['Sân', 'Dốc tiếp cận độ dốc 1/12: hai vế 6 m + chiếu nghỉ 1,4 m, tay vịn; mái sảnh chính mở rộng 13,3 × 4,9 m trên 4 cột mảnh; nhà để xe máy 30 × 5 m (~65 xe) phía sau; lối ra sau nhà từ sảnh T1.'],
];

const fireDoor = (P, x0, x1, y0, y1, z0) => P.box(x0, x1, y0, y1, z0, z0 + 2.2, M.fire);

// ---- phòng bổ sung (buồng đệm, sảnh thang máy chữa cháy) → có patch màu, nhãn và tooltip như phòng thường
export function propRooms(i, rooms) {
  const out = rooms.filter(r => !(i === 8 && r.name === 'KHO' && r.x0 < 39));
  const vest = (x0, x1, y0, y1, prop) => ({ x0, x1, y0, y1, k: 'circ', name: 'BUỒNG ĐỆM TĂNG ÁP (thang N2/N3)', area: +((x1 - x0) * (y1 - y0)).toFixed(1), est: true, prop });
  out.push(vest(5.9, 8.05, 4.44, 6.5, vestLeft));
  if (i === 0) out.push(vest(35.85, 38.29, 2.44, 4.59, vestRightT1));
  else {
    out.push(vest(38.35, 40.5, 4.44, 6.5, vestRight));
    out.push({ x0: 38.39, x1: 41.0, y0: 9.98, y1: 12.79, k: 'corr', name: 'SẢNH THANG MÁY CHỮA CHÁY', area: 7.3, est: true, prop: liftLobby });
  }
  return out;
}
function vestLeft(P, r, z0, z1) {
  const h = z1 - 0.15;
  P.box(5.9, 6.05, 4.44, 6.65, z0, h, M.wall); P.box(8.05, 8.2, 4.44, 6.65, z0, h, M.wall); P.box(5.9, 8.2, 6.5, 6.65, z0, h, M.wall);
  fireDoor(P, 6.5, 7.45, 6.48, 6.67, z0);
}
function vestRight(P, r, z0, z1) {
  const h = z1 - 0.15;
  P.box(38.2, 38.35, 4.44, 6.65, z0, h, M.wall); P.box(40.5, 40.65, 4.44, 6.65, z0, h, M.wall); P.box(38.2, 40.65, 6.5, 6.65, z0, h, M.wall);
  fireDoor(P, 38.9, 39.85, 6.48, 6.67, z0);
}
function vestRightT1(P, r, z0, z1) {
  const h = z1 - 0.15;
  P.box(35.7, 35.85, 2.29, 4.74, z0, h, M.wall); P.box(35.7, 38.29, 2.29, 2.44, z0, h, M.wall); P.box(35.7, 38.29, 4.59, 4.74, z0, h, M.wall);
  fireDoor(P, 36.6, 37.55, 4.57, 4.76, z0);      // từ sảnh tầng 1
  fireDoor(P, 38.12, 38.31, 3.1, 4.05, z0);      // vào buồng thang
}
function liftLobby(P, r, z0, z1) {
  const h = z1 - 0.15;
  P.box(38.24, 38.39, 9.83, 12.79, z0, h, M.wall); P.box(38.24, 41.0, 9.83, 9.98, z0, h, M.wall);
  fireDoor(P, 38.22, 38.41, 11.0, 11.95, z0); fireDoor(P, 39.5, 40.45, 9.81, 10.0, z0);
}

// ---- theo tầng: ống tăng áp, tháp thang máy, dầm chuyển, hộp che nắng
export function propStorey(P, i, z0, z1) {
  P.box(7.35, 7.95, 0.3, 0.9, z0, z1, M.shaft); P.box(38.45, 39.05, 0.3, 0.9, z0, z1, M.shaft);   // ống tăng áp 2 lõi thang
  tower(P, i === 0 ? GRADE : z0, z1);
  P.box(36.7, 37.8, 12.72, 13.1, z0, z0 + 2.2, M.steel);                                             // cửa thang máy khách
  if (i === 0) { P.box(39.1, 40.2, 15.35, 15.6, z0, z0 + 2.2, M.steel); P.box(34.4, 35.6, 12.72, 13.1, z0, z0 + 2.2, M.door); }
  else P.box(39.1, 40.2, 12.72, 13.1, z0, z0 + 2.2, M.steel);                                        // cửa thang máy chữa cháy
  if (i === 2) for (const x of [18.2, 28.2]) P.box(x - 0.35, x + 0.35, 0.2, 12.8, z0 - 1.15, z0 - 0.15, M.concrete);   // dầm chuyển
  if (i >= 1) {
    const g0 = z0 + 0.12, g1 = z1 - 0.6;
    for (let x = 8.2; x <= 38.2 + 1e-6; x += 1.25) P.box(x - 0.04, x + 0.04, -0.75, -0.05, g0, g1, M.fin);
    for (const dz of [1.2, 2.75]) P.box(8.2, 38.2, -0.75, -0.05, z0 + dz - 0.03, z0 + dz + 0.03, M.louvre);
  }
}
function tower(P, z0, z1) {
  const x0 = 36.2, x1 = 41.0, y0 = 13.05, y1 = 15.45, t = 0.2;
  P.box(x0, x1, y1 - t, y1, z0, z1, M.white); P.box(x0, x0 + t, y0, y1, z0, z1, M.white); P.box(x1 - t, x1, y0, y1, z0, z1, M.white);
  P.box(38.5, 38.8, y0, y1, z0, z1, M.shaft); P.box(x0, x1, y0, y0 + 0.12, z0, z1, M.shaft);
}

// ---- hội trường: lối vào từ T2 (P2 → nhóm T2), chỗ xe lăn (P1 → nhóm T1)
export function propHall(P1, P2) {
  for (const x of [15.3, 30.2]) P1.box(x, x + 0.9, 7.35, 8.75, 0.012, 0.035, M.p1);
  // tường trước phía trên: 2 cửa đôi hai bên (X 18,8–20,2 và 26,19–27,59), lanh tô + bệ chung
  P2.box(18.5, 27.9, 2.18, 2.38, 6.2, 7.45, M.wall); P2.box(18.5, 27.9, 2.18, 2.38, 3.85, 4.0, M.wall);
  P2.box(18.5, 18.8, 2.18, 2.38, 4.0, 6.2, M.wall); P2.box(20.2, 26.19, 2.18, 2.38, 4.0, 6.2, M.wall); P2.box(27.59, 27.9, 2.18, 2.38, 4.0, 6.2, M.wall);
  P2.box(18.8, 20.2, 2.16, 2.4, 4.0, 6.2, M.door); P2.box(26.19, 27.59, 2.16, 2.4, 4.0, 6.2, M.door);
  // chiếu tới +4,0 (bệ đặc ôm theo tường xiên) + vế thang 10 bậc (0,184 × 0,25) chạy dọc tường trước, hội tụ về lối đi giữa (+2,16)
  const TIER6 = 2.16, mx = x => 2 * HC - x;
  for (const [xl, dir] of [[20.3, 1], [26.09, -1]]) {
    const f = dir > 0 ? (x => x) : mx;   // vế phải = đối xứng qua trục giữa hội trường
    P2.poly([[f(hallXL(2.38)), 2.38], [f(20.3), 2.38], [f(20.3), 3.3], [f(hallXL(3.3)), 3.3]], TIER6, 4.0, M.concrete);
    for (let k = 0; k < 9; k++) {
      const zt = 4.0 - (k + 1) * 0.184, xa = xl + dir * k * 0.25, xb = xl + dir * (k + 1) * 0.25;
      P2.box(Math.min(xa, xb), Math.max(xa, xb), 2.38, 3.3, TIER6, zt, M.stair);
    }
    // lan can kính phía khán đài: đoạn ngang trên chiếu tới + đoạn nghiêng theo vế thang
    const [lx0, lx1] = [f(hallXL(3.3)) , f(20.3)].sort((a, b) => a - b);
    P2.box(lx0, lx1, 3.3, 3.33, 4.0, 4.9, M.railGlass); P2.box(lx0, lx1, 3.28, 3.35, 4.9, 4.97, M.rail);
    const len = Math.hypot(2.25, 1.84), tilt = -dir * Math.atan2(1.84, 2.25), cx = xl + dir * 1.125, cz = (4.0 + TIER6) / 2;
    P2.slope(cx, 3.315, cz + 0.45, len, 0.03, 0.9, 0, tilt, M.railGlass);
    P2.slope(cx, 3.315, cz + 0.93, len, 0.07, 0.05, 0, tilt, M.rail);
  }
}

// ---- mái: mái xanh, PV trên pergola, đỉnh tháp thang máy
export function propRoof(P) {
  P.box(8.4, 38.0, 1.0, 10.6, ROOF, ROOF + 0.22, M.green);
  for (let yc = 1.55; yc < 12.0; yc += 1.9) for (let x = 8.6; x + 1.0 <= 38.0; x += 1.1) P.slope(x + 0.5, yc, 36.05, 1.7, 1.0, 0.05, Math.PI / 2, 0.17, M.pv);
  tower(P, ROOF, ROOF + 3.3); P.box(36.2, 41.0, 13.05, 15.45, ROOF + 3.15, ROOF + 3.3, M.white);
  P.box(38.9, 40.4, 13.4, 14.6, ROOF + 3.3, ROOF + 3.9, M.steel);   // quạt/máy kéo trên đỉnh tháp
}

// ---- sân: dốc 1/12, mái sảnh mở rộng, sân + mái sảnh thang máy chữa cháy phía sau, nhà để xe máy
export function propSite(P) {
  const r1 = Math.hypot(6, 0.5), tl = Math.atan2(0.5, 6);
  P.slope(6.2, -0.95, GRADE + 0.25 - 0.07, r1, 1.7, 0.14, 0, tl, M.pave);
  P.box(9.2, 10.6, -1.8, -0.1, GRADE - 0.02, GRADE + 0.5, M.pave);
  P.slope(13.6, -0.95, GRADE + 0.75 - 0.07, r1, 1.7, 0.14, 0, tl, M.pave);
  P.slope(6.2, -1.85, GRADE + 0.25 + 0.9, r1, 0.06, 0.05, 0, tl, M.rail); P.slope(13.6, -1.85, GRADE + 0.75 + 0.9, r1, 0.06, 0.05, 0, tl, M.rail);
  P.box(9.2, 10.6, -1.88, -1.82, GRADE + 0.5 + 0.85, GRADE + 0.5 + 0.9, M.rail);
  for (const [x, h] of [[3.25, 0.9], [9.25, 1.4], [10.55, 1.4], [16.55, 1.9]]) P.box(x - 0.03, x + 0.03, -1.88, -1.82, GRADE, GRADE + h, M.rail);
  // mái sảnh chính
  P.box(16.6, 29.9, -4.6, 0.3, 3.3, 3.55, M.white); P.box(16.6, 29.9, -4.6, -4.35, 2.95, 3.3, M.white);
  for (const x of [17.3, 21.5, 25.0, 29.2]) P.box(x - 0.12, x + 0.12, -4.32, -4.08, GRADE, 3.3, M.white);
  // sân sau: sàn +0,0 trước cửa thang máy chữa cháy, bậc xuống, mái che, bãi đỗ xe chữa cháy
  P.box(34.0, 43.0, 15.45, 17.6, GRADE, 0, M.pave);
  for (let k = 0; k < 5; k++) P.box(34.0, 43.0, 17.6 + k * 0.42, 17.6 + (k + 1) * 0.42 + 0.01, GRADE, GRADE + (5 - k) * 0.2, M.pave);
  P.box(33.8, 43.2, 15.45, 18.1, 3.2, 3.45, M.white);
  for (const x of [34.1, 42.9]) P.box(x - 0.12, x + 0.12, 17.7, 17.94, GRADE, 3.2, M.white);
  P.box(30, 47, 19.7, 27, GRADE - 0.02, GRADE + 0.005, M.pave);
  for (let x = 31; x < 46; x += 2.4) P.box(x, x + 1.2, 23.2, 23.4, GRADE, GRADE + 0.02, M.fire);   // vạch sân đỗ xe chữa cháy
  // nhà để xe máy 30 × 5 m
  for (let x = 4; x <= 34; x += 6) for (const y of [16.3, 20.7]) P.box(x - 0.08, x + 0.08, y - 0.08, y + 0.08, GRADE, GRADE + 2.5, M.steel);
  P.slope(19, 18.5, GRADE + 2.62, 5.4, 30.4, 0.06, Math.PI / 2, 0.06, M.steel);
  for (let x = 4.6; x + 0.7 <= 33.6; x += 0.9) for (const y of [16.4, 18.7]) { P.box(x, x + 0.7, y, y + 1.9, GRADE + 0.2, GRADE + 0.75, M.dark); P.box(x + 0.1, x + 0.6, y + 0.9, y + 1.5, GRADE + 0.75, GRADE + 0.95, M.dark); }
  P.box(3.8, 34.2, 15.8, 21.2, GRADE, GRADE + 0.05, M.pave);
}
