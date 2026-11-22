// Run: node --test engine/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { sizeHotel, evaluateSize, paramsFor, SCENARIOS, PARAMS, touSlot } from './model.mjs';

test('every scenario respects the energy balance (electrical + thermal <= 0.85)', () => {
  for (const s of SCENARIOS) {
    const p = paramsFor(s);
    assert.ok(p.engineElecEff + p.engineThermalEff <= 0.85 + 1e-9, s);
  }
});

test('every parameter has three values and a source', () => {
  for (const [k, v] of Object.entries(PARAMS)) {
    assert.equal(v.values.length, 3, k);
    assert.ok(v.source.length > 10, k);
  }
});

test('scenarios are ordered: unfavourable payback >= central >= favourable', () => {
  for (const rooms of [100, 300, 500]) {
    const r = sizeHotel({ rooms, city: 'djerba', pool: true });
    const { unfavourable: u, central: c, favourable: f } = r.scenarios;
    assert.ok(u.paybackYears >= c.paybackYears && c.paybackYears >= f.paybackYears, `${rooms} rooms`);
  }
});

test('the plant never makes more heat than the engine can recover', () => {
  const r = sizeHotel({});
  const p = paramsFor('central');
  for (const row of [...r.hourly.summer, ...r.hourly.winter]) {
    assert.ok(row.recoveredHeat <= (row.engineElec * p.engineThermalEff) / p.engineElecEff + 1);
  }
});

test('engine is off or at least at 50% load', () => {
  const r = sizeHotel({});
  for (const row of [...r.hourly.summer, ...r.hourly.winter]) {
    assert.ok(row.engineElec === 0 || row.engineElec >= 0.5 * r.engineKwe - 1, `hour ${row.hour}`);
  }
});

test('a summer-sized 450 kWe engine is a poor investment for the 300-room Djerba demo', () => {
  const e = evaluateSize({ rooms: 300, city: 'djerba', pool: true }, 450, 'central');
  assert.ok(e.paybackYears > 15);
  assert.ok(e.fullLoadHours < 3000);
});

test('Djerba demo: headline is a trigeneration option with a range, not a point', () => {
  const r = sizeHotel({ rooms: 300, city: 'djerba', pool: true });
  assert.ok(r.chillerKwc >= 50);
  assert.ok(r.options.best && r.options.trigeneration);
  assert.ok(r.scenarios.favourable.paybackYears < r.scenarios.unfavourable.paybackYears);
});

test('STEG time-of-use slots', () => {
  assert.equal(touSlot(10, true), 'morningPeak');
  assert.equal(touSlot(20, true), 'eveningPeak');
  assert.equal(touSlot(3, true), 'night');
  assert.equal(touSlot(19, false), 'eveningPeak');
  assert.equal(touSlot(10, false), 'day');
});

test('deterministic', () => {
  assert.deepEqual(sizeHotel({ rooms: 250, city: 'sousse' }), sizeHotel({ rooms: 250, city: 'sousse' }));
});
