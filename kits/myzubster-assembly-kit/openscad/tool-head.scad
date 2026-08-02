// Parametric end-effector tool head for the MyZubster assembly line arm.
// Swappable heads: gripper, welding tip, board press, firmware flash dock.
// Issue #80 task: Scrivere codice per braccio meccanico.
// Print in PETG, 60% infill; snap onto the arm wrist mount.

// Parameters (mm)
head_base_dia = 24;        // base mounting disk diameter
head_base_h = 8;          // base thickness
gripper_jaw_l = 18;      // gripper jaw length
gripper_jaw_w = 5;      // gripper jaw width
gripper_jaw_h = 12;     // gripper jaw height
gripper_gap = 12;       // gap between jaws (open position)
probe_dia = 4;          // spring probe diameter for flash dock
probe_l = 10;           // spring probe length
mount_pin_dia = 4;      // wrist mount pin
$fn = 48;

module tool_head() {
  // base disk
  cylinder(h = head_base_h, d = head_base_dia);
  // wrist mount pin
  translate([0, 0, head_base_h])
    cylinder(h = 6, d = mount_pin_dia, $fn = 24);
  // gripper jaws (symmetric pair)
  for (sx = [-1, 1])
    translate([sx * (gripper_gap / 2 + gripper_jaw_w / 2), 0, -gripper_jaw_h / 2])
      difference() {
        cube([gripper_jaw_w, gripper_jaw_l, gripper_jaw_h], center = true);
        // grip serration cutouts
        translate([0, 0, 0])
          for (yz = [-2 : 4 : gripper_jaw_l + 2])
            translate([sx * gripper_jaw_w / 2, yz - gripper_jaw_l / 2, 0])
              rotate([0, 90, 0])
                cylinder(h = gripper_jaw_w + 2, d = 1.5, $fn = 12, center = true);
      }
  // spring probes (for flash dock)
  for (px = [-1, 1])
    translate([px * 3, -gripper_gap, -probe_l / 2])
      cylinder(h = probe_l, d = probe_dia, $fn = 20, center = true);
}

tool_head();
