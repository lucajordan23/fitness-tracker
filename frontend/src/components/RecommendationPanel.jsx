import { useState } from 'react';
import { createDietPlan } from '../services/planService';

export default function RecommendationPanel({ analysis, currentPlan, onPlanUpdated }) {
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null); // 'current' | 'suggested'

  if (!analysis) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg p-6 border border-gray-200 animate-fade-in">
        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          Raccomandazioni
        </h3>
        <p className="text-gray-500 text-sm">
          Inserisci almeno 7 giorni di misurazioni per ricevere raccomandazioni personalizzate basate sui tuoi progressi.
        </p>
      </div>
    );
  }

  const { situazione, raccomandazioni, deltas } = analysis;

  // Controlla se il piano è stato aggiornato di recente (ultime 48 ore)
  const isPlanRecentlyUpdated = () => {
    if (!currentPlan || !currentPlan.created_at) return false;

    const planDate = new Date(currentPlan.created_at);
    const now = new Date();
    const hoursSinceCreation = (now - planDate) / (1000 * 60 * 60);

    // Se il piano è stato creato nelle ultime 48 ore
    return hoursSinceCreation < 48;
  };

  // Calcola data prossima analisi (7 giorni dalla creazione del piano)
  const getNextAnalysisDate = () => {
    if (!currentPlan || !currentPlan.created_at) return null;

    const planDate = new Date(currentPlan.created_at);
    const nextAnalysis = new Date(planDate);
    nextAnalysis.setDate(nextAnalysis.getDate() + 7);

    return nextAnalysis.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Calcola piano corretto basato sulle raccomandazioni
  const calculateCorrectedPlan = () => {
    if (!currentPlan) return null;

    let calorieAdjustment = 0;

    // Cerca raccomandazioni con azione specifica
    raccomandazioni.forEach(rec => {
      if (rec.azione === 'decrease_calories') {
        calorieAdjustment = -200; // Riduci 200 kcal
      } else if (rec.azione === 'increase_calories') {
        calorieAdjustment = +200; // Aumenta 200 kcal
      } else if (rec.azione === 'maintain') {
        calorieAdjustment = 0;
      }
    });

    if (calorieAdjustment === 0) return null;

    const newCalories = currentPlan.calorie_target + calorieAdjustment;

    // Mantieni le stesse percentuali macro del piano attuale
    const currentTotal = currentPlan.proteine_g * 4 + currentPlan.carboidrati_g * 4 + currentPlan.grassi_g * 9;
    const proteinPercent = (currentPlan.proteine_g * 4) / currentTotal;
    const carbPercent = (currentPlan.carboidrati_g * 4) / currentTotal;
    const fatPercent = (currentPlan.grassi_g * 9) / currentTotal;

    return {
      calorie_target: Math.round(newCalories),
      proteine_g: Math.round((newCalories * proteinPercent) / 4),
      carboidrati_g: Math.round((newCalories * carbPercent) / 4),
      grassi_g: Math.round((newCalories * fatPercent) / 9),
      adjustment: calorieAdjustment
    };
  };

  const correctedPlan = calculateCorrectedPlan();

  const handleSelectPlan = async (planType) => {
    if (!currentPlan) return;

    setSelectedPlan(planType);

    // Se seleziona il piano corrente, non facciamo nulla (è già attivo)
    if (planType === 'current') {
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        setSelectedPlan(null);
      }, 2000);
      return;
    }

    // Se seleziona il piano suggerito, crea nuovo piano con valori corretti
    if (planType === 'suggested' && correctedPlan) {
      try {
        setUpdating(true);

        await createDietPlan({
          obiettivo: currentPlan.obiettivo,
          calorie_target: correctedPlan.calorie_target,
          proteine_g: correctedPlan.proteine_g,
          carboidrati_g: correctedPlan.carboidrati_g,
          grassi_g: correctedPlan.grassi_g,
          workouts_per_week: currentPlan.workouts_per_week || 3,
          workout_calories_per_session: currentPlan.workout_calories_per_session || null,
          strategia: `🤖 Piano aggiustato dall'AI: ${correctedPlan.adjustment > 0 ? '+' : ''}${correctedPlan.adjustment} kcal/giorno basato su analisi trend`
        });

        setUpdateSuccess(true);
        setTimeout(() => {
          setUpdateSuccess(false);
          setSelectedPlan(null);
          if (onPlanUpdated) onPlanUpdated();
        }, 2000);
      } catch (error) {
        console.error('Errore aggiornamento piano:', error);
        alert('Errore durante l\'aggiornamento del piano');
        setSelectedPlan(null);
      } finally {
        setUpdating(false);
      }
    }
  };

  // Colore badge semaforo con gradients
  const semaforoColors = {
    verde: 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-300 shadow-green-100',
    giallo: 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border-yellow-300 shadow-yellow-100',
    rosso: 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-300 shadow-red-100',
    grigio: 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border-gray-300 shadow-gray-100'
  };

  // Colore priorità raccomandazioni con hover
  const priorityColors = {
    alta: 'border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-white hover:from-red-100 hover:to-red-50',
    media: 'border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-50 to-white hover:from-yellow-100 hover:to-yellow-50',
    bassa: 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50'
  };

  return (
    <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-xl shadow-lg p-6 border border-purple-100 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl animate-pulse">💡</span>
          Raccomandazioni AI
        </h3>
        <span
          className={`px-4 py-2 rounded-full text-sm font-bold border-2 shadow-lg ${semaforoColors[situazione.semaforo]} animate-bounce-subtle`}
        >
          {situazione.status.toUpperCase()}
        </span>
      </div>

      {/* Messaggio situazione con animazione */}
      <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-white rounded-xl border border-purple-200 shadow-md hover:shadow-lg transition-all duration-300 animate-slide-up">
        <p className="text-base font-bold text-gray-900 mb-1">{situazione.messaggio}</p>
        <p className="text-xs text-purple-600 font-medium">
          Codice analisi: <span className="font-mono bg-purple-100 px-2 py-1 rounded">{situazione.codice}</span>
        </p>
      </div>

      {/* Deltas con animazioni stagger */}
      {deltas && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Peso', value: deltas.peso, good: deltas.peso < 0 },
            { label: 'Massa Grassa', value: deltas.massaGrassa, good: deltas.massaGrassa < 0 },
            { label: 'Massa Magra', value: deltas.massaMagra, good: deltas.massaMagra > 0 }
          ].map((item, idx) => (
            <div
              key={item.label}
              className="text-center p-4 bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{item.label}</p>
              <p
                className={`text-2xl font-bold ${
                  item.good ? 'text-green-600' : item.value === 0 ? 'text-gray-600' : 'text-red-600'
                }`}
              >
                {item.value > 0 ? '+' : ''}
                {item.value}
                <span className="text-sm ml-1">kg/sett</span>
              </p>
              <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.good ? 'bg-green-500' : 'bg-red-500'} transition-all duration-1000`}
                  style={{ width: `${Math.min(Math.abs(item.value) * 50, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Piano Dieta Corrente vs Suggerito */}
      {correctedPlan && currentPlan && (
        isPlanRecentlyUpdated() ? (
          // Messaggio se il piano è stato aggiornato di recente
          <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 shadow-lg animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="text-center">
              <div className="mb-4">
                <span className="text-6xl">✅</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                Piano Aggiornato con Successo!
              </h4>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Hai appena aggiornato il tuo piano dieta seguendo le raccomandazioni AI.<br />
                <strong>Segui questo piano per almeno 7 giorni</strong> e inserisci le tue misurazioni giornaliere.
              </p>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-green-200 mb-4">
                <p className="text-sm text-gray-600 mb-2">📅 <strong>Prossima analisi disponibile:</strong></p>
                <p className="text-lg font-bold text-green-700">{getNextAnalysisDate()}</p>
                <p className="text-xs text-gray-500 mt-2">
                  (Dopo aver raccolto almeno 7 giorni di nuove misurazioni)
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Continua a monitorare i tuoi progressi</span>
              </div>
            </div>
          </div>
        ) : (
          // Card cliccabili se il piano non è stato aggiornato di recente
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-lg animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🔄</span>
                Aggiustamento Piano Dieta Suggerito
              </h4>
              {updateSuccess && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full border border-green-300 animate-pulse">
                  ✅ Aggiornato!
                </span>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-4 text-center font-medium">
              💡 Clicca sul piano che vuoi attivare
            </p>

            <div className="grid grid-cols-2 gap-6 mb-4">
              {/* Piano Attuale - Clickable */}
              <button
                onClick={() => handleSelectPlan('current')}
                disabled={updating}
                className={`text-left p-4 rounded-lg border-2 transition-all duration-300 relative overflow-hidden group ${
                  selectedPlan === 'current'
                    ? 'border-gray-400 bg-gray-100 scale-105 shadow-xl'
                    : updating
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-300 bg-white/70 backdrop-blur-sm hover:border-gray-400 hover:shadow-lg hover:scale-102 cursor-pointer'
                }`}
              >
                {selectedPlan === 'current' && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-block w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </span>
                  </div>
                )}
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">📋 Piano Attuale</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Calorie:</span>
                    <span className="text-lg font-bold text-gray-900">{currentPlan.calorie_target} kcal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Proteine:</span>
                    <span className="text-md font-semibold text-blue-700">{currentPlan.proteine_g}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Carboidrati:</span>
                    <span className="text-md font-semibold text-green-700">{currentPlan.carboidrati_g}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Grassi:</span>
                    <span className="text-md font-semibold text-yellow-700">{currentPlan.grassi_g}g</span>
                  </div>
                </div>
              </button>

              {/* Piano Suggerito - Clickable */}
              <button
                onClick={() => handleSelectPlan('suggested')}
                disabled={updating}
                className={`text-left p-4 rounded-lg border-2 transition-all duration-300 relative overflow-hidden group ${
                  selectedPlan === 'suggested'
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 scale-105 shadow-xl'
                    : updating
                    ? 'border-green-200 bg-green-50 opacity-50 cursor-not-allowed'
                    : 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-500 hover:shadow-lg hover:scale-102 cursor-pointer'
                }`}
              >
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  🤖 AI
                </div>
                {selectedPlan === 'suggested' && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-block w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </span>
                  </div>
                )}
                <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3 mt-1">✨ Piano Corretto</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Calorie:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-700">{correctedPlan.calorie_target} kcal</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${correctedPlan.adjustment > 0 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {correctedPlan.adjustment > 0 ? '+' : ''}{correctedPlan.adjustment}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Proteine:</span>
                    <span className="text-md font-semibold text-blue-700">{correctedPlan.proteine_g}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Carboidrati:</span>
                    <span className="text-md font-semibold text-green-700">{correctedPlan.carboidrati_g}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Grassi:</span>
                    <span className="text-md font-semibold text-yellow-700">{correctedPlan.grassi_g}g</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Status feedback */}
            {(updating || updateSuccess) && (
              <div className={`p-3 rounded-lg text-center font-bold transition-all duration-300 ${
                updateSuccess
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-blue-100 text-blue-700 border-2 border-blue-300'
              }`}>
                {updating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Aggiornamento in corso...
                  </span>
                ) : (
                  '✅ Piano Aggiornato con Successo!'
                )}
              </div>
            )}
          </div>
        )
      )}

      {/* Lista raccomandazioni con stagger animation */}
      <div className="space-y-3">
        <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <span className="inline-block w-1 h-5 bg-purple-500 rounded"></span>
          Azioni Consigliate
        </p>
        {raccomandazioni.map((rec, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl ${priorityColors[rec.priorita]} shadow-md hover:shadow-xl transition-all duration-300 animate-slide-up cursor-pointer group`}
            style={{ animationDelay: `${(idx + 3) * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl group-hover:scale-125 transition-transform duration-300">
                {rec.tipo === 'mantieni' && '✅'}
                {rec.tipo === 'critico' && '🚨'}
                {rec.tipo === 'aggiusta' && '⚙️'}
                {rec.tipo === 'proteine' && '🥩'}
                {rec.tipo === 'cardio' && '🏃'}
                {rec.tipo === 'allenamento' && '💪'}
                {rec.tipo === 'warning' && '⚠️'}
                {rec.tipo === 'info' && 'ℹ️'}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 leading-relaxed group-hover:text-gray-700 transition-colors">
                  {rec.messaggio}
                </p>
                {rec.priorita === 'alta' && (
                  <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200 animate-pulse">
                    ⚡ PRIORITÀ ALTA
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
