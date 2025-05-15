const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sosdata',
  password: 'sospw',
  port: 5432,
});

// Get top 50 NBA players
app.get('/api/nba-players', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM nba_players LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// Get best projected lineup (top 9 by my_proj)
app.get('/api/best-lineup', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM nba_players
      ORDER BY my_proj DESC
      LIMIT 9
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to calculate best lineup');
  }
});

// Get best single player by projection
app.get('/api/best-player', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM nba_players
      WHERE my_proj IS NOT NULL
      ORDER BY my_proj DESC
      LIMIT 1
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch best player');
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
