// Parametric soil cover blade for the seed-planting robot.
// A small blade that pushes loose soil back over the dibbed hole after seed drop.
// Connected to an SG90 servo; retracts at 110 degrees, pushes at 40 degrees.
// Issue #77: Rilascio semi e copertura.

// Parameters (mm)
blade_length = 40;       // total length of the blade
blade_width = 3;         // thickness of the blade
blade_height = 20;       // how tall the blade is
mount_width = 15;        // width of the servo mounting block
mount_height = 8;        // height of the mounting block
horn_hole = 2.5;         // hole for servo horn screw (M2.5)

$fn = 48;
eps = 0.01;

module soil_cover() {
  union() {
    // blade (flat part that scrapes soil)
    translate([0, -blade_width / 2, 0])
      cube([blade_length, blade_width, blade_height]);

    // mounting block at the base of the blade
    translate([-mount_width / 2, -mount_width / 2, 0])
      cube([mount_width, mount_width, mount_height]);

    // servo horn hole
    translate([0, -blade_width / 2, mount_height / 2])
      rotate([90, 0, 0])
        cylinder(h = blade_width + 2 * eps, d = horn_hole, $fn = 16);
  }

  // angled blade tip for self-cleaning
  translate([blade_length - 5, -blade_width / 2, 0])
    rotate([0, 0, 25])
      cube([8, blade_width, blade_height]);
}

soil_cover();
// Print flat (blade down on build plate) for strength.
