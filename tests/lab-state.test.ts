import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeAttention } from '../src/index.ts';
import { createLabState, labReducer } from '../web/state.ts';

test('editing B preserves the observed Query and leaves the baseline unchanged', () => {
  const state = createLabState();
  const edited = labReducer(labReducer(state, { type: 'select-token', index: 1 }),
    { type: 'edit-vector', kind: 'values', token: 1, vector: [0, 4] });
  assert.equal(edited.selectedQueryIndex, 0);
  assert.deepEqual(edited.baseline.values[1], [0, 2]);
  assert.deepEqual(state.input.values[1], [0, 2]);
  assert.equal(computeAttention(edited.input).outputs[0]![1], 2 * computeAttention(state.input).outputs[0]![1]!);
});

test('saved baselines are independent, can be restored, and reset returns to the original experiment', () => {
  let state = labReducer(createLabState(), { type: 'edit-vector', kind: 'values', token: 1, vector: [0, 4] });
  state = labReducer(state, { type: 'save-baseline' });
  state = labReducer(state, { type: 'edit-vector', kind: 'values', token: 1, vector: [1, 3] });
  assert.deepEqual(state.baseline.values[1], [0, 4]);
  assert.deepEqual(labReducer(state, { type: 'restore-baseline' }).input.values[1], [0, 4]);
  assert.deepEqual(labReducer(state, { type: 'reset' }), createLabState());
});

test('invalid coordinates and invalid selection indices cannot corrupt the experiment', () => {
  const state = createLabState();
  for (const vector of [[NaN, 0], [Infinity, 0], [6, 0]] as const) {
    assert.equal(labReducer(state, { type: 'edit-vector', kind: 'keys', token: 0, vector }), state);
  }
  assert.equal(labReducer(state, { type: 'select-query', index: -1 }), state);
  assert.equal(labReducer(state, { type: 'select-token', index: 3 }), state);
  assert.equal(labReducer(state, { type: 'select-step', step: 4 }), state);
});
