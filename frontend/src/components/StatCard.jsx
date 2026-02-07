export default function StatCard({ title, value, delta, unit = '', icon = '' }) {
  const deltaColor = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-500'
  const deltaIcon = delta > 0 ? '▲' : delta < 0 ? '▼' : '−'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="text-3xl font-bold text-gray-900">
        {value} {unit}
      </div>
      {delta !== undefined && delta !== 0 && (
        <div className={`text-sm mt-2 ${deltaColor}`}>
          {deltaIcon} {Math.abs(delta).toFixed(1)} {unit}
        </div>
      )}
    </div>
  )
}
