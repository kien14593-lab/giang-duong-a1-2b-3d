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
// Cờ phương án (đọc khi dựng hình): proposal = phương án đề xuất cải tiến; v3 = công năng theo Báo cáo tóm tắt V3 (24/09/2026).
// Cả hai false = bản vẽ gốc. Không bao giờ bật cùng lúc.
// facade (chỉ dùng khi v3): 'tksb' = vỏ theo hồ sơ TKSB; 'pa1' | 'pa2' | 'pa3' = mặt đứng theo ảnh phối cảnh của Báo cáo V3
export const V = { proposal: false, v3: false, facade: 'tksb' };

// Đa giác hội trường (T1) và lỗ thông tầng trên sàn T2 (ngược chiều kim đồng hồ)
export const HC = 23.195;
export const HALL = [[14.43, 6.5], [18.5, 2.38], [27.9, 2.38], [31.96, 6.5], [31.96, 12.79], [28.4, 12.79], [28.4, 10.48], [17.99, 10.48], [17.99, 12.79], [14.43, 12.79]];
export const VOID = [[10.34, 4.6], [16.31, 4.6], [18.5, 2.38], [27.9, 2.38], [30.09, 4.6], [36.05, 4.6], [36.05, 10.4], [10.34, 10.4]];
export const hallXL = y => (y >= 6.5 ? 14.43 : 14.43 + (6.5 - y) * (4.07 / 4.12));

export const KIND = {
  hall: { c: [157, 39, 0], n: 'Hội trường' },
  lecture: { c: [220, 55, 0], n: 'Giảng đường · phòng học' },
  meet: { c: [56, 0, 221], n: 'Phòng hội thảo · seminar' },
  lab: { c: [140, 70, 180], n: 'Phòng thí nghiệm · mô phỏng' },
  learn: { c: [30, 150, 110], n: 'Học tập chung · dự án · hỗ trợ SV' },
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
function glassMat(color, opacity, o = {}) {
  const m = new THREE.MeshPhysicalMaterial(Object.assign({ color, transparent: true, opacity, roughness: 0.05, metalness: 0.15, side: THREE.DoubleSide, depthWrite: false }, o));
  m.clippingPlanes = planes;
  return m;
}
// Đá ốp (mặt đứng PA1–PA3): tấm 1,2 × 0,6 m xếp thẳng mạch, 1 ô texture = 2,4 × 2,4 m, tô màu bằng color của vật liệu
function stoneTexture() {
  let seed = 20260924;
  const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const t = canvasTexture(512, 512, (c, w, h) => {
    const pw = w / 2, ph = h / 4;
    for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) {
      const v = 238 + Math.round((rnd() - 0.5) * 12);
      c.fillStyle = `rgb(${v},${v},${v - 2})`; c.fillRect(k * pw, r * ph, pw, ph);
    }
    const img = c.getImageData(0, 0, w, h), d = img.data;
    for (let p = 0; p < d.length; p += 4) { const n = (rnd() - 0.5) * 14; d[p] += n; d[p + 1] += n; d[p + 2] += n; }
    c.putImageData(img, 0, 0);
    c.fillStyle = 'rgba(120,115,105,0.55)';
    for (let r = 0; r < 4; r++) c.fillRect(0, r * ph, w, 2);
    for (let k = 0; k < 2; k++) c.fillRect(k * pw, 0, 2, h);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}
const STONE_TEX = stoneTexture();
const stoneMat = color => Object.assign(std(color, { map: STONE_TEX, roughness: 0.72 }), { userData: { uvScale: 2.4 } });
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
  // vật liệu cho phương án đề xuất
  prop: std(0xff8a2a, { emissive: 0x6b2e00, emissiveIntensity: 0.35, roughness: 0.6 }),
  green: std(0x5e9a3c, { roughness: 1 }), pv: std(0x17263f, { roughness: 0.25, metalness: 0.6 }), fire: std(0xc8332b, { roughness: 0.5 }),
  // vật liệu mặt đứng PA1–PA3 (Báo cáo V3)
  stone: stoneMat(0xf6ead6), stone2: stoneMat(0xf7f6f2),
  gold: std(0xc9a263, { roughness: 0.4, metalness: 0.35 }), gold2: std(0xd2bd92, { roughness: 0.4, metalness: 0.3 }),
  bronze: std(0x5a4a38, { roughness: 0.5, metalness: 0.4 }), cwFrame: std(0xd9d4ca, { roughness: 0.4, metalness: 0.5 }),
  cwGlass: glassMat(0x9ec1d9, 0.45), cwGlass2: glassMat(0x6fa3d6, 0.55), cwGlass3: glassMat(0x3f7fc4, 0.6),
  spandrel: std(0x9db8d2, { roughness: 0.3, metalness: 0.1 }), planter: std(0x8d8a83), shrub: std(0x4e8a3a, { roughness: 0.9 }),
};
for (const [k, m] of Object.entries(M)) { m.name = k; m.userData.shared = true; }   // dùng chung giữa các lần dựng → không dispose
// Vật liệu thuộc "vỏ bao che" – có thể tắt để nhìn vào trong
export const FACADE_MATS = new Set([M.white, M.blue, M.dark, M.glass, M.mullion, M.louvre, M.fin,
  M.stone, M.stone2, M.gold, M.gold2, M.bronze, M.cwFrame, M.cwGlass, M.cwGlass2, M.cwGlass3, M.spandrel, M.planter, M.shrub]);
const NO_SHADOW = new Set([M.glass, M.railGlass, M.water, M.cwGlass, M.cwGlass2, M.cwGlass3]);
const MAT_NAME = new Map(Object.entries(M).map(([k, v]) => [v, k]));

// UV phẳng theo toạ độ thế giới (chiếu theo pháp tuyến trội) để texture đá liền mạch, đúng tỉ lệ trên mọi khối
function worldUV(g, s) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  if (!uv || !n) return;
  for (let k = 0; k < p.count; k++) {
    const ax = Math.abs(n.getX(k)), ay = Math.abs(n.getY(k)), az = Math.abs(n.getZ(k)), x = p.getX(k), y = p.getY(k), z = p.getZ(k);
    if (ay >= ax && ay >= az) uv.setXY(k, x / s, -z / s);
    else if (ax >= az) uv.setXY(k, -z / s, y / s);
    else uv.setXY(k, x / s, y / s);
  }
  uv.needsUpdate = true;
}

// Gom hình học theo vật liệu rồi hợp nhất → ít draw call. `prop = true`: đánh dấu là phần thay đổi so với bản gốc (có thể tô sáng)
export class Builder {
  constructor(prop = false) { this.b = new Map(); this.prop = prop; }
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
      if (mat.userData.uvScale) worldUV(merged, mat.userData.uvScale);
      const m = new THREE.Mesh(merged, mat);
      m.name = (this.prop ? (V.v3 ? 'V3_' : 'DeXuat_') : '') + (MAT_NAME.get(mat) || 'mat');
      m.castShadow = !NO_SHADOW.has(mat); m.receiveShadow = true;
      if (FACADE_MATS.has(mat)) m.userData.facade = true;
      if (this.prop) { m.userData.prop = true; m.userData.mat0 = mat; }
      group.add(m);
    }
    this.b.clear();
  }
}

export const rect = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

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

// UV của map lấy theo toạ độ thế giới trên mặt bằng (x, z) / scale → texture nền (cỏ, lát, nhựa) lặp đều, liền mạch giữa các khối
export function worldTex(mat, scale) {
  if (mat.map) { mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping; mat.map.anisotropy = 8; }
  const s = (1 / scale).toFixed(5);
  mat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
#ifdef USE_MAP
	vMapUv = ( modelMatrix * vec4( position, 1.0 ) ).xz * ${s};
#endif`);
  };
  mat.customProgramCacheKey = () => 'worldTex' + s;
  mat.needsUpdate = true;
  return mat;
}
