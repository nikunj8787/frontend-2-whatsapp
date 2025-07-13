import React from 'react';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <div>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</h1>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Success!</h1>
        <p style={{ fontSize: '18px', marginBottom: '24px' }}>
          WhatsApp SaaS Frontend is Working!
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '16px 24px',
          borderRadius: '12px',
          marginTop: '20px'
        }}>
          ✅ Frontend Connected Successfully
        </div>
        <div style={{
          background: 'rgba(37, 211, 102, 0.2)',
          padding: '12px 20px',
          borderRadius: '8px',
          marginTop: '16px',
          border: '1px solid rgba(37, 211, 102, 0.3)'
        }}>
          🚀 Ready for Backend Integration
        </div>
      </div>
    </div>
  );
}

export default App;
