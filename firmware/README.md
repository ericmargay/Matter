# Firmware — dispositivos Matter propios

Cuatro dispositivos Matter sobre **UNIT Pulsar ESP32-C6**, para Arduino IDE.
Sirven en Apple Home, Google Home y Alexa sin puente ni app de fabricante.

| Sketch | Se anuncia como | Hardware que necesita |
| --- | --- | --- |
| **`matter_luz_placa`** | Extended Color Light | **Nada — solo el USB** ← empieza por aquí |
| `matter_luz_color` | Extended Color Light | Módulo WS2812B de 8 LEDs |
| `matter_sensor_ocupacion` | Occupancy Sensor | Nada (botón) · PIR opcional |
| `matter_interruptor` | On/Off Plug-in Unit | Nada (LED) · relevador opcional |

Los cuatro **compilan verificado** contra el core 3.3.7 para `esp32c6`:
~2.6 MB de aplicación, 83–84 % de la partición Huge APP.

**Tres de los cuatro no necesitan que sueldes nada.** `matter_luz_placa` usa el
LED direccionable que la placa ya trae, así que sirve para responder primero la
pregunta que importa —¿entra a Apple, a Google, a Alexa?— sin que un cable
flojo enturbie el diagnóstico. Cuando funcione, `matter_luz_color` es el mismo
código apuntando al módulo de 8 LEDs.

---

## Lo primero: Thread y Zigbee, en corto

El ESP32-C6 tiene los dos radios y los dos protocolos existen. Lo que decide
qué se puede hacer hoy no es el chip, es la caja de herramientas:

| Camino | ¿Arduino IDE? | Apple | Google | Alexa |
| --- | --- | --- | --- | --- |
| **Matter sobre Wi-Fi** | **sí** | sí | sí | sí |
| Matter sobre Thread | no — necesita ESP-IDF | sí | sí | sí |
| Zigbee | sí | **no** | **no** | solo con Echo con hub |

**Matter sobre Thread no se compila desde el Arduino IDE.** La librería Matter
viene precompilada con `CONFIG_ENABLE_WIFI_STATION=y`; para que hable Thread
hay que recompilar el stack con Arduino como componente de ESP-IDF y `idf.py`.
El ejemplo oficial de Espressif lo dice sin rodeos: *"This is an Arduino as IDF
Project"*.

**Zigbee sí corre en Arduino IDE**, pero Apple y Google no lo hablan. Para una
casa con los tres ecosistemas, Zigbee obliga a poner un puente — justo lo que
estos dispositivos vienen a evitar.

Por eso estos cuatro van sobre **Matter/Wi-Fi**. La lógica de cada dispositivo
no cambia cuando pasemos a Thread: lo que cambia es cómo se compila.

> **Un radio, un protocolo.** Thread y Zigbee usan el mismo 802.15.4. Un
> dispositivo es una cosa **o** la otra, decidido al compilar. No existe el
> firmware que sea las dos al mismo tiempo.

### Cuándo vale la pena pasar a Thread

Wi-Fi está bien para probar y para lo que se enchufa. Para lo que va con pila
—sensores, contactos— Thread es otra liga: un sensor que en Wi-Fi dura seis
semanas, en Thread dura dos años, y cada dispositivo enchufado repite la malla.

Ya tienes con qué: el Apple TV 4K, el HomePod mini, el Echo (4.ª gen o Show) y
el Nest Hub son border routers. Cuando quieras, monto el proyecto en ESP-IDF.

---

## Puesta en marcha

### 1 · Core de Espressif

Arduino IDE → *Preferencias* → *URLs adicionales*:

```
https://espressif.github.io/arduino-esp32/package_esp32_index.json
```

*Gestor de tarjetas* → **esp32 by Espressif** ≥ 3.1. Tú ya tienes **3.3.7**,
que trae `Matter` y `Zigbee` incluidas: no hay que instalar librería de Matter.

### 2 · Librería

*Gestor de librerías* → **Adafruit NeoPixel**. Es la única que hace falta.

### 3 · Opciones de la tarjeta ← donde se atora todo el mundo

| Opción | Valor | Por qué |
| --- | --- | --- |
| Board | **ESP32C6 Dev Module** | El Pulsar no trae definición propia; esta le queda |
| **Partition Scheme** | **Huge APP (3MB No OTA/1MB SPIFFS)** | Matter pesa 2.6 MB. En la partición normal **no cabe** y el error no dice por qué |
| **Erase All Flash** | **Enabled** la primera vez | Restos de un emparejamiento viejo hacen que no aparezca en la app |
| USB CDC On Boot | **Enabled** | Sin esto el Monitor Serie no muestra el código de vinculación |
| Flash Size | 4MB | Lo que trae el Pulsar |

### 4 · Subir y emparejar

Monitor Serie a **115200**. Al arrancar sin emparejar imprime:

```
Sin emparejar todavía.
Código manual: 34970112332
QR:            https://project-chip.github.io/connectedhomeip/qrcode.html?data=...
```

Abre esa URL, y en Apple Home / Google Home / Alexa: **agregar accesorio →
Matter →** escanear el QR.

**No hay que escribir el Wi-Fi en el código.** El core trae
`CONFIG_ENABLE_CHIPOBLE=y`: el dispositivo se anuncia por Bluetooth y el hub le
pasa la red al emparejarlo. Los bloques con `ssid`/`password` en los sketches
son un respaldo para cores que no traigan BLE; en el 3.3.7 no se compilan.

Para pasar un dispositivo a otra casa: **botón BOOT 5 segundos**.

---

## Pines del Pulsar C6

El Pulsar usa la huella de Arduino Nano, así que la serigrafía **no** es el
número de GPIO. Del manual del fabricante:

| Serigrafía | GPIO | Aquí se usa para |
| --- | --- | --- |
| D6 | **20** | Datos del módulo de 8 LEDs |
| D5 | **19** | Salida del PIR |
| D9 | **13** | Entrada del relevador |
| — | **8** | WS2812 de la placa: testigo de estado, o LA luz en `matter_luz_placa` |
| — | **9** | Botón BOOT |
| D13 | 6 | LED simple de la placa |
| A4 / A5 | 22 / 23 | I²C del conector QWIIC |

**Pines que no hay que usar para nada externo:** GPIO **4, 5, 8, 9, 15**. Son
de arranque (*strapping*): si alguno está forzado en el instante del reset, la
placa puede no arrancar o quedarse en modo de descarga. Por eso las salidas
están en 20, 19 y 13 y no en los primeros pines libres.

### El testigo de la placa

| Color | Significa |
| --- | --- |
| Ámbar | Arrancando |
| Azul | Esperando emparejamiento (late, no fijo, en `matter_luz_placa`) |
| Verde tenue | Conectado y en servicio |
| Rojo | Borrando el emparejamiento |

En `matter_luz_placa` este LED **es** la luz una vez emparejada, así que el
testigo pasa al LED simple de D13: parpadea sin emparejar, fijo cuando ya está.

---

## Corriente — léelo antes de conectar los LEDs

Ocho WS2812B en blanco pleno piden **~480 mA**. El regulador del Pulsar es un
AP2112 de 600 mA.

- El módulo de LEDs va al pin **5V**, nunca al 3.3V. Alimentarlo del regulador
  lo pone al borde y la placa se reinicia sola cuando el Wi-Fi transmite.
- GND del módulo con GND de la placa. Siempre.
- El firmware trae un **techo de 350 mA**: escala el color si los ocho píxeles
  juntos se pasarían. A simple vista casi no se nota —el ojo responde de forma
  logarítmica— y evita el reinicio aleatorio, que es lo que de verdad arruina
  una demostración.

Cuando pasemos a tira larga: fuente de 5 V aparte, capacitor de 1000 µF en la
entrada y resistencia de 330 Ω en la línea de datos.

**Nivel lógico:** el WS2812B a 5 V quiere datos por encima de 3.5 V y el C6
entrega 3.3 V. Con ocho LEDs y cable corto funciona; si ves parpadeo o colores
que no corresponden, es esto — se resuelve con un level shifter, o alimentando
el módulo a 3.3 V y aceptando menos brillo.

⚠️ **El relevador se prueba sin carga de 127 V.** Para la prueba basta oír el
clic. Corriente de casa en protoboard no.

---

## Probarlo en los tres ecosistemas

Un mismo dispositivo Matter puede pertenecer a **varias casas a la vez** — el
core viene con `CONFIG_MAX_FABRICS=5`. Pero el código de vinculación impreso
sirve **una sola vez**: en cuanto el primer ecosistema lo toma, se consume.

Para sumar el segundo y el tercero no se vuelve a flashear ni se borra nada; se
pide un código nuevo desde el ecosistema que ya lo tiene:

| Desde | Cómo |
| --- | --- |
| **Apple Home** | Accesorio → engrane → *Conectar otras apps* → genera un código |
| **Google Home** | Dispositivo → ajustes → *Vincular con otro servicio* |
| **Alexa** | Dispositivo → ajustes → *Otros servicios* |

Ese código nuevo es el que se escribe en la siguiente app. Recomiendo empezar
por **Apple Home**: es el más estricto con la certificación, así que si entra
ahí, entra en los otros dos.

> Va a decir que el accesorio **no está certificado**. Es correcto y esperado:
> la certificación de la Connectivity Standards Alliance cuesta y se tramita
> por producto. Para desarrollo se acepta y funciona igual.

## Qué hace cada uno

### `matter_luz_placa` — el de arranque
Luz de color completa sobre el LED de la placa. Cero cableado.

El LED cuenta lo que pasa: **late en azul** mientras espera emparejamiento y
**toma el color que mande el hub** cuando ya está. Late en vez de quedarse fijo
a propósito — un LED fijo no distingue "esperando" de "colgado", que es justo
la duda que da cuando el dispositivo no aparece en la app. Si late, el firmware
está vivo y el problema está en la red o en el teléfono, no en la placa.

El LED simple de D13 parpadea sin emparejar y se queda fijo cuando ya está.

### `matter_luz_color`
Color, saturación, brillo y temperatura de color sobre los 8 píxeles. Recuerda
su estado tras un apagón. El botón prende y apaga.

### `matter_sensor_ocupacion`
**Funciona sin sensor conectado**: el botón simula movimiento, así se puede
emparejar y armar la automatización hoy y cablear el PIR cuando llegue.

Sostiene la ocupación 30 s después del último disparo, porque un PIR detecta
movimiento y no presencia: sin esa espera, la luz se apaga en la cara de quien
está leyendo. El hub puede cambiar ese tiempo desde la app (`HoldTime`).

Para presencia de verdad, el camino es mmWave (LD2410 por UART, ~200 pesos); el
resto del código no cambia.

### `matter_interruptor`
El equivalente nacional del Shelly del catálogo. Dos cosas lo separan de un
juguete: el **botón físico manda igual que la app** y el hub se entera, y
**recuerda su estado** — el pin se deja en su valor previo *antes* de
configurarlo como salida, para que el relevador no dé un chasquido en cada
reinicio. En un boiler o un portón eso no es un detalle cosmético.

---

## Compilar sin abrir el IDE

```bash
arduino-cli compile \
  --fqbn esp32:esp32:esp32c6:PartitionScheme=huge_app,CDCOnBoot=cdc \
  firmware/matter_luz_placa
```

## Si algo sale mal

| Síntoma | Causa casi siempre |
| --- | --- |
| `text section exceeds available space in board` | Falta **Huge APP**. El error no menciona particiones por ningún lado, y es el que más tiempo cuesta |
| No aparece en la app | Falta **Erase All Flash**; o el celular no está en la misma red de 2.4 GHz |
| El Monitor Serie no muestra nada | Falta **USB CDC On Boot** |
| Se reinicia solo al subir el brillo | Los LEDs están colgados del 3.3V |
| Emparejó pero luego se pierde | Wi-Fi de 5 GHz; el C6 solo habla 2.4 GHz |
| Colores erráticos | Nivel lógico de 3.3 V contra LEDs a 5 V |

## Referencias

- [Pulsar ESP32-C6 — producto](https://uelectronics.com/producto/unit-pulsar-esp32-c6/) · [documentación](https://github.com/UNIT-Electronics-MX/unit_pulsar_esp32_c6)
- [Librería Matter de Arduino-ESP32](https://docs.espressif.com/projects/arduino-esp32/en/latest/matter/matter.html)
- [Ejemplo de Matter sobre Thread](https://components.espressif.com/components/espressif/arduino-esp32/versions/3.3.6/examples/Arduino_ESP_Matter_over_OpenThread?language=en) — el que necesita ESP-IDF
