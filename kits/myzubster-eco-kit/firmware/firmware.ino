// MyZubster Eco-Mode firmware (issue #71): energy-saving mode for a modular robot.
// Power management (ESP32 sleep) + motor idle/standby + ADC energy estimate.
// No WiFi / BT / signing. `notifyMyzubster()` is a deliberate no-op stub - the upstream
// notification hook is wired downstream (see docs/notification-architecture.md); this
// sketch only keeps a local status string, never sends keys or signs anything.
//
// The strategy mirrors firmware/lib/eco/eco.js (decideSleep / motorStandby / rampDown /
// accumulateEnergy), which is unit-tested with jest.
#include <Arduino.h>

// ---- Pin map (ESP32 DevKit V1) ----
constexpr int PIN_MOTOR_PWM  = 18;   // DRV8833 AIN1 (ledc PWM)
constexpr int PIN_MOTOR_DIR  = 19;   // DRV8833 AIN2 (direction)
constexpr int PIN_MOTOR_EN   = 23;   // DRV8833 nSleep / EN (HIGH = enabled)
constexpr int PIN_SENSE_ADC  = 34;   // current-sense (input-only, ADC1_CH6)
constexpr int PIN_STATUS_LED = 2;    // on-board LED
constexpr int PIN_WAKE_BTN   = 0;    // BOOT button = wake source (active LOW, RTC GPIO)

// ---- Sleep / idle thresholds (ms) - keep in sync with eco.js DEFAULTS ----
constexpr uint64_t LIGHT_SLEEP_MS = 10ULL * 1000ULL;   // 10 s
constexpr uint64_t DEEP_SLEEP_MS  = 60ULL * 1000ULL;   // 60 s
constexpr uint64_t MOTOR_IDLE_MS  = 3ULL  * 1000ULL;   // 3 s

// ---- PWM ----
constexpr int LEDC_CH = 0;
constexpr int LEDC_RES = 8;          // 0..255 duty
constexpr int LEDC_FREQ = 20000;
constexpr int RAMP_STEPS = 8;

// ---- Energy accumulator (fixed-point, microJoules) ----
constexpr uint32_t VCC_MV   = 3300;          // nominal rail
constexpr float    SHUNT_OHMS = 0.1f;         // current-sense shunt
constexpr float    ADC_GAIN = 1.0f;           // ADC -> mV across shunt (calibrate)
static uint64_t totalMicroJoules = 0;
static uint32_t lastAccountedMs = 0;

// ---- Activity tracking ----
static uint32_t lastActivityMs = 0;
static int currentDuty = 0;          // 0..255

static void motorStandby() {
  for (int i = RAMP_STEPS; i >= 0; i--) {
    int v = (currentDuty * i) / RAMP_STEPS;
    ledcWrite(LEDC_CH, v);
    delay(10);
  }
  digitalWrite(PIN_MOTOR_EN, LOW);  // nSleep low = driver off
  currentDuty = 0;
}

static void motorRun(int duty, bool forward) {
  digitalWrite(PIN_MOTOR_EN, HIGH);
  digitalWrite(PIN_MOTOR_DIR, forward ? HIGH : LOW);
  int d = duty < 0 ? 0 : (duty > 255 ? 255 : duty);
  ledcWrite(LEDC_CH, d);
  currentDuty = d;
  lastActivityMs = millis();
}

// Upstream MyZubster notification hook - NO-OP on purpose. This sketch does not
// connect to any network, does not sign, and does not handle wallets. The platform
// integration (a read-only status string) is documented in
// docs/notification-architecture.md and wired by the maintainer downstream.
static void notifyMyzubster(const char* status) {
  (void)status;
  digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
}

// Sample the current-sense ADC, accumulate energy since the last sample (uJ).
static void sampleEnergy() {
  uint32_t now = millis();
  uint32_t dt = now - lastAccountedMs;
  lastAccountedMs = now;
  int raw = analogRead(PIN_SENSE_ADC);
  float shunt_mV = (raw / 4095.0f) * 3300.0f * ADC_GAIN;
  float i_mA = (shunt_mV / (SHUNT_OHMS * 1000.0f)) * 1000.0f;  // mV/ohm -> mA
  totalMicroJoules += (uint64_t)((VCC_MV * i_mA * (float)dt) / 1000.0f);
}

// Read the current energy estimate in milliWatt-hours for diagnostics.
float energyMilliWattHours() { return (float)totalMicroJoules / 3.6e6f; }

void setup() {
  Serial.begin(115200);
  pinMode(PIN_MOTOR_DIR, OUTPUT);
  pinMode(PIN_MOTOR_EN, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_WAKE_BTN, INPUT_PULLUP);
  // Arduino-ESP32 3.x ledc API:
  ledcAttachChannel(PIN_MOTOR_PWM, LEDC_FREQ, LEDC_RES, LEDC_CH);
  digitalWrite(PIN_MOTOR_EN, HIGH);
  lastActivityMs = millis();
  lastAccountedMs = millis();
  notifyMyzubster("eco boot");
  Serial.println("eco-firmware ready: light=10s deep=60s motorIdle=3s");
}

void loop() {
  sampleEnergy();
  uint32_t inactivity = millis() - lastActivityMs;

  // Motor idle / standby: ramp down + disable driver after MOTOR_IDLE_MS.
  if (inactivity >= MOTOR_IDLE_MS && currentDuty > 0) {
    motorStandby();
    notifyMyzubster("motor standby");
  }

  // CPU sleep: light after LIGHT_SLEEP_MS, deep after DEEP_SLEEP_MS.
  if (inactivity >= DEEP_SLEEP_MS) {
    notifyMyzubster("deep sleep");
    Serial.flush();
    esp_sleep_enable_ext0_wakeup((gpio_num_t)PIN_WAKE_BTN, 0);  // BOOT button
    esp_sleep_enable_timer_wakeup(60ULL * 1000000ULL);          // 60 s keep-alive
    esp_deep_sleep_start();                                     // wakes reset into setup()
  } else if (inactivity >= LIGHT_SLEEP_MS) {
    notifyMyzubster("light sleep");
    esp_sleep_enable_timer_wakeup(1ULL * 1000000ULL);
    esp_light_sleep_start();                                    // returns to loop()
    lastActivityMs = millis(); // treat a wake as new activity
  }

  // Demo drive: briefly run forward once per 8 s to exercise the FSM in testing.
  // (Remove in a real robot; drive from your sensor loop instead.)
  if ((millis() % 8000) < 2000 && currentDuty == 0) {
    motorRun(180, true);
    delay(50);
  }

  delay(100);
}
