// Bối cảnh cho chế độ "Phối cảnh đẹp": đường phố, vỉa hè, cây tán lá, xe, người, đèn đường, ghế đá, nhà lân cận.
// Chỉ để trình bày – vị trí mang tính minh hoạ, không thuộc mô hình xuất glTF/OBJ và không bị mặt cắt ảnh hưởng.
import * as THREE from 'three';
import { Builder, canvasTexture, worldTex, GRADE, V } from './common.js';

export const DG = GRADE - 0.035;               // mặt cỏ (đĩa nền của chế độ phối cảnh)
const RD = GRADE + 0.02, SW = GRADE + 0.1;     // mặt đường nhựa (cao hơn mặt cỏ 5,5 cm), mặt vỉa hè (bó vỉa cao 8 cm)
const X0 = -3000, X1 = 3000;                   // đường kéo dài, khuất dần trong sương

let seed = 1;
const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const rr = (a, b) => a + rnd() * (b - a);
const pick = a => a[Math.floor(rnd() * a.length)];

// ---- texture vẽ bằng canvas (lặp liền mạch)
function noiseTex(size, base, amp, draw) {
  const t = canvasTexture(size, size, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    if (draw) draw(c, w, h);
    const img = c.getImageData(0, 0, w, h), d = img.data;
    for (let p = 0; p < d.length; p += 4) { const k = (rnd() - 0.5) * amp; d[p] += k; d[p + 1] += k; d[p + 2] += k; }
    c.putImageData(img, 0, 0);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function blots(c, w, h, n, rgb, a0, a1, r0, r1) {
  for (let k = 0; k < n; k++) {
    const x = rnd() * w, y = rnd() * h, r = rr(r0, r1), a = rr(a0, a1);
    for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
      const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = g; c.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
    }
  }
}
export function grassTexture() {
  seed = 7;
  return noiseTex(512, '#6a8d45', 30, (c, w, h) => { blots(c, w, h, 60, '128,158,74', 0.2, 0.4, 18, 90); blots(c, w, h, 50, '78,108,46', 0.2, 0.4, 18, 90); });
}
const asphaltTex = () => noiseTex(512, '#5d5f62', 24, (c, w, h) => { blots(c, w, h, 40, '30,30,32', 0.08, 0.2, 20, 80); blots(c, w, h, 20, '120,120,118', 0.05, 0.12, 20, 60); });
const walkTex = () => noiseTex(512, '#c6bfb4', 12, (c, w, h) => {
  const n = 4, t = w / n;
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) { const v = rr(-9, 9); c.fillStyle = `rgba(${v > 0 ? '255,250,240' : '90,80,70'},${Math.abs(v) / 60})`; c.fillRect(a * t, b * t, t, t); }
  c.fillStyle = 'rgba(95,88,80,0.6)'; for (let a = 0; a < n; a++) { c.fillRect(a * t, 0, 3, h); c.fillRect(0, a * t, w, 3); }
});
const hedgeTex = () => noiseTex(256, '#3b6a2e', 30, (c, w, h) => {
  for (let k = 0; k < 900; k++) { c.fillStyle = pick(['#2c5424', '#3f7432', '#4f8a3b', '#61a047']); c.beginPath(); c.ellipse(rnd() * w, rnd() * h, rr(3, 6), rr(1.5, 3), rnd() * 3.14, 0, 6.283); c.fill(); }
});
// ô cửa sổ nhà lân cận: 1 ô = 3,6 × 3,6 m (một tầng, ba ô kính)
function windowTex() {
  const t = canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#e6e1d7'; c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 82, 0, 192); g.addColorStop(0, '#869fb2'); g.addColorStop(1, '#4b6275');
    c.fillStyle = g; c.fillRect(0, 82, w, 110);
    c.fillStyle = '#d9d6cf'; for (let k = 0; k < 3; k++) c.fillRect(k * w / 3, 82, 5, 110);
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, 192, w, 6);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
// tán lá: 4 kiểu trong 1 atlas (xanh đậm · xanh vừa · xanh vàng · xanh lam đậm), nền trong suốt.
// Mỗi tán gồm nhiều cụm lá tròn: lõi đặc tô chuyển sắc (sáng phía trên-trái) + lá rời ở mép → khối tán rõ, ít nhiễu hạt
function leafAtlas() {
  const PAL = [
    ['#1a3316', '#26481e', '#335c27', '#437132', '#58873f'],
    ['#22431a', '#315b24', '#42742f', '#568e3b', '#6fa449'],
    ['#324c17', '#476622', '#5f812d', '#7a9b3c', '#95b350'],
    ['#193724', '#244c30', '#30633d', '#407a4c', '#57935f'],
  ];
  return canvasTexture(1024, 1024, (c, w) => {
    const S = w / 2, cl = (i) => Math.max(0, Math.min(4, Math.round(i)));
    for (let q = 0; q < 4; q++) {
      const ox = (q % 2) * S, oy = (q >> 1) * S, pal = PAL[q], cx = ox + S / 2, cy = oy + S / 2, clumps = [];
      c.save(); c.beginPath(); c.rect(ox, oy, S, S); c.clip();
      c.fillStyle = 'rgba(62,98,46,0.05)'; c.fillRect(ox, oy, S, S);   // giữ màu xanh ở vùng trong suốt → không viền đen khi mipmap
      for (let k = 0; k < 17; k++) {
        const a = rnd() * 6.283, d = Math.sqrt(rnd()) * 0.27 * S;
        clumps.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.82, rr(0.1, 0.165) * S]);
      }
      clumps.sort((p, r) => p[1] - r[1]);   // cụm thấp vẽ sau, che cụm cao
      for (const [x, y, r] of clumps) {
        const up = 1.6 - ((y - cy) / S) * 3.2;   // cụm phía trên tán sáng hơn
        const g = c.createRadialGradient(x - 0.35 * r, y - 0.4 * r, 0.05 * r, x, y, 0.85 * r);
        g.addColorStop(0, pal[cl(up + 1.4)]); g.addColorStop(0.55, pal[cl(up + 0.3)]); g.addColorStop(1, pal[cl(up - 0.9)]);
        c.fillStyle = g; c.beginPath(); c.arc(x, y, 0.8 * r, 0, 6.283); c.fill();
        for (let k = 0; k < 150; k++) {
          const a = rnd() * 6.283, d = r * (0.4 + 0.62 * Math.sqrt(rnd())), dx = Math.cos(a), dy = Math.sin(a);
          const lit = -(dx * 0.6 + dy * 0.8) * (d / r);   // hướng sáng: trên-trái
          c.fillStyle = pal[cl(up + lit * 1.6 + rr(-0.7, 0.7))];
          c.beginPath(); c.ellipse(x + dx * d, y + dy * d * 0.9, rr(5.5, 10.5), rr(2.8, 5), rnd() * Math.PI, 0, 6.283); c.fill();
        }
      }
      c.restore();
    }
  });
}

// ---- vật liệu (tạo một lần, dùng lại khi dựng lại bối cảnh)
let MAT = null;
const NFB = THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', '');   // pháp tuyến tán lá hướng tâm, không lật mặt sau
function mats() {
  if (MAT) return MAT;
  seed = 11;
  const std = (color, o = {}, ud = {}) => Object.assign(new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85 }, o)), { userData: Object.assign({ shared: true }, ud) });
  const atlas = leafAtlas();
  const leaf = std(0xffffff, { map: atlas, alphaTest: 0.45, alphaToCoverage: true, side: THREE.DoubleSide, roughness: 0.8, emissive: 0x0c1807 });
  leaf.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', NFB); };
  leaf.customProgramCacheKey = () => 'leafRadial';
  MAT = {
    asph: worldTex(std(0xffffff, { map: asphaltTex(), roughness: 0.95 }), 7),
    walk: worldTex(std(0xffffff, { map: walkTex(), roughness: 0.9 }), 1.6),
    kerb: std(0xc3bfb6, { roughness: 0.8 }),
    mark: std(0xf1f1ec, { roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    hedge: std(0xffffff, { map: hedgeTex() }, { uvScale: 1.2 }),
    bark: std(0x5a4636, { roughness: 1 }), leaf,
    leafDepth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: atlas, alphaTest: 0.45 }),
    paint: std(0xffffff, { vertexColors: true, metalness: 0.45, roughness: 0.3 }),
    ppl: std(0xffffff, { vertexColors: true, roughness: 0.8 }),
    carGlass: std(0x1a232c, { roughness: 0.08, metalness: 0.7 }),
    pole: std(0x7d848b, { metalness: 0.6, roughness: 0.4 }), lampHead: std(0x3c4146, { metalness: 0.5, roughness: 0.4 }),
    bench: std(0xb9b4aa, { roughness: 0.8 }),
    nWall: std(0xffffff, { map: windowTex(), roughness: 0.7 }, { uvScale: 3.6 }), nRoof: std(0xa9a59d),
  };
  MAT.flat = new Set([MAT.asph, MAT.walk, MAT.kerb, MAT.mark]);
  return MAT;
}

// ---- hình học
const _c = new THREE.Color(), _v = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3();
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4(), ONE = new THREE.Vector3(1, 1, 1);
const UP = new THREE.Vector3(0, 1, 0), ZA = new THREE.Vector3(0, 0, 1);
const HQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
function paint(g, hex) {
  _c.set(hex);
  const n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
// hộp trong hệ toạ độ cục bộ của vật (x tiến, y trái, z lên; đáy tại z)
const lbox = (sx, sy, sz, x, y, z) => { const g = new THREE.BoxGeometry(sx, sz, sy); g.translate(x, z + sz / 2, -y); return g; };
const place = (x, y, z, a) => new THREE.Matrix4().makeRotationY(a).setPosition(x, z, -y);

// thẻ lá: mặt phẳng texture cụm lá, pháp tuyến hướng ra từ tâm tán → tán cây sáng/tối như khối tròn
function card(B, w, h, seg, q, pos, quat, c, rx, ry) {
  const g = new THREE.PlaneGeometry(w, h, seg, seg), uv = g.attributes.uv, u0 = (q % 2) * 0.5, v0 = 0.5 - (q >> 1) * 0.5;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + 0.005 + uv.getX(i) * 0.49, v0 + 0.005 + uv.getY(i) * 0.49);
  g.applyMatrix4(_m.compose(pos, quat, ONE));
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    _v.set((p.getX(i) - c.x) / rx, (p.getY(i) - c.y) / ry, (p.getZ(i) - c.z) / rx);
    const l = _v.length();
    if (l < 0.25) _v.lerp(UP, 1 - l / 0.25);
    _v.normalize().addScaledVector(UP, 0.3).normalize();
    n.setXYZ(i, _v.x, _v.y, _v.z);
  }
  B.add(g, MAT.leaf);
}
// cây: thân + cành + tán (3 thẻ đứng, 1–2 thẻ ngang cho góc nhìn từ trên, vài cụm nhỏ); lod 1 = cây xa, ít thẻ hơn
function tree(B, x, y, base, h, r, q, lod = 2) {
  const rv = r * 0.78, cy = base + h - rv, c = new THREE.Vector3(x, cy, -y), tr = Math.max(0.1, r * 0.065), th = cy - rv * 0.3 - base;
  const tg = new THREE.CylinderGeometry(tr * 0.65, tr, th + 0.3, 7); tg.translate(x, base - 0.3 + (th + 0.3) / 2, -y); B.add(tg, MAT.bark);
  if (lod > 1) for (let k = 0; k < 3; k++) {
    const len = r * 0.75, bg = new THREE.CylinderGeometry(tr * 0.25, tr * 0.45, len, 5);
    bg.translate(0, len / 2, 0); bg.rotateZ(-0.85); bg.rotateY(rnd() * 6.283); bg.translate(x, base + th * 0.85, -y); B.add(bg, MAT.bark);
  }
  const a0 = rnd() * Math.PI, seg = lod > 1 ? 4 : 2;
  for (let k = 0; k < 3; k++) card(B, 2 * r, 2 * rv, seg, q, c, _q.setFromAxisAngle(UP, a0 + k * Math.PI / 3), c, r, rv);
  card(B, 1.8 * r, 1.8 * r, 1, q, _p.set(x, cy + rv * 0.1, -y), _q.setFromAxisAngle(UP, rnd() * 6.283).multiply(HQ), c, r, rv);
  if (lod > 1) card(B, 1.25 * r, 1.25 * r, 1, q, _p.set(x, cy + rv * 0.5, -y), _q.setFromAxisAngle(UP, rnd() * 6.283).multiply(HQ), c, r, rv);
  for (let k = 0; k < (lod > 1 ? 5 : 2); k++) {
    const a = rnd() * 6.283, ph = rr(0.35, 1.9);
    _d.set(Math.cos(a) * Math.sin(ph), Math.cos(ph), Math.sin(a) * Math.sin(ph));
    _p.set(c.x + _d.x * r * 0.55, c.y + _d.y * rv * 0.55, c.z + _d.z * r * 0.55);
    card(B, r, r, 1, q, _p, _q.setFromUnitVectors(ZA, _d).multiply(_q2.setFromAxisAngle(ZA, rnd() * 6.283)), c, r, rv);
  }
}
// đèn đường cao 8,5 m, cần vươn ra lòng đường theo hướng ±Y
function lamp(B, x, y, dir) {
  const H = 8.5, b = SW, g = new THREE.CylinderGeometry(0.06, 0.1, H, 8); g.translate(x, b + H / 2, -y); B.add(g, MAT.pole);
  B.box(x - 0.04, x + 0.04, Math.min(y, y + dir * 1.7), Math.max(y, y + dir * 1.7), b + H - 0.12, b + H - 0.04, MAT.pole);
  const yh = y + dir * 1.7; B.box(x - 0.14, x + 0.14, yh - 0.35, yh + 0.35, b + H - 0.2, b + H - 0.06, MAT.lampHead);
}
function bench(B, x, y) {
  B.box(x - 0.8, x + 0.8, y - 0.22, y + 0.22, GRADE + 0.38, GRADE + 0.46, MAT.bench);
  for (const s of [-0.6, 0.6]) B.box(x + s - 0.09, x + s + 0.09, y - 0.18, y + 0.18, GRADE, GRADE + 0.38, MAT.bench);
}
const SHIRT = ['#f4f4f1', '#f4f4f1', '#f4f4f1', '#eef2f7', '#2f5fa7', '#b8352c', '#3a3a3c', '#d9b14a', '#5f8a4a', '#d98ea3'];
const PANTS = ['#1f2a44', '#26272b', '#3b4a5e', '#57504a', '#1f2a44', '#2d3b55'];
const SKIN = ['#d6a57f', '#c8936c', '#e0b48f'];
function person(B, x, y, base, a, h = rr(1.58, 1.78)) {
  const m4 = place(x, y, base, a), sh = pick(SHIRT), pa = pick(PANTS), sk = pick(SKIN), s = rr(-0.08, 0.08);
  const add = (g, col) => { paint(g, col); g.applyMatrix4(m4); B.add(g, MAT.ppl); };
  add(lbox(0.14, 0.13, 0.47 * h, s, 0.075, 0), pa); add(lbox(0.14, 0.13, 0.47 * h, -s, -0.075, 0), pa);
  add(lbox(0.21, 0.36, 0.33 * h, 0, 0, 0.47 * h), sh);
  add(lbox(0.09, 0.08, 0.31 * h, -s, 0.22, 0.48 * h), sh); add(lbox(0.09, 0.08, 0.31 * h, s, -0.22, 0.48 * h), sh);
  add(lbox(0.08, 0.08, 0.07 * h, 0, 0, 0.8 * h), sk);
  const hd = new THREE.SphereGeometry(0.105, 10, 8); hd.translate(0, h - 0.11, 0); add(hd, sk);
  const hr = new THREE.SphereGeometry(0.112, 10, 5, 0, 6.283, 0, 1.4); hr.translate(0, h - 0.1, 0); add(hr, '#17120f');
  if (rnd() < 0.45) add(lbox(0.14, 0.28, 0.34, -0.18, 0, 0.5 * h), pick(['#1c2a4a', '#2a2a2e', '#7a1f1f', '#3d5a3a']));
}
const PAINT = ['#f2f2f0', '#f2f2f0', '#c7cacf', '#9ea3aa', '#1d2024', '#1d2024', '#8e1f24', '#27488a', '#5a5f66'];
function wheel(r, w, x, y) { const g = new THREE.CylinderGeometry(r, r, w, 12); g.rotateX(Math.PI / 2); g.translate(x, r, -y); return g; }
// vuốt thon nửa trên của hộp theo chiều dọc xe (kính lái/kính hậu nghiêng)
function taper(g, k) {
  const p = g.attributes.position; g.computeBoundingBox();
  const b = g.boundingBox, cx = (b.min.x + b.max.x) / 2, my = (b.min.y + b.max.y) / 2;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > my) p.setX(i, cx + (p.getX(i) - cx) * k);
  g.computeVertexNormals(); return g;
}
function car(B, x, y, a, suv = rnd() < 0.35) {
  const m4 = place(x, y, RD, a), col = pick(PAINT), add = (g, mat, c) => { if (c) paint(g, c); g.applyMatrix4(m4); B.add(g, mat); };
  const Lc = suv ? 4.7 : 4.55, Wc = suv ? 1.88 : 1.78, z1 = suv ? 1.1 : 0.95, ch = suv ? 0.62 : 0.5, off = suv ? -0.25 : -0.2;
  const cl = Lc * (suv ? 0.62 : 0.54), k = suv ? 0.82 : 0.7;
  add(lbox(Lc, Wc, z1 - 0.3, 0, 0, 0.3), MAT.paint, col);
  add(taper(lbox(cl, Wc - 0.14, ch, off, 0, z1), k), MAT.carGlass);
  add(lbox(cl * k - 0.04, Wc - 0.18, 0.06, off, 0, z1 + ch - 0.02), MAT.paint, col);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(wheel(0.33, 0.24, sx * Lc * 0.32, sy * (Wc / 2 - 0.1)), MAT.ppl, '#161616');
}
function moto(B, x, y, a) {
  const m4 = place(x, y, RD, a), add = (g, mat, c) => { paint(g, c); g.applyMatrix4(m4); B.add(g, mat); };
  const sh = pick(SHIRT), pa = pick(PANTS);
  for (const sx of [-0.62, 0.62]) add(wheel(0.28, 0.1, sx, 0), MAT.ppl, '#161616');
  add(lbox(1.25, 0.3, 0.34, 0, 0, 0.36), MAT.paint, pick(['#b3202a', '#1d2024', '#f2f2f0', '#27488a', '#8d9096']));
  add(lbox(0.7, 0.28, 0.1, -0.2, 0, 0.7), MAT.ppl, '#222222');
  add(lbox(0.07, 0.62, 0.06, 0.52, 0, 1.0), MAT.ppl, '#2a2a2a');
  add(lbox(0.07, 0.07, 0.72, 0.58, 0, 0.3), MAT.ppl, '#555555');
  add(lbox(0.28, 0.38, 0.55, -0.12, 0, 0.8), MAT.ppl, sh);
  add(lbox(0.5, 0.32, 0.15, 0.08, 0, 0.62), MAT.ppl, pa);
  for (const s of [-1, 1]) add(lbox(0.45, 0.08, 0.08, 0.2, s * 0.2, 1.18), MAT.ppl, sh);
  const hg = new THREE.SphereGeometry(0.15, 10, 8); hg.translate(-0.1, 1.53, 0); add(hg, MAT.ppl, pick(['#f2c230', '#e8e8e8', '#c0392b', '#2f5fa7', '#1d1d1d']));
}
// nhà lân cận: khối tường có ô cửa (UV thế giới 3,6 m/tầng) + tấm mái che mặt trên
function neighbour(B, x0, x1, y0, y1, n) {
  const top = GRADE + n * 3.6 + 0.6;
  B.box(x0, x1, y0, y1, GRADE - 0.2, top, MAT.nWall);
  B.box(x0 - 0.3, x1 + 0.3, y0 - 0.3, y1 + 0.3, top - 0.02, top + 0.5, MAT.nRoof);
}

// ---- dựng bối cảnh (X dọc nhà, Y: âm = phía trước). Đường trước nhà Y −31…−23, đường sau nhà Y 31…38, đường nội bộ X 62…68
const FOOT = [[-78, -40, -4, 14, 5], [92, 128, -6, 10, 4], [-40, 5, 50, 64, 6], [30, 80, 52, 66, 5], [100, 140, 42, 62, 3]];
export function buildDressing() {
  mats(); seed = 20260924;
  const g = new THREE.Group(); g.name = 'BoiCanh';
  const B = new Builder(), M = MAT;
  // đường, vỉa hè, bó vỉa, lối vào sân
  const road = (y0, y1) => B.box(X0, X1, y0, y1, RD - 0.25, RD, M.asph);
  const walk = (x0, x1, y0, y1) => B.box(x0, x1, y0, y1, GRADE - 0.25, SW, M.walk);
  const kerb = (x0, x1, y0, y1) => B.box(x0, x1, y0, y1, GRADE - 0.25, SW + 0.004, M.kerb);
  road(-31, -23); road(31, 38);
  B.box(62, 68, -23, 31, RD - 0.25, RD, M.asph);
  for (const [a, b] of [[X0, 62], [68, X1]]) { walk(a, b, -22.75, -20); kerb(a, b, -23, -22.75); walk(a, b, 29, 30.75); kerb(a, b, 30.75, 31); }
  walk(X0, X1, -34, -31.25); kerb(X0, X1, -31.25, -31); walk(X0, X1, 38.25, 40); kerb(X0, X1, 38, 38.25);
  B.box(18.8, 27.6, -20, -14, GRADE - 0.25, GRADE + 0.004, M.walk);
  // vạch sơn: tim đường nét đứt, mép đường, vạch người đi bộ trước lối vào
  const mk = (x0, x1, y0, y1) => B.box(x0, x1, y0, y1, RD, RD + 0.008, M.mark);
  for (const [yc, e0, e1, front] of [[-27, -23.45, -30.55, true], [34.5, 31.45, 37.55, false]]) {
    for (let x = -400; x < 450; x += 7) if (!front || x + 3.5 < 20.4 || x > 26) mk(x, x + 3.5, yc - 0.075, yc + 0.075);
    mk(X0, X1, e0 - 0.12, e0); mk(X0, X1, e1, e1 + 0.12);
  }
  for (let k = 0; k < 8; k++) { const y = -23.7 - k * 0.85; mk(21.2, 25.2, y - 0.45, y); }
  // bồn cây viền sân, ghế đá, đèn đường
  for (const [a, b] of [[-8, 18.3], [28.1, 54.4]]) B.box(a, b, -14.85, -14.2, GRADE, GRADE + 0.8, M.hedge);
  for (const x of [3.5, 10.5, 35.9, 42.9]) bench(B, x, -13.2);
  for (let x = -479.5; x < 520; x += 27) {
    if (x < 60 || x > 70) { lamp(B, x, -22.45, -1); lamp(B, x, 30.45, 1); }
    lamp(B, x + 9, -31.55, 1); lamp(B, x + 9, 38.55, -1);
  }
  // cây: 15 vị trí cây trong khu đất (như mô hình kỹ thuật), cây đường phố, cây hai bên, vành cây xa
  let site = [[-5, -7], [-5, 9], [52, -7], [52, 9], [7, -10], [39, -10], [14, -12], [32, -12], [-13, 1], [59, 4], [3, 19], [43, 19], [23, 20], [-10, 16], [56, 16]];
  if (V.proposal) site = site.filter(([x, y]) => !(y > 14 && x > 0 && x < 50));
  site.forEach(([x, y], k) => tree(B, x, y, GRADE, rr(7.5, 9.5), rr(2.6, 3.3), [1, 3, 2, 1][k % 4]));
  const street = (y, skip) => {
    for (let x = -484; x < 520; x += 9) if (!skip.some(([a, b]) => x > a && x < b)) tree(B, x + rr(-0.5, 0.5), y, SW, rr(10, 12.5), rr(3.1, 3.8), 0, Math.abs(x - 23) < 200 ? 2 : 1);
  };
  street(-21.6, [[15, 31], [58, 72]]); street(-32.9, [[10, 36], [58, 100]]); street(29.9, [[58, 72]]); street(39.1, []);
  const clear = (x, y) => !FOOT.some(([a, b, c, d]) => x > a - 4 && x < b + 4 && y > c - 4 && y < d + 4);
  for (let k = 0; k < 16; k++) { const x = k % 2 ? rr(74, 104) : rr(-58, -18), y = rr(-17, 26); if (clear(x, y)) tree(B, x, y, DG, rr(8, 12), rr(2.8, 3.8), pick([0, 1, 2])); }
  for (let k = 0; k < 440; k++) {
    const a = rnd() * 6.283, d = k < 190 ? rr(78, 290) : rr(290, 620), x = 23 + Math.cos(a) * d, y = 3 + Math.sin(a) * d;
    if (Math.abs(y + 27) < 8.5 || Math.abs(y - 34.5) < 7.5 || (y < -34 && x > -14 && x < 60) || !clear(x, y)) continue;
    tree(B, x, y, DG, rr(9, 16), k < 190 ? rr(3.2, 5.2) : rr(4.5, 7), pick([0, 0, 1, 2]), 1);
  }
  FOOT.forEach(([a, b, c, d, n]) => neighbour(B, a, b, c, d, n));
  // người: sân trước, lối vào, vỉa hè
  const free = (x, y) => site.every(([a, b]) => (x - a) ** 2 + (y - b) ** 2 > 1.4);
  for (let n = 0; n < 18;) { const x = rr(2, 44), y = rr(-13, -4); if ((x > 16.5 && x < 30 && y > -6.5) || !free(x, y)) continue; person(B, x, y, GRADE, rnd() * 6.283); n++; }
  for (let k = 0; k < 4; k++) person(B, rr(19.5, 27), rr(-19.5, -14.6), GRADE, pick([1, -1]) * Math.PI / 2 + rr(-0.3, 0.3));
  const onWalk = (n, x0, x1, y0, y1) => { for (let k = 0; k < n;) { const x = rr(x0, x1); if (x > 61 && x < 69) continue; person(B, x, rr(y0, y1), SW, pick([0, Math.PI]) + rr(-0.2, 0.2)); k++; } };
  onWalk(9, -30, 85, -21, -20.35); onWalk(4, -20, 60, -33.75, -33.45); onWalk(3, 0, 50, 29.1, 29.35);   // làn đi bộ tránh gốc cây, cột đèn
  // xe hơi, xe máy
  const cars = (y, a, xs) => xs.forEach(x => car(B, x, y, a));
  cars(-25, 0, [-150, -96, -52, -14, 38, 75, 131, 190]); cars(-29, Math.PI, [-120, -70, -30, 8, 52, 101, 160]);
  cars(33, 0, [-90, -20, 45, 110]); cars(36.3, Math.PI, [-60, 15, 88]);
  for (const y of [-12, -4, 4]) car(B, 66.95, y, Math.PI / 2);
  [[-34, -24.2], [-6, -24.4], [4, -24.1], [31, -24.3], [34, -24.9], [49, -24.2], [70, -24.4]].forEach(([x, y]) => moto(B, x, y, 0));
  [[-22, -29.8], [-2, -29.6], [14, -29.9], [40, -29.7], [44, -30.0], [61, -29.8], [86, -29.7]].forEach(([x, y]) => moto(B, x, y, Math.PI));
  B.build(g);
  g.traverse(o => {
    if (!o.isMesh) return;
    o.name = 'BoiCanh_' + (Object.keys(M).find(k => M[k] === o.material) || 'mat');
    if (M.flat.has(o.material)) o.castShadow = false;
    if (o.material === M.leaf) { o.customDepthMaterial = M.leafDepth; o.userData.noAO = true; }
  });
  return g;
}
