// Xuất mô hình đang hiển thị ra glTF (.glb, nhị phân) hoặc OBJ để mở trong SketchUp / Revit / Blender / 3D Viewer.
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import * as THREE from 'three';

export function initExport({ roots, variantName, $, prepare }) {
  const status = t => { $('#expInfo').textContent = t; };
  // prepare(): tạm bỏ các thay đổi của chế độ phối cảnh (vật liệu, đèn trang trí, nền/cây thay thế), trả về hàm khôi phục
  const guard = fn => { const restore = prepare ? prepare() : null; try { return fn(); } finally { if (restore) restore(); } };
  const download = (blob, name) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  };
  const fname = ext => `GiangDuong-A1-2B_${variantName()}_${new Date().toISOString().slice(0, 10)}.${ext}`;
  const mb = n => (n / 1048576).toFixed(1) + ' MB';

  $('#expGlb').onclick = () => {
    status('Đang đóng gói glTF…');
    const ex = new GLTFExporter();
    guard(() => ex.parse(roots(), res => {
      const blob = new Blob([res], { type: 'model/gltf-binary' }); download(blob, fname('glb'));
      status(`Đã xuất ${fname('glb')} (${mb(blob.size)}). Mở trực tiếp bằng D5 Render, Twinmotion, Blender (dùng script bên dưới để dựng cảnh render), SketchUp 2025+ (File › Import) hoặc Windows 3D Viewer; SketchUp bản cũ cần extension glTF Import, Revit cần plugin glTF.`);
    }, err => { console.error(err); status('Lỗi xuất glTF: ' + err.message); }, { binary: true, onlyVisible: true, maxTextureSize: 2048 }));
  };
  $('#expObj').onclick = () => {
    status('Đang xuất OBJ…');
    const g = new THREE.Group(); guard(() => roots().forEach(r => g.add(r.clone())));
    const drop = [];   // OBJExporter không chấp nhận hình học rỗng → bỏ hẳn phần đang ẩn / không có đỉnh
    g.traverse(o => { if (o !== g && (!o.visible || o.userData.renderOnly || (o.isMesh && !o.geometry.getAttribute('position')))) drop.push(o); });
    drop.forEach(o => o.parent && o.parent.remove(o));
    g.updateMatrixWorld(true);
    const txt = new OBJExporter().parse(g), blob = new Blob([txt], { type: 'text/plain' });
    download(blob, fname('obj'));
    status(`Đã xuất ${fname('obj')} (${mb(blob.size)}). OBJ không kèm vật liệu/màu; đơn vị mét, trục Y hướng lên (chọn Y-up khi import).`);
  };
}
