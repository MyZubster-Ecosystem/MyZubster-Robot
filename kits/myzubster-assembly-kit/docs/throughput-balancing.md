# Throughput & Line Balancing (Documentare il processo)

Bounty #80 task: "Documentare il processo."

## Throughput estimation

The `throughputEstimator` takes the cycle time of each station and finds the bottleneck. Throughput (units/hour) = 3600000 / max(cycleMs). The station with the longest cycle time limits the entire line.

Example: cycle times [4000, 5000, 3000, 6000, 4000, 2000] ms:
- Bottleneck = station 4 (motors) at 6000 ms
- Units/hour = 3600000 / 6000 = 600
- If target = 12 units/hr, the line easily exceeds target

## Line balancing

The `lineBalancer` compares the current throughput to the target. If the line doesn't meet target, it identifies the bottleneck station and suggests the cycle time needed: suggestedCycleMs = 3600000 / targetUnitsPerHour.

## WIP tracking

`wipTracker` tracks how many child robots are at each station. This helps detect conveyor jams (station WIP > 1) and idle stations (WIP = 0 for too long).
