#include <WiFi.h>
#include <PubSubClient.h>
#include <esp_now.h>
#include <ArduinoJson.h>

// CONFIGURAÇÕES
const char* SSID = "Vodafone-07FD83";
const char* PASSWORD = "AZEITAO2026";
const char* MQTT_BROKER = "192.168.1.72"; //85.247.43.227 - 192.168.1.72
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "esp32-node1-presenca";

const char* DEVICE_ID = "node1-presenca";

const char* TOPIC_PRESENCA = "sensors/node1/presenca";
const char* TOPIC_RELAY_WEARABLE = "sensors/wearable01/data";
char topicConfig[64];

uint8_t MAC_NODE2[] = {0x30, 0x83, 0x98, 0xef, 0x42, 0x24}; //30:83:98:ef:42:24 - Nó Sensor 1

// PINOS
#define TRIG_PIN 5
#define ECHO_PIN 18

// VENTOINHA
const int PINO_RELE = 26;
const int RELE_LIGADO = LOW;

const float TEMP_LIGAR_C = 37.0f;    // liga a ventoinha a partir desta temperatura
const float TEMP_DESLIGAR_C = 36.5f; // desliga

bool ventoinhaLigada = false;
float ultimaTemperaturaConhecida = -100.0f;

float distanciaLimiteCm = 50.0f;
unsigned long tempoConfirmacaoMs = 5000; // 5 segundos

bool presencaConfirmada = false;
unsigned long inicioDeteccao = 0;
unsigned long inicioAusencia = 0;
bool deteccaoAtivaMomentaneamente = false;

WiFiClient espClient;
PubSubClient client(espClient);

// ESTRUTURA ESP-NOW 
typedef struct struct_comando {
  int comando; // 0 = parar envio, 1 = começar a enviar
} struct_comando;

typedef struct struct_leitura_wearable {
  float temperatura;
  int bpm;
  float magnitudeG;
  int fallState;
  bool alertaQuedaAtivo;
} struct_leitura_wearable;

esp_now_peer_info_t peerNode2;

// VENTOINHA (não-bloqueante)
void ligarVentoinha() {
  if (ventoinhaLigada) return;
  pinMode(PINO_RELE, OUTPUT);
  digitalWrite(PINO_RELE, RELE_LIGADO);
  ventoinhaLigada = true;
  Serial.println("Ventoinha LIGADA (temperatura elevada)");
}

void desligarVentoinha() {
  if (!ventoinhaLigada) return;
  pinMode(PINO_RELE, INPUT);
  ventoinhaLigada = false;
  Serial.println("Ventoinha DESLIGADA");
}

void avaliarControloVentoinha(float temperaturaAtual) {
  ultimaTemperaturaConhecida = temperaturaAtual;

  if (!ventoinhaLigada && temperaturaAtual >= TEMP_LIGAR_C) {
    ligarVentoinha();
  } else if (ventoinhaLigada && temperaturaAtual <= TEMP_DESLIGAR_C) {
    desligarVentoinha();
  }
}

// LEITURA HC-SR04
float medirDistanciaCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duracao = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duracao == 0) return 9999.0f;

  return duracao * 0.0343f / 2.0f;
}

// COMANDOS ESP-NOW
void enviarComandoNode2(int comando) {
  struct_comando cmd;
  cmd.comando = comando;
  esp_now_send(MAC_NODE2, (uint8_t*)&cmd, sizeof(cmd));
}

// MQTT — publicação
void publicarPresenca(bool presente) {
  StaticJsonDocument<64> doc;
  doc["presente"] = presente;

  char buffer[64];
  serializeJson(doc, buffer, sizeof(buffer));

  if (client.publish(TOPIC_PRESENCA, buffer)) {
    Serial.print("Presença publicada: ");
    Serial.println(presente ? "presente" : "ausente");
  } else {
    Serial.println("Falha ao publicar presença");
  }
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

  if (client.publish(TOPIC_RELAY_WEARABLE, buffer)) {
    Serial.print("Relay MQTT [wearable]: ");
    Serial.println(buffer);
  } else {
    Serial.println("Falha ao publicar relay do wearable");
  }
}

// MQTT — receção de configuração
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Mensagem recebida no tópico: ");
  Serial.println(topic);

  if (String(topic) == topicConfig) {
    StaticJsonDocument<128> doc;
    DeserializationError erro = deserializeJson(doc, message);

    if (erro) {
      Serial.print("Erro ao interpretar configuração: ");
      Serial.println(erro.c_str());
      return;
    }

    if (doc.containsKey("distanciaCm")) {
      float novaDistancia = doc["distanciaCm"].as<float>();
      if (novaDistancia > 0) {
        distanciaLimiteCm = novaDistancia;
      }
    }

    if (doc.containsKey("tempoConfirmacaoSegundos")) {
      unsigned long novoTempo = doc["tempoConfirmacaoSegundos"].as<unsigned long>();
      if (novoTempo > 0) {
        tempoConfirmacaoMs = novoTempo * 1000UL;
      }
    }

    Serial.print("Configuração atualizada: distancia=");
    Serial.print(distanciaLimiteCm);
    Serial.print("cm, tempoConfirmacao=");
    Serial.print(tempoConfirmacaoMs / 1000);
    Serial.println("s");
  }
}

// CALLBACK ESP-NOW (recebe dados do Nó 2)
void onDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  if (len == sizeof(struct_leitura_wearable)) {
    struct_leitura_wearable leitura;
    memcpy(&leitura, incomingData, sizeof(leitura));

    relayLeituraWearable(leitura);
    avaliarControloVentoinha(leitura.temperatura);
  }
}

// REDE
void setupWiFi() {
  Serial.println("\nA conectar ao WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");
  Serial.print("MAC deste nó (Nó 1): ");
  Serial.println(WiFi.macAddress());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.println("A conectar ao broker MQTT...");
    if (client.connect(MQTT_CLIENT_ID)) {
      Serial.println("MQTT conectado!");
      client.subscribe(topicConfig);
      Serial.print("Subscrito ao tópico de configuração: ");
      Serial.println(topicConfig);
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

  memset(&peerNode2, 0, sizeof(peerNode2));
  memcpy(peerNode2.peer_addr, MAC_NODE2, 6);
  
  peerNode2.channel = 9; 
  
  peerNode2.encrypt = false;
  peerNode2.ifidx = WIFI_IF_STA;

  if (esp_now_add_peer(&peerNode2) != ESP_OK) {
    Serial.println("Erro ao adicionar peer Nó 2");
  }
}

// SETUP
void setup() {
  Serial.begin(115200);
  delay(1000);

  snprintf(topicConfig, sizeof(topicConfig), "sensors/%s/config", DEVICE_ID);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(PINO_RELE, INPUT);
  ventoinhaLigada = false;

  setupWiFi();
  setupEspNow();

  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(mqttCallback);

  Serial.println("NÓ 1 (Presença + Relay + Ventoinha) CONFIGURADO");
}

// LOOP PRINCIPAL
void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  float distancia = medirDistanciaCm();
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

  delay(200);
}