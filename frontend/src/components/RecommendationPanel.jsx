export default function RecommendationPanel({ analysis }) {
  if (!analysis) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">💡 Raccomandazioni</h3>
        <p className="text-gray-500 text-sm">
          Inserisci almeno 7 giorni di misurazioni per ricevere raccomandazioni personalizzate basate sui tuoi progressi.
        </p>
      </div>
    );
  }

  const { situazione, raccomandazioni, deltas } = analysis;

  // Colore badge semaforo
  const semaforoColors = {
    verde: 'bg-green-100 text-green-800 border-green-300',
    giallo: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    rosso: 'bg-red-100 text-red-800 border-red-300',
    grigio: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  // Colore priorità raccomandazioni
  const priorityColors = {
    alta: 'border-l-4 border-red-500 bg-red-50',
    media: 'border-l-4 border-yellow-500 bg-yellow-50',
    bassa: 'border-l-4 border-blue-500 bg-blue-50'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">💡 Raccomandazioni</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium border ${semaforoColors[situazione.semaforo]}`}
        >
          {situazione.status.toUpperCase()}
        </span>
      </div>

      {/* Messaggio situazione */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md">
        <p className="text-sm font-medium text-gray-900">{situazione.messaggio}</p>
        <p className="text-xs text-gray-500 mt-1">Codice: {situazione.codice}</p>
      </div>

      {/* Deltas */}
      {deltas && (
        <div className="mb-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-500">Peso</p>
            <p
              className={`text-sm font-bold ${
                deltas.peso < 0
                  ? 'text-green-600'
                  : deltas.peso > 0
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {deltas.peso > 0 ? '+' : ''}
              {deltas.peso} kg/sett
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Massa Grassa</p>
            <p
              className={`text-sm font-bold ${
                deltas.massaGrassa < 0
                  ? 'text-green-600'
                  : deltas.massaGrassa > 0
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {deltas.massaGrassa > 0 ? '+' : ''}
              {deltas.massaGrassa} kg/sett
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Massa Magra</p>
            <p
              className={`text-sm font-bold ${
                deltas.massaMagra > 0
                  ? 'text-green-600'
                  : deltas.massaMagra < 0
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {deltas.massaMagra > 0 ? '+' : ''}
              {deltas.massaMagra} kg/sett
            </p>
          </div>
        </div>
      )}

      {/* Lista raccomandazioni */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 mb-2">Azioni Consigliate:</p>
        {raccomandazioni.map((rec, idx) => (
          <div key={idx} className={`p-3 rounded-md ${priorityColors[rec.priorita]}`}>
            <div className="flex items-start">
              <span className="text-lg mr-2">
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
                <p className="text-sm font-medium text-gray-900">{rec.messaggio}</p>
                {rec.priorita === 'alta' && (
                  <p className="text-xs text-red-600 mt-1">Priorità Alta</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
