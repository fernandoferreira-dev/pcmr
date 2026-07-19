#include <WiFi.h>
#include <esp_wifi.h>
#include <PubSubClient.h>
#include <HardwareSerial.h>
#include <DFRobot_ID809.h>
#include <mbedtls/base64.h>
#include <ArduinoJson.h>

// CONFIGURAÇÕES
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

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];

  if (String(topic) == TOPIC_SUBSCRIBE_MODE) {
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);

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
  client.publish(TOPIC_PUBLISH_ENROLL, buf);
}

bool collectEnrollmentSamples(uint8_t samplesNeeded) {
  uint8_t captured = 0;
  unsigned long inicio = millis();

  while (captured < samplesNeeded) {
    client.loop(); // Garante processamento MQTT imediato

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

      if (client.publish(TOPIC_PUBLISH_ENROLL, jsonString)) {
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
  client.publish(TOPIC_PUBLISH_LOGIN, loginJson);

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
  
  // Sleep para poupança inteligente de energia
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
  client.setBufferSize(2048);

  mySerial.begin(115200, SERIAL_8N1, RX_PIN, TX_PIN);
  fingerprint.begin(mySerial);

  while (!fingerprint.isConnected()) {
    Serial.println("Erro: Sensor não encontrado.");
    delay(2000);
  }
  Serial.println("Sensor biométrico inicializado!");
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

  if (fingerprint.detectFinger()) {
    if (fingerprint.collectionFingerprint(/*timeout=*/1) != ERR_ID809) {
      processLoginFingerprint();

      while (fingerprint.detectFinger()) {
        delay(30);
        client.loop();
      }
    }
  }
}