// api/log-visit.js (Versión ESM y optimizada para Neon)

// ➡️ Usamos la sintaxis ESM (import)
import { neon } from '@neondatabase/serverless';
// Nota: El driver de Neon usará la variable de entorno DATABASE_URL automáticamente.
const sql = neon(process.env.DATABASE_URL);

/**
 * Serverless function handler (Usando ESM: export default).
 */
export default async function handler(req, res) {
    // La función App.tsx está llamando con POST, nos aseguramos de que solo se permita esto.
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Método no permitido. Usa POST.' });
    }

    // --- Extracción de la IP del cliente ---
    // Vercel inyecta la IP real del usuario en el encabezado 'x-forwarded-for'.
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'Desconocida';

    if (ipAddress === 'Desconocida') {
        return res.status(400).json({ success: false, message: 'No se pudo obtener la dirección IP del cliente.' });
    }

    try {
        // Ejecutamos la consulta usando el pooler de Neon
        // Se encarga de la seguridad (SQL Injection) y la eficiencia.
        await sql`INSERT INTO visits (ip_address) VALUES (${ipAddress})`;

        // Respuesta de éxito
        res.status(200).json({ 
            success: true, 
            message: 'Visita registrada con éxito', 
            ip: ipAddress 
        });

    } catch (error) {
        // Manejo de errores de la base de datos o conexión
        console.error('Error al registrar la visita:', error);
        
        // Devolvemos 500 si falla la conexión o la consulta
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor al registrar la visita.',
            details: error.message
        });
    }
    // No se necesita `client.end()` con el driver de Neon.
}
