'use client'

import dynamic from 'next/dynamic'
import { Japanese } from 'flatpickr/dist/l10n/ja'
import 'flatpickr/dist/flatpickr.min.css'
import { useRef } from 'react'
import styles from './DatePicker.module.css'   // ✅ 追加

const Flatpickr = dynamic(() => import('react-flatpickr'), { ssr: false })

type Props = {
  label: string;
  value: string;
  onChange: (date: string) => void;
  minDate?: string | Date;
  maxDate?: string | Date;
  disabled?: boolean;
}

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function DatePicker({ label, value, onChange, minDate, maxDate, disabled }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)

  return (
    <div className={styles.dateWrapper} ref={wrapRef}>
      <label className={styles.dateLabel}>{label}</label>
      <Flatpickr
        value={value}
        options={{
          locale: { ...Japanese, firstDayOfWeek: 1 },
          dateFormat: 'Y-m-d',
          minDate,
          maxDate,
          allowInput: true,
          static: true,
          appendTo: wrapRef.current || undefined,
        }}
        onChange={(dates) => onChange(dates[0] ? formatDate(dates[0]) : '')}
        className={styles.dateInput}    // ✅ ここでCSSを適用
        disabled={disabled}
      />
    </div>
  )
}
