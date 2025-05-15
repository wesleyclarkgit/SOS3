const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sosdata',
  password: '', // or 'sospw' if you're using the `sosapp` user
  port: 5432,
});

app.get('/api/nba-players', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM nba_players LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
