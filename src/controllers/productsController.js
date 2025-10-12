const { pool } = require('../config/databases');

// Función para crear un producto
const createProduct = async (req, res) => {
    try {
        console.log('Datos recibidos para crear producto:', req.body);
        const { 
            nombre, 
            id_tipo_licor, 
            id_proveedor,
            precio_compra, 
            precio_venta, 
            stock 
        } = req.body;
        
        const fecha = new Date();

        // Validar que todos los campos requeridos estén presentes
        if (!nombre || !id_tipo_licor || !id_proveedor || !precio_compra || !precio_venta) {
            return res.status(400).json({
                success: false,
                message: 'Los campos nombre, id_tipo_licor, id_proveedor, precio_compra y precio_venta son requeridos',
                missing: {
                    nombre: !nombre,
                    id_tipo_licor: !id_tipo_licor,
                    id_proveedor: !id_proveedor,
                    precio_compra: !precio_compra,
                    precio_venta: !precio_venta
                }
            });
        }

        // Verificar que el tipo de licor existe
        const tipoLicorExists = await pool.query(
            'SELECT id_tipo_licor FROM tipo_licor WHERE id_tipo_licor = $1',
            [id_tipo_licor]
        );

        if (tipoLicorExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El tipo de licor especificado no existe'
            });
        }

        // Verificar que el proveedor existe
        const proveedorExists = await pool.query(
            'SELECT id_proveedor FROM proveedor WHERE id_proveedor = $1',
            [id_proveedor]
        );

        if (proveedorExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El proveedor especificado no existe'
            });
        }

        // Insertar nuevo producto
        const result = await pool.query(
            'INSERT INTO producto (nombre, id_tipo_licor, id_proveedor, precio_compra, precio_venta, fecha, stock) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_producto',
            [nombre, id_tipo_licor, id_proveedor, precio_compra, precio_venta, fecha, stock || 0]
        );

        // Obtener el producto creado con el nombre del tipo de licor y proveedor
        const newProduct = await pool.query(
            'SELECT p.*, tl.nombre as tipo_licor_nombre, pr.nombre as proveedor_nombre FROM producto p LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor LEFT JOIN proveedor pr ON p.id_proveedor = pr.id_proveedor WHERE p.id_producto = $1',
            [result.rows[0].id_producto]
        );
        
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: newProduct.rows[0]
        });
        
    } catch (error) {
        console.error('Error en createProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear producto',
            error: error.message
        });
    }
};

// Función para obtener todos los productos
const getAllProduct = async (req, res) => {
    try {
        const products = await pool.query(
            'SELECT p.*, tl.nombre as tipo_licor_nombre, pr.nombre as proveedor_nombre FROM producto p LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor LEFT JOIN proveedor pr ON p.id_proveedor = pr.id_proveedor ORDER BY p.id_producto DESC'
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
    try {
        const { id_product } = req.params;
        console.log('Datos recibidos para actualizar producto:', req.body);
        
        const { 
            nombre, 
            id_tipo_licor, 
            id_proveedor,
            precio_compra, 
            precio_venta, 
            stock 
        } = req.body;

        // Validar que todos los campos requeridos estén presentes
        if (!nombre || !id_tipo_licor || !id_proveedor || !precio_compra || !precio_venta) {
            return res.status(400).json({
                success: false,
                message: 'Los campos nombre, id_tipo_licor, id_proveedor, precio_compra y precio_venta son requeridos para la actualización',
                missing: {
                    nombre: !nombre,
                    id_tipo_licor: !id_tipo_licor,
                    id_proveedor: !id_proveedor,
                    precio_compra: !precio_compra,
                    precio_venta: !precio_venta
                }
            });
        }

        // Verificar si el producto existe
        const existingProduct = await pool.query(
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
        const tipoLicorExists = await pool.query(
            'SELECT id_tipo_licor FROM tipo_licor WHERE id_tipo_licor = $1',
            [id_tipo_licor]
        );

        if (tipoLicorExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El tipo de licor especificado no existe'
            });
        }

        // Verificar que el proveedor existe
        const proveedorExists = await pool.query(
            'SELECT id_proveedor FROM proveedor WHERE id_proveedor = $1',
            [id_proveedor]
        );

        if (proveedorExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El proveedor especificado no existe'
            });
        }

        // Actualizar el producto
        await pool.query(
            'UPDATE producto SET nombre = $1, id_tipo_licor = $2, id_proveedor = $3, precio_compra = $4, precio_venta = $5, stock = $6 WHERE id_producto = $7',
            [nombre, id_tipo_licor, id_proveedor, precio_compra, precio_venta, stock || 0, id_product]
        );

        // Obtener el producto actualizado con el nombre del tipo de licor y proveedor
        const updatedProduct = await pool.query(
            'SELECT p.*, tl.nombre as tipo_licor_nombre, pr.nombre as proveedor_nombre FROM producto p LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor LEFT JOIN proveedor pr ON p.id_proveedor = pr.id_proveedor WHERE p.id_producto = $1',
            [id_product]
        );
        
        res.status(200).json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: updatedProduct.rows[0]
        });
        
    } catch (error) {
        console.error('Error en updateProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto',
            error: error.message
        });
    }
};

// Función para eliminar un producto
const deleteProduct = async (req, res) => {
    try {
        const { id_product } = req.params;
        
        // Verificar si el producto existe
        const existingProduct = await pool.query(
            'SELECT id_producto FROM producto WHERE id_producto = $1',
            [id_product]
        );
        
        if (existingProduct.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        // Eliminar el producto
        await pool.query(
            'DELETE FROM producto WHERE id_producto = $1',
            [id_product]
        );
        
        res.status(200).json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error en deleteProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto',
            error: error.message
        });
    }
};

module.exports = {
    createProduct,
    getAllProduct,
    updateProduct,
    deleteProduct
};
