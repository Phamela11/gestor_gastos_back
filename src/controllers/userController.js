const { pool } = require('../config/databases');

//Funcion para registrar un usuario
const createUser = async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);
        // Mapear los nombres de campos del frontend a los nombres esperados
        const { 
            nombre_completo, 
            telefono, 
            email, 
            contraseña, 
            rol 
        } = req.body;
        
        // Usar los valores mapeados o los originales como fallback
        const nombre = nombre_completo || req.body.nombre;
        const correo = email || req.body.correo;
        const contrasena = contraseña || req.body.contrasena;
        const fecha = new Date();


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
        
        // Insertar nuevo usuario
        const result = await pool.query(
            'INSERT INTO usuario (nombre, correo, fecha, telefono, contrasena, id_rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_usuario',
            [nombre, correo, fecha, telefono, hashedPassword, rol]
        );

        
        // Obtener el usuario creado con el nombre del rol
        const newUser = await pool.query(
            'SELECT u.id_usuario, u.nombre, u.correo, u.telefono, u.fecha, u.id_rol, r.nombre as rol_nombre FROM usuario u JOIN rol r ON u.id_rol = r.id_rol WHERE u.id_usuario = $1',
            [result.rows[0].id_usuario]
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: newUser.rows[0]
        });
        
    } catch (error) {
        console.error('Error en createUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario',
            error: error.message
        });
    }
};

//Funcion para obtener todos los usuarios
const getAllUser = async (req, res) => {
    try {
        const user = await pool.query(
            'SELECT u.*, r.nombre as rol FROM usuario u JOIN rol r ON u.id_rol = r.id_rol'
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
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
};
//Funcion para eliminar usuario por ID
const deleteUser = async (req, res) => {
    try {
        const { id_usuario } = req.params;
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
        await pool.query(
            'DELETE FROM usuario WHERE id_usuario = $1',
            [id_usuario]
        );
        res.status(200).json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error.message
        });
    }
};

//Funcion para actualizar usuario por ID
const updateUser = async (req, res) => {
    try {
        const { id_usuario } = req.params;
        console.log('Datos recibidos para actualizar:', req.body);
        
        // Mapear los nombres de campos del frontend a los nombres esperados
        const { 
            nombre_completo, 
            telefono, 
            email, 
            contraseña, 
            rol 
        } = req.body;
        
        // Usar los valores mapeados o los originales como fallback
        const nombre = nombre_completo || req.body.nombre;
        const correo = email || req.body.correo;
        const contrasena = contraseña || req.body.contrasena;

        // Validar que todos los campos requeridos estén presentes (excepto contraseña que es opcional)
        if (!nombre || !telefono || !correo || !rol) {
            return res.status(400).json({
                success: false,
                message: 'Los campos nombre, teléfono, correo y rol son requeridos para la actualización',
                missing: {
                    nombre: !nombre,
                    telefono: !telefono,
                    correo: !correo,
                    rol: !rol
                }
            });
        }

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
        // Si se proporciona contraseña, actualizar todos los campos incluyendo contraseña
        if (contrasena) {
            await pool.query(
                'UPDATE usuario SET nombre = $1, telefono = $2, correo = $3, contrasena = $4, id_rol = $5 WHERE id_usuario = $6',
                [nombre, telefono, correo, contrasena, rol, id_usuario]
            );
        } else {
            // Si no se proporciona contraseña, actualizar solo los otros campos
            await pool.query(
                'UPDATE usuario SET nombre = $1, telefono = $2, correo = $3, id_rol = $4 WHERE id_usuario = $5',
                [nombre, telefono, correo, rol, id_usuario]
            );
        }
        res.status(200).json({
            success: true,
            message: 'Usuario actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error en updateUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: error.message
        });
    }
};





module.exports = {
    createUser,
    getAllUser,
    deleteUser,
    updateUser
};