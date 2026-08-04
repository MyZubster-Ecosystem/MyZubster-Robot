// Parametric electronics tray for the modular lawnmower.
// Holds an ESP32 dev board, a motor driver breakout, and a 3S LiPo
// so all the wiring of issue #70 lives inside one snapped-on enclosure.
// Issue #70 task: Schemi elettrici e wiring.
// Print in PETG or ASA, 100% infill; only the tray is printed (the electronics are COTS).

// Parameters (mm)
tray_length = 90;          // tray internal length
tray_width = 60;           // tray internal width
tray_wall = 3;              // tray wall thickness
tray_height = 35;          // tray wall height
esp_slot_l = 51;            // ESP32 dev board footprint length
esp_slot_w = 28;            // ESP32 dev board footprint width
driver_slot_l = 44;         // motor driver breakout length
driver_slot_w = 30;         // motor driver breakout width
lipo_slot_l = 70;            // 3S 2200mAh LiPo length
lipo_slot_w = 35;            // 3S 2200mAh LiPo width
slot_depth = 8;              // hold-down slot depth
cable_exit_w = 12;          // cable exit slit width
cable_exit_h = 6;            // cable exit slit height
lid_tether_dia = 3;        // M3 bolt holes for the snap-on lid
$fn = 96;

module pocket(l, w) {
  translate([tray_wall, tray_wall, tray_height - slot_depth])
    cube([l, w, slot_depth + 1]);
}

module electronics_tray() {
  difference() {
    // outer tray shell
    cube([tray_length + 2 * tray_wall, tray_width + 2 * tray_wall, tray_height], center = false);
    // ESP32 slot pocket
    translate([tray_wall, tray_wall, 0]) pocket(esp_slot_l, esp_slot_w);
    // motor driver slot pocket
    translate([tray_wall + esp_slot_l + 6, tray_wall, 0]) pocket(driver_slot_l, driver_slot_w);
    // LiPo slot pocket (deeper so the pack sits flat)
    translate([tray_wall, tray_wall + esp_slot_w + 6, 0])
      translate([tray_wall, tray_wall, tray_height - slot_depth - 4])
        cube([lipo_slot_l, lipo_slot_w, slot_depth + 5]);
    // cable exit slits on the two short ends
    translate([0, (tray_width + 2 * tray_wall) / 2 - cable_exit_w / 2, 8])
      cube([2 * tray_wall, cable_exit_w, cable_exit_h]);
    translate([tray_length, (tray_width + 2 * tray_wall) / 2 - cable_exit_w / 2, 8])
      cube([2 * tray_wall, cable_exit_w, cable_exit_h]);
    // four M3 tether holes for the snap-on lid
    for (x = [tray_wall / 2, tray_length + 1.5 * tray_wall]) {
      for (y = [tray_wall / 2, tray_width + 1.5 * tray_wall]) {
        translate([x, y, tray_height - 6]) cylinder(h = 8, d = lid_tether_dia, $fn = 24);
      }
    }
  }
}

electronics_tray();
// Mount the tray above the rear cross beam using the four M3 tether holes.
// Route the motor + sensor cables out the short-end slits to keep them away from the blade.
