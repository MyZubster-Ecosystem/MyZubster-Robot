'use strict';
// React component that renders the mother -> children -> grandchildren cascade.
// Consumes the { rootIds, nodes } shape emitted by api/genealogy.js::getGenealogyTree
// (which mirrors the #79 dna.js::genealogyTree output), so the kit is composable with
// the Robot DNA kit. No network, no signing.
const React = require('react');
const RobotNode = require('./RobotNode');

// Render a depth-first walk of the tree starting at `rootId`. Children are inserted
// inside a nested <ul class="genealogy-tree__children"> so the cascade is the natural
// DOM hierarchy. Each level is indented via CSS so the grandmother is "in cima".
function renderSubtree(rootId, nodes, byId, depth, visibleIds, onSelectProfile) {
  if (!visibleIds.has(rootId)) return null;
  const childIds = nodes[rootId] || [];
  const r = byId.get(rootId);
  const childrenList = childIds.length > 0
    ? React.createElement(
        'ul',
        { className: 'genealogy-tree__children', 'data-depth': depth + 1, key: 'cl' },
        childIds
          .map(cid => renderSubtree(cid, nodes, byId, depth + 1, visibleIds, onSelectProfile))
      )
    : null;
  return React.createElement(
    'li',
    {
      className: 'genealogy-tree__node depth-' + depth,
      'data-testid': 'tree-row-' + rootId,
      'data-depth': depth,
      key: rootId,
    },
    [
      React.createElement(RobotNode, {
        robot: r,
        onSelectProfile: onSelectProfile,
        key: 'node',
      }),
      childrenList,
    ]
  );
}

function GenealogyTree(props) {
  const tree = props.tree || { rootIds: [], nodes: {} };
  const byId = props.byId || new Map();
  const visibleIds = props.visibleIds || null; // null = show all
  const set = visibleIds || new Set([...tree.rootIds, ...Object.keys(tree.nodes)]);
  const onSelectProfile = props.onSelectProfile;
  const roots = tree.rootIds || [];

  return React.createElement(
    'section',
    { className: 'genealogy-tree', 'data-testid': 'genealogy-tree' },
    React.createElement(
      'h2',
      { className: 'genealogy-tree__title' },
      'Robot genealogy tree'
    ),
    roots.length === 0
      ? React.createElement('p', { className: 'genealogy-tree__empty' }, 'No robots')
      : React.createElement(
          'ul',
          { className: 'genealogy-tree__roots', 'data-depth': 0 },
          roots.map(rid => renderSubtree(rid, tree.nodes, byId, 0, set, onSelectProfile))
        )
  );
}

module.exports = GenealogyTree;
