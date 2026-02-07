# 🚀 Fase 2 - Roadmap Implementazione

## ✅ Fase 1 Completata (MVP)

- Backend completo con database e API
- CalorieCalculator service funzionante
- Frontend con dashboard e form
- Generazione automatica piano dieta da BMR
- Test completi e app funzionante

---

## 🎯 Obiettivi Fase 2

### 1. TrendAnalyzer Service (Alta Priorità)

**File da creare:** `backend/src/services/TrendAnalyzer.js`

**Funzionalità:**
- Analizza trend ultimi 7-14 giorni
- Calcola deltas (peso, massa magra, massa grassa)
- Classifica situazione (ottimale/attenzione/critico)
- Genera raccomandazioni automatiche

**Logica dal CLAUDE.md:**
```javascript
// Esempio classificazione
if (obiettivo === 'ricomposizione') {
  if (massaGrassa < -0.2 && massaMagra > 0.1) {
    return 'SANTO GRAAL: perdi grasso E guadagni muscolo'
  }
}
```

**Output:**
```json
{
  "situazione": {
    "status": "ottimale",
    "codice": "RECOMP_PERFECT",
    "semaforo": "verde"
  },
  "raccomandazioni": [
    {
      "tipo": "mantieni",
      "messaggio": "Continua così! Non cambiare nulla."
    }
  ]
}
```

---

### 2. PlanAdjuster Service

**File da creare:** `backend/src/services/PlanAdjuster.js`

**Funzionalità:**
- Usa TrendAnalyzer per decidere se servono aggiustamenti
- Propone nuovo piano se necessario
- Log storico modifiche (adjustments_log table)

**API endpoint:**
```javascript
POST /api/analysis/adjust
// Input: dati correnti
// Output: { currentPlan, proposedPlan, shouldApply }
```

---

### 3. WorkoutAdapter Service

**File da creare:** `backend/src/services/WorkoutAdapter.js`

**Funzionalità:**
- Suggerimenti allenamento basati su deficit/surplus
- Adattamento volume in deficit calorico
- Raccomandazioni cardio

**Logica:**
```javascript
if (deficit > 0 && massaMagra < -0.2) {
  return {
    azione: 'riduci_volume',
    valore: -20, // -20% serie
    messaggio: 'Riduci volume, mantieni intensità'
  }
}
```

---

### 4. Reverse TDEE Calculation

**Aggiungere a CalorieCalculator.js:**

Già implementato nel codice ma non usato:
```javascript
export function reverseTDEE(measurements) {
  // Calcola TDEE reale da tracking 14 giorni
  // Se hai tracciato calorie consumate
}
```

**UI necessaria:**
- Form per inserire calorie consumate giornaliere
- Dopo 2 settimane: mostra TDEE reale vs stimato

---

### 5. Frontend - Grafici Avanzati

**Libreria:** Recharts (già installata)

**Componenti da creare:**
- `TrendChart.jsx` - Grafico linee peso/BF%/massa magra
- `BodyCompositionChart.jsx` - Pie chart composizione
- `MacrosChart.jsx` - Barre progress macros giornalieri

**Esempio:**
```jsx
import { LineChart, Line, XAxis, YAxis } from 'recharts'

<LineChart data={measurements}>
  <Line dataKey="peso" stroke="#3b82f6" />
  <Line dataKey="massa_magra" stroke="#10b981" />
</LineChart>
```

---

### 6. RecommendationPanel Intelligente

**File:** `frontend/src/components/RecommendationPanel.jsx`

**Input:** Array raccomandazioni da TrendAnalyzer

**UI:**
- Alert colorati (rosso/giallo/verde) per priorità
- Dettagli espandibili
- Azioni suggerite (es: "Aumenta proteine +30g")

---

### 7. Workout Plans UI

**File da creare:** `frontend/src/pages/WorkoutPlans.jsx`

**Form per:**
- Frequenza settimanale
- Intensità (bassa/moderata/alta)
- Focus (forza/ipertrofia/endurance)
- Split type (PPL/Upper-Lower/Full Body)
- Cardio (frequenza, tipo, durata)

**Visualizzazione:**
- Piano workout corrente nella dashboard
- Suggerimenti automatici da WorkoutAdapter

---

### 8. Sistema Alert Automatici

**Trigger events:**
- Massa magra scesa >0.5kg → Alert rosso
- Plateau 3+ settimane → Alert giallo
- Progressi ottimali → Alert verde

**Implementazione:**
```javascript
// In measurementController dopo POST
const alerts = checkCriticalAlerts(newMeasurement, history)
if (alerts.length > 0) {
  // Salva in adjustments_log
  // Return con alert
}
```

---

### 9. n8n Automation (Opzionale)

**Setup:**
1. Install n8n self-hosted
2. Workflow import CSV da email
3. Workflow analisi settimanale automatica
4. Workflow backup database

**File da creare:**
```
n8n-workflows/
├── auto-import-csv.json
├── weekly-analysis.json
└── backup-database.json
```

**Webhook endpoint:**
```javascript
POST /api/webhooks/n8n/measurement
// Riceve dati CSV parsed da n8n
```

---

## 📊 Priorità Implementazione

### Alta Priorità (Settimana 1-2)
1. ⭐⭐⭐ TrendAnalyzer service
2. ⭐⭐⭐ Frontend grafici (Recharts)
3. ⭐⭐ RecommendationPanel con raccomandazioni vere

### Media Priorità (Settimana 3-4)
4. ⭐⭐ PlanAdjuster service
5. ⭐⭐ WorkoutAdapter service
6. ⭐ Workout Plans UI

### Bassa Priorità (Fase 3)
7. ⭐ Reverse TDEE UI
8. ⭐ n8n automation
9. Sistema notifiche/reminder

---

## 🧪 Testing Strategy Fase 2

### Unit Tests
```javascript
// backend/tests/services/TrendAnalyzer.test.js
describe('TrendAnalyzer', () => {
  it('should classify RECOMP_PERFECT correctly', () => {
    const deltas = { massaGrassa: -0.3, massaMagra: 0.2 }
    const result = classifyTrend(deltas, 'ricomposizione')
    expect(result.codice).toBe('RECOMP_PERFECT')
  })
})
```

### Integration Tests
- Scenario completo: inserisci 14 misurazioni → verifica raccomandazioni
- Test plateau detection
- Test alert triggers

---

## 📈 Metriche Successo Fase 2

✅ **Funzionali:**
- TrendAnalyzer classifica correttamente 5+ scenari
- Raccomandazioni appaiono automaticamente dopo 7+ giorni dati
- Grafici mostrano trend chiari
- Workout plan si adatta a deficit/surplus

✅ **User Experience:**
- Vedo raccomandazioni utili senza calcoli manuali
- Grafici mi aiutano a capire progressi
- Alert mi avvisano se qualcosa va male
- Tempo analisi dati: <10 secondi

---

## 🔧 Setup Fase 2

**Backend:**
1. Crea services: TrendAnalyzer, PlanAdjuster, WorkoutAdapter
2. Aggiungi endpoint: GET /api/analysis/trends
3. Aggiungi tabella: adjustments_log (se serve)

**Frontend:**
1. `npm install recharts` (già fatto)
2. Crea componenti grafici
3. Aggiorna RecommendationPanel
4. Aggiungi WorkoutPlans page

**Testing:**
1. Seed database con 14 giorni dati fake
2. Test tutti gli scenari (cutting perfetto, muscle loss, plateau, etc.)
3. Verifica calcoli matematici

---

## 📝 Note Importanti

**Mantenere:**
- Stessa struttura code (services, controllers, components)
- Convenzioni naming attuali
- Safety checks (mai sotto BMR × 1.2)

**Evitare:**
- Over-engineering
- Feature bloat non richieste
- Breaking changes API esistenti

**Focus:**
- Algoritmi precisi
- UX semplice e chiara
- Performance (analisi real-time)

---

**Prossima milestone**: TrendAnalyzer + Grafici (Stima: 4-6 ore)
