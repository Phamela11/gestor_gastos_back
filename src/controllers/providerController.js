const { pool } = require('../config/databases');

// Crear proveedor
const createProvider = async (req, res) => {
    try {
        console.log('Datos recibidos para crear proveedor:', req.body);
        const { 
            nombre, 
            telefono, 
            direccion 
        } = req.body;
        
        const fecha = new Date();

        // Validar que todos los campos requeridos estén presentes
        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El campo nombre es requerido',
                missing: {
                    nombre: !nombre
                }
            });
        }

        // Insertar nuevo proveedor
        const result = await pool.query(
            'INSERT INTO proveedor (nombre, telefono, fecha, direccion) VALUES ($1, $2, $3, $4) RETURNING id_proveedor',
            [nombre, telefono || null, fecha, direccion || null]
        );

        // Obtener el proveedor creado
        const newProvider = await pool.query(
            'SELECT * FROM proveedor WHERE id_proveedor = $1',
            [result.rows[0].id_proveedor]
        );
        
        res.status(201).json({
            success: true,
            message: 'Proveedor creado exitosamente',
            data: newProvider.rows[0]
        });
        
    } catch (error) {
        console.error('Error en createProvider:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear proveedor',
            error: error.message
        });
    }
};

// Obtener todos los proveedores
const getAllProviders = async (req, res) => {
    try {
        const providers = await pool.query(
            'SELECT * FROM proveedor ORDER BY id_proveedor DESC'
        );
        
        res.status(200).json({
            success: true,
            message: 'Proveedores obtenidos exitosamente',
            total: providers.rows.length,
            data: providers.rows
        });
    } catch (error) {
        console.error('Error en getAllProviders:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proveedores',
            error: error.message
        });
    }
};

// Obtener un proveedor por ID
const getProviderById = async (req, res) => {
    try {
        const { id_provider } = req.params;
        
        const provider = await pool.query(
            'SELECT * FROM proveedor WHERE id_proveedor = $1',
            [id_provider]
        );
        
        if (provider.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Proveedor obtenido exitosamente',
            data: provider.rows[0]
        });
    } catch (error) {
        console.error('Error en getProviderById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proveedor',
            error: error.message
        });
    }
};

// Actualizar proveedor
const updateProvider = async (req, res) => {
    try {
        const { id_provider } = req.params;
        console.log('Datos recibidos para actualizar proveedor:', req.body);
        
        const { 
            nombre, 
            telefono, 
            direccion 
        } = req.body;

        // Validar que el campo requerido esté presente
        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El campo nombre es requerido para la actualización',
                missing: {
                    nombre: !nombre
                }
            });
        }

        // Verificar si el proveedor existe
        const existingProvider = await pool.query(
            'SELECT id_proveedor FROM proveedor WHERE id_proveedor = $1',
            [id_provider]
        );
        
        if (existingProvider.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }

        // Actualizar el proveedor
        await pool.query(
            'UPDATE proveedor SET nombre = $1, telefono = $2, direccion = $3 WHERE id_proveedor = $4',
            [nombre, telefono || null, direccion || null, id_provider]
        );

        // Obtener el proveedor actualizado
        const updatedProvider = await pool.query(
            'SELECT * FROM proveedor WHERE id_proveedor = $1',
            [id_provider]
        );
        
        res.status(200).json({
            success: true,
            message: 'Proveedor actualizado exitosamente',
            data: updatedProvider.rows[0]
        });
        
    } catch (error) {
        console.error('Error en updateProvider:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar proveedor',
            error: error.message
        });
    }
};

// Eliminar proveedor
const deleteProvider = async (req, res) => {
    try {
        const { id_provider } = req.params;
        
        // Verificar si el proveedor existe
        const existingProvider = await pool.query(
            'SELECT id_proveedor FROM proveedor WHERE id_proveedor = $1',
            [id_provider]
        );
        
        if (existingProvider.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }
        
        // Eliminar el proveedor
        await pool.query(
            'DELETE FROM proveedor WHERE id_proveedor = $1',
            [id_provider]
        );
        
        res.status(200).json({
            success: true,
            message: 'Proveedor eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error en deleteProvider:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar proveedor',
            error: error.message
        });
    }
};

module.exports = {
    createProvider,
    getAllProviders,
    getProviderById,
    updateProvider,
    deleteProvider
};
