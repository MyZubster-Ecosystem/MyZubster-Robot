// Parametric conveyor track segment for the MyZubster assembly line.
// Interconnects stations and advances the child between positions.
// Issue #80 task: Creare sequenza di assemblaggio.
// Print in PETG, 50% infill; drive with NEMA17 stepper via timing belt.

// Parameters (mm)
track_l = 150;            // track segment length (between station centers)
track_w = 30;           // track width
track_h = 8;            // track height
belt_slot_w = 6;        // timing belt slot width
belt_slot_h = 3;       // timing belt slot depth
rail_h = 12;           // guide rail height
rail_w = 3;            // guide rail thickness
bolt_dia = 3.4;        // M3 mounting
$fn = 48;

module conveyor_track() {
  difference() {
    cube([track_l, track_w, track_h], center = true);
    // timing belt slot down the middle
    cube([track_l, belt_slot_w, belt_slot_h], center = true);
    // mounting holes at both ends
    for (sx = [-1, 1])
      translate([sx * (track_l / 2 - 6), 0, 0])
        cylinder(h = track_h + 2, d = bolt_dia, $fn = 20, center = true);
    for (sx = [-1, 1])
      translate([sx * (track_l / 2 - 6), track_w / 2 - 4, 0])
        cylinder(h = track_h + 2, d = bolt_dia, $fn = 20, center = true);
  }
  // guide rails on both sides
  for (sy = [-1, 1])
    translate([0, sy * (track_w / 2 - rail_w / 2), track_h / 2])
      cube([track_l, rail_w, rail_h], center = true);
}

conveyor_track();
