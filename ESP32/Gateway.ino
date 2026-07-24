#include <WiFi.h>
#include <PubSubClient.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <ArduinoJson.h>
#include "mbedtls/cipher.h"
#include "mbedtls/base64.h"
#include <rom/crc.h>

// CONFIGURAÇÕES
const char* SSID = "Vodafone-07FD83";
const char* PASSWORD = "AZEITAO2026";
const char* MQTT_BROKER = "192.168.1.72";
const int MQTT_PORT = 1883;

String mqttClientId;

const char* DEVICE_ID = "node1-presenca";
const char* WEARABLE_DEVICE_ID = "wearable01";
const char* TOPIC_PRESENCA = "sensors/node1/presenca";
const char* TOPIC_ALERTA_QUEDA = "casa/biometria/alerta";

char TOPIC_RELAY_WEARABLE[64];
char topicConfig[64];
char topicStatus[64];
char topicRelayFan[64];
char topicLimiteTemp[64];

uint8_t MAC_NODE2[] = {0x30, 0x83, 0x98, 0xef, 0x42, 0x24};

#define TRIG_PIN 5
#define ECHO_PIN 18

// BUZZER / RELAY
#define BUZZER_PIN 25
#define RELAY_FAN_PIN 26
#define RELAY_ACTIVE_LOW true

volatile unsigned long pulseStart = 0;
volatile unsigned long pulseDuration = 0;
volatile bool pulseReady = false;

static const uint8_t aes_key[16] = {
    0x84, 0x24, 0x0b, 0x86, 0xd0, 0x93, 0x09, 0xb8,
    0x68, 0x18, 0x48, 0x96, 0x21, 0x22, 0xe2, 0xfa
};

float distanciaLimiteCm = 100.0f;
unsigned long tempoConfirmacaoMs = 5000;

bool presencaConfirmada = false;
unsigned long inicioDeteccao = 0;
unsigned long inicioAusencia = 0;
bool deteccaoAtivaMomentaneamente = false;

// Buzzer
bool buzzerAtivo = false;
unsigned long buzzerUltimoToggle = 0;
bool buzzerEstadoPino = false;
const unsigned long BUZZER_BEEP_ON_MS = 300;
const unsigned long BUZZER_BEEP_OFF_MS = 300;

// Ventoinha
float temperaturaMaxAlerta = 37.8f;
const float HISTERESE_TEMP = 1.0f;
bool ventoinhaLigada = false;

WiFiClient espClient;
PubSubClient client(espClient);

typedef struct __attribute__((packed)) struct_comando {
  int comando;
} struct_comando;

typedef struct __attribute__((packed)) struct_leitura_wearable {
  float temperatura;
  int bpm;
  float magnitudeG;
  int fallState;
  bool alertaQuedaAtivo;
} struct_leitura_wearable;

volatile bool novaLeituraWearableDisponivel = false;
struct_leitura_wearable ultimaLeituraRecebida;

esp_now_peer_info_t peerNode2;

// INTERRUPT
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

// SENSOR HC-SR04
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

bool procurarSensor() {
  Serial.println("\n[SENSOR] A procurar sensor HC-SR04...");
  unsigned long inicioBusca = millis();
  
  while (millis() - inicioBusca < 2000) {
    float dist = lerDistanciaCm_NaoBloqueante();
    if (dist > 1.5f && dist < 401.0f) {
      Serial.printf("[SENSOR] -> SUCESSO: Sensor detetado! Leitura inicial: %.2f cm\n", dist);
      return true;
    }
    delay(10);
  }
  
  Serial.println("[SENSOR] -> ERRO: Sensor não respondeu. Verifique os pinos TRIG/ECHO e a alimentação.");
  return false;
}

// ESP-NOW
void enviarComandoNode2(int comando) {
  struct_comando cmd;
  cmd.comando = comando;
  esp_now_send(MAC_NODE2, (uint8_t*)&cmd, sizeof(cmd));
}

void onDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  if (len == sizeof(struct_leitura_wearable)) {
    memcpy(&ultimaLeituraRecebida, incomingData, sizeof(ultimaLeituraRecebida));
    novaLeituraWearableDisponivel = true;
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

// CRIPTOGRAFIA
uint32_t crc32_calcular(const uint8_t *data, size_t length) {
  return crc32_le(0, data, length);
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

static String cifrarEEmpacotar(const char* jsonPlano) {
  size_t tamPlano = strlen(jsonPlano);
  uint8_t iv[16];
  esp_fill_random(iv, 16);

  uint8_t* cifrado = (uint8_t*)malloc(tamPlano + 64);
  if (!cifrado) return "";

  int tamCifrado = aes_cifrar((const uint8_t*)jsonPlano, tamPlano, iv, cifrado);
  uint32_t crc = crc32_calcular((const uint8_t*)jsonPlano, tamPlano);

  unsigned char ivB64[32], *dataB64 = (unsigned char*)malloc((tamCifrado * 3) + 32);
  if (!dataB64) {
    free(cifrado);
    return "";
  }

  size_t iL, dL;
  mbedtls_base64_encode(ivB64, sizeof(ivB64), &iL, iv, 16);
  mbedtls_base64_encode(dataB64, (tamCifrado * 3) + 32, &dL, cifrado, tamCifrado);

  StaticJsonDocument<1024> env;
  env["iv"] = String((char*)ivB64, iL);
  env["data"] = String((char*)dataB64, dL);
  env["crc"] = crc;

  String res;
  serializeJson(env, res);

  free(cifrado);
  free(dataB64);
  return res;
}

static int aes_decifrar(const uint8_t* entrada, size_t tamEntrada, const uint8_t iv[16], uint8_t* saida) {
  mbedtls_cipher_context_t ctx;
  mbedtls_cipher_init(&ctx);

  const mbedtls_cipher_info_t* info = mbedtls_cipher_info_from_type(MBEDTLS_CIPHER_AES_128_CBC);
  if (info == NULL) { mbedtls_cipher_free(&ctx); return -1; }

  mbedtls_cipher_setup(&ctx, info);
  mbedtls_cipher_setkey(&ctx, aes_key, 128, MBEDTLS_DECRYPT);
  mbedtls_cipher_set_padding_mode(&ctx, MBEDTLS_PADDING_PKCS7);
  mbedtls_cipher_set_iv(&ctx, iv, 16);
  mbedtls_cipher_reset(&ctx);

  size_t tU = 0, tF = 0;
  if (mbedtls_cipher_update(&ctx, entrada, tamEntrada, saida, &tU) != 0) {
    mbedtls_cipher_free(&ctx);
    return -1;
  }
  if (mbedtls_cipher_finish(&ctx, saida + tU, &tF) != 0) {
    mbedtls_cipher_free(&ctx);
    return -1;
  }
  mbedtls_cipher_free(&ctx);
  return (int)(tU + tF);
}

static String decifrarEnvelope(const String& envelopeJson) {
  StaticJsonDocument<1024> env;
  if (deserializeJson(env, envelopeJson)) {
    return "";
  }

  if (!env.containsKey("iv") || !env.containsKey("data") || !env.containsKey("crc")) {
    return "";
  }

  const char* ivB64 = env["iv"];
  const char* dataB64 = env["data"];
  uint32_t crcEsperado = env["crc"].as<uint32_t>();

  uint8_t iv[16];
  size_t ivLen = 0;
  if (mbedtls_base64_decode(iv, sizeof(iv), &ivLen, (const unsigned char*)ivB64, strlen(ivB64)) != 0 || ivLen != 16) {
    return "";
  }

  size_t dataB64Len = strlen(dataB64);
  uint8_t* cifrado = (uint8_t*)malloc(dataB64Len);
  if (!cifrado) return "";

  size_t dataLen = 0;
  if (mbedtls_base64_decode(cifrado, dataB64Len, &dataLen, (const unsigned char*)dataB64, dataB64Len) != 0) {
    free(cifrado);
    return "";
  }

  uint8_t* plano = (uint8_t*)malloc(dataLen + 16);
  if (!plano) {
    free(cifrado);
    return "";
  }

  int tamPlano = aes_decifrar(cifrado, dataLen, iv, plano);
  free(cifrado);

  if (tamPlano <= 0) {
    free(plano);
    return "";
  }

  uint32_t crcCalculado = crc32_calcular(plano, tamPlano);
  if (crcCalculado != crcEsperado) {
    Serial.println("[SEGURANÇA] CRC não confere — mensagem descartada.");
    free(plano);
    return "";
  }

  String resultado((char*)plano, tamPlano);
  free(plano);
  return resultado;
}

// RELAY & CONTROLES
void relaySet(int pin, bool ligar) {
  digitalWrite(pin, RELAY_ACTIVE_LOW ? (ligar ? LOW : HIGH) : (ligar ? HIGH : LOW));
}

void atualizarBuzzer() {
  if (!buzzerAtivo) {
    if (buzzerEstadoPino) {
      digitalWrite(BUZZER_PIN, LOW);
      buzzerEstadoPino = false;
    }
    return;
  }
  unsigned long agora = millis();
  unsigned long intervalo = buzzerEstadoPino ? BUZZER_BEEP_ON_MS : BUZZER_BEEP_OFF_MS;
  if (agora - buzzerUltimoToggle >= intervalo) {
    buzzerEstadoPino = !buzzerEstadoPino;
    digitalWrite(BUZZER_PIN, buzzerEstadoPino ? HIGH : LOW);
    buzzerUltimoToggle = agora;
  }
}

// Ventoinha desliga quando temperatura baixa
void avaliarVentoinha(float temperaturaAtual) {
  if (isnan(temperaturaAtual) || temperaturaAtual < 0.0f) {
    Serial.println("[RELAY] Temperatura inválida recebida!");
    return;
  }

  bool deveLigar = temperaturaAtual > temperaturaMaxAlerta;
  bool deveDesligar = temperaturaAtual < (temperaturaMaxAlerta - HISTERESE_TEMP);

  if (!ventoinhaLigada && deveLigar) {
    ventoinhaLigada = true;
    relaySet(RELAY_FAN_PIN, true);
    Serial.printf("[RELAY] Ventoinha LIGADA (%.1f°C > %.1f°C)\n", temperaturaAtual, temperaturaMaxAlerta);
  } 
  else if (ventoinhaLigada && deveDesligar) {
    ventoinhaLigada = false;
    relaySet(RELAY_FAN_PIN, false);
    Serial.printf("[RELAY] Ventoinha DESLIGADA (%.1f°C < %.1f°C)\n", 
                  temperaturaAtual, temperaturaMaxAlerta - HISTERESE_TEMP);
  }
}

// PUBLICAÇÕES MQTT
void publicarPresenca(bool presente) {
  StaticJsonDocument<64> doc;
  doc["presente"] = presente;
  char buffer[64];
  serializeJson(doc, buffer, sizeof(buffer));
  
  String payloadCifrado = cifrarEEmpacotar(buffer);
  if (payloadCifrado.length() > 0) {
    client.publish(TOPIC_PRESENCA, payloadCifrado.c_str());
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
  
  String payloadCifrado = cifrarEEmpacotar(buffer);
  if (payloadCifrado.length() > 0) {
    client.publish(TOPIC_RELAY_WEARABLE, payloadCifrado.c_str());
  }
}

// MQTT CALLBACK
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String raw;
  for (unsigned int i = 0; i < length; i++) raw += (char)payload[i];
  String t = String(topic);

  String message = decifrarEnvelope(raw);
  if (message.length() == 0) {
    Serial.println("[MQTT] Falha a decifrar mensagem recebida em: " + t);
    return;
  }

  if (t == topicConfig) {
    StaticJsonDocument<128> doc;
    if (deserializeJson(doc, message)) return;

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

  if (t == TOPIC_ALERTA_QUEDA) {
    StaticJsonDocument<128> doc;
    if (deserializeJson(doc, message)) return;
    buzzerAtivo = doc["ativo"] | false;
    Serial.printf("[BUZZER] Estado: %s\n", buzzerAtivo ? "ATIVO" : "OFF");
    return;
  }

  if (t == topicLimiteTemp) {
    StaticJsonDocument<128> doc;
    if (deserializeJson(doc, message)) return;
    if (doc.containsKey("temperaturaMaxAlerta")) {
      temperaturaMaxAlerta = doc["temperaturaMaxAlerta"].as<float>();
      Serial.printf("[VENTOINHA] Novo limite: %.1f°C\n", temperaturaMaxAlerta);
    }
    return;
  }
}

// SETUP HELPERS
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
    if (client.connect(mqttClientId.c_str(), topicStatus, 1, true, "OFFLINE")) {
      Serial.println("MQTT conectado!");
      client.publish(topicStatus, "ONLINE", true);
      
      client.subscribe(topicConfig);
      client.subscribe(TOPIC_ALERTA_QUEDA);
      client.subscribe(topicLimiteTemp);
      
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

// SETUP
void setup() {
  Serial.begin(115200);
  delay(1000);

  mqttClientId = "esp32-node1-" + String((uint32_t)ESP.getEfuseMac(), HEX);

  snprintf(topicConfig, sizeof(topicConfig), "sensors/%s/config", DEVICE_ID);
  snprintf(topicStatus, sizeof(topicStatus), "sensors/%s/status", DEVICE_ID);
  snprintf(TOPIC_RELAY_WEARABLE, sizeof(TOPIC_RELAY_WEARABLE), "sensors/%s/data", WEARABLE_DEVICE_ID);
  snprintf(topicLimiteTemp, sizeof(topicLimiteTemp), "sensors/%s/limite-temperatura", WEARABLE_DEVICE_ID);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY_FAN_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  relaySet(RELAY_FAN_PIN, false);

  attachInterrupt(digitalPinToInterrupt(ECHO_PIN), echoISR, CHANGE);

  while (!procurarSensor()) {
    Serial.println("[AVISO] A aguardar conexão do sensor HC-SR04...");
    delay(3000);
  }

  setupWiFi();
  setupEspNow();
  registrarPeerNode2Dinamico();

  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(mqttCallback);

  Serial.println("=== GATEWAY NODE1 PRONTO ===");
}

// LOOP
void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  atualizarBuzzer();

  if (novaLeituraWearableDisponivel) {
    novaLeituraWearableDisponivel = false;
    relayLeituraWearable(ultimaLeituraRecebida);
    avaliarVentoinha(ultimaLeituraRecebida.temperatura);   // ← Ventoinha desliga
  }

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
        }
      }
    }
  }
}