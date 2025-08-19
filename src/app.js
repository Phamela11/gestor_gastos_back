require('dotenv').config();
const express = require('express');
const { testConnection } = require('./config/databases');
const indexRoutes = require('./routes/index');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Función para inicializar la base de datos
async function initializeDatabase() {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('✅ Base de datos conectada');
    } else {
      console.log('⚠️  No se pudo conectar a la base de datos');
    }
  } catch (error) {
    console.error('❌ Error de base de datos:', error.message);
  }
}

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use('/api', indexRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando' });
});

app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  await initializeDatabase();
});

module.exports = app;