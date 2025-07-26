// components/DatePicker.tsx
type Props = {
  label: string;
  value: string;
  onChange: (date: string) => void;
};

export default function DatePicker({ label, value, onChange }: Props) {
  return (
    <div>
      <label className="block text-base mb-2 font-semibold text-gray-700">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
}
