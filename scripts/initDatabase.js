// scripts/initDatabase.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
  console.log('🚀 Iniciando inicialización de bases de datos...');
  
  const configs = [
    {
      name: 'Perú',
      config: {
        host: process.env.PE_DB_HOST || 'dbreto-rimac.chg6ac68oakf.us-east-2.rds.amazonaws.com',
        user: process.env.PE_DB_USER || 'admin',
        password: process.env.PE_DB_PASSWORD || 'Inicios20222022$$$$$$',
        database: process.env.PE_DB_NAME || 'medical_appointments_pe',
        port: parseInt(process.env.PE_DB_PORT || '3306'),
      },
      country: 'PE'
    },
    {
      name: 'Chile',
      config: {
        host: process.env.CL_DB_HOST || 'dbreto-rimac.chg6ac68oakf.us-east-2.rds.amazonaws.com',
        user: process.env.CL_DB_USER || 'admin',
        password: process.env.CL_DB_PASSWORD || 'Inicios20222022$$$$$$',
        database: process.env.CL_DB_NAME || 'medical_appointments_cl',
        port: parseInt(process.env.CL_DB_PORT || '3306'),
      },
      country: 'CL'
    }
  ];

  for (const { name, config, country } of configs) {
    try {
      console.log(`\n📊 Procesando base de datos de ${name}...`);
      
      const connection = await mysql.createConnection(config);
      console.log(`✅ Conectado a la base de datos de ${name}`);
      
      // Crear tabla
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS appointments (
          id VARCHAR(36) PRIMARY KEY,
          insured_id VARCHAR(10) NOT NULL,
          schedule_id VARCHAR(10) NOT NULL,
          country_iso CHAR(2) NOT NULL DEFAULT '${country}',
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          processed_at TIMESTAMP NULL,
          
          INDEX idx_insured_id (insured_id),
          INDEX idx_schedule_id (schedule_id),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at),
          INDEX idx_country_iso (country_iso),
          
          CONSTRAINT chk_country_iso_${country.toLowerCase()} CHECK (country_iso = '${country}'),
          CONSTRAINT chk_status_${country.toLowerCase()} CHECK (status IN ('pending', 'completed', 'cancelled', 'processing'))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      
      await connection.execute(createTableSQL);
      console.log(`✅ Tabla 'appointments' creada/verificada en ${name}`);
      
      // Verificar tabla
      const [tables] = await connection.execute("SHOW TABLES LIKE 'appointments'");
      if (Array.isArray(tables) && tables.length > 0) {
        console.log(`✅ Tabla verificada en ${name}`);
      }
      
      // Cerrar conexión
      await connection.end();
      console.log(`🔐 Conexión cerrada para ${name}`);
      
    } catch (error) {
      console.error(`❌ Error en ${name}:`, error.message);
    }
  }
  
  console.log('\n🎉 Inicialización de bases de datos completada');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase().catch(console.error);
}

module.exports = { initDatabase };