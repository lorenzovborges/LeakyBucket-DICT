import { useState, useCallback } from 'react';
import { graphql, useMutation, useLazyLoadQuery } from 'react-relay';
import { PixForm } from './PixForm';
import { PixResultCard } from './PixResultCard';
import { BucketGauge } from './BucketGauge';
import { TransactionHistory, type HistoryEntry } from './TransactionHistory';
import { useToast } from '../shared/useToast';
import type { PixTransactionTabBucketQuery } from '../__generated__/PixTransactionTabBucketQuery.graphql';
import type { PixTransactionTabMutation } from '../__generated__/PixTransactionTabMutation.graphql';

const bucketQuery = graphql`
  query PixTransactionTabBucketQuery {
    myBucket {
      availableTokens
      maxTokens
      lastRefillAt
    }
  }
`;

const queryPixKeyMutation = graphql`
  mutation PixTransactionTabMutation($input: QueryPixKeyInput!) {
    queryPixKey(input: $input) {
      status
      message
      pixKeyFound
      ownerName
      bankName
      availableTokens
      maxTokens
      consumedToken
      requestedAt
    }
  }
`;

interface PixResult {
  status: string;
  message: string;
  pixKeyFound: boolean;
  ownerName: string | null;
  bankName: string | null;
  consumedToken: boolean;
  requestedAt: string;
}

let historyId = 0;

export function PixTransactionTab() {
  const [fetchKey, setFetchKey] = useState(0);
  const data = useLazyLoadQuery<PixTransactionTabBucketQuery>(bucketQuery, {}, { fetchKey, fetchPolicy: 'network-only' });
  const [commitMutation, isMutating] = useMutation<PixTransactionTabMutation>(queryPixKeyMutation);

  const [lastResult, setLastResult] = useState<PixResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [bucketOverride, setBucketOverride] = useState<{ available: number; max: number } | null>(null);
  const { addToast } = useToast();

  const available = bucketOverride?.available ?? data.myBucket.availableTokens;
  const max = bucketOverride?.max ?? data.myBucket.maxTokens;

  const handleSubmit = useCallback(
    (pixKey: string, amount: number) => {
      commitMutation({
        variables: { input: { pixKey, amount } },
        onCompleted: (response, errors) => {
          if (errors && errors.length > 0) {
            addToast(errors[0]?.message ?? 'GraphQL error while querying pix key', 'error');
            return;
          }

          const r = response.queryPixKey;

          if (!r) {
            addToast('Pix query response was empty', 'error');
            return;
          }

          setLastResult({
            status: r.status,
            message: r.message,
            pixKeyFound: r.pixKeyFound,
            ownerName: r.ownerName ?? null,
            bankName: r.bankName ?? null,
            consumedToken: r.consumedToken,
            requestedAt: r.requestedAt,
          });
          setBucketOverride({ available: r.availableTokens, max: r.maxTokens });
          setHistory((prev) => [
            {
              id: ++historyId,
              pixKey,
              amount,
              status: r.status,
              time: new Date(r.requestedAt).toLocaleTimeString(),
            },
            ...prev,
          ]);
          if (r.status === 'SUCCESS') {
            addToast('Pix key query successful', 'success');
          } else if (r.status === 'RATE_LIMITED') {
            addToast('Rate limited! No tokens available.', 'error');
          } else {
            addToast(`Query failed: ${r.message}`, 'error');
          }
          setFetchKey((k) => k + 1);
        },
        onError: (error) => {
          addToast(`Error: ${error.message}`, 'error');
        },
      });
    },
    [commitMutation, addToast],
  );

  return (
    <div>
      <div className="pix-layout">
        <div>
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Query Pix Key</h2>
            <PixForm onSubmit={handleSubmit} loading={isMutating} />
          </div>
          {lastResult && <PixResultCard result={lastResult} />}
        </div>
        <BucketGauge available={available} max={max} />
      </div>
      <TransactionHistory entries={history} />
    </div>
  );
}
