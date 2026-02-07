# Fitness Tracker - Documentazione Tecnica Completa

**Versione**: 1.0
**Data**: 7 Febbraio 2026
**Autore**: Lorenzo & Claude Sonnet 4.5

---

## Indice

1. [Architettura del Sistema](#1-architettura-del-sistema)
2. [Database Schema](#2-database-schema)
3. [Formule e Algoritmi](#3-formule-e-algoritmi)
4. [TrendAnalyzer - Motore di Analisi](#4-trendanalyzer---motore-di-analisi)
5. [Sistema di Classificazione](#5-sistema-di-classificazione)
6. [API Endpoints](#6-api-endpoints)
7. [Frontend Components](#7-frontend-components)
8. [Flusso Dati Completo](#8-flusso-dati-completo)
9. [Esempi Pratici con Calcoli](#9-esempi-pratici-con-calcoli)

---

## 1. Architettura del Sistema

### 1.1 Stack Tecnologico

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │  Vite    │  │ Tailwind │  │  Recharts (Charts) │   │
│  │  (Build) │  │   CSS    │  │      Library       │   │
│  └──────────┘  └──────────┘  └────────────────────┘   │
│                                                          │
│  Components: Home, Measurements, Plans, TrendChart,     │
│              RecommendationPanel                        │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP (Axios)
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                   │
│  ┌──────────────┐  ┌─────────────────────────────┐     │
│  │   Routes     │  │      Controllers             │     │
│  │ /measurements│→ │  measurementController.js    │     │
│  │ /plans       │→ │  planController.js           │     │
│  │ /analysis    │→ │  analysisController.js       │     │
│  └──────────────┘  └─────────────────────────────┘     │
│                              ↓                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Services (Business Logic)              │   │
│  │  • CalorieCalculator.js (TDEE, Macros)          │   │
│  │  • TrendAnalyzer.js (AI Recommendations)        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ Sequelize ORM
┌─────────────────────────────────────────────────────────┐
│                  DATABASE (SQLite)                       │
│  Tables: users, measurements, diet_plans, workout_plans │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Pattern Architetturale

- **Backend**: MVC (Model-View-Controller) modificato
  - Models: Definizioni schema Sequelize
  - Controllers: Gestione richieste HTTP
  - Services: Logica business (calcoli, analisi)
  - Routes: Routing API

- **Frontend**: Component-Based Architecture
  - Pages: Container components (Home, Measurements, Plans)
  - Components: Presentational components (TrendChart, StatCard)
  - Services: API clients (axios wrappers)
  - Utils: Funzioni helper (formatters)

---

## 2. Database Schema

### 2.1 Tabella `users`

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  nome VARCHAR(100) NOT NULL,
  cognome VARCHAR(100) NOT NULL,
  sesso ENUM('M', 'F') NOT NULL,
  data_nascita DATE NOT NULL,
  altezza_cm INTEGER NOT NULL,
  activity_level DECIMAL(3,2) DEFAULT 1.2,
  workouts_per_week INTEGER DEFAULT 0,
  obiettivo ENUM('cutting', 'bulking', 'ricomposizione') DEFAULT 'ricomposizione',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campi chiave**:
- `activity_level`: Moltiplicatore NEAT (1.2 sedentario → 1.9 molto attivo)
- `workouts_per_week`: Numero allenamenti/settimana (0-7)
- `obiettivo`: Determina split macros e classificazione trend

### 2.2 Tabella `measurements`

```sql
CREATE TABLE measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  data_misurazione DATE NOT NULL,
  peso DECIMAL(5,2) NOT NULL,              -- kg
  body_fat_percent DECIMAL(4,2) NOT NULL,  -- %
  massa_magra DECIMAL(5,2),                -- kg (calcolato)
  massa_grassa DECIMAL(5,2),               -- kg (calcolato)
  bmr INTEGER,                              -- kcal (calcolato)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, data_misurazione)
);
```

**Calcoli automatici**:
```javascript
massa_grassa = (peso × body_fat_percent) / 100
massa_magra = peso - massa_grassa
bmr = 370 + (21.6 × massa_magra)  // Formula Katch-McArdle
```

### 2.3 Tabella `diet_plans`

```sql
CREATE TABLE diet_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  nome VARCHAR(255) NOT NULL,
  obiettivo ENUM('cutting', 'bulking', 'ricomposizione'),
  tdee INTEGER NOT NULL,                    -- kcal
  target_calories INTEGER NOT NULL,         -- kcal
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  calorie_adjustment INTEGER DEFAULT 0,    -- deficit/surplus
  workout_calories_method ENUM('standard', 'custom', 'smartwatch') DEFAULT 'standard',
  custom_workout_calories INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 3. Formule e Algoritmi

### 3.1 BMR - Basal Metabolic Rate (Katch-McArdle)

**Formula**:
```
BMR = 370 + (21.6 × Massa Magra in kg)
```

**Esempio**:
- Peso: 72 kg
- Body Fat: 22%
- Massa Grassa: 72 × 0.22 = 15.84 kg
- Massa Magra: 72 - 15.84 = 56.16 kg
- **BMR: 370 + (21.6 × 56.16) = 1583 kcal**

**Perché Katch-McArdle?**
- Più accurata delle formule basate solo su età/altezza/peso
- Considera la composizione corporea reale
- Ricerca scientifica: massa magra è il miglior predittore del metabolismo basale

### 3.2 TDEE - Total Daily Energy Expenditure

**Formula Completa**:
```
TDEE = BMR × Activity_Level + Workout_Calories
```

**3.2.1 Activity Level (NEAT - Non-Exercise Activity Thermogenesis)**

Moltiplicatori standard:
```javascript
const activityLevels = {
  1.2: 'Sedentario (lavoro da scrivania, poco movimento)',
  1.375: 'Leggermente attivo (passeggiate, movimento leggero)',
  1.55: 'Moderatamente attivo (lavoro in piedi, movimento regolare)',
  1.725: 'Molto attivo (lavoro fisico, attività intensa giornaliera)',
  1.9: 'Estremamente attivo (atleta professionista, allenamenti multipli)'
};
```

**Esempio**:
- BMR: 1583 kcal
- Activity Level: 1.55 (moderatamente attivo)
- **NEAT: 1583 × 1.55 = 2454 kcal**

**3.2.2 Workout Calories - 3 Metodi**

#### Metodo 1: Standard (Formula Semplificata)
```javascript
workoutCalories = BMR × 0.05 × workouts_per_week
```

**Esempio**:
- BMR: 1583 kcal
- Workouts/week: 4
- **Workout Calories: 1583 × 0.05 × 4 = 317 kcal/giorno**

**Logica**: Un allenamento intenso brucia ~5% del BMR. Distribuito sui 7 giorni.

#### Metodo 2: Custom (Input Manuale)
```javascript
workoutCalories = custom_workout_calories  // Inserito dall'utente
```

**Esempio**: Utente sa di bruciare 400 kcal/allenamento × 4 = 1600 kcal/sett → 229 kcal/giorno

#### Metodo 3: Smartwatch (Da Dispositivo)
```javascript
workoutCalories = smartwatch_calories  // Da Garmin, Apple Watch, etc.
```

**TDEE Finale**:
```
TDEE = 2454 + 317 = 2771 kcal/giorno
```

### 3.3 Target Calories (Deficit/Surplus)

**Formula**:
```javascript
if (obiettivo === 'cutting') {
  targetCalories = TDEE - (TDEE × 0.15)  // -15% deficit
} else if (obiettivo === 'bulking') {
  targetCalories = TDEE + (TDEE × 0.10)  // +10% surplus
} else {  // ricomposizione
  targetCalories = TDEE  // Maintenance
}
```

**Esempio (Cutting)**:
- TDEE: 2771 kcal
- **Target: 2771 - (2771 × 0.15) = 2355 kcal**

**Rationale**:
- Cutting 15%: deficit aggressivo ma sostenibile (evita muscle loss)
- Bulking 10%: surplus moderato (minimizza fat gain)
- Ricomposizione: maintenance (sfrutta newbie gains o recomp avanzata)

### 3.4 Macronutrienti Split

#### 3.4.1 Proteine (Priorità 1)

**Formula**:
```javascript
protein_g_per_kg = {
  cutting: 2.2,        // Alta proteina per preservare muscolo
  ricomposizione: 2.0, // Proteina moderata-alta
  bulking: 1.8         // Proteina moderata
}

protein_g = peso_kg × protein_g_per_kg
protein_calories = protein_g × 4  // 4 kcal/g
```

**Esempio (Cutting, 72 kg)**:
- Proteine: 72 × 2.2 = **158 g**
- Calorie da proteine: 158 × 4 = 632 kcal

#### 3.4.2 Grassi (Priorità 2)

**Formula**:
```javascript
fat_percent = {
  cutting: 0.20,        // 20% calorie totali
  ricomposizione: 0.20,
  bulking: 0.25         // 25% per ormoni
}

fat_calories = targetCalories × fat_percent
fat_g = fat_calories / 9  // 9 kcal/g
```

**Esempio (Cutting, 2355 kcal)**:
- Calorie grassi: 2355 × 0.20 = 471 kcal
- Grassi: 471 / 9 = **52 g**

**Rationale**: Minimo 20% per produzione ormonale (testosterone, estrogeni)

#### 3.4.3 Carboidrati (Riempitivo)

**Formula**:
```javascript
remaining_calories = targetCalories - protein_calories - fat_calories
carbs_g = remaining_calories / 4  // 4 kcal/g
```

**Esempio (Cutting)**:
- Remaining: 2355 - 632 - 471 = 1252 kcal
- Carboidrati: 1252 / 4 = **313 g**

**Split Finale (Cutting)**:
```
Target: 2355 kcal
- Proteine: 158 g (632 kcal) → 27%
- Grassi: 52 g (471 kcal) → 20%
- Carboidrati: 313 g (1252 kcal) → 53%
```

#### 3.4.4 Riepilogo Split per Obiettivo

| Obiettivo | Proteine | Grassi | Carboidrati |
|-----------|----------|--------|-------------|
| **Cutting** | 40% | 20% | 40% |
| **Ricomposizione** | 35% | 20% | 45% |
| **Bulking** | 25% | 25% | 50% |

---

## 4. TrendAnalyzer - Motore di Analisi

### 4.1 Input e Preprocessing

**Funzione**: `analyzeComplete(measurements, obiettivo, currentPlan, days)`

**Step 1: Ordinamento e Validazione**
```javascript
// Ordina DESC (più recenti prima)
const sorted = measurements.sort((a, b) =>
  new Date(b.data_misurazione) - new Date(a.data_misurazione)
);

// Valida quantità minima
if (sorted.length < 3) {
  return {
    situazione: {
      status: 'insufficienti',
      codice: 'DATI_INSUFFICIENTI',
      semaforo: 'grigio',
      messaggio: 'Servono almeno 3 misurazioni per analizzare i trend.'
    },
    // ...
  };
}
```

**Step 2: Selezione Periodo**
```javascript
const periodMeasurements = sorted.slice(0, days);  // Ultimi 7 o 14 giorni
```

### 4.2 Calcolo Delta Settimanale

**Funzione**: `calculateWeeklyDelta(measurements, field, days)`

**Formula**:
```javascript
delta_settimanale = (valore_recente - valore_vecchio) / (periodo_giorni / 7)
```

**Codice**:
```javascript
function calculateWeeklyDelta(measurements, field, days = 7) {
  if (measurements.length < 2) return 0;

  const recent = measurements[0];  // Più recente
  const old = measurements[measurements.length - 1];  // Più vecchio

  const recentDate = new Date(recent.data_misurazione);
  const oldDate = new Date(old.data_misurazione);

  // Calcola differenza in giorni
  const daysDiff = (recentDate - oldDate) / (1000 * 60 * 60 * 24);

  if (daysDiff < 1) return 0;

  // Delta totale
  const totalDelta = recent[field] - old[field];

  // Normalizza a settimana
  const weeklyDelta = totalDelta / (daysDiff / 7);

  return Math.round(weeklyDelta * 100) / 100;  // 2 decimali
}
```

**Esempio Pratico**:
```
Dati:
- 14 giorni fa: peso 72.0 kg, BF 22.5%, massa_magra 55.8 kg, massa_grassa 16.2 kg
- Oggi: peso 71.8 kg, BF 21.8%, massa_magra 56.2 kg, massa_grassa 15.6 kg

Calcolo Delta Peso:
totalDelta = 71.8 - 72.0 = -0.2 kg
weeklyDelta = -0.2 / (14 / 7) = -0.2 / 2 = -0.1 kg/settimana

Calcolo Delta Massa Grassa:
totalDelta = 15.6 - 16.2 = -0.6 kg
weeklyDelta = -0.6 / 2 = -0.3 kg/settimana

Calcolo Delta Massa Magra:
totalDelta = 56.2 - 55.8 = +0.4 kg
weeklyDelta = +0.4 / 2 = +0.2 kg/settimana

Risultato:
{
  peso: -0.1,
  massaGrassa: -0.3,
  massaMagra: +0.2,
  bodyFat: -0.35
}
```

### 4.3 Classificazione Trend

**Funzione**: `classifyTrend(deltas, obiettivo)`

**Logica Decisionale - Albero Decisionale**:

```
┌─ RICOMPOSIZIONE ────────────────────────────────────────┐
│                                                          │
│  IF massaGrassa < -0.15 AND massaMagra > 0.1           │
│    → RECOMP_PERFECT (Verde)                             │
│                                                          │
│  ELSE IF massaGrassa < -0.1 AND massaMagra >= -0.05    │
│    → RECOMP_PROGRESS (Giallo)                           │
│                                                          │
│  ELSE IF massaMagra < -0.15                             │
│    → MUSCLE_LOSS (Rosso)                                │
│                                                          │
│  ELSE IF abs(peso) < 0.1 AND abs(massaGrassa) < 0.05   │
│    → PLATEAU (Giallo)                                   │
│                                                          │
│  ELSE                                                    │
│    → RECOMP_SLOW (Giallo)                               │
└──────────────────────────────────────────────────────────┘

┌─ CUTTING ───────────────────────────────────────────────┐
│                                                          │
│  percentuale_grasso_perso = massaGrassa / peso          │
│                                                          │
│  IF peso < -0.3 AND massaMagra < -0.15                 │
│    → CUTTING_TOO_AGGRESSIVE (Rosso)                     │
│                                                          │
│  ELSE IF peso < -0.5 AND percentuale_grasso > 80%      │
│    → CUTTING_OPTIMAL (Verde)                            │
│                                                          │
│  ELSE IF peso < -0.2 AND percentuale_grasso > 70%      │
│    → CUTTING_GOOD (Verde)                               │
│                                                          │
│  ELSE IF abs(peso) < 0.1                                │
│    → PLATEAU (Giallo)                                   │
│                                                          │
│  ELSE                                                    │
│    → CUTTING_SLOW (Giallo)                              │
└──────────────────────────────────────────────────────────┘

┌─ BULKING ───────────────────────────────────────────────┐
│                                                          │
│  percentuale_muscolo = massaMagra / peso                │
│                                                          │
│  IF peso > 0.3 AND percentuale_muscolo > 80%           │
│    → BULKING_CLEAN (Verde)                              │
│                                                          │
│  ELSE IF peso > 0.5 AND percentuale_muscolo < 50%      │
│    → BULKING_DIRTY (Rosso)                              │
│                                                          │
│  ELSE IF peso > 0.2 AND percentuale_muscolo > 60%      │
│    → BULKING_MODERATE (Verde)                           │
│                                                          │
│  ELSE IF abs(peso) < 0.1                                │
│    → PLATEAU (Giallo)                                   │
│                                                          │
│  ELSE                                                    │
│    → BULKING_SLOW (Giallo)                              │
└──────────────────────────────────────────────────────────┘
```

**Codice Ricomposizione (Esempio)**:
```javascript
if (obiettivo === 'ricomposizione') {
  // SANTO GRAAL: Perdi grasso E guadagni muscolo
  if (deltas.massaGrassa < -0.15 && deltas.massaMagra > 0.1) {
    return {
      status: 'ottimale',
      codice: 'RECOMP_PERFECT',
      semaforo: 'verde',
      messaggio: '🔥 SANTO GRAAL! Perdi grasso E costruisci muscolo. Continua così!'
    };
  }

  // Muscle Loss (perdita muscolare)
  if (deltas.massaMagra < -0.15) {
    return {
      status: 'critico',
      codice: 'MUSCLE_LOSS',
      semaforo: 'rosso',
      messaggio: '🚨 ATTENZIONE: Stai perdendo massa muscolare. Deficit troppo aggressivo.'
    };
  }

  // Plateau
  if (Math.abs(deltas.peso) < 0.1 && Math.abs(deltas.massaGrassa) < 0.05) {
    return {
      status: 'plateau',
      codice: 'PLATEAU',
      semaforo: 'giallo',
      messaggio: '⚠️ Plateau metabolico. Considera un diet break o refeed strategico.'
    };
  }

  // ... altri casi
}
```

### 4.4 Generazione Raccomandazioni

**Funzione**: `generateRecommendations(situazione, deltas, obiettivo, currentPlan)`

**Logica per Codice**:

#### RECOMP_PERFECT
```javascript
raccomandazioni = [
  {
    tipo: 'mantieni',
    messaggio: 'Non cambiare nulla! Sei nel punto ottimale.',
    priorita: 'alta',
    azione: null
  }
]
```

#### MUSCLE_LOSS
```javascript
raccomandazioni = [
  {
    tipo: 'critico',
    messaggio: 'AUMENTA le calorie di 200-300 kcal immediatamente.',
    priorita: 'alta',
    azione: 'increase_calories'
  },
  {
    tipo: 'proteine',
    messaggio: `Aumenta proteine a ${(peso × 2.5).toFixed(0)}g/giorno per preservare muscolo.`,
    priorita: 'alta',
    azione: 'increase_protein'
  },
  {
    tipo: 'allenamento',
    messaggio: 'Mantieni intensità allenamento, aumenta volume gradualmente.',
    priorita: 'media',
    azione: null
  }
]
```

#### CUTTING_TOO_AGGRESSIVE
```javascript
raccomandazioni = [
  {
    tipo: 'critico',
    messaggio: 'Deficit troppo aggressivo. Riduci deficit del 30-40%.',
    priorita: 'alta',
    azione: 'decrease_deficit'
  },
  {
    tipo: 'cardio',
    messaggio: 'Riduci cardio e aumenta calorie da cibo.',
    priorita: 'alta',
    azione: 'reduce_cardio'
  }
]
```

#### PLATEAU
```javascript
raccomandazioni = [
  {
    tipo: 'aggiusta',
    messaggio: 'Diet break: porta calorie a maintenance per 10-14 giorni.',
    priorita: 'alta',
    azione: 'diet_break'
  },
  {
    tipo: 'info',
    messaggio: 'Dopo diet break, riprendi deficit con -10% calorie.',
    priorita: 'media',
    azione: null
  }
]
```

---

## 5. Sistema di Classificazione

### 5.1 Tutti i Codici Situazione

| Codice | Obiettivo | Semaforo | Descrizione | Threshold |
|--------|-----------|----------|-------------|-----------|
| `RECOMP_PERFECT` | Ricomposizione | 🟢 Verde | Perdi grasso (>0.15 kg/sett) + guadagni muscolo (>0.1 kg/sett) | MG < -0.15 AND MM > 0.1 |
| `RECOMP_PROGRESS` | Ricomposizione | 🟡 Giallo | Progressi lenti ma costanti | MG < -0.1 AND MM >= -0.05 |
| `RECOMP_SLOW` | Ricomposizione | 🟡 Giallo | Progressi molto lenti | Default case |
| `CUTTING_OPTIMAL` | Cutting | 🟢 Verde | Deficit ideale (80-90% grasso perso) | Peso < -0.5 AND %grasso > 80% |
| `CUTTING_GOOD` | Cutting | 🟢 Verde | Buon deficit (70%+ grasso perso) | Peso < -0.2 AND %grasso > 70% |
| `CUTTING_TOO_AGGRESSIVE` | Cutting | 🔴 Rosso | Deficit eccessivo, perdita muscolo | Peso < -0.3 AND MM < -0.15 |
| `CUTTING_SLOW` | Cutting | 🟡 Giallo | Deficit troppo leggero | Peso < -0.2 lento |
| `BULKING_CLEAN` | Bulking | 🟢 Verde | Massa pulita (80%+ muscolo) | Peso > 0.3 AND %MM > 80% |
| `BULKING_MODERATE` | Bulking | 🟢 Verde | Massa moderata (60%+ muscolo) | Peso > 0.2 AND %MM > 60% |
| `BULKING_DIRTY` | Bulking | 🔴 Rosso | Troppo grasso guadagnato | Peso > 0.5 AND %MM < 50% |
| `BULKING_SLOW` | Bulking | 🟡 Giallo | Surplus insufficiente | Peso lento |
| `MUSCLE_LOSS` | Tutti | 🔴 Rosso | Perdita massa muscolare | MM < -0.15 |
| `PLATEAU` | Tutti | 🟡 Giallo | Nessun progresso | abs(peso) < 0.1 AND abs(MG) < 0.05 |
| `DATI_INSUFFICIENTI` | Tutti | ⚪ Grigio | Meno di 3 misurazioni | Length < 3 |

**Legenda**:
- MG = Massa Grassa (kg/settimana)
- MM = Massa Magra (kg/settimana)
- %grasso = (deltaМG / deltaPeso) × 100
- %MM = (deltaMM / deltaPeso) × 100

### 5.2 Priorità Raccomandazioni

**Alta** (🔴 Bordo Rosso):
- Azioni critiche che richiedono intervento immediato
- Esempi: muscle loss, deficit eccessivo, surplus eccessivo

**Media** (🟡 Bordo Giallo):
- Aggiustamenti consigliati per ottimizzare
- Esempi: aggiustare cardio, refeed strategico

**Bassa** (🔵 Bordo Blu):
- Suggerimenti informativi o mantenimento
- Esempi: continua così, monitora trend

### 5.3 Tipi Raccomandazione

| Tipo | Icona | Uso |
|------|-------|-----|
| `mantieni` | ✅ | Situazione ottimale, non cambiare |
| `critico` | 🚨 | Problema serio, azione immediata |
| `aggiusta` | ⚙️ | Piccolo aggiustamento necessario |
| `proteine` | 🥩 | Modifica intake proteico |
| `cardio` | 🏃 | Modifica attività cardio |
| `allenamento` | 💪 | Modifica workout |
| `warning` | ⚠️ | Attenzione a qualcosa |
| `info` | ℹ️ | Informazione generale |

---

## 6. API Endpoints

### 6.1 GET /api/measurements

**Descrizione**: Recupera lista misurazioni

**Query Parameters**:
- `user_id` (default: 1)
- `limit` (default: 30)
- `offset` (default: 0)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "user_id": 1,
      "data_misurazione": "2026-02-07",
      "peso": 71.9,
      "body_fat_percent": 21.7,
      "massa_magra": 56.3,
      "massa_grassa": 15.6,
      "bmr": 1586,
      "created_at": "2026-02-07T10:34:29.265Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 30,
    "offset": 0
  }
}
```

### 6.2 POST /api/measurements

**Descrizione**: Crea nuova misurazione

**Request Body**:
```json
{
  "user_id": 1,
  "data_misurazione": "2026-02-07",
  "peso": 71.9,
  "body_fat_percent": 21.7
}
```

**Calcoli Automatici** (backend):
```javascript
massa_grassa = (71.9 × 21.7) / 100 = 15.6 kg
massa_magra = 71.9 - 15.6 = 56.3 kg
bmr = 370 + (21.6 × 56.3) = 1586 kcal
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 15,
    "user_id": 1,
    "data_misurazione": "2026-02-07",
    "peso": 71.9,
    "body_fat_percent": 21.7,
    "massa_magra": 56.3,
    "massa_grassa": 15.6,
    "bmr": 1586,
    "created_at": "2026-02-07T10:34:29.265Z"
  }
}
```

### 6.3 GET /api/analysis/trends

**Descrizione**: Analisi trend con raccomandazioni AI

**Query Parameters**:
- `user_id` (default: 1)
- `days` (7 o 14, default: 7)

**Esempio Request**:
```
GET /api/analysis/trends?days=14
```

**Response Completa**:
```json
{
  "success": true,
  "data": {
    "situazione": {
      "status": "ottimale",
      "codice": "RECOMP_PERFECT",
      "semaforo": "verde",
      "messaggio": "🔥 SANTO GRAAL! Perdi grasso E costruisci muscolo. Continua così!"
    },
    "deltas": {
      "peso": -0.1,
      "massaGrassa": -0.3,
      "massaMagra": 0.2,
      "bodyFat": -0.35,
      "periodo": 14
    },
    "raccomandazioni": [
      {
        "tipo": "mantieni",
        "messaggio": "Non cambiare nulla! Sei nel punto ottimale.",
        "priorita": "alta",
        "azione": null
      }
    ],
    "metriche": {
      "misurazioni_analizzate": 14,
      "periodo_giorni": 14,
      "dati_sufficienti": true,
      "ultima_misurazione": "2026-02-07T10:34:29.265Z"
    },
    "timestamp": "2026-02-07T10:34:44.227Z"
  },
  "metadata": {
    "user_id": 1,
    "objective": "ricomposizione",
    "measurements_count": 15,
    "analysis_period_days": 14
  }
}
```

### 6.4 POST /api/plans/generate

**Descrizione**: Genera piano dieta personalizzato

**Request Body**:
```json
{
  "user_id": 1,
  "obiettivo": "cutting",
  "workout_calories_method": "custom",
  "custom_workout_calories": 400
}
```

**Processing Backend**:
```javascript
// 1. Fetch user data
const user = await User.findByPk(1);
// { peso: 72, altezza: 175, sesso: 'M', activity_level: 1.55, workouts_per_week: 4, obiettivo: 'cutting' }

// 2. Fetch latest measurement
const measurement = await Measurement.findOne({ user_id: 1, order: DESC });
// { peso: 71.9, body_fat_percent: 21.7, massa_magra: 56.3 }

// 3. Calculate TDEE
const bmr = 370 + (21.6 × 56.3) = 1586 kcal
const neat = 1586 × 1.55 = 2458 kcal
const workoutCal = 400 kcal  // Custom method
const tdee = 2458 + 400 = 2858 kcal

// 4. Apply deficit
const targetCalories = 2858 × 0.85 = 2429 kcal  // -15% cutting

// 5. Calculate macros
const protein = 71.9 × 2.2 = 158 g (632 kcal)
const fat = 2429 × 0.20 / 9 = 54 g (486 kcal)
const carbs = (2429 - 632 - 486) / 4 = 328 g (1312 kcal)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 5,
    "nome": "Piano Cutting - Feb 2026",
    "obiettivo": "cutting",
    "tdee": 2858,
    "target_calories": 2429,
    "protein_g": 158,
    "carbs_g": 328,
    "fat_g": 54,
    "calorie_adjustment": -429,
    "workout_calories_method": "custom",
    "custom_workout_calories": 400,
    "is_active": true,
    "breakdown": {
      "bmr": 1586,
      "neat": 2458,
      "workout": 400,
      "deficit_percent": -15,
      "protein_percent": 26,
      "carbs_percent": 54,
      "fat_percent": 20
    }
  }
}
```

---

## 7. Frontend Components

### 7.1 TrendChart Component

**File**: `frontend/src/components/TrendChart.jsx`

**Input Props**:
```javascript
<TrendChart measurements={measurements} days={30} />
```

**Data Transformation**:
```javascript
const chartData = measurements
  .slice(0, 30)           // Ultimi 30 giorni
  .reverse()              // Ordina ASC (dal più vecchio)
  .map(m => ({
    data: formatDate(m.data_misurazione),  // "07/02/2026"
    peso: m.peso,                           // 71.9
    massaMagra: m.massa_magra,              // 56.3
    massaGrassa: m.massa_grassa,            // 15.6
    bodyFat: m.body_fat_percent             // 21.7
  }));
```

**Recharts Configuration**:
```jsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="data" angle={-45} textAnchor="end" height={80} />
    <YAxis />
    <Tooltip />
    <Legend />

    {/* Linea Peso (Blu) */}
    <Line
      type="monotone"
      dataKey="peso"
      stroke="#3b82f6"
      name="Peso (kg)"
      strokeWidth={2}
    />

    {/* Linea Massa Magra (Verde) */}
    <Line
      type="monotone"
      dataKey="massaMagra"
      stroke="#10b981"
      name="Massa Magra (kg)"
      strokeWidth={2}
    />

    {/* Linea Massa Grassa (Rosso) */}
    <Line
      type="monotone"
      dataKey="massaGrassa"
      stroke="#ef4444"
      name="Massa Grassa (kg)"
      strokeWidth={2}
    />
  </LineChart>
</ResponsiveContainer>
```

### 7.2 RecommendationPanel Component

**File**: `frontend/src/components/RecommendationPanel.jsx`

**Input Props**:
```javascript
<RecommendationPanel analysis={analysis} />
// analysis = response.data da GET /api/analysis/trends
```

**Color Mapping**:
```javascript
const semaforoColors = {
  verde: 'bg-green-100 text-green-800 border-green-300',
  giallo: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  rosso: 'bg-red-100 text-red-800 border-red-300',
  grigio: 'bg-gray-100 text-gray-800 border-gray-300'
};

const priorityColors = {
  alta: 'border-l-4 border-red-500 bg-red-50',
  media: 'border-l-4 border-yellow-500 bg-yellow-50',
  bassa: 'border-l-4 border-blue-500 bg-blue-50'
};
```

**Delta Color Logic**:
```javascript
// Peso: rosso se sale (in cutting), verde se scende
const pesoColor = deltas.peso < 0 ? 'text-green-600' :
                  deltas.peso > 0 ? 'text-red-600' : 'text-gray-600';

// Massa Grassa: sempre verde se scende
const mgColor = deltas.massaGrassa < 0 ? 'text-green-600' :
                deltas.massaGrassa > 0 ? 'text-red-600' : 'text-gray-600';

// Massa Magra: sempre verde se sale
const mmColor = deltas.massaMagra > 0 ? 'text-green-600' :
                deltas.massaMagra < 0 ? 'text-red-600' : 'text-gray-600';
```

---

## 8. Flusso Dati Completo

### 8.1 Scenario: Nuova Misurazione

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER INPUT                                           │
│    NewMeasurement.jsx                                   │
│    - Input: peso = 71.9 kg                              │
│    - Input: body_fat = 21.7%                            │
│    - Click "Salva"                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. FRONTEND → BACKEND                                   │
│    POST /api/measurements                               │
│    Body: { user_id: 1, peso: 71.9, body_fat: 21.7 }   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. BACKEND PROCESSING                                   │
│    measurementController.createMeasurement()            │
│                                                          │
│    A. Calcola massa_grassa:                             │
│       (71.9 × 21.7) / 100 = 15.6 kg                    │
│                                                          │
│    B. Calcola massa_magra:                              │
│       71.9 - 15.6 = 56.3 kg                            │
│                                                          │
│    C. Calcola BMR (Katch-McArdle):                      │
│       370 + (21.6 × 56.3) = 1586 kcal                  │
│                                                          │
│    D. Salva nel database:                               │
│       INSERT INTO measurements VALUES (...)             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. RESPONSE → FRONTEND                                  │
│    { success: true, data: {...} }                       │
│    Home.jsx aggiorna state e ricarica dashboard         │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Scenario: Visualizzazione Trend

```
┌─────────────────────────────────────────────────────────┐
│ 1. PAGE LOAD                                            │
│    Home.jsx useEffect()                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. PARALLEL API CALLS                                   │
│    Promise.all([                                        │
│      getMeasurementStats(30),     // Stats              │
│      getCurrentPlans(),            // Active plans      │
│      getTrendAnalysis(14),         // AI analysis       │
│      getMeasurements({ limit:30 }) // Raw measurements  │
│    ])                                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. TREND ANALYSIS (Backend)                             │
│    GET /api/analysis/trends?days=14                     │
│                                                          │
│    A. Fetch 14 misurazioni più recenti                  │
│    B. Calcola deltas settimanali:                       │
│       - peso: -0.1 kg/sett                              │
│       - massaGrassa: -0.3 kg/sett                       │
│       - massaMagra: +0.2 kg/sett                        │
│                                                          │
│    C. Classifica trend:                                 │
│       IF massaGrassa < -0.15 AND massaMagra > 0.1      │
│         → RECOMP_PERFECT                                │
│                                                          │
│    D. Genera raccomandazioni:                           │
│       ["Non cambiare nulla! Sei nel punto ottimale."]  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. FRONTEND RENDERING                                   │
│                                                          │
│    TrendChart Component:                                │
│    - Mostra grafico 3 linee (peso, MM, MG)             │
│    - Tooltip interattivo                                │
│                                                          │
│    RecommendationPanel Component:                       │
│    - Badge VERDE "OTTIMALE"                             │
│    - Deltas: Peso -0.1, MG -0.3, MM +0.2               │
│    - Raccomandazione priorità ALTA (bordo rosso)        │
└─────────────────────────────────────────────────────────┘
```

### 8.3 Scenario: Generazione Piano Dieta

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER INPUT (Plans.jsx)                               │
│    - Obiettivo: Cutting                                 │
│    - Workout Method: Custom                             │
│    - Workout Calories: 400 kcal                         │
│    - Click "Genera Piano"                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. BACKEND PROCESSING                                   │
│    POST /api/plans/generate                             │
│    planController.generatePlan()                        │
│                                                          │
│    A. Fetch user & latest measurement                   │
│       user: { activity_level: 1.55, ... }              │
│       measurement: { massa_magra: 56.3, peso: 71.9 }   │
│                                                          │
│    B. CalorieCalculator.calculateTDEE()                 │
│       Step 1: BMR = 370 + (21.6 × 56.3) = 1586         │
│       Step 2: NEAT = 1586 × 1.55 = 2458                │
│       Step 3: Workout = 400 (custom input)              │
│       Step 4: TDEE = 2458 + 400 = 2858 kcal            │
│                                                          │
│    C. Apply deficit (-15% for cutting)                  │
│       Target = 2858 × 0.85 = 2429 kcal                 │
│                                                          │
│    D. CalorieCalculator.calculateMacros()               │
│       Protein: 71.9 × 2.2 = 158g (632 kcal)            │
│       Fat: 2429 × 0.20 / 9 = 54g (486 kcal)            │
│       Carbs: (2429 - 632 - 486) / 4 = 328g             │
│                                                          │
│    E. Save to database                                  │
│       INSERT INTO diet_plans VALUES (...)               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. FRONTEND DISPLAY                                     │
│    Plans.jsx shows new active plan:                     │
│    ┌───────────────────────────────────────────┐       │
│    │ Piano Cutting - Feb 2026                  │       │
│    │ 🎯 Target: 2429 kcal/giorno               │       │
│    │ 🥩 Proteine: 158g (26%)                   │       │
│    │ 🍚 Carboidrati: 328g (54%)                │       │
│    │ 🥑 Grassi: 54g (20%)                      │       │
│    │ ⚡ TDEE: 2858 kcal                         │       │
│    │ 📉 Deficit: -429 kcal (-15%)              │       │
│    └───────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Esempi Pratici con Calcoli

### 9.1 Caso Studio: Marco - Ricomposizione Perfetta

**Dati Iniziali (Giorno 1)**:
- Età: 28 anni
- Peso: 72 kg
- Altezza: 175 cm
- Body Fat: 22.5%
- Obiettivo: Ricomposizione
- Activity Level: 1.55 (moderatamente attivo)
- Workouts: 4 volte/settimana

**Calcoli Giorno 1**:
```
Massa Grassa = 72 × 0.225 = 16.2 kg
Massa Magra = 72 - 16.2 = 55.8 kg
BMR = 370 + (21.6 × 55.8) = 1575 kcal

TDEE:
  NEAT = 1575 × 1.55 = 2441 kcal
  Workout = 1575 × 0.05 × 4 = 315 kcal
  TDEE = 2441 + 315 = 2756 kcal

Target (ricomposizione = maintenance):
  Target = 2756 kcal

Macros:
  Proteine: 72 × 2.0 = 144g (576 kcal) → 21%
  Grassi: 2756 × 0.20 / 9 = 61g (549 kcal) → 20%
  Carbs: (2756 - 576 - 549) / 4 = 408g (1632 kcal) → 59%
```

**Dati dopo 14 Giorni (Giorno 15)**:
- Peso: 71.8 kg
- Body Fat: 21.8%

**Calcoli Giorno 15**:
```
Massa Grassa = 71.8 × 0.218 = 15.6 kg
Massa Magra = 71.8 - 15.6 = 56.2 kg
BMR = 370 + (21.6 × 56.2) = 1584 kcal
```

**Analisi Trend (14 giorni)**:
```
Delta Peso:
  (71.8 - 72.0) / (14 / 7) = -0.2 / 2 = -0.1 kg/settimana

Delta Massa Grassa:
  (15.6 - 16.2) / 2 = -0.6 / 2 = -0.3 kg/settimana

Delta Massa Magra:
  (56.2 - 55.8) / 2 = +0.4 / 2 = +0.2 kg/settimana

Delta Body Fat:
  (21.8 - 22.5) / 2 = -0.7 / 2 = -0.35%/settimana
```

**Classificazione**:
```javascript
IF (massaGrassa < -0.15 AND massaMagra > 0.1)
   -0.3 < -0.15 → TRUE
   +0.2 > 0.1 → TRUE

   → RECOMP_PERFECT ✅
```

**Raccomandazione**:
> "🔥 SANTO GRAAL! Perdi grasso E costruisci muscolo. Continua così!"

**Risultati Marco dopo 14 giorni**:
- ✅ Peso: -0.2 kg (leggera diminuzione)
- ✅ Massa Grassa: -0.6 kg (perdita grasso significativa)
- ✅ Massa Magra: +0.4 kg (guadagno muscolo)
- ✅ Body Fat: da 22.5% → 21.8% (-0.7%)
- ✅ BMR: +9 kcal (metabolismo più attivo)

### 9.2 Caso Studio: Laura - Muscle Loss

**Dati Iniziali**:
- Peso: 65 kg
- Body Fat: 28%
- Obiettivo: Cutting aggressivo
- Target iniziale: 1400 kcal (deficit -40%)

**Calcoli Iniziali**:
```
Massa Grassa = 65 × 0.28 = 18.2 kg
Massa Magra = 65 - 18.2 = 46.8 kg
BMR = 370 + (21.6 × 46.8) = 1381 kcal
TDEE ≈ 2330 kcal
Deficit = -930 kcal (-40% ⚠️ TROPPO AGGRESSIVO)
```

**Dopo 14 Giorni**:
- Peso: 63 kg (-2 kg)
- Body Fat: 28% (invariato)

**Calcoli**:
```
Massa Grassa = 63 × 0.28 = 17.64 kg
Massa Magra = 63 - 17.64 = 45.36 kg

Delta Peso = (63 - 65) / 2 = -1.0 kg/settimana ⚠️
Delta MG = (17.64 - 18.2) / 2 = -0.28 kg/settimana
Delta MM = (45.36 - 46.8) / 2 = -0.72 kg/settimana 🚨

Percentuale muscolo perso = 0.72 / 1.0 = 72% ⚠️
```

**Classificazione**:
```javascript
IF (peso < -0.3 AND massaMagra < -0.15)
   -1.0 < -0.3 → TRUE
   -0.72 < -0.15 → TRUE

   → MUSCLE_LOSS 🚨
```

**Raccomandazioni**:
1. 🚨 **AUMENTA calorie di 300 kcal immediatamente** (da 1400 → 1700)
2. 🥩 **Aumenta proteine a 163g/giorno** (2.5g/kg per preservare muscolo)
3. 💪 **Mantieni intensità allenamento, riduci volume**
4. 🏃 **Elimina cardio extra, focus su resistance training**

**Azione Correttiva**:
```
Nuovo Target:
  1400 + 300 = 1700 kcal (deficit -27%, più sostenibile)

Nuove Macros:
  Proteine: 65 × 2.5 = 163g (652 kcal) → 38%
  Grassi: 1700 × 0.25 / 9 = 47g (425 kcal) → 25%
  Carbs: (1700 - 652 - 425) / 4 = 156g (623 kcal) → 37%
```

### 9.3 Caso Studio: Giovanni - Plateau

**Dati Iniziali (8 settimane fa)**:
- Peso: 80 kg
- Body Fat: 25%

**Dopo 6 Settimane**:
- Peso: 77 kg (-3 kg)
- Body Fat: 23%
- Progressi lineari

**Ultime 2 Settimane (Plateau)**:
- Settimana 7: Peso 77.0 kg
- Settimana 8: Peso 77.1 kg

**Analisi Trend (14 giorni)**:
```
Delta Peso = (77.1 - 77.0) / 2 = +0.05 kg/settimana
Delta MG = +0.03 kg/settimana
Delta MM = +0.02 kg/settimana

abs(0.05) < 0.1 → TRUE (nessun movimento significativo)
```

**Classificazione**:
```javascript
IF (abs(peso) < 0.1 AND abs(massaGrassa) < 0.05)
   → PLATEAU ⚠️
```

**Spiegazione Fisiologica**:
- Adattamento metabolico dopo 6 settimane di deficit
- Riduzione attività NEAT spontanea
- Possibile ritenzione idrica da cortisolo alto
- Leptina ridotta (segnale fame)

**Raccomandazioni**:
1. ⚙️ **Diet Break**: porta calorie a maintenance (2400 kcal) per 10-14 giorni
2. 💪 **Mantieni allenamento** (preserva muscolo durante break)
3. 😴 **Migliora sonno e gestione stress** (riduce cortisolo)
4. 📊 **Dopo diet break**: riprendi deficit con -10% invece di -15%

**Strategia Diet Break**:
```
Durante Diet Break (10 giorni):
  Calorie: 2400 kcal (maintenance)
  Proteine: 160g (mantenute alte)
  Carbs: AUMENTATI (ripristina leptina e glicogeno)
  Grassi: AUMENTATI (supporto ormonale)

Dopo Diet Break:
  Nuovo deficit: -10% invece di -15%
  Target: 2400 × 0.90 = 2160 kcal

  Risultato atteso:
  - Metabolismo riattivato
  - NEAT aumentato
  - Leptina ripristinata
  - Aderenza migliore
```

---

## 10. Appendice

### 10.1 Glossario Termini

- **BMR** (Basal Metabolic Rate): Metabolismo basale, calorie bruciate a riposo
- **TDEE** (Total Daily Energy Expenditure): Dispendio energetico giornaliero totale
- **NEAT** (Non-Exercise Activity Thermogenesis): Termogenesi da attività non sportiva
- **Katch-McArdle**: Formula BMR basata su massa magra
- **Deficit Calorico**: Consumare meno calorie di quelle bruciate
- **Surplus Calorico**: Consumare più calorie di quelle bruciate
- **Ricomposizione Corporea**: Perdere grasso e guadagnare muscolo simultaneamente
- **Plateau**: Fase di stallo senza progressi
- **Diet Break**: Pausa dal deficit, calorie a maintenance

### 10.2 Riferimenti Scientifici

1. **Katch-McArdle Formula**:
   - Katch, F.I., & McArdle, W.D. (1996). *Introduction to Nutrition, Exercise, and Health*.

2. **Protein Requirements**:
   - Helms, E.R., et al. (2014). "A systematic review of dietary protein during caloric restriction in resistance trained lean athletes". *International Journal of Sport Nutrition and Exercise Metabolism*.

3. **Recomposition**:
   - Longland, T.M., et al. (2016). "Higher protein intake preserves lean mass and satiety with weight loss in athletes". *Medicine & Science in Sports & Exercise*.

4. **Diet Breaks**:
   - Byrne, N.M., et al. (2018). "Intermittent energy restriction improves weight loss efficiency in obese men". *International Journal of Obesity*.

### 10.3 Limiti e Considerazioni

**Limiti dell'Analisi**:
1. Variabilità giornaliera peso (acqua, glicogeno, cibo nell'intestino)
2. Accuratezza misurazione body fat (errore ±2-3%)
3. Fattori non considerati: stress, sonno, ciclo mestruale
4. NEAT può variare significativamente tra individui

**Raccomandazioni Uso**:
- Pesarsi sempre stessa ora/condizioni (mattino a digiuno post-bagno)
- Usare trend settimanali, non singole pesate
- Misurare body fat con stesso metodo (plicometro, bioimpedenza, DEXA)
- Considerare raccomandazioni come linee guida, non dogmi
- Consultare professionista per situazioni complesse

---

**Fine Documentazione Tecnica**

*Documento generato il 7 Febbraio 2026*
*Versione Software: 1.0*
*© 2026 Fitness Tracker Project*
