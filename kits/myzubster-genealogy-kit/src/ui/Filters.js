'use strict';
// React component implementing "Aggiungere filtri e ricerche": live text search
// (id + robotType + skill tags) plus a robotType dropdown filter. All filtering
// callbacks are handled in the Dashboard state machine; this component only emits
// user intent. No network.
const React = require('react');

function Filters(props) {
  const state = props.filterState || { queryText: '', robotType: 'all' };
  const robotTypes = props.robotTypes || [];
  const onChange = props.onChange || function () {};

  return React.createElement(
    'section',
    { className: 'filters', 'data-testid': 'filters' },
    [
      React.createElement('h2', { className: 'filters__title', key: 't' }, 'Filters'),
      React.createElement(
        'label',
        { className: 'filters__field', key: 'q', htmlFor: 'filters-search' },
        [
          'Search ',
          React.createElement('input', {
            id: 'filters-search',
            key: 'input',
            type: 'search',
            value: state.queryText || '',
            placeholder: 'id, type, or skill',
            onChange: function (e) { onChange({ queryText: e.target.value, robotType: state.robotType }); },
            'data-testid': 'filters-search',
          }),
        ]
      ),
      React.createElement(
        'label',
        { className: 'filters__field', key: 'f', htmlFor: 'filters-robotType' },
        [
          'Robot type ',
          React.createElement(
            'select',
            {
              id: 'filters-robotType',
              key: 'select',
              value: state.robotType || 'all',
              onChange: function (e) { onChange({ queryText: state.queryText, robotType: e.target.value }); },
              'data-testid': 'filters-robotType',
            },
            [
              React.createElement('option', { key: 'all', value: 'all' }, 'all'),
              ...robotTypes.map(rt => React.createElement('option', { key: rt, value: rt }, rt)),
            ]
          ),
        ]
      ),
    ]
  );
}

module.exports = Filters;
