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
const char* TOPIC_PUBLISH_ENROLL = "sensor/enroll";
const char* TOPIC_PUBLISH_LOGIN  = "sensor/login";
const char* TOPIC_PUBLISH_STATUS = "casa/biometria/status"; // Tópico para LWT

#define RX_PIN 4
#define TX_PIN 5

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

enum FingerprintMode {
  MODE_IDLE,
  MODE_ENROLL
};

volatile FingerprintMode currentMode = MODE_IDLE;

// ================= SEGURANÇA: cifra 3DES-CBC + integridade CRC32 =================

// Chave 3DES de 24 bytes — TEM de corresponder exatamente à chave
// (Base64) configurada em MQTT_CIPHER_KEY no application.properties do servidor,
// e à mesma usada no ESP32 do gateway (node1-presenca).
// Gera com: openssl rand -base64 24
// Converte para hex com: echo "<base64>" | base64 -d | xxd -p -c 24
static const unsigned char CHAVE_3DES[24] = {
  0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
  0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F,
  0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17
}; // <-- SUBSTITUIR pelos bytes reais da chave partilhada

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

static int des3_cifrar(const uint8_t* entrada, size_t tamEntrada, const uint8_t iv[8], uint8_t* saida) {
  mbedtls_cipher_context_t ctx;
  mbedtls_cipher_init(&ctx);

  const mbedtls_cipher_info_t* info = mbedtls_cipher_info_from_type(MBEDTLS_CIPHER_DES_EDE3_CBC);
  if (info == NULL) {
    Serial.println("✗ MBEDTLS_CIPHER_DES_EDE3_CBC indisponível neste build!");
    mbedtls_cipher_free(&ctx);
    return 0;
  }

  mbedtls_cipher_setup(&ctx, info);
  mbedtls_cipher_setkey(&ctx, CHAVE_3DES, 192, MBEDTLS_ENCRYPT); // 192 bits = 24 bytes
  mbedtls_cipher_set_padding_mode(&ctx, MBEDTLS_PADDING_PKCS7);

  size_t tamSaida = 0;
  int ret = mbedtls_cipher_crypt(&ctx, iv, 8, entrada, tamEntrada, saida, &tamSaida);
  if (ret != 0) {
    Serial.printf("✗ Erro mbedtls_cipher_crypt (cifrar): -0x%04x\n", -ret);
  }

  mbedtls_cipher_free(&ctx);
  return (int)tamSaida;
}

static int des3_decifrar(const uint8_t* entrada, size_t tamEntrada, const uint8_t iv[8], uint8_t* saida) {
  mbedtls_cipher_context_t ctx;
  mbedtls_cipher_init(&ctx);

  const mbedtls_cipher_info_t* info = mbedtls_cipher_info_from_type(MBEDTLS_CIPHER_DES_EDE3_CBC);
  if (info == NULL) {
    Serial.println("✗ MBEDTLS_CIPHER_DES_EDE3_CBC indisponível neste build!");
    mbedtls_cipher_free(&ctx);
    return 0;
  }

  mbedtls_cipher_setup(&ctx, info);
  mbedtls_cipher_setkey(&ctx, CHAVE_3DES, 192, MBEDTLS_DECRYPT);
  mbedtls_cipher_set_padding_mode(&ctx, MBEDTLS_PADDING_PKCS7);

  size_t tamSaida = 0;
  int ret = mbedtls_cipher_crypt(&ctx, iv, 8, entrada, tamEntrada, saida, &tamSaida);
  if (ret != 0) {
    Serial.printf("✗ Erro mbedtls_cipher_crypt (decifrar): -0x%04x\n", -ret);
  }

  mbedtls_cipher_free(&ctx);
  return (int)tamSaida;
}

static String cifrarEEmpacotar(const char* jsonPlano) {
  size_t tamPlano = strlen(jsonPlano);
  uint8_t iv[8];
  esp_fill_random(iv, 8);

  uint8_t cifrado[2048];
  int tamCifrado = des3_cifrar((const uint8_t*)jsonPlano, tamPlano, iv, cifrado);

  uint32_t crc = crc32_calcular((const uint8_t*)jsonPlano, tamPlano);

  unsigned char ivB64[32];
  size_t ivB64Len;
  mbedtls_base64_encode(ivB64, sizeof(ivB64), &ivB64Len, iv, 8);
  ivB64[ivB64Len] = '\0';

  unsigned char dataB64[3072];
  size_t dataB64Len;
  mbedtls_base64_encode(dataB64, sizeof(dataB64), &dataB64Len, cifrado, tamCifrado);
  dataB64[dataB64Len] = '\0';

  StaticJsonDocument<4096> envelope;
  envelope["iv"] = (char*)ivB64;
  envelope["data"] = (char*)dataB64;
  envelope["crc"] = crc;

  String resultado;
  serializeJson(envelope, resultado);
  return resultado;
}

static bool desempacotarEDecifrar(const String& envelopeJson, char* saidaJsonPlano, size_t tamSaida) {
  StaticJsonDocument<2048> doc;
  DeserializationError erro = deserializeJson(doc, envelopeJson);
  if (erro) return false;

  const char* ivB64 = doc["iv"];
  const char* dataB64 = doc["data"];
  if (!ivB64 || !dataB64) return false;
  uint32_t crcEsperado = doc["crc"];

  uint8_t iv[8];
  size_t ivLen;
  mbedtls_base64_decode(iv, sizeof(iv), &ivLen, (const unsigned char*)ivB64, strlen(ivB64));

  uint8_t cifrado[1024];
  size_t cifradoLen;
  mbedtls_base64_decode(cifrado, sizeof(cifrado), &cifradoLen, (const unsigned char*)dataB64, strlen(dataB64));

  uint8_t plano[1024];
  int tamPlano = des3_decifrar(cifrado, cifradoLen, iv, plano);

  uint32_t crcCalculado = crc32_calcular(plano, tamPlano);
  if (crcCalculado != crcEsperado) {
    Serial.println("✗ CRC32 inválido — mensagem rejeitada (integridade comprometida)");
    return false;
  }

  if ((size_t)tamPlano >= tamSaida) return false;
  memcpy(saidaJsonPlano, plano, tamPlano);
  saidaJsonPlano[tamPlano] = '\0';
  return true;
}

// ===================================================================================

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String envelope;
  for (unsigned int i = 0; i < length; i++) envelope += (char)payload[i];

  if (String(topic) == TOPIC_SUBSCRIBE_MODE) {
    char mensagemPlano[256];
    if (!desempacotarEDecifrar(envelope, mensagemPlano, sizeof(mensagemPlano))) {
      Serial.println("✗ Falha ao decifrar/validar comando MQTT");
      return;
    }

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, mensagemPlano);

    if (!error) {
      const char* modoCmd = doc["modo"];
      if (modoCmd && String(modoCmd) == "enroll") {
        currentMode = MODE_ENROLL;
        Serial.println("➜ Modo alterado para: ENROLL");
      } else {
        currentMode = MODE_IDLE;
        Serial.println("➜ Modo alterado para: LOGIN (IDLE)");
      }
    }
  }
}

void publicarErroEnroll(const char* motivo) {
  StaticJsonDocument<128> doc;
  doc["erro"] = true;
  doc["motivo"] = motivo;

  char buf[128];
  serializeJson(doc, buf, sizeof(buf));

  String payloadCifrado = cifrarEEmpacotar(buf);
  client.publish(TOPIC_PUBLISH_ENROLL, payloadCifrado.c_str());
}

bool collectEnrollmentSamples(uint8_t samplesNeeded) {
  uint8_t captured = 0;
  unsigned long inicio = millis();

  while (captured < samplesNeeded) {
    client.loop(); // Garante processamento MQTT imediato durante a captura

    if (millis() - inicio > ENROLL_TIMEOUT_TOTAL_MS) {
      return false;
    }
    if (currentMode != MODE_ENROLL) {
      return false;
    }

    fingerprint.ctrlLED(fingerprint.eBreathing, fingerprint.eLEDBlue, 0);
    Serial.printf("A colher amostra %d de %d...\n", captured + 1, samplesNeeded);

    // Timeout de apenas 1 segundo para manter o loop reativo
    if (fingerprint.collectionFingerprint(/*timeout=*/1) != ERR_ID809) {
      captured++;
      fingerprint.ctrlLED(fingerprint.eFastBlink, fingerprint.eLEDYellow, 3);
      Serial.println("Amostra capturada. Solte o dedo.");

      while (fingerprint.detectFinger()) {
        delay(30);
        client.loop();
      }
    }
  }
  return true;
}

bool processEnrollmentFingerprint() {
  uint8_t newId = fingerprint.getEmptyID();
  if (newId == ERR_ID809) {
    publicarErroEnroll("sem_id_disponivel");
    return false;
  }

  if (!collectEnrollmentSamples(ENROLL_SAMPLES)) {
    fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
    publicarErroEnroll("captura_falhada_ou_cancelada");
    return false;
  }

  if (fingerprint.storeFingerprint(newId) != ERR_ID809) {
    memset(enrollmentTemplateData, 0, sizeof(enrollmentTemplateData));
    if (fingerprint.getTemplate(newId, enrollmentTemplateData) != ERR_ID809) {
      fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDGreen, 0);

      size_t outputLength;
      mbedtls_base64_encode(base64Buffer, sizeof(base64Buffer), &outputLength,
                             enrollmentTemplateData, TEMPLATE_SIZE);
      base64Buffer[outputLength] = '\0';

      StaticJsonDocument<2048> mqttDoc;
      mqttDoc["id_sensor"] = newId;
      mqttDoc["template"] = (char*)base64Buffer;
      serializeJson(mqttDoc, jsonString, sizeof(jsonString));

      String payloadCifrado = cifrarEEmpacotar(jsonString);

      if (client.publish(TOPIC_PUBLISH_ENROLL, payloadCifrado.c_str())) {
        delay(2000);
        fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
        return true;
      } else {
        publicarErroEnroll("falha_publicacao_mqtt");
      }
    } else {
      publicarErroEnroll("falha_extracao_template");
    }
  } else {
    publicarErroEnroll("falha_gravacao_sensor");
  }

  fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDRed, 0);
  delay(1000);
  fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
  return false;
}

void processLoginFingerprint() {
  int id = fingerprint.search();
  if (id == 0) {
    fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDRed, 0);
    delay(1000);
    fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
    return;
  }

  fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDGreen, 0);

  StaticJsonDocument<128> mqttDoc;
  mqttDoc["id_sensor"] = id;
  mqttDoc["status"] = "detectado";

  char loginJson[128];
  serializeJson(mqttDoc, loginJson, sizeof(loginJson));

  String payloadCifrado = cifrarEEmpacotar(loginJson);
  client.publish(TOPIC_PUBLISH_LOGIN, payloadCifrado.c_str());

  delay(2000);
  fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
}

void setupWiFi() {
  Serial.println("\nA conectar ao WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✓ WiFi conectado!");

  // Ativa Modem Sleep automático para poupança inteligente de energia
  esp_wifi_set_ps(WIFI_PS_MIN_MODEM);
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.println("A conectar ao broker MQTT...");

    // REGISTO DO LWT (Last Will & Testament)
    if (client.connect("esp32-pico-fingerprint", TOPIC_PUBLISH_STATUS, 1, true, "OFFLINE")) {
      Serial.println("✓ MQTT conectado!");
      client.publish(TOPIC_PUBLISH_STATUS, "ONLINE", true);
      client.subscribe(TOPIC_SUBSCRIBE_MODE);
    } else {
      Serial.print("✗ Falhou, rc=");
      Serial.print(client.state());
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
  client.setBufferSize(4096); // aumentado: envelope cifrado + base64 é maior que o payload original

  mySerial.begin(115200, SERIAL_8N1, RX_PIN, TX_PIN);
  fingerprint.begin(mySerial);

  while (!fingerprint.isConnected()) {
    Serial.println("Erro: Sensor não encontrado.");
    delay(2000);
  }
  Serial.println("✓ Sensor biométrico inicializado!");

  // Verificação de disponibilidade do 3DES neste build do core
  if (mbedtls_cipher_info_from_type(MBEDTLS_CIPHER_DES_EDE3_CBC) == NULL) {
    Serial.println("✗✗✗ AVISO: 3DES indisponível neste build do mbedtls! ✗✗✗");
  } else {
    Serial.println("✓ 3DES disponível — cifra ativa.");
  }
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  if (currentMode == MODE_ENROLL) {
    Serial.println("\n*** INICIAR PROCESSO DE ENROLLMENT ***");
    processEnrollmentFingerprint();
    currentMode = MODE_IDLE;
    return;
  }

  // OTIMIZAÇÃO CRÍTICA (NÃO BLOQUEANTE):
  // Em vez de chamar o scan do sensor com timeout (que congela a rede e o MQTT),
  // primeiro verificamos instantaneamente se o dedo está fisicamente encostado.
  if (fingerprint.detectFinger()) {
    // Só aciona o processador do sensor se houver um dedo presente!
    // Usamos um timeout extremamente curto de 1 segundo
    if (fingerprint.collectionFingerprint(/*timeout=*/1) != ERR_ID809) {
      processLoginFingerprint();

      // Aguarda libertação de forma não bloqueante para o processamento de pacotes MQTT
      while (fingerprint.detectFinger()) {
        delay(30);
        client.loop();
      }
    }
  }
}