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
npm run dev      # http://localhost:5173 — sitio, panel y sincronización
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
├─ content/catalog.js   ← catálogo público: ficha, precio y para qué sirve
├─ content/opsCatalog.js ← nota del instalador, canal y proveedores (interno)
├─ content/photos.js    ← manifiesto de fotos — lo genera `npm run photos`
├─ sync/eventos.js      ← el modelo de cambios; lo corren navegador Y servidor
├─ store/survey.js      ← proyectos y levantamiento, sobre el registro
├─ store/conexion.js    ← el WebSocket, con cola y reconexión
├─ store/store.js      ← estado; `scrollState` es mutable a propósito
├─ ui/Catalogo.jsx      ← catálogo para clientes · `#/catalogo`
├─ ui/catalog/          ← galería, ficha y foto; se comparten cliente ⇄ ops
├─ ui/admin/            ← panel de operaciones (incluye Historial.jsx)
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

```
server/
├─ index.js      ← arranque: carga el registro y abre el puerto
├─ app.js        ← rutas HTTP y login (Vite la monta igual en desarrollo)
├─ auth.js       ← usuarios, scrypt y cookie de sesión firmada
├─ sync.js       ← WebSocket: reparte los cambios entre socios
├─ registro.js   ← el registro de eventos en disco
├─ socios.js     ← quiénes somos
└─ seed.js       ← los ocho proyectos iniciales
```

## Panel de operaciones · `#/admin`

Herramienta interna, detrás del login que sirve `server/index.js`. Cuatro
secciones, en el orden en que se trabaja:

- **Proyectos** — la puerta. Un levantamiento pertenece a un proyecto, y sin
  proyecto abierto la sección de levantamiento no deja entrar. No es rigor
  burocrático: antes había un solo levantamiento suelto en localStorage, así
  que levantar otra casa significaba pisar el anterior.
- **Levantamiento** — habitaciones con sus metros y notas de obra, la
  propiedad, el diagnóstico de red, el cliente con sus datos fiscales y el
  resumen de costos en vivo. Cada cuarto trae su propio **+ Agregar equipo**,
  que abre el catálogo ya apuntado a ese cuarto: se captura caminando la casa,
  no saltando entre pestañas.
- **Catálogo** — 91 productos en galería con foto, o en tabla si lo que se
  quiere es comparar precios. El `+` los mete al cuarto activo, no a una lista
  aparte. La ficha trae la nota de instalación y a qué proveedor llamarle.
- **Proveedores** — Amazon, MercadoLibre, Unit Electronics y AG Electrónica,
  con sus tiempos, sus advertencias y qué parte del catálogo cubre cada uno.

Cada tarjeta del levantamiento lleva colgado el historial de SU sección, y al
final está el del proyecto completo, filtrable por sección y por socio.

El botón *Generar cotización web* abre `#/cotizacion?d=<payload>`: el
levantamiento va **codificado dentro del propio enlace** (~800 caracteres),
así que se manda por WhatsApp y abre en cualquier dispositivo sin servidor.
Cuando haya backend, se cambia por un folio corto.

### Cómo se sincronizan los socios

Los proyectos **no viven en el navegador**: viven en el servidor, y cada panel
abierto mantiene un WebSocket contra él. Cuando alguien cambia algo, el cambio
viaja, el servidor le pone autor y hora, y lo reparte a los demás. No hay botón
de guardar.

La pieza que hace que todo esto sea simple: **no se sincroniza el estado, se
sincronizan los cambios**. Cada cosa que alguien toca es un evento —`src/sync/eventos.js`,
el único módulo que corren igual el navegador y Node— y el estado de un
proyecto es lo que queda de aplicarlos en orden.

De ahí salen tres cosas sin trabajo extra:

- **El historial no hay que escribirlo.** Es la misma lista con la que se arma
  el estado, así que no puede quedarse incompleto ni desfasado. El texto de
  cada cambio se redacta al leerlo, no se guarda: un evento de marzo se sigue
  describiendo bien aunque hoy cambiemos la redacción.
- **Las fechas tampoco.** "Creado" es el primer evento y "último cambio" es el
  último; no hay un campo que actualizar y que algún día se olvide.
- **Se puede trabajar sin señal.** Lo que no alcanza a salir se forma en cola y
  sale al reconectar. Todos los eventos son idempotentes a propósito —las
  cantidades viajan absolutas, no como incrementos— así que reenviar la cola no
  descuadra nada aunque el evento ya hubiera llegado.

El autor lo pone **el servidor**, a partir de la sesión, nunca el cliente. Si
el navegador pudiera declarar su propio nombre el historial no probaría nada.

Quién es quién está en `server/socios.js`, un renglón por socio. El id tiene
que coincidir con `PANEL_USERS`.

### El registro

`DATA_DIR/eventos.jsonl` — un renglón por cambio, se escribe agregando al
final y nunca se reescribe. Se puede leer con `cat` y entender:

```bash
railway volume files list /            # qué hay en el disco
tail -3 .data/eventos.jsonl | jq .     # en local
```

Son dos socios y unos miles de eventos: un archivo que se entiende a simple
vista vale más aquí que un motor con migraciones. Cuando crezca, se reemplaza
`server/registro.js` dejando la misma interfaz — nada más lo toca.

⚠️ **DATA_DIR tiene que apuntar a un disco que sobreviva al reinicio.** En
Railway eso es un Volume; sin él el contenedor se borra en cada despliegue y
con él todos los proyectos. Ya está montado en `/data` y `DATA_DIR=/data`. Si
la variable falta, el servidor lo avisa al arrancar.

### Los ocho proyectos iniciales

`server/seed.js` siembra ocho levantamientos —casas, departamentos y oficinas,
en distintos puntos del proceso— la primera vez que el registro está vacío. No
son maquetas: son tiras de eventos fechados en el pasado y repartidos entre los
dos socios, para que el historial tenga desde el primer día algo real que
mirar. En cuanto haya un cambio de verdad, no se vuelven a tocar.

### Fotos del catálogo

```bash
npm run photos            # solo los que faltan
npm run photos -- --all   # vuelve a bajar todo
npm run photos -- hue-a19 # uno o varios por id
```

Hoy: **62 de 91 productos con foto**, ~1 MB en `public/catalogo/`. Los 29
restantes se pintan con un mosaico procedural de su categoría.

Amazon y MercadoLibre quedaron descartados como fuente: los dos bloquean la
descarga automática (403 / "tráfico sospechoso") y la API de MercadoLibre ya
pide credenciales. Las fotos salen de tres lugares públicos —el catálogo
Shopify del fabricante, su CDN cuando no usa Shopify, y Wikimedia Commons para
la marca grande— y el crédito queda guardado en `content/photos.js`, porque
parte del material de Commons pide atribución y la ficha la muestra.

Lo que no se encontró **no se rellena con una foto parecida**: en un catálogo
que se usa para comprar, la foto de otro modelo es peor que un hueco. Los
casos revisados a mano y descartados están anotados con su motivo en el mapa
`FUENTES` del script, así que la siguiente corrida no los vuelve a intentar.
Para llenar uno basta cambiar su entrada por `{ url: '…' }`.

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

### Railway (con panel y login)

```bash
npm run build:all    # dist/ público + dist-admin/ panel
npm start            # servidor Express
```

Son **dos compilaciones separadas** a propósito:

| Salida | Ruta | Contenido |
| --- | --- | --- |
| `dist/` | `/` | Sitio público, `VITE_ADMIN=off` |
| `dist-admin/` | `/panel` | Panel completo, detrás de login |

Si fuera una sola, el chunk del panel viviría en `/assets/` y cualquiera
podría pedirlo por su URL con el catálogo y las tarifas dentro. Al vivir en
otra carpeta, el middleware de sesión sí lo cubre. Comprobado: sin cookie,
ese archivo responde 302.

El login tiene que ser del lado del servidor porque el ruteo del sitio es
por hash (`#/admin`) y **el hash nunca llega al servidor** — por eso el
panel cuelga de una ruta real.

Variables en Railway:

```
PANEL_USERS=margay:scrypt$sal$hash,carpio:scrypt$sal$hash
SESSION_SECRET=<64 hex>
NODE_ENV=production
DATA_DIR=/data          # el Volume; sin esto se pierden los proyectos
```

Para agregar o cambiar a alguien:

```bash
npm run hash-password -- nombre     # pide la contraseña sin mostrarla
```

Las contraseñas se guardan con scrypt y sal por usuario; la sesión es una
cookie firmada con HMAC que dura 12 horas. Nunca hay contraseñas en claro ni
en el repo ni en las variables.

### Sobre el repositorio

Está en **privado** a propósito. Aunque el panel no se compila, el código
fuente sí incluye `src/content/pricing.js` con tarifas de mano de obra y
`src/content/opsCatalog.js` con canales de proveedor y notas internas. En un
repo público eso es legible por cualquiera.

En el **bundle** sí están separados: el catálogo para clientes solo importa
`content/catalog.js`, así que ni las notas de instalación ni los proveedores
ni las tarifas viajan al navegador de nadie. Se puede comprobar:

```bash
VITE_ADMIN=off npx vite build --outDir dist-pub
grep -rl "uelectronics\|LABOR_TIERS" dist-pub/assets/   # no debe dar nada
```

GitHub Pages desde un repo privado requiere plan Pro. Si prefieres el plan
gratuito, hay que hacerlo público — y antes de eso conviene sacar los
números a un archivo que no se versione.

## Rendimiento

Medido, no adivinado — si vuelve a ponerse lento, mide antes de tocar nada.
El estado al que hay que volver: **~440 ms de bloqueo del hilo principal y
70+ fps**. Lo que lo rompió una vez y puede volver a romperlo:

1. **Luces.** Cada `pointLight` encarece el shader de *todos* los materiales
   de la escena. Se llegó a 30 y el sitio se fue a 40 fps. El techo son
   ~18: una luminaria decorativa debe brillar por emisivo + bloom, no con
   luz real.
2. **Compilación de shaders síncrona.** `<Preload all />` de drei llama a
   `gl.compile()` y congelaba la página 2.4 s de un golpe. Se usa
   `compileAsync()` (ver `Precompile` en `Experience.jsx`). No lo cambies de
   vuelta.
3. **Mallas repetidas.** Barandales, escalera y celosía van por
   `InstancedMesh` con el helper `Repeat` de `props.jsx`. Un barandal de 7 m
   son ~50 balaustres; sueltos son 50 llamadas de dibujo.
4. **Texturas de los modelos.** Poly Haven las trae a 1k. Después de
   `npm run models` conviene bajarlas:
   ```bash
   for f in public/models/*/textures/*.jpg; do sips -Z 512 -s format jpeg -s formatOptions 78 "$f" --out "$f"; done
   ```
   De 2.4 MB a 483 KB sin diferencia visible.

Las texturas procedurales de `textures.js` cuestan 44 ms en total: no son el
problema, no las optimices por instinto.

## Créditos

Modelos de plantas y cerámica: [Poly Haven](https://polyhaven.com) (CC0).
