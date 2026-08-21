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

Read:

- [Canonical Bounty System](https://github.com/MyZubster-Ecosystem/myzubster/blob/main/BOUNTIES.md)
- [Ecosystem Architecture](https://github.com/MyZubster-Ecosystem/myzubster/blob/main/docs/ECOSYSTEM.md)

See `BOUNTIES.md` for repository-specific scope.

## Related repositories

- [myzubster](https://github.com/MyZubster-Ecosystem/myzubster) — core ecosystem
- [MyZubsterGateway](https://github.com/MyZubster-Ecosystem/MyZubsterGateway) — integration/settlement boundary
- [EVA-IONI](https://github.com/MyZubster-Ecosystem/EVA-IONI) — robotics/software track
- [myzubster-space-station](https://github.com/MyZubster-Ecosystem/myzubster-space-station) — telemetry/vertical-slice track
- [myzubster-docs](https://github.com/MyZubster-Ecosystem/myzubster-docs) — documentation hub

## Contributing

Use an existing issue or open a narrowly scoped proposal. Include reproducible tests/simulation evidence and clearly state whether physical hardware was actually tested.

## License

See the repository `LICENSE` file for authoritative terms.

---

## Official project identity

MyZubster is maintained within the [MyZubster-Ecosystem](https://github.com/MyZubster-Ecosystem) organization. Canonical public administrator/maintainer reference: **[Daniel Ioni (@DanielIoni-creator)](https://github.com/DanielIoni-creator)**.

This link is a stable public project-identity reference. By itself, it is not a cryptographic signature or legal identity certification.
