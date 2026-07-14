#include <WiFi.h>
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

// Tópicos MQTT
const char* TOPIC_SUBSCRIBE_MODE = "casa/biometria/comando";
const char* TOPIC_PUBLISH_ENROLL = "sensor/enroll";            
const char* TOPIC_PUBLISH_LOGIN  = "sensor/login";             

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

// Variável global para controlar o estado do sensor
volatile FingerprintMode currentMode = MODE_IDLE;

// CALLBACK MQTT
// Chamada automaticamente quando o Spring Boot envia um comando
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Mensagem recebida no tópico: ");
  Serial.println(topic);

  if (String(topic) == TOPIC_SUBSCRIBE_MODE) {
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);

    if (!error) {
      const char* modoCmd = doc["modo"];
      if (modoCmd && String(modoCmd) == "enroll") {
        currentMode = MODE_ENROLL;
        Serial.println("Comando recebido: MUDAR PARA MODO ENROLL");
      } else {
        currentMode = MODE_IDLE;
        Serial.println("Comando recebido: MUDAR PARA MODO IDLE");
      }
    } else {
      Serial.println("Erro ao interpretar JSON do comando MQTT.");
    }
  }
}

// FUNÇÕES DE APOIO MQTT

void publicarErroEnroll(const char* motivo) {
  StaticJsonDocument<128> doc;
  doc["erro"] = true;
  doc["motivo"] = motivo;

  char buf[128];
  serializeJson(doc, buf, sizeof(buf));

  if (client.publish(TOPIC_PUBLISH_ENROLL, buf)) {
    Serial.print("Publicado erro de enroll: ");
    Serial.println(motivo);
  } else {
    Serial.println("Falha ao publicar erro de enroll.");
  }
}

// FUNÇÕES DO SENSOR
bool collectEnrollmentSamples(uint8_t samplesNeeded) {
  uint8_t captured = 0;
  unsigned long inicio = millis();

  while (captured < samplesNeeded) {
    client.loop();

    if (millis() - inicio > ENROLL_TIMEOUT_TOTAL_MS) {
      Serial.println("Timeout total no processo de enroll.");
      return false;
    }

    if (currentMode != MODE_ENROLL) {
      Serial.println("Enroll cancelado externamente (mudança de modo).");
      return false;
    }

    fingerprint.ctrlLED(fingerprint.eBreathing, fingerprint.eLEDBlue, 0);
    Serial.print("A recolher amostra ");
    Serial.print(captured + 1);
    Serial.print(" de ");
    Serial.println(samplesNeeded);
    Serial.println("Pressiona o dedo no sensor...");

    if (fingerprint.collectionFingerprint(/*timeout=*/2) != ERR_ID809) {
      captured++;
      fingerprint.ctrlLED(fingerprint.eFastBlink, fingerprint.eLEDYellow, 3);
      Serial.println("Amostra capturada. Liberta o dedo.");

      while (fingerprint.detectFinger()) {
        delay(50);
        client.loop();
      }
    }
  }
  return true;
}

bool processEnrollmentFingerprint() {
  uint8_t newId = fingerprint.getEmptyID();
  if (newId == ERR_ID809) {
    Serial.println("Não existe um ID disponível para registo.");
    publicarErroEnroll("sem_id_disponivel");
    return false;
  }

  Serial.print("A registar nova impressão no ID ");
  Serial.println(newId);

  if (!collectEnrollmentSamples(ENROLL_SAMPLES)) {
    fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
    publicarErroEnroll("captura_falhada_ou_cancelada");
    return false;
  }

  if (fingerprint.storeFingerprint(newId) != ERR_ID809) {
    Serial.println("Impressão registada no sensor físico.");

    memset(enrollmentTemplateData, 0, sizeof(enrollmentTemplateData));
    if (fingerprint.getTemplate(newId, enrollmentTemplateData) != ERR_ID809) {
      fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDGreen, 0);

      // Converte para Base64
      size_t outputLength;
      mbedtls_base64_encode(base64Buffer, sizeof(base64Buffer), &outputLength,
                             enrollmentTemplateData, TEMPLATE_SIZE);
      base64Buffer[outputLength] = '\0';

      // Cria e publica o JSON de Enroll 
      StaticJsonDocument<2048> mqttDoc;
      mqttDoc["id_sensor"] = newId;
      mqttDoc["template"] = (char*)base64Buffer;
      serializeJson(mqttDoc, jsonString, sizeof(jsonString));

      Serial.println("A publicar Template no MQTT...");
      if (client.publish(TOPIC_PUBLISH_ENROLL, jsonString)) {
        Serial.println("Template publicada com sucesso!");
        delay(2000);
        fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
        return true;
      } else {
        Serial.println("Falha ao publicar template via MQTT.");
        publicarErroEnroll("falha_publicacao_mqtt");
      }
    } else {
      Serial.println("Falha ao extrair template do sensor.");
      publicarErroEnroll("falha_extracao_template");
    }
  } else {
    Serial.println("Falha ao guardar impressão no sensor.");
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
    Serial.println("Impressão não reconhecida!");
    fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDRed, 0);
    delay(1000);
    fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
    return;
  }

  Serial.print("Acesso Reconhecido (Localmente)! ID: ");
  Serial.println(id);
  fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDGreen, 0);

  // Cria e publica o JSON de Login
  StaticJsonDocument<128> mqttDoc;
  mqttDoc["id_sensor"] = id;
  mqttDoc["status"] = "detectado";

  char loginJson[128];
  serializeJson(mqttDoc, loginJson, sizeof(loginJson));

  if (client.publish(TOPIC_PUBLISH_LOGIN, loginJson)) {
    Serial.println("Evento de Login enviado via MQTT");
  } else {
    Serial.println("Erro ao enviar evento de login");
  }

  delay(2000);
  fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
}

// ================= FUNÇÕES DE REDE =================
void setupWiFi() {
  Serial.println("\nA conectar ao WiFi...");
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.println("A conectar ao broker MQTT...");
    if (client.connect("esp32-pico-fingerprint")) {
      Serial.println("MQTT conectado!");
      // Subscreve ao tópico de comandos assim que se liga!
      client.subscribe(TOPIC_SUBSCRIBE_MODE);
    } else {
      Serial.print("Falhou, erro rc=");
      Serial.print(client.state());
      Serial.println(" Nova tentativa em 5s...");
      delay(5000);
    }
  }
}

// SETUP
void setup() {
  Serial.begin(115200);
  delay(2000);

  setupWiFi();
  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(mqttCallback);
  client.setBufferSize(2048);

  Serial.println("\n=== SENSOR DFRobot ID809 ===");
  mySerial.begin(115200, SERIAL_8N1, RX_PIN, TX_PIN);
  fingerprint.begin(mySerial);

  while (!fingerprint.isConnected()) {
    Serial.println("Erro: Sensor não encontrado.");
    delay(2000);
  }
  Serial.println("✓ Sensor ligado e pronto!");
}

// LOOP
void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop(); // Mantém a ligação viva e processa mensagens recebidas

  if (currentMode == MODE_ENROLL) {
    Serial.println("\n*** MODO DE ASSOCIAÇÃO ATIVADO ***");
    processEnrollmentFingerprint();

    currentMode = MODE_IDLE;
    Serial.println("➜ A voltar ao Modo de Autenticação (IDLE)");
    return;
  }

  // Modo IDLE (Autenticação normal)
  if (fingerprint.collectionFingerprint(/*timeout=*/5) != ERR_ID809) {
    processLoginFingerprint();

    // Espera que o utilizador tire o dedo
    while (fingerprint.detectFinger()) {
      delay(50);
      client.loop();
    }
  }
}