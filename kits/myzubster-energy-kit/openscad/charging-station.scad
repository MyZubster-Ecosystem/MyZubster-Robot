// Parametric charging station for the MyZubster modular robot.
// Provides a dock pad with spring-loaded charging contacts for the
// auto-recharge system described in issue #85.
// Print in PETG, 50% infill. Contacts are pogo pins (P75-B2 or similar).

// Parameters (mm)
station_l = 100;
station_w = 80;
station_h = 40;
contact_dia = 4;
contact_count = 4;
contact_spacing = 14;
guide_dia = 55;
guide_depth = 15;
bolt_dia = 3.4;
wall = 4;
$fn = 48;

module charging_station() {
  difference() {
    // main body
    cube([station_l, station_w, station_h], center = true);

    // robot guide funnel (cone) lets the robot self-align
    translate([0, 0, station_h / 2 - guide_depth / 2 + 1])
      cylinder(h = guide_depth + 2, d1 = guide_dia + 16, d2 = guide_dia, center = true);

    // charging contact holes
    for (i = [0 : contact_count - 1])
      translate([(i - (contact_count - 1) / 2) * contact_spacing, 0, station_h / 2 - 4])
        cylinder(h = 10, d = contact_dia, $fn = 20, center = true);

    // cable passthrough
    translate([0, station_w / 2 - wall, -station_h / 2 + 8])
      cube([20, wall * 2, 10], center = true);

    // corner mount bolts
    for (sx = [-1, 1], sy = [-1, 1])
      translate([sx * (station_l / 2 - 8), sy * (station_w / 2 - 8), 0])
        cylinder(h = station_h + 2, d = bolt_dia, $fn = 20, center = true);
  }
  // contact pad (raised surface where pogo pins touch)
  translate([0, 0, station_h / 2 + 1])
    difference() {
      cube([contact_count * contact_spacing + 10, 16, 3], center = true);
      for (i = [0 : contact_count - 1])
        translate([(i - (contact_count - 1) / 2) * contact_spacing, 0, 0])
          cylinder(h = 4, d = contact_dia + 2, $fn = 20, center = true);
    }
}

charging_station();
