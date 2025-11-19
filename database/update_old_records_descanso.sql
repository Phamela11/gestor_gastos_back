-- ============================================
-- ACTUALIZAR REGISTROS ANTIGUOS
-- Este script actualiza los registros que tienen descanso NULL
-- y les asigna 0 como valor por defecto
-- ============================================

-- Actualizar todos los registros que tienen descanso NULL
UPDATE registro_horas 
SET descanso = 0 
WHERE descanso IS NULL;

-- Verificar cuántos registros fueron actualizados
SELECT COUNT(*) as registros_actualizados 
FROM registro_horas 
WHERE descanso = 0;

-- Mensaje de confirmación
SELECT 'Registros antiguos actualizados correctamente. Ahora puedes editar todos los registros.' as resultado;

