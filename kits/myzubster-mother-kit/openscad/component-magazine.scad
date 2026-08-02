// Parametric 6-slot component storage magazine for the MyZubster mother robot.
// Rotating Geneva-style disk that indexes components to the assembly position.
// Issue #78 task: Magazzino componenti (motori, sensori, schede).
// Print in PETG, 80% infill; drive with a 28BYJ-48 stepper (4096 steps/rev).

// Parameters (mm)
mag_disk_od = 100;          // magazine disk outer diameter
mag_disk_h = 14;           // disk thickness
slot_count = 6;            // number of component slots
slot_od = 32;              // slot opening diameter (fits ESP32 module + N20 motor)
slot_depth = 12;          // slot depth into the disk
shaft_dia = 8;             // central shaft diameter (stepper coupling)
rim_t = 4;                 // wall thickness around each slot
base_flange_d = 120;       // mounting flange diameter
base_flange_h = 5;        // flange thickness

$fn = 64;

module component_magazine() {
  // mounting flange
  cylinder(h = base_flange_h, d = base_flange_d);
  // main disk
  translate([0, 0, base_flange_h])
    difference() {
      cylinder(h = mag_disk_h, d = mag_disk_od);
      // central shaft hole
      cylinder(h = mag_disk_h + 2, d = shaft_dia, $fn = 32);
      // component slots around the perimeter
      for (i = [0 : slot_count - 1]) {
        angle = 360 * i / slot_count;
        translate([mag_disk_od / 2 * 0.65 * cos(angle), mag_disk_od / 2 * 0.65 * sin(angle), 0])
          cylinder(h = slot_depth, d = slot_od, $fn = 40);
      }
      // M3 mounting holes in flange
      for (i = [0 : 3])
        rotate([0, 0, 90 * i + 45])
          translate([base_flange_d / 2 - 6, 0, 0])
            cylinder(h = base_flange_h + 2, d = 3.4, $fn = 20, center = true);
    }
}

component_magazine();
// Mount the flange into the right expansion rail; rotate the disk to index slots.
