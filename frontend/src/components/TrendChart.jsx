import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatDate } from '../utils/formatters';

export default function TrendChart({ measurements, days = 30 }) {
  if (!measurements || measurements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
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
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        📈 Trend Ultimi {days} Giorni ({measurements.length} misurazioni)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="data"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis style={{ fontSize: '12px' }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="peso"
            stroke="#3b82f6"
            name="Peso (kg)"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="massaMagra"
            stroke="#10b981"
            name="Massa Magra (kg)"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="massaGrassa"
            stroke="#ef4444"
            name="Massa Grassa (kg)"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
