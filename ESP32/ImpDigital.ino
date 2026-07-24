#include <WiFi.h>
#include <esp_wifi.h>
#include <PubSubClient.h>
#include <HardwareSerial.h>
#include <DFRobot_ID809.h>
#include <mbedtls/base64.h>
#include <mbedtls/cipher.h>
#include <esp_system.h>
#include <ArduinoJson.h>

// CONFIGURAÇÕES
const char* SSID = "???";
const char* PASSWORD = "???";
const char* MQTT_BROKER = "???";
const int MQTT_PORT = 1883;

const char* TOPIC_SUBSCRIBE_MODE = "casa/biometria/comando";
const char* TOPIC_PUBLISH_ENROLL = "casa/biometria/enroll";
const char* TOPIC_PUBLISH_LOGIN  = "casa/biometria/acesso"; 
const char* TOPIC_PUBLISH_STATUS = "casa/biometria/status"; 

#define RX_PIN 4
#define TX_PIN 5

WiFiClient espClient;
PubSubClient client(espClient);
HardwareSerial mySerial(1);
DFRobot_ID809 fingerprint;

static const uint16_t TEMPLATE_SIZE = 1008;
static const uint8_t ENROLL_SAMPLES = 3;
static const unsigned long ENROLL_TIMEOUT_TOTAL_MS = 30000;
static const unsigned long MODE_TIMEOUT_MS = 35000;

// Buffers
static uint8_t enrollmentTemplateData[TEMPLATE_SIZE] = {0};
static char base64Buffer[1800] = {0};
static char jsonPlanoBuffer[2000] = {0};

enum FingerprintMode {
  MODE_IDLE,
  MODE_ENROLL
};

volatile FingerprintMode currentMode = MODE_IDLE;
unsigned long lastModeChange = 0;

// SEGURANÇA: AES-128-CBC + CRC32
const uint8_t aes_key[16] = {
    0x84, 0x24, 0x0b, 0x86, 0xd0, 0x93, 0x09, 0xb8,
    0x68, 0x18, 0x48, 0x96, 0x21, 0x22, 0xe2, 0xfa
};

static uint32_t crc32_tabela[256];
static bool crc32_tabela_pronta = false;

static void crc32_inicializar() {
  for (uint32_t i = 0; i < 256; i++) {
    uint32_t c = i;
    for (int j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >> 1)) : (c >> 1);
    }
    crc32_tabela[i] = c;
  }
  crc32_tabela_pronta = true;
}

static uint32_t crc32_calcular(const uint8_t* dados, size_t tamanho) {
  if (!crc32_tabela_pronta) crc32_inicializar();
  uint32_t crc = 0xFFFFFFFF;
  for (size_t i = 0; i < tamanho; i++) {
    crc = crc32_tabela[(crc ^ dados[i]) & 0xFF] ^ (crc >> 8);
  }
  return crc ^ 0xFFFFFFFF;
}

static int aes_cifrar(const uint8_t* entrada, size_t tamEntrada, const uint8_t iv[16], uint8_t* saida) {
  mbedtls_cipher_context_t ctx;
  mbedtls_cipher_init(&ctx);
  const mbedtls_cipher_info_t* info = mbedtls_cipher_info_from_type(MBEDTLS_CIPHER_AES_128_CBC);
  if (info == NULL) { mbedtls_cipher_free(&ctx); return 0; }

  mbedtls_cipher_setup(&ctx, info);
  mbedtls_cipher_setkey(&ctx, aes_key, 128, MBEDTLS_ENCRYPT);
  mbedtls_cipher_set_padding_mode(&ctx, MBEDTLS_PADDING_PKCS7);
  mbedtls_cipher_set_iv(&ctx, iv, 16);
  mbedtls_cipher_reset(&ctx);

  size_t tU = 0, tF = 0;
  mbedtls_cipher_update(&ctx, entrada, tamEntrada, saida, &tU);
  mbedtls_cipher_finish(&ctx, saida + tU, &tF);
  mbedtls_cipher_free(&ctx);
  return tU + tF;
}

static int aes_decifrar(const uint8_t* entrada, size_t tamEntrada, const uint8_t iv[16], uint8_t* saida) {
  mbedtls_cipher_context_t ctx;
  mbedtls_cipher_init(&ctx);
  const mbedtls_cipher_info_t* info = mbedtls_cipher_info_from_type(MBEDTLS_CIPHER_AES_128_CBC);
  if (info == NULL) { mbedtls_cipher_free(&ctx); return 0; }

  mbedtls_cipher_setup(&ctx, info);
  mbedtls_cipher_setkey(&ctx, aes_key, 128, MBEDTLS_DECRYPT);
  mbedtls_cipher_set_padding_mode(&ctx, MBEDTLS_PADDING_PKCS7);
  mbedtls_cipher_set_iv(&ctx, iv, 16);
  mbedtls_cipher_reset(&ctx);

  size_t tU = 0, tF = 0;
  mbedtls_cipher_update(&ctx, entrada, tamEntrada, saida, &tU);
  mbedtls_cipher_finish(&ctx, saida + tU, &tF);
  mbedtls_cipher_free(&ctx);
  return tU + tF;
}

// CIFRAGEM SEGURA 
static String cifrarEEmpacotar(const char* jsonPlano) {
  size_t tamPlano = strlen(jsonPlano);
  uint32_t crc = crc32_calcular((const uint8_t*)jsonPlano, tamPlano);

  uint8_t iv[16] = {0};
  esp_fill_random(iv, 16);

  size_t tamCifradoMax = ((tamPlano / 16) + 2) * 16;
  uint8_t* cifrado = (uint8_t*) malloc(tamCifradoMax);
  if (!cifrado) return "";

  int tamCifrado = aes_cifrar((const uint8_t*)jsonPlano, tamPlano, iv, cifrado);
  if (tamCifrado <= 0) {
    free(cifrado);
    return "";
  }

  char ivB64[32] = {0};
  size_t tamB64Max = ((tamCifrado + 2) / 3) * 4 + 1;
  char* dataB64 = (char*) malloc(tamB64Max);
  if (!dataB64) {
    free(cifrado);
    return "";
  }

  size_t iL = 0, dL = 0;
  mbedtls_base64_encode((unsigned char*)ivB64, sizeof(ivB64), &iL, iv, 16);
  mbedtls_base64_encode((unsigned char*)dataB64, tamB64Max, &dL, cifrado, tamCifrado);

  char crcStr[20];
  snprintf(crcStr, sizeof(crcStr), "%u", crc);

  String envelope = "{\"iv\":\"" + String(ivB64) + "\",\"data\":\"" + String(dataB64) + "\",\"crc\":" + String(crcStr) + "}";

  free(cifrado);
  free(dataB64);
  return envelope;
}

static bool desempacotarEDecifrar(const String& envelopeJson, char* saida, size_t tamSaida) {
  DynamicJsonDocument doc(1024);
  if (deserializeJson(doc, envelopeJson)) return false;

  const char* ivB64 = doc["iv"];
  const char* dataB64 = doc["data"];
  uint32_t crcEsperado = doc["crc"].as<uint32_t>();

  if (!ivB64 || !dataB64) return false;

  uint8_t iv[16] = {0};
  uint8_t cifrado[256] = {0};
  size_t iL = 0, cL = 0;

  mbedtls_base64_decode(iv, sizeof(iv), &iL, (const unsigned char*)ivB64, strlen(ivB64));
  mbedtls_base64_decode(cifrado, sizeof(cifrado), &cL, (const unsigned char*)dataB64, strlen(dataB64));

  uint8_t bufferTemp[256] = {0};
  int tamPlanoBruto = aes_decifrar(cifrado, cL, iv, bufferTemp);
  if (tamPlanoBruto <= 0 || (size_t)tamPlanoBruto >= tamSaida) return false;

  bufferTemp[tamPlanoBruto] = '\0';

  uint32_t crcCalculado = crc32_calcular(bufferTemp, tamPlanoBruto);
  if (crcCalculado != crcEsperado) return false;

  memcpy(saida, bufferTemp, tamPlanoBruto);
  saida[tamPlanoBruto] = '\0';
  return true;
}

// MQTT CALLBACK
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String envelope;
  for (unsigned int i = 0; i < length; i++) envelope += (char)payload[i];

  if (String(topic) == TOPIC_SUBSCRIBE_MODE) {
    char mensagemPlano[256] = {0};
    if (!desempacotarEDecifrar(envelope, mensagemPlano, sizeof(mensagemPlano))) {
      Serial.println("✗ Falha ao decifrar comando MQTT");
      return;
    }

    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, mensagemPlano) == DeserializationError::Ok) {
      const char* modoCmd = doc["modo"];
      if (modoCmd) {
        if (strcmp(modoCmd, "enroll") == 0) {
          currentMode = MODE_ENROLL;
          lastModeChange = millis();
          Serial.println("Modo ENROLL ativado");
        } else {
          currentMode = MODE_IDLE;
          lastModeChange = millis();
          Serial.println("Modo IDLE");
        }
      }
    }
  }
}

// ENROLLMENT
void publicarErroEnroll(const char* motivo) {
  StaticJsonDocument<128> doc;
  doc["erro"] = true;
  doc["motivo"] = motivo;
  String jsonStr;
  serializeJson(doc, jsonStr);
  String payload = cifrarEEmpacotar(jsonStr.c_str());
  client.publish(TOPIC_PUBLISH_ENROLL, payload.c_str());
}

bool collectEnrollmentSamples(uint8_t samplesNeeded) {
  uint8_t captured = 0;
  unsigned long inicio = millis();

  while (captured < samplesNeeded) {
    client.loop();
    if (millis() - inicio > ENROLL_TIMEOUT_TOTAL_MS || currentMode != MODE_ENROLL) {
      return false;
    }

    fingerprint.ctrlLED(fingerprint.eBreathing, fingerprint.eLEDBlue, 0);
    Serial.printf("Amostra %d/%d...\n", captured + 1, samplesNeeded);

    if (fingerprint.collectionFingerprint(10) == 0) {
      captured++;
      fingerprint.ctrlLED(fingerprint.eFastBlink, fingerprint.eLEDYellow, 3);
      Serial.println("Amostra capturada. Solte o dedo.");

      while (fingerprint.detectFinger()) {
        delay(30);
        client.loop();
        if (millis() - inicio > ENROLL_TIMEOUT_TOTAL_MS) return false;
      }
    }
    delay(100);
  }
  return true;
}

bool processEnrollmentFingerprint() {
  unsigned long tInicio = millis();
  uint8_t newId = fingerprint.getEmptyID();
  if (newId == ERR_ID809) {
    publicarErroEnroll("sem_id_disponivel");
    return false;
  }

  if (!collectEnrollmentSamples(ENROLL_SAMPLES)) {
    publicarErroEnroll("captura_falhada_ou_cancelada");
    return false;
  }

  memset(enrollmentTemplateData, 0, TEMPLATE_SIZE);
  if (fingerprint.storeFingerprint(newId) != 0) {
    publicarErroEnroll("falha_ao_guardar");
    return false;
  }

  if (fingerprint.getTemplate(newId, enrollmentTemplateData) == 0) {
    memset(base64Buffer, 0, sizeof(base64Buffer));
    memset(jsonPlanoBuffer, 0, sizeof(jsonPlanoBuffer));

    size_t outputLength = 0;
    mbedtls_base64_encode((unsigned char*)base64Buffer, sizeof(base64Buffer) - 1, &outputLength, enrollmentTemplateData, TEMPLATE_SIZE);

    snprintf(jsonPlanoBuffer, sizeof(jsonPlanoBuffer) - 1, "{\"id_sensor\":%d,\"template\":\"%s\"}", newId, base64Buffer);

    String payload = cifrarEEmpacotar(jsonPlanoBuffer);
    if (payload.length() > 0) {
      client.publish(TOPIC_PUBLISH_ENROLL, payload.c_str());
      Serial.printf("[enroll] Sucesso! ID_sensor=%d\n", newId);
      fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDGreen, 0);
      delay(2000);
      return true;
    }
  }

  publicarErroEnroll("falha_geral");
  fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDRed, 0);
  delay(1000);
  return false;
}

// LOGIN
void processLoginFingerprint() {
  static unsigned long ultimaTentativa = 0;
  if (millis() - ultimaTentativa < 50) return;
  ultimaTentativa = millis();

  fingerprint.ctrlLED(fingerprint.eBreathing, fingerprint.eLEDBlue, 0);

  int ret = fingerprint.collectionFingerprint(10);  // Captura rápida

  if (ret == 0) {
    Serial.println("[login] Impressão capturada → comparando...");

    // Esperar dedo solto
    unsigned long t = millis();
    while (fingerprint.detectFinger() && millis() - t < 3000) {
      client.loop();
      delay(20);
    }

    int id = fingerprint.search();

    if (id > 0 && id != ERR_ID809) {
      Serial.printf("[login] RECONHECIDO! ID=%d\n", id);
      fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDGreen, 0);

      StaticJsonDocument<128> doc;
      doc["id_sensor"] = id;
      doc["status"] = "detectado";

      String jsonStr;
      serializeJson(doc, jsonStr);
      String payload = cifrarEEmpacotar(jsonStr.c_str());
      client.publish(TOPIC_PUBLISH_LOGIN, payload.c_str());

      delay(1200);
    } else {
      Serial.println("[login] Não reconhecido");
      fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDRed, 0);
      delay(800);
    }
    fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
  }
}

// SETUP
void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");
  esp_wifi_set_ps(WIFI_PS_MIN_MODEM);
}

void reconnectMQTT() {
  while (!client.connected()) {
    if (client.connect("esp32-biometria", TOPIC_PUBLISH_STATUS, 1, true, "OFFLINE")) {
      client.publish(TOPIC_PUBLISH_STATUS, "ONLINE", true);
      client.subscribe(TOPIC_SUBSCRIBE_MODE);
      Serial.println("MQTT conectado!");
    } else {
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(2000);

  setupWiFi();
  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(mqttCallback);
  client.setBufferSize(4096);

  mySerial.begin(115200, SERIAL_8N1, RX_PIN, TX_PIN);
  fingerprint.begin(mySerial);

  while (!fingerprint.isConnected()) {
    Serial.println("Sensor não encontrado...");
    delay(2000);
  }
  Serial.println("Sensor biométrico OK!");
}

// LOOP
static unsigned long ultimoHeartbeat = 0;

void loop() {
  if (!client.connected()) reconnectMQTT();
  client.loop();

  if (millis() - ultimoHeartbeat > 5000) {
    ultimoHeartbeat = millis();
    Serial.printf("[heartbeat] modo=%s mqtt=%s heap=%u\n",
                  currentMode == MODE_ENROLL ? "ENROLL" : "IDLE",
                  client.connected() ? "ligado" : "DESLIGADO",
                  ESP.getFreeHeap());
  }

  if (currentMode != MODE_IDLE && millis() - lastModeChange > MODE_TIMEOUT_MS) {
    currentMode = MODE_IDLE;
    Serial.println("Modo timeout → IDLE");
  }

  switch (currentMode) {
    case MODE_ENROLL:
      processEnrollmentFingerprint();
      currentMode = MODE_IDLE;
      lastModeChange = millis();
      break;

    case MODE_IDLE:
      processLoginFingerprint();
      break;
  }
}