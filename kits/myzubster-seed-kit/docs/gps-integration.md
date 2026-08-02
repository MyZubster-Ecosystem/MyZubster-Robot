# GPS integration

## Overview

The seed-planting robot uses a Neo-6M (or compatible) GPS module for field position detection. The ESP32 reads NMEA sentences from the GPS UART, parses them with `parseNMEA()`, and maps the fix to a grid position with `gpsToGrid()`.

## NMEA parsing

The `parseNMEA()` function handles two sentence types:

- **$GPGGA** (or $GNGNA): provides latitude, longitude, GPS fix quality, and satellite count. Fix quality 1 = GPS fix, 2 = DGPS fix. Lines with fix=0 (no fix) are rejected.

- **$GPRMC** (or $GNRMC): provides position + status. Status 'A' = active (data valid), 'V' = void.

The parser converts NMEA coordinate format (degrees + minutes) to decimal degrees automatically.

## GPS-to-grid mapping

`gpsToGrid(lat, lon, origin, opt)` uses the equirectangular approximation:

```
dLat = (lat - origin.lat) * PI/180 * earthRadiusM
dLon = (lon - origin.lon) * PI/180 * earthRadiusM * cos(origin.lat * PI/180)
row = round(dLat / gridSpacingM)
col = round(dLon / gridSpacingM)
```

This is accurate to within centimeters for areas under 10 km, which covers any practical field or garden.

## Field setup

1. Stand at the corner of your planting area and record the GPS fix. This becomes the field origin.
2. The robot will plant in a grid starting from this origin, with rows running north and columns running east (by default).
3. Grid spacing is 0.5 m by default (one plant every 50 cm). Adjust `gridSpacingM` for your crop requirements.

## GPS-less fallback

If GPS is unavailable, the robot can accept row/col coordinates directly from a deployment script. The planting mission state machine works identically in both modes --- GPS simply feeds positions into `plantingMission()`.

## No network or cloud dependency

All GPS processing is local on the ESP32. There is no cloud API, no telemetry upload, and no network dependency. The robot never broadcasts its position anywhere.
