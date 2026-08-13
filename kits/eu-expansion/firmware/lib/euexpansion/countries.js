'use strict';
// countries.js -- frozen EU target-country table + event + partner fixtures for issue
// MyZubster-Ecosystem/MyZubster-Robot #17 ("[Global] Expand MyZubster to Europe").
// Pure data only -- no network calls, no live data, no Date.now().

const COUNTRIES = Object.freeze({
  IT: Object.freeze({
    code: 'IT', name: 'Italy', currency: 'EUR', homeBase: true,
    regClarity: 5, moneroCommunity: 5, agriMarket: 4,
    regulator: 'Banca d\'Italia / CONSOB',
    notes: 'Home base; Coldiretti partnership; Castrocaro test site.',
  }),
  DE: Object.freeze({
    code: 'DE', name: 'Germany', currency: 'EUR',
    regClarity: 4, moneroCommunity: 4, agriMarket: 4,
    regulator: 'BaFin',
    notes: 'NEURA Robotics HQ; strong crypto custody law (KryptoZentVG).',
  }),
  UK: Object.freeze({
    code: 'UK', name: 'United Kingdom', currency: 'GBP',
    regClarity: 4, moneroCommunity: 3, agriMarket: 5,
    regulator: 'FCA',
    notes: 'Small Robot Company; post-Brexit crypto registration regime.',
  }),
  FR: Object.freeze({
    code: 'FR', name: 'France', currency: 'EUR',
    regClarity: 4, moneroCommunity: 3, agriMarket: 3,
    regulator: 'AMF',
    notes: 'PACTE crypto framework; Paris Blockchain Week host.',
  }),
  ES: Object.freeze({
    code: 'ES', name: 'Spain', currency: 'EUR',
    regClarity: 3, moneroCommunity: 3, agriMarket: 4,
    regulator: 'CNMV / Banco de Espana',
    notes: 'FIMA agri-tech fair; growing crypto community.',
  }),
  NL: Object.freeze({
    code: 'NL', name: 'Netherlands', currency: 'EUR',
    regClarity: 4, moneroCommunity: 4, agriMarket: 3,
    regulator: 'DNB / AFM',
    notes: 'High crypto adoption; precision-agri greenhouse sector.',
  }),
});

const EVENTS = Object.freeze([
  Object.freeze({ id: 'pbw2026', name: 'Paris Blockchain Week', country: 'FR', month: 4, priority: 5, type: 'conference' }),
  Object.freeze({ id: 'wslisbon2026', name: 'Web Summit Lisbon', country: 'ES', month: 11, priority: 5, type: 'conference' }),
  Object.freeze({ id: 'fima2026', name: 'FIMA (agri-tech)', country: 'ES', month: 2, priority: 4, type: 'trade-fair' }),
  Object.freeze({ id: 'btcmiami_eu', name: 'Bitcoin Policy Summit Europe', country: 'NL', month: 6, priority: 3, type: 'policy' }),
  Object.freeze({ id: 'agritech_de', name: 'Agritechnica', country: 'DE', month: 11, priority: 5, type: 'trade-fair' }),
  Object.freeze({ id: 'ecoforum_it', name: 'Ecosistema Robotics Forum', country: 'IT', month: 9, priority: 3, type: 'meetup' }),
]);

const PARTNERS = Object.freeze([
  Object.freeze({ id: 'src', name: 'Small Robot Company', country: 'UK', sector: 'agri-robotics', stage: 'identified' }),
  Object.freeze({ id: 'neura', name: 'NEURA Robotics', country: 'DE', sector: 'cognitive-robotics', stage: 'identified' }),
  Object.freeze({ id: 'om1eu', name: 'OpenMind OM1 (EU)', country: 'IT', sector: 'x402-payments', stage: 'identified' }),
  Object.freeze({ id: 'coldiretti', name: 'Coldiretti', country: 'IT', sector: 'agri-association', stage: 'identified' }),
  Object.freeze({ id: 'wur', name: 'Wageningen UR', country: 'NL', sector: 'agri-research', stage: 'identified' }),
]);

module.exports = { COUNTRIES, EVENTS, PARTNERS };
