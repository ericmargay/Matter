/*
 * Matter · Luz de color de 8 píxeles
 * UNIT Pulsar ESP32-C6 + módulo WS2812B de 8 LEDs
 *
 * Se anuncia como "Extended Color Light": color, saturación, brillo y
 * temperatura de color. Apple Home, Google Home y Alexa lo reconocen sin
 * puente ni app de fabricante — es el punto de todo esto.
 *
 * ── Cableado ────────────────────────────────────────────────────────────
 *   Módulo 8 LEDs      Pulsar C6
 *   DIN            →   D6  (GPIO20)
 *   5V             →   5V     ← NO al 3.3V: ver la nota de corriente abajo
 *   GND            →   GND
 *
 * ── Antes de subir (Arduino IDE) ────────────────────────────────────────
 *   Placa .................. ESP32C6 Dev Module
 *   Partition Scheme ....... Huge APP (3MB No OTA/1MB SPIFFS)   ← obligatorio
 *   Erase All Flash ........ Enabled  (solo la primera vez)
 *   USB CDC On Boot ........ Enabled  (si no, no ves el código de vinculación)
 *   Librería ............... Adafruit NeoPixel
 *
 * ── Emparejar ───────────────────────────────────────────────────────────
 * Abre el Monitor Serie a 115200. Al arrancar sin emparejar imprime el
 * código manual y una URL con el QR. En Apple Home / Google Home / Alexa:
 * agregar accesorio → Matter → escanear ese QR.
 *
 * El Wi-Fi NO se escribe aquí: el hub se lo pasa al dispositivo durante el
 * emparejamiento por Bluetooth. Por eso no hay SSID ni contraseña en el
 * código, que además es lo correcto para un producto.
 *
 * ── Botón BOOT ──────────────────────────────────────────────────────────
 *   toque corto  → prende / apaga
 *   5 segundos   → borra el emparejamiento (para pasarlo a otra casa)
 */

#include <Arduino.h>
#include <Matter.h>
#include <Preferences.h>
#include <Adafruit_NeoPixel.h>

#if !CONFIG_ENABLE_CHIPOBLE
// Sin Bluetooth para emparejar, el Wi-Fi hay que darlo a mano.
#include <WiFi.h>
const char *ssid = "tu-red";
const char *password = "tu-contrasena";
#endif

/* ── pines del Pulsar C6 ─────────────────────────────────────────────────
   El Pulsar respeta la huella de Arduino Nano, así que la serigrafía dice
   D6 pero el GPIO real es otro. Se usan pines que NO son de arranque
   (strapping): en el C6 son GPIO4, 5, 8, 9 y 15, y si alguno está forzado
   en el momento del reset la placa puede no arrancar o entrar en modo de
   descarga. */
constexpr uint8_t PIN_TIRA = 20;  // D6 — datos del módulo de 8 LEDs
constexpr uint8_t PIN_LED_PLACA = 8;  // WS2812 que ya trae la placa
constexpr uint8_t PIN_BOTON = 9;  // botón BOOT
constexpr uint16_t NUM_LEDS = 8;

/* ── límite de corriente ─────────────────────────────────────────────────
   Ocho WS2812B en blanco pleno piden ~480 mA. El regulador de la placa es
   un AP2112 de 600 mA, así que el módulo va alimentado del pin 5V (que
   viene del USB), nunca del 3.3V. Aun así se pone un techo: un puerto USB
   modesto entrega 500 mA para TODO, incluido el radio Wi-Fi transmitiendo.

   350 mA deja margen cómodo y a simple vista casi no se nota — la
   diferencia entre 100% y 73% de brillo en un LED es mucho menor de lo que
   sugiere el número, porque el ojo responde de forma logarítmica. */
constexpr uint16_t CORRIENTE_MAX_MA = 350;
constexpr uint8_t MA_POR_CANAL_PLENO = 20;  // hoja de datos del WS2812B

Adafruit_NeoPixel tira(NUM_LEDS, PIN_TIRA, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel ledPlaca(1, PIN_LED_PLACA, NEO_GRB + NEO_KHZ800);

MatterEnhancedColorLight luz;

// El color vive en HSV porque es lo que manda Matter; el brillo es la V.
HsvColor_t colorActual = {21, 216, 25};  // blanco cálido tenue

// Se recuerda el estado: tras un apagón la lámpara vuelve como estaba.
Preferences prefs;
const char *CLAVE_ENCENDIDA = "OnOff";
const char *CLAVE_COLOR = "HSV";

/* ── botón ─────────────────────────────────────────────────────────────── */
uint32_t botonDesde = 0;
bool botonAbajo = false;
constexpr uint32_t REBOTE_MS = 250;
constexpr uint32_t BORRAR_MS = 5000;

/** Escala el color si los 8 píxeles juntos se pasarían del presupuesto. */
espRgbColor_t limitarCorriente(espRgbColor_t c) {
  uint32_t mA = ((uint32_t)c.r + c.g + c.b) * NUM_LEDS * MA_POR_CANAL_PLENO / 255;
  if (mA <= CORRIENTE_MAX_MA) return c;

  uint32_t factor = (uint32_t)CORRIENTE_MAX_MA * 255 / mA;
  c.r = (uint8_t)((uint32_t)c.r * factor / 255);
  c.g = (uint8_t)((uint32_t)c.g * factor / 255);
  c.b = (uint8_t)((uint32_t)c.b * factor / 255);
  return c;
}

void pintarTira(bool encendida) {
  if (!encendida) {
    tira.clear();
    tira.show();
    return;
  }
  espRgbColor_t c = limitarCorriente(espHsvColorToRgbColor(colorActual));
  for (uint16_t i = 0; i < NUM_LEDS; i++) tira.setPixelColor(i, tira.Color(c.r, c.g, c.b));
  tira.show();
}

/** El LED de la placa dice en qué anda el dispositivo, no cómo está la luz. */
void estadoPlaca(uint8_t r, uint8_t g, uint8_t b) {
  ledPlaca.setPixelColor(0, ledPlaca.Color(r, g, b));
  ledPlaca.show();
}

/**
 * Matter avisa aquí cualquier cambio: encendido, brillo, color o
 * temperatura. Devolver true le confirma al stack que se pudo aplicar.
 */
bool aplicarLuz(bool encendida, espHsvColor_t hsv, uint8_t brillo, uint16_t mireds) {
  pintarTira(encendida);
  prefs.putBool(CLAVE_ENCENDIDA, encendida);
  prefs.putUInt(CLAVE_COLOR, colorActual.h << 16 | colorActual.s << 8 | colorActual.v);
  return true;
}

void setup() {
  Serial.begin(115200);

  pinMode(PIN_BOTON, INPUT_PULLUP);

  tira.begin();
  tira.clear();
  tira.show();
  ledPlaca.begin();
  estadoPlaca(20, 10, 0);  // ámbar tenue: arrancando

#if !CONFIG_ENABLE_CHIPOBLE
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\r\nWi-Fi listo · IP %s\r\n", WiFi.localIP().toString().c_str());
#endif

  // Estado guardado: por default prende en blanco cálido tenue.
  prefs.begin("MatterPrefs", false);
  bool encendidaAlInicio = prefs.getBool(CLAVE_ENCENDIDA, true);
  uint32_t guardado = prefs.getUInt(CLAVE_COLOR, 21 << 16 | 216 << 8 | 25);
  colorActual = {uint8_t(guardado >> 16), uint8_t(guardado >> 8), uint8_t(guardado)};

  luz.begin(encendidaAlInicio, colorActual);
  luz.onChange(aplicarLuz);

  /* Cada atributo por separado además del callback general: aquí se
     actualiza `colorActual` ANTES de que corra `aplicarLuz`, que es quien
     pinta. Si no, un cambio de brillo repintaría con el color viejo. */
  luz.onChangeBrightness([](uint8_t brillo) {
    colorActual.v = brillo;
    return true;
  });
  luz.onChangeColorHSV([](HsvColor_t hsv) {
    colorActual.h = hsv.h;
    colorActual.s = hsv.s;  // el brillo lo maneja su propio atributo
    return true;
  });
  luz.onChangeColorTemperature([](uint16_t mireds) {
    // "blanco cálido / frío" llega en mireds; se traduce a tono y saturación
    HsvColor_t t = espRgbColorToHsvColor(espCTToRgbColor(mireds));
    colorActual.h = t.h;
    colorActual.s = t.s;
    return true;
  });

  Matter.begin();  // siempre al final, cuando los endpoints ya existen

  if (Matter.isDeviceCommissioned()) {
    Serial.println("Ya emparejada. Lista.");
    luz.updateAccessory();
  }
}

void loop() {
  if (!Matter.isDeviceCommissioned()) {
    estadoPlaca(0, 0, 40);  // azul: esperando que la emparejen
    Serial.println();
    Serial.println("Sin emparejar todavía.");
    Serial.printf("Código manual: %s\r\n", Matter.getManualPairingCode().c_str());
    Serial.printf("QR:            %s\r\n", Matter.getOnboardingQRCodeUrl().c_str());

    while (!Matter.isDeviceCommissioned()) delay(200);

    Serial.println("Emparejada.");
    luz.updateAccessory();
  }

  estadoPlaca(0, 6, 0);  // verde muy tenue: conectada y en servicio

  if (digitalRead(PIN_BOTON) == LOW && !botonAbajo) {
    botonDesde = millis();
    botonAbajo = true;
  }

  uint32_t transcurrido = millis() - botonDesde;

  if (botonAbajo && transcurrido > REBOTE_MS && digitalRead(PIN_BOTON) == HIGH) {
    botonAbajo = false;
    luz.toggle();  // el hub se entera del cambio, venga de donde venga
  }

  if (botonAbajo && transcurrido > BORRAR_MS) {
    Serial.println("Borrando el emparejamiento…");
    estadoPlaca(40, 0, 0);
    luz = false;
    Matter.decommission();
    botonDesde = millis();  // el reinicio tarda un momento; no repetirlo
  }

  delay(20);
}
