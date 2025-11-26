const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// Use env var when provided; fall back to the public DB endpoint shared by the user.
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

async function runQuery(queryText, params = []) {
  const result = await pool.query(queryText, params);
  return result.rows;
}


const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ||
  "https://otaklar-frontend-tt6ru.ondigitalocean.app";
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));

app.set('trust proxy', 1);
app.use(express.json());
app.use(
  session({
    secret: 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 1000 * 60 * 60,
    },
  }),
);

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  req.user = { id: req.session.userId, email: req.session.email };
  next();
}

app.get('/api/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json({
    id: req.session.userId,
    email: req.session.email,
    nombre: req.session.nombre,
  });
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const rows = await runQuery(
      `SELECT id, nombre, email, contrasena, esta_activo
       FROM usuarios
       WHERE email = $1`,
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no existe' });
    }

    const user = rows[0];

    if (!user.esta_activo) {
      return res.status(401).json({ success: false, message: 'Usuario inactivo' });
    }

    if (user.contrasena !== password) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.nombre = user.nombre;

    res.json({
      success: true,
      user: { id: user.id, email: user.email, nombre: user.nombre },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error en login', detalle: err.message });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.post('/api/register', async (req, res) => {
  try {
    const { nombre, email, password, role } = req.body;
    if (!nombre || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }

    const existing = await runQuery('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'El correo ya está registrado' });
    }

    const rows = await runQuery(
      `INSERT INTO usuarios (nombre, email, contrasena, rol, esta_activo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, email, rol, esta_activo`,
      [nombre, email, password, role, true],
    );

    res.status(201).json({ success: true, user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al registrar usuario', detalle: err.message });
  }
});

app.get('/api/documents', requireAuth, async (req, res) => {
  try {
    const rows = await runQuery(
      `SELECT id, title, created_at, updated_at
       FROM documentos
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.user.id],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener documentos', detalle: err.message });
  }
});

app.get('/api/documents/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await runQuery(
      `SELECT id, user_id, title,
              content_a AS "contentA",
              content_b AS "contentB",
              created_at, updated_at
       FROM documentos
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener documento', detalle: err.message });
  }
});

app.post('/api/documents', requireAuth, async (req, res) => {
  try {
    const { title, contentA, contentB } = req.body;
    const rows = await runQuery(
      `INSERT INTO documentos (user_id, title, content_a, content_b)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, title,
                 content_a AS "contentA",
                 content_b AS "contentB",
                 created_at, updated_at`,
      [req.user.id, title, contentA, contentB],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear documento', detalle: err.message });
  }
});

app.put('/api/documents/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, contentA, contentB } = req.body;

    const rows = await runQuery(
      `UPDATE documentos
       SET title = $1,
           content_a = $2,
           content_b = $3,
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, title,
                 content_a AS "contentA",
                 content_b AS "contentB",
                 created_at, updated_at`,
      [title, contentA, contentB, id, req.user.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar documento', detalle: err.message });
  }
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
