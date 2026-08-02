# 🤖 MyZubster Robot

**The first open-source autonomous robot payment system with Monero, x402, and AI escrow.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Made with ESP32](https://img.shields.io/badge/Made%20with-ESP32-red.svg)](https://www.espressif.com/en/products/socs/esp32)
[![Status](https://img.shields.io/badge/Status-Live-brightgreen)](https://github.com/MyZubster-Ecosystem/MyZubster-Robot)

---

## 🌟 **What is MyZubster Robot?**

MyZubster Robot is an **open-source ecosystem** that enables autonomous robots to:

- 🤖 **Request payments** using the x402 protocol (HTTP 402 Payment Required)
- ₿ **Pay with Monero** for recharge and services
- 🔄 **Be cloned** with a referral system (5% fee for 1 year)
- 🧠 **Integrate AI** for decision-making (MCP/Anthropic)
- 🔗 **Use escrow** for dispute resolution (2-of-3 multisig)

**"Il primo robot che si paga da solo."**

---

## 🏗️ **Architecture**
┌─────────────────────────────────────────────────────────────────┐
│ MyZubster-Robot │
│ Open-source Repository │
├─────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│ │ ESP32/ │ │ x402 │ │ Monero Wallet │ │
│ │ Arduino │───▶│ Gateway │───▶│ RPC (Testnet) │ │
│ │ Robot │ │ Node.js │ │ │ │
│ └─────────────┘ └─────────────┘ └─────────────────────┘ │
│ │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│ │ Escrow │ │ GitHub │ │ Docker │ │
│ │ (Base) │ │ Bounties │ │ Compose │ │
│ └─────────────┘ └─────────────┘ └─────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────┘
text


---

## 💰 **Fee Structure**

| Fee Type | Percentage | Destination |
|----------|------------|-------------|
| **MyZubster Fee** | 2% | Platform maintenance |
| **Bosco Fee** | 8% | Community fund |
| **Referral Fee** | 5% | Referrer (who cloned the robot) |
| **Owner** | 85% | Robot owner (after fees) |

**Example:** A robot recharge of `0.01 XMR`:

| Component | Calculation | Amount |
|-----------|-------------|--------|
| Recharge | `0.01` | `0.01 XMR` |
| MyZubster Fee | `0.01 × 0.02` | `0.0002 XMR` |
| Bosco Fee | `0.01 × 0.08` | `0.0008 XMR` |
| Referral Fee | `0.01 × 0.05` | `0.0005 XMR` |
| **Total** | `0.01 + 0.0002 + 0.0008 + 0.0005` | **`0.0115 XMR`** |

---

## 🔑 **Key Features**

| Feature | Description |
|---------|-------------|
| **🤖 x402 Protocol** | Robot requests payment with 402 Payment Required |
| **₿ Monero Integration** | Private, secure payments with XMR |
| **🔗 GitHub Bounties** | Automatic bounty management with webhooks |
| **🧠 AI-Ready** | MCP (Anthropic) integration for decision-making |
| **📱 ESP32/Arduino** | Ready-to-use sketches for robots |
| **💰 Fee System** | 2% MyZubster + 8% Bosco Community Fund |
| **🔄 Robot Cloning** | Referral system with 5% fees for 1 year |
| **🔒 Escrow** | 2-of-3 multisig (Robot + Provider + AI Arbiter) |

---

## 📦 **Repository Structure**

MyZubster-Robot/
├── README.md # Project documentation
├── LICENSE # MIT License
├── docker-compose.yml # Docker setup
├── x402-gateway/ # Node.js x402 gateway
│ ├── src/
│ │ ├── index.js # Express server
│ │ └── routes/
│ │ └── robot.js # Robot API endpoints
│ ├── package.json # Dependencies
│ └── README.md
├── arduino-robot-sdk/ # ESP32/Arduino SDK
│ ├── src/
│ │ └── MyZubsterX402.h # x402 library
│ ├── examples/
│ │ └── x402_robot/
│ │ └── x402_robot.ino # ESP32 sketch
│ ├── library.properties # Arduino library config
│ └── README.md
├── robot-marketplace/ # Smart contracts & skills
│ ├── contracts/
│ │ ├── RobotEscrow.sol # 2-of-3 escrow
│ │ └── RobotProfile.sol # ERC-8004 identity
│ ├── skills/ # Robot skills
│ │ └── lawn_mower.json
│ └── README.md
└── docs/ # Documentation
├── API.md
└── SETUP.md
text


---

## 🚀 **Quick Start**

### Prerequisites

- **Docker** & Docker Compose
- **ESP32** (or any WiFi-enabled Arduino)
- **Node.js** 20+ (for local development)
- **Monero testnet** wallet (optional)

### 1️⃣ **Clone the Repository**

```bash
git clone https://github.com/MyZubster-Ecosystem/MyZubster-Robot.git
cd MyZubster-Robot

2️⃣ Start the Gateway with Docker
bash

docker-compose up -d

3️⃣ Test the API
bash

curl http://localhost:10003/

Expected Response:
json

{
  "name": "MyZubster Gateway",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "robot": "/api/robot"
  }
}

4️⃣ Upload to ESP32

    Open arduino-robot-sdk/examples/x402_robot/x402_robot.ino in Arduino IDE

    Set your WiFi credentials:
    cpp

    const char* ssid = "YOUR_WIFI_SSID";
    const char* password = "YOUR_WIFI_PASSWORD";

    Upload to ESP32

    Open Serial Monitor (115200 baud)

📡 API Endpoints
Method	Endpoint	Description
POST	/api/robot/register	Register a new robot
GET	/api/robot/ricarica	Request recharge (Italian)
GET	/api/robot/charge	Request recharge (x402 standard)
GET	/api/robot/:robotId	Get robot info
POST	/api/robot/:robotId/location	Update GPS position
POST	/api/robot/clone	Clone robot with referral
GET	/api/robot/	List all robots
GET	/api/referral/:referrer	Get referral fees
POST	/api/referral/withdraw	Withdraw fees
🔧 Example: Robot Flow
1️⃣ Register a Robot
bash

curl -X POST http://localhost:10003/api/robot/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "robot_001",
    "name": "Tagliaerba",
    "owner": "45M4DW1...",
    "walletAddress": "4A2Btest1234567890"
  }'

2️⃣ Request Recharge (x402)
bash

curl -X GET "http://localhost:10003/api/robot/ricarica?robotId=robot_001&amount=0.01"

Response (402 Payment Required):
json

{
  "status": "payment_required",
  "amount": 0.0115,
  "fee": 0.0002,
  "boscoFee": 0.0008,
  "referralFee": 0.0005,
  "address": "4A2Btest1234567890",
  "memo": "Ricarica robot robot_001"
}

3️⃣ Clone a Robot (Referral)
bash

curl -X POST http://localhost:10003/api/robot/clone \
  -H "Content-Type: application/json" \
  -d '{
    "originalId": "robot_001",
    "newId": "robot_002",
    "name": "Tagliaerba Clone",
    "owner": "45M4DW1...clone..."
  }'

🔗 GitHub Webhook Setup

For automatic bounty management:

    Go to repository → Settings → Webhooks

    Add webhook:

        Payload URL: http://YOUR_SERVER:10003/api/bounties/webhook

        Content type: application/json

        Events: Issues, Issue comment

🛠️ Tech Stack
Component	Technology	Version
Gateway	Node.js + Express	20.x
Database	MongoDB	6.x
Payment Protocol	x402	Standard
Cryptocurrency	Monero	0.18.x
Robot	ESP32 / Arduino	-
Container	Docker	Latest
Process Manager	PM2	Latest
Reverse Proxy	Nginx	Latest
🤝 Contributing

We welcome contributions from the community!
How to Contribute

    Fork the repository

    Create a feature branch

    Commit your changes

    Open a Pull Request

Good First Issues

Check our Good First Issues.
📄 License

MIT License – see LICENSE file.
🌐 Links

    Repository: MyZubster-Robot

    Ecosystem: MyZubster

    DEV.to: @danielioni

    Twitter/X: @MyZubster

💬 Questions?

Open an issue on GitHub or reach out on Telegram!

Built with ❤️ by Daniel Ioni & the MyZubster Community

#monero #robotics #iot #opensource #web3 #myzubster #arduino #esp32 #blockchain
