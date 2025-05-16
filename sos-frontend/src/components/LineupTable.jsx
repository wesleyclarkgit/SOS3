import React, { useState } from 'react';

const LineupTable = ({ lineups, onDelete, onExport }) => {
  const [lockedIndexes, setLockedIndexes] = useState(new Set());

  const toggleLock = (index) => {
    const updated = new Set(lockedIndexes);
    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }
    setLockedIndexes(updated);
  };

  const handleExport = (lineup, index) => {
    const csvRows = [
      ['Role', 'Name', 'Salary', 'Projection'],
      ['MVP', lineup.mvp.name, lineup.mvp.salary, lineup.mvp.my_proj],
      ...lineup.utils.map(p => ['UTIL', p.name, p.salary, p.my_proj]),
      [],
      ['Total Salary', lineup.total_salary],
      ['Projected Score', lineup.projected_score.toFixed(2)]
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `lineup_${index + 1}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      {lineups.map((lineup, index) => {
        const isLocked = lockedIndexes.has(index);
        return (
          <div
            key={index}
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: isLocked ? '#e9f7ef' : '#f9f9f9'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Lineup {index + 1}</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleExport(lineup, index)}>📤</button>
                <button
                  onClick={() => !isLocked && onDelete(index)}
                  disabled={isLocked}
                  style={{ opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                >
                  🗑️
                </button>
                <button onClick={() => toggleLock(index)} title={isLocked ? 'Unlock' : 'Lock'}>
                  {isLocked ? '🔒' : '🔓'}
                </button>
              </div>
            </div>

            <table cellPadding="6" style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Name</th>
                  <th>Salary</th>
                  <th>Projection</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>MVP</strong></td>
                  <td>{lineup.mvp.name}</td>
                  <td>${lineup.mvp.salary.toLocaleString()}</td>
                  <td>{lineup.mvp.my_proj}</td>
                </tr>
                {lineup.utils.map((p) => (
                  <tr key={p.dfs_id}>
                    <td>UTIL</td>
                    <td>{p.name}</td>
                    <td>${p.salary.toLocaleString()}</td>
                    <td>{p.my_proj}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p style={{ marginTop: '10px' }}>
              <strong>Total Salary:</strong> ${lineup.total_salary.toLocaleString()}<br />
              <strong>Projected Score:</strong> {lineup.projected_score.toFixed(2)}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default LineupTable;