const { pool } = require('../config/databases');

// Crear tipo de licor
const createTipoLicor = async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El campo nombre es requerido'
            });
        }

        const result = await pool.query(
            'INSERT INTO tipo_licor (nombre) VALUES ($1) RETURNING id_tipo_licor, nombre',
            [nombre]
        );

        res.status(201).json({
            success: true,
            message: 'Tipo de licor creado exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error en createTipoLicor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear tipo de licor',
            error: error.message
        });
    }
};

// Obtener todos los tipos de licor
const getAllTipoLicor = async (req, res) => {
    try {
        const tipos = await pool.query(
            'SELECT * FROM tipo_licor ORDER BY id_tipo_licor DESC'
        );
        res.status(200).json({
            success: true,
            message: 'Tipos de licor obtenidos exitosamente',
            total: tipos.rows.length,
            data: tipos.rows
        });
    } catch (error) {
        console.error('Error en getAllTipoLicor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tipos de licor',
            error: error.message
        });
    }
};

// Actualizar tipo de licor
const updateTipoLicor = async (req, res) => {
    try {
        const { id_tipo_licor } = req.params;
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El campo nombre es requerido para la actualización'
            });
        }

        const existing = await pool.query(
            'SELECT id_tipo_licor FROM tipo_licor WHERE id_tipo_licor = $1',
            [id_tipo_licor]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de licor no encontrado'
            });
        }

        await pool.query(
            'UPDATE tipo_licor SET nombre = $1 WHERE id_tipo_licor = $2',
            [nombre, id_tipo_licor]
        );

        const updated = await pool.query(
            'SELECT * FROM tipo_licor WHERE id_tipo_licor = $1',
            [id_tipo_licor]
        );

        res.status(200).json({
            success: true,
            message: 'Tipo de licor actualizado exitosamente',
            data: updated.rows[0]
        });
    } catch (error) {
        console.error('Error en updateTipoLicor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar tipo de licor',
            error: error.message
        });
    }
};

// Eliminar tipo de licor
const deleteTipoLicor = async (req, res) => {
    try {
        const { id_tipo_licor } = req.params;

        const existing = await pool.query(
            'SELECT id_tipo_licor FROM tipo_licor WHERE id_tipo_licor = $1',
            [id_tipo_licor]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de licor no encontrado'
            });
        }

        await pool.query(
            'DELETE FROM tipo_licor WHERE id_tipo_licor = $1',
            [id_tipo_licor]
        );

        res.status(200).json({
            success: true,
            message: 'Tipo de licor eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error en deleteTipoLicor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar tipo de licor',
            error: error.message
        });
    }
};

module.exports = {
    createTipoLicor,
    getAllTipoLicor,
    updateTipoLicor,
    deleteTipoLicor
};