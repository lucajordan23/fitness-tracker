import { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
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

  const calorieData = measurements
    .filter(m => m.calorie_consumate)
    .map(m => ({
      date: format(parseISO(m.data_misurazione), 'dd/MM'),
      consumate: m.calorie_consumate,
      target: dietPlan?.calorie_target || 0,
      delta: m.calorie_consumate - (dietPlan?.calorie_target || 0),
      fullDate: m.data_misurazione
    }))
    .reverse()

  const macroData = measurements
    .filter(m => m.proteine_consumate || m.carboidrati_consumati || m.grassi_consumati)
    .map(m => ({
      date: format(parseISO(m.data_misurazione), 'dd/MM'),
      proteine: m.proteine_consumate || 0,
      carboidrati: m.carboidrati_consumati || 0,
      grassi: m.grassi_consumati || 0,
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
            />
          </LineChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'calories',
      title: '🔥 Trend Calorie',
      description: 'Calorie consumate vs target',
      hasData: calorieData.length > 0,
      component: (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={calorieData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ value: 'kcal', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px'
              }}
              formatter={(value, name) => {
                if (name === 'consumate') return [`${value} kcal`, 'Consumate']
                if (name === 'target') return [`${value} kcal`, 'Target']
                return [value, name]
              }}
            />
            <Legend />
            {dietPlan?.calorie_target && (
              <ReferenceLine
                y={dietPlan.calorie_target}
                stroke="#10b981"
                strokeDasharray="5 5"
                label={{ value: 'Target', position: 'right', fill: '#10b981' }}
              />
            )}
            <Line
              type="monotone"
              dataKey="consumate"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: '#f59e0b', r: 4 }}
              name="Consumate"
            />
          </LineChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'macros',
      title: '🍽️ Trend Macronutrienti',
      description: 'Distribuzione proteine, carboidrati, grassi',
      hasData: macroData.length > 0,
      component: (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={macroData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ value: 'grammi', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px'
              }}
              formatter={(value, name) => {
                const labels = {
                  proteine: 'Proteine',
                  carboidrati: 'Carboidrati',
                  grassi: 'Grassi'
                }
                return [`${value}g`, labels[name] || name]
              }}
            />
            <Legend />
            <Bar dataKey="proteine" fill="#3b82f6" name="Proteine" />
            <Bar dataKey="carboidrati" fill="#10b981" name="Carboidrati" />
            <Bar dataKey="grassi" fill="#f59e0b" name="Grassi" />
          </BarChart>
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
              Inizia a tracciare {activeChart.id === 'weight' ? 'il peso' : activeChart.id === 'calories' ? 'le calorie' : 'i macronutrienti'}
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

          {activeChart.id === 'calories' && calorieData.length > 0 && (
            <>
              <div className="text-center">
                <p className="text-xs text-gray-500">Media Giornaliera</p>
                <p className="text-lg font-bold text-gray-900">
                  {Math.round(calorieData.reduce((sum, d) => sum + d.consumate, 0) / calorieData.length)} kcal
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Target</p>
                <p className="text-lg font-bold text-green-600">
                  {dietPlan?.calorie_target || '-'} kcal
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Aderenza 7gg</p>
                <p className="text-lg font-bold text-blue-600">
                  {calorieData.length >= 7 && dietPlan?.calorie_target
                    ? Math.round((calorieData.slice(-7).reduce((sum, d) => sum + d.consumate, 0) / 7 / dietPlan.calorie_target) * 100)
                    : '-'}%
                </p>
              </div>
            </>
          )}

          {activeChart.id === 'macros' && macroData.length > 0 && (
            <>
              <div className="text-center">
                <p className="text-xs text-gray-500">Media Proteine</p>
                <p className="text-lg font-bold text-blue-600">
                  {Math.round(macroData.reduce((sum, d) => sum + d.proteine, 0) / macroData.length)}g
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Media Carboidrati</p>
                <p className="text-lg font-bold text-green-600">
                  {Math.round(macroData.reduce((sum, d) => sum + d.carboidrati, 0) / macroData.length)}g
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Media Grassi</p>
                <p className="text-lg font-bold text-yellow-600">
                  {Math.round(macroData.reduce((sum, d) => sum + d.grassi, 0) / macroData.length)}g
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
