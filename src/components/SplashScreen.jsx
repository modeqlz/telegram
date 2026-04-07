import React, { useState, useEffect } from 'react';

export function SplashScreen({ onFinish, userName }) {
  const [phase, setPhase] = useState('enter'); // enter -> hold -> exit

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 100);
    const exitTimer = setTimeout(() => setPhase('exit'), 2200);
    const doneTimer = setTimeout(() => onFinish(), 2800);

    return () => {
      clearTimeout(holdTimer);
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
