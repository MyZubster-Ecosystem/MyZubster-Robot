# Schemi di riconversione

How to wire each recovered part into a battery-powered ESP32 robot. ASCII schematics use standard conventions (`-` wire, `=` power rail, `[X]` block). All circuits use low-voltage DC only - no mains, no crypto peripheral.

## Motori -> driver + ESP32 PWM

### Brushed DC motor (printer / toy gearbox) via DRV8833

    7.4V (2S) or 5V boost --- VMOT[DRV8833]
                            GND --- GND
    ESP32 GPIO18 --- AIN1[DRV8833]
    ESP32 GPIO19 --- AIN2[DRV8833]   (PWM via ledc)
    AOUT1 --- MOTOR+
    AOUT2 --- MOTOR-

ESP32 side (Arduino-ESP32): `ledcAttach(PIN_AIN1, 20000, 8)` then `ledcWrite(PIN_AIN1, duty)` for speed; `digitalWrite(PIN_AIN2, LOW/HIGH)` for direction. DRV8833 has built-in free-wheel diodes; a bare H-bridge needs 4 external flyback diodes.

### Bipolar stepper (paper-feed) via A4988

    12V --- VMOT[A4988]
    GND --- GND
    3V3 --- VDD[A4988]
    ESP32 GPIO5  --- STEP[A4988]
    ESP32 GPIO17 --- DIR[A4988]
    1A/1B --- coil A, 2A/2B --- coil B
    SLEEP[A4988] <-- VDD (keep awake)

Pinout reference (recycled printers):

| Donor motor | Driver | ESP32 pins (example) | Notes |
|---|---|---|---|
| Inkjet paper-feed stepper | A4988 (bipolar) | STEP=5, DIR=17 | identify coil pairs with a multimeter (low-ohm pair = one coil) |
| Unipolar 5-wire stepper | ULN2003 | IN1..IN4 = 16,17,18,19 | common wire to motor V+ |
| Toy brushed DC + gearbox | DRV8833 | AIN1=18, AIN2=19 | one motor per half-bridge; two motors = both halves |

## Batterie -> protezione + boost

### Single 18650 + TP4056 (protect) + MT3608 boost

    18650+ --- BATT+[TP4056]
    18650- --- BATT-[TP4056]
    TP4056 OUT+ --- IN+[MT3608 boost] --- OUT+ (set 5.0V) --- 5V rail
    TP4056 OUT- --- IN-[MT3608]        --- GND
    5V rail --- VIN[ESP32 DevKit]

Use the protection-board variant of TP4056 (DW01 + dual FET) so a single recovered cell has over-charge / over-discharge / short protection.

### Two-cell 18650 (7.4 V) - must be balanced

If you pair two recovered 18650s into 7.4 V, they MUST be: matched capacity (recover both from the same pack) and charged/discharged as a balanced pair via a 2S BMS.

| Scenario | Circuit | Output |
|---|---|---|
| 1 x 18650 | TP4056 (protect) + MT3608 boost | 5V for ESP32 VIN |
| 2 x 18650 (7.4V) | 2S BMS + step-down (MP1584) to 5V | 5V; or 7.4V direct to DRV8833 VMOT |
| 1 x phone Li-Po | TP4056 + small boost | 5V low-current - sensors only |

## Sensori -> GPIO / I2C

### IR proximity (phone ambient-light / IR or remote receiver)

    3V3 --- VCC[IR module]
    GND --- GND
    OUT  --- GPIO4[ESP32]   (LOW when a reflective surface is near)

### MPU6050 (accelerometer + gyro) from a phone flex

    3V3 --- VCC[MPU6050]
    GND --- GND
    SDA --- GPIO21[ESP32]   (I2C data, default Wire)
    SCL --- GPIO22[ESP32]   (I2C clock)
    AD0 --- GND (address 0x68)

| Sensor | Interface | ESP32 pin | Library |
|---|---|---|---|
| IR proximity (analog) | ADC | GPIO34 (input-only) | analogRead |
| IR proximity (digital) | GPIO | GPIO4 | digitalRead |
| MPU6050 accel/gyro | I2C | SDA=21, SCL=22 | Wire / MPU6050 lib |
| Optical encoder (printer) | quadrature | GPIO14, GPIO27 | PCNT (attachInterrupt) |

Phone-flex sensors often expect 1.8 V. Confirm from donor-board markings; if it is a 1.8 V part, add a level shifter before the 3.3 V ESP32 GPIO.

## Telaio -> montaggio

    Toy RC chassis --- remove original RC board; keep motors + gearbox + wheel mounts
                   --- mount ESP32 DevKit with double-sided tape + nylon standoffs
                   --- mount DRV8833 beside the motors; route short motor leads
                   --- mount the 18650 holder low & centered for balance
                   --- mount IR / ultrasonic (if salvaged) at the front bumper

Mounting checklist:
- Keep motor leads short to reduce EMI / noise pickup.
- Battery low and centered for stability.
- Sensor board at the leading edge, clear of wheel spray.
- Do not put a structural load on the ESP32 PCB - mount it on standoffs or foam tape, not as a structural plate.
