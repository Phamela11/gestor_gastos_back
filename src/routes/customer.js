const express = require('express');
const router = express.Router();
const { createCustomer, getAllCustomer, deleteCustomer, updateCustomer } = require('../controllers/customerController');

router.post('/', createCustomer);
router.get('/', getAllCustomer);
router.delete('/:id_cliente', deleteCustomer);
router.put('/:id_cliente', updateCustomer);

module.exports = router;
