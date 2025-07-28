'use client';
import { useCallback } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { Japanese } from 'flatpickr/dist/l10n/ja.js';

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  minDate?: string;
  maxDate?: string;
};

const format = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

export default function DatePicker({ label, value, onChange, minDate, maxDate }: Props) {
  const handleChange = useCallback(
    (dates: Date[]) => dates[0] && onChange(format(dates[0])),
    [onChange]
  );

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontWeight: 'bold', fontSize: 18, display: 'block', marginBottom: 6 }}>
        {label}
      </label>

      <Flatpickr
        value={value}
        onChange={handleChange}
        options={{
          locale: { ...Japanese, firstDayOfWeek: 1 },
          dateFormat: 'Y-m-d',
          minDate,
          maxDate,
          disableMobile: true, // ← スマホでも必ず Flatpickr
        }}
      />
    </div>
  );
}
