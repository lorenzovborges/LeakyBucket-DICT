import { useState, useCallback } from 'react';
import { graphql, useMutation } from 'react-relay';
import { OperationSelector } from './OperationSelector';
import { DictDynamicForm, type DictFormState } from './DictDynamicForm';
import { DictResultPanel } from './DictResultPanel';
import { RegisterPaymentButton } from './RegisterPaymentButton';
import { useToast } from '../shared/useToast';
import {
  OPERATIONS_NEEDING_PAYER,
  OPERATIONS_WITH_ROLE_FILTER,
  type DictKeyType,
  type DictOperation,
} from '../shared/constants';
import type {
  DictSimulatorTabMutation,
  DictSimulatorTabMutation$variables,
} from '../__generated__/DictSimulatorTabMutation.graphql';

const simulateMutation = graphql`
  mutation DictSimulatorTabMutation($input: SimulateDictOperationInput!) {
    simulateDictOperation(input: $input) {
      allowed
      httpStatus
      blockedByPolicies
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

interface DictResult {
  allowed: boolean;
  httpStatus: number;
  blockedByPolicies: readonly string[];
  impacts: readonly {
    policyCode: string;
    scopeType: string;
    scopeKey: string;
    costApplied: number;
    tokensBefore: number;
    tokensAfter: number;
    capacity: number;
    refillPerSecond: number;
  }[];
}

interface PaymentSnapshot {
  payerId: string;
  keyType: DictKeyType;
  endToEndId: string;
}

const DEFAULT_FORM: DictFormState = {
  operation: 'GET_ENTRY',
  simulatedStatusCode: 200,
  payerId: '12345678901',
  keyType: 'EMAIL',
  endToEndId: 'E2E-001',
  hasRoleFilter: false,
};

export function DictSimulatorTab() {
  const [form, setForm] = useState<DictFormState>(DEFAULT_FORM);
  const [result, setResult] = useState<DictResult | null>(null);
  const [paymentSnapshot, setPaymentSnapshot] = useState<PaymentSnapshot | null>(null);
  const [commit, isPending] = useMutation<DictSimulatorTabMutation>(simulateMutation);
  const { addToast } = useToast();

  const handleOperationChange = useCallback(
    (op: DictOperation) => {
      setForm((prev) => ({ ...prev, operation: op }));
      setResult(null);
      setPaymentSnapshot(null);
    },
    [],
  );

  const handleSimulate = useCallback(() => {
    const needsPayer = OPERATIONS_NEEDING_PAYER.has(form.operation);
    const needsRole = OPERATIONS_WITH_ROLE_FILTER.has(form.operation);
    const simulatedPaymentSnapshot: PaymentSnapshot | null = needsPayer
      ? {
          payerId: form.payerId,
          keyType: form.keyType,
          endToEndId: form.endToEndId,
        }
      : null;

    const input: DictSimulatorTabMutation$variables['input'] = {
      operation: form.operation,
      simulatedStatusCode: form.simulatedStatusCode,
    };

    if (needsPayer) {
      input.payerId = form.payerId;
      input.keyType = form.keyType;
      input.endToEndId = form.endToEndId;
    }

    if (needsRole) {
      input.hasRoleFilter = form.hasRoleFilter;
    }

    setPaymentSnapshot(null);

    commit({
      variables: { input },
      onCompleted: (response, errors) => {
        if (errors && errors.length > 0) {
          addToast(errors[0]?.message ?? 'GraphQL error while simulating operation', 'error');
          return;
        }

        const simulation = response.simulateDictOperation;

        if (!simulation) {
          addToast('Simulation response was empty', 'error');
          return;
        }

        setResult(simulation);

        if (
          simulation.allowed &&
          input.operation === 'GET_ENTRY' &&
          input.simulatedStatusCode === 200 &&
          simulatedPaymentSnapshot
        ) {
          setPaymentSnapshot(simulatedPaymentSnapshot);
        }

        if (simulation.allowed) {
          addToast('Operation allowed', 'success');
        } else {
          addToast(`Operation blocked (HTTP ${simulation.httpStatus})`, 'error');
        }
      },
      onError: (err) => addToast(`Error: ${err.message}`, 'error'),
    });
  }, [form, commit, addToast]);

  const showRegisterPayment = paymentSnapshot !== null;

  return (
    <div className="dict-layout">
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>DICT Operation</h2>
        <div className="dict-form">
          <OperationSelector value={form.operation} onChange={handleOperationChange} />
          <DictDynamicForm state={form} onChange={setForm} />
          <button className="btn" onClick={handleSimulate} disabled={isPending}>
            {isPending ? 'Simulating...' : 'Simulate Operation'}
          </button>
        </div>
      </div>

      <div>
        {result && <DictResultPanel result={result} />}
        {showRegisterPayment && paymentSnapshot && (
          <RegisterPaymentButton
            payerId={paymentSnapshot.payerId}
            keyType={paymentSnapshot.keyType}
            endToEndId={paymentSnapshot.endToEndId}
          />
        )}
      </div>
    </div>
  );
}
