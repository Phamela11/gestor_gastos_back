const { pool } = require('../config/databases');

//Funcion para registrar un usuario
const registerUser = async (req, res) => {
    try {
        const { nombre_usuario, correo, contrasena } = req.body;

        // Verificar si el usuario ya existe
        const [existingUsers] = await pool.execute(
            'SELECT id_usuario FROM usuario WHERE correo = ?',
            [correo]
        );
        
        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El correo ya está registrado'
            });
        }
        
        // Hash de la contraseña (en producción usarías bcrypt)
        const hashedPassword = contrasena; // Por ahora sin hash
        
        // Insertar nuevo usuario
        const [result] = await pool.execute(
            'INSERT INTO usuario (nombre_usuario, correo, contrasena) VALUES (?, ?, ?)',
            [nombre_usuario, correo, hashedPassword]
        );
        
        // Obtener el usuario creado
        const [newUser] = await pool.execute(
            'SELECT id_usuario, nombre_usuario, correo FROM usuario WHERE id_usuario = ?',
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: newUser[0]
        });
        
    } catch (error) {
        console.error('Error en registerUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
};

//Funcion para iniciar sesion
const loginUser = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        const [existingUsers] = await pool.execute(
            'SELECT id_usuario, nombre_usuario, correo, contrasena FROM usuario WHERE correo = ?',
            [correo]
        );
        if (existingUsers.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        const user = existingUsers[0];
        if (user.contrasena !== contrasena) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                id_usuario: user.id_usuario,
                nombre_usuario: user.nombre_usuario,
                correo: user.correo
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
                message: 'Error al iniciar sesión',
                error: error.message
            });
    }
};

//Funcion para obtener todos los usuarios
const getAllUser = async (req, res) => {
    try {
        const [user] = await pool.execute(
            'SELECT * FROM usuario'
        );
        res.status(200).json({
            success: true,
            message: 'Usuarios obtenidos exitosamente',
            total: user.length,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
};

//Funcion para eliminar usuario por ID
const deleteUser = async (req, res) => {
    try {
        const { id_usuario } = req.params;
        
        // Verificar si el usuario existe
        const [existingUser] = await pool.execute(
            'SELECT id_usuario FROM usuario WHERE id_usuario = ?',
            [id_usuario]
        );
        
        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Eliminar el usuario
        await pool.execute(
            'DELETE FROM usuario WHERE id_usuario = ?',
            [id_usuario]
        );
        
        res.status(200).json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error en deleteUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getAllUser,
    deleteUser
};