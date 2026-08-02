# 🤖 MyZubster Robot

**Open-source robot payment system with x402, Monero, and Arduino**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Made with ESP32](https://img.shields.io/badge/Made%20with-ESP32-red.svg)](https://www.espressif.com/en/products/socs/esp32)
[![Status](https://img.shields.io/badge/Status-Live-brightgreen)](https://github.com/MyZubster-Ecosystem/MyZubster-Robot)
---

## 🌟 **What is MyZubster Robot?**

MyZubster Robot is an open-source ecosystem that enables autonomous robots to:
- **Request payments** using the x402 protocol
- **Pay with Monero** for recharge and services
- **Be cloned** with a referral system (5% fee for 1 year)
- **Integrate AI** for decision-making (MCP/Anthropic)

---

## 📦 **Repository Structure**

| Directory | Description |
|-----------|-------------|
| `x402-gateway/` | Node.js gateway with x402 Payment Required endpoints |
| `arduino-robot-sdk/` | Arduino/ESP32 library for robots |
| `robot-marketplace/` | Smart contracts and skill marketplace |

---

## 🚀 **Quick Start**

### 1. Clone the Repository

```bash
git clone https://github.com/MyZubster-Ecosystem/MyZubster-Robot.git
cd MyZubster-Robot
2. Start the x402 Gateway
bash

cd x402-gateway
npm install
npm start

3. Upload to ESP32
bash

cd arduino-robot-sdk/examples/x402_robot
# Open in Arduino IDE and upload

📡 x402 Gateway API
Method	Endpoint	Description
POST	/api/robot/register	Register a new robot
GET	/api/robot/charge	Request recharge (returns 402)
GET	/api/robot/:id	Get robot info
🛠️ Arduino SDK
Installation

    Copy arduino-robot-sdk/src/ to your Arduino libraries folder

    Open examples in Arduino IDE

Example Usage
cpp

#include <MyZubsterWallet.h>
#include <MyZubsterX402.h>

void setup() {
  MyZubsterWallet wallet("4A2B...");
  wallet.requestRecharge(0.01);
}

🔗 Links

    Repository: https://github.com/MyZubster-Ecosystem/MyZubster-Robot

    Ecosystem: https://github.com/MyZubster-Ecosystem

    DEV.to: https://dev.to/danielioni

📄 License

MIT License – see LICENSE file.

Built with ❤️ by Daniel Ioni & the MyZubster Community
