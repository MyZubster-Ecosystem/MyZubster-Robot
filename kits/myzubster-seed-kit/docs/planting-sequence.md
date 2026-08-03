# Planting sequence

## Mission overview

The planting mission is a state machine driven by `plantingMission(positions)`. Given a list of grid positions, it produces an ordered sequence of commands:

```
for each position (row, col):
  1. move    - navigate to the grid cell
  2. dig     - lower the dibber to make a hole (servo angle 90 -> 20)
  3. seed    - rotate the dispenser stepper to drop 1 seed (512 steps)
  4. cover   - sweep the soil cover blade over the hole (servo 110 -> 40)
``+
## Step detail

### 1. Move

The robot navigates from its current grid cell to the target cell. Movement is grid-relative (row, col offsets from the field origin). The actual wheel navigation is handled by the chassis firmware; the seed kit only produces the target coordinates.

### 2. Dig

The dibber servo rotates from its rest angle (90 degrees, raised) to the down angle (20 degrees, fully inserted). This makes a conical hole approximately 30 mm deep. The `dibberAngle(depthMm)` function maps depth to servo angle linearly.

### 3. Seed

The 28BYJ-48 stepper rotates the seed hopper disk by one slot (512 steps at 4096 steps/rev / 8 slots). One seed drops through the hopper slot into the hole.

### 4. Cover

The soil cover servo sweeps from its rest angle (110 degrees) to the push angle (40 degrees), pushing loose soil back over the hole. The servo then returns to rest.

## Verification

Run `npm run seed:check` to execute a headless simulation of a 3x3 grid planting mission. The script:
1. Generates 9 GPS coordinates at 0.5 m spacing from a field origin
2. Parses each as a synthetic NMEA GGA sentence
3. Maps each to grid coordinates
4. Runs the full planting mission (36 steps)
5. Prints growth monitor readings at various soil conditions
6. Accumulates energy usage for the full mission
7. Verifies all invariants and exits 0

## Field operation

1. Start the robot at the field origin corner
2. Wait for GPS fix (fix quality 1 or 2 on the GGA line)
3. Define the grid dimensions (rows x cols) via the control interface
4. Start the mission; the robot will move-dig-seed-cover at each position
5. The growth monitor should be checked before the mission; skip planting if soil conditions are unsuitable
