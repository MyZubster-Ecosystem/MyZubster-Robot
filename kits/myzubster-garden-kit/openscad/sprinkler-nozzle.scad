// Parametric irrigation sprinkler nozzle for the garden-automation robot.
// Screws onto a standard 1/2" BSP irrigation riser and distributes water in a fan.
// Issue #76 task: Irrigazione programmata.
// Print in PETG or rigid PVC; verify water flow before connecting the supply.

// Parameters (mm)
base_dia = 24;            // base flange diameter
base_height = 10;        // base flange height
thread_od = 20.955;      // 1/2" BSP external thread approx OD
thread_height = 12;      // threaded riser length
nozzle_dia = 8;          // nozzle body diameter
nozzle_height = 18;      // nozzle body height
fan_slots = 5;           // number of fan spray slots
fan_slot_w = 0.8;        // width of each fan slot
fan_slot_h = 4;          // height of each fan slot
fan_arc = 90;            // total fan spread in degrees

$fn = 64;

module sprinkler_nozzle() {
  // threaded base riser
  cylinder(h = thread_height, d = thread_od, $fn = 48);
  // flange
  translate([0, 0, thread_height])
    cylinder(h = base_height, d = base_dia);
  // nozzle body
  translate([0, 0, thread_height + base_height])
    cylinder(h = nozzle_height, d = nozzle_dia);
  // fan spray slots cut into the nozzle top
  translate([0, 0, thread_height + base_height + nozzle_height - fan_slot_h])
    for (i = [0 : fan_slots - 1]) {
      angle = -fan_arc / 2 + (fan_arc / (fan_slots - 1)) * i;
      rotate([90, 0, angle])
        translate([0, 0, -nozzle_dia / 2 - 1])
          cylinder(h = nozzle_dia + 2, d = fan_slot_w, $fn = 24);
    }
}

sprinkler_nozzle();
// Tune fan_slots and fan_arc for the desired spray width and droplet size.
