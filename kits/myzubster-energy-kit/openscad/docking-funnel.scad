// Parametric docking funnel for the MyZubster robot auto-recharge system.
// This funnel guides the robot into the charging contacts when it
// approaches the station from any angle. Issue #85 task: Navigazione
// verso colonnina di ricarica + Connessione automatica.
// Print in PETG, 30% infill for flexibility.

// Parameters (mm)
funnel_top_d = 90;
funnel_bottom_d = 56;
funnel_h = 50;
wall_t = 3;
slot_w = 12;
slot_count = 4;
bolt_dia = 3.4;
$fn = 64;

module docking_funnel() {
  difference() {
    // outer cone
    cylinder(h = funnel_h, d1 = funnel_bottom_d, d2 = funnel_top_d, center = true);
    // inner cone (hollow)
    translate([0, 0, wall_t])
      cylinder(h = funnel_h, d1 = funnel_bottom_d - wall_t * 2, d2 = funnel_top_d - wall_t * 2, center = true);
    // alignment slots (guide fins that center the robot)
    for (i = [0 : slot_count - 1])
      rotate([0, 0, i * (360 / slot_count)])
        translate([0, (funnel_bottom_d + funnel_top_d) / 4, 0])
          cube([slot_w, (funnel_top_d - funnel_bottom_d) / 2 + 10, funnel_h + 2], center = true);
    // mount holes
    for (i = [0 : 3])
      rotate([0, 0, 45 + i * 90])
        translate([funnel_top_d / 2 - 6, 0, funnel_h / 2 - 3])
          cylinder(h = 8, d = bolt_dia, $fn = 20, center = true);
  }
}

docking_funnel();
