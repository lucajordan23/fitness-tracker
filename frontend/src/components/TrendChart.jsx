import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatDate } from '../utils/formatters';

// Custom Tooltip con styling migliorato
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 animate-fade-in">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="font-medium">{entry.name}:</span>
            <span className="font-bold">{entry.value.toFixed(1)} {entry.name.includes('%') ? '%' : 'kg'}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrendChart({ measurements, days = 30 }) {
  if (!measurements || measurements.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-4">📈 Trend Ultimi {days} Giorni</h3>
        <p className="text-gray-500">Nessun dato disponibile. Inserisci almeno 2 misurazioni per visualizzare i trend.</p>
      </div>
    );
  }

  // Prepara dati per Recharts (ordina ASC = dal più vecchio al più recente)
  const chartData = measurements
    .slice(0, days)
    .reverse()
    .map(m => ({
      data: formatDate(new Date(m.data_misurazione)),
      peso: m.peso,
      massaMagra: m.massa_magra,
      massaGrassa: m.massa_grassa,
      bodyFat: m.body_fat_percent
    }));

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-lg p-6 border border-blue-100 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">📈</span>
          Trend Ultimi {days} Giorni
        </h3>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {measurements.length} misurazioni
        </span>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData}>
          <defs>
            {/* Gradiente Peso (Blu) */}
            <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>

            {/* Gradiente Massa Magra (Verde) */}
            <linearGradient id="colorMM" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>

            {/* Gradiente Massa Grassa (Rosso) */}
            <linearGradient id="colorMG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />

          <XAxis
            dataKey="data"
            style={{ fontSize: '11px', fontWeight: '500' }}
            angle={-45}
            textAnchor="end"
            height={80}
            stroke="#6b7280"
          />

          <YAxis
            style={{ fontSize: '12px', fontWeight: '500' }}
            stroke="#6b7280"
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5 5' }} />

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />

          {/* Area Peso con gradiente */}
          <Area
            type="monotone"
            dataKey="peso"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#colorPeso)"
            name="Peso (kg)"
            animationDuration={1500}
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />

          {/* Area Massa Magra con gradiente */}
          <Area
            type="monotone"
            dataKey="massaMagra"
            stroke="#10b981"
            strokeWidth={3}
            fill="url(#colorMM)"
            name="Massa Magra (kg)"
            animationDuration={1500}
            animationBegin={200}
            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />

          {/* Area Massa Grassa con gradiente */}
          <Area
            type="monotone"
            dataKey="massaGrassa"
            stroke="#ef4444"
            strokeWidth={3}
            fill="url(#colorMG)"
            name="Massa Grassa (kg)"
            animationDuration={1500}
            animationBegin={400}
            dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
