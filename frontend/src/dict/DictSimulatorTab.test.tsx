import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DictSimulatorTab } from './DictSimulatorTab';

const { commitMock, registerPropsSpy } = vi.hoisted(() => ({
  commitMock: vi.fn(),
  registerPropsSpy: vi.fn(),
}));

vi.mock('react-relay', async () => {
  const actual = await vi.importActual('react-relay');

  return {
    ...actual,
    graphql: (literals: TemplateStringsArray) => literals.join(''),
    useMutation: () => [commitMock, false],
  };
});

vi.mock('./RegisterPaymentButton', () => ({
  RegisterPaymentButton: (props: { payerId: string; keyType: string; endToEndId: string }) => {
    registerPropsSpy(props);
    return <div data-testid="register-payment-button" />;
  },
}));

vi.mock('../shared/useToast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe('DictSimulatorTab', () => {
  beforeEach(() => {
    commitMock.mockReset();
    registerPropsSpy.mockReset();
  });

  it('uses simulated identifiers for register payment even after form edits', async () => {
    render(<DictSimulatorTab />);

    fireEvent.change(screen.getByPlaceholderText('12345678901'), {
      target: { value: '11111111111' },
    });
    fireEvent.change(screen.getByPlaceholderText('E2E-001'), {
      target: { value: 'E2E-SNAPSHOT-001' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Simulate Operation' }));

    expect(commitMock).toHaveBeenCalledTimes(1);

    const mutationCall = commitMock.mock.calls[0][0] as {
      onCompleted: (
        response: {
          simulateDictOperation: {
            allowed: boolean;
            httpStatus: number;
            blockedByPolicies: string[];
            impacts: Array<{
              policyCode: string;
              scopeType: string;
              scopeKey: string;
              costApplied: number;
              tokensBefore: number;
              tokensAfter: number;
              capacity: number;
              refillPerSecond: number;
            }>;
          };
        },
        errors?: ReadonlyArray<{ message?: string }> | null
      ) => void;
    };

    act(() => {
      mutationCall.onCompleted({
        simulateDictOperation: {
          allowed: true,
          httpStatus: 200,
          blockedByPolicies: [],
          impacts: [],
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('register-payment-button')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('12345678901'), {
      target: { value: '22222222222' },
    });
    fireEvent.change(screen.getByPlaceholderText('E2E-001'), {
      target: { value: 'E2E-SNAPSHOT-CHANGED' },
    });

    const latestCall = registerPropsSpy.mock.calls[registerPropsSpy.mock.calls.length - 1];
    const latestProps = latestCall?.[0] as {
      payerId: string;
      keyType: string;
      endToEndId: string;
    };

    expect(latestProps.payerId).toBe('11111111111');
    expect(latestProps.keyType).toBe('EMAIL');
    expect(latestProps.endToEndId).toBe('E2E-SNAPSHOT-001');
  });
});
