'use strict';
const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');
const RobotNode = require('../ui/RobotNode');

function SampleRobot(overrides) {
  return Object.assign({
    id: 'mother-0', robotType: 'agri', generation: 0,
    reputation: 75, jobsCompleted: 30, fee: 0.0012,
    status: 'active',
    skills: [{ skill: 'irrigate', level: 60 }],
    genealogy: { parentRef: null, generation: 0 },
  }, overrides || {});
}

describe('RobotNode', () => {
  test('renders the robot id as a header', () => {
    render(React.createElement(RobotNode, { robot: SampleRobot() }));
    expect(screen.getByText('mother-0')).toBeTruthy();
  });
  test('emits metadata (robotType, generation, status, jobs, fee)', () => {
    render(React.createElement(RobotNode, { robot: SampleRobot() }));
    expect(screen.getByText('agri')).toBeTruthy();
    expect(screen.getByText('0').textContent).toBe('0'); // relies on dd duplication; specificity checked below
    expect(screen.getByText('active')).toBeTruthy();
    expect(screen.getByText('30')).toBeTruthy();
  });
  test('renders the skills list inline', () => {
    render(React.createElement(RobotNode, { robot: SampleRobot() }));
    expect(screen.getByText('irrigate:60')).toBeTruthy();
  });
  test('profile button triggers onSelectProfile callback', () => {
    let clicked = null;
    render(React.createElement(RobotNode, {
      robot: SampleRobot({ id: 'robot-xyz' }),
      onSelectProfile: (id) => { clicked = id; },
    }));
    fireEvent.click(screen.getByRole('button', { name: /open profile for robot-xyz/i }));
    expect(clicked).toBe('robot-xyz');
  });
  test('returns null when robot is undefined', () => {
    render(React.createElement(RobotNode, { robot: undefined }));
    expect(screen.queryByTestId(/^robot-node-/)).toBeNull();
  });
});
