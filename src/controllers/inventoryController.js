const { pool } = require('../config/databases');

// Función para crear un inventario
const createInventory = async (req, res) => {
    try {
        console.log('Datos recibidos para crear inventario:', req.body);
        const { 
            id_producto, 
            cantidad = 0
        } = req.body;
        
        // Validar que todos los campos requeridos estén presentes
        if (!id_producto) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_producto es requerido',
                missing: {
                    id_producto: !id_producto
                }
            });
        }

        // Verificar que el producto existe
        const productoExists = await pool.query(
            'SELECT id_producto FROM producto WHERE id_producto = $1',
            [id_producto]
        );

        if (productoExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El producto especificado no existe'
            });
        }

        // Verificar si ya existe un inventario para este producto
        const existingInventory = await pool.query(
            'SELECT id_inventario FROM inventario WHERE id_producto = $1',
            [id_producto]
        );

        if (existingInventory.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un inventario para este producto'
            });
        }

        // Insertar nuevo inventario
        const result = await pool.query(
            'INSERT INTO inventario (id_producto, cantidad) VALUES ($1, $2) RETURNING id_inventario',
            [id_producto, cantidad]
        );

        // Obtener el inventario creado con información del producto
        const newInventory = await pool.query(
            `SELECT i.*, p.nombre as producto_nombre, p.precio_compra, p.precio_venta,
                    tl.nombre as tipo_licor_nombre 
             FROM inventario i 
             LEFT JOIN producto p ON i.id_producto = p.id_producto 
             LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor 
             WHERE i.id_inventario = $1`,
            [result.rows[0].id_inventario]
        );
        
        res.status(201).json({
            success: true,
            message: 'Inventario creado exitosamente',
            data: newInventory.rows[0]
        });
        
    } catch (error) {
        console.error('Error en createInventory:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear inventario',
            error: error.message
        });
    }
};

// Función para obtener todos los inventarios
const getAllInventory = async (req, res) => {
    try {
        const inventories = await pool.query(
            `SELECT i.*, p.nombre as producto_nombre, p.precio_compra, p.precio_venta,
                    tl.nombre as tipo_licor_nombre 
             FROM inventario i 
             LEFT JOIN producto p ON i.id_producto = p.id_producto 
             LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor 
             ORDER BY i.id_inventario DESC`
        );
        
        res.status(200).json({
            success: true,
            message: 'Inventarios obtenidos exitosamente',
            total: inventories.rows.length,
            data: inventories.rows
        });
    } catch (error) {
        console.error('Error en getAllInventory:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener inventarios',
            error: error.message
        });
    }
};

// Función para obtener un inventario por ID
const getInventoryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const inventory = await pool.query(
            `SELECT i.*, p.nombre as producto_nombre, p.precio_compra, p.precio_venta,
                    tl.nombre as tipo_licor_nombre 
             FROM inventario i 
             LEFT JOIN producto p ON i.id_producto = p.id_producto 
             LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor 
             WHERE i.id_inventario = $1`,
            [id]
        );

        if (inventory.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Inventario no encontrado'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Inventario obtenido exitosamente',
            data: inventory.rows[0]
        });
    } catch (error) {
        console.error('Error en getInventoryById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener inventario',
            error: error.message
        });
    }
};

// Función para actualizar un inventario
const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Datos recibidos para actualizar inventario:', req.body);
        
        const { 
            cantidad, 
        } = req.body;

        // Verificar si el inventario existe
        const existingInventory = await pool.query(
            'SELECT id_inventario FROM inventario WHERE id_inventario = $1',
            [id]
        );
        
        if (existingInventory.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Inventario no encontrado'
            });
        }

        // Actualizar el inventario
        await pool.query(
            'UPDATE inventario SET cantidad = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_inventario = $2',
            [cantidad, id]
        );

        // Obtener el inventario actualizado con información del producto
        const updatedInventory = await pool.query(
            `SELECT i.*, p.nombre as producto_nombre, p.precio_compra, p.precio_venta,
                    tl.nombre as tipo_licor_nombre 
             FROM inventario i 
             LEFT JOIN producto p ON i.id_producto = p.id_producto 
             LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor 
             WHERE i.id_inventario = $1`,
            [id]
        );
        
        res.status(200).json({
            success: true,
            message: 'Inventario actualizado exitosamente',
            data: updatedInventory.rows[0]
        });
        
    } catch (error) {
        console.error('Error en updateInventory:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar inventario',
            error: error.message
        });
    }
};

// Función para eliminar un inventario
const deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el inventario existe
        const existingInventory = await pool.query(
            'SELECT id_inventario FROM inventario WHERE id_inventario = $1',
            [id]
        );
        
        if (existingInventory.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Inventario no encontrado'
            });
        }

        // Verificar si hay movimientos asociados
        const movements = await pool.query(
            'SELECT COUNT(*) as count FROM movimiento_inventario WHERE id_inventario = $1',
            [id]
        );

        if (parseInt(movements.rows[0].count) > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el inventario porque tiene movimientos asociados'
            });
        }
        
        // Eliminar el inventario
        await pool.query(
            'DELETE FROM inventario WHERE id_inventario = $1',
            [id]
        );
        
        res.status(200).json({
            success: true,
            message: 'Inventario eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error en deleteInventory:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar inventario',
            error: error.message
        });
    }
};

module.exports = {
    createInventory,
    getAllInventory,
    getInventoryById,
    updateInventory,
    deleteInventory
};
