import { useState, useEffect } from 'react';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { BucketFilters, type PolicyFilter, type ScopeFilter } from './BucketFilters';
import { BucketTable } from './BucketTable';
import type {
  BucketMonitorTabQuery,
  BucketMonitorTabQuery$variables,
} from '../__generated__/BucketMonitorTabQuery.graphql';

const listBucketsQuery = graphql`
  query BucketMonitorTabQuery($policyCode: DictPolicyCode, $scopeType: DictScopeType) {
    listDictBucketStates(policyCode: $policyCode, scopeType: $scopeType) {
      policyCode
      scopeType
      scopeKey
      tokens
      capacity
      refillPerSecond
      lastRefillAt
    }
  }
`;

export function BucketMonitorTab() {
  const [policyCode, setPolicyCode] = useState<PolicyFilter>('');
  const [scopeType, setScopeType] = useState<ScopeFilter>('');
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (refreshInterval <= 0) return;
    const id = setInterval(() => setFetchKey((k) => k + 1), refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval]);

  const variables: BucketMonitorTabQuery$variables = {};
  if (policyCode) variables.policyCode = policyCode;
  if (scopeType) variables.scopeType = scopeType;

  const data = useLazyLoadQuery<BucketMonitorTabQuery>(
    listBucketsQuery,
    variables,
    { fetchKey, fetchPolicy: 'network-only' },
  );

  return (
    <div>
      <BucketFilters
        policyCode={policyCode}
        scopeType={scopeType}
        refreshInterval={refreshInterval}
        onPolicyCodeChange={setPolicyCode}
        onScopeTypeChange={setScopeType}
        onRefreshIntervalChange={setRefreshInterval}
      />
      <BucketTable buckets={data.listDictBucketStates} />
      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
        <button className="btn btn-sm btn-outline" onClick={() => setFetchKey((k) => k + 1)}>
          Refresh Now
        </button>
        {refreshInterval > 0 && (
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
            Auto-refresh every {refreshInterval / 1000}s
          </span>
        )}
      </div>
    </div>
  );
}
