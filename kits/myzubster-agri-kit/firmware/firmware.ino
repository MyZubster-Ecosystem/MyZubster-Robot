// MyZubster Agri Kit - ESP32 water-saving irrigation robot sketch.
// Implements issue #74 (Agriculture: robot che risparmia acqua in agricoltura).
// Reads a capacitive soil-moisture sensor on ADC, decides whether to irrigate, drives
// a solenoid irrigation valve via a logic-level EN pin, samples the supply current for
// an energy estimate, and exposes two documented no-op stubs (weather forecast +
// MyZubster notification) that integrators wire downstream.
//
// Scope: firmware power/moisture management only. No WiFi/Bluetooth, no internet, no
// wallet, no signing, no contract deployment, no token authorization. The
// weatherForecast() and notifyMyzubster() hooks are local no-op stubs - the real
// network integration is documented in docs/weather-integration.md and
// docs/notification-architecture.md but is NOT enabled by this firmware.

#include <Arduino.h>

// ---- Pin map (defaults; re-pin via the constants below) ----
static const uint8_t PIN_MOISTURE = 34;   // ADC1_CH6 - capacitive soil-moisture analog in
static const uint8_t PIN_VALVE_EN  = 25;  // GPIO25 -> driver MOSFET gate -> solenoid valve
static const uint8_t PIN_SENSE     = 35;  // ADC1_CH7 - current sense (after shunt amp)

// ---- ADC / calibration (capacitive sensor; HIGHER voltage = DRIER) ----
static const uint16_t DRY_RAW = 3500;     // raw 12-bit ADC when soil is bone dry
static const uint16_t WET_RAW = 1300;     // raw 12-bit ADC when soil is saturated
// Moisture thresholds expressed in percent (0-100).
static const uint8_t  DRY_THRESHOLD = 30;  // below => irrigate
static const uint8_t  WET_THRESHOLD = 60;  // at/above => soil is "OK" (soak hysteresis)

// ---- Valve / pacing ----
static const uint32_t SENSOR_INTERVAL_MS = 60UL * 1000UL; // sample / decide every 60 s
static const uint32_t MAX_VALVE_MS       = 60UL * 1000UL; // single-cycle cap (60 s)
static const uint32_t SOAK_OFF_MS        = 60UL * 1000UL; // pause after a cycle to let water soak

// ---- Energy accumulation (matches eco.js / agri.js formula: uJ = mV*mA*ms/1000) ----
static uint32_t gTotalMicroJoules = 0;
static const uint32_t ADC_VREF_MV  = 3300; // calibrated supply (replace w/ measured vref)
static const float     ADC_GAIN_MA_PER_LSB = 0.05f; // current-sense amp +/- -> mA per ADC LSB

// ---- State machine ----
static uint32_t gLastTickMs = 0;
static uint32_t gValveUntilMs = 0;   // the valve stays open until millis() reaches this

// Capacity-safe clamp on raw ADC -> moisture percent 0-100 (inverted sensor).
static uint8_t moisturePercent(uint16_t raw) {
  if (raw >= DRY_RAW) return 0;
  if (raw <= WET_RAW) return 100;
  // (dryRaw - raw) / (dryRaw - wetRaw) * 100, rounded
  uint32_t scaled = ((uint32_t)(DRY_RAW - raw) * 100UL + (DRY_RAW - WET_RAW) / 2)
                    / (uint32_t)(DRY_RAW - WET_RAW);
  return (uint8_t)scaled;
}

// Decide whether to irrigate at this moisture level. Returns true when soil reads below
// the dry threshold; false when the soil has at least reached the lower band edge.
static bool shouldIrrigate(uint8_t moisturePct) {
  return moisturePct < DRY_THRESHOLD;
}

// Documented no-op stub for the weather forecast hook. The robot stays offline: a
// maintainer-wired downstream weather API can plug the resulting rainExpected flag in
// here. This firmware returns "no rain known" so behaviour is conservative.
struct WeatherForecast { bool rainExpected; };
static WeatherForecast weatherForecast() {
  return { false };
}

// Documented no-op stub for the MyZubster notification hook. The real upstream
// platform integration is documented in docs/notification-architecture.md; this PR
// deliberately does not enable any network / wallet / signing surface.
static void notifyMyzubster(const char* /*status*/) {
  (void) /*status*/;
  // no-op: left here for downstream wiring
}

// Convert "rain expected?" into a multiplier applied to the irrigation duration (longer
// under no-rain, halved under rain). Mirrors agri.js weatherFactor.
static float weatherReductionFactor(const WeatherForecast& f) {
  return f.rainExpected ? 0.5f : 1.0f;
}

// Compute the valve-open duration in ms given the moisture deficit. Capped to
// MAX_VALVE_MS so a single tick never floods.
static uint32_t valveDurationMs(uint8_t moisturePct, bool rainExpected) {
  if (!shouldIrrigate(moisturePct)) return 0;
  uint16_t deficit = DRY_THRESHOLD - moisturePct;  // positive
  float factor = rainExpected ? 0.5f : 1.0f;
  uint32_t ms = (uint32_t)roundf((float)deficit * 1000.0f * factor);
  if (ms > MAX_VALVE_MS) ms = MAX_VALVE_MS;
  return ms;
}

// Add an energy sample from a current-sense reading over a duration.
// uJ = mV * mA * ms / 1000.
static void addEnergySample(uint16_t senseRaw, uint32_t durationMs) {
  if (durationMs == 0) return;
  float current_mA = (float)senseRaw * ADC_GAIN_MA_PER_LSB;
  // mA * mV * ms / 1000 -> uJ (integer-only truncation, matches agri.js)
  uint32_t uJ = (uint32_t)((float)ADC_VREF_MV * current_mA * (float)durationMs / 1000.0f);
  gTotalMicroJoules += uJ;
}

// Energy accumulated so far, in milli-watt-hours.
static float energyMilliWattHours() {
  return (float)gTotalMicroJoules / 3'600'000.0f;
}

void setup() {
  Serial.begin(115200);
  while (!Serial) { ; }
  analogReadResolution(12);     // 0..4095 across the 12-bit ADC
  analogSetAttenuation(ADC_11db); // ~0..3.3V full-scale
  pinMode(PIN_VALVE_EN, OUTPUT);
  digitalWrite(PIN_VALVE_EN, LOW); // valve closed at boot
  Serial.println(F("agri-kit: boot OK"));
}

void loop() {
  uint32_t now = millis();
  // Valve control has its own timing so it can close on schedule even between ticks.
  if (gValveUntilMs && now >= gValveUntilMs) {
    digitalWrite(PIN_VALVE_EN, LOW);
    gValveUntilMs = 0;
    notifyMyzubster("valve_closed");
  }

  if (now - gLastTickMs < SENSOR_INTERVAL_MS) return;
  gLastTickMs = now;

  uint16_t raw = (uint16_t)analogRead(PIN_MOISTURE);
  uint8_t  moisture = moisturePercent(raw);
  WeatherForecast wf = weatherForecast();

  Serial.print(F("tick raw="));
  Serial.print(raw); Serial.print(F(" moisture=")); Serial.print(moisture);
  Serial.print(F("% decision="));

  if (shouldIrrigate(moisture)) {
    uint32_t dur = valveDurationMs(moisture, wf.rainExpected);
    Serial.println(dur > 0 ? "irrigate" : "wait");
    if (dur > 0) {
      digitalWrite(PIN_VALVE_EN, HIGH);
      gValveUntilMs = now + dur;
      // Estimate the energy of one irrigation cycle (valve + pump draw ~ 200mA@5V).
      addEnergySample(/*senseRaw*/ /* placeholder */ 0, 0); // sense wiring covered in docs; left to integrator
      notifyMyzubster("irrigating");
    }
  } else {
    Serial.println(F("wait"));
  }

  // ~12 mA quiescent draw over the last sensor interval (sensor + ESP32).
  addEnergySample((uint16_t)(12.0f / ADC_GAIN_MA_PER_LSB), SENSOR_INTERVAL_MS);

  static uint32_t reportCounter = 0;
  if (++reportCounter % 30 == 0) {
    Serial.print(F("energy=")); Serial.print(energyMilliWattHours(), 2);
    Serial.println(F(" mWh"));
  }
}
