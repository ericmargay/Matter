"""
Genera mobiliario en Blender y lo exporta a public/models/.

    npm run assets          # o:
    /Applications/Blender.app/Contents/MacOS/Blender --background \
        --python blender/build_assets.py

Por qué Blender y no más three.js: lo que hace que un mueble deje de verse
como una caja es el bisel y la subdivisión — cantos que atrapan un reflejo y
cojines que no tienen esquinas de 90°. Eso en three.js se escribe a mano
vértice por vértice; aquí son dos modificadores.

Convención de salida, la misma que ya usa la escena:
  · origen en el CENTRO DE LA BASE
  · el frente mira a -Y en Blender, que el exportador convierte a +Z en glTF
  · metros reales
"""

import math
import os
import sys

import bpy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "models")


# ── utilidades ────────────────────────────────────────────────────

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, color, roughness=0.7, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def box(name, size, loc, mat, bevel=0.015, segments=3, subsurf=0):
    """Caja con canto biselado. El bisel es el 90% del realismo."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = size
    # aplicar escala antes de biselar: si no, el bisel sale deforme
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    if bevel > 0:
        m = o.modifiers.new("Bevel", "BEVEL")
        m.width = bevel
        m.segments = segments
        m.limit_method = "ANGLE"
        m.angle_limit = math.radians(30)

    if subsurf:
        s = o.modifiers.new("Subsurf", "SUBSURF")
        s.levels = subsurf
        s.render_levels = subsurf
        bpy.ops.object.shade_smooth()

    o.data.materials.append(mat)
    return o


def cyl(name, radius, height, loc, mat, verts=24, bevel=0.006):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=height, location=loc, vertices=verts)
    o = bpy.context.object
    o.name = name
    if bevel > 0:
        m = o.modifiers.new("Bevel", "BEVEL")
        m.width = bevel
        m.segments = 2
        m.limit_method = "ANGLE"
        m.angle_limit = math.radians(40)
    bpy.ops.object.shade_auto_smooth(angle=math.radians(35))
    o.data.materials.append(mat)
    return o


def export(name):
    """Exporta la escena completa a public/models/<name>/<name>.gltf."""
    folder = os.path.join(OUT, name)
    os.makedirs(folder, exist_ok=True)

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(folder, name),
        export_format="GLTF_SEPARATE",
        export_apply=True,          # hornea los modificadores
        use_selection=True,
        export_yup=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
    )
    print(f"  ✓ {name}")


# ── piezas ────────────────────────────────────────────────────────

def sofa():
    """Sofá de tres plazas, línea baja. Cojines con subdivisión."""
    reset()
    tela = material("Tela", (0.20, 0.23, 0.33), roughness=0.95)
    madera = material("Madera", (0.36, 0.22, 0.13), roughness=0.55)
    metal = material("Metal", (0.72, 0.55, 0.34), roughness=0.28, metallic=0.9)

    W, D = 2.30, 0.92

    box("base", (W, D, 0.30), (0, 0, 0.30), tela, bevel=0.03, segments=4)
    box("respaldo", (W, 0.22, 0.62), (0, -D / 2 + 0.11, 0.63), tela, bevel=0.05, segments=4, subsurf=1)

    for s in (-1, 1):
        box(f"brazo{s}", (0.20, D, 0.30), (s * (W - 0.20) / 2, 0, 0.62), tela, bevel=0.06, segments=4, subsurf=1)

    # tres cojines de asiento con holgura entre ellos: la separación es lo que
    # hace que se lean como cojines y no como una tapa
    cw = (W - 0.44) / 3
    for i in range(3):
        x = -(W - 0.44) / 2 + cw / 2 + i * cw
        box(f"cojin{i}", (cw - 0.03, D - 0.16, 0.17), (x, 0.04, 0.53), tela, bevel=0.07, segments=4, subsurf=1)

    for i in range(2):
        x = -0.5 + i * 1.0
        box(f"almohada{i}", (0.44, 0.14, 0.40), (x, -D / 2 + 0.22, 0.80), tela, bevel=0.06, segments=3, subsurf=1)

    box("faldon", (W - 0.06, D - 0.06, 0.05), (0, 0, 0.13), madera, bevel=0.01)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(f"pata{sx}{sy}", 0.022, 0.15, (sx * (W - 0.34) / 2, sy * (D - 0.28) / 2, 0.075), metal)

    export("sofa")


def butaca():
    """Sillón individual con patas abiertas."""
    reset()
    tela = material("Tela", (0.44, 0.40, 0.34), roughness=0.95)
    madera = material("Madera", (0.32, 0.20, 0.12), roughness=0.5)

    box("asiento", (0.72, 0.70, 0.16), (0, 0, 0.44), tela, bevel=0.06, segments=4, subsurf=1)
    box("respaldo", (0.72, 0.16, 0.52), (0, -0.30, 0.72), tela, bevel=0.07, segments=4, subsurf=1)
    for s in (-1, 1):
        box(f"brazo{s}", (0.11, 0.62, 0.13), (s * 0.31, 0.02, 0.60), tela, bevel=0.05, segments=3, subsurf=1)

    # patas inclinadas: la diagonal es lo que quita el aire de cubo
    for sx in (-1, 1):
        for sy in (-1, 1):
            bpy.ops.mesh.primitive_cylinder_add(
                radius=0.021, depth=0.40, location=(sx * 0.28, sy * 0.26, 0.19), vertices=16
            )
            o = bpy.context.object
            o.rotation_euler = (math.radians(sy * 7), math.radians(-sx * 7), 0)
            bpy.ops.object.shade_auto_smooth(angle=math.radians(35))
            o.data.materials.append(madera)

    export("butaca")


def mesa_centro():
    """Mesa de centro ovalada con cubierta biselada."""
    reset()
    madera = material("Madera", (0.42, 0.27, 0.16), roughness=0.45)
    metal = material("Metal", (0.16, 0.16, 0.18), roughness=0.35, metallic=0.85)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=0.05, location=(0, 0, 0.40), vertices=48)
    top = bpy.context.object
    top.name = "cubierta"
    top.scale = (1.0, 0.62, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    m = top.modifiers.new("Bevel", "BEVEL")
    m.width = 0.012
    m.segments = 4
    m.limit_method = "ANGLE"
    m.angle_limit = math.radians(40)
    bpy.ops.object.shade_auto_smooth(angle=math.radians(35))
    top.data.materials.append(madera)

    for sx in (-1, 1):
        cyl(f"arco{sx}", 0.016, 0.38, (sx * 0.34, 0, 0.19), metal, verts=14)
        box(f"travesano{sx}", (0.03, 0.44, 0.03), (sx * 0.34, 0, 0.03), metal, bevel=0.006)
    box("union", (0.68, 0.03, 0.03), (0, 0, 0.30), metal, bevel=0.006)

    export("mesa-centro")


def lampara_colgante():
    """Colgante de cúpula: geometría curva, no un cono de 18 lados."""
    reset()
    esmalte = material("Esmalte", (0.09, 0.08, 0.07), roughness=0.35)
    laton = material("Laton", (0.74, 0.56, 0.32), roughness=0.25, metallic=0.95)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.20, location=(0, 0, 0.20), segments=32, ring_count=16)
    dome = bpy.context.object
    dome.name = "cupula"
    # cortar la mitad inferior para dejar la cúpula
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for v in dome.data.vertices:
        if v.co.z < 0:
            v.select = True
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")

    sol = dome.modifiers.new("Solidify", "SOLIDIFY")
    sol.thickness = 0.008
    bpy.ops.object.shade_auto_smooth(angle=math.radians(40))
    dome.data.materials.append(esmalte)

    cyl("copa", 0.03, 0.05, (0, 0, 0.235), laton, verts=16)
    cyl("cable", 0.004, 0.9, (0, 0, 0.71), laton, verts=8, bevel=0)

    export("lampara-colgante")


PIEZAS = {
    "sofa": sofa,
    "butaca": butaca,
    "mesa-centro": mesa_centro,
    "lampara-colgante": lampara_colgante,
}


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    objetivo = args or list(PIEZAS)

    print(f"\nGenerando en {OUT}\n")
    for nombre in objetivo:
        fn = PIEZAS.get(nombre)
        if not fn:
            print(f"  · {nombre}: no existe esa pieza")
            continue
        fn()
    print("\nListo. Recarga el sitio: la escena las toma sin tocar código.\n")
