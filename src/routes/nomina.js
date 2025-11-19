const express = require('express');
const router = express.Router();
const { 
    getAllNominas,
    createNomina,
    updateNomina,
    deleteNomina,
    calcularHorasPorEmpleado,
    marcarComoPagado
} = require('../controllers/nominaController');

// Rutas CRUD
router.get('/', getAllNominas);
router.post('/', createNomina);
router.put('/:id', updateNomina);
router.delete('/:id', deleteNomina);

// Rutas especiales
router.post('/calcular-horas', calcularHorasPorEmpleado);
router.put('/:id/marcar-pagado', marcarComoPagado);

module.exports = router;

