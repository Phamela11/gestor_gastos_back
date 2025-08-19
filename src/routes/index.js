const express = require('express');
const router = express.Router();

// Importar y usar rutas
const authRoutes = require('./auth');
router.use('/auth', authRoutes);

module.exports = router;