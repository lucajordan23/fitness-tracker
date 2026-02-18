import { useState, useEffect } from 'react'
import { getTodayCalories, updateDailyCalories, getSmartAverage } from '../services/calorieService'

export default function QuickCalorieEntry({ dietPlan }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPresetModal, setShowPresetModal] = useState(null)
  const [calories, setCalories] = useState({
    colazione: '',
    pranzo: '',
    cena: '',
    spuntini: ''
  })

  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('mealPresets')
    return saved ? JSON.parse(saved) : {
      colazione: [],
      pranzo: [],
      cena: []
    }
  })

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

  const handleSmartAverage = async () => {
    try {
      setLoading(true)
      const result = await getSmartAverage(7)

      if (result.success && result.data) {
        setCalories({
          colazione: result.data.colazione || '',
          pranzo: result.data.pranzo || '',
          cena: result.data.cena || '',
          spuntini: result.data.spuntini || ''
        })
        alert('Media 7gg caricata')
      }
    } catch (err) {
      console.error('Errore smart average:', err)
      alert('Errore calcolo media')
    } finally {
      setLoading(false)
    }
  }

  const savePreset = (meal, name, value) => {
    const newPresets = {
      ...presets,
      [meal]: [...presets[meal], { name, value: parseInt(value) }]
    }
    setPresets(newPresets)
    localStorage.setItem('mealPresets', JSON.stringify(newPresets))
    setShowPresetModal(null)
    alert(`Preset salvato`)
  }

  const applyPreset = (meal, value) => {
    setCalories({ ...calories, [meal]: value })
  }

  const deletePreset = (meal, index) => {
    const newPresets = {
      ...presets,
      [meal]: presets[meal].filter((_, i) => i !== index)
    }
    setPresets(newPresets)
    localStorage.setItem('mealPresets', JSON.stringify(newPresets))
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
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <p className="text-sm text-gray-400 text-center">Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">🍽️ Calorie di Oggi</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSmartAverage}
            disabled={loading}
            className="px-3 py-1.5 text-sm text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
          >
            📊 Media 7gg
          </button>
          <button
            onClick={handleSave}
            disabled={saving || totale === 0}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-sm"
          >
            {saving ? 'Salvataggio...' : '💾 Salva'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Circular Progress */}
        <div className="flex items-center justify-center">
          <CircularProgress
            progress={progress}
            current={totale}
            target={target}
            remaining={remaining}
          />
        </div>

        {/* Right: Meals Input */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="space-y-3">
            <MealRow
              label="Colazione"
              value={calories.colazione}
              onChange={(val) => setCalories({ ...calories, colazione: val })}
              presets={presets.colazione}
              onApplyPreset={(val) => applyPreset('colazione', val)}
              onAddPreset={() => setShowPresetModal('colazione')}
              onDeletePreset={(idx) => deletePreset('colazione', idx)}
              color="from-amber-400 to-orange-500"
            />

            <MealRow
              label="Pranzo"
              value={calories.pranzo}
              onChange={(val) => setCalories({ ...calories, pranzo: val })}
              presets={presets.pranzo}
              onApplyPreset={(val) => applyPreset('pranzo', val)}
              onAddPreset={() => setShowPresetModal('pranzo')}
              onDeletePreset={(idx) => deletePreset('pranzo', idx)}
              color="from-green-400 to-emerald-500"
            />

            <MealRow
              label="Cena"
              value={calories.cena}
              onChange={(val) => setCalories({ ...calories, cena: val })}
              presets={presets.cena}
              onApplyPreset={(val) => applyPreset('cena', val)}
              onAddPreset={() => setShowPresetModal('cena')}
              onDeletePreset={(idx) => deletePreset('cena', idx)}
              color="from-blue-400 to-indigo-500"
            />

            <MealRow
              label="Spuntini"
              value={calories.spuntini}
              onChange={(val) => setCalories({ ...calories, spuntini: val })}
              presets={[]}
              onApplyPreset={() => {}}
              onAddPreset={() => {}}
              onDeletePreset={() => {}}
              color="from-pink-400 to-rose-500"
            />
          </form>
        </div>
      </div>

      {/* Preset Modal */}
      {showPresetModal && (
        <PresetModal
          meal={showPresetModal}
          currentValue={calories[showPresetModal]}
          onSave={(name, value) => savePreset(showPresetModal, name, value)}
          onClose={() => setShowPresetModal(null)}
        />
      )}
    </div>
  )
}

// Circular Progress Component
function CircularProgress({ progress, current, target, remaining }) {
  const size = 180
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference

  // Color based on progress
  const getColor = () => {
    if (progress >= 110) return '#ef4444' // red
    if (progress > 100) return '#f97316' // orange
    if (progress >= 90) return '#eab308' // yellow
    return '#10b981' // green
  }

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-gray-900">{current}</div>
        <div className="text-xs text-gray-500">/ {target} kcal</div>
        <div className={`text-sm font-medium mt-1 ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {remaining >= 0 ? `${remaining} rimaste` : `${Math.abs(remaining)} oltre`}
        </div>
        <div className="text-xs text-gray-400 mt-1">{progress}%</div>
      </div>
    </div>
  )
}

// Meal Row with Color
function MealRow({ label, value, onChange, presets, onApplyPreset, onAddPreset, onDeletePreset, color }) {
  const [showPresets, setShowPresets] = useState(false)

  return (
    <div className={`bg-gradient-to-r ${color} bg-opacity-10 rounded-lg p-3 border border-opacity-20`}>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 w-20 shrink-0">{label}</label>

        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0"
        />

        <span className="text-xs text-gray-500 w-10">kcal</span>

        {/* Preset Dropdown */}
        {presets.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
            >
              Preset ▼
            </button>

            {showPresets && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPresets(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
                  <div className="p-2 max-h-56 overflow-y-auto">
                    {presets.map((preset, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded group">
                        <button
                          type="button"
                          onClick={() => {
                            onApplyPreset(preset.value)
                            setShowPresets(false)
                          }}
                          className="flex-1 text-left text-sm"
                        >
                          <span className="font-medium text-gray-900">{preset.name}</span>
                          <span className="text-gray-500 ml-2">{preset.value} kcal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePreset(idx)}
                          className="opacity-0 group-hover:opacity-100 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        onAddPreset()
                        setShowPresets(false)
                      }}
                      className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      + Nuovo preset
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : label !== 'Spuntini' ? (
          <button
            type="button"
            onClick={onAddPreset}
            className="px-3 py-2 text-xs text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
          >
            + Preset
          </button>
        ) : (
          <div className="w-20" />
        )}
      </div>
    </div>
  )
}

// Preset Modal
function PresetModal({ meal, currentValue, onSave, onClose }) {
  const [name, setName] = useState('')
  const [value, setValue] = useState(currentValue || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim() && value) {
      onSave(name.trim(), value)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          ✨ Nuovo preset - {meal}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="es: Colazione Standard"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Calorie</label>
            <input
              type="number"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="es: 450"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !value}
              className="flex-1 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
