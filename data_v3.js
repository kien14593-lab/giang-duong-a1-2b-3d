// Công năng theo "Báo cáo tóm tắt đầu tư A1-2B" phiên bản V3 (24/09/2026), bảng 2.2 + hình minh hoạ 1–3.
// Khối nhà, lưới cột, lõi thang/WC giữ theo hồ sơ TKSB (data.js); chỉ thay tên/chia phòng.
// Diện tích ghi trong mô hình là diện tích hình học của phòng; số liệu báo cáo ghi ở `note`.
// Vùng phòng chính X 8,19–38,2 (30,0 m) × Y 0,19–8,99 (8,8 m) ≈ 264 m²/tầng: khi báo cáo yêu cầu vượt mức này, chia theo tỷ lệ.
(() => {
  const R = (x0, x1, y0, y1, k, name, o = {}) => Object.assign({ x0, x1, y0, y1, k, name, area: +((x1 - x0) * (y1 - y0)).toFixed(1) }, o);
  const X0 = 8.19, X1 = 38.2, GAP = 0.19, Y0 = 0.19, Y1 = 8.99;
  // chia vùng phòng chính theo tỷ lệ diện tích báo cáo: [tên, loại, m² báo cáo, tuỳ chọn]
  const split = parts => {
    const usable = X1 - X0 - GAP * (parts.length - 1), sum = parts.reduce((s, p) => s + p[2], 0);
    let x = X0;
    return parts.map(([name, k, w, o = {}]) => {
      const r = R(x, +(x + usable * w / sum).toFixed(2), Y0, Y1, k, name, Object.assign({ note: `Báo cáo V3: ${w} m²` }, o));
      x = r.x1 + GAP; return r;
    });
  };
  const lifts = [
    R(0.24, 2.45, 4.74, 6.94, 'circ', 'THANG MÁY', { area: 4.9, special: 'lift', est: true }),
    R(0.24, 2.45, 7.14, 9.34, 'circ', 'THANG MÁY', { area: 4.9, special: 'lift', est: true }),
  ];
  const stairsUp = [
    R(0.24, 7.95, 0.24, 4.44, 'circ', 'THANG BỘ', { area: 32.4, special: 'stair', est: true }),
    R(38.44, 46.15, 0.24, 4.44, 'circ', 'THANG BỘ', { area: 32.4, special: 'stair', est: true }),
  ];
  const wcUp = [
    R(41.09, 41.9, 9.98, 12.79, 'tech', 'PCCC', { area: 2.3, est: true }),
    R(42.0, 46.2, 9.98, 12.79, 'san', 'VS NAM', { area: 11.8, est: true }),
    R(42.59, 46.2, 6.69, 9.89, 'san', 'VS NỮ KHO', { area: 11.6, est: true }),
    R(42.68, 46.2, 4.68, 6.59, 'san', 'VS KT', { area: 6.7, est: true }),
  ];
  const lobbies = [
    R(2.45, 8.0, 4.7, 9.4, 'corr', 'SẢNH THANG', { area: 25.68, nowalls: true }),
    R(38.39, 42.5, 4.68, 9.9, 'corr', 'SẢNH', { area: 21.5, nowalls: true, est: true }),
  ];
  // tầng 3–9: phòng GV sau lõi thang trái (báo cáo 24 m²), hành lang sau
  const core = gvNote => [
    R(0.2, 8.0, 9.59, 12.79, 'tech', 'PHÒNG GIẢNG VIÊN', { fx: 'lounge', note: gvNote || 'Báo cáo V3: 24 m²' }),
    ...stairsUp, ...lifts, ...wcUp, ...lobbies,
    R(8.19, 38.2, 9.0, 12.79, 'corr', 'HÀNH LANG', { area: 113.7, nowalls: true, est: true }),
  ];

  window.ROOMS_V3 = {
    T1: [
      R(0.2, 4.5, 9.59, 12.79, 'tech', 'PHÒNG GIẢNG VIÊN', { fx: 'lounge', door: ['y0', 0.75], note: 'Báo cáo V3 (hình 1): 16 m²' }),
      R(4.65, 8.0, 9.59, 12.79, 'tech', 'TRỰC ĐIỀU KHIỂN PCCC · AN NINH', { fx: 'desk', note: 'Báo cáo V3 (hình 1): 32 m²' }),
      R(0.24, 7.95, 2.44, 4.44, 'circ', 'THANG BỘ', { area: 15.4, special: 'stair', est: true }),
      R(0.24, 5.05, 0.24, 2.24, 'circ', 'PHÒNG TỦ ĐIỆN', { area: 9.6, wallh: 1.85 }),
      ...lifts,
      R(8.19, 16.3, 0.19, 4.59, 'learn', 'STUDENT SUPPORT HUB', { fx: 'lounge', note: 'Báo cáo V3: 60 m² (vị trí văn phòng cũ)' }),
      R(14.43, 31.96, 2.38, 12.79, 'hall', 'HỘI TRƯỜNG 204 CHỖ', { area: 133.68, special: 'hall', note: 'Báo cáo V3: phần T1 330 m², toàn hội trường ≈ 200 chỗ; thêm ban công T2' }),
      R(17.99, 23.15, 10.48, 12.79, 'tech', 'PHÒNG GIẢNG VIÊN', { area: 11.84 }),
      R(23.25, 28.4, 10.48, 12.79, 'tech', 'PHÒNG QUẢN LÝ', { area: 11.84, note: 'Hồ sơ TKSB: phòng chuẩn bị' }),
      R(29.1, 32.2, 0.19, 3.55, 'san', 'VS NAM', { area: 10.4, est: true }),
      R(32.29, 35.7, 0.19, 2.6, 'san', 'VS NỮ', { area: 8.2, est: true }),
      R(33.78, 35.7, 2.68, 4.59, 'san', 'VS KT', { area: 3.7, est: true }),
      R(35.79, 38.2, 0.19, 2.24, 'tech', 'P.PHỤC VỤ', { area: 4.92 }),
      R(38.29, 46.15, 2.44, 4.44, 'circ', 'THANG BỘ', { area: 15.7, special: 'stair', est: true }),
      R(38.39, 46.2, 4.68, 12.79, 'lecture', 'GIẢNG ĐƯỜNG 56 CHỖ', { area: 63.18, note: 'Báo cáo V3 (hình 1): 81 m²; hồ sơ TKSB: 50 chỗ' }),
      R(39.15, 46.15, 0.24, 2.24, 'circ', 'PHÒNG MÁY BƠM', { area: 14.0, wallh: 1.85 }),
      R(2.45, 8.0, 4.7, 9.4, 'corr', 'SẢNH THANG MÁY', { area: 26.1, nowalls: true, est: true }),
      R(8.19, 14.43, 4.59, 12.79, 'corr', 'SẢNH TẦNG 1', { area: 51.2, nowalls: true, est: true }),
      R(31.96, 38.39, 4.59, 12.79, 'corr', 'SẢNH TẦNG 1', { area: 52.7, nowalls: true, est: true }),
      R(16.2, 29.1, 0.19, 2.38, 'corr', 'SẢNH VÀO', { area: 28.3, nowalls: true, est: true }),
    ],
    T2: [
      R(0.2, 5.3, 9.59, 12.79, 'tech', 'PHÒNG NGHỈ GIẢNG VIÊN', { area: 14.0, fx: 'lounge', note: 'Báo cáo V3 (hình 1): 18 m²' }),
      ...stairsUp, ...lifts,
      // hai phòng góc trước thu ngắn (Y ≤ 2,9) để mở lối từ hành lang bên vào sảnh ban công
      R(8.19, 12.4, 0.19, 2.9, 'san', 'PHÒNG KỸ THUẬT', { note: 'Báo cáo V3 (hình 1) ghi "PHÒNG GY THOÁT" 18 m²; thu ngắn để mở lối vào sảnh ban công' }),
      R(33.99, 38.2, 0.19, 2.9, 'san', 'KHO', { note: 'Báo cáo V3 (hình 1): 12 m²' }),
      ...wcUp, ...lobbies,
      R(8.19, 38.2, 10.4, 12.79, 'corr', 'HÀNH LANG', { area: 71.7, nowalls: true, est: true }),
      R(8.19, 10.34, 4.49, 10.4, 'corr', 'HÀNH LANG', { area: 12.7, nowalls: true, est: true }),
      R(36.05, 38.2, 4.49, 10.4, 'corr', 'HÀNH LANG', { area: 12.7, nowalls: true, est: true }),
      R(12.4, 33.99, 0.19, 2.18, 'corr', 'SẢNH BAN CÔNG', { nowalls: true, est: true, note: 'Lối vào ban công hội trường qua bệ 3 bậc (+4,0 → +4,6)' }),
      R(8.19, 16.2, 3.05, 4.49, 'corr', 'LỐI VÀO SẢNH BAN CÔNG', { nowalls: true, est: true }),
      R(30.19, 38.2, 3.05, 4.49, 'corr', 'LỐI VÀO SẢNH BAN CÔNG', { nowalls: true, est: true }),
    ],
    T3: [...core(), ...split([
      ['PTN THIẾT KẾ IC', 'lab', 120],
      ['PTN ỨNG DỤNG IC · ĐO KIỂM · PCB', 'lab', 120],
      ['UPS · MẠNG · ESD', 'tech', 60, { fx: 'rack' }],
    ])],
    T4: [...core(), ...split([
      ['MÔ PHỎNG ĐƯỜNG SẮT 1', 'lab', 100, { fx: 'sim' }],
      ['MÔ PHỎNG ĐƯỜNG SẮT 2', 'lab', 100, { fx: 'sim' }],
      ['BIM-GIS · ĐỒ HOẠ', 'lab', 60],
      ['MÁY CHỦ · LƯU TRỮ', 'tech', 30, { fx: 'rack' }],
    ])],
    T5: [...core(), ...split([
      ['MÔ PHỎNG ĐƯỜNG SẮT 3', 'lab', 100, { fx: 'sim' }],
      ['CHUẨN BỊ · BẢO QUẢN THIẾT BỊ KHẢO SÁT SỐ', 'tech', 30, { fx: 'shelf' }],
      ['PROJECT / CAPSTONE / DESIGN STUDIO', 'learn', 140, { fx: 'studio' }],
    ])],
    T6: [...core(), ...split([
      ['PHÒNG LINH HOẠT F2 · 170 CHỖ (VÁCH DI ĐỘNG CHIA 70 + 100)', 'lecture', 215, { part: 20.55, note: 'Báo cáo V3: 215 m², 170 chỗ hoặc chia 70 + 100' }],
    ])],
    T7: [...core('Báo cáo V3 (hình 3): 34 m²'), ...split([
      ['PHÒNG LINH HOẠT F1 · 100 CHỖ (VÁCH DI ĐỘNG CHIA 50 + 50)', 'lecture', 150, { part: 16.79, note: 'Báo cáo V3: 150 m², 100 chỗ hoặc chia 50 + 50' }],
      ['PHÒNG CHUẨN 100 CHỖ', 'lecture', 110, { note: 'Báo cáo V3 (bảng 2.2): 110 m²; hình 3 lại vẽ 2 phòng 70 chỗ (105 m²) + 50 chỗ (75 m²)' }],
    ])],
    T8: [...core(), ...split([
      ['PHÒNG CHUẨN 50 CHỖ', 'lecture', 75],
      ['SEMINAR / WORKSHOP / TRIỂN LÃM', 'meet', 80],
      ['PHÒNG CHUẨN 70 CHỖ', 'lecture', 105],
    ])],
    T9: [...core(), ...split([
      ['PHÒNG HỌC 50 CHỖ', 'lecture', 75, { note: 'Báo cáo V3 (bảng 2.2): 75 m²; hình 3 không vẽ phòng này' }],
      ['LEARNING COMMONS', 'learn', 180],
      ['PHỤ TRỢ DÙNG CHUNG', 'tech', 28, { fx: 'shelf' }],
    ])],
  };
})();
