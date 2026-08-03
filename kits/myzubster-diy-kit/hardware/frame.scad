// frame.scad — parametric modular chassis frame for the MyZubster DIY kit (issue #75).
// Render to STL with:
//   openscad -o frame.stl frame.scad
// Keep this source in the kit so the maintainer / community can iterate on
// sensor brackets, motor mounts, and wheel cutouts without re-modeling from scratch.

// --- Parameters (mm) ---
frame_length = 120;      // X axis — chassis length
frame_width = 80;        // Y axis — chassis width
frame_thickness = 4;     // Z axis — chassis plate thickness

motor_well_diameter = 26; // cutout for a TT motor + wheel housing
esp_mount_post_d = 5;    // ESP32 DevKit V1 mount post diameter (M3 screw)
esp_mount_dx = 24;        // ESP32 mount posts spacing along X
esp_mount_dy = 51;        // ESP32 mount posts spacing along Y

battery_slot_w = 22;      // 18650 cell diameter incl. filament tolerance
battery_slot_l = 70;      // 18650 cell length incl. terminals
battery_slot_d = 4;       // depth of battery cradle recess

wheel_clear_d = 30;       // wheel clearance cutout so wheels do not rub chassis
wheel_clear_offset = 12;  // how far the wheel is inset from chassis edge

$fn = 48;

module base_plate() {
    translate([-frame_length/2, -frame_width/2, 0])
        cube([frame_length, frame_width, frame_thickness]);
}

module motor_well_pair() {
    // Two wells, one per drive wheel, mounted at the front edge so wheels can
    // turn freely under the chassis. Spacer blocks fix the TT motor to the plate.
    for (sx = [-1, 1]) {
        translate([sx * (frame_length/2 - wheel_clear_offset),
                   frame_width/2 - 6, frame_thickness])
            cylinder(d = wheel_clear_d, h = frame_thickness * 2, center = true);
    }
    for (sx = [-1, 1]) {
        translate([sx * (frame_length/2 - wheel_clear_offset - 6),
                   frame_width/2 - 6, frame_thickness/2])
            cylinder(d = motor_well_diameter, h = frame_thickness, center = true);
    }
}

module esp_mount_posts() {
    // Four posts around the ESP32 footprint for non-permanent standoff mounting.
    for (sx = [-1, 1], sy = [-1, 1]) {
        translate([sx * esp_mount_dx, sy * esp_mount_dy, 0])
            cylinder(d = esp_mount_post_d, h = frame_thickness + 2);
    }
}

module battery_cradle() {
    // Recessed cradle for a single 18650 cell + TP4056 breakout.
    translate([0, -frame_width/4, frame_thickness - battery_slot_d])
        cube([battery_slot_l, battery_slot_w, battery_slot_d + 0.1], center = true);
}

module chassis_frame() {
    difference() {
        union() {
            base_plate();
            // small front lip to give the chassis some rigidity without
            // over-printing material
            translate([0, frame_width/2 - 2 - frame_thickness/2, frame_thickness/2])
                cube([frame_length - 12, frame_thickness, frame_thickness + 4], center = true);
        }
        motor_well_pair();
        battery_cradle();
        // Tap the ESP32 mount posts for M3 screws (small through-hole).
        for (sx = [-1, 1], sy = [-1, 1]) {
            translate([sx * esp_mount_dx, sy * esp_mount_dy, -1])
                cylinder(d = 1.6, h = frame_thickness + 4);
        }
    }
    // Re-mount sensor brackets: an HC-SR04 holder at the front edge.
    translate([0, frame_width/2 - 6, frame_thickness]) {
        translate([0, 0, 6]) cube([20, 4, 12], center = true);
    }
}

chassis_frame();

// Hint: tolerate version drift — for a different wheel size or a 4-pack motor
// kit (`Mecanum`, `Omni`), edit `wheel_clear_d` and `motor_well_diameter`.
// For an ESP32-S3, edit `esp_mount_dy` (dev kit width differs).
