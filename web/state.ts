import { createDefaultExperiment } from '../src/index.ts';
import type { AttentionInput } from '../src/index.ts';

export type VectorKind = 'queries' | 'keys' | 'values';
export interface LabState {
  readonly input: AttentionInput;
  readonly baseline: AttentionInput;
  readonly selectedQueryIndex: number;
  readonly editingTokenIndex: number;
  readonly vectorKind: VectorKind;
  readonly step: number;
}
export type LabAction =
  | { type: 'edit-vector'; kind: VectorKind; token: number; vector: readonly [number, number] }
  | { type: 'select-query'; index: number }
  | { type: 'select-token'; index: number }
  | { type: 'select-kind'; kind: VectorKind }
  | { type: 'select-step'; step: number }
  | { type: 'save-baseline' }
  | { type: 'restore-baseline' }
  | { type: 'reset' };

export const VECTOR_LIMIT = 5;

function copyInput(input: AttentionInput): AttentionInput {
  return {
    queries: input.queries.map((row) => [...row]),
    keys: input.keys.map((row) => [...row]),
    values: input.values.map((row) => [...row]),
  };
}

export function createLabState(): LabState {
  const experiment = createDefaultExperiment();
  return {
    input: copyInput(experiment.input),
    baseline: copyInput(experiment.input),
    selectedQueryIndex: 0,
    editingTokenIndex: 0,
    vectorKind: 'keys',
    step: 0,
  };
}

export function labReducer(state: LabState, action: LabAction): LabState {
  switch (action.type) {
    case 'edit-vector': {
      if (!Number.isInteger(action.token) || action.token < 0 || action.token >= state.input[action.kind].length
        || action.vector.length !== 2 || !action.vector.every((value) => Number.isFinite(value) && Math.abs(value) <= VECTOR_LIMIT)) {
        return state;
      }
      return { ...state, input: { ...state.input,
        [action.kind]: state.input[action.kind].map((row, index) => index === action.token ? [...action.vector] : [...row]),
      } };
    }
    case 'select-query':
      return Number.isInteger(action.index) && action.index >= 0 && action.index < state.input.queries.length
        ? { ...state, selectedQueryIndex: action.index } : state;
    case 'select-token':
      return Number.isInteger(action.index) && action.index >= 0 && action.index < state.input.keys.length
        ? { ...state, editingTokenIndex: action.index } : state;
    case 'select-kind':
      return { ...state, vectorKind: action.kind };
    case 'select-step':
      return Number.isInteger(action.step) && action.step >= 0 && action.step <= 3
        ? { ...state, step: action.step } : state;
    case 'save-baseline':
      return { ...state, baseline: copyInput(state.input) };
    case 'restore-baseline':
      return { ...state, input: copyInput(state.baseline) };
    case 'reset':
      return createLabState();
  }
}
