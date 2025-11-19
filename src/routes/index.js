const express = require('express');
const router = express.Router();


// Importar y usar rutas
const authRoutes = require('./auth');
const userRoutes = require('./users');
const productRoutes = require('./products');
const customerRoutes = require('./customer');
const licorType = require('./tplicor');
const providerRoutes = require('./provider');
const inventoryRoutes = require('./inventory');
const inventoryMovementRoutes = require('./inventoryMovement');
const saleRoutes = require('./sale');
const reportsRoutes = require('./reports');
const timeRecordsRoutes = require('./timeRecords');
const nominaRoutes = require('./nomina');
const costosOperativosRoutes = require('./costosOperativos');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/licor-type', licorType);
router.use('/providers', providerRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/inventory-movements', inventoryMovementRoutes);
router.use('/sales', saleRoutes);
router.use('/reports', reportsRoutes);
router.use('/time-records', timeRecordsRoutes);
router.use('/nomina', nominaRoutes);
router.use('/costos-operativos', costosOperativosRoutes);

module.exports = router;