import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { format, parseISO } from 'date-fns'

export default function TrendChartsCarousel({ measurements, dietPlan }) {
  const [currentChart, setCurrentChart] = useState(0)

  // Prepara dati per grafici
  const weightData = measurements
    .map(m => ({
      date: format(parseISO(m.data_misurazione), 'dd/MM'),
      peso: m.peso,
      fullDate: m.data_misurazione
    }))
    .reverse()

  const leanMassData = measurements
    .filter(m => m.massa_magra)
    .map(m => ({
      date: format(parseISO(m.data_misurazione), 'dd/MM'),
      massaMagra: m.massa_magra,
      fullDate: m.data_misurazione
    }))
    .reverse()

  const fatMassData = measurements
    .filter(m => m.massa_grassa)
    .map(m => ({
      date: format(parseISO(m.data_misurazione), 'dd/MM'),
      massaGrassa: m.massa_grassa,
      bodyFat: m.body_fat_percent,
      fullDate: m.data_misurazione
    }))
    .reverse()

  const charts = [
    {
      id: 'weight',
      title: '⚖️ Trend Peso',
      description: 'Evoluzione peso corporeo',
      hasData: weightData.length > 0,
      component: (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weightData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis
              domain={['dataMin - 1', 'dataMax + 1']}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ value: 'kg', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px'
              }}
              formatter={(value) => [`${value} kg`, 'Peso']}
            />
            <Line
              type="monotone"
              dataKey="peso"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Peso"
            />
          </LineChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'lean-mass',
      title: '💪 Trend Massa Magra',
      description: 'Evoluzione massa magra (FFM)',
      hasData: leanMassData.length > 0,
      component: (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={leanMassData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis
              domain={['dataMin - 1', 'dataMax + 1']}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ value: 'kg', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px'
              }}
              formatter={(value) => [`${value} kg`, 'Massa Magra']}
            />
            <Line
              type="monotone"
              dataKey="massaMagra"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Massa Magra"
            />
          </LineChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'fat-mass',
      title: '📉 Trend Massa Grassa',
      description: 'Evoluzione massa grassa e body fat %',
      hasData: fatMassData.length > 0,
      component: (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={fatMassData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis
              yAxisId="left"
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ value: 'kg', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={['dataMin - 1', 'dataMax + 1']}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ value: '%', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px'
              }}
              formatter={(value, name) => {
                if (name === 'massaGrassa') return [`${value} kg`, 'Massa Grassa']
                if (name === 'bodyFat') return [`${value}%`, 'Body Fat %']
                return [value, name]
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="massaGrassa"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
              name="Massa Grassa (kg)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bodyFat"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#f97316', r: 3 }}
              name="Body Fat %"
            />
          </LineChart>
        </ResponsiveContainer>
      )
    }
  ]

  const activeChart = charts[currentChart]

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header con navigazione */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{activeChart.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{activeChart.description}</p>
        </div>

        {/* Indicatori grafici */}
        <div className="flex items-center gap-2">
          {charts.map((chart, idx) => (
            <button
              key={chart.id}
              onClick={() => setCurrentChart(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentChart
                  ? 'bg-blue-600 w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              title={chart.title}
            />
          ))}
        </div>
      </div>

      {/* Grafico */}
      {activeChart.hasData ? (
        <div className="mb-4">
          {activeChart.component}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg mb-4">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-2">📊</p>
            <p className="text-gray-600 font-medium">Dati insufficienti</p>
            <p className="text-gray-500 text-sm">
              Inizia a tracciare {activeChart.id === 'weight' ? 'il peso' : activeChart.id === 'lean-mass' ? 'la massa magra' : 'la massa grassa'}
            </p>
          </div>
        </div>
      )}

      {/* Controlli navigazione */}
      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={() => setCurrentChart(Math.max(0, currentChart - 1))}
          disabled={currentChart === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            currentChart === 0
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          <span>←</span>
          <span className="hidden sm:inline">Precedente</span>
        </button>

        <div className="text-sm text-gray-500">
          {currentChart + 1} di {charts.length}
        </div>

        <button
          onClick={() => setCurrentChart(Math.min(charts.length - 1, currentChart + 1))}
          disabled={currentChart === charts.length - 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            currentChart === charts.length - 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          <span className="hidden sm:inline">Successivo</span>
          <span>→</span>
        </button>
      </div>

      {/* Quick stats sotto il grafico */}
      {activeChart.hasData && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          {activeChart.id === 'weight' && weightData.length > 0 && (
            <>
              <div className="text-center">
                <p className="text-xs text-gray-500">Peso Attuale</p>
                <p className="text-lg font-bold text-gray-900">
                  {weightData[weightData.length - 1]?.peso} kg
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Variazione 7gg</p>
                <p className={`text-lg font-bold ${
                  weightData.length >= 7 &&
                  weightData[weightData.length - 1]?.peso < weightData[weightData.length - 7]?.peso
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {weightData.length >= 7
                    ? (weightData[weightData.length - 1]?.peso - weightData[weightData.length - 7]?.peso).toFixed(1)
                    : '-'} kg
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Media 7gg</p>
                <p className="text-lg font-bold text-gray-900">
                  {weightData.length >= 7
                    ? (weightData.slice(-7).reduce((sum, d) => sum + d.peso, 0) / 7).toFixed(1)
                    : weightData[weightData.length - 1]?.peso || '-'} kg
                </p>
              </div>
            </>
          )}

          {activeChart.id === 'lean-mass' && leanMassData.length > 0 && (
            <>
              <div className="text-center">
                <p className="text-xs text-gray-500">Massa Magra Attuale</p>
                <p className="text-lg font-bold text-green-700">
                  {leanMassData[leanMassData.length - 1]?.massaMagra.toFixed(1)} kg
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Variazione 7gg</p>
                <p className={`text-lg font-bold ${
                  leanMassData.length >= 7 &&
                  leanMassData[leanMassData.length - 1]?.massaMagra > leanMassData[leanMassData.length - 7]?.massaMagra
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {leanMassData.length >= 7
                    ? (leanMassData[leanMassData.length - 1]?.massaMagra - leanMassData[leanMassData.length - 7]?.massaMagra).toFixed(1)
                    : '-'} kg
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Media 7gg</p>
                <p className="text-lg font-bold text-green-700">
                  {leanMassData.length >= 7
                    ? (leanMassData.slice(-7).reduce((sum, d) => sum + d.massaMagra, 0) / 7).toFixed(1)
                    : leanMassData[leanMassData.length - 1]?.massaMagra.toFixed(1) || '-'} kg
                </p>
              </div>
            </>
          )}

          {activeChart.id === 'fat-mass' && fatMassData.length > 0 && (
            <>
              <div className="text-center">
                <p className="text-xs text-gray-500">Massa Grassa Attuale</p>
                <p className="text-lg font-bold text-red-600">
                  {fatMassData[fatMassData.length - 1]?.massaGrassa.toFixed(1)} kg
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Body Fat Attuale</p>
                <p className="text-lg font-bold text-orange-600">
                  {fatMassData[fatMassData.length - 1]?.bodyFat.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Variazione 7gg</p>
                <p className={`text-lg font-bold ${
                  fatMassData.length >= 7 &&
                  fatMassData[fatMassData.length - 1]?.massaGrassa < fatMassData[fatMassData.length - 7]?.massaGrassa
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {fatMassData.length >= 7
                    ? (fatMassData[fatMassData.length - 1]?.massaGrassa - fatMassData[fatMassData.length - 7]?.massaGrassa).toFixed(1)
                    : '-'} kg
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
