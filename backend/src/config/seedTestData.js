import { Measurement, User } from '../models/index.js';

/**
 * Script per inserire dati di test (14 giorni di misurazioni)
 *
 * Scenario: RICOMPOSIZIONE PERFETTA
 * - Settimana 1-2: Peso stabile/leggera diminuzione
 * - Body Fat: diminuisce gradualmente
 * - Massa Magra: aumenta gradualmente
 * - Risultato atteso: RECOMP_PERFECT con semaforo VERDE
 */

async function seedTestData() {
  console.log('🌱 Inizio seed dati di test...\n');

  // Verifica che esista user_id = 1
  const user = await User.findByPk(1);
  if (!user) {
    console.error('❌ User con id=1 non trovato. Crea prima un utente.');
    return;
  }

  console.log(`✅ User trovato: ${user.nome} ${user.cognome}`);
  console.log(`   Obiettivo: ${user.obiettivo}\n`);

  // Elimina misurazioni esistenti per evitare duplicati
  const deleted = await Measurement.destroy({
    where: { user_id: 1 }
  });
  console.log(`🗑️  Eliminate ${deleted} misurazioni esistenti\n`);

  // Dati di test: 14 giorni (dal più vecchio al più recente)
  // Scenario RECOMP_PERFECT:
  // - Settimana 1 (giorni 1-7): Peso ~72kg, BF ~22.5%, Massa magra ~55.8kg
  // - Settimana 2 (giorni 8-14): Peso ~71.8kg, BF ~21.8%, Massa magra ~56.2kg
  // Delta atteso: -0.2 kg/sett peso, -0.5 kg/sett grasso, +0.4 kg/sett muscolo

  const testMeasurements = [
    // SETTIMANA 1
    { day: 14, peso: 72.0, bodyFat: 22.5 },  // 14 giorni fa
    { day: 13, peso: 72.1, bodyFat: 22.5 },
    { day: 12, peso: 72.0, bodyFat: 22.4 },
    { day: 11, peso: 71.9, bodyFat: 22.3 },
    { day: 10, peso: 71.8, bodyFat: 22.3 },
    { day: 9, peso: 71.9, bodyFat: 22.2 },
    { day: 8, peso: 71.7, bodyFat: 22.1 },  // Fine settimana 1

    // SETTIMANA 2 (progressi visibili)
    { day: 7, peso: 71.6, bodyFat: 22.0 },
    { day: 6, peso: 71.5, bodyFat: 21.9 },
    { day: 5, peso: 71.7, bodyFat: 21.8 },
    { day: 4, peso: 71.6, bodyFat: 21.8 },
    { day: 3, peso: 71.8, bodyFat: 21.7 },
    { day: 2, peso: 71.7, bodyFat: 21.8 },
    { day: 1, peso: 71.8, bodyFat: 21.8 },  // Ieri
    { day: 0, peso: 71.9, bodyFat: 21.7 },  // Oggi
  ];

  console.log('📊 Inserimento misurazioni:\n');

  for (const m of testMeasurements) {
    const datamisurazione = new Date();
    datamisurazione.setDate(datamisurazione.getDate() - m.day);

    // Calcola massa grassa e massa magra
    const massaGrassa = (m.peso * m.bodyFat) / 100;
    const massaMagra = m.peso - massaGrassa;

    // Calcola BMR (formula Katch-McArdle: 370 + (21.6 × Massa Magra))
    const bmr = Math.round(370 + 21.6 * massaMagra);

    await Measurement.create({
      user_id: 1,
      data_misurazione: datamisurazione,
      peso: m.peso,
      body_fat_percent: m.bodyFat,
      massa_grassa: parseFloat(massaGrassa.toFixed(2)),
      massa_magra: parseFloat(massaMagra.toFixed(2)),
      bmr: bmr
    });

    const dateStr = datamisurazione.toISOString().split('T')[0];
    console.log(
      `  ${dateStr} (${m.day === 0 ? 'oggi' : m.day + 'gg fa'}): ` +
      `Peso ${m.peso}kg, BF ${m.bodyFat}%, ` +
      `MM ${massaMagra.toFixed(1)}kg, MG ${massaGrassa.toFixed(1)}kg, ` +
      `BMR ${bmr} kcal`
    );
  }

  console.log('\n✅ Seed completato!');
  console.log('\n📈 Trend atteso:');
  console.log('   • Delta peso: -0.2 kg/settimana (leggera diminuzione)');
  console.log('   • Delta massa grassa: -0.5 kg/settimana (perdita grasso)');
  console.log('   • Delta massa magra: +0.4 kg/settimana (guadagno muscolo)');
  console.log('   • Classificazione: RECOMP_PERFECT');
  console.log('   • Semaforo: VERDE ✅\n');
}

// Esegui seed se chiamato direttamente
seedTestData()
  .then(() => {
    console.log('🎉 Script completato con successo');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Errore durante il seed:', err);
    process.exit(1);
  });

export default seedTestData;
