/*
 * Matter · Interruptor / enchufe inteligente
 * UNIT Pulsar ESP32-C6 (+ módulo de relevador, + módulo de 8 LEDs opcional)
 *
 * Se anuncia como "On/Off Plug-in Unit". Es el equivalente nacional del
 * Shelly del catálogo: lo que vuelve inteligente un circuito que ya está
 * cableado —boiler, portón, bomba, la lámpara que nadie quiere cambiar—
 * sin pedirle al cliente que tire lo que ya tiene.
 *
 * Dos cosas que lo separan de un juguete:
 *
 *   1. El botón físico manda igual que la app, y el hub se entera. Un
 *      interruptor que solo obedece al teléfono es un interruptor peor que
 *      el que ya estaba en la pared.
 *   2. Recuerda su estado. Tras un apagón vuelve como estaba, no apagado.
 *
 * ── Cableado ────────────────────────────────────────────────────────────
 *   Relevador          Pulsar C6
 *   IN             →   D9  (GPIO13)
 *   VCC            →   5V
 *   GND            →   GND
 *
 *   Módulo 8 LEDs (opcional, testigo de estado)
 *   DIN            →   D6  (GPIO20)
 *
 * ⚠️ Mientras se prueba, el relevador va SIN carga de 127 V conectada. Para
 *    la prueba basta oír el clic. Meter corriente de casa a una protoboard
 *    es como se queman las manos y las placas — cuando toque, va en caja con
 *    bornera y separación entre el lado de baja y el de línea.
 *
 * ── Antes de subir (Arduino IDE) ────────────────────────────────────────
 *   Placa .................. ESP32C6 Dev Module
 *   Partition Scheme ....... Huge APP (3MB No OTA/1MB SPIFFS)   ← obligatorio
 *   Erase All Flash ........ Enabled  (solo la primera vez)
 *   USB CDC On Boot ........ Enabled
 *   Librería ............... Adafruit NeoPixel
 *
 * ── Botón BOOT ──────────────────────────────────────────────────────────
 *   toque corto  → prende / apaga
 *   5 segundos   → borra el emparejamiento
 */

#include <Arduino.h>
#include <Matter.h>
#include <Preferences.h>
#include <Adafruit_NeoPixel.h>

#if !CONFIG_ENABLE_CHIPOBLE
#include <WiFi.h>
const char *ssid = "tu-red";
const char *password = "tu-contrasena";
#endif

constexpr uint8_t PIN_RELEVADOR = 13;  // D9
constexpr uint8_t PIN_TIRA = 20;       // D6
constexpr uint8_t PIN_LED_PLACA = 8;
constexpr uint8_t PIN_BOTON = 9;
constexpr uint16_t NUM_LEDS = 8;

/* Muchos módulos de relevador chinos son activos en BAJO: el relé cierra
   cuando el pin está en 0. Si el tuyo trabaja al revés, cambia esto a true
   y no toques nada más. */
constexpr bool RELEVADOR_ACTIVO_ALTO = false;

Adafruit_NeoPixel tira(NUM_LEDS, PIN_TIRA, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel ledPlaca(1, PIN_LED_PLACA, NEO_GRB + NEO_KHZ800);

MatterOnOffPlugin enchufe;

Preferences prefs;
const char *CLAVE_ENCENDIDO = "OnOff";

uint32_t botonDesde = 0;
bool botonAbajo = false;
constexpr uint32_t REBOTE_MS = 250;
constexpr uint32_t BORRAR_MS = 5000;

void estadoPlaca(uint8_t r, uint8_t g, uint8_t b) {
  ledPlaca.setPixelColor(0, ledPlaca.Color(r, g, b));
  ledPlaca.show();
}

void pintarTira(bool encendido) {
  uint32_t c = encendido ? tira.Color(50, 30, 6) : tira.Color(0, 0, 2);
  for (uint16_t i = 0; i < NUM_LEDS; i++) tira.setPixelColor(i, c);
  tira.show();
}

/** Matter avisa aquí; también entra por aquí lo que se pide con el botón. */
bool aplicarEstado(bool encendido) {
  digitalWrite(PIN_RELEVADOR, RELEVADOR_ACTIVO_ALTO == encendido ? HIGH : LOW);
  pintarTira(encendido);
  prefs.putBool(CLAVE_ENCENDIDO, encendido);
  Serial.printf("Salida: %s\r\n", encendido ? "ENCENDIDA" : "apagada");
  return true;
}

void setup() {
  Serial.begin(115200);

  pinMode(PIN_BOTON, INPUT_PULLUP);

  /* El estado se restituye ANTES de configurar el pin como salida. Si no,
     el relevador da un chasquido al arrancar: el GPIO nace en bajo y, con un
     módulo activo en bajo, eso enciende la carga un instante en cada
     reinicio. En un boiler o un portón eso no es un detalle cosmético. */
  prefs.begin("MatterPrefs", false);
  bool estadoPrevio = prefs.getBool(CLAVE_ENCENDIDO, false);
  digitalWrite(PIN_RELEVADOR, RELEVADOR_ACTIVO_ALTO == estadoPrevio ? HIGH : LOW);
  pinMode(PIN_RELEVADOR, OUTPUT);
  digitalWrite(PIN_RELEVADOR, RELEVADOR_ACTIVO_ALTO == estadoPrevio ? HIGH : LOW);

  tira.begin();
  ledPlaca.begin();
  estadoPlaca(20, 10, 0);
  pintarTira(estadoPrevio);

#if !CONFIG_ENABLE_CHIPOBLE
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\r\nWi-Fi listo · IP %s\r\n", WiFi.localIP().toString().c_str());
#endif

  enchufe.begin(estadoPrevio);
  enchufe.onChange(aplicarEstado);

  Matter.begin();

  if (Matter.isDeviceCommissioned()) {
    Serial.println("Ya emparejado. Listo.");
    enchufe.updateAccessory();
  }
}

void loop() {
  if (!Matter.isDeviceCommissioned()) {
    estadoPlaca(0, 0, 40);
    Serial.println();
    Serial.println("Sin emparejar todavía.");
    Serial.printf("Código manual: %s\r\n", Matter.getManualPairingCode().c_str());
    Serial.printf("QR:            %s\r\n", Matter.getOnboardingQRCodeUrl().c_str());

    while (!Matter.isDeviceCommissioned()) delay(200);

    Serial.println("Emparejado.");
    enchufe.updateAccessory();
  }

  estadoPlaca(0, 6, 0);

  if (digitalRead(PIN_BOTON) == LOW && !botonAbajo) {
    botonDesde = millis();
    botonAbajo = true;
  }

  uint32_t transcurrido = millis() - botonDesde;

  if (botonAbajo && transcurrido > REBOTE_MS && digitalRead(PIN_BOTON) == HIGH) {
    botonAbajo = false;
    // toggle() y no digitalWrite(): así el hub ve el cambio y la app queda
    // al día aunque el interruptor se haya movido a mano
    enchufe.toggle();
  }

  if (botonAbajo && transcurrido > BORRAR_MS) {
    Serial.println("Borrando el emparejamiento…");
    estadoPlaca(40, 0, 0);
    Matter.decommission();
    botonDesde = millis();
  }

  delay(20);
}
