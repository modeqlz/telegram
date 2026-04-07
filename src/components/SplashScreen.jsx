import React, { useState, useEffect } from 'react';

export function SplashScreen({ onFinish, userName }) {
  const [phase, setPhase] = useState('hold'); // hold -> exit

  useEffect(() => {
    // Remove the pre-rendered static HTML splash screen if it exists
    const initialSplash = document.getElementById('initial-splash');
    if (initialSplash) {
      initialSplash.remove();
    }

    const exitTimer = setTimeout(() => setPhase('exit'), 2300);
    const doneTimer = setTimeout(() => onFinish(), 2900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash-screen ${phase}`}>
      <div className="splash-content">
        <div className="splash-logo">DVK</div>
        <div className="splash-shop">Shop</div>
        <div className="splash-line"></div>
        {userName && (
          <div className="splash-greeting">
            Добро пожаловать{userName ? `, ${userName}` : ''}
          </div>
        )}
      </div>
      <div className="splash-footer">Premium Fashion Store</div>
    </div>
  );
}
