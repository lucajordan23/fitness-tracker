export default function StatCard({ title, value, delta, unit = '', icon = '' }) {
  const deltaColor = delta > 0
    ? 'text-green-600 bg-green-50'
    : delta < 0
    ? 'text-red-600 bg-red-50'
    : 'text-gray-500 bg-gray-50'

  const deltaIcon = delta > 0 ? '▲' : delta < 0 ? '▼' : '−'

  // Gradient background based on value type
  const getGradient = () => {
    if (title.includes('Peso')) return 'from-blue-50 to-white'
    if (title.includes('Grassa')) return 'from-red-50 to-white'
    if (title.includes('Magra')) return 'from-green-50 to-white'
    if (title.includes('Fat')) return 'from-orange-50 to-white'
    return 'from-gray-50 to-white'
  }

  return (
    <div className={`group relative bg-gradient-to-br ${getGradient()} rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer animate-fade-in overflow-hidden`}>
      {/* Subtle shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

      {/* Content */}
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</span>
          {icon && (
            <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
              {icon}
            </span>
          )}
        </div>

        <div className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
          {value}
          <span className="text-2xl ml-1 text-gray-500 font-medium">{unit}</span>
        </div>

        {delta !== undefined && delta !== 0 && (
          <div className="flex items-center gap-2 mt-3">
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${deltaColor} transition-all duration-300`}>
              <span className="text-lg">{deltaIcon}</span>
              <span>{Math.abs(delta).toFixed(1)} {unit}</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">vs ultima sett.</span>
          </div>
        )}
      </div>
    </div>
  )
}
