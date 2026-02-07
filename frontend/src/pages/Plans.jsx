import { useState } from 'react'
import { createDietPlan } from '../services/planService'

export default function Plans({ onNavigate }) {
  const [formData, setFormData] = useState({
    obiettivo: 'ricomposizione',
    activity_level: 'moderato',
    intensita_deficit: 'moderato',
    use_custom_workouts: false,
    workouts_per_week: 4,
    workout_calories_per_session: null
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      // Prepara dati da inviare
      const submitData = {
        obiettivo: formData.obiettivo,
        intensita_deficit: formData.intensita_deficit
      }

      // Se usa custom workouts, invia workout data invece di activity_level
      if (formData.use_custom_workouts) {
        submitData.workouts_per_week = parseInt(formData.workouts_per_week)
        if (formData.workout_calories_per_session && formData.workout_calories_per_session > 0) {
          submitData.workout_calories_per_session = parseInt(formData.workout_calories_per_session)
        }
      } else {
        submitData.activity_level = formData.activity_level
      }

      const data = await createDietPlan(submitData)
      setResult(data.data)
      alert('✅ Piano dieta generato con successo!')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 Genera Nuovo Piano Dieta</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Parametri</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Obiettivo
              </label>
              <select
                value={formData.obiettivo}
                onChange={(e) => setFormData({ ...formData, obiettivo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cutting">Cutting (Perdita Grasso)</option>
                <option value="bulking">Bulking (Aumento Massa)</option>
                <option value="ricomposizione">Ricomposizione</option>
                <option value="mantenimento">Mantenimento</option>
              </select>
            </div>

            {/* Toggle: Activity Level vs Custom Workouts */}
            <div className="border-t border-b py-3 my-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.use_custom_workouts}
                  onChange={(e) => setFormData({ ...formData, use_custom_workouts: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  🎯 Usa numero allenamenti personalizzato (più preciso)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Attiva per inserire il numero esatto di allenamenti a settimana invece delle categorie predefinite
              </p>
            </div>

            {/* Standard Activity Level */}
            {!formData.use_custom_workouts && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Livello Attività
                </label>
                <select
                  value={formData.activity_level}
                  onChange={(e) => setFormData({ ...formData, activity_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="sedentario">Sedentario (0-1 allenamenti/sett)</option>
                  <option value="leggero">Leggero (2-3 allenamenti/sett)</option>
                  <option value="moderato">Moderato (4-5 allenamenti/sett)</option>
                  <option value="attivo">Attivo (6-7 allenamenti/sett)</option>
                </select>
              </div>
            )}

            {/* Custom Workouts */}
            {formData.use_custom_workouts && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allenamenti a Settimana
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={formData.workouts_per_week}
                    onChange={(e) => setFormData({ ...formData, workouts_per_week: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Numero esatto di allenamenti a settimana (0-7)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calorie per Allenamento (Opzionale)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="es: 450"
                    value={formData.workout_calories_per_session || ''}
                    onChange={(e) => setFormData({ ...formData, workout_calories_per_session: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ⌚ Se hai uno smartwatch, inserisci le calorie medie bruciate per allenamento. Se lasci vuoto, verrà usata una stima.
                  </p>
                </div>
              </>
            )}

            {(formData.obiettivo === 'cutting' || formData.obiettivo === 'bulking') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intensità {formData.obiettivo === 'cutting' ? 'Deficit' : 'Surplus'}
                </label>
                <select
                  value={formData.intensita_deficit}
                  onChange={(e) => setFormData({ ...formData, intensita_deficit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="leggero">Leggero</option>
                  <option value="moderato">Moderato</option>
                  <option value="aggressivo">Aggressivo</option>
                </select>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              {loading ? 'Generazione...' : '🔥 Genera Piano Automaticamente'}
            </button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">✅ Piano Generato</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">BMR Base</p>
                <p className="text-2xl font-bold text-gray-900">{result.bmr_base} kcal/giorno</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">TDEE Stimato</p>
                <p className="text-2xl font-bold text-gray-900">{result.tdee_stimato} kcal/giorno</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Calorie Target</p>
                <p className="text-3xl font-bold text-blue-600">{result.calorie_target} kcal/giorno</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-3">Macronutrienti</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-600 font-medium">Proteine</span>
                    <span className="font-bold">{result.proteine_g}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 font-medium">Carboidrati</span>
                    <span className="font-bold">{result.carboidrati_g}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-600 font-medium">Grassi</span>
                    <span className="font-bold">{result.grassi_g}g</span>
                  </div>
                </div>
              </div>
              {result.strategia && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">Strategia</p>
                  <p className="text-sm text-gray-700 mt-1">{result.strategia}</p>
                </div>
              )}
              {result.workouts_per_week !== undefined && result.workouts_per_week !== null && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">Metodo Calcolo</p>
                  <p className="text-sm text-gray-700 mt-1">
                    🎯 Personalizzato: {result.workouts_per_week} allenamenti/settimana
                    {result.workout_calories_per_session && (
                      <span className="block mt-1">
                        ⌚ {result.workout_calories_per_session} kcal per allenamento (da smartwatch)
                      </span>
                    )}
                  </p>
                </div>
              )}
              <button
                onClick={() => onNavigate('home')}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                ✓ Vai alla Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
