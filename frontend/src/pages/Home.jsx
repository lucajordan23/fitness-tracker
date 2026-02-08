import { useState, useEffect } from 'react'
import { getMeasurementStats, getMeasurements } from '../services/measurementService'
import { getCurrentPlans } from '../services/planService'
import { getTrendAnalysis } from '../services/analysisService'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import TrendChartsCarousel from '../components/TrendChartsCarousel'
import RecommendationPanel from '../components/RecommendationPanel'
import QuickCalorieEntry from '../components/QuickCalorieEntry'
import { formatWeight, formatPercent, formatKcal } from '../utils/formatters'

export default function Home({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [plans, setPlans] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, plansData, analysisData, measurementsData] = await Promise.all([
        getMeasurementStats(30),
        getCurrentPlans(),
        getTrendAnalysis(14).catch(() => null),  // Non bloccare se fallisce
        getMeasurements({ limit: 30 }).catch(() => ({ data: [] }))
      ])
      setStats(statsData.data)
      setPlans(plansData.data)
      setAnalysis(analysisData?.data || null)
      setMeasurements(measurementsData.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div className="p-8"><ErrorMessage message={error} /></div>

  const latest = stats?.latest
  const deltas = stats?.deltas || {}
  const dietPlan = plans?.dietPlan

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏋️ FITNESS TRACKER</h1>
        <p className="text-gray-500 mt-1">Dashboard Personale</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Peso Corrente"
          value={latest?.peso || 0}
          delta={deltas.peso}
          unit="kg"
          icon="⚖️"
        />
        <StatCard
          title="Body Fat %"
          value={latest?.body_fat_percent || 0}
          delta={deltas.body_fat_percent}
          unit="%"
          icon="📊"
        />
        <StatCard
          title="BMR"
          value={latest?.bmr || 0}
          delta={deltas.bmr}
          unit="kcal"
          icon="🔥"
        />
      </div>

      {/* Trend Charts Carousel */}
      <div className="mb-8">
        <TrendChartsCarousel measurements={measurements} dietPlan={dietPlan} />
      </div>

      {/* Recommendation Panel */}
      <div className="mb-8">
        <RecommendationPanel
          analysis={analysis}
          currentPlan={dietPlan}
          onPlanUpdated={loadData}
        />
      </div>

      {/* Quick Calorie Entry */}
      <div className="mb-8">
        <QuickCalorieEntry dietPlan={dietPlan} />
      </div>

      {/* Piano Dieta Corrente */}
      {dietPlan ? (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900">📋 Piano Dieta Attivo</h2>
            {dietPlan.tdee_adaptive_enabled && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                🔥 TDEE Adattivo Attivo
              </span>
            )}
          </div>

          {/* SEZIONE TDEE ADATTIVO */}
          <div className="md:col-span-2 bg-gray-50 p-4 rounded mb-4">
            <p className="text-sm text-gray-500 mb-2">Metabolismo Giornaliero (TDEE)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">TDEE Stimato Iniziale</p>
                <p className="text-lg font-semibold">{dietPlan.tdee_stimato} kcal</p>
              </div>

              {dietPlan.tdee_adaptive_enabled && dietPlan.tdee_adaptive && (
                <div className="border-l-2 border-green-400 pl-4">
                  <p className="text-xs text-green-600 font-medium">TDEE Adattivo (Dai Dati Reali)</p>
                  <p className="text-lg font-semibold text-green-700">
                    {dietPlan.tdee_adaptive} kcal
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((dietPlan.tdee_adaptive - dietPlan.tdee_stimato) / dietPlan.tdee_stimato * 100).toFixed(1)}%
                    {dietPlan.tdee_adaptive > dietPlan.tdee_stimato ? ' sopra' : ' sotto'} stima iniziale
                  </p>
                </div>
              )}
            </div>

            {!dietPlan.tdee_adaptive_enabled && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ TDEE adattivo non ancora attivo. Traccia calorie consumate per almeno 10-14 giorni.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Obiettivo</p>
              <p className="text-lg font-semibold capitalize">{dietPlan.obiettivo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Calorie Target</p>
              <p className="text-lg font-semibold">{dietPlan.calorie_target} kcal/giorno</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500 mb-2">Macronutrienti</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-blue-600 font-medium">Proteine</p>
                  <p className="text-xl font-bold text-blue-700">{dietPlan.proteine_g}g</p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-xs text-green-600 font-medium">Carboidrati</p>
                  <p className="text-xl font-bold text-green-700">{dietPlan.carboidrati_g}g</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <p className="text-xs text-yellow-600 font-medium">Grassi</p>
                  <p className="text-xl font-bold text-yellow-700">{dietPlan.grassi_g}g</p>
                </div>
              </div>
            </div>
            {dietPlan.strategia && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Strategia</p>
                <p className="text-sm text-gray-700 mt-1">{dietPlan.strategia}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigate('plans')}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Modifica Piano →
          </button>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <p className="text-yellow-800 font-medium">⚠️ Nessun piano dieta attivo</p>
          <button
            onClick={() => onNavigate('plans')}
            className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Genera Piano Adesso
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('new-measurement')}
          className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 font-medium"
        >
          + Nuova Misurazione
        </button>
        <button
          onClick={() => onNavigate('measurements')}
          className="bg-gray-100 text-gray-700 px-6 py-4 rounded-lg hover:bg-gray-200 font-medium"
        >
          📊 Vedi Storico
        </button>
        <button
          onClick={() => onNavigate('plans')}
          className="bg-gray-100 text-gray-700 px-6 py-4 rounded-lg hover:bg-gray-200 font-medium"
        >
          📋 Gestisci Piani
        </button>
      </div>
    </div>
  )
}
