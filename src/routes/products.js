const express = require('express');
const router = express.Router();
const { createProduct, getAllProduct, deleteProduct, updateProduct } = require('../controllers/productsController');

router.post('/', createProduct);
router.get('/', getAllProduct);
router.delete('/:id_product', deleteProduct);
router.put('/:id_product', updateProduct);

module.exports = router;