# Operation Sequence (Irrigation + Cutting)

Bounty #76 task: "Programmare logica di automazione" + "Testare su un giardino reale" (deterministic tests stand in for field testing).

## Grass cutting schedule

The mower runs only inside the allowed time window (default 08:00-20:00) and skips when soil moisture exceeds the safe threshold (default > 45%). The scheduler returns one of:

- `cut` -- within window, soil dry enough to mow.
- `skip_wet` -- within window but soil too wet (rain-guard to avoid slip + grass tear).
- `off_window` -- outside the allowed hours.

## Mowing path (boustrophedon)

The `boustrophedonPath` planner generates back-and-forth sweep rows spaced by the cutting swath width (default 0.22 m). Each row alternates direction; the final row is clamped to the field height so coverage never overstates the real mown area. See `coverageArea` for the area assertion.

## Irrigation schedule

Watering windows (default 06:00-07:00 and 18:00-19:00) open the solenoid valve. The scheduler adds two overrides:

- `saturated` -- soil moisture above the max threshold (default > 70%): skip watering.
- `dry_override` -- no scheduled window but soil is below the min threshold (default < 25%): water for a short override duration.

## Garden mission order

`gardenMission` runs the four phases in order: (1) mow the boustrophedon path, (2) irrigate the scheduled windows, (3) detect weeds at probe points, (4) map sampled robot positions to an occupancy grid. The mission is fully deterministic for a given plan.
