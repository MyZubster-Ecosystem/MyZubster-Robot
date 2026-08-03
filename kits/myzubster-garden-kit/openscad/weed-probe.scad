// Parametric weed detection probe mount for the garden-automation robot.
// Holds a downward-facing optical sensor + an ultrasonic height probe.
// Issue #76 task: Rilevamento erbacce.
// Print in PLA or PETG, 50% infill; mount sensor face-down toward the canopy.

// Parameters (mm)
mount_plate_l = 60;       // mount plate length
mount_plate_w = 40;      // mount plate width
mount_plate_h = 4;       // mount plate thickness
sensor_dia = 16;          // optical vision sensor OD (e.g. OV2640 module)
sensor_depth = 20;        // how deep the sensor sits in the mount
sonar_dia = 22;           // ultrasonic sensor (HC-SR04) canister OD
sonar_depth = 10;         // ultrasonic sensor embed depth
bolt_dia = 3.4;           // M3 mounting bolts
bolt_circle = 48;        // bolt circle for chassis mount

$fn = 48;

module weed_probe() {
  difference() {
    // base mount plate
    cube([mount_plate_l, mount_plate_w, mount_plate_h], center = true);
    // optical sensor bore
    translate([-12, 0, 0])
      cylinder(h = mount_plate_h + 2, d = sensor_dia, center = true);
    // ultrasonic sensor bore
    translate([14, 0, 0])
      cylinder(h = mount_plate_h + 2, d = sonar_dia, center = true);
    // chassis mount bolt holes
    for (sx = [-1, 1], sy = [-1, 1]) {
      translate([sx * bolt_circle / 2, sy * bolt_circle / 2, 0])
        cylinder(h = mount_plate_h + 2, d = bolt_dia, $fn = 20);
    }
  }
  // sensor retention sleeves
  translate([-12, 0, -sensor_depth / 2 + mount_plate_h / 2])
    cylinder(h = sensor_depth, d = sensor_dia + 3);
  translate([14, 0, -sonar_depth / 2 + mount_plate_h / 2])
    cylinder(h = sonar_depth, d = sonar_dia + 3);
}

weed_probe();
// Point the optical sensor at the canopy; the sonar reads plant height for the classifier.
