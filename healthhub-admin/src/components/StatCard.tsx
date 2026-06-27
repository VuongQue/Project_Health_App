export default function StatCard({ title, value }: any) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    );
  }
  