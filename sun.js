// Mô phỏng bóng nắng theo ngày/giờ tại TP.HCM (thuật toán NOAA). Hướng nhà đặt bằng phương vị của mặt chính.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { HC, GRADE } from './common.js';

export const SITE = { lat: 10.78, lon: 106.70, tz: 7, name: 'TP. Hồ Chí Minh' };
const D2R = Math.PI / 180;

// Trả về { el: cao độ (°), az: phương vị từ Bắc theo chiều kim đồng hồ (°) } cho ngày (Date) và giờ địa phương (số thực)
export function sunPosition(date, hour, site = SITE) {
  const y = date.getFullYear(), doy = Math.round((Date.UTC(y, date.getMonth(), date.getDate()) - Date.UTC(y, 0, 1)) / 864e5) + 1;
  const g = 2 * Math.PI / 365 * (doy - 1 + (hour - 12) / 24);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const tst = hour * 60 + eqt + 4 * site.lon - 60 * site.tz, ha = (tst / 4 - 180) * D2R, lat = site.lat * D2R;
  const cosZ = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha);
  const zen = Math.acos(Math.min(1, Math.max(-1, cosZ))), sinZ = Math.sin(zen);
  let az = sinZ < 1e-6 ? 180 : Math.acos(Math.min(1, Math.max(-1, (Math.sin(decl) - Math.sin(lat) * cosZ) / (Math.cos(lat) * sinZ)))) / D2R;
  if (ha > 0) az = 360 - az;
  return { el: 90 - zen / D2R, az, decl, eqt };
}
// Hướng tới Mặt Trời trong hệ mô hình (mặt chính công trình = +z, phương vị mặt chính = bearing)
export function sunDir(el, az, bearing) {
  const a = (az - bearing) * D2R, ce = Math.cos(el * D2R);
  return new THREE.Vector3(-ce * Math.sin(a), Math.sin(el * D2R), ce * Math.cos(a));
}
const hhmm = h => { const m = Math.round(h * 60); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const COMPASS = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
export const compassName = b => COMPASS[Math.round(((b % 360) + 360) % 360 / 45) % 8];

export function initSun({ sun, hemi, scene, $, onChange }) {
  const S = { on: false, date: new Date(), hour: 10, bearing: 180, play: false };
  const target = new THREE.Vector3(HC, GRADE, -6.5), R = 130;
  const grp = new THREE.Group(); grp.visible = false; scene.add(grp);
  const disc = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffd23a })); grp.add(disc);
  const pathMat = new THREE.LineBasicMaterial({ color: 0xff9d1a }), path = new THREE.Line(new THREE.BufferGeometry(), pathMat); grp.add(path);
  const ray = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineDashedMaterial({ color: 0xff9d1a, dashSize: 2, gapSize: 1.5 })); grp.add(ray);
  // hoa gió: vòng tròn + 4 nhãn hướng, xoay theo hướng nhà
  const rose = new THREE.Group(); grp.add(rose);
  const circ = []; for (let i = 0; i <= 64; i++) circ.push(new THREE.Vector3(Math.sin(i / 64 * 2 * Math.PI) * 62, 0.05, Math.cos(i / 64 * 2 * Math.PI) * 62));
  rose.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(circ), new THREE.LineBasicMaterial({ color: 0x334455 })));
  rose.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0, 0.05, 70)]), new THREE.LineBasicMaterial({ color: 0xc0392b })));
  const roseLbl = [];
  ['B', 'Đ', 'N', 'T'].forEach((t, k) => {
    const d = document.createElement('div'); d.className = 'lbl axis rose'; d.textContent = t;
    const o = new CSS2DObject(d); const a = k * Math.PI / 2; o.position.set(-Math.sin(a) * 68, 0.5, Math.cos(a) * 68); o.visible = false; rose.add(o); roseLbl.push(o);   // theo chiều kim đồng hồ nhìn từ trên
  });
  rose.position.copy(target);
  const base = { pos: sun.position.clone(), int: sun.intensity, col: sun.color.clone(), hemi: hemi.intensity };

  function apply() {
    roseLbl.forEach(o => { o.visible = S.on; });   // CSS2DRenderer không xét visible của nhóm cha
    if (!S.on) {
      sun.position.copy(base.pos); sun.intensity = base.int; sun.color.copy(base.col); hemi.intensity = base.hemi; grp.visible = false;
      $('#sunInfo').textContent = 'Đang dùng ánh sáng cố định (bật để mô phỏng).'; return;
    }
    grp.visible = true;
    const p = sunPosition(S.date, S.hour), dir = sunDir(p.el, p.az, S.bearing);
    sun.position.copy(target).addScaledVector(dir, 150);
    const k = THREE.MathUtils.clamp(Math.sin(p.el * D2R) / 0.28, 0, 1);
    sun.intensity = p.el > -1 ? 0.25 + 2.2 * k : 0.03;
    sun.color.set(0xffffff).lerp(new THREE.Color(0xffb26b), 1 - k);
    hemi.intensity = p.el > 0 ? 0.55 + 0.4 * k : 0.25;
    disc.position.copy(target).addScaledVector(dir, R); disc.visible = p.el > -2;
    ray.geometry.setFromPoints([target.clone().add(new THREE.Vector3(0, 12, 0)), disc.position]); ray.computeLineDistances(); ray.visible = p.el > 0;
    // đường đi Mặt Trời trong ngày
    const pts = []; let rise = null, set = null, prev = null;
    for (let h = 0; h <= 24; h += 0.1) {
      const q = sunPosition(S.date, h);
      if (q.el > 0) pts.push(target.clone().addScaledVector(sunDir(q.el, q.az, S.bearing), R));
      if (prev !== null && prev <= 0 && q.el > 0) rise = h; if (prev !== null && prev > 0 && q.el <= 0) set = h; prev = q.el;
    }
    path.geometry.dispose(); path.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    rose.rotation.y = S.bearing * D2R;   // xoay để nhãn "B" chỉ đúng hướng Bắc so với nhà
    $('#sunInfo').innerHTML = p.el > 0
      ? `Cao độ <b>${p.el.toFixed(0)}°</b> · phương vị <b>${p.az.toFixed(0)}°</b> (${compassName(p.az)}) · bóng dài ≈ <b>${(1 / Math.tan(Math.max(p.el, 1) * D2R)).toFixed(1)}×</b> chiều cao vật · mọc ${rise ? hhmm(rise) : '—'} · lặn ${set ? hhmm(set) : '—'}`
      : `Mặt Trời dưới đường chân trời (cao độ ${p.el.toFixed(0)}°) · mọc ${rise ? hhmm(rise) : '—'} · lặn ${set ? hhmm(set) : '—'}`;
    onChange && onChange(S, p);
  }
  const dateEl = $('#sunDate'), hourEl = $('#sunHour'), bearEl = $('#sunBearing');
  dateEl.value = S.date.toISOString().slice(0, 10);
  const out = el => el.parentElement.querySelector('.v');
  $('#sunOn').onchange = e => { S.on = e.target.checked; apply(); };
  dateEl.onchange = () => { const d = new Date(dateEl.value + 'T12:00:00'); if (!isNaN(d)) { S.date = d; apply(); } };
  hourEl.oninput = () => { S.hour = +hourEl.value; out(hourEl).textContent = hhmm(S.hour); apply(); };
  bearEl.oninput = () => { S.bearing = +bearEl.value; out(bearEl).textContent = `${S.bearing}° ${compassName(S.bearing)}`; apply(); };
  hourEl.value = S.hour; bearEl.value = S.bearing; out(hourEl).textContent = hhmm(S.hour); out(bearEl).textContent = `${S.bearing}° ${compassName(S.bearing)}`;
  $('#sunPlay').onclick = () => { S.play = !S.play; $('#sunPlay').textContent = S.play ? '⏸ Dừng' : '▶ Chạy cả ngày'; if (S.play && !S.on) { S.on = true; $('#sunOn').checked = true; } };
  const presets = { equinox: '03-21', summer: '06-21', winter: '12-21' };
  document.querySelectorAll('[data-sunday]').forEach(b => { b.onclick = () => { dateEl.value = `${S.date.getFullYear()}-${presets[b.dataset.sunday]}`; dateEl.onchange(); }; });
  apply();
  return {
    S, apply,
    tick(dt) { if (!S.play) return; S.hour += dt * 0.8; if (S.hour > 18.5) S.hour = 5.5; hourEl.value = S.hour.toFixed(2); hourEl.oninput(); },
    setEnabled(on) { S.on = on; $('#sunOn').checked = on; apply(); },
  };
}
