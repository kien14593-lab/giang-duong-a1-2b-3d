# Mô hình 3D – Giảng đường A1-2B

Mô hình 3D tương tác của **Giảng đường A1-2B (9 tầng)** – Phân hiệu Trường Đại học Giao thông Vận tải tại TP. Hồ Chí Minh (UTC2), dựng lại từ hồ sơ **thiết kế sơ bộ** (bản vẽ kiến trúc `KT A1-2B GTVT.pdf`).

**Xem trực tiếp:** https://kien14593-lab.github.io/giang-duong-a1-2b-3d/

| Phiên bản | Địa chỉ | Ghi chú |
|---|---|---|
| **Bản gốc + Phương án đề xuất + Báo cáo V3** (chuyển đổi trong trang, mục *Phương án*) | https://kien14593-lab.github.io/giang-duong-a1-2b-3d/ | Bản hiện hành, có đủ công cụ (nắng, đo, lớp phủ, xuất) |
| **Bản lưu mô hình gốc** (đóng băng, trước khi cập nhật) | https://kien14593-lab.github.io/giang-duong-a1-2b-3d/goc/ | Mã nguồn tại thư mục `goc/`, tương ứng tag `v1-ban-ve-goc` |

## Nội dung mô hình

- Toàn bộ 9 tầng + tầng mái (tum kỹ thuật, tháp thang, khung pergola, bồn nước, cục nóng điều hòa) và sân trước (bậc cấp, ram dốc, cây xanh, người tỉ lệ).
- Từng tầng: sàn, dầm, cột theo lưới trục, các phòng theo bản vẽ mặt bằng (phòng học, hội trường, làm việc, họp, kỹ thuật, vệ sinh, giao thông), tường ngăn, cửa, đồ nội thất minh họa, 2 lõi thang bộ dạng chữ U, 2 thang máy.
- **Hội trường tầng 1–2** (thông tầng): sân khấu, màn chiếu, bục phát biểu, 6 bậc khán đài, ghế, lối đi giữa, lan can hành lang tầng 2 quanh khoảng thông tầng.
- Mặt đứng theo ngôn ngữ kiến trúc của bản vẽ: khối trắng bên trái với ô cửa vuông, thân giữa kính + lam ngang trắng, khối xanh bên phải với khe cửa đứng + **logo chính thức UTC2** (`img/logo-utc.png`, lấy từ utc2.edu.vn), tầng trệt kính lùi vào có mái đón.

## Cách sử dụng

| Thao tác | Kết quả |
|---|---|
| Kéo chuột trái / cuộn / chuột phải | Xoay / thu phóng / dời khung nhìn |
| Nút **Góc nhìn** | Phối cảnh, mặt đứng trước/sau/bên, mặt bằng, mặt cắt, trong hội trường, nhìn lên ban công hội trường, trong phòng học |
| **Tầng** – tick chọn / bấm tên tầng | Ẩn-hiện tầng / chỉ hiện một tầng |
| **Tách tầng** | Nâng các tầng rời nhau (dạng sơ đồ nổ) |
| **Cắt X / Y / Z** | Mặt cắt động theo 3 phương |
| Rê chuột / bấm vào phòng | Xem tên, diện tích, loại phòng |
| Nhãn / Mặt đứng / Màu phòng / Lưới trục / Tự xoay / Bóng đổ | Bật-tắt các lớp hiển thị |
| **Phương án**: *Bản gốc* / *Đề xuất* / *Báo cáo V3* | Dựng lại mô hình theo bản vẽ gốc, theo phương án đề xuất cải tiến hoặc theo công năng của Báo cáo tóm tắt đầu tư V3; *Tô sáng phần thay đổi* tô cam các khối mới/thay đổi; danh sách hạng mục hiện ngay dưới nút; nhãn/tooltip phòng kèm ghi chú *Báo cáo V3: …* |
| **Nắng & bóng đổ** | Vị trí Mặt Trời tại TP.HCM (10,78°B; 106,70°Đ; UTC+7) theo ngày/giờ – chọn ngày, các nút 21/3 · 21/6 · 23/9 · 22/12, kéo giờ, ▶ chạy cả ngày; hiển thị quỹ đạo, tia nắng, hoa gió; *Hướng mặt chính* = phương vị la bàn của mặt tiền |
| **Đo khoảng cách** | Bật rồi bấm 2 điểm trên mô hình (bắt dính đỉnh ≤ 0,35 m); hiện khoảng cách thẳng và ΔX/ΔY/ΔZ; danh sách các đoạn đo, xoá từng đoạn; Esc để thoát |
| **Lớp phủ bản vẽ** | Phủ ảnh mặt bằng cắt từ PDF gốc (đã canh theo lưới trục, `plans/*.png`) lên sàn từng tầng, chỉnh độ mờ; dùng cùng *Cắt Z* hoặc chỉ hiện một tầng để so sánh |
| **Xuất mô hình** | Tải **glTF (.glb)** hoặc **OBJ** phần đang hiển thị, tên file kèm phương án + ngày |

### Mở file xuất ra trong phần mềm khác

- Đơn vị **mét**, trục **Y hướng lên** (chuẩn glTF); các nhóm tên `Tang_1…Tang_9`, `Mai_Tum`, `KhuDat`; mesh đặt theo tên phòng / vật liệu, phần đề xuất có tiền tố `DeXuat_`, phần dựng thêm theo Báo cáo V3 có tiền tố `V3_`.
- **SketchUp** 2021+: *File → Import → glTF (.glb)*; **Revit** 2022+: nhập qua *Insert → Import CAD* không đọc glTF trực tiếp → dùng OBJ hoặc plugin glTF; **Blender / Rhino / Navisworks / 3ds Max** đọc .glb trực tiếp. Chọn trục Z-up khi nhập nếu phần mềm hỏi.
- Vật liệu được đơn giản hoá (màu + độ nhám), mặt cắt động không xuất; OBJ không kèm màu.

## Phương án đề xuất (7 hạng mục)

Chọn *Đề xuất* trong mục **Phương án**; mô hình gốc luôn xem lại được bằng nút *Bản gốc*, trang `goc/` hoặc tag git `v1-ban-ve-goc`.

| # | Hạng mục | Nội dung | Đánh đổi / cần kiểm tra |
|---|---|---|---|
| 1 | PCCC | 2 buồng thang bộ → thang không nhiễm khói N2/N3: buồng đệm 2 cửa chống cháy mỗi tầng + ống tăng áp, quạt trên tum (giữ 9 tầng, chiều cao PCCC > 28 m) | Mất ≈ 4,5 m² sàn/tầng cho buồng đệm |
| 2 | PCCC | Tháp thang máy mới sát mặt sau (trục 5): 1 thang máy chữa cháy có sảnh đệm T2–T9, ở T1 mở ra sân sau + 1 thang khách | Tăng diện tích xây dựng ≈ 11,5 m²/tầng; T1 mở ra sân đỗ xe chữa cháy |
| 3 | Kết cấu | Dầm chuyển 0,7 × 1,15 m tại sàn T3, trục 3 và 4 (nhịp 12,6 m) đỡ 4 cột ngắt trên hội trường | Thông thuỷ hành lang T2 dưới dầm 2,45 m |
| 4 | Hội trường | Lối vào/thoát nạn thứ hai từ sảnh T2: 2 cửa đôi 1,4 m hai bên tường trước, chiếu tới + vế thang 10 bậc chạy dọc tường xuống hàng ghế trên cùng; 2 chỗ xe lăn hàng đầu | Giảm ≈ 11 chỗ hàng cuối |
| 5 | Vỏ bao che | Hệ che nắng dạng hộp (fin đứng 1,25 m + 2 tấm ngang, sâu 0,7 m) thay lam ngang, kính Low-E | Kiểm tra bằng công cụ *Nắng & bóng đổ* |
| 6 | Mái | Mái xanh 29,6 × 9,6 m + 162 tấm PV (≈ 50 kWp) nghiêng 10° trên pergola | Tải mái tăng; cần chống thấm/thoát nước |
| 7 | Sân | Dốc tiếp cận 1/12 (2 vế 6 m + chiếu nghỉ), mái sảnh chính 13,3 × 4,9 m, nhà để xe máy 30 × 5 m phía sau, sân + lối đỗ xe chữa cháy | Cần đối chiếu ranh đất/quy hoạch tổng mặt bằng |

## Phương án Báo cáo V3 (24/09/2026)

Dựng theo **Báo cáo tóm tắt đầu tư A1-2B – phiên bản V3** (`2026 09 24_Bao_cao_tom_tat_A1-2B_V3.docx`). Vỏ bao che, lưới trục, cao độ tầng và hội trường giữ như thiết kế sơ bộ; **toàn bộ công năng 9 tầng** được bố trí lại theo báo cáo (dữ liệu tại `data_v3.js`, hình khối bổ sung tại `v3.js`). Chọn *Báo cáo V3* trong mục **Phương án**; các phòng có ghi chú *Báo cáo V3: …* trong tooltip.

| Tầng | Công năng theo Báo cáo V3 (đã dựng) |
|---|---|
| 1 | Hội trường 204 chỗ (giữ khán đài 6 bậc), Student Support Hub 60 m² (khu ngồi chờ), phòng giảng viên, trực điều khiển PCCC · an ninh, phòng quản lý, giảng đường 56 chỗ |
| 2 | **Ban công hội trường** 4 hàng ≈ 53 chỗ trên khoảng thông tầng, sảnh ban công với 2 cửa đôi + bục 3 bậc (+4,0 → +4,6), phòng nghỉ giảng viên, phòng kỹ thuật, kho |
| 3 | PTN thiết kế IC 120 m², PTN ứng dụng IC · đo kiểm · PCB 120 m², phòng UPS · mạng · ESD 60 m² (tủ rack) |
| 4 | Mô phỏng đường sắt 1 & 2 (100 m² mỗi phòng, bàn thiết bị), BIM-GIS · đồ hoạ 60 m², máy chủ · lưu trữ 30 m² |
| 5 | Mô phỏng đường sắt 3 (100 m²), kho chuẩn bị · bảo quản thiết bị khảo sát số 30 m², Project / Capstone / Design studio 140 m² (bàn nhóm) |
| 6 | Phòng linh hoạt F2 170 chỗ, 215 m² – **vách ngăn di động** chia 70 + 100 (cửa riêng mỗi nửa) |
| 7 | Phòng linh hoạt F1 100 chỗ, 150 m² (vách di động chia 50 + 50), phòng chuẩn 100 chỗ 110 m², phòng giảng viên 34 m² |
| 8 | Phòng chuẩn 50 chỗ 75 m², Seminar / Workshop / Triển lãm 80 m² (bàn chữ U), phòng chuẩn 70 chỗ 105 m² |
| 9 | Phòng học 50 chỗ 75 m², **Learning Commons** 180 m² (bàn nhóm, kệ sách, góc thảo luận), phụ trợ dùng chung 28 m² |
| 3–9 | Phòng giảng viên 24 m² sau lõi thang trái, hành lang sau, 2 lõi thang + 2 thang máy + khu WC giữ như TKSB |

Các giả định do báo cáo chưa quyết hoặc chưa khớp nhau (ghi lại để đối chiếu khi cập nhật hồ sơ):

- **Mặt đứng**: báo cáo nêu 3 phương án vỏ bao che chưa chọn → mô hình giữ mặt đứng theo thiết kế sơ bộ.
- **Ban công hội trường**: báo cáo ghi ≈ 360 m² / 358 chỗ, không thể xếp trong khoảng thông tầng 14,4 × 13 m; mô hình dựng ban công thực tế 4 hàng, ≈ 42 m², ≈ 53 chỗ, console ≈ 3,3 m, thông thuỷ trên các bậc khán đài T1 ≥ 2,19 m – **cần kiểm tra kết cấu**.
- **Diện tích phòng**: vùng phòng chính mỗi tầng ≈ 264 m² sử dụng; khi tổng diện tích báo cáo vượt mức này (ví dụ T3: 120 + 120 + 60 = 300 m²) các phòng được **chia theo tỉ lệ**; diện tích hình học ghi trên nhãn, số liệu báo cáo ghi ở ghi chú.
- **Tầng 7**: bảng 2.2 (phòng chuẩn 110 m² / 100 chỗ) và hình 3 (70 + 50 chỗ) khác nhau → dựng theo bảng 2.2, có ghi chú.
- **Tầng 9**: phòng 50 chỗ có trong bảng 2.2 nhưng không có trên hình 3 → vẫn dựng theo bảng, có ghi chú.
- **Tầng 2**: hai phòng góc trước thu ngắn để mở lối từ hành lang bên vào sảnh ban công.
- Một số lỗi chính tả tên phòng trong báo cáo (ví dụ "PHÒNG GY THOÁT") đã được sửa khi đặt tên trong mô hình.

## Công nghệ

- [Three.js](https://threejs.org/) 0.160 tải qua CDN (import map), ES modules, **không cần build**.
- Hình học được sinh tham số hóa từ dữ liệu phòng (`data.js`, `data_v3.js`) trích từ bản vẽ PDF / báo cáo; toàn bộ mã nguồn nằm trong các file `*.js` ở thư mục gốc.

| File | Vai trò |
|---|---|
| `index.html` | Giao diện, CSS, import map |
| `common.js` | Hằng số kích thước, vật liệu, mặt phẳng cắt, lớp `Builder`, cờ phương án `V.proposal` / `V.v3` |
| `storey.js` | Dựng một tầng điển hình (sàn, cột, phòng, tường, cửa, vách di động, nội thất theo loại phòng, thang, mặt đứng, logo) |
| `hall.js` | Hội trường |
| `roofsite.js` | Mái, tum, cảnh quan, lưới trục |
| `proposal.js` | Hình khối của phương án đề xuất + danh sách thay đổi |
| `v3.js` | Ban công hội trường, cửa/bục sảnh T2 + danh sách thay đổi theo Báo cáo V3 |
| `sun.js` · `measure.js` · `overlay.js` · `export.js` | Mô phỏng nắng · đo khoảng cách · lớp phủ bản vẽ · xuất glTF/OBJ |
| `main.js` | Scene, camera, giao diện điều khiển, chuyển phương án, chú giải theo phương án |
| `data.js` · `data_v3.js` | Dữ liệu phòng theo tầng (`window.ROOMS` theo TKSB · `window.ROOMS_V3` theo Báo cáo V3) |
| `plans/` · `img/` | Ảnh mặt bằng cắt từ PDF (đã canh toạ độ) · logo |
| `goc/` | Bản lưu mô hình gốc (đóng băng) |

Chạy cục bộ: mở thư mục bằng một máy chủ tĩnh bất kỳ (ví dụ `python -m http.server`) rồi truy cập `index.html` – không mở trực tiếp bằng `file://` vì trình duyệt chặn ES modules.

## Lưu ý

- Đây là mô hình **diễn giải** từ hồ sơ thiết kế sơ bộ ở tỉ lệ nhỏ: kích thước tổng thể, lưới trục, cao độ tầng và bố cục phòng bám theo bản vẽ; các chi tiết như nội thất, số ghế hội trường, tỉ lệ các dải mặt đứng, vật liệu/màu sắc là ước lượng minh họa, **không dùng thay hồ sơ thiết kế** để thi công hay bóc tách khối lượng.
- Hồ sơ không có mũi tên chỉ hướng Bắc / tổng mặt bằng, nên **hướng mặt chính mặc định 180° (quay về Nam) là giả định** – hãy chỉnh thanh *Hướng mặt chính* theo vị trí thực trước khi đọc kết quả bóng nắng.
- Phương án đề xuất là gợi ý ở mức ý tưởng, chưa qua tính toán kết cấu / thẩm duyệt PCCC.
- Phương án Báo cáo V3 chỉ bố trí lại công năng theo báo cáo tóm tắt đầu tư; nội thất (bàn thiết bị, tủ rack, bàn nhóm…) là minh hoạ loại phòng, không phải bố trí thiết bị thật.

## Giấy phép

Mã nguồn: MIT. Bản vẽ gốc thuộc bản quyền của chủ đầu tư / đơn vị tư vấn thiết kế; logo UTC2 thuộc Phân hiệu Trường Đại học GTVT tại TP.HCM, chỉ dùng để minh hoạ công trình của trường.