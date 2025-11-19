-- ============================================
-- ARREGLAR COLUMNA DESCANSO
-- Este script asegura que la columna descanso tenga valores correctos
-- ============================================

-- Paso 1: Actualizar registros que tienen descanso NULL
UPDATE registro_horas 
SET descanso = 0 
WHERE descanso IS NULL;

-- Paso 2: Establecer valor por defecto para la columna descanso
ALTER TABLE registro_horas 
ALTER COLUMN descanso SET DEFAULT 0;

-- Paso 3 (OPCIONAL): Si quieres que no permita NULL en el futuro
-- ALTER TABLE registro_horas 
-- ALTER COLUMN descanso SET NOT NULL;

-- Verificación: Mostrar todos los registros con su descanso
SELECT 
    id_registro,
    fecha,
    hora_entrada,
    hora_salida,
    descanso,
    horas_trabajadas
FROM registro_horas 
ORDER BY fecha DESC
LIMIT 10;

-- Mensaje de confirmación
SELECT 'Columna descanso arreglada correctamente.' as resultado;

