const express = require('express');
const router = express.Router();
const { 
    createCostoOperativo, 
    getAllCostosOperativos, 
    getCostoOperativoById,
    updateCostoOperativo,
    deleteCostoOperativo,
    getResumenPorCategoria
} = require('../controllers/costosOperativosController');

// Rutas CRUD
router.post('/', createCostoOperativo);
router.get('/', getAllCostosOperativos);
router.get('/resumen', getResumenPorCategoria);
router.get('/:id_costo', getCostoOperativoById);
router.put('/:id_costo', updateCostoOperativo);
router.delete('/:id_costo', deleteCostoOperativo);

module.exports = router;

