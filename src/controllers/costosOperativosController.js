const { pool } = require('../config/databases');

// Función para crear un costo operativo
const createCostoOperativo = async (req, res) => {
    try {
        console.log('Datos recibidos para crear costo operativo:', req.body);
        const { 
            categoria, 
            descripcion, 
            monto,
            fecha,
            periodo,
            observaciones 
        } = req.body;

        // Validar campos requeridos
        if (!categoria || !descripcion || !monto || !fecha) {
            return res.status(400).json({
                success: false,
                message: 'Los campos categoria, descripcion, monto y fecha son requeridos',
                missing: {
                    categoria: !categoria,
                    descripcion: !descripcion,
                    monto: !monto,
                    fecha: !fecha
                }
            });
        }

        // Validar que el monto sea un número válido
        if (isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser un número válido mayor a 0'
            });
        }

        // Insertar nuevo costo operativo
        const result = await pool.query(
            `INSERT INTO costos_operativos 
            (categoria, descripcion, monto, fecha, periodo, observaciones) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id_costo`,
            [
                categoria, 
                descripcion, 
                parseFloat(monto), 
                fecha, 
                periodo || null, 
                observaciones || null
            ]
        );

        // Obtener el costo operativo creado
        const newCosto = await pool.query(
            'SELECT * FROM costos_operativos WHERE id_costo = $1',
            [result.rows[0].id_costo]
        );
        
        res.status(201).json({
            success: true,
            message: 'Costo operativo creado exitosamente',
            data: newCosto.rows[0]
        });
        
    } catch (error) {
        console.error('Error en createCostoOperativo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear costo operativo',
            error: error.message
        });
    }
};

// Función para obtener todos los costos operativos
const getAllCostosOperativos = async (req, res) => {
    try {
        const { categoria, periodo, fecha_inicio, fecha_fin } = req.query;
        
        let query = 'SELECT * FROM costos_operativos WHERE 1=1';
        const params = [];
        let paramCount = 1;

        // Filtrar por categoría
        if (categoria) {
            query += ` AND categoria = $${paramCount}`;
            params.push(categoria);
            paramCount++;
        }

        // Filtrar por periodo
        if (periodo) {
            query += ` AND periodo = $${paramCount}`;
            params.push(periodo);
            paramCount++;
        }

        // Filtrar por rango de fechas
        if (fecha_inicio) {
            query += ` AND fecha >= $${paramCount}`;
            params.push(fecha_inicio);
            paramCount++;
        }

        if (fecha_fin) {
            query += ` AND fecha <= $${paramCount}`;
            params.push(fecha_fin);
            paramCount++;
        }

        query += ' ORDER BY fecha DESC, id_costo DESC';

        const costos = await pool.query(query, params);
        
        res.status(200).json({
            success: true,
            message: 'Costos operativos obtenidos exitosamente',
            total: costos.rows.length,
            data: costos.rows
        });
    } catch (error) {
        console.error('Error en getAllCostosOperativos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener costos operativos',
            error: error.message
        });
    }
};

// Función para obtener un costo operativo por ID
const getCostoOperativoById = async (req, res) => {
    try {
        const { id_costo } = req.params;
        
        const costo = await pool.query(
            'SELECT * FROM costos_operativos WHERE id_costo = $1',
            [id_costo]
        );
        
        if (costo.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Costo operativo no encontrado'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Costo operativo obtenido exitosamente',
            data: costo.rows[0]
        });
    } catch (error) {
        console.error('Error en getCostoOperativoById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener costo operativo',
            error: error.message
        });
    }
};

// Función para actualizar un costo operativo
const updateCostoOperativo = async (req, res) => {
    try {
        const { id_costo } = req.params;
        console.log('Datos recibidos para actualizar costo operativo:', req.body);
        
        const { 
            categoria, 
            descripcion, 
            monto,
            fecha,
            periodo,
            observaciones 
        } = req.body;

        // Validar campos requeridos
        if (!categoria || !descripcion || !monto || !fecha) {
            return res.status(400).json({
                success: false,
                message: 'Los campos categoria, descripcion, monto y fecha son requeridos',
                missing: {
                    categoria: !categoria,
                    descripcion: !descripcion,
                    monto: !monto,
                    fecha: !fecha
                }
            });
        }

        // Validar que el monto sea un número válido
        if (isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser un número válido mayor a 0'
            });
        }

        // Verificar si el costo operativo existe
        const existingCosto = await pool.query(
            'SELECT id_costo FROM costos_operativos WHERE id_costo = $1',
            [id_costo]
        );
        
        if (existingCosto.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Costo operativo no encontrado'
            });
        }

        // Actualizar el costo operativo
        await pool.query(
            `UPDATE costos_operativos 
            SET categoria = $1, descripcion = $2, monto = $3, fecha = $4, periodo = $5, observaciones = $6 
            WHERE id_costo = $7`,
            [
                categoria, 
                descripcion, 
                parseFloat(monto), 
                fecha, 
                periodo || null, 
                observaciones || null, 
                id_costo
            ]
        );

        // Obtener el costo operativo actualizado
        const updatedCosto = await pool.query(
            'SELECT * FROM costos_operativos WHERE id_costo = $1',
            [id_costo]
        );
        
        res.status(200).json({
            success: true,
            message: 'Costo operativo actualizado exitosamente',
            data: updatedCosto.rows[0]
        });
        
    } catch (error) {
        console.error('Error en updateCostoOperativo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar costo operativo',
            error: error.message
        });
    }
};

// Función para eliminar un costo operativo
const deleteCostoOperativo = async (req, res) => {
    try {
        const { id_costo } = req.params;
        
        // Verificar si el costo operativo existe
        const existingCosto = await pool.query(
            'SELECT id_costo FROM costos_operativos WHERE id_costo = $1',
            [id_costo]
        );
        
        if (existingCosto.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Costo operativo no encontrado'
            });
        }
        
        // Eliminar el costo operativo
        await pool.query(
            'DELETE FROM costos_operativos WHERE id_costo = $1',
            [id_costo]
        );
        
        res.status(200).json({
            success: true,
            message: 'Costo operativo eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error en deleteCostoOperativo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar costo operativo',
            error: error.message
        });
    }
};

// Función para obtener resumen de costos por categoría
const getResumenPorCategoria = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, periodo } = req.query;
        
        let query = `
            SELECT 
                categoria,
                COUNT(*) as cantidad,
                SUM(monto) as total,
                AVG(monto) as promedio,
                MIN(monto) as minimo,
                MAX(monto) as maximo
            FROM costos_operativos
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (fecha_inicio) {
            query += ` AND fecha >= $${paramCount}`;
            params.push(fecha_inicio);
            paramCount++;
        }

        if (fecha_fin) {
            query += ` AND fecha <= $${paramCount}`;
            params.push(fecha_fin);
            paramCount++;
        }

        if (periodo) {
            query += ` AND periodo = $${paramCount}`;
            params.push(periodo);
            paramCount++;
        }

        query += ' GROUP BY categoria ORDER BY total DESC';

        const resumen = await pool.query(query, params);
        
        res.status(200).json({
            success: true,
            message: 'Resumen obtenido exitosamente',
            data: resumen.rows
        });
    } catch (error) {
        console.error('Error en getResumenPorCategoria:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen',
            error: error.message
        });
    }
};

module.exports = {
    createCostoOperativo,
    getAllCostosOperativos,
    getCostoOperativoById,
    updateCostoOperativo,
    deleteCostoOperativo,
    getResumenPorCategoria
};

