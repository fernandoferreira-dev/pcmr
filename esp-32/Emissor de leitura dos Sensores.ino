#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <esp_sleep.h>
#include <esp_task_wdt.h>

const char* SSID = "ScoobyJew";
const char* PASSWORD = "Diggy1906RT";
const char* MQTT_BROKER = "10.124.7.243";
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "esp32-wearable-01";

const char* DEVICE_ID = "wearable01";

char topicPublicarDados[64];
char topicSubscreverComando[64];

WiFiClient espClient;
PubSubClient client(espClient);

typedef struct struct_message {
  float temperatura;
  int bpm;
  float magnitudeG;
  int fallState;
  bool alertaQuedaAtivo;
} struct_message;
struct_message dadosSms;
int lastFallState = 0;

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
const unsigned long TEMPO_CONVERSAO_DS18B20 = 750; // ms para resolução 12-bit

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
volatile bool forcarSleepEmissor = false; 

unsigned long lastActivityTime = 0;
bool dispositivoAtivo = true;

//ISRs
void IRAM_ATTR onTimerMPU() { lerMPU = true; lastActivityTime = millis(); }
void IRAM_ATTR onTimerPulse() { if (!forcarSleepEmissor) lerPulso = true; }
void IRAM_ATTR onTimerTemp() { if (!forcarSleepEmissor) lerTemperatura = true; }
void IRAM_ATTR onTimerSend() { if (!forcarSleepEmissor) enviarDados_flag = true; }

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  if (String(topic) == topicSubscreverComando) {
    StaticJsonDocument<128> doc;
    DeserializationError error = deserializeJson(doc, message);

    if (!error) {
      int comando = doc["comando"] | -1;

      if (comando == 0) {
        forcarSleepEmissor = true;
      } else if (comando == 1) {
        if (forcarSleepEmissor) {
          forcarSleepEmissor = false;
          Serial.println("\nComando de retoma recebido. Sensores ativos.");
        }
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
    Serial.println("Erro ao inicializar MPU-6050!");
    while (1) { delay(1000); }
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
}

void setupTemperatureSensor() {
  sensors.begin();
  sensors.setWaitForConversion(false); // leitura não-bloqueante
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

// FUNÇÕES DE REDE (MQTT)
void setupWiFi() {
  Serial.println("\nA conectar ao WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(WIFI_PS_MIN_MODEM);
  WiFi.begin(SSID, PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.println("A conectar ao broker MQTT...");
    if (client.connect(MQTT_CLIENT_ID)) {
      Serial.println("MQTT conectado!");
      client.subscribe(topicSubscreverComando);
    } else {
      Serial.print("Falhou, erro rc=");
      Serial.print(client.state());
      Serial.println(" Nova tentativa em 5s...");
      delay(5000);
    }
  }
}

void setup(void) {
  Serial.begin(115200);
  delay(1000);

  snprintf(topicPublicarDados, sizeof(topicPublicarDados), "sensors/%s/data", DEVICE_ID);
  snprintf(topicSubscreverComando, sizeof(topicSubscreverComando), "sensors/%s/comando", DEVICE_ID);

  setupWiFi();
  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(mqttCallback);
  client.setBufferSize(512);

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

  Serial.println("EMISSOR COMPLETO CONFIGURADO (MQTT)");
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

// Serializa em JSON e publica via MQTT
void enviarDadosMQTT() {
  StaticJsonDocument<256> doc;
  doc["temperatura"] = dadosSms.temperatura;
  doc["bpm"] = dadosSms.bpm;
  doc["magnitudeG"] = dadosSms.magnitudeG;
  doc["fallState"] = dadosSms.fallState;
  doc["alertaQuedaAtivo"] = dadosSms.alertaQuedaAtivo;

  char buffer[256];
  serializeJson(doc, buffer, sizeof(buffer));

  if (client.publish(topicPublicarDados, buffer)) {
    Serial.print("Publicado MQTT [");
    Serial.print(topicPublicarDados);
    Serial.print("]: ");
    Serial.println(buffer);
  } else {
    Serial.println("Falha ao publicar dados via MQTT");
  }
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

  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop(); // mantém a ligação MQTT viva e processa comandos recebidos

  if (forcarSleepEmissor) {
    enviarDadosMQTT();
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
    enviarDadosMQTT();
  }

  if (resetAlerta) {
    resetAlerta = false;
    dadosSms.alertaQuedaAtivo = false;
    enviarDadosMQTT();
  }

  if (lerMPU) { lerMPU = false; processarDetecaoQueda(); }
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
    enviarDadosMQTT();
  }

  verificarModoLowPower();
  delay(1);
}