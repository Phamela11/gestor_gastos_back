const { pool } = require('../config/databases');

// Obtener todas las nóminas
const getAllNominas = async (req, res) => {
    try {
        const nominas = await pool.query(`
            SELECT 
                n.id_nomina,
                n.id_usuario,
                u.nombre as empleado_nombre,
                n.total_horas,
                n.fecha_pago,
                n.periodo,
                n.monto,
                n.bono,
                n.fecha_inicio,
                n.fecha_fin,
                u.valor_hora,
                n.estado
            FROM nomina n
            JOIN usuario u ON n.id_usuario = u.id_usuario
            ORDER BY n.fecha_pago DESC, n.periodo DESC
        `);
        
        res.status(200).json({
            success: true,
            message: 'Nóminas obtenidas exitosamente',
            total: nominas.rows.length,
            data: nominas.rows
        });
    } catch (error) {
        console.error('Error en getAllNominas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las nóminas',
            error: error.message
        });
    }
};

// Crear una nueva nómina
const createNomina = async (req, res) => {
    try {
        const { 
            id_usuario, 
            fecha_inicio, 
            fecha_fin, 
            fecha_pago, 
            total_horas, 
            monto, 
            bono, 
            periodo,
            estado 
        } = req.body;

        // Validaciones
        if (!id_usuario || !fecha_inicio || !fecha_fin || !fecha_pago || !periodo) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios'
            });
        }

        const result = await pool.query(`
            INSERT INTO nomina (
                id_usuario, 
                total_horas, 
                fecha_pago, 
                periodo, 
                monto, 
                bono, 
                fecha_inicio, 
                fecha_fin,
                estado
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            id_usuario, 
            total_horas || 0, 
            fecha_pago, 
            periodo, 
            monto || 0, 
            bono || 0, 
            fecha_inicio, 
            fecha_fin,
            estado || 'pendiente'
        ]);

        res.status(201).json({
            success: true,
            message: 'Nómina creada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error en createNomina:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la nómina',
            error: error.message
        });
    }
};

// Actualizar una nómina
const updateNomina = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            id_usuario, 
            fecha_inicio, 
            fecha_fin, 
            fecha_pago, 
            total_horas, 
            monto, 
            bono, 
            periodo,
            estado
        } = req.body;

        const result = await pool.query(`
            UPDATE nomina 
            SET 
                id_usuario = COALESCE($1, id_usuario),
                total_horas = COALESCE($2, total_horas),
                fecha_pago = COALESCE($3, fecha_pago),
                periodo = COALESCE($4, periodo),
                monto = COALESCE($5, monto),
                bono = COALESCE($6, bono),
                fecha_inicio = COALESCE($7, fecha_inicio),
                fecha_fin = COALESCE($8, fecha_fin),
                estado = COALESCE($9, estado)
            WHERE id_nomina = $10
            RETURNING *
        `, [
            id_usuario, 
            total_horas, 
            fecha_pago, 
            periodo, 
            monto, 
            bono, 
            fecha_inicio, 
            fecha_fin,
            estado,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nómina no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Nómina actualizada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error en updateNomina:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la nómina',
            error: error.message
        });
    }
};

// Eliminar una nómina
const deleteNomina = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            DELETE FROM nomina 
            WHERE id_nomina = $1 
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nómina no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Nómina eliminada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error en deleteNomina:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la nómina',
            error: error.message
        });
    }
};

// Calcular horas trabajadas por empleado en un rango de fechas
const calcularHorasPorEmpleado = async (req, res) => {
    try {
        const { empleado_id, fecha_inicio, fecha_fin } = req.body;

        if (!empleado_id || !fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Faltan parámetros requeridos: empleado_id, fecha_inicio, fecha_fin'
            });
        }

        // Obtener el valor por hora del empleado
        const empleado = await pool.query(`
            SELECT valor_hora, nombre 
            FROM usuario 
            WHERE id_usuario = $1
        `, [empleado_id]);

        if (empleado.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        const valorHora = empleado.rows[0].valor_hora || 0;
        const nombreEmpleado = empleado.rows[0].nombre;

        // Calcular horas trabajadas solo de registros con hora_salida (jornadas finalizadas)
        const horasResult = await pool.query(`
            SELECT 
                COALESCE(SUM(horas_trabajadas), 0) as total_horas,
                COUNT(*) as total_registros
            FROM registro_horas
            WHERE id_usuario = $1
            AND fecha >= $2
            AND fecha <= $3
            AND hora_salida IS NOT NULL
        `, [empleado_id, fecha_inicio, fecha_fin]);

        const totalHoras = parseFloat(horasResult.rows[0].total_horas) || 0;
        const montoTotal = totalHoras * valorHora;
        const totalRegistros = parseInt(horasResult.rows[0].total_registros) || 0;

        res.status(200).json({
            success: true,
            message: 'Horas calculadas exitosamente',
            data: {
                empleado_id,
                empleado_nombre: nombreEmpleado,
                fecha_inicio,
                fecha_fin,
                total_horas: totalHoras,
                valor_hora: valorHora,
                monto_total: montoTotal,
                total_registros: totalRegistros
            }
        });
    } catch (error) {
        console.error('Error en calcularHorasPorEmpleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calcular las horas',
            error: error.message
        });
    }
};

// Marcar nómina como pagada (solo para compatibilidad, no hace cambios en BD)
const marcarComoPagado = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT * FROM nomina WHERE id_nomina = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nómina no encontrada'
            });
        }

        // No actualizamos nada en la BD, solo confirmamos que existe
        res.status(200).json({
            success: true,
            message: 'Nómina marcada como pagada (solo en frontend)',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error en marcarComoPagado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar la nómina como pagada',
            error: error.message
        });
    }
};

module.exports = {
    getAllNominas,
    createNomina,
    updateNomina,
    deleteNomina,
    calcularHorasPorEmpleado,
    marcarComoPagado
};

