// Part magazine for one self-replication run (issue #73).
// Holds a complete kit of interchangeable modular parts ready to feed the
// assembly sequence planner: chassis, motors, wheels, ESP32 board, sensors.
// Parametric honeycomb cells; tune cell diameter + count for your part set.

$fn = 48;

// ----- parameters -----
mag_w_mm   = 180;   // magazine overall width
mag_l_mm   = 260;   // magazine overall length
wall_mm    = 3;     // outer wall thickness
base_mm    = 4;     // base plate thickness
cell_d_mm  = 42;   // cell diameter (fits a motor / controller module)
cell_h_mm  = 20;   // cell wall height
pitch_mm   = 50;   // cell center-to-center spacing
rows       = 4;
cols       = 5;

module cell(d = cell_d_mm, h = cell_h_mm) {
  difference() {
    cylinder(h = h, d = d + 2 * wall_mm, center = false);
    translate([0, 0, -0.1])
      cylinder(h = h + 0.2, d = d, center = false);
  }
}

module magazine() {
  // base plate
  cube([mag_l_mm, mag_w_mm, base_mm], center = true);
  // cell grid (offset so cells sit on the base, centered in the magazine)
  for (r = [0 : rows - 1], c = [0 : cols - 1])
    let (x = (c - (cols - 1) / 2) * pitch_mm,
         y = (r - (rows - 1) / 2) * pitch_mm,
         maxWidthCols = (cols - 1) * pitch_mm,
         maxWoutRows  = (rows - 1) * pitch_mm)
      translate([x, y, base_mm / 2])
        cell();
}

// ----- render -----
magazine();
