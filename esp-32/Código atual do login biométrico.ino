#include <WiFi.h>
#include <esp_wifi.h>
#include <PubSubClient.h>
#include <HardwareSerial.h>
#include <DFRobot_ID809.h>
#include <mbedtls/base64.h>
#include <mbedtls/cipher.h>
#include <esp_system.h>
#include <ArduinoJson.h>

// ================= CONFIGURAÇÕES =================
const char* SSID = "Vodafone-07FD83";
const char* PASSWORD = "AZEITAO2026";
const char* MQTT_BROKER = "192.168.1.72";
const int MQTT_PORT = 1883;

const char* TOPIC_SUBSCRIBE_MODE = "casa/biometria/comando";
const char* TOPIC_SUBSCRIBE_ALERTA = "casa/biometria/alerta";
const char* TOPIC_PUBLISH_ENROLL = "sensor/enroll";
const char* TOPIC_PUBLISH_LOGIN  = "sensor/login";
const char* TOPIC_PUBLISH_STATUS = "casa/biometria/status";

#define RX_PIN 4
#define TX_PIN 5
#define BUZZER_PIN 27

// ================= VARIÁVEIS DE ESTADO =================
WiFiClient espClient;
PubSubClient client(espClient);
HardwareSerial mySerial(1);
DFRobot_ID809 fingerprint;

static const uint16_t TEMPLATE_SIZE = 1008;
static const uint8_t ENROLL_SAMPLES = 3;
static const unsigned long ENROLL_TIMEOUT_TOTAL_MS = 25000;

static uint8_t enrollmentTemplateData[TEMPLATE_SIZE] = {0};
static unsigned char base64Buffer[1501] = {0};
static char jsonString[2048] = {0};

enum FingerprintMode { MODE_IDLE, MODE_ENROLL };
volatile FingerprintMode currentMode = MODE_IDLE;

volatile bool buzzerAtivo = false;
unsigned long buzzerUltimoToggle = 0;
bool buzzerTomAgudo = true;
const unsigned long BUZZER_INTERVALO_MS = 150;
const int BUZZER_FREQ_AGUDO = 3000;
const int BUZZER_FREQ_GRAVE = 1500;

// ================= SEGURANÇA E CRIPTOGRAFIA =================
static const unsigned char CHAVE_3DES[24] = {
    0x85, 0xCC, 0xAF, 0x26, 0xDB, 0x42, 0xE9, 0x7B, 
    0x78, 0xB6, 0xB8, 0x8F, 0xDC, 0x70, 0xED, 0xC4, 
    0x66, 0xF1, 0xFB, 0x1A, 0x13, 0x25, 0x2A, 0xEA
};

static uint32_t crc32_tabela[256];
static bool crc32_tabela_pronta = false;

static void crc32_inicializar() {
  for (uint32_t i = 0; i < 256; i++) {
    uint32_t c = i;
    for (int j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >> 1)) : (c >> 1);
    crc32_tabela[i] = c;
  }
  crc32_tabela_pronta = true;
}

static uint32_t crc32_calcular(const uint8_t* dados, size_t tamanho) {
  if (!crc32_tabela_pronta) crc32_inicializar();
  uint32_t crc = 0xFFFFFFFF;
  for (size_t i = 0; i < tamanho; i++) crc = crc32_tabela[(crc ^ dados[i]) & 0xFF] ^ (crc >> 8);
  return crc ^ 0xFFFFFFFF;
}

static int des3_cifrar(const uint8_t* entrada, size_t tamEntrada, const uint8_t iv[8], uint8_t* saida) {
  mbedtls_cipher_context_t ctx; mbedtls_cipher_init(&ctx);
  mbedtls_cipher_setup(&ctx, mbedtls_cipher_info_from_type(MBEDTLS_CIPHER_DES_EDE3_CBC));
  mbedtls_cipher_setkey(&ctx, CHAVE_3DES, 192, MBEDTLS_ENCRYPT);
  mbedtls_cipher_set_padding_mode(&ctx, MBEDTLS_PADDING_PKCS7);
  mbedtls_cipher_set_iv(&ctx, iv, 8); mbedtls_cipher_reset(&ctx);
  size_t tU=0, tF=0;
  mbedtls_cipher_update(&ctx, entrada, tamEntrada, saida, &tU);
  mbedtls_cipher_finish(&ctx, saida + tU, &tF);
  mbedtls_cipher_free(&ctx); return tU + tF;
}

static int des3_decifrar(const uint8_t* entrada, size_t tamEntrada, const uint8_t iv[8], uint8_t* saida) {
  mbedtls_cipher_context_t ctx; mbedtls_cipher_init(&ctx);
  mbedtls_cipher_setup(&ctx, mbedtls_cipher_info_from_type(MBEDTLS_CIPHER_DES_EDE3_CBC));
  mbedtls_cipher_setkey(&ctx, CHAVE_3DES, 192, MBEDTLS_DECRYPT);
  mbedtls_cipher_set_padding_mode(&ctx, MBEDTLS_PADDING_PKCS7);
  mbedtls_cipher_set_iv(&ctx, iv, 8); mbedtls_cipher_reset(&ctx);
  size_t tU=0, tF=0;
  mbedtls_cipher_update(&ctx, entrada, tamEntrada, saida, &tU);
  mbedtls_cipher_finish(&ctx, saida + tU, &tF);
  mbedtls_cipher_free(&ctx); return tU + tF;
}

static String cifrarEEmpacotar(const char* jsonPlano) {
  size_t tamPlano = strlen(jsonPlano);
  uint8_t iv[8]; esp_fill_random(iv, 8);
  uint8_t cifrado[2048];
  int tamCifrado = des3_cifrar((const uint8_t*)jsonPlano, tamPlano, iv, cifrado);
  uint32_t crc = crc32_calcular((const uint8_t*)jsonPlano, tamPlano);
  unsigned char ivB64[32], dataB64[3072]; size_t iL, dL;
  mbedtls_base64_encode(ivB64, 32, &iL, iv, 8);
  mbedtls_base64_encode(dataB64, 3072, &dL, cifrado, tamCifrado);
  StaticJsonDocument<4096> env;
  env["iv"] = String((char*)ivB64, iL);
  env["data"] = String((char*)dataB64, dL);
  env["crc"] = crc;
  String res; serializeJson(env, res); return res;
}

static bool desempacotarEDecifrar(const String& envelopeJson, char* saida, size_t tamSaida) {
  StaticJsonDocument<2048> doc;
  if (deserializeJson(doc, envelopeJson)) return false;
  const char* ivB64 = doc["iv"]; const char* dataB64 = doc["data"];
  uint32_t crcEsperado = doc["crc"];
  if (!ivB64 || !dataB64) return false;
  uint8_t iv[8], cifrado[1024]; size_t iL, cL;
  mbedtls_base64_decode(iv, 8, &iL, (const unsigned char*)ivB64, strlen(ivB64));
  mbedtls_base64_decode(cifrado, 1024, &cL, (const unsigned char*)dataB64, strlen(dataB64));
  int tamPlano = des3_decifrar(cifrado, cL, iv, (uint8_t*)saida);
  if (crc32_calcular((uint8_t*)saida, tamPlano) != crcEsperado) return false;
  saida[tamPlano] = '\0'; return true;
}

// ================= LÓGICA BIOMÉTRICA E BUZZER =================
void atualizarBuzzer() {
  if (!buzzerAtivo) { noTone(BUZZER_PIN); return; }
  if (millis() - buzzerUltimoToggle >= BUZZER_INTERVALO_MS) {
    buzzerUltimoToggle = millis(); buzzerTomAgudo = !buzzerTomAgudo;
    tone(BUZZER_PIN, buzzerTomAgudo ? BUZZER_FREQ_AGUDO : BUZZER_FREQ_GRAVE);
  }
}

void publicarErroEnroll(const char* motivo) {
  StaticJsonDocument<128> doc; doc["erro"] = true; doc["motivo"] = motivo;
  char buf[128]; serializeJson(doc, buf, sizeof(buf));
  client.publish(TOPIC_PUBLISH_ENROLL, cifrarEEmpacotar(buf).c_str());
}

bool collectEnrollmentSamples(uint8_t samplesNeeded) {
  uint8_t captured = 0; unsigned long inicio = millis();
  while (captured < samplesNeeded) {
    client.loop(); atualizarBuzzer();
    if (millis() - inicio > ENROLL_TIMEOUT_TOTAL_MS || currentMode != MODE_ENROLL) return false;
    fingerprint.ctrlLED(fingerprint.eBreathing, fingerprint.eLEDBlue, 0);
    if (fingerprint.collectionFingerprint(1) != ERR_ID809) {
      captured++;
      fingerprint.ctrlLED(fingerprint.eFastBlink, fingerprint.eLEDYellow, 3);
      while (fingerprint.detectFinger()) { delay(30); client.loop(); atualizarBuzzer(); }
    }
  }
  return true;
}

bool processEnrollmentFingerprint() {
  uint8_t newId = fingerprint.getEmptyID();
  if (newId == ERR_ID809) { publicarErroEnroll("sem_id"); return false; }
  if (!collectEnrollmentSamples(ENROLL_SAMPLES)) { publicarErroEnroll("timeout"); return false; }
  if (fingerprint.storeFingerprint(newId) != ERR_ID809) {
    fingerprint.getTemplate(newId, enrollmentTemplateData);
    size_t oL; mbedtls_base64_encode(base64Buffer, 1500, &oL, enrollmentTemplateData, TEMPLATE_SIZE);
    base64Buffer[oL] = '\0';
    StaticJsonDocument<2048> doc; doc["id_sensor"] = newId; doc["template"] = (char*)base64Buffer;
    serializeJson(doc, jsonString, sizeof(jsonString));
    client.publish(TOPIC_PUBLISH_ENROLL, cifrarEEmpacotar(jsonString).c_str());
    return true;
  }
  return false;
}

void processLoginFingerprint() {
  int id = fingerprint.search();
  if (id == 0) return;
  fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDGreen, 0);
  StaticJsonDocument<128> doc; doc["id_sensor"] = id; doc["status"] = "detectado";
  char buf[128]; serializeJson(doc, buf, sizeof(buf));
  client.publish(TOPIC_PUBLISH_LOGIN, cifrarEEmpacotar(buf).c_str());
  delay(2000); fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
}

// ================= MQTT CALLBACK (DEBUG) =================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.printf("\n[MQTT] Rec: %s | Len: %d\n", topic, length);
  String envelope; for(unsigned int i=0; i<length; i++) envelope += (char)payload[i];
  char plano[256];
  if (!desempacotarEDecifrar(envelope, plano, sizeof(plano))) {
    Serial.println("[MQTT] ❌ ERRO DECRIPT: Verifica CHAVE_3DES ou Padding!");
    return;
  }
  Serial.println("[MQTT] Decifrado: " + String(plano));
  StaticJsonDocument<256> doc; deserializeJson(doc, plano);
  if (strcmp(topic, TOPIC_SUBSCRIBE_MODE) == 0) {
    currentMode = (String(doc["modo"]) == "enroll") ? MODE_ENROLL : MODE_IDLE;
  } else if (strcmp(topic, TOPIC_SUBSCRIBE_ALERTA) == 0) {
    buzzerAtivo = doc["ativo"] | false;
  }
}

void reconnectMQTT() {
  while (!client.connected()) {
    if (client.connect("esp32-pico-fingerprint", NULL, NULL, NULL, 0, false, NULL, true)) {
      client.subscribe(TOPIC_SUBSCRIBE_MODE);
      client.subscribe(TOPIC_SUBSCRIBE_ALERTA);
    } else { delay(5000); }
  }
}

// ================= SETUP E LOOP =================
void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  WiFi.mode(WIFI_STA); WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(mqttCallback);
  client.setBufferSize(4096);
  mySerial.begin(115200, SERIAL_8N1, RX_PIN, TX_PIN);
  fingerprint.begin(mySerial);
}

void loop() {
  if (!client.connected()) reconnectMQTT();
  client.loop(); atualizarBuzzer();
  if (currentMode == MODE_ENROLL) {
    processEnrollmentFingerprint(); currentMode = MODE_IDLE;
  } else if (fingerprint.detectFinger()) {
    processLoginFingerprint();
  }
}