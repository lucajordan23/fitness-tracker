import { Measurement, User } from '../models/index.js';

/**
 * Script seed per scenario BULKING DIRTY
 *
 * Situazione: Surplus calorico troppo aggressivo
 * - Peso: aumento rapido (+1 kg/settimana)
 * - Massa Grassa: aumento eccessivo (+0.9 kg/settimana)
 * - Massa Magra: aumento minimo (+0.1 kg/settimana)
 * - Risultato: Solo 10% del peso guadagnato è muscolo → BULKING_DIRTY
 */

async function seedBulkingDirty() {
  console.log('🌱 Inizio seed scenario BULKING DIRTY...\n');

  // Verifica user
  const user = await User.findByPk(1);
  if (!user) {
    console.error('❌ User con id=1 non trovato.');
    return;
  }

  console.log(`✅ User: ${user.nome} ${user.cognome}`);

  // Aggiorna obiettivo a bulking
  await user.update({ obiettivo: 'bulking' });
  console.log(`🎯 Obiettivo aggiornato: BULKING\n`);

  // Elimina misurazioni esistenti
  const deleted = await Measurement.destroy({ where: { user_id: 1 } });
  console.log(`🗑️  Eliminate ${deleted} misurazioni esistenti\n`);

  // Dati di test: 14 giorni di bulking troppo aggressivo
  // Settimana 1: Peso 75kg, BF 15%
  // Settimana 2: Peso 77kg, BF 17% (troppo grasso!)
  const testMeasurements = [
    // SETTIMANA 1 (14 giorni fa - 8 giorni fa)
    { day: 14, peso: 75.0, bodyFat: 15.0 },   // Partenza
    { day: 13, peso: 75.2, bodyFat: 15.1 },
    { day: 12, peso: 75.4, bodyFat: 15.2 },
    { day: 11, peso: 75.6, bodyFat: 15.3 },
    { day: 10, peso: 75.8, bodyFat: 15.5 },
    { day: 9, peso: 76.0, bodyFat: 15.7 },
    { day: 8, peso: 76.2, bodyFat: 15.9 },

    // SETTIMANA 2 (7 giorni fa - oggi)
    { day: 7, peso: 76.4, bodyFat: 16.1 },
    { day: 6, peso: 76.6, bodyFat: 16.3 },
    { day: 5, peso: 76.8, bodyFat: 16.5 },
    { day: 4, peso: 77.0, bodyFat: 16.7 },
    { day: 3, peso: 77.2, bodyFat: 16.9 },
    { day: 2, peso: 77.4, bodyFat: 17.0 },
    { day: 1, peso: 77.6, bodyFat: 17.1 },
    { day: 0, peso: 77.8, bodyFat: 17.2 },    // Oggi: +2.8kg in 2 settimane!
  ];

  console.log('📊 Inserimento misurazioni BULKING DIRTY:\n');

  for (const m of testMeasurements) {
    const datamisurazione = new Date();
    datamisurazione.setDate(datamisurazione.getDate() - m.day);

    // Calcola composizione corporea
    const massaGrassa = (m.peso * m.bodyFat) / 100;
    const massaMagra = m.peso - massaGrassa;
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
      `  ${dateStr}: Peso ${m.peso}kg, BF ${m.bodyFat.toFixed(1)}%, ` +
      `MM ${massaMagra.toFixed(1)}kg, MG ${massaGrassa.toFixed(1)}kg`
    );
  }

  // Calcola i delta per mostrare la situazione
  const start = testMeasurements[0];
  const end = testMeasurements[testMeasurements.length - 1];

  const startMG = (start.peso * start.bodyFat) / 100;
  const startMM = start.peso - startMG;
  const endMG = (end.peso * end.bodyFat) / 100;
  const endMM = end.peso - endMG;

  const deltaPeso = end.peso - start.peso;
  const deltaMG = endMG - startMG;
  const deltaMM = endMM - startMM;
  const percentualeMuscolo = (deltaMM / deltaPeso) * 100;

  console.log('\n⚠️  SITUAZIONE CRITICA - BULKING DIRTY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Periodo: ${testMeasurements.length} giorni (2 settimane)`);
  console.log(`   Peso guadagnato: +${deltaPeso.toFixed(1)} kg (+${(deltaPeso/2).toFixed(2)} kg/sett) 🔴`);
  console.log(`   Massa Grassa: +${deltaMG.toFixed(2)} kg (+${(deltaMG/2).toFixed(2)} kg/sett) 🔴`);
  console.log(`   Massa Magra: +${deltaMM.toFixed(2)} kg (+${(deltaMM/2).toFixed(2)} kg/sett) ⚠️`);
  console.log(`   Body Fat: ${start.bodyFat.toFixed(1)}% → ${end.bodyFat.toFixed(1)}% (+${(end.bodyFat - start.bodyFat).toFixed(1)}%) 🔴`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   % Muscolo guadagnato: ${percentualeMuscolo.toFixed(0)}% (target >60%) 🚨`);
  console.log(`   % Grasso guadagnato: ${((deltaMG/deltaPeso)*100).toFixed(0)}% (troppo alto!) 🚨`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 Classificazione attesa:');
  console.log('   Codice: BULKING_DIRTY');
  console.log('   Semaforo: 🔴 ROSSO');
  console.log('   Status: Critico\n');

  console.log('💡 Raccomandazioni attese:');
  console.log('   1. 🚨 Riduci surplus calorico del 30-40%');
  console.log('   2. 🥩 Mantieni proteine alte (1.8g/kg)');
  console.log('   3. 🏃 Aggiungi cardio LISS 2-3x/settimana');
  console.log('   4. 💪 Aumenta intensità allenamento resistance\n');

  console.log('✅ Seed completato!');
  console.log('🌐 Apri http://localhost:5173 per vedere l\'analisi\n');
}

// Esegui seed
seedBulkingDirty()
  .then(() => {
    console.log('🎉 Script completato');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Errore:', err);
    process.exit(1);
  });

export default seedBulkingDirty;
