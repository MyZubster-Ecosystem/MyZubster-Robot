// Parametric expandable modular chassis for the MyZubster mother robot.
// Houses the ESP32 controller, motor drivers, and provides expansion rails
// for the assembly arm and component magazine.
// Issue #78 task: Disegnare il telaio del robot madre (STL).
// Print in PETG or ABS, 80% infill for rigidity + heat resistance.

// Parameters (mm)
chassis_base_l = 200;       // base plate length
chassis_base_w = 150;      // base plate width
chassis_base_h = 4;       // base plate thickness
rail_height = 30;         // expansion rail height
rail_slot_w = 6;          // T-slot width for modular attachments
esp32_mount_l = 65;       // ESP32 module footprint length
esp32_mount_w = 32;      // ESP32 module footprint width
esp32_mount_h = 12;      // ESP32 standoff height
motor_mount_d = 42;      // N20 gearmotor mount spacing
bolt_dia = 3.4;           // M3 fasteners
side_count = 2;           // expansion sides

$fn = 64;

module mother_chassis() {
  difference() {
    // base plate
    cube([chassis_base_l, chassis_base_w, chassis_base_h], center = true);
    // ESP32 mounting area
    translate([-chassis_base_l / 4, 0, 0])
      for (sx = [-1, 1], sy = [-1, 1])
        translate([sx * esp32_mount_l / 2, sy * esp32_mount_w / 2, 0])
          cylinder(h = chassis_base_h + 2, d = bolt_dia, $fn = 20, center = true);
    // motor mount holes (2 motors at rear)
    translate([chassis_base_l / 3, 0, 0])
      for (sy = [-1, 1])
        translate([0, sy * motor_mount_d / 2, 0])
          cylinder(h = chassis_base_h + 2, d = bolt_dia, $fn = 20, center = true);
  }
  // expansion rails (both sides)
  for (sy = [-1, 1])
    translate([0, sy * (chassis_base_w / 2 + rail_height / 2 - 1), 0]) {
      difference() {
        cube([chassis_base_l, rail_height, chassis_base_h], center = true);
        // T-slots every 20mm
        for (x = [-chassis_base_l / 2 + 10 : 20 : chassis_base_l / 2 - 10])
          translate([x, 0, 0])
            cube([rail_slot_w, rail_height + 2, chassis_base_h + 2], center = true);
      }
    }
  // ESP32 standoffs
  translate([-chassis_base_l / 4, 0, chassis_base_h / 2])
    for (sx = [-1, 1], sy = [-1, 1])
      translate([sx * esp32_mount_l / 2, sy * esp32_mount_w / 2, esp32_mount_h / 2])
        cylinder(h = esp32_mount_h, d = bolt_dia + 2, center = true);
}

mother_chassis();
// Orient base-down; attach arm on left rail, magazine on right rail.
