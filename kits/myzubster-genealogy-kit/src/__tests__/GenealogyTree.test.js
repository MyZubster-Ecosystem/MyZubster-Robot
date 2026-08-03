'use strict';
const React = require('react');
const { render, screen } = require('@testing-library/react');
const GenealogyTree = require('../ui/GenealogyTree');
const api = require('../api/genealogy');
const { RECORDS } = require('../data/sample-lineage');

function setup(visibleIds) {
  const tree = api.getGenealogyTree(RECORDS);
  const byId = new Map(RECORDS.map(r => [r.id, r]));
  const set = visibleIds || new Set(RECORDS.map(r => r.id));
  render(React.createElement(GenealogyTree, { tree: tree, byId: byId, visibleIds: set }));
}

describe('GenealogyTree', () => {
  test('renders the title and the root as a tree row', () => {
    setup();
    expect(screen.getByText('Robot genealogy tree')).toBeTruthy();
    expect(screen.getByTestId('tree-row-mother-0')).toBeTruthy();
  });
  test('cascades parent -> child -> grandchild rows', () => {
    setup();
    expect(screen.getByTestId('tree-row-mother-0').getAttribute('data-depth')).toBe('0');
    expect(screen.getByTestId('tree-row-child-1').getAttribute('data-depth')).toBe('1');
    expect(screen.getByTestId('tree-row-grandchild-1').getAttribute('data-depth')).toBe('2');
  });
  test('hides a robot when its id is not in visibleIds (filter behavior)', () => {
    setup(new Set(['mother-0']));
    expect(screen.queryByTestId('tree-row-child-1')).toBeNull();
    expect(screen.queryByTestId('tree-row-grandchild-1')).toBeNull();
    expect(screen.getByTestId('tree-row-mother-0')).toBeTruthy();
  });
  test('shows the empty state when no roots', () => {
    render(React.createElement(GenealogyTree, { tree: { rootIds: [], nodes: {} }, byId: new Map(), visibleIds: new Set() }));
    expect(screen.queryByText('No robots')).toBeTruthy();
  });
});
