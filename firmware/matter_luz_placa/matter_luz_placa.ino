/*
 * Matter · Luz de color — sin soldar nada
 * UNIT Pulsar ESP32-C6, usando el LED direccionable que ya trae la placa
 *
 * Mismo dispositivo que `matter_luz_color` pero sobre el WS2812 de a bordo:
 * solo hace falta el cable USB. Es el sketch para responder primero la
 * pregunta que importa —¿entra a Apple, a Google y a Alexa?— sin que un
 * cable flojo o un LED mal alimentado enturbien el diagnóstico.
 *
 * Cuando funcione, `matter_luz_color` es este mismo código apuntando al
 * módulo de 8 LEDs. La lógica no cambia.
 *
 * ── Cableado ────────────────────────────────────────────────────────────
 * Ninguno. Solo el USB-C.
 *
 * ── Antes de subir (Arduino IDE) ────────────────────────────────────────
 *   Placa .................. ESP32C6 Dev Module
 *   Partition Scheme ....... Huge APP (3MB No OTA/1MB SPIFFS)   ← obligatorio
 *   Erase All Flash ........ Enabled  (solo la primera vez)
 *   USB CDC On Boot ........ Enabled  (si no, no ves el código de vinculación)
 *   Librería ............... Adafruit NeoPixel
 *
 * ── Qué vas a ver ───────────────────────────────────────────────────────
 *   LED RGB late en azul  → esperando que lo emparejes
 *   LED RGB toma color    → ya está en tu casa; lo que ves es lo que manda el hub
 *   LED simple (D13)      → parpadea sin emparejar, fijo cuando ya está
 *
 * ── Botón BOOT ──────────────────────────────────────────────────────────
 *   toque corto  → prende / apaga
 *   5 segundos   → borra el emparejamiento (para pasarlo a otra casa)
 */

#include <Arduino.h>
#include <Matter.h>
#include <Preferences.h>
#include <Adafruit_NeoPixel.h>

/* La librería Matter de Arduino no expone el fabricante ni el modelo, así que
   se escriben directo sobre ESP-Matter. Son atributos del cluster Basic
   Information, que vive en el endpoint 0 (el nodo raíz). */
#include <esp_matter.h>
#include <esp_mac.h>  // para armar el número de serie con la MAC
#include <app-common/zap-generated/ids/Clusters.h>
#include <app-common/zap-generated/ids/Attributes.h>

#if !CONFIG_ENABLE_CHIPOBLE
// Respaldo para cores sin Bluetooth. En el 3.3.7 esto no se compila:
// el Wi-Fi lo entrega el hub durante el emparejamiento.
#include <WiFi.h>
const char *ssid = "Matrix";
const char *password = "5544332211$$";
#endif

/* El WS2812 de la placa está en GPIO8 y el LED simple en GPIO6 (D13).
   GPIO8 es pin de arranque (strapping), pero aquí no estorba: lo maneja la
   propia placa y solo se escribe después del arranque, nunca se fuerza
   durante el reset. */
constexpr uint8_t PIN_LED_RGB = 8;
constexpr uint8_t PIN_LED_ESTADO = 6;
constexpr uint8_t PIN_BOTON = 9;

/* ── identidad del producto ──────────────────────────────────────────────
   Es lo que la app del cliente enseña en Fabricante y Modelo. No es adorno:
   es la diferencia entre "Matter Accessory" —que se ve a prototipo— y algo
   que parece un producto.

   El número de serie sí conviene que sea único por placa; abajo se arma con
   la MAC, que ya es única de fábrica. */
const char *MARCA = "Matter_Mexico";
const char *MODELO = "Test_007";
const char *VERSION_HW = "Pulsar C6 rev A";
const char *VERSION_SW = "0.1.0";

Adafruit_NeoPixel led(1, PIN_LED_RGB, NEO_GRB + NEO_KHZ800);

MatterEnhancedColorLight luz;

HsvColor_t colorActual = {21, 216, 60};  // blanco cálido, a media luz

Preferences prefs;
const char *CLAVE_ENCENDIDA = "OnOff";
const char *CLAVE_COLOR = "HSV";

uint32_t botonDesde = 0;
bool botonAbajo = false;
constexpr uint32_t REBOTE_MS = 250;
constexpr uint32_t BORRAR_MS = 5000;

void pintar(bool encendida) {
  if (!encendida) {
    led.setPixelColor(0, 0);
    led.show();
    return;
  }
  espRgbColor_t c = espHsvColorToRgbColor(colorActual);
  led.setPixelColor(0, led.Color(c.r, c.g, c.b));
  led.show();
}

/** Matter avisa aquí cualquier cambio. true = se pudo aplicar. */
bool aplicarLuz(bool encendida, espHsvColor_t hsv, uint8_t brillo, uint16_t mireds) {
  pintar(encendida);
  prefs.putBool(CLAVE_ENCENDIDA, encendida);
  prefs.putUInt(CLAVE_COLOR, colorActual.h << 16 | colorActual.s << 8 | colorActual.v);
  return true;
}

/**
 * Escribe fabricante, modelo y demás en el cluster Basic Information.
 *
 * Va DESPUÉS de `Matter.begin()` porque hasta ese momento el nodo raíz no
 * existe y no hay dónde escribir.
 *
 * ⚠️ El hub lee estos datos UNA VEZ, al emparejar, y se los queda. Si el
 * dispositivo ya está en tu casa, cambiarlos aquí no actualiza lo que ves en
 * la app: hay que quitar el accesorio y volverlo a agregar. Es del protocolo,
 * no del código.
 */
void publicarIdentidad() {
  auto poner = [](uint32_t atributo, const char *texto) {
    esp_matter_attr_val_t v = esp_matter_char_str((char *)texto, strlen(texto));
    esp_err_t e = esp_matter::attribute::update(0, chip::app::Clusters::BasicInformation::Id, atributo, &v);
    // se imprime el resultado: algunos atributos son de solo lectura según
    // cómo se compiló el stack, y conviene enterarse aquí y no en la app
    Serial.printf("  %-22s %-18s %s\r\n", "Basic Information", texto, e == ESP_OK ? "ok" : esp_err_to_name(e));
  };

  using namespace chip::app::Clusters::BasicInformation::Attributes;

  Serial.println("Identidad del producto:");
  poner(VendorName::Id, MARCA);
  poner(ProductName::Id, MODELO);
  poner(NodeLabel::Id, MODELO);
  poner(HardwareVersionString::Id, VERSION_HW);
  poner(SoftwareVersionString::Id, VERSION_SW);

  // número de serie único por placa, tomado de la MAC
  uint8_t mac[6];
  esp_read_mac(mac, ESP_MAC_WIFI_STA);
  char serie[24];
  snprintf(serie, sizeof(serie), "MX-%02X%02X%02X%02X%02X%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  poner(SerialNumber::Id, serie);
}

/**
 * Latido azul mientras espera emparejamiento.
 *
 * Un LED fijo no distingue "esperando" de "colgado", y es justo la duda que
 * da cuando el dispositivo no aparece en la app. Si late, el firmware está
 * vivo y el problema está en la red o en el teléfono, no aquí.
 */
void latirAzul() {
  // seno barato a partir de millis(): sube y baja en ~2 s
  uint8_t v = (uint8_t)(30 + 25 * sin(millis() / 320.0));
  led.setPixelColor(0, led.Color(0, 0, v));
  led.show();
  digitalWrite(PIN_LED_ESTADO, (millis() / 500) % 2);
}

void setup() {
  Serial.begin(115200);

  pinMode(PIN_BOTON, INPUT_PULLUP);
  pinMode(PIN_LED_ESTADO, OUTPUT);
  digitalWrite(PIN_LED_ESTADO, LOW);

  led.begin();
  led.setPixelColor(0, led.Color(20, 10, 0));  // ámbar: arrancando
  led.show();

#if !CONFIG_ENABLE_CHIPOBLE
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\r\nWi-Fi listo · IP %s\r\n", WiFi.localIP().toString().c_str());
#endif

  prefs.begin("MatterPrefs", false);
  bool encendidaAlInicio = prefs.getBool(CLAVE_ENCENDIDA, true);
  uint32_t guardado = prefs.getUInt(CLAVE_COLOR, 21 << 16 | 216 << 8 | 60);
  colorActual = {uint8_t(guardado >> 16), uint8_t(guardado >> 8), uint8_t(guardado)};

  luz.begin(encendidaAlInicio, colorActual);
  luz.onChange(aplicarLuz);

  /* Estos corren ANTES de `aplicarLuz`, que es quien pinta. Sin ellos, un
     cambio de brillo repintaría con el color anterior. */
  luz.onChangeBrightness([](uint8_t brillo) {
    colorActual.v = brillo;
    return true;
  });
  luz.onChangeColorHSV([](HsvColor_t hsv) {
    colorActual.h = hsv.h;
    colorActual.s = hsv.s;  // el brillo tiene su propio atributo
    return true;
  });
  luz.onChangeColorTemperature([](uint16_t mireds) {
    HsvColor_t t = espRgbColorToHsvColor(espCTToRgbColor(mireds));
    colorActual.h = t.h;
    colorActual.s = t.s;
    return true;
  });

  Matter.begin();  // al final, cuando los endpoints ya existen

  publicarIdentidad();  // requiere que el nodo raíz ya exista

  if (Matter.isDeviceCommissioned()) {
    Serial.println("Ya emparejada. Lista.");
    digitalWrite(PIN_LED_ESTADO, HIGH);
    luz.updateAccessory();
  }
}

void loop() {
  if (!Matter.isDeviceCommissioned()) {
    Serial.println();
    Serial.println("─────────────────────────────────────────────");
    Serial.println("Sin emparejar. Lista para que la agregues.");
    Serial.printf("Código manual: %s\r\n", Matter.getManualPairingCode().c_str());
    Serial.printf("QR:            %s\r\n", Matter.getOnboardingQRCodeUrl().c_str());
    Serial.println("Abre esa URL y escanea el QR desde la app.");
    Serial.println("─────────────────────────────────────────────");

    uint32_t ultimoAviso = millis();
    while (!Matter.isDeviceCommissioned()) {
      latirAzul();
      delay(20);
      if (millis() - ultimoAviso > 15000) {  // recordatorio cada 15 s
        ultimoAviso = millis();
        Serial.printf("Sigo esperando. Código: %s\r\n", Matter.getManualPairingCode().c_str());
      }
    }

    Serial.println("¡Emparejada! Ya deberías poder controlarla desde la app.");
    digitalWrite(PIN_LED_ESTADO, HIGH);
    luz.updateAccessory();
  }

  if (digitalRead(PIN_BOTON) == LOW && !botonAbajo) {
    botonDesde = millis();
    botonAbajo = true;
  }

  uint32_t transcurrido = millis() - botonDesde;

  if (botonAbajo && transcurrido > REBOTE_MS && digitalRead(PIN_BOTON) == HIGH) {
    botonAbajo = false;
    luz.toggle();  // el hub ve el cambio aunque venga del botón
    Serial.printf("Botón: luz %s\r\n", luz ? "encendida" : "apagada");
  }

  if (botonAbajo && transcurrido > BORRAR_MS) {
    Serial.println("Borrando el emparejamiento…");
    led.setPixelColor(0, led.Color(60, 0, 0));
    led.show();
    digitalWrite(PIN_LED_ESTADO, LOW);
    luz = false;
    Matter.decommission();
    botonDesde = millis();  // el reinicio tarda; no repetirlo
  }

  delay(20);
}
