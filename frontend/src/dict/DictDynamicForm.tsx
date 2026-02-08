import {
  OPERATIONS_NEEDING_PAYER,
  OPERATIONS_WITH_ROLE_FILTER,
  DICT_KEY_TYPES,
  type DictKeyType,
  type DictOperation,
} from '../shared/constants';

export interface DictFormState {
  operation: DictOperation;
  simulatedStatusCode: number;
  payerId: string;
  keyType: DictKeyType;
  endToEndId: string;
  hasRoleFilter: boolean;
}

interface DictDynamicFormProps {
  state: DictFormState;
  onChange: (state: DictFormState) => void;
}

export function DictDynamicForm({ state, onChange }: DictDynamicFormProps) {
  const needsPayer = OPERATIONS_NEEDING_PAYER.has(state.operation);
  const needsRole = OPERATIONS_WITH_ROLE_FILTER.has(state.operation);

  const update = (patch: Partial<DictFormState>) =>
    onChange({ ...state, ...patch });

  return (
    <>
      {needsPayer && (
        <>
          <div className="field">
            <label>Payer ID</label>
            <input
              type="text"
              className="input"
              value={state.payerId}
              onChange={(e) => update({ payerId: e.target.value })}
              placeholder="12345678901"
            />
          </div>
          <div className="field">
            <label>Key Type</label>
            <select
              className="select"
              value={state.keyType}
              onChange={(e) => update({ keyType: e.target.value as DictKeyType })}
            >
              {DICT_KEY_TYPES.map((kt) => (
                <option key={kt} value={kt}>
                  {kt}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>End-to-End ID</label>
            <input
              type="text"
              className="input"
              value={state.endToEndId}
              onChange={(e) => update({ endToEndId: e.target.value })}
              placeholder="E2E-001"
            />
          </div>
        </>
      )}
      {needsRole && (
        <div className="field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={state.hasRoleFilter}
              onChange={(e) => update({ hasRoleFilter: e.target.checked })}
            />
            Has Role Filter
          </label>
        </div>
      )}
      <div className="field">
        <label>Simulated Status Code</label>
        <input
          type="number"
          className="input"
          value={state.simulatedStatusCode}
          onChange={(e) => update({ simulatedStatusCode: parseInt(e.target.value) || 200 })}
          min={100}
          max={599}
        />
      </div>
    </>
  );
}
