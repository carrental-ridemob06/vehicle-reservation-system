// components/NightsDisplay.tsx
type Props = {
  nights: number;
};

export default function NightsDisplay({ nights }: Props) {
  return (
    <div className="text-base text-gray-700">
      泊数: <strong className="text-blue-700">{nights}</strong> 泊
    </div>
  );
}
