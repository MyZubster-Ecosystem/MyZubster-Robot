/*
 * x402 Robot Example - ESP32/Arduino
 * Autonomous robot payment with MyZubster Gateway
 * 
 * Flow:
 * 1. Connect to WiFi
 * 2. Register robot on gateway
 * 3. Check battery level
 * 4. If battery < 15%, request recharge (x402)
 * 5. Gateway responds with 402 Payment Required
 * 6. Robot simulates payment
 * 7. Confirms and recharges
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============================================================
// 🔧 CONFIGURATION - MODIFICA QUESTI VALORI
// ============================================================

// --- WiFi ---
const char* ssid = "YOUR_WIFI_SSID";          // <-- SOSTITUISCI con il nome della tua rete WiFi
const char* password = "YOUR_WIFI_PASSWORD";  // <-- SOSTITUISCI con la password WiFi

// --- MyZubster Gateway ---
const char* gateway = "http://188.213.161.186:10003";  // <-- IP del server MyZubster (NON MODIFICARE)
const char* robotId = "robot_esp32_001";               // <-- ID del robot (cambia se vuoi)

// --- Owner Monero Address ---
const char* ownerAddress = "45M4DW1ug8bdQowWpxucTpgsfjLbVxbYaAra79VewmBobuuhgqTjyD4R3DzpqLM2veiphcB16n24qN1QbLg3y2PYGK3Qkoe";

// ============================================================
// PINS
// ============================================================

#define BATTERY_PIN 34   // Sensore batteria (simulato)
#define LED_PIN 2        // LED integrato ESP32
#define BUTTON_PIN 0     // Pulsante (BOOT)

// ============================================================
// GLOBALS
// ============================================================

float batteryLevel = 100.0;
bool registered = false;

// ============================================================
// SETUP
// ============================================================

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  Serial.println("=========================================");
  Serial.println("🤖 MyZubster x402 Robot - ESP32");
  Serial.println("=========================================");

  // Connect to WiFi
  connectWiFi();

  // Register robot
  registerRobot();

  Serial.println("✅ Robot ready!");
  Serial.println("📌 ID: " + String(robotId));
  Serial.println("🔋 Battery: " + String(batteryLevel) + "%");
  Serial.println("=========================================");

  blinkLED(3);
}

// ============================================================
// LOOP
// ============================================================

void loop() {
  // Read battery
  batteryLevel = readBattery();

  // If battery low → request recharge
  if (batteryLevel < 15.0 && registered) {
    Serial.println("🔋 Battery low (" + String(batteryLevel) + "%)");
    requestRecharge(0.01);
  }

  // Check payment status
  checkPaymentStatus();

  // LED indicator
  updateLED();

  // Manual test button
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(200);
    Serial.println("🔘 Manual recharge test");
    requestRecharge(0.01);
  }

  delay(5000);
}

// ============================================================
// WiFi
// ============================================================

void connectWiFi() {
  Serial.print("📶 Connecting to WiFi");
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" ✅");
    Serial.println("📡 IP: " + WiFi.localIP().toString());
  } else {
    Serial.println(" ❌");
    Serial.println("⚠️ WiFi not connected! Restarting...");
    ESP.restart();
  }
}

// ============================================================
// Battery (simulated)
// ============================================================

float readBattery() {
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 30000) {
    lastUpdate = millis();
    batteryLevel = batteryLevel - 0.5;
    if (batteryLevel < 0) batteryLevel = 100;
  }
  return batteryLevel;
}

// ============================================================
// Registration
// ============================================================

void registerRobot() {
  Serial.print("📝 Registering robot...");

  HTTPClient http;
  String url = String(gateway) + "/api/robot/register";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"id\":\"" + String(robotId) + "\",";
  payload += "\"name\":\"ESP32 Robot\",";
  payload += "\"type\":\"drone\",";
  payload += "\"owner\":\"" + String(ownerAddress) + "\"";
  payload += "}";

  int code = http.POST(payload);
  http.end();

  if (code == 200) {
    Serial.println(" ✅");
    registered = true;
  } else {
    Serial.println(" ❌ (code " + String(code) + ")");
  }
}

// ============================================================
// x402 Payment
// ============================================================

void requestRecharge(float amount) {
  Serial.println("⚡ Requesting x402 recharge...");

  HTTPClient http;
  String url = String(gateway) + "/api/robot/ricarica?robotId=" + robotId + "&amount=" + String(amount);
  http.begin(url);

  int code = http.GET();

  if (code == 402) {
    String response = http.getString();
    Serial.println("💰 402 Payment Required!");
    Serial.println("📄 Response: " + response);

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, response);

    if (!error) {
      float total = doc["amount"];
      String address = doc["address"].as<String>();
      float fee = doc["fee"];
      float boscoFee = doc["boscoFee"];
      float referralFee = doc["referralFee"] | 0.0;

      Serial.println("📫 Address: " + address);
      Serial.println("💰 Total: " + String(total) + " XMR");
      Serial.println("💸 Fee (2%): " + String(fee) + " XMR");
      Serial.println("🌳 Bosco Fee (8%): " + String(boscoFee) + " XMR");
      if (referralFee > 0) {
        Serial.println("🔗 Referral Fee (5%): " + String(referralFee) + " XMR");
      }

      simulatePayment(address, total);
    }
  } else {
    Serial.println("❌ Request failed: " + String(code));
  }

  http.end();
}

void simulatePayment(String address, float amount) {
  Serial.println("💸 Simulating payment to " + address + " for " + String(amount) + " XMR...");
  delay(2000);
  Serial.println("✅ Payment sent!");

  // Simulate recharge
  batteryLevel = 100;
  Serial.println("🔋 Battery recharged to 100%!");

  blinkLED(5);
}

void checkPaymentStatus() {
  HTTPClient http;
  String url = String(gateway) + "/api/payments/status/" + robotId;
  http.begin(url);

  int code = http.GET();
  if (code == 200) {
    String response = http.getString();
    StaticJsonDocument<128> doc;
    deserializeJson(doc, response);
    String status = doc["status"].as<String>();
    if (status == "confirmed") {
      Serial.println("✅ Payment confirmed!");
      batteryLevel = 100;
    }
  }
  http.end();
}

// ============================================================
// Helpers
// ============================================================

void updateLED() {
  if (batteryLevel > 50) {
    digitalWrite(LED_PIN, LOW);
  } else if (batteryLevel > 20) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(900);
  } else {
    digitalWrite(LED_PIN, HIGH);
    delay(500);
    digitalWrite(LED_PIN, LOW);
    delay(500);
  }
}

void blinkLED(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}
