import {
  DICT_OPERATION_GROUPS,
  type DictOperation,
} from '../shared/constants';

interface OperationSelectorProps {
  value: DictOperation;
  onChange: (op: DictOperation) => void;
}

export function OperationSelector({ value, onChange }: OperationSelectorProps) {
  return (
    <div className="field">
      <label>Operation</label>
      <select
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value as DictOperation)}
      >
        {Object.entries(DICT_OPERATION_GROUPS).map(([group, ops]) => (
          <optgroup key={group} label={group}>
            {ops.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
