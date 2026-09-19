const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `team_${req.body.team_number || 'pic'}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '1234',
  port: 5433,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar no PostgreSQL:', err.stack);
  } else {
    console.log('Conectado com sucesso ao banco PostgreSQL na porta 5433!');
    release();
  }
});

app.post('/api/teams', async (req, res) => {
  const { team_number, team_name, city_state, robot_name } = req.body;
  try {
    const query = `
      INSERT INTO teams (team_number, team_name, city_state, robot_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (team_number) DO UPDATE 
      SET team_name = $2, city_state = $3, robot_name = $4
      RETURNING *;
    `;
    const result = await pool.query(query, [team_number, team_name, city_state, robot_name]);
    res.json({ success: true, team: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teams ORDER BY team_number ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/updates', upload.single('image'), async (req, res) => {
  const { team_number, update_date, title, comment } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const query = `
      INSERT INTO team_updates (team_number, update_date, title, comment, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      team_number, 
      update_date || new Date().toISOString().split('T')[0], 
      title, 
      comment, 
      imageUrl
    ]);
    res.json({ success: true, update: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/teams/:number/updates', async (req, res) => {
  const { number } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM team_updates WHERE team_number = $1 ORDER BY update_date DESC',
      [number]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});