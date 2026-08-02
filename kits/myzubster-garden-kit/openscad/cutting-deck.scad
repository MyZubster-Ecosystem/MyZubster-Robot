// Parametric grass cutting deck housing for the garden-automation robot.
// Holds a brushless blade motor and a safety guard ring.
// Issue #76 task: Scegliere sensori e attuatori.
// Print in PETG or ASA, 100% infill; the blade is NOT printed (use a hardened steel mower blade).

// Parameters (mm)
deck_outer_dia = 180;     // outer diameter of the deck ring
deck_inner_dia = 150;     // inner diameter (blade sweep clearance)
deck_height = 35;        // deck wall height
blade_shaft_dia = 8;     // motor shaft diameter
motor_mount_dia = 42;    // brushless motor mount bolt circle
mount_bolt_dia = 4.2;   // M4 mounting bolts (3x at 120 deg)
guard_slot_w = 6;        // width of grass discharge slot
guard_slot_h = 18;       // height of grass discharge slot

$fn = 96;

module cutting_deck() {
  difference() {
    // outer deck ring
    cylinder(h = deck_height, d = deck_outer_dia);
    // blade clearance bore
    translate([0, 0, 8])
      cylinder(h = deck_height, d = deck_inner_dia);
    // central motor shaft hole
    cylinder(h = deck_height, d = blade_shaft_dia, $fn = 32);
    // motor mount bolt holes (3 bolts at 120 deg)
    for (a = [0, 120, 240]) {
      rotate([0, 0, a])
        translate([motor_mount_dia / 2, 0, deck_height - 10])
          cylinder(h = 12, d = mount_bolt_dia, $fn = 24);
    }
    // grass discharge slot
    translate([deck_outer_dia / 2 - 2, -guard_slot_w / 2, 10])
      cube([10, guard_slot_w, guard_slot_h]);
  }
}

cutting_deck();
// Mount with the discharge slot pointing away from the chassis drive path.
