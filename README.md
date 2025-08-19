# Backend Gestor de Gastos

## Configuración de la Base de Datos MySQL

### 1. Instalación de Dependencias

```bash
npm install
```

### 2. Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con la siguiente configuración:

```env
# Configuración de la base de datos MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=gestor_gastos
DB_PORT=3306

# Puerto de la aplicación
PORT=3000

# Entorno
NODE_ENV=development
```

### 3. Crear la Base de Datos

```sql
CREATE DATABASE gestor_gastos;
USE gestor_gastos;
```

### 4. Crear la Base de Datos y Tablas

```bash
# Opción 1: Ejecutar el script SQL completo
mysql -u root -p < database-setup.sql

# Opción 2: Ejecutar comandos individuales
mysql -u root -p
CREATE DATABASE gestor_gastos;
USE gestor_gastos;
# Luego copia y pega el contenido de database-setup.sql
```

### 5. Probar la Conexión y Estructura

```bash
# Prueba básica de conexión
node test-db.js
```

### 5. Funciones Disponibles

El archivo `src/config/databases.js` proporciona las siguientes funciones:

- `testConnection()`: Prueba la conexión con MySQL
- `executeQuery(sql, params)`: Ejecuta consultas SQL con parámetros
- `getConnection()`: Obtiene una conexión individual del pool
- `closePool()`: Cierra el pool de conexiones
- `pool`: Pool de conexiones de MySQL

### 6. APIs Disponibles

El sistema incluye las siguientes APIs REST:

#### Gastos (`/api/gastos`)
- `GET /api/gastos` - Obtener todos los gastos
- `GET /api/gastos/:id` - Obtener un gasto específico
- `POST /api/gastos` - Crear un nuevo gasto
- `PUT /api/gastos/:id` - Actualizar un gasto
- `DELETE /api/gastos/:id` - Eliminar un gasto

#### Categorías (`/api/categorias`)
- `GET /api/categorias` - Obtener todas las categorías
- `GET /api/categorias/:id` - Obtener una categoría específica
- `POST /api/categorias` - Crear una nueva categoría
- `PUT /api/categorias/:id` - Actualizar una categoría
- `DELETE /api/categorias/:id` - Eliminar una categoría

### 7. Ejemplo de Uso

```javascript
const { executeQuery, testConnection } = require('./src/config/databases');

// Probar conexión
await testConnection();

// Ejecutar consulta
const gastos = await executeQuery('SELECT * FROM gastos WHERE categoria = ?', ['Alimentación']);
```

### 7. Características de la Conexión

- **Pool de conexiones**: Máximo 10 conexiones simultáneas
- **Reconexión automática**: Se reconecta automáticamente si se pierde la conexión
- **Timeout**: 60 segundos para operaciones
- **Manejo de errores**: Logs detallados de errores
- **Variables de entorno**: Configuración flexible mediante archivo .env

### 8. Iniciar el Servidor

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
node src/app.js
```

### 9. Probar las APIs

Una vez que el servidor esté corriendo, puedes probar las APIs:

```bash
# Probar la ruta principal
curl http://localhost:3000/

# Obtener todas las categorías
curl http://localhost:3000/api/categorias

# Obtener todos los gastos
curl http://localhost:3000/api/gastos
```
