#include <WiFi.h>
#include <esp_now.h>
#include <esp_sleep.h>

// PINOS HC-SR04
#define TRIG_PIN 5
#define ECHO_PIN 18

#define DISTANCE_THRESHOLD 100     
#define TIMEOUT_INATIVIDADE 7000   
#define SLEEP_POLLING_TIME 1000000

//DADOS RECEBIDOS DO EMISSOR
typedef struct struct_message {
  float temperatura;
  int bpm;
  float magnitudeG;
  int fallState;
  bool alertaQuedaAtivo;
} struct_message;
struct_message dadosRecebidos;

typedef struct struct_command {
  int comando; // 0 = Dormir, 1 = Acordar
} struct_command;
struct_command comandoSend;

uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
esp_now_peer_info_t peerInfo;

unsigned long lastDetectionTime = 0;
bool presencaDetectada = true;

// CALLBACK DE RECEPÇÃO ESP-NOW (RESPONDE AO PING DO EMISSOR)
void OnDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  comandoSend.comando = presencaDetectada ? 1 : 0;
  esp_now_send(broadcastAddress, (uint8_t *) &comandoSend, sizeof(comandoSend));

  if (!presencaDetectada) return;

  if (len >= sizeof(dadosRecebidos)) {
    memcpy(&dadosRecebidos, incomingData, sizeof(dadosRecebidos));
    Serial.printf("[DADOS RECEBIDOS] T:%.1f°C | BPM:%d | G:%.2fg | Queda:%s\n", 
                  dadosRecebidos.temperatura, dadosRecebidos.bpm, 
                  dadosRecebidos.magnitudeG, dadosRecebidos.alertaQuedaAtivo ? "SIM" : "NAO");
  }
}

// Sensor Ultra-Sónico
float lerDistancia() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); 
  if (duration == 0) return 999.0;
  
  return (duration * 0.0343) / 2.0;
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(WIFI_PS_MIN_MODEM);

  if (esp_now_init() != ESP_OK) {
    Serial.println("Erro ao iniciar ESP-NOW");
    return;
  }

  // Registra o callback de recepção
  esp_now_register_recv_cb(OnDataRecv);

  // Configurar nó de comunicação via Broadcast
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  peerInfo.ifidx = WIFI_IF_STA;
  esp_now_add_peer(&peerInfo);

  lastDetectionTime = millis();
  Serial.println("RECETOR PRONTO");
}

void loop() {
  float distancia = lerDistancia();
  unsigned long now = millis();

  // Se algo for detectado
  if (distancia > 0 && distancia <= DISTANCE_THRESHOLD) {
    lastDetectionTime = now;
    
    if (!presencaDetectada) {
      presencaDetectada = true;
      Serial.println("\nALGO DETECTADO À FRENTE! Sistema Ativo.");
    }
  } 
  // Se o sensor ficar vazio
  else {
    if ((now - lastDetectionTime) > TIMEOUT_INATIVIDADE) {
      if (presencaDetectada) {
        presencaDetectada = false;
        Serial.println("\n7s sem presença. Entrando em modo de economia...");
      }

      // Micro sleep de 1 segundo
      esp_sleep_enable_timer_wakeup(SLEEP_POLLING_TIME);
      esp_light_sleep_start();
    }
  }

  delay(60);
}