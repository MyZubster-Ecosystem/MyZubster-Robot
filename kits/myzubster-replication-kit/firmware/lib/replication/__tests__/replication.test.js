'use strict';
const R = require('../replication.js');

describe('modularPartRegistry', () => {
  const parts = [
    { id: 'chassis-v2', type: 'chassis', sockets: ['M3', 'snap-fit'], plugs: [] },
    { id: 'motor-tt', type: 'motor', sockets: ['snap-fit'], plugs: ['M3'], qty: 2 },
    { id: 'wheel-65', type: 'wheel', sockets: [], plugs: ['snap-fit'] },
    { id: 'esp32-mb', type: 'controller', sockets: ['USB-C', 'GPIO-header'], plugs: [] },
    { id: 'tof-1', type: 'sensor', sockets: [], plugs: ['magnetic'], qty: 3 },
  ];
  test('groups catalog by type and counts entries', () => {
    const reg = R.modularPartRegistry(parts);
    expect(reg.count).toBe(5);
    expect(Object.keys(reg.byType).sort()).toEqual(['chassis', 'controller', 'motor', 'sensor', 'wheel']);
  });
  test('sums qty into per-type inventory', () => {
    const reg = R.modularPartRegistry(parts);
    expect(reg.inventory.motor).toBe(2);
    expect(reg.inventory.sensor).toBe(3);
    expect(reg.inventory.chassis).toBe(1);
  });
  test('throws on a part missing id or type', () => {
    expect(() => R.modularPartRegistry([{ type: 'chassis' }])).toThrow();
    expect(() => R.modularPartRegistry([{ id: 'x' }])).toThrow();
  });
  test('defaults qty to 1 when omitted', () => {
    const reg = R.modularPartRegistry([{ id: 'c', type: 'chassis' }]);
    expect(reg.inventory.chassis).toBe(1);
  });
  test('clones sockets/plugs arrays defensively', () => {
    const input = [{ id: 'c', type: 'chassis', sockets: ['M3'], plugs: ['snap-fit'] }];
    const reg = R.modularPartRegistry(input);
    reg.catalog[0].sockets.push('HACK');
    expect(input[0].sockets).toEqual(['M3']);
  });
});

describe('partCompatibility', () => {
  const chassis = { id: 'chassis', sockets: ['M3', 'snap-fit'], plugs: [] };
  const motor = { id: 'motor', sockets: ['snap-fit'], plugs: ['M3'] };
  const sensor = { id: 'sensor', sockets: [], plugs: ['magnetic'] };
  const noMatch = { id: 'x', sockets: ['DIN-rail'], plugs: ['GPIO-header'] };
  test('reports a->b when a plugs match b sockets', () => {
    const r = R.partCompatibility(motor, chassis);
    expect(r.direction).toBe('a->b');
    expect(r.connectors).toContain('M3');
  });
  test('reports b->a when b plugs match a sockets', () => {
    const r = R.partCompatibility(chassis, motor);
    expect(r.direction).toBe('b->a');
    expect(r.connectors).toContain('M3');
  });
  test('returns null when no connector matches', () => {
    expect(R.partCompatibility(sensor, noMatch)).toBeNull();
  });
  test('returns null for undefined input', () => {
    expect(R.partCompatibility(null, motor)).toBeNull();
  });
});

describe('assemblySequencePlanner', () => {
  const good = [
    { id: 'chassis1', type: 'chassis' },
    { id: 'motor1', type: 'motor', qty: 2 },
    { id: 'wheel1', type: 'wheel', qty: 2 },
    { id: 'ctrl1', type: 'controller' },
    { id: 'sens1', type: 'sensor', qty: 3 },
  ];
  test('emits a resolvable ordered sequence when all parts present', () => {
    const r = R.assemblySequencePlanner(good);
    expect(r.resolvable).toBe(true);
    expect(r.missing).toEqual([]);
    expect(r.stepCount).toBeGreaterThan(8);
    expect(r.steps[0].action).toBe('pick');
    expect(r.steps[r.steps.length - 1].action).toBe('validate');
  });
  test('sequence is strictly increasing in seq numbers', () => {
    const r = R.assemblySequencePlanner(good);
    for (let i = 1; i < r.steps.length; i++) expect(r.steps[i].seq).toBeGreaterThan(r.steps[i - 1].seq);
  });
  test('flash step references the docs-only firmware clone', () => {
    const r = R.assemblySequencePlanner(good);
    const flash = r.steps.find((s) => s.action === 'flash');
    expect(flash).toBeTruthy();
    expect(flash.partId).toBe('firmware-clone');
  });
  test('reports missing when a module type is short', () => {
    const short = good.filter((p) => p.id === 'ctrl1'); // only controller present
    const r = R.assemblySequencePlanner(short);
    expect(r.resolvable).toBe(false);
    expect(r.steps).toEqual([]);
    expect(r.missing.length).toBeGreaterThan(0);
    expect(r.missing.some((m) => m.type === 'chassis')).toBe(true);
  });
  test('respects a custom copyComposition', () => {
    const big = good.map((p) => p.id === 'wheel1' ? { id: 'wheel1', type: 'wheel', qty: 2 } : p);
    big.push({ id: 'extra-sens', type: 'sensor', qty: 5 });
    const r = R.assemblySequencePlanner(big, { copyComposition: { chassis: 1, motor: 2, wheel: 2, controller: 1, sensor: 5 } });
    expect(r.resolvable).toBe(true);
  });
});

describe('firmwareCloneSpec', () => {
  const manifest = {
    parentVersion: '0.4.2',
    targetBoard: 'ESP32-DevKit',
    images: [
      { name: 'myzubster-fw', version: '0.4.2', size: 131072, targetSlot: 'main' },
      { name: 'bootstrap', version: '1.0.0', size: 4096, targetSlot: 'boot' },
    ],
  };
  test('builds an image list with reference checksums', () => {
    const spec = R.firmwareCloneSpec(manifest);
    expect(spec.images).toHaveLength(2);
    expect(spec.images[0].checksum).toMatch(/^ref-[0-9a-f]{8}$/);
    expect(spec.images[0].checksumAlgo).toBe('reference-fold-djb2');
  });
  test('checksum is deterministic for the same image identity', () => {
    const a = R.firmwareCloneSpec({ images: [{ name: 'x', version: '1.0.0', size: 100 }] });
    const b = R.firmwareCloneSpec({ images: [{ name: 'x', version: '1.0.0', size: 100 }] });
    expect(a.images[0].checksum).toBe(b.images[0].checksum);
  });
  test('checksum differs when size changes', () => {
    const a = R.firmwareCloneSpec({ images: [{ name: 'x', version: '1.0.0', size: 100 }] });
    const b = R.firmwareCloneSpec({ images: [{ name: 'x', version: '1.0.0', size: 200 }] });
    expect(a.images[0].checksum).not.toBe(b.images[0].checksum);
  });
  test('produces a flash plan in order and a clone payload', () => {
    const spec = R.firmwareCloneSpec(manifest);
    expect(spec.flashPlan).toHaveLength(2);
    expect(spec.flashPlan[0].order).toBe(1);
    expect(spec.clonePayload.imageCount).toBe(2);
    expect(spec.clonePayload.totalSizeBytes).toBe(135168);
    expect(spec.clonePayload.parentVersion).toBe('0.4.2');
  });
  test('marks spec as docsOnly and cloneable', () => {
    const spec = R.firmwareCloneSpec(manifest);
    expect(spec.docsOnly).toBe(true);
    expect(spec.cloneable).toBe(true);
  });
  test('rejects a manifest without images', () => {
    expect(() => R.firmwareCloneSpec({})).toThrow();
  });
});

describe('selfReplicationController', () => {
  test('happy path IDLE -> SCAN -> VERIFY -> ASSEMBLE -> FLASH -> VALIDATE -> DONE', () => {
    let s = { state: 'IDLE', event: 'start', context: { inventory: { chassis: 1 } } };
    let r = R.selfReplicationController(s); expect(r.state).toBe('SCAN');
    r = R.selfReplicationController({ state: r.state, event: 'partsFound' }); expect(r.state).toBe('VERIFY');
    r = R.selfReplicationController({ state: r.state, event: 'partsComplete', context: { steps: [1, 2] } }); expect(r.state).toBe('ASSEMBLE');
    r = R.selfReplicationController({ state: r.state, event: 'sequenceComplete', context: { spec: {} } }); expect(r.state).toBe('FLASH');
    r = R.selfReplicationController({ state: r.state, event: 'flashDone' }); expect(r.state).toBe('VALIDATE');
    r = R.selfReplicationController({ state: r.state, event: 'copyValid', context: { copies: 2 } }); expect(r.state).toBe('DONE');
    expect(r.output.copies).toBe(3);
    expect(r.progress).toBe(1);
  });
  test('VERIFY with partsMissing transitions to FAULT', () => {
    let r = R.selfReplicationController({ state: 'VERIFY', event: 'partsMissing', context: { missing: [{ type: 'chassis' }] } });
    expect(r.state).toBe('FAULT');
    expect(r.output.reason).toMatch(/missing/);
  });
  test('FLASH with flashError transitions to FAULT', () => {
    let r = R.selfReplicationController({ state: 'FLASH', event: 'flashError' });
    expect(r.state).toBe('FAULT');
  });
  test('VALIDATE copyInvalid transitions to FAULT', () => {
    let r = R.selfReplicationController({ state: 'VALIDATE', event: 'copyInvalid', context: { differences: ['x'] } });
    expect(r.state).toBe('FAULT');
    expect(r.output.differences).toHaveLength(1);
  });
  test('FAULT reset returns to IDLE', () => {
    let r = R.selfReplicationController({ state: 'FAULT', event: 'reset' });
    expect(r.state).toBe('IDLE');
  });
  test('SCAN scanEmpty transitions to FAULT', () => {
    let r = R.selfReplicationController({ state: 'SCAN', event: 'scanEmpty', context: { missing: [] } });
    expect(r.state).toBe('FAULT');
  });
  test('throws on an invalid state', () => {
    expect(() => R.selfReplicationController({ state: 'BOGUS', event: 'tick' })).toThrow();
  });
  test('DONE reset returns to IDLE for the next replication', () => {
    let r = R.selfReplicationController({ state: 'DONE', event: 'reset' });
    expect(r.state).toBe('IDLE');
    expect(r.output.reset).toBe(true);
  });
  test('IDLE with no-op event stays IDLE', () => {
    let r = R.selfReplicationController({ state: 'IDLE', event: 'tick' });
    expect(r.state).toBe('IDLE');
  });
});

describe('replicationProgressTracker', () => {
  const steps = Array.from({ length: 11 }, (_, i) => ({ seq: i + 1 }));
  test('reports 0% and idle at start', () => {
    const p = R.replicationProgressTracker(steps, 0);
    expect(p.pct).toBe(0);
    expect(p.phase).toBe('idle');
    expect(p.complete).toBe(false);
  });
  test('reports 100% and done when all complete', () => {
    const p = R.replicationProgressTracker(steps, 11);
    expect(p.pct).toBe(100);
    expect(p.phase).toBe('done');
    expect(p.complete).toBe(true);
  });
  test('clamps completed count to total', () => {
    const p = R.replicationProgressTracker(steps, 99);
    expect(p.completed).toBe(11);
    expect(p.remaining).toBe(0);
  });
  test('phase advances through pick/mount/install/plug/flash/validate', () => {
    expect(R.replicationProgressTracker(steps, 1).phase).toBe('pick');
    expect(R.replicationProgressTracker(steps, 3).phase).toBe('mount');
    expect(R.replicationProgressTracker(steps, 6).phase).toBe('install');
    expect(R.replicationProgressTracker(steps, 8).phase).toBe('plug');
    expect(R.replicationProgressTracker(steps, 9).phase).toBe('flash');
    expect(R.replicationProgressTracker(steps, 10).phase).toBe('validate');
  });
  test('accepts a numeric total instead of a steps array', () => {
    const p = R.replicationProgressTracker(4, 2);
    expect(p.pct).toBe(50);
    expect(p.completed).toBe(2);
  });
  test('handles zero total gracefully', () => {
    const p = R.replicationProgressTracker(0, 0);
    expect(p.pct).toBe(0);
    expect(p.complete).toBe(false);
  });
});

describe('replicationValidator', () => {
  const original = { composition: { chassis: 1, motor: 2, wheel: 2, controller: 1, sensor: 3 }, firmwareVersion: '0.4.2' };
  test('match=true when copy equals original', () => {
    const copy = { composition: { chassis: 1, motor: 2, wheel: 2, controller: 1, sensor: 3 }, firmwareVersion: '0.4.2' };
    const v = R.replicationValidator(copy, original);
    expect(v.match).toBe(true);
    expect(v.differences).toEqual([]);
    expect(v.copyComplete).toBe(true);
  });
  test('reports a delta when a part count differs', () => {
    const copy = { composition: { chassis: 1, motor: 1, wheel: 2, controller: 1, sensor: 3 }, firmwareVersion: '0.4.2' };
    const v = R.replicationValidator(copy, original);
    expect(v.match).toBe(false);
    expect(v.differences.some((d) => d.type === 'motor' && d.delta === -1)).toBe(true);
  });
  test('reports a missing module type as delta -full', () => {
    const copy = { composition: { chassis: 1, motor: 2, wheel: 2, sensor: 3 }, firmwareVersion: '0.4.2' };
    const v = R.replicationValidator(copy, original);
    expect(v.match).toBe(false);
    expect(v.differences.some((d) => d.type === 'controller')).toBe(true);
  });
  test('flags firmware version mismatch', () => {
    const copy = { composition: original.composition, firmwareVersion: '0.4.3' };
    const v = R.replicationValidator(copy, original);
    expect(v.match).toBe(false);
    expect(v.differences.some((d) => d.type === 'firmware')).toBe(true);
  });
  test('copyComplete false when any difference exists', () => {
    const copy = { composition: { chassis: 1 }, firmwareVersion: '0.4.2' };
    const v = R.replicationValidator(copy, original);
    expect(v.copyComplete).toBe(false);
  });
});
