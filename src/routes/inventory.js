const express = require('express');
const router = express.Router();
const {
    createInventory,
    getAllInventory,
    getInventoryById,
    updateInventory,
    deleteInventory
} = require('../controllers/inventoryController');

// Ruta para crear un inventario
router.post('/', createInventory);

// Ruta para obtener todos los inventarios
router.get('/', getAllInventory);

// Ruta para obtener un inventario por ID
router.get('/:id', getInventoryById);

// Ruta para actualizar un inventario
router.put('/:id', updateInventory);

// Ruta para eliminar un inventario
router.delete('/:id', deleteInventory);

module.exports = router;
