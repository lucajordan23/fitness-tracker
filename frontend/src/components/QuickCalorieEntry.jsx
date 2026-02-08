import { useState, useEffect } from 'react'
import { getTodayCalories, updateDailyCalories } from '../services/calorieService'

export default function QuickCalorieEntry({ dietPlan }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [calories, setCalories] = useState({
    colazione: '',
    pranzo: '',
    cena: '',
    spuntini: ''
  })

  // Carica calorie di oggi
  useEffect(() => {
    loadTodayCalories()
  }, [])

  const loadTodayCalories = async () => {
    try {
      setLoading(true)
      const result = await getTodayCalories()
      if (result.success && result.data) {
        setCalories({
          colazione: result.data.colazione || '',
          pranzo: result.data.pranzo || '',
          cena: result.data.cena || '',
          spuntini: result.data.spuntini || ''
        })
      }
    } catch (err) {
      console.error('Errore caricamento calorie:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)

      const result = await updateDailyCalories({
        data: new Date().toISOString(),
        colazione: calories.colazione ? parseInt(calories.colazione) : null,
        pranzo: calories.pranzo ? parseInt(calories.pranzo) : null,
        cena: calories.cena ? parseInt(calories.cena) : null,
        spuntini: calories.spuntini ? parseInt(calories.spuntini) : null
      })

      if (result.success) {
        alert(`✅ ${result.message}`)
      }
    } catch (err) {
      console.error('Errore salvataggio:', err)
      alert('❌ Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const getTotale = () => {
    return (parseInt(calories.colazione) || 0) +
           (parseInt(calories.pranzo) || 0) +
           (parseInt(calories.cena) || 0) +
           (parseInt(calories.spuntini) || 0)
  }

  const getProgress = () => {
    if (!dietPlan?.calorie_target) return 0
    return Math.round((getTotale() / dietPlan.calorie_target) * 100)
  }

  const totale = getTotale()
  const progress = getProgress()
  const target = dietPlan?.calorie_target || 0
  const remaining = target - totale

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">🍽️ Calorie di Oggi</h2>
        <button
          onClick={loadTodayCalories}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          🔄 Ricarica
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Input pasti */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Colazione
            </label>
            <input
              type="number"
              min="0"
              value={calories.colazione}
              onChange={(e) => setCalories({ ...calories, colazione: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="kcal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pranzo
            </label>
            <input
              type="number"
              min="0"
              value={calories.pranzo}
              onChange={(e) => setCalories({ ...calories, pranzo: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="kcal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cena
            </label>
            <input
              type="number"
              min="0"
              value={calories.cena}
              onChange={(e) => setCalories({ ...calories, cena: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="kcal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spuntini
            </label>
            <input
              type="number"
              min="0"
              value={calories.spuntini}
              onChange={(e) => setCalories({ ...calories, spuntini: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="kcal"
            />
          </div>
        </div>

        {/* Totale e Progress */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Totale Giornaliero</span>
            <span className="text-2xl font-bold text-gray-900">{totale} kcal</span>
          </div>

          {target > 0 && (
            <>
              {/* Progress bar */}
              <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                    progress > 100 ? 'bg-red-500' :
                    progress >= 90 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex justify-between text-xs text-gray-600">
                <span>Target: {target} kcal</span>
                <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {remaining >= 0 ? `Restano ${remaining}` : `Oltre ${Math.abs(remaining)}`} kcal
                </span>
              </div>
            </>
          )}
        </div>

        {/* Pulsante salva */}
        <button
          type="submit"
          disabled={saving || totale === 0}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Salvataggio...' : '💾 Salva Calorie'}
        </button>
      </form>
    </div>
  )
}
