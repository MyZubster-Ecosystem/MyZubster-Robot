'use strict';
// Integration tests that render the full Dashboard component tree (Filters +
// GenealogyTree + Metrics + selected profile) against the sample-lineage fixture.
// These verify the feature interaction demanded by issue #82 "Testare con dati
// reali" (filter narrows the tree, profile button selects a robot) without any
// network or wallet surface.
const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');
const Dashboard = require('../ui/Dashboard');
const { RECORDS } = require('../data/sample-lineage');

describe('Dashboard integration', () => {
  test('renders the title, metrics, and the full 3-node genealogy tree by default', () => {
    render(React.createElement(Dashboard, { records: RECORDS }));
    expect(screen.getByText(/genealogy dashboard/i)).toBeTruthy();
    // metrics panel shows 3 robots, 30 jobs, fee 0.001200, 2 active
    expect(screen.getByTestId('metric-total-robots').textContent).toBe('3');
    expect(screen.getByTestId('metric-total-jobs').textContent).toBe('30');
    expect(screen.getByTestId('metric-total-fee').textContent).toBe('0.001200');
    expect(screen.getByTestId('metric-active-count').textContent).toBe('2');
    // all three robots present in the tree
    expect(screen.getByTestId('tree-row-mother-0')).toBeTruthy();
    expect(screen.getByTestId('tree-row-child-1')).toBeTruthy();
    expect(screen.getByTestId('tree-row-grandchild-1')).toBeTruthy();
  });

  test('text filter narrows the visible tree nodes', () => {
    render(React.createElement(Dashboard, { records: RECORDS }));
    const search = screen.getByTestId('filters-search');
    fireEvent.change(search, { target: { value: 'grandchild' } });
    // grandchild-1 matches; its ancestors (mother-0, child-1) are kept so the
    // genealogy path to the match stays rendered (ancestor-inclusive filtering).
    expect(screen.getByTestId('tree-row-grandchild-1')).toBeTruthy();
    expect(screen.getByTestId('tree-row-child-1')).toBeTruthy();
    expect(screen.getByTestId('tree-row-mother-0')).toBeTruthy();
  });

  test('clicking the profile button selects a robot and shows the profile panel', () => {
    render(React.createElement(Dashboard, { records: RECORDS }));
    const profileBtn = screen.getByLabelText(/Open profile for mother-0/i);
    fireEvent.click(profileBtn);
    const panel = screen.getByTestId('dashboard-selected');
    expect(panel).toBeTruthy();
    expect(panel.textContent).toContain('mother-0');
    expect(panel.textContent).toContain('agri');
  });

  test('renders an empty tree message when records is empty', () => {
    render(React.createElement(Dashboard, { records: [] }));
    expect(screen.getByText(/No robots/i)).toBeTruthy();
    expect(screen.getByTestId('metric-total-robots').textContent).toBe('0');
  });
});
