# 🏋️ Fitness Tracker - Smart Body Composition Analyzer

Applicazione full-stack per il monitoraggio della composizione corporea con **analisi intelligente dei progressi** e **raccomandazioni automatiche** personalizzate.

## ✨ Features

### Fase 1 - MVP ✅
- 📊 **Tracking Misurazioni**: Peso, Body Fat %, Massa Magra, Massa Grassa, BMR
- 🍽️ **Generatore Piani Dieta**: Calcolo automatico TDEE e macronutrienti
- 💪 **Custom Workout Calculation**: 3 metodi di calcolo calorie (standard, custom workouts, smartwatch)
- 📈 **Statistiche Dashboard**: Overview completa ultimi 30 giorni
- 🗑️ **Gestione Misurazioni**: CRUD completo con eliminazione

### Fase 2 - AI Recommendations ✅
- 🤖 **TrendAnalyzer Engine**: Analisi automatica progressi settimanali
- 🚦 **Sistema Semaforo**: Classificazione stato (Verde/Giallo/Rosso/Grigio)
- 📉 **Grafici Interattivi**: Visualizzazione trend con Recharts
- 💡 **Raccomandazioni Intelligenti**: 15+ scenari personalizzati
  - ✅ RECOMP_PERFECT: Perdi grasso + guadagni muscolo
  - ⚠️ MUSCLE_LOSS: Deficit troppo aggressivo
  - 🔄 PLATEAU: Suggerisce diet break
  - 🎯 CUTTING_OPTIMAL: Deficit calorico ideale
  - E molti altri...
- 🎯 **Delta Tracking**: kg/settimana per peso, grasso, muscolo

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **SQLite** + **Sequelize ORM**
- **CORS** per comunicazione frontend-backend
- **Katch-McArdle Formula** per calcolo BMR
- **Custom Workout Algorithm** per TDEE personalizzato

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** per styling
- **Recharts** per grafici interattivi
- **Axios** per API calls
- **Component-based architecture**

## 📦 Installazione

### Prerequisiti
- Node.js >= 18.x
- npm o yarn

### Setup

1. **Clone repository**
```bash
git clone https://github.com/YOUR_USERNAME/fitness-tracker.git
cd fitness-tracker
```

2. **Backend Setup**
```bash
cd backend
npm install
npm run dev  # Avvia server su http://localhost:3001
```

3. **Frontend Setup** (nuovo terminale)
```bash
cd frontend
npm install
npm run dev  # Avvia app su http://localhost:5173
```

4. **Database Initialization**

Il database SQLite viene creato automaticamente al primo avvio.

5. **Seed Test Data** (opzionale)
```bash
cd backend
node src/config/seedTestData.js
```
Inserisce 15 giorni di misurazioni di test per scenario RECOMP_PERFECT.

## 🚀 Utilizzo

1. Apri **http://localhost:5173**
2. Inserisci una nuova misurazione (peso + body fat %)
3. Dopo 7+ misurazioni, vedrai:
   - 📈 Grafico trend ultimi 30 giorni
   - 💡 Raccomandazioni personalizzate
   - 🚦 Semaforo stato (verde/giallo/rosso)
4. Genera un piano dieta basato su obiettivo e attività

## 📁 Struttura Progetto

```
fitness-tracker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js              # Configurazione SQLite
│   │   │   └── seedTestData.js          # Script seed dati test
│   │   ├── controllers/
│   │   │   ├── measurementController.js # CRUD misurazioni
│   │   │   ├── planController.js        # Generazione piani dieta
│   │   │   └── analysisController.js    # Analisi trend
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Measurement.js
│   │   │   ├── DietPlan.js
│   │   │   └── WorkoutPlan.js
│   │   ├── routes/
│   │   │   ├── measurements.js
│   │   │   ├── plans.js
│   │   │   └── analysis.js
│   │   ├── services/
│   │   │   ├── CalorieCalculator.js     # Calcolo TDEE e macros
│   │   │   └── TrendAnalyzer.js         # Engine analisi trend
│   │   └── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── TrendChart.jsx           # Grafico Recharts
│   │   │   └── RecommendationPanel.jsx  # Pannello raccomandazioni
│   │   ├── pages/
│   │   │   ├── Home.jsx                 # Dashboard principale
│   │   │   ├── NewMeasurement.jsx       # Form inserimento
│   │   │   ├── Measurements.jsx         # Storico + delete
│   │   │   └── Plans.jsx                # Generazione piani
│   │   ├── services/
│   │   │   ├── api.js                   # Axios instance
│   │   │   ├── measurementService.js
│   │   │   ├── planService.js
│   │   │   └── analysisService.js
│   │   ├── utils/
│   │   │   └── formatters.js            # Utility formattazione
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Measurements
- `GET /api/measurements?limit=30` - Lista misurazioni
- `GET /api/measurements/:id` - Singola misurazione
- `POST /api/measurements` - Crea misurazione
- `DELETE /api/measurements/:id` - Elimina misurazione
- `GET /api/measurements/stats?days=30` - Statistiche

### Plans
- `GET /api/plans/current` - Piani attivi
- `POST /api/plans/generate` - Genera nuovo piano dieta

### Analysis
- `GET /api/analysis/trends?days=7|14` - Analisi trend e raccomandazioni

## 🧮 Algoritmi Chiave

### TDEE Calculation (CalorieCalculator)
1. **BMR** (Katch-McArdle): `370 + (21.6 × Massa Magra kg)`
2. **NEAT** (Activity Level): BMR × moltiplicatore (1.2-1.9)
3. **Workout Calories**: 3 metodi
   - Standard: BMR × 0.05 × workouts/week
   - Custom: Calorie specificate manualmente
   - Smartwatch: Dato da device
4. **TDEE**: BMR + NEAT + Workout

### Macros Split
- **Cutting**: 40% carbs, 40% protein, 20% fat
- **Bulking**: 50% carbs, 25% protein, 25% fat
- **Ricomposizione**: 45% carbs, 35% protein, 20% fat

### Trend Analysis (TrendAnalyzer)
1. Calcola deltas settimanali: `(valore_recente - valore_vecchio) / settimane`
2. Classifica con 15+ codici basati su:
   - Delta peso, massa grassa, massa magra
   - Obiettivo utente
   - Threshold personalizzati
3. Genera raccomandazioni prioritizzate

## 🎯 Scenari di Classificazione

| Codice | Semaforo | Descrizione |
|--------|----------|-------------|
| `RECOMP_PERFECT` | 🟢 Verde | Perdi grasso + guadagni muscolo (santo graal) |
| `CUTTING_OPTIMAL` | 🟢 Verde | Deficit calorico ideale (80-90% grasso perso) |
| `MUSCLE_LOSS` | 🔴 Rosso | Deficit troppo aggressivo (perdi muscolo) |
| `PLATEAU` | 🟡 Giallo | Nessun progresso (suggerisce diet break) |
| `BULKING_CLEAN` | 🟢 Verde | Massa pulita (80%+ massa magra guadagnata) |
| `BULKING_DIRTY` | 🟡 Giallo | Troppo grasso guadagnato in bulking |

## 🔮 Future Enhancements (Fase 3+)

- [ ] Multi-user authentication (JWT)
- [ ] Workout plan tracking con exercises
- [ ] Progress photos upload
- [ ] Export reports (PDF)
- [ ] Mobile app (React Native)
- [ ] Integration con smartwatch APIs (Garmin, Apple Health)
- [ ] Social features (condivisione progressi)
- [ ] AI meal suggestions basate su macros

## 🤝 Contributing

Contributi benvenuti! Per favore:
1. Fork il repository
2. Crea un branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 License

MIT License - vedi [LICENSE](LICENSE) per dettagli

## 👤 Author

**Luca**

## 🙏 Acknowledgments

- Katch-McArdle formula per calcolo BMR accurato
- Recharts per grafici interattivi
- Tailwind CSS per rapid UI development

---

**⚠️ Disclaimer**: Questa app è solo a scopo informativo. Consulta un professionista della salute prima di iniziare qualsiasi programma di fitness o dieta.
