'use strict';
// itdata.js -- frozen Italy regulatory + event + partner + beta-tester fixtures for
// issue MyZubster-Ecosystem/MyZubster-Robot #24 ("[Italy] MyZubster adoption in Italy").
// Pure research snapshot; operators should refresh live data at runtime. No wallets/keys.

// Italian / EU regulators touching home-base crypto + agri-tech adoption.
const REGULATORS = Object.freeze({
  BDI: Object.freeze({ name: 'Banca d\'Italia', sector: 'AML/VASP', regClarity: 3, notes: 'Supervises VASP onboarding/AML; crypto-custody prudential guidance, joint with Consob.' }),
  CONSOB: Object.freeze({ name: 'Consob', sector: 'securities/MiCA', regClarity: 3, notes: 'MiCA token issuance & trading venue scope; prospectus/tests for RWA tokenization.' }),
  GARANTEPRIVACY: Object.freeze({ name: 'Garante per la protezione dei dati personali', sector: 'GDPR', regClarity: 4, notes: 'On-farm sensor/beta-tester data minimization + consent; GDPR Art.6 lawful basis.' }),
  MIPAAF: Object.freeze({ name: 'MIPAAF (Ministero delle politiche agricole)', sector: 'agri-tech', regClarity: 4, notes: 'Agricultural robotics field-trial rules; PSR/RDP co-funding eligibility.' }),
});

// Italian agri-tech + blockchain events (annual cadence; the named local meetups).
const EVENTS = Object.freeze([
  Object.freeze({ id: 'fieragricola', name: 'Fieragricola', city: 'Verona', month: 2, priority: 5, type: 'trade-fair' }),
  Object.freeze({ id: 'eima', name: 'EIMA International', city: 'Bologna', month: 11, priority: 5, type: 'trade-fair' }),
  Object.freeze({ id: 'agrilevante', name: 'Agrilevante', city: 'Bari', month: 10, priority: 4, type: 'trade-fair' }),
  Object.freeze({ id: 'makerfairerome', name: 'Maker Faire Rome', city: 'Roma', month: 10, priority: 4, type: 'festival' }),
  Object.freeze({ id: 'milanblockchain', name: 'Milan Blockchain Week', city: 'Milano', month: 6, priority: 3, type: 'conference' }),
]);

// Italian agri-robotics market sizing + entry strategy (Castrocaro pilot -> agri-belt).
const MARKET = Object.freeze({
  agriRoboticsValue: '~1.2B EUR (Italy agri-tech, 2026 est)',
  topRegions: Object.freeze(['Emilia-Romagna', 'Lombardia', 'Veneto', 'Toscana']),
  entryStrategy: 'Castrocaro (Emilia-Romagna) pilot -> Emilia-Romagna/Veneto agri-belt expansion',
});

// Italy partners (Coldiretti first -- the named agri association).
const PARTNERS = Object.freeze([
  Object.freeze({ id: 'coldiretti', name: 'Coldiretti', sector: 'agri-association', stage: 'identified', touchpoint: 'Joint Castrocaro beta + farmer outreach pipeline' }),
  Object.freeze({ id: 'eima', name: 'EIMA International', sector: 'trade-fair', stage: 'identified', touchpoint: 'Demo booth + robot showcase' }),
  Object.freeze({ id: 'castrocaro', name: 'Castrocaro beta-site coordinator', sector: 'field-trial', stage: 'identified', touchpoint: '5-beta-tester recruitment pilot' }),
  Object.freeze({ id: 'crpa', name: 'CRPA (Centro Ricerche Produzioni Animali)', sector: 'research', stage: 'identified', touchpoint: 'Agri-robotics field-trial research partner' }),
]);

// 5 beta testers target; Castrocaro pipeline stages (issue outcome: 5 active robots).
const BETA_TESTERS = Object.freeze([
  Object.freeze({ name: 'Beta tester 1 (Castrocaro)', region: 'Emilia-Romagna', stage: 'applied' }),
  Object.freeze({ name: 'Beta tester 2 (Castrocaro)', region: 'Emilia-Romagna', stage: 'applied' }),
  Object.freeze({ name: 'Beta tester 3 (Castrocaro)', region: 'Emilia-Romagna', stage: 'applied' }),
  Object.freeze({ name: 'Beta tester 4 (Verona)', region: 'Veneto', stage: 'applied' }),
  Object.freeze({ name: 'Beta tester 5 (Bologna)', region: 'Emilia-Romagna', stage: 'applied' }),
]);

// Italian (it) localization keys for the adoption UI surface (mirrors en/it pattern).
const IT_LOCALE = Object.freeze({
  it_adoption_title: 'Adozione di MyZubster in Italia',
  it_adoption_goal: 'Stabilire MyZubster come sistema di pagamento per robot agricoli leader in Italia',
  it_adoption_outcome: '5 robot attivi in Italia',
  it_adoption_partner_coldiretti: 'Partnership con Coldiretti',
  it_adoption_beta_castrocaro: 'Programma beta a Castrocaro',
  it_adoption_events: 'Calendario eventi italiani',
  it_adoption_docs: 'Documentazione tradotta in italiano',
});

module.exports = { REGULATORS, EVENTS, MARKET, PARTNERS, BETA_TESTERS, IT_LOCALE };
