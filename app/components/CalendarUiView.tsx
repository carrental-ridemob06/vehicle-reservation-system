type Props = {
  vehicleId: string
  startDate: string
  endDate: string
  onVehicleChange: (val: string) => void
  onStartDateChange: (val: string) => void
  onEndDateChange: (val: string) => void
  onSubmit: () => void
  calendarSrc?: string
}

export default function CalendarUiView({
  vehicleId,
  startDate,
  endDate,
  onVehicleChange,
  onStartDateChange,
  onEndDateChange,
  onSubmit,
  calendarSrc = 'https://calendar.google.com/calendar/embed?src=your_calendar_id%40group.calendar.google.com&ctz=Asia%2FTokyo'
}: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-white px-4 pt-6 pb-12 space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">車を予約する</h1>

      <div className="w-full max-w-md aspect-[3/4]">
        <iframe
          src={calendarSrc}
          style={{ border: 0 }}
          className="w-full h-full rounded-lg shadow-md"
          frameBorder="0"
          scrolling="no"
        ></iframe>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <select
          value={vehicleId}
          onChange={(e) => onVehicleChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
        >
          <option value="car01">車両1</option>
          <option value="car02">車両2</option>
          <option value="car03">車両3</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
        />

        <button
          onClick={onSubmit}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          予約を確定する
        </button>
      </div>
    </div>
  )
}