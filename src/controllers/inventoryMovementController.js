const { pool } = require('../config/databases');

// Función para crear un movimiento de inventario
const createInventoryMovement = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('Datos recibidos para crear movimiento de inventario:', req.body);
        const { 
            id_inventario, 
            tipo_movimiento, 
            cantidad, 
            precio_unitario,
            id_proveedor
        } = req.body;
        
        // Validar que todos los campos requeridos estén presentes
        if (!id_inventario || !tipo_movimiento || !cantidad || precio_unitario === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Los campos id_inventario, tipo_movimiento, cantidad y precio_unitario son requeridos',
                missing: {
                    id_inventario: !id_inventario,
                    tipo_movimiento: !tipo_movimiento,
                    cantidad: !cantidad,
                    precio_unitario: precio_unitario === undefined
                }
            });
        }
        
        // Validar proveedor si es una entrada
        if (tipo_movimiento === 'ENTRADA' && !id_proveedor) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_proveedor es requerido para movimientos de ENTRADA'
            });
        }

        // Validar tipo de movimiento
        if (!['ENTRADA', 'SALIDA'].includes(tipo_movimiento)) {
            return res.status(400).json({
                success: false,
                message: 'El tipo_movimiento debe ser ENTRADA o SALIDA'
            });
        }

        // Validar cantidad
        if (cantidad <= 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser mayor a 0'
            });
        }

        // Validar precio unitario
        if (precio_unitario < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio_unitario debe ser mayor o igual a 0'
            });
        }

        // Verificar que el inventario existe
        const inventoryExists = await client.query(
            'SELECT id_inventario, cantidad FROM inventario WHERE id_inventario = $1',
            [id_inventario]
        );

        if (inventoryExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El inventario especificado no existe'
            });
        }

        const currentStock = inventoryExists.rows[0].cantidad;

        // Validar que hay suficiente stock para salidas
        if (tipo_movimiento === 'SALIDA' && currentStock < cantidad) {
            return res.status(400).json({
                success: false,
                message: 'No hay suficiente stock disponible para esta salida',
                stock_disponible: currentStock,
                cantidad_solicitada: cantidad
            });
        }

        // Insertar nuevo movimiento
        const result = await client.query(
            'INSERT INTO movimiento_inventario (id_inventario, tipo_movimiento, cantidad, precio_unitario, id_proveedor) VALUES ($1, $2, $3, $4, $5) RETURNING id_movimiento',
            [id_inventario, tipo_movimiento, cantidad, precio_unitario, id_proveedor || null]
        );

        // Calcular nueva cantidad de stock
        let newStock;
        if (tipo_movimiento === 'ENTRADA') {
            newStock = currentStock + cantidad;
        } else {
            newStock = currentStock - cantidad;
        }

        // Asegurar que el stock no sea negativo
        newStock = Math.max(0, newStock);

        // Actualizar el stock del inventario
        await client.query(
            'UPDATE inventario SET cantidad = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_inventario = $2',
            [newStock, id_inventario]
        );

        // Obtener el movimiento creado con información del inventario y producto
        const newMovement = await client.query(
            `SELECT m.*, i.cantidad as stock_actual, p.nombre as producto_nombre, p.precio_compra, p.precio_venta,
                    tl.nombre as tipo_licor_nombre, pr.nombre as proveedor_nombre
             FROM movimiento_inventario m 
             LEFT JOIN inventario i ON m.id_inventario = i.id_inventario 
             LEFT JOIN producto p ON i.id_producto = p.id_producto 
             LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor 
             LEFT JOIN proveedor pr ON m.id_proveedor = pr.id_proveedor
             WHERE m.id_movimiento = $1`,
            [result.rows[0].id_movimiento]
        );

        await client.query('COMMIT');
        
        res.status(201).json({
            success: true,
            message: 'Movimiento de inventario creado exitosamente',
            data: newMovement.rows[0]
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createInventoryMovement:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear movimiento de inventario',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Función para obtener todos los movimientos de inventario
const getAllInventoryMovements = async (req, res) => {
    try {
        const movements = await pool.query(
            `SELECT m.*, i.cantidad as stock_actual, p.nombre as producto_nombre, p.precio_compra, p.precio_venta,
                    tl.nombre as tipo_licor_nombre, pr.nombre as proveedor_nombre
             FROM movimiento_inventario m 
             LEFT JOIN inventario i ON m.id_inventario = i.id_inventario 
             LEFT JOIN producto p ON i.id_producto = p.id_producto 
             LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor
             LEFT JOIN proveedor pr ON m.id_proveedor = pr.id_proveedor
             ORDER BY m.fecha_movimiento DESC`
        );
        
        res.status(200).json({
            success: true,
            message: 'Movimientos de inventario obtenidos exitosamente',
            total: movements.rows.length,
            data: movements.rows
        });
    } catch (error) {
        console.error('Error en getAllInventoryMovements:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener movimientos de inventario',
            error: error.message
        });
    }
};

// Función para obtener un movimiento por ID
const getInventoryMovementById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const movement = await pool.query(
            `SELECT m.*, i.cantidad as stock_actual, p.nombre as producto_nombre, p.precio_compra, p.precio_venta,
                    tl.nombre as tipo_licor_nombre, pr.nombre as proveedor_nombre
             FROM movimiento_inventario m 
             LEFT JOIN inventario i ON m.id_inventario = i.id_inventario 
             LEFT JOIN producto p ON i.id_producto = p.id_producto 
             LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor 
             LEFT JOIN proveedor pr ON m.id_proveedor = pr.id_proveedor
             WHERE m.id_movimiento = $1`,
            [id]
        );

        if (movement.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Movimiento de inventario no encontrado'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Movimiento de inventario obtenido exitosamente',
            data: movement.rows[0]
        });
    } catch (error) {
        console.error('Error en getInventoryMovementById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener movimiento de inventario',
            error: error.message
        });
    }
};

// Función para obtener movimientos por inventario
const getMovementsByInventory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el inventario existe
        const inventoryExists = await pool.query(
            'SELECT id_inventario FROM inventario WHERE id_inventario = $1',
            [id]
        );

        if (inventoryExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Inventario no encontrado'
            });
        }

        const movements = await pool.query(
            `SELECT m.*, i.cantidad as stock_actual, p.nombre as producto_nombre, p.precio_compra, p.precio_venta,
                    tl.nombre as tipo_licor_nombre, pr.nombre as proveedor_nombre
             FROM movimiento_inventario m 
             LEFT JOIN inventario i ON m.id_inventario = i.id_inventario 
             LEFT JOIN producto p ON i.id_producto = p.id_producto 
             LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor
             LEFT JOIN proveedor pr ON m.id_proveedor = pr.id_proveedor
             WHERE m.id_inventario = $1 
             ORDER BY m.fecha_movimiento DESC`,
            [id]
        );
        
        res.status(200).json({
            success: true,
            message: 'Movimientos del inventario obtenidos exitosamente',
            total: movements.rows.length,
            data: movements.rows
        });
    } catch (error) {
        console.error('Error en getMovementsByInventory:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener movimientos del inventario',
            error: error.message
        });
    }
};

// Función para obtener resumen de movimientos por inventario
const getInventoryMovementSummary = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el inventario existe
        const inventoryExists = await pool.query(
            'SELECT id_inventario FROM inventario WHERE id_inventario = $1',
            [id]
        );

        if (inventoryExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Inventario no encontrado'
            });
        }

        // Obtener resumen de movimientos
        const summary = await pool.query(
            `SELECT 
                COUNT(*) as total_movimientos,
                COUNT(CASE WHEN tipo_movimiento = 'ENTRADA' THEN 1 END) as total_entradas,
                COUNT(CASE WHEN tipo_movimiento = 'SALIDA' THEN 1 END) as total_salidas,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'ENTRADA' THEN cantidad ELSE 0 END), 0) as cantidad_entradas,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'SALIDA' THEN cantidad ELSE 0 END), 0) as cantidad_salidas,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'ENTRADA' THEN total ELSE 0 END), 0) as valor_entradas,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'SALIDA' THEN total ELSE 0 END), 0) as valor_salidas,
                i.cantidad as stock_actual,
                p.nombre as producto_nombre
             FROM movimiento_inventario m 
             LEFT JOIN inventario i ON m.id_inventario = i.id_inventario 
             LEFT JOIN producto p ON i.id_producto = p.id_producto 
             WHERE m.id_inventario = $1`,
            [id]
        );
        
        res.status(200).json({
            success: true,
            message: 'Resumen de movimientos obtenido exitosamente',
            data: summary.rows[0]
        });
    } catch (error) {
        console.error('Error en getInventoryMovementSummary:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen de movimientos',
            error: error.message
        });
    }
};

module.exports = {
    createInventoryMovement,
    getAllInventoryMovements,
    getInventoryMovementById,
    getMovementsByInventory,
    getInventoryMovementSummary
};
