# Arduino Robot SDK (#121)

A C++ Arduino library for controlling MyZubster-compatible robots.

## Directory Structure

```
arduino-robot-sdk/
├── README.md              # This file
├── library.properties      # Arduino Library Manager metadata
├── src/
│   ├── MyZubsterRobot.h    # Main robot control class
│   ├── MyZubsterRobot.cpp  # Implementation
│   ├── MotorController.h   # Motor control (servo/DC)
│   ├── SensorReader.h      # Sensor reading (pH, EC, temp, humidity)
│   ├── Communication.h     # WiFi/Monero communication
│   └── DNAModule.h         # Robot DNA storage and validation
├── examples/
│   ├── BasicMovement/      # Basic motor control example
│   ├── SensorReading/      # Read sensors and display values
│   ├── WiFiConnection/     # Connect to MyZubster Gateway
│   └── DNAInheritance/     # Robot DNA inheritance demo
└── docs/
    └── API.md              # Full API documentation
```

## Installation

### Arduino Library Manager
1. Open Arduino IDE
2. Sketch → Include Library → Manage Libraries
3. Search for "MyZubsterRobot"
4. Click Install

### Manual Installation
1. Download this repository
2. Copy to `~/Documents/Arduino/libraries/MyZubsterRobot/`
3. Restart Arduino IDE

## Quick Start

```cpp
#include <MyZubsterRobot.h>

MyZubsterRobot robot;

void setup() {
  Serial.begin(115200);
  robot.begin();
  robot.connectWiFi("SSID", "PASSWORD");
  robot.connectGateway("https://myzubsterapp.onrender.com");
}

void loop() {
  // Read sensors
  float temp = robot.readTemperature();
  float humidity = robot.readHumidity();
  float pH = robot.readPH();
  
  Serial.printf("Temp: %.1f°C, Humidity: %.1f%%, pH: %.2f\n", temp, humidity, pH);
  
  // Send data to gateway
  robot.sendSensorData(temp, humidity, pH);
  
  // Check for available jobs
  Job* job = robot.getAvailableJob();
  if (job) {
    robot.acceptJob(job->jobId);
    robot.moveToJob(job->lat, job->lng);
    robot.executeJob();
    robot.completeJob(job->jobId);
  }
  
  delay(5000);
}
```

## Supported Hardware

| Platform | Status | Notes |
|----------|--------|-------|
| ESP32 | ✅ Primary | WiFi + Bluetooth built-in |
| ESP8266 | ✅ Supported | WiFi only |
| Arduino Mega 2560 | ⚠️ With WiFi shield | No built-in WiFi |
| Arduino Uno | ⚠️ Limited | Memory constraints |

## API Reference

- `begin()` - Initialize robot hardware
- `connectWiFi(ssid, password)` - Connect to WiFi
- `connectGateway(url)` - Connect to MyZubster Gateway
- `readTemperature()` - Read temperature sensor (°C)
- `readHumidity()` - Read humidity sensor (%)
- `readPH()` - Read pH sensor
- `sendSensorData(temp, humidity, pH)` - Send sensor data to gateway
- `getAvailableJob()` - Get nearest available job
- `acceptJob(jobId)` - Accept a job
- `moveToJob(lat, lng)` - Navigate to job location
- `executeJob()` - Execute the current job
- `completeJob(jobId)` - Mark job as complete
- `getDNA()` - Get robot DNA
- `validateDNA(dna)` - Validate DNA against schema

## License

MIT
