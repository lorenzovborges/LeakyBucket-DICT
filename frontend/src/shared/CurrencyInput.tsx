import { useCallback, type ChangeEvent } from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function CurrencyInput({ value, onChange, label }: CurrencyInputProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
      onChange(raw);
    },
    [onChange],
  );

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-secondary)',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          R$
        </span>
        <input
          type="text"
          className="input"
          style={{ paddingLeft: 40 }}
          value={value}
          onChange={handleChange}
          placeholder="0.00"
        />
      </div>
    </div>
  );
}
