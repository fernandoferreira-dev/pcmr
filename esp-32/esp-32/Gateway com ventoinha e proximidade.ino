#include <WiFi.h>
#include <PubSubClient.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <ArduinoJson.h>

// ================= CONFIGURAÇÕES =================
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

// ================= PINOS =================
#define TRIG_PIN 5
#define ECHO_PIN 18

// ================= VARIÁVEIS INTERRUPÇÃO HC-SR04 =================
volatile unsigned long pulseStart = 0;
volatile unsigned long pulseDuration = 0;
volatile bool pulseReady = false;

// ================= VENTOINHA (agora configurável via MQTT) =================
const int PINO_RELE = 26;
const int RELE_LIGADO = LOW;

// Valores por omissão até chegar a configuração real do backend.
// A margem de histerese (0.5°C) mantém-se fixa para evitar oscilação
// liga/desliga junto ao limite.
float temperaturaLigarC = 37.0f;
float temperaturaDesligarC = 36.5f;
const float MARGEM_HISTERESE_C = 0.5f;

bool ventoinhaLigada = false;
float ultimaTemperaturaConhecida = -100.0f;

// ================= SEGURANÇA: cifra 3DES-CBC + integridade CRC32 =================

// Chave 3DES de 24 bytes — TEM de corresponder exatamente à chave
// (Base64) configurada em MQTT_CIPHER_KEY no application.properties do servidor,
// e à mesma usada no ESP32 do gateway (node1-presenca).
// Gera com: openssl rand -base64 24
// Converte para hex com: echo "<base64>" | base64 -d | xxd -p -c 24
static const unsigned char key[32] = {
0xCB, 0x54, 0x69, 0x18,
0x9D, 0x25, 0x46, 0x4C,
0x45, 0x10, 0x1D, 0xBD,
0x0B, 0xBA, 0xA6, 0x27,
0x42, 0x94, 0xDA, 0xEF,
0x2C, 0x92, 0x2C, 0x2B,
0x2B, 0x05, 0x96, 0xA6,
0x3F, 0xA3, 0xC8, 0x6B
};

// ================= CONFIGURAÇÃO DINÂMICA PRESENÇA =================
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
        Serial.printf("✓ Limite de temperatura da ventoinha atualizado: liga=%.1f°C, desliga=%.1f°C\n",
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

static int aes_cifrar(const uint8_t* entrada, size_t tamEntrada, const uint8_t iv[16], uint8_t* saida) {
mbedtls_cipher_context_t ctx;
mbedtls_cipher_init(&ctx);

const mbedtls_cipher_info_t* info = mbedtls_cipher_info_from_type(MBEDTLS_CIPHER_AES_256_CBC);
if (info == NULL) { mbedtls_cipher_free(&ctx); return 0; }

mbedtls_cipher_setup(&ctx, info);
mbedtls_cipher_setkey(&ctx, CHAVE_AES, 256, MBEDTLS_ENCRYPT); // 256 bits = 32 bytes
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

const mbedtls_cipher_info_t* info = mbedtls_cipher_info_from_type(MBEDTLS_CIPHER_AES_256_CBC);
if (info == NULL) { mbedtls_cipher_free(&ctx); return 0; }

mbedtls_cipher_setup(&ctx, info);
mbedtls_cipher_setkey(&ctx, CHAVE_AES, 256, MBEDTLS_DECRYPT);
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
uint8_t iv[16]; esp_fill_random(iv, 16);          // <-- 16 em vez de 8
uint8_t cifrado[2048];
int tamCifrado = aes_cifrar((const uint8_t*)jsonPlano, tamPlano, iv, cifrado); // <-- aes_cifrar

uint32_t crc = crc32_calcular((const uint8_t*)jsonPlano, tamPlano);

unsigned char ivB64[32], dataB64[3072]; size_t iL, dL;
mbedtls_base64_encode(ivB64, sizeof(ivB64), &iL, iv, 16);  // <-- 16
mbedtls_base64_encode(dataB64, sizeof(dataB64), &dL, cifrado, tamCifrado);

StaticJsonDocument<4096> env;
env["iv"] = String((char*)ivB64, iL);
env["data"] = String((char*)dataB64, dL);
env["crc"] = crc;

String res; serializeJson(env, res); return res;
}

static bool desempacotarEDecifrar(const String& envelopeJson, char* saida, size_t tamSaida) {
StaticJsonDocument<2048> doc;
if (deserializeJson(doc, envelopeJson)) return false;
const char* ivB64 = doc["iv"]; const char* dataB64 = doc["data"];
uint32_t crcEsperado = doc["crc"];
if (!ivB64 || !dataB64) return false;

uint8_t iv[16], cifrado[1024]; size_t iL, cL;               // <-- iv[16]
mbedtls_base64_decode(iv, 16, &iL, (const unsigned char*)ivB64, strlen(ivB64));
mbedtls_base64_decode(cifrado, sizeof(cifrado), &cL, (const unsigned char*)dataB64, strlen(dataB64));

uint8_t bufferTemp[1024];
int tamPlano = aes_decifrar(cifrado, cL, iv, bufferTemp);   // <-- aes_decifrar

if (tamPlano <= 0 || (size_t)tamPlano >= tamSaida) return false;
if (crc32_calcular(bufferTemp, tamPlano) != crcEsperado) return false;

memcpy(saida, bufferTemp, tamPlano);
saida[tamPlano] = '\0';
return true;
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

  Serial.println("GATEWAY PRONTO E MONITORIZADO");
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