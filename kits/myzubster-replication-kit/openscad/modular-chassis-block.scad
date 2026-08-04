// Modular chassis block for the MyZubster self-replication kit (issue #73).
// Parametric interchangeable chassis: snap-fit sockets for motors/wheels and a
// GPIO-header + USB-C seat for the ESP32 motherboard. Pure geometry, no I/O.
// Tune wall, snap-fit tolerance, and socket layout for your printer + supply.

$fn = 48;

// ----- parameters -----
block_mm      = 120;   // chassis block length
width_mm      = 80;    // chassis block width
wall_mm       = 4;     // outer wall thickness
tower_h_mm    = 18;    // motor-tower height
snap_t        = 0.25;  // snap-fit press-fit tolerance (mm)

motor_socket_d = 36;   // motor module cylinder socket OD (press-fit, +tolerance)
wheel_shaft_d  = 6.0;  // wheel shaft press-fit diameter
esc_slot_w     = 30;   // ESP32 motherboard slot width
esc_slot_l     = 52;   // ESP32 motherboard slot length
esc_slot_h     = 8;     // motherboard seat depth

module motor_tower() {
  translate([0, 0, tower_h_mm / 2])
    difference() {
      cylinder(h = tower_h_mm, d = motor_socket_d + 2 * wall_mm, center = true);
      cylinder(h = tower_h_mm + 0.2, d = motor_socket_d + 2 * snap_t, center = true);
    }
}

module motherboard_seat() {
  translate([0, 0, esc_slot_h / 2])
    difference() {
      cube([esc_slot_l + 2 * wall_mm, esc_slot_w + 2 * wheel_shaft_d + 2 * wall_mm, esc_slot_h], center = true);
      cube([esc_slot_l + 2 * snap_t, esc_slot_w + 2 * snap_t, esc_slot_h + 0.2], center = true);
    }
}

module chassis_block() {
  difference() {
    // main block
    cube([block_mm, width_mm, wall_mm], center = true);
    // weight-reduction slots
    for (sx = [-1, 1], sy = [-1, 1])
      translate([sx * block_mm * 0.28, sy * width_mm * 0.28, 0])
        cylinder(h = wall_mm + 0.4, d = 22, center = true);
  }
  // four motor towers on the corners
  for (sx = [-1, 1], sy = [-1, 1])
    translate([sx * (block_mm / 2 - motor_socket_d / 2), sy * (width_mm / 2 - motor_socket_d / 2), wall_mm / 2])
      motor_tower();
  // ESP32 motherboard seat (centered)
  translate([0, 0, wall_mm / 2])
    motherboard_seat();
}

// ----- render -----
chassis_block();
