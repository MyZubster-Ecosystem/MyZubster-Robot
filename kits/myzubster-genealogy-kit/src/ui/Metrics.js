'use strict';
// React component that renders the family-level metrics panel:
// count robots, total jobs completed, total fee generated, active count.
// All metrics are computed by api/genealogy.js::getMetrics from the genealogy
// records - no wallet / chain access.
const React = require('react');

function Metrics(props) {
  const m = props.metrics || { totalRobots: 0, totalJobs: 0, totalFee: 0, activeCount: 0 };
  const totalRobots = Number.isFinite(m.totalRobots) ? m.totalRobots : 0;
  const totalJobs = Number.isFinite(m.totalJobs) ? m.totalJobs : 0;
  const totalFee = Number.isFinite(m.totalFee) ? Number(m.totalFee) : 0;
  const activeCount = Number.isFinite(m.activeCount) ? m.activeCount : 0;
  return React.createElement(
    'aside',
    { className: 'metrics-panel', 'data-testid': 'metrics-panel' },
    [
      React.createElement('h2', { className: 'metrics-panel__title', key: 't' }, 'Family metrics'),
      React.createElement('dl', { className: 'metrics-panel__list', key: 'l' }, [
        React.createElement('dt', { key: 'dt-r' }, 'robots'),
        React.createElement('dd', { 'data-testid': 'metric-total-robots', key: 'dd-r' }, String(totalRobots)),
        React.createElement('dt', { key: 'dt-j' }, 'jobs'),
        React.createElement('dd', { 'data-testid': 'metric-total-jobs', key: 'dd-j' }, String(totalJobs)),
        React.createElement('dt', { key: 'dt-f' }, 'fee'),
        React.createElement('dd', { 'data-testid': 'metric-total-fee', key: 'dd-f' }, totalFee.toFixed(6)),
        React.createElement('dt', { key: 'dt-a' }, 'active'),
        React.createElement('dd', { 'data-testid': 'metric-active-count', key: 'dd-a' }, String(activeCount)),
      ]),
    ]
  );
}

module.exports = Metrics;
