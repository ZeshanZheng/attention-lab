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

test('resuming guided work restores its own baseline and editing policy without sharing mutable references', () => {
  const initial = createLabState();
  let guided = labReducer(initial, { type: 'load-lesson', input: initial.input, kind: 'keys', token: 1, step: 2 });
  guided = labReducer(guided, { type: 'allow-lesson-editing', enabled: true });
  guided = labReducer(guided, { type: 'edit-vector', kind: 'keys', token: 1, vector: [2, 1] });
  const free = labReducer(initial, { type: 'edit-vector', kind: 'values', token: 2, vector: [-4, 0] });
  for (const enabled of [true, false]) {
    const snapshot = labReducer(guided, { type: 'allow-lesson-editing', enabled });
    const restored = labReducer(free, { type: 'resume-guided', state: snapshot });
    assert.deepEqual(restored, snapshot);
    assert.notEqual(restored.input.keys[1], snapshot.input.keys[1]);
    assert.notEqual(restored.baseline.values[2], snapshot.baseline.values[2]);
    assert.notEqual(restored.editPolicy, snapshot.editPolicy);
    assert.deepEqual(restored.baseline.keys[1], [0, 1]);
    const edit = { type: 'edit-vector', kind: 'keys', token: 1, vector: [3, 1] } as const;
    assert.equal(labReducer(restored, edit) === restored, !enabled);
    assert.equal(labReducer(restored, { ...edit, token: 0 }), restored);
    assert.equal(labReducer(restored, { type: 'save-baseline' }), restored);
    assert.equal(labReducer(restored, { type: 'select-query', index: 2 }), restored);
    const returned = labReducer(restored, { type: 'resume-free', state: free });
    assert.equal(returned.editPolicy, null);
    assert.deepEqual(returned.input.values[2], [-4, 0]);
  }
});
