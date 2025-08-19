const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host:'localhost',
  user: 'root',
  password: 'root',
  database: 'gestor_gastos',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    return false;
  }
}

// Exportar funciones y pool
module.exports = {
  pool,
  testConnection,
  dbConfig
};
