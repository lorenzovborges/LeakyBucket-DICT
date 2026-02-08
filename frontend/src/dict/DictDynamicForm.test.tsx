import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DictDynamicForm, type DictFormState } from './DictDynamicForm';

function renderForm(state: DictFormState) {
  return render(
    <DictDynamicForm
      state={state}
      onChange={vi.fn()}
    />,
  );
}

const BASE_STATE: DictFormState = {
  operation: 'GET_ENTRY',
  simulatedStatusCode: 200,
  payerId: '12345678901',
  keyType: 'EMAIL',
  endToEndId: 'E2E-001',
  hasRoleFilter: false,
};

describe('DictDynamicForm', () => {
  it('shows payer fields for GET_ENTRY', () => {
    renderForm(BASE_STATE);

    expect(screen.getByPlaceholderText('12345678901')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('E2E-001')).toBeInTheDocument();
    expect(screen.getByText('Key Type')).toBeInTheDocument();
  });

  it('does not show payer fields for GET_ENTRY_STATISTICS', () => {
    renderForm({
      ...BASE_STATE,
      operation: 'GET_ENTRY_STATISTICS',
    });

    expect(screen.queryByPlaceholderText('12345678901')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('E2E-001')).not.toBeInTheDocument();
    expect(screen.queryByText('Key Type')).not.toBeInTheDocument();
  });

  it('does not show role filter for LIST_FRAUD_MARKERS', () => {
    renderForm({
      ...BASE_STATE,
      operation: 'LIST_FRAUD_MARKERS',
    });

    expect(screen.queryByText('Has Role Filter')).not.toBeInTheDocument();
  });

  it('shows role filter for LIST_CLAIMS', () => {
    renderForm({
      ...BASE_STATE,
      operation: 'LIST_CLAIMS',
    });

    expect(screen.getByText('Has Role Filter')).toBeInTheDocument();
  });
});
