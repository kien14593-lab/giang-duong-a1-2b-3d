# -*- coding: utf-8 -*-
# A1-2B_blender.py – dựng cảnh phối cảnh cho mô hình Giảng đường A1-2B trong Blender 4.2 trở lên (đã thử trên 5.2).
# Dùng với file .glb xuất từ web (mục "Xuất mô hình" › Xuất glTF): https://kien14593-lab.github.io/giang-duong-a1-2b-3d/
#
# CÁCH DÙNG
#   1. Mở Blender › General › chuyển sang tab "Scripting" (trên cùng).
#   2. Khung Text Editor: Open › chọn file này › bấm ▶ (Run Script).
#   3. Chọn file .glb › bấm "Nhập & dựng cảnh". Script sẽ:
#        – nhập mô hình (nếu cảnh chưa có) và xoá khối lập phương/đèn/camera mặc định;
#        – tạo bầu trời vật lý và đèn mặt trời (A1-2B_MatTroi) đúng vị trí tại TP.HCM theo NGAY / GIO bên dưới;
#        – đổi kính sang kính thật (phản chiếu, xuyên sáng), sàn tô màu công năng → sàn trơn, nền cỏ;
#        – tạo 3 camera phối cảnh 2 điểm tụ (cạnh đứng thẳng): Góc phố, Chính diện, Trên cao;
#        – đặt Cycles + GPU (nếu có), khử nhiễu, ảnh 1920×1080.
#   4. Bấm tab "Layout" để xem khung lớn (Numpad 0 = nhìn qua camera · Home = khung camera vừa màn hình).
#      Lần đầu hiện Material Preview, Blender biên dịch shader ~1 phút – chờ hết dòng "Compiling shaders".
#   5. F12 để render (GPU ~30–90 giây/ảnh Full HD) › Image › Save As để lưu ảnh.
#   Đổi ngày/giờ/hướng/cỡ ảnh: sửa các biến dưới đây rồi bấm ▶ lần nữa (không phải nhập lại mô hình).
#   Nếu đã tự nhập .glb (File › Import › glTF 2.0) thì script chỉ dựng cảnh, không hỏi file.
#
# Dòng lệnh:
#   blender --python A1-2B_blender.py -- mo_hinh.glb               mở Blender, nhập và dựng cảnh luôn (script hiện sẵn ở tab Scripting)
#   blender -b -P A1-2B_blender.py -- mo_hinh.glb [thu_muc_anh]    render cả 3 camera, không mở giao diện

import bpy, math, os, sys, datetime
from mathutils import Vector

# ======================== TUỲ CHỈNH ========================
NGAY = '2026-12-15'          # ngày 'YYYY-MM-DD'; để '' = hôm nay
GIO = 15.0                   # giờ TP.HCM, ví dụ 15.5 = 15:30 (mặt trời mọc ~6h, lặn ~17h45–18h15); 15h tháng 12: nắng Tây Nam như ánh sáng mặc định trên web
HUONG_MAT_CHINH = 180        # phương vị mặt đứng chính, độ (0 Bắc · 90 Đông · 180 Nam · 270 Tây) – như thanh "Hướng mặt chính" trên web
DONG_CO = 'CYCLES'           # 'CYCLES' = ảnh đẹp nhất · 'EEVEE' = nhanh, xem trước
SO_MAU = 128                 # số mẫu Cycles: 64 nháp · 128 thường · 256+ ảnh cuối
KICH_THUOC = (1920, 1080)    # cỡ ảnh (rộng, cao) – (3840, 2160) cho 4K
PHOI_SANG = 0.0              # độ sáng ảnh (EV): +0.5 sáng hơn · −0.5 tối hơn
SAN_TRON = True              # thay sàn tô màu công năng bằng sàn trơn
AN_NGUOI_CAY_KHOI = False    # ẩn người/cây dạng khối đơn giản của web (khi tự thêm cây, người thật)
# ===========================================================

VI_DO, KINH_DO, MUI_GIO = 10.78, 106.70, 7          # TP.HCM – giống mô phỏng nắng trên web
TT = 'A1-2B_'
KINH = {'glass', 'cwGlass', 'cwGlass2', 'cwGlass3', 'railGlass'}
KHOI_DON_GIAN = {'trunk', 'leaf', 'leaf2', 'p1', 'p2', 'p3'}
# Góc nhìn lấy từ web (main.js › VIEWS), toạ độ three.js: x · y (lên) · z (về phía mặt đứng chính)
CAMERAS = [
    ('Cam_GocPho', (78, 0.7, 40), (24, 9, -6.5)),
    ('Cam_ChinhDien', (23.195, 0.7, 56), (23.195, 15, -6.5)),
    ('Cam_TrenCao', (-10, 27, 58), (23.195, 10, -6.5)),
]
HUONG = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc']
# Nắng trực tiếp theo độ cao mặt trời, quy đổi từ đĩa mặt trời của bầu trời vật lý (cường độ 0,1) ra đèn Sun (R, G, B · W/m², đo bằng Cycles).
# Dùng đèn thay đĩa mặt trời để Cycles, EEVEE và khung nhìn Material Preview cho cùng một ánh nắng.
NANG = [(0, (0.0, 0.0, 0.0)), (5, (7.22, 3.68, 0.84)), (10, (10.82, 7.22, 3.25)), (20, (13.76, 10.71, 6.8)),
        (37, (15.41, 12.88, 9.56)), (60, (16.14, 13.88, 10.97)), (90, (16.37, 14.19, 11.43))]


def goc(ten):   # 'cwGlass.001' → 'cwGlass'
    return ten[:-4] if len(ten) > 4 and ten[-4] == '.' and ten[-3:].isdigit() else ten


def mat_troi(ngay, gio):
    """Cao độ và phương vị (độ, từ Bắc theo chiều kim đồng hồ) – thuật toán NOAA như web (sun.js)."""
    doy = ngay.timetuple().tm_yday
    g = 2 * math.pi / 365 * (doy - 1 + (gio - 12) / 24)
    eqt = 229.18 * (0.000075 + 0.001868 * math.cos(g) - 0.032077 * math.sin(g) - 0.014615 * math.cos(2 * g) - 0.040849 * math.sin(2 * g))
    decl = (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g) - 0.006758 * math.cos(2 * g)
            + 0.000907 * math.sin(2 * g) - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g))
    ha = math.radians((gio * 60 + eqt + 4 * KINH_DO - 60 * MUI_GIO) / 4 - 180)
    lat = math.radians(VI_DO)
    cz = max(-1.0, min(1.0, math.sin(lat) * math.sin(decl) + math.cos(lat) * math.cos(decl) * math.cos(ha)))
    zen = math.acos(cz)
    if math.sin(zen) < 1e-6:
        az = 180.0
    else:
        az = math.degrees(math.acos(max(-1.0, min(1.0, (math.sin(decl) - math.sin(lat) * cz) / (math.cos(lat) * math.sin(zen))))))
        if ha > 0:
            az = 360 - az
    return 90 - math.degrees(zen), az


def bsdf(m):
    if not m or not m.node_tree:
        return None
    return next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)


def dat(node, ten, gt):
    for t in (ten if isinstance(ten, tuple) else (ten,)):
        s = node.inputs.get(t)
        if s is not None:
            s.default_value = gt
            return True
    return False


def vat_lieu_moi(ten):
    m = bpy.data.materials.get(ten)
    if m is None:
        m = bpy.data.materials.new(ten)
    if not m.node_tree:
        m.use_nodes = True
    return m


def srgb(h):
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(f(((h >> s) & 255) / 255) for s in (16, 8, 0)) + (1.0,)


def tim_mo_hinh():
    nha = [o for o in bpy.data.objects if o.parent is None and o.name.startswith('GiangDuong_A1-2B')]
    khu = [o for o in bpy.data.objects if o.parent is None and goc(o.name) == 'KhuDat']
    return nha, khu


def nhap(path):
    if not os.path.isfile(path):
        raise RuntimeError('Không thấy file: ' + path)
    bpy.ops.import_scene.gltf(filepath=path)


def xoa_mac_dinh():
    """Chỉ xoá khối lập phương / đèn / camera của cảnh mặc định (đúng tên và vị trí mặc định)."""
    mac_dinh = {'Cube': ('MESH', (0, 0, 0)), 'Light': ('LIGHT', (4.076, 1.005, 5.904)), 'Camera': ('CAMERA', (7.359, -6.926, 4.958))}
    for ten, (loai, vt) in mac_dinh.items():
        o = bpy.data.objects.get(ten)
        if o and o.type == loai and (o.location - Vector(vt)).length < 0.01 and (loai != 'MESH' or len(o.data.vertices) == 8):
            bpy.data.objects.remove(o, do_unlink=True)


def bo_suu_tap(sc):
    c = bpy.data.collections.get(TT + 'Canh')
    if c is None:
        c = bpy.data.collections.new(TT + 'Canh')
    if c.name not in sc.collection.children:
        sc.collection.children.link(c)
    return c


# ---------------- bầu trời + mặt trời ----------------
def bau_troi(sc, el, az):
    w = bpy.data.worlds.get(TT + 'BauTroi') or bpy.data.worlds.new(TT + 'BauTroi')
    sc.world = w
    if not w.node_tree:
        w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    sky = nt.nodes.new('ShaderNodeTexSky')
    for t in ('MULTIPLE_SCATTERING', 'NISHITA', 'SINGLE_SCATTERING'):
        try:
            sky.sky_type = t
            break
        except TypeError:
            pass
    sky.sun_disc = False   # nắng trực tiếp do đèn A1-2B_MatTroi đảm nhận (EEVEE không chiếu sáng bằng đĩa mặt trời)
    sky.sun_elevation = math.radians(el)
    # sun_rotation = phương vị theo chiều kim đồng hồ từ trục +Y; mặt đứng chính nhìn về −Y (phương vị HUONG_MAT_CHINH)
    sky.sun_rotation = math.radians((az - HUONG_MAT_CHINH + 180) % 360)
    bg = nt.nodes.new('ShaderNodeBackground')
    bg.inputs['Strength'].default_value = 0.1   # bầu trời vật lý rất sáng (~100 000 lux) → giảm về mức phơi sáng ảnh chụp ban ngày
    out = nt.nodes.new('ShaderNodeOutputWorld')
    sky.location, bg.location, out.location = (-300, 0), (0, 0), (220, 0)
    nt.links.new(sky.outputs[0], bg.inputs['Color'])
    nt.links.new(bg.outputs[0], out.inputs['Surface'])
    den_mat_troi(sc, el, az)


def nang(el):
    if el <= 0:
        return (0.0, 0.0, 0.0)
    for (e0, c0), (e1, c1) in zip(NANG, NANG[1:]):
        if el <= e1:
            t = (el - e0) / (e1 - e0)
            return tuple(a + (b - a) * t for a, b in zip(c0, c1))
    return NANG[-1][1]


def den_mat_troi(sc, el, az):
    """Đèn Sun đặt đúng hướng nắng; cường độ và màu (đỏ dần khi mặt trời thấp) theo bảng NANG."""
    ten = TT + 'MatTroi'
    o = bpy.data.objects.get(ten)
    if o is None or o.type != 'LIGHT':
        o = bpy.data.objects.new(ten, bpy.data.lights.new(ten, 'SUN'))
        bo_suu_tap(sc).objects.link(o)
    ld = o.data
    ld.type = 'SUN'
    k = nang(el)
    ld.energy = max(k)
    ld.color = tuple(c / ld.energy for c in k) if ld.energy > 0 else (1.0, 1.0, 1.0)
    ld.angle = math.radians(0.545)
    a, e = math.radians(az - HUONG_MAT_CHINH), math.radians(max(el, 0.0))
    huong = Vector((-math.cos(e) * math.sin(a), -math.cos(e) * math.cos(a), math.sin(e)))   # từ nhà nhìn về phía mặt trời
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = huong.to_track_quat('Z', 'Y')   # đèn Sun chiếu theo trục −Z của nó
    o.location = Vector((23.2, 6.5, 45.0)) + huong * 15
    o.hide_render = el <= 0
    return o


# ---------------- vật liệu ----------------
def sua_kinh(m):
    """Kính thật: xuyên sáng + phản chiếu; tia bóng đổ đi qua kính để nắng/trời chiếu vào trong nhà."""
    if m.get('a12b') or not bsdf(m):
        return
    nt, p = m.node_tree, bsdf(m)
    c = p.inputs['Base Color'].default_value
    tint = tuple(0.6 + 0.4 * c[i] for i in range(3)) + (1.0,)
    dat(p, 'Base Color', tint)
    dat(p, 'Alpha', 1.0)
    dat(p, 'Metallic', 0.0)
    dat(p, 'Roughness', 0.0)
    dat(p, 'IOR', 1.52)
    dat(p, ('Transmission Weight', 'Transmission'), 1.0)
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    lp, tr, mix = nt.nodes.new('ShaderNodeLightPath'), nt.nodes.new('ShaderNodeBsdfTransparent'), nt.nodes.new('ShaderNodeMixShader')
    tr.inputs['Color'].default_value = tint
    lp.location, tr.location, mix.location = (p.location.x, p.location.y + 420), (p.location.x + 60, p.location.y + 120), (out.location.x - 20, out.location.y)
    out.location.x += 200
    nt.links.new(lp.outputs['Is Shadow Ray'], mix.inputs['Fac'])
    nt.links.new(p.outputs['BSDF'], mix.inputs[1])
    nt.links.new(tr.outputs['BSDF'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    for k, v in (('surface_render_method', 'DITHERED'), ('use_raytrace_refraction', True), ('thickness_mode', 'SLAB'), ('use_transparent_shadow', True)):
        if hasattr(m, k):
            setattr(m, k, v)
    m['a12b'] = 1


def sua_logo(objs):
    """Biển logo sơn mờ: bớt loá nắng khi nhìn chéo (góc phản xạ gương của mặt trời)."""
    for o in objs:
        if o.type == 'MESH' and goc(o.name) in ('Logo_UTC2', 'Logo_De'):
            for s in o.material_slots:
                p = bsdf(s.material)
                if p:
                    dat(p, 'Roughness', 0.85)
                    dat(p, ('Specular IOR Level', 'Specular'), 0.2)


def vat_lieu_san():
    m = vat_lieu_moi(TT + 'SanTron')
    p = bsdf(m)
    dat(p, 'Base Color', (0.62, 0.6, 0.56, 1.0))
    dat(p, 'Roughness', 0.45)
    return m


def vat_lieu_co():
    ten = TT + 'Co'
    if bpy.data.materials.get(ten):
        return bpy.data.materials[ten]
    m = vat_lieu_moi(ten)
    nt, p = m.node_tree, bsdf(m)
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    nz, nz2 = nt.nodes.new('ShaderNodeTexNoise'), nt.nodes.new('ShaderNodeTexNoise')
    ramp, bump = nt.nodes.new('ShaderNodeValToRGB'), nt.nodes.new('ShaderNodeBump')
    nz.inputs['Scale'].default_value = 0.06
    nz.inputs['Detail'].default_value = 6.0
    nz2.inputs['Scale'].default_value = 45.0
    ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[0].color = 0.3, (0.045, 0.1, 0.022, 1)
    ramp.color_ramp.elements[1].position, ramp.color_ramp.elements[1].color = 0.75, (0.13, 0.21, 0.055, 1)
    bump.inputs['Strength'].default_value = 0.25
    nt.links.new(geo.outputs['Position'], nz.inputs['Vector'])
    nt.links.new(geo.outputs['Position'], nz2.inputs['Vector'])
    nt.links.new(nz.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
    nt.links.new(nz2.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], p.inputs['Normal'])
    dat(p, 'Roughness', 0.95)
    for i, n in enumerate((geo, nz, nz2, ramp, bump)):
        n.location = (-900 + 180 * i, 200 - 120 * (i % 2))
    return m


def bo_to_sang(objs):
    """File xuất khi đang bật "Tô sáng" (màu cam) → trả lại vật liệu gốc (lưu trong thuộc tính mat0)."""
    n = 0
    for o in objs:
        if o.type != 'MESH' or 'mat0' not in o.keys():
            continue
        info = o['mat0']
        ten = str(info.get('name', ''))
        for s in o.material_slots:
            if s.material and goc(s.material.name) == 'prop':
                m = next((x for x in bpy.data.materials if ten and goc(x.name) == ten), None)
                if m is None:
                    m = vat_lieu_moi(TT + (ten or 'VatLieu'))
                    p = bsdf(m)
                    dat(p, 'Base Color', srgb(int(info.get('color', 0xcccccc))))
                    dat(p, 'Roughness', float(info.get('roughness', 0.8)))
                    dat(p, 'Metallic', float(info.get('metalness', 0.0)))
                s.material = m
                n += 1
    return n


def nen_mo_rong(sc, khu, co):
    ten = TT + 'NenMoRong'
    o = bpy.data.objects.get(ten)
    if o is None:
        r = 10000.0   # rộng 20 km: mép nền sát đường chân trời, không lộ dải trời tối phía dưới
        me = bpy.data.meshes.new(ten)
        me.from_pydata([(-r, -r, 0), (r, -r, 0), (r, r, 0), (-r, r, 0)], [], [(0, 1, 2, 3)])
        o = bpy.data.objects.new(ten, me)
        bo_suu_tap(sc).objects.link(o)
    z = min((min((x.matrix_world @ Vector(c)).z for c in x.bound_box) for x in khu if x.type == 'MESH'), default=-1.3)
    o.location = (23.2, 6.5, z + 0.25)   # nằm dưới mặt khu đất (−1,02) – chỉ lộ ra ngoài phạm vi khu đất
    o.data.materials.clear()
    o.data.materials.append(co)
    return o


# ---------------- camera 2 điểm tụ ----------------
def hop_bao(objs):
    lo, hi = Vector((1e9, 1e9, 1e9)), Vector((-1e9, -1e9, -1e9))
    for o in objs:
        if o.type != 'MESH':
            continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
    return [Vector((x, y, z)) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)]


def dat_camera(sc, ten, vt, dn, M, goc_hop, rong, cao):
    """Camera đặt ngang (cạnh đứng không bị chụm), xoay cho nhà vào giữa, tự chọn tiêu cự + dịch khung (shift) để vừa khung."""
    b3 = lambda v: M @ Vector((v[0], -v[2], v[1]))   # three.js (Y lên) → Blender (Z lên)
    p, t = b3(vt), b3(dn)
    yaw = math.atan2(t.y - p.y, t.x - p.x)
    for _ in range(8):
        f, r = Vector((math.cos(yaw), math.sin(yaw), 0)), Vector((math.sin(yaw), -math.cos(yaw), 0))
        xs, ys = [], []
        for c in goc_hop:
            d = c - p
            sau = max(d.dot(f), 0.5)
            xs.append(d.dot(r) / sau)
            ys.append(d.z / sau)
        yaw -= math.atan((min(xs) + max(xs)) / 2)
    ti = rong / cao
    nua_ngang = (max(xs) - min(xs)) / 2 * 1.08
    duoi, tren = min(ys), max(ys)
    span = tren - duoi
    duoi, tren = duoi - 0.14 * span, tren + 0.07 * span   # chừa thêm nền phía trước, trời phía trên
    f_mm = min(18.0 / nua_ngang, 36.0 / (ti * (tren - duoi)), 60.0)
    lon_nhat = max(36.0 / f_mm, 36.0 / (f_mm * ti))
    cam = bpy.data.objects.get(TT + ten)
    if cam is None or cam.type != 'CAMERA':
        cam = bpy.data.objects.new(TT + ten, bpy.data.cameras.new(TT + ten))
        bo_suu_tap(sc).objects.link(cam)
    cd = cam.data
    cd.sensor_fit, cd.sensor_width, cd.lens = 'HORIZONTAL', 36.0, f_mm
    cd.shift_x, cd.shift_y = 0.0, ((duoi + tren) / 2) / lon_nhat
    cd.clip_start, cd.clip_end = 0.1, 30000.0
    cam.location = p
    cam.rotation_mode = 'XYZ'
    cam.rotation_euler = (math.pi / 2, 0.0, yaw - math.pi / 2)
    return cam


# ---------------- render ----------------
def cai_dat_render(sc):
    r = sc.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = KICH_THUOC[0], KICH_THUOC[1], 100
    r.film_transparent = False
    thiet_bi = 'CPU'
    if DONG_CO.upper() == 'EEVEE':
        for e in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
            try:
                r.engine = e
                break
            except TypeError:
                pass
        ee = sc.eevee
        for k, v in (('use_raytracing', True), ('taa_render_samples', 64), ('use_shadows', True), ('shadow_ray_count', 2), ('shadow_step_count', 8), ('use_fast_gi', True)):
            if hasattr(ee, k):
                setattr(ee, k, v)
        thiet_bi = 'GPU'
    else:
        r.engine = 'CYCLES'
        cy = sc.cycles
        cy.samples = SO_MAU
        cy.use_adaptive_sampling, cy.adaptive_threshold = True, 0.02
        cy.use_denoising = True
        try:
            cy.denoiser = 'OPENIMAGEDENOISE'
        except TypeError:
            pass
        cy.max_bounces, cy.diffuse_bounces, cy.glossy_bounces, cy.transmission_bounces, cy.transparent_max_bounces = 8, 4, 4, 8, 16
        cy.sample_clamp_indirect = 10.0
        try:
            pref = bpy.context.preferences.addons['cycles'].preferences
            for loai in ('OPTIX', 'CUDA', 'HIP', 'METAL', 'ONEAPI'):
                try:
                    pref.compute_device_type = loai
                except TypeError:
                    continue
                pref.get_devices()
                if any(d.type == loai for d in pref.devices):
                    for d in pref.devices:
                        d.use = d.type == loai
                    cy.device = 'GPU'
                    thiet_bi = 'GPU ' + loai
                    break
            else:
                pref.compute_device_type = 'NONE'
                cy.device = 'CPU'
        except Exception:
            cy.device = 'CPU'
    vs = sc.view_settings
    try:
        vs.view_transform = 'AgX'
        for look in ('AgX - Medium High Contrast', 'Medium High Contrast'):
            try:
                vs.look = look
                break
            except TypeError:
                pass
    except TypeError:
        pass
    vs.exposure = PHOI_SANG
    return thiet_bi


def khung_nhin():
    """Khung nhìn 3D ở mọi workspace (Layout, Scripting…): nhìn qua camera, Material Preview dùng bầu trời + đèn của cảnh."""
    dang_mo = {w.screen: w for w in bpy.context.window_manager.windows}
    for scr in bpy.data.screens:
        for area in scr.areas:
            if area.type != 'VIEW_3D':
                continue
            try:
                sp = area.spaces.active
                sp.clip_end = 30000.0
                sp.overlay.show_relationship_lines = False   # bỏ nét đứt nối logo/các nhóm về gốc mô hình
                sp.shading.type = 'MATERIAL'
                for k in ('use_scene_world', 'use_scene_lights'):
                    if hasattr(sp.shading, k):
                        setattr(sp.shading, k, True)
                sp.region_3d.view_perspective = 'CAMERA'
                vung = next((r for r in area.regions if r.type == 'WINDOW'), None)
                if scr in dang_mo and vung:
                    with bpy.context.temp_override(window=dang_mo[scr], area=area, region=vung):
                        bpy.ops.view3d.view_center_camera()   # khung camera vừa khung nhìn (như phím Home)
                elif vung and vung.width > 50 and vung.height > 50:
                    # workspace chưa mở: ước lượng thu phóng (rộng khung camera = rộng vùng × hệ số zoom)
                    r = bpy.context.scene.render
                    fac = 0.9 * min(1.0, (vung.height / vung.width) / (r.resolution_y / r.resolution_x))
                    sp.region_3d.view_camera_zoom = 50 * (2 * math.sqrt(fac) - math.sqrt(2))
                    sp.region_3d.view_camera_offset = (0.0, 0.0)
                area.tag_redraw()
            except Exception as e:
                print('Khung nhìn:', e)


# ---------------- dựng cảnh ----------------
def dung_canh():
    sc = bpy.context.scene
    nha, khu = tim_mo_hinh()
    if not nha:
        raise RuntimeError('Không thấy mô hình (đối tượng "GiangDuong_A1-2B_…"). Hãy nhập file .glb xuất từ web.')
    xoa_mac_dinh()
    goc_nha = nha[-1]
    objs = [x for g in nha + khu for x in [g] + list(g.children_recursive)]
    ghi = []
    if len(nha) > 1:
        ghi.append('Cảnh có %d mô hình chồng nhau – camera canh theo "%s".' % (len(nha), goc_nha.name))

    ngay = datetime.date.fromisoformat(NGAY) if NGAY else datetime.date.today()
    el, az = mat_troi(ngay, GIO)
    bau_troi(sc, el, az)
    if el <= 0:
        ghi.append('Mặt trời đã lặn/chưa mọc lúc %.2f h – ảnh sẽ tối.' % GIO)

    n_prop = bo_to_sang(objs)
    for m in {s.material for o in objs if o.type == 'MESH' for s in o.material_slots if s.material}:
        if goc(m.name) in KINH:
            sua_kinh(m)
    sua_logo(objs)
    if SAN_TRON:
        san, mau_cn = vat_lieu_san(), set()
        for o in objs:
            if o.type == 'MESH' and 'kind' in o.keys():
                mau_cn.update(s.material for s in o.material_slots if s.material)
        for o in objs:
            if o.type == 'MESH':
                for s in o.material_slots:
                    if s.material in mau_cn:
                        s.material = san
    co = vat_lieu_co()
    khu_objs = [x for g in khu for x in [g] + list(g.children_recursive)]
    for o in khu_objs:
        if o.type == 'MESH':
            for s in o.material_slots:
                if s.material and goc(s.material.name) == 'ground':
                    s.material = co
            if o.material_slots and o.material_slots[0].material and goc(o.material_slots[0].material.name) in KHOI_DON_GIAN:
                o.hide_render = o.hide_viewport = AN_NGUOI_CAY_KHOI
    if khu_objs:
        nen_mo_rong(sc, khu_objs, co)

    hop = hop_bao([goc_nha] + list(goc_nha.children_recursive))
    cams = [dat_camera(sc, ten, vt, dn, goc_nha.matrix_world, hop, *KICH_THUOC) for ten, vt, dn in CAMERAS]
    sc.camera = cams[0]
    thiet_bi = cai_dat_render(sc)
    for o in objs:   # bỏ chọn sau khi nhập: hàng trăm đường viền cam che mất mô hình trong khung nhìn
        try:
            o.select_set(False)
        except RuntimeError:
            pass
    if bpy.context.view_layer.objects.get(goc_nha.name):
        bpy.context.view_layer.objects.active = goc_nha

    huong = HUONG[round(az / 45) % 8]
    phut = round(GIO * 60)
    tb = ['Đã dựng cảnh A1-2B · %s · %s.' % (sc.render.engine.replace('BLENDER_', ''), thiet_bi),
          'Mặt trời %s %02d:%02d: cao %.0f°, hướng %s (%.0f°); mặt chính nhìn về %.0f°.' % (ngay.strftime('%d/%m/%Y'), phut // 60, phut % 60, el, huong, az, HUONG_MAT_CHINH),
          'Camera: ' + ', '.join(c.name for c in cams) + ' (đổi camera: chọn camera › Ctrl+Numpad 0).',
          'Xem khung lớn: tab Layout · Numpad 0 = nhìn qua camera · Home = khung camera vừa màn hình.',
          'Bấm F12 để render › Image › Save As để lưu ảnh.']
    if n_prop:
        tb.insert(1, 'Đã bỏ màu "Tô sáng" (cam) trên %d khối.' % n_prop)
    return '\n'.join(tb + ghi)


def thong_bao(msg, icon='INFO'):
    print(msg)
    if bpy.app.background:
        return
    def ve(self, ctx):
        for dong in msg.split('\n'):
            self.layout.label(text=dong)
    bpy.context.window_manager.popup_menu(ve, title='A1-2B', icon=icon)


def dung_canh_giao_dien():
    try:
        msg = dung_canh()
    except Exception as e:
        thong_bao(str(e), 'ERROR')
        return
    khung_nhin()
    thong_bao(msg)


def nap_van_ban():
    """Mở chính script này trong Text Editor (tab Scripting) để sửa khối TUỲ CHỈNH rồi bấm ▶."""
    duong = os.path.abspath(globals().get('__file__', ''))
    if not os.path.isfile(duong):
        return
    txt = next((t for t in bpy.data.texts if t.filepath and os.path.normcase(os.path.abspath(bpy.path.abspath(t.filepath))) == os.path.normcase(duong)), None)
    if txt is None:
        txt = bpy.data.texts.load(duong)
    for scr in bpy.data.screens:
        for area in scr.areas:
            if area.type == 'TEXT_EDITOR' and area.spaces.active.text is None:
                area.spaces.active.text = txt


def khi_san_sang(fn):
    """Script chạy bằng --python trước khi cửa sổ Blender hiện ra → đợi cửa sổ mở xong mới nhập / dựng cảnh."""
    view = bpy.context.preferences.view
    an_chao = view.show_splash
    view.show_splash = False   # màn hình chào không che cảnh vừa dựng (chỉ lần mở này, bật lại ngay bên dưới)

    def cho():
        wm = bpy.context.window_manager
        if not wm.windows:
            return 0.5
        view.show_splash = an_chao
        with bpy.context.temp_override(window=wm.windows[0]):
            fn()
        return None
    bpy.app.timers.register(cho, first_interval=0.5)


class A12B_OT_nhap_glb(bpy.types.Operator):
    """Nhập file .glb xuất từ web A1-2B và dựng cảnh phối cảnh"""
    bl_idname = 'a12b.nhap_glb'
    bl_label = 'Nhập & dựng cảnh'
    bl_options = {'REGISTER', 'UNDO'}
    filepath: bpy.props.StringProperty(subtype='FILE_PATH')
    filter_glob: bpy.props.StringProperty(default='*.glb;*.gltf', options={'HIDDEN'})

    def invoke(self, context, event):
        context.window_manager.fileselect_add(self)
        return {'RUNNING_MODAL'}

    def execute(self, context):
        try:
            nhap(self.filepath)
            msg = dung_canh()
        except Exception as e:
            self.report({'ERROR'}, str(e))
            return {'CANCELLED'}
        khung_nhin()
        thong_bao(msg)
        return {'FINISHED'}


def dang_ky():
    cu = getattr(bpy.types, 'A12B_OT_nhap_glb', None)
    if cu:
        bpy.utils.unregister_class(cu)
    bpy.utils.register_class(A12B_OT_nhap_glb)


def chay():
    dang_ky()
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if bpy.app.background:
        if args and args[0].lower().endswith(('.glb', '.gltf')):
            nhap(args[0])
        print(dung_canh())
        if len(args) > 1:
            os.makedirs(args[1], exist_ok=True)
            sc = bpy.context.scene
            for cam in [o for o in bpy.data.objects if o.type == 'CAMERA' and o.name.startswith(TT + 'Cam_')]:
                sc.camera = cam
                sc.render.filepath = os.path.join(os.path.abspath(args[1]), cam.name + '.png')
                bpy.ops.render.render(write_still=True)
                print('Đã lưu', sc.render.filepath)
    elif bpy.context.area is None:   # blender [file.blend] --python A1-2B_blender.py [-- mo_hinh.glb]
        nap_van_ban()
        glb = next((a for a in args if a.lower().endswith(('.glb', '.gltf'))), '')
        if tim_mo_hinh()[0]:
            khi_san_sang(dung_canh_giao_dien)
        elif glb:
            khi_san_sang(lambda: bpy.ops.a12b.nhap_glb('EXEC_DEFAULT', filepath=os.path.abspath(glb)))
        else:
            khi_san_sang(lambda: bpy.ops.a12b.nhap_glb('INVOKE_DEFAULT'))
    elif tim_mo_hinh()[0]:
        dung_canh_giao_dien()
    else:
        bpy.ops.a12b.nhap_glb('INVOKE_DEFAULT')


if __name__ == '__main__':
    chay()
