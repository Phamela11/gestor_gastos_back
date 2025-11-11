const { pool } = require('../config/databases');

// Obtener estadísticas generales del dashboard
const getDashboardStats = async (req, res) => {
    try {
        // Total de ventas
        const totalVentas = await pool.query(
            'SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as monto_total FROM venta'
        );

        // Total de productos
        const totalProductos = await pool.query(
            'SELECT COUNT(*) as total FROM producto'
        );

        // Total de clientes
        const totalClientes = await pool.query(
            'SELECT COUNT(*) as total FROM cliente'
        );

        // Productos con stock bajo (menos de 10 unidades)
        const stockBajo = await pool.query(
            'SELECT COUNT(*) as total FROM inventario WHERE cantidad < 10'
        );

        res.status(200).json({
            success: true,
            data: {
                total_ventas: parseInt(totalVentas.rows[0].total),
                monto_total_ventas: parseFloat(totalVentas.rows[0].monto_total),
                total_productos: parseInt(totalProductos.rows[0].total),
                total_clientes: parseInt(totalClientes.rows[0].total),
                productos_stock_bajo: parseInt(stockBajo.rows[0].total)
            }
        });
    } catch (error) {
        console.error('Error en getDashboardStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas del dashboard',
            error: error.message
        });
    }
};

// Obtener ventas por período (últimos 30 días)
const getSalesByPeriod = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const query = `
            SELECT 
                DATE(fecha) as fecha,
                COUNT(*) as cantidad_ventas,
                COALESCE(SUM(total), 0) as total_ventas
            FROM venta
            WHERE fecha >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
            GROUP BY DATE(fecha)
            ORDER BY fecha ASC
        `;

        const result = await pool.query(query);

        res.status(200).json({
            success: true,
            data: result.rows.map(row => ({
                fecha: row.fecha,
                cantidad_ventas: parseInt(row.cantidad_ventas),
                total_ventas: parseFloat(row.total_ventas)
            }))
        });
    } catch (error) {
        console.error('Error en getSalesByPeriod:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ventas por período',
            error: error.message
        });
    }
};

// Obtener top productos más vendidos
const getTopProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const query = `
            SELECT 
                p.id_producto,
                p.nombre,
                tl.nombre as tipo_licor,
                COUNT(dv.id_detalle_venta) as veces_vendido,
                SUM((productos->>'cantidad')::int) as cantidad_total,
                SUM((productos->>'subtotal')::numeric) as ventas_totales
            FROM producto p
            LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor
            LEFT JOIN detalle_venta dv ON dv.productos @> jsonb_build_array(jsonb_build_object('id_producto', p.id_producto))
            WHERE dv.id_detalle_venta IS NOT NULL
            GROUP BY p.id_producto, p.nombre, tl.nombre
            ORDER BY cantidad_total DESC
            LIMIT $1
        `;

        const result = await pool.query(query, [parseInt(limit)]);

        res.status(200).json({
            success: true,
            data: result.rows.map(row => ({
                id_producto: row.id_producto,
                nombre: row.nombre,
                tipo_licor: row.tipo_licor,
                veces_vendido: parseInt(row.veces_vendido) || 0,
                cantidad_total: parseInt(row.cantidad_total) || 0,
                ventas_totales: parseFloat(row.ventas_totales) || 0
            }))
        });
    } catch (error) {
        console.error('Error en getTopProducts:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos más vendidos',
            error: error.message
        });
    }
};

// Obtener ventas por cliente
const getSalesByClient = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const query = `
            SELECT 
                c.id_cliente,
                c.nombre,
                COUNT(v.id_venta) as cantidad_compras,
                COALESCE(SUM(v.total), 0) as total_compras
            FROM cliente c
            LEFT JOIN venta v ON c.id_cliente = v.id_cliente
            WHERE v.id_venta IS NOT NULL
            GROUP BY c.id_cliente, c.nombre
            ORDER BY total_compras DESC
            LIMIT $1
        `;

        const result = await pool.query(query, [parseInt(limit)]);

        res.status(200).json({
            success: true,
            data: result.rows.map(row => ({
                id_cliente: row.id_cliente,
                nombre: row.nombre,
                cantidad_compras: parseInt(row.cantidad_compras),
                total_compras: parseFloat(row.total_compras)
            }))
        });
    } catch (error) {
        console.error('Error en getSalesByClient:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ventas por cliente',
            error: error.message
        });
    }
};

// Obtener estado del inventario
const getInventoryStatus = async (req, res) => {
    try {
        const query = `
            SELECT 
                i.id_inventario,
                i.cantidad,
                p.nombre as producto_nombre,
                p.precio_venta,
                tl.nombre as tipo_licor,
                i.cantidad * p.precio_venta as valor_stock
            FROM inventario i
            INNER JOIN producto p ON i.id_producto = p.id_producto
            LEFT JOIN tipo_licor tl ON p.id_tipo_licor = tl.id_tipo_licor
            ORDER BY i.cantidad ASC
        `;

        const result = await pool.query(query);

        res.status(200).json({
            success: true,
            data: result.rows.map(row => ({
                id_inventario: row.id_inventario,
                producto_nombre: row.producto_nombre,
                tipo_licor: row.tipo_licor,
                cantidad: parseInt(row.cantidad),
                precio_venta: parseFloat(row.precio_venta),
                valor_stock: parseFloat(row.valor_stock),
                estado: row.cantidad < 10 ? 'bajo' : row.cantidad < 50 ? 'medio' : 'alto'
            }))
        });
    } catch (error) {
        console.error('Error en getInventoryStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estado del inventario',
            error: error.message
        });
    }
};

// Obtener ventas por usuario (vendedor)
const getSalesByUser = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id_usuario,
                u.nombre,
                u.rol,
                COUNT(v.id_venta) as cantidad_ventas,
                COALESCE(SUM(v.total), 0) as total_ventas
            FROM usuario u
            LEFT JOIN venta v ON u.id_usuario = v.id_usuario
            WHERE v.id_venta IS NOT NULL
            GROUP BY u.id_usuario, u.nombre, u.rol
            ORDER BY total_ventas DESC
        `;

        const result = await pool.query(query);

        res.status(200).json({
            success: true,
            data: result.rows.map(row => ({
                id_usuario: row.id_usuario,
                nombre: row.nombre,
                rol: row.rol,
                cantidad_ventas: parseInt(row.cantidad_ventas),
                total_ventas: parseFloat(row.total_ventas)
            }))
        });
    } catch (error) {
        console.error('Error en getSalesByUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ventas por usuario',
            error: error.message
        });
    }
};

// Obtener ventas por tipo de licor
const getSalesByLicorType = async (req, res) => {
    try {
        const query = `
            SELECT 
                tl.id_tipo_licor,
                tl.nombre,
                tl.iva,
                COUNT(DISTINCT p.id_producto) as cantidad_productos,
                COUNT(v.id_venta) as cantidad_ventas,
                COALESCE(SUM(v.total), 0) as total_ventas
            FROM tipo_licor tl
            LEFT JOIN producto p ON tl.id_tipo_licor = p.id_tipo_licor
            LEFT JOIN detalle_venta dv ON dv.productos @> jsonb_build_array(jsonb_build_object('id_producto', p.id_producto))
            LEFT JOIN venta v ON v.id_detalle_venta = dv.id_detalle_venta
            WHERE v.id_venta IS NOT NULL
            GROUP BY tl.id_tipo_licor, tl.nombre, tl.iva
            ORDER BY total_ventas DESC
        `;

        const result = await pool.query(query);

        res.status(200).json({
            success: true,
            data: result.rows.map(row => ({
                id_tipo_licor: row.id_tipo_licor,
                nombre: row.nombre,
                iva: parseInt(row.iva),
                cantidad_productos: parseInt(row.cantidad_productos),
                cantidad_ventas: parseInt(row.cantidad_ventas),
                total_ventas: parseFloat(row.total_ventas)
            }))
        });
    } catch (error) {
        console.error('Error en getSalesByLicorType:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ventas por tipo de licor',
            error: error.message
        });
    }
};

// Obtener análisis de utilidad
const getProfitAnalysis = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id_producto,
                p.nombre,
                p.precio_compra,
                p.precio_venta,
                p.utilidad as porcentaje_utilidad,
                (p.precio_venta - p.precio_compra) as ganancia_unitaria,
                COALESCE(i.cantidad, 0) as stock_actual,
                COALESCE(i.cantidad * (p.precio_venta - p.precio_compra), 0) as ganancia_potencial
            FROM producto p
            LEFT JOIN inventario i ON p.id_producto = i.id_producto
            ORDER BY ganancia_potencial DESC
            LIMIT 20
        `;

        const result = await pool.query(query);

        res.status(200).json({
            success: true,
            data: result.rows.map(row => ({
                id_producto: row.id_producto,
                nombre: row.nombre,
                precio_compra: parseFloat(row.precio_compra),
                precio_venta: parseFloat(row.precio_venta),
                porcentaje_utilidad: parseFloat(row.porcentaje_utilidad),
                ganancia_unitaria: parseFloat(row.ganancia_unitaria),
                stock_actual: parseInt(row.stock_actual),
                ganancia_potencial: parseFloat(row.ganancia_potencial)
            }))
        });
    } catch (error) {
        console.error('Error en getProfitAnalysis:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener análisis de utilidad',
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStats,
    getSalesByPeriod,
    getTopProducts,
    getSalesByClient,
    getInventoryStatus,
    getSalesByUser,
    getSalesByLicorType,
    getProfitAnalysis
};

