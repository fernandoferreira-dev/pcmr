
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <esp_now.h>
#include <WiFi.h>
#include <esp_sleep.h>
#include <esp_task_wdt.h>

//ENDEREÇO MAC DO RECETOR
uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

//ESTRUTURA DE DADOS ENVIADA
typedef struct struct_message {
  float temperatura;
  int bpm;
  float magnitudeG;
  int fallState;
  bool alertaQuedaAtivo;
} struct_message;
struct_message dadosSms;
int lastFallState = 0;

//ESTRUTURA DE DADOS RECEBIDA
typedef struct struct_command {
  int comando; // 0 = Dormir, 1 = Acordar
} struct_command;
struct_command comandoRecebido;

//TEMPORIZAÇÃO DO ALERTA DE QUEDA
unsigned long tempoAlertaQueda = 0;
const unsigned long TIMEOUT_ALERTA_MS = 10000;

//MPU-6050
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

//DS18B20
#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
int numberOfDevices = 0;
DeviceAddress tempDeviceAddress;

//CONFIGURAÇÃO KY-039
#define SENSOR_PIN 34
int baseline = 0;
bool inPeak = false;
unsigned long lastBeatTime = 0;
unsigned long beatTimes[20];
int beatIndex = 0;
int beatCount = 0;
unsigned long lastBpmCalc = 0;

//TIMERS DE HARDWARE
hw_timer_t *timerMPU = NULL;        
hw_timer_t *timerPulse = NULL;      
hw_timer_t *timerTemp = NULL;       
hw_timer_t *timerSend = NULL;       

//FLAGS
volatile bool lerMPU = false;
volatile bool lerPulso = false;
volatile bool lerTemperatura = false;
volatile bool enviarDados_flag = false;
volatile bool resetAlerta = false;
volatile bool forcarSleepEmissor = false; // Flag controlada remotamente

unsigned long lastActivityTime = 0;
bool dispositivoAtivo = true;

//ISRs
void IRAM_ATTR onTimerMPU() { lerMPU = true; lastActivityTime = millis(); }
void IRAM_ATTR onTimerPulse() { if (!forcarSleepEmissor) lerPulso = true; }
void IRAM_ATTR onTimerTemp() { if (!forcarSleepEmissor) lerTemperatura = true; }
void IRAM_ATTR onTimerSend() { if (!forcarSleepEmissor) enviarDados_flag = true; }

//CALLBACK DE RECEPÇÃO ESP-NOW
void OnDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  if (len >= sizeof(comandoRecebido)) {
    memcpy(&comandoRecebido, incomingData, sizeof(comandoRecebido));
    
    if (comandoRecebido.comando == 0) {
      forcarSleepEmissor = true;
    } 
    else if (comandoRecebido.comando == 1) {
      if (forcarSleepEmissor) {
        forcarSleepEmissor = false;
        Serial.println("\nMovimento detectado no recetor! Retomando sensores.");
      }
    }
  }
}

void setupTimersHW() {
  timerMPU = timerBegin(1000000);
  timerAttachInterrupt(timerMPU, &onTimerMPU);
  timerAlarm(timerMPU, 50000, true, 0); // 50ms

  timerPulse = timerBegin(1000000);
  timerAttachInterrupt(timerPulse, &onTimerPulse);
  timerAlarm(timerPulse, 10000, true, 0); // 10ms

  timerTemp = timerBegin(1000000);
  timerAttachInterrupt(timerTemp, &onTimerTemp);
  timerAlarm(timerTemp, 5000000, true, 0); // 5s

  timerSend = timerBegin(1000000);
  timerAttachInterrupt(timerSend, &onTimerSend);
  timerAlarm(timerSend, 2000000, true, 0); // 2s
}

void setupWatchdog() {
  esp_task_wdt_config_t wdt_config = {
    .timeout_ms = 10000,
    .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
    .trigger_panic = true,
  };
  esp_task_wdt_init(&wdt_config);
  esp_task_wdt_add(NULL);
}

void setupMPU() {
  if (!mpu.begin()) {
    Serial.println("✗ Erro ao inicializar MPU-6050!");
    while(1) { delay(1000); }
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
}

void setupTemperatureSensor() {
  sensors.begin();
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

void setup(void) {
  Serial.begin(115200);
  delay(1000);

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(WIFI_PS_MIN_MODEM);

  if (esp_now_init() != ESP_OK) {
    while(1) { delay(1000); }
  }

  esp_now_register_recv_cb(OnDataRecv);

  esp_now_peer_info_t peerInfo;
  memset(&peerInfo, 0, sizeof(peerInfo));
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  peerInfo.ifidx = WIFI_IF_STA;
  esp_now_add_peer(&peerInfo);

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
  lastActivityTime = millis();

  Serial.println("✓ EMISSOR COMPLETO CONFIGURADO");
}

float getAccelMagnitude(sensors_event_t &accel) {
  float ax = accel.acceleration.x / 9.81f;
  float ay = accel.acceleration.y / 9.81f;
  float az = accel.acceleration.z / 9.81f;
  return sqrt(ax*ax + ay*ay + az*az);
}

void processarDetecaoQueda() {
  sensors_event_t accel, gyro, temp;
  mpu.getEvent(&accel, &gyro, &temp);
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

  if (now - lastBpmCalc > 2000 && beatCount > 1) {
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
  esp_now_send(broadcastAddress, (uint8_t *)&dadosSms, sizeof(dadosSms));
}

void verificarModoLowPower() {
  unsigned long now = millis();
  if ((now - lastActivityTime) > 30000 && !dadosSms.alertaQuedaAtivo && dadosSms.bpm == 0) {
    dispositivoAtivo = false;
  } else {
    dispositivoAtivo = true;
  }
}

void loop(void) {
  esp_task_wdt_reset(); 

  if (forcarSleepEmissor) {
    esp_now_send(broadcastAddress, (uint8_t *)&dadosSms, sizeof(dadosSms));
    delay(25); 

    if (forcarSleepEmissor) {
      esp_sleep_enable_timer_wakeup(1000000); 
      esp_light_sleep_start();
      return; 
    }
  }

  unsigned long now = millis();

  if (quedaDetectada) {
    quedaDetectada = false;
    Serial.println("\nQUEDA DETETADA!\n");
    dadosSms.alertaQuedaAtivo = true;
    tempoAlertaQueda = now;
    enviarDadosESPNOW();
  }

  if (resetAlerta) {
    resetAlerta = false;
    dadosSms.alertaQuedaAtivo = false;
    enviarDadosESPNOW();
  }

  if (lerMPU) { lerMPU = false; processarDetecaoQueda(); }
  if (lerPulso) { lerPulso = false; lerSensorPulso(); }

  if (lerTemperatura) {
    lerTemperatura = false;
    sensors.requestTemperatures();
    numberOfDevices = sensors.getDeviceCount();
    if (numberOfDevices > 0 && sensors.getAddress(tempDeviceAddress, 0)) {
      float tempLida = sensors.getTempC(tempDeviceAddress);
      dadosSms.temperatura = (tempLida == DEVICE_DISCONNECTED_C) ? 0.0f : tempLida;
    } else {
      dadosSms.temperatura = 0.0f;
    }
  }

  if (enviarDados_flag) {
    enviarDados_flag = false;
    enviarDadosESPNOW();
  }

  verificarModoLowPower();
  delay(1); 
}