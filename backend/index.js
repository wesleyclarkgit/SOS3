const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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

// Get top 50 players for FanDuel
app.get('/api/fanduel-players', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM nba_players
      ORDER BY my_proj DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch FanDuel players');
  }
});

// Get best FanDuel Showdown lineup
app.get('/api/fanduel-best-lineup', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM nba_players
      WHERE my_proj IS NOT NULL
      ORDER BY my_proj DESC
      LIMIT 30
    `);

    const players = result.rows;
    let bestLineup = null;
    let bestScore = -Infinity;

    for (let i = 0; i < players.length; i++) {
      const mvp = players[i];
      const remaining = players.filter((p, idx) => idx !== i);

      const combinations = getCombinations(remaining, 5);
      for (const utils of combinations) {
        const salary = mvp.salary * 1.5 + utils.reduce((sum, p) => sum + p.salary, 0);
        if (salary > 60000) continue;

        const score = mvp.my_proj * 1.5 + utils.reduce((sum, p) => sum + p.my_proj, 0);
        if (score > bestScore) {
          bestScore = score;
          bestLineup = { mvp, utils, total_salary: salary, total_score: score };
        }
      }
    }

    if (bestLineup) {
      res.json(bestLineup);
    } else {
      res.status(404).send('No valid lineup found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to compute best lineup');
  }
});

// Build multiple FanDuel lineups
app.post('/api/fanduel-build-lineups', async (req, res) => {
  const { numLineups, fieldSize, lockedMVP, lockedUTILs } = req.body;

  try {
    const result = await pool.query(`
      SELECT * FROM nba_players
      WHERE my_proj IS NOT NULL
      ORDER BY my_proj DESC
      LIMIT 50
    `);

    const players = result.rows;
    const lineups = [];
    const maxTries = 1000;
    let tries = 0;

    const lockedUtilIds = new Set((lockedUTILs || []).map(p => p.dfs_id));
    const lockedMvpId = lockedMVP?.dfs_id;

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    while (lineups.length < numLineups && tries < maxTries) {
      tries++;

      const mvp = lockedMVP || pickRandom(players);
      if (!mvp || !mvp.dfs_id || !mvp.salary || !mvp.my_proj || !mvp.team) continue;

      const utils = [...(lockedUTILs || [])];
      const usedIds = new Set(utils.map(p => p.dfs_id));
      usedIds.add(mvp.dfs_id);

      const availableUtils = players.filter(p => (
        p && p.dfs_id && !usedIds.has(p.dfs_id)
      ));

      while (utils.length < 5 && availableUtils.length > 0) {
        const idx = Math.floor(Math.random() * availableUtils.length);
        const candidate = availableUtils.splice(idx, 1)[0];
        if (!candidate || !candidate.dfs_id || !candidate.salary || !candidate.my_proj || !candidate.team) continue;
        utils.push(candidate);
      }

      if (utils.length !== 5) continue;

      const allPlayers = [mvp, ...utils];
      const teamCounts = {};
      for (const player of allPlayers) {
        if (!player.team) continue;
        teamCounts[player.team] = (teamCounts[player.team] || 0) + 1;
      }

      const tooManyFromTeam = Object.values(teamCounts).some(count => count > 5);
      if (tooManyFromTeam) continue;

      const totalSalary = mvp.salary * 1.5 + utils.reduce((s, p) => s + p.salary, 0);
      if (totalSalary > 60000) continue;

      const projectedScore = mvp.my_proj * 1.5 + utils.reduce((s, p) => s + p.my_proj, 0);

      // Lineup uniqueness check
      const candidateIds = [mvp.dfs_id.toString(), ...utils.map(p => p.dfs_id.toString())].sort().join(',');
      const existsAlready = lineups.some(l => {
        const existingIds = [l.mvp.dfs_id.toString(), ...l.utils.map(p => p.dfs_id.toString())].sort().join(',');
        return existingIds === candidateIds;
      });
      if (existsAlready) continue;

      lineups.push({
        mvp,
        utils,
        total_salary: totalSalary,
        projected_score: projectedScore
      });
    }

    res.json({ lineups });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to build lineups');
  }
});

// Helper for brute-force optimizer
function getCombinations(arr, k) {
  const results = [];
  function helper(start, combo) {
    if (combo.length === k) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return results;
}

// Best 9 players overall
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

// Best single player
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