const express = require('express');
const router = express.Router();


// Importar y usar rutas
const authRoutes = require('./auth');
const userRoutes = require('./users');
const productRoutes = require('./products');
const customerRoutes = require('./customer');
const licorType = require('./tplicor')

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/licor-type', licorType);
module.exports = router;