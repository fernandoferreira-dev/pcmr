#include <WiFi.h>
#include <PubSubClient.h>

//CONFIGURAÇÃO
const char* SSID = "Vodafone-07FD83";
const char* PASSWORD = "AZEITAO2026";
const char* MQTT_BROKER = "192.168.1.72";
const int MQTT_PORT = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\nDEBUG");
  
  // TESTE 1: WiFi
  Serial.println("[1] Conectando WiFi...");
  WiFi.begin(SSID, PASSWORD);
  
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 30) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi conectado!");
    Serial.println("  IP: " + WiFi.localIP().toString());
    Serial.println("  SSID: " + String(WiFi.SSID()));
    Serial.println("  Sinal: " + String(WiFi.RSSI()) + " dBm");
  } else {
    Serial.println("\n✗ WiFi FALHOU!");
    while(1) delay(1000);
  }
  
  // TESTE 2: Gateway
  Serial.println("\n[2] Testando Gateway...");
  Serial.println("  Gateway: " + WiFi.gatewayIP().toString());
  
  // TESTE 3: Conectividade ao Broker (conexão raw)
  Serial.println("\n[3] Testando conectividade ao broker...");
  Serial.println("  Alvo: " + String(MQTT_BROKER) + ":" + String(MQTT_PORT));
  
  WiFiClient testClient;
  testClient.setTimeout(5000);
  
  Serial.println("  Tentando conexão raw...");
  if (testClient.connect(MQTT_BROKER, MQTT_PORT)) {
    Serial.println("  ✓ Conexão raw OK!");
    testClient.stop();
  } else {
    Serial.println("  ✗ Conexão raw FALHOU!");
  }
  
  // TESTE 4: MQTT
  Serial.println("\n[4] Tentando MQTT...");
  client.setServer(MQTT_BROKER, MQTT_PORT);
  
  Serial.println("  Conectando ao broker MQTT...");
  if (client.connect("esp32-debug")) {
    Serial.println("  ✓ MQTT conectado!");
    client.disconnect();
  } else {
    Serial.println("  ✗ MQTT FALHOU!");
    int state = client.state();
    Serial.println("  Código erro MQTT: " + String(state));
    
    if (state == -2) {
      Serial.println("  → Servidor não responde (firewall ou broker não está rodando)");
    } else if (state == -1) {
      Serial.println("  → Desconectado");
    }
  }
  
  Serial.println("\n===== FIM DEBUG =====\n");
}

void loop() {
  delay(10000);
}