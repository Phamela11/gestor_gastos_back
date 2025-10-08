const { pool } = require('../config/databases');

//Funcion para registrar un usuario
const registerUser = async (req, res) => {
    try {
        const { nombre, correo, telefono, contrasena, id_rol } = req.body;

        // Verificar si el usuario ya existe
        const existingUsers = await pool.query(
            'SELECT id_usuario FROM usuario WHERE correo = $1',
            [correo]
        );
        
        if (existingUsers.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El correo ya está registrado'
            });
        }
        
        // Hash de la contraseña (en producción usarías bcrypt)
        const hashedPassword = contrasena; // Por ahora sin hash
        
        const fecha_creacion = new Date();
        // Insertar nuevo usuario
        const result = await pool.query(
            'INSERT INTO usuario (nombre, correo, fecha, telefono, contrasena, id_rol) VALUES ($1, $2, $3, $4, $5, $6)',
            [nombre, correo, fecha, telefono, hashedPassword, id_rol]
        );
        
        // Obtener el usuario creado con el nombre del rol
        const newUser = await pool.query(
            'SELECT u.id_usuario, u.nombre, u.correo, u.telefono, u.id_rol, r.nombre as rol_nombre FROM usuario u JOIN rol r ON u.id_rol = r.id_rol WHERE u.id_usuario = $1',
            [result.rows[0].id_usuario]
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: newUser.rows[0]
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
        const existingUsers = await pool.query(
            'SELECT u.id_usuario, u.nombre, u.correo, u.contrasena, u.id_rol, r.nombre as rol_nombre FROM usuario u JOIN rol r ON u.id_rol = r.id_rol WHERE u.correo = $1',
            [correo]
        );
        if (existingUsers.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        const user = existingUsers.rows[0];
        if (user.contrasena !== contrasena) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        if (user.rol_nombre == "administrador" || user.rol_nombre == "cajero"){
            res.status(200).json({
                success: true,
                message: 'Inicio de sesión exitoso',
                data: {
                    id_usuario: user.id_usuario,
                    nombre: user.nombre,
                    correo: user.correo,
                    rol: user.rol_nombre,
                    id_rol: user.id_rol
                }
            });
        }else{
            return res.status(401).json({
                success: false,
                message: 'Usuario no autorizado'
            });
        }


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
        const user = await pool.query(
            'SELECT u.*, r.nombre as rol_nombre FROM usuario u JOIN rol r ON u.id_rol = r.id_rol'
        );
        res.status(200).json({
            success: true,
            message: 'Usuarios obtenidos exitosamente',
            total: user.rows.length,
            data: user.rows
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
        const existingUser = await pool.query(
            'SELECT id_usuario FROM usuario WHERE id_usuario = $1',
            [id_usuario]
        );
        
        if (existingUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Eliminar el usuario
        await pool.query(
            'DELETE FROM usuario WHERE id_usuario = $1',
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