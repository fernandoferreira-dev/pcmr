/**
 * ESP32 + ID809 Impressão Digital + MQTT (Registo e Verificação)
 *
 * Tópicos MQTT:
 *   Publica  -> casa/biometria/acesso  (eventos: DETETADO, REGISTADO, ERRO, etc.)
 *   Subscreve -> casa/biometria/comando (comandos: REGISTAR:{userId})
 *
 * Modos:
 *   1. Normal: deteta dedo, pesquisa, publica DETETADO:{id} ou NAO_RECONHECIDO
 *   2. Registo: quando recebe REGISTAR:{id}, faz enroll e publica REGISTADO:{id}
 */

#include <HardwareSerial.h>
#include <DFRobot_ID809.h>
#include <WiFi.h>
#include <PubSubClient.h>

// ========= CONFIGURAÇÃO =========
#define RX_PIN 21
#define TX_PIN 22

const char* SSID       = "Vodafone-07FD83";
const char* PASSWORD   = "AZEITAO2026";
const char* MQTT_BROKER = "192.168.1.72";
const int   MQTT_PORT  = 1883;

const char* TOPIC_ACESSO   = "casa/biometria/acesso";
const char* TOPIC_COMANDO  = "casa/biometria/comando";

// ========= OBJETOS =========
HardwareSerial mySerial(1);
DFRobot_ID809 fingerprint;
WiFiClient espClient;
PubSubClient client(espClient);

// ========= ESTADO =========
bool enrollMode = false;      // true quando deve registar uma nova impressão
int  enrollId   = 0;          // ID a usar no registo
unsigned long enrollStartedAt = 0;

// ========= FUNÇÕES =========

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("A ligar à rede: ");
  Serial.println(SSID);

  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✓ WiFi ligado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String comando = "";
  for (unsigned int i = 0; i < length; i++) {
    comando += (char)payload[i];
  }
  comando.trim();
  Serial.print("Comando MQTT recebido: ");
  Serial.println(comando);

  // Formato: REGISTAR:<id>
  if (comando.startsWith("REGISTAR:")) {
    String idStr = comando.substring(9);
    idStr.trim();
    enrollId   = idStr.toInt();
    enrollMode = true;
    Serial.print("→ Modo REGISTO ativado para ID: ");
    Serial.println(enrollId);
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("A ligar ao MQTT...");
    String clientId = "ESP32-Biometria-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println(" ✓ Ligado!");
      // Subscrever tópico de comandos
      client.subscribe(TOPIC_COMANDO);
      Serial.print("Subscrito em: ");
      Serial.println(TOPIC_COMANDO);
    } else {
      Serial.print(" Falhou, rc=");
      Serial.print(client.state());
      Serial.println(". A tentar novamente em 5s...");
      delay(5000);
    }
  }
}

void publicar(const char* payload) {
  if (client.publish(TOPIC_ACESSO, payload)) {
    Serial.print("✓ Publicado: ");
    Serial.println(payload);
  } else {
    Serial.print("✗ Erro ao publicar: ");
    Serial.println(payload);
  }
}

// ========== REGISTO DE IMPRESSÃO DIGITAL ==========
void handleEnrollment() {
  Serial.println("A aguardar dedo para REGISTO...");
  publicar("AGUARDAR_DEDO_REGISTO");

  // O library DFRobot_ID809 faz o ciclo: capturar 1ª vez → capturar 2ª vez → comparar → guardar
  int ret = fingerprint.enrollFingerprint(enrollId);

  if (ret == 0) {
    Serial.print("✓ Impressão registada com ID: ");
    Serial.println(enrollId);

    char buf[32];
    snprintf(buf, sizeof(buf), "REGISTADO:%d", enrollId);
    publicar(buf);

    // Feedback LED Verde
    fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDGreen, 0);
    delay(2000);
    fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
  } else {
    Serial.println("✗ Erro no registo da impressão!");
    publicar("ERRO_REGISTO");

    // Feedback LED Vermelho
    fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDRed, 0);
    delay(1500);
    fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
  }

  enrollMode = false;
}

// ========== DETEÇÃO NORMAL ==========
void handleDetection() {
  // Tenta capturar a imagem do dedo (timeout = 10ms, retorna != ERR_ID809 se dedo presente)
  int captureResult = fingerprint.collectionFingerprint(/*timeout=*/10);

  if (captureResult != ERR_ID809) {
    Serial.println("Dedo detetado! A pesquisar...");

    int id = fingerprint.search(); // retorna 0 se não encontrado

    if (id != 0) {
      Serial.print("✓ Acesso Permitido! ID: ");
      Serial.println(id);

      char buf[32];
      snprintf(buf, sizeof(buf), "DETETADO:%d", id);
      publicar(buf);

      // LED Verde
      fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDGreen, 0);
      delay(2000);
      fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
    } else {
      Serial.println("✗ Impressão não reconhecida!");
      publicar("NAO_RECONHECIDO");

      // LED Vermelho
      fingerprint.ctrlLED(fingerprint.eKeepsOn, fingerprint.eLEDRed, 0);
      delay(1000);
      fingerprint.ctrlLED(fingerprint.eNormalClose, fingerprint.eLEDBlue, 0);
    }

    delay(1000); // pausa para retirar o dedo
  }
}

// ========== SETUP ==========
void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n=== SENSOR ID809 + MQTT (Registo e Verificação) ===");

  // 1. WiFi
  setup_wifi();
  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(mqttCallback);

  // 2. Sensor
  mySerial.begin(115200, SERIAL_8N1, RX_PIN, TX_PIN);
  fingerprint.begin(mySerial);

  while (!fingerprint.isConnected()) {
    Serial.println("Erro: Sensor não encontrado. Verifica ligações!");
    delay(2000);
  }
  Serial.println("✓ Sensor ligado e pronto!");
}

// ========== LOOP ==========
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  if (enrollMode) {
    handleEnrollment();
  } else {
    handleDetection();
  }
}
