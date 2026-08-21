# MyZubster Robot

<p align="center">
  <img src="assets/readme/myzubster-robot.png" alt="MyZubster Robot overview" width="100%">
</p>

> 🌍 **Understand MyZubster in your language:** [Global multilingual guide](https://github.com/MyZubster-Ecosystem/myzubster/blob/main/docs/i18n/README.md) — English, Italiano, Español, Français, Deutsch, Português, 中文, 日本語, 한국어, العربية, हिन्दी, Русский, Türkçe, Bahasa Indonesia, Polski, Українська, বাংলা, اردو, فارسی, Kiswahili.
>
> MyZubster connects real-world observations, verifiable evidence, collaborative bounties and platform rewards. **MYZ is currently an internal reward/accounting ledger; external XMR/token/blockchain settlement is separate and independently verified.**

Open-source robotics experimentation track inside the MyZubster ecosystem.

## Status

**Prototype / simulation / hardware-integration research.** Repository code may include x402-style request flows, ESP32/Arduino experiments, robot identity/DNA concepts and payment-adjacent prototypes. A feature described in code or an issue must not be presented as autonomous production settlement unless the relevant hardware, network and verifier evidence exists.

## Scope

Typical work in this repository includes:

- ESP32/Arduino robot clients and examples;
- robot registration/identity experiments;
- telemetry and command interfaces;
- x402-style payment-request experiments;
- robot marketplace/skill concepts;
- simulation and safe hardware integration;
- reproducible robotics documentation.

Self-replication, autonomous purchasing and autonomous settlement should be treated as research/prototype concepts unless a specific implementation and physical validation are documented.

## Physical Time Machine program

MyZubster is developing an **Open-Source Physical Time Machine Demonstrator v1** as a scientifically grounded hardware program connected to the digital MyZubster Time Machine.

The physical project is **not a claim of travel to the past, faster-than-light propagation or alteration of physical history**. It is a reproducible apparatus for measuring temporal phenomena that are physically real and experimentally testable, including clock drift, synchronization offset, signal propagation delay/time-of-flight, timestamped environmental state and robot/device telemetry.

```text
physical clocks / sensors / robot telemetry
                |
                v
     calibrated timestamped measurements
                |
                v
      provenance + uncertainty records
                |
                v
      MyZubster Time Machine snapshot
                |
                v
       historical visual replay
```

Program tracking:

- [Epic #135 — Physical Time Machine Demonstrator v1](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/135)
- [#136 — precision clock and drift measurement](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/136)
- [#137 — propagation delay and time-of-flight demonstrator](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/137)
- [#138 — synchronized physical sensor-state recorder](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/138)
- [#139 — robot/device telemetry bridge and historical replay](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/139)
- [#140 — completion bounty](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/140) — **UNFUNDED externally**; 2,500 MYZ is an internal reward/accounting amount contingent on verification.
- [Core digital Time Machine PR #560](https://github.com/MyZubster-Ecosystem/myzubster/pull/560)

A valid v1 demonstration must preserve raw measurements, timestamp source, calibration procedure, uncertainty/error discussion and provenance. Simulation, derived values and directly recorded physical measurements must remain distinguishable in both datasets and UI.

The reference build is intentionally constrained to ordinary low-voltage maker electronics; dangerous high-voltage, radiation, cryogenic, vacuum or similarly hazardous apparatus is outside the v1 scope.

## Development

Inspect the current repository tree before following older issue instructions; historical issues may reference directories or flows that have changed.

Typical component workflows may include Node.js and Arduino/ESP32 tooling. Run the tests supplied by the component you modify and document any required hardware.

## Safety

Robotics contributions must fail safe. Do not submit bounty work that requires:

- uncontrolled physical actuation;
- bypassing emergency-stop/safety boundaries;
- dangerous tools or hazardous-device construction;
- testing on people/property without authorization;
- secret/private-key storage on devices or in source control.

Simulation is preferred before physical deployment.

## Payments and bounties

Payment-request prototypes and bounty labels are separate from verified external settlement.

- MYZ in the current core platform is an internal reward/accounting ledger.
- XMR/token settlement is not `PAID` until independently verified on the applicable rail.
- A robot/service response must never self-declare an external payment final.
- Historical bounty amounts are not proof of payment.
- The Physical Time Machine completion bounty #140 is currently **UNFUNDED for external settlement**; its MYZ amount is an internal reward record only after successful verification.

Read:

- [Canonical Bounty System](https://github.com/MyZubster-Ecosystem/myzubster/blob/main/BOUNTIES.md)
- [Ecosystem Architecture](https://github.com/MyZubster-Ecosystem/myzubster/blob/main/docs/ECOSYSTEM.md)

See `BOUNTIES.md` for repository-specific scope.

## Related repositories

- [myzubster](https://github.com/MyZubster-Ecosystem/myzubster) — core ecosystem and digital Time Machine
- [MyZubsterGateway](https://github.com/MyZubster-Ecosystem/MyZubsterGateway) — integration/settlement boundary
- [EVA-IONI](https://github.com/MyZubster-Ecosystem/EVA-IONI) — robotics/software track
- [myzubster-space-station](https://github.com/MyZubster-Ecosystem/myzubster-space-station) — telemetry/vertical-slice track
- [myzubster-docs](https://github.com/MyZubster-Ecosystem/myzubster-docs) — documentation hub

## Contributing

Use an existing issue or open a narrowly scoped proposal. Include reproducible tests/simulation evidence and clearly state whether physical hardware was actually tested.

## License

See the repository `LICENSE` file for authoritative terms.
