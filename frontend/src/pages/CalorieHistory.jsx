import { useState, useEffect } from 'react'
import { getCalorieHistory } from '../services/calorieService'
import { getCurrentPlans } from '../services/planService'
import LoadingSpinner from '../components/LoadingSpinner'

export default function CalorieHistory() {
  const [history, setHistory] = useState([])
  const [dietPlan, setDietPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [days, setDays] = useState(30)

  useEffect(() => {
    loadData()
  }, [days])

  const loadData = async () => {
    try {
      setLoading(true)
      const [historyData, plansData] = await Promise.all([
        getCalorieHistory(days),
        getCurrentPlans()
      ])
      setHistory(historyData.data || [])
      setDietPlan(plansData.data?.dietPlan || null)
    } catch (err) {
      console.error('Errore caricamento:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Oggi'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ieri'
    } else {
      return date.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      })
    }
  }

  const getCalorieStatus = (totale) => {
    if (!dietPlan?.calorie_target) return 'text-gray-900'
    const diff = totale - dietPlan.calorie_target
    const percentDiff = Math.abs(diff) / dietPlan.calorie_target * 100

    if (percentDiff <= 5) return 'text-green-600'
    if (diff > 0) return 'text-red-600'
    return 'text-orange-600'
  }

  const getTotalStats = () => {
    const total = history.reduce((sum, day) => sum + day.calorie_totali, 0)
    const avg = history.length > 0 ? Math.round(total / history.length) : 0
    const target = dietPlan?.calorie_target || 0
    const avgDiff = avg - target

    return { total, avg, avgDiff }
  }

  if (loading) return <LoadingSpinner />

  const stats = getTotalStats()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🍽️ Storico Calorie</h1>
        <p className="text-gray-500 mt-1">Traccia le tue calorie giornaliere</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Media Giornaliera</p>
          <p className="text-2xl font-bold text-gray-900">{stats.avg} kcal</p>
          {dietPlan?.calorie_target && (
            <p className={`text-sm ${stats.avgDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.avgDiff > 0 ? '+' : ''}{stats.avgDiff} kcal vs target
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Target Giornaliero</p>
          <p className="text-2xl font-bold text-blue-600">
            {dietPlan?.calorie_target || '-'} kcal
          </p>
          <p className="text-sm text-gray-500">Dal piano dieta</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Giorni Tracciati</p>
          <p className="text-2xl font-bold text-gray-900">{history.length}</p>
          <p className="text-sm text-gray-500">Ultimi {days} giorni</p>
        </div>
      </div>

      {/* Filtro giorni */}
      <div className="mb-4 flex gap-2">
        {[7, 14, 30, 60, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              days === d
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {d} giorni
          </button>
        ))}
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {history.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Nessuna caloria tracciata negli ultimi {days} giorni</p>
            <p className="text-sm text-gray-400 mt-2">Inizia a tracciare le tue calorie dalla dashboard</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calorie Totali
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dettagli
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((day) => {
                const isExpanded = expandedRows.has(day.id)
                const hasDetails = day.has_meal_breakdown

                return (
                  <>
                    {/* Riga principale */}
                    <tr
                      key={day.id}
                      onClick={() => hasDetails && toggleRow(day.id)}
                      className={`${
                        hasDetails ? 'cursor-pointer hover:bg-gray-50' : ''
                      } transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {hasDetails && (
                            <span className="mr-2 text-gray-400">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(day.data)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(day.data).toLocaleDateString('it-IT')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-lg font-semibold ${getCalorieStatus(day.calorie_totali)}`}>
                          {day.calorie_totali} kcal
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {hasDetails ? (
                          <span className="text-xs text-blue-600 font-medium">
                            Clicca per dettagli
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>

                    {/* Riga espansa con dettagli pasti */}
                    {isExpanded && hasDetails && (
                      <tr key={`${day.id}-details`} className="bg-gray-50">
                        <td colSpan="3" className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {day.colazione > 0 && (
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">☕ Colazione</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {day.colazione} kcal
                                </p>
                                <p className="text-xs text-gray-500">
                                  {Math.round((day.colazione / day.calorie_totali) * 100)}% del totale
                                </p>
                              </div>
                            )}

                            {day.pranzo > 0 && (
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">🍽️ Pranzo</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {day.pranzo} kcal
                                </p>
                                <p className="text-xs text-gray-500">
                                  {Math.round((day.pranzo / day.calorie_totali) * 100)}% del totale
                                </p>
                              </div>
                            )}

                            {day.cena > 0 && (
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">🌙 Cena</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {day.cena} kcal
                                </p>
                                <p className="text-xs text-gray-500">
                                  {Math.round((day.cena / day.calorie_totali) * 100)}% del totale
                                </p>
                              </div>
                            )}

                            {day.spuntini > 0 && (
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">🍎 Spuntini</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {day.spuntini} kcal
                                </p>
                                <p className="text-xs text-gray-500">
                                  {Math.round((day.spuntini / day.calorie_totali) * 100)}% del totale
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Macros se disponibili */}
                          {(day.proteine || day.carboidrati || day.grassi) && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-2">Macronutrienti</p>
                              <div className="grid grid-cols-3 gap-3">
                                {day.proteine > 0 && (
                                  <div className="text-center">
                                    <p className="text-sm text-blue-600 font-medium">{day.proteine}g</p>
                                    <p className="text-xs text-gray-500">Proteine</p>
                                  </div>
                                )}
                                {day.carboidrati > 0 && (
                                  <div className="text-center">
                                    <p className="text-sm text-green-600 font-medium">{day.carboidrati}g</p>
                                    <p className="text-xs text-gray-500">Carboidrati</p>
                                  </div>
                                )}
                                {day.grassi > 0 && (
                                  <div className="text-center">
                                    <p className="text-sm text-yellow-600 font-medium">{day.grassi}g</p>
                                    <p className="text-xs text-gray-500">Grassi</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
