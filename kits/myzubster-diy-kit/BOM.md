# MyZubster DIY Kit — Bill of Materials (BOM)

Issue #75 budget cap: **200 EUR** indicative EU retail total.

For each line: `qty * EUR ≈ ` approximate EU retail price ( Amazon DE / AliExpress / Banggood / Digi-Key / Mouser equivalent ). The links below are **generic public search links, not affiliate links**: paste the search term into your preferred EU distributor; local shipping + VAT changes the final.

| SKU | Part | Qty | Unit EUR | Line EUR | Category | Search hint |
|---|---|---:|---:|---:|---|---|
| ESP32-DEVKIT-V1 | ESP32 DevKit V1 (38-pin, WROOM-32, 3.3V logic) | 1 | 8.00 | 8.00 | controller | https://www.amazon.de/s?k=ESP32+DevKit+V1 |
| DRV8833 | DRV8833 dual H-bridge motor driver breakout | 1 | 5.00 | 5.00 | driver | https://www.aliexpress.com/wholesale?SearchText=DRV8833+module |
| TT-MOTOR | TT gear DC motor + wheel, 3–6V | 2 | 4.00 | 8.00 | motor | https://www.amazon.de/s?k=TT+gear+motor+wheel |
| HC-SR04 | HC-SR04 ultrasonic distance sensor | 1 | 2.00 | 2.00 | sensor | https://www.aliexpress.com/wholesale?SearchText=HC-SR04 |
| IR-PROX-2P | IR proximity sensor (analog out) | 2 | 1.50 | 3.00 | sensor | https://www.amazon.de/s?k=IR+proximity+sensor+arduino |
| LIPO-3V7-2000 | 18650 3.7V 2000mAh rechargeable LiPo (with protection PCB) | 1 | 7.00 | 7.00 | power | https://www.aliexpress.com/wholesale?SearchText=18650+2000mAh |
| TP4056 | TP4056 LiPo charger breakout | 1 | 1.00 | 1.00 | power | https://www.aliexpress.com/wholesale?SearchText=TP4056+module |
| MB-3V3 | Mini breadboard 3.3V rail | 1 | 3.00 | 3.00 | wiring | https://www.amazon.de/s?k=mini+breadboard |
| JW-40 | Jumper wires 40pc male-male + 40pc male-female | 1 | 2.50 | 2.50 | wiring | https://www.aliexpress.com/wholesale?SearchText=jumper+wires+arduino |
| USB-C-BOOT | USB-C / micro-USB cable for flashing ESP32 | 1 | 2.00 | 2.00 | wiring | https://www.amazon.de/s?k=USB+C+cable+data |
| FRAME-SCAD | 3D-printable chassis frame — render from `hardware/frame.scad` | 1 | 0.00 | 0.00 | frame-self-print | print with local FDM printer; ~10m PLA filament |
| **Total** | | | | **40.50** | | well under the 200 EUR cap |

Notes:

- Prices are indicative EU retail in EUR and may vary by ±50% across distributor + season. The `firmware/lib/bom/bom.js` helpers + `npm run bom:check` verify the line totals sum < 200 EUR programmatically.
- The `FRAME-SCAD` row is the 3D-printable chassis frame; filament cost is intentionally summed at EUR 0 because `npm run bom:check` focuses on purchased parts and the filament is accounted as a self-print step (filament for one small chassis is <EUR 1 of standard PLA, leaving ample headroom under the 200 EUR cap).
- ESP32 DevKit V1 from common EU sellers is typically EUR 6–12; the listed EUR 8 is the typical median. DRV8833 is preferred over L298N for lower voltage drop on a 3.7V LiPo source.
- 18650 cell must include a protection PCB; do not use raw cells. Use only chargers rated for LiPo chemistry.

See also: [`hardware/wiring.md`](hardware/wiring.md), [`hardware/frame.scad`](hardware/frame.scad), [`firmware/firmware.ino`](firmware/firmware.ino), [`README.md`](README.md).
