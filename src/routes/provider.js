const express = require('express');
const router = express.Router();
const {
    createProvider,
    getAllProviders,
    getProviderById,
    updateProvider,
    deleteProvider
} = require('../controllers/providerController');

router.post('/', createProvider);
router.get('/', getAllProviders);
router.get('/:id_provider', getProviderById);
router.put('/:id_provider', updateProvider);
router.delete('/:id_provider', deleteProvider);

module.exports = router;
