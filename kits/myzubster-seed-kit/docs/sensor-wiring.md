# Sensor wiring

## ESP32 pin map

| Component | ESP32 Pin | Notes |
|-----------|-----------|------|
| Neo-6M GPS TX | GPIO 16 (RX2) | UART2, 9600 baud |
| Neo-6M GPS RX | GPIO 17 (TX2) | |
| SG90 dibber servo | GPIO 13 | PWM 50 Hz |
| SG90 cover servo | GPIO 14 | PWM 50 Hz |
| 28BYJ-48 stepper IN1 | GPIO 25 | ULN2003 driver |
| 28BYJ-48 stepper IN2 | GPIO 26 | |
| 28BYJ-48 stepper IN3 | GPIO 27 | |
| 28BYJ-48 stepper IN4 | GPIO 33 | |
| Capacitive moisture sensor | GPIO 34 (ADC) | Analog 0-3.3V |
| DS18B20 temperature | GPIO 4 | 1-Wire, 4.7k pull-up |

## Capacitive soil moisture sensor

Capacitive sensors are inverted: higher voltage = drier soil, lower voltage = wetter soil. The raw 12-bit ADC reading is converted to a moisture percentage by `moistureToPercent()` in the agri kit or by equivalent calibration logic. Calibrate the `dryRaw` and `wetRaw` values for your specific sensor + soil combination.

## DS18B20 temperature sensor

Standard 1-Wire connection with a 4.7k pull-up resistor between VCC and the data line. The DS18B20 provides soil temperature for the growth monitor.

## Power

The ESP32 is powered from a 3.7V LiPo battery. The servos and stepper share the 5V rail from a separate BEC (battery eliminator circuit) rated for at least 1.5A peak. Never power motors from the ESP32 onboard regulator.

## Growth monitoring

The `growthMonitor(moisturePct, tempC)` function checks whether soil conditions are suitable for germination. It returns:

- `plant` --- conditions are optimal
- `wait_dry` --- soil is too dry, the robot should wait for rain or irrigation
- `wait_wet` --- soil is waterlogged
- `wait_cold` --- soil is too cold for germination
- `wait_hot` --- soil is too hot

The robot can be configured to skip planting at positions where the growth monitor returns anything other than `plant`.
