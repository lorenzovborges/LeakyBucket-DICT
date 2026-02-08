import {
  DICT_POLICY_CODES,
  DICT_SCOPE_TYPES,
  type DictPolicyCode,
  type DictScopeType,
} from '../shared/constants';

export type PolicyFilter = DictPolicyCode | '';
export type ScopeFilter = DictScopeType | '';

interface BucketFiltersProps {
  policyCode: PolicyFilter;
  scopeType: ScopeFilter;
  refreshInterval: number;
  onPolicyCodeChange: (v: PolicyFilter) => void;
  onScopeTypeChange: (v: ScopeFilter) => void;
  onRefreshIntervalChange: (v: number) => void;
}

export function BucketFilters({
  policyCode,
  scopeType,
  refreshInterval,
  onPolicyCodeChange,
  onScopeTypeChange,
  onRefreshIntervalChange,
}: BucketFiltersProps) {
  return (
    <div className="monitor-filters">
      <div className="field">
        <label>Policy Code</label>
        <select
          className="select"
          value={policyCode}
          onChange={(e) => onPolicyCodeChange(e.target.value as PolicyFilter)}
        >
          <option value="">All Policies</option>
          {DICT_POLICY_CODES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Scope Type</label>
        <select
          className="select"
          value={scopeType}
          onChange={(e) => onScopeTypeChange(e.target.value as ScopeFilter)}
        >
          <option value="">All Scopes</option>
          {DICT_SCOPE_TYPES.map((scope) => (
            <option key={scope} value={scope}>
              {scope}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Auto-refresh</label>
        <select
          className="select"
          value={refreshInterval}
          onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
        >
          <option value={0}>Off</option>
          <option value={5000}>5s</option>
          <option value={10000}>10s</option>
          <option value={30000}>30s</option>
        </select>
      </div>
    </div>
  );
}
