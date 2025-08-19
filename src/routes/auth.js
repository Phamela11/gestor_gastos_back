const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getAllUser, deleteUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', getAllUser);
router.delete('/user/:id_usuario', deleteUser);

module.exports = router;