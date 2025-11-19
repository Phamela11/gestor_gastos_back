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

// Configuración de CORS para permitir cualquier origen
const corsOptions = {
  origin: [
    "https://9b6d32dd1336.ngrok-free.app",
    "http://localhost:5173",
    "192.168.40.88:5173"
  ],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-User-Id',
    'Accept',
    'Origin',
    'X-Requested-With',
    'ngrok-skip-browser-warning'
  ]
};

// Aplicar CORS antes de las rutas
app.use(cors(corsOptions));

// Routes
app.use('/api', indexRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando' });
});

// Escuchar en todas las interfaces de red (0.0.0.0) para permitir conexiones externas
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Accesible desde: http://localhost:${PORT} y http://0.0.0.0:${PORT}`);
  console.log(`📡 CORS configurado para permitir cualquier origen`);
  await initializeDatabase();
});

module.exports = app;