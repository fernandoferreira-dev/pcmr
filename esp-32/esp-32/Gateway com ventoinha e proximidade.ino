#include <WiFi.h>
#include <PubSubClient.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <ArduinoJson.h>
#include <mbedtls/base64.h>
#include <mbedtls/cipher.h>
#include <esp_system.h>

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

// ================= SEGURANÇA: cifra 3DES-CBC + integridade CRC32 =================

// Chave 3DES de 24 bytes — TEM de corresponder exatamente à chave
// (Base64) configurada em MQTT_CIPHER_KEY no application.properties do servidor,
// e à mesma usada no ESP32 do sensor de impressão digital.
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
  mbedtls_cipher_setkey(&ctx, CHAVE_3DES, 192, MBEDTLS_ENCRYPT);
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

  uint8_t cifrado[512];
  int tamCifrado = des3_cifrar((const uint8_t*)jsonPlano, tamPlano, iv, cifrado);

  uint32_t crc = crc32_calcular((const uint8_t*)jsonPlano, tamPlano);

  unsigned char ivB64[32];
  size_t ivB64Len;
  mbedtls_base64_encode(ivB64, sizeof(ivB64), &ivB64Len, iv, 8);
  ivB64[ivB64Len] = '\0';

  unsigned char dataB64[768];
  size_t dataB64Len;
  mbedtls_base64_encode(dataB64, sizeof(dataB64), &dataB64Len, cifrado, tamCifrado);
  dataB64[dataB64Len] = '\0';

  StaticJsonDocument<1024> envelope;
  envelope["iv"] = (char*)ivB64;
  envelope["data"] = (char*)dataB64;
  envelope["crc"] = crc;

  String resultado;
  serializeJson(envelope, resultado);
  return resultado;
}

static bool desempacotarEDecifrar(const String& envelopeJson, char* saidaJsonPlano, size_t tamSaida) {
  StaticJsonDocument<1024> doc;
  DeserializationError erro = deserializeJson(doc, envelopeJson);
  if (erro) return false;

  const char* ivB64 = doc["iv"];
  const char* dataB64 = doc["data"];
  if (!ivB64 || !dataB64) return false;
  uint32_t crcEsperado = doc["crc"];

  uint8_t iv[8];
  size_t ivLen;
  mbedtls_base64_decode(iv, sizeof(iv), &ivLen, (const unsigned char*)ivB64, strlen(ivB64));

  uint8_t cifrado[512];
  size_t cifradoLen;
  mbedtls_base64_decode(cifrado, sizeof(cifrado), &cifradoLen, (const unsigned char*)dataB64, strlen(dataB64));

  uint8_t plano[512];
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

  String payloadCifrado = cifrarEEmpacotar(buffer);
  client.publish(TOPIC_PRESENCA, payloadCifrado.c_str());
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
  client.publish(TOPIC_RELAY_WEARABLE, payloadCifrado.c_str());
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String envelope;
  for (unsigned int i = 0; i < length; i++) envelope += (char)payload[i];

  char mensagemPlano[256];
  if (!desempacotarEDecifrar(envelope, mensagemPlano, sizeof(mensagemPlano))) {
    Serial.println("✗ Falha ao decifrar/validar mensagem MQTT");
    return;
  }
  String message(mensagemPlano);

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
  client.setBufferSize(1024); // envelope cifrado é maior que o payload original

  Serial.println("GATEWAY PRONTO E MONITORIZADO");

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