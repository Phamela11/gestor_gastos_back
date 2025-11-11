const express = require('express');
const router = express.Router();
const {
    createSale,
    getAllSales,
    getSaleById,
    updateSale,
    deleteSale,
    generateRetroactiveMovements
} = require('../controllers/saleController');

// Ruta para crear una venta
router.post('/', createSale);

// Ruta para generar movimientos retroactivos (debe ir antes de /:id para que no lo capture)
router.post('/generate-retroactive-movements', generateRetroactiveMovements);

// Ruta para obtener todas las ventas
router.get('/', getAllSales);

// Ruta para obtener una venta por ID
router.get('/:id', getSaleById);

// Ruta para actualizar una venta
router.put('/:id', updateSale);

// Ruta para eliminar una venta
router.delete('/:id', deleteSale);

module.exports = router;

