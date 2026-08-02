// Parametric 3-DOF mechanical arm for the MyZubster mother robot.
// Base rotation + shoulder pitch + elbow pitch, with a gripper mount at the end.
// Issue #78 task: Braccio meccanico per assemblaggio.
// Print in PETG, 60% infill; use metal shafts + bearings at the joints.

// Parameters (mm)
base_height = 40;           // base mount height (above chassis rail)
base_dia = 50;              // base rotation disk diameter
shoulder_len = 120;        // upper arm link length
shoulder_w = 28;           // upper arm link width
elbow_len = 100;          // forearm link length
elbow_w = 24;             // forearm link width
link_h = 10;              // link thickness
joint_dia = 16;           // joint bearing diameter
gripper_mount_l = 20;     // gripper mount plate length
gripper_mount_w = 15;    // gripper mount plate width
bolt_dia = 3.4;          // M3 for joint shafts + motor mounts

$fn = 48;

module assembly_arm() {
  // base rotation disk + mount column
  cylinder(h = base_height, d = base_dia);
  translate([0, 0, base_height])
    cylinder(h = 4, d = joint_dia, $fn = 32);
  // upper arm (shoulder link)
  translate([0, 0, base_height + 4])
    rotate([90, 0, 0])
      difference() {
        cube([shoulder_len, link_h, shoulder_w], center = true);
        // joint holes at both ends
        for (sx = [-1, 1])
          translate([sx * (shoulder_len / 2 - 6), 0, 0])
            rotate([90, 0, 0])
              cylinder(h = link_h + 2, d = bolt_dia, $fn = 20, center = true);
      }
  // forearm (elbow link)
  translate([shoulder_len / 2 - 6, 0, base_height + 4])
    rotate([90, 0, 0])
      difference() {
        cube([elbow_len, link_h, elbow_w], center = true);
        for (sx = [-1, 1])
          translate([sx * (elbow_len / 2 - 5), 0, 0])
            rotate([90, 0, 0])
              cylinder(h = link_h + 2, d = bolt_dia, $fn = 20, center = true);
      }
  // gripper mount plate at end of forearm
  translate([shoulder_len, 0, base_height + 4])
    cube([gripper_mount_l, link_h, gripper_mount_w], center = true);
}

assembly_arm();
// Mount the base column into the left expansion rail of the mother chassis.
