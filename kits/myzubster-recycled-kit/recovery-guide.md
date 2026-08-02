# Guida al recupero

Safe disassembly steps to recover the components listed in `recyclable-components.md`. These are general-purpose electrical-safety guidance for scrap electronics - not financial operations. Read `reconversion-schematics.md` for how to wire recovered parts.

## Sicurezza (safety first)

Before touching any donor device:

1. **No live mains.** Unplug any mains-powered device (printer, dryer, anything with a wall cord) and wait >=5 minutes for capacitors to bleed.
2. **Remove the onboard battery** from laptops / phones before disassembly; recover cells per their section below.
3. **Wear safety glasses** (snapped springs, shards) and **insulated gloves** for battery handling.
4. **Discharge large capacitors**: in mains devices, bridge the capacitor terminals with a 2 kOhm / 5 W resistor for 30 s, then confirm with a multimeter (<10 V) before contact.
5. **Ventilate** for solder fumes; wash hands after handling old electronics.

Never recover:
- Swollen / punctured / corroded batteries (fire risk).
- Large mains capacitors from CRT TVs / microwaves / camera flashes (can hold a lethal charge for weeks).
- Any mains-rated AC motor for a battery-powered robot build (see `recyclable-components.md`).

## Strumenti (tools)

- Precision screwdriver set (Phillips #0/#1, Torx T6-T10, flat-blade 2 mm).
- Plastic spudger / opening picks.
- Wire cutters + strippers (24-18 AWG).
- Soldering iron (60 W) + lead-free solder + flux.
- Multimeter (continuity + DC voltage).
- Insulated gloves + safety glasses.
- Small Torx / hex driver set for toys.

## Smontaggio stampante

1. Unplug, wait 5 min; if a laser printer, discharge the HV section (see safety).
2. Remove the top cover (3-6 screws), lift the carriage.
3. Carriage DC motor: disconnect the 2-wire plug, unscrew, label "carriage DC 6V".
4. Paper-feed stepper: 4-6 wire, side screws; label coil pairs (low-ohm pair = one coil) before removing.
5. Encoder strip + slotted wheel: store flat; label for odometry use.
6. CD / DVD tray motor: 2-wire small DC + gearbox - pull the whole drive module out.

## Smontaggio laptop (batteria)

1. Remove the main battery pack per the laptop manual first; continue disassembly from there.
2. Open the battery-pack housing carefully - **do not short the cell terminals** with tools.
3. Recover **each 18650 cell individually**: lift it out, label rest voltage, store upright in a non-conductive tray.
4. Test each cell after >=24 h rest:
   - rest voltage in [2.8 V, 4.2 V]? -> keep candidate.
   - <2.8 V, swollen, corroded terminal, or warm under load -> **discard at a battery recycling point**, do not use.
5. Recover the small protection board (if the pack used a DW01-class IC) for re-use as a single-cell protector.

## Smontaggio telefono

1. Remove the screen / back panel with a heat gun at low setting + spudger; do not pry hard on the battery.
2. Recover the **vibrator motor** (tiny eccentric DC) - usually a 2-wire part soldered to the main board.
3. Recover the **IR / ambient-light sensor** at the top of the phone - small flex, often labeled.
4. Recover the **accelerometer / gyro** (small QFN next to the SoC) only if you can de-solder QFN; otherwise skip.
5. Recover the small Li-Po pouch **as suspect**: bag it, charge later on a fireproof surface with a TP4056; discard if it swells or gets hot.

## Smontaggio giocattoli

1. Open the toy shell (Phillips / Tri-wing screws).
2. Remove the original RC board; keep the **DC motors + gearbox + wheels + mounts** - the highest-value recoveries.
3. Keep the **plastic chassis frame** as a ready-to-use robot base.
4. Recover any battery holder / switch for re-use.

## Condensatori / batterie: gestione

- **Capacitors** in mains devices: always discharge + measure before contact; treat any cap >=50 V as live until verified.
- **Batteries**: never short terminals, never puncture, never heat above 60 C. Recover only cells with rest voltage in [2.8 V, 4.2 V]. Charge recovered cells outdoors or in a lipo bag with a TP4056 at 0.5 A; stop if the cell exceeds 45 C.
- **Storage**: store recovered cells individually in a non-conductive tray, terminals taped, cool & dry, away from flammables.
- **End of life**: any cell that fails a load test goes to a battery recycling point, not household waste.
