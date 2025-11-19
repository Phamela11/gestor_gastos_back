const { pool } = require('../config/databases');

// Función para obtener todos los registros de horas
const getAllTimeRecords = async (req, res) => {
    try {
        const records = await pool.query(`
            SELECT 
                rh.id_registro,
                rh.fecha,
                rh.id_usuario as id_empleado,
                u.nombre as empleado_nombre,
                rh.hora_entrada,
                rh.hora_salida,
                COALESCE(rh.descanso, 0) as descanso,
                rh.horas_trabajadas,
                CASE 
                    WHEN rh.hora_salida IS NULL THEN 'En Progreso'
                    ELSE 'Completo'
                END as estado,
                rh.observacion as observaciones
            FROM registro_horas rh
            JOIN usuario u ON rh.id_usuario = u.id_usuario
            ORDER BY rh.fecha DESC, rh.hora_entrada DESC
        `);
        
        res.status(200).json({
            success: true,
            message: 'Registros de tiempo obtenidos exitosamente',
            total: records.rows.length,
            data: records.rows
        });
    } catch (error) {
        console.error('Error en getAllTimeRecords:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener registros de tiempo',
            error: error.message
        });
    }
};

// Función para crear un nuevo registro de tiempo
const createTimeRecord = async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);
        const { 
            fecha, 
            empleado_id, 
            hora_entrada, 
            hora_salida, 
            descanso,
            observaciones 
        } = req.body;

        // Validar campos requeridos
        if (!fecha || !empleado_id || !hora_entrada) {
            return res.status(400).json({
                success: false,
                message: 'Los campos fecha, empleado_id y hora_entrada son requeridos'
            });
        }

        // Verificar que el empleado existe
        const existingEmployee = await pool.query(
            'SELECT id_usuario FROM usuario WHERE id_usuario = $1',
            [empleado_id]
        );
        
        if (existingEmployee.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        // Insertar nuevo registro
        console.log('Intentando insertar registro con:', {
            fecha,
            empleado_id,
            hora_entrada,
            hora_salida: hora_salida || null,
            descanso: descanso || 0,
            observaciones: observaciones || null
        });
        
        const result = await pool.query(
            `INSERT INTO registro_horas 
            (fecha, id_usuario, hora_entrada, hora_salida, descanso, observacion) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id_registro`,
            [fecha, empleado_id, hora_entrada, hora_salida || null, descanso || 0, observaciones || null]
        );
        
        console.log('Registro insertado exitosamente:', result.rows[0]);

        // Obtener el registro creado completo
        const newRecord = await pool.query(`
            SELECT 
                rh.id_registro,
                rh.fecha,
                rh.id_usuario as id_empleado,
                u.nombre as empleado_nombre,
                rh.hora_entrada,
                rh.hora_salida,
                COALESCE(rh.descanso, 0) as descanso,
                rh.horas_trabajadas,
                CASE 
                    WHEN rh.hora_salida IS NULL THEN 'En Progreso'
                    ELSE 'Completo'
                END as estado,
                rh.observacion as observaciones
            FROM registro_horas rh
            JOIN usuario u ON rh.id_usuario = u.id_usuario
            WHERE rh.id_registro = $1
        `, [result.rows[0].id_registro]);

        res.status(201).json({
            success: true,
            message: 'Registro de tiempo creado exitosamente',
            data: newRecord.rows[0]
        });
    } catch (error) {
        console.error('Error en createTimeRecord:', error);
        console.error('Stack completo:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error al crear registro de tiempo',
            error: error.message,
            details: error.detail || error.stack
        });
    }
};

// Función para actualizar un registro de tiempo
const updateTimeRecord = async (req, res) => {
    try {
        const { id_registro } = req.params;
        console.log('Datos recibidos para actualizar:', req.body);
        
        const { 
            fecha, 
            empleado_id, 
            hora_entrada, 
            hora_salida,
            descanso,
            observaciones 
        } = req.body;

        // Validar que el registro existe
        const existingRecord = await pool.query(
            'SELECT id_registro FROM registro_horas WHERE id_registro = $1',
            [id_registro]
        );
        
        if (existingRecord.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registro de tiempo no encontrado'
            });
        }

        // Actualizar registro
        await pool.query(
            `UPDATE registro_horas 
            SET fecha = $1, 
                id_usuario = $2, 
                hora_entrada = $3, 
                hora_salida = $4,
                descanso = $5,
                observacion = $6
            WHERE id_registro = $7`,
            [fecha, empleado_id, hora_entrada, hora_salida || null, descanso || 0, observaciones || null, id_registro]
        );

        res.status(200).json({
            success: true,
            message: 'Registro de tiempo actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error en updateTimeRecord:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar registro de tiempo',
            error: error.message
        });
    }
};

// Función para eliminar un registro de tiempo
const deleteTimeRecord = async (req, res) => {
    try {
        const { id_registro } = req.params;
        
        // Verificar que el registro existe
        const existingRecord = await pool.query(
            'SELECT id_registro FROM registro_horas WHERE id_registro = $1',
            [id_registro]
        );
        
        if (existingRecord.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registro de tiempo no encontrado'
            });
        }

        // Eliminar registro
        await pool.query(
            'DELETE FROM registro_horas WHERE id_registro = $1',
            [id_registro]
        );

        res.status(200).json({
            success: true,
            message: 'Registro de tiempo eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error en deleteTimeRecord:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar registro de tiempo',
            error: error.message
        });
    }
};

module.exports = {
    getAllTimeRecords,
    createTimeRecord,
    updateTimeRecord,
    deleteTimeRecord
};

