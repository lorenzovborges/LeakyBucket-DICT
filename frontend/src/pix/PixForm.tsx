import { useState } from 'react';
import { CurrencyInput } from '../shared/CurrencyInput';

interface PixFormProps {
  onSubmit: (pixKey: string, amount: number) => void;
  loading: boolean;
}

export function PixForm({ onSubmit, loading }: PixFormProps) {
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('100');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!pixKey.trim() || isNaN(parsed) || parsed <= 0) return;
    onSubmit(pixKey.trim(), parsed);
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
        disabled={loading || !pixKey.trim() || !amount}
        style={{ marginBottom: 0, alignSelf: 'flex-end' }}
      >
        {loading ? 'Querying...' : 'Query Pix Key'}
      </button>
    </form>
  );
}
