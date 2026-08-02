'use strict';
const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');
const Filters = require('../ui/Filters');

describe('Filters', () => {
  test('emits onChange with queryText when the search box is typed', () => {
    let last = null;
    render(React.createElement(Filters, {
      filterState: { queryText: '', robotType: 'all' },
      robotTypes: ['agri', 'eco'],
      onChange: (next) => { last = next; },
    }));
    const input = screen.getByTestId('filters-search');
    fireEvent.change(input, { target: { value: 'mother' } });
    expect(last).toEqual({ queryText: 'mother', robotType: 'all' });
  });
  test('emits onChange with robotType when the dropdown changes', () => {
    let last = null;
    render(React.createElement(Filters, {
      filterState: { queryText: '', robotType: 'all' },
      robotTypes: ['agri', 'eco'],
      onChange: (next) => { last = next; },
    }));
    const select = screen.getByTestId('filters-robotType');
    fireEvent.change(select, { target: { value: 'eco' } });
    expect(last).toEqual({ queryText: '', robotType: 'eco' });
  });
  test('renders the available robotType options including "all"', () => {
    render(React.createElement(Filters, { filterState: { queryText: '', robotType: 'all' }, robotTypes: ['agri', 'eco'], onChange: () => {} }));
    const select = screen.getByTestId('filters-robotType');
    const values = Array.from(select.children).map(o => o.value);
    expect(values).toEqual(['all', 'agri', 'eco']);
  });
});
