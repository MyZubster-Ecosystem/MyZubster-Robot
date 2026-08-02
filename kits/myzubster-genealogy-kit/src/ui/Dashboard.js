'use strict';
// Top-level React component that ties together Filters + GenealogyTree + Metrics.
// State: filterState { queryText, robotType }, selectedRobotId (the profile link
// handler). Composition + filtered rendering - no global store, no network.
const React = require('react');
const Filters = require('./Filters');
const GenealogyTree = require('./GenealogyTree');
const Metrics = require('./Metrics');
const api = require('../api/genealogy');

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filterState: { queryText: '', robotType: 'all' },
      selectedRobotId: null,
    };
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleSelectProfile = this.handleSelectProfile.bind(this);
  }

  handleFilterChange(next) {
    this.setState({ filterState: next });
  }

  handleSelectProfile(id) {
    this.setState({ selectedRobotId: id });
  }

  render() {
    const records = this.props.records || [];
    const byId = new Map(records.map(r => [r.id, r]));
    const tree = api.getGenealogyTree(records);
    const metrics = api.getMetrics(records);
    const robotTypes = Array.from(new Set(records.map(r => r.robotType))).sort();
    const visible = api.searchAndFilter(records, this.state.filterState);
    const visibleIds = new Set(visible.map(r => r.id));
    // Ancestor-inclusive filtering: for every visible (matching) node, also add
    // its ancestors so the genealogy path to each match stays rendered. The tree
    // renders hierarchically from roots; without ancestors, a matching node
    // nested under a non-matching parent would be hidden entirely.
    for (const r of visible) {
      let cursor = (r.genealogy && r.genealogy.parentRef) || null;
      let guard = 0;
      while (cursor && byId.has(cursor) && guard < 1000) {
        if (visibleIds.has(cursor)) break;
        visibleIds.add(cursor);
        cursor = (byId.get(cursor).genealogy && byId.get(cursor).genealogy.parentRef) || null;
        guard += 1;
      }
    }
    const selected = this.state.selectedRobotId ? byId.get(this.state.selectedRobotId) : null;

    return React.createElement(
      'main',
      { className: 'dashboard', 'data-testid': 'dashboard' },
      [
        React.createElement('h1', { className: 'dashboard__title', key: 't' }, 'MyZubster robot genealogy dashboard'),
        React.createElement(Filters, {
          key: 'f',
          filterState: this.state.filterState,
          robotTypes: robotTypes,
          onChange: this.handleFilterChange,
        }),
        React.createElement(Metrics, { key: 'm', metrics: metrics }),
        React.createElement(GenealogyTree, {
          key: 'g',
          tree: tree,
          byId: byId,
          visibleIds: visibleIds,
          onSelectProfile: this.handleSelectProfile,
        }),
        selected
          ? React.createElement(
              'section',
              { className: 'dashboard__selected', 'data-testid': 'dashboard-selected', key: 's' },
              [
                React.createElement('h2', { key: 'sh' }, 'Selected profile'),
                React.createElement('p', { key: 'sp' }, selected.id + ' (' + selected.robotType + ')'),
              ]
            )
          : null,
      ]
    );
  }
}

module.exports = Dashboard;
