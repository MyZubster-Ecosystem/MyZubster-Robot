// Parametric seed hopper slotted disk for the seed dispenser.
// 8-slot Geneva-style wheel: one seed drops per slot revolution.
// Driven by a 28BYJ-48 stepper (4096 steps/rev) via ULN2003 driver.
// Issue #77: Rilascio semi e copertura.
// Print in PETG for UV resistance; use 0.2 mm layer height for clean slot edges.

// Parameters (mm)
disk_outer_dia = 48;       // outer diameter
disk_thick = 6;            // thickness
hub_dia = 8;               // central hub (for stepper shaft coupling)
hub_height = 12;           // hub extends above disk for shaft clamp
slot_count = 8;            // number of seed slots
slot_dia = 6;               // seed pocket diameter (tune for your seed size)
slot_depth = 4;             // how deep each seed pocket is recessed
center_bore = 5;           // bore through the hub for the stepper shaft
set_screw_dia = 3;         // M3 set-screw to lock onto shaft

$fn = 64;
eps = 0.01;

module seed_hopper() {
  difference() {
    union() {
      // main disk body
      cylinder(h = disk_thick, d = disk_outer_dia);
      // hub
      translate([0, 0, 0])
        cylinder(h = hub_height, d = hub_dia);
    }
    // center bore for shaft
    translate([0, 0, -eps])
      cylinder(h = disk_thick + hub_height + 2 * eps, d = center_bore, $fn = 24);

    // set-screw hole
    translate([hub_dia / 2, 0, hub_height - 3])
      rotate([0, 90, 0])
        cylinder(h = hub_dia / 2 + eps, d = set_screw_dia, $fn = 16);

    // seed slots around the perimeter
    for (i = [0 : slot_count - 1]) {
      angle = i * (360 / slot_count);
      slot_r = disk_outer_dia / 2 - slot_dia / 2 - 2;
      translate([slot_r * cos(angle), slot_r * sin(angle), disk_thick - slot_depth])
        cylinder(h = slot_depth + eps, d = slot_dia, $fn = 24);
    }
  }
}

seed_hopper();
// Orient disk-down (hub-up) for printing.
