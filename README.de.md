# 🤖 MyZubster Robot

**Open-Source-Roboter-Zahlungssystem mit x402, Monero und Arduino**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Made with ESP32](https://img.shields.io/badge/Made%20with-ESP32-red.svg)](https://www.espressif.com/en/products/socs/esp32)
[![Status](https://img.shields.io/badge/Status-Live-brightgreen)](https://github.com/MyZubster-Ecosystem/MyZubster-Robot)
---

## 🌟 **Was ist MyZubster Robot?**

MyZubster Robot ist ein Open-Source-Ökosystem, das autonomen Robotern ermöglicht:
- **Zahlungen anzufordern** über das x402-Protokoll
- **mit Monero zu bezahlen** für Aufladung und Dienste
- **geklont zu werden** mit einem Empfehlungssystem (5 % Gebühr für 1 Jahr)
- **KI zu integrieren** für Entscheidungsfindung (MCP/Anthropic)

---

## 📦 **Repository-Struktur**

| Verzeichnis | Beschreibung |
|--------------|--------------|
| `x402-gateway/` | Node.js-Gateway mit x402 „Payment Required"-Endpunkten |
| `arduino-robot-sdk/` | Arduino/ESP32-Bibliothek für Roboter |
| `robot-marketplace/` | Smart Contracts und Skill-Marketplace |

---

## 🚀 **Schnellstart**

### 1. Repository klonen

```bash
git clone https://github.com/MyZubster-Ecosystem/MyZubster-Robot.git
cd MyZubster-Robot
```

### 2. Das x402-Gateway starten

```bash
cd x402-gateway
npm install
npm start
```

### 3. Auf ESP32 hochladen

```bash
cd arduino-robot-sdk/examples/x402_robot
# In der Arduino IDE öffnen und hochladen
```

---

## 📡 x402-Gateway-API

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| POST | `/api/robot/register` | Einen neuen Roboter registrieren |
| GET | `/api/robot/charge` | Aufladung anfordern (gibt 402 zurück) |
| GET | `/api/robot/:id` | Roboterinformationen abrufen |

---

## 🛠️ Arduino-SDK

### Installation

1. `arduino-robot-sdk/src/` in Ihren Arduino-Libraries-Ordner kopieren
2. Beispiele in der Arduino IDE öffnen

### Beispielverwendung

```cpp
#include <MyZubsterWallet.h>
#include <MyZubsterX402.h>

void setup() {
  MyZubsterWallet wallet("4A2B...");
  wallet.requestRecharge(0.01);
}
```

---

## 🔗 Links

- Repository: https://github.com/MyZubster-Ecosystem/MyZubster-Robot
- Ökosystem: https://github.com/MyZubster-Ecosystem
- DEV.to: https://dev.to/danielioni

---

## 📄 Lizenz

MIT-Lizenz – siehe LICENSE-Datei.

Mit ❤️ gebaut von Daniel Ioni & der MyZubster-Community
