'use client'

export default function ReserveButtonDisabled() {
  return (
    <div className="mt-6 w-full flex justify-center">
      <button
        disabled
        className="w-[95%] h-[80px] text-[28px] rounded-full font-bold 
                   bg-gray-400 text-white shadow-2xl cursor-not-allowed !important"
        style={{
          minHeight: '80px',
          fontSize: '28px',
          padding: '20px 0',
        }}
      >
        🔒 ログインしてください
      </button>
    </div>
  )
}
