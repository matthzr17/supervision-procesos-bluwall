const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Configuración para entender JSON y servir tu HTML
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a la base de datos de Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Inicializar la tabla si no existe
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auditorias (
        id SERIAL PRIMARY KEY,
        fecha DATE DEFAULT CURRENT_DATE,
        sucursal VARCHAR(100),
        area VARCHAR(100),
        estrellas INT,
        comentario TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Base de datos conectada y tabla lista.');
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
  }
};
initDb();

// RUTA API: Guardar una auditoría
app.post('/api/auditorias', async (req, res) => {
  const { sucursal, area, estrellas, comentario } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO auditorias (sucursal, area, estrellas, comentario) VALUES ($1, $2, $3, $4) RETURNING *',
      [sucursal, area, estrellas, comentario]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar en la base de datos' });
  }
});

// RUTA API: Obtener todas las auditorías
app.get('/api/auditorias', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM auditorias ORDER BY creado_en DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer la base de datos' });
  }
});

// Asegurar que cualquier otra ruta cargue el HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor activo en el puerto ${port}`);
});
