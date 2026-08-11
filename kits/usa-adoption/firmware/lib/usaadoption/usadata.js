'use strict';
// usadata.js -- frozen US regulatory + event + partner fixtures for issue #29
// MyZubster-Ecosystem/MyZubster-Robot #29 ("[USA] MyZubster adoption in United States").
const REGULATORS = Object.freeze({
  SEC: Object.freeze({ name: 'U.S. Securities and Exchange Commission', sector: 'securities', regClarity: 3, notes: 'Howey test for digital assets; RWA tokenization risk under federal securities law.' }),
  CFTC: Object.freeze({ name: 'Commodity Futures Trading Commission', sector: 'commodities', regClarity: 4, notes: 'Classifies BTC/ETH as commodities; Monero commodity-adjacent.' }),
  IRS: Object.freeze({ name: 'Internal Revenue Service', sector: 'taxation', regClarity: 4, notes: 'Crypto treated as property; capital gains reporting.' }),
  FinCEN: Object.freeze({ name: 'Financial Crimes Enforcement Network', sector: 'AML', regClarity: 4, notes: 'MSB registration for crypto exchanges; Travel Rule.' }),
});
const EVENTS = Object.freeze([
  Object.freeze({ id: 'worldagritech', name: 'World Agri-Tech Innovation Summit', city: 'San Francisco, CA', month: 3, priority: 5, type: 'conference' }),
  Object.freeze({ id: 'btcmiami', name: 'Bitcoin Miami', city: 'Miami, FL', month: 5, priority: 5, type: 'conference' }),
  Object.freeze({ id: 'consensus', name: 'Consensus', city: 'Austin, TX', month: 5, priority: 4, type: 'conference' }),
  Object.freeze({ id: 'agritech_iowa', name: 'Iowa AgTech Summit', city: 'Des Moines, IA', month: 7, priority: 3, type: 'trade-fair' }),
  Object.freeze({ id: 'fintech_ny', name: 'FinTECH Fall', city: 'New York, NY', month: 10, priority: 3, type: 'conference' }),
]);
const MARKET = Object.freeze({
  agriRoboticsValue: '4.1B USD (2026 est)',
  topStates: Object.freeze(['CA', 'TX', 'IA', 'NE', 'KS']),
  entryStrategy: 'Midwest agri-belt (IA/NE/KS) pilot -> coastal expansion',
});
const PARTNERS = Object.freeze([
  Object.freeze({ id: 'om1', name: 'OpenMind OM1', sector: 'x402-payments', stage: 'identified', touchpoint: 'Payment rail co-integration' }),
  Object.freeze({ id: 'jdw', name: 'John Deere Works', sector: 'agri-robotics', stage: 'identified', touchpoint: 'Autonomous tractor fleet interface' }),
  Object.freeze({ id: 'monarch', name: 'Monarch Tractor', sector: 'agri-robotics', stage: 'identified', touchpoint: 'Electric autonomous tractor API' }),
  Object.freeze({ id: 'a3a', name: 'American AgTech Alliance', sector: 'industry-org', stage: 'identified', touchpoint: 'Community-manager recruitment pipeline' }),
]);
module.exports = { REGULATORS, EVENTS, MARKET, PARTNERS };
