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

// Ruta para obtener un movimiento por ID
router.get('/:id', getInventoryMovementById);

// Ruta para obtener movimientos por inventario
router.get('/inventory/:id', getMovementsByInventory);

// Ruta para obtener resumen de movimientos por inventario
router.get('/inventory/:id/summary', getInventoryMovementSummary);

module.exports = router;
