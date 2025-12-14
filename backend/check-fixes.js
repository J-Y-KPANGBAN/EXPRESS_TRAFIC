const db = require("./config/db");

async function verifyFixes() {
  console.log("🔍 Vérification des correctifs...\n");
  
  try {
    // 1. Vérifier l'ENUM de Reservations
    const [reservationsEnum] = await db.query(`
      SELECT COLUMN_TYPE 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
        AND table_name = 'Reservations' 
        AND column_name = 'etat_reservation'
    `);
    
    console.log("1. ENUM etat_reservation:", reservationsEnum[0]?.COLUMN_TYPE || "❌ Non trouvé");
    
    // 2. Vérifier les colonnes ajoutées
    const [columns] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
        AND table_name IN ('Reservations', 'Paiements')
        AND column_name IN ('ticket_pdf_url', 'expires_at', 'ticket_url', 'provider')
    `);
    
    console.log("\n2. Colonnes ajoutées:");
    columns.forEach(col => {
      console.log(`   ✅ ${col.TABLE_NAME}.${col.COLUMN_NAME}`);
    });
    
    // 3. Tester une requête avec 'expiree'
    const [test] = await db.query(`
      SELECT COUNT(*) as count 
      FROM Reservations 
      WHERE etat_reservation = 'expiree'
    `);
    
    console.log(`\n3. Réservations 'expiree': ${test[0].count}`);
    
    // 4. Vérifier une réservation en attente
    const [pending] = await db.query(`
      SELECT id, code_reservation, etat_reservation, expires_at
      FROM Reservations 
      WHERE etat_reservation = 'en_attente'
      LIMIT 1
    `);
    
    console.log("\n4. Exemple réservation en attente:");
    if (pending[0]) {
      console.log(`   ID: ${pending[0].id}, Code: ${pending[0].code_reservation}`);
      console.log(`   Expire à: ${pending[0].expires_at || 'Non défini'}`);
    }
    
    console.log("\n✅ Toutes les vérifications sont terminées!");
    
  } catch (error) {
    console.error("❌ Erreur de vérification:", error.message);
  } finally {
    process.exit();
  }
}

verifyFixes();