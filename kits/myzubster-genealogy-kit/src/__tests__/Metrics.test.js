'use strict';
const React = require('react');
const { render, screen } = require('@testing-library/react');
const Metrics = require('../ui/Metrics');

describe('Metrics', () => {
  test('renders the family metrics with robot/job/fee/active counts', () => {
    render(React.createElement(Metrics, { metrics: { totalRobots: 3, totalJobs: 30, totalFee: 0.0012, activeCount: 2 } }));
    expect(screen.getByTestId('metric-total-robots').textContent).toBe('3');
    expect(screen.getByTestId('metric-total-jobs').textContent).toBe('30');
    expect(screen.getByTestId('metric-total-fee').textContent).toBe('0.001200');
    expect(screen.getByTestId('metric-active-count').textContent).toBe('2');
  });
  test('defaults to zeros when metrics missing', () => {
    render(React.createElement(Metrics, {}));
    expect(screen.getByTestId('metric-total-robots').textContent).toBe('0');
    expect(screen.getByTestId('metric-total-fee').textContent).toBe('0.000000');
  });
  test('formats fee to six decimal places', () => {
    render(React.createElement(Metrics, { metrics: { totalRobots: 1, totalFee: 0.00005 } }));
    expect(screen.getByTestId('metric-total-fee').textContent).toBe('0.000050');
  });
});
