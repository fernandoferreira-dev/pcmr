#include <WiFi.h>
#include <PubSubClient.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <ArduinoJson.h>

// CONFIGURAÇÕES
const char* SSID = "Vodafone-07FD83";
const char* PASSWORD = "AZEITAO2026";
const char* MQTT_BROKER = "192.168.1.72";
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "esp32-node1-presenca";

const char* DEVICE_ID = "node1-presenca";
const char* WEARABLE_DEVICE_ID = "wearable01";
const char* TOPIC_PRESENCA = "sensors/node1/presenca";
const char* TOPIC_RELAY_WEARABLE = "sensors/wearable01/data";
char topicConfig[64];
char topicStatus[64];
char topicLimiteTemperatura[64];

uint8_t MAC_NODE2[] = {0x30, 0x83, 0x98, 0xef, 0x42, 0x24}; // Wearable (Nó 2)

// PINOS HC-SR04
#define TRIG_PIN 5
#define ECHO_PIN 18

// VARIÁVEIS HC-SR04
volatile unsigned long pulseStart = 0;
volatile unsigned long pulseDuration = 0;
volatile bool pulseReady = false;

// VENTOINHA
const int PINO_RELE = 26;
const int RELE_LIGADO = LOW;

float temperaturaLigarC = 37.0f;
float temperaturaDesligarC = 36.5f;
const float MARGEM_HISTERESE_C = 0.5f;

bool ventoinhaLigada = false;
float ultimaTemperaturaConhecida = -100.0f;

// CONFIGURAÇÃO PRESENÇA
float distanciaLimiteCm = 50.0f;
unsigned long tempoConfirmacaoMs = 5000;

bool presencaConfirmada = false;
unsigned long inicioDeteccao = 0;
unsigned long inicioAusencia = 0;
bool deteccaoAtivaMomentaneamente = false;

WiFiClient espClient;
PubSubClient client(espClient);

typedef struct struct_comando {
  int comando;
} struct_comando;

typedef struct struct_leitura_wearable {
  float temperatura;
  int bpm;
  float magnitudeG;
  int fallState;
  bool alertaQuedaAtivo;
} struct_leitura_wearable;

esp_now_peer_info_t peerNode2;

void IRAM_ATTR echoISR() {
  unsigned long now = micros();
  if (digitalRead(ECHO_PIN) == HIGH) {
    pulseStart = now;
  } else {
    if (pulseStart > 0) {
      pulseDuration = now - pulseStart;
      pulseReady = true;
    }
  }
}

void ligarVentoinha() {
  if (ventoinhaLigada) return;
  pinMode(PINO_RELE, OUTPUT);
  digitalWrite(PINO_RELE, RELE_LIGADO);
  ventoinhaLigada = true;
  Serial.println("Ventoinha LIGADA");
}

void desligarVentoinha() {
  if (!ventoinhaLigada) return;
  pinMode(PINO_RELE, INPUT);
  ventoinhaLigada = false;
  Serial.println("Ventoinha DESLIGADA");
}

void avaliarControloVentoinha(float temperaturaAtual) {
  ultimaTemperaturaConhecida = temperaturaAtual;
  if (!ventoinhaLigada && temperaturaAtual >= temperaturaLigarC) {
    ligarVentoinha();
  } else if (ventoinhaLigada && temperaturaAtual <= temperaturaDesligarC) {
    desligarVentoinha();
  }
}

float lerDistanciaCm_NaoBloqueante() {
  static unsigned long ultimoDisparo = 0;
  unsigned long agora = millis();

  if (agora - ultimoDisparo >= 60) {
    ultimoDisparo = agora;
    pulseReady = false;
    pulseStart = 0;

    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
  }

  if (pulseReady) {
    pulseReady = false;
    float dist = pulseDuration * 0.0343f / 2.0f;
    return (dist > 400.0f) ? 9999.0f : dist;
  }
  return -1.0f;
}

void enviarComandoNode2(int comando) {
  struct_comando cmd;
  cmd.comando = comando;
  esp_now_send(MAC_NODE2, (uint8_t*)&cmd, sizeof(cmd));
}

void publicarPresenca(bool presente) {
  StaticJsonDocument<64> doc;
  doc["presente"] = presente;
  char buffer[64];
  serializeJson(doc, buffer, sizeof(buffer));
  client.publish(TOPIC_PRESENCA, buffer);
}

void relayLeituraWearable(const struct_leitura_wearable& leitura) {
  StaticJsonDocument<256> doc;
  doc["temperatura"] = leitura.temperatura;
  doc["bpm"] = leitura.bpm;
  doc["magnitudeG"] = leitura.magnitudeG;
  doc["fallState"] = leitura.fallState;
  doc["alertaQuedaAtivo"] = leitura.alertaQuedaAtivo;

  char buffer[256];
  serializeJson(doc, buffer, sizeof(buffer));
  client.publish(TOPIC_RELAY_WEARABLE, buffer);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];

  if (String(topic) == topicConfig) {
    StaticJsonDocument<128> doc;
    DeserializationError erro = deserializeJson(doc, message);
    if (erro) return;

    if (doc.containsKey("distanciaCm")) {
      float novaDistancia = doc["distanciaCm"].as<float>();
      if (novaDistancia > 0) distanciaLimiteCm = novaDistancia;
    }
    if (doc.containsKey("tempoConfirmacaoSegundos")) {
      unsigned long novoTempo = doc["tempoConfirmacaoSegundos"].as<unsigned long>();
      if (novoTempo > 0) tempoConfirmacaoMs = novoTempo * 1000UL;
    }
    Serial.printf("Configuração atualizada: dist=%.1fcm, tempo=%lds\n", distanciaLimiteCm, tempoConfirmacaoMs / 1000);
    return;
  }

  if (String(topic) == topicLimiteTemperatura) {
    StaticJsonDocument<64> doc;
    DeserializationError erro = deserializeJson(doc, message);
    if (erro) return;

    if (doc.containsKey("temperaturaMaxAlerta")) {
      float novoLimite = doc["temperaturaMaxAlerta"].as<float>();
      if (novoLimite > 0) {
        temperaturaLigarC = novoLimite;
        temperaturaDesligarC = novoLimite - MARGEM_HISTERESE_C;
        Serial.printf("Limite de temperatura da ventoinha atualizado: liga=%.1f°C, desliga=%.1f°C\n",
                      temperaturaLigarC, temperaturaDesligarC);
      }
    }
    return;
  }
}

void onDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  if (len == sizeof(struct_leitura_wearable)) {
    struct_leitura_wearable leitura;
    memcpy(&leitura, incomingData, sizeof(leitura));
    relayLeituraWearable(leitura);
    avaliarControloVentoinha(leitura.temperatura);
  }
}

void registrarPeerNode2Dinamico() {
  uint8_t canalReal = WiFi.channel();
  Serial.printf("\n[ESP-NOW] A configurar o Node 2 no Canal: %d\n", canalReal);

  if (esp_now_is_peer_exist(MAC_NODE2)) {
    esp_now_del_peer(MAC_NODE2);
  }

  memset(&peerNode2, 0, sizeof(peerNode2));
  memcpy(peerNode2.peer_addr, MAC_NODE2, 6);
  peerNode2.channel = canalReal;
  peerNode2.encrypt = false;
  peerNode2.ifidx = WIFI_IF_STA;

  if (esp_now_add_peer(&peerNode2) != ESP_OK) {
    Serial.println("[ESP-NOW] Erro ao registar o Nó 2!");
  } else {
    Serial.println("[ESP-NOW] Nó 2 registado com sucesso.");
  }
}

void setupWiFi() {
  Serial.println("\nA conectar ao WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");
  esp_wifi_set_ps(WIFI_PS_MIN_MODEM);
  Serial.print(">>> CANAL REAL DO ROUTER: ");
  Serial.println(WiFi.channel());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.println("A tentar conectar ao broker MQTT...");
    if (client.connect(MQTT_CLIENT_ID, topicStatus, 1, true, "OFFLINE")) {
      Serial.println("MQTT conectado!");
      client.publish(topicStatus, "ONLINE", true);
      client.subscribe(topicConfig);
      client.subscribe(topicLimiteTemperatura); // NOVO
      registrarPeerNode2Dinamico();
    } else {
      Serial.print("Falhou, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void setupEspNow() {
  if (esp_now_init() != ESP_OK) {
    Serial.println("Erro ao iniciar ESP-NOW");
    while (1) delay(1000);
  }
  esp_now_register_recv_cb(onDataRecv);

  esp_now_register_send_cb([](const wifi_tx_info_t *tx_info, esp_now_send_status_t status) {
    Serial.print("[ESP-NOW] Entrega do comando ao Wearable: ");
    Serial.println(status == ESP_NOW_SEND_SUCCESS ? "SUCESSO" : "FALHOU");
  });
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  snprintf(topicConfig, sizeof(topicConfig), "sensors/%s/config", DEVICE_ID);
  snprintf(topicStatus, sizeof(topicStatus), "sensors/%s/status", DEVICE_ID);
  snprintf(topicLimiteTemperatura, sizeof(topicLimiteTemperatura), "sensors/%s/limite-temperatura", WEARABLE_DEVICE_ID);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(ECHO_PIN), echoISR, CHANGE);

  pinMode(PINO_RELE, INPUT);
  ventoinhaLigada = false;

  setupWiFi();
  setupEspNow();
  registrarPeerNode2Dinamico();

  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(mqttCallback);

  Serial.println("GATEWAY PRONTO");
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  float distancia = lerDistanciaCm_NaoBloqueante();

  if (distancia >= 0.0f) {
    bool dentroDoAlcance = (distancia > 0 && distancia < distanciaLimiteCm);
    unsigned long agora = millis();

    if (dentroDoAlcance) {
      if (!deteccaoAtivaMomentaneamente) {
        deteccaoAtivaMomentaneamente = true;
        inicioDeteccao = agora;
      }
      inicioAusencia = 0;

      if (!presencaConfirmada && (agora - inicioDeteccao >= tempoConfirmacaoMs)) {
        presencaConfirmada = true;
        Serial.println("\n*** PACIENTE PRESENTE ***");
        publicarPresenca(true);
        enviarComandoNode2(1);
      }
    } else {
      deteccaoAtivaMomentaneamente = false;
      inicioDeteccao = 0;

      if (presencaConfirmada) {
        if (inicioAusencia == 0) {
          inicioAusencia = agora;
        } else if (agora - inicioAusencia >= tempoConfirmacaoMs) {
          presencaConfirmada = false;
          inicioAusencia = 0;
          Serial.println("\n*** PACIENTE AUSENTE ***");
          publicarPresenca(false);
          enviarComandoNode2(0);
          desligarVentoinha();
        }
      }
    }
  }
}