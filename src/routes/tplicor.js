const express = require('express');
const router = express.Router();
const {
    createTipoLicor,
    getAllTipoLicor,
    updateTipoLicor,
    deleteTipoLicor
} = require('../controllers/tplicorController');

router.post('/', createTipoLicor);
router.get('/', getAllTipoLicor);
router.put('/:id_tipo_licor', updateTipoLicor);
router.delete('/:id_tipo_licor', deleteTipoLicor);

module.exports = router;