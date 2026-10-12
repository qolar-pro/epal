"""Photoreal product renders (Cycles). Units: 1 BU = 1 cm.
usage: python3 scene.py <shot> <color> <out.png> [res_x res_y samples]
shots: card, stand, sticker (studio) | hero, table, glass (lifestyle)"""
import sys, math, random, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bpylib'))
import bpy, bmesh
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
shot, color, out = sys.argv[1], sys.argv[2], sys.argv[3]
RX, RY, SAMPLES = (int(sys.argv[4]) if len(sys.argv) > 4 else 1200, int(sys.argv[5]) if len(sys.argv) > 5 else 1200, int(sys.argv[6]) if len(sys.argv) > 6 else 128)
random.seed(7)
try: bpy.ops.preferences.addon_enable(module='cycles')
except Exception: pass
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ---------- helpers ----------
def mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; return m, m.node_tree.nodes, m.node_tree.links
def principled(nodes):
    return nodes.get('Principled BSDF')
def setp(bsdf, **kw):
    for k, v in kw.items():
        if k in bsdf.inputs: bsdf.inputs[k].default_value = v
def tex_node(nodes, path, cs='sRGB'):
    n = nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(path); n.image.colorspace_settings.name = cs; n.interpolation = 'Cubic'; return n
def bump_noise(nodes, links, bsdf, scale=900, strength=0.02):
    t = nodes.new('ShaderNodeTexNoise'); t.inputs['Scale'].default_value = scale; t.inputs['Detail'].default_value = 6
    b = nodes.new('ShaderNodeBump'); b.inputs['Strength'].default_value = strength
    links.new(t.outputs['Fac'], b.inputs['Height']); links.new(b.outputs['Normal'], bsdf.inputs['Normal'])

def printed(name, path, rough=0.3, coat=0.7):
    m, n, l = mat(name); b = principled(n); t = tex_node(n, path)
    l.new(t.outputs['Color'], b.inputs['Base Color']); setp(b, Roughness=rough, **{'Coat Weight': coat, 'Coat Roughness': 0.04, 'Specular IOR Level': 0.5}); bump_noise(n, l, b); return m
def plain(name, rgb, rough=0.4, **kw):
    m, n, l = mat(name); b = principled(n); setp(b, **{'Base Color': (*rgb, 1), 'Roughness': rough}, **kw); return m
def acrylic(name, tint=(0.96, 0.98, 1.0), rough=0.015):
    """Clear acrylic; shadow rays pass through so shadows stay light."""
    m, n, l = mat(name); b = principled(n); setp(b, **{'Base Color': (*tint, 1), 'Roughness': rough, 'Transmission Weight': 1.0, 'IOR': 1.49})
    lp = n.new('ShaderNodeLightPath'); tr = n.new('ShaderNodeBsdfTransparent'); mx = n.new('ShaderNodeMixShader'); out = n.get('Material Output')
    l.new(lp.outputs['Is Shadow Ray'], mx.inputs['Fac']); l.new(b.outputs['BSDF'], mx.inputs[1]); l.new(tr.outputs['BSDF'], mx.inputs[2]); l.new(mx.outputs['Shader'], out.inputs['Surface']); return m

def rrect_pts(w, h, r, seg=12):
    pts = []
    for cx, cy, a0 in ((w/2-r, h/2-r, 0), (-w/2+r, h/2-r, 90), (-w/2+r, -h/2+r, 180), (w/2-r, -h/2+r, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg); pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def slab(name, w, h, t, r, mats, bevel=0.012, seg=12):
    """Rounded slab, top face UV-mapped 0..1. mats = [top, bottom, side]."""
    pts = rrect_pts(w, h, r, seg); me = bpy.data.meshes.new(name); bm = bmesh.new()
    top = [bm.verts.new((x, y, t/2)) for x, y in pts]; bot = [bm.verts.new((x, y, -t/2)) for x, y in pts]
    ft = bm.faces.new(top); fb = bm.faces.new(list(reversed(bot))); ft.material_index = 0; fb.material_index = 1
    n = len(pts)
    for i in range(n):
        f = bm.faces.new((top[i], bot[i], bot[(i+1) % n], top[(i+1) % n])); f.material_index = 2
    bm.normal_update()
    if ft.normal.z < 0: bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
    uv = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        for lp in f.loops:
            x, y = lp.vert.co.x, lp.vert.co.y
            lp[uv].uv = ((x + w/2) / w, (y + h/2) / h) if f.material_index in (0, 1) else (0, 0)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob)
    for m in mats: ob.data.materials.append(m)
    if bevel:
        bv = ob.modifiers.new('bevel', 'BEVEL'); bv.width = bevel; bv.segments = 3; bv.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35)); ob.select_set(False)
    return ob

def box(name, w, d, h, m, bevel=0.03):
    bpy.ops.mesh.primitive_cube_add(size=1); ob = bpy.context.active_object; ob.name = name; ob.scale = (w, d, h); bpy.ops.object.transform_apply(scale=True)
    ob.data.materials.append(m); bv = ob.modifiers.new('bevel', 'BEVEL'); bv.width = bevel; bv.segments = 4
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35)); return ob

def plane(name, w, d, m, loc=(0, 0, 0), rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot); ob = bpy.context.active_object; ob.name = name; ob.scale = (w, d, 1); ob.data.materials.append(m); return ob

def area(name, loc, target, size, power, rgb=(1, 1, 1), shape='RECTANGLE', sy=None):
    d = bpy.data.lights.new(name, 'AREA'); d.energy = power; d.size = size; d.color = rgb; d.shape = shape
    if sy: d.size_y = sy
    ob = bpy.data.objects.new(name, d); sc.collection.objects.link(ob); ob.location = loc
    c = ob.constraints.new('TRACK_TO'); c.target = target; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'; return ob

def world(top=(0.9, 0.9, 0.92), bottom=(0.25, 0.25, 0.27), strength=1.0):
    w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True; n = w.node_tree.nodes; l = w.node_tree.links
    tc = n.new('ShaderNodeTexCoord'); sep = n.new('ShaderNodeSeparateXYZ'); mp = n.new('ShaderNodeMapRange'); cr = n.new('ShaderNodeValToRGB'); bg = n['Background']
    l.new(tc.outputs['Generated'], sep.inputs[0]); l.new(sep.outputs['Z'], mp.inputs['Value']); l.new(mp.outputs['Result'], cr.inputs['Fac'])
    cr.color_ramp.elements[0].color = (*bottom, 1); cr.color_ramp.elements[1].color = (*top, 1); l.new(cr.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = strength

def camera(loc, target, focal=85, fstop=5.6, lens_shift=(0, 0)):
    cd = bpy.data.cameras.new('cam'); cd.lens = focal; cd.sensor_width = 36; cd.dof.use_dof = True; cd.dof.aperture_fstop = fstop; cd.shift_x, cd.shift_y = lens_shift
    ob = bpy.data.objects.new('cam', cd); sc.collection.objects.link(ob); ob.location = loc
    c = ob.constraints.new('TRACK_TO'); c.target = target; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    cd.dof.focus_object = target; sc.camera = ob; return ob

def empty(loc):
    e = bpy.data.objects.new('target', None); sc.collection.objects.link(e); e.location = loc; return e

def concrete(name='floor', rgb=(0.80, 0.80, 0.78), rough=0.55):
    m, n, l = mat(name); b = principled(n); setp(b, **{'Base Color': (*rgb, 1), 'Roughness': rough}); bump_noise(n, l, b, scale=60, strength=0.08); return m

def wood(name='wood'):
    m, n, l = mat(name); b = principled(n); tc = n.new('ShaderNodeTexCoord'); mp = n.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (0.05, 0.9, 0.05)
    wv = n.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.inputs['Scale'].default_value = 7; wv.inputs['Distortion'].default_value = 5; wv.inputs['Detail'].default_value = 5
    cr = n.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = (0.10, 0.045, 0.02, 1); cr.color_ramp.elements[1].color = (0.30, 0.15, 0.07, 1)
    l.new(tc.outputs['Object'], mp.inputs['Vector']); l.new(mp.outputs['Vector'], wv.inputs['Vector']); l.new(wv.outputs['Fac'], cr.inputs['Fac']); l.new(cr.outputs['Color'], b.inputs['Base Color'])
    setp(b, Roughness=0.38, **{'Coat Weight': 0.25, 'Coat Roughness': 0.15}); bump_noise(n, l, b, scale=250, strength=0.05); return m

def phone(loc, rot, screen_path):
    body = plain('titanium', (0.16, 0.16, 0.17), 0.28, Metallic=1.0)
    glass = plain('screenglass', (0, 0, 0), 0.03)
    ob = slab('phone', 7.2, 15.0, 0.8, 1.05, [body, body, body], bevel=0.1, seg=16)
    sm, n, l = mat('screen'); b = principled(n); t = tex_node(n, screen_path)
    l.new(t.outputs['Color'], b.inputs['Emission Color']); setp(b, **{'Base Color': (0, 0, 0, 1), 'Emission Strength': 2.2, 'Roughness': 0.04, 'Coat Weight': 0.3})
    scr = slab('screen', 6.95, 14.75, 0.02, 0.95, [sm, glass, glass], bevel=0, seg=16); scr.location = (0, 0, 0.405)
    scr.parent = ob; ob.location = loc; ob.rotation_euler = rot
    # camera island on the back
    lens = plain('lens', (0.01, 0.01, 0.015), 0.05)
    for i, (x, y) in enumerate(((-1.5, 5.6), (-1.5, 3.7), (0.3, 4.65))):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.62, depth=0.16, location=(x, y, -0.45)); c = bpy.context.active_object; c.data.materials.append(lens); c.parent = ob
    return ob

def render(path, rx, ry, samples):
    sc.render.engine = 'CYCLES'; c = sc.cycles; c.device = 'CPU'; c.samples = samples; c.use_denoising = True; c.denoiser = 'OPENIMAGEDENOISE'
    c.max_bounces = 12; c.transmission_bounces = 16; c.glossy_bounces = 8; c.caustics_reflective = False; c.caustics_refractive = False; c.sample_clamp_indirect = 10
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = rx, ry, 100
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.view_settings.exposure = float(os.environ.get('EXPOSURE', '0'))
    sc.render.image_settings.file_format = 'PNG'; sc.render.filepath = path; bpy.ops.render.render(write_still=True)

def T(sku): return os.path.join(HERE, 'tex', f'{sku}-{color}.png')
edge_white = plain('edge', (0.88, 0.88, 0.86), 0.45)

# ---------- shots ----------
if shot == 'card':
    world((0.95, 0.95, 0.97), (0.5, 0.5, 0.52), 0.9)
    top = printed('card_top', T('card')); back = plain('card_back', (0.06, 0.06, 0.07), 0.35, **{'Coat Weight': 0.5})
    # fan: two black-backed cards underneath, selected colour on top (all lying on the surface, slightly offset)
    ob = slab('card', 8.56, 5.4, 0.076, 0.318, [top, back, edge_white], bevel=0.01)
    ob.rotation_euler = (math.radians(0), 0, math.radians(-24)); ob.location = (0.4, -0.2, 0.19)
    alt = printed('card_alt', os.path.join(HERE, 'tex', 'card-graphite.png') if color != 'graphite' else os.path.join(HERE, 'tex', 'card-sand.png'))
    o2 = slab('card2', 8.56, 5.4, 0.076, 0.318, [alt, back, edge_white], bevel=0.01); o2.rotation_euler = (0, 0, math.radians(-4)); o2.location = (-0.9, 0.9, 0.114)
    o3 = slab('card3', 8.56, 5.4, 0.076, 0.318, [back, back, edge_white], bevel=0.01); o3.rotation_euler = (0, 0, math.radians(14)); o3.location = (-1.6, 1.4, 0.038)
    floor = plane('floor', 60, 60, concrete()); tg = empty((0, 0, 0.1))
    area('key', (-20, -24, 30), tg, 22, 7500, (1.0, 0.97, 0.93), sy=16); area('rim', (26, 14, 12), tg, 14, 3500, (0.9, 0.95, 1.0)); area('fill', (16, -26, 8), tg, 30, 1500)
    camera((10, -22, 28), tg, 120, 3.2); render(out, RX, RY, SAMPLES)
elif shot == 'stand':
    world((0.95, 0.95, 0.97), (0.5, 0.5, 0.52), 0.9)
    clear = acrylic('acrylic'); top = printed('insert', T('stand'), rough=0.5, coat=0.15); back = plain('insert_back', (0.9, 0.9, 0.88), 0.7)
    PW, PH = 10.5, 14.8
    paper = slab('paper', 10.0, 10.0 * 148 / 105, 0.02, 0.0001, [top, back, edge_white], bevel=0, seg=1)
    paper.rotation_euler = (math.radians(90), 0, 0); paper.location = (0, 0, 1.0 + PH / 2 - 0.1)
    for name, y in (('front', -0.17), ('back', 0.17)):
        s = slab(name, PW, PH, 0.3, 0.35, [clear, clear, clear], bevel=0.02); s.rotation_euler = (math.radians(90), 0, 0); s.location = (0, y, 1.0 + PH / 2 - 0.1 + 0)
    base = box('base', 12.6, 2.6, 1.7, clear, 0.12); base.location = (0, 0, 0.85)
    cut = box('slot', 11.0, 0.66, 1.2, clear, 0.0); cut.location = (0, 0, 1.4)
    bo = base.modifiers.new('slot', 'BOOLEAN'); bo.object = cut; bo.operation = 'DIFFERENCE'; bo.solver = 'EXACT'
    cut.hide_render = True; cut.hide_viewport = True
    floor = plane('floor', 60, 60, concrete()); tg = empty((0, 0, 8.5))
    area('key', (-26, -30, 30), tg, 24, 11000, (1.0, 0.97, 0.93), sy=18); area('rim', (30, 20, 24), tg, 16, 7000, (0.9, 0.95, 1.0)); area('fill', (20, -30, 8), tg, 34, 2200)
    camera((26, -66, 22), tg, 90, 5.6); render(out, RX, RY, SAMPLES)
elif shot == 'sticker':
    world((0.95, 0.95, 0.97), (0.5, 0.5, 0.52), 0.9)
    top = printed('sticker_top', T('sticker'), rough=0.2, coat=0.9); back = plain('sticker_back', (0.9, 0.9, 0.9), 0.5)
    stack = []
    for i, (dx, dy, rz) in enumerate(((0, 0, 8), (0.9, -0.6, -6), (-0.7, -1.2, 21), (2.2, 1.4, -17), (-2.4, 1.0, 40))):
        s = slab(f'st{i}', 5.0, 5.0, 0.014, 0.6, [top if i == 0 else back, back, back], bevel=0.003, seg=10)
        s.location = (dx * 0.6, dy * 0.6, 0.007 + i * 0.016 if i else 0.007 + 4 * 0.016 + 0.003); s.rotation_euler = (0, 0, math.radians(rz))
    floor = plane('floor', 60, 60, concrete()); tg = empty((0, 0, 0.1))
    area('key', (-16, -18, 24), tg, 18, 5200, (1.0, 0.97, 0.93), sy=14); area('rim', (22, 14, 10), tg, 12, 2200, (0.9, 0.95, 1.0)); area('fill', (14, -22, 8), tg, 24, 1100)
    camera((10, -24, 20), tg, 105, 3.2); render(out, RX, RY, SAMPLES)
elif shot == 'hero':
    world((0.05, 0.055, 0.065), (0.01, 0.01, 0.012), 0.7)
    top = printed('card_top', T('card')); back = plain('card_back', (0.06, 0.06, 0.07), 0.35, **{'Coat Weight': 0.5})
    ob = slab('card', 8.56, 5.4, 0.076, 0.318, [top, back, edge_white], bevel=0.01); ob.rotation_euler = (0, 0, math.radians(-16)); ob.location = (0, 0, 0.04)
    ph = phone((1.2, 1.6, 3.4), (math.radians(-8), math.radians(6), math.radians(24)), os.path.join(HERE, 'tex', 'screen.png'))
    ring = plain('ring', (0, 0, 0), 0.5); rm, rn, rl = mat('ringglow'); rb = principled(rn); setp(rb, **{'Base Color': (0, 0, 0, 1), 'Emission Color': (0.35, 0.75, 1.0, 1), 'Emission Strength': 14.0})
    for r_, z_ in ((1.3, 1.1), (2.1, 1.7), (2.9, 2.3)):
        bpy.ops.mesh.primitive_torus_add(major_radius=r_, minor_radius=0.03, location=(0.8, 0.9, z_)); t_ = bpy.context.active_object; t_.data.materials.append(rm)
    slate = plain('slate', (0.04, 0.042, 0.046), 0.3, **{'Coat Weight': 0.2}); floor = plane('floor', 120, 120, slate); tg = empty((0.6, 0.8, 1.6))
    area('key', (-22, -22, 24), tg, 18, 11000, (1.0, 0.95, 0.9), sy=12); area('rim', (28, 10, 16), tg, 12, 12000, (0.7, 0.85, 1.0)); area('top', (0, -6, 36), tg, 26, 4500)
    camera((11, -30, 22), tg, 70, 4.0); render(out, RX, RY, SAMPLES)
elif shot == 'table':
    world((0.02, 0.02, 0.025), (0.01, 0.01, 0.01), 0.3)
    clear = acrylic('acrylic'); top = printed('insert', T('stand'), rough=0.5, coat=0.15); back = plain('insert_back', (0.9, 0.9, 0.88), 0.7); PW, PH = 10.5, 14.8
    paper = slab('paper', 10.0, 10.0 * 148 / 105, 0.02, 0.0001, [top, back, edge_white], bevel=0, seg=1); paper.rotation_euler = (math.radians(90), 0, math.radians(-14)); paper.location = (0, 0, 1.0 + PH / 2 - 0.1)
    for name, y in (('front', -0.17), ('back', 0.17)):
        s = slab(name, PW, PH, 0.3, 0.35, [clear, clear, clear], bevel=0.02); s.rotation_euler = (math.radians(90), 0, math.radians(-14)); s.location = (-y * math.sin(math.radians(14)) * -1, y * math.cos(math.radians(14)), 1.0 + PH / 2 - 0.1)
    base = box('base', 12.6, 2.6, 1.7, clear, 0.12); base.location = (0, 0, 0.85); base.rotation_euler = (0, 0, math.radians(-14))
    cut = box('slot', 11.0, 0.66, 1.2, clear, 0.0); cut.location = (0, 0, 1.4); cut.rotation_euler = (0, 0, math.radians(-14))
    bo = base.modifiers.new('slot', 'BOOLEAN'); bo.object = cut; bo.operation = 'DIFFERENCE'; bo.solver = 'EXACT'; cut.hide_render = True
    tbl = plane('table', 200, 140, wood(), (0, 20, 0)); tg = empty((0, 0, 7.5))
    wall = plane('wall', 400, 200, plain('wall', (0.05, 0.04, 0.035), 0.9), (0, 150, 60), (math.radians(90), 0, 0))
    for i in range(34):
        e = bpy.data.materials.new(f'b{i}'); e.use_nodes = True; nn = e.node_tree.nodes; bs = nn.get('Principled BSDF'); bs.inputs['Base Color'].default_value = (0, 0, 0, 1)
        warm = random.choice(((1.0, 0.62, 0.25), (1.0, 0.8, 0.5), (1.0, 0.45, 0.18), (1.0, 0.9, 0.7))); bs.inputs['Emission Color'].default_value = (*warm, 1); bs.inputs['Emission Strength'].default_value = random.uniform(8, 36)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=random.uniform(1.2, 3.2), location=(random.uniform(-90, 90), random.uniform(80, 140), random.uniform(18, 75)), segments=24, ring_count=12); sp = bpy.context.active_object; sp.data.materials.append(e)
    area('key', (-30, -24, 32), tg, 18, 16000, (1.0, 0.82, 0.58), sy=12); area('rim', (28, 24, 22), tg, 14, 12000, (1.0, 0.7, 0.4)); area('fill', (10, -40, 10), tg, 30, 1500, (1.0, 0.9, 0.8))
    camera((18, -58, 16), tg, 70, 2.2); render(out, RX, RY, SAMPLES)
elif shot == 'glass':
    world((0.015, 0.02, 0.05), (0.01, 0.012, 0.02), 0.5)
    top = printed('sticker_top', T('sticker'), rough=0.2, coat=0.9); back = plain('sticker_back', (0.9, 0.9, 0.9), 0.5)
    s = slab('sticker', 5.0, 5.0, 0.014, 0.6, [top, back, back], bevel=0.003, seg=10); s.rotation_euler = (math.radians(90), 0, math.radians(3)); s.location = (0, -0.0, 0)
    gm, n, l = mat('glass'); b = principled(n); setp(b, **{'Base Color': (0.9, 0.98, 0.97, 1), 'Roughness': 0.0, 'Transmission Weight': 1.0, 'IOR': 1.5})
    g = plane('glass', 80, 60, gm, (0, 0.08, 0), (math.radians(90), 0, 0))
    frame = plain('frame', (0.02, 0.02, 0.02), 0.35, Metallic=1.0); fr = box('frame', 2.0, 3, 60, frame, 0.1); fr.location = (-18, 0.5, 0)
    for i in range(30):
        e = bpy.data.materials.new(f'g{i}'); e.use_nodes = True; nn = e.node_tree.nodes; bs = nn.get('Principled BSDF'); bs.inputs['Base Color'].default_value = (0, 0, 0, 1)
        c = random.choice(((1.0, 0.7, 0.3), (0.5, 0.7, 1.0), (1.0, 0.4, 0.3), (1.0, 0.95, 0.8))); bs.inputs['Emission Color'].default_value = (*c, 1); bs.inputs['Emission Strength'].default_value = random.uniform(5, 22)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=random.uniform(1.5, 4.0), location=(random.uniform(-110, 110), random.uniform(110, 200), random.uniform(-30, 50)), segments=24, ring_count=12); sp = bpy.context.active_object; sp.data.materials.append(e)
    tg = empty((0, 0, 0))
    area('key', (-20, -36, 14), tg, 24, 26000, (1.0, 0.95, 0.9), sy=18); area('rim', (30, -22, 8), tg, 16, 14000, (0.7, 0.85, 1.0))
    camera((13, -46, 5), tg, 90, 2.2); render(out, RX, RY, SAMPLES)
print('rendered', out)
