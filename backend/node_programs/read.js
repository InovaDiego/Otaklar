const express = require('express'); 
const cors = require('cors');
const postgre = require('pg');
const Pool = postgre.Pool; //clase pool

const app = express(); // instanciar un objeto de la clase express. Esta variable "app" es el servidor.
app.use(cors()); // habilitar cross-origin en el servidor
app.use(express.json()); // habilitar lectura JSON en el servidor "app"

// receta para que la variable "postgre" sepa cómo conectarse a la base de datos
const sqlConfig = {
  host: 'localhost', // dirección para conectarse al servidor de base de datos
  port: 5432,
  database: 'Otaklar', // nombre de la base de datos
  user: 'otk_reader', // usuario con permiso de escritura a la base de datos Otaklar
  password: 'diplomado23', // contraseña del usuario admin
};

const pool = new Pool(sqlConfig); /* objeto de conexion con la base de datos*/

async function runQuery(queryText, params = []) {
  const result = await pool.query(queryText, params); 
  return result.rows; 
}

app.get('/api/users', async (req, res) => {
  try {
    const rows = await runQuery(`
      select * from usuarios; 
    `);
    res.json(rows); // regresa las fila obtenidas de la consulta SQL en formato JSON a la url: http://localhost:3000/api/art-items
  } catch (err) {
    // regresa un error si el bloque de código en try no se puede ejecutar
    console.error(err);
    res.status(500).json({ error: 'Error a consultar base de datos.', detalle: err.message });
  }
});

// hacer que el servidor escuche en el puerto 3000 y ponga ahí los resultados
const PORT = 3030; 
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
