// Lớp phủ bản vẽ mặt bằng (PDF gốc, đã canh toạ độ) lên từng sàn. Ảnh plans/*.png phủ vùng X −1…47,4 m, Y −1…14 m.
import * as THREE from 'three';
import { FFL, FLOOR_KEY, planes } from './common.js';

const FILES = { 'T1': 't1', 'T2': 't2', 'T3-5': 't3-5', 'T6-8': 't6-8', 'T9': 't9' };
const X0 = -1, X1 = 47.4, Y0 = -1, Y1 = 14;

export function initOverlay({ $ }) {
  const S = { on: false, opacity: 0.85, only: false };
  const loader = new THREE.TextureLoader(), tex = {}, mats = {}, planesList = [];
  const material = key => {
    if (!mats[key]) {
      tex[key] = loader.load(`plans/${FILES[key]}.png`); tex[key].colorSpace = THREE.SRGBColorSpace; tex[key].anisotropy = 8;
      mats[key] = new THREE.MeshBasicMaterial({ map: tex[key], transparent: true, opacity: S.opacity, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, clippingPlanes: planes });
    }
    return mats[key];
  };
  const geo = new THREE.PlaneGeometry(X1 - X0, Y1 - Y0);

  function attach(floors) {
    planesList.length = 0;
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(geo, material(FLOOR_KEY[i]));
      m.rotation.x = Math.PI / 2;                       // mép trên ảnh (Y = −1, mặt trước) quay về +z
      m.position.set((X0 + X1) / 2, FFL[i] + 0.03, -(Y0 + Y1) / 2);
      m.visible = S.on; m.userData.overlay = true; m.renderOrder = 5;
      floors[i].group.add(m); planesList.push(m);
    }
  }
  function apply() {
    planesList.forEach(m => { m.visible = S.on; });
    Object.values(mats).forEach(mt => { mt.opacity = S.opacity; });
    $('#ovlInfo').textContent = S.on ? 'Bản vẽ T1, T2, T3–5, T6–8, T9 đặt đúng toạ độ trục (tỉ lệ 15,14 pt/m).' : '';
  }
  $('#ovlOn').onchange = e => { S.on = e.target.checked; apply(); };
  const op = $('#ovlOpacity'); op.value = S.opacity;
  op.oninput = () => { S.opacity = +op.value; op.parentElement.querySelector('.v').textContent = Math.round(S.opacity * 100) + ' %'; apply(); };
  op.oninput();
  return { S, attach, apply, setOn(on) { S.on = on; $('#ovlOn').checked = on; apply(); } };
}
