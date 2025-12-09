// api/log-visit.js

// Importamos el cliente de PostgreSQL. 
// Asegúrate de que el paquete 'pg' esté instalado en tu proyecto: npm install pg
const { Client } = require('pg');

/**
 * Función principal del controlador de la API Route de Vercel.
 * Se encarga de extraer la IP del cliente y registrarla en la base de datos Neon.
 * @param {object} req - Objeto de solicitud (Request)
 * @param {object} res - Objeto de respuesta (Response)
 */
module.exports = async (req, res) => {
    // Solo permitimos solicitudes POST o GET
    if (req.method !== 'POST' && req.method !== 'GET') {
        // 405 Method Not Allowed
        res.status(405).json({ success: false, message: 'Método no permitido. Usa POST o GET.' });
        return;
    }

    // --- Extracción de la IP del cliente ---
    // Vercel inyecta la IP real del usuario en el encabezado 'x-forwarded-for'.
    // Si hay múltiples IPs (proxies), tomamos la primera.
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.connection ? req.connection.remoteAddress : 'Desconocida');

    // Inicializamos la conexión con la base de datos.
    // Utiliza la variable de entorno DATABASE_URL configurada en Vercel.
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            // Necesario para evitar errores de certificado SSL/TLS en entornos serverless
            rejectUnauthorized: false,
        },
    });

    try {
        await client.connect();

        // Consulta SQL para insertar la IP. La columna visit_time usa el DEFAULT (CURRENT_TIMESTAMP)
        const queryText = 'INSERT INTO visits (ip_address) VALUES ($1)';
        
        // Ejecutamos la consulta
        await client.query(queryText, [ipAddress]);

        console.log(`Registro de visita exitoso para IP: ${ipAddress}`);

        // Respuesta de éxito al cliente
        res.status(200).json({ 
            success: true, 
            message: 'Visita registrada con éxito', 
            ip: ipAddress 
        });

    } catch (error) {
        // Manejo de errores de conexión o de la base de datos
        console.error('Error al registrar la visita:', error);
        
        // Respuesta de error al cliente (500 Internal Server Error)
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor al registrar la visita.',
            details: error.message
        });
    } finally {
        // Cierre de la conexión para liberar recursos
        if (client) {
            try {
                await client.end();
            } catch (closeError) {
                console.error('Error al cerrar la conexión del cliente:', closeError);
            }
        }
    }
};