const express = require('express');
const router = express.Router();
const {
    createInventoryMovement,
    getAllInventoryMovements,
    getInventoryMovementById,
    getMovementsByInventory,
    getInventoryMovementSummary
} = require('../controllers/inventoryMovementController');

// Ruta para crear un movimiento de inventario
router.post('/', createInventoryMovement);

// Ruta para obtener todos los movimientos de inventario
router.get('/', getAllInventoryMovements);

// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros
// Ruta para obtener movimientos por inventario
router.get('/inventory/:id', getMovementsByInventory);

// Ruta para obtener resumen de movimientos por inventario
router.get('/inventory/:id/summary', getInventoryMovementSummary);

// Ruta para obtener un movimiento por ID (debe ir al final)
router.get('/:id', getInventoryMovementById);

module.exports = router;
