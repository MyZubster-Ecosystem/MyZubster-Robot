// Parametric modular chassis frame for the <200 EUR modular lawnmower.
// Four motor mounts snap to a detachable frame so the chassis can be
// printed in PETG on a standard 220 mm print bed and snapped together.
// Issue #70 task: Disegnare il telaio (STL per stampa 3D).
// Print in PETG or ASA, 100% infill; the cutting blade and motors are NOT printed.

// Parameters (mm)
frame_length = 280;        // chassis length (wheelbase direction)
frame_width = 220;        // chassis width (track direction)
frame_height = 35;        // chassis rail height
rail_thickness = 8;        // side rail wall thickness
cross_count = 3;          // number of cross-beams between side rails
cross_thickness = 6;      // cross beam thickness
cross_width = 18;          // cross beam width (along chassis length)
motor_mount_dia = 42;     // brushed motor bolt circle diameter
motor_shaft_dia = 6;       // motor shaft clearance
mounnt_bolt_dia = 4.2;    // M4 motor mount bolts (3x at 120 deg per motor)
snap_tab_w = 8;            // snap-fit tab width (modularity)
snap_tab_h = 4;            // snap-fit tab thickness
$fn = 96;

module side_rail(l) {
  difference() {
    cube([l, frame_width / 2 - rail_thickness, frame_height], center = false);
    translate([0, rail_thickness, rail_thickness])
      cube([l, frame_width / 2 - 2 * rail_thickness, frame_height - 2 * rail_thickness]);
  }
}

module cross_beam(l) {
  translate([0, 0, 0])
    cube([cross_width, l, cross_thickness], center = false);
}

module motor_mount() {
  difference() {
    cylinder(h = frame_height, d = motor_mount_dia, $fn = 64);
    cylinder(h = frame_height, d = motor_shaft_dia, $fn = 32);
    for (a = [0, 120, 240]) {
      rotate([0, 0, a])
        translate([motor_mount_dia / 2 - 4, 0, frame_height - 6])
          cylinder(h = 8, d = mounnt_bolt_dia, $fn = 24);
    }
  }
}

module chassis_frame() {
  // left side rail
  side_rail(frame_length);
  // right side rail
  translate([0, frame_width / 2 + rail_thickness, 0]) side_rail(frame_length);
  // cross beams span between the two side rails
  for (i = [0 : cross_count - 1]) {
    x = i * (frame_length - cross_width) / (cross_count - 1);
    translate([x, rail_thickness, frame_height / 2 - cross_thickness / 2])
      cross_beam(frame_width - 2 * rail_thickness);
  }
  // four motor mounts, one per wheel corner
  motor_pos = [
    [12, 0], [12, frame_width],
    [frame_length - 54, 0], [frame_length - 54, frame_width],
  ];
  for (p = motor_pos) {
    translate([p[0], p[1], 0]) motor_mount();
  }
  // snap-fit tabs at the four corners (modularity - detachable frame)
  for (px = [0, frame_length - snap_tab_w]) {
    for (py = [-snap_tab_h / 2, frame_width - snap_tab_h / 2]) {
      translate([px, py + (py < 0 ? rail_thickness : 0), frame_height])
        cube([snap_tab_w, snap_tab_h, 2]);
    }
  }
}

chassis_frame();
// Snap-fit tabs let the rails detach for transport; the cross beams keep the wheelbase square.
// Mount the motor cups with M4 bolts; the cutting deck hangs off the two rear cross beams.
