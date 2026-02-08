import { useState } from 'react';
import { graphql, useMutation } from 'react-relay';
import { ImpactsTable } from './ImpactsTable';
import { useToast } from '../shared/useToast';
import { type DictKeyType } from '../shared/constants';
import type { RegisterPaymentButtonMutation } from '../__generated__/RegisterPaymentButtonMutation.graphql';

const mutation = graphql`
  mutation RegisterPaymentButtonMutation($input: RegisterPaymentSentInput!) {
    registerPaymentSent(input: $input) {
      credited
      reason
      impacts {
        policyCode
        scopeType
        scopeKey
        costApplied
        tokensBefore
        tokensAfter
        capacity
        refillPerSecond
      }
    }
  }
`;

interface RegisterPaymentButtonProps {
  payerId: string;
  keyType: DictKeyType;
  endToEndId: string;
}

export function RegisterPaymentButton({ payerId, keyType, endToEndId }: RegisterPaymentButtonProps) {
  const [commit, isPending] = useMutation<RegisterPaymentButtonMutation>(mutation);
  const { addToast } = useToast();

  const [result, setResult] = useState<
    RegisterPaymentButtonMutation['response']['registerPaymentSent'] | null
  >(null);

  const handleClick = () => {
    commit({
      variables: {
        input: {
          payerId,
          keyType,
          endToEndId,
        },
      },
      onCompleted: (response, errors) => {
        if (errors && errors.length > 0) {
          addToast(errors[0]?.message ?? 'GraphQL error while registering payment', 'error');
          return;
        }

        const r = response.registerPaymentSent;

        if (!r) {
          addToast('Payment registration response was empty', 'error');
          return;
        }

        setResult(r);
        if (r.credited) {
          addToast('Payment registered — tokens credited!', 'success');
        } else {
          addToast(`Not credited: ${r.reason}`, 'info');
        }
      },
      onError: (err) => addToast(`Error: ${err.message}`, 'error'),
    });
  };

  return (
    <div className="register-payment-btn">
      <button className="btn" onClick={handleClick} disabled={isPending}>
        {isPending ? 'Registering...' : 'Register Payment Sent'}
      </button>
      {result && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, color: result.credited ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)', marginBottom: 8 }}>
            {result.reason}
          </p>
          {result.impacts.length > 0 && <ImpactsTable impacts={result.impacts} />}
        </div>
      )}
    </div>
  );
}
