const { testConnection, executeQuery } = require('./src/config/databases');

async function testDatabase() {
  console.log('🧪 Probando conexión con MySQL...');
  
  try {
    // Probar conexión
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('✅ Conexión exitosa!');
      
      // Probar una consulta simple
      console.log('🧪 Probando consulta simple...');
      
    } else {
      console.log('❌ No se pudo conectar a la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
  
  process.exit(0);
}

testDatabase();








