'use client'

import { useEffect, useRef } from 'react'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import { Japanese } from 'flatpickr/dist/l10n/ja.js'

type Props = {
  label: string
  value: string
  onChange: (date: string) => void
  minDate?: string
  maxDate?: string
  linkedStartDate?: string
}

// ✅ JST用フォーマット関数（UTCズレを防ぐ）
function formatDateJST(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function DatePicker({ label, value, onChange, minDate, maxDate, linkedStartDate }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!inputRef.current) return

    // ✅ Flatpickr 初期化（スマホ標準カレンダー封じるため text モードで）
    const fp = flatpickr(inputRef.current, {
      locale: { ...Japanese, firstDayOfWeek: 1 },
      dateFormat: 'Y-m-d',
      defaultDate: value || undefined,
      minDate: linkedStartDate || minDate || 'today',
      maxDate: maxDate || undefined,
      disableMobile: true,   // ✅ ← これでスマホ標準カレンダーを完全にOFF！
      onChange: (selectedDates) => {
        if (selectedDates.length > 0) {
          onChange(formatDateJST(selectedDates[0]))
        }
      },
    })

    return () => {
      fp.destroy()
    }
  }, [value, minDate, maxDate, linkedStartDate])

  return (
    <div style={{ marginBottom: '14px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '6px',
          color: '#333',
          textAlign: 'left',
        }}
      >
        {label}
      </label>

      {/* ✅ Flatpickr専用（スマホ標準カレンダーを封印） */}
      <input
        ref={inputRef}
        type="text"            // ← dateではなくtext
        inputMode="none"       // ← モバイルキーボードを出さない
        autoComplete="off"     // ← キャッシュの候補を表示させない
        defaultValue={value}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '18px',
          border: '2px solid #999',
          borderRadius: '8px',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
