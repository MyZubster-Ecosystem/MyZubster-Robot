// Parametric assembly station jig for the MyZubster assembly line.
// Each station holds a child robot in a fixed cradle while the arm works.
// Issue #80 task: Progettare stazioni di assemblaggio.
// Print in PETG or ABS, 80% infill.

// Parameters (mm)
station_plate_l = 160;     // station base plate length
station_plate_w = 100;    // station base plate width
station_plate_h = 5;     // base plate thickness
cradle_dia = 60;          // cradle bore diameter (holds child chassis)
cradle_depth = 15;       // cradle bore depth
cradle_wall = 4;         // cradle wall thickness
slot_w = 6;              // cable/tool slot width
bolt_dia = 3.4;          // M3 mounting bolts
conveyor_nub_dia = 8;    // conveyor alignment nub
$fn = 64;

module assembly_station() {
  difference() {
    cube([station_plate_l, station_plate_w, station_plate_h], center = true);
    // cradle bore in center
    cylinder(h = cradle_depth, d = cradle_dia, center = true);
    // tool slot from front to cradle
    translate([0, station_plate_w / 2 - 5, 0])
      cube([slot_w, station_plate_w, station_plate_h + 2], center = true);
    // 4 corner mounting holes
    for (sx = [-1, 1], sy = [-1, 1])
      translate([sx * (station_plate_l / 2 - 8), sy * (station_plate_w / 2 - 8), 0])
        cylinder(h = station_plate_h + 2, d = bolt_dia, $fn = 20, center = true);
  }
  // cradle ring (raised lip around bore)
  translate([0, 0, station_plate_h / 2 - cradle_depth / 2])
    difference() {
      cylinder(h = cradle_depth, d = cradle_dia + 2 * cradle_wall);
      cylinder(h = cradle_depth, d = cradle_dia);
    }
  // conveyor alignment nubs at entry/exit
  for (sx = [-1, 1])
    translate([sx * (station_plate_l / 2 - 3), 0, 0])
      cylinder(h = station_plate_h + 4, d = conveyor_nub_dia, $fn = 24, center = true);
}

assembly_station();
