const { pool } = require('../config/databases');

// Función para crear un producto
const createProduct = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        console.log('Datos recibidos para crear producto:', req.body);
        const { 
            nombre, 
            id_tipo_licor, 
            id_proveedores, // Opcional: puede ser un array
            precio_compra, 
            precio_venta
        } = req.body;
        
        const fecha = new Date();

        // Validar que todos los campos requeridos estén presentes (proveedores es opcional, puede ser array vacío)
        if (!nombre || !id_tipo_licor || precio_compra === undefined || precio_venta === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Los campos nombre, id_tipo_licor, precio_compra y precio_venta son requeridos',
                missing: {
                    nombre: !nombre,
                    id_tipo_licor: !id_tipo_licor,
                    precio_compra: precio_compra === undefined,
                    precio_venta: precio_venta === undefined
                }
            });
        }

        // Verificar que el tipo de licor existe
        const tipoLicorExists = await client.query(
            'SELECT id_tipo_licor FROM tipo_licor WHERE id_tipo_licor = $1',
            [id_tipo_licor]
        );

        if (tipoLicorExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El tipo de licor especificado no existe'
            });
        }

        // Verificar que todos los proveedores existen (solo si se proporcionaron)
        if (id_proveedores && Array.isArray(id_proveedores) && id_proveedores.length > 0) {
            for (const id_proveedor of id_proveedores) {
                const proveedorExists = await client.query(
                    'SELECT id_proveedor FROM proveedor WHERE id_proveedor = $1',
                    [id_proveedor]
                );

                if (proveedorExists.rows.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: `El proveedor con ID ${id_proveedor} no existe`
                    });
                }
            }
        }

        // Insertar nuevo producto
        const result = await client.query(
            'INSERT INTO producto (nombre, id_tipo_licor, precio_compra, precio_venta, fecha) VALUES ($1, $2, $3, $4, $5) RETURNING id_producto',
            [nombre, id_tipo_licor, precio_compra, precio_venta, fecha]
        );

        const productId = result.rows[0].id_producto;

        // Insertar relaciones en la tabla proveedor_producto (solo si se proporcionaron proveedores)
        if (id_proveedores && Array.isArray(id_proveedores) && id_proveedores.length > 0) {
            for (const id_proveedor of id_proveedores) {
                await client.query(
                    'INSERT INTO proveedor_producto (id_proveedor, id_producto) VALUES ($1, $2) ON CONFLICT (id_proveedor, id_producto) DO NOTHING',
                    [id_proveedor, productId]
                );
            }
        }

        await client.query('COMMIT');

        // Obtener el producto creado
        const newProduct = await pool.query(
            `SELECT p.id_producto, p.nombre, p.id_tipo_licor, p.precio_compra, p.precio_venta, p.fecha,
                    tl.nombre as tipo_licor_nombre
             FROM producto p 
             LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor 
             WHERE p.id_producto = $1`,
            [productId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: newProduct.rows[0]
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear producto',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Función para obtener todos los productos
const getAllProduct = async (req, res) => {
    try {
        const products = await pool.query(
            `SELECT p.id_producto, p.nombre, p.id_tipo_licor, p.precio_compra, p.precio_venta, p.fecha,
                    tl.nombre as tipo_licor_nombre,
                    STRING_AGG(pr.nombre, ', ') as proveedores_nombres,
                    ARRAY_AGG(pr.id_proveedor) as proveedores_ids
             FROM producto p 
             LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor 
             LEFT JOIN proveedor_producto pp ON p.id_producto = pp.id_producto
             LEFT JOIN proveedor pr ON pp.id_proveedor = pr.id_proveedor 
             GROUP BY p.id_producto, p.nombre, p.id_tipo_licor, p.precio_compra, p.precio_venta, p.fecha, tl.nombre
             ORDER BY p.id_producto DESC`
        );
        
        res.status(200).json({
            success: true,
            message: 'Productos obtenidos exitosamente',
            total: products.rows.length,
            data: products.rows
        });
    } catch (error) {
        console.error('Error en getAllProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        });
    }
};

// Función para actualizar un producto
const updateProduct = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { id_product } = req.params;
        console.log('Datos recibidos para actualizar producto:', req.body);
        
        const { 
            nombre, 
            id_tipo_licor, 
            id_proveedores, // Opcional: puede ser un array
            precio_compra, 
            precio_venta
        } = req.body;

        // Validar que todos los campos requeridos estén presentes (proveedores es opcional, puede ser array vacío)
        if (!nombre || !id_tipo_licor || precio_compra === undefined || precio_venta === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Los campos nombre, id_tipo_licor, precio_compra y precio_venta son requeridos para la actualización',
                missing: {
                    nombre: !nombre,
                    id_tipo_licor: !id_tipo_licor,
                    precio_compra: precio_compra === undefined,
                    precio_venta: precio_venta === undefined
                }
            });
        }

        // Verificar si el producto existe
        const existingProduct = await client.query(
            'SELECT id_producto FROM producto WHERE id_producto = $1',
            [id_product]
        );
        
        if (existingProduct.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Verificar que el tipo de licor existe
        const tipoLicorExists = await client.query(
            'SELECT id_tipo_licor FROM tipo_licor WHERE id_tipo_licor = $1',
            [id_tipo_licor]
        );

        if (tipoLicorExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El tipo de licor especificado no existe'
            });
        }

        // Verificar que todos los proveedores existen (solo si se proporcionaron)
        if (id_proveedores && Array.isArray(id_proveedores) && id_proveedores.length > 0) {
            for (const id_proveedor of id_proveedores) {
                const proveedorExists = await client.query(
                    'SELECT id_proveedor FROM proveedor WHERE id_proveedor = $1',
                    [id_proveedor]
                );

                if (proveedorExists.rows.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: `El proveedor con ID ${id_proveedor} no existe`
                    });
                }
            }
        }

        // Actualizar el producto
        await client.query(
            'UPDATE producto SET nombre = $1, id_tipo_licor = $2, precio_compra = $3, precio_venta = $4 WHERE id_producto = $5',
            [nombre, id_tipo_licor, precio_compra, precio_venta, id_product]
        );

        // Eliminar todas las relaciones existentes de proveedor_producto
        await client.query(
            'DELETE FROM proveedor_producto WHERE id_producto = $1',
            [id_product]
        );

        // Insertar las nuevas relaciones en la tabla proveedor_producto (solo si se proporcionaron proveedores)
        if (id_proveedores && Array.isArray(id_proveedores) && id_proveedores.length > 0) {
            for (const id_proveedor of id_proveedores) {
                await client.query(
                    'INSERT INTO proveedor_producto (id_proveedor, id_producto) VALUES ($1, $2)',
                    [id_proveedor, id_product]
                );
            }
        }

        await client.query('COMMIT');

        // Obtener el producto actualizado
        const updatedProduct = await pool.query(
            `SELECT p.id_producto, p.nombre, p.id_tipo_licor, p.precio_compra, p.precio_venta, p.fecha,
                    tl.nombre as tipo_licor_nombre
             FROM producto p 
             LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor 
             WHERE p.id_producto = $1`,
            [id_product]
        );
        
        res.status(200).json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: updatedProduct.rows[0]
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en updateProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Función para eliminar un producto
const deleteProduct = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { id_product } = req.params;
        
        // Verificar si el producto existe
        const existingProduct = await client.query(
            'SELECT id_producto FROM producto WHERE id_producto = $1',
            [id_product]
        );
        
        if (existingProduct.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        // Eliminar las relaciones en proveedor_producto primero
        await client.query(
            'DELETE FROM proveedor_producto WHERE id_producto = $1',
            [id_product]
        );
        
        // Eliminar el producto
        await client.query(
            'DELETE FROM producto WHERE id_producto = $1',
            [id_product]
        );
        
        await client.query('COMMIT');
        
        res.status(200).json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto',
            error: error.message
        });
    } finally {
        client.release();
    }
};

module.exports = {
    createProduct,
    getAllProduct,
    updateProduct,
    deleteProduct
};
