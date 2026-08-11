# Matter — sitio web

Sitio de una empresa de casas inteligentes: levantamiento en sitio, diseño e
instalación.

El recorrido principal es una casa de dos plantas en 3D que se abre conforme
haces scroll: llega un coche y el asistente abre el portón, la casa se parte
en dos niveles en el aire, se recorre espacio por espacio — garage, recibidor,
sala, cocina, medio baño, recámara, baño principal, estudio y balcón — y al
final se enciende la malla Thread que hay debajo de todo.

En cada espacio hay dos formas de tocar la casa: el **centro de control**
(escenas, brillo, tono, persianas) y el **asistente por voz**, que ejecuta la
frase de verdad sobre la escena 3D.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Cómo está armado

| Capa | Qué usa |
| --- | --- |
| Base | Vite 8 + React 19 |
| 3D | three.js + react-three-fiber + drei + postprocessing |
| Estilos | Tailwind v4 (tokens en `src/index.css`) |
| Scroll | Lenis |
| Estado | Zustand |

La casa es geometría procedural con texturas PBR dibujadas en canvas, y el
mapa de entorno se arma con lightformers — sin HDRIs de CDN. Los únicos
assets externos son unos modelos CC0 de plantas y cerámica (ver abajo).

## Estructura

```
src/
├─ content/site.js      ← copy de la página de marketing
├─ content/tour.js      ← capítulos, controles por cuarto y comandos de voz
├─ store/store.js      ← estado; `scrollState` es mutable a propósito
├─ scene/
│  ├─ layout.js         ← planta de los dos niveles y sus cuartos
│  ├─ chapters.js       ← coreografía de cámara, un keyframe por capítulo
│  ├─ fixtures.jsx      ← baños, escalera, barandales, portón
│  ├─ actors.jsx        ← coche, perro y alimentador (lo que se mueve solo)
│  ├─ materials.js      ← materiales y geometrías compartidas
│  ├─ props.jsx         ← mobiliario procedural (cajas y cilindros)
│  ├─ House.jsx         ← envolvente, muros, corte, piso, jardín
│  ├─ Rooms.jsx         ← qué mueble va en qué cuarto
│  ├─ devices.js        ← dispositivos: alimentan hotspots Y nodos de la malla
│  ├─ MeshNetwork.jsx   ← la malla Thread animada
│  ├─ Hotspots.jsx      ← etiquetas HTML sobre la escena
│  ├─ home.js          ← puente centro de control ⇄ luces (rampas)
│  ├─ Hubs.jsx         ← hardware que cambia según el ecosistema
│  ├─ textures.js      ← texturas PBR dibujadas en canvas
│  ├─ Model.jsx        ← carga glTF con fallback procedural
│  └─ Experience.jsx   ← canvas, luces, cámara, postproceso
└─ ui/
   ├─ ControlCenter.jsx ← escenas, sliders y selector de cerebro
   ├─ Assistant.jsx     ← botón de voz con el orbe de cada marca
   ├─ Logo.jsx          ← logo con la corriente animada
   └─ …                 ← hero, recorrido y secciones de la página
```

## Decisiones que conviene conocer antes de tocar el código

**El scroll no pasa por React.** `scrollState` en `store/store.js` es un objeto
mutable normal. El render loop de three lo lee cada frame. Solo el índice de
capítulo (que cambia ocho veces en toda la página) vive en el store reactivo.
Si metes el progreso del scroll en `useState`, el sitio se cae a 20 fps.

**El corte de la casa es direccional.** Cada muro perimetral se desvanece solo
cuando la cámara queda de su lado de afuera (`PerimeterWall` en `House.jsx`).
Por eso siempre quedan dos muros de fondo: son los que hacen que un cuarto se
lea como cuarto y no como muebles flotando.

**Una sola lista de dispositivos.** `scene/devices.js` alimenta los hotspots y
los nodos de la malla. Agregar un dispositivo ahí lo hace aparecer en las dos.
Las aristas de la malla se calculan (cada nodo se cuelga de los enrutadores más
cercanos), no están escritas a mano.

**Calidad degradada.** En móvil, punteros gruesos, `prefers-reduced-motion` o
equipos con pocos núcleos se apagan postproceso, sombras y mapa de entorno, y
se baja el DPR. Ver `detectQuality()` en `App.jsx`.

**El canvas deja de renderizar** cuando el recorrido sale de pantalla
(`frameloop="never"`). Las secciones de abajo son HTML puro.

**El centro de control no habla con la escena por React.** El store guarda lo
que el usuario pidió; `scene/home.js` lo interpola cada frame hacia lo que la
escena muestra. Esa rampa importa: un foco real sube, no salta, y esa media
segunda de transición es lo que hace que la demo se sienta como una casa.
Cada luminaria se engancha con `useDimmed(cuarto, …)` y no se suscribe al
store, así que mover un slider no re-renderiza nada de React.

**Los dos niveles se resuelven con un escalar, no con dos escenas.** Cada
keyframe trae `up` (0 = planta alta oculta) y `lift` (0 = pisos apilados,
1 = axonometría explotada). Para ver un cuarto de abajo la losa de arriba
estorba, así que desaparece; en el capítulo del corte los dos pisos se separan
en el aire. Todo lo de planta alta —cuartos, muros, hubs— vive dentro del
mismo grupo, que es lo que hace que baste con mover ese grupo.

**El asistente ejecuta, no simula.** `content/tour.js` liga cada capítulo con
una acción; `ui/Assistant.jsx` la corre contra el mismo store que usa el
centro de control. Por eso "Oye Siri, pon una película" y el botón "Cine"
hacen exactamente lo mismo — no hay dos caminos que mantener.

**El paneo de cámara depende del capítulo.** En los cuartos (3–6) la banda
derecha la ocupa el centro de control, así que el encuadre se centra entre los
dos paneles en vez de empujar la casa a la derecha. La interpolación es
continua (`panelled` en `Experience.jsx`) para que no brinque.

## Cambiar el contenido

Casi todo está en `src/content/site.js`: capítulos del recorrido, protocolos,
ecosistemas, proceso, paquetes, preguntas y datos de contacto. Los capítulos
del recorrido tienen que empatar en orden y cantidad con `KEYFRAMES` en
`src/scene/chapters.js` — si agregas un capítulo, agrega su posición de cámara.

## Modelos 3D

```bash
npm run models          # baja los CC0 de Poly Haven a public/models/
npm run models -- --list sofa   # busca qué más hay
```

`public/models/` está en `.gitignore`. Si falta, **no pasa nada**: cada modelo
se pide con `<Model name="…" fallback={<VersiónProcedural/>} />`, que cubre
tanto "todavía está bajando" como "no existe" con la misma geometría propia.

### Por qué los muebles NO son modelos

Se probó y se descartó. El catálogo de muebles CC0 de Poly Haven es casi todo
antiguo: sofás franceses tallados, mesas de centro turquesa envejecidas,
burós ornamentados. Fotorrealistas, sí, pero chocan de frente con la estética
oscura y moderna del sitio — el resultado se veía peor que las cajas.

Los modelos se usan solo para **plantas y cerámica**, que no tienen "estilo"
y sí suman detalle real.

Para muebles modernos fotorrealistas las opciones reales son:

| Fuente | Licencia | Nota |
| --- | --- | --- |
| [Poly Haven](https://polyhaven.com/models) | CC0 | Gratis, pero mobiliario antiguo |
| [Sketchfab](https://sketchfab.com/3d-models?features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b) | CC0 / CC-BY | Hay mobiliario moderno; calidad dispareja, hay que curar |
| [Quaternius](https://quaternius.com/) | CC0 | Low poly estilizado, coherente entre sí |
| [3D Sky](https://3dsky.org/) / [Design Connected](https://designconnected.com/) | De paga | Es lo que usan los estudios de arquitectura |

Si consigues modelos, el contrato es: **origen en el centro de la base,
mirando a +Z, en metros**. Se meten en `public/models/<nombre>/<nombre>.gltf`
y se llaman igual que las plantas — sin tocar `Rooms.jsx` más que la línea del
mueble. Exporta en `.glb` con meshopt y texturas de 1k–2k; arriba de eso el
sitio empieza a pesar de más para lo que se ve en pantalla.

## Pendientes conocidos

- El formulario de contacto no tiene backend: arma el mensaje y lo abre en
  WhatsApp. Si se quiere captura de leads, hay que conectar un endpoint en
  `ui/Contact.jsx`.
- Teléfono, correo y número de WhatsApp en `content/site.js` son de relleno.
- Los números de prueba social (`proof`) y los precios son supuestos; hay que
  validarlos antes de publicar.
- Falta metadata de Open Graph con imagen, `sitemap.xml` y `robots.txt`.
- El centro de control solo existe en los capítulos de cuarto (3–10). Los de
  exterior, corte y red no tienen controles porque no hay nada que encender.
- El recorrido son 12 capítulos: la sección de la casa mide 1200 vh. Es largo
  a propósito, pero si se siente pesado se recortan capítulos quitando su
  entrada en `content/tour.js` y su keyframe en `scene/chapters.js`.
- El perro y el coche son geometría procedural simple. Si algún día se quiere
  un perro creíble, ahí sí conviene un modelo con esqueleto y animación.
- En móvil el 3D se lleva ~35% de la pantalla: el resto es el panel de texto y
  el control. Es una decisión, no un bug — en un teléfono el copy vende más
  que el render.

## Panel de operaciones · `#/admin`

Herramienta interna, **sin autenticación todavía**. Dos secciones:

- **Levantamiento** — cliente con sus datos fiscales, la propiedad, las
  habitaciones con sus metros y notas de obra, el diagnóstico de red y el
  resumen de costos en vivo. De aquí sale la cotización.
- **Catálogo** — 88 productos filtrables por etiqueta. El `+` los mete al
  cuarto activo del levantamiento, no a una lista aparte.

El botón *Generar cotización web* abre `#/cotizacion?d=<payload>`: el
levantamiento va **codificado dentro del propio enlace** (~800 caracteres),
así que se manda por WhatsApp y abre en cualquier dispositivo sin servidor.
Cuando haya backend, se cambia por un folio corto.

### Costos

`src/content/pricing.js` es la única fuente. La mano de obra sale del tiempo
de cuadrilla por tipo de pieza (`LABOR_TIERS`), no de un porcentaje sobre el
equipo; el nivel de cada dispositivo se infiere de su categoría y de cómo se
alimenta. Todas las tarifas están para editarse.

### Sobre la factura

Lo que genera el sitio es una **cotización con todos los campos que pide un
CFDI 4.0** listos: RFC, razón social y régimen de las dos partes, C.P. fiscal,
uso del CFDI, forma y método de pago, clave del SAT y unidad por partida, IVA
desglosado y total con letra. **No es un CFDI**: eso solo existe cuando un PAC
lo timbra y le pone UUID, sello y cadena original. Falta contratar el PAC y
sustituir los datos del emisor por los de la Constancia de Situación Fiscal.

## Assets de Blender

```bash
npm run assets                    # genera todas las piezas
npm run assets -- -- sofa         # solo una
```

`blender/build_assets.py` construye el mobiliario con bisel y subdivisión y
lo exporta a `public/models/`. Es donde conviene modelar lo que en three.js
solo salen cajas: cojines, cantos que atrapan reflejo, curvas.

Convención: origen en el centro de la base, frente hacia -Y en Blender (el
exportador lo convierte a +Z en glTF), metros reales. Si una pieza falta, la
escena usa su versión procedural — nada se rompe.

## Publicar

### GitHub Pages

`.github/workflows/deploy.yml` compila y publica en cada push a `main`.
No hay que hacer nada más que activar Pages una vez:

**Settings → Pages → Source: GitHub Actions**

El sitio queda en `https://<usuario>.github.io/Matter/`.

Dos cosas que el workflow hace y conviene entender:

- `BASE_PATH=/Matter/` — en Pages el sitio no cuelga de la raíz del dominio.
  Todo lo que se pide en tiempo de ejecución usa `import.meta.env.BASE_URL`;
  si algún día agregas un `fetch` a un archivo de `public/`, acuérdate.
- `VITE_ADMIN=off` — el panel de operaciones **no se compila**. El import
  queda en una rama muerta y el bundler ni emite el chunk. No es una
  contraseña que se pueda saltar: es código que nunca viajó.

La página de cotización **sí** se publica: es lo que se le manda al cliente,
y va autocontenida (las partidas viajan resueltas dentro del enlace, sin el
catálogo ni el modelo de costos detrás).

### Otro host (Railway, Vercel, un VPS)

```bash
BASE_PATH=/ VITE_ADMIN=on npm run build   # dist/ es estático puro
```

Ahí sí conviene dejar el panel encendido y ponerle autenticación de verdad
delante — con un host propio ya hay dónde ponerla.

### Sobre el repositorio

Está en **privado** a propósito. Aunque el panel no se compila, el código
fuente sí incluye `src/content/pricing.js` con tarifas de mano de obra y
márgenes, y `src/content/catalog.js` con canales de proveedor. En un repo
público eso es legible por cualquiera.

GitHub Pages desde un repo privado requiere plan Pro. Si prefieres el plan
gratuito, hay que hacerlo público — y antes de eso conviene sacar los
números a un archivo que no se versione.

## Créditos

Modelos de plantas y cerámica: [Poly Haven](https://polyhaven.com) (CC0).
