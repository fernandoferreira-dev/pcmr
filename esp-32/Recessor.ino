#include <WiFi.h>
#include <PubSubClient.h>
#include <esp_now.h>
#include <ArduinoJson.h>

// ================= CONFIGURAÇÕES =================
const char* SSID = "ScoobyJew";
const char* PASSWORD = "Diggy1906RT";
const char* MQTT_BROKER = "10.124.7.243";
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "esp32-node1-presenca";

const char* TOPIC_PRESENCA = "sensors/node1/presenca";
const char* TOPIC_RELAY_WEARABLE = "sensors/wearable01/data"; // mesmo tópico que o backend já escuta

// ⚠️ SUBSTITUI pelo MAC real do Nó 2 quando o tiveres
uint8_t MAC_NODE2[] = {0xXX, 0xXX, 0xXX, 0xXX, 0xXX, 0xXX};

// ================= PINOS =================
#define TRIG_PIN 5
#define ECHO_PIN 18

// ================= VENTOINHA (RELÉ) =================
const int PINO_RELE = 26;      // GPIO ligado ao IN1 do módulo de relé (canal 1)
const int RELE_LIGADO = LOW;   // Módulo é Active LOW (liga com 0V)

const float TEMP_LIGAR_C = 37.0f;    // liga a ventoinha a partir desta temperatura
const float TEMP_DESLIGAR_C = 36.5f; // só desliga abaixo desta (histerese, evita "tremer")

bool ventoinhaLigada = false;
float ultimaTemperaturaConhecida = -100.0f; // valor inválido inicial, para nunca ligar sem dados reais

// ================= DISTÂNCIA / PRESENÇA =================
const float DISTANCIA_LIMITE_CM = 1000.0f; // 10 metros
const unsigned long TEMPO_CONFIRMACAO_MS = 10000; // 10 segundos

bool presencaConfirmada = false;
unsigned long inicioDeteccao = 0;
unsigned long inicioAusencia = 0;
bool deteccaoAtivaMomentaneamente = false;

WiFiClient espClient;
PubSubClient client(espClient);

// ================= ESTRUTURA ESP-NOW =================
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

// MQTT
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
  peerNode2.channel = 0;
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

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(PINO_RELE, INPUT);
  ventoinhaLigada = false;

  setupWiFi();
  setupEspNow();

  client.setServer(MQTT_BROKER, MQTT_PORT);

  Serial.println("NÓ 1 (Presença + Relay + Ventoinha) CONFIGURADO");
}
//Loop Principal
void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  float distancia = medirDistanciaCm();
  bool dentroDoAlcance = (distancia > 0 && distancia < DISTANCIA_LIMITE_CM);
  unsigned long agora = millis();

  if (dentroDoAlcance) {
    if (!deteccaoAtivaMomentaneamente) {
      deteccaoAtivaMomentaneamente = true;
      inicioDeteccao = agora;
    }
    inicioAusencia = 0; // reset do temporizador de ausência

    if (!presencaConfirmada && (agora - inicioDeteccao >= TEMPO_CONFIRMACAO_MS)) {
      presencaConfirmada = true;
      Serial.println("\n*** PACIENTE PRESENTE (confirmado após 10s) ***");
      publicarPresenca(true);
      enviarComandoNode2(1); 
    }
  } else {
    deteccaoAtivaMomentaneamente = false;
    inicioDeteccao = 0;

    if (presencaConfirmada) {
      if (inicioAusencia == 0) {
        inicioAusencia = agora;
      } else if (agora - inicioAusencia >= TEMPO_CONFIRMACAO_MS) {
        presencaConfirmada = false;
        inicioAusencia = 0;
        Serial.println("\n*** PACIENTE AUSENTE (confirmado após 10s) ***");
        publicarPresenca(false);
        enviarComandoNode2(0);

        desligarVentoinha();
      }
    }
  }

  delay(200); // ~5 leituras/segundo do HC-SR04
}