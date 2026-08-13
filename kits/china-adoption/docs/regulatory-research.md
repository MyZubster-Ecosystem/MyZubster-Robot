# China Regulatory Research (issue #34)

Per-regulator crypto / cross-border-FX / agri-tech landscape for the China market. Static research snapshot; operators must verify with live sources and legal counsel before any activity on Chinese territory. The 2021 PBoC crypto trading ban is the dominant constraint; the compliant rail is the e-CNY CBDC.

## People's Bank of China (PBoC)
- **Framework**: Central bank + AML prudential supervisor; on 24 Sep 2021 the PBoC + 9 agencies issued the "Notice on Further Preventing and Disposing of the Risks of Virtual Currency Trading Speculation", declaring virtual-currency-related business activities **illegal financial activity** and banning overseas exchanges from serving mainland residents via the internet
- **Monero**: Trading/exchange of Monero (and all crypto) by financial institutions + non-bank payment institutions is prohibited; residents are not permitted to access foreign crypto exchanges. No lawful onshore Monero rail exists
- **RWA / CBDC**: The **e-CNY** (digital RMB) CBDC is the State-sanctioned digital currency; cross-border settlement pilots (mBridge / Multiple CBDC Bridge) are the compliant rail for cross-border RMB. Any settlement touching mainland users must run on compliant (e-CNY / RMB) rails, not a private crypto
- **Readiness**: 2/5 (highly restrictive; documentation track only)
- **Actions**: Do NOT deploy wallets/exchanges on Chinese territory; route any cross-border settlement through e-CNY pilot banks; document the 2021 ban as a no-go for onshore crypto custody by the operator team

## Cyberspace Administration of China (CAC)
- **Framework**: Data-security + cybersecurity + blockchain information-services regulator; the Data Security Law / Cybersecurity Law / Personal Information Protection Law (DSL / CSL / PIL) apply; the 2019 "Regulations on the Management of Blockchain Information Services" require CAC filing for any blockchain service offered to the public
- **Monero**: An on-chain privacy coin offered as an information service would trigger CAC blockchain filing + security review; privacy properties raise extra scrutiny under "Critical Information Infrastructure" rules
- **RWA / agri-IoT**: Agri-robot telemetry + sensor streams are network/PIPL in-scope if offered as a service; data localization (store in China) required for CII operators
- **Readiness**: 3/5 (framework exists and is increasingly clear but operationally heavy)
- **Actions**: If a blockchain service were ever offered, file with CAC; design data localization + PIPL-compliant consent for robot telemetry; this kit stays in the documentation track so no CAC filing is triggered

## State Administration of Foreign Exchange (SAFE)
- **Framework**: Foreign-exchange controls; current-account and capital-account rules; the 2021 notice reinforced that crypto-related cross-border settlement is not permitted; the e-CNY cross-border pilot is the sanctioned channel
- **Monero**: Offshore Monero settlement into mainland users is a prohibited cross-border FX channel; repatriation of value from crypto to RMB is blocked
- **RWA**: Tokenized cross-border invoicing must follow current-account goods-trade rules; SAFE registration for FX settlement
- **Readiness**: 3/5 (clear ban-side; compliant-rail side is e-CNY pilot)
- **Actions**: Any inbound value transfer uses e-CNY pilot / bank-channel RMB settlement; no crypto cross-border push to mainland entities

## Ministry of Agriculture and Rural Affairs (MARA)
- **Framework**: Agricultural ministry; field-trial authorization for agri-robotics; smart-farm demonstration programs; agri-machinery safety registration
- **Monero**: Indirect only (peer-to-farmer service payments); no direct crypto remit
- **RWA / agri-tech**: The main lever for this kit; MARA runs national smart-agriculture demonstration zones and field-trial protocols where autonomous field units would be evaluated
- **Readiness**: 4/5 (established field-trial framework)
- **Actions**: File the field-trial protocol for the Shandong pilot site; document crop-safety + operator training for the 2-robot beta

## Ministry of Industry and Information Technology (MIIT)
- **Framework**: Industrial robotics + industrial-IoT certification; radio-equipment registration (CCA-equivalent radio approval); UAV (agri-drone) registration runs through CAAC under MIIT coordination
- **Monero**: Not in scope
- **RWA / agri-tech**: Robot/sensor certification + radio approval for autonomous units and drones; the dominant hardware-clearance gate for deployed robots
- **Readiness**: 4/5 (clear certification path)
- **Actions**: Obtain MIIT certification + radio approval for the robot units; register any UAV with CAAC before the Shandong field trial

## Overall regulatory readiness

Aggregate score (mean of 5 regulators, `overallRegScore()`): (PBoC 40 + CAC 60 + SAFE 60 + MARA 80 + MIIT 80) / 5 = **64 / 100** -> crosses the 60-point entry gate. China's restrictive digital-currency regime is real (PBoC 2/5), but the agri-tech side (MARA/MIIT 4/5) is workable and pulls the aggregate over the line. The constraint is severe: any onshore crypto custody/exchange is a no-go; the only compliant path is a documentation-track + agri-field-trial + e-CNY/bank-channel approach. This kit stays entirely in research/planning and does not propose wallet deployment on Chinese territory.
