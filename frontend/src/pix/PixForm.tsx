import { useState } from 'react';
import { CurrencyInput } from '../shared/CurrencyInput';

interface PixFormProps {
  onSubmit: (pixKey: string, amountCents: number) => void;
  loading: boolean;
}

function parseAmountToCents(rawAmount: string): number | null {
  const normalized = rawAmount.trim().replace(',', '.');

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const [wholePart, decimalPart = ''] = normalized.split('.');
  const cents = Number(wholePart) * 100 + Number(decimalPart.padEnd(2, '0'));

  if (!Number.isSafeInteger(cents) || cents <= 0) {
    return null;
  }

  return cents;
}

export function PixForm({ onSubmit, loading }: PixFormProps) {
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('100.00');
  const parsedAmountCents = parseAmountToCents(amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pixKey.trim() || parsedAmountCents === null) {
      return;
    }

    onSubmit(pixKey.trim(), parsedAmountCents);
  };

  return (
    <form className="pix-form" onSubmit={handleSubmit}>
      <div className="field" style={{ flex: 2 }}>
        <label>Pix Key</label>
        <input
          type="text"
          className="input"
          value={pixKey}
          onChange={(e) => setPixKey(e.target.value)}
          placeholder="e.g. valid-pix-key-001"
        />
      </div>
      <CurrencyInput value={amount} onChange={setAmount} label="Amount" />
      <button
        type="submit"
        className="btn"
        disabled={loading || !pixKey.trim() || parsedAmountCents === null}
        style={{ marginBottom: 0, alignSelf: 'flex-end' }}
      >
        {loading ? 'Querying...' : 'Query Pix Key'}
      </button>
    </form>
  );
}
