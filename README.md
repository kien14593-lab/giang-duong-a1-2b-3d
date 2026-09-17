# Mô hình 3D – Giảng đường A1-2B

Mô hình 3D tương tác của **Giảng đường A1-2B (9 tầng)** – Phân hiệu Trường Đại học Giao thông Vận tải tại TP. Hồ Chí Minh, dựng lại từ hồ sơ **thiết kế sơ bộ** (bản vẽ kiến trúc `KT A1-2B GTVT.pdf`).

**Xem trực tiếp:** https://kien14593-lab.github.io/giang-duong-a1-2b-3d/

## Nội dung mô hình

- Toàn bộ 9 tầng + tầng mái (tum kỹ thuật, tháp thang, khung pergola, bồn nước, cục nóng điều hòa) và sân trước (bậc cấp, ram dốc, cây xanh, người tỉ lệ).
- Từng tầng: sàn, dầm, cột theo lưới trục, các phòng theo bản vẽ mặt bằng (phòng học, hội trường, làm việc, họp, kỹ thuật, vệ sinh, giao thông), tường ngăn, cửa, đồ nội thất minh họa, 2 lõi thang bộ dạng chữ U, 2 thang máy.
- **Hội trường tầng 1–2** (thông tầng): sân khấu, màn chiếu, bục phát biểu, 6 bậc khán đài, ghế, lối đi giữa, lan can hành lang tầng 2 quanh khoảng thông tầng.
- Mặt đứng theo ngôn ngữ kiến trúc của bản vẽ: khối trắng bên trái với ô cửa vuông, thân giữa kính + lam ngang trắng, khối xanh bên phải với khe cửa đứng + logo, tầng trệt kính lùi vào có mái đón.

## Cách sử dụng

| Thao tác | Kết quả |
|---|---|
| Kéo chuột trái / cuộn / chuột phải | Xoay / thu phóng / dời khung nhìn |
| Nút **Góc nhìn** | Phối cảnh, mặt đứng trước/sau/bên, mặt bằng, mặt cắt, trong hội trường, trong phòng học |
| **Tầng** – tick chọn / bấm tên tầng | Ẩn-hiện tầng / chỉ hiện một tầng |
| **Tách tầng** | Nâng các tầng rời nhau (dạng sơ đồ nổ) |
| **Cắt X / Y / Z** | Mặt cắt động theo 3 phương |
| Rê chuột / bấm vào phòng | Xem tên, diện tích, loại phòng |
| Nhãn / Mặt đứng / Màu phòng / Lưới trục / Tự xoay / Bóng đổ | Bật-tắt các lớp hiển thị |

## Công nghệ

- [Three.js](https://threejs.org/) 0.160 tải qua CDN (import map), ES modules, **không cần build**.
- Hình học được sinh tham số hóa từ dữ liệu phòng (`data.js`) trích từ bản vẽ PDF; toàn bộ mã nguồn nằm trong các file `*.js` ở thư mục gốc.

| File | Vai trò |
|---|---|
| `index.html` | Giao diện, CSS, import map |
| `common.js` | Hằng số kích thước, vật liệu, mặt phẳng cắt, lớp `Builder` |
| `storey.js` | Dựng một tầng điển hình (sàn, cột, phòng, tường, cửa, thang, mặt đứng) |
| `hall.js` | Hội trường |
| `roofsite.js` | Mái, tum, cảnh quan, lưới trục |
| `main.js` | Scene, camera, giao diện điều khiển |
| `data.js` | Dữ liệu phòng theo tầng (`window.ROOMS`) |

Chạy cục bộ: mở thư mục bằng một máy chủ tĩnh bất kỳ (ví dụ `python -m http.server`) rồi truy cập `index.html` – không mở trực tiếp bằng `file://` vì trình duyệt chặn ES modules.

## Lưu ý

Đây là mô hình **diễn giải** từ hồ sơ thiết kế sơ bộ ở tỉ lệ nhỏ: kích thước tổng thể, lưới trục, cao độ tầng và bố cục phòng bám theo bản vẽ; các chi tiết như nội thất, số ghế hội trường, tỉ lệ các dải mặt đứng, vật liệu/màu sắc là ước lượng minh họa, **không dùng thay hồ sơ thiết kế** để thi công hay bóc tách khối lượng.

## Giấy phép

Mã nguồn: MIT. Bản vẽ gốc thuộc bản quyền của chủ đầu tư / đơn vị tư vấn thiết kế.
