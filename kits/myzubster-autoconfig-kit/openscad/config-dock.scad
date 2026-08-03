// Parametric configuration programming dock for the MyZubster robot.
// Holds the child robot in alignment while the auto-config firmware runs.
// Issue #81 task: Implementare API di configurazione.
// Print in PETG, 50% infill.

// Parameters (mm)
dock_l = 120;
dock_w = 80;
dock_h = 6;
child_cradle_d = 55;
child_cradle_depth = 12;
probe_dia = 4;
probe_count = 4;
bolt_dia = 3.4;
$fn = 48;

module config_dock() {
  difference() {
    cube([dock_l, dock_w, dock_h], center = true);
    // child robot cradle
    cylinder(h = child_cradle_depth, d = child_cradle_d, center = true);
    // programming probes (serial TX/RX/GND/VCC)
    for (i = [0 : probe_count - 1])
      translate([(i - (probe_count - 1) / 2) * 8, -dock_w / 2 + 5, 0])
        cylinder(h = dock_h + 2, d = probe_dia, $fn = 20, center = true);
    // corner mount bolts
    for (sx = [-1, 1], sy = [-1, 1])
      translate([sx * (dock_l / 2 - 8), sy * (dock_w / 2 - 8), 0])
        cylinder(h = dock_h + 2, d = bolt_dia, $fn = 20, center = true);
  }
  // cradle lip
  translate([0, 0, dock_h / 2])
    difference() {
      cylinder(h = 4, d = child_cradle_d + 8);
      cylinder(h = 4, d = child_cradle_d);
    }
}

config_dock();
