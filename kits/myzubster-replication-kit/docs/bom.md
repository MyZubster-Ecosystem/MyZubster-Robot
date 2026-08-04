# Bill of Materials - MyZubster Self-Replication Kit (issue #73)

> BOM for one complete replication build (a robot re-producing a copy of itself
> with interchangeable modular components). Prices are indicative EU retail;
> tune for your supply situation. The firmware `bomBudgetValidator` helper lists
> every required category and flags a shortage.

| Module | Component | Qty | Unit EUR | Sub EUR |
|---|---|---|---|---|
| Chassis | 3D-printed modular chassis block (`openscad/modular-chassis-block.scad`) | 1 | 3 (filament) | 3 |
| Motor | TT gearmotor with snap-fit ring | 2 | 6 | 12 |
| Wheel | 65 mm press-fit wheel | 2 | 4 | 8 |
| Controller | ESP32 DevKit motherboard | 1 | 8 | 8 |
| Sensor | VL53L0X ToF distance sensor (magnetic plug) | 3 | 5 | 15 |
| Magazine | 3D-printed part magazine (`openscad/part-magazine.scad`) | 1 | 4 (filament) | 4 |
| Power | 18650 cell + holder | 1 | 9 | 9 |
| Harness | jumper wires + USB-C cable (clone/flash only) | 1 | 5 | 5 |

**Total: ~64 EUR** (informational; well under the indicative 250 EUR envelope).
The kit re-uses existing MyZubster modular parts where possible (circular-economy
label), so an operator building a copy of an existing robot can recycle modules
from worn units instead of sourcing all-new components.

## Required categories (matches firmware `requiredModules`)

- `chassis` - interchangeable frame module (snap-fit + M3 sockets)
- `motor` - plug-and-play drive motor (snap-fit plug + M3)
- `wheel` - press-fit wheel (snap-fit plug)
- `controller` - ESP32 motherboard with clonable firmware (GPIO-header + USB-C seat)
- `sensor` - modular sensors (magnetic plug)

## Safety scope

This BOM contains no cryptocurrency wallet hardware, no signing module, and no
mainnet/network radio. The ESP32 runs deterministic firmware helpers only; the
clonable-firmware manifest is a documentation-only spec (see `clonable-firmware-
spec.md`). No real key material or signed firmware is involved.
