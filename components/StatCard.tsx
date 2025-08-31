type Props = {
  label: string;
  value: string | number;
  note?: string;
};
export default function StatCard({ label, value, note }: Props) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {note ? <div className="mt-1 text-xs text-gray-500">{note}</div> : null}
    </div>
  );
}
