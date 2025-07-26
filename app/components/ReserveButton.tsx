'use client'

type Props = {
  onClick: () => void
}

export default function ReserveButton({ onClick }: Props) {
  return (
    <div className="mt-6 w-full flex justify-center">
      <button
        onClick={onClick}
        className="w-[95%] h-[80px] text-[28px] rounded-full font-bold 
                   bg-blue-600 text-white shadow-2xl hover:bg-blue-700 
                   transition-transform transform hover:scale-105 !important"
        style={{
          minHeight: '80px',
          fontSize: '28px',
          padding: '20px 0',
        }}
      >
        🚆 この車を予約する
      </button>
    </div>
  )
}

