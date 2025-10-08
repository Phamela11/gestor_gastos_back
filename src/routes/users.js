const express = require('express');
const router = express.Router();
const { createUser, getAllUser, deleteUser, updateUser } = require('../controllers/userController');

router.post('/', createUser);
router.get('/', getAllUser);
router.delete('/:id_usuario', deleteUser);
router.put('/:id_usuario', updateUser);

module.exports = router;