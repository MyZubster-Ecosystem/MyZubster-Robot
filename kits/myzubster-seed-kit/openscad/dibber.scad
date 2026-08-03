// Parametric dibber (dibble stick) for the seed-planting robot.
// Creates a conical hole in soil for seed insertion.
// Issue #77 task: Progettare meccanismo di piantagione.
// Print in PETG or PLA, 100% infill for rigidity.

// Parameters (mm)
dibber_length = 60;       // total length of the dibber shaft
dibber_tip_len = 20;     // length of the conical tip
dibber_base_dia = 12;    // diameter at the base (top)
dibber_tip_dia = 3;      // diameter at the tip (makes ~30 mm hole at full insertion)
mount_hole_dia = 4.2;    // mounting hole for servo horn / M4 bolt

$fn = 64;  // smooth circles

module dibber() {
  // main conical body
  hull() {
    cylinder(h = dibber_tip_len, r1 = dibber_tip_dia / 2, r2 = dibber_base_dia / 2);
    cylinder(h = 0.1, r1 = dibber_tip_dia / 2, r2 = dibber_tip_dia / 2);
  }

  // shaft above the cone
  translate([0, 0, dibber_tip_len])
    cylinder(h = dibber_length - dibber_tip_len, d = dibber_base_dia);

  // mounting hole through the top
  translate([0, 0, dibber_length - 6])
    cylinder(h = 6, d = mount_hole_dia, $fn = 24);
}

dibber();
// Print tip-down for best overhang results.
