import React from 'react';

const Quotes: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <iframe 
        src="/quotes/index.html" 
        style={{ width: '100%', height: '100%', border: 'none' }} 
        title="Quote Generator" 
      />
    </div>
  );
};

export default Quotes;
