const { pool } = require('../config/databases');

// Función para crear una venta
const createSale = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('Datos recibidos para crear venta:', req.body);
        const { 
            id_cliente, 
            id_usuario,
            fecha,
            total,
            productos = []
        } = req.body;

        // Validar que todos los campos requeridos estén presentes
        if (!id_cliente || !id_usuario || !total || !productos || productos.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Los campos id_cliente, id_usuario, total y productos son requeridos',
                missing: {
                    id_cliente: !id_cliente,
                    id_usuario: !id_usuario,
                    total: !total,
                    productos: !productos || productos.length === 0
                }
            });
        }

        // Validar que el cliente existe
        const clienteExists = await client.query(
            'SELECT id_cliente FROM cliente WHERE id_cliente = $1',
            [id_cliente]
        );

        if (clienteExists.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'El cliente especificado no existe'
            });
        }

        // Obtener id_usuario del req.body (frontend) o del header X-User-Id (usuario logueado) como fallback
        let idUsuarioFinal = id_usuario || req.headers['x-user-id'] || req.user?.id_usuario;
        
        // Si viene como string desde el header, convertirlo a número
        if (idUsuarioFinal && typeof idUsuarioFinal === 'string') {
            idUsuarioFinal = parseInt(idUsuarioFinal);
        }
        
        // Validar que el usuario existe
        const usuarioExists = await client.query(
            'SELECT id_usuario FROM usuario WHERE id_usuario = $1',
            [idUsuarioFinal]
        );

        if (usuarioExists.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'El usuario especificado no existe'
            });
        }

        // Usar fecha proporcionada o fecha actual
        const fechaVenta = fecha || new Date().toISOString().split('T')[0];

        // Validar productos y calcular subtotal
        let subtotal = 0;
        const productosConInfo = [];

        for (const producto of productos) {
            const { id_producto, cantidad, precio_unitario } = producto;
            
            // Validar que el producto existe
            const productoExists = await client.query(
                'SELECT id_producto, nombre, precio_venta FROM producto WHERE id_producto = $1',
                [id_producto]
            );

            if (productoExists.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: `El producto con ID ${id_producto} no existe`
                });
            }

            const productSubtotal = cantidad * precio_unitario;
            subtotal += productSubtotal;

            // Agregar información completa del producto al JSONB
            productosConInfo.push({
                id_producto: id_producto,
                nombre: productoExists.rows[0].nombre,
                cantidad: cantidad,
                precio_unitario: precio_unitario,
                subtotal: productSubtotal
            });
        }

        // Calcular IVA (asumiendo 19% por defecto, puedes ajustarlo según tu lógica)
        const iva = Math.round(subtotal * 0.19);

        // Crear movimientos de inventario automáticos (SALIDA) para cada producto
        for (const producto of productos) {
            const { id_producto, cantidad, precio_unitario } = producto;
            
            // Buscar o crear entrada de inventario para este producto
            let inventoryResult = await client.query(
                'SELECT id_inventario, cantidad FROM inventario WHERE id_producto = $1',
                [id_producto]
            );
            
            let id_inventario;
            
            if (inventoryResult.rows.length === 0) {
                // Crear nueva entrada de inventario si no existe
                const newInventory = await client.query(
                    'INSERT INTO inventario (id_producto, cantidad) VALUES ($1, $2) RETURNING id_inventario',
                    [id_producto, 0]
                );
                id_inventario = newInventory.rows[0].id_inventario;
                inventoryResult = await client.query(
                    'SELECT id_inventario, cantidad FROM inventario WHERE id_inventario = $1',
                    [id_inventario]
                );
            } else {
                id_inventario = inventoryResult.rows[0].id_inventario;
                
                // Validar que hay suficiente stock para la venta
                const currentStock = inventoryResult.rows[0].cantidad;
                if (currentStock < cantidad) {
                    // Obtener nombre del producto para el mensaje de error
                    const productoInfo = productosConInfo.find(p => p.id_producto === id_producto);
                    const nombreProducto = productoInfo ? productoInfo.nombre : `ID: ${id_producto}`;
                    
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        message: `No hay suficiente stock para el producto ${nombreProducto}. Stock disponible: ${currentStock}, Cantidad solicitada: ${cantidad}`,
                        stock_disponible: currentStock,
                        cantidad_solicitada: cantidad,
                        id_producto: id_producto
                    });
                }
            }
            
            // Crear movimiento de inventario de tipo SALIDA
            await client.query(
                'INSERT INTO movimiento_inventario (id_inventario, tipo_movimiento, cantidad, precio_unitario, id_proveedor) VALUES ($1, $2, $3, $4, $5)',
                [id_inventario, 'SALIDA', cantidad, precio_unitario, null]
            );
            
            // Actualizar el stock del inventario (descontar)
            const currentStock = inventoryResult.rows[0].cantidad;
            const newStock = Math.max(0, currentStock - cantidad);
            
            await client.query(
                'UPDATE inventario SET cantidad = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_inventario = $2',
                [newStock, id_inventario]
            );
        }

        // Crear detalle de venta con subtotal, IVA y productos como JSONB
        const detalleResult = await client.query(
            'INSERT INTO detalle_venta (subtotal, iva, productos) VALUES ($1, $2, $3::jsonb) RETURNING id_detalle_venta',
            [subtotal, iva, JSON.stringify(productosConInfo)]
        );
        const id_detalle_venta = detalleResult.rows[0].id_detalle_venta;

        // Insertar la venta (sin estado, ya que no existe en tu esquema)
        const result = await client.query(
            'INSERT INTO venta (fecha, id_cliente, id_usuario, id_detalle_venta, total) VALUES ($1, $2, $3, $4, $5) RETURNING id_venta',
            [fechaVenta, id_cliente, idUsuarioFinal, id_detalle_venta, total]
        );

        // Obtener la venta creada con información relacionada
        const newSale = await client.query(
            `SELECT v.*, c.nombre as cliente_nombre, u.nombre as usuario_nombre
             FROM venta v 
             LEFT JOIN cliente c ON v.id_cliente = c.id_cliente 
             LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
             WHERE v.id_venta = $1`,
            [result.rows[0].id_venta]
        );

        // Obtener detalle de venta con productos desde JSONB
        const detalleVenta = await client.query(
            'SELECT subtotal, iva, productos FROM detalle_venta WHERE id_detalle_venta = $1',
            [id_detalle_venta]
        );

        await client.query('COMMIT');
        
        const saleData = {
            ...newSale.rows[0],
            productos: detalleVenta.rows[0]?.productos || productosConInfo,
            subtotal: detalleVenta.rows[0]?.subtotal || subtotal,
            iva: detalleVenta.rows[0]?.iva || iva
        };
        
        res.status(201).json({
            success: true,
            message: 'Venta creada exitosamente',
            data: saleData
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createSale:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear venta',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Función para obtener todas las ventas
const getAllSales = async (req, res) => {
    try {
        const sales = await pool.query(
            `SELECT v.*, c.nombre as cliente_nombre, u.nombre as usuario_nombre
             FROM venta v 
             LEFT JOIN cliente c ON v.id_cliente = c.id_cliente 
             LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
             ORDER BY v.fecha DESC, v.id_venta DESC`
        );
        
        // Obtener detalle de venta con productos desde JSONB para cada venta
        const salesWithProducts = await Promise.all(
            sales.rows.map(async (sale) => {
                try {
                    const detalleVenta = await pool.query(
                        'SELECT subtotal, iva, productos FROM detalle_venta WHERE id_detalle_venta = $1',
                        [sale.id_detalle_venta]
                    );
                    
                    return {
                        ...sale,
                        productos: detalleVenta.rows[0]?.productos || [],
                        subtotal: detalleVenta.rows[0]?.subtotal || 0,
                        iva: detalleVenta.rows[0]?.iva || 0
                    };
                } catch (productError) {
                    console.error('Error al obtener detalle de venta:', productError);
                    return {
                        ...sale,
                        productos: [],
                        subtotal: 0,
                        iva: 0
                    };
                }
            })
        );
        
        res.status(200).json({
            success: true,
            message: 'Ventas obtenidas exitosamente',
            total: salesWithProducts.length,
            data: salesWithProducts
        });
    } catch (error) {
        console.error('Error en getAllSales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ventas',
            error: error.message
        });
    }
};

// Función para obtener una venta por ID
const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sale = await pool.query(
            `SELECT v.*, c.nombre as cliente_nombre, u.nombre as usuario_nombre
             FROM venta v 
             LEFT JOIN cliente c ON v.id_cliente = c.id_cliente 
             LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
             WHERE v.id_venta = $1`,
            [id]
        );

        if (sale.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Venta no encontrada'
            });
        }

        // Obtener detalle de venta con productos desde JSONB
        const detalleVenta = await pool.query(
            'SELECT subtotal, iva, productos FROM detalle_venta WHERE id_detalle_venta = $1',
            [sale.rows[0].id_detalle_venta]
        );
        
        const saleData = {
            ...sale.rows[0],
            productos: detalleVenta.rows[0]?.productos || [],
            subtotal: detalleVenta.rows[0]?.subtotal || 0,
            iva: detalleVenta.rows[0]?.iva || 0
        };
        
        res.status(200).json({
            success: true,
            message: 'Venta obtenida exitosamente',
            data: saleData
        });
    } catch (error) {
        console.error('Error en getSaleById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener venta',
            error: error.message
        });
    }
};

// Función para actualizar una venta
const updateSale = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        console.log('Datos recibidos para actualizar venta:', req.body);
        
        const { 
            id_cliente,
            id_usuario, 
            fecha,
            total,
            productos = []
        } = req.body;

        // Verificar que la venta existe
        const saleExists = await client.query(
            'SELECT id_venta, id_detalle_venta FROM venta WHERE id_venta = $1',
            [id]
        );
        
        if (saleExists.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Venta no encontrada'
            });
        }

        const id_detalle_venta = saleExists.rows[0].id_detalle_venta;

        // Obtener productos anteriores de la venta para revertir movimientos
        const oldDetalle = await client.query(
            'SELECT productos FROM detalle_venta WHERE id_detalle_venta = $1',
            [id_detalle_venta]
        );
        const productosAnteriores = oldDetalle.rows[0]?.productos || [];

        // Revertir movimientos de inventario anteriores (sumar stock de vuelta)
        for (const productoAnterior of productosAnteriores) {
            const { id_producto, cantidad } = productoAnterior;
            
            // Buscar entrada de inventario
            const inventoryResult = await client.query(
                'SELECT id_inventario, cantidad FROM inventario WHERE id_producto = $1',
                [id_producto]
            );
            
            if (inventoryResult.rows.length > 0) {
                const id_inventario = inventoryResult.rows[0].id_inventario;
                const currentStock = inventoryResult.rows[0].cantidad;
                const newStock = currentStock + cantidad; // Revertir la salida
                
                // Actualizar stock
                await client.query(
                    'UPDATE inventario SET cantidad = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_inventario = $2',
                    [newStock, id_inventario]
                );
            }
        }

        // Validar cliente si se proporciona
        if (id_cliente) {
            const clienteExists = await client.query(
                'SELECT id_cliente FROM cliente WHERE id_cliente = $1',
                [id_cliente]
            );

            if (clienteExists.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'El cliente especificado no existe'
                });
            }
        }

        // Validar usuario si se proporciona
        if (id_usuario) {
            const usuarioExists = await client.query(
                'SELECT id_usuario FROM usuario WHERE id_usuario = $1',
                [id_usuario]
            );

            if (usuarioExists.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'El usuario especificado no existe'
                });
            }
        }

        // Si se proporcionan productos, actualizar el detalle de venta
        if (productos && productos.length > 0) {
            let subtotal = 0;
            const productosConInfo = [];

            for (const producto of productos) {
                const { id_producto, cantidad, precio_unitario } = producto;
                
                // Validar que el producto existe
                const productoExists = await client.query(
                    'SELECT id_producto, nombre, precio_venta FROM producto WHERE id_producto = $1',
                    [id_producto]
                );

                if (productoExists.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        message: `El producto con ID ${id_producto} no existe`
                    });
                }

                const productSubtotal = cantidad * precio_unitario;
                subtotal += productSubtotal;

                // Agregar información completa del producto al JSONB
                productosConInfo.push({
                    id_producto: id_producto,
                    nombre: productoExists.rows[0].nombre,
                    cantidad: cantidad,
                    precio_unitario: precio_unitario,
                    subtotal: productSubtotal
                });
            }

            // Calcular IVA (19% por defecto)
            const iva = Math.round(subtotal * 0.19);

            // Crear movimientos de inventario automáticos (SALIDA) para cada producto nuevo
            for (const producto of productos) {
                const { id_producto, cantidad, precio_unitario } = producto;
                
                // Buscar o crear entrada de inventario para este producto
                let inventoryResult = await client.query(
                    'SELECT id_inventario, cantidad FROM inventario WHERE id_producto = $1',
                    [id_producto]
                );
                
                let id_inventario;
                
                if (inventoryResult.rows.length === 0) {
                    // Crear nueva entrada de inventario si no existe
                    const newInventory = await client.query(
                        'INSERT INTO inventario (id_producto, cantidad) VALUES ($1, $2) RETURNING id_inventario',
                        [id_producto, 0]
                    );
                    id_inventario = newInventory.rows[0].id_inventario;
                    inventoryResult = await client.query(
                        'SELECT id_inventario, cantidad FROM inventario WHERE id_inventario = $1',
                        [id_inventario]
                    );
                } else {
                    id_inventario = inventoryResult.rows[0].id_inventario;
                    
                    // Validar que hay suficiente stock para la venta
                    const currentStock = inventoryResult.rows[0].cantidad;
                    if (currentStock < cantidad) {
                        // Obtener nombre del producto para el mensaje de error
                        const productoInfo = productosConInfo.find(p => p.id_producto === id_producto);
                        const nombreProducto = productoInfo ? productoInfo.nombre : `ID: ${id_producto}`;
                        
                        await client.query('ROLLBACK');
                        return res.status(400).json({
                            success: false,
                            message: `No hay suficiente stock para el producto ${nombreProducto}. Stock disponible: ${currentStock}, Cantidad solicitada: ${cantidad}`,
                            stock_disponible: currentStock,
                            cantidad_solicitada: cantidad,
                            id_producto: id_producto
                        });
                    }
                }
                
                // Crear movimiento de inventario de tipo SALIDA
                await client.query(
                    'INSERT INTO movimiento_inventario (id_inventario, tipo_movimiento, cantidad, precio_unitario, id_proveedor) VALUES ($1, $2, $3, $4, $5)',
                    [id_inventario, 'SALIDA', cantidad, precio_unitario, null]
                );
                
                // Actualizar el stock del inventario (descontar)
                const currentStock = inventoryResult.rows[0].cantidad;
                const newStock = Math.max(0, currentStock - cantidad);
                
                await client.query(
                    'UPDATE inventario SET cantidad = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_inventario = $2',
                    [newStock, id_inventario]
                );
            }

            // Actualizar detalle de venta con nuevos productos
            await client.query(
                'UPDATE detalle_venta SET subtotal = $1, iva = $2, productos = $3::jsonb WHERE id_detalle_venta = $4',
                [subtotal, iva, JSON.stringify(productosConInfo), id_detalle_venta]
            );
        }

        // Actualizar la venta
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (id_cliente) {
            updateFields.push(`id_cliente = $${paramIndex}`);
            updateValues.push(id_cliente);
            paramIndex++;
        }
        if (id_usuario) {
            updateFields.push(`id_usuario = $${paramIndex}`);
            updateValues.push(id_usuario);
            paramIndex++;
        }
        if (fecha) {
            updateFields.push(`fecha = $${paramIndex}`);
            updateValues.push(fecha);
            paramIndex++;
        }
        if (total !== undefined) {
            updateFields.push(`total = $${paramIndex}`);
            updateValues.push(total);
            paramIndex++;
        }

        if (updateFields.length > 0) {
            updateValues.push(id);
            await client.query(
                `UPDATE venta SET ${updateFields.join(', ')} WHERE id_venta = $${paramIndex}`,
                updateValues
            );
        }

        // Obtener la venta actualizada
        const updatedSale = await client.query(
            `SELECT v.*, c.nombre as cliente_nombre, u.nombre as usuario_nombre
             FROM venta v 
             LEFT JOIN cliente c ON v.id_cliente = c.id_cliente 
             LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
             WHERE v.id_venta = $1`,
            [id]
        );

        // Obtener detalle de venta actualizado con productos desde JSONB
        const detalleVenta = await client.query(
            'SELECT subtotal, iva, productos FROM detalle_venta WHERE id_detalle_venta = $1',
            [id_detalle_venta]
        );

        await client.query('COMMIT');
        
        const saleData = {
            ...updatedSale.rows[0],
            productos: detalleVenta.rows[0]?.productos || [],
            subtotal: detalleVenta.rows[0]?.subtotal || 0,
            iva: detalleVenta.rows[0]?.iva || 0
        };
        
        res.status(200).json({
            success: true,
            message: 'Venta actualizada exitosamente',
            data: saleData
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en updateSale:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar venta',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Función para eliminar una venta
const deleteSale = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        
        // Verificar que la venta existe
        const saleExists = await client.query(
            'SELECT id_venta, id_detalle_venta FROM venta WHERE id_venta = $1',
            [id]
        );
        
        if (saleExists.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Venta no encontrada'
            });
        }

        const id_detalle_venta = saleExists.rows[0].id_detalle_venta;

        // Eliminar la venta (esto eliminará automáticamente el detalle_venta por CASCADE si está configurado)
        await client.query(
            'DELETE FROM venta WHERE id_venta = $1',
            [id]
        );

        // Eliminar el detalle de venta (si no está configurado CASCADE)
        await client.query(
            'DELETE FROM detalle_venta WHERE id_detalle_venta = $1',
            [id_detalle_venta]
        ).catch(() => {
            // Si falla (probablemente por CASCADE), está bien
        });

        await client.query('COMMIT');
        
        res.status(200).json({
            success: true,
            message: 'Venta eliminada exitosamente'
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteSale:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar venta',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Función para generar movimientos de inventario retroactivos para ventas existentes
const generateRetroactiveMovements = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Obtener todas las ventas
        const sales = await client.query(
            `SELECT v.id_venta, v.fecha, dv.productos 
             FROM venta v 
             INNER JOIN detalle_venta dv ON v.id_detalle_venta = dv.id_detalle_venta
             ORDER BY v.fecha ASC, v.id_venta ASC`
        );
        
        let movementsCreated = 0;
        let errors = [];
        
        for (const sale of sales.rows) {
            const productos = sale.productos || [];
            
            if (!Array.isArray(productos) || productos.length === 0) {
                continue;
            }
            
            for (const producto of productos) {
                const { id_producto, cantidad, precio_unitario } = producto;
                
                if (!id_producto || !cantidad || precio_unitario === undefined) {
                    continue;
                }
                
                // Verificar si ya existe un movimiento de salida para esta venta
                const existingMovement = await client.query(
                    `SELECT COUNT(*) as count 
                     FROM movimiento_inventario m
                     INNER JOIN inventario i ON m.id_inventario = i.id_inventario
                     WHERE i.id_producto = $1 
                     AND m.tipo_movimiento = 'SALIDA' 
                     AND m.cantidad = $2 
                     AND m.precio_unitario = $3
                     AND DATE(m.fecha_movimiento) = $4`,
                    [id_producto, cantidad, precio_unitario, sale.fecha]
                );
                
                // Si ya existe un movimiento similar para esta fecha, saltar
                if (parseInt(existingMovement.rows[0].count) > 0) {
                    continue;
                }
                
                // Buscar o crear entrada de inventario para este producto
                let inventoryResult = await client.query(
                    'SELECT id_inventario, cantidad FROM inventario WHERE id_producto = $1',
                    [id_producto]
                );
                
                let id_inventario;
                
                if (inventoryResult.rows.length === 0) {
                    // Crear nueva entrada de inventario si no existe
                    const newInventory = await client.query(
                        'INSERT INTO inventario (id_producto, cantidad) VALUES ($1, $2) RETURNING id_inventario',
                        [id_producto, 0]
                    );
                    id_inventario = newInventory.rows[0].id_inventario;
                    inventoryResult = await client.query(
                        'SELECT id_inventario, cantidad FROM inventario WHERE id_inventario = $1',
                        [id_inventario]
                    );
                } else {
                    id_inventario = inventoryResult.rows[0].id_inventario;
                }
                
                // Crear movimiento de inventario de tipo SALIDA
                await client.query(
                    `INSERT INTO movimiento_inventario (id_inventario, tipo_movimiento, cantidad, precio_unitario, id_proveedor, fecha_movimiento) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [id_inventario, 'SALIDA', cantidad, precio_unitario, null, sale.fecha]
                );
                
                // Actualizar el stock del inventario (descontar)
                const currentStock = inventoryResult.rows[0].cantidad;
                const newStock = Math.max(0, currentStock - cantidad);
                
                await client.query(
                    'UPDATE inventario SET cantidad = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_inventario = $2',
                    [newStock, id_inventario]
                );
                
                movementsCreated++;
            }
        }
        
        await client.query('COMMIT');
        
        res.status(200).json({
            success: true,
            message: `Movimientos retroactivos generados exitosamente`,
            movementsCreated: movementsCreated,
            salesProcessed: sales.rows.length,
            errors: errors.length > 0 ? errors : undefined
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en generateRetroactiveMovements:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar movimientos retroactivos',
            error: error.message
        });
    } finally {
        client.release();
    }
};

module.exports = {
    createSale,
    getAllSales,
    getSaleById,
    updateSale,
    deleteSale,
    generateRetroactiveMovements
};
