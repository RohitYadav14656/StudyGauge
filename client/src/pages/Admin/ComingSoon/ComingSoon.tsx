import React from 'react';

const ComingSoon: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      textAlign: 'center',
      color: '#94a3b8'
    }}>
      <h2 style={{ fontSize: '2.5rem', color: '#f1f5f9', marginBottom: '1rem' }}>{title}</h2>
      <p style={{ fontSize: '1.25rem' }}>This feature is currently under development. Check back later!</p>
      <div style={{
        marginTop: '2rem',
        padding: '1rem 2rem',
        background: 'rgba(56, 189, 248, 0.1)',
        color: 'var(--color-accent)',
        borderRadius: '9999px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        Coming Soon
      </div>
    </div>
  );
};

export default ComingSoon;
