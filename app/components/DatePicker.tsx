'use client';
import { useCallback } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { Japanese } from 'flatpickr/dist/l10n/ja.js';
import styles from './DatePicker.module.css';   // ✅ CSS Module を読み込む

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
    <div className={styles.dateWrapper}>
      <label className={styles.dateLabel}>{label}</label>

      <Flatpickr
        className={styles.dateInput}   // ✅ CSS Module適用
        value={value}
        onChange={handleChange}
        options={{
          locale: { ...Japanese, firstDayOfWeek: 1 },
          dateFormat: 'Y-m-d',
          minDate,
          maxDate,
          disableMobile: true, // ✅ スマホでも必ず Flatpickr
        }}
      />
    </div>
  );
}
