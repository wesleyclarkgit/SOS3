import React, { useEffect, useState } from 'react';
import LineupTable from './LineupTable';

const FanDuelPage = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('my_proj');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchName, setSearchName] = useState('');
  const [lockedMVP, setLockedMVP] = useState(null);
  const [lockedUTILs, setLockedUTILs] = useState([]);
  const [numLineups, setNumLineups] = useState(1);
  const [fieldSize, setFieldSize] = useState(100);
  const [lineups, setLineups] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5001/api/fanduel-players')
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data.slice(0, 50));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching players:', err);
        setError('Unable to load player data.');
        setLoading(false);
      });
  }, []);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const getSortValue = (player, key) => {
    if (key === 'pointsPerSalary') {
      return player.salary > 0 ? player.my_proj / player.salary : 0;
    }
    return player[key];
  };

  const filteredAndSortedPlayers = players
    .filter((p) =>
      (positionFilter === 'ALL' || p.pos === positionFilter) &&
      p.name.toLowerCase().includes(searchName.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = getSortValue(a, sortBy);
      const bVal = getSortValue(b, sortBy);

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      const aNum = Number(aVal);
      const bNum = Number(bVal);

      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });

  const lockAsMVP = (player) => {
    if (lockedMVP?.dfs_id === player.dfs_id) {
      setLockedMVP(null);
    } else if (lockedMVP) {
      alert('Only one MVP can be locked.');
    } else {
      setLockedMVP(player);
    }
  };

  const lockAsUTIL = (player) => {
    if (lockedUTILs.find(p => p.dfs_id === player.dfs_id)) {
      setLockedUTILs(lockedUTILs.filter(p => p.dfs_id !== player.dfs_id));
    } else if (lockedUTILs.length >= 5) {
      alert('You can only lock up to 5 UTIL players.');
    } else {
      setLockedUTILs([...lockedUTILs, player]);
    }
  };

  const clearLocked = () => {
    setLockedMVP(null);
    setLockedUTILs([]);
  };

  const lockedSalary = (
    (lockedMVP ? lockedMVP.salary * 1.5 : 0) +
    lockedUTILs.reduce((sum, p) => sum + p.salary, 0)
  );

  const isOverCap = lockedSalary > 60000;

  const handleBuildLineups = async () => {
    if (isOverCap) return;

    try {
      const res = await fetch('http://localhost:5001/api/fanduel-build-lineups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numLineups,
          fieldSize,
          lockedMVP,
          lockedUTILs
        })
      });

      if (!res.ok) throw new Error('Failed to build lineups');
      const data = await res.json();
      setLineups(data.lineups);
    } catch (err) {
      console.error(err);
      alert('Failed to build lineups.');
    }
  };

  const handleDeleteLineup = (index) => {
    setLineups(lineups.filter((_, i) => i !== index));
  };

  const handleExportLineup = (lineup) => {
    const content = JSON.stringify(lineup, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lineup-${Date.now()}.json`;
    link.click();
  };

  if (loading) return <p>Loading player data...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>FanDuel Player Pool</h2>
      <p>Explore the top 50 available players for today's slate.</p>

      <div style={{ margin: '20px 0', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <label>
          Filter by Position:
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            style={{ marginLeft: '10px' }}
          >
            <option value="ALL">All</option>
            <option value="PG">PG</option>
            <option value="SG">SG</option>
            <option value="SF">SF</option>
            <option value="PF">PF</option>
            <option value="C">C</option>
          </select>
        </label>

        <label>
          Sort by:
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            style={{ marginLeft: '10px' }}
          >
            <option value="name">Name</option>
            <option value="pos">Position</option>
            <option value="team">Team</option>
            <option value="opp">Opponent</option>
            <option value="salary">Salary</option>
            <option value="my_proj">Projection</option>
            <option value="pointsPerSalary">Points/Salary</option>
          </select>
        </label>

        <input
          type="text"
          placeholder="Search by name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{
            padding: '8px',
            width: '200px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
      </div>

      {/* Player Table */}
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f0f0f0' }}>
          <tr>
            <th onClick={() => handleSort('name')}>Name</th>
            <th onClick={() => handleSort('pos')}>Position</th>
            <th onClick={() => handleSort('team')}>Team</th>
            <th onClick={() => handleSort('opp')}>Opponent</th>
            <th onClick={() => handleSort('salary')}>Salary</th>
            <th onClick={() => handleSort('my_proj')}>Projection</th>
            <th onClick={() => handleSort('pointsPerSalary')}>Points/Salary</th>
            <th>Lock</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedPlayers.map((p) => (
            <tr key={p.dfs_id}>
              <td>{p.name}</td>
              <td>{p.pos}</td>
              <td>{p.team}</td>
              <td>{p.opp}</td>
              <td>${p.salary.toLocaleString()}</td>
              <td>{p.my_proj}</td>
              <td>{p.salary > 0 ? (p.my_proj / p.salary).toFixed(4) : 'N/A'}</td>
              <td>
                <button onClick={() => lockAsMVP(p)}>{lockedMVP?.dfs_id === p.dfs_id ? '✓ MVP' : 'MVP'}</button>
                <button onClick={() => lockAsUTIL(p)}>{lockedUTILs.some(u => u.dfs_id === p.dfs_id) ? '✓ UTIL' : 'UTIL'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Controls */}
      <div style={{ marginTop: '20px' }}>
        <label>
          Number of Lineups:
          <input
            type="number"
            value={numLineups}
            onChange={(e) => setNumLineups(Number(e.target.value))}
            style={{ marginLeft: '10px', width: '60px' }}
          />
        </label>

        <label style={{ marginLeft: '20px' }}>
          Field Size:
          <input
            type="number"
            value={fieldSize}
            onChange={(e) => setFieldSize(Number(e.target.value))}
            style={{ marginLeft: '10px', width: '80px' }}
          />
        </label>

        <button onClick={handleBuildLineups} disabled={isOverCap} style={{ marginLeft: '20px' }}>
          Build Lineups
        </button>

        <button onClick={clearLocked} style={{ marginLeft: '10px', color: 'red' }}>
          Clear Locked
        </button>
      </div>

      {/* Lineups Table */}
      <div style={{ marginTop: '30px' }}>
        {lineups.length > 0 && (
          <LineupTable
            lineups={lineups}
            onDelete={handleDeleteLineup}
            onExport={handleExportLineup}
          />
        )}
      </div>
    </div>
  );
};

export default FanDuelPage;