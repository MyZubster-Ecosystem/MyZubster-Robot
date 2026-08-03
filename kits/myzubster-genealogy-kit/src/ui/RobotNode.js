'use strict';
// React component that renders a single robot profile card. The "Link al profilo robot"
// feature element is an in-app navigation anchor (internal handler) - not an external
// link to any wallet, chain, or web URL. No wallet lookup happens.
const React = require('react');

function RobotNode(props) {
  const r = props.robot;
  if (!r || typeof r.id !== 'string') return null;
  const skills = (r.skills || []).map(s => s.skill + ':' + s.level).join(', ');
  const dataTestId = 'robot-node-' + r.id;
  return React.createElement(
    'article',
    {
      className: 'robot-node',
      'data-testid': dataTestId,
      'data-robot-type': r.robotType,
      'data-generation': r.generation,
      'data-status': r.status || 'unknown',
    },
    [
      React.createElement('header', { className: 'robot-node__header', key: 'h' }, [
        React.createElement('h3', { className: 'robot-node__id', key: 'id' }, r.id),
        React.createElement(
          'button',
          {
            className: 'robot-node__profile-link',
            key: 'profile',
            type: 'button',
            onClick: function () { if (typeof props.onSelectProfile === 'function') props.onSelectProfile(r.id); },
            'aria-label': 'Open profile for ' + r.id,
          },
          'profile',
        ),
      ]),
      React.createElement('dl', { className: 'robot-node__meta', key: 'm' }, [
        React.createElement('dt', { key: 'dt-type' }, 'type'),
        React.createElement('dd', { key: 'dd-type' }, r.robotType),
        React.createElement('dt', { key: 'dt-gen' }, 'gen'),
        React.createElement('dd', { key: 'dd-gen' }, String(r.generation)),
        React.createElement('dt', { key: 'dt-status' }, 'status'),
        React.createElement('dd', { key: 'dd-status' }, r.status || 'unknown'),
        React.createElement('dt', { key: 'dt-rep' }, 'reputation'),
        React.createElement('dd', { key: 'dd-rep' }, String(r.reputation || 0)),
        React.createElement('dt', { key: 'dt-jobs' }, 'jobs'),
        React.createElement('dd', { key: 'dd-jobs' }, String(r.jobsCompleted || 0)),
        React.createElement('dt', { key: 'dt-fee' }, 'fee'),
        React.createElement('dd', { key: 'dd-fee' }, String(r.fee || 0)),
      ]),
      React.createElement('p', { className: 'robot-node__skills', key: 's' }, skills || '(no skills)'),
    ]
  );
}

module.exports = RobotNode;
