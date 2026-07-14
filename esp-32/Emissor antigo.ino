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

uint8_t MAC_NODE1[] = {0x24, 0x0a, 0xc4, 0x09, 0x61, 0xfc}; //24:0a:c4:09:61:fc - Nó Sensor 1

typedef struct struct_message {
  float temperatura;
  int bpm;
  float magnitudeG;
  int fallState;
  bool alertaQuedaAtivo;
} struct_message;
struct_message dadosSms;
int lastFallState = 0;

typedef struct struct_comando {
  int comando; // 0 = parar, 1 = começar
} struct_comando;

esp_now_peer_info_t peerNode1;
volatile bool envioAtivo = false; 

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

#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
int numberOfDevices = 0;
DeviceAddress tempDeviceAddress;

bool conversaoTemperaturaPendente = false;
unsigned long inicioConversaoTemp = 0;
const unsigned long TEMPO_CONVERSAO_DS18B20 = 750;

#define SENSOR_PIN 34
int baseline = 0;
bool inPeak = false;
unsigned long lastBeatTime = 0;
unsigned long beatTimes[20];
int beatIndex = 0;
int beatCount = 0;
unsigned long lastBpmCalc = 0;

hw_timer_t *timerMPU = NULL;
hw_timer_t *timerPulse = NULL;
hw_timer_t *timerTemp = NULL;
hw_timer_t *timerSend = NULL;

volatile bool lerMPU = false;
volatile bool lerPulso = false;
volatile bool lerTemperatura = false;
volatile bool enviarDados_flag = false;
volatile bool resetAlerta = false;

unsigned long lastActivityTime = 0;

unsigned long ultimaLeituraValidaMpu = 0;
float ultimaMagnitudeConhecida = -1.0f;
const unsigned long TIMEOUT_MPU_MS = 8000;

void IRAM_ATTR onTimerMPU() { lerMPU = true; lastActivityTime = millis(); }
void IRAM_ATTR onTimerPulse() { lerPulso = true; }
void IRAM_ATTR onTimerTemp() { lerTemperatura = true; }
void IRAM_ATTR onTimerSend() { enviarDados_flag = true; }

void onComandoRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  if (len == sizeof(struct_comando)) {
    struct_comando cmd;
    memcpy(&cmd, incomingData, sizeof(cmd));

    if (cmd.comando == 1) {
      envioAtivo = true;
      Serial.println("\nComando START recebido do Nó 1. A enviar leituras.");
    } else {
      envioAtivo = false;
      Serial.println("\nComando STOP recebido do Nó 1. A pausar leituras.");
    }
  }
}

void setupTimersHW() {
  timerMPU = timerBegin(1000000);
  timerAttachInterrupt(timerMPU, &onTimerMPU);
  timerAlarm(timerMPU, 50000, true, 0);

  timerPulse = timerBegin(1000000);
  timerAttachInterrupt(timerPulse, &onTimerPulse);
  timerAlarm(timerPulse, 10000, true, 0);

  timerTemp = timerBegin(1000000);
  timerAttachInterrupt(timerTemp, &onTimerTemp);
  timerAlarm(timerTemp, 5000000, true, 0);

  timerSend = timerBegin(1000000);
  timerAttachInterrupt(timerSend, &onTimerSend);
  timerAlarm(timerSend, 2000000, true, 0);
}

void setupWatchdog() {
  esp_task_wdt_config_t wdt_config = {
    .timeout_ms = 10000,
    .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
    .trigger_panic = true,
  };

  esp_err_t result = esp_task_wdt_reconfigure(&wdt_config);
  if (result == ESP_ERR_NOT_FOUND) {
    esp_task_wdt_init(&wdt_config);
  }

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
  sensors.setWaitForConversion(false);
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

void setupEspNow() {
  WiFi.mode(WIFI_STA);

  esp_wifi_set_channel(9, WIFI_SECOND_CHAN_NONE); 

  if (esp_now_init() != ESP_OK) {
    Serial.println("Erro ao iniciar ESP-NOW!");
    while (1) delay(1000);
  }

  esp_now_register_recv_cb(onComandoRecv);

  memset(&peerNode1, 0, sizeof(peerNode1));
  memcpy(peerNode1.peer_addr, MAC_NODE1, 6);
  
  peerNode1.channel = 9; 
  
  peerNode1.encrypt = false;
  peerNode1.ifidx = WIFI_IF_STA;

  esp_now_add_peer(&peerNode1);
}

void verificarSaudeMpu() {
  unsigned long agora = millis();

  if (fabs(dadosSms.magnitudeG - ultimaMagnitudeConhecida) > 0.01f) {
    ultimaMagnitudeConhecida = dadosSms.magnitudeG;
    ultimaLeituraValidaMpu = agora;
  } else if (agora - ultimaLeituraValidaMpu > TIMEOUT_MPU_MS) {
    Serial.println("Erro no MPU6050. A tentar reiniciar I2C...");

    Wire.end();
    delay(50);
    Wire.begin();
    delay(50);

    if (mpu.begin()) {
      mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
      mpu.setGyroRange(MPU6050_RANGE_500_DEG);
      mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
      Serial.println("MPU6050 reiniciado com sucesso.");
    } else {
      Serial.println("Falha ao reiniciar MPU6050.");
    }

    ultimaLeituraValidaMpu = agora;
  }
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
  lastActivityTime = millis();
  ultimaLeituraValidaMpu = millis();

  Serial.println("EMISSOR COMPLETO CONFIGURADO (ESP-NOW)");
}

float getAccelMagnitude(sensors_event_t &accel) {
  float ax = accel.acceleration.x / 9.81f;
  float ay = accel.acceleration.y / 9.81f;
  float az = accel.acceleration.z / 9.81f;
  return sqrt(ax * ax + ay * ay + az * az);
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
  if (!envioAtivo) return;

  esp_now_send(MAC_NODE1, (uint8_t*)&dadosSms, sizeof(dadosSms));
  Serial.println("Dados enviados via ESP-NOW para o Nó 1");
}

void loop(void) {
  esp_task_wdt_reset();

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
  verificarSaudeMpu();
  if (lerPulso) { lerPulso = false; lerSensorPulso(); }

  if (lerTemperatura && !conversaoTemperaturaPendente) {
    lerTemperatura = false;
    sensors.requestTemperatures();
    inicioConversaoTemp = now;
    conversaoTemperaturaPendente = true;
  }

  if (conversaoTemperaturaPendente && (now - inicioConversaoTemp >= TEMPO_CONVERSAO_DS18B20)) {
    conversaoTemperaturaPendente = false;
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

  delay(1);
}