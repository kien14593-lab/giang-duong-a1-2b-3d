// Phương án "Báo cáo V3" (24/09/2026): phần dựng thêm ngoài bảng phòng (data_v3.js) – ban công hội trường ở T2.
// Mọi hình khối đi qua Builder(true) → mesh có userData.prop (tô sáng được), tên tiền tố V3_.
import { M, HC, hallXL, polyGeom } from './common.js';
import { makePatch } from './storey.js';

export const CHANGES_V3 = [
  ['Nguồn', 'Báo cáo tóm tắt đầu tư A1-2B phiên bản V3 (24/09/2026): giữ khối nhà 9 tầng 46,4 × 13 m, lưới cột 8,2–10–10–10–8,2 m, lõi thang/WC theo hồ sơ TKSB; thay công năng các tầng theo bảng 2.2 và hình 1–3. Vỏ bao che mặc định theo hồ sơ TKSB; chọn được mặt đứng PA1 · PA2 · PA3 dựng lại theo ảnh phối cảnh của báo cáo (báo cáo chưa chốt phương án, không có bản vẽ mặt đứng → kích thước chi tiết là ước lượng).'],
  ['T1', 'Hội trường thông tầng T1–T2 (giữ 204 chỗ); Student Support Hub tại vị trí văn phòng cũ; giảng đường 56 chỗ; phòng GV + trực PCCC/an ninh sau lõi thang trái.'],
  ['T2', 'Ban công hội trường: lối đi ngang +4,6 và 3 hàng ghế bậc +4,3 / +4,0 / +3,7 m (≈ 53 chỗ), lan can trước cao 1,05 m, thông thuỷ dưới ban công ≥ 2,2 m so với bậc khán đài T1. Vào bằng 2 cửa đôi 1,4 m trên tường trước ở +4,6 qua bệ 3 bậc từ sảnh ban công (+4,0); phòng kỹ thuật/kho góc trước thu ngắn để mở lối từ hành lang bên. Báo cáo ghi 360 m² ≈ 358 chỗ – không khả thi trong lỗ thông tầng; kết cấu công-xôn ≈ 3,3 m cần tính riêng.'],
  ['T3', 'PTN thiết kế IC · PTN ứng dụng IC – đo kiểm – PCB · UPS/mạng/ESD (báo cáo 120 + 120 + 60 m² vượt vùng phòng ≈ 264 m² – mô hình chia theo tỷ lệ) · phòng GV.'],
  ['T4', 'Mô phỏng đường sắt 1, 2 (ca-bin lái + màn hình) · BIM-GIS/đồ hoạ · máy chủ/lưu trữ (tủ rack).'],
  ['T5', 'Mô phỏng đường sắt 3 · chuẩn bị/bảo quản thiết bị khảo sát số · Project/Capstone/Design Studio 140 m².'],
  ['T6', 'Phòng linh hoạt F2 215 m² – 170 chỗ; vách di động chia 70 + 100, mỗi nửa có cửa riêng ra hành lang.'],
  ['T7', 'Phòng linh hoạt F1 150 m² – 100 chỗ (vách di động chia 50 + 50) + phòng chuẩn 100 chỗ 110 m² (hình 3 trong báo cáo lại vẽ 70 + 50 chỗ).'],
  ['T8', 'Phòng chuẩn 50 chỗ · Seminar/Workshop/triển lãm 80 m² · phòng chuẩn 70 chỗ.'],
  ['T9', 'Phòng học 50 chỗ · Learning Commons 180 m² (bàn tròn, kệ sách) · phụ trợ dùng chung 28 m² · phòng GV.'],
];

// Ban công: [Y sau, Y trước, cao độ sàn]; hàng A là lối đi ngang sát tường trước, B–D có ghế, dốc xuống phía sân khấu
const ROWS = [[2.38, 3.22, 4.6], [3.22, 4.05, 4.3], [4.05, 4.88, 4.0], [4.88, 5.71, 3.7]];
const mx = x => 2 * HC - x;
const band = (ya, yb) => [[hallXL(yb), yb], [hallXL(ya), ya], [mx(hallXL(ya)), ya], [mx(hallXL(yb)), yb]];
const bandArea = (ya, yb) => ((mx(hallXL(ya)) - hallXL(ya)) + (mx(hallXL(yb)) - hallXL(yb))) / 2 * (yb - ya);

// P: Builder(true) đổ vào nhóm T2; g2/hover: nhóm T2 và danh sách mesh rê chuột. Trả về nhãn ban công.
export function v3Hall(P, g2, hover) {
  const rec = { name: '', area: +ROWS.reduce((s, [ya, yb]) => s + bandArea(ya, yb), 0).toFixed(1), est: true, kind: 'hall', floor: 1 };
  for (const [ya, yb, zf] of ROWS) {
    P.poly(band(ya, yb), zf - 0.25, zf, M.tier);
    const patch = makePatch(polyGeom(band(ya, yb), zf + 0.012, 0.02), 'hall', rec); g2.add(patch); hover.push(patch);
  }
  let n = 0;
  for (const [ya, yb, zf] of ROWS.slice(1)) {
    const yc = (ya + yb) / 2, xl = hallXL(yc) + 0.65, xr = mx(hallXL(yc)) - 0.65;
    for (let x = xl; x + 0.5 <= xr; x += 0.56) {
      if (x + 0.5 > 22.55 && x < 23.85) continue;
      P.box(x, x + 0.5, yc - 0.22, yc + 0.22, zf + 0.22, zf + 0.45, M.seat);
      P.box(x, x + 0.5, yc - 0.34, yc - 0.22, zf + 0.22, zf + 0.98, M.seat); n++;
    }
    P.box(22.6, 23.8, ya, ya + 0.4, zf, zf + 0.15, M.tier);   // bậc phụ lối đi giữa (chênh 0,3 m mỗi hàng)
  }
  // lan can trước ban công (đặc, 1,05 m trên sàn hàng D) + tay vịn
  P.poly(band(5.71, 5.86), 3.45, 4.75, M.concrete);
  P.poly(band(5.68, 5.89), 4.75, 4.82, M.rail);
  // tường trước T2 (Y 2,18–2,38) dựng lại: 2 cửa đôi 1,4 m ở +4,6 với ô kính hắt sáng phía trên
  P.box(18.5, 27.9, 2.18, 2.38, 3.85, 4.6, M.wall);
  P.box(18.5, 18.8, 2.18, 2.38, 4.6, 7.45, M.wall); P.box(20.2, 26.19, 2.18, 2.38, 4.6, 7.45, M.wall); P.box(27.59, 27.9, 2.18, 2.38, 4.6, 7.45, M.wall);
  for (const [xa, xb] of [[18.8, 20.2], [26.19, 27.59]]) {
    P.box(xa, xb, 2.16, 2.4, 4.6, 6.8, M.door);
    P.box(xa, xb, 2.18, 2.38, 6.8, 6.9, M.wall); P.box(xa, xb, 2.26, 2.3, 6.9, 7.45, M.railGlass);
  }
  // bệ 3 bậc (+4,0 → +4,6) trước hai cửa trong sảnh ban công, lan can kính hai đầu
  P.box(18.3, 28.1, 1.28, 2.18, 4.0, 4.6, M.tier);
  P.box(18.3, 28.1, 0.98, 1.28, 4.0, 4.4, M.stair); P.box(18.3, 28.1, 0.68, 0.98, 4.0, 4.2, M.stair);
  for (const x of [18.3, 28.1]) { P.box(x - 0.02, x + 0.02, 0.68, 2.18, 4.0, 5.5, M.railGlass); P.box(x - 0.035, x + 0.035, 0.68, 2.18, 5.5, 5.57, M.rail); }
  rec.name = `BAN CÔNG HỘI TRƯỜNG ≈ ${n} CHỖ`;
  rec.note = 'Báo cáo V3: 360 m² (≈ 358 chỗ) – mô hình bố trí 3 hàng ghế theo tầm nhìn và thông thuỷ dưới ban công';
  return { x: HC, y: 4.1, z: 4.6 + 1.6, rec };
}
