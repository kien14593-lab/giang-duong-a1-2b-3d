// Hằng số hình học công trình (mét) và tiện ích dựng hình.
// Hệ toạ độ bản vẽ: X dọc nhà (0 → 46,4), Y ngang nhà (0 = mặt trước, 13 = mặt sau), Z cao độ.
// Chuyển sang three.js: (x, y, z) → (X, Z, -Y)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const L = 46.4, W = 13.0, GRADE = -1.0, ROOF = 32.8, XC = 23.2;
export const FFL = [0, 4.0, 7.6, 11.2, 14.8, 18.4, 22.0, 25.6, 29.2];
export const TOP = [4.0, 7.6, 11.2, 14.8, 18.4, 22.0, 25.6, 29.2, 32.8];
export const FLOOR_KEY = ['T1', 'T2', 'T3-5', 'T3-5', 'T3-5', 'T6-8', 'T6-8', 'T6-8', 'T9'];
export const FLOOR_NAME = ['Tầng 1', 'Tầng 2', 'Tầng 3', 'Tầng 4', 'Tầng 5', 'Tầng 6', 'Tầng 7', 'Tầng 8', 'Tầng 9'];
export const COL_X = [0.3, 8.2, 18.2, 28.2, 38.2, 46.1];
export const COL_Y = [0.2, 4.7, 9.0, 12.8];
export const GRID_X = [0, 8.2, 18.2, 28.2, 38.2, 46.4];
export const GRID_Y = [0, 4.7, 9.0, 13.0];
export const TOWER_TOP = 36.4, TUM_TOP = 35.0;

// Đa giác hội trường (T1) và lỗ thông tầng trên sàn T2 (ngược chiều kim đồng hồ)
export const HC = 23.195;
export const HALL = [[14.43, 6.5], [18.5, 2.38], [27.9, 2.38], [31.96, 6.5], [31.96, 12.79], [28.4, 12.79], [28.4, 10.48], [17.99, 10.48], [17.99, 12.79], [14.43, 12.79]];
export const VOID = [[10.34, 4.6], [16.31, 4.6], [18.5, 2.38], [27.9, 2.38], [30.09, 4.6], [36.05, 4.6], [36.05, 10.4], [10.34, 10.4]];
export const hallXL = y => (y >= 6.5 ? 14.43 : 14.43 + (6.5 - y) * (4.07 / 4.12));

export const KIND = {
  hall: { c: [157, 39, 0], n: 'Hội trường' },
  lecture: { c: [220, 55, 0], n: 'Giảng đường' },
  meet: { c: [56, 0, 221], n: 'Phòng hội thảo' },
  tech: { c: [55, 221, 1], n: 'Kỹ thuật · văn phòng · phụ trợ' },
  san: { c: [222, 0, 111], n: 'Vệ sinh · kho' },
  circ: { c: [0, 165, 221], n: 'Thang bộ · thang máy' },
  corr: { c: [150, 180, 205], n: 'Sảnh · hành lang' },
};
export const kindColor = k => {
  const c = KIND[k]?.c || [200, 200, 200];
  return new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255).lerp(new THREE.Color(1, 1, 1), 0.35);
};

// Mặt phẳng cắt dùng chung (X, Y, cao độ) – giữ lại phía có khoảng cách dương
export const planes = [
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), 100),
  new THREE.Plane(new THREE.Vector3(0, 0, 1), 100),
  new THREE.Plane(new THREE.Vector3(0, -1, 0), 100),
];

function std(color, o = {}) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0.0 }, o));
  m.clippingPlanes = planes;
  return m;
}
export const M = {
  white: std(0xf4f3ef), blue: std(0x4d8fd1, { roughness: 0.6 }), dark: std(0x2b3a4a, { roughness: 0.3, metalness: 0.4 }),
  slab: std(0xdcdad4), plinth: std(0x9d9c98), concrete: std(0xc7c5bf), col: std(0xeeece6), wall: std(0xf1eee7),
  glass: Object.assign(new THREE.MeshPhysicalMaterial({ color: 0x7fb4dc, transparent: true, opacity: 0.42, roughness: 0.05, metalness: 0.15, side: THREE.DoubleSide, depthWrite: false }), { clippingPlanes: planes }),
  mullion: std(0xe6e7e9, { roughness: 0.4, metalness: 0.5 }), louvre: std(0xfafafa, { roughness: 0.5 }), fin: std(0xe4e3df),
  door: std(0x7a5636), wood: std(0xc9a374), board: std(0xffffff, { roughness: 0.3 }), seat: std(0x9b2c1e), stage: std(0x6b4a2f),
  tier: std(0xbdb6ab), stair: std(0xcfcac0), rail: std(0x6a7480, { roughness: 0.4, metalness: 0.6 }),
  railGlass: Object.assign(new THREE.MeshPhysicalMaterial({ color: 0xa8d3ee, transparent: true, opacity: 0.35, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }), { clippingPlanes: planes }),
  shaft: std(0x8e99a6), steel: std(0xb9c0c8, { roughness: 0.3, metalness: 0.7 }),
  ground: std(0x8fb56b, { roughness: 1 }), pave: std(0xcfcbc2, { roughness: 1 }), water: std(0x5aa6d6, { roughness: 0.1, metalness: 0.2 }),
  trunk: std(0x6e4b2a), leaf: std(0x4f8f3c), leaf2: std(0x6aa84f), p1: std(0x3f6fb5), p2: std(0xd9534f), p3: std(0xf0c419),
};
// Vật liệu thuộc "vỏ bao che" – có thể tắt để nhìn vào trong
export const FACADE_MATS = new Set([M.white, M.blue, M.dark, M.glass, M.mullion, M.louvre, M.fin]);
const NO_SHADOW = new Set([M.glass, M.railGlass, M.water]);

// Gom hình học theo vật liệu rồi hợp nhất → ít draw call
export class Builder {
  constructor() { this.b = new Map(); }
  add(g, mat) {
    if (g.index) g = g.toNonIndexed();
    if (!this.b.has(mat)) this.b.set(mat, []);
    this.b.get(mat).push(g);
  }
  box(x0, x1, y0, y1, z0, z1, mat) {
    if (x1 - x0 < 1e-4 || y1 - y0 < 1e-4 || z1 - z0 < 1e-4) return;
    const g = new THREE.BoxGeometry(x1 - x0, z1 - z0, y1 - y0);
    g.translate((x0 + x1) / 2, (z0 + z1) / 2, -(y0 + y1) / 2);
    this.add(g, mat);
  }
  // hộp xoay trong mặt bằng: dài `len` theo hướng `ang` (rad, ngược chiều kim đồng hồ từ +X), rộng `wid`, cao `h`
  rbox(cx, cy, cz, len, wid, h, ang, mat) {
    const g = new THREE.BoxGeometry(len, h, wid);
    g.rotateY(ang); g.translate(cx, cz, -cy); this.add(g, mat);
  }
  // hộp nghiêng (tay vịn, dốc): dài `len` theo hướng `ang`, dốc lên góc `tilt`
  slope(cx, cy, cz, len, wid, thk, ang, tilt, mat) {
    const g = new THREE.BoxGeometry(len, thk, wid);
    g.rotateZ(tilt); g.rotateY(ang); g.translate(cx, cz, -cy); this.add(g, mat);
  }
  poly(pts, z0, z1, mat, holes = []) {
    const s = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
    for (const h of holes) s.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(p[0], p[1]))));
    const g = new THREE.ExtrudeGeometry(s, { depth: z1 - z0, bevelEnabled: false });
    g.rotateX(-Math.PI / 2); g.translate(0, z0, 0); this.add(g, mat);
  }
  // tường theo đoạn thẳng, dày `t` lệch về bên phải hướng đi (= phía ngoài với đa giác ngược chiều kim đồng hồ)
  wall(x0, y0, x1, y1, z0, z1, t, mat) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    if (len < 1e-4) return;
    const nx = dy / len, ny = -dx / len;
    this.rbox((x0 + x1) / 2 + nx * t / 2, (y0 + y1) / 2 + ny * t / 2, (z0 + z1) / 2, len, t, z1 - z0, Math.atan2(dy, dx), mat);
  }
  build(group) {
    for (const [mat, geoms] of this.b) {
      const merged = mergeGeometries(geoms, false);
      if (!merged) continue;
      const m = new THREE.Mesh(merged, mat);
      m.castShadow = !NO_SHADOW.has(mat); m.receiveShadow = true;
      if (FACADE_MATS.has(mat)) m.userData.facade = true;
      group.add(m);
    }
    this.b.clear();
  }
}

export function polyGeom(pts, z0, thick) {
  const s = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); g.translate(0, z0, 0); return g;
}

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
