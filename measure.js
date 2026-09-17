// Thước đo khoảng cách: bấm 2 điểm trên mô hình (bắt vào đỉnh gần nhất), hiện chiều dài + các thành phần ΔX/ΔY/Δcao.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { planes } from './common.js';

export function initMeasure({ scene, camera, dom, roots, $ }) {
  const S = { on: false, a: null, items: [] };
  const grp = new THREE.Group(); scene.add(grp);
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const matLine = new THREE.LineBasicMaterial({ color: 0xe11d48, depthTest: false, transparent: true });
  const matPt = new THREE.MeshBasicMaterial({ color: 0xe11d48, depthTest: false, transparent: true });
  const matSnap = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, depthTest: false, transparent: true });
  const fmt = v => v.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const visibleChain = o => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };
  const sphere = new THREE.SphereGeometry(0.13, 12, 8);

  function pick(ev) {
    ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const h of ray.intersectObjects(roots(), true)) {
      if (!h.object.isMesh || !visibleChain(h.object) || h.object.userData.measure) continue;
      if (!planes.every(p => p.constant >= 1000 || p.distanceToPoint(h.point) >= -0.01)) continue;
      const pos = h.object.geometry.getAttribute('position'); let best = null, bd = 0.35;
      if (h.face && pos) for (const idx of [h.face.a, h.face.b, h.face.c]) {
        const v = new THREE.Vector3().fromBufferAttribute(pos, idx).applyMatrix4(h.object.matrixWorld), d = v.distanceTo(h.point);
        if (d < bd) { bd = d; best = v; }
      }
      return { p: best || h.point.clone(), snapped: !!best };
    }
    return null;
  }
  const mkLabel = (cls) => { const el = document.createElement('div'); el.className = 'lbl meas ' + cls; const o = new CSS2DObject(el); o.userData.measure = true; return o; };
  const text = (a, b) => {
    const d = a.distanceTo(b), dx = Math.abs(b.x - a.x), dy = Math.abs(b.z - a.z), dz = Math.abs(b.y - a.y);
    return `<b>${fmt(d)} m</b><span>ΔX ${fmt(dx)} · ΔY ${fmt(dy)} · Δcao ${fmt(dz)}</span>`;
  };
  function mkLine(a, b) {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), matLine); l.userData.measure = true; l.renderOrder = 10; return l;
  }
  function mkPoint(p, snapped) { const m = new THREE.Mesh(sphere, snapped ? matSnap : matPt); m.position.copy(p); m.userData.measure = true; m.renderOrder = 10; return m; }

  // đối tượng tạm (điểm 1 + dây kéo)
  let tmp = null;
  const hint = t => { $('#measHint').textContent = t; };
  function clearTmp() { if (tmp) { grp.remove(tmp.g); tmp = null; } hint('Chế độ đo: bấm điểm thứ nhất (ESC để thoát)'); }
  function setTmp(a, snapped) {
    clearTmp(); const g = new THREE.Group(); g.add(mkPoint(a, snapped)); const line = mkLine(a, a), lab = mkLabel('tmp'); lab.element.innerHTML = 'Bấm điểm thứ hai…'; g.add(line, lab); grp.add(g);
    tmp = { g, line, lab }; hint('Bấm điểm thứ hai (ESC để huỷ điểm 1)');
  }
  function commit(a, b, sa, sb) {
    const g = new THREE.Group(); g.add(mkPoint(a, sa), mkPoint(b, sb), mkLine(a, b));
    const lab = mkLabel(''); lab.element.innerHTML = text(a, b); lab.position.lerpVectors(a, b, 0.5); g.add(lab); grp.add(g);
    S.items.push({ g, a, b, d: a.distanceTo(b) }); renderList();
  }
  function renderList() {
    const el = $('#measList'); el.innerHTML = S.items.length ? '' : '<small>Chưa có phép đo.</small>';
    S.items.forEach((it, i) => {
      const row = document.createElement('div'); row.className = 'mrow';
      row.innerHTML = `<span>${i + 1}.</span><b>${fmt(it.d)} m</b><small>ΔX ${fmt(Math.abs(it.b.x - it.a.x))} · ΔY ${fmt(Math.abs(it.b.z - it.a.z))} · Δcao ${fmt(Math.abs(it.b.y - it.a.y))}</small><button title="Xoá" data-i="${i}">×</button>`;
      el.appendChild(row);
    });
  }
  $('#measList').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const it = S.items.splice(+b.dataset.i, 1)[0]; grp.remove(it.g); renderList(); });
  $('#measClear').onclick = () => { S.items.forEach(it => grp.remove(it.g)); S.items = []; clearTmp(); S.a = null; renderList(); };

  function setOn(on) {
    S.on = on; $('#measureOn').classList.toggle('on', on); dom.style.cursor = on ? 'crosshair' : '';
    $('#measHint').style.display = on ? 'block' : 'none';
    if (!on) { clearTmp(); S.a = null; }
  }
  $('#measureOn').onclick = () => setOn(!S.on);
  addEventListener('keydown', e => { if (e.key === 'Escape' && S.on) { if (S.a) { clearTmp(); S.a = null; } else setOn(false); } });

  let down = null;
  dom.addEventListener('pointerdown', ev => { down = [ev.clientX, ev.clientY]; });
  dom.addEventListener('pointerup', ev => {
    if (!S.on || ev.button !== 0 || !down || Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 5) return;
    const h = pick(ev); if (!h) return;
    if (!S.a) { S.a = h; setTmp(h.p, h.snapped); }
    else { commit(S.a.p, h.p, S.a.snapped, h.snapped); clearTmp(); S.a = null; }
  });
  dom.addEventListener('pointermove', ev => {
    if (!S.on || !S.a || !tmp || ev.buttons) return;
    const h = pick(ev); if (!h) return;
    tmp.line.geometry.setFromPoints([S.a.p, h.p]); tmp.lab.element.innerHTML = text(S.a.p, h.p); tmp.lab.position.lerpVectors(S.a.p, h.p, 0.5);
  });
  renderList();
  return { S, setOn, group: grp };
}
