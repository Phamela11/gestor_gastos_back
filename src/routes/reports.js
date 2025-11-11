const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getSalesByPeriod,
    getTopProducts,
    getSalesByClient,
    getInventoryStatus,
    getSalesByUser,
    getSalesByLicorType,
    getProfitAnalysis
} = require('../controllers/reportsController');

// Rutas de reportes
router.get('/dashboard-stats', getDashboardStats);
router.get('/sales-by-period', getSalesByPeriod);
router.get('/top-products', getTopProducts);
router.get('/sales-by-client', getSalesByClient);
router.get('/inventory-status', getInventoryStatus);
router.get('/sales-by-user', getSalesByUser);
router.get('/sales-by-licor-type', getSalesByLicorType);
router.get('/profit-analysis', getProfitAnalysis);

module.exports = router;

