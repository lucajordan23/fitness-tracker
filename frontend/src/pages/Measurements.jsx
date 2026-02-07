import { useState, useEffect } from 'react'
import { getMeasurements, deleteMeasurement } from '../services/measurementService'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDate, formatWeight, formatPercent } from '../utils/formatters'

export default function Measurements({ onNavigate }) {
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMeasurements()
  }, [])

  const loadMeasurements = async () => {
    try {
      const data = await getMeasurements({ limit: 50 })
      setMeasurements(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, date) => {
    if (!window.confirm(`Vuoi eliminare la misurazione del ${formatDate(date)}?`)) {
      return
    }

    try {
      await deleteMeasurement(id)
      setMeasurements(measurements.filter(m => m.id !== id))
      alert('✅ Misurazione eliminata')
    } catch (err) {
      alert('❌ Errore durante l\'eliminazione: ' + err.message)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 Storico Misurazioni</h1>
        <button
          onClick={() => onNavigate('new-measurement')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nuova
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Body Fat %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Massa Magra</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">BMR</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {measurements.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(m.data_misurazione)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatWeight(m.peso)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPercent(m.body_fat_percent)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatWeight(m.massa_magra)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {m.bmr} kcal
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleDelete(m.id, m.data_misurazione)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    🗑️ Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {measurements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nessuna misurazione trovata
          </div>
        )}
      </div>
    </div>
  )
}
