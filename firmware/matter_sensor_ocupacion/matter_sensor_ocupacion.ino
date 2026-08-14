/*
 * Matter · Sensor de ocupación
 * UNIT Pulsar ESP32-C6 (+ PIR opcional, + módulo de 8 LEDs opcional)
 *
 * Se anuncia como "Occupancy Sensor". Es el dispositivo que más cambia una
 * casa: es el que hace que la luz se prenda sola al entrar y se apague sola
 * al salir, sin que nadie toque nada.
 *
 * Funciona SIN sensor conectado: el botón BOOT simula el movimiento, así se
 * puede emparejar y probar la automatización hoy mismo y cablear el PIR
 * cuando llegue.
 *
 * ── Cableado ────────────────────────────────────────────────────────────
 *   PIR (AM312 o HC-SR501)   Pulsar C6
 *   OUT                  →   D5  (GPIO19)
 *   VCC                  →   5V   (el AM312 también corre a 3.3V)
 *   GND                  →   GND
 *
 *   Módulo 8 LEDs (opcional, para ver el estado)
 *   DIN                  →   D6  (GPIO20)
 *   5V / GND             →   5V / GND
 *
 * ── Antes de subir (Arduino IDE) ────────────────────────────────────────
 *   Placa .................. ESP32C6 Dev Module
 *   Partition Scheme ....... Huge APP (3MB No OTA/1MB SPIFFS)   ← obligatorio
 *   Erase All Flash ........ Enabled  (solo la primera vez)
 *   USB CDC On Boot ........ Enabled
 *   Librería ............... Adafruit NeoPixel
 *
 * ── Botón BOOT ──────────────────────────────────────────────────────────
 *   toque corto  → simula movimiento (para probar sin PIR)
 *   5 segundos   → borra el emparejamiento
 */

#include <Arduino.h>
#include <Matter.h>
#include <Adafruit_NeoPixel.h>

#if !CONFIG_ENABLE_CHIPOBLE
#include <WiFi.h>
const char *ssid = "tu-red";
const char *password = "tu-contrasena";
#endif

constexpr uint8_t PIN_PIR = 19;   // D5
constexpr uint8_t PIN_TIRA = 20;  // D6
constexpr uint8_t PIN_LED_PLACA = 8;
constexpr uint8_t PIN_BOTON = 9;
constexpr uint16_t NUM_LEDS = 8;

/* ── tiempo de permanencia ───────────────────────────────────────────────
   Un PIR detecta MOVIMIENTO, no presencia: si te quedas quieto leyendo, deja
   de dispararse y la luz se te apaga en la cara. Por eso la ocupación se
   sostiene un rato después del último disparo en vez de seguir al sensor
   pulso por pulso.

   30 s está bien para probar. En una instalación real esto sube a 3–10
   minutos según el cuarto, y el hub lo puede cambiar solo: Matter expone
   HoldTime como atributo, así que se ajusta desde la app sin reprogramar.

   Para presencia de verdad —detectar que sigues ahí aunque no te muevas—
   el camino es un sensor mmWave (LD2410 por UART, ~200 pesos); el resto de
   este código no cambia. */
constexpr uint16_t PERMANENCIA_S = 30;

Adafruit_NeoPixel tira(NUM_LEDS, PIN_TIRA, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel ledPlaca(1, PIN_LED_PLACA, NEO_GRB + NEO_KHZ800);

MatterOccupancySensor sensor;

bool ocupado = false;
uint32_t ultimoMovimiento = 0;

uint32_t botonDesde = 0;
bool botonAbajo = false;
constexpr uint32_t REBOTE_MS = 250;
constexpr uint32_t BORRAR_MS = 5000;

void estadoPlaca(uint8_t r, uint8_t g, uint8_t b) {
  ledPlaca.setPixelColor(0, ledPlaca.Color(r, g, b));
  ledPlaca.show();
}

/** La tira solo confirma a simple vista lo que el sensor está reportando. */
void pintarTira(bool hayAlguien) {
  uint32_t c = hayAlguien ? tira.Color(60, 24, 0) : tira.Color(0, 0, 3);
  for (uint16_t i = 0; i < NUM_LEDS; i++) tira.setPixelColor(i, c);
  tira.show();
}

void reportar(bool nuevo) {
  if (nuevo == ocupado) return;
  ocupado = nuevo;
  sensor.setOccupancy(ocupado);  // esto es lo que viaja al hub
  pintarTira(ocupado);
  Serial.printf("Ocupación: %s\r\n", ocupado ? "SÍ" : "no");
}

void setup() {
  Serial.begin(115200);

  pinMode(PIN_BOTON, INPUT_PULLUP);
  /* El PIR va con pull-down: si no hay nada conectado, el pin queda en 0 y
     el sensor simplemente nunca se dispara solo. Sin el pull-down, un pin al
     aire flota y reportaría movimiento fantasma toda la noche. */
  pinMode(PIN_PIR, INPUT_PULLDOWN);

  tira.begin();
  ledPlaca.begin();
  estadoPlaca(20, 10, 0);
  pintarTira(false);

#if !CONFIG_ENABLE_CHIPOBLE
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\r\nWi-Fi listo · IP %s\r\n", WiFi.localIP().toString().c_str());
#endif

  sensor.begin(false, MatterOccupancySensor::OCCUPANCY_SENSOR_TYPE_PIR);
  sensor.setHoldTime(PERMANENCIA_S);

  // Si desde la app cambian la permanencia, hay que obedecerla.
  sensor.onHoldTimeChange([](uint16_t segundos) {
    Serial.printf("El hub cambió la permanencia a %u s\r\n", segundos);
    return true;
  });

  Matter.begin();

  if (Matter.isDeviceCommissioned()) Serial.println("Ya emparejado. Listo.");
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
  }

  estadoPlaca(0, 6, 0);

  // ── movimiento: del PIR o del botón ──
  bool disparo = digitalRead(PIN_PIR) == HIGH;

  if (digitalRead(PIN_BOTON) == LOW && !botonAbajo) {
    botonDesde = millis();
    botonAbajo = true;
  }

  uint32_t transcurrido = millis() - botonDesde;

  if (botonAbajo && transcurrido > REBOTE_MS && digitalRead(PIN_BOTON) == HIGH) {
    botonAbajo = false;
    Serial.println("Movimiento simulado con el botón.");
    disparo = true;
  }

  if (disparo) {
    ultimoMovimiento = millis();
    reportar(true);
  }

  // ── se libera cuando pasó la permanencia sin un solo disparo ──
  uint16_t permanencia = sensor.getHoldTime();
  if (permanencia == 0) permanencia = PERMANENCIA_S;
  if (ocupado && millis() - ultimoMovimiento > (uint32_t)permanencia * 1000) {
    reportar(false);
  }

  if (botonAbajo && transcurrido > BORRAR_MS) {
    Serial.println("Borrando el emparejamiento…");
    estadoPlaca(40, 0, 0);
    Matter.decommission();
    botonDesde = millis();
  }

  delay(20);
}
