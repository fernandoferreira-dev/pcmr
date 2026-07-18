#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h> 
#include <esp_sleep.h>
#include <esp_task_wdt.h>

// Nome do teu router para o Wearable procurar o canal
const char* WIFI_SSID_ALVO = "Vodafone-07FD83"; 

uint8_t MAC_NODE1[] = {0x24, 0x0a, 0xc4, 0x09, 0x61, 0xfc}; // Nó Gateway (Nó 1)

typedef struct struct_message {
  float temperatura;
  int bpm;
  float magnitudeG;
  int fallState;
  bool alertaQuedaAtivo;
} struct_message;
struct_message dadosSms;

typedef struct struct_comando {
  int comando; // 0 = parar, 1 = começar
} struct_comando;

esp_now_peer_info_t peerNode1;
volatile bool envioAtivo = false; 

// MPU-6050
Adafruit_MPU6050 mpu;
#define FREE_FALL_THRESHOLD 0.5f
#define IMPACT_THRESHOLD 2.5f
#define STILL_THRESHOLD 1.3f
#define FREE_FALL_MS 80
#define IMPACT_WINDOW_MS 500
#define STILL_WINDOW_MS 1000

enum FallState { IDLE, FREE_FALLING, IMPACT_DETECTED, CONFIRMING };
FallState fallState = IDLE;
unsigned long stateStartTime = 0;
volatile bool quedaDetectada = false;

// Sensor de Temperatura
#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
int numberOfDevices = 0;
DeviceAddress tempDeviceAddress;
unsigned long tempoConversaoTemp = 0;
bool aguardandoLeituraTemp = false;

// Sensor de Pulso Cardíaco
#define SENSOR_PIN 34
int baseline = 0;
bool inPeak = false;
unsigned long lastBeatTime = 0;
unsigned long beatTimes[20];
int beatIndex = 0;
int beatCount = 0;
unsigned long lastBpmCalc = 0;

// Temporizadores (Timers)
hw_timer_t *timerMPU = NULL;
hw_timer_t *timerPulse = NULL;
hw_timer_t *timerTemp = NULL;
hw_timer_t *timerSend = NULL;

volatile bool lerMPU = false;
volatile bool lerPulso = false;
volatile bool lerTemperatura = false;
volatile bool enviarDados_flag = false;

void IRAM_ATTR onTimerMPU() { lerMPU = true; }
void IRAM_ATTR onTimerPulse() { lerPulso = true; }
void IRAM_ATTR onTimerTemp() { lerTemperatura = true; }
void IRAM_ATTR onTimerSend() { enviarDados_flag = true; }

void onComandoRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  if (len == sizeof(struct_comando)) {
    struct_comando cmd;
    memcpy(&cmd, incomingData, sizeof(cmd));

    if (cmd.comando == 1) {
      envioAtivo = true;
      Serial.println("\n[ESP-NOW] Comando START recebido! A iniciar leituras...");
    } else {
      envioAtivo = false;
      Serial.println("\n[ESP-NOW] Comando STOP recebido. Em espera...");
    }
  }
}

void setupTimersHW() {
  timerMPU = timerBegin(1000000);
  timerAttachInterrupt(timerMPU, &onTimerMPU);
  timerAlarm(timerMPU, 50000, true, 0); // 50ms para quedas

  timerPulse = timerBegin(1000000);
  timerAttachInterrupt(timerPulse, &onTimerPulse);
  timerAlarm(timerPulse, 10000, true, 0); // 10ms para o pulso

  timerTemp = timerBegin(1000000);
  timerAttachInterrupt(timerTemp, &onTimerTemp);
  timerAlarm(timerTemp, 2000000, true, 0); // 2 segundos (Temperatura)

  timerSend = timerBegin(1000000);
  timerAttachInterrupt(timerSend, &onTimerSend);
  timerAlarm(timerSend, 1000000, true, 0); // 1 segundo para envio de dados
}

void setupWatchdog() {
  esp_task_wdt_config_t wdt_config = {
    .timeout_ms = 10000,
    .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
    .trigger_panic = true,
  };
  esp_task_wdt_reconfigure(&wdt_config);
  if (esp_task_wdt_status(NULL) == ESP_ERR_NOT_FOUND) {
    esp_task_wdt_add(NULL);
  }
}

void setupMPU() {
  if (!mpu.begin()) {
    Serial.println("Erro ao iniciar MPU-6050!");
    while (1) { delay(1000); }
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
}

void setupTemperatureSensor() {
  sensors.begin();
  sensors.setWaitForConversion(false); // Ativa modo não-bloqueante real
  numberOfDevices = sensors.getDeviceCount();
}

void setupPulseSensor() {
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  long sum = 0;
  for (int i = 0; i < 200; i++) {
    sum += analogRead(SENSOR_PIN);
    delay(10);
  }
  baseline = sum / 200;
}

int32_t obterCanalDoRouter(const char* ssid) {
  Serial.printf("A fazer varrimento para encontrar o canal de '%s'...\n", ssid);
  int n = WiFi.scanNetworks();
  for (int i = 0; i < n; i++) {
    if (WiFi.SSID(i) == ssid) {
      int32_t canalEncontrado = WiFi.channel(i);
      Serial.printf("-> Router encontrado no canal: %d\n", canalEncontrado);
      return canalEncontrado;
    }
  }
  Serial.println("-> Router não detetado no scan. A usar canal 9 por padrão.");
  return 9; 
}

void setupEspNow() {
  WiFi.mode(WIFI_STA);
  
  int32_t canalDinamico = obterCanalDoRouter(WIFI_SSID_ALVO);
  esp_wifi_set_channel(canalDinamico, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() != ESP_OK) {
    Serial.println("Erro ao iniciar ESP-NOW!");
    while (1) delay(1000);
  }

  esp_now_register_recv_cb(onComandoRecv);

  esp_now_register_send_cb([](const wifi_tx_info_t *tx_info, esp_now_send_status_t status) {
    Serial.print("[ESP-NOW] Entrega ao Gateway: ");
    Serial.println(status == ESP_NOW_SEND_SUCCESS ? "SUCESSO" : "FALHOU");
  });

  memset(&peerNode1, 0, sizeof(peerNode1));
  memcpy(peerNode1.peer_addr, MAC_NODE1, 6);
  peerNode1.channel = canalDinamico; 
  peerNode1.encrypt = false;
  peerNode1.ifidx = WIFI_IF_STA;

  esp_now_add_peer(&peerNode1);
  Serial.printf(">>> Canal ESP-NOW configurado dinamicamente para o Nó 2: %d\n", canalDinamico);
}

void setup(void) {
  Serial.begin(115200);
  delay(1000);

  setupEspNow(); 
  setupMPU();
  setupTemperatureSensor();
  setupPulseSensor();
  setupTimersHW();
  setupWatchdog();

  dadosSms.alertaQuedaAtivo = false;
  dadosSms.temperatura = 0.0f; 
  dadosSms.bpm = 0;
  dadosSms.magnitudeG = 1.0f;
  dadosSms.fallState = 0;

  Serial.println("WEARABLE PRONTO (A ESCUTAR GATEWAY NO CANAL DINÂMICO)");
}

float getAccelMagnitude(sensors_event_t &accel) {
  float ax = accel.acceleration.x / 9.81f;
  float ay = accel.acceleration.y / 9.81f;
  float az = accel.acceleration.z / 9.81f;
  return sqrt(ax * ax + ay * ay + az * az);
}

void processarDetecaoQueda() {
  sensors_event_t accel, gyro, temp;
  
  // Lê o MPU. Se falhar, apenas sai da função sem alterar a magnitude ou forçar erros
  if (!mpu.getEvent(&accel, &gyro, &temp)) {
    return;
  }
  
  dadosSms.magnitudeG = getAccelMagnitude(accel);
  unsigned long now = millis();

  switch (fallState) {
    case IDLE:
      if (dadosSms.magnitudeG < FREE_FALL_THRESHOLD) { fallState = FREE_FALLING; stateStartTime = now; }
      break;
    case FREE_FALLING:
      if (dadosSms.magnitudeG < FREE_FALL_THRESHOLD) { if ((now - stateStartTime) > IMPACT_WINDOW_MS) fallState = IDLE; break; }
      if ((now - stateStartTime) < FREE_FALL_MS) { fallState = IDLE; }
      else if (dadosSms.magnitudeG >= IMPACT_THRESHOLD) { fallState = IMPACT_DETECTED; stateStartTime = now; }
      else { fallState = IDLE; }
      break;
    case IMPACT_DETECTED:
      if (dadosSms.magnitudeG < STILL_THRESHOLD) { fallState = CONFIRMING; stateStartTime = now; }
      if ((now - stateStartTime) > STILL_WINDOW_MS) fallState = IDLE;
      break;
    case CONFIRMING:
      if ((now - stateStartTime) >= STILL_WINDOW_MS) { quedaDetectada = true; fallState = IDLE; }
      if (dadosSms.magnitudeG > STILL_THRESHOLD + 0.5f) { fallState = IDLE; }
      break;
  }
  dadosSms.fallState = (int)fallState;
}

void lerSensorPulso() {
  unsigned long now = millis();
  int raw = analogRead(SENSOR_PIN);
  baseline = baseline * 0.98 + raw * 0.02;
  int signal = raw - baseline;

  static int maxSignal = 50;
  static int minSignal = -50;
  maxSignal = maxSignal * 0.995;
  minSignal = minSignal * 0.995;

  if (signal > maxSignal) maxSignal = signal;
  if (signal < minSignal) minSignal = signal;

  int threshold = (maxSignal + minSignal) / 2;
  int hysteresis = (maxSignal - minSignal) * 0.25;
  if (hysteresis < 30) hysteresis = 30;

  if (!inPeak && signal > (threshold + hysteresis)) {
    inPeak = true;
    unsigned long beatInterval = now - lastBeatTime;
    if (beatInterval > 300 && beatInterval < 1500) {
      beatTimes[beatIndex % 20] = beatInterval;
      beatIndex++;
      if (beatCount < 20) beatCount++;
    }
    lastBeatTime = now;
  }
  else if (inPeak && signal < (threshold - hysteresis)) { inPeak = false; }

  if (now - lastBpmCalc > 1000 && beatCount > 1) {
    lastBpmCalc = now;
    long avgInterval = 0;
    int samples = min(beatCount, 8);
    for (int i = 0; i < samples; i++) { avgInterval += beatTimes[(beatIndex - 1 - i + 20) % 20]; }
    avgInterval /= samples;
    if (avgInterval > 0) {
      int bpmCalculado = 60000 / avgInterval;
      dadosSms.bpm = (bpmCalculado > 40 && bpmCalculado < 200) ? bpmCalculado : 0;
    }
  }
}

void enviarDadosESPNOW() {
  if (!envioAtivo) return;
  esp_now_send(MAC_NODE1, (uint8_t*)&dadosSms, sizeof(dadosSms));
}

void loop(void) {
  esp_task_wdt_reset();

  if (!envioAtivo && !quedaDetectada) {
    static unsigned long ultimoPrint = 0;
    if (millis() - ultimoPrint > 5000) {
      Serial.println("Aguardando comando START do Gateway (Rádio em Escuta Ativa)...");
      ultimoPrint = millis();
    }
    // Desligar os alarmes dos timers enquanto parado limpa as flags presas e evita picos ao arrancar
    lerMPU = false; lerPulso = false; lerTemperatura = false; enviarDados_flag = false;
    delay(50); 
    return;
  }

  if (quedaDetectada) {
    quedaDetectada = false;
    Serial.println("\n[ALERTA] QUEDA DETETADA! A enviar pacote de emergência...\n");
    dadosSms.alertaQuedaAtivo = true;
    enviarDadosESPNOW();
  }

  // A função verificarSaudeMpu() foi completamente removida daqui!
  if (lerMPU) { 
    lerMPU = false; 
    processarDetecaoQueda(); 
  }
  
  if (lerPulso) { 
    lerPulso = false; 
    lerSensorPulso(); 
  }

  if (lerTemperatura && !aguardandoLeituraTemp) {
    lerTemperatura = false;
    sensors.requestTemperatures();
    tempoConversaoTemp = millis();
    aguardandoLeituraTemp = true;
  }

  if (aguardandoLeituraTemp && (millis() - tempoConversaoTemp >= 750)) {
    aguardandoLeituraTemp = false;
    numberOfDevices = sensors.getDeviceCount();
    if (numberOfDevices > 0 && sensors.getAddress(tempDeviceAddress, 0)) {
      float tempLida = sensors.getTempC(tempDeviceAddress);
      if (tempLida != DEVICE_DISCONNECTED_C) {
        dadosSms.temperatura = tempLida; 
      }
    }
  }

  if (enviarDados_flag) {
    enviarDados_flag = false;
    enviarDadosESPNOW();
    
    // Reset da flag de alerta
    if (dadosSms.alertaQuedaAtivo) {
      dadosSms.alertaQuedaAtivo = false;
    }
  }

  delay(1);
}