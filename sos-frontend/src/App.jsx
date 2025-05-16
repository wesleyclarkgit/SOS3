import React, { useState } from 'react';
import HomePage from './components/HomePage';
import FanDuelPage from './components/FanDuelPage';
import DraftKingsPage from './components/DraftKingsPage';
import LoginPage from './components/LoginPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleDraftKingsClick = () => {
    setCurrentPage('draftkings');
  };

  const handleFanDuelClick = () => {
    setCurrentPage('fanduel');
  };

  const handleLoginClick = () => {
    setCurrentPage('login');
  };

  return (
    <div className="App" style={{
      minHeight: '100vh',
      backgroundColor: '#f5f6fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '20px',
        position: 'relative',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <button 
            onClick={() => setCurrentPage('home')}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              fontSize: '32px',
              fontWeight: 'bold',
              cursor: 'pointer',
              padding: 0,
              margin: 0,
              textDecoration: 'underline',
            }}
          >
            SinkOrSim
          </button>
          <p style={{ margin: 0, fontStyle: 'italic', color: '#555' }}>Sink the Competition</p>
        </div>
        <button 
          onClick={handleLoginClick}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginLeft: '20px',
            transition: 'all 0.3s ease'
          }}
        >
          Login
        </button>
      </div>

      {/* Platform Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '40px'
      }}>
        <button 
          onClick={handleDraftKingsClick}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            cursor: 'pointer',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          DraftKings
        </button>
        <button 
          onClick={handleFanDuelClick}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            cursor: 'pointer',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          FanDuel
        </button>
      </div>

      {/* Page Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '0 20px'
      }}>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'fanduel' && <FanDuelPage />}
        {currentPage === 'draftkings' && <DraftKingsPage />}
        {currentPage === 'login' && <LoginPage />}
      </div>
    </div>
  );
}

export default App;