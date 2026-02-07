import { useState } from 'react'
import { createMeasurement } from '../services/measurementService'

export default function NewMeasurement({ onNavigate }) {
  const [formData, setFormData] = useState({
    peso: '',
    body_fat_percent: '',
    massa_magra: '',
    bmr: '',
    grasso_viscerale: '',
    note: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await createMeasurement({
        ...formData,
        peso: parseFloat(formData.peso),
        body_fat_percent: parseFloat(formData.body_fat_percent),
        massa_magra: parseFloat(formData.massa_magra),
        bmr: parseInt(formData.bmr),
        grasso_viscerale: formData.grasso_viscerale ? parseInt(formData.grasso_viscerale) : null
      })
      alert('✅ Misurazione salvata con successo!')
      onNavigate('home')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📏 Nuova Misurazione</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Dati Essenziali */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dati dalla Bilancia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.peso}
                onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body Fat % *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.body_fat_percent}
                onChange={(e) => setFormData({ ...formData, body_fat_percent: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Massa Magra (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.massa_magra}
                onChange={(e) => setFormData({ ...formData, massa_magra: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BMR (kcal/giorno) *
              </label>
              <input
                type="number"
                required
                value={formData.bmr}
                onChange={(e) => setFormData({ ...formData, bmr: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Dati Opzionali */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dati Aggiuntivi (Opzionali)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grasso Viscerale (livello 1-59)
              </label>
              <input
                type="number"
                value={formData.grasso_viscerale}
                onChange={(e) => setFormData({ ...formData, grasso_viscerale: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note
          </label>
          <textarea
            rows="3"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Es: Allenamento intenso ieri..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Salvataggio...' : '💾 Salva e Analizza'}
          </button>
        </div>
      </form>
    </div>
  )
}
