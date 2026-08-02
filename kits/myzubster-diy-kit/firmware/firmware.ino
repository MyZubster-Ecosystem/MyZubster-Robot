// firmware.ino — MyZubster DIY kit (issue #75). Base sketch for ESP32 DevKit V1.
// Pure firmware: motor PWM + ultrasonic distance poll + IR proximity poll +
// status LED blink. **No WiFi/BT, no networking, no signing, no crypto**.

// ---- Pin map (see ../hardware/wiring.md) ----
static const int PIN_LED         = 13;
static const int PIN_PWMA        = 14;  // left wheel PWM
static const int PIN_PWMB        = 27;  // right wheel PWM
static const int PIN_AIN1        = 12;  // DRV8833 AIN1
static const int PIN_AIN2        = 15;  // DRV8833 AIN2
static const int PIN_TRIG        = 18;  // HC-SR04 TRIG
static const int PIN_ECHO        = 19;  // HC-SR04 ECHO
static const int PIN_IR1         = 34;  // IR analog 1
static const int PIN_IR2         = 35;  // IR analog 2

// ---- Tunables ----
static const int   PWM_FREQ_HZ    = 1000;
static const int   PWM_RES_BITS   = 8;
static const int   PWM_MAX        = (1 << PWM_RES_BITS) - 1;   // 255
static const int   PWM_DUTY_DRIVE = 170;  // 0..255 (66% default)
static const int   DIST_STOP_CM    = 12;   // obstacle threshold
static const int   PROX_RAW_MAX    = 4095;  // 12-bit ADC on ESP32
static const int   PROX_RAW_TRIG   = 2800;  // ~ 68% of full scale => close
static const long  LOOP_MS         = 50;

// State machine codes for the status-LED blink
enum MovementState { ST_IDLE, ST_DRIVE, ST_REVERSE };
static MovementState g_state = ST_IDLE;

static void driveInit() {
  ledcAttach(PIN_PWMA, PWM_FREQ_HZ, PWM_RES_BITS);
  ledcAttach(PIN_PWMB, PWM_FREQ_HZ, PWM_RES_BITS);
  pinMode(PIN_AIN1, OUTPUT);
  pinMode(PIN_AIN2, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  digitalWrite(PIN_AIN1, LOW);
  digitalWrite(PIN_AIN2, LOW);
}

static void motorsForward(int duty) {
  digitalWrite(PIN_AIN1, HIGH);
  digitalWrite(PIN_AIN2, HIGH);
  ledcWrite(PIN_PWMA, duty);
  ledcWrite(PIN_PWMB, duty);
}

static void motorsStop() {
  ledcWrite(PIN_PWMA, 0);
  ledcWrite(PIN_PWMB, 0);
  digitalWrite(PIN_AIN1, LOW);
  digitalWrite(PIN_AIN2, LOW);
}

static long measureCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long dur = pulseIn(PIN_ECHO, HIGH, 30000UL);  // 30 ms timeout
  if (dur <= 0) return -1;
  return (dur * 34) / 2000;  // microsec to cm
}

static bool proxBlocked() {
  int v1 = analogRead(PIN_IR1);
  int v2 = analogRead(PIN_IR2);
  return (v1 >= PROX_RAW_TRIG || v2 >= PROX_RAW_TRIG);
}

static void blinkStatus(MovementState st) {
  switch (st) {
    case ST_IDLE:    digitalWrite(PIN_LED, HIGH); delay(40); digitalWrite(PIN_LED, LOW); break;
    case ST_DRIVE:   digitalWrite(PIN_LED, HIGH); delay(120); digitalWrite(PIN_LED, LOW); break;
    case ST_REVERSE: digitalWrite(PIN_LED, HIGH); delay(220); digitalWrite(PIN_LED, LOW); break;
  }
}

// No-op notification hook: the maintainer wires this to a notification/Webhook
// service downstream. Deliberately does not sign or broadcast any blockchain tx.
static void notifyMyzubster(const char* /* evt */) { /* no-op stub */ }

void setup() {
  Serial.begin(115200);
  driveInit();
  Serial.println("MyZubster DIY kit: boot ok");
}

void loop() {
  long cm = measureCm();
  bool blocked = proxBlocked() || (cm > 0 && cm < DIST_STOP_CM);

  if (blocked) {
    motorsStop();
    g_state = ST_REVERSE;
    notifyMyzubster("bump");
    delay(120);
    // simple back-spin (one side) to escape
    digitalWrite(PIN_AIN1, LOW);
    digitalWrite(PIN_AIN2, HIGH);
    ledcWrite(PIN_PWMA, 80);
    ledcWrite(PIN_PWMB, 80);
    delay(220);
    motorsStop();
  } else {
    motorsForward(PWM_DUTY_DRIVE);
    g_state = ST_DRIVE;
  }
  blinkStatus(g_state);
  delay(LOOP_MS);
}
