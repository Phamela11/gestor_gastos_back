const { pool } = require('../config/databases');

// Función para crear un cliente
const createCustomer = async (req, res) => {
    try {
        console.log('Datos recibidos para crear cliente:', req.body);
        const { 
            nombre, 
            telefono, 
            direccion 
        } = req.body;
        
        const fecha = new Date();

        // Validar que el campo nombre esté presente
        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El campo nombre es requerido',
                missing: {
                    nombre: !nombre
                }
            });
        }

        // Insertar nuevo cliente
        const result = await pool.query(
            'INSERT INTO cliente (nombre, telefono, fecha, direccion) VALUES ($1, $2, $3, $4) RETURNING id_cliente',
            [nombre, telefono || null, fecha, direccion || null]
        );

        // Obtener el cliente creado
        const newCustomer = await pool.query(
            'SELECT * FROM cliente WHERE id_cliente = $1',
            [result.rows[0].id_cliente]
        );
        
        res.status(201).json({
            success: true,
            message: 'Cliente creado exitosamente',
            data: newCustomer.rows[0]
        });
        
    } catch (error) {
        console.error('Error en createCustomer:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear cliente',
            error: error.message
        });
    }
};

// Función para obtener todos los clientes
const getAllCustomer = async (req, res) => {
    try {
        const customers = await pool.query(
            'SELECT * FROM cliente ORDER BY id_cliente DESC'
        );
        
        res.status(200).json({
            success: true,
            message: 'Clientes obtenidos exitosamente',
            total: customers.rows.length,
            data: customers.rows
        });
    } catch (error) {
        console.error('Error en getAllCustomer:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener clientes',
            error: error.message
        });
    }
};

// Función para actualizar un cliente
const updateCustomer = async (req, res) => {
    try {
        const { id_cliente } = req.params;
        console.log('Datos recibidos para actualizar cliente:', req.body);
        
        const { 
            nombre, 
            telefono, 
            direccion 
        } = req.body;

        // Validar que el campo nombre esté presente
        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El campo nombre es requerido para la actualización',
                missing: {
                    nombre: !nombre
                }
            });
        }

        // Verificar si el cliente existe
        const existingCustomer = await pool.query(
            'SELECT id_cliente FROM cliente WHERE id_cliente = $1',
            [id_cliente]
        );
        
        if (existingCustomer.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        // Actualizar el cliente
        await pool.query(
            'UPDATE cliente SET nombre = $1, telefono = $2, direccion = $3 WHERE id_cliente = $4',
            [nombre, telefono || null, direccion || null, id_cliente]
        );

        // Obtener el cliente actualizado
        const updatedCustomer = await pool.query(
            'SELECT * FROM cliente WHERE id_cliente = $1',
            [id_cliente]
        );
        
        res.status(200).json({
            success: true,
            message: 'Cliente actualizado exitosamente',
            data: updatedCustomer.rows[0]
        });
        
    } catch (error) {
        console.error('Error en updateCustomer:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar cliente',
            error: error.message
        });
    }
};

// Función para eliminar un cliente
const deleteCustomer = async (req, res) => {
    try {
        const { id_cliente } = req.params;
        
        // Verificar si el cliente existe
        const existingCustomer = await pool.query(
            'SELECT id_cliente FROM cliente WHERE id_cliente = $1',
            [id_cliente]
        );
        
        if (existingCustomer.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        // Eliminar el cliente
        await pool.query(
            'DELETE FROM cliente WHERE id_cliente = $1',
            [id_cliente]
        );
        
        res.status(200).json({
            success: true,
            message: 'Cliente eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error en deleteCustomer:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar cliente',
            error: error.message
        });
    }
};

module.exports = {
    createCustomer,
    getAllCustomer,
    updateCustomer,
    deleteCustomer
};
