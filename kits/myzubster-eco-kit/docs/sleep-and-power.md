# Sleep and power management (eco mode)

Reference for `firmware/firmware.ino`. Implements the first two issue #71 tasks: **Implementare sleep mode su ESP32** and **Riduzione consumo motori in idle**.

## Implementare sleep mode su ESP32

ESP32 exposes three power domains you can enter from a running sketch:

| Mode | API entry | Typical current | Wake sources | RAM/timers |
|---|---|---|---|---|
| Active | (running) | ~40-80 mA | n/a | yes |
| Light sleep | `esp_light_sleep_start()` | ~0.8-1 mA | any GPIO, timer, UART | yes (kept) |
| Deep sleep | `esp_deep_sleep_start()` | ~10 uA | RTC GPIO, timer, ext0/ext1 | no (RTC only) |

The firmware runs a simple inactivity FSM (the C++ twin of `decideSleep` in `firmware/lib/eco/eco.js`):

- < 10 s inactive -> `active`
- >= 10 s -> `light sleep` (wakes on a 1 s timer; a wake is treated as new activity)
- >= 60 s -> `deep sleep` (wakes on GPIO0 BOOT button + a 60 s keep-alive timer; a wake resets into `setup()`)

Wake source notes:
- `esp_sleep_enable_ext0_wakeup(GPIO, level)`: single-pin wake; deep sleep requires an RTC GPIO (GPIO0 is RTC, so the BOOT button works).
- `esp_sleep_enable_timer_wakeup(us)`: periodic keep-alive (1 s light / 60 s deep in this sketch).
- Light sleep wakes on any GPIO/timer and returns to `loop()` with RAM preserved; deep sleep wakes through a reset into `setup()`.

## Riduzione consumo motori in idle

Motor idle cuts the biggest draw - the motor itself, not the CPU. The firmware:

1. After `MOTOR_IDLE_MS` (default 3 s) of inactivity, ramp the PWM duty down over `RAMP_STEPS = 8` intervals (the `rampDown` helper ladder).
2. Pull the driver `nSleep / EN` pin `LOW` so the H-bridge stops driving the motor coils.
3. Keep the ADC sampling so energy use is still accounted while idle.

Why ramp then disable:
- A hard cutoff can back-EMF-spike the driver; a short ramp mitigates that.
- After the ramp, leaving PWM at non-zero duty while idle still wastes coil current, so the EN-low finish is what actually drops motor draw to ~0.

## Tuning

Keep the firmware thresholds and the `eco.js` `DEFAULTS` in sync so the jest tests and the firmware agree on the policy:

| firmware constant | eco.js default |
|---|---|
| `LIGHT_SLEEP_MS` (10 s) | `DEFAULTS.lightMs` (10 s) |
| `DEEP_SLEEP_MS` (60 s) | `DEFAULTS.deepMs` (60 s) |
| `MOTOR_IDLE_MS` (3 s) | `DEFAULTS.motorIdleMs` (3 s) |
| `RAMP_STEPS` (8) | `DEFAULTS.rampSteps` (8) |
