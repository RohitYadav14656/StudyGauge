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
      color: 'var(--color-text)'
    }}>
      <h2 style={{ fontSize: '2.5rem', color: 'var(--color-text-dark)', marginBottom: '1rem' }}>{title}</h2>
      <p style={{ fontSize: '1.25rem' }}>This feature is currently under development. Check back later!</p>
      <div style={{
        marginTop: '2rem',
        padding: '1rem 2rem',
        background: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
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
