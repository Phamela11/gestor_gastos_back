const { Pool } = require('pg');

// Configuración de la base de datos PostgreSQL
const dbConfig = {
  host: 'localhost',
  user: 'postgres',
  password: '0',
  database: 'licorera',
  port: 5432,
  max: 10, // máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Crear pool de conexiones
const pool = new Pool(dbConfig);

// Función para probar la conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error.message);
    return false;
  }
}

// Exportar funciones y pool
module.exports = {
  pool,
  testConnection,
  dbConfig
};
