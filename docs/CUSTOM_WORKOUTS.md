# 🎯 Custom Workout Calculation Feature

## Cosa è stato implementato

Aggiunta la possibilità di calcolare il TDEE in modo più preciso usando:
1. **Numero esatto di allenamenti a settimana** (0-7) invece delle categorie predefinite
2. **Calorie bruciate per allenamento** (opzionale, da smartwatch) per TDEE ultra-preciso

---

## Come funziona

### Metodo 1: Activity Level Standard (vecchio metodo)
```
TDEE = BMR × Activity Multiplier
- Sedentario: × 1.2
- Leggero: × 1.375
- Moderato: × 1.55
- Attivo: × 1.725
```

**Esempio:**
- BMR: 1606 kcal
- Activity: Moderato
- TDEE = 1606 × 1.55 = **2489 kcal**

---

### Metodo 2: Custom Workout Count (nuovo)
```
TDEE = BMR × (1.2 + workouts × 0.075)
```

**Esempio:**
- BMR: 1606 kcal
- Workouts: 5/settimana
- TDEE = 1606 × (1.2 + 5 × 0.075) = 1606 × 1.575 = **2529 kcal**

**Vantaggi:**
- Più preciso per chi fa allenamenti irregolari (es: 5 workouts invece di 4-5)
- Interpolazione lineare tra 0 e 7 workouts

---

### Metodo 3: Smartwatch Calories (nuovo, massima precisione)
```
TDEE = (BMR × 1.2) + (workout_calories × workouts / 7)
```

**Esempio:**
- BMR: 1606 kcal
- Workouts: 5/settimana
- Calorie per workout: 450 kcal
- TDEE = (1606 × 1.2) + (450 × 5 / 7) = 1927 + 321 = **2249 kcal**

**Vantaggi:**
- Usa dati reali dal tuo smartwatch/fitness tracker
- Account preciso per intensità allenamento
- Ignora sovrastime degli activity multipliers generici

---

## Differenze nei Risultati

| Metodo | TDEE | Differenza |
|--------|------|------------|
| Moderato (standard) | 2489 kcal | baseline |
| 5 workouts (custom) | 2529 kcal | +40 kcal |
| 5 workouts + 450 kcal smartwatch | 2249 kcal | **-240 kcal** |

**Conclusione:** Se il tuo smartwatch dice che bruci 450 kcal per allenamento, il metodo standard sovrastima il TDEE di ~240 kcal/giorno (1680 kcal/settimana)!

---

## Come usare nell'app

### Backend (già implementato)

**POST /api/plans/diet**

**Opzione 1: Activity Level Standard**
```json
{
  "obiettivo": "ricomposizione",
  "activity_level": "moderato",
  "intensita_deficit": "moderato"
}
```

**Opzione 2: Custom Workout Count**
```json
{
  "obiettivo": "ricomposizione",
  "workouts_per_week": 5,
  "intensita_deficit": "moderato"
}
```

**Opzione 3: Smartwatch Calories**
```json
{
  "obiettivo": "ricomposizione",
  "workouts_per_week": 5,
  "workout_calories_per_session": 450,
  "intensita_deficit": "moderato"
}
```

### Frontend (già implementato)

1. Vai su "Genera Piano Dieta"
2. Attiva checkbox **"🎯 Usa numero allenamenti personalizzato"**
3. Inserisci numero workouts (0-7)
4. (Opzionale) Inserisci calorie da smartwatch
5. Genera piano

**Schermata mostra:**
- Metodo di calcolo usato
- Workouts/settimana
- Calorie per workout (se presente)

---

## Files modificati

### Backend
- ✅ `backend/src/models/User.js` - Aggiunto campo `workouts_per_week`
- ✅ `backend/src/models/DietPlan.js` - Aggiunti campi `workouts_per_week` e `workout_calories_per_session`
- ✅ `backend/src/services/CalorieCalculator.js` - Aggiunte funzioni:
  - `calculateActivityMultiplierFromWorkouts(workoutsPerWeek)`
  - `calculateTDEEWithCustomActivity(bmr, workoutsPerWeek, workoutCaloriesPerSession)`
- ✅ `backend/src/controllers/planController.js` - Logica per usare custom workout se fornito

### Frontend
- ✅ `frontend/src/pages/Plans.jsx` - Aggiunto:
  - Toggle "Usa numero allenamenti personalizzato"
  - Input "Allenamenti a Settimana" (0-7)
  - Input "Calorie per Allenamento" (opzionale)
  - Display metodo calcolo nel risultato

### Database
- ✅ Schema aggiornato (esegui `npm run db:init` se necessario)

---

## Testing

### Test 1: Standard Activity Level
```bash
curl -X POST http://localhost:3001/api/plans/diet \
  -H "Content-Type: application/json" \
  -d '{"obiettivo": "ricomposizione", "activity_level": "moderato"}'

# Risultato: TDEE = 2489 kcal ✓
```

### Test 2: Custom Workout Count
```bash
curl -X POST http://localhost:3001/api/plans/diet \
  -H "Content-Type: application/json" \
  -d '{"obiettivo": "ricomposizione", "workouts_per_week": 5}'

# Risultato: TDEE = 2529 kcal ✓
```

### Test 3: Smartwatch Calories
```bash
curl -X POST http://localhost:3001/api/plans/diet \
  -H "Content-Type: application/json" \
  -d '{"obiettivo": "ricomposizione", "workouts_per_week": 5, "workout_calories_per_session": 450}'

# Risultato: TDEE = 2249 kcal ✓
```

---

## Raccomandazioni d'uso

### Quando usare Activity Level Standard
- Non hai uno smartwatch
- Non conosci il numero esatto di workouts
- Vuoi una stima veloce

### Quando usare Custom Workout Count
- Sai esattamente quanti allenamenti fai (es: sempre 5/settimana)
- Vuoi più precisione del metodo standard
- Non hai smartwatch per calorie reali

### Quando usare Smartwatch Calories
- ⭐ **RACCOMANDATO** se hai smartwatch/fitness tracker
- Intensità allenamento varia molto (HIIT vs steady cardio)
- Vuoi massima precisione basata su dati reali
- Hai tracciato almeno 1-2 settimane di allenamenti per avere una media affidabile

---

## Note importanti

1. **Database reset necessario**: Se hai dati vecchi, esegui `npm run db:init` per aggiornare lo schema
2. **Calorie smartwatch**: Usa la media di almeno 5-10 allenamenti per risultato accurato
3. **Backwards compatible**: Il metodo vecchio (activity_level) continua a funzionare
4. **Priorità**: Se fornisci sia `activity_level` che `workouts_per_week`, viene usato `workouts_per_week`

---

## Prossimi passi (Fase 2)

Dopo 2 settimane di tracking con questo metodo:
- ✅ Reverse TDEE calculation (calcola TDEE reale da dati effettivi)
- ✅ TrendAnalyzer (analisi automatica progressi)
- ✅ Raccomandazioni intelligenti (alert rosso/giallo/verde)
- ✅ WorkoutAdapter (suggerimenti volume allenamento)

---

**Versione**: 1.1.0
**Data**: 06/02/2026
**Status**: ✅ Completato e testato
