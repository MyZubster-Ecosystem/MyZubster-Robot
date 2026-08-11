'use strict';
// euexpansion.js -- pure-JS helpers for the EU expansion planner kit.
// Issue: MyZubster-Ecosystem/MyZubster-Robot #17 ("[Global] Expand MyZubster to Europe").
//
// All functions are pure and deterministic. No network calls, no live data,
// no Date.now(). See docs/safe-harbor-note.md for the S2 boundary.

const { COUNTRIES, EVENTS, PARTNERS } = require('./countries');

// ---------- Country readiness scoring ----------

// Weighted score (0-100) for a target country's MyZubster expansion readiness.
// Weights: regulation clarity 40%, Monero community 20%, agricultural market 40%.
function countryReadinessScore(code, countries) {
  const table = countries || COUNTRIES;
  const c = table[String(code || '').toUpperCase()];
  if (!c) throw new RangeError('unknown country code: ' + code);
  const raw = c.regClarity * 0.4 + c.moneroCommunity * 0.2 + c.agriMarket * 0.4;
  return Math.round((raw / 5) * 100);
}

function rankCountries(countries) {
  const table = countries || COUNTRIES;
  return Object.keys(table)
    .map(code => ({ code, score: countryReadinessScore(code, table), name: table[code].name }))
    .sort((a, b) => b.score - a.score);
}

function thresholdGate(code, countries, threshold) {
  return countryReadinessScore(code, countries) >= (threshold || 60);
}

// ---------- Event timeline ----------

function eventTimeline(events) {
  const list = events || EVENTS;
  return list.slice().sort((a, b) => a.month - b.month || b.priority - a.priority);
}

function eventsByCountry(code, events) {
  const cc = String(code || '').toUpperCase();
  return (events || EVENTS).filter(e => e.country === cc);
}

function eventReach(events) {
  const list = events || EVENTS;
  const countries = new Set(list.map(e => e.country));
  return { eventCount: list.length, countryCount: countries.size, countries: [...countries].sort() };
}

// ---------- 5-phase milestone state machine ----------
// SURVEY -> REGULATE -> LOCALIZE -> LAUNCH -> SCALE
const PHASES = Object.freeze(['SURVEY', 'REGULATE', 'LOCALIZE', 'LAUNCH', 'SCALE']);

function milestoneStateMachine(current) {
  const phase = String(current || '').toUpperCase();
  const idx = PHASES.indexOf(phase);
  if (idx < 0) throw new RangeError('unknown phase: ' + current);
  if (idx === PHASES.length - 1) return { phase, next: null, index: idx, terminal: true };
  return { phase, next: PHASES[idx + 1], index: idx, terminal: false };
}

function milestoneSequence(fromPhase) {
  let cur = String(fromPhase || PHASES[0]).toUpperCase();
  const seq = [];
  for (let i = 0; i < PHASES.length; i++) {
    const r = milestoneStateMachine(cur);
    seq.push(r);
    if (!r.next) break;
    cur = r.next;
  }
  return seq;
}

function phaseProgress(certObtained) {
  const certs = Array.isArray(certObtained) ? certObtained : [];
  const map = {};
  for (let i = 0; i < PHASES.length; i++) map[PHASES[i]] = certs[i] || false;
  return {
    phases: PHASES,
    obtained: certs,
    nextPending: PHASES.find((p, i) => !certs[i]),
    complete: certs.length === PHASES.length && certs.every(Boolean),
  };
}

// ---------- Partner outreach tracker ----------
const PARTNER_STAGES = Object.freeze(['identified', 'contacted', 'engaged', 'signed']);

function partnerOutreachTracker(partners) {
  const list = partners || PARTNERS;
  const byStage = {};
  for (const s of PARTNER_STAGES) byStage[s] = [];
  for (const p of list) {
    const stage = byStage[p.stage] ? p.stage : 'identified';
    byStage[stage].push(p);
  }
  return {
    total: list.length,
    stages: PARTNER_STAGES,
    byStage,
    funnelRate: function (toStage) {
      const ti = PARTNER_STAGES.indexOf(toStage);
      if (ti < 0) return 0;
      let count = 0;
      for (let i = ti; i < PARTNER_STAGES.length; i++) count += byStage[PARTNER_STAGES[i]].length;
      return list.length > 0 ? count / list.length : 0;
    },
  };
}

function advancePartner(partner, toStage) {
  const ti = PARTNER_STAGES.indexOf(toStage);
  if (ti < 0) throw new RangeError('unknown partner stage: ' + toStage);
  const ci = PARTNER_STAGES.indexOf(partner.stage);
  return Object.assign({}, partner, { stage: PARTNER_STAGES[Math.max(ti, ci)] });
}

// ---------- i18n locale helpers ----------

const I18N_KEYS = Object.freeze([
  'expansion.eu.title', 'expansion.eu.subtitle', 'expansion.eu.roadmap',
  'expansion.eu.regulatory', 'expansion.eu.events', 'expansion.eu.partners',
  'expansion.eu.join', 'expansion.eu.beta_test',
  'expansion.country.it', 'expansion.country.de', 'expansion.country.uk',
  'expansion.country.fr', 'expansion.country.es', 'expansion.country.nl',
  'expansion.phase.survey', 'expansion.phase.regulate', 'expansion.phase.localize',
  'expansion.phase.launch', 'expansion.phase.scale',
  'expansion.partner.outreach', 'expansion.partner.signed',
]);

const LOCALES = Object.freeze({
  fr: Object.freeze({
    'expansion.eu.title': 'Etendez MyZubster a l\'Europe',
    'expansion.eu.subtitle': 'Feuille de route d\'expansion Europeenne',
    'expansion.eu.roadmap': 'Feuille de route',
    'expansion.eu.regulatory': 'Paysage reglementaire',
    'expansion.eu.events': 'Calendrier des evenements',
    'expansion.eu.partners': 'Partenaires robotique agricole',
    'expansion.eu.join': 'Rejoignez la communaute',
    'expansion.eu.beta_test': 'Inscription aux tests beta',
    'expansion.country.it': 'Italie (base administrative)',
    'expansion.country.de': 'Allemagne',
    'expansion.country.uk': 'Royaume-Uni',
    'expansion.country.fr': 'France',
    'expansion.country.es': 'Espagne',
    'expansion.country.nl': 'Pays-Bas',
    'expansion.phase.survey': 'Enquete',
    'expansion.phase.regulate': 'Mise en conformite',
    'expansion.phase.localize': 'Localisation',
    'expansion.phase.launch': 'Lancement',
    'expansion.phase.scale': 'Mise a l\'echelle',
    'expansion.partner.outreach': 'Prise de contact',
    'expansion.partner.signed': 'Partenaire signe',
  }),
  de: Object.freeze({
    'expansion.eu.title': 'MyZubster in Europa erweitern',
    'expansion.eu.subtitle': 'Europaeische Erweiterungs-Roadmap',
    'expansion.eu.roadmap': 'Roadmap',
    'expansion.eu.regulatory': 'Regulatorische Landschaft',
    'expansion.eu.events': 'Veranstaltungskalender',
    'expansion.eu.partners': 'Partner fuer Agrarrobotik',
    'expansion.eu.join': 'Der Community beitreten',
    'expansion.eu.beta_test': 'Beta-Test Anmeldung',
    'expansion.country.it': 'Italien (Hauptsitz)',
    'expansion.country.de': 'Deutschland',
    'expansion.country.uk': 'Vereinigtes Koenigreich',
    'expansion.country.fr': 'Frankreich',
    'expansion.country.es': 'Spanien',
    'expansion.country.nl': 'Niederlande',
    'expansion.phase.survey': 'Umfrage',
    'expansion.phase.regulate': 'Regulatorik',
    'expansion.phase.localize': 'Lokalisierung',
    'expansion.phase.launch': 'Start',
    'expansion.phase.scale': 'Skalierung',
    'expansion.partner.outreach': 'Kontaktaufnahme',
    'expansion.partner.signed': 'Unterschriebener Partner',
  }),
  es: Object.freeze({
    'expansion.eu.title': 'Expandir MyZubster a Europa',
    'expansion.eu.subtitle': 'Hoja de ruta de expansion europea',
    'expansion.eu.roadmap': 'Hoja de ruta',
    'expansion.eu.regulatory': 'Panorama regulatorio',
    'expansion.eu.events': 'Calendario de eventos',
    'expansion.eu.partners': 'Socios de robotica agricola',
    'expansion.eu.join': 'Unete a la comunidad',
    'expansion.eu.beta_test': 'Registro para pruebas beta',
    'expansion.country.it': 'Italia (sede principal)',
    'expansion.country.de': 'Alemania',
    'expansion.country.uk': 'Reino Unido',
    'expansion.country.fr': 'Francia',
    'expansion.country.es': 'Espana',
    'expansion.country.nl': 'Paises Bajos',
    'expansion.phase.survey': 'Estudio',
    'expansion.phase.regulate': 'Cumplimiento',
    'expansion.phase.localize': 'Localizacion',
    'expansion.phase.launch': 'Lanzamiento',
    'expansion.phase.scale': 'Escalado',
    'expansion.partner.outreach': 'Contacto',
    'expansion.partner.signed': 'Socio firmado',
  }),
});

function i18nCoverage(locale) {
  const map = LOCALES[locale];
  if (!map) throw new RangeError('unknown locale: ' + locale);
  const missing = I18N_KEYS.filter(k => !map[k]);
  return { locale, totalKeys: I18N_KEYS.length, covered: I18N_KEYS.length - missing.length, missing };
}

function i18nCompare(localeA, localeB) {
  const a = LOCALES[localeA];
  const b = LOCALES[localeB];
  if (!a || !b) throw new RangeError('unknown locale pair: ' + localeA + '/' + localeB);
  const onlyA = I18N_KEYS.filter(k => a[k] && !b[k]);
  const onlyB = I18N_KEYS.filter(k => b[k] && !a[k]);
  return { a: localeA, b: localeB, onlyInA: onlyA, onlyInB: onlyB, parity: onlyA.length === 0 && onlyB.length === 0 };
}

// ---------- End-to-end expansion plan builder ----------

function buildExpansionPlan(countryCode, options) {
  const countries = (options && options.countries) || COUNTRIES;
  const events = (options && options.events) || EVENTS;
  const partners = (options && options.partners) || PARTNERS;
  const cc = String(countryCode || '').toUpperCase();
  const score = countryReadinessScore(cc, countries);
  const countryEvents = eventsByCountry(cc, events);
  const timeline = eventTimeline(events);
  const milestones = milestoneSequence('SURVEY');
  const outreach = partnerOutreachTracker(partners.filter(p => p.country === cc || cc === 'IT'));
  return {
    country: cc,
    name: countries[cc] ? countries[cc].name : cc,
    readinessScore: score,
    gate: score >= 60,
    events: countryEvents,
    fullTimeline: timeline,
    milestones,
    partnerOutreach: outreach,
  };
}

module.exports = {
  COUNTRIES, EVENTS, PARTNERS, PHASES, PARTNER_STAGES, I18N_KEYS, LOCALES,
  countryReadinessScore, rankCountries, thresholdGate,
  eventTimeline, eventsByCountry, eventReach,
  milestoneStateMachine, milestoneSequence, phaseProgress,
  partnerOutreachTracker, advancePartner,
  i18nCoverage, i18nCompare,
  buildExpansionPlan,
};
